import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BrandGrid } from '@/components/BrandGrid';
import { HomeCarousel } from '@/components/HomeCarousel';
import { SearchForm } from '@/components/SearchForm';
import { VehicleCard } from '@/components/VehicleCard';
import { client } from '@/lib/api';
import {
  Car,
  Truck,
  Bus,
  Leaf,
  Star,
  Users,
  Crown,
  Clock,
  Building2,
  Key,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tCat = await getTranslations('categories');
  const tBody = await getTranslations('bodyTypes');
  const tCommon = await getTranslations('common');

  let categories: Awaited<ReturnType<typeof client.getCategories>> = [];
  let brands: Awaited<ReturnType<typeof client.getBrands>> = [];
  let stats: Awaited<ReturnType<typeof client.getStats>> | null = null;
  let recentVehicles: Awaited<ReturnType<typeof client.searchVehicles>>['items'] =
    [];

  try {
    const [cats, brandList, statsRes, recent] = await Promise.all([
      client.getCategories(),
      client.getBrands(false),
      client.getStats(),
      client.searchVehicles({ sort: 'newest', limit: 12, page: 1 }),
    ]);
    categories = cats;
    brands = brandList;
    stats = statsRes;
    recentVehicles = recent.items ?? [];
  } catch {
    /* API may be down */
  }

  const bodyTypes = ['estate', 'sedan', 'convertible', 'suv', 'coupe', 'mpv'] as const;

  const bodyTypeIcon: Record<string, typeof Car> = {
    estate: Car,
    sedan: Car,
    convertible: Star,
    suv: Truck,
    coupe: Car,
    mpv: Bus,
  };

  const catKey = {
    family: 'family',
    'first-car': 'firstCar',
    luxury: 'luxury',
    eco: 'eco',
    commute: 'commute',
    city: 'city',
  } as const;

  const catIcon: Record<string, typeof Car> = {
    family: Users,
    'first-car': Key,
    luxury: Crown,
    eco: Leaf,
    commute: Clock,
    city: Building2,
  };

  return (
    <>
      <section className="home-hero">
        <div className="container home-hero__inner fade-up">
          <h1 className="home-hero__title">
            {t('headline')} {t('subheadline')}
          </h1>
          {stats?.total ? (
            <p className="home-hero__lead">
              {t('offersAvailable', { count: stats.total.toLocaleString(locale) })}
            </p>
          ) : null}
          <div className="home-hero__search">
            <SearchForm />
          </div>
        </div>
      </section>

      {recentVehicles.length > 0 ? (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <h2 className="section-title">{t('recentVehicles')}</h2>
              <Link href="/search?sort=newest" className="section-head__link">
                {t('viewAll')}
              </Link>
            </div>
            <HomeCarousel
              label={t('recentVehicles')}
              className="home-carousel--vehicles"
              autoplayMs={4400}
              autoplayDelayMs={200}
            >
              {recentVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="home-carousel__item home-carousel__item--vehicle"
                >
                  <VehicleCard vehicle={vehicle} compact />
                </div>
              ))}
            </HomeCarousel>
          </div>
        </section>
      ) : null}

      <section className="section" style={{ paddingTop: recentVehicles.length ? 0 : undefined }}>
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">{t('popularCategories')}</h2>
          </div>
          <HomeCarousel
            label={t('popularCategories')}
            className="home-carousel--tiles"
            autoplayMs={3600}
            autoplayDelayMs={1100}
          >
            {categories.map((c, i) => {
              const qs = new URLSearchParams();
              Object.entries(c.filters || {}).forEach(([k, v]) => {
                if (v != null) qs.set(k, String(v));
              });
              qs.set('category', c.slug);
              const key = catKey[c.slug as keyof typeof catKey] || 'family';
              const CatIcon = catIcon[c.slug] || Car;
              return (
                <Link
                  key={c.slug}
                  href={`/search?${qs.toString()}`}
                  className="surface home-tile home-carousel__item home-carousel__item--tile fade-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="home-tile__icon" aria-hidden="true">
                    <CatIcon size={22} />
                  </span>
                  <h3 className="home-tile__title">{tCat(key)}</h3>
                </Link>
              );
            })}
          </HomeCarousel>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">{t('vehicleTypes')}</h2>
          </div>
          <HomeCarousel
            label={t('vehicleTypes')}
            className="home-carousel--tiles"
            autoplayMs={4000}
            autoplayDelayMs={1900}
          >
            {bodyTypes.map((bt) => {
              const count = stats?.byBodyType.find((b) => b.type === bt)?.count || 0;
              const BtIcon = bodyTypeIcon[bt] || Car;
              return (
                <Link
                  key={bt}
                  href={`/search?bodyType=${bt}`}
                  className="surface home-tile home-carousel__item home-carousel__item--tile"
                >
                  <span className="home-tile__icon" aria-hidden="true">
                    <BtIcon size={22} />
                  </span>
                  <strong className="home-tile__label">{tBody(bt)}</strong>
                  <span className="home-tile__meta">
                    {tCommon('results', { count: count.toLocaleString(locale) })}
                  </span>
                </Link>
              );
            })}
          </HomeCarousel>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">{t('popularBrands')}</h2>
            <Link href="/search" className="section-head__link">
              {t('viewAll')}
            </Link>
          </div>
          <BrandGrid brands={brands} />
        </div>
      </section>

      <section className="home-about">
        <div className="container home-about__inner">
          <h2 className="section-title">{t('aboutTitle')}</h2>
          <p className="home-about__body">{t('aboutBody')}</p>
        </div>
      </section>
    </>
  );
}
