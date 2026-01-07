/**
 * Stores Repository
 * Handles CRUD operations for store (salon) management
 */

import { BaseRepository, QueryOptions, APIError } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';
import { Store } from '@/types/entities';

// Database row type (snake_case)
interface StoreRow {
  id: string;
  tenant_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  timezone: string;
  status: string;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

// Convert DB row to app type
function toStore(row: StoreRow): Store {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
    phone: row.phone,
    email: row.email,
    timezone: row.timezone,
    status: row.status as Store['status'],
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert app type to DB row
function toRow(store: Partial<Store>): Partial<StoreRow> {
  const row: Partial<StoreRow> = {};
  if (store.tenantId !== undefined) row.tenant_id = store.tenantId;
  if (store.name !== undefined) row.name = store.name;
  if (store.address !== undefined) row.address = store.address;
  if (store.city !== undefined) row.city = store.city;
  if (store.state !== undefined) row.state = store.state;
  if (store.zipCode !== undefined) row.zip_code = store.zipCode;
  if (store.phone !== undefined) row.phone = store.phone;
  if (store.email !== undefined) row.email = store.email;
  if (store.timezone !== undefined) row.timezone = store.timezone;
  if (store.status !== undefined) row.status = store.status;
  if (store.passwordHash !== undefined) row.password_hash = store.passwordHash;
  return row;
}

class StoresRepository extends BaseRepository<StoreRow> {
  constructor() {
    super('stores');
  }

  /**
   * Get all stores
   */
  async getAll(options?: QueryOptions): Promise<Store[]> {
    const result = await this.findAll(options);
    return result.data.map(toStore);
  }

  /**
   * Get store by ID
   */
  async getById(id: string): Promise<Store | null> {
    const result = await this.findById(id);
    return result.data ? toStore(result.data) : null;
  }

  /**
   * Get stores by tenant
   */
  async getByTenant(tenantId: string): Promise<Store[]> {
    const result = await this.findByField('tenant_id', tenantId);
    return result.data.map(toStore);
  }

  /**
   * Create a new store
   */
  async createStore(data: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Promise<Store> {
    const result = await this.create(toRow(data) as any);
    return toStore(result.data);
  }

  /**
   * Update a store
   */
  async updateStore(id: string, data: Partial<Store>): Promise<Store> {
    const result = await this.update(id, toRow(data) as any);
    return toStore(result.data);
  }

  /**
   * Suspend a store
   */
  async suspend(id: string): Promise<Store> {
    return this.updateStore(id, { status: 'suspended' });
  }

  /**
   * Activate a store
   */
  async activate(id: string): Promise<Store> {
    return this.updateStore(id, { status: 'active' });
  }

  /**
   * Get store count by status
   */
  async getCountByStatus(): Promise<Record<string, number>> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('status')
      );

      if (error) throw APIError.fromSupabaseError(error);

      const counts: Record<string, number> = { active: 0, inactive: 0, suspended: 0 };
      data?.forEach((row: any) => {
        counts[row.status] = (counts[row.status] || 0) + 1;
      });

      return counts;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get store count by tenant
   */
  async getCountByTenant(tenantId: string): Promise<number> {
    return this.count({ tenant_id: tenantId });
  }
}

export const storesRepository = new StoresRepository();
export { StoresRepository };
