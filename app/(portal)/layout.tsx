import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/app/_lib/auth';
import Sidebar from '@/app/_components/Sidebar';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Project Atom — Goal & Performance Portal',
  description: 'Set goals, track progress, and drive results with Project Atom.',
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <html lang="en">
      <body>
        <Sidebar session={session} />
        <main className="portal-main">{children}</main>
      </body>
    </html>
  );
}
