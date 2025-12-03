/**
 * Conflict Notification Context
 *
 * Provides conflict notification state and actions throughout the app.
 * Integrates with the sync system to detect and display conflicts.
 */

import { createContext, useContext, useCallback, ReactNode } from 'react';
import { useConflictNotification, createConflictDetails } from '@/hooks/useConflictNotification';
import { ConflictNotificationContainer } from '@/components/common/ConflictNotification';
import type { ConflictDetails, ConflictResolution } from '@/components/common/ConflictNotification';
import type { EntityType } from '@/types/common';

// ============================================
// CONTEXT TYPES
// ============================================

interface ConflictNotificationContextValue {
  /** List of active conflicts */
  conflicts: ConflictDetails[];
  /** Whether there are any unresolved conflicts */
  hasConflicts: boolean;
  /** Number of unresolved conflicts */
  conflictCount: number;
  /** Whether a conflict is being resolved */
  isResolving: boolean;
  /** Report a new conflict */
  reportConflict: (params: ReportConflictParams) => void;
  /** Resolve a conflict */
  resolveConflict: (conflictId: string, resolution: ConflictResolution) => Promise<void>;
  /** Dismiss a conflict */
  dismissConflict: (conflictId: string) => void;
  /** Dismiss all conflicts */
  dismissAll: () => void;
}

export interface ReportConflictParams {
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
}

// ============================================
// CONTEXT
// ============================================

const ConflictNotificationContext = createContext<ConflictNotificationContextValue | null>(null);

// ============================================
// HOOK
// ============================================

export function useConflictNotificationContext(): ConflictNotificationContextValue {
  const context = useContext(ConflictNotificationContext);
  if (!context) {
    throw new Error('useConflictNotificationContext must be used within ConflictNotificationProvider');
  }
  return context;
}

// ============================================
// PROVIDER
// ============================================

interface ConflictNotificationProviderProps {
  children: ReactNode;
  /** Callback when a conflict is resolved - use this to persist the resolution */
  onResolve?: (
    conflictId: string,
    resolution: ConflictResolution,
    conflict: ConflictDetails
  ) => Promise<void>;
}

export function ConflictNotificationProvider({
  children,
  onResolve: externalOnResolve,
}: ConflictNotificationProviderProps) {
  // Handle conflict resolution
  const handleResolve = useCallback(
    async (conflictId: string, resolution: ConflictResolution, conflict: ConflictDetails) => {
      console.log(`Resolving conflict ${conflictId} with ${resolution}`, conflict);

      if (externalOnResolve) {
        await externalOnResolve(conflictId, resolution, conflict);
      }

      // Default resolution behavior if no external handler
      // In a real implementation, this would update the database
      // based on the resolution choice
    },
    [externalOnResolve]
  );

  // Use the conflict notification hook
  const {
    conflicts,
    hasConflicts,
    conflictCount,
    isResolving,
    addConflict,
    resolveConflict,
    dismissConflict,
    dismissAll,
  } = useConflictNotification({
    onResolve: handleResolve,
  });

  // Report a new conflict
  const reportConflict = useCallback(
    (params: ReportConflictParams) => {
      const conflict = createConflictDetails(params);
      addConflict(conflict);
    },
    [addConflict]
  );

  // Context value
  const value: ConflictNotificationContextValue = {
    conflicts,
    hasConflicts,
    conflictCount,
    isResolving,
    reportConflict,
    resolveConflict,
    dismissConflict,
    dismissAll,
  };

  return (
    <ConflictNotificationContext.Provider value={value}>
      {children}
      {/* Render the conflict notification container */}
      <ConflictNotificationContainer
        conflicts={conflicts}
        onResolve={resolveConflict}
        onDismiss={dismissConflict}
        onDismissAll={dismissAll}
        maxVisible={3}
      />
    </ConflictNotificationContext.Provider>
  );
}

export default ConflictNotificationContext;
