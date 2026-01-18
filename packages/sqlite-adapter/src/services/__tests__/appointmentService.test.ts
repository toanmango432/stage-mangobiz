/**
 * Unit tests for AppointmentSQLiteService
 *
 * Tests appointment CRUD operations, date range queries, status filtering,
 * and staff/client appointment lookups.
 *
 * @module sqlite-adapter/services/__tests__/appointmentService
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AppointmentSQLiteService } from '../appointmentService';
import { createMockAdapter, createMockAppointment } from './mockAdapter';

describe('AppointmentSQLiteService', () => {
  let adapter: ReturnType<typeof createMockAdapter>;
  let service: AppointmentSQLiteService;

  const testStoreId = 'store-001';
  const testStaffId = 'staff-001';
  const testClientId = 'client-001';

  // Fixed dates for testing
  const baseDate = new Date('2024-01-15T00:00:00.000Z');
  const today = baseDate.toISOString().split('T')[0]; // '2024-01-15'

  beforeEach(() => {
    adapter = createMockAdapter();
    service = new AppointmentSQLiteService(adapter);

    // Seed test data with various appointment scenarios
    adapter._seed('appointments', [
      // Today's appointments
      createMockAppointment({
        id: 'appt-1',
        storeId: testStoreId,
        clientId: testClientId,
        clientName: 'Alice Anderson',
        staffId: testStaffId,
        staffName: 'John Smith',
        status: 'scheduled',
        scheduledStartTime: '2024-01-15T09:00:00.000Z',
        scheduledEndTime: '2024-01-15T10:00:00.000Z',
        services: JSON.stringify([{ serviceId: 'svc-1', serviceName: 'Haircut', duration: 60, price: 50 }]),
      }),
      createMockAppointment({
        id: 'appt-2',
        storeId: testStoreId,
        clientId: 'client-002',
        clientName: 'Bob Brown',
        staffId: testStaffId,
        staffName: 'John Smith',
        status: 'checked-in',
        scheduledStartTime: '2024-01-15T10:30:00.000Z',
        scheduledEndTime: '2024-01-15T11:30:00.000Z',
        checkInTime: '2024-01-15T10:25:00.000Z',
      }),
      createMockAppointment({
        id: 'appt-3',
        storeId: testStoreId,
        clientId: 'client-003',
        staffId: 'staff-002',
        staffName: 'Jane Doe',
        status: 'in-service',
        scheduledStartTime: '2024-01-15T11:00:00.000Z',
        scheduledEndTime: '2024-01-15T12:30:00.000Z',
        actualStartTime: '2024-01-15T11:05:00.000Z',
      }),
      createMockAppointment({
        id: 'appt-4',
        storeId: testStoreId,
        clientId: testClientId,
        staffId: testStaffId,
        status: 'completed',
        scheduledStartTime: '2024-01-15T14:00:00.000Z',
        scheduledEndTime: '2024-01-15T15:00:00.000Z',
        actualEndTime: '2024-01-15T15:10:00.000Z',
      }),
      createMockAppointment({
        id: 'appt-5',
        storeId: testStoreId,
        clientId: 'client-004',
        staffId: testStaffId,
        status: 'cancelled',
        scheduledStartTime: '2024-01-15T16:00:00.000Z',
        scheduledEndTime: '2024-01-15T17:00:00.000Z',
      }),

      // Past appointments
      createMockAppointment({
        id: 'appt-6',
        storeId: testStoreId,
        clientId: testClientId,
        staffId: testStaffId,
        status: 'completed',
        scheduledStartTime: '2024-01-10T09:00:00.000Z',
        scheduledEndTime: '2024-01-10T10:00:00.000Z',
      }),

      // Future appointments
      createMockAppointment({
        id: 'appt-7',
        storeId: testStoreId,
        clientId: testClientId,
        staffId: testStaffId,
        status: 'scheduled',
        scheduledStartTime: '2024-01-20T14:00:00.000Z',
        scheduledEndTime: '2024-01-20T15:00:00.000Z',
      }),

      // Different store
      createMockAppointment({
        id: 'appt-8',
        storeId: 'store-002',
        clientId: 'client-other',
        staffId: 'staff-other',
        status: 'scheduled',
        scheduledStartTime: '2024-01-15T09:00:00.000Z',
        scheduledEndTime: '2024-01-15T10:00:00.000Z',
      }),
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CRUD operations', () => {
    describe('getById', () => {
      it('returns appointment when found', async () => {
        const appt = await service.getById('appt-1');
        expect(appt).toBeDefined();
        expect(appt?.id).toBe('appt-1');
        expect(appt?.clientName).toBe('Alice Anderson');
        expect(appt?.staffName).toBe('John Smith');
      });

      it('returns undefined when not found', async () => {
        const appt = await service.getById('nonexistent');
        expect(appt).toBeUndefined();
      });

      it('parses services JSON correctly', async () => {
        const appt = await service.getById('appt-1');
        expect(Array.isArray(appt?.services)).toBe(true);
        expect(appt?.services[0]).toEqual({
          serviceId: 'svc-1',
          serviceName: 'Haircut',
          duration: 60,
          price: 50,
        });
      });
    });

    describe('create', () => {
      it('creates a new appointment', async () => {
        const newAppt = await service.create({
          storeId: testStoreId,
          clientId: 'new-client',
          staffId: testStaffId,
          status: 'scheduled',
          services: [],
          scheduledStartTime: '2024-01-16T09:00:00.000Z',
          scheduledEndTime: '2024-01-16T10:00:00.000Z',
        });

        expect(newAppt.id).toBeDefined();
        expect(newAppt.storeId).toBe(testStoreId);
        expect(newAppt.status).toBe('scheduled');
        expect(newAppt.createdAt).toBeDefined();
      });
    });

    describe('update', () => {
      it('updates appointment fields', async () => {
        const updated = await service.update('appt-1', {
          status: 'checked-in',
          notes: 'Client arrived early',
        });

        expect(updated?.status).toBe('checked-in');
        expect(updated?.notes).toBe('Client arrived early');
      });

      it('returns undefined for nonexistent appointment', async () => {
        const updated = await service.update('nonexistent', {
          status: 'cancelled',
        });

        expect(updated).toBeUndefined();
      });
    });

    describe('delete', () => {
      it('deletes existing appointment', async () => {
        const deleted = await service.delete('appt-1');
        expect(deleted).toBe(true);

        const appt = await service.getById('appt-1');
        expect(appt).toBeUndefined();
      });
    });
  });

  describe('getByDateRange', () => {
    it('returns appointments within date range', async () => {
      const start = '2024-01-15T00:00:00.000Z';
      const end = '2024-01-15T23:59:59.999Z';

      const appts = await service.getByDateRange(testStoreId, start, end);

      // Should include today's appointments but not past or future
      expect(appts.length).toBeGreaterThan(0);
      appts.forEach((appt) => {
        expect(appt.scheduledStartTime >= start).toBe(true);
        expect(appt.scheduledStartTime <= end).toBe(true);
      });
    });

    it('excludes appointments outside date range', async () => {
      const start = '2024-01-15T00:00:00.000Z';
      const end = '2024-01-15T23:59:59.999Z';

      const appts = await service.getByDateRange(testStoreId, start, end);

      // Should not include appt-6 (Jan 10) or appt-7 (Jan 20)
      expect(appts.find((a) => a.id === 'appt-6')).toBeUndefined();
      expect(appts.find((a) => a.id === 'appt-7')).toBeUndefined();
    });

    it('is ordered by start time', async () => {
      const start = '2024-01-15T00:00:00.000Z';
      const end = '2024-01-15T23:59:59.999Z';

      const appts = await service.getByDateRange(testStoreId, start, end);

      for (let i = 1; i < appts.length; i++) {
        expect(appts[i].scheduledStartTime >= appts[i - 1].scheduledStartTime).toBe(true);
      }
    });

    it('only returns appointments for specified store', async () => {
      const start = '2024-01-15T00:00:00.000Z';
      const end = '2024-01-15T23:59:59.999Z';

      const appts = await service.getByDateRange(testStoreId, start, end);

      appts.forEach((appt) => {
        expect(appt.storeId).toBe(testStoreId);
      });
    });
  });

  describe('getByStaff', () => {
    it('returns all appointments for staff without date filter', async () => {
      const appts = await service.getByStaff(testStaffId);

      expect(appts.length).toBeGreaterThan(0);
      appts.forEach((appt) => {
        expect(appt.staffId).toBe(testStaffId);
      });
    });

    it('returns appointments for staff on specific date', async () => {
      const appts = await service.getByStaff(testStaffId, today);

      expect(appts.length).toBeGreaterThan(0);
      appts.forEach((appt) => {
        expect(appt.staffId).toBe(testStaffId);
        expect(appt.scheduledStartTime.startsWith('2024-01-15')).toBe(true);
      });
    });

    it('returns empty array for staff with no appointments', async () => {
      const appts = await service.getByStaff('nonexistent-staff');
      expect(appts).toHaveLength(0);
    });
  });

  describe('getByClient', () => {
    it('returns all appointments for client', async () => {
      const appts = await service.getByClient(testClientId);

      expect(appts.length).toBeGreaterThan(0);
      appts.forEach((appt) => {
        expect(appt.clientId).toBe(testClientId);
      });
    });

    it('returns appointments ordered by start time descending', async () => {
      const appts = await service.getByClient(testClientId);

      for (let i = 1; i < appts.length; i++) {
        expect(appts[i].scheduledStartTime <= appts[i - 1].scheduledStartTime).toBe(true);
      }
    });

    it('returns empty array for client with no appointments', async () => {
      const appts = await service.getByClient('nonexistent-client');
      expect(appts).toHaveLength(0);
    });
  });

  describe('getByStatus', () => {
    it('returns scheduled appointments', async () => {
      const appts = await service.getByStatus(testStoreId, 'scheduled');

      expect(appts.length).toBeGreaterThan(0);
      appts.forEach((appt) => {
        expect(appt.status).toBe('scheduled');
      });
    });

    it('returns checked-in appointments', async () => {
      const appts = await service.getByStatus(testStoreId, 'checked-in');

      expect(appts.length).toBe(1);
      expect(appts[0].id).toBe('appt-2');
    });

    it('returns in-service appointments', async () => {
      const appts = await service.getByStatus(testStoreId, 'in-service');

      expect(appts.length).toBe(1);
      expect(appts[0].id).toBe('appt-3');
    });

    it('returns completed appointments', async () => {
      const appts = await service.getByStatus(testStoreId, 'completed');

      expect(appts.length).toBe(2); // appt-4 and appt-6
      appts.forEach((appt) => {
        expect(appt.status).toBe('completed');
      });
    });

    it('returns cancelled appointments', async () => {
      const appts = await service.getByStatus(testStoreId, 'cancelled');

      expect(appts.length).toBe(1);
      expect(appts[0].id).toBe('appt-5');
    });
  });

  describe('countByStatus', () => {
    it('counts scheduled appointments', async () => {
      const count = await service.countByStatus(testStoreId, 'scheduled');
      expect(count).toBe(2); // appt-1 and appt-7
    });

    it('counts completed appointments', async () => {
      const count = await service.countByStatus(testStoreId, 'completed');
      expect(count).toBe(2); // appt-4 and appt-6
    });

    it('returns 0 for status with no appointments', async () => {
      const count = await service.countByStatus(testStoreId, 'no-show');
      expect(count).toBe(0);
    });
  });

  describe('getByStore', () => {
    it('returns all appointments for store', async () => {
      const appts = await service.getByStore(testStoreId);

      expect(appts.length).toBe(7);
      appts.forEach((appt) => {
        expect(appt.storeId).toBe(testStoreId);
      });
    });

    it('respects limit parameter', async () => {
      const appts = await service.getByStore(testStoreId, 3);
      expect(appts).toHaveLength(3);
    });

    it('respects offset parameter', async () => {
      const appts = await service.getByStore(testStoreId, 10, 2);
      expect(appts.length).toBe(5);
    });
  });

  describe('status update methods', () => {
    describe('updateStatus', () => {
      it('updates appointment status', async () => {
        const updated = await service.updateStatus('appt-1', 'checked-in');

        expect(updated?.status).toBe('checked-in');
      });

      it('returns undefined for nonexistent appointment', async () => {
        const updated = await service.updateStatus('nonexistent', 'checked-in');
        expect(updated).toBeUndefined();
      });
    });

    describe('checkIn', () => {
      it('sets status to checked-in and records time', async () => {
        const before = new Date().toISOString();
        const updated = await service.checkIn('appt-1');
        const after = new Date().toISOString();

        expect(updated?.status).toBe('checked-in');
        expect(updated?.checkInTime).toBeDefined();
        expect(updated!.checkInTime! >= before).toBe(true);
        expect(updated!.checkInTime! <= after).toBe(true);
      });
    });

    describe('startService', () => {
      it('sets status to in-service and records start time', async () => {
        const before = new Date().toISOString();
        const updated = await service.startService('appt-2');
        const after = new Date().toISOString();

        expect(updated?.status).toBe('in-service');
        expect(updated?.actualStartTime).toBeDefined();
        expect(updated!.actualStartTime! >= before).toBe(true);
        expect(updated!.actualStartTime! <= after).toBe(true);
      });
    });

    describe('complete', () => {
      it('sets status to completed and records end time', async () => {
        const before = new Date().toISOString();
        const updated = await service.complete('appt-3');
        const after = new Date().toISOString();

        expect(updated?.status).toBe('completed');
        expect(updated?.actualEndTime).toBeDefined();
        expect(updated!.actualEndTime! >= before).toBe(true);
        expect(updated!.actualEndTime! <= after).toBe(true);
      });
    });

    describe('cancel', () => {
      it('sets status to cancelled', async () => {
        const updated = await service.cancel('appt-1');

        expect(updated?.status).toBe('cancelled');
      });
    });

    describe('markNoShow', () => {
      it('sets status to no-show', async () => {
        const updated = await service.markNoShow('appt-1');

        expect(updated?.status).toBe('no-show');
      });
    });
  });

  describe('multi-store isolation', () => {
    it('getByDateRange only returns appointments for specified store', async () => {
      const start = '2024-01-15T00:00:00.000Z';
      const end = '2024-01-15T23:59:59.999Z';

      const store1Appts = await service.getByDateRange(testStoreId, start, end);
      const store2Appts = await service.getByDateRange('store-002', start, end);

      // Store 1 should have multiple appointments
      expect(store1Appts.length).toBeGreaterThan(1);
      store1Appts.forEach((appt) => {
        expect(appt.storeId).toBe(testStoreId);
      });

      // Store 2 should have exactly 1 appointment
      expect(store2Appts.length).toBe(1);
      expect(store2Appts[0].storeId).toBe('store-002');
    });

    it('getByStatus only returns appointments for specified store', async () => {
      const store1Scheduled = await service.getByStatus(testStoreId, 'scheduled');
      const store2Scheduled = await service.getByStatus('store-002', 'scheduled');

      store1Scheduled.forEach((appt) => {
        expect(appt.storeId).toBe(testStoreId);
      });

      store2Scheduled.forEach((appt) => {
        expect(appt.storeId).toBe('store-002');
      });
    });
  });
});
