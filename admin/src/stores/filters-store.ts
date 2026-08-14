'use client';

import { create } from 'zustand';

type UsersFilters = {
  q: string;
  role: string;
  status: string;
  page: number;
};

type VehiclesFilters = {
  q: string;
  published: string;
  page: number;
};

type DealersFilters = {
  q: string;
  verified: string;
  page: number;
};

type BrandsFilters = {
  q: string;
  popular: string;
  sort: string;
  page: number;
};

type ReclamationsFilters = {
  q: string;
  status: string;
  priority: string;
  page: number;
};

type FiltersState = {
  users: UsersFilters;
  vehicles: VehiclesFilters;
  dealers: DealersFilters;
  brands: BrandsFilters;
  reclamations: ReclamationsFilters;
  setUsers: (patch: Partial<UsersFilters>) => void;
  setVehicles: (patch: Partial<VehiclesFilters>) => void;
  setDealers: (patch: Partial<DealersFilters>) => void;
  setBrands: (patch: Partial<BrandsFilters>) => void;
  setReclamations: (patch: Partial<ReclamationsFilters>) => void;
  resetUsers: () => void;
  resetVehicles: () => void;
  resetDealers: () => void;
  resetBrands: () => void;
  resetReclamations: () => void;
};

const usersDefault: UsersFilters = { q: '', role: '', status: '', page: 1 };
const vehiclesDefault: VehiclesFilters = { q: '', published: '', page: 1 };
const dealersDefault: DealersFilters = { q: '', verified: '', page: 1 };
const brandsDefault: BrandsFilters = {
  q: '',
  popular: '',
  sort: 'name',
  page: 1,
};
const reclamationsDefault: ReclamationsFilters = {
  q: '',
  status: '',
  priority: '',
  page: 1,
};

export const useFiltersStore = create<FiltersState>((set) => ({
  users: usersDefault,
  vehicles: vehiclesDefault,
  dealers: dealersDefault,
  brands: brandsDefault,
  reclamations: reclamationsDefault,

  setUsers: (patch) =>
    set((s) => ({ users: { ...s.users, ...patch } })),
  setVehicles: (patch) =>
    set((s) => ({ vehicles: { ...s.vehicles, ...patch } })),
  setDealers: (patch) =>
    set((s) => ({ dealers: { ...s.dealers, ...patch } })),
  setBrands: (patch) =>
    set((s) => ({ brands: { ...s.brands, ...patch } })),
  setReclamations: (patch) =>
    set((s) => ({ reclamations: { ...s.reclamations, ...patch } })),

  resetUsers: () => set({ users: usersDefault }),
  resetVehicles: () => set({ vehicles: vehiclesDefault }),
  resetDealers: () => set({ dealers: dealersDefault }),
  resetBrands: () => set({ brands: brandsDefault }),
  resetReclamations: () => set({ reclamations: reclamationsDefault }),
}));
