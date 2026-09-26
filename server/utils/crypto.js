import crypto from 'node:crypto';

// Get or fallback to secure secrets
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  : crypto.randomBytes(32);

/**
 * Hash a plain text password using cryptographic scrypt with a unique 16-byte salt
 * Format: scrypt$<salt_hex>$<derived_key_hex>
 */
export function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password.normalize(), salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Verify a plain text password against a stored cryptographic hash
 * Uses crypto.timingSafeEqual to prevent side-channel timing attacks
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;

  try {
    if (storedHash.startsWith('scrypt$')) {
      const parts = storedHash.split('$');
      if (parts.length !== 3) return false;
      const [, salt, originalHex] = parts;
      const keyBuffer = Buffer.from(originalHex, 'hex');
      const testBuffer = crypto.scryptSync(password.normalize(), salt, 64);
      if (keyBuffer.length !== testBuffer.length) return false;
      return crypto.timingSafeEqual(keyBuffer, testBuffer);
    }

    // Fallback constant-time check for legacy unhashed strings during transition
    const userBuf = Buffer.from(password);
    const storedBuf = Buffer.from(storedHash);
    if (userBuf.length === storedBuf.length) {
      return crypto.timingSafeEqual(userBuf, storedBuf);
    }
    return false;
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Create a base64url encoded string
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decode a base64url string
 */
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Issue a cryptographically signed authentication token
 */
export function signToken(payload, expiresInMs = 24 * 60 * 60 * 1000) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Date.now() + expiresInMs;
  const tokenPayload = { ...payload, exp, iat: Date.now() };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  const signatureData = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureData)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureData}.${signature}`;
}

/**
 * Verify and decode an authentication token
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is missing or invalid');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token structure');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureData = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureData)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigBuf = Buffer.from(signature);
  const expSigBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  if (payload.exp && Date.now() > payload.exp) {
    throw new Error('Token has expired');
  }

  return payload;
}

/**
 * High-grade AES-256-GCM encryption for sensitive data at rest
 * Returns format: iv_hex:tag_hex:cipher_hex
 */
export function encryptData(plainText) {
  if (!plainText) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(String(plainText), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt data encrypted with AES-256-GCM
 */
export function decryptData(cipherString) {
  if (!cipherString) return '';
  try {
    const [ivHex, tagHex, encryptedHex] = cipherString.split(':');
    if (!ivHex || !tagHex || !encryptedHex) return cipherString;
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      ENCRYPTION_KEY,
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return null;
  }
}
