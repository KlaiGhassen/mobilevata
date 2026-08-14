'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/api';

/** Opaque client marker — real JWT lives in httpOnly cookie only. */
export const SESSION_MARKER = 'session';

type AuthState = {
  token: string | null;
  user: User | null;
  setSession: (user: User) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (user) => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({ token: SESSION_MARKER, user });
      },
      setUser: (user) => set({ user, token: SESSION_MARKER }),
      clearSession: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({ token: null, user: null });
      },
    }),
    {
      name: 'autovia.auth',
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        // Presence of persisted user → attempt cookie session on boot
        if (state.user) {
          state.token = SESSION_MARKER;
        }
      },
    },
  ),
);
