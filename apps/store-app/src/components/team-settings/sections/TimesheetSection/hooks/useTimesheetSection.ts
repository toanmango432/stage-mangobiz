import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  fetchTimesheetsByStaff,
  fetchStaffShiftStatus,
  selectStaffShiftStatus,
  selectTimesheetsByStaff,
} from '@/store/slices/timesheetSlice';
import { selectAllTeamMembers } from '@/store/slices/teamSlice';
import type { BreakType, TimesheetEntry } from '@/types/timesheet';

export interface UseTimesheetSectionParams {
  memberId: string;
  memberName: string;
  storeId: string;
}

export interface UseTimesheetSectionReturn {
  // State
  isLoading: boolean;
  selectedTimesheetId: string | null;
  activeTab: string;
  isClockedIn: boolean;
  isOnBreak: boolean;

  // Data
  shiftStatus: ReturnType<typeof selectStaffShiftStatus>;
  sortedTimesheets: TimesheetEntry[];
  staffMembers: Array<{ id: string; name: string }>;

  // Actions
  setSelectedTimesheetId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  handleClockIn: () => Promise<void>;
  handleClockOut: () => Promise<void>;
  handleStartBreak: (breakType: BreakType) => Promise<void>;
  handleEndBreak: () => Promise<void>;
}

/**
 * Custom hook for managing timesheet section state and actions.
 * Encapsulates all Redux interactions, data fetching, and clock in/out logic.
 */
export function useTimesheetSection({
  memberId,
  storeId,
}: UseTimesheetSectionParams): UseTimesheetSectionReturn {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('staff');

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
  const staffMembers = useMemo(
    () => allMembers.map((m) => ({ id: m.id, name: m.profile.displayName })),
    [allMembers]
  );

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchStaffShiftStatus({ storeId, staffId: memberId }));
    dispatch(fetchTimesheetsByStaff({ storeId, staffId: memberId }));
  }, [dispatch, storeId, memberId]);

  // Sort timesheets by date (most recent first)
  const sortedTimesheets = useMemo(
    () => [...timesheets].sort((a, b) => b.date.localeCompare(a.date)),
    [timesheets]
  );

  // Handlers
  const handleClockIn = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(
        clockIn({
          params: { staffId: memberId },
          context: { userId: memberId, deviceId: 'web', storeId },
        })
      ).unwrap();
    } catch (error) {
      console.error('Failed to clock in:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId, storeId]);

  const handleClockOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(
        clockOut({
          params: { staffId: memberId },
          context: { userId: memberId, deviceId: 'web', storeId },
        })
      ).unwrap();
    } catch (error) {
      console.error('Failed to clock out:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId, storeId]);

  const handleStartBreak = useCallback(
    async (breakType: BreakType) => {
      setIsLoading(true);
      try {
        await dispatch(
          startBreak({
            params: { staffId: memberId, breakType },
            context: { userId: memberId, deviceId: 'web', storeId },
          })
        ).unwrap();
      } catch (error) {
        console.error('Failed to start break:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, memberId, storeId]
  );

  const handleEndBreak = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(
        endBreak({
          params: { staffId: memberId },
          context: { userId: memberId, deviceId: 'web', storeId },
        })
      ).unwrap();
    } catch (error) {
      console.error('Failed to end break:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId, storeId]);

  const isClockedIn = shiftStatus?.isClockedIn ?? false;
  const isOnBreak = shiftStatus?.isOnBreak ?? false;

  return {
    // State
    isLoading,
    selectedTimesheetId,
    activeTab,
    isClockedIn,
    isOnBreak,

    // Data
    shiftStatus,
    sortedTimesheets,
    staffMembers,

    // Actions
    setSelectedTimesheetId,
    setActiveTab,
    handleClockIn,
    handleClockOut,
    handleStartBreak,
    handleEndBreak,
  };
}

export default useTimesheetSection;
