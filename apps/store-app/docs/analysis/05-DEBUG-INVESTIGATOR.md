# Debug Investigation Report

**Date:** January 8, 2026
**Scope:** `/apps/store-app/src`
**Investigation Type:** Proactive Bug Pattern Analysis

---

## Executive Summary

The codebase contains several potential bug patterns that could cause issues in production:

| Category | Severity | Count |
|----------|----------|-------|
| Race Conditions | High | 2 |
| Memory Leaks | Medium | 3 |
| Unhandled Errors | High | 4 |
| Stale Closures | Medium | 8 |
| Architecture Issues | Medium | 1 |

---

## Finding 1: Race Condition in Parallel Data Loading

**Severity:** HIGH
**File:** `src/hooks/useTicketsCompat.ts:63-82`

### Issue Description
The code correctly identifies the dependency (`loadStaff` needs `team.members`), but there's a potential race condition where `teamMemberIds.length` could briefly be non-zero during an update cycle.

### Vulnerable Code
```typescript
// Effect 1: Load tickets AND team members in parallel
useEffect(() => {
  Promise.all([
    dispatch(loadTickets(storeId)),
    dispatch(fetchTeamMembers(storeId)),  // No error handling!
  ]).then(() => {
    console.log('[useTicketsCompat] Parallel data loading complete');
  });
}, [dispatch, storeId]);

// Effect 2: Depends on teamMemberIds - potential stale closure
useEffect(() => {
  if (teamMemberIds.length > 0) {
    dispatch(loadStaff(storeId));
  }
}, [dispatch, storeId, teamMemberIds.length]);
```

### Risk
Missing error handling for `Promise.all()` - if `fetchTeamMembers` fails, the error is silently swallowed.

### Fix
```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(loadTickets(storeId)).unwrap(),
        dispatch(fetchTeamMembers(storeId)).unwrap(),
      ]);
      console.log('[useTicketsCompat] Parallel data loading complete');
    } catch (error) {
      console.error('[useTicketsCompat] Data loading failed:', error);
      // Handle error - show toast, retry, etc.
    }
  };

  loadData();
}, [dispatch, storeId]);
```

### Checklist
- [ ] Add try/catch to Promise.all
- [ ] Use `.unwrap()` for Redux thunks
- [ ] Add error handling UI
- [ ] Add retry logic if needed

---

## Finding 2: Memory Leak - Missing Event Listener Cleanup

**Severity:** MEDIUM
**File:** `src/services/syncService.ts:20-33`

### Issue Description
Event listeners are registered but never removed.

### Vulnerable Code
```typescript
private setupOnlineListener() {
  window.addEventListener('online', () => {  // Arrow function - cannot be removed!
    this.isOnline = true;
    this.notifyListeners({ isOnline: true, isSyncing: false });
    this.syncNow();
  });

  window.addEventListener('offline', () => {  // Arrow function - cannot be removed!
    this.isOnline = false;
    this.notifyListeners({ isOnline: false, isSyncing: false });
  });
}
// No cleanup method!
```

### Fix
```typescript
private onlineHandler = () => {
  this.isOnline = true;
  this.notifyListeners({ isOnline: true, isSyncing: false });
  this.syncNow();
};

private offlineHandler = () => {
  this.isOnline = false;
  this.notifyListeners({ isOnline: false, isSyncing: false });
};

private setupOnlineListener() {
  window.addEventListener('online', this.onlineHandler);
  window.addEventListener('offline', this.offlineHandler);
}

public destroy() {
  window.removeEventListener('online', this.onlineHandler);
  window.removeEventListener('offline', this.offlineHandler);
}
```

### Checklist
- [ ] Convert arrow functions to named methods
- [ ] Add `destroy()` method
- [ ] Call cleanup on app unmount

---

## Finding 3: Unhandled Promise Rejections in Async Thunks

**Severity:** HIGH
**File:** `src/store/slices/uiTicketsSlice.ts:448-471`

### Issue Description
Fallback operations (IndexedDB) are not wrapped in try/catch.

### Vulnerable Code
```typescript
export const assignTicket = createAsyncThunk(
  'uiTickets/assign',
  async ({ ticketId, staffId, staffName, staffColor }, { getState }) => {
    try {
      await dataService.tickets.update(ticketId, {...});
      console.log('✅ Ticket assigned in Supabase');
    } catch (error) {
      console.warn('⚠️ Supabase update failed, using IndexedDB:', error);
      // Falls through to IndexedDB - but what if IndexedDB also fails?
      await ticketsDB.update(ticketId, {...});  // No try-catch!
      await syncQueueDB.add({...});  // No try-catch!
    }

    return {...};  // Always returns success even if fallback partially failed
  }
);
```

### Fix
```typescript
export const assignTicket = createAsyncThunk(
  'uiTickets/assign',
  async ({ ticketId, staffId, staffName, staffColor }, { getState, rejectWithValue }) => {
    try {
      await dataService.tickets.update(ticketId, {...});
      console.log('✅ Ticket assigned in Supabase');
    } catch (supabaseError) {
      console.warn('⚠️ Supabase update failed, using IndexedDB:', supabaseError);

      try {
        await ticketsDB.update(ticketId, {...});
        await syncQueueDB.add({...});
      } catch (indexedDBError) {
        console.error('❌ IndexedDB fallback also failed:', indexedDBError);
        return rejectWithValue({
          message: 'Failed to assign ticket',
          originalError: supabaseError,
          fallbackError: indexedDBError
        });
      }
    }

    return {...};
  }
);
```

### Checklist
- [ ] Wrap IndexedDB operations in try/catch
- [ ] Use `rejectWithValue` for proper error propagation
- [ ] Handle rejected state in reducer

---

## Finding 4: Missing Transaction Rollback

**Severity:** HIGH
**File:** `src/store/slices/uiTicketsSlice.ts:761-879`

### Issue Description
Multi-step operations don't rollback on partial failure.

### Vulnerable Code
```typescript
export const checkInAppointment = createAsyncThunk(
  'uiTickets/checkInAppointment',
  async (appointmentId: string, { getState, dispatch }) => {
    // 1. Validation
    const validation = await validateTicketInput({...});
    if (!validation.valid) {
      throw new Error(validation.error || 'Validation failed');
    }

    // 2. Update appointment status - No rollback if step 3 fails!
    await dataService.appointments.updateStatus(appointmentServerId, 'checked-in');

    // 3. Create ticket - If this fails, appointment is already marked checked-in!
    const createdTicket = await dataService.tickets.create(ticketInput);
  }
);
```

### Fix
```typescript
export const checkInAppointment = createAsyncThunk(
  'uiTickets/checkInAppointment',
  async (appointmentId: string, { getState, dispatch, rejectWithValue }) => {
    const validation = await validateTicketInput({...});
    if (!validation.valid) {
      throw new Error(validation.error || 'Validation failed');
    }

    // Store original status for rollback
    const originalStatus = appointment.status;

    try {
      // Step 1: Update appointment
      await dataService.appointments.updateStatus(appointmentServerId, 'checked-in');

      // Step 2: Create ticket
      const createdTicket = await dataService.tickets.create(ticketInput);

      return { appointment, ticket: createdTicket };
    } catch (error) {
      // Rollback: Restore original appointment status
      try {
        await dataService.appointments.updateStatus(appointmentServerId, originalStatus);
        console.log('Rolled back appointment status');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }

      return rejectWithValue({
        message: 'Check-in failed',
        error
      });
    }
  }
);
```

### Checklist
- [ ] Store original state before operations
- [ ] Implement rollback on failure
- [ ] Log rollback attempts
- [ ] Handle rollback failures

---

## Finding 5: Stale Closure in useCallback with Empty Dependencies

**Severity:** MEDIUM
**Files:** Multiple hooks

### Issue Description
8 instances of `useCallback` with empty `[]` dependency arrays that might capture stale values.

### Example (useCatalog.ts:429)
```typescript
const reorderCategories = useCallback(async (orderedIds: string[]) => {
  // This might capture stale storeId or other values
}, []);  // Empty dependency array
```

### Fix
```typescript
const reorderCategories = useCallback(async (orderedIds: string[]) => {
  // Now has access to current storeId
}, [storeId, /* other dependencies */]);
```

### Checklist
- [ ] Audit all `useCallback` with `[]` dependencies
- [ ] Add ESLint rule: `react-hooks/exhaustive-deps`
- [ ] Review each case for necessary dependencies

---

## Finding 6: Duplicate Sync Services

**Severity:** MEDIUM
**Files:**
- `src/services/syncService.ts`
- `src/services/backgroundSyncService.ts`

### Issue Description
Two separate sync services with overlapping functionality:

| Feature | syncService | backgroundSyncService |
|---------|-------------|----------------------|
| Online/offline events | Yes | Yes |
| Sync interval | 120000ms | 120000ms |
| Sync queue | Yes | Yes |
| Supabase integration | Stub | Full |

### Risk
- Double-syncing
- Race conditions between services
- Confusion about which service is authoritative

### Fix
- [ ] Remove legacy `syncService.ts`
- [ ] Or properly deprecate with clear documentation
- [ ] Consolidate all sync logic in `backgroundSyncService.ts`

---

## Finding 7: Timeout Without Cleanup

**Severity:** LOW
**File:** `src/pages/BookPage.tsx:187-189`

### Vulnerable Code
```typescript
setTimeout(() => {
  setViewMode(view);
  setTimeout(() => setIsTransitioning(false), 150);
}, 0);
// No cleanup - will update unmounted component
```

### Fix
```typescript
const timeoutRef = useRef<NodeJS.Timeout>();

useEffect(() => {
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, []);

// In handler
timeoutRef.current = setTimeout(() => {
  if (!isMounted.current) return;
  setViewMode(view);
  timeoutRef.current = setTimeout(() => {
    if (!isMounted.current) return;
    setIsTransitioning(false);
  }, 150);
}, 0);
```

### Checklist
- [ ] Add timeout refs
- [ ] Clear timeouts on unmount
- [ ] Add mounted check before state updates

---

## Prevention Recommendations

### 1. Add ESLint Rules
```javascript
// .eslintrc.js
rules: {
  'react-hooks/exhaustive-deps': 'error',
  'no-floating-promises': 'error',
  '@typescript-eslint/no-floating-promises': 'error'
}
```

### 2. Implement Error Boundary Pattern
```typescript
// For critical operations
const withErrorBoundary = <T,>(
  operation: () => Promise<T>,
  rollback?: () => Promise<void>
): Promise<T> => {
  return operation().catch(async (error) => {
    if (rollback) {
      await rollback().catch(console.error);
    }
    throw error;
  });
};
```

### 3. Add Retry Logic with Backoff
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  backoff = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      await new Promise(r => setTimeout(r, backoff * Math.pow(2, i)));
    }
  }

  throw lastError!;
}
```

---

## Action Checklist

### High Priority
- [ ] Fix race condition in `useTicketsCompat.ts`
- [ ] Add error handling to all `Promise.all` calls
- [ ] Implement transaction rollback for check-in flow
- [ ] Wrap IndexedDB fallbacks in try/catch

### Medium Priority
- [ ] Add cleanup to `syncService.ts`
- [ ] Review and consolidate sync services
- [ ] Audit `useCallback` dependencies
- [ ] Add ESLint rules for hooks

### Low Priority
- [ ] Add timeout cleanup in components
- [ ] Add mounted checks for async operations
- [ ] Implement retry logic for critical operations
