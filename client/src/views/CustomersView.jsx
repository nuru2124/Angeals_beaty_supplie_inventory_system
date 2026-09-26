import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Award,
  ShoppingBag,
  Eye,
  X
} from 'lucide-react';

export default function CustomersView() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    customer_type: 'regular'
  });

  useEffect(() => {
    fetchCustomers();
  }, [typeFilter, search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let url = `/api/customers?`;
      if (typeFilter) url += `type=${typeFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowAddModal(false);
      fetchCustomers();
      setForm({ name: '', phone: '', email: '', address: '', customer_type: 'regular' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewCustomer = async (id) => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      const data = await res.json();
      setSelectedCustomer(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Register</h1>
          <p className="page-subtitle">
            Manage salon, beauty parlor, and retail clients, wholesale buyers, and customer lifetime purchase metrics
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>Register New Customer</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="ui-card" style={{ marginBottom: '16px' }}>
        <div className="ui-card-body" style={{ padding: '12px 18px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
            <input
              type="text"
              placeholder="Search by customer name, phone number or email..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['', 'walk_in', 'regular', 'vip', 'wholesale'].map(t => (
              <button
                key={t}
                className={`filter-tab ${typeFilter === t ? 'active' : ''}`}
                onClick={() => setTypeFilter(t)}
                style={{ textTransform: 'capitalize' }}
              >
                {t ? t.replace('_', ' ') : 'All Customers'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="ui-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Customer Tier</th>
                <th>Total Purchases (GHS)</th>
                <th>Total Orders</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: '700' }}>{c.name}</div>
                    {c.address && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.address}</div>}
                  </td>
                  <td>{c.phone}</td>
                  <td>{c.email || '—'}</td>
                  <td>
                    <span className={`badge ${
                      c.customer_type === 'vip' ? 'badge-purple' :
                      c.customer_type === 'wholesale' ? 'badge-info' :
                      c.customer_type === 'regular' ? 'badge-success' : 'badge-neutral'
                    }`} style={{ textTransform: 'uppercase' }}>
                      {c.customer_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700', color: '#0f172a' }}>
                    GH₵ {parseFloat(c.total_purchases || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td>{c.total_orders || 0} orders</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleViewCustomer(c.id)}
                    >
                      <Eye size={14} />
                      <span>History</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Register Customer</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">Customer / Salon Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Afia Pokuaa"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+233 24 000 0000"
                    className="form-input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    placeholder="customer@gmail.com"
                    className="form-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Customer Tier *</label>
                  <select
                    className="form-select"
                    value={form.customer_type}
                    onChange={(e) => setForm({ ...form, customer_type: e.target.value })}
                  >
                    <option value="walk_in">Walk-in</option>
                    <option value="regular">Regular Customer</option>
                    <option value="vip">VIP Client</option>
                    <option value="wholesale">Wholesale / Salon Studio</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Location / Address</label>
                  <input
                    type="text"
                    placeholder="Accra, Kumasi, etc."
                    className="form-input"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>{selectedCustomer.name}</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Tier: {selectedCustomer.customer_type.toUpperCase()} • Tel: {selectedCustomer.phone}
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div className="modal-body">
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Purchase History</h4>
              <table className="data-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Branch</th>
                    <th>Payment Method</th>
                    <th>Total (GHS)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCustomer.salesHistory?.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>
                        No past orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    selectedCustomer.salesHistory?.map((sl) => (
                      <tr key={sl.id}>
                        <td><strong>{sl.invoice_number}</strong></td>
                        <td>{new Date(sl.created_at).toLocaleString('en-GB')}</td>
                        <td>{sl.branch_name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{sl.payment_method.replace('_', ' ')}</td>
                        <td style={{ fontWeight: '700' }}>GH₵ {parseFloat(sl.total_amount).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
