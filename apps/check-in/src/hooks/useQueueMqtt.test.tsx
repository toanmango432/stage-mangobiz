import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import { useQueueMqtt } from './useQueueMqtt';
import checkinReducer, { setCompletedCheckInId } from '../store/slices/checkinSlice';
import authReducer, { setStore } from '../store/slices/authSlice';

const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('../providers/MqttProvider', () => ({
  useMqtt: () => ({
    subscribe: mockSubscribe,
    isConnected: true,
  }),
}));

function createTestStore() {
  return configureStore({
    reducer: {
      checkin: checkinReducer,
      auth: authReducer,
    },
  });
}

function createWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('useQueueMqtt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscribe.mockReturnValue(mockUnsubscribe);
  });

  it('should return isConnected status', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));

    const { result } = renderHook(() => useQueueMqtt(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('should subscribe to queue status topic when connected and has storeId', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));

    renderHook(() => useQueueMqtt(), {
      wrapper: createWrapper(store),
    });

    expect(mockSubscribe).toHaveBeenCalledWith(
      'salon/store-123/queue/status',
      expect.any(Function)
    );
  });

  it('should not subscribe without storeId', () => {
    const store = createTestStore();
    // No storeId set

    renderHook(() => useQueueMqtt(), {
      wrapper: createWrapper(store),
    });

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));

    const { unmount } = renderHook(() => useQueueMqtt(), {
      wrapper: createWrapper(store),
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should update queue position when receiving matching checkInId', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));
    store.dispatch(setCompletedCheckInId('checkin-abc'));

    let messageHandler: (topic: string, payload: unknown) => void;
    mockSubscribe.mockImplementation((_topic: string, handler: (topic: string, payload: unknown) => void) => {
      messageHandler = handler;
      return mockUnsubscribe;
    });

    renderHook(() => useQueueMqtt(), {
      wrapper: createWrapper(store),
    });

    const queuePayload = {
      totalInQueue: 5,
      averageWaitMinutes: 15,
      positions: [
        { checkInId: 'checkin-abc', position: 2, estimatedWaitMinutes: 10 },
        { checkInId: 'checkin-xyz', position: 3, estimatedWaitMinutes: 15 },
      ],
      lastUpdated: '2024-01-15T10:30:00Z',
    };

    act(() => {
      messageHandler('salon/store-123/queue/status', queuePayload);
    });

    const state = store.getState().checkin;
    expect(state.queuePosition).toBe(2);
    expect(state.estimatedWaitMinutes).toBe(10);
    expect(state.queueStatus?.totalInQueue).toBe(5);
  });

  it('should handle invalid payload gracefully', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));

    let messageHandler: (topic: string, payload: unknown) => void;
    mockSubscribe.mockImplementation((_topic: string, handler: (topic: string, payload: unknown) => void) => {
      messageHandler = handler;
      return mockUnsubscribe;
    });

    renderHook(() => useQueueMqtt(), {
      wrapper: createWrapper(store),
    });

    // Should not throw when receiving invalid payload
    act(() => {
      messageHandler('salon/store-123/queue/status', null);
    });

    act(() => {
      messageHandler('salon/store-123/queue/status', 'invalid');
    });

    // State should remain unchanged
    const state = store.getState().checkin;
    expect(state.queuePosition).toBeNull();
  });

  it('should handle missing positions array', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));
    store.dispatch(setCompletedCheckInId('checkin-abc'));

    let messageHandler: (topic: string, payload: unknown) => void;
    mockSubscribe.mockImplementation((_topic: string, handler: (topic: string, payload: unknown) => void) => {
      messageHandler = handler;
      return mockUnsubscribe;
    });

    renderHook(() => useQueueMqtt(), {
      wrapper: createWrapper(store),
    });

    const queuePayload = {
      totalInQueue: 3,
      averageWaitMinutes: 10,
      // No positions array
      lastUpdated: '2024-01-15T10:30:00Z',
    };

    act(() => {
      messageHandler('salon/store-123/queue/status', queuePayload);
    });

    const state = store.getState().checkin;
    expect(state.queueStatus?.totalInQueue).toBe(3);
    expect(state.queueStatus?.positions).toEqual([]);
  });
});
