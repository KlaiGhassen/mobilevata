export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type ConversationStatus = 'PENDING' | 'OPEN' | 'DECLINED' | 'CLOSED';

export type ConversationParty = {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
};

export type ConversationVehicle = {
  id?: string;
  _id?: string;
  title: string;
  price: number;
  images?: string[];
  city?: string | null;
  country?: string;
};

export type Conversation = {
  id: string;
  status: ConversationStatus;
  offerMessage: string;
  offerPrice?: number;
  phone?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  createdAt?: string;
  updatedAt?: string;
  vehicleId: string;
  buyerId: string;
  sellerId: string;
  vehicle?: ConversationVehicle;
  buyer?: ConversationParty;
  seller?: ConversationParty;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt?: string;
  sender?: ConversationParty;
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  dealer?: Dealer | null;
};

export type Brand = { id: string; name: string; popular: boolean; logoUrl?: string | null };
export type Model = { id: string; name: string; brandId: string };

export type Dealer = {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  country: string;
  phone?: string | null;
  website?: string | null;
  rating: number;
  reviewCount: number;
  vehicles?: Vehicle[];
  _count?: { vehicles: number };
};

export type Vehicle = {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  currency: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  powerHp?: number | null;
  powerKw?: number | null;
  doors?: number | null;
  seats?: number | null;
  color?: string | null;
  condition: string;
  country: string;
  city?: string | null;
  features: string[];
  images: string[];
  categoryTags: string[];
  hasServiceBook: boolean;
  hasWarranty: boolean;
  accidentFree: boolean;
  sellersType: string;
  electricRangeKm?: number | null;
  co2Emissions?: number | null;
  consumption?: number | null;
  vatDeductible: boolean;
  views: number;
  brand: Brand | null;
  model: Model | null;
  dealer?: Dealer | null;
  seller?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    role: string;
  } | null;
};

export type SearchResult = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: Vehicle[];
};

export type SearchParams = Record<string, string | number | undefined | null>;

function buildQuery(params?: SearchParams) {
  if (!params) return '';
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, body, ...rest } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const nextHeaders: Record<string, string> = {};
  if (!isFormData) nextHeaders['Content-Type'] = 'application/json';
  if (token && token.includes('.')) {
    nextHeaders.Authorization = `Bearer ${token}`;
  }
  if (headers) {
    const plain = new Headers(headers);
    plain.forEach((value, key) => {
      nextHeaders[key] = value;
    });
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    body,
    credentials: 'include',
    headers: nextHeaders,
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const message = Array.isArray(err.message)
      ? err.message.join(', ')
      : err.message || 'API error';
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Generic resource client — open for extension, closed for modification */
export function createResourceClient<T>(basePath: string) {
  return {
    list: (params?: SearchParams, token?: string | null) =>
      api<T[]>(`${basePath}${buildQuery(params)}`, { token }),
    get: (id: string, token?: string | null) =>
      api<T>(`${basePath}/${id}`, { token }),
    create: (data: unknown, token?: string | null) =>
      api<T>(basePath, { method: 'POST', token, body: JSON.stringify(data) }),
    remove: (id: string, token?: string | null) =>
      api(`${basePath}/${id}`, { method: 'DELETE', token }),
  };
}

export const client = {
  searchVehicles: (params?: SearchParams) =>
    api<SearchResult>(`/vehicles${buildQuery(params)}`),
  getVehicle: (id: string) => api<Vehicle>(`/vehicles/${id}`),
  getStats: () =>
    api<{
      total: number;
      byBodyType: { type: string; count: number }[];
      byFuel: { type: string; count: number }[];
    }>('/vehicles/stats'),
  getCategories: () =>
    api<{ slug: string; titleKey: string; filters: SearchParams }[]>(
      '/vehicles/categories',
    ),
  getBrands: (popular?: boolean) =>
    api<Brand[]>(`/brands${popular ? '?popular=true' : ''}`),
  getModels: (brandId: string) => api<Model[]>(`/brands/${brandId}/models`),
  getDealers: () => api<Dealer[]>('/dealers'),
  getDealer: (id: string) => api<Dealer>(`/dealers/${id}`),
  login: (email: string, password: string) =>
    api<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: Record<string, string>) =>
    api<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () => api<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  me: (token?: string | null) => api<User>('/auth/me', { token }),
  createVehicle: (token: string, data: Record<string, unknown>) =>
    api<Vehicle>('/vehicles', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),
  updateVehicle: (token: string, id: string, data: Record<string, unknown>) =>
    api<Vehicle>(`/vehicles/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    }),
  deleteVehicle: (token: string, id: string) =>
    api<{ ok: boolean }>(`/vehicles/${id}`, { method: 'DELETE', token }),
  uploadImages: (token: string, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    return api<{ urls: string[] }>('/uploads/images', {
      method: 'POST',
      token,
      body: form,
    });
  },
  myVehicles: (token: string) => api<Vehicle[]>('/vehicles/mine', { token }),
  favorites: (token: string) =>
    api<{ id: string; vehicle: Vehicle }[]>('/favorites', { token }),
  addFavorite: (token: string, vehicleId: string) =>
    api('/favorites/' + vehicleId, { method: 'POST', token }),
  removeFavorite: (token: string, vehicleId: string) =>
    api('/favorites/' + vehicleId, { method: 'DELETE', token }),
  compare: (token: string) => api<Vehicle[]>('/compare', { token }),
  addCompare: (token: string, vehicleId: string) =>
    api<Vehicle[]>('/compare/' + vehicleId, { method: 'POST', token }),
  removeCompare: (token: string, vehicleId: string) =>
    api<Vehicle[]>('/compare/' + vehicleId, { method: 'DELETE', token }),
  listConversations: (token: string) =>
    api<Conversation[]>('/chat/conversations', { token }),
  getConversation: (token: string, id: string) =>
    api<Conversation>(`/chat/conversations/${id}`, { token }),
  getChatMessages: (token: string, conversationId: string) =>
    api<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`, {
      token,
    }),
  createOffer: (
    token: string,
    data: {
      vehicleId: string;
      message: string;
      offerPrice?: number;
      phone?: string;
    },
  ) =>
    api<Conversation>('/chat/offers', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),
  acceptConversation: (token: string, id: string) =>
    api<Conversation>(`/chat/conversations/${id}/accept`, {
      method: 'POST',
      token,
    }),
  declineConversation: (token: string, id: string) =>
    api<Conversation>(`/chat/conversations/${id}/decline`, {
      method: 'POST',
      token,
    }),
  sendChatMessage: (token: string, conversationId: string, content: string) =>
    api<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      token,
      body: JSON.stringify({ content }),
    }),
};

export { formatPrice, formatMileage } from './format';
