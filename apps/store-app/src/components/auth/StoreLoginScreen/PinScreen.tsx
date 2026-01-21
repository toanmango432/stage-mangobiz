/**
 * PinScreen Component
 *
 * PIN entry screen shown after store login.
 * Allows staff members to authenticate with their PIN.
 */

import { KeyRound, ArrowLeft, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { PinScreenProps } from './types';

export function PinScreen({
  storeName,
  members,
  loadingMembers,
  pin,
  error,
  success,
  isLoading,
  onPinChange,
  onPinKeyPress,
  onPinBackspace,
  onPinKeyDown,
  onLogoutStore,
}: PinScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-amber-50 to-yellow-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Back button */}
        <button
          onClick={onLogoutStore}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Different store</span>
        </button>

        {/* Store info */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-amber-500 rounded-2xl flex items-center justify-center">
            <KeyRound className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">{storeName}</h1>
          <p className="text-gray-600">Enter your PIN to continue</p>
        </div>

        {/* Member avatars (if available) */}
        {members.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap">
            {members.slice(0, 6).map((member) => (
              <div
                key={member.memberId}
                className="flex flex-col items-center gap-1"
                title={member.memberName}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.memberName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    member.firstName?.charAt(0) ||
                    member.memberName?.charAt(0) || <User className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs text-gray-500 truncate max-w-[60px]">
                  {member.firstName || member.memberName?.split(' ')[0]}
                </span>
              </div>
            ))}
            {members.length > 6 && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  +{members.length - 6}
                </div>
              </div>
            )}
          </div>
        )}

        {loadingMembers && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* PIN Display */}
        <div role="group" aria-label="PIN entry" className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              aria-label={`PIN digit ${i + 1}${pin.length > i ? ', filled' : ', empty'}`}
              className={`w-12 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                pin.length > i
                  ? 'border-brand-500 bg-brand-50 text-brand-600'
                  : 'border-gray-200 bg-gray-50 text-gray-300'
              }`}
            >
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>

        {/* Hidden input for keyboard */}
        <input
          type="password"
          value={pin}
          onChange={(e) => onPinChange(e.target.value)}
          onKeyDown={onPinKeyDown}
          className="sr-only"
          autoFocus
          maxLength={6}
        />

        {/* PIN Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'backspace'].map((key, index) => (
            <button
              key={index}
              onClick={() => {
                if (key === 'backspace') onPinBackspace();
                else if (key !== null) onPinKeyPress(String(key));
              }}
              disabled={isLoading || (key !== 'backspace' && key !== null && pin.length >= 6)}
              className={`h-14 rounded-xl font-semibold text-xl transition-all ${
                key === null
                  ? 'invisible'
                  : key === 'backspace'
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:scale-95'
              } disabled:opacity-50`}
            >
              {key === 'backspace' ? '⌫' : key}
            </button>
          ))}
        </div>

        {/* Error/Success messages */}
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

        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        )}
      </div>
    </div>
  );
}

export default PinScreen;
