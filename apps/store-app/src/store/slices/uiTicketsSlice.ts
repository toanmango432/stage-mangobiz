import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ticketsDB, syncQueueDB } from '../../db/database';
import { dataService } from '../../services/dataService';
import { auditLogger } from '../../services/audit/auditLogger';
// Adapters not needed - dataService returns converted types
import type { CreateTicketInput, DeleteReason, TicketNote, StatusChange, PriceDecision, PriceOverrideLog } from '../../types';
// Price comparison utilities for auto-resolution
import { getPriceDecisionRecommendation, detectPriceChange } from '../../utils/priceComparisonUtils';
import { DEFAULT_PRICING_POLICY } from '../../types/settings';
import type { PricingPolicySettings } from '../../types/settings';
// NOTE: Do NOT import RootState from '../index' - causes circular dependency
// Instead, define a local type for the state we need access to
// Local RootState type to avoid circular dependency with store/index.ts
// This type only includes the slices accessed by this file's thunks and selectors
interface RootState {
  uiTickets: {
    waitlist: UITicket[];
    serviceTickets: UITicket[];
    completedTickets: UITicket[];
    pendingTickets: PendingTicket[];
    loading: boolean;
    error: string | null;
    lastTicketNumber: number;
    lastCheckInDate: string | null;
    lastCheckInNumber: number;
  };
  appointments: {
    appointments: Array<{
      id: string;
      serverId?: string;
      clientId?: string;
      clientName: string;
      clientPhone?: string;
      staffId: string;
      staffName?: string;
      notes?: string;
      services: Array<{
        id?: string;
        serviceId?: string;
        name: string;
        serviceName?: string;
        price?: number;
        duration?: number;
        staffId?: string;
        staffName?: string;
      }>;
      scheduledStartTime: string;
      scheduledEndTime: string;
      status: string;
    }>;
  };
  auth: {
    store: {
      storeId: string;
      storeName: string;
      storeLoginId: string;
      tenantId: string;
      tier: string;
    } | null;
    member: {
      memberId: string;
      memberName: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      avatarUrl?: string;
    } | null;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      storeId?: string;
    } | null;
    storeId: string | null;
    device: {
      id: string;
      mode: 'online-only' | 'offline-enabled';
      offlineModeEnabled: boolean;
      registeredAt: string;
    } | null;
  };
}
import { v4 as uuidv4 } from 'uuid';
// NOTE: Do NOT import thunks from transactionsSlice directly - causes circular dependency
// Use dynamic import instead: const { createTransactionInSupabase } = await import('./transactionsSlice');
import type { PaymentMethod, PaymentDetails, CreateTransactionInput } from '../../types';

// Import TicketStatus for proper typing
import type { TicketStatus } from '../../types';

// All possible ticket statuses (TicketStatus + UI-specific statuses)
type AllTicketStatus = TicketStatus | 'waiting' | 'in-service' | 'cancelled';

// Database ticket interface (for type safety in conversions)
interface DBTicket {
  id: string;
  number?: number;
  clientId?: string;
  clientName?: string;
  status: AllTicketStatus;
  services?: Array<{
    id?: string;
    name?: string;
    price?: number;
    duration?: number;
    staffId?: string;
    staffName?: string;
    staffColor?: string;
    commission?: number;
  }>;
  subtotal?: number;
  tax?: number;
  tip?: number;
  notes?: string;
  technician?: string;
  techColor?: string;
  techId?: string;
  priority?: 'normal' | 'high';
  serviceStatus?: ServiceStatus;
  assignedTo?: {
    id: string;
    name: string;
    color: string;
    photo?: string;
  };
  assignedStaff?: Array<{
    id: string;
    name: string;
    color: string;
    photo?: string;
  }>;
  createdAt: Date | string;
  updatedAt?: Date | string;
  syncStatus?: string;
  lastVisitDate?: Date | null;
  checkoutServices?: unknown[];
  // Signature capture (from Mango Pad)
  signatureBase64?: string;
  signatureTimestamp?: string;
  // Soft delete fields
  deletedAt?: string;
  deletedReason?: DeleteReason;
  deletedNote?: string;
}

// Service status for individual services within a ticket
export type ServiceStatus = 'not_started' | 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled';

// Helper function to create a status change entry for history tracking
function createStatusHistoryEntry(
  from: 'waiting' | 'in-service' | 'completed' | 'paid' | null,
  to: 'waiting' | 'in-service' | 'completed' | 'paid',
  changedBy?: string,
  reason?: string
): StatusChange {
  return {
    from,
    to,
    changedAt: new Date().toISOString(),
    ...(changedBy && { changedBy }),
    ...(reason && { reason }),
  };
}

/**
 * Auto-resolve prices for checkout services based on pricing policy settings.
 *
 * This function applies the business's pricing policy to services that have
 * price variances between booked price and current catalog price. It handles:
 *
 * 1. Deposit-locked services (always use booked price)
 * 2. Policy mode rules (honor_booked, use_current, honor_lower, ask_staff)
 * 3. Auto-apply lower prices when enabled
 *
 * Services that require staff input (only in 'ask_staff' mode with price increase)
 * remain unresolved and will show in the PriceResolutionModal.
 *
 * @param services - Array of CheckoutTicketService with price tracking fields
 * @param pricingPolicy - The pricing policy settings (falls back to DEFAULT_PRICING_POLICY)
 * @returns Updated services with priceDecision set for auto-resolved items
 */
function autoResolvePrices(
  services: CheckoutTicketService[],
  pricingPolicy?: PricingPolicySettings
): CheckoutTicketService[] {
  // Use default policy if not provided
  const policy = pricingPolicy ?? DEFAULT_PRICING_POLICY;

  return services.map((service) => {
    // Skip if service already has a price decision
    if (service.priceDecision) {
      return service;
    }

    const bookedPrice = service.bookedPrice;
    const catalogPrice = service.catalogPriceAtCheckout;

    // If we don't have both prices, we can't auto-resolve
    if (bookedPrice === undefined || catalogPrice === undefined) {
      return service;
    }

    // Check if there's a price difference
    const priceChange = detectPriceChange(bookedPrice, catalogPrice);

    // No price change - mark as booked_honored (same as catalog)
    if (!priceChange.hasChange) {
      return {
        ...service,
        priceDecision: 'booked_honored' as PriceDecision,
        priceVariance: 0,
        priceVariancePercent: 0,
      };
    }

    // Get recommendation based on policy
    const recommendation = getPriceDecisionRecommendation(
      policy.defaultMode,
      bookedPrice,
      catalogPrice,
      {
        depositPaid: service.depositLocked ?? false,
        autoApplyLower: policy.autoApplyLowerPrice,
      }
    );

    // If staff input is required, leave service unresolved
    if (recommendation.requiresStaffInput) {
      // Calculate variance for UI display but don't set priceDecision
      return {
        ...service,
        priceVariance: priceChange.variance,
        priceVariancePercent: priceChange.variancePercent,
      };
    }

    // Auto-resolve: update price and set decision
    const finalPrice = recommendation.recommendedPrice;
    const variance = finalPrice - bookedPrice;
    const variancePercent = bookedPrice > 0
      ? Math.round((variance / bookedPrice) * 100 * 100) / 100
      : 0;

    return {
      ...service,
      price: finalPrice,
      priceDecision: recommendation.priceDecision,
      priceVariance: variance,
      priceVariancePercent: variancePercent,
    };
  });
}

// UI-specific ticket interfaces (matching existing TicketContext)
export interface UITicket {
  id: string;
  number: number;
  // Daily-resetting check-in number for vocal call-outs (e.g., "Number 5, you're up!")
  // Separate from ticket.number which is the permanent receipt/record ID
  checkInNumber?: number;
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
    photo?: string;
  };
  // Multi-staff support
  assignedStaff?: Array<{
    id: string;
    name: string;
    color: string;
    photo?: string;
  }>;
  notes?: string;
  // Enhanced notes with timestamp and author tracking (array format)
  ticketNotes?: TicketNote[];
  priority?: 'normal' | 'high';
  technician?: string;
  techColor?: string;
  techId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastVisitDate?: Date | null; // null for first-time clients
  // Checkout panel edits - saved by auto-save
  checkoutServices?: CheckoutTicketService[];
  clientId?: string;
  // Signature capture (from Mango Pad)
  signatureBase64?: string;
  signatureTimestamp?: string;
  // Soft delete fields
  deletedAt?: string;
  deletedReason?: DeleteReason;
  deletedNote?: string;
  // Status history for audit tracking
  statusHistory?: StatusChange[];
}

export interface PendingTicket {
  id: string;
  number: number;
  // Daily-resetting check-in number for vocal call-outs (e.g., "Number 5, you're up!")
  checkInNumber?: number;
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
  // Enhanced notes with timestamp and author tracking (array format)
  ticketNotes?: TicketNote[];
  technician?: string;
  techColor?: string;
  techId?: string;
  // Multi-staff support
  assignedStaff?: Array<{
    id: string;
    name: string;
    color: string;
    photo?: string;
  }>;
  lastVisitDate?: Date | null;
  // When service was marked done (for urgency calculation)
  completedAt?: Date | string;
  // Ticket status - should be 'completed' when in pending section
  status?: 'completed' | 'paid' | 'closed';
  // Full service details for checkout panel editing
  checkoutServices?: CheckoutTicketService[];
  // Client ID for editing
  clientId?: string;
  // Signature capture (from Mango Pad)
  signatureBase64?: string;
  signatureTimestamp?: string;
  // Soft delete fields
  deletedAt?: string;
  deletedReason?: DeleteReason;
  deletedNote?: string;
  // Status history for audit tracking
  statusHistory?: StatusChange[];
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
  staffPhoto?: string;
  startTime?: Date;
  endTime?: Date;
  // ============================================
  // PRICE TRACKING FIELDS
  // ============================================
  // These fields enable tracking price changes between booking and checkout.

  /**
   * Original price at the time of booking.
   * Captured from the appointment's service when ticket is created.
   * Undefined for walk-ins (no prior booking).
   */
  bookedPrice?: number;

  /**
   * Current catalog price when ticket enters checkout mode.
   * Looked up from services catalog at checkout time.
   */
  catalogPriceAtCheckout?: number;

  /**
   * Difference between final price and booked price.
   * Calculated as: (final price) - bookedPrice
   */
  priceVariance?: number;

  /**
   * Price variance as a percentage of the booked price.
   */
  priceVariancePercent?: number;

  /**
   * How the final checkout price was determined.
   * @see PriceDecision
   */
  priceDecision?: PriceDecision;

  /**
   * Reason provided by staff when manually overriding the price.
   */
  priceOverrideReason?: string;

  /**
   * Staff ID who performed the price override.
   */
  priceOverrideBy?: string;

  /**
   * Manager ID who approved the price decision.
   */
  priceApprovedBy?: string;

  /**
   * Indicates if price is locked due to deposit payment.
   */
  depositLocked?: boolean;

  /**
   * Indicates if this service comes from an archived catalog item.
   * Archived services can still be checked out but are marked as "DISCONTINUED"
   * to indicate they are no longer available for new bookings.
   */
  isArchived?: boolean;
}

/**
 * Payload for resolving a price change on a single service.
 * Used by applyPriceResolutions action to update service prices.
 *
 * @example
 * const resolution: PriceResolutionPayload = {
 *   serviceId: 'service-123',
 *   finalPrice: 55.00,
 *   priceDecision: 'catalog_applied',
 * };
 */
export interface PriceResolutionPayload {
  /** ID of the service to update */
  serviceId: string;
  /** The final price to charge for this service */
  finalPrice: number;
  /** How this price was determined */
  priceDecision: PriceDecision;
  /** Optional reason for price override (required if priceDecision is 'manual_override') */
  priceOverrideReason?: string;
  /** Staff ID who performed the override */
  priceOverrideBy?: string;
}

/**
 * Payload for applyPriceResolutions action.
 * Contains the ticket ID and array of service resolutions.
 */
export interface ApplyPriceResolutionsPayload {
  /** ID of the ticket to update */
  ticketId: string;
  /** Array of price resolutions, one per service that needs updating */
  resolutions: PriceResolutionPayload[];
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
  // Daily-resetting check-in number tracking
  // lastCheckInDate: ISO date string (YYYY-MM-DD) of when lastCheckInNumber was last used
  // lastCheckInNumber: The most recent check-in number assigned today
  lastCheckInDate: string | null;
  lastCheckInNumber: number;
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
  // Daily check-in number tracking
  lastCheckInDate: null,
  lastCheckInNumber: 0,
};

// Async Thunks

// Load all tickets from Supabase (with IndexedDB fallback for offline)
// Also merges local-only tickets from IndexedDB that haven't synced yet
export const loadTickets = createAsyncThunk(
  'uiTickets/loadAll',
  async (_storeId: string) => {
    // Helper function to merge local tickets with remote tickets
    // Local tickets (syncStatus === 'local') take precedence and are added if not already in remote
    const mergeTickets = (remoteTickets: DBTicket[], localTickets: DBTicket[]) => {
      const remoteIds = new Set(remoteTickets.map(t => t.id));
      const localOnlyTickets = localTickets.filter(t =>
        t.syncStatus === 'local' && !remoteIds.has(t.id)
      );
      return [...remoteTickets, ...localOnlyTickets];
    };

    try {
      // Try Supabase first
      const today = new Date();
      // dataService.tickets.getByDate already returns Ticket[] (converted)
      const remoteTickets = await dataService.tickets.getByDate(today) as unknown as DBTicket[];

      console.log('📋 Loaded tickets from Supabase:', remoteTickets.length);

      // PERFORMANCE FIX: Use getByDate() instead of getAll() + filter
      // This uses indexed queries instead of loading 500+ tickets
      const localTicketsDefault = await ticketsDB.getByDate('default-salon', today) as unknown as DBTicket[];
      const localTicketsSalon = await ticketsDB.getByDate(_storeId, today) as unknown as DBTicket[];
      const todayLocalTickets = [...localTicketsDefault, ...localTicketsSalon];

      console.log('📋 Local unsynced tickets found:', todayLocalTickets.filter(t => t.syncStatus === 'local').length);

      // Merge remote and local tickets
      const allTickets = mergeTickets(remoteTickets, todayLocalTickets);

      // Map Supabase status to UI status
      // Supabase uses: 'pending', 'in-service', 'completed', 'paid', 'cancelled'
      // CRITICAL: Filter out soft-deleted tickets (deletedAt is set)
      const activeTickets = allTickets.filter((t) => !t.deletedAt);
      const waitlist = activeTickets.filter((t) => t.status === 'pending' || t.status === 'waiting');
      const serviceTickets = activeTickets.filter((t) => t.status === 'in-service');
      // 'completed' status tickets are pending payment
      const pendingTickets = activeTickets.filter((t) => t.status === 'completed');
      // 'paid' status tickets are fully completed
      const completedTickets = activeTickets.filter((t) => t.status === 'paid');

      // Get last ticket number from all tickets
      const lastTicketNumber = allTickets.length > 0
        ? Math.max(...allTickets.map((t) => t.number || 0))
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
      // PERFORMANCE FIX: Use getByDate() instead of getAll() for offline mode
      const today = new Date();
      const localTicketsDefault = await ticketsDB.getByDate('default-salon', today) as unknown as DBTicket[];
      const localTicketsSalon = await ticketsDB.getByDate(_storeId, today) as unknown as DBTicket[];
      const allTickets = [...localTicketsDefault, ...localTicketsSalon];

      // Deduplicate by id
      const seen = new Set<string>();
      const uniqueTickets = allTickets.filter(t => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });

      console.log('📋 Loaded tickets from IndexedDB:', uniqueTickets.length);

      // CRITICAL: Filter out soft-deleted tickets (deletedAt is set)
      const activeTicketsIdb = uniqueTickets.filter((t) => !t.deletedAt);
      const waitlistIdb = activeTicketsIdb.filter((t) => t.status === 'waiting' || t.status === 'pending');
      const serviceTicketsIdb = activeTicketsIdb.filter((t) => t.status === 'in-service');
      const pendingTicketsIdb = activeTicketsIdb.filter((t) => t.status === 'completed');
      const completedTicketsIdb = activeTicketsIdb.filter((t) => t.status === 'paid');

      const lastTicketNumberIdb = uniqueTickets.length > 0
        ? Math.max(...uniqueTickets.map((t) => t.number || parseInt(t.id.split('-')[1]) || 0))
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

    // Calculate daily-resetting check-in number
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const { lastCheckInDate, lastCheckInNumber } = state.uiTickets;

    // Reset to 1 if new day, otherwise increment
    const checkInNumber = lastCheckInDate === today
      ? lastCheckInNumber + 1
      : 1;

    try {
      // Build ticket for Supabase using CreateTicketInput
      const ticketInput: CreateTicketInput = {
        clientId: '',
        clientName: ticketData.clientName,
        clientPhone: '',
        services: [{
          serviceId: uuidv4(),
          serviceName: ticketData.service,
          staffId: ticketData.techId || '',
          staffName: ticketData.technician || '',
          price: 0,
          duration: parseInt(ticketData.duration || '30') || 30,
          commission: 0,
          startTime: new Date().toISOString(),
          status: 'not_started' as const,
        }],
        products: [],
        source: 'pos', // 'pos' for walk-in tickets
      };

      // dataService.tickets.create returns Ticket directly
      const createdTicket = await dataService.tickets.create(ticketInput);

      console.log('✅ Ticket created in Supabase:', createdTicket.id);

      // Audit log ticket creation
      // Note: storeId comes from createdTicket which has storeId from dataService
      auditLogger.log({
        action: 'create',
        entityType: 'ticket',
        entityId: createdTicket.id,
        description: `Created ticket #${ticketNumber} for ${ticketData.clientName || 'Walk-in'} - ${ticketData.service || 'Service'}`,
        severity: 'low',
        success: true,
        metadata: {
          ticketNumber,
          clientName: ticketData.clientName,
          service: ticketData.service,
          technician: ticketData.technician,
          storeId: createdTicket.storeId, // Include for debugging
        },
      }).catch((err) => console.warn('[Audit] createTicket log failed:', err));

      // Convert to UITicket format with initial status history
      const initialStatusEntry = createStatusHistoryEntry(null, 'waiting');
      const newTicket: UITicket = {
        ...ticketData,
        id: createdTicket.id,
        number: ticketNumber, // Use local numbering for display
        checkInNumber, // Daily-resetting check-in number for call-outs
        status: 'waiting', // UI uses 'waiting'
        createdAt: new Date(createdTicket.createdAt || new Date()),
        updatedAt: new Date(createdTicket.updatedAt || new Date()),
        statusHistory: [initialStatusEntry],
      };

      return { ticket: newTicket, checkInDate: today, checkInNumber };
    } catch (error) {
      console.error('❌ Failed to create ticket in Supabase:', error);
      // Fallback to IndexedDB for offline with initial status history
      const initialStatusEntry = createStatusHistoryEntry(null, 'waiting');
      const newTicket: UITicket = {
        ...ticketData,
        id: uuidv4(),
        number: ticketNumber,
        checkInNumber, // Daily-resetting check-in number for call-outs
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date(),
        statusHistory: [initialStatusEntry],
      };

      await ticketsDB.create({
        id: newTicket.id,
        storeId: 'salon-001',
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

      return { ticket: newTicket, checkInDate: today, checkInNumber };
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

    // Check for staff conflict (staff already has an active in-service ticket)
    const conflictResult = checkStaffConflict(staffId, state.uiTickets.serviceTickets);
    if (conflictResult.hasConflict && conflictResult.conflictingTicket) {
      // Return conflict info - UI can decide whether to proceed or warn
      return {
        ticketId,
        conflict: true,
        conflictingTicket: conflictResult.conflictingTicket,
        conflictWarning: `${staffName} is currently serving ${conflictResult.clientName}`,
        updates: null,
        staffId,
        ticketInfo: ticket ? {
          clientName: ticket.clientName,
          serviceName: ticket.service,
        } : null
      };
    }

    const updates = {
      assignedTo: { id: staffId, name: staffName, color: staffColor },
      technician: staffName,
      techId: staffId,
      techColor: staffColor,
      status: 'in-service' as const,
      updatedAt: new Date(),
    };

    try {
      // Update in Supabase - include ALL staff assignment data
      await dataService.tickets.update(ticketId, {
        status: 'in-service' as any, // UI-specific status not in TicketStatus type
        technician: staffName,
        techId: staffId,
        techColor: staffColor,
        assignedTo: { id: staffId, name: staffName, color: staffColor },
        updatedAt: new Date().toISOString(),
      } as any);
      console.log('✅ Ticket assigned in Supabase:', ticketId, 'Staff:', staffName);
    } catch (error) {
      console.warn('⚠️ Supabase update failed, using IndexedDB:', error);
      // Fallback to IndexedDB - include ALL staff assignment data
      await ticketsDB.update(ticketId, {
        status: 'in-service',
        technician: staffName,
        techId: staffId,
        techColor: staffColor,
        assignedTo: { id: staffId, name: staffName, color: staffColor },
        updatedAt: new Date(),
      } as any, 'current-user');

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
      conflict: false,
      conflictingTicket: null,
      conflictWarning: undefined,
      updates,
      staffId,
      ticketInfo: ticket ? {
        clientName: ticket.clientName,
        serviceName: ticket.service,
      } : null
    };
  }
);

// Update ticket via Supabase (for EditTicketModal)
export const updateTicket = createAsyncThunk(
  'uiTickets/update',
  async ({ ticketId, updates }: {
    ticketId: string;
    updates: Partial<UITicket>;
  }, { getState }) => {
    const state = getState() as RootState;
    const now = new Date();

    // Find the ticket in any of the arrays
    const ticket =
      state.uiTickets.waitlist.find(t => t.id === ticketId) ||
      state.uiTickets.serviceTickets.find(t => t.id === ticketId) ||
      state.uiTickets.completedTickets.find(t => t.id === ticketId);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const ticketUpdates = {
      ...updates,
      updatedAt: now,
    };

    try {
      // Update in Supabase
      await dataService.tickets.update(ticketId, {
        clientName: updates.clientName,
        notes: updates.notes,
        updatedAt: now.toISOString(),
        // Map service name to services array if provided
        ...(updates.service && {
          services: [{
            serviceName: updates.service,
            duration: updates.duration ? parseInt(updates.duration) || 30 : undefined,
          }],
        }),
      } as any);
      console.log('✅ Ticket updated in Supabase:', ticketId);
    } catch (error) {
      console.warn('⚠️ Supabase update failed, using IndexedDB:', error);
      // Fallback to IndexedDB
      await ticketsDB.update(ticketId, {
        clientName: updates.clientName,
        notes: updates.notes,
        updatedAt: now,
      } as any, 'current-user');

      // Queue for sync
      await syncQueueDB.add({
        type: 'update',
        entity: 'ticket',
        entityId: ticketId,
        action: 'UPDATE',
        payload: ticketUpdates,
        priority: 2,
        maxAttempts: 5,
      });
    }

    return {
      ticketId,
      updates: ticketUpdates,
      originalStatus: ticket.status,
    };
  }
);

// Complete ticket (moves to pending for checkout) via Supabase
// This is an alternate entry point - also populates price tracking for checkout
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

    // =====================================================
    // PRICE TRACKING: Populate catalogPriceAtCheckout
    // When ticket enters checkout, look up current catalog prices
    // =====================================================
    let checkoutServicesWithPricing: CheckoutTicketService[] | undefined;

    try {
      // Fetch full ticket data to get services with bookedPrice
      const fullTicketData = await dataService.tickets.getById(ticketId);

      if (fullTicketData && fullTicketData.services && fullTicketData.services.length > 0) {
        // For each service, look up current catalog price
        checkoutServicesWithPricing = await Promise.all(
          fullTicketData.services.map(async (service) => {
            // Look up current catalog price
            let catalogPriceAtCheckout: number | undefined;
            try {
              const catalogService = await dataService.services.getById(service.serviceId);
              if (catalogService) {
                catalogPriceAtCheckout = catalogService.price;
              }
            } catch (err) {
              console.warn(`⚠️ Could not look up catalog price for service ${service.serviceId}:`, err);
            }

            // Use bookedPrice from appointment if it exists, otherwise use current catalog price
            // For walk-ins (no prior booking), bookedPrice equals catalogPrice (no variance)
            const bookedPrice = service.bookedPrice ?? catalogPriceAtCheckout ?? service.price;

            // Build checkout service with price tracking
            const checkoutService: CheckoutTicketService = {
              id: service.id || uuidv4(),
              serviceId: service.serviceId,
              serviceName: service.serviceName || service.name || 'Service',
              price: service.price,
              duration: service.duration,
              status: service.status,
              staffId: service.staffId,
              staffName: service.staffName,
              // Price tracking fields
              bookedPrice,
              catalogPriceAtCheckout,
              depositLocked: service.depositLocked,
            };

            return checkoutService;
          })
        );

        console.log('✅ Price tracking populated for checkout (completeTicket):', checkoutServicesWithPricing.length);
      }
    } catch (error) {
      console.warn('⚠️ Could not populate price tracking for checkout:', error);
    }

    // =====================================================
    // PRICE AUTO-RESOLUTION: Apply pricing policy
    // When ticket is completed, auto-resolve prices based on policy settings
    // Services with 'ask_staff' mode and price increase remain unresolved
    // =====================================================
    if (checkoutServicesWithPricing && checkoutServicesWithPricing.length > 0) {
      // Get pricing policy from settings (state.settings.settings?.checkout?.pricingPolicy)
      const settingsState = state as { settings?: { settings?: { checkout?: { pricingPolicy?: PricingPolicySettings } } } };
      const pricingPolicy = settingsState.settings?.settings?.checkout?.pricingPolicy;

      // Apply auto-resolution based on policy
      checkoutServicesWithPricing = autoResolvePrices(checkoutServicesWithPricing, pricingPolicy);

      // Log auto-resolution results for debugging
      const resolved = checkoutServicesWithPricing.filter(s => s.priceDecision);
      const unresolved = checkoutServicesWithPricing.filter(s => !s.priceDecision && s.bookedPrice !== undefined && s.catalogPriceAtCheckout !== undefined && s.bookedPrice !== s.catalogPriceAtCheckout);

      if (resolved.length > 0 || unresolved.length > 0) {
        console.log(`📊 Price auto-resolution (completeTicket): ${resolved.length} resolved, ${unresolved.length} require staff input`);
      }
    }

    try {
      // Update in Supabase - change status to 'completed'
      await dataService.tickets.updateStatus(ticketId, 'completed');
      console.log('✅ Ticket completed in Supabase:', ticketId);

      // Audit log ticket completion
      auditLogger.log({
        action: 'update',
        entityType: 'ticket',
        entityId: ticketId,
        description: `Completed ticket #${ticket?.number || ticketId} for ${ticket?.clientName || 'Walk-in'}`,
        severity: 'medium',
        success: true,
        metadata: {
          ticketNumber: ticket?.number,
          clientName: ticket?.clientName,
          technician: ticket?.technician,
          amount: completionDetails.amount,
          tip: completionDetails.tip,
        },
      }).catch((err) => console.warn('[Audit] completeTicket log failed:', err));
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

    // Calculate subtotal from services if available, else use completionDetails
    const subtotal = checkoutServicesWithPricing
      ? checkoutServicesWithPricing.reduce((sum, s) => sum + (s.price || 0), 0)
      : (completionDetails.amount || 0);

    // Create pending ticket data with price tracking enabled services
    const pendingTicket: PendingTicket = {
      id: ticket?.id || ticketId,
      number: ticket?.number || 0,
      clientName: ticket?.clientName || '',
      clientType: ticket?.clientType || 'Regular',
      service: ticket?.service || '',
      additionalServices: checkoutServicesWithPricing
        ? Math.max(0, checkoutServicesWithPricing.length - 1)
        : 0,
      subtotal,
      tax: 0,
      tip: completionDetails.tip || 0,
      paymentType: 'card',
      time: ticket?.time || '',
      technician: ticket?.technician,
      techColor: ticket?.techColor,
      techId: ticket?.techId,
      assignedStaff: ticket?.assignedStaff,
      lastVisitDate: ticket?.lastVisitDate,
      status: 'completed', // Bug #5 fix: Ensure status is set
      completedAt: new Date().toISOString(),
      checkoutServices: checkoutServicesWithPricing,
      clientId: ticket?.clientId,
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
      // dataService.tickets.getById returns Ticket directly
      const ticketData = await dataService.tickets.getById(ticketId);
      if (ticketData) {
        const updatedServices = ticketData.services.map((s, i) =>
          i === 0 ? { ...s, status: 'paused' as const, pausedAt: new Date().toISOString() } : s
        );
        // dataService.tickets.update accepts Partial<Ticket>
        await dataService.tickets.update(ticketId, { services: updatedServices });
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
      // dataService.tickets.getById returns Ticket directly
      const ticketData = await dataService.tickets.getById(ticketId);
      if (ticketData) {
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
        // dataService.tickets.update accepts Partial<Ticket>
        await dataService.tickets.update(ticketId, { services: updatedServices });
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

// Mark ticket as paid (creates transaction and removes from any ticket array) via Supabase
// Supports direct checkout from waiting, in-service, OR pending sections
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

    // Search ALL ticket arrays for the ticket (supports direct checkout from any status)
    const pendingTicket = state.uiTickets.pendingTickets.find(t => t.id === ticketId);
    const waitlistTicket = state.uiTickets.waitlist.find(t => t.id === ticketId);
    const serviceTicket = state.uiTickets.serviceTickets.find(t => t.id === ticketId);

    const ticket = pendingTicket || waitlistTicket || serviceTicket;
    const sourceArray: 'pending' | 'waitlist' | 'in-service' | null = pendingTicket
      ? 'pending'
      : waitlistTicket
        ? 'waitlist'
        : serviceTicket
          ? 'in-service'
          : null;

    if (!ticket || !sourceArray) {
      throw new Error('Ticket not found in any section');
    }

    // Build transaction input - handle both UITicket and PendingTicket shapes
    const transactionInput: CreateTransactionInput = {
      ticketId: ticket.id,
      ticketNumber: ticket.number,
      clientName: ticket.clientName,
      clientId: 'clientId' in ticket ? ticket.clientId : undefined,
      subtotal: 'subtotal' in ticket ? ticket.subtotal : 0,
      tax: 'tax' in ticket ? ticket.tax : 0,
      tip: tip,
      discount: 0,
      paymentMethod,
      paymentDetails,
      services: [
        {
          name: ticket.service,
          price: 'subtotal' in ticket ? ticket.subtotal : 0,
          staffName: ticket.technician,
        },
      ],
      notes: `Payment processed for ticket #${ticket.number}`,
    };

    let transaction;
    try {
      // Dynamic import to avoid circular dependency
      const { createTransactionInSupabase } = await import('./transactionsSlice');
      // Try Supabase first
      transaction = await dispatch(createTransactionInSupabase(transactionInput)).unwrap();

      // Update ticket status to 'paid' in Supabase
      await dataService.tickets.updateStatus(ticketId, 'paid');
      console.log('✅ Ticket marked as paid in Supabase:', ticketId, 'from:', sourceArray);
    } catch (error) {
      console.warn('⚠️ Supabase failed, falling back to IndexedDB:', error);
      // Dynamic import to avoid circular dependency
      const { createTransactionFromPending } = await import('./transactionsSlice');
      // Fallback to IndexedDB transaction
      transaction = await dispatch(createTransactionFromPending(transactionInput)).unwrap();
    }

    return {
      ticketId,
      transaction,
      ticket, // Ticket data from any array (UITicket or PendingTicket)
      sourceArray, // Which array the ticket was found in
      paymentMethod, // Include payment method for display in closed tickets
      tip, // Include tip amount for total calculation
    };
  }
);

// Check-in appointment (creates ticket from appointment and moves to waitlist)
export const checkInAppointment = createAsyncThunk(
  'uiTickets/checkInAppointment',
  async (appointmentId: string, { getState, dispatch }) => {
    const state = getState() as RootState;
    const ticketNumber = state.uiTickets.lastTicketNumber + 1;

    // Calculate daily-resetting check-in number
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const { lastCheckInDate, lastCheckInNumber } = state.uiTickets;

    // Reset to 1 if new day, otherwise increment
    const checkInNumber = lastCheckInDate === today
      ? lastCheckInNumber + 1
      : 1;

    // Get appointment from the store
    const appointment = state.appointments.appointments.find(apt => apt.id === appointmentId);

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    try {
      // Use serverId if available, otherwise use local id
      const appointmentServerId = appointment.serverId || appointment.id;

      // =====================================================
      // 1. VALIDATION FIRST - Validate foreign keys BEFORE any status update
      // =====================================================
      const services = appointment.services || [];
      const primaryService = services[0] || {} as any;
      const totalDuration = services.reduce((sum, s) => sum + (s.duration || 30), 0);

      const { validateTicketInput } = await import('../../utils/validation');
      const validation = await validateTicketInput({
        clientId: appointment.clientId || null,
        appointmentId: String(appointmentServerId),
        services: services.map(s => ({
          serviceId: s.serviceId || '',
          staffId: s.staffId || appointment.staffId || '',
        })),
      });

      if (!validation.valid) {
        throw new Error(validation.error || 'Validation failed');
      }
      // =====================================================

      // 2. Update appointment status to 'checked-in' in Supabase (AFTER validation)
      await dataService.appointments.updateStatus(String(appointmentServerId), 'checked-in');
      console.log('✅ Appointment checked-in in Supabase:', appointmentServerId);

      // Build ticket using CreateTicketInput type
      // Note: scheduledStartTime and scheduledEndTime are now ISO strings
      const startTimeIso = typeof appointment.scheduledStartTime === 'string'
        ? appointment.scheduledStartTime
        : new Date(appointment.scheduledStartTime).toISOString();
      const endTimeIso = typeof appointment.scheduledEndTime === 'string'
        ? appointment.scheduledEndTime
        : new Date(appointment.scheduledEndTime).toISOString();

      const ticketInput: CreateTicketInput = {
        appointmentId: String(appointmentServerId), // ✅ CRITICAL: Link ticket to appointment
        clientId: appointment.clientId || '',
        clientName: appointment.clientName || 'Guest',
        clientPhone: appointment.clientPhone || '',
        services: services.map(s => ({
          serviceId: s.serviceId || uuidv4(),
          serviceName: s.serviceName || 'Service',
          staffId: s.staffId || appointment.staffId || '',
          staffName: s.staffName || appointment.staffName || '',
          price: s.price || 0,
          duration: s.duration || 30,
          commission: (s as any).commission || 0,
          startTime: startTimeIso,
          endTime: endTimeIso,
          status: 'not_started' as const,
        })),
        products: [],
        source: 'calendar', // 'calendar' for tickets created from appointments
      };

      // dataService.tickets.create returns Ticket directly
      const createdTicket = await dataService.tickets.create(ticketInput);

      console.log('✅ Ticket created from appointment in Supabase:', createdTicket.id);

      // 3. Build UITicket for Redux state
      const newTicket: UITicket = {
        id: createdTicket.id,
        number: ticketNumber,
        checkInNumber, // Daily-resetting check-in number for call-outs
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
        appointmentId: String(appointmentServerId),
        // Include check-in tracking for reducer to update state
        checkInDate: today,
        checkInNumber,
      };
    } catch (error) {
      console.error('❌ Failed to check-in appointment:', error);
      throw error;
    }
  }
);

// Delete ticket (soft delete with categorized reason)
export const deleteTicket = createAsyncThunk(
  'uiTickets/delete',
  async ({ ticketId, reason, note }: {
    ticketId: string;
    reason: DeleteReason;
    note?: string;
  }, { getState }) => {
    const state = getState() as RootState;
    const now = new Date();

    // Find ticket in any array
    const ticket =
      state.uiTickets.waitlist.find(t => t.id === ticketId) ||
      state.uiTickets.serviceTickets.find(t => t.id === ticketId) ||
      state.uiTickets.pendingTickets.find(t => t.id === ticketId);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const deleteData = {
      deletedAt: now.toISOString(),
      deletedReason: reason,
      deletedNote: note,
      updatedAt: now,
    };

    try {
      // Soft delete in Supabase - update with delete fields
      await dataService.tickets.update(ticketId, {
        deletedAt: now.toISOString(),
        updatedAt: now.toISOString(),
      } as any);
      console.log('✅ Ticket soft deleted in Supabase:', ticketId, 'Reason:', reason);
    } catch (error) {
      console.warn('⚠️ Supabase update failed, using IndexedDB:', error);
      // Soft delete in IndexedDB
      await ticketsDB.update(ticketId, deleteData as any, 'current-user');

      // Queue for sync
      await syncQueueDB.add({
        type: 'update',
        entity: 'ticket',
        entityId: ticketId,
        action: 'UPDATE',
        payload: deleteData,
        priority: 2,
        maxAttempts: 5,
      });
    }

    return {
      ticketId,
      reason,
      note,
      deletedAt: now.toISOString(),
    };
  }
);

// Remove pending ticket (maps RemoveReason to DeleteReason and calls deleteTicket)
// This is a wrapper around deleteTicket specifically for pending tickets
export const removePendingTicket = createAsyncThunk(
  'uiTickets/removePending',
  async ({ ticketId, reason, notes }: {
    ticketId: string;
    reason: 'client_left' | 'cancelled' | 'other';
    notes?: string;
  }, { dispatch }) => {
    // Map RemoveReason to DeleteReason
    const deleteReason: DeleteReason = reason === 'client_left' ? 'client_left' : 'other';
    
    // Call deleteTicket thunk to perform soft delete
    const result = await dispatch(deleteTicket({
      ticketId,
      reason: deleteReason,
      note: notes,
    })).unwrap();
    
    return result;
  }
);

// ============================================================================
// TICKET NOTES THUNKS
// ============================================================================

// Add a note to a ticket with author and timestamp tracking
export const addTicketNote = createAsyncThunk(
  'uiTickets/addNote',
  async ({ ticketId, text }: {
    ticketId: string;
    text: string;
  }, { getState }) => {
    const state = getState() as RootState;
    const now = new Date();

    // Find ticket in any array
    const ticket =
      state.uiTickets.waitlist.find(t => t.id === ticketId) ||
      state.uiTickets.serviceTickets.find(t => t.id === ticketId) ||
      state.uiTickets.pendingTickets.find(t => t.id === ticketId) ||
      state.uiTickets.completedTickets.find(t => t.id === ticketId);

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Get current user from auth state (fallback to defaults for development)
    const authState = state.auth;
    const authorId = authState?.user?.id || 'staff-1';
    const authorName = authState?.user?.name || authState?.user?.email || 'Staff Member';

    // Create new note
    const newNote: TicketNote = {
      id: uuidv4(),
      text,
      authorId,
      authorName,
      createdAt: now.toISOString(),
    };

    // Get existing notes and append new one
    const existingNotes = (ticket as UITicket).ticketNotes || [];
    const updatedNotes = [...existingNotes, newNote];

    try {
      // Update in Supabase
      await dataService.tickets.update(ticketId, {
        notes: text, // Keep legacy notes field updated with latest note
        updatedAt: now.toISOString(),
      } as any);
      console.log('✅ Note added to ticket in Supabase:', ticketId);
    } catch (error) {
      console.warn('⚠️ Supabase update failed, using IndexedDB:', error);
      await ticketsDB.update(ticketId, {
        notes: text,
        updatedAt: now,
      } as any, 'current-user');

      // Queue for sync
      await syncQueueDB.add({
        type: 'update',
        entity: 'ticket',
        entityId: ticketId,
        action: 'UPDATE',
        payload: { ticketNotes: updatedNotes, notes: text },
        priority: 2,
        maxAttempts: 5,
      });
    }

    // Determine which array the ticket is in for the reducer
    const ticketLocation = state.uiTickets.waitlist.find(t => t.id === ticketId) ? 'waitlist'
      : state.uiTickets.serviceTickets.find(t => t.id === ticketId) ? 'serviceTickets'
      : state.uiTickets.completedTickets.find(t => t.id === ticketId) ? 'completedTickets'
      : 'pendingTickets';

    return {
      ticketId,
      note: newNote,
      ticketNotes: updatedNotes,
      ticketLocation,
    };
  }
);

// ============================================================================
// STATUS TRANSITION THUNKS (Bidirectional)
// ============================================================================

// Move ticket back to waiting (from in-service or pending)
export const moveToWaiting = createAsyncThunk(
  'uiTickets/moveToWaiting',
  async (ticketId: string, { getState }) => {
    const state = getState() as RootState;
    const now = new Date();

    // Find ticket in any array
    const serviceTicket = state.uiTickets.serviceTickets.find(t => t.id === ticketId);
    const pendingTicket = state.uiTickets.pendingTickets.find(t => t.id === ticketId);
    const ticket = serviceTicket || pendingTicket;

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const previousStatus = serviceTicket ? 'in-service' : 'completed';

    const updates = {
      status: 'waiting' as const,
      serviceStatus: 'not_started' as ServiceStatus,
      updatedAt: now,
    };

    try {
      // Update in Supabase - use 'pending' which maps to 'waiting' in UI
      await dataService.tickets.updateStatus(ticketId, 'pending');
      console.log('✅ Ticket moved to waiting in Supabase:', ticketId);
    } catch (error) {
      console.warn('⚠️ Supabase update failed, using IndexedDB:', error);
      await ticketsDB.update(ticketId, {
        status: 'waiting',
        updatedAt: now,
      } as any, 'current-user');

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

    // Create status history entry
    const existingHistory = serviceTicket?.statusHistory || pendingTicket?.statusHistory || [];
    const statusEntry = createStatusHistoryEntry(
      previousStatus as 'in-service' | 'completed',
      'waiting'
    );
    const newStatusHistory = [...existingHistory, statusEntry];

    return {
      ticketId,
      updates,
      previousStatus,
      ticket: serviceTicket ? {
        ...serviceTicket,
        ...updates,
        statusHistory: newStatusHistory,
      } : {
        // Convert PendingTicket to UITicket
        id: pendingTicket!.id,
        number: pendingTicket!.number,
        clientName: pendingTicket!.clientName,
        clientType: pendingTicket!.clientType,
        service: pendingTicket!.service,
        time: pendingTicket!.time,
        duration: pendingTicket!.duration,
        status: 'waiting' as const,
        serviceStatus: 'not_started' as ServiceStatus,
        technician: pendingTicket!.technician,
        techColor: pendingTicket!.techColor,
        techId: pendingTicket!.techId,
        assignedStaff: pendingTicket!.assignedStaff,
        notes: pendingTicket!.notes,
        createdAt: now,
        updatedAt: now,
        lastVisitDate: pendingTicket!.lastVisitDate,
        statusHistory: newStatusHistory,
      },
    };
  }
);

// Move ticket to in-service (from waiting)
export const moveToInService = createAsyncThunk(
  'uiTickets/moveToInService',
  async (ticketId: string, { getState }) => {
    const state = getState() as RootState;
    const now = new Date();

    // Find ticket in waitlist
    const ticket = state.uiTickets.waitlist.find(t => t.id === ticketId);

    if (!ticket) {
      throw new Error('Ticket not found in waitlist');
    }

    const updates = {
      status: 'in-service' as const,
      serviceStatus: 'in_progress' as ServiceStatus,
      updatedAt: now,
    };

    try {
      // Update in Supabase
      await dataService.tickets.updateStatus(ticketId, 'in-service');
      console.log('✅ Ticket moved to in-service in Supabase:', ticketId);
    } catch (error) {
      console.warn('⚠️ Supabase update failed, using IndexedDB:', error);
      await ticketsDB.update(ticketId, {
        status: 'in-service',
        updatedAt: now,
      } as any, 'current-user');

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

    // Create status history entry
    const existingHistory = ticket.statusHistory || [];
    const statusEntry = createStatusHistoryEntry('waiting', 'in-service');
    const newStatusHistory = [...existingHistory, statusEntry];

    return {
      ticketId,
      updates,
      ticket: {
        ...ticket,
        ...updates,
        statusHistory: newStatusHistory,
      },
    };
  }
);

// Move ticket to pending/completed (from in-service)
// This is the entry point for checkout - populate catalogPriceAtCheckout for price variance detection
export const moveToPending = createAsyncThunk(
  'uiTickets/moveToPending',
  async (ticketId: string, { getState }) => {
    const state = getState() as RootState;
    const now = new Date();

    // Find ticket in service tickets
    const ticket = state.uiTickets.serviceTickets.find(t => t.id === ticketId);

    if (!ticket) {
      throw new Error('Ticket not found in service');
    }

    const updates = {
      status: 'completed' as const,
      serviceStatus: 'completed' as ServiceStatus,
      completedAt: now.toISOString(),
      updatedAt: now,
    };

    // =====================================================
    // PRICE TRACKING: Populate catalogPriceAtCheckout
    // When ticket enters checkout, look up current catalog prices
    // and compare with bookedPrice (if exists from appointment)
    // =====================================================
    let checkoutServicesWithPricing: CheckoutTicketService[] | undefined;

    try {
      // Fetch full ticket data to get services with bookedPrice
      const fullTicketData = await dataService.tickets.getById(ticketId);

      if (fullTicketData && fullTicketData.services && fullTicketData.services.length > 0) {
        // For each service, look up current catalog price
        checkoutServicesWithPricing = await Promise.all(
          fullTicketData.services.map(async (service) => {
            // Look up current catalog price
            let catalogPriceAtCheckout: number | undefined;
            try {
              const catalogService = await dataService.services.getById(service.serviceId);
              if (catalogService) {
                catalogPriceAtCheckout = catalogService.price;
              }
            } catch (err) {
              // Service lookup failed - service may have been deleted
              console.warn(`⚠️ Could not look up catalog price for service ${service.serviceId}:`, err);
            }

            // Use bookedPrice from appointment if it exists, otherwise use current catalog price
            // For walk-ins (no prior booking), bookedPrice equals catalogPrice (no variance)
            const bookedPrice = service.bookedPrice ?? catalogPriceAtCheckout ?? service.price;

            // Build checkout service with price tracking
            const checkoutService: CheckoutTicketService = {
              id: service.id || uuidv4(),
              serviceId: service.serviceId,
              serviceName: service.serviceName || service.name || 'Service',
              price: service.price,
              duration: service.duration,
              status: service.status,
              staffId: service.staffId,
              staffName: service.staffName,
              // Price tracking fields
              bookedPrice,
              catalogPriceAtCheckout,
              // depositLocked flag is preserved if it was set
              depositLocked: service.depositLocked,
            };

            return checkoutService;
          })
        );

        console.log('✅ Price tracking populated for checkout services:', checkoutServicesWithPricing.length);
      } else if (ticket.checkoutServices && ticket.checkoutServices.length > 0) {
        // Fall back to existing checkoutServices and populate catalog prices
        checkoutServicesWithPricing = await Promise.all(
          ticket.checkoutServices.map(async (service) => {
            let catalogPriceAtCheckout: number | undefined;
            try {
              const catalogService = await dataService.services.getById(service.serviceId);
              if (catalogService) {
                catalogPriceAtCheckout = catalogService.price;
              }
            } catch (err) {
              console.warn(`⚠️ Could not look up catalog price for service ${service.serviceId}:`, err);
            }

            // For walk-ins without bookedPrice, set it to catalog price (no variance)
            const bookedPrice = service.bookedPrice ?? catalogPriceAtCheckout ?? service.price;

            return {
              ...service,
              bookedPrice,
              catalogPriceAtCheckout,
            };
          })
        );
      }
    } catch (error) {
      console.warn('⚠️ Could not populate price tracking for checkout:', error);
      // Fall back to existing checkoutServices without price tracking
      checkoutServicesWithPricing = ticket.checkoutServices;
    }

    // =====================================================
    // PRICE AUTO-RESOLUTION: Apply pricing policy
    // When ticket enters checkout, auto-resolve prices based on policy settings
    // Services with 'ask_staff' mode and price increase remain unresolved
    // =====================================================
    if (checkoutServicesWithPricing && checkoutServicesWithPricing.length > 0) {
      // Get pricing policy from settings (state.settings.settings?.checkout?.pricingPolicy)
      const settingsState = state as { settings?: { settings?: { checkout?: { pricingPolicy?: PricingPolicySettings } } } };
      const pricingPolicy = settingsState.settings?.settings?.checkout?.pricingPolicy;

      // Apply auto-resolution based on policy
      checkoutServicesWithPricing = autoResolvePrices(checkoutServicesWithPricing, pricingPolicy);

      // Log auto-resolution results for debugging
      const resolved = checkoutServicesWithPricing.filter(s => s.priceDecision);
      const unresolved = checkoutServicesWithPricing.filter(s => !s.priceDecision && s.bookedPrice !== undefined && s.catalogPriceAtCheckout !== undefined && s.bookedPrice !== s.catalogPriceAtCheckout);

      if (resolved.length > 0 || unresolved.length > 0) {
        console.log(`📊 Price auto-resolution: ${resolved.length} resolved, ${unresolved.length} require staff input`);
      }
    }

    try {
      // Update in Supabase
      await dataService.tickets.updateStatus(ticketId, 'completed');
      console.log('✅ Ticket moved to pending in Supabase:', ticketId);
    } catch (error) {
      console.warn('⚠️ Supabase update failed, using IndexedDB:', error);
      await ticketsDB.update(ticketId, {
        status: 'completed',
        updatedAt: now,
      } as any, 'current-user');

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

    // Create status history entry
    const existingHistory = ticket.statusHistory || [];
    const statusEntry = createStatusHistoryEntry('in-service', 'completed');
    const newStatusHistory = [...existingHistory, statusEntry];

    // Calculate subtotal from services if available
    const subtotal = checkoutServicesWithPricing
      ? checkoutServicesWithPricing.reduce((sum, s) => sum + (s.price || 0), 0)
      : 0;

    // Create pending ticket data with price tracking enabled services
    const pendingTicket: PendingTicket = {
      id: ticket.id,
      number: ticket.number,
      clientName: ticket.clientName,
      clientType: ticket.clientType,
      service: ticket.service,
      additionalServices: checkoutServicesWithPricing
        ? Math.max(0, checkoutServicesWithPricing.length - 1)
        : 0,
      subtotal,
      tax: 0,
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
      status: 'completed',
      completedAt: now.toISOString(),
      checkoutServices: checkoutServicesWithPricing,
      clientId: ticket.clientId,
      statusHistory: newStatusHistory,
    };

    return {
      ticketId,
      updates,
      pendingTicket,
    };
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
    const storeId = state.auth.store?.storeId ?? 'default-salon';
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
            photo: s.staffPhoto,
          });
        }
        return acc;
      }, [] as Array<{ id: string; name: string; color: string; photo?: string }>);

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
        photo: primaryStaff.staffPhoto,
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
      storeId,
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

    // Find existing ticket - search across all ticket arrays
    const existingTicket =
      state.uiTickets.serviceTickets.find(t => t.id === ticketId) ||
      state.uiTickets.waitlist.find(t => t.id === ticketId) ||
      state.uiTickets.pendingTickets.find(t => t.id === ticketId);

    if (!existingTicket) {
      console.error('❌ Ticket not found in any array:', ticketId);
      throw new Error('Ticket not found');
    }

    console.log('📍 Found ticket in state, current status:', existingTicket.status);

    // Check if status is changing (important for moving ticket between arrays)
    const currentStatus = existingTicket.status;
    const newStatus = updates.status;
    const statusChanged = newStatus && newStatus !== currentStatus;
    const isMovingToInService = statusChanged && newStatus === 'in-service' && currentStatus === 'waiting';

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
      // Update status if provided
      ...(newStatus && { status: newStatus }),
      // Update serviceStatus when moving to in-service
      ...(isMovingToInService && { serviceStatus: 'in_progress' as ServiceStatus }),
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
              photo: s.staffPhoto,
            });
          }
          return acc;
        }, [] as Array<{ id: string; name: string; color: string; photo?: string }>);

      ticketUpdates.assignedStaff = assignedStaff;
      if (primaryStaff) {
        ticketUpdates.assignedTo = {
          id: primaryStaff.staffId!,
          name: primaryStaff.staffName || 'Staff',
          color: primaryStaff.staffColor || '#6B7280',
          photo: primaryStaff.staffPhoto,
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

    // If status is changing to 'in-service' from 'waiting', update in Supabase first
    if (isMovingToInService) {
      try {
        // Update status in Supabase
        await dataService.tickets.updateStatus(ticketId, 'in-service');
        console.log('Ticket assigned in Supabase:', ticketId, 'Status: in-service');
      } catch (error) {
        console.warn('⚠️ Supabase update failed, will use IndexedDB fallback:', error);
      }
    }

    // Update in IndexedDB
    // CRITICAL: Save both services (for backward compatibility) AND checkoutServices (for multi-service support)
    // checkoutServices is needed when ticket is reopened - without it, only first service is preserved
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
        // CRITICAL: Also save checkoutServices array to preserve ALL services when ticket is reopened
        // This prevents data loss when user adds multiple services (e.g., Haircut Women + Pedicure)
        checkoutServices: updates.services.map(s => ({
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
      }),
      ...(subtotal !== undefined && { subtotal }),
      ...(updates.discount !== undefined && { discount: updates.discount }),
      ...(updates.tax !== undefined && { tax: updates.tax }),
      ...(updates.total !== undefined && { total: updates.total }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      ...(newStatus && { status: newStatus }),
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

    return { 
      ticketId, 
      updates: ticketUpdates,
      statusChanged,
      previousStatus: currentStatus,
      newStatus: newStatus || currentStatus,
    };
  }
);

/**
 * Apply price resolutions to a ticket and log override decisions.
 *
 * This thunk:
 * 1. Applies price resolutions via the applyPriceResolutions reducer
 * 2. Logs price override decisions to the audit trail (for non-booked_honored decisions)
 *
 * Only logs when priceDecision is NOT 'booked_honored' (i.e., when the price was changed).
 *
 * @param ticketId - ID of the ticket
 * @param resolutions - Array of price resolution payloads
 */
export const applyPriceResolutionsWithLogging = createAsyncThunk(
  'uiTickets/applyPriceResolutionsWithLogging',
  async (
    { ticketId, resolutions }: ApplyPriceResolutionsPayload,
    { dispatch, getState }
  ) => {
    // Get the pending ticket to access service details before resolution
    const state = getState() as { uiTickets: UITicketsState };
    const ticket = state.uiTickets.pendingTickets.find(t => t.id === ticketId);

    if (!ticket) {
      console.warn('⚠️ Ticket not found for price resolution logging:', ticketId);
      return { ticketId, resolutions, logged: 0 };
    }

    // Apply the price resolutions
    dispatch(applyPriceResolutions({ ticketId, resolutions }));

    // Log override decisions (only non-booked_honored decisions)
    let loggedCount = 0;

    for (const resolution of resolutions) {
      // Skip logging if price was honored (no change scenario)
      if (resolution.priceDecision === 'booked_honored') {
        continue;
      }

      // Find the service to get original prices
      const service = ticket.checkoutServices?.find(s => s.id === resolution.serviceId);
      if (!service) {
        console.warn('⚠️ Service not found for logging:', resolution.serviceId);
        continue;
      }

      // Get prices for the log
      const bookedPrice = service.bookedPrice ?? service.price;
      const catalogPrice = service.catalogPriceAtCheckout ?? service.price;
      const finalPrice = resolution.finalPrice;
      const variance = finalPrice - bookedPrice;
      const variancePercent = bookedPrice > 0 ? (variance / bookedPrice) * 100 : 0;

      // Create and log the price override entry
      const logEntry: Omit<PriceOverrideLog, 'id'> = {
        type: 'price_override',
        ticketId,
        serviceLineItemId: resolution.serviceId,
        bookedPrice,
        catalogPrice,
        finalPrice,
        variance,
        variancePercent: Math.round(variancePercent * 100) / 100,
        decision: resolution.priceDecision,
        ...(resolution.priceOverrideReason && { reason: resolution.priceOverrideReason }),
        performedBy: resolution.priceOverrideBy || 'unknown',
        ...(resolution.priceOverrideBy && { approvedBy: undefined }), // Manager approval tracked separately
        timestamp: new Date().toISOString(),
      };

      // Log to audit trail
      await auditLogger.log({
        action: 'price_override',
        entityType: 'ticket',
        entityId: ticketId,
        description: `Price override: ${service.serviceName} - ${resolution.priceDecision} ($${bookedPrice.toFixed(2)} → $${finalPrice.toFixed(2)})`,
        success: true,
        metadata: {
          ...logEntry,
          serviceName: service.serviceName,
        },
      });

      loggedCount++;
      console.log('📝 Price override logged:', {
        service: service.serviceName,
        decision: resolution.priceDecision,
        variance: variance.toFixed(2),
      });
    }

    return { ticketId, resolutions, logged: loggedCount };
  }
);

// Map DB/API status to UI status
function mapToUIStatus(status: AllTicketStatus): 'waiting' | 'in-service' | 'completed' {
  switch (status) {
    case 'pending':
    case 'waiting':
      return 'waiting';
    case 'in-service':
      return 'in-service';
    case 'completed':
    case 'paid':
    case 'unpaid':
    case 'partial-payment':
    case 'refunded':
    case 'partially-refunded':
    case 'voided':
    case 'failed':
    case 'cancelled':
    default:
      return 'completed';
  }
}

// Helper function to convert DB ticket to UI ticket (IndexedDB fallback)
function convertToUITicket(dbTicket: DBTicket): UITicket {
  const createdAt = dbTicket.createdAt instanceof Date ? dbTicket.createdAt : new Date(dbTicket.createdAt);
  const updatedAt = dbTicket.updatedAt instanceof Date ? dbTicket.updatedAt : new Date(dbTicket.updatedAt || dbTicket.createdAt);

  // CRITICAL: Preserve checkoutServices from IndexedDB to prevent data loss
  // Use checkoutServices if available (multi-service support), otherwise fallback to services[0]
  const checkoutServices = dbTicket.checkoutServices as CheckoutTicketService[] | undefined;
  const serviceName = checkoutServices?.[0]?.serviceName || 
                      dbTicket.services?.[0]?.name || 
                      'Service';

  return {
    id: dbTicket.id,
    number: dbTicket.number || parseInt(dbTicket.id.split('-')[1]) || 0,
    clientName: dbTicket.clientName || dbTicket.clientId || 'Walk-in',
    clientType: dbTicket.clientId ? 'appointment' : 'walk-in',
    service: serviceName,
    time: createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    duration: `${checkoutServices?.[0]?.duration || dbTicket.services?.[0]?.duration || 30}min`,
    status: mapToUIStatus(dbTicket.status),
    serviceStatus: dbTicket.serviceStatus,
    assignedTo: dbTicket.assignedTo,
    assignedStaff: dbTicket.assignedStaff,
    notes: dbTicket.notes,
    priority: dbTicket.priority || 'normal',
    technician: dbTicket.technician,
    techColor: dbTicket.techColor,
    techId: dbTicket.techId,
    createdAt,
    updatedAt,
    lastVisitDate: dbTicket.lastVisitDate || null,
    signatureBase64: dbTicket.signatureBase64,
    signatureTimestamp: dbTicket.signatureTimestamp,
    // CRITICAL: Preserve checkoutServices as a hidden field (UITicket type doesn't include it, but we need it)
    // This will be accessible via (ticket as any).checkoutServices in WaitListSection
    ...(checkoutServices && { checkoutServices } as any),
    // Also preserve services array for backward compatibility
    ...(dbTicket.services && { services: dbTicket.services } as any),
  };
}

// Helper function to convert DB ticket to PendingTicket
function convertToPendingTicket(dbTicket: DBTicket): PendingTicket {
  // CRITICAL: Use checkoutServices if available (multi-service support), otherwise fallback to services
  const checkoutServices = dbTicket.checkoutServices as CheckoutTicketService[] | undefined;
  const legacyServices = dbTicket.services || [];
  const services = checkoutServices || legacyServices;
  const subtotal = dbTicket.subtotal || services.reduce((sum: number, s: any) => sum + (s.price || 0), 0);

  // Helper to get service name (works for both CheckoutTicketService and legacy service format)
  const getServiceName = (s: any) => s?.serviceName || s?.name || 'Service';
  const getServiceDuration = (s: any) => s?.duration || 30;
  const getServiceStaffName = (s: any) => s?.staffName;
  const getServiceStaffId = (s: any) => s?.staffId;

  return {
    id: dbTicket.id,
    number: dbTicket.number || parseInt(dbTicket.id.split('-')[1]) || 0,
    clientName: dbTicket.clientName || dbTicket.clientId || 'Walk-in',
    clientType: dbTicket.clientId ? 'appointment' : 'walk-in',
    service: checkoutServices?.[0]?.serviceName || getServiceName(legacyServices[0]) || 'Service',
    additionalServices: Math.max(0, services.length - 1),
    subtotal,
    tax: dbTicket.tax || 0,
    tip: dbTicket.tip || 0,
    paymentType: 'card',
    time: new Date(dbTicket.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    duration: `${checkoutServices?.[0]?.duration || getServiceDuration(legacyServices[0]) || 30}min`,
    notes: dbTicket.notes,
    technician: dbTicket.technician || checkoutServices?.[0]?.staffName || getServiceStaffName(legacyServices[0]),
    techColor: dbTicket.techColor,
    techId: dbTicket.techId || checkoutServices?.[0]?.staffId || getServiceStaffId(legacyServices[0]),
    assignedStaff: dbTicket.assignedStaff,
    lastVisitDate: dbTicket.lastVisitDate || null,
    signatureBase64: dbTicket.signatureBase64,
    signatureTimestamp: dbTicket.signatureTimestamp,
    // CRITICAL: Preserve checkoutServices for editing in checkout panel
    checkoutServices: checkoutServices,
    // Also preserve clientId if available
    clientId: dbTicket.clientId,
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
    // Dev/testing: Set pending tickets directly
    setPendingTickets: (state, action: PayloadAction<PendingTicket[]>) => {
      state.pendingTickets = action.payload;
    },
    // Reorder waitlist via drag and drop
    reorderWaitlist: (state, action: PayloadAction<{ oldIndex: number; newIndex: number }>) => {
      const { oldIndex, newIndex } = action.payload;
      if (oldIndex < 0 || newIndex < 0 || oldIndex >= state.waitlist.length || newIndex >= state.waitlist.length) {
        return;
      }
      const [movedTicket] = state.waitlist.splice(oldIndex, 1);
      state.waitlist.splice(newIndex, 0, movedTicket);
    },
    // Direct set of waitlist order (for @dnd-kit arrayMove result)
    setWaitlistOrder: (state, action: PayloadAction<UITicket[]>) => {
      state.waitlist = action.payload;
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
    /**
     * Apply price resolutions to services in a pending ticket.
     * Updates each service's price, priceDecision, and variance fields.
     * Also recalculates ticket subtotal after applying all resolutions.
     *
     * @param state - Current UITickets state
     * @param action - Payload containing ticketId and array of resolutions
     */
    applyPriceResolutions: (
      state,
      action: PayloadAction<ApplyPriceResolutionsPayload>
    ) => {
      const { ticketId, resolutions } = action.payload;

      // Find the pending ticket
      const ticketIndex = state.pendingTickets.findIndex(t => t.id === ticketId);
      if (ticketIndex === -1) {
        console.warn('⚠️ Ticket not found for price resolution:', ticketId);
        return;
      }

      const ticket = state.pendingTickets[ticketIndex];
      if (!ticket.checkoutServices || ticket.checkoutServices.length === 0) {
        console.warn('⚠️ Ticket has no checkout services:', ticketId);
        return;
      }

      // Apply each resolution to the corresponding service
      for (const resolution of resolutions) {
        const serviceIndex = ticket.checkoutServices.findIndex(
          s => s.id === resolution.serviceId
        );
        if (serviceIndex === -1) {
          console.warn('⚠️ Service not found in ticket:', resolution.serviceId);
          continue;
        }

        const service = ticket.checkoutServices[serviceIndex];
        const bookedPrice = service.bookedPrice ?? service.price;

        // Calculate variance
        const priceVariance = resolution.finalPrice - bookedPrice;
        const priceVariancePercent =
          bookedPrice > 0 ? (priceVariance / bookedPrice) * 100 : 0;

        // Update service with resolution
        ticket.checkoutServices[serviceIndex] = {
          ...service,
          price: resolution.finalPrice,
          priceDecision: resolution.priceDecision,
          priceVariance,
          priceVariancePercent: Math.round(priceVariancePercent * 100) / 100,
          ...(resolution.priceOverrideReason && {
            priceOverrideReason: resolution.priceOverrideReason,
          }),
          ...(resolution.priceOverrideBy && {
            priceOverrideBy: resolution.priceOverrideBy,
          }),
        };
      }

      // Recalculate subtotal from all service prices
      const newSubtotal = ticket.checkoutServices.reduce(
        (sum, service) => sum + service.price,
        0
      );
      ticket.subtotal = newSubtotal;

      // Update the ticket in state
      state.pendingTickets[ticketIndex] = ticket;
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
        const { ticket, checkInDate, checkInNumber } = action.payload;
        state.waitlist.push(ticket);
        state.lastTicketNumber = ticket.number;
        // Update daily check-in tracking
        state.lastCheckInDate = checkInDate;
        state.lastCheckInNumber = checkInNumber;
      })
      // Check-in appointment - add ticket to waitlist
      .addCase(checkInAppointment.fulfilled, (state, action) => {
        const { ticket, checkInDate, checkInNumber } = action.payload;
        state.waitlist.push(ticket);
        state.lastTicketNumber = ticket.number;
        // Update daily check-in tracking
        state.lastCheckInDate = checkInDate;
        state.lastCheckInNumber = checkInNumber;
      })
      // Assign ticket
      .addCase(assignTicket.fulfilled, (state, action) => {
        const { ticketId, updates, conflict } = action.payload;

        // If conflict detected, don't update state - UI will handle the warning
        if (conflict || !updates) {
          return;
        }

        // Move from waitlist to service
        const ticketIndex = state.waitlist.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
          const existingTicket = state.waitlist[ticketIndex];
          // Create status history entry
          const statusEntry = createStatusHistoryEntry(
            existingTicket.status as 'waiting' | 'in-service' | 'completed' | null,
            'in-service'
          );
          const ticket = {
            ...existingTicket,
            ...updates,
            statusHistory: [...(existingTicket.statusHistory || []), statusEntry],
          };
          state.waitlist.splice(ticketIndex, 1);
          state.serviceTickets.push(ticket);
        }
      })
      // Update ticket (from EditTicketModal)
      .addCase(updateTicket.fulfilled, (state, action) => {
        const { ticketId, updates, originalStatus } = action.payload;

        // Update ticket in the appropriate array based on its original status
        if (originalStatus === 'waiting') {
          const index = state.waitlist.findIndex(t => t.id === ticketId);
          if (index !== -1) {
            state.waitlist[index] = { ...state.waitlist[index], ...updates };
          }
        } else if (originalStatus === 'in-service') {
          const index = state.serviceTickets.findIndex(t => t.id === ticketId);
          if (index !== -1) {
            state.serviceTickets[index] = { ...state.serviceTickets[index], ...updates };
          }
        } else if (originalStatus === 'completed') {
          const index = state.completedTickets.findIndex(t => t.id === ticketId);
          if (index !== -1) {
            state.completedTickets[index] = { ...state.completedTickets[index], ...updates };
          }
        }

        // Also check pendingTickets (checkout tickets with 'completed' status)
        const pendingIndex = state.pendingTickets.findIndex(t => t.id === ticketId);
        if (pendingIndex !== -1) {
          state.pendingTickets[pendingIndex] = {
            ...state.pendingTickets[pendingIndex],
            clientName: updates.clientName || state.pendingTickets[pendingIndex].clientName,
            clientType: updates.clientType || state.pendingTickets[pendingIndex].clientType,
            service: updates.service || state.pendingTickets[pendingIndex].service,
            notes: updates.notes,
          };
        }
      })
      // Complete ticket - move to pending for checkout
      .addCase(completeTicket.fulfilled, (state, action) => {
        const { ticketId, pendingTicket } = action.payload;

        // Remove from service tickets and get existing ticket for history
        const ticketIndex = state.serviceTickets.findIndex(t => t.id === ticketId);
        let existingStatusHistory: StatusChange[] = [];
        if (ticketIndex !== -1) {
          existingStatusHistory = state.serviceTickets[ticketIndex].statusHistory || [];
          state.serviceTickets.splice(ticketIndex, 1);
        }

        // Add to pending tickets for checkout with status history
        if (pendingTicket) {
          const statusEntry = createStatusHistoryEntry('in-service', 'completed');
          state.pendingTickets.push({
            ...pendingTicket,
            statusHistory: [...existingStatusHistory, statusEntry],
          });
        }
      })
      // Mark ticket as paid - remove from pending (transaction created via thunk)
      .addCase(markTicketAsPaid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markTicketAsPaid.fulfilled, (state, action) => {
        state.loading = false;
        const { ticketId, ticket, sourceArray, paymentMethod, tip } = action.payload;

        // Remove ticket from source array based on where it was found
        switch (sourceArray) {
          case 'pending':
            state.pendingTickets = state.pendingTickets.filter(t => t.id !== ticketId);
            break;
          case 'waitlist':
            state.waitlist = state.waitlist.filter(t => t.id !== ticketId);
            break;
          case 'in-service':
            state.serviceTickets = state.serviceTickets.filter(t => t.id !== ticketId);
            break;
        }

        // Add to completedTickets (closed tickets)
        // Handle both UITicket and PendingTicket shapes
        if (ticket) {
          // Calculate total - handle both UITicket and PendingTicket data shapes
          const subtotal = 'subtotal' in ticket ? ticket.subtotal : 0;
          const tax = 'tax' in ticket ? ticket.tax : 0;
          const total = (subtotal || 0) + (tax || 0) + (tip || 0);

          const closedTicket: UITicket = {
            id: ticket.id,
            number: ticket.number,
            clientName: ticket.clientName,
            clientType: ticket.clientType || 'walk-in',
            service: ticket.service,
            time: ticket.time,
            duration: ticket.duration,
            status: 'completed', // Mark as completed (paid tickets show as completed in UI)
            technician: ticket.technician,
            techColor: ticket.techColor,
            techId: ticket.techId,
            assignedStaff: ticket.assignedStaff,
            notes: ticket.notes,
            createdAt: 'createdAt' in ticket ? ticket.createdAt : new Date(),
            updatedAt: new Date(),
            lastVisitDate: ticket.lastVisitDate,
            // Add financial data for display
            total,
            paymentMethod: paymentMethod === 'credit-card' ? 'Card' : paymentMethod === 'cash' ? 'Cash' : paymentMethod,
          } as UITicket; // Use type assertion since UITicket may not have these optional fields defined
          state.completedTickets.push(closedTicket);
        }
      })
      .addCase(markTicketAsPaid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to process payment';
      })
      // Delete ticket (soft delete - filter from view by deletedAt)
      .addCase(deleteTicket.fulfilled, (state, action) => {
        const { ticketId } = action.payload;
        // Filter deleted tickets from all arrays (they're soft-deleted with deletedAt field)
        state.waitlist = state.waitlist.filter(t => t.id !== ticketId);
        state.serviceTickets = state.serviceTickets.filter(t => t.id !== ticketId);
        state.completedTickets = state.completedTickets.filter(t => t.id !== ticketId);
        state.pendingTickets = state.pendingTickets.filter(t => t.id !== ticketId);
      })
      // Add ticket note - append note to ticket's notes array
      .addCase(addTicketNote.fulfilled, (state, action) => {
        const { ticketId, note, ticketLocation } = action.payload;

        // Helper function to add note to a ticket
        const addNoteToTicket = (ticket: UITicket | PendingTicket) => {
          const existingNotes = ticket.ticketNotes || [];
          ticket.ticketNotes = [...existingNotes, note];
          // Also update legacy notes field with latest note text
          ticket.notes = note.text;
        };

        // Find and update ticket in appropriate array based on location
        if (ticketLocation === 'waitlist') {
          const index = state.waitlist.findIndex(t => t.id === ticketId);
          if (index !== -1) {
            addNoteToTicket(state.waitlist[index]);
          }
        } else if (ticketLocation === 'serviceTickets') {
          const index = state.serviceTickets.findIndex(t => t.id === ticketId);
          if (index !== -1) {
            addNoteToTicket(state.serviceTickets[index]);
          }
        } else if (ticketLocation === 'completedTickets') {
          const completedIndex = state.completedTickets.findIndex(t => t.id === ticketId);
          if (completedIndex !== -1) {
            addNoteToTicket(state.completedTickets[completedIndex]);
          }
        } else if (ticketLocation === 'pendingTickets') {
          const pendingIndex = state.pendingTickets.findIndex(t => t.id === ticketId);
          if (pendingIndex !== -1) {
            addNoteToTicket(state.pendingTickets[pendingIndex]);
          }
        }
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
      // Move ticket to waiting - from in-service or pending
      .addCase(moveToWaiting.fulfilled, (state, action) => {
        const { ticketId, previousStatus, ticket } = action.payload;

        if (previousStatus === 'in-service') {
          // Remove from service tickets
          state.serviceTickets = state.serviceTickets.filter(t => t.id !== ticketId);
        } else {
          // Remove from pending tickets
          state.pendingTickets = state.pendingTickets.filter(t => t.id !== ticketId);
        }

        // Add to waitlist
        state.waitlist.push(ticket);
      })
      // Move ticket to in-service - from waiting
      .addCase(moveToInService.fulfilled, (state, action) => {
        const { ticketId, ticket } = action.payload;

        // Remove from waitlist
        state.waitlist = state.waitlist.filter(t => t.id !== ticketId);

        // Add to service tickets
        state.serviceTickets.push(ticket);
      })
      // Move ticket to pending - from in-service
      .addCase(moveToPending.fulfilled, (state, action) => {
        const { ticketId, pendingTicket } = action.payload;

        // Remove from service tickets
        state.serviceTickets = state.serviceTickets.filter(t => t.id !== ticketId);

        // Add to pending tickets
        state.pendingTickets.push(pendingTicket);
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
              // Include full checkout services for editing in checkout panel
              checkoutServices: (ticket as any).checkoutServices,
              clientId: (ticket as any).clientId,
            });
            break;
        }
      })
      // Update checkout ticket - update in ALL ticket arrays (waitlist, service, pending)
      .addCase(updateCheckoutTicket.fulfilled, (state, action) => {
        const { ticketId, updates, statusChanged, previousStatus, newStatus } = action.payload;

        // If status changed from 'waiting' to 'in-service', move ticket from waitlist to serviceTickets
        if (statusChanged && previousStatus === 'waiting' && newStatus === 'in-service') {
          const waitlistIndex = state.waitlist.findIndex(t => t.id === ticketId);
          if (waitlistIndex !== -1) {
            const existingTicket = state.waitlist[waitlistIndex];
            // Create status history entry
            const statusEntry = createStatusHistoryEntry('waiting', 'in-service');
            const updatedTicket: UITicket = {
              ...existingTicket,
              ...updates,
              status: 'in-service',
              serviceStatus: 'in_progress',
              statusHistory: [...(existingTicket.statusHistory || []), statusEntry],
            };
            // Remove from waitlist
            state.waitlist.splice(waitlistIndex, 1);
            // Add to serviceTickets
            state.serviceTickets.push(updatedTicket);
            console.log('Moved ticket from waitlist to serviceTickets:', ticketId);
            return;
          }
        }

        // If status changed from 'in-service' to 'completed', move ticket from serviceTickets to pendingTickets
        if (statusChanged && previousStatus === 'in-service' && newStatus === 'completed') {
          const serviceIndex = state.serviceTickets.findIndex(t => t.id === ticketId);
          if (serviceIndex !== -1) {
            const existingTicket = state.serviceTickets[serviceIndex];
            // Create status history entry
            const statusEntry = createStatusHistoryEntry('in-service', 'completed');
            const pendingTicket: PendingTicket = {
              id: existingTicket.id,
              number: existingTicket.number,
              clientName: existingTicket.clientName,
              clientType: existingTicket.clientType,
              service: existingTicket.service,
              additionalServices: ((existingTicket as any).checkoutServices?.length || 1) - 1,
              subtotal: (existingTicket as any).subtotal || 0,
              tax: (existingTicket as any).tax || 0,
              tip: 0,
              paymentType: 'card',
              time: existingTicket.time,
              duration: existingTicket.duration,
              notes: existingTicket.notes,
              technician: existingTicket.technician,
              techColor: existingTicket.techColor,
              techId: existingTicket.techId,
              assignedStaff: existingTicket.assignedStaff,
              lastVisitDate: existingTicket.lastVisitDate,
              status: 'completed',
              completedAt: new Date().toISOString(),
              checkoutServices: (existingTicket as any).checkoutServices,
              clientId: (existingTicket as any).clientId,
              statusHistory: [...(existingTicket.statusHistory || []), statusEntry],
            };
            // Remove from serviceTickets
            state.serviceTickets.splice(serviceIndex, 1);
            // Add to pendingTickets
            state.pendingTickets.push(pendingTicket);
            console.log('Moved ticket from serviceTickets to pendingTickets:', ticketId);
            return;
          }
        }

        // If status changed from 'in-service' to 'waiting', move ticket from serviceTickets to waitlist
        if (statusChanged && previousStatus === 'in-service' && newStatus === 'waiting') {
          const serviceIndex = state.serviceTickets.findIndex(t => t.id === ticketId);
          if (serviceIndex !== -1) {
            const existingTicket = state.serviceTickets[serviceIndex];
            // Create status history entry
            const statusEntry = createStatusHistoryEntry('in-service', 'waiting');
            const updatedTicket: UITicket = {
              ...existingTicket,
              ...updates,
              status: 'waiting',
              serviceStatus: 'not_started',
              statusHistory: [...(existingTicket.statusHistory || []), statusEntry],
            };
            // Remove from serviceTickets
            state.serviceTickets.splice(serviceIndex, 1);
            // Add to waitlist
            state.waitlist.push(updatedTicket);
            console.log('Moved ticket from serviceTickets to waitlist:', ticketId);
            return;
          }
        }

        // No status change - just update ticket in its current array
        // Try to find and update in serviceTickets
        const serviceIndex = state.serviceTickets.findIndex(t => t.id === ticketId);
        if (serviceIndex !== -1) {
          state.serviceTickets[serviceIndex] = {
            ...state.serviceTickets[serviceIndex],
            ...updates,
          };
          console.log('✅ Updated ticket in serviceTickets:', ticketId);
          return;
        }

        // Try to find and update in waitlist
        const waitlistIndex = state.waitlist.findIndex(t => t.id === ticketId);
        if (waitlistIndex !== -1) {
          state.waitlist[waitlistIndex] = {
            ...state.waitlist[waitlistIndex],
            ...updates,
          };
          console.log('✅ Updated ticket in waitlist:', ticketId);
          return;
        }

        // Try to find and update in pendingTickets
        const pendingIndex = state.pendingTickets.findIndex(t => t.id === ticketId);
        if (pendingIndex !== -1) {
          // Type assertion needed because updates may include UITicket fields
          // that don't exist on PendingTicket (safe since we're just merging)
          state.pendingTickets[pendingIndex] = {
            ...state.pendingTickets[pendingIndex],
            ...updates as Partial<PendingTicket>,
          };
          console.log('✅ Updated ticket in pendingTickets:', ticketId);
          return;
        }

        console.warn('⚠️ Ticket not found in any array for update:', ticketId);
      });
  },
});

export const {
  clearError,
  ticketUpdated,
  setPendingTickets,
  reorderWaitlist,
  setWaitlistOrder,
  applyPriceResolutions,
} = uiTicketsSlice.actions;

// Selectors
export const selectWaitlist = (state: RootState) => state.uiTickets.waitlist;
export const selectServiceTickets = (state: RootState) => state.uiTickets.serviceTickets;
export const selectCompletedTickets = (state: RootState) => state.uiTickets.completedTickets;
export const selectPendingTickets = (state: RootState) => state.uiTickets.pendingTickets;
export const selectTicketsLoading = (state: RootState) => state.uiTickets.loading;
export const selectTicketsError = (state: RootState) => state.uiTickets.error;

// ============================================================================
// PRICE CHANGE SELECTORS
// ============================================================================
// Selectors for identifying tickets with price variances for UI display.
// Used by PriceChangeWarningBanner, PriceResolutionModal, and checkout flow.

/**
 * Service price change information for UI display.
 */
export interface ServicePriceChange {
  serviceId: string;
  serviceName: string;
  bookedPrice: number;
  catalogPrice: number;
  variance: number;
  variancePercent: number;
}

/**
 * Select all pending tickets that have at least one service with price variance.
 * A service has variance when bookedPrice differs from catalogPriceAtCheckout.
 */
export const selectTicketsWithPriceChanges = createSelector(
  [selectPendingTickets],
  (pendingTickets: PendingTicket[]): PendingTicket[] => {
    return pendingTickets.filter((ticket: PendingTicket) => {
      if (!ticket.checkoutServices || ticket.checkoutServices.length === 0) {
        return false;
      }
      return ticket.checkoutServices.some((service: CheckoutTicketService) => {
        // Skip services without price data
        if (service.bookedPrice === undefined || service.catalogPriceAtCheckout === undefined) {
          return false;
        }
        // Check for variance (using tolerance for floating-point comparison)
        const variance = Math.abs(service.catalogPriceAtCheckout - service.bookedPrice);
        return variance >= 0.01; // $0.01 tolerance
      });
    });
  }
);

/**
 * Select price changes for all services in a specific ticket.
 * Returns array of service price change details for UI display.
 *
 * @param ticketId - The ID of the ticket to check
 * @returns Array of ServicePriceChange objects for services with variance
 *
 * @example
 * const priceChanges = useAppSelector(selectServicePriceChanges('ticket-123'));
 * // Returns: [{ serviceId: '...', serviceName: 'Haircut', bookedPrice: 50, catalogPrice: 55, variance: 5, variancePercent: 10 }]
 */
export const selectServicePriceChanges = (ticketId: string) =>
  createSelector(
    [selectPendingTickets],
    (pendingTickets: PendingTicket[]): ServicePriceChange[] => {
      const ticket = pendingTickets.find((t: PendingTicket) => t.id === ticketId);
      if (!ticket || !ticket.checkoutServices) {
        return [];
      }

      return ticket.checkoutServices
        .filter((service: CheckoutTicketService) => {
          // Only include services with price data where variance exists
          if (service.bookedPrice === undefined || service.catalogPriceAtCheckout === undefined) {
            return false;
          }
          const variance = Math.abs(service.catalogPriceAtCheckout - service.bookedPrice);
          return variance >= 0.01; // $0.01 tolerance
        })
        .map((service: CheckoutTicketService) => {
          const bookedPrice = service.bookedPrice!;
          const catalogPrice = service.catalogPriceAtCheckout!;
          const variance = catalogPrice - bookedPrice;
          const variancePercent = bookedPrice > 0 ? (variance / bookedPrice) * 100 : 0;

          return {
            serviceId: service.id,
            serviceName: service.serviceName,
            bookedPrice,
            catalogPrice,
            variance,
            variancePercent: Math.round(variancePercent * 100) / 100, // Round to 2 decimal places
          };
        });
    }
  );

/**
 * Check if a ticket has any price change warnings that should be displayed.
 * Returns true if the ticket has services with unresolved price changes.
 *
 * @param ticketId - The ID of the ticket to check
 * @returns Boolean indicating if warning should be shown
 *
 * @example
 * const showWarning = useAppSelector(selectHasPriceChangeWarning('ticket-123'));
 */
export const selectHasPriceChangeWarning = (ticketId: string) =>
  createSelector(
    [selectPendingTickets],
    (pendingTickets: PendingTicket[]): boolean => {
      const ticket = pendingTickets.find((t: PendingTicket) => t.id === ticketId);
      if (!ticket || !ticket.checkoutServices) {
        return false;
      }

      // Warning if any service has:
      // 1. Price variance (bookedPrice differs from catalogPriceAtCheckout)
      // 2. No priceDecision yet (unresolved)
      return ticket.checkoutServices.some((service: CheckoutTicketService) => {
        if (service.bookedPrice === undefined || service.catalogPriceAtCheckout === undefined) {
          return false;
        }
        const variance = Math.abs(service.catalogPriceAtCheckout - service.bookedPrice);
        const hasVariance = variance >= 0.01;
        const isUnresolved = service.priceDecision === undefined;
        return hasVariance && isUnresolved;
      });
    }
  );

/**
 * Select services that have price changes but no priceDecision yet.
 * These are services that require staff input before checkout can proceed.
 * Returns the full service objects for use in PriceResolutionModal.
 *
 * @param ticketId - The ID of the ticket to check
 * @returns Array of CheckoutTicketService objects that need resolution
 *
 * @example
 * const unresolvedServices = useAppSelector(selectUnresolvedPriceChanges('ticket-123'));
 * // Returns services where priceDecision is undefined but price variance exists
 */
export const selectUnresolvedPriceChanges = (ticketId: string) =>
  createSelector(
    [selectPendingTickets],
    (pendingTickets: PendingTicket[]): CheckoutTicketService[] => {
      const ticket = pendingTickets.find((t: PendingTicket) => t.id === ticketId);
      if (!ticket || !ticket.checkoutServices) {
        return [];
      }

      return ticket.checkoutServices.filter((service: CheckoutTicketService) => {
        // Only services with price data
        if (service.bookedPrice === undefined || service.catalogPriceAtCheckout === undefined) {
          return false;
        }
        // Only services with variance
        const variance = Math.abs(service.catalogPriceAtCheckout - service.bookedPrice);
        if (variance < 0.01) {
          return false;
        }
        // Only unresolved services (no decision made yet)
        return service.priceDecision === undefined;
      });
    }
  );

// ============================================================================
// PRICE VARIANCE REPORTING SELECTORS
// ============================================================================
// Selectors for reporting on price variance across completed tickets.
// Used by PriceVarianceSummary component and admin reports.

/**
 * Price variance report result for completed tickets.
 */
export interface PriceVarianceReportResult {
  /** Tickets that had price variance */
  tickets: PendingTicket[];
  /** Total variance amount across all services (can be negative if prices dropped) */
  totalVarianceAmount: number;
  /** Count of price overrides (non-booked_honored decisions) */
  totalOverridesCount: number;
  /** Count of tickets with at least one service with variance */
  ticketCount: number;
  /** Breakdown by decision type */
  decisionBreakdown: Record<PriceDecision, number>;
}

/**
 * Date range filter options for price variance reports.
 */
export interface PriceVarianceDateFilter {
  /** Start date (inclusive) - ISO string or Date */
  startDate?: string | Date;
  /** End date (inclusive) - ISO string or Date */
  endDate?: string | Date;
}

/**
 * Select completed (pending payment) tickets that had any price variance.
 * Returns tickets where at least one service has priceVariance !== 0.
 * Includes computed totals for reporting.
 *
 * Note: This operates on pendingTickets which have status='completed' (awaiting payment).
 * These tickets have full checkoutServices with price tracking data.
 *
 * @param dateFilter - Optional date range to filter results
 * @returns PriceVarianceReportResult with tickets and aggregated data
 *
 * @example
 * // Get all tickets with price variance
 * const report = useAppSelector(selectCompletedTicketsWithPriceVariance());
 *
 * @example
 * // Get tickets with variance for a date range
 * const report = useAppSelector(selectCompletedTicketsWithPriceVariance({
 *   startDate: '2026-01-01',
 *   endDate: '2026-01-31'
 * }));
 */
export const selectCompletedTicketsWithPriceVariance = (dateFilter?: PriceVarianceDateFilter) =>
  createSelector(
    [selectPendingTickets],
    (pendingTickets: PendingTicket[]): PriceVarianceReportResult => {
      // Filter by date range if provided
      let filteredTickets = pendingTickets;

      if (dateFilter?.startDate || dateFilter?.endDate) {
        const startDate = dateFilter.startDate
          ? new Date(dateFilter.startDate)
          : new Date(0); // Beginning of time
        const endDate = dateFilter.endDate
          ? new Date(dateFilter.endDate)
          : new Date(); // Now

        // Set end date to end of day for inclusive comparison
        endDate.setHours(23, 59, 59, 999);

        filteredTickets = pendingTickets.filter((ticket: PendingTicket) => {
          const ticketDate = ticket.completedAt
            ? new Date(ticket.completedAt)
            : new Date(ticket.time || 0);
          return ticketDate >= startDate && ticketDate <= endDate;
        });
      }

      // Find tickets with any service having price variance
      const ticketsWithVariance = filteredTickets.filter((ticket: PendingTicket) => {
        if (!ticket.checkoutServices || ticket.checkoutServices.length === 0) {
          return false;
        }
        return ticket.checkoutServices.some((service: CheckoutTicketService) => {
          // Check for non-zero variance (with tolerance for floating-point)
          return service.priceVariance !== undefined && Math.abs(service.priceVariance) >= 0.01;
        });
      });

      // Calculate totals
      let totalVarianceAmount = 0;
      let totalOverridesCount = 0;
      const decisionBreakdown: Record<string, number> = {
        booked_honored: 0,
        catalog_applied: 0,
        lower_applied: 0,
        manual_override: 0,
        deposit_locked: 0,
        walk_in_current: 0,
      };

      ticketsWithVariance.forEach((ticket: PendingTicket) => {
        if (!ticket.checkoutServices) return;

        ticket.checkoutServices.forEach((service: CheckoutTicketService) => {
          // Accumulate variance
          if (service.priceVariance !== undefined && Math.abs(service.priceVariance) >= 0.01) {
            totalVarianceAmount += service.priceVariance;
          }

          // Count price decisions
          if (service.priceDecision) {
            decisionBreakdown[service.priceDecision] =
              (decisionBreakdown[service.priceDecision] || 0) + 1;

            // Count overrides (any decision other than booked_honored)
            if (service.priceDecision !== 'booked_honored') {
              totalOverridesCount++;
            }
          }
        });
      });

      return {
        tickets: ticketsWithVariance,
        totalVarianceAmount: Math.round(totalVarianceAmount * 100) / 100, // Round to cents
        totalOverridesCount,
        ticketCount: ticketsWithVariance.length,
        decisionBreakdown: decisionBreakdown as Record<PriceDecision, number>,
      };
    }
  );

// ============================================================================
// CONFLICT DETECTION HELPERS
// ============================================================================

/**
 * Staff conflict detection result
 */
export interface StaffConflictResult {
  hasConflict: boolean;
  conflictingTicket?: UITicket;
  clientName?: string;
  serviceName?: string;
}

/**
 * Check if a staff member has an active in-service ticket
 * Checks all three ways staff can be associated with a ticket:
 * 1. techId - direct technician assignment
 * 2. staffId - staff ID field (legacy)
 * 3. assignedTo.id - structured assignment object
 *
 * @param staffId - The staff member ID to check
 * @param serviceTickets - Array of current in-service tickets
 * @returns StaffConflictResult with conflict details if found
 */
export function checkStaffConflict(
  staffId: string,
  serviceTickets: UITicket[]
): StaffConflictResult {
  // Find ticket where staff is assigned (check all three ID fields)
  const conflictingTicket = serviceTickets.find(ticket =>
    String(ticket.techId) === String(staffId) ||
    String((ticket as any).staffId) === String(staffId) ||
    String(ticket.assignedTo?.id) === String(staffId)
  );

  if (conflictingTicket) {
    return {
      hasConflict: true,
      conflictingTicket,
      clientName: conflictingTicket.clientName,
      serviceName: conflictingTicket.service,
    };
  }

  return { hasConflict: false };
}

export default uiTicketsSlice.reducer;
