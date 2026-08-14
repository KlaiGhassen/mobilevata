'use client';

import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

export type DialogTone = 'info' | 'danger' | 'success';
export type DialogVariant = 'alert' | 'confirm';

export type DialogOptions = {
  variant?: DialogVariant;
  title: string;
  description?: string;
  tone?: DialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
};

type DialogState = DialogOptions & {
  id: string;
  resolve: (confirmed: boolean) => void;
};

type UiState = {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  toasts: Toast[];
  pushToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: string) => void;
  dialog: DialogState | null;
  openDialog: (options: DialogOptions) => Promise<boolean>;
  closeDialog: (confirmed: boolean) => void;
};

export const useUiStore = create<UiState>((set, get) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  toggleMobileNav: () => set({ mobileNavOpen: !get().mobileNavOpen }),
  toasts: [],
  pushToast: (message, tone = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    window.setTimeout(() => {
      get().dismissToast(id);
    }, 4200);
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  dialog: null,
  openDialog: (options) =>
    new Promise<boolean>((resolve) => {
      const prev = get().dialog;
      if (prev) prev.resolve(false);
      set({
        dialog: {
          variant: options.variant ?? 'alert',
          tone: options.tone ?? 'info',
          title: options.title,
          description: options.description,
          confirmLabel: options.confirmLabel,
          cancelLabel: options.cancelLabel,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          resolve,
        },
      });
    }),
  closeDialog: (confirmed) => {
    const current = get().dialog;
    if (!current) return;
    set({ dialog: null });
    current.resolve(confirmed);
  },
}));

/** Information dialog (replaces `window.alert`). */
export function alertDialog(options: DialogOptions): Promise<boolean> {
  return useUiStore.getState().openDialog({
    ...options,
    variant: 'alert',
  });
}

/** Confirmation dialog (replaces `window.confirm`). Resolves `true` if confirmed. */
export function confirmDialog(options: DialogOptions): Promise<boolean> {
  return useUiStore.getState().openDialog({
    ...options,
    variant: 'confirm',
  });
}
