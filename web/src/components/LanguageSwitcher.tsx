'use client';

import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { saveLocale } from '@/lib/locale-storage';
import { MenuDropdown } from './MenuDropdown';

export function LanguageSwitcher() {
  const t = useTranslations('prefs');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const labels: Record<Locale, string> = {
    de: t('langDe'),
    nl: t('langNl'),
    ar: t('langAr'),
    en: t('langEn'),
  };

  return (
    <MenuDropdown
      label={t('language')}
      value={locale}
      icon={<Languages size={16} aria-hidden="true" />}
      options={routing.locales.map((l) => ({
        value: l,
        label: labels[l],
      }))}
      onChange={(next) => {
        if (next === locale) return;
        saveLocale(next);
        router.replace(pathname, { locale: next });
      }}
    />
  );
}
