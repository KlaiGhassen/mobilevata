'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tBrand = useTranslations('brand');

  return (
    <footer className="app-footer">
      <div className="container" style={{ display: 'grid', gap: 'var(--space-8)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <img
                src="/logo.png"
                alt=""
                aria-hidden="true"
                width={96}
                height={32}
                className="footer-logo"
              />
              <div className="brand-mark" style={{ color: 'var(--color-inverse-fg)', fontSize: 'var(--text-xl)' }}>
                {tBrand('name')}
                <span style={{ color: 'var(--teal-200)' }}>{tBrand('dot')}</span>
              </div>
            </div>
            <p style={{ lineHeight: 'var(--leading-body)', margin: 0, fontSize: 'var(--text-sm)' }}>{t('tagline')}</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--color-inverse-fg)', margin: '0 0 12px', fontSize: 'var(--text-sm)' }}>{t('buy')}</h4>
            <div style={{ display: 'grid', gap: 8, fontSize: 'var(--text-sm)' }}>
              <Link href="/search">{t('allOffers')}</Link>
              <Link href="/search?fuelType=electric">{t('electric')}</Link>
              <Link href="/search?condition=new">{t('newVehicles')}</Link>
              <Link href="/dealers">{tNav('dealers')}</Link>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'var(--color-inverse-fg)', margin: '0 0 12px', fontSize: 'var(--text-sm)' }}>{t('sell')}</h4>
            <div style={{ display: 'grid', gap: 8, fontSize: 'var(--text-sm)' }}>
              <Link href="/sell">{t('placeAd')}</Link>
              <Link href="/register">{t('createAccount')}</Link>
            </div>
          </div>
          <div>
            <h4 style={{ color: 'var(--color-inverse-fg)', margin: '0 0 12px', fontSize: 'var(--text-sm)' }}>{t('help')}</h4>
            <div style={{ display: 'grid', gap: 8, fontSize: 'var(--text-sm)' }}>
              <span>{t('legal')}</span>
              <span>{t('privacy')}</span>
              <span>{t('cookies')}</span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid color-mix(in srgb, white 12%, transparent)', paddingTop: 18, fontSize: 'var(--text-xs)' }}>
          {t('disclaimer')}
        </div>
      </div>
    </footer>
  );
}
