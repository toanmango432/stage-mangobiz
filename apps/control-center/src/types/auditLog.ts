/**
 * Audit Log Types
 * Track all administrative actions for security and compliance
 */

export type AuditAction =
  | 'tenant_created' | 'tenant_updated' | 'tenant_deleted' | 'tenant_suspended'
  | 'license_created' | 'license_updated' | 'license_revoked' | 'license_activated'
  | 'store_created' | 'store_updated' | 'store_deleted' | 'store_suspended'
  | 'store_login' | 'store_login_failed'
  | 'member_login' | 'member_login_failed'
  | 'pin_login' | 'pin_login_failed'
  | 'device_registered' | 'device_blocked' | 'device_unblocked'
  | 'admin_login' | 'admin_logout' | 'admin_created' | 'admin_updated' | 'admin_deleted'
  | 'license_validated' | 'license_validation_failed';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: 'tenant' | 'license' | 'store' | 'member' | 'device' | 'admin_user' | 'system';
  entityId?: string;
  adminUserId?: string;         // Who performed the action (null for system actions)
  adminUserEmail?: string;      // Denormalized for easier display
  details?: Record<string, any>; // Additional context
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CreateAuditLogInput {
  action: AuditAction;
  entityType: 'tenant' | 'license' | 'store' | 'member' | 'device' | 'admin_user' | 'system';
  entityId?: string;
  adminUserId?: string;
  adminUserEmail?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
