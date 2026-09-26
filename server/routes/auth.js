import express from 'express';
import { queryOne, queryAll, run, logAudit } from '../db/database.js';
import { verifyPassword, hashPassword, signToken } from '../utils/crypto.js';
import { loginRateLimiter, recordFailedLogin, recordSuccessfulLogin } from '../middleware/security.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Real-world secure authentication with rate-limiting, salted cryptographic password verification,
 * and signed session token generation
 */
router.post('/login', loginRateLimiter, (req, res) => {
  const { email, password } = req.body;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = queryOne(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role_id, u.status,
            r.name as role_name, r.display_name as role_display
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE LOWER(u.email) = ?`,
    [normalizedEmail]
  );

  if (!user) {
    recordFailedLogin(clientIp);
    logAudit({
      userId: null,
      userName: normalizedEmail,
      action: 'login_failed',
      module: 'auth',
      recordId: null,
      newValue: 'User not found',
      ipAddress: clientIp
    });
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'This user account has been deactivated. Contact Super Admin.' });
  }

  const isPasswordValid = verifyPassword(password, user.password_hash);

  if (!isPasswordValid) {
    recordFailedLogin(clientIp);
    logAudit({
      userId: user.id,
      userName: user.name,
      action: 'login_failed',
      module: 'auth',
      recordId: user.id,
      newValue: 'Incorrect password',
      ipAddress: clientIp
    });
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // Clear rate limit tracking on success
  recordSuccessfulLogin(clientIp);

  // Update last login timestamp
  run(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);

  // Fetch authorized branches
  const branches = queryAll(
    `SELECT b.id, b.name, b.code, ub.is_primary
     FROM user_branches ub
     JOIN branches b ON ub.branch_id = b.id
     WHERE ub.user_id = ?`,
    [user.id]
  );

  // Generate cryptographically signed token
  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role_name,
    roleDisplay: user.role_display,
    branchIds: branches.map((b) => b.id)
  });

  logAudit({
    userId: user.id,
    userName: user.name,
    action: 'login_success',
    module: 'auth',
    recordId: user.id,
    ipAddress: clientIp
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name,
      roleDisplay: user.role_display,
      branches
    }
  });
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile verified by cryptographic token
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      roleDisplay: req.user.roleDisplay,
      branches: req.user.branches
    }
  });
});

/**
 * POST /api/auth/change-password
 * Secure password change for authenticated users
 */
router.post('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  const user = queryOne(`SELECT password_hash FROM users WHERE id = ?`, [req.user.id]);
  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  const newHash = hashPassword(newPassword);
  run(`UPDATE users SET password_hash = ? WHERE id = ?`, [newHash, req.user.id]);

  logAudit({
    userId: req.user.id,
    userName: req.user.name,
    action: 'change_password',
    module: 'auth',
    recordId: req.user.id,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, message: 'Password updated successfully.' });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Signed out securely.' });
});

export default router;
