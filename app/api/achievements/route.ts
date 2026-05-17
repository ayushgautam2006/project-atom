import { getSession } from '@/app/_lib/auth';
import {
  getGoalById,
  getAchievementsByGoal,
  getAchievementByGoalQuarter,
  upsertAchievement,
  addAuditLog,
  nextId,
  getAllAchievements,
  getGoalsByEmployee,
} from '@/app/_lib/store';
import { computeScore } from '@/app/_lib/scoring';
import type { Achievement, Quarter, AchievementStatus } from '@/app/_lib/types';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });

  const url = new URL(request.url);
  const goalId = url.searchParams.get('goalId');
  const quarter = url.searchParams.get('quarter');

  if (goalId && quarter) {
    const ach = getAchievementByGoalQuarter(goalId, quarter);
    return Response.json({ ok: true, data: ach ?? null });
  }
  if (goalId) {
    return Response.json({ ok: true, data: getAchievementsByGoal(goalId) });
  }

  // Manager/admin: all achievements
  if (session.role === 'employee') {
    const goals = getGoalsByEmployee(session.userId);
    const achs = goals.flatMap((g) => getAchievementsByGoal(g.id));
    return Response.json({ ok: true, data: achs });
  }
  return Response.json({ ok: true, data: getAllAchievements() });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  if (session.role !== 'employee')
    return Response.json({ ok: false, error: 'Only employees can log achievements.' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { goalId, quarter, actualValue, status } = body as {
    goalId?: string;
    quarter?: Quarter;
    actualValue?: string;
    status?: AchievementStatus;
  };

  if (!goalId || !quarter || actualValue === undefined || !status)
    return Response.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });

  const goal = getGoalById(goalId);
  if (!goal) return Response.json({ ok: false, error: 'Goal not found.' }, { status: 404 });
  if (goal.employeeId !== session.userId)
    return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });
  if (!goal.isLocked)
    return Response.json({ ok: false, error: 'Goal must be approved before logging achievement.' }, { status: 400 });

  const now = new Date().toISOString();
  const existing = getAchievementByGoalQuarter(goalId, quarter);

  const ach: Achievement = {
    id: existing?.id ?? nextId('achievement'),
    goalId,
    quarter,
    actualValue,
    status,
    score: null, // computed below
    updatedAt: now,
  };
  ach.score = computeScore(goal, ach);

  upsertAchievement(ach);
  addAuditLog({
    id: nextId('audit'),
    entityType: 'achievement',
    entityId: ach.id,
    action: existing ? 'updated' : 'created',
    changedBy: session.userId,
    changedAt: now,
    diff: JSON.stringify({ quarter, actualValue, status, score: ach.score }),
  });

  return Response.json({ ok: true, data: ach }, { status: existing ? 200 : 201 });
}
