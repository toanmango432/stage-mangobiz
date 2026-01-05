/**
 * Tests for useMqttPublish Hook
 * Part of: MQTT Architecture Implementation (Phase 1)
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMqttPublish, useTopicPublish } from './useMqttPublish';

const mockPublish = vi.fn();

// Mock the MqttProvider
vi.mock('../MqttProvider', () => ({
  useMqttContext: vi.fn(() => ({
    connection: {
      state: 'connected',
      brokerType: 'cloud',
      brokerUrl: 'wss://test.broker:8883',
      connectedAt: new Date(),
      error: null,
    },
    publish: mockPublish,
  })),
}));

describe('useMqttPublish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPublish.mockResolvedValue(undefined);
  });

  it('should return publish function', () => {
    const { result } = renderHook(() => useMqttPublish());

    expect(typeof result.current.publish).toBe('function');
  });

  it('should return isPublishing state', () => {
    const { result } = renderHook(() => useMqttPublish());

    expect(result.current.isPublishing).toBe(false);
  });

  it('should return error state', () => {
    const { result } = renderHook(() => useMqttPublish());

    expect(result.current.error).toBeNull();
  });

  it('should return clearError function', () => {
    const { result } = renderHook(() => useMqttPublish());

    expect(typeof result.current.clearError).toBe('function');
  });

  it('should call context publish when publishing', async () => {
    const { result } = renderHook(() => useMqttPublish());

    await act(async () => {
      await result.current.publish('mango/test/topic', { data: 'test' });
    });

    expect(mockPublish).toHaveBeenCalledWith('mango/test/topic', { data: 'test' }, undefined);
  });

  it('should handle publish options', async () => {
    const { result } = renderHook(() => useMqttPublish());

    await act(async () => {
      await result.current.publish('mango/test/topic', { data: 'test' }, { qos: 1 });
    });

    expect(mockPublish).toHaveBeenCalledWith('mango/test/topic', { data: 'test' }, { qos: 1 });
  });
});

describe('useTopicPublish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPublish.mockResolvedValue(undefined);
  });

  it('should return publish function for specific topic', () => {
    const { result } = renderHook(() =>
      useTopicPublish({
        topic: 'mango/store-123/pad/signature',
        qos: 1,
      })
    );

    expect(typeof result.current.publish).toBe('function');
  });

  it('should publish to preconfigured topic', async () => {
    const { result } = renderHook(() =>
      useTopicPublish({
        topic: 'mango/store-123/pad/signature',
        qos: 1,
      })
    );

    await act(async () => {
      await result.current.publish({ signatureData: 'base64data' });
    });

    expect(mockPublish).toHaveBeenCalledWith(
      'mango/store-123/pad/signature',
      { signatureData: 'base64data' },
      { qos: 1, retain: undefined }
    );
  });

  it('should return isPublishing state', () => {
    const { result } = renderHook(() =>
      useTopicPublish({
        topic: 'mango/test/topic',
      })
    );

    expect(result.current.isPublishing).toBe(false);
  });

  it('should return error state', () => {
    const { result } = renderHook(() =>
      useTopicPublish({
        topic: 'mango/test/topic',
      })
    );

    expect(result.current.error).toBeNull();
  });
});
