import express from 'express';
import { queryAll, queryOne, run, logAudit } from '../db/database.js';
import { hashPassword } from '../utils/crypto.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All user management routes require Super Admin access
router.use(authenticateToken);
router.use(requireRole(['super_admin']));

/**
 * GET /api/users
 * List all users with roles and assigned branches
 */
router.get('/', (req, res) => {
  const users = queryAll(`
    SELECT u.id, u.name, u.email, u.phone, u.status, u.last_login, u.created_at,
           u.role_id, r.name as role_name, r.display_name as role_display
    FROM users u
    JOIN roles r ON u.role_id = r.id
    ORDER BY u.id ASC
  `);

  const userBranches = queryAll(`
    SELECT ub.user_id, ub.branch_id, ub.is_primary, b.name as branch_name, b.code as branch_code
    FROM user_branches ub
    JOIN branches b ON ub.branch_id = b.id
  `);

  const usersWithBranches = users.map((u) => {
    const branches = userBranches.filter((ub) => ub.user_id === u.id);
    return {
      ...u,
      branches
    };
  });

  res.json(usersWithBranches);
});

/**
 * GET /api/users/roles
 * List all system roles
 */
router.get('/roles', (req, res) => {
  const roles = queryAll(`SELECT * FROM roles ORDER BY id ASC`);
  res.json(roles);
});

/**
 * POST /api/users
 * Create a new user with salted cryptographic password hash and branch assignment
 */
router.post('/', (req, res) => {
  const { name, email, password, role_id, phone, branch_ids, is_primary_branch } = req.body;

  if (!name || !email || !password || !role_id) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = queryOne(`SELECT id FROM users WHERE LOWER(email) = ?`, [normalizedEmail]);
  if (existing) {
    return res.status(400).json({ error: 'A user with this email address already exists.' });
  }

  const hashedPassword = hashPassword(password);

  try {
    const result = run(
      `INSERT INTO users (name, email, password_hash, role_id, phone, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [name.trim(), normalizedEmail, hashedPassword, parseInt(role_id, 10), phone || null]
    );

    const newUserId = Number(result.lastInsertRowid);

    // Assign branches
    if (Array.isArray(branch_ids) && branch_ids.length > 0) {
      for (const branchId of branch_ids) {
        const isPrimary = Number(branchId) === Number(is_primary_branch) ? 1 : 0;
        run(
          `INSERT OR IGNORE INTO user_branches (user_id, branch_id, is_primary)
           VALUES (?, ?, ?)`,
          [newUserId, Number(branchId), isPrimary]
        );
      }
    }

    logAudit({
      userId: req.user.id,
      userName: req.user.name,
      action: 'create_user',
      module: 'users',
      recordId: newUserId,
      newValue: { name, email: normalizedEmail, role_id },
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(201).json({ id: newUserId, message: 'User account created successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/users/:id
 * Update user details, role, status, or branch assignments
 */
router.put('/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { name, role_id, phone, status, branch_ids, is_primary_branch } = req.body;

  const existing = queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
  if (!existing) {
    return res.status(404).json({ error: 'User not found.' });
  }

  run(
    `UPDATE users
     SET name = COALESCE(?, name),
         role_id = COALESCE(?, role_id),
         phone = COALESCE(?, phone),
         status = COALESCE(?, status)
     WHERE id = ?`,
    [
      name ? name.trim() : null,
      role_id ? parseInt(role_id, 10) : null,
      phone !== undefined ? phone : null,
      status || null,
      userId
    ]
  );

  // Update branch assignments if provided
  if (Array.isArray(branch_ids)) {
    run(`DELETE FROM user_branches WHERE user_id = ?`, [userId]);
    for (const bId of branch_ids) {
      const isPrimary = Number(bId) === Number(is_primary_branch) ? 1 : 0;
      run(
        `INSERT INTO user_branches (user_id, branch_id, is_primary)
         VALUES (?, ?, ?)`,
        [userId, Number(bId), isPrimary]
      );
    }
  }

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    action: 'update_user',
    module: 'users',
    recordId: userId,
    newValue: req.body,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ message: 'User updated successfully.' });
});

/**
 * PUT /api/users/:id/reset-password
 * Reset password for a specific user
 */
router.put('/:id/reset-password', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const existing = queryOne(`SELECT id, name FROM users WHERE id = ?`, [userId]);
  if (!existing) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const hashedPassword = hashPassword(newPassword);
  run(`UPDATE users SET password_hash = ? WHERE id = ?`, [hashedPassword, userId]);

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    action: 'reset_user_password',
    module: 'users',
    recordId: userId,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ message: `Password for ${existing.name} has been reset successfully.` });
});

export default router;
