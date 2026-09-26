import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Package,
  Layers,
  ShieldAlert
} from 'lucide-react';

export default function BatchExpiryView({ activeBranch, branches }) {
  const [batches, setBatches] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, [activeBranch, statusFilter]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      let url = `/api/inventory/batches?`;
      if (activeBranch) url += `branch_id=${activeBranch}&`;
      if (statusFilter) url += `status=${statusFilter}&`;

      const res = await fetch(url);
      const data = await res.json();
      setBatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = batches.filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.product_name.toLowerCase().includes(q) || b.batch_number.toLowerCase().includes(q) || b.sku.toLowerCase().includes(q);
  });

  // Calculate summary counts
  const expiredCount = batches.filter(b => b.expiry_category === 'expired').length;
  const criticalCount = batches.filter(b => b.expiry_category === 'critical').length;
  const soonCount = batches.filter(b => b.expiry_category === 'expiring_soon').length;
  const safeCount = batches.filter(b => b.expiry_category === 'safe').length;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">FEFO Batch & Expiry Tracking</h1>
          <p className="page-subtitle">
            First-Expiry-First-Out (FEFO) batch management with automated safe, expiring-soon, critical, and expired classification
          </p>
        </div>
      </div>

      {/* Expiry Category Metrics Cards */}
      <div className="kpi-grid" style={{ marginBottom: '22px' }}>
        <div
          className="kpi-card"
          style={{ borderLeft: '4px solid #ef4444', cursor: 'pointer' }}
          onClick={() => setStatusFilter(statusFilter === 'expired' ? '' : 'expired')}
        >
          <div>
            <div className="kpi-label">Expired Batches</div>
            <div className="kpi-value" style={{ color: '#991b1b' }}>{expiredCount}</div>
            <div className="kpi-subtext">Requires immediate write-off / return</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#fef2f2', color: '#991b1b' }}>
            <XCircle size={22} />
          </div>
        </div>

        <div
          className="kpi-card"
          style={{ borderLeft: '4px solid #f97316', cursor: 'pointer' }}
          onClick={() => setStatusFilter(statusFilter === 'critical' ? '' : 'critical')}
        >
          <div>
            <div className="kpi-label">Critical (&lt; 30 Days)</div>
            <div className="kpi-value" style={{ color: '#ea580c' }}>{criticalCount}</div>
            <div className="kpi-subtext">Urgent promotional clearance</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <AlertTriangle size={22} />
          </div>
        </div>

        <div
          className="kpi-card"
          style={{ borderLeft: '4px solid #f59e0b', cursor: 'pointer' }}
          onClick={() => setStatusFilter(statusFilter === 'expiring_soon' ? '' : 'expiring_soon')}
        >
          <div>
            <div className="kpi-label">Expiring Soon (30–90 Days)</div>
            <div className="kpi-value" style={{ color: '#d97706' }}>{soonCount}</div>
            <div className="kpi-subtext">Prioritized for sales checkout</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={22} />
          </div>
        </div>

        <div
          className="kpi-card"
          style={{ borderLeft: '4px solid #10b981', cursor: 'pointer' }}
          onClick={() => setStatusFilter(statusFilter === 'safe' ? '' : 'safe')}
        >
          <div>
            <div className="kpi-label">Safe Shelf Life (&gt; 90 Days)</div>
            <div className="kpi-value" style={{ color: '#059669' }}>{safeCount}</div>
            <div className="kpi-subtext">Standard healthy stock</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="ui-card" style={{ marginBottom: '18px' }}>
        <div className="ui-card-body" style={{ padding: '14px 18px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
            <input
              type="text"
              placeholder="Search by product, batch number, or SKU..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['', 'expired', 'critical', 'expiring_soon', 'safe'].map((statusKey) => (
              <button
                key={statusKey}
                className={`filter-tab ${statusFilter === statusKey ? 'active' : ''}`}
                onClick={() => setStatusFilter(statusKey)}
                style={{ textTransform: 'capitalize' }}
              >
                {statusKey ? statusKey.replace('_', ' ') : 'All Batches'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className="ui-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Number</th>
                <th>Product & SKU</th>
                <th>Branch Location</th>
                <th>Units Remaining</th>
                <th>Unit Cost</th>
                <th>Manufacturing Date</th>
                <th>Expiry Date</th>
                <th>Days Remaining</th>
                <th>FEFO Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Loading active batches...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No batches match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.batch_number}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{b.product_name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{b.sku}</div>
                    </td>
                    <td>
                      <div>{b.branch_name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{b.branch_code}</div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.95rem' }}>{b.quantity}</strong> pcs
                    </td>
                    <td>GH₵ {parseFloat(b.cost_price).toFixed(2)}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {b.manufacturing_date || '—'}
                    </td>
                    <td>
                      <strong style={{ color: b.expiry_category === 'expired' ? '#991b1b' : '#0f172a' }}>
                        {b.expiry_date}
                      </strong>
                    </td>
                    <td>
                      {b.days_to_expiry < 0 ? (
                        <span style={{ color: '#991b1b', fontWeight: '700' }}>
                          Expired {Math.abs(b.days_to_expiry)}d ago
                        </span>
                      ) : (
                        <span style={{
                          fontWeight: '700',
                          color: b.days_to_expiry <= 30 ? '#dc2626' : (b.days_to_expiry <= 90 ? '#d97706' : '#059669')
                        }}>
                          {b.days_to_expiry} days
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${b.expiry_category}`}>
                        {b.expiry_category.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
