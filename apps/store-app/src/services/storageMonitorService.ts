/**
 * Storage Monitor Service
 * LOCAL-FIRST: Monitors IndexedDB storage usage and quota
 *
 * Platform Storage Limits:
 * - Chrome Desktop: 60% of disk (~100GB+)
 * - Chrome Mobile: 60% of disk (~2-6GB)
 * - Safari Desktop: 80% of disk
 * - Safari iOS: 80% of disk (but may be evicted after 7 days of no use)
 * - PWA (Add to Home): Full quota, exempt from Safari eviction
 *
 * See: docs/architecture/DATA_STORAGE_STRATEGY.md
 */

import { db } from '@/db/schema';

// ==================== TYPES ====================

export type StorageWarningLevel = 'ok' | 'warning' | 'critical';

export interface StorageMetrics {
  usedBytes: number;
  quotaBytes: number;
  usagePercent: number;
  byTable: Record<string, TableStorageInfo>;
  warningLevel: StorageWarningLevel;
  isPersisted: boolean;
  formattedUsed: string;
  formattedQuota: string;
}

export interface TableStorageInfo {
  count: number;
  estimatedBytes: number;
  formattedSize: string;
}

export interface StorageRecommendation {
  level: StorageWarningLevel;
  message: string;
  action?: string;
}

// ==================== CONSTANTS ====================

const WARNING_THRESHOLD = 70; // % usage to trigger warning
const CRITICAL_THRESHOLD = 90; // % usage to trigger critical warning

// Estimated average record sizes (bytes)
const AVG_RECORD_SIZES: Record<string, number> = {
  tickets: 3000,
  transactions: 1000,
  appointments: 2000,
  clients: 2000,
  staff: 1000,
  services: 1000,
  syncOperations: 500,
  formResponses: 5000,
  timesheets: 500,
};

// ==================== SERVICE ====================

class StorageMonitorService {
  private lastMetrics: StorageMetrics | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Get current storage metrics
   */
  async getStorageMetrics(): Promise<StorageMetrics> {
    // Use StorageManager API if available
    let usedBytes = 0;
    let quotaBytes = 0;

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        usedBytes = estimate.usage || 0;
        quotaBytes = estimate.quota || 0;
      } catch (error) {
        console.warn('[StorageMonitor] Could not get storage estimate:', error);
      }
    }

    // Calculate per-table usage
    const byTable: Record<string, TableStorageInfo> = {};

    for (const tableName of Object.keys(AVG_RECORD_SIZES)) {
      try {
        const table = db.table(tableName);
        if (table) {
          const count = await table.count();
          const avgSize = AVG_RECORD_SIZES[tableName] || 500;
          const estimatedBytes = count * avgSize;

          byTable[tableName] = {
            count,
            estimatedBytes,
            formattedSize: this.formatBytes(estimatedBytes),
          };
        }
      } catch {
        // Table might not exist
      }
    }

    // Calculate usage percentage
    const usagePercent = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;

    // Determine warning level
    let warningLevel: StorageWarningLevel = 'ok';
    if (usagePercent >= CRITICAL_THRESHOLD) {
      warningLevel = 'critical';
    } else if (usagePercent >= WARNING_THRESHOLD) {
      warningLevel = 'warning';
    }

    // Check if storage is persisted (won't be evicted)
    let isPersisted = false;
    if ('storage' in navigator && 'persisted' in navigator.storage) {
      try {
        isPersisted = await navigator.storage.persisted();
      } catch {
        // Permission denied or not supported
      }
    }

    const metrics: StorageMetrics = {
      usedBytes,
      quotaBytes,
      usagePercent: Math.round(usagePercent * 100) / 100,
      byTable,
      warningLevel,
      isPersisted,
      formattedUsed: this.formatBytes(usedBytes),
      formattedQuota: this.formatBytes(quotaBytes),
    };

    this.lastMetrics = metrics;
    return metrics;
  }

  /**
   * Get storage recommendations based on current usage
   */
  async getRecommendations(): Promise<StorageRecommendation[]> {
    const metrics = await this.getStorageMetrics();
    const recommendations: StorageRecommendation[] = [];

    // Check overall storage level
    if (metrics.warningLevel === 'critical') {
      recommendations.push({
        level: 'critical',
        message: `Storage is ${metrics.usagePercent.toFixed(1)}% full. App may stop working!`,
        action: 'Clear old data immediately to free up space.',
      });
    } else if (metrics.warningLevel === 'warning') {
      recommendations.push({
        level: 'warning',
        message: `Storage is ${metrics.usagePercent.toFixed(1)}% full.`,
        action: 'Consider clearing old tickets and transactions.',
      });
    }

    // Check if storage is persisted (Safari eviction protection)
    if (!metrics.isPersisted) {
      recommendations.push({
        level: 'warning',
        message: 'Storage is not persisted and may be cleared by the browser.',
        action: 'Install as PWA (Add to Home Screen) for reliable offline storage.',
      });
    }

    // Check for large tables
    for (const [table, info] of Object.entries(metrics.byTable)) {
      if (info.estimatedBytes > 50 * 1024 * 1024) { // > 50MB
        recommendations.push({
          level: 'warning',
          message: `${table} table is large (${info.formattedSize}, ${info.count} records).`,
          action: `Consider archiving old ${table} to reduce storage.`,
        });
      }
    }

    return recommendations;
  }

  /**
   * Request persistent storage (prevents browser from evicting data)
   * Returns true if permission granted
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (!('storage' in navigator) || !('persist' in navigator.storage)) {
      console.warn('[StorageMonitor] Persistent storage not supported');
      return false;
    }

    try {
      const isPersisted = await navigator.storage.persist();
      console.log('[StorageMonitor] Persistent storage:', isPersisted ? 'granted' : 'denied');
      return isPersisted;
    } catch (error) {
      console.error('[StorageMonitor] Could not request persistent storage:', error);
      return false;
    }
  }

  /**
   * Start periodic storage monitoring
   * @param intervalMs Check interval (default: 5 minutes)
   * @param onWarning Callback when storage exceeds warning threshold
   */
  startMonitoring(
    intervalMs = 5 * 60 * 1000,
    onWarning?: (metrics: StorageMetrics) => void
  ): void {
    if (this.checkInterval) {
      console.log('[StorageMonitor] Already monitoring');
      return;
    }

    this.checkInterval = setInterval(async () => {
      const metrics = await this.getStorageMetrics();

      if (metrics.warningLevel !== 'ok' && onWarning) {
        onWarning(metrics);
      }

      if (metrics.warningLevel === 'critical') {
        console.error('[StorageMonitor] CRITICAL: Storage at', metrics.usagePercent.toFixed(1) + '%');
      } else if (metrics.warningLevel === 'warning') {
        console.warn('[StorageMonitor] WARNING: Storage at', metrics.usagePercent.toFixed(1) + '%');
      }
    }, intervalMs);

    console.log('[StorageMonitor] Started monitoring (interval:', intervalMs / 1000, 'seconds)');
  }

  /**
   * Stop periodic monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[StorageMonitor] Stopped monitoring');
    }
  }

  /**
   * Get cached metrics (from last check)
   */
  getCachedMetrics(): StorageMetrics | null {
    return this.lastMetrics;
  }

  /**
   * Check if we're in a PWA context (installed to home screen)
   */
  isPWA(): boolean {
    // Check if running in standalone mode (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
    return isStandalone || isIOSStandalone;
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
  }

  /**
   * Get estimated storage by table (useful for debugging)
   */
  async getTableBreakdown(): Promise<string> {
    const metrics = await this.getStorageMetrics();
    const lines = ['Storage Breakdown:', '=================='];

    for (const [table, info] of Object.entries(metrics.byTable)) {
      lines.push(`${table}: ${info.count} records (${info.formattedSize})`);
    }

    lines.push('------------------');
    lines.push(`Total Used: ${metrics.formattedUsed} / ${metrics.formattedQuota}`);
    lines.push(`Usage: ${metrics.usagePercent.toFixed(1)}%`);
    lines.push(`Status: ${metrics.warningLevel.toUpperCase()}`);
    lines.push(`Persisted: ${metrics.isPersisted ? 'Yes' : 'No'}`);

    return lines.join('\n');
  }
}

// ==================== SINGLETON EXPORT ====================

export const storageMonitorService = new StorageMonitorService();
export default storageMonitorService;
