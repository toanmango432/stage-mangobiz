import { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Wifi, WifiOff, X } from 'lucide-react';
import { licenseManager, type LicenseState } from '../../services/licenseManager';

export function LicenseBanner() {
  const [state, setState] = useState<LicenseState>(licenseManager.getState());
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = licenseManager.subscribe((newState) => {
      setState(newState);
      // Reset dismissed state when status changes
      setIsDismissed(false);
    });

    return unsubscribe;
  }, []);

  // Don't show banner if checking or active
  if (state.status === 'checking' || state.status === 'active') {
    return null;
  }

  // Don't show if dismissed (for warnings only, not critical errors)
  if (isDismissed && state.status === 'offline_grace') {
    return null;
  }

  // Critical errors - cannot dismiss
  const isCritical =
    state.status === 'deactivated' ||
    state.status === 'expired' ||
    state.status === 'offline_expired' ||
    state.status === 'version_mismatch';

  // Get banner style based on status
  const getBannerStyle = () => {
    switch (state.status) {
      case 'offline_grace':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-900',
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
        };
      case 'deactivated':
      case 'expired':
      case 'offline_expired':
      case 'version_mismatch':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-900',
          icon: AlertCircle,
          iconColor: 'text-red-600',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-900',
          icon: AlertCircle,
          iconColor: 'text-gray-600',
        };
    }
  };

  const style = getBannerStyle();
  const Icon = style.icon;

  return (
    <div className={`${style.bg} ${style.border} border-b px-4 py-3`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Icon and message */}
        <div className="flex items-center gap-3 flex-1">
          <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0`} />

          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-medium ${style.text}`}>
              {state.status === 'offline_grace' && (
                <span className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4" />
                  Offline Mode
                </span>
              )}
              {state.status === 'deactivated' && 'Store Deactivated'}
              {state.status === 'expired' && 'License Expired'}
              {state.status === 'offline_expired' && 'Offline Period Expired'}
              {state.status === 'version_mismatch' && 'Update Required'}
              {state.status === 'not_activated' && 'Activation Required'}
            </p>

            <p className={`text-sm ${style.text}`}>
              {state.message}
            </p>
          </div>
        </div>

        {/* Store info (if available) */}
        {state.storeId && (
          <div className={`hidden md:flex items-center gap-2 text-xs ${style.text} opacity-75`}>
            <span>Store ID:</span>
            <span className="font-mono">{state.storeId}</span>
          </div>
        )}

        {/* Dismiss button (only for warnings) */}
        {!isCritical && (
          <button
            onClick={() => setIsDismissed(true)}
            className={`p-1 rounded hover:bg-black/5 transition-colors ${style.text}`}
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Critical error - show additional info */}
      {isCritical && (
        <div className="max-w-7xl mx-auto mt-2 pl-8">
          <p className={`text-xs ${style.text} opacity-75`}>
            {state.status === 'deactivated' && 'All operations are blocked. Please contact your provider.'}
            {state.status === 'expired' && 'Your license has expired. Please renew to continue.'}
            {state.status === 'offline_expired' && 'Please reconnect to the internet to revalidate your license.'}
            {state.status === 'version_mismatch' && `Please update to version ${state.requiredVersion || 'latest'}.`}
          </p>
        </div>
      )}
    </div>
  );
}
