import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Search, Calendar, MoreVertical, Download, List, Grid, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { format } from 'date-fns';
import { StaffSummaryCard } from './StaffSummaryCard';
import { TurnLogBlock } from './TurnLogBlock';
import { ReceiptModal } from './ReceiptModal';
import { TurnLogsTable } from './TurnLogsTable';
import { TurnSettingsPanel } from './TurnSettingsPanel';
import { ManualAdjustModal } from './ManualAdjustModal';
import { StaffDetailPanel } from './StaffDetailPanel';
import { TurnEntry, StaffTurnData } from './types';
import {
  selectStaffForTurnTracker,
  selectTurnStats,
  selectStaffLoading,
  selectStaffError,
  adjustStaffTurn,
  loadStaff,
  clearError,
} from '../../store/slices/uiStaffSlice';
import type { AppDispatch } from '../../store';

interface TurnTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  date?: Date;
}

export function TurnTracker({ isOpen, onClose, date = new Date() }: TurnTrackerProps) {
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const staffData = useSelector(selectStaffForTurnTracker);
  const turnStats = useSelector(selectTurnStats);
  const loading = useSelector(selectStaffLoading);
  const error = useSelector(selectStaffError);

  // Local UI state
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTurnLog, setSelectedTurnLog] = useState<TurnEntry | null>(null);
  const [showTurnLogs, setShowTurnLogs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffTurnData | null>(null);
  const [showStaffDetail, setShowStaffDetail] = useState(false);
  const [focusedStaffIndex, setFocusedStaffIndex] = useState(-1);

  // Memoized date formatting
  const formattedDate = useMemo(() => format(date, 'MMM dd, yyyy'), [date]);

  // Memoized handlers to prevent unnecessary re-renders of child components
  const handleTurnLogClick = useCallback((turnLog: TurnEntry) => {
    setSelectedTurnLog(turnLog);
    setShowReceiptModal(true);
  }, []);

  const handleStaffCardClick = useCallback((staff: StaffTurnData) => {
    setSelectedStaff(staff);
    setShowStaffDetail(true);
  }, []);

  const handlePlusClick = useCallback((staff: StaffTurnData) => {
    setSelectedStaff(staff);
    setShowAdjustModal(true);
  }, []);

  const handleRetry = useCallback(() => {
    dispatch(clearError());
    dispatch(loadStaff('default'));
  }, [dispatch]);

  // Keyboard accessibility - Escape to close and arrow key navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't handle if any modal is open
    if (showReceiptModal || showTurnLogs || showSettings || showAdjustModal || showStaffDetail) {
      return;
    }

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedStaffIndex(prev =>
          prev < staffData.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedStaffIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        if (focusedStaffIndex >= 0 && focusedStaffIndex < staffData.length) {
          handleStaffCardClick(staffData[focusedStaffIndex]);
        }
        break;
    }
  }, [onClose, showReceiptModal, showTurnLogs, showSettings, showAdjustModal, showStaffDetail, staffData, focusedStaffIndex, handleStaffCardClick]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] animate-fade-in motion-reduce:animate-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="turn-tracker-title"
        className="fixed inset-2 sm:inset-4 bg-white rounded-xl shadow-2xl z-[70] flex flex-col max-w-[98vw] sm:max-w-[95vw] mx-auto animate-scale-in motion-reduce:animate-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-cyan-500 to-cyan-600">
          <div className="flex items-center gap-2 sm:gap-4">
            <h2 id="turn-tracker-title" className="text-base sm:text-xl font-bold text-white tracking-wide">TURN TRACKER</h2>
            <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <Calendar className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              className="p-2.5 sm:p-2 hover:bg-cyan-700 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              aria-label="Search staff"
            >
              <Search className="w-5 h-5 text-white" />
            </button>

            <button
              className={`p-2.5 sm:p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center ${viewMode === 'list' ? 'bg-cyan-700' : 'hover:bg-cyan-700'}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List className="w-5 h-5 text-white" />
            </button>

            <button
              className={`p-2.5 sm:p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center ${viewMode === 'grid' ? 'bg-cyan-700' : 'hover:bg-cyan-700'}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid className="w-5 h-5 text-white" />
            </button>

            <div className="hidden sm:block w-px h-6 bg-white/30 mx-1" aria-hidden="true" />

            <button
              className="p-2.5 sm:p-2 hover:bg-cyan-700 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              onClick={() => setShowTurnLogs(true)}
              aria-label="View turn logs"
            >
              <Download className="w-5 h-5 text-white" />
            </button>

            <button
              className="p-2.5 sm:p-2 hover:bg-cyan-700 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>

            <div className="hidden sm:block w-px h-6 bg-white/30 mx-1" aria-hidden="true" />

            <button
              onClick={onClose}
              className="p-2.5 sm:p-2 hover:bg-cyan-700 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              aria-label="Close turn tracker"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          <div className="h-full overflow-y-auto">
            {/* Loading State - Skeleton Rows */}
            {loading && (
              <div className="divide-y divide-gray-200">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex animate-pulse">
                    {/* Staff Card Skeleton */}
                    <div className="w-48 p-4 border-r border-gray-200 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-16" />
                      </div>
                    </div>
                    {/* Turn Logs Skeleton */}
                    <div className="flex-1 p-4 flex gap-3">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="w-16 h-16 bg-gray-200 rounded-lg" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                <AlertCircle className="w-16 h-16 mb-4 text-red-400" />
                <p className="text-lg font-medium text-red-600">Failed to load staff data</p>
                <p className="text-sm mt-1 text-gray-500 mb-4">{error}</p>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            )}

            {/* Staff Rows */}
            {!loading && !error && (
              <div className="divide-y divide-gray-200" role="listbox" aria-label="Staff list">
                {staffData.map((staff, index) => (
                  <div
                    key={staff.id}
                    role="option"
                    aria-selected={focusedStaffIndex === index}
                    tabIndex={focusedStaffIndex === index ? 0 : -1}
                    className={`flex transition-colors ${
                      focusedStaffIndex === index
                        ? 'bg-cyan-50 ring-2 ring-inset ring-cyan-500'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setFocusedStaffIndex(index);
                      handleStaffCardClick(staff);
                    }}
                  >
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
                          aria-label={`Add turn adjustment for ${staff.name}`}
                        >
                          <span className="text-2xl font-light" aria-hidden="true">+</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && staffData.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-lg font-semibold text-gray-700">No Staff Clocked In</p>
                <p className="text-sm mt-1 text-gray-500 text-center max-w-xs">
                  Staff turn activities will appear here once team members clock in for their shift
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Summary */}
        <div className="border-t border-gray-200 bg-white px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-8">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Total Staff</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">{turnStats.totalStaff}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Total Turns</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">{turnStats.totalTurns}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500">Total Revenue</p>
                <p className="text-base sm:text-lg font-bold text-cyan-600">
                  ${turnStats.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-xs text-gray-600">
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
            dispatch(adjustStaffTurn({
              staffId: selectedStaff.id,
              amount: turnAmount,
              reason: reason,
            }));
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
