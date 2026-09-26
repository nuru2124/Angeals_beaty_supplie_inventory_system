import express from 'express';
import { queryAll, queryOne, run } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { search, type } = req.query;
  let sql = `
    SELECT c.*,
           (SELECT COUNT(*) FROM sales s WHERE s.customer_id = c.id) as total_orders
    FROM customers c
    WHERE 1=1
  `;
  const params = [];
  if (type) {
    sql += ` AND c.customer_type = ?`;
    params.push(type);
  }
  if (search) {
    sql += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  sql += ` ORDER BY c.total_purchases DESC`;
  res.json(queryAll(sql, params));
});

router.get('/:id', (req, res) => {
  const custId = parseInt(req.params.id, 10);
  const customer = queryOne(`SELECT * FROM customers WHERE id = ?`, [custId]);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const salesHistory = queryAll(`
    SELECT s.id, s.invoice_number, s.total_amount, s.payment_method, s.created_at,
           b.name as branch_name
    FROM sales s
    JOIN branches b ON s.branch_id = b.id
    WHERE s.customer_id = ?
    ORDER BY s.created_at DESC
  `, [custId]);

  res.json({ ...customer, salesHistory });
});

router.post('/', (req, res) => {
  const { name, phone, email, address, customer_type = 'walk_in' } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });

  try {
    const result = run(
      `INSERT INTO customers (name, phone, email, address, customer_type)
       VALUES (?, ?, ?, ?, ?)`,
      [name, phone, email || null, address || null, customer_type]
    );
    res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Customer registered successfully' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'A customer with this phone number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
