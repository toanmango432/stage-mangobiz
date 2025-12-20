import { TicketStatus, SyncStatus, ServiceStatus, ServiceStatusChange } from './common';

// ============================================
// SERVICE-LEVEL INTERFACES
// ============================================

/**
 * Discount applied to an individual service.
 */
export interface ServiceDiscount {
  type: 'percent' | 'fixed';
  value: number;
  reason: string;
  appliedBy: string;
  appliedAt: string;            // ISO 8601 string
  toFixed?: (decimals: number) => string;  // Method for number formatting
}

/**
 * Individual service within a ticket.
 * Enhanced with status tracking and timer support per PRD F-003.
 */
export interface TicketService {
  // Core fields
  id?: string;                  // Service ID on ticket (for UI)
  serviceId: string;
  serviceName?: string;
  name?: string;                // Alias for serviceName
  staffId: string;
  staffName: string;
  price: number;
  duration: number;             // Expected duration in minutes
  commission: number;
  startTime: string;            // ISO 8601 string (scheduled start)
  endTime?: string;             // ISO 8601 string (scheduled end)

  // Status tracking (per DATA_STORAGE_STRATEGY.md Section 2.2)
  status: ServiceStatus;
  statusHistory: ServiceStatusChange[];

  // Timer tracking
  actualStartTime?: string;     // ISO 8601 - When service actually started
  pausedAt?: string;            // ISO 8601 - When paused (undefined if not paused)
  totalPausedDuration: number;  // Total paused time in milliseconds
  actualDuration?: number;      // Actual time taken in minutes (set on completion)

  // Service-level customization
  notes?: string;
  discount?: ServiceDiscount;

  // Assistant support (for tip splitting)
  assistantStaffId?: string;
  assistantStaffName?: string;
  assistantTipPercent?: number; // e.g., 20 means assistant gets 20% of service tip
}

export interface TicketProduct {
  id?: string;                  // Product ID on ticket (for UI)
  productId: string;
  productName?: string;
  name?: string;                // Alias for productName
  quantity: number;
  price: number;
  unitPrice?: number;           // Alias for price
  total: number;
}

export interface TicketClient {
  clientId: string;
  clientName: string;
  clientPhone: string;
  services?: string[];    // Optional: service IDs assigned to this client
}

// ============================================
// PAYMENT INTERFACES
// ============================================

/**
 * Tip allocation to individual staff members.
 * Per DATA_STORAGE_STRATEGY.md Section 5.2
 */
export interface TipAllocation {
  staffId: string;
  staffName: string;
  amount: number;
  percentage: number;           // Percentage of total tip (not "percent")
}

/**
 * Payment record for a ticket.
 * Enhanced with split payment, tip allocation, and offline support.
 */
export interface Payment {
  id: string;
  method: string;               // 'cash', 'credit-card', 'debit-card', etc.
  cardType?: string;            // 'visa', 'mastercard', 'amex', 'discover'
  cardLast4?: string;           // Last 4 digits of card (e.g., '1234')
  amount: number;               // Payment amount (excluding tip)
  tip: number;                  // Tip/gratuity amount
  total: number;                // Total (amount + tip)
  transactionId?: string;       // Authorization/transaction ID
  processedAt: string;          // ISO 8601 string - When payment was processed
  status?: 'approved' | 'declined' | 'pending' | 'failed';

  // Split payment tracking
  isSplitPayment?: boolean;
  splitIndex?: number;          // Which payment in the split (1, 2, 3...)
  splitTotal?: number;          // Total number of payments in split

  // Tip distribution (per DATA_STORAGE_STRATEGY.md Section 5.2)
  tipAllocations?: TipAllocation[];

  // Gift card specifics
  giftCardId?: string;
  giftCardCode?: string;
  giftCardBalanceAfter?: number;

  // Cash specifics
  amountTendered?: number;
  changeGiven?: number;

  // Refund tracking
  refundedAmount?: number;
  refundedAt?: string;          // ISO 8601 string
  refundedBy?: string;
  refundReason?: string;
  refundTransactionId?: string;

  // Void tracking
  voidedAt?: string;            // ISO 8601 string
  voidedBy?: string;
  voidReason?: string;

  // Offline support (per DATA_STORAGE_STRATEGY.md sync patterns)
  offlineQueued?: boolean;
  offlineQueuedAt?: string;     // ISO 8601 string
  syncedAt?: string;            // ISO 8601 string
}

// ============================================
// TICKET SOURCE & SERVICE CHARGE TYPES
// ============================================

/**
 * Source of ticket creation for analytics and workflow differentiation.
 */
export type TicketSource = 'pos' | 'calendar' | 'self-checkout' | 'quick-payment';

/**
 * Service charge applied to a ticket (e.g., credit card fee, late fee).
 * Per PRD F-005.
 */
export interface ServiceCharge {
  id: string;
  name: string;
  type: 'flat' | 'percent' | 'combined';
  flatAmount?: number;
  percentAmount?: number;
  scope: 'full' | 'services' | 'products';
  taxRate?: number;
  amount: number;               // Calculated amount
  removedByStaff?: boolean;
}

// ============================================
// TICKET INTERFACE
// ============================================

/**
 * Main ticket/transaction record.
 * Enhanced with draft support, source tracking, and service charges.
 */
export interface Ticket {
  id: string;
  number?: number;              // Ticket number (for display)
  salonId: string;
  appointmentId?: string;

  // Primary client (for backward compatibility and display)
  clientId: string;
  clientName: string;
  clientPhone: string;

  // Group Ticket Support
  isGroupTicket?: boolean;      // True if multiple clients on one ticket
  clients?: TicketClient[];     // All clients in the group (includes primary)

  // Ticket Merging Support
  isMergedTicket?: boolean;     // True if this ticket was created by merging others
  mergedFromTickets?: string[]; // Array of ticket IDs that were merged into this one
  originalTicketId?: string;    // If merged into another ticket, the target ticket ID
  mergedAt?: string;            // ISO 8601 string - When the merge happened
  mergedBy?: string;            // User ID who performed the merge

  services: TicketService[];
  products: TicketProduct[];
  status: TicketStatus;
  subtotal: number;
  discount: number;
  discountReason?: string;
  discountPercent?: number;     // Discount percentage (e.g., 10 for 10%)
  tax: number;
  taxRate?: number;             // Tax rate percentage (e.g., 9 for 9%)
  tip: number;
  total: number;
  payments: Payment[];
  createdAt: string;            // ISO 8601 string
  updatedAt?: string;           // ISO 8601 string (for sync)
  completedAt?: string;         // ISO 8601 string
  createdBy: string;
  lastModifiedBy: string;
  syncStatus: SyncStatus;

  // Draft support (per PRD F-009)
  isDraft?: boolean;
  draftExpiresAt?: string;      // ISO 8601 string
  lastAutoSaveAt?: string;      // ISO 8601 string

  // Source tracking
  source?: TicketSource;

  // Service charges (per PRD F-005)
  serviceCharges?: ServiceCharge[];
  serviceChargeTotal?: number;

  // Payment tracking
  paymentMethod?: 'cash' | 'card' | 'gift_card' | 'store_credit' | 'check' | 'other';
  
  // Staff assignment (primary staff for display)
  staffId?: string;
  staffName?: string;
  
  // Closed ticket tracking
  closedAt?: string;              // ISO 8601 string - when ticket was closed/paid
  closedBy?: string;              // User ID who closed the ticket
}

/**
 * Input for creating a new ticket.
 * Services should include status defaults.
 */
export interface CreateTicketInput {
  clientId: string;
  clientName: string;
  clientPhone: string;
  appointmentId?: string;
  services: CreateTicketServiceInput[];
  products?: TicketProduct[];
  source?: TicketSource;
}

/**
 * Input for adding a service to a ticket.
 * Provides defaults for status-related fields.
 */
export interface CreateTicketServiceInput {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  price: number;
  duration: number;
  commission: number;
  startTime: string;            // ISO 8601 string
  endTime?: string;             // ISO 8601 string
  // Optional overrides (defaults applied if not provided)
  status?: ServiceStatus;
  notes?: string;
  assistantStaffId?: string;
  assistantStaffName?: string;
  assistantTipPercent?: number;
}

/**
 * Default values for new TicketService.
 * Use when creating services from CreateTicketServiceInput.
 */
export function createDefaultTicketService(input: CreateTicketServiceInput): TicketService {
  return {
    ...input,
    status: input.status || 'not_started',
    statusHistory: [],
    totalPausedDuration: 0,
  };
}
