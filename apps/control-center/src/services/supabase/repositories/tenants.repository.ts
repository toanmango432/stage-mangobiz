/**
 * Tenants Repository
 * Handles CRUD operations for tenant (business owner) management
 */

import { BaseRepository, QueryOptions, QueryResult, APIError } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';
import { Tenant } from '@/types/entities';

// Database row type (snake_case)
interface TenantRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  plan_type: string;
  max_stores: number;
  created_at: string;
  updated_at: string;
}

// Convert DB row to app type
function toTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status as Tenant['status'],
    planType: row.plan_type as Tenant['planType'],
    maxStores: row.max_stores,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert app type to DB row
function toRow(tenant: Partial<Tenant>): Partial<TenantRow> {
  const row: Partial<TenantRow> = {};
  if (tenant.name !== undefined) row.name = tenant.name;
  if (tenant.email !== undefined) row.email = tenant.email;
  if (tenant.phone !== undefined) row.phone = tenant.phone;
  if (tenant.status !== undefined) row.status = tenant.status;
  if (tenant.planType !== undefined) row.plan_type = tenant.planType;
  if (tenant.maxStores !== undefined) row.max_stores = tenant.maxStores;
  return row;
}

class TenantsRepository extends BaseRepository<TenantRow> {
  constructor() {
    super('tenants');
  }

  /**
   * Get all tenants
   */
  async getAll(options?: QueryOptions): Promise<Tenant[]> {
    const result = await this.findAll(options);
    return result.data.map(toTenant);
  }

  /**
   * Get tenant by ID
   */
  async getById(id: string): Promise<Tenant | null> {
    const result = await this.findById(id);
    return result.data ? toTenant(result.data) : null;
  }

  /**
   * Get tenant by email
   */
  async getByEmail(email: string): Promise<Tenant | null> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('*').eq('email', email).single()
      );

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw APIError.fromSupabaseError(error);
      }

      return data ? toTenant(data as TenantRow) : null;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Create a new tenant
   */
  async createTenant(data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> {
    const result = await this.create(toRow(data) as any);
    return toTenant(result.data);
  }

  /**
   * Update a tenant
   */
  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const result = await this.update(id, toRow(data) as any);
    return toTenant(result.data);
  }

  /**
   * Suspend a tenant
   */
  async suspend(id: string): Promise<Tenant> {
    return this.updateTenant(id, { status: 'suspended' });
  }

  /**
   * Activate a tenant
   */
  async activate(id: string): Promise<Tenant> {
    return this.updateTenant(id, { status: 'active' });
  }

  /**
   * Get tenant count by status
   */
  async getCountByStatus(): Promise<Record<string, number>> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('status')
      );

      if (error) throw APIError.fromSupabaseError(error);

      const counts: Record<string, number> = { active: 0, suspended: 0, inactive: 0 };
      data?.forEach((row: any) => {
        counts[row.status] = (counts[row.status] || 0) + 1;
      });

      return counts;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }
}

export const tenantsRepository = new TenantsRepository();
export { TenantsRepository };
