'use client';

import {
  DragEvent,
  useId,
  useRef,
  useState,
} from 'react';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Alert } from '@/components/Alert';
import { client } from '@/lib/api';

type Props = {
  token: string;
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
};

export function ImageUploader({
  token,
  value,
  onChange,
  maxFiles = 12,
}: Props) {
  const t = useTranslations('sell');
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const remaining = maxFiles - value.length;
  const canAdd = remaining > 0 && !uploading;

  const onFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList || remaining <= 0) return;
    setError('');
    const files = Array.from(fileList).slice(0, remaining);
    if (!files.length) return;

    const invalid = files.find(
      (f) => !f.type.startsWith('image/') || f.size > 5 * 1024 * 1024,
    );
    if (invalid) {
      setError(t('uploadInvalid'));
      return;
    }

    setUploading(true);
    try {
      const { urls } = await client.uploadImages(token, files);
      onChange([...value, ...urls].slice(0, maxFiles));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('uploadFailed'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    if (canAdd) setDragging(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canAdd) e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setDragging(false);
    if (!canAdd) return;
    void onFiles(e.dataTransfer.files);
  };

  return (
    <div className="image-uploader">
      {error ? <Alert tone="error">{error}</Alert> : null}

      {remaining > 0 ? (
        <label
          htmlFor={inputId}
          className={`image-uploader__dropzone${dragging ? ' is-dragging' : ''}${uploading ? ' is-busy' : ''}`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <span className="image-uploader__drop-icon" aria-hidden="true">
            {uploading ? (
              <Loader2 size={28} className="spin" />
            ) : (
              <Upload size={28} />
            )}
          </span>
          <span className="image-uploader__drop-title">
            {uploading
              ? t('uploading')
              : dragging
                ? t('dropHere')
                : t('dragDrop')}
          </span>
          <span className="image-uploader__hint">
            {t('uploadHint', { count: remaining })}
          </span>
          <span className="image-uploader__browse">{t('browseFiles')}</span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={uploading}
            className="visually-hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
      ) : null}

      {value.length > 0 ? (
        <div className="image-uploader__grid">
          {value.map((url, index) => (
            <figure key={`${url}-${index}`} className="image-uploader__item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="image-uploader__preview" />
              <button
                type="button"
                className="image-uploader__remove"
                onClick={() => removeAt(index)}
                aria-label={t('removePhoto')}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
              {index === 0 ? (
                <span className="image-uploader__cover">{t('coverPhoto')}</span>
              ) : (
                <span className="image-uploader__index" aria-hidden="true">
                  {index + 1}
                </span>
              )}
            </figure>
          ))}
        </div>
      ) : (
        <p className="image-uploader__empty">
          <ImagePlus size={16} aria-hidden="true" />
          {t('uploadEmpty')}
        </p>
      )}
    </div>
  );
}
