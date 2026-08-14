import { MapPin, Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Dealer } from '@/lib/api';

type Props = {
  dealer: Dealer;
  reviewsLabel: string;
  vehiclesLabel: string;
};

export function DealerCard({ dealer, reviewsLabel, vehiclesLabel }: Props) {
  const location = [dealer.city, dealer.country].filter(Boolean).join(', ');
  const initial = dealer.name.slice(0, 1).toUpperCase();

  return (
    <Link href={`/dealers/${dealer.id}`} className="dealer-card surface">
      <div className="dealer-card__top">
        <span className="dealer-card__avatar" aria-hidden="true">
          {initial}
        </span>
        <div className="dealer-card__intro">
          <h2 className="dealer-card__name">{dealer.name}</h2>
          {location ? (
            <p className="dealer-card__location">
              <MapPin size={14} aria-hidden="true" />
              {location}
            </p>
          ) : null}
        </div>
      </div>
      <p className="dealer-card__rating">
        <Star size={14} aria-hidden="true" className="dealer-card__star" />
        <span>{dealer.rating.toFixed(1)}</span>
        <span className="dealer-card__sep" aria-hidden="true">
          ·
        </span>
        <span>{reviewsLabel}</span>
      </p>
      <p className="dealer-card__stock">{vehiclesLabel}</p>
    </Link>
  );
}
