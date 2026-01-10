import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CloudOff, Check } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

export function OfflineBanner() {
  const { isOnline, status, pendingCount, forceSync } = useOfflineSync();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setWasOffline(true);
    } else if (wasOffline) {
      setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
      }, 3000);
    }
  }, [isOnline, wasOffline]);

  useEffect(() => {
    if (!isOnline || pendingCount > 0 || status === 'error') {
      setShowBanner(true);
    } else if (isOnline && pendingCount === 0 && !wasOffline) {
      setShowBanner(false);
    }
  }, [isOnline, pendingCount, status, wasOffline]);

  if (!showBanner && status !== 'syncing' && status !== 'error') return null;

  const getBannerColor = () => {
    if (!isOnline) return 'bg-[#ef4444]';
    if (status === 'syncing') return 'bg-[#f59e0b]';
    if (status === 'error') return 'bg-[#ef4444]';
    if (status === 'synced' && pendingCount === 0) return 'bg-[#22c55e]';
    return 'bg-[#f59e0b]';
  };

  const getStatusMessage = () => {
    if (!isOnline) {
      return (
        <>
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">
            No internet connection. {pendingCount > 0 && `${pendingCount} changes pending sync.`}
          </span>
        </>
      );
    }

    if (status === 'syncing') {
      return (
        <>
          <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin" />
          <span className="text-sm">Syncing your data...</span>
        </>
      );
    }

    if (status === 'error') {
      return (
        <>
          <CloudOff className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Sync failed. Will retry automatically.</span>
          <button
            onClick={forceSync}
            className="ml-2 text-xs underline hover:no-underline"
          >
            Retry now
          </button>
        </>
      );
    }

    if (pendingCount > 0) {
      return (
        <>
          <RefreshCw className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{pendingCount} changes pending sync...</span>
        </>
      );
    }

    return (
      <>
        <Check className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">Back online! All changes synced.</span>
      </>
    );
  };

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50 px-4 py-3
        transition-all duration-300 transform text-white
        ${getBannerColor()}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-3 font-['Work_Sans']">
        {getStatusMessage()}
      </div>
    </div>
  );
}

export default OfflineBanner;
