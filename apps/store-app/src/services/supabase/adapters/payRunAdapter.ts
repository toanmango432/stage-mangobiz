/**
 * Pay Run Type Adapter
 *
 * Converts between Supabase PayRunRow and app PayRun types.
 */

import type { PayRunRow, PayRunInsert, PayRunUpdate, Json } from '../types';
import type {
  PayRun,
  PayRunStatus,
  PayPeriodType,
  StaffPayment,
  PayRunTotals,
  createEmptyTotals,
} from '@/types/payroll';
import type { SyncStatus } from '@/types/common';

/**
 * Convert Supabase PayRunRow to app PayRun type
 */
export function toPayRun(row: PayRunRow): PayRun {
  return {
    id: row.id,
    storeId: row.store_id,
    tenantId: row.tenant_id || '',
    periodStart: row.period_start,
    periodEnd: row.period_end,
    periodType: row.pay_period_type as PayPeriodType,
    status: row.status as PayRunStatus,
    staffPayments: parseStaffPayments(row.staff_payments),
    totals: parseTotals(row.totals),
    submittedAt: row.submitted_at || undefined,
    submittedBy: row.submitted_by || undefined,
    approvedAt: row.approved_at || undefined,
    approvedBy: row.approved_by || undefined,
    approvalNotes: row.approval_notes || undefined,
    processedAt: row.processed_at || undefined,
    processedBy: row.processed_by || undefined,
    processingNotes: row.processing_notes || undefined,
    voidedAt: row.voided_at || undefined,
    voidedBy: row.voided_by || undefined,
    voidReason: row.void_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status as SyncStatus,
    // BaseSyncableEntity fields with defaults
    version: row.sync_version || 1,
    vectorClock: {},
    lastSyncedVersion: row.sync_version || 1,
    createdBy: row.created_by || '',
    createdByDevice: row.created_by_device || '',
    lastModifiedBy: row.last_modified_by || '',
    lastModifiedByDevice: row.last_modified_by_device || '',
    isDeleted: false,
  };
}

/**
 * Convert app PayRun to Supabase PayRunInsert
 */
export function toPayRunInsert(
  payRun: Omit<PayRun, 'id' | 'createdAt' | 'updatedAt'>,
  storeId?: string
): Omit<PayRunInsert, 'store_id'> & { store_id?: string } {
  return {
    store_id: storeId || payRun.storeId,
    period_start: payRun.periodStart,
    period_end: payRun.periodEnd,
    pay_period_type: payRun.periodType,
    status: payRun.status,
    staff_payments: payRun.staffPayments as unknown as Json,
    totals: payRun.totals as unknown as Json,
    submitted_at: payRun.submittedAt || null,
    submitted_by: payRun.submittedBy || null,
    approved_at: payRun.approvedAt || null,
    approved_by: payRun.approvedBy || null,
    approval_notes: payRun.approvalNotes || null,
    processed_at: payRun.processedAt || null,
    processed_by: payRun.processedBy || null,
    processing_notes: payRun.processingNotes || null,
    voided_at: payRun.voidedAt || null,
    voided_by: payRun.voidedBy || null,
    void_reason: payRun.voidReason || null,
    sync_status: payRun.syncStatus || 'synced',
    sync_version: 1,
  };
}

/**
 * Convert partial PayRun updates to Supabase PayRunUpdate
 */
export function toPayRunUpdate(updates: Partial<PayRun>): PayRunUpdate {
  const result: PayRunUpdate = {};

  if (updates.periodStart !== undefined) {
    result.period_start = updates.periodStart;
  }
  if (updates.periodEnd !== undefined) {
    result.period_end = updates.periodEnd;
  }
  if (updates.periodType !== undefined) {
    result.pay_period_type = updates.periodType;
  }
  if (updates.status !== undefined) {
    result.status = updates.status;
  }
  if (updates.staffPayments !== undefined) {
    result.staff_payments = updates.staffPayments as unknown as Json;
  }
  if (updates.totals !== undefined) {
    result.totals = updates.totals as unknown as Json;
  }
  if (updates.submittedAt !== undefined) {
    result.submitted_at = updates.submittedAt || null;
  }
  if (updates.submittedBy !== undefined) {
    result.submitted_by = updates.submittedBy || null;
  }
  if (updates.approvedAt !== undefined) {
    result.approved_at = updates.approvedAt || null;
  }
  if (updates.approvedBy !== undefined) {
    result.approved_by = updates.approvedBy || null;
  }
  if (updates.approvalNotes !== undefined) {
    result.approval_notes = updates.approvalNotes || null;
  }
  if (updates.processedAt !== undefined) {
    result.processed_at = updates.processedAt || null;
  }
  if (updates.processedBy !== undefined) {
    result.processed_by = updates.processedBy || null;
  }
  if (updates.processingNotes !== undefined) {
    result.processing_notes = updates.processingNotes || null;
  }
  if (updates.voidedAt !== undefined) {
    result.voided_at = updates.voidedAt || null;
  }
  if (updates.voidedBy !== undefined) {
    result.voided_by = updates.voidedBy || null;
  }
  if (updates.voidReason !== undefined) {
    result.void_reason = updates.voidReason || null;
  }
  if (updates.syncStatus !== undefined) {
    result.sync_status = updates.syncStatus;
  }

  return result;
}

/**
 * Convert array of PayRunRows to PayRun
 */
export function toPayRuns(rows: PayRunRow[]): PayRun[] {
  return rows.map(toPayRun);
}

// ==================== PARSE HELPERS ====================

function parseStaffPayments(json: Json): StaffPayment[] {
  if (!json || !Array.isArray(json)) return [];
  // StaffPayment structure is already deeply typed, just cast
  return json as unknown as StaffPayment[];
}

function parseTotals(json: Json): PayRunTotals {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return createDefaultTotals();
  }

  const totals = json as Record<string, unknown>;
  return {
    staffCount: Number(totals.staffCount || totals.staff_count || 0),
    totalHours: Number(totals.totalHours || totals.total_hours || 0),
    totalOvertimeHours: Number(totals.totalOvertimeHours || totals.total_overtime_hours || 0),
    totalWages: Number(totals.totalWages || totals.total_wages || 0),
    totalCommission: Number(totals.totalCommission || totals.total_commission || 0),
    totalTips: Number(totals.totalTips || totals.total_tips || 0),
    totalAdjustments: Number(totals.totalAdjustments || totals.total_adjustments || 0),
    grandTotal: Number(totals.grandTotal || totals.grand_total || 0),
    paidCount: Number(totals.paidCount || totals.paid_count || 0),
    totalPaid: Number(totals.totalPaid || totals.total_paid || 0),
    totalPending: Number(totals.totalPending || totals.total_pending || 0),
  };
}

function createDefaultTotals(): PayRunTotals {
  return {
    staffCount: 0,
    totalHours: 0,
    totalOvertimeHours: 0,
    totalWages: 0,
    totalCommission: 0,
    totalTips: 0,
    totalAdjustments: 0,
    grandTotal: 0,
    paidCount: 0,
    totalPaid: 0,
    totalPending: 0,
  };
}
