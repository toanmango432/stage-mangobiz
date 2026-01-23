/**
 * Staff Type Adapter
 *
 * Converts between Supabase StaffRow and app Staff types.
 */

import type { StaffRow, StaffInsert, StaffUpdate, Json } from '../types';
import type { Staff, StaffStatus, SyncStatus } from '@mango/types';
import type { StaffSchedule } from '@mango/types/staff';

/**
 * Convert Supabase StaffRow to app Staff type
 */
export function toStaff(row: StaffRow): Staff {
  const schedule = parseSchedule(row.schedule);

  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    email: row.email || '',
    phone: row.phone || '',
    specialties: [], // Not stored in current Supabase schema
    status: row.status as StaffStatus,
    isActive: row.is_active,
    schedule,
    servicesCountToday: 0, // Computed at runtime
    revenueToday: 0, // Computed at runtime
    tipsToday: 0, // Computed at runtime
    createdAt: row.created_at, // ISO string (UTC)
    updatedAt: row.updated_at, // ISO string (UTC)
    syncStatus: row.sync_status as SyncStatus,
  };
}

/**
 * Convert app Staff to Supabase StaffInsert
 */
export function toStaffInsert(
  staff: Omit<Staff, 'id' | 'createdAt' | 'updatedAt' | 'servicesCountToday' | 'revenueToday' | 'tipsToday'>,
  storeId?: string
): Omit<StaffInsert, 'store_id'> & { store_id?: string } {
  return {
    store_id: storeId || staff.storeId,
    name: staff.name,
    email: staff.email || null,
    phone: staff.phone || null,
    status: staff.status,
    is_active: staff.isActive ?? true,
    schedule: serializeSchedule(staff.schedule) as Json,
    sync_status: staff.syncStatus || 'synced',
    sync_version: 1,
  };
}

/**
 * Convert partial Staff updates to Supabase StaffUpdate
 */
export function toStaffUpdate(updates: Partial<Staff>): StaffUpdate {
  const result: StaffUpdate = {};

  if (updates.name !== undefined) {
    result.name = updates.name;
  }
  if (updates.email !== undefined) {
    result.email = updates.email || null;
  }
  if (updates.phone !== undefined) {
    result.phone = updates.phone || null;
  }
  if (updates.status !== undefined) {
    result.status = updates.status;
  }
  if (updates.isActive !== undefined) {
    result.is_active = updates.isActive;
  }
  if (updates.schedule !== undefined) {
    result.schedule = serializeSchedule(updates.schedule) as Json;
  }
  if (updates.syncStatus !== undefined) {
    result.sync_status = updates.syncStatus;
  }

  return result;
}

// ==================== PARSE HELPERS ====================

function parseSchedule(json: Json): StaffSchedule[] {
  if (!json || !Array.isArray(json)) return [];

  return json.map((item) => {
    const schedule = item as Record<string, unknown>;
    return {
      dayOfWeek: Number(schedule.dayOfWeek ?? schedule.day_of_week ?? 0),
      startTime: String(schedule.startTime ?? schedule.start_time ?? '09:00'),
      endTime: String(schedule.endTime ?? schedule.end_time ?? '17:00'),
      isAvailable: Boolean(schedule.isAvailable ?? schedule.is_available ?? true),
    };
  });
}

// ==================== SERIALIZE HELPERS ====================

function serializeSchedule(schedule?: StaffSchedule[]): unknown[] | null {
  if (!schedule) return null;
  return schedule.map(s => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    isAvailable: s.isAvailable,
  }));
}

/**
 * Convert array of StaffRows to Staff
 */
export function toStaffList(rows: StaffRow[]): Staff[] {
  return rows.map(toStaff);
}
