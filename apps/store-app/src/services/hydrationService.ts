/**
 * Hydration Service
 * LOCAL-FIRST: Populates IndexedDB from Supabase on first login
 *
 * Flow:
 * 1. After login, check if IndexedDB has data for this store
 * 2. If empty, pull from Supabase and store locally
 * 3. Mark hydration complete to skip on future logins
 */

import { supabase } from './supabase/client';
import { db } from '@/db/schema';
import {
  toStaff,
  toServices,
  toClients,
  toAppointments,
  toTickets,
} from './supabase/adapters';
import type { StaffRow, ServiceRow, ClientRow, AppointmentRow, TicketRow } from './supabase/types';

// ==================== TYPES ====================

export type HydrationStage = 'checking' | 'staff' | 'services' | 'appointments' | 'clients' | 'tickets' | 'complete' | 'error';

export interface HydrationProgress {
  stage: HydrationStage;
  current: number;
  total: number;
  message: string;
  error?: string;
}

export type ProgressCallback = (progress: HydrationProgress) => void;

// ==================== CONSTANTS ====================

const HYDRATION_KEY_PREFIX = 'mango_hydration_complete_';
const HYDRATION_TIMESTAMP_PREFIX = 'mango_hydration_timestamp_';

// ==================== HYDRATION SERVICE ====================

class HydrationService {
  private isHydrating = false;
  private abortController: AbortController | null = null;

  /**
   * Check if store needs initial hydration
   * Returns true if IndexedDB has no staff for this store
   */
  async needsHydration(storeId: string): Promise<boolean> {
    // Check if already marked as hydrated
    const hydrated = localStorage.getItem(`${HYDRATION_KEY_PREFIX}${storeId}`);
    if (hydrated === 'true') {
      console.log('[Hydration] Already hydrated, skipping');
      return false;
    }

    // Check if we have any staff data
    try {
      const staffCount = await db.staff
        .where('storeId')
        .equals(storeId)
        .count();

      if (staffCount > 0) {
        console.log(`[Hydration] Found ${staffCount} staff, marking as hydrated`);
        this.markHydrationComplete(storeId);
        return false;
      }

      console.log('[Hydration] No staff found, hydration needed');
      return true;
    } catch (error) {
      console.error('[Hydration] Error checking IndexedDB:', error);
      return true;
    }
  }

  /**
   * Check if currently hydrating
   */
  isCurrentlyHydrating(): boolean {
    return this.isHydrating;
  }

  /**
   * Abort current hydration
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isHydrating = false;
  }

  /**
   * Hydrate IndexedDB from Supabase
   * Pulls all essential data for the store
   */
  async hydrateStore(
    storeId: string,
    onProgress?: ProgressCallback
  ): Promise<{ success: boolean; error?: string }> {
    if (this.isHydrating) {
      console.log('[Hydration] Already in progress, skipping');
      return { success: false, error: 'Hydration already in progress' };
    }

    this.isHydrating = true;
    this.abortController = new AbortController();

    const totalSteps = 5;
    let currentStep = 0;

    try {
      // PERFORMANCE FIX: Parallelize hydration in 2 phases instead of 5 sequential awaits

      // Phase 1: Staff + Services in parallel (both independent, needed for UI)
      currentStep = 2;
      onProgress?.({
        stage: 'staff',
        current: 1,
        total: totalSteps,
        message: 'Loading team & services...',
      });
      await Promise.all([
        this.hydrateStaff(storeId),
        this.hydrateServices(storeId),
      ]);

      if (this.abortController?.signal.aborted) throw new Error('Aborted');

      // Phase 2: Appointments + Clients + Tickets in parallel
      currentStep = 5;
      onProgress?.({
        stage: 'appointments',
        current: 3,
        total: totalSteps,
        message: 'Loading appointments, clients & tickets...',
      });
      await Promise.all([
        this.hydrateAppointments(storeId),
        this.hydrateClients(storeId),
        this.hydrateTickets(storeId),
      ]);

      if (this.abortController?.signal.aborted) throw new Error('Aborted');

      // Mark complete
      this.markHydrationComplete(storeId);
      onProgress?.({
        stage: 'complete',
        current: totalSteps,
        total: totalSteps,
        message: 'Ready!',
      });

      console.log('[Hydration] Complete for store:', storeId);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Hydration] Failed:', errorMessage);

      onProgress?.({
        stage: 'error',
        current: currentStep,
        total: totalSteps,
        message: 'Hydration failed',
        error: errorMessage,
      });

      return { success: false, error: errorMessage };

    } finally {
      this.isHydrating = false;
      this.abortController = null;
    }
  }

  /**
   * Pull and store staff
   */
  private async hydrateStaff(storeId: string): Promise<void> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('store_id', storeId);

    if (error) {
      console.error('[Hydration] Staff error:', error);
      throw new Error(`Staff: ${error.message}`);
    }

    if (data && data.length > 0) {
      const staff = data.map((row: StaffRow) => ({
        ...toStaff(row),
        syncStatus: 'synced' as const,
      }));
      await db.staff.bulkPut(staff);
      console.log(`[Hydration] Stored ${staff.length} staff members`);
    }
  }

  /**
   * Pull and store services
   */
  private async hydrateServices(storeId: string): Promise<void> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('store_id', storeId);

    if (error) {
      console.error('[Hydration] Services error:', error);
      throw new Error(`Services: ${error.message}`);
    }

    if (data && data.length > 0) {
      const services = toServices(data as ServiceRow[]).map(s => ({
        ...s,
        syncStatus: 'synced' as const,
      }));
      await db.services.bulkPut(services);
      console.log(`[Hydration] Stored ${services.length} services`);
    }
  }

  /**
   * Pull and store appointments (today and future)
   */
  private async hydrateAppointments(storeId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('store_id', storeId)
      .gte('scheduled_start_time', today.toISOString());

    if (error) {
      console.error('[Hydration] Appointments error:', error);
      throw new Error(`Appointments: ${error.message}`);
    }

    if (data && data.length > 0) {
      const appointments = toAppointments(data as AppointmentRow[]).map(a => ({
        ...a,
        syncStatus: 'synced' as const,
      }));
      await db.appointments.bulkPut(appointments);
      console.log(`[Hydration] Stored ${appointments.length} appointments`);
    }
  }

  /**
   * Pull and store clients (paginated for large datasets)
   */
  private async hydrateClients(storeId: string): Promise<void> {
    const PAGE_SIZE = 500;
    let offset = 0;
    let hasMore = true;
    let totalClients = 0;

    while (hasMore) {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('store_id', storeId)
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.error('[Hydration] Clients error:', error);
        throw new Error(`Clients: ${error.message}`);
      }

      if (data && data.length > 0) {
        const clients = toClients(data as ClientRow[]).map(c => ({
          ...c,
          syncStatus: 'synced' as const,
        }));
        await db.clients.bulkPut(clients);
        totalClients += clients.length;
        offset += data.length;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }

      // Check for abort
      if (this.abortController?.signal.aborted) {
        throw new Error('Aborted');
      }
    }

    console.log(`[Hydration] Stored ${totalClients} clients`);
  }

  /**
   * Pull and store tickets (open + recent closed)
   */
  private async hydrateTickets(storeId: string): Promise<void> {
    // Get open tickets + tickets from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('store_id', storeId)
      .or(`status.in.(pending,in-service),created_at.gte.${sevenDaysAgo.toISOString()}`);

    if (error) {
      console.error('[Hydration] Tickets error:', error);
      throw new Error(`Tickets: ${error.message}`);
    }

    if (data && data.length > 0) {
      const tickets = toTickets(data as TicketRow[]).map(t => ({
        ...t,
        syncStatus: 'synced' as const,
      }));
      await db.tickets.bulkPut(tickets);
      console.log(`[Hydration] Stored ${tickets.length} tickets`);
    }
  }

  /**
   * Mark hydration as complete for a store
   */
  markHydrationComplete(storeId: string): void {
    localStorage.setItem(`${HYDRATION_KEY_PREFIX}${storeId}`, 'true');
    localStorage.setItem(`${HYDRATION_TIMESTAMP_PREFIX}${storeId}`, Date.now().toString());
  }

  /**
   * Get hydration timestamp for a store
   */
  getHydrationTimestamp(storeId: string): Date | null {
    const timestamp = localStorage.getItem(`${HYDRATION_TIMESTAMP_PREFIX}${storeId}`);
    return timestamp ? new Date(parseInt(timestamp, 10)) : null;
  }

  /**
   * Clear hydration status (forces re-hydration on next login)
   */
  clearHydrationStatus(storeId: string): void {
    localStorage.removeItem(`${HYDRATION_KEY_PREFIX}${storeId}`);
    localStorage.removeItem(`${HYDRATION_TIMESTAMP_PREFIX}${storeId}`);
  }

  /**
   * Clear all local data for a store
   * Used when switching stores or for troubleshooting
   */
  async clearLocalData(storeId: string): Promise<void> {
    await Promise.all([
      db.staff.where('storeId').equals(storeId).delete(),
      db.services.where('storeId').equals(storeId).delete(),
      db.clients.where('storeId').equals(storeId).delete(),
      db.appointments.where('storeId').equals(storeId).delete(),
      db.tickets.where('storeId').equals(storeId).delete(),
    ]);
    this.clearHydrationStatus(storeId);
    console.log('[Hydration] Cleared local data for store:', storeId);
  }
}

// ==================== SINGLETON EXPORT ====================

export const hydrationService = new HydrationService();
export default hydrationService;
