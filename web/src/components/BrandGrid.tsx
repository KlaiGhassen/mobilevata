'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { BrandLogo } from '@/components/BrandLogo';
import { HomeCarousel } from '@/components/HomeCarousel';
import { Link } from '@/i18n/navigation';
import type { Brand } from '@/lib/api';

type Props = {
  brands: Brand[];
};

export function BrandGrid({ brands }: Props) {
  const t = useTranslations('home');

  const sorted = useMemo(
    () =>
      [...brands].sort((a, b) => {
        if (a.popular !== b.popular) return a.popular ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [brands],
  );

  if (!sorted.length) return null;

  return (
    <HomeCarousel
      label={t('popularBrands')}
      className="home-carousel--brands"
      autoplayMs={2600}
      autoplayDelayMs={500}
    >
      {sorted.map((b) => (
        <Link
          key={b.id}
          href={`/search?brandId=${b.id}`}
          className="surface brand-tile home-carousel__item home-carousel__item--brand"
        >
          <BrandLogo name={b.name} logoUrl={b.logoUrl} size={72} />
          <span className="brand-tile__name">{b.name}</span>
        </Link>
      ))}
    </HomeCarousel>
  );
}
