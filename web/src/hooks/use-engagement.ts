'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, type Vehicle } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export type FavoriteRow = { id: string; vehicle: Vehicle };

type ToggleArgs = {
  vehicleId: string;
  /** Snapshot taken before optimistic update */
  shouldRemove: boolean;
};

export function useFavorites(token: string | null) {
  return useQuery({
    queryKey: queryKeys.favorites(),
    queryFn: () => client.favorites(token!),
    enabled: Boolean(token),
  });
}

export function useCompare(token: string | null) {
  return useQuery({
    queryKey: queryKeys.compare(),
    queryFn: () => client.compare(token!),
    enabled: Boolean(token),
  });
}

export function useToggleFavorite(token: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ vehicleId, shouldRemove }: ToggleArgs) => {
      if (!token) throw new Error('CONNECT');
      if (shouldRemove) {
        await client.removeFavorite(token, vehicleId);
        return { vehicleId, added: false as const };
      }
      await client.addFavorite(token, vehicleId);
      return { vehicleId, added: true as const };
    },
    onMutate: async ({ vehicleId, shouldRemove }) => {
      await qc.cancelQueries({ queryKey: queryKeys.favorites() });
      const prev = qc.getQueryData<FavoriteRow[]>(queryKeys.favorites());
      qc.setQueryData<FavoriteRow[]>(queryKeys.favorites(), (old = []) => {
        if (shouldRemove) {
          return old.filter((f) => f.vehicle?.id !== vehicleId);
        }
        if (old.some((f) => f.vehicle?.id === vehicleId)) return old;
        return [
          ...old,
          {
            id: `optimistic-${vehicleId}`,
            vehicle: { id: vehicleId } as Vehicle,
          },
        ];
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.favorites(), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.favorites() });
    },
  });
}

export function useToggleCompare(token: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ vehicleId, shouldRemove }: ToggleArgs) => {
      if (!token) throw new Error('CONNECT');
      if (shouldRemove) {
        return client.removeCompare(token, vehicleId);
      }
      return client.addCompare(token, vehicleId);
    },
    onMutate: async ({ vehicleId, shouldRemove }) => {
      await qc.cancelQueries({ queryKey: queryKeys.compare() });
      const prev = qc.getQueryData<Vehicle[]>(queryKeys.compare());
      qc.setQueryData<Vehicle[]>(queryKeys.compare(), (old = []) => {
        if (shouldRemove) {
          return old.filter((v) => v.id !== vehicleId);
        }
        if (old.some((v) => v.id === vehicleId)) return old;
        if (old.length >= 3) return old;
        return [...old, { id: vehicleId } as Vehicle];
      });
      return { prev };
    },
    onSuccess: (list) => {
      if (Array.isArray(list)) {
        qc.setQueryData(queryKeys.compare(), list);
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.compare(), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.compare() });
    },
  });
}
