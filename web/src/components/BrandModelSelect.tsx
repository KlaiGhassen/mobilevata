'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SelectMenu } from '@/components/SelectMenu';
import { useBrands, useModels } from '@/hooks/use-catalog';

type Props = {
  brandId: string;
  modelId: string;
  onBrandChange: (brandId: string) => void;
  onModelChange: (modelId: string) => void;
  brandError?: string;
  modelError?: string;
  required?: boolean;
};

export function BrandModelSelect({
  brandId,
  modelId,
  onBrandChange,
  onModelChange,
  brandError,
  modelError,
}: Props) {
  const ts = useTranslations('search');
  const { data: brands = [] } = useBrands();
  const { data: models = [] } = useModels(brandId);

  const brandOptions = useMemo(
    () => brands.map((b) => ({ value: b.id, label: b.name })),
    [brands],
  );
  const modelOptions = useMemo(
    () => models.map((m) => ({ value: m.id, label: m.name })),
    [models],
  );

  return (
    <div className="sell-form__row">
      <div>
        <SelectMenu
          label={ts('make')}
          value={brandId}
          options={brandOptions}
          onChange={(v) => {
            onBrandChange(v);
            onModelChange('');
          }}
          searchable
          clearable
        />
        {brandError ? (
          <p className="field-error" role="alert">
            {brandError}
          </p>
        ) : null}
      </div>
      <div>
        <SelectMenu
          label={ts('model')}
          value={modelId}
          options={modelOptions}
          onChange={onModelChange}
          disabled={!brandId}
          searchable
          clearable
        />
        {modelError ? (
          <p className="field-error" role="alert">
            {modelError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
