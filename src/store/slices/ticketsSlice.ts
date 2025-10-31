import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ticketsDB, syncQueueDB } from '../../db/database';
import type { Ticket, CreateTicketInput } from '../../types';
import type { RootState } from '../index';

interface TicketsState {
  items: Ticket[];
  activeTickets: Ticket[];
  selectedTicket: Ticket | null;
  loading: boolean;
  error: string | null;
}

const initialState: TicketsState = {
  items: [],
  activeTickets: [],
  selectedTicket: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchActiveTickets = createAsyncThunk(
  'tickets/fetchActive',
  async (salonId: string) => {
    return await ticketsDB.getActive(salonId);
  }
);

export const fetchTicketsByStatus = createAsyncThunk(
  'tickets/fetchByStatus',
  async ({ salonId, status }: { salonId: string; status: string }) => {
    return await ticketsDB.getByStatus(salonId, status);
  }
);

export const createTicket = createAsyncThunk(
  'tickets/create',
  async ({ input, userId, salonId }: { input: CreateTicketInput; userId: string; salonId: string }) => {
    const ticket = await ticketsDB.create(input, userId, salonId);
    
    await syncQueueDB.add({
      type: 'create',
      entity: 'ticket',
      entityId: ticket.id,
      action: 'CREATE',
      payload: ticket,
      priority: 2,
      maxAttempts: 5,
    });
    
    return ticket;
  }
);

export const updateTicket = createAsyncThunk(
  'tickets/update',
  async ({ id, updates, userId }: { id: string; updates: Partial<Ticket>; userId: string }) => {
    const ticket = await ticketsDB.update(id, updates, userId);
    
    if (ticket) {
      await syncQueueDB.add({
        type: 'update',
        entity: 'ticket',
        entityId: id,
        action: 'UPDATE',
        payload: ticket,
        priority: 2,
        maxAttempts: 5,
      });
    }
    
    return ticket;
  }
);

export const completeTicket = createAsyncThunk(
  'tickets/complete',
  async ({ id, userId }: { id: string; userId: string }) => {
    const ticket = await ticketsDB.complete(id, userId);
    
    if (ticket) {
      await syncQueueDB.add({
        type: 'update',
        entity: 'ticket',
        entityId: id,
        action: 'UPDATE',
        payload: ticket,
        priority: 2,
        maxAttempts: 5,
      });
    }
    
    return ticket;
  }
);

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setTickets: (state, action: PayloadAction<Ticket[]>) => {
      state.items = action.payload;
    },
    setSelectedTicket: (state, action: PayloadAction<Ticket | null>) => {
      state.selectedTicket = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch active
      .addCase(fetchActiveTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.activeTickets = action.payload;
      })
      .addCase(fetchActiveTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tickets';
      })
      // Fetch by status
      .addCase(fetchTicketsByStatus.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      // Create
      .addCase(createTicket.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.activeTickets.push(action.payload);
      })
      // Update
      .addCase(updateTicket.fulfilled, (state, action) => {
        if (action.payload) {
          const updateTicketInArray = (arr: Ticket[]) => {
            const index = arr.findIndex(t => t.id === action.payload!.id);
            if (index !== -1) {
              arr[index] = action.payload!;
            }
          };
          updateTicketInArray(state.items);
          updateTicketInArray(state.activeTickets);
        }
      })
      // Complete
      .addCase(completeTicket.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.items.findIndex(t => t.id === action.payload!.id);
          if (index !== -1) {
            state.items[index] = action.payload;
          }
          // Remove from active tickets
          state.activeTickets = state.activeTickets.filter(t => t.id !== action.payload!.id);
        }
      });
  },
});

export const { setTickets, setSelectedTicket, clearError } = ticketsSlice.actions;

// Selectors
export const selectAllTickets = (state: RootState) => state.tickets.items;
export const selectActiveTickets = (state: RootState) => state.tickets.activeTickets;
export const selectSelectedTicket = (state: RootState) => state.tickets.selectedTicket;
export const selectTicketsLoading = (state: RootState) => state.tickets.loading;
export const selectTicketsError = (state: RootState) => state.tickets.error;

export default ticketsSlice.reducer;
