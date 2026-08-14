/** Role hierarchy helpers for backoffice authorization. */

export const STAFF_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const;

export function isStaffRole(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === 'SUPER_ADMIN';
}

/** SUPER_ADMIN satisfies any requirement that includes ADMIN. */
export function roleSatisfies(
  userRole: string | undefined | null,
  required: string[],
): boolean {
  if (!userRole) return false;
  if (required.includes(userRole)) return true;
  if (userRole === 'SUPER_ADMIN' && required.includes('ADMIN')) return true;
  return false;
}
