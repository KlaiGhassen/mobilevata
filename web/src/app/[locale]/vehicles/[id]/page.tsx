'use client';

import { FormEvent, useEffect, useId, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Check,
  GitCompare,
  Heart,
  MapPin,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { Alert } from '@/components/Alert';
import { BrandLogo } from '@/components/BrandLogo';
import { EmptyState } from '@/components/EmptyState';
import { ImageCarousel } from '@/components/ImageCarousel';
import { VehicleDetailSkeleton } from '@/components/LoadingBlock';
import { PageShell } from '@/components/PageShell';
import { formatMileage, formatPrice } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCatalogLabel } from '@/lib/i18n-labels';
import { useVehicle } from '@/hooks/use-catalog';
import { useConversations, useCreateOffer } from '@/hooks/use-chat';
import { Link, useRouter } from '@/i18n/navigation';

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const t = useTranslations('vehicle');
  const tChat = useTranslations('chat');
  const labels = useCatalogLabel();
  const router = useRouter();
  const messageId = useId();
  const phoneId = useId();
  const offerPriceId = useId();
  const { token, user, favoriteIds, toggleFavorite, compareIds, toggleCompare } =
    useAuth();
  const { data: vehicle, isLoading, isError } = useVehicle(id);
  const { data: conversations = [] } = useConversations(token);
  const createOffer = useCreateOffer(token);
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [sentConversationId, setSentConversationId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState('');
  const te = useTranslations('errors');
  const tc = useTranslations('common');

  useEffect(() => {
    setMessage(t('defaultMessage'));
  }, [t]);

  useEffect(() => {
    setSentConversationId(null);
    setError('');
    setOfferPrice('');
  }, [id]);

  const existingConversation = useMemo(
    () => conversations.find((c) => c.vehicleId === id),
    [conversations, id],
  );

  if (isLoading) {
    return (
      <PageShell>
        <VehicleDetailSkeleton />
      </PageShell>
    );
  }

  if (isError || !vehicle) {
    return (
      <PageShell>
        <EmptyState
          title={te('notFoundTitle')}
          description={te('notFoundDescription')}
          actionHref="/search"
          actionLabel={tc('browseOffers')}
        />
      </PageShell>
    );
  }

  const requireAuth = async (action: () => Promise<void>) => {
    if (!token) {
      router.push('/login');
      return;
    }
    await action();
  };

  const onContact = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const priceNum = offerPrice.trim()
        ? Number(offerPrice.replace(',', '.'))
        : undefined;
      const conversation = await createOffer.mutateAsync({
        vehicleId: vehicle.id,
        message,
        phone: phone || undefined,
        offerPrice:
          priceNum != null && !Number.isNaN(priceNum) ? priceNum : undefined,
      });
      setSentConversationId(conversation.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const isFav = favoriteIds.has(vehicle.id);
  const inCompare = compareIds.includes(vehicle.id);
  const isOwnListing = Boolean(user && vehicle.seller?.id === user.id);
  const conversationId = existingConversation?.id ?? sentConversationId;

  const specs = [
    [t('year'), vehicle.year],
    [t('mileage'), formatMileage(vehicle.mileage, locale)],
    [t('fuel'), labels.fuel(vehicle.fuelType)],
    [t('gearbox'), labels.transmission(vehicle.transmission)],
    [t('body'), labels.body(vehicle.bodyType)],
    [t('power'), vehicle.powerHp ? `${vehicle.powerHp} hp` : '—'],
    [t('color'), labels.color(vehicle.color)],
    [t('condition'), labels.condition(vehicle.condition)],
  ] as const;

  return (
    <PageShell className="vehicle-detail">
      <div className="vehicle-detail__layout">
        <div className="vehicle-detail__main">
          <div className="vehicle-detail__gallery surface">
            <ImageCarousel images={vehicle.images} alt={vehicle.title} sizes="detail" />
          </div>

          <article className="vehicle-detail__content surface">
            <header className="vehicle-detail__header">
              <div className="vehicle-detail__title-block">
                <div className="vehicle-detail__brand-row">
                  {vehicle.brand ? (
                    <BrandLogo name={vehicle.brand.name} logoUrl={vehicle.brand.logoUrl} size={56} />
                  ) : null}
                  <h1 className="vehicle-detail__title">{vehicle.title}</h1>
                </div>
                <p className="vehicle-detail__location">
                  <MapPin size={16} aria-hidden="true" />
                  {[vehicle.city, vehicle.country].filter(Boolean).join(', ')}
                </p>
              </div>
              <div className="vehicle-detail__price-block">
                <div className="vehicle-detail__price price">{formatPrice(vehicle.price, locale)}</div>
                {vehicle.vatDeductible && (
                  <p className="vehicle-detail__vat">{t('vatDeductible')}</p>
                )}
              </div>
            </header>

            <dl className="vehicle-detail__specs">
              {specs.map(([label, value]) => (
                <div key={label} className="vehicle-detail__spec">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            <div className="vehicle-detail__badges">
              {vehicle.hasServiceBook && (
                <span className="badge">
                  <Check size={12} aria-hidden="true" /> {t('serviceBook')}
                </span>
              )}
              {vehicle.hasWarranty && (
                <span className="badge">
                  <ShieldCheck size={12} aria-hidden="true" /> {t('warranty')}
                </span>
              )}
              {vehicle.accidentFree && <span className="badge">{t('accidentFree')}</span>}
              {vehicle.electricRangeKm ? (
                <span className="badge">{t('range', { km: vehicle.electricRangeKm })}</span>
              ) : null}
            </div>

            <section className="vehicle-detail__section">
              <h2>{t('description')}</h2>
              <p className="vehicle-detail__description">{vehicle.description}</p>
            </section>

            <section className="vehicle-detail__section">
              <h2>{t('equipment')}</h2>
              <ul className="vehicle-detail__features">
                {vehicle.features.map((f) => (
                  <li key={f}>
                    <Check size={14} aria-hidden="true" className="vehicle-detail__feature-icon" />
                    {labels.feature(f)}
                  </li>
                ))}
              </ul>
            </section>
          </article>
        </div>

        <aside className="vehicle-detail__aside">
          <div className="vehicle-detail__actions surface">
            <button
              type="button"
              className={`btn btn-ghost${isFav ? ' is-active' : ''}`}
              onClick={() => requireAuth(() => toggleFavorite(vehicle.id))}
            >
              <Heart size={16} fill={isFav ? 'currentColor' : 'none'} aria-hidden="true" />
              {isFav ? t('removeFavorite') : t('addFavorite')}
            </button>
            <button
              type="button"
              className={`btn btn-ghost${inCompare ? ' is-active' : ''}`}
              onClick={() => requireAuth(() => toggleCompare(vehicle.id))}
            >
              <GitCompare size={16} aria-hidden="true" />
              {inCompare ? t('removeCompare') : t('addCompare')}
            </button>
          </div>

          <div className="vehicle-detail__contact surface">
            <p className="vehicle-detail__seller-name">
              {vehicle.dealer?.name ||
                `${vehicle.seller?.firstName || ''} ${vehicle.seller?.lastName || ''}`.trim() ||
                '—'}
            </p>
            <p className="vehicle-detail__seller-type">
              {vehicle.sellersType === 'PRO' ? t('professional') : t('privateSeller')}
              {vehicle.dealer ? (
                <>
                  {' · '}
                  <span className="vehicle-detail__rating" aria-hidden="true">
                    ★ {vehicle.dealer.rating.toFixed(1)}
                  </span>
                </>
              ) : null}
            </p>
            {vehicle.dealer && (
              <Link href={`/dealers/${vehicle.dealer.id}`} className="btn btn-ghost vehicle-detail__dealer-link">
                {t('dealerProfile')}
              </Link>
            )}

            {isOwnListing ? (
              <Alert tone="info">{tChat('ownListing')}</Alert>
            ) : conversationId ? (
              <div className="vehicle-detail__form">
                <Alert tone="success">{t('offerSent')}</Alert>
                <Link
                  href={`/messages?c=${conversationId}`}
                  className="btn btn-primary"
                >
                  <MessageSquare size={16} aria-hidden="true" />
                  {t('viewConversation')}
                </Link>
              </div>
            ) : (
              <form className="vehicle-detail__form" onSubmit={onContact}>
                <div className="field">
                  <label htmlFor={messageId}>{t('yourMessage')}</label>
                  <textarea
                    id={messageId}
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    minLength={3}
                  />
                </div>
                <div className="field">
                  <label htmlFor={offerPriceId}>{t('offerPriceOptional')}</label>
                  <input
                    id={offerPriceId}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={100}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder={String(vehicle.price)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={phoneId}>{t('phoneOptional')}</label>
                  <input
                    id={phoneId}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                {error ? <Alert tone="error">{error}</Alert> : null}
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={createOffer.isPending}
                >
                  <MessageSquare size={16} aria-hidden="true" />
                  {t('sendOffer')}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
