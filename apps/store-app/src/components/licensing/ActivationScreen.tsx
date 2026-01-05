import { useState } from 'react';
import { Key, Loader2, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { licenseManager, type LicenseState } from '../../services/licenseManager';

interface ActivationScreenProps {
  onActivated: () => void;
  initialState?: LicenseState;
}

export function ActivationScreen({ onActivated, initialState }: ActivationScreenProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const state = initialState || licenseManager.getState();

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setIsActivating(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await licenseManager.activate(licenseKey.trim());

      if (result.status === 'active') {
        setSuccess('License activated successfully!');
        setTimeout(() => {
          onActivated();
        }, 1000);
      } else if (result.status === 'offline_grace') {
        setSuccess('License activated in offline mode.');
        setTimeout(() => {
          onActivated();
        }, 1000);
      } else {
        setError(result.message || 'Activation failed. Please check your license key.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isActivating) {
      handleActivate();
    }
  };

  // Version mismatch screen
  if (state.status === 'version_mismatch') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <Download className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Update Required</h1>
            <p className="text-gray-600">
              Your app version is outdated and needs to be updated.
            </p>
          </div>

          {/* Version info */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
            <p className="text-sm text-red-800">
              <span className="font-semibold">Current Version:</span> {licenseManager.getAppVersion()}
            </p>
            {state.requiredVersion && (
              <p className="text-sm text-red-800">
                <span className="font-semibold">Required Version:</span> {state.requiredVersion}
              </p>
            )}
          </div>

          {/* Message */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 text-center">
              {state.message || 'Please download the latest version to continue.'}
            </p>
          </div>

          {/* Update button */}
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  // Deactivated screen
  if (state.status === 'deactivated' || state.status === 'expired' || state.status === 'offline_expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">License Invalid</h1>
            <p className="text-gray-600">
              Your license has been deactivated or has expired.
            </p>
          </div>

          {/* Error message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 text-center">
              {state.message || 'Please contact your provider to renew or reactivate your license.'}
            </p>
          </div>

          {/* New license key input */}
          <div className="space-y-4">
            <div>
              <label htmlFor="license-key" className="block text-sm font-medium text-gray-700 mb-2">
                Enter New License Key
              </label>
              <input
                id="license-key"
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                disabled={isActivating}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={isActivating || !licenseKey.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isActivating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Activating...</span>
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  <span>Activate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default activation screen (not_activated)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <Key className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Activate Mango POS</h1>
          <p className="text-gray-600">
            Enter your license key to activate and start using your store.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label htmlFor="license-key" className="block text-sm font-medium text-gray-700 mb-2">
              License Key
            </label>
            <input
              id="license-key"
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              disabled={isActivating}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-center font-mono text-lg"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={isActivating || !licenseKey.trim()}
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            {isActivating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Activating...</span>
              </>
            ) : (
              <>
                <Key className="w-5 h-5" />
                <span>Activate Store</span>
              </>
            )}
          </button>
        </div>

        {/* Help text */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Don't have a license key?{' '}
            <a href="#" className="text-orange-600 hover:text-orange-700 font-medium">
              Contact your provider
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
