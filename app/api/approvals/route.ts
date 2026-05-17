import { getSession } from '@/app/_lib/auth';
import {
  getGoalsByEmployee,
  getGoalsByManager,
  getGoalById,
  upsertGoal,
  addAuditLog,
  nextId,
  validateGoalSheet,
} from '@/app/_lib/store';

/**
 * GET  — returns all submitted goal sheets pending approval (manager view)
 * POST — approve or return a single goal sheet
 */
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  if (session.role !== 'manager' && session.role !== 'admin')
    return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });

  const goals =
    session.role === 'manager'
      ? getGoalsByManager(session.userId).filter((g) => g.status === 'submitted')
      : // Admin sees all submitted
        (await import('@/app/_lib/store')).getAllGoals().filter((g) => g.status === 'submitted');

  return Response.json({ ok: true, data: goals });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  if (session.role !== 'manager' && session.role !== 'admin')
    return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    action,
    employeeId,
    goalId,
    returnNote,
    weightage,
  }: {
    action?: 'approve' | 'return';
    employeeId?: string;
    goalId?: string;
    returnNote?: string;
    weightage?: number;
  } = body;

  if (!action || (!goalId && !employeeId)) {
    return Response.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Single goal action
  if (goalId) {
    const goal = getGoalById(goalId);
    if (!goal) return Response.json({ ok: false, error: 'Goal not found.' }, { status: 404 });
    if (goal.status !== 'submitted')
      return Response.json({ ok: false, error: 'Goal is not in submitted state.' }, { status: 400 });

    const updated = {
      ...goal,
      weightage: weightage !== undefined ? Number(weightage) : goal.weightage,
      status: action === 'approve' ? ('approved' as const) : ('returned' as const),
      isLocked: action === 'approve',
      returnNote: action === 'return' ? (returnNote ?? null) : null,
      updatedAt: now,
    };

    if (action === 'approve') {
      // Validate the whole employee's sheet before locking
      const allGoals = getGoalsByEmployee(goal.employeeId).map((g) =>
        g.id === goalId ? updated : g,
      );
      const err = validateGoalSheet(goal.employeeId, allGoals);
      if (err) return Response.json({ ok: false, error: err }, { status: 400 });
    }

    upsertGoal(updated);
    addAuditLog({
      id: nextId('audit'),
      entityType: 'goal',
      entityId: goalId,
      action,
      changedBy: session.userId,
      changedAt: now,
      diff: JSON.stringify({ status: { from: goal.status, to: updated.status } }),
    });

    return Response.json({ ok: true, data: updated });
  }

  // Bulk approve entire employee's sheet
  if (employeeId && action === 'approve') {
    const goals = getGoalsByEmployee(employeeId).filter((g) => g.status === 'submitted');
    if (!goals.length)
      return Response.json({ ok: false, error: 'No submitted goals found for employee.' }, { status: 400 });

    const err = validateGoalSheet(employeeId, goals);
    if (err) return Response.json({ ok: false, error: err }, { status: 400 });

    const updated = goals.map((g) => ({
      ...g,
      status: 'approved' as const,
      isLocked: true,
      updatedAt: now,
    }));
    updated.forEach((g) => {
      upsertGoal(g);
      addAuditLog({
        id: nextId('audit'),
        entityType: 'goal',
        entityId: g.id,
        action: 'approved',
        changedBy: session.userId,
        changedAt: now,
        diff: JSON.stringify({ status: { from: 'submitted', to: 'approved' } }),
      });
    });

    return Response.json({ ok: true, data: updated });
  }

  return Response.json({ ok: false, error: 'Invalid action.' }, { status: 400 });
}
