# wa-sqlite Evaluation for Web Platform

> Evaluation of wa-sqlite for browser-based SQLite in Mango POS

---

## Executive Summary

**Recommendation: Stick with Dexie.js for Web Platform**

While wa-sqlite offers compelling benefits for specific use cases, the combination of implementation complexity, browser limitations, and our existing Dexie.js investment makes it the wrong choice for Mango POS web deployment. The WASM overhead, multi-tab coordination challenges, and potential Safari issues outweigh the benefits for our use case.

---

## Table of Contents

1. [wa-sqlite Overview](#wa-sqlite-overview)
2. [Technical Requirements](#technical-requirements)
3. [Browser Support Matrix](#browser-support-matrix)
4. [Performance Analysis](#performance-analysis)
5. [Implementation Complexity](#implementation-complexity)
6. [Comparison: wa-sqlite vs Dexie.js](#comparison-wa-sqlite-vs-dexiejs)
7. [Real-World Case Study: Notion](#real-world-case-study-notion)
8. [Recommendation](#recommendation)
9. [If We Were to Implement wa-sqlite](#if-we-were-to-implement-wa-sqlite)
10. [References](#references)

---

## wa-sqlite Overview

[wa-sqlite](https://github.com/rhashimoto/wa-sqlite) is a WebAssembly build of SQLite that enables running SQLite databases directly in web browsers. The project provides multiple Virtual File System (VFS) implementations for different storage backends.

### Current Version

- **Latest Release**: v1.0.9 (September 2025)
- **License**: MIT
- **Maturity**: Production-ready, used by Notion and others

### Available VFS Options

| VFS Implementation | Storage Backend | Best For |
|-------------------|-----------------|----------|
| **OPFSCoopSyncVFS** | OPFS (Origin Private File System) | Large databases, production use |
| **IDBBatchAtomicVFS** | IndexedDB | Broader browser support, smaller DBs |
| **AccessHandlePoolVFS** | OPFS | Single-tab applications |
| **MemoryVFS** | In-memory only | Testing, ephemeral data |

---

## Technical Requirements

### COOP/COEP Headers

Different VFS implementations have varying header requirements:

| VFS | COOP Header Required | COEP Header Required | Notes |
|-----|---------------------|---------------------|-------|
| **Official sqlite-wasm opfs** | Yes | Yes | SharedArrayBuffer dependency |
| **wa-sqlite OPFSCoopSyncVFS** | No | No | Uses alternative sync mechanism |
| **wa-sqlite IDBBatchAtomicVFS** | No | No | Pure IndexedDB, no SharedArrayBuffer |

**COOP/COEP Impact**: When required, these headers:
- Block third-party iframes without `Cross-Origin-Embedder-Policy: require-corp`
- May break analytics, chat widgets, and payment embeds
- Require careful Content Security Policy configuration

### SharedArrayBuffer Requirements

SharedArrayBuffer is only needed for:
- Official SQLite WASM's OPFS VFS
- Some advanced multi-worker configurations

wa-sqlite's recommended OPFSCoopSyncVFS **does not require SharedArrayBuffer**.

### OPFS (Origin Private File System) Requirements

OPFS provides a sandboxed filesystem for the browser. Key constraints:

1. **Worker-only synchronous access**: `createSyncAccessHandle()` only available in Web Workers
2. **Single writer at a time**: One handle can write; others must wait
3. **Not visible to users**: Data stored separately from user-accessible filesystem
4. **Origin-bound**: Data tied to the specific origin (domain + protocol + port)

---

## Browser Support Matrix

### OPFS Support

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome | 108+ | Full |
| Chrome Android | 109+ | Full |
| Edge | 108+ | Full |
| Safari | 16.4+ | Partial (single-tab sync access) |
| Safari iOS | 16.4+ | Partial (single-tab sync access) |
| Firefox | 111+ | Full |

### VFS-Specific Browser Support

| VFS | Chrome | Safari | Firefox | Notes |
|-----|--------|--------|---------|-------|
| OPFSCoopSyncVFS | 108+ | 16.4+ | 111+ | Recommended for production |
| IDBBatchAtomicVFS | 69+ | 15.4+ | 96+ | Broadest compatibility |
| AccessHandlePoolVFS | 108+ | 16.4+ | 111+ | Single-tab only |

### Safari Limitations

Safari has several known limitations:
- Single-tab synchronous access only (no multi-tab coordination)
- No SharedArrayBuffer without WebKit flag
- OPFS available but more restricted than Chromium

---

## Performance Analysis

### Benchmarks Overview

| Metric | wa-sqlite (OPFS) | wa-sqlite (IDB) | Native IndexedDB |
|--------|------------------|-----------------|------------------|
| **Small Queries** (<1KB) | Similar | 10-50ms overhead | 1-5ms baseline |
| **Large Datasets** (100MB+) | Excellent | Degrades | Adequate |
| **Write Throughput** | High | Good | Good |
| **Complex JOINs** | Excellent | Excellent | N/A |

### Key Performance Findings

1. **WASM Overhead**: Initial load adds 1-3MB of WASM binary download
2. **Query Speed**: SQLite queries are fast; the overhead is in VFS I/O
3. **IDBBatchAtomicVFS**: Works well for <100MB databases, degrades beyond
4. **OPFSCoopSyncVFS**: Maintains performance even for 1GB+ databases

### Notion's Performance Results

Notion's implementation showed:
- **20% faster** page navigation times overall
- **28% faster** for users in Australia
- **31% faster** for users in China
- **33% faster** for users in India

However, Notion noted:
- Initial page loads were **slower** due to WASM download
- Older/slower devices showed **less benefit** from disk caching
- They implemented "racing" SQLite vs API to handle slow devices

---

## Implementation Complexity

### Required Components

1. **Web Worker Setup**: SQLite must run in a dedicated Web Worker
2. **Message Passing**: Main thread ↔ Worker communication via postMessage
3. **Query Serialization**: SQL queries and results must be serialized
4. **Tab Coordination**: SharedWorker or Web Locks for multi-tab support
5. **Fallback Logic**: Graceful degradation when OPFS unavailable

### Multi-Tab Challenge

The biggest implementation challenge is multi-tab coordination:

```
Tab 1 ──→ SharedWorker ──→ "Active" Tab with SQLite
Tab 2 ──→     ↓         ──→ Queued/Waiting
Tab 3 ──→     ↓         ──→ Queued/Waiting
```

- Only one tab can write to SQLite at a time
- SharedWorker coordinates which tab is "active"
- Web Locks detect tab closure for failover
- Significant complexity vs. IndexedDB (which handles this natively)

### Code Complexity Estimate

| Component | Lines of Code (Est.) | Complexity |
|-----------|---------------------|------------|
| Worker Setup | 100-200 | Low |
| Query Interface | 200-400 | Medium |
| Tab Coordination | 300-500 | High |
| Migration Logic | 200-300 | Medium |
| Fallback/Error Handling | 200-300 | Medium |
| **Total** | **1000-1700** | **High** |

Compare to current Dexie.js setup: ~500 lines, all synchronous-feeling async.

---

## Comparison: wa-sqlite vs Dexie.js

### Feature Comparison

| Feature | wa-sqlite | Dexie.js |
|---------|-----------|----------|
| **SQL Support** | Full SQLite SQL | NoSQL (IndexedDB queries) |
| **JOINs** | Native SQL JOINs | Manual in JS |
| **Aggregations** | COUNT, SUM, GROUP BY | Manual in JS |
| **Multi-tab** | Complex coordination | Automatic |
| **WASM Size** | 1-3MB additional | None |
| **API Complexity** | Worker + message passing | Direct async/await |
| **Browser Support** | Modern only | Broader |
| **Debugging** | SQLite tools | Browser DevTools |

### When to Choose Each

**Choose wa-sqlite when**:
- Complex SQL queries with JOINs are frequent
- Database exceeds 500MB+
- Single-tab or controlled multi-tab environment
- Team has SQLite expertise
- Desktop/Electron hybrid needed

**Choose Dexie.js when**:
- Simpler key-value or document queries
- Multi-tab support is critical
- Broader browser support needed
- Development velocity is priority
- Existing IndexedDB investment

### Mango POS Web Context

For Mango POS web deployment:
- **Database size**: Typically <100MB (fits Dexie well)
- **Query complexity**: Moderate (N+1 fixes help more than SQL)
- **Multi-tab**: Staff may have multiple tabs open
- **Browser support**: Need Safari support for iPads
- **Existing code**: Heavy Dexie investment in `apps/store-app/src/db/`

---

## Real-World Case Study: Notion

Notion's wa-sqlite implementation provides valuable lessons:

### What They Did

1. Used OPFS SyncAccessHandle Pool VFS (avoids COOP/COEP)
2. SharedWorker to coordinate active tab
3. Web Locks for tab closure detection
4. "Racing" SQLite vs API for slow devices

### Challenges They Faced

1. **Database corruption** from concurrent tab writes
2. **Cross-origin isolation** blocked third-party scripts
3. **Slower initial loads** from WASM download
4. **Performance regression** on older devices

### Their Solution

- Complex SharedWorker architecture
- Failover logic for tab switching
- Async WASM loading
- Parallel API/SQLite requests

### Applicability to Mango POS

Notion's use case differs from Mango POS:
- Notion: Read-heavy, complex document structure, large datasets
- Mango POS: Write-heavy (tickets, appointments), smaller datasets, real-time sync

The complexity Notion invested makes sense for their scale but may be overkill for Mango POS.

---

## Recommendation

### Decision: Stick with Dexie.js for Web Platform

**Rationale**:

1. **ROI Not Justified**: Phase 1 Dexie optimizations (N+1 fixes, compound indexes, caching) provide most of the performance benefit with far less complexity.

2. **Multi-Tab Complexity**: Mango POS staff often have multiple browser tabs open. The SharedWorker coordination layer adds significant complexity that Dexie handles automatically.

3. **Safari Limitations**: iPads are common in salons. Safari's restricted OPFS support creates risk.

4. **Development Velocity**: wa-sqlite requires Worker message passing, whereas Dexie.js provides a clean async/await API that's easier to develop and debug.

5. **Existing Investment**: We have ~500+ lines of Dexie.js integration in `apps/store-app/src/db/`. Rewriting for wa-sqlite doesn't add proportional value.

6. **WASM Bundle Size**: Adding 1-3MB to the initial bundle impacts First Contentful Paint, especially on slow connections.

### Hybrid Strategy is Optimal

Our current architecture is actually ideal:
- **Electron (Desktop)**: SQLite via better-sqlite3 (Phase 2 complete)
- **Web/Capacitor**: Dexie.js (IndexedDB)

This provides:
- SQLite benefits where they matter most (Electron with local-first)
- Simplicity where multi-tab is needed (Web)
- Native SQLite for mobile (Capacitor SQLite, evaluated separately)

---

## If We Were to Implement wa-sqlite

### Implementation Steps (Not Recommended)

If circumstances change, here's the implementation path:

1. **Add wa-sqlite dependency**
   ```bash
   pnpm add wa-sqlite
   ```

2. **Create Web Worker for SQLite**
   ```typescript
   // src/workers/sqlite.worker.ts
   import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite.mjs';
   import { OPFSCoopSyncVFS } from 'wa-sqlite/src/examples/OPFSCoopSyncVFS.js';
   ```

3. **Implement Tab Coordinator**
   ```typescript
   // src/workers/sqlite-coordinator.shared-worker.ts
   // SharedWorker to manage which tab has write access
   ```

4. **Create Query Interface**
   ```typescript
   // src/services/sqliteWebService.ts
   // Async wrapper around Worker postMessage
   ```

5. **Add Fallback Logic**
   ```typescript
   // Fall back to Dexie if OPFS unavailable
   const db = supportsOPFS() ? await initWaSqlite() : await initDexie();
   ```

6. **Migration from Dexie**
   ```typescript
   // One-time migration from IndexedDB to OPFS
   ```

### Estimated Effort

| Task | Days |
|------|------|
| Worker setup + VFS | 2 |
| Tab coordination | 3-5 |
| Query interface | 2 |
| Dexie API compatibility layer | 3-4 |
| Migration utility | 2 |
| Testing + edge cases | 3-5 |
| **Total** | **15-20 days** |

Compare to value delivered: Marginal performance improvement over optimized Dexie.

---

## References

- [wa-sqlite GitHub Repository](https://github.com/rhashimoto/wa-sqlite)
- [PowerSync: SQLite Persistence on the Web (November 2025)](https://www.powersync.com/blog/sqlite-persistence-on-the-web)
- [Notion: How We Sped Up Notion in the Browser with WASM SQLite](https://www.notion.com/blog/how-we-sped-up-notion-in-the-browser-with-wasm-sqlite)
- [Chrome Developers: SQLite Wasm in the Browser](https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system)
- [MDN: Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)
- [Can I Use: Origin Private File System](https://caniuse.com/wf-origin-private-file-system)
- [SQLite WASM Persistence Options](https://sqlite.org/wasm/doc/trunk/persistence.md)

---

## Document History

| Date | Author | Notes |
|------|--------|-------|
| 2026-01-17 | Ralph Agent | Initial evaluation for US-017 |
