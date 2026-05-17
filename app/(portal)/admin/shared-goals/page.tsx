'use client';

import { useState, useEffect, useTransition } from 'react';
import type { Goal } from '@/app/_lib/types';

export default function SharedGoalsAdminPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [weightage, setWeightage] = useState(10);

  // Employee IDs we know from the seed
  const EMPLOYEE_IDS = ['u1', 'u2'];
  const EMPLOYEE_NAMES: Record<string, string> = {
    u1: 'Priya Sharma (Sales)',
    u2: 'Rahul Verma (Operations)',
  };

  useEffect(() => {
    fetch('/api/goals')
      .then((r) => r.json())
      .then((j) => { if (j.ok) setGoals(j.data); })
      .finally(() => setLoading(false));
  }, []);

  const baseGoalOptions = goals.filter(
    (g) => g.status === 'approved' && !g.isShared,
  );

  function toggleEmployee(id: string) {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  async function pushGoal() {
    if (!selectedBase || !selectedEmployees.length) {
      setError('Select a base goal and at least one employee.');
      return;
    }
    setError(''); setSuccess('');
    startTransition(async () => {
      const res = await fetch('/api/shared-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseGoalId: selectedBase,
          employeeIds: selectedEmployees,
          weightage,
        }),
      });
      const j = await res.json();
      if (!j.ok) { setError(j.error); return; }
      setSuccess(`Shared goal pushed to ${selectedEmployees.length} employee(s).`);
      setSelectedBase('');
      setSelectedEmployees([]);
      setWeightage(10);
    });
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <span className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  const base = goals.find((g) => g.id === selectedBase);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Push Shared Goal</h1>
          <p className="page-subtitle">
            Select an approved goal and push a read-only copy to employees. Recipients can adjust
            weightage only.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>✓ {success}</div>}

      <div className="card" style={{ padding: 28 }}>
        {/* Base goal selector */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Source Goal (Approved, Non-Shared) *</label>
          {baseGoalOptions.length === 0 ? (
            <div className="alert alert-warning">
              No approved non-shared goals available as source.
            </div>
          ) : (
            <select
              id="base-goal-select"
              className="form-select"
              value={selectedBase}
              onChange={(e) => setSelectedBase(e.target.value)}
            >
              <option value="">Select source goal…</option>
              {baseGoalOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  [{g.thrustArea}] {g.title} — Target: {g.target}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Preview of selected goal */}
        {base && (
          <div
            className="animate-fade-in"
            style={{
              padding: 16,
              background: '#f5f3ff',
              border: '1px solid #ddd6fe',
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Preview — Recipients will receive this (read-only)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                ['Title', base.title],
                ['Target', base.target],
                ['UoM', base.uom.replace(/_/g, ' ')],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4c1d95' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Employee selector */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Target Employees *</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
            {EMPLOYEE_IDS.map((id) => (
              <label
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  border: `2px solid ${selectedEmployees.includes(id) ? '#6366f1' : '#e5e7eb'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: selectedEmployees.includes(id) ? '#eef2ff' : '#fff',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedEmployees.includes(id)}
                  onChange={() => toggleEmployee(id)}
                  style={{ width: 16, height: 16, accentColor: '#6366f1' }}
                />
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                  }}
                >
                  {id.toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  {EMPLOYEE_NAMES[id]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Initial weightage */}
        <div className="form-group" style={{ marginBottom: 24 }}>
          <label className="form-label">Initial Weightage (%) — Employees can adjust</label>
          <input
            id="shared-weightage-input"
            type="number"
            className="form-input"
            min={10}
            max={100}
            step={5}
            value={weightage}
            onChange={(e) => setWeightage(Number(e.target.value))}
            style={{ maxWidth: 140 }}
          />
        </div>

        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <span>ℹ</span>
          <span>
            Title and Target will be <strong>read-only</strong> for recipients. Achievement
            updates by any owner will be independent per employee.
          </span>
        </div>

        <button
          id="push-shared-goal-btn"
          className="btn btn-primary btn-lg"
          onClick={pushGoal}
          disabled={isPending}
          style={{ justifyContent: 'center', width: '100%' }}
        >
          {isPending ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16 }} />
              Pushing…
            </>
          ) : (
            '🔗 Push Shared Goal'
          )}
        </button>
      </div>
    </div>
  );
}
