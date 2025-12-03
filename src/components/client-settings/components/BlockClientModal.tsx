import React, { useState } from 'react';
import type { BlockReason } from '../../../types';
import { Button } from './SharedComponents';

interface BlockClientModalProps {
  clientName: string;
  isBlocked: boolean;
  currentReason?: BlockReason;
  currentNote?: string;
  onBlock: (reason: BlockReason, note?: string) => void;
  onUnblock: () => void;
  onClose: () => void;
}

const BLOCK_REASONS: { value: BlockReason; label: string; description: string }[] = [
  {
    value: 'no_show',
    label: 'Repeated No-Shows',
    description: 'Client has multiple no-show appointments',
  },
  {
    value: 'late_cancellation',
    label: 'Late Cancellations',
    description: 'Client frequently cancels at the last minute',
  },
  {
    value: 'non_payment',
    label: 'Payment Issues',
    description: 'Outstanding balance or payment disputes',
  },
  {
    value: 'inappropriate_behavior',
    label: 'Inappropriate Behavior',
    description: 'Disruptive, rude, or inappropriate conduct',
  },
  {
    value: 'other',
    label: 'Other Concern',
    description: 'Safety risk to staff or other clients',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason (specify in notes)',
  },
];

export const BlockClientModal: React.FC<BlockClientModalProps> = ({
  clientName,
  isBlocked,
  currentReason,
  currentNote,
  onBlock,
  onUnblock,
  onClose,
}) => {
  const [selectedReason, setSelectedReason] = useState<BlockReason | null>(currentReason || null);
  const [note, setNote] = useState(currentNote || '');
  const [confirmUnblock, setConfirmUnblock] = useState(false);

  const handleBlock = () => {
    if (!selectedReason) return;
    onBlock(selectedReason, note.trim() || undefined);
  };

  const handleUnblock = () => {
    if (!confirmUnblock) {
      setConfirmUnblock(true);
      return;
    }
    onUnblock();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 ${isBlocked ? 'bg-red-50' : 'bg-gray-50'} border-b border-gray-200`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBlocked ? 'bg-red-100' : 'bg-gray-200'}`}>
                {isBlocked ? (
                  <BlockIcon className="w-5 h-5 text-red-600" />
                ) : (
                  <ShieldIcon className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {isBlocked ? 'Manage Blocked Client' : 'Block Client'}
                </h2>
                <p className="text-sm text-gray-500">{clientName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isBlocked ? (
            // Unblock flow
            <div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <WarningIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">This client is currently blocked</p>
                    <p className="text-sm text-red-600 mt-1">
                      Reason: {BLOCK_REASONS.find(r => r.value === currentReason)?.label || 'Unknown'}
                    </p>
                    {currentNote && (
                      <p className="text-sm text-red-600 mt-1">Note: {currentNote}</p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Blocked clients cannot book appointments. Unblocking will allow them to book again.
              </p>

              {confirmUnblock && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800">
                    Are you sure you want to unblock this client? They will be able to book appointments again.
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Block flow
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Blocking a client prevents them from booking appointments. This action can be reversed.
              </p>

              {/* Reason Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for blocking <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {BLOCK_REASONS.map((reason) => (
                    <label
                      key={reason.value}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                        ${selectedReason === reason.value
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="blockReason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={() => setSelectedReason(reason.value)}
                        className="mt-0.5 text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{reason.label}</p>
                        <p className="text-sm text-gray-500">{reason.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional notes (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any additional context or details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {isBlocked ? (
            <Button
              variant={confirmUnblock ? 'primary' : 'secondary'}
              onClick={handleUnblock}
            >
              {confirmUnblock ? 'Confirm Unblock' : 'Unblock Client'}
            </Button>
          ) : (
            <button
              onClick={handleBlock}
              disabled={!selectedReason}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${selectedReason
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Block Client
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Icons
const BlockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default BlockClientModal;
