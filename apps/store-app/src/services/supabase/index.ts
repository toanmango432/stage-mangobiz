/**
 * Supabase Services - Main Export
 * Provides typed access to all Supabase tables and sync functionality
 */

// Client
export { supabase, supabaseConfig, checkConnection, getStoreChannel } from './client';

// Auth Service
export {
  authService,
  AuthError,
  type StoreSession,
  type MemberSession,
  type AuthSession,
  type LicenseInfo,
} from './authService';

// Store Service (settings management)
export { storeService } from './storeService';

// Types
export type {
  Database,
  Json,
  ClientRow,
  ClientInsert,
  ClientUpdate,
  StaffRow,
  StaffInsert,
  StaffUpdate,
  ServiceRow,
  ServiceInsert,
  ServiceUpdate,
  AppointmentRow,
  AppointmentInsert,
  AppointmentUpdate,
  TicketRow,
  TicketInsert,
  TicketUpdate,
  TransactionRow,
  TransactionInsert,
  TransactionUpdate,
  // Auth types
  StoreRow,
  MemberRow,
  TenantRow,
  LicenseRow,
  MemberRole,
  LicenseTier,
} from './types';

// Table Operations
export { clientsTable } from './tables/clientsTable';
export { staffTable } from './tables/staffTable';
export { servicesTable } from './tables/servicesTable';
export { appointmentsTable } from './tables/appointmentsTable';
export { ticketsTable } from './tables/ticketsTable';
export { transactionsTable } from './tables/transactionsTable';

// Sync Service
export {
  supabaseSyncService,
  useSupabaseSync,
  useSupabaseSyncWithStore,
  type SyncableEntity,
  type SyncStatus,
  type SyncState,
  type SyncOperation,
  type SyncResult,
} from './sync';

// Type Adapters
export {
  // Appointment
  toAppointment,
  toAppointments,
  toAppointmentInsert,
  toAppointmentUpdate,
  fromAppointmentCreateInput,
  // Client
  toClient,
  toClients,
  toClientInsert,
  toClientUpdate,
  // Staff
  toStaff,
  toStaffList,
  toStaffInsert,
  toStaffUpdate,
  // Service
  toService,
  toServices,
  toServiceInsert,
  toServiceUpdate,
  // Ticket
  toTicket,
  toTickets,
  toTicketInsert,
  toTicketUpdate,
  // Transaction
  toTransaction,
  toTransactions,
  toTransactionInsert,
  toTransactionUpdate,
} from './adapters';

// Pagination
export {
  getClientsPaginated,
  getAppointmentsPaginated,
  getTransactionsPaginated,
  getTicketsPaginated,
  searchClientsPaginated,
  encodeCursor,
  decodeCursor,
  getPaginationQueryKey,
  type PaginationParams,
  type PaginatedResult,
} from './pagination';

/**
 * All table operations in one object for convenience
 */
export const supabaseTables = {
  clients: () => import('./tables/clientsTable').then(m => m.clientsTable),
  staff: () => import('./tables/staffTable').then(m => m.staffTable),
  services: () => import('./tables/servicesTable').then(m => m.servicesTable),
  appointments: () => import('./tables/appointmentsTable').then(m => m.appointmentsTable),
  tickets: () => import('./tables/ticketsTable').then(m => m.ticketsTable),
  transactions: () => import('./tables/transactionsTable').then(m => m.transactionsTable),
};
