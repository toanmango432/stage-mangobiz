import { useEffect, useState } from 'react';
import { useSync } from '../hooks/useSync';
import { getDBStats } from '../services/db';

export function OfflineIndicator() {
  const { isOnline, isSyncing, syncNow } = useSync();
  const [showDetails, setShowDetails] = useState(false);
  const [pendingOps, setPendingOps] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  useEffect(() => {
    // Poll DB stats every 5 seconds
    const updateStats = async () => {
      const stats = await getDBStats();
      setPendingOps(stats.pendingSync);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSyncNow = async () => {
    await syncNow();
    setLastSyncAt(new Date());
  };

  const formatLastSync = (timestamp: Date | null) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isOnline && pendingOps === 0) {
    return null; // Don't show anything when online and synced
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`rounded-lg shadow-lg p-4 cursor-pointer transition-all ${
          isOnline
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-red-50 border border-red-200'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {/* Compact View */}
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`}></div>
          <div>
            <div className="font-semibold text-sm">
              {isOnline ? '🔄 Syncing...' : '📴 Offline Mode'}
            </div>
            {pendingOps > 0 && (
              <div className="text-xs text-gray-600">
                {pendingOps} pending operation{pendingOps !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <button
            className="ml-2 text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
          >
            {showDetails ? '▼' : '▶'}
          </button>
        </div>

        {/* Detailed View */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending:</span>
                <span className="font-medium">{pendingOps} operations</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Sync:</span>
                <span className="font-medium">{formatLastSync(lastSyncAt)}</span>
              </div>
            </div>

            {isOnline && pendingOps > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSyncNow();
                }}
                disabled={isSyncing}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            )}

            {!isOnline && (
              <div className="p-3 bg-red-100 rounded-lg">
                <p className="text-xs text-red-800">
                  <strong>Offline Mode Active</strong><br />
                  Changes are saved locally and will sync when connection is restored.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
