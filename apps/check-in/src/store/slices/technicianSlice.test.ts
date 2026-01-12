import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import technicianReducer, {
  fetchTechnicians,
  updateTechnicianStatus,
  updateTechnicianStatuses,
  clearTechniciansError,
} from './technicianSlice';
import { dataService } from '../../services/dataService';
import type { Technician } from '../../types';

vi.mock('../../services/dataService', () => ({
  dataService: {
    technicians: {
      getAll: vi.fn(),
    },
  },
}));

interface TestState {
  technicians: {
    technicians: Technician[];
    isLoading: boolean;
    error: string | null;
    lastFetched: string | null;
  };
}

const mockTechnicians: Technician[] = [
  {
    id: 'tech-1',
    firstName: 'Lisa',
    lastName: 'Smith',
    displayName: 'Lisa S.',
    status: 'available',
    serviceIds: ['svc-1', 'svc-2'],
    estimatedWaitMinutes: 0,
  },
  {
    id: 'tech-2',
    firstName: 'Mike',
    lastName: 'Johnson',
    displayName: 'Mike J.',
    status: 'with_client',
    serviceIds: ['svc-1', 'svc-3'],
    estimatedWaitMinutes: 15,
  },
  {
    id: 'tech-3',
    firstName: 'Sarah',
    lastName: 'Davis',
    displayName: 'Sarah D.',
    status: 'on_break',
    serviceIds: ['svc-2', 'svc-4'],
    estimatedWaitMinutes: undefined,
  },
];

const createTestStore = () =>
  configureStore({
    reducer: { technicians: technicianReducer },
  });

type TestStore = ReturnType<typeof createTestStore>;

const getState = (store: TestStore): TestState => store.getState() as TestState;

describe('technicianSlice', () => {
  let store: TestStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore();
  });

  describe('fetchTechnicians', () => {
    it('should fetch technicians successfully', async () => {
      vi.mocked(dataService.technicians.getAll).mockResolvedValue(mockTechnicians);

      await store.dispatch(fetchTechnicians() as never);

      const state = getState(store).technicians;
      expect(state.technicians).toEqual(mockTechnicians);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetched).not.toBeNull();
    });

    it('should set loading state while fetching', async () => {
      vi.mocked(dataService.technicians.getAll).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTechnicians), 100))
      );

      const promise = store.dispatch(fetchTechnicians() as never);

      expect(getState(store).technicians.isLoading).toBe(true);

      await promise;

      expect(getState(store).technicians.isLoading).toBe(false);
    });

    it('should handle fetch error', async () => {
      vi.mocked(dataService.technicians.getAll).mockRejectedValue(new Error('Network error'));

      await store.dispatch(fetchTechnicians() as never);

      const state = getState(store).technicians;
      expect(state.technicians).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('updateTechnicianStatus', () => {
    beforeEach(async () => {
      vi.mocked(dataService.technicians.getAll).mockResolvedValue(mockTechnicians);
      await store.dispatch(fetchTechnicians() as never);
    });

    it('should update a single technician status', () => {
      store.dispatch(
        updateTechnicianStatus({
          technicianId: 'tech-1',
          status: 'with_client',
          estimatedWaitMinutes: 20,
        })
      );

      const tech = getState(store).technicians.technicians.find((t: Technician) => t.id === 'tech-1');
      expect(tech?.status).toBe('with_client');
      expect(tech?.estimatedWaitMinutes).toBe(20);
    });

    it('should not affect other technicians when updating one', () => {
      const originalTech2 = getState(store).technicians.technicians.find((t: Technician) => t.id === 'tech-2');

      store.dispatch(
        updateTechnicianStatus({
          technicianId: 'tech-1',
          status: 'on_break',
        })
      );

      const tech2After = getState(store).technicians.technicians.find((t: Technician) => t.id === 'tech-2');
      expect(tech2After).toEqual(originalTech2);
    });

    it('should ignore update for non-existent technician', () => {
      const stateBefore = getState(store).technicians.technicians;

      store.dispatch(
        updateTechnicianStatus({
          technicianId: 'non-existent',
          status: 'available',
        })
      );

      expect(getState(store).technicians.technicians).toEqual(stateBefore);
    });
  });

  describe('updateTechnicianStatuses', () => {
    beforeEach(async () => {
      vi.mocked(dataService.technicians.getAll).mockResolvedValue(mockTechnicians);
      await store.dispatch(fetchTechnicians() as never);
    });

    it('should update multiple technician statuses at once', () => {
      store.dispatch(
        updateTechnicianStatuses([
          { technicianId: 'tech-1', status: 'on_break' },
          { technicianId: 'tech-2', status: 'available', estimatedWaitMinutes: 0 },
        ])
      );

      const state = getState(store).technicians.technicians;
      const tech1 = state.find((t: Technician) => t.id === 'tech-1');
      const tech2 = state.find((t: Technician) => t.id === 'tech-2');

      expect(tech1?.status).toBe('on_break');
      expect(tech2?.status).toBe('available');
      expect(tech2?.estimatedWaitMinutes).toBe(0);
    });
  });

  describe('clearTechniciansError', () => {
    it('should clear the error state', async () => {
      vi.mocked(dataService.technicians.getAll).mockRejectedValue(new Error('Test error'));
      await store.dispatch(fetchTechnicians() as never);

      expect(getState(store).technicians.error).toBe('Test error');

      store.dispatch(clearTechniciansError());

      expect(getState(store).technicians.error).toBeNull();
    });
  });
});
