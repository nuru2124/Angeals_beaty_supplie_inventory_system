import React, { useState, useEffect } from 'react';
import {
  Package,
  Boxes,
  BadgeDollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  Truck,
  Plus,
  ArrowUpRight,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export default function DashboardView({ activeBranch, setActiveView, onQuickAction }) {
  const [data, setData] = useState(null);
  const [salesOverview, setSalesOverview] = useState([]);
  const [salesByBranch, setSalesByBranch] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [activeBranch, period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const bParam = activeBranch ? `?branch_id=${activeBranch}` : '';
      const bJoin = activeBranch ? `&branch_id=${activeBranch}` : '';

      const [dashRes, salesRes, branchRes, topRes] = await Promise.all([
        fetch(`/api/reports/dashboard${bParam}`),
        fetch(`/api/reports/sales-overview?period=${period}${bJoin}`),
        fetch(`/api/reports/sales-by-branch`),
        fetch(`/api/reports/top-products${bParam}`)
      ]);

      const [dashData, salesData, branchData, topData] = await Promise.all([
        dashRes.json(),
        salesRes.json(),
        branchRes.json(),
        topRes.json()
      ]);

      setData(dashData);
      setSalesOverview(salesData);
      setSalesByBranch(branchData);
      setTopProducts(topData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        <Sparkles size={32} color="#c97a63" style={{ animation: 'spin 1.5s linear infinite' }} />
        <p style={{ marginTop: '12px', fontWeight: '500' }}>Loading beauty intelligence dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">
            {activeBranch
              ? 'Real-time branch inventory, POS sales, and performance telemetry'
              : 'Headquarters company-wide overview across all retail branches and stores'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => setActiveView('pos')}>
            <ShoppingBag size={16} />
            <span>Open POS Checkout</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveView('inventory')}>
            <Boxes size={16} />
            <span>Stock Overview</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Unique Products</div>
            <div className="kpi-value">{data?.totalProducts || 0}</div>
            <div className="kpi-subtext">Catalogued Beauty SKUs</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#fdf2f8', color: '#db2777' }}>
            <Package size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Stock Units</div>
            <div className="kpi-value">{data?.totalStock?.toLocaleString() || 0}</div>
            <div className="kpi-subtext">Active on shelves/warehouse</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Boxes size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Inventory Valuation</div>
            <div className="kpi-value">GH₵ {parseFloat(data?.totalInventoryValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="kpi-subtext">Cost asset valuation</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#fefce8', color: '#ca8a04' }}>
            <BadgeDollarSign size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Today's Sales Revenue</div>
            <div className="kpi-value" style={{ color: '#059669' }}>
              GH₵ {parseFloat(data?.todaySales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-subtext">{data?.todayOrdersCount || 0} transactions completed today</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* KPI Cards Row 2 - Operational Alerts */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b', cursor: 'pointer' }} onClick={() => setActiveView('inventory')}>
          <div>
            <div className="kpi-label">Low Stock Alerts</div>
            <div className="kpi-value" style={{ color: '#d97706' }}>{data?.lowStockCount || 0}</div>
            <div className="kpi-subtext">At or below reorder threshold</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#fffbeb', color: '#d97706' }}>
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444', cursor: 'pointer' }} onClick={() => setActiveView('batches')}>
          <div>
            <div className="kpi-label">Expiring / Expired Batches</div>
            <div className="kpi-value" style={{ color: '#dc2626' }}>
              {data?.expiringCount || 0}
              {data?.expiredCount > 0 && <span style={{ fontSize: '0.85rem', color: '#991b1b', marginLeft: '6px' }}>({data.expiredCount} expired)</span>}
            </div>
            <div className="kpi-subtext">FEFO batch monitoring</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #8b5cf6', cursor: 'pointer' }} onClick={() => setActiveView('transfers')}>
          <div>
            <div className="kpi-label">Pending Transfers</div>
            <div className="kpi-value" style={{ color: '#7c3aed' }}>{data?.pendingTransfers || 0}</div>
            <div className="kpi-subtext">Awaiting approval / in transit</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <ArrowRightLeft size={22} />
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #3b82f6', cursor: 'pointer' }} onClick={() => setActiveView('purchases')}>
          <div>
            <div className="kpi-label">Pending Purchase Orders</div>
            <div className="kpi-value" style={{ color: '#2563eb' }}>{data?.pendingPurchaseOrders || 0}</div>
            <div className="kpi-subtext">Suppliers restocking</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Truck size={22} />
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Sales Trend Chart */}
        <div className="ui-card">
          <div className="ui-card-header">
            <div>
              <div className="ui-card-title">Sales Revenue Overview</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Revenue performance over time</div>
            </div>
            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
              <button
                className={`filter-tab ${period === 'daily' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => setPeriod('daily')}
              >
                Daily
              </button>
              <button
                className={`filter-tab ${period === 'monthly' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => setPeriod('monthly')}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="ui-card-body">
            {salesOverview.length === 0 ? (
              <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                No sales records in selected period
              </div>
            ) : (
              <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingBottom: '20px' }}>
                {salesOverview.map((item, idx) => {
                  const maxRev = Math.max(...salesOverview.map(s => s.revenue), 100);
                  const heightPercent = Math.max(12, Math.round((item.revenue / maxRev) * 180));
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#c97a63', marginBottom: '6px' }}>
                        GH₵{Math.round(item.revenue)}
                      </div>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '38px',
                          height: `${heightPercent}px`,
                          background: 'linear-gradient(180deg, #c97a63 0%, #e69c87 100%)',
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.3s ease'
                        }}
                        title={`Revenue: GH₵ ${item.revenue} (${item.order_count} sales)`}
                      ></div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '8px', whiteSpace: 'nowrap' }}>
                        {item.period_label.slice(-5)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sales By Branch Breakdown */}
        <div className="ui-card">
          <div className="ui-card-header">
            <div>
              <div className="ui-card-title">Sales Revenue by Branch</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Cross-branch retail performance comparison</div>
            </div>
          </div>
          <div className="ui-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {salesByBranch.map((b) => {
                const maxBranchRev = Math.max(...salesByBranch.map(x => x.revenue), 100);
                const percent = Math.round((b.revenue / maxBranchRev) * 100);
                return (
                  <div key={b.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.88rem' }}>{b.name} ({b.code})</span>
                      <span style={{ fontWeight: '700', color: '#0f172a' }}>
                        GH₵ {parseFloat(b.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
                          borderRadius: '4px'
                        }}
                      ></div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                      {b.total_orders || 0} completed orders
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top-Selling Products Table */}
      <div className="ui-card">
        <div className="ui-card-header">
          <div>
            <div className="ui-card-title">Top-Selling Beauty Products</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>High velocity cosmetics and hair care items</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveView('reports')}>
            <span>Full Financial Report</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Selling Price</th>
                <th>Units Sold</th>
                <th>Total Revenue</th>
                <th>Estimated Gross Profit</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No sales data recorded yet. Complete sales in the POS terminal to see statistics.
                  </td>
                </tr>
              ) : (
                topProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SKU: {p.sku}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{p.category_name}</span>
                    </td>
                    <td>GH₵ {parseFloat(p.selling_price).toFixed(2)}</td>
                    <td>
                      <strong>{p.total_quantity_sold}</strong> units
                    </td>
                    <td style={{ fontWeight: '700', color: '#0f172a' }}>
                      GH₵ {parseFloat(p.total_revenue).toFixed(2)}
                    </td>
                    <td style={{ color: '#059669', fontWeight: '700' }}>
                      GH₵ {parseFloat(p.estimated_profit).toFixed(2)}
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
