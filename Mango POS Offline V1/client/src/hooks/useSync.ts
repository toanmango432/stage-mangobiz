/**
 * useSync Hook
 * React hook for offline/online synchronization
 */

import { useState, useEffect } from 'react';
import { syncService, SyncStatus } from '../services/syncService';

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());

  useEffect(() => {
    // Subscribe to sync status updates
    const unsubscribe = syncService.subscribe(setStatus);
    
    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isOnline: status.isOnline,
    isSyncing: status.isSyncing,
    syncNow: () => syncService.syncNow(),
  };
}
