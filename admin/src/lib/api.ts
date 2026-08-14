const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  '/backend'
).replace(/\/$/, '');

export type StaffRole = 'ADMIN' | 'SUPER_ADMIN';
export type AdminUserRole = 'USER' | 'DEALER' | StaffRole;

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: AdminUserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  moderationReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Paginated<T> = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: T[];
};

export type AdminStats = {
  users: {
    total: number;
    active: number;
    suspended: number;
    banned: number;
    byRole: {
      USER: number;
      DEALER: number;
      ADMIN: number;
      SUPER_ADMIN?: number;
    };
  };
  vehicles: { total: number; published: number; unpublished: number };
  dealers: { total: number; verified: number; unverified: number };
  reclamations: {
    total: number;
    pending: number;
    byStatus: Record<string, number>;
  };
  conversations: { total: number; pending: number };
  messages: { total: number };
  favorites: { total: number };
  recentReclamations: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    targetType: string;
    targetId: string;
    createdAt: string;
    reporterName?: string;
  }>;
  recentUsers: AdminUser[];
};

export type AdminVehicle = {
  id: string;
  title: string;
  price: number;
  currency: string;
  year: number;
  mileage: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  condition?: string;
  sellersType?: string;
  published: boolean;
  moderationReason?: string | null;
  views?: number;
  images?: string[];
  createdAt?: string;
  brandName?: string;
  modelName?: string;
  sellerName?: string;
};

export type AdminVehicleDetail = {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  currency: string;
  year: number;
  mileage: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  powerHp?: number | null;
  powerKw?: number | null;
  doors?: number | null;
  seats?: number | null;
  color?: string | null;
  interiorColor?: string | null;
  condition?: string;
  country?: string;
  city?: string | null;
  postalCode?: string | null;
  features: string[];
  images: string[];
  categoryTags: string[];
  hasServiceBook: boolean;
  hasWarranty: boolean;
  accidentFree: boolean;
  sellersType?: string;
  electricRangeKm?: number | null;
  co2Emissions?: number | null;
  consumption?: number | null;
  vatDeductible: boolean;
  published: boolean;
  moderationReason?: string | null;
  views: number;
  createdAt?: string;
  updatedAt?: string;
  brand: { id: string; name: string | null; logoUrl?: string | null } | null;
  model: { id: string; name: string | null } | null;
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
    status?: string | null;
  } | null;
  dealer: {
    id: string;
    name: string | null;
    city?: string | null;
    country?: string | null;
    verified: boolean;
    phone?: string | null;
  } | null;
};

export type AdminDealer = {
  id: string;
  name: string;
  city?: string;
  country?: string;
  phone?: string;
  website?: string;
  rating?: number;
  verified?: boolean;
  ownerEmail?: string | null;
  ownerName?: string | null;
  ownerStatus?: string | null;
};

export type AdminUserDetail = AdminUser & {
  stats: { vehicles: number; publishedVehicles: number };
  dealer: AdminDealer | null;
  recentVehicles: Array<{
    id: string;
    title: string;
    price: number;
    currency?: string;
    year?: number;
    published?: boolean;
    images?: string[];
    brandName?: string | null;
    modelName?: string | null;
    createdAt?: string;
  }>;
};

export type AdminBrand = {
  id: string;
  name: string;
  logoUrl?: string | null;
  popular?: boolean;
  _count?: { models: number };
};

export type Reclamation = {
  id: string;
  targetType: string;
  targetId: string;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  resolutionNote?: string | null;
  resolution?: string | null;
  moderationAction?: string;
  resolvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  reporterId?: string;
  assigneeId?: string | null;
  resolvedBy?: string | null;
  reporter?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  assignee?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  target?: Record<string, unknown>;
};

export function isStaffRole(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === 'SUPER_ADMIN';
}

async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) {
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : String(body.message);
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function qs(params: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === '') return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const adminApi = {
  login: (email: string, password: string) =>
    api<{ user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => api<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => api<AdminUser>('/auth/me'),
  stats: () => api<AdminStats>('/admin/stats'),
  users: (params: Record<string, string | number | undefined> = {}) =>
    api<Paginated<AdminUser>>(`/admin/users${qs(params)}`),
  user: (id: string) => api<AdminUserDetail>(`/admin/users/${id}`),
  createAdmin: (body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) =>
    api<AdminUser>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateUser: (id: string, body: Record<string, unknown>) =>
    api<AdminUser>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  vehicles: (params: Record<string, string | number | boolean | undefined> = {}) =>
    api<Paginated<AdminVehicle>>(`/admin/vehicles${qs(params)}`),
  vehicle: (id: string) => api<AdminVehicleDetail>(`/admin/vehicles/${id}`),
  updateVehicle: (id: string, body: Record<string, unknown>) =>
    api<{ id: string; published: boolean; moderationReason?: string }>(
      `/admin/vehicles/${id}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    ),
  deleteVehicle: (id: string) =>
    api<{ ok: boolean }>(`/admin/vehicles/${id}`, { method: 'DELETE' }),
  dealers: (params: Record<string, string | number | boolean | undefined> = {}) =>
    api<Paginated<AdminDealer>>(`/admin/dealers${qs(params)}`),
  updateDealer: (id: string, body: Record<string, unknown>) =>
    api<AdminDealer>(`/admin/dealers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteDealer: (id: string) =>
    api<{ ok: boolean }>(`/admin/dealers/${id}`, { method: 'DELETE' }),
  brands: (
    params: Record<string, string | number | boolean | undefined> = {},
  ) => api<Paginated<AdminBrand>>(`/admin/brands${qs(params)}`),
  createBrand: (body: {
    name: string;
    popular?: boolean;
    logoUrl?: string | null;
  }) =>
    api<AdminBrand>('/admin/brands', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateBrand: (id: string, body: Record<string, unknown>) =>
    api<AdminBrand>(`/admin/brands/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteBrand: (id: string) =>
    api<{ ok: boolean }>(`/admin/brands/${id}`, { method: 'DELETE' }),
  uploadImages: async (files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const res = await fetch(`${API_URL}/uploads/images`, {
      method: 'POST',
      body: form,
      credentials: 'include',
    });
    if (!res.ok) {
      let message = `Upload failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.message) {
          message = Array.isArray(body.message)
            ? body.message.join(', ')
            : String(body.message);
        }
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
    return res.json() as Promise<{ urls: string[] }>;
  },
  reclamations: (params: Record<string, string | number | undefined> = {}) =>
    api<Paginated<Reclamation>>(`/admin/reclamations${qs(params)}`),
  reclamation: (id: string) =>
    api<Reclamation>(`/admin/reclamations/${id}`),
  updateReclamation: (id: string, body: Record<string, unknown>) =>
    api<Reclamation>(`/admin/reclamations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  reindex: () =>
    api<{ indexed: number }>('/vehicles/reindex', { method: 'POST' }),
};
