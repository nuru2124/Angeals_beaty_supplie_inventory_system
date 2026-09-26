import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  CheckCircle,
  Eye,
  AlertTriangle,
  X,
  Boxes
} from 'lucide-react';

export default function StocktakeView({ activeBranch, branches, currentUser }) {
  const [stocktakes, setStocktakes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedStocktake, setSelectedStocktake] = useState(null);

  // Stocktake Form
  const [branchId, setBranchId] = useState(activeBranch || (branches[0]?.id || 1));
  const [notes, setNotes] = useState('');
  const [countItems, setCountItems] = useState([]);

  useEffect(() => {
    fetchStocktakes();
  }, [activeBranch]);

  useEffect(() => {
    if (showStartModal) {
      loadBranchProductsForCount();
    }
  }, [showStartModal, branchId]);

  const fetchStocktakes = async () => {
    try {
      setLoading(true);
      let url = `/api/stocktakes?`;
      if (activeBranch) url += `branch_id=${activeBranch}`;
      const res = await fetch(url);
      const data = await res.json();
      setStocktakes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBranchProductsForCount = async () => {
    try {
      const res = await fetch(`/api/inventory?branch_id=${branchId}`);
      const data = await res.json();
      setCountItems(data.map(p => ({
        product_id: p.product_id,
        name: p.product_name,
        sku: p.sku,
        system_quantity: p.quantity,
        physical_quantity: p.quantity,
        unit_cost: p.cost_price,
        variance: 0
      })));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhysicalQtyChange = (idx, val) => {
    const pQty = parseInt(val, 10) || 0;
    setCountItems(countItems.map((item, i) => {
      if (i === idx) {
        return {
          ...item,
          physical_quantity: pQty,
          variance: pQty - item.system_quantity
        };
      }
      return item;
    }));
  };

  const handleSubmitCount = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/stocktakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: branchId,
          counted_by: currentUser?.id || 1,
          notes,
          items: countItems.map(it => ({
            product_id: it.product_id,
            system_quantity: it.system_quantity,
            physical_quantity: it.physical_quantity,
            unit_cost: it.unit_cost
          }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Stocktake ${data.count_number} recorded! Total Variance: ${data.total_variance_units} units.`);
      setShowStartModal(false);
      fetchStocktakes();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReconcile = async (id) => {
    if (!confirm('Reconcile this stocktake? System inventory quantities will be synchronized to the physical count and movement logs will be created.')) return;

    try {
      const res = await fetch(`/api/stocktakes/${id}/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reconciled_by: currentUser?.id || 1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Stocktake reconciled successfully!');
      fetchStocktakes();
      if (selectedStocktake) handleViewStocktake(id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewStocktake = async (id) => {
    try {
      const res = await fetch(`/api/stocktakes/${id}`);
      const data = await res.json();
      setSelectedStocktake(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Physical Stocktake & Auditing</h1>
          <p className="page-subtitle">
            Perform periodic physical inventory counts, calculate system variances (Physical - System), and reconcile balances
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowStartModal(true)}>
          <Plus size={16} />
          <span>Start New Stocktake</span>
        </button>
      </div>

      {/* Stocktakes Table */}
      <div className="ui-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Stocktake #</th>
                <th>Branch</th>
                <th>Products Counted</th>
                <th>Total Variance Units</th>
                <th>Variance Value (GHS)</th>
                <th>Counted By</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Loading stocktake history...
                  </td>
                </tr>
              ) : stocktakes.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No stocktake events recorded yet.
                  </td>
                </tr>
              ) : (
                stocktakes.map((sc) => (
                  <tr key={sc.id}>
                    <td>
                      <strong>{sc.count_number}</strong>
                    </td>
                    <td>{sc.branch_name} ({sc.branch_code})</td>
                    <td>{sc.item_count} products</td>
                    <td>
                      <strong style={{ color: sc.total_variance_units > 0 ? '#d97706' : '#059669' }}>
                        {sc.total_variance_units > 0 ? `±${sc.total_variance_units}` : '0'} units
                      </strong>
                    </td>
                    <td>GH₵ {parseFloat(sc.total_variance_value || 0).toFixed(2)}</td>
                    <td>{sc.counted_by_name}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(sc.started_at).toLocaleDateString('en-GB')}
                    </td>
                    <td>
                      <span className={`badge ${sc.status === 'reconciled' ? 'badge-success' : 'badge-warning'}`}>
                        {sc.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewStocktake(sc.id)}
                          title="View Variance Breakdown"
                        >
                          <Eye size={14} />
                        </button>
                        {sc.status !== 'reconciled' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleReconcile(sc.id)}
                            title="Reconcile & Update System Stock"
                          >
                            <CheckCircle size={14} />
                            <span>Reconcile</span>
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

      {/* Start Stocktake Modal */}
      {showStartModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Perform Physical Stocktake</h3>
              <button onClick={() => setShowStartModal(false)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <form onSubmit={handleSubmitCount}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label className="form-label">Branch Store *</label>
                    <select
                      className="form-select"
                      value={branchId}
                      onChange={(e) => setBranchId(Number(e.target.value))}
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Stocktake Purpose / Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. End of Month Comprehensive Physical Stock Audit"
                      className="form-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Product Count Entry</h4>
                <div className="table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.84rem' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>System Qty</th>
                        <th>Physical Count</th>
                        <th>Variance (Phys - Sys)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countItems.map((item, idx) => (
                        <tr key={item.product_id}>
                          <td><strong>{item.name}</strong></td>
                          <td style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.sku}</td>
                          <td>{item.system_quantity}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              style={{ width: '80px', padding: '4px 6px' }}
                              value={item.physical_quantity}
                              onChange={(e) => handlePhysicalQtyChange(idx, e.target.value)}
                            />
                          </td>
                          <td>
                            <strong style={{
                              color: item.variance < 0 ? '#dc2626' : (item.variance > 0 ? '#059669' : '#64748b')
                            }}>
                              {item.variance > 0 ? `+${item.variance}` : item.variance}
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStartModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Stocktake Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stocktake Details Modal */}
      {selectedStocktake && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>Stocktake: {selectedStocktake.count_number}</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Branch: {selectedStocktake.branch_name} • Counted By: {selectedStocktake.counted_by_name}
                </div>
              </div>
              <button onClick={() => setSelectedStocktake(null)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div className="modal-body">
              <table className="data-table" style={{ fontSize: '0.82rem', marginBottom: '14px' }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>System Qty</th>
                    <th>Physical Count</th>
                    <th>Variance</th>
                    <th>Variance Value</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStocktake.items?.map((it) => (
                    <tr key={it.id}>
                      <td>{it.product_name}</td>
                      <td>{it.system_quantity}</td>
                      <td><strong>{it.physical_quantity}</strong></td>
                      <td>
                        <strong style={{ color: it.variance !== 0 ? '#dc2626' : '#059669' }}>
                          {it.variance > 0 ? `+${it.variance}` : it.variance}
                        </strong>
                      </td>
                      <td>GH₵ {parseFloat(it.variance_value || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              {selectedStocktake.status !== 'reconciled' && (
                <button className="btn btn-success" onClick={() => handleReconcile(selectedStocktake.id)}>
                  Reconcile Inventory
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedStocktake(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
