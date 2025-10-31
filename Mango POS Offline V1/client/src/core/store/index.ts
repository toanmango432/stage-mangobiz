import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import syncReducer from './slices/syncSlice';
import uiReducer from './slices/uiSlice';

// Placeholder reducers - will be replaced with feature reducers
const appointmentsReducer = (state = { items: [] }, action: any) => state;
const ticketsReducer = (state = { items: [] }, action: any) => state;
const staffReducer = (state = { items: [] }, action: any) => state;
const clientsReducer = (state = { items: [] }, action: any) => state;
const transactionsReducer = (state = { items: [] }, action: any) => state;
const uiTicketsReducer = (state = {}, action: any) => state;
const uiStaffReducer = (state = {}, action: any) => state;

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
        ignoredActions: [
          'appointments/setAppointments',
          'appointments/setSelectedDate',
          'appointments/addLocalAppointment',
          'tickets/setTickets',
        ],
        ignoredActionPaths: [
          'payload.createdAt',
          'payload.updatedAt',
          'payload.scheduledStartTime',
          'payload.scheduledEndTime',
          'payload.arrivalTime',
          'payload',
        ],
        ignoredPaths: [
          'appointments.items',
          'appointments.appointments',
          'tickets.items',
          'staff.items',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

