import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import appointmentReducer, {
  fetchAppointmentByQrCode,
  confirmAppointmentArrival,
  resetAppointment,
  setAppointment,
  type AppointmentState,
} from './appointmentSlice';
import type { Appointment } from '../../types';

vi.mock('../../services/dataService', () => ({
  dataService: {
    appointments: {
      getByQrCode: vi.fn(),
      confirmArrival: vi.fn(),
    },
  },
}));

import { dataService } from '../../services/dataService';

const mockAppointment: Appointment = {
  id: 'apt-123',
  clientId: 'client-1',
  clientName: 'John Doe',
  clientPhone: '5551234567',
  services: [
    { serviceId: 's1', serviceName: 'Gel Manicure', price: 40, durationMinutes: 45 },
  ],
  technicianId: 't1',
  technicianName: 'Lisa',
  scheduledAt: '2026-01-10T14:30:00.000Z',
  status: 'scheduled',
};

describe('appointmentSlice', () => {
  let store: ReturnType<typeof configureStore<{ appointment: AppointmentState }>>;

  beforeEach(() => {
    store = configureStore({
      reducer: { appointment: appointmentReducer },
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().appointment;
      expect(state.currentAppointment).toBeNull();
      expect(state.lookupStatus).toBe('idle');
      expect(state.confirmStatus).toBe('idle');
      expect(state.error).toBeNull();
    });
  });

  describe('resetAppointment', () => {
    it('should reset state to initial values', () => {
      store.dispatch(setAppointment(mockAppointment));
      store.dispatch(resetAppointment());
      
      const state = store.getState().appointment;
      expect(state.currentAppointment).toBeNull();
      expect(state.lookupStatus).toBe('idle');
      expect(state.confirmStatus).toBe('idle');
      expect(state.error).toBeNull();
    });
  });

  describe('setAppointment', () => {
    it('should set current appointment and update status', () => {
      store.dispatch(setAppointment(mockAppointment));
      
      const state = store.getState().appointment;
      expect(state.currentAppointment).toEqual(mockAppointment);
      expect(state.lookupStatus).toBe('found');
    });
  });

  describe('fetchAppointmentByQrCode', () => {
    it('should set loading status when pending', async () => {
      vi.mocked(dataService.appointments.getByQrCode).mockImplementation(
        () => new Promise(() => {})
      );
      
      store.dispatch(fetchAppointmentByQrCode('apt-123'));
      
      const state = store.getState().appointment;
      expect(state.lookupStatus).toBe('loading');
    });

    it('should set found status and appointment when fulfilled', async () => {
      vi.mocked(dataService.appointments.getByQrCode).mockResolvedValue(mockAppointment);
      
      await store.dispatch(fetchAppointmentByQrCode('apt-123'));
      
      const state = store.getState().appointment;
      expect(state.lookupStatus).toBe('found');
      expect(state.currentAppointment).toEqual(mockAppointment);
    });

    it('should set not_found status when appointment is null', async () => {
      vi.mocked(dataService.appointments.getByQrCode).mockResolvedValue(null);
      
      await store.dispatch(fetchAppointmentByQrCode('invalid-id'));
      
      const state = store.getState().appointment;
      expect(state.lookupStatus).toBe('not_found');
      expect(state.currentAppointment).toBeNull();
    });

    it('should set error status when rejected', async () => {
      vi.mocked(dataService.appointments.getByQrCode).mockRejectedValue(
        new Error('Network error')
      );
      
      await store.dispatch(fetchAppointmentByQrCode('apt-123'));
      
      const state = store.getState().appointment;
      expect(state.lookupStatus).toBe('error');
      expect(state.error).toBe('Network error');
    });
  });

  describe('confirmAppointmentArrival', () => {
    beforeEach(() => {
      store.dispatch(setAppointment(mockAppointment));
    });

    it('should set confirming status when pending', async () => {
      vi.mocked(dataService.appointments.confirmArrival).mockImplementation(
        () => new Promise(() => {})
      );
      
      store.dispatch(confirmAppointmentArrival('apt-123'));
      
      const state = store.getState().appointment;
      expect(state.confirmStatus).toBe('confirming');
    });

    it('should set confirmed status and update appointment when fulfilled', async () => {
      vi.mocked(dataService.appointments.confirmArrival).mockResolvedValue(undefined);
      
      await store.dispatch(confirmAppointmentArrival('apt-123'));
      
      const state = store.getState().appointment;
      expect(state.confirmStatus).toBe('confirmed');
      expect(state.currentAppointment?.status).toBe('arrived');
    });

    it('should set error status when rejected', async () => {
      vi.mocked(dataService.appointments.confirmArrival).mockRejectedValue(
        new Error('Failed to confirm')
      );
      
      await store.dispatch(confirmAppointmentArrival('apt-123'));
      
      const state = store.getState().appointment;
      expect(state.confirmStatus).toBe('error');
      expect(state.error).toBe('Failed to confirm');
    });
  });
});
