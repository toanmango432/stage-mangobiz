import React, { useState } from 'react';

interface BlockedClientOverrideModalProps {
  clientId: string;
  clientName: string;
  blockReason: string;
  onOverride: (overrideReason: string, managerApproved: boolean) => void;
  onCancel: () => void;
}

/**
 * Modal displayed when staff attempts to book a blocked client.
 * Requires override reason and manager approval before proceeding.
 */
export const BlockedClientOverrideModal: React.FC<BlockedClientOverrideModalProps> = ({
  clientId,
  clientName,
  blockReason,
  onOverride,
  onCancel,
}) => {
  const [overrideReason, setOverrideReason] = useState('');
  const [managerApproved, setManagerApproved] = useState(false);

  const handleProceed = () => {
    if (!overrideReason.trim()) return;
    onOverride(overrideReason.trim(), managerApproved);
  };

  const canProceed = overrideReason.trim().length > 0 && managerApproved;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100">
                <WarningIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Blocked Client Warning
                </h2>
                <p className="text-sm text-gray-500">{clientName}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Block Reason Display */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <BlockIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">This client is blocked</p>
                <p className="text-sm text-red-600 mt-1">
                  Reason: {blockReason || 'No reason specified'}
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            To proceed with booking for this blocked client, you must provide a reason
            and confirm manager approval.
          </p>

          {/* Override Reason Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Override reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Explain why this booking should be allowed despite the block..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              data-testid="override-reason-input"
            />
          </div>

          {/* Manager Approval Checkbox */}
          <div className="mb-4">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={managerApproved}
                onChange={(e) => setManagerApproved(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-amber-600 focus:ring-amber-500 rounded"
                data-testid="manager-approval-checkbox"
              />
              <div>
                <p className="font-medium text-gray-900">Manager approval confirmed</p>
                <p className="text-sm text-gray-500">
                  I confirm that a manager has approved this override.
                </p>
              </div>
            </label>
          </div>

          {/* Hidden client ID for form submission */}
          <input type="hidden" data-client-id={clientId} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            disabled={!canProceed}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${canProceed
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
            data-testid="proceed-button"
          >
            Proceed with Booking
          </button>
        </div>
      </div>
    </div>
  );
};

// Icons
const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BlockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

export default BlockedClientOverrideModal;
