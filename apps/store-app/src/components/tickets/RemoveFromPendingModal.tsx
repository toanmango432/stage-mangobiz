import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export type RemoveReason = 'client_left' | 'cancelled' | 'other';

interface RemoveFromPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: RemoveReason, notes?: string) => void;
  ticketNumber?: number;
  clientName?: string;
}

const REASON_OPTIONS: { value: RemoveReason; label: string; description: string }[] = [
  { value: 'client_left', label: 'Client Left', description: 'Client left without paying' },
  { value: 'cancelled', label: 'Cancelled', description: 'Service was cancelled' },
  { value: 'other', label: 'Other', description: 'Other reason' },
];

export function RemoveFromPendingModal({
  isOpen,
  onClose,
  onConfirm,
  ticketNumber,
  clientName,
}: RemoveFromPendingModalProps) {
  const [selectedReason, setSelectedReason] = useState<RemoveReason | null>(null);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm(selectedReason, notes.trim() || undefined);
    // Reset state
    setSelectedReason(null);
    setNotes('');
    onClose();
  };

  const handleClose = () => {
    setSelectedReason(null);
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-red-50 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-900">Remove from Pending</h3>
              {ticketNumber && clientName && (
                <p className="text-sm text-red-700">
                  Ticket #{ticketNumber} • {clientName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-red-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-gray-600 text-sm">
            Please select a reason for removing this ticket from pending payments. This action will be logged for audit purposes.
          </p>

          {/* Reason selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Reason *</label>
            <div className="space-y-2">
              {REASON_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedReason === option.value
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="remove-reason"
                    value={option.value}
                    checked={selectedReason === option.value}
                    onChange={() => setSelectedReason(option.value)}
                    className="mt-0.5 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <div>
                    <span className="block font-medium text-gray-900">{option.label}</span>
                    <span className="block text-sm text-gray-500">{option.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notes (optional) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Additional Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedReason}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            Remove Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
