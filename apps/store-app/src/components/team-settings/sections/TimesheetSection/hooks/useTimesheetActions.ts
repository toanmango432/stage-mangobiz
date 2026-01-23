import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';
import {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
} from '@/store/slices/timesheetSlice';
import type { BreakType } from '@/types/timesheet';

export interface UseTimesheetActionsParams {
  memberId: string;
  storeId: string;
}

export interface UseTimesheetActionsResult {
  isLoading: boolean;
  handleClockIn: () => Promise<void>;
  handleClockOut: () => Promise<void>;
  handleStartBreak: (breakType: BreakType) => Promise<void>;
  handleEndBreak: () => Promise<void>;
}

/**
 * Custom hook for managing timesheet clock in/out and break actions
 * Encapsulates the loading state and dispatch logic for timesheet operations
 */
export function useTimesheetActions({
  memberId,
  storeId,
}: UseTimesheetActionsParams): UseTimesheetActionsResult {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);

  const handleClockIn = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(clockIn({ staffId: memberId })).unwrap();
    } catch (error) {
      console.error('Failed to clock in:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId]);

  const handleClockOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(clockOut({ staffId: memberId })).unwrap();
    } catch (error) {
      console.error('Failed to clock out:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId]);

  const handleStartBreak = useCallback(async (breakType: BreakType) => {
    setIsLoading(true);
    try {
      await dispatch(startBreak({ staffId: memberId, breakType })).unwrap();
    } catch (error) {
      console.error('Failed to start break:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId]);

  const handleEndBreak = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(endBreak({ staffId: memberId })).unwrap();
    } catch (error) {
      console.error('Failed to end break:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId]);

  return {
    isLoading,
    handleClockIn,
    handleClockOut,
    handleStartBreak,
    handleEndBreak,
  };
}

export default useTimesheetActions;
