import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CarEmptyIllustration } from '@/components/CarEmptyIllustration';
import { PageShell } from '@/components/PageShell';

export default async function NotFoundPage() {
  const t = await getTranslations('errors');

  return (
    <PageShell>
      <div className="error-page">
        <CarEmptyIllustration />
        <p className="error-page__code">404</p>
        <h1 className="error-page__title">{t('notFoundTitle')}</h1>
        <p className="error-page__desc">{t('notFoundDescription')}</p>
        <div className="error-page__actions">
          <Link href="/search" className="btn btn-primary">
            {t('browse')}
          </Link>
          <Link href="/" className="btn btn-ghost">
            {t('home')}
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
