/**
 * Appointment Data Service
 *
 * Domain-specific data operations for appointments.
 * Extracted from dataService.ts for better modularity.
 *
 * LOCAL-FIRST architecture:
 * - Reads from IndexedDB or SQLite (instant response)
 * - Writes queue for background sync with server
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron,
 * uses SQLite via sqliteAppointmentsDB
 */

import { store } from '@/store';
import { shouldUseSQLite } from '@/config/featureFlags';
import { appointmentsDB } from '@/db/database';
import { sqliteAppointmentsDB } from '@/services/sqliteServices';
import { syncQueueDB } from '@/db/database';
import type { Appointment } from '@/types';

// ==================== HELPERS ====================

/**
 * Get current store ID from Redux store
 */
function getStoreId(): string {
  const state = store.getState();
  return state.auth.storeId || '';
}

/**
 * Check if SQLite should be used
 */
const USE_SQLITE = shouldUseSQLite();

/**
 * Queue a sync operation for background processing
 * LOCAL-FIRST: Non-blocking, fire-and-forget
 */
function queueSyncOperation(
  action: 'create' | 'update' | 'delete',
  entityId: string,
  payload: unknown
): void {
  // Don't await - queue async
  syncQueueDB.add({
    type: action,
    entity: 'appointment',
    entityId,
    action: action.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
    payload,
    priority: action === 'delete' ? 1 : action === 'create' ? 2 : 3,
    maxAttempts: 5,
  }).catch(error => {
    console.warn('[AppointmentDataService] Failed to queue sync operation:', error);
    // Don't fail the operation - sync will be retried
  });
}

// ==================== APPOINTMENT SERVICE ====================

/**
 * Appointments data operations - LOCAL-FIRST
 * Reads from IndexedDB or SQLite, writes queue for background sync
 */
export const appointmentsService = {
  /**
   * Get appointments for a specific date
   */
  async getByDate(date: Date): Promise<Appointment[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    if (USE_SQLITE) {
      return sqliteAppointmentsDB.getByDate(storeId, date);
    }
    return appointmentsDB.getByDate(storeId, date);
  },

  /**
   * Get a single appointment by ID
   */
  async getById(id: string): Promise<Appointment | null> {
    if (USE_SQLITE) {
      const appointment = await sqliteAppointmentsDB.getById(id);
      return appointment || null;
    }
    const appointment = await appointmentsDB.getById(id);
    return appointment || null;
  },

  /**
   * Create a new appointment
   */
  async create(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Appointment> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID available');

    let created: Appointment;
    if (USE_SQLITE) {
      created = await sqliteAppointmentsDB.create(
        appointment as Parameters<typeof appointmentsDB.create>[0],
        'system',
        storeId
      );
    } else {
      created = await appointmentsDB.create(
        appointment as Parameters<typeof appointmentsDB.create>[0],
        'system',
        storeId
      );
    }

    // Queue for background sync (non-blocking)
    queueSyncOperation('create', created.id, created);

    return created;
  },

  /**
   * Update an existing appointment
   */
  async update(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    let updated: Appointment | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteAppointmentsDB.update(id, updates, 'system');
    } else {
      updated = await appointmentsDB.update(id, updates, 'system');
    }
    if (!updated) return null;

    // Queue for background sync (non-blocking)
    queueSyncOperation('update', id, updated);

    return updated;
  },

  /**
   * Get upcoming appointments (from today onwards)
   */
  async getUpcoming(limit = 50): Promise<Appointment[]> {
    const storeId = getStoreId();
    if (!storeId) return [];
    // Get appointments from today onwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (USE_SQLITE) {
      return sqliteAppointmentsDB.getByDate(storeId, today, limit);
    }
    return appointmentsDB.getByDate(storeId, today, limit);
  },

  /**
   * Update appointment status
   */
  async updateStatus(id: string, status: string): Promise<Appointment | null> {
    return this.update(id, { status: status as Appointment['status'] });
  },

  /**
   * Delete an appointment
   */
  async delete(id: string): Promise<void> {
    if (USE_SQLITE) {
      await sqliteAppointmentsDB.delete(id);
    } else {
      await appointmentsDB.delete(id);
    }

    // Queue for background sync (non-blocking)
    queueSyncOperation('delete', id, { id });
  },

  /**
   * Check in an appointment
   */
  async checkIn(id: string): Promise<Appointment | null> {
    let updated: Appointment | null | undefined;
    if (USE_SQLITE) {
      updated = await sqliteAppointmentsDB.checkIn(id, 'system');
    } else {
      updated = await appointmentsDB.checkIn(id, 'system');
    }
    if (updated) {
      queueSyncOperation('update', id, updated);
    }
    return updated || null;
  },
};

export default appointmentsService;
