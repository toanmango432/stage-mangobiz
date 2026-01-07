/**
 * API Endpoints
 *
 * Type-safe endpoint definitions for Supabase Edge Functions.
 * Aligns with the deployed Edge Functions at /functions/v1/{entity}
 *
 * IMPORTANT: These endpoints are designed to work with Supabase Edge Functions.
 * The baseUrl should be set to: https://<project-ref>.supabase.co/functions/v1
 *
 * @example
 * ```typescript
 * import { endpoints } from '@mango/api-client';
 *
 * const url = endpoints.clients.list('store-123');
 * // Returns: '/clients?store_id=store-123'
 * ```
 */

// =============================================================================
// Helper Functions
// =============================================================================

const withParams = (
  path: string,
  params: Record<string, string | number | boolean | undefined>
): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
};

// =============================================================================
// Endpoint Definitions
// =============================================================================

export const endpoints = {
  // ===========================================================================
  // Authentication Endpoints
  // ===========================================================================
  auth: {
    /** POST - Store login with credentials */
    storeLogin: '/auth/store-login',
    /** POST - Member login with PIN */
    memberPin: '/auth/member-pin',
    /** POST - Member login with password */
    memberPassword: '/auth/member-password',
    /** POST - Member login with card (NFC/magnetic) */
    memberCard: '/auth/member-card',
    /** POST - Validate current session */
    validate: '/auth/validate',
    /** POST - Refresh access token */
    refresh: '/auth/refresh',
    /** POST - Logout and invalidate session */
    logout: '/auth/logout',
  },

  // ===========================================================================
  // Client Endpoints
  // Matches: supabase/functions/clients/index.ts
  // ===========================================================================
  clients: {
    /** GET - List all clients for a store */
    list: (storeId: string, options?: { limit?: number; offset?: number; updatedSince?: string }) =>
      withParams('/clients', {
        store_id: storeId,
        limit: options?.limit,
        offset: options?.offset,
        updated_since: options?.updatedSince,
      }),
    /** GET - Get a single client by ID */
    get: (clientId: string) => `/clients/${clientId}`,
    /** POST - Create a new client */
    create: '/clients',
    /** PUT - Update a client */
    update: (clientId: string) => `/clients/${clientId}`,
    /** DELETE - Delete a client */
    delete: (clientId: string) => `/clients/${clientId}`,
    /** GET - Search clients */
    search: (storeId: string, query: string, limit?: number) =>
      withParams('/clients/search', { store_id: storeId, q: query, limit }),
    /** GET - Get VIP clients */
    vip: (storeId: string) => withParams('/clients/vip', { store_id: storeId }),
  },

  // ===========================================================================
  // Staff Endpoints
  // Matches: supabase/functions/staff/index.ts
  // ===========================================================================
  staff: {
    /** GET - List all staff for a store */
    list: (storeId: string, options?: { limit?: number; offset?: number; updatedSince?: string }) =>
      withParams('/staff', {
        store_id: storeId,
        limit: options?.limit,
        offset: options?.offset,
        updated_since: options?.updatedSince,
      }),
    /** GET - Get a single staff member */
    get: (staffId: string) => `/staff/${staffId}`,
    /** POST - Create a new staff member */
    create: '/staff',
    /** PUT - Update a staff member */
    update: (staffId: string) => `/staff/${staffId}`,
    /** DELETE - Delete a staff member */
    delete: (staffId: string) => `/staff/${staffId}`,
    /** GET - Get active staff for a store */
    active: (storeId: string) => withParams('/staff/active', { store_id: storeId }),
    /** POST - Clock in a staff member */
    clockIn: (staffId: string) => `/staff/${staffId}/clock-in`,
    /** POST - Clock out a staff member */
    clockOut: (staffId: string) => `/staff/${staffId}/clock-out`,
  },

  // ===========================================================================
  // Service Endpoints
  // Matches: supabase/functions/services/index.ts
  // ===========================================================================
  services: {
    /** GET - List all services for a store */
    list: (storeId: string, options?: { limit?: number; offset?: number; updatedSince?: string }) =>
      withParams('/services', {
        store_id: storeId,
        limit: options?.limit,
        offset: options?.offset,
        updated_since: options?.updatedSince,
      }),
    /** GET - Get a single service */
    get: (serviceId: string) => `/services/${serviceId}`,
    /** POST - Create a new service */
    create: '/services',
    /** PUT - Update a service */
    update: (serviceId: string) => `/services/${serviceId}`,
    /** DELETE - Delete a service */
    delete: (serviceId: string) => `/services/${serviceId}`,
    /** GET - Get active services for a store */
    active: (storeId: string) => withParams('/services/active', { store_id: storeId }),
    /** GET - Get services by category */
    byCategory: (storeId: string, categoryId: string) =>
      withParams('/services', { store_id: storeId, category_id: categoryId }),
  },

  // ===========================================================================
  // Appointment Endpoints
  // Matches: supabase/functions/appointments/index.ts
  // ===========================================================================
  appointments: {
    /** GET - List appointments for a store on a specific date */
    listByDate: (storeId: string, date: string, options?: { limit?: number; offset?: number }) =>
      withParams('/appointments', {
        store_id: storeId,
        date,
        limit: options?.limit,
        offset: options?.offset,
      }),
    /** GET - Get appointments updated since a timestamp */
    updatedSince: (storeId: string, since: string) =>
      withParams('/appointments', { store_id: storeId, updated_since: since }),
    /** GET - Get a single appointment */
    get: (appointmentId: string) => `/appointments/${appointmentId}`,
    /** POST - Create a new appointment */
    create: '/appointments',
    /** PUT - Update an appointment */
    update: (appointmentId: string) => `/appointments/${appointmentId}`,
    /** DELETE - Delete an appointment */
    delete: (appointmentId: string) => `/appointments/${appointmentId}`,
    /** POST - Check in an appointment */
    checkIn: (appointmentId: string) => `/appointments/${appointmentId}/check-in`,
    /** POST - Complete an appointment */
    complete: (appointmentId: string) => `/appointments/${appointmentId}/complete`,
    /** POST - Cancel an appointment */
    cancel: (appointmentId: string) => `/appointments/${appointmentId}/cancel`,
    /** GET - Get upcoming appointments for a client */
    upcomingByClient: (storeId: string, clientId: string) =>
      withParams('/appointments', { store_id: storeId, client_id: clientId, upcoming: true }),
  },

  // ===========================================================================
  // Ticket Endpoints
  // Matches: supabase/functions/tickets/index.ts
  // ===========================================================================
  tickets: {
    /** GET - List tickets for a store on a specific date */
    listByDate: (storeId: string, date: string, options?: { limit?: number; offset?: number }) =>
      withParams('/tickets', {
        store_id: storeId,
        date,
        limit: options?.limit,
        offset: options?.offset,
      }),
    /** GET - Get tickets updated since a timestamp */
    updatedSince: (storeId: string, since: string) =>
      withParams('/tickets', { store_id: storeId, updated_since: since }),
    /** GET - Get a single ticket */
    get: (ticketId: string) => `/tickets/${ticketId}`,
    /** POST - Create a new ticket */
    create: '/tickets',
    /** PUT - Update a ticket */
    update: (ticketId: string) => `/tickets/${ticketId}`,
    /** DELETE - Delete a ticket */
    delete: (ticketId: string) => `/tickets/${ticketId}`,
    /** GET - Get open tickets for a store */
    open: (storeId: string) => withParams('/tickets', { store_id: storeId, status: 'open' }),
    /** GET - Get tickets by status */
    byStatus: (storeId: string, status: string) =>
      withParams('/tickets', { store_id: storeId, status }),
    /** POST - Complete a ticket */
    complete: (ticketId: string) => `/tickets/${ticketId}/complete`,
    /** POST - Void a ticket */
    void: (ticketId: string) => `/tickets/${ticketId}/void`,
  },

  // ===========================================================================
  // Transaction Endpoints
  // Matches: supabase/functions/transactions/index.ts
  // ===========================================================================
  transactions: {
    /** GET - List transactions for a store on a specific date */
    listByDate: (storeId: string, date: string, options?: { limit?: number; offset?: number }) =>
      withParams('/transactions', {
        store_id: storeId,
        date,
        limit: options?.limit,
        offset: options?.offset,
      }),
    /** GET - Get transactions updated since a timestamp */
    updatedSince: (storeId: string, since: string) =>
      withParams('/transactions', { store_id: storeId, updated_since: since }),
    /** GET - Get a single transaction */
    get: (transactionId: string) => `/transactions/${transactionId}`,
    /** POST - Create a new transaction */
    create: '/transactions',
    /** GET - Get transactions for a ticket */
    byTicket: (ticketId: string) => withParams('/transactions', { ticket_id: ticketId }),
    /** GET - Get transactions for a client */
    byClient: (storeId: string, clientId: string) =>
      withParams('/transactions', { store_id: storeId, client_id: clientId }),
    /** POST - Void a transaction */
    void: (transactionId: string) => `/transactions/${transactionId}/void`,
    /** POST - Refund a transaction */
    refund: (transactionId: string) => `/transactions/${transactionId}/refund`,
  },

  // ===========================================================================
  // Batch Sync Endpoints
  // Matches: supabase/functions/batch-sync/index.ts
  // ===========================================================================
  sync: {
    /** POST - Push local changes to server (batch operations) */
    push: '/batch-sync',
    /** POST - Pull changes from server since timestamp */
    pull: (storeId: string, since: string) =>
      withParams('/batch-sync/pull', { store_id: storeId, since }),
    /** GET - Get sync status */
    status: (storeId: string) => withParams('/batch-sync/status', { store_id: storeId }),
  },

  // ===========================================================================
  // Data Query Endpoints
  // Matches: supabase/functions/data-query/index.ts
  // ===========================================================================
  dataQuery: {
    /** POST - Execute a data query */
    execute: '/data-query',
    /** GET - Get query by ID */
    get: (queryId: string) => `/data-query/${queryId}`,
  },

  // ===========================================================================
  // Store Configuration Endpoints (future)
  // ===========================================================================
  store: {
    /** GET - Get store details */
    get: (storeId: string) => `/stores/${storeId}`,
    /** GET - Get store settings */
    settings: (storeId: string) => `/stores/${storeId}/settings`,
    /** PUT - Update store settings */
    updateSettings: (storeId: string) => `/stores/${storeId}/settings`,
  },
} as const;

// =============================================================================
// Type Exports
// =============================================================================

export type Endpoints = typeof endpoints;
export type AuthEndpoints = typeof endpoints.auth;
export type ClientEndpoints = typeof endpoints.clients;
export type StaffEndpoints = typeof endpoints.staff;
export type ServiceEndpoints = typeof endpoints.services;
export type AppointmentEndpoints = typeof endpoints.appointments;
export type TicketEndpoints = typeof endpoints.tickets;
export type TransactionEndpoints = typeof endpoints.transactions;
export type SyncEndpoints = typeof endpoints.sync;
