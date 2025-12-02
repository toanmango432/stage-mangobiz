import { ModalContainer } from '../common';
import { TurnEntry } from './types';

interface ReceiptModalProps {
  turnLog: TurnEntry;
  onClose: () => void;
}

export function ReceiptModal({ turnLog, onClose }: ReceiptModalProps) {
  return (
    <ModalContainer
      isOpen={true}
      onClose={onClose}
      title="Receipt Details"
      size="sm"
      containerClassName="z-[90]"
      backdropClassName="z-[80]"
    >
      {/* Receipt Content */}
      <div className="text-center">
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
    </ModalContainer>
  );
}
