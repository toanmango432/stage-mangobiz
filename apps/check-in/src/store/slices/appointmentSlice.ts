/**
 * Appointment Slice - Redux state for QR code appointment check-in
 *
 * Handles appointment lookup via QR code and arrival confirmation.
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { dataService } from '../../services/dataService';
import type { Appointment } from '../../types';

export interface AppointmentState {
  currentAppointment: Appointment | null;
  lookupStatus: 'idle' | 'loading' | 'found' | 'not_found' | 'error';
  confirmStatus: 'idle' | 'confirming' | 'confirmed' | 'error';
  error: string | null;
}

const initialState: AppointmentState = {
  currentAppointment: null,
  lookupStatus: 'idle',
  confirmStatus: 'idle',
  error: null,
};

export const fetchAppointmentByQrCode = createAsyncThunk<
  Appointment | null,
  string,
  { rejectValue: string }
>('appointment/fetchByQrCode', async (qrData, { rejectWithValue }) => {
  try {
    const appointment = await dataService.appointments.getByQrCode(qrData);
    return appointment;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to lookup appointment';
    return rejectWithValue(message);
  }
});

export const confirmAppointmentArrival = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>('appointment/confirmArrival', async (appointmentId, { rejectWithValue }) => {
  try {
    await dataService.appointments.confirmArrival(appointmentId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to confirm arrival';
    return rejectWithValue(message);
  }
});

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState,
  reducers: {
    resetAppointment: (state) => {
      state.currentAppointment = null;
      state.lookupStatus = 'idle';
      state.confirmStatus = 'idle';
      state.error = null;
    },
    setAppointment: (state, action: PayloadAction<Appointment>) => {
      state.currentAppointment = action.payload;
      state.lookupStatus = 'found';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointmentByQrCode.pending, (state) => {
        state.lookupStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchAppointmentByQrCode.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentAppointment = action.payload;
          state.lookupStatus = 'found';
        } else {
          state.currentAppointment = null;
          state.lookupStatus = 'not_found';
        }
      })
      .addCase(fetchAppointmentByQrCode.rejected, (state, action) => {
        state.lookupStatus = 'error';
        state.error = action.payload ?? 'Unknown error';
      })
      .addCase(confirmAppointmentArrival.pending, (state) => {
        state.confirmStatus = 'confirming';
        state.error = null;
      })
      .addCase(confirmAppointmentArrival.fulfilled, (state) => {
        state.confirmStatus = 'confirmed';
        if (state.currentAppointment) {
          state.currentAppointment.status = 'arrived';
        }
      })
      .addCase(confirmAppointmentArrival.rejected, (state, action) => {
        state.confirmStatus = 'error';
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export const { resetAppointment, setAppointment } = appointmentSlice.actions;
export default appointmentSlice.reducer;
