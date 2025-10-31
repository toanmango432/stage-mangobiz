import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transactionsDB } from '../../db/database';
import type { Transaction } from '../../types';
import type { RootState } from '../index';

interface TransactionsState {
  items: Transaction[];
  loading: boolean;
}

const initialState: TransactionsState = {
  items: [],
  loading: false,
};

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (salonId: string) => {
    return await transactionsDB.getAll(salonId);
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchTransactions.fulfilled, (state, action) => {
      state.items = action.payload;
    });
  },
});

export const selectAllTransactions = (state: RootState) => state.transactions.items;
export default transactionsSlice.reducer;
