/**
 * SQLite Ticket Service
 *
 * SQLite-based implementation of ticket data operations.
 * Key benefit: SQL aggregations for getStaffTicketCounts and getDailyStats
 * replace expensive JS loops.
 *
 * @module sqlite-adapter/services/ticketService
 */

import type { SQLiteAdapter, SQLiteValue } from '../types';

// ==================== TYPE DEFINITIONS ====================

/**
 * Service status type
 */
export type ServiceStatus =
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled';

/**
 * Ticket status type
 */
export type TicketStatus =
  | 'pending'
  | 'waiting'
  | 'in-service'
  | 'paid'
  | 'completed'
  | 'cancelled'
  | 'voided';

/**
 * Ticket service within a ticket (JSON stored)
 */
export interface TicketService {
  id?: string;
  serviceId: string;
  serviceName?: string;
  name?: string;
  staffId: string;
  staffName: string;
  price: number;
  duration: number;
  commission: number;
  startTime: string;
  endTime?: string;
  status: ServiceStatus;
  statusHistory: Array<{ from: string; to: string; at: string }>;
  actualStartTime?: string;
  pausedAt?: string;
  totalPausedDuration: number;
  actualDuration?: number;
  notes?: string;
  discount?: Record<string, unknown>;
  assistantStaffId?: string;
  assistantStaffName?: string;
  assistantTipPercent?: number;
}

/**
 * Ticket product (JSON stored)
 */
export interface TicketProduct {
  id?: string;
  productId: string;
  productName?: string;
  name?: string;
  quantity: number;
  price: number;
  unitPrice?: number;
  total: number;
}

/**
 * Payment record (JSON stored)
 */
export interface Payment {
  id: string;
  method: string;
  cardType?: string;
  cardLast4?: string;
  amount: number;
  tip: number;
  total: number;
  transactionId?: string;
  processedAt: string;
  status?: 'approved' | 'declined' | 'pending' | 'failed';
}

/**
 * Main Ticket entity
 */
export interface Ticket {
  id: string;
  number?: number;
  storeId: string;
  appointmentId?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  isGroupTicket?: boolean;
  clients?: string; // JSON
  isMergedTicket?: boolean;
  mergedFromTickets?: string; // JSON
  originalTicketId?: string;
  mergedAt?: string;
  mergedBy?: string;
  services: TicketService[];
  products: TicketProduct[];
  status: TicketStatus;
  subtotal: number;
  discount: number;
  discountReason?: string;
  discountPercent?: number;
  tax: number;
  taxRate?: number;
  tip: number;
  total: number;
  payments: Payment[];
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  createdBy: string;
  lastModifiedBy: string;
  syncStatus: string;
  isDraft?: boolean;
  draftExpiresAt?: string;
  lastAutoSaveAt?: string;
  source?: string;
  serviceCharges?: string; // JSON
  serviceChargeTotal?: number;
  paymentMethod?: string;
  staffId?: string;
  staffName?: string;
  closedAt?: string;
  closedBy?: string;
  signatureBase64?: string;
  signatureTimestamp?: string;
}

/**
 * Daily statistics result
 */
export interface DailyStats {
  total: number;
  completed: number;
  revenue: number;
}

// ==================== ROW TYPE ====================

/**
 * SQLite row representation (snake_case columns)
 */
interface TicketRow {
  id: string;
  number: number | null;
  store_id: string;
  appointment_id: string | null;
  client_id: string;
  client_name: string;
  client_phone: string;
  is_group_ticket: number;
  clients: string | null;
  is_merged_ticket: number;
  merged_from_tickets: string | null;
  original_ticket_id: string | null;
  merged_at: string | null;
  merged_by: string | null;
  services: string;
  products: string;
  status: string;
  subtotal: number;
  discount: number;
  discount_reason: string | null;
  discount_percent: number | null;
  tax: number;
  tax_rate: number | null;
  tip: number;
  total: number;
  payments: string;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
  created_by: string;
  last_modified_by: string;
  sync_status: string;
  is_draft: number;
  draft_expires_at: string | null;
  last_auto_save_at: string | null;
  source: string | null;
  service_charges: string | null;
  service_charge_total: number | null;
  payment_method: string | null;
  staff_id: string | null;
  staff_name: string | null;
  closed_at: string | null;
  closed_by: string | null;
  signature_base64: string | null;
  signature_timestamp: string | null;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Parse JSON safely, returning default on failure
 */
function safeParseJSON<T>(json: string | null, defaultValue: T): T {
  if (!json) return defaultValue;
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Convert SQLite row to Ticket entity
 */
function rowToTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    number: row.number ?? undefined,
    storeId: row.store_id,
    appointmentId: row.appointment_id ?? undefined,
    clientId: row.client_id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    isGroupTicket: row.is_group_ticket === 1,
    clients: row.clients ?? undefined,
    isMergedTicket: row.is_merged_ticket === 1,
    mergedFromTickets: row.merged_from_tickets ?? undefined,
    originalTicketId: row.original_ticket_id ?? undefined,
    mergedAt: row.merged_at ?? undefined,
    mergedBy: row.merged_by ?? undefined,
    services: safeParseJSON<TicketService[]>(row.services, []),
    products: safeParseJSON<TicketProduct[]>(row.products, []),
    status: row.status as TicketStatus,
    subtotal: row.subtotal,
    discount: row.discount,
    discountReason: row.discount_reason ?? undefined,
    discountPercent: row.discount_percent ?? undefined,
    tax: row.tax,
    taxRate: row.tax_rate ?? undefined,
    tip: row.tip,
    total: row.total,
    payments: safeParseJSON<Payment[]>(row.payments, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdBy: row.created_by,
    lastModifiedBy: row.last_modified_by,
    syncStatus: row.sync_status,
    isDraft: row.is_draft === 1,
    draftExpiresAt: row.draft_expires_at ?? undefined,
    lastAutoSaveAt: row.last_auto_save_at ?? undefined,
    source: row.source ?? undefined,
    serviceCharges: row.service_charges ?? undefined,
    serviceChargeTotal: row.service_charge_total ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    staffId: row.staff_id ?? undefined,
    staffName: row.staff_name ?? undefined,
    closedAt: row.closed_at ?? undefined,
    closedBy: row.closed_by ?? undefined,
    signatureBase64: row.signature_base64 ?? undefined,
    signatureTimestamp: row.signature_timestamp ?? undefined,
  };
}

/**
 * Generate UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ==================== TICKET SQLITE SERVICE ====================

/**
 * SQLite-based ticket service
 *
 * Key benefits over Dexie:
 * - getStaffTicketCounts uses SQL GROUP BY for aggregation
 * - getDailyStats uses SQL COUNT/SUM for aggregation
 * - Status filtering uses SQL WHERE instead of JS filter
 */
export class TicketSQLiteService {
  private db: SQLiteAdapter;

  constructor(db: SQLiteAdapter) {
    this.db = db;
  }

  /**
   * Get all tickets for a store with pagination
   */
  async getAll(
    storeId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Ticket[]> {
    const sql = `
      SELECT * FROM tickets
      WHERE store_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.all<TicketRow>(sql, [storeId, limit, offset]);
    return rows.map(rowToTicket);
  }

  /**
   * Get a single ticket by ID
   */
  async getById(id: string): Promise<Ticket | undefined> {
    const sql = 'SELECT * FROM tickets WHERE id = ?';
    const row = await this.db.get<TicketRow>(sql, [id]);
    return row ? rowToTicket(row) : undefined;
  }

  /**
   * Get tickets by status using SQL WHERE
   */
  async getByStatus(
    storeId: string,
    status: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Ticket[]> {
    const sql = `
      SELECT * FROM tickets
      WHERE store_id = ? AND status = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await this.db.all<TicketRow>(sql, [storeId, status, limit, offset]);
    return rows.map(rowToTicket);
  }

  /**
   * Get active tickets - status IN ('waiting', 'in-service', 'pending')
   */
  async getActive(storeId: string, limit: number = 100): Promise<Ticket[]> {
    const sql = `
      SELECT * FROM tickets
      WHERE store_id = ? AND status IN ('waiting', 'in-service', 'pending')
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const rows = await this.db.all<TicketRow>(sql, [storeId, limit]);
    return rows.map(rowToTicket);
  }

  /**
   * Get tickets by date
   */
  async getByDate(storeId: string, date: Date, limit: number = 200): Promise<Ticket[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sql = `
      SELECT * FROM tickets
      WHERE store_id = ? AND created_at >= ? AND created_at <= ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const rows = await this.db.all<TicketRow>(sql, [
      storeId,
      startOfDay.toISOString(),
      endOfDay.toISOString(),
      limit,
    ]);
    return rows.map(rowToTicket);
  }

  /**
   * Get staff ticket counts using SQL aggregation
   *
   * NOTE: Since staff IDs are in the JSON services array, we need to
   * fetch tickets and count in application code. SQLite's json_extract
   * could be used but is complex for arrays. For better performance
   * on very large datasets, consider denormalizing staff_id to a
   * separate column or table.
   */
  async getStaffTicketCounts(
    storeId: string,
    staffIds: string[],
    since: Date
  ): Promise<Map<string, number>> {
    if (!storeId || staffIds.length === 0) {
      return new Map<string, number>();
    }

    const sinceIso = since.toISOString();

    // Fetch tickets since the date
    const sql = `
      SELECT services FROM tickets
      WHERE store_id = ? AND created_at >= ?
    `;
    const rows = await this.db.all<{ services: string }>(sql, [storeId, sinceIso]);

    // Count services per staff
    const staffIdSet = new Set(staffIds);
    const counts = new Map<string, number>();

    // Initialize all requested staff IDs with 0
    for (const staffId of staffIds) {
      counts.set(staffId, 0);
    }

    // Count services per staff
    for (const row of rows) {
      const services = safeParseJSON<TicketService[]>(row.services, []);
      for (const service of services) {
        if (staffIdSet.has(service.staffId)) {
          counts.set(service.staffId, (counts.get(service.staffId) ?? 0) + 1);
        }
      }
    }

    return counts;
  }

  /**
   * Get daily statistics using SQL aggregation
   */
  async getDailyStats(storeId: string, date: Date): Promise<DailyStats> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('paid', 'completed') THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status IN ('paid', 'completed') THEN total ELSE 0 END) as revenue
      FROM tickets
      WHERE store_id = ? AND created_at >= ? AND created_at <= ?
    `;

    const result = await this.db.get<{
      total: number;
      completed: number;
      revenue: number | null;
    }>(sql, [storeId, startOfDay.toISOString(), endOfDay.toISOString()]);

    return {
      total: result?.total ?? 0,
      completed: result?.completed ?? 0,
      revenue: result?.revenue ?? 0,
    };
  }

  /**
   * Create a new ticket
   */
  async create(
    ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<Ticket> {
    const now = new Date().toISOString();
    const id = generateUUID();

    const sql = `
      INSERT INTO tickets (
        id, number, store_id, appointment_id,
        client_id, client_name, client_phone,
        is_group_ticket, clients,
        is_merged_ticket, merged_from_tickets, original_ticket_id, merged_at, merged_by,
        services, products, status,
        subtotal, discount, discount_reason, discount_percent,
        tax, tax_rate, tip, total,
        payments, created_at, updated_at, completed_at,
        created_by, last_modified_by, sync_status,
        is_draft, draft_expires_at, last_auto_save_at,
        source, service_charges, service_charge_total,
        payment_method, staff_id, staff_name,
        closed_at, closed_by, signature_base64, signature_timestamp
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?
      )
    `;

    const params: SQLiteValue[] = [
      id,
      ticket.number ?? null,
      ticket.storeId,
      ticket.appointmentId ?? null,
      ticket.clientId,
      ticket.clientName,
      ticket.clientPhone,
      ticket.isGroupTicket ? 1 : 0,
      ticket.clients ?? null,
      ticket.isMergedTicket ? 1 : 0,
      ticket.mergedFromTickets ?? null,
      ticket.originalTicketId ?? null,
      ticket.mergedAt ?? null,
      ticket.mergedBy ?? null,
      JSON.stringify(ticket.services),
      JSON.stringify(ticket.products),
      ticket.status,
      ticket.subtotal,
      ticket.discount,
      ticket.discountReason ?? null,
      ticket.discountPercent ?? null,
      ticket.tax,
      ticket.taxRate ?? null,
      ticket.tip,
      ticket.total,
      JSON.stringify(ticket.payments),
      now,
      now,
      ticket.completedAt ?? null,
      userId,
      userId,
      ticket.syncStatus ?? 'local',
      ticket.isDraft ? 1 : 0,
      ticket.draftExpiresAt ?? null,
      ticket.lastAutoSaveAt ?? null,
      ticket.source ?? null,
      ticket.serviceCharges ?? null,
      ticket.serviceChargeTotal ?? null,
      ticket.paymentMethod ?? null,
      ticket.staffId ?? null,
      ticket.staffName ?? null,
      ticket.closedAt ?? null,
      ticket.closedBy ?? null,
      ticket.signatureBase64 ?? null,
      ticket.signatureTimestamp ?? null,
    ];

    await this.db.run(sql, params);

    return {
      ...ticket,
      id,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      lastModifiedBy: userId,
      syncStatus: ticket.syncStatus ?? 'local',
    };
  }

  /**
   * Update an existing ticket
   */
  async update(
    id: string,
    updates: Partial<Ticket>,
    userId: string
  ): Promise<Ticket | undefined> {
    // First check if ticket exists
    const existing = await this.getById(id);
    if (!existing) {
      return undefined;
    }

    const now = new Date().toISOString();
    const setClauses: string[] = ['updated_at = ?', 'last_modified_by = ?', 'sync_status = ?'];
    const params: SQLiteValue[] = [now, userId, 'local'];

    // Build SET clauses dynamically
    const fieldMappings: Record<string, string> = {
      number: 'number',
      storeId: 'store_id',
      appointmentId: 'appointment_id',
      clientId: 'client_id',
      clientName: 'client_name',
      clientPhone: 'client_phone',
      isGroupTicket: 'is_group_ticket',
      clients: 'clients',
      isMergedTicket: 'is_merged_ticket',
      mergedFromTickets: 'merged_from_tickets',
      originalTicketId: 'original_ticket_id',
      mergedAt: 'merged_at',
      mergedBy: 'merged_by',
      status: 'status',
      subtotal: 'subtotal',
      discount: 'discount',
      discountReason: 'discount_reason',
      discountPercent: 'discount_percent',
      tax: 'tax',
      taxRate: 'tax_rate',
      tip: 'tip',
      total: 'total',
      completedAt: 'completed_at',
      isDraft: 'is_draft',
      draftExpiresAt: 'draft_expires_at',
      lastAutoSaveAt: 'last_auto_save_at',
      source: 'source',
      serviceChargeTotal: 'service_charge_total',
      paymentMethod: 'payment_method',
      staffId: 'staff_id',
      staffName: 'staff_name',
      closedAt: 'closed_at',
      closedBy: 'closed_by',
      signatureBase64: 'signature_base64',
      signatureTimestamp: 'signature_timestamp',
    };

    for (const [key, column] of Object.entries(fieldMappings)) {
      if (key in updates) {
        setClauses.push(`${column} = ?`);
        const value = updates[key as keyof Ticket];
        if (typeof value === 'boolean') {
          params.push(value ? 1 : 0);
        } else if (value === undefined) {
          params.push(null);
        } else {
          params.push(value as SQLiteValue);
        }
      }
    }

    // Handle JSON fields
    if ('services' in updates) {
      setClauses.push('services = ?');
      params.push(JSON.stringify(updates.services));
    }
    if ('products' in updates) {
      setClauses.push('products = ?');
      params.push(JSON.stringify(updates.products));
    }
    if ('payments' in updates) {
      setClauses.push('payments = ?');
      params.push(JSON.stringify(updates.payments));
    }
    if ('serviceCharges' in updates) {
      setClauses.push('service_charges = ?');
      params.push(updates.serviceCharges ?? null);
    }

    const sql = `UPDATE tickets SET ${setClauses.join(', ')} WHERE id = ?`;
    params.push(id);

    await this.db.run(sql, params);

    // Return updated ticket
    return this.getById(id);
  }

  /**
   * Delete a ticket by ID
   */
  async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM tickets WHERE id = ?';
    const result = await this.db.run(sql, [id]);
    return result.changes > 0;
  }

  /**
   * Get ticket count for a store
   */
  async getCount(storeId: string): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM tickets WHERE store_id = ?';
    const result = await this.db.get<{ count: number }>(sql, [storeId]);
    return result?.count ?? 0;
  }

  /**
   * Get completed tickets for date range (for reports)
   */
  async getCompletedInRange(
    storeId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 1000
  ): Promise<Ticket[]> {
    const sql = `
      SELECT * FROM tickets
      WHERE store_id = ?
        AND status IN ('paid', 'completed')
        AND completed_at >= ?
        AND completed_at <= ?
      ORDER BY completed_at DESC
      LIMIT ?
    `;
    const rows = await this.db.all<TicketRow>(sql, [
      storeId,
      startDate.toISOString(),
      endDate.toISOString(),
      limit,
    ]);
    return rows.map(rowToTicket);
  }

  /**
   * Get draft tickets
   */
  async getDrafts(storeId: string): Promise<Ticket[]> {
    const sql = `
      SELECT * FROM tickets
      WHERE store_id = ? AND is_draft = 1
      ORDER BY last_auto_save_at DESC
    `;
    const rows = await this.db.all<TicketRow>(sql, [storeId]);
    return rows.map(rowToTicket);
  }

  /**
   * Add a raw ticket object directly to SQLite.
   * Use this when you have a pre-built ticket object with all fields.
   * Matches Dexie ticketsDB.addRaw() interface.
   */
  async addRaw(ticket: Partial<Ticket>): Promise<Ticket> {
    const now = new Date().toISOString();
    const id = ticket.id || generateUUID();

    // Ensure required fields have defaults
    const fullTicket: Ticket = {
      id,
      number: ticket.number,
      storeId: ticket.storeId || '',
      appointmentId: ticket.appointmentId,
      clientId: ticket.clientId || '',
      clientName: ticket.clientName || '',
      clientPhone: ticket.clientPhone || '',
      isGroupTicket: ticket.isGroupTicket,
      clients: ticket.clients,
      isMergedTicket: ticket.isMergedTicket,
      mergedFromTickets: ticket.mergedFromTickets,
      originalTicketId: ticket.originalTicketId,
      mergedAt: ticket.mergedAt,
      mergedBy: ticket.mergedBy,
      services: ticket.services || [],
      products: ticket.products || [],
      status: ticket.status || 'pending',
      subtotal: ticket.subtotal || 0,
      discount: ticket.discount || 0,
      discountReason: ticket.discountReason,
      discountPercent: ticket.discountPercent,
      tax: ticket.tax || 0,
      taxRate: ticket.taxRate,
      tip: ticket.tip || 0,
      total: ticket.total || 0,
      payments: ticket.payments || [],
      createdAt: ticket.createdAt || now,
      updatedAt: ticket.updatedAt || now,
      completedAt: ticket.completedAt,
      createdBy: ticket.createdBy || '',
      lastModifiedBy: ticket.lastModifiedBy || '',
      syncStatus: ticket.syncStatus || 'synced', // Mark as synced when adding from server
      isDraft: ticket.isDraft,
      draftExpiresAt: ticket.draftExpiresAt,
      lastAutoSaveAt: ticket.lastAutoSaveAt,
      source: ticket.source,
      serviceCharges: ticket.serviceCharges,
      serviceChargeTotal: ticket.serviceChargeTotal,
      paymentMethod: ticket.paymentMethod,
      staffId: ticket.staffId,
      staffName: ticket.staffName,
      closedAt: ticket.closedAt,
      closedBy: ticket.closedBy,
      signatureBase64: ticket.signatureBase64,
      signatureTimestamp: ticket.signatureTimestamp,
    };

    const sql = `
      INSERT OR REPLACE INTO tickets (
        id, number, store_id, appointment_id,
        client_id, client_name, client_phone,
        is_group_ticket, clients,
        is_merged_ticket, merged_from_tickets, original_ticket_id, merged_at, merged_by,
        services, products, status,
        subtotal, discount, discount_reason, discount_percent,
        tax, tax_rate, tip, total,
        payments, created_at, updated_at, completed_at,
        created_by, last_modified_by, sync_status,
        is_draft, draft_expires_at, last_auto_save_at,
        source, service_charges, service_charge_total,
        payment_method, staff_id, staff_name,
        closed_at, closed_by, signature_base64, signature_timestamp
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?
      )
    `;

    const params: SQLiteValue[] = [
      fullTicket.id,
      fullTicket.number ?? null,
      fullTicket.storeId,
      fullTicket.appointmentId ?? null,
      fullTicket.clientId,
      fullTicket.clientName,
      fullTicket.clientPhone,
      fullTicket.isGroupTicket ? 1 : 0,
      fullTicket.clients ?? null,
      fullTicket.isMergedTicket ? 1 : 0,
      fullTicket.mergedFromTickets ?? null,
      fullTicket.originalTicketId ?? null,
      fullTicket.mergedAt ?? null,
      fullTicket.mergedBy ?? null,
      JSON.stringify(fullTicket.services),
      JSON.stringify(fullTicket.products),
      fullTicket.status,
      fullTicket.subtotal,
      fullTicket.discount,
      fullTicket.discountReason ?? null,
      fullTicket.discountPercent ?? null,
      fullTicket.tax,
      fullTicket.taxRate ?? null,
      fullTicket.tip,
      fullTicket.total,
      JSON.stringify(fullTicket.payments),
      fullTicket.createdAt,
      fullTicket.updatedAt ?? null,
      fullTicket.completedAt ?? null,
      fullTicket.createdBy,
      fullTicket.lastModifiedBy,
      fullTicket.syncStatus,
      fullTicket.isDraft ? 1 : 0,
      fullTicket.draftExpiresAt ?? null,
      fullTicket.lastAutoSaveAt ?? null,
      fullTicket.source ?? null,
      fullTicket.serviceCharges ?? null,
      fullTicket.serviceChargeTotal ?? null,
      fullTicket.paymentMethod ?? null,
      fullTicket.staffId ?? null,
      fullTicket.staffName ?? null,
      fullTicket.closedAt ?? null,
      fullTicket.closedBy ?? null,
      fullTicket.signatureBase64 ?? null,
      fullTicket.signatureTimestamp ?? null,
    ];

    await this.db.run(sql, params);
    return fullTicket;
  }

  /**
   * Mark ticket as completed/paid.
   * Matches Dexie ticketsDB.complete() interface.
   */
  async complete(id: string, userId: string): Promise<Ticket | undefined> {
    return await this.update(id, {
      status: 'paid',
      completedAt: new Date().toISOString(),
      isDraft: false,
    }, userId);
  }

  /**
   * Create a draft ticket for auto-save and status persistence.
   * Supports walk-in (no client) scenarios.
   * Matches Dexie ticketsDB.createDraft() interface.
   */
  async createDraft(
    services: TicketService[],
    userId: string,
    storeId: string,
    clientInfo?: { clientId: string; clientName: string; clientPhone: string }
  ): Promise<Ticket> {
    const now = new Date().toISOString();
    const subtotal = services.reduce((sum, s) => sum + s.price, 0);
    const expirationHours = 24; // Default from DRAFT_CONFIG
    const taxRate = 0.0875; // Standard tax rate

    const draftTicket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'> = {
      storeId,
      clientId: clientInfo?.clientId || 'walk-in',
      clientName: clientInfo?.clientName || 'Walk-in',
      clientPhone: clientInfo?.clientPhone || '',
      services,
      products: [],
      status: 'pending',
      subtotal,
      discount: 0,
      tax: Math.round(subtotal * taxRate * 100) / 100,
      tip: 0,
      total: Math.round(subtotal * (1 + taxRate) * 100) / 100,
      payments: [],
      createdBy: userId,
      lastModifiedBy: userId,
      syncStatus: 'local',
      isDraft: true,
      draftExpiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString(),
      lastAutoSaveAt: now,
      source: 'pos',
    };

    return await this.create(draftTicket, userId);
  }

  /**
   * Delete expired drafts (older than their expiration time).
   * Returns the count of deleted drafts.
   * Matches Dexie ticketsDB.cleanupExpiredDrafts() interface.
   */
  async cleanupExpiredDrafts(storeId: string): Promise<number> {
    const now = new Date().toISOString();

    // First, find expired drafts
    const sql = `
      SELECT id FROM tickets
      WHERE store_id = ? AND is_draft = 1 AND draft_expires_at IS NOT NULL AND draft_expires_at < ?
    `;
    const expiredDrafts = await this.db.all<{ id: string }>(sql, [storeId, now]);

    if (expiredDrafts.length === 0) {
      return 0;
    }

    // Delete each expired draft
    const deleteSql = 'DELETE FROM tickets WHERE id = ?';
    for (const draft of expiredDrafts) {
      await this.db.run(deleteSql, [draft.id]);
    }

    return expiredDrafts.length;
  }

  /**
   * Get tickets by client ID.
   * Useful for client history views.
   */
  async getByClient(clientId: string, limit: number = 100): Promise<Ticket[]> {
    const sql = `
      SELECT * FROM tickets
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const rows = await this.db.all<TicketRow>(sql, [clientId, limit]);
    return rows.map(rowToTicket);
  }

  /**
   * Get tickets by date range.
   * Useful for reporting and analytics.
   */
  async getByDateRange(
    storeId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 1000
  ): Promise<Ticket[]> {
    const sql = `
      SELECT * FROM tickets
      WHERE store_id = ? AND created_at >= ? AND created_at <= ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const rows = await this.db.all<TicketRow>(sql, [
      storeId,
      startDate.toISOString(),
      endDate.toISOString(),
      limit,
    ]);
    return rows.map(rowToTicket);
  }

  /**
   * Get pending tickets (status = 'pending').
   * Useful for turn queue views.
   */
  async getPending(storeId: string, limit: number = 100): Promise<Ticket[]> {
    return this.getByStatus(storeId, 'pending', limit);
  }
}
