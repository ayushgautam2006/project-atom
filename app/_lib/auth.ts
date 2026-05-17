import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Session, Role } from './types';

const SESSION_COOKIE = 'portal_session';

// ─── Simple password hash (must match seed.ts) ────────────────────────────────
export function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return String(Math.abs(h));
}

// ─── Read session from cookie ─────────────────────────────────────────────────
export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

// ─── Require session (redirect to login if absent / wrong role) ───────────────
export async function requireSession(role?: Role): Promise<Session> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (role && session.role !== role) redirect('/dashboard');
  return session;
}

// ─── Set session cookie ───────────────────────────────────────────────────────
export async function setSession(session: Session): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

// ─── Clear session cookie ─────────────────────────────────────────────────────
export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
