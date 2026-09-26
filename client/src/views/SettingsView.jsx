import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle,
  Building,
  Coins,
  Percent,
  Clock,
  Printer
} from 'lucide-react';

export default function SettingsView({ currentUser }) {
  const [settings, setSettings] = useState({
    company_name: 'Angales Beauty Supplies Ltd',
    currency_code: 'GHS',
    currency_symbol: 'GH₵',
    vat_rate: '0.05',
    max_cashier_discount: '10',
    max_manager_discount: '30',
    low_stock_default_threshold: '15',
    expiry_warning_days: '90',
    receipt_header: 'ANGALES BEAUTY SUPPLIES\nLuxury Cosmetics & Hair Haven\nAccra, Kumasi, Takoradi, Tamale\nTel: +233 24 111 2233',
    receipt_footer: 'Thank you for choosing Angales Beauty!\nGoods sold in good condition are exchangeable within 7 days.\nFollow us on Instagram: @angalesbeautygh'
  });
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings && Object.keys(data.settings).length > 0) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': currentUser?.name || 'Admin'
        },
        body: JSON.stringify({ settings })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings & Policies</h1>
          <p className="page-subtitle">
            Configure company identity, Ghana tax structures, role-based discount ceilings, and thermal receipt print formats
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '600'
        }}>
          <CheckCircle size={18} />
          <span>System configuration saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          {/* Company & Regional Info */}
          <div className="ui-card" style={{ marginBottom: 0 }}>
            <div className="ui-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} color="#c97a63" />
                <span className="ui-card-title">Corporate & Currency Settings</span>
              </div>
            </div>
            <div className="ui-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Registered Business Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Currency Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.currency_code}
                    onChange={(e) => setSettings({ ...settings, currency_code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Currency Display Symbol</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.currency_symbol}
                    onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Standard VAT / Consumption Tax Rate (Ghana Flat)</label>
                <input
                  type="text"
                  placeholder="0.05 for 5%"
                  className="form-input"
                  value={settings.vat_rate}
                  onChange={(e) => setSettings({ ...settings, vat_rate: e.target.value })}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>E.g. 0.05 equals 5% standard VAT rate.</span>
              </div>
            </div>
          </div>

          {/* Discount Policies & Thresholds */}
          <div className="ui-card" style={{ marginBottom: 0 }}>
            <div className="ui-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Percent size={18} color="#c97a63" />
                <span className="ui-card-title">Role Permission Thresholds</span>
              </div>
            </div>
            <div className="ui-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Cashier Max Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={settings.max_cashier_discount}
                    onChange={(e) => setSettings({ ...settings, max_cashier_discount: e.target.value })}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Discounts above this require Manager code.</span>
                </div>
                <div>
                  <label className="form-label">Manager Max Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={settings.max_manager_discount}
                    onChange={(e) => setSettings({ ...settings, max_manager_discount: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Default Low-Stock Threshold</label>
                  <input
                    type="number"
                    className="form-input"
                    value={settings.low_stock_default_threshold}
                    onChange={(e) => setSettings({ ...settings, low_stock_default_threshold: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Expiry Alert Warning Period (Days)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={settings.expiry_warning_days}
                    onChange={(e) => setSettings({ ...settings, expiry_warning_days: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Thermal Receipt Print Configuration */}
          <div className="ui-card" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
            <div className="ui-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} color="#c97a63" />
                <span className="ui-card-title">POS Thermal Receipt Templates</span>
              </div>
            </div>
            <div className="ui-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label">Receipt Header Note</label>
                <textarea
                  rows="4"
                  className="form-textarea"
                  value={settings.receipt_header}
                  onChange={(e) => setSettings({ ...settings, receipt_header: e.target.value })}
                ></textarea>
              </div>

              <div>
                <label className="form-label">Receipt Footer Note</label>
                <textarea
                  rows="4"
                  className="form-textarea"
                  value={settings.receipt_footer}
                  onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            <Save size={18} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
