import express from 'express';
import { queryAll, queryOne, run, logAudit } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/branches
 * Returns all branches with aggregated metrics
 */
router.get('/', (req, res) => {
  const branches = queryAll(`
    SELECT b.*,
      COALESCE((SELECT SUM(i.quantity) FROM inventory i WHERE i.branch_id = b.id), 0) as total_stock,
      COALESCE((SELECT SUM(i.quantity * p.cost_price) FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.branch_id = b.id), 0.0) as inventory_value,
      COALESCE((SELECT COUNT(*) FROM sales s WHERE s.branch_id = b.id), 0) as total_sales_count,
      COALESCE((SELECT SUM(s.total_amount) FROM sales s WHERE s.branch_id = b.id), 0.0) as total_revenue,
      COALESCE((SELECT COUNT(DISTINCT ub.user_id) FROM user_branches ub WHERE ub.branch_id = b.id), 0) as employee_count
    FROM branches b
    ORDER BY b.id ASC
  `);

  res.json(branches);
});

/**
 * GET /api/branches/:id
 */
router.get('/:id', (req, res) => {
  const branchId = parseInt(req.params.id, 10);
  const branch = queryOne(`SELECT * FROM branches WHERE id = ?`, [branchId]);

  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  // Aggregate metrics
  const stats = queryOne(`
    SELECT
      COALESCE(SUM(i.quantity), 0) as total_stock,
      COALESCE(SUM(i.quantity * p.cost_price), 0.0) as inventory_value,
      COALESCE(SUM(CASE WHEN i.quantity <= COALESCE(i.reorder_level, p.reorder_level) THEN 1 ELSE 0 END), 0) as low_stock_count
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE i.branch_id = ?
  `, [branchId]);

  // Today's and Monthly sales
  const salesStats = queryOne(`
    SELECT
      COALESCE(SUM(CASE WHEN date(s.created_at) = date('now') THEN s.total_amount ELSE 0 END), 0.0) as today_sales,
      COALESCE(SUM(CASE WHEN strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now') THEN s.total_amount ELSE 0 END), 0.0) as month_sales,
      COALESCE(COUNT(s.id), 0) as total_sales_transactions
    FROM sales s
    WHERE s.branch_id = ?
  `, [branchId]);

  // Staff assigned
  const staff = queryAll(`
    SELECT u.id, u.name, u.email, u.phone, r.display_name as role_name
    FROM user_branches ub
    JOIN users u ON ub.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    WHERE ub.branch_id = ?
  `, [branchId]);

  // Recent 5 sales
  const recentSales = queryAll(`
    SELECT s.id, s.invoice_number, s.total_amount, s.payment_method, s.created_at,
           c.name as customer_name, u.name as cashier_name
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    JOIN users u ON s.cashier_id = u.id
    WHERE s.branch_id = ?
    ORDER BY s.created_at DESC
    LIMIT 5
  `, [branchId]);

  res.json({
    ...branch,
    stats: {
      ...stats,
      ...salesStats
    },
    staff,
    recentSales
  });
});

/**
 * POST /api/branches
 */
router.post('/', (req, res) => {
  const { name, code, address, phone, email, manager_name, operating_hours } = req.body;
  if (!name || !code || !address || !phone) {
    return res.status(400).json({ error: 'Name, branch code, address, and phone are required' });
  }

  try {
    const result = run(
      `INSERT INTO branches (name, code, address, phone, email, manager_name, operating_hours, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [name, code.toUpperCase(), address, phone, email || null, manager_name || null, operating_hours || '8:00 AM - 8:00 PM']
    );

    const newBranchId = Number(result.lastInsertRowid);

    // Automatically create inventory records for all existing products initialized to 0
    const products = queryAll(`SELECT id, min_stock_level, max_stock_level, reorder_level FROM products`);
    for (const p of products) {
      run(
        `INSERT INTO inventory (product_id, branch_id, quantity, reserved_quantity, min_stock, max_stock, reorder_level)
         VALUES (?, ?, 0, 0, ?, ?, ?)`,
        [p.id, newBranchId, p.min_stock_level, p.max_stock_level, p.reorder_level]
      );
    }

    logAudit({
      userName: req.headers['x-user-name'] || 'Admin',
      action: 'create_branch',
      module: 'branches',
      recordId: newBranchId,
      newValue: { name, code },
      branchId: newBranchId
    });

    res.status(201).json({ id: newBranchId, message: 'Branch created successfully' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Branch code already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/branches/:id
 */
router.put('/:id', (req, res) => {
  const branchId = parseInt(req.params.id, 10);
  const { name, address, phone, email, manager_name, operating_hours, status } = req.body;

  const existing = queryOne(`SELECT * FROM branches WHERE id = ?`, [branchId]);
  if (!existing) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  run(
    `UPDATE branches
     SET name = COALESCE(?, name),
         address = COALESCE(?, address),
         phone = COALESCE(?, phone),
         email = COALESCE(?, email),
         manager_name = COALESCE(?, manager_name),
         operating_hours = COALESCE(?, operating_hours),
         status = COALESCE(?, status)
     WHERE id = ?`,
    [name, address, phone, email, manager_name, operating_hours, status, branchId]
  );

  logAudit({
    userName: req.headers['x-user-name'] || 'Admin',
    action: 'update_branch',
    module: 'branches',
    recordId: branchId,
    previousValue: existing,
    newValue: req.body,
    branchId: branchId
  });

  res.json({ message: 'Branch updated successfully' });
});

export default router;
