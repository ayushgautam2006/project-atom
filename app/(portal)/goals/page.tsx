'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/app/_components/StatusBadge';
import WeightageBar from '@/app/_components/WeightageBar';
import type { Goal } from '@/app/_lib/types';

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, startTransition] = useTransition();

  useEffect(() => {
    fetch('/api/goals')
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setGoals(j.data);
        else setError(j.error);
      })
      .finally(() => setLoading(false));
  }, []);

  const total = goals.reduce((s, g) => s + g.weightage, 0);
  const canSubmit =
    goals.some((g) => g.status === 'draft' || g.status === 'returned') &&
    Math.round(total) === 100 &&
    goals.every((g) => g.weightage >= 10) &&
    goals.length <= 8;

  async function handleSubmit() {
    const drafts = goals.filter((g) => g.status === 'draft' || g.status === 'returned');
    setError('');
    startTransition(async () => {
      for (const g of drafts) {
        const res = await fetch(`/api/goals/${g.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'submitted' }),
        });
        const j = await res.json();
        if (!j.ok) { setError(j.error); return; }
      }
      router.refresh();
      const r = await fetch('/api/goals');
      const j = await r.json();
      if (j.ok) setGoals(j.data);
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this draft goal?')) return;
    const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    const j = await res.json();
    if (j.ok) setGoals((prev) => prev.filter((g) => g.id !== id));
    else setError(j.error);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <span className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  const draftGoals = goals.filter((g) => ['draft', 'returned'].includes(g.status));
  const lockedGoals = goals.filter((g) => ['submitted', 'approved'].includes(g.status));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Goals</h1>
          <p className="page-subtitle">Create, manage, and submit your goal sheet for this cycle.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {goals.length < 8 && (
            <button
              id="new-goal-btn"
              className="btn btn-secondary"
              onClick={() => router.push('/goals/new')}
            >
              + Add Goal
            </button>
          )}
          {draftGoals.length > 0 && (
            <button
              id="submit-goals-btn"
              className="btn btn-primary"
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
              title={!canSubmit ? 'Total weightage must equal 100% and all goals ≥ 10%' : undefined}
            >
              {submitting ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  Submitting…
                </>
              ) : (
                'Submit for Approval'
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error animate-fade-in" style={{ marginBottom: 20 }}>
          ⚠ {error}
        </div>
      )}

      {/* Weightage bar */}
      {goals.length > 0 && (
        <div className="card" style={{ padding: '18px 24px', marginBottom: 24 }}>
          <WeightageBar
            goals={goals.map((g) => ({ title: g.title, weightage: g.weightage }))}
            total={total}
          />
        </div>
      )}

      {goals.length === 0 ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <span style={{ fontSize: '3rem' }}>🎯</span>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151' }}>No goals yet</h3>
          <p style={{ fontSize: '0.875rem' }}>
            Click <strong>Add Goal</strong> to create your first goal.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/goals/new')}>
            + Add Goal
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Returned / Draft goals */}
          {draftGoals.length > 0 && (
            <div>
              <h2 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Draft / Returned
              </h2>
              {draftGoals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onDelete={() => handleDelete(g.id)}
                  onEdit={() => router.push(`/goals/${g.id}`)}
                />
              ))}
            </div>
          )}

          {lockedGoals.length > 0 && (
            <div>
              <h2 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, marginTop: 20 }}>
                Submitted / Approved
              </h2>
              {lockedGoals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onView={() => router.push(`/goals/${g.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Limits info */}
      {goals.length > 0 && (
        <div style={{ marginTop: 20, fontSize: '0.75rem', color: '#9ca3af', textAlign: 'right' }}>
          {goals.length}/8 goals used · Min 10% per goal · Total must be 100%
        </div>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onView,
}: {
  goal: Goal;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}) {
  return (
    <div
      className="card animate-fade-in"
      style={{ padding: '16px 20px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 16 }}
    >
      {/* Weightage bubble */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #ede9fe, #c7d2fe)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontWeight: 800,
          fontSize: '1rem',
          color: '#4338ca',
        }}
      >
        {goal.weightage}%
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{goal.title}</h3>
          <StatusBadge status={goal.isLocked ? 'locked' : goal.status} />
          {goal.isShared && <StatusBadge status="shared" />}
        </div>
        <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 6 }}>
          {goal.description}
        </p>
        <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: '#9ca3af' }}>
          <span>📌 {goal.thrustArea}</span>
          <span>📏 {goal.uom.replace('_', ' ')}</span>
          <span>🎯 Target: {goal.target}</span>
        </div>
        {goal.returnNote && (
          <div className="alert alert-warning" style={{ marginTop: 10, padding: '8px 12px' }}>
            <span>↩</span>
            <span>{goal.returnNote}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {onEdit && (
          <button className="btn btn-sm btn-secondary" onClick={onEdit}>
            Edit
          </button>
        )}
        {onDelete && (
          <button className="btn btn-sm btn-danger" onClick={onDelete}>
            Delete
          </button>
        )}
        {onView && (
          <button className="btn btn-sm btn-ghost" onClick={onView}>
            View →
          </button>
        )}
      </div>
    </div>
  );
}
