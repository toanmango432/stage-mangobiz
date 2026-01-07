import { configureStore } from '@reduxjs/toolkit';
import bookingReducer from '@/features/booking/redux/bookingSlice';

export const store = configureStore({
  reducer: {
    booking: bookingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['booking/setSelectedDate'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
