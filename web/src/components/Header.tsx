'use client';

import {
  GitCompare,
  Heart,
  Menu,
  MessageSquare,
  PlusCircle,
  Search,
  X,
} from 'lucide-react';
import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';
import { useUiStore } from '@/stores/ui-store';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';
import { UserMenu } from './UserMenu';

export function Header() {
  const t = useTranslations('nav');
  const tBrand = useTranslations('brand');
  const { user, logout, favoriteIds, compareIds } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);
  const toggleMobileNav = useUiStore((s) => s.toggleMobileNav);
  const menuId = useId();

  const nav: {
    href: string;
    label: string;
    icon: typeof Search;
    count?: number;
  }[] = [
    { href: '/search', label: t('search'), icon: Search },
    { href: '/sell', label: t('sell'), icon: PlusCircle },
    {
      href: '/favorites',
      label: t('favorites'),
      icon: Heart,
      count: favoriteIds.size,
    },
    {
      href: '/compare',
      label: t('compare'),
      icon: GitCompare,
      count: compareIds.length,
    },
  ];
  if (user) {
    nav.push({ href: '/messages', label: t('messages'), icon: MessageSquare });
  }

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.push('/');
  };

  return (
    <header className={`site-header${open ? ' is-open' : ''}`}>
      <div className="container site-header__bar">
        <Link
          href="/"
          className="site-header__brand"
          aria-label={tBrand('name') + tBrand('dot')}
        >
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            width={120}
            height={40}
            className="site-header__logo"
          />
          <span className="brand-mark site-header__wordmark">
            {tBrand('name')}
            <span>{tBrand('dot')}</span>
          </span>
        </Link>

        <nav className="site-header__nav" aria-label="Primary">
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`site-header__link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
                {item.count ? (
                  <span className="site-header__badge" aria-label={String(item.count)}>
                    {item.count}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <div className="site-header__prefs" role="group" aria-label="Preferences">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>

          {user ? (
            <div className="site-header__account">
              <UserMenu />
            </div>
          ) : (
            <div className="site-header__auth">
              <Link href="/login" className="btn btn-ghost">
                {t('login')}
              </Link>
              <Link href="/register" className="btn btn-primary">
                {t('register')}
              </Link>
            </div>
          )}
        </nav>

        <div className="site-header__mobile-tools">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <button
            type="button"
            className="btn btn-ghost site-header__menu-btn"
            onClick={toggleMobileNav}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label="Menu"
          >
            {open ? (
              <X size={18} aria-hidden="true" />
            ) : (
              <Menu size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <div id={menuId} className="container mobile-drawer">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`mobile-drawer__link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
                {item.count ? (
                  <span className="mobile-drawer__count">{item.count}</span>
                ) : null}
              </Link>
            );
          })}
          {user ? (
            <>
              <div className="mobile-drawer__user">
                <span className="user-avatar" aria-hidden="true">
                  {(user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')}
                </span>
                <div>
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <Link
                href="/account"
                className="mobile-drawer__link"
                onClick={() => setOpen(false)}
              >
                {t('account')}
              </Link>
              <Link
                href="/messages"
                className="mobile-drawer__link"
                onClick={() => setOpen(false)}
              >
                {t('messages')}
              </Link>
              <button type="button" className="btn btn-danger" onClick={handleLogout}>
                {t('logout')}
              </button>
            </>
          ) : (
            <div className="mobile-drawer__auth">
              <Link
                href="/login"
                className="btn btn-ghost"
                onClick={() => setOpen(false)}
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="btn btn-primary"
                onClick={() => setOpen(false)}
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </header>
  );
}
