'use client';

import clsx from 'clsx';

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  return <span className={clsx('badge', `badge--${tone}`)}>{children}</span>;
}

export function statusTone(status: string) {
  const s = status.toUpperCase();
  if (s === 'ACTIVE' || s === 'RESOLVED' || s === 'PUBLISHED') return 'success';
  if (s === 'OPEN' || s === 'IN_PROGRESS' || s === 'PENDING') return 'warning';
  if (s === 'BANNED' || s === 'REJECTED' || s === 'SUSPENDED') return 'danger';
  if (s === 'CLOSED' || s === 'UNPUBLISHED') return 'neutral';
  return 'info';
}

export function priorityTone(priority: string) {
  const p = priority.toUpperCase();
  if (p === 'URGENT' || p === 'HIGH') return 'danger';
  if (p === 'MEDIUM') return 'warning';
  return 'neutral';
}
