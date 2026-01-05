/**
 * useConflictNotification Hook
 *
 * Manages sync conflict state and provides methods for conflict resolution.
 * Used with ConflictNotification component to display and resolve conflicts.
 */

import { useState, useCallback } from 'react';
import type { EntityType } from '@/types/common';
import type { ConflictDetails, ConflictResolution } from '@/components/common/ConflictNotification';

// ============================================
// TYPES
// ============================================

export interface ConflictState {
  /** List of active conflicts */
  conflicts: ConflictDetails[];
  /** Whether there are any unresolved conflicts */
  hasConflicts: boolean;
  /** Number of unresolved conflicts */
  conflictCount: number;
  /** Whether a conflict is being resolved */
  isResolving: boolean;
}

export interface ConflictActions {
  /** Add a new conflict to the queue */
  addConflict: (conflict: ConflictDetails) => void;
  /** Add multiple conflicts at once */
  addConflicts: (conflicts: ConflictDetails[]) => void;
  /** Resolve a conflict with the specified resolution strategy */
  resolveConflict: (conflictId: string, resolution: ConflictResolution) => Promise<void>;
  /** Dismiss a conflict without resolving (hides from UI) */
  dismissConflict: (conflictId: string) => void;
  /** Dismiss all conflicts */
  dismissAll: () => void;
  /** Clear all conflicts (after successful resolution) */
  clearConflicts: () => void;
  /** Get a specific conflict by ID */
  getConflict: (conflictId: string) => ConflictDetails | undefined;
}

export interface UseConflictNotificationOptions {
  /** Callback when a conflict is resolved */
  onResolve?: (conflictId: string, resolution: ConflictResolution, conflict: ConflictDetails) => Promise<void>;
  /** Callback when a conflict is dismissed */
  onDismiss?: (conflictId: string) => void;
  /** Auto-dismiss conflicts after resolution (ms) */
  autoDismissDelay?: number;
  /** Maximum number of conflicts to store */
  maxConflicts?: number;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useConflictNotification(
  options: UseConflictNotificationOptions = {}
): ConflictState & ConflictActions {
  const {
    onResolve,
    onDismiss,
    // autoDismissDelay reserved for future use
    maxConflicts = 50,
  } = options;

  // State
  const [conflicts, setConflicts] = useState<ConflictDetails[]>([]);
  const [isResolving, setIsResolving] = useState(false);

  // Derived state
  const hasConflicts = conflicts.length > 0;
  const conflictCount = conflicts.length;

  // Add a single conflict
  const addConflict = useCallback((conflict: ConflictDetails) => {
    setConflicts((prev) => {
      // Check if conflict already exists
      if (prev.some((c) => c.id === conflict.id)) {
        // Update existing conflict
        return prev.map((c) => (c.id === conflict.id ? conflict : c));
      }
      // Add new conflict, respecting max limit
      const updated = [conflict, ...prev];
      return updated.slice(0, maxConflicts);
    });
  }, [maxConflicts]);

  // Add multiple conflicts
  const addConflicts = useCallback((newConflicts: ConflictDetails[]) => {
    setConflicts((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const uniqueNew = newConflicts.filter((c) => !existingIds.has(c.id));
      const updated = [...uniqueNew, ...prev];
      return updated.slice(0, maxConflicts);
    });
  }, [maxConflicts]);

  // Resolve a conflict
  const resolveConflict = useCallback(
    async (conflictId: string, resolution: ConflictResolution) => {
      const conflict = conflicts.find((c) => c.id === conflictId);
      if (!conflict) return;

      setIsResolving(true);

      try {
        // Call the resolution handler
        if (onResolve) {
          await onResolve(conflictId, resolution, conflict);
        }

        // Remove the resolved conflict
        setConflicts((prev) => prev.filter((c) => c.id !== conflictId));

        // Auto-dismiss handled by removal
      } catch (error) {
        console.error('Failed to resolve conflict:', error);
        throw error;
      } finally {
        setIsResolving(false);
      }
    },
    [conflicts, onResolve]
  );

  // Dismiss a conflict (hide without resolving)
  const dismissConflict = useCallback(
    (conflictId: string) => {
      setConflicts((prev) => prev.filter((c) => c.id !== conflictId));
      onDismiss?.(conflictId);
    },
    [onDismiss]
  );

  // Dismiss all conflicts
  const dismissAll = useCallback(() => {
    const ids = conflicts.map((c) => c.id);
    setConflicts([]);
    ids.forEach((id) => onDismiss?.(id));
  }, [conflicts, onDismiss]);

  // Clear all conflicts
  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  // Get a specific conflict
  const getConflict = useCallback(
    (conflictId: string) => {
      return conflicts.find((c) => c.id === conflictId);
    },
    [conflicts]
  );

  return {
    // State
    conflicts,
    hasConflicts,
    conflictCount,
    isResolving,
    // Actions
    addConflict,
    addConflicts,
    resolveConflict,
    dismissConflict,
    dismissAll,
    clearConflicts,
    getConflict,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a conflict details object from raw data
 */
export function createConflictDetails(params: {
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  localData: Record<string, unknown>;
  localModifiedAt: string;
  localModifiedBy: string;
  localDeviceId: string;
  serverData: Record<string, unknown>;
  serverModifiedAt: string;
  serverModifiedBy: string;
  serverDeviceId: string;
}): ConflictDetails {
  const {
    entityType,
    entityId,
    entityName,
    localData,
    localModifiedAt,
    localModifiedBy,
    localDeviceId,
    serverData,
    serverModifiedAt,
    serverModifiedBy,
    serverDeviceId,
  } = params;

  // Find conflicting fields
  const conflictingFields = findConflictingFields(localData, serverData);

  return {
    id: `conflict-${entityType}-${entityId}-${Date.now()}`,
    entityType,
    entityId,
    entityName,
    localVersion: {
      data: localData,
      modifiedAt: localModifiedAt,
      modifiedBy: localModifiedBy,
      deviceId: localDeviceId,
    },
    serverVersion: {
      data: serverData,
      modifiedAt: serverModifiedAt,
      modifiedBy: serverModifiedBy,
      deviceId: serverDeviceId,
    },
    conflictingFields,
    detectedAt: new Date().toISOString(),
  };
}

/**
 * Find fields that differ between local and server versions
 */
export function findConflictingFields(
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>
): string[] {
  const allKeys = new Set([...Object.keys(localData), ...Object.keys(serverData)]);
  const conflictingFields: string[] = [];

  // Skip metadata fields
  const skipFields = ['id', 'createdAt', 'updatedAt', 'syncStatus', 'version'];

  for (const key of allKeys) {
    if (skipFields.includes(key)) continue;

    const localValue = localData[key];
    const serverValue = serverData[key];

    if (!isEqual(localValue, serverValue)) {
      conflictingFields.push(key);
    }
  }

  return conflictingFields;
}

/**
 * Simple deep equality check
 */
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!isEqual(aObj[key], bObj[key])) return false;
  }

  return true;
}

export default useConflictNotification;
