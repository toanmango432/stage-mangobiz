/**
 * useSupabaseSync Hook
 *
 * Provides access to the Supabase sync context for managing real-time data synchronization.
 * Must be used within a SupabaseSyncProvider.
 *
 * @returns Sync state and controls including sync status, online status, and manual sync trigger.
 * @throws Error if used outside of SupabaseSyncProvider
 */

import { useContext } from 'react';
import { SupabaseSyncContext } from '@/providers/SupabaseSyncProvider';

export function useSupabaseSync() {
  const context = useContext(SupabaseSyncContext);
  if (!context) {
    throw new Error('useSupabaseSync must be used within a SupabaseSyncProvider');
  }
  return context;
}

export default useSupabaseSync;
