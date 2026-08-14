'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { readStoredLocale, saveLocale } from '@/lib/locale-storage';

/** Applies language from localStorage (Deutsch / Nederlands). */
export function LocaleRestorer() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const stored = readStoredLocale();
    if (stored && stored !== locale) {
      saveLocale(stored);
      router.replace(pathname, { locale: stored });
      return;
    }

    // Keep cookie in sync with the active locale for SSR
    saveLocale(locale);
  }, [locale, pathname, router]);

  return null;
}
