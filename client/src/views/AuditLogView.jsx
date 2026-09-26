import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  User,
  Clock,
  Building
} from 'lucide-react';

export default function AuditLogView({ activeBranch }) {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [activeBranch, moduleFilter, search]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = `/api/audit-logs?limit=100&`;
      if (activeBranch) url += `branch_id=${activeBranch}&`;
      if (moduleFilter) url += `module=${moduleFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Immutable Audit Trail Logs</h1>
          <p className="page-subtitle">
            System-wide security ledger recording user actions, pricing modifications, transfer approvals, and sales transactions
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="ui-card" style={{ marginBottom: '16px' }}>
        <div className="ui-card-body" style={{ padding: '12px 18px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '11px' }} />
            <input
              type="text"
              placeholder="Search by action, user, or record ID..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['', 'sales', 'inventory', 'transfers', 'products', 'branches', 'settings', 'auth'].map(m => (
              <button
                key={m}
                className={`filter-tab ${moduleFilter === m ? 'active' : ''}`}
                onClick={() => setModuleFilter(m)}
                style={{ textTransform: 'capitalize' }}
              >
                {m ? m : 'All Modules'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="ui-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor / User</th>
                <th>Module</th>
                <th>Action Performed</th>
                <th>Record Reference</th>
                <th>Details / Payload</th>
                <th>Branch</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Loading audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No audit logs matching query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('en-GB')}
                    </td>
                    <td>
                      <strong>{log.user_name || 'System'}</strong>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>
                        {log.module}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-purple">
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <code>{log.record_id || '—'}</code>
                    </td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.75rem', color: '#475569' }}>
                      {log.new_value ? log.new_value : (log.previous_value || '—')}
                    </td>
                    <td>{log.branch_name || 'Global HQ'}</td>
                    <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
