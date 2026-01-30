import { AppRole, UserRole } from "@/types/role";

const ROLES_KEY = 'mango-user-roles';

export const getUserRoles = (userId: string): AppRole[] => {
  if (typeof window === 'undefined') return [];
  const roles: UserRole[] = JSON.parse(localStorage.getItem(ROLES_KEY) || '[]');
  return roles.filter(r => r.userId === userId).map(r => r.role);
};

export const hasRole = (userId: string, role: AppRole): boolean => {
  return getUserRoles(userId).includes(role);
};

export const assignRole = (userId: string, role: AppRole): void => {
  if (typeof window === 'undefined') return;
  const roles: UserRole[] = JSON.parse(localStorage.getItem(ROLES_KEY) || '[]');
  
  // Check if role already exists
  const exists = roles.some(r => r.userId === userId && r.role === role);
  if (!exists) {
    roles.push({ userId, role });
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
  }
};

export const removeRole = (userId: string, role: AppRole): void => {
  if (typeof window === 'undefined') return;
  const roles: UserRole[] = JSON.parse(localStorage.getItem(ROLES_KEY) || '[]');
  const filtered = roles.filter(r => !(r.userId === userId && r.role === role));
  localStorage.setItem(ROLES_KEY, JSON.stringify(filtered));
};

/**
 * @deprecated Admin accounts should be created via Supabase Auth.
 * This function is a no-op and will be removed in a future version.
 */
export const initializeAdminAccount = (): void => {
  // SECURITY: Admin accounts must be created via Supabase Auth, not localStorage.
  // This function is intentionally a no-op to prevent plaintext password storage.
  console.warn(
    '[DEPRECATED] initializeAdminAccount is deprecated. ' +
    'Admin accounts should be created via Supabase Auth dashboard or API.'
  );
};
