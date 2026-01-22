import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchDataRequests,
  updateDataRequestStatus,
  exportClientData,
} from '../../store/slices/clientsSlice';
import type {
  ClientDataRequest,
  DataRequestStatus,
  DataRequestType,
} from '../../types';

// ==================== ICONS ====================

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const DocumentTextIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// ==================== TYPES ====================

interface DataRequestsPanelProps {
  storeId: string;
  onProcessDeletion?: (request: ClientDataRequest) => void;
  className?: string;
}

type StatusFilter = 'all' | DataRequestStatus;

// ==================== HELPER FUNCTIONS ====================

const getRequestTypeIcon = (type: DataRequestType): React.ReactNode => {
  switch (type) {
    case 'export':
      return <DownloadIcon className="w-4 h-4" />;
    case 'delete':
      return <TrashIcon className="w-4 h-4" />;
    case 'access':
      return <EyeIcon className="w-4 h-4" />;
    default:
      return <DocumentTextIcon className="w-4 h-4" />;
  }
};

const getRequestTypeLabel = (type: DataRequestType): string => {
  switch (type) {
    case 'export':
      return 'Data Export';
    case 'delete':
      return 'Data Deletion';
    case 'access':
      return 'Data Access';
    default:
      return 'Unknown';
  }
};

const getStatusBadge = (status: DataRequestStatus): { variant: 'default' | 'warning' | 'success' | 'error'; label: string } => {
  switch (status) {
    case 'pending':
      return { variant: 'warning', label: 'Pending' };
    case 'processing':
      return { variant: 'default', label: 'Processing' };
    case 'completed':
      return { variant: 'success', label: 'Completed' };
    case 'rejected':
      return { variant: 'error', label: 'Rejected' };
    default:
      return { variant: 'default', label: 'Unknown' };
  }
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ==================== SUBCOMPONENTS ====================

interface BadgeProps {
  variant: 'default' | 'warning' | 'success' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ variant, children, className = '' }) => {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  icon,
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 gap-2';

  const variantStyles = {
    primary: 'bg-cyan-600 text-white hover:bg-cyan-700 disabled:bg-cyan-300',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
    ghost: 'text-gray-600 hover:bg-gray-100 disabled:text-gray-400',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
};

// ==================== MAIN COMPONENT ====================

export const DataRequestsPanel: React.FC<DataRequestsPanelProps> = ({
  storeId,
  onProcessDeletion,
  className = '',
}) => {
  const dispatch = useAppDispatch();
  const [requests, setRequests] = useState<ClientDataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch data requests on mount and when storeId changes
  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await dispatch(
          fetchDataRequests({ storeId })
        ).unwrap();
        setRequests(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data requests');
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      loadRequests();
    }
  }, [dispatch, storeId]);

  // Filter requests by status
  const filteredRequests = statusFilter === 'all'
    ? requests
    : requests.filter((r) => r.status === statusFilter);

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dispatch(
        fetchDataRequests({ storeId })
      ).unwrap();
      setRequests(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data requests');
    } finally {
      setLoading(false);
    }
  };

  // Handle process export request
  const handleProcessExport = async (request: ClientDataRequest) => {
    setProcessingId(request.id);
    try {
      // Update status to processing
      await dispatch(
        updateDataRequestStatus({
          requestId: request.id,
          status: 'processing',
        })
      ).unwrap();

      // Trigger export
      const exportResult = await dispatch(
        exportClientData({
          clientId: request.clientId,
          storeId: request.storeId,
          requestId: request.id,
        })
      ).unwrap();

      // Update request with export URL
      await dispatch(
        updateDataRequestStatus({
          requestId: request.id,
          status: 'completed',
          exportUrl: exportResult.downloadUrl,
        })
      ).unwrap();

      // Refresh the list
      await handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process export request');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject request
  const handleReject = async (request: ClientDataRequest) => {
    setProcessingId(request.id);
    try {
      await dispatch(
        updateDataRequestStatus({
          requestId: request.id,
          status: 'rejected',
        })
      ).unwrap();
      await handleRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle process deletion - delegate to parent
  const handleProcessDeletion = (request: ClientDataRequest) => {
    if (onProcessDeletion) {
      onProcessDeletion(request);
    }
  };

  // Status filter options
  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
  ];

  // Loading state
  if (loading && requests.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Data Requests</h3>
          <p className="text-sm text-gray-500 mt-0.5">GDPR/CCPA compliance requests</p>
        </div>
        <div className="p-6 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <RefreshIcon className="w-5 h-5 animate-spin" />
            <span>Loading data requests...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Data Requests</h3>
          <p className="text-sm text-gray-500 mt-0.5">GDPR/CCPA compliance requests</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          icon={<RefreshIcon className={loading ? 'animate-spin' : ''} />}
        >
          Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 overflow-x-auto">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors
              ${statusFilter === option.value
                ? 'bg-cyan-100 text-cyan-700'
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            {option.label}
            {option.value === 'pending' && requests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                {requests.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="mx-6 my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Error loading requests</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No data requests</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            {statusFilter === 'all'
              ? 'No data requests have been submitted yet. Requests will appear here when clients request their data.'
              : `No ${statusFilter} requests found.`}
          </p>
        </div>
      )}

      {/* Request list */}
      {filteredRequests.length > 0 && (
        <div className="divide-y divide-gray-100">
          {filteredRequests.map((request) => {
            const statusBadge = getStatusBadge(request.status);
            const isProcessing = processingId === request.id;

            return (
              <div
                key={request.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Request info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Type icon */}
                    <div
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${request.requestType === 'delete' ? 'bg-red-100 text-red-600' : 'bg-cyan-100 text-cyan-600'}
                      `}
                    >
                      {getRequestTypeIcon(request.requestType)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {getRequestTypeLabel(request.requestType)}
                        </span>
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </div>

                      <div className="mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" />
                          Requested: {formatDate(request.requestedAt)}
                        </span>
                        {request.processedAt && (
                          <span className="flex items-center gap-1 mt-0.5">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            Processed: {formatDate(request.processedAt)}
                          </span>
                        )}
                      </div>

                      {request.notes && (
                        <p className="mt-2 text-sm text-gray-600 italic">
                          Note: {request.notes}
                        </p>
                      )}

                      {/* Export download link */}
                      {request.status === 'completed' && request.exportUrl && (
                        <a
                          href={request.exportUrl}
                          download
                          className="inline-flex items-center gap-1 mt-2 text-sm text-cyan-600 hover:text-cyan-700"
                        >
                          <DownloadIcon className="w-4 h-4" />
                          Download Export
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      {request.requestType === 'export' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleProcessExport(request)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : 'Process'}
                        </Button>
                      )}
                      {request.requestType === 'delete' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleProcessDeletion(request)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : 'Process'}
                        </Button>
                      )}
                      {request.requestType === 'access' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleProcessExport(request)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : 'View Data'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReject(request)}
                        disabled={isProcessing}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DataRequestsPanel;
