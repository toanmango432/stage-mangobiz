/**
 * StoreSelectionModal Component
 *
 * A modal for selecting which store to work in after login for multi-store users.
 * Shows the list of stores the user has access to and allows them to set a default.
 *
 * If the user has only one store, this modal does NOT show (auto-select).
 * If the user has a default store set, it will be pre-highlighted but they can change it.
 *
 * @example
 * ```tsx
 * <StoreSelectionModal
 *   isOpen={showStoreSelection}
 *   onSelect={(storeId) => handleStoreSelected(storeId)}
 *   stores={userStores}
 *   memberId="member-123"
 *   defaultStoreId="store-456"
 * />
 * ```
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Loader2, Store as StoreIcon, MapPin, Star, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { memberAuthService } from '@/services/memberAuthService';

/**
 * Store information for display in the modal
 */
export interface StoreInfo {
  /** Unique store identifier */
  storeId: string;
  /** Store display name */
  storeName: string;
  /** Store address (optional) */
  address?: string;
  /** Store login ID (for display if needed) */
  storeLoginId?: string;
  /** Tenant ID */
  tenantId?: string;
  /** Subscription tier */
  tier?: string;
  /** Store timezone */
  timezone?: string;
}

/** Props for StoreSelectionModal component */
export interface StoreSelectionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when a store is selected - receives the selected store ID */
  onSelect: (storeId: string) => void;
  /** List of stores the user has access to */
  stores: StoreInfo[];
  /** Member ID for saving default preference */
  memberId: string;
  /** Currently set default store ID (optional) */
  defaultStoreId?: string | null;
}

/**
 * Modal component for multi-store users to select which store to work in.
 *
 * Features:
 * - Shows list of accessible stores
 * - Pre-highlights default store if set
 * - Option to "Set as my default store"
 * - Remember my choice toggle for session-only vs persistent selection
 * - Auto-selects if user has only one store (caller should handle this case)
 */
export function StoreSelectionModal({
  isOpen,
  onSelect,
  stores,
  memberId,
  defaultStoreId,
}: StoreSelectionModalProps) {
  // Selected store ID (pre-select default or first store)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  // Whether to set this as the default store
  const [setAsDefault, setSetAsDefault] = useState(false);
  // Whether to remember the choice (always for default, toggle for session-only)
  const [rememberChoice, setRememberChoice] = useState(false);
  // Loading state during selection
  const [isLoading, setIsLoading] = useState(false);
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Pre-select default store or first store when modal opens
  useEffect(() => {
    if (isOpen && stores.length > 0) {
      if (defaultStoreId && stores.some(s => s.storeId === defaultStoreId)) {
        setSelectedStoreId(defaultStoreId);
      } else {
        setSelectedStoreId(stores[0].storeId);
      }
      setSetAsDefault(false);
      setRememberChoice(false);
      setError(null);
    }
  }, [isOpen, stores, defaultStoreId]);

  // Memoized check for whether selected store is the current default
  const isSelectedStoreDefault = useMemo(() => {
    return selectedStoreId === defaultStoreId;
  }, [selectedStoreId, defaultStoreId]);

  // Handle store selection
  const handleStoreClick = useCallback((storeId: string) => {
    setSelectedStoreId(storeId);
    setError(null);
  }, []);

  // Handle continue button click
  const handleContinue = useCallback(async () => {
    if (!selectedStoreId) {
      setError('Please select a store to continue');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // If "Set as default" is checked, save the default preference
      if (setAsDefault && !isSelectedStoreDefault) {
        await memberAuthService.setDefaultStore(memberId, selectedStoreId);
      }

      // Call the onSelect callback with the selected store ID
      onSelect(selectedStoreId);
    } catch (err) {
      console.error('Error saving store preference:', err);
      // Still proceed with selection even if saving default fails
      onSelect(selectedStoreId);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStoreId, setAsDefault, isSelectedStoreDefault, memberId, onSelect]);

  // Render nothing if only one store (should be handled by caller, but just in case)
  if (stores.length <= 1) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg"
        // Prevent closing by clicking outside or pressing escape
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <StoreIcon className="w-5 h-5 text-purple-600" />
            Select a Store
          </DialogTitle>
          <DialogDescription className="text-center">
            You have access to multiple stores. Select one to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          {/* Store List */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {stores.map((store) => {
              const isSelected = selectedStoreId === store.storeId;
              const isDefault = store.storeId === defaultStoreId;

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
                        {isDefault && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </span>
                        )}
                      </div>
                      {store.address && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{store.address}</span>
                        </p>
                      )}
                      {store.tier && (
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 capitalize">
                          {store.tier} plan
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

          {/* Options */}
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            {/* Set as default checkbox - only show if not already the default */}
            {!isSelectedStoreDefault && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Set as my default store
                </span>
              </label>
            )}

            {/* Remember my choice toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberChoice || setAsDefault}
                onChange={(e) => setRememberChoice(e.target.checked)}
                disabled={setAsDefault}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className={`text-sm ${setAsDefault ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                Remember my choice for this session
              </span>
            </label>
          </div>

          {/* Error display */}
          {error && (
            <p className="text-sm text-red-600 text-center">
              {error}
            </p>
          )}

          {/* Continue button */}
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={handleContinue}
            disabled={!selectedStoreId || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default StoreSelectionModal;
