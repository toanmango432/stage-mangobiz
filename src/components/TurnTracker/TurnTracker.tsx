import { useState } from 'react';
import { X, Search, Calendar, MoreVertical, Download, List, Grid } from 'lucide-react';
import { format } from 'date-fns';
import { StaffSummaryCard } from './StaffSummaryCard';
import { TurnLogBlock } from './TurnLogBlock';
import { ReceiptModal } from './ReceiptModal';
import { TurnLogsTable } from './TurnLogsTable';
import { TurnSettingsPanel } from './TurnSettingsPanel';
import { ManualAdjustModal } from './ManualAdjustModal';
import { StaffDetailPanel } from './StaffDetailPanel';

// Types
export interface TurnEntry {
  id: string;
  timestamp: Date;
  turnNumber: number;
  amount: number;
  serviceCount: number;
  bonusAmount: number;
  clientName: string;
  services: string[];
  type: 'service' | 'checkout' | 'void';
  ticketId: string;
}

export interface StaffTurnData {
  id: string;
  name: string;
  photo?: string;
  clockInTime: Date;
  serviceTurn: number;
  bonusTurn: number;
  adjustTurn: number;
  tardyTurn: number;
  appointmentTurn: number;
  partialTurn: number;
  totalTurn: number;
  queuePosition: number;
  serviceTotal: number;
  turnLogs: TurnEntry[];
}

export interface TurnSettings {
  mode: 'manual' | 'auto';
  orderingMethod: 'rotation' | 'service-count' | 'amount';
  appointmentBonus: { enabled: boolean; percentage: number };
  tardy: { enabled: boolean; minutesThreshold: number; turnsPerThreshold: number; maxTurns: number };
}

interface TurnTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  date?: Date;
}

// Mock data - will be replaced with Redux
const mockStaffData: StaffTurnData[] = [
  {
    id: '1',
    name: 'TOM',
    clockInTime: new Date('2024-10-24T08:35:55'),
    serviceTurn: 2,
    bonusTurn: 3,
    adjustTurn: 0,
    tardyTurn: 0,
    appointmentTurn: 3,
    partialTurn: 0,
    totalTurn: 2.00,
    queuePosition: 1,
    serviceTotal: 306.00,
    turnLogs: [
      { id: 't1', timestamp: new Date('2024-10-24T09:00:00'), turnNumber: 1, amount: 55.00, serviceCount: 1, bonusAmount: 0, clientName: 'Client A', services: ['Gel Manicure'], type: 'service', ticketId: 'T001' },
      { id: 't2', timestamp: new Date('2024-10-24T10:30:00'), turnNumber: 2, amount: 47.00, serviceCount: 1, bonusAmount: 1, clientName: 'Client B', services: ['Acrylic'], type: 'service', ticketId: 'T002' },
    ],
  },
  {
    id: '2',
    name: 'ANDY',
    clockInTime: new Date('2024-10-24T10:31:10'),
    serviceTurn: 1,
    bonusTurn: 3,
    adjustTurn: 0,
    tardyTurn: 0,
    appointmentTurn: 0,
    partialTurn: 0,
    totalTurn: 1.00,
    queuePosition: 2,
    serviceTotal: 231.00,
    turnLogs: [
      { id: 't3', timestamp: new Date('2024-10-24T11:00:00'), turnNumber: 1, amount: 62.00, serviceCount: 1, bonusAmount: 0, clientName: 'Client C', services: ['Pedicure'], type: 'service', ticketId: 'T003' },
    ],
  },
  {
    id: '3',
    name: 'TINA',
    clockInTime: new Date('2024-10-24T09:10:25'),
    serviceTurn: 1,
    bonusTurn: 4,
    adjustTurn: 0,
    tardyTurn: 0,
    appointmentTurn: 0,
    partialTurn: 0,
    totalTurn: 1.00,
    queuePosition: 3,
    serviceTotal: 367.00,
    turnLogs: [
      { id: 't4', timestamp: new Date('2024-10-24T09:30:00'), turnNumber: 1, amount: 55.00, serviceCount: 1, bonusAmount: 0, clientName: 'Client D', services: ['Gel'], type: 'service', ticketId: 'T004' },
    ],
  },
];

export function TurnTracker({ isOpen, onClose, date = new Date() }: TurnTrackerProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTurnLog, setSelectedTurnLog] = useState<TurnEntry | null>(null);
  const [showTurnLogs, setShowTurnLogs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffTurnData | null>(null);
  const [showStaffDetail, setShowStaffDetail] = useState(false);

  if (!isOpen) return null;

  const handleTurnLogClick = (turnLog: TurnEntry) => {
    setSelectedTurnLog(turnLog);
    setShowReceiptModal(true);
  };

  const handleStaffCardClick = (staff: StaffTurnData) => {
    setSelectedStaff(staff);
    setShowStaffDetail(true);
  };

  const handlePlusClick = (staff: StaffTurnData) => {
    setSelectedStaff(staff);
    setShowAdjustModal(true);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={onClose}
      />
      
      {/* Main Modal */}
      <div className="fixed inset-4 bg-white rounded-xl shadow-2xl z-[70] flex flex-col max-w-[95vw] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-cyan-500 to-cyan-600">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white tracking-wide">TURN TRACKER</h2>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                {format(date, 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-cyan-700 rounded-lg transition-colors" title="Search">
              <Search className="w-5 h-5 text-white" />
            </button>
            
            <button 
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-cyan-700' : 'hover:bg-cyan-700'}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List className="w-5 h-5 text-white" />
            </button>
            
            <button 
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-cyan-700' : 'hover:bg-cyan-700'}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid className="w-5 h-5 text-white" />
            </button>
            
            <div className="w-px h-6 bg-white/30 mx-1" />
            
            <button 
              className="p-2 hover:bg-cyan-700 rounded-lg transition-colors"
              onClick={() => setShowTurnLogs(true)}
              title="Turn Logs"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
            
            <button 
              className="p-2 hover:bg-cyan-700 rounded-lg transition-colors"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
            
            <div className="w-px h-6 bg-white/30 mx-1" />
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-cyan-700 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          <div className="h-full overflow-y-auto">
            {/* Staff Rows */}
            <div className="divide-y divide-gray-200">
              {mockStaffData.map((staff) => (
                <div key={staff.id} className="flex hover:bg-gray-100 transition-colors">
                  {/* Staff Summary Card */}
                  <StaffSummaryCard 
                    staff={staff}
                    viewMode={viewMode}
                    onClick={() => handleStaffCardClick(staff)}
                  />

                  {/* Turn Log Blocks */}
                  <div className="flex-1 p-4 overflow-x-auto">
                    <div className="flex items-center gap-3">
                      {staff.turnLogs.map((turnLog) => (
                        <TurnLogBlock
                          key={turnLog.id}
                          turnLog={turnLog}
                          onClick={() => handleTurnLogClick(turnLog)}
                        />
                      ))}
                      
                      {/* Plus Button */}
                      <button
                        onClick={() => handlePlusClick(staff)}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-cyan-500 hover:bg-cyan-50 text-gray-400 hover:text-cyan-500 transition-all"
                      >
                        <span className="text-2xl font-light">+</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {mockStaffData.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                <Calendar className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">No turn data for this date</p>
                <p className="text-sm mt-1">Turn activities will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Summary */}
        <div className="border-t border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-xs text-gray-500">Total Staff</p>
                <p className="text-lg font-bold text-gray-900">{mockStaffData.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Turns</p>
                <p className="text-lg font-bold text-gray-900">
                  {mockStaffData.reduce((sum, staff) => sum + staff.serviceTurn, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold text-cyan-600">
                  ${mockStaffData.reduce((sum, staff) => sum + staff.serviceTotal, 0).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>Service</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                <span>Checkout</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span>Void</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showReceiptModal && selectedTurnLog && (
        <ReceiptModal
          turnLog={selectedTurnLog}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {showTurnLogs && (
        <TurnLogsTable
          onClose={() => setShowTurnLogs(false)}
        />
      )}

      {showSettings && (
        <TurnSettingsPanel
          onClose={() => setShowSettings(false)}
        />
      )}

      {showAdjustModal && selectedStaff && (
        <ManualAdjustModal
          staff={selectedStaff}
          onClose={() => setShowAdjustModal(false)}
          onSave={(turnAmount, reason) => {
            console.log('Adjust turn:', selectedStaff.name, turnAmount, reason);
            setShowAdjustModal(false);
          }}
        />
      )}

      {showStaffDetail && selectedStaff && (
        <StaffDetailPanel
          staff={selectedStaff}
          onClose={() => setShowStaffDetail(false)}
        />
      )}
    </>
  );
}
