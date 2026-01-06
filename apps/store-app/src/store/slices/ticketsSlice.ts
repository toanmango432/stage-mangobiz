import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ticketsDB, syncQueueDB } from '../../db/database';
import { dataService } from '../../services/dataService';
import { auditLogger } from '../../services/audit/auditLogger';
// toTicket/toTickets not needed - dataService returns converted types
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
    // dataService already returns Ticket[] (converted)
    return await dataService.tickets.getByDate(date);
  }
);

/**
 * Fetch open/active tickets from Supabase
 * Note: storeId is obtained internally from Redux auth state
 */
export const fetchOpenTicketsFromSupabase = createAsyncThunk(
  'tickets/fetchOpenFromSupabase',
  async () => {
    // dataService already returns Ticket[] (converted)
    return await dataService.tickets.getOpenTickets();
  }
);

/**
 * Fetch single ticket by ID from Supabase
 */
export const fetchTicketByIdFromSupabase = createAsyncThunk(
  'tickets/fetchByIdFromSupabase',
  async (ticketId: string) => {
    // dataService already returns Ticket (converted)
    const ticket = await dataService.tickets.getById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    return ticket;
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
      // Validate foreign keys before creating
      const { validateTicketInput } = await import('../../utils/validation');
      const validation = await validateTicketInput({
        clientId: input.clientId,
        appointmentId: input.appointmentId,
        services: input.services,
      });

      if (!validation.valid) {
        return rejectWithValue(validation.error || 'Validation failed');
      }

      // dataService.tickets.create returns Ticket directly
      return await dataService.tickets.create(input);
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
      // dataService.tickets.update returns Ticket directly
      const updated = await dataService.tickets.update(id, updates);
      return updated;
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
      // dataService.tickets.updateStatus returns Ticket directly
      return await dataService.tickets.updateStatus(id, status);
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
      // dataService.tickets.complete returns Ticket directly
      return await dataService.tickets.complete(id, payments);
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

      // Audit log ticket deletion (high severity)
      auditLogger.log({
        action: 'delete',
        entityType: 'ticket',
        entityId: id,
        description: `Ticket ${id} deleted`,
        severity: 'high',
        success: true,
      }).catch(console.warn);

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
      // dataService already returns Ticket directly
      const ticket = await dataService.tickets.getById(ticketId);
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

      // dataService.tickets.update returns Ticket directly
      const updatedTicket = await dataService.tickets.update(ticketId, { services: updatedServices });

      // Audit log service status change (only for significant transitions)
      if (newStatus === 'in_progress' && previousStatus === 'not_started') {
        auditLogger.log({
          action: 'update',
          entityType: 'ticket',
          entityId: ticketId,
          description: `Service "${service.serviceName}" started for ticket #${ticket.number}`,
          severity: 'low',
          success: true,
          metadata: { serviceId, newStatus, staffName: service.staffName },
        }).catch(console.warn);
      } else if (newStatus === 'completed') {
        auditLogger.log({
          action: 'update',
          entityType: 'ticket',
          entityId: ticketId,
          description: `Service "${service.serviceName}" completed for ticket #${ticket.number}`,
          severity: 'low',
          success: true,
          metadata: { serviceId, newStatus, actualDuration: serviceUpdates.actualDuration },
        }).catch(console.warn);
      }

      return updatedTicket;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update service status');
    }
  }
);

// ==================== LEGACY ASYNC THUNKS (IndexedDB) ====================

export const fetchActiveTickets = createAsyncThunk(
  'tickets/fetchActive',
  async (storeId: string) => {
    return await ticketsDB.getActive(storeId);
  }
);

export const fetchTicketsByStatus = createAsyncThunk(
  'tickets/fetchByStatus',
  async ({ storeId, status }: { storeId: string; status: string }) => {
    return await ticketsDB.getByStatus(storeId, status);
  }
);

/**
 * @deprecated Use fetchTicketsByDateFromSupabase instead. This only reads from IndexedDB.
 */
export const fetchTickets = createAsyncThunk(
  'tickets/fetchAll',
  async (storeId: string) => {
    console.warn('⚠️ DEPRECATED: fetchTickets is deprecated. Use fetchTicketsByDateFromSupabase instead.');
    return await ticketsDB.getAll(storeId);
  }
);

/**
 * @deprecated Use createTicketInSupabase instead. This only saves to IndexedDB and queues for sync.
 * For online-only mode, use createTicketInSupabase for immediate Supabase sync.
 */
export const createTicket = createAsyncThunk(
  'tickets/create',
  async ({ input, userId, storeId }: { input: CreateTicketInput; userId: string; storeId: string }) => {
    console.warn('⚠️ DEPRECATED: createTicket is deprecated. Use createTicketInSupabase for online-only mode.');
    const ticket = await ticketsDB.create(input, userId, storeId);
    
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

/**
 * @deprecated Use updateTicketInSupabase instead. This only saves to IndexedDB and queues for sync.
 * For online-only mode, use updateTicketInSupabase for immediate Supabase sync.
 */
export const updateTicket = createAsyncThunk(
  'tickets/update',
  async ({ id, updates, userId }: { id: string; updates: Partial<Ticket>; userId: string }) => {
    console.warn('⚠️ DEPRECATED: updateTicket is deprecated. Use updateTicketInSupabase for online-only mode.');
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
        if (!action.payload) return;
        const updatedTicket = action.payload;
        const updateTicketInArray = (arr: Ticket[]) => {
          const index = arr.findIndex(t => t.id === updatedTicket.id);
          if (index !== -1) {
            arr[index] = updatedTicket;
          }
        };
        updateTicketInArray(state.items);
        updateTicketInArray(state.activeTickets);
        if (state.selectedTicket?.id === updatedTicket.id) {
          state.selectedTicket = updatedTicket;
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
        if (!action.payload) return;
        const updatedTicket = action.payload;
        const updateTicketInArray = (arr: Ticket[]) => {
          const index = arr.findIndex(t => t.id === updatedTicket.id);
          if (index !== -1) {
            arr[index] = updatedTicket;
          }
        };
        updateTicketInArray(state.items);
        updateTicketInArray(state.activeTickets);
        if (state.selectedTicket?.id === updatedTicket.id) {
          state.selectedTicket = updatedTicket;
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
        if (!action.payload) return;
        const completedTicket = action.payload;
        const index = state.items.findIndex(t => t.id === completedTicket.id);
        if (index !== -1) {
          state.items[index] = completedTicket;
        }
        // Remove from active tickets since it's completed
        state.activeTickets = state.activeTickets.filter(t => t.id !== completedTicket.id);
        if (state.selectedTicket?.id === completedTicket.id) {
          state.selectedTicket = completedTicket;
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
        if (!action.payload) return;
        const updatedTicket = action.payload;
        const updateTicketInArray = (arr: Ticket[]) => {
          const index = arr.findIndex(t => t.id === updatedTicket.id);
          if (index !== -1) {
            arr[index] = updatedTicket;
          }
        };
        updateTicketInArray(state.items);
        updateTicketInArray(state.activeTickets);
        if (state.selectedTicket?.id === updatedTicket.id) {
          state.selectedTicket = updatedTicket;
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
