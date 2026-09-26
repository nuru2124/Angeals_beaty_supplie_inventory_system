import db, { run, queryAll, queryOne } from './database.js';

console.log('Seeding Multi-Branch Beauty Products Inventory Management System database...');

// Clean existing data
const tables = [
  'return_items', 'returns', 'sale_items', 'sales',
  'stock_transfer_items', 'stock_transfers',
  'purchase_order_items', 'purchase_orders',
  'stock_count_items', 'stock_counts',
  'stock_adjustments', 'inventory_movements',
  'inventory_batches', 'inventory',
  'products', 'categories', 'brands', 'suppliers', 'customers',
  'expenses', 'notifications', 'audit_logs', 'system_settings',
  'user_branches', 'users', 'roles', 'branches'
];

db.exec('PRAGMA foreign_keys = OFF;');
for (const table of tables) {
  try {
    db.exec(`DELETE FROM ${table};`);
  } catch (err) {
    // ignore
  }
}
db.exec('PRAGMA foreign_keys = ON;');

// 1. Seed Branches
const branchesData = [
  {
    name: 'Accra Main Flagship',
    code: 'ACC-001',
    address: 'Kwame Nkrumah Avenue, Adabraka, Accra',
    phone: '+233 24 111 2233',
    email: 'accra.flagship@angalesbeauty.com',
    manager_name: 'Ama Serwaa',
    status: 'active',
    opening_date: '2023-01-15',
    operating_hours: '8:00 AM - 9:00 PM'
  },
  {
    name: 'Kumasi City Mall',
    code: 'KMS-002',
    address: 'Lake Road, Asokwa, Kumasi',
    phone: '+233 20 444 5566',
    email: 'kumasi.mall@angalesbeauty.com',
    manager_name: 'Kwabena Mensah',
    status: 'active',
    opening_date: '2023-06-01',
    operating_hours: '9:00 AM - 8:30 PM'
  },
  {
    name: 'Takoradi Harbor Branch',
    code: 'TKD-003',
    address: 'Market Circle Commercial Area, Takoradi',
    phone: '+233 27 777 8899',
    email: 'takoradi@angalesbeauty.com',
    manager_name: 'Esi Mansa',
    status: 'active',
    opening_date: '2024-02-10',
    operating_hours: '8:30 AM - 7:30 PM'
  },
  {
    name: 'Tamale Central Branch',
    code: 'TML-004',
    address: 'Bolga Road, Central Business District, Tamale',
    phone: '+233 26 333 4455',
    email: 'tamale@angalesbeauty.com',
    manager_name: 'Ibrahim Yakubu',
    status: 'active',
    opening_date: '2024-08-20',
    operating_hours: '8:00 AM - 7:00 PM'
  }
];

const branchIds = {};
for (const b of branchesData) {
  const result = run(
    `INSERT INTO branches (name, code, address, phone, email, manager_name, status, opening_date, operating_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [b.name, b.code, b.address, b.phone, b.email, b.manager_name, b.status, b.opening_date, b.operating_hours]
  );
  branchIds[b.code] = Number(result.lastInsertRowid);
}

// 2. Seed Roles
const rolesData = [
  { name: 'super_admin', display_name: 'Super Admin', description: 'Complete system access across all branches' },
  { name: 'branch_manager', display_name: 'Branch Manager', description: 'Manage branch inventory, staff, sales and transfers' },
  { name: 'inventory_officer', display_name: 'Inventory Officer', description: 'Manage inventory movements, stock counts and receiving' },
  { name: 'cashier', display_name: 'Sales Staff / Cashier', description: 'Point of sale checkout, barcode scanning, customer register' },
  { name: 'accountant', display_name: 'Accountant', description: 'Financial reports, P&L, sales summaries, and expense management' }
];

const roleIds = {};
for (const r of rolesData) {
  const res = run(
    `INSERT INTO roles (name, display_name, description) VALUES (?, ?, ?)`,
    [r.name, r.display_name, r.description]
  );
  roleIds[r.name] = Number(res.lastInsertRowid);
}

// 3. Seed Users
const usersData = [
  {
    name: 'Admin Angela Boateng',
    email: 'admin@angales.com',
    role: 'super_admin',
    phone: '+233 24 555 0100',
    branches: ['ACC-001', 'KMS-002', 'TKD-003', 'TML-004']
  },
  {
    name: 'Ama Serwaa',
    email: 'manager.accra@angales.com',
    role: 'branch_manager',
    phone: '+233 24 111 2233',
    branches: ['ACC-001']
  },
  {
    name: 'Kwabena Mensah',
    email: 'manager.kumasi@angales.com',
    role: 'branch_manager',
    phone: '+233 20 444 5566',
    branches: ['KMS-002']
  },
  {
    name: 'Kofi Asante',
    email: 'inventory@angales.com',
    role: 'inventory_officer',
    phone: '+233 24 888 3322',
    branches: ['ACC-001', 'KMS-002']
  },
  {
    name: 'Akua Donkor',
    email: 'cashier.accra@angales.com',
    role: 'cashier',
    phone: '+233 55 999 1122',
    branches: ['ACC-001']
  },
  {
    name: 'Yaw Osei',
    email: 'accountant@angales.com',
    role: 'accountant',
    phone: '+233 24 777 4411',
    branches: ['ACC-001', 'KMS-002', 'TKD-003', 'TML-004']
  }
];

const userIds = {};
for (const u of usersData) {
  // Demo password 'password123'
  const res = run(
    `INSERT INTO users (name, email, password_hash, role_id, phone, status)
     VALUES (?, ?, 'password123', ?, ?, 'active')`,
    [u.name, u.email, roleIds[u.role], u.phone]
  );
  const uid = Number(res.lastInsertRowid);
  userIds[u.email] = uid;

  for (const bCode of u.branches) {
    run(
      `INSERT INTO user_branches (user_id, branch_id, is_primary) VALUES (?, ?, 1)`,
      [uid, branchIds[bCode]]
    );
  }
}

// 4. Seed Categories
const categoriesData = [
  { name: 'Skincare', slug: 'skincare', description: 'Facial cleansers, moisturizers, serums, toners, and sunscreens' },
  { name: 'Hair Care', slug: 'hair-care', description: 'Shampoos, conditioners, natural oils, creams, and wig care' },
  { name: 'Makeup', slug: 'makeup', description: 'Foundations, concealers, powders, lipsticks, and eye cosmetics' },
  { name: 'Fragrance', slug: 'fragrance', description: 'Luxury perfumes, eau de parfum, body mists, and deodorants' },
  { name: 'Body Care', slug: 'body-care', description: 'Nourishing body lotions, washes, scrubs, and African black soaps' },
  { name: 'Nails', slug: 'nails', description: 'Gel polishes, nail strengtheners, tips, and manicure kits' },
  { name: 'Accessories', slug: 'accessories', description: 'Beauty blenders, brush sets, hair rollers, and styling tools' }
];

const categoryIds = {};
for (const c of categoriesData) {
  const res = run(
    `INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)`,
    [c.name, c.slug, c.description]
  );
  categoryIds[c.slug] = Number(res.lastInsertRowid);
}

// 5. Seed Brands
const brandsData = [
  { name: 'CeraVe', country: 'USA' },
  { name: 'The Ordinary', country: 'Canada' },
  { name: 'Fenty Beauty', country: 'USA' },
  { name: 'Maybelline New York', country: 'USA' },
  { name: 'Shea Moisture', country: 'USA' },
  { name: 'Dior', country: 'France' },
  { name: 'Carol’s Daughter', country: 'USA' },
  { name: 'Neutrogena', country: 'USA' },
  { name: 'Black Opal', country: 'USA' },
  { name: 'OPI', country: 'USA' },
  { name: 'La Roche-Posay', country: 'France' },
  { name: 'Golden Shea Ghana', country: 'Ghana' }
];

const brandIds = {};
for (const b of brandsData) {
  const res = run(`INSERT INTO brands (name, country_of_origin) VALUES (?, ?)`, [b.name, b.country]);
  brandIds[b.name] = Number(res.lastInsertRowid);
}

// 6. Seed Suppliers
const suppliersData = [
  {
    name: 'ABC Cosmetics West Africa',
    company: 'ABC Cosmetics Ghana Ltd',
    phone: '+233 30 255 1200',
    email: 'orders@abccosmeticsgh.com',
    address: 'Plot 42, Spintex Road, Accra',
    contact: 'Selasi Gbedemah',
    terms: 'Net 30',
    balance: 4500.00
  },
  {
    name: 'L’Oréal Official Distributor Ghana',
    company: 'Luxe Brands Agency GH',
    phone: '+233 30 277 3400',
    email: 'distribution@luxebrandsgh.com',
    address: 'Airport Residential Area, Accra',
    contact: 'Nana Yaa Kuffour',
    terms: 'Net 15',
    balance: 8200.00
  },
  {
    name: 'Golden Shea Essentials Ghana',
    company: 'Golden Shea Manufacturing Ltd',
    phone: '+233 32 201 8900',
    email: 'sales@goldensheagh.com',
    address: 'Industrial Area, Asokwa, Kumasi',
    contact: 'Akosua Adomako',
    terms: 'Cash on Delivery',
    balance: 0.00
  },
  {
    name: 'Global Fragrances & Scents GH',
    company: 'Scent Haven Logistics',
    phone: '+233 30 299 4500',
    email: 'import@scenthaven.gh',
    address: 'Cantonments Road, Osu, Accra',
    contact: 'David Lamptey',
    terms: 'Net 30',
    balance: 12500.00
  }
];

const supplierIds = {};
for (const s of suppliersData) {
  const res = run(
    `INSERT INTO suppliers (name, company_name, phone, email, address, contact_person, payment_terms, outstanding_balance)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [s.name, s.company, s.phone, s.email, s.address, s.contact, s.terms, s.balance]
  );
  supplierIds[s.name] = Number(res.lastInsertRowid);
}

// 7. Seed 34 Realistic Beauty Products
const productsData = [
  // Skincare
  {
    name: 'CeraVe Hydrating Facial Cleanser 473ml',
    sku: 'SKIN-CER-001',
    barcode: '601001001',
    brand: 'CeraVe',
    category: 'skincare',
    subcategory: 'Cleanser',
    cost: 160.00,
    selling: 240.00,
    wholesale: 210.00,
    min: 15,
    max: 200,
    reorder: 25,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Gentle moisturizing face wash with ceramides & hyaluronic acid for normal to dry skin.'
  },
  {
    name: 'CeraVe Moisturizing Cream 454g',
    sku: 'SKIN-CER-002',
    barcode: '601001002',
    brand: 'CeraVe',
    category: 'skincare',
    subcategory: 'Moisturizer',
    cost: 180.00,
    selling: 270.00,
    wholesale: 235.00,
    min: 12,
    max: 180,
    reorder: 20,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Rich, non-greasy moisturizing cream providing 24-hour hydration with essential ceramides.'
  },
  {
    name: 'The Ordinary Niacinamide 10% + Zinc 1% 30ml',
    sku: 'SKIN-ORD-001',
    barcode: '601001003',
    brand: 'The Ordinary',
    category: 'skincare',
    subcategory: 'Serum',
    cost: 75.00,
    selling: 130.00,
    wholesale: 110.00,
    min: 20,
    max: 300,
    reorder: 35,
    supplier: 'ABC Cosmetics West Africa',
    description: 'High-strength vitamin and mineral blemish formula reducing oiliness and congestion.'
  },
  {
    name: 'The Ordinary Hyaluronic Acid 2% + B5 30ml',
    sku: 'SKIN-ORD-002',
    barcode: '601001004',
    brand: 'The Ordinary',
    category: 'skincare',
    subcategory: 'Serum',
    cost: 70.00,
    selling: 125.00,
    wholesale: 105.00,
    min: 15,
    max: 250,
    reorder: 25,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Multi-depth hydration serum with ultra-pure vegan hyaluronic acid.'
  },
  {
    name: 'Neutrogena Hydro Boost Water Gel 50ml',
    sku: 'SKIN-NEU-001',
    barcode: '601001005',
    brand: 'Neutrogena',
    category: 'skincare',
    subcategory: 'Moisturizer',
    cost: 130.00,
    selling: 195.00,
    wholesale: 170.00,
    min: 10,
    max: 150,
    reorder: 18,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Award-winning oil-free gel moisturizer that instantly quenches dry skin.'
  },
  {
    name: 'La Roche-Posay Anthelios SPF 50+ Invisible Fluid 50ml',
    sku: 'SKIN-LRP-001',
    barcode: '601001006',
    brand: 'La Roche-Posay',
    category: 'skincare',
    subcategory: 'Sunscreen',
    cost: 210.00,
    selling: 310.00,
    wholesale: 275.00,
    min: 10,
    max: 120,
    reorder: 15,
    supplier: 'L’Oréal Official Distributor Ghana',
    description: 'Broad spectrum UVA/UVB ultra-light fluid sunscreen non-greasy finish, perfect for tropical climate.'
  },
  {
    name: 'CeraVe Foaming Facial Cleanser 473ml',
    sku: 'SKIN-CER-003',
    barcode: '601001007',
    brand: 'CeraVe',
    category: 'skincare',
    subcategory: 'Cleanser',
    cost: 165.00,
    selling: 245.00,
    wholesale: 215.00,
    min: 10,
    max: 180,
    reorder: 20,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Refreshing foaming wash that removes excess sebum, dirt and makeup without disrupting barrier.'
  },
  // Hair Care
  {
    name: 'Shea Moisture Jamaican Black Castor Oil Shampoo 384ml',
    sku: 'HAIR-SHE-001',
    barcode: '602001001',
    brand: 'Shea Moisture',
    category: 'hair-care',
    subcategory: 'Shampoo',
    cost: 110.00,
    selling: 175.00,
    wholesale: 150.00,
    min: 12,
    max: 200,
    reorder: 20,
    supplier: 'Golden Shea Essentials Ghana',
    description: 'Sulfate-free clarifying shampoo that removes buildup while infusing hair with moisture.'
  },
  {
    name: 'Shea Moisture Coconut & Hibiscus Curl & Shine Conditioner 384ml',
    sku: 'HAIR-SHE-002',
    barcode: '602001002',
    brand: 'Shea Moisture',
    category: 'hair-care',
    subcategory: 'Conditioner',
    cost: 115.00,
    selling: 180.00,
    wholesale: 155.00,
    min: 12,
    max: 200,
    reorder: 20,
    supplier: 'Golden Shea Essentials Ghana',
    description: 'Lightweight conditioner that softens and detangles thick, curly textured hair.'
  },
  {
    name: 'Carol’s Daughter Goddess Strength 7 Oil Blend 125ml',
    sku: 'HAIR-CAR-001',
    barcode: '602001003',
    brand: 'Carol’s Daughter',
    category: 'hair-care',
    subcategory: 'Hair Oil',
    cost: 95.00,
    selling: 150.00,
    wholesale: 130.00,
    min: 10,
    max: 150,
    reorder: 15,
    supplier: 'Golden Shea Essentials Ghana',
    description: 'Intense hair and scalp oil wrapped in castor oil and black seed oil for 15x stronger hair.'
  },
  {
    name: 'Shea Moisture Manuka Honey & Mafura Oil Intensive Mask 354ml',
    sku: 'HAIR-SHE-003',
    barcode: '602001004',
    brand: 'Shea Moisture',
    category: 'hair-care',
    subcategory: 'Hair Mask',
    cost: 130.00,
    selling: 200.00,
    wholesale: 175.00,
    min: 8,
    max: 120,
    reorder: 15,
    supplier: 'Golden Shea Essentials Ghana',
    description: 'Deep conditioning treatment infuses hair with intense hydration and nutrient-rich shine.'
  },
  {
    name: 'Brazilian Virgin Hair Lace Frontal Wig 24-inch Bone Straight',
    sku: 'HAIR-EXT-001',
    barcode: '602001005',
    brand: 'Golden Shea Ghana',
    category: 'hair-care',
    subcategory: 'Wigs & Extensions',
    cost: 1200.00,
    selling: 1850.00,
    wholesale: 1600.00,
    min: 3,
    max: 30,
    reorder: 5,
    supplier: 'Golden Shea Essentials Ghana',
    description: '100% unprocessed human virgin hair lace frontal wig with natural pre-plucked hairline.'
  },
  // Makeup
  {
    name: 'Fenty Beauty Pro Filt’r Soft Matte Longwear Foundation 32ml',
    sku: 'MAKE-FEN-001',
    barcode: '603001001',
    brand: 'Fenty Beauty',
    category: 'makeup',
    subcategory: 'Foundation',
    cost: 290.00,
    selling: 420.00,
    wholesale: 375.00,
    min: 10,
    max: 150,
    reorder: 20,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Soft matte, longwear foundation with climate-adaptive technology and inclusive shades.'
  },
  {
    name: 'Fenty Beauty Gloss Bomb Universal Lip Luminizer',
    sku: 'MAKE-FEN-002',
    barcode: '603001002',
    brand: 'Fenty Beauty',
    category: 'makeup',
    subcategory: 'Lipstick',
    cost: 150.00,
    selling: 230.00,
    wholesale: 200.00,
    min: 15,
    max: 200,
    reorder: 25,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Explosive shine gloss with shea butter conditioning and luscious peach-vanilla scent.'
  },
  {
    name: 'Maybelline Fit Me Matte + Poreless Liquid Foundation 30ml',
    sku: 'MAKE-MAY-001',
    barcode: '603001003',
    brand: 'Maybelline New York',
    category: 'makeup',
    subcategory: 'Foundation',
    cost: 85.00,
    selling: 135.00,
    wholesale: 115.00,
    min: 20,
    max: 300,
    reorder: 30,
    supplier: 'L’Oréal Official Distributor Ghana',
    description: 'Dermatologist tested, oil-free liquid foundation that blurs pores for seamless coverage.'
  },
  {
    name: 'Maybelline Lash Sensational Sky High Waterproof Mascara',
    sku: 'MAKE-MAY-002',
    barcode: '603001004',
    brand: 'Maybelline New York',
    category: 'makeup',
    subcategory: 'Mascara',
    cost: 75.00,
    selling: 120.00,
    wholesale: 100.00,
    min: 15,
    max: 200,
    reorder: 25,
    supplier: 'L’Oréal Official Distributor Ghana',
    description: 'Limitless volume and length impact from every angle with flex tower brush.'
  },
  {
    name: 'Black Opal True Color Pore Perfecting Liquid Foundation',
    sku: 'MAKE-BLK-001',
    barcode: '603001005',
    brand: 'Black Opal',
    category: 'makeup',
    subcategory: 'Foundation',
    cost: 110.00,
    selling: 170.00,
    wholesale: 145.00,
    min: 12,
    max: 180,
    reorder: 20,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Formulated specifically for melanin-rich skin with pore-refining and mattifying pigments.'
  },
  {
    name: 'Black Opal Deluxe Finishing Powder 28g',
    sku: 'MAKE-BLK-002',
    barcode: '603001006',
    brand: 'Black Opal',
    category: 'makeup',
    subcategory: 'Powder',
    cost: 90.00,
    selling: 140.00,
    wholesale: 120.00,
    min: 15,
    max: 200,
    reorder: 25,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Silky micro-fine translucent powder controls shine without flashback or cakiness.'
  },
  // Fragrance
  {
    name: 'Dior Sauvage Eau de Parfum 100ml',
    sku: 'FRAG-DIO-001',
    barcode: '604001001',
    brand: 'Dior',
    category: 'fragrance',
    subcategory: 'Men Perfume',
    cost: 950.00,
    selling: 1450.00,
    wholesale: 1280.00,
    min: 5,
    max: 50,
    reorder: 10,
    supplier: 'Global Fragrances & Scents GH',
    description: 'Iconic spicy Calabrian bergamot infused with smoky Papua New Guinean vanilla absolute.'
  },
  {
    name: 'Dior Miss Dior Blooming Bouquet EDT 100ml',
    sku: 'FRAG-DIO-002',
    barcode: '604001002',
    brand: 'Dior',
    category: 'fragrance',
    subcategory: 'Women Perfume',
    cost: 900.00,
    selling: 1380.00,
    wholesale: 1200.00,
    min: 5,
    max: 50,
    reorder: 10,
    supplier: 'Global Fragrances & Scents GH',
    description: 'Fresh sparkling floral scent composed like a dress embroidered with a thousand flowers.'
  },
  {
    name: 'Fenty Eau de Parfum Warm Floral 75ml',
    sku: 'FRAG-FEN-001',
    barcode: '604001003',
    brand: 'Fenty Beauty',
    category: 'fragrance',
    subcategory: 'Unisex Perfume',
    cost: 720.00,
    selling: 1050.00,
    wholesale: 920.00,
    min: 6,
    max: 60,
    reorder: 10,
    supplier: 'Global Fragrances & Scents GH',
    description: 'Intoxicating mix of magnolia, musk, tangerine and Bulgarian rose.'
  },
  {
    name: 'Maybelline Pure Deodorant Spray Fresh Rose 150ml',
    sku: 'FRAG-MAY-001',
    barcode: '604001004',
    brand: 'Maybelline New York',
    category: 'fragrance',
    subcategory: 'Deodorant',
    cost: 35.00,
    selling: 60.00,
    wholesale: 50.00,
    min: 20,
    max: 300,
    reorder: 35,
    supplier: 'L’Oréal Official Distributor Ghana',
    description: '48-hour odor defense with gentle floral notes, anti-stain formulation.'
  },
  // Body Care
  {
    name: 'Raw Unrefined Ghanaian Shea Butter 500g Tub',
    sku: 'BODY-GHA-001',
    barcode: '605001001',
    brand: 'Golden Shea Ghana',
    category: 'body-care',
    subcategory: 'Body Butter',
    cost: 30.00,
    selling: 55.00,
    wholesale: 45.00,
    min: 25,
    max: 500,
    reorder: 50,
    supplier: 'Golden Shea Essentials Ghana',
    description: 'Grade A 100% natural unrefined wild-harvested Northern Ghanaian Shea butter.'
  },
  {
    name: 'African Traditional Black Soap Liquid Wash 500ml',
    sku: 'BODY-GHA-002',
    barcode: '605001002',
    brand: 'Golden Shea Ghana',
    category: 'body-care',
    subcategory: 'Body Wash',
    cost: 40.00,
    selling: 70.00,
    wholesale: 58.00,
    min: 20,
    max: 400,
    reorder: 40,
    supplier: 'Golden Shea Essentials Ghana',
    description: 'Handmade authentic Alata Samina soap infused with aloe vera, honey and neem oil.'
  },
  {
    name: 'CeraVe Daily Moisturizing Lotion 473ml',
    sku: 'BODY-CER-001',
    barcode: '605001003',
    brand: 'CeraVe',
    category: 'body-care',
    subcategory: 'Body Lotion',
    cost: 155.00,
    selling: 235.00,
    wholesale: 200.00,
    min: 15,
    max: 200,
    reorder: 25,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Lightweight, oil-free lotion with MVE delivery technology for sustained hydration.'
  },
  {
    name: 'Neutrogena Rainbath Refreshing Shower Gel 473ml',
    sku: 'BODY-NEU-001',
    barcode: '605001004',
    brand: 'Neutrogena',
    category: 'body-care',
    subcategory: 'Shower Gel',
    cost: 110.00,
    selling: 175.00,
    wholesale: 145.00,
    min: 12,
    max: 150,
    reorder: 20,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Cleanses, conditions and softens skin without leaving behind heavy residue.'
  },
  // Nails
  {
    name: 'OPI Nail Lacquer Big Apple Red 15ml',
    sku: 'NAIL-OPI-001',
    barcode: '606001001',
    brand: 'OPI',
    category: 'nails',
    subcategory: 'Nail Polish',
    cost: 55.00,
    selling: 95.00,
    wholesale: 80.00,
    min: 10,
    max: 150,
    reorder: 20,
    supplier: 'ABC Cosmetics West Africa',
    description: 'The world famous iconic classic bright red cream finish long-wear polish.'
  },
  {
    name: 'OPI Nail Envy Nail Strengthener 15ml',
    sku: 'NAIL-OPI-002',
    barcode: '606001002',
    brand: 'OPI',
    category: 'nails',
    subcategory: 'Treatment',
    cost: 95.00,
    selling: 155.00,
    wholesale: 130.00,
    min: 8,
    max: 100,
    reorder: 15,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Hydrolyzed wheat protein and calcium treatment to reinforce brittle damaged nails.'
  },
  {
    name: 'Professional 500-piece Acrylic Nail Tips Set with Case',
    sku: 'NAIL-TIP-001',
    barcode: '606001003',
    brand: 'Golden Shea Ghana',
    category: 'nails',
    subcategory: 'Nail Tips',
    cost: 45.00,
    selling: 85.00,
    wholesale: 70.00,
    min: 15,
    max: 200,
    reorder: 25,
    supplier: 'Golden Shea Essentials Ghana',
    description: 'Clear full-cover coffin shaped false nails for salon and DIY application.'
  },
  // Accessories
  {
    name: 'Luxury 15-Piece Rose Gold Makeup Brush Set with Case',
    sku: 'ACCE-BRU-001',
    barcode: '607001001',
    brand: 'Golden Shea Ghana',
    category: 'accessories',
    subcategory: 'Brushes',
    cost: 120.00,
    selling: 210.00,
    wholesale: 180.00,
    min: 10,
    max: 100,
    reorder: 15,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Ultra-soft synthetic vegan bristles for powder, blush, contour and eyeshadow.'
  },
  {
    name: 'Teardrop Beauty Sponge 4-Pack with Travel Holder',
    sku: 'ACCE-SPO-001',
    barcode: '607001002',
    brand: 'Golden Shea Ghana',
    category: 'accessories',
    subcategory: 'Sponges',
    cost: 35.00,
    selling: 65.00,
    wholesale: 50.00,
    min: 20,
    max: 250,
    reorder: 30,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Non-latex hydrophilic blending sponges for flawless airbrush base application.'
  },
  {
    name: 'LED Vanity Makeup Mirror with Touch Dimmer 10x Magnification',
    sku: 'ACCE-MIR-001',
    barcode: '607001003',
    brand: 'Golden Shea Ghana',
    category: 'accessories',
    subcategory: 'Mirrors',
    cost: 140.00,
    selling: 250.00,
    wholesale: 210.00,
    min: 6,
    max: 80,
    reorder: 12,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Rechargeable tabletop cosmetic mirror with 3 natural light color temperatures.'
  },
  // Extra products to provide broad variety
  {
    name: 'The Ordinary Glycolic Acid 7% Exfoliating Toner 240ml',
    sku: 'SKIN-ORD-003',
    barcode: '601001008',
    brand: 'The Ordinary',
    category: 'skincare',
    subcategory: 'Toner',
    cost: 95.00,
    selling: 160.00,
    wholesale: 135.00,
    min: 12,
    max: 200,
    reorder: 22,
    supplier: 'ABC Cosmetics West Africa',
    description: 'AHA exfoliating solution improves skin radiance and visible clarity with continued use.'
  },
  {
    name: 'CeraVe Resurfacing Retinol Serum 30ml',
    sku: 'SKIN-CER-004',
    barcode: '601001009',
    brand: 'CeraVe',
    category: 'skincare',
    subcategory: 'Serum',
    cost: 145.00,
    selling: 225.00,
    wholesale: 195.00,
    min: 10,
    max: 150,
    reorder: 18,
    supplier: 'ABC Cosmetics West Africa',
    description: 'Encapsulated retinol with licorice root extract fades post-acne marks and minimizes pores.'
  }
];

const productMap = {};
for (const p of productsData) {
  const brandId = brandIds[p.brand] || null;
  const categoryId = categoryIds[p.category];
  const supplierId = supplierIds[p.supplier] || null;

  const res = run(
    `INSERT INTO products (name, sku, barcode, brand_id, category_id, subcategory, description,
                           supplier_id, cost_price, selling_price, wholesale_price, min_stock_level,
                           max_stock_level, reorder_level, unit, tax_rate, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pcs', 0.05, 'active')`,
    [p.name, p.sku, p.barcode, brandId, categoryId, p.subcategory, p.description,
     supplierId, p.cost, p.selling, p.wholesale, p.min, p.max, p.reorder]
  );
  productMap[p.sku] = {
    id: Number(res.lastInsertRowid),
    ...p
  };
}

// 8. Seed Multi-Branch Inventory and FEFO Batches
console.log('Seeding branch inventory and FEFO batches...');

// Current date references for realistic expiry simulation
// Today is approx Sept 2026.
// Safe: 2027 or 2028 (>90 days)
// Expiring Soon: Nov/Dec 2026 (30 - 90 days)
// Critical: Oct 2026 (< 30 days)
// Expired: July 2026, Aug 2026 (already expired)

const branchesList = ['ACC-001', 'KMS-002', 'TKD-003', 'TML-004'];

let batchCounter = 1001;

for (const sku in productMap) {
  const p = productMap[sku];
  const isExpiredDemo = sku === 'SKIN-ORD-002'; // Demo item for Expired alert
  const isCriticalDemo = sku === 'SKIN-CER-001'; // Demo item for Critical alert (<30 days)
  const isSoonDemo = sku === 'HAIR-SHE-001';    // Demo item for Expiring Soon (30-90 days)
  const isLowStockDemo = sku === 'FRAG-DIO-001'; // Demo item for Low Stock alert

  for (const bCode of branchesList) {
    const bId = branchIds[bCode];
    let branchQty = 0;

    // Allocate realistic stock distribution per branch
    if (bCode === 'ACC-001') {
      branchQty = isLowStockDemo ? 3 : Math.floor(Math.random() * 40) + 30; // Flagship has high stock
    } else if (bCode === 'KMS-002') {
      branchQty = isLowStockDemo ? 4 : Math.floor(Math.random() * 25) + 15;
    } else if (bCode === 'TKD-003') {
      branchQty = isLowStockDemo ? 2 : Math.floor(Math.random() * 20) + 10;
    } else {
      branchQty = isLowStockDemo ? 1 : Math.floor(Math.random() * 15) + 5;
    }

    // Insert main branch inventory record
    run(
      `INSERT INTO inventory (product_id, branch_id, quantity, reserved_quantity, min_stock, max_stock, reorder_level)
       VALUES (?, ?, ?, 0, ?, ?, ?)`,
      [p.id, bId, branchQty, p.min, p.max, p.reorder]
    );

    // Initial stock movement
    run(
      `INSERT INTO inventory_movements (product_id, branch_id, movement_type, quantity, previous_quantity, new_quantity, reference_type, reason, user_id)
       VALUES (?, ?, 'initial_stock', ?, 0, ?, 'setup', 'Initial branch inventory provisioning', ?)`,
      [p.id, bId, branchQty, branchQty, userIds['admin@angales.com']]
    );

    // Create 1 or 2 batches per branch to test FEFO ordering
    if (branchQty > 0) {
      let b1Qty = Math.floor(branchQty * 0.6);
      let b2Qty = branchQty - b1Qty;

      let expDate1 = '2027-11-15';
      let expDate2 = '2028-04-20';

      if (isExpiredDemo && bCode === 'ACC-001') {
        expDate1 = '2026-08-10'; // Expired!
        expDate2 = '2026-09-01'; // Expired!
      } else if (isCriticalDemo && bCode === 'ACC-001') {
        expDate1 = '2026-10-05'; // Critical (< 30 days)
        expDate2 = '2027-08-12'; // Safe
      } else if (isSoonDemo && bCode === 'KMS-002') {
        expDate1 = '2026-11-20'; // Expiring Soon (30-90 days)
        expDate2 = '2027-09-10'; // Safe
      }

      run(
        `INSERT INTO inventory_batches (batch_number, product_id, branch_id, quantity, cost_price, manufacturing_date, expiry_date, supplier_id)
         VALUES (?, ?, ?, ?, ?, '2025-01-10', ?, ?)`,
        [`BAT-${batchCounter++}`, p.id, bId, b1Qty, p.cost, expDate1, supplierIds[p.supplier] || 1]
      );

      if (b2Qty > 0) {
        run(
          `INSERT INTO inventory_batches (batch_number, product_id, branch_id, quantity, cost_price, manufacturing_date, expiry_date, supplier_id)
           VALUES (?, ?, ?, ?, ?, '2025-06-15', ?, ?)`,
          [`BAT-${batchCounter++}`, p.id, bId, b2Qty, p.cost, expDate2, supplierIds[p.supplier] || 1]
        );
      }
    }
  }
}

// 9. Seed Customers
const customersData = [
  { name: 'Dr. Efua Sutherland', phone: '+233 24 333 9988', email: 'efua.s@gmail.com', type: 'vip', purchases: 3850.00 },
  { name: 'Afia Pokuaa Beauty Lounge', phone: '+233 20 888 1234', email: 'afiapokuaa@gmail.com', type: 'wholesale', purchases: 12400.00 },
  { name: 'Kofi Mensah', phone: '+233 27 555 4321', email: 'kofi.m@yahoo.com', type: 'regular', purchases: 890.00 },
  { name: 'Yaa Asantewaa Hair Studio', phone: '+233 55 111 6789', email: 'yaahairstudio@gmail.com', type: 'wholesale', purchases: 18900.00 },
  { name: 'Akosua Frimpong', phone: '+233 24 777 9012', email: 'akosua.f@outlook.com', type: 'walk_in', purchases: 240.00 }
];

const customerIds = {};
for (const c of customersData) {
  const res = run(
    `INSERT INTO customers (name, phone, email, customer_type, total_purchases)
     VALUES (?, ?, ?, ?, ?)`,
    [c.name, c.phone, c.email, c.type, c.purchases]
  );
  customerIds[c.name] = Number(res.lastInsertRowid);
}

// 10. Seed Sample Sales & Sale Items (demonstrating Ghana Cedi GHS and POS transactions)
console.log('Seeding sales and receipt history...');
const sampleSales = [
  {
    invoice: 'INV-2026-0001',
    branch: 'ACC-001',
    customer: 'Dr. Efua Sutherland',
    cashier: 'cashier.accra@angales.com',
    payment: 'mobile_money',
    momoRef: 'MTN-MOMO-98471203',
    items: [
      { sku: 'SKIN-CER-001', qty: 2, price: 240.00 },
      { sku: 'SKIN-ORD-001', qty: 1, price: 130.00 },
      { sku: 'MAKE-FEN-002', qty: 1, price: 230.00 }
    ],
    date: '2026-09-18 14:30:00'
  },
  {
    invoice: 'INV-2026-0002',
    branch: 'ACC-001',
    customer: 'Afia Pokuaa Beauty Lounge',
    cashier: 'cashier.accra@angales.com',
    payment: 'bank_transfer',
    momoRef: 'GCB-TRF-440192',
    items: [
      { sku: 'HAIR-SHE-001', qty: 5, price: 175.00 },
      { sku: 'HAIR-SHE-002', qty: 5, price: 180.00 },
      { sku: 'BODY-GHA-001', qty: 10, price: 55.00 }
    ],
    date: '2026-09-19 11:15:00'
  },
  {
    invoice: 'INV-2026-0003',
    branch: 'KMS-002',
    customer: 'Kofi Mensah',
    cashier: 'manager.kumasi@angales.com',
    payment: 'cash',
    momoRef: null,
    items: [
      { sku: 'FRAG-DIO-001', qty: 1, price: 1450.00 }
    ],
    date: '2026-09-20 10:45:00'
  }
];

for (const s of sampleSales) {
  let subtotal = 0;
  let tax = 0;
  for (const item of s.items) {
    subtotal += item.price * item.qty;
  }
  tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + tax;

  const saleRes = run(
    `INSERT INTO sales (invoice_number, branch_id, customer_id, cashier_id, subtotal, tax_amount, total_amount, payment_method, payment_details, amount_paid, change_amount, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, 'completed', ?)`,
    [s.invoice, branchIds[s.branch], customerIds[s.customer], userIds[s.cashier], subtotal, tax, total, s.payment, s.momoRef, total, s.date]
  );
  const saleId = Number(saleRes.lastInsertRowid);

  for (const item of s.items) {
    const prod = productMap[item.sku];
    run(
      `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, cost_price, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [saleId, prod.id, item.qty, item.price, prod.cost, item.price * item.qty]
    );

    // Record inventory movement for the sale
    run(
      `INSERT INTO inventory_movements (product_id, branch_id, movement_type, quantity, previous_quantity, new_quantity, reference_type, reference_id, user_id, reason, created_at)
       VALUES (?, ?, 'sale', ?, 50, 50 - ?, 'sale', ?, ?, 'POS checkout', ?)`,
      [prod.id, branchIds[s.branch], -item.qty, item.qty, s.invoice, userIds[s.cashier], s.date]
    );
  }
}

// 11. Seed Stock Transfers (workflow: Request -> Central Approval -> In Transit -> Received)
console.log('Seeding inter-branch stock transfers...');
const transferRes = run(
  `INSERT INTO stock_transfers (transfer_number, source_branch_id, destination_branch_id, status, requested_by, approved_by, received_by, transfer_date, received_date, notes)
   VALUES ('TRF-2026-001', ?, ?, 'received', ?, ?, ?, '2026-09-15', '2026-09-17', 'Stock rebalance from Accra Flagship to Kumasi Mall')`,
  [branchIds['ACC-001'], branchIds['KMS-002'], userIds['manager.kumasi@angales.com'], userIds['admin@angales.com'], userIds['manager.kumasi@angales.com']]
);
const trfId = Number(transferRes.lastInsertRowid);

run(
  `INSERT INTO stock_transfer_items (transfer_id, product_id, quantity_requested, quantity_sent, quantity_received, unit_cost)
   VALUES (?, ?, 10, 10, 10, 160.00)`,
  [trfId, productMap['SKIN-CER-001'].id]
);

// Pending Transfer for Approval
const pendingTrfRes = run(
  `INSERT INTO stock_transfers (transfer_number, source_branch_id, destination_branch_id, status, requested_by, notes)
   VALUES ('TRF-2026-002', ?, ?, 'pending_approval', ?, 'Urgent replenishment request for Takoradi')`,
  [branchIds['ACC-001'], branchIds['TKD-003'], userIds['inventory@angales.com']]
);
const pendingTrfId = Number(pendingTrfRes.lastInsertRowid);
run(
  `INSERT INTO stock_transfer_items (transfer_id, product_id, quantity_requested, quantity_sent, unit_cost)
   VALUES (?, ?, 8, 0, 75.00)`,
  [pendingTrfId, productMap['SKIN-ORD-001'].id]
);

// 12. Seed Purchase Orders
console.log('Seeding purchase orders...');
const poRes = run(
  `INSERT INTO purchase_orders (po_number, supplier_id, branch_id, status, total_cost, expected_delivery_date, created_by, approved_by, notes)
   VALUES ('PO-2026-001', ?, ?, 'received', 8200.00, '2026-09-10', ?, ?, 'Restock order for skincare & cleansers')`,
  [supplierIds['ABC Cosmetics West Africa'], branchIds['ACC-001'], userIds['inventory@angales.com'], userIds['admin@angales.com']]
);
const poId = Number(poRes.lastInsertRowid);
run(
  `INSERT INTO purchase_order_items (po_id, product_id, quantity_ordered, quantity_received, cost_price, subtotal)
   VALUES (?, ?, 30, 30, 160.00, 4800.00)`,
  [poId, productMap['SKIN-CER-001'].id]
);
run(
  `INSERT INTO purchase_order_items (po_id, product_id, quantity_ordered, quantity_received, cost_price, subtotal)
   VALUES (?, ?, 20, 20, 170.00, 3400.00)`,
  [poId, productMap['SKIN-CER-002'].id]
);

// Pending PO
run(
  `INSERT INTO purchase_orders (po_number, supplier_id, branch_id, status, total_cost, expected_delivery_date, created_by, notes)
   VALUES ('PO-2026-002', ?, ?, 'pending', 4500.00, '2026-09-28', ?, 'Monthly restock from L’Oréal')`,
  [supplierIds['L’Oréal Official Distributor Ghana'], branchIds['ACC-001'], userIds['inventory@angales.com']]
);

// 13. Seed Expenses
console.log('Seeding operational expenses...');
const expensesData = [
  { number: 'EXP-2026-001', branch: 'ACC-001', cat: 'rent', amount: 4500.00, date: '2026-09-01', desc: 'Monthly store lease for Accra Flagship', user: 'accountant@angales.com' },
  { number: 'EXP-2026-002', branch: 'ACC-001', cat: 'electricity', amount: 920.00, date: '2026-09-05', desc: 'ECG Commercial power bill', user: 'accountant@angales.com' },
  { number: 'EXP-2026-003', branch: 'KMS-002', cat: 'rent', amount: 3800.00, date: '2026-09-01', desc: 'Kumasi Mall retail unit monthly lease', user: 'accountant@angales.com' },
  { number: 'EXP-2026-004', branch: 'ACC-001', cat: 'marketing', amount: 1500.00, date: '2026-09-12', desc: 'Social media influencer collaboration & packaging bags', user: 'accountant@angales.com' }
];

for (const e of expensesData) {
  run(
    `INSERT INTO expenses (expense_number, branch_id, category, amount, date, description, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [e.number, branchIds[e.branch], e.cat, e.amount, e.date, e.desc, userIds[e.user]]
  );
}

// 14. Seed Stock Adjustments & Counts
run(
  `INSERT INTO stock_adjustments (adjustment_number, branch_id, product_id, type, quantity, reason, status, requested_by, approved_by, notes)
   VALUES ('ADJ-2026-001', ?, ?, 'decrease', 1, 'damaged', 'approved', ?, ?, 'Customer accidentally dropped bottle on tiled floor')`,
  [branchIds['ACC-001'], productMap['SKIN-CER-001'].id, userIds['manager.accra@angales.com'], userIds['admin@angales.com']]
);

// 15. Seed In-App Notifications
console.log('Seeding in-app notifications...');
const notifsData = [
  { title: 'Low Stock Alert', message: 'Dior Sauvage Eau de Parfum is below reorder level (3 left at Accra Main).', type: 'low_stock', branch: 'ACC-001', link: '/inventory' },
  { title: 'Critical Expiry Notice', message: 'CeraVe Hydrating Cleanser (Batch BAT-1001) expires in less than 30 days!', type: 'expiry_warning', branch: 'ACC-001', link: '/inventory' },
  { title: 'Pending Stock Transfer', message: 'Transfer TRF-2026-002 requires central approval (Accra -> Takoradi).', type: 'transfer', branch: null, link: '/transfers' },
  { title: 'Purchase Order Delivered', message: 'PO-2026-001 from ABC Cosmetics has been fully received into Accra inventory.', type: 'purchase_order', branch: 'ACC-001', link: '/purchases' }
];

for (const n of notifsData) {
  run(
    `INSERT INTO notifications (title, message, type, branch_id, link_url, is_read)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [n.title, n.message, n.type, n.branch ? branchIds[n.branch] : null, n.link]
  );
}

// 16. Seed System Settings
console.log('Seeding system settings...');
const settingsData = [
  ['company_name', 'Angales Beauty Supplies Ltd', 'Registered Company Name'],
  ['currency_code', 'GHS', 'Official Currency Code'],
  ['currency_symbol', 'GH₵', 'Currency Display Symbol'],
  ['vat_rate', '0.05', 'Standard VAT / Flat Tax Rate (5%)'],
  ['max_cashier_discount', '10', 'Maximum % discount allowed for Cashiers'],
  ['max_manager_discount', '30', 'Maximum % discount allowed for Branch Managers'],
  ['low_stock_default_threshold', '15', 'Default minimum threshold for low stock alert'],
  ['expiry_warning_days', '90', 'Days before expiry to trigger warning alert'],
  ['receipt_header', 'ANGALES BEAUTY SUPPLIES\nLuxury Cosmetics & Hair Haven\nAccra, Kumasi, Takoradi, Tamale\nTel: +233 24 111 2233', 'Receipt Header Text'],
  ['receipt_footer', 'Thank you for choosing Angales Beauty!\nGoods sold in good condition are not returnable after 7 days.\nFollow us on Instagram: @angalesbeautygh', 'Receipt Footer Text']
];

for (const [k, v, desc] of settingsData) {
  run(
    `INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)`,
    [k, v, desc]
  );
}

// 17. Seed Initial Audit Logs
run(
  `INSERT INTO audit_logs (user_id, user_name, action, module, record_id, previous_value, new_value, branch_id, ip_address)
   VALUES (?, 'Admin Angela Boateng', 'system_initialize', 'system', 'INITIAL', NULL, 'Database schema seeded with 4 branches and 34 products', ?, '127.0.0.1')`,
  [userIds['admin@angales.com'], branchIds['ACC-001']]
);

console.log('Seeding successfully completed! Database is fully populated.');
