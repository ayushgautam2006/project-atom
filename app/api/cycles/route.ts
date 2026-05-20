import { getSession } from '@/app/_lib/auth';
import {
  getAllCycles,
  getCycleById,
  upsertCycle,
  nextId,
  addAuditLog,
} from '@/app/_lib/store';
import type { Cycle, CyclePhase } from '@/app/_lib/types';

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  return Response.json({ ok: true, data: getAllCycles() });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  if (session.user.role !== 'admin')
    return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, phase, openDate, closeDate, isActive } = body as Partial<Cycle>;

  if (!name || !phase || !openDate || !closeDate)
    return Response.json({ ok: false, error: 'Missing required fields.' }, { status: 400 });

  const now = new Date().toISOString();
  const cycle: Cycle = {
    id: nextId('cycle'),
    name,
    phase,
    openDate,
    closeDate,
    isActive: isActive ?? false,
  };
  upsertCycle(cycle);
  addAuditLog({
    id: nextId('audit'),
    entityType: 'cycle',
    entityId: cycle.id,
    action: 'created',
    changedBy: session.user.id,
    changedAt: now,
    diff: JSON.stringify(cycle),
  });
  return Response.json({ ok: true, data: cycle }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  if (session.user.role !== 'admin')
    return Response.json({ ok: false, error: 'Forbidden.' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { id, ...updates } = body as Partial<Cycle> & { id?: string };
  if (!id) return Response.json({ ok: false, error: 'Cycle ID required.' }, { status: 400 });

  const cycle = getCycleById(id);
  if (!cycle) return Response.json({ ok: false, error: 'Cycle not found.' }, { status: 404 });

  const updated: Cycle = { ...cycle, ...updates };
  upsertCycle(updated);
  addAuditLog({
    id: nextId('audit'),
    entityType: 'cycle',
    entityId: id,
    action: 'updated',
    changedBy: session.user.id,
    changedAt: new Date().toISOString(),
    diff: JSON.stringify(updates),
  });
  return Response.json({ ok: true, data: updated });
}
