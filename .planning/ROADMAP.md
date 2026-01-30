# Catalog Module Improvements - Roadmap

**Project:** Catalog Module Improvements
**Timeline:** 6 weeks (4-6 weeks estimated)
**Start Date:** 2026-01-22
**Target Completion:** 2026-03-05

---

## Roadmap Overview

```
Phase 1: Critical Architecture (Week 1-2)
├─ Sync worker implementation
├─ Caching layer
├─ Transaction support
├─ Tombstone cleanup
└─ Error handling standardization

Phase 2: Code Quality & Testing (Week 3-4)
├─ Test coverage (78% → 90%)
├─ Security hardening
├─ File refactoring (2052→600 lines)
└─ CRUD deduplication

Phase 3: Performance & Polish (Week 5-6)
├─ Type safety improvements
├─ Query optimization
├─ Documentation completion
└─ Technical debt cleanup
```

---

## Phase 1: Critical Architecture

**Duration:** 2 weeks (10 working days)
**Goal:** Implement missing critical infrastructure for production scalability
**Priority:** CRITICAL - Must complete before scale

### Requirements

| ID | Requirement | Effort | Risk |
|----|-------------|--------|------|
| ARCH-001 | Background sync worker with vector clock conflict resolution | 3-4 days | 🔴 High |
| ARCH-002 | Caching layer with request deduplication | 2-3 days | 🟡 Medium |
| ARCH-003 | Transaction support for batch operations | 1-2 days | 🟢 Low |
| ARCH-004 | Tombstone cleanup automation | 1 day | 🟢 Low |
| ARCH-005 | Standardize error handling across layers | 1-2 days | 🟢 Low |

**Total Effort:** 8-12 days

### Success Criteria

- [ ] Sync worker syncs 100 entities in <10 seconds
- [ ] Conflict resolution handles concurrent edits correctly
- [ ] Cache reduces IndexedDB reads by 70%+
- [ ] Batch operations are atomic (all or nothing)
- [ ] Tombstones auto-cleanup after 30 days
- [ ] All service methods throw consistent error types
- [ ] Integration tests pass for sync flow
- [ ] Zero breaking changes to existing integrations

### Technical Approach

**ARCH-001: Background Sync Worker**

Architecture:
```typescript
// New file: src/services/sync/syncWorker.ts
class SyncWorker {
  private queue: SyncQueue;
  private conflictResolver: VectorClockResolver;

  async sync(entityType: EntityType): Promise<SyncResult> {
    // 1. Get all local entities (syncStatus: 'local')
    // 2. For each entity, attempt Supabase upsert
    // 3. If conflict, resolve using vector clocks
    // 4. Update syncStatus to 'synced' on success
    // 5. Retry with exponential backoff on failure
  }
}
```

Files to create:
- `src/services/sync/syncWorker.ts` - Main worker
- `src/services/sync/conflictResolver.ts` - Vector clock merge logic
- `src/services/sync/syncQueue.ts` - Priority queue for sync operations
- `src/services/sync/types.ts` - Sync-related types

Files to modify:
- `src/db/catalogDatabase.ts` - Add getSyncPending() methods
- `src/services/domain/catalogDataService.ts` - Trigger sync after local writes

**ARCH-002: Caching Layer**

Architecture:
```typescript
// New file: src/services/cache/cacheManager.ts
class CacheManager {
  private cache: Map<string, CachedEntity>;
  private inFlightRequests: Map<string, Promise<any>>;

  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    // 1. Check cache, return if fresh
    // 2. Check in-flight requests, await if exists
    // 3. Fetch and cache if miss
  }
}
```

Files to create:
- `src/services/cache/cacheManager.ts` - Cache implementation
- `src/services/cache/types.ts` - Cache configuration types

Files to modify:
- `src/services/domain/catalogDataService.ts` - Wrap all getById/getAll with cache

**ARCH-003: Transaction Support**

Files to modify:
- `src/db/catalogDatabase.ts` - Add transaction wrapper methods
- `src/services/domain/catalogDataService.ts` - Use transactions for batch ops

**ARCH-004: Tombstone Cleanup**

Files to create:
- `src/services/cleanup/tombstoneCleanup.ts` - Cleanup job

Files to modify:
- `src/db/catalogDatabase.ts` - Add cleanupExpiredTombstones() methods

**ARCH-005: Error Handling**

Files to create:
- `src/utils/errors.ts` - Custom error classes (NotFoundError, ValidationError, etc.)

Files to modify:
- All service files - Standardize error handling

### Dependencies

- None (this is the foundation phase)

### Risks & Mitigations

**🔴 High Risk: ARCH-001 Sync Worker**
- Risk: Complex conflict resolution, potential data loss
- Mitigation: Extensive testing, gradual rollout, ability to rollback to last-write-wins

**🟡 Medium Risk: ARCH-002 Caching**
- Risk: Cache invalidation bugs causing stale data
- Mitigation: Conservative TTLs, manual invalidation on writes, cache bypass flag

**🟢 Low Risk: ARCH-003/004/005**
- Well-understood patterns, low complexity

### Validation

After Phase 1 completion:
1. Run integration tests for sync flow (TEST-002)
2. Manually test offline → online sync with conflicts
3. Verify cache hit rate in browser devtools
4. Test batch operations rollback on failure
5. Verify tombstone cleanup runs daily

---

## Phase 2: Code Quality & Testing

**Duration:** 2 weeks (10 working days)
**Goal:** Achieve 90% test coverage and improve code maintainability
**Priority:** HIGH - Required for production confidence

### Requirements

| ID | Requirement | Effort | Risk |
|----|-------------|--------|------|
| TEST-001 | Unit tests for 4 untested table modules | 1.5 days | 🟢 Low |
| TEST-002 | Integration tests for sync flow | 2 days | 🟡 Medium |
| TEST-003 | E2E tests for critical user flows | 2 days | 🟡 Medium |
| SEC-001 | storeId validation in all getById methods | 0.5 days | 🟢 Low |
| SEC-002 | Rate limiting for search operations | 1 day | 🟢 Low |
| MAINT-001 | Refactor catalogDataService.ts (2052→600 lines) | 2 days | 🟡 Medium |
| MAINT-002 | Refactor useCatalog.ts (1283→400 lines) | 1.5 days | 🟢 Low |
| MAINT-003 | Extract CRUD boilerplate to base class | 1.5 days | 🟡 Medium |

**Total Effort:** 12 days

### Success Criteria

- [ ] Test coverage reaches 90% (up from 78%)
- [ ] All E2E tests pass in CI/CD
- [ ] catalogDataService.ts split into 6 files, each <600 lines
- [ ] useCatalog.ts split into 4 hooks, each <400 lines
- [ ] CRUD boilerplate reduced by 50%
- [ ] No cross-tenant data access possible (SEC-001)
- [ ] Search limited to 10 requests/second (SEC-002)
- [ ] Zero breaking changes to public APIs

### Technical Approach

**TEST-001: Unit Tests**

Files to create:
- `src/services/supabase/tables/servicePackagesTable.test.ts`
- `src/services/supabase/tables/bookingSequencesTable.test.ts`
- `src/services/supabase/tables/addOnGroupsTable.test.ts`
- `src/services/supabase/tables/addOnOptionsTable.test.ts`

Test coverage targets:
- CRUD operations: 100%
- Relationship queries: 90%
- Edge cases: 80%

**TEST-002: Integration Tests**

Files to create:
- `src/services/sync/syncWorker.test.ts` - Integration tests
- `src/services/sync/conflictResolver.test.ts` - Integration tests

Test scenarios:
1. Local create → background sync → Supabase persist
2. Conflict resolution with vector clocks
3. Offline mode → online transition sync
4. Sync failure retry logic

**TEST-003: E2E Tests**

Files to create:
- `e2e/catalog-checkout.spec.ts` - Create service → checkout → payment
- `e2e/catalog-search.spec.ts` - Search → select variant → add to appointment
- `e2e/catalog-archive.spec.ts` - Archive → UI update → restore
- `e2e/catalog-offline.spec.ts` - Offline create → online → verify sync
- `e2e/catalog-conflict.spec.ts` - Concurrent edits → conflict resolution

**MAINT-001: Refactor catalogDataService.ts**

Current: 2052 lines in single file

Target structure:
```
src/services/domain/catalog/
├── index.ts                          # Re-exports (backward compatibility)
├── serviceCategoriesService.ts       # ~300 lines
├── menuServicesService.ts            # ~400 lines
├── serviceVariantsService.ts         # ~250 lines
├── servicePackagesService.ts         # ~300 lines
├── addOnGroupsService.ts             # ~250 lines
├── addOnOptionsService.ts            # ~200 lines
├── staffServiceAssignmentsService.ts # ~150 lines
├── catalogSettingsService.ts         # ~200 lines
├── bookingSequencesService.ts        # ~200 lines
├── productsService.ts                # ~200 lines
└── baseCatalogService.ts             # ~150 lines (shared routing logic)
```

Total: ~2,600 lines (split improves maintainability despite slight increase)

**MAINT-002: Refactor useCatalog.ts**

Current: 1283 lines in single hook

Target structure:
```
src/hooks/catalog/
├── index.ts                  # Re-exports
├── useServices.ts            # ~300 lines (load, create, update, delete)
├── useCategories.ts          # ~200 lines
├── useServiceSearch.ts       # ~250 lines (search, filters)
├── useServiceFilters.ts      # ~200 lines (category, price, duration filters)
├── usePackages.ts            # ~200 lines
└── useAddOns.ts              # ~150 lines
```

**MAINT-003: Base Repository Class**

Files to create:
- `src/db/BaseRepository.ts` - Generic CRUD operations

Files to modify:
- All entity database files to extend BaseRepository

### Dependencies

- Phase 1 must be complete (sync worker needed for TEST-002)

### Risks & Mitigations

**🟡 Medium Risk: File Refactoring**
- Risk: Breaking imports during refactoring
- Mitigation: Maintain backward-compatible exports in index.ts

**🟡 Medium Risk: Integration Tests**
- Risk: Flaky tests due to timing issues
- Mitigation: Proper mocking, deterministic test data

### Validation

After Phase 2 completion:
1. Run `npm run test:coverage` and verify 90%+
2. Run E2E tests in CI/CD
3. Verify no import errors in dependent modules
4. Code review for file size compliance
5. Security audit: attempt cross-tenant access

---

## Phase 3: Performance & Polish

**Duration:** 2 weeks (10 working days)
**Goal:** Optimize performance and complete documentation
**Priority:** MEDIUM - Quality-of-life improvements

### Requirements

| ID | Requirement | Effort | Risk |
|----|-------------|--------|------|
| TYPE-001 | Rename ServiceStatus → CatalogServiceStatus | 0.5 days | 🟢 Low |
| TYPE-002 | Add ProductRow type definition | 0.5 days | 🟢 Low |
| TYPE-003 | Add deposit validation | 0.5 days | 🟢 Low |
| PERF-001 | Optimize N+1 queries in getWithRelationships | 1 day | 🟢 Low |
| PERF-002 | Add compound indexes | 0.5 days | 🟢 Low |
| PERF-003 | Reduce live query overhead | 1.5 days | 🟡 Medium |
| DOC-001 | Add JSDoc to all public service methods | 1.5 days | 🟢 Low |
| DOC-002 | Create migration guide from Redux to live queries | 1 day | 🟢 Low |
| MAINT-004 | Remove deprecated catalogSlice.ts | 0.5 days | 🟢 Low |

**Total Effort:** 8 days

### Success Criteria

- [ ] No type name collisions (TYPE-001)
- [ ] ProductRow properly typed (TYPE-002)
- [ ] Deposit validation enforced (TYPE-003)
- [ ] getWithRelationships <100ms for 5 variants + 3 add-ons (PERF-001)
- [ ] Compound indexes improve query speed by 50%+ (PERF-002)
- [ ] Live query renders <50ms for 20 categories (PERF-003)
- [ ] 100% JSDoc coverage for public APIs (DOC-001)
- [ ] Migration guide complete and tested (DOC-002)
- [ ] catalogSlice.ts removed, no references (MAINT-004)

### Technical Approach

**TYPE-001: Rename ServiceStatus**

Files to modify (~30 files):
1. Find all: `import { ServiceStatus } from '@/types/catalog'`
2. Replace: `import { CatalogServiceStatus } from '@/types/catalog'`
3. Update type references

**TYPE-002: ProductRow Type**

Files to create:
- `src/services/supabase/adapters/productAdapter.ts`

Files to modify:
- `src/services/supabase/types.ts` - Add ProductRow
- `src/services/supabase/tables/productsTable.ts` - Use ProductRow

**TYPE-003: Deposit Validation**

Files to modify:
- `src/types/catalog.ts` - Add Zod schema
- `src/services/domain/catalog/menuServicesService.ts` - Validate on create/update

**PERF-001: Optimize N+1 Queries**

Before:
```typescript
async getWithVariants(serviceId: string) {
  const service = await this.getById(serviceId);
  const variants = await serviceVariantsDB.getByServiceId(serviceId); // N+1
  return { ...service, variants };
}
```

After:
```typescript
async getWithVariants(serviceId: string) {
  const [service, variants] = await Promise.all([
    this.getById(serviceId),
    serviceVariantsDB.getByServiceId(serviceId),
  ]);
  return { ...service, variants };
}
```

**PERF-002: Compound Indexes**

Files to modify:
- `src/db/catalogDatabase.ts` - Add compound indexes to schema

Indexes to add:
- `[storeId+status]`
- `[storeId+onlineBookingEnabled]`
- `[storeId+categoryId+displayOrder]`

**PERF-003: Live Query Optimization**

Files to modify:
- All components using live queries - Add useMemo

Before:
```typescript
const categories = useLiveQuery(() => serviceCategoriesDB.getAll(storeId));
```

After:
```typescript
const categories = useLiveQuery(
  () => serviceCategoriesDB.getAll(storeId),
  [storeId]
);
const memoizedCategories = useMemo(() => categories, [categories]);
```

**DOC-001: JSDoc Coverage**

Files to modify:
- All service files in `src/services/domain/catalog/`

Example:
```typescript
/**
 * Creates a new menu service in the catalog.
 *
 * @param input - Service data (name, price, duration, etc.)
 * @param userId - ID of user creating the service
 * @param storeId - Store ID for multi-tenant isolation
 * @param tenantId - Tenant ID (usually same as storeId)
 * @param deviceId - Device ID for vector clock tracking
 * @returns Created service with generated ID and sync metadata
 * @throws {ValidationError} If input fails validation
 * @throws {ForbiddenError} If user lacks permission
 *
 * @example
 * const service = await menuServicesService.create(
 *   { name: 'Haircut', price: 50, duration: 60, ... },
 *   'user-123',
 *   'store-456'
 * );
 */
```

**DOC-002: Migration Guide**

Files to create:
- `docs/migrations/CATALOG_REDUX_TO_LIVE_QUERIES.md`

Content:
1. Why migrate (simpler, faster, less boilerplate)
2. Before/after code examples
3. Performance comparison
4. Step-by-step migration checklist
5. Common pitfalls

**MAINT-004: Remove catalogSlice.ts**

Steps:
1. Search codebase for `catalogSlice` imports
2. Verify zero usages
3. Delete `src/store/slices/catalogSlice.ts`
4. Update CHANGELOG with deprecation notice

### Dependencies

- Phase 1 complete (performance optimizations build on sync/cache)
- Phase 2 complete (refactored files needed for JSDoc)

### Risks & Mitigations

**🟡 Medium Risk: PERF-003 Live Query Optimization**
- Risk: Over-memoization causing stale data
- Mitigation: Careful dependency array management

**🟢 Low Risk: All other Phase 3 items**
- Well-scoped, low complexity

### Validation

After Phase 3 completion:
1. Run performance benchmarks (before/after comparison)
2. Verify no type errors with `npm run typecheck`
3. Verify deposit validation with invalid inputs
4. Measure query performance with Chrome DevTools
5. Review JSDoc coverage with TSDoc linter
6. Test migration guide with sample component

---

## Milestone Summary

### Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Test Coverage | 78% | 90%+ | ✅ |
| catalogDataService.ts lines | 2,052 | <600/file | ✅ |
| useCatalog.ts lines | 1,283 | <400/file | ✅ |
| Sync Worker Implemented | ❌ | ✅ | ✅ |
| Caching Layer | ❌ | ✅ | ✅ |
| Transaction Support | ❌ | ✅ | ✅ |
| Tombstone Cleanup | ❌ | ✅ | ✅ |
| storeId Validation | Partial | 100% | ✅ |
| JSDoc Coverage | 30% | 100% | ✅ |
| Overall Rating | 7.7/10 | 9+/10 | ✅ |

### Risk Summary

**🔴 High Risk (1 item):**
- ARCH-001: Background sync worker - Complex, potential data loss

**🟡 Medium Risk (5 items):**
- ARCH-002: Caching layer - Invalidation bugs
- TEST-002: Integration tests - Flaky tests
- TEST-003: E2E tests - Timing issues
- MAINT-001: File refactoring - Breaking imports
- PERF-003: Live query optimization - Stale data

**🟢 Low Risk (17 items):**
- All other requirements

### Contingency Planning

If Phase 1 ARCH-001 proves too complex:
- **Fallback:** Implement simple last-write-wins sync (no conflict resolution)
- **Timeline:** Saves 2-3 days
- **Trade-off:** No multi-device concurrent edit support

If Phase 2 testing reaches only 85% coverage:
- **Acceptable:** 85% is good coverage, 90% is aspirational
- **Trade-off:** Slightly less confidence, but shipping is more important

If Phase 3 runs over timeline:
- **De-scope:** PERF-003 and DOC-002 can be deferred to v2
- **Impact:** Minor UX and DX improvements delayed

---

## Timeline & Milestones

```
Week 1-2: Phase 1 (Critical Architecture)
├─ Day 1-4: ARCH-001 Sync worker
├─ Day 5-7: ARCH-002 Caching layer
├─ Day 8-9: ARCH-003 Transactions + ARCH-004 Tombstone cleanup
└─ Day 10: ARCH-005 Error handling + Phase 1 validation

Week 3-4: Phase 2 (Code Quality & Testing)
├─ Day 11-12: TEST-001 Unit tests for 4 modules
├─ Day 13-14: TEST-002 Integration tests
├─ Day 15-16: TEST-003 E2E tests
├─ Day 17-18: MAINT-001 Refactor catalogDataService
├─ Day 19: MAINT-002 Refactor useCatalog + SEC-001/002
└─ Day 20: MAINT-003 Base repository + Phase 2 validation

Week 5-6: Phase 3 (Performance & Polish)
├─ Day 21-22: TYPE-001/002/003 Type improvements
├─ Day 23-24: PERF-001/002 Query optimization + indexes
├─ Day 25-26: PERF-003 Live query optimization
├─ Day 27-28: DOC-001 JSDoc + DOC-002 Migration guide
├─ Day 29: MAINT-004 Remove catalogSlice
└─ Day 30: Phase 3 validation + Final review
```

---

## Next Steps

1. **Start Phase 1** - Begin with ARCH-001 (sync worker)
2. **Create Phase 1 execution plan** - Detailed implementation steps
3. **Set up Phase 1 tracking** - Use TodoWrite for task management

To begin Phase 1 execution:
```bash
# Option 1: Use GSD workflow
/gsd:plan-phase 1

# Option 2: Start implementing directly
# Begin with ARCH-001 sync worker implementation
```

---

*Roadmap created: 2026-01-22*
*Last updated: 2026-01-22 after project initialization*
*Status: Ready for Phase 1 execution*
