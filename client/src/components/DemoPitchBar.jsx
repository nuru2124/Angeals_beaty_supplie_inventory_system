import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Crown,
  Building,
  CreditCard,
  Boxes,
  PieChart,
  ChevronUp,
  ChevronDown,
  Check
} from 'lucide-react';
import { resetDemoData } from '../demo/demoEngine';
import { DEMO_USERS } from '../demo/mockData';

export default function DemoPitchBar({ currentUser, onSwitchUser }) {
  const [collapsed, setCollapsed] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = () => {
    if (window.confirm('Reset all demo data (products, sales, stock levels) back to initial presentation state?')) {
      resetDemoData();
      setResetSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const roles = [
    { key: 'super_admin', label: 'Super Admin (HQ)', icon: Crown, color: '#f59e0b', user: DEMO_USERS[0] },
    { key: 'branch_manager', label: 'Kumasi Manager', icon: Building, color: '#3b82f6', user: DEMO_USERS[1] },
    { key: 'cashier', label: 'POS Cashier', icon: CreditCard, color: '#10b981', user: DEMO_USERS[2] },
    { key: 'inventory_officer', label: 'Inventory Officer', icon: Boxes, color: '#8b5cf6', user: DEMO_USERS[3] },
    { key: 'accountant', label: 'Accountant', icon: PieChart, color: '#ec4899', user: DEMO_USERS[4] }
  ];

  if (collapsed) {
    return (
      <div
        onClick={() => setCollapsed(false)}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '24px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          zIndex: 9999,
          fontSize: '0.8rem',
          fontWeight: '600',
          border: '1px solid rgba(201, 122, 99, 0.4)'
        }}
      >
        <Sparkles size={15} color="#c97a63" />
        <span>Pitch Demo Controls</span>
        <ChevronUp size={14} />
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
      color: '#f8fafc',
      padding: '8px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      fontSize: '0.82rem',
      zIndex: 100,
      position: 'relative',
      flexWrap: 'wrap',
      gap: '8px'
    }}>
      {/* Left: Demo Mode Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(201, 122, 99, 0.2)',
          border: '1px solid rgba(201, 122, 99, 0.5)',
          padding: '3px 10px',
          borderRadius: '12px',
          color: '#fca5a5',
          fontWeight: '700',
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          <Sparkles size={13} color="#fca5a5" />
          <span>Pitch Demo Edition</span>
        </div>
        <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
          Active View: <strong style={{ color: '#ffffff' }}>{currentUser?.name}</strong> ({currentUser?.role})
        </span>
      </div>

      {/* Center: Quick Role Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginRight: '4px' }}>Switch Role:</span>
        {roles.map(r => {
          const Icon = r.icon;
          const isActive = currentUser?.role === r.key;
          return (
            <button
              key={r.key}
              onClick={() => onSwitchUser(r.user)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: isActive ? `1px solid ${r.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                background: isActive ? `${r.color}25` : 'rgba(255, 255, 255, 0.05)',
                color: isActive ? '#ffffff' : '#cbd5e1',
                fontSize: '0.75rem',
                fontWeight: isActive ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={`Switch perspective to ${r.label}`}
            >
              <Icon size={12} color={r.color} />
              <span>{r.label}</span>
              {isActive && <Check size={11} color={r.color} />}
            </button>
          );
        })}
      </div>

      {/* Right: Reset Data & Minimize */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
          title="Reset database to initial pristine state"
        >
          <RefreshCw size={12} className={resetSuccess ? 'spin' : ''} />
          <span>{resetSuccess ? 'Resetting...' : 'Reset Demo Data'}</span>
        </button>

        <button
          onClick={() => setCollapsed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="Minimize pitch banner"
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
}
