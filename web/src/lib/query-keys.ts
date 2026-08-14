import type { SearchParams } from '@/lib/api';

export const queryKeys = {
  brands: (popular?: boolean) => ['brands', { popular: Boolean(popular) }] as const,
  models: (brandId: string) => ['models', brandId] as const,
  vehicleSearch: (params: SearchParams) => ['vehicles', 'search', params] as const,
  vehicle: (id: string) => ['vehicles', 'detail', id] as const,
  myVehicles: () => ['vehicles', 'mine'] as const,
  stats: () => ['vehicles', 'stats'] as const,
  categories: () => ['vehicles', 'categories'] as const,
  me: () => ['auth', 'me'] as const,
  favorites: () => ['favorites'] as const,
  compare: () => ['compare'] as const,
  dealers: () => ['dealers'] as const,
  dealer: (id: string) => ['dealers', id] as const,
  conversations: () => ['chat', 'conversations'] as const,
  conversation: (id: string) => ['chat', 'conversation', id] as const,
  chatMessages: (conversationId: string) =>
    ['chat', 'messages', conversationId] as const,
};
