import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './useStore';
import {
  setOnlineStatus,
  setSyncStatus,
  setLastSyncedAt,
  setSyncError,
  setPendingCount,
} from '../store/slices/syncSlice';
import { dataService } from '../services/dataService';

const SYNC_INTERVAL = 30000; // 30 seconds

export function useOfflineSync() {
  const dispatch = useAppDispatch();
  const { isOnline, status, pendingCount } = useAppSelector((state) => state.sync);
  const syncIntervalRef = useRef<number | null>(null);

  const updatePendingCount = useCallback(async () => {
    const count = await dataService.sync.getPendingCount();
    dispatch(setPendingCount(count));
  }, [dispatch]);

  const processSync = useCallback(async () => {
    if (!navigator.onLine) {
      await updatePendingCount();
      return;
    }

    try {
      dispatch(setSyncStatus('syncing'));

      const processed = await dataService.sync.processQueue();

      if (processed > 0) {
        dispatch(setLastSyncedAt(new Date().toISOString()));
      }

      await updatePendingCount();
      dispatch(setSyncStatus('synced'));
      dispatch(setSyncError(null));
    } catch (error) {
      dispatch(
        setSyncError(error instanceof Error ? error.message : 'Sync failed')
      );
      dispatch(setSyncStatus('error'));
    }
  }, [dispatch, updatePendingCount]);

  const startSyncInterval = useCallback(() => {
    if (syncIntervalRef.current) {
      window.clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = window.setInterval(() => {
      if (navigator.onLine) {
        processSync();
      }
    }, SYNC_INTERVAL);
  }, [processSync]);

  const stopSyncInterval = useCallback(() => {
    if (syncIntervalRef.current) {
      window.clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      dispatch(setOnlineStatus(true));
      processSync();
      startSyncInterval();
    };

    const handleOffline = () => {
      dispatch(setOnlineStatus(false));
      stopSyncInterval();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    dispatch(setOnlineStatus(navigator.onLine));

    if (navigator.onLine) {
      processSync();
      startSyncInterval();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopSyncInterval();
    };
  }, [dispatch, processSync, startSyncInterval, stopSyncInterval]);

  const forceSync = useCallback(async () => {
    if (navigator.onLine) {
      await processSync();
    }
  }, [processSync]);

  return {
    isOnline,
    status,
    pendingCount,
    forceSync,
  };
}
