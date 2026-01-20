/**
 * Unit Tests for Timesheet Adapter
 *
 * Tests the conversion between Supabase TimesheetRow and app TimesheetEntry types.
 */

import { describe, it, expect } from 'vitest';
import {
  toTimesheet,
  toTimesheets,
  toTimesheetInsert,
  toTimesheetUpdate,
} from '../timesheetAdapter';
import type { TimesheetRow } from '../../types';
import type { TimesheetEntry, BreakEntry, HoursBreakdown } from '@/types/timesheet';

// Mock TimesheetRow factory
function createMockTimesheetRow(overrides: Partial<TimesheetRow> = {}): TimesheetRow {
  const now = new Date().toISOString();
  return {
    id: 'ts-001',
    store_id: 'store-001',
    staff_id: 'staff-001',
    date: '2026-01-06',
    scheduled_start: '09:00',
    scheduled_end: '17:00',
    scheduled_break_minutes: 30,
    actual_clock_in: '09:05',
    actual_clock_out: '17:10',
    breaks: [
      { id: 'break-001', startTime: '12:00', endTime: '12:30', type: 'unpaid', duration: 30 },
    ],
    hours: {
      scheduledHours: 8,
      actualHours: 8.08,
      regularHours: 8,
      overtimeHours: 0.08,
      doubleTimeHours: 0,
      breakMinutes: 30,
      paidBreakMinutes: 0,
      unpaidBreakMinutes: 30,
    },
    is_late_arrival: false,
    is_early_departure: false,
    is_no_show: false,
    late_minutes: 0,
    early_departure_minutes: 0,
    status: 'approved',
    approved_by: 'manager-001',
    approved_at: now,
    dispute_reason: null,
    dispute_notes: null,
    notes: 'Regular shift',
    manager_notes: null,
    clock_in_location: { lat: 37.7749, lng: -122.4194 },
    clock_out_location: { lat: 37.7750, lng: -122.4195 },
    clock_in_photo_url: null,
    clock_out_photo_url: null,
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

// Mock TimesheetEntry factory
function createMockTimesheetEntry(overrides: Partial<TimesheetEntry> = {}): TimesheetEntry {
  const now = new Date().toISOString();
  return {
    id: 'ts-001',
    storeId: 'store-001',
    tenantId: 'tenant-001',
    staffId: 'staff-001',
    date: '2026-01-06',
    scheduledStart: '09:00',
    scheduledEnd: '17:00',
    actualClockIn: '09:05',
    actualClockOut: '17:10',
    breaks: [
      { id: 'break-001', startTime: '12:00', endTime: '12:30', type: 'unpaid', duration: 30 },
    ],
    hours: {
      scheduledHours: 8,
      actualHours: 8.08,
      regularHours: 8,
      overtimeHours: 0.08,
      doubleTimeHours: 0,
      breakMinutes: 30,
      paidBreakMinutes: 0,
      unpaidBreakMinutes: 30,
    },
    status: 'pending',
    approvedBy: undefined,
    approvedAt: undefined,
    disputeReason: undefined,
    notes: 'Regular shift',
    clockInLocation: { lat: 37.7749, lng: -122.4194 },
    clockOutLocation: { lat: 37.7750, lng: -122.4195 },
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

describe('timesheetAdapter', () => {
  describe('toTimesheet', () => {
    it('should convert basic TimesheetRow to TimesheetEntry', () => {
      const row = createMockTimesheetRow();
      const entry = toTimesheet(row);

      expect(entry.id).toBe('ts-001');
      expect(entry.storeId).toBe('store-001');
      expect(entry.staffId).toBe('staff-001');
      expect(entry.date).toBe('2026-01-06');
      expect(entry.scheduledStart).toBe('09:00');
      expect(entry.scheduledEnd).toBe('17:00');
    });

    it('should convert clock times correctly', () => {
      const row = createMockTimesheetRow();
      const entry = toTimesheet(row);

      expect(entry.actualClockIn).toBe('09:05');
      expect(entry.actualClockOut).toBe('17:10');
    });

    it('should parse breaks array', () => {
      const row = createMockTimesheetRow();
      const entry = toTimesheet(row);

      expect(entry.breaks).toHaveLength(1);
      expect(entry.breaks[0].id).toBe('break-001');
      expect(entry.breaks[0].startTime).toBe('12:00');
      expect(entry.breaks[0].endTime).toBe('12:30');
      expect(entry.breaks[0].type).toBe('unpaid');
      expect(entry.breaks[0].duration).toBe(30);
    });

    it('should parse hours breakdown', () => {
      const row = createMockTimesheetRow();
      const entry = toTimesheet(row);

      expect(entry.hours.scheduledHours).toBe(8);
      expect(entry.hours.actualHours).toBe(8.08);
      expect(entry.hours.regularHours).toBe(8);
      expect(entry.hours.overtimeHours).toBe(0.08);
      expect(entry.hours.breakMinutes).toBe(30);
    });

    it('should convert status correctly', () => {
      const row = createMockTimesheetRow({ status: 'disputed' });
      const entry = toTimesheet(row);

      expect(entry.status).toBe('disputed');
    });

    it('should parse location data', () => {
      const row = createMockTimesheetRow();
      const entry = toTimesheet(row);

      expect(entry.clockInLocation).toEqual({ lat: 37.7749, lng: -122.4194 });
      expect(entry.clockOutLocation).toEqual({ lat: 37.7750, lng: -122.4195 });
    });

    it('should handle null optional fields gracefully', () => {
      const row = createMockTimesheetRow({
        scheduled_start: null,
        scheduled_end: null,
        actual_clock_in: null,
        actual_clock_out: null,
        approved_by: null,
        approved_at: null,
        dispute_reason: null,
        notes: null,
        clock_in_location: null,
        clock_out_location: null,
        breaks: null,
        hours: null,
      });
      const entry = toTimesheet(row);

      expect(entry.scheduledStart).toBe('');
      expect(entry.scheduledEnd).toBe('');
      expect(entry.actualClockIn).toBeNull();
      expect(entry.actualClockOut).toBeNull();
      expect(entry.approvedBy).toBeUndefined();
      expect(entry.approvedAt).toBeUndefined();
      expect(entry.clockInLocation).toBeUndefined();
      expect(entry.clockOutLocation).toBeUndefined();
      expect(entry.breaks).toEqual([]);
    });

    it('should preserve sync metadata', () => {
      const row = createMockTimesheetRow();
      const entry = toTimesheet(row);

      expect(entry.syncStatus).toBe('synced');
      expect(entry.version).toBe(1);
      expect(entry.createdBy).toBe('user-001');
      expect(entry.createdByDevice).toBe('device-001');
    });
  });

  describe('toTimesheets', () => {
    it('should convert array of TimesheetRows', () => {
      const rows = [
        createMockTimesheetRow({ id: 'ts-001' }),
        createMockTimesheetRow({ id: 'ts-002' }),
      ];
      const entries = toTimesheets(rows);

      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe('ts-001');
      expect(entries[1].id).toBe('ts-002');
    });

    it('should return empty array for empty input', () => {
      const entries = toTimesheets([]);
      expect(entries).toEqual([]);
    });
  });

  describe('toTimesheetInsert', () => {
    it('should convert TimesheetEntry to insert format', () => {
      const entry = createMockTimesheetEntry();
      const insert = toTimesheetInsert(entry, 'store-001');

      expect(insert.store_id).toBe('store-001');
      expect(insert.staff_id).toBe('staff-001');
      expect(insert.date).toBe('2026-01-06');
      expect(insert.scheduled_start).toBe('09:00');
      expect(insert.scheduled_end).toBe('17:00');
      expect(insert.actual_clock_in).toBe('09:05');
      expect(insert.actual_clock_out).toBe('17:10');
    });

    it('should serialize breaks correctly', () => {
      const entry = createMockTimesheetEntry();
      const insert = toTimesheetInsert(entry);

      expect(insert.breaks).toEqual([
        { id: 'break-001', startTime: '12:00', endTime: '12:30', type: 'unpaid', duration: 30 },
      ]);
    });

    it('should serialize hours correctly', () => {
      const entry = createMockTimesheetEntry();
      const insert = toTimesheetInsert(entry);

      expect(insert.hours).toMatchObject({
        scheduledHours: 8,
        actualHours: 8.08,
        regularHours: 8,
        overtimeHours: 0.08,
      });
    });

    it('should serialize location correctly', () => {
      const entry = createMockTimesheetEntry();
      const insert = toTimesheetInsert(entry);

      expect(insert.clock_in_location).toEqual({ lat: 37.7749, lng: -122.4194 });
      expect(insert.clock_out_location).toEqual({ lat: 37.7750, lng: -122.4195 });
    });

    it('should handle empty optional fields', () => {
      const entry = createMockTimesheetEntry({
        scheduledStart: '',
        scheduledEnd: '',
        actualClockIn: null,
        actualClockOut: null,
        clockInLocation: undefined,
        clockOutLocation: undefined,
      });
      const insert = toTimesheetInsert(entry);

      expect(insert.scheduled_start).toBeNull();
      expect(insert.scheduled_end).toBeNull();
      expect(insert.actual_clock_in).toBeNull();
      expect(insert.actual_clock_out).toBeNull();
      expect(insert.clock_in_location).toBeNull();
      expect(insert.clock_out_location).toBeNull();
    });
  });

  describe('toTimesheetUpdate', () => {
    it('should convert partial updates correctly', () => {
      const updates: Partial<TimesheetEntry> = {
        actualClockIn: '09:15',
        actualClockOut: '17:30',
        status: 'approved',
      };
      const result = toTimesheetUpdate(updates);

      expect(result.actual_clock_in).toBe('09:15');
      expect(result.actual_clock_out).toBe('17:30');
      expect(result.status).toBe('approved');
    });

    it('should only include defined fields', () => {
      const updates: Partial<TimesheetEntry> = {
        status: 'disputed',
        disputeReason: 'Incorrect hours logged',
      };
      const result = toTimesheetUpdate(updates);

      expect(result.status).toBe('disputed');
      expect(result.dispute_reason).toBe('Incorrect hours logged');
      expect(result.actual_clock_in).toBeUndefined();
      expect(result.actual_clock_out).toBeUndefined();
    });

    it('should handle breaks update', () => {
      const newBreaks: BreakEntry[] = [
        { id: 'break-002', startTime: '13:00', endTime: '13:30', type: 'paid', duration: 30 },
      ];
      const updates: Partial<TimesheetEntry> = { breaks: newBreaks };
      const result = toTimesheetUpdate(updates);

      expect(result.breaks).toEqual([
        { id: 'break-002', startTime: '13:00', endTime: '13:30', type: 'paid', duration: 30 },
      ]);
    });

    it('should handle hours update', () => {
      const newHours: HoursBreakdown = {
        scheduledHours: 9,
        actualHours: 9.5,
        regularHours: 8,
        overtimeHours: 1.5,
        doubleTimeHours: 0,
        breakMinutes: 60,
        paidBreakMinutes: 30,
        unpaidBreakMinutes: 30,
      };
      const updates: Partial<TimesheetEntry> = { hours: newHours };
      const result = toTimesheetUpdate(updates);

      expect(result.hours).toMatchObject({
        scheduledHours: 9,
        actualHours: 9.5,
        overtimeHours: 1.5,
      });
    });

    it('should handle location updates', () => {
      const updates: Partial<TimesheetEntry> = {
        clockInLocation: { lat: 40.7128, lng: -74.0060 },
      };
      const result = toTimesheetUpdate(updates);

      expect(result.clock_in_location).toEqual({ lat: 40.7128, lng: -74.0060 });
    });

    it('should return empty object for no updates', () => {
      const result = toTimesheetUpdate({});
      expect(result).toEqual({});
    });
  });
});
