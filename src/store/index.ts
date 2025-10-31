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

export const store = configureStore({
  reducer: {
    appointments: appointmentsReducer,
    tickets: ticketsReducer,
    staff: staffReducer,
    clients: clientsReducer,
    transactions: transactionsReducer,
    auth: authReducer,
    sync: syncReducer,
    ui: uiReducer,
    uiTickets: uiTicketsReducer,
    uiStaff: uiStaffReducer,
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
          'appointments.appointmentsByDate',
          'appointments.appointmentsByStaff',
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
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
