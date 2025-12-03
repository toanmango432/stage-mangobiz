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
    const store = {
      id: uuidv4(),
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
    const member = {
      id: uuidv4(),
      tenant_id: input.tenantId,
      store_ids: input.storeIds,
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

// ==================== DATABASE STATS ====================

export async function getSupabaseDBStats() {
  const [tenants, licenses, stores, members, adminUsers, auditLogs] = await Promise.all([
    tenantsDB.count(),
    licensesDB.count(),
    storesDB.count(),
    membersDB.count(),
    adminUsersDB.count(),
    auditLogsDB.count(),
  ]);

  return {
    tenants,
    licenses,
    stores,
    members,
    adminUsers,
    auditLogs,
    total: tenants + licenses + stores + members + adminUsers + auditLogs,
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
