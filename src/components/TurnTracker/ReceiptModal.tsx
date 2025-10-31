import { X } from 'lucide-react';
import { TurnEntry } from './TurnTracker';

interface ReceiptModalProps {
  turnLog: TurnEntry;
  onClose: () => void;
}

export function ReceiptModal({ turnLog, onClose }: ReceiptModalProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[80]" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-[90] p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-bold">Receipt Details</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Receipt Content */}
          <div className="p-6 text-center">
            <div className="mb-6">
              <div className="text-4xl mb-2">🧾</div>
              <p className="text-2xl font-bold text-cyan-600">+ {turnLog.amount.toFixed(2)} Points</p>
              <p className="text-sm text-gray-500 mt-1">Receipt #{turnLog.ticketId}</p>
            </div>

            <div className="text-left space-y-3 border-t border-b py-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-semibold">{turnLog.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Services:</span>
                <span className="font-semibold">{turnLog.services.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service Count:</span>
                <span className="font-semibold">{turnLog.serviceCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Turn Number:</span>
                <span className="font-semibold">T: {turnLog.turnNumber}</span>
              </div>
              {turnLog.bonusAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Bonus:</span>
                  <span className="font-semibold text-orange-600">+{turnLog.bonusAmount}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-between text-lg font-bold">
              <span>TOTAL</span>
              <span className="text-cyan-600">${turnLog.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
