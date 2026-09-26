import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

export default function ReportsView({ activeBranch, branches }) {
  const [tab, setTab] = useState('pnl'); // pnl, slow_moving, dead_stock
  const [pnlData, setPnlData] = useState(null);
  const [slowMoving, setSlowMoving] = useState([]);
  const [deadStock, setDeadStock] = useState([]);
  const [slowDays, setSlowDays] = useState(60);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab === 'pnl') fetchPnl();
    else if (tab === 'slow_moving') fetchSlowMoving();
    else if (tab === 'dead_stock') fetchDeadStock();
  }, [tab, activeBranch, slowDays]);

  const fetchPnl = async () => {
    try {
      setLoading(true);
      let url = `/api/reports/profit-and-loss?`;
      if (activeBranch) url += `branch_id=${activeBranch}`;
      const res = await fetch(url);
      const data = await res.json();
      setPnlData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlowMoving = async () => {
    try {
      setLoading(true);
      let url = `/api/reports/slow-moving?days=${slowDays}&`;
      if (activeBranch) url += `branch_id=${activeBranch}`;
      const res = await fetch(url);
      const data = await res.json();
      setSlowMoving(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeadStock = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports/dead-stock');
      const data = await res.json();
      setDeadStock(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = (type) => {
    let url = `/api/reports/export?type=${type}`;
    if (activeBranch) url += `&branch_id=${activeBranch}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial & Inventory Reports</h1>
          <p className="page-subtitle">
            Executive financial reporting, profit & loss analysis, slow-moving inventory capital analysis, and CSV exports
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => handleExportCsv('inventory')}>
            <FileSpreadsheet size={16} />
            <span>Export Inventory CSV</span>
          </button>
          <button className="btn btn-primary" onClick={() => handleExportCsv('sales')}>
            <Download size={16} />
            <span>Export Sales CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '18px' }}>
        <button
          className={`filter-tab ${tab === 'pnl' ? 'active' : ''}`}
          onClick={() => setTab('pnl')}
        >
          Profit & Loss Statement (P&L)
        </button>
        <button
          className={`filter-tab ${tab === 'slow_moving' ? 'active' : ''}`}
          onClick={() => setTab('slow_moving')}
        >
          Slow-Moving Stock Analysis
        </button>
        <button
          className={`filter-tab ${tab === 'dead_stock' ? 'active' : ''}`}
          onClick={() => setTab('dead_stock')}
        >
          Dead Stock Capital Analysis
        </button>
      </div>

      {/* Tab 1: P&L Statement */}
      {tab === 'pnl' && pnlData && (
        <div>
          {/* P&L Cards */}
          <div className="kpi-grid" style={{ marginBottom: '24px' }}>
            <div className="kpi-card">
              <div>
                <div className="kpi-label">Gross Sales Revenue</div>
                <div className="kpi-value" style={{ color: '#0f172a' }}>
                  GH₵ {parseFloat(pnlData.grossRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="kpi-subtext">Total retail & POS billings</div>
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <div className="kpi-label">Cost of Goods Sold (COGS)</div>
                <div className="kpi-value" style={{ color: '#64748b' }}>
                  GH₵ {parseFloat(pnlData.cogs || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="kpi-subtext">Inventory acquisition expense</div>
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <div className="kpi-label">Gross Profit</div>
                <div className="kpi-value" style={{ color: '#059669' }}>
                  GH₵ {parseFloat(pnlData.grossProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="kpi-subtext">Margin: {pnlData.profitMarginPercent}%</div>
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <div className="kpi-label">Estimated Net Profit</div>
                <div className="kpi-value" style={{ color: pnlData.estimatedNetProfit >= 0 ? '#059669' : '#dc2626' }}>
                  GH₵ {parseFloat(pnlData.estimatedNetProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="kpi-subtext">Gross Profit - Operational Expenses</div>
              </div>
            </div>
          </div>

          {/* Detailed Statement Table */}
          <div className="ui-card">
            <div className="ui-card-header">
              <div className="ui-card-title">Executive Financial Summary</div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <tbody>
                  <tr>
                    <td style={{ fontWeight: '700', fontSize: '1rem' }}>Total Sales Turnover (Revenue)</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>
                      GH₵ {parseFloat(pnlData.grossRevenue).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b', paddingLeft: '24px' }}>Less: Cost of Goods Sold (COGS)</td>
                    <td style={{ textAlign: 'right', color: '#64748b' }}>
                      - GH₵ {parseFloat(pnlData.cogs).toFixed(2)}
                    </td>
                  </tr>
                  <tr style={{ background: '#f8fafc' }}>
                    <td style={{ fontWeight: '700' }}>= Gross Profit (Margin: {pnlData.profitMarginPercent}%)</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: '#059669' }}>
                      GH₵ {parseFloat(pnlData.grossProfit).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748b', paddingLeft: '24px' }}>Less: Operational Expenses (Rent, Utilities, Staff)</td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>
                      - GH₵ {parseFloat(pnlData.totalExpenses).toFixed(2)}
                    </td>
                  </tr>
                  <tr style={{ background: '#f0fdf4', borderTop: '2px solid #a7f3d0' }}>
                    <td style={{ fontWeight: '800', fontSize: '1.05rem', color: '#065f46' }}>
                      = Estimated Net Operating Profit
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '900', fontSize: '1.1rem', color: pnlData.estimatedNetProfit >= 0 ? '#059669' : '#dc2626' }}>
                      GH₵ {parseFloat(pnlData.estimatedNetProfit).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Slow Moving Stock */}
      {tab === 'slow_moving' && (
        <div className="ui-card">
          <div className="ui-card-header">
            <div>
              <div className="ui-card-title">Slow-Moving Beauty Products</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Items with zero sales transactions within the selected dormancy timeframe
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {[30, 60, 90].map(d => (
                <button
                  key={d}
                  className={`filter-tab ${slowDays === d ? 'active' : ''}`}
                  onClick={() => setSlowDays(d)}
                >
                  &gt; {d} Days Without Sales
                </button>
              ))}
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name & SKU</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Locked-In Capital (GHS)</th>
                  <th>Days Since Last Sale</th>
                  <th>Last Sale Date</th>
                </tr>
              </thead>
              <tbody>
                {slowMoving.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#059669' }}>
                      No products dormant for over {slowDays} days. Healthy inventory turnover!
                    </td>
                  </tr>
                ) : (
                  slowMoving.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.sku}</div>
                      </td>
                      <td><span className="badge badge-neutral">{p.category_name}</span></td>
                      <td><strong>{p.current_stock}</strong> pcs</td>
                      <td style={{ fontWeight: '700', color: '#dc2626' }}>
                        GH₵ {parseFloat(p.locked_capital).toFixed(2)}
                      </td>
                      <td>
                        <span className="badge badge-warning">
                          {p.days_since_last_sale} days dormant
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {p.last_sale_date ? new Date(p.last_sale_date).toLocaleDateString('en-GB') : 'Never Sold'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Dead Stock */}
      {tab === 'dead_stock' && (
        <div className="ui-card">
          <div className="ui-card-header">
            <div>
              <div className="ui-card-title">Dead Stock Analysis (&gt; 90 Days Zero Sales + High Quantity)</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Inventory tying up business capital with no customer turnover
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name & SKU</th>
                  <th>Category</th>
                  <th>Total Dormant Units</th>
                  <th>Cost Price</th>
                  <th>Locked Inventory Capital</th>
                  <th>Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {deadStock.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#059669' }}>
                      No critical dead stock detected across company inventory.
                    </td>
                  </tr>
                ) : (
                  deadStock.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.sku}</div>
                      </td>
                      <td><span className="badge badge-neutral">{p.category_name}</span></td>
                      <td><strong style={{ color: '#dc2626' }}>{p.total_stock}</strong> units</td>
                      <td>GH₵ {parseFloat(p.cost_price).toFixed(2)}</td>
                      <td style={{ fontWeight: '800', color: '#991b1b' }}>
                        GH₵ {parseFloat(p.inventory_value).toFixed(2)}
                      </td>
                      <td>
                        <span className="badge badge-purple">
                          Clearance / Bundle Discount (30%)
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
