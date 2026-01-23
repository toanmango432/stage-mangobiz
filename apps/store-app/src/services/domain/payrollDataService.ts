/**
 * Payroll Data Service
 *
 * Domain-specific data operations for pay runs and payroll management.
 * Follows the staffDataService.ts pattern for consistency.
 *
 * LOCAL-FIRST architecture:
 * - Reads from IndexedDB (instant response)
 * - Writes queue for background sync with server
 *
 * Note: Pay runs use IndexedDB for offline-first support.
 * payrollDB handles all database operations including sync queue integration.
 */

import { store } from '@/store';
import { payrollDB } from '@/db/payrollOperations';
import type {
  PayRun,
  PayRunStatus,
  CreatePayRunParams,
  AddAdjustmentParams,
  StaffPayment,
  AdjustmentType,
} from '@/types/payroll';

// ==================== HELPERS ====================

/**
 * Get current store ID from Redux store
 */
function getStoreId(): string {
  const state = store.getState();
  return state.auth.storeId || '';
}

/**
 * Get current user ID from Redux store
 */
function getUserId(): string {
  const state = store.getState();
  return state.auth.user?.id || 'system';
}

/**
 * Get device ID from Redux store or generate one
 */
function getDeviceId(): string {
  const state = store.getState();
  return state.auth.device?.id || 'web-client';
}

/**
 * Get tenant ID from Redux store
 */
function getTenantId(): string {
  const state = store.getState();
  return state.auth.store?.tenantId || 'default-tenant';
}

// ==================== PAYROLL SERVICE ====================

/**
 * Payroll data operations - LOCAL-FIRST
 * Reads from IndexedDB, writes handled by payrollDB with sync queue
 */
export const payrollService = {
  // ==================== READ OPERATIONS ====================

  /**
   * Get all pay runs for the current store
   */
  async getAll(): Promise<PayRun[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    return payrollDB.getAllPayRuns(storeId);
  },

  /**
   * Get a single pay run by ID
   */
  async getById(id: string): Promise<PayRun | null> {
    const payRun = await payrollDB.getPayRunById(id);
    return payRun || null;
  },

  /**
   * Get pay runs within a date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<PayRun[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    return payrollDB.getPayRunsByDateRange(storeId, startDate, endDate);
  },

  /**
   * Get pay runs by status
   */
  async getByStatus(status: PayRunStatus): Promise<PayRun[]> {
    const storeId = getStoreId();
    if (!storeId) return [];

    return payrollDB.getPayRunsByStatus(storeId, status);
  },

  /**
   * Get the most recent pay run
   */
  async getLatest(): Promise<PayRun | null> {
    const storeId = getStoreId();
    if (!storeId) return null;

    const payRun = await payrollDB.getLatestPayRun(storeId);
    return payRun || null;
  },

  // ==================== WRITE OPERATIONS ====================

  /**
   * Create a new pay run
   * Automatically populates staff payments from timesheets
   */
  async create(params: CreatePayRunParams): Promise<PayRun> {
    const storeId = getStoreId();
    if (!storeId) throw new Error('No store ID');

    const userId = getUserId();
    const deviceId = getDeviceId();
    const tenantId = getTenantId();

    const id = await payrollDB.createPayRun(params, storeId, userId, deviceId, tenantId);

    // Fetch the created pay run
    const created = await payrollDB.getPayRunById(id);
    if (!created) throw new Error('Failed to create pay run');

    return created;
  },

  /**
   * Update an existing pay run
   */
  async update(id: string, updates: Partial<PayRun>): Promise<PayRun | null> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    try {
      const updated = await payrollDB.updatePayRun(id, updates, userId, deviceId);
      return updated;
    } catch (error) {
      console.error('[PayrollDataService] Failed to update pay run:', error);
      return null;
    }
  },

  /**
   * Delete a pay run (only draft status allowed)
   */
  async delete(id: string): Promise<void> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    await payrollDB.deletePayRun(id, userId, deviceId);
  },

  // ==================== STAFF PAYMENT OPERATIONS ====================

  /**
   * Add or update a staff payment in a pay run
   */
  async upsertStaffPayment(payRunId: string, staffPayment: StaffPayment): Promise<PayRun> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    return payrollDB.upsertStaffPayment(payRunId, staffPayment, userId, deviceId);
  },

  /**
   * Add an adjustment to a staff payment
   */
  async addAdjustment(params: AddAdjustmentParams): Promise<PayRun> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    return payrollDB.addAdjustment(params, userId, deviceId);
  },

  /**
   * Remove an adjustment from a staff payment
   */
  async removeAdjustment(payRunId: string, staffId: string, adjustmentId: string): Promise<PayRun> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    return payrollDB.removeAdjustment(payRunId, staffId, adjustmentId, userId, deviceId);
  },

  /**
   * Mark a single staff payment as paid
   */
  async markStaffPaid(
    payRunId: string,
    staffId: string,
    paymentReference?: string
  ): Promise<PayRun> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    return payrollDB.markStaffPaid(payRunId, staffId, paymentReference, userId, deviceId);
  },

  // ==================== WORKFLOW OPERATIONS ====================

  /**
   * Submit pay run for approval (draft -> pending_approval)
   */
  async submit(id: string): Promise<PayRun> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    return payrollDB.submitForApproval(id, userId, deviceId);
  },

  /**
   * Approve a pay run (pending_approval -> approved)
   */
  async approve(id: string, notes?: string): Promise<PayRun> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    return payrollDB.approvePayRun(id, notes, userId, deviceId);
  },

  /**
   * Reject a pay run (pending_approval -> draft)
   */
  async reject(id: string, reason: string): Promise<PayRun> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    return payrollDB.rejectPayRun(id, reason, userId, deviceId);
  },

  /**
   * Process a pay run (approved -> processed)
   */
  async process(id: string, notes?: string): Promise<PayRun> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    return payrollDB.processPayRun(id, notes, userId, deviceId);
  },

  /**
   * Void a pay run (any status -> voided)
   */
  async void(id: string, reason: string): Promise<PayRun> {
    const userId = getUserId();
    const deviceId = getDeviceId();

    return payrollDB.voidPayRun(id, reason, userId, deviceId);
  },
};

export default payrollService;
