import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import { TAX_RATE } from '../constants/checkoutConfig';
import type {
  Appointment,
  CreateAppointmentInput,
  Ticket,
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
  async getAll(salonId: string, limit: number = 100, offset: number = 0): Promise<Appointment[]> {
    return await db.appointments
      .where('salonId')
      .equals(salonId)
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Appointment | undefined> {
    return await db.appointments.get(id);
  },

  async getByDate(salonId: string, date: Date, limit: number = 200): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db.appointments
      .where('salonId')
      .equals(salonId)
      .and(apt =>
        apt.scheduledStartTime >= startOfDay &&
        apt.scheduledStartTime <= endOfDay
      )
      .limit(limit)
      .toArray();
  },

  async getByStatus(salonId: string, status: string, limit: number = 100, offset: number = 0): Promise<Appointment[]> {
    return await db.appointments
      .where('[salonId+status]')
      .equals([salonId, status])
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async create(input: CreateAppointmentInput, userId: string, salonId: string): Promise<Appointment> {
    const now = new Date();
    const appointment: Appointment = {
      id: uuidv4(),
      salonId,
      ...input,
      status: 'scheduled',
      scheduledEndTime: new Date(
        input.scheduledStartTime.getTime() + 
        input.services.reduce((sum, s) => sum + s.duration, 0) * 60000
      ),
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      lastModifiedBy: userId,
      syncStatus: 'local',
    };

    await db.appointments.add(appointment);
    return appointment;
  },

  async update(id: string, updates: Partial<Appointment>, userId: string): Promise<Appointment | undefined> {
    const appointment = await db.appointments.get(id);
    if (!appointment) return undefined;

    const updated: Appointment = {
      ...appointment,
      ...updates,
      updatedAt: new Date(),
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
      checkInTime: new Date(),
    }, userId);
  },
};

// ==================== TICKETS ====================

export const ticketsDB = {
  async getAll(salonId: string, limit: number = 100, offset: number = 0): Promise<Ticket[]> {
    return await db.tickets
      .where('salonId')
      .equals(salonId)
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Ticket | undefined> {
    return await db.tickets.get(id);
  },

  async getByStatus(salonId: string, status: string, limit: number = 100, offset: number = 0): Promise<Ticket[]> {
    return await db.tickets
      .where('[salonId+status]')
      .equals([salonId, status])
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getActive(salonId: string, limit: number = 100): Promise<Ticket[]> {
    return await db.tickets
      .where('salonId')
      .equals(salonId)
      .and(ticket => ['in-service', 'pending'].includes(ticket.status))
      .limit(limit)
      .toArray();
  },

  async create(input: CreateTicketInput, userId: string, salonId: string): Promise<Ticket> {
    const now = new Date();
    const subtotal = input.services.reduce((sum, s) => sum + s.price, 0) +
                    (input.products?.reduce((sum, p) => sum + p.total, 0) || 0);
    
    const ticket: Ticket = {
      id: uuidv4(),
      salonId,
      ...input,
      products: input.products || [],
      status: 'in-service',
      subtotal,
      discount: 0,
      tax: Math.round(subtotal * TAX_RATE * 100) / 100,
      tip: 0,
      total: Math.round(subtotal * (1 + TAX_RATE) * 100) / 100,
      payments: [],
      createdAt: now,
      createdBy: userId,
      lastModifiedBy: userId,
      syncStatus: 'local',
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

  async complete(id: string, userId: string): Promise<Ticket | undefined> {
    return await this.update(id, {
      status: 'completed',
      completedAt: new Date(),
    }, userId);
  },
};

// ==================== TRANSACTIONS ====================

export const transactionsDB = {
  async getAll(salonId: string, limit: number = 100, offset: number = 0): Promise<Transaction[]> {
    return await db.transactions
      .where('salonId')
      .equals(salonId)
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Transaction | undefined> {
    return await db.transactions.get(id);
  },

  async getByDateRange(salonId: string, startDate: Date, endDate: Date, limit: number = 100): Promise<Transaction[]> {
    return await db.transactions
      .where('salonId')
      .equals(salonId)
      .and(txn => txn.createdAt >= startDate && txn.createdAt <= endDate)
      .reverse()
      .limit(limit)
      .toArray();
  },

  async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'syncStatus'>): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: uuidv4(),
      ...transaction,
      createdAt: new Date(),
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
};

// ==================== STAFF ====================

export const staffDB = {
  async getAll(salonId: string, limit: number = 100, offset: number = 0): Promise<Staff[]> {
    return await db.staff
      .where('salonId')
      .equals(salonId)
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Staff | undefined> {
    return await db.staff.get(id);
  },

  async getAvailable(salonId: string, limit: number = 100): Promise<Staff[]> {
    return await db.staff
      .where('[salonId+status]')
      .equals([salonId, 'available'])
      .limit(limit)
      .toArray();
  },

  async update(id: string, updates: Partial<Staff>): Promise<Staff | undefined> {
    const staff = await db.staff.get(id);
    if (!staff) return undefined;

    const updated: Staff = {
      ...staff,
      ...updates,
      updatedAt: new Date(),
      syncStatus: 'local',
    };

    await db.staff.put(updated);
    return updated;
  },

  async clockIn(id: string): Promise<Staff | undefined> {
    return await this.update(id, {
      status: 'available',
      clockedInAt: new Date(),
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
  async getAll(salonId: string, limit: number = 100, offset: number = 0): Promise<Client[]> {
    return await db.clients
      .where('salonId')
      .equals(salonId)
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

  async search(salonId: string, query: string, limit: number = 50): Promise<Client[]> {
    const lowerQuery = query.toLowerCase();
    return await db.clients
      .where('salonId')
      .equals(salonId)
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
    salonId: string,
    filters: ClientFilters,
    sort: ClientSortOptions = { field: 'name', order: 'asc' },
    limit: number = 100,
    offset: number = 0
  ): Promise<{ clients: Client[]; total: number }> {
    let collection = db.clients.where('salonId').equals(salonId);

    // Apply filters
    const filteredClients = await collection.toArray();
    let results = filteredClients.filter(client => {
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
    });

    // Sort results
    results.sort((a, b) => {
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

    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return { clients: paginatedResults, total };
  },

  // Blocking operations (PRD 2.3.2)
  async getBlocked(salonId: string, limit: number = 100): Promise<Client[]> {
    return await db.clients
      .where('[salonId+isBlocked]')
      .equals([salonId, 1]) // Dexie stores booleans as 1/0
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
  async getVips(salonId: string, limit: number = 100): Promise<Client[]> {
    return await db.clients
      .where('[salonId+isVip]')
      .equals([salonId, 1])
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
  async getCount(salonId: string): Promise<number> {
    return await db.clients.where('salonId').equals(salonId).count();
  },

  async getStats(salonId: string): Promise<{
    total: number;
    blocked: number;
    vip: number;
    newThisMonth: number;
  }> {
    const clients = await db.clients.where('salonId').equals(salonId).toArray();
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
  async getAll(salonId: string, limit: number = 200, offset: number = 0): Promise<Service[]> {
    return await db.services
      .where('salonId')
      .equals(salonId)
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getById(id: string): Promise<Service | undefined> {
    return await db.services.get(id);
  },

  async getByCategory(salonId: string, category: string, limit: number = 100): Promise<Service[]> {
    return await db.services
      .where('[salonId+category]')
      .equals([salonId, category])
      .limit(limit)
      .toArray();
  },
};

// ==================== SYNC QUEUE ====================

export const syncQueueDB = {
  async getAll(limit: number = 100, offset: number = 0): Promise<SyncOperation[]> {
    return await db.syncQueue
      .orderBy('priority')
      .offset(offset)
      .limit(limit)
      .toArray();
  },

  async getPending(limit: number = 50): Promise<SyncOperation[]> {
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
    const now = new Date().toISOString();
    const tests = await db.patchTests
      .where('[clientId+serviceId]')
      .equals([clientId, serviceId])
      .toArray();

    return tests.find(t => t.result === 'pass' && t.expiresAt > now);
  },

  async getExpiring(clientId: string, daysAhead: number = 7): Promise<PatchTest[]> {
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
  async getAll(storeId: string, activeOnly: boolean = true): Promise<FormTemplate[]> {
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
  async getByClientId(clientId: string, limit: number = 50): Promise<ClientFormResponse[]> {
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
    return await db.referrals
      .where('referralLinkCode')
      .equals(code)
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
  async getByClientId(clientId: string, limit: number = 50): Promise<ClientReview[]> {
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

  async getByStaffId(staffId: string, limit: number = 100): Promise<ClientReview[]> {
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
};

// ==================== LOYALTY REWARDS (PRD 2.3.7) ====================

export const loyaltyRewardsDB = {
  async getByClientId(clientId: string, includeRedeemed: boolean = false): Promise<LoyaltyReward[]> {
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
