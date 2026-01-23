/**
 * LinkedStoresPanel - Display stores linked to a client's identity
 *
 * Shows list of stores that have linked profiles for a client,
 * with options to view shared data and unlink stores.
 *
 * Part of: Client Module Phase 5 - Multi-Store Client Sharing
 * Reference: docs/architecture/MULTI_STORE_CLIENT_SPEC.md
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { fetchLinkedStores } from '@/store/slices/clientsSlice/multiStoreThunks';
import { supabase } from '@/services/supabase/client';
import type { LinkedStore } from '@/types/client';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/spinner';

// ==================== ICONS ====================

const StoreIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const UnlinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" />
  </svg>
);

const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

// ==================== TYPES ====================

interface LinkedStoresPanelProps {
  /** Client ID to fetch linked stores for */
  clientId: string;
  /** Current store ID (to identify which link is "us") */
  currentStoreId?: string;
  /** Callback when unlink is completed */
  onUnlink?: (storeId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

interface UnlinkDialogState {
  isOpen: boolean;
  store: LinkedStore | null;
}

// ==================== HELPER FUNCTIONS ====================

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getAccessLevelLabel = (level: string): string => {
  switch (level) {
    case 'full':
      return 'Full Access';
    case 'basic':
      return 'Safety Only';
    default:
      return 'Limited';
  }
};

const getAccessLevelColor = (level: string): string => {
  switch (level) {
    case 'full':
      return 'bg-green-100 text-green-700';
    case 'basic':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// ==================== MAIN COMPONENT ====================

export const LinkedStoresPanel: React.FC<LinkedStoresPanelProps> = ({
  clientId,
  currentStoreId,
  onUnlink,
  className = '',
}) => {
  const dispatch = useAppDispatch();
  const [stores, setStores] = useState<LinkedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [unlinkDialog, setUnlinkDialog] = useState<UnlinkDialogState>({
    isOpen: false,
    store: null,
  });

  // Load linked stores
  const loadStores = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await dispatch(fetchLinkedStores({ clientId })).unwrap();
      setStores(result);
    } catch (err) {
      console.error('[LinkedStoresPanel] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load linked stores');
    } finally {
      setLoading(false);
    }
  }, [dispatch, clientId]);

  // Load on mount and when clientId changes
  useEffect(() => {
    if (clientId) {
      loadStores();
    }
  }, [clientId, loadStores]);

  // Open unlink confirmation dialog
  const openUnlinkDialog = (store: LinkedStore) => {
    setUnlinkDialog({ isOpen: true, store });
  };

  // Close unlink dialog
  const closeUnlinkDialog = () => {
    setUnlinkDialog({ isOpen: false, store: null });
  };

  // Handle unlink
  const handleUnlink = async () => {
    if (!unlinkDialog.store) return;

    const storeToUnlink = unlinkDialog.store;
    setUnlinking(storeToUnlink.id);
    closeUnlinkDialog();

    try {
      // Delete the linked_stores record
      const { error: deleteError } = await supabase
        .from('linked_stores')
        .delete()
        .eq('id', storeToUnlink.id);

      if (deleteError) {
        throw deleteError;
      }

      // Log the unlink action
      await supabase
        .from('ecosystem_consent_log')
        .insert({
          mango_identity_id: storeToUnlink.mangoIdentityId,
          action: 'unlink_store',
          details: {
            unlinkedStoreId: storeToUnlink.storeId,
            unlinkedStoreName: storeToUnlink.storeName,
          },
          created_at: new Date().toISOString(),
        });

      // Refresh the list
      await loadStores();
      onUnlink?.(storeToUnlink.storeId);
    } catch (err) {
      console.error('[LinkedStoresPanel] Unlink error:', err);
      setError(err instanceof Error ? err.message : 'Failed to unlink store');
    } finally {
      setUnlinking(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <Spinner className="w-5 h-5" />
          <span>Loading linked stores...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={loadStores}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (stores.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <GlobeIcon className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="text-sm font-medium text-gray-900 mb-1">No Linked Stores</h4>
          <p className="text-xs text-gray-500">
            This client is not linked to any other Mango locations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-cyan-600" />
          <h4 className="text-sm font-medium text-gray-900">Linked Stores</h4>
          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
            {stores.length}
          </span>
        </div>
      </div>

      {/* Store List */}
      <div className="divide-y divide-gray-100">
        {stores.map((store) => {
          const isCurrentStore = store.storeId === currentStoreId;
          const isUnlinking = unlinking === store.id;

          return (
            <div
              key={store.id}
              className="px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Store Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`
                    w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isCurrentStore ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                    <StoreIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm truncate">
                        {store.storeName}
                      </span>
                      {isCurrentStore && (
                        <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded">
                          This Store
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 text-xs rounded ${getAccessLevelColor(store.accessLevel)}`}>
                        {getAccessLevelLabel(store.accessLevel)}
                      </span>
                    </div>

                    {/* Shared Data Indicators */}
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1" title="Safety data shared">
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-green-500" />
                        <span>Safety</span>
                      </div>
                      {store.accessLevel === 'full' && (
                        <>
                          <div className="flex items-center gap-1" title="Loyalty data shared">
                            <StarIcon className="w-3.5 h-3.5 text-yellow-500" />
                            <span>Loyalty</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Link Date */}
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <CalendarIcon className="w-3 h-3" />
                      <span>Linked: {formatDate(store.linkedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Unlink Button - Only for other stores */}
                {!isCurrentStore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openUnlinkDialog(store)}
                    disabled={isUnlinking}
                    className="text-gray-500 hover:text-red-600"
                  >
                    {isUnlinking ? (
                      <Spinner className="w-4 h-4" />
                    ) : (
                      <UnlinkIcon className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
        Safety data (allergies, blocks) is always shared between linked stores.
      </div>

      {/* Unlink Confirmation Dialog */}
      {unlinkDialog.isOpen && unlinkDialog.store && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unlink Store?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This will remove the link between this client and <strong>{unlinkDialog.store.storeName}</strong>.
              They will no longer be able to see this client's safety data or other shared information.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeUnlinkDialog}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUnlink}
              >
                Unlink Store
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedStoresPanel;
