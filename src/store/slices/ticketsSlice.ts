import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ticketsDB, syncQueueDB } from '../../db/database';
import { dataService } from '../../services/dataService';
import { toTicket, toTickets } from '../../services/supabase';
import type { Ticket, CreateTicketInput, TicketService } from '../../types';
import type { ServiceStatus, ServiceStatusChange } from '../../types/common';
import type { RootState } from '../index';
import { SYNC_PRIORITIES } from '../../constants/checkoutConfig';

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

// ==================== SUPABASE THUNKS (Phase 6) ====================

/**
 * Fetch tickets by date from Supabase via dataService
 * Note: storeId is obtained internally from Redux auth state
 */
export const fetchTicketsByDateFromSupabase = createAsyncThunk(
  'tickets/fetchByDateFromSupabase',
  async (date: Date) => {
    const rows = await dataService.tickets.getByDate(date);
    return toTickets(rows);
  }
);

/**
 * Fetch open/active tickets from Supabase
 * Note: storeId is obtained internally from Redux auth state
 */
export const fetchOpenTicketsFromSupabase = createAsyncThunk(
  'tickets/fetchOpenFromSupabase',
  async () => {
    const rows = await dataService.tickets.getOpenTickets();
    return toTickets(rows);
  }
);

/**
 * Fetch single ticket by ID from Supabase
 */
export const fetchTicketByIdFromSupabase = createAsyncThunk(
  'tickets/fetchByIdFromSupabase',
  async (ticketId: string) => {
    const row = await dataService.tickets.getById(ticketId);
    if (!row) throw new Error('Ticket not found');
    return toTicket(row);
  }
);

/**
 * Create a new ticket in Supabase via dataService
 * Note: storeId is obtained internally from Redux auth state
 */
export const createTicketInSupabase = createAsyncThunk(
  'tickets/createInSupabase',
  async (input: CreateTicketInput, { rejectWithValue }) => {
    try {
      // Import the adapter function for conversion
      const { toTicketInsert, toTicket: convertToTicket } = await import('../../services/supabase');

      // Build the ticket data
      const ticketData = {
        salonId: '', // Will be filled by dataService
        appointmentId: input.appointmentId,
        clientId: input.clientId,
        clientName: input.clientName,
        clientPhone: input.clientPhone,
        services: input.services.map(s => ({
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          name: s.serviceName,
          staffId: s.staffId,
          staffName: s.staffName,
          price: s.price,
          duration: s.duration,
          commission: s.commission,
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status || 'not_started' as ServiceStatus,
          statusHistory: [] as ServiceStatusChange[],
          totalPausedDuration: 0,
        })),
        products: input.products || [],
        status: 'pending' as const,
        subtotal: input.services.reduce((sum, s) => sum + s.price, 0),
        discount: 0,
        tax: 0,
        tip: 0,
        total: input.services.reduce((sum, s) => sum + s.price, 0),
        payments: [],
        createdBy: 'system',
        lastModifiedBy: 'system',
        syncStatus: 'synced' as const,
        source: input.source,
      };

      const insertData = toTicketInsert(ticketData as any);
      const row = await dataService.tickets.create(insertData);
      return convertToTicket(row);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create ticket');
    }
  }
);

/**
 * Update a ticket in Supabase via dataService
 */
export const updateTicketInSupabase = createAsyncThunk(
  'tickets/updateInSupabase',
  async ({ id, updates }: { id: string; updates: Partial<Ticket> }, { rejectWithValue }) => {
    try {
      const { toTicketUpdate, toTicket: convertToTicket } = await import('../../services/supabase');
      const updateData = toTicketUpdate(updates);
      const row = await dataService.tickets.update(id, updateData);
      return convertToTicket(row);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update ticket');
    }
  }
);

/**
 * Update ticket status in Supabase
 */
export const updateTicketStatusInSupabase = createAsyncThunk(
  'tickets/updateStatusInSupabase',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const { toTicket: convertToTicket } = await import('../../services/supabase');
      const row = await dataService.tickets.updateStatus(id, status);
      return convertToTicket(row);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update ticket status');
    }
  }
);

/**
 * Complete a ticket with payments in Supabase
 */
export const completeTicketInSupabase = createAsyncThunk(
  'tickets/completeInSupabase',
  async ({ id, payments }: { id: string; payments: unknown[] }, { rejectWithValue }) => {
    try {
      const { toTicket: convertToTicket } = await import('../../services/supabase');
      const row = await dataService.tickets.complete(id, payments);
      return convertToTicket(row);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to complete ticket');
    }
  }
);

/**
 * Delete a ticket from Supabase
 */
export const deleteTicketInSupabase = createAsyncThunk(
  'tickets/deleteInSupabase',
  async (id: string, { rejectWithValue }) => {
    try {
      await dataService.tickets.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete ticket');
    }
  }
);

/**
 * Update service status in Supabase via dataService
 * Handles: start, pause, resume, complete transitions
 */
export const updateServiceStatusInSupabase = createAsyncThunk(
  'tickets/updateServiceStatusInSupabase',
  async ({
    ticketId,
    serviceId,
    newStatus,
    userId,
    deviceId,
    reason,
  }: {
    ticketId: string;
    serviceId: string;
    newStatus: ServiceStatus;
    userId: string;
    deviceId: string;
    reason?: string;
  }, { rejectWithValue }) => {
    try {
      const { toTicket: convertToTicket, toTicketUpdate } = await import('../../services/supabase');

      // Get current ticket
      const row = await dataService.tickets.getById(ticketId);
      if (!row) {
        return rejectWithValue('Ticket not found');
      }

      const ticket = convertToTicket(row);

      // Find the service
      const serviceIndex = ticket.services.findIndex(s => s.serviceId === serviceId);
      if (serviceIndex === -1) {
        return rejectWithValue('Service not found in ticket');
      }

      const service = ticket.services[serviceIndex];
      const now = new Date().toISOString();

      // Create status change record
      const statusChange: ServiceStatusChange = {
        from: service.status || 'not_started',
        to: newStatus,
        changedAt: now,
        changedBy: userId,
        changedByDevice: deviceId,
        reason,
      };

      // Build updates based on status transition
      const serviceUpdates: Partial<TicketService> = {
        status: newStatus,
        statusHistory: [...(service.statusHistory || []), statusChange],
      };

      // Handle specific status transitions
      const previousStatus = service.status || 'not_started';

      if (newStatus === 'in_progress' && previousStatus === 'not_started') {
        // Starting service
        serviceUpdates.actualStartTime = now;
      } else if (newStatus === 'paused') {
        // Pausing service
        serviceUpdates.pausedAt = now;
      } else if (newStatus === 'in_progress' && previousStatus === 'paused') {
        // Resuming from pause - calculate paused duration
        if (service.pausedAt) {
          const pausedDuration = new Date(now).getTime() - new Date(service.pausedAt).getTime();
          serviceUpdates.totalPausedDuration = (service.totalPausedDuration || 0) + pausedDuration;
        }
        serviceUpdates.pausedAt = undefined;
      } else if (newStatus === 'completed') {
        // Completing service
        serviceUpdates.endTime = now;
        if (service.actualStartTime) {
          const totalTime = new Date(now).getTime() - new Date(service.actualStartTime).getTime();
          const actualMinutes = Math.round((totalTime - (service.totalPausedDuration || 0)) / 60000);
          serviceUpdates.actualDuration = actualMinutes;
        }
        // Clear pause state if was paused
        if (service.pausedAt) {
          const pausedDuration = new Date(now).getTime() - new Date(service.pausedAt).getTime();
          serviceUpdates.totalPausedDuration = (service.totalPausedDuration || 0) + pausedDuration;
          serviceUpdates.pausedAt = undefined;
        }
      }

      // Build updated services array
      const updatedServices = [...ticket.services];
      updatedServices[serviceIndex] = { ...service, ...serviceUpdates };

      // Update ticket in Supabase
      const updateData = toTicketUpdate({ services: updatedServices });
      const updatedRow = await dataService.tickets.update(ticketId, updateData);

      return convertToTicket(updatedRow);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update service status');
    }
  }
);

// ==================== LEGACY ASYNC THUNKS (IndexedDB) ====================

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

export const fetchTickets = createAsyncThunk(
  'tickets/fetchAll',
  async (salonId: string) => {
    return await ticketsDB.getAll(salonId);
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

/**
 * Update the status of a service within a ticket.
 * Handles all status transitions: start, pause, resume, complete.
 * Per PRD F-003: Service Status Tracking
 */
export const updateServiceStatus = createAsyncThunk(
  'tickets/updateServiceStatus',
  async ({
    ticketId,
    serviceId,
    newStatus,
    userId,
    deviceId,
    reason,
  }: {
    ticketId: string;
    serviceId: string;
    newStatus: ServiceStatus;
    userId: string;
    deviceId: string;
    reason?: string;
  }, { rejectWithValue }) => {
    try {
      // Get current ticket
      const ticket = await ticketsDB.getById(ticketId);
      if (!ticket) {
        return rejectWithValue('Ticket not found');
      }

      // Find the service
      const serviceIndex = ticket.services.findIndex(s => s.serviceId === serviceId);
      if (serviceIndex === -1) {
        return rejectWithValue('Service not found in ticket');
      }

      const service = ticket.services[serviceIndex];
      const now = new Date().toISOString();

      // Create status change record
      const statusChange: ServiceStatusChange = {
        from: service.status || 'not_started',
        to: newStatus,
        changedAt: now,
        changedBy: userId,
        changedByDevice: deviceId,
        reason,
      };

      // Build updates based on status transition
      const serviceUpdates: Partial<TicketService> = {
        status: newStatus,
        statusHistory: [...(service.statusHistory || []), statusChange],
      };

      // Handle specific status transitions
      const previousStatus = service.status || 'not_started';

      if (newStatus === 'in_progress' && previousStatus === 'not_started') {
        // Starting service
        serviceUpdates.actualStartTime = now;
      } else if (newStatus === 'paused') {
        // Pausing service
        serviceUpdates.pausedAt = now;
      } else if (newStatus === 'in_progress' && previousStatus === 'paused') {
        // Resuming from pause - calculate paused duration
        if (service.pausedAt) {
          const pausedDuration = new Date(now).getTime() - new Date(service.pausedAt).getTime();
          serviceUpdates.totalPausedDuration = (service.totalPausedDuration || 0) + pausedDuration;
        }
        serviceUpdates.pausedAt = undefined;
      } else if (newStatus === 'completed') {
        // Completing service
        serviceUpdates.endTime = now;
        if (service.actualStartTime) {
          const totalTime = new Date(now).getTime() - new Date(service.actualStartTime).getTime();
          const actualMinutes = Math.round((totalTime - (service.totalPausedDuration || 0)) / 60000);
          serviceUpdates.actualDuration = actualMinutes;
        }
        // Clear pause state if was paused
        if (service.pausedAt) {
          const pausedDuration = new Date(now).getTime() - new Date(service.pausedAt).getTime();
          serviceUpdates.totalPausedDuration = (service.totalPausedDuration || 0) + pausedDuration;
          serviceUpdates.pausedAt = undefined;
        }
      }

      // Build updated services array
      const updatedServices = [...ticket.services];
      updatedServices[serviceIndex] = { ...service, ...serviceUpdates };

      // Update ticket in database
      const updatedTicket = await ticketsDB.update(ticketId, { services: updatedServices }, userId);

      if (updatedTicket) {
        // Queue for sync with HIGH priority
        await syncQueueDB.add({
          type: 'update',
          entity: 'ticket',
          entityId: ticketId,
          action: 'UPDATE',
          payload: updatedTicket,
          priority: SYNC_PRIORITIES.HIGH,
          maxAttempts: 5,
        });
      }

      return updatedTicket;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update service status');
    }
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
      // Fetch all
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tickets';
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
      })
      // Update service status
      .addCase(updateServiceStatus.fulfilled, (state, action) => {
        if (action.payload) {
          const updateTicketInArray = (arr: Ticket[]) => {
            const index = arr.findIndex(t => t.id === action.payload!.id);
            if (index !== -1) {
              arr[index] = action.payload!;
            }
          };
          updateTicketInArray(state.items);
          updateTicketInArray(state.activeTickets);
          // Update selected ticket if it's the same
          if (state.selectedTicket?.id === action.payload.id) {
            state.selectedTicket = action.payload;
          }
        }
      })
      .addCase(updateServiceStatus.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to update service status';
      });

    // ==================== SUPABASE THUNKS REDUCERS (Phase 6) ====================

    // Fetch tickets by date from Supabase
    builder
      .addCase(fetchTicketsByDateFromSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketsByDateFromSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTicketsByDateFromSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tickets from Supabase';
      });

    // Fetch open tickets from Supabase
    builder
      .addCase(fetchOpenTicketsFromSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOpenTicketsFromSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.activeTickets = action.payload;
      })
      .addCase(fetchOpenTicketsFromSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch open tickets from Supabase';
      });

    // Fetch ticket by ID from Supabase
    builder
      .addCase(fetchTicketByIdFromSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketByIdFromSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTicket = action.payload;
      })
      .addCase(fetchTicketByIdFromSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch ticket from Supabase';
      });

    // Create ticket in Supabase
    builder
      .addCase(createTicketInSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicketInSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
        state.activeTickets.push(action.payload);
      })
      .addCase(createTicketInSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create ticket';
      });

    // Update ticket in Supabase
    builder
      .addCase(updateTicketInSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicketInSupabase.fulfilled, (state, action) => {
        state.loading = false;
        const updateTicketInArray = (arr: Ticket[]) => {
          const index = arr.findIndex(t => t.id === action.payload.id);
          if (index !== -1) {
            arr[index] = action.payload;
          }
        };
        updateTicketInArray(state.items);
        updateTicketInArray(state.activeTickets);
        if (state.selectedTicket?.id === action.payload.id) {
          state.selectedTicket = action.payload;
        }
      })
      .addCase(updateTicketInSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update ticket';
      });

    // Update ticket status in Supabase
    builder
      .addCase(updateTicketStatusInSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicketStatusInSupabase.fulfilled, (state, action) => {
        state.loading = false;
        const updateTicketInArray = (arr: Ticket[]) => {
          const index = arr.findIndex(t => t.id === action.payload.id);
          if (index !== -1) {
            arr[index] = action.payload;
          }
        };
        updateTicketInArray(state.items);
        updateTicketInArray(state.activeTickets);
        if (state.selectedTicket?.id === action.payload.id) {
          state.selectedTicket = action.payload;
        }
      })
      .addCase(updateTicketStatusInSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update ticket status';
      });

    // Complete ticket in Supabase
    builder
      .addCase(completeTicketInSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeTicketInSupabase.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        // Remove from active tickets since it's completed
        state.activeTickets = state.activeTickets.filter(t => t.id !== action.payload.id);
        if (state.selectedTicket?.id === action.payload.id) {
          state.selectedTicket = action.payload;
        }
      })
      .addCase(completeTicketInSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to complete ticket';
      });

    // Delete ticket from Supabase
    builder
      .addCase(deleteTicketInSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTicketInSupabase.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(t => t.id !== action.payload);
        state.activeTickets = state.activeTickets.filter(t => t.id !== action.payload);
        if (state.selectedTicket?.id === action.payload) {
          state.selectedTicket = null;
        }
      })
      .addCase(deleteTicketInSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to delete ticket';
      });

    // Update service status in Supabase
    builder
      .addCase(updateServiceStatusInSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateServiceStatusInSupabase.fulfilled, (state, action) => {
        state.loading = false;
        const updateTicketInArray = (arr: Ticket[]) => {
          const index = arr.findIndex(t => t.id === action.payload.id);
          if (index !== -1) {
            arr[index] = action.payload;
          }
        };
        updateTicketInArray(state.items);
        updateTicketInArray(state.activeTickets);
        if (state.selectedTicket?.id === action.payload.id) {
          state.selectedTicket = action.payload;
        }
      })
      .addCase(updateServiceStatusInSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update service status';
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
