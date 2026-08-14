import { toId } from './serialize';

/** Safe user projection for API responses — never includes passwordHash. */
export function publicUser(ref: unknown) {
  if (!ref || typeof ref !== 'object') return null;
  const o = ref as Record<string, unknown>;
  return {
    id: toId(o._id ?? o.id),
    email: o.email ?? null,
    firstName: o.firstName ?? null,
    lastName: o.lastName ?? null,
    role: o.role ?? null,
    status: o.status ?? null,
    phone: o.phone ?? null,
  };
}

export const USER_PUBLIC_SELECT =
  'firstName lastName email role status phone';
