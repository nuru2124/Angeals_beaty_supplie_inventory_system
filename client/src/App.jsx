import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DemoPitchBar from './components/DemoPitchBar';
import LoginView from './views/LoginView';

// Views
import DashboardView from './views/DashboardView';
import PosView from './views/PosView';
import ProductsView from './views/ProductsView';
import InventoryView from './views/InventoryView';
import BatchExpiryView from './views/BatchExpiryView';
import TransfersView from './views/TransfersView';
import PurchasingView from './views/PurchasingView';
import SalesHistoryView from './views/SalesHistoryView';
import StocktakeView from './views/StocktakeView';
import AdjustmentsView from './views/AdjustmentsView';
import BranchesView from './views/BranchesView';
import UsersView from './views/UsersView';
import CustomersView from './views/CustomersView';
import ExpensesView from './views/ExpensesView';
import ReportsView from './views/ReportsView';
import AuditLogView from './views/AuditLogView';
import SettingsView from './views/SettingsView';

import {
  ShoppingCart,
  Plus,
  ArrowRightLeft,
  ClipboardCheck,
  Wallet,
  X,
  Sparkles
} from 'lucide-react';

const ROLE_PERMITTED_VIEWS = {
  super_admin: [
    'dashboard', 'pos', 'products', 'inventory', 'batches',
    'transfers', 'purchases', 'sales_history', 'stocktake',
    'adjustments', 'branches', 'users', 'customers', 'expenses',
    'reports', 'audit', 'settings'
  ],
  branch_manager: [
    'dashboard', 'pos', 'products', 'inventory', 'batches',
    'transfers', 'purchases', 'sales_history', 'stocktake',
    'adjustments', 'customers', 'expenses', 'reports'
  ],
  inventory_officer: [
    'dashboard', 'products', 'inventory', 'batches',
    'transfers', 'purchases', 'stocktake', 'adjustments'
  ],
  cashier: [
    'pos', 'products', 'sales_history', 'customers'
  ],
  accountant: [
    'dashboard', 'purchases', 'sales_history', 'expenses', 'reports', 'audit'
  ]
};

const DEFAULT_ROLE_VIEW = {
  super_admin: 'dashboard',
  branch_manager: 'dashboard',
  inventory_officer: 'inventory',
  cashier: 'pos',
  accountant: 'reports'
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('angales_token'));
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('angales_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const [activeView, setActiveView] = useState('dashboard');
  const [activeBranch, setActiveBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);

  // Verify and fetch active session
  useEffect(() => {
    const handleSessionExpired = () => {
      handleLogout();
    };

    window.addEventListener('angales_session_expired', handleSessionExpired);

    if (token) {
      verifyCurrentSession();
      fetchBranches();
    } else {
      setIsVerifyingAuth(false);
    }

    return () => {
      window.removeEventListener('angales_session_expired', handleSessionExpired);
    };
  }, [token]);

  // Ensure user cannot navigate to a view forbidden for their role
  useEffect(() => {
    if (currentUser?.role) {
      const allowedViews = ROLE_PERMITTED_VIEWS[currentUser.role] || [];
      if (!allowedViews.includes(activeView)) {
        const fallback = DEFAULT_ROLE_VIEW[currentUser.role] || 'pos';
        setActiveView(fallback);
      }
    }
  }, [currentUser, activeView]);

  const verifyCurrentSession = async () => {
    try {
      setIsVerifyingAuth(true);
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('angales_user', JSON.stringify(data.user));

          // Set default view on login if needed
          if (data.user.role === 'cashier') {
            setActiveView('pos');
          } else if (data.user.role === 'inventory_officer') {
            setActiveView('inventory');
          } else if (data.user.role === 'accountant') {
            setActiveView('reports');
          }

          // If branch staff assigned to a single branch, lock activeBranch
          if (data.user.role !== 'super_admin' && data.user.branches?.length === 1) {
            setActiveBranch(data.user.branches[0].id);
          }
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Session verification error:', err);
      handleLogout();
    } finally {
      setIsVerifyingAuth(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  };

  const handleLoginSuccess = (user, authToken) => {
    setToken(authToken);
    setCurrentUser(user);
    const initialView = DEFAULT_ROLE_VIEW[user.role] || 'dashboard';
    setActiveView(initialView);

    if (user.role !== 'super_admin' && user.branches?.length === 1) {
      setActiveBranch(user.branches[0].id);
    } else {
      setActiveBranch(null);
    }

    fetchBranches();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {}

    localStorage.removeItem('angales_token');
    localStorage.removeItem('angales_user');
    setToken(null);
    setCurrentUser(null);
    setActiveView('dashboard');
  };

  // If unauthenticated or token revoked, render clean Login View
  if (!token || !currentUser) {
    if (isVerifyingAuth) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(201, 122, 99, 0.2)',
              borderTopColor: '#c97a63',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px auto'
            }}></div>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Verifying security session...</p>
          </div>
        </div>
      );
    }
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <div className="main-wrapper">
        {/* Pitch Demo Bar */}
        <DemoPitchBar
          currentUser={currentUser}
          onSwitchUser={(user) => {
            setCurrentUser(user);
            localStorage.setItem('angales_user', JSON.stringify(user));
            const newDefault = DEFAULT_ROLE_VIEW[user.role] || 'dashboard';
            setActiveView(newDefault);
            if (user.role !== 'super_admin' && user.branches?.length === 1) {
              setActiveBranch(user.branches[0].id);
            } else {
              setActiveBranch(null);
            }
          }}
        />

        {/* Top Navbar */}
        <Navbar
          branches={branches}
          activeBranch={activeBranch}
          setActiveBranch={setActiveBranch}
          currentUser={currentUser}
          onOpenQuickAction={() => setShowQuickActionModal(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic Content View */}
        <main className="content-body">
          {activeView === 'dashboard' && (
            <DashboardView
              activeBranch={activeBranch}
              setActiveView={setActiveView}
              onQuickAction={() => setShowQuickActionModal(true)}
            />
          )}

          {activeView === 'pos' && (
            <PosView
              activeBranch={activeBranch}
              branches={branches}
              currentUser={currentUser}
            />
          )}

          {activeView === 'products' && (
            <ProductsView
              activeBranch={activeBranch}
              branches={branches}
            />
          )}

          {activeView === 'inventory' && (
            <InventoryView
              activeBranch={activeBranch}
              branches={branches}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'batches' && (
            <BatchExpiryView
              activeBranch={activeBranch}
              branches={branches}
            />
          )}

          {activeView === 'transfers' && (
            <TransfersView
              activeBranch={activeBranch}
              branches={branches}
              currentUser={currentUser}
            />
          )}

          {activeView === 'purchases' && (
            <PurchasingView
              activeBranch={activeBranch}
              branches={branches}
              currentUser={currentUser}
            />
          )}

          {activeView === 'sales_history' && (
            <SalesHistoryView
              activeBranch={activeBranch}
              branches={branches}
              currentUser={currentUser}
            />
          )}

          {activeView === 'stocktake' && (
            <StocktakeView
              activeBranch={activeBranch}
              branches={branches}
              currentUser={currentUser}
            />
          )}

          {activeView === 'adjustments' && (
            <AdjustmentsView
              activeBranch={activeBranch}
              branches={branches}
              currentUser={currentUser}
            />
          )}

          {activeView === 'branches' && (
            <BranchesView />
          )}

          {activeView === 'users' && (
            <UsersView branches={branches} />
          )}

          {activeView === 'customers' && (
            <CustomersView />
          )}

          {activeView === 'expenses' && (
            <ExpensesView
              activeBranch={activeBranch}
              branches={branches}
              currentUser={currentUser}
            />
          )}

          {activeView === 'reports' && (
            <ReportsView
              activeBranch={activeBranch}
              branches={branches}
            />
          )}

          {activeView === 'audit' && (
            <AuditLogView
              activeBranch={activeBranch}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {/* Global Quick Action Modal */}
      {showQuickActionModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#c97a63" />
                <h3 style={{ fontSize: '1.1rem' }}>Quick Actions</h3>
              </div>
              <button onClick={() => setShowQuickActionModal(false)}>
                <X size={18} color="#64748b" />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {['super_admin', 'branch_manager', 'cashier'].includes(currentUser?.role) && (
                <button
                  className="btn btn-secondary"
                  style={{ height: '70px', flexDirection: 'column', gap: '6px' }}
                  onClick={() => { setShowQuickActionModal(false); setActiveView('pos'); }}
                >
                  <ShoppingCart size={20} color="#c97a63" />
                  <span style={{ fontWeight: '700' }}>New Sale (POS)</span>
                </button>
              )}

              {['super_admin', 'branch_manager', 'inventory_officer'].includes(currentUser?.role) && (
                <button
                  className="btn btn-secondary"
                  style={{ height: '70px', flexDirection: 'column', gap: '6px' }}
                  onClick={() => { setShowQuickActionModal(false); setActiveView('products'); }}
                >
                  <Plus size={20} color="#10b981" />
                  <span style={{ fontWeight: '700' }}>Add Product</span>
                </button>
              )}

              {['super_admin', 'branch_manager', 'inventory_officer'].includes(currentUser?.role) && (
                <button
                  className="btn btn-secondary"
                  style={{ height: '70px', flexDirection: 'column', gap: '6px' }}
                  onClick={() => { setShowQuickActionModal(false); setActiveView('transfers'); }}
                >
                  <ArrowRightLeft size={20} color="#8b5cf6" />
                  <span style={{ fontWeight: '700' }}>Create Transfer</span>
                </button>
              )}

              {['super_admin', 'branch_manager', 'inventory_officer'].includes(currentUser?.role) && (
                <button
                  className="btn btn-secondary"
                  style={{ height: '70px', flexDirection: 'column', gap: '6px' }}
                  onClick={() => { setShowQuickActionModal(false); setActiveView('stocktake'); }}
                >
                  <ClipboardCheck size={20} color="#f59e0b" />
                  <span style={{ fontWeight: '700' }}>Physical Stocktake</span>
                </button>
              )}

              {['super_admin', 'branch_manager', 'accountant'].includes(currentUser?.role) && (
                <button
                  className="btn btn-secondary"
                  style={{ height: '70px', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}
                  onClick={() => { setShowQuickActionModal(false); setActiveView('expenses'); }}
                >
                  <Wallet size={20} color="#dc2626" />
                  <span style={{ fontWeight: '700' }}>Record Expense Voucher</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
