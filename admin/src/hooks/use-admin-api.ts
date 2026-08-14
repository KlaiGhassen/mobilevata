'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useFiltersStore } from '@/stores/filters-store';

export const adminKeys = {
  stats: ['admin-stats'] as const,
  users: (f: unknown) => ['admin-users', f] as const,
  user: (id: string) => ['admin-user', id] as const,
  vehicles: (f: unknown) => ['admin-vehicles', f] as const,
  vehicle: (id: string) => ['admin-vehicle', id] as const,
  dealers: (f: unknown) => ['admin-dealers', f] as const,
  brands: (f: unknown) => ['admin-brands', f] as const,
  reclamations: (f: unknown) => ['admin-reclamations', f] as const,
  reclamation: (id: string) => ['admin-reclamation', id] as const,
};

export function useAdminStats(enabled = true) {
  return useQuery({
    queryKey: adminKeys.stats,
    queryFn: () => adminApi.stats(),
    enabled,
    refetchInterval: enabled ? 60_000 : false,
  });
}

export function useAdminUsers() {
  const filters = useFiltersStore((s) => s.users);
  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: () =>
      adminApi.users({
        q: filters.q || undefined,
        role: filters.role || undefined,
        status: filters.status || undefined,
        page: filters.page,
        limit: 20,
      }),
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: () => adminApi.user(id),
    enabled: Boolean(id),
  });
}

export function useAdminVehicles() {
  const filters = useFiltersStore((s) => s.vehicles);
  return useQuery({
    queryKey: adminKeys.vehicles(filters),
    queryFn: () =>
      adminApi.vehicles({
        q: filters.q || undefined,
        published:
          filters.published === ''
            ? undefined
            : filters.published === 'true',
        page: filters.page,
        limit: 20,
      }),
  });
}

export function useAdminVehicle(id: string) {
  return useQuery({
    queryKey: adminKeys.vehicle(id),
    queryFn: () => adminApi.vehicle(id),
    enabled: Boolean(id),
  });
}

export function useAdminDealers() {
  const filters = useFiltersStore((s) => s.dealers);
  return useQuery({
    queryKey: adminKeys.dealers(filters),
    queryFn: () =>
      adminApi.dealers({
        q: filters.q || undefined,
        verified:
          filters.verified === ''
            ? undefined
            : filters.verified === 'true',
        page: filters.page,
        limit: 20,
      }),
  });
}

export function useAdminBrands() {
  const filters = useFiltersStore((s) => s.brands);
  return useQuery({
    queryKey: adminKeys.brands(filters),
    queryFn: () =>
      adminApi.brands({
        q: filters.q || undefined,
        popular:
          filters.popular === ''
            ? undefined
            : filters.popular === 'true',
        sort: filters.sort || 'name',
        page: filters.page,
        limit: 24,
      }),
  });
}

export function useAdminReclamations() {
  const filters = useFiltersStore((s) => s.reclamations);
  return useQuery({
    queryKey: adminKeys.reclamations(filters),
    queryFn: () =>
      adminApi.reclamations({
        q: filters.q || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        page: filters.page,
        limit: 20,
      }),
  });
}

export function useAdminReclamation(id: string) {
  return useQuery({
    queryKey: adminKeys.reclamation(id),
    queryFn: () => adminApi.reclamation(id),
    enabled: Boolean(id),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      adminApi.updateUser(id, body),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['admin-users'] });
      void qc.invalidateQueries({ queryKey: adminKeys.user(vars.id) });
      void qc.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      adminApi.updateVehicle(id, body),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['admin-vehicles'] });
      void qc.invalidateQueries({ queryKey: adminKeys.vehicle(vars.id) });
      void qc.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteVehicle(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: ['admin-vehicles'] });
      void qc.invalidateQueries({ queryKey: adminKeys.vehicle(id) });
      void qc.invalidateQueries({ queryKey: ['admin-user'] });
      void qc.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}

export function useUpdateDealer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      adminApi.updateDealer(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-dealers'] });
      void qc.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}

export function useDeleteDealer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteDealer(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-dealers'] });
      void qc.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      popular?: boolean;
      logoUrl?: string | null;
    }) => adminApi.createBrand(body),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ['admin-brands'] }),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      adminApi.updateBrand(id, body),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ['admin-brands'] }),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteBrand(id),
    onSuccess: () =>
      void qc.invalidateQueries({ queryKey: ['admin-brands'] }),
  });
}

export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => adminApi.createAdmin(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-users'] });
      void qc.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}

export function useUploadImages() {
  return useMutation({
    mutationFn: (files: File[]) => adminApi.uploadImages(files),
  });
}

export function useUpdateReclamation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      adminApi.updateReclamation(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.reclamation(id) });
      void qc.invalidateQueries({ queryKey: ['admin-reclamations'] });
      void qc.invalidateQueries({ queryKey: adminKeys.stats });
    },
  });
}

export function useReindex() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adminApi.reindex(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: adminKeys.stats }),
  });
}
