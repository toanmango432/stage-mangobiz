import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show "back online" message briefly
      setTimeout(() => setShowBanner(false), 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50 px-4 py-3
        transition-all duration-300 transform
        ${isOnline
          ? 'bg-[#22c55e] text-white'
          : 'bg-[#ef4444] text-white'
        }
      `}
    >
      <div className="flex items-center justify-center gap-3 font-['Work_Sans']">
        {isOnline ? (
          <>
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Back online! Syncing your data...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm">
              No internet connection. Changes will sync when you're back online.
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default OfflineBanner;
