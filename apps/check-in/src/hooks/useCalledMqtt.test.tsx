import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { ReactNode } from 'react';
import checkinReducer, { setCompletedCheckInId, setCheckInNumber } from '../store/slices/checkinSlice';
import authReducer, { setStore } from '../store/slices/authSlice';

const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();
const mockSendQueueCalledNotification = vi.fn();
const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockPause = vi.fn();
const mockLoad = vi.fn();

vi.mock('../providers/MqttProvider', () => ({
  useMqtt: () => ({
    subscribe: mockSubscribe,
    isConnected: true,
  }),
}));

vi.mock('../services/smsService', () => ({
  smsService: {
    sendQueueCalledNotification: (...args: unknown[]) => mockSendQueueCalledNotification(...args),
  },
}));

// Mock Audio globally before any tests run
class MockAudio {
  play = mockPlay;
  pause = mockPause;
  load = mockLoad;
  currentTime = 0;
}
vi.stubGlobal('Audio', MockAudio);

// Import the hook after mocks are set up
import { useCalledMqtt } from './useCalledMqtt';

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

describe('useCalledMqtt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscribe.mockReturnValue(mockUnsubscribe);
    mockSendQueueCalledNotification.mockResolvedValue({ success: true });
  });

  it('should return isConnected status', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));

    const { result } = renderHook(() => useCalledMqtt(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('should subscribe to called topic when connected and has storeId', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));

    renderHook(() => useCalledMqtt(), {
      wrapper: createWrapper(store),
    });

    expect(mockSubscribe).toHaveBeenCalledWith(
      'salon/store-123/checkin/called',
      expect.any(Function)
    );
  });

  it('should not subscribe without storeId', () => {
    const store = createTestStore();

    renderHook(() => useCalledMqtt(), {
      wrapper: createWrapper(store),
    });

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));

    const { unmount } = renderHook(() => useCalledMqtt(), {
      wrapper: createWrapper(store),
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should update state when current client is called by checkInId', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));
    store.dispatch(setCompletedCheckInId('checkin-abc'));

    let messageHandler: (topic: string, payload: unknown) => void;
    mockSubscribe.mockImplementation((_topic: string, handler: (topic: string, payload: unknown) => void) => {
      messageHandler = handler;
      return mockUnsubscribe;
    });

    renderHook(() => useCalledMqtt(), {
      wrapper: createWrapper(store),
    });

    const calledPayload = {
      checkInId: 'checkin-abc',
      checkInNumber: 'A042',
      technicianId: 'tech-1',
      technicianName: 'Alice',
      station: 'Station 3',
      calledAt: '2024-01-15T11:00:00Z',
    };

    act(() => {
      messageHandler('salon/store-123/checkin/called', calledPayload);
    });

    const state = store.getState().checkin;
    expect(state.isCalled).toBe(true);
    expect(state.calledInfo?.technicianName).toBe('Alice');
    expect(state.calledInfo?.station).toBe('Station 3');
  });

  it('should update state when current client is called by checkInNumber', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));
    store.dispatch(setCheckInNumber('A042'));

    let messageHandler: (topic: string, payload: unknown) => void;
    mockSubscribe.mockImplementation((_topic: string, handler: (topic: string, payload: unknown) => void) => {
      messageHandler = handler;
      return mockUnsubscribe;
    });

    renderHook(() => useCalledMqtt(), {
      wrapper: createWrapper(store),
    });

    const calledPayload = {
      checkInId: 'checkin-different',
      checkInNumber: 'A042',
      technicianName: 'Bob',
      calledAt: '2024-01-15T11:00:00Z',
    };

    act(() => {
      messageHandler('salon/store-123/checkin/called', calledPayload);
    });

    const state = store.getState().checkin;
    expect(state.isCalled).toBe(true);
    expect(state.calledInfo?.technicianName).toBe('Bob');
  });

  it('should not update state when different client is called', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));
    store.dispatch(setCompletedCheckInId('checkin-abc'));
    store.dispatch(setCheckInNumber('A042'));

    let messageHandler: (topic: string, payload: unknown) => void;
    mockSubscribe.mockImplementation((_topic: string, handler: (topic: string, payload: unknown) => void) => {
      messageHandler = handler;
      return mockUnsubscribe;
    });

    renderHook(() => useCalledMqtt(), {
      wrapper: createWrapper(store),
    });

    const calledPayload = {
      checkInId: 'checkin-other',
      checkInNumber: 'B001',
      calledAt: '2024-01-15T11:00:00Z',
    };

    act(() => {
      messageHandler('salon/store-123/checkin/called', calledPayload);
    });

    const state = store.getState().checkin;
    expect(state.isCalled).toBe(false);
  });

  it('should play notification sound when called', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));
    store.dispatch(setCompletedCheckInId('checkin-abc'));

    let messageHandler: (topic: string, payload: unknown) => void;
    mockSubscribe.mockImplementation((_topic: string, handler: (topic: string, payload: unknown) => void) => {
      messageHandler = handler;
      return mockUnsubscribe;
    });

    renderHook(() => useCalledMqtt(), {
      wrapper: createWrapper(store),
    });

    const calledPayload = {
      checkInId: 'checkin-abc',
      checkInNumber: 'A042',
      calledAt: '2024-01-15T11:00:00Z',
    };

    act(() => {
      messageHandler('salon/store-123/checkin/called', calledPayload);
    });

    expect(mockPlay).toHaveBeenCalled();
  });

  it('should send SMS when client has opted in', async () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));

    let messageHandler: (topic: string, payload: unknown) => void;
    mockSubscribe.mockImplementation((_topic: string, handler: (topic: string, payload: unknown) => void) => {
      messageHandler = handler;
      return mockUnsubscribe;
    });

    renderHook(() => useCalledMqtt(), {
      wrapper: createWrapper(store),
    });

    const calledPayload = {
      checkInId: 'checkin-new',
      checkInNumber: 'A099',
      clientId: 'client-1',
      clientName: 'Jane Doe',
      clientPhone: '5551234567',
      smsOptIn: true,
      calledAt: '2024-01-15T11:00:00Z',
    };

    await act(async () => {
      messageHandler('salon/store-123/checkin/called', calledPayload);
    });

    expect(mockSendQueueCalledNotification).toHaveBeenCalledWith({
      phone: '5551234567',
      clientName: 'Jane Doe',
      checkInNumber: 'A099',
      technicianName: undefined,
      station: undefined,
      smsOptIn: true,
    });
  });

  it('should not send duplicate SMS for same checkInId', async () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));

    let messageHandler: (topic: string, payload: unknown) => void;
    mockSubscribe.mockImplementation((_topic: string, handler: (topic: string, payload: unknown) => void) => {
      messageHandler = handler;
      return mockUnsubscribe;
    });

    renderHook(() => useCalledMqtt(), {
      wrapper: createWrapper(store),
    });

    const calledPayload = {
      checkInId: 'checkin-dup',
      checkInNumber: 'A100',
      clientName: 'Jane Doe',
      clientPhone: '5551234567',
      smsOptIn: true,
      calledAt: '2024-01-15T11:00:00Z',
    };

    // Send first message
    await act(async () => {
      messageHandler('salon/store-123/checkin/called', calledPayload);
    });

    // Send duplicate message
    await act(async () => {
      messageHandler('salon/store-123/checkin/called', calledPayload);
    });

    // Should only be called once
    expect(mockSendQueueCalledNotification).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid payload gracefully', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));

    let messageHandler: (topic: string, payload: unknown) => void;
    mockSubscribe.mockImplementation((_topic: string, handler: (topic: string, payload: unknown) => void) => {
      messageHandler = handler;
      return mockUnsubscribe;
    });

    renderHook(() => useCalledMqtt(), {
      wrapper: createWrapper(store),
    });

    // Should not throw on invalid payloads
    act(() => {
      messageHandler('salon/store-123/checkin/called', null);
    });

    act(() => {
      messageHandler('salon/store-123/checkin/called', 'invalid');
    });

    const state = store.getState().checkin;
    expect(state.isCalled).toBe(false);
  });

  it('should clean up audio on unmount', () => {
    const store = createTestStore();
    store.dispatch(setStore({ id: 'store-123', name: 'Test Store', timezone: 'America/New_York' }));

    const { unmount } = renderHook(() => useCalledMqtt(), {
      wrapper: createWrapper(store),
    });

    unmount();

    expect(mockPause).toHaveBeenCalled();
  });
});
