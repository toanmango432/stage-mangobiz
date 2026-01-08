# Architecture Improvements - January 2026

> Comprehensive documentation of security, stability, and performance improvements made to the Mango POS Offline V2 codebase.

---

## Executive Summary

This document details the architectural improvements implemented to address critical security vulnerabilities, data integrity issues, and stability concerns identified in the comprehensive codebase review.

### Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Security Hardening | COMPLETED |
| Phase 2 | Data Layer Improvements | COMPLETED |
| Phase 3 | Stability & Memory Leak Fixes | COMPLETED |
| Phase 4 | Performance Optimizations | COMPLETED |
| Phase 5 | Documentation | COMPLETED |

---

## Phase 1: Security Hardening

### 1.1 Demo Credentials Removal

**Files Modified:**
- `apps/store-app/src/components/auth/StoreLoginScreen.tsx`
- `apps/store-app/src/components/auth/LoginScreen.tsx`

**Changes:**
- Removed hardcoded demo credentials display from login screens
- Added conditional help text that only shows in development mode
- Demo passwords are no longer visible to end users

**Before:**
```tsx
// Visible demo credentials in production
<p>Demo Store: demo / demo123</p>
```

**After:**
```tsx
{import.meta.env.DEV && (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
    <p className="text-sm text-gray-600">
      Enter your store credentials to access the POS system
    </p>
  </div>
)}
```

### 1.2 Hardcoded Password Check Removal

**File Modified:** `apps/store-app/src/services/supabase/authService.ts`

**Changes:**
- Removed `password === 'demo123'` bypass in password verification
- Added proper bcrypt hash detection with guidance for server-side verification
- Client-side password verification is now properly restricted

**Security Note:** Password verification should now be performed via Supabase Edge Functions for production use.

### 1.3 Web Crypto API Encryption

**File Modified:** `apps/store-app/src/services/secureStorage.ts`

**Changes:**
- Replaced Base64 obfuscation with proper AES-GCM 256-bit encryption
- Added PBKDF2 key derivation with 100,000 iterations
- Device fingerprint-based encryption key
- Backward compatible with legacy Base64 data

**Key Features:**
```typescript
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 100000;
```

**Security Properties:**
- Encryption at rest for sensitive data in IndexedDB
- Unique salt per device stored in localStorage
- Random IV generated for each encryption operation
- Graceful fallback for environments without Web Crypto API

### 1.4 Fallback URL Removal

**File Modified:** `apps/store-app/src/services/dataService.ts`

**Changes:**
- Removed hardcoded Supabase URL fallback
- Added proper error handling when `VITE_SUPABASE_URL` is not configured
- Throws explicit error in development mode to catch misconfigurations early

### 1.5 Mock Credentials Removal

**File Modified:** `apps/store-app/src/services/storeAuthApi.ts`

**Changes:**
- Emptied `DEMO_CREDENTIALS` object
- Added `TEST_MODE_ENABLED` flag controlled by `VITE_TEST_MODE` environment variable
- Demo credential fallback only works when explicitly enabled in test mode

---

## Phase 2: Data Layer Improvements

### 2.1 Legacy Sync Service Deprecation

**File Modified:** `apps/store-app/src/services/syncService.ts`

**Changes:**
- Added deprecation notice in JSDoc and console warning
- Added `destroy()` method for proper cleanup
- Documented migration path to `backgroundSyncService.ts`

**Migration Path:**
```typescript
// Instead of:
syncService.queueCreate('client', data);

// Use:
// Direct database operations + backgroundSyncService for sync status
```

### 2.2 Exponential Backoff Implementation

**File Modified:** `apps/store-app/src/services/backgroundSyncService.ts`

**Configuration:**
```typescript
const BASE_BACKOFF_MS = 1000;      // 1 second base
const MAX_BACKOFF_MS = 60000;      // 60 second cap
const JITTER_FACTOR = 0.3;         // 30% randomization
```

**Algorithm:**
```typescript
calculateBackoff(attempts: number): number {
  const exponentialDelay = BASE_BACKOFF_MS * Math.pow(2, attempts);
  const cappedDelay = Math.min(exponentialDelay, MAX_BACKOFF_MS);
  const jitter = cappedDelay * JITTER_FACTOR * (Math.random() * 2 - 1);
  return Math.floor(cappedDelay + jitter);
}
```

**Benefits:**
- Prevents thundering herd problem
- Reduces load on backend during outages
- Automatic recovery when service is restored

### 2.3 Conflict Resolution Service

**New File:** `apps/store-app/src/services/conflictResolutionService.ts`

**Strategies Implemented:**

| Strategy | Description | Use Case |
|----------|-------------|----------|
| `LAST_WRITE_WINS` | Server version always wins | Staff, Services |
| `LOCAL_WINS` | Local version always wins | Rarely used |
| `TIMESTAMP` | Newer timestamp wins | Appointments |
| `MERGE` | Merge non-conflicting fields | Clients |
| `MANUAL` | Flag for user review | Tickets, Transactions |

**Default Strategy by Entity:**
```typescript
const DEFAULT_STRATEGIES: Record<string, ConflictStrategy> = {
  appointment: 'TIMESTAMP',
  client: 'MERGE',
  ticket: 'MANUAL',
  transaction: 'MANUAL',
  staff: 'LAST_WRITE_WINS',
  service: 'LAST_WRITE_WINS',
};
```

**Features:**
- Automatic conflict detection
- Field-level conflict identification
- Critical field protection
- Manual resolution queue with listener system
- Conflict statistics tracking

---

## Phase 3: Stability Improvements

### 3.1 Hydration Consolidation

**File Modified:** `apps/store-app/src/providers/SupabaseSyncProvider.tsx`

**Changes:**
- Consolidated duplicate hydration logic into `initializeForStore()` function
- Created shared `cleanupServices()` function
- Prevents race conditions between multiple initialization paths

**Before:**
- Hydration could trigger from both `useEffect` and auth state change listener
- Potential for duplicate API calls and state inconsistencies

**After:**
```typescript
const initializeForStore = useCallback(async (storeId: string, source: string) => {
  console.log(`[${source}] Starting initialization for store ${storeId}`);
  // Consolidated initialization logic
}, [dependencies]);
```

### 3.2 Sync Mutex Implementation

**File Modified:** `apps/store-app/src/services/backgroundSyncService.ts`

**New Class:**
```typescript
class SyncMutex {
  private locked = false;
  private waitQueue: Array<() => void> = [];

  async acquire(): Promise<() => void>;
  private release(): void;
  isLocked(): boolean;
  getQueueLength(): number;
}
```

**Benefits:**
- Prevents overlapping sync operations
- Proper queue management for concurrent sync requests
- Eliminates race conditions in async sync code

### 3.3 Memory Leak Fixes

#### syncService.ts
- Added `destroy()` method
- Store event handler references for proper cleanup
- Clear listener sets on cleanup

#### useMqttSubscription.ts
- Added `unsubscribesRef` for tracking subscriptions
- Proper cleanup function with error handling
- Additional unmount cleanup effect
- Prevents stale closure handlers

**Before:**
```typescript
useEffect(() => {
  // Subscriptions without proper cleanup tracking
  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}, [deps]);
```

**After:**
```typescript
const unsubscribesRef = useRef<Array<() => void>>([]);

const cleanup = () => {
  unsubscribesRef.current.forEach((unsub) => {
    try {
      unsub();
    } catch (error) {
      console.error('[useMqttSubscriptions] Cleanup error:', error);
    }
  });
  unsubscribesRef.current = [];
};

useEffect(() => {
  cleanup(); // Always cleanup before new subscriptions
  // ... subscription logic
  return cleanup;
}, [deps]);

useEffect(() => {
  return () => cleanup(); // Additional unmount cleanup
}, []);
```

---

## Phase 4: Performance Optimizations

### 4.1 Memoized Selectors

**File Modified:** `apps/store-app/src/store/slices/clientsSlice.ts`

**New Memoized Selectors:**

| Selector | Description |
|----------|-------------|
| `selectBlockedClients` | Clients with `isBlocked: true` |
| `selectVipClients` | Clients with `isVip: true` |
| `selectClientsWithAlerts` | Clients with staff alerts |
| `selectActiveClients` | Non-blocked, active clients |
| `selectClientsByLoyaltyTier` | Grouped by loyalty tier |
| `selectClientCountsByStatus` | Count statistics |
| `selectFilteredClients` | Filter + sort applied |
| `selectPaginatedClients` | With pagination |
| `selectRecentClients` | Visited in last 30 days |
| `selectTopClientsBySpending` | Top 20 by total spent |
| `makeSelectClientById` | Factory selector for ID lookup |

**Usage Example:**
```typescript
import { useAppSelector } from '@/store/hooks';
import { selectFilteredClients, makeSelectClientById } from '@/store/slices/clientsSlice';

// In component
const filteredClients = useAppSelector(selectFilteredClients);

// For ID lookup (create once, use many times)
const selectClientById = useMemo(() => makeSelectClientById(), []);
const client = useAppSelector(state => selectClientById(state, clientId));
```

**Benefits:**
- Prevents unnecessary re-renders
- Caches computed results
- Only recomputes when inputs change

---

## Testing Recommendations

### Unit Tests to Add

1. **secureStorage.ts**
   - Test encryption/decryption roundtrip
   - Test backward compatibility with Base64 data
   - Test graceful fallback without Web Crypto

2. **backgroundSyncService.ts**
   - Test exponential backoff calculation
   - Test mutex lock/unlock behavior
   - Test sync queue processing

3. **conflictResolutionService.ts**
   - Test each resolution strategy
   - Test conflict detection
   - Test manual resolution queue

4. **clientsSlice.ts selectors**
   - Test memoization behavior
   - Test filter combinations
   - Test sort ordering

### Integration Tests to Add

1. **Sync Flow**
   - Offline → Online transition
   - Conflict detection and resolution
   - Backoff behavior under failure

2. **Authentication**
   - Login flow without demo credentials
   - Proper error handling

---

## Remaining Manual Tasks

### Environment Configuration

1. **Remove .env from git history**
   ```bash
   # Use BFG Repo-Cleaner or git filter-branch
   bfg --delete-files .env
   ```

2. **Rotate Supabase Keys**
   - Generate new anon key in Supabase Dashboard
   - Update `VITE_SUPABASE_ANON_KEY` in deployment configs

3. **Rotate API Keys**
   - Anthropic API key
   - Any other exposed credentials

### Pre-Production Checklist

- [ ] All environment variables configured in deployment platform
- [ ] Supabase RLS policies reviewed
- [ ] API keys rotated
- [ ] .env files removed from git history
- [ ] VITE_TEST_MODE set to false in production

---

## File Change Summary

| File | Changes |
|------|---------|
| `StoreLoginScreen.tsx` | Removed demo credentials |
| `LoginScreen.tsx` | Removed demo credentials (2 locations) |
| `authService.ts` | Removed password bypass |
| `dataService.ts` | Removed fallback URL |
| `storeAuthApi.ts` | Empty demo credentials, test mode flag |
| `secureStorage.ts` | Complete rewrite with Web Crypto |
| `syncService.ts` | Deprecation notice, destroy method |
| `backgroundSyncService.ts` | Backoff, mutex |
| `SupabaseSyncProvider.tsx` | Consolidated hydration |
| `useMqttSubscription.ts` | Memory leak fixes |
| `clientsSlice.ts` | Memoized selectors |
| `conflictResolutionService.ts` | **New file** |

---

## Architecture Diagram Updates

### Sync Architecture (Updated)

```
┌─────────────────────────────────────────────────────────────┐
│                    Redux Store                               │
│                         │                                    │
│                         ▼                                    │
│               ┌─────────────────┐                           │
│               │  dataService    │                           │
│               └────────┬────────┘                           │
│                        │                                    │
│         ┌──────────────┼──────────────┐                    │
│         ▼              ▼              ▼                    │
│   ┌──────────┐  ┌────────────┐  ┌───────────┐            │
│   │ IndexedDB │  │ Sync Queue │  │ Supabase  │            │
│   └──────────┘  └──────┬─────┘  └───────────┘            │
│                        │                                    │
│                        ▼                                    │
│         ┌──────────────────────────────┐                   │
│         │   backgroundSyncService      │                   │
│         │   ┌────────────────────────┐ │                   │
│         │   │ SyncMutex              │ │  ← Prevents race │
│         │   │ ExponentialBackoff     │ │  ← Smart retries │
│         │   │ CircuitBreaker         │ │  ← Fault tolerant│
│         │   └────────────────────────┘ │                   │
│         └──────────────┬───────────────┘                   │
│                        │                                    │
│                        ▼                                    │
│         ┌──────────────────────────────┐                   │
│         │  conflictResolutionService   │                   │
│         │  ┌────────────────────────┐  │                   │
│         │  │ Strategy: TIMESTAMP   │  │                   │
│         │  │ Strategy: MERGE       │  │                   │
│         │  │ Strategy: MANUAL      │  │                   │
│         │  └────────────────────────┘  │                   │
│         └──────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

*Last Updated: January 2026*
*Documented by: Architecture Review Team*
