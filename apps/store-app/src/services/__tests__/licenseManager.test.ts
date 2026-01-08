/**
 * License Manager Tests
 *
 * Tests for license validation, activation, and status management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock secureStorage
vi.mock('../secureStorage', () => ({
  secureStorage: {
    getLicenseKey: vi.fn(),
    setLicenseKey: vi.fn(),
    getStoreId: vi.fn(),
    setStoreId: vi.fn(),
    getTier: vi.fn(),
    setTier: vi.fn(),
    getLastValidation: vi.fn(),
    setLastValidation: vi.fn(),
    getDefaults: vi.fn(),
    setDefaults: vi.fn(),
    clearLicenseData: vi.fn(),
  },
}));

// Mock licenseApi
vi.mock('../../api/licenseApi', () => ({
  validateLicense: vi.fn(),
  isLicenseDeactivated: vi.fn().mockReturnValue(false),
  checkVersionRequirement: vi.fn().mockReturnValue(true),
}));

import { secureStorage } from '../secureStorage';
import { validateLicense, isLicenseDeactivated, checkVersionRequirement } from '../../api/licenseApi';

describe('LicenseManager', () => {
  let licenseManager: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset all mocks to default behavior
    vi.mocked(secureStorage.getLicenseKey).mockResolvedValue(null);
    vi.mocked(secureStorage.getStoreId).mockResolvedValue(null);
    vi.mocked(secureStorage.getTier).mockResolvedValue(null);
    vi.mocked(secureStorage.getLastValidation).mockResolvedValue(null);
    vi.mocked(validateLicense).mockResolvedValue({
      valid: true,
      storeId: 'store-123',
      tier: 'premium',
    });
    vi.mocked(isLicenseDeactivated).mockReturnValue(false);
    vi.mocked(checkVersionRequirement).mockReturnValue(true);

    // Reset module cache and re-import
    vi.resetModules();

    const module = await import('../licenseManager');
    licenseManager = module.licenseManager;
  });

  describe('initialize', () => {
    it('should return not_activated when no license key exists', async () => {
      vi.mocked(secureStorage.getLicenseKey).mockResolvedValue(null);

      const state = await licenseManager.initialize();

      expect(state.status).toBe('not_activated');
      expect(state.message).toContain('activate');
    });

    it('should validate license when key exists', async () => {
      vi.mocked(secureStorage.getLicenseKey).mockResolvedValue('test-license-key');
      vi.mocked(validateLicense).mockResolvedValue({
        valid: true,
        storeId: 'store-123',
        tier: 'premium',
      });

      const state = await licenseManager.initialize();

      expect(validateLicense).toHaveBeenCalledWith('test-license-key', expect.any(String));
      expect(state.status).toBe('active');
    });
  });

  describe('checkLicense', () => {
    it('should return not_activated when no license key provided', async () => {
      vi.mocked(secureStorage.getLicenseKey).mockResolvedValue(null);

      const state = await licenseManager.checkLicense();

      expect(state.status).toBe('not_activated');
    });

    it('should return active for valid license', async () => {
      vi.mocked(validateLicense).mockResolvedValue({
        valid: true,
        storeId: 'store-123',
        tier: 'premium',
      });

      const state = await licenseManager.checkLicense('valid-key');

      expect(state.status).toBe('active');
      expect(state.storeId).toBe('store-123');
      expect(state.tier).toBe('premium');
    });

    it('should save storeId and tier on successful validation', async () => {
      vi.mocked(validateLicense).mockResolvedValue({
        valid: true,
        storeId: 'store-456',
        tier: 'basic',
      });

      await licenseManager.checkLicense('valid-key');

      expect(secureStorage.setStoreId).toHaveBeenCalledWith('store-456');
      expect(secureStorage.setTier).toHaveBeenCalledWith('basic');
      expect(secureStorage.setLastValidation).toHaveBeenCalled();
    });

    it('should return deactivated when license is revoked', async () => {
      vi.mocked(validateLicense).mockResolvedValue({
        valid: false,
        message: 'License revoked',
      });
      vi.mocked(isLicenseDeactivated).mockReturnValue(true);

      const state = await licenseManager.checkLicense('revoked-key');

      expect(state.status).toBe('deactivated');
      expect(secureStorage.clearLicenseData).toHaveBeenCalled();
    });

    it('should return version_mismatch when app is outdated', async () => {
      vi.mocked(validateLicense).mockResolvedValue({
        valid: true,
        requiredVersion: '2.0.0',
      });
      vi.mocked(checkVersionRequirement).mockReturnValue(false);

      const state = await licenseManager.checkLicense('valid-key');

      expect(state.status).toBe('version_mismatch');
      expect(state.requiresUpdate).toBe(true);
    });
  });

  describe('activate', () => {
    it('should save license key and validate', async () => {
      vi.mocked(validateLicense).mockResolvedValue({
        valid: true,
        storeId: 'store-123',
        tier: 'premium',
      });

      const state = await licenseManager.activate('new-license-key');

      expect(secureStorage.setLicenseKey).toHaveBeenCalledWith('new-license-key');
      expect(validateLicense).toHaveBeenCalled();
      expect(state.status).toBe('active');
    });
  });

  describe('deactivate', () => {
    it('should clear license data', async () => {
      await licenseManager.deactivate();

      expect(secureStorage.clearLicenseData).toHaveBeenCalled();
    });

    it('should update state to not_activated', async () => {
      await licenseManager.deactivate();

      const state = licenseManager.getState();
      expect(state.status).toBe('not_activated');
    });
  });

  describe('getState', () => {
    it('should return current license state', () => {
      const state = licenseManager.getState();

      expect(state).toHaveProperty('status');
    });
  });

  describe('subscribe', () => {
    it('should add listener and return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = licenseManager.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call listener when state changes', async () => {
      const listener = vi.fn();
      licenseManager.subscribe(listener);

      vi.mocked(secureStorage.getLicenseKey).mockResolvedValue(null);
      await licenseManager.initialize();

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('state checking', () => {
    it('should have active status after successful validation', async () => {
      vi.mocked(validateLicense).mockResolvedValue({
        valid: true,
        storeId: 'store-123',
      });

      const state = await licenseManager.checkLicense('valid-key');

      expect(state.status).toBe('active');
    });

    it('should have not_activated status when no license', async () => {
      vi.mocked(secureStorage.getLicenseKey).mockResolvedValue(null);
      const state = await licenseManager.initialize();

      expect(state.status).toBe('not_activated');
    });
  });
});
