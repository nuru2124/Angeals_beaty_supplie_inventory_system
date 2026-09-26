import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Phone,
  Mail,
  MapPin,
  Clock,
  Boxes,
  TrendingUp,
  Users,
  Eye,
  X
} from 'lucide-react';

export default function BranchesView() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    manager_name: '',
    operating_hours: '8:00 AM - 8:30 PM'
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/branches');
      const data = await res.json();
      setBranches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBranch = async (id) => {
    try {
      const res = await fetch(`/api/branches/${id}`);
      const data = await res.json();
      setSelectedBranch(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowAddModal(false);
      fetchBranches();
      setForm({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        manager_name: '',
        operating_hours: '8:00 AM - 8:30 PM'
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
          <h1 className="page-title">Retail Branches & Locations</h1>
          <p className="page-subtitle">
            Manage physical retail stores across Ghana, managers, branch operating hours, and inventory allocations
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>Add New Branch Store</span>
        </button>
      </div>

      {/* Branch Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {branches.map((b) => (
          <div key={b.id} className="ui-card" style={{ marginBottom: 0 }}>
            <div className="ui-card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="#c97a63" />
                  <span style={{ fontWeight: '700', fontSize: '1.05rem' }}>{b.name}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  Branch Code: <strong>{b.code}</strong>
                </div>
              </div>
              <span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                {b.status}
              </span>
            </div>
            <div className="ui-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: '#475569', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={15} color="#94a3b8" />
                  <span>{b.address}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={15} color="#94a3b8" />
                  <span>{b.phone}</span>
                </div>
                {b.manager_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={15} color="#94a3b8" />
                    <span>Manager: <strong>{b.manager_name}</strong></span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={15} color="#94a3b8" />
                  <span>{b.operating_hours || '8:00 AM - 8:00 PM'}</span>
                </div>
              </div>

              {/* Branch Telemetry Mini Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Inventory Valuation</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                    GH₵ {parseFloat(b.inventory_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#059669' }}>{b.total_stock || 0} units in stock</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Sales Revenue</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#c97a63' }}>
                    GH₵ {parseFloat(b.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{b.total_sales_count || 0} orders</div>
                </div>
              </div>

              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => handleViewBranch(b.id)}>
                <Eye size={14} />
                <span>View Full Branch Analytics</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Add New Retail Branch Store</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <form onSubmit={handleCreateBranch}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cape Coast Heritage Store"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CPC-005"
                    className="form-input"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div>
                  <label className="form-label">Manager Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Abena Ofori"
                    className="form-input"
                    value={form.manager_name}
                    onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Physical Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Street, Commercial Center, City"
                    className="form-input"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Phone *</label>
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
                    placeholder="branch@angalesbeauty.com"
                    className="form-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Operating Hours</label>
                  <input
                    type="text"
                    placeholder="8:00 AM - 8:30 PM"
                    className="form-input"
                    value={form.operating_hours}
                    onChange={(e) => setForm({ ...form, operating_hours: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Branch Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Detail Modal */}
      {selectedBranch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>{selectedBranch.name} ({selectedBranch.code})</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedBranch.address} • Tel: {selectedBranch.phone}</div>
              </div>
              <button onClick={() => setSelectedBranch(null)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div className="modal-body">
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Stock Valuation</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700' }}>
                    GH₵ {parseFloat(selectedBranch.stats?.inventory_value || 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Today's Sales</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#059669' }}>
                    GH₵ {parseFloat(selectedBranch.stats?.today_sales || 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>This Month Sales</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#c97a63' }}>
                    GH₵ {parseFloat(selectedBranch.stats?.month_sales || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Staff Roster */}
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Assigned Store Staff</h4>
              <div className="table-responsive" style={{ marginBottom: '18px' }}>
                <table className="data-table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Phone</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBranch.staff?.map((st) => (
                      <tr key={st.id}>
                        <td style={{ fontWeight: '600' }}>{st.name}</td>
                        <td><span className="badge badge-purple">{st.role_name}</span></td>
                        <td>{st.phone}</td>
                        <td>{st.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recent Sales */}
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Recent Sales at Branch</h4>
              <div className="table-responsive">
                <table className="data-table" style={{ fontSize: '0.82rem' }}>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Cashier</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBranch.recentSales?.map((sl) => (
                      <tr key={sl.id}>
                        <td><strong>{sl.invoice_number}</strong></td>
                        <td>{new Date(sl.created_at).toLocaleString('en-GB')}</td>
                        <td>{sl.customer_name || 'Walk-in'}</td>
                        <td>{sl.cashier_name}</td>
                        <td style={{ fontWeight: '700' }}>GH₵ {parseFloat(sl.total_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedBranch(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
