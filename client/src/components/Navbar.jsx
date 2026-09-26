import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bell,
  PlusCircle,
  AlertTriangle,
  Package,
  ArrowRightLeft,
  ShieldCheck,
  LogOut
} from 'lucide-react';

export default function Navbar({
  branches,
  activeBranch,
  setActiveBranch,
  currentUser,
  onOpenQuickAction,
  onLogout
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  // Filter available branches by user's assigned branches (Super Admin has all)
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const userBranchIds = (currentUser?.branches || []).map((b) => Number(b.id || b.branch_id));

  const availableBranches = isSuperAdmin
    ? branches
    : branches.filter((b) => userBranchIds.includes(Number(b.id)));

  const fetchNotifications = async () => {
    try {
      const url = activeBranch
        ? `/api/notifications?branch_id=${activeBranch}`
        : '/api/notifications';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [activeBranch]);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="top-navbar">
      {/* Left: Branch Selector */}
      <div className="nav-left-group">
        <div className="branch-select-badge" title="Filter system data by active branch">
          <Building2 size={18} color="#c97a63" />
          <select
            className="branch-select"
            value={activeBranch || ''}
            onChange={(e) => setActiveBranch(e.target.value ? Number(e.target.value) : null)}
          >
            {isSuperAdmin && (
              <option value="">All Branches (Headquarters HQ)</option>
            )}
            {availableBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Global Quick Actions Dropdown */}
        {['super_admin', 'branch_manager', 'inventory_officer', 'cashier'].includes(currentUser?.role) && (
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onOpenQuickAction()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={15} color="#c97a63" />
              <span>Quick Actions</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Security Badge, Notifications & User Profile */}
      <div className="nav-actions">
        {/* Active Role Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            fontSize: '0.76rem',
            color: '#475569',
            fontWeight: '600'
          }}
        >
          <ShieldCheck size={14} color="#c97a63" />
          <span>{currentUser?.roleDisplay || 'Authenticated Staff'}</span>
        </div>

        {/* Notifications Icon with Badge */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ position: 'relative', padding: '8px 10px', borderRadius: '50%' }}
            onClick={() => setShowNotifDrawer(!showNotifDrawer)}
            title="Notifications"
          >
            <Bell size={18} color="#334155" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: '700',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifDrawer && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '360px',
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                zIndex: 100,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={16} color="#c97a63" />
                  <span style={{ fontWeight: '700', fontSize: '0.92rem' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="badge badge-danger">{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{ fontSize: '0.75rem', color: '#c97a63', fontWeight: '600' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '6px 0' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markSingleRead(n.id)}
                      style={{
                        padding: '12px 18px',
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: n.is_read ? '#ffffff' : '#fefbfb',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                      }}
                    >
                      <div style={{ marginTop: '2px' }}>
                        {n.type === 'low_stock' && <AlertTriangle size={17} color="#f59e0b" />}
                        {n.type === 'expiry_warning' && <AlertTriangle size={17} color="#ef4444" />}
                        {n.type === 'transfer' && <ArrowRightLeft size={17} color="#8b5cf6" />}
                        {n.type === 'purchase_order' && <Package size={17} color="#10b981" />}
                        {!['low_stock', 'expiry_warning', 'transfer', 'purchase_order'].includes(n.type) && (
                          <Bell size={17} color="#64748b" />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#1e293b' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {n.branch_name && ` • ${n.branch_name}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge & Quick Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#c97a63',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.88rem'
            }}
          >
            {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#1e293b', lineHeight: 1.2 }}>
              {currentUser?.name || 'Staff'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {currentUser?.roleDisplay || 'Active Session'}
            </span>
          </div>

          <button
            onClick={onLogout}
            title="Sign Out"
            style={{
              marginLeft: '8px',
              padding: '6px 8px',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
