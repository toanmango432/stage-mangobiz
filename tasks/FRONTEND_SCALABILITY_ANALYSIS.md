# Frontend Architecture Scalability Analysis for 100K+ Salons

## Executive Summary

This document analyzes the Mango POS frontend architecture scalability for deployment across 100,000+ salons. The analysis covers Redux state management, bundle size, IndexedDB performance, component optimization, and memory management.

**Overall Assessment**: The architecture is well-designed for single-salon operation but requires optimization for 100K+ deployment scale.

---

## Analysis Results

### 1. Redux State Management

**Current State:**
- 21 Redux slices in `src/store/slices/`
- Largest slices by line count:
  - `clientsSlice.ts` - 1,823 lines (comprehensive CRM features)
  - `uiTicketsSlice.ts` - 1,493 lines (ticket UI state)
  - `scheduleSlice.ts` - 1,458 lines (schedule management)
  - `teamSlice.ts` - 1,072 lines
  - `timesheetSlice.ts` - 915 lines

**Key Observations:**
- State is stored per salon session (good isolation)
- Uses createAsyncThunk for async operations
- Type-safe with TypeScript interfaces
- Some slices mix UI state with data state (e.g., `clientsSlice` contains `selectedClient`, `filters`, `pagination`)

**Scalability Concerns:**
- `items: Client[]` in clientsSlice stores all clients in memory
- No pagination at Redux level - full data fetch with limits (100-500 records)
- Multiple computed selectors that iterate full arrays (e.g., `selectBlockedClients`)

### 2. Bundle Size Analysis

**Current State:**
- Total bundle: ~3.9MB (target: <2MB)

**Largest Chunks:**
| Chunk | Size | gzip |
|-------|------|------|
| index-BS65hrSN.js (main) | 816 KB | 196 KB |
| AdminPortal | 317 KB | 55 KB |
| FrontDesk | 293 KB | 57 KB |
| index-CQBDezKL.js | 289 KB | 60 KB |
| TicketPanel | 267 KB | 63 KB |
| Book | 236 KB | 55 KB |
| Schedule | 186 KB | 48 KB |
| vendor-supabase | 185 KB | 48 KB |
| vendor-radix | 167 KB | 44 KB |
| vendor-react | 142 KB | 46 KB |
| vendor-motion | 119 KB | 40 KB |

**Code Splitting Status:**
- AdminPortal: Lazy loaded (good)
- Main modules: NOT lazy loaded (opportunity)
- Manual chunks configured for vendors (good)
- VirtualList exists but NOT used in most components

### 3. IndexedDB/Dexie.js Performance

**Current State:**
- 12 database schema versions, well-maintained migrations
- Comprehensive compound indexes for common queries
- Per-salon data isolation via `salonId`/`storeId` fields

**Index Coverage:**
```
appointments: [salonId+status], [salonId+scheduledStartTime], [staffId+scheduledStartTime]
tickets: [salonId+status], [salonId+createdAt], [clientId+createdAt]
clients: [salonId+lastName], [salonId+isBlocked], [salonId+isVip]
```

**Data Retention:**
- 90 days for appointments
- 1 year for tickets
- Automatic cleanup via `dataCleanupService`

**Query Patterns (Good):**
- Uses `.where().equals()` with indexes
- Applies `.limit()` on all queries (100-500 records)
- Compound indexes for multi-field queries

**Potential Issues:**
- Client search uses `.and()` filter (not indexed) for text search
- Some operations fetch all records then filter in memory

### 4. Large Components

**Components over 1,000 lines:**

| Component | Lines | Issue |
|-----------|-------|-------|
| TicketPanel.tsx | 3,814 | Massive - needs splitting |
| StaffCard.tsx | 2,225 | Complex - needs splitting |
| NewAppointmentModal.v2.tsx | 2,045 | Large modal |
| FrontDeskSettings.tsx | 1,656 | Settings panels |
| AddTeamMember.tsx | 1,645 | Team management |
| WaitListSection.tsx | 1,399 | List management |
| OperationTemplateSetup.tsx | 1,380 | Setup flow |
| ServiceSection.tsx | 1,341 | Service listing |
| NewAppointmentModal.tsx | 1,303 | Appointment flow |
| TimesheetSection.tsx | 1,187 | Timesheet management |

### 5. Virtual Scrolling Status

**Availability:**
- `VirtualList` and `VirtualGrid` in `src/components/common/VirtualList.tsx`
- Uses `@tanstack/react-virtual`
- Also has `react-window` installed (redundant)

**Usage:**
- **NOT used** in client lists
- **NOT used** in appointment lists
- **NOT used** in ticket lists
- **NOT used** in staff lists
- Only used in AgendaView (Book module)

---

## Recommendations

### High Priority (Immediate Impact)

#### 1. Implement Virtual Scrolling for Lists
**Impact:** Memory reduction, faster rendering
**Files to modify:**
- `src/components/frontdesk/ServiceSection.tsx` - Use VirtualList for service tickets
- `src/components/frontdesk/WaitListSection.tsx` - Use VirtualList for waitlist
- Client lists in CRM module
- Transaction history lists

```tsx
// Example implementation
import { VirtualList } from '@/components/common/VirtualList';

<VirtualList
  items={tickets}
  estimateSize={80}
  overscan={5}
  renderItem={(ticket) => <TicketCard ticket={ticket} />}
/>
```

#### 2. Code Split Large Modules
**Impact:** 40-50% initial bundle reduction
**Strategy:**
```tsx
// In App.tsx or routes
const FrontDesk = lazy(() => import('./components/modules/FrontDesk'));
const Book = lazy(() => import('./pages/BookPage'));
const Checkout = lazy(() => import('./components/checkout/TicketPanel'));
const Schedule = lazy(() => import('./components/schedule/ScheduleView'));
const Sales = lazy(() => import('./components/modules/Sales'));
```

#### 3. Split TicketPanel Component
**Impact:** Better code maintainability, smaller chunk
**Current:** 3,814 lines in one file
**Recommendation:** Extract into:
- `TicketPanelHeader.tsx` - Header and client info
- `TicketServiceList.tsx` - Services display
- `TicketDiscounts.tsx` - Discount/coupon logic
- `TicketPayment.tsx` - Payment section
- `TicketModals.tsx` - All modal dialogs

### Medium Priority (Performance Optimization)

#### 4. Redux State Optimization
**Impact:** Reduced memory, faster selectors

**a) Normalize client state:**
```tsx
// Before
items: Client[]

// After
byId: Record<string, Client>
allIds: string[]
```

**b) Use createSelector for computed values:**
```tsx
import { createSelector } from '@reduxjs/toolkit';

export const selectBlockedClients = createSelector(
  [(state) => state.clients.byId, (state) => state.clients.allIds],
  (byId, allIds) => allIds.filter(id => byId[id].isBlocked).map(id => byId[id])
);
```

**c) Implement pagination in Redux:**
```tsx
interface PaginatedState {
  currentPage: Client[];
  totalCount: number;
  pageSize: number;
  currentPageNumber: number;
  hasMore: boolean;
}
```

#### 5. IndexedDB Query Optimization
**Impact:** Faster search, reduced memory

**a) Add full-text search index:**
```tsx
// In schema.ts - add FTS index
clients: 'id, salonId, *searchableText, ...'

// Build searchable text on create/update
const searchableText = `${firstName} ${lastName} ${phone} ${email}`.toLowerCase();
```

**b) Implement cursor-based pagination:**
```tsx
async getClientsPaginated(salonId: string, cursor?: string, limit = 50) {
  let query = db.clients.where('salonId').equals(salonId);
  if (cursor) {
    query = query.and(c => c.id > cursor);
  }
  return query.limit(limit).toArray();
}
```

### Lower Priority (Future Improvements)

#### 6. Remove Redundant Dependencies
- Remove `react-window` (using `@tanstack/react-virtual` instead)
- Audit Radix UI components - only import used ones

#### 7. Implement Service Worker Caching
- Cache static assets for offline-first PWA
- Pre-cache critical routes

#### 8. Add Bundle Analysis Tooling
```bash
npm install -D rollup-plugin-visualizer
```

---

## Implementation Priority Matrix

| Priority | Task | Effort | Impact | Dependencies |
|----------|------|--------|--------|--------------|
| P0 | Virtual scrolling for lists | Medium | High | None |
| P0 | Code split main modules | Low | High | None |
| P1 | Split TicketPanel | High | Medium | None |
| P1 | Redux state normalization | High | Medium | None |
| P2 | IndexedDB search optimization | Medium | Medium | None |
| P2 | Remove redundant deps | Low | Low | None |
| P3 | Service worker caching | Medium | Medium | P0, P1 |

---

## Metrics to Track

1. **Bundle Size:** Target < 2MB (currently ~3.9MB)
2. **Initial Load Time:** Target < 3s on 3G
3. **Time to Interactive:** Target < 5s
4. **Memory Usage:** Target < 100MB active heap
5. **IndexedDB Query Time:** Target < 100ms for paginated queries

---

## Review Summary

### What's Working Well:
- Per-salon data isolation in IndexedDB
- Comprehensive compound indexes
- Data retention policies
- Vendor chunking in Vite config
- VirtualList component exists (just needs adoption)
- AdminPortal already lazy loaded

### Areas for Improvement:
- Main modules not code-split
- Virtual scrolling underutilized
- Large monolithic components
- Redux stores full arrays in memory
- Redundant dependencies (`react-window` + `@tanstack/react-virtual`)

### Estimated Impact of Optimizations:
- **Bundle size:** 3.9MB -> ~2MB (49% reduction)
- **Initial load:** 60% faster with code splitting
- **Memory:** 40-60% reduction with virtual scrolling
- **Render time:** 70% faster for large lists with virtualization
