'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/app/_components/StatusBadge';
import ProgressRing from '@/app/_components/ProgressRing';
import { computeScore } from '@/app/_lib/scoring';
import type { Goal, Achievement } from '@/app/_lib/types';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

export default function CheckInDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [existingCi, setExistingCi] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState('Q1');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    Promise.all([
      fetch(`/api/goals`).then((r) => r.json()),
      fetch(`/api/achievements`).then((r) => r.json()),
      fetch(`/api/checkins?employeeId=${employeeId}&quarter=${quarter}`).then((r) => r.json()),
    ]).then(([gj, aj, cj]) => {
      if (gj.ok) setGoals(gj.data.filter((g: Goal) => g.employeeId === employeeId && g.status === 'approved'));
      if (aj.ok) setAchievements(aj.data.filter((a: Achievement) => goals.find((g: Goal) => g.id === a.goalId)));
      if (cj.ok && cj.data) setComment(cj.data.comment ?? '');
    }).finally(() => setLoading(false));
  }, [employeeId, quarter]);

  async function loadCheckIn(q: string) {
    const r = await fetch(`/api/checkins?employeeId=${employeeId}&quarter=${q}`);
    const j = await r.json();
    if (j.ok && j.data) { setComment(j.data.comment ?? ''); setExistingCi(j.data.id); }
    else { setComment(''); setExistingCi(''); }
  }

  useEffect(() => {
    // Reload achievements filtered for current employee
    if (goals.length === 0) return;
    const goalIds = goals.map((g) => g.id);
    fetch('/api/achievements')
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setAchievements(j.data.filter((a: Achievement) => goalIds.includes(a.goalId)));
      });
  }, [goals]);

  function getAch(goalId: string) {
    return achievements.find((a) => a.goalId === goalId && a.quarter === quarter);
  }

  async function saveCheckIn() {
    if (!comment.trim()) { setError('Comment is required.'); return; }
    setError(''); setSuccess('');
    startTransition(async () => {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, quarter, comment }),
      });
      const j = await res.json();
      if (!j.ok) { setError(j.error); return; }
      setSuccess(`Check-in for ${quarter} saved successfully.`);
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
    <div className="animate-fade-in" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Check-in: {employeeId}</h1>
          <p className="page-subtitle">Log your quarterly check-in discussion.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => router.push('/checkins')}>← Back</button>
      </div>

      {/* Quarter selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {QUARTERS.map((q) => (
          <button
            key={q}
            id={`checkin-quarter-${q}`}
            className={`btn btn-sm ${quarter === q ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setQuarter(q); setError(''); setSuccess(''); loadCheckIn(q); }}
          >
            {q}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error animate-fade-in" style={{ marginBottom: 16 }}>⚠ {error}</div>}
      {success && <div className="alert alert-success animate-fade-in" style={{ marginBottom: 16 }}>✓ {success}</div>}

      {/* Planned vs Actual table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>
            {quarter} Planned vs. Actual
          </h3>
        </div>
        {goals.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <p style={{ fontSize: '0.875rem' }}>No approved goals for this employee.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Goal</th>
                <th>UoM</th>
                <th>Target (Planned)</th>
                <th>{quarter} Actual</th>
                <th>Status</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((g) => {
                const ach = getAch(g.id);
                const score = ach ? computeScore(g, ach) : null;
                return (
                  <tr key={g.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{g.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{g.thrustArea}</div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{g.uom.replace(/_/g, ' ')}</td>
                    <td style={{ fontWeight: 600, color: '#374151' }}>{g.target}</td>
                    <td style={{ color: ach ? '#111827' : '#d1d5db', fontWeight: ach ? 600 : 400 }}>
                      {ach?.actualValue ?? '—'}
                    </td>
                    <td>
                      {ach ? (
                        <StatusBadge status={ach.status} />
                      ) : (
                        <StatusBadge status="not_started" />
                      )}
                    </td>
                    <td>
                      <ProgressRing score={score} size={40} strokeWidth={4} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Check-in comment */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: 4 }}>
          Manager Check-in Comment
        </h3>
        <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 16 }}>
          Document your discussion with the employee for {quarter}.
        </p>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <textarea
            id="checkin-comment-textarea"
            className="form-textarea"
            rows={5}
            placeholder="Summarise the discussion — progress, blockers, next steps…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
        <button
          id="save-checkin-btn"
          className="btn btn-primary"
          onClick={saveCheckIn}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <span className="spinner" style={{ width: 14, height: 14 }} />
              Saving…
            </>
          ) : (
            '✓ Save Check-in'
          )}
        </button>
      </div>
    </div>
  );
}
