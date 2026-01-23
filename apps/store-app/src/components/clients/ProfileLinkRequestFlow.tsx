/**
 * ProfileLinkRequestFlow - Manage profile link requests
 *
 * Shows pending link requests for the current store:
 * - Incoming requests (from other stores wanting to link to our clients)
 * - Outgoing requests (we've requested from other stores)
 *
 * Part of: Client Module Phase 5 - Multi-Store Client Sharing
 * Reference: docs/architecture/MULTI_STORE_CLIENT_SPEC.md
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchLinkRequests,
  respondToLinkRequest,
} from '@/store/slices/clientsSlice/multiStoreThunks';
import type { ProfileLinkRequest, LinkRequestStatus } from '@/types/client';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/spinner';

// ==================== ICONS ====================

const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const InboxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);

// ==================== TYPES ====================

type Tab = 'incoming' | 'outgoing';

interface ProfileLinkRequestFlowProps {
  /** Callback when a request is processed */
  onRequestProcessed?: () => void;
  /** Additional CSS classes */
  className?: string;
}

interface ConfirmDialogState {
  isOpen: boolean;
  request: ProfileLinkRequest | null;
  action: 'approve' | 'reject' | null;
}

// ==================== HELPER FUNCTIONS ====================

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) return 'Expired';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
};

const getStatusBadge = (status: LinkRequestStatus): { color: string; label: string } => {
  switch (status) {
    case 'pending':
      return { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' };
    case 'approved':
      return { color: 'bg-green-100 text-green-700', label: 'Approved' };
    case 'rejected':
      return { color: 'bg-red-100 text-red-700', label: 'Rejected' };
    case 'expired':
      return { color: 'bg-gray-100 text-gray-700', label: 'Expired' };
    default:
      return { color: 'bg-gray-100 text-gray-700', label: 'Unknown' };
  }
};

// ==================== MAIN COMPONENT ====================

export const ProfileLinkRequestFlow: React.FC<ProfileLinkRequestFlowProps> = ({
  onRequestProcessed,
  className = '',
}) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<Tab>('incoming');
  const [incomingRequests, setIncomingRequests] = useState<ProfileLinkRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ProfileLinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    request: null,
    action: null,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load requests
  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [incomingResult, outgoingResult] = await Promise.all([
        dispatch(fetchLinkRequests({ type: 'incoming' })).unwrap(),
        dispatch(fetchLinkRequests({ type: 'outgoing' })).unwrap(),
      ]);

      setIncomingRequests(incomingResult);
      setOutgoingRequests(outgoingResult);
    } catch (err) {
      console.error('[ProfileLinkRequestFlow] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Load on mount
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Open confirmation dialog
  const openConfirmDialog = (request: ProfileLinkRequest, action: 'approve' | 'reject') => {
    setConfirmDialog({ isOpen: true, request, action });
  };

  // Close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, request: null, action: null });
  };

  // Handle approve/reject
  const handleResponse = async () => {
    if (!confirmDialog.request || !confirmDialog.action) return;

    setProcessingId(confirmDialog.request.id);
    closeConfirmDialog();

    try {
      await dispatch(
        respondToLinkRequest({
          requestId: confirmDialog.request.id,
          action: confirmDialog.action,
        })
      ).unwrap();

      setSuccessMessage(
        confirmDialog.action === 'approve'
          ? 'Link request approved! Client data will now be shared.'
          : 'Link request rejected.'
      );

      // Refresh the list
      await loadRequests();
      onRequestProcessed?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('[ProfileLinkRequestFlow] Response error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process request');
    } finally {
      setProcessingId(null);
    }
  };

  // Get current tab's requests
  const currentRequests = activeTab === 'incoming' ? incomingRequests : outgoingRequests;
  const pendingIncoming = incomingRequests.filter(r => r.status === 'pending');

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Profile Link Requests</h3>
            <p className="text-sm text-gray-500">Manage requests to share client data between stores</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadRequests}
          disabled={loading}
          className="gap-2"
        >
          <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${activeTab === 'incoming'
              ? 'bg-cyan-100 text-cyan-700'
              : 'text-gray-600 hover:bg-gray-100'
            }
          `}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Incoming
          {pendingIncoming.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
              {pendingIncoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${activeTab === 'outgoing'
              ? 'bg-cyan-100 text-cyan-700'
              : 'text-gray-600 hover:bg-gray-100'
            }
          `}
        >
          <ArrowRightIcon className="w-4 h-4" />
          Outgoing
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mx-6 my-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckIcon className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mx-6 my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <XIcon className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && currentRequests.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-500">
            <Spinner className="w-5 h-5" />
            <span>Loading requests...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && currentRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <InboxIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-1">No requests</h4>
          <p className="text-sm text-gray-500 max-w-sm">
            {activeTab === 'incoming'
              ? 'No incoming link requests from other stores.'
              : 'You haven\'t sent any link requests to other stores.'}
          </p>
        </div>
      )}

      {/* Request List */}
      {currentRequests.length > 0 && (
        <div className="divide-y divide-gray-100">
          {currentRequests.map((request) => {
            const statusBadge = getStatusBadge(request.status);
            const isProcessing = processingId === request.id;
            const isPending = request.status === 'pending';
            const isExpired = new Date(request.expiresAt) < new Date();

            return (
              <div
                key={request.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Request Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Direction Icon */}
                    <div
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${activeTab === 'incoming' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}
                      `}
                    >
                      {activeTab === 'incoming' ? (
                        <ArrowLeftIcon className="w-5 h-5" />
                      ) : (
                        <ArrowRightIcon className="w-5 h-5" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {request.requestingStoreName || 'Unknown Store'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </div>

                      <div className="mt-1 text-sm text-gray-500 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" />
                          <span>Requested: {formatDate(request.requestedAt)}</span>
                        </div>
                        {isPending && !isExpired && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <ClockIcon className="w-3.5 h-3.5" />
                            <span>{getTimeRemaining(request.expiresAt)}</span>
                          </div>
                        )}
                        {request.respondedAt && (
                          <div className="flex items-center gap-1">
                            <CheckIcon className="w-3.5 h-3.5" />
                            <span>Responded: {formatDate(request.respondedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions - Only for incoming pending requests */}
                  {activeTab === 'incoming' && isPending && !isExpired && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openConfirmDialog(request, 'approve')}
                        disabled={isProcessing}
                        className="gap-1"
                      >
                        {isProcessing ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          <CheckIcon className="w-4 h-4" />
                        )}
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfirmDialog(request, 'reject')}
                        disabled={isProcessing}
                        className="gap-1"
                      >
                        <XIcon className="w-4 h-4" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {/* Expired badge */}
                  {isPending && isExpired && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                      Expired
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && confirmDialog.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmDialog.action === 'approve' ? 'Approve Link Request?' : 'Reject Link Request?'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirmDialog.action === 'approve' ? (
                <>
                  This will allow <strong>{confirmDialog.request.requestingStoreName}</strong> to access
                  safety data (allergies, blocked status) for clients linked to this identity.
                  Other data sharing depends on the client's preferences.
                </>
              ) : (
                <>
                  This will reject the link request from <strong>{confirmDialog.request.requestingStoreName}</strong>.
                  They will not be able to access any client data.
                </>
              )}
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeConfirmDialog}
              >
                Cancel
              </Button>
              <Button
                variant={confirmDialog.action === 'approve' ? 'default' : 'destructive'}
                size="sm"
                onClick={handleResponse}
              >
                {confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileLinkRequestFlow;
