/**
 * Unit Tests for frontDeskSettingsStorage
 *
 * Tests cover:
 * - Settings key generation based on auth state
 * - Loading settings from IndexedDB
 * - Saving settings to IndexedDB
 * - Clearing settings
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { defaultFrontDeskSettings } from '../../components/frontdesk-settings/constants';

// Create mock for storeAuthManager before imports
const mockGetState = vi.fn();

vi.mock('../storeAuthManager', () => ({
  storeAuthManager: {
    getState: () => mockGetState(),
  },
}));

// Import after mocks are set up
import {
  getSettingsKey,
  loadSettings,
  saveSettings,
  clearSettings,
  hasSettings,
} from '../frontDeskSettingsStorage';
import { db } from '../../db/database';

describe('frontDeskSettingsStorage', () => {
  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Clear the database before each test
    try {
      await db.settings.clear();
    } catch {
      // Database might not be open yet, that's ok
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSettingsKey', () => {
    // TEST-010: getSettingsKey - returns user key when member logged in
    it('should return user key when member is logged in', () => {
      mockGetState.mockReturnValue({
        member: { memberId: 'user-123' },
        store: { storeId: 'store-456' },
      });

      const key = getSettingsKey();
      expect(key).toBe('frontDeskSettings_user_user-123');
    });

    // TEST-011: getSettingsKey - returns store key when only store logged in
    it('should return store key when only store is logged in', () => {
      mockGetState.mockReturnValue({
        member: null,
        store: { storeId: 'store-456' },
      });

      const key = getSettingsKey();
      expect(key).toBe('frontDeskSettings_store_store-456');
    });

    it('should return default key when neither member nor store is logged in', () => {
      mockGetState.mockReturnValue({
        member: null,
        store: null,
      });

      const key = getSettingsKey();
      expect(key).toBe('frontDeskSettings_default');
    });

    it('should prioritize member key over store key', () => {
      mockGetState.mockReturnValue({
        member: { memberId: 'user-123' },
        store: { storeId: 'store-456' },
      });

      const key = getSettingsKey();
      expect(key).toContain('user');
      expect(key).not.toContain('store');
    });
  });

  describe('loadSettings', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        member: { memberId: 'test-user' },
        store: null,
      });
    });

    // TEST-012: loadSettings - returns defaults when no settings exist
    it('should return default settings when no settings exist in IndexedDB', async () => {
      const settings = await loadSettings();

      expect(settings).toEqual(defaultFrontDeskSettings);
    });

    // TEST-014: loadSettings - retrieves previously saved settings
    it('should retrieve previously saved settings', async () => {
      const customSettings = {
        ...defaultFrontDeskSettings,
        sortBy: 'time' as const,
        viewStyle: 'compact' as const,
      };

      // Save settings first
      await saveSettings(customSettings);

      // Load and verify
      const loadedSettings = await loadSettings();
      expect(loadedSettings.sortBy).toBe('time');
      expect(loadedSettings.viewStyle).toBe('compact');
    });

    it('should merge loaded settings with defaults for missing fields', async () => {
      // Manually insert partial settings (simulating old schema)
      const key = getSettingsKey();
      await db.settings.put({
        key,
        value: {
          version: 1,
          data: { sortBy: 'time' }, // Partial settings
          updatedAt: Date.now(),
        },
      });

      const settings = await loadSettings();

      // Should have the saved value
      expect(settings.sortBy).toBe('time');
      // Should have defaults for other fields
      expect(settings.viewStyle).toBe(defaultFrontDeskSettings.viewStyle);
      expect(settings.displayMode).toBe(defaultFrontDeskSettings.displayMode);
    });
  });

  describe('saveSettings', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        member: { memberId: 'test-user' },
        store: null,
      });
    });

    // TEST-013: saveSettings - persists settings to IndexedDB
    it('should persist settings to IndexedDB', async () => {
      const customSettings = {
        ...defaultFrontDeskSettings,
        sortBy: 'time' as const,
        operationTemplate: 'teamInOut' as const,
      };

      const result = await saveSettings(customSettings);

      expect(result).toBe(true);

      // Verify by loading
      const loaded = await loadSettings();
      expect(loaded.sortBy).toBe('time');
      expect(loaded.operationTemplate).toBe('teamInOut');
    });

    it('should return true on successful save', async () => {
      const result = await saveSettings(defaultFrontDeskSettings);
      expect(result).toBe(true);
    });

    it('should update existing settings when saving again', async () => {
      // First save
      await saveSettings({
        ...defaultFrontDeskSettings,
        sortBy: 'time' as const,
      });

      // Second save with different value
      await saveSettings({
        ...defaultFrontDeskSettings,
        sortBy: 'queue' as const,
      });

      // Verify only the latest value exists
      const loaded = await loadSettings();
      expect(loaded.sortBy).toBe('queue');
    });
  });

  describe('clearSettings', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        member: { memberId: 'test-user' },
        store: null,
      });
    });

    // TEST-015: clearSettings - removes settings from IndexedDB
    it('should remove settings from IndexedDB', async () => {
      // Save settings first
      await saveSettings(defaultFrontDeskSettings);

      // Verify they exist
      expect(await hasSettings()).toBe(true);

      // Clear settings
      await clearSettings();

      // Verify they're gone
      expect(await hasSettings()).toBe(false);
    });

    it('should not throw when clearing non-existent settings', async () => {
      // Should not throw
      await expect(clearSettings()).resolves.not.toThrow();
    });
  });

  describe('hasSettings', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        member: { memberId: 'test-user' },
        store: null,
      });
    });

    it('should return false when no settings exist', async () => {
      const exists = await hasSettings();
      expect(exists).toBe(false);
    });

    it('should return true after saving settings', async () => {
      await saveSettings(defaultFrontDeskSettings);
      const exists = await hasSettings();
      expect(exists).toBe(true);
    });

    it('should return false after clearing settings', async () => {
      await saveSettings(defaultFrontDeskSettings);
      await clearSettings();
      const exists = await hasSettings();
      expect(exists).toBe(false);
    });
  });

  describe('Per-User Isolation', () => {
    it('should maintain separate settings for different users', async () => {
      // User 1 saves settings
      mockGetState.mockReturnValue({
        member: { memberId: 'user-1' },
        store: null,
      });
      await saveSettings({
        ...defaultFrontDeskSettings,
        sortBy: 'time' as const,
      });

      // User 2 saves different settings
      mockGetState.mockReturnValue({
        member: { memberId: 'user-2' },
        store: null,
      });
      await saveSettings({
        ...defaultFrontDeskSettings,
        sortBy: 'queue' as const,
      });

      // Verify user 1 still has their settings
      mockGetState.mockReturnValue({
        member: { memberId: 'user-1' },
        store: null,
      });
      const user1Settings = await loadSettings();
      expect(user1Settings.sortBy).toBe('time');

      // Verify user 2 has their settings
      mockGetState.mockReturnValue({
        member: { memberId: 'user-2' },
        store: null,
      });
      const user2Settings = await loadSettings();
      expect(user2Settings.sortBy).toBe('queue');
    });
  });
});
