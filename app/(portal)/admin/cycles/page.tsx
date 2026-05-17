'use client';

import { useState, useEffect, useTransition } from 'react';
import type { Cycle, CyclePhase } from '@/app/_lib/types';

const PHASE_LABELS: Record<CyclePhase, string> = {
  goal_setting: '📋 Goal Setting',
  q1_checkin: '📊 Q1 Check-in',
  q2_checkin: '📊 Q2 Check-in',
  q3_checkin: '📊 Q3 Check-in',
  q4_annual: '🏆 Q4 Annual Review',
};

export default function CyclesAdminPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  // New cycle form
  const [name, setName] = useState('');
  const [phase, setPhase] = useState<CyclePhase>('goal_setting');
  const [openDate, setOpenDate] = useState('');
  const [closeDate, setCloseDate] = useState('');

  async function loadCycles() {
    const r = await fetch('/api/cycles');
    const j = await r.json();
    if (j.ok) setCycles(j.data);
    setLoading(false);
  }

  useEffect(() => { loadCycles(); }, []);

  async function toggleActive(cycle: Cycle) {
    const res = await fetch('/api/cycles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cycle.id, isActive: !cycle.isActive }),
    });
    const j = await res.json();
    if (j.ok) setCycles((prev) => prev.map((c) => (c.id === cycle.id ? j.data : c)));
    else setError(j.error);
  }

  async function createCycle() {
    if (!name || !openDate || !closeDate) { setError('All fields required.'); return; }
    setError(''); setSuccess('');
    startTransition(async () => {
      const res = await fetch('/api/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phase, openDate, closeDate, isActive: false }),
      });
      const j = await res.json();
      if (!j.ok) { setError(j.error); return; }
      setCycles((prev) => [...prev, j.data]);
      setSuccess('Cycle created successfully.');
      setShowForm(false);
      setName(''); setOpenDate(''); setCloseDate('');
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
          <h1 className="page-title">Cycle Management</h1>
          <p className="page-subtitle">Configure performance cycle windows and activation status.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ New Cycle'}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✓ {success}</div>}

      {/* New cycle form */}
      {showForm && (
        <div className="card animate-fade-in" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#111827' }}>Create New Cycle</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Cycle Name</label>
              <input id="cycle-name-input" type="text" className="form-input" placeholder="e.g. FY 2026-27 Goal Setting" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phase</label>
              <select id="cycle-phase-select" className="form-select" value={phase} onChange={(e) => setPhase(e.target.value as CyclePhase)}>
                {Object.entries(PHASE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div />
            <div className="form-group">
              <label className="form-label">Open Date</label>
              <input id="cycle-open-input" type="date" className="form-input" value={openDate} onChange={(e) => setOpenDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Close Date</label>
              <input id="cycle-close-input" type="date" className="form-input" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button id="create-cycle-btn" className="btn btn-primary" onClick={createCycle} disabled={isPending}>
              {isPending ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Creating…</> : '✓ Create Cycle'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Cycles timeline */}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cycle Name</th>
              <th>Phase</th>
              <th>Opens</th>
              <th>Closes</th>
              <th>Status</th>
              <th>Toggle</th>
            </tr>
          </thead>
          <tbody>
            {cycles.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600, color: '#111827' }}>{c.name}</td>
                <td style={{ color: '#6b7280' }}>{PHASE_LABELS[c.phase] ?? c.phase}</td>
                <td>{c.openDate}</td>
                <td>{c.closeDate}</td>
                <td>
                  {c.isActive ? (
                    <span className="badge badge-approved">Active</span>
                  ) : (
                    <span className="badge badge-draft">Inactive</span>
                  )}
                </td>
                <td>
                  <button
                    id={`toggle-cycle-${c.id}`}
                    className={`btn btn-sm ${c.isActive ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => toggleActive(c)}
                  >
                    {c.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
