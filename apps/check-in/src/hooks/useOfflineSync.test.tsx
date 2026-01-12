import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import syncReducer from '../store/slices/syncSlice';
import { useOfflineSync } from './useOfflineSync';
import { dataService } from '../services/dataService';

vi.mock('../services/dataService', () => ({
  dataService: {
    sync: {
      processQueue: vi.fn().mockResolvedValue(0),
      getPendingCount: vi.fn().mockResolvedValue(0),
    },
  },
}));

const createTestStore = (overrides?: {
  isOnline?: boolean;
  status?: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  pendingCount?: number;
}) =>
  configureStore({
    reducer: {
      sync: syncReducer,
    },
    preloadedState: {
      sync: {
        status: overrides?.status ?? 'idle',
        isOnline: overrides?.isOnline ?? true,
        lastSyncedAt: null,
        pendingCount: overrides?.pendingCount ?? 0,
        syncQueue: [],
        error: null,
      },
    },
  });

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
};

describe('useOfflineSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isOnline status from Redux store', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('calls processQueue on mount', async () => {
    const store = createTestStore();
    renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => {
      expect(dataService.sync.processQueue).toHaveBeenCalled();
    });
  });

  it('updates pending count after sync', async () => {
    vi.mocked(dataService.sync.getPendingCount).mockResolvedValue(3);
    const store = createTestStore();

    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(3);
    });
  });

  it('exposes forceSync function', () => {
    const store = createTestStore();
    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(store),
    });

    expect(typeof result.current.forceSync).toBe('function');
  });

  it('handles sync errors and sets error status', async () => {
    vi.mocked(dataService.sync.processQueue).mockRejectedValueOnce(
      new Error('Network error')
    );
    const store = createTestStore();

    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });

  it('updates lastSyncedAt when items are processed', async () => {
    vi.mocked(dataService.sync.processQueue).mockResolvedValue(2);
    const store = createTestStore();

    renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(store),
    });

    await waitFor(() => {
      expect(store.getState().sync.lastSyncedAt).not.toBeNull();
    });
  });

  it('returns current pendingCount from store', () => {
    const store = createTestStore({ pendingCount: 5 });

    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.pendingCount).toBe(5);
  });

  it('exposes status from Redux store', () => {
    const store = createTestStore({ status: 'syncing' });

    const { result } = renderHook(() => useOfflineSync(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.status).toBe('syncing');
  });
});
