import { X } from 'lucide-react';
import { StaffTurnData } from './TurnTracker';

interface StaffDetailPanelProps {
  staff: StaffTurnData;
  onClose: () => void;
}

export function StaffDetailPanel({ staff, onClose }: StaffDetailPanelProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[80]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-[90] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            {staff.photo ? (
              <img src={staff.photo} alt={staff.name} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold">
                {staff.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold">{staff.name}</h3>
              <p className="text-sm text-gray-500">Turn Bonus: {staff.bonusTurn}%</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Service Total</span>
              <span className="font-bold">${staff.serviceTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Service TURN</span>
              <span className="font-bold">{staff.serviceTurn}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Tardy</span>
              <span className="font-bold">{staff.tardyTurn}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Tech Bonus</span>
              <span className="font-bold">{staff.bonusTurn}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Appt/Request</span>
              <span className="font-bold">{staff.appointmentTurn}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Partial</span>
              <span className="font-bold">${staff.partialTurn.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Adjusted</span>
              <span className="font-bold">{staff.adjustTurn}</span>
            </div>
          </div>

          <div className="pt-4 border-t-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">TURN:</span>
              <span className="text-2xl font-bold text-cyan-600">{staff.totalTurn.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors">
              SUBTRACT
            </button>
            <button className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors">
              ADD
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
