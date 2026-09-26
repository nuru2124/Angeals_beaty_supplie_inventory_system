import express from 'express';
import { queryAll, run } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { branch_id } = req.query;
  let sql = `
    SELECT n.*, b.name as branch_name
    FROM notifications n
    LEFT JOIN branches b ON n.branch_id = b.id
    WHERE 1=1
  `;
  const params = [];
  if (branch_id) {
    sql += ` AND (n.branch_id = ? OR n.branch_id IS NULL)`;
    params.push(branch_id);
  }
  sql += ` ORDER BY n.created_at DESC LIMIT 50`;

  const notifications = queryAll(sql, params);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  res.json({ notifications, unreadCount });
});

router.post('/:id/read', (req, res) => {
  const notifId = parseInt(req.params.id, 10);
  run(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [notifId]);
  res.json({ success: true });
});

router.post('/read-all', (req, res) => {
  run(`UPDATE notifications SET is_read = 1`);
  res.json({ success: true });
});

export default router;
