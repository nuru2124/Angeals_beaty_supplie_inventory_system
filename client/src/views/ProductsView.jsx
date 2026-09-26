import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Sparkles,
  Barcode,
  Boxes,
  Clock,
  History,
  CheckCircle,
  X
} from 'lucide-react';

export default function ProductsView({ activeBranch, branches }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);

  // Form State for New Product
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    brand_id: '',
    subcategory: '',
    description: '',
    cost_price: '',
    selling_price: '',
    wholesale_price: '',
    min_stock_level: 10,
    max_stock_level: 200,
    reorder_level: 15,
    unit: 'pcs',
    initial_stock: 20,
    branch_id: activeBranch || 1,
    supplier_id: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchMetadata();
  }, [activeBranch, selectedCategory, selectedBrand, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `/api/products?`;
      if (activeBranch) url += `branch_id=${activeBranch}&`;
      if (selectedCategory) url += `category_id=${selectedCategory}&`;
      if (selectedBrand) url += `brand_id=${selectedBrand}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [catRes, brandRes, supRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/brands'),
        fetch('/api/purchasing/suppliers')
      ]);
      const [cats, brs, sups] = await Promise.all([
        catRes.json(),
        brandRes.json(),
        supRes.json()
      ]);
      setCategories(cats);
      setBrands(brs);
      setSuppliers(sups);
      if (cats.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: cats[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auto Generate SKU & Barcode
  const handleAutoGenerateSku = async () => {
    try {
      const res = await fetch(`/api/products/sku/generate?category_id=${formData.category_id}&brand_id=${formData.brand_id}`);
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        sku: data.sku,
        barcode: data.barcode
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // View Product Details
  const handleViewDetails = async (id) => {
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      setProductDetails(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit New Product
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');

      setShowAddModal(false);
      fetchProducts();
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        category_id: categories[0]?.id || '',
        brand_id: '',
        subcategory: '',
        description: '',
        cost_price: '',
        selling_price: '',
        wholesale_price: '',
        min_stock_level: 10,
        max_stock_level: 200,
        reorder_level: 15,
        unit: 'pcs',
        initial_stock: 20,
        branch_id: activeBranch || 1,
        supplier_id: ''
      });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products Catalog</h1>
          <p className="page-subtitle">
            Manage beauty SKUs, barcodes, cost and retail pricing, multi-branch stock, and supplier linkages
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAddModal(true); handleAutoGenerateSku(); }}>
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="ui-card" style={{ marginBottom: '18px' }}>
        <div className="ui-card-body" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
              <input
                type="text"
                placeholder="Search products by SKU, barcode, name..."
                className="form-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
            </div>

            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              className="form-select"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="ui-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product & SKU</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Cost Price</th>
                <th>Retail Price</th>
                <th>Stock Units</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const stock = activeBranch && p.branch_stock !== undefined ? p.branch_stock : p.total_stock;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          SKU: <strong>{p.sku}</strong> • Barcode: {p.barcode}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{p.category_name}</span>
                      </td>
                      <td>{p.brand_name || '—'}</td>
                      <td>GH₵ {parseFloat(p.cost_price).toFixed(2)}</td>
                      <td style={{ fontWeight: '700', color: '#c97a63' }}>
                        GH₵ {parseFloat(p.selling_price).toFixed(2)}
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: stock <= p.reorder_level ? '#d97706' : '#059669' }}>
                          {stock} {p.unit}
                        </div>
                        {stock <= p.reorder_level && (
                          <div style={{ fontSize: '0.68rem', color: '#d97706' }}>Low Stock (≤ {p.reorder_level})</div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewDetails(p.id)}
                          style={{ padding: '5px 10px' }}
                        >
                          <Eye size={14} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Add New Beauty Product</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <form onSubmit={handleSubmitProduct}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CeraVe SA Smoothing Cleanser 473ml"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    required
                    value={formData.category_id}
                    onChange={(e) => {
                      setFormData({ ...formData, category_id: e.target.value });
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Brand</label>
                  <select
                    className="form-select"
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                  >
                    <option value="">Select Brand (Optional)</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">SKU (Unique Item Code) *</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SKIN-CER-005"
                      className="form-input"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleAutoGenerateSku} title="Auto Generate SKU">
                      <Sparkles size={14} color="#c97a63" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Barcode Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 601001099"
                    className="form-input"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Cost Price (GHS) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 150.00"
                    className="form-input"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Retail Selling Price (GHS) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 230.00"
                    className="form-input"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Minimum Stock Alert Level</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Reorder Level</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Initial Stock Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.initial_stock}
                    onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Initial Stock Branch</label>
                  <select
                    className="form-select"
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Product & Provision Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details & Multi-Branch Stock Breakdown Modal */}
      {productDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>{productDetails.name}</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  SKU: {productDetails.sku} • Category: {productDetails.category_name} • Brand: {productDetails.brand_name || 'N/A'}
                </div>
              </div>
              <button onClick={() => setProductDetails(null)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div className="modal-body">
              {/* Pricing Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Cost Price</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700' }}>GH₵ {parseFloat(productDetails.cost_price).toFixed(2)}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Retail Price</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#c97a63' }}>GH₵ {parseFloat(productDetails.selling_price).toFixed(2)}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Unit Profit</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#059669' }}>
                    GH₵ {(productDetails.selling_price - productDetails.cost_price).toFixed(2)}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total System Stock</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700' }}>{productDetails.total_stock} {productDetails.unit}</div>
                </div>
              </div>

              {/* Branch Inventory Breakdown Table */}
              <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Boxes size={16} color="#c97a63" />
                <span>Multi-Branch Stock Distribution</span>
              </h4>
              <div className="table-responsive" style={{ marginBottom: '18px' }}>
                <table className="data-table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Branch Store</th>
                      <th>Total Stock</th>
                      <th>Reserved Units</th>
                      <th>Available for Sale</th>
                      <th>Reorder Level</th>
                      <th>Branch Stock Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productDetails.branchStock?.map((b) => (
                      <tr key={b.branch_id}>
                        <td style={{ fontWeight: '600' }}>{b.branch_name} ({b.branch_code})</td>
                        <td>{b.quantity}</td>
                        <td>{b.reserved_quantity}</td>
                        <td>
                          <strong style={{ color: b.available_quantity <= b.reorder_level ? '#d97706' : '#059669' }}>
                            {b.available_quantity}
                          </strong>
                        </td>
                        <td>{b.reorder_level}</td>
                        <td>GH₵ {parseFloat(b.inventory_value || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Batches Table with FEFO Expiry */}
              <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="#c97a63" />
                <span>Active Batches (FEFO Tracking)</span>
              </h4>
              <div className="table-responsive">
                <table className="data-table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Batch Number</th>
                      <th>Branch</th>
                      <th>Batch Quantity</th>
                      <th>Expiry Date</th>
                      <th>Days to Expiry</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productDetails.batches?.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '14px' }}>
                          No active batches with remaining stock.
                        </td>
                      </tr>
                    ) : (
                      productDetails.batches?.map((bat) => (
                        <tr key={bat.id}>
                          <td style={{ fontWeight: '600' }}>{bat.batch_number}</td>
                          <td>{bat.branch_name}</td>
                          <td>{bat.quantity} pcs</td>
                          <td>{bat.expiry_date}</td>
                          <td>
                            <strong>{bat.days_to_expiry}</strong> days
                          </td>
                          <td>
                            <span className={`badge badge-${bat.expiry_status}`}>
                              {bat.expiry_status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setProductDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
