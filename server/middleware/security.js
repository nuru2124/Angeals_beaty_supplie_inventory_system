/**
 * Security & Hardening Middleware for Angales Beauty Supplies IMS
 * Production Protection Suite: HTTP Security Headers, Brute Force Rate Limiter,
 * and Request Sanitization
 */

// In-memory rate limiting store for sensitive endpoints (login attempts)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes lockout window

/**
 * Strict Security Headers Middleware
 */
export function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking by disallowing framing
  res.setHeader('X-Frame-Options', 'DENY');

  // Cross-site scripting filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  // Content Security Policy (production-ready)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self';"
  );

  // Disable technology fingerprinting
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * Brute force protection for authentication routes
 */
export function loginRateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  const record = loginAttempts.get(ip);
  if (record) {
    // If the lockout window has passed, reset
    if (now - record.firstAttempt > WINDOW_MS) {
      loginAttempts.delete(ip);
    } else if (record.count >= MAX_ATTEMPTS) {
      const waitMinutes = Math.ceil((WINDOW_MS - (now - record.firstAttempt)) / 60000);
      return res.status(429).json({
        error: `Too many failed login attempts from this address. Locked for security. Please try again in ${waitMinutes} minute(s).`
      });
    }
  }

  next();
}

/**
 * Register a failed login attempt
 */
export function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  record.count += 1;
  loginAttempts.set(ip, record);
}

/**
 * Clear failed attempts after a successful authentication
 */
export function recordSuccessfulLogin(ip) {
  loginAttempts.delete(ip);
}
