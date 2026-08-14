'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { disconnectChatSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';
import {
  useCompare,
  useFavorites,
  useToggleCompare,
  useToggleFavorite,
} from '@/hooks/use-engagement';

type AuthContextValue = {
  user: ReturnType<typeof useAuthStore.getState>['user'];
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => void;
  favoriteIds: Set<string>;
  toggleFavorite: (vehicleId: string) => Promise<void>;
  compareIds: string[];
  toggleCompare: (vehicleId: string) => Promise<void>;
  refreshLists: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations('common');
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [loading, setLoading] = useState(true);

  const favoritesQuery = useFavorites(token);
  const compareQuery = useCompare(token);
  const favoriteMutation = useToggleFavorite(token);
  const compareMutation = useToggleCompare(token);

  const favoriteIds = useMemo(
    () => new Set((favoritesQuery.data ?? []).map((f) => f.vehicle.id)),
    [favoritesQuery.data],
  );
  const compareIds = useMemo(
    () => (compareQuery.data ?? []).map((v) => v.id),
    [compareQuery.data],
  );

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const me = await client.me();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = window.setTimeout(boot, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [setUser, clearSession]);

  const refreshLists = useCallback(async () => {
    if (!token) {
      qc.removeQueries({ queryKey: queryKeys.favorites() });
      qc.removeQueries({ queryKey: queryKeys.compare() });
      return;
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.favorites() }),
      qc.invalidateQueries({ queryKey: queryKeys.compare() }),
    ]);
  }, [qc, token]);

  const login = async (email: string, password: string) => {
    const res = await client.login(email, password);
    setSession(res.user);
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.favorites() }),
      qc.invalidateQueries({ queryKey: queryKeys.compare() }),
      qc.invalidateQueries({ queryKey: queryKeys.myVehicles() }),
    ]);
    pushToast(t('toastSignedIn'), 'success');
  };

  const register = async (data: Record<string, string>) => {
    const res = await client.register(data);
    setSession(res.user);
    await Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.favorites() }),
      qc.invalidateQueries({ queryKey: queryKeys.compare() }),
    ]);
    pushToast(t('toastRegistered'), 'success');
  };

  const logout = () => {
    void client.logout().catch(() => undefined);
    clearSession();
    disconnectChatSocket();
    qc.removeQueries({ queryKey: queryKeys.favorites() });
    qc.removeQueries({ queryKey: queryKeys.compare() });
    qc.removeQueries({ queryKey: queryKeys.myVehicles() });
    qc.removeQueries({ queryKey: queryKeys.me() });
    pushToast(t('toastSignedOut'), 'info');
  };

  const toggleFavorite = async (vehicleId: string) => {
    const shouldRemove = favoriteIds.has(vehicleId);
    await favoriteMutation.mutateAsync({ vehicleId, shouldRemove });
    pushToast(shouldRemove ? t('toastFavRemove') : t('toastFavAdd'), 'success');
  };

  const toggleCompare = async (vehicleId: string) => {
    const shouldRemove = compareIds.includes(vehicleId);
    await compareMutation.mutateAsync({ vehicleId, shouldRemove });
    pushToast(
      shouldRemove ? t('toastCompareRemove') : t('toastCompareAdd'),
      'success',
    );
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      favoriteIds,
      toggleFavorite,
      compareIds,
      toggleCompare,
      refreshLists,
    }),
    // toggle* close over favoriteIds/compareIds + mutations; keep them in sync
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      user,
      token,
      loading,
      favoriteIds,
      compareIds,
      refreshLists,
      favoriteMutation,
      compareMutation,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
