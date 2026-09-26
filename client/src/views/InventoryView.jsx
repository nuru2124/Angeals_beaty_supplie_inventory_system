import React, { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  ArrowRightLeft,
  Truck,
  History,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  Eye,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';

export default function InventoryView({ activeBranch, branches, setActiveView }) {
  const [activeTab, setActiveTab] = useState('stock'); // stock, reorder, comparison, redistribution, movements
  const [inventory, setInventory] = useState([]);
  const [reorderSuggestions, setReorderSuggestions] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [transferSuggestions, setTransferSuggestions] = useState([]);
  const [movements, setMovements] = useState([]);

  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'stock') fetchStock();
    else if (activeTab === 'reorder') fetchReorderSuggestions();
    else if (activeTab === 'comparison') fetchComparison();
    else if (activeTab === 'redistribution') fetchTransferSuggestions();
    else if (activeTab === 'movements') fetchMovements();
  }, [activeTab, activeBranch, lowStockOnly, search]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      let url = `/api/inventory?`;
      if (activeBranch) url += `branch_id=${activeBranch}&`;
      if (lowStockOnly) url += `low_stock_only=true&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url);
      const data = await res.json();
      setInventory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReorderSuggestions = async () => {
    try {
      setLoading(true);
      let url = `/api/inventory/reorder-suggestions?`;
      if (activeBranch) url += `branch_id=${activeBranch}`;
      const res = await fetch(url);
      const data = await res.json();
      setReorderSuggestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory/comparison');
      const data = await res.json();
      setComparisonData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransferSuggestions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory/transfer-suggestions');
      const data = await res.json();
      setTransferSuggestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      let url = `/api/inventory/movements?limit=100&`;
      if (activeBranch) url += `branch_id=${activeBranch}`;
      const res = await fetch(url);
      const data = await res.json();
      setMovements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Branch Inventory & Reorder</h1>
          <p className="page-subtitle">
            Centralized inventory matrix, stock safety thresholds, replenishment recommendations, and movement ledger
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setActiveView('transfers')}>
            <ArrowRightLeft size={16} />
            <span>Create Transfer</span>
          </button>
          <button className="btn btn-primary" onClick={() => setActiveView('purchases')}>
            <Truck size={16} />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="filter-tabs" style={{ marginBottom: '18px' }}>
        <button
          className={`filter-tab ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          Branch Stock Matrix
        </button>
        <button
          className={`filter-tab ${activeTab === 'reorder' ? 'active' : ''}`}
          onClick={() => setActiveTab('reorder')}
        >
          Smart Reorder Suggestions
        </button>
        <button
          className={`filter-tab ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          Branch Stock Comparison
        </button>
        <button
          className={`filter-tab ${activeTab === 'redistribution' ? 'active' : ''}`}
          onClick={() => setActiveTab('redistribution')}
        >
          Inter-Branch Redistribution
        </button>
        <button
          className={`filter-tab ${activeTab === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          Immutable Movement Ledger
        </button>
      </div>

      {/* Tab 1: Stock Matrix */}
      {activeTab === 'stock' && (
        <>
          <div className="ui-card" style={{ marginBottom: '16px' }}>
            <div className="ui-card-body" style={{ padding: '12px 18px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                <input
                  type="text"
                  placeholder="Search inventory by product name, SKU or barcode..."
                  className="form-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                />
                <span style={{ color: '#d97706' }}>Show Low Stock Items Only</span>
              </label>
            </div>
          </div>

          <div className="ui-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product & SKU</th>
                    <th>Branch Store</th>
                    <th>Total Units</th>
                    <th>Reserved</th>
                    <th>Available to Sell</th>
                    <th>Reorder Level</th>
                    <th>Inventory Value</th>
                    <th>Stock Health</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        Loading branch stock data...
                      </td>
                    </tr>
                  ) : inventory.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No inventory records match your criteria.
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: '700' }}>{item.product_name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>SKU: {item.sku}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: '600' }}>{item.branch_name}</span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>{item.branch_code}</span>
                        </td>
                        <td style={{ fontWeight: '700' }}>{item.quantity}</td>
                        <td style={{ color: item.reserved_quantity > 0 ? '#7c3aed' : '#94a3b8' }}>
                          {item.reserved_quantity}
                        </td>
                        <td>
                          <strong style={{ color: item.available_quantity <= item.reorder_level ? '#d97706' : '#059669', fontSize: '0.95rem' }}>
                            {item.available_quantity} {item.unit}
                          </strong>
                        </td>
                        <td>{item.reorder_level}</td>
                        <td style={{ fontWeight: '600' }}>GH₵ {parseFloat(item.inventory_value || 0).toFixed(2)}</td>
                        <td>
                          {item.available_quantity <= 0 ? (
                            <span className="badge badge-danger">Out of Stock</span>
                          ) : item.is_low_stock ? (
                            <span className="badge badge-warning">Low Stock (≤ {item.reorder_level})</span>
                          ) : (
                            <span className="badge badge-success">Optimal</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Smart Reorder Suggestions */}
      {activeTab === 'reorder' && (
        <div className="ui-card">
          <div className="ui-card-header">
            <div>
              <div className="ui-card-title">Intelligent Stock Replenishment Suggestions</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Calculated based on current stock, reorder levels, maximum capacity, and supplier minimums
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Branch</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Max Capacity</th>
                  <th>Suggested Order Qty</th>
                  <th>Estimated Cost</th>
                  <th>Supplier</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reorderSuggestions.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#059669' }}>
                      <CheckCircle2 size={24} style={{ margin: '0 auto 6px auto' }} />
                      <div>All branch inventory levels are currently above reorder thresholds!</div>
                    </td>
                  </tr>
                ) : (
                  reorderSuggestions.map((s, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: '700' }}>{s.product_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{s.sku}</div>
                      </td>
                      <td>{s.branch_name} ({s.branch_code})</td>
                      <td style={{ color: '#d97706', fontWeight: '700' }}>{s.current_stock}</td>
                      <td>{s.reorder_level}</td>
                      <td>{s.max_stock}</td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: '0.85rem' }}>
                          +{s.suggested_order_qty} units
                        </span>
                      </td>
                      <td style={{ fontWeight: '700' }}>
                        GH₵ {parseFloat(s.estimated_cost).toFixed(2)}
                      </td>
                      <td>{s.supplier_name || 'Primary Supplier'}</td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setActiveView('purchases')}
                        >
                          <Truck size={14} />
                          <span>Order</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Branch Stock Comparison Matrix */}
      {activeTab === 'comparison' && comparisonData && (
        <div className="ui-card">
          <div className="ui-card-header">
            <div>
              <div className="ui-card-title">Cross-Branch Inventory Matrix</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Side-by-side stock comparison across all retail branches
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Category</th>
                  {comparisonData.branches?.map(b => (
                    <th key={b.id} style={{ textAlign: 'center' }}>
                      {b.name} <br />
                      <span style={{ fontSize: '0.68rem', color: '#c97a63' }}>{b.code}</span>
                    </th>
                  ))}
                  <th style={{ textAlign: 'center' }}>Company Total</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.matrix?.map(row => (
                  <tr key={row.product_id}>
                    <td>
                      <div style={{ fontWeight: '700' }}>{row.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{row.sku}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{row.category}</span>
                    </td>
                    {comparisonData.branches?.map(b => {
                      const qty = row.branches[b.code] || 0;
                      return (
                        <td key={b.id} style={{ textAlign: 'center' }}>
                          <span style={{
                            fontWeight: '700',
                            color: qty <= 5 ? '#d97706' : '#0f172a',
                            background: qty <= 5 ? '#fef3c7' : 'transparent',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>
                            {qty}
                          </span>
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', fontWeight: '800', color: '#c97a63' }}>
                      {row.total_stock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Inter-Branch Stock Redistribution Suggestions */}
      {activeTab === 'redistribution' && (
        <div className="ui-card">
          <div className="ui-card-header">
            <div>
              <div className="ui-card-title">Automated Inter-Branch Rebalancing Suggestions</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Identifies surplus stock in one branch that can replenish a deficit branch without new supplier purchasing
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product & SKU</th>
                  <th>Source Branch (Surplus)</th>
                  <th>Surplus Stock</th>
                  <th>Destination Branch (Deficit)</th>
                  <th>Deficit Stock</th>
                  <th>Suggested Transfer Units</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transferSuggestions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No major stock imbalances detected between retail branches.
                    </td>
                  </tr>
                ) : (
                  transferSuggestions.map((ts, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: '700' }}>{ts.product_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{ts.sku}</div>
                      </td>
                      <td style={{ fontWeight: '600', color: '#059669' }}>
                        {ts.source_branch_name} ({ts.source_branch_code})
                      </td>
                      <td>
                        <strong>{ts.source_stock}</strong> units
                      </td>
                      <td style={{ fontWeight: '600', color: '#d97706' }}>
                        {ts.dest_branch_name} ({ts.dest_branch_code})
                      </td>
                      <td>
                        <strong>{ts.dest_stock}</strong> units (Reorder: {ts.reorder_level})
                      </td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: '0.85rem' }}>
                          Move {ts.suggested_transfer_quantity} units
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setActiveView('transfers')}
                        >
                          <ArrowRightLeft size={14} />
                          <span>Initiate Transfer</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Movement Ledger */}
      {activeTab === 'movements' && (
        <div className="ui-card">
          <div className="ui-card-header">
            <div>
              <div className="ui-card-title">Immutable Stock Movements Audit Ledger</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Every single inventory quantity delta with timestamps, previous/new quantities, and user attribution
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Branch</th>
                  <th>Type</th>
                  <th>Delta Qty</th>
                  <th>Balance (Prev → New)</th>
                  <th>User / Cashier</th>
                  <th>Reason / Reference</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(m.created_at).toLocaleString('en-GB')}
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{m.product_name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{m.sku}</div>
                    </td>
                    <td>{m.branch_name}</td>
                    <td>
                      <span className={`badge ${
                        m.movement_type === 'sale' ? 'badge-danger' :
                        m.movement_type === 'purchase' ? 'badge-success' :
                        m.movement_type === 'transfer_in' ? 'badge-info' :
                        m.movement_type === 'transfer_out' ? 'badge-purple' : 'badge-neutral'
                      }`}>
                        {m.movement_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: m.quantity > 0 ? '#059669' : '#dc2626' }}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {m.previous_quantity} → <strong>{m.new_quantity}</strong>
                    </td>
                    <td>{m.user_name || 'System'}</td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {m.reason} {m.reference_id && `(${m.reference_id})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
