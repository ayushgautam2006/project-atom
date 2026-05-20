import { getSession } from '@/app/_lib/auth';
import {
  getGoalsByEmployee,
  getGoalsByManager,
  getAllGoals,
  upsertGoal,
  nextId,
  validateGoalSheet,
  getGoalsByEmployee as gbe,
} from '@/app/_lib/store';
import { addAuditLog } from '@/app/_lib/store';
import type { Goal } from '@/app/_lib/types';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });

  let goals: Goal[];
  if (session.user.role === 'employee') {
    goals = getGoalsByEmployee(session.user.id);
  } else if (session.user.role === 'manager') {
    goals = getGoalsByManager(session.user.id);
  } else {
    goals = getAllGoals();
  }

  return Response.json({ ok: true, data: goals });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  if (session.user.role !== 'employee') {
    return Response.json({ ok: false, error: 'Only employees can create goals.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { thrustArea, title, description, uom, target, weightage } = body as Partial<Goal>;

  if (!thrustArea || !title || !uom || !target || weightage === undefined) {
    return Response.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });
  }
  if (weightage < 10) {
    return Response.json({ ok: false, error: 'Minimum weightage per goal is 10%.' }, { status: 400 });
  }

  const existing = gbe(session.user.id).filter((g) => g.status !== 'returned');
  if (existing.length >= 8) {
    return Response.json({ ok: false, error: 'Maximum 8 goals allowed.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const goal: Goal = {
    id: nextId('goal'),
    employeeId: session.user.id,
    thrustArea,
    title,
    description: description ?? '',
    uom,
    target,
    weightage: Number(weightage),
    status: 'draft',
    isShared: false,
    sharedBy: null,
    isLocked: false,
    returnNote: null,
    createdAt: now,
    updatedAt: now,
  };

  upsertGoal(goal);
  addAuditLog({
    id: nextId('audit'),
    entityType: 'goal',
    entityId: goal.id,
    action: 'created',
    changedBy: session.user.id,
    changedAt: now,
    diff: JSON.stringify({ status: { to: 'draft' } }),
  });

  return Response.json({ ok: true, data: goal }, { status: 201 });
}
