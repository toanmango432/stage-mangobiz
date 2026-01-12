import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import servicesReducer, { fetchServices, clearServicesError } from './servicesSlice';
import { dataService } from '../../services/dataService';
import type { ServiceCategory } from '../../types';

vi.mock('../../services/dataService', () => ({
  dataService: {
    services: {
      getByCategory: vi.fn(),
    },
  },
}));

const mockCategories: ServiceCategory[] = [
  {
    id: 'cat-1',
    name: 'Nails',
    displayOrder: 1,
    services: [
      {
        id: 'svc-1',
        name: 'Classic Manicure',
        categoryId: 'cat-1',
        categoryName: 'Nails',
        price: 25,
        durationMinutes: 30,
        isActive: true,
      },
      {
        id: 'svc-2',
        name: 'Gel Manicure',
        categoryId: 'cat-1',
        categoryName: 'Nails',
        price: 40,
        durationMinutes: 45,
        isActive: true,
      },
    ],
  },
  {
    id: 'cat-2',
    name: 'Waxing',
    displayOrder: 2,
    services: [
      {
        id: 'svc-3',
        name: 'Eyebrow Wax',
        categoryId: 'cat-2',
        categoryName: 'Waxing',
        price: 15,
        durationMinutes: 15,
        isActive: true,
      },
    ],
  },
];

type TestStore = EnhancedStore<{ services: ReturnType<typeof servicesReducer> }>;

describe('servicesSlice', () => {
  let store: TestStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: {
        services: servicesReducer,
      },
    });
  });

  describe('fetchServices', () => {
    it('should set isLoading to true when pending', () => {
      vi.mocked(dataService.services.getByCategory).mockImplementation(
        () => new Promise(() => {})
      );

      store.dispatch(fetchServices() as never);

      const state = store.getState().services;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should populate categories and services when fulfilled', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      await store.dispatch(fetchServices() as never);

      const state = store.getState().services;
      expect(state.isLoading).toBe(false);
      expect(state.categories).toEqual(mockCategories);
      expect(state.services).toHaveLength(3);
      expect(state.services.map((s) => s.id)).toEqual(['svc-1', 'svc-2', 'svc-3']);
      expect(state.lastFetched).not.toBeNull();
    });

    it('should set error when fetch fails', async () => {
      vi.mocked(dataService.services.getByCategory).mockRejectedValue(
        new Error('Network error')
      );

      await store.dispatch(fetchServices() as never);

      const state = store.getState().services;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Network error');
      expect(state.categories).toEqual([]);
    });

    it('should call dataService.services.getByCategory', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      await store.dispatch(fetchServices() as never);

      expect(dataService.services.getByCategory).toHaveBeenCalledTimes(1);
    });

    it('should complete fetch in under 2 seconds', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      const startTime = Date.now();
      await store.dispatch(fetchServices() as never);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('clearServicesError', () => {
    it('should clear error state', async () => {
      vi.mocked(dataService.services.getByCategory).mockRejectedValue(
        new Error('Test error')
      );
      await store.dispatch(fetchServices() as never);

      store.dispatch(clearServicesError());

      const state = store.getState().services;
      expect(state.error).toBeNull();
    });
  });

  describe('services grouping by category', () => {
    it('should flatten all services from categories', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      await store.dispatch(fetchServices() as never);

      const state = store.getState().services;
      expect(state.services).toHaveLength(3);
      expect(state.categories).toHaveLength(2);
    });

    it('should handle empty categories', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue([]);

      await store.dispatch(fetchServices() as never);

      const state = store.getState().services;
      expect(state.services).toEqual([]);
      expect(state.categories).toEqual([]);
    });
  });
});
