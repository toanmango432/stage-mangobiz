# Mango POS Scalability Analysis: 100K+ Salon Architecture

**Date:** December 31, 2024
**Scope:** Architecture review for scaling to 100,000+ salons
**Current State:** Single Supabase project with direct client access

---

## Executive Summary

The current Mango POS architecture has **fundamental scalability limitations** that will require significant re-architecture to support 100K+ salons. While the local-first design provides excellent individual device performance, the centralized Supabase infrastructure will hit hard limits around 10K-20K concurrent stores.

| Metric | Current Capacity | Required for 100K | Gap |
|--------|------------------|-------------------|-----|
| **Concurrent Connections** | 500 (Supabase Pro) | 50,000+ | **100x** |
| **Real-time Channels** | 10,000 | 100,000+ | **10x** |
| **Database Size** | 8GB (Pro) | 500GB+ | **60x** |
| **API Requests/sec** | 1,000 | 100,000+ | **100x** |

**Overall Scalability Rating: 3/10 - CRITICAL redesign needed**

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Scalability Calculations](#2-scalability-calculations)
3. [Bottleneck Identification](#3-bottleneck-identification)
4. [Supabase Limits Analysis](#4-supabase-limits-analysis)
5. [Recommended Architecture Changes](#5-recommended-architecture-changes)
6. [Migration Path](#6-migration-path)

---

## 1. Current Architecture Analysis

### 1.1 Supabase Client Configuration

**File:** `/src/services/supabase/client.ts`

```typescript
// Current settings
const DEFAULT_TIMEOUT_MS = 10000;      // 10 seconds
const FAILURE_THRESHOLD = 3;            // Circuit breaker trips after 3 failures
const CIRCUIT_RESET_MS = 30000;         // 30 second reset

// Real-time throttling
realtime: {
  params: {
    eventsPerSecond: 10,  // Per-channel rate limit
  },
},
```

**Assessment:**
- Circuit breaker pattern: Good for resilience
- 10 events/second per channel: Will bottleneck high-traffic stores
- Single project: All 100K stores share one connection pool

### 1.2 Local-First Data Service

**File:** `/src/services/dataService.ts`

```
Client Device Flow:
1. Read from IndexedDB (instant, ~1-5ms)
2. Write to IndexedDB first (instant)
3. Queue for background sync (non-blocking)
4. Sync every 30 seconds when online
```

**Assessment:**
- Excellent device-level performance
- Reduces server load significantly
- Problem: All sync operations still hit single Supabase instance

### 1.3 Real-time Subscriptions

**File:** `/src/services/supabase/sync/supabaseSyncService.ts`

```typescript
// Creates one channel per store
this.realtimeChannel = getStoreChannel(this.storeId);
// channel name: `store-${storeId}`

// Subscribes to 6 tables per store
for (const table of ['clients', 'staff', 'services', 'appointments', 'tickets', 'transactions']) {
  this.realtimeChannel.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table,
    filter: `store_id=eq.${this.storeId}`,
  }, callback);
}
```

**Assessment:**
- 1 channel per store x 100K stores = 100K channels
- 6 table subscriptions per channel = 600K filters
- Supabase Realtime limit: ~10,000 concurrent channels

### 1.4 Multi-tenancy Model

```
Current: Row-Level Security (RLS) via store_id
- All stores in same tables
- RLS policy: WHERE store_id = auth.uid()
- No database sharding
- No tenant isolation at infrastructure level
```

---

## 2. Scalability Calculations

### 2.1 Connection Requirements

**Assumptions:**
- 100,000 salons total
- Average 3 devices per salon
- 30% concurrent usage during peak hours
- Each device maintains 1 persistent connection

```
Total devices: 100,000 x 3 = 300,000
Peak concurrent devices: 300,000 x 30% = 90,000
Connections per device: 1 (REST) + 1 (Realtime) = 2
Peak connections needed: 90,000 x 2 = 180,000 connections
```

**Supabase Connection Limits:**
| Plan | Max Connections |
|------|-----------------|
| Free | 60 |
| Pro | 500 |
| Team | 800 |
| Enterprise | Custom (typically 1,000-5,000) |

**Gap: Need 180,000 connections vs. max ~5,000 = 36x shortfall**

### 2.2 Database Size Projections

**Per-Salon Data Estimates:**

| Entity | Records/Salon | Avg Row Size | Storage/Salon |
|--------|---------------|--------------|---------------|
| Clients | 500 avg | 2 KB | 1 MB |
| Staff | 8 avg | 1 KB | 8 KB |
| Services | 30 avg | 500 B | 15 KB |
| Appointments | 10,000/year | 500 B | 5 MB |
| Tickets | 8,000/year | 1 KB | 8 MB |
| Transactions | 12,000/year | 800 B | 9.6 MB |
| **Total/Salon** | - | - | **~24 MB** |

**100K Salons Projection:**

```
Initial data: 100,000 x 24 MB = 2.4 TB
After 3 years with history: ~7.2 TB
Index overhead (30%): +2.2 TB
Total: ~9.4 TB
```

**Supabase Storage Limits:**
| Plan | Storage |
|------|---------|
| Pro | 8 GB |
| Team | 100 GB |
| Enterprise | Custom |

**Gap: Need 2.4 TB vs. 100 GB = 24x shortfall (immediately)**

### 2.3 Row Count Projections

```
Clients: 100,000 x 500 = 50,000,000 rows
Appointments: 100,000 x 10,000 = 1,000,000,000 rows
Tickets: 100,000 x 8,000 = 800,000,000 rows
Transactions: 100,000 x 12,000 = 1,200,000,000 rows

Total: ~3 billion rows
```

**PostgreSQL Limits:**
- Table size: Unlimited (practical limit ~32 TB)
- Row count: Billions OK, but query performance degrades

**RLS Performance Impact:**
- Every query adds `WHERE store_id = ?`
- Without proper indexing, full table scans on 3B rows
- Estimated query time: 10-100x slower at scale

### 2.4 Real-time Channel Calculations

```
Stores: 100,000
Channels per store: 1
Peak concurrent channels: 100,000 x 30% = 30,000

Events per store per hour (peak):
- Appointments: 50 changes
- Tickets: 100 changes
- Transactions: 30 changes
- Staff status: 20 changes
Total: 200 events/store/hour = 3.3 events/minute

Total events per minute: 30,000 x 3.3 = 100,000 events/minute
Events per second: 1,667 events/second
```

**Supabase Realtime Limits:**
- Concurrent connections: ~10,000
- Events per second: ~10,000 (cluster dependent)

**Gap: 30,000 channels needed vs. 10,000 limit = 3x shortfall**

### 2.5 API Request Volume

**Per-Store Request Pattern:**
```
Background sync: 1 request/30 sec = 2/min
User interactions: 10 requests/min (avg)
Total per active store: 12 requests/min
```

**100K Stores Calculation:**
```
Active stores (30%): 30,000
Requests per minute: 30,000 x 12 = 360,000
Requests per second: 6,000 RPS
```

**Supabase API Limits:**
| Plan | Requests/Month | Requests/Sec |
|------|----------------|--------------|
| Pro | 3.5M | ~1.3 RPS |
| Team | 15M | ~5.8 RPS |
| Enterprise | Custom | ~100+ RPS |

**Gap: Need 6,000 RPS vs. ~100 RPS = 60x shortfall**

---

## 3. Bottleneck Identification

### 3.1 Critical Bottlenecks (Severity: CRITICAL)

| # | Bottleneck | Impact | Severity |
|---|------------|--------|----------|
| 1 | **Single Supabase Project** | All traffic funneled through one instance | CRITICAL |
| 2 | **Connection Pool Exhaustion** | 500 max connections for 180K needed | CRITICAL |
| 3 | **Database Size** | 2.4TB needed vs 100GB max | CRITICAL |
| 4 | **Realtime Channel Limits** | 30K channels vs 10K limit | CRITICAL |

### 3.2 High Severity Bottlenecks

| # | Bottleneck | Impact | Severity |
|---|------------|--------|----------|
| 5 | **RLS Query Performance** | O(n) scans on billion-row tables | HIGH |
| 6 | **API Rate Limiting** | 6,000 RPS vs ~100 RPS limit | HIGH |
| 7 | **No Read Replicas** | All reads hit primary database | HIGH |
| 8 | **Single Region** | High latency for distant users | HIGH |

### 3.3 Medium Severity Bottlenecks

| # | Bottleneck | Impact | Severity |
|---|------------|--------|----------|
| 9 | **No Database Sharding** | Cannot distribute load | MEDIUM |
| 10 | **Sync Queue Contention** | Background sync storms | MEDIUM |
| 11 | **Index Bloat** | Query performance degradation | MEDIUM |
| 12 | **Circuit Breaker Cascade** | 3 failures trips all devices | MEDIUM |

### 3.4 Low Severity Issues

| # | Issue | Impact | Severity |
|---|-------|--------|----------|
| 13 | **eventsPerSecond: 10** | High-volume stores throttled | LOW |
| 14 | **30-second sync interval** | Could cause sync storms | LOW |
| 15 | **No request batching** | Inefficient network usage | LOW |

---

## 4. Supabase Limits Analysis

### 4.1 Supabase Pro Plan Limits (Current)

| Resource | Limit | Required for 100K | Status |
|----------|-------|-------------------|--------|
| Database size | 8 GB | 2.4 TB | BLOCKED |
| Concurrent connections | 500 | 180,000 | BLOCKED |
| Bandwidth | 250 GB/month | 10+ TB/month | BLOCKED |
| Real-time messages | 2M/month | 100M+/month | BLOCKED |
| Storage | 100 GB | 500 GB+ | BLOCKED |
| Edge functions | 500K/month | 10M+/month | BLOCKED |

### 4.2 Supabase Enterprise Limits (Estimated)

| Resource | Typical Enterprise | Required | Status |
|----------|-------------------|----------|--------|
| Database size | 500 GB - 2 TB | 2.4 TB | RISKY |
| Connections | 2,000 - 5,000 | 180,000 | BLOCKED |
| Real-time | Custom | 30,000 channels | NEGOTIABLE |
| Multi-region | Yes | Required | OK |

### 4.3 Verdict

**Supabase Enterprise is NOT sufficient for 100K salons without:**
1. Multiple Supabase projects (region-based sharding)
2. Custom infrastructure agreements
3. Read replica configuration
4. Dedicated connection pooling (PgBouncer)

---

## 5. Recommended Architecture Changes

### 5.1 Short-term (0-10K Salons)

**Estimated Timeline: 2-4 weeks**

```
1. Implement connection pooling via PgBouncer
   - Reduce per-device connections
   - Pool multiplexing

2. Add read replicas
   - Offload read queries
   - Improve query latency

3. Optimize RLS policies
   - Add composite indexes on (store_id, created_at)
   - Partition tables by date

4. Implement request batching
   - Combine sync operations
   - Reduce API calls by 70%
```

### 5.2 Medium-term (10K-50K Salons)

**Estimated Timeline: 2-3 months**

```
1. Multi-project Supabase architecture
   - Shard by geographic region
   - 4-5 regional Supabase projects

   Example:
   - us-east.supabase.co (25K salons)
   - us-west.supabase.co (25K salons)
   - eu-west.supabase.co (25K salons)
   - ap-east.supabase.co (25K salons)

2. Implement tenant routing service
   - Route requests to correct region
   - Handle cross-region operations

3. Replace real-time with custom WebSocket
   - Build dedicated pub/sub service
   - Scale horizontally

4. Implement CQRS pattern
   - Separate read/write paths
   - Event sourcing for writes
```

### 5.3 Long-term (50K-100K+ Salons)

**Estimated Timeline: 6-12 months**

```
1. Move to multi-tenant microservices
   - Dedicated services per domain
   - Kubernetes orchestration

2. Database sharding strategy
   - Hash-based sharding by tenant_id
   - 10-20 database shards

3. Implement global CDN layer
   - Cache static data
   - Edge computing for low-latency

4. Event-driven architecture
   - Kafka/NATS for event streaming
   - Async processing at scale

5. Consider alternative databases
   - CockroachDB for global distribution
   - Vitess for MySQL sharding
   - Citus for PostgreSQL sharding
```

---

## 6. Migration Path

### Phase 1: Foundation (Weeks 1-4)

| Task | Effort | Risk |
|------|--------|------|
| Add composite indexes | 1 day | Low |
| Implement PgBouncer | 3 days | Low |
| Add request batching | 1 week | Low |
| Table partitioning | 1 week | Medium |

### Phase 2: Scaling (Weeks 5-12)

| Task | Effort | Risk |
|------|--------|------|
| Multi-region setup | 2 weeks | Medium |
| Tenant routing service | 2 weeks | Medium |
| Custom WebSocket server | 3 weeks | High |
| CQRS implementation | 4 weeks | High |

### Phase 3: Enterprise (Weeks 13-26)

| Task | Effort | Risk |
|------|--------|------|
| Microservices migration | 8 weeks | High |
| Database sharding | 6 weeks | Critical |
| Global CDN integration | 2 weeks | Medium |
| Event streaming | 4 weeks | High |

---

## Cost Projections

### Current (Supabase Pro)
- Monthly: $25/month
- Annual: $300/year

### 10K Salons (Supabase Enterprise Multi-Region)
- Estimated: $5,000-10,000/month
- Annual: $60,000-120,000/year

### 100K Salons (Custom Infrastructure)
- Database (managed Postgres clusters): $15,000-30,000/month
- Compute (Kubernetes): $10,000-20,000/month
- Networking/CDN: $5,000-10,000/month
- Real-time infrastructure: $5,000-10,000/month
- **Total: $35,000-70,000/month**
- **Annual: $420,000-840,000/year**

---

## Conclusion

The current Mango POS architecture **cannot scale to 100K salons** without fundamental changes:

1. **Immediate Blocker:** Single Supabase project has hard limits
2. **Architecture Gap:** No sharding, no read replicas, no region distribution
3. **Real-time Limitation:** Channel limits will fail at ~10K stores
4. **Cost Reality:** Enterprise scale requires significant infrastructure investment

**Recommended Action:**
Start Phase 1 optimizations immediately while planning for Phase 2 multi-region architecture. The sooner horizontal scaling is implemented, the easier the migration path.

---

## Appendix: Key Metrics Monitoring

To track scalability progress, monitor:

```
1. Database Metrics
   - Connection pool utilization
   - Query latency (p50, p95, p99)
   - Table row counts
   - Index hit ratio

2. API Metrics
   - Requests per second
   - Error rate
   - Circuit breaker trips
   - Rate limit hits

3. Real-time Metrics
   - Active channels
   - Messages per second
   - Connection drops
   - Latency

4. Business Metrics
   - Active stores
   - Concurrent devices
   - Sync queue depth
   - Failed syncs
```

---

**Document Version:** 1.0
**Last Updated:** December 31, 2024
**Author:** Architecture Analysis
