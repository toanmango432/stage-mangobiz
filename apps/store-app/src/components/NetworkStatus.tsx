import { useEffect, useState } from 'react';
import { WifiOff, Wifi, Cloud, CloudOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppSelector } from '../store/hooks';
import { selectIsOnline, selectIsSyncing, selectPendingOperations } from '../store/slices/syncSlice';
import { syncManager } from '../services/syncManager';

export function NetworkStatus() {
  const isOnline = useAppSelector(selectIsOnline);
  const isSyncing = useAppSelector(selectIsSyncing);
  const pendingOps = useAppSelector(selectPendingOperations);
  const [showDetails, setShowDetails] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Update last sync time when sync completes
  useEffect(() => {
    if (!isSyncing && isOnline) {
      setLastSyncTime(new Date());
    }
  }, [isSyncing, isOnline]);

  // Auto-hide after 5 seconds if online and synced
  useEffect(() => {
    if (isOnline && !isSyncing && pendingOps === 0) {
      const timer = setTimeout(() => setShowDetails(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isSyncing, pendingOps]);

  // Always show if offline or has pending operations
  const shouldShow = !isOnline || pendingOps > 0 || isSyncing || showDetails;

  if (!shouldShow) {
    return null;
  }

  const handleManualSync = async () => {
    if (isOnline && !isSyncing) {
      await syncManager.syncNow();
    }
  };

  // Determine status
  const getStatus = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
        message: 'Offline Mode',
        description: 'Working offline. Changes will sync when connection is restored.',
      };
    }

    if (isSyncing) {
      return {
        icon: Cloud,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600',
        message: 'Syncing...',
        description: `Synchronizing ${pendingOps} operations with server`,
      };
    }

    if (pendingOps > 0) {
      return {
        icon: AlertCircle,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600',
        message: `${pendingOps} Pending`,
        description: `${pendingOps} changes waiting to sync`,
      };
    }

    return {
      icon: CheckCircle2,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      message: 'All Synced',
      description: 'All changes synchronized',
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    
    const seconds = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
    
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <>
      {/* Fixed position indicator */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div 
          className={`
            ${status.bgColor} ${status.borderColor} ${status.textColor}
            border rounded-lg shadow-lg
            transition-all duration-300 ease-out
            ${shouldShow ? 'translate-y-2 opacity-100' : '-translate-y-full opacity-0'}
            pointer-events-auto
          `}
          onClick={() => setShowDetails(!showDetails)}
        >
          {/* Compact bar */}
          <div className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:opacity-90">
            <StatusIcon className={`w-4 h-4 ${status.iconColor} ${isSyncing ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium">{status.message}</span>
            
            {/* Connection indicator */}
            {isOnline ? (
              <Wifi className="w-3 h-3 text-green-600" />
            ) : (
              <CloudOff className="w-3 h-3 text-red-600" />
            )}
          </div>

          {/* Expanded details */}
          {showDetails && (
            <div className={`border-t ${status.borderColor} px-4 py-3 space-y-2`}>
              <p className="text-xs opacity-80">{status.description}</p>
              
              <div className="flex items-center justify-between text-xs">
                <span className="opacity-70">
                  Last sync: {formatLastSync()}
                </span>
                
                {isOnline && !isSyncing && pendingOps > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManualSync();
                    }}
                    className="px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-70 transition-colors"
                  >
                    Sync Now
                  </button>
                )}
              </div>

              {/* Progress indicator */}
              {isSyncing && (
                <div className="w-full h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
                  <div className="h-full bg-current animate-pulse" style={{ width: '60%' }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
