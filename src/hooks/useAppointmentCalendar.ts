/**
 * useAppointmentCalendar Hook
 * Main hook for appointment calendar functionality
 */

import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  selectCalendarView,
  setSelectedDate,
  setSelectedStaffIds,
  setViewMode,
  setTimeWindowMode,
} from '../store/slices/appointmentsSlice';
import { RootState } from '../store';
import {
  generateTimeSlots,
  calculate2HourWindow,
} from '../utils/timeUtils';
import {
  DEFAULT_BUSINESS_HOURS,
  TIME_WINDOW_MODES,
  type CalendarView,
  type TimeWindowMode,
} from '../constants/appointment';
import { LocalAppointment } from '../types/appointment';
import { AppointmentFilters } from '../components/Book/FilterPanel';
import { filterAppointments } from '../utils/appointmentFilters';

interface UseAppointmentCalendarOptions {
  filters?: AppointmentFilters;
}

export function useAppointmentCalendar(options: UseAppointmentCalendarOptions = {}) {
  const { filters } = options;
  const dispatch = useAppDispatch();

  // Get calendar view state
  const calendarView = useAppSelector(selectCalendarView);
  const { selectedDate, viewMode, timeWindowMode, selectedStaffIds } = calendarView;

  // Get appointments from state
  const appointmentsByDate = useAppSelector((state: RootState) => state.appointments.appointmentsByDate);
  const appointmentsByStaff = useAppSelector((state: RootState) => state.appointments.appointmentsByStaff);

  // Get appointments for selected date
  const appointments = useMemo(() => {
    // Create date key matching the indexing format (start of day ISO string)
    const startOfSelectedDay = new Date(selectedDate);
    startOfSelectedDay.setHours(0, 0, 0, 0);
    const dateKey = startOfSelectedDay.toISOString();
    
    console.log('🔍 Looking for appointments with key:', dateKey);
    console.log('📅 Available date keys:', Object.keys(appointmentsByDate));
    
    return appointmentsByDate[dateKey] || [];
  }, [appointmentsByDate, selectedDate]);

  // Filter appointments by selected staff and other filters
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Filter by staff selection
    if (selectedStaffIds.length > 0) {
      filtered = filtered.filter((apt: LocalAppointment) => selectedStaffIds.includes(apt.staffId));
    }

    // Apply additional filters (search, status, service type)
    if (filters) {
      filtered = filterAppointments(filtered, filters);
    }

    return filtered;
  }, [appointments, selectedStaffIds, filters]);

  // Generate time slots
  const timeSlots = useMemo(() => {
    return generateTimeSlots(
      DEFAULT_BUSINESS_HOURS.START_HOUR,
      DEFAULT_BUSINESS_HOURS.END_HOUR
    );
  }, []);

  // Calculate visible time slots based on window mode
  const visibleTimeSlots = useMemo(() => {
    if (timeWindowMode === TIME_WINDOW_MODES.FULL_DAY) {
      return timeSlots;
    }

    // 2-hour window mode
    const window = calculate2HourWindow(filteredAppointments);
    if (!window) {
      return timeSlots;
    }

    return timeSlots.filter(
      slot =>
        slot.timeInSeconds >= window.startTime &&
        slot.timeInSeconds <= window.endTime
    );
  }, [timeSlots, timeWindowMode, filteredAppointments]);

  // Actions
  const handleDateChange = useCallback(
    (date: Date) => {
      dispatch(setSelectedDate(date));
    },
    [dispatch]
  );

  const handleStaffSelection = useCallback(
    (staffIds: string[]) => {
      dispatch(setSelectedStaffIds(staffIds));
    },
    [dispatch]
  );

  const handleViewChange = useCallback(
    (view: CalendarView) => {
      dispatch(setViewMode(view));
    },
    [dispatch]
  );

  const handleTimeWindowModeChange = useCallback(
    (mode: TimeWindowMode) => {
      dispatch(setTimeWindowMode(mode));
    },
    [dispatch]
  );

  const goToToday = useCallback(() => {
    dispatch(setSelectedDate(new Date()));
  }, [dispatch]);

  const goToNextDay = useCallback(() => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    dispatch(setSelectedDate(nextDay));
  }, [dispatch, selectedDate]);

  const goToPrevDay = useCallback(() => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    dispatch(setSelectedDate(prevDay));
  }, [dispatch, selectedDate]);

  return {
    // State
    selectedDate,
    selectedStaffIds,
    calendarView: viewMode,
    timeWindowMode,
    appointments,
    filteredAppointments,
    timeSlots,
    visibleTimeSlots,
    appointmentsByStaff,

    // Actions
    handleDateChange,
    handleStaffSelection,
    handleViewChange,
    handleTimeWindowModeChange,
    goToToday,
    goToNextDay,
    goToPrevDay,
  };
}
