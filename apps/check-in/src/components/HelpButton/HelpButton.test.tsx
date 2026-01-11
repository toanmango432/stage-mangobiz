/**
 * Unit Tests for HelpButton Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { HelpButton } from './index';
import adminReducer from '../../store/slices/adminSlice';
import authReducer from '../../store/slices/authSlice';

// Mock MQTT provider
vi.mock('../../providers/MqttProvider', () => ({
  useMqtt: () => ({
    publish: vi.fn(() => Promise.resolve()),
    subscribe: vi.fn(),
    isConnected: true,
  }),
}));

function createTestStore(overrides?: {
  isHelpRequested?: boolean;
  storeId?: string | null;
}) {
  return configureStore({
    reducer: {
      admin: adminReducer,
      auth: authReducer,
    },
    preloadedState: {
      admin: {
        isAdminModeActive: false,
        isHelpRequested: overrides?.isHelpRequested ?? false,
        helpRequestId: overrides?.isHelpRequested ? 'help-123' : null,
        helpRequestedAt: null,
        showPinModal: false,
        pinError: null,
      },
      auth: {
        storeId: overrides?.storeId ?? 'store-123',
        deviceId: 'device-456',
        isAuthenticated: true,
        store: null,
      },
    },
  });
}

describe('HelpButton', () => {
  it('renders help button', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <HelpButton />
      </Provider>
    );

    expect(screen.getByLabelText('Request assistance')).toBeInTheDocument();
  });

  it('renders staff access button', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <HelpButton />
      </Provider>
    );

    expect(screen.getByLabelText('Staff access')).toBeInTheDocument();
  });

  it('shows cancel button when help is requested', () => {
    const store = createTestStore({ isHelpRequested: true });
    render(
      <Provider store={store}>
        <HelpButton />
      </Provider>
    );

    expect(screen.getByLabelText('Cancel help request')).toBeInTheDocument();
  });

  it('shows "Help is on the way" message when help requested', () => {
    const store = createTestStore({ isHelpRequested: true });
    render(
      <Provider store={store}>
        <HelpButton />
      </Provider>
    );

    expect(screen.getByText('Help is on the way!')).toBeInTheDocument();
  });

  it('dispatches requestHelp on click when not already requesting', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <HelpButton />
      </Provider>
    );

    const helpButton = screen.getByLabelText('Request assistance');
    fireEvent.click(helpButton);

    // Check that the store state changed
    const state = store.getState();
    expect(state.admin.isHelpRequested).toBe(true);
    expect(state.admin.helpRequestId).toBeTruthy();
  });

  it('dispatches cancelHelpRequest on click when already requesting', () => {
    const store = createTestStore({ isHelpRequested: true });
    render(
      <Provider store={store}>
        <HelpButton />
      </Provider>
    );

    const cancelButton = screen.getByLabelText('Cancel help request');
    fireEvent.click(cancelButton);

    const state = store.getState();
    expect(state.admin.isHelpRequested).toBe(false);
  });

  it('dispatches showPinModal on staff access click', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <HelpButton />
      </Provider>
    );

    const staffButton = screen.getByLabelText('Staff access');
    fireEvent.click(staffButton);

    const state = store.getState();
    expect(state.admin.showPinModal).toBe(true);
  });
});

describe('HelpButton styling', () => {
  it('has correct classes when not requesting help', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <HelpButton />
      </Provider>
    );

    const helpButton = screen.getByLabelText('Request assistance');
    expect(helpButton).toHaveClass('bg-[#1a5f4a]');
  });

  it('has correct classes when requesting help', () => {
    const store = createTestStore({ isHelpRequested: true });
    render(
      <Provider store={store}>
        <HelpButton />
      </Provider>
    );

    const helpButton = screen.getByLabelText('Cancel help request');
    expect(helpButton).toHaveClass('bg-[#d4a853]');
  });
});
