import type { Metadata } from 'next';
import { Providers } from '@/app/_components/Providers';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Sign In — Project Atom',
  description: 'Sign in to access your Goal Setting & Tracking Portal',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
