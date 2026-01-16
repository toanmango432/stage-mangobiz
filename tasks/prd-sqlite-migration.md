# PRD: Data Layer Performance Optimization (SQLite Migration)

## Introduction

A three-phase implementation plan for improving Mango POS data layer performance at enterprise scale (50+ techs, 300+ tickets/day). This addresses critical performance bottlenecks in turn queue calculation, client filtering, and daily aggregations through architectural fixes and SQLite migration.

**Working Directory:** `/Users/seannguyen/Winsurf built/Mango-sqlite-migration/`
**Branch:** `feature/sqlite-migration`
**Git Strategy:** All work in worktree only

## Goals

- Turn queue calculation: 500ms → <150ms (Phase 1), <50ms (Phase 2)
- Client filtering: 300ms → <100ms (Phase 1), <50ms (Phase 2)
- Daily aggregations: 2000ms → <500ms (Phase 1), <100ms (Phase 2)
- Full offline operation support for all platforms
- No data loss during migration
- Auto-proceed from Phase 1 to Phase 2 when targets met

## Root Cause Analysis

| Issue | File | Line | Cause |
|-------|------|------|-------|
| Client filtering 300ms | `apps/store-app/src/db/database.ts` | 602 | `.toArray()` loads ALL clients, then filters in JS |
| Turn queue 500ms | `apps/store-app/src/services/turnQueueService.ts` | 145 | `ticketsDB.getAll()` inside loop (N+1 pattern) |
| Performance metrics 2000ms | `apps/store-app/src/db/performanceOperations.ts` | 154-167 | Query per client in loop (N+1) |

---

## User Stories

### Phase 1: Architecture Fixes (Foundation)

---

### US-001: Add performance benchmarking utility
**Description:** As a developer, I need a performance measurement utility to establish baselines and validate improvements.

**Files to modify:**
- `apps/store-app/src/utils/performanceBenchmark.ts` (NEW, ~80 lines)
- `apps/store-app/src/utils/index.ts` (~5 lines to add export)

**Acceptance Criteria:**
- [ ] `measureAsync<T>(name: string, fn: () => Promise<T>, threshold?: number): Promise<T>` function exists
- [ ] `measureSync<T>(name: string, fn: () => T, threshold?: number): T` function exists
- [ ] Results logged with `[PERF]` prefix: `[PERF] {name}: {duration}ms`
- [ ] If threshold provided and exceeded, logs warning: `[PERF WARNING] {name} exceeded threshold`
- [ ] Export both functions from `utils/index.ts`
- [ ] No forbidden strings: `'as any'`, `'void _'`, `'// TODO:'`
- [ ] pnpm run typecheck passes

**Notes:**
- Use `performance.now()` for high-resolution timing
- Follow pattern from existing utils in `apps/store-app/src/utils/`
- Keep it simple - no external dependencies
- This utility will wrap all optimized functions for measurement

**Priority:** 1

---

### US-002: Create database abstraction interface
**Description:** As a developer, I need a platform-agnostic database interface to support both Dexie and SQLite backends.

**Files to modify:**
- `packages/sqlite-adapter/src/interfaces/DatabaseAdapter.ts` (NEW, ~100 lines)
- `packages/sqlite-adapter/src/interfaces/index.ts` (NEW, ~10 lines)
- `packages/sqlite-adapter/src/index.ts` (~5 lines to add export)

**Acceptance Criteria:**
- [ ] `DatabaseAdapter<T>` interface with methods: `findById`, `findMany`, `create`, `update`, `delete`
- [ ] `QueryResult<T>` generic type: `{ data: T[]; total: number }`
- [ ] `QueryOptions` type: `{ where?: Record<string, any>; orderBy?: string; limit?: number; offset?: number }`
- [ ] `TransactionFn<T>` type for transaction callbacks
- [ ] All methods return Promises (works for both async Dexie and sync-wrapped SQLite)
- [ ] Export from `packages/sqlite-adapter/src/index.ts`
- [ ] No forbidden strings: `'as any'`, `'void _'`, `'// TODO:'`
- [ ] pnpm run typecheck passes

**Notes:**
- Reference existing `SQLiteAdapter` interface in `packages/sqlite-adapter/src/types.ts`
- Design should work for both Dexie (async) and SQLite (sync wrapped in Promise)
- This interface will be implemented by both backends

**Priority:** 2

---

### US-003: Fix client filtering to use Dexie indexes
**Description:** As a user, I want faster client filtering by using database indexes instead of JS filtering.

**Files to modify:**
- `apps/store-app/src/db/database.ts` (~60 lines in `clientsDB.getFiltered`)

**Acceptance Criteria:**
- [ ] Remove `.toArray()` call at line ~602 before filtering
- [ ] Use Dexie `.where('storeId').equals(storeId)` as base query
- [ ] For `searchQuery` filter: use `.filter()` on indexed collection (not full array)
- [ ] For `status` filter: chain `.and(client => ...)` condition
- [ ] Keep pagination working with `.offset(offset).limit(limit)`
- [ ] Wrap function with `measureAsync('clientsDB.getFiltered', ...)`
- [ ] Benchmark shows improvement in console `[PERF]` logs
- [ ] No forbidden strings: `'as any'`, `'void _'`
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: client search responds faster

**Notes:**
- Current issue at line 602: `const filteredClients = await collection.toArray();` loads ALL clients
- Dexie `.filter()` on Collection is more efficient than `.toArray().filter()`
- Keep the complex multi-field filter logic, just apply it on Collection not Array
- Pattern reference: `appointmentsDB.getByStatus` uses compound index correctly

**Priority:** 3

---

### US-004: Add missing compound indexes for tickets
**Description:** As a developer, I need additional ticket indexes to optimize turn queue and aggregation queries.

**Files to modify:**
- `apps/store-app/src/db/schema.ts` (~40 lines - add new version)

**Acceptance Criteria:**
- [ ] Add new schema version (increment from current highest version)
- [ ] Add compound index `[storeId+status+createdAt]` to tickets table
- [ ] Add compound index `[storeId+staffId+createdAt]` to tickets table (for staff queries)
- [ ] Include upgrade function with console.log: `'✅ Database upgraded to version N: Added performance indexes'`
- [ ] Schema version number is correct (check current max version first)
- [ ] No forbidden strings: `'as any'`, `'void _'`
- [ ] pnpm run typecheck passes

**Notes:**
- Follow pattern from existing version upgrades (see lines 146-230 in schema.ts)
- Current tickets indexes: `'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]'`
- New compound indexes enable efficient range queries with multiple conditions
- CRITICAL: Copy ALL existing table definitions in new version, only modify tickets line

**Priority:** 4

---

### US-005: Add helper method for staff ticket counts
**Description:** As a developer, I need an optimized method to get ticket counts per staff member for turn queue.

**Files to modify:**
- `apps/store-app/src/db/database.ts` (~50 lines in ticketsDB section)

**Acceptance Criteria:**
- [ ] Add `ticketsDB.getStaffTicketCounts(storeId: string, staffIds: string[], since: Date): Promise<Map<string, number>>` method
- [ ] Method fetches tickets once with `.where('[storeId+createdAt]').between([storeId, since.toISOString()], [storeId, Dexie.maxKey])`
- [ ] Counts tickets per staffId by iterating `ticket.services` array
- [ ] Returns `Map<staffId, count>` for O(1) lookups
- [ ] Wrap with `measureAsync('ticketsDB.getStaffTicketCounts', ...)`
- [ ] No forbidden strings: `'as any'`, `'void _'`
- [ ] pnpm run typecheck passes

**Notes:**
- This replaces multiple `getAll()` calls in turn queue calculation
- Staff ID is in `ticket.services[].staffId`, not on ticket directly
- Filter by `createdAt >= since` for recent tickets only
- Used by `turnQueueService.ts` to calculate rotation scores

**Priority:** 5

---

### US-006: Fix turn queue N+1 - pre-fetch tickets
**Description:** As a user, I want faster turn queue calculation by eliminating N+1 query pattern.

**Files to modify:**
- `apps/store-app/src/services/turnQueueService.ts` (~100 lines)

**Acceptance Criteria:**
- [ ] In `findBestStaff()`: fetch all recent tickets ONCE before the `Promise.all(availableStaff.map(...))` loop
- [ ] Pass pre-fetched tickets to `scoreStaff()` as new parameter
- [ ] Modify `scoreStaff()` signature to accept `allTickets: Ticket[]` parameter
- [ ] Modify `calculateTurnScore()` to use passed tickets instead of calling `ticketsDB.getAll()`
- [ ] Modify `calculateLoadScore()` to use passed tickets instead of calling `ticketsDB.getActive()`
- [ ] Remove `ticketsDB.getAll()` call at line ~145
- [ ] Wrap `findBestStaff()` with `measureAsync('turnQueue.findBestStaff', ...)`
- [ ] No forbidden strings: `'as any'`, `'void _'`
- [ ] pnpm run typecheck passes

**Notes:**
- Current N+1: line 145 `const allTickets = await ticketsDB.getAll(storeId);` called per staff
- Also line 200 in `getTurnQueueStats()` has same issue - fix that too
- Pre-fetch pattern: `const allTickets = await ticketsDB.getAll(storeId);` ONCE at start
- Filter in memory: `allTickets.filter(t => t.services.some(s => s.staffId === staff.id))`

**Priority:** 6

---

### US-007: Add turn queue result caching
**Description:** As a user, I want turn queue results cached to avoid recalculation on every request.

**Files to modify:**
- `apps/store-app/src/services/turnQueueCache.ts` (NEW, ~60 lines)
- `apps/store-app/src/services/turnQueueService.ts` (~30 lines to integrate cache)

**Acceptance Criteria:**
- [ ] Create `TurnQueueCache` class with private `cache: Map<string, { result: Staff | null; timestamp: number }>`
- [ ] `get(key: string): Staff | null | undefined` - returns undefined if not cached or expired
- [ ] `set(key: string, result: Staff | null): void` - stores with current timestamp
- [ ] `invalidate(storeId: string): void` - clears all entries for store
- [ ] TTL constant: `CACHE_TTL_MS = 30000` (30 seconds)
- [ ] Cache key format: `${storeId}:${serviceIds.sort().join(',')}:${vipClient}`
- [ ] In `findBestStaff()`: check cache before calculation, store result after
- [ ] Export `invalidateTurnQueueCache(storeId: string)` function
- [ ] No forbidden strings: `'as any'`, `'void _'`, `'// TODO:'`
- [ ] pnpm run typecheck passes

**Notes:**
- Simple in-memory cache with Map
- 30-second TTL balances freshness vs performance
- Cache invalidation should be called from ticket/staff Redux thunks (future story)
- For now, just implement the cache - integration with Redux comes later

**Priority:** 7

---

### US-008: Fix performance metrics N+1 query pattern
**Description:** As a user, I want faster performance reports by eliminating per-client queries.

**Files to modify:**
- `apps/store-app/src/db/performanceOperations.ts` (~80 lines)

**Acceptance Criteria:**
- [ ] Remove the for-loop at lines 154-167 that queries `previousVisits` per clientId
- [ ] Replace with single batch query: `supabase.from('tickets').select('client_id').in('client_id', Array.from(clientIds)).lt('created_at', start.toISOString())`
- [ ] Process results in memory: create `Set<string>` of clientIds with previous visits
- [ ] Update `newClientIds` logic: `clientIds.forEach(id => { if (!previousVisitClientIds.has(id)) newClientIds.add(id); })`
- [ ] Wrap `getStaffPerformanceMetrics()` with `measureAsync('getStaffPerformanceMetrics', ...)`
- [ ] No forbidden strings: `'as any'`, `'void _'`
- [ ] pnpm run typecheck passes

**Notes:**
- Current issue: lines 154-167 make N queries for N clients
- Supabase `.in()` supports arrays up to 100 items efficiently
- If clientIds > 100, batch in chunks of 100 (but this is rare)
- This is a Supabase query, not Dexie - different API

**Priority:** 8

---

### Phase 2: SQLite for Electron

---

### US-009: Implement better-sqlite3 Electron adapter
**Description:** As a developer, I need a working SQLite adapter for Electron using better-sqlite3.

**Files to modify:**
- `packages/sqlite-adapter/src/adapters/electron.ts` (~150 lines - replace placeholder)

**Acceptance Criteria:**
- [ ] Import `Database` from `better-sqlite3` (type import for now since peer dependency)
- [ ] `createElectronAdapter(config: SQLiteConfig): Promise<SQLiteAdapter>` returns working adapter
- [ ] Implement `exec(sql: string): Promise<void>` - run DDL statements
- [ ] Implement `run(sql: string, params?: SQLiteValue[]): Promise<{ changes: number; lastInsertRowid: number }>`
- [ ] Implement `get<T>(sql: string, params?: SQLiteValue[]): Promise<T | undefined>`
- [ ] Implement `all<T>(sql: string, params?: SQLiteValue[]): Promise<T[]>`
- [ ] Implement `transaction<T>(fn: () => Promise<T>): Promise<T>` - wrap in transaction
- [ ] Implement `close(): Promise<void>` - close database connection
- [ ] Database path from config: `config.dbPath || 'mango.db'`
- [ ] Remove the `throw new Error('Electron adapter not yet implemented...')` placeholder
- [ ] No forbidden strings: `'as any'`, `'void _'`, `'// TODO:'`
- [ ] pnpm run typecheck passes

**Notes:**
- better-sqlite3 is synchronous - wrap all methods in `Promise.resolve()` for interface compatibility
- Reference: https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md
- Transaction: `const tx = db.transaction(() => { ... }); tx();`
- This is the core adapter - other Electron-specific code builds on this

**Priority:** 9

---

### US-010: Create SQLite migration runner
**Description:** As a developer, I need a migration system to manage SQLite schema versions.

**Files to modify:**
- `packages/sqlite-adapter/src/migrations/index.ts` (~80 lines - replace placeholder)
- `packages/sqlite-adapter/src/migrations/types.ts` (NEW, ~20 lines)

**Acceptance Criteria:**
- [ ] `Migration` interface: `{ version: number; name: string; up: (db: SQLiteAdapter) => Promise<void>; down: (db: SQLiteAdapter) => Promise<void> }`
- [ ] `runMigrations(db: SQLiteAdapter, migrations: Migration[]): Promise<void>` function
- [ ] Creates `_migrations` table if not exists: `CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY, name TEXT, applied_at TEXT)`
- [ ] Gets current version: `SELECT MAX(version) FROM _migrations`
- [ ] Runs pending migrations in order (version > currentVersion)
- [ ] Records each migration: `INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)`
- [ ] Logs progress: `console.log('[SQLite] Running migration ${version}: ${name}')`
- [ ] No forbidden strings: `'as any'`, `'void _'`, `'// TODO:'`
- [ ] pnpm run typecheck passes

**Notes:**
- Migrations run in a transaction for safety
- If migration fails, transaction rolls back
- Similar pattern to Dexie's `.version(N).stores({...}).upgrade(...)`

**Priority:** 10

---

### US-011: Create initial SQLite schema (core tables)
**Description:** As a developer, I need the initial SQLite schema for appointments, tickets, and clients.

**Files to modify:**
- `packages/sqlite-adapter/src/migrations/v001_initial_schema.ts` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Export `migration_001` implementing `Migration` interface
- [ ] `version: 1`, `name: 'initial_schema'`
- [ ] Create `appointments` table with columns matching Dexie schema (id TEXT PRIMARY KEY, storeId TEXT, clientId TEXT, staffId TEXT, status TEXT, scheduledStartTime TEXT, scheduledEndTime TEXT, createdAt TEXT, updatedAt TEXT, syncStatus TEXT)
- [ ] Create `tickets` table (id, storeId, clientId, status, services TEXT (JSON), createdAt, updatedAt, syncStatus)
- [ ] Create `clients` table (id, storeId, firstName TEXT, lastName TEXT, phone TEXT, email TEXT, createdAt, updatedAt, syncStatus)
- [ ] Create indexes: `CREATE INDEX idx_appointments_store_status ON appointments(storeId, status)`
- [ ] Create indexes: `CREATE INDEX idx_tickets_store_status_created ON tickets(storeId, status, createdAt)`
- [ ] Create indexes: `CREATE INDEX idx_clients_store ON clients(storeId)`
- [ ] `down()` drops all tables in reverse order
- [ ] No forbidden strings: `'as any'`, `'void _'`, `'// TODO:'`
- [ ] pnpm run typecheck passes

**Notes:**
- Reference `apps/store-app/src/db/schema.ts` for Dexie field names
- SQLite types: TEXT for strings/dates, INTEGER for numbers, REAL for decimals
- JSON fields (like `services` array) stored as TEXT, parsed in application
- Compound indexes created with `CREATE INDEX idx_name ON table(col1, col2)`

**Priority:** 11

---

### US-012: Create SQLite schema (staff and services tables)
**Description:** As a developer, I need SQLite schema for staff and services tables.

**Files to modify:**
- `packages/sqlite-adapter/src/migrations/v002_staff_services.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Export `migration_002` implementing `Migration` interface
- [ ] `version: 2`, `name: 'staff_services'`
- [ ] Create `staff` table (id, storeId, name TEXT, email TEXT, phone TEXT, status TEXT, skills TEXT (JSON array), rating REAL, createdAt, updatedAt, syncStatus)
- [ ] Create `services` table (id, storeId, name TEXT, category TEXT, duration INTEGER, price REAL, createdAt, updatedAt, syncStatus)
- [ ] Create indexes for common queries
- [ ] `down()` drops tables
- [ ] No forbidden strings: `'as any'`, `'void _'`, `'// TODO:'`
- [ ] pnpm run typecheck passes

**Notes:**
- Continue pattern from v001
- Staff `skills` is JSON array stored as TEXT
- Services `duration` in minutes as INTEGER

**Priority:** 12

---

### US-013: Create Dexie to SQLite data migration utility
**Description:** As a developer, I need a utility to migrate data from IndexedDB to SQLite.

**Files to modify:**
- `packages/sqlite-adapter/src/migrations/dataMigration.ts` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] `migrateFromDexie(dexieDb: any, sqliteDb: SQLiteAdapter, onProgress?: (table: string, count: number) => void): Promise<MigrationResult>` function
- [ ] `MigrationResult` type: `{ success: boolean; tables: { name: string; count: number }[]; errors: string[] }`
- [ ] Migrate tables in order: staff, clients, services, appointments, tickets (dependencies first)
- [ ] For each table: `const records = await dexieDb[tableName].toArray()`
- [ ] Batch insert to SQLite: 500 records per transaction
- [ ] Call `onProgress(tableName, recordCount)` after each table
- [ ] Validate counts match: `dexieCount === sqliteCount`
- [ ] Return errors array if any validation fails
- [ ] No forbidden strings: `'as any'`, `'void _'`, `'// TODO:'`
- [ ] pnpm run typecheck passes

**Notes:**
- Read from Dexie via `.toArray()` (one-time full read is OK for migration)
- Batch insert for performance: `INSERT INTO table VALUES (...), (...), ...`
- JSON fields: `JSON.stringify()` before insert
- UUIDs preserved as-is (TEXT in SQLite)

**Priority:** 13

---

### US-014: Add feature flag for SQLite backend selection
**Description:** As a developer, I need a feature flag to switch between Dexie and SQLite backends.

**Files to modify:**
- `apps/store-app/src/config/featureFlags.ts` (NEW or modify existing, ~40 lines)
- `apps/store-app/src/services/dataService.ts` (~20 lines to add backend check)

**Acceptance Criteria:**
- [ ] `VITE_USE_SQLITE` environment variable support
- [ ] `isElectron(): boolean` function - checks `window.electron` or similar
- [ ] `shouldUseSQLite(): boolean` - returns true only if `isElectron() && import.meta.env.VITE_USE_SQLITE === 'true'`
- [ ] `getBackendType(): 'dexie' | 'sqlite'` function
- [ ] Log backend selection on app init: `console.log('[DataService] Using backend:', getBackendType())`
- [ ] In `dataService.ts`: check `shouldUseSQLite()` and route accordingly (placeholder for now)
- [ ] No forbidden strings: `'as any'`, `'void _'`
- [ ] pnpm run typecheck passes

**Notes:**
- Default to Dexie for safety (SQLite is opt-in)
- Web/Capacitor always use Dexie (no SQLite support yet)
- Electron can opt-in via env var
- Actual routing logic implemented in later story

**Priority:** 14

---

### US-015: Create SQLite client service
**Description:** As a developer, I need a SQLite-based client service matching the Dexie API.

**Files to modify:**
- `packages/sqlite-adapter/src/services/clientService.ts` (NEW, ~120 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~10 lines to export)

**Acceptance Criteria:**
- [ ] `ClientSQLiteService` class with constructor `(db: SQLiteAdapter)`
- [ ] `getAll(storeId: string, limit?: number, offset?: number): Promise<Client[]>`
- [ ] `getById(id: string): Promise<Client | undefined>`
- [ ] `getFiltered(storeId: string, filters: ClientFilters, sort: ClientSortOptions, limit: number, offset: number): Promise<{ clients: Client[]; total: number }>`
- [ ] `create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client>`
- [ ] `update(id: string, updates: Partial<Client>): Promise<Client | undefined>`
- [ ] `delete(id: string): Promise<boolean>`
- [ ] SQL queries use parameterized statements (no string concatenation)
- [ ] `getFiltered` uses SQL WHERE clauses instead of JS filtering
- [ ] No forbidden strings: `'as any'`, `'void _'`, `'// TODO:'`
- [ ] pnpm run typecheck passes

**Notes:**
- This is the SQLite equivalent of `clientsDB` in `database.ts`
- Key benefit: `getFiltered` can use SQL WHERE/LIKE instead of JS filter
- Pattern for other services to follow

**Priority:** 15

---

### US-016: Create SQLite ticket service with aggregations
**Description:** As a developer, I need a SQLite-based ticket service with SQL aggregation support.

**Files to modify:**
- `packages/sqlite-adapter/src/services/ticketService.ts` (NEW, ~150 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~5 lines to add export)

**Acceptance Criteria:**
- [ ] `TicketSQLiteService` class with constructor `(db: SQLiteAdapter)`
- [ ] Standard CRUD: `getAll`, `getById`, `create`, `update`, `delete`
- [ ] `getByStatus(storeId: string, status: string): Promise<Ticket[]>` using SQL WHERE
- [ ] `getActive(storeId: string): Promise<Ticket[]>` - status IN ('waiting', 'in-service')
- [ ] `getStaffTicketCounts(storeId: string, staffIds: string[], since: Date): Promise<Map<string, number>>` using SQL GROUP BY
- [ ] `getDailyStats(storeId: string, date: Date): Promise<{ total: number; completed: number; revenue: number }>` using SQL aggregation
- [ ] All queries parameterized
- [ ] No forbidden strings: `'as any'`, `'void _'`, `'// TODO:'`
- [ ] pnpm run typecheck passes

**Notes:**
- Key benefit: `getStaffTicketCounts` uses `SELECT staffId, COUNT(*) FROM ... GROUP BY staffId`
- `getDailyStats` uses `SELECT COUNT(*), SUM(total) FROM ...`
- These SQL aggregations replace expensive JS loops
- `services` JSON field: use `json_extract()` for SQLite or parse in application

**Priority:** 16

---

### Phase 3: Evaluate Mobile/Web SQLite

---

### US-017: Research wa-sqlite for web platform
**Description:** As a developer, I need to evaluate wa-sqlite viability for web browsers.

**Files to modify:**
- `packages/sqlite-adapter/docs/WA_SQLITE_EVALUATION.md` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Document wa-sqlite requirements: COOP/COEP headers, SharedArrayBuffer
- [ ] Document OPFS (Origin Private File System) browser support
- [ ] List performance benchmarks from wa-sqlite docs/issues
- [ ] Compare: wa-sqlite WASM overhead vs native IndexedDB
- [ ] Recommendation: use wa-sqlite or stick with Dexie for web
- [ ] If recommending wa-sqlite: list implementation steps
- [ ] If recommending Dexie: document why
- [ ] No forbidden strings: `'// TODO:'`

**Notes:**
- wa-sqlite has ~10-50ms overhead per query due to WASM
- Native IndexedDB is 1-5ms per query
- COOP/COEP headers required for SharedArrayBuffer (needed for OPFS)
- This is a research/documentation story, no code changes

**Priority:** 17

---

### US-018: Research Capacitor SQLite for mobile
**Description:** As a developer, I need to evaluate @capacitor-community/sqlite for iOS/Android.

**Files to modify:**
- `packages/sqlite-adapter/docs/CAPACITOR_SQLITE_EVALUATION.md` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Document @capacitor-community/sqlite plugin capabilities
- [ ] Document iOS/Android platform differences
- [ ] List performance benchmarks if available
- [ ] Document migration path from IndexedDB
- [ ] Document offline sync considerations
- [ ] Recommendation: implement Capacitor adapter or defer
- [ ] If implementing: list user stories needed
- [ ] No forbidden strings: `'// TODO:'`

**Notes:**
- @capacitor-community/sqlite is a community plugin, not official
- May have different behavior on iOS vs Android
- Need to consider: plugin updates, native code maintenance
- This is a research/documentation story

**Priority:** 18

---

### US-019: Phase 3 decision checkpoint
**Description:** As a developer, I need to make a go/no-go decision on mobile/web SQLite.

**Files to modify:**
- `packages/sqlite-adapter/docs/PHASE_3_DECISION.md` (NEW, ~50 lines)

**Acceptance Criteria:**
- [ ] Summarize Phase 1 performance results (from benchmark logs)
- [ ] Summarize Phase 2 Electron SQLite results
- [ ] Reference wa-sqlite evaluation (US-017)
- [ ] Reference Capacitor evaluation (US-018)
- [ ] Decision matrix: effort vs benefit for each platform
- [ ] Final recommendation: Full SQLite | Hybrid | Dexie everywhere
- [ ] If Full SQLite: create follow-up PRD for implementation
- [ ] If Hybrid/Dexie: document maintenance plan

**Notes:**
- This is the Phase 3 evaluation gate
- Based on actual performance data from Phase 1 and 2
- Decision should be data-driven, not speculative

**Priority:** 19

---

## Functional Requirements

**Phase 1:**
- FR-1 (US-001): Performance measurement utility exists
- FR-2 (US-002): Database abstraction interface defined
- FR-3 (US-003): Client filtering uses Dexie indexes (>50% faster)
- FR-4 (US-004): New compound indexes on tickets table
- FR-5 (US-005): Staff ticket count helper method exists
- FR-6 (US-006): Turn queue fetches tickets once (no N+1)
- FR-7 (US-007): Turn queue results cached 30 seconds
- FR-8 (US-008): Performance metrics uses batch queries

**Phase 2:**
- FR-9 (US-009): better-sqlite3 adapter for Electron works
- FR-10 (US-010): Migration runner tracks schema versions
- FR-11 (US-011): SQLite has core tables (appointments, tickets, clients)
- FR-12 (US-012): SQLite has staff and services tables
- FR-13 (US-013): Data migration from Dexie to SQLite works
- FR-14 (US-014): Feature flag controls backend selection
- FR-15 (US-015): SQLite client service matches Dexie API
- FR-16 (US-016): SQLite ticket service has SQL aggregations

**Phase 3:**
- FR-17 (US-017): wa-sqlite evaluation documented
- FR-18 (US-018): Capacitor SQLite evaluation documented
- FR-19 (US-019): Phase 3 decision documented with data

## Non-Goals (Out of Scope)

- UI changes (this is backend optimization only)
- Supabase schema changes
- Real-time sync refactoring
- Multi-store data isolation changes
- wa-sqlite or Capacitor implementation (Phase 3 is evaluation only)
- Redux state structure changes

## Technical Considerations

**Existing Patterns:**
- Dexie schema: `apps/store-app/src/db/schema.ts` (15 versions, ~900 lines)
- Database CRUD: `apps/store-app/src/db/database.ts` (~1,714 lines)
- SQLite adapter skeleton: `packages/sqlite-adapter/src/`
- Turn queue: `apps/store-app/src/services/turnQueueService.ts` (~220 lines)

**Critical Files:**
- `turnQueueService.ts` - N+1 at line 145
- `database.ts` - JS filtering at line 602
- `performanceOperations.ts` - N+1 at lines 154-167

**Risks:**
- better-sqlite3 native addon compilation on CI
- Data migration during active offline queue
- Schema version mismatch between Dexie/SQLite
- Feature flag rollback if SQLite has issues

## Success Metrics

| Metric | Current | Phase 1 Target | Phase 2 Target |
|--------|---------|----------------|----------------|
| Turn queue calc | ~500ms | <150ms | <50ms |
| Client filtering | ~300ms | <100ms | <50ms |
| Daily aggregation | ~2000ms | <500ms | <100ms |

## Open Questions

1. Should cache invalidation be automatic (via Redux middleware) or manual?
2. What's the rollback plan if SQLite migration corrupts data?
3. Should we keep Dexie as fallback even on Electron?

---

*PRD generated: January 2026*
*Working directory: /Users/seannguyen/Winsurf built/Mango-sqlite-migration/*
*Branch: feature/sqlite-migration*
