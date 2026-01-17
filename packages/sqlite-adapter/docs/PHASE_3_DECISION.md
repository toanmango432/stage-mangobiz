# Phase 3 Decision: SQLite Migration Strategy

> Final recommendation for Mango POS data layer architecture

---

## Executive Summary

**Recommendation: Hybrid Approach**

After completing Phase 1 (Dexie optimization), Phase 2 (Electron SQLite), and Phase 3 research (Web/Mobile evaluation), the **Hybrid** strategy is recommended:

| Platform | Database | Rationale |
|----------|----------|-----------|
| **Electron (Desktop)** | SQLite (better-sqlite3) | Full SQL power, local-first, implemented in Phase 2 |
| **iOS (Capacitor)** | SQLite (@capacitor-community/sqlite) | Data persistence critical, 2-10x faster, mature plugin |
| **Android (Capacitor)** | SQLite (@capacitor-community/sqlite) | Same benefits as iOS, unified mobile codebase |
| **Web (Browser)** | Dexie.js (IndexedDB) | Multi-tab support critical, Phase 1 optimizations sufficient |

This hybrid approach delivers SQLite benefits where they matter most (data persistence on mobile, performance on desktop) while avoiding unnecessary complexity on web where Dexie.js is already optimized.

---

## Table of Contents

1. [Phase 1 Summary: Dexie Optimizations](#phase-1-summary-dexie-optimizations)
2. [Phase 2 Summary: Electron SQLite](#phase-2-summary-electron-sqlite)
3. [Phase 3 Research: Web Platform](#phase-3-research-web-platform)
4. [Phase 3 Research: Mobile Platform](#phase-3-research-mobile-platform)
5. [Decision Matrix](#decision-matrix)
6. [Final Recommendation](#final-recommendation)
7. [Follow-Up Implementation Plan](#follow-up-implementation-plan)
8. [Maintenance Plan](#maintenance-plan)

---

## Phase 1 Summary: Dexie Optimizations

**Status: Complete (US-001 to US-008)**

Phase 1 focused on optimizing the existing Dexie.js/IndexedDB implementation through architectural improvements.

### Completed Work

| User Story | Optimization | Impact |
|------------|--------------|--------|
| US-001 | Performance benchmarking utility | Enables measurement and validation |
| US-002 | Database abstraction interface | Platform-agnostic design |
| US-003 | Client filtering with Dexie indexes | Faster client search |
| US-004 | Compound indexes for tickets | Query optimization |
| US-005 | Staff ticket counts helper | O(1) lookup via Map |
| US-006 | Turn queue N+1 fix | 20+ queries → 2 queries |
| US-007 | Turn queue result caching | 30s TTL, instant cache hits |
| US-008 | Performance metrics N+1 fix | N queries → 1 batch query |

### Performance Improvements

| Area | Before | After | Improvement |
|------|--------|-------|-------------|
| Turn queue calculation | 20+ DB queries per staff count | 2 DB queries total | ~10x reduction |
| Client filtering | Full array load then JS filter | Dexie Collection.filter() | Memory efficient |
| Performance metrics | N queries for N clients | 1 batch query | N → 1 |
| Repeated turn queue requests | Full recalculation | Cache hit (0ms) | Instant |

### Key Learnings

1. **N+1 patterns were the primary bottleneck** - Fixing these provided the most significant improvements
2. **Compound indexes help but N+1 fixes matter more** - Index-only queries are fast, but query count reduction is faster
3. **Caching is effective for turn queue** - 30-second TTL provides good balance of freshness vs performance
4. **Dexie Collection.filter() is efficient** - Processes during cursor iteration, not full materialization

---

## Phase 2 Summary: Electron SQLite

**Status: Complete (US-009 to US-016)**

Phase 2 implemented full SQLite support for the Electron (desktop) platform.

### Completed Work

| User Story | Component | Description |
|------------|-----------|-------------|
| US-009 | Electron adapter | better-sqlite3 integration with SQLiteAdapter interface |
| US-010 | Migration runner | Schema versioning with up/down migrations |
| US-011 | Initial schema (v001) | appointments, tickets, clients tables |
| US-012 | Staff/services schema (v002) | staff, services tables |
| US-013 | Data migration utility | migrateFromDexie() with batch inserts |
| US-014 | Feature flag | shouldUseSQLite(), getBackendType() |
| US-015 | Client service | ClientSQLiteService with SQL WHERE |
| US-016 | Ticket service | TicketSQLiteService with SQL aggregations |

### SQLite Adapter Architecture

```
packages/sqlite-adapter/
├── src/
│   ├── adapters/
│   │   └── electron.ts          # better-sqlite3 implementation
│   ├── migrations/
│   │   ├── index.ts             # runMigrations(), rollback
│   │   ├── types.ts             # Migration interface
│   │   ├── v001_initial_schema.ts
│   │   ├── v002_staff_services.ts
│   │   └── dataMigration.ts     # migrateFromDexie()
│   ├── services/
│   │   ├── clientService.ts     # ClientSQLiteService
│   │   └── ticketService.ts     # TicketSQLiteService
│   └── interfaces/
│       └── DatabaseAdapter.ts   # Platform-agnostic interface
```

### Key Features

- **Full SQLiteAdapter interface**: exec, run, get, all, transaction, close
- **Migration system**: Version tracking, up/down support, transaction safety
- **SQL services**: Parameterized queries, SQL aggregations, efficient filtering
- **Feature flag**: Opt-in via VITE_USE_SQLITE environment variable

---

## Phase 3 Research: Web Platform

**Source: WA_SQLITE_EVALUATION.md (US-017)**

### wa-sqlite Assessment

| Criterion | Assessment | Notes |
|-----------|------------|-------|
| **Performance** | Good | 20-33% faster per Notion benchmarks |
| **WASM overhead** | Significant | 1-3MB additional bundle |
| **Multi-tab support** | Complex | Requires SharedWorker + Web Locks |
| **Safari support** | Limited | Single-tab sync access only |
| **Implementation effort** | High | 15-20 dev days estimated |
| **Browser support** | Modern only | Chrome 108+, Firefox 111+, Safari 16.4+ |

### Web Platform Decision

**Recommendation: Stick with Dexie.js**

Rationale:
1. **Phase 1 optimizations provide most benefit** - N+1 fixes and caching address the real bottlenecks
2. **Multi-tab is critical for Mango POS** - Staff often have multiple tabs open
3. **Safari limitations create risk** - iPads are common in salons
4. **WASM bundle impacts load time** - 1-3MB added to initial download
5. **Development velocity matters** - Dexie's async/await API is simpler

---

## Phase 3 Research: Mobile Platform

**Source: CAPACITOR_SQLITE_EVALUATION.md (US-018)**

### @capacitor-community/sqlite Assessment

| Criterion | Assessment | Notes |
|-----------|------------|-------|
| **Performance** | Excellent | 2-10x faster than IndexedDB |
| **Data persistence** | Critical advantage | Native SQLite won't be cleared by OS |
| **Plugin maturity** | High | 45+ contributors, 806+ commits, active maintenance |
| **Encryption** | Full support | SQLCipher on iOS/Android |
| **API coverage** | Comprehensive | 50+ methods, transactions, sync support |
| **Implementation effort** | Moderate | 7-9 dev days estimated |
| **Platform differences** | Minor | iOS/Android mostly unified |

### Mobile Platform Decision

**Recommendation: Implement Capacitor SQLite**

Rationale:
1. **Data persistence is critical** - IndexedDB may be cleared by iOS when low on storage
2. **Performance gains significant** - 2-10x faster improves staff experience
3. **Our existing services work** - ClientSQLiteService, TicketSQLiteService need minimal changes
4. **Mature, maintained plugin** - Strong community support, quick bug fixes
5. **Unified data layer** - Same SQLite approach as Electron

---

## Decision Matrix

### Effort vs Benefit Analysis

| Platform | Implementation Effort | Performance Benefit | Data Persistence | Recommendation |
|----------|----------------------|---------------------|------------------|----------------|
| **Electron** | ✅ Complete | High (native SQLite) | High | **Use SQLite** |
| **iOS** | Medium (7-9 days) | High (2-10x faster) | Critical (IndexedDB unreliable) | **Use SQLite** |
| **Android** | Medium (7-9 days) | High (2-10x faster) | High (native storage) | **Use SQLite** |
| **Web** | High (15-20 days) | Low (marginal after Phase 1) | N/A (browser storage) | **Use Dexie** |

### Risk Assessment

| Platform | Primary Risk | Mitigation |
|----------|--------------|------------|
| Electron | Low | Implementation complete, tested |
| iOS | Medium (plugin bugs) | Maintain Dexie fallback, pin versions |
| Android | Medium (plugin bugs) | Maintain Dexie fallback, pin versions |
| Web | Low (no change) | Continue with optimized Dexie |

---

## Final Recommendation

### Architecture: Hybrid (SQLite + Dexie)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA SERVICE LAYER                            │
│         (apps/store-app/src/services/dataService.ts)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Platform Detection: getPlatform() / shouldUseSQLite()                 │
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   Electron   │    │ iOS/Android  │    │     Web      │              │
│  │              │    │  (Capacitor) │    │   (Browser)  │              │
│  │ better-sqlite│    │ @capacitor-  │    │   Dexie.js   │              │
│  │      3       │    │ community/   │    │  (IndexedDB) │              │
│  │              │    │   sqlite     │    │              │              │
│  │  ✅ Complete │    │  🔜 Next     │    │  ✅ Optimized│              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why Hybrid is Optimal

1. **Right tool for each platform**
   - Electron: SQLite is native and fast
   - Mobile: SQLite provides persistence guarantee
   - Web: Dexie handles multi-tab automatically

2. **Incremental implementation**
   - Electron: Already complete
   - Mobile: Clear path with existing adapter interface
   - Web: No work needed, already optimized

3. **Maintenance simplicity**
   - SQLite services shared between Electron and Capacitor
   - Dexie code remains stable on web
   - Feature flags control routing

4. **Risk mitigation**
   - Dexie fallback always available
   - Platform-specific issues contained
   - Gradual rollout possible

---

## Follow-Up Implementation Plan

### Priority Order

| Priority | Platform | Stories | Effort | Benefit |
|----------|----------|---------|--------|---------|
| 1 | Electron | ✅ Complete | 0 | Production ready |
| 2 | iOS/Android | 6 stories (see below) | 7-9 days | Data persistence + performance |
| 3 | Web | None required | 0 | Phase 1 optimizations sufficient |

### Mobile Implementation Stories (Future PRD)

If proceeding with Capacitor SQLite implementation:

**Phase C1: Adapter & Services (2-3 days)**
- US-C01: Implement Capacitor SQLite Adapter
- US-C02: Integrate SQLite Services with Capacitor

**Phase C2: Migration & Feature Flag (2 days)**
- US-C03: Create IndexedDB to SQLite Migration Flow
- US-C04: Update Feature Flag for Capacitor

**Phase C3: Testing & Rollout (3-4 days)**
- US-C05: End-to-End Testing on Devices
- US-C06: Staged Rollout

### Detailed Story: US-C01 (Example)

```
Title: Implement Capacitor SQLite Adapter

Acceptance Criteria:
- createCapacitorAdapter(config) returns SQLiteAdapter
- Implements exec, run, get, all, transaction, close
- Handles iOS vs Android differences
- Tests pass on iOS Simulator and Android Emulator
- No TypeScript errors

Files:
- packages/sqlite-adapter/src/adapters/capacitor.ts
- packages/sqlite-adapter/src/adapters/index.ts
```

---

## Maintenance Plan

### Hybrid Architecture Maintenance

| Component | Update Frequency | Responsibility |
|-----------|------------------|----------------|
| better-sqlite3 | As needed (stable) | Check for security updates |
| @capacitor-community/sqlite | Monthly check | Monitor GitHub releases |
| Dexie.js | As needed (stable) | Check for major versions |
| SQLite services | With schema changes | Update migrations |

### Monitoring Recommendations

1. **Performance metrics**: Continue using measureAsync() in critical paths
2. **Error tracking**: Log SQLite errors separately from general errors
3. **Migration success rate**: Track migrateFromDexie() completion rates
4. **Platform-specific issues**: Monitor crash reports by platform

### Fallback Strategy

```typescript
// Recommended fallback pattern
async function initializeDatabase(): Promise<Database> {
  const platform = getPlatform();

  try {
    if (platform === 'electron' || platform === 'capacitor') {
      return await initSQLite();
    }
  } catch (error) {
    console.error('[DataService] SQLite init failed, falling back to Dexie:', error);
    // Report to error tracking
  }

  // Always fall back to Dexie on failure
  return await initDexie();
}
```

---

## Conclusion

The SQLite Migration project has achieved its primary goals:

1. **Phase 1** ✅ - Dexie optimizations provide significant performance improvements through N+1 fixes, compound indexes, and caching
2. **Phase 2** ✅ - Electron SQLite implementation complete with full adapter, migrations, and services
3. **Phase 3** ✅ - Research validates hybrid approach: SQLite for Electron/Capacitor, Dexie for Web

The **Hybrid** recommendation balances:
- **Performance**: SQLite where it matters (desktop, mobile)
- **Reliability**: Native storage on mobile prevents data loss
- **Simplicity**: Dexie on web avoids multi-tab complexity
- **Maintenance**: Shared SQLite services reduce code duplication

### Next Steps

1. **Immediate**: Deploy Phase 1+2 to Electron builds
2. **Short-term**: Create Capacitor SQLite PRD and implement (7-9 days)
3. **Long-term**: Monitor performance metrics and adjust as needed

---

## Document History

| Date | Author | Notes |
|------|--------|-------|
| 2026-01-17 | Ralph Agent | Initial decision document for US-019 |
