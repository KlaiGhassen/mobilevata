'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  ChevronDown,
  GitCompare,
  Heart,
  LogOut,
  MessageSquare,
  PlusCircle,
  UserRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';
import type { User } from '@/lib/api';

function initials(user: User) {
  const a = user.firstName?.trim()?.[0] ?? '';
  const b = user.lastName?.trim()?.[0] ?? '';
  return `${a}${b}`.toUpperCase() || user.email.slice(0, 1).toUpperCase();
}

export function UserMenu() {
  const t = useTranslations('nav');
  const ta = useTranslations('auth');
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.push('/');
  };

  const links = [
    { href: '/account', label: t('account'), icon: UserRound },
    { href: '/messages', label: t('messages'), icon: MessageSquare },
    { href: '/favorites', label: t('favorites'), icon: Heart },
    { href: '/compare', label: t('compare'), icon: GitCompare },
    { href: '/sell', label: t('sell'), icon: PlusCircle },
  ] as const;

  return (
    <div ref={rootRef} className="user-menu" style={{ position: 'relative' }}>
      <button
        type="button"
        className="user-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-avatar" aria-hidden="true">
          {initials(user)}
        </span>
        <span className="user-menu__name">{user.firstName}</span>
        <ChevronDown size={14} aria-hidden="true" className={open ? 'user-menu__chevron is-open' : 'user-menu__chevron'} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={t('account')}
          className="user-menu__panel surface"
        >
          <div className="user-menu__header">
            <span className="user-avatar user-avatar--lg" aria-hidden="true">
              {initials(user)}
            </span>
            <div className="user-menu__meta">
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              <span>{user.email}</span>
              <span className="user-menu__role">
                {user.role === 'DEALER' ? ta('dealer') : ta('private')}
              </span>
            </div>
          </div>

          <div className="user-menu__divider" role="separator" />

          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className="user-menu__item"
                onClick={() => setOpen(false)}
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}

          <div className="user-menu__divider" role="separator" />

          <button
            type="button"
            role="menuitem"
            className="user-menu__item user-menu__item--danger"
            onClick={handleLogout}
          >
            <LogOut size={16} aria-hidden="true" />
            {t('logout')}
          </button>
        </div>
      )}
    </div>
  );
}
