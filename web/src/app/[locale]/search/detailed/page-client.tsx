'use client';

import { FormEvent, useId, useMemo, useState } from 'react';
import {
  Car,
  RotateCcw,
  Search,
  Zap,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { PageHeader, PageShell } from '@/components/PageShell';
import { SelectMenu, type SelectOption } from '@/components/SelectMenu';
import { useBrands, useModels, useVehicleSearch } from '@/hooks/use-catalog';
import { BODY_TYPES, COLORS, FUEL_TYPES, TRANSMISSIONS } from '@/lib/catalog-options';

const PRICES = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 70000, 90000];
const YEARS = Array.from({ length: 27 }, (_, i) => 2026 - i);
const MILEAGES = [5000, 10000, 20000, 30000, 50000, 75000, 100000, 125000, 150000, 200000];
const COUNTRY_CODES = ['', 'Germany', 'France', 'Belgium', 'Netherlands', 'Austria', 'Spain', 'Italy'] as const;
const CONDITIONS = ['used', 'new'] as const;
const SELLERS = ['', 'private', 'dealer'] as const;

const COLOR_HEX: Record<string, string> = {
  black: '#1a1a1a',
  white: '#f5f5f5',
  silver: '#c0c0c0',
  grey: '#6b7280',
  blue: '#2563eb',
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#eab308',
  orange: '#ea580c',
  brown: '#92400e',
  beige: '#d6c6a8',
};

export default function DetailedSearchClient() {
  const t = useTranslations('search');
  const tBody = useTranslations('bodyTypes');
  const tFuel = useTranslations('fuels');
  const tTrans = useTranslations('transmissions');
  const tCond = useTranslations('conditions');
  const tColor = useTranslations('colors');
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const formId = useId();
  const initial = Object.fromEntries(params.entries());

  const [brandId, setBrandId] = useState(initial.brandId || '');
  const [modelId, setModelId] = useState(initial.modelId || '');
  const [bodyType, setBodyType] = useState(initial.bodyType || '');
  const [priceMin, setPriceMin] = useState(initial.priceMin || '');
  const [priceMax, setPriceMax] = useState(initial.priceMax || '');
  const [yearMin, setYearMin] = useState(initial.yearMin || '');
  const [yearMax, setYearMax] = useState(initial.yearMax || '');
  const [mileageMax, setMileageMax] = useState(initial.mileageMax || '');
  const [transmission, setTransmission] = useState(initial.transmission || '');
  const [fuelType, setFuelType] = useState(initial.fuelType || '');
  const [country, setCountry] = useState(initial.country || '');
  const [condition, setCondition] = useState(initial.condition || '');
  const [color, setColor] = useState(initial.color || '');
  const [sellersType, setSellersType] = useState(initial.sellersType || '');
  const [q, setQ] = useState(initial.q || '');
  const [category, setCategory] = useState(initial.category || '');

  const { data: brands = [] } = useBrands();
  const { data: models = [] } = useModels(brandId);

  const previewParams = useMemo(() => {
    const p: Record<string, string> = { limit: '1' };
    if (q.trim()) p.q = q.trim();
    if (brandId) p.brandId = brandId;
    if (modelId) p.modelId = modelId;
    if (bodyType) p.bodyType = bodyType;
    if (priceMin) p.priceMin = priceMin;
    if (priceMax) p.priceMax = priceMax;
    if (yearMin) p.yearMin = yearMin;
    if (yearMax) p.yearMax = yearMax;
    if (mileageMax) p.mileageMax = mileageMax;
    if (transmission) p.transmission = transmission;
    if (fuelType) p.fuelType = fuelType;
    if (country) p.country = country;
    if (condition) p.condition = condition;
    if (color) p.color = color;
    if (sellersType) p.sellersType = sellersType;
    if (category) p.category = category;
    return p;
  }, [
    q,
    brandId,
    modelId,
    bodyType,
    priceMin,
    priceMax,
    yearMin,
    yearMax,
    mileageMax,
    transmission,
    fuelType,
    country,
    condition,
    color,
    sellersType,
    category,
  ]);

  const { data: preview } = useVehicleSearch(previewParams);
  const total = preview?.total ?? null;

  const money = (n: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const km = (n: number) => `${new Intl.NumberFormat(locale).format(n)} km`;

  const brandOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: t('allMakes') },
      ...brands.map((b) => ({
        value: b.id,
        label: b.name,
        icon: <BrandLogo name={b.name} logoUrl={b.logoUrl} size={28} />,
      })),
    ],
    [brands, t],
  );

  const modelOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: brandId ? t('allModels') : t('pickMakeFirst') },
      ...models.map((m) => ({ value: m.id, label: m.name })),
    ],
    [models, brandId, t],
  );

  const priceOptions = (anyLabel: string) => [
    { value: '', label: anyLabel },
    ...PRICES.map((p) => ({ value: String(p), label: money(p) })),
  ];

  const yearOptions = (anyLabel: string) => [
    { value: '', label: anyLabel },
    ...YEARS.map((y) => ({ value: String(y), label: String(y) })),
  ];

  const mileageOptions: SelectOption[] = useMemo(
    () => [{ value: '', label: t('anyMileage') }, ...MILEAGES.map((m) => ({ value: String(m), label: km(m) }))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, t],
  );

  const countryOptions: SelectOption[] = useMemo(
    () =>
      COUNTRY_CODES.map((c) => ({
        value: c,
        label: c === '' ? t('all') : t(`countries.${c}` as 'countries.Germany'),
      })),
    [t],
  );

  const sellerOptions: SelectOption[] = useMemo(
    () =>
      SELLERS.map((s) => ({
        value: s,
        label: s === '' ? t('all') : t(`sellers.${s}` as 'sellers.private'),
      })),
    [t],
  );

  const buildQuery = () => {
    const qs = new URLSearchParams();
    if (q.trim()) qs.set('q', q.trim());
    if (brandId) qs.set('brandId', brandId);
    if (modelId) qs.set('modelId', modelId);
    if (bodyType) qs.set('bodyType', bodyType);
    if (priceMin) qs.set('priceMin', priceMin);
    if (priceMax) qs.set('priceMax', priceMax);
    if (yearMin) qs.set('yearMin', yearMin);
    if (yearMax) qs.set('yearMax', yearMax);
    if (mileageMax) qs.set('mileageMax', mileageMax);
    if (transmission) qs.set('transmission', transmission);
    if (fuelType) qs.set('fuelType', fuelType);
    if (country) qs.set('country', country);
    if (condition) qs.set('condition', condition);
    if (color) qs.set('color', color);
    if (sellersType) qs.set('sellersType', sellersType);
    if (category) qs.set('category', category);
    return qs;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/search?${buildQuery().toString()}`);
  };

  const reset = () => {
    setBrandId('');
    setModelId('');
    setBodyType('');
    setPriceMin('');
    setPriceMax('');
    setYearMin('');
    setYearMax('');
    setMileageMax('');
    setTransmission('');
    setFuelType('');
    setCountry('');
    setCondition('');
    setColor('');
    setSellersType('');
    setQ('');
    setCategory('');
  };

  const offerLabel =
    total != null
      ? t('offersCount', { count: total.toLocaleString(locale) })
      : t('offers');

  return (
    <PageShell>
      <PageHeader
        title={t('detailedTitle')}
        description={t('detailedHint')}
        backHref={`/search?${params.toString()}`}
        backLabel={t('backToResults')}
      />

      <form className="detailed-search surface" onSubmit={onSubmit}>
        <div className="detailed-search__sticky">
          <button type="submit" className="btn btn-primary">
            <Search size={16} aria-hidden="true" />
            {offerLabel}
          </button>
          <button type="button" className="btn btn-ghost" onClick={reset}>
            <RotateCcw size={14} aria-hidden="true" />
            {t('resetShort')}
          </button>
        </div>

        <section className="detailed-search__section">
          <h2>{t('sectionMain')}</h2>
          <div className="field">
            <label htmlFor={`${formId}-q`}>{t('keyword')}</label>
            <input
              id={`${formId}-q`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('quickSearchPlaceholder')}
            />
          </div>

          <div className="detailed-search__grid">
            <SelectMenu
              id={`${formId}-brand`}
              label={t('make')}
              value={brandId}
              options={brandOptions}
              onChange={(v) => {
                setBrandId(v);
                setModelId('');
              }}
              searchable
              searchPlaceholder={t('searchMake')}
              clearable
              emptyText={t('noMatches')}
            />
            <SelectMenu
              id={`${formId}-model`}
              label={t('model')}
              value={modelId}
              options={modelOptions}
              onChange={setModelId}
              disabled={!brandId}
              searchable={Boolean(brandId)}
              searchPlaceholder={t('searchModel')}
              clearable
              emptyText={t('noMatches')}
            />
          </div>

          <div className="detailed-search__bodies" role="group" aria-label={t('vehicleType')}>
            {BODY_TYPES.map((bt) => {
              const active = bodyType === bt;
              return (
                <button
                  key={bt}
                  type="button"
                  className={`detailed-body${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => setBodyType(active ? '' : bt)}
                >
                  <Car size={22} strokeWidth={1.6} aria-hidden="true" />
                  <span>{tBody(bt)}</span>
                </button>
              );
            })}
          </div>

          <div className="detailed-search__grid detailed-search__grid--ranges">
            <SelectMenu
              id={`${formId}-yearMin`}
              label={t('yearMin')}
              value={yearMin}
              options={yearOptions(t('anyYear'))}
              onChange={setYearMin}
              clearable
            />
            <SelectMenu
              id={`${formId}-yearMax`}
              label={t('yearMax')}
              value={yearMax}
              options={yearOptions(t('anyYear'))}
              onChange={setYearMax}
              clearable
            />
            <SelectMenu
              id={`${formId}-mileage`}
              label={t('mileageMax')}
              value={mileageMax}
              options={mileageOptions}
              onChange={setMileageMax}
              clearable
            />
            <SelectMenu
              id={`${formId}-priceMin`}
              label={t('priceMin')}
              value={priceMin}
              options={priceOptions(t('anyPrice'))}
              onChange={setPriceMin}
              clearable
            />
            <SelectMenu
              id={`${formId}-priceMax`}
              label={t('priceMax')}
              value={priceMax}
              options={priceOptions(t('anyPrice'))}
              onChange={setPriceMax}
              clearable
            />
          </div>

          <div className="detailed-search__chips" role="group" aria-label={t('fuel')}>
            <span className="detailed-search__legend">{t('fuel')}</span>
            <div className="chip-row">
              <button
                type="button"
                className={`chip${!fuelType ? ' is-active' : ''}`}
                aria-pressed={!fuelType}
                onClick={() => setFuelType('')}
              >
                {t('all')}
              </button>
              {FUEL_TYPES.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`chip${fuelType === f ? ' is-active' : ''}`}
                  aria-pressed={fuelType === f}
                  onClick={() => setFuelType(f)}
                >
                  {f === 'electric' ? <Zap size={14} aria-hidden="true" /> : null}
                  {tFuel(f)}
                </button>
              ))}
            </div>
          </div>

          <div className="detailed-search__chips" role="group" aria-label={t('transmission')}>
            <span className="detailed-search__legend">{t('transmission')}</span>
            <div className="chip-row">
              <button
                type="button"
                className={`chip${!transmission ? ' is-active' : ''}`}
                aria-pressed={!transmission}
                onClick={() => setTransmission('')}
              >
                {t('all')}
              </button>
              {TRANSMISSIONS.map((tr) => (
                <button
                  key={tr}
                  type="button"
                  className={`chip${transmission === tr ? ' is-active' : ''}`}
                  aria-pressed={transmission === tr}
                  onClick={() => setTransmission(tr)}
                >
                  {tTrans(tr)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="detailed-search__section">
          <h2>{t('sectionCondition')}</h2>
          <div className="chip-row">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip${condition === c ? ' is-active' : ''}`}
                aria-pressed={condition === c}
                onClick={() => setCondition(condition === c ? '' : c)}
              >
                {tCond(c)}
              </button>
            ))}
          </div>
        </section>

        <section className="detailed-search__section">
          <h2>{t('sectionAppearance')}</h2>
          <div className="detailed-search__swatches" role="group" aria-label={t('color')}>
            {COLORS.map((c) => {
              const active = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch${active ? ' is-active' : ''}`}
                  style={{ background: COLOR_HEX[c] }}
                  aria-label={tColor(c)}
                  aria-pressed={active}
                  title={tColor(c)}
                  onClick={() => setColor(active ? '' : c)}
                />
              );
            })}
          </div>
        </section>

        <section className="detailed-search__section">
          <h2>{t('sectionSeller')}</h2>
          <div className="detailed-search__grid">
            <SelectMenu
              id={`${formId}-country`}
              label={t('country')}
              value={country}
              options={countryOptions}
              onChange={setCountry}
              clearable
            />
            <SelectMenu
              id={`${formId}-seller`}
              label={t('sellerType')}
              value={sellersType}
              options={sellerOptions}
              onChange={setSellersType}
              clearable
            />
          </div>
        </section>

        <div className="detailed-search__foot">
          <button type="submit" className="btn btn-primary">
            <Search size={16} aria-hidden="true" />
            {offerLabel}
          </button>
        </div>
      </form>
    </PageShell>
  );
}
