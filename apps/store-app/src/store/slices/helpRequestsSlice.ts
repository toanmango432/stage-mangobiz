/**
 * Help Requests Slice
 * Tracks help requests from Mango Pad devices that require staff acknowledgment.
 * These notifications persist until manually acknowledged by staff.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface HelpRequest {
  id: string;
  transactionId: string;
  ticketId: string;
  deviceId: string;
  deviceName: string;
  clientName?: string;
  requestedAt: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

interface HelpRequestsState {
  requests: HelpRequest[];
}

const initialState: HelpRequestsState = {
  requests: [],
};

const helpRequestsSlice = createSlice({
  name: 'helpRequests',
  initialState,
  reducers: {
    addHelpRequest: (state, action: PayloadAction<Omit<HelpRequest, 'id' | 'acknowledged'>>) => {
      const id = `help-${Date.now()}-${action.payload.deviceId}`;
      state.requests.push({
        ...action.payload,
        id,
        acknowledged: false,
      });
    },
    acknowledgeHelpRequest: (state, action: PayloadAction<{ id: string; acknowledgedBy?: string }>) => {
      const request = state.requests.find(r => r.id === action.payload.id);
      if (request) {
        request.acknowledged = true;
        request.acknowledgedAt = new Date().toISOString();
        request.acknowledgedBy = action.payload.acknowledgedBy;
      }
    },
    removeHelpRequest: (state, action: PayloadAction<string>) => {
      state.requests = state.requests.filter(r => r.id !== action.payload);
    },
    clearAcknowledgedRequests: (state) => {
      state.requests = state.requests.filter(r => !r.acknowledged);
    },
  },
});

export const {
  addHelpRequest,
  acknowledgeHelpRequest,
  removeHelpRequest,
  clearAcknowledgedRequests,
} = helpRequestsSlice.actions;

export const selectAllHelpRequests = (state: RootState) => state.helpRequests.requests;
export const selectPendingHelpRequests = (state: RootState) =>
  state.helpRequests.requests.filter(r => !r.acknowledged);
export const selectHasPendingHelpRequests = (state: RootState) =>
  state.helpRequests.requests.some(r => !r.acknowledged);

export default helpRequestsSlice.reducer;
