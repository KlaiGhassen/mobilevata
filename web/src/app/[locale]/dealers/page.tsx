import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DealerCard } from '@/components/DealerCard';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader, PageShell } from '@/components/PageShell';
import { client } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function DealersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('dealers');

  let dealers: Awaited<ReturnType<typeof client.getDealers>> = [];
  let failed = false;
  try {
    dealers = await client.getDealers();
  } catch {
    dealers = [];
    failed = true;
  }

  return (
    <PageShell>
      <PageHeader title={t('title')} description={t('description')} />

      {dealers.length === 0 ? (
        <EmptyState title={failed ? t('empty') : t('empty')} />
      ) : (
        <ul className="dealer-grid">
          {dealers.map((d) => (
            <li key={d.id}>
              <DealerCard
                dealer={d}
                reviewsLabel={t('reviews', { count: d.reviewCount })}
                vehiclesLabel={t('vehicles', { count: d._count?.vehicles || 0 })}
              />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
