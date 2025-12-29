# Architecture Gap Analysis: Robustness & Scalability

**Project:** Mango POS Offline V2
**Date:** December 29, 2025
**Purpose:** Identify remaining gaps for production readiness and scaling to 100K+ salons

---

## Executive Summary

After reviewing uncommitted changes, the previous agent completed **significant work**. This analysis reflects the **actual current state**.

| Area | Status | Notes |
|------|--------|-------|
| **Hardcoded Credentials** | ✅ FIXED | Removed from client.ts, uses env vars |
| **Local-First Architecture** | ✅ DONE | Device mode toggle removed, all reads from IndexedDB |
| **Cached-First Login** | ✅ DONE | 7-day grace period, background validation |
| **Background Sync** | ✅ DONE | Batch support, retry logic |
| **Edge Function Gateway** | ✅ DONE | batch-sync function created |
| **Storage Monitoring** | ✅ DONE | 70%/90% thresholds |
| **Data Cleanup Service** | ✅ DONE | Retention policies, sync-safe deletion |
| **Circuit Breaker** | ✅ DONE | In supabase/client.ts |
| **Request Timeouts** | ✅ DONE | withTimeout wrapper |
| **Payment Service** | ✅ DONE | paymentBridge + mockPaymentProvider |
| **Search Components** | ✅ DONE | GlobalSearchModal, SearchResultItem |
| **PRD Documentation** | ✅ DONE | 15+ PRD documents created |
| **Type Definitions** | ✅ DONE | gift-card, membership, inventory, etc. |

---

## Part 1: Completed Work (By Previous Agent)

### 1.1 Architecture Fixes Commit (`b354aec`)
- Removed hardcoded Supabase credentials
- Created `backgroundSyncService.ts` (641 lines)
- Created `hydrationService.ts` (400 lines)
- Created `dataLifecycleService.ts` (325 lines)
- Created `storageMonitorService.ts` (305 lines)
- Created `batch-sync` Edge Function (324 lines)
- Updated `supabase/client.ts` with circuit breaker + timeout

### 1.2 Local-First Architecture (Phase 1-3)
- Device mode toggle removed
- `dataService.ts` always returns 'local' for reads
- Cached-first login with 7-day grace period
- Background validation (non-blocking)
- Initial data hydration on first login

### 1.3 Payment Service Abstraction
- `src/services/payment/paymentBridge.ts`
- `src/services/payment/mockPaymentProvider.ts`
- `src/services/payment/types.ts`

### 1.4 Search Components
- `src/components/search/GlobalSearchModal.tsx`
- `src/components/search/SearchResultItem.tsx`
- `src/components/search/SearchQuickActions.tsx`

### 1.5 New PRD Documents (15+)
- PRD-API-Specifications.md (~160 endpoints documented)
- PRD-Front-Desk-Module.md (70+ requirements)
- PRD-Device-Manager-Module.md
- PRD-Settings-Module.md
- PRD-Reports-Module.md
- PRD-Transactions-Module.md
- PRD-Premium-Module.md
- PRD-Menu-Settings-Module.md
- PRD-Pending-Module.md
- Plus updates to existing PRDs

### 1.6 New Type Definitions
- `src/types/gift-card.ts`
- `src/types/membership.ts`
- `src/types/inventory.ts`
- `src/types/deposit.ts`
- `src/types/waitlist.ts`
- `src/types/settings.ts`
- `src/types/organization.ts`
- `src/types/integration.ts`

---

## Part 2: Remaining Gaps

### 2.1 Testing (CRITICAL - NOT ADDRESSED)

| Gap | Current | Required | Effort |
|-----|---------|----------|--------|
| **Unit Test Coverage** | ~3.5% | 80%+ | XL |
| **Integration Tests** | None | Key user flows | L |
| **E2E Tests** | Basic setup | Full journey coverage | L |
| **Load Testing** | None | Artillery/k6 scripts | M |

**Priority:** P0 - This is the biggest remaining gap.

---

### 2.2 Error Tracking & Monitoring (CRITICAL - NOT ADDRESSED)

| Gap | Current | Required | Effort |
|-----|---------|----------|--------|
| **Error Tracking (Sentry)** | Console only | Production monitoring | M |
| **APM Dashboard** | None | DataDog/New Relic | M |
| **Business Metrics** | None | Revenue, bookings | M |
| **Alerting** | None | PagerDuty/Slack | S |

**Priority:** P0 - Flying blind in production without this.

---

### 2.3 Bundle Size Optimization (HIGH)

| Gap | Current | Required | Effort |
|-----|---------|----------|--------|
| **Bundle Size** | 4.4MB | <2MB | L |
| **Route-Based Splitting** | Manual chunks | Lazy loading | M |
| **Tree Shaking** | Basic | Aggressive | M |

**Priority:** P1 - Impacts initial load time.

---

### 2.4 Database Scaling (FOR 100K+ SALONS)

| Gap | Current | Required | Effort |
|-----|---------|----------|--------|
| **Connection Pooling** | Direct connections | PgBouncer | S |
| **Read Replicas** | None | 1+ per region | M |
| **Table Partitioning** | None | By tenant_id | M |
| **Query Optimization** | Ad-hoc | Materialized views | M |

**Priority:** P1 - Required before 10K+ salons.

---

### 2.5 Multi-Region & DR (FOR 100K+ SALONS)

| Gap | Current | Required | Effort |
|-----|---------|----------|--------|
| **Multi-Region** | Single region | 2-3 regions | L |
| **DR Plan** | None | Documented + tested | M |
| **Blue-Green Deploys** | None | Zero-downtime | M |

**Priority:** P2 - Required for enterprise scale.

---

### 2.6 Security Hardening

| Gap | Current | Required | Effort |
|-----|---------|----------|--------|
| **Audit Logging** | None | All sensitive ops | M |
| **PIN Rate Limiting** | Basic | Lockout after 5 attempts | S |
| **CORS Tightening** | Wide open | Strict whitelist | S |

**Priority:** P1 - Security compliance.

---

### 2.7 Conflict Resolution UI

| Gap | Current | Required | Effort |
|-----|---------|----------|--------|
| **Conflict Modal** | Silent merge | User-facing resolver | L |
| **Conflict Preview** | None | Show both versions | M |

**Priority:** P2 - Nice to have for offline conflicts.

---

## Part 3: Revised Priority Matrix

### P0 - Before Production (REMAINING)

| # | Gap | Category | Effort |
|---|-----|----------|--------|
| 1 | Error tracking (Sentry) | Monitoring | M |
| 2 | Basic test coverage (40%+) | Testing | L |
| 3 | Enable Supabase connection pooling | Database | S |

### P1 - Before 10K Salons

| # | Gap | Category | Effort |
|---|-----|----------|--------|
| 4 | Bundle size < 2MB | Performance | L |
| 5 | Audit logging | Security | M |
| 6 | Read replicas | Database | M |
| 7 | PIN rate limiting + lockout | Security | S |

### P2 - Before 100K Salons

| # | Gap | Category | Effort |
|---|-----|----------|--------|
| 8 | Multi-region deployment | Infrastructure | L |
| 9 | Table partitioning | Database | M |
| 10 | Conflict resolution UI | Sync | L |
| 11 | Full E2E test suite | Testing | L |

---

## Part 4: Immediate Next Steps

### This Week (Quick Wins)

1. **Enable Supabase connection pooling** (15 min - dashboard setting)
2. **Setup Sentry free tier** (2 hours)
3. **Add React Error Boundary wrapper** (1 hour)
4. **Commit all uncommitted changes** (!)

### Next Sprint

1. Write unit tests for:
   - Payment flow (highest risk)
   - Background sync service
   - Authentication flow
2. Bundle size audit and code splitting

---

## Part 5: Uncommitted Changes Warning

**There are 85+ modified files and 40+ new files that are NOT committed!**

This includes:
- All new PRD documents
- All new type definitions
- Payment service
- Search components
- Many component fixes

**Recommendation:** Commit these changes before any new work.

---

*Analysis updated: December 29, 2025*
*Previous work by other agent acknowledged*
