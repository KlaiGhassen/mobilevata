import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PageShell } from '@/components/PageShell';

export default async function OfflinePage() {
  const t = await getTranslations('pwa');

  return (
    <PageShell narrow>
      <section className="empty-state surface" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
          {t('offlineTitle')}
        </h1>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>
          {t('offlineBody')}
        </p>
        <Link href="/" className="btn btn-primary">
          {t('offlineHome')}
        </Link>
      </section>
    </PageShell>
  );
}
