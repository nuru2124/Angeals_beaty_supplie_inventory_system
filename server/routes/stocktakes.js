import express from 'express';
import { queryAll, queryOne, run, runTransaction, logAudit } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { branch_id } = req.query;
  let sql = `
    SELECT sc.*,
           b.name as branch_name, b.code as branch_code,
           u.name as counted_by_name,
           r.name as reconciled_by_name,
           (SELECT COUNT(*) FROM stock_count_items sci WHERE sci.count_id = sc.id) as item_count
    FROM stock_counts sc
    JOIN branches b ON sc.branch_id = b.id
    JOIN users u ON sc.counted_by = u.id
    LEFT JOIN users r ON sc.reconciled_by = r.id
    WHERE 1=1
  `;
  const params = [];
  if (branch_id) {
    sql += ` AND sc.branch_id = ?`;
    params.push(branch_id);
  }
  sql += ` ORDER BY sc.started_at DESC`;
  res.json(queryAll(sql, params));
});

router.get('/:id', (req, res) => {
  const countId = parseInt(req.params.id, 10);
  const stockCount = queryOne(`
    SELECT sc.*,
           b.name as branch_name, b.code as branch_code,
           u.name as counted_by_name,
           r.name as reconciled_by_name
    FROM stock_counts sc
    JOIN branches b ON sc.branch_id = b.id
    JOIN users u ON sc.counted_by = u.id
    LEFT JOIN users r ON sc.reconciled_by = r.id
    WHERE sc.id = ?
  `, [countId]);

  if (!stockCount) return res.status(404).json({ error: 'Stock count not found' });

  const items = queryAll(`
    SELECT sci.*,
           p.name as product_name, p.sku, p.barcode
    FROM stock_count_items sci
    JOIN products p ON sci.product_id = p.id
    WHERE sci.count_id = ?
  `, [countId]);

  res.json({ ...stockCount, items });
});

router.post('/', (req, res) => {
  const { branch_id, counted_by = 1, notes, items } = req.body;
  if (!branch_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Branch and counted items are required' });
  }

  try {
    const countNumber = `STK-${Date.now().toString().slice(-6)}`;
    let totalVarUnits = 0;
    let totalVarValue = 0;

    const newId = runTransaction(() => {
      const resCount = run(
        `INSERT INTO stock_counts (count_number, branch_id, status, counted_by, notes, started_at)
         VALUES (?, ?, 'completed', ?, ?, CURRENT_TIMESTAMP)`,
        [countNumber, branch_id, counted_by, notes || null]
      );
      const countId = Number(resCount.lastInsertRowid);

      for (const item of items) {
        const sysQty = parseInt(item.system_quantity, 10);
        const physQty = parseInt(item.physical_quantity, 10);
        const variance = physQty - sysQty;
        const unitCost = parseFloat(item.unit_cost || 0);
        const varValue = variance * unitCost;

        totalVarUnits += Math.abs(variance);
        totalVarValue += Math.abs(varValue);

        run(
          `INSERT INTO stock_count_items (count_id, product_id, system_quantity, physical_quantity, variance, unit_cost, variance_value, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [countId, item.product_id, sysQty, physQty, variance, unitCost, varValue, item.notes || null]
        );
      }

      run(
        `UPDATE stock_counts
         SET total_variance_units = ?, total_variance_value = ?, completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [totalVarUnits, totalVarValue, countId]
      );

      return countId;
    });

    res.status(201).json({ id: newId, count_number: countNumber, total_variance_units: totalVarUnits, total_variance_value: totalVarValue });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/stocktakes/:id/reconcile
 * Manager approval to synchronize system stock to physical count
 */
router.post('/:id/reconcile', (req, res) => {
  const countId = parseInt(req.params.id, 10);
  const { reconciled_by = 1 } = req.body;

  try {
    runTransaction(() => {
      const sc = queryOne(`SELECT * FROM stock_counts WHERE id = ?`, [countId]);
      if (!sc) throw new Error('Stock count not found');
      if (sc.status === 'reconciled') throw new Error('Already reconciled');

      const items = queryAll(`SELECT * FROM stock_count_items WHERE count_id = ?`, [countId]);

      for (const it of items) {
        if (it.variance !== 0) {
          run(
            `UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ? AND branch_id = ?`,
            [it.physical_quantity, it.product_id, sc.branch_id]
          );

          run(
            `INSERT INTO inventory_movements (product_id, branch_id, movement_type, quantity, previous_quantity, new_quantity, reference_type, reference_id, user_id, reason)
             VALUES (?, ?, 'stocktake_correction', ?, ?, ?, 'stocktake', ?, ?, 'Reconciliation of physical stocktake count')`,
            [it.product_id, sc.branch_id, it.variance, it.system_quantity, it.physical_quantity, sc.count_number, reconciled_by]
          );
        }
      }

      run(
        `UPDATE stock_counts SET status = 'reconciled', reconciled_by = ? WHERE id = ?`,
        [reconciled_by, countId]
      );
    });

    res.json({ success: true, message: 'Stocktake reconciled and system inventory synchronized' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
