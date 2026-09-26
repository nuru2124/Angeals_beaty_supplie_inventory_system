import express from 'express';
import { queryAll, queryOne, run, runTransaction, logAudit, createNotification } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/inventory
 * Branch-specific stock listing
 */
router.get('/', (req, res) => {
  const { branch_id, category_id, low_stock_only, search } = req.query;

  let sql = `
    SELECT i.*,
           (i.quantity - i.reserved_quantity) as available_quantity,
           p.name as product_name, p.sku, p.barcode, p.cost_price, p.selling_price, p.unit,
           (i.quantity * p.cost_price) as inventory_value,
           c.name as category_name,
           b.name as branch_name, b.code as branch_code,
           CASE
             WHEN i.quantity <= COALESCE(i.reorder_level, p.reorder_level) THEN 1
             ELSE 0
           END as is_low_stock
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    JOIN branches b ON i.branch_id = b.id
    WHERE 1=1
  `;

  const params = [];

  if (branch_id) {
    sql += ` AND i.branch_id = ?`;
    params.push(branch_id);
  }

  if (category_id) {
    sql += ` AND p.category_id = ?`;
    params.push(category_id);
  }

  if (low_stock_only === 'true' || low_stock_only === '1') {
    sql += ` AND i.quantity <= COALESCE(i.reorder_level, p.reorder_level)`;
  }

  if (search) {
    sql += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  sql += ` ORDER BY is_low_stock DESC, i.quantity ASC`;

  const items = queryAll(sql, params);
  res.json(items);
});

/**
 * GET /api/inventory/batches
 * FEFO batch monitoring with expiry countdown
 */
router.get('/batches', (req, res) => {
  const { branch_id, product_id, status } = req.query;

  let sql = `
    SELECT ib.*,
           p.name as product_name, p.sku, p.barcode,
           b.name as branch_name, b.code as branch_code,
           s.name as supplier_name,
           CAST(ROUND(JULIANDAY(ib.expiry_date) - JULIANDAY('now')) AS INTEGER) as days_to_expiry,
           CASE
             WHEN JULIANDAY(ib.expiry_date) < JULIANDAY('now') THEN 'expired'
             WHEN (JULIANDAY(ib.expiry_date) - JULIANDAY('now')) < 30 THEN 'critical'
             WHEN (JULIANDAY(ib.expiry_date) - JULIANDAY('now')) <= 90 THEN 'expiring_soon'
             ELSE 'safe'
           END as expiry_category
    FROM inventory_batches ib
    JOIN products p ON ib.product_id = p.id
    JOIN branches b ON ib.branch_id = b.id
    LEFT JOIN suppliers s ON ib.supplier_id = s.id
    WHERE ib.quantity > 0
  `;

  const params = [];

  if (branch_id) {
    sql += ` AND ib.branch_id = ?`;
    params.push(branch_id);
  }

  if (product_id) {
    sql += ` AND ib.product_id = ?`;
    params.push(product_id);
  }

  if (status) {
    if (status === 'expired') {
      sql += ` AND JULIANDAY(ib.expiry_date) < JULIANDAY('now')`;
    } else if (status === 'critical') {
      sql += ` AND (JULIANDAY(ib.expiry_date) - JULIANDAY('now')) >= 0 AND (JULIANDAY(ib.expiry_date) - JULIANDAY('now')) < 30`;
    } else if (status === 'expiring_soon') {
      sql += ` AND (JULIANDAY(ib.expiry_date) - JULIANDAY('now')) >= 30 AND (JULIANDAY(ib.expiry_date) - JULIANDAY('now')) <= 90`;
    } else if (status === 'safe') {
      sql += ` AND (JULIANDAY(ib.expiry_date) - JULIANDAY('now')) > 90`;
    }
  }

  sql += ` ORDER BY ib.expiry_date ASC`;

  const batches = queryAll(sql, params);
  res.json(batches);
});

/**
 * GET /api/inventory/movements
 * Full immutable ledger of inventory changes
 */
router.get('/movements', (req, res) => {
  const { branch_id, product_id, movement_type, limit } = req.query;

  let sql = `
    SELECT im.*,
           p.name as product_name, p.sku,
           b.name as branch_name, b.code as branch_code,
           u.name as user_name
    FROM inventory_movements im
    JOIN products p ON im.product_id = p.id
    JOIN branches b ON im.branch_id = b.id
    LEFT JOIN users u ON im.user_id = u.id
    WHERE 1=1
  `;

  const params = [];

  if (branch_id) {
    sql += ` AND im.branch_id = ?`;
    params.push(branch_id);
  }

  if (product_id) {
    sql += ` AND im.product_id = ?`;
    params.push(product_id);
  }

  if (movement_type) {
    sql += ` AND im.movement_type = ?`;
    params.push(movement_type);
  }

  sql += ` ORDER BY im.created_at DESC LIMIT ?`;
  params.push(limit ? parseInt(limit, 10) : 100);

  const movements = queryAll(sql, params);
  res.json(movements);
});

/**
 * GET /api/inventory/low-stock
 */
router.get('/low-stock', (req, res) => {
  const { branch_id } = req.query;

  let sql = `
    SELECT i.*,
           p.name as product_name, p.sku, p.barcode, p.cost_price, p.selling_price,
           c.name as category_name,
           b.name as branch_name, b.code as branch_code,
           COALESCE(i.reorder_level, p.reorder_level) as target_reorder_level,
           (COALESCE(i.max_stock, p.max_stock_level) - i.quantity) as suggested_order_qty
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    JOIN branches b ON i.branch_id = b.id
    WHERE i.quantity <= COALESCE(i.reorder_level, p.reorder_level)
  `;

  const params = [];
  if (branch_id) {
    sql += ` AND i.branch_id = ?`;
    params.push(branch_id);
  }

  sql += ` ORDER BY i.quantity ASC`;

  const lowStock = queryAll(sql, params);
  res.json(lowStock);
});

/**
 * GET /api/inventory/reorder-suggestions
 */
router.get('/reorder-suggestions', (req, res) => {
  const { branch_id } = req.query;

  let sql = `
    SELECT i.product_id, i.branch_id, i.quantity as current_stock,
           p.name as product_name, p.sku, p.cost_price, p.supplier_id,
           s.name as supplier_name,
           b.name as branch_name, b.code as branch_code,
           COALESCE(i.reorder_level, p.reorder_level) as reorder_level,
           COALESCE(i.max_stock, p.max_stock_level) as max_stock,
           (COALESCE(i.max_stock, p.max_stock_level) - i.quantity) as suggested_order_qty,
           ((COALESCE(i.max_stock, p.max_stock_level) - i.quantity) * p.cost_price) as estimated_cost
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN branches b ON i.branch_id = b.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE i.quantity <= COALESCE(i.reorder_level, p.reorder_level)
  `;

  const params = [];
  if (branch_id) {
    sql += ` AND i.branch_id = ?`;
    params.push(branch_id);
  }

  sql += ` ORDER BY (i.quantity * 1.0 / COALESCE(i.reorder_level, p.reorder_level)) ASC`;

  const suggestions = queryAll(sql, params);
  res.json(suggestions);
});

/**
 * GET /api/inventory/comparison
 * Matrix comparing products across all branches
 */
router.get('/comparison', (req, res) => {
  const branches = queryAll(`SELECT id, name, code FROM branches ORDER BY id ASC`);
  const products = queryAll(`
    SELECT p.id, p.name, p.sku, p.cost_price, p.selling_price, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    ORDER BY p.name ASC
  `);

  const inventoryRows = queryAll(`
    SELECT product_id, branch_id, quantity, reserved_quantity,
           (quantity - reserved_quantity) as available
    FROM inventory
  `);

  const invMap = {};
  for (const row of inventoryRows) {
    if (!invMap[row.product_id]) invMap[row.product_id] = {};
    invMap[row.product_id][row.branch_id] = row;
  }

  const matrix = products.map(prod => {
    const branchStock = {};
    let totalQty = 0;
    for (const b of branches) {
      const entry = (invMap[prod.id] && invMap[prod.id][b.id]) || { quantity: 0, available: 0 };
      branchStock[b.code] = entry.quantity;
      totalQty += entry.quantity;
    }
    return {
      product_id: prod.id,
      name: prod.name,
      sku: prod.sku,
      category: prod.category_name,
      cost_price: prod.cost_price,
      selling_price: prod.selling_price,
      total_stock: totalQty,
      branches: branchStock
    };
  });

  res.json({
    branches,
    matrix
  });
});

/**
 * GET /api/inventory/transfer-suggestions
 * Automated intelligence identifying surplus vs deficit branches
 */
router.get('/transfer-suggestions', (req, res) => {
  // Find products that are low in one branch but have abundant surplus in another branch
  const lowItems = queryAll(`
    SELECT i.product_id, i.branch_id, i.quantity as low_qty,
           p.name as product_name, p.sku,
           b.name as dest_branch_name, b.code as dest_branch_code,
           COALESCE(i.reorder_level, p.reorder_level) as reorder_level
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN branches b ON i.branch_id = b.id
    WHERE i.quantity < COALESCE(i.reorder_level, p.reorder_level)
  `);

  const suggestions = [];

  for (const item of lowItems) {
    const surplus = queryOne(`
      SELECT i.branch_id, i.quantity as surplus_qty,
             b.name as source_branch_name, b.code as source_branch_code
      FROM inventory i
      JOIN branches b ON i.branch_id = b.id
      WHERE i.product_id = ?
        AND i.branch_id != ?
        AND i.quantity > (COALESCE(i.reorder_level, 15) * 1.5)
      ORDER BY i.quantity DESC
      LIMIT 1
    `, [item.product_id, item.branch_id]);

    if (surplus) {
      const suggestTransferQty = Math.min(
        Math.floor((surplus.surplus_qty - item.reorder_level) / 2),
        (item.reorder_level * 2 - item.low_qty)
      );

      if (suggestTransferQty > 2) {
        suggestions.push({
          product_id: item.product_id,
          product_name: item.product_name,
          sku: item.sku,
          source_branch_id: surplus.branch_id,
          source_branch_name: surplus.source_branch_name,
          source_branch_code: surplus.source_branch_code,
          source_stock: surplus.surplus_qty,
          dest_branch_id: item.branch_id,
          dest_branch_name: item.dest_branch_name,
          dest_branch_code: item.dest_branch_code,
          dest_stock: item.low_qty,
          reorder_level: item.reorder_level,
          suggested_transfer_quantity: suggestTransferQty
        });
      }
    }
  }

  res.json(suggestions);
});

export default router;
