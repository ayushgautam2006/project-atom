import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = await auth();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and API auth routes
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};

