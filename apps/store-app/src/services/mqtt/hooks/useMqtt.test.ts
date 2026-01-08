/**
 * Tests for useMqtt Hook
 * Part of: MQTT Architecture Implementation (Phase 1)
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMqtt } from './useMqtt';

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
    reconnect: vi.fn(),
    disconnect: vi.fn(),
    devices: [],
  })),
}));

describe('useMqtt', () => {
  it('should return connection status', () => {
    const { result } = renderHook(() => useMqtt());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionState).toBe('connected');
  });

  it('should return broker info', () => {
    const { result } = renderHook(() => useMqtt());

    expect(result.current.brokerType).toBe('cloud');
    expect(result.current.brokerUrl).toBe('wss://test.broker:8883');
  });

  it('should return connectedAt timestamp', () => {
    const { result } = renderHook(() => useMqtt());

    expect(result.current.connectedAt).toBeInstanceOf(Date);
  });

  it('should return null error when connected', () => {
    const { result } = renderHook(() => useMqtt());

    expect(result.current.error).toBeNull();
  });

  it('should return reconnect function', () => {
    const { result } = renderHook(() => useMqtt());

    expect(typeof result.current.reconnect).toBe('function');
  });

  it('should return disconnect function', () => {
    const { result } = renderHook(() => useMqtt());

    expect(typeof result.current.disconnect).toBe('function');
  });

  it('should return devices array', () => {
    const { result } = renderHook(() => useMqtt());

    expect(Array.isArray(result.current.devices)).toBe(true);
  });
});
