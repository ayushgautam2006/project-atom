'use client';

import { useEffect, useState } from 'react';

type AuditEntry = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  diff: string;
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    fetch('/api/audit')
      .then((r) => r.json())
      .then((j) => { if (j.ok) setLogs(j.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => {
    const q = filter.toLowerCase();
    const matchText =
      !q ||
      l.action.includes(q) ||
      l.changedByName.toLowerCase().includes(q) ||
      l.entityId.includes(q);
    const matchType = !entityFilter || l.entityType === entityFilter;
    return matchText && matchType;
  });

  function formatDiff(raw: string) {
    try {
      const obj = JSON.parse(raw);
      return JSON.stringify(obj, null, 2);
    } catch {
      return raw;
    }
  }

  const ACTION_COLOR: Record<string, string> = {
    created: '#15803d',
    approved: '#1d4ed8',
    updated: '#92400e',
    returned: '#c2410c',
    shared_goal_pushed: '#7e22ce',
    deleted: '#b91c1c',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <span className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Trail</h1>
          <p className="page-subtitle">All changes made to goals and system entities — who changed what and when.</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          id="audit-search-input"
          type="text"
          className="form-input"
          style={{ maxWidth: 280 }}
          placeholder="Search by action, user, or entity ID…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select
          id="audit-entity-filter"
          className="form-select"
          style={{ maxWidth: 180 }}
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
        >
          <option value="">All Entity Types</option>
          <option value="goal">Goal</option>
          <option value="achievement">Achievement</option>
          <option value="cycle">Cycle</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#9ca3af', alignSelf: 'center' }}>
          {filtered.length} entries
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <span style={{ fontSize: '2.5rem' }}>🗂️</span>
            <p>No audit entries found.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Entity</th>
                <th>Action</th>
                <th>Changes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontSize: '0.78rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {new Date(l.changedAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td style={{ fontWeight: 600, color: '#111827' }}>{l.changedByName}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                      {l.entityType}/{l.entityId}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 10px',
                        borderRadius: 999,
                        background: `${ACTION_COLOR[l.action] ?? '#6b7280'}15`,
                        color: ACTION_COLOR[l.action] ?? '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {l.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <details style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#374151' }}>
                        View diff
                      </summary>
                      <pre
                        style={{
                          marginTop: 6,
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: 6,
                          padding: 8,
                          fontSize: '0.68rem',
                          overflow: 'auto',
                          maxWidth: 320,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {formatDiff(l.diff)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
