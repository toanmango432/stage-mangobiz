/**
 * Member Types
 * Members are users who can access the POS (staff, managers, admins)
 */

export type MemberRole = 'admin' | 'manager' | 'staff';
export type MemberStatus = 'active' | 'inactive' | 'suspended';

export interface Member {
  id: string;
  tenantId: string;
  storeIds: string[];           // Stores this member can access

  // Profile
  name: string;
  email: string;
  phone?: string;
  avatar?: string;

  // Authentication
  passwordHash: string;
  pin?: string;                 // Optional 4-6 digit PIN for quick login

  // Permissions
  role: MemberRole;
  permissions: string[];        // Granular permissions

  // Status
  status: MemberStatus;
  lastLoginAt?: Date;
  lastActiveAt?: Date;

  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;           // ID of admin who created this member
}

export interface CreateMemberInput {
  tenantId: string;
  storeIds: string[];
  name: string;
  email: string;
  password: string;             // Will be hashed
  phone?: string;
  pin?: string;
  role: MemberRole;
  permissions?: string[];
}

export interface UpdateMemberInput {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  password?: string;            // To change password
  pin?: string;
  role?: MemberRole;
  permissions?: string[];
  storeIds?: string[];
  status?: MemberStatus;
}

// Default permissions by role
export const MEMBER_ROLE_PERMISSIONS: Record<MemberRole, string[]> = {
  admin: [
    'pos:access',
    'pos:checkout',
    'pos:void',
    'pos:refund',
    'pos:discount',
    'appointments:view',
    'appointments:create',
    'appointments:edit',
    'appointments:delete',
    'clients:view',
    'clients:create',
    'clients:edit',
    'reports:view',
    'reports:export',
    'settings:view',
    'settings:edit',
    'members:view',
    'members:create',
    'members:edit',
    'members:delete',
  ],
  manager: [
    'pos:access',
    'pos:checkout',
    'pos:void',
    'pos:refund',
    'pos:discount',
    'appointments:view',
    'appointments:create',
    'appointments:edit',
    'clients:view',
    'clients:create',
    'clients:edit',
    'reports:view',
    'members:view',
  ],
  staff: [
    'pos:access',
    'pos:checkout',
    'appointments:view',
    'appointments:create',
    'clients:view',
    'clients:create',
  ],
};

/**
 * Check if a member has a specific permission
 */
export function hasPermission(member: Member, permission: string): boolean {
  return member.permissions.includes(permission) || member.permissions.includes('*');
}

/**
 * Check if a member can access a specific store
 */
export function canAccessStore(member: Member, storeId: string): boolean {
  return member.storeIds.includes(storeId) || member.storeIds.includes('*');
}
