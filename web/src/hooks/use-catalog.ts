'use client';

import { useQuery } from '@tanstack/react-query';
import { client, type SearchParams } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useBrands(popular = false) {
  return useQuery({
    queryKey: queryKeys.brands(popular),
    queryFn: () => client.getBrands(popular),
  });
}

export function useModels(brandId: string) {
  return useQuery({
    queryKey: queryKeys.models(brandId),
    queryFn: () => client.getModels(brandId),
    enabled: Boolean(brandId),
  });
}

export function useVehicleSearch(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.vehicleSearch(params),
    queryFn: () => client.searchVehicles(params),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: queryKeys.vehicle(id),
    queryFn: () => client.getVehicle(id),
    enabled: Boolean(id),
  });
}

export function useMyVehicles(token: string | null) {
  return useQuery({
    queryKey: queryKeys.myVehicles(),
    queryFn: () => client.myVehicles(token!),
    enabled: Boolean(token),
  });
}

export function useDealers() {
  return useQuery({
    queryKey: queryKeys.dealers(),
    queryFn: () => client.getDealers(),
  });
}

export function useDealer(id: string) {
  return useQuery({
    queryKey: queryKeys.dealer(id),
    queryFn: () => client.getDealer(id),
    enabled: Boolean(id),
  });
}
