import { getSession } from '@/app/_lib/auth';
import { getAllAuditLogs, getUserById } from '@/app/_lib/store';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  if (session.user.role !== 'admin')
    return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });

  const url = new URL(request.url);
  const entityType = url.searchParams.get('entityType');
  const changedBy = url.searchParams.get('changedBy');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let logs = getAllAuditLogs();

  if (entityType) logs = logs.filter((l) => l.entityType === entityType);
  if (changedBy) logs = logs.filter((l) => l.changedBy === changedBy);
  if (from) logs = logs.filter((l) => l.changedAt >= from);
  if (to) logs = logs.filter((l) => l.changedAt <= to);

  // Enrich with user name
  const enriched = logs.map((l) => ({
    ...l,
    changedByName: getUserById(l.changedBy)?.name ?? l.changedBy,
  }));

  return Response.json({ ok: true, data: enriched });
}
