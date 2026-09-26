import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';

export default function AdjustmentsView({ activeBranch, branches, currentUser }) {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    branch_id: activeBranch || (branches[0]?.id || 1),
    product_id: '',
    type: 'decrease',
    quantity: 1,
    reason: 'damaged',
    notes: ''
  });

  useEffect(() => {
    fetchAdjustments();
    fetchProducts();
  }, [activeBranch]);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      let url = `/api/adjustments?`;
      if (activeBranch) url += `branch_id=${activeBranch}`;
      const res = await fetch(url);
      const data = await res.json();
      setAdjustments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
      if (data.length > 0 && !form.product_id) {
        setForm(prev => ({ ...prev, product_id: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAdjustment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          requested_by: currentUser?.id || 1
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Adjustment ${data.adjustment_number} submitted! Pending Manager/Admin approval.`);
      setShowModal(false);
      fetchAdjustments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Approve and apply this stock adjustment to inventory?')) return;
    try {
      const res = await fetch(`/api/adjustments/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: currentUser?.id || 1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Stock adjustment approved and inventory balance updated.');
      fetchAdjustments();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Adjustments</h1>
          <p className="page-subtitle">
            Controlled adjustment requests for damaged goods, expired products, thefts, or counting discrepancies requiring authorization
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          <span>Request Adjustment</span>
        </button>
      </div>

      {/* Adjustments Table */}
      <div className="ui-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Adjustment #</th>
                <th>Branch</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Requested By</th>
                <th>Approved By</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Loading adjustments...
                  </td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No stock adjustments recorded.
                  </td>
                </tr>
              ) : (
                adjustments.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.adjustment_number}</strong></td>
                    <td>{a.branch_name}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{a.product_name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{a.sku}</div>
                    </td>
                    <td>
                      <span className={`badge ${a.type === 'increase' ? 'badge-success' : 'badge-danger'}`}>
                        {a.type}
                      </span>
                    </td>
                    <td>
                      <strong>{a.type === 'decrease' ? `-${a.quantity}` : `+${a.quantity}`}</strong> pcs
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {a.reason.replace('_', ' ')}
                      </span>
                      {a.notes && <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{a.notes}</div>}
                    </td>
                    <td>{a.requested_by_name}</td>
                    <td>{a.approved_by_name || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(a.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td>
                      <span className={`badge ${a.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      {a.status === 'pending' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApprove(a.id)}
                          title="Authorize Adjustment"
                        >
                          <CheckCircle size={14} />
                          <span>Approve</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Adjustment Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Request Stock Adjustment</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <form onSubmit={handleCreateAdjustment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Branch Store *</label>
                  <select
                    className="form-select"
                    value={form.branch_id}
                    onChange={(e) => setForm({ ...form, branch_id: Number(e.target.value) })}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Product *</label>
                  <select
                    className="form-select"
                    value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: Number(e.target.value) })}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Adjustment Type *</label>
                    <select
                      className="form-select"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option value="decrease">Decrease Stock (-)</option>
                      <option value="increase">Increase Stock (+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="form-input"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value, 10) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Adjustment Reason *</label>
                  <select
                    className="form-select"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  >
                    <option value="damaged">Damaged Goods / Breakage</option>
                    <option value="expired">Expired Stock Disposal</option>
                    <option value="lost">Lost / Misplaced Stock</option>
                    <option value="theft">Suspected Shrinkage / Theft</option>
                    <option value="counting_error">Physical Counting Discrepancy</option>
                    <option value="system_error">System Calibration</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Incident Explanation / Notes</label>
                  <textarea
                    rows="3"
                    className="form-textarea"
                    placeholder="Describe incident in detail for audit compliance..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
