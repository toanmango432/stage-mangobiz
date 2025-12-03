import { configureStore } from '@reduxjs/toolkit';
import appointmentsReducer from './slices/appointmentsSlice';
import ticketsReducer from './slices/ticketsSlice';
import staffReducer from './slices/staffSlice';
import clientsReducer from './slices/clientsSlice';
import transactionsReducer from './slices/transactionsSlice';
import authReducer from './slices/authSlice';
import syncReducer from './slices/syncSlice';
import uiReducer from './slices/uiSlice';
import uiTicketsReducer from './slices/uiTicketsSlice';
import uiStaffReducer from './slices/uiStaffSlice';
import frontDeskSettingsReducer from './slices/frontDeskSettingsSlice';
import teamReducer from './slices/teamSlice';
import scheduleReducer from './slices/scheduleSlice';
import staffScheduleReducer from './slices/staffScheduleSlice';
import checkoutReducer from './slices/checkoutSlice';
import timesheetReducer from './slices/timesheetSlice';
import payrollReducer from './slices/payrollSlice';
import staffPerformanceReducer from './slices/staffPerformanceSlice';
import { teamStaffSyncMiddleware } from './middleware/teamStaffSyncMiddleware';
// Note: Catalog module uses useCatalog hook with Dexie live queries directly (no Redux)
// See src/hooks/useCatalog.ts

export const store = configureStore({
  reducer: {
    appointments: appointmentsReducer,
    tickets: ticketsReducer,
    staff: staffReducer,
    clients: clientsReducer,
    transactions: transactionsReducer,
    auth: authReducer,
    user: authReducer,  // Alias for auth (for backward compatibility)
    sync: syncReducer,
    ui: uiReducer,
    uiTickets: uiTicketsReducer,
    uiStaff: uiStaffReducer,
    frontDeskSettings: frontDeskSettingsReducer,
    team: teamReducer,
    schedule: scheduleReducer,
    staffSchedule: staffScheduleReducer,
    checkout: checkoutReducer,
    timesheet: timesheetReducer,
    payroll: payrollReducer,
    staffPerformance: staffPerformanceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'appointments/setAppointments',
          'appointments/setSelectedDate',
          'appointments/addLocalAppointment',
          'tickets/setTickets',
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          'payload.createdAt',
          'payload.updatedAt',
          'payload.scheduledStartTime',
          'payload.scheduledEndTime',
          'payload.arrivalTime',
          'payload',
        ],
        // Ignore these paths in the state (with wildcards for all nested dates)
        ignoredPaths: [
          'appointments.items',
          'appointments.appointments',
          'appointments.calendarView.selectedDate',
          'appointments.syncStatus.lastSync',
          'tickets.items',
          'staff.items',
          'staff.byId',
          'staff.allIds',
          'uiTickets.waitlist',
          'uiTickets.serviceTickets',
          'uiTickets.completedTickets',
          'uiTickets.pendingTickets',
          'uiTickets.serviceList',
          'uiTickets.loadedAt',
          'uiTickets.pending',
          'uiStaff.loadedAt',
          'uiStaff.pending',
          'team.members',
          'team.sync.lastSyncAt',
          // Schedule module
          'schedule.timeOffTypes.items',
          'schedule.timeOffRequests.items',
          'schedule.blockedTimeTypes.items',
          'schedule.blockedTimeEntries.items',
          'schedule.closedPeriods.items',
          // Staff Schedule module
          'staffSchedule.items',
          'staffSchedule.byStaffId',
          'staffSchedule.currentByStaffId',
          // Checkout module
          'checkout.activeCheckout.partialPayments',
          'checkout.lastAutoSave',
          'checkout.drafts',
          // Timesheet module
          'timesheet.timesheets',
          'timesheet.shiftStatuses',
          'timesheet.alerts',
          'timesheet.sync.lastSyncAt',
          // Payroll module
          'payroll.payRuns',
          // Staff Performance module
          'staffPerformance.byStaffId',
        ],
      },
    }).concat(teamStaffSyncMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
