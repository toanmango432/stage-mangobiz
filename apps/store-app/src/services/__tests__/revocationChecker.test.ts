/**
 * Revocation Checker Tests
 *
 * Tests for device revocation checking and data clearing.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearLocalData, hasPendingData } from '../revocationChecker';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock indexedDB
const mockIndexedDB = {
  databases: vi.fn().mockResolvedValue([]),
  deleteDatabase: vi.fn(),
  open: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', { value: mockIndexedDB });

// Mock caches
const mockCaches = {
  keys: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(true),
};

Object.defineProperty(window, 'caches', { value: mockCaches });

// Note: RevocationChecker tests that require mocking devicesDB are complex
// due to module resolution. We test the utility functions directly.
// Integration tests should cover the full revocation flow.

describe('clearLocalData', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should clear localStorage but preserve device ID', async () => {
    localStorageMock.setItem('mango_device_id', 'test-device-123');
    localStorageMock.setItem('other_data', 'should be cleared');

    await clearLocalData();

    expect(localStorageMock.getItem('mango_device_id')).toBe('test-device-123');
    expect(localStorageMock.getItem('other_data')).toBeNull();
  });

  it('should clear sessionStorage', async () => {
    sessionStorageMock.setItem('session_data', 'test');

    await clearLocalData();

    expect(sessionStorageMock.getItem('session_data')).toBeNull();
  });

  it('should attempt to clear IndexedDB databases', async () => {
    mockIndexedDB.databases.mockResolvedValue([
      { name: 'mango_db', version: 1 },
      { name: 'other_db', version: 1 },
    ]);

    await clearLocalData();

    expect(mockIndexedDB.databases).toHaveBeenCalled();
  });

  it('should attempt to clear caches', async () => {
    mockCaches.keys.mockResolvedValue(['cache1', 'cache2']);

    await clearLocalData();

    expect(mockCaches.keys).toHaveBeenCalled();
  });
});

describe('hasPendingData', () => {
  it('should return false when no database exists', async () => {
    mockIndexedDB.open.mockImplementation(() => {
      const request = {
        onerror: null as ((event: any) => void) | null,
        onsuccess: null as ((event: any) => void) | null,
        result: null,
      };
      setTimeout(() => {
        if (request.onerror) {
          request.onerror(new Error('No database'));
        }
      }, 0);
      return request;
    });

    const result = await hasPendingData();

    expect(result).toEqual({ hasPending: false, count: 0 });
  });
});
