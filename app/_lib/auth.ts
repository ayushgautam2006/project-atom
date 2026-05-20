import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import type { Role } from './types';

// ─── Simple password hash (must match seed.ts) ────────────────────────────────
export function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return String(Math.abs(h));
}

// ─── Get session using NextAuth ───────────────────────────────────────────────
export async function getSession() {
  return auth();
}

// ─── Require session (redirect to login if absent / wrong role) ───────────────
export async function requireSession(role?: Role) {
  const session = await auth();
  if (!session) redirect('/login');
  if (role && (session.user as any)?.role !== role) redirect('/dashboard');
  return session;
}
