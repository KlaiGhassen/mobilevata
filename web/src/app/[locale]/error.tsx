'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CarEmptyIllustration } from '@/components/CarEmptyIllustration';
import { PageShell } from '@/components/PageShell';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <div className="error-page">
        <CarEmptyIllustration />
        <p className="error-page__code">500</p>
        <h1 className="error-page__title">{t('title')}</h1>
        <p className="error-page__desc">{t('description')}</p>
        <div className="error-page__actions">
          <button type="button" className="btn btn-primary" onClick={reset}>
            {t('retry')}
          </button>
          <Link href="/" className="btn btn-ghost">
            {t('home')}
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
