'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCreateVehicle(token: string | null | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      if (!token) throw new Error('Not authenticated');
      return client.createVehicle(token, data);
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['vehicles'] }),
        qc.invalidateQueries({ queryKey: queryKeys.myVehicles() }),
        qc.invalidateQueries({ queryKey: queryKeys.stats() }),
      ]);
    },
  });
}

export function useUpdateVehicle(token: string | null | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => {
      if (!token) throw new Error('Not authenticated');
      return client.updateVehicle(token, id, data);
    },
    onSuccess: async (_vehicle, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['vehicles'] }),
        qc.invalidateQueries({ queryKey: queryKeys.vehicle(vars.id) }),
        qc.invalidateQueries({ queryKey: queryKeys.myVehicles() }),
        qc.invalidateQueries({ queryKey: queryKeys.stats() }),
      ]);
    },
  });
}

export function useDeleteVehicle(token: string | null | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      if (!token) throw new Error('Not authenticated');
      return client.deleteVehicle(token, id);
    },
    onSuccess: async (_res, id) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['vehicles'] }),
        qc.invalidateQueries({ queryKey: queryKeys.vehicle(id) }),
        qc.invalidateQueries({ queryKey: queryKeys.myVehicles() }),
        qc.invalidateQueries({ queryKey: queryKeys.stats() }),
      ]);
    },
  });
}
