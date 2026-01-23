/**
 * EcosystemLookupPrompt - Check if a client exists in the Mango network
 *
 * Displays when creating a new client to check if they have visited
 * other Mango locations. Privacy-preserving - only shows that a match exists,
 * not which stores the client has visited.
 *
 * Part of: Client Module Phase 5 - Multi-Store Client Sharing
 * Reference: docs/architecture/MULTI_STORE_CLIENT_SPEC.md
 */

import React, { useState, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { lookupEcosystemIdentity, requestProfileLink } from '@/store/slices/clientsSlice/multiStoreThunks';
import type { EcosystemLookupResult } from '@/types/client';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/spinner';

// ==================== ICONS ====================

const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ==================== TYPES ====================

type LookupState = 'idle' | 'loading' | 'found' | 'not-found' | 'error' | 'requesting' | 'requested';

interface EcosystemLookupPromptProps {
  /** Phone number to lookup */
  phone?: string;
  /** Email to lookup */
  email?: string;
  /** Callback when link is requested */
  onLinkRequested?: (identityId: string, requestId: string) => void;
  /** Callback when user dismisses the prompt */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// ==================== MAIN COMPONENT ====================

export const EcosystemLookupPrompt: React.FC<EcosystemLookupPromptProps> = ({
  phone,
  email,
  onLinkRequested,
  onDismiss,
  className = '',
}) => {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<LookupState>('idle');
  const [lookupResult, setLookupResult] = useState<EcosystemLookupResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Only show if we have at least one identifier
  const hasIdentifier = Boolean(phone || email);

  // Perform ecosystem lookup
  const handleLookup = useCallback(async () => {
    if (!hasIdentifier) return;

    setState('loading');
    setErrorMessage(null);

    try {
      const result = await dispatch(
        lookupEcosystemIdentity({ phone, email })
      ).unwrap();

      setLookupResult(result);
      setState(result.exists ? 'found' : 'not-found');
    } catch (error) {
      console.error('[EcosystemLookupPrompt] Lookup error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to check network');
      setState('error');
    }
  }, [dispatch, phone, email, hasIdentifier]);

  // Request profile link
  const handleRequestLink = useCallback(async () => {
    if (!lookupResult?.identityId || !lookupResult.canRequest) return;

    setState('requesting');
    setErrorMessage(null);

    try {
      const result = await dispatch(
        requestProfileLink({ identityId: lookupResult.identityId })
      ).unwrap();

      setState('requested');
      onLinkRequested?.(lookupResult.identityId, result.requestId);
    } catch (error) {
      console.error('[EcosystemLookupPrompt] Request link error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to request link');
      setState('error');
    }
  }, [dispatch, lookupResult, onLinkRequested]);

  // Don't render if no identifier
  if (!hasIdentifier) {
    return null;
  }

  return (
    <div className={`rounded-lg border ${className}`}>
      {/* Idle State - Show lookup button */}
      {state === 'idle' && (
        <div className="p-4 bg-gray-50 border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <GlobeIcon className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900">
                Check Mango Network
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                See if this client has visited other Mango locations to share their profile information.
              </p>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLookup}
                  className="gap-2"
                >
                  <GlobeIcon className="w-4 h-4" />
                  Check Network
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {state === 'loading' && (
        <div className="p-4 bg-gray-50 border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Spinner className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Checking Mango network...</p>
            </div>
          </div>
        </div>
      )}

      {/* Found - Client exists in network */}
      {state === 'found' && lookupResult && (
        <div className="p-4 bg-cyan-50 border-cyan-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-cyan-900">
                Client Found in Network
              </h4>
              <p className="text-xs text-cyan-700 mt-1">
                This client may have visited other Mango locations.
                {lookupResult.linkedStoresCount && lookupResult.linkedStoresCount > 0 && (
                  <span className="font-medium"> They have {lookupResult.linkedStoresCount} linked store{lookupResult.linkedStoresCount > 1 ? 's' : ''}.</span>
                )}
              </p>

              {/* Show request link option if allowed */}
              {lookupResult.canRequest && (
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleRequestLink}
                    className="gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Request Profile Link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                  >
                    Skip
                  </Button>
                </div>
              )}

              {/* Can't request - show info */}
              {!lookupResult.canRequest && (
                <div className="mt-3 flex items-center gap-2 text-xs text-cyan-600">
                  <InfoIcon className="w-4 h-4" />
                  <span>Client has not opted in to profile sharing</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Not Found - No match in network */}
      {state === 'not-found' && (
        <div className="p-4 bg-gray-50 border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <GlobeIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-700">
                No Match Found
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                This appears to be a new client to the Mango network. You can continue creating their profile.
              </p>
              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requesting Link */}
      {state === 'requesting' && (
        <div className="p-4 bg-cyan-50 border-cyan-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <Spinner className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-cyan-700">Sending link request...</p>
            </div>
          </div>
        </div>
      )}

      {/* Link Requested Successfully */}
      {state === 'requested' && (
        <div className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-green-900">
                Link Request Sent
              </h4>
              <p className="text-xs text-green-700 mt-1">
                The other location will be notified. If approved, their client data will be shared with your store. The request expires in 24 hours.
              </p>
              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <XCircleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-red-900">
                Unable to Check Network
              </h4>
              <p className="text-xs text-red-700 mt-1">
                {errorMessage || 'An error occurred while checking the network.'}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLookup}
                >
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                >
                  Skip
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcosystemLookupPrompt;
