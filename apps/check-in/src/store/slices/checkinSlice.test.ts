import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import checkinReducer, {
  createCheckIn,
  setCurrentClient,
  addSelectedService,
  setTechnicianPreference,
  addGuest,
  setPartyPreference,
  resetCheckin,
} from './checkinSlice';
import authReducer, { setStore, setDeviceId } from './authSlice';
import uiReducer from './uiSlice';
import syncReducer from './syncSlice';
import servicesReducer from './servicesSlice';
import technicianReducer from './technicianSlice';
import clientReducer from './clientSlice';
import type { Client, CheckIn } from '../../types';

vi.mock('../../services/dataService', () => ({
  dataService: {
    checkins: {
      create: vi.fn(),
    },
  },
}));

import { dataService } from '../../services/dataService';

function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      checkin: checkinReducer,
      client: clientReducer,
      sync: syncReducer,
      services: servicesReducer,
      technicians: technicianReducer,
    },
  });
}

const mockClient: Client = {
  id: 'client-123',
  firstName: 'John',
  lastName: 'Doe',
  phone: '5551234567',
  email: 'john@example.com',
  smsOptIn: true,
  loyaltyPoints: 100,
  loyaltyPointsToNextReward: 50,
  createdAt: '2024-01-01T00:00:00Z',
  visitCount: 5,
};

const mockCheckIn: CheckIn = {
  id: 'checkin-123',
  checkInNumber: 'A042',
  storeId: 'store-123',
  clientId: 'client-123',
  clientName: 'John Doe',
  clientPhone: '5551234567',
  services: [
    { serviceId: 's1', serviceName: 'Classic Manicure', price: 25, durationMinutes: 30 },
  ],
  technicianPreference: 'anyone',
  guests: [],
  status: 'waiting',
  queuePosition: 3,
  estimatedWaitMinutes: 24,
  checkedInAt: '2024-01-15T10:30:00Z',
  source: 'kiosk',
  deviceId: 'device-123',
  syncStatus: 'synced',
};

describe('checkinSlice - createCheckIn thunk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create check-in successfully', async () => {
    vi.mocked(dataService.checkins.create).mockResolvedValue(mockCheckIn);

    const store = createTestStore();

    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));
    store.dispatch(setDeviceId('device-123'));
    store.dispatch(setCurrentClient(mockClient));
    store.dispatch(addSelectedService({
      serviceId: 's1',
      serviceName: 'Classic Manicure',
      price: 25,
      durationMinutes: 30,
    }));

    const result = await store.dispatch(
      createCheckIn({ storeId: 'store-123', deviceId: 'device-123' }) as never
    );

    expect(createCheckIn.fulfilled.match(result)).toBe(true);

    const state = store.getState().checkin;
    expect(state.checkInStatus).toBe('success');
    expect(state.lastCheckIn).toEqual(mockCheckIn);
    expect(state.completedCheckInId).toBe('checkin-123');
    expect(state.checkInNumber).toBe('A042');
    expect(state.queuePosition).toBe(3);
    expect(state.estimatedWaitMinutes).toBe(24);
  });

  it('should reject when no client is selected', async () => {
    const store = createTestStore();

    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));
    store.dispatch(setDeviceId('device-123'));
    store.dispatch(addSelectedService({
      serviceId: 's1',
      serviceName: 'Classic Manicure',
      price: 25,
      durationMinutes: 30,
    }));

    const result = await store.dispatch(
      createCheckIn({ storeId: 'store-123', deviceId: 'device-123' }) as never
    );

    expect(createCheckIn.rejected.match(result)).toBe(true);

    const state = store.getState().checkin;
    expect(state.checkInStatus).toBe('error');
    expect(state.checkInError).toBe('No client selected');
  });

  it('should reject when no services are selected', async () => {
    const store = createTestStore();

    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));
    store.dispatch(setDeviceId('device-123'));
    store.dispatch(setCurrentClient(mockClient));

    const result = await store.dispatch(
      createCheckIn({ storeId: 'store-123', deviceId: 'device-123' }) as never
    );

    expect(createCheckIn.rejected.match(result)).toBe(true);

    const state = store.getState().checkin;
    expect(state.checkInStatus).toBe('error');
    expect(state.checkInError).toBe('No services selected');
  });

  it('should handle dataService error', async () => {
    vi.mocked(dataService.checkins.create).mockRejectedValue(new Error('Network error'));

    const store = createTestStore();

    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));
    store.dispatch(setDeviceId('device-123'));
    store.dispatch(setCurrentClient(mockClient));
    store.dispatch(addSelectedService({
      serviceId: 's1',
      serviceName: 'Classic Manicure',
      price: 25,
      durationMinutes: 30,
    }));

    const result = await store.dispatch(
      createCheckIn({ storeId: 'store-123', deviceId: 'device-123' }) as never
    );

    expect(createCheckIn.rejected.match(result)).toBe(true);

    const state = store.getState().checkin;
    expect(state.checkInStatus).toBe('error');
    expect(state.checkInError).toBe('Network error');
  });

  it('should set pending status while creating', async () => {
    let resolvePromise: (value: CheckIn) => void;
    const promise = new Promise<CheckIn>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(dataService.checkins.create).mockReturnValue(promise);

    const store = createTestStore();

    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));
    store.dispatch(setDeviceId('device-123'));
    store.dispatch(setCurrentClient(mockClient));
    store.dispatch(addSelectedService({
      serviceId: 's1',
      serviceName: 'Classic Manicure',
      price: 25,
      durationMinutes: 30,
    }));

    const dispatchPromise = store.dispatch(
      createCheckIn({ storeId: 'store-123', deviceId: 'device-123' }) as never
    );

    expect(store.getState().checkin.checkInStatus).toBe('submitting');

    resolvePromise!(mockCheckIn);
    await dispatchPromise;

    expect(store.getState().checkin.checkInStatus).toBe('success');
  });

  it('should pass guests and party preference to dataService', async () => {
    vi.mocked(dataService.checkins.create).mockResolvedValue(mockCheckIn);

    const store = createTestStore();

    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));
    store.dispatch(setDeviceId('device-123'));
    store.dispatch(setCurrentClient(mockClient));
    store.dispatch(addSelectedService({
      serviceId: 's1',
      serviceName: 'Classic Manicure',
      price: 25,
      durationMinutes: 30,
    }));
    store.dispatch(setTechnicianPreference('tech-456'));
    store.dispatch(addGuest({
      id: 'guest-1',
      name: 'Jane Doe',
      services: [{ serviceId: 's2', serviceName: 'Gel Manicure', price: 40, durationMinutes: 45 }],
      technicianPreference: 'anyone',
    }));
    store.dispatch(setPartyPreference('sequence'));

    await store.dispatch(
      createCheckIn({ storeId: 'store-123', deviceId: 'device-123' }) as never
    );

    expect(dataService.checkins.create).toHaveBeenCalledWith({
      storeId: 'store-123',
      clientId: 'client-123',
      clientName: 'John Doe',
      clientPhone: '5551234567',
      services: [{ serviceId: 's1', serviceName: 'Classic Manicure', price: 25, durationMinutes: 30 }],
      technicianPreference: 'tech-456',
      guests: [
        {
          id: 'guest-1',
          name: 'Jane Doe',
          services: [{ serviceId: 's2', serviceName: 'Gel Manicure', price: 40, durationMinutes: 45 }],
          technicianPreference: 'anyone',
        },
      ],
      partyPreference: 'sequence',
      deviceId: 'device-123',
    });
  });

  it('should reset checkin state', () => {
    const store = createTestStore();

    store.dispatch(setCurrentClient(mockClient));
    store.dispatch(addSelectedService({
      serviceId: 's1',
      serviceName: 'Classic Manicure',
      price: 25,
      durationMinutes: 30,
    }));

    expect(store.getState().checkin.currentClient).toEqual(mockClient);

    store.dispatch(resetCheckin());

    const state = store.getState().checkin;
    expect(state.currentClient).toBeNull();
    expect(state.selectedServices).toEqual([]);
    expect(state.checkInStatus).toBe('idle');
  });
});
