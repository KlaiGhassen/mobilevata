'use client';

import { create } from 'zustand';
import { adminApi, isStaffRole, type AdminUser } from '@/lib/api';

type AuthState = {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
  setUser: (user: AdminUser | null) => void;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),

  bootstrap: async () => {
    set({ loading: true, error: null });
    try {
      const me = await adminApi.me();
      if (!isStaffRole(me.role)) {
        await adminApi.logout().catch(() => undefined);
        set({ user: null, loading: false });
        return;
      }
      set({ user: me, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    const { user: next } = await adminApi.login(email, password);
    if (!isStaffRole(next.role)) {
      await adminApi.logout().catch(() => undefined);
      throw new Error('Admin role required');
    }
    try {
      const me = await adminApi.me();
      if (!isStaffRole(me.role)) {
        await adminApi.logout().catch(() => undefined);
        throw new Error('Admin role required');
      }
      set({ user: me, loading: false });
    } catch {
      set({ user: null, loading: false });
      throw new Error(
        'Signed in but the session cookie was blocked. Use http://localhost:3001 and the /backend proxy.',
      );
    }
  },

  logout: async () => {
    await adminApi.logout().catch(() => undefined);
    set({ user: null, error: null });
  },
}));
