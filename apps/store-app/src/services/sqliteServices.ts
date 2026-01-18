/**
 * SQLite Services Wrapper
 *
 * Provides lazy initialization and Dexie-compatible interfaces for SQLite services.
 * This module bridges the gap between the SQLite services in @mango/sqlite-adapter
 * and the dataService interface expected by the app.
 *
 * Key features:
 * - Lazy initialization: Services are created only when first accessed
 * - Dexie-compatible API: Method signatures match existing Dexie DB operations
 * - Single initialization point: All services share one SQLiteAdapter instance
 *
 * Note: Type conversions use 'unknown' intermediate casts because the SQLite adapter
 * types and app types are structurally compatible but TypeScript can't verify this
 * at compile time due to separate type definitions.
 *
 * @module store-app/services/sqliteServices
 */

import type { Client, Staff, Service, Appointment, Ticket, Transaction } from '@/types';
import type {
  PatchTest as AppPatchTest,
  ClientFormResponse as AppFormResponse,
  Referral as AppReferral,
  ClientReview as AppClientReview,
  LoyaltyReward as AppLoyaltyReward,
  ReviewRequest as AppReviewRequest,
  ReviewRequestStatus as AppReviewRequestStatus,
  CustomSegment as AppCustomSegment,
  SegmentFilterGroup as AppSegmentFilterGroup,
} from '@/types';
import type { SQLiteAdapter, SQLiteConfig, Migration } from '@mango/sqlite-adapter';
import {
  createSQLiteAdapter,
  runMigrations,
  migration_001,
  migration_002,
  ClientSQLiteService,
  TicketSQLiteService,
  AppointmentSQLiteService,
  TransactionSQLiteService,
  StaffSQLiteService,
  ServiceSQLiteService,
  SettingsSQLiteService,
  SyncQueueSQLiteService,
  // Team member service
  TeamMemberSQLiteService,
  // CRM services
  PatchTestSQLiteService,
  FormResponseSQLiteService,
  ReferralSQLiteService,
  ClientReviewSQLiteService,
  LoyaltyRewardSQLiteService,
  ReviewRequestSQLiteService,
  CustomSegmentSQLiteService,
} from '@mango/sqlite-adapter';

// All migrations to run
const ALL_MIGRATIONS: Migration[] = [
  migration_001,
  migration_002,
];

// State
let _adapter: SQLiteAdapter | null = null;
let _initPromise: Promise<void> | null = null;
let _initLogged = false;

// Service instances (lazy initialized)
let _clientsService: ClientSQLiteService | null = null;
let _ticketsService: TicketSQLiteService | null = null;
let _appointmentsService: AppointmentSQLiteService | null = null;
let _transactionsService: TransactionSQLiteService | null = null;
let _staffService: StaffSQLiteService | null = null;
let _servicesService: ServiceSQLiteService | null = null;
let _settingsService: SettingsSQLiteService | null = null;
let _syncQueueService: SyncQueueSQLiteService | null = null;

// Team and CRM service instances
let _teamMemberService: TeamMemberSQLiteService | null = null;
let _patchTestService: PatchTestSQLiteService | null = null;
let _formResponseService: FormResponseSQLiteService | null = null;
let _referralService: ReferralSQLiteService | null = null;
let _clientReviewService: ClientReviewSQLiteService | null = null;
let _loyaltyRewardService: LoyaltyRewardSQLiteService | null = null;
let _reviewRequestService: ReviewRequestSQLiteService | null = null;
let _customSegmentService: CustomSegmentSQLiteService | null = null;

/**
 * Initialize SQLite adapter and services
 * This is called once on first service access
 */
async function initializeSQLite(): Promise<void> {
  if (_adapter) return;

  // Prevent multiple initialization attempts
  if (_initPromise) {
    await _initPromise;
    return;
  }

  _initPromise = (async () => {
    // Create adapter with default config
    const config: Partial<SQLiteConfig> = {
      dbName: 'mango_pos',
    };
    _adapter = await createSQLiteAdapter(config);

    // Run migrations
    await runMigrations(_adapter, ALL_MIGRATIONS);

    // Log backend selection (once)
    if (!_initLogged) {
      console.log('[DataService] SQLite backend initialized');
      _initLogged = true;
    }
  })();

  await _initPromise;
}

/**
 * Get the SQLite adapter (initializes if needed)
 */
async function getAdapter(): Promise<SQLiteAdapter> {
  if (!_adapter) {
    await initializeSQLite();
  }
  return _adapter!;
}

// ==================== CLIENTS SERVICE ====================

/**
 * SQLite Clients Service with Dexie-compatible interface
 */
export const sqliteClientsDB = {
  async getAll(storeId: string): Promise<Client[]> {
    const adapter = await getAdapter();
    if (!_clientsService) {
      _clientsService = new ClientSQLiteService(adapter);
    }
    const clients = await _clientsService.getAll(storeId, 10000, 0);
    return clients as unknown as Client[];
  },

  async getById(id: string): Promise<Client | undefined> {
    const adapter = await getAdapter();
    if (!_clientsService) {
      _clientsService = new ClientSQLiteService(adapter);
    }
    const client = await _clientsService.getById(id);
    return client as unknown as Client | undefined;
  },

  async search(storeId: string, query: string): Promise<Client[]> {
    const adapter = await getAdapter();
    if (!_clientsService) {
      _clientsService = new ClientSQLiteService(adapter);
    }
    const clients = await _clientsService.search(storeId, query, 50);
    return clients as unknown as Client[];
  },

  async create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const adapter = await getAdapter();
    if (!_clientsService) {
      _clientsService = new ClientSQLiteService(adapter);
    }
    // Map to SQLite service expected format
    const sqliteClient = {
      ...client,
      isBlocked: client.isBlocked ?? false,
      isVip: client.isVip ?? false,
      syncStatus: 'local',
    } as unknown as Parameters<ClientSQLiteService['create']>[0];
    const created = await _clientsService.create(sqliteClient);
    return created as unknown as Client;
  },

  async update(id: string, updates: Partial<Client>): Promise<Client | null> {
    const adapter = await getAdapter();
    if (!_clientsService) {
      _clientsService = new ClientSQLiteService(adapter);
    }
    const updated = await _clientsService.update(id, updates as unknown as Parameters<ClientSQLiteService['update']>[1]);
    return (updated as unknown as Client) ?? null;
  },

  async delete(id: string): Promise<void> {
    const adapter = await getAdapter();
    if (!_clientsService) {
      _clientsService = new ClientSQLiteService(adapter);
    }
    await _clientsService.delete(id);
  },

  async getVips(storeId: string): Promise<Client[]> {
    const adapter = await getAdapter();
    if (!_clientsService) {
      _clientsService = new ClientSQLiteService(adapter);
    }
    const clients = await _clientsService.getVip(storeId, 100);
    return clients as unknown as Client[];
  },
};

// ==================== TICKETS SERVICE ====================

/**
 * SQLite Tickets Service with Dexie-compatible interface
 */
export const sqliteTicketsDB = {
  async getAll(storeId: string, limit = 500): Promise<Ticket[]> {
    const adapter = await getAdapter();
    if (!_ticketsService) {
      _ticketsService = new TicketSQLiteService(adapter);
    }
    const tickets = await _ticketsService.getAll(storeId, limit);
    return tickets as unknown as Ticket[];
  },

  async getById(id: string): Promise<Ticket | undefined> {
    const adapter = await getAdapter();
    if (!_ticketsService) {
      _ticketsService = new TicketSQLiteService(adapter);
    }
    const ticket = await _ticketsService.getById(id);
    return ticket as unknown as Ticket | undefined;
  },

  async getByDate(storeId: string, date: Date): Promise<Ticket[]> {
    const adapter = await getAdapter();
    if (!_ticketsService) {
      _ticketsService = new TicketSQLiteService(adapter);
    }
    const tickets = await _ticketsService.getByDate(storeId, date);
    return tickets as unknown as Ticket[];
  },

  async getActive(storeId: string): Promise<Ticket[]> {
    const adapter = await getAdapter();
    if (!_ticketsService) {
      _ticketsService = new TicketSQLiteService(adapter);
    }
    const tickets = await _ticketsService.getActive(storeId);
    return tickets as unknown as Ticket[];
  },

  async getByStatus(storeId: string, status: string): Promise<Ticket[]> {
    const adapter = await getAdapter();
    if (!_ticketsService) {
      _ticketsService = new TicketSQLiteService(adapter);
    }
    const tickets = await _ticketsService.getByStatus(storeId, status);
    return tickets as unknown as Ticket[];
  },

  async create(
    input: Parameters<typeof import('@/db/database').ticketsDB.create>[0],
    userId: string,
    storeId: string
  ): Promise<Ticket> {
    const adapter = await getAdapter();
    if (!_ticketsService) {
      _ticketsService = new TicketSQLiteService(adapter);
    }
    // TicketSQLiteService.create expects (ticket, userId) - storeId is part of ticket object
    const ticketInput = { ...input, storeId } as unknown as Parameters<TicketSQLiteService['create']>[0];
    const ticket = await _ticketsService.create(ticketInput, userId);
    return ticket as unknown as Ticket;
  },

  async update(id: string, updates: Partial<Ticket>, userId?: string): Promise<Ticket | undefined> {
    const adapter = await getAdapter();
    if (!_ticketsService) {
      _ticketsService = new TicketSQLiteService(adapter);
    }
    // TicketSQLiteService.update expects (id, updates, userId)
    const updated = await _ticketsService.update(id, updates as unknown as Parameters<TicketSQLiteService['update']>[1], userId ?? 'system');
    return updated as unknown as Ticket | undefined;
  },

  async delete(id: string): Promise<void> {
    const adapter = await getAdapter();
    if (!_ticketsService) {
      _ticketsService = new TicketSQLiteService(adapter);
    }
    await _ticketsService.delete(id);
  },

  async complete(id: string, userId: string): Promise<Ticket | undefined> {
    const adapter = await getAdapter();
    if (!_ticketsService) {
      _ticketsService = new TicketSQLiteService(adapter);
    }
    const completed = await _ticketsService.complete(id, userId);
    return completed as unknown as Ticket | undefined;
  },

  async getDrafts(storeId: string): Promise<Ticket[]> {
    const adapter = await getAdapter();
    if (!_ticketsService) {
      _ticketsService = new TicketSQLiteService(adapter);
    }
    const drafts = await _ticketsService.getDrafts(storeId);
    return drafts as unknown as Ticket[];
  },

  async createDraft(
    services: Ticket['services'],
    userId: string,
    storeId: string,
    clientInfo?: { clientId: string; clientName: string; clientPhone: string }
  ): Promise<Ticket> {
    const adapter = await getAdapter();
    if (!_ticketsService) {
      _ticketsService = new TicketSQLiteService(adapter);
    }
    const draft = await _ticketsService.createDraft(services as unknown as Parameters<TicketSQLiteService['createDraft']>[0], userId, storeId, clientInfo);
    return draft as unknown as Ticket;
  },
};

// ==================== APPOINTMENTS SERVICE ====================

/**
 * SQLite Appointments Service with Dexie-compatible interface
 */
export const sqliteAppointmentsDB = {
  async getByDate(storeId: string, date: Date, _limit?: number): Promise<Appointment[]> {
    const adapter = await getAdapter();
    if (!_appointmentsService) {
      _appointmentsService = new AppointmentSQLiteService(adapter);
    }
    // Get appointments for the whole day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const appointments = await _appointmentsService.getByDateRange(storeId, startOfDay.toISOString(), endOfDay.toISOString());
    return appointments as unknown as Appointment[];
  },

  async getById(id: string): Promise<Appointment | undefined> {
    const adapter = await getAdapter();
    if (!_appointmentsService) {
      _appointmentsService = new AppointmentSQLiteService(adapter);
    }
    const appointment = await _appointmentsService.getById(id);
    return appointment as unknown as Appointment | undefined;
  },

  async create(
    appointment: Parameters<typeof import('@/db/database').appointmentsDB.create>[0],
    userId: string,
    storeId: string
  ): Promise<Appointment> {
    const adapter = await getAdapter();
    if (!_appointmentsService) {
      _appointmentsService = new AppointmentSQLiteService(adapter);
    }
    const createInput = {
      ...appointment,
      storeId,
      createdBy: userId,
    } as unknown as Parameters<AppointmentSQLiteService['create']>[0];
    const created = await _appointmentsService.create(createInput);
    return created as unknown as Appointment;
  },

  async update(id: string, updates: Partial<Appointment>, _userId?: string): Promise<Appointment | undefined> {
    const adapter = await getAdapter();
    if (!_appointmentsService) {
      _appointmentsService = new AppointmentSQLiteService(adapter);
    }
    const updated = await _appointmentsService.update(id, updates as unknown as Parameters<AppointmentSQLiteService['update']>[1]);
    return updated as unknown as Appointment | undefined;
  },

  async delete(id: string): Promise<void> {
    const adapter = await getAdapter();
    if (!_appointmentsService) {
      _appointmentsService = new AppointmentSQLiteService(adapter);
    }
    await _appointmentsService.delete(id);
  },

  async checkIn(id: string, _userId?: string): Promise<Appointment | undefined> {
    const adapter = await getAdapter();
    if (!_appointmentsService) {
      _appointmentsService = new AppointmentSQLiteService(adapter);
    }
    const appointment = await _appointmentsService.checkIn(id);
    return appointment as unknown as Appointment | undefined;
  },
};

// ==================== TRANSACTIONS SERVICE ====================

/**
 * SQLite Transactions Service with Dexie-compatible interface
 */
export const sqliteTransactionsDB = {
  async getAll(storeId: string, limit = 1000): Promise<Transaction[]> {
    const adapter = await getAdapter();
    if (!_transactionsService) {
      _transactionsService = new TransactionSQLiteService(adapter);
    }
    const transactions = await _transactionsService.getByStore(storeId, limit);
    return transactions as unknown as Transaction[];
  },

  async getById(id: string): Promise<Transaction | undefined> {
    const adapter = await getAdapter();
    if (!_transactionsService) {
      _transactionsService = new TransactionSQLiteService(adapter);
    }
    const transaction = await _transactionsService.getById(id);
    return transaction as unknown as Transaction | undefined;
  },

  async getByDateRange(storeId: string, start: Date, end: Date): Promise<Transaction[]> {
    const adapter = await getAdapter();
    if (!_transactionsService) {
      _transactionsService = new TransactionSQLiteService(adapter);
    }
    const transactions = await _transactionsService.getByDateRange(storeId, start.toISOString(), end.toISOString());
    return transactions as unknown as Transaction[];
  },

  async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'syncStatus'>): Promise<Transaction> {
    const adapter = await getAdapter();
    if (!_transactionsService) {
      _transactionsService = new TransactionSQLiteService(adapter);
    }
    // Add default syncStatus since SQLite service expects it
    const transactionWithSync = {
      ...transaction,
      syncStatus: 'local',
    } as unknown as Parameters<TransactionSQLiteService['create']>[0];
    const created = await _transactionsService.create(transactionWithSync);
    return created as unknown as Transaction;
  },

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const adapter = await getAdapter();
    if (!_transactionsService) {
      _transactionsService = new TransactionSQLiteService(adapter);
    }
    const updated = await _transactionsService.update(id, updates as unknown as Parameters<TransactionSQLiteService['update']>[1]);
    return (updated as unknown as Transaction) ?? null;
  },

  async delete(id: string): Promise<void> {
    const adapter = await getAdapter();
    if (!_transactionsService) {
      _transactionsService = new TransactionSQLiteService(adapter);
    }
    await _transactionsService.delete(id);
  },
};

// ==================== STAFF SERVICE ====================

/**
 * SQLite Staff Service with Dexie-compatible interface
 */
export const sqliteStaffDB = {
  async getAll(storeId: string): Promise<Staff[]> {
    const adapter = await getAdapter();
    if (!_staffService) {
      _staffService = new StaffSQLiteService(adapter);
    }
    const staff = await _staffService.getActive(storeId);
    return staff as unknown as Staff[];
  },

  async getById(id: string): Promise<Staff | undefined> {
    const adapter = await getAdapter();
    if (!_staffService) {
      _staffService = new StaffSQLiteService(adapter);
    }
    const staff = await _staffService.getById(id);
    return staff as unknown as Staff | undefined;
  },

  async getAvailable(storeId: string): Promise<Staff[]> {
    const adapter = await getAdapter();
    if (!_staffService) {
      _staffService = new StaffSQLiteService(adapter);
    }
    const staff = await _staffService.getAvailable(storeId);
    return staff as unknown as Staff[];
  },

  async create(staff: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<Staff> {
    const adapter = await getAdapter();
    if (!_staffService) {
      _staffService = new StaffSQLiteService(adapter);
    }
    const created = await _staffService.create(staff as unknown as Parameters<StaffSQLiteService['create']>[0]);
    return created as unknown as Staff;
  },

  async update(id: string, updates: Partial<Staff>): Promise<Staff | null> {
    const adapter = await getAdapter();
    if (!_staffService) {
      _staffService = new StaffSQLiteService(adapter);
    }
    const updated = await _staffService.update(id, updates as unknown as Parameters<StaffSQLiteService['update']>[1]);
    return (updated as unknown as Staff) ?? null;
  },

  async delete(id: string): Promise<void> {
    const adapter = await getAdapter();
    if (!_staffService) {
      _staffService = new StaffSQLiteService(adapter);
    }
    await _staffService.delete(id);
  },

  async clockIn(id: string): Promise<Staff | undefined> {
    const adapter = await getAdapter();
    if (!_staffService) {
      _staffService = new StaffSQLiteService(adapter);
    }
    // Update status to available
    const updated = await _staffService.updateStatus(id, 'available');
    return updated as unknown as Staff | undefined;
  },

  async clockOut(id: string): Promise<Staff | undefined> {
    const adapter = await getAdapter();
    if (!_staffService) {
      _staffService = new StaffSQLiteService(adapter);
    }
    // Update status to off
    const updated = await _staffService.updateStatus(id, 'off');
    return updated as unknown as Staff | undefined;
  },
};

// ==================== SERVICES (MENU) SERVICE ====================

/**
 * SQLite Services (menu items) Service with Dexie-compatible interface
 */
export const sqliteServicesDB = {
  async getAll(storeId: string): Promise<Service[]> {
    const adapter = await getAdapter();
    if (!_servicesService) {
      _servicesService = new ServiceSQLiteService(adapter);
    }
    const services = await _servicesService.getByStore(storeId, 1000);
    return services as unknown as Service[];
  },

  async getById(id: string): Promise<Service | undefined> {
    const adapter = await getAdapter();
    if (!_servicesService) {
      _servicesService = new ServiceSQLiteService(adapter);
    }
    const service = await _servicesService.getById(id);
    return service as unknown as Service | undefined;
  },

  async getByCategory(storeId: string, category: string): Promise<Service[]> {
    const adapter = await getAdapter();
    if (!_servicesService) {
      _servicesService = new ServiceSQLiteService(adapter);
    }
    const services = await _servicesService.getByCategory(storeId, category);
    return services as unknown as Service[];
  },
};

// ==================== SETTINGS SERVICE ====================

/**
 * SQLite Settings Service with Dexie-compatible interface
 * Simple key-value store for application settings
 */
export const sqliteSettingsDB = {
  async get<T>(key: string): Promise<T | undefined> {
    const adapter = await getAdapter();
    if (!_settingsService) {
      _settingsService = new SettingsSQLiteService(adapter);
    }
    // Cast to unknown first for flexible generic return type
    const value = await _settingsService.get(key);
    return value as T | undefined;
  },

  async set(key: string, value: unknown): Promise<void> {
    const adapter = await getAdapter();
    if (!_settingsService) {
      _settingsService = new SettingsSQLiteService(adapter);
    }
    // Cast to SettingValue for SQLite service compatibility
    await _settingsService.set(key, value as string | number | boolean | object | null);
  },

  async remove(key: string): Promise<void> {
    const adapter = await getAdapter();
    if (!_settingsService) {
      _settingsService = new SettingsSQLiteService(adapter);
    }
    await _settingsService.delete(key);
  },
};

// ==================== SYNC QUEUE SERVICE ====================

/**
 * SQLite Sync Queue Service with Dexie-compatible interface
 * Manages offline sync operation queue
 */

/**
 * SyncOperation type for dataService compatibility
 * Note: Uses Date object for createdAt to match Dexie's behavior
 */
export interface SyncOperation {
  id: string;
  type: string;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: unknown;
  priority: number;
  maxAttempts: number;
  createdAt: Date;
  attempts: number;
  status: 'pending' | 'syncing' | 'complete' | 'failed';
  lastError?: string;
}

export const sqliteSyncQueueDB = {
  async getAll(limit: number = 100, _offset: number = 0): Promise<SyncOperation[]> {
    const adapter = await getAdapter();
    if (!_syncQueueService) {
      _syncQueueService = new SyncQueueSQLiteService(adapter);
    }
    // getPending() takes no limit argument, use getNext(limit) instead for consistency
    const ops = await _syncQueueService.getNext(limit);
    // Convert SQLite operations to SyncOperation format
    return ops.map(op => ({
      id: op.id,
      type: op.operation, // 'create' | 'update' | 'delete'
      entity: op.entity,
      entityId: op.entityId,
      action: op.operation.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
      payload: op.data,
      priority: op.priority,
      maxAttempts: op.maxRetries,
      createdAt: new Date(op.createdAt),
      attempts: op.retryCount,
      status: op.status as 'pending' | 'syncing' | 'complete' | 'failed',
      lastError: op.errorMessage ?? undefined,
    }));
  },

  async getPending(limit: number = 50): Promise<SyncOperation[]> {
    const adapter = await getAdapter();
    if (!_syncQueueService) {
      _syncQueueService = new SyncQueueSQLiteService(adapter);
    }
    const ops = await _syncQueueService.getNext(limit);
    // Convert SQLite operations to SyncOperation format
    return ops.map(op => ({
      id: op.id,
      type: op.operation,
      entity: op.entity,
      entityId: op.entityId,
      action: op.operation.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
      payload: op.data,
      priority: op.priority,
      maxAttempts: op.maxRetries,
      createdAt: new Date(op.createdAt),
      attempts: op.retryCount,
      status: op.status as 'pending' | 'syncing' | 'complete' | 'failed',
      lastError: op.errorMessage ?? undefined,
    }));
  },

  async add(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'attempts' | 'status'>): Promise<SyncOperation> {
    const adapter = await getAdapter();
    if (!_syncQueueService) {
      _syncQueueService = new SyncQueueSQLiteService(adapter);
    }
    const op = await _syncQueueService.add({
      entity: operation.entity as 'clients' | 'tickets' | 'appointments' | 'transactions' | 'staff' | 'services',
      entityId: operation.entityId,
      operation: operation.action.toLowerCase() as 'create' | 'update' | 'delete',
      data: operation.payload as Record<string, unknown>,
      priority: operation.priority as 1 | 2 | 3,
    });
    return {
      id: op.id,
      type: op.operation,
      entity: op.entity,
      entityId: op.entityId,
      action: op.operation.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE',
      payload: op.data,
      priority: op.priority,
      maxAttempts: op.maxRetries,
      createdAt: new Date(op.createdAt),
      attempts: op.retryCount,
      status: op.status as 'pending' | 'syncing' | 'complete' | 'failed',
      lastError: op.errorMessage ?? undefined,
    };
  },

  async update(id: string, updates: { status?: 'pending' | 'syncing' | 'complete' | 'failed'; lastError?: string }): Promise<void> {
    const adapter = await getAdapter();
    if (!_syncQueueService) {
      _syncQueueService = new SyncQueueSQLiteService(adapter);
    }
    // Map SyncOperation updates to SQLite service
    if (updates.status === 'complete') {
      await _syncQueueService.markComplete(id);
    } else if (updates.status === 'failed' && updates.lastError) {
      await _syncQueueService.markFailed(id, updates.lastError);
    } else if (updates.status === 'syncing') {
      await _syncQueueService.markSyncing(id);
    } else if (updates.status === 'pending') {
      await _syncQueueService.resetForRetry(id);
    }
  },

  async remove(id: string): Promise<void> {
    const adapter = await getAdapter();
    if (!_syncQueueService) {
      _syncQueueService = new SyncQueueSQLiteService(adapter);
    }
    // Mark as complete to effectively remove from queue
    await _syncQueueService.markComplete(id);
  },

  async clear(): Promise<void> {
    const adapter = await getAdapter();
    if (!_syncQueueService) {
      _syncQueueService = new SyncQueueSQLiteService(adapter);
    }
    await _syncQueueService.clearCompleted();
  },
};

// ==================== TEAM MEMBER SERVICE ====================

/**
 * SQLite Team Member Service with Dexie-compatible interface
 */
export const sqliteTeamMemberDB = {
  async getAll(storeId: string): Promise<Staff[]> {
    const adapter = await getAdapter();
    if (!_teamMemberService) {
      _teamMemberService = new TeamMemberSQLiteService(adapter);
    }
    const members = await _teamMemberService.getActive(storeId);
    return members as unknown as Staff[];
  },

  async getById(id: string): Promise<Staff | undefined> {
    const adapter = await getAdapter();
    if (!_teamMemberService) {
      _teamMemberService = new TeamMemberSQLiteService(adapter);
    }
    const member = await _teamMemberService.getById(id);
    return member as unknown as Staff | undefined;
  },

  async getByRole(storeId: string, role: string): Promise<Staff[]> {
    const adapter = await getAdapter();
    if (!_teamMemberService) {
      _teamMemberService = new TeamMemberSQLiteService(adapter);
    }
    const members = await _teamMemberService.getByRole(storeId, role as Parameters<TeamMemberSQLiteService['getByRole']>[1]);
    return members as unknown as Staff[];
  },
};

// ==================== PATCH TEST SERVICE ====================

/**
 * SQLite Patch Test Service with Dexie-compatible interface
 */
export const sqlitePatchTestsDB = {
  async getByClientId(clientId: string): Promise<AppPatchTest[]> {
    const adapter = await getAdapter();
    if (!_patchTestService) {
      _patchTestService = new PatchTestSQLiteService(adapter);
    }
    const tests = await _patchTestService.getByClient(clientId);
    return tests as unknown as AppPatchTest[];
  },

  async getById(id: string): Promise<AppPatchTest | undefined> {
    const adapter = await getAdapter();
    if (!_patchTestService) {
      _patchTestService = new PatchTestSQLiteService(adapter);
    }
    const test = await _patchTestService.getById(id);
    return test as unknown as AppPatchTest | undefined;
  },

  async getValidForService(clientId: string, serviceId: string): Promise<AppPatchTest | undefined> {
    const adapter = await getAdapter();
    if (!_patchTestService) {
      _patchTestService = new PatchTestSQLiteService(adapter);
    }
    // Check if there's a valid patch test for the service
    const hasValid = await _patchTestService.hasValidPatchTest(clientId, serviceId);
    if (!hasValid) return undefined;
    const test = await _patchTestService.getByClientAndService(clientId, serviceId);
    return test as unknown as AppPatchTest | undefined;
  },

  async getExpiring(clientId: string, daysAhead: number = 7): Promise<AppPatchTest[]> {
    const adapter = await getAdapter();
    if (!_patchTestService) {
      _patchTestService = new PatchTestSQLiteService(adapter);
    }
    const tests = await _patchTestService.getExpiring(daysAhead);
    // Filter by client
    const filtered = tests.filter(t => t.clientId === clientId);
    return filtered as unknown as AppPatchTest[];
  },

  async create(patchTest: Omit<AppPatchTest, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<AppPatchTest> {
    const adapter = await getAdapter();
    if (!_patchTestService) {
      _patchTestService = new PatchTestSQLiteService(adapter);
    }
    const created = await _patchTestService.create({
      ...patchTest,
      syncStatus: 'local',
    } as Parameters<PatchTestSQLiteService['create']>[0]);
    return created as unknown as AppPatchTest;
  },

  async update(id: string, updates: Partial<AppPatchTest>): Promise<AppPatchTest | undefined> {
    const adapter = await getAdapter();
    if (!_patchTestService) {
      _patchTestService = new PatchTestSQLiteService(adapter);
    }
    const updated = await _patchTestService.update(id, updates as Parameters<PatchTestSQLiteService['update']>[1]);
    return updated as unknown as AppPatchTest | undefined;
  },

  async delete(id: string): Promise<void> {
    const adapter = await getAdapter();
    if (!_patchTestService) {
      _patchTestService = new PatchTestSQLiteService(adapter);
    }
    await _patchTestService.delete(id);
  },
};

// ==================== FORM RESPONSE SERVICE ====================

/**
 * SQLite Form Response Service with Dexie-compatible interface
 */
export const sqliteFormResponsesDB = {
  async getByClientId(clientId: string, _limit: number = 50): Promise<AppFormResponse[]> {
    const adapter = await getAdapter();
    if (!_formResponseService) {
      _formResponseService = new FormResponseSQLiteService(adapter);
    }
    const responses = await _formResponseService.getByClient(clientId);
    return responses as unknown as AppFormResponse[];
  },

  async getById(id: string): Promise<AppFormResponse | undefined> {
    const adapter = await getAdapter();
    if (!_formResponseService) {
      _formResponseService = new FormResponseSQLiteService(adapter);
    }
    const response = await _formResponseService.getById(id);
    return response as unknown as AppFormResponse | undefined;
  },

  async getPending(clientId: string): Promise<AppFormResponse[]> {
    const adapter = await getAdapter();
    if (!_formResponseService) {
      _formResponseService = new FormResponseSQLiteService(adapter);
    }
    const responses = await _formResponseService.getPendingByClient(clientId);
    return responses as unknown as AppFormResponse[];
  },

  async getByAppointmentId(appointmentId: string): Promise<AppFormResponse[]> {
    const adapter = await getAdapter();
    if (!_formResponseService) {
      _formResponseService = new FormResponseSQLiteService(adapter);
    }
    const responses = await _formResponseService.getByAppointment(appointmentId);
    return responses as unknown as AppFormResponse[];
  },

  async create(response: Omit<AppFormResponse, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<AppFormResponse> {
    const adapter = await getAdapter();
    if (!_formResponseService) {
      _formResponseService = new FormResponseSQLiteService(adapter);
    }
    const created = await _formResponseService.create({
      ...response,
      syncStatus: 'local',
    } as Parameters<FormResponseSQLiteService['create']>[0]);
    return created as unknown as AppFormResponse;
  },

  async update(id: string, updates: Partial<AppFormResponse>): Promise<AppFormResponse | undefined> {
    const adapter = await getAdapter();
    if (!_formResponseService) {
      _formResponseService = new FormResponseSQLiteService(adapter);
    }
    const updated = await _formResponseService.update(id, updates as Parameters<FormResponseSQLiteService['update']>[1]);
    return updated as unknown as AppFormResponse | undefined;
  },

  async complete(id: string, responses: Record<string, unknown>, completedBy: string, signatureImage?: string): Promise<AppFormResponse | undefined> {
    const adapter = await getAdapter();
    if (!_formResponseService) {
      _formResponseService = new FormResponseSQLiteService(adapter);
    }
    // First update with responses and signature, then mark complete
    await _formResponseService.update(id, {
      responses,
      signatureImage,
    } as Parameters<FormResponseSQLiteService['update']>[1]);
    const completed = await _formResponseService.complete(id, completedBy);
    return completed as unknown as AppFormResponse | undefined;
  },
};

// ==================== REFERRAL SERVICE ====================

/**
 * SQLite Referral Service with Dexie-compatible interface
 */
export const sqliteReferralsDB = {
  async getByReferrerId(clientId: string): Promise<AppReferral[]> {
    const adapter = await getAdapter();
    if (!_referralService) {
      _referralService = new ReferralSQLiteService(adapter);
    }
    const referrals = await _referralService.getByReferrer(clientId);
    return referrals as unknown as AppReferral[];
  },

  async getByReferredId(clientId: string): Promise<AppReferral | undefined> {
    const adapter = await getAdapter();
    if (!_referralService) {
      _referralService = new ReferralSQLiteService(adapter);
    }
    // Get all and filter - no direct method for this
    const all = await _referralService.getAll(1000);
    const found = all.find(r => r.referredClientId === clientId);
    return found as unknown as AppReferral | undefined;
  },

  async getById(id: string): Promise<AppReferral | undefined> {
    const adapter = await getAdapter();
    if (!_referralService) {
      _referralService = new ReferralSQLiteService(adapter);
    }
    const referral = await _referralService.getById(id);
    return referral as unknown as AppReferral | undefined;
  },

  async getByCode(code: string): Promise<AppReferral | undefined> {
    const adapter = await getAdapter();
    if (!_referralService) {
      _referralService = new ReferralSQLiteService(adapter);
    }
    const referral = await _referralService.getByCode(code);
    return referral as unknown as AppReferral | undefined;
  },

  async create(referral: Omit<AppReferral, 'id' | 'createdAt' | 'syncStatus'>): Promise<AppReferral> {
    const adapter = await getAdapter();
    if (!_referralService) {
      _referralService = new ReferralSQLiteService(adapter);
    }
    const created = await _referralService.create({
      ...referral,
      syncStatus: 'local',
    } as Parameters<ReferralSQLiteService['create']>[0]);
    return created as unknown as AppReferral;
  },

  async update(id: string, updates: Partial<AppReferral>): Promise<AppReferral | undefined> {
    const adapter = await getAdapter();
    if (!_referralService) {
      _referralService = new ReferralSQLiteService(adapter);
    }
    const updated = await _referralService.update(id, updates as Parameters<ReferralSQLiteService['update']>[1]);
    return updated as unknown as AppReferral | undefined;
  },

  async completeReferral(id: string, appointmentId: string): Promise<AppReferral | undefined> {
    const adapter = await getAdapter();
    if (!_referralService) {
      _referralService = new ReferralSQLiteService(adapter);
    }
    const updated = await _referralService.update(id, {
      firstAppointmentId: appointmentId,
      completedAt: new Date().toISOString(),
    } as Parameters<ReferralSQLiteService['update']>[1]);
    return updated as unknown as AppReferral | undefined;
  },
};

// ==================== CLIENT REVIEW SERVICE ====================

/**
 * SQLite Client Review Service with Dexie-compatible interface
 */
export const sqliteClientReviewsDB = {
  async getByClientId(clientId: string, _limit: number = 50): Promise<AppClientReview[]> {
    const adapter = await getAdapter();
    if (!_clientReviewService) {
      _clientReviewService = new ClientReviewSQLiteService(adapter);
    }
    const reviews = await _clientReviewService.getByClient(clientId);
    return reviews as unknown as AppClientReview[];
  },

  async getById(id: string): Promise<AppClientReview | undefined> {
    const adapter = await getAdapter();
    if (!_clientReviewService) {
      _clientReviewService = new ClientReviewSQLiteService(adapter);
    }
    const review = await _clientReviewService.getById(id);
    return review as unknown as AppClientReview | undefined;
  },

  async getByStaffId(staffId: string, _limit: number = 100): Promise<AppClientReview[]> {
    const adapter = await getAdapter();
    if (!_clientReviewService) {
      _clientReviewService = new ClientReviewSQLiteService(adapter);
    }
    const reviews = await _clientReviewService.getByStaff(staffId);
    return reviews as unknown as AppClientReview[];
  },

  async create(review: Omit<AppClientReview, 'id' | 'createdAt' | 'syncStatus'>): Promise<AppClientReview> {
    const adapter = await getAdapter();
    if (!_clientReviewService) {
      _clientReviewService = new ClientReviewSQLiteService(adapter);
    }
    const created = await _clientReviewService.create({
      ...review,
      syncStatus: 'local',
    } as Parameters<ClientReviewSQLiteService['create']>[0]);
    return created as unknown as AppClientReview;
  },

  async addResponse(id: string, response: string): Promise<AppClientReview | undefined> {
    const adapter = await getAdapter();
    if (!_clientReviewService) {
      _clientReviewService = new ClientReviewSQLiteService(adapter);
    }
    const updated = await _clientReviewService.addResponse(id, response);
    return updated as unknown as AppClientReview | undefined;
  },

  async update(id: string, updates: Partial<AppClientReview>): Promise<AppClientReview | undefined> {
    const adapter = await getAdapter();
    if (!_clientReviewService) {
      _clientReviewService = new ClientReviewSQLiteService(adapter);
    }
    const updated = await _clientReviewService.update(id, updates as Parameters<ClientReviewSQLiteService['update']>[1]);
    return updated as unknown as AppClientReview | undefined;
  },
};

// ==================== LOYALTY REWARD SERVICE ====================

/**
 * SQLite Loyalty Reward Service with Dexie-compatible interface
 */
export const sqliteLoyaltyRewardsDB = {
  async getByClientId(clientId: string, _includeRedeemed: boolean = false): Promise<AppLoyaltyReward[]> {
    const adapter = await getAdapter();
    if (!_loyaltyRewardService) {
      _loyaltyRewardService = new LoyaltyRewardSQLiteService(adapter);
    }
    const rewards = await _loyaltyRewardService.getByClient(clientId);
    return rewards as unknown as AppLoyaltyReward[];
  },

  async getById(id: string): Promise<AppLoyaltyReward | undefined> {
    const adapter = await getAdapter();
    if (!_loyaltyRewardService) {
      _loyaltyRewardService = new LoyaltyRewardSQLiteService(adapter);
    }
    const reward = await _loyaltyRewardService.getById(id);
    return reward as unknown as AppLoyaltyReward | undefined;
  },

  async getAvailable(clientId: string): Promise<AppLoyaltyReward[]> {
    const adapter = await getAdapter();
    if (!_loyaltyRewardService) {
      _loyaltyRewardService = new LoyaltyRewardSQLiteService(adapter);
    }
    const rewards = await _loyaltyRewardService.getAvailable(clientId);
    return rewards as unknown as AppLoyaltyReward[];
  },

  async create(reward: Omit<AppLoyaltyReward, 'id' | 'createdAt' | 'syncStatus'>): Promise<AppLoyaltyReward> {
    const adapter = await getAdapter();
    if (!_loyaltyRewardService) {
      _loyaltyRewardService = new LoyaltyRewardSQLiteService(adapter);
    }
    const created = await _loyaltyRewardService.create({
      ...reward,
      syncStatus: 'local',
    } as Parameters<LoyaltyRewardSQLiteService['create']>[0]);
    return created as unknown as AppLoyaltyReward;
  },

  async redeem(id: string): Promise<AppLoyaltyReward | undefined> {
    const adapter = await getAdapter();
    if (!_loyaltyRewardService) {
      _loyaltyRewardService = new LoyaltyRewardSQLiteService(adapter);
    }
    const redeemed = await _loyaltyRewardService.redeem(id);
    return redeemed as unknown as AppLoyaltyReward | undefined;
  },
};

// ==================== REVIEW REQUEST SERVICE ====================

/**
 * SQLite Review Request Service with Dexie-compatible interface
 */
export const sqliteReviewRequestsDB = {
  async getById(id: string): Promise<AppReviewRequest | undefined> {
    const adapter = await getAdapter();
    if (!_reviewRequestService) {
      _reviewRequestService = new ReviewRequestSQLiteService(adapter);
    }
    const request = await _reviewRequestService.getById(id);
    return request as unknown as AppReviewRequest | undefined;
  },

  async getByClientId(clientId: string, _limit: number = 50): Promise<AppReviewRequest[]> {
    const adapter = await getAdapter();
    if (!_reviewRequestService) {
      _reviewRequestService = new ReviewRequestSQLiteService(adapter);
    }
    const requests = await _reviewRequestService.getByClient(clientId);
    return requests as unknown as AppReviewRequest[];
  },

  async getBySalonId(storeId: string, _limit: number = 100): Promise<AppReviewRequest[]> {
    const adapter = await getAdapter();
    if (!_reviewRequestService) {
      _reviewRequestService = new ReviewRequestSQLiteService(adapter);
    }
    const requests = await _reviewRequestService.getByStore(storeId);
    return requests as unknown as AppReviewRequest[];
  },

  async getByStatus(storeId: string, status: AppReviewRequestStatus, _limit: number = 100): Promise<AppReviewRequest[]> {
    const adapter = await getAdapter();
    if (!_reviewRequestService) {
      _reviewRequestService = new ReviewRequestSQLiteService(adapter);
    }
    const requests = await _reviewRequestService.getByStatus(storeId, status as Parameters<ReviewRequestSQLiteService['getByStatus']>[1]);
    return requests as unknown as AppReviewRequest[];
  },

  async getPendingByClient(clientId: string): Promise<AppReviewRequest[]> {
    const adapter = await getAdapter();
    if (!_reviewRequestService) {
      _reviewRequestService = new ReviewRequestSQLiteService(adapter);
    }
    const allByClient = await _reviewRequestService.getByClient(clientId);
    const pending = allByClient.filter(r => r.status === 'pending');
    return pending as unknown as AppReviewRequest[];
  },

  async create(request: Omit<AppReviewRequest, 'id' | 'createdAt' | 'syncStatus'>): Promise<AppReviewRequest> {
    const adapter = await getAdapter();
    if (!_reviewRequestService) {
      _reviewRequestService = new ReviewRequestSQLiteService(adapter);
    }
    const created = await _reviewRequestService.create({
      ...request,
      syncStatus: 'local',
    } as Parameters<ReviewRequestSQLiteService['create']>[0]);
    return created as unknown as AppReviewRequest;
  },

  async update(id: string, updates: Partial<AppReviewRequest>): Promise<AppReviewRequest | undefined> {
    const adapter = await getAdapter();
    if (!_reviewRequestService) {
      _reviewRequestService = new ReviewRequestSQLiteService(adapter);
    }
    const updated = await _reviewRequestService.update(id, updates as Parameters<ReviewRequestSQLiteService['update']>[1]);
    return updated as unknown as AppReviewRequest | undefined;
  },

  async markSent(id: string, _sentVia: 'email' | 'sms' | 'both'): Promise<AppReviewRequest | undefined> {
    const adapter = await getAdapter();
    if (!_reviewRequestService) {
      _reviewRequestService = new ReviewRequestSQLiteService(adapter);
    }
    const updated = await _reviewRequestService.markSent(id);
    return updated as unknown as AppReviewRequest | undefined;
  },

  async markOpened(id: string): Promise<AppReviewRequest | undefined> {
    const adapter = await getAdapter();
    if (!_reviewRequestService) {
      _reviewRequestService = new ReviewRequestSQLiteService(adapter);
    }
    const updated = await _reviewRequestService.markOpened(id);
    return updated as unknown as AppReviewRequest | undefined;
  },

  async markCompleted(id: string, reviewId: string): Promise<AppReviewRequest | undefined> {
    const adapter = await getAdapter();
    if (!_reviewRequestService) {
      _reviewRequestService = new ReviewRequestSQLiteService(adapter);
    }
    const updated = await _reviewRequestService.markCompleted(id, reviewId);
    return updated as unknown as AppReviewRequest | undefined;
  },

  async markExpired(id: string): Promise<AppReviewRequest | undefined> {
    const adapter = await getAdapter();
    if (!_reviewRequestService) {
      _reviewRequestService = new ReviewRequestSQLiteService(adapter);
    }
    const updated = await _reviewRequestService.update(id, { status: 'expired' } as Parameters<ReviewRequestSQLiteService['update']>[1]);
    return updated as unknown as AppReviewRequest | undefined;
  },

  async delete(id: string): Promise<void> {
    const adapter = await getAdapter();
    if (!_reviewRequestService) {
      _reviewRequestService = new ReviewRequestSQLiteService(adapter);
    }
    await _reviewRequestService.delete(id);
  },
};

// ==================== CUSTOM SEGMENT SERVICE ====================

/**
 * SQLite Custom Segment Service with Dexie-compatible interface
 */
export const sqliteCustomSegmentsDB = {
  async getById(id: string): Promise<AppCustomSegment | undefined> {
    const adapter = await getAdapter();
    if (!_customSegmentService) {
      _customSegmentService = new CustomSegmentSQLiteService(adapter);
    }
    const segment = await _customSegmentService.getById(id);
    return segment as unknown as AppCustomSegment | undefined;
  },

  async getBySalonId(storeId: string, _activeOnly: boolean = true): Promise<AppCustomSegment[]> {
    const adapter = await getAdapter();
    if (!_customSegmentService) {
      _customSegmentService = new CustomSegmentSQLiteService(adapter);
    }
    const segments = _activeOnly
      ? await _customSegmentService.getActive(storeId)
      : await _customSegmentService.getByStore(storeId);
    return segments as unknown as AppCustomSegment[];
  },

  async getActive(storeId: string): Promise<AppCustomSegment[]> {
    const adapter = await getAdapter();
    if (!_customSegmentService) {
      _customSegmentService = new CustomSegmentSQLiteService(adapter);
    }
    const segments = await _customSegmentService.getActive(storeId);
    return segments as unknown as AppCustomSegment[];
  },

  async getByName(storeId: string, name: string): Promise<AppCustomSegment | undefined> {
    const adapter = await getAdapter();
    if (!_customSegmentService) {
      _customSegmentService = new CustomSegmentSQLiteService(adapter);
    }
    const segment = await _customSegmentService.getByName(storeId, name);
    return segment as unknown as AppCustomSegment | undefined;
  },

  async create(segment: Omit<AppCustomSegment, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<AppCustomSegment> {
    const adapter = await getAdapter();
    if (!_customSegmentService) {
      _customSegmentService = new CustomSegmentSQLiteService(adapter);
    }
    const created = await _customSegmentService.create({
      ...segment,
      syncStatus: 'local',
    } as Parameters<CustomSegmentSQLiteService['create']>[0]);
    return created as unknown as AppCustomSegment;
  },

  async update(id: string, updates: Partial<AppCustomSegment>): Promise<AppCustomSegment | undefined> {
    const adapter = await getAdapter();
    if (!_customSegmentService) {
      _customSegmentService = new CustomSegmentSQLiteService(adapter);
    }
    const updated = await _customSegmentService.update(id, updates as Parameters<CustomSegmentSQLiteService['update']>[1]);
    return updated as unknown as AppCustomSegment | undefined;
  },

  async updateFilters(id: string, filters: AppSegmentFilterGroup): Promise<AppCustomSegment | undefined> {
    const adapter = await getAdapter();
    if (!_customSegmentService) {
      _customSegmentService = new CustomSegmentSQLiteService(adapter);
    }
    const updated = await _customSegmentService.update(id, { filters } as Parameters<CustomSegmentSQLiteService['update']>[1]);
    return updated as unknown as AppCustomSegment | undefined;
  },

  async activate(id: string): Promise<AppCustomSegment | undefined> {
    const adapter = await getAdapter();
    if (!_customSegmentService) {
      _customSegmentService = new CustomSegmentSQLiteService(adapter);
    }
    const updated = await _customSegmentService.activate(id);
    return updated as unknown as AppCustomSegment | undefined;
  },

  async deactivate(id: string): Promise<AppCustomSegment | undefined> {
    const adapter = await getAdapter();
    if (!_customSegmentService) {
      _customSegmentService = new CustomSegmentSQLiteService(adapter);
    }
    const updated = await _customSegmentService.deactivate(id);
    return updated as unknown as AppCustomSegment | undefined;
  },

  async delete(id: string): Promise<void> {
    const adapter = await getAdapter();
    if (!_customSegmentService) {
      _customSegmentService = new CustomSegmentSQLiteService(adapter);
    }
    await _customSegmentService.delete(id);
  },

  async duplicate(id: string, newName: string, createdBy: string): Promise<AppCustomSegment | undefined> {
    const adapter = await getAdapter();
    if (!_customSegmentService) {
      _customSegmentService = new CustomSegmentSQLiteService(adapter);
    }
    // Get original segment and create a copy with new name
    const original = await _customSegmentService.getById(id);
    if (!original) return undefined;
    const created = await _customSegmentService.create({
      storeId: original.storeId,
      name: newName,
      description: original.description,
      color: original.color,
      icon: original.icon,
      filters: original.filters,
      isActive: false, // Start as inactive
      createdBy,
      syncStatus: 'local',
    } as Parameters<CustomSegmentSQLiteService['create']>[0]);
    return created as unknown as AppCustomSegment | undefined;
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if SQLite is initialized
 */
export function isSQLiteInitialized(): boolean {
  return _adapter !== null;
}

/**
 * Close SQLite connection (for cleanup)
 */
export async function closeSQLite(): Promise<void> {
  if (_adapter) {
    await _adapter.close();
    _adapter = null;
    _clientsService = null;
    _ticketsService = null;
    _appointmentsService = null;
    _transactionsService = null;
    _staffService = null;
    _servicesService = null;
    _settingsService = null;
    _syncQueueService = null;
    // Team and CRM services
    _teamMemberService = null;
    _patchTestService = null;
    _formResponseService = null;
    _referralService = null;
    _clientReviewService = null;
    _loyaltyRewardService = null;
    _reviewRequestService = null;
    _customSegmentService = null;
    _initPromise = null;
  }
}
