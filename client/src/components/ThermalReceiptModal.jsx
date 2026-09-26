import React from 'react';
import { Printer, X } from 'lucide-react';

export default function ThermalReceiptModal({ receiptData, onClose }) {
  if (!receiptData) return null;

  const {
    invoiceNumber,
    branch,
    customer,
    cashier,
    items = [],
    subtotal = 0,
    discount = 0,
    tax = 0,
    total = 0,
    paymentMethod = 'Cash',
    paymentDetails = '',
    amountPaid = 0,
    change = 0,
    timestamp = new Date().toISOString()
  } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.1rem' }}>Receipt Preview</h3>
          <button onClick={onClose} style={{ padding: '4px' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        {/* Printable Thermal Receipt Box */}
        <div className="printable-area thermal-receipt">
          <div className="receipt-header">
            <div className="receipt-title">ANGALES BEAUTY SUPPLIES</div>
            <div style={{ fontSize: '11px', marginTop: '2px' }}>Cosmetics, Hair & Luxury Scents</div>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>
              {branch?.name || 'Accra Main Flagship'}
            </div>
            <div style={{ fontSize: '10px' }}>{branch?.address || 'Kwame Nkrumah Ave, Accra'}</div>
            <div style={{ fontSize: '10px' }}>Tel: {branch?.phone || '+233 24 111 2233'}</div>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-row" style={{ fontSize: '11px' }}>
            <span>Invoice:</span>
            <strong>{invoiceNumber}</strong>
          </div>
          <div className="receipt-row" style={{ fontSize: '11px' }}>
            <span>Date:</span>
            <span>{new Date(timestamp).toLocaleString('en-GB')}</span>
          </div>
          <div className="receipt-row" style={{ fontSize: '11px' }}>
            <span>Cashier:</span>
            <span>{cashier || 'Cashier'}</span>
          </div>
          {customer && (
            <div className="receipt-row" style={{ fontSize: '11px' }}>
              <span>Customer:</span>
              <span>{customer.name} ({customer.customer_type || 'Customer'})</span>
            </div>
          )}

          <div className="receipt-divider"></div>

          {/* Items Header */}
          <div className="receipt-row" style={{ fontSize: '11px', fontWeight: 'bold' }}>
            <span style={{ width: '50%' }}>ITEM</span>
            <span style={{ width: '15%', textAlign: 'center' }}>QTY</span>
            <span style={{ width: '35%', textAlign: 'right' }}>GHS</span>
          </div>

          <div className="receipt-divider" style={{ margin: '4px 0' }}></div>

          {/* Items List */}
          {items.map((it, idx) => (
            <div key={idx} style={{ marginBottom: '5px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                {it.name || it.product_name}
              </div>
              <div className="receipt-row" style={{ fontSize: '11px', color: '#334155' }}>
                <span style={{ width: '50%', fontSize: '10px' }}>
                  @{parseFloat(it.price || it.unit_price).toFixed(2)}
                </span>
                <span style={{ width: '15%', textAlign: 'center' }}>{it.quantity}</span>
                <span style={{ width: '35%', textAlign: 'right' }}>
                  {parseFloat(it.subtotal || (it.price * it.quantity)).toFixed(2)}
                </span>
              </div>
            </div>
          ))}

          <div className="receipt-divider"></div>

          {/* Totals Breakdown */}
          <div className="receipt-row">
            <span>Subtotal:</span>
            <span>GHS {parseFloat(subtotal).toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="receipt-row" style={{ color: '#059669' }}>
              <span>Discount:</span>
              <span>-GHS {parseFloat(discount).toFixed(2)}</span>
            </div>
          )}
          <div className="receipt-row">
            <span>VAT / Tax (5%):</span>
            <span>GHS {parseFloat(tax).toFixed(2)}</span>
          </div>
          <div className="receipt-row receipt-total">
            <span>TOTAL:</span>
            <span>GHS {parseFloat(total).toFixed(2)}</span>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-row">
            <span>Payment Method:</span>
            <strong style={{ textTransform: 'capitalize' }}>
              {paymentMethod ? paymentMethod.replace('_', ' ') : 'Cash'}
            </strong>
          </div>
          {paymentDetails && (
            <div className="receipt-row" style={{ fontSize: '10px' }}>
              <span>Reference:</span>
              <span>{paymentDetails}</span>
            </div>
          )}
          <div className="receipt-row">
            <span>Amount Paid:</span>
            <span>GHS {parseFloat(amountPaid).toFixed(2)}</span>
          </div>
          <div className="receipt-row">
            <span>Change Due:</span>
            <span>GHS {parseFloat(change).toFixed(2)}</span>
          </div>

          {/* Barcode Simulation */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <div style={{
              letterSpacing: '5px',
              fontFamily: 'monospace',
              fontSize: '18px',
              fontWeight: 'bold',
              background: '#f1f5f9',
              padding: '6px',
              borderRadius: '4px'
            }}>
              ||| | |||| | ||| ||
            </div>
            <div style={{ fontSize: '10px', marginTop: '3px' }}>{invoiceNumber}</div>
          </div>

          <div className="receipt-footer">
            <div>Thank you for choosing Angales Beauty!</div>
            <div style={{ marginTop: '3px' }}>Goods sold are exchangeable within 7 days with this original receipt.</div>
            <div style={{ marginTop: '3px', fontWeight: 'bold' }}>Follow @angalesbeautygh</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
