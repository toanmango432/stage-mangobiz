# Scalability Implementation Plan: 100K+ Salons

**Project:** Mango POS Offline V2
**Date:** December 29, 2025
**Goal:** Scale from MVP to 100,000+ salon locations without performance degradation

---

## Executive Summary

This plan transforms Mango POS from a single-tenant prototype to an enterprise-grade multi-tenant SaaS platform capable of serving 100,000+ salon locations globally.

### Scale Milestones

| Milestone | Salons | Monthly Active Users | Transactions/Day |
|-----------|--------|---------------------|------------------|
| **Current (MVP)** | 1-10 | 50-100 | 1,000 |
| **Phase 1** | 100-1,000 | 5,000 | 50,000 |
| **Phase 2** | 1,000-10,000 | 50,000 | 500,000 |
| **Phase 3** | 10,000-50,000 | 250,000 | 2.5M |
| **Phase 4** | 50,000-100,000+ | 500,000+ | 5M+ |

---

## Current Architecture Assessment

### What's Already Built ✅

| Component | Status | Scale Ready? |
|-----------|--------|--------------|
| Local-First Architecture | ✅ Complete | Yes - reduces server load |
| Background Sync Service | ✅ Complete | Yes - batch operations |
| Batch-Sync Edge Function | ✅ Complete | Yes - rate limiting |
| Storage Monitor Service | ✅ Complete | Yes - quota management |
| Data Cleanup Service | ✅ Complete | Yes - retention policies |
| Circuit Breaker | ✅ Complete | Yes - resilience |
| Request Timeouts | ✅ Complete | Yes - fail-fast |
| Cached-First Login | ✅ Complete | Yes - reduces auth load |
| Data Hydration | ✅ Complete | Yes - initial sync |
| RLS Security | ✅ Complete | Yes - tenant isolation |

### Current Bottlenecks 🔴

| Bottleneck | Impact at Scale | Priority |
|------------|-----------------|----------|
| Single Supabase instance | 10K+ salons: DB overload | P0 |
| No connection pooling | 1K concurrent: connection exhaustion | P0 |
| No server-side caching | Every read hits DB | P0 |
| 4.4MB bundle | Slow initial load globally | P1 |
| No error tracking | Blind to production issues | P0 |
| 3.5% test coverage | Regression risk | P1 |
| Single region | High latency for distant users | P2 |

---

## Phase 1: Production Hardening (Weeks 1-4)
**Target: 1,000 salons**

### 1.1 Observability Stack (Week 1)

| Task | Tool | Effort |
|------|------|--------|
| Error tracking | Sentry | 4 hours |
| APM dashboard | Supabase Dashboard + custom | 4 hours |
| Log aggregation | Supabase Logs | 2 hours |
| Alerting | PagerDuty/Slack webhooks | 2 hours |

**Implementation:**
```typescript
// src/services/monitoring/sentry.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_ENV || 'development',
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.01, // 1% of sessions
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
});
```

**Files to create:**
- `src/services/monitoring/sentry.ts`
- `src/services/monitoring/metrics.ts`
- `src/components/common/ErrorBoundary.tsx`

---

### 1.2 Connection Pooling (Week 1)

**Supabase Dashboard Settings:**
1. Go to Project Settings → Database → Connection Pooling
2. Enable "Transaction mode" pooler
3. Set pool size: 15-25 connections
4. Update connection string in app

**Code change:**
```typescript
// src/services/supabase/client.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Use pooler connection string for production
const connectionString = import.meta.env.VITE_SUPABASE_POOLER_URL || supabaseUrl;
```

---

### 1.3 Server-Side Caching Layer (Week 2)

**Option A: Supabase Edge Functions + Upstash Redis**

```typescript
// supabase/functions/cached-query/index.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL'),
  token: Deno.env.get('UPSTASH_REDIS_TOKEN'),
});

serve(async (req) => {
  const { query, storeId, ttl = 300 } = await req.json();
  const cacheKey = `query:${storeId}:${hashQuery(query)}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return new Response(JSON.stringify({ data: cached, cached: true }));
  }

  // Execute query
  const { data, error } = await supabase.from(query.table).select(query.select);

  // Cache result
  if (data) {
    await redis.setex(cacheKey, ttl, JSON.stringify(data));
  }

  return new Response(JSON.stringify({ data, cached: false }));
});
```

**Cache Strategy:**
| Data Type | TTL | Invalidation |
|-----------|-----|--------------|
| Staff list | 5 min | On staff change |
| Services | 10 min | On service change |
| Store settings | 15 min | On settings change |
| Appointments (today) | 30 sec | On booking change |
| Clients | 5 min | On client change |

---

### 1.4 Test Coverage Sprint (Weeks 2-4)

**Priority Order:**
1. Payment flow (critical path)
2. Background sync service
3. Authentication flow
4. Data hydration
5. Conflict resolution

**Target: 40% coverage by end of Phase 1**

```bash
# Run coverage report
npm run test:coverage

# Focus on high-risk areas
npm test -- --coverage --collectCoverageFrom="src/services/payment/**"
npm test -- --coverage --collectCoverageFrom="src/services/backgroundSyncService.ts"
```

**Files to create tests for:**
- `src/services/payment/__tests__/paymentBridge.test.ts`
- `src/services/backgroundSyncService.test.ts`
- `src/services/supabase/authService.test.ts`
- `src/services/hydrationService.test.ts`

---

## Phase 2: Performance Optimization (Weeks 5-8)
**Target: 10,000 salons**

### 2.1 Bundle Size Reduction

**Current:** 4.4MB
**Target:** <2MB

**Strategy:**
```typescript
// vite.config.ts - Route-based code splitting
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom'],
          // State management
          'vendor-state': ['@reduxjs/toolkit', 'react-redux'],
          // UI components
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          // Date handling
          'vendor-date': ['date-fns'],
          // Charts (lazy load)
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
});

// Lazy load modules
const BookPage = lazy(() => import('./pages/BookPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
```

**Additional optimizations:**
- Remove unused dependencies (bundle analyzer)
- Tree shake Lucide icons (import specific icons)
- Lazy load heavy components (reports, charts)

---

### 2.2 Virtual Scrolling for Large Lists

```typescript
// src/components/common/VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualList<T>({
  items,
  renderItem,
  estimateSize = 50
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Apply to:**
- Client list (1000s of clients)
- Appointment list
- Transaction history
- Staff list (for large chains)

---

### 2.3 Cursor-Based Pagination

```typescript
// src/services/supabase/tables/clients.ts
export async function getClientsPaginated(
  storeId: string,
  cursor?: string,
  limit = 50
) {
  let query = supabase
    .from('clients')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  return {
    data,
    nextCursor: data?.length === limit ? data[data.length - 1].created_at : null,
    hasMore: data?.length === limit,
  };
}
```

---

### 2.4 Web Workers for Heavy Operations

```typescript
// src/workers/syncWorker.ts
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'PROCESS_SYNC_QUEUE':
      const results = await processSyncQueue(payload.operations);
      self.postMessage({ type: 'SYNC_COMPLETE', results });
      break;
    case 'HYDRATE_DATA':
      const data = await hydrateData(payload.storeId);
      self.postMessage({ type: 'HYDRATION_COMPLETE', data });
      break;
  }
};

// src/hooks/useSyncWorker.ts
export function useSyncWorker() {
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/syncWorker.ts', import.meta.url),
      { type: 'module' }
    );
    return () => workerRef.current?.terminate();
  }, []);

  return workerRef;
}
```

---

## Phase 3: Database Scaling (Weeks 9-12)
**Target: 50,000 salons**

### 3.1 Read Replicas

**Supabase Pro Plan Feature:**
1. Enable read replicas in Supabase dashboard
2. Configure read/write splitting in app

```typescript
// src/services/supabase/client.ts
const primaryClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const replicaClient = createClient(SUPABASE_REPLICA_URL, SUPABASE_ANON_KEY);

export function getClient(operation: 'read' | 'write' = 'read') {
  return operation === 'write' ? primaryClient : replicaClient;
}
```

---

### 3.2 Table Partitioning

```sql
-- Partition tickets by store_id range
CREATE TABLE tickets_partitioned (
  id UUID NOT NULL,
  store_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  -- ... other columns
) PARTITION BY HASH (store_id);

-- Create 16 partitions
CREATE TABLE tickets_p0 PARTITION OF tickets_partitioned FOR VALUES WITH (MODULUS 16, REMAINDER 0);
CREATE TABLE tickets_p1 PARTITION OF tickets_partitioned FOR VALUES WITH (MODULUS 16, REMAINDER 1);
-- ... tickets_p2 through tickets_p15

-- Partition appointments by date for time-based queries
CREATE TABLE appointments_partitioned (
  id UUID NOT NULL,
  store_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  -- ... other columns
) PARTITION BY RANGE (appointment_date);

-- Monthly partitions
CREATE TABLE appointments_2025_01 PARTITION OF appointments_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE appointments_2025_02 PARTITION OF appointments_partitioned
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- ... create partitions for each month
```

---

### 3.3 Materialized Views for Reports

```sql
-- Daily revenue summary (refreshed hourly)
CREATE MATERIALIZED VIEW mv_daily_revenue AS
SELECT
  store_id,
  DATE(created_at) as date,
  COUNT(*) as transaction_count,
  SUM(total_amount) as total_revenue,
  SUM(tip_amount) as total_tips,
  AVG(total_amount) as avg_ticket
FROM transactions
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY store_id, DATE(created_at);

CREATE UNIQUE INDEX ON mv_daily_revenue (store_id, date);

-- Refresh function (called by cron)
CREATE OR REPLACE FUNCTION refresh_daily_revenue()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue;
END;
$$ LANGUAGE plpgsql;
```

---

### 3.4 Query Optimization

**Add indexes for common queries:**
```sql
-- Composite indexes for multi-column filters
CREATE INDEX idx_appointments_store_date ON appointments(store_id, appointment_date);
CREATE INDEX idx_tickets_store_status ON tickets(store_id, status);
CREATE INDEX idx_transactions_store_created ON transactions(store_id, created_at DESC);

-- Partial indexes for active records
CREATE INDEX idx_clients_active ON clients(store_id) WHERE is_deleted = false;
CREATE INDEX idx_staff_active ON staff(store_id) WHERE is_active = true;

-- GIN index for full-text search
CREATE INDEX idx_clients_search ON clients USING GIN (
  to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(email, '') || ' ' || COALESCE(phone, ''))
);
```

---

## Phase 4: Multi-Region & Enterprise (Weeks 13-20)
**Target: 100,000+ salons**

### 4.1 Multi-Region Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     GLOBAL LOAD BALANCER                            │
│                     (Cloudflare/AWS Route53)                        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
   │ US-WEST │        │ US-EAST │        │   EU    │
   │ Region  │        │ Region  │        │ Region  │
   └────┬────┘        └────┬────┘        └────┬────┘
        │                  │                  │
   ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
   │Supabase │        │Supabase │        │Supabase │
   │US-West-1│        │US-East-1│        │EU-West-1│
   └────┬────┘        └────┬────┘        └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Global    │
                    │ Replication │
                    └─────────────┘
```

**Implementation steps:**
1. Create Supabase projects in each region
2. Setup cross-region replication (Supabase Enterprise)
3. Implement geo-routing based on user location
4. Handle cross-region data consistency

---

### 4.2 Tenant Sharding Strategy

```typescript
// src/services/sharding/tenantRouter.ts
interface ShardConfig {
  region: 'us-west' | 'us-east' | 'eu' | 'apac';
  supabaseUrl: string;
  supabaseKey: string;
}

const SHARD_MAP: Record<string, ShardConfig> = {
  'us-west': {
    region: 'us-west',
    supabaseUrl: process.env.SUPABASE_US_WEST_URL,
    supabaseKey: process.env.SUPABASE_US_WEST_KEY,
  },
  'us-east': {
    region: 'us-east',
    supabaseUrl: process.env.SUPABASE_US_EAST_URL,
    supabaseKey: process.env.SUPABASE_US_EAST_KEY,
  },
  // ... other regions
};

export function getShardForTenant(tenantId: string): ShardConfig {
  // Use consistent hashing or tenant metadata
  const tenantRegion = getTenantRegion(tenantId);
  return SHARD_MAP[tenantRegion];
}
```

---

### 4.3 Rate Limiting at Scale

```typescript
// supabase/functions/rate-limiter/index.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL'),
  token: Deno.env.get('UPSTASH_REDIS_TOKEN'),
});

// Sliding window rate limiter
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
});

serve(async (req) => {
  const storeId = req.headers.get('x-store-id');
  const { success, remaining, reset } = await ratelimit.limit(storeId);

  if (!success) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((reset - Date.now()) / 1000)
    }), {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) }
    });
  }

  // Process request...
});
```

---

### 4.4 Disaster Recovery Plan

**RTO (Recovery Time Objective):** 15 minutes
**RPO (Recovery Point Objective):** 5 minutes

**Backup Strategy:**
| Component | Backup Frequency | Retention | Location |
|-----------|-----------------|-----------|----------|
| PostgreSQL | Continuous (WAL) | 30 days | Cross-region |
| Point-in-time | Every 5 min | 7 days | Same region |
| Full snapshot | Daily | 90 days | Separate cloud |
| Edge Functions | Git versioned | Unlimited | GitHub |
| Config/Secrets | On change | 90 days | Vault |

**Failover Procedure:**
1. Health check detects primary region failure
2. DNS failover to secondary region (< 60 seconds)
3. Promote read replica to primary
4. Update connection strings
5. Notify operations team
6. Begin data reconciliation

---

## Phase 5: Enterprise Features (Weeks 21-26)

### 5.1 Audit Logging

```sql
-- Audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month for performance
CREATE TABLE audit_logs_partitioned PARTITION OF audit_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Automatic audit trigger
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (tenant_id, store_id, user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    COALESCE(NEW.store_id, OLD.store_id),
    current_setting('app.current_user_id', true)::UUID,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 5.2 Multi-Tenant Resource Quotas

```typescript
// src/services/quotas/tenantQuotas.ts
interface TenantQuota {
  maxStaff: number;
  maxClients: number;
  maxAppointmentsPerDay: number;
  maxStorageGB: number;
  apiRequestsPerMinute: number;
}

const PLAN_QUOTAS: Record<string, TenantQuota> = {
  free: {
    maxStaff: 3,
    maxClients: 500,
    maxAppointmentsPerDay: 50,
    maxStorageGB: 1,
    apiRequestsPerMinute: 30,
  },
  pro: {
    maxStaff: 15,
    maxClients: 5000,
    maxAppointmentsPerDay: 200,
    maxStorageGB: 10,
    apiRequestsPerMinute: 100,
  },
  enterprise: {
    maxStaff: Infinity,
    maxClients: Infinity,
    maxAppointmentsPerDay: Infinity,
    maxStorageGB: 100,
    apiRequestsPerMinute: 500,
  },
};

export async function checkQuota(
  tenantId: string,
  resource: keyof TenantQuota
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const tenant = await getTenant(tenantId);
  const quota = PLAN_QUOTAS[tenant.plan];
  const current = await getCurrentUsage(tenantId, resource);

  return {
    allowed: current < quota[resource],
    current,
    limit: quota[resource],
  };
}
```

---

## Implementation Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Week    1    2    3    4    5    6    7    8    9   10   11   12   13-20   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Phase 1 ████████████████                                                    │
│ Observability + Tests                                                       │
│                                                                             │
│ Phase 2                 ████████████████                                    │
│ Performance                                                                 │
│                                                                             │
│ Phase 3                                 ████████████████                    │
│ Database Scaling                                                            │
│                                                                             │
│ Phase 4                                                     ████████████   │
│ Multi-Region                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Capacity  1K         10K              50K                    100K+          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cost Estimates

| Phase | Supabase Plan | Redis | Monitoring | Monthly Cost |
|-------|--------------|-------|------------|--------------|
| Phase 1 | Pro ($25) | Upstash Free | Sentry Free | ~$50 |
| Phase 2 | Pro ($25) | Upstash Pro ($20) | Sentry Team ($26) | ~$100 |
| Phase 3 | Team ($599) | Upstash Pro ($50) | Sentry Business | ~$800 |
| Phase 4 | Enterprise | Redis Enterprise | Full stack | $3,000+ |

---

## Success Metrics

| Metric | Current | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|---------|---------|
| P95 Latency | Unknown | <500ms | <300ms | <200ms | <100ms |
| Error Rate | Unknown | <1% | <0.5% | <0.1% | <0.01% |
| Uptime | Unknown | 99% | 99.5% | 99.9% | 99.99% |
| Test Coverage | 3.5% | 40% | 60% | 80% | 90% |
| Bundle Size | 4.4MB | 3MB | 2MB | 1.5MB | 1.5MB |

---

## Immediate Next Steps (This Week)

### Day 1-2: Observability
- [ ] Create Sentry account and integrate SDK
- [ ] Add React Error Boundary to App.tsx
- [ ] Setup basic alerting (errors > 100/hour)

### Day 3: Connection Pooling
- [ ] Enable Supabase connection pooling (dashboard)
- [ ] Update connection strings

### Day 4-5: Quick Tests
- [ ] Write tests for paymentBridge.ts
- [ ] Write tests for backgroundSyncService.ts
- [ ] Setup CI to run tests on PR

---

*Plan created: December 29, 2025*
*Target: 100,000+ salons with sub-200ms latency globally*
