import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  Filter,
  Receipt,
  Calendar,
  Building,
  DollarSign,
  X
} from 'lucide-react';

export default function ExpensesView({ activeBranch, branches, currentUser }) {
  const [expenses, setExpenses] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    branch_id: activeBranch || (branches[0]?.id || 1),
    category: 'rent',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    receipt_ref: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, [activeBranch, categoryFilter]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      let url = `/api/expenses?`;
      if (activeBranch) url += `branch_id=${activeBranch}&`;
      if (categoryFilter) url += `category=${categoryFilter}&`;

      const res = await fetch(url);
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          recorded_by: currentUser?.id || 1
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowAddModal(false);
      fetchExpenses();
      setForm({
        branch_id: activeBranch || (branches[0]?.id || 1),
        category: 'rent',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        receipt_ref: ''
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Operational Expenses</h1>
          <p className="page-subtitle">
            Track branch operating costs (rent, ECG electricity, packaging bags, marketing, logistics) for net profit calculations
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Expense Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Recorded Expenses</div>
            <div className="kpi-value" style={{ color: '#dc2626' }}>
              GH₵ {totalExpenseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="kpi-subtext">{expenses.length} expense vouchers</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <Wallet size={22} />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '18px' }}>
        {['', 'rent', 'electricity', 'internet', 'marketing', 'salaries', 'packaging', 'transportation', 'other'].map(cat => (
          <button
            key={cat}
            className={`filter-tab ${categoryFilter === cat ? 'active' : ''}`}
            onClick={() => setCategoryFilter(cat)}
            style={{ textTransform: 'capitalize' }}
          >
            {cat ? cat : 'All Categories'}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="ui-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Voucher #</th>
                <th>Branch</th>
                <th>Category</th>
                <th>Amount (GHS)</th>
                <th>Date</th>
                <th>Description</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No expenses recorded for this selection.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.expense_number}</strong></td>
                    <td>{e.branch_name} ({e.branch_code})</td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: '#dc2626' }}>
                      GH₵ {parseFloat(e.amount).toFixed(2)}
                    </td>
                    <td>{e.date}</td>
                    <td>{e.description || '—'}</td>
                    <td>{e.recorded_by_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem' }}>Record Branch Expense</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <form onSubmit={handleCreateExpense}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Branch *</label>
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
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="rent">Store Rent / Lease</option>
                      <option value="electricity">ECG Electricity Power</option>
                      <option value="internet">Internet & Communication</option>
                      <option value="marketing">Marketing & Influencers</option>
                      <option value="salaries">Staff Wages / Bonuses</option>
                      <option value="packaging">Branded Bags & Packaging</option>
                      <option value="transportation">Dispatch & Transport</option>
                      <option value="maintenance">Cleaning & Maintenance</option>
                      <option value="other">Other Expense</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Amount (GHS) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 850.00"
                      className="form-input"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Expense Date *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Description / Purpose</label>
                  <textarea
                    rows="2"
                    className="form-textarea"
                    placeholder="e.g. ECG commercial prepaid credit for Accra Flagship..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Expense Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
