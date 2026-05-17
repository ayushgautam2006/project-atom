'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StatusBadge from '@/app/_components/StatusBadge';
import ProgressRing from '@/app/_components/ProgressRing';
import { uomLabel } from '@/app/_lib/scoring';
import type { Goal, Achievement } from '@/app/_lib/types';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

export default function GoalDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  // Achievement form state
  const [activeQ, setActiveQ] = useState<string>('Q1');
  const [actualValue, setActualValue] = useState('');
  const [achStatus, setAchStatus] = useState('on_track');

  useEffect(() => {
    Promise.all([
      fetch(`/api/goals/${id}`).then((r) => r.json()),
      fetch(`/api/achievements?goalId=${id}`).then((r) => r.json()),
    ]).then(([gj, aj]) => {
      if (gj.ok) setGoal(gj.data);
      else setError(gj.error);
      if (aj.ok) setAchievements(aj.data);
    }).finally(() => setLoading(false));
  }, [id]);

  function getAch(q: string) {
    return achievements.find((a) => a.quarter === q);
  }

  function selectQ(q: string) {
    setActiveQ(q);
    const existing = getAch(q);
    setActualValue(existing?.actualValue ?? '');
    setAchStatus(existing?.status ?? 'on_track');
    setError('');
  }

  async function saveAchievement() {
    if (!actualValue.trim()) { setError('Please enter the actual value.'); return; }
    setError('');
    startTransition(async () => {
      const res = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: id,
          quarter: activeQ,
          actualValue,
          status: achStatus,
        }),
      });
      const j = await res.json();
      if (!j.ok) { setError(j.error); return; }
      setAchievements((prev) => {
        const idx = prev.findIndex((a) => a.quarter === activeQ);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = j.data;
          return copy;
        }
        return [...prev, j.data];
      });
    });
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <span className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="empty-state">
        <span style={{ fontSize: '2rem' }}>❌</span>
        <p>Goal not found or access denied.</p>
        <button className="btn btn-secondary" onClick={() => router.push('/goals')}>← Back</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 780, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{goal.title}</h1>
          <p className="page-subtitle">{goal.thrustArea}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <StatusBadge status={goal.isLocked ? 'locked' : goal.status} />
          {goal.isShared && <StatusBadge status="shared" />}
          <button className="btn btn-ghost" onClick={() => router.push('/goals')}>← Back</button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error animate-fade-in" style={{ marginBottom: 16 }}>⚠ {error}</div>
      )}

      {/* Goal Details */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: 16 }}>
          Goal Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            ['UoM', uomLabel(goal.uom)],
            ['Target', goal.uom === 'zero' ? '0 (Zero = Success)' : goal.target],
            ['Weightage', `${goal.weightage}%`],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {k}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>{v}</div>
            </div>
          ))}
        </div>
        {goal.description && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Description
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151' }}>{goal.description}</p>
          </div>
        )}
        {goal.returnNote && (
          <div className="alert alert-warning" style={{ marginTop: 16 }}>
            <span>↩</span>
            <div>
              <strong>Return Note:</strong> {goal.returnNote}
            </div>
          </div>
        )}
      </div>

      {/* Achievement section — only for locked (approved) goals */}
      {goal.isLocked && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: 16 }}>
            Quarterly Achievements
          </h3>

          {/* Quarter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 0 }}>
            {QUARTERS.map((q) => {
              const ach = getAch(q);
              return (
                <button
                  key={q}
                  id={`tab-${q}`}
                  onClick={() => selectQ(q)}
                  style={{
                    padding: '8px 20px',
                    border: 'none',
                    background: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    color: activeQ === q ? '#4f46e5' : '#6b7280',
                    borderBottom: activeQ === q ? '2px solid #4f46e5' : '2px solid transparent',
                    marginBottom: -1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  {q}
                  {ach && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: ach.status === 'completed' ? '#10b981' : '#f59e0b',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Achievement form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">
                  {goal.uom === 'timeline' ? 'Completion Date' : 'Actual Value'} ({activeQ})
                </label>
                <input
                  id="actual-value-input"
                  type={goal.uom === 'timeline' ? 'date' : 'text'}
                  className="form-input"
                  placeholder={goal.uom === 'zero' ? '0 or any number' : 'Enter actual value'}
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  id="ach-status-select"
                  className="form-select"
                  value={achStatus}
                  onChange={(e) => setAchStatus(e.target.value)}
                >
                  <option value="not_started">Not Started</option>
                  <option value="on_track">On Track</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <button
                id="save-achievement-btn"
                className="btn btn-primary"
                onClick={saveAchievement}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                    Saving…
                  </>
                ) : (
                  '✓ Save Achievement'
                )}
              </button>
            </div>

            {/* Score display */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              {getAch(activeQ) ? (
                <>
                  <ProgressRing
                    score={getAch(activeQ)!.score}
                    size={120}
                    label={`${activeQ} Score`}
                  />
                  <div style={{ textAlign: 'center' }}>
                    <StatusBadge status={getAch(activeQ)!.status as any} />
                    <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 6 }}>
                      Target: {goal.target} · Actual: {getAch(activeQ)!.actualValue}
                    </p>
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ padding: 24 }}>
                  <span style={{ fontSize: '2rem' }}>📈</span>
                  <p style={{ fontSize: '0.8rem' }}>No achievement logged for {activeQ}</p>
                </div>
              )}
            </div>
          </div>

          {/* All quarters summary */}
          {achievements.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                {QUARTERS.map((q) => {
                  const ach = getAch(q);
                  return (
                    <div
                      key={q}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: 12,
                        borderRadius: 8,
                        background: ach ? '#f9fafb' : '#fff',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', marginBottom: 6 }}>{q}</div>
                      <ProgressRing score={ach?.score ?? null} size={48} strokeWidth={5} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!goal.isLocked && (
        <div className="alert alert-info" style={{ marginTop: 16 }}>
          <span>ℹ</span>
          <span>
            Achievement tracking is available only for <strong>approved</strong> goals.
          </span>
        </div>
      )}
    </div>
  );
}
