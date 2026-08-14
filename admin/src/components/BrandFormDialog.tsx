'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { ImageDropzone } from '@/components/ImageDropzone';
import { useUploadImages } from '@/hooks/use-admin-api';
import type { AdminBrand } from '@/lib/api';

export type BrandFormValues = {
  name: string;
  popular: boolean;
  logoUrl: string | null;
};

type BrandFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  brand?: AdminBrand | null;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: BrandFormValues) => void | Promise<void>;
};

export function BrandFormDialog({
  open,
  mode,
  brand,
  saving = false,
  error,
  onClose,
  onSubmit,
}: BrandFormDialogProps) {
  const upload = useUploadImages();
  const [name, setName] = useState('');
  const [popular, setPopular] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && brand) {
      setName(brand.name);
      setPopular(Boolean(brand.popular));
      setLogoUrl(brand.logoUrl ?? null);
      return;
    }
    setName('');
    setPopular(false);
    setLogoUrl(null);
  }, [open, mode, brand]);

  const title = mode === 'create' ? 'Add brand' : 'Edit brand';
  const description =
    mode === 'create'
      ? 'Create a catalog brand with an optional logo.'
      : 'Update name, popularity, and logo.';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving || upload.isPending) return;
    void onSubmit({
      name: name.trim(),
      popular,
      logoUrl,
    });
  };

  return (
    <Dialog
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      size="md"
      footer={
        <div className="dialog__footer-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="brand-form-dialog"
            className="btn btn-primary"
            disabled={saving || upload.isPending || !name.trim()}
          >
            {saving
              ? mode === 'create'
                ? 'Creating…'
                : 'Saving…'
              : mode === 'create'
                ? 'Create brand'
                : 'Save changes'}
          </button>
        </div>
      }
    >
      <form id="brand-form-dialog" className="stack" onSubmit={handleSubmit}>
        <ImageDropzone
          label="Brand logo"
          valueUrl={logoUrl}
          previewName={name || brand?.name || 'Brand'}
          uploading={upload.isPending}
          disabled={saving}
          error={
            upload.error ? (upload.error as Error).message : null
          }
          onFile={async (file) => {
            const result = await upload.mutateAsync([file]);
            if (!result.urls[0]) throw new Error('Upload returned no URL');
            setLogoUrl(result.urls[0]);
          }}
          onClear={() => setLogoUrl(null)}
        />

        <div className="field">
          <label htmlFor="brand-dialog-name">Name</label>
          <input
            id="brand-dialog-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Volkswagen"
            required
            maxLength={80}
            disabled={saving}
          />
        </div>

        <div className="field">
          <label htmlFor="brand-dialog-popular">Popular</label>
          <select
            id="brand-dialog-popular"
            value={popular ? '1' : '0'}
            onChange={(e) => setPopular(e.target.value === '1')}
            disabled={saving}
          >
            <option value="0">No — standard listing</option>
            <option value="1">Yes — highlight in marketplace</option>
          </select>
        </div>

        {error ? (
          <div className="alert" role="alert">
            {error}
          </div>
        ) : null}
      </form>
    </Dialog>
  );
}
