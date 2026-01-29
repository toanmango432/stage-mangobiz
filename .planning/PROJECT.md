# Catalog Module Improvements

## What This Is

A systematic improvement project to address 23 identified issues in the Mango POS Catalog module, elevating it from production-ready (7.7/10) to production-optimized (9+/10). This project focuses on implementing missing critical features (sync worker, caching), improving code quality (test coverage, refactoring), and eliminating technical debt while maintaining the module's 100% feature completeness.

## Core Value

**Scalability and maintainability must not be compromised by rapid feature delivery.** The catalog module serves as the foundation for Book, Checkout, and Front Desk modules. Its reliability, performance, and code quality directly impact the entire POS system's success.

## Requirements

### Validated

<!-- Already shipped and confirmed valuable from Phase 6 completion -->

- ✓ Complete feature set - 88/88 user stories implemented
- ✓ Strong type safety - Comprehensive TypeScript with adapter pattern
- ✓ Excellent UI quality - Accessible components, proper validation, loading states
- ✓ Multi-tenant security - Proper storeId filtering and RLS policies
- ✓ Local-first architecture - IndexedDB-first with background sync design
- ✓ Consistent patterns - Uniform CRUD operations across all entities
- ✓ Partial test coverage - Adapters and tables have 85-95% coverage

### Active

<!-- Current scope - addressing the 23 issues from comprehensive review -->

#### CRITICAL Priority (Must fix before scale)
- [ ] **ARCH-001**: Implement background sync worker with vector clock conflict resolution
- [ ] **ARCH-002**: Implement caching layer with request deduplication
- [ ] **ARCH-003**: Add transaction support for batch operations
- [ ] **ARCH-004**: Implement tombstone cleanup automation (30-day expiry)
- [ ] **MAINT-001**: Refactor catalogDataService.ts (2052 lines → <600 lines)
- [ ] **MAINT-002**: Refactor useCatalog.ts hook (1283 lines → <400 lines)

#### HIGH Priority (Should fix soon)
- [ ] **ARCH-005**: Standardize error handling (throws vs undefined vs null)
- [ ] **TEST-001**: Add test coverage for 4 untested table modules
- [ ] **TEST-002**: Add integration tests for sync flow
- [ ] **TEST-003**: Add E2E tests for catalog-checkout flow
- [ ] **SEC-001**: Add storeId validation to all getById methods
- [ ] **MAINT-003**: Extract CRUD boilerplate into base repository class
- [ ] **TYPE-001**: Rename ServiceStatus to CatalogServiceStatus (collision fix)

#### MEDIUM Priority (Technical debt)
- [ ] **TYPE-002**: Add ProductRow type definition to Supabase types
- [ ] **TYPE-003**: Add deposit validation (0-100%, amount < price)
- [ ] **PERF-001**: Optimize N+1 queries in getWithRelationships
- [ ] **PERF-002**: Add compound indexes for common filter patterns
- [ ] **PERF-003**: Reduce live query overhead with memoization
- [ ] **DOC-001**: Add JSDoc comments to all public service methods
- [ ] **DOC-002**: Create migration guide from Redux to live queries
- [ ] **MAINT-004**: Remove deprecated catalogSlice.ts after migration verification
- [ ] **SEC-002**: Add rate limiting for search operations

### Out of Scope

<!-- Explicitly excluded to prevent scope creep -->

- **GraphQL API layer** — REST + live queries sufficient for v1, defer to v2
- **Real-time collaboration** — Not required for single-salon operations, defer to multi-salon features
- **AI-powered recommendations** — Business logic feature, not technical improvement
- **Service template library** — Product feature, not architecture improvement
- **Full rewrite to different storage** — Tri-path architecture is validated and working

## Context

### Current State (as of Phase 6 completion - Jan 22, 2026)

**Module Status:**
- **Feature complete**: 88/88 user stories (100%)
- **Overall rating**: 7.7/10 (Production-ready)
- **Test coverage**: 78% (partial - adapters/tables covered, integration tests missing)
- **Architecture**: Tri-path storage (IndexedDB → SQLite → Supabase) with offline-first design
- **Technical debt**: 23 identified issues, ~20-30 days estimated effort

**Key Achievements:**
- Strong TypeScript type system with adapters
- Multi-tenant security with RLS
- Comprehensive UI with accessibility
- Consistent CRUD patterns across 10 entities
- Vector clock infrastructure (not yet connected to sync worker)

**Pain Points:**
- No actual sync implementation despite vector clock foundation
- No caching layer causing performance issues
- Large files (2052 and 1283 lines) hampering maintainability
- Inconsistent error handling across service layers
- Missing integration and E2E tests
- Code duplication in CRUD boilerplate

### Why This Matters

The catalog module is the **data foundation** for the entire POS system:
- **Book module** depends on service catalog for appointment scheduling
- **Checkout module** depends on service/product pricing and variants
- **Front Desk** depends on catalog for quick service selection
- **Online Booking** depends on catalog for public-facing service listings

Quality issues here cascade to all dependent modules. Performance problems compound across the system. Technical debt grows exponentially if not addressed now.

### Previous Work Referenced

- **CATALOG_MODULE_REVIEW_2026-01-22.md**: Comprehensive 23-issue analysis with 7-week action plan
- **.planning/codebase/**: 6 documentation files (3,527 lines) covering architecture, patterns, integration, testing
- **Phase 1-6 implementation**: Full feature set delivered via Ralph autonomous workflow

## Constraints

- **Tech stack**: Must maintain Dexie + IndexedDB + Supabase architecture (no rewrites)
- **Timeline**: 4-6 weeks total effort (phased delivery, not waterfall)
- **Backward compatibility**: Cannot break existing Book/Checkout/Front Desk integrations
- **Feature freeze**: No new features, only improvements and fixes
- **Test coverage target**: 90% minimum (currently 78%)
- **Performance**: <100ms for common queries, <500ms for complex operations
- **Bundle size**: Refactoring must not increase bundle size
- **Zero downtime**: All changes must be backward-compatible during migration

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use existing 7-week plan from review | Plan is already validated, comprehensive, and priority-ordered | ✓ Good - Saves planning time, leverages prior analysis |
| Address all 23 issues (not just CRITICAL) | Technical debt compounds; better to fix systematically now | — Pending - Will validate after Phase 1 |
| Keep tri-path storage architecture | IndexedDB/SQLite/Supabase validated in production, no rewrite needed | ✓ Good - Avoids risky architectural changes |
| Migrate from Redux to live queries | Simpler state management, better DX, less boilerplate | — Pending - Will validate during Phase 2 |
| Target 90% test coverage | Industry standard for critical infrastructure code | — Pending - Will assess feasibility in Phase 2 |
| Implement sync worker as separate service | Decouples sync logic from CRUD operations, easier to test | — Pending - Design in Phase 1 |

---

*Last updated: 2026-01-22 after comprehensive review completion and codebase mapping*
