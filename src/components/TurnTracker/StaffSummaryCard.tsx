import { format } from 'date-fns';
import { StaffTurnData } from './TurnTracker';

interface StaffSummaryCardProps {
  staff: StaffTurnData;
  viewMode: 'list' | 'grid';
  onClick: () => void;
}

export function StaffSummaryCard({ staff, viewMode, onClick }: StaffSummaryCardProps) {
  const isCompact = viewMode === 'grid';

  return (
    <div 
      className={`flex-shrink-0 bg-white border-r border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
        isCompact ? 'w-32' : 'w-48'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        {/* Profile Photo */}
        {staff.photo ? (
          <img 
            src={staff.photo} 
            alt={staff.name} 
            className={`rounded-full mb-2 ${isCompact ? 'w-10 h-10' : 'w-12 h-12'}`}
          />
        ) : (
          <div className={`rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold mb-2 ${
            isCompact ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-lg'
          }`}>
            {staff.name.charAt(0)}
          </div>
        )}

        {/* Name */}
        <p className={`font-bold text-gray-900 text-center ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {staff.name}
        </p>

        {/* Detailed View */}
        {!isCompact && (
          <>
            {/* Clock-in Time */}
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <span>🕐</span>
              <span>{format(staff.clockInTime, 'hh:mm:ss a')}</span>
            </div>

            {/* Metrics */}
            <div className="w-full mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Bonus:</span>
                <span className="font-semibold text-gray-900">{staff.bonusTurn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Adjust:</span>
                <span className="font-semibold text-gray-900">{staff.adjustTurn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-semibold text-gray-900">${staff.serviceTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-gray-200">
                <span className="text-gray-600">TURN:</span>
                <span className="font-bold text-cyan-600">{staff.totalTurn.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}

        {/* Compact View */}
        {isCompact && (
          <div className="w-full mt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-semibold text-gray-900">${staff.serviceTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">TURN:</span>
              <span className="font-bold text-cyan-600">{staff.totalTurn.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
