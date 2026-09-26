import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Plus,
  CheckCircle,
  Truck,
  PackageCheck,
  XCircle,
  Clock,
  Eye,
  X,
  AlertCircle
} from 'lucide-react';

export default function TransfersView({ activeBranch, branches, currentUser }) {
  const [transfers, setTransfers] = useState([]);
  const [directionFilter, setDirectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);

  // Create Form State
  const [sourceBranchId, setSourceBranchId] = useState(activeBranch || (branches[0]?.id || 1));
  const [destBranchId, setDestBranchId] = useState(branches[1]?.id || 2);
  const [notes, setNotes] = useState('');
  const [transferItems, setTransferItems] = useState([
    { product_id: '', quantity: 10 }
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchTransfers();
  }, [activeBranch, directionFilter, statusFilter]);

  useEffect(() => {
    if (showCreateModal) {
      fetchSourceProducts();
    }
  }, [showCreateModal, sourceBranchId]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      let url = `/api/transfers?`;
      if (activeBranch) url += `branch_id=${activeBranch}&`;
      if (directionFilter) url += `direction=${directionFilter}&`;
      if (statusFilter) url += `status=${statusFilter}&`;

      const res = await fetch(url);
      const data = await res.json();
      setTransfers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSourceProducts = async () => {
    try {
      const res = await fetch(`/api/products?branch_id=${sourceBranchId}`);
      const data = await res.json();
      setAvailableProducts(data);
      if (data.length > 0 && !transferItems[0].product_id) {
        setTransferItems([{ product_id: data[0].id, quantity: 10 }]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewTransfer = async (id) => {
    try {
      const res = await fetch(`/api/transfers/${id}`);
      const data = await res.json();
      setSelectedTransfer(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Workflow Actions
  const handleApprove = async (id) => {
    try {
      const res = await fetch(`/api/transfers/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: currentUser?.id || 1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchTransfers();
      if (selectedTransfer) handleViewTransfer(id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDispatch = async (id) => {
    try {
      const res = await fetch(`/api/transfers/${id}/dispatch`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchTransfers();
      if (selectedTransfer) handleViewTransfer(id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReceive = async (id) => {
    try {
      const res = await fetch(`/api/transfers/${id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received_by: currentUser?.id || 1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchTransfers();
      if (selectedTransfer) handleViewTransfer(id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this transfer?')) return;
    try {
      const res = await fetch(`/api/transfers/${id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchTransfers();
      if (selectedTransfer) handleViewTransfer(id);
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit Create Transfer
  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (Number(sourceBranchId) === Number(destBranchId)) {
      setErrorMsg('Source and Destination branches cannot be the same.');
      return;
    }

    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_branch_id: sourceBranchId,
          destination_branch_id: destBranchId,
          requested_by: currentUser?.id || 1,
          notes,
          items: transferItems
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowCreateModal(false);
      fetchTransfers();
      setNotes('');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Inter-Branch Stock Transfers</h1>
          <p className="page-subtitle">
            Manage multi-step stock transfers between retail branches (Request → Central Approval → Dispatch In Transit → Received)
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          <span>New Transfer Request</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '18px' }}>
        <button
          className={`filter-tab ${directionFilter === '' ? 'active' : ''}`}
          onClick={() => setDirectionFilter('')}
        >
          All Transfers
        </button>
        <button
          className={`filter-tab ${directionFilter === 'incoming' ? 'active' : ''}`}
          onClick={() => setDirectionFilter('incoming')}
        >
          Incoming Transfers
        </button>
        <button
          className={`filter-tab ${directionFilter === 'outgoing' ? 'active' : ''}`}
          onClick={() => setDirectionFilter('outgoing')}
        >
          Outgoing Transfers
        </button>
      </div>

      {/* Transfers Table */}
      <div className="ui-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transfer #</th>
                <th>Source Branch</th>
                <th>Destination Branch</th>
                <th>Total Units</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Workflow Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Loading transfers...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No stock transfer records found.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.transfer_number}</strong>
                    </td>
                    <td>
                      <div>{t.source_branch_name}</div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{t.source_branch_code}</span>
                    </td>
                    <td>
                      <div>{t.destination_branch_name}</div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{t.destination_branch_code}</span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.92rem' }}>{t.total_units}</strong> units ({t.item_count} items)
                    </td>
                    <td>{t.requested_by_name}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(t.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td>
                      <span className={`badge ${
                        t.status === 'received' ? 'badge-success' :
                        t.status === 'in_transit' ? 'badge-purple' :
                        t.status === 'approved' ? 'badge-info' :
                        t.status === 'cancelled' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewTransfer(t.id)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {t.status === 'pending_approval' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApprove(t.id)}
                            title="Approve & Reserve Stock"
                          >
                            <CheckCircle size={14} />
                            <span>Approve</span>
                          </button>
                        )}
                        {t.status === 'approved' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDispatch(t.id)}
                            style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }}
                            title="Dispatch Stock (In Transit)"
                          >
                            <Truck size={14} />
                            <span>Dispatch</span>
                          </button>
                        )}
                        {t.status === 'in_transit' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleReceive(t.id)}
                            title="Receive Goods into Branch Stock"
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

      {/* New Transfer Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Create Stock Transfer Request</h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <form onSubmit={handleCreateTransfer}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {errorMsg && (
                  <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px', borderRadius: '6px', fontSize: '0.84rem' }}>
                    {errorMsg}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Source Branch (From) *</label>
                    <select
                      className="form-select"
                      required
                      value={sourceBranchId}
                      onChange={(e) => setSourceBranchId(Number(e.target.value))}
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Destination Branch (To) *</label>
                    <select
                      className="form-select"
                      required
                      value={destBranchId}
                      onChange={(e) => setDestBranchId(Number(e.target.value))}
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Product to Transfer *</label>
                  <select
                    className="form-select"
                    required
                    value={transferItems[0].product_id}
                    onChange={(e) => setTransferItems([{ ...transferItems[0], product_id: Number(e.target.value) }])}
                  >
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Available: {p.branch_available || 0} pcs)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Quantity to Transfer *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    value={transferItems[0].quantity}
                    onChange={(e) => setTransferItems([{ ...transferItems[0], quantity: parseInt(e.target.value, 10) }])}
                  />
                </div>

                <div>
                  <label className="form-label">Transfer Purpose / Notes</label>
                  <textarea
                    rows="3"
                    className="form-textarea"
                    placeholder="e.g. Urgent weekend stock replenishment for high-demand cosmetics"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Transfer Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Details Modal */}
      {selectedTransfer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>Transfer {selectedTransfer.transfer_number}</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {selectedTransfer.source_branch_name} → {selectedTransfer.destination_branch_name}
                </div>
              </div>
              <button onClick={() => setSelectedTransfer(null)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div className="modal-body">
              {/* Status Banner */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Status:</span>
                  <span className={`badge ${
                    selectedTransfer.status === 'received' ? 'badge-success' :
                    selectedTransfer.status === 'in_transit' ? 'badge-purple' :
                    selectedTransfer.status === 'approved' ? 'badge-info' : 'badge-warning'
                  }`} style={{ marginLeft: '8px' }}>
                    {selectedTransfer.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Requested: {new Date(selectedTransfer.created_at).toLocaleString('en-GB')}
                </div>
              </div>

              {/* Items List */}
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Transferred Products</h4>
              <table className="data-table" style={{ fontSize: '0.82rem', marginBottom: '16px' }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Requested Qty</th>
                    <th>Sent Qty</th>
                    <th>Received Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTransfer.items?.map((it) => (
                    <tr key={it.id}>
                      <td>
                        <strong>{it.product_name}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{it.sku}</div>
                      </td>
                      <td>{it.quantity_requested} pcs</td>
                      <td>{it.quantity_sent} pcs</td>
                      <td>
                        <strong style={{ color: it.quantity_received > 0 ? '#059669' : '#64748b' }}>
                          {it.quantity_received} pcs
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedTransfer.notes && (
                <div style={{ fontSize: '0.82rem', color: '#475569', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                  <strong>Notes:</strong> {selectedTransfer.notes}
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selectedTransfer.status === 'pending_approval' && (
                <button className="btn btn-primary" onClick={() => handleApprove(selectedTransfer.id)}>
                  Approve Transfer
                </button>
              )}
              {selectedTransfer.status === 'approved' && (
                <button className="btn btn-secondary" onClick={() => handleDispatch(selectedTransfer.id)}>
                  Dispatch In Transit
                </button>
              )}
              {selectedTransfer.status === 'in_transit' && (
                <button className="btn btn-success" onClick={() => handleReceive(selectedTransfer.id)}>
                  Receive Stock
                </button>
              )}
              {['pending_approval', 'approved'].includes(selectedTransfer.status) && (
                <button className="btn btn-danger" onClick={() => handleCancel(selectedTransfer.id)}>
                  Cancel Transfer
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedTransfer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
