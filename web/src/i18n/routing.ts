import { defineRouting } from 'next-intl/routing';

export const locales = ['de', 'nl', 'ar', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Language stays in localStorage + cookie — not in the URL
  localePrefix: 'never',
  localeDetection: true,
});
