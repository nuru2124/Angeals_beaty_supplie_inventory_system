import express from 'express';
import { queryAll, queryOne } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/reports/dashboard
 * Central headquarters or branch-specific KPI summary
 */
router.get('/dashboard', (req, res) => {
  const { branch_id } = req.query;
  const bId = branch_id ? parseInt(branch_id, 10) : null;

  // 1. Total Products
  const totalProducts = queryOne(`SELECT COUNT(*) as count FROM products WHERE status = 'active'`).count;

  // 2. Stock & Inventory Value
  let stockQuery = `
    SELECT
      COALESCE(SUM(i.quantity), 0) as total_stock,
      COALESCE(SUM(i.quantity * p.cost_price), 0.0) as total_inventory_value,
      COALESCE(SUM(CASE WHEN i.quantity <= COALESCE(i.reorder_level, p.reorder_level) THEN 1 ELSE 0 END), 0) as low_stock_count
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE 1=1
  `;
  if (bId) stockQuery += ` AND i.branch_id = ${bId}`;
  const stockStats = queryOne(stockQuery);

  // 3. Sales Metrics (Today & This Month)
  let salesQuery = `
    SELECT
      COALESCE(SUM(CASE WHEN date(s.created_at) = date('now') THEN s.total_amount ELSE 0 END), 0.0) as today_sales,
      COALESCE(SUM(CASE WHEN strftime('%Y-%m', s.created_at) = strftime('%Y-%m', 'now') THEN s.total_amount ELSE 0 END), 0.0) as month_sales,
      COALESCE(COUNT(CASE WHEN date(s.created_at) = date('now') THEN 1 END), 0) as today_orders_count
    FROM sales s
    WHERE s.status = 'completed'
  `;
  if (bId) salesQuery += ` AND s.branch_id = ${bId}`;
  const salesStats = queryOne(salesQuery);

  // 4. Expiring Products (<90 days and already expired)
  let expiryQuery = `
    SELECT
      COUNT(DISTINCT ib.product_id) as expiring_count,
      COALESCE(SUM(CASE WHEN JULIANDAY(ib.expiry_date) < JULIANDAY('now') THEN 1 ELSE 0 END), 0) as expired_count
    FROM inventory_batches ib
    WHERE ib.quantity > 0 AND (JULIANDAY(ib.expiry_date) - JULIANDAY('now')) <= 90
  `;
  if (bId) expiryQuery += ` AND ib.branch_id = ${bId}`;
  const expiryStats = queryOne(expiryQuery);

  // 5. Pending Transfers & Pending Purchase Orders
  let pendingTransfersQuery = `SELECT COUNT(*) as count FROM stock_transfers WHERE status IN ('pending_approval', 'in_transit')`;
  if (bId) pendingTransfersQuery += ` AND (source_branch_id = ${bId} OR destination_branch_id = ${bId})`;
  const pendingTransfers = queryOne(pendingTransfersQuery).count;

  let pendingPosQuery = `SELECT COUNT(*) as count FROM purchase_orders WHERE status IN ('pending', 'approved')`;
  if (bId) pendingPosQuery += ` AND branch_id = ${bId}`;
  const pendingPos = queryOne(pendingPosQuery).count;

  res.json({
    totalProducts,
    totalStock: stockStats.total_stock,
    totalInventoryValue: stockStats.total_inventory_value,
    todaySales: salesStats.today_sales,
    monthSales: salesStats.month_sales,
    todayOrdersCount: salesStats.today_orders_count,
    lowStockCount: stockStats.low_stock_count,
    expiringCount: expiryStats.expiring_count,
    expiredCount: expiryStats.expired_count,
    pendingTransfers,
    pendingPurchaseOrders: pendingPos
  });
});

/**
 * GET /api/reports/sales-overview
 * Time-series sales data for interactive chart
 */
router.get('/sales-overview', (req, res) => {
  const { branch_id, period = 'daily' } = req.query;
  const bId = branch_id ? parseInt(branch_id, 10) : null;

  let groupFormat = '%Y-%m-%d';
  if (period === 'monthly') groupFormat = '%Y-%m';
  if (period === 'yearly') groupFormat = '%Y';

  let sql = `
    SELECT strftime('${groupFormat}', s.created_at) as period_label,
           COALESCE(SUM(s.total_amount), 0.0) as revenue,
           COALESCE(COUNT(s.id), 0) as order_count,
           COALESCE(SUM(s.tax_amount), 0.0) as tax_collected
    FROM sales s
    WHERE s.status = 'completed'
  `;

  if (bId) sql += ` AND s.branch_id = ${bId}`;
  sql += ` GROUP BY period_label ORDER BY period_label ASC LIMIT 30`;

  const rows = queryAll(sql);
  res.json(rows);
});

/**
 * GET /api/reports/sales-by-branch
 */
router.get('/sales-by-branch', (req, res) => {
  const branches = queryAll(`
    SELECT b.id, b.name, b.code,
           COALESCE(SUM(s.total_amount), 0.0) as revenue,
           COALESCE(COUNT(s.id), 0) as total_orders
    FROM branches b
    LEFT JOIN sales s ON s.branch_id = b.id AND s.status = 'completed'
    GROUP BY b.id
    ORDER BY revenue DESC
  `);
  res.json(branches);
});

/**
 * GET /api/reports/top-products
 */
router.get('/top-products', (req, res) => {
  const { branch_id, limit = 8 } = req.query;

  let sql = `
    SELECT p.id, p.name, p.sku, p.selling_price, p.cost_price,
           c.name as category_name,
           COALESCE(SUM(si.quantity), 0) as total_quantity_sold,
           COALESCE(SUM(si.subtotal), 0.0) as total_revenue,
           COALESCE(SUM(si.subtotal - (si.quantity * si.cost_price)), 0.0) as estimated_profit
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN sale_items si ON si.product_id = p.id
    JOIN sales s ON si.sale_id = s.id
    WHERE s.status = 'completed'
  `;

  if (branch_id) {
    sql += ` AND s.branch_id = ${parseInt(branch_id, 10)}`;
  }

  sql += `
    GROUP BY p.id
    ORDER BY total_revenue DESC
    LIMIT ${parseInt(limit, 10)}
  `;

  res.json(queryAll(sql));
});

/**
 * GET /api/reports/profit-and-loss
 */
router.get('/profit-and-loss', (req, res) => {
  const { branch_id, date_from, date_to } = req.query;

  let salesSql = `
    SELECT
      COALESCE(SUM(si.subtotal), 0.0) as gross_revenue,
      COALESCE(SUM(si.quantity * si.cost_price), 0.0) as cogs
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE s.status = 'completed'
  `;

  let expensesSql = `
    SELECT COALESCE(SUM(amount), 0.0) as total_expenses
    FROM expenses
    WHERE 1=1
  `;

  if (branch_id) {
    salesSql += ` AND s.branch_id = ${parseInt(branch_id, 10)}`;
    expensesSql += ` AND branch_id = ${parseInt(branch_id, 10)}`;
  }

  if (date_from) {
    salesSql += ` AND date(s.created_at) >= date('${date_from}')`;
    expensesSql += ` AND date >= '${date_from}'`;
  }

  if (date_to) {
    salesSql += ` AND date(s.created_at) <= date('${date_to}')`;
    expensesSql += ` AND date <= '${date_to}'`;
  }

  const salesData = queryOne(salesSql);
  const expensesData = queryOne(expensesSql);

  const grossRevenue = salesData ? salesData.gross_revenue : 0;
  const cogs = salesData ? salesData.cogs : 0;
  const grossProfit = grossRevenue - cogs;
  const totalExpenses = expensesData ? expensesData.total_expenses : 0;
  const estimatedNetProfit = grossProfit - totalExpenses;
  const profitMarginPercent = grossRevenue > 0 ? ((grossProfit / grossRevenue) * 100).toFixed(1) : 0;

  res.json({
    grossRevenue,
    cogs,
    grossProfit,
    totalExpenses,
    estimatedNetProfit,
    profitMarginPercent
  });
});

/**
 * GET /api/reports/slow-moving
 * Products with no sales for 30, 60, or 90 days
 */
router.get('/slow-moving', (req, res) => {
  const days = parseInt(req.query.days, 10) || 60;
  const { branch_id } = req.query;

  let sql = `
    SELECT p.id, p.name, p.sku, p.cost_price, p.selling_price,
           c.name as category_name,
           COALESCE(SUM(i.quantity), 0) as current_stock,
           COALESCE(SUM(i.quantity * p.cost_price), 0.0) as locked_capital,
           (
             SELECT MAX(s.created_at)
             FROM sale_items si
             JOIN sales s ON si.sale_id = s.id
             WHERE si.product_id = p.id
           ) as last_sale_date,
           CAST(ROUND(JULIANDAY('now') - JULIANDAY(COALESCE((
             SELECT MAX(s.created_at)
             FROM sale_items si
             JOIN sales s ON si.sale_id = s.id
             WHERE si.product_id = p.id
           ), p.created_at))) AS INTEGER) as days_since_last_sale
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN inventory i ON i.product_id = p.id
    WHERE 1=1
  `;

  if (branch_id) {
    sql += ` AND i.branch_id = ${parseInt(branch_id, 10)}`;
  }

  sql += `
    GROUP BY p.id
    HAVING (days_since_last_sale >= ${days} OR last_sale_date IS NULL) AND current_stock > 0
    ORDER BY locked_capital DESC
  `;

  res.json(queryAll(sql));
});

/**
 * GET /api/reports/dead-stock
 * High stock with zero recent sales
 */
router.get('/dead-stock', (req, res) => {
  const sql = `
    SELECT p.id, p.name, p.sku, p.cost_price,
           c.name as category_name,
           COALESCE(SUM(i.quantity), 0) as total_stock,
           COALESCE(SUM(i.quantity * p.cost_price), 0.0) as inventory_value
    FROM products p
    JOIN categories c ON p.category_id = c.id
    JOIN inventory i ON i.product_id = p.id
    WHERE (
      SELECT COUNT(*) FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE si.product_id = p.id AND date(s.created_at) >= date('now', '-90 days')
    ) = 0
    GROUP BY p.id
    HAVING total_stock > 25
    ORDER BY inventory_value DESC
  `;
  res.json(queryAll(sql));
});

/**
 * GET /api/reports/export
 * Generates CSV download
 */
router.get('/export', (req, res) => {
  const { type = 'inventory', branch_id } = req.query;

  let csvRows = [];
  let filename = `export_${type}_${Date.now()}.csv`;

  if (type === 'inventory') {
    let sql = `
      SELECT p.sku, p.name, c.name as category, b.name as branch,
             i.quantity, p.cost_price, p.selling_price, (i.quantity * p.cost_price) as total_cost_value
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN branches b ON i.branch_id = b.id
      WHERE 1=1
    `;
    if (branch_id) sql += ` AND i.branch_id = ${parseInt(branch_id, 10)}`;
    sql += ` ORDER BY p.name ASC`;
    const data = queryAll(sql);

    csvRows.push(['SKU', 'Product Name', 'Category', 'Branch', 'Quantity', 'Cost Price (GHS)', 'Selling Price (GHS)', 'Inventory Value (GHS)']);
    for (const d of data) {
      csvRows.push([
        `"${d.sku}"`, `"${d.name}"`, `"${d.category}"`, `"${d.branch}"`,
        d.quantity, d.cost_price.toFixed(2), d.selling_price.toFixed(2), d.total_cost_value.toFixed(2)
      ]);
    }
  } else if (type === 'sales') {
    let sql = `
      SELECT s.invoice_number, s.created_at, b.name as branch,
             COALESCE(c.name, 'Walk-in') as customer,
             s.payment_method, s.subtotal, s.tax_amount, s.total_amount
      FROM sales s
      JOIN branches b ON s.branch_id = b.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE 1=1
    `;
    if (branch_id) sql += ` AND s.branch_id = ${parseInt(branch_id, 10)}`;
    sql += ` ORDER BY s.created_at DESC`;
    const data = queryAll(sql);

    csvRows.push(['Invoice #', 'Date', 'Branch', 'Customer', 'Payment Method', 'Subtotal (GHS)', 'Tax (GHS)', 'Total (GHS)']);
    for (const d of data) {
      csvRows.push([
        `"${d.invoice_number}"`, `"${d.created_at}"`, `"${d.branch}"`, `"${d.customer}"`,
        `"${d.payment_method}"`, d.subtotal.toFixed(2), d.tax_amount.toFixed(2), d.total_amount.toFixed(2)
      ]);
    }
  }

  const csvContent = csvRows.map(r => r.join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

export default router;
