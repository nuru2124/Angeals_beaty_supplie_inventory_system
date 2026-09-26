import express from 'express';
import { queryAll, queryOne, run, runTransaction, logAudit, createNotification } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/sales
 * List sales with branch/customer/cashier filters
 */
router.get('/', (req, res) => {
  const { branch_id, customer_id, cashier_id, date_from, date_to, payment_method, limit } = req.query;

  let sql = `
    SELECT s.*,
           b.name as branch_name, b.code as branch_code,
           c.name as customer_name, c.phone as customer_phone,
           u.name as cashier_name,
           (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
    FROM sales s
    JOIN branches b ON s.branch_id = b.id
    LEFT JOIN customers c ON s.customer_id = c.id
    JOIN users u ON s.cashier_id = u.id
    WHERE 1=1
  `;

  const params = [];

  if (branch_id) {
    sql += ` AND s.branch_id = ?`;
    params.push(branch_id);
  }

  if (customer_id) {
    sql += ` AND s.customer_id = ?`;
    params.push(customer_id);
  }

  if (cashier_id) {
    sql += ` AND s.cashier_id = ?`;
    params.push(cashier_id);
  }

  if (payment_method) {
    sql += ` AND s.payment_method = ?`;
    params.push(payment_method);
  }

  if (date_from) {
    sql += ` AND date(s.created_at) >= date(?)`;
    params.push(date_from);
  }

  if (date_to) {
    sql += ` AND date(s.created_at) <= date(?)`;
    params.push(date_to);
  }

  sql += ` ORDER BY s.created_at DESC LIMIT ?`;
  params.push(limit ? parseInt(limit, 10) : 100);

  const sales = queryAll(sql, params);
  res.json(sales);
});

/**
 * GET /api/sales/:id
 * Retrieve full invoice & receipt representation
 */
router.get('/:id', (req, res) => {
  const saleId = parseInt(req.params.id, 10);
  const sale = queryOne(`
    SELECT s.*,
           b.name as branch_name, b.code as branch_code, b.address as branch_address, b.phone as branch_phone,
           c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
           u.name as cashier_name
    FROM sales s
    JOIN branches b ON s.branch_id = b.id
    LEFT JOIN customers c ON s.customer_id = c.id
    JOIN users u ON s.cashier_id = u.id
    WHERE s.id = ?
  `, [saleId]);

  if (!sale) {
    return res.status(404).json({ error: 'Sale record not found' });
  }

  const items = queryAll(`
    SELECT si.*,
           p.name as product_name, p.sku, p.barcode, p.unit,
           ib.batch_number, ib.expiry_date
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    LEFT JOIN inventory_batches ib ON si.batch_id = ib.id
    WHERE si.sale_id = ?
  `, [saleId]);

  res.json({
    ...sale,
    items
  });
});

/**
 * POST /api/sales/checkout
 * Fast, atomic POS sale completion with FEFO batch deduction
 */
router.post('/checkout', (req, res) => {
  const {
    branch_id,
    cashier_id,
    customer_id,
    items,
    subtotal,
    discount_amount = 0.0,
    discount_percentage = 0.0,
    tax_amount = 0.0,
    total_amount,
    payment_method,
    payment_details,
    amount_paid,
    notes
  } = req.body;

  if (!branch_id || !cashier_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Branch, cashier, and valid cart items are required' });
  }

  const branchId = parseInt(branch_id, 10);
  const cashierId = parseInt(cashier_id, 10);
  const paid = parseFloat(amount_paid) || parseFloat(total_amount);
  const total = parseFloat(total_amount);
  const change = Math.max(0, paid - total);

  try {
    const saleResult = runTransaction((db) => {
      // 1. Check stock availability for all items first
      for (const item of items) {
        const prodId = parseInt(item.product_id, 10);
        const qtyToSell = parseInt(item.quantity, 10);

        const inv = queryOne(
          `SELECT i.quantity, i.reserved_quantity, p.name, p.reorder_level
           FROM inventory i
           JOIN products p ON i.product_id = p.id
           WHERE i.product_id = ? AND i.branch_id = ?`,
          [prodId, branchId]
        );

        if (!inv) {
          throw new Error(`Inventory record not found for product ID ${prodId} at this branch`);
        }

        const available = inv.quantity - inv.reserved_quantity;
        if (available < qtyToSell) {
          throw new Error(`Insufficient stock for "${inv.name}". Available: ${available} units, Requested: ${qtyToSell} units.`);
        }
      }

      // 2. Generate unique Invoice Number
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

      // 3. Insert Sale Master Record
      const saleInsert = run(
        `INSERT INTO sales (
          invoice_number, branch_id, customer_id, cashier_id,
          subtotal, discount_amount, discount_percentage, tax_amount, total_amount,
          payment_method, payment_details, amount_paid, change_amount,
          status, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, CURRENT_TIMESTAMP)`,
        [
          invoiceNumber, branchId, customer_id || null, cashierId,
          parseFloat(subtotal), parseFloat(discount_amount), parseFloat(discount_percentage),
          parseFloat(tax_amount), total,
          payment_method || 'cash', payment_details || null,
          paid, change, notes || null
        ]
      );

      const saleId = Number(saleInsert.lastInsertRowid);

      // 4. Process each item: FEFO batch deduction, inventory reduction, movement logging
      for (const item of items) {
        const prodId = parseInt(item.product_id, 10);
        let remainingToDeduct = parseInt(item.quantity, 10);
        const unitPrice = parseFloat(item.unit_price);
        const itemDiscount = parseFloat(item.discount_amount || 0);
        const itemSubtotal = parseFloat(item.subtotal || (unitPrice * remainingToDeduct - itemDiscount));

        const prod = queryOne(`SELECT cost_price, name, reorder_level FROM products WHERE id = ?`, [prodId]);
        const currentInv = queryOne(`SELECT quantity FROM inventory WHERE product_id = ? AND branch_id = ?`, [prodId, branchId]);

        // Deduct from Batches using FEFO (First Expiry, First Out)
        const batches = queryAll(
          `SELECT id, batch_number, quantity, expiry_date, cost_price
           FROM inventory_batches
           WHERE product_id = ? AND branch_id = ? AND quantity > 0
           ORDER BY expiry_date ASC`,
          [prodId, branchId]
        );

        let primaryBatchId = null;

        if (batches.length > 0) {
          for (const b of batches) {
            if (remainingToDeduct <= 0) break;
            if (!primaryBatchId) primaryBatchId = b.id;

            const deductFromThisBatch = Math.min(b.quantity, remainingToDeduct);
            run(
              `UPDATE inventory_batches SET quantity = quantity - ? WHERE id = ?`,
              [deductFromThisBatch, b.id]
            );
            remainingToDeduct -= deductFromThisBatch;
          }
        }

        // Insert Sale Item
        run(
          `INSERT INTO sale_items (sale_id, product_id, batch_id, quantity, unit_price, cost_price, discount_amount, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [saleId, prodId, primaryBatchId, parseInt(item.quantity, 10), unitPrice, prod.cost_price, itemDiscount, itemSubtotal]
        );

        // Deduct branch inventory
        const newQty = currentInv.quantity - parseInt(item.quantity, 10);
        run(
          `UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ? AND branch_id = ?`,
          [newQty, prodId, branchId]
        );

        // Record immutable inventory movement
        run(
          `INSERT INTO inventory_movements (
            product_id, branch_id, movement_type, quantity, previous_quantity, new_quantity,
            reference_type, reference_id, user_id, reason
          ) VALUES (?, ?, 'sale', ?, ?, ?, 'sale', ?, ?, 'POS Checkout')`,
          [prodId, branchId, -parseInt(item.quantity, 10), currentInv.quantity, newQty, invoiceNumber, cashierId]
        );

        // Check Low Stock condition
        if (newQty <= prod.reorder_level) {
          const branch = queryOne(`SELECT name FROM branches WHERE id = ?`, [branchId]);
          createNotification({
            title: 'Low Stock Alert',
            message: `${prod.name} has fallen to ${newQty} units (reorder level: ${prod.reorder_level}) at ${branch ? branch.name : 'Branch'}.`,
            type: 'low_stock',
            branchId: branchId,
            linkUrl: '/inventory'
          });
        }
      }

      // Update customer purchase metrics if applicable
      if (customer_id) {
        run(
          `UPDATE customers
           SET total_purchases = total_purchases + ?,
               last_purchase_date = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [total, customer_id]
        );
      }

      // Audit Log
      const cashier = queryOne(`SELECT name FROM users WHERE id = ?`, [cashierId]);
      logAudit({
        userId: cashierId,
        userName: cashier ? cashier.name : 'Cashier',
        action: 'completed_sale',
        module: 'sales',
        recordId: invoiceNumber,
        newValue: { total_amount: total, payment_method, item_count: items.length },
        branchId: branchId
      });

      return { saleId, invoiceNumber };
    });

    // Return the full sale details for immediate receipt printing
    const branchInfo = queryOne(`SELECT * FROM branches WHERE id = ?`, [branchId]);
    const customerInfo = customer_id ? queryOne(`SELECT * FROM customers WHERE id = ?`, [customer_id]) : null;
    const cashierInfo = queryOne(`SELECT name FROM users WHERE id = ?`, [cashierId]);

    res.status(201).json({
      success: true,
      saleId: saleResult.saleId,
      invoiceNumber: saleResult.invoiceNumber,
      total: total,
      amountPaid: paid,
      change: change,
      branch: branchInfo,
      customer: customerInfo,
      cashier: cashierInfo ? cashierInfo.name : 'Cashier',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('POS Checkout Error:', err);
    res.status(400).json({ error: err.message || 'Unable to complete checkout' });
  }
});

export default router;
