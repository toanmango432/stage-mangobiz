import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import checkinReducer, {
  createCheckIn,
  setCurrentClient,
  setNewClient,
  addSelectedService,
  removeSelectedService,
  clearSelectedServices,
  setTechnicianPreference,
  setTechnicians,
  addGuest,
  removeGuest,
  updateGuest,
  setPartyPreference,
  setPhoneNumber,
  setLookupStatus,
  setServices,
  setServiceCategories,
  setQueueStatus,
  setCheckInNumber,
  setQueuePosition,
  setEstimatedWaitMinutes,
  setCompletedCheckInId,
  setClientCalled,
  clearCalledStatus,
  resetCheckin,
} from './checkinSlice';
import authReducer, { setStore, setDeviceId } from './authSlice';
import uiReducer from './uiSlice';
import syncReducer from './syncSlice';
import servicesReducer from './servicesSlice';
import technicianReducer from './technicianSlice';
import clientReducer from './clientSlice';
import type { Client, CheckIn, Service, ServiceCategory, Technician, QueueStatus } from '../../types';

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

describe('checkinSlice - reducers', () => {
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

  it('should set phone number', () => {
    const store = createTestStore();
    store.dispatch(setPhoneNumber('5559876543'));
    expect(store.getState().checkin.phoneNumber).toBe('5559876543');
  });

  it('should set lookup status', () => {
    const store = createTestStore();
    store.dispatch(setLookupStatus('loading'));
    expect(store.getState().checkin.lookupStatus).toBe('loading');
    
    store.dispatch(setLookupStatus('found'));
    expect(store.getState().checkin.lookupStatus).toBe('found');
    
    store.dispatch(setLookupStatus('not_found'));
    expect(store.getState().checkin.lookupStatus).toBe('not_found');
    
    store.dispatch(setLookupStatus('error'));
    expect(store.getState().checkin.lookupStatus).toBe('error');
  });

  it('should set new client with isNewClient flag', () => {
    const store = createTestStore();
    store.dispatch(setNewClient(mockClient));
    
    const state = store.getState().checkin;
    expect(state.currentClient).toEqual(mockClient);
    expect(state.isNewClient).toBe(true);
  });

  it('should set current client with isNewClient false', () => {
    const store = createTestStore();
    store.dispatch(setCurrentClient(mockClient));
    
    const state = store.getState().checkin;
    expect(state.currentClient).toEqual(mockClient);
    expect(state.isNewClient).toBe(false);
  });

  it('should set services array', () => {
    const store = createTestStore();
    const services: Service[] = [
      { id: 's1', name: 'Manicure', price: 25, durationMinutes: 30, categoryId: 'cat1', categoryName: 'Nails', isActive: true },
      { id: 's2', name: 'Pedicure', price: 35, durationMinutes: 45, categoryId: 'cat1', categoryName: 'Nails', isActive: true },
    ];
    
    store.dispatch(setServices(services));
    expect(store.getState().checkin.services).toEqual(services);
  });

  it('should set service categories', () => {
    const store = createTestStore();
    const categories: ServiceCategory[] = [
      { id: 'cat1', name: 'Nail Services', displayOrder: 1, services: [] },
      { id: 'cat2', name: 'Spa Services', displayOrder: 2, services: [] },
    ];
    
    store.dispatch(setServiceCategories(categories));
    expect(store.getState().checkin.serviceCategories).toEqual(categories);
  });

  it('should add selected service without duplicates', () => {
    const store = createTestStore();
    const service = {
      serviceId: 's1',
      serviceName: 'Manicure',
      price: 25,
      durationMinutes: 30,
    };
    
    store.dispatch(addSelectedService(service));
    expect(store.getState().checkin.selectedServices).toHaveLength(1);
    
    // Adding same service again should not duplicate
    store.dispatch(addSelectedService(service));
    expect(store.getState().checkin.selectedServices).toHaveLength(1);
  });

  it('should remove selected service', () => {
    const store = createTestStore();
    const service = {
      serviceId: 's1',
      serviceName: 'Manicure',
      price: 25,
      durationMinutes: 30,
    };
    
    store.dispatch(addSelectedService(service));
    expect(store.getState().checkin.selectedServices).toHaveLength(1);
    
    store.dispatch(removeSelectedService('s1'));
    expect(store.getState().checkin.selectedServices).toHaveLength(0);
  });

  it('should clear all selected services', () => {
    const store = createTestStore();
    store.dispatch(addSelectedService({
      serviceId: 's1',
      serviceName: 'Manicure',
      price: 25,
      durationMinutes: 30,
    }));
    store.dispatch(addSelectedService({
      serviceId: 's2',
      serviceName: 'Pedicure',
      price: 35,
      durationMinutes: 45,
    }));
    
    expect(store.getState().checkin.selectedServices).toHaveLength(2);
    
    store.dispatch(clearSelectedServices());
    expect(store.getState().checkin.selectedServices).toHaveLength(0);
  });

  it('should set technicians', () => {
    const store = createTestStore();
    const technicians: Technician[] = [
      { id: 't1', firstName: 'Alice', lastName: 'Smith', displayName: 'Alice S.', status: 'available', serviceIds: ['s1'] },
      { id: 't2', firstName: 'Bob', lastName: 'Jones', displayName: 'Bob J.', status: 'with_client', serviceIds: ['s1', 's2'] },
    ];
    
    store.dispatch(setTechnicians(technicians));
    expect(store.getState().checkin.technicians).toEqual(technicians);
  });

  it('should set technician preference', () => {
    const store = createTestStore();
    
    store.dispatch(setTechnicianPreference('tech-123'));
    expect(store.getState().checkin.technicianPreference).toBe('tech-123');
    
    store.dispatch(setTechnicianPreference('anyone'));
    expect(store.getState().checkin.technicianPreference).toBe('anyone');
  });

  it('should add guest', () => {
    const store = createTestStore();
    const guest = {
      id: 'guest-1',
      name: 'Jane Doe',
      services: [{ serviceId: 's1', serviceName: 'Manicure', price: 25, durationMinutes: 30 }],
      technicianPreference: 'anyone' as const,
    };
    
    store.dispatch(addGuest(guest));
    expect(store.getState().checkin.guests).toHaveLength(1);
    expect(store.getState().checkin.guests[0]).toEqual(guest);
  });

  it('should remove guest', () => {
    const store = createTestStore();
    const guest = {
      id: 'guest-1',
      name: 'Jane Doe',
      services: [{ serviceId: 's1', serviceName: 'Manicure', price: 25, durationMinutes: 30 }],
      technicianPreference: 'anyone' as const,
    };
    
    store.dispatch(addGuest(guest));
    expect(store.getState().checkin.guests).toHaveLength(1);
    
    store.dispatch(removeGuest('guest-1'));
    expect(store.getState().checkin.guests).toHaveLength(0);
  });

  it('should update guest', () => {
    const store = createTestStore();
    const guest = {
      id: 'guest-1',
      name: 'Jane Doe',
      services: [{ serviceId: 's1', serviceName: 'Manicure', price: 25, durationMinutes: 30 }],
      technicianPreference: 'anyone' as const,
    };
    
    store.dispatch(addGuest(guest));
    
    const updatedGuest = {
      ...guest,
      name: 'Jane Smith',
      technicianPreference: 'tech-123' as const,
    };
    
    store.dispatch(updateGuest(updatedGuest));
    expect(store.getState().checkin.guests[0].name).toBe('Jane Smith');
    expect(store.getState().checkin.guests[0].technicianPreference).toBe('tech-123');
  });

  it('should not update non-existent guest', () => {
    const store = createTestStore();
    const guest = {
      id: 'guest-nonexistent',
      name: 'Nobody',
      services: [],
      technicianPreference: 'anyone' as const,
    };
    
    store.dispatch(updateGuest(guest));
    expect(store.getState().checkin.guests).toHaveLength(0);
  });

  it('should set party preference', () => {
    const store = createTestStore();
    
    store.dispatch(setPartyPreference('sequence'));
    expect(store.getState().checkin.partyPreference).toBe('sequence');
    
    store.dispatch(setPartyPreference('together'));
    expect(store.getState().checkin.partyPreference).toBe('together');
  });

  it('should set queue status', () => {
    const store = createTestStore();
    const queueStatus: QueueStatus = {
      totalInQueue: 5,
      averageWaitMinutes: 15,
      positions: [
        { checkInId: 'c1', position: 1, estimatedWaitMinutes: 5 },
        { checkInId: 'c2', position: 2, estimatedWaitMinutes: 10 },
      ],
      lastUpdated: '2024-01-15T10:30:00Z',
    };
    
    store.dispatch(setQueueStatus(queueStatus));
    expect(store.getState().checkin.queueStatus).toEqual(queueStatus);
  });

  it('should set check-in number', () => {
    const store = createTestStore();
    store.dispatch(setCheckInNumber('A042'));
    expect(store.getState().checkin.checkInNumber).toBe('A042');
  });

  it('should set queue position', () => {
    const store = createTestStore();
    store.dispatch(setQueuePosition(3));
    expect(store.getState().checkin.queuePosition).toBe(3);
  });

  it('should set estimated wait minutes', () => {
    const store = createTestStore();
    store.dispatch(setEstimatedWaitMinutes(24));
    expect(store.getState().checkin.estimatedWaitMinutes).toBe(24);
  });

  it('should set completed check-in ID', () => {
    const store = createTestStore();
    store.dispatch(setCompletedCheckInId('checkin-abc'));
    expect(store.getState().checkin.completedCheckInId).toBe('checkin-abc');
  });

  it('should set client called info', () => {
    const store = createTestStore();
    const calledInfo = {
      technicianId: 'tech-1',
      technicianName: 'Alice',
      station: 'Station 3',
      calledAt: '2024-01-15T11:00:00Z',
    };
    
    store.dispatch(setClientCalled(calledInfo));
    
    const state = store.getState().checkin;
    expect(state.isCalled).toBe(true);
    expect(state.calledInfo).toEqual(calledInfo);
  });

  it('should clear called status', () => {
    const store = createTestStore();
    const calledInfo = {
      technicianId: 'tech-1',
      technicianName: 'Alice',
      station: 'Station 3',
      calledAt: '2024-01-15T11:00:00Z',
    };
    
    store.dispatch(setClientCalled(calledInfo));
    expect(store.getState().checkin.isCalled).toBe(true);
    
    store.dispatch(clearCalledStatus());
    
    const state = store.getState().checkin;
    expect(state.isCalled).toBe(false);
    expect(state.calledInfo).toBeNull();
  });

  it('should reset entire checkin state to initial', () => {
    const store = createTestStore();
    
    // Set various state values
    store.dispatch(setCurrentClient(mockClient));
    store.dispatch(setPhoneNumber('5551234567'));
    store.dispatch(setLookupStatus('found'));
    store.dispatch(addSelectedService({
      serviceId: 's1',
      serviceName: 'Manicure',
      price: 25,
      durationMinutes: 30,
    }));
    store.dispatch(setTechnicianPreference('tech-123'));
    store.dispatch(setCheckInNumber('A001'));
    store.dispatch(setQueuePosition(5));
    
    // Reset
    store.dispatch(resetCheckin());
    
    const state = store.getState().checkin;
    expect(state.currentClient).toBeNull();
    expect(state.isNewClient).toBe(false);
    expect(state.phoneNumber).toBe('');
    expect(state.lookupStatus).toBe('idle');
    expect(state.selectedServices).toEqual([]);
    expect(state.technicianPreference).toBe('anyone');
    expect(state.guests).toEqual([]);
    expect(state.partyPreference).toBe('together');
    expect(state.checkInNumber).toBeNull();
    expect(state.queuePosition).toBeNull();
    expect(state.estimatedWaitMinutes).toBeNull();
    expect(state.checkInStatus).toBe('idle');
    expect(state.checkInError).toBeNull();
    expect(state.isCalled).toBe(false);
    expect(state.calledInfo).toBeNull();
  });
});
