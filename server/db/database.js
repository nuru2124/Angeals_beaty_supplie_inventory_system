import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'inventory.db');
const db = new DatabaseSync(dbPath);

// Initialize pragmas for high reliability and concurrency
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

/**
 * Execute a transaction atomically with BEGIN IMMEDIATE
 */
export function runTransaction(callback) {
  db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    const result = callback(db);
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch (_) {
      // rollback error ignore
    }
    throw error;
  }
}

/**
 * Query all rows
 */
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * Query a single row
 */
export function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params) || null;
}

/**
 * Run an INSERT/UPDATE/DELETE statement
 */
export function run(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * Helper to record immutable audit log entries
 */
export function logAudit({
  userId = null,
  userName = 'System',
  action,
  module,
  recordId = null,
  previousValue = null,
  newValue = null,
  branchId = null,
  ipAddress = '127.0.0.1'
}) {
  try {
    const prevStr = previousValue !== null ? (typeof previousValue === 'object' ? JSON.stringify(previousValue) : String(previousValue)) : null;
    const newStr = newValue !== null ? (typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)) : null;
    run(
      `INSERT INTO audit_logs (user_id, user_name, action, module, record_id, previous_value, new_value, branch_id, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, userName, action, module, String(recordId || ''), prevStr, newStr, branchId, ipAddress]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

/**
 * Helper to create an in-app notification
 */
export function createNotification({
  title,
  message,
  type = 'system',
  branchId = null,
  linkUrl = null
}) {
  try {
    return run(
      `INSERT INTO notifications (title, message, type, branch_id, link_url, is_read)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [title, message, type, branchId, linkUrl]
    );
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

export default db;
