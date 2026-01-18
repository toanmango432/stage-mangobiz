# PRD: Complete SQLite Migration

## Introduction

Fully migrate Mango POS from Dexie/IndexedDB to SQLite for the Electron desktop platform. This builds on the existing foundation in `packages/sqlite-adapter` and implements all remaining table services, proper dataService routing, data migration from Dexie, and enables SQLite by default on Electron.

**Why SQLite?**
- 10-100x faster for complex queries and aggregations
- ACID transactions with real rollback support
- No browser storage limits or data loss risk
- Native SQL queries instead of JS iteration
- Better data integrity with foreign keys and constraints

## Goals

- Migrate all 30+ Dexie tables to SQLite equivalents
- Wire dataService to route to SQLite when enabled on Electron
- Implement Dexie → SQLite data migration for existing users
- Enable SQLite by default on Electron (with fallback)
- Achieve feature parity with Dexie implementation
- Zero data loss during migration

## Architecture

### Scalable Service Pattern

Instead of 30+ individual service files, we use a **generic service factory**:

```typescript
// Base service handles common CRUD
class BaseSQLiteService<T> {
  constructor(tableName: string, schema: TableSchema) {}
  getAll(storeId: string): Promise<T[]>
  getById(id: string): Promise<T | undefined>
  create(data: Omit<T, 'id'>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<boolean>
}

// Table-specific services extend for custom queries
class AppointmentSQLiteService extends BaseSQLiteService<Appointment> {
  getByDateRange(storeId: string, start: Date, end: Date): Promise<Appointment[]>
  getByStaff(staffId: string): Promise<Appointment[]>
}
```

### Table Categories

| Category | Tables | Priority |
|----------|--------|----------|
| **Core** | appointments, tickets, clients, staff, services, transactions | P1 |
| **Infrastructure** | settings, syncQueue, deviceSettings | P1 |
| **Team** | teamMembers, timesheets, payRuns | P2 |
| **CRM** | patchTests, formTemplates, formResponses, referrals, clientReviews, loyaltyRewards, reviewRequests, customSegments | P2 |
| **Catalog** | serviceCategories, menuServices, serviceVariants, servicePackages, addOnGroups, addOnOptions, staffServiceAssignments, catalogSettings, products | P3 |
| **Scheduling** | timeOffTypes, timeOffRequests, blockedTimeTypes, blockedTimeEntries, businessClosedPeriods, resources, resourceBookings, staffSchedules | P3 |
| **Gift Cards** | giftCardDenominations, giftCardSettings, giftCards, giftCardTransactions, giftCardDesigns | P3 |

---

## User Stories

### Phase 1: Core Infrastructure

---

### US-001: Create BaseSQLiteService generic class
**Description:** As a developer, I need a reusable base service that handles common CRUD operations for any table, reducing code duplication.

**Files to modify:**
- `packages/sqlite-adapter/src/services/BaseSQLiteService.ts` (NEW, ~200 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~5 lines)

**Acceptance Criteria:**
- [ ] Generic class `BaseSQLiteService<T, TRow>` with table name and schema config
- [ ] Implements: `getAll()`, `getById()`, `getByIds()`, `create()`, `update()`, `delete()`, `count()`
- [ ] Handles camelCase ↔ snake_case conversion via schema config
- [ ] Handles boolean ↔ integer conversion for SQLite
- [ ] Handles JSON string ↔ object conversion
- [ ] Uses parameterized queries (no SQL injection)
- [ ] No forbidden strings: 'as any', 'Test Client'
- [ ] pnpm typecheck passes in sqlite-adapter package

**Notes:**
- Follow pattern from existing `ClientSQLiteService` for conversion logic
- Schema config defines field mappings: `{ storeId: 'store_id', isBlocked: { column: 'is_blocked', type: 'boolean' } }`
- Use generics to maintain type safety

**Priority:** 1

---

### US-002: Create TableSchema type and registry
**Description:** As a developer, I need a schema registry that defines the structure of each table for the generic service.

**Files to modify:**
- `packages/sqlite-adapter/src/schema/types.ts` (NEW, ~80 lines)
- `packages/sqlite-adapter/src/schema/registry.ts` (NEW, ~150 lines)
- `packages/sqlite-adapter/src/schema/index.ts` (NEW, ~10 lines)

**Acceptance Criteria:**
- [ ] `TableSchema` interface with: tableName, primaryKey, columns array
- [ ] `ColumnSchema` interface with: name, dbColumn, type ('string'|'number'|'boolean'|'json'|'date')
- [ ] `schemaRegistry` object with schemas for core tables (appointments, tickets, clients, staff, services, transactions)
- [ ] Export from package index
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Schema should match existing Dexie table definitions
- Type field determines conversion logic in BaseSQLiteService

**Priority:** 2

---

### US-003: Wire dataService to use SQLite services
**Description:** As a developer, I need dataService to route to SQLite implementations when the feature flag is enabled.

**Files to modify:**
- `apps/store-app/src/services/dataService.ts` (~100 lines to add)
- `apps/store-app/src/services/sqliteServices.ts` (NEW, ~50 lines)

**Acceptance Criteria:**
- [ ] Import SQLite services from @mango/sqlite-adapter
- [ ] Check `shouldUseSQLite()` at module level
- [ ] Route each dataService method to SQLite or Dexie based on flag
- [ ] Log backend selection on first use: `[DataService] Using SQLite backend`
- [ ] All existing dataService.clients methods route correctly
- [ ] No runtime errors when SQLite disabled (graceful fallback)
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Start with clients only (already has SQLiteService)
- Pattern: `clients: shouldUseSQLite() ? sqliteClients : dexieClients`
- Use lazy initialization to avoid loading SQLite on web

**Priority:** 3

---

### US-004: Enhance migration system for full schema
**Description:** As a developer, I need the migration system to create all required tables with proper indexes.

**Files to modify:**
- `packages/sqlite-adapter/src/migrations/v003_full_schema.ts` (NEW, ~400 lines)
- `packages/sqlite-adapter/src/migrations/index.ts` (~10 lines)

**Acceptance Criteria:**
- [ ] Creates all infrastructure tables: settings, syncQueue, deviceSettings
- [ ] Creates all CRM tables with proper columns
- [ ] Creates compound indexes matching Dexie schema v16
- [ ] Creates foreign key constraints where appropriate
- [ ] Has rollback (down) function that drops tables
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Reference Dexie schema.ts v16 for exact table/column definitions
- Use CREATE TABLE IF NOT EXISTS for idempotency
- Group related tables in comments for readability

**Priority:** 4

---

### Phase 2: Core Table Services

---

### US-005: Create AppointmentSQLiteService
**Description:** As a developer, I need SQLite service for appointments with date range queries.

**Files to modify:**
- `packages/sqlite-adapter/src/services/appointmentService.ts` (NEW, ~250 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~5 lines)

**Acceptance Criteria:**
- [ ] Extends BaseSQLiteService<Appointment>
- [ ] `getByDateRange(storeId, start, end)` - uses SQL BETWEEN
- [ ] `getByStaff(staffId, date?)` - filters by staff with optional date
- [ ] `getByClient(clientId)` - filters by client
- [ ] `getByStatus(storeId, status)` - filters by status
- [ ] `getUpcoming(storeId, hours)` - appointments in next N hours
- [ ] Handles nested objects (services array) as JSON
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Date comparisons use ISO string format
- Services array stored as JSON TEXT column
- Reference existing Dexie appointmentsDB for method signatures

**Priority:** 5

---

### US-006: Create TransactionSQLiteService
**Description:** As a developer, I need SQLite service for transactions with aggregation queries.

**Files to modify:**
- `packages/sqlite-adapter/src/services/transactionService.ts` (NEW, ~200 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~3 lines)

**Acceptance Criteria:**
- [ ] Extends BaseSQLiteService<Transaction>
- [ ] `getByTicket(ticketId)` - all transactions for a ticket
- [ ] `getByDateRange(storeId, start, end)` - for reporting
- [ ] `getTotalByDateRange(storeId, start, end)` - SUM aggregation
- [ ] `getByPaymentMethod(storeId, method)` - filter by payment type
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Use SQL SUM() for aggregations instead of JS reduce
- Transaction type includes payment method, amounts, status

**Priority:** 6

---

### US-007: Create StaffSQLiteService
**Description:** As a developer, I need SQLite service for staff with availability queries.

**Files to modify:**
- `packages/sqlite-adapter/src/services/staffService.ts` (NEW, ~180 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~3 lines)

**Acceptance Criteria:**
- [ ] Extends BaseSQLiteService<Staff>
- [ ] `getAvailable(storeId)` - staff with status != 'off'
- [ ] `getByStatus(storeId, status)` - filter by status
- [ ] `updateStatus(id, status)` - quick status update
- [ ] Handles schedule JSON field
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Staff status: 'available', 'busy', 'break', 'off'
- Schedule stored as JSON with weekly hours

**Priority:** 7

---

### US-008: Create ServiceSQLiteService
**Description:** As a developer, I need SQLite service for services/menu items.

**Files to modify:**
- `packages/sqlite-adapter/src/services/serviceService.ts` (NEW, ~150 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~3 lines)

**Acceptance Criteria:**
- [ ] Extends BaseSQLiteService<Service>
- [ ] `getByCategory(storeId, category)` - filter by category
- [ ] `getActive(storeId)` - only active services
- [ ] `search(storeId, query)` - name/description search with LIKE
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Services have category, price, duration fields
- Used by booking flow for service selection

**Priority:** 8

---

### US-009: Enhance TicketSQLiteService with full methods
**Description:** As a developer, I need the ticket service to match all Dexie ticketsDB methods.

**Files to modify:**
- `packages/sqlite-adapter/src/services/ticketService.ts` (~150 lines to add)

**Acceptance Criteria:**
- [ ] `getActive(storeId)` - status in ('waiting', 'in-service')
- [ ] `getByStatus(storeId, status)` - filter by any status
- [ ] `getByDateRange(storeId, start, end)` - for reporting
- [ ] `getStaffTicketCounts(storeId, staffIds, since)` - aggregation query
- [ ] `getPending(storeId)` - status = 'completed' (awaiting payment)
- [ ] Services array handled as JSON with proper parsing
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Ticket statuses: 'waiting', 'in-service', 'completed', 'paid', 'closed'
- getStaffTicketCounts needs to parse services JSON and count by staffId

**Priority:** 9

---

### US-010: Wire remaining core services to dataService
**Description:** As a developer, I need dataService to route all core table operations to SQLite.

**Files to modify:**
- `apps/store-app/src/services/dataService.ts` (~200 lines)
- `apps/store-app/src/services/sqliteServices.ts` (~50 lines)

**Acceptance Criteria:**
- [ ] dataService.appointments routes to SQLite when enabled
- [ ] dataService.transactions routes to SQLite when enabled
- [ ] dataService.staff routes to SQLite when enabled
- [ ] dataService.services routes to SQLite when enabled
- [ ] dataService.tickets routes to SQLite when enabled
- [ ] All methods have matching signatures between SQLite and Dexie
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Maintain backward compatibility - Dexie still works when SQLite disabled
- Use consistent return types between both implementations

**Priority:** 10

---

### Phase 3: Infrastructure & Settings Tables

---

### US-011: Create SettingsSQLiteService
**Description:** As a developer, I need SQLite service for key-value settings storage.

**Files to modify:**
- `packages/sqlite-adapter/src/services/settingsService.ts` (NEW, ~100 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~3 lines)

**Acceptance Criteria:**
- [ ] `get(key)` - retrieve setting by key
- [ ] `set(key, value)` - upsert setting
- [ ] `getAll()` - all settings
- [ ] `delete(key)` - remove setting
- [ ] Value stored as JSON TEXT for flexibility
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Settings table has simple key-value structure
- Value can be any JSON-serializable type

**Priority:** 11

---

### US-012: Create SyncQueueSQLiteService
**Description:** As a developer, I need SQLite service for the offline sync queue.

**Files to modify:**
- `packages/sqlite-adapter/src/services/syncQueueService.ts` (NEW, ~180 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~3 lines)

**Acceptance Criteria:**
- [ ] `add(operation)` - queue a sync operation
- [ ] `getNext(limit)` - get pending operations by priority
- [ ] `markComplete(id)` - mark operation as synced
- [ ] `markFailed(id, error)` - mark with failure reason
- [ ] `getPending()` - all unsynced operations
- [ ] `clearCompleted()` - remove synced items
- [ ] Operations ordered by priority then createdAt
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Sync queue critical for offline-first architecture
- Priority: 1=high, 2=medium, 3=low
- Status: 'pending', 'syncing', 'complete', 'failed'

**Priority:** 12

---

### US-013: Create DeviceSettingsSQLiteService
**Description:** As a developer, I need SQLite service for device-specific settings.

**Files to modify:**
- `packages/sqlite-adapter/src/services/deviceSettingsService.ts` (NEW, ~80 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~3 lines)

**Acceptance Criteria:**
- [ ] `get(deviceId)` - get settings for device
- [ ] `set(deviceId, settings)` - upsert device settings
- [ ] `delete(deviceId)` - remove device settings
- [ ] Handles mode, offlineModeEnabled, other device config
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Primary key is deviceId (not auto-generated id)
- Device settings include POS configuration, printer settings

**Priority:** 13

---

### US-014: Add migration v004 for infrastructure tables
**Description:** As a developer, I need SQLite schema for settings, sync queue, and device settings.

**Files to modify:**
- `packages/sqlite-adapter/src/migrations/v004_infrastructure.ts` (NEW, ~100 lines)
- `packages/sqlite-adapter/src/migrations/index.ts` (~3 lines)

**Acceptance Criteria:**
- [ ] Creates settings table with key PRIMARY KEY
- [ ] Creates syncQueue table with priority index
- [ ] Creates deviceSettings table with deviceId PRIMARY KEY
- [ ] All tables have proper indexes
- [ ] Has down() function for rollback
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Priority:** 14

---

### US-015: Wire infrastructure services to dataService
**Description:** As a developer, I need dataService to route settings and sync operations to SQLite.

**Files to modify:**
- `apps/store-app/src/services/dataService.ts` (~80 lines)

**Acceptance Criteria:**
- [ ] dataService.settings routes to SQLite when enabled
- [ ] dataService.syncQueue routes to SQLite when enabled
- [ ] settingsDB methods all have SQLite equivalents
- [ ] syncQueueDB methods all have SQLite equivalents
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Priority:** 15

---

### Phase 4: Team & CRM Tables

---

### US-016: Create TeamMemberSQLiteService
**Description:** As a developer, I need SQLite service for team member management.

**Files to modify:**
- `packages/sqlite-adapter/src/services/teamMemberService.ts` (NEW, ~150 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~3 lines)

**Acceptance Criteria:**
- [ ] Extends BaseSQLiteService<TeamMember>
- [ ] `getActive(storeId)` - only active team members
- [ ] `getByRole(storeId, role)` - filter by permissions role
- [ ] `softDelete(id)` - sets isDeleted=true instead of hard delete
- [ ] Profile stored as nested JSON
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- TeamMember has profile object with name, email, avatar
- Permissions object with role field
- Soft delete pattern for audit trail

**Priority:** 16

---

### US-017: Create CRM SQLite services (batch)
**Description:** As a developer, I need SQLite services for all CRM-related tables.

**Files to modify:**
- `packages/sqlite-adapter/src/services/crmServices.ts` (NEW, ~400 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~10 lines)

**Acceptance Criteria:**
- [ ] PatchTestSQLiteService with getByClient, getExpiring methods
- [ ] FormTemplateSQLiteService with getActive method
- [ ] FormResponseSQLiteService with getByClient, getByAppointment methods
- [ ] ReferralSQLiteService with getByReferrer method
- [ ] ClientReviewSQLiteService with getByClient, getByStaff, getAverageRating methods
- [ ] LoyaltyRewardSQLiteService with getByClient, getAvailable methods
- [ ] ReviewRequestSQLiteService with getByStatus, getPending methods
- [ ] CustomSegmentSQLiteService with getActive method
- [ ] All use BaseSQLiteService pattern
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Group related services in single file for maintainability
- Each service ~50 lines with specific query methods

**Priority:** 17

---

### US-018: Add migration v005 for team and CRM tables
**Description:** As a developer, I need SQLite schema for team and CRM tables.

**Files to modify:**
- `packages/sqlite-adapter/src/migrations/v005_team_crm.ts` (NEW, ~250 lines)
- `packages/sqlite-adapter/src/migrations/index.ts` (~3 lines)

**Acceptance Criteria:**
- [ ] Creates teamMembers table with profile JSON column
- [ ] Creates timesheets, payRuns tables
- [ ] Creates all CRM tables: patchTests, formTemplates, formResponses, referrals, clientReviews, loyaltyRewards, reviewRequests, customSegments
- [ ] All tables have storeId index and appropriate compound indexes
- [ ] Has down() function for rollback
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Priority:** 18

---

### US-019: Wire team/CRM services to dataService
**Description:** As a developer, I need dataService to route team and CRM operations to SQLite.

**Files to modify:**
- `apps/store-app/src/services/dataService.ts` (~150 lines)

**Acceptance Criteria:**
- [ ] All CRM dataService methods route to SQLite when enabled
- [ ] patchTests, formResponses, referrals, clientReviews all wired
- [ ] loyaltyRewards, reviewRequests, customSegments all wired
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Priority:** 19

---

### Phase 5: Catalog Tables

---

### US-020: Create Catalog SQLite services
**Description:** As a developer, I need SQLite services for service catalog tables.

**Files to modify:**
- `packages/sqlite-adapter/src/services/catalogServices.ts` (NEW, ~350 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~10 lines)

**Acceptance Criteria:**
- [ ] ServiceCategorySQLiteService with getActive, getByParent methods
- [ ] MenuServiceSQLiteService with getByCategory, getActive methods
- [ ] ServiceVariantSQLiteService with getByService methods
- [ ] ServicePackageSQLiteService with getActive method
- [ ] AddOnGroupSQLiteService with getActive method
- [ ] AddOnOptionSQLiteService with getByGroup method
- [ ] StaffServiceAssignmentSQLiteService with getByStaff, getByService methods
- [ ] CatalogSettingsSQLiteService with get/set methods
- [ ] ProductSQLiteService with getByCategory, getActive, search methods
- [ ] All use BaseSQLiteService pattern
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Priority:** 20

---

### US-021: Add migration v006 for catalog tables
**Description:** As a developer, I need SQLite schema for catalog tables.

**Files to modify:**
- `packages/sqlite-adapter/src/migrations/v006_catalog.ts` (NEW, ~200 lines)
- `packages/sqlite-adapter/src/migrations/index.ts` (~3 lines)

**Acceptance Criteria:**
- [ ] Creates serviceCategories with parent relationship
- [ ] Creates menuServices with category foreign key
- [ ] Creates serviceVariants, servicePackages, addOnGroups, addOnOptions
- [ ] Creates staffServiceAssignments with staff+service compound index
- [ ] Creates catalogSettings and products tables
- [ ] Proper indexes for filtering queries
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Priority:** 21

---

### Phase 6: Scheduling Tables

---

### US-022: Create Scheduling SQLite services
**Description:** As a developer, I need SQLite services for scheduling-related tables.

**Files to modify:**
- `packages/sqlite-adapter/src/services/schedulingServices.ts` (NEW, ~400 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~10 lines)

**Acceptance Criteria:**
- [ ] TimeOffTypeSQLiteService with getActive method
- [ ] TimeOffRequestSQLiteService with getByStaff, getByDateRange, getByStatus methods
- [ ] BlockedTimeTypeSQLiteService with getActive method
- [ ] BlockedTimeEntrySQLiteService with getByStaff, getByDateRange, getBySeries methods
- [ ] BusinessClosedPeriodSQLiteService with getActive, getByDateRange methods
- [ ] ResourceSQLiteService with getActive, getByCategory methods
- [ ] ResourceBookingSQLiteService with getByResource, getByAppointment methods
- [ ] StaffScheduleSQLiteService with getByStaff, getEffective methods
- [ ] All use BaseSQLiteService pattern
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Priority:** 22

---

### US-023: Add migration v007 for scheduling tables
**Description:** As a developer, I need SQLite schema for scheduling tables.

**Files to modify:**
- `packages/sqlite-adapter/src/migrations/v007_scheduling.ts` (NEW, ~200 lines)
- `packages/sqlite-adapter/src/migrations/index.ts` (~3 lines)

**Acceptance Criteria:**
- [ ] Creates timeOffTypes, timeOffRequests tables
- [ ] Creates blockedTimeTypes, blockedTimeEntries tables
- [ ] Creates businessClosedPeriods table
- [ ] Creates resources, resourceBookings tables
- [ ] Creates staffSchedules table
- [ ] DateTime range indexes for efficient queries
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Priority:** 23

---

### Phase 7: Gift Card Tables

---

### US-024: Create Gift Card SQLite services
**Description:** As a developer, I need SQLite services for gift card functionality.

**Files to modify:**
- `packages/sqlite-adapter/src/services/giftCardServices.ts` (NEW, ~250 lines)
- `packages/sqlite-adapter/src/services/index.ts` (~5 lines)

**Acceptance Criteria:**
- [ ] GiftCardDenominationSQLiteService with getActive method
- [ ] GiftCardSettingsSQLiteService with get/set methods
- [ ] GiftCardSQLiteService with getByCode, getByStatus, getByPurchaser methods
- [ ] GiftCardTransactionSQLiteService with getByCard, getByTicket methods
- [ ] GiftCardDesignSQLiteService with getActive, getDefault methods
- [ ] Balance calculations use SQL SUM
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Priority:** 24

---

### US-025: Add migration v008 for gift card tables
**Description:** As a developer, I need SQLite schema for gift card tables.

**Files to modify:**
- `packages/sqlite-adapter/src/migrations/v008_giftcards.ts` (NEW, ~120 lines)
- `packages/sqlite-adapter/src/migrations/index.ts` (~3 lines)

**Acceptance Criteria:**
- [ ] Creates giftCardDenominations table
- [ ] Creates giftCardSettings table
- [ ] Creates giftCards table with code unique index
- [ ] Creates giftCardTransactions table with card foreign key
- [ ] Creates giftCardDesigns table
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Priority:** 25

---

### US-026: Wire all remaining services to dataService
**Description:** As a developer, I need dataService to route all remaining tables to SQLite.

**Files to modify:**
- `apps/store-app/src/services/dataService.ts` (~200 lines)

**Acceptance Criteria:**
- [ ] All catalog services wired
- [ ] All scheduling services wired
- [ ] All gift card services wired
- [ ] Every Dexie DB export has SQLite equivalent route
- [ ] Feature flag correctly switches all operations
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Priority:** 26

---

### Phase 8: Data Migration

---

### US-027: Create Dexie to SQLite migration utility
**Description:** As a developer, I need a utility to migrate existing Dexie data to SQLite on first run.

**Files to modify:**
- `packages/sqlite-adapter/src/migrations/dataMigration.ts` (modify existing, ~300 lines)
- `apps/store-app/src/services/migrationService.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] `migrateFromDexie(dexieDb, sqliteDb)` function
- [ ] Migrates all tables in dependency order (clients before tickets)
- [ ] Progress callback for UI feedback
- [ ] Transaction wrapping - all or nothing
- [ ] Handles existing partial migrations (resume support)
- [ ] Logs migration stats (records migrated per table)
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Migration should be idempotent - safe to run multiple times
- Check for existing records to avoid duplicates
- Use batch inserts for performance (100 records per batch)

**Priority:** 27

---

### US-028: Create migration status tracking
**Description:** As a developer, I need to track migration status so we don't re-migrate on every app start.

**Files to modify:**
- `packages/sqlite-adapter/src/migrations/migrationStatus.ts` (NEW, ~80 lines)
- `apps/store-app/src/config/featureFlags.ts` (~30 lines)

**Acceptance Criteria:**
- [ ] `getMigrationStatus()` - returns { completed: boolean, version: number, migratedAt: string }
- [ ] `setMigrationComplete(version)` - marks migration done
- [ ] Status stored in SQLite _migrations meta table
- [ ] `needsMigration()` export added to featureFlags
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Status table created in v001 migration
- Check this before attempting Dexie→SQLite migration

**Priority:** 28

---

### US-029: Add migration trigger on app initialization
**Description:** As a developer, I need the app to automatically trigger migration on first SQLite-enabled run.

**Files to modify:**
- `apps/store-app/src/App.tsx` (~30 lines)
- `apps/store-app/src/components/MigrationProgress.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Check `needsMigration()` on app mount
- [ ] Show MigrationProgress modal during migration
- [ ] Display progress: "Migrating clients... 1,234 records"
- [ ] Handle errors gracefully with retry option
- [ ] Continue to Dexie mode if migration fails
- [ ] Mark complete and continue when done
- [ ] No forbidden strings
- [ ] pnpm typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Migration runs once per device
- Non-blocking - show progress but don't freeze UI
- Allow user to skip and use Dexie

**Priority:** 29

---

### Phase 9: Testing & Production

---

### US-030: Add SQLite service unit tests
**Description:** As a developer, I need unit tests for core SQLite services.

**Files to modify:**
- `packages/sqlite-adapter/src/services/__tests__/BaseSQLiteService.test.ts` (NEW, ~200 lines)
- `packages/sqlite-adapter/src/services/__tests__/clientService.test.ts` (NEW, ~150 lines)
- `packages/sqlite-adapter/src/services/__tests__/appointmentService.test.ts` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Tests for BaseSQLiteService CRUD operations
- [ ] Tests for type conversions (boolean, JSON, date)
- [ ] Tests for ClientSQLiteService.getFiltered with various filters
- [ ] Tests for AppointmentSQLiteService.getByDateRange
- [ ] Mock SQLite adapter for isolated testing
- [ ] All tests pass: `pnpm test --filter=@mango/sqlite-adapter`
- [ ] No forbidden strings

**Notes:**
- Use vitest for consistency with rest of project
- Create mock adapter that uses in-memory storage

**Priority:** 30

---

### US-031: Add integration tests for data migration
**Description:** As a developer, I need integration tests that verify Dexie→SQLite migration works correctly.

**Files to modify:**
- `packages/sqlite-adapter/src/migrations/__tests__/dataMigration.test.ts` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Test migrates sample data correctly
- [ ] Test handles empty database
- [ ] Test resumes partial migration
- [ ] Test rolls back on error
- [ ] Test preserves data integrity (counts match)
- [ ] All tests pass
- [ ] No forbidden strings

**Priority:** 31

---

### US-032: Enable SQLite by default on Electron
**Description:** As a developer, I need SQLite to be the default backend on Electron.

**Files to modify:**
- `apps/store-app/src/config/featureFlags.ts` (~20 lines)
- `apps/store-app/.env.example` (~5 lines)

**Acceptance Criteria:**
- [ ] `shouldUseSQLite()` returns true by default on Electron
- [ ] New env var `VITE_DISABLE_SQLITE=true` to opt-out
- [ ] Web and Capacitor still default to Dexie
- [ ] Update .env.example with new variable and comment
- [ ] Log message on startup indicates SQLite is active
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Flip the default: SQLite ON unless explicitly disabled
- This is the final switch to make SQLite primary on Electron

**Priority:** 32

---

### US-033: Add Electron build configuration for better-sqlite3
**Description:** As a developer, I need the Electron build to include native better-sqlite3 bindings.

**Files to modify:**
- `apps/store-app/electron/package.json` (NEW or modify, ~30 lines)
- `apps/store-app/electron/electron-builder.json` (NEW, ~50 lines)
- `package.json` (root, ~10 lines)

**Acceptance Criteria:**
- [ ] better-sqlite3 listed as dependency (not devDependency)
- [ ] electron-rebuild script added
- [ ] electron-builder config excludes native modules from asar
- [ ] Build script: `pnpm electron:build` works
- [ ] Native bindings compile for target platform
- [ ] No forbidden strings
- [ ] Build produces working Electron app

**Notes:**
- Native modules need special handling in Electron
- Use electron-rebuild to compile for Electron's Node version
- Test on at least one platform (macOS or Windows)

**Priority:** 33

---

### US-034: Add performance benchmarks
**Description:** As a developer, I need benchmarks comparing SQLite vs Dexie performance.

**Files to modify:**
- `apps/store-app/src/utils/__tests__/sqliteBenchmark.test.ts` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Benchmark: bulk insert 1000 clients
- [ ] Benchmark: filtered query with 10k records
- [ ] Benchmark: aggregation (COUNT, SUM) with 10k records
- [ ] Benchmark: complex filter (multiple conditions)
- [ ] Results logged with timing comparisons
- [ ] SQLite faster for all complex operations
- [ ] No forbidden strings

**Notes:**
- Run with `pnpm test -- sqliteBenchmark --reporter=verbose`
- Document results in PR for reference

**Priority:** 34

---

### US-035: Create rollback safety mechanism
**Description:** As a developer, I need a way to rollback to Dexie if SQLite has issues in production.

**Files to modify:**
- `apps/store-app/src/services/databaseRecovery.ts` (NEW, ~100 lines)
- `apps/store-app/src/config/featureFlags.ts` (~20 lines)

**Acceptance Criteria:**
- [ ] `detectDatabaseIssues()` - checks for corruption/errors
- [ ] `rollbackToIndexedDB()` - disables SQLite, falls back to Dexie
- [ ] Auto-rollback after 3 consecutive SQLite errors
- [ ] User notification when rollback occurs
- [ ] Rollback state persisted in localStorage (survives restart)
- [ ] Manual re-enable via settings or env var
- [ ] No forbidden strings
- [ ] pnpm typecheck passes

**Notes:**
- Safety mechanism for production issues
- Should be rare but critical when needed

**Priority:** 35

---

## Functional Requirements

| ID | Story | Requirement |
|----|-------|-------------|
| FR-1 | US-001 | System provides generic BaseSQLiteService for CRUD operations |
| FR-2 | US-003 | dataService routes to SQLite or Dexie based on feature flag |
| FR-3 | US-005-009 | All core tables have SQLite service implementations |
| FR-4 | US-027-029 | Existing Dexie data migrates to SQLite automatically |
| FR-5 | US-032 | SQLite is default backend on Electron |
| FR-6 | US-035 | System can rollback to Dexie if SQLite fails |

## Non-Goals (Out of Scope)

- **Capacitor SQLite for mobile** - iOS/Android stay on Dexie for now. **Planned for future PRD** after Electron SQLite is stable. Will use `@capacitor-community/sqlite` plugin.
- **wa-sqlite for web** - Web browser stays on Dexie permanently (not worth complexity, no real benefit)
- **Real-time sync** - Supabase sync unchanged, works with either backend
- **Schema changes** - No changes to data model, just storage backend
- **API mode** - REST API mode unchanged, this only affects local storage

## Future Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **This PRD** | Electron SQLite | 🔄 Planning |
| **Future PRD** | iOS/Android Capacitor SQLite | 📋 Planned |
| **No plans** | Web SQLite (wa-sqlite) | ❌ Not needed |

## Technical Considerations

### Existing Patterns to Follow
- `packages/sqlite-adapter/src/services/clientService.ts` - Complete service example
- `apps/store-app/src/db/database.ts` - Dexie method signatures to match
- `apps/store-app/src/services/dataService.ts` - Routing pattern

### Files That Will Be Modified
- `packages/sqlite-adapter/src/` - All new service files (~2000 lines total)
- `apps/store-app/src/services/dataService.ts` - Add SQLite routing (~500 lines)
- `apps/store-app/src/config/featureFlags.ts` - Update defaults (~50 lines)
- `apps/store-app/src/App.tsx` - Migration trigger (~30 lines)

### Risks
- **Native compilation** - better-sqlite3 needs platform-specific builds
- **Data migration** - Must not lose existing user data
- **Performance regression** - Need benchmarks to verify improvements

## Open Questions

1. Should we support Windows/Linux Electron builds or macOS only initially?
2. What's the acceptable migration time for large datasets (10k+ records)?
3. Should migration be mandatory or allow users to stay on Dexie?

---

## CRITICAL ISSUES IDENTIFIED (Review Findings)

### Issue 1: Schema Column Mismatch (BLOCKING)

**Problem**: Existing SQLite migrations (v001, v002) only create ~8 columns per table, but services expect 45-50 columns.

| Table | v001 Columns | Service Expects | Gap |
|-------|--------------|-----------------|-----|
| clients | 8 | 50+ | **Missing 42 columns** |
| tickets | 8 | 45 | **Missing 37 columns** |
| appointments | 8 | 20+ | **Missing 12 columns** |

**Fix**: US-004 MUST create complete schemas with ALL columns before any service can work.

### Issue 2: Story Dependency Order

**Problem**: US-003 (wire dataService, Priority 3) tries to use SQLite services that don't exist until Priority 5-9.

**Fix**: Reorder priorities:
- US-005-009 (create services) → Priority 3-7
- US-003 (wire dataService) → Priority 8

### Issue 3: Rollback Data Loss Risk

**Problem**: If user creates 50 clients in SQLite, then rollback occurs, those clients are LOST because Dexie doesn't have them.

**Fix**: Add US-038 for bi-directional sync - continue writing to Dexie during SQLite operation so rollback loses nothing.

### Issue 4: getStaffTicketCounts Performance

**Problem**: Current implementation loads ALL tickets into memory and parses JSON in JavaScript. For 10k tickets = 20MB memory.

**Fix**: Use SQLite `json_each()` function:
```sql
SELECT json_extract(value, '$.staffId') as staff_id, COUNT(*)
FROM tickets, json_each(tickets.services)
WHERE store_id = ? GROUP BY staff_id
```

### Issue 5: Migration Resume Support Missing

**Problem**: No checkpointing. If migration fails at record 25,000 of 50,000, must restart from scratch.

**Fix**: Add `_migration_progress` table with per-table checkpoints.

### Issue 6: Date/Boolean Type Handling

**Problem**: `String(new Date())` produces "Mon Jan 17 2026..." not ISO format. Boolean fields may have `null` instead of `true/false`.

**Fix**: Add utility functions with strict type conversion:
```typescript
function toISOString(value: unknown): string
function boolToSQLite(value: unknown): 0 | 1
```

---

## Additional User Stories (From Review)

### US-036: Fix client schema with ALL columns
**Priority:** 1.5 (must run before US-005)

**Files:** `packages/sqlite-adapter/src/migrations/v001_initial_schema.ts`

**Criteria:**
- [ ] Add all 50+ client columns from ClientSQLiteService interface
- [ ] Add missing indexes: `[storeId+lastName]`, `[storeId+isVip]`, `[storeId+createdAt]`
- [ ] Match Dexie schema v16 exactly

---

### US-037: Fix ticket schema with ALL columns
**Priority:** 1.6

**Files:** `packages/sqlite-adapter/src/migrations/v001_initial_schema.ts`

**Criteria:**
- [ ] Add all 45 ticket columns from TicketSQLiteService interface
- [ ] Add `number`, `appointmentId`, `isGroupTicket`, `clients` JSON columns
- [ ] Add `isMergedTicket`, `mergedFromTickets`, signature columns
- [ ] Add missing indexes: `[clientId+createdAt]`, `[storeId+staffId+createdAt]`

---

### US-038: Bi-directional sync for safe rollback
**Priority:** 28.5 (after migration, before production)

**Files:** `apps/store-app/src/services/dualWriteService.ts` (NEW)

**Criteria:**
- [ ] When SQLite enabled, ALSO write to Dexie in background
- [ ] Dexie acts as backup during SQLite stabilization period
- [ ] On rollback, Dexie has all data - no loss
- [ ] Disable dual-write after 30 days stable

---

### US-039: Database health monitoring
**Priority:** 34.5

**Files:** `packages/sqlite-adapter/src/health/dbHealth.ts` (NEW)

**Criteria:**
- [ ] Run `PRAGMA integrity_check` daily
- [ ] Run `PRAGMA quick_check` on app start
- [ ] Detect corruption and trigger rollback
- [ ] Create daily backup file (keep 7 days)

---

### US-040: Optimize getStaffTicketCounts with SQL
**Priority:** 9.5 (part of ticket service)

**Files:** `packages/sqlite-adapter/src/services/ticketService.ts`

**Criteria:**
- [ ] Use `json_each()` for staff aggregation in SQL
- [ ] No JavaScript loops over full ticket set
- [ ] Benchmark: <100ms for 10k tickets

---

### US-041: Add migration checkpointing
**Priority:** 27.5

**Files:** `packages/sqlite-adapter/src/migrations/dataMigration.ts`

**Criteria:**
- [ ] Create `_migration_progress` table
- [ ] Track `(table_name, last_migrated_id, count)` per table
- [ ] Resume from checkpoint on restart
- [ ] Clear checkpoints after successful full migration

---

### US-042: Type-safe conversion utilities
**Priority:** 0.5 (foundation - run first)

**Files:** `packages/sqlite-adapter/src/utils/typeConversions.ts` (NEW)

**Criteria:**
- [ ] `toISOString(value: unknown): string` - handles Date objects and strings
- [ ] `boolToSQLite(value: unknown): 0 | 1` - strict boolean conversion
- [ ] `safeParseJSON<T>(value: string, fallback: T): T` - already exists, verify
- [ ] Unit tests for all edge cases

---

## Revised Priority Order

| Priority | Story | Description |
|----------|-------|-------------|
| 0.5 | US-042 | Type conversion utilities (foundation) |
| 1 | US-001 | BaseSQLiteService generic class |
| 1.5 | US-036 | Fix client schema (ALL columns) |
| 1.6 | US-037 | Fix ticket schema (ALL columns) |
| 2 | US-002 | TableSchema registry |
| 3 | US-005 | AppointmentSQLiteService |
| 4 | US-006 | TransactionSQLiteService |
| 5 | US-007 | StaffSQLiteService |
| 6 | US-008 | ServiceSQLiteService |
| 7 | US-009 | TicketSQLiteService enhancements |
| 7.5 | US-040 | Optimize getStaffTicketCounts |
| 8 | **US-003** | Wire dataService (MOVED from 3) |
| 9 | US-004 | Migration v003 full schema |
| 10 | US-010 | Wire remaining core services |
| ... | ... | (rest unchanged) |
| 27 | US-027 | Dexie→SQLite migration |
| 27.5 | US-041 | Migration checkpointing |
| 28.5 | US-038 | Bi-directional sync |
| 34.5 | US-039 | Database health monitoring |

---

## Appendix: Table Count Summary

| Category | Tables | Services Needed |
|----------|--------|-----------------|
| Core | 6 | 6 (2 exist) |
| Infrastructure | 3 | 3 |
| Team | 3 | 3 |
| CRM | 8 | 8 |
| Catalog | 9 | 9 |
| Scheduling | 8 | 8 |
| Gift Cards | 5 | 5 |
| **Total** | **42** | **42** |

Estimated new code: ~4,000 lines of services + ~1,000 lines of migrations + ~500 lines of tests
