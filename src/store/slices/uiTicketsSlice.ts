import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ticketsDB, syncQueueDB } from '../../db/database';
import { dataService } from '../../services/dataService';
import { toTickets, toTicket, toTicketInsert, toTicketUpdate } from '../../services/supabase';
import type { RootState } from '../index';
import { v4 as uuidv4 } from 'uuid';
import { createTransactionFromPending, createTransactionInSupabase } from './transactionsSlice';
import type { PaymentMethod, PaymentDetails, CreateTransactionInput } from '../../types';

// Service status for individual services within a ticket
export type ServiceStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

// UI-specific ticket interfaces (matching existing TicketContext)
export interface UITicket {
  id: string;
  number: number;
  clientName: string;
  clientType: string;
  service: string;
  time: string;
  duration?: string;
  status: 'waiting' | 'in-service' | 'completed';
  // Service-level status for pause/resume tracking
  serviceStatus?: ServiceStatus;
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
  duration?: string;
  notes?: string;
  technician?: string;
  techColor?: string;
  techId?: string;
  // Multi-staff support
  assignedStaff?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  lastVisitDate?: Date | null;
}

export interface CompletionDetails {
  amount?: number;
  tip?: number;
  paymentMethod?: string;
  notes?: string;
}

// Interface for services in checkout module (more detailed than UITicket)
export interface CheckoutTicketService {
  id: string;
  serviceId: string;
  serviceName: string;
  price: number;
  duration: number;
  status: ServiceStatus;
  staffId?: string;
  staffName?: string;
  staffColor?: string;
  startTime?: Date;
  endTime?: Date;
}

// Input for creating/updating checkout tickets
export interface CheckoutTicketInput {
  clientId?: string;
  clientName?: string;
  services: CheckoutTicketService[];
  notes?: string;
  discount?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
  // Status determines which section the ticket goes to:
  // 'waiting' -> Waitlist, 'in-service' -> In Service, 'completed' -> Pending
  status?: 'waiting' | 'in-service' | 'completed';
}

// Extended UITicket with checkout services
export interface UITicketWithServices extends UITicket {
  checkoutServices?: CheckoutTicketService[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
}

interface UITicketsState {
  waitlist: UITicket[];
  serviceTickets: UITicket[];
  inService?: UITicket[];  // Alias for serviceTickets
  services?: UITicket[];  // Another alias for serviceTickets
  completedTickets: UITicket[];
  completed?: UITicket[];  // Alias for completedTickets
  pendingTickets: PendingTicket[];
  loading: boolean;
  error: string | null;
  lastTicketNumber: number;
}

// Start with empty state - tickets load from IndexedDB
const initialState: UITicketsState = {
  waitlist: [],
  serviceTickets: [],
  completedTickets: [],
  pendingTickets: [],
  loading: false,
  error: null,
  lastTicketNumber: 0,
};

// Async Thunks

// Load all tickets from Supabase (with IndexedDB fallback for offline)
// Also merges local-only tickets from IndexedDB that haven't synced yet
export const loadTickets = createAsyncThunk(
  'uiTickets/loadAll',
  async (_salonId: string) => {
    // Helper function to merge local tickets with remote tickets
    // Local tickets (syncStatus === 'local') take precedence and are added if not already in remote
    const mergeTickets = (remoteTickets: any[], localTickets: any[]) => {
      const remoteIds = new Set(remoteTickets.map(t => t.id));
      const localOnlyTickets = localTickets.filter(t =>
        t.syncStatus === 'local' && !remoteIds.has(t.id)
      );
      return [...remoteTickets, ...localOnlyTickets];
    };

    try {
      // Try Supabase first
      const today = new Date();
      const rows = await dataService.tickets.getByDate(today);
      const remoteTickets = toTickets(rows);

      console.log('📋 Loaded tickets from Supabase:', remoteTickets.length);

      // Also load local tickets from IndexedDB to merge unsynced ones
      // Try multiple possible salonIds for local tickets
      const localTicketsDefault = await ticketsDB.getAll('default-salon');
      const localTicketsSalon = await ticketsDB.getAll(_salonId);
      const localTickets = [...localTicketsDefault, ...localTicketsSalon];

      // Filter to only include today's local tickets
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const todayLocalTickets = localTickets.filter(t => {
        const createdAt = new Date(t.createdAt);
        return createdAt >= todayStart && createdAt < todayEnd;
      });

      console.log('📋 Local unsynced tickets found:', todayLocalTickets.filter(t => t.syncStatus === 'local').length);

      // Merge remote and local tickets
      const allTickets = mergeTickets(remoteTickets, todayLocalTickets);

      // Map Supabase status to UI status
      // Supabase uses: 'pending', 'in-service', 'completed', 'paid', 'cancelled'
      const waitlist = allTickets.filter((t: any) => t.status === 'pending' || t.status === 'waiting');
      const serviceTickets = allTickets.filter((t: any) => t.status === 'in-service');
      // 'completed' status tickets are pending payment
      const pendingTickets = allTickets.filter((t: any) => t.status === 'completed');
      // 'paid' status tickets are fully completed
      const completedTickets = allTickets.filter((t: any) => t.status === 'paid');

      // Get last ticket number from all tickets
      const lastTicketNumber = allTickets.length > 0
        ? Math.max(...allTickets.map((t: any) => t.number || 0))
        : 0;

      console.log('📋 Tickets by status (after merge):', {
        waitlist: waitlist.length,
        serviceTickets: serviceTickets.length,
        pendingTickets: pendingTickets.length,
        completedTickets: completedTickets.length,
        lastTicketNumber,
      });

      return {
        waitlist: waitlist.map(convertToUITicket),
        serviceTickets: serviceTickets.map(convertToUITicket),
        pendingTickets: pendingTickets.map(convertToPendingTicket),
        completedTickets: completedTickets.map(convertToUITicket),
        lastTicketNumber,
      };
    } catch (error) {
      console.warn('⚠️ Supabase unavailable, falling back to IndexedDB:', error);
      // Fallback to IndexedDB for offline mode - try multiple salonIds
      const localTicketsDefault = await ticketsDB.getAll('default-salon');
      const localTicketsSalon = await ticketsDB.getAll(_salonId);
      const allTickets = [...localTicketsDefault, ...localTicketsSalon];

      // Deduplicate by id
      const seen = new Set<string>();
      const uniqueTickets = allTickets.filter(t => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });

      console.log('📋 Loaded tickets from IndexedDB:', uniqueTickets.length);

      const waitlistIdb = uniqueTickets.filter((t: any) => t.status === 'waiting' || t.status === 'pending');
      const serviceTicketsIdb = uniqueTickets.filter((t: any) => t.status === 'in-service');
      const pendingTicketsIdb = uniqueTickets.filter((t: any) => t.status === 'completed');
      const completedTicketsIdb = uniqueTickets.filter((t: any) => t.status === 'paid');

      const lastTicketNumberIdb = uniqueTickets.length > 0
        ? Math.max(...uniqueTickets.map((t: any) => t.number || parseInt(t.id.split('-')[1]) || 0))
        : 0;

      return {
        waitlist: waitlistIdb.map(convertToUITicket),
        serviceTickets: serviceTicketsIdb.map(convertToUITicket),
        pendingTickets: pendingTicketsIdb.map(convertToPendingTicket),
        completedTickets: completedTicketsIdb.map(convertToUITicket),
        lastTicketNumber: lastTicketNumberIdb,
      };
    }
  }
);

// Create new ticket via Supabase
export const createTicket = createAsyncThunk(
  'uiTickets/create',
  async (ticketData: Omit<UITicket, 'id' | 'number' | 'status' | 'createdAt' | 'updatedAt'>, { getState }) => {
    const state = getState() as RootState;
    const ticketNumber = state.uiTickets.lastTicketNumber + 1;

    try {
      // Build ticket for Supabase
      const ticketInsert = toTicketInsert({
        salonId: '', // Will be filled by dataService
        clientId: '',
        clientName: ticketData.clientName,
        services: [{
          id: uuidv4(),
          serviceId: uuidv4(),
          serviceName: ticketData.service,
          name: ticketData.service,
          staffId: ticketData.techId || '',
          staffName: ticketData.technician || '',
          price: 0,
          duration: parseInt(ticketData.duration || '30') || 30,
          commission: 0,
          startTime: '',
          status: 'not_started' as const,
          statusHistory: [],
          totalPausedDuration: 0,
        }],
        products: [],
        status: 'pending', // Supabase uses 'pending' for waitlist
        subtotal: 0,
        discount: 0,
        tax: 0,
        tip: 0,
        total: 0,
        payments: [],
        createdBy: 'current-user',
        lastModifiedBy: 'current-user',
        syncStatus: 'synced',
      } as any);

      const row = await dataService.tickets.create(ticketInsert);
      const createdTicket = toTicket(row);

      console.log('✅ Ticket created in Supabase:', createdTicket.id);

      // Convert to UITicket format
      const newTicket: UITicket = {
        ...ticketData,
        id: createdTicket.id,
        number: ticketNumber, // Use local numbering for display
        status: 'waiting', // UI uses 'waiting'
        createdAt: new Date(createdTicket.createdAt || new Date()),
        updatedAt: new Date(createdTicket.updatedAt || new Date()),
      };

      return newTicket;
    } catch (error) {
      console.error('❌ Failed to create ticket in Supabase:', error);
      // Fallback to IndexedDB for offline
      const newTicket: UITicket = {
        ...ticketData,
        id: uuidv4(),
        number: ticketNumber,
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await ticketsDB.create({
        id: newTicket.id,
        salonId: 'salon-001',
        clientId: null,
        status: 'waiting',
        services: [{ name: newTicket.service, price: 0, duration: parseInt(newTicket.duration || '30') || 30 }],
        products: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        tip: 0,
        total: 0,
        syncStatus: 'local',
        createdAt: newTicket.createdAt,
        updatedAt: newTicket.updatedAt,
      } as any, 'current-user', 'current-user');

      // Queue for sync when back online
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
  }
);

// Assign ticket to staff via Supabase
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

    try {
      // Update in Supabase - change status to 'in-service'
      await dataService.tickets.updateStatus(ticketId, 'in-service');
      console.log('✅ Ticket assigned in Supabase:', ticketId);
    } catch (error) {
      console.warn('⚠️ Supabase update failed, using IndexedDB:', error);
      // Fallback to IndexedDB
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
    }

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

// Complete ticket (moves to pending for checkout) via Supabase
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

    try {
      // Update in Supabase - change status to 'completed'
      await dataService.tickets.updateStatus(ticketId, 'completed');
      console.log('✅ Ticket completed in Supabase:', ticketId);
    } catch (error) {
      console.warn('⚠️ Supabase update failed, using IndexedDB:', error);
      // Fallback to IndexedDB
      await ticketsDB.update(ticketId, updates as any, 'current-user');

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
    }

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
      assignedStaff: ticket?.assignedStaff,
      lastVisitDate: ticket?.lastVisitDate,
    };

    return {
      ticketId,
      updates,
      pendingTicket,
      staffId: ticket?.techId
    };
  }
);

// Pause a service ticket (staff temporarily stops working on it) via Supabase
export const pauseTicket = createAsyncThunk(
  'uiTickets/pause',
  async (ticketId: string, { getState }) => {
    const state = getState() as RootState;

    // Get the ticket from service tickets
    const ticket = state.uiTickets.serviceTickets.find(t => t.id === ticketId);

    const updates = {
      serviceStatus: 'paused' as ServiceStatus,
      updatedAt: new Date(),
    };

    try {
      // Update service status in Supabase
      // Get current ticket, update first service to 'paused'
      const row = await dataService.tickets.getById(ticketId);
      if (row) {
        const ticketData = toTicket(row);
        const updatedServices = ticketData.services.map((s, i) =>
          i === 0 ? { ...s, status: 'paused' as const, pausedAt: new Date().toISOString() } : s
        );
        const updateData = toTicketUpdate({ services: updatedServices });
        await dataService.tickets.update(ticketId, updateData);
        console.log('✅ Ticket paused in Supabase:', ticketId);
      }
    } catch (error) {
      console.warn('⚠️ Supabase update failed, using IndexedDB:', error);
      await ticketsDB.update(ticketId, updates as any, 'current-user');

      await syncQueueDB.add({
        type: 'update',
        entity: 'ticket',
        entityId: ticketId,
        action: 'UPDATE',
        payload: updates,
        priority: 2,
        maxAttempts: 5,
      });
    }

    return {
      ticketId,
      updates,
      staffId: ticket?.techId
    };
  }
);

// Resume a paused service ticket via Supabase
export const resumeTicket = createAsyncThunk(
  'uiTickets/resume',
  async (ticketId: string, { getState }) => {
    const state = getState() as RootState;

    // Get the ticket from service tickets
    const ticket = state.uiTickets.serviceTickets.find(t => t.id === ticketId);

    const updates = {
      serviceStatus: 'in_progress' as ServiceStatus,
      updatedAt: new Date(),
    };

    try {
      // Update service status in Supabase
      const row = await dataService.tickets.getById(ticketId);
      if (row) {
        const ticketData = toTicket(row);
        const now = new Date().toISOString();
        const updatedServices = ticketData.services.map((s, i) => {
          if (i === 0 && s.status === 'paused') {
            // Calculate paused duration
            const pausedDuration = s.pausedAt
              ? new Date(now).getTime() - new Date(s.pausedAt).getTime()
              : 0;
            return {
              ...s,
              status: 'in_progress' as const,
              pausedAt: undefined,
              totalPausedDuration: (s.totalPausedDuration || 0) + pausedDuration,
            };
          }
          return s;
        });
        const updateData = toTicketUpdate({ services: updatedServices });
        await dataService.tickets.update(ticketId, updateData);
        console.log('✅ Ticket resumed in Supabase:', ticketId);
      }
    } catch (error) {
      console.warn('⚠️ Supabase update failed, using IndexedDB:', error);
      await ticketsDB.update(ticketId, updates as any, 'current-user');

      await syncQueueDB.add({
        type: 'update',
        entity: 'ticket',
        entityId: ticketId,
        action: 'UPDATE',
        payload: updates,
        priority: 2,
        maxAttempts: 5,
      });
    }

    return {
      ticketId,
      updates,
      staffId: ticket?.techId
    };
  }
);

// Mark pending ticket as paid (creates transaction and removes from pending) via Supabase
export const markTicketAsPaid = createAsyncThunk(
  'uiTickets/markPaid',
  async (
    {
      ticketId,
      paymentMethod,
      paymentDetails,
      tip,
    }: {
      ticketId: string;
      paymentMethod: PaymentMethod;
      paymentDetails: PaymentDetails;
      tip: number;
    },
    { getState, dispatch }
  ) => {
    const state = getState() as RootState;

    // Find the pending ticket
    const pendingTicket = state.uiTickets.pendingTickets.find(t => t.id === ticketId);

    if (!pendingTicket) {
      throw new Error('Pending ticket not found');
    }

    // Build transaction input
    const transactionInput: CreateTransactionInput = {
      ticketId: pendingTicket.id,
      ticketNumber: pendingTicket.number,
      clientName: pendingTicket.clientName,
      clientId: undefined,
      subtotal: pendingTicket.subtotal,
      tax: pendingTicket.tax,
      tip: tip,
      discount: 0,
      paymentMethod,
      paymentDetails,
      services: [
        {
          name: pendingTicket.service,
          price: pendingTicket.subtotal,
          staffName: pendingTicket.technician,
        },
      ],
      notes: `Payment processed for ticket #${pendingTicket.number}`,
    };

    let transaction;
    try {
      // Try Supabase first
      transaction = await dispatch(createTransactionInSupabase(transactionInput)).unwrap();

      // Update ticket status to 'paid' in Supabase
      await dataService.tickets.updateStatus(ticketId, 'paid');
      console.log('✅ Ticket marked as paid in Supabase:', ticketId);
    } catch (error) {
      console.warn('⚠️ Supabase failed, falling back to IndexedDB:', error);
      // Fallback to IndexedDB transaction
      transaction = await dispatch(createTransactionFromPending(transactionInput)).unwrap();
    }

    return {
      ticketId,
      transaction,
    };
  }
);

// Check-in appointment (creates ticket from appointment and moves to waitlist)
export const checkInAppointment = createAsyncThunk(
  'uiTickets/checkInAppointment',
  async (appointmentId: string, { getState, dispatch }) => {
    const state = getState() as RootState;
    const ticketNumber = state.uiTickets.lastTicketNumber + 1;

    // Get appointment from the store
    const appointment = state.appointments.appointments.find(apt => apt.id === appointmentId);

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    try {
      // 1. Update appointment status to 'checked-in' in Supabase
      await dataService.appointments.updateStatus(appointmentId, 'checked-in');
      console.log('✅ Appointment checked-in in Supabase:', appointmentId);

      // 2. Create ticket from appointment in Supabase
      const services = appointment.services || [];
      const primaryService = services[0] || {} as any;
      const totalDuration = services.reduce((sum, s) => sum + (s.duration || 30), 0);

      const ticketInsert = toTicketInsert({
        salonId: '',
        clientId: appointment.clientId || '',
        clientName: appointment.clientName || 'Guest',
        services: services.map(s => ({
          id: uuidv4(),
          serviceId: s.serviceId || uuidv4(),
          serviceName: s.serviceName || 'Service',
          name: s.serviceName || 'Service',
          staffId: s.staffId || appointment.staffId || '',
          staffName: s.staffName || appointment.staffName || '',
          price: s.price || 0,
          duration: s.duration || 30,
          commission: 0,
          startTime: '',
          status: 'not_started' as const,
          statusHistory: [],
          totalPausedDuration: 0,
        })),
        products: [],
        status: 'pending', // Supabase uses 'pending' for waitlist
        subtotal: services.reduce((sum, s) => sum + (s.price || 0), 0),
        discount: 0,
        tax: 0,
        tip: 0,
        total: services.reduce((sum, s) => sum + (s.price || 0), 0),
        payments: [],
        createdBy: 'current-user',
        lastModifiedBy: 'current-user',
        syncStatus: 'synced',
        appointmentId: appointmentId, // Link ticket to original appointment
      } as any);

      const row = await dataService.tickets.create(ticketInsert);
      const createdTicket = toTicket(row);

      console.log('✅ Ticket created from appointment in Supabase:', createdTicket.id);

      // 3. Build UITicket for Redux state
      const newTicket: UITicket = {
        id: createdTicket.id,
        number: ticketNumber,
        clientName: appointment.clientName || 'Guest',
        clientType: appointment.clientId ? 'appointment' : 'walk-in',
        service: primaryService.serviceName || 'Service',
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        duration: `${totalDuration}min`,
        status: 'waiting',
        serviceStatus: 'not_started',
        assignedTo: appointment.staffId ? {
          id: appointment.staffId,
          name: appointment.staffName || 'Staff',
          color: '#6B7280', // Default color, will be updated when assigned
        } : undefined,
        technician: appointment.staffName,
        techId: appointment.staffId,
        techColor: '#6B7280',
        notes: appointment.notes,
        priority: 'normal',
        createdAt: new Date(createdTicket.createdAt || new Date()),
        updatedAt: new Date(createdTicket.updatedAt || new Date()),
        lastVisitDate: null,
      };

      // 4. Update appointment in Redux store (mark as checked-in)
      dispatch({
        type: 'appointments/updateLocalAppointment',
        payload: { id: appointmentId, updates: { status: 'checked-in' } }
      });

      return {
        ticket: newTicket,
        appointmentId,
      };
    } catch (error) {
      console.error('❌ Failed to check-in appointment:', error);
      throw error;
    }
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

// ============================================================================
// CHECKOUT → FRONT DESK INTEGRATION THUNKS
// ============================================================================

// Create a new ticket from checkout module
// Status determines which section: 'waiting' -> Waitlist, 'in-service' -> In Service, 'completed' -> Pending
export const createCheckoutTicket = createAsyncThunk(
  'uiTickets/createCheckoutTicket',
  async (input: CheckoutTicketInput, { getState }) => {
    const state = getState() as RootState;
    const ticketNumber = state.uiTickets.lastTicketNumber + 1;
    const now = new Date();

    // Use provided status or default to 'in-service'
    const ticketStatus = input.status || 'in-service';

    // Calculate totals from services
    const subtotal = input.subtotal ?? input.services.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = input.services.reduce((sum, s) => sum + s.duration, 0);

    // Get primary staff (first assigned staff)
    const primaryStaff = input.services.find(s => s.staffId);

    // Build assigned staff array
    const assignedStaff = input.services
      .filter(s => s.staffId)
      .reduce((acc, s) => {
        if (!acc.find(staff => staff.id === s.staffId)) {
          acc.push({
            id: s.staffId!,
            name: s.staffName || 'Staff',
            color: s.staffColor || '#6B7280',
          });
        }
        return acc;
      }, [] as Array<{ id: string; name: string; color: string }>);

    const newTicket: UITicketWithServices = {
      id: uuidv4(),
      number: ticketNumber,
      clientName: input.clientName || 'Walk-in',
      clientType: input.clientId ? 'appointment' : 'walk-in',
      service: input.services[0]?.serviceName || 'Service',
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      duration: `${totalDuration}min`,
      status: ticketStatus,
      serviceStatus: ticketStatus === 'in-service' ? 'in_progress' : 'not_started',
      assignedTo: primaryStaff ? {
        id: primaryStaff.staffId!,
        name: primaryStaff.staffName || 'Staff',
        color: primaryStaff.staffColor || '#6B7280',
      } : undefined,
      assignedStaff,
      technician: primaryStaff?.staffName,
      techId: primaryStaff?.staffId,
      techColor: primaryStaff?.staffColor,
      notes: input.notes,
      priority: 'normal',
      createdAt: now,
      updatedAt: now,
      lastVisitDate: null,
      // Extended fields for checkout
      checkoutServices: input.services,
      subtotal,
      discount: input.discount || 0,
      tax: input.tax || 0,
      total: input.total || subtotal,
    };

    // Save to IndexedDB using addRaw to preserve all fields including id and status
    await ticketsDB.addRaw({
      id: newTicket.id,
      salonId: 'default-salon', // TODO: Get from auth state
      clientId: input.clientId || null,
      clientName: input.clientName || 'Walk-in',
      number: ticketNumber,
      status: ticketStatus,
      services: input.services.map(s => ({
        id: s.id,
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        name: s.serviceName,
        price: s.price,
        duration: s.duration,
        status: s.status,
        staffId: s.staffId,
        staffName: s.staffName,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      products: [],
      subtotal,
      discount: input.discount || 0,
      tax: input.tax || 0,
      tip: 0,
      total: input.total || subtotal,
      technician: primaryStaff?.staffName,
      techId: primaryStaff?.staffId,
      techColor: primaryStaff?.staffColor,
      assignedStaff,
      createdAt: now.toISOString(),
      createdBy: 'current-user',
      lastModifiedBy: 'current-user',
    } as any);

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

// Update an existing checkout ticket (services, statuses, etc.)
export const updateCheckoutTicket = createAsyncThunk(
  'uiTickets/updateCheckoutTicket',
  async ({ ticketId, updates }: {
    ticketId: string;
    updates: Partial<CheckoutTicketInput>;
  }, { getState }) => {
    const state = getState() as RootState;
    const now = new Date();

    // Find existing ticket
    const existingTicket = state.uiTickets.serviceTickets.find(t => t.id === ticketId);
    if (!existingTicket) {
      throw new Error('Ticket not found');
    }

    // Calculate new totals if services updated
    let subtotal = updates.subtotal;
    let totalDuration: number | undefined;

    if (updates.services) {
      subtotal = subtotal ?? updates.services.reduce((sum, s) => sum + s.price, 0);
      totalDuration = updates.services.reduce((sum, s) => sum + s.duration, 0);
    }

    // Build update object for UI
    const ticketUpdates: Partial<UITicketWithServices> = {
      updatedAt: now,
      ...(updates.clientName && { clientName: updates.clientName }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      ...(subtotal !== undefined && { subtotal }),
      ...(updates.discount !== undefined && { discount: updates.discount }),
      ...(updates.tax !== undefined && { tax: updates.tax }),
      ...(updates.total !== undefined && { total: updates.total }),
      ...(totalDuration !== undefined && { duration: `${totalDuration}min` }),
      ...(updates.services && {
        checkoutServices: updates.services,
        service: updates.services[0]?.serviceName || existingTicket.service,
      }),
    };

    // Update assigned staff if services changed
    if (updates.services) {
      const primaryStaff = updates.services.find(s => s.staffId);
      const assignedStaff = updates.services
        .filter(s => s.staffId)
        .reduce((acc, s) => {
          if (!acc.find(staff => staff.id === s.staffId)) {
            acc.push({
              id: s.staffId!,
              name: s.staffName || 'Staff',
              color: s.staffColor || '#6B7280',
            });
          }
          return acc;
        }, [] as Array<{ id: string; name: string; color: string }>);

      ticketUpdates.assignedStaff = assignedStaff;
      if (primaryStaff) {
        ticketUpdates.assignedTo = {
          id: primaryStaff.staffId!,
          name: primaryStaff.staffName || 'Staff',
          color: primaryStaff.staffColor || '#6B7280',
        };
        ticketUpdates.technician = primaryStaff.staffName;
        ticketUpdates.techId = primaryStaff.staffId;
        ticketUpdates.techColor = primaryStaff.staffColor;
      }

      // Determine overall service status
      const allCompleted = updates.services.every(s => s.status === 'completed');
      const anyInProgress = updates.services.some(s => s.status === 'in_progress');
      const anyPaused = updates.services.some(s => s.status === 'paused');

      if (allCompleted) {
        ticketUpdates.serviceStatus = 'completed';
      } else if (anyInProgress) {
        ticketUpdates.serviceStatus = 'in_progress';
      } else if (anyPaused) {
        ticketUpdates.serviceStatus = 'paused';
      } else {
        ticketUpdates.serviceStatus = 'not_started';
      }
    }

    // Update in IndexedDB
    await ticketsDB.update(ticketId, {
      ...(updates.services && {
        services: updates.services.map(s => ({
          id: s.id,
          name: s.serviceName,
          price: s.price,
          duration: s.duration,
          status: s.status,
          staffId: s.staffId,
          staffName: s.staffName,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      }),
      ...(subtotal !== undefined && { subtotal }),
      ...(updates.discount !== undefined && { discount: updates.discount }),
      ...(updates.tax !== undefined && { tax: updates.tax }),
      ...(updates.total !== undefined && { total: updates.total }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      updatedAt: now,
    } as any, 'current-user');

    // Queue for sync
    await syncQueueDB.add({
      type: 'update',
      entity: 'ticket',
      entityId: ticketId,
      action: 'UPDATE',
      payload: { ticketId, updates: ticketUpdates },
      priority: 2,
      maxAttempts: 5,
    });

    return { ticketId, updates: ticketUpdates };
  }
);

// Helper function to convert DB ticket to UI ticket (IndexedDB fallback)
function convertToUITicket(dbTicket: any): UITicket {
  return {
    id: dbTicket.id,
    number: dbTicket.number || parseInt(dbTicket.id.split('-')[1]) || 0,
    clientName: dbTicket.clientName || dbTicket.clientId || 'Walk-in',
    clientType: dbTicket.clientId ? 'appointment' : 'walk-in',
    service: dbTicket.services?.[0]?.name || 'Service',
    time: new Date(dbTicket.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    duration: `${dbTicket.services?.[0]?.duration || 30}min`,
    status: dbTicket.status,
    serviceStatus: dbTicket.serviceStatus,
    assignedTo: dbTicket.assignedTo,
    assignedStaff: dbTicket.assignedStaff,
    notes: dbTicket.notes,
    priority: dbTicket.priority || 'normal',
    technician: dbTicket.technician,
    techColor: dbTicket.techColor,
    techId: dbTicket.techId,
    createdAt: dbTicket.createdAt,
    updatedAt: dbTicket.updatedAt,
    lastVisitDate: dbTicket.lastVisitDate || null,
  };
}

// Helper function to convert DB ticket to PendingTicket
function convertToPendingTicket(dbTicket: any): PendingTicket {
  const services = dbTicket.services || [];
  const subtotal = dbTicket.subtotal || services.reduce((sum: number, s: any) => sum + (s.price || 0), 0);

  return {
    id: dbTicket.id,
    number: dbTicket.number || parseInt(dbTicket.id.split('-')[1]) || 0,
    clientName: dbTicket.clientName || dbTicket.clientId || 'Walk-in',
    clientType: dbTicket.clientId ? 'appointment' : 'walk-in',
    service: services[0]?.name || 'Service',
    additionalServices: Math.max(0, services.length - 1),
    subtotal,
    tax: dbTicket.tax || 0,
    tip: dbTicket.tip || 0,
    paymentType: 'card',
    time: new Date(dbTicket.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    duration: `${services[0]?.duration || 30}min`,
    notes: dbTicket.notes,
    technician: dbTicket.technician || services[0]?.staffName,
    techColor: dbTicket.techColor,
    techId: dbTicket.techId || services[0]?.staffId,
    assignedStaff: dbTicket.assignedStaff,
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
        // Always update from DB - no mock data fallback
        state.waitlist = action.payload.waitlist;
        state.serviceTickets = action.payload.serviceTickets;
        state.completedTickets = action.payload.completedTickets;
        state.pendingTickets = action.payload.pendingTickets;
        state.lastTicketNumber = action.payload.lastTicketNumber;
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
      // Check-in appointment - add ticket to waitlist
      .addCase(checkInAppointment.fulfilled, (state, action) => {
        const { ticket } = action.payload;
        state.waitlist.push(ticket);
        state.lastTicketNumber = ticket.number;
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
      // Mark ticket as paid - remove from pending (transaction created via thunk)
      .addCase(markTicketAsPaid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markTicketAsPaid.fulfilled, (state, action) => {
        state.loading = false;
        const { ticketId } = action.payload;

        // Remove from pending tickets
        const ticketIndex = state.pendingTickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
          state.pendingTickets.splice(ticketIndex, 1);
        }
      })
      .addCase(markTicketAsPaid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to process payment';
      })
      // Delete ticket
      .addCase(deleteTicket.fulfilled, (state, action) => {
        const ticketId = action.payload;
        state.waitlist = state.waitlist.filter(t => t.id !== ticketId);
        state.serviceTickets = state.serviceTickets.filter(t => t.id !== ticketId);
        state.completedTickets = state.completedTickets.filter(t => t.id !== ticketId);
      })
      // Pause ticket - update serviceStatus
      .addCase(pauseTicket.fulfilled, (state, action) => {
        const { ticketId, updates } = action.payload;
        const ticketIndex = state.serviceTickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
          state.serviceTickets[ticketIndex] = {
            ...state.serviceTickets[ticketIndex],
            serviceStatus: updates.serviceStatus,
            updatedAt: updates.updatedAt,
          };
        }
      })
      // Resume ticket - update serviceStatus
      .addCase(resumeTicket.fulfilled, (state, action) => {
        const { ticketId, updates } = action.payload;
        const ticketIndex = state.serviceTickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
          state.serviceTickets[ticketIndex] = {
            ...state.serviceTickets[ticketIndex],
            serviceStatus: updates.serviceStatus,
            updatedAt: updates.updatedAt,
          };
        }
      })
      // Create checkout ticket - add to appropriate array based on status
      .addCase(createCheckoutTicket.fulfilled, (state, action) => {
        const ticket = action.payload as UITicket;
        state.lastTicketNumber = ticket.number;

        // Route ticket to correct array based on status
        switch (ticket.status) {
          case 'waiting':
            state.waitlist.push(ticket);
            break;
          case 'in-service':
            state.serviceTickets.push(ticket);
            break;
          case 'completed':
            // Completed tickets go to pendingTickets (awaiting payment)
            state.pendingTickets.push({
              id: ticket.id,
              number: ticket.number,
              clientName: ticket.clientName,
              clientType: ticket.clientType,
              service: ticket.service,
              additionalServices: ((ticket as any).checkoutServices?.length || 1) - 1,
              subtotal: (ticket as any).subtotal || 0,
              tax: (ticket as any).tax || 0,
              tip: 0,
              paymentType: 'card',
              time: ticket.time,
              duration: ticket.duration,
              notes: ticket.notes,
              technician: ticket.technician,
              techColor: ticket.techColor,
              techId: ticket.techId,
              assignedStaff: ticket.assignedStaff,
              lastVisitDate: ticket.lastVisitDate,
            });
            break;
        }
      })
      // Update checkout ticket - update in service tickets
      .addCase(updateCheckoutTicket.fulfilled, (state, action) => {
        const { ticketId, updates } = action.payload;
        const ticketIndex = state.serviceTickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
          state.serviceTickets[ticketIndex] = {
            ...state.serviceTickets[ticketIndex],
            ...updates,
          };
        }
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
