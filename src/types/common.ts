// Common types and enums used across the application

export type SyncStatus = 'local' | 'synced' | 'pending' | 'conflict' | 'error';

export type AppointmentStatus = 
  | 'scheduled'
  | 'checked-in' 
  | 'waiting'
  | 'in-service'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export type BookingSource = 
  | 'phone'
  | 'walk-in'
  | 'online'
  | 'mango-store'
  | 'client-app'
  | 'admin-portal';

export type TicketStatus =
  // Sales Module Statuses (payment captured):
  | 'paid'              // Full payment received - appears in Sales
  | 'partial-payment'   // Some payment received, balance remains - appears in Sales
  | 'refunded'          // Full refund issued - appears in Sales
  | 'partially-refunded' // Partial refund issued - appears in Sales
  | 'voided'            // Transaction cancelled - appears in Sales
  // Non-Sales Statuses (no payment captured):
  | 'unpaid'            // Service done, payment outstanding - does NOT appear in Sales
  | 'pending'           // Transaction initiated, awaiting payment - does NOT appear in Sales
  | 'failed'            // Payment declined/error - does NOT appear in Sales
  | 'completed';        // Legacy status (maps to 'paid')

export type PaymentMethod =
  | 'cash'
  | 'credit-card'
  | 'debit-card'
  | 'card'              // Generic card (legacy)
  | 'venmo'
  | 'digital-wallet'
  | 'gift-card'
  | 'account-credit'
  | 'split';

export type CardType =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'other';

export type TransactionStatus = 
  | 'completed'
  | 'pending'
  | 'failed'
  | 'voided'
  | 'refunded';

export type StaffStatus = 
  | 'available'
  | 'busy'
  | 'on-break'
  | 'clocked-out'
  | 'off-today';

export type SyncOperationType = 
  | 'create'
  | 'update'
  | 'delete';

export type EntityType = 
  | 'appointment'
  | 'ticket'
  | 'transaction'
  | 'client'
  | 'staff'
  | 'service';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}

export interface AuditInfo {
  createdBy: string;
  lastModifiedBy: string;
  createdAt: Date;
  updatedAt: Date;
}
