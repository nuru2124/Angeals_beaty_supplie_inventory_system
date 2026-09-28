import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      // Store authenticated session
      localStorage.setItem('angales_token', data.token);
      localStorage.setItem('angales_user', JSON.stringify(data.user));

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 100%)',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Brand Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          padding: '36px 32px 30px',
          textAlign: 'center',
          color: '#ffffff',
          position: 'relative'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            background: 'linear-gradient(135deg, #c97a63 0%, #b86249 100%)',
            borderRadius: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(201, 122, 99, 0.4)',
            marginBottom: '14px'
          }}>
            <Sparkles size={26} color="#ffffff" />
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            margin: '0 0 6px 0',
            color: '#f8fafc'
          }}>
            Angales Beauty Supplies
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: '#94a3b8',
            margin: 0,
            letterSpacing: '0.01em'
          }}>
            Multi-Branch Inventory & Point of Sale System
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '16px',
            padding: '4px 12px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            fontSize: '0.74rem',
            color: '#cbd5e1'
          }}>
            <ShieldCheck size={14} color="#34d399" />
            <span>Enterprise Encrypted Session</span>
          </div>
        </div>

        {/* Login Form Body */}
        <div style={{ padding: '32px' }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.85rem',
              lineHeight: 1.4
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Email Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '6px'
              }}>
                Work Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }}>
                  <Mail size={17} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="admin@angales.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#c97a63';
                    e.target.style.boxShadow = '0 0 0 3px rgba(201, 122, 99, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '6px'
              }}>
                Account Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }}>
                  <Lock size={17} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#c97a63';
                    e.target.style.boxShadow = '0 0 0 3px rgba(201, 122, 99, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: '#94a3b8'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #c97a63 0%, #b86249 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.92rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px',
                boxShadow: '0 4px 12px rgba(201, 122, 99, 0.35)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                opacity: loading ? 0.7 : 1
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <LogIn size={18} />
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            </button>
          </form>

          {/* Pitch Demo 1-Click Role Access */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Sparkles size={14} color="#c97a63" />
                <span>Instant Pitch Demo Logins</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>1-Click Sign-in</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  const u = {
                    id: 1,
                    name: 'Angales Executive (Super Admin)',
                    email: 'admin@angales.com',
                    role: 'super_admin',
                    phone: '+233 24 111 2233'
                  };
                  const t = 'demo_token_super_admin';
                  localStorage.setItem('angales_token', t);
                  localStorage.setItem('angales_user', JSON.stringify(u));
                  onLoginSuccess(u, t);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <span>👑</span>
                <span>Super Admin (HQ)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const u = {
                    id: 3,
                    name: 'Efua Mensah (POS Cashier)',
                    email: 'cashier.accra@angales.com',
                    role: 'cashier',
                    phone: '+233 24 888 1234',
                    branches: [{ id: 1, name: 'Angales Beauty Supplies - Accra Flagship' }]
                  };
                  const t = 'demo_token_cashier';
                  localStorage.setItem('angales_token', t);
                  localStorage.setItem('angales_user', JSON.stringify(u));
                  onLoginSuccess(u, t);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <span>💳</span>
                <span>Sales Cashier (POS)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const u = {
                    id: 2,
                    name: 'Kwame Osei-Tutu (Branch Manager)',
                    email: 'manager.kumasi@angales.com',
                    role: 'branch_manager',
                    phone: '+233 20 444 7788',
                    branches: [{ id: 2, name: 'Angales Beauty Supplies - Kumasi City Mall' }]
                  };
                  const t = 'demo_token_manager';
                  localStorage.setItem('angales_token', t);
                  localStorage.setItem('angales_user', JSON.stringify(u));
                  onLoginSuccess(u, t);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <span>🏢</span>
                <span>Kumasi Manager</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const u = {
                    id: 4,
                    name: 'Kofi Boateng (Inventory Officer)',
                    email: 'inventory@angales.com',
                    role: 'inventory_officer',
                    phone: '+233 24 555 9876'
                  };
                  const t = 'demo_token_inventory';
                  localStorage.setItem('angales_token', t);
                  localStorage.setItem('angales_user', JSON.stringify(u));
                  onLoginSuccess(u, t);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <span>📦</span>
                <span>Inventory Officer</span>
              </button>
            </div>
          </div>

          {/* Secure Environment Notice */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
            fontSize: '0.75rem',
            color: '#64748b',
            lineHeight: 1.5,
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 4px 0' }}>
              🔒 Protected by scrypt password salting & HS256 cryptographic tokens.
            </p>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              Pitch Demo Deployment • Ready for Enterprise Evaluation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
