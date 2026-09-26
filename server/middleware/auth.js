import { verifyToken } from '../utils/crypto.js';
import { queryOne, queryAll } from '../db/database.js';

/**
 * Authentication Middleware
 * Validates cryptographically signed Bearer token
 * Attaches verified user and authorized branch IDs to req.user
 */
export function authenticateToken(req, res, next) {
  // Allow public endpoints
  if (
    req.path === '/login' ||
    req.path === '/api/auth/login' ||
    req.path === '/api/health'
  ) {
    return next();
  }

  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
  let token = null;

  if (authHeader && typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in with your credentials.'
    });
  }

  try {
    const decoded = verifyToken(token);

    // Verify user is still active in the database
    const user = queryOne(
      `SELECT u.id, u.name, u.email, u.role_id, u.status,
              r.name as role_name, r.display_name as role_display
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'User account is inactive or revoked.' });
    }

    // Fetch assigned branches
    const userBranches = queryAll(
      `SELECT b.id, b.name, b.code, ub.is_primary
       FROM user_branches ub
       JOIN branches b ON ub.branch_id = b.id
       WHERE ub.user_id = ?`,
      [user.id]
    );

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name,
      roleDisplay: user.role_display,
      branches: userBranches,
      branchIds: userBranches.map((b) => b.id)
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: err.message || 'Invalid or expired authentication session. Please sign in again.'
    });
  }
}

/**
 * Role-Based Access Control (RBAC) Guard
 * Ensures req.user has one of the allowed roles
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access Denied: Your role (${req.user.roleDisplay}) is not authorized to access this operational resource.`
      });
    }

    next();
  };
}

/**
 * Branch Authorization Guard
 * Ensures staff can only operate within their assigned branch (Super Admins have universal HQ access)
 */
export function requireBranchAccess(getBranchId = (req) => req.query.branch_id || req.body.branch_id) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Super Admin has universal access to all company branches
    if (req.user.role === 'super_admin') {
      return next();
    }

    const branchId = getBranchId(req);
    // If no specific branch was requested, allow through
    if (!branchId) {
      return next();
    }

    const targetBranchId = Number(branchId);
    if (!req.user.branchIds.includes(targetBranchId)) {
      return res.status(403).json({
        error: 'Access Denied: You are not assigned to perform operations for this branch.'
      });
    }

    next();
  };
}
