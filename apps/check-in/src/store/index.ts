import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import { authReducer, uiReducer, checkinReducer, clientReducer, syncReducer, servicesReducer } from './slices';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    checkin: checkinReducer,
    client: clientReducer,
    sync: syncReducer,
    services: servicesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['checkin/setQueueStatus'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export * from './slices';
