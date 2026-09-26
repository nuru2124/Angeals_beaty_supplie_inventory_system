import express from 'express';
import { queryAll } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { module, user_id, branch_id, search, limit = 100 } = req.query;

  let sql = `
    SELECT a.*,
           b.name as branch_name, b.code as branch_code
    FROM audit_logs a
    LEFT JOIN branches b ON a.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (module) {
    sql += ` AND a.module = ?`;
    params.push(module);
  }

  if (user_id) {
    sql += ` AND a.user_id = ?`;
    params.push(user_id);
  }

  if (branch_id) {
    sql += ` AND a.branch_id = ?`;
    params.push(branch_id);
  }

  if (search) {
    sql += ` AND (a.action LIKE ? OR a.user_name LIKE ? OR a.record_id LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  sql += ` ORDER BY a.created_at DESC LIMIT ?`;
  params.push(parseInt(limit, 10));

  res.json(queryAll(sql, params));
});

export default router;
