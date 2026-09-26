import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Clock,
  ArrowRightLeft,
  Truck,
  Receipt,
  ClipboardCheck,
  Sliders,
  Building2,
  Users,
  UserCheck,
  Wallet,
  BarChart3,
  ShieldCheck,
  Settings,
  Sparkles,
  LogOut
} from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, currentUser, onLogout }) {
  const role = currentUser?.role || 'cashier';

  // Navigation schema with role-based access rules
  const navItems = [
    {
      id: 'dashboard',
      label: 'Main Dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'branch_manager', 'inventory_officer', 'accountant']
    },
    {
      id: 'pos',
      label: 'Sales POS Terminal',
      icon: ShoppingCart,
      roles: ['super_admin', 'branch_manager', 'cashier'],
      highlight: true
    },
    {
      id: 'products',
      label: 'Products Catalog',
      icon: Package,
      roles: ['super_admin', 'branch_manager', 'inventory_officer', 'cashier']
    },
    {
      id: 'inventory',
      label: 'Branch Inventory & Reorder',
      icon: Boxes,
      roles: ['super_admin', 'branch_manager', 'inventory_officer']
    },
    {
      id: 'batches',
      label: 'Expiry & FEFO Batches',
      icon: Clock,
      roles: ['super_admin', 'branch_manager', 'inventory_officer']
    },
    {
      id: 'transfers',
      label: 'Inter-Branch Transfers',
      icon: ArrowRightLeft,
      roles: ['super_admin', 'branch_manager', 'inventory_officer']
    },
    {
      id: 'purchases',
      label: 'Purchasing & Suppliers',
      icon: Truck,
      roles: ['super_admin', 'branch_manager', 'inventory_officer', 'accountant']
    },
    {
      id: 'sales_history',
      label: 'Sales Ledger & Returns',
      icon: Receipt,
      roles: ['super_admin', 'branch_manager', 'cashier', 'accountant']
    },
    {
      id: 'stocktake',
      label: 'Physical Stocktake',
      icon: ClipboardCheck,
      roles: ['super_admin', 'branch_manager', 'inventory_officer']
    },
    {
      id: 'adjustments',
      label: 'Stock Adjustments',
      icon: Sliders,
      roles: ['super_admin', 'branch_manager', 'inventory_officer']
    },
    {
      id: 'branches',
      label: 'Branches & Stores',
      icon: Building2,
      roles: ['super_admin']
    },
    {
      id: 'users',
      label: 'Staff Personnel',
      icon: UserCheck,
      roles: ['super_admin']
    },
    {
      id: 'customers',
      label: 'Customer Register',
      icon: Users,
      roles: ['super_admin', 'branch_manager', 'cashier']
    },
    {
      id: 'expenses',
      label: 'Operational Expenses',
      icon: Wallet,
      roles: ['super_admin', 'branch_manager', 'accountant']
    },
    {
      id: 'reports',
      label: 'Financials & Reports',
      icon: BarChart3,
      roles: ['super_admin', 'branch_manager', 'accountant']
    },
    {
      id: 'audit',
      label: 'Audit Trail Logs',
      icon: ShieldCheck,
      roles: ['super_admin', 'accountant']
    },
    {
      id: 'settings',
      label: 'System Settings',
      icon: Settings,
      roles: ['super_admin']
    }
  ];

  // Filter allowed navigation items strictly for the authenticated user's role
  const visibleNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand-icon">
          <Sparkles size={20} />
        </div>
        <div>
          <div className="sidebar-brand-title">Angales Beauty</div>
          <div className="sidebar-brand-subtitle">Multi-Branch IMS</div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="sidebar-nav">
        <div className="sidebar-section-title">Operations</div>
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              style={item.highlight ? { color: isActive ? '#ffffff' : '#fbcfe8', fontWeight: '600' } : {}}
            >
              <Icon size={18} color={isActive ? '#c97a63' : (item.highlight ? '#f472b6' : '#94a3b8')} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer / User Profile & Logout */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#f8fafc' }}>
              {currentUser?.name || 'Staff User'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {currentUser?.roleDisplay || 'Authenticated'}
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            style={{
              padding: '6px',
              borderRadius: '6px',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'color 0.15s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
