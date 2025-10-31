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
  | 'in-service'
  | 'pending'
  | 'completed'
  | 'voided'
  | 'refunded';

export type PaymentMethod = 
  | 'card'
  | 'cash'
  | 'digital-wallet'
  | 'gift-card'
  | 'account-credit'
  | 'split';

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

