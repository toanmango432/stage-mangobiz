/**
 * Schema Registry for SQLite Services
 *
 * Provides pre-defined schemas for core Mango POS tables.
 * These schemas match Dexie schema v16 and are used by BaseSQLiteService
 * for automatic type conversion between JavaScript and SQLite.
 *
 * @module sqlite-adapter/schema/registry
 */

import type { TableSchema, CoreTableName, SchemaRegistry } from './types';

/**
 * Appointments table schema
 *
 * Stores scheduled appointments with staff and client relationships.
 * Matches Dexie v16 indexes: [storeId+status], [storeId+scheduledStartTime], etc.
 */
export const appointmentsSchema: TableSchema = {
  tableName: 'appointments',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'storeId',
    clientId: 'clientId',
    staffId: 'staffId',
    status: 'status',
    scheduledStartTime: { column: 'scheduledStartTime', type: 'date' },
    scheduledEndTime: { column: 'scheduledEndTime', type: 'date' },
    createdAt: { column: 'createdAt', type: 'date' },
    updatedAt: { column: 'updatedAt', type: 'date' },
    syncStatus: { column: 'syncStatus', type: 'string', defaultValue: 'local' },
    // Service details stored as JSON
    services: { column: 'services', type: 'json', defaultValue: [] },
    notes: 'notes',
    source: 'source',
  },
};

/**
 * Tickets table schema
 *
 * Stores service tickets with all 45 columns matching TicketSQLiteService.
 * Matches Dexie v16 indexes: [storeId+status], [storeId+createdAt], etc.
 */
export const ticketsSchema: TableSchema = {
  tableName: 'tickets',
  primaryKey: 'id',
  columns: {
    // Primary fields
    id: 'id',
    number: { column: 'number', type: 'number' },
    storeId: 'store_id',
    appointmentId: 'appointment_id',

    // Client fields
    clientId: 'client_id',
    clientName: 'client_name',
    clientPhone: 'client_phone',

    // Group ticket fields
    isGroupTicket: { column: 'is_group_ticket', type: 'boolean', defaultValue: false },
    clients: { column: 'clients', type: 'json', defaultValue: [] },

    // Merged ticket fields
    isMergedTicket: { column: 'is_merged_ticket', type: 'boolean', defaultValue: false },
    mergedFromTickets: { column: 'merged_from_tickets', type: 'json' },
    originalTicketId: 'original_ticket_id',
    mergedAt: { column: 'merged_at', type: 'date' },
    mergedBy: 'merged_by',

    // Services and products (JSON arrays)
    services: { column: 'services', type: 'json', defaultValue: [] },
    products: { column: 'products', type: 'json', defaultValue: [] },

    // Status
    status: 'status',

    // Pricing fields
    subtotal: { column: 'subtotal', type: 'number', defaultValue: 0 },
    discount: { column: 'discount', type: 'number', defaultValue: 0 },
    discountReason: 'discount_reason',
    discountPercent: { column: 'discount_percent', type: 'number' },
    tax: { column: 'tax', type: 'number', defaultValue: 0 },
    taxRate: { column: 'tax_rate', type: 'number' },
    tip: { column: 'tip', type: 'number', defaultValue: 0 },
    total: { column: 'total', type: 'number', defaultValue: 0 },

    // Payments (JSON array)
    payments: { column: 'payments', type: 'json', defaultValue: [] },

    // Timestamps
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    completedAt: { column: 'completed_at', type: 'date' },

    // Audit fields
    createdBy: 'created_by',
    lastModifiedBy: 'last_modified_by',
    syncStatus: { column: 'sync_status', type: 'string', defaultValue: 'local' },

    // Draft fields
    isDraft: { column: 'is_draft', type: 'boolean', defaultValue: false },
    draftExpiresAt: { column: 'draft_expires_at', type: 'date' },
    lastAutoSaveAt: { column: 'last_auto_save_at', type: 'date' },

    // Source tracking
    source: 'source',

    // Service charges
    serviceCharges: { column: 'service_charges', type: 'json' },
    serviceChargeTotal: { column: 'service_charge_total', type: 'number' },

    // Payment method (legacy/convenience field)
    paymentMethod: 'payment_method',

    // Staff assignment (primary staff for the ticket)
    staffId: 'staff_id',
    staffName: 'staff_name',

    // Closing fields
    closedAt: { column: 'closed_at', type: 'date' },
    closedBy: 'closed_by',

    // Signature
    signatureBase64: 'signature_base64',
    signatureTimestamp: { column: 'signature_timestamp', type: 'date' },
  },
};

/**
 * Clients table schema
 *
 * Stores client contact and profile information (50+ columns).
 * Matches Dexie v16 indexes: [storeId+lastName], [storeId+isBlocked], etc.
 */
export const clientsSchema: TableSchema = {
  tableName: 'clients',
  primaryKey: 'id',
  columns: {
    // Primary fields
    id: 'id',
    storeId: 'store_id',

    // Name fields
    firstName: 'first_name',
    lastName: 'last_name',
    displayName: 'display_name',
    nickname: 'nickname',
    name: 'name',

    // Contact fields
    phone: 'phone',
    email: 'email',
    avatar: 'avatar',

    // Personal info
    gender: 'gender',
    birthday: { column: 'birthday', type: 'date' },
    anniversary: { column: 'anniversary', type: 'date' },
    preferredLanguage: 'preferred_language',

    // Complex fields stored as JSON
    address: { column: 'address', type: 'json' },
    emergencyContacts: { column: 'emergency_contacts', type: 'json' },
    staffAlert: { column: 'staff_alert', type: 'json' },

    // Block/status fields
    isBlocked: { column: 'is_blocked', type: 'boolean', defaultValue: false },
    blockedAt: { column: 'blocked_at', type: 'date' },
    blockedBy: 'blocked_by',
    blockReason: 'block_reason',
    blockReasonNote: 'block_reason_note',

    // Source/referral tracking
    source: 'source',
    sourceDetails: 'source_details',
    referredByClientId: 'referred_by_client_id',
    referredByClientName: 'referred_by_client_name',

    // Profile JSON fields
    hairProfile: { column: 'hair_profile', type: 'json' },
    skinProfile: { column: 'skin_profile', type: 'json' },
    nailProfile: { column: 'nail_profile', type: 'json' },
    medicalInfo: { column: 'medical_info', type: 'json' },

    // Preferences JSON fields
    preferences: { column: 'preferences', type: 'json', defaultValue: {} },
    communicationPreferences: { column: 'communication_preferences', type: 'json' },

    // Loyalty/membership JSON fields
    loyaltyInfo: { column: 'loyalty_info', type: 'json' },
    loyaltyTier: 'loyalty_tier',
    membership: { column: 'membership', type: 'json' },
    giftCards: { column: 'gift_cards', type: 'json' },

    // Visit statistics
    visitSummary: { column: 'visit_summary', type: 'json' },
    lastVisit: { column: 'last_visit', type: 'date' },
    totalVisits: { column: 'total_visits', type: 'number', defaultValue: 0 },
    totalSpent: { column: 'total_spent', type: 'number', defaultValue: 0 },
    outstandingBalance: { column: 'outstanding_balance', type: 'number', defaultValue: 0 },
    storeCredit: { column: 'store_credit', type: 'number', defaultValue: 0 },

    // Rating/review stats
    averageRating: { column: 'average_rating', type: 'number' },
    totalReviews: { column: 'total_reviews', type: 'number', defaultValue: 0 },

    // Tags and notes (JSON arrays)
    tags: { column: 'tags', type: 'json', defaultValue: [] },
    notes: { column: 'notes', type: 'json', defaultValue: [] },

    // VIP status
    isVip: { column: 'is_vip', type: 'boolean', defaultValue: false },

    // Timestamps and sync
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: { column: 'sync_status', type: 'string', defaultValue: 'local' },
  },
};

/**
 * Staff table schema
 *
 * Stores staff member information including schedule and status.
 * Matches Dexie v16 indexes: [storeId+status]
 */
export const staffSchema: TableSchema = {
  tableName: 'staff',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    firstName: 'first_name',
    lastName: 'last_name',
    displayName: 'display_name',
    email: 'email',
    phone: 'phone',
    avatar: 'avatar',
    status: 'status',
    role: 'role',
    // Schedule stored as JSON (weekly hours)
    schedule: { column: 'schedule', type: 'json', defaultValue: {} },
    // Skills/services they can perform
    skills: { column: 'skills', type: 'json', defaultValue: [] },
    // Color used in calendar UI
    color: 'color',
    // Active status for soft delete
    isActive: { column: 'is_active', type: 'boolean', defaultValue: true },
    // Timestamps
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: { column: 'sync_status', type: 'string', defaultValue: 'local' },
  },
};

/**
 * Services table schema (menu items)
 *
 * Stores service/menu item information for the catalog.
 * Matches Dexie v16 indexes: [storeId+category]
 */
export const servicesSchema: TableSchema = {
  tableName: 'services',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    name: 'name',
    description: 'description',
    category: 'category',
    // Pricing
    price: { column: 'price', type: 'number', defaultValue: 0 },
    duration: { column: 'duration', type: 'number', defaultValue: 30 },
    // Display settings
    displayOrder: { column: 'display_order', type: 'number', defaultValue: 0 },
    color: 'color',
    icon: 'icon',
    // Status
    isActive: { column: 'is_active', type: 'boolean', defaultValue: true },
    // Add-ons and variants as JSON
    addOns: { column: 'add_ons', type: 'json', defaultValue: [] },
    variants: { column: 'variants', type: 'json', defaultValue: [] },
    // Timestamps
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: { column: 'sync_status', type: 'string', defaultValue: 'local' },
  },
};

/**
 * Transactions table schema
 *
 * Stores payment transactions linked to tickets.
 * Matches Dexie v16 indexes: [storeId+createdAt], [clientId+createdAt]
 */
export const transactionsSchema: TableSchema = {
  tableName: 'transactions',
  primaryKey: 'id',
  columns: {
    id: 'id',
    storeId: 'store_id',
    ticketId: 'ticket_id',
    clientId: 'client_id',
    // Payment details
    amount: { column: 'amount', type: 'number', defaultValue: 0 },
    paymentMethod: 'payment_method',
    status: 'status',
    // Card details (for card payments)
    cardLast4: 'card_last4',
    cardBrand: 'card_brand',
    authCode: 'auth_code',
    // Refund info
    refundedAmount: { column: 'refunded_amount', type: 'number', defaultValue: 0 },
    refundedAt: { column: 'refunded_at', type: 'date' },
    refundReason: 'refund_reason',
    // Metadata
    metadata: { column: 'metadata', type: 'json', defaultValue: {} },
    // Timestamps
    createdAt: { column: 'created_at', type: 'date' },
    updatedAt: { column: 'updated_at', type: 'date' },
    syncStatus: { column: 'sync_status', type: 'string', defaultValue: 'local' },
  },
};

/**
 * Schema registry for core tables
 *
 * Provides a type-safe lookup for table schemas by name.
 *
 * @example
 * const schema = schemaRegistry.clients;
 * const tableName = schema.tableName; // 'clients'
 */
export const schemaRegistry: SchemaRegistry<CoreTableName> = {
  appointments: appointmentsSchema,
  tickets: ticketsSchema,
  clients: clientsSchema,
  staff: staffSchema,
  services: servicesSchema,
  transactions: transactionsSchema,
};

/**
 * Get schema by table name
 *
 * @param tableName - The table name to look up
 * @returns The table schema or undefined if not found
 */
export function getSchema(tableName: string): TableSchema | undefined {
  return (schemaRegistry as Record<string, TableSchema>)[tableName];
}

/**
 * Check if a schema exists for the given table name
 *
 * @param tableName - The table name to check
 * @returns true if schema exists
 */
export function hasSchema(tableName: string): boolean {
  return tableName in schemaRegistry;
}

/**
 * Get all table names in the registry
 *
 * @returns Array of table names
 */
export function getTableNames(): CoreTableName[] {
  return Object.keys(schemaRegistry) as CoreTableName[];
}
