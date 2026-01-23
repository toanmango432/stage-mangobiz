# Requirements: Catalog Module Improvements

**Defined:** 2026-01-22
**Core Value:** Scalability and maintainability must not be compromised by rapid feature delivery

## v1 Requirements

Requirements for catalog improvement project. Each maps to roadmap phases based on priority.

### Architecture & Sync (CRITICAL)

- [ ] **ARCH-001**: Background sync worker implementation
  - Automatically sync entities with `syncStatus: 'local'` to Supabase
  - Implement vector clock merge for conflict resolution
  - Retry with exponential backoff on failure
  - Handle offline/online state transitions
  - Emit sync events for UI feedback

- [ ] **ARCH-002**: Caching layer implementation
  - In-memory cache for frequently accessed entities
  - Request deduplication (don't re-fetch if request in flight)
  - Cache invalidation on updates/deletes
  - Configurable TTL per entity type
  - Cache hit/miss metrics

- [ ] **ARCH-003**: Transaction support
  - Wrap batch operations in Dexie transactions
  - Rollback on partial failures
  - Support for multi-entity operations (e.g., create service + variants)
  - Transaction-aware cache invalidation

- [ ] **ARCH-004**: Tombstone cleanup automation
  - Background job to purge tombstones with `expiresAt < now()`
  - Configurable cleanup schedule (default: daily)
  - Prevent cleanup of recently synced tombstones
  - Log cleanup operations for debugging

- [ ] **ARCH-005**: Standardize error handling
  - Consistent error types across all layers
  - Service layer: throw custom errors (NotFoundError, ValidationError, etc.)
  - Database layer: return undefined for not found, throw for unexpected errors
  - UI layer: catch and display user-friendly messages
  - Error boundaries for graceful degradation

### File Structure & Maintainability (CRITICAL)

- [ ] **MAINT-001**: Refactor catalogDataService.ts (2052 lines)
  - Split into separate files per entity (serviceCategoriesService.ts, menuServicesService.ts, etc.)
  - Extract common routing logic to base service class
  - Target: <600 lines per file
  - Maintain backward-compatible exports

- [ ] **MAINT-002**: Refactor useCatalog.ts hook (1283 lines)
  - Split into focused hooks (useServices, useCategories, usePackages)
  - Extract search logic to useServiceSearch hook
  - Extract filter logic to useServiceFilters hook
  - Target: <400 lines per hook file

### Testing (HIGH Priority)

- [ ] **TEST-001**: Add unit tests for untested table modules
  - `servicePackagesTable.ts` - CRUD operations
  - `bookingSequencesTable.ts` - CRUD operations
  - `addOnGroupsTable.ts` - CRUD and relationship queries
  - `addOnOptionsTable.ts` - CRUD and relationship queries
  - Target: 90% coverage per file

- [ ] **TEST-002**: Add integration tests for sync flow
  - Test local create → background sync → Supabase persist
  - Test conflict resolution with vector clocks
  - Test offline mode → online transition sync
  - Test sync failure retry logic
  - Target: 80% coverage of sync paths

- [ ] **TEST-003**: Add E2E tests
  - Create service → Add to checkout → Complete payment
  - Search service → Select variant → Add to appointment
  - Archive service → Verify UI updates → Restore service
  - Offline create → Go online → Verify sync
  - Target: 5 critical user flows

### Security (HIGH Priority)

- [ ] **SEC-001**: Add storeId validation to getById methods
  - All `getById()` methods must validate `entity.storeId === requestedStoreId`
  - Throw `ForbiddenError` if mismatch
  - Don't rely solely on RLS (defense in depth)
  - Add tests for cross-tenant access attempts

- [ ] **SEC-002**: Add rate limiting for search operations
  - Limit search requests to 10/second per user
  - Debounce client-side search inputs (300ms)
  - Cache search results for identical queries
  - Log excessive search activity

### Code Quality (HIGH Priority)

- [ ] **MAINT-003**: Extract CRUD boilerplate into base repository class
  - Create `BaseRepository<T>` with common operations
  - Entities extend and customize as needed
  - Reduce duplication across 10+ entity files
  - Target: 50% reduction in boilerplate

### Type Safety (MEDIUM Priority)

- [ ] **TYPE-001**: Rename ServiceStatus to CatalogServiceStatus
  - Fix type name collision with `common.ts`
  - Update all references (30+ files estimated)
  - Add deprecation notice for old import
  - Update documentation

- [ ] **TYPE-002**: Add ProductRow type definition
  - Define `ProductRow` in `services/supabase/types.ts`
  - Align with products table schema from migration 031
  - Create `productAdapter.ts` with type converters
  - Update `productsTable.ts` to use typed row

- [ ] **TYPE-003**: Add deposit validation
  - Validate `depositPercentage` is 0-100
  - Validate `depositAmount < service.price`
  - Add Zod schema for deposit fields
  - Enforce validation in create/update operations

### Performance (MEDIUM Priority)

- [ ] **PERF-001**: Optimize N+1 queries in getWithRelationships
  - Load related entities in batch (e.g., `Promise.all([variants, addOns])`)
  - Use single Dexie query with `.where().anyOf()` for bulk lookups
  - Measure and document performance improvement
  - Target: <100ms for service with 5 variants + 3 add-on groups

- [ ] **PERF-002**: Add compound indexes
  - Add `[storeId+status]` index for archived service queries
  - Add `[storeId+onlineBookingEnabled]` for online booking filters
  - Add `[storeId+categoryId+displayOrder]` for category browsing
  - Measure query performance before/after

- [ ] **PERF-003**: Reduce live query overhead
  - Memoize live query results with `useMemo`
  - Debounce rapid re-renders from live query updates
  - Profile and optimize hot paths
  - Target: <50ms render time for category list (20 categories)

### Documentation (MEDIUM Priority)

- [ ] **DOC-001**: Add JSDoc to all public service methods
  - Document parameters, return types, errors thrown
  - Add usage examples for complex operations
  - Document sync behavior and offline handling
  - Target: 100% JSDoc coverage for public APIs

- [ ] **DOC-002**: Create migration guide from Redux to live queries
  - Step-by-step migration instructions
  - Before/after code examples
  - Performance comparison
  - Migration checklist

### Cleanup (MEDIUM Priority)

- [ ] **MAINT-004**: Remove deprecated catalogSlice.ts
  - Verify zero usages across codebase
  - Create deprecation notice in CHANGELOG
  - Delete file and update imports
  - Remove Redux devtools integration for catalog

## v2 Requirements

Deferred to future releases. Tracked but not in current roadmap.

### Future Performance Enhancements

- **PERF-004**: Implement full-text search with Dexie FTS plugin
- **PERF-005**: Add GraphQL API layer for complex queries
- **PERF-006**: Implement service worker caching for offline PWA support

### Future Architecture Improvements

- **ARCH-006**: Real-time collaboration with Supabase subscriptions
- **ARCH-007**: Implement CQRS pattern for read/write separation
- **ARCH-008**: Add event sourcing for audit trail

### Future Business Features

- **BIZ-001**: AI-powered service recommendations
- **BIZ-002**: Service template library for quick setup
- **BIZ-003**: Dynamic pricing based on demand

## Out of Scope

Explicitly excluded from this improvement project.

| Feature | Reason |
|---------|--------|
| GraphQL API | REST + live queries sufficient for v1, adds unnecessary complexity |
| Real-time collaboration | Not required for single-salon operations, defer to multi-salon features |
| AI recommendations | Business logic feature, not technical infrastructure improvement |
| Service templates | Product feature, should be separate project with UX research |
| Storage rewrite | Tri-path architecture validated and working, no ROI on rewrite |
| Mobile-specific optimizations | Web-first approach, mobile optimization is Phase 2+ |
| Internationalization | English-only for v1, i18n is separate cross-cutting project |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

### Phase 1: Critical Architecture (Week 1-2)

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-001 | Phase 1 | Pending |
| ARCH-002 | Phase 1 | Pending |
| ARCH-003 | Phase 1 | Pending |
| ARCH-004 | Phase 1 | Pending |
| ARCH-005 | Phase 1 | Pending |

### Phase 2: Code Quality & Testing (Week 3-4)

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-001 | Phase 2 | Pending |
| TEST-002 | Phase 2 | Pending |
| TEST-003 | Phase 2 | Pending |
| SEC-001 | Phase 2 | Pending |
| SEC-002 | Phase 2 | Pending |
| MAINT-001 | Phase 2 | Pending |
| MAINT-002 | Phase 2 | Pending |
| MAINT-003 | Phase 2 | Pending |

### Phase 3: Performance & Polish (Week 5-6)

| Requirement | Phase | Status |
|-------------|-------|--------|
| TYPE-001 | Phase 3 | Pending |
| TYPE-002 | Phase 3 | Pending |
| TYPE-003 | Phase 3 | Pending |
| PERF-001 | Phase 3 | Pending |
| PERF-002 | Phase 3 | Pending |
| PERF-003 | Phase 3 | Pending |
| DOC-001 | Phase 3 | Pending |
| DOC-002 | Phase 3 | Pending |
| MAINT-004 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---

*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after comprehensive review analysis*
