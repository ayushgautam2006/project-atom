import { getSession } from '@/app/_lib/auth';
import {
  getAllUsers,
  getGoalById,
  upsertGoal,
  addAuditLog,
  nextId,
} from '@/app/_lib/store';
import type { Goal } from '@/app/_lib/types';

/**
 * POST — Admin/manager pushes a shared goal to multiple employees.
 * Recipients get a copy with title & target read-only; weightage is editable.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  if (session.user.role !== 'admin' && session.user.role !== 'manager')
    return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { baseGoalId, employeeIds, weightage } = body as {
    baseGoalId?: string;
    employeeIds?: string[];
    weightage?: number;
  };

  if (!baseGoalId || !Array.isArray(employeeIds) || !employeeIds.length)
    return Response.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });

  const base = getGoalById(baseGoalId);
  if (!base) return Response.json({ ok: false, error: 'Source goal not found.' }, { status: 404 });

  const now = new Date().toISOString();
  const created: Goal[] = [];

  for (const empId of employeeIds) {
    const goal: Goal = {
      id: nextId('goal'),
      employeeId: empId,
      thrustArea: base.thrustArea,
      title: base.title,
      description: base.description,
      uom: base.uom,
      target: base.target,
      weightage: weightage !== undefined ? Number(weightage) : 10,
      status: 'draft',
      isShared: true,
      sharedBy: session.user.id,
      isLocked: false,
      returnNote: null,
      createdAt: now,
      updatedAt: now,
    };
    upsertGoal(goal);
    created.push(goal);
  }

  addAuditLog({
    id: nextId('audit'),
    entityType: 'goal',
    entityId: baseGoalId,
    action: 'shared_goal_pushed',
    changedBy: session.user.id,
    changedAt: now,
    diff: JSON.stringify({ sharedTo: employeeIds }),
  });

  return Response.json({ ok: true, data: created }, { status: 201 });
}
