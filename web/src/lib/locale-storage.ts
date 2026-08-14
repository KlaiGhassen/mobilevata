import { locales, type Locale } from '@/i18n/routing';

export const LOCALE_STORAGE_KEY = 'autovia.locale';
/** Cookie used by next-intl middleware — not visible in the URL */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function readStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(value) ? value : null;
}

export function saveLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
