/**
 * Unit Tests for Pay Run Adapter
 *
 * Tests the conversion between Supabase PayRunRow and app PayRun types.
 */

import { describe, it, expect } from 'vitest';
import {
  toPayRun,
  toPayRuns,
  toPayRunInsert,
  toPayRunUpdate,
} from '../payRunAdapter';
import type { PayRunRow } from '../../types';
import type { PayRun, StaffPayment, PayRunTotals } from '@/types/payroll';

// Mock PayRunRow factory
function createMockPayRunRow(overrides: Partial<PayRunRow> = {}): PayRunRow {
  const now = new Date().toISOString();
  return {
    id: 'pr-001',
    store_id: 'store-001',
    tenant_id: 'tenant-001',
    period_start: '2026-01-01',
    period_end: '2026-01-15',
    pay_period_type: 'bi-weekly',
    status: 'draft',
    staff_payments: [
      {
        staffId: 'staff-001',
        staffName: 'John Doe',
        regularHours: 80,
        overtimeHours: 5,
        wages: 1200,
        commission: 500,
        tips: 200,
        adjustments: 50,
        total: 1950,
        status: 'pending',
      },
    ],
    totals: {
      staffCount: 5,
      totalHours: 400,
      totalOvertimeHours: 25,
      totalWages: 6000,
      totalCommission: 2500,
      totalTips: 1000,
      totalAdjustments: 250,
      grandTotal: 9750,
      paidCount: 0,
      totalPaid: 0,
      totalPending: 9750,
    },
    submitted_at: null,
    submitted_by: null,
    approved_at: null,
    approved_by: null,
    approval_notes: null,
    processed_at: null,
    processed_by: null,
    processing_notes: null,
    voided_at: null,
    voided_by: null,
    void_reason: null,
    created_at: now,
    updated_at: now,
    sync_status: 'synced',
    sync_version: 1,
    created_by: 'user-001',
    created_by_device: 'device-001',
    last_modified_by: 'user-001',
    last_modified_by_device: 'device-001',
    ...overrides,
  };
}

// Mock PayRun factory
function createMockPayRun(overrides: Partial<PayRun> = {}): PayRun {
  const now = new Date().toISOString();
  return {
    id: 'pr-001',
    storeId: 'store-001',
    tenantId: 'tenant-001',
    periodStart: '2026-01-01',
    periodEnd: '2026-01-15',
    periodType: 'bi-weekly',
    status: 'draft',
    staffPayments: [
      {
        staffId: 'staff-001',
        staffName: 'John Doe',
        regularHours: 80,
        overtimeHours: 5,
        wages: 1200,
        commission: 500,
        tips: 200,
        adjustments: 50,
        total: 1950,
        status: 'pending',
      },
    ],
    totals: {
      staffCount: 5,
      totalHours: 400,
      totalOvertimeHours: 25,
      totalWages: 6000,
      totalCommission: 2500,
      totalTips: 1000,
      totalAdjustments: 250,
      grandTotal: 9750,
      paidCount: 0,
      totalPaid: 0,
      totalPending: 9750,
    },
    createdAt: now,
    updatedAt: now,
    syncStatus: 'synced',
    version: 1,
    vectorClock: {},
    lastSyncedVersion: 1,
    createdBy: 'user-001',
    createdByDevice: 'device-001',
    lastModifiedBy: 'user-001',
    lastModifiedByDevice: 'device-001',
    isDeleted: false,
    ...overrides,
  };
}

describe('payRunAdapter', () => {
  describe('toPayRun', () => {
    it('should convert basic PayRunRow to PayRun', () => {
      const row = createMockPayRunRow();
      const payRun = toPayRun(row);

      expect(payRun.id).toBe('pr-001');
      expect(payRun.storeId).toBe('store-001');
      expect(payRun.periodStart).toBe('2026-01-01');
      expect(payRun.periodEnd).toBe('2026-01-15');
      expect(payRun.periodType).toBe('bi-weekly');
      expect(payRun.status).toBe('draft');
    });

    it('should parse staff payments array', () => {
      const row = createMockPayRunRow();
      const payRun = toPayRun(row);

      expect(payRun.staffPayments).toHaveLength(1);
      expect(payRun.staffPayments[0].staffId).toBe('staff-001');
      expect(payRun.staffPayments[0].regularHours).toBe(80);
      expect(payRun.staffPayments[0].total).toBe(1950);
    });

    it('should parse totals correctly', () => {
      const row = createMockPayRunRow();
      const payRun = toPayRun(row);

      expect(payRun.totals.staffCount).toBe(5);
      expect(payRun.totals.totalHours).toBe(400);
      expect(payRun.totals.grandTotal).toBe(9750);
      expect(payRun.totals.totalPending).toBe(9750);
    });

    it('should convert approved pay run correctly', () => {
      const now = new Date().toISOString();
      const row = createMockPayRunRow({
        status: 'approved',
        submitted_at: now,
        submitted_by: 'submitter-001',
        approved_at: now,
        approved_by: 'approver-001',
        approval_notes: 'Looks good',
      });
      const payRun = toPayRun(row);

      expect(payRun.status).toBe('approved');
      expect(payRun.submittedAt).toBe(now);
      expect(payRun.submittedBy).toBe('submitter-001');
      expect(payRun.approvedAt).toBe(now);
      expect(payRun.approvedBy).toBe('approver-001');
      expect(payRun.approvalNotes).toBe('Looks good');
    });

    it('should convert voided pay run correctly', () => {
      const now = new Date().toISOString();
      const row = createMockPayRunRow({
        status: 'voided',
        voided_at: now,
        voided_by: 'admin-001',
        void_reason: 'Incorrect data',
      });
      const payRun = toPayRun(row);

      expect(payRun.status).toBe('voided');
      expect(payRun.voidedAt).toBe(now);
      expect(payRun.voidedBy).toBe('admin-001');
      expect(payRun.voidReason).toBe('Incorrect data');
    });

    it('should handle null optional fields gracefully', () => {
      const row = createMockPayRunRow({
        staff_payments: null,
        totals: null,
        submitted_at: null,
        approved_at: null,
      });
      const payRun = toPayRun(row);

      expect(payRun.staffPayments).toEqual([]);
      expect(payRun.totals.staffCount).toBe(0);
      expect(payRun.totals.grandTotal).toBe(0);
      expect(payRun.submittedAt).toBeUndefined();
      expect(payRun.approvedAt).toBeUndefined();
    });

    it('should preserve sync metadata', () => {
      const row = createMockPayRunRow();
      const payRun = toPayRun(row);

      expect(payRun.syncStatus).toBe('synced');
      expect(payRun.version).toBe(1);
      expect(payRun.createdBy).toBe('user-001');
    });
  });

  describe('toPayRuns', () => {
    it('should convert array of PayRunRows', () => {
      const rows = [
        createMockPayRunRow({ id: 'pr-001' }),
        createMockPayRunRow({ id: 'pr-002' }),
      ];
      const payRuns = toPayRuns(rows);

      expect(payRuns).toHaveLength(2);
      expect(payRuns[0].id).toBe('pr-001');
      expect(payRuns[1].id).toBe('pr-002');
    });

    it('should return empty array for empty input', () => {
      const payRuns = toPayRuns([]);
      expect(payRuns).toEqual([]);
    });
  });

  describe('toPayRunInsert', () => {
    it('should convert PayRun to insert format', () => {
      const payRun = createMockPayRun();
      const insert = toPayRunInsert(payRun, 'store-001');

      expect(insert.store_id).toBe('store-001');
      expect(insert.period_start).toBe('2026-01-01');
      expect(insert.period_end).toBe('2026-01-15');
      expect(insert.pay_period_type).toBe('bi-weekly');
      expect(insert.status).toBe('draft');
    });

    it('should serialize staff payments correctly', () => {
      const payRun = createMockPayRun();
      const insert = toPayRunInsert(payRun);

      expect(insert.staff_payments).toBeDefined();
      expect(Array.isArray(insert.staff_payments)).toBe(true);
    });

    it('should serialize totals correctly', () => {
      const payRun = createMockPayRun();
      const insert = toPayRunInsert(payRun);

      expect(insert.totals).toBeDefined();
      expect(typeof insert.totals).toBe('object');
    });

    it('should handle empty optional fields', () => {
      const payRun = createMockPayRun({
        submittedAt: undefined,
        submittedBy: undefined,
        approvedAt: undefined,
        approvedBy: undefined,
      });
      const insert = toPayRunInsert(payRun);

      expect(insert.submitted_at).toBeNull();
      expect(insert.submitted_by).toBeNull();
      expect(insert.approved_at).toBeNull();
      expect(insert.approved_by).toBeNull();
    });
  });

  describe('toPayRunUpdate', () => {
    it('should convert partial updates correctly', () => {
      const updates: Partial<PayRun> = {
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        submittedBy: 'user-001',
      };
      const result = toPayRunUpdate(updates);

      expect(result.status).toBe('submitted');
      expect(result.submitted_at).toBeDefined();
      expect(result.submitted_by).toBe('user-001');
    });

    it('should only include defined fields', () => {
      const updates: Partial<PayRun> = {
        status: 'approved',
        approvedBy: 'approver-001',
      };
      const result = toPayRunUpdate(updates);

      expect(result.status).toBe('approved');
      expect(result.approved_by).toBe('approver-001');
      expect(result.submitted_at).toBeUndefined();
    });

    it('should handle staff payments update', () => {
      const newPayments: StaffPayment[] = [
        {
          staffId: 'staff-002',
          staffName: 'Jane Doe',
          regularHours: 40,
          overtimeHours: 0,
          wages: 600,
          commission: 300,
          tips: 100,
          adjustments: 0,
          total: 1000,
          status: 'pending',
        },
      ];
      const updates: Partial<PayRun> = { staffPayments: newPayments };
      const result = toPayRunUpdate(updates);

      expect(result.staff_payments).toBeDefined();
    });

    it('should handle totals update', () => {
      const newTotals: PayRunTotals = {
        staffCount: 10,
        totalHours: 800,
        totalOvertimeHours: 50,
        totalWages: 12000,
        totalCommission: 5000,
        totalTips: 2000,
        totalAdjustments: 500,
        grandTotal: 19500,
        paidCount: 5,
        totalPaid: 9750,
        totalPending: 9750,
      };
      const updates: Partial<PayRun> = { totals: newTotals };
      const result = toPayRunUpdate(updates);

      expect(result.totals).toBeDefined();
    });

    it('should handle void updates', () => {
      const updates: Partial<PayRun> = {
        status: 'voided',
        voidedAt: new Date().toISOString(),
        voidedBy: 'admin-001',
        voidReason: 'Duplicate pay run',
      };
      const result = toPayRunUpdate(updates);

      expect(result.status).toBe('voided');
      expect(result.voided_at).toBeDefined();
      expect(result.voided_by).toBe('admin-001');
      expect(result.void_reason).toBe('Duplicate pay run');
    });

    it('should return empty object for no updates', () => {
      const result = toPayRunUpdate({});
      expect(result).toEqual({});
    });
  });
});
