'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/app/_components/StatusBadge';
import ProgressRing from '@/app/_components/ProgressRing';
import { computeScore } from '@/app/_lib/scoring';
import type { Goal, Achievement } from '@/app/_lib/types';

type TeamMember = { id: string; name: string; department: string };

export default function TeamPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState('Q1');

  useEffect(() => {
    Promise.all([
      fetch('/api/goals').then((r) => r.json()),
      fetch('/api/achievements').then((r) => r.json()),
    ]).then(([gj, aj]) => {
      if (gj.ok) setGoals(gj.data);
      if (aj.ok) setAchievements(aj.data);
    }).finally(() => setLoading(false));
  }, []);

  // Group by employee
  const empIds = [...new Set(goals.map((g) => g.employeeId))];

  function getScore(g: Goal) {
    const ach = achievements.find((a) => a.goalId === g.id && a.quarter === quarter);
    return ach ? computeScore(g, ach) : null;
  }

  function getAch(g: Goal) {
    return achievements.find((a) => a.goalId === g.id && a.quarter === quarter);
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
          <h1 className="page-title">Team Goals</h1>
          <p className="page-subtitle">Track your team's progress across all goals.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
            <button
              key={q}
              id={`quarter-filter-${q}`}
              className={`btn btn-sm ${quarter === q ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setQuarter(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {empIds.length === 0 ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <span style={{ fontSize: '3rem' }}>👥</span>
          <h3 style={{ fontWeight: 700 }}>No team goals yet</h3>
          <p>Approved goals will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {empIds.map((empId) => {
            const empGoals = goals.filter((g) => g.employeeId === empId && g.status === 'approved');
            if (empGoals.length === 0) return null;
            return (
              <div key={empId} className="card">
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                    }}
                  >
                    {empId.toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#111827' }}>Employee: {empId}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {empGoals.length} approved goals
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-secondary"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => router.push(`/checkins/${empId}`)}
                  >
                    Log Check-in →
                  </button>
                </div>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Goal</th>
                      <th>Target</th>
                      <th>{quarter} Actual</th>
                      <th>Status</th>
                      <th>{quarter} Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empGoals.map((g) => {
                      const ach = getAch(g);
                      const score = getScore(g);
                      return (
                        <tr key={g.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                              {g.title}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{g.thrustArea}</div>
                          </td>
                          <td style={{ color: '#374151' }}>{g.target}</td>
                          <td style={{ color: ach ? '#111827' : '#d1d5db' }}>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
