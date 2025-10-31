import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { staffDB } from '../../db/database';
import type { Staff } from '../../types';
import type { RootState } from '../index';

interface StaffState {
  items: Staff[];
  availableStaff: Staff[];
  selectedStaff: Staff | null;
  loading: boolean;
  error: string | null;
}

const initialState: StaffState = {
  items: [],
  availableStaff: [],
  selectedStaff: null,
  loading: false,
  error: null,
};

export const fetchAllStaff = createAsyncThunk(
  'staff/fetchAll',
  async (salonId: string) => {
    return await staffDB.getAll(salonId);
  }
);

export const fetchAvailableStaff = createAsyncThunk(
  'staff/fetchAvailable',
  async (salonId: string) => {
    return await staffDB.getAvailable(salonId);
  }
);

export const clockInStaff = createAsyncThunk(
  'staff/clockIn',
  async (id: string) => {
    return await staffDB.clockIn(id);
  }
);

export const clockOutStaff = createAsyncThunk(
  'staff/clockOut',
  async (id: string) => {
    return await staffDB.clockOut(id);
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    setStaff: (state, action: PayloadAction<Staff[]>) => {
      state.items = action.payload;
    },
    setSelectedStaff: (state, action: PayloadAction<Staff | null>) => {
      state.selectedStaff = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllStaff.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAvailableStaff.fulfilled, (state, action) => {
        state.availableStaff = action.payload;
      })
      .addCase(clockInStaff.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.items.findIndex(s => s.id === action.payload!.id);
          if (index !== -1) state.items[index] = action.payload;
        }
      })
      .addCase(clockOutStaff.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.items.findIndex(s => s.id === action.payload!.id);
          if (index !== -1) state.items[index] = action.payload;
        }
      });
  },
});

export const { setStaff, setSelectedStaff } = staffSlice.actions;
export const selectAllStaff = (state: RootState) => state.staff.items;
export const selectAvailableStaff = (state: RootState) => state.staff.availableStaff;
export const selectSelectedStaff = (state: RootState) => state.staff.selectedStaff;

export default staffSlice.reducer;
