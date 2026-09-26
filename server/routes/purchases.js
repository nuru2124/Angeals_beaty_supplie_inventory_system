import express from 'express';
import { queryAll, queryOne, run, runTransaction, logAudit } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/purchasing/suppliers
 */
router.get('/suppliers', (req, res) => {
  const suppliers = queryAll(`
    SELECT s.*,
           (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id) as total_orders,
           (SELECT COUNT(*) FROM products p WHERE p.supplier_id = s.id) as products_supplied_count
    FROM suppliers s
    ORDER BY s.name ASC
  `);
  res.json(suppliers);
});

/**
 * POST /api/purchasing/suppliers
 */
router.post('/suppliers', (req, res) => {
  const { name, company_name, phone, email, address, contact_person, payment_terms } = req.body;
  if (!name || !company_name || !phone) {
    return res.status(400).json({ error: 'Name, company name, and phone are required' });
  }

  try {
    const resInsert = run(
      `INSERT INTO suppliers (name, company_name, phone, email, address, contact_person, payment_terms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, company_name, phone, email || null, address || null, contact_person || null, payment_terms || 'Net 30']
    );

    res.status(201).json({ id: Number(resInsert.lastInsertRowid), message: 'Supplier created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/purchasing/orders
 */
router.get('/orders', (req, res) => {
  const { branch_id, supplier_id, status } = req.query;

  let sql = `
    SELECT po.*,
           s.name as supplier_name, s.company_name,
           b.name as branch_name, b.code as branch_code,
           u.name as created_by_name,
           (SELECT COUNT(*) FROM purchase_order_items poi WHERE poi.po_id = po.id) as item_count,
           (SELECT SUM(poi.quantity_ordered) FROM purchase_order_items poi WHERE poi.po_id = po.id) as total_units_ordered
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    JOIN branches b ON po.branch_id = b.id
    JOIN users u ON po.created_by = u.id
    WHERE 1=1
  `;

  const params = [];

  if (branch_id) {
    sql += ` AND po.branch_id = ?`;
    params.push(branch_id);
  }

  if (supplier_id) {
    sql += ` AND po.supplier_id = ?`;
    params.push(supplier_id);
  }

  if (status) {
    sql += ` AND po.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY po.created_at DESC`;

  const orders = queryAll(sql, params);
  res.json(orders);
});

/**
 * GET /api/purchasing/orders/:id
 */
router.get('/orders/:id', (req, res) => {
  const poId = parseInt(req.params.id, 10);
  const po = queryOne(`
    SELECT po.*,
           s.name as supplier_name, s.company_name, s.phone as supplier_phone, s.email as supplier_email, s.address as supplier_address,
           b.name as branch_name, b.code as branch_code, b.address as branch_address,
           u.name as created_by_name
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    JOIN branches b ON po.branch_id = b.id
    JOIN users u ON po.created_by = u.id
    WHERE po.id = ?
  `, [poId]);

  if (!po) {
    return res.status(404).json({ error: 'Purchase order not found' });
  }

  const items = queryAll(`
    SELECT poi.*,
           p.name as product_name, p.sku, p.barcode, p.unit
    FROM purchase_order_items poi
    JOIN products p ON poi.product_id = p.id
    WHERE poi.po_id = ?
  `, [poId]);

  res.json({
    ...po,
    items
  });
});

/**
 * POST /api/purchasing/orders
 */
router.post('/orders', (req, res) => {
  const { supplier_id, branch_id, expected_delivery_date, notes, items, created_by = 1 } = req.body;

  if (!supplier_id || !branch_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Supplier, branch, and item list are required' });
  }

  try {
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    let totalCost = 0;

    for (const item of items) {
      totalCost += parseFloat(item.cost_price) * parseInt(item.quantity_ordered, 10);
    }

    const newId = runTransaction(() => {
      const poRes = run(
        `INSERT INTO purchase_orders (
          po_number, supplier_id, branch_id, status, total_cost,
          expected_delivery_date, created_by, notes, created_at
        ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [poNumber, supplier_id, branch_id, totalCost, expected_delivery_date || null, created_by, notes || null]
      );

      const poId = Number(poRes.lastInsertRowid);

      for (const item of items) {
        const qty = parseInt(item.quantity_ordered, 10);
        const cost = parseFloat(item.cost_price);
        run(
          `INSERT INTO purchase_order_items (
            po_id, product_id, quantity_ordered, cost_price, subtotal
          ) VALUES (?, ?, ?, ?, ?)`,
          [poId, item.product_id, qty, cost, qty * cost]
        );
      }

      return poId;
    });

    res.status(201).json({ id: newId, po_number: poNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/purchasing/orders/:id/receive
 * Receive goods: updates branch inventory, creates FEFO batch, logs movement
 */
router.post('/orders/:id/receive', (req, res) => {
  const poId = parseInt(req.params.id, 10);
  const { received_by = 1, batch_overrides = [] } = req.body;

  try {
    runTransaction(() => {
      const po = queryOne(`SELECT * FROM purchase_orders WHERE id = ?`, [poId]);
      if (!po) throw new Error('Purchase order not found');
      if (po.status === 'received') throw new Error('Purchase order already fully received');

      const items = queryAll(`SELECT * FROM purchase_order_items WHERE po_id = ?`, [poId]);

      for (const item of items) {
        const currentInv = queryOne(
          `SELECT quantity FROM inventory WHERE product_id = ? AND branch_id = ?`,
          [item.product_id, po.branch_id]
        );

        const prevQty = currentInv ? currentInv.quantity : 0;
        const newQty = prevQty + item.quantity_ordered;

        if (currentInv) {
          run(
            `UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ? AND branch_id = ?`,
            [newQty, item.product_id, po.branch_id]
          );
        } else {
          run(
            `INSERT INTO inventory (product_id, branch_id, quantity, reserved_quantity) VALUES (?, ?, ?, 0)`,
            [item.product_id, po.branch_id, newQty]
          );
        }

        // Generate expiry date (default 2 years from today if not specified)
        const expDateObj = new Date();
        expDateObj.setFullYear(expDateObj.getFullYear() + 2);
        const expiryDate = expDateObj.toISOString().split('T')[0];
        const batchNum = `BAT-${Date.now().toString().slice(-6)}`;

        // Create FEFO batch
        run(
          `INSERT INTO inventory_batches (
            batch_number, product_id, branch_id, quantity, cost_price, manufacturing_date, expiry_date, supplier_id
          ) VALUES (?, ?, ?, ?, ?, date('now'), ?, ?)`,
          [batchNum, item.product_id, po.branch_id, item.quantity_ordered, item.cost_price, expiryDate, po.supplier_id]
        );

        // Update PO item received quantity
        run(
          `UPDATE purchase_order_items SET quantity_received = ? WHERE id = ?`,
          [item.quantity_ordered, item.id]
        );

        // Record immutable inventory movement
        run(
          `INSERT INTO inventory_movements (
            product_id, branch_id, movement_type, quantity, previous_quantity, new_quantity,
            reference_type, reference_id, user_id, reason
          ) VALUES (?, ?, 'purchase', ?, ?, ?, 'purchase_order', ?, ?, 'Purchase Order Goods Receiving')`,
          [item.product_id, po.branch_id, item.quantity_ordered, prevQty, newQty, po.po_number, received_by]
        );
      }

      run(
        `UPDATE purchase_orders
         SET status = 'received', received_by = ?, received_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [received_by, poId]
      );
    });

    res.json({ success: true, message: 'Goods received and added to branch inventory' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
