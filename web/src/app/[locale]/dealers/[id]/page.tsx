import { MapPin, Phone, Star } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader, PageShell } from '@/components/PageShell';
import { VehicleCard } from '@/components/VehicleCard';
import { client } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function DealerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('dealers');

  let dealer: Awaited<ReturnType<typeof client.getDealer>> | null = null;
  try {
    dealer = await client.getDealer(id);
  } catch {
    notFound();
  }
  if (!dealer) notFound();

  const stock = dealer.vehicles ?? [];

  return (
    <PageShell>
      <PageHeader
        title={dealer.name}
        description={dealer.description || undefined}
        backHref="/dealers"
        backLabel={t('back')}
      />

      <section className="dealer-detail__hero surface">
        <dl className="dealer-detail__meta">
          {(dealer.address || dealer.city || dealer.country) && (
            <div className="dealer-detail__meta-item">
              <dt className="visually-hidden">{t('address')}</dt>
              <dd>
                <MapPin size={16} aria-hidden="true" />
                {[dealer.address, dealer.city, dealer.country].filter(Boolean).join(', ')}
              </dd>
            </div>
          )}
          {dealer.phone && (
            <div className="dealer-detail__meta-item">
              <dt className="visually-hidden">{t('phone')}</dt>
              <dd>
                <Phone size={16} aria-hidden="true" />
                <a href={`tel:${dealer.phone.replace(/\s+/g, '')}`}>{dealer.phone}</a>
              </dd>
            </div>
          )}
          <div className="dealer-detail__meta-item">
            <dt className="visually-hidden">{t('rating')}</dt>
            <dd>
              <Star size={16} aria-hidden="true" className="dealer-card__star" />
              {dealer.rating.toFixed(1)} ({t('reviews', { count: dealer.reviewCount })})
            </dd>
          </div>
        </dl>
      </section>

      <h2 className="dealer-detail__section-title">{t('stock')}</h2>
      {stock.length === 0 ? (
        <EmptyState title={t('emptyStock')} />
      ) : (
        <ul className="vehicle-list">
          {stock.map((v) => (
            <li key={v.id}>
              <VehicleCard vehicle={v} />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
