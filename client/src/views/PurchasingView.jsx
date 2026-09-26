import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  PackageCheck,
  Building,
  Phone,
  Mail,
  Eye,
  CheckCircle,
  X,
  FileText
} from 'lucide-react';

export default function PurchasingView({ activeBranch, branches, currentUser }) {
  const [tab, setTab] = useState('orders'); // orders, suppliers
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showNewPoModal, setShowNewPoModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New PO Form
  const [newPo, setNewPo] = useState({
    supplier_id: '',
    branch_id: activeBranch || (branches[0]?.id || 1),
    expected_delivery_date: '',
    notes: '',
    items: [{ product_id: '', quantity_ordered: 20, cost_price: 100.00 }]
  });

  // New Supplier Form
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    company_name: '',
    phone: '',
    email: '',
    address: '',
    contact_person: '',
    payment_terms: 'Net 30'
  });

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  }, [activeBranch]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = `/api/purchasing/orders?`;
      if (activeBranch) url += `branch_id=${activeBranch}`;
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/purchasing/suppliers');
      const data = await res.json();
      setSuppliers(data);
      if (data.length > 0 && !newPo.supplier_id) {
        setNewPo(prev => ({ ...prev, supplier_id: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
      if (data.length > 0 && !newPo.items[0].product_id) {
        setNewPo(prev => ({
          ...prev,
          items: [{ product_id: data[0].id, quantity_ordered: 25, cost_price: data[0].cost_price }]
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReceiveGoods = async (poId) => {
    if (!confirm('Confirm receiving all items in this purchase order? This will increase branch stock and generate new FEFO batches.')) return;

    try {
      const res = await fetch(`/api/purchasing/orders/${poId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received_by: currentUser?.id || 1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Goods received successfully! Branch inventory updated.');
      fetchOrders();
      if (selectedOrder) setSelectedOrder(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/purchasing/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPo,
          created_by: currentUser?.id || 1
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowNewPoModal(false);
      fetchOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/purchasing/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowAddSupplierModal(false);
      fetchSuppliers();
      setNewSupplier({
        name: '',
        company_name: '',
        phone: '',
        email: '',
        address: '',
        contact_person: '',
        payment_terms: 'Net 30'
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewPo = async (id) => {
    try {
      const res = await fetch(`/api/purchasing/orders/${id}`);
      const data = await res.json();
      setSelectedOrder(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchasing & Suppliers</h1>
          <p className="page-subtitle">
            Manage purchase orders, suppliers catalog, and stock receiving workflows
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setShowAddSupplierModal(true)}>
            <Building size={16} />
            <span>Add Supplier</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowNewPoModal(true)}>
            <Plus size={16} />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '18px' }}>
        <button
          className={`filter-tab ${tab === 'orders' ? 'active' : ''}`}
          onClick={() => setTab('orders')}
        >
          Purchase Orders ({orders.length})
        </button>
        <button
          className={`filter-tab ${tab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setTab('suppliers')}
        >
          Suppliers Directory ({suppliers.length})
        </button>
      </div>

      {/* Tab 1: Orders */}
      {tab === 'orders' && (
        <div className="ui-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Branch Store</th>
                  <th>Total Cost (GHS)</th>
                  <th>Expected Delivery</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((po) => (
                    <tr key={po.id}>
                      <td>
                        <strong>{po.po_number}</strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{po.supplier_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{po.company_name}</div>
                      </td>
                      <td>{po.branch_name} ({po.branch_code})</td>
                      <td style={{ fontWeight: '700', color: '#0f172a' }}>
                        GH₵ {parseFloat(po.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td>{po.expected_delivery_date || 'Standard Delivery'}</td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(po.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td>
                        <span className={`badge ${po.status === 'received' ? 'badge-success' : 'badge-warning'}`}>
                          {po.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleViewPo(po.id)}
                            title="View Items"
                          >
                            <Eye size={14} />
                          </button>
                          {po.status !== 'received' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleReceiveGoods(po.id)}
                              title="Receive Goods into Inventory"
                            >
                              <PackageCheck size={14} />
                              <span>Receive</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Suppliers */}
      {tab === 'suppliers' && (
        <div className="ui-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Supplier / Company</th>
                  <th>Contact Person</th>
                  <th>Phone & Email</th>
                  <th>Payment Terms</th>
                  <th>Outstanding Balance</th>
                  <th>Supplied Products</th>
                  <th>Total POs</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: '700' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.company_name} • {s.address}</div>
                    </td>
                    <td>{s.contact_person || 'Representative'}</td>
                    <td>
                      <div>{s.phone}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.email}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{s.payment_terms}</span>
                    </td>
                    <td style={{ fontWeight: '700', color: s.outstanding_balance > 0 ? '#d97706' : '#059669' }}>
                      GH₵ {parseFloat(s.outstanding_balance || 0).toFixed(2)}
                    </td>
                    <td>{s.products_supplied_count || 0} items</td>
                    <td>{s.total_orders || 0} orders</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showNewPoModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Create Purchase Order</h3>
              <button onClick={() => setShowNewPoModal(false)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <form onSubmit={handleCreatePo}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Supplier *</label>
                    <select
                      className="form-select"
                      required
                      value={newPo.supplier_id}
                      onChange={(e) => setNewPo({ ...newPo, supplier_id: Number(e.target.value) })}
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.company_name})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Destination Branch *</label>
                    <select
                      className="form-select"
                      required
                      value={newPo.branch_id}
                      onChange={(e) => setNewPo({ ...newPo, branch_id: Number(e.target.value) })}
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Expected Delivery Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newPo.expected_delivery_date}
                    onChange={(e) => setNewPo({ ...newPo, expected_delivery_date: e.target.value })}
                  />
                </div>

                {/* Items Row */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label className="form-label" style={{ marginBottom: '8px' }}>Order Item *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <select
                        className="form-select"
                        value={newPo.items[0].product_id}
                        onChange={(e) => {
                          const pId = Number(e.target.value);
                          const prod = products.find(p => p.id === pId);
                          setNewPo({
                            ...newPo,
                            items: [{ ...newPo.items[0], product_id: pId, cost_price: prod?.cost_price || 100 }]
                          });
                        }}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <input
                        type="number"
                        min="1"
                        placeholder="Quantity"
                        className="form-input"
                        value={newPo.items[0].quantity_ordered}
                        onChange={(e) => {
                          setNewPo({
                            ...newPo,
                            items: [{ ...newPo.items[0], quantity_ordered: parseInt(e.target.value, 10) }]
                          });
                        }}
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Unit Cost"
                        className="form-input"
                        value={newPo.items[0].cost_price}
                        onChange={(e) => {
                          setNewPo({
                            ...newPo,
                            items: [{ ...newPo.items[0], cost_price: parseFloat(e.target.value) }]
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label">Order Notes</label>
                  <textarea
                    rows="2"
                    className="form-textarea"
                    placeholder="e.g. Include batch certificates with delivery..."
                    value={newPo.notes}
                    onChange={(e) => setNewPo({ ...newPo, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewPoModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Add New Supplier</h3>
              <button onClick={() => setShowAddSupplierModal(false)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <form onSubmit={handleCreateSupplier}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">Supplier Brand / Trade Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. L’Oréal Official West Africa"
                    className="form-input"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. L’Oréal Ghana Distribution Ltd"
                    className="form-input"
                    value={newSupplier.company_name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, company_name: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="+233 24 000 0000"
                      className="form-input"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      placeholder="orders@supplier.com"
                      className="form-input"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Office Address</label>
                  <input
                    type="text"
                    placeholder="Street, Area, City"
                    className="form-input"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddSupplierModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>Purchase Order: {selectedOrder.po_number}</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Supplier: {selectedOrder.supplier_name} • Branch: {selectedOrder.branch_name}
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div className="modal-body">
              <table className="data-table" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Ordered Qty</th>
                    <th>Received Qty</th>
                    <th>Unit Cost</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <strong>{it.product_name}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{it.sku}</div>
                      </td>
                      <td>{it.quantity_ordered} pcs</td>
                      <td>
                        <strong style={{ color: it.quantity_received > 0 ? '#059669' : '#64748b' }}>
                          {it.quantity_received} pcs
                        </strong>
                      </td>
                      <td>GH₵ {parseFloat(it.cost_price).toFixed(2)}</td>
                      <td style={{ fontWeight: '700' }}>GH₵ {parseFloat(it.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '1rem', fontWeight: '800' }}>
                Total Order Amount: GH₵ {parseFloat(selectedOrder.total_cost).toFixed(2)}
              </div>
            </div>
            <div className="modal-footer">
              {selectedOrder.status !== 'received' && (
                <button className="btn btn-success" onClick={() => handleReceiveGoods(selectedOrder.id)}>
                  Receive All Goods
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
