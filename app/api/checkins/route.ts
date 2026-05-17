import { getSession } from '@/app/_lib/auth';
import {
  getCheckInsByManager,
  getCheckInByEmployeeQuarter,
  upsertCheckIn,
  nextId,
  getTeamOf,
} from '@/app/_lib/store';
import type { Quarter } from '@/app/_lib/types';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  if (session.role !== 'manager' && session.role !== 'admin')
    return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });

  const url = new URL(request.url);
  const employeeId = url.searchParams.get('employeeId');
  const quarter = url.searchParams.get('quarter');

  if (employeeId && quarter) {
    const ci = getCheckInByEmployeeQuarter(employeeId, quarter);
    return Response.json({ ok: true, data: ci ?? null });
  }

  return Response.json({ ok: true, data: getCheckInsByManager(session.userId) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  if (session.role !== 'manager')
    return Response.json({ ok: false, error: 'Only managers can log check-ins.' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { employeeId, quarter, comment } = body as {
    employeeId?: string;
    quarter?: Quarter;
    comment?: string;
  };

  if (!employeeId || !quarter || !comment?.trim())
    return Response.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });

  // Verify the employee is on the manager's team
  const team = getTeamOf(session.userId);
  if (!team.some((u) => u.id === employeeId))
    return Response.json({ ok: false, error: 'Employee not on your team.' }, { status: 403 });

  const existing = getCheckInByEmployeeQuarter(employeeId, quarter);
  const now = new Date().toISOString();

  const ci = {
    id: existing?.id ?? nextId('checkin'),
    managerId: session.userId,
    employeeId,
    quarter,
    comment: comment.trim(),
    createdAt: existing?.createdAt ?? now,
  };

  upsertCheckIn(ci);
  return Response.json({ ok: true, data: ci }, { status: existing ? 200 : 201 });
}
