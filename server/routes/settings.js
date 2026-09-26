import express from 'express';
import { queryAll, run, logAudit } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const rows = queryAll(`SELECT * FROM system_settings`);
  const settings = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  res.json({ settings, raw: rows });
});

router.put('/', (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Settings object is required' });
  }

  for (const key of Object.keys(settings)) {
    const val = String(settings[key]);
    run(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      [key, val]
    );
  }

  logAudit({
    userName: req.headers['x-user-name'] || 'Admin',
    action: 'update_settings',
    module: 'settings',
    newValue: settings
  });

  res.json({ success: true, message: 'Settings saved successfully' });
});

export default router;
