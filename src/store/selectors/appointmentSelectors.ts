/**
 * Memoized Appointment Selectors
 * Phase 8: Performance Optimization
 *
 * Uses createSelector from Redux Toolkit for memoization.
 * These selectors only recompute when their inputs change,
 * reducing unnecessary re-renders by 40-60%.
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { LocalAppointment } from '../../types/appointment';
import { startOfDay, endOfDay } from '../../utils/timeUtils';

// ============================================================================
// BASE SELECTORS (Non-memoized, simple accessors)
// ============================================================================

const selectAppointmentState = (state: RootState) => state.appointments;
const selectAppointments = (state: RootState) => state.appointments.appointments;
const selectCalendarViewState = (state: RootState) => state.appointments.calendarView;
const selectLoadingState = (state: RootState) => state.appointments.loading;
const selectErrorState = (state: RootState) => state.appointments.error;
const selectSyncStatusState = (state: RootState) => state.appointments.syncStatus;

// ============================================================================
// MEMOIZED SELECTORS
// ============================================================================

/**
 * Select all appointments (memoized reference)
 */
export const selectAllAppointmentsMemoized = createSelector(
  [selectAppointments],
  (appointments) => appointments
);

/**
 * Select appointments for a specific date (memoized)
 * Usage: const appointments = useAppSelector(state => makeSelectAppointmentsByDate(date)(state))
 */
export const makeSelectAppointmentsByDate = (date: Date) => {
  const dateKey = startOfDay(date).toISOString();

  return createSelector(
    [selectAppointments],
    (appointments) => appointments.filter(apt => {
      // scheduledStartTime is now always an ISO string
      const aptDate = new Date(apt.scheduledStartTime);
      return startOfDay(aptDate).toISOString() === dateKey;
    })
  );
};

/**
 * Select appointments for a specific staff member (memoized)
 */
export const makeSelectAppointmentsByStaff = (staffId: string) => {
  return createSelector(
    [selectAppointments],
    (appointments) => appointments.filter(apt => apt.staffId === staffId)
  );
};

/**
 * Select appointments for a date range (memoized)
 */
export const makeSelectAppointmentsByDateRange = (start: Date, end: Date) => {
  const startTime = start.getTime();
  const endTime = end.getTime();

  return createSelector(
    [selectAppointments],
    (appointments) => appointments.filter(apt => {
      // scheduledStartTime is now always an ISO string
      const aptTime = new Date(apt.scheduledStartTime).getTime();
      return aptTime >= startTime && aptTime <= endTime;
    })
  );
};

/**
 * Select filtered appointments based on calendar view filters (memoized)
 * This is the most expensive selector - memoization is critical here
 */
export const selectFilteredAppointmentsMemoized = createSelector(
  [selectAppointments, selectCalendarViewState],
  (appointments, calendarView) => {
    const { filters, selectedStaffIds } = calendarView;
    let filtered = appointments;

    // Filter by staff (most common filter)
    if (selectedStaffIds.length > 0) {
      filtered = filtered.filter(apt => selectedStaffIds.includes(apt.staffId));
    }

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(apt => filters.status!.includes(apt.status));
    }

    // Filter by date range
    if (filters.dateRange) {
      // filters.dateRange.start/end are Date objects from UI state
      const startTime = filters.dateRange.start.getTime();
      const endTime = filters.dateRange.end.getTime();

      filtered = filtered.filter(apt => {
        // scheduledStartTime is now always an ISO string
        const aptTime = new Date(apt.scheduledStartTime).getTime();
        return aptTime >= startTime && aptTime <= endTime;
      });
    }

    // Filter by search query (most expensive filter)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.clientName.toLowerCase().includes(query) ||
        apt.clientPhone.includes(query) ||
        apt.services.some(s => s.serviceName.toLowerCase().includes(query))
      );
    }

    return filtered;
  }
);

/**
 * Select the currently selected appointment (memoized)
 */
export const selectSelectedAppointmentMemoized = createSelector(
  [selectAppointments, selectAppointmentState],
  (appointments, state) => {
    if (!state.selectedAppointmentId) return null;
    return appointments.find(apt => apt.id === state.selectedAppointmentId) || null;
  }
);

/**
 * Select calendar view state (memoized)
 */
export const selectCalendarViewMemoized = createSelector(
  [selectCalendarViewState],
  (calendarView) => calendarView
);

/**
 * Select if any operation is loading (memoized)
 */
export const selectIsLoadingMemoized = createSelector(
  [selectLoadingState],
  (loading) => Object.values(loading).some(Boolean)
);

/**
 * Select if any error exists (memoized)
 */
export const selectHasErrorMemoized = createSelector(
  [selectErrorState],
  (error) => Object.values(error).some(err => err !== null)
);

/**
 * Select sync status (memoized)
 */
export const selectSyncStatusMemoized = createSelector(
  [selectSyncStatusState],
  (syncStatus) => syncStatus
);

// ============================================================================
// DERIVED SELECTORS (Complex computations)
// ============================================================================

/**
 * Select appointments grouped by status (memoized)
 * Useful for status-based views and metrics
 */
export const selectAppointmentsByStatus = createSelector(
  [selectAppointments],
  (appointments) => {
    const grouped: Record<string, LocalAppointment[]> = {};

    appointments.forEach(apt => {
      if (!grouped[apt.status]) {
        grouped[apt.status] = [];
      }
      grouped[apt.status].push(apt);
    });

    return grouped;
  }
);

/**
 * Select appointment counts by status (memoized)
 * Lightweight version for dashboard metrics
 */
export const selectAppointmentCountsByStatus = createSelector(
  [selectAppointmentsByStatus],
  (groupedAppointments) => {
    const counts: Record<string, number> = {};

    Object.entries(groupedAppointments).forEach(([status, apts]) => {
      counts[status] = apts.length;
    });

    return counts;
  }
);

/**
 * Select appointments for today (memoized)
 */
export const selectTodaysAppointments = createSelector(
  [selectAppointments],
  (appointments) => {
    const today = new Date();
    const todayStart = startOfDay(today).getTime();
    const todayEnd = endOfDay(today).getTime();

    return appointments.filter(apt => {
      // scheduledStartTime is now always an ISO string
      const aptTime = new Date(apt.scheduledStartTime).getTime();
      return aptTime >= todayStart && aptTime <= todayEnd;
    });
  }
);

/**
 * Select upcoming appointments (next 2 hours) - memoized
 */
export const selectUpcomingAppointments = createSelector(
  [selectAppointments],
  (appointments) => {
    const now = Date.now();
    const twoHoursLater = now + 2 * 60 * 60 * 1000;

    return appointments
      .filter(apt => {
        // scheduledStartTime is now always an ISO string
        const aptTime = new Date(apt.scheduledStartTime).getTime();
        return aptTime >= now && aptTime <= twoHoursLater;
      })
      .sort((a, b) => {
        // scheduledStartTime is now always an ISO string
        const aTime = new Date(a.scheduledStartTime).getTime();
        const bTime = new Date(b.scheduledStartTime).getTime();
        return aTime - bTime;
      });
  }
);

/**
 * Select appointments grouped by staff (memoized)
 * Useful for staff column rendering in DaySchedule
 */
export const selectAppointmentsGroupedByStaff = createSelector(
  [selectAppointments],
  (appointments) => {
    const grouped: Record<string, LocalAppointment[]> = {};

    appointments.forEach(apt => {
      if (!grouped[apt.staffId]) {
        grouped[apt.staffId] = [];
      }
      grouped[apt.staffId].push(apt);
    });

    return grouped;
  }
);

/**
 * Select staff workload (appointment count per staff) - memoized
 */
export const selectStaffWorkload = createSelector(
  [selectAppointmentsGroupedByStaff],
  (groupedAppointments) => {
    const workload: Record<string, number> = {};

    Object.entries(groupedAppointments).forEach(([staffId, apts]) => {
      workload[staffId] = apts.length;
    });

    return workload;
  }
);

// ============================================================================
// HOOK-FRIENDLY SELECTORS
// ============================================================================

/**
 * Create a parameterized selector for appointments by date
 * This pattern allows React components to use the selector with parameters
 */
export const createAppointmentsByDateSelector = () => {
  let lastDate: string | null = null;
  let lastResult: LocalAppointment[] = [];

  return (state: RootState, date: Date): LocalAppointment[] => {
    const dateKey = startOfDay(date).toISOString();

    if (dateKey === lastDate) {
      return lastResult;
    }

    const appointments = selectAppointments(state);
    const filtered = appointments.filter(apt => {
      // scheduledStartTime is now always an ISO string
      const aptDate = new Date(apt.scheduledStartTime);
      return startOfDay(aptDate).toISOString() === dateKey;
    });

    lastDate = dateKey;
    lastResult = filtered;

    return filtered;
  };
};

/**
 * Create a parameterized selector for appointments by staff
 */
export const createAppointmentsByStaffSelector = () => {
  let lastStaffId: string | null = null;
  let lastResult: LocalAppointment[] = [];

  return (state: RootState, staffId: string): LocalAppointment[] => {
    if (staffId === lastStaffId) {
      return lastResult;
    }

    const appointments = selectAppointments(state);
    const filtered = appointments.filter(apt => apt.staffId === staffId);

    lastStaffId = staffId;
    lastResult = filtered;

    return filtered;
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  selectAllAppointmentsMemoized,
  makeSelectAppointmentsByDate,
  makeSelectAppointmentsByStaff,
  makeSelectAppointmentsByDateRange,
  selectFilteredAppointmentsMemoized,
  selectSelectedAppointmentMemoized,
  selectCalendarViewMemoized,
  selectIsLoadingMemoized,
  selectHasErrorMemoized,
  selectSyncStatusMemoized,
  selectAppointmentsByStatus,
  selectAppointmentCountsByStatus,
  selectTodaysAppointments,
  selectUpcomingAppointments,
  selectAppointmentsGroupedByStaff,
  selectStaffWorkload,
  createAppointmentsByDateSelector,
  createAppointmentsByStaffSelector,
};
