'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/Alert';
import { BrandModelSelect } from '@/components/BrandModelSelect';
import { FormField } from '@/components/FormField';
import { FormSection } from '@/components/FormSection';
import { ImageUploader } from '@/components/ImageUploader';
import { PageHeader, PageShell } from '@/components/PageShell';
import { SelectMenu } from '@/components/SelectMenu';
import { useBrands, useModels } from '@/hooks/use-catalog';
import {
  BODY_TYPES,
  COLORS,
  FUEL_TYPES,
  TRANSMISSIONS,
} from '@/lib/catalog-options';
import type { Vehicle } from '@/lib/api';

export type SellFormState = {
  brandId: string;
  modelId: string;
  title: string;
  description: string;
  price: string;
  year: string;
  mileage: string;
  fuelType: string;
  transmission: string;
  bodyType: string;
  color: string;
  city: string;
  country: string;
  powerHp: string;
  hasServiceBook: boolean;
  hasWarranty: boolean;
  images: string[];
};

type FieldErrors = Partial<Record<string, string>>;

const STEPS = ['vehicle', 'specs', 'location', 'details', 'photos'] as const;
type StepKey = (typeof STEPS)[number];

export const emptyListingForm: SellFormState = {
  brandId: '',
  modelId: '',
  title: '',
  description: '',
  price: '',
  year: '2020',
  mileage: '',
  fuelType: 'petrol',
  transmission: 'manual',
  bodyType: 'sedan',
  color: 'black',
  city: '',
  country: 'Germany',
  powerHp: '',
  hasServiceBook: true,
  hasWarranty: false,
  images: [],
};

export function vehicleToForm(v: Vehicle): SellFormState {
  return {
    brandId: v.brand?.id || '',
    modelId: v.model?.id || '',
    title: v.title || '',
    description: v.description || '',
    price: String(v.price ?? ''),
    year: String(v.year ?? ''),
    mileage: String(v.mileage ?? ''),
    fuelType: v.fuelType || 'petrol',
    transmission: v.transmission || 'manual',
    bodyType: v.bodyType || 'sedan',
    color: v.color || 'black',
    city: v.city || '',
    country: v.country || 'Germany',
    powerHp: v.powerHp != null ? String(v.powerHp) : '',
    hasServiceBook: Boolean(v.hasServiceBook),
    hasWarranty: Boolean(v.hasWarranty),
    images: v.images?.length ? [...v.images] : [],
  };
}

type Props = {
  token: string;
  mode: 'create' | 'edit';
  initial?: SellFormState;
  submitting?: boolean;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
};

export function VehicleListingForm({
  token,
  mode,
  initial = emptyListingForm,
  submitting = false,
  onSubmit,
}: Props) {
  const t = useTranslations('sell');
  const tv = useTranslations('vehicle');
  const ta = useTranslations('auth');
  const tFuel = useTranslations('fuels');
  const tTrans = useTranslations('transmissions');
  const tBody = useTranslations('bodyTypes');
  const tColor = useTranslations('colors');
  const [form, setForm] = useState<SellFormState>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [step, setStep] = useState(0);

  const { data: brands = [] } = useBrands();
  const { data: models = [] } = useModels(form.brandId);

  const fuelOptions = useMemo(
    () => FUEL_TYPES.map((f) => ({ value: f, label: tFuel(f) })),
    [tFuel],
  );
  const transmissionOptions = useMemo(
    () => TRANSMISSIONS.map((tr) => ({ value: tr, label: tTrans(tr) })),
    [tTrans],
  );
  const bodyOptions = useMemo(
    () => BODY_TYPES.map((b) => ({ value: b, label: tBody(b) })),
    [tBody],
  );
  const colorOptions = useMemo(
    () => COLORS.map((c) => ({ value: c, label: tColor(c) })),
    [tColor],
  );

  const set = <K extends keyof SellFormState>(
    key: K,
    value: SellFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateStep = (index: number): FieldErrors => {
    const next: FieldErrors = {};
    const key = STEPS[index];
    if (key === 'vehicle') {
      if (!form.brandId) next.brandId = t('errors.required');
      if (!form.modelId) next.modelId = t('errors.required');
      if (!form.year || Number(form.year) < 1950) next.year = t('errors.year');
    }
    if (key === 'specs') {
      if (form.mileage === '' || Number(form.mileage) < 0) {
        next.mileage = t('errors.mileage');
      }
    }
    if (key === 'location') {
      if (!form.price || Number(form.price) <= 0) next.price = t('errors.price');
      if (!form.city.trim()) next.city = t('errors.required');
      if (!form.country.trim()) next.country = t('errors.required');
    }
    if (key === 'details') {
      if (!form.description.trim()) next.description = t('errors.required');
    }
    return next;
  };

  const goToStep = (index: number) => {
    if (index < 0 || index >= STEPS.length) return;
    if (index > step) {
      for (let i = step; i < index; i += 1) {
        const stepErrors = validateStep(i);
        if (Object.keys(stepErrors).length) {
          setErrors(stepErrors);
          setStep(i);
          return;
        }
      }
    }
    setErrors({});
    setFormError('');
    setStep(index);
  };

  const handleNext = () => {
    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setErrors({});
    setFormError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    for (let i = 0; i < STEPS.length; i += 1) {
      const stepErrors = validateStep(i);
      if (Object.keys(stepErrors).length) {
        setErrors(stepErrors);
        setStep(i);
        return;
      }
    }

    const brandName = brands.find((b) => b.id === form.brandId)?.name || '';
    const modelName = models.find((m) => m.id === form.modelId)?.name || '';
    const images = form.images.filter(Boolean);

    try {
      await onSubmit({
        brandId: form.brandId,
        modelId: form.modelId,
        title:
          form.title.trim() ||
          `${brandName} ${modelName} ${form.year}`.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        year: Number(form.year),
        mileage: Number(form.mileage),
        fuelType: form.fuelType,
        transmission: form.transmission,
        bodyType: form.bodyType,
        color: form.color,
        city: form.city.trim(),
        country: form.country.trim(),
        powerHp: form.powerHp ? Number(form.powerHp) : undefined,
        hasServiceBook: form.hasServiceBook,
        hasWarranty: form.hasWarranty,
        images,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error');
    }
  };

  const currentKey: StepKey = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <PageShell form>
      <PageHeader
        title={mode === 'edit' ? t('editTitle') : t('title')}
        description={mode === 'edit' ? t('editLead') : t('lead')}
      />

      <form className="sell-form" onSubmit={handleSubmit} noValidate>
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <nav className="sell-stepper" aria-label={t('stepperLabel')}>
          <ol className="sell-stepper__list">
            {STEPS.map((key, index) => {
              const done = index < step;
              const current = index === step;
              return (
                <li key={key} className="sell-stepper__item">
                  <button
                    type="button"
                    className={`sell-stepper__btn${done ? ' is-done' : ''}${current ? ' is-current' : ''}`}
                    aria-current={current ? 'step' : undefined}
                    onClick={() => goToStep(index)}
                  >
                    <span className="sell-stepper__num" aria-hidden="true">
                      {done ? <Check size={14} strokeWidth={3} /> : index + 1}
                    </span>
                    <span className="sell-stepper__label">
                      {t(`sections.${key}`)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div
            className="sell-stepper__progress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
            aria-label={t('stepOf', { current: step + 1, total: STEPS.length })}
          >
            <span
              className="sell-stepper__bar"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </nav>

        <p className="sell-form__step-meta">
          {t('stepOf', { current: step + 1, total: STEPS.length })}
        </p>

        {currentKey === 'vehicle' ? (
          <FormSection
            step={1}
            title={t('sections.vehicle')}
            description={t('sections.vehicleDesc')}
          >
            <BrandModelSelect
              brandId={form.brandId}
              modelId={form.modelId}
              onBrandChange={(v) => set('brandId', v)}
              onModelChange={(v) => set('modelId', v)}
              brandError={errors.brandId}
              modelError={errors.modelId}
            />
            <FormField label={t('adTitle')} hint={t('adTitleHint')}>
              {({ id, describedBy }) => (
                <input
                  id={id}
                  value={form.title}
                  aria-describedby={describedBy}
                  onChange={(e) => set('title', e.target.value)}
                />
              )}
            </FormField>
            <div className="sell-form__row">
              <FormField label={tv('year')} error={errors.year}>
                {({ id, describedBy }) => (
                  <input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    required
                    aria-invalid={Boolean(errors.year)}
                    aria-describedby={describedBy}
                    value={form.year}
                    onChange={(e) => set('year', e.target.value)}
                  />
                )}
              </FormField>
              <SelectMenu
                label={tv('body')}
                value={form.bodyType}
                options={bodyOptions}
                onChange={(v) => set('bodyType', v)}
              />
            </div>
          </FormSection>
        ) : null}

        {currentKey === 'specs' ? (
          <FormSection
            step={2}
            title={t('sections.specs')}
            description={t('sections.specsDesc')}
          >
            <div className="sell-form__row sell-form__row--3">
              <SelectMenu
                label={tv('fuel')}
                value={form.fuelType}
                options={fuelOptions}
                onChange={(v) => set('fuelType', v)}
              />
              <SelectMenu
                label={tv('gearbox')}
                value={form.transmission}
                options={transmissionOptions}
                onChange={(v) => set('transmission', v)}
              />
              <SelectMenu
                label={t('color')}
                value={form.color}
                options={colorOptions}
                onChange={(v) => set('color', v)}
              />
            </div>
            <div className="sell-form__row">
              <FormField label={tv('mileage')} error={errors.mileage}>
                {({ id, describedBy }) => (
                  <input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    required
                    aria-invalid={Boolean(errors.mileage)}
                    aria-describedby={describedBy}
                    value={form.mileage}
                    onChange={(e) => set('mileage', e.target.value)}
                  />
                )}
              </FormField>
              <FormField label={t('powerHp')}>
                {({ id }) => (
                  <input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    value={form.powerHp}
                    onChange={(e) => set('powerHp', e.target.value)}
                  />
                )}
              </FormField>
            </div>
          </FormSection>
        ) : null}

        {currentKey === 'location' ? (
          <FormSection
            step={3}
            title={t('sections.location')}
            description={t('sections.locationDesc')}
          >
            <div className="sell-form__row sell-form__row--3">
              <FormField label={t('price')} error={errors.price}>
                {({ id, describedBy }) => (
                  <input
                    id={id}
                    type="number"
                    inputMode="numeric"
                    required
                    aria-invalid={Boolean(errors.price)}
                    aria-describedby={describedBy}
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                  />
                )}
              </FormField>
              <FormField label={t('city')} error={errors.city}>
                {({ id, describedBy }) => (
                  <input
                    id={id}
                    required
                    aria-invalid={Boolean(errors.city)}
                    aria-describedby={describedBy}
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                  />
                )}
              </FormField>
              <FormField label={t('country')} error={errors.country}>
                {({ id, describedBy }) => (
                  <input
                    id={id}
                    required
                    aria-invalid={Boolean(errors.country)}
                    aria-describedby={describedBy}
                    value={form.country}
                    onChange={(e) => set('country', e.target.value)}
                  />
                )}
              </FormField>
            </div>
          </FormSection>
        ) : null}

        {currentKey === 'details' ? (
          <FormSection
            step={4}
            title={t('sections.details')}
            description={t('sections.detailsDesc')}
          >
            <FormField label={tv('description')} error={errors.description}>
              {({ id, describedBy }) => (
                <textarea
                  id={id}
                  rows={5}
                  required
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={describedBy}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              )}
            </FormField>
            <div className="sell-form__checks">
              <label className="sell-form__check">
                <input
                  type="checkbox"
                  checked={form.hasServiceBook}
                  onChange={(e) => set('hasServiceBook', e.target.checked)}
                />
                {tv('serviceBook')}
              </label>
              <label className="sell-form__check">
                <input
                  type="checkbox"
                  checked={form.hasWarranty}
                  onChange={(e) => set('hasWarranty', e.target.checked)}
                />
                {tv('warranty')}
              </label>
            </div>
          </FormSection>
        ) : null}

        {currentKey === 'photos' ? (
          <FormSection
            step={5}
            title={t('sections.photos')}
            description={t('sections.photosDesc')}
          >
            <ImageUploader
              token={token}
              value={form.images}
              onChange={(urls) => set('images', urls)}
            />
          </FormSection>
        ) : null}

        <div className="sell-form__actions">
          {step > 0 ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleBack}
              disabled={submitting}
            >
              <ChevronLeft size={18} aria-hidden="true" />
              {t('back')}
            </button>
          ) : (
            <span />
          )}

          {isLast ? (
            <button
              className="btn btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? ta('creating')
                : mode === 'edit'
                  ? t('save')
                  : t('publish')}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
            >
              {t('continue')}
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </form>
    </PageShell>
  );
}
