'use client';

import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

function employeeNav(): NavItem[] {
  return [
    { label: 'Dashboard', href: '/dashboard', icon: '⊞' },
    { label: 'My Goals', href: '/goals', icon: '🎯' },
    { label: 'My Check-ins', href: '/my-checkins', icon: '✓' },
  ];
}

function managerNav(): NavItem[] {
  return [
    { label: 'Dashboard', href: '/dashboard', icon: '⊞' },
    { label: 'My Goals', href: '/goals', icon: '🎯' },
    { label: 'Approvals', href: '/approvals', icon: '✅' },
    { label: 'Team Goals', href: '/team', icon: '👥' },
    { label: 'Check-ins', href: '/checkins', icon: '📋' },
  ];
}

function adminNav(): NavItem[] {
  return [
    { label: 'Dashboard', href: '/dashboard', icon: '⊞' },
    { label: 'All Goals', href: '/goals', icon: '🎯' },
    { label: 'Cycles', href: '/admin/cycles', icon: '📅' },
    { label: 'Users', href: '/admin/users', icon: '👤' },
    { label: 'Shared Goals', href: '/admin/shared-goals', icon: '🔗' },
    { label: 'Audit Trail', href: '/admin/audit', icon: '🗂️' },
    { label: 'Reports', href: '/admin/reports', icon: '📊' },
  ];
}

function getNav(role: string): NavItem[] {
  if (role === 'manager') return managerNav();
  if (role === 'admin') return adminNav();
  return employeeNav();
}

const ROLE_LABEL: Record<string, string> = {
  employee: 'Employee',
  manager: 'Manager (L1)',
  admin: 'Admin / HR',
};

export default function Sidebar({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = (session?.user as any)?.role || 'employee';
  const nav = getNav(role);

  async function handleLogout() {
    await signOut({ redirectTo: '/login' });
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">⚛</div>
        <div>
          <div className="sidebar-name">Project Atom</div>
          <div className="sidebar-tagline">Goal & Performance</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {nav.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          return (
            <button
              key={item.href}
              id={`nav-${item.href.replace(/\//g, '-').slice(1)}`}
              className={`nav-link${active ? ' active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.badge ? (
                <span className="nav-badge">{item.badge}</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">
            {session?.user?.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2) || 'AA'}
          </div>
          <div className="user-info">
            <div className="user-name">{session?.user?.name || 'User'}</div>
            <div className="user-role">{ROLE_LABEL[role]}</div>
          </div>
        </div>
        <button
          id="logout-btn"
          className="nav-link"
          style={{ marginTop: 4, color: '#ef4444' }}
          onClick={handleLogout}
        >
          <span className="nav-icon">→</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
