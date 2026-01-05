import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { staffDB } from '../../db/database';
import { dataService } from '../../services/dataService';
// toStaff/toStaffList/etc not needed - dataService returns converted types
import type { Staff } from '../../types';
import type { RootState } from '../index';

interface StaffState {
  items: Staff[];
  availableStaff: Staff[];
  selectedStaff: Staff | null;
  loading: boolean;
  error: string | null;
  staffList?: Staff[];  // Alias for items (for backward compatibility)
}

const initialState: StaffState = {
  items: [],
  availableStaff: [],
  selectedStaff: null,
  loading: false,
  error: null,
};

// ==================== SUPABASE THUNKS (Phase 6) ====================

/**
 * Fetch all staff from Supabase via dataService
 * Note: storeId is obtained internally from Redux auth state
 */
export const fetchAllStaffFromSupabase = createAsyncThunk(
  'staff/fetchAllFromSupabase',
  async () => {
    // dataService already returns Staff[] (converted)
    return await dataService.staff.getAll();
  }
);

/**
 * Fetch active staff from Supabase
 * Note: storeId is obtained internally from Redux auth state
 */
export const fetchActiveStaffFromSupabase = createAsyncThunk(
  'staff/fetchActiveFromSupabase',
  async () => {
    // dataService already returns Staff[] (converted)
    return await dataService.staff.getActive();
  }
);

/**
 * Fetch single staff by ID from Supabase
 */
export const fetchStaffByIdFromSupabase = createAsyncThunk(
  'staff/fetchByIdFromSupabase',
  async (staffId: string) => {
    // dataService already returns Staff (converted)
    const staff = await dataService.staff.getById(staffId);
    if (!staff) throw new Error('Staff not found');
    return staff;
  }
);

/**
 * Create staff in Supabase via dataService
 * Note: storeId is obtained internally from Redux auth state
 */
export const createStaffInSupabase = createAsyncThunk(
  'staff/createInSupabase',
  async (staff: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => {
    // dataService.staff.create returns Staff directly
    return await dataService.staff.create(staff);
  }
);

/**
 * Update staff in Supabase via dataService
 */
export const updateStaffInSupabase = createAsyncThunk(
  'staff/updateInSupabase',
  async ({ id, updates }: { id: string; updates: Partial<Staff> }) => {
    // dataService.staff.update returns Staff directly
    return await dataService.staff.update(id, updates);
  }
);

/**
 * Delete staff in Supabase via dataService
 */
export const deleteStaffInSupabase = createAsyncThunk(
  'staff/deleteInSupabase',
  async (staffId: string, { rejectWithValue }) => {
    try {
      await dataService.staff.delete(staffId);
      return staffId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete staff');
    }
  }
);

// ==================== LEGACY ASYNC THUNKS (IndexedDB) ====================

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

export const updateStaffSpecialties = createAsyncThunk(
  'staff/updateSpecialties',
  async ({ staffId, specialties }: { staffId: string; specialties: string[] }) => {
    return await staffDB.update(staffId, { specialties });
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
      })
      .addCase(updateStaffSpecialties.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.items.findIndex(s => s.id === action.payload!.id);
          if (index !== -1) state.items[index] = action.payload;
        }
      });

    // ==================== SUPABASE THUNKS REDUCERS (Phase 6) ====================

    // Fetch all staff from Supabase
    builder
      .addCase(fetchAllStaffFromSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllStaffFromSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllStaffFromSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch staff from Supabase';
      });

    // Fetch active staff from Supabase
    builder
      .addCase(fetchActiveStaffFromSupabase.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveStaffFromSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.availableStaff = action.payload;
      })
      .addCase(fetchActiveStaffFromSupabase.rejected, (state) => {
        state.loading = false;
      });

    // Fetch staff by ID from Supabase
    builder
      .addCase(fetchStaffByIdFromSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffByIdFromSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedStaff = action.payload;
      })
      .addCase(fetchStaffByIdFromSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch staff from Supabase';
      });

    // Create staff in Supabase
    builder
      .addCase(createStaffInSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStaffInSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createStaffInSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create staff in Supabase';
      });

    // Update staff in Supabase
    builder
      .addCase(updateStaffInSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStaffInSupabase.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload) return;
        const updatedStaff = action.payload;
        const index = state.items.findIndex(s => s.id === updatedStaff.id);
        if (index !== -1) {
          state.items[index] = updatedStaff;
        }
        if (state.selectedStaff?.id === updatedStaff.id) {
          state.selectedStaff = updatedStaff;
        }
      })
      .addCase(updateStaffInSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update staff in Supabase';
      });

    // Delete staff in Supabase
    builder
      .addCase(deleteStaffInSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStaffInSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(s => s.id !== action.payload);
        if (state.selectedStaff?.id === action.payload) {
          state.selectedStaff = null;
        }
      })
      .addCase(deleteStaffInSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete staff in Supabase';
      });
  },
});

export const { setStaff, setSelectedStaff } = staffSlice.actions;
export const selectAllStaff = (state: RootState) => state.staff.items;
export const selectAvailableStaff = (state: RootState) => state.staff.availableStaff;
export const selectSelectedStaff = (state: RootState) => state.staff.selectedStaff;

export default staffSlice.reducer;
