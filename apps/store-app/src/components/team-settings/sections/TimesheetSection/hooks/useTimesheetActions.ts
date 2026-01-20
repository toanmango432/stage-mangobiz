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
      await dispatch(clockIn({
        params: { staffId: memberId },
        context: { userId: memberId, deviceId: 'web', storeId },
      })).unwrap();
    } catch (error) {
      console.error('Failed to clock in:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId, storeId]);

  const handleClockOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(clockOut({
        params: { staffId: memberId },
        context: { userId: memberId, deviceId: 'web', storeId },
      })).unwrap();
    } catch (error) {
      console.error('Failed to clock out:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId, storeId]);

  const handleStartBreak = useCallback(async (breakType: BreakType) => {
    setIsLoading(true);
    try {
      await dispatch(startBreak({
        params: { staffId: memberId, breakType },
        context: { userId: memberId, deviceId: 'web', storeId },
      })).unwrap();
    } catch (error) {
      console.error('Failed to start break:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId, storeId]);

  const handleEndBreak = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(endBreak({
        params: { staffId: memberId },
        context: { userId: memberId, deviceId: 'web', storeId },
      })).unwrap();
    } catch (error) {
      console.error('Failed to end break:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId, storeId]);

  return {
    isLoading,
    handleClockIn,
    handleClockOut,
    handleStartBreak,
    handleEndBreak,
  };
}

export default useTimesheetActions;
