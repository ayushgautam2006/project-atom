import { getSession } from '@/app/_lib/auth';
import {
  getGoalsByEmployee,
  getGoalsByManager,
  getAllGoals,
  getTeamOf,
  getAllUsers,
  getCheckInsByManager,
  getAchievementsByGoal,
} from '@/app/_lib/store';
import ProgressRing from '@/app/_components/ProgressRing';
import { computeScore } from '@/app/_lib/scoring';

export const dynamic = 'force-dynamic';

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="stat-icon" style={{ background: `${color}15` }}>
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  // ── Employee dashboard ───────────────────────────────────────────────────────
  if (session.role === 'employee') {
    const goals = getGoalsByEmployee(session.userId);
    const approved = goals.filter((g) => g.approved || g.status === 'approved');
    const draft = goals.filter((g) => g.status === 'draft');
    const submitted = goals.filter((g) => g.status === 'submitted');
    const returned = goals.filter((g) => g.status === 'returned');
    const total = goals.reduce((s, g) => s + g.weightage, 0);

    // Compute scores for Q1
    const scorePairs = goals
      .filter((g) => g.status === 'approved')
      .flatMap((g) => {
        const achs = getAchievementsByGoal(g.id);
        return achs.map((a) => ({ goal: g, ach: a }));
      });

    const avgScore =
      scorePairs.length > 0
        ? scorePairs.reduce((s, { goal, ach }) => {
            const sc = computeScore(goal, ach);
            return s + (sc ?? 0) * goal.weightage;
          }, 0) /
          goals.filter((g) => g.status === 'approved').reduce((s, g) => s + g.weightage, 0)
        : null;

    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Good to see you, {session.name.split(' ')[0]}! 👋</h1>
            <p className="page-subtitle">Here's your goal progress at a glance.</p>
          </div>
        </div>

        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <StatCard icon="🎯" value={goals.length} label="Total Goals" color="#6366f1" />
          <StatCard icon="✅" value={approved.length} label="Approved" color="#10b981" />
          <StatCard icon="⏳" value={submitted.length} label="Pending Approval" color="#f59e0b" />
          <StatCard icon="📝" value={draft.length} label="Drafts" color="#6b7280" />
          {returned.length > 0 && (
            <StatCard icon="↩️" value={returned.length} label="Returned" color="#ef4444" />
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Weightage summary */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: 16 }}>
              Weightage Overview
            </h3>
            {goals.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <span style={{ fontSize: '2rem' }}>📋</span>
                <p>No goals created yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {goals.map((g) => (
                  <div key={g.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>
                        {g.title.length > 30 ? g.title.slice(0, 28) + '…' : g.title}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6366f1' }}>
                        {g.weightage}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${g.weightage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 12,
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>Total</span>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: total === 100 ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {total}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: 16 }}>
              Q1 Progress
            </h3>
            {scorePairs.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <span style={{ fontSize: '2rem' }}>📈</span>
                <p style={{ fontSize: '0.85rem' }}>No achievements logged yet</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <ProgressRing score={avgScore} size={110} label="Weighted Avg" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {scorePairs.map(({ goal, ach }) => {
                    const sc = computeScore(goal, ach);
                    return (
                      <div
                        key={ach.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                      >
                        <ProgressRing score={sc} size={36} strokeWidth={4} />
                        <span style={{ fontSize: '0.78rem', color: '#374151' }}>
                          {goal.title.length > 28 ? goal.title.slice(0, 26) + '…' : goal.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Manager dashboard ────────────────────────────────────────────────────────
  if (session.role === 'manager') {
    const team = getTeamOf(session.userId);
    const teamGoals = getGoalsByManager(session.userId);
    const pending = teamGoals.filter((g) => g.status === 'submitted');
    const approved = teamGoals.filter((g) => g.status === 'approved');
    const checkIns = getCheckInsByManager(session.userId);

    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Manager Dashboard</h1>
            <p className="page-subtitle">Overview of your team's goal activity.</p>
          </div>
          <a href="/approvals" className="btn btn-primary">
            Review Approvals {pending.length > 0 && `(${pending.length})`}
          </a>
        </div>

        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <StatCard icon="👥" value={team.length} label="Team Members" color="#6366f1" />
          <StatCard icon="⏳" value={pending.length} label="Pending Approval" color="#f59e0b" />
          <StatCard icon="✅" value={approved.length} label="Approved Goals" color="#10b981" />
          <StatCard icon="📋" value={checkIns.length} label="Check-ins Done" color="#3b82f6" />
        </div>

        {/* Team list */}
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Your Team</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Goal Count</th>
                <th>Approval Status</th>
                <th>Q1 Check-in</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => {
                const mg = teamGoals.filter((g) => g.employeeId === member.id);
                const hasPending = mg.some((g) => g.status === 'submitted');
                const allApproved = mg.length > 0 && mg.every((g) => g.status === 'approved');
                const ci = checkIns.find(
                  (c) => c.employeeId === member.id && c.quarter === 'Q1',
                );
                return (
                  <tr key={member.id}>
                    <td style={{ fontWeight: 600, color: '#111827' }}>{member.name}</td>
                    <td style={{ color: '#6b7280' }}>{member.department}</td>
                    <td>{mg.length}</td>
                    <td>
                      {hasPending ? (
                        <span className="badge badge-submitted">Needs Review</span>
                      ) : allApproved ? (
                        <span className="badge badge-approved">All Approved</span>
                      ) : (
                        <span className="badge badge-draft">Not Submitted</span>
                      )}
                    </td>
                    <td>
                      {ci ? (
                        <span className="badge badge-completed">Done</span>
                      ) : (
                        <a href={`/checkins/${member.id}`} className="btn btn-sm btn-secondary">
                          Log Check-in
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Admin dashboard ──────────────────────────────────────────────────────────
  const allGoals = getAllGoals();
  const allUsers = getAllUsers();
  const employees = allUsers.filter((u) => u.role === 'employee');
  const approved = allGoals.filter((g) => g.status === 'approved');
  const submitted = allGoals.filter((g) => g.status === 'submitted');

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Organisation-wide goal & performance overview.</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <StatCard icon="👤" value={employees.length} label="Employees" color="#6366f1" />
        <StatCard icon="🎯" value={allGoals.length} label="Total Goals" color="#8b5cf6" />
        <StatCard icon="✅" value={approved.length} label="Approved" color="#10b981" />
        <StatCard icon="⏳" value={submitted.length} label="Pending Approval" color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Goal Status Breakdown</h3>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(['draft', 'submitted', 'approved', 'returned'] as const).map((s) => {
              const count = allGoals.filter((g) => g.status === s).length;
              const pct = allGoals.length ? Math.round((count / allGoals.length) * 100) : 0;
              const colors: Record<string, string> = {
                draft: '#6b7280',
                submitted: '#3b82f6',
                approved: '#10b981',
                returned: '#ef4444',
              };
              return (
                <div key={s}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize', color: '#374151' }}>
                      {s}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#e5e7eb', borderRadius: 999 }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: colors[s],
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Quick Actions</h3>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '📅', label: 'Manage Cycles', href: '/admin/cycles' },
              { icon: '🔗', label: 'Push Shared Goal', href: '/admin/shared-goals' },
              { icon: '🗂️', label: 'View Audit Trail', href: '/admin/audit' },
              { icon: '📊', label: 'Download Reports', href: '/admin/reports' },
            ].map((a) => (
              <a
                key={a.href}
                href={a.href}
                className="nav-link"
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  color: '#374151',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
              >
                <span>{a.icon}</span>
                {a.label}
                <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
