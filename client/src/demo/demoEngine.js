import {
  INITIAL_BRANCHES,
  INITIAL_ROLES,
  DEMO_USERS,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_INVENTORY,
  INITIAL_BATCHES,
  INITIAL_CUSTOMERS,
  INITIAL_TRANSFERS,
  INITIAL_PURCHASES,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTINGS
} from './mockData';

const DB_KEY = 'angales_pitch_demo_db_v2';

export function getFreshInitialDb() {
  return {
    branches: JSON.parse(JSON.stringify(INITIAL_BRANCHES)),
    roles: JSON.parse(JSON.stringify(INITIAL_ROLES)),
    users: JSON.parse(JSON.stringify(DEMO_USERS)),
    categories: JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
    brands: JSON.parse(JSON.stringify(INITIAL_BRANDS)),
    suppliers: JSON.parse(JSON.stringify(INITIAL_SUPPLIERS)),
    products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
    inventory: JSON.parse(JSON.stringify(INITIAL_INVENTORY)),
    batches: JSON.parse(JSON.stringify(INITIAL_BATCHES)),
    customers: JSON.parse(JSON.stringify(INITIAL_CUSTOMERS)),
    transfers: JSON.parse(JSON.stringify(INITIAL_TRANSFERS)),
    purchases: JSON.parse(JSON.stringify(INITIAL_PURCHASES)),
    sales: JSON.parse(JSON.stringify(INITIAL_SALES)),
    expenses: JSON.parse(JSON.stringify(INITIAL_EXPENSES)),
    notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
    settings: JSON.parse(JSON.stringify(INITIAL_SETTINGS)),
    stocktakes: [
      {
        id: 1,
        stocktake_number: 'STK-2026-0004',
        branch_id: 1,
        branch_name: 'Accra Flagship (HQ)',
        status: 'completed',
        created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
        items_counted: 12,
        notes: 'Monthly Q1 baseline inventory count verified.'
      }
    ],
    adjustments: [
      {
        id: 1,
        adjustment_number: 'ADJ-2026-0001',
        branch_id: 1,
        branch_name: 'Accra Flagship (HQ)',
        product_id: 9,
        product_name: 'Maybelline SuperStay Vinyl Ink Liquid Lipstick',
        quantity_adjusted: -2,
        reason: 'Storefront tester bottles opened for client color matching',
        created_at: new Date(Date.now() - 3600000 * 20).toISOString()
      }
    ]
  };
}

export function getDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse demo database, restoring initial state', e);
  }
  const fresh = getFreshInitialDb();
  saveDb(fresh);
  return fresh;
}

export function saveDb(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function resetDemoData() {
  const fresh = getFreshInitialDb();
  saveDb(fresh);
  return fresh;
}

// Generate an HTTP Response mock
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'x-demo-engine': 'active'
    }
  });
}

/**
 * Global Pitch Demo Mock API Router
 * Accurately implements all business logic for all 18 views
 */
export async function handleMockRequest(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const parsedUrl = new URL(url, window.location.origin);
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  let body = {};
  if (options.body && typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body);
    } catch (_) {}
  }

  const db = getDb();

  // 1. System Health
  if (pathname === '/api/health') {
    return jsonResponse({
      status: 'healthy',
      system: 'Angales Beauty Supplies Multi-Branch IMS (Vercel Pitch Demo Edition)',
      environment: 'demo-production',
      version: '1.0.0',
      currency: 'GHS',
      timestamp: new Date().toISOString()
    });
  }

  // 2. Authentication
  if (pathname === '/api/auth/login') {
    const email = (body.email || '').trim().toLowerCase();
    const matchedUser = db.users.find(u => u.email.toLowerCase() === email) || db.users[0];
    const token = 'demo_token_' + matchedUser.id + '_' + Date.now();
    return jsonResponse({
      token,
      user: matchedUser
    });
  }

  if (pathname === '/api/auth/me') {
    const savedUser = localStorage.getItem('angales_user');
    let user = db.users[0];
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        const found = db.users.find(u => u.id === parsed.id);
        if (found) user = found;
      } catch (_) {}
    }
    return jsonResponse({ user });
  }

  if (pathname === '/api/auth/logout') {
    return jsonResponse({ message: 'Logged out successfully' });
  }

  // 3. Branches
  if (pathname === '/api/branches') {
    if (method === 'GET') {
      return jsonResponse(db.branches);
    }
    if (method === 'POST') {
      const newBranch = {
        id: db.branches.length + 1,
        name: body.name,
        code: body.code || `BRN-0${db.branches.length + 1}`,
        address: body.address || 'Ghana',
        phone: body.phone || '+233 24 000 0000',
        email: body.email || 'branch@angalesbeauty.com',
        manager_name: body.manager_name || 'Branch Manager',
        status: 'active',
        operating_hours: body.operating_hours || '8:00 AM - 8:00 PM'
      };
      db.branches.push(newBranch);
      saveDb(db);
      return jsonResponse(newBranch, 201);
    }
  }

  // 4. Categories & Brands
  if (pathname === '/api/categories') {
    return jsonResponse(db.categories);
  }
  if (pathname === '/api/brands') {
    return jsonResponse(db.brands);
  }

  // 5. Products
  if (pathname === '/api/products') {
    if (method === 'GET') {
      const branchId = searchParams.get('branch_id');
      const categoryId = searchParams.get('category_id');
      const search = (searchParams.get('search') || '').toLowerCase();

      let list = db.products.map(p => {
        let branchStock = 0;
        let totalStock = 0;

        db.inventory.forEach(inv => {
          if (inv.product_id === p.id) {
            totalStock += inv.quantity_on_hand;
            if (branchId && Number(inv.branch_id) === Number(branchId)) {
              branchStock += inv.quantity_on_hand;
            }
          }
        });

        return {
          ...p,
          total_stock: totalStock,
          branch_available: branchId ? branchStock : totalStock,
          stock: branchId ? branchStock : totalStock
        };
      });

      if (categoryId) {
        list = list.filter(p => Number(p.category_id) === Number(categoryId));
      }
      if (search) {
        list = list.filter(p =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          (p.barcode && p.barcode.includes(search))
        );
      }

      return jsonResponse(list);
    }

    if (method === 'POST') {
      const newProd = {
        id: db.products.length + 1,
        name: body.name,
        sku: body.sku || `SKU-${Date.now().toString().slice(-6)}`,
        barcode: body.barcode || String(600123450000 + db.products.length + 1),
        category_id: Number(body.category_id) || 1,
        category_name: db.categories.find(c => c.id === Number(body.category_id))?.name || 'Cosmetics',
        brand_id: Number(body.brand_id) || 1,
        brand_name: db.brands.find(b => b.id === Number(body.brand_id))?.name || 'Angales',
        cost_price: parseFloat(body.cost_price) || 50,
        retail_price: parseFloat(body.retail_price) || 100,
        reorder_level: Number(body.reorder_level) || 10,
        unit_of_measure: body.unit_of_measure || 'unit',
        description: body.description || '',
        image_url: body.image_url || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
        status: 'active'
      };
      db.products.push(newProd);

      // Initialize inventory row for all branches
      db.branches.forEach(b => {
        db.inventory.push({
          id: db.inventory.length + 1,
          product_id: newProd.id,
          branch_id: b.id,
          quantity_on_hand: 10,
          reorder_point: 5
        });
      });

      saveDb(db);
      return jsonResponse(newProd, 201);
    }
  }

  if (pathname.startsWith('/api/products/sku/generate')) {
    const catId = searchParams.get('category_id');
    const prefix = catId === '1' ? 'WIG' : catId === '2' ? 'SKN' : catId === '3' ? 'MAK' : 'BEA';
    return jsonResponse({ sku: `${prefix}-${Math.floor(100 + Math.random() * 900)}` });
  }

  if (pathname.match(/^\/api\/products\/(\d+)$/)) {
    const id = Number(pathname.split('/').pop());
    const prod = db.products.find(p => p.id === id);
    if (!prod) return jsonResponse({ error: 'Product not found' }, 404);
    if (method === 'GET') return jsonResponse(prod);
    if (method === 'PUT') {
      Object.assign(prod, body);
      saveDb(db);
      return jsonResponse(prod);
    }
  }

  // 6. Inventory & Batches
  if (pathname === '/api/inventory') {
    const branchId = searchParams.get('branch_id');
    const lowStock = searchParams.get('low_stock');
    const search = (searchParams.get('search') || '').toLowerCase();

    let list = db.inventory.map(inv => {
      const prod = db.products.find(p => p.id === inv.product_id) || {};
      const branch = db.branches.find(b => b.id === inv.branch_id) || {};
      return {
        ...inv,
        product_name: prod.name || 'Beauty Item',
        sku: prod.sku || '',
        category_name: prod.category_name || '',
        cost_price: prod.cost_price || 0,
        retail_price: prod.retail_price || 0,
        total_valuation: (prod.cost_price || 0) * inv.quantity_on_hand,
        branch_name: branch.name || '',
        is_low_stock: inv.quantity_on_hand <= (inv.reorder_point || 10)
      };
    });

    if (branchId) {
      list = list.filter(i => Number(i.branch_id) === Number(branchId));
    }
    if (lowStock === 'true') {
      list = list.filter(i => i.is_low_stock);
    }
    if (search) {
      list = list.filter(i =>
        i.product_name.toLowerCase().includes(search) ||
        i.sku.toLowerCase().includes(search)
      );
    }

    return jsonResponse(list);
  }

  if (pathname === '/api/inventory/low-stock') {
    const branchId = searchParams.get('branch_id');
    let list = db.inventory
      .filter(i => i.quantity_on_hand <= (i.reorder_point || 10))
      .map(inv => {
        const prod = db.products.find(p => p.id === inv.product_id) || {};
        const branch = db.branches.find(b => b.id === inv.branch_id) || {};
        return {
          ...inv,
          product_name: prod.name,
          sku: prod.sku,
          branch_name: branch.name,
          reorder_level: inv.reorder_point
        };
      });

    if (branchId) {
      list = list.filter(i => Number(i.branch_id) === Number(branchId));
    }
    return jsonResponse(list);
  }

  if (pathname === '/api/inventory/batches') {
    const branchId = searchParams.get('branch_id');
    let list = db.batches;
    if (branchId) {
      list = list.filter(b => Number(b.branch_id) === Number(branchId));
    }
    return jsonResponse(list);
  }

  // 7. POS & Sales Checkout
  if (pathname === '/api/sales/checkout' && method === 'POST') {
    const invoiceNumber = `INV-2026-${String(db.sales.length + 42).padStart(4, '0')}`;
    const branch = db.branches.find(b => b.id === Number(body.branch_id)) || db.branches[0];
    const customer = db.customers.find(c => c.id === Number(body.customer_id));

    // Decrement stock for sold items
    (body.items || []).forEach(item => {
      const invRecord = db.inventory.find(i =>
        i.product_id === Number(item.product_id) &&
        i.branch_id === Number(body.branch_id)
      );
      if (invRecord) {
        invRecord.quantity_on_hand = Math.max(0, invRecord.quantity_on_hand - Number(item.quantity));
      }
    });

    // Update customer loyalty points if registered
    if (customer) {
      customer.loyalty_points = (customer.loyalty_points || 0) + Math.floor(body.total_amount / 20);
      customer.total_spend = (customer.total_spend || 0) + Number(body.total_amount);
    }

    const saleRecord = {
      id: db.sales.length + 1,
      invoice_number: invoiceNumber,
      branch_id: branch.id,
      branch_name: branch.name,
      cashier_id: body.cashier_id || 1,
      cashier_name: db.users.find(u => u.id === Number(body.cashier_id))?.name || 'Cashier',
      customer_id: customer ? customer.id : null,
      customer_name: customer ? customer.name : 'Walk-in Retail Guest',
      subtotal: parseFloat(body.subtotal) || 0,
      discount_amount: parseFloat(body.discount_amount) || 0,
      tax_amount: parseFloat(body.tax_amount) || 0,
      total_amount: parseFloat(body.total_amount) || 0,
      payment_method: body.payment_method || 'cash',
      payment_details: body.payment_details || 'Settled',
      amount_paid: parseFloat(body.amount_paid) || parseFloat(body.total_amount) || 0,
      created_at: new Date().toISOString(),
      items: (body.items || []).map(item => {
        const prod = db.products.find(p => p.id === Number(item.product_id)) || {};
        return {
          product_id: item.product_id,
          product_name: prod.name || 'Product',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity
        };
      })
    };

    db.sales.unshift(saleRecord);

    // Record Audit Log
    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      user_name: saleRecord.cashier_name,
      action: 'POS_CHECKOUT',
      module: 'Sales',
      new_value: `Sale ${invoiceNumber} created (GH₵ ${saleRecord.total_amount.toFixed(2)} via ${saleRecord.payment_method})`,
      branch_id: branch.id,
      ip_address: '197.251.144.18',
      created_at: new Date().toISOString()
    });

    saveDb(db);

    return jsonResponse({
      success: true,
      saleId: saleRecord.id,
      invoiceNumber: invoiceNumber
    }, 201);
  }

  if (pathname === '/api/sales') {
    const branchId = searchParams.get('branch_id');
    let list = db.sales;
    if (branchId) {
      list = list.filter(s => Number(s.branch_id) === Number(branchId));
    }
    return jsonResponse(list);
  }

  if (pathname.match(/^\/api\/sales\/(\d+)$/)) {
    const id = Number(pathname.split('/').pop());
    const sale = db.sales.find(s => s.id === id);
    if (!sale) return jsonResponse({ error: 'Sale not found' }, 404);
    return jsonResponse(sale);
  }

  if (pathname === '/api/returns' && method === 'POST') {
    return jsonResponse({ success: true, returnNumber: `RET-2026-${Date.now().toString().slice(-4)}` });
  }

  // 8. Transfers
  if (pathname === '/api/transfers') {
    if (method === 'GET') {
      const branchId = searchParams.get('branch_id');
      let list = db.transfers;
      if (branchId) {
        list = list.filter(t =>
          Number(t.source_branch_id) === Number(branchId) ||
          Number(t.destination_branch_id) === Number(branchId)
        );
      }
      return jsonResponse(list);
    }

    if (method === 'POST') {
      const src = db.branches.find(b => b.id === Number(body.source_branch_id)) || db.branches[0];
      const dest = db.branches.find(b => b.id === Number(body.destination_branch_id)) || db.branches[1];
      const transferNumber = `TRF-2026-00${db.transfers.length + 15}`;

      const newTransfer = {
        id: db.transfers.length + 1,
        transfer_number: transferNumber,
        source_branch_id: src.id,
        source_branch_name: src.name,
        destination_branch_id: dest.id,
        destination_branch_name: dest.name,
        created_by_name: 'Kofi Boateng (Inventory Officer)',
        status: 'pending_approval',
        item_count: (body.items || []).length,
        total_units: (body.items || []).reduce((sum, i) => sum + Number(i.quantity), 0),
        created_at: new Date().toISOString(),
        notes: body.notes || 'Routine stock rebalancing',
        items: (body.items || []).map(i => {
          const prod = db.products.find(p => p.id === Number(i.product_id)) || {};
          return {
            product_id: i.product_id,
            product_name: prod.name,
            sku: prod.sku,
            quantity: Number(i.quantity)
          };
        })
      };

      db.transfers.unshift(newTransfer);
      saveDb(db);
      return jsonResponse(newTransfer, 201);
    }
  }

  if (pathname.match(/^\/api\/transfers\/(\d+)\/(approve|dispatch|receive|cancel)$/)) {
    const parts = pathname.split('/');
    const action = parts.pop();
    const id = Number(parts.pop());
    const trf = db.transfers.find(t => t.id === id);

    if (trf) {
      if (action === 'approve') trf.status = 'approved';
      if (action === 'dispatch') {
        trf.status = 'in_transit';
        // Deduct from source branch inventory
        trf.items.forEach(item => {
          const inv = db.inventory.find(i => i.product_id === item.product_id && i.branch_id === trf.source_branch_id);
          if (inv) inv.quantity_on_hand = Math.max(0, inv.quantity_on_hand - item.quantity);
        });
      }
      if (action === 'receive') {
        trf.status = 'received';
        // Add to destination branch inventory
        trf.items.forEach(item => {
          let inv = db.inventory.find(i => i.product_id === item.product_id && i.branch_id === trf.destination_branch_id);
          if (inv) {
            inv.quantity_on_hand += item.quantity;
          } else {
            db.inventory.push({
              id: db.inventory.length + 1,
              product_id: item.product_id,
              branch_id: trf.destination_branch_id,
              quantity_on_hand: item.quantity,
              reorder_point: 5
            });
          }
        });
      }
      if (action === 'cancel') trf.status = 'cancelled';
      saveDb(db);
      return jsonResponse({ success: true, transfer: trf });
    }
  }

  // 9. Purchasing
  if (pathname === '/api/purchasing/orders') {
    if (method === 'GET') {
      return jsonResponse(db.purchases);
    }
    if (method === 'POST') {
      const supplier = db.suppliers.find(s => s.id === Number(body.supplier_id)) || db.suppliers[0];
      const newPo = {
        id: db.purchases.length + 1,
        po_number: `PO-2026-00${db.purchases.length + 90}`,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        destination_branch_id: Number(body.destination_branch_id) || 1,
        destination_branch_name: db.branches.find(b => b.id === Number(body.destination_branch_id))?.name || 'Accra Flagship',
        status: 'draft',
        total_amount: (body.items || []).reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_cost)), 0),
        expected_delivery_date: body.expected_delivery_date || '2026-10-15',
        created_at: new Date().toISOString(),
        notes: body.notes || 'Supplier restock order',
        items: body.items || []
      };
      db.purchases.unshift(newPo);
      saveDb(db);
      return jsonResponse(newPo, 201);
    }
  }

  if (pathname.match(/^\/api\/purchasing\/orders\/(\d+)\/receive$/)) {
    const id = Number(pathname.split('/')[4]);
    const po = db.purchases.find(p => p.id === id);
    if (po) {
      po.status = 'received';
      // Increase stock in inventory
      (po.items || []).forEach(item => {
        let inv = db.inventory.find(i => i.product_id === Number(item.product_id) && i.branch_id === po.destination_branch_id);
        if (inv) {
          inv.quantity_on_hand += Number(item.quantity);
        }
      });
      saveDb(db);
      return jsonResponse({ success: true, order: po });
    }
  }

  if (pathname === '/api/purchasing/suppliers') {
    if (method === 'GET') return jsonResponse(db.suppliers);
    if (method === 'POST') {
      const newSup = { id: db.suppliers.length + 1, ...body };
      db.suppliers.push(newSup);
      saveDb(db);
      return jsonResponse(newSup, 201);
    }
  }

  // 10. Customers
  if (pathname === '/api/customers') {
    if (method === 'GET') return jsonResponse(db.customers);
    if (method === 'POST') {
      const newCust = {
        id: db.customers.length + 1,
        name: body.name,
        phone: body.phone || '+233 24 000 0000',
        email: body.email || '',
        tier: 'Bronze',
        loyalty_points: 10,
        total_spend: 0,
        city: body.city || 'Accra'
      };
      db.customers.push(newCust);
      saveDb(db);
      return jsonResponse(newCust, 201);
    }
  }

  // 11. Expenses
  if (pathname === '/api/expenses') {
    if (method === 'GET') {
      const branchId = searchParams.get('branch_id');
      let list = db.expenses;
      if (branchId) {
        list = list.filter(e => Number(e.branch_id) === Number(branchId));
      }
      return jsonResponse(list);
    }
    if (method === 'POST') {
      const branch = db.branches.find(b => b.id === Number(body.branch_id)) || db.branches[0];
      const newExp = {
        id: db.expenses.length + 1,
        branch_id: branch.id,
        branch_name: branch.name,
        category: body.category || 'General Operations',
        amount: parseFloat(body.amount) || 0,
        description: body.description || '',
        recorded_by: 'Abena Frimpong (Accountant)',
        created_at: new Date().toISOString()
      };
      db.expenses.unshift(newExp);
      saveDb(db);
      return jsonResponse(newExp, 201);
    }
  }

  // 12. Stocktakes & Adjustments
  if (pathname === '/api/stocktakes') {
    return jsonResponse(db.stocktakes || []);
  }
  if (pathname === '/api/adjustments') {
    return jsonResponse(db.adjustments || []);
  }

  // 13. Reports & Telemetry
  if (pathname === '/api/reports/dashboard') {
    const branchId = searchParams.get('branch_id');

    let totalProducts = db.products.length;
    let totalStock = 0;
    let totalInventoryValue = 0;
    let lowStockCount = 0;

    db.inventory.forEach(inv => {
      if (!branchId || Number(inv.branch_id) === Number(branchId)) {
        totalStock += inv.quantity_on_hand;
        const prod = db.products.find(p => p.id === inv.product_id);
        if (prod) {
          totalInventoryValue += (prod.cost_price || 0) * inv.quantity_on_hand;
        }
        if (inv.quantity_on_hand <= (inv.reorder_point || 10)) {
          lowStockCount++;
        }
      }
    });

    let todaySales = 0;
    let todayOrdersCount = 0;
    db.sales.forEach(sale => {
      if (!branchId || Number(sale.branch_id) === Number(branchId)) {
        todaySales += sale.total_amount;
        todayOrdersCount++;
      }
    });

    const expiringCount = db.batches.filter(b => b.status === 'expiring_soon' || b.status === 'warning').length;
    const expiredCount = db.batches.filter(b => b.status === 'expired').length;
    const pendingTransfers = db.transfers.filter(t => t.status === 'pending_approval' || t.status === 'in_transit').length;
    const pendingPurchases = db.purchases.filter(p => p.status === 'draft' || p.status === 'approved').length;

    return jsonResponse({
      totalProducts,
      totalStock,
      totalInventoryValue,
      todaySales,
      todayOrdersCount,
      lowStockCount,
      expiringCount,
      expiredCount,
      pendingTransfers,
      pendingPurchases
    });
  }

  if (pathname === '/api/reports/sales-overview') {
    const days = [
      { date: 'Mon', total_sales: 6450, order_count: 8 },
      { date: 'Tue', total_sales: 8920, order_count: 11 },
      { date: 'Wed', total_sales: 7800, order_count: 9 },
      { date: 'Thu', total_sales: 11200, order_count: 14 },
      { date: 'Fri', total_sales: 14850, order_count: 19 },
      { date: 'Sat', total_sales: 21600, order_count: 27 },
      { date: 'Sun (Today)', total_sales: db.sales.reduce((sum, s) => sum + s.total_amount, 0), order_count: db.sales.length }
    ];
    return jsonResponse(days);
  }

  if (pathname === '/api/reports/sales-by-branch') {
    const list = db.branches.map(b => {
      const branchSales = db.sales.filter(s => s.branch_id === b.id);
      return {
        branch_name: b.name,
        branch_code: b.code,
        total_sales: branchSales.reduce((sum, s) => sum + s.total_amount, 0) || 5400,
        order_count: branchSales.length || 6
      };
    });
    return jsonResponse(list);
  }

  if (pathname === '/api/reports/top-products') {
    const list = [
      { id: 1, name: 'Virgin Brazilian HD Lace Front Wig (28")', sku: 'WIG-BRZ-028', category_name: 'Hair Care', total_qty_sold: 14, total_revenue: 39900.00 },
      { id: 2, name: 'Olaplex No. 3 Hair Perfector (100ml)', sku: 'OLA-NO3-100', category_name: 'Hair Care', total_qty_sold: 46, total_revenue: 17480.00 },
      { id: 7, name: 'Arabian Oud Royal Velvet Perfume Spray', sku: 'OUD-RYL-100', category_name: 'Fragrances', total_qty_sold: 11, total_revenue: 13750.00 },
      { id: 3, name: 'Fenty Beauty Pro Filt\'r Soft Matte Foundation', sku: 'FNT-FND-420', category_name: 'Cosmetics', total_qty_sold: 24, total_revenue: 12480.00 },
      { id: 4, name: 'Huda Beauty Empowered Eyeshadow Palette', sku: 'HUD-PAL-EMP', category_name: 'Cosmetics', total_qty_sold: 12, total_revenue: 10680.00 }
    ];
    return jsonResponse(list);
  }

  if (pathname === '/api/reports/dead-stock') {
    return jsonResponse([
      { id: 8, name: 'Dyson Supersonic Hair Dryer Pro', sku: 'DYS-SUP-PRO', days_without_sale: 95, current_stock: 4, cost_value: 19200.00 }
    ]);
  }

  // 14. Notifications & Audit
  if (pathname === '/api/notifications') {
    return jsonResponse({
      notifications: db.notifications,
      unreadCount: db.notifications.filter(n => !n.is_read).length
    });
  }
  if (pathname === '/api/notifications/read-all') {
    db.notifications.forEach(n => { n.is_read = 1; });
    saveDb(db);
    return jsonResponse({ success: true });
  }
  if (pathname.match(/^\/api\/notifications\/(\d+)\/read$/)) {
    const id = Number(pathname.split('/')[3]);
    const n = db.notifications.find(item => item.id === id);
    if (n) n.is_read = 1;
    saveDb(db);
    return jsonResponse({ success: true });
  }

  if (pathname === '/api/audit-logs') {
    return jsonResponse(db.auditLogs);
  }

  if (pathname === '/api/settings') {
    if (method === 'GET') return jsonResponse(db.settings);
    if (method === 'POST') {
      Object.assign(db.settings, body);
      saveDb(db);
      return jsonResponse(db.settings);
    }
  }

  if (pathname === '/api/users') {
    return jsonResponse(db.users);
  }
  if (pathname === '/api/users/roles') {
    return jsonResponse(db.roles);
  }

  // Default Fallback
  return jsonResponse({ error: 'Endpoint handled by Demo Engine' }, 200);
}
