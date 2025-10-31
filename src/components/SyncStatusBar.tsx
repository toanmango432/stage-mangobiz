import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectIsOnline, selectIsSyncing, selectPendingOperations } from '../store/slices/syncSlice';

export function SyncStatusBar() {
  const isOnline = useAppSelector(selectIsOnline);
  const isSyncing = useAppSelector(selectIsSyncing);
  const pendingOps = useAppSelector(selectPendingOperations);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show status bar when syncing or offline with pending ops
    setVisible(isSyncing || (!isOnline && pendingOps > 0));
  }, [isSyncing, isOnline, pendingOps]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 py-2 px-4 text-center text-sm font-medium transition-all ${
        !isOnline
          ? 'bg-red-600 text-white'
          : isSyncing
          ? 'bg-blue-600 text-white'
          : 'bg-green-600 text-white'
      }`}
    >
      {!isOnline && (
        <span>
          📴 Offline Mode • {pendingOps} operation{pendingOps !== 1 ? 's' : ''} pending
        </span>
      )}
      {isOnline && isSyncing && (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Syncing {pendingOps} operation{pendingOps !== 1 ? 's' : ''}...
        </span>
      )}
    </div>
  );
}
