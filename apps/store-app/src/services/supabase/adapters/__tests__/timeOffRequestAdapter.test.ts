/**
 * Unit Tests for Time Off Request Adapter
 *
 * Tests the conversion between Supabase TimeOffRequestRow and app TimeOffRequest types.
 */

import { describe, it, expect } from 'vitest';
import {
  toTimeOffRequest,
  toTimeOffRequests,
  toTimeOffRequestInsert,
  toTimeOffRequestUpdate,
} from '../timeOffRequestAdapter';
import type { TimeOffRequestRow } from '../../types';
import type { TimeOffRequest } from '@/types/schedule/timeOffRequest';

// Mock TimeOffRequestRow factory
function createMockTimeOffRequestRow(overrides: Partial<TimeOffRequestRow> = {}): TimeOffRequestRow {
  const now = new Date().toISOString();
  return {
    id: 'tor-001',
    store_id: 'store-001',
    staff_id: 'staff-001',
    request_type: 'vacation',
    start_date: '2026-01-15',
    end_date: '2026-01-20',
    all_day: true,
    start_time: null,
    end_time: null,
    notes: 'Family vacation to Hawaii',
    total_hours: 40,
    status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    cancelled_at: null,
    cancelled_by: null,
    cancellation_reason: null,
    has_conflicts: false,
    conflict_details: null,
    created_at: now,
    updated_at: now,
    sync_status: 'synced',
    sync_version: 1,
    created_by: 'staff-001',
    created_by_device: 'device-001',
    ...overrides,
  };
}

describe('timeOffRequestAdapter', () => {
  describe('toTimeOffRequest', () => {
    it('should convert basic TimeOffRequestRow to TimeOffRequest', () => {
      const row = createMockTimeOffRequestRow();
      const request = toTimeOffRequest(row);

      expect(request.id).toBe('tor-001');
      expect(request.storeId).toBe('store-001');
      expect(request.staffId).toBe('staff-001');
      expect(request.startDate).toBe('2026-01-15');
      expect(request.endDate).toBe('2026-01-20');
      expect(request.status).toBe('pending');
    });

    it('should convert request type info correctly', () => {
      const row = createMockTimeOffRequestRow({ request_type: 'vacation' });
      const request = toTimeOffRequest(row);

      expect(request.typeId).toBe('vacation');
      expect(request.typeName).toBe('Vacation');
      expect(request.typeEmoji).toBe('🏖️');
      expect(request.isPaid).toBe(true);
    });

    it('should handle sick leave type', () => {
      const row = createMockTimeOffRequestRow({ request_type: 'sick' });
      const request = toTimeOffRequest(row);

      expect(request.typeName).toBe('Sick Leave');
      expect(request.typeEmoji).toBe('🤒');
      expect(request.isPaid).toBe(true);
    });

    it('should handle unpaid leave type', () => {
      const row = createMockTimeOffRequestRow({ request_type: 'unpaid' });
      const request = toTimeOffRequest(row);

      expect(request.typeName).toBe('Unpaid Leave');
      expect(request.isPaid).toBe(false);
    });

    it('should calculate total days correctly', () => {
      const row = createMockTimeOffRequestRow({
        start_date: '2026-01-15',
        end_date: '2026-01-20',
      });
      const request = toTimeOffRequest(row);

      expect(request.totalDays).toBe(6);
    });

    it('should convert approved request correctly', () => {
      const now = new Date().toISOString();
      const row = createMockTimeOffRequestRow({
        status: 'approved',
        reviewed_by: 'manager-001',
        reviewed_at: now,
        review_notes: 'Enjoy your vacation!',
      });
      const request = toTimeOffRequest(row);

      expect(request.status).toBe('approved');
      expect(request.approvedBy).toBe('manager-001');
      expect(request.approvedAt).toBe(now);
      expect(request.approvalNotes).toBe('Enjoy your vacation!');
      expect(request.deniedBy).toBeNull();
    });

    it('should convert denied request correctly', () => {
      const now = new Date().toISOString();
      const row = createMockTimeOffRequestRow({
        status: 'denied',
        reviewed_by: 'manager-001',
        reviewed_at: now,
        review_notes: 'Staffing conflict',
      });
      const request = toTimeOffRequest(row);

      expect(request.status).toBe('denied');
      expect(request.deniedBy).toBe('manager-001');
      expect(request.deniedAt).toBe(now);
      expect(request.denialReason).toBe('Staffing conflict');
      expect(request.approvedBy).toBeNull();
    });

    it('should convert cancelled request correctly', () => {
      const now = new Date().toISOString();
      const row = createMockTimeOffRequestRow({
        cancelled_at: now,
        cancelled_by: 'staff-001',
        cancellation_reason: 'Plans changed',
      });
      const request = toTimeOffRequest(row);

      expect(request.cancelledAt).toBe(now);
      expect(request.cancelledBy).toBe('staff-001');
      expect(request.cancellationReason).toBe('Plans changed');
    });

    it('should handle conflicts correctly', () => {
      const row = createMockTimeOffRequestRow({
        has_conflicts: true,
        conflict_details: { appointmentIds: ['appt-001', 'appt-002'] },
      });
      const request = toTimeOffRequest(row);

      expect(request.hasConflicts).toBe(true);
      expect(request.conflictingAppointmentIds).toEqual(['appt-001', 'appt-002']);
    });

    it('should handle partial day requests', () => {
      const row = createMockTimeOffRequestRow({
        all_day: false,
        start_time: '09:00',
        end_time: '13:00',
      });
      const request = toTimeOffRequest(row);

      expect(request.isAllDay).toBe(false);
      expect(request.startTime).toBe('09:00');
      expect(request.endTime).toBe('13:00');
    });

    it('should build status history', () => {
      const row = createMockTimeOffRequestRow();
      const request = toTimeOffRequest(row);

      expect(request.statusHistory).toHaveLength(1);
      expect(request.statusHistory[0].from).toBeNull();
      expect(request.statusHistory[0].to).toBe('pending');
    });

    it('should include approval in status history', () => {
      const now = new Date().toISOString();
      const row = createMockTimeOffRequestRow({
        status: 'approved',
        reviewed_by: 'manager-001',
        reviewed_at: now,
        review_notes: 'Approved',
      });
      const request = toTimeOffRequest(row);

      expect(request.statusHistory).toHaveLength(2);
      expect(request.statusHistory[1].from).toBe('pending');
      expect(request.statusHistory[1].to).toBe('approved');
    });
  });

  describe('toTimeOffRequests', () => {
    it('should convert array of TimeOffRequestRows', () => {
      const rows = [
        createMockTimeOffRequestRow({ id: 'tor-001' }),
        createMockTimeOffRequestRow({ id: 'tor-002' }),
      ];
      const requests = toTimeOffRequests(rows);

      expect(requests).toHaveLength(2);
      expect(requests[0].id).toBe('tor-001');
      expect(requests[1].id).toBe('tor-002');
    });

    it('should return empty array for empty input', () => {
      const requests = toTimeOffRequests([]);
      expect(requests).toEqual([]);
    });
  });

  describe('toTimeOffRequestInsert', () => {
    it('should convert TimeOffRequest to insert format', () => {
      const request: Omit<TimeOffRequest, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'> = {
        storeId: 'store-001',
        tenantId: 'tenant-001',
        staffId: 'staff-001',
        staffName: 'John Doe',
        typeId: 'vacation',
        typeName: 'Vacation',
        typeEmoji: '🏖️',
        typeColor: 'bg-blue-100',
        isPaid: true,
        startDate: '2026-02-01',
        endDate: '2026-02-05',
        isAllDay: true,
        startTime: null,
        endTime: null,
        totalHours: 40,
        totalDays: 5,
        status: 'pending',
        notes: 'Family trip',
        approvedBy: null,
        approvedByName: null,
        approvedAt: null,
        approvalNotes: null,
        deniedBy: null,
        deniedByName: null,
        deniedAt: null,
        denialReason: null,
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
        hasConflicts: false,
        conflictingAppointmentIds: [],
        syncStatus: 'synced',
        version: 1,
        vectorClock: {},
        lastSyncedVersion: 1,
        createdBy: 'staff-001',
        createdByDevice: 'device-001',
        lastModifiedBy: 'staff-001',
        lastModifiedByDevice: 'device-001',
        isDeleted: false,
      };
      const insert = toTimeOffRequestInsert(request, 'store-001');

      expect(insert.store_id).toBe('store-001');
      expect(insert.staff_id).toBe('staff-001');
      expect(insert.request_type).toBe('vacation');
      expect(insert.start_date).toBe('2026-02-01');
      expect(insert.end_date).toBe('2026-02-05');
      expect(insert.all_day).toBe(true);
      expect(insert.status).toBe('pending');
    });

    it('should handle partial day with times', () => {
      const request: Omit<TimeOffRequest, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'> = {
        storeId: 'store-001',
        tenantId: 'tenant-001',
        staffId: 'staff-001',
        staffName: 'John Doe',
        typeId: 'personal',
        typeName: 'Personal',
        typeEmoji: '👤',
        typeColor: 'bg-purple-100',
        isPaid: false,
        startDate: '2026-02-10',
        endDate: '2026-02-10',
        isAllDay: false,
        startTime: '14:00',
        endTime: '17:00',
        totalHours: 3,
        totalDays: 1,
        status: 'pending',
        notes: 'Doctor appointment',
        approvedBy: null,
        approvedByName: null,
        approvedAt: null,
        approvalNotes: null,
        deniedBy: null,
        deniedByName: null,
        deniedAt: null,
        denialReason: null,
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
        hasConflicts: false,
        conflictingAppointmentIds: [],
        syncStatus: 'synced',
        version: 1,
        vectorClock: {},
        lastSyncedVersion: 1,
        createdBy: 'staff-001',
        createdByDevice: 'device-001',
        lastModifiedBy: 'staff-001',
        lastModifiedByDevice: 'device-001',
        isDeleted: false,
      };
      const insert = toTimeOffRequestInsert(request);

      expect(insert.all_day).toBe(false);
      expect(insert.start_time).toBe('14:00');
      expect(insert.end_time).toBe('17:00');
    });
  });

  describe('toTimeOffRequestUpdate', () => {
    it('should convert partial updates correctly', () => {
      const updates: Partial<TimeOffRequest> = {
        status: 'approved',
        approvedBy: 'manager-001',
        approvedAt: new Date().toISOString(),
        approvalNotes: 'Approved',
      };
      const result = toTimeOffRequestUpdate(updates);

      expect(result.status).toBe('approved');
      expect(result.reviewed_by).toBe('manager-001');
      expect(result.reviewed_at).toBeDefined();
      expect(result.review_notes).toBe('Approved');
    });

    it('should handle denial updates', () => {
      const updates: Partial<TimeOffRequest> = {
        status: 'denied',
        deniedBy: 'manager-001',
        deniedAt: new Date().toISOString(),
        denialReason: 'Insufficient staffing',
      };
      const result = toTimeOffRequestUpdate(updates);

      expect(result.status).toBe('denied');
      expect(result.reviewed_by).toBe('manager-001');
      expect(result.review_notes).toBe('Insufficient staffing');
    });

    it('should handle cancellation updates', () => {
      const updates: Partial<TimeOffRequest> = {
        cancelledAt: new Date().toISOString(),
        cancelledBy: 'staff-001',
        cancellationReason: 'Plans changed',
      };
      const result = toTimeOffRequestUpdate(updates);

      expect(result.cancelled_at).toBeDefined();
      expect(result.cancelled_by).toBe('staff-001');
      expect(result.cancellation_reason).toBe('Plans changed');
    });

    it('should handle date updates', () => {
      const updates: Partial<TimeOffRequest> = {
        startDate: '2026-02-15',
        endDate: '2026-02-18',
      };
      const result = toTimeOffRequestUpdate(updates);

      expect(result.start_date).toBe('2026-02-15');
      expect(result.end_date).toBe('2026-02-18');
    });

    it('should handle conflict updates', () => {
      const updates: Partial<TimeOffRequest> = {
        hasConflicts: true,
        conflictingAppointmentIds: ['appt-001', 'appt-002'],
      };
      const result = toTimeOffRequestUpdate(updates);

      expect(result.has_conflicts).toBe(true);
      expect(result.conflict_details).toEqual({ appointmentIds: ['appt-001', 'appt-002'] });
    });

    it('should return empty object for no updates', () => {
      const result = toTimeOffRequestUpdate({});
      expect(result).toEqual({});
    });
  });
});
