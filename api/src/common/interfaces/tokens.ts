export const VEHICLES_SERVICE = Symbol('VEHICLES_SERVICE');
export const AUTH_SERVICE = Symbol('AUTH_SERVICE');
export const BRANDS_SERVICE = Symbol('BRANDS_SERVICE');
export const DEALERS_SERVICE = Symbol('DEALERS_SERVICE');
export const FAVORITES_SERVICE = Symbol('FAVORITES_SERVICE');
export const COMPARE_SERVICE = Symbol('COMPARE_SERVICE');
export const MESSAGES_SERVICE = Symbol('MESSAGES_SERVICE');

export interface IAuthService {
  register(dto: unknown): Promise<unknown>;
  login(dto: unknown): Promise<unknown>;
  me(userId: string): Promise<unknown>;
}

export interface IVehiclesService {
  search(query: unknown): Promise<unknown>;
  findOne(id: string): Promise<unknown>;
  create(userId: string, dto: unknown): Promise<unknown>;
  update(userId: string, id: string, dto: unknown): Promise<unknown>;
  myVehicles(userId: string): Promise<unknown>;
  remove(userId: string, id: string): Promise<unknown>;
  stats(): Promise<unknown>;
  categories(): unknown[];
}
