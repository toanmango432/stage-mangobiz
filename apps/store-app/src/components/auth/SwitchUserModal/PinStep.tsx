/**
 * PinStep Component
 *
 * PIN entry step for switch user modal.
 * Used for store-login context or member-login + offline.
 */

import { Loader2, AlertCircle, WifiOff, Clock } from 'lucide-react';
import { PinInput } from '../PinInput';
import { getInitials, getRoleLabel, getRoleColor } from './utils';
import type { PinStepProps } from './types';

export function PinStep({
  selectedMember,
  pin,
  error,
  loading,
  loginContext,
  isOnline,
  onPinChange,
  onPinComplete,
  onPinSubmit,
}: PinStepProps) {
  return (
    <div className="space-y-6">
      {/* Selected Member */}
      <div className="text-center">
        {selectedMember.avatarUrl ? (
          <img
            src={selectedMember.avatarUrl}
            alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
            className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
          />
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
            {getInitials(selectedMember)}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedMember.firstName} {selectedMember.lastName}
        </h3>
        <p className={`text-xs font-medium px-3 py-1 rounded-full inline-block mt-2 ${getRoleColor(selectedMember.role)}`}>
          {getRoleLabel(selectedMember.role)}
        </p>
      </div>

      {/* Grace period warning (store-login only) */}
      {loginContext === 'store' &&
        selectedMember.graceInfo &&
        selectedMember.graceInfo.daysRemaining <= 2 &&
        selectedMember.graceInfo.isValid && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>
              {selectedMember.graceInfo.daysRemaining} day
              {selectedMember.graceInfo.daysRemaining !== 1 ? 's' : ''} of offline access remaining.
              Connect to internet to extend.
            </span>
          </div>
        )}

      {/* Offline indicator for member-login context */}
      {loginContext === 'member' && !isOnline && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>Offline - Using PIN for verification</span>
        </div>
      )}

      {/* PIN Input */}
      <div className="flex flex-col items-center">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Enter your PIN
        </label>
        <PinInput
          value={pin}
          onChange={(value) => {
            onPinChange(value);
          }}
          length={4}
          disabled={loading}
          error={!!error}
          autoFocus
          onComplete={onPinComplete}
        />

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 mt-4 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={onPinSubmit}
        disabled={loading || pin.length < 4}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verifying...</span>
          </>
        ) : (
          <span>Verify PIN</span>
        )}
      </button>

      {/* Forgot PIN hint */}
      <p className="text-xs text-center text-gray-400">
        Forgot PIN? Contact your manager to reset.
      </p>
    </div>
  );
}

export default PinStep;
