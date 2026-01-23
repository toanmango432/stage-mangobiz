import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, Timer, Users, AlertTriangle, FileText, Plus } from 'lucide-react';
import { Card, SectionHeader, Button, Tabs } from '../../components/SharedComponents';
import type { AppDispatch, RootState } from '@/store';
import {
  fetchTimesheetsByStaff,
  fetchStaffShiftStatus,
  selectStaffShiftStatus,
  selectTimesheetsByStaff,
} from '@/store/slices/timesheetSlice';
import { selectAllTeamMembers } from '@/store/slices/teamSlice';
import { TimesheetDashboard } from '../../components/TimesheetDashboard';

// Types
import type { TimesheetSectionProps } from './types';

// Sub-components
import {
  ClockButton,
  BreakButton,
  ShiftStatusCard,
  RecentTimesheets,
  AttendanceAlertsSection,
  TimesheetReportsSection,
  TimesheetDetailModal,
  ManualTimesheetModal,
  DisputeTimesheetModal,
} from './components';

// Hooks
import { useTimesheetActions } from './hooks';

// ============================================
// MAIN TIMESHEET SECTION COMPONENT
// ============================================

export const TimesheetSection: React.FC<TimesheetSectionProps> = ({
  memberId,
  memberName,
  storeId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<string | null>(null);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [disputeTimesheetId, setDisputeTimesheetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('staff');

  // Use custom hook for clock in/out and break actions
  const {
    isLoading,
    handleClockIn,
    handleClockOut,
    handleStartBreak,
    handleEndBreak,
  } = useTimesheetActions({ memberId, storeId });

  // Get shift status from Redux
  const shiftStatus = useSelector((state: RootState) =>
    selectStaffShiftStatus(state, memberId)
  );

  // Get recent timesheets
  const timesheets = useSelector((state: RootState) =>
    selectTimesheetsByStaff(state, memberId)
  );

  // Get all team members for dashboard
  const allMembers = useSelector(selectAllTeamMembers);
  const staffMembers = useMemo(() =>
    allMembers.map(m => ({ id: m.id, name: m.profile.displayName })),
    [allMembers]
  );

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchStaffShiftStatus({ staffId: memberId }));
    dispatch(fetchTimesheetsByStaff({ staffId: memberId }));
  }, [dispatch, memberId]);

  // Sort timesheets by date (most recent first)
  const sortedTimesheets = [...timesheets].sort((a, b) => b.date.localeCompare(a.date));

  const isClockedIn = shiftStatus?.isClockedIn ?? false;
  const isOnBreak = shiftStatus?.isOnBreak ?? false;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Time & Attendance"
        subtitle={'Manage clock in/out, timesheets, and attendance for ' + memberName}
        icon={<Timer className="w-5 h-5" />}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManualEntryModal(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Manual Entry
          </Button>
        }
      />

      {/* Tabs for different views */}
      <Tabs
        tabs={[
          { id: 'staff', label: 'Clock In/Out', icon: <Clock className="w-4 h-4" /> },
          { id: 'alerts', label: 'Alerts', icon: <AlertTriangle className="w-4 h-4" /> },
          { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
          { id: 'dashboard', label: 'Team Dashboard', icon: <Users className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Staff Clock In/Out Tab */}
      {activeTab === 'staff' && (
        <>
          {/* Clock In/Out Actions */}
          <Card>
            <div className="space-y-4">
              <ClockButton
                isClockedIn={isClockedIn}
                isLoading={isLoading}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
              />

              <BreakButton
                isOnBreak={isOnBreak}
                isLoading={isLoading}
                disabled={!isClockedIn}
                onStartBreak={handleStartBreak}
                onEndBreak={handleEndBreak}
              />
            </div>
          </Card>

          {/* Current Shift Status */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Current Shift</h4>
            <ShiftStatusCard
              clockInTime={shiftStatus?.clockInTime ?? null}
              totalBreakMinutes={shiftStatus?.totalBreakMinutes ?? 0}
              isOnBreak={isOnBreak}
              currentBreakStart={shiftStatus?.currentBreakStart ?? null}
            />
          </div>

          {/* Recent Timesheets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Recent Timesheets</h4>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('reports')}>
                View All
              </Button>
            </div>
            <RecentTimesheets
              timesheets={sortedTimesheets}
              onViewDetails={(id) => setSelectedTimesheetId(id)}
            />
          </div>
        </>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Attendance Alerts</h4>
          <AttendanceAlertsSection
            timesheets={sortedTimesheets}
            memberName={memberName}
          />
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <TimesheetReportsSection
          timesheets={sortedTimesheets}
          memberName={memberName}
        />
      )}

      {/* Team Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <TimesheetDashboard
          storeId={storeId}
          staffMembers={staffMembers}
        />
      )}

      {/* Timesheet Details Modal */}
      {selectedTimesheetId && (
        <TimesheetDetailModal
          timesheetId={selectedTimesheetId}
          timesheets={sortedTimesheets}
          memberName={memberName}
          storeId={storeId}
          onClose={() => setSelectedTimesheetId(null)}
        />
      )}

      {/* Manual Timesheet Entry Modal */}
      {showManualEntryModal && (
        <ManualTimesheetModal
          defaultStaffId={memberId}
          storeId={storeId}
          onClose={() => setShowManualEntryModal(false)}
        />
      )}

      {/* Dispute Timesheet Modal */}
      {disputeTimesheetId && (() => {
        const disputeTimesheet = sortedTimesheets.find((ts) => ts.id === disputeTimesheetId);
        return disputeTimesheet ? (
          <DisputeTimesheetModal
            timesheet={disputeTimesheet}
            memberName={memberName}
            storeId={storeId}
            onClose={() => setDisputeTimesheetId(null)}
          />
        ) : null;
      })()}
    </div>
  );
};

export default TimesheetSection;
