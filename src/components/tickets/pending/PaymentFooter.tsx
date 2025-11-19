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
    <div className="mt-auto mx-2 sm:mx-3 mb-2 sm:mb-3 px-2 sm:px-3 py-2 sm:py-2.5 flex items-center gap-2">
      {/* Cancel Button */}
      {onCancel && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel(ticketId);
          }}
          className="flex-1 py-2 px-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          title="Cancel"
          aria-label={`Cancel ticket ${ticketId}`}
        >
          <X size={16} />
          Cancel
        </button>
      )}

      {/* Mark Paid Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMarkPaid(ticketId);
        }}
        className="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
        title="Mark as Paid"
        aria-label={`Mark ticket ${ticketId} as paid`}
      >
        <CheckCircle size={16} />
        Mark Paid
      </button>
    </div>
  );
}
