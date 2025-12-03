/**
 * Front Desk Settings Storage Service
 *
 * Manages per-user/per-store settings storage in IndexedDB.
 * Settings are keyed by user or store ID depending on login mode.
 *
 * Key Structure:
 * - User login mode: `frontDeskSettings_user_${memberId}`
 * - Store login mode: `frontDeskSettings_store_${storeId}`
 * - Fallback: `frontDeskSettings_default`
 */

import { db } from '../db/database';
import { storeAuthManager } from './storeAuthManager';
import { FrontDeskSettingsData } from '../components/frontdesk-settings/types';
import { defaultFrontDeskSettings } from '../components/frontdesk-settings/constants';
// ISSUE-003: Use centralized error handling
import { handleSettingsError } from '../utils/settingsErrorHandler';

// Storage key prefix
const SETTINGS_KEY_PREFIX = 'frontDeskSettings';
const LEGACY_LOCALSTORAGE_KEY = 'frontDeskSettings';

// Schema version for migrations
const SETTINGS_SCHEMA_VERSION = 1;

interface StoredFrontDeskSettings {
  version: number;
  data: FrontDeskSettingsData;
  updatedAt: number;
}

/**
 * Get the appropriate settings key based on current auth state
 */
export function getSettingsKey(): string {
  const authState = storeAuthManager.getState();

  if (authState.member?.memberId) {
    // User login mode - per user settings
    return `${SETTINGS_KEY_PREFIX}_user_${authState.member.memberId}`;
  } else if (authState.store?.storeId) {
    // Store login mode - per store settings
    return `${SETTINGS_KEY_PREFIX}_store_${authState.store.storeId}`;
  }

  // Fallback (shouldn't happen in normal operation)
  return `${SETTINGS_KEY_PREFIX}_default`;
}

/**
 * Load settings from IndexedDB for the current user/store
 */
export async function loadSettings(): Promise<FrontDeskSettingsData> {
  const key = getSettingsKey();

  try {
    // Try to load from IndexedDB
    const stored = await db.settings.get(key);

    if (stored?.value) {
      const settings = stored.value as StoredFrontDeskSettings;
      console.log(`✅ Loaded front desk settings from IndexedDB (key: ${key})`);
      return migrateSettings(settings);
    }

    // No settings found - try to migrate from localStorage
    const migrated = await migrateFromLocalStorage(key);
    if (migrated) {
      console.log(`✅ Migrated front desk settings from localStorage to IndexedDB (key: ${key})`);
      return migrated;
    }

    // No settings found anywhere - return defaults
    console.log(`ℹ️ No front desk settings found, using defaults (key: ${key})`);
    return { ...defaultFrontDeskSettings };

  } catch (error) {
    // ISSUE-003: Use centralized error handling
    handleSettingsError('load', error, `key: ${key}`);
    return { ...defaultFrontDeskSettings };
  }
}

/**
 * Save settings to IndexedDB for the current user/store
 */
export async function saveSettings(settings: FrontDeskSettingsData): Promise<boolean> {
  const key = getSettingsKey();

  try {
    const stored: StoredFrontDeskSettings = {
      version: SETTINGS_SCHEMA_VERSION,
      data: settings,
      updatedAt: Date.now()
    };

    await db.settings.put({
      key,
      value: stored
    });

    console.log(`✅ Saved front desk settings to IndexedDB (key: ${key})`);

    // Dispatch storage event for cross-tab sync
    dispatchSettingsChangedEvent(key, settings);

    return true;
  } catch (error) {
    // ISSUE-003: Use centralized error handling
    // Check for quota exceeded
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      handleSettingsError('save', error, 'IndexedDB quota exceeded');
      dispatchStorageErrorEvent('quota_exceeded');
    } else {
      handleSettingsError('save', error, `key: ${key}`);
    }

    return false;
  }
}

/**
 * Migrate settings from old localStorage format to IndexedDB
 */
async function migrateFromLocalStorage(newKey: string): Promise<FrontDeskSettingsData | null> {
  try {
    const legacyData = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);

    if (!legacyData) {
      return null;
    }

    // Parse legacy data
    let settings: FrontDeskSettingsData;
    const parsed = JSON.parse(legacyData);

    // Handle versioned format
    if (parsed.version && parsed.data) {
      settings = parsed.data;
    } else {
      // Old unversioned format
      settings = parsed;
    }

    // Validate and merge with defaults
    settings = {
      ...defaultFrontDeskSettings,
      ...settings
    };

    // Save to IndexedDB
    const stored: StoredFrontDeskSettings = {
      version: SETTINGS_SCHEMA_VERSION,
      data: settings,
      updatedAt: Date.now()
    };

    await db.settings.put({
      key: newKey,
      value: stored
    });

    // Clear old localStorage (optional - keep for backup during transition)
    // localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY);
    console.log('✅ Migrated settings from localStorage to IndexedDB');

    return settings;

  } catch (error) {
    // ISSUE-003: Use centralized error handling
    handleSettingsError('migration', error, 'localStorage to IndexedDB');
    return null;
  }
}

/**
 * Migrate settings between schema versions
 */
function migrateSettings(stored: StoredFrontDeskSettings): FrontDeskSettingsData {
  const settings = stored.data;
  // const version = stored.version || 0;

  // Future migrations would go here
  // if (version < 2) {
  //   settings = migrateV1toV2(settings);
  //   version = 2;
  // }

  // Merge with defaults to ensure all fields exist
  return {
    ...defaultFrontDeskSettings,
    ...settings
  };
}

/**
 * Dispatch custom event for cross-tab synchronization
 */
function dispatchSettingsChangedEvent(key: string, settings: FrontDeskSettingsData): void {
  // Use BroadcastChannel for cross-tab communication (more reliable than storage events for IndexedDB)
  try {
    const channel = new BroadcastChannel('frontDeskSettings');
    channel.postMessage({
      type: 'settings_changed',
      key,
      settings,
      timestamp: Date.now()
    });
    channel.close();
  } catch (error) {
    // BroadcastChannel not supported - fall back to custom event
    window.dispatchEvent(new CustomEvent('frontDeskSettingsChanged', {
      detail: { key, settings }
    }));
  }
}

/**
 * Dispatch storage error event
 */
function dispatchStorageErrorEvent(errorType: 'quota_exceeded' | 'write_error'): void {
  window.dispatchEvent(new CustomEvent('frontDeskSettingsError', {
    detail: { errorType }
  }));
}

/**
 * Subscribe to settings changes from other tabs
 */
export function subscribeToSettingsChanges(
  callback: (settings: FrontDeskSettingsData) => void
): () => void {
  const currentKey = getSettingsKey();

  // Try BroadcastChannel first
  let channel: BroadcastChannel | null = null;

  try {
    channel = new BroadcastChannel('frontDeskSettings');
    channel.onmessage = (event) => {
      if (event.data.type === 'settings_changed' && event.data.key === currentKey) {
        console.log('📡 Received settings update from another tab');
        callback(event.data.settings);
      }
    };
  } catch (error) {
    // BroadcastChannel not supported - fall back to custom event
    const handleEvent = (event: CustomEvent) => {
      if (event.detail.key === currentKey) {
        callback(event.detail.settings);
      }
    };

    window.addEventListener('frontDeskSettingsChanged', handleEvent as EventListener);

    return () => {
      window.removeEventListener('frontDeskSettingsChanged', handleEvent as EventListener);
    };
  }

  // Return unsubscribe function
  return () => {
    if (channel) {
      channel.close();
    }
  };
}

/**
 * Clear settings for the current user/store (useful for logout)
 */
export async function clearSettings(): Promise<void> {
  const key = getSettingsKey();

  try {
    await db.settings.delete(key);
    console.log(`✅ Cleared front desk settings (key: ${key})`);
  } catch (error) {
    // ISSUE-003: Use centralized error handling
    handleSettingsError('save', error, `clear settings key: ${key}`);
  }
}

/**
 * Check if settings exist for the current user/store
 */
export async function hasSettings(): Promise<boolean> {
  const key = getSettingsKey();

  try {
    const stored = await db.settings.get(key);
    return !!stored?.value;
  } catch (error) {
    return false;
  }
}
