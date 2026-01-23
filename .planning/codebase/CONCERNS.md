# Technical Concerns

## High Priority

### 1. Large Component Files

**Location:** `apps/store-app/src/components/Book/`

| File | Size | Issue |
|------|------|-------|
| `DaySchedule.tsx` | 43K | Far exceeds 300-line target |
| `NewAppointmentModal.v2.tsx` | 32K | Complex modal logic |
| `GroupBookingModal.tsx` | 30K | Needs decomposition |
| `QuickClientModal.tsx` | 25K | Mixed responsibilities |
| `AppointmentDetailsModal.tsx` | 23K | Too many features |
| `AppointmentClientPanel.tsx` | 21K | Needs extraction |

**Risk:** Hard to maintain, test, and debug
**Recommendation:** Extract sub-components, custom hooks, and utilities

### 2. SQLite Migration In Progress

**PRDs:**
- `tasks/prd-sqlite-migration.md`
- `tasks/prd-sqlite-complete-migration.md`

**Status:** Partial implementation with multiple adapters
- `@mango/sqlite-adapter` package exists
- Optional peer dependencies: better-sqlite3, @capacitor-community/sqlite, wa-sqlite

**Risk:** Data inconsistency during transition period
**Recommendation:** Complete migration to unified adapter

### 3. Type Export Complexity

**Location:** `packages/types/src/index.ts`

**Issues:**
- Multiple type aliases to avoid conflicts (e.g., `ServiceStatus`, `CatalogServiceStatus`, `ServiceArchiveStatus`)
- Selective exports with comments explaining duplicates
- Complex re-export patterns

```typescript
// Example of complexity
export type { ServiceStatus as ServiceArchiveStatus } from './service'
export type { PaymentMethod as PayrollPaymentMethod } from './payroll'
```

**Risk:** Confusing for developers, potential for wrong type usage
**Recommendation:** Namespace types or use more specific names

## Medium Priority

### 4. Dual-Broker MQTT Complexity

**Architecture:** Local Mosquitto + Cloud fallback

**Concerns:**
- Message deduplication logic required
- Connection state management
- Failover handling

**Risk:** Race conditions, duplicate messages
**Recommendation:** Add comprehensive MQTT integration tests

### 5. Offline Sync Reliability

**Components:**
- IndexedDB (Dexie.js) for offline storage
- Supabase for cloud sync
- Conflict resolution needed

**Risk:** Data loss or conflicts during extended offline periods
**Recommendation:** Implement robust conflict resolution strategy

### 6. Test Coverage Gaps

**Statistics:**
- 828 test files exist
- 14,237 lines in Book module alone

**Concerns:**
- Large components may have low coverage
- E2E tests may not cover edge cases

**Recommendation:** Run coverage report, prioritize critical paths

### 7. Electron/Capacitor Platform Fragmentation

**Platforms:**
- Web (Vite)
- Desktop (Electron 35.1.5)
- Mobile (Capacitor 6.2.0)

**Concerns:**
- Platform-specific code paths
- Different SQLite implementations
- Testing across all platforms

**Risk:** Platform-specific bugs, inconsistent behavior
**Recommendation:** Unify platform abstraction layer

## Low Priority (Tech Debt)

### 8. Mixed Vitest Versions

| App | Vitest Version |
|-----|---------------|
| store-app | 4.0.16 |
| check-in | 1.3.1 |
| mango-pad | 4.0.16 |

**Risk:** Inconsistent test behavior
**Recommendation:** Align versions across workspace

### 9. Legacy File Patterns

**Observed:**
- `.v2.tsx` suffix files (e.g., `NewAppointmentModal.v2.tsx`)
- Suggests incomplete refactoring

**Recommendation:** Complete migration, remove legacy files

### 10. Documentation Spread

**Locations:**
- `CLAUDE.md` (28K lines)
- `docs/` directory (19 files)
- `tasks/` directory (many PRDs)
- `.cursor/plans/`

**Risk:** Outdated or conflicting documentation
**Recommendation:** Consolidate and maintain single source of truth

## Security Considerations

### 1. Environment Variables

**File:** `.env`

**Exposed Keys:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ANTHROPIC_API_KEY`

**Risk:** Anon key is public (by design), but API keys need protection
**Recommendation:** Review key exposure, ensure RLS is properly configured

### 2. WebAuthn Implementation

**File:** `apps/store-app/src/services/webAuthnService.ts`

**Status:** Custom implementation for biometric auth

**Risk:** Authentication bypass if not implemented correctly
**Recommendation:** Security audit of WebAuthn flow

### 3. Payment Processing

**Integration:** Fiserv CommerceHub TTP

**Status:** Native plugin implementation

**Risk:** Payment data handling
**Recommendation:** PCI compliance review

## Performance Concerns

### 1. Large Redux State

**Slices observed:**
- appointments, clients, staff, services
- tickets, transactions
- Multiple UI state slices

**Risk:** Re-render performance, memory usage
**Recommendation:** Implement selector memoization, state normalization

### 2. Calendar Rendering

**File:** `DaySchedule.tsx` (43K)

**Issue:** Complex rendering with drag-and-drop

**Risk:** Janky scrolling, slow updates
**Recommendation:** Virtualization, React.memo optimization

### 3. Bundle Size

**Build:** Multiple apps, shared packages

**Risk:** Large initial bundle affecting load time
**Recommendation:** Code splitting, lazy loading analysis

## Fragile Areas

### 1. Appointment Conflict Detection

**Risk:** Overlapping appointments if logic fails

### 2. Offline Queue Processing

**Risk:** Data loss if queue not processed correctly

### 3. Multi-Device Sync

**Risk:** Race conditions with concurrent edits

### 4. Payment State Machine

**Risk:** Stuck transactions, refund failures

## Recommended Actions

1. **Immediate:** Decompose large component files
2. **Short-term:** Complete SQLite migration
3. **Medium-term:** Comprehensive MQTT/sync testing
4. **Ongoing:** Monitor and improve test coverage
