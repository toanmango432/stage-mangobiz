# Test Coverage Gap Analysis

**Date:** January 8, 2026
**Scope:** `/apps/store-app/src`
**Current Coverage:** ~3.5% (Target: 70%)

---

## Executive Summary

| Category | Total Files | With Tests | Coverage |
|----------|-------------|------------|----------|
| Services | 26 | 7 | ~27% |
| Utils | 28 | 10 | ~36% |
| Store Slices | 20 | 5 | ~25% |
| Hooks | 37 | 4 | ~11% |
| DB Operations | 13 | 1 | ~8% |
| Supabase Adapters | 12 | 7 | ~58% |
| API | 5 | 0 | 0% |
| **Total** | ~141 | ~34 | ~24% |

---

## Critical Priority - Services (Week 1-2)

### Must Have Tests

| File | Risk | Test Type |
|------|------|-----------|
| `services/syncService.ts` | HIGH | Unit + Integration |
| `services/licenseManager.ts` | HIGH | Unit |
| `services/appointmentService.ts` | HIGH | Unit + Integration |
| `services/backgroundSyncService.ts` | HIGH | Unit + Integration |
| `services/storeAuthManager.ts` | HIGH | Unit |
| `services/conflictResolutionService.ts` | HIGH | Unit |

### Example Test: syncService.ts

```typescript
// src/services/__tests__/syncService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncService } from '../syncService';

describe('SyncService', () => {
  let syncService: SyncService;

  beforeEach(() => {
    syncService = new SyncService();
  });

  afterEach(() => {
    syncService.destroy?.();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should start with online status matching navigator.onLine', () => {
      expect(syncService.isOnline).toBe(navigator.onLine);
    });

    it('should set up online/offline event listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      new SyncService();

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('syncNow', () => {
    it('should not sync when offline', async () => {
      syncService.isOnline = false;
      const result = await syncService.syncNow();

      expect(result).toEqual({ success: false, reason: 'offline' });
    });

    it('should process sync queue when online', async () => {
      syncService.isOnline = true;
      const processSpy = vi.spyOn(syncService, 'processSyncQueue');

      await syncService.syncNow();

      expect(processSpy).toHaveBeenCalled();
    });

    it('should handle sync errors gracefully', async () => {
      syncService.isOnline = true;
      vi.spyOn(syncService, 'processSyncQueue').mockRejectedValue(new Error('Network error'));

      const result = await syncService.syncNow();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('listeners', () => {
    it('should notify listeners of sync state changes', () => {
      const listener = vi.fn();
      syncService.addListener(listener);

      syncService.notifyListeners({ isOnline: true, isSyncing: true });

      expect(listener).toHaveBeenCalledWith({ isOnline: true, isSyncing: true });
    });

    it('should remove listeners correctly', () => {
      const listener = vi.fn();
      syncService.addListener(listener);
      syncService.removeListener(listener);

      syncService.notifyListeners({ isOnline: true, isSyncing: false });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
```

---

## High Priority - Utility Functions (Week 2-3)

### Must Have Tests

| File | Lines | Risk | Focus Areas |
|------|-------|------|-------------|
| `utils/dateUtils.ts` | 568 | HIGH | Timezone handling, DST transitions |
| `utils/payrollCalculation.ts` | 459 | HIGH | Commission calculations, overtime |
| `utils/overtimeCalculation.ts` | 200+ | HIGH | Overtime pay rules |
| `utils/availabilityCalculator.ts` | 300+ | MEDIUM | Staff scheduling |

### Example Test: payrollCalculation.ts

```typescript
// src/utils/__tests__/payrollCalculation.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateCommission,
  calculateOvertimePay,
  calculateTotalPay,
  calculateTipShare
} from '../payrollCalculation';

describe('payrollCalculation', () => {
  describe('calculateCommission', () => {
    it('should calculate flat rate commission correctly', () => {
      const result = calculateCommission({
        salesAmount: 1000,
        commissionType: 'flat',
        commissionRate: 10
      });

      expect(result).toBe(100);
    });

    it('should calculate percentage commission correctly', () => {
      const result = calculateCommission({
        salesAmount: 1000,
        commissionType: 'percentage',
        commissionRate: 15
      });

      expect(result).toBe(150);
    });

    it('should handle tiered commission rates', () => {
      const result = calculateCommission({
        salesAmount: 5000,
        commissionType: 'tiered',
        tiers: [
          { threshold: 1000, rate: 5 },
          { threshold: 3000, rate: 10 },
          { threshold: Infinity, rate: 15 }
        ]
      });

      // 1000 * 5% + 2000 * 10% + 2000 * 15% = 50 + 200 + 300 = 550
      expect(result).toBe(550);
    });

    it('should return 0 for zero sales', () => {
      const result = calculateCommission({
        salesAmount: 0,
        commissionType: 'percentage',
        commissionRate: 15
      });

      expect(result).toBe(0);
    });
  });

  describe('calculateOvertimePay', () => {
    it('should not apply overtime for hours under 40', () => {
      const result = calculateOvertimePay({
        regularHours: 35,
        hourlyRate: 20
      });

      expect(result.overtimeHours).toBe(0);
      expect(result.overtimePay).toBe(0);
    });

    it('should calculate 1.5x overtime for hours over 40', () => {
      const result = calculateOvertimePay({
        regularHours: 45,
        hourlyRate: 20,
        overtimeMultiplier: 1.5
      });

      expect(result.overtimeHours).toBe(5);
      expect(result.overtimePay).toBe(150); // 5 * 20 * 1.5
    });

    it('should handle custom overtime thresholds', () => {
      const result = calculateOvertimePay({
        regularHours: 50,
        hourlyRate: 20,
        overtimeThreshold: 44,
        overtimeMultiplier: 2
      });

      expect(result.overtimeHours).toBe(6);
      expect(result.overtimePay).toBe(240); // 6 * 20 * 2
    });
  });

  describe('calculateTipShare', () => {
    it('should distribute tips equally among staff', () => {
      const result = calculateTipShare({
        totalTips: 300,
        staffCount: 3,
        distribution: 'equal'
      });

      expect(result.perPerson).toBe(100);
    });

    it('should distribute tips by hours worked', () => {
      const result = calculateTipShare({
        totalTips: 300,
        staffHours: [
          { staffId: '1', hours: 8 },
          { staffId: '2', hours: 4 },
          { staffId: '3', hours: 4 }
        ],
        distribution: 'hourly'
      });

      // Total hours: 16, tip per hour: 18.75
      expect(result.shares['1']).toBe(150); // 8 * 18.75
      expect(result.shares['2']).toBe(75);  // 4 * 18.75
      expect(result.shares['3']).toBe(75);  // 4 * 18.75
    });
  });
});
```

---

## High Priority - Redux Slices (Week 3-4)

### Must Have Tests

| File | Risk | Focus Areas |
|------|------|-------------|
| `store/slices/checkoutSlice.ts` | HIGH | Payment flow, state transitions |
| `store/slices/ticketsSlice.ts` | HIGH | Ticket CRUD, status changes |
| `store/slices/appointmentsSlice.ts` | HIGH | Booking operations |

### Example Test: checkoutSlice.ts

```typescript
// src/store/slices/__tests__/checkoutSlice.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import checkoutReducer, {
  startCheckout,
  addPayment,
  completeCheckout,
  cancelCheckout,
  applyDiscount,
  selectCheckoutTotal,
  selectRemainingBalance
} from '../checkoutSlice';

describe('checkoutSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        checkout: checkoutReducer
      }
    });
  });

  describe('startCheckout', () => {
    it('should initialize checkout with ticket data', () => {
      const ticket = {
        id: '123',
        services: [
          { id: 's1', price: 50 },
          { id: 's2', price: 30 }
        ],
        total: 80
      };

      store.dispatch(startCheckout(ticket));

      const state = store.getState().checkout;
      expect(state.ticketId).toBe('123');
      expect(state.total).toBe(80);
      expect(state.status).toBe('in_progress');
    });
  });

  describe('addPayment', () => {
    beforeEach(() => {
      store.dispatch(startCheckout({ id: '123', total: 100 }));
    });

    it('should add cash payment', () => {
      store.dispatch(addPayment({
        method: 'cash',
        amount: 50
      }));

      const state = store.getState().checkout;
      expect(state.payments).toHaveLength(1);
      expect(state.payments[0].method).toBe('cash');
      expect(state.payments[0].amount).toBe(50);
    });

    it('should calculate remaining balance correctly', () => {
      store.dispatch(addPayment({ method: 'cash', amount: 60 }));

      const remaining = selectRemainingBalance(store.getState());
      expect(remaining).toBe(40);
    });

    it('should handle split payments', () => {
      store.dispatch(addPayment({ method: 'cash', amount: 50 }));
      store.dispatch(addPayment({ method: 'card', amount: 50 }));

      const remaining = selectRemainingBalance(store.getState());
      expect(remaining).toBe(0);
    });
  });

  describe('applyDiscount', () => {
    beforeEach(() => {
      store.dispatch(startCheckout({ id: '123', total: 100 }));
    });

    it('should apply percentage discount', () => {
      store.dispatch(applyDiscount({
        type: 'percentage',
        value: 20
      }));

      const total = selectCheckoutTotal(store.getState());
      expect(total).toBe(80);
    });

    it('should apply fixed amount discount', () => {
      store.dispatch(applyDiscount({
        type: 'fixed',
        value: 25
      }));

      const total = selectCheckoutTotal(store.getState());
      expect(total).toBe(75);
    });

    it('should not allow discount greater than total', () => {
      store.dispatch(applyDiscount({
        type: 'fixed',
        value: 150
      }));

      const total = selectCheckoutTotal(store.getState());
      expect(total).toBe(0); // Minimum is 0
    });
  });

  describe('completeCheckout', () => {
    it('should mark checkout as complete when fully paid', async () => {
      store.dispatch(startCheckout({ id: '123', total: 100 }));
      store.dispatch(addPayment({ method: 'cash', amount: 100 }));

      await store.dispatch(completeCheckout());

      const state = store.getState().checkout;
      expect(state.status).toBe('completed');
    });

    it('should reject completion when balance remaining', async () => {
      store.dispatch(startCheckout({ id: '123', total: 100 }));
      store.dispatch(addPayment({ method: 'cash', amount: 50 }));

      const result = await store.dispatch(completeCheckout());

      expect(result.type).toContain('rejected');
    });
  });
});
```

---

## Medium Priority - Hooks (Week 4-5)

### Must Have Tests

| File | Risk | Focus Areas |
|------|------|-------------|
| `hooks/useLicenseGuard.ts` | HIGH | License validation |
| `hooks/usePinProtection.ts` | HIGH | Security |
| `hooks/useAppointmentCalendar.ts` | MEDIUM | Calendar state |

### Example Test: useLicenseGuard.ts

```typescript
// src/hooks/__tests__/useLicenseGuard.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLicenseGuard } from '../useLicenseGuard';
import * as licenseManager from '@/services/licenseManager';

vi.mock('@/services/licenseManager');

describe('useLicenseGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return valid status for active license', async () => {
    vi.mocked(licenseManager.validateLicense).mockResolvedValue({
      isValid: true,
      expiresAt: new Date(Date.now() + 86400000),
      features: ['pos', 'booking']
    });

    const { result } = renderHook(() => useLicenseGuard());

    await waitFor(() => {
      expect(result.current.isValid).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return invalid status for expired license', async () => {
    vi.mocked(licenseManager.validateLicense).mockResolvedValue({
      isValid: false,
      reason: 'expired'
    });

    const { result } = renderHook(() => useLicenseGuard());

    await waitFor(() => {
      expect(result.current.isValid).toBe(false);
    });

    expect(result.current.reason).toBe('expired');
  });

  it('should handle validation errors', async () => {
    vi.mocked(licenseManager.validateLicense).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useLicenseGuard());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });

  it('should check specific features', async () => {
    vi.mocked(licenseManager.validateLicense).mockResolvedValue({
      isValid: true,
      features: ['pos', 'booking']
    });

    const { result } = renderHook(() => useLicenseGuard());

    await waitFor(() => {
      expect(result.current.hasFeature('pos')).toBe(true);
      expect(result.current.hasFeature('reporting')).toBe(false);
    });
  });
});
```

---

## Mock Setup

### Install Dependencies

```bash
pnpm add -D @testing-library/react-hooks msw fake-indexeddb @faker-js/faker --filter @mango/store-app
```

### Supabase Mock

```typescript
// src/__mocks__/supabase.ts
import { vi } from 'vitest';

export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis()
  })),
  auth: {
    getSession: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn()
  }
};

vi.mock('@/services/supabase/client', () => ({
  supabase: mockSupabaseClient
}));
```

### IndexedDB Mock

```typescript
// src/__mocks__/indexedDB.ts
import 'fake-indexeddb/auto';
import Dexie from 'dexie';

// Reset database before each test
beforeEach(async () => {
  await Dexie.delete('MangoStoreDB');
});
```

### Redux Store Mock

```typescript
// src/__tests__/testUtils.tsx
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: rootReducer,
      preloadedState
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
```

---

## Implementation Schedule

### Week 1-2: Critical Services
- [ ] syncService.ts tests
- [ ] licenseManager.ts tests
- [ ] appointmentService.ts tests
- [ ] backgroundSyncService.ts tests

### Week 3-4: Utils & Slices
- [ ] payrollCalculation.ts tests
- [ ] dateUtils.ts tests
- [ ] checkoutSlice.ts tests
- [ ] ticketsSlice.ts tests

### Week 5-6: Hooks & Adapters
- [ ] useLicenseGuard.ts tests
- [ ] usePinProtection.ts tests
- [ ] appointmentAdapter.ts tests
- [ ] ticketAdapter.ts tests

### Week 7-8: Components & E2E
- [ ] Checkout flow tests
- [ ] Booking flow tests
- [ ] Critical component tests

---

## Coverage Goals

| Milestone | Target | Timeline |
|-----------|--------|----------|
| Services | 80% | Week 2 |
| Utils | 80% | Week 4 |
| Slices | 70% | Week 4 |
| Hooks | 60% | Week 6 |
| Overall | 70% | Week 8 |

---

## Running Tests

```bash
# Run all tests
pnpm test --filter @mango/store-app

# Run with coverage
pnpm test --filter @mango/store-app -- --coverage

# Run specific file
pnpm test --filter @mango/store-app -- src/services/__tests__/syncService.test.ts

# Watch mode
pnpm test --filter @mango/store-app -- --watch
```
