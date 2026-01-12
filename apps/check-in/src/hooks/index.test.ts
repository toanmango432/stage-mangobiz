import { describe, it, expect } from 'vitest';
import * as hooks from './index';

describe('hooks barrel exports', () => {
  it('should export useAppDispatch', () => {
    expect(hooks.useAppDispatch).toBeDefined();
    expect(typeof hooks.useAppDispatch).toBe('function');
  });

  it('should export useAppSelector', () => {
    expect(hooks.useAppSelector).toBeDefined();
    expect(typeof hooks.useAppSelector).toBe('function');
  });

  it('should export useTechnicianMqtt', () => {
    expect(hooks.useTechnicianMqtt).toBeDefined();
    expect(typeof hooks.useTechnicianMqtt).toBe('function');
  });

  it('should export useQueueMqtt', () => {
    expect(hooks.useQueueMqtt).toBeDefined();
    expect(typeof hooks.useQueueMqtt).toBe('function');
  });

  it('should export useCalledMqtt', () => {
    expect(hooks.useCalledMqtt).toBeDefined();
    expect(typeof hooks.useCalledMqtt).toBe('function');
  });

  it('should export useOfflineSync', () => {
    expect(hooks.useOfflineSync).toBeDefined();
    expect(typeof hooks.useOfflineSync).toBe('function');
  });

  it('should export useAnalytics', () => {
    expect(hooks.useAnalytics).toBeDefined();
    expect(typeof hooks.useAnalytics).toBe('function');
  });

  it('should export useAccessibility', () => {
    expect(hooks.useAccessibility).toBeDefined();
    expect(typeof hooks.useAccessibility).toBe('function');
  });
});
