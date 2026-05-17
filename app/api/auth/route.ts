import { getUserByEmail } from '@/app/_lib/store';
import { simpleHash, setSession, clearSession, getSession } from '@/app/_lib/auth';
import type { Session } from '@/app/_lib/types';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return Response.json({ ok: false, error: 'Email and password are required.' }, { status: 400 });
  }

  const user = getUserByEmail(email.toLowerCase().trim());
  if (!user || user.passwordHash !== simpleHash(password)) {
    return Response.json({ ok: false, error: 'Invalid email or password.' }, { status: 401 });
  }

  const session: Session = {
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  };

  await setSession(session);
  return Response.json({ ok: true, data: session });
}

export async function DELETE() {
  await clearSession();
  return Response.json({ ok: true, data: null });
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: 'Not authenticated.' }, { status: 401 });
  return Response.json({ ok: true, data: session });
}
