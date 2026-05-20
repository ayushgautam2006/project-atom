// This file is superseded by [...nextauth]/route.ts
// NextAuth handles all authentication endpoints

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('Not Found', { status: 404 });
}

export async function POST() {
  return new Response('Not Found', { status: 404 });
}

export async function DELETE() {
  return new Response('Not Found', { status: 404 });
}


