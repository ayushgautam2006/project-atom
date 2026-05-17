import { getSession } from '@/app/_lib/auth';
import {
  getGoalById,
  upsertGoal,
  deleteGoal,
  addAuditLog,
  nextId,
  getGoalsByEmployee,
  validateGoalSheet,
} from '@/app/_lib/store';
import type { Goal } from '@/app/_lib/types';

export async function GET(
  _req: Request,
  ctx: RouteContext<'/api/goals/[id]'>,
) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });

  const { id } = await ctx.params;
  const goal = getGoalById(id);
  if (!goal) return Response.json({ ok: false, error: 'Goal not found.' }, { status: 404 });

  // Access control
  if (session.role === 'employee' && goal.employeeId !== session.userId)
    return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });

  return Response.json({ ok: true, data: goal });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/goals/[id]'>,
) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });

  const { id } = await ctx.params;
  const goal = getGoalById(id);
  if (!goal) return Response.json({ ok: false, error: 'Goal not found.' }, { status: 404 });

  // Lock check (only admin can edit locked goals)
  if (goal.isLocked && session.role !== 'admin') {
    return Response.json({ ok: false, error: 'Goal is locked. Contact Admin to unlock.' }, { status: 403 });
  }

  // Employee can only edit their own draft/returned goals
  if (session.role === 'employee') {
    if (goal.employeeId !== session.userId)
      return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });
    if (!['draft', 'returned'].includes(goal.status))
      return Response.json({ ok: false, error: 'Cannot edit a submitted or approved goal.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const allowed: (keyof Goal)[] =
    session.role === 'admin'
      ? ['thrustArea', 'title', 'description', 'uom', 'target', 'weightage', 'status', 'isLocked']
      : session.role === 'manager'
      ? ['weightage', 'target', 'status', 'returnNote']
      : ['thrustArea', 'title', 'description', 'uom', 'target', 'weightage'];

  const now = new Date().toISOString();
  const diff: Record<string, unknown> = {};
  const updated: Goal = { ...goal, updatedAt: now };

  for (const key of allowed) {
    if (key in body && body[key] !== undefined) {
      // Shared goal: employees/managers cannot change title/target
      if (
        goal.isShared &&
        session.role !== 'admin' &&
        (key === 'title' || key === 'target')
      )
        continue;
      diff[key] = { from: goal[key], to: body[key] };
      (updated as Record<string, unknown>)[key] = body[key];
    }
  }

  upsertGoal(updated);
  addAuditLog({
    id: nextId('audit'),
    entityType: 'goal',
    entityId: id,
    action: 'updated',
    changedBy: session.userId,
    changedAt: now,
    diff: JSON.stringify(diff),
  });

  return Response.json({ ok: true, data: updated });
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<'/api/goals/[id]'>,
) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });

  const { id } = await ctx.params;
  const goal = getGoalById(id);
  if (!goal) return Response.json({ ok: false, error: 'Goal not found.' }, { status: 404 });

  if (session.role === 'employee') {
    if (goal.employeeId !== session.userId)
      return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });
    if (goal.status !== 'draft')
      return Response.json({ ok: false, error: 'Can only delete draft goals.' }, { status: 403 });
  } else if (session.role !== 'admin') {
    return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });
  }

  deleteGoal(id);
  return Response.json({ ok: true, data: { deleted: id } });
}
