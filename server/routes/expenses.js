import express from 'express';
import { queryAll, queryOne, run } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { branch_id, category, date_from, date_to } = req.query;
  let sql = `
    SELECT e.*,
           b.name as branch_name, b.code as branch_code,
           u.name as recorded_by_name
    FROM expenses e
    JOIN branches b ON e.branch_id = b.id
    JOIN users u ON e.recorded_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (branch_id) {
    sql += ` AND e.branch_id = ?`;
    params.push(branch_id);
  }

  if (category) {
    sql += ` AND e.category = ?`;
    params.push(category);
  }

  if (date_from) {
    sql += ` AND e.date >= ?`;
    params.push(date_from);
  }

  if (date_to) {
    sql += ` AND e.date <= ?`;
    params.push(date_to);
  }

  sql += ` ORDER BY e.date DESC, e.created_at DESC`;
  res.json(queryAll(sql, params));
});

router.post('/', (req, res) => {
  const { branch_id, category, amount, date, description, recorded_by = 1, receipt_ref } = req.body;
  if (!branch_id || !category || !amount || !date) {
    return res.status(400).json({ error: 'Branch, category, amount, and date are required' });
  }

  try {
    const expNum = `EXP-${Date.now().toString().slice(-6)}`;
    const result = run(
      `INSERT INTO expenses (expense_number, branch_id, category, amount, date, description, recorded_by, receipt_ref)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [expNum, branch_id, category, parseFloat(amount), date, description || null, recorded_by, receipt_ref || null]
    );

    res.status(201).json({ id: Number(result.lastInsertRowid), expense_number: expNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
