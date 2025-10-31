import { X, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface TurnEntry {
  id: string;
  timestamp: Date;
  turnNumber: number;
  amount: number;
  serviceCount: number;
  clientName: string;
  services: string[];
  type: 'service' | 'checkout' | 'void';
}

interface StaffTurnData {
  id: string;
  name: string;
  photo?: string;
  turns: TurnEntry[];
  totalAmount: number;
  totalTurns: number;
}

interface TurnTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  date?: Date;
}

// Mock data - will be replaced with real data
const mockStaffTurnData: StaffTurnData[] = [
  {
    id: '1',
    name: 'HAI',
    photo: undefined,
    totalAmount: 1486.00,
    totalTurns: 4,
    turns: [
      { id: 't1', timestamp: new Date('2024-10-24T09:00:00'), turnNumber: 1, amount: 402.00, serviceCount: 1, clientName: 'Client A', services: ['Gel Manicure'], type: 'service' },
      { id: 't2', timestamp: new Date('2024-10-24T11:30:00'), turnNumber: 2, amount: 350.00, serviceCount: 1, clientName: 'Client B', services: ['Acrylic Full Set'], type: 'service' },
      { id: 't3', timestamp: new Date('2024-10-24T14:00:00'), turnNumber: 3, amount: 384.00, serviceCount: 1, clientName: 'Client C', services: ['Pedicure'], type: 'service' },
      { id: 't4', timestamp: new Date('2024-10-24T16:30:00'), turnNumber: 4, amount: 350.00, serviceCount: 1, clientName: 'Client D', services: ['Gel Manicure'], type: 'service' },
    ],
  },
  {
    id: '2',
    name: 'ANNA',
    photo: undefined,
    totalAmount: 1127.00,
    totalTurns: 3,
    turns: [
      { id: 't5', timestamp: new Date('2024-10-24T09:30:00'), turnNumber: 1, amount: 402.00, serviceCount: 1, clientName: 'Client E', services: ['Acrylic'], type: 'service' },
      { id: 't6', timestamp: new Date('2024-10-24T12:00:00'), turnNumber: 2, amount: 375.00, serviceCount: 1, clientName: 'Client F', services: ['Pedicure'], type: 'service' },
      { id: 't7', timestamp: new Date('2024-10-24T15:00:00'), turnNumber: 3, amount: 350.00, serviceCount: 1, clientName: 'Client G', services: ['Gel'], type: 'service' },
    ],
  },
  {
    id: '3',
    name: 'ROSE',
    photo: undefined,
    totalAmount: 1050.00,
    totalTurns: 3,
    turns: [
      { id: 't8', timestamp: new Date('2024-10-24T10:00:00'), turnNumber: 1, amount: 350.00, serviceCount: 1, clientName: 'Client H', services: ['Manicure'], type: 'service' },
      { id: 't9', timestamp: new Date('2024-10-24T13:00:00'), turnNumber: 2, amount: 350.00, serviceCount: 1, clientName: 'Client I', services: ['Pedicure'], type: 'service' },
      { id: 't10', timestamp: new Date('2024-10-24T16:00:00'), turnNumber: 3, amount: 350.00, serviceCount: 1, clientName: 'Client J', services: ['Gel'], type: 'service' },
    ],
  },
];

export function TurnTracker({ isOpen, onClose, date = new Date() }: TurnTrackerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-[60] transition-opacity"
        onClick={onClose}
      />
      
      {/* Slide-in Panel */}
      <div className="fixed left-0 top-0 bottom-0 w-[280px] bg-gradient-to-br from-cyan-400 to-cyan-500 shadow-2xl z-[70] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-cyan-300/30">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white tracking-wide">TURN TRACKER</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-cyan-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {/* Date Display */}
          <div className="flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-white">
              {format(date, 'MMM dd, yyyy')}
            </span>
            <button className="p-1 hover:bg-white/20 rounded transition-colors">
              <Calendar className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Content - Staff List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {mockStaffTurnData.map((staff) => (
            <div key={staff.id} className="bg-white rounded-xl shadow-sm p-3 hover:shadow-md transition-shadow">
              {/* Staff Header */}
              <div className="flex items-center gap-3 mb-3">
                {staff.photo ? (
                  <img src={staff.photo} alt={staff.name} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                    {staff.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-sm">{staff.name}</p>
                  <p className="text-xs text-gray-500">{staff.totalTurns} turns</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-cyan-600">${staff.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>

              {/* Turn Entries */}
              <div className="space-y-2">
                {staff.turns.map((turn) => (
                  <div
                    key={turn.id}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 hover:bg-gray-100 transition-colors"
                  >
                    {/* Time */}
                    <div className="text-xs font-medium text-cyan-600 w-16">
                      {format(turn.timestamp, 'hh:mm a')}
                    </div>
                    
                    {/* Turn Info */}
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-xs text-gray-600">T: {turn.turnNumber}</span>
                      <span className="text-xs font-semibold text-gray-900">${turn.amount.toFixed(2)}</span>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      turn.type === 'service' ? 'bg-green-100 text-green-700' :
                      turn.type === 'checkout' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {turn.type === 'service' ? 'Done' : turn.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {mockStaffTurnData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
              <Calendar className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No turn data</p>
              <p className="text-xs mt-1">Activities will appear here</p>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="border-t border-cyan-300/30 bg-white/10 backdrop-blur-sm px-4 py-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/80">Total Staff</span>
              <span className="text-sm font-bold text-white">{mockStaffTurnData.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/80">Total Turns</span>
              <span className="text-sm font-bold text-white">
                {mockStaffTurnData.reduce((sum, staff) => sum + staff.totalTurns, 0)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <span className="text-xs text-white/80">Total Revenue</span>
              <span className="text-lg font-bold text-white">
                ${mockStaffTurnData.reduce((sum, staff) => sum + staff.totalAmount, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
