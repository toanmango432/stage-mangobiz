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
  createDefaultStaffPayment,
} from '../types/payroll';
import {
  incrementEntityVersion,
  markEntityDeleted,
} from '../types/common';
import { DEFAULT_OVERTIME_SETTINGS } from '../types/timesheet';
import {
  calculateHoursFromTimesheets,
  calculateWages,
  calculateCommissionBreakdown,
  calculateTotalCommission,
} from '../utils/payrollCalculation';
import { timesheetDB } from './timesheetOperations';
import type { CommissionSettings } from '../components/team-settings/types';

/**
 * Default commission settings for staff without custom configuration.
 * Used when staff doesn't have explicit commission settings.
 */
const DEFAULT_COMMISSION_SETTINGS: CommissionSettings = {
  type: 'percentage',
  basePercentage: 30, // Default 30% service commission
  productCommission: 10, // 10% on products
  tipHandling: 'keep_all',
};

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
   * Automatically populates staff payments from timesheets.
   */
  async createPayRun(
    params: CreatePayRunParams,
    storeId: string,
    userId: string,
    deviceId: string,
    tenantId = 'default-tenant'
  ): Promise<string> {
    const now = new Date().toISOString();
    const id = uuidv4();

    // Get staff IDs to include
    let staffIdsToProcess = params.staffIds || [];

    // If no staff IDs provided, get all staff from timesheets in the period
    if (staffIdsToProcess.length === 0) {
      const allTimesheets = await timesheetDB.getTimesheetsByDateRange(
        storeId,
        params.periodStart,
        params.periodEnd
      );
      // Get unique staff IDs from timesheets
      staffIdsToProcess = [...new Set(allTimesheets.map((t) => t.staffId))];
    }

    // Build staff payments from timesheets
    const staffPayments: StaffPayment[] = [];

    for (const staffId of staffIdsToProcess) {
      // Get timesheets for this staff member in the period
      const staffTimesheets = await timesheetDB.getTimesheetsByDateRange(
        storeId,
        params.periodStart,
        params.periodEnd
      );
      const filteredTimesheets = staffTimesheets.filter((t) => t.staffId === staffId);

      // Get staff info from database
      const staff = await db.staff.get(staffId);
      const staffName = staff?.name || 'Unknown Staff';
      const staffRole = staff?.role || 'stylist';

      // Get hourly rate from commissionRate (if defined) or default
      // Note: In production, this should come from staff settings/payroll profile
      const hourlyRate = staff?.commissionRate ? staff.commissionRate * 50 : 15; // Basic estimate

      // Calculate hours from timesheets
      const hours = calculateHoursFromTimesheets(
        filteredTimesheets,
        DEFAULT_OVERTIME_SETTINGS
      );

      // Map PayPeriodType to PayPeriod for calculateWages
      const payPeriodMap: Record<string, 'weekly' | 'bi-weekly' | 'monthly' | 'per-service'> = {
        'weekly': 'weekly',
        'bi-weekly': 'bi-weekly',
        'semi-monthly': 'bi-weekly', // Map semi-monthly to bi-weekly
        'monthly': 'monthly',
      };

      // Calculate wages
      const wagesResult = calculateWages(hours, {
        payPeriod: payPeriodMap[params.periodType] || 'bi-weekly',
        hourlyRate,
        overtimeRate: 1.5,
      });

      // Create staff payment
      const staffPayment = createDefaultStaffPayment(
        staffId,
        staffName,
        staffRole
      );

      // Populate hours breakdown
      staffPayment.hours = hours;
      staffPayment.hourlyRate = hourlyRate;

      // Populate wages breakdown
      staffPayment.baseWages = wagesResult.baseWages;
      staffPayment.overtimePay = wagesResult.overtimePay;
      staffPayment.doubleTimePay = wagesResult.doubleTimePay;
      staffPayment.totalWages = wagesResult.totalWages;

      // ========================================
      // US-009: Calculate commission and tips from transactions
      // ========================================

      // Get all tickets for the period to calculate service revenue
      const periodStartDate = new Date(params.periodStart);
      const periodEndDate = new Date(params.periodEnd);
      periodEndDate.setHours(23, 59, 59, 999); // Include entire end day

      // Get tickets for the store in the period
      const allTickets = await db.tickets
        .where('storeId')
        .equals(storeId)
        .toArray();

      // Filter tickets by period and status (paid tickets only)
      const paidTickets = allTickets.filter((ticket) => {
        if (ticket.status !== 'paid') return false;
        const ticketDate = ticket.completedAt
          ? new Date(ticket.completedAt)
          : new Date(ticket.createdAt);
        return ticketDate >= periodStartDate && ticketDate <= periodEndDate;
      });

      // Calculate service revenue for this staff member
      let serviceRevenue = 0;
      const productRevenue = 0;
      let tipsReceived = 0;
      let newClientCount = 0;

      for (const ticket of paidTickets) {
        // Sum service revenue for services performed by this staff
        for (const service of ticket.services || []) {
          if (String(service.staffId) === String(staffId)) {
            serviceRevenue += service.price || 0;
          }
        }

        // Check if tips have allocations
        if (ticket.payments && ticket.payments.length > 0) {
          for (const payment of ticket.payments) {
            if (payment.tipAllocations && payment.tipAllocations.length > 0) {
              // Use explicit tip allocations
              for (const tipAlloc of payment.tipAllocations) {
                if (String(tipAlloc.staffId) === String(staffId)) {
                  tipsReceived += tipAlloc.amount || 0;
                }
              }
            } else {
              // No explicit allocations - check if this staff did services on this ticket
              const staffServicesOnTicket = (ticket.services || []).filter(
                (s) => String(s.staffId) === String(staffId)
              );
              if (staffServicesOnTicket.length > 0) {
                // Proportional tip split based on service revenue
                const totalServiceRevenue = (ticket.services || []).reduce(
                  (sum, s) => sum + (s.price || 0),
                  0
                );
                const staffServiceRevenue = staffServicesOnTicket.reduce(
                  (sum, s) => sum + (s.price || 0),
                  0
                );
                if (totalServiceRevenue > 0) {
                  const tipPortion =
                    (payment.tip || 0) * (staffServiceRevenue / totalServiceRevenue);
                  tipsReceived += tipPortion;
                }
              }
            }
          }
        }

        // Count new clients (first visit - simplified check)
        // Note: In production, this should check client.visitSummary.totalVisits
        const staffDidServiceOnTicket = (ticket.services || []).some(
          (s) => String(s.staffId) === String(staffId)
        );
        if (staffDidServiceOnTicket && !ticket.clientId) {
          // Walk-in without client ID could be new
          newClientCount += 1;
        }
      }

      // Get commission settings from team member if available
      const teamMember = await db.teamMembers.get(staffId);
      const commissionSettings: CommissionSettings =
        teamMember?.commission || DEFAULT_COMMISSION_SETTINGS;

      // Calculate commission breakdown
      const commissionData = {
        serviceRevenue,
        productRevenue,
        retailRevenue: 0, // Not tracked separately in current schema
        newClientCount,
        rebookCount: 0, // Not tracked in current implementation
        tipsReceived,
      };

      const commissionBreakdown = calculateCommissionBreakdown(
        commissionData,
        commissionSettings
      );
      const totalCommission = calculateTotalCommission(commissionBreakdown);

      // Populate commission and tips in staff payment
      staffPayment.commission = commissionBreakdown;
      staffPayment.totalCommission = totalCommission;
      staffPayment.totalTips = commissionBreakdown.tipsKept;

      // Calculate gross pay (wages + commission + tips)
      staffPayment.grossPay =
        wagesResult.totalWages + totalCommission + commissionBreakdown.tipsKept;

      // Apply guaranteed minimum
      const guaranteedMinimum = teamMember?.payroll?.guaranteedMinimum || 0;
      staffPayment.guaranteedMinimum = guaranteedMinimum;
      staffPayment.netPay = Math.max(staffPayment.grossPay, guaranteedMinimum);

      staffPayments.push(staffPayment);
    }

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
      staffPayments,
      totals: calculatePayRunTotals(staffPayments),
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
