'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AuthGate } from '@/components/AuthGate';
import { EmptyState } from '@/components/EmptyState';
import { VehicleListSkeleton } from '@/components/LoadingBlock';
import { PageHeader, PageShell } from '@/components/PageShell';
import { VehicleCard } from '@/components/VehicleCard';
import { useFavorites } from '@/hooks/use-engagement';
import { Link } from '@/i18n/navigation';
import type { Vehicle } from '@/lib/api';

function FavoritesContent({ token }: { token: string }) {
  const t = useTranslations('favorites');
  const tc = useTranslations('common');
  const { data: rows = [], isLoading } = useFavorites(token);

  if (isLoading) {
    return (
      <PageShell>
        <PageHeader title={t('title')} description={t('lead')} />
        <VehicleListSkeleton count={3} />
      </PageShell>
    );
  }

  const items = rows
    .map((r) => r.vehicle)
    .filter((v): v is Vehicle => Boolean(v?.id && v?.title));

  return (
    <PageShell>
      <PageHeader
        title={t('title')}
        description={t('lead')}
        actions={
          items.length > 0 ? (
            <Link href="/search" className="btn btn-ghost">
              {tc('browseOffers')}
            </Link>
          ) : null
        }
      />

      {items.length > 0 ? (
        <p className="page-eyebrow">
          <Heart size={14} aria-hidden="true" />
          {t('count', { count: items.length })}
        </p>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title={t('empty')}
          actionHref="/search"
          actionLabel={tc('browseOffers')}
        />
      ) : (
        <ul className="vehicle-list vehicle-list--favorites">
          {items.map((v) => (
            <li key={v.id}>
              <VehicleCard vehicle={v} />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}

export default function FavoritesPage() {
  const t = useTranslations('favorites');

  return (
    <AuthGate title={t('title')} description={t('needLogin')} narrow={false} skeleton="list">
      {({ token }) => <FavoritesContent token={token} />}
    </AuthGate>
  );
}
