/**
 * AppointmentSQLiteService - SQLite service for appointments
 *
 * Provides SQLite-based CRUD operations for appointments with
 * date range queries, staff filtering, and client lookup support.
 *
 * @module sqlite-adapter/services/appointmentService
 */

import { BaseSQLiteService, type TableSchema } from './BaseSQLiteService';
import type { SQLiteAdapter } from '../types';

// ==================== TYPES ====================

/**
 * AppointmentService represents a service within an appointment
 */
export interface AppointmentService {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  duration: number; // minutes
  price: number;
}

/**
 * Appointment status type
 */
export type AppointmentStatus =
  | 'scheduled'
  | 'checked-in'
  | 'waiting'
  | 'in-service'
  | 'completed'
  | 'cancelled'
  | 'no-show';

/**
 * Booking source type
 */
export type BookingSource =
  | 'phone'
  | 'walk-in'
  | 'online'
  | 'mango-store'
  | 'client-app'
  | 'admin-portal';

/**
 * Appointment entity type
 *
 * Extends Record<string, unknown> to satisfy BaseSQLiteService constraint.
 */
export interface Appointment extends Record<string, unknown> {
  id: string;
  storeId: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  staffId: string;
  staffName?: string;
  services: AppointmentService[];
  status: AppointmentStatus;
  scheduledStartTime: string; // ISO string
  scheduledEndTime: string; // ISO string
  actualStartTime?: string;
  actualEndTime?: string;
  checkInTime?: string;
  notes?: string;
  source?: BookingSource;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
  syncStatus?: string;
}

/**
 * Appointment SQLite row type
 */
export interface AppointmentRow {
  id: string;
  storeId: string;
  clientId: string;
  clientName: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  staffId: string;
  staffName: string | null;
  services: string; // JSON array
  status: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  checkInTime: string | null;
  notes: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  lastModifiedBy: string | null;
  syncStatus: string | null;
}

// ==================== SCHEMA ====================

/**
 * Appointment table schema
 *
 * Note: The database schema uses camelCase column names for appointments
 * (unlike clients/tickets which use snake_case).
 */
const appointmentSchema: TableSchema = {
  tableName: 'appointments',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'storeId',
    clientId: 'clientId',
    clientName: 'clientName',
    clientPhone: 'clientPhone',
    clientEmail: 'clientEmail',
    staffId: 'staffId',
    staffName: 'staffName',
    services: { column: 'services', type: 'json', defaultValue: [] },
    status: 'status',
    scheduledStartTime: { column: 'scheduledStartTime', type: 'date' },
    scheduledEndTime: { column: 'scheduledEndTime', type: 'date' },
    actualStartTime: { column: 'actualStartTime', type: 'date' },
    actualEndTime: { column: 'actualEndTime', type: 'date' },
    checkInTime: { column: 'checkInTime', type: 'date' },
    notes: 'notes',
    source: 'source',
    createdAt: { column: 'createdAt', type: 'date' },
    updatedAt: { column: 'updatedAt', type: 'date' },
    createdBy: 'createdBy',
    lastModifiedBy: 'lastModifiedBy',
    syncStatus: { column: 'syncStatus', type: 'string', defaultValue: 'local' },
  },
};

// ==================== SERVICE CLASS ====================

/**
 * SQLite service for appointments
 *
 * Extends BaseSQLiteService with appointment-specific query methods:
 * - Date range queries for calendar views
 * - Staff filtering for assignment views
 * - Client filtering for client history
 * - Status filtering for dashboard views
 * - Upcoming appointment queries for reminders
 *
 * @example
 * const service = new AppointmentSQLiteService(db);
 * const todayAppts = await service.getByDateRange(storeId, startOfDay, endOfDay);
 * const staffAppts = await service.getByStaff(staffId, today);
 */
export class AppointmentSQLiteService extends BaseSQLiteService<Appointment, AppointmentRow> {
  constructor(db: SQLiteAdapter) {
    super(db, appointmentSchema);
  }

  /**
   * Get appointments by date range
   *
   * Retrieves all appointments within a time range for a store.
   * Uses SQL BETWEEN for efficient date filtering.
   *
   * @param storeId - Store ID to filter by
   * @param start - Start of date range (ISO string)
   * @param end - End of date range (ISO string)
   * @returns Appointments within the date range, ordered by start time
   */
  async getByDateRange(storeId: string, start: string, end: string): Promise<Appointment[]> {
    return this.findWhere(
      'storeId = ? AND scheduledStartTime >= ? AND scheduledStartTime <= ?',
      [storeId, start, end],
      'scheduledStartTime ASC'
    );
  }

  /**
   * Get appointments by staff member
   *
   * Retrieves appointments assigned to a specific staff member.
   * Optionally filters by date for daily schedule views.
   *
   * @param staffId - Staff ID to filter by
   * @param date - Optional date to filter (ISO string, matches start of day)
   * @returns Staff appointments, ordered by start time
   */
  async getByStaff(staffId: string, date?: string): Promise<Appointment[]> {
    if (date) {
      // Filter by staff and date (date range for the full day)
      const startOfDay = date.includes('T') ? date.split('T')[0] + 'T00:00:00.000Z' : date + 'T00:00:00.000Z';
      const endOfDay = date.includes('T') ? date.split('T')[0] + 'T23:59:59.999Z' : date + 'T23:59:59.999Z';

      return this.findWhere(
        'staffId = ? AND scheduledStartTime >= ? AND scheduledStartTime <= ?',
        [staffId, startOfDay, endOfDay],
        'scheduledStartTime ASC'
      );
    }

    // All appointments for staff (no date filter)
    return this.findWhere('staffId = ?', [staffId], 'scheduledStartTime DESC');
  }

  /**
   * Get appointments by client
   *
   * Retrieves all appointments for a specific client.
   * Useful for client history views.
   *
   * @param clientId - Client ID to filter by
   * @returns Client appointments, ordered by start time descending (most recent first)
   */
  async getByClient(clientId: string): Promise<Appointment[]> {
    return this.findWhere('clientId = ?', [clientId], 'scheduledStartTime DESC');
  }

  /**
   * Get appointments by status
   *
   * Retrieves all appointments with a specific status for a store.
   * Useful for dashboard views (e.g., showing all checked-in clients).
   *
   * @param storeId - Store ID to filter by
   * @param status - Appointment status to filter by
   * @returns Appointments with the given status, ordered by start time
   */
  async getByStatus(storeId: string, status: AppointmentStatus): Promise<Appointment[]> {
    return this.findWhere(
      'storeId = ? AND status = ?',
      [storeId, status],
      'scheduledStartTime ASC'
    );
  }

  /**
   * Get upcoming appointments
   *
   * Retrieves appointments starting within the next N hours.
   * Uses SQL date comparison for efficient filtering.
   * Excludes cancelled and no-show appointments.
   *
   * @param storeId - Store ID to filter by
   * @param hours - Number of hours to look ahead (default: 2)
   * @returns Upcoming appointments, ordered by start time
   */
  async getUpcoming(storeId: string, hours: number = 2): Promise<Appointment[]> {
    const now = new Date().toISOString();
    const future = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    return this.findWhere(
      'storeId = ? AND scheduledStartTime >= ? AND scheduledStartTime <= ? AND status NOT IN (?, ?)',
      [storeId, now, future, 'cancelled', 'no-show'],
      'scheduledStartTime ASC'
    );
  }

  /**
   * Get appointments for today
   *
   * Convenience method for getting all appointments for the current day.
   *
   * @param storeId - Store ID to filter by
   * @returns Today's appointments, ordered by start time
   */
  async getToday(storeId: string): Promise<Appointment[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

    return this.getByDateRange(storeId, startOfDay, endOfDay);
  }

  /**
   * Get all appointments for a store
   *
   * Retrieves all appointments for a store with pagination.
   *
   * @param storeId - Store ID to filter by
   * @param limit - Maximum number of records (default: 1000)
   * @param offset - Number of records to skip (default: 0)
   * @returns Appointments for the store, ordered by start time descending
   */
  async getByStore(storeId: string, limit: number = 1000, offset: number = 0): Promise<Appointment[]> {
    return this.findWhere('storeId = ?', [storeId], 'scheduledStartTime DESC', limit, offset);
  }

  /**
   * Count appointments by status
   *
   * Returns the count of appointments with a specific status for a store.
   * Useful for dashboard metrics.
   *
   * @param storeId - Store ID to filter by
   * @param status - Appointment status to count
   * @returns Count of appointments with the given status
   */
  async countByStatus(storeId: string, status: AppointmentStatus): Promise<number> {
    return this.countWhere('storeId = ? AND status = ?', [storeId, status]);
  }

  /**
   * Update appointment status
   *
   * Quick method to update just the status of an appointment.
   * Also updates the updatedAt timestamp.
   *
   * @param id - Appointment ID
   * @param status - New status
   * @returns Updated appointment or undefined if not found
   */
  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment | undefined> {
    return this.update(id, { status } as Partial<Appointment>);
  }

  /**
   * Check in an appointment
   *
   * Sets status to 'checked-in' and records the check-in time.
   *
   * @param id - Appointment ID
   * @returns Updated appointment or undefined if not found
   */
  async checkIn(id: string): Promise<Appointment | undefined> {
    return this.update(id, {
      status: 'checked-in',
      checkInTime: new Date().toISOString(),
    } as Partial<Appointment>);
  }

  /**
   * Start service for an appointment
   *
   * Sets status to 'in-service' and records the actual start time.
   *
   * @param id - Appointment ID
   * @returns Updated appointment or undefined if not found
   */
  async startService(id: string): Promise<Appointment | undefined> {
    return this.update(id, {
      status: 'in-service',
      actualStartTime: new Date().toISOString(),
    } as Partial<Appointment>);
  }

  /**
   * Complete an appointment
   *
   * Sets status to 'completed' and records the actual end time.
   *
   * @param id - Appointment ID
   * @returns Updated appointment or undefined if not found
   */
  async complete(id: string): Promise<Appointment | undefined> {
    return this.update(id, {
      status: 'completed',
      actualEndTime: new Date().toISOString(),
    } as Partial<Appointment>);
  }

  /**
   * Cancel an appointment
   *
   * Sets status to 'cancelled'.
   *
   * @param id - Appointment ID
   * @returns Updated appointment or undefined if not found
   */
  async cancel(id: string): Promise<Appointment | undefined> {
    return this.update(id, { status: 'cancelled' } as Partial<Appointment>);
  }

  /**
   * Mark appointment as no-show
   *
   * Sets status to 'no-show'.
   *
   * @param id - Appointment ID
   * @returns Updated appointment or undefined if not found
   */
  async markNoShow(id: string): Promise<Appointment | undefined> {
    return this.update(id, { status: 'no-show' } as Partial<Appointment>);
  }
}
