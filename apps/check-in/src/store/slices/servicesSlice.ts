/**
 * Services Redux Slice
 *
 * Handles fetching and caching services from dataService.
 * Works offline via IndexedDB caching in dataService.
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { dataService } from '../../services/dataService';
import type { Service, ServiceCategory } from '../../types';

interface ServicesState {
  services: Service[];
  categories: ServiceCategory[];
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: ServicesState = {
  services: [],
  categories: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

export const fetchServices = createAsyncThunk(
  'services/fetchServices',
  async () => {
    const categories = await dataService.services.getByCategory();
    const services = categories.flatMap((cat) => cat.services);
    return { services, categories };
  }
);

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    clearServicesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action: PayloadAction<{ services: Service[]; categories: ServiceCategory[] }>) => {
        state.services = action.payload.services;
        state.categories = action.payload.categories;
        state.isLoading = false;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to fetch services';
      });
  },
});

export const { clearServicesError } = servicesSlice.actions;
export default servicesSlice.reducer;
