# SQLite Migration Implementation Guide

> Step-by-step instructions for migrating Mango POS from IndexedDB/Dexie.js to SQLite

**Branch:** `claude/document-tech-stack-RRNpW`
**Status:** Ready for Implementation
**Estimated Effort:** 8-10 weeks

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Setup & Foundation](#phase-1-setup--foundation)
4. [Phase 2: Core Table Migration](#phase-2-core-table-migration)
5. [Phase 3: Remaining Tables](#phase-3-remaining-tables)
6. [Phase 4: Integration & Testing](#phase-4-integration--testing)
7. [Phase 5: Rollout](#phase-5-rollout)
8. [Reference: SQL Schema](#reference-sql-schema)
9. [Reference: Type Converters](#reference-type-converters)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### What We're Doing
Replacing IndexedDB (via Dexie.js) with SQLite for local data storage to improve query performance.

### Why
Current Dexie.js implementation requires loading entire tables into memory for filtering, sorting, and aggregations. SQLite handles these operations natively with indexes.

### Performance Targets

| Operation | Current | Target | Improvement |
|-----------|---------|--------|-------------|
| Client filtering | 300ms | <50ms | 6x+ |
| Turn queue calculation | 500ms | <30ms | 15x+ |
| Payroll aggregation | 2000ms | <100ms | 20x+ |
| Client search | 150ms | <30ms | 5x+ |

### Key Files Already Created

| File | Description |
|------|-------------|
| `packages/sqlite-adapter/` | Cross-platform SQLite adapter package |
| `packages/sqlite-adapter/src/types.ts` | Core TypeScript interfaces |
| `packages/sqlite-adapter/src/adapters/electron.ts` | Electron adapter (better-sqlite3) |
| `packages/sqlite-adapter/src/adapters/capacitor.ts` | iOS/Android adapter |
| `packages/sqlite-adapter/src/adapters/web.ts` | Web browser adapter (wa-sqlite) |
| `packages/sqlite-adapter/src/factory.ts` | Platform auto-detection factory |
| `packages/sqlite-adapter/src/utils/queryBuilder.ts` | SQL query builder utilities |
| `packages/sqlite-adapter/src/services/clientService.ts` | Example service implementation |
| `docs/architecture/SQLITE_MIGRATION_PLAN.md` | Full migration plan document |

---

## Prerequisites

### 1. Install Dependencies

```bash
# Navigate to the sqlite-adapter package
cd packages/sqlite-adapter

# Install package dependencies
pnpm install

# Install platform-specific SQLite libraries (peer dependencies)
# For Electron:
pnpm add better-sqlite3 -D

# For Capacitor (iOS/Android):
pnpm add @capacitor-community/sqlite

# For Web:
pnpm add wa-sqlite
```

### 2. Understand Current Architecture

**Current data flow:**
```
Component → Redux Thunk → dataService → Dexie.js (IndexedDB)
```

**Target data flow:**
```
Component → Redux Thunk → dataService → SQLite Adapter → SQLite
```

**Key files to understand:**
- `apps/store-app/src/db/schema.ts` - Current Dexie schema
- `apps/store-app/src/db/database.ts` - Current database operations
- `apps/store-app/src/services/dataService.ts` - Data service layer

### 3. Environment Setup

Add feature flag to `.env`:
```bash
# Enable SQLite (set to 'true' to use SQLite, 'false' for Dexie)
VITE_USE_SQLITE=false
```

---

## Phase 1: Setup & Foundation

### Task 1.1: Complete the SQLite Adapter Package

**Location:** `packages/sqlite-adapter/`

#### Step 1: Add missing dependencies to package.json

```json
{
  "dependencies": {
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/uuid": "^9.0.0"
  }
}
```

#### Step 2: Create migration runner

**File:** `packages/sqlite-adapter/src/migrations/index.ts`

```typescript
import type { SQLiteAdapter, Migration, MigrationRecord } from '../types';

const MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now')),
    description TEXT
  );
`;

export async function runMigrations(
  adapter: SQLiteAdapter,
  migrations: Migration[]
): Promise<void> {
  // Create migrations table
  await adapter.exec(MIGRATIONS_TABLE);

  // Get applied migrations
  const applied = await adapter.all<MigrationRecord>(
    'SELECT version FROM schema_migrations ORDER BY version'
  );
  const appliedVersions = new Set(applied.map((m) => m.version));

  // Run pending migrations in order
  const pending = migrations
    .filter((m) => !appliedVersions.has(m.version))
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    console.log(`[SQLite] Running migration v${migration.version}: ${migration.description}`);

    await adapter.transaction(async () => {
      // Run migration
      await adapter.exec(migration.up);

      // Record migration
      await adapter.run(
        'INSERT INTO schema_migrations (version, description) VALUES (?, ?)',
        [migration.version, migration.description]
      );
    });

    console.log(`[SQLite] Migration v${migration.version} complete`);
  }
}

export async function getMigrationStatus(
  adapter: SQLiteAdapter
): Promise<{ applied: number[]; pending: number[] }> {
  const applied = await adapter.all<MigrationRecord>(
    'SELECT version FROM schema_migrations ORDER BY version'
  );
  return {
    applied: applied.map((m) => m.version),
    pending: [], // Would compare against known migrations
  };
}
```

#### Step 3: Create initial schema migration

**File:** `packages/sqlite-adapter/src/migrations/v001_initial_schema.ts`

```typescript
import type { Migration } from '../types';

export const v001_initial_schema: Migration = {
  version: 1,
  description: 'Initial schema with core tables',
  up: `
    -- Clients
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      is_blocked INTEGER DEFAULT 0,
      is_vip INTEGER DEFAULT 0,
      blocked_at TEXT,
      blocked_by TEXT,
      block_reason TEXT,
      block_reason_note TEXT,
      loyalty_tier TEXT,
      loyalty_points INTEGER DEFAULT 0,
      source TEXT,
      total_visits INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      average_ticket REAL DEFAULT 0,
      last_visit_date TEXT,
      no_show_count INTEGER DEFAULT 0,
      late_cancel_count INTEGER DEFAULT 0,
      preferred_staff_ids TEXT,
      tags TEXT,
      notes TEXT,
      staff_alert TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT,
      sync_status TEXT DEFAULT 'local',
      sync_version INTEGER DEFAULT 1,
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_clients_store_id ON clients(store_id);
    CREATE INDEX IF NOT EXISTS idx_clients_store_blocked ON clients(store_id, is_blocked);
    CREATE INDEX IF NOT EXISTS idx_clients_store_vip ON clients(store_id, is_vip);
    CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(store_id, phone);
    CREATE INDEX IF NOT EXISTS idx_clients_last_visit ON clients(store_id, last_visit_date);
    CREATE INDEX IF NOT EXISTS idx_clients_loyalty ON clients(store_id, loyalty_tier);

    -- Staff
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'available',
      role TEXT,
      avatar_url TEXT,
      color TEXT,
      clocked_in_at TEXT,
      rating REAL,
      specialties TEXT,
      is_vip_specialist INTEGER DEFAULT 0,
      commission_type TEXT,
      commission_rate REAL,
      hourly_rate REAL,
      skills TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'local',
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_staff_store_id ON staff(store_id);
    CREATE INDEX IF NOT EXISTS idx_staff_store_status ON staff(store_id, status);

    -- Services
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      price REAL NOT NULL,
      duration INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      requires_patch_test INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'local',
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_services_store_id ON services(store_id);
    CREATE INDEX IF NOT EXISTS idx_services_store_category ON services(store_id, category);

    -- Appointments
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      client_id TEXT,
      staff_id TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      scheduled_start_time TEXT NOT NULL,
      scheduled_end_time TEXT NOT NULL,
      actual_start_time TEXT,
      actual_end_time TEXT,
      check_in_time TEXT,
      source TEXT,
      notes TEXT,
      services TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT,
      last_modified_by TEXT,
      sync_status TEXT DEFAULT 'local',
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_store_id ON appointments(store_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_store_status ON appointments(store_id, status);
    CREATE INDEX IF NOT EXISTS idx_appointments_store_date ON appointments(store_id, scheduled_start_time);
    CREATE INDEX IF NOT EXISTS idx_appointments_staff_date ON appointments(staff_id, scheduled_start_time);

    -- Tickets
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      client_id TEXT,
      client_name TEXT,
      client_phone TEXT,
      appointment_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      source TEXT,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      tip REAL DEFAULT 0,
      total REAL DEFAULT 0,
      services TEXT NOT NULL,
      products TEXT,
      payments TEXT,
      is_draft INTEGER DEFAULT 0,
      draft_expires_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      created_by TEXT,
      last_modified_by TEXT,
      sync_status TEXT DEFAULT 'local',
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_store_id ON tickets(store_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_store_status ON tickets(store_id, status);
    CREATE INDEX IF NOT EXISTS idx_tickets_store_date ON tickets(store_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_tickets_client ON tickets(client_id);

    -- Ticket Services (normalized for turn queue queries)
    CREATE TABLE IF NOT EXISTS ticket_services (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      store_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      staff_id TEXT,
      price REAL NOT NULL,
      duration INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_ticket_services_ticket ON ticket_services(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_ticket_services_staff ON ticket_services(staff_id);
    CREATE INDEX IF NOT EXISTS idx_ticket_services_staff_date ON ticket_services(staff_id, created_at);

    -- Transactions
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      ticket_id TEXT NOT NULL,
      client_id TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      status TEXT DEFAULT 'completed',
      service_amount REAL DEFAULT 0,
      product_amount REAL DEFAULT 0,
      tip_amount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      reference_number TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'local',
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_store_id ON transactions(store_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_store_date ON transactions(store_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_transactions_ticket ON transactions(ticket_id);

    -- Timesheets
    CREATE TABLE IF NOT EXISTS timesheets (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      staff_id TEXT NOT NULL,
      date TEXT NOT NULL,
      clock_in TEXT,
      clock_out TEXT,
      break_start TEXT,
      break_end TEXT,
      total_hours REAL,
      overtime_hours REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      approved_by TEXT,
      approved_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'local',
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_timesheets_store_date ON timesheets(store_id, date);
    CREATE INDEX IF NOT EXISTS idx_timesheets_staff_date ON timesheets(staff_id, date);

    -- Sync Queue
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity TEXT NOT NULL,
      operation TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      data TEXT NOT NULL,
      priority INTEGER DEFAULT 5,
      attempts INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      created_at TEXT NOT NULL,
      last_attempt_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, priority, created_at);

    -- Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `,
  down: `
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS sync_queue;
    DROP TABLE IF EXISTS timesheets;
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS ticket_services;
    DROP TABLE IF EXISTS tickets;
    DROP TABLE IF EXISTS appointments;
    DROP TABLE IF EXISTS services;
    DROP TABLE IF EXISTS staff;
    DROP TABLE IF EXISTS clients;
    DROP TABLE IF EXISTS schema_migrations;
  `,
};
```

### Task 1.2: Create SQLite Service Manager

**File:** `packages/sqlite-adapter/src/SQLiteService.ts`

```typescript
import type { SQLiteAdapter, SQLiteConfig } from './types';
import { createSQLiteAdapter } from './factory';
import { runMigrations } from './migrations';
import { v001_initial_schema } from './migrations/v001_initial_schema';
import { ClientSQLiteService } from './services/clientService';
// Import other services as they're created

const ALL_MIGRATIONS = [v001_initial_schema];

export class SQLiteService {
  private adapter: SQLiteAdapter | null = null;
  private _clients: ClientSQLiteService | null = null;
  // Add other services here

  async initialize(config?: Partial<SQLiteConfig>): Promise<void> {
    if (this.adapter) {
      console.warn('[SQLiteService] Already initialized');
      return;
    }

    // Create platform-appropriate adapter
    this.adapter = await createSQLiteAdapter(config);

    // Run migrations
    await runMigrations(this.adapter, ALL_MIGRATIONS);

    // Initialize services
    this._clients = new ClientSQLiteService(this.adapter);

    console.log('[SQLiteService] Initialized successfully');
  }

  async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
      this._clients = null;
    }
  }

  get clients(): ClientSQLiteService {
    if (!this._clients) {
      throw new Error('SQLiteService not initialized. Call initialize() first.');
    }
    return this._clients;
  }

  get isInitialized(): boolean {
    return this.adapter !== null;
  }

  /**
   * Get the raw adapter for advanced operations.
   */
  getAdapter(): SQLiteAdapter {
    if (!this.adapter) {
      throw new Error('SQLiteService not initialized. Call initialize() first.');
    }
    return this.adapter;
  }
}

// Singleton instance
let instance: SQLiteService | null = null;

export function getSQLiteService(): SQLiteService {
  if (!instance) {
    instance = new SQLiteService();
  }
  return instance;
}

export async function initializeSQLite(config?: Partial<SQLiteConfig>): Promise<SQLiteService> {
  const service = getSQLiteService();
  await service.initialize(config);
  return service;
}
```

### Task 1.3: Add Feature Flag to dataService

**File:** `apps/store-app/src/services/dataService.ts`

Add at the top of the file:

```typescript
import { getSQLiteService, initializeSQLite } from '@mango/sqlite-adapter';

// Feature flag for SQLite
const USE_SQLITE = import.meta.env.VITE_USE_SQLITE === 'true';

// Initialize SQLite if enabled
let sqliteInitialized = false;
async function ensureSQLiteInitialized() {
  if (USE_SQLITE && !sqliteInitialized) {
    await initializeSQLite({ dbName: 'mango_pos' });
    sqliteInitialized = true;
  }
}
```

---

## Phase 2: Core Table Migration

### Task 2.1: Migrate Clients Service

**Update:** `apps/store-app/src/services/dataService.ts`

Replace the `clientsService` export:

```typescript
export const clientsService = {
  async getAll(storeId: string, limit = 100, offset = 0): Promise<Client[]> {
    if (USE_SQLITE) {
      await ensureSQLiteInitialized();
      const result = await getSQLiteService().clients.getFiltered(
        storeId,
        {},
        { field: 'name', order: 'asc' },
        { limit, offset }
      );
      return result.data;
    }
    return clientsDB.getAll(storeId, limit, offset);
  },

  async getById(id: string): Promise<Client | undefined> {
    if (USE_SQLITE) {
      await ensureSQLiteInitialized();
      return getSQLiteService().clients.getById(id);
    }
    return clientsDB.getById(id);
  },

  async search(storeId: string, query: string, limit = 50): Promise<Client[]> {
    if (USE_SQLITE) {
      await ensureSQLiteInitialized();
      return getSQLiteService().clients.search(storeId, query, limit);
    }
    return clientsDB.search(storeId, query, limit);
  },

  async getFiltered(
    storeId: string,
    filters: ClientFilters,
    sort: ClientSortOptions,
    pagination: { limit: number; offset: number }
  ): Promise<{ clients: Client[]; total: number }> {
    if (USE_SQLITE) {
      await ensureSQLiteInitialized();
      const result = await getSQLiteService().clients.getFiltered(
        storeId,
        filters,
        sort,
        pagination
      );
      return { clients: result.data, total: result.total };
    }
    return clientsDB.getFiltered(storeId, filters, sort, pagination.limit, pagination.offset);
  },

  async create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Client> {
    if (USE_SQLITE) {
      await ensureSQLiteInitialized();
      const created = await getSQLiteService().clients.create(client);
      // Queue for sync
      await syncQueueService.add('client', 'create', created.id, created);
      return created;
    }
    return clientsDB.create(client);
  },

  async update(id: string, updates: Partial<Client>): Promise<Client | undefined> {
    if (USE_SQLITE) {
      await ensureSQLiteInitialized();
      const updated = await getSQLiteService().clients.update(id, updates);
      if (updated) {
        await syncQueueService.add('client', 'update', id, updated);
      }
      return updated;
    }
    return clientsDB.update(id, updates);
  },

  async delete(id: string): Promise<boolean> {
    if (USE_SQLITE) {
      await ensureSQLiteInitialized();
      const success = await getSQLiteService().clients.delete(id);
      if (success) {
        await syncQueueService.add('client', 'delete', id, { id });
      }
      return success;
    }
    return clientsDB.delete(id);
  },

  async getStats(storeId: string) {
    if (USE_SQLITE) {
      await ensureSQLiteInitialized();
      return getSQLiteService().clients.getStats(storeId);
    }
    return clientsDB.getStats(storeId);
  },
};
```

### Task 2.2: Create Tickets SQLite Service

**File:** `packages/sqlite-adapter/src/services/ticketService.ts`

```typescript
import type { SQLiteAdapter, PaginatedResult, SQLiteValue } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface TicketRow {
  id: string;
  store_id: string;
  client_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  appointment_id: string | null;
  status: string;
  source: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  tip: number;
  total: number;
  services: string; // JSON
  products: string | null; // JSON
  payments: string | null; // JSON
  is_draft: number;
  draft_expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  created_by: string | null;
  last_modified_by: string | null;
  sync_status: string;
  is_deleted: number;
}

export interface Ticket {
  id: string;
  storeId: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  appointmentId?: string;
  status: 'pending' | 'in-service' | 'ready' | 'paid' | 'cancelled' | 'voided';
  source?: string;
  subtotal: number;
  discount: number;
  tax: number;
  tip: number;
  total: number;
  services: TicketService[];
  products?: TicketProduct[];
  payments?: Payment[];
  isDraft?: boolean;
  draftExpiresAt?: string;
  completedAt?: string;
  createdAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
  syncStatus: 'local' | 'synced' | 'conflict';
}

export interface TicketService {
  id: string;
  serviceId: string;
  serviceName: string;
  staffId?: string;
  staffName?: string;
  price: number;
  duration: number;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed';
}

export interface TicketProduct {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Payment {
  id: string;
  method: string;
  amount: number;
  tip?: number;
}

// Type converters
function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    storeId: row.store_id,
    clientId: row.client_id || undefined,
    clientName: row.client_name || undefined,
    clientPhone: row.client_phone || undefined,
    appointmentId: row.appointment_id || undefined,
    status: row.status as Ticket['status'],
    source: row.source || undefined,
    subtotal: row.subtotal,
    discount: row.discount,
    tax: row.tax,
    tip: row.tip,
    total: row.total,
    services: JSON.parse(row.services),
    products: row.products ? JSON.parse(row.products) : undefined,
    payments: row.payments ? JSON.parse(row.payments) : undefined,
    isDraft: row.is_draft === 1,
    draftExpiresAt: row.draft_expires_at || undefined,
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at,
    createdBy: row.created_by || undefined,
    lastModifiedBy: row.last_modified_by || undefined,
    syncStatus: row.sync_status as 'local' | 'synced' | 'conflict',
  };
}

export class TicketSQLiteService {
  constructor(private adapter: SQLiteAdapter) {}

  async getAll(storeId: string, limit = 100, offset = 0): Promise<Ticket[]> {
    const sql = `
      SELECT * FROM tickets
      WHERE store_id = ? AND is_deleted = 0
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = await this.adapter.all<TicketRow>(sql, [storeId, limit, offset]);
    return rows.map(toTicket);
  }

  async getById(id: string): Promise<Ticket | undefined> {
    const sql = 'SELECT * FROM tickets WHERE id = ? AND is_deleted = 0';
    const row = await this.adapter.get<TicketRow>(sql, [id]);
    return row ? toTicket(row) : undefined;
  }

  async getByStatus(storeId: string, status: string, limit = 100): Promise<Ticket[]> {
    const sql = `
      SELECT * FROM tickets
      WHERE store_id = ? AND status = ? AND is_deleted = 0
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const rows = await this.adapter.all<TicketRow>(sql, [storeId, status, limit]);
    return rows.map(toTicket);
  }

  async getActive(storeId: string, limit = 100): Promise<Ticket[]> {
    const sql = `
      SELECT * FROM tickets
      WHERE store_id = ? AND status IN ('pending', 'in-service') AND is_deleted = 0
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const rows = await this.adapter.all<TicketRow>(sql, [storeId, limit]);
    return rows.map(toTicket);
  }

  async getByDate(storeId: string, date: Date, limit = 200): Promise<Ticket[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sql = `
      SELECT * FROM tickets
      WHERE store_id = ?
        AND created_at >= ?
        AND created_at <= ?
        AND is_deleted = 0
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const rows = await this.adapter.all<TicketRow>(sql, [
      storeId,
      startOfDay.toISOString(),
      endOfDay.toISOString(),
      limit,
    ]);
    return rows.map(toTicket);
  }

  async create(ticket: Omit<Ticket, 'id' | 'createdAt' | 'syncStatus'>): Promise<Ticket> {
    const now = new Date().toISOString();
    const id = uuidv4();

    const sql = `
      INSERT INTO tickets (
        id, store_id, client_id, client_name, client_phone, appointment_id,
        status, source, subtotal, discount, tax, tip, total,
        services, products, payments, is_draft, draft_expires_at,
        created_at, created_by, last_modified_by, sync_status, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.adapter.run(sql, [
      id,
      ticket.storeId,
      ticket.clientId || null,
      ticket.clientName || null,
      ticket.clientPhone || null,
      ticket.appointmentId || null,
      ticket.status,
      ticket.source || null,
      ticket.subtotal,
      ticket.discount,
      ticket.tax,
      ticket.tip,
      ticket.total,
      JSON.stringify(ticket.services),
      ticket.products ? JSON.stringify(ticket.products) : null,
      ticket.payments ? JSON.stringify(ticket.payments) : null,
      ticket.isDraft ? 1 : 0,
      ticket.draftExpiresAt || null,
      now,
      ticket.createdBy || null,
      ticket.lastModifiedBy || null,
      'local',
      0,
    ]);

    // Also insert into ticket_services for efficient querying
    for (const service of ticket.services) {
      await this.adapter.run(
        `INSERT INTO ticket_services (id, ticket_id, store_id, service_id, service_name, staff_id, price, duration, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          id,
          ticket.storeId,
          service.serviceId,
          service.serviceName,
          service.staffId || null,
          service.price,
          service.duration,
          service.status,
          now,
        ]
      );
    }

    return {
      ...ticket,
      id,
      createdAt: now,
      syncStatus: 'local',
    };
  }

  async update(id: string, updates: Partial<Ticket>, userId?: string): Promise<Ticket | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;

    const setClauses: string[] = [];
    const params: SQLiteValue[] = [];

    if (updates.status !== undefined) {
      setClauses.push('status = ?');
      params.push(updates.status);
    }
    if (updates.subtotal !== undefined) {
      setClauses.push('subtotal = ?');
      params.push(updates.subtotal);
    }
    if (updates.discount !== undefined) {
      setClauses.push('discount = ?');
      params.push(updates.discount);
    }
    if (updates.tax !== undefined) {
      setClauses.push('tax = ?');
      params.push(updates.tax);
    }
    if (updates.tip !== undefined) {
      setClauses.push('tip = ?');
      params.push(updates.tip);
    }
    if (updates.total !== undefined) {
      setClauses.push('total = ?');
      params.push(updates.total);
    }
    if (updates.services !== undefined) {
      setClauses.push('services = ?');
      params.push(JSON.stringify(updates.services));
    }
    if (updates.products !== undefined) {
      setClauses.push('products = ?');
      params.push(JSON.stringify(updates.products));
    }
    if (updates.payments !== undefined) {
      setClauses.push('payments = ?');
      params.push(JSON.stringify(updates.payments));
    }
    if (updates.completedAt !== undefined) {
      setClauses.push('completed_at = ?');
      params.push(updates.completedAt);
    }

    setClauses.push('last_modified_by = ?');
    params.push(userId || null);
    setClauses.push('sync_status = ?');
    params.push('local');

    params.push(id);

    const sql = `UPDATE tickets SET ${setClauses.join(', ')} WHERE id = ?`;
    await this.adapter.run(sql, params);

    return this.getById(id);
  }

  /**
   * Get staff ticket counts for turn queue calculation.
   * This is the KEY query that benefits from SQLite.
   */
  async getStaffTicketCounts(
    storeId: string,
    staffIds: string[],
    since: Date
  ): Promise<Map<string, number>> {
    if (staffIds.length === 0) return new Map();

    const placeholders = staffIds.map(() => '?').join(',');
    const sql = `
      SELECT
        ts.staff_id,
        COUNT(DISTINCT ts.ticket_id) as ticket_count
      FROM ticket_services ts
      JOIN tickets t ON ts.ticket_id = t.id
      WHERE ts.store_id = ?
        AND ts.staff_id IN (${placeholders})
        AND ts.created_at >= ?
        AND t.status NOT IN ('cancelled', 'voided')
        AND t.is_deleted = 0
      GROUP BY ts.staff_id
    `;

    const rows = await this.adapter.all<{ staff_id: string; ticket_count: number }>(
      sql,
      [storeId, ...staffIds, since.toISOString()]
    );

    return new Map(rows.map((r) => [r.staff_id, r.ticket_count]));
  }

  /**
   * Get daily totals for dashboard.
   */
  async getDailyTotals(storeId: string, date: Date): Promise<{
    ticketCount: number;
    totalRevenue: number;
    serviceRevenue: number;
    productRevenue: number;
    totalTips: number;
  }> {
    const dateStr = date.toISOString().split('T')[0];

    const sql = `
      SELECT
        COUNT(*) as ticket_count,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(subtotal - COALESCE(
          (SELECT SUM(json_extract(value, '$.total'))
           FROM json_each(products)), 0)), 0) as service_revenue,
        COALESCE(SUM(
          (SELECT SUM(json_extract(value, '$.total'))
           FROM json_each(products))), 0) as product_revenue,
        COALESCE(SUM(tip), 0) as total_tips
      FROM tickets
      WHERE store_id = ?
        AND date(created_at) = ?
        AND status = 'paid'
        AND is_deleted = 0
    `;

    const result = await this.adapter.get<{
      ticket_count: number;
      total_revenue: number;
      service_revenue: number;
      product_revenue: number;
      total_tips: number;
    }>(sql, [storeId, dateStr]);

    return {
      ticketCount: result?.ticket_count || 0,
      totalRevenue: result?.total_revenue || 0,
      serviceRevenue: result?.service_revenue || 0,
      productRevenue: result?.product_revenue || 0,
      totalTips: result?.total_tips || 0,
    };
  }
}
```

### Task 2.3: Create Staff SQLite Service

**File:** `packages/sqlite-adapter/src/services/staffService.ts`

```typescript
import type { SQLiteAdapter } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface StaffRow {
  id: string;
  store_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  role: string | null;
  avatar_url: string | null;
  color: string | null;
  clocked_in_at: string | null;
  rating: number | null;
  specialties: string | null;
  is_vip_specialist: number;
  commission_type: string | null;
  commission_rate: number | null;
  hourly_rate: number | null;
  skills: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  is_deleted: number;
}

export interface Staff {
  id: string;
  storeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: 'available' | 'busy' | 'break' | 'clocked-out' | 'off';
  role?: string;
  avatarUrl?: string;
  color?: string;
  clockedInAt?: string;
  rating?: number;
  specialties?: string[];
  isVipSpecialist?: boolean;
  commissionType?: string;
  commissionRate?: number;
  hourlyRate?: number;
  skills?: string[];
  createdAt: string;
  updatedAt: string;
  syncStatus: 'local' | 'synced' | 'conflict';
}

function toStaff(row: StaffRow): Staff {
  return {
    id: row.id,
    storeId: row.store_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email || undefined,
    phone: row.phone || undefined,
    status: row.status as Staff['status'],
    role: row.role || undefined,
    avatarUrl: row.avatar_url || undefined,
    color: row.color || undefined,
    clockedInAt: row.clocked_in_at || undefined,
    rating: row.rating || undefined,
    specialties: row.specialties ? JSON.parse(row.specialties) : undefined,
    isVipSpecialist: row.is_vip_specialist === 1,
    commissionType: row.commission_type || undefined,
    commissionRate: row.commission_rate || undefined,
    hourlyRate: row.hourly_rate || undefined,
    skills: row.skills ? JSON.parse(row.skills) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status as 'local' | 'synced' | 'conflict',
  };
}

export class StaffSQLiteService {
  constructor(private adapter: SQLiteAdapter) {}

  async getAll(storeId: string, limit = 100): Promise<Staff[]> {
    const sql = `
      SELECT * FROM staff
      WHERE store_id = ? AND is_deleted = 0
      ORDER BY first_name, last_name
      LIMIT ?
    `;
    const rows = await this.adapter.all<StaffRow>(sql, [storeId, limit]);
    return rows.map(toStaff);
  }

  async getById(id: string): Promise<Staff | undefined> {
    const sql = 'SELECT * FROM staff WHERE id = ? AND is_deleted = 0';
    const row = await this.adapter.get<StaffRow>(sql, [id]);
    return row ? toStaff(row) : undefined;
  }

  async getAvailable(storeId: string): Promise<Staff[]> {
    const sql = `
      SELECT * FROM staff
      WHERE store_id = ? AND status = 'available' AND is_deleted = 0
      ORDER BY first_name, last_name
    `;
    const rows = await this.adapter.all<StaffRow>(sql, [storeId]);
    return rows.map(toStaff);
  }

  async getClockedIn(storeId: string): Promise<Staff[]> {
    const sql = `
      SELECT * FROM staff
      WHERE store_id = ?
        AND status IN ('available', 'busy', 'break')
        AND clocked_in_at IS NOT NULL
        AND is_deleted = 0
      ORDER BY first_name, last_name
    `;
    const rows = await this.adapter.all<StaffRow>(sql, [storeId]);
    return rows.map(toStaff);
  }

  async updateStatus(id: string, status: Staff['status']): Promise<Staff | undefined> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE staff
      SET status = ?, updated_at = ?, sync_status = 'local'
      WHERE id = ? AND is_deleted = 0
    `;
    await this.adapter.run(sql, [status, now, id]);
    return this.getById(id);
  }

  async clockIn(id: string): Promise<Staff | undefined> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE staff
      SET status = 'available', clocked_in_at = ?, updated_at = ?, sync_status = 'local'
      WHERE id = ? AND is_deleted = 0
    `;
    await this.adapter.run(sql, [now, now, id]);
    return this.getById(id);
  }

  async clockOut(id: string): Promise<Staff | undefined> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE staff
      SET status = 'clocked-out', clocked_in_at = NULL, updated_at = ?, sync_status = 'local'
      WHERE id = ? AND is_deleted = 0
    `;
    await this.adapter.run(sql, [now, id]);
    return this.getById(id);
  }
}
```

### Task 2.4: Update SQLiteService with New Services

**Update:** `packages/sqlite-adapter/src/SQLiteService.ts`

Add the new services:

```typescript
import { TicketSQLiteService } from './services/ticketService';
import { StaffSQLiteService } from './services/staffService';

export class SQLiteService {
  // ... existing code ...

  private _tickets: TicketSQLiteService | null = null;
  private _staff: StaffSQLiteService | null = null;

  async initialize(config?: Partial<SQLiteConfig>): Promise<void> {
    // ... existing initialization ...

    this._tickets = new TicketSQLiteService(this.adapter);
    this._staff = new StaffSQLiteService(this.adapter);
  }

  get tickets(): TicketSQLiteService {
    if (!this._tickets) {
      throw new Error('SQLiteService not initialized');
    }
    return this._tickets;
  }

  get staff(): StaffSQLiteService {
    if (!this._staff) {
      throw new Error('SQLiteService not initialized');
    }
    return this._staff;
  }
}
```

---

## Phase 3: Remaining Tables

### Task 3.1: Create Additional Services

Create services for remaining tables following the same pattern:

| Table | Service File | Priority |
|-------|-------------|----------|
| appointments | `appointmentService.ts` | High |
| transactions | `transactionService.ts` | High |
| timesheets | `timesheetService.ts` | High |
| services | `serviceService.ts` | Medium |
| form_templates | `formTemplateService.ts` | Medium |
| form_responses | `formResponseService.ts` | Medium |
| patch_tests | `patchTestService.ts` | Low |
| referrals | `referralService.ts` | Low |
| client_reviews | `reviewService.ts` | Low |
| loyalty_rewards | `loyaltyService.ts` | Low |
| gift_cards | `giftCardService.ts` | Low |

### Task 3.2: Create Second Migration for Additional Tables

**File:** `packages/sqlite-adapter/src/migrations/v002_additional_tables.ts`

```typescript
import type { Migration } from '../types';

export const v002_additional_tables: Migration = {
  version: 2,
  description: 'Additional tables for forms, reviews, loyalty',
  up: `
    -- Patch Tests
    CREATE TABLE IF NOT EXISTS patch_tests (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      result TEXT,
      expires_at TEXT,
      performed_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'local',
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_patch_tests_client ON patch_tests(client_id);
    CREATE INDEX IF NOT EXISTS idx_patch_tests_client_service ON patch_tests(client_id, service_id);

    -- Form Templates
    CREATE TABLE IF NOT EXISTS form_templates (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      fields TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      linked_service_ids TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'local',
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_form_templates_store ON form_templates(store_id);
    CREATE INDEX IF NOT EXISTS idx_form_templates_store_active ON form_templates(store_id, is_active);

    -- Form Responses
    CREATE TABLE IF NOT EXISTS form_responses (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      template_id TEXT NOT NULL,
      appointment_id TEXT,
      responses TEXT NOT NULL,
      signature_image TEXT,
      status TEXT DEFAULT 'pending',
      completed_at TEXT,
      completed_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'local',
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_form_responses_client ON form_responses(client_id);
    CREATE INDEX IF NOT EXISTS idx_form_responses_appointment ON form_responses(appointment_id);

    -- Referrals
    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      referrer_client_id TEXT NOT NULL,
      referred_client_id TEXT,
      referral_link_code TEXT,
      first_appointment_id TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'local',
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_client_id);
    CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_client_id);

    -- Client Reviews
    CREATE TABLE IF NOT EXISTS client_reviews (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      staff_id TEXT,
      appointment_id TEXT,
      rating INTEGER NOT NULL,
      comment TEXT,
      staff_response TEXT,
      responded_at TEXT,
      is_public INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'local',
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_client ON client_reviews(client_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_staff ON client_reviews(staff_id);

    -- Loyalty Rewards
    CREATE TABLE IF NOT EXISTS loyalty_rewards (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      description TEXT,
      expires_at TEXT,
      redeemed_at TEXT,
      redeemed_ticket_id TEXT,
      created_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'local',
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_loyalty_client ON loyalty_rewards(client_id);
    CREATE INDEX IF NOT EXISTS idx_loyalty_client_redeemed ON loyalty_rewards(client_id, redeemed_at);

    -- Gift Cards
    CREATE TABLE IF NOT EXISTS gift_cards (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      initial_balance REAL NOT NULL,
      current_balance REAL NOT NULL,
      purchaser_client_id TEXT,
      recipient_email TEXT,
      recipient_name TEXT,
      message TEXT,
      expires_at TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT DEFAULT 'local',
      is_deleted INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
    CREATE INDEX IF NOT EXISTS idx_gift_cards_store ON gift_cards(store_id);
  `,
};
```

---

## Phase 4: Integration & Testing

### Task 4.1: Create Performance Benchmark Tests

**File:** `packages/sqlite-adapter/src/__tests__/performance.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SQLiteService } from '../SQLiteService';

describe('Performance Benchmarks', () => {
  let service: SQLiteService;

  beforeAll(async () => {
    service = new SQLiteService();
    await service.initialize({ dbName: 'test_performance' });

    // Seed test data
    const adapter = service.getAdapter();
    // ... seed 2000 clients, 500 tickets, etc.
  });

  afterAll(async () => {
    await service.close();
  });

  it('should filter clients in under 50ms', async () => {
    const start = performance.now();
    await service.clients.getFiltered(
      'test-store',
      { status: 'vip', loyaltyTier: 'gold' },
      { field: 'totalSpent', order: 'desc' },
      { limit: 20, offset: 0 }
    );
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
  });

  it('should calculate turn queue in under 30ms', async () => {
    const start = performance.now();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await service.tickets.getStaffTicketCounts(
      'test-store',
      ['staff-1', 'staff-2', 'staff-3'],
      twoHoursAgo
    );
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(30);
  });

  it('should get daily totals in under 20ms', async () => {
    const start = performance.now();
    await service.tickets.getDailyTotals('test-store', new Date());
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(20);
  });
});
```

### Task 4.2: Create Data Migration Script

**File:** `packages/sqlite-adapter/src/migration/dataMigration.ts`

```typescript
import { getSQLiteService } from '../SQLiteService';

/**
 * Migrate data from Dexie.js (IndexedDB) to SQLite.
 * Run this once when switching a device to SQLite.
 */
export async function migrateFromDexie(
  dexieDb: any, // Your Dexie database instance
  storeId: string,
  onProgress?: (table: string, count: number, total: number) => void
): Promise<void> {
  const sqlite = getSQLiteService();
  const adapter = sqlite.getAdapter();

  const tables = [
    { name: 'clients', dexieTable: dexieDb.clients },
    { name: 'staff', dexieTable: dexieDb.staff },
    { name: 'services', dexieTable: dexieDb.services },
    { name: 'appointments', dexieTable: dexieDb.appointments },
    { name: 'tickets', dexieTable: dexieDb.tickets },
    { name: 'transactions', dexieTable: dexieDb.transactions },
  ];

  for (const { name, dexieTable } of tables) {
    console.log(`Migrating ${name}...`);

    const records = await dexieTable.where('storeId').equals(storeId).toArray();
    const total = records.length;

    await adapter.transaction(async () => {
      for (let i = 0; i < records.length; i++) {
        const record = records[i];

        // Convert and insert based on table
        // (implementation depends on table structure)

        if (onProgress && i % 100 === 0) {
          onProgress(name, i, total);
        }
      }
    });

    console.log(`Migrated ${total} ${name} records`);
  }
}
```

### Task 4.3: Platform Testing Checklist

Create manual testing checklist:

- [ ] **Electron (macOS)**
  - [ ] App starts without errors
  - [ ] Client list loads
  - [ ] Client filtering works
  - [ ] Create/update/delete client
  - [ ] Turn queue calculates correctly
  - [ ] Checkout flow completes

- [ ] **Electron (Windows)**
  - [ ] Same tests as macOS

- [ ] **iOS (iPad)**
  - [ ] App starts without errors
  - [ ] All client operations work
  - [ ] Offline mode works
  - [ ] Sync queue processes correctly

- [ ] **Android (Tablet)**
  - [ ] Same tests as iOS

- [ ] **Web (Chrome)**
  - [ ] OPFS initializes correctly
  - [ ] Data persists across refreshes
  - [ ] All operations work

- [ ] **Web (Safari)**
  - [ ] Same tests as Chrome

---

## Phase 5: Rollout

### Task 5.1: Enable Feature Flag for Testing

```bash
# .env.staging
VITE_USE_SQLITE=true
```

### Task 5.2: Monitor for Issues

Add logging to track performance:

```typescript
// In dataService.ts
async function logOperationTime(name: string, fn: () => Promise<any>) {
  const start = performance.now();
  const result = await fn();
  const elapsed = performance.now() - start;

  // Log slow operations
  if (elapsed > 200) {
    console.warn(`[Performance] Slow operation: ${name} took ${elapsed.toFixed(0)}ms`);
    // Optional: Send to analytics
  }

  return result;
}
```

### Task 5.3: Gradual Rollout Plan

1. **Week 1:** Internal team testing (staging environment)
2. **Week 2:** 10% of production users (feature flag by user ID)
3. **Week 3:** 50% of production users
4. **Week 4:** 100% rollout
5. **Week 5-6:** Monitor and fix any issues
6. **Week 7+:** Remove Dexie.js code if stable

---

## Reference: SQL Schema

See `packages/sqlite-adapter/src/migrations/v001_initial_schema.ts` for complete schema.

---

## Reference: Type Converters

All type converters follow this pattern:

```typescript
// Row type (snake_case, matches database)
interface ClientRow {
  id: string;
  store_id: string;
  first_name: string;
  // ...
}

// App type (camelCase, used in application)
interface Client {
  id: string;
  storeId: string;
  firstName: string;
  // ...
}

// Convert row to app type
function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    storeId: row.store_id,
    firstName: row.first_name,
    // ...
  };
}

// Convert app type to row (for inserts/updates)
function toClientRow(client: Partial<Client>): Partial<ClientRow> {
  const row: Partial<ClientRow> = {};
  if (client.storeId !== undefined) row.store_id = client.storeId;
  if (client.firstName !== undefined) row.first_name = client.firstName;
  // ...
  return row;
}
```

---

## Troubleshooting

### "Database not initialized" error

**Cause:** SQLite adapter not initialized before use.

**Fix:** Ensure `initializeSQLite()` is called at app startup.

```typescript
// In app initialization
import { initializeSQLite } from '@mango/sqlite-adapter';

async function initApp() {
  if (import.meta.env.VITE_USE_SQLITE === 'true') {
    await initializeSQLite();
  }
  // ... rest of initialization
}
```

### Web: "OPFS not available" error

**Cause:** Browser doesn't support OPFS or missing headers.

**Fix:** Ensure your server sends these headers:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Capacitor: SQLite plugin not found

**Cause:** Plugin not installed or not synced.

**Fix:**
```bash
pnpm add @capacitor-community/sqlite
npx cap sync
```

### Performance not improved

**Cause:** Missing indexes or inefficient queries.

**Fix:** Use `EXPLAIN QUERY PLAN` to analyze:
```typescript
const plan = await adapter.all('EXPLAIN QUERY PLAN SELECT * FROM clients WHERE ...');
console.log(plan);
```

---

## Summary Checklist

- [ ] Phase 1: Setup complete
  - [ ] Dependencies installed
  - [ ] Migration runner created
  - [ ] Initial schema migration created
  - [ ] SQLiteService manager created
  - [ ] Feature flag added to dataService

- [ ] Phase 2: Core tables migrated
  - [ ] ClientSQLiteService complete
  - [ ] TicketSQLiteService complete
  - [ ] StaffSQLiteService complete
  - [ ] dataService updated for all three

- [ ] Phase 3: Remaining tables migrated
  - [ ] All services created
  - [ ] Second migration added

- [ ] Phase 4: Testing complete
  - [ ] Performance benchmarks pass
  - [ ] All platforms tested
  - [ ] Data migration script works

- [ ] Phase 5: Rollout complete
  - [ ] Staging deployment successful
  - [ ] Gradual production rollout
  - [ ] Monitoring in place

---

*Last Updated: January 2026*
