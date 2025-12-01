/**
 * Offline Blocker
 *
 * Displays a full-screen blocker when:
 * - Device is in online-only mode AND offline
 *
 * This prevents users from attempting to use the app
 * when they can't save data.
 */

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Cloud } from 'lucide-react';
import { useCanOperate } from '@/hooks/useSync';

interface OfflineBlockerProps {
  children: React.ReactNode;
}

export function OfflineBlocker({ children }: OfflineBlockerProps) {
  const { canOperate, reason } = useCanOperate();
  const [retrying, setRetrying] = useState(false);

  // Listen for online event to auto-refresh
  useEffect(() => {
    const handleOnline = () => {
      // Small delay to ensure connection is stable
      setTimeout(() => {
        window.location.reload();
      }, 500);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // If can operate, render children normally
  if (canOperate) {
    return <>{children}</>;
  }

  // Handle retry
  const handleRetry = () => {
    setRetrying(true);

    // Check if actually online now
    if (navigator.onLine) {
      window.location.reload();
    } else {
      // Show retry failed after brief delay
      setTimeout(() => {
        setRetrying(false);
      }, 1500);
    }
  };

  // Render blocker
  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-red-400" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">No Internet Connection</h1>
          <p className="text-gray-400 text-lg">
            This device requires an internet connection to operate.
          </p>
        </div>

        {/* Reason */}
        {reason && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-300 text-sm">{reason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full py-4 px-6 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {retrying ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Checking connection...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Try Again
              </>
            )}
          </button>

          <p className="text-gray-500 text-sm">
            The app will automatically reconnect when internet is available.
          </p>
        </div>

        {/* Offline mode suggestion */}
        <div className="pt-6 border-t border-gray-700">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-left">
            <div className="flex items-start gap-3">
              <Cloud className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-emerald-300 font-medium text-sm">
                  Need to work offline?
                </p>
                <p className="text-emerald-400/80 text-sm mt-1">
                  Ask your administrator to enable offline mode for this device.
                  This allows you to continue working even without internet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OfflineBlocker;
