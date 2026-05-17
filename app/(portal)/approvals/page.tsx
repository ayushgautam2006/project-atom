'use client';

import { useState, useEffect, useTransition } from 'react';
import StatusBadge from '@/app/_components/StatusBadge';
import type { Goal } from '@/app/_lib/types';

type GroupedSheet = {
  employeeId: string;
  employeeName: string;
  goals: Goal[];
};

export default function ApprovalsPage() {
  const [sheets, setSheets] = useState<GroupedSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [returnNote, setReturnNote] = useState('');
  const [returning, setReturning] = useState<string | null>(null); // goalId

  async function loadApprovals() {
    const [goalsRes, usersRes] = await Promise.all([
      fetch('/api/approvals').then((r) => r.json()),
      fetch('/api/goals').then((r) => r.json()),
    ]);
    // Group by employee
    const goals: Goal[] = goalsRes.ok ? goalsRes.data : [];
    const byEmp: Record<string, Goal[]> = {};
    for (const g of goals) {
      if (!byEmp[g.employeeId]) byEmp[g.employeeId] = [];
      byEmp[g.employeeId].push(g);
    }
    // Fetch names from separate goals endpoint (manager sees all team goals)
    const allGoals: Goal[] = usersRes.ok ? usersRes.data : [];
    const nameMap: Record<string, string> = {};
    // We need user names — derive from a quick auth check
    const sessionRes = await fetch('/api/auth').then((r) => r.json());
    const session = sessionRes.ok ? sessionRes.data : null;

    const grouped: GroupedSheet[] = Object.entries(byEmp).map(([empId, gs]) => ({
      employeeId: empId,
      employeeName: `Employee ${empId}`, // Will be enriched below
      goals: gs,
    }));
    setSheets(grouped);
    setLoading(false);
  }

  useEffect(() => { loadApprovals(); }, []);

  // Enrich names via a separate fetch (manager's team endpoint doesn't exist standalone)
  useEffect(() => {
    fetch('/api/goals')
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) return;
        // Can't get names from this. We'll use report endpoint for enrichment.
      });
  }, []);

  async function approveSheet(employeeId: string) {
    setError(''); setSuccess('');
    startTransition(async () => {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', employeeId }),
      });
      const j = await res.json();
      if (!j.ok) { setError(j.error); return; }
      setSuccess('Goal sheet approved and locked successfully.');
      setSheets((prev) => prev.filter((s) => s.employeeId !== employeeId));
    });
  }

  async function returnGoal(goalId: string, note: string) {
    if (!note.trim()) { setError('Return note is required.'); return; }
    setError(''); setSuccess('');
    startTransition(async () => {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'return', goalId, returnNote: note }),
      });
      const j = await res.json();
      if (!j.ok) { setError(j.error); return; }
      setSuccess('Goal returned for rework.');
      setReturning(null);
      setReturnNote('');
      await loadApprovals();
    });
  }

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
          <h1 className="page-title">Goal Approvals</h1>
          <p className="page-subtitle">Review and approve submitted goal sheets from your team.</p>
        </div>
        <div
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: sheets.length > 0 ? '#fff7ed' : '#f0fdf4',
            color: sheets.length > 0 ? '#c2410c' : '#15803d',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          {sheets.length} pending
        </div>
      </div>

      {error && <div className="alert alert-error animate-fade-in" style={{ marginBottom: 16 }}>⚠ {error}</div>}
      {success && <div className="alert alert-success animate-fade-in" style={{ marginBottom: 16 }}>✓ {success}</div>}

      {sheets.length === 0 ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <span style={{ fontSize: '3rem' }}>✅</span>
          <h3 style={{ fontWeight: 700, color: '#374151' }}>All caught up!</h3>
          <p>No goal sheets pending your approval.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sheets.map((sheet) => {
            const total = sheet.goals.reduce((s, g) => s + g.weightage, 0);
            const isExpanded = expanded === sheet.employeeId;
            return (
              <div key={sheet.employeeId} className="card animate-fade-in">
                {/* Sheet header */}
                <div
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    cursor: 'pointer',
                    borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                  }}
                  onClick={() => setExpanded(isExpanded ? null : sheet.employeeId)}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      flexShrink: 0,
                    }}
                  >
                    {sheet.employeeId.toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#111827' }}>
                      Employee ID: {sheet.employeeId}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                      {sheet.goals.length} goals · Total weightage:{' '}
                      <span style={{ fontWeight: 700, color: total === 100 ? '#15803d' : '#b91c1c' }}>
                        {total}%
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      id={`approve-all-${sheet.employeeId}`}
                      className="btn btn-primary btn-sm"
                      disabled={isPending || Math.round(total) !== 100}
                      onClick={(e) => { e.stopPropagation(); approveSheet(sheet.employeeId); }}
                      title={Math.round(total) !== 100 ? 'Total weightage must equal 100%' : undefined}
                    >
                      ✓ Approve All
                    </button>
                  </div>
                  <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>

                {/* Expanded goals table */}
                {isExpanded && (
                  <div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Goal Title</th>
                          <th>Thrust Area</th>
                          <th>UoM</th>
                          <th>Target</th>
                          <th>Weightage</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.goals.map((g) => (
                          <tr key={g.id}>
                            <td style={{ fontWeight: 600, color: '#111827' }}>
                              {g.title}
                              {g.isShared && (
                                <span className="badge badge-shared" style={{ marginLeft: 8 }}>
                                  Shared
                                </span>
                              )}
                            </td>
                            <td style={{ color: '#6b7280' }}>{g.thrustArea}</td>
                            <td style={{ color: '#6b7280', fontSize: '0.78rem' }}>{g.uom.replace('_', ' ')}</td>
                            <td>{g.target}</td>
                            <td style={{ fontWeight: 700, color: '#4f46e5' }}>{g.weightage}%</td>
                            <td>
                              {returning === g.id ? (
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    style={{ padding: '4px 8px', fontSize: '0.78rem', width: 180 }}
                                    placeholder="Return note…"
                                    value={returnNote}
                                    onChange={(e) => setReturnNote(e.target.value)}
                                    autoFocus
                                  />
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => returnGoal(g.id, returnNote)}
                                    disabled={isPending}
                                  >
                                    Send
                                  </button>
                                  <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => { setReturning(null); setReturnNote(''); }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => setReturning(g.id)}
                                >
                                  ↩ Return
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {Math.round(total) !== 100 && (
                      <div className="alert alert-error" style={{ margin: '12px 16px' }}>
                        ⚠ Cannot approve — total weightage is {total}% (must be 100%).
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
