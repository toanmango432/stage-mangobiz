/**
 * Revocation Checker Service
 *
 * Periodically checks if the current device has been revoked.
 * If revoked, clears local data and logs out the user.
 */

import { devicesDB } from './devicesDB';
import type { DeviceCheckResponse } from '@/types/device';

// Event types for revocation
export type RevocationEventType = 'revoked' | 'blocked' | 'not_found';

export interface RevocationEvent {
  type: RevocationEventType;
  reason: string;
  message: string;
}

type RevocationCallback = (event: RevocationEvent) => void;

/**
 * Periodically checks if device has been revoked.
 */
class RevocationChecker {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private checkInterval = 5 * 60 * 1000; // 5 minutes
  private deviceId: string | null = null;
  private callbacks: Set<RevocationCallback> = new Set();
  private isChecking = false;

  // ==================== LIFECYCLE ====================

  /**
   * Start periodic revocation checks.
   */
  start(deviceId: string): void {
    this.deviceId = deviceId;
    this.stop(); // Clear any existing interval

    console.log('[RevocationChecker] Starting with device:', deviceId);

    // Check immediately
    this.check();

    // Then check periodically
    this.intervalId = setInterval(() => this.check(), this.checkInterval);
  }

  /**
   * Stop periodic checks.
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.deviceId = null;
    console.log('[RevocationChecker] Stopped');
  }

  /**
   * Check if currently running.
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }

  // ==================== CHECK LOGIC ====================

  /**
   * Perform a revocation check.
   */
  async check(): Promise<DeviceCheckResponse> {
    if (!this.deviceId || this.isChecking) {
      return { valid: true };
    }

    this.isChecking = true;

    try {
      const response = await devicesDB.checkDevice(this.deviceId);

      if (!response.valid) {
        console.log('[RevocationChecker] Device invalid:', response);
        await this.handleRevocation(response);
      }

      return response;
    } catch (error) {
      // Network error - continue with grace period
      console.warn('[RevocationChecker] Check failed (network?):', error);
      return { valid: true }; // Assume valid on network error
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Force an immediate check (useful after reconnecting).
   */
  async forceCheck(): Promise<DeviceCheckResponse> {
    return this.check();
  }

  // ==================== REVOCATION HANDLING ====================

  /**
   * Handle device revocation.
   */
  private async handleRevocation(response: DeviceCheckResponse): Promise<void> {
    this.stop();

    const event: RevocationEvent = {
      type: (response.reason as RevocationEventType) || 'revoked',
      reason: response.reason || 'revoked',
      message: response.message || 'Device access has been revoked',
    };

    console.log('[RevocationChecker] Handling revocation:', event);

    // Notify all callbacks
    this.callbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[RevocationChecker] Callback error:', error);
      }
    });
  }

  // ==================== EVENT HANDLING ====================

  /**
   * Subscribe to revocation events.
   */
  onRevocation(callback: RevocationCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Clear all callbacks.
   */
  clearCallbacks(): void {
    this.callbacks.clear();
  }

  // ==================== CONFIGURATION ====================

  /**
   * Set check interval (in milliseconds).
   */
  setCheckInterval(ms: number): void {
    this.checkInterval = ms;

    // Restart if running
    if (this.deviceId && this.intervalId) {
      this.stop();
      this.start(this.deviceId);
    }
  }

  /**
   * Get current check interval.
   */
  getCheckInterval(): number {
    return this.checkInterval;
  }
}

// Export singleton instance
export const revocationChecker = new RevocationChecker();

// ==================== UTILITY FUNCTIONS ====================

/**
 * Clear all local data from the device.
 * Used when switching to online-only mode or on revocation.
 */
export async function clearLocalData(): Promise<void> {
  console.log('[clearLocalData] Clearing all local data...');

  // 1. Clear IndexedDB
  try {
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        console.log('[clearLocalData] Deleting IndexedDB:', db.name);
        indexedDB.deleteDatabase(db.name);
      }
    }
  } catch (error) {
    console.warn('[clearLocalData] Failed to clear IndexedDB:', error);
  }

  // 2. Clear localStorage (preserve device ID for tracking)
  const deviceId = localStorage.getItem('mango_device_id');
  localStorage.clear();
  if (deviceId) {
    localStorage.setItem('mango_device_id', deviceId);
  }

  // 3. Clear sessionStorage
  sessionStorage.clear();

  // 4. Clear service worker cache
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      console.log('[clearLocalData] Cleared caches:', keys);
    } catch (error) {
      console.warn('[clearLocalData] Failed to clear caches:', error);
    }
  }

  // 5. Unregister service workers
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
      console.log('[clearLocalData] Unregistered service workers:', registrations.length);
    } catch (error) {
      console.warn('[clearLocalData] Failed to unregister service workers:', error);
    }
  }

  console.log('[clearLocalData] Complete');
}

/**
 * Check if there's pending data that hasn't been synced.
 * Used to warn users before clearing data.
 */
export async function hasPendingData(): Promise<{ hasPending: boolean; count: number }> {
  try {
    // Try to open the database and check sync queue
    const dbRequest = indexedDB.open('mango_biz_store_app');

    return new Promise((resolve) => {
      dbRequest.onerror = () => {
        resolve({ hasPending: false, count: 0 });
      };

      dbRequest.onsuccess = () => {
        const db = dbRequest.result;

        // Check if syncQueue store exists
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.close();
          resolve({ hasPending: false, count: 0 });
          return;
        }

        const tx = db.transaction('syncQueue', 'readonly');
        const store = tx.objectStore('syncQueue');
        const countRequest = store.count();

        countRequest.onsuccess = () => {
          const count = countRequest.result;
          db.close();
          resolve({ hasPending: count > 0, count });
        };

        countRequest.onerror = () => {
          db.close();
          resolve({ hasPending: false, count: 0 });
        };
      };
    });
  } catch (error) {
    console.warn('[hasPendingData] Error checking pending data:', error);
    return { hasPending: false, count: 0 };
  }
}
