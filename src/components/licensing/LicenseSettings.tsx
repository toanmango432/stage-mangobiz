import { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, Loader2, Shield, RefreshCw } from 'lucide-react';
import { licenseManager, type LicenseState } from '../../services/licenseManager';
import { secureStorage } from '../../services/secureStorage';

export function LicenseSettings() {
  const [state, setState] = useState<LicenseState>(licenseManager.getState());
  const [newLicenseKey, setNewLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [maskedKey, setMaskedKey] = useState('');

  useEffect(() => {
    const unsubscribe = licenseManager.subscribe((newState) => {
      setState(newState);
    });

    // Load masked license key
    loadMaskedKey();

    return unsubscribe;
  }, []);

  const loadMaskedKey = async () => {
    const key = await secureStorage.getLicenseKey();
    if (key) {
      // Mask the key (show first 4 and last 4 characters)
      if (key.length > 8) {
        const masked = `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`;
        setMaskedKey(masked);
      } else {
        setMaskedKey('*'.repeat(key.length));
      }
    }
  };

  const handleActivate = async () => {
    if (!newLicenseKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter a license key' });
      return;
    }

    setIsActivating(true);
    setMessage(null);

    try {
      const result = await licenseManager.activate(newLicenseKey.trim());

      if (result.status === 'active' || result.status === 'offline_grace') {
        setMessage({ type: 'success', text: 'License activated successfully!' });
        setNewLicenseKey('');
        await loadMaskedKey();
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Activation failed. Please check your license key.',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setMessage(null);

    try {
      const result = await licenseManager.checkLicense();

      if (result.status === 'active' || result.status === 'offline_grace') {
        setMessage({ type: 'success', text: 'License validated successfully!' });
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'License validation failed.',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = () => {
    switch (state.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Active
          </span>
        );
      case 'offline_grace':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Offline Mode
          </span>
        );
      case 'deactivated':
      case 'expired':
      case 'offline_expired':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Deactivated
          </span>
        );
      case 'version_mismatch':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Update Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Not Activated
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">License & Activation</h2>
          <p className="text-sm text-gray-600">Manage your store license and activation</p>
        </div>
      </div>

      {/* Current License Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* License Key */}
          {maskedKey && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Key</label>
              <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200">
                {maskedKey}
              </p>
            </div>
          )}

          {/* Store ID */}
          {state.storeId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store ID</label>
              <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200">
                {state.storeId}
              </p>
            </div>
          )}

          {/* Tier */}
          {state.tier && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <p className="text-sm capitalize bg-gray-50 px-3 py-2 rounded border border-gray-200">
                {state.tier}
              </p>
            </div>
          )}

          {/* App Version */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">App Version</label>
            <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200">
              {licenseManager.getAppVersion()}
            </p>
          </div>
        </div>

        {/* Status Message */}
        {state.message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              state.status === 'active'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : state.status === 'offline_grace'
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {state.message}
          </div>
        )}

        {/* Refresh button */}
        {(state.status === 'active' || state.status === 'offline_grace') && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh License'}
          </button>
        )}
      </div>

      {/* Activate New License */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {state.status === 'active' ? 'Change License Key' : 'Activate License'}
        </h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="new-license-key" className="block text-sm font-medium text-gray-700 mb-2">
              {state.status === 'active' ? 'New License Key' : 'Enter License Key'}
            </label>
            <input
              id="new-license-key"
              type="text"
              value={newLicenseKey}
              onChange={(e) => setNewLicenseKey(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              disabled={isActivating}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
            />
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={isActivating || !newLicenseKey.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isActivating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Activating...</span>
              </>
            ) : (
              <>
                <Key className="w-5 h-5" />
                <span>{state.status === 'active' ? 'Update License' : 'Activate'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
        <p className="text-sm text-blue-700">
          If you're having trouble with your license or need to purchase a new one, please contact your
          provider or support team.
        </p>
      </div>
    </div>
  );
}
