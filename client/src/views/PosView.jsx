import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  CreditCard,
  Smartphone,
  Banknote,
  Building,
  User,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import ThermalReceiptModal from '../components/ThermalReceiptModal';

export default function PosView({ activeBranch, branches, currentUser }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [momoReference, setMomoReference] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Receipt Modal State
  const [completedReceipt, setCompletedReceipt] = useState(null);

  const barcodeInputRef = useRef(null);

  // Default to first branch if activeBranch is null (HQ)
  const effectiveBranchId = activeBranch || (branches.length > 0 ? branches[0].id : 1);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomers();
  }, [effectiveBranchId, selectedCategory]);

  const fetchProducts = async () => {
    try {
      let url = `/api/products?branch_id=${effectiveBranchId}`;
      if (selectedCategory) url += `&category_id=${selectedCategory}`;
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products for POS:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Product to Cart
  const addToCart = (product) => {
    setErrorMsg('');
    const existing = cart.find(item => item.product_id === product.id);
    const available = product.branch_available !== undefined ? product.branch_available : product.total_stock;

    if (existing) {
      if (existing.quantity + 1 > available) {
        setErrorMsg(`Cannot add more "${product.name}". Only ${available} available in stock.`);
        return;
      }
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (available <= 0) {
        setErrorMsg(`"${product.name}" is currently out of stock at this branch.`);
        return;
      }
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        price: product.selling_price,
        unit: product.unit || 'pcs',
        quantity: 1,
        maxStock: available
      }]);
    }
  };

  // Handle Barcode Scan / Enter
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const code = barcodeInput.trim();
    const match = products.find(p => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());

    if (match) {
      addToCart(match);
      setBarcodeInput('');
    } else {
      setErrorMsg(`Barcode or SKU "${code}" not found.`);
    }
  };

  // Cart Quantity Controls
  const updateQty = (productId, delta) => {
    setErrorMsg('');
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.maxStock) {
          setErrorMsg(`Max available stock for "${item.name}" is ${item.maxStock}.`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const taxAmount = Math.round((subtotal - discountAmount) * 0.05 * 100) / 100; // 5% Ghana VAT
  const totalAmount = subtotal - discountAmount + taxAmount;

  const currentPaid = parseFloat(amountPaid) || totalAmount;
  const changeAmount = Math.max(0, currentPaid - totalAmount);

  // Discount permission check
  const handleDiscountChange = (val) => {
    const num = Number(val);
    const role = currentUser?.role || 'cashier';
    if (role === 'cashier' && num > 10) {
      setErrorMsg('Cashier discount limit is 10%. Please request Branch Manager approval.');
      return;
    }
    if (role === 'branch_manager' && num > 30) {
      setErrorMsg('Manager discount limit is 30%. Please request Admin approval.');
      return;
    }
    setDiscountPercent(num);
  };

  // Handle Complete Sale
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('Your cart is empty. Add products to checkout.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        branch_id: effectiveBranchId,
        cashier_id: currentUser?.id || 1,
        customer_id: selectedCustomerId ? parseInt(selectedCustomerId, 10) : null,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price
        })),
        subtotal,
        discount_amount: discountAmount,
        discount_percentage: discountPercent,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_details: paymentMethod === 'mobile_money' ? momoReference : null,
        amount_paid: currentPaid
      };

      const res = await fetch('/api/sales/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to complete sale');
      }

      // Celebrate sale!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#c97a63', '#10b981', '#f59e0b', '#3b82f6']
      });

      // Prepare Thermal Receipt
      const curBranch = branches.find(b => b.id === effectiveBranchId);
      const curCustomer = customers.find(c => c.id === parseInt(selectedCustomerId, 10));

      setCompletedReceipt({
        invoiceNumber: result.invoiceNumber,
        branch: curBranch,
        customer: curCustomer,
        cashier: currentUser?.name || 'Cashier',
        items: cart,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total: totalAmount,
        paymentMethod,
        paymentDetails: momoReference,
        amountPaid: currentPaid,
        change: changeAmount,
        timestamp: new Date().toISOString()
      });

      // Reset cart and state
      setCart([]);
      setAmountPaid('');
      setMomoReference('');
      setDiscountPercent(0);

      // Refresh products to reflect new stock
      fetchProducts();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter products by search
  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q);
  });

  const currentBranchObj = branches.find(b => b.id === effectiveBranchId);

  return (
    <div>
      {/* POS Top Notice Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '10px 18px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#c97a63" />
          <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>Active Terminal:</span>
          <span className="badge badge-purple" style={{ fontSize: '0.85rem' }}>
            {currentBranchObj ? `${currentBranchObj.name} (${currentBranchObj.code})` : 'Accra Flagship'}
          </span>
          <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: '8px' }}>
            Cashier: <strong>{currentUser?.name || 'Cashier'}</strong>
          </span>
        </div>

        {/* Barcode Quick Scanner Form */}
        <form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Barcode size={17} color="#64748b" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan Barcode / SKU..."
              className="form-input"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              style={{ width: '220px', paddingLeft: '34px', paddingRight: '8px', height: '34px', fontSize: '0.82rem' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm" style={{ height: '34px' }}>
            Add
          </button>
        </form>
      </div>

      {errorMsg && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          borderRadius: '8px',
          padding: '10px 16px',
          marginBottom: '16px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* POS 2-Column Terminal Layout */}
      <div className="pos-container">
        {/* Left: Product Selector */}
        <div className="pos-products-panel">
          {/* Search & Category Filter */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type="text"
                placeholder="Search beauty products by name, brand, or SKU..."
                className="form-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            {/* Category Pills */}
            <div className="filter-tabs">
              <button
                className={`filter-tab ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                All Categories ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`filter-tab ${selectedCategory === c.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              {filteredProducts.map((p) => {
                const stock = p.branch_available !== undefined ? p.branch_available : p.total_stock;
                const isOutOfStock = stock <= 0;
                return (
                  <div
                    key={p.id}
                    className="pos-product-card"
                    style={{
                      opacity: isOutOfStock ? 0.55 : 1,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                    }}
                    onClick={() => !isOutOfStock && addToCart(p)}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.sku}</span>
                        <span className={`badge ${isOutOfStock ? 'badge-danger' : (stock <= 5 ? 'badge-warning' : 'badge-success')}`} style={{ fontSize: '0.68rem' }}>
                          {isOutOfStock ? 'Out' : `${stock} left`}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.86rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.3, marginBottom: '6px' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{p.category_name}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '800', color: '#c97a63' }}>
                        GH₵ {parseFloat(p.selling_price).toFixed(2)}
                      </span>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={isOutOfStock}
                        style={{ padding: '4px 8px', borderRadius: '6px' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Cart & Checkout Drawer */}
        <div className="pos-cart-panel">
          {/* Cart Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={18} color="#c97a63" />
              <span style={{ fontWeight: '700', fontSize: '1rem' }}>Order Cart</span>
              <span className="badge badge-neutral">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} color="#64748b" />
              <select
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{ fontSize: '0.82rem', padding: '5px 8px' }}
              >
                <option value="">Walk-in Customer (Standard)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customer_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart Items List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                <ShoppingCart size={32} color="#cbd5e1" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '0.88rem' }}>Cart is currently empty</p>
                <p style={{ fontSize: '0.75rem' }}>Select products or scan barcodes to begin</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ flex: 1, paddingRight: '8px' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#0f172a' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      GH₵ {parseFloat(item.price).toFixed(2)} × {item.quantity} = <strong>GH₵ {(item.price * item.quantity).toFixed(2)}</strong>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => updateQty(item.product_id, -1)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', minWidth: '18px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.product_id, 1)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      style={{ color: '#94a3b8', padding: '4px', marginLeft: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Pricing Summary */}
          <div style={{ padding: '14px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Subtotal:</span>
              <span>GH₵ {subtotal.toFixed(2)}</span>
            </div>

            {/* Discount selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Discount:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <select
                  value={discountPercent}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  style={{ fontSize: '0.78rem', padding: '2px 4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="10">10% (Staff Max)</option>
                  <option value="15">15%</option>
                  <option value="20">20%</option>
                  <option value="30">30% (Manager Max)</option>
                </select>
                {discountAmount > 0 && <span style={{ color: '#059669', fontWeight: '700' }}>-GH₵ {discountAmount.toFixed(2)}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>VAT / Tax (5%):</span>
              <span>GH₵ {taxAmount.toFixed(2)}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.15rem',
              fontWeight: '800',
              color: '#0f172a',
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '6px',
              marginBottom: '10px'
            }}>
              <span>TOTAL DUE:</span>
              <span style={{ color: '#c97a63' }}>GH₵ {totalAmount.toFixed(2)}</span>
            </div>

            {/* Payment Method Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
              {[
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'mobile_money', label: 'MoMo', icon: Smartphone },
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'bank_transfer', label: 'Bank', icon: Building }
              ].map(m => {
                const Icon = m.icon;
                const isSel = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '6px',
                      border: isSel ? '2px solid #c97a63' : '1px solid #cbd5e1',
                      background: isSel ? '#fdf2f0' : '#ffffff',
                      color: isSel ? '#c97a63' : '#475569',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <Icon size={14} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Money Ref if MoMo selected */}
            {paymentMethod === 'mobile_money' && (
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="MTN / Telecel MoMo Ref ID (e.g. 9841203)"
                  className="form-input"
                  value={momoReference}
                  onChange={(e) => setMomoReference(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                />
              </div>
            )}

            {/* Amount Paid & Change for Cash */}
            {paymentMethod === 'cash' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <input
                  type="number"
                  placeholder={`Paid (GH₵ ${totalAmount.toFixed(2)})`}
                  className="form-input"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '6px 8px', flex: 1 }}
                />
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: changeAmount > 0 ? '#059669' : '#64748b', whiteSpace: 'nowrap' }}>
                  Change: GH₵ {changeAmount.toFixed(2)}
                </div>
              </div>
            )}

            {/* Checkout Action Button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
              disabled={loading || cart.length === 0}
              onClick={handleCheckout}
            >
              {loading ? 'Processing Sale...' : `Charge GH₵ ${totalAmount.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Thermal Receipt Preview Modal */}
      {completedReceipt && (
        <ThermalReceiptModal
          receiptData={completedReceipt}
          onClose={() => setCompletedReceipt(null)}
        />
      )}
    </div>
  );
}
