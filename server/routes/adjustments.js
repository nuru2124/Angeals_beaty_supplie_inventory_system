import express from 'express';
import { queryAll, queryOne, run, runTransaction, logAudit } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { branch_id, status } = req.query;
  let sql = `
    SELECT sa.*,
           p.name as product_name, p.sku, p.barcode,
           b.name as branch_name, b.code as branch_code,
           req_u.name as requested_by_name,
           app_u.name as approved_by_name
    FROM stock_adjustments sa
    JOIN products p ON sa.product_id = p.id
    JOIN branches b ON sa.branch_id = b.id
    JOIN users req_u ON sa.requested_by = req_u.id
    LEFT JOIN users app_u ON sa.approved_by = app_u.id
    WHERE 1=1
  `;
  const params = [];
  if (branch_id) {
    sql += ` AND sa.branch_id = ?`;
    params.push(branch_id);
  }
  if (status) {
    sql += ` AND sa.status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY sa.created_at DESC`;
  res.json(queryAll(sql, params));
});

router.post('/', (req, res) => {
  const { branch_id, product_id, type, quantity, reason, requested_by = 1, notes } = req.body;
  if (!branch_id || !product_id || !type || !quantity || !reason) {
    return res.status(400).json({ error: 'Branch, product, adjustment type, quantity, and reason are required' });
  }

  try {
    const adjNum = `ADJ-${Date.now().toString().slice(-6)}`;
    const result = run(
      `INSERT INTO stock_adjustments (adjustment_number, branch_id, product_id, type, quantity, reason, status, requested_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [adjNum, branch_id, product_id, type, parseInt(quantity, 10), reason, requested_by, notes || null]
    );

    res.status(201).json({ id: Number(result.lastInsertRowid), adjustment_number: adjNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/approve', (req, res) => {
  const adjId = parseInt(req.params.id, 10);
  const { approved_by = 1 } = req.body;

  try {
    runTransaction(() => {
      const adj = queryOne(`SELECT * FROM stock_adjustments WHERE id = ?`, [adjId]);
      if (!adj) throw new Error('Adjustment request not found');
      if (adj.status !== 'pending') throw new Error(`Cannot approve adjustment in status "${adj.status}"`);

      const inv = queryOne(
        `SELECT quantity FROM inventory WHERE product_id = ? AND branch_id = ?`,
        [adj.product_id, adj.branch_id]
      );

      const prevQty = inv ? inv.quantity : 0;
      let newQty = prevQty;
      let delta = adj.quantity;

      if (adj.type === 'decrease') {
        if (prevQty < adj.quantity) {
          throw new Error(`Cannot decrease by ${adj.quantity}: current branch stock is only ${prevQty}`);
        }
        newQty = prevQty - adj.quantity;
        delta = -adj.quantity;
      } else {
        newQty = prevQty + adj.quantity;
      }

      run(
        `UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ? AND branch_id = ?`,
        [newQty, adj.product_id, adj.branch_id]
      );

      run(
        `INSERT INTO inventory_movements (product_id, branch_id, movement_type, quantity, previous_quantity, new_quantity, reference_type, reference_id, user_id, reason)
         VALUES (?, ?, 'adjustment', ?, ?, ?, 'adjustment', ?, ?, ?)`,
        [adj.product_id, adj.branch_id, delta, prevQty, newQty, adj.adjustment_number, approved_by, `Adjustment: ${adj.reason} - ${adj.notes || ''}`]
      );

      run(
        `UPDATE stock_adjustments SET status = 'approved', approved_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [approved_by, adjId]
      );
    });

    res.json({ success: true, message: 'Stock adjustment approved and applied to inventory' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
