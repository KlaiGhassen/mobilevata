'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  Car,
  ChevronLeft,
  ChevronRight,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  Tags,
  Users,
  X,
} from 'lucide-react';
import { useEffect } from 'react';
import { useAdminStats } from '@/hooks/use-admin-api';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, match: 'exact' as const },
  { href: '/reclamations', label: 'Reclamations', icon: Flag, badge: 'reclamations' as const },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/vehicles', label: 'Vehicles', icon: Car },
  { href: '/dealers', label: 'Dealers', icon: Building2 },
  { href: '/brands', label: 'Brands', icon: Tags },
];

export function AdminShell({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const logout = useAuthStore((s) => s.logout);
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const router = useRouter();
  const pathname = usePathname();
  const { data: stats } = useAdminStats(Boolean(user) && !loading);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  if (loading || !user) {
    return <div className="loading">Loading console…</div>;
  }

  const badgeFor = (key?: 'reclamations') => {
    if (key === 'reclamations') return stats?.reclamations.pending ?? 0;
    return 0;
  };

  const navLinks = (
    <>
      {NAV.map(({ href, label, icon: Icon, match, badge }) => {
        const active =
          match === 'exact'
            ? pathname === '/'
            : pathname === href || pathname.startsWith(`${href}/`);
        const count = badgeFor(badge);
        return (
          <Link
            key={href}
            href={href}
            className={`sidebar__link${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            title={label}
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="sidebar__link-icon" aria-hidden="true">
              <Icon size={18} strokeWidth={1.85} />
            </span>
            <span className="sidebar__link-label">{label}</span>
            {count > 0 ? (
              <span className="sidebar__badge" aria-label={`${count} pending`}>
                {count > 99 ? '99+' : count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </>
  );

  return (
    <div
      className={`shell${sidebarCollapsed ? ' shell--collapsed' : ''}${mobileNavOpen ? ' shell--drawer-open' : ''}`}
    >
      <aside className="sidebar" aria-label="Admin navigation">
        <div className="sidebar__top">
          <div className="sidebar__brand">
            <strong>Autovia</strong>
            <span>Backoffice</span>
          </div>
          <button
            type="button"
            className="sidebar__collapse"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Primary">
          {navLinks}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <span className="sidebar__avatar" aria-hidden="true">
              {user.firstName.slice(0, 1)}
              {user.lastName.slice(0, 1)}
            </span>
            <div className="sidebar__user-meta">
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              <small>{user.email}</small>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost sidebar__logout"
            onClick={() => void logout().then(() => router.replace('/login'))}
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {mobileNavOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <div className="main">
        <header className="topbar">
          <div className="topbar__start">
            <button
              type="button"
              className="btn btn-ghost topbar__menu"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={18} />
            </button>
            <h1>{title}</h1>
          </div>
          <div className="topbar__actions">{actions}</div>
        </header>

        <nav className="mobile-tabs" aria-label="Sections">
          {NAV.map(({ href, label, icon: Icon, match, badge }) => {
            const active =
              match === 'exact'
                ? pathname === '/'
                : pathname === href || pathname.startsWith(`${href}/`);
            const count = badgeFor(badge);
            return (
              <Link
                key={href}
                href={href}
                className={`mobile-tabs__item${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
                {count > 0 ? <em>{count > 99 ? '99+' : count}</em> : null}
              </Link>
            );
          })}
        </nav>

        <div className="content">{children}</div>
      </div>

      {mobileNavOpen ? (
        <button
          type="button"
          className="drawer-close"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        >
          <X size={18} />
        </button>
      ) : null}
    </div>
  );
}
