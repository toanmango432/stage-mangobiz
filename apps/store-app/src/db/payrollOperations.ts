import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import { syncQueueDB } from './database';
import type {
  PayRun,
  PayRunStatus,
  StaffPayment,
  PayRunAdjustment,
  CreatePayRunParams,
  AddAdjustmentParams,
} from '../types/payroll';
import {
  createEmptyTotals,
  calculatePayRunTotals,
} from '../types/payroll';
import {
  incrementEntityVersion,
  markEntityDeleted,
} from '../types/common';

// ============================================
// SYNC CONFIGURATION FOR PAY RUNS
// See: docs/DATA_STORAGE_STRATEGY.md
// ============================================

const SYNC_CONFIG = {
  entity: 'payrun' as const,
  priority: 3, // Lower priority than timesheets (payroll processed less frequently)
  tombstoneRetentionMs: 365 * 24 * 60 * 60 * 1000, // 1 year (for compliance)
};

/**
 * Add operation to sync queue
 */
async function queueForSync(
  type: 'create' | 'update' | 'delete',
  entity: PayRun,
  _storeId: string
): Promise<void> {
  const actionMap = {
    create: 'CREATE' as const,
    update: 'UPDATE' as const,
    delete: 'DELETE' as const,
  };

  await syncQueueDB.add({
    type,
    entity: SYNC_CONFIG.entity,
    entityId: entity.id,
    action: actionMap[type],
    payload: entity,
    priority: SYNC_CONFIG.priority,
    maxAttempts: 5,
  });
}

// ============================================
// PAY RUN DATABASE OPERATIONS
// Production-ready with sync queue integration
// ============================================

export const payrollDB = {
  // ---- Read Operations ----

  /**
   * Get all pay runs for a store (excludes deleted)
   */
  async getAllPayRuns(storeId: string): Promise<PayRun[]> {
    const payRuns = await db.payRuns
      .where('storeId')
      .equals(storeId)
      .toArray();
    return payRuns.filter((p) => !p.isDeleted);
  },

  /**
   * Get pay run by ID
   */
  async getPayRunById(id: string): Promise<PayRun | undefined> {
    return await db.payRuns.get(id);
  },

  /**
   * Get pay runs by date range
   */
  async getPayRunsByDateRange(
    storeId: string,
    startDate: string,
    endDate: string
  ): Promise<PayRun[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];
    const payRuns = await db.payRuns
      .where('[storeId+periodStart]')
      .between([storeId, startDate], [storeId, endDate], true, true)
      .toArray();
    return payRuns.filter((p) => !p.isDeleted);
  },

  /**
   * Get pay runs by status
   */
  async getPayRunsByStatus(
    storeId: string,
    status: PayRunStatus
  ): Promise<PayRun[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];
    const payRuns = await db.payRuns
      .where('[storeId+status]')
      .equals([storeId, status])
      .toArray();
    return payRuns.filter((p) => !p.isDeleted);
  },

  /**
   * Get the most recent pay run
   */
  async getLatestPayRun(storeId: string): Promise<PayRun | undefined> {
    // Guard: return undefined if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return undefined;
    const payRuns = await db.payRuns
      .where('[storeId+periodStart]')
      .between([storeId, ''], [storeId, '\uffff'])
      .reverse()
      .limit(1)
      .toArray();
    return payRuns.find((p) => !p.isDeleted);
  },

  // ---- Write Operations ----

  /**
   * Create a new pay run (draft status)
   */
  async createPayRun(
    params: CreatePayRunParams,
    storeId: string,
    userId: string,
    deviceId: string,
    tenantId: string = 'default-tenant'
  ): Promise<string> {
    const now = new Date().toISOString();
    const id = uuidv4();

    const payRun: PayRun = {
      // BaseSyncableEntity fields
      id,
      tenantId,
      storeId,
      syncStatus: 'local',
      version: 1,
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      createdByDevice: deviceId,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      isDeleted: false,

      // PayRun specific fields
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      periodType: params.periodType,
      status: 'draft',
      staffPayments: [],
      totals: createEmptyTotals(),
    };

    await db.payRuns.add(payRun);
    await queueForSync('create', payRun, storeId);

    return id;
  },

  /**
   * Update a pay run
   */
  async updatePayRun(
    id: string,
    updates: Partial<PayRun>,
    userId: string,
    deviceId: string
  ): Promise<PayRun> {
    const existing = await db.payRuns.get(id);
    if (!existing) {
      throw new Error(`Pay run ${id} not found`);
    }

    // Don't allow updates to processed or voided pay runs
    if (existing.status === 'processed' || existing.status === 'voided') {
      throw new Error(`Cannot update pay run with status: ${existing.status}`);
    }

    const updated = incrementEntityVersion(
      { ...existing, ...updates },
      userId,
      deviceId
    );

    // Recalculate totals if staff payments changed
    if (updates.staffPayments) {
      updated.totals = calculatePayRunTotals(updated.staffPayments);
    }

    await db.payRuns.put(updated);
    await queueForSync('update', updated, existing.storeId);

    return updated;
  },

  /**
   * Add or update a staff payment in a pay run
   */
  async upsertStaffPayment(
    payRunId: string,
    staffPayment: StaffPayment,
    userId: string,
    deviceId: string
  ): Promise<PayRun> {
    const payRun = await db.payRuns.get(payRunId);
    if (!payRun) {
      throw new Error(`Pay run ${payRunId} not found`);
    }

    if (payRun.status !== 'draft') {
      throw new Error('Can only modify staff payments in draft pay runs');
    }

    const existingIndex = payRun.staffPayments.findIndex(
      (p) => p.staffId === staffPayment.staffId
    );

    let updatedPayments: StaffPayment[];
    if (existingIndex >= 0) {
      // Update existing
      updatedPayments = [...payRun.staffPayments];
      updatedPayments[existingIndex] = staffPayment;
    } else {
      // Add new
      updatedPayments = [...payRun.staffPayments, staffPayment];
    }

    return await this.updatePayRun(
      payRunId,
      { staffPayments: updatedPayments },
      userId,
      deviceId
    );
  },

  /**
   * Add an adjustment to a staff payment
   */
  async addAdjustment(
    params: AddAdjustmentParams,
    userId: string,
    deviceId: string
  ): Promise<PayRun> {
    const payRun = await db.payRuns.get(params.payRunId);
    if (!payRun) {
      throw new Error(`Pay run ${params.payRunId} not found`);
    }

    if (payRun.status !== 'draft') {
      throw new Error('Can only add adjustments to draft pay runs');
    }

    const staffIndex = payRun.staffPayments.findIndex(
      (p) => p.staffId === params.staffId
    );
    if (staffIndex < 0) {
      throw new Error(`Staff ${params.staffId} not found in pay run`);
    }

    const adjustment: PayRunAdjustment = {
      id: uuidv4(),
      type: params.type,
      amount: params.amount,
      description: params.description,
      addedBy: userId,
      addedAt: new Date().toISOString(),
    };

    const updatedPayments = [...payRun.staffPayments];
    const staffPayment = { ...updatedPayments[staffIndex] };
    staffPayment.adjustments = [...staffPayment.adjustments, adjustment];

    // Recalculate totals for this staff
    staffPayment.totalAdjustments = staffPayment.adjustments.reduce(
      (sum, adj) => sum + adj.amount,
      0
    );
    staffPayment.grossPay =
      staffPayment.totalWages +
      staffPayment.totalCommission +
      staffPayment.totalTips +
      staffPayment.totalAdjustments;
    staffPayment.netPay = Math.max(staffPayment.grossPay, staffPayment.guaranteedMinimum);

    updatedPayments[staffIndex] = staffPayment;

    return await this.updatePayRun(
      params.payRunId,
      { staffPayments: updatedPayments },
      userId,
      deviceId
    );
  },

  /**
   * Remove an adjustment from a staff payment
   */
  async removeAdjustment(
    payRunId: string,
    staffId: string,
    adjustmentId: string,
    userId: string,
    deviceId: string
  ): Promise<PayRun> {
    const payRun = await db.payRuns.get(payRunId);
    if (!payRun) {
      throw new Error(`Pay run ${payRunId} not found`);
    }

    if (payRun.status !== 'draft') {
      throw new Error('Can only remove adjustments from draft pay runs');
    }

    const staffIndex = payRun.staffPayments.findIndex(
      (p) => p.staffId === staffId
    );
    if (staffIndex < 0) {
      throw new Error(`Staff ${staffId} not found in pay run`);
    }

    const updatedPayments = [...payRun.staffPayments];
    const staffPayment = { ...updatedPayments[staffIndex] };
    staffPayment.adjustments = staffPayment.adjustments.filter(
      (adj) => adj.id !== adjustmentId
    );

    // Recalculate totals
    staffPayment.totalAdjustments = staffPayment.adjustments.reduce(
      (sum, adj) => sum + adj.amount,
      0
    );
    staffPayment.grossPay =
      staffPayment.totalWages +
      staffPayment.totalCommission +
      staffPayment.totalTips +
      staffPayment.totalAdjustments;
    staffPayment.netPay = Math.max(staffPayment.grossPay, staffPayment.guaranteedMinimum);

    updatedPayments[staffIndex] = staffPayment;

    return await this.updatePayRun(
      payRunId,
      { staffPayments: updatedPayments },
      userId,
      deviceId
    );
  },

  // ---- Workflow Operations ----

  /**
   * Submit pay run for approval
   */
  async submitForApproval(
    payRunId: string,
    userId: string,
    deviceId: string
  ): Promise<PayRun> {
    const payRun = await db.payRuns.get(payRunId);
    if (!payRun) {
      throw new Error(`Pay run ${payRunId} not found`);
    }

    if (payRun.status !== 'draft') {
      throw new Error('Only draft pay runs can be submitted for approval');
    }

    if (payRun.staffPayments.length === 0) {
      throw new Error('Cannot submit empty pay run');
    }

    return await this.updatePayRun(
      payRunId,
      {
        status: 'pending_approval',
        submittedAt: new Date().toISOString(),
        submittedBy: userId,
      },
      userId,
      deviceId
    );
  },

  /**
   * Approve a pay run
   */
  async approvePayRun(
    payRunId: string,
    approvalNotes: string | undefined,
    userId: string,
    deviceId: string
  ): Promise<PayRun> {
    const payRun = await db.payRuns.get(payRunId);
    if (!payRun) {
      throw new Error(`Pay run ${payRunId} not found`);
    }

    if (payRun.status !== 'pending_approval') {
      throw new Error('Only pending pay runs can be approved');
    }

    return await this.updatePayRun(
      payRunId,
      {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: userId,
        approvalNotes,
      },
      userId,
      deviceId
    );
  },

  /**
   * Reject a pay run (send back to draft)
   */
  async rejectPayRun(
    payRunId: string,
    reason: string,
    userId: string,
    deviceId: string
  ): Promise<PayRun> {
    const payRun = await db.payRuns.get(payRunId);
    if (!payRun) {
      throw new Error(`Pay run ${payRunId} not found`);
    }

    if (payRun.status !== 'pending_approval') {
      throw new Error('Only pending pay runs can be rejected');
    }

    return await this.updatePayRun(
      payRunId,
      {
        status: 'draft',
        approvalNotes: `Rejected: ${reason}`,
        submittedAt: undefined,
        submittedBy: undefined,
      },
      userId,
      deviceId
    );
  },

  /**
   * Process a pay run (mark as paid)
   */
  async processPayRun(
    payRunId: string,
    processingNotes: string | undefined,
    userId: string,
    deviceId: string
  ): Promise<PayRun> {
    const payRun = await db.payRuns.get(payRunId);
    if (!payRun) {
      throw new Error(`Pay run ${payRunId} not found`);
    }

    if (payRun.status !== 'approved') {
      throw new Error('Only approved pay runs can be processed');
    }

    // Mark all staff payments as paid
    const updatedPayments = payRun.staffPayments.map((payment) => ({
      ...payment,
      isPaid: true,
      paidAt: new Date().toISOString(),
    }));

    return await this.updatePayRun(
      payRunId,
      {
        status: 'processed',
        staffPayments: updatedPayments,
        processedAt: new Date().toISOString(),
        processedBy: userId,
        processingNotes,
      },
      userId,
      deviceId
    );
  },

  /**
   * Void a pay run
   */
  async voidPayRun(
    payRunId: string,
    reason: string,
    userId: string,
    deviceId: string
  ): Promise<PayRun> {
    const payRun = await db.payRuns.get(payRunId);
    if (!payRun) {
      throw new Error(`Pay run ${payRunId} not found`);
    }

    if (payRun.status === 'voided') {
      throw new Error('Pay run is already voided');
    }

    // Note: We allow voiding processed pay runs for correction purposes
    // In a real system, this might trigger reversal transactions

    return await this.updatePayRun(
      payRunId,
      {
        status: 'voided',
        voidedAt: new Date().toISOString(),
        voidedBy: userId,
        voidReason: reason,
      },
      userId,
      deviceId
    );
  },

  /**
   * Mark a single staff payment as paid
   */
  async markStaffPaid(
    payRunId: string,
    staffId: string,
    paymentReference: string | undefined,
    userId: string,
    deviceId: string
  ): Promise<PayRun> {
    const payRun = await db.payRuns.get(payRunId);
    if (!payRun) {
      throw new Error(`Pay run ${payRunId} not found`);
    }

    if (payRun.status !== 'approved' && payRun.status !== 'processed') {
      throw new Error('Can only mark payments in approved or processed pay runs');
    }

    const staffIndex = payRun.staffPayments.findIndex(
      (p) => p.staffId === staffId
    );
    if (staffIndex < 0) {
      throw new Error(`Staff ${staffId} not found in pay run`);
    }

    const updatedPayments = [...payRun.staffPayments];
    updatedPayments[staffIndex] = {
      ...updatedPayments[staffIndex],
      isPaid: true,
      paidAt: new Date().toISOString(),
      paymentReference,
    };

    return await this.updatePayRun(
      payRunId,
      { staffPayments: updatedPayments },
      userId,
      deviceId
    );
  },

  // ---- Delete Operations ----

  /**
   * Soft delete a pay run (only draft pay runs)
   */
  async deletePayRun(
    payRunId: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    const payRun = await db.payRuns.get(payRunId);
    if (!payRun) {
      throw new Error(`Pay run ${payRunId} not found`);
    }

    if (payRun.status !== 'draft') {
      throw new Error('Only draft pay runs can be deleted');
    }

    const deleted = markEntityDeleted(
      payRun,
      userId,
      deviceId,
      SYNC_CONFIG.tombstoneRetentionMs
    );

    await db.payRuns.put(deleted);
    await queueForSync('delete', deleted, payRun.storeId);
  },
};

export default payrollDB;
