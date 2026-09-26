import express from 'express';
import { queryAll, queryOne, run, logAudit, runTransaction } from '../db/database.js';

const router = express.Router();

/**
 * GET /api/products/sku/generate
 */
router.get('/sku/generate', (req, res) => {
  const { category_id, brand_id } = req.query;
  let catPrefix = 'BEAU';
  let brandPrefix = 'GEN';

  if (category_id) {
    const cat = queryOne(`SELECT name FROM categories WHERE id = ?`, [category_id]);
    if (cat) catPrefix = cat.name.substring(0, 4).toUpperCase();
  }

  if (brand_id) {
    const brand = queryOne(`SELECT name FROM brands WHERE id = ?`, [brand_id]);
    if (brand) brandPrefix = brand.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  }

  const countRow = queryOne(`SELECT COUNT(*) as count FROM products WHERE category_id = ?`, [category_id || 1]);
  const num = String((countRow ? countRow.count : 0) + 1).padStart(3, '0');
  const sku = `${catPrefix}-${brandPrefix}-${num}`;

  res.json({ sku, barcode: '6' + Math.floor(10000000 + Math.random() * 90000000) });
});

/**
 * GET /api/products
 * Supports branch_id, category_id, brand_id, search
 */
router.get('/', (req, res) => {
  const { branch_id, category_id, brand_id, search, status } = req.query;

  let query = `
    SELECT p.*,
           c.name as category_name, c.slug as category_slug,
           b.name as brand_name,
           s.name as supplier_name,
           COALESCE((SELECT SUM(i.quantity) FROM inventory i WHERE i.product_id = p.id), 0) as total_stock,
           COALESCE((SELECT SUM(i.reserved_quantity) FROM inventory i WHERE i.product_id = p.id), 0) as total_reserved
  `;

  if (branch_id) {
    query += `,
      COALESCE((SELECT i.quantity FROM inventory i WHERE i.product_id = p.id AND i.branch_id = ?), 0) as branch_stock,
      COALESCE((SELECT i.reserved_quantity FROM inventory i WHERE i.product_id = p.id AND i.branch_id = ?), 0) as branch_reserved,
      COALESCE((SELECT (i.quantity - i.reserved_quantity) FROM inventory i WHERE i.product_id = p.id AND i.branch_id = ?), 0) as branch_available
    `;
  }

  query += `
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE 1=1
  `;

  const params = [];
  if (branch_id) {
    params.push(branch_id, branch_id, branch_id);
  }

  if (category_id) {
    query += ` AND p.category_id = ?`;
    params.push(category_id);
  }

  if (brand_id) {
    query += ` AND p.brand_id = ?`;
    params.push(brand_id);
  }

  if (status) {
    query += ` AND p.status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ` ORDER BY p.id DESC`;

  const products = queryAll(query, params);
  res.json(products);
});

/**
 * GET /api/products/:id
 */
router.get('/:id', (req, res) => {
  const prodId = parseInt(req.params.id, 10);
  const product = queryOne(`
    SELECT p.*,
           c.name as category_name, c.slug as category_slug,
           b.name as brand_name,
           s.name as supplier_name,
           COALESCE((SELECT SUM(i.quantity) FROM inventory i WHERE i.product_id = p.id), 0) as total_stock,
           COALESCE((SELECT SUM(i.reserved_quantity) FROM inventory i WHERE i.product_id = p.id), 0) as total_reserved
    FROM products p
    JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.id = ?
  `, [prodId]);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Branch stock distribution
  const branchStock = queryAll(`
    SELECT b.id as branch_id, b.name as branch_name, b.code as branch_code,
           COALESCE(i.quantity, 0) as quantity,
           COALESCE(i.reserved_quantity, 0) as reserved_quantity,
           (COALESCE(i.quantity, 0) - COALESCE(i.reserved_quantity, 0)) as available_quantity,
           COALESCE(i.min_stock, p.min_stock_level) as min_stock,
           COALESCE(i.reorder_level, p.reorder_level) as reorder_level,
           (COALESCE(i.quantity, 0) * p.cost_price) as inventory_value
    FROM branches b
    LEFT JOIN inventory i ON i.branch_id = b.id AND i.product_id = ?
    JOIN products p ON p.id = ?
    ORDER BY b.id ASC
  `, [prodId, prodId]);

  // Active Batches with days to expiry
  const batches = queryAll(`
    SELECT ib.*, b.name as branch_name,
           CAST(ROUND(JULIANDAY(ib.expiry_date) - JULIANDAY('now')) AS INTEGER) as days_to_expiry,
           CASE
             WHEN JULIANDAY(ib.expiry_date) < JULIANDAY('now') THEN 'expired'
             WHEN (JULIANDAY(ib.expiry_date) - JULIANDAY('now')) < 30 THEN 'critical'
             WHEN (JULIANDAY(ib.expiry_date) - JULIANDAY('now')) <= 90 THEN 'expiring_soon'
             ELSE 'safe'
           END as expiry_status
    FROM inventory_batches ib
    JOIN branches b ON ib.branch_id = b.id
    WHERE ib.product_id = ? AND ib.quantity > 0
    ORDER BY ib.expiry_date ASC
  `, [prodId]);

  // Recent Movements
  const movements = queryAll(`
    SELECT im.*, b.name as branch_name, u.name as user_name
    FROM inventory_movements im
    JOIN branches b ON im.branch_id = b.id
    LEFT JOIN users u ON im.user_id = u.id
    WHERE im.product_id = ?
    ORDER BY im.created_at DESC
    LIMIT 15
  `, [prodId]);

  // Recent Sales
  const recentSales = queryAll(`
    SELECT s.invoice_number, s.created_at, si.quantity, si.unit_price, si.subtotal,
           b.name as branch_name, c.name as customer_name
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN branches b ON s.branch_id = b.id
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE si.product_id = ?
    ORDER BY s.created_at DESC
    LIMIT 10
  `, [prodId]);

  res.json({
    ...product,
    branchStock,
    batches,
    movements,
    recentSales
  });
});

/**
 * POST /api/products
 */
router.post('/', (req, res) => {
  const {
    name, sku, barcode, brand_id, category_id, subcategory, description,
    image_url, supplier_id, cost_price, selling_price, wholesale_price,
    min_stock_level, max_stock_level, reorder_level, unit, tax_rate,
    initial_stock, branch_id
  } = req.body;

  if (!name || !category_id || cost_price === undefined || selling_price === undefined) {
    return res.status(400).json({ error: 'Name, category, cost price, and selling price are required' });
  }

  // Generate SKU if omitted
  let finalSku = sku;
  if (!finalSku) {
    const cat = queryOne(`SELECT name FROM categories WHERE id = ?`, [category_id]);
    const catPrefix = cat ? cat.name.substring(0, 4).toUpperCase() : 'BEAU';
    const rand = Math.floor(100 + Math.random() * 900);
    finalSku = `${catPrefix}-PRD-${rand}`;
  }

  // Generate Barcode if omitted
  const finalBarcode = barcode || ('60' + Math.floor(1000000 + Math.random() * 9000000));

  try {
    const result = runTransaction(() => {
      const insertProd = run(`
        INSERT INTO products (
          name, sku, barcode, brand_id, category_id, subcategory, description,
          image_url, supplier_id, cost_price, selling_price, wholesale_price,
          min_stock_level, max_stock_level, reorder_level, unit, tax_rate, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `, [
        name, finalSku.toUpperCase(), finalBarcode, brand_id || null, category_id,
        subcategory || null, description || null, image_url || null, supplier_id || null,
        Number(cost_price), Number(selling_price), wholesale_price ? Number(wholesale_price) : null,
        min_stock_level ? Number(min_stock_level) : 10,
        max_stock_level ? Number(max_stock_level) : 200,
        reorder_level ? Number(reorder_level) : 15,
        unit || 'pcs', tax_rate !== undefined ? Number(tax_rate) : 0.05
      ]);

      const newId = Number(insertProd.lastInsertRowid);

      // Initialize branch inventory records for all branches
      const allBranches = queryAll(`SELECT id FROM branches`);
      for (const b of allBranches) {
        const initQty = (branch_id && Number(branch_id) === b.id && initial_stock) ? Number(initial_stock) : 0;
        run(`
          INSERT INTO inventory (product_id, branch_id, quantity, reserved_quantity, min_stock, max_stock, reorder_level)
          VALUES (?, ?, ?, 0, ?, ?, ?)
        `, [newId, b.id, initQty, min_stock_level || 10, max_stock_level || 200, reorder_level || 15]);

        if (initQty > 0) {
          // Add initial batch and movement
          const expDate = new Date();
          expDate.setFullYear(expDate.getFullYear() + 2); // 2 years default
          const expStr = expDate.toISOString().split('T')[0];

          run(`
            INSERT INTO inventory_batches (batch_number, product_id, branch_id, quantity, cost_price, expiry_date, supplier_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [`BAT-${Date.now().toString().slice(-6)}`, newId, b.id, initQty, Number(cost_price), expStr, supplier_id || null]);

          run(`
            INSERT INTO inventory_movements (product_id, branch_id, movement_type, quantity, previous_quantity, new_quantity, reference_type, reason)
            VALUES (?, ?, 'initial_stock', ?, 0, ?, 'initial_product_creation', 'Initial inventory entered during product setup')
          `, [newId, b.id, initQty, initQty]);
        }
      }

      logAudit({
        userName: req.headers['x-user-name'] || 'Admin',
        action: 'create_product',
        module: 'products',
        recordId: newId,
        newValue: { name, sku: finalSku, cost_price, selling_price }
      });

      return newId;
    });

    res.status(201).json({ id: result, message: 'Product created successfully', sku: finalSku });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A product with this SKU or Barcode already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/products/:id
 */
router.put('/:id', (req, res) => {
  const prodId = parseInt(req.params.id, 10);
  const {
    name, sku, barcode, brand_id, category_id, subcategory, description,
    image_url, supplier_id, cost_price, selling_price, wholesale_price,
    min_stock_level, max_stock_level, reorder_level, unit, tax_rate, status
  } = req.body;

  const existing = queryOne(`SELECT * FROM products WHERE id = ?`, [prodId]);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }

  try {
    run(`
      UPDATE products
      SET name = COALESCE(?, name),
          sku = COALESCE(?, sku),
          barcode = COALESCE(?, barcode),
          brand_id = COALESCE(?, brand_id),
          category_id = COALESCE(?, category_id),
          subcategory = COALESCE(?, subcategory),
          description = COALESCE(?, description),
          image_url = COALESCE(?, image_url),
          supplier_id = COALESCE(?, supplier_id),
          cost_price = COALESCE(?, cost_price),
          selling_price = COALESCE(?, selling_price),
          wholesale_price = COALESCE(?, wholesale_price),
          min_stock_level = COALESCE(?, min_stock_level),
          max_stock_level = COALESCE(?, max_stock_level),
          reorder_level = COALESCE(?, reorder_level),
          unit = COALESCE(?, unit),
          tax_rate = COALESCE(?, tax_rate),
          status = COALESCE(?, status)
      WHERE id = ?
    `, [
      name, sku, barcode, brand_id, category_id, subcategory, description,
      image_url, supplier_id, cost_price, selling_price, wholesale_price,
      min_stock_level, max_stock_level, reorder_level, unit, tax_rate, status,
      prodId
    ]);

    logAudit({
      userName: req.headers['x-user-name'] || 'Admin',
      action: 'update_product',
      module: 'products',
      recordId: prodId,
      previousValue: existing,
      newValue: req.body
    });

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
