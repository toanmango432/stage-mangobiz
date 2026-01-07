/**
 * Licenses Repository
 * Handles CRUD operations for license management
 */

import { BaseRepository, QueryOptions, APIError } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';
import { License, LicenseType, LicenseStatus } from '@/types/entities';

// Database row type (snake_case)
interface LicenseRow {
  id: string;
  tenant_id: string;
  license_key: string;
  type: string;
  status: string;
  max_devices: number;
  active_devices: number;
  expires_at: string;
  activated_at?: string;
  created_at: string;
  updated_at: string;
}

// Convert DB row to app type
function toLicense(row: LicenseRow): License {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    licenseKey: row.license_key,
    type: row.type as LicenseType,
    status: row.status as LicenseStatus,
    maxDevices: row.max_devices,
    activeDevices: row.active_devices,
    expiresAt: row.expires_at,
    activatedAt: row.activated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert app type to DB row
function toRow(license: Partial<License>): Partial<LicenseRow> {
  const row: Partial<LicenseRow> = {};
  if (license.tenantId !== undefined) row.tenant_id = license.tenantId;
  if (license.licenseKey !== undefined) row.license_key = license.licenseKey;
  if (license.type !== undefined) row.type = license.type;
  if (license.status !== undefined) row.status = license.status;
  if (license.maxDevices !== undefined) row.max_devices = license.maxDevices;
  if (license.activeDevices !== undefined) row.active_devices = license.activeDevices;
  if (license.expiresAt !== undefined) row.expires_at = license.expiresAt;
  if (license.activatedAt !== undefined) row.activated_at = license.activatedAt;
  return row;
}

class LicensesRepository extends BaseRepository<LicenseRow> {
  constructor() {
    super('licenses');
  }

  /**
   * Get all licenses
   */
  async getAll(options?: QueryOptions): Promise<License[]> {
    const result = await this.findAll(options);
    return result.data.map(toLicense);
  }

  /**
   * Get license by ID
   */
  async getById(id: string): Promise<License | null> {
    const result = await this.findById(id);
    return result.data ? toLicense(result.data) : null;
  }

  /**
   * Get license by key
   */
  async getByKey(licenseKey: string): Promise<License | null> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('*').eq('license_key', licenseKey).single()
      );

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw APIError.fromSupabaseError(error);
      }

      return data ? toLicense(data as LicenseRow) : null;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get licenses by tenant
   */
  async getByTenant(tenantId: string): Promise<License[]> {
    const result = await this.findByField('tenant_id', tenantId);
    return result.data.map(toLicense);
  }

  /**
   * Create a new license
   */
  async createLicense(data: Omit<License, 'id' | 'createdAt' | 'updatedAt'>): Promise<License> {
    const result = await this.create(toRow(data) as any);
    return toLicense(result.data);
  }

  /**
   * Update a license
   */
  async updateLicense(id: string, data: Partial<License>): Promise<License> {
    const result = await this.update(id, toRow(data) as any);
    return toLicense(result.data);
  }

  /**
   * Revoke a license
   */
  async revoke(id: string): Promise<License> {
    return this.updateLicense(id, { status: 'revoked' });
  }

  /**
   * Activate a license
   */
  async activate(id: string): Promise<License> {
    return this.updateLicense(id, {
      status: 'active',
      activatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get expiring licenses (within next X days)
   */
  async getExpiring(days: number = 30): Promise<License[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await withCircuitBreaker(() =>
        supabase
          .from(this.tableName)
          .select('*')
          .eq('status', 'active')
          .lt('expires_at', futureDate.toISOString())
          .gt('expires_at', new Date().toISOString())
          .order('expires_at', { ascending: true })
      );

      if (error) throw APIError.fromSupabaseError(error);

      return (data || []).map(toLicense);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.fromSupabaseError(error);
    }
  }

  /**
   * Get license count by status
   */
  async getCountByStatus(): Promise<Record<string, number>> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('status')
      );

      if (error) throw APIError.fromSupabaseError(error);

      const counts: Record<string, number> = { active: 0, expired: 0, revoked: 0, suspended: 0 };
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

export const licensesRepository = new LicensesRepository();
export { LicensesRepository };
