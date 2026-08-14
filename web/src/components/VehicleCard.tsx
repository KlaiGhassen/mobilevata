'use client';

import { GitCompare, Heart, Images, MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { BrandLogo } from '@/components/BrandLogo';
import { ImageCarousel } from '@/components/ImageCarousel';
import { formatMileage, formatPrice, Vehicle } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useCatalogLabel } from '@/lib/i18n-labels';
import { Link, useRouter } from '@/i18n/navigation';
import { alertDialog } from '@/stores/ui-store';

type Props = {
  vehicle: Vehicle;
  /** Tighter layout for home / strip carousels */
  compact?: boolean;
};

export function VehicleCard({ vehicle, compact = false }: Props) {
  const t = useTranslations('vehicle');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const locale = useLocale();
  const labels = useCatalogLabel();
  const { favoriteIds, toggleFavorite, compareIds, toggleCompare, token } = useAuth();
  const router = useRouter();
  const isFav = favoriteIds.has(vehicle.id);
  const inCompare = compareIds.includes(vehicle.id);
  const photoCount = vehicle.images?.length ?? 0;

  const requireAuth = async (action: () => Promise<void>) => {
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      await action();
    } catch (e) {
      await alertDialog({
        title: te('title'),
        description: e instanceof Error ? e.message : te('description'),
        tone: 'danger',
        confirmLabel: tc('ok'),
      });
    }
  };

  return (
    <div className={`vehicle-card-wrap fade-up${compact ? ' vehicle-card-wrap--compact' : ''}`}>
      <article className={`vehicle-card${compact ? ' vehicle-card--compact' : ''}`}>
        <div className="vehicle-card__media">
          <ImageCarousel images={vehicle.images} alt={vehicle.title} sizes="card" />
          <span
            className={
              vehicle.sellersType === 'PRO'
                ? 'badge badge-pro vehicle-card__seller'
                : 'badge badge-private vehicle-card__seller'
            }
          >
            {vehicle.sellersType === 'PRO' ? t('pro') : t('private')}
          </span>
          {photoCount > 1 ? (
            <span className="vehicle-card__photo-count" aria-hidden="true">
              <Images size={12} />
              {photoCount}
            </span>
          ) : null}
        </div>

        <div className="vehicle-card__body">
          <div className="vehicle-card__top">
            <h3 className="vehicle-card__heading">
              {vehicle.brand ? (
                <BrandLogo
                  name={vehicle.brand.name}
                  logoUrl={vehicle.brand.logoUrl}
                  size={compact ? 28 : 32}
                />
              ) : null}
              <Link href={`/vehicles/${vehicle.id}`} className="vehicle-card__title-link">
                {vehicle.title}
              </Link>
            </h3>
            <strong className="vehicle-card__price price">
              {formatPrice(vehicle.price, locale)}
            </strong>
          </div>

          <ul className="vehicle-card__specs meta-row">
            <li>{vehicle.year}</li>
            <li>{formatMileage(vehicle.mileage, locale)}</li>
            <li>{labels.fuel(vehicle.fuelType)}</li>
            {!compact ? <li>{labels.transmission(vehicle.transmission)}</li> : null}
            {!compact ? <li>{labels.body(vehicle.bodyType)}</li> : null}
            {!compact && vehicle.powerHp ? <li>{vehicle.powerHp} hp</li> : null}
          </ul>

          {!compact && (vehicle.city || vehicle.country) ? (
            <p className="vehicle-card__location">
              <MapPin size={14} aria-hidden="true" />
              <span>{[vehicle.city, vehicle.country].filter(Boolean).join(', ')}</span>
            </p>
          ) : null}

          <div className="vehicle-card__actions">
            <button
              type="button"
              className={`btn btn-ghost${compact ? ' btn-icon' : ''}${isFav ? ' is-active' : ''}`}
              aria-pressed={isFav}
              aria-label={t('favorites')}
              title={t('favorites')}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void requireAuth(() => toggleFavorite(vehicle.id));
              }}
            >
              <Heart
                size={16}
                aria-hidden="true"
                fill={isFav ? 'currentColor' : 'none'}
              />
              {!compact ? t('favorites') : null}
            </button>
            <button
              type="button"
              className={`btn btn-ghost${compact ? ' btn-icon' : ''}${inCompare ? ' is-active' : ''}`}
              aria-pressed={inCompare}
              aria-label={t('compare')}
              title={t('compare')}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void requireAuth(() => toggleCompare(vehicle.id));
              }}
            >
              <GitCompare size={16} aria-hidden="true" />
              {!compact ? t('compare') : null}
            </button>
            <Link
              href={`/vehicles/${vehicle.id}`}
              className="btn btn-primary vehicle-card__cta"
              onClick={(e) => e.stopPropagation()}
            >
              {t('viewOffer')}
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
