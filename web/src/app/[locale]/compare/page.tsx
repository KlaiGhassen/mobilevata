'use client';

import { ReactNode, useMemo, type CSSProperties } from 'react';
import { Check, MapPin, Plus, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AuthGate } from '@/components/AuthGate';
import { BrandLogo } from '@/components/BrandLogo';
import { EmptyState } from '@/components/EmptyState';
import { ImageCarousel } from '@/components/ImageCarousel';
import { CompareBoardSkeleton } from '@/components/LoadingBlock';
import { PageHeader, PageShell } from '@/components/PageShell';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth-context';
import { formatMileage, formatPrice, Vehicle } from '@/lib/api';
import { useCatalogLabel } from '@/lib/i18n-labels';
import { useCompare } from '@/hooks/use-engagement';

type SpecRow = {
  id: string;
  label: string;
  get: (v: Vehicle) => string | number | ReactNode;
  raw: (v: Vehicle) => string | number | boolean | null | undefined;
};

function CompareContent({ token }: { token: string }) {
  const t = useTranslations('compare');
  const tv = useTranslations('vehicle');
  const tc = useTranslations('common');
  const locale = useLocale();
  const labels = useCatalogLabel();
  const { toggleCompare } = useAuth();
  const { data: items = [], isLoading } = useCompare(token);

  const rows: SpecRow[] = useMemo(
    () => [
      {
        id: 'mileage',
        label: tv('mileage'),
        get: (v) => formatMileage(v.mileage, locale),
        raw: (v) => v.mileage,
      },
      {
        id: 'year',
        label: tv('year'),
        get: (v) => v.year,
        raw: (v) => v.year,
      },
      {
        id: 'fuel',
        label: tv('fuel'),
        get: (v) => labels.fuel(v.fuelType),
        raw: (v) => v.fuelType,
      },
      {
        id: 'gearbox',
        label: tv('gearbox'),
        get: (v) => labels.transmission(v.transmission),
        raw: (v) => v.transmission,
      },
      {
        id: 'body',
        label: tv('body'),
        get: (v) => labels.body(v.bodyType),
        raw: (v) => v.bodyType,
      },
      {
        id: 'power',
        label: tv('power'),
        get: (v) => (v.powerHp ? `${v.powerHp} hp` : '—'),
        raw: (v) => v.powerHp ?? null,
      },
      {
        id: 'color',
        label: tv('color'),
        get: (v) => labels.color(v.color),
        raw: (v) => v.color ?? null,
      },
      {
        id: 'location',
        label: tv('location'),
        get: (v) => [v.city, v.country].filter(Boolean).join(', ') || '—',
        raw: (v) => [v.city, v.country].filter(Boolean).join(', '),
      },
      {
        id: 'service',
        label: tv('serviceBook'),
        get: (v) =>
          v.hasServiceBook ? (
            <span className="compare-board__yes">
              <Check size={16} aria-hidden="true" />
              {tc('yes')}
            </span>
          ) : (
            <span className="compare-board__no">—</span>
          ),
        raw: (v) => v.hasServiceBook,
      },
      {
        id: 'warranty',
        label: tv('warranty'),
        get: (v) =>
          v.hasWarranty ? (
            <span className="compare-board__yes">
              <Check size={16} aria-hidden="true" />
              {tc('yes')}
            </span>
          ) : (
            <span className="compare-board__no">—</span>
          ),
        raw: (v) => v.hasWarranty,
      },
    ],
    [labels, locale, tc, tv],
  );

  if (isLoading) {
    return (
      <PageShell>
        <PageHeader title={t('title')} description={t('lead')} />
        <CompareBoardSkeleton />
      </PageShell>
    );
  }

  if (items.length === 0) {
    return (
      <PageShell>
        <PageHeader title={t('title')} description={t('lead')} />
        <EmptyState
          title={t('empty')}
          description={t('emptyHint')}
          actionHref="/search"
          actionLabel={tc('browseOffers')}
        />
      </PageShell>
    );
  }

  const slotsLeft = Math.max(0, 3 - items.length);
  const colCount = items.length + slotsLeft;
  const differs = (row: SpecRow) => {
    if (items.length < 2) return false;
    const first = row.raw(items[0]);
    return items.some((v) => row.raw(v) !== first);
  };

  return (
    <PageShell>
      <PageHeader
        title={t('title')}
        description={t('lead')}
        actions={
          <div className="compare-toolbar">
            <p className="compare-toolbar__slots">
              {t('slots', { count: items.length, max: 3 })}
            </p>
            {slotsLeft > 0 ? (
              <Link href="/search" className="btn btn-primary">
                <Plus size={16} aria-hidden="true" />
                {t('addAnother')}
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="compare-board surface">
        <div
          className="compare-board__grid"
          style={{ '--compare-cols': colCount } as CSSProperties}
          role="table"
          aria-label={t('title')}
        >
          <div className="compare-board__corner" role="columnheader" />

          {items.map((v) => (
            <article key={v.id} className="compare-board__vehicle" role="columnheader">
              <div className="compare-board__media">
                <ImageCarousel images={v.images} alt={v.title} sizes="card" />
              </div>
              <div className="compare-board__vehicle-body">
                <div className="compare-board__brand-row">
                  {v.brand ? (
                    <BrandLogo
                      name={v.brand.name}
                      logoUrl={v.brand.logoUrl}
                      size={28}
                    />
                  ) : null}
                  <Link href={`/vehicles/${v.id}`} className="compare-board__title">
                    {v.title}
                  </Link>
                </div>
                <p className="compare-board__price price">
                  {formatPrice(v.price, locale)}
                </p>
                {(v.city || v.country) && (
                  <p className="compare-board__loc">
                    <MapPin size={13} aria-hidden="true" />
                    {[v.city, v.country].filter(Boolean).join(', ')}
                  </p>
                )}
                <div className="compare-board__vehicle-actions">
                  <Link href={`/vehicles/${v.id}`} className="btn btn-ghost">
                    {tv('viewOffer')}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => toggleCompare(v.id)}
                  >
                    <X size={16} aria-hidden="true" />
                    {t('remove')}
                  </button>
                </div>
              </div>
            </article>
          ))}

          {Array.from({ length: slotsLeft }).map((_, i) => (
            <Link
              key={`slot-${i}`}
              href="/search"
              className="compare-board__slot"
              role="columnheader"
            >
              <Plus size={22} aria-hidden="true" />
              <span>{t('addSlot')}</span>
            </Link>
          ))}

          {rows.map((row) => {
            const highlight = differs(row);
            return (
              <div key={row.id} className="compare-board__spec-group" role="row">
                <div
                  className={`compare-board__label${highlight ? ' is-diff' : ''}`}
                  role="rowheader"
                >
                  {row.label}
                </div>
                {items.map((v) => (
                  <div
                    key={v.id}
                    className={`compare-board__cell${highlight ? ' is-diff' : ''}`}
                    role="cell"
                  >
                    {row.get(v)}
                  </div>
                ))}
                {Array.from({ length: slotsLeft }).map((_, i) => (
                  <div
                    key={`empty-${row.id}-${i}`}
                    className="compare-board__cell compare-board__cell--empty"
                    role="cell"
                    aria-hidden="true"
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}

export default function ComparePage() {
  const t = useTranslations('compare');

  return (
    <AuthGate title={t('title')} description={t('needLogin')} narrow={false} skeleton="list">
      {({ token }) => <CompareContent token={token} />}
    </AuthGate>
  );
}
