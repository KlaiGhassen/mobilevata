'use client';

import { useLocale, useTranslations } from 'next-intl';

/** Generic dictionary lookup for canonical API codes */
export function useCatalogLabel() {
  const tBody = useTranslations('bodyTypes');
  const tFuel = useTranslations('fuels');
  const tTrans = useTranslations('transmissions');
  const tCond = useTranslations('conditions');
  const tColor = useTranslations('colors');
  const tFeat = useTranslations('features');
  const tCat = useTranslations('categories');

  const safe = (ns: (key: string) => string, key?: string | null) => {
    if (!key) return '—';
    try {
      return ns(key);
    } catch {
      return key;
    }
  };

  return {
    body: (key?: string | null) => safe(tBody, key),
    fuel: (key?: string | null) => safe(tFuel, key),
    transmission: (key?: string | null) => safe(tTrans, key),
    condition: (key?: string | null) => safe(tCond, key),
    color: (key?: string | null) => safe(tColor, key),
    feature: (key?: string | null) => safe(tFeat, key),
    category: (key?: string | null) => safe(tCat, key),
  };
}

export function useLocaleFormat() {
  const locale = useLocale();
  return { locale };
}
