/**
 * Angales Beauty Supplies — Enterprise Multi-Branch Demo Dataset
 * Realistic Ghanaian cosmetics, wigs, hair care, skincare, fragrances & salon inventory
 */

export const INITIAL_BRANCHES = [
  {
    id: 1,
    name: 'Angales Beauty Supplies - Accra Flagship (HQ)',
    code: 'ACC-HQ',
    address: 'Kwame Nkrumah Avenue, Adabraka / Oxford St, Accra, Ghana',
    phone: '+233 24 111 2233',
    email: 'accra@angalesbeauty.com',
    manager_name: 'Akosua Boakye',
    status: 'active',
    operating_hours: '8:00 AM - 8:30 PM'
  },
  {
    id: 2,
    name: 'Angales Beauty Supplies - Kumasi City Mall',
    code: 'KMS-02',
    address: 'Kumasi City Mall, Ground Floor Suite 14, Asokwa, Kumasi, Ghana',
    phone: '+233 20 444 7788',
    email: 'kumasi@angalesbeauty.com',
    manager_name: 'Kwame Osei-Tutu',
    status: 'active',
    operating_hours: '9:00 AM - 9:00 PM'
  },
  {
    id: 3,
    name: 'Angales Beauty Supplies - Takoradi Harbor',
    code: 'TKD-03',
    address: 'Market Circle Commercial Area, Takoradi, Western Region, Ghana',
    phone: '+233 31 222 9900',
    email: 'takoradi@angalesbeauty.com',
    manager_name: 'Ama Konadu',
    status: 'active',
    operating_hours: '8:30 AM - 7:30 PM'
  }
];

export const INITIAL_ROLES = [
  { id: 1, name: 'super_admin', display_name: 'Super Admin', description: 'Full executive control across all branches & finances' },
  { id: 2, name: 'branch_manager', display_name: 'Branch Manager', description: 'Full branch operations, staff, local inventory & POS oversight' },
  { id: 3, name: 'inventory_officer', display_name: 'Inventory Officer', description: 'Stock control, warehouse, FEFO batch tracking & transfers' },
  { id: 4, name: 'cashier', display_name: 'Sales Cashier', description: 'Point of sale terminal, customer checkout & receipt printing' },
  { id: 5, name: 'accountant', display_name: 'Accountant', description: 'Revenue telemetry, operational expenses, profit & audit trails' }
];

export const DEMO_USERS = [
  {
    id: 1,
    name: 'Angales Executive (Super Admin)',
    email: 'admin@angales.com',
    role: 'super_admin',
    role_id: 1,
    phone: '+233 24 111 2233',
    status: 'active',
    branches: INITIAL_BRANCHES
  },
  {
    id: 2,
    name: 'Kwame Osei-Tutu (Branch Manager)',
    email: 'manager.kumasi@angales.com',
    role: 'branch_manager',
    role_id: 2,
    phone: '+233 20 444 7788',
    status: 'active',
    branches: [INITIAL_BRANCHES[1]]
  },
  {
    id: 3,
    name: 'Efua Mensah (POS Cashier)',
    email: 'cashier.accra@angales.com',
    role: 'cashier',
    role_id: 4,
    phone: '+233 24 888 1234',
    status: 'active',
    branches: [INITIAL_BRANCHES[0]]
  },
  {
    id: 4,
    name: 'Kofi Boateng (Inventory Officer)',
    email: 'inventory@angales.com',
    role: 'inventory_officer',
    role_id: 3,
    phone: '+233 24 555 9876',
    status: 'active',
    branches: INITIAL_BRANCHES
  },
  {
    id: 5,
    name: 'Abena Frimpong (Chief Accountant)',
    email: 'accountant@angales.com',
    role: 'accountant',
    role_id: 5,
    phone: '+233 20 999 4321',
    status: 'active',
    branches: INITIAL_BRANCHES
  }
];

export const INITIAL_CATEGORIES = [
  { id: 1, name: 'Hair Care & Luxury Extensions', slug: 'hair-care', description: 'Wigs, weaves, shampoos, conditioners, oils & treatments' },
  { id: 2, name: 'Skin Care & Dermatology', slug: 'skin-care', description: 'Cleansers, toners, serums, moisturizers & sunscreens' },
  { id: 3, name: 'Cosmetics & Professional Makeup', slug: 'cosmetics-makeup', description: 'Foundations, concealers, lipsticks, palettes & setting sprays' },
  { id: 4, name: 'Fragrances & Arabian Oils', slug: 'fragrances', description: 'Authentic designer perfumes, body mists & Arabian oud oils' },
  { id: 5, name: 'Nail Care & Salon Art', slug: 'nail-care', description: 'Gel polishes, acrylics, UV lamps, nail tips & manicure tools' },
  { id: 6, name: 'Salon Tools & Equipment', slug: 'salon-tools', description: 'Professional hair dryers, clippers, straighteners & chairs' },
  { id: 7, name: 'Bath & Body Care', slug: 'body-care', description: 'Body washes, organic scrubs, rich butters & deodorants' }
];

export const INITIAL_BRANDS = [
  { id: 1, name: 'Fenty Beauty', country: 'United States' },
  { id: 2, name: 'Olaplex Professional', country: 'United States' },
  { id: 3, name: 'Morphe Cosmetics', country: 'United States' },
  { id: 4, name: 'Shea Radiance Ghana', country: 'Ghana' },
  { id: 5, name: 'Maybelline New York', country: 'United States' },
  { id: 6, name: 'L\'Oréal Professionnel', country: 'France' },
  { id: 7, name: 'Huda Beauty', country: 'United Arab Emirates' },
  { id: 8, name: 'CeraVe Dermatology', country: 'United States' },
  { id: 9, name: 'Dyson Professional', country: 'United Kingdom' },
  { id: 10, name: 'Arabian Oud Luxury', country: 'Saudi Arabia' },
  { id: 11, name: 'OPI Nail Professional', country: 'United States' }
];

export const INITIAL_SUPPLIERS = [
  {
    id: 1,
    name: 'Accra Beauty Imports Ltd',
    contact_person: 'Mr. Emmanuel Darko',
    phone: '+233 24 456 7890',
    email: 'imports@accrabeauty.com',
    address: 'Heavy Industrial Area, Tema, Ghana',
    payment_terms: 'Net 30 Days'
  },
  {
    id: 2,
    name: 'Ghana Luxury Hair Direct',
    contact_person: 'Madam Patricia Appiah',
    phone: '+233 20 123 4567',
    email: 'orders@ghanahairdirect.com',
    address: 'Spintex Road, Accra, Ghana',
    payment_terms: '50% Advance, 50% on Delivery'
  },
  {
    id: 3,
    name: 'L\'Oréal West Africa Distribution',
    contact_person: 'Jean-Luc Mensah',
    phone: '+233 30 278 9900',
    email: 'b2b@loreal-westafrica.com',
    address: 'Airport Residential Area, Accra, Ghana',
    payment_terms: 'Net 15 Days'
  }
];

export const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Virgin Brazilian HD Lace Front Wig (28" Bone Straight)',
    sku: 'WIG-BRZ-028',
    barcode: '600123450001',
    category_id: 1,
    category_name: 'Hair Care & Luxury Extensions',
    brand_id: 2,
    brand_name: 'Ghana Luxury Hair Direct',
    cost_price: 1900.00,
    retail_price: 2850.00,
    reorder_level: 5,
    unit_of_measure: 'unit',
    description: '100% Raw unprocessed virgin human hair wig with pre-plucked invisible Swiss HD lace.',
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 2,
    name: 'Olaplex No. 3 Hair Perfector (100ml)',
    sku: 'OLA-NO3-100',
    barcode: '600123450002',
    category_id: 1,
    category_name: 'Hair Care & Luxury Extensions',
    brand_id: 2,
    brand_name: 'Olaplex Professional',
    cost_price: 250.00,
    retail_price: 380.00,
    reorder_level: 12,
    unit_of_measure: 'bottle',
    description: 'Bond multiplier treatment that repairs damaged, bleached, and heat-styled hair.',
    image_url: 'https://images.unsplash.com/photo-1608248597359-598d1a1b156b?w=500&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 3,
    name: 'Fenty Beauty Pro Filt\'r Soft Matte Foundation (32ml)',
    sku: 'FNT-FND-420',
    barcode: '600123450003',
    category_id: 3,
    category_name: 'Cosmetics & Professional Makeup',
    brand_id: 1,
    brand_name: 'Fenty Beauty',
    cost_price: 360.00,
    retail_price: 520.00,
    reorder_level: 10,
    unit_of_measure: 'bottle',
    description: 'Climate-adaptive longwear foundation with instant oil-control and medium-to-full coverage.',
    image_url: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=500&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 4,
    name: 'Huda Beauty Empowered Eyeshadow Palette (18 Pans)',
    sku: 'HUD-PAL-EMP',
    barcode: '600123450004',
    category_id: 3,
    category_name: 'Cosmetics & Professional Makeup',
    brand_id: 7,
    brand_name: 'Huda Beauty',
    cost_price: 610.00,
    retail_price: 890.00,
    reorder_level: 6,
    unit_of_measure: 'palette',
    description: 'Luxury high-pigment gel liners, high-shine wet metallics and creamy matte pigments.',
    image_url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 5,
    name: 'CeraVe Foaming Facial Cleanser (473ml)',
    sku: 'CRV-CLM-473',
    barcode: '600123450005',
    category_id: 2,
    category_name: 'Skin Care & Dermatology',
    brand_id: 8,
    brand_name: 'CeraVe Dermatology',
    cost_price: 185.00,
    retail_price: 290.00,
    reorder_level: 15,
    unit_of_measure: 'bottle',
    description: 'Dermatologist-developed gentle foaming gel with 3 essential ceramides and hyaluronic acid.',
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 6,
    name: 'Shea Radiance Golden Whipped Body Butter (250g)',
    sku: 'SHE-BTR-250',
    barcode: '600123450006',
    category_id: 7,
    category_name: 'Bath & Body Care',
    brand_id: 4,
    brand_name: 'Shea Radiance Ghana',
    cost_price: 85.00,
    retail_price: 160.00,
    reorder_level: 20,
    unit_of_measure: 'jar',
    description: 'Handcrafted Northern Ghana unrefined shea butter enriched with baobab oil and vanilla beans.',
    image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 7,
    name: 'Arabian Oud Royal Velvet Perfume Spray (100ml)',
    sku: 'OUD-RYL-100',
    barcode: '600123450007',
    category_id: 4,
    category_name: 'Fragrances & Arabian Oils',
    brand_id: 10,
    brand_name: 'Arabian Oud Luxury',
    cost_price: 800.00,
    retail_price: 1250.00,
    reorder_level: 4,
    unit_of_measure: 'bottle',
    description: 'Exquisite royal Cambodian agarwood oud infused with Bulgarian rose and golden amber.',
    image_url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 8,
    name: 'Dyson Supersonic Hair Dryer Pro Salon Edition',
    sku: 'DYS-SUP-PRO',
    barcode: '600123450008',
    category_id: 6,
    category_name: 'Salon Tools & Equipment',
    brand_id: 9,
    brand_name: 'Dyson Professional',
    cost_price: 4800.00,
    retail_price: 6400.00,
    reorder_level: 2,
    unit_of_measure: 'unit',
    description: 'Intelligent heat control with fast drying V9 digital motor and 5 styling magnetic attachments.',
    image_url: 'https://images.unsplash.com/photo-1522337094346-2918b300186a?w=500&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 9,
    name: 'Maybelline SuperStay Vinyl Ink Liquid Lipstick',
    sku: 'MAY-LIP-VNL',
    barcode: '600123450009',
    category_id: 3,
    category_name: 'Cosmetics & Professional Makeup',
    brand_id: 5,
    brand_name: 'Maybelline New York',
    cost_price: 95.00,
    retail_price: 145.00,
    reorder_level: 25,
    unit_of_measure: 'tube',
    description: 'Instant vinyl shine and transfer-proof color that stays locked for up to 16 hours.',
    image_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 10,
    name: 'L\'Oréal Professionnel Metal Detox Hair Mask (250ml)',
    sku: 'LOR-MDX-250',
    barcode: '600123450010',
    category_id: 1,
    category_name: 'Hair Care & Luxury Extensions',
    brand_id: 6,
    brand_name: 'L\'Oréal Professionnel',
    cost_price: 290.00,
    retail_price: 440.00,
    reorder_level: 8,
    unit_of_measure: 'tub',
    description: 'Anti-deposit protector mask for color-treated and bleached salon hair.',
    image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 11,
    name: 'OPI Pro Nail Polish GelColor Set (6 Shades)',
    sku: 'OPI-GEL-SET',
    barcode: '600123450011',
    category_id: 5,
    category_name: 'Nail Care & Salon Art',
    brand_id: 11,
    brand_name: 'OPI Nail Professional',
    cost_price: 310.00,
    retail_price: 480.00,
    reorder_level: 10,
    unit_of_measure: 'pack',
    description: 'High gloss professional salon gel soak-off lacquer with LED light cure.',
    image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 12,
    name: 'La Roche-Posay Anthelios UVmune SPF 50+ (50ml)',
    sku: 'LRP-SPF-050',
    barcode: '600123450012',
    category_id: 2,
    category_name: 'Skin Care & Dermatology',
    brand_id: 8,
    brand_name: 'CeraVe Dermatology',
    cost_price: 220.00,
    retail_price: 340.00,
    reorder_level: 15,
    unit_of_measure: 'bottle',
    description: 'Ultra-light invisible fluid sun protection with Mexoryl 400 against ultra-long UVA rays.',
    image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80',
    status: 'active'
  }
];

export const INITIAL_INVENTORY = [
  // Accra Flagship (Branch 1)
  { id: 1, product_id: 1, branch_id: 1, quantity_on_hand: 14, reorder_point: 5 },
  { id: 2, product_id: 2, branch_id: 1, quantity_on_hand: 48, reorder_point: 12 },
  { id: 3, product_id: 3, branch_id: 1, quantity_on_hand: 32, reorder_point: 10 },
  { id: 4, product_id: 4, branch_id: 1, quantity_on_hand: 18, reorder_point: 6 },
  { id: 5, product_id: 5, branch_id: 1, quantity_on_hand: 65, reorder_point: 15 },
  { id: 6, product_id: 6, branch_id: 1, quantity_on_hand: 84, reorder_point: 20 },
  { id: 7, product_id: 7, branch_id: 1, quantity_on_hand: 12, reorder_point: 4 },
  { id: 8, product_id: 8, branch_id: 1, quantity_on_hand: 4, reorder_point: 2 },
  { id: 9, product_id: 9, branch_id: 1, quantity_on_hand: 92, reorder_point: 25 },
  { id: 10, product_id: 10, branch_id: 1, quantity_on_hand: 28, reorder_point: 8 },
  { id: 11, product_id: 11, branch_id: 1, quantity_on_hand: 22, reorder_point: 10 },
  { id: 12, product_id: 12, branch_id: 1, quantity_on_hand: 38, reorder_point: 15 },

  // Kumasi Mall (Branch 2)
  { id: 13, product_id: 1, branch_id: 2, quantity_on_hand: 8, reorder_point: 4 },
  { id: 14, product_id: 2, branch_id: 2, quantity_on_hand: 26, reorder_point: 10 },
  { id: 15, product_id: 3, branch_id: 2, quantity_on_hand: 19, reorder_point: 8 },
  { id: 16, product_id: 4, branch_id: 2, quantity_on_hand: 9, reorder_point: 5 },
  { id: 17, product_id: 5, branch_id: 2, quantity_on_hand: 34, reorder_point: 12 },
  { id: 18, product_id: 6, branch_id: 2, quantity_on_hand: 52, reorder_point: 15 },
  { id: 19, product_id: 7, branch_id: 2, quantity_on_hand: 6, reorder_point: 3 },
  { id: 20, product_id: 8, branch_id: 2, quantity_on_hand: 3, reorder_point: 2 },
  { id: 21, product_id: 9, branch_id: 2, quantity_on_hand: 4, reorder_point: 15 }, // LOW STOCK ALERT!
  { id: 22, product_id: 10, branch_id: 2, quantity_on_hand: 14, reorder_point: 6 },
  { id: 23, product_id: 11, branch_id: 2, quantity_on_hand: 11, reorder_point: 8 },
  { id: 24, product_id: 12, branch_id: 2, quantity_on_hand: 21, reorder_point: 10 },

  // Takoradi Harbor (Branch 3)
  { id: 25, product_id: 1, branch_id: 3, quantity_on_hand: 3, reorder_point: 3 },
  { id: 26, product_id: 2, branch_id: 3, quantity_on_hand: 15, reorder_point: 8 },
  { id: 27, product_id: 3, branch_id: 3, quantity_on_hand: 12, reorder_point: 6 },
  { id: 28, product_id: 4, branch_id: 3, quantity_on_hand: 5, reorder_point: 4 },
  { id: 29, product_id: 5, branch_id: 3, quantity_on_hand: 20, reorder_point: 10 },
  { id: 30, product_id: 6, branch_id: 3, quantity_on_hand: 30, reorder_point: 12 },
  { id: 31, product_id: 7, branch_id: 3, quantity_on_hand: 4, reorder_point: 2 },
  { id: 32, product_id: 8, branch_id: 3, quantity_on_hand: 1, reorder_point: 2 }, // LOW STOCK!
  { id: 33, product_id: 9, branch_id: 3, quantity_on_hand: 25, reorder_point: 12 },
  { id: 34, product_id: 10, branch_id: 3, quantity_on_hand: 9, reorder_point: 5 },
  { id: 35, product_id: 11, branch_id: 3, quantity_on_hand: 8, reorder_point: 6 },
  { id: 36, product_id: 12, branch_id: 3, quantity_on_hand: 14, reorder_point: 8 }
];

// Helper to compute date relative to today
const getRelativeDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_BATCHES = [
  {
    id: 1,
    product_id: 5,
    product_name: 'CeraVe Foaming Facial Cleanser (473ml)',
    batch_number: 'CRV-2024-B18',
    branch_id: 1,
    branch_name: 'Accra Flagship (HQ)',
    quantity: 12,
    manufacture_date: '2024-03-01',
    expiry_date: getRelativeDate(12), // CRITICAL EXPIRY ALERT (12 days left)
    status: 'expiring_soon'
  },
  {
    id: 2,
    product_id: 12,
    product_name: 'La Roche-Posay Anthelios UVmune SPF 50+ (50ml)',
    batch_number: 'LRP-2024-X09',
    branch_id: 2,
    branch_name: 'Kumasi City Mall',
    quantity: 18,
    manufacture_date: '2024-04-10',
    expiry_date: getRelativeDate(45), // UPCOMING EXPIRY ALERT (45 days left)
    status: 'warning'
  },
  {
    id: 3,
    product_id: 2,
    product_name: 'Olaplex No. 3 Hair Perfector (100ml)',
    batch_number: 'OLA-2025-V01',
    branch_id: 1,
    branch_name: 'Accra Flagship (HQ)',
    quantity: 48,
    manufacture_date: '2025-01-15',
    expiry_date: getRelativeDate(420),
    status: 'healthy'
  },
  {
    id: 4,
    product_id: 7,
    product_name: 'Arabian Oud Royal Velvet Perfume Spray (100ml)',
    batch_number: 'OUD-2025-A77',
    branch_id: 1,
    branch_name: 'Accra Flagship (HQ)',
    quantity: 12,
    manufacture_date: '2025-02-01',
    expiry_date: getRelativeDate(750),
    status: 'healthy'
  }
];

export const INITIAL_CUSTOMERS = [
  {
    id: 1,
    name: 'Akosua Darko (VIP Platinum)',
    phone: '+233 24 990 1122',
    email: 'akosua.darko@gmail.com',
    tier: 'Platinum',
    loyalty_points: 540,
    total_spend: 18450.00,
    city: 'East Legon, Accra'
  },
  {
    id: 2,
    name: 'Nana Ama Serwaa (Gold VIP)',
    phone: '+233 20 887 6655',
    email: 'nana.serwaa@outlook.com',
    tier: 'Gold',
    loyalty_points: 320,
    total_spend: 9280.00,
    city: 'Ahodwo, Kumasi'
  },
  {
    id: 3,
    name: 'Kofi Mensah Esq.',
    phone: '+233 27 554 3321',
    email: 'kofi.mensah@lawghana.com',
    tier: 'Silver',
    loyalty_points: 110,
    total_spend: 3450.00,
    city: 'Cantonments, Accra'
  },
  {
    id: 4,
    name: 'Efua Konadu Addo',
    phone: '+233 55 443 2211',
    email: 'efua.addo@yahoo.com',
    tier: 'Bronze',
    loyalty_points: 45,
    total_spend: 1200.00,
    city: 'Beachway, Takoradi'
  }
];

export const INITIAL_TRANSFERS = [
  {
    id: 1,
    transfer_number: 'TRF-2026-0012',
    source_branch_id: 1,
    source_branch_name: 'Accra Flagship (HQ)',
    destination_branch_id: 2,
    destination_branch_name: 'Kumasi City Mall',
    created_by_name: 'Kofi Boateng',
    status: 'in_transit',
    item_count: 2,
    total_units: 25,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    notes: 'Urgent stock balancing: dispatching Olaplex and Maybelline lipsticks to Kumasi Mall.',
    items: [
      { product_id: 2, product_name: 'Olaplex No. 3 Hair Perfector (100ml)', sku: 'OLA-NO3-100', quantity: 15 },
      { product_id: 9, product_name: 'Maybelline SuperStay Vinyl Ink Liquid Lipstick', sku: 'MAY-LIP-VNL', quantity: 10 }
    ]
  },
  {
    id: 2,
    transfer_number: 'TRF-2026-0013',
    source_branch_id: 1,
    source_branch_name: 'Accra Flagship (HQ)',
    destination_branch_id: 3,
    destination_branch_name: 'Takoradi Harbor',
    created_by_name: 'Kofi Boateng',
    status: 'pending_approval',
    item_count: 1,
    total_units: 8,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    notes: 'Takoradi salon restock request: 8 bottles Fenty Foundation.',
    items: [
      { product_id: 3, product_name: 'Fenty Beauty Pro Filt\'r Soft Matte Foundation', sku: 'FNT-FND-420', quantity: 8 }
    ]
  },
  {
    id: 3,
    transfer_number: 'TRF-2026-0010',
    source_branch_id: 1,
    source_branch_name: 'Accra Flagship (HQ)',
    destination_branch_id: 2,
    destination_branch_name: 'Kumasi City Mall',
    created_by_name: 'Kofi Boateng',
    status: 'received',
    item_count: 1,
    total_units: 30,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    notes: 'Shea Radiance body butters successfully delivered and verified in Kumasi.',
    items: [
      { product_id: 6, product_name: 'Shea Radiance Golden Whipped Body Butter (250g)', sku: 'SHE-BTR-250', quantity: 30 }
    ]
  }
];

export const INITIAL_PURCHASES = [
  {
    id: 1,
    po_number: 'PO-2026-0088',
    supplier_id: 1,
    supplier_name: 'Accra Beauty Imports Ltd',
    destination_branch_id: 1,
    destination_branch_name: 'Accra Flagship (HQ)',
    status: 'approved',
    total_amount: 38500.00,
    expected_delivery_date: getRelativeDate(5),
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    notes: 'Q1 Restock of CeraVe, La Roche-Posay and Maybelline items from Europe.',
    items: [
      { product_id: 5, product_name: 'CeraVe Foaming Facial Cleanser', quantity: 100, unit_cost: 185.00, total_cost: 18500.00 },
      { product_id: 12, product_name: 'La Roche-Posay Anthelios SPF 50+', quantity: 90, unit_cost: 220.00, total_cost: 19800.00 }
    ]
  },
  {
    id: 2,
    po_number: 'PO-2026-0089',
    supplier_id: 2,
    supplier_name: 'Ghana Luxury Hair Direct',
    destination_branch_id: 1,
    destination_branch_name: 'Accra Flagship (HQ)',
    status: 'draft',
    total_amount: 28500.00,
    expected_delivery_date: getRelativeDate(10),
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    notes: 'Easter bridal season batch: 15 pieces 28" Virgin Brazilian HD Lace Wigs.',
    items: [
      { product_id: 1, product_name: 'Virgin Brazilian HD Lace Front Wig (28")', quantity: 15, unit_cost: 1900.00, total_cost: 28500.00 }
    ]
  }
];

export const INITIAL_SALES = [
  {
    id: 1,
    invoice_number: 'INV-2026-0041',
    branch_id: 1,
    branch_name: 'Accra Flagship (HQ)',
    cashier_id: 3,
    cashier_name: 'Efua Mensah',
    customer_id: 1,
    customer_name: 'Akosua Darko (VIP Platinum)',
    subtotal: 3750.00,
    discount_amount: 150.00,
    tax_amount: 180.00,
    total_amount: 3780.00,
    payment_method: 'mobile_money',
    payment_details: 'MTN MoMo Ref: GH260928001',
    amount_paid: 3780.00,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    items: [
      { product_id: 1, product_name: 'Virgin Brazilian HD Lace Front Wig (28")', quantity: 1, unit_price: 2850.00, total_price: 2850.00 },
      { product_id: 4, product_name: 'Huda Beauty Empowered Eyeshadow Palette', quantity: 1, unit_price: 890.00, total_price: 890.00 }
    ]
  },
  {
    id: 2,
    invoice_number: 'INV-2026-0042',
    branch_id: 1,
    branch_name: 'Accra Flagship (HQ)',
    cashier_id: 3,
    cashier_name: 'Efua Mensah',
    customer_id: 2,
    customer_name: 'Nana Ama Serwaa',
    subtotal: 900.00,
    discount_amount: 0.00,
    tax_amount: 45.00,
    total_amount: 945.00,
    payment_method: 'cash',
    payment_details: 'Cash Tendered: GH₵ 1,000.00 (Change: GH₵ 55.00)',
    amount_paid: 1000.00,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    items: [
      { product_id: 2, product_name: 'Olaplex No. 3 Hair Perfector (100ml)', quantity: 2, unit_price: 380.00, total_price: 760.00 },
      { product_id: 9, product_name: 'Maybelline SuperStay Vinyl Ink Liquid Lipstick', quantity: 1, unit_price: 145.00, total_price: 145.00 }
    ]
  },
  {
    id: 3,
    invoice_number: 'INV-2026-0043',
    branch_id: 2,
    branch_name: 'Kumasi City Mall',
    cashier_id: 2,
    cashier_name: 'Kwame Osei-Tutu',
    customer_id: 3,
    customer_name: 'Kofi Mensah Esq.',
    subtotal: 1250.00,
    discount_amount: 50.00,
    tax_amount: 60.00,
    total_amount: 1260.00,
    payment_method: 'visa_card',
    payment_details: 'Stanbic Bank Visa POS terminal Auth #44921',
    amount_paid: 1260.00,
    created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    items: [
      { product_id: 7, product_name: 'Arabian Oud Royal Velvet Perfume Spray (100ml)', quantity: 1, unit_price: 1250.00, total_price: 1250.00 }
    ]
  }
];

export const INITIAL_EXPENSES = [
  {
    id: 1,
    branch_id: 1,
    branch_name: 'Accra Flagship (HQ)',
    category: 'Electricity & Utilities',
    amount: 2450.00,
    description: 'ECG Commercial power tariff for salon AC and salon tools',
    recorded_by: 'Abena Frimpong',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 2,
    branch_id: 2,
    branch_name: 'Kumasi City Mall',
    category: 'Store Operations & Security',
    amount: 1200.00,
    description: 'Mall service charge and monthly glass storefront cleaning',
    recorded_by: 'Kwame Osei-Tutu',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    id: 3,
    branch_id: 1,
    branch_name: 'Accra Flagship (HQ)',
    category: 'Salon Consumables',
    amount: 680.00,
    description: 'Disinfectant Barbicide, sanitizers, disposable capes & neck strips',
    recorded_by: 'Abena Frimpong',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Critical FEFO Expiry Alert',
    message: '12 units of CeraVe Cleanser (Batch CRV-2024-B18) at Accra HQ expire in 12 days. Apply promotional markdown.',
    type: 'warning',
    branch_id: 1,
    link_url: '/batches',
    is_read: 0,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 2,
    title: 'Low Stock Reorder Alert',
    message: 'Maybelline SuperStay Vinyl Ink at Kumasi City Mall is at 4 units (reorder threshold is 15).',
    type: 'alert',
    branch_id: 2,
    link_url: '/inventory',
    is_read: 0,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 3,
    title: 'Inter-Branch Transfer Dispatched',
    message: 'TRF-2026-0012 with 25 items has been dispatched from Accra HQ to Kumasi Mall.',
    type: 'info',
    branch_id: 2,
    link_url: '/transfers',
    is_read: 0,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 1,
    user_name: 'Angales Executive (Super Admin)',
    action: 'SYSTEM_BOOTSTRAP',
    module: 'System',
    new_value: 'Enterprise Multi-Branch IMS deployed with Ghana Cedis (GH₵) currency policy',
    branch_id: 1,
    ip_address: '197.251.144.18',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 2,
    user_name: 'Efua Mensah (POS Cashier)',
    action: 'POS_CHECKOUT',
    module: 'Sales',
    new_value: 'Sale INV-2026-0041 completed for Akosua Darko (Total GH₵ 3,780.00 via MTN MoMo)',
    branch_id: 1,
    ip_address: '197.251.144.18',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 3,
    user_name: 'Kofi Boateng (Inventory Officer)',
    action: 'TRANSFER_DISPATCHED',
    module: 'Transfers',
    new_value: 'Stock transfer TRF-2026-0012 dispatched to Kumasi Mall (25 units)',
    branch_id: 1,
    ip_address: '197.251.144.18',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export const INITIAL_SETTINGS = {
  company_name: 'Angales Beauty Supplies Ltd',
  currency_code: 'GHS',
  currency_symbol: 'GH₵',
  vat_rate: '0.05',
  max_cashier_discount: '10',
  max_manager_discount: '30',
  low_stock_default_threshold: '15',
  expiry_warning_days: '90',
  receipt_header: 'ANGALES BEAUTY SUPPLIES\nLuxury Cosmetics, Wigs & Salon Haven\nKwame Nkrumah Ave, Accra, Ghana\nTel: +233 24 111 2233 | +233 20 444 7788',
  receipt_footer: 'Thank you for choosing Angales Beauty!\nGoods sold in pristine condition are exchangeable within 7 days with valid receipt.'
};
