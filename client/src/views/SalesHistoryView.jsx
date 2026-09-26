import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  Eye,
  CheckCircle,
  X,
  CreditCard
} from 'lucide-react';
import ThermalReceiptModal from '../components/ThermalReceiptModal';

export default function SalesHistoryView({ activeBranch, branches, currentUser }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [saleForReturn, setSaleForReturn] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('damaged');
  const [returnNotes, setReturnNotes] = useState('');

  useEffect(() => {
    fetchSales();
  }, [activeBranch]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      let url = `/api/sales?`;
      if (activeBranch) url += `branch_id=${activeBranch}`;
      const res = await fetch(url);
      const data = await res.json();
      setSales(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async (saleId) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      const data = await res.json();
      const bObj = branches.find(b => b.id === data.branch_id);

      setSelectedReceipt({
        invoiceNumber: data.invoice_number,
        branch: bObj || { name: data.branch_name, address: data.branch_address, phone: data.branch_phone },
        customer: data.customer_name ? { name: data.customer_name, customer_type: 'Customer' } : null,
        cashier: data.cashier_name,
        items: data.items,
        subtotal: data.subtotal,
        discount: data.discount_amount,
        tax: data.tax_amount,
        total: data.total_amount,
        paymentMethod: data.payment_method,
        paymentDetails: data.payment_details,
        amountPaid: data.amount_paid,
        change: data.change_amount,
        timestamp: data.created_at
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenReturn = async (saleId) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      const data = await res.json();
      setSaleForReturn(data);
      setReturnItems(data.items.map(it => ({
        sale_item_id: it.id,
        product_id: it.product_id,
        product_name: it.product_name,
        unit_price: it.unit_price,
        sold_quantity: it.quantity,
        return_quantity: 1,
        restock: true
      })));
      setShowReturnModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    try {
      const itemsToReturn = returnItems
        .filter(it => it.return_quantity > 0)
        .map(it => ({
          sale_item_id: it.sale_item_id,
          product_id: it.product_id,
          quantity: it.return_quantity,
          refund_amount: it.return_quantity * it.unit_price,
          restock_inventory: it.restock ? 1 : 0
        }));

      if (itemsToReturn.length === 0) {
        alert('Please specify at least 1 item to return');
        return;
      }

      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_id: saleForReturn.id,
          branch_id: saleForReturn.branch_id,
          processed_by: currentUser?.id || 1,
          reason: returnReason,
          notes: returnNotes,
          items: itemsToReturn
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Return ${data.return_number} processed successfully! Refund: GH₵ ${data.total_refund.toFixed(2)}`);
      setShowReturnModal(false);
      fetchSales();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredSales = sales.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.invoice_number.toLowerCase().includes(q) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
      (s.cashier_name && s.cashier_name.toLowerCase().includes(q));
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales History & Returns</h1>
          <p className="page-subtitle">
            Search completed POS transactions, reprint receipts, and process customer product returns
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="ui-card" style={{ marginBottom: '16px' }}>
        <div className="ui-card-body" style={{ padding: '12px 18px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
            <input
              type="text"
              placeholder="Search by invoice number, customer name, or cashier..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="ui-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date & Time</th>
                <th>Branch</th>
                <th>Customer</th>
                <th>Cashier</th>
                <th>Payment</th>
                <th>Total (GHS)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Loading sales transactions...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No sales records found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.invoice_number}</strong>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(s.created_at).toLocaleString('en-GB')}
                    </td>
                    <td>{s.branch_name}</td>
                    <td>{s.customer_name || 'Walk-in'}</td>
                    <td>{s.cashier_name}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {s.payment_method.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: '#0f172a' }}>
                      GH₵ {parseFloat(s.total_amount).toFixed(2)}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenReceipt(s.id)}
                          title="View / Print Receipt"
                        >
                          <Printer size={14} />
                          <span>Receipt</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenReturn(s.id)}
                          title="Process Return"
                        >
                          <RotateCcw size={14} color="#d97706" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && saleForReturn && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>Process Product Return</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Invoice: {saleForReturn.invoice_number} • Total: GH₵ {parseFloat(saleForReturn.total_amount).toFixed(2)}
                </div>
              </div>
              <button onClick={() => setShowReturnModal(false)}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <form onSubmit={handleSubmitReturn}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '0.9rem' }}>Select Items to Return</h4>
                <div className="table-responsive">
                  <table className="data-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Sold Qty</th>
                        <th>Return Qty</th>
                        <th>Restock?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnItems.map((it, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{it.product_name}</strong>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>GH₵ {parseFloat(it.unit_price).toFixed(2)}</div>
                          </td>
                          <td>{it.sold_quantity}</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max={it.sold_quantity}
                              className="form-input"
                              style={{ width: '70px', padding: '4px 6px' }}
                              value={it.return_quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setReturnItems(returnItems.map((x, i) => i === idx ? { ...x, return_quantity: val } : x));
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={it.restock}
                              onChange={(e) => {
                                setReturnItems(returnItems.map((x, i) => i === idx ? { ...x, restock: e.target.checked } : x));
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <label className="form-label">Return Reason *</label>
                  <select
                    className="form-select"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  >
                    <option value="damaged">Damaged / Leakage</option>
                    <option value="wrong_product">Wrong Product Supplied</option>
                    <option value="changed_mind">Customer Changed Mind</option>
                    <option value="defective">Defective Seal / Pump</option>
                    <option value="expired">Approaching Expiry</option>
                    <option value="other">Other Reason</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Return Notes</label>
                  <textarea
                    rows="2"
                    className="form-textarea"
                    placeholder="Enter details..."
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReturnModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Return & Issue Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Thermal Receipt Preview Modal */}
      {selectedReceipt && (
        <ThermalReceiptModal
          receiptData={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
