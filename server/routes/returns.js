import express from 'express';
import { queryAll, queryOne, run, runTransaction, logAudit } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { branch_id } = req.query;
  let sql = `
    SELECT r.*,
           s.invoice_number,
           b.name as branch_name,
           u.name as processed_by_name,
           (SELECT COUNT(*) FROM return_items ri WHERE ri.return_id = r.id) as item_count
    FROM returns r
    JOIN sales s ON r.sale_id = s.id
    JOIN branches b ON r.branch_id = b.id
    JOIN users u ON r.processed_by = u.id
    WHERE 1=1
  `;
  const params = [];
  if (branch_id) {
    sql += ` AND r.branch_id = ?`;
    params.push(branch_id);
  }
  sql += ` ORDER BY r.created_at DESC`;
  res.json(queryAll(sql, params));
});

router.post('/', (req, res) => {
  const { sale_id, branch_id, processed_by = 1, reason, notes, items } = req.body;
  if (!sale_id || !branch_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Sale ID, branch, and returned items are required' });
  }

  try {
    const returnNumber = `RET-${Date.now().toString().slice(-6)}`;
    let totalRefund = 0;

    for (const it of items) {
      totalRefund += parseFloat(it.refund_amount);
    }

    const newId = runTransaction(() => {
      const retRes = run(
        `INSERT INTO returns (return_number, sale_id, branch_id, processed_by, total_refund, reason, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')`,
        [returnNumber, sale_id, branch_id, processed_by, totalRefund, reason || 'other', notes || null]
      );
      const retId = Number(retRes.lastInsertRowid);

      for (const it of items) {
        const restock = it.restock_inventory ? 1 : 0;
        run(
          `INSERT INTO return_items (return_id, sale_item_id, product_id, quantity, refund_amount, restock_inventory, condition)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [retId, it.sale_item_id, it.product_id, parseInt(it.quantity, 10), parseFloat(it.refund_amount), restock, it.condition || 'resellable']
        );

        if (restock) {
          // Add back to inventory
          const inv = queryOne(`SELECT quantity FROM inventory WHERE product_id = ? AND branch_id = ?`, [it.product_id, branch_id]);
          const prevQty = inv ? inv.quantity : 0;
          const newQty = prevQty + parseInt(it.quantity, 10);

          run(
            `UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ? AND branch_id = ?`,
            [newQty, it.product_id, branch_id]
          );

          run(
            `INSERT INTO inventory_movements (product_id, branch_id, movement_type, quantity, previous_quantity, new_quantity, reference_type, reference_id, user_id, reason)
             VALUES (?, ?, 'return', ?, ?, ?, 'return', ?, ?, 'Customer sale return restock')`,
            [it.product_id, branch_id, parseInt(it.quantity, 10), prevQty, newQty, returnNumber, processed_by]
          );
        }
      }

      return retId;
    });

    res.status(201).json({ id: newId, return_number: returnNumber, total_refund: totalRefund });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
