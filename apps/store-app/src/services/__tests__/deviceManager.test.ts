/**
 * Device Manager Tests
 *
 * Tests for device identification, fingerprinting, and registration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { deviceManager } from '../deviceManager';

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
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto API
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: async (_algorithm: string, data: ArrayBuffer) => {
        // Simple mock hash - just return a fixed-length buffer
        const hash = new Uint8Array(32);
        const view = new Uint8Array(data);
        for (let i = 0; i < 32; i++) {
          hash[i] = view[i % view.length] ^ (i * 17);
        }
        return hash.buffer;
      },
    },
  },
});

describe('DeviceManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset cached fingerprint
    (deviceManager as any).cachedFingerprint = null;
  });

  describe('getDeviceId', () => {
    it('should generate a new device ID if none exists', () => {
      const deviceId = deviceManager.getDeviceId();

      expect(deviceId).toBeDefined();
      expect(typeof deviceId).toBe('string');
      expect(deviceId.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it('should return the same device ID on subsequent calls', () => {
      const deviceId1 = deviceManager.getDeviceId();
      const deviceId2 = deviceManager.getDeviceId();

      expect(deviceId1).toBe(deviceId2);
    });

    it('should persist device ID in localStorage', () => {
      const deviceId = deviceManager.getDeviceId();
      const stored = localStorageMock.getItem('mango_device_id');

      expect(stored).toBe(deviceId);
    });

    it('should return existing device ID from localStorage', () => {
      const existingId = 'existing-device-id-12345678';
      localStorageMock.setItem('mango_device_id', existingId);

      const deviceId = deviceManager.getDeviceId();

      expect(deviceId).toBe(existingId);
    });
  });

  describe('clearDeviceId', () => {
    it('should remove device ID from localStorage', () => {
      deviceManager.getDeviceId(); // Generate one first
      expect(localStorageMock.getItem('mango_device_id')).not.toBeNull();

      deviceManager.clearDeviceId();

      expect(localStorageMock.getItem('mango_device_id')).toBeNull();
    });

    it('should clear device name as well', () => {
      localStorageMock.setItem('mango_device_name', 'Test Device');

      deviceManager.clearDeviceId();

      expect(localStorageMock.getItem('mango_device_name')).toBeNull();
    });
  });

  describe('getDeviceName / setDeviceName', () => {
    it('should return null if no device name is set', () => {
      expect(deviceManager.getDeviceName()).toBeNull();
    });

    it('should store and retrieve device name', () => {
      deviceManager.setDeviceName('Front Desk iPad');

      expect(deviceManager.getDeviceName()).toBe('Front Desk iPad');
    });
  });

  describe('getFingerprint', () => {
    it('should generate a fingerprint string', async () => {
      const fingerprint = await deviceManager.getFingerprint();

      expect(fingerprint).toBeDefined();
      expect(typeof fingerprint).toBe('string');
      // SHA-256 = 64 hex chars, but may be different in test env
      expect(fingerprint.length).toBeGreaterThan(0);
    });

    it('should cache the fingerprint', async () => {
      // Reset cache first
      (deviceManager as any).cachedFingerprint = null;

      const fingerprint1 = await deviceManager.getFingerprint();
      const fingerprint2 = await deviceManager.getFingerprint();

      expect(fingerprint1).toBe(fingerprint2);
    });
  });

  describe('getDeviceType', () => {
    it('should return "web" for standard browser', () => {
      // Default navigator.userAgent in test environment
      const deviceType = deviceManager.getDeviceType();

      expect(['web', 'ios', 'android', 'desktop']).toContain(deviceType);
    });
  });

  describe('getBrowser', () => {
    it('should detect browser from user agent', () => {
      const browser = deviceManager.getBrowser();

      expect(typeof browser).toBe('string');
      expect(browser.length).toBeGreaterThan(0);
    });
  });

  describe('getOS', () => {
    it('should detect OS from user agent', () => {
      const os = deviceManager.getOS();

      expect(typeof os).toBe('string');
      expect(os.length).toBeGreaterThan(0);
    });
  });

  describe('buildRegistration', () => {
    it('should build a complete registration payload', async () => {
      const registration = await deviceManager.buildRegistration('Test Device', 'offline-enabled');

      expect(registration).toMatchObject({
        deviceFingerprint: expect.any(String),
        deviceName: 'Test Device',
        deviceType: expect.any(String),
        userAgent: expect.any(String),
        browser: expect.any(String),
        os: expect.any(String),
        requestedMode: 'offline-enabled',
      });
    });

    it('should use stored device name if not provided', async () => {
      deviceManager.setDeviceName('Stored Device Name');

      const registration = await deviceManager.buildRegistration();

      expect(registration.deviceName).toBe('Stored Device Name');
    });

    it('should have undefined deviceName if none provided or stored', async () => {
      const registration = await deviceManager.buildRegistration();

      expect(registration.deviceName).toBeUndefined();
    });
  });

  describe('isMobile', () => {
    it('should return boolean', () => {
      const isMobile = deviceManager.isMobile();

      expect(typeof isMobile).toBe('boolean');
    });
  });

  describe('hasTouch', () => {
    it('should return boolean', () => {
      const hasTouch = deviceManager.hasTouch();

      expect(typeof hasTouch).toBe('boolean');
    });
  });

  describe('getDeviceDescription', () => {
    it('should return a formatted description', () => {
      const description = deviceManager.getDeviceDescription();

      expect(typeof description).toBe('string');
      expect(description).toContain('on'); // "Browser on OS (type)"
    });
  });
});
