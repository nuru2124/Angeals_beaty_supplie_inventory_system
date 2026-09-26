import express from 'express';
import { queryAll, queryOne, run, runTransaction, logAudit, createNotification } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/transfers
 */
router.get('/', (req, res) => {
  const { branch_id, direction, status } = req.query;

  let sql = `
    SELECT st.*,
           sb.name as source_branch_name, sb.code as source_branch_code,
           db.name as destination_branch_name, db.code as destination_branch_code,
           req_u.name as requested_by_name,
           app_u.name as approved_by_name,
           rec_u.name as received_by_name,
           (SELECT COUNT(*) FROM stock_transfer_items sti WHERE sti.transfer_id = st.id) as item_count,
           (SELECT SUM(sti.quantity_requested) FROM stock_transfer_items sti WHERE sti.transfer_id = st.id) as total_units
    FROM stock_transfers st
    JOIN branches sb ON st.source_branch_id = sb.id
    JOIN branches db ON st.destination_branch_id = db.id
    JOIN users req_u ON st.requested_by = req_u.id
    LEFT JOIN users app_u ON st.approved_by = app_u.id
    LEFT JOIN users rec_u ON st.received_by = rec_u.id
    WHERE 1=1
  `;

  const params = [];

  if (branch_id) {
    if (direction === 'incoming') {
      sql += ` AND st.destination_branch_id = ?`;
      params.push(branch_id);
    } else if (direction === 'outgoing') {
      sql += ` AND st.source_branch_id = ?`;
      params.push(branch_id);
    } else {
      sql += ` AND (st.source_branch_id = ? OR st.destination_branch_id = ?)`;
      params.push(branch_id, branch_id);
    }
  }

  if (status) {
    sql += ` AND st.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY st.created_at DESC`;

  const transfers = queryAll(sql, params);
  res.json(transfers);
});

/**
 * GET /api/transfers/:id
 */
router.get('/:id', (req, res) => {
  const trfId = parseInt(req.params.id, 10);
  const transfer = queryOne(`
    SELECT st.*,
           sb.name as source_branch_name, sb.code as source_branch_code, sb.address as source_address,
           db.name as destination_branch_name, db.code as destination_branch_code, db.address as destination_address,
           req_u.name as requested_by_name,
           app_u.name as approved_by_name,
           rec_u.name as received_by_name
    FROM stock_transfers st
    JOIN branches sb ON st.source_branch_id = sb.id
    JOIN branches db ON st.destination_branch_id = db.id
    JOIN users req_u ON st.requested_by = req_u.id
    LEFT JOIN users app_u ON st.approved_by = app_u.id
    LEFT JOIN users rec_u ON st.received_by = rec_u.id
    WHERE st.id = ?
  `, [trfId]);

  if (!transfer) {
    return res.status(404).json({ error: 'Transfer not found' });
  }

  const items = queryAll(`
    SELECT sti.*,
           p.name as product_name, p.sku, p.barcode, p.unit,
           COALESCE(i.quantity, 0) as source_available_stock
    FROM stock_transfer_items sti
    JOIN products p ON sti.product_id = p.id
    LEFT JOIN inventory i ON i.product_id = p.id AND i.branch_id = ?
    WHERE sti.transfer_id = ?
  `, [transfer.source_branch_id, trfId]);

  res.json({
    ...transfer,
    items
  });
});

/**
 * POST /api/transfers
 * Create transfer request
 */
router.post('/', (req, res) => {
  const { source_branch_id, destination_branch_id, requested_by = 1, notes, items } = req.body;

  if (!source_branch_id || !destination_branch_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Source, destination, and items are required' });
  }

  if (Number(source_branch_id) === Number(destination_branch_id)) {
    return res.status(400).json({ error: 'Source and destination branches cannot be the same' });
  }

  try {
    const trfNumber = `TRF-${Date.now().toString().slice(-6)}`;

    const newId = runTransaction(() => {
      const trfRes = run(
        `INSERT INTO stock_transfers (
          transfer_number, source_branch_id, destination_branch_id, status,
          requested_by, notes, created_at
        ) VALUES (?, ?, ?, 'pending_approval', ?, ?, CURRENT_TIMESTAMP)`,
        [trfNumber, source_branch_id, destination_branch_id, requested_by, notes || null]
      );

      const id = Number(trfRes.lastInsertRowid);

      for (const item of items) {
        const prod = queryOne(`SELECT cost_price FROM products WHERE id = ?`, [item.product_id]);
        run(
          `INSERT INTO stock_transfer_items (
            transfer_id, product_id, quantity_requested, unit_cost
          ) VALUES (?, ?, ?, ?)`,
          [id, item.product_id, parseInt(item.quantity, 10), prod ? prod.cost_price : 0]
        );
      }

      createNotification({
        title: 'New Stock Transfer Request',
        message: `Transfer ${trfNumber} requires approval.`,
        type: 'transfer',
        linkUrl: '/transfers'
      });

      return id;
    });

    res.status(201).json({ id: newId, transfer_number: trfNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/transfers/:id/approve
 * Central HQ approves transfer -> Reserves stock in source branch
 */
router.post('/:id/approve', (req, res) => {
  const trfId = parseInt(req.params.id, 10);
  const { approved_by = 1 } = req.body;

  try {
    runTransaction(() => {
      const trf = queryOne(`SELECT * FROM stock_transfers WHERE id = ?`, [trfId]);
      if (!trf) throw new Error('Transfer not found');
      if (trf.status !== 'pending_approval') throw new Error(`Cannot approve transfer in status "${trf.status}"`);

      const items = queryAll(`SELECT * FROM stock_transfer_items WHERE transfer_id = ?`, [trfId]);

      // Check and reserve stock in source branch
      for (const item of items) {
        const inv = queryOne(
          `SELECT quantity, reserved_quantity FROM inventory WHERE product_id = ? AND branch_id = ?`,
          [item.product_id, trf.source_branch_id]
        );

        if (!inv || (inv.quantity - inv.reserved_quantity) < item.quantity_requested) {
          throw new Error(`Insufficient available stock at source branch for product ID ${item.product_id}`);
        }

        run(
          `UPDATE inventory
           SET reserved_quantity = reserved_quantity + ?
           WHERE product_id = ? AND branch_id = ?`,
          [item.quantity_requested, item.product_id, trf.source_branch_id]
        );
      }

      run(
        `UPDATE stock_transfers
         SET status = 'approved', approved_by = ?
         WHERE id = ?`,
        [approved_by, trfId]
      );
    });

    res.json({ success: true, message: 'Transfer approved and stock reserved' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/transfers/:id/dispatch
 * Source branch dispatches items -> status becomes 'in_transit'
 */
router.post('/:id/dispatch', (req, res) => {
  const trfId = parseInt(req.params.id, 10);

  try {
    runTransaction(() => {
      const trf = queryOne(`SELECT * FROM stock_transfers WHERE id = ?`, [trfId]);
      if (!trf) throw new Error('Transfer not found');
      if (trf.status !== 'approved') throw new Error(`Cannot dispatch transfer in status "${trf.status}"`);

      const items = queryAll(`SELECT * FROM stock_transfer_items WHERE transfer_id = ?`, [trfId]);

      for (const item of items) {
        const currentInv = queryOne(
          `SELECT quantity, reserved_quantity FROM inventory WHERE product_id = ? AND branch_id = ?`,
          [item.product_id, trf.source_branch_id]
        );

        const newQty = currentInv.quantity - item.quantity_requested;
        const newReserved = Math.max(0, currentInv.reserved_quantity - item.quantity_requested);

        run(
          `UPDATE inventory
           SET quantity = ?, reserved_quantity = ?, last_updated = CURRENT_TIMESTAMP
           WHERE product_id = ? AND branch_id = ?`,
          [newQty, newReserved, item.product_id, trf.source_branch_id]
        );

        // FEFO batch deduction from source
        let deductRemaining = item.quantity_requested;
        const batches = queryAll(
          `SELECT id, quantity FROM inventory_batches
           WHERE product_id = ? AND branch_id = ? AND quantity > 0
           ORDER BY expiry_date ASC`,
          [item.product_id, trf.source_branch_id]
        );

        for (const b of batches) {
          if (deductRemaining <= 0) break;
          const d = Math.min(b.quantity, deductRemaining);
          run(`UPDATE inventory_batches SET quantity = quantity - ? WHERE id = ?`, [d, b.id]);
          deductRemaining -= d;
        }

        run(
          `UPDATE stock_transfer_items SET quantity_sent = ? WHERE id = ?`,
          [item.quantity_requested, item.id]
        );

        // Movement record
        run(
          `INSERT INTO inventory_movements (
            product_id, branch_id, movement_type, quantity, previous_quantity, new_quantity,
            reference_type, reference_id, reason
          ) VALUES (?, ?, 'transfer_out', ?, ?, ?, 'transfer', ?, 'Inter-branch transfer dispatch')`,
          [item.product_id, trf.source_branch_id, -item.quantity_requested, currentInv.quantity, newQty, trf.transfer_number]
        );
      }

      run(
        `UPDATE stock_transfers
         SET status = 'in_transit', transfer_date = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [trfId]
      );
    });

    res.json({ success: true, message: 'Transfer dispatched and is now in transit' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/transfers/:id/receive
 * Destination branch receives goods -> stock added to destination inventory & batch created
 */
router.post('/:id/receive', (req, res) => {
  const trfId = parseInt(req.params.id, 10);
  const { received_by = 1 } = req.body;

  try {
    runTransaction(() => {
      const trf = queryOne(`SELECT * FROM stock_transfers WHERE id = ?`, [trfId]);
      if (!trf) throw new Error('Transfer not found');
      if (trf.status !== 'in_transit') throw new Error(`Cannot receive transfer in status "${trf.status}"`);

      const items = queryAll(`SELECT * FROM stock_transfer_items WHERE transfer_id = ?`, [trfId]);

      for (const item of items) {
        const destInv = queryOne(
          `SELECT quantity FROM inventory WHERE product_id = ? AND branch_id = ?`,
          [item.product_id, trf.destination_branch_id]
        );

        const prevDestQty = destInv ? destInv.quantity : 0;
        const newDestQty = prevDestQty + item.quantity_sent;

        if (destInv) {
          run(
            `UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ? AND branch_id = ?`,
            [newDestQty, item.product_id, trf.destination_branch_id]
          );
        } else {
          run(
            `INSERT INTO inventory (product_id, branch_id, quantity, reserved_quantity) VALUES (?, ?, ?, 0)`,
            [item.product_id, trf.destination_branch_id, newDestQty]
          );
        }

        // Create new batch at destination branch with fresh expiry date default
        const expDate = new Date();
        expDate.setFullYear(expDate.getFullYear() + 2);
        run(
          `INSERT INTO inventory_batches (
            batch_number, product_id, branch_id, quantity, cost_price, expiry_date
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [`TRF-BAT-${Date.now().toString().slice(-6)}`, item.product_id, trf.destination_branch_id, item.quantity_sent, item.unit_cost, expDate.toISOString().split('T')[0]]
        );

        run(
          `UPDATE stock_transfer_items SET quantity_received = ? WHERE id = ?`,
          [item.quantity_sent, item.id]
        );

        // Movement record
        run(
          `INSERT INTO inventory_movements (
            product_id, branch_id, movement_type, quantity, previous_quantity, new_quantity,
            reference_type, reference_id, user_id, reason
          ) VALUES (?, ?, 'transfer_in', ?, ?, ?, 'transfer', ?, ?, 'Stock transfer received')`,
          [item.product_id, trf.destination_branch_id, item.quantity_sent, prevDestQty, newDestQty, trf.transfer_number, received_by]
        );
      }

      run(
        `UPDATE stock_transfers
         SET status = 'received', received_by = ?, received_date = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [received_by, trfId]
      );
    });

    res.json({ success: true, message: 'Transfer received and inventory updated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/transfers/:id/cancel
 */
router.post('/:id/cancel', (req, res) => {
  const trfId = parseInt(req.params.id, 10);

  try {
    runTransaction(() => {
      const trf = queryOne(`SELECT * FROM stock_transfers WHERE id = ?`, [trfId]);
      if (!trf) throw new Error('Transfer not found');
      if (trf.status === 'received' || trf.status === 'in_transit') {
        throw new Error('Cannot cancel a transfer that has already been dispatched or received');
      }

      if (trf.status === 'approved') {
        // Release reserved stock
        const items = queryAll(`SELECT * FROM stock_transfer_items WHERE transfer_id = ?`, [trfId]);
        for (const item of items) {
          run(
            `UPDATE inventory
             SET reserved_quantity = MAX(0, reserved_quantity - ?)
             WHERE product_id = ? AND branch_id = ?`,
            [item.quantity_requested, item.product_id, trf.source_branch_id]
          );
        }
      }

      run(`UPDATE stock_transfers SET status = 'cancelled' WHERE id = ?`, [trfId]);
    });

    res.json({ success: true, message: 'Transfer cancelled' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
