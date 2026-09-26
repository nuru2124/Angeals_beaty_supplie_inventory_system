import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Building2,
  Key,
  CheckCircle,
  AlertCircle,
  Lock,
  Mail,
  Phone,
  UserCheck,
  UserX,
  X,
  RefreshCw
} from 'lucide-react';

export default function UsersView({ branches }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    phone: '',
    branch_id: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/users/roles');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRoles(data);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role_id: formData.role_id,
        phone: formData.phone,
        branch_ids: formData.branch_id ? [formData.branch_id] : [],
        is_primary_branch: formData.branch_id
      };

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMsg({ type: 'success', text: 'Staff account created successfully!' });
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role_id: '', phone: '', branch_id: '' });
      fetchUsers();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'deactivated' : 'active';
    const confirmText = `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} account for ${user.name}?`;
    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMsg({ type: 'success', text: `Account for ${user.name} is now ${newStatus}.` });
      fetchUsers();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    try {
      const res = await fetch(`/api/users/${selectedUser.id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMsg({ type: 'success', text: data.message });
      setShowResetModal(false);
      setNewPassword('');
      setSelectedUser(null);
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User & Staff Management</h1>
          <p className="page-subtitle">
            Configure employee credentials, assign enterprise roles, and grant branch operational access
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={18} />
          <span>Add New Staff Account</span>
        </button>
      </div>

      {statusMsg && (
        <div style={{
          background: statusMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${statusMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: statusMsg.type === 'success' ? '#065f46' : '#991b1b',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '600'
        }}>
          {statusMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="ui-card">
        <div className="ui-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#c97a63" />
            <span className="ui-card-title">Registered Personnel ({users.length})</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchUsers}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Assigned Branches</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: u.role_name === 'super_admin' ? '#c97a63' : '#334155',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '0.85rem'
                      }}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: '#1e293b' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      u.role_name === 'super_admin' ? 'badge-primary' :
                      u.role_name === 'branch_manager' ? 'badge-info' :
                      u.role_name === 'cashier' ? 'badge-success' : 'badge-secondary'
                    }`}>
                      {u.role_display}
                    </span>
                  </td>
                  <td>
                    {u.role_name === 'super_admin' ? (
                      <span style={{ fontSize: '0.78rem', color: '#c97a63', fontWeight: '600' }}>
                        All Branches (Company-Wide HQ)
                      </span>
                    ) : u.branches && u.branches.length > 0 ? (
                      u.branches.map((b) => (
                        <span key={b.branch_id} className="badge badge-secondary" style={{ marginRight: '4px' }}>
                          {b.branch_name}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>None assigned</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                      {u.phone || '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {u.status === 'active' ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Reset Password"
                        onClick={() => {
                          setSelectedUser(u);
                          setShowResetModal(true);
                        }}
                      >
                        <Key size={14} />
                        <span>Reset Pass</span>
                      </button>

                      {u.role_name !== 'super_admin' && (
                        <button
                          className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-secondary'}`}
                          title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Staff Member */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="#c97a63" />
                <span>Create Staff Account</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Ama Serwaa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="e.g. ama.serwaa@angales.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Initial Password (min 8 chars) *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="form-input"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Role *</label>
                    <select
                      required
                      className="form-select"
                      value={formData.role_id}
                      onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                    >
                      <option value="">Select Role...</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.display_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Assigned Branch</label>
                    <select
                      className="form-select"
                      value={formData.branch_id}
                      onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    >
                      <option value="">Select Primary Branch...</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+233 24 000 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {showResetModal && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="#c97a63" />
                <span>Reset Staff Password</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setShowResetModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '14px' }}>
                  Resetting credentials for <strong>{selectedUser.name}</strong> ({selectedUser.email}).
                </p>
                <div>
                  <label className="form-label">New Password (min 8 chars) *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="form-input"
                    placeholder="Enter new strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowResetModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
