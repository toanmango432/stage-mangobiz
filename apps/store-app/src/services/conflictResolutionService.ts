/**
 * Conflict Resolution Service
 *
 * Handles data conflicts when syncing between local IndexedDB and Supabase.
 * Implements multiple resolution strategies based on entity type and conflict severity.
 *
 * Strategies:
 * - LAST_WRITE_WINS: Server version always wins (simplest, may lose local changes)
 * - LOCAL_WINS: Local version always wins (preserves local changes, may lose server updates)
 * - MERGE: Attempt to merge changes (complex, entity-specific)
 * - MANUAL: Flag for user resolution (safest for critical data)
 * - TIMESTAMP: Compare updated_at timestamps, newer wins
 */

import { syncQueueDB } from '@/db/database';
import type { SyncOperation } from '@/types';

// ==================== TYPES ====================

export type ConflictStrategy =
  | 'LAST_WRITE_WINS'
  | 'LOCAL_WINS'
  | 'MERGE'
  | 'MANUAL'
  | 'TIMESTAMP';

export interface ConflictInfo {
  entityId: string;
  entityType: string;
  localVersion: Record<string, unknown>;
  serverVersion: Record<string, unknown>;
  localUpdatedAt: Date;
  serverUpdatedAt: Date;
  conflictFields: string[];
}

export interface ConflictResolution {
  resolved: boolean;
  winner: 'local' | 'server' | 'merged';
  resolvedData: Record<string, unknown>;
  strategy: ConflictStrategy;
  requiresManualReview?: boolean;
}

export interface ConflictStats {
  total: number;
  autoResolved: number;
  pendingManual: number;
  lastConflictAt: Date | null;
}

type ConflictListener = (conflict: ConflictInfo) => void;

// ==================== CONFIGURATION ====================

/**
 * Default strategies by entity type
 * Can be overridden per-conflict
 */
const DEFAULT_STRATEGIES: Record<string, ConflictStrategy> = {
  // Appointments are critical - use timestamp comparison
  appointment: 'TIMESTAMP',
  // Client data - attempt merge for non-conflicting fields
  client: 'MERGE',
  // Tickets involve money - flag for review
  ticket: 'MANUAL',
  // Transactions are financial - always flag for review
  transaction: 'MANUAL',
  // Staff updates - server usually has authority
  staff: 'LAST_WRITE_WINS',
  // Services - server is source of truth
  service: 'LAST_WRITE_WINS',
};

/**
 * Fields that can be safely merged (non-critical)
 */
const MERGEABLE_FIELDS: Record<string, string[]> = {
  client: ['notes', 'tags', 'preferences', 'lastVisitAt'],
  appointment: ['notes', 'internalNotes'],
};

/**
 * Fields that require manual review if conflicted
 */
const CRITICAL_FIELDS: Record<string, string[]> = {
  ticket: ['total', 'status', 'paymentStatus', 'items'],
  transaction: ['amount', 'status', 'paymentMethod'],
  appointment: ['startTime', 'endTime', 'status', 'staffId'],
};

// ==================== SERVICE ====================

class ConflictResolutionService {
  private pendingConflicts: Map<string, ConflictInfo> = new Map();
  private listeners: Set<ConflictListener> = new Set();
  private stats: ConflictStats = {
    total: 0,
    autoResolved: 0,
    pendingManual: 0,
    lastConflictAt: null,
  };

  /**
   * Detect if there's a conflict between local and server versions
   */
  detectConflict(
    entityType: string,
    entityId: string,
    localVersion: Record<string, unknown>,
    serverVersion: Record<string, unknown>
  ): ConflictInfo | null {
    // Check sync versions if available
    const localSyncVersion = localVersion.syncVersion as number | undefined;
    const serverSyncVersion = serverVersion.sync_version as number | undefined;

    // No conflict if versions match or local is ahead
    if (localSyncVersion && serverSyncVersion) {
      if (localSyncVersion >= serverSyncVersion) {
        return null; // Local is current or ahead
      }
    }

    // Find conflicting fields
    const conflictFields = this.findConflictingFields(
      entityType,
      localVersion,
      serverVersion
    );

    if (conflictFields.length === 0) {
      return null; // No actual field conflicts
    }

    const conflict: ConflictInfo = {
      entityId,
      entityType,
      localVersion,
      serverVersion,
      localUpdatedAt: new Date(localVersion.updatedAt as string || 0),
      serverUpdatedAt: new Date(serverVersion.updated_at as string || 0),
      conflictFields,
    };

    this.stats.total++;
    this.stats.lastConflictAt = new Date();

    return conflict;
  }

  /**
   * Find fields that differ between local and server versions
   */
  private findConflictingFields(
    entityType: string,
    local: Record<string, unknown>,
    server: Record<string, unknown>
  ): string[] {
    const conflicts: string[] = [];
    const checkedFields = new Set<string>();

    // Convert server snake_case keys to camelCase for comparison
    const serverNormalized = this.normalizeServerKeys(server);

    // Check critical fields first
    const criticalFields = CRITICAL_FIELDS[entityType] || [];
    for (const field of criticalFields) {
      if (this.isDifferent(local[field], serverNormalized[field])) {
        conflicts.push(field);
      }
      checkedFields.add(field);
    }

    // Check other fields
    for (const field of Object.keys(local)) {
      if (checkedFields.has(field)) continue;
      if (field === 'id' || field === 'syncVersion' || field === 'createdAt') continue;

      if (this.isDifferent(local[field], serverNormalized[field])) {
        conflicts.push(field);
      }
    }

    return conflicts;
  }

  /**
   * Convert snake_case keys to camelCase
   */
  private normalizeServerKeys(server: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(server)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = value;
    }
    return result;
  }

  /**
   * Check if two values are different
   */
  private isDifferent(a: unknown, b: unknown): boolean {
    if (a === b) return false;
    if (a === null || a === undefined) return b !== null && b !== undefined;
    if (b === null || b === undefined) return true;

    // Handle dates
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() !== b.getTime();
    }

    // Handle objects/arrays (deep comparison)
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) !== JSON.stringify(b);
    }

    return true;
  }

  /**
   * Resolve a conflict using the appropriate strategy
   */
  async resolveConflict(
    conflict: ConflictInfo,
    strategyOverride?: ConflictStrategy
  ): Promise<ConflictResolution> {
    const strategy = strategyOverride || DEFAULT_STRATEGIES[conflict.entityType] || 'LAST_WRITE_WINS';

    console.log(`[ConflictResolution] Resolving ${conflict.entityType}:${conflict.entityId} using ${strategy}`);

    let resolution: ConflictResolution;

    switch (strategy) {
      case 'LAST_WRITE_WINS':
        resolution = this.resolveLastWriteWins(conflict);
        break;

      case 'LOCAL_WINS':
        resolution = this.resolveLocalWins(conflict);
        break;

      case 'TIMESTAMP':
        resolution = this.resolveByTimestamp(conflict);
        break;

      case 'MERGE':
        resolution = this.resolveMerge(conflict);
        break;

      case 'MANUAL':
        resolution = this.flagForManualReview(conflict);
        break;

      default:
        resolution = this.resolveLastWriteWins(conflict);
    }

    // Update stats
    if (resolution.resolved && !resolution.requiresManualReview) {
      this.stats.autoResolved++;
    } else if (resolution.requiresManualReview) {
      this.stats.pendingManual++;
      this.pendingConflicts.set(conflict.entityId, conflict);
      this.notifyListeners(conflict);
    }

    return resolution;
  }

  /**
   * Server version always wins
   */
  private resolveLastWriteWins(conflict: ConflictInfo): ConflictResolution {
    return {
      resolved: true,
      winner: 'server',
      resolvedData: conflict.serverVersion,
      strategy: 'LAST_WRITE_WINS',
    };
  }

  /**
   * Local version always wins
   */
  private resolveLocalWins(conflict: ConflictInfo): ConflictResolution {
    return {
      resolved: true,
      winner: 'local',
      resolvedData: conflict.localVersion,
      strategy: 'LOCAL_WINS',
    };
  }

  /**
   * Newer timestamp wins
   */
  private resolveByTimestamp(conflict: ConflictInfo): ConflictResolution {
    const localNewer = conflict.localUpdatedAt > conflict.serverUpdatedAt;

    return {
      resolved: true,
      winner: localNewer ? 'local' : 'server',
      resolvedData: localNewer ? conflict.localVersion : conflict.serverVersion,
      strategy: 'TIMESTAMP',
    };
  }

  /**
   * Attempt to merge non-conflicting fields
   */
  private resolveMerge(conflict: ConflictInfo): ConflictResolution {
    const { entityType, localVersion, serverVersion, conflictFields } = conflict;
    const mergeableFields = MERGEABLE_FIELDS[entityType] || [];
    const criticalFields = CRITICAL_FIELDS[entityType] || [];

    // Check if any conflicts are in critical fields
    const hasCriticalConflict = conflictFields.some(f => criticalFields.includes(f));

    if (hasCriticalConflict) {
      // Cannot auto-merge, flag for manual review
      return this.flagForManualReview(conflict);
    }

    // Start with server version as base
    const merged = { ...this.normalizeServerKeys(serverVersion) };

    // Apply local changes for mergeable fields
    for (const field of mergeableFields) {
      if (localVersion[field] !== undefined) {
        merged[field] = localVersion[field];
      }
    }

    // For non-critical conflicts, prefer local if timestamp is newer
    for (const field of conflictFields) {
      if (!mergeableFields.includes(field) && !criticalFields.includes(field)) {
        if (conflict.localUpdatedAt > conflict.serverUpdatedAt) {
          merged[field] = localVersion[field];
        }
      }
    }

    return {
      resolved: true,
      winner: 'merged',
      resolvedData: merged,
      strategy: 'MERGE',
    };
  }

  /**
   * Flag for manual review
   */
  private flagForManualReview(conflict: ConflictInfo): ConflictResolution {
    return {
      resolved: false,
      winner: 'server', // Default to server while pending
      resolvedData: conflict.serverVersion,
      strategy: 'MANUAL',
      requiresManualReview: true,
    };
  }

  /**
   * Manually resolve a pending conflict
   */
  resolveManually(
    entityId: string,
    winner: 'local' | 'server',
    customData?: Record<string, unknown>
  ): ConflictResolution | null {
    const conflict = this.pendingConflicts.get(entityId);
    if (!conflict) {
      console.warn(`[ConflictResolution] No pending conflict for ${entityId}`);
      return null;
    }

    const resolvedData = customData ||
      (winner === 'local' ? conflict.localVersion : conflict.serverVersion);

    this.pendingConflicts.delete(entityId);
    this.stats.pendingManual = Math.max(0, this.stats.pendingManual - 1);
    this.stats.autoResolved++;

    console.log(`[ConflictResolution] Manually resolved ${entityId} with ${winner}`);

    return {
      resolved: true,
      winner,
      resolvedData,
      strategy: 'MANUAL',
    };
  }

  /**
   * Subscribe to new conflicts requiring manual review
   */
  subscribe(listener: ConflictListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners of new conflict
   */
  private notifyListeners(conflict: ConflictInfo): void {
    this.listeners.forEach(listener => listener(conflict));
  }

  /**
   * Get all pending manual conflicts
   */
  getPendingConflicts(): ConflictInfo[] {
    return Array.from(this.pendingConflicts.values());
  }

  /**
   * Get conflict statistics
   */
  getStats(): ConflictStats {
    return { ...this.stats };
  }

  /**
   * Clear all pending conflicts (e.g., on logout)
   */
  clear(): void {
    this.pendingConflicts.clear();
    this.stats = {
      total: 0,
      autoResolved: 0,
      pendingManual: 0,
      lastConflictAt: null,
    };
  }
}

// ==================== SINGLETON EXPORT ====================

export const conflictResolutionService = new ConflictResolutionService();
export default conflictResolutionService;
