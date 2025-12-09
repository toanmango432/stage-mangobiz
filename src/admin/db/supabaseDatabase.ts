/**
 * Supabase Database Adapter
 * Provides the same interface as the IndexedDB database but uses Supabase
 */

import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import type {
  Tenant,
  License,
  Store,
  Member,
  AdminUser,
  AuditLog,
  CreateTenantInput,
  CreateLicenseInput,
  CreateStoreInput,
  CreateMemberInput,
  CreateAdminUserInput,
  CreateAuditLogInput,
  UpdateTenantInput,
  UpdateLicenseInput,
  UpdateStoreInput,
  UpdateMemberInput,
} from '../types';
import { generateLicenseKey } from '../utils/licenseKeyGenerator';
import { hashPassword, verifyPassword } from '../utils/auth';

// ==================== HELPER FUNCTIONS ====================

// Convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {} as any);
}

// Convert camelCase to snake_case
function toSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj instanceof Date) return obj.toISOString();

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {} as any);
}

// ==================== TENANTS ====================

export const tenantsDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<Tenant[]> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async getById(id: string): Promise<Tenant | undefined> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async getByEmail(email: string): Promise<Tenant | undefined> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async create(input: CreateTenantInput): Promise<Tenant> {
    const tenant = {
      id: uuidv4(),
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      company: input.company,
      status: 'active',
      notes: input.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('tenants')
      .insert(tenant)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id: string, updates: UpdateTenantInput): Promise<Tenant | undefined> {
    const updateData = {
      ...toSnakeCase(updates),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },

  async suspend(id: string): Promise<Tenant | undefined> {
    return this.update(id, { status: 'suspended' } as UpdateTenantInput);
  },

  async activate(id: string): Promise<Tenant | undefined> {
    return this.update(id, { status: 'active' } as UpdateTenantInput);
  },
};

// ==================== LICENSES ====================

export const licensesDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<License[]> {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async getById(id: string): Promise<License | undefined> {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async getByLicenseKey(licenseKey: string): Promise<License | undefined> {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async getByTenantId(tenantId: string): Promise<License[]> {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async create(input: CreateLicenseInput): Promise<License> {
    const tierLimits = {
      free: { maxStores: 1, maxDevicesPerStore: 1 },
      basic: { maxStores: 1, maxDevicesPerStore: 3 },
      professional: { maxStores: 3, maxDevicesPerStore: 5 },
      enterprise: { maxStores: 999, maxDevicesPerStore: 999 },
    };
    const limits = tierLimits[input.tier] || tierLimits.free;

    const license = {
      id: uuidv4(),
      tenant_id: input.tenantId,
      license_key: generateLicenseKey(),
      tier: input.tier,
      status: 'active',
      max_stores: limits.maxStores,
      max_devices_per_store: limits.maxDevicesPerStore,
      features: input.features || [],
      issued_at: new Date().toISOString(),
      expires_at: input.expiresAt?.toISOString(),
      notes: input.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('licenses')
      .insert(license)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id: string, updates: UpdateLicenseInput): Promise<License | undefined> {
    const updateData = {
      ...toSnakeCase(updates),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('licenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('licenses')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },

  async getExpiring(days: number = 30, limit: number = 100): Promise<License[]> {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('status', 'active')
      .gte('expires_at', now.toISOString())
      .lte('expires_at', future.toISOString())
      .limit(limit);

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async activate(id: string): Promise<License | undefined> {
    return this.update(id, { status: 'active' } as UpdateLicenseInput);
  },

  async revoke(id: string): Promise<License | undefined> {
    return this.update(id, { status: 'revoked' } as UpdateLicenseInput);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', id);

    return !error;
  },
};

// ==================== STORES ====================

export const storesDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<Store[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async getById(id: string): Promise<Store | undefined> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async getByStoreLoginId(storeLoginId: string): Promise<Store | undefined> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('store_login_id', storeLoginId.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async getByLicenseId(licenseId: string): Promise<Store[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('license_id', licenseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async getByTenantId(tenantId: string): Promise<Store[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async create(input: CreateStoreInput): Promise<Store> {
    const storeId = uuidv4();
    const store = {
      id: storeId,
      license_id: input.licenseId,
      tenant_id: input.tenantId,
      name: input.name,
      store_login_id: input.storeEmail?.toLowerCase() || `store-${uuidv4().slice(0, 8)}`,
      password_hash: await hashPassword(input.password),
      store_email: input.storeEmail?.toLowerCase(),
      address: input.address,
      phone: input.phone,
      timezone: input.timezone || 'America/New_York',
      status: 'active',
      settings: input.settings || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('stores')
      .insert(store)
      .select()
      .single();

    if (error) throw error;

    // SYSTEM RULE: When a new store is created, automatically grant access to all admin members of the tenant
    if (input.tenantId) {
      const { data: adminMembers } = await supabase
        .from('members')
        .select('id, store_ids')
        .eq('tenant_id', input.tenantId)
        .eq('role', 'admin');

      if (adminMembers && adminMembers.length > 0) {
        for (const admin of adminMembers) {
          const currentStoreIds = admin.store_ids || [];
          if (!currentStoreIds.includes(storeId)) {
            const updatedStoreIds = [...currentStoreIds, storeId];
            await supabase
              .from('members')
              .update({ store_ids: updatedStoreIds, updated_at: new Date().toISOString() })
              .eq('id', admin.id);
            console.log(`SYSTEM RULE: Admin member ${admin.id} granted access to new store ${storeId}`);
          }
        }
      }
    }

    return toCamelCase(data);
  },

  async update(id: string, updates: UpdateStoreInput): Promise<Store | undefined> {
    const updateData: any = {
      ...toSnakeCase(updates),
      updated_at: new Date().toISOString(),
    };

    // Handle password update
    if (updates.password) {
      updateData.password_hash = await hashPassword(updates.password);
      delete updateData.password;
    }

    const { data, error } = await supabase
      .from('stores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async verifyPassword(storeLoginId: string, password: string): Promise<Store | null> {
    const store = await this.getByStoreLoginId(storeLoginId);
    if (!store) return null;

    const isValid = await verifyPassword(password, store.passwordHash);
    if (!isValid) return null;

    return store;
  },

  async recordLogin(id: string): Promise<Store | undefined> {
    const { data, error } = await supabase
      .from('stores')
      .update({
        last_login_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },

  async countByLicense(licenseId: string): Promise<number> {
    const { count, error } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })
      .eq('license_id', licenseId);

    if (error) throw error;
    return count || 0;
  },
};

// ==================== MEMBERS ====================

export const membersDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async getById(id: string): Promise<Member | undefined> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async getByEmail(email: string): Promise<Member | undefined> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async getByTenantId(tenantId: string, limit: number = 100): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async getByStoreId(storeId: string, limit: number = 100): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .contains('store_ids', [storeId])
      .limit(limit);

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async create(input: CreateMemberInput): Promise<Member> {
    // SYSTEM RULE: Admin members get access to ALL stores under the tenant
    let storeIds = input.storeIds;

    if (input.role === 'admin' && input.tenantId) {
      // Fetch all stores for this tenant
      const { data: tenantStores } = await supabase
        .from('stores')
        .select('id')
        .eq('tenant_id', input.tenantId);

      if (tenantStores && tenantStores.length > 0) {
        storeIds = tenantStores.map(s => s.id);
        console.log(`SYSTEM RULE: Admin member granted access to all ${storeIds.length} stores`);
      }
    }

    const member = {
      id: uuidv4(),
      tenant_id: input.tenantId,
      store_ids: storeIds,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      password_hash: await hashPassword(input.password),
      pin: input.pin,
      role: input.role,
      permissions: input.permissions || [],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('members')
      .insert(member)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id: string, updates: UpdateMemberInput): Promise<Member | undefined> {
    const updateData: any = {
      ...toSnakeCase(updates),
      updated_at: new Date().toISOString(),
    };

    // Handle password update
    if (updates.password) {
      updateData.password_hash = await hashPassword(updates.password);
      delete updateData.password;
    }

    const { data, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async verifyPassword(email: string, password: string): Promise<Member | null> {
    const member = await this.getByEmail(email);
    if (!member) return null;

    const isValid = await verifyPassword(password, member.passwordHash);
    if (!isValid) return null;

    return member;
  },

  async verifyPin(email: string, pin: string): Promise<Member | null> {
    const member = await this.getByEmail(email);
    if (!member || !member.pin) return null;

    if (member.pin !== pin) return null;

    return member;
  },

  async recordLogin(id: string): Promise<Member | undefined> {
    const { data, error } = await supabase
      .from('members')
      .update({
        last_login_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },

  async suspend(id: string): Promise<Member | undefined> {
    return this.update(id, { status: 'suspended' } as UpdateMemberInput);
  },

  async activate(id: string): Promise<Member | undefined> {
    return this.update(id, { status: 'active' } as UpdateMemberInput);
  },
};

// ==================== ADMIN USERS ====================

export const adminUsersDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async getById(id: string): Promise<AdminUser | undefined> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async getByEmail(email: string): Promise<AdminUser | undefined> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async create(input: CreateAdminUserInput): Promise<AdminUser> {
    const adminUser = {
      id: uuidv4(),
      email: input.email.toLowerCase(),
      password_hash: await hashPassword(input.password),
      name: input.name,
      role: input.role || 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('admin_users')
      .insert(adminUser)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async verifyPassword(email: string, password: string): Promise<AdminUser | null> {
    const user = await this.getByEmail(email);
    if (!user) return null;

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) return null;

    return user;
  },

  async recordLogin(id: string): Promise<AdminUser | undefined> {
    const { data, error } = await supabase
      .from('admin_users')
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },

  async update(id: string, updates: Partial<Omit<AdminUser, 'id' | 'createdAt'>>): Promise<AdminUser | undefined> {
    const updateData: any = {
      ...toSnakeCase(updates),
      updated_at: new Date().toISOString(),
    };

    // Handle password update if provided
    if (updates.passwordHash) {
      delete updateData.password_hash; // Don't update hash directly - should go through hashPassword
    }

    const { data, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};

// ==================== AUDIT LOGS ====================

export const auditLogsDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async getById(id: string): Promise<AuditLog | undefined> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async getByEntity(entityType: string, entityId: string, limit: number = 100): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const auditLog = {
      id: uuidv4(),
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      admin_user_id: input.adminUserId,
      admin_user_email: input.adminUserEmail,
      details: input.details || {},
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('audit_logs')
      .insert(auditLog)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },
};

// ==================== SYSTEM CONFIGS ====================

export const systemConfigsDB = {
  async getGlobal(): Promise<any | null> {
    const { data, error } = await supabase
      .from('system_configs')
      .select('*')
      .is('tenant_id', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : null;
  },

  async getByTenant(tenantId: string): Promise<any | null> {
    // First try tenant-specific config
    const { data: tenantConfig, error: tenantError } = await supabase
      .from('system_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (tenantError && tenantError.code !== 'PGRST116') throw tenantError;
    if (tenantConfig) return toCamelCase(tenantConfig);

    // Fall back to global config
    return this.getGlobal();
  },

  async update(id: string, updates: {
    businessType?: string;
    defaultCurrency?: string;
    defaultTimezone?: string;
    taxSettings?: any[];
    paymentMethods?: any[];
    tipSettings?: any;
    requireClientForCheckout?: boolean;
    autoPrintReceipt?: boolean;
  }): Promise<any | null> {
    const updateData = {
      ...toSnakeCase(updates),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('system_configs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data ? toCamelCase(data) : null;
  },

  async updateGlobal(updates: {
    businessType?: string;
    defaultCurrency?: string;
    defaultTimezone?: string;
    taxSettings?: any[];
    paymentMethods?: any[];
    tipSettings?: any;
    requireClientForCheckout?: boolean;
    autoPrintReceipt?: boolean;
  }): Promise<any | null> {
    const updateData = {
      ...toSnakeCase(updates),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('system_configs')
      .update(updateData)
      .is('tenant_id', null)
      .select()
      .single();

    if (error) throw error;
    return data ? toCamelCase(data) : null;
  },

  async createForTenant(tenantId: string, config?: Partial<{
    businessType: string;
    defaultCurrency: string;
    defaultTimezone: string;
    taxSettings: any[];
    paymentMethods: any[];
    tipSettings: any;
    requireClientForCheckout: boolean;
    autoPrintReceipt: boolean;
  }>): Promise<any> {
    const insertData = {
      tenant_id: tenantId,
      ...toSnakeCase(config || {}),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('system_configs')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },
};

// ==================== FEATURE FLAGS ====================

export const featureFlagsDB = {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async getById(id: string): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async getByKey(key: string): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async create(input: {
    key: string;
    name: string;
    description?: string;
    category?: string;
    globallyEnabled?: boolean;
    enabledForFree?: boolean;
    enabledForBasic?: boolean;
    enabledForProfessional?: boolean;
    enabledForEnterprise?: boolean;
    rolloutPercentage?: number;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const flag = {
      id: uuidv4(),
      key: input.key,
      name: input.name,
      description: input.description || '',
      category: input.category || 'Infrastructure',
      globally_enabled: input.globallyEnabled ?? true,
      enabled_for_free: input.enabledForFree ?? false,
      enabled_for_basic: input.enabledForBasic ?? false,
      enabled_for_professional: input.enabledForProfessional ?? true,
      enabled_for_enterprise: input.enabledForEnterprise ?? true,
      rollout_percentage: input.rolloutPercentage ?? 100,
      metadata: input.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('feature_flags')
      .insert(flag)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id: string, updates: {
    name?: string;
    description?: string;
    category?: string;
    globallyEnabled?: boolean;
    enabledForFree?: boolean;
    enabledForBasic?: boolean;
    enabledForProfessional?: boolean;
    enabledForEnterprise?: boolean;
    rolloutPercentage?: number;
    metadata?: Record<string, any>;
  }): Promise<any | undefined> {
    const updateData = {
      ...toSnakeCase(updates),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('feature_flags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('feature_flags')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('feature_flags')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },

  /**
   * Check if a feature is enabled for a given tier
   */
  async isEnabledForTier(key: string, tier: 'free' | 'basic' | 'professional' | 'enterprise'): Promise<boolean> {
    const flag = await this.getByKey(key);
    if (!flag) return false;
    if (!flag.globallyEnabled) return false;

    switch (tier) {
      case 'free': return flag.enabledForFree;
      case 'basic': return flag.enabledForBasic;
      case 'professional': return flag.enabledForProfessional;
      case 'enterprise': return flag.enabledForEnterprise;
      default: return false;
    }
  },

  /**
   * Get all enabled features for a given tier
   */
  async getEnabledForTier(tier: 'free' | 'basic' | 'professional' | 'enterprise'): Promise<any[]> {
    const tierColumn = `enabled_for_${tier}`;

    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('globally_enabled', true)
      .eq(tierColumn, true);

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },
};

// ==================== ANNOUNCEMENTS ====================

import type {
  Announcement,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  AnnouncementInteraction,
} from '../types/announcement';

export const announcementsDB = {
  async getAll(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async getById(id: string): Promise<Announcement | undefined> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? toCamelCase(data) : undefined;
  },

  async getActive(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'active')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  async getActiveForTier(tier: 'all' | 'free' | 'basic' | 'professional' | 'enterprise'): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'active')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter by tier on client side since JSONB queries are complex
    return (data || [])
      .map(toCamelCase)
      .filter((a: Announcement) => {
        const tiers = a.targeting?.tiers || ['all'];
        return tiers.includes('all') || tiers.includes(tier);
      });
  },

  async create(input: CreateAnnouncementInput, createdBy: string): Promise<Announcement> {
    const now = new Date().toISOString();

    const announcement = {
      id: uuidv4(),
      content: input.content,
      category: input.category,
      severity: input.severity || 'info',
      priority: input.priority || 'normal',
      channels: input.channels,
      channel_config: input.channelConfig || {},
      targeting: input.targeting,
      behavior: {
        dismissible: true,
        requireAcknowledgment: false,
        showOnce: false,
        ...input.behavior,
      },
      status: 'draft',
      stats: {
        totalViews: 0,
        uniqueViews: 0,
        dismissals: 0,
        acknowledgments: 0,
        ctaClicks: {},
        emailsSent: 0,
        emailsOpened: 0,
        emailsClicked: 0,
      },
      tags: input.tags || [],
      internal_notes: input.internalNotes,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('announcements')
      .insert(announcement)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id: string, input: UpdateAnnouncementInput): Promise<Announcement> {
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.content) updates.content = input.content;
    if (input.category) updates.category = input.category;
    if (input.severity) updates.severity = input.severity;
    if (input.priority) updates.priority = input.priority;
    if (input.channels) updates.channels = input.channels;
    if (input.channelConfig) updates.channel_config = input.channelConfig;
    if (input.targeting) updates.targeting = input.targeting;
    if (input.behavior) updates.behavior = input.behavior;
    if (input.status) updates.status = input.status;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.internalNotes !== undefined) updates.internal_notes = input.internalNotes;

    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async publish(id: string): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .update({
        status: 'active',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async pause(id: string): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async resume(id: string): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async archive(id: string): Promise<Announcement> {
    const { data, error } = await supabase
      .from('announcements')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async duplicate(id: string, createdBy: string): Promise<Announcement> {
    const original = await this.getById(id);
    if (!original) throw new Error('Announcement not found');

    return this.create({
      content: { ...original.content, title: `${original.content.title} (Copy)` },
      category: original.category,
      severity: original.severity,
      priority: original.priority,
      channels: original.channels,
      channelConfig: original.channelConfig,
      targeting: original.targeting,
      behavior: original.behavior,
      tags: original.tags,
      internalNotes: original.internalNotes,
    }, createdBy);
  },

  async updateExpiredStatus(): Promise<void> {
    const now = new Date().toISOString();

    // Find announcements that should be expired
    const { data: toExpire } = await supabase
      .from('announcements')
      .select('id, behavior')
      .eq('status', 'active');

    if (!toExpire) return;

    for (const ann of toExpire) {
      const expiresAt = ann.behavior?.expiresAt;
      if (expiresAt && new Date(expiresAt) < new Date(now)) {
        await supabase
          .from('announcements')
          .update({ status: 'expired', updated_at: now })
          .eq('id', ann.id);
      }
    }
  },

  async activateScheduled(): Promise<void> {
    const now = new Date().toISOString();

    // Find scheduled announcements that should be active
    const { data: toActivate } = await supabase
      .from('announcements')
      .select('id, behavior')
      .eq('status', 'scheduled');

    if (!toActivate) return;

    for (const ann of toActivate) {
      const startsAt = ann.behavior?.startsAt;
      if (startsAt && new Date(startsAt) <= new Date(now)) {
        await supabase
          .from('announcements')
          .update({
            status: 'active',
            published_at: now,
            updated_at: now,
          })
          .eq('id', ann.id);
      }
    }
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },

  async recordInteraction(interaction: Omit<AnnouncementInteraction, 'id' | 'timestamp'>): Promise<void> {
    const { error } = await supabase
      .from('announcement_interactions')
      .insert({
        id: uuidv4(),
        announcement_id: interaction.announcementId,
        tenant_id: interaction.tenantId,
        user_id: interaction.userId,
        store_id: interaction.storeId,
        action: interaction.action,
        cta_label: interaction.ctaLabel,
        channel: interaction.channel,
        metadata: interaction.metadata,
        timestamp: new Date().toISOString(),
      });

    if (error) throw error;
  },
};

// ==================== DATABASE STATS ====================

export async function getSupabaseDBStats() {
  // Get counts
  const [tenants, totalLicenses, stores, members, devices] = await Promise.all([
    tenantsDB.count(),
    licensesDB.count(),
    storesDB.count(),
    membersDB.count(),
    devicesDB.count(),
  ]);

  // Get license breakdown by status
  const { data: licenseData } = await supabase
    .from('licenses')
    .select('status');

  const licenseBreakdown = {
    total: totalLicenses,
    active: 0,
    expired: 0,
    revoked: 0,
  };

  if (licenseData) {
    for (const l of licenseData) {
      if (l.status === 'active') licenseBreakdown.active++;
      else if (l.status === 'expired') licenseBreakdown.expired++;
      else if (l.status === 'revoked') licenseBreakdown.revoked++;
    }
  }

  return {
    tenants,
    licenses: licenseBreakdown,
    stores,
    members,
    devices,
  };
}

// ==================== INITIALIZATION ====================

export async function initializeSupabaseDatabase(): Promise<boolean> {
  try {
    // Test connection by querying admin_users
    const { error } = await supabase.from('admin_users').select('id').limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }

    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    return false;
  }
}

export async function seedSupabaseDatabase(): Promise<void> {
  // Check if already seeded
  const { count } = await supabase
    .from('admin_users')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log('Supabase database already seeded');
    return;
  }

  console.log('Seeding Supabase database...');

  // Create default super admin
  await adminUsersDB.create({
    email: 'admin@mangobiz.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'super_admin',
  });

  // Create demo tenant
  const tenant = await tenantsDB.create({
    name: 'Demo Salon',
    email: 'owner@demosalon.com',
    phone: '555-0100',
    company: 'Demo Salon LLC',
  });

  // Create demo license
  const license = await licensesDB.create({
    tenantId: tenant.id,
    tier: 'professional',
    notes: 'Demo license for testing',
  });

  // Create demo store
  const store = await storesDB.create({
    licenseId: license.id,
    tenantId: tenant.id,
    name: 'Demo Salon Downtown',
    storeEmail: 'demo@salon.com',
    password: 'demo123',
    address: '123 Main St, Downtown',
    phone: '555-0101',
  });

  // Create demo members
  await membersDB.create({
    tenantId: tenant.id,
    storeIds: [store.id],
    name: 'Salon Owner',
    email: 'owner@demosalon.com',
    password: 'owner123',
    pin: '1234',
    role: 'admin',
  });

  await membersDB.create({
    tenantId: tenant.id,
    storeIds: [store.id],
    name: 'Jane Technician',
    email: 'jane@demosalon.com',
    password: 'jane123',
    pin: '5678',
    role: 'staff',
  });

  console.log('Supabase database seeded successfully');
}

// ==================== ALIASES FOR BACKWARD COMPATIBILITY ====================

// Alias systemConfigsDB as systemConfigDB for pages that use old naming
export const systemConfigDB = systemConfigsDB;

// Alias getSupabaseDBStats as getAdminDBStats for backward compatibility
export const getAdminDBStats = getSupabaseDBStats;

// ==================== DEVICES ====================
// Note: devices table may not exist in Supabase yet - provide stub implementation

export const devicesDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<any[]> {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.warn('devices table may not exist:', error.message);
      return [];
    }
    return (data || []).map(toCamelCase);
  },

  async getById(id: string): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return data ? toCamelCase(data) : undefined;
  },

  async getByStoreId(storeId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('store_id', storeId);

    if (error) return [];
    return (data || []).map(toCamelCase);
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true });

    if (error) return 0;
    return count || 0;
  },

  async block(id: string): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('devices')
      .update({ status: 'blocked', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data ? toCamelCase(data) : undefined;
  },

  async unblock(id: string): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('devices')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data ? toCamelCase(data) : undefined;
  },

  async enableOffline(id: string): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('devices')
      .update({ device_mode: 'offline-enabled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data ? toCamelCase(data) : undefined;
  },

  async disableOffline(id: string): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('devices')
      .update({ device_mode: 'online-only', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data ? toCamelCase(data) : undefined;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id);

    return !error;
  },
};

// ==================== SURVEYS (STUB) ====================
// Note: surveys tables may not exist in Supabase yet - provide stub implementation

export const surveysDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<any[]> {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.warn('surveys table may not exist:', error.message);
      return [];
    }
    return (data || []).map(toCamelCase);
  },

  async getById(id: string): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return data ? toCamelCase(data) : undefined;
  },

  async getByStatus(status: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('status', status);

    if (error) return [];
    return (data || []).map(toCamelCase);
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('surveys')
      .select('*', { count: 'exact', head: true });

    if (error) return 0;
    return count || 0;
  },

  async countByStatus(status: string): Promise<number> {
    const { count, error } = await supabase
      .from('surveys')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (error) return 0;
    return count || 0;
  },

  async create(input: any, createdBy: string): Promise<any> {
    const survey = {
      id: uuidv4(),
      ...toSnakeCase(input),
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('surveys')
      .insert(survey)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async update(id: string, updates: any): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('surveys')
      .update({ ...toSnakeCase(updates), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data ? toCamelCase(data) : undefined;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', id);

    return !error;
  },

  async publish(id: string): Promise<any | undefined> {
    return this.update(id, { status: 'active', published_at: new Date().toISOString() });
  },

  async pause(id: string): Promise<any | undefined> {
    return this.update(id, { status: 'paused' });
  },

  async close(id: string): Promise<any | undefined> {
    return this.update(id, { status: 'closed', closed_at: new Date().toISOString() });
  },
};

export const surveyResponsesDB = {
  async getBySurvey(surveyId: string, limit: number = 100, offset: number = 0): Promise<any[]> {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.warn('survey_responses table may not exist:', error.message);
      return [];
    }
    return (data || []).map(toCamelCase);
  },

  async getById(id: string): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return data ? toCamelCase(data) : undefined;
  },

  async submit(input: any): Promise<any> {
    const response = {
      id: uuidv4(),
      ...toSnakeCase(input),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('survey_responses')
      .insert(response)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async countBySurvey(surveyId: string): Promise<number> {
    const { count, error } = await supabase
      .from('survey_responses')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', surveyId);

    if (error) return 0;
    return count || 0;
  },
};
