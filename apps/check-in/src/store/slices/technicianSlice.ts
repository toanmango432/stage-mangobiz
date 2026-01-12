/**
 * Technician Redux Slice
 *
 * Handles fetching technicians and real-time status updates via MQTT.
 * Technicians are filtered by qualified services when selecting.
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { dataService } from '../../services/dataService';
import type { Technician, TechnicianStatus } from '../../types';

interface TechnicianState {
  technicians: Technician[];
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: TechnicianState = {
  technicians: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

export const fetchTechnicians = createAsyncThunk(
  'technicians/fetchTechnicians',
  async () => {
    const technicians = await dataService.technicians.getAll();
    return technicians;
  }
);

export interface StaffStatusUpdate {
  technicianId: string;
  status: TechnicianStatus;
  estimatedWaitMinutes?: number;
}

const technicianSlice = createSlice({
  name: 'technicians',
  initialState,
  reducers: {
    updateTechnicianStatus: (state, action: PayloadAction<StaffStatusUpdate>) => {
      const tech = state.technicians.find((t) => t.id === action.payload.technicianId);
      if (tech) {
        tech.status = action.payload.status;
        if (action.payload.estimatedWaitMinutes !== undefined) {
          tech.estimatedWaitMinutes = action.payload.estimatedWaitMinutes;
        }
      }
    },
    updateTechnicianStatuses: (state, action: PayloadAction<StaffStatusUpdate[]>) => {
      for (const update of action.payload) {
        const tech = state.technicians.find((t) => t.id === update.technicianId);
        if (tech) {
          tech.status = update.status;
          if (update.estimatedWaitMinutes !== undefined) {
            tech.estimatedWaitMinutes = update.estimatedWaitMinutes;
          }
        }
      }
    },
    clearTechniciansError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTechnicians.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTechnicians.fulfilled, (state, action: PayloadAction<Technician[]>) => {
        state.technicians = action.payload;
        state.isLoading = false;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchTechnicians.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to fetch technicians';
      });
  },
});

export const {
  updateTechnicianStatus,
  updateTechnicianStatuses,
  clearTechniciansError,
} = technicianSlice.actions;
export default technicianSlice.reducer;
