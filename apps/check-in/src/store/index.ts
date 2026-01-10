import { configureStore } from '@reduxjs/toolkit';
import { authReducer, uiReducer, checkinReducer } from './slices';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    checkin: checkinReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check (dates, etc.)
        ignoredActions: ['checkin/setQueueStatus'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Re-export everything from slices for convenience
export * from './slices';
