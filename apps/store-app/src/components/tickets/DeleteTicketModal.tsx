import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAppDispatch } from '@/store/hooks';
import { deleteTicket } from '@/store/slices/uiTicketsSlice';
import type { DeleteReason } from '@/types';

interface DeleteTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string | null;
  clientName?: string;
}

const DELETE_REASONS: { value: DeleteReason; label: string; helper?: string }[] = [
  {
    value: 'testing',
    label: 'Testing',
    helper: 'Will not be counted as client loss',
  },
  {
    value: 'client_left',
    label: 'Client Left',
  },
  {
    value: 'duplicate',
    label: 'Duplicate Ticket',
  },
  {
    value: 'mistake',
    label: 'Created by Mistake',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

export function DeleteTicketModal({
  isOpen,
  onClose,
  ticketId,
  clientName,
}: DeleteTicketModalProps) {
  const dispatch = useAppDispatch();
  const [selectedReason, setSelectedReason] = useState<DeleteReason | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedReason('');
      setNotes('');
      setIsSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason) {
      setError('Please select a reason for deletion');
      return;
    }

    if (!ticketId) {
      setError('Invalid ticket');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await dispatch(deleteTicket({
        ticketId,
        reason: selectedReason,
        note: notes.trim() || undefined,
      })).unwrap();

      onClose();
    } catch (err) {
      setError('Failed to delete ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="bg-gradient-to-r from-red-500/10 to-red-500/5 p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Trash2 className="mr-2 text-red-500" size={20} />
              Delete Ticket
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal body */}
          <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-4">
            <form onSubmit={handleSubmit}>
              {/* Warning message */}
              <div className="bg-red-50 p-3 rounded-md border border-red-200 flex mb-4">
                <AlertTriangle
                  size={16}
                  className="text-red-500 mr-2 flex-shrink-0 mt-0.5"
                />
                <div className="text-sm text-red-700">
                  <p className="font-medium">
                    Are you sure you want to delete this ticket?
                  </p>
                  {clientName && (
                    <p className="mt-1 text-red-600">
                      Client: <span className="font-medium">{clientName}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Reason selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Reason for deletion <span className="text-red-500">*</span>
                </label>
                <RadioGroup
                  value={selectedReason}
                  onValueChange={(value) => setSelectedReason(value as DeleteReason)}
                  className="space-y-3"
                >
                  {DELETE_REASONS.map((reason) => (
                    <div
                      key={reason.value}
                      className="flex items-start space-x-3"
                    >
                      <RadioGroupItem
                        value={reason.value}
                        id={reason.value}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={reason.value}
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          {reason.label}
                        </label>
                        {reason.helper && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {reason.helper}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label
                  htmlFor="notes"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Add any additional notes..."
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Form actions */}
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedReason}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} className="mr-1" />
                      Delete Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
