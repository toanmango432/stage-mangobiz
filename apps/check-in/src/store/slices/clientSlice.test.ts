import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import clientReducer, { fetchClientByPhone, clearPhoneSearch, createClient } from './clientSlice';
import { dataService } from '../../services/dataService';
import type { Client } from '../../types';

vi.mock('../../services/dataService', () => ({
  dataService: {
    clients: {
      getByPhone: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const mockClient: Client = {
  id: 'test-client-1',
  firstName: 'John',
  lastName: 'Doe',
  phone: '5551234567',
  email: 'john@example.com',
  smsOptIn: true,
  loyaltyPoints: 150,
  loyaltyPointsToNextReward: 50,
  createdAt: '2024-01-01T00:00:00Z',
  visitCount: 5,
};

type TestStore = EnhancedStore<{ client: ReturnType<typeof clientReducer> }>;

describe('clientSlice', () => {
  let store: TestStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: {
        client: clientReducer,
      },
    });
  });

  describe('fetchClientByPhone', () => {
    it('should set status to loading when pending', () => {
      vi.mocked(dataService.clients.getByPhone).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(fetchClientByPhone('5551234567') as never);

      const state = store.getState().client;
      expect(state.phoneSearchResult.status).toBe('loading');
      expect(state.phoneSearchResult.client).toBeNull();
    });

    it('should set status to found when client exists', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(mockClient);

      await store.dispatch(fetchClientByPhone('5551234567') as never);

      const state = store.getState().client;
      expect(state.phoneSearchResult.status).toBe('found');
      expect(state.phoneSearchResult.client).toEqual(mockClient);
      expect(state.currentClient).toEqual(mockClient);
    });

    it('should set status to not_found when client does not exist', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(null);

      await store.dispatch(fetchClientByPhone('5559999999') as never);

      const state = store.getState().client;
      expect(state.phoneSearchResult.status).toBe('not_found');
      expect(state.phoneSearchResult.client).toBeNull();
    });

    it('should set status to error on failure', async () => {
      vi.mocked(dataService.clients.getByPhone).mockRejectedValue(
        new Error('Network error')
      );

      await store.dispatch(fetchClientByPhone('5551234567') as never);

      const state = store.getState().client;
      expect(state.phoneSearchResult.status).toBe('error');
      expect(state.error).toBe('Network error');
    });

    it('should call dataService with provided phone', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(mockClient);

      await store.dispatch(fetchClientByPhone('(555) 123-4567') as never);

      expect(dataService.clients.getByPhone).toHaveBeenCalledWith('(555) 123-4567');
    });

    it('should complete lookup quickly', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(mockClient);

      const startTime = Date.now();
      await store.dispatch(fetchClientByPhone('5551234567') as never);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('clearPhoneSearch', () => {
    it('should reset phone search state', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(mockClient);
      await store.dispatch(fetchClientByPhone('5551234567') as never);

      store.dispatch(clearPhoneSearch());

      const state = store.getState().client;
      expect(state.phoneSearchResult.status).toBe('idle');
      expect(state.phoneSearchResult.client).toBeNull();
    });
  });

  describe('createClient', () => {
    it('should create client and set as current', async () => {
      vi.mocked(dataService.clients.create).mockResolvedValue(mockClient);

      await store.dispatch(
        createClient({
          firstName: 'John',
          lastName: 'Doe',
          phone: '5551234567',
          smsOptIn: true,
        }) as never
      );

      const state = store.getState().client;
      expect(state.currentClient).toEqual(mockClient);
      expect(state.clients).toContainEqual(mockClient);
    });

    it('should set error on create failure', async () => {
      vi.mocked(dataService.clients.create).mockRejectedValue(
        new Error('Duplicate phone')
      );

      await store.dispatch(
        createClient({
          firstName: 'John',
          lastName: 'Doe',
          phone: '5551234567',
          smsOptIn: true,
        }) as never
      );

      const state = store.getState().client;
      expect(state.error).toBe('Duplicate phone');
      expect(state.isLoading).toBe(false);
    });
  });
});
