/**
 * BookingActions - Bottom action bar with total, validation, and buttons
 */

import { AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface BookingActionsProps {
  totalDuration: number;
  totalPrice: number;
  validationMessage: string | null;
  canBook: boolean;
  isBooking: boolean;
  hasServices: boolean;
  onCancel: () => void;
  onBook: () => void;
}

export function BookingActions({
  totalDuration,
  totalPrice,
  validationMessage,
  canBook,
  isBooking,
  hasServices,
  onCancel,
  onBook,
}: BookingActionsProps) {
  return (
    <div className="p-5 border-t border-gray-200 space-y-3 bg-white">
      {/* Total Display */}
      {hasServices && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">Total</span>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-500">{totalDuration} minutes</div>
              <div className="font-bold text-gray-900 text-xl">${totalPrice}</div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Message */}
      {validationMessage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-900">{validationMessage}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2.5">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onBook}
          disabled={!canBook || isBooking}
          className={cn(
            'flex-1 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all relative overflow-hidden',
            canBook && !isBooking
              ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/35 active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {isBooking ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Booking...
            </span>
          ) : (
            'Book Appointment'
          )}
        </button>
      </div>
    </div>
  );
}
