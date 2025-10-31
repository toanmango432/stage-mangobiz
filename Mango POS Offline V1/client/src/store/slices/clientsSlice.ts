import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { clientsDB } from '../../db/database';
import type { Client } from '../../types';
import type { RootState } from '../index';

interface ClientsState {
  items: Client[];
  searchResults: Client[];
  selectedClient: Client | null;
  loading: boolean;
}

const initialState: ClientsState = {
  items: [],
  searchResults: [],
  selectedClient: null,
  loading: false,
};

export const searchClients = createAsyncThunk(
  'clients/search',
  async ({ salonId, query }: { salonId: string; query: string }) => {
    return await clientsDB.search(salonId, query);
  }
);

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(searchClients.fulfilled, (state, action) => {
      state.searchResults = action.payload;
    });
  },
});

export const selectSearchResults = (state: RootState) => state.clients.searchResults;
export default clientsSlice.reducer;
