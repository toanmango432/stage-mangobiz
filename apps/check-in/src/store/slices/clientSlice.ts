import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Client, NewClientInput } from '../../types';
import { dataService } from '../../services/dataService';

interface ClientState {
  clients: Client[];
  currentClient: Client | null;
  isLoading: boolean;
  error: string | null;
  phoneSearchResult: {
    status: 'idle' | 'loading' | 'found' | 'not_found' | 'error';
    client: Client | null;
  };
}

const initialState: ClientState = {
  clients: [],
  currentClient: null,
  isLoading: false,
  error: null,
  phoneSearchResult: {
    status: 'idle',
    client: null,
  },
};

export const fetchClientByPhone = createAsyncThunk(
  'client/fetchByPhone',
  async (phone: string, { rejectWithValue }) => {
    try {
      const client = await dataService.clients.getByPhone(phone);
      return client;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch client'
      );
    }
  }
);

export const createClient = createAsyncThunk(
  'client/create',
  async (input: NewClientInput, { rejectWithValue }) => {
    try {
      const client = await dataService.clients.create(input);
      return client;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create client'
      );
    }
  }
);

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    setCurrentClient: (state, action: PayloadAction<Client | null>) => {
      state.currentClient = action.payload;
    },
    clearPhoneSearch: (state) => {
      state.phoneSearchResult = { status: 'idle', client: null };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetClient: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientByPhone.pending, (state) => {
        state.phoneSearchResult.status = 'loading';
        state.phoneSearchResult.client = null;
        state.error = null;
      })
      .addCase(fetchClientByPhone.fulfilled, (state, action) => {
        if (action.payload) {
          state.phoneSearchResult.status = 'found';
          state.phoneSearchResult.client = action.payload;
          state.currentClient = action.payload;
        } else {
          state.phoneSearchResult.status = 'not_found';
          state.phoneSearchResult.client = null;
        }
      })
      .addCase(fetchClientByPhone.rejected, (state, action) => {
        state.phoneSearchResult.status = 'error';
        state.error = action.payload as string;
      })
      .addCase(createClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentClient = action.payload;
        state.clients.push(action.payload);
      })
      .addCase(createClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentClient, clearPhoneSearch, clearError, resetClient } =
  clientSlice.actions;
export default clientSlice.reducer;
