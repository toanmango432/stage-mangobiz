import { describe, it, expect } from 'vitest';
import * as providers from './index';

describe('providers barrel exports', () => {
  it('should export CheckInMqttProvider', () => {
    expect(providers.CheckInMqttProvider).toBeDefined();
    expect(typeof providers.CheckInMqttProvider).toBe('function');
  });

  it('should export useMqtt', () => {
    expect(providers.useMqtt).toBeDefined();
    expect(typeof providers.useMqtt).toBe('function');
  });

  it('should export useMqttOptional', () => {
    expect(providers.useMqttOptional).toBeDefined();
    expect(typeof providers.useMqttOptional).toBe('function');
  });
});
