# Sprint 1: Performance Data Integration - Detailed Breakdown

**Duration:** Days 1-2
**Goal:** Replace mock data in PerformanceSection and AchievementsSection with real data from transactions/appointments

---

## Task 1.1: Create performanceService.ts
**File:** `src/services/performanceService.ts` (NEW)
**Effort:** 3-4 hours

### Purpose
Service layer to calculate performance metrics from existing data sources (transactions, appointments, clients).

### Functions to Implement
```typescript
// Main functions
getStaffMetrics(storeId: string, staffId: string, period: PerformancePeriod): Promise<PerformanceMetrics>
getStaffAchievements(storeId: string, staffId: string): Promise<Achievement[]>
getStaffReviewSummary(storeId: string, staffId: string): Promise<ReviewSummary>

// Helper functions
calculatePeriodDates(period: PerformancePeriod): { start: Date, end: Date }
aggregateTransactionMetrics(transactions: Transaction[]): Partial<PerformanceMetrics>
calculateRebookingRate(appointments: Appointment[], staffId: string): number
checkAchievementCriteria(metrics: PerformanceMetrics, staffId: string): Achievement[]
```

### Data Sources
| Metric | Source Table | Query |
|--------|-------------|-------|
| totalRevenue | `transactions` | SUM where staffId matches |
| serviceRevenue | `tickets.services` | SUM of service prices |
| productRevenue | `tickets.products` | SUM of product prices |
| tipRevenue | `tickets.tip` | SUM of tips |
| servicesCompleted | `appointments` | COUNT where status='completed' |
| totalClients | `clients` | COUNT distinct clientIds from appointments |
| newClients | `clients` | COUNT where createdAt in period |
| rebookingRate | `appointments` | % of clients with >1 appointment |
| averageRating | `clientReviews` | AVG of rating where staffId matches |

### Dependencies
- `src/db/database.ts` (transactionsDB, appointmentsDB, clientsDB, clientReviewsDB)
- `src/types/performance.ts` (existing types)

---

## Task 1.2: Create performanceSlice.ts
**File:** `src/store/slices/performanceSlice.ts` (NEW)
**Effort:** 2-3 hours

### State Structure
```typescript
interface PerformanceState {
  // Metrics by staffId and period
  metrics: Record<string, Record<PerformancePeriod, PerformanceMetrics>>;

  // Achievements by staffId
  achievements: Record<string, Achievement[]>;

  // Review summaries by staffId
  reviewSummaries: Record<string, ReviewSummary>;

  // Loading states
  loading: boolean;
  loadingStaffId: string | null;
  error: string | null;

  // Cache timestamps
  lastFetchedAt: Record<string, string>;
}
```

### Async Thunks
```typescript
fetchStaffPerformance(storeId, staffId, period)
fetchStaffAchievements(storeId, staffId)
fetchStaffReviewSummary(storeId, staffId)
refreshAllPerformance(storeId, staffId) // Fetches all three
```

### Selectors
```typescript
selectStaffMetrics(state, staffId, period): PerformanceMetrics | null
selectStaffAchievements(state, staffId): Achievement[]
selectStaffReviewSummary(state, staffId): ReviewSummary | null
selectPerformanceLoading(state): boolean
selectPerformanceError(state): string | null
```

### Pattern Reference
Follow the same pattern as `timesheetSlice.ts`:
- Normalized state with Records
- Async thunks with proper loading/error handling
- Clear selectors for component use

---

## Task 1.3: Create performanceOperations.ts
**File:** `src/db/performanceOperations.ts` (NEW)
**Effort:** 2-3 hours

### Purpose
IndexedDB operations for caching performance data locally (offline support).

### Operations
```typescript
// Cache metrics for offline access
cachePerformanceMetrics(staffId: string, period: PerformancePeriod, metrics: PerformanceMetrics)
getCachedMetrics(staffId: string, period: PerformancePeriod): PerformanceMetrics | null
clearCachedMetrics(staffId: string)

// Achievement tracking
saveAchievement(achievement: Achievement)
getAchievements(staffId: string): Achievement[]

// Review summary cache
cacheReviewSummary(staffId: string, summary: ReviewSummary)
getCachedReviewSummary(staffId: string): ReviewSummary | null
```

### Database Schema Addition
Add to `src/db/schema.ts`:
```typescript
performanceCache: '++id, staffId, periodType, calculatedAt',
staffAchievements: '++id, staffId, type, earnedAt',
```

---

## Task 1.4: Update PerformanceSection.tsx
**File:** `src/components/team-settings/sections/PerformanceSection.tsx`
**Effort:** 2-3 hours

### Changes Required
1. **Remove mock data generators** (lines 55-153):
   - Delete `generateMockMetrics()`
   - Delete `generateMockAchievements()`
   - Delete `generateMockReviewSummary()`

2. **Add Redux integration**:
   ```typescript
   import { useDispatch, useSelector } from 'react-redux';
   import {
     fetchStaffPerformance,
     selectStaffMetrics,
     selectStaffAchievements,
     selectStaffReviewSummary,
     selectPerformanceLoading
   } from '../../../store/slices/performanceSlice';
   ```

3. **Replace useMemo with useSelector**:
   ```typescript
   // Before
   const metrics = useMemo(() => generateMockMetrics(period), [period]);

   // After
   const metrics = useSelector(state => selectStaffMetrics(state, memberId, period));
   ```

4. **Add useEffect for data fetching**:
   ```typescript
   useEffect(() => {
     dispatch(fetchStaffPerformance({ storeId, staffId: memberId, period }));
   }, [memberId, period, storeId, dispatch]);
   ```

5. **Add loading state**:
   ```typescript
   const loading = useSelector(selectPerformanceLoading);
   if (loading) return <LoadingSpinner />;
   ```

---

## Task 1.5: Update AchievementsSection.tsx
**File:** `src/components/team-settings/sections/AchievementsSection.tsx`
**Effort:** 1-2 hours

### Changes Required
1. **Remove mock data generators** (lines 40-120):
   - Delete `generateMockAchievements()`
   - Delete `generateMockProgress()`

2. **Add Redux integration** (same pattern as Task 1.4)

3. **Replace useMemo with useSelector**:
   ```typescript
   const earnedAchievements = useSelector(state => selectStaffAchievements(state, memberId));
   ```

4. **Calculate progress from real metrics**:
   ```typescript
   const metrics = useSelector(state => selectStaffMetrics(state, memberId, 'monthly'));
   const progressList = useMemo(() =>
     calculateAchievementProgress(metrics, ACHIEVEMENT_DEFINITIONS),
     [metrics]
   );
   ```

---

## Task 1.6: Update store/index.ts
**File:** `src/store/index.ts`
**Effort:** 15 minutes

### Changes Required
1. Import the new slice:
   ```typescript
   import performanceReducer from './slices/performanceSlice';
   ```

2. Add to reducer object:
   ```typescript
   performance: performanceReducer,
   ```

3. Add to ignoredPaths (for non-serializable dates):
   ```typescript
   'performance.metrics',
   'performance.achievements',
   'performance.reviewSummaries',
   ```

---

## Task 1.7: Validate Sprint 1 in Frontend
**Effort:** 1-2 hours

### Validation Steps
1. **Navigate to Team Settings** → Select a staff member
2. **Open Performance Tab**:
   - [ ] Metrics show real data (or zeros if no transactions)
   - [ ] Period selector works (daily/weekly/monthly/yearly)
   - [ ] Goals progress shows correctly
   - [ ] No console errors
3. **Open Achievements Tab**:
   - [ ] Earned achievements display (if any earned)
   - [ ] Progress bars show real progress
   - [ ] Milestone tracker uses real revenue
4. **Test loading states**:
   - [ ] Loading spinner shows during fetch
   - [ ] Error message shows if fetch fails
5. **Test offline mode** (if applicable):
   - [ ] Cached data displays when offline

### Manual Testing Checklist
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] App builds successfully (`npm run build`)
- [ ] No regression in other Team Settings tabs

---

## Files Summary

| Action | File | Lines Changed |
|--------|------|---------------|
| CREATE | `src/services/performanceService.ts` | ~200 |
| CREATE | `src/store/slices/performanceSlice.ts` | ~300 |
| CREATE | `src/db/performanceOperations.ts` | ~100 |
| MODIFY | `src/components/team-settings/sections/PerformanceSection.tsx` | ~50 |
| MODIFY | `src/components/team-settings/sections/AchievementsSection.tsx` | ~40 |
| MODIFY | `src/store/index.ts` | ~10 |
| MODIFY | `src/db/schema.ts` | ~5 |

**Total estimated lines:** ~700 new, ~100 modified

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| No transaction data in dev | Provide fallback to empty metrics (zeros) |
| Slow aggregation queries | Add caching layer (performanceOperations) |
| Type mismatches | Reuse existing `PerformanceMetrics` type |

---

## Ready to Execute?

Please confirm and I'll start with **Task 1.1: Create performanceService.ts**
