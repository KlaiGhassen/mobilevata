'use client';

import { FormEvent, KeyboardEvent, useId, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bike,
  Bus,
  Car,
  Caravan,
  Combine,
  Container,
  Construction,
  Forklift,
  Package,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tractor,
  Truck,
  Zap,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { SelectMenu, type SelectOption } from '@/components/SelectMenu';
import { useTypingPlaceholder } from '@/hooks/use-typing-placeholder';
import { useBrands, useModels, useVehicleSearch } from '@/hooks/use-catalog';
import { BODY_TYPES, TRANSMISSIONS as GEARBOXES } from '@/lib/catalog-options';

const PRICES = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 70000, 90000];
const YEARS = Array.from({ length: 27 }, (_, i) => 2026 - i);
const MILEAGES = [5000, 10000, 20000, 30000, 50000, 75000, 100000, 125000, 150000, 200000];
const TRANSMISSIONS = ['', ...GEARBOXES] as const;
const COUNTRY_CODES = ['', 'Germany', 'France', 'Belgium', 'Netherlands', 'Austria', 'Spain', 'Italy'] as const;

const MOTORCYCLE_TYPES = ['scooter', 'naked', 'sport', 'touring', 'enduro', 'custom'] as const;
const MOTORHOME_TYPES = ['alcove', 'semi_integrated', 'integrated', 'van', 'trailer_tent'] as const;

type VehicleClass = 'car' | 'motorcycle' | 'motorhome' | 'truck';

type Props = {
  initial?: Record<string, string>;
  compact?: boolean;
};

const CLASS_FROM_INITIAL = (initial: Record<string, string>): VehicleClass => {
  const cat = initial.category || '';
  if (cat.startsWith('truck') || cat === 'trailer' || cat === 'bus' || cat === 'agricultural' || cat === 'construction' || cat === 'forklift' || cat === 'semi') {
    return 'truck';
  }
  if (cat === 'motorcycle' || MOTORCYCLE_TYPES.includes(cat as (typeof MOTORCYCLE_TYPES)[number])) return 'motorcycle';
  if (cat === 'motorhome' || MOTORHOME_TYPES.includes(cat as (typeof MOTORHOME_TYPES)[number])) return 'motorhome';
  if (initial.bodyType === 'mpv' && cat === 'motorhome') return 'motorhome';
  return 'car';
};

export function SearchForm({ initial = {}, compact = false }: Props) {
  const t = useTranslations('search');
  const tBody = useTranslations('bodyTypes');
  const tTrans = useTranslations('transmissions');
  const locale = useLocale();
  const router = useRouter();
  const formId = useId();

  const [vehicleClass, setVehicleClass] = useState<VehicleClass>(() => CLASS_FROM_INITIAL(initial));
  const [q, setQ] = useState(initial.q || '');
  const [quickFocused, setQuickFocused] = useState(false);
  const [segment, setSegment] = useState(initial.category && initial.category !== 'motorcycle' && initial.category !== 'motorhome' ? initial.category : '');
  const [bodyType, setBodyType] = useState(initial.bodyType || '');
  const [brandId, setBrandId] = useState(initial.brandId || '');
  const [modelId, setModelId] = useState(initial.modelId || '');
  const [priceMax, setPriceMax] = useState(initial.priceMax || '');
  const [yearMin, setYearMin] = useState(initial.yearMin || '');
  const [mileageMax, setMileageMax] = useState(initial.mileageMax || '');
  const [transmission, setTransmission] = useState(initial.transmission || '');
  const [country, setCountry] = useState(initial.country || '');
  const [fuelType, setFuelType] = useState(initial.fuelType || '');

  const typingExamples = (t.raw('typingExamples') as string[]) || [];
  const typed = useTypingPlaceholder(typingExamples, quickFocused || Boolean(q.trim()));

  const { data: brands = [] } = useBrands();
  const { data: models = [] } = useModels(brandId);

  const classParams = useMemo(() => {
    if (vehicleClass === 'motorcycle') {
      return { category: segment || 'motorcycle' };
    }
    if (vehicleClass === 'motorhome') {
      return segment ? { category: segment } : { category: 'motorhome', bodyType: 'mpv' };
    }
    if (vehicleClass === 'truck') {
      return { category: segment || 'truck' };
    }
    return {};
  }, [vehicleClass, segment]);

  const previewParams = useMemo(() => {
    const params: Record<string, string> = { limit: '1' };
    if (q.trim()) params.q = q.trim();
    if (brandId) params.brandId = brandId;
    if (modelId) params.modelId = modelId;
    if (priceMax) params.priceMax = priceMax;
    if (yearMin) params.yearMin = yearMin;
    if (mileageMax) params.mileageMax = mileageMax;
    if (transmission) params.transmission = transmission;
    if (country) params.country = country;
    if (fuelType) params.fuelType = fuelType;
    if (vehicleClass === 'car' && bodyType) params.bodyType = bodyType;
    Object.assign(params, classParams);
    return params;
  }, [
    q,
    brandId,
    modelId,
    priceMax,
    yearMin,
    mileageMax,
    transmission,
    country,
    fuelType,
    bodyType,
    vehicleClass,
    classParams,
  ]);

  const { data: preview } = useVehicleSearch(previewParams);
  const total = preview?.total ?? null;

  const money = (n: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const km = (n: number) => `${new Intl.NumberFormat(locale).format(n)} km`;

  const categories = useMemo(
    () =>
      [
        { id: 'car' as const, icon: Car, label: t('catCar') },
        { id: 'motorcycle' as const, icon: Bike, label: t('catMotorcycle') },
        { id: 'motorhome' as const, icon: Caravan, label: t('catMotorhome') },
        { id: 'truck' as const, icon: Truck, label: t('catTruck') },
      ] as const,
    [t],
  );

  const truckSubs = useMemo(
    () =>
      [
        { id: 'truck-heavy', icon: Truck, label: t('truckHeavy') },
        { id: 'trailer', icon: Package, label: t('truckTrailer') },
        { id: 'van', icon: Container, label: t('truckVan') },
        { id: 'semi', icon: Combine, label: t('truckSemi') },
        { id: 'semi-trailer', icon: Package, label: t('truckSemiTrailer') },
        { id: 'bus', icon: Bus, label: t('truckBus') },
        { id: 'agricultural', icon: Tractor, label: t('truckAgri') },
        { id: 'construction', icon: Construction, label: t('truckConstruction') },
        { id: 'forklift', icon: Forklift, label: t('truckForklift') },
      ] as const,
    [t],
  );

  const bodyOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: t('all') },
      ...BODY_TYPES.map((bt) => ({ value: bt, label: tBody(bt) })),
    ],
    [t, tBody],
  );

  const motorcycleTypeOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: t('all') },
      ...MOTORCYCLE_TYPES.map((id) => ({ value: id, label: t(`motoTypes.${id}` as 'motoTypes.scooter') })),
    ],
    [t],
  );

  const motorhomeTypeOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: t('all') },
      ...MOTORHOME_TYPES.map((id) => ({ value: id, label: t(`mhTypes.${id}` as 'mhTypes.alcove') })),
    ],
    [t],
  );

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

  const priceOptions: SelectOption[] = useMemo(
    () => [{ value: '', label: t('anyPrice') }, ...PRICES.map((p) => ({ value: String(p), label: money(p) }))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, t],
  );

  const yearOptions: SelectOption[] = useMemo(
    () => [{ value: '', label: t('anyYear') }, ...YEARS.map((y) => ({ value: String(y), label: String(y) }))],
    [t],
  );

  const mileageOptions: SelectOption[] = useMemo(
    () => [{ value: '', label: t('anyMileage') }, ...MILEAGES.map((m) => ({ value: String(m), label: km(m) }))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, t],
  );

  const transmissionOptions: SelectOption[] = useMemo(
    () =>
      TRANSMISSIONS.map((tr) => ({
        value: tr,
        label: tr === '' ? t('all') : tTrans(tr),
      })),
    [t, tTrans],
  );

  const countryOptions: SelectOption[] = useMemo(
    () =>
      COUNTRY_CODES.map((c) => ({
        value: c,
        label: c === '' ? t('all') : t(`countries.${c}` as 'countries.Germany'),
      })),
    [t],
  );

  const buildQuery = () => {
    const qs = new URLSearchParams();
    if (q.trim()) qs.set('q', q.trim());
    if (brandId) qs.set('brandId', brandId);
    if (modelId) qs.set('modelId', modelId);
    if (priceMax) qs.set('priceMax', priceMax);
    if (yearMin) qs.set('yearMin', yearMin);
    if (mileageMax) qs.set('mileageMax', mileageMax);
    if (transmission) qs.set('transmission', transmission);
    if (country) qs.set('country', country);
    if (fuelType) qs.set('fuelType', fuelType);
    if (vehicleClass === 'car' && bodyType) qs.set('bodyType', bodyType);
    if (classParams.category) qs.set('category', classParams.category);
    if (classParams.bodyType) qs.set('bodyType', classParams.bodyType);
    return qs;
  };

  const goSearch = () => router.push(`/search?${buildQuery().toString()}`);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    goSearch();
  };

  const onQuickSubmit = (e: FormEvent) => {
    e.preventDefault();
    goSearch();
  };

  const selectClass = (next: VehicleClass) => {
    if (next === vehicleClass) return;
    setVehicleClass(next);
    setSegment('');
    setBodyType('');
    setBrandId('');
    setModelId('');
    setFuelType('');
    // Clear class-specific fields that would confuse the new filter set
    if (next === 'truck') {
      setPriceMax('');
      setYearMin('');
      setMileageMax('');
      setTransmission('');
      setCountry('');
    }
  };

  const onClassKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') {
      return;
    }
    e.preventDefault();
    const last = categories.length - 1;
    let next = index;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else next = index === 0 ? last : index - 1;
    selectClass(categories[next].id);
    const btn = document.getElementById(`${formId}-class-${categories[next].id}`);
    btn?.focus();
  };

  const reset = () => {
    setVehicleClass('car');
    setSegment('');
    setQ('');
    setBodyType('');
    setBrandId('');
    setModelId('');
    setPriceMax('');
    setYearMin('');
    setMileageMax('');
    setTransmission('');
    setCountry('');
    setFuelType('');
  };

  const offerLabel =
    total != null
      ? t('offersCount', { count: total.toLocaleString(locale) })
      : t('offers');

  const detailedHref = `/search/detailed?${buildQuery().toString()}`;

  const typeValue = vehicleClass === 'car' ? bodyType : segment;
  const typeOptions =
    vehicleClass === 'motorcycle'
      ? motorcycleTypeOptions
      : vehicleClass === 'motorhome'
        ? motorhomeTypeOptions
        : bodyOptions;
  const onTypeChange = (v: string) => {
    if (vehicleClass === 'car') setBodyType(v);
    else setSegment(v);
  };

  const selectProps = { size: 'lg' as const, clearable: true };

  const panelFoot = (
    <div className="search-panel__foot">
      <div className="search-panel__foot-start">
        {vehicleClass === 'car' ? (
          <label className="search-check">
            <input
              type="checkbox"
              checked={fuelType === 'electric'}
              onChange={(e) => setFuelType(e.target.checked ? 'electric' : '')}
            />
            <Zap size={14} aria-hidden="true" />
            <span>{t('electricCars')}</span>
          </label>
        ) : null}
        <button type="button" className="search-panel__reset" onClick={reset}>
          <RotateCcw size={14} aria-hidden="true" />
          {t('resetShort')}
        </button>
      </div>
      <div className="search-panel__foot-end">
        <Link href={detailedHref} className="search-panel__more">
          <SlidersHorizontal size={14} aria-hidden="true" />
          {t('moreFilters')}
        </Link>
        <button type="submit" className="btn btn-primary search-panel__submit">
          <Search size={18} aria-hidden="true" />
          <span>{offerLabel}</span>
        </button>
      </div>
    </div>
  );

  const brandModelFields = (
    <>
      <SelectMenu
        id={`${formId}-brand`}
        label={t('make')}
        value={brandId}
        options={brandOptions}
        onChange={(v) => {
          setBrandId(v);
          setModelId('');
        }}
        placeholder={t('allMakes')}
        searchable
        searchPlaceholder={t('searchMake')}
        emptyText={t('noMatches')}
        {...selectProps}
      />
      <SelectMenu
        id={`${formId}-model`}
        label={t('model')}
        value={modelId}
        options={modelOptions}
        onChange={setModelId}
        placeholder={brandId ? t('allModels') : t('pickMakeFirst')}
        disabled={!brandId}
        searchable={Boolean(brandId)}
        searchPlaceholder={t('searchModel')}
        emptyText={t('noMatches')}
        {...selectProps}
      />
    </>
  );

  return (
    <div className={`search-stack${compact ? ' search-stack--compact' : ''}`}>
      <form className="search-quick" onSubmit={onQuickSubmit} aria-label={t('quickSearchAria')}>
        <Search className="search-quick__icon" size={20} strokeWidth={2} aria-hidden="true" />
        <div className="search-quick__field">
          <input
            className="search-quick__input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setQuickFocused(true)}
            onBlur={() => setQuickFocused(false)}
            placeholder={quickFocused || q ? t('quickSearchPlaceholder') : ' '}
            autoComplete="off"
            aria-label={t('quickSearchAria')}
          />
          {!q && !quickFocused ? (
            <span className="search-quick__typed" aria-hidden="true">
              {typed}
              <span className="search-quick__caret" />
            </span>
          ) : null}
        </div>
        <button type="submit" className="search-quick__submit" aria-label={t('offers')}>
          <span className="search-quick__submit-label">{t('offers')}</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </form>

      <form
        onSubmit={onSubmit}
        aria-label={t('title')}
        className={`search-panel surface${compact ? '' : ' search-panel--hero'}`}
      >
        <div className="search-panel__rail" role="tablist" aria-label={t('vehicleClass')} aria-orientation="vertical">
          {categories.map((cat, index) => {
            const Icon = cat.icon;
            const active = vehicleClass === cat.id;
            return (
              <button
                key={cat.id}
                id={`${formId}-class-${cat.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`${formId}-panel`}
                tabIndex={active ? 0 : -1}
                aria-label={cat.label}
                title={cat.label}
                className={`search-panel__cat${active ? ' is-active' : ''}`}
                onClick={() => selectClass(cat.id)}
                onKeyDown={(e) => onClassKeyDown(e, index)}
              >
                <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                <span className="visually-hidden">{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div
          className="search-panel__main"
          id={`${formId}-panel`}
          role="tabpanel"
          aria-labelledby={`${formId}-class-${vehicleClass}`}
          key={vehicleClass}
        >
          {vehicleClass === 'truck' ? (
            <>
              <div className="search-subcats" role="list">
                {truckSubs.map((sub, i) => {
                  const Icon = sub.icon;
                  const active = segment === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      role="listitem"
                      className={`search-subcat${active ? ' is-active' : ''}`}
                      style={{ animationDelay: `${i * 35}ms` }}
                      aria-pressed={active}
                      onClick={() => setSegment(active ? '' : sub.id)}
                    >
                      <span className="search-subcat__icon" aria-hidden="true">
                        <Icon size={26} strokeWidth={1.6} />
                      </span>
                      <span className="search-subcat__label">{sub.label}</span>
                    </button>
                  );
                })}
              </div>
              {panelFoot}
            </>
          ) : (
            <>
              <div
                className={`search-panel__grid search-panel__grid--${vehicleClass}`}
              >
                <SelectMenu
                  id={`${formId}-type`}
                  label={t('vehicleType')}
                  value={typeValue}
                  options={typeOptions}
                  onChange={onTypeChange}
                  placeholder={t('all')}
                  {...selectProps}
                />
                {brandModelFields}
                <SelectMenu
                  id={`${formId}-price`}
                  label={t('priceMax')}
                  value={priceMax}
                  options={priceOptions}
                  onChange={setPriceMax}
                  placeholder={t('anyPrice')}
                  {...selectProps}
                />
                <SelectMenu
                  id={`${formId}-year`}
                  label={t('yearMin')}
                  value={yearMin}
                  options={yearOptions}
                  onChange={setYearMin}
                  placeholder={t('anyYear')}
                  searchable
                  searchPlaceholder={t('searchYear')}
                  {...selectProps}
                />
                <SelectMenu
                  id={`${formId}-mileage`}
                  label={t('mileageMax')}
                  value={mileageMax}
                  options={mileageOptions}
                  onChange={setMileageMax}
                  placeholder={t('anyMileage')}
                  {...selectProps}
                />
                {vehicleClass === 'car' ? (
                  <SelectMenu
                    id={`${formId}-transmission`}
                    label={t('transmission')}
                    value={transmission}
                    options={transmissionOptions}
                    onChange={setTransmission}
                    placeholder={t('all')}
                    {...selectProps}
                  />
                ) : null}
                <SelectMenu
                  id={`${formId}-country`}
                  label={t('country')}
                  value={country}
                  options={countryOptions}
                  onChange={setCountry}
                  placeholder={t('all')}
                  {...selectProps}
                />
              </div>
              {panelFoot}
            </>
          )}
        </div>
      </form>
    </div>
  );
}
