/**
 * Admin User Types
 * Users who can access the Admin Portal / Control Center
 */

export type AdminRole = 'super_admin' | 'admin' | 'support';

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;         // Hashed password
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdminUserInput {
  email: string;
  password: string;
  name: string;
  role: AdminRole;
}

export interface UpdateAdminUserInput {
  email?: string;
  password?: string;
  name?: string;
  role?: AdminRole;
  isActive?: boolean;
}

export interface AdminSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Role permissions
export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    'tenants:read', 'tenants:write', 'tenants:delete',
    'licenses:read', 'licenses:write', 'licenses:delete', 'licenses:revoke',
    'stores:read', 'stores:write', 'stores:delete',
    'devices:read', 'devices:write', 'devices:block',
    'admin_users:read', 'admin_users:write', 'admin_users:delete',
    'audit_logs:read',
    'settings:read', 'settings:write',
  ],
  admin: [
    'tenants:read', 'tenants:write',
    'licenses:read', 'licenses:write', 'licenses:revoke',
    'stores:read', 'stores:write',
    'devices:read', 'devices:write', 'devices:block',
    'audit_logs:read',
  ],
  support: [
    'tenants:read',
    'licenses:read',
    'stores:read',
    'devices:read',
    'audit_logs:read',
  ],
};
