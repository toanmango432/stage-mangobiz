/**
 * OfflineStoreSwitcher Component
 *
 * Enables multi-store users to switch between their authorized stores while offline.
 * PIN verification is required to prevent unauthorized store access on shared devices.
 *
 * This component:
 * - Only appears when offline AND user has multiple stores cached
 * - Shows cached store list from memberAuthService.getCachedStores()
 * - Requires PIN verification via PinVerificationModal before switching
 * - Updates active store context in Redux after successful verification
 * - Shows "Offline - Limited store data available" warning
 *
 * @example
 * ```tsx
 * <OfflineStoreSwitcher
 *   isOpen={showStoreSwitcher}
 *   onClose={() => setShowStoreSwitcher(false)}
 *   onStoreSwitch={(storeId) => handleStoreSwitch(storeId)}
 *   memberId="member-123"
 *   currentStoreId="store-456"
 * />
 * ```
 *
 * @see docs/AUTH_MIGRATION_PLAN.md
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Loader2,
  Store as StoreIcon,
  MapPin,
  Check,
  WifiOff,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { memberAuthService, type CachedStoreInfo } from '@/services/memberAuthService';
import { PinVerificationModal } from './PinVerificationModal';
import type { MemberAuthSession } from '@/types/memberAuth';

/** Props for OfflineStoreSwitcher component */
export interface OfflineStoreSwitcherProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when store switch is successful - receives the new store ID */
  onStoreSwitch: (storeId: string) => void;
  /** Member ID for PIN verification and store lookup */
  memberId: string;
  /** Currently active store ID */
  currentStoreId: string;
}

/**
 * Modal component for offline store switching for multi-store users.
 *
 * Features:
 * - Displays cached stores list from localStorage
 * - Requires PIN verification before switching stores
 * - Shows offline warning banner
 * - Auto-selects current store initially
 * - Shows "Limited data available" warning
 */
export function OfflineStoreSwitcher({
  isOpen,
  onClose,
  onStoreSwitch,
  memberId,
  currentStoreId,
}: OfflineStoreSwitcherProps) {
  // Selected store ID
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  // Error state
  const [error, setError] = useState<string | null>(null);
  // PIN verification modal state
  const [showPinVerification, setShowPinVerification] = useState(false);
  // Cached stores
  const [cachedStores, setCachedStores] = useState<CachedStoreInfo[]>([]);
  // Whether user has PIN configured
  const [hasPinConfigured, setHasPinConfigured] = useState<boolean | null>(null);
  // PIN lockout status
  const [lockoutInfo, setLockoutInfo] = useState<{ isLocked: boolean; remainingMinutes: number }>({ isLocked: false, remainingMinutes: 0 });

  // Load cached stores when modal opens
  useEffect(() => {
    if (isOpen && memberId) {
      const stores = memberAuthService.getCachedStores(memberId);
      setCachedStores(stores);
      setSelectedStoreId(currentStoreId);
      setError(null);

      // Check if user has PIN configured
      memberAuthService.hasPin(memberId).then(setHasPinConfigured);

      // Check lockout status
      const lockout = memberAuthService.checkPinLockout(memberId);
      setLockoutInfo(lockout);
    }
  }, [isOpen, memberId, currentStoreId]);

  // Memoized check for whether selected store is the current store
  const isSelectedStoreCurrent = useMemo(() => {
    return selectedStoreId === currentStoreId;
  }, [selectedStoreId, currentStoreId]);

  // Check if PIN is locked
  const isPinLocked = lockoutInfo.isLocked;

  // Handle store selection
  const handleStoreClick = useCallback((storeId: string) => {
    setSelectedStoreId(storeId);
    setError(null);
  }, []);

  // Handle switch button click - initiate PIN verification
  const handleSwitchClick = useCallback(() => {
    if (!selectedStoreId) {
      setError('Please select a store to continue');
      return;
    }

    if (isSelectedStoreCurrent) {
      // Already on this store - just close
      onClose();
      return;
    }

    // Check if PIN is locked
    const lockout = memberAuthService.checkPinLockout(memberId);
    if (lockout.isLocked) {
      setLockoutInfo(lockout);
      setError(`PIN locked. Try again in ${lockout.remainingMinutes} minutes.`);
      return;
    }

    // Check if user has PIN configured
    if (hasPinConfigured === false) {
      setError('PIN not configured. Connect to the internet to switch stores.');
      return;
    }

    // Open PIN verification modal
    setShowPinVerification(true);
  }, [selectedStoreId, isSelectedStoreCurrent, memberId, hasPinConfigured, onClose]);

  // Handle successful PIN verification
  const handlePinVerified = useCallback((_session: MemberAuthSession) => {
    setShowPinVerification(false);
    setIsLoading(true);

    // Small delay for visual feedback
    setTimeout(() => {
      setIsLoading(false);

      if (selectedStoreId) {
        onStoreSwitch(selectedStoreId);
        onClose();
      }
    }, 300);
  }, [selectedStoreId, onStoreSwitch, onClose]);

  // Handle PIN verification modal close
  const handlePinVerificationClose = useCallback(() => {
    setShowPinVerification(false);

    // Refresh lockout status
    const lockout = memberAuthService.checkPinLockout(memberId);
    setLockoutInfo(lockout);
  }, [memberId]);

  // If no cached stores or only one store, don't render
  if (cachedStores.length <= 1) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen && !showPinVerification} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <StoreIcon className="w-5 h-5 text-purple-600" />
              Switch Store
            </DialogTitle>
            <DialogDescription className="text-center">
              Select a store to switch to. PIN verification required.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-4 py-4">
            {/* Offline Warning Banner */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Offline - Limited store data available
              </p>
            </div>

            {/* PIN Lockout Warning */}
            {isPinLocked && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <Lock className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  PIN locked for {lockoutInfo.remainingMinutes} minutes
                </p>
              </div>
            )}

            {/* No PIN Warning */}
            {hasPinConfigured === false && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  PIN not configured. Connect to internet to switch stores.
                </p>
              </div>
            )}

            {/* Store List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cachedStores.map((store) => {
                const isSelected = selectedStoreId === store.storeId;
                const isCurrent = store.storeId === currentStoreId;

                return (
                  <button
                    key={store.storeId}
                    type="button"
                    onClick={() => handleStoreClick(store.storeId)}
                    className={`
                      w-full p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-purple-600 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {store.storeName}
                          </h3>
                          {isCurrent && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                              Current
                            </span>
                          )}
                        </div>
                        {store.address && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{store.address}</span>
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Error display */}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={handleSwitchClick}
                disabled={!selectedStoreId || isLoading || isPinLocked || hasPinConfigured === false}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Switching...
                  </>
                ) : isSelectedStoreCurrent ? (
                  'Close'
                ) : (
                  'Switch Store'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinVerification}
        onClose={handlePinVerificationClose}
        onSuccess={handlePinVerified}
        memberId={memberId}
        actionDescription={`Verify to switch to ${cachedStores.find(s => s.storeId === selectedStoreId)?.storeName || 'store'}`}
        title="Verify PIN to Switch Store"
      />
    </>
  );
}

export default OfflineStoreSwitcher;
