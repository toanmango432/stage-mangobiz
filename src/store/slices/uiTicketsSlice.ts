import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ticketsDB, syncQueueDB } from '../../db/database';
import type { RootState } from '../index';
import { v4 as uuidv4 } from 'uuid';
import { mockWaitlistTickets, mockServiceTickets } from '../../data/mockData';

// UI-specific ticket interfaces (matching existing TicketContext)
export interface UITicket {
  id: string;
  number: number;
  clientName: string;
  clientType: string;
  service: string;
  time: string;
  duration: string;
  status: 'waiting' | 'in-service' | 'completed';
  assignedTo?: {
    id: string;
    name: string;
    color: string;
  };
  // Multi-staff support
  assignedStaff?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  notes?: string;
  priority?: 'normal' | 'high';
  technician?: string;
  techColor?: string;
  techId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastVisitDate?: Date | null; // null for first-time clients
}

export interface PendingTicket {
  id: string;
  number: number;
  clientName: string;
  clientType: string;
  service: string;
  additionalServices: number;
  subtotal: number;
  tax: number;
  tip: number;
  paymentType: 'card' | 'cash' | 'venmo';
  time: string;
  technician?: string;
  techColor?: string;
  techId?: string;
}

export interface CompletionDetails {
  amount?: number;
  tip?: number;
  paymentMethod?: string;
  notes?: string;
}

interface UITicketsState {
  waitlist: UITicket[];
  serviceTickets: UITicket[];
  completedTickets: UITicket[];
  pendingTickets: PendingTicket[];
  loading: boolean;
  error: string | null;
  lastTicketNumber: number;
}

// Debug: Check if mock data has lastVisitDate
console.log('🔍 Mock Service Tickets Sample:', mockServiceTickets[0]);
console.log('🔍 Has lastVisitDate?', 'lastVisitDate' in mockServiceTickets[0], mockServiceTickets[0].lastVisitDate);

// Map mock data to ensure all fields are preserved
const mappedServiceTickets: UITicket[] = mockServiceTickets.map((ticket: any) => ({
  ...ticket,
  lastVisitDate: ticket.lastVisitDate || null,
}));

console.log('🔍 Mapped Service Tickets Sample:', mappedServiceTickets[0]);
console.log('🔍 Mapped has lastVisitDate?', 'lastVisitDate' in mappedServiceTickets[0], mappedServiceTickets[0].lastVisitDate);

const initialState: UITicketsState = {
  waitlist: mockWaitlistTickets as UITicket[], // Initialize with mock data for development
  serviceTickets: mappedServiceTickets, // Use explicitly mapped data
  completedTickets: [],
  pendingTickets: [],
  loading: false,
  error: null,
  lastTicketNumber: 105, // Set to match highest mock ticket number
};

// Async Thunks

// Load all tickets from IndexedDB
export const loadTickets = createAsyncThunk(
  'uiTickets/loadAll',
  async (salonId: string) => {
    const allTickets = await ticketsDB.getAll(salonId);
    
    const waitlist = allTickets.filter((t: any) => t.status === 'waiting');
    const serviceTickets = allTickets.filter((t: any) => t.status === 'in-service');
    const completedTickets = allTickets.filter((t: any) => t.status === 'completed');
    
    // Get last ticket number
    const lastTicketNumber = allTickets.length > 0
      ? Math.max(...allTickets.map((t: any) => parseInt(t.id.split('-')[1]) || 0))
      : 0;

    return {
      waitlist: waitlist.map(convertToUITicket),
      serviceTickets: serviceTickets.map(convertToUITicket),
      completedTickets: completedTickets.map(convertToUITicket),
      lastTicketNumber,
    };
  }
);

// Create new ticket
export const createTicket = createAsyncThunk(
  'uiTickets/create',
  async (ticketData: Omit<UITicket, 'id' | 'number' | 'status' | 'createdAt' | 'updatedAt'>, { getState }) => {
    const state = getState() as RootState;
    const ticketNumber = state.uiTickets.lastTicketNumber + 1;
    
    const newTicket: UITicket = {
      ...ticketData,
      id: uuidv4(),
      number: ticketNumber,
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to IndexedDB
    await ticketsDB.create({
      id: newTicket.id,
      salonId: 'salon-001', // TODO: Get from auth state
      clientId: null,
      status: 'waiting',
      services: [{ name: newTicket.service, price: 0, duration: parseInt(newTicket.duration) || 30 }],
      products: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      tip: 0,
      total: 0,
      syncStatus: 'local',
      createdAt: newTicket.createdAt,
      updatedAt: newTicket.updatedAt,
    } as any, 'current-user', 'current-user'); // TODO: Get from auth

    // Queue for sync
    await syncQueueDB.add({
      type: 'create',
      entity: 'ticket',
      entityId: newTicket.id,
      action: 'CREATE',
      payload: newTicket,
      priority: 2,
      maxAttempts: 5,
    });

    return newTicket;
  }
);

// Assign ticket to staff
export const assignTicket = createAsyncThunk(
  'uiTickets/assign',
  async ({ ticketId, staffId, staffName, staffColor }: {
    ticketId: string;
    staffId: string;
    staffName: string;
    staffColor: string;
  }, { getState }) => {
    const state = getState() as RootState;
    
    // Get the ticket to find service info
    const ticket = state.uiTickets.waitlist.find(t => t.id === ticketId);
    
    const updates = {
      assignedTo: { id: staffId, name: staffName, color: staffColor },
      technician: staffName,
      techId: staffId,
      techColor: staffColor,
      status: 'in-service' as const,
      updatedAt: new Date(),
    };

    // Update in IndexedDB
    await ticketsDB.update(ticketId, { status: 'in-service', updatedAt: new Date() } as any, 'current-user');

    // Queue for sync
    await syncQueueDB.add({
      type: 'update',
      entity: 'ticket',
      entityId: ticketId,
      action: 'UPDATE',
      payload: updates,
      priority: 2,
      maxAttempts: 5,
    });

    return { 
      ticketId, 
      updates,
      staffId,
      ticketInfo: ticket ? {
        clientName: ticket.clientName,
        serviceName: ticket.service,
      } : null
    };
  }
);

// Complete ticket (moves to pending for checkout)
export const completeTicket = createAsyncThunk(
  'uiTickets/complete',
  async ({ ticketId, completionDetails }: {
    ticketId: string;
    completionDetails: CompletionDetails;
  }, { getState }) => {
    const state = getState() as RootState;
    
    // Get the ticket from service
    const ticket = state.uiTickets.serviceTickets.find(t => t.id === ticketId);
    
    const updates = {
      status: 'completed' as const,
      updatedAt: new Date(),
      completedAt: new Date(),
    };

    // Update in IndexedDB
    await ticketsDB.update(ticketId, updates, 'current-user');

    // Queue for sync
    await syncQueueDB.add({
      type: 'update',
      entity: 'ticket',
      entityId: ticketId,
      action: 'UPDATE',
      payload: { ...updates, completionDetails },
      priority: 2,
      maxAttempts: 5,
    });

    // Create pending ticket data
    const pendingTicket: PendingTicket = {
      id: ticket?.id || ticketId,
      number: ticket?.number || 0,
      clientName: ticket?.clientName || '',
      clientType: ticket?.clientType || 'Regular',
      service: ticket?.service || '',
      additionalServices: 0,
      subtotal: completionDetails.amount || 0,
      tax: 0,
      tip: completionDetails.tip || 0,
      paymentType: 'card',
      time: ticket?.time || '',
      technician: ticket?.technician,
      techColor: ticket?.techColor,
      techId: ticket?.techId,
    };

    return { 
      ticketId, 
      updates,
      pendingTicket,
      staffId: ticket?.techId
    };
  }
);

// Delete ticket
export const deleteTicket = createAsyncThunk(
  'uiTickets/delete',
  async ({ ticketId, reason }: { ticketId: string; reason: string }) => {
    // Soft delete in IndexedDB
    await ticketsDB.delete(ticketId);

    // Queue for sync
    await syncQueueDB.add({
      type: 'delete',
      entity: 'ticket',
      entityId: ticketId,
      action: 'DELETE',
      payload: { reason },
      priority: 2,
      maxAttempts: 5,
    });

    return ticketId;
  }
);

// Helper function to convert DB ticket to UI ticket
function convertToUITicket(dbTicket: any): UITicket {
  return {
    id: dbTicket.id,
    number: parseInt(dbTicket.id.split('-')[1]) || 0,
    clientName: dbTicket.clientId || 'Walk-in',
    clientType: dbTicket.clientId ? 'appointment' : 'walk-in',
    service: dbTicket.services[0]?.name || 'Service',
    time: new Date(dbTicket.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    duration: `${dbTicket.services[0]?.duration || 30}min`,
    status: dbTicket.status,
    notes: dbTicket.notes,
    priority: 'normal',
    createdAt: dbTicket.createdAt,
    updatedAt: dbTicket.updatedAt,
    lastVisitDate: dbTicket.lastVisitDate || null,
  };
}

// Slice
const uiTicketsSlice = createSlice({
  name: 'uiTickets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Real-time update from Socket.io
    ticketUpdated: (state, action: PayloadAction<UITicket>) => {
      const ticket = action.payload;
      
      // Remove from all lists
      state.waitlist = state.waitlist.filter(t => t.id !== ticket.id);
      state.serviceTickets = state.serviceTickets.filter(t => t.id !== ticket.id);
      state.completedTickets = state.completedTickets.filter(t => t.id !== ticket.id);
      
      // Add to appropriate list
      if (ticket.status === 'waiting') {
        state.waitlist.push(ticket);
      } else if (ticket.status === 'in-service') {
        state.serviceTickets.push(ticket);
      } else if (ticket.status === 'completed') {
        state.completedTickets.push(ticket);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Load tickets
      .addCase(loadTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTickets.fulfilled, (state, action) => {
        state.loading = false;
        // Only update if we got data from DB, otherwise keep mock data
        if (action.payload.waitlist.length > 0 || action.payload.serviceTickets.length > 0) {
          state.waitlist = action.payload.waitlist;
          state.serviceTickets = action.payload.serviceTickets;
          state.completedTickets = action.payload.completedTickets;
          state.lastTicketNumber = action.payload.lastTicketNumber;
        }
        // If DB is empty, keep the mock data that was initialized
      })
      .addCase(loadTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load tickets';
      })
      // Create ticket
      .addCase(createTicket.fulfilled, (state, action) => {
        state.waitlist.push(action.payload);
        state.lastTicketNumber = action.payload.number;
      })
      // Assign ticket
      .addCase(assignTicket.fulfilled, (state, action) => {
        const { ticketId, updates } = action.payload;
        
        // Move from waitlist to service
        const ticketIndex = state.waitlist.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
          const ticket = { ...state.waitlist[ticketIndex], ...updates };
          state.waitlist.splice(ticketIndex, 1);
          state.serviceTickets.push(ticket);
        }
      })
      // Complete ticket - move to pending for checkout
      .addCase(completeTicket.fulfilled, (state, action) => {
        const { ticketId, pendingTicket } = action.payload;
        
        // Remove from service tickets
        const ticketIndex = state.serviceTickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
          state.serviceTickets.splice(ticketIndex, 1);
        }
        
        // Add to pending tickets for checkout
        if (pendingTicket) {
          state.pendingTickets.push(pendingTicket);
        }
      })
      // Delete ticket
      .addCase(deleteTicket.fulfilled, (state, action) => {
        const ticketId = action.payload;
        state.waitlist = state.waitlist.filter(t => t.id !== ticketId);
        state.serviceTickets = state.serviceTickets.filter(t => t.id !== ticketId);
        state.completedTickets = state.completedTickets.filter(t => t.id !== ticketId);
      });
  },
});

export const { clearError, ticketUpdated } = uiTicketsSlice.actions;

// Selectors
export const selectWaitlist = (state: RootState) => state.uiTickets.waitlist;
export const selectServiceTickets = (state: RootState) => state.uiTickets.serviceTickets;
export const selectCompletedTickets = (state: RootState) => state.uiTickets.completedTickets;
export const selectPendingTickets = (state: RootState) => state.uiTickets.pendingTickets;
export const selectTicketsLoading = (state: RootState) => state.uiTickets.loading;
export const selectTicketsError = (state: RootState) => state.uiTickets.error;

export default uiTicketsSlice.reducer;
