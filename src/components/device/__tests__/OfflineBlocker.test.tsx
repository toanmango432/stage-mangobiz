/**
 * OfflineBlocker Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setDevice } from '@/store/slices/authSlice';
import syncReducer, { setOnlineStatus } from '@/store/slices/syncSlice';
import { OfflineBlocker } from '../OfflineBlocker';

// Create test store
function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      sync: syncReducer,
    },
  });
}

// Wrapper component
function createWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store, children });
  };
}

describe('OfflineBlocker', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    vi.clearAllMocks();
  });

  it('should render children when online', () => {
    store.dispatch(setOnlineStatus(true));

    const Wrapper = createWrapper(store);
    render(
      <Wrapper>
        <OfflineBlocker>
          <div data-testid="child-content">App Content</div>
        </OfflineBlocker>
      </Wrapper>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByText('No Internet Connection')).not.toBeInTheDocument();
  });

  it('should render children when offline but device is offline-enabled', () => {
    store.dispatch(setOnlineStatus(false));
    store.dispatch(
      setDevice({
        id: 'device-123',
        mode: 'offline-enabled',
        offlineModeEnabled: true,
        registeredAt: new Date().toISOString(),
      })
    );

    const Wrapper = createWrapper(store);
    render(
      <Wrapper>
        <OfflineBlocker>
          <div data-testid="child-content">App Content</div>
        </OfflineBlocker>
      </Wrapper>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByText('No Internet Connection')).not.toBeInTheDocument();
  });

  it('should show blocker when offline and device is online-only', () => {
    store.dispatch(setOnlineStatus(false));
    store.dispatch(
      setDevice({
        id: 'device-123',
        mode: 'online-only',
        offlineModeEnabled: false,
        registeredAt: new Date().toISOString(),
      })
    );

    const Wrapper = createWrapper(store);
    render(
      <Wrapper>
        <OfflineBlocker>
          <div data-testid="child-content">App Content</div>
        </OfflineBlocker>
      </Wrapper>
    );

    expect(screen.getByText('No Internet Connection')).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  it('should show blocker when offline and no device set', () => {
    store.dispatch(setOnlineStatus(false));

    const Wrapper = createWrapper(store);
    render(
      <Wrapper>
        <OfflineBlocker>
          <div data-testid="child-content">App Content</div>
        </OfflineBlocker>
      </Wrapper>
    );

    expect(screen.getByText('No Internet Connection')).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  it('should show offline mode suggestion', () => {
    store.dispatch(setOnlineStatus(false));

    const Wrapper = createWrapper(store);
    render(
      <Wrapper>
        <OfflineBlocker>
          <div>Content</div>
        </OfflineBlocker>
      </Wrapper>
    );

    expect(screen.getByText('Need to work offline?')).toBeInTheDocument();
  });

  it('should have a Try Again button', () => {
    store.dispatch(setOnlineStatus(false));

    const Wrapper = createWrapper(store);
    render(
      <Wrapper>
        <OfflineBlocker>
          <div>Content</div>
        </OfflineBlocker>
      </Wrapper>
    );

    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });
});
