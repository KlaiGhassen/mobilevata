export function formatPrice(price: number, locale: string, currency = 'EUR') {
  const tag =
    locale === 'nl'
      ? 'nl-NL'
      : locale === 'ar'
        ? 'ar'
        : locale === 'en'
          ? 'en-GB'
          : 'de-DE';
  return new Intl.NumberFormat(tag, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(km: number, locale: string) {
  const tag =
    locale === 'nl'
      ? 'nl-NL'
      : locale === 'ar'
        ? 'ar'
        : locale === 'en'
          ? 'en-GB'
          : 'de-DE';
  const n = new Intl.NumberFormat(tag).format(km);
  return `${n} km`;
}
