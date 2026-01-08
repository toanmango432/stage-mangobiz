# Performance Analysis Report

**Date:** January 8, 2026
**Scope:** `/apps/store-app/src`
**Overall Rating:** B (Good foundation, optimization needed)

---

## Executive Summary

The Mango POS Store App shows mature performance patterns in some areas but has significant optimization opportunities:

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Bundle Size | 4.6 MB | 2 MB | Over by 2.3x |
| Console Logs | 953 | 0 | Needs removal |
| Large Components | 15+ | 0 | Needs splitting |
| Memoization | 903 usages | Good | Well adopted |

---

## Critical Bottlenecks

| Location | Issue | Impact | Priority |
|----------|-------|--------|----------|
| `TicketPanel.tsx` (2879 lines) | Monolithic component, 39+ console logs | High re-render scope | Critical |
| `NewAppointmentModal.v2.tsx` (2044 lines) | Large modal with complex form logic | Slow initial render | High |
| `FrontDesk.tsx` (932 lines) | Multiple useSelector without memoization | Cascading re-renders | High |
| `storeAuthManager.ts` | 40+ console logs | Production noise | Medium |

---

## Bundle Analysis

### Current Configuration
- **Total Size:** 4.6 MB raw / ~1.06 MB gzipped
- **Target:** <2 MB raw
- **Chunk Size Warning:** 600KB (elevated from default)

### Largest Chunks

| File | Size | Action |
|------|------|--------|
| index-B7azOeF_.js | 1.2 MB | Needs splitting |
| TicketPanel-BjV2vYb6.js | 284 KB | Extract to subcomponents |
| Book-DMRf3sb1.js | 237 KB | Lazy load |
| FrontDesk-D_jg8GQ9.js | 228 KB | Lazy load |
| vendor-supabase-HsV626Hp.js | 184 KB | OK (external) |
| Schedule-Cy5JeA8K.js | 184 KB | Lazy load |
| vendor-radix-CDOCJI02.js | 164 KB | Tree-shake |
| vendor-react-CWzGSemn.js | 140 KB | OK (core) |
| vendor-motion-CRfmlJ9f.js | 120 KB | Consider alternatives |

---

## Action Items

### Quick Wins (High Impact, Low Effort)

#### 1. Remove Console Logs in Production
- [ ] Install: `npm install -D vite-plugin-remove-console`
- [ ] Configure in `vite.config.ts`:

```typescript
import removeConsole from 'vite-plugin-remove-console';

export default defineConfig({
  plugins: [
    removeConsole({ includes: ['log', 'warn'] }) // Keep errors
  ]
});
```

**Impact:** Reduced bundle size, cleaner production logs, improved security

---

#### 2. Lazy Load Large Modals
- [ ] Update imports for heavy modals:

```typescript
// Before
import { NewAppointmentModal } from './NewAppointmentModal.v2';

// After
const NewAppointmentModal = lazy(() => import('./NewAppointmentModal.v2'));
const PaymentModal = lazy(() => import('./PaymentModal'));
const CheckoutModal = lazy(() => import('./checkout/CheckoutModal'));

// Usage with Suspense
<Suspense fallback={<ModalSkeleton />}>
  {showModal && <NewAppointmentModal />}
</Suspense>
```

**Impact:** Faster initial page load, reduced initial bundle

---

#### 3. Apply Memoized Selectors Pattern
- [ ] Follow pattern from `appointmentSelectors.ts` for other slices:

```typescript
// src/store/selectors/ticketSelectors.ts
import { createSelector } from '@reduxjs/toolkit';

export const selectTicketsState = (state: RootState) => state.tickets;

export const selectActiveTickets = createSelector(
  [selectTicketsState],
  (tickets) => tickets.items.filter(t => t.status === 'active')
);

export const selectTicketById = createSelector(
  [selectTicketsState, (_, ticketId: string) => ticketId],
  (tickets, ticketId) => tickets.items.find(t => t.id === ticketId)
);
```

**Apply to:**
- [ ] `ticketsSlice.ts`
- [ ] `staffSlice.ts`
- [ ] `teamSlice.ts`
- [ ] `catalogSlice.ts`

**Impact:** 30-40% fewer re-renders

---

#### 4. Use VirtualList for Long Lists
- [ ] Apply to these components:

```typescript
// src/components/client-settings/components/ClientList.tsx
import { VirtualList } from '@/components/common/VirtualList';

<VirtualList
  items={clients}
  height={600}
  itemHeight={72}
  renderItem={(client) => <ClientRow client={client} />}
/>
```

**Apply to:**
- [ ] `ClientList.tsx` (client-settings)
- [ ] `ClosedTickets.tsx`
- [ ] `TransactionRecords.tsx`
- [ ] `WaitList.tsx`

**Impact:** Smooth scrolling, lower memory usage

---

#### 5. Optimize date-fns Imports
- [ ] Replace barrel imports with specific imports:

```typescript
// Before (imports entire library)
import { format, parseISO, addDays } from 'date-fns';

// After (tree-shakeable)
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import addDays from 'date-fns/addDays';
```

**Files to update:** 94 files have `import * as` or barrel imports

**Impact:** Better tree-shaking, smaller bundle

---

### Long-term Optimizations

#### 6. Split Large Components

**TicketPanel.tsx (2879 lines) → Module Structure:**
```
src/components/checkout/TicketPanel/
├── index.ts                    # Barrel export
├── TicketPanel.tsx             # Main component (~500 lines)
├── hooks/
│   ├── useTicketState.ts       # State management
│   ├── useTicketPayment.ts     # Payment logic
│   └── useTicketServices.ts    # Service operations
├── components/
│   ├── TicketHeader.tsx        # Header section
│   ├── ServiceList.tsx         # Services display
│   ├── PaymentSection.tsx      # Payment UI
│   └── TicketActions.tsx       # Action buttons
└── constants.ts                # Constants and types
```

---

#### 7. Redux State Normalization
- [ ] Use `createEntityAdapter` for better performance:

```typescript
// Before
interface TicketsState {
  items: Ticket[];  // O(n) lookups
}

// After
import { createEntityAdapter } from '@reduxjs/toolkit';

const ticketsAdapter = createEntityAdapter<Ticket>();

interface TicketsState extends EntityState<Ticket> {
  // O(1) lookups via ids and entities
}
```

**Impact:** O(1) lookups instead of O(n) filtering

---

#### 8. Web Worker Offloading
- [ ] Move heavy calculations to workers:

```typescript
// src/workers/calculations.worker.ts
self.onmessage = (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'CALCULATE_PAYROLL':
      const result = calculatePayroll(payload);
      self.postMessage({ type: 'PAYROLL_RESULT', result });
      break;
  }
};

// Usage
const worker = new Worker(new URL('./workers/calculations.worker.ts', import.meta.url));
worker.postMessage({ type: 'CALCULATE_PAYROLL', payload: data });
```

**Candidates:**
- [ ] `smartAutoAssign.ts` - Staff assignment algorithms
- [ ] `conflictDetection.ts` - Appointment conflict checks
- [ ] `payrollCalculation.ts` - Pay calculations

---

## React Performance Checklist

### Components Needing Memoization

| Component | Lines | useSelector Count | Action |
|-----------|-------|-------------------|--------|
| `FrontDesk.tsx` | 932 | 11+ | Create memoized selectors |
| `TicketPanel.tsx` | 2879 | 9+ | Split and memoize |
| `StaffSidebar.tsx` | 901 | ~8 | Create memoized selectors |
| `StoreLoginScreen.tsx` | 842 | ~17 console logs | Clean up |

### Re-render Hotspots

1. **useFrontDeskState.ts** - Returns 50+ values, any change triggers re-render
   - [ ] Split into focused hooks

2. **useTicketsCompat.ts** - 15+ memoization calls but still cascades
   - [ ] Review dependencies

3. **Context nesting** - 5+ contexts cause propagation
   - [ ] Consider context splitting or Jotai/Zustand

---

## Metrics to Track

| Metric | Target | Tool |
|--------|--------|------|
| Initial Bundle Size | <2MB | vite-bundle-analyzer |
| Largest Chunk | <500KB | rollup-plugin-visualizer |
| Time to Interactive | <3s | Lighthouse |
| React Re-renders | <10/interaction | React DevTools Profiler |
| Console Logs (Prod) | 0 | ESLint rule |

---

## Implementation Priority

### Week 1
- [ ] Remove console logs (vite-plugin-remove-console)
- [ ] Lazy load 3 largest modals
- [ ] Create ticketSelectors.ts with memoized selectors

### Week 2
- [ ] Apply VirtualList to ClientList and ClosedTickets
- [ ] Optimize date-fns imports (top 20 files)
- [ ] Create staffSelectors.ts

### Week 3-4
- [ ] Split TicketPanel.tsx into module structure
- [ ] Implement Web Workers for calculations
- [ ] Normalize Redux state with createEntityAdapter
