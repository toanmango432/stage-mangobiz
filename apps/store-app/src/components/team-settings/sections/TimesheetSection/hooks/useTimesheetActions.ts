import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';
import {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
} from '@/store/slices/timesheetSlice';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleClockIn = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(clockIn({ staffId: memberId })).unwrap();
      toast({
        title: 'Clocked In',
        description: 'Successfully clocked in.',
      });
    } catch (error) {
      console.error('Failed to clock in:', error);
      toast({
        title: 'Clock In Failed',
        description: error instanceof Error ? error.message : 'Failed to clock in. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId, toast]);

  const handleClockOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(clockOut({ staffId: memberId })).unwrap();
      toast({
        title: 'Clocked Out',
        description: 'Successfully clocked out.',
      });
    } catch (error) {
      console.error('Failed to clock out:', error);
      toast({
        title: 'Clock Out Failed',
        description: error instanceof Error ? error.message : 'Failed to clock out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId, toast]);

  const handleStartBreak = useCallback(async (breakType: BreakType) => {
    setIsLoading(true);
    try {
      await dispatch(startBreak({ staffId: memberId, breakType })).unwrap();
      toast({
        title: 'Break Started',
        description: `${breakType === 'paid' ? 'Paid' : 'Unpaid'} break started.`,
      });
    } catch (error) {
      console.error('Failed to start break:', error);
      toast({
        title: 'Start Break Failed',
        description: error instanceof Error ? error.message : 'Failed to start break. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId, toast]);

  const handleEndBreak = useCallback(async () => {
    setIsLoading(true);
    try {
      await dispatch(endBreak({ staffId: memberId })).unwrap();
      toast({
        title: 'Break Ended',
        description: 'Break ended. Back to work!',
      });
    } catch (error) {
      console.error('Failed to end break:', error);
      toast({
        title: 'End Break Failed',
        description: error instanceof Error ? error.message : 'Failed to end break. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, memberId, toast]);

  return {
    isLoading,
    handleClockIn,
    handleClockOut,
    handleStartBreak,
    handleEndBreak,
  };
}

export default useTimesheetActions;
