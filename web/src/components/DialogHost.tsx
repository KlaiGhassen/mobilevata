'use client';

import { useEffect, useId, useRef } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUiStore } from '@/stores/ui-store';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DialogHost() {
  const t = useTranslations('common');
  const dialog = useUiStore((s) => s.dialog);
  const closeDialog = useUiStore((s) => s.closeDialog);
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!dialog) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const focusables = panel
      ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      : [];
    const preferred =
      focusables.find((el) => el.dataset.dialogPrimary === 'true') ||
      focusables[0];
    preferred?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDialog(dialog.variant === 'alert');
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [dialog, closeDialog]);

  if (!dialog) return null;

  const tone = dialog.tone ?? 'info';
  const isConfirm = dialog.variant === 'confirm';
  const Icon =
    tone === 'danger'
      ? AlertTriangle
      : tone === 'success'
        ? CheckCircle2
        : tone === 'info' && !isConfirm
          ? Info
          : AlertCircle;

  const confirmLabel =
    dialog.confirmLabel || (isConfirm ? t('confirm') : t('ok'));
  const cancelLabel = dialog.cancelLabel || t('cancel');

  return (
    <div className="app-dialog-root" role="presentation">
      <button
        type="button"
        className="app-dialog__backdrop"
        aria-label={t('close')}
        onClick={() => closeDialog(dialog.variant === 'alert')}
      />
      <div
        ref={panelRef}
        className={`app-dialog app-dialog--${tone}`}
        role={isConfirm || tone === 'danger' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={dialog.description ? descId : undefined}
      >
        <div className="app-dialog__header">
          <span className={`app-dialog__icon app-dialog__icon--${tone}`} aria-hidden="true">
            <Icon size={20} />
          </span>
          <h2 id={titleId} className="app-dialog__title">
            {dialog.title}
          </h2>
          <button
            type="button"
            className="app-dialog__close"
            aria-label={t('close')}
            onClick={() => closeDialog(dialog.variant === 'alert')}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {dialog.description ? (
          <p id={descId} className="app-dialog__body">
            {dialog.description}
          </p>
        ) : null}

        <div className="app-dialog__actions">
          {isConfirm ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => closeDialog(false)}
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={
              tone === 'danger' ? 'btn btn-danger-fill' : 'btn btn-primary'
            }
            data-dialog-primary="true"
            onClick={() => closeDialog(true)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
