import db, { run, queryOne } from './database.js';
import { hashPassword } from '../utils/crypto.js';

console.log('====================================================');
console.log('✨ Initializing Angales Beauty Supplies for Production');
console.log('====================================================');

// Disable foreign keys during cleanup
db.exec('PRAGMA foreign_keys = OFF;');

const tablesToClear = [
  'return_items',
  'returns',
  'sale_items',
  'sales',
  'stock_transfer_items',
  'stock_transfers',
  'purchase_order_items',
  'purchase_orders',
  'stock_count_items',
  'stock_counts',
  'stock_adjustments',
  'inventory_movements',
  'inventory_batches',
  'inventory',
  'customers',
  'expenses',
  'notifications',
  'audit_logs',
  'user_branches',
  'users',
  'products',
  'suppliers',
  'brands',
  'categories',
  'branches',
  'roles',
  'system_settings'
];

for (const table of tablesToClear) {
  try {
    db.exec(`DELETE FROM ${table};`);
  } catch (err) {
    console.warn(`Note: Could not clear ${table}: ${err.message}`);
  }
}

// Reset SQLite auto-increment counters
try {
  db.exec(`DELETE FROM sqlite_sequence;`);
} catch (_) {}

// Re-enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// 1. Roles
console.log('Setting up enterprise roles...');
const roles = [
  { name: 'super_admin', display_name: 'Super Admin', description: 'Complete system access across all branches' },
  { name: 'branch_manager', display_name: 'Branch Manager', description: 'Manage branch inventory, staff, sales, and transfers' },
  { name: 'inventory_officer', display_name: 'Inventory Officer', description: 'Manage stock movements, physical counts, and receiving' },
  { name: 'cashier', display_name: 'Sales Cashier', description: 'Front-desk point of sale terminal and customer receipts' },
  { name: 'accountant', display_name: 'Accountant', description: 'Financial ledger, audit logs, expenses, and business analytics' }
];

for (const r of roles) {
  run(
    `INSERT INTO roles (name, display_name, description) VALUES (?, ?, ?)`,
    [r.name, r.display_name, r.description]
  );
}

const superAdminRole = queryOne(`SELECT id FROM roles WHERE name = 'super_admin'`);

// 2. Foundational Beauty Categories
console.log('Configuring clean beauty categories...');
const categories = [
  { name: 'Hair Care & Extensions', slug: 'hair-care', description: 'Wigs, weaves, shampoos, conditioners, oils & treatments' },
  { name: 'Skin Care & Dermatology', slug: 'skin-care', description: 'Cleansers, toners, serums, moisturizers & sunscreens' },
  { name: 'Cosmetics & Makeup', slug: 'cosmetics-makeup', description: 'Foundations, concealers, lipsticks, palettes & setting sprays' },
  { name: 'Fragrances & Perfumes', slug: 'fragrances', description: 'Authentic designer perfumes, body mists & Arabian oud oils' },
  { name: 'Nail Care & Art', slug: 'nail-care', description: 'Gel polishes, acrylics, UV lamps, nail tips & manicure tools' },
  { name: 'Salon Tools & Equipment', slug: 'salon-tools', description: 'Professional hair dryers, clippers, straighteners & chairs' },
  { name: 'Body Care & Bath', slug: 'body-care', description: 'Body washes, scrubs, lotions, butters & deodorants' }
];

for (const c of categories) {
  run(
    `INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)`,
    [c.name, c.slug, c.description]
  );
}

// 3. System Settings
console.log('Applying production system settings & tax policies...');
const initialSettings = {
  company_name: 'Angales Beauty Supplies Ltd',
  currency_code: 'GHS',
  currency_symbol: 'GH₵',
  vat_rate: '0.05',
  max_cashier_discount: '10',
  max_manager_discount: '30',
  low_stock_default_threshold: '15',
  expiry_warning_days: '90',
  receipt_header: 'ANGALES BEAUTY SUPPLIES\nLuxury Cosmetics, Hair & Beauty Haven\nAccra, Ghana\nTel: +233 24 111 2233',
  receipt_footer: 'Thank you for choosing Angales Beauty!\nGoods sold in good condition are exchangeable within 7 days.'
};

for (const [key, value] of Object.entries(initialSettings)) {
  run(
    `INSERT INTO system_settings (key, value) VALUES (?, ?)`,
    [key, value]
  );
}

// 4. Primary Branch
console.log('Creating primary flagship branch...');
const branchResult = run(
  `INSERT INTO branches (name, code, address, phone, email, manager_name, status, operating_hours)
   VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
  [
    'Angales Beauty Supplies - Accra Flagship',
    'ACC-HQ',
    'Kwame Nkrumah Avenue, Adabraka, Accra, Ghana',
    '+233 24 111 2233',
    'info@angalesbeauty.com',
    'Administrator',
    '8:00 AM - 8:00 PM'
  ]
);
const mainBranchId = Number(branchResult.lastInsertRowid);

// 5. Secure Super Admin User
console.log('Provisioning encrypted Super Admin account...');
const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@Angales2026!';
const adminPasswordHash = hashPassword(initialAdminPassword);

const adminResult = run(
  `INSERT INTO users (name, email, password_hash, role_id, phone, status)
   VALUES (?, ?, ?, ?, ?, 'active')`,
  [
    'Angales Super Admin',
    'admin@angales.com',
    adminPasswordHash,
    superAdminRole.id,
    '+233 24 111 2233'
  ]
);
const adminId = Number(adminResult.lastInsertRowid);

// Link admin to branch
run(
  `INSERT INTO user_branches (user_id, branch_id, is_primary) VALUES (?, ?, 1)`,
  [adminId, mainBranchId]
);

// Record initial audit log
run(
  `INSERT INTO audit_logs (user_id, user_name, action, module, record_id, new_value, branch_id, ip_address)
   VALUES (?, ?, 'production_init', 'system', '1', 'Clean production initialization completed', ?, '127.0.0.1')`,
  [adminId, 'Angales Super Admin', mainBranchId]
);

console.log('====================================================');
console.log('✅ PRODUCTION READY: Clean Database Initialized!');
console.log('====================================================');
console.log('👑 Super Admin Email:    admin@angales.com');
console.log(`🔑 Super Admin Password: ${initialAdminPassword}`);
console.log('🏢 Primary Branch:       ACC-HQ (Accra Flagship)');
console.log('🛡️  Password Hash:       scrypt with 16-byte salt');
console.log('🧹 Dummy Data Status:    CLEARED (0 sales, 0 dummy items)');
console.log('====================================================');
