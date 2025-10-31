import { format } from 'date-fns';
import { TurnEntry } from './TurnTracker';

interface TurnLogBlockProps {
  turnLog: TurnEntry;
  onClick: () => void;
}

export function TurnLogBlock({ turnLog, onClick }: TurnLogBlockProps) {
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-28 bg-white border border-gray-300 rounded-lg p-2.5 hover:shadow-md hover:border-cyan-400 transition-all cursor-pointer"
    >
      {/* Service Amount */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-600">S:</span>
        <span className="text-sm font-bold text-gray-900">
          ${turnLog.amount.toFixed(2)}
        </span>
      </div>

      {/* Timestamp */}
      <div className="text-xs text-cyan-600 font-semibold mb-1.5">
        {format(turnLog.timestamp, 'hh:mm a')}
      </div>

      {/* Bonus (if applicable) */}
      {turnLog.bonusAmount > 0 && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-orange-600">B:</span>
          <span className="text-xs font-semibold text-orange-600">
            {turnLog.bonusAmount}
          </span>
        </div>
      )}

      {/* Turn Number */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">T:</span>
        <span className="text-xs font-semibold text-gray-700">
          {turnLog.turnNumber}
        </span>
      </div>

      {/* Status Badge */}
      <div className="mt-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          turnLog.type === 'service' ? 'bg-green-100 text-green-700' :
          turnLog.type === 'checkout' ? 'bg-blue-100 text-blue-700' :
          'bg-red-100 text-red-700'
        }`}>
          {turnLog.type === 'service' ? 'Done' : turnLog.type}
        </span>
      </div>
    </div>
  );
}
