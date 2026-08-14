'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml';
const MAX_BYTES = 5 * 1024 * 1024;

type ImageDropzoneProps = {
  label?: string;
  valueUrl: string | null;
  previewName?: string;
  uploading?: boolean;
  disabled?: boolean;
  error?: string | null;
  onFile: (file: File) => void | Promise<void>;
  onClear: () => void;
};

function isImageFile(file: File) {
  return (
    file.type.startsWith('image/') ||
    /\.(png|jpe?g|webp|svg)$/i.test(file.name)
  );
}

export function ImageDropzone({
  label = 'Logo',
  valueUrl,
  previewName = 'Brand',
  uploading = false,
  disabled = false,
  error,
  onFile,
  onClear,
}: ImageDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  useEffect(() => {
    if (valueUrl && localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
  }, [valueUrl, localPreview]);

  const displaySrc = localPreview || valueUrl;

  const handleFiles = async (files: FileList | File[] | null) => {
    const file = files?.[0];
    if (!file) return;
    setLocalError(null);
    if (!isImageFile(file)) {
      setLocalError('Use PNG, JPG, WebP, or SVG.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError('Image must be 5 MB or smaller.');
      return;
    }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
    try {
      await onFile(file);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const busy = disabled || uploading;

  return (
    <div className="image-dropzone">
      <div className="image-dropzone__label-row">
        <span className="image-dropzone__label">{label}</span>
        {displaySrc ? (
          <button
            type="button"
            className="btn btn-ghost image-dropzone__clear"
            disabled={busy}
            onClick={() => {
              if (localPreview) URL.revokeObjectURL(localPreview);
              setLocalPreview(null);
              setLocalError(null);
              onClear();
            }}
          >
            <Trash2 size={14} aria-hidden="true" />
            Remove
          </button>
        ) : null}
      </div>

      <div
        className={`image-dropzone__area${dragging ? ' is-dragging' : ''}${displaySrc ? ' has-preview' : ''}${busy ? ' is-busy' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!busy) setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!busy) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          if (busy) return;
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          hidden
          disabled={busy}
          onChange={(e) => {
            void handleFiles(e.target.files).finally(() => {
              e.target.value = '';
            });
          }}
        />

        {displaySrc ? (
          <div className="image-dropzone__preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displaySrc} alt={`${previewName} logo preview`} />
            {uploading ? (
              <div className="image-dropzone__overlay">Uploading…</div>
            ) : null}
          </div>
        ) : (
          <div className="image-dropzone__empty">
            <span className="image-dropzone__icon" aria-hidden="true">
              <ImagePlus size={28} strokeWidth={1.6} />
            </span>
            <p>
              <strong>Drag & drop</strong> a logo here, or
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={16} aria-hidden="true" />
              Browse files
            </button>
            <small className="muted">PNG, JPG, WebP, SVG · max 5 MB</small>
          </div>
        )}

        {displaySrc && !uploading ? (
          <div className="image-dropzone__actions">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={16} aria-hidden="true" />
              Replace
            </button>
          </div>
        ) : null}
      </div>

      {localError || error ? (
        <p className="image-dropzone__error" role="alert">
          {localError || error}
        </p>
      ) : null}
    </div>
  );
}
