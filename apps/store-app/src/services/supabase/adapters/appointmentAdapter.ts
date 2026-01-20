/**
 * Appointment Type Adapter
 *
 * Converts between Supabase AppointmentRow and app Appointment types.
 * This adapter handles the field name mapping and type conversions
 * needed to bridge the database schema and application models.
 */

import type { AppointmentRow, AppointmentInsert, AppointmentUpdate, Json } from '../types';
import type { Appointment, AppointmentService, CreateAppointmentInput } from '@/types/appointment';
import type { AppointmentStatus, BookingSource, SyncStatus } from '@/types/common';

/**
 * Convert Supabase AppointmentRow to app Appointment type
 */
export function toAppointment(row: AppointmentRow): Appointment {
  // Parse services JSON
  const services = parseServices(row.services);

  // Extract primary staff from services or use default
  const primaryStaff = services[0];

  return {
    id: row.id,
    storeId: row.store_id,
    clientId: row.client_id || '',
    clientName: row.client_name,
    clientPhone: '', // Not stored in Supabase row
    staffId: row.staff_id || primaryStaff?.staffId || '',
    staffName: primaryStaff?.staffName || '',
    services,
    status: row.status as AppointmentStatus,
    scheduledStartTime: row.scheduled_start_time, // ISO string (UTC)
    scheduledEndTime: row.scheduled_end_time,     // ISO string (UTC)
    notes: row.notes || undefined,
    source: 'walk_in' as BookingSource, // Default, not stored in row
    createdAt: row.created_at,  // ISO string (UTC)
    updatedAt: row.updated_at,  // ISO string (UTC)
    createdBy: 'system', // Not stored in row
    lastModifiedBy: 'system', // Not stored in row
    syncStatus: row.sync_status as SyncStatus,
  };
}

/**
 * Convert app Appointment to Supabase AppointmentInsert
 */
export function toAppointmentInsert(
  appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>,
  storeId?: string
): Omit<AppointmentInsert, 'store_id'> & { store_id?: string } {
  return {
    store_id: storeId || appointment.storeId,
    client_id: appointment.clientId || null,
    client_name: appointment.clientName,
    staff_id: appointment.staffId || null,
    services: serializeServices(appointment.services) as Json,
    status: appointment.status,
    scheduled_start_time: appointment.scheduledStartTime, // Already ISO string
    scheduled_end_time: appointment.scheduledEndTime,     // Already ISO string
    notes: appointment.notes || null,
    sync_status: appointment.syncStatus || 'synced',
    sync_version: 1,
  };
}

/**
 * Convert app CreateAppointmentInput to Supabase AppointmentInsert
 */
export function fromCreateInput(
  input: CreateAppointmentInput,
  storeId: string
): Omit<AppointmentInsert, 'id' | 'created_at' | 'updated_at'> {
  // Calculate end time from services
  const totalDuration = input.services.reduce((sum, s) => sum + (s.duration || 0), 0);
  // Handle both Date and string for scheduledStartTime
  const startDate = typeof input.scheduledStartTime === 'string'
    ? new Date(input.scheduledStartTime)
    : input.scheduledStartTime;
  const endTime = new Date(startDate.getTime() + totalDuration * 60000);

  return {
    store_id: storeId,
    client_id: input.clientId || null,
    client_name: input.clientName,
    staff_id: input.staffId || null,
    services: serializeServices(input.services.map(s => ({
      serviceId: s.serviceId,
      serviceName: '', // Will be filled by caller
      staffId: s.staffId,
      staffName: '', // Will be filled by caller
      duration: s.duration,
      price: (s as { BasePrice?: number }).BasePrice || 0,
    }))) as Json,
    status: 'scheduled',
    scheduled_start_time: startDate.toISOString(),
    scheduled_end_time: endTime.toISOString(),
    notes: input.notes || null,
    sync_status: 'synced',
    sync_version: 1,
  };
}

/**
 * Convert partial Appointment updates to Supabase AppointmentUpdate
 */
export function toAppointmentUpdate(updates: Partial<Appointment>): AppointmentUpdate {
  const result: AppointmentUpdate = {};

  if (updates.clientId !== undefined) {
    result.client_id = updates.clientId || null;
  }
  if (updates.clientName !== undefined) {
    result.client_name = updates.clientName;
  }
  if (updates.staffId !== undefined) {
    result.staff_id = updates.staffId || null;
  }
  if (updates.services !== undefined) {
    result.services = serializeServices(updates.services) as Json;
  }
  if (updates.status !== undefined) {
    result.status = updates.status;
  }
  if (updates.scheduledStartTime !== undefined) {
    result.scheduled_start_time = updates.scheduledStartTime; // Already ISO string
  }
  if (updates.scheduledEndTime !== undefined) {
    result.scheduled_end_time = updates.scheduledEndTime; // Already ISO string
  }
  if (updates.notes !== undefined) {
    result.notes = updates.notes || null;
  }
  if (updates.syncStatus !== undefined) {
    result.sync_status = updates.syncStatus;
  }

  return result;
}

/**
 * Parse services JSON from database
 */
function parseServices(json: Json): AppointmentService[] {
  if (!json) return [];

  try {
    const services = Array.isArray(json) ? json : [];
    return services.map((s) => {
      const service = s as Record<string, unknown>;
      const serviceName = String(service.serviceName || service.service_name || '');
      return {
        serviceId: String(service.serviceId || service.service_id || ''),
        serviceName,
        name: String(service.name || serviceName),
        staffId: String(service.staffId || service.staff_id || ''),
        staffName: String(service.staffName || service.staff_name || ''),
        duration: Number(service.duration || 0),
        price: Number(service.price || 0),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Serialize services to JSON for database
 */
function serializeServices(services: AppointmentService[] | Array<{ serviceId: string; staffId: string; duration: number; price: number }>): unknown {
  return services.map(s => ({
    serviceId: 'serviceId' in s ? s.serviceId : '',
    serviceName: 'serviceName' in s ? s.serviceName : '',
    staffId: s.staffId,
    staffName: 'staffName' in s ? s.staffName : '',
    duration: s.duration,
    price: s.price,
  }));
}

/**
 * Convert array of AppointmentRows to Appointments
 */
export function toAppointments(rows: AppointmentRow[]): Appointment[] {
  return rows.map(toAppointment);
}
