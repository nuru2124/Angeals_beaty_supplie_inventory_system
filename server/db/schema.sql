-- Schema for Multi-Branch Beauty Products Inventory Management System

PRAGMA foreign_keys = ON;

-- 1. Branches
CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  manager_name TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive
  opening_date TEXT,
  operating_hours TEXT DEFAULT '8:00 AM - 8:00 PM',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roles
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE, -- super_admin, branch_manager, inventory_officer, cashier, accountant
  display_name TEXT NOT NULL,
  description TEXT
);

-- 3. Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, deactivated
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 4. User Branches (for RBAC multi-branch access)
CREATE TABLE IF NOT EXISTS user_branches (
  user_id INTEGER NOT NULL,
  branch_id INTEGER NOT NULL,
  is_primary INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, branch_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 5. Categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Brands
CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  country_of_origin TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  outstanding_balance REAL DEFAULT 0.0,
  status TEXT DEFAULT 'active', -- active, inactive
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Products
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT NOT NULL UNIQUE,
  brand_id INTEGER,
  category_id INTEGER NOT NULL,
  subcategory TEXT,
  description TEXT,
  image_url TEXT,
  supplier_id INTEGER,
  cost_price REAL NOT NULL,
  selling_price REAL NOT NULL,
  wholesale_price REAL,
  min_stock_level INTEGER DEFAULT 10,
  max_stock_level INTEGER DEFAULT 500,
  reorder_level INTEGER DEFAULT 15,
  unit TEXT DEFAULT 'pcs',
  tax_rate REAL DEFAULT 0.0, -- e.g. 0.15 for 15%
  discount_rate REAL DEFAULT 0.0,
  expiry_tracking INTEGER DEFAULT 1, -- 1 = yes, 0 = no
  batch_tracking INTEGER DEFAULT 1, -- 1 = yes, 0 = no
  status TEXT DEFAULT 'active', -- active, discontinued
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- 9. Branch-Specific Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  branch_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER,
  max_stock INTEGER,
  reorder_level INTEGER,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, branch_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- 10. Inventory Batches (FEFO Tracking)
CREATE TABLE IF NOT EXISTS inventory_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_number TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  branch_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  cost_price REAL NOT NULL,
  manufacturing_date TEXT,
  expiry_date TEXT NOT NULL, -- YYYY-MM-DD
  supplier_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- 11. Immutable Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  branch_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL, -- purchase, sale, transfer_in, transfer_out, return, damage, expired, adjustment, initial_stock, stocktake_correction
  quantity INTEGER NOT NULL, -- positive or negative
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reference_type TEXT, -- sale, po, transfer, adjustment, count
  reference_id TEXT,
  user_id INTEGER,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 12. Customers
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  address TEXT,
  customer_type TEXT DEFAULT 'walk_in', -- walk_in, regular, vip, wholesale
  total_purchases REAL DEFAULT 0.0,
  last_purchase_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Sales
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT NOT NULL UNIQUE,
  branch_id INTEGER NOT NULL,
  customer_id INTEGER,
  cashier_id INTEGER NOT NULL,
  subtotal REAL NOT NULL,
  discount_amount REAL DEFAULT 0.0,
  discount_percentage REAL DEFAULT 0.0,
  tax_amount REAL DEFAULT 0.0,
  total_amount REAL NOT NULL,
  payment_method TEXT NOT NULL, -- cash, mobile_money, card, bank_transfer, split
  payment_details TEXT, -- e.g. MoMo transaction reference
  amount_paid REAL NOT NULL,
  change_amount REAL DEFAULT 0.0,
  status TEXT DEFAULT 'completed', -- completed, refunded, partially_refunded, cancelled
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (cashier_id) REFERENCES users(id)
);

-- 14. Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  batch_id INTEGER,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  cost_price REAL NOT NULL, -- snapshot for profit calculation
  discount_amount REAL DEFAULT 0.0,
  tax_amount REAL DEFAULT 0.0,
  subtotal REAL NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (batch_id) REFERENCES inventory_batches(id)
);

-- 15. Product Returns
CREATE TABLE IF NOT EXISTS returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_number TEXT NOT NULL UNIQUE,
  sale_id INTEGER NOT NULL,
  branch_id INTEGER NOT NULL,
  processed_by INTEGER NOT NULL,
  approved_by INTEGER,
  total_refund REAL NOT NULL,
  status TEXT DEFAULT 'approved', -- pending_approval, approved, rejected
  reason TEXT NOT NULL, -- damaged, wrong_product, changed_mind, defective, other
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (processed_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 16. Return Items
CREATE TABLE IF NOT EXISTS return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id INTEGER NOT NULL,
  sale_item_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  refund_amount REAL NOT NULL,
  restock_inventory INTEGER DEFAULT 1, -- 1 = add back to stock, 0 = damaged/discard
  condition TEXT DEFAULT 'resellable', -- resellable, damaged
  FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
  FOREIGN KEY (sale_item_id) REFERENCES sale_items(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 17. Stock Transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transfer_number TEXT NOT NULL UNIQUE,
  source_branch_id INTEGER NOT NULL,
  destination_branch_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval', -- draft, pending_approval, approved, in_transit, received, rejected, cancelled
  requested_by INTEGER NOT NULL,
  approved_by INTEGER,
  received_by INTEGER,
  transfer_date DATETIME,
  received_date DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_branch_id) REFERENCES branches(id),
  FOREIGN KEY (destination_branch_id) REFERENCES branches(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (received_by) REFERENCES users(id)
);

-- 18. Stock Transfer Items
CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transfer_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  batch_id INTEGER,
  quantity_requested INTEGER NOT NULL,
  quantity_sent INTEGER DEFAULT 0,
  quantity_received INTEGER DEFAULT 0,
  unit_cost REAL,
  FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (batch_id) REFERENCES inventory_batches(id)
);

-- 19. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_number TEXT NOT NULL UNIQUE,
  supplier_id INTEGER NOT NULL,
  branch_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- draft, pending, approved, partially_received, received, cancelled
  total_cost REAL NOT NULL DEFAULT 0.0,
  expected_delivery_date TEXT,
  created_by INTEGER NOT NULL,
  approved_by INTEGER,
  received_by INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  received_at DATETIME,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  FOREIGN KEY (received_by) REFERENCES users(id)
);

-- 20. Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  cost_price REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 21. Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  adjustment_number TEXT NOT NULL UNIQUE,
  branch_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  batch_id INTEGER,
  type TEXT NOT NULL, -- increase, decrease
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL, -- damaged, expired, lost, theft, counting_error, system_error, other
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  requested_by INTEGER NOT NULL,
  approved_by INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (batch_id) REFERENCES inventory_batches(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 22. Stocktaking / Physical Stock Counts
CREATE TABLE IF NOT EXISTS stock_counts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  count_number TEXT NOT NULL UNIQUE,
  branch_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, reconciled, cancelled
  counted_by INTEGER NOT NULL,
  reconciled_by INTEGER,
  total_variance_units INTEGER DEFAULT 0,
  total_variance_value REAL DEFAULT 0.0,
  notes TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (counted_by) REFERENCES users(id),
  FOREIGN KEY (reconciled_by) REFERENCES users(id)
);

-- 23. Stock Count Items
CREATE TABLE IF NOT EXISTS stock_count_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  count_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  system_quantity INTEGER NOT NULL,
  physical_quantity INTEGER NOT NULL,
  variance INTEGER NOT NULL, -- physical - system
  unit_cost REAL NOT NULL,
  variance_value REAL NOT NULL,
  notes TEXT,
  FOREIGN KEY (count_id) REFERENCES stock_counts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 24. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_number TEXT NOT NULL UNIQUE,
  branch_id INTEGER NOT NULL,
  category TEXT NOT NULL, -- electricity, rent, internet, transportation, salaries, packaging, maintenance, marketing, other
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  recorded_by INTEGER NOT NULL,
  receipt_ref TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- 25. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- low_stock, expiry_warning, expired, transfer, purchase_order, adjustment, system
  branch_id INTEGER,
  link_url TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 26. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  user_name TEXT,
  action TEXT NOT NULL, -- e.g. create_sale, approve_transfer, update_price, login
  module TEXT NOT NULL, -- sales, inventory, transfers, products, users, auth, settings
  record_id TEXT,
  previous_value TEXT,
  new_value TEXT,
  branch_id INTEGER,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- 27. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_inventory_product_branch ON inventory(product_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_product_branch ON inventory_batches(product_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_movements_prod_branch ON inventory_movements(product_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_branch_date ON sales(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
