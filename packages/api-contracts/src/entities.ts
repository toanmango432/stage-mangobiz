/**
 * Entity API Contracts
 *
 * Common request/response types for entity CRUD operations.
 * These types wrap the domain entities with API-specific metadata.
 */

import { z } from 'zod';

// =============================================================================
// Generic Response Wrappers
// =============================================================================

/**
 * Pagination parameters for list requests
 */
export interface PaginationParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination metadata in responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Generic list response
 */
export interface ListResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  timestamp: string;
}

/**
 * Generic single item response
 */
export interface ItemResponse<T> {
  data: T;
  timestamp: string;
}

/**
 * Generic create response
 */
export interface CreateResponse<T> {
  data: T;
  id: string;
  timestamp: string;
}

/**
 * Generic update response
 */
export interface UpdateResponse<T> {
  data: T;
  timestamp: string;
}

/**
 * Generic delete response
 */
export interface DeleteResponse {
  success: boolean;
  id: string;
  timestamp: string;
}

// =============================================================================
// Client Entity Contracts
// =============================================================================

/**
 * Create client request
 */
export interface CreateClientRequest {
  storeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  preferences?: Record<string, unknown>;
}

/**
 * Update client request
 */
export interface UpdateClientRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  notes?: string;
  tags?: string[];
  preferences?: Record<string, unknown>;
  isVip?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
}

/**
 * Search clients request
 */
export interface SearchClientsRequest {
  storeId: string;
  query: string;
  limit?: number;
  includeBlocked?: boolean;
}

// =============================================================================
// Staff Entity Contracts
// =============================================================================

/**
 * Create staff request
 */
export interface CreateStaffRequest {
  storeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  pin?: string;
  services?: string[];
  schedule?: Record<string, unknown>;
}

/**
 * Update staff request
 */
export interface UpdateStaffRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  pin?: string;
  services?: string[];
  schedule?: Record<string, unknown>;
  isActive?: boolean;
}

/**
 * Clock in/out request
 */
export interface ClockRequest {
  staffId: string;
  storeId: string;
  timestamp?: string;
  notes?: string;
}

/**
 * Clock in/out response
 */
export interface ClockResponse {
  staffId: string;
  action: 'clock_in' | 'clock_out';
  timestamp: string;
  timesheetId?: string;
}

// =============================================================================
// Appointment Entity Contracts
// =============================================================================

/**
 * Create appointment request
 */
export interface CreateAppointmentRequest {
  storeId: string;
  clientId?: string;
  staffId?: string;
  serviceIds: string[];
  startTime: string;
  endTime?: string;
  notes?: string;
  source?: string;
}

/**
 * Update appointment request
 */
export interface UpdateAppointmentRequest {
  clientId?: string;
  staffId?: string;
  serviceIds?: string[];
  startTime?: string;
  endTime?: string;
  notes?: string;
  status?: string;
}

/**
 * Check-in appointment request
 */
export interface CheckInAppointmentRequest {
  appointmentId: string;
  timestamp?: string;
}

/**
 * Check-in appointment response
 */
export interface CheckInAppointmentResponse {
  appointmentId: string;
  ticketId?: string;
  checkedInAt: string;
}

// =============================================================================
// Ticket Entity Contracts
// =============================================================================

/**
 * Create ticket request
 */
export interface CreateTicketRequest {
  storeId: string;
  clientId?: string;
  appointmentId?: string;
  serviceItems: TicketServiceItem[];
  notes?: string;
}

/**
 * Ticket service item
 */
export interface TicketServiceItem {
  serviceId: string;
  staffId?: string;
  quantity?: number;
  price?: number;
  discount?: number;
  notes?: string;
}

/**
 * Update ticket request
 */
export interface UpdateTicketRequest {
  serviceItems?: TicketServiceItem[];
  notes?: string;
  discount?: number;
  tip?: number;
}

/**
 * Complete ticket request
 */
export interface CompleteTicketRequest {
  ticketId: string;
  paymentMethod?: string;
  tip?: number;
}

/**
 * Complete ticket response
 */
export interface CompleteTicketResponse {
  ticketId: string;
  transactionId: string;
  total: number;
  completedAt: string;
}

// =============================================================================
// Transaction Entity Contracts
// =============================================================================

/**
 * Create transaction request
 */
export interface CreateTransactionRequest {
  storeId: string;
  ticketId: string;
  amount: number;
  paymentMethod: string;
  tip?: number;
  notes?: string;
}

/**
 * Void transaction request
 */
export interface VoidTransactionRequest {
  transactionId: string;
  reason: string;
}

/**
 * Refund transaction request
 */
export interface RefundTransactionRequest {
  transactionId: string;
  amount: number;
  reason: string;
}

/**
 * Transaction result response
 */
export interface TransactionResultResponse {
  transactionId: string;
  status: 'completed' | 'voided' | 'refunded' | 'failed';
  amount: number;
  timestamp: string;
  receiptUrl?: string;
}

// =============================================================================
// Zod Schemas
// =============================================================================

export const PaginationParamsSchema = z.object({
  page: z.number().positive().optional(),
  limit: z.number().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const CreateClientRequestSchema = z.object({
  storeId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  preferences: z.record(z.unknown()).optional(),
});

export const CreateAppointmentRequestSchema = z.object({
  storeId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  serviceIds: z.array(z.string().uuid()),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

export const CreateTicketRequestSchema = z.object({
  storeId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  serviceItems: z.array(z.object({
    serviceId: z.string().uuid(),
    staffId: z.string().uuid().optional(),
    quantity: z.number().positive().optional(),
    price: z.number().nonnegative().optional(),
    discount: z.number().nonnegative().optional(),
    notes: z.string().optional(),
  })),
  notes: z.string().optional(),
});
