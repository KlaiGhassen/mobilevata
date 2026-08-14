'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/EmptyState';
import { VehicleListSkeleton } from '@/components/LoadingBlock';
import { PageHeader, PageShell } from '@/components/PageShell';
import { Pagination } from '@/components/Pagination';
import { SearchForm } from '@/components/SearchForm';
import { SelectMenu } from '@/components/SelectMenu';
import { VehicleCard } from '@/components/VehicleCard';
import { useVehicleSearch } from '@/hooks/use-catalog';
import { useRouter } from '@/i18n/navigation';

const PAGE_SIZE = 12;

export default function SearchPageClient() {
  const t = useTranslations('search');
  const tc = useTranslations('common');
  const params = useSearchParams();
  const router = useRouter();

  const sort = params.get('sort') || 'newest';
  const page = Math.max(1, Number(params.get('page') || 1) || 1);
  const initial = Object.fromEntries(params.entries());

  const sortOptions = useMemo(
    () => [
      { value: 'newest', label: t('sortNewest') },
      { value: 'price_asc', label: t('sortPriceAsc') },
      { value: 'price_desc', label: t('sortPriceDesc') },
      { value: 'year_desc', label: t('sortYear') },
      { value: 'mileage_asc', label: t('sortMileage') },
    ],
    [t],
  );

  const query = useMemo(
    () => {
      const { page: _p, sort: _s, ...filters } = initial;
      return { ...filters, sort, page, limit: PAGE_SIZE };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.toString(), sort, page],
  );

  const { data, isLoading, isFetching, isPlaceholderData } = useVehicleSearch(query);
  const initialLoading = isLoading && !data;

  const patchQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([key, value]) => {
        if (value == null || value === '') next.delete(key);
        else next.set(key, value);
      });
      const qs = next.toString();
      router.push(qs ? `/search?${qs}` : '/search');
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [params, router],
  );

  const onSortChange = (value: string) => {
    patchQuery({ sort: value === 'newest' ? null : value, page: null });
  };

  const onPageChange = (nextPage: number) => {
    patchQuery({ page: nextPage <= 1 ? null : String(nextPage) });
  };

  return (
    <PageShell>
      <PageHeader title={t('title')} />
      <SearchForm initial={initial} compact />

      <div className="search-toolbar">
        <p className="search-toolbar__count" aria-live="polite">
          {initialLoading
            ? t('loading')
            : t('results', { count: (data?.total || 0).toLocaleString() })}
        </p>
        <div className="search-toolbar__sort">
          <SelectMenu
            label={t('sortBy')}
            value={sort}
            options={sortOptions}
            onChange={onSortChange}
          />
        </div>
      </div>

      {initialLoading ? (
        <VehicleListSkeleton count={4} />
      ) : data?.items.length === 0 ? (
        <EmptyState
          title={t('empty')}
          actionHref="/search"
          actionLabel={tc('browseOffers')}
        />
      ) : (
        <div
          className={`search-results${isFetching && isPlaceholderData ? ' is-fetching' : ''}`}
          aria-busy={isFetching && isPlaceholderData}
        >
          {isFetching && isPlaceholderData ? (
            <div className="search-results__progress" aria-hidden="true" />
          ) : null}
          <ul className="vehicle-list">
            {data?.items.map((v) => (
              <li key={v.id}>
                <VehicleCard vehicle={v} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && data.total > 0 ? (
        <Pagination
          page={data.page || page}
          totalPages={data.totalPages || 1}
          totalItems={data.total}
          pageSize={PAGE_SIZE}
          onPageChange={onPageChange}
          label={t('title')}
        />
      ) : null}
    </PageShell>
  );
}
