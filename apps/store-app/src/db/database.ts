import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import { TAX_RATE } from '../constants/checkoutConfig';
import { measureAsync } from '../utils';
import type {
  Appointment,
  CreateAppointmentInput,
  Ticket,
  TicketService,
  CreateTicketInput,
  Transaction,
  Staff,
  Client,
  Service,
  SyncOperation,
  PatchTest,
  FormTemplate,
  ClientFormResponse,
  Referral,
  ClientReview,
  LoyaltyReward,
  ReviewRequest,
  ReviewRequestStatus,
  CustomSegment,
  SegmentFilterGroup,
  ClientFilters,
  ClientSortOptions,
  BulkOperationResult,
  BlockReason,
  StaffAlert,
} from '../types';

// Re-export db for external use
export { db };

// ==================== APPOINTMENTS ====================

export const appointmentsDB = {
  async getAll(storeId: string, limit = 100, offset = 0): Promise<Appointment[]> {
    return await db.appointments
      .where('storeId')
      .equals(storeId)
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Appointment | undefined> {
    return await db.appointments.get(id);
  },

  async getByDate(storeId: string, date: Date, limit = 200): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startIso = startOfDay.toISOString();
    const endIso = endOfDay.toISOString();
    return await db.appointments
      .where('storeId')
      .equals(storeId)
      .and(apt =>
        apt.scheduledStartTime >= startIso &&
        apt.scheduledStartTime <= endIso
      )
      .limit(limit)
      .toArray();
  },

  async getByStatus(storeId: string, status: string, limit = 100, offset = 0): Promise<Appointment[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];

    return await db.appointments
      .where('[storeId+status]')
      .equals([storeId, status])
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getByClientId(storeId: string, clientId: string, limit = 100): Promise<Appointment[]> {
    // Guard: return empty array if storeId or clientId is invalid
    if (!storeId || !clientId) return [];

    return await db.appointments
      .where('storeId')
      .equals(storeId)
      .and(apt => apt.clientId === clientId)
      .limit(limit)
      .toArray();
  },

  async create(input: CreateAppointmentInput, userId: string, storeId: string): Promise<Appointment> {
    const now = new Date().toISOString();
    const startTime = typeof input.scheduledStartTime === 'string'
      ? new Date(input.scheduledStartTime)
      : input.scheduledStartTime;
    const endTime = new Date(
      startTime.getTime() +
      input.services.reduce((sum, s) => sum + s.duration, 0) * 60000
    );
    const appointment: Appointment = {
      id: uuidv4(),
      storeId,
      ...input,
      status: 'scheduled',
      scheduledStartTime: startTime.toISOString(),
      scheduledEndTime: endTime.toISOString(),
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      lastModifiedBy: userId,
      syncStatus: 'local',
    } as Appointment;

    await db.appointments.add(appointment);
    return appointment;
  },

  async update(id: string, updates: Partial<Appointment>, userId: string): Promise<Appointment | undefined> {
    const appointment = await db.appointments.get(id);
    if (!appointment) return undefined;

    const updated: Appointment = {
      ...appointment,
      ...updates,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: userId,
      syncStatus: 'local',
    };

    await db.appointments.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.appointments.delete(id);
  },

  async checkIn(id: string, userId: string): Promise<Appointment | undefined> {
    return await this.update(id, {
      status: 'checked-in',
      checkInTime: new Date().toISOString(),
    }, userId);
  },
};

// ==================== TICKETS ====================

export const ticketsDB = {
  async getAll(storeId: string, limit = 100, offset = 0): Promise<Ticket[]> {
    return await db.tickets
      .where('storeId')
      .equals(storeId)
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Ticket | undefined> {
    return await db.tickets.get(id);
  },

  async getByStatus(storeId: string, status: string, limit = 100, offset = 0): Promise<Ticket[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];

    return await db.tickets
      .where('[storeId+status]')
      .equals([storeId, status])
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getActive(storeId: string, limit = 100): Promise<Ticket[]> {
    return await db.tickets
      .where('storeId')
      .equals(storeId)
      .and(ticket => ['in-service', 'pending'].includes(ticket.status))
      .limit(limit)
      .toArray();
  },

  async getByDate(storeId: string, date: Date, limit = 200): Promise<Ticket[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startIso = startOfDay.toISOString();
    const endIso = endOfDay.toISOString();
    return await db.tickets
      .where('storeId')
      .equals(storeId)
      .and(ticket =>
        ticket.createdAt >= startIso &&
        ticket.createdAt <= endIso
      )
      .limit(limit)
      .toArray();
  },

  async create(input: CreateTicketInput, userId: string, storeId: string): Promise<Ticket> {
    const now = new Date();
    const subtotal = input.services.reduce((sum, s) => sum + s.price, 0) +
                    (input.products?.reduce((sum, p) => sum + p.total, 0) || 0);

    // Convert CreateTicketServiceInput to TicketService with defaults
    const services: TicketService[] = input.services.map(s => ({
      ...s,
      status: s.status || 'not_started',
      statusHistory: [],
      totalPausedDuration: 0,
    }));

    const ticket: Ticket = {
      id: uuidv4(),
      storeId,
      clientId: input.clientId,
      clientName: input.clientName,
      clientPhone: input.clientPhone,
      appointmentId: input.appointmentId,
      services,
      products: input.products || [],
      status: 'pending',
      subtotal,
      discount: 0,
      tax: Math.round(subtotal * TAX_RATE * 100) / 100,
      tip: 0,
      total: Math.round(subtotal * (1 + TAX_RATE) * 100) / 100,
      payments: [],
      createdAt: now.toISOString(),
      createdBy: userId,
      lastModifiedBy: userId,
      syncStatus: 'local',
      source: input.source,
    };

    await db.tickets.add(ticket);
    return ticket;
  },

  async update(id: string, updates: Partial<Ticket>, userId: string): Promise<Ticket | undefined> {
    const ticket = await db.tickets.get(id);
    if (!ticket) return undefined;

    const updated: Ticket = {
      ...ticket,
      ...updates,
      lastModifiedBy: userId,
      syncStatus: 'local',
    };

    await db.tickets.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.tickets.delete(id);
  },

  /**
   * Add a raw ticket object directly to IndexedDB.
   * Use this when you have a pre-built ticket object with all fields.
   */
  async addRaw(ticket: Partial<Ticket>): Promise<Ticket> {
    const ticketWithDefaults = {
      ...ticket,
      syncStatus: 'local',
    } as Ticket;
    await db.tickets.put(ticketWithDefaults);
    return ticketWithDefaults;
  },

  async complete(id: string, userId: string): Promise<Ticket | undefined> {
    return await this.update(id, {
      status: 'paid',
      completedAt: new Date().toISOString(),
      isDraft: false,
    }, userId);
  },

  /**
   * Create a draft ticket for auto-save and status persistence.
   * Supports walk-in (no client) scenarios.
   */
  async createDraft(
    services: TicketService[],
    userId: string,
    storeId: string,
    clientInfo?: { clientId: string; clientName: string; clientPhone: string }
  ): Promise<Ticket> {
    const now = new Date();
    const subtotal = services.reduce((sum, s) => sum + s.price, 0);
    const expirationHours = 24; // Default from DRAFT_CONFIG

    const ticket: Ticket = {
      id: uuidv4(),
      storeId,
      clientId: clientInfo?.clientId || 'walk-in',
      clientName: clientInfo?.clientName || 'Walk-in',
      clientPhone: clientInfo?.clientPhone || '',
      services,
      products: [],
      status: 'pending',
      subtotal,
      discount: 0,
      tax: Math.round(subtotal * TAX_RATE * 100) / 100,
      tip: 0,
      total: Math.round(subtotal * (1 + TAX_RATE) * 100) / 100,
      payments: [],
      createdAt: now.toISOString(),
      createdBy: userId,
      lastModifiedBy: userId,
      syncStatus: 'local',
      isDraft: true,
      draftExpiresAt: new Date(now.getTime() + expirationHours * 60 * 60 * 1000).toISOString(),
      lastAutoSaveAt: now.toISOString(),
      source: 'pos',
    };

    await db.tickets.add(ticket);
    return ticket;
  },

  /**
   * Get all draft tickets for a salon.
   */
  async getDrafts(storeId: string): Promise<Ticket[]> {
    return await db.tickets
      .where('storeId')
      .equals(storeId)
      .and(ticket => ticket.isDraft === true)
      .toArray();
  },

  /**
   * Delete expired drafts (older than 24 hours by default).
   */
  async cleanupExpiredDrafts(storeId: string): Promise<number> {
    const now = new Date().toISOString();
    const expiredDrafts = await db.tickets
      .where('storeId')
      .equals(storeId)
      .and(ticket =>
        ticket.isDraft === true &&
        ticket.draftExpiresAt !== undefined &&
        ticket.draftExpiresAt < now
      )
      .toArray();

    for (const draft of expiredDrafts) {
      await db.tickets.delete(draft.id);
    }
    return expiredDrafts.length;
  },

  /**
   * Get ticket counts per staff member for turn queue calculation.
   * Uses compound index to fetch tickets once, then counts per staff.
   * Returns Map<staffId, count> for O(1) lookups.
   */
  async getStaffTicketCounts(
    storeId: string,
    staffIds: string[],
    since: Date
  ): Promise<Map<string, number>> {
    return measureAsync('ticketsDB.getStaffTicketCounts', async () => {
      // Guard: return empty map if inputs are invalid
      if (!storeId || staffIds.length === 0) {
        return new Map<string, number>();
      }

      const sinceIso = since.toISOString();
      const staffIdSet = new Set(staffIds);

      // Fetch all tickets for the store since the given date in a single query
      // Uses compound index [storeId+status+createdAt] for efficient filtering
      const tickets = await db.tickets
        .where('storeId')
        .equals(storeId)
        .and(ticket => ticket.createdAt >= sinceIso)
        .toArray();

      // Count tickets per staff by iterating ticket.services array
      const counts = new Map<string, number>();

      // Initialize counts for all requested staffIds
      for (const staffId of staffIds) {
        counts.set(staffId, 0);
      }

      // Iterate through tickets and count services per staff
      for (const ticket of tickets) {
        for (const service of ticket.services) {
          if (staffIdSet.has(service.staffId)) {
            const currentCount = counts.get(service.staffId) ?? 0;
            counts.set(service.staffId, currentCount + 1);
          }
        }
      }

      return counts;
    });
  },
};

// ==================== TRANSACTIONS ====================

export const transactionsDB = {
  async getAll(storeId: string, limit = 100, offset = 0): Promise<Transaction[]> {
    return await db.transactions
      .where('storeId')
      .equals(storeId)
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Transaction | undefined> {
    return await db.transactions.get(id);
  },

  async getByDateRange(storeId: string, startDate: Date, endDate: Date, limit = 100): Promise<Transaction[]> {
    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();
    return await db.transactions
      .where('storeId')
      .equals(storeId)
      .and(txn => txn.createdAt >= startIso && txn.createdAt <= endIso)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getByDate(date: Date, limit = 200): Promise<Transaction[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return await db.transactions
      .where('createdAt')
      .between(startOfDay.toISOString(), endOfDay.toISOString(), true, true)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'syncStatus'>): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: uuidv4(),
      ...transaction,
      createdAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    await db.transactions.add(newTransaction);
    return newTransaction;
  },

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = await db.transactions.get(id);
    if (!transaction) return undefined;

    const updated: Transaction = {
      ...transaction,
      ...updates,
      syncStatus: 'local',
    };

    await db.transactions.put(updated);
    return updated;
  },

  /**
   * Add a raw transaction object directly to IndexedDB.
   * Use this when you have a pre-built transaction object with all fields.
   */
  async addRaw(transaction: Partial<Transaction>): Promise<Transaction> {
    const transactionWithDefaults = {
      ...transaction,
      syncStatus: 'synced', // Mark as synced when adding from server
    } as Transaction;
    await db.transactions.put(transactionWithDefaults);
    return transactionWithDefaults;
  },

  async delete(id: string): Promise<void> {
    await db.transactions.delete(id);
  },
};

// ==================== STAFF ====================

export const staffDB = {
  async getAll(storeId: string, limit = 100, offset = 0): Promise<Staff[]> {
    return await db.staff
      .where('storeId')
      .equals(storeId)
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Staff | undefined> {
    return await db.staff.get(id);
  },

  async getAvailable(storeId: string, limit = 100): Promise<Staff[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];

    return await db.staff
      .where('[storeId+status]')
      .equals([storeId, 'available'])
      .limit(limit)
      .toArray();
  },

  async create(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Staff> {
    const now = new Date().toISOString();
    const newStaff: Staff = {
      ...staffData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };

    await db.staff.add(newStaff);
    return newStaff;
  },

  async update(id: string, updates: Partial<Staff>): Promise<Staff | undefined> {
    const staff = await db.staff.get(id);
    if (!staff) return undefined;

    const updated: Staff = {
      ...staff,
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    await db.staff.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.staff.delete(id);
  },

  async clockIn(id: string): Promise<Staff | undefined> {
    return await this.update(id, {
      status: 'available',
      clockedInAt: new Date().toISOString(),
    });
  },

  async clockOut(id: string): Promise<Staff | undefined> {
    return await this.update(id, {
      status: 'clocked-out',
      clockedInAt: undefined,
    });
  },
};

// ==================== CLIENTS ====================

export const clientsDB = {
  // Basic CRUD operations
  async getAll(storeId: string, limit = 100, offset = 0): Promise<Client[]> {
    return await db.clients
      .where('storeId')
      .equals(storeId)
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Client | undefined> {
    return await db.clients.get(id);
  },

  async getByIds(ids: string[]): Promise<Client[]> {
    return await db.clients.where('id').anyOf(ids).toArray();
  },

  async search(storeId: string, query: string, limit = 50): Promise<Client[]> {
    const lowerQuery = query.toLowerCase();
    return await db.clients
      .where('storeId')
      .equals(storeId)
      .and(client => {
        const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
        return fullName.includes(lowerQuery) ||
          client.phone.includes(query) ||
          (client.email?.toLowerCase().includes(lowerQuery) || false);
      })
      .limit(limit)
      .toArray();
  },

  async create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Client> {
    const now = new Date().toISOString();
    const newClient: Client = {
      id: uuidv4(),
      ...client,
      isBlocked: client.isBlocked ?? false,
      isVip: client.isVip ?? false,
      visitSummary: client.visitSummary ?? {
        totalVisits: 0,
        totalSpent: 0,
        averageTicket: 0,
        noShowCount: 0,
        lateCancelCount: 0,
      },
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };

    await db.clients.add(newClient);
    return newClient;
  },

  async update(id: string, updates: Partial<Client>): Promise<Client | undefined> {
    const client = await db.clients.get(id);
    if (!client) return undefined;

    const updated: Client = {
      ...client,
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    await db.clients.put(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const client = await db.clients.get(id);
    if (!client) return false;
    await db.clients.delete(id);
    return true;
  },

  // Filtering and sorting
  async getFiltered(
    storeId: string,
    filters: ClientFilters,
    sort: ClientSortOptions = { field: 'name', order: 'asc' },
    limit = 100,
    offset = 0
  ): Promise<{ clients: Client[]; total: number }> {
    return measureAsync('clientsDB.getFiltered', async () => {
      // Build filter function to apply on indexed collection
      const filterFn = (client: Client): boolean => {
        // Search query
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
          if (!fullName.includes(query) &&
              !client.phone.includes(filters.searchQuery) &&
              !(client.email?.toLowerCase().includes(query))) {
            return false;
          }
        }

        // Status filter
        if (filters.status && filters.status !== 'all') {
          if (filters.status === 'blocked' && !client.isBlocked) return false;
          if (filters.status === 'vip' && !client.isVip) return false;
          if (filters.status === 'active' && client.isBlocked) return false;
        }

        // Loyalty tier filter
        if (filters.loyaltyTier && filters.loyaltyTier !== 'all') {
          if (client.loyaltyInfo?.tier !== filters.loyaltyTier) return false;
        }

        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
          const clientTagIds = client.tags?.map(t => t.id) || [];
          if (!filters.tags.some(tag => clientTagIds.includes(tag))) return false;
        }

        // Source filter
        if (filters.source) {
          if (client.source !== filters.source) return false;
        }

        // Preferred staff filter
        if (filters.preferredStaff && filters.preferredStaff.length > 0) {
          const preferredIds = client.preferences?.preferredStaffIds || [];
          if (!filters.preferredStaff.some(id => preferredIds.includes(id))) return false;
        }

        // Last visit range filter
        if (filters.lastVisitRange && client.visitSummary?.lastVisitDate) {
          const lastVisit = new Date(client.visitSummary.lastVisitDate);
          const now = new Date();
          const daysSinceVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

          switch (filters.lastVisitRange) {
            case 'week': if (daysSinceVisit > 7) return false; break;
            case 'month': if (daysSinceVisit > 30) return false; break;
            case 'quarter': if (daysSinceVisit > 90) return false; break;
            case 'year': if (daysSinceVisit > 365) return false; break;
            case 'over_year': if (daysSinceVisit <= 365) return false; break;
          }
        }

        return true;
      };

      // Use Dexie .filter() on indexed collection (more efficient than .toArray().filter())
      // This allows Dexie to skip non-matching items without full deserialization
      const collection = db.clients.where('storeId').equals(storeId);
      const filteredCollection = collection.filter(filterFn);

      // Get total count of filtered results (Dexie counts efficiently)
      const total = await filteredCollection.count();

      // Sort and paginate
      // Note: Dexie doesn't support custom sort on filtered collections,
      // so we need to retrieve all filtered results for sorting
      const allFiltered = await filteredCollection.toArray();

      allFiltered.sort((a, b) => {
        let aVal: string | number | undefined;
        let bVal: string | number | undefined;

        switch (sort.field) {
          case 'name':
            aVal = `${a.lastName} ${a.firstName}`.toLowerCase();
            bVal = `${b.lastName} ${b.firstName}`.toLowerCase();
            break;
          case 'lastVisit':
            aVal = a.visitSummary?.lastVisitDate || '';
            bVal = b.visitSummary?.lastVisitDate || '';
            break;
          case 'totalSpent':
            aVal = a.visitSummary?.totalSpent || 0;
            bVal = b.visitSummary?.totalSpent || 0;
            break;
          case 'visitCount':
            aVal = a.visitSummary?.totalVisits || 0;
            bVal = b.visitSummary?.totalVisits || 0;
            break;
          case 'createdAt':
            aVal = a.createdAt;
            bVal = b.createdAt;
            break;
          default:
            aVal = `${a.lastName} ${a.firstName}`.toLowerCase();
            bVal = `${b.lastName} ${b.firstName}`.toLowerCase();
        }

        if (aVal === undefined || aVal === null) return sort.order === 'asc' ? 1 : -1;
        if (bVal === undefined || bVal === null) return sort.order === 'asc' ? -1 : 1;

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sort.order === 'asc' ? comparison : -comparison;
      });

      const paginatedResults = allFiltered.slice(offset, offset + limit);

      return { clients: paginatedResults, total };
    });
  },

  // Blocking operations (PRD 2.3.2)
  async getBlocked(storeId: string, limit = 100): Promise<Client[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];

    return await db.clients
      .where('[storeId+isBlocked]')
      .equals([storeId, 1]) // Dexie stores booleans as 1/0
      .limit(limit)
      .toArray();
  },

  async block(
    id: string,
    reason: BlockReason,
    blockedBy: string,
    note?: string
  ): Promise<Client | undefined> {
    return await this.update(id, {
      isBlocked: true,
      blockedAt: new Date().toISOString(),
      blockedBy,
      blockReason: reason,
      blockReasonNote: note,
    });
  },

  async unblock(id: string): Promise<Client | undefined> {
    return await this.update(id, {
      isBlocked: false,
      blockedAt: undefined,
      blockedBy: undefined,
      blockReason: undefined,
      blockReasonNote: undefined,
    });
  },

  // Staff Alert operations (PRD 2.3.1)
  async setStaffAlert(
    id: string,
    message: string,
    createdBy: string,
    createdByName?: string
  ): Promise<Client | undefined> {
    const alert: StaffAlert = {
      message,
      createdAt: new Date().toISOString(),
      createdBy,
      createdByName,
    };
    return await this.update(id, { staffAlert: alert });
  },

  async clearStaffAlert(id: string): Promise<Client | undefined> {
    return await this.update(id, { staffAlert: undefined });
  },

  // VIP operations
  async getVips(storeId: string, limit = 100): Promise<Client[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];

    return await db.clients
      .where('[storeId+isVip]')
      .equals([storeId, 1])
      .limit(limit)
      .toArray();
  },

  async setVipStatus(id: string, isVip: boolean): Promise<Client | undefined> {
    return await this.update(id, { isVip });
  },

  // Bulk operations
  async bulkUpdate(
    ids: string[],
    updates: Partial<Client>
  ): Promise<BulkOperationResult> {
    const errors: { clientId: string; error: string }[] = [];
    let processedCount = 0;

    for (const id of ids) {
      try {
        const result = await this.update(id, updates);
        if (result) {
          processedCount++;
        } else {
          errors.push({ clientId: id, error: 'Client not found' });
        }
      } catch (error) {
        errors.push({ clientId: id, error: String(error) });
      }
    }

    return {
      success: errors.length === 0,
      processedCount,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  async bulkDelete(ids: string[]): Promise<BulkOperationResult> {
    const errors: { clientId: string; error: string }[] = [];
    let processedCount = 0;

    for (const id of ids) {
      try {
        const success = await this.delete(id);
        if (success) {
          processedCount++;
        } else {
          errors.push({ clientId: id, error: 'Client not found' });
        }
      } catch (error) {
        errors.push({ clientId: id, error: String(error) });
      }
    }

    return {
      success: errors.length === 0,
      processedCount,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  // Statistics
  async getCount(storeId: string): Promise<number> {
    return await db.clients.where('storeId').equals(storeId).count();
  },

  async getStats(storeId: string): Promise<{
    total: number;
    blocked: number;
    vip: number;
    newThisMonth: number;
  }> {
    const clients = await db.clients.where('storeId').equals(storeId).toArray();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    return {
      total: clients.length,
      blocked: clients.filter(c => c.isBlocked).length,
      vip: clients.filter(c => c.isVip).length,
      newThisMonth: clients.filter(c => c.createdAt >= monthStart).length,
    };
  },
};

// ==================== SERVICES ====================

export const servicesDB = {
  async getAll(storeId: string, limit = 200, offset = 0): Promise<Service[]> {
    return await db.services
      .where('storeId')
      .equals(storeId)
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Service | undefined> {
    return await db.services.get(id);
  },

  async getByCategory(storeId: string, category: string, limit = 100): Promise<Service[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId || !category) return [];

    return await db.services
      .where('[storeId+category]')
      .equals([storeId, category])
      .limit(limit)
      .toArray();
  },

  async create(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Service> {
    const now = new Date().toISOString();
    const newService: Service = {
      id: uuidv4(),
      ...service,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };
    await db.services.add(newService);
    return newService;
  },

  async update(id: string, updates: Partial<Service>): Promise<Service | undefined> {
    const service = await db.services.get(id);
    if (!service) return undefined;

    const updatedService: Service = {
      ...service,
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: 'local',
    };
    await db.services.put(updatedService);
    return updatedService;
  },

  async delete(id: string): Promise<boolean> {
    const service = await db.services.get(id);
    if (!service) return false;
    await db.services.delete(id);
    return true;
  },
};

// ==================== SYNC QUEUE ====================

export const syncQueueDB = {
  async getAll(limit = 100, offset = 0): Promise<SyncOperation[]> {
    return await db.syncQueue
      .orderBy('priority')
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getPending(limit = 50): Promise<SyncOperation[]> {
    return await db.syncQueue
      .where('status')
      .equals('pending')
      .limit(limit)
      .sortBy('priority');
  },

  async add(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'attempts' | 'status'>): Promise<SyncOperation> {
    const syncOp: SyncOperation = {
      id: uuidv4(),
      ...operation,
      createdAt: new Date(),
      attempts: 0,
      status: 'pending',
    };

    await db.syncQueue.add(syncOp);
    return syncOp;
  },

  async update(id: string, updates: Partial<SyncOperation>): Promise<void> {
    await db.syncQueue.update(id, updates);
  },

  async remove(id: string): Promise<void> {
    await db.syncQueue.delete(id);
  },

  async clear(): Promise<void> {
    await db.syncQueue.clear();
  },
};

// ==================== SETTINGS ====================

export const settingsDB = {
  async get(key: string): Promise<any> {
    const setting = await db.settings.get(key);
    return setting?.value;
  },

  async set(key: string, value: any): Promise<void> {
    await db.settings.put({ key, value });
  },

  async remove(key: string): Promise<void> {
    await db.settings.delete(key);
  },
};

// ==================== PATCH TESTS (PRD 2.3.3) ====================

export const patchTestsDB = {
  async getByClientId(clientId: string): Promise<PatchTest[]> {
    return await db.patchTests
      .where('clientId')
      .equals(clientId)
      .toArray();
  },

  async getById(id: string): Promise<PatchTest | undefined> {
    return await db.patchTests.get(id);
  },

  async getValidForService(clientId: string, serviceId: string): Promise<PatchTest | undefined> {
    // Guard: return undefined if clientId or serviceId is invalid (prevents IDBKeyRange.bound error)
    if (!clientId || !serviceId) return undefined;

    const now = new Date().toISOString();
    const tests = await db.patchTests
      .where('[clientId+serviceId]')
      .equals([clientId, serviceId])
      .toArray();

    return tests.find(t => t.result === 'pass' && t.expiresAt > now);
  },

  async getExpiring(clientId: string, daysAhead = 7): Promise<PatchTest[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

    return await db.patchTests
      .where('clientId')
      .equals(clientId)
      .and(t => t.result === 'pass' && t.expiresAt <= futureDate && t.expiresAt > now.toISOString())
      .toArray();
  },

  async create(patchTest: Omit<PatchTest, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<PatchTest> {
    const now = new Date().toISOString();
    const newPatchTest: PatchTest = {
      id: uuidv4(),
      ...patchTest,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };

    await db.patchTests.add(newPatchTest);
    return newPatchTest;
  },

  async update(id: string, updates: Partial<PatchTest>): Promise<PatchTest | undefined> {
    const patchTest = await db.patchTests.get(id);
    if (!patchTest) return undefined;

    const updated: PatchTest = {
      ...patchTest,
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    await db.patchTests.put(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await db.patchTests.delete(id);
    return true;
  },
};

// ==================== FORM TEMPLATES (PRD 2.3.4) ====================

export const formTemplatesDB = {
  async getAll(storeId: string, activeOnly = true): Promise<FormTemplate[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];

    if (activeOnly) {
      return await db.formTemplates
        .where('[storeId+isActive]')
        .equals([storeId, 1])
        .toArray();
    }
    return await db.formTemplates
      .where('storeId')
      .equals(storeId)
      .toArray();
  },

  async getActiveByStore(storeId: string): Promise<FormTemplate[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];

    return await db.formTemplates
      .where('[storeId+isActive]')
      .equals([storeId, 1])
      .toArray();
  },

  async getById(id: string): Promise<FormTemplate | undefined> {
    return await db.formTemplates.get(id);
  },

  async getByServiceId(storeId: string, serviceId: string): Promise<FormTemplate[]> {
    return await db.formTemplates
      .where('storeId')
      .equals(storeId)
      .and(t => t.isActive && (t.linkedServiceIds?.includes(serviceId) ?? false))
      .toArray();
  },

  async create(template: Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<FormTemplate> {
    const now = new Date().toISOString();
    const newTemplate: FormTemplate = {
      id: uuidv4(),
      ...template,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };

    await db.formTemplates.add(newTemplate);
    return newTemplate;
  },

  async update(id: string, updates: Partial<FormTemplate>): Promise<FormTemplate | undefined> {
    const template = await db.formTemplates.get(id);
    if (!template) return undefined;

    const updated: FormTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    await db.formTemplates.put(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    await db.formTemplates.delete(id);
    return true;
  },
};

// ==================== FORM RESPONSES (PRD 2.3.4) ====================

export const formResponsesDB = {
  async getByClientId(clientId: string, limit = 50): Promise<ClientFormResponse[]> {
    return await db.formResponses
      .where('clientId')
      .equals(clientId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<ClientFormResponse | undefined> {
    return await db.formResponses.get(id);
  },

  async getPending(clientId: string): Promise<ClientFormResponse[]> {
    // Guard: return empty array if clientId is invalid (prevents IDBKeyRange.bound error)
    if (!clientId) return [];

    return await db.formResponses
      .where('[clientId+status]')
      .equals([clientId, 'pending'])
      .toArray();
  },

  async getByAppointmentId(appointmentId: string): Promise<ClientFormResponse[]> {
    return await db.formResponses
      .where('appointmentId')
      .equals(appointmentId)
      .toArray();
  },

  async create(response: Omit<ClientFormResponse, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<ClientFormResponse> {
    const now = new Date().toISOString();
    const newResponse: ClientFormResponse = {
      id: uuidv4(),
      ...response,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };

    await db.formResponses.add(newResponse);
    return newResponse;
  },

  async update(id: string, updates: Partial<ClientFormResponse>): Promise<ClientFormResponse | undefined> {
    const response = await db.formResponses.get(id);
    if (!response) return undefined;

    const updated: ClientFormResponse = {
      ...response,
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    await db.formResponses.put(updated);
    return updated;
  },

  async complete(id: string, responses: Record<string, any>, completedBy: string, signatureImage?: string): Promise<ClientFormResponse | undefined> {
    return await this.update(id, {
      responses,
      signatureImage,
      status: 'completed',
      completedAt: new Date().toISOString(),
      completedBy,
    });
  },
};

// ==================== REFERRALS (PRD 2.3.8) ====================

export const referralsDB = {
  async getByReferrerId(clientId: string): Promise<Referral[]> {
    return await db.referrals
      .where('referrerClientId')
      .equals(clientId)
      .toArray();
  },

  async getByReferredId(clientId: string): Promise<Referral | undefined> {
    return await db.referrals
      .where('referredClientId')
      .equals(clientId)
      .first();
  },

  async getById(id: string): Promise<Referral | undefined> {
    return await db.referrals.get(id);
  },

  async getByCode(code: string): Promise<Referral | undefined> {
    // Use filter instead of index since referralLinkCode is not indexed
    return await db.referrals
      .filter(r => r.referralLinkCode === code)
      .first();
  },

  async create(referral: Omit<Referral, 'id' | 'createdAt' | 'syncStatus'>): Promise<Referral> {
    const now = new Date().toISOString();
    const newReferral: Referral = {
      id: uuidv4(),
      ...referral,
      createdAt: now,
      syncStatus: 'local',
    };

    await db.referrals.add(newReferral);
    return newReferral;
  },

  async update(id: string, updates: Partial<Referral>): Promise<Referral | undefined> {
    const referral = await db.referrals.get(id);
    if (!referral) return undefined;

    const updated: Referral = {
      ...referral,
      ...updates,
      syncStatus: 'local',
    };

    await db.referrals.put(updated);
    return updated;
  },

  async completeReferral(id: string, appointmentId: string): Promise<Referral | undefined> {
    return await this.update(id, {
      firstAppointmentId: appointmentId,
      completedAt: new Date().toISOString(),
    });
  },
};

// ==================== CLIENT REVIEWS (PRD 2.3.9) ====================

export const clientReviewsDB = {
  async getByClientId(clientId: string, limit = 50): Promise<ClientReview[]> {
    return await db.clientReviews
      .where('clientId')
      .equals(clientId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<ClientReview | undefined> {
    return await db.clientReviews.get(id);
  },

  async getByStaffId(staffId: string, limit = 100): Promise<ClientReview[]> {
    return await db.clientReviews
      .where('staffId')
      .equals(staffId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async create(review: Omit<ClientReview, 'id' | 'createdAt' | 'syncStatus'>): Promise<ClientReview> {
    const newReview: ClientReview = {
      id: uuidv4(),
      ...review,
      createdAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    await db.clientReviews.add(newReview);
    return newReview;
  },

  async addResponse(id: string, response: string): Promise<ClientReview | undefined> {
    const review = await db.clientReviews.get(id);
    if (!review) return undefined;

    const updated: ClientReview = {
      ...review,
      staffResponse: response,
      respondedAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    await db.clientReviews.put(updated);
    return updated;
  },

  async update(id: string, updates: Partial<ClientReview>): Promise<ClientReview | undefined> {
    const review = await db.clientReviews.get(id);
    if (!review) return undefined;

    const updated: ClientReview = {
      ...review,
      ...updates,
      syncStatus: 'local',
    };

    await db.clientReviews.put(updated);
    return updated;
  },
};

// ==================== LOYALTY REWARDS (PRD 2.3.7) ====================

export const loyaltyRewardsDB = {
  async getByClientId(clientId: string, includeRedeemed = false): Promise<LoyaltyReward[]> {
    const rewards = await db.loyaltyRewards
      .where('clientId')
      .equals(clientId)
      .toArray();

    if (includeRedeemed) return rewards;
    return rewards.filter(r => !r.redeemedAt);
  },

  async getById(id: string): Promise<LoyaltyReward | undefined> {
    return await db.loyaltyRewards.get(id);
  },

  async getAvailable(clientId: string): Promise<LoyaltyReward[]> {
    const now = new Date().toISOString();
    const rewards = await db.loyaltyRewards
      .where('clientId')
      .equals(clientId)
      .toArray();

    return rewards.filter(r => !r.redeemedAt && (!r.expiresAt || r.expiresAt > now));
  },

  async create(reward: Omit<LoyaltyReward, 'id' | 'createdAt' | 'syncStatus'>): Promise<LoyaltyReward> {
    const newReward: LoyaltyReward = {
      id: uuidv4(),
      ...reward,
      createdAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    await db.loyaltyRewards.add(newReward);
    return newReward;
  },

  async redeem(id: string): Promise<LoyaltyReward | undefined> {
    const reward = await db.loyaltyRewards.get(id);
    if (!reward) return undefined;

    const updated: LoyaltyReward = {
      ...reward,
      redeemedAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    await db.loyaltyRewards.put(updated);
    return updated;
  },
};

// ==================== REVIEW REQUESTS (PRD 2.3.9) ====================

export const reviewRequestsDB = {
  async getById(id: string): Promise<ReviewRequest | undefined> {
    return await db.reviewRequests.get(id);
  },

  async getByClientId(clientId: string, limit = 50): Promise<ReviewRequest[]> {
    return await db.reviewRequests
      .where('clientId')
      .equals(clientId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getBySalonId(storeId: string, limit = 100): Promise<ReviewRequest[]> {
    return await db.reviewRequests
      .where('storeId')
      .equals(storeId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async getByStatus(storeId: string, status: ReviewRequestStatus, limit = 100): Promise<ReviewRequest[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];

    return await db.reviewRequests
      .where('[storeId+status]')
      .equals([storeId, status])
      .limit(limit)
      .toArray();
  },

  async getPendingByClient(clientId: string): Promise<ReviewRequest[]> {
    // Guard: return empty array if clientId is invalid (prevents IDBKeyRange.bound error)
    if (!clientId) return [];

    return await db.reviewRequests
      .where('[clientId+status]')
      .equals([clientId, 'pending'])
      .toArray();
  },

  async getByAppointmentId(appointmentId: string): Promise<ReviewRequest | undefined> {
    return await db.reviewRequests
      .where('appointmentId')
      .equals(appointmentId)
      .first();
  },

  async getByStaffId(staffId: string, limit = 100): Promise<ReviewRequest[]> {
    return await db.reviewRequests
      .where('staffId')
      .equals(staffId)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async create(request: Omit<ReviewRequest, 'id' | 'createdAt' | 'syncStatus'>): Promise<ReviewRequest> {
    const newRequest: ReviewRequest = {
      id: uuidv4(),
      ...request,
      createdAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    await db.reviewRequests.add(newRequest);
    return newRequest;
  },

  async update(id: string, updates: Partial<ReviewRequest>): Promise<ReviewRequest | undefined> {
    const request = await db.reviewRequests.get(id);
    if (!request) return undefined;

    const updated: ReviewRequest = {
      ...request,
      ...updates,
      syncStatus: 'local',
    };

    await db.reviewRequests.put(updated);
    return updated;
  },

  async markSent(id: string, sentVia: 'email' | 'sms' | 'both'): Promise<ReviewRequest | undefined> {
    return await this.update(id, {
      status: 'sent',
      sentVia,
      sentAt: new Date().toISOString(),
    });
  },

  async markOpened(id: string): Promise<ReviewRequest | undefined> {
    return await this.update(id, {
      status: 'opened',
      openedAt: new Date().toISOString(),
    });
  },

  async markCompleted(id: string, reviewId: string): Promise<ReviewRequest | undefined> {
    return await this.update(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      reviewId,
    });
  },

  async markExpired(id: string): Promise<ReviewRequest | undefined> {
    return await this.update(id, {
      status: 'expired',
    });
  },

  async addReminder(id: string): Promise<ReviewRequest | undefined> {
    const request = await db.reviewRequests.get(id);
    if (!request) return undefined;

    return await this.update(id, {
      reminderCount: request.reminderCount + 1,
      lastReminderAt: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<boolean> {
    await db.reviewRequests.delete(id);
    return true;
  },

  /**
   * Get requests that need reminders sent
   */
  async getNeedingReminder(storeId: string, maxReminders = 1): Promise<ReviewRequest[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];

    const requests = await db.reviewRequests
      .where('[storeId+status]')
      .equals([storeId, 'sent'])
      .toArray();

    return requests.filter(r => r.reminderCount < maxReminders);
  },

  /**
   * Get expired requests that need status update
   */
  async getExpired(storeId: string): Promise<ReviewRequest[]> {
    const now = new Date().toISOString();
    const requests = await db.reviewRequests
      .where('storeId')
      .equals(storeId)
      .and(r => r.status !== 'completed' && r.status !== 'expired' && r.expiresAt < now)
      .toArray();

    return requests;
  },

  /**
   * Count requests for a client in a time period
   */
  async countRecentByClient(clientId: string, daysBack = 30): Promise<number> {
    const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
    const requests = await db.reviewRequests
      .where('clientId')
      .equals(clientId)
      .and(r => r.createdAt > cutoff)
      .count();

    return requests;
  },
};

// ==================== CUSTOM SEGMENTS (PRD 2.3.10) ====================

export const customSegmentsDB = {
  async getById(id: string): Promise<CustomSegment | undefined> {
    return await db.customSegments.get(id);
  },

  async getBySalonId(storeId: string, activeOnly = true): Promise<CustomSegment[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];
    if (activeOnly) {
      return await db.customSegments
        .where('[storeId+isActive]')
        .equals([storeId, 1])
        .toArray();
    }
    return await db.customSegments
      .where('storeId')
      .equals(storeId)
      .toArray();
  },

  async getActive(storeId: string): Promise<CustomSegment[]> {
    // Guard: return empty array if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return [];
    return await db.customSegments
      .where('[storeId+isActive]')
      .equals([storeId, 1])
      .toArray();
  },

  async getByName(storeId: string, name: string): Promise<CustomSegment | undefined> {
    return await db.customSegments
      .where('storeId')
      .equals(storeId)
      .and(s => s.name.toLowerCase() === name.toLowerCase())
      .first();
  },

  async create(segment: Omit<CustomSegment, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<CustomSegment> {
    const now = new Date().toISOString();
    const newSegment: CustomSegment = {
      id: uuidv4(),
      ...segment,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };

    await db.customSegments.add(newSegment);
    return newSegment;
  },

  async update(id: string, updates: Partial<CustomSegment>): Promise<CustomSegment | undefined> {
    const segment = await db.customSegments.get(id);
    if (!segment) return undefined;

    const updated: CustomSegment = {
      ...segment,
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    await db.customSegments.put(updated);
    return updated;
  },

  async updateFilters(id: string, filters: SegmentFilterGroup): Promise<CustomSegment | undefined> {
    return await this.update(id, { filters });
  },

  async activate(id: string): Promise<CustomSegment | undefined> {
    return await this.update(id, { isActive: true });
  },

  async deactivate(id: string): Promise<CustomSegment | undefined> {
    return await this.update(id, { isActive: false });
  },

  async delete(id: string): Promise<boolean> {
    await db.customSegments.delete(id);
    return true;
  },

  async duplicate(id: string, newName: string, createdBy: string): Promise<CustomSegment | undefined> {
    const segment = await db.customSegments.get(id);
    if (!segment) return undefined;

    const now = new Date().toISOString();
    const newSegment: CustomSegment = {
      ...segment,
      id: uuidv4(),
      name: newName,
      createdBy,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };

    await db.customSegments.add(newSegment);
    return newSegment;
  },

  async getCount(storeId: string): Promise<number> {
    return await db.customSegments.where('storeId').equals(storeId).count();
  },

  async getActiveCount(storeId: string): Promise<number> {
    // Guard: return 0 if storeId is invalid (prevents IDBKeyRange.bound error)
    if (!storeId) return 0;
    return await db.customSegments
      .where('[storeId+isActive]')
      .equals([storeId, 1])
      .count();
  },
};

// ==================== DATABASE STATS ====================

/**
 * Get database statistics (counts)
 * Used by OfflineIndicator to show sync status
 */
export async function getDBStats() {
  const [appointmentCount, ticketCount, transactionCount, staffCount, clientCount, serviceCount, queueCount] = await Promise.all([
    db.appointments.count(),
    db.tickets.count(),
    db.transactions.count(),
    db.staff.count(),
    db.clients.count(),
    db.services.count(),
    db.syncQueue.count(),
  ]);

  return {
    appointments: appointmentCount,
    tickets: ticketCount,
    transactions: transactionCount,
    staff: staffCount,
    clients: clientCount,
    services: serviceCount,
    pendingSync: queueCount,
  };
}

// Re-export catalog database operations
export * from './catalogDatabase';

// Re-export gift card database operations (for syncManager)
export { giftCardDB as giftCardsDB } from './giftCardOperations';
