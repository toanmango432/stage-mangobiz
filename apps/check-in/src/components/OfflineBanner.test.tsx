import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { OfflineBanner } from './OfflineBanner';
import syncReducer, {
  type SyncState,
  setSyncStatus,
  setSyncError,
  setOnlineStatus,
} from '../store/slices/syncSlice';
import { dataService } from '../services/dataService';

vi.mock('../services/dataService', () => ({
  dataService: {
    sync: {
      processQueue: vi.fn().mockResolvedValue(0),
      getPendingCount: vi.fn().mockResolvedValue(0),
    },
  },
}));

const createTestStore = () =>
  configureStore({
    reducer: { sync: syncReducer },
    preloadedState: {
      sync: {
        status: 'idle' as SyncState,
        isOnline: true,
        lastSyncedAt: null,
        pendingCount: 0,
        syncQueue: [],
        error: null,
      },
    },
  });

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows syncing message when status changes to syncing', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <OfflineBanner />
      </Provider>
    );

    act(() => {
      store.dispatch(setSyncStatus('syncing'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Syncing your data/i)).toBeInTheDocument();
    });
  });

  it('shows error message when sync fails', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <OfflineBanner />
      </Provider>
    );

    act(() => {
      store.dispatch(setSyncError('Network error'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Sync failed/i)).toBeInTheDocument();
    });
  });

  it('shows retry button when sync has error', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <OfflineBanner />
      </Provider>
    );

    act(() => {
      store.dispatch(setSyncError('Network error'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Retry now/i)).toBeInTheDocument();
    });
  });

  it('calls processQueue when retry button clicked', async () => {
    const user = userEvent.setup();
    const store = createTestStore();

    render(
      <Provider store={store}>
        <OfflineBanner />
      </Provider>
    );

    act(() => {
      store.dispatch(setSyncError('Network error'));
    });

    const retryButton = await screen.findByText(/Retry now/i);
    await user.click(retryButton);

    await waitFor(() => {
      expect(dataService.sync.processQueue).toHaveBeenCalled();
    });
  });

  it('shows offline message when going offline', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <OfflineBanner />
      </Provider>
    );

    act(() => {
      store.dispatch(setOnlineStatus(false));
    });

    await waitFor(() => {
      expect(screen.getByText(/No internet connection/i)).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes when showing', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <OfflineBanner />
      </Provider>
    );

    act(() => {
      store.dispatch(setSyncStatus('syncing'));
    });

    await waitFor(() => {
      const banner = screen.getByRole('alert');
      expect(banner).toHaveAttribute('aria-live', 'polite');
    });
  });

  it('renders without crash', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <OfflineBanner />
      </Provider>
    );

    expect(container).toBeDefined();
  });
});
