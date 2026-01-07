/**
 * Devices Repository
 * Handles CRUD operations for device management
 */

import { BaseRepository, QueryOptions, APIError } from './base.repository';
import { supabase, withCircuitBreaker } from '../client';
import { Device } from '@/types/entities';

// Database row type (snake_case)
interface DeviceRow {
  id: string;
  store_id: string;
  license_id: string;
  device_type: string;
  device_name: string;
  device_id: string;
  status: string;
  last_seen_at?: string;
  registered_at: string;
  created_at: string;
  updated_at: string;
}

// Convert DB row to app type
function toDevice(row: DeviceRow): Device {
  return {
    id: row.id,
    storeId: row.store_id,
    licenseId: row.license_id,
    deviceType: row.device_type as Device['deviceType'],
    deviceName: row.device_name,
    deviceId: row.device_id,
    status: row.status as Device['status'],
    lastSeenAt: row.last_seen_at,
    registeredAt: row.registered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert app type to DB row
function toRow(device: Partial<Device>): Partial<DeviceRow> {
  const row: Partial<DeviceRow> = {};
  if (device.storeId !== undefined) row.store_id = device.storeId;
  if (device.licenseId !== undefined) row.license_id = device.licenseId;
  if (device.deviceType !== undefined) row.device_type = device.deviceType;
  if (device.deviceName !== undefined) row.device_name = device.deviceName;
  if (device.deviceId !== undefined) row.device_id = device.deviceId;
  if (device.status !== undefined) row.status = device.status;
  if (device.lastSeenAt !== undefined) row.last_seen_at = device.lastSeenAt;
  if (device.registeredAt !== undefined) row.registered_at = device.registeredAt;
  return row;
}

class DevicesRepository extends BaseRepository<DeviceRow> {
  constructor() {
    super('devices');
  }

  /**
   * Get all devices
   */
  async getAll(options?: QueryOptions): Promise<Device[]> {
    const result = await this.findAll(options);
    return result.data.map(toDevice);
  }

  /**
   * Get device by ID
   */
  async getById(id: string): Promise<Device | null> {
    const result = await this.findById(id);
    return result.data ? toDevice(result.data) : null;
  }

  /**
   * Get devices by store
   */
  async getByStore(storeId: string): Promise<Device[]> {
    const result = await this.findByField('store_id', storeId);
    return result.data.map(toDevice);
  }

  /**
   * Get devices by license
   */
  async getByLicense(licenseId: string): Promise<Device[]> {
    const result = await this.findByField('license_id', licenseId);
    return result.data.map(toDevice);
  }

  /**
   * Create a new device
   */
  async createDevice(data: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>): Promise<Device> {
    const result = await this.create(toRow(data) as any);
    return toDevice(result.data);
  }

  /**
   * Update a device
   */
  async updateDevice(id: string, data: Partial<Device>): Promise<Device> {
    const result = await this.update(id, toRow(data) as any);
    return toDevice(result.data);
  }

  /**
   * Block a device
   */
  async block(id: string): Promise<Device> {
    return this.updateDevice(id, { status: 'blocked' });
  }

  /**
   * Activate a device
   */
  async activate(id: string): Promise<Device> {
    return this.updateDevice(id, { status: 'active' });
  }

  /**
   * Update last seen timestamp
   */
  async updateLastSeen(id: string): Promise<void> {
    await this.update(id, { last_seen_at: new Date().toISOString() } as any);
  }

  /**
   * Get device count by status
   */
  async getCountByStatus(): Promise<Record<string, number>> {
    try {
      const { data, error } = await withCircuitBreaker(() =>
        supabase.from(this.tableName).select('status')
      );

      if (error) throw APIError.fromSupabaseError(error);

      const counts: Record<string, number> = { active: 0, inactive: 0, blocked: 0 };
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

export const devicesRepository = new DevicesRepository();
export { DevicesRepository };
