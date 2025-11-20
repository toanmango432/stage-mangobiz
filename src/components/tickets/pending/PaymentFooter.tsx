import { CheckCircle, X } from 'lucide-react';

interface PaymentFooterProps {
  ticketId: string;
  onMarkPaid: (id: string) => void;
  onCancel?: (id: string) => void;
}

/**
 * PaymentFooter Component
 *
 * Displays action buttons: Cancel and Mark Paid
 * Simplified design without payment type badges (payment method chosen during payment)
 */
export function PaymentFooter({ ticketId, onMarkPaid, onCancel }: PaymentFooterProps) {
  return (
    <div className="mt-auto mx-2 sm:mx-3 md:mx-4 mb-2 sm:mb-2.5 md:mb-3 px-2 sm:px-3 py-1.5 sm:py-2 md:py-2.5 flex items-center gap-2">
      {/* Cancel Button */}
      {onCancel && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel(ticketId);
          }}
          className="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          title="Cancel"
          aria-label={`Cancel ticket ${ticketId}`}
        >
          <X size={14} className="sm:w-4 sm:h-4" />
          Cancel
        </button>
      )}

      {/* Mark Paid Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMarkPaid(ticketId);
        }}
        className="flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
        title="Mark as Paid"
        aria-label={`Mark ticket ${ticketId} as paid`}
      >
        <CheckCircle size={14} className="sm:w-4 sm:h-4" />
        Mark Paid
      </button>
    </div>
  );
}
