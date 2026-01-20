# Persistent Codebase Patterns

> Patterns accumulated across all Ralph runs. This file is never deleted - patterns persist across different PRDs/features.

---

## Monorepo Structure

- Main apps: `apps/store-app`, `apps/mango-pad`, `apps/checkin-app`, `apps/online-store`
- Shared packages: `packages/`
- Use `npm run typecheck` from app directories (each app has its own tsconfig)

## MQTT Communication

- Store App runs local Mosquitto broker
- Cloud broker at HiveMQ/EMQX for fallback
- Topic pattern: `salon/{salonId}/station/{stationId}/{resource}`
- Use QoS 1 for important messages, QoS 0 for heartbeats

## Redux & Data Flow

- All state management via Redux Toolkit
- Use `dataService` for data operations (routes to Supabase or IndexedDB)
- Never call Supabase or IndexedDB directly from components

## Styling

- Use design tokens from `src/design-system/`
- Tailwind CSS with Radix UI components
- Module-specific tokens: `src/design-system/modules/`

---

<!-- Ralph appends learnings below -->

## From ralph/frontdesk-fixes (2026-01-14)

### Staff ID Matching Pattern (CRITICAL)
UITicket can match staff via THREE different fields - check all:
```typescript
const staffTicket = serviceTickets.find(t =>
  String(t.techId) === String(staff.id) ||
  String(t.staffId) === String(staff.id) ||
  String(t.assignedTo?.id) === String(staff.id)
);
```

### Module Splitting Strategy
1. **Start with hooks before components** - less risky, easier to verify
2. **Create module infrastructure first** without modifying main file
3. **Phase approach** for large files (1000+ lines):
   - Phase 1: Extract types, constants, barrel exports
   - Phase 2: Extract hooks (useStaffTicketInfo, useStaffAppointments)
   - Phase 3: Extract utility functions (gridHelpers, staffHelpers)
   - Phase 4: Extract sub-components (Header, StatusPills, etc.)
4. **Target: <300 lines** but 40-50% reduction is acceptable for complex components

### Dual Settings Architecture
StaffSidebar has TWO settings sources that must stay in sync:
- `teamSettings` - JSON object in localStorage key `teamSettings`
- Redux `viewState` - Individual localStorage keys (`staffSidebarWidth`, etc.)

Pattern: On page load, sync `teamSettings.viewWidth` → Redux:
```typescript
useEffect(() => {
  if (teamSettings?.viewWidth) {
    dispatch(setStaffSidebarWidthSettings(teamSettings.viewWidth));
  }
}, []);
```

### useModalStack Hook Pattern
For components with multiple modals, consolidate with a custom hook:
```typescript
const {
  showTeamSettings, setShowTeamSettings,
  showStaffNote, openStaffNote, closeStaffNote,
  selectedStaffForNote,
} = useModalStack();
```
Key: Provide BOTH setter-style API (`setShowX`) AND typed methods (`openX/closeX`) for compatibility.

### Type-Safe Custom Events
Extend global WindowEventMap for type-safe custom events:
```typescript
// types.ts
export interface StaffSidebarCustomEvents {
  'open-turn-tracker': Event;
}

declare global {
  interface WindowEventMap extends StaffSidebarCustomEvents {}
}

export function dispatchStaffSidebarEvent<K extends keyof StaffSidebarCustomEvents>(
  eventName: K
): void {
  window.dispatchEvent(new Event(eventName));
}
```

### Mobile Responsiveness Patterns
- MobileTeamSection `busyStatus` mode needs ALL status groups (Ready, Busy, **Off**)
- Staff with "off" status won't show if only Ready/Busy sections rendered
- Use `Sheet side="bottom"` for mobile action sheets (better UX than dropdown)

### Testing Redux Hooks
```typescript
// Use mock reducers returning fixed state
const store = configureStore({
  reducer: {
    uiTickets: () => mockTicketsState,
    appointments: () => mockAppointmentsState,
  },
});
const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>;
const { result } = renderHook(() => useStaffTicketInfo(), { wrapper });
```

### Dead Code Detection Signals
Code silenced with `void` statements is a clear signal for cleanup:
```typescript
// BAD - these are dead code waiting to be deleted
void _saveOriginalWidth;
void [_WaitListItem, _MinimizedWaitListItem];
```
Search for `void _` and `void [` patterns to find cleanup opportunities.

### PRD vs Code Reality
- PRD notes can become outdated when work is done across multiple iterations
- **Always verify current implementation before assuming work is needed**
- Check git history when PRD line numbers don't match current file

## From ralph/sqlite-complete (2026-01-17)

### BaseSQLiteService Type Constraint
Entity interfaces used with BaseSQLiteService must extend `Record<string, unknown>`:
```typescript
// GOOD - satisfies BaseSQLiteService<T> constraint
export interface Appointment extends Record<string, unknown> {
  id: string;
  storeId: string;
  // ... other fields
}

// BAD - will cause TS2344 error
export interface Appointment {
  id: string;
  storeId: string;
}
```

### SQLite Type Conversion Pattern
Use conversion utilities from `@mango/sqlite-adapter` consistently:
```typescript
import { toISOString, boolToSQLite, sqliteToBool, safeParseJSON, toJSONString } from '@mango/sqlite-adapter';

// Date → SQLite TEXT
const isoDate = toISOString(new Date()); // "2026-01-17T00:00:00.000Z"

// Boolean → SQLite INTEGER (0/1)
const sqliteInt = boolToSQLite(true); // 1

// JSON object → SQLite TEXT
const jsonText = toJSONString({ services: [] }); // '{"services":[]}'
```

### Schema Registry Pattern
Define table schemas in registry for type-safe lookup:
```typescript
// Use columnMapping shorthand or full definition
const schema: TableSchema = {
  tableName: 'appointments',
  primaryKey: 'id',
  columns: {
    id: 'id',  // shorthand
    isActive: { column: 'is_active', type: 'boolean' },  // full definition
    services: { column: 'services', type: 'json', defaultValue: [] },
  }
};
```

### SQL Aggregation with COALESCE
Use COALESCE to handle null values in SUM/COUNT aggregations:
```sql
-- Returns 0 instead of null when no rows match
SELECT
  COALESCE(SUM(amount), 0) as total_amount,
  COUNT(*) as transaction_count,
  COALESCE(SUM(refunded_amount), 0) as refunded_amount
FROM transactions
WHERE store_id = ?
```
This pattern ensures numeric results even with empty result sets.

### JSON Array Search with json_each()
Use `json_each()` to search within JSON array columns in SQLite:
```sql
-- Find staff members with a specific skill
SELECT s.*
FROM staff s, json_each(s.skills) AS skill
WHERE s.store_id = ?
  AND s.is_active = 1
  AND skill.value = ?
ORDER BY s.display_name ASC
```
This pattern enables efficient searching within JSON arrays without loading full records into JS.

### JSON Array Aggregation with json_each() + GROUP BY
Use `json_each()` with `GROUP BY` for in-database aggregation over JSON arrays:
```sql
-- Count services per staff from tickets (services is a JSON array)
SELECT
  json_extract(service.value, '$.staffId') as staff_id,
  COUNT(*) as service_count
FROM tickets, json_each(tickets.services) as service
WHERE tickets.store_id = ?
  AND tickets.created_at >= ?
  AND json_extract(service.value, '$.staffId') IS NOT NULL
GROUP BY staff_id
```
This pattern replaces memory-intensive JS loops with SQL aggregation. Expected: <100ms for 10k records vs 500ms+ with JS.

## From ralph/foundation-tech-debt (2026-01-19)

### Console Removal in Vite Production Builds
Use esbuild's native `pure` option instead of vite-plugin-remove-console:
```typescript
// vite.config.ts
export default defineConfig(({ mode }) => ({
  esbuild: {
    pure: mode === 'production' ? ['console.log', 'console.debug'] : [],
  },
}));
```
**Why:** vite-plugin-remove-console uses regex-based removal which fails on JSX like `onClick={() => console.log(...)}`. esbuild `pure` is built-in, faster, and handles standalone console calls correctly while preserving console.warn/error.

## From ralph/auth-migration-supabase (2026-01-20)

### PostgreSQL Migration Patterns
Idempotent migrations for Supabase:
```sql
-- Column addition (idempotent)
ALTER TABLE members ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- Policy creation (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'policy_name'
  ) THEN
    CREATE POLICY "policy_name" ON table_name
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Partial index for sparse columns
CREATE INDEX IF NOT EXISTS idx_table_column
  ON table(column) WHERE column IS NOT NULL;
```
**Why:** Prevents migration failures on re-runs and supports incremental deployment.

### Promise Timeout Wrapper Pattern
Use Promise.race for clean timeout implementation without external dependencies:
```typescript
function createTimeoutPromise<T>(ms: number, message: string): Promise<T> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([promise, createTimeoutPromise<T>(ms, message)]);
}

// Usage:
const result = await withTimeout(
  supabase.auth.signInWithPassword({ email, password }),
  AUTH_TIMEOUT_MS,
  'Authentication timeout'
);
```
**Why:** Prevents UI hangs during slow network conditions. Separating createTimeoutPromise allows reuse for different timeout scenarios (auth, bcrypt, etc.).
