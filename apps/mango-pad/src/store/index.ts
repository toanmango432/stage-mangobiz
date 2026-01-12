/**
 * Redux Store Configuration
 * Central store for Mango Pad application state
 */

import { configureStore } from '@reduxjs/toolkit';
import padReducer from './slices/padSlice';
import transactionReducer from './slices/transactionSlice';
import configReducer from './slices/configSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    pad: padReducer,
    transaction: transactionReducer,
    config: configReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['transaction/setPaymentResult'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
