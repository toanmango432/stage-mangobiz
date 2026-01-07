/**
 * Auth Types for Control Center Authentication
 */

// Re-export role and permissions from adminUser
export type { AdminRole } from './adminUser';
export { ADMIN_ROLE_PERMISSIONS } from './adminUser';
import type { AdminRole } from './adminUser';

/**
 * AdminUser interface for AuthContext
 * This is a simplified version without passwordHash (used after authentication)
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}
