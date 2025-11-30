# Mango Biz - Architecture Decision Records (ADRs)

**Document Version:** 1.0
**Last Updated:** November 30, 2025
**Status:** Active

---

## Overview

This document captures the key architectural and technical decisions made for the Mango Biz platform. Each ADR follows a consistent format explaining the context, decision, rationale, and consequences.

Architecture Decision Records serve as:
- **Historical record** of why decisions were made
- **Onboarding resource** for new team members
- **Reference point** for future architectural discussions
- **Accountability trail** for technical choices

---

## Table of Contents

1. [ADR-001: Offline-First Architecture](#adr-001-offline-first-architecture)
2. [ADR-002: Local-First Data with Cloud Sync](#adr-002-local-first-data-with-cloud-sync)
3. [ADR-003: Field-Level Conflict Resolution](#adr-003-field-level-conflict-resolution)
4. [ADR-004: Version Vectors for Conflict Detection](#adr-004-version-vectors-for-conflict-detection)
5. [ADR-005: Server-Wins for Financial Data](#adr-005-server-wins-for-financial-data)
6. [ADR-006: AES-256-GCM Encryption for Sensitive Data](#adr-006-aes-256-gcm-encryption-for-sensitive-data)
7. [ADR-007: Tombstone Pattern for Soft Deletes](#adr-007-tombstone-pattern-for-soft-deletes)
8. [ADR-008: Priority-Based Sync Queue](#adr-008-priority-based-sync-queue)
9. [ADR-009: Stripe Terminal for Payment Processing](#adr-009-stripe-terminal-for-payment-processing)
10. [ADR-010: Dexie.js for IndexedDB Management](#adr-010-dexiejs-for-indexeddb-management)
11. [ADR-011: React with TypeScript Frontend Stack](#adr-011-react-with-typescript-frontend-stack)
12. [ADR-012: Multi-Tenant Architecture with Row-Level Security](#adr-012-multi-tenant-architecture-with-row-level-security)
13. [ADR-013: Exponential Backoff with Jitter for Retries](#adr-013-exponential-backoff-with-jitter-for-retries)
14. [ADR-014: Data Retention and Compliance Strategy](#adr-014-data-retention-and-compliance-strategy)
15. [ADR-015: Audit Trail on All Mutations](#adr-015-audit-trail-on-all-mutations)

---

## ADR-001: Offline-First Architecture

**Status:** Accepted
**Date:** October 2025
**Deciders:** Engineering Team

### Context

Salons and spas frequently experience internet connectivity issues due to:
- Building locations (basements, malls, older buildings with poor WiFi)
- ISP outages
- Network congestion during peak business hours
- Rural locations with unreliable connectivity

Competitors (Fresha, Mangomint, Zenoti) primarily use cloud-first architectures that fail during outages, causing:
- Lost revenue from inability to process payments
- Client frustration and walk-outs
- Staff confusion and manual workarounds
- Data loss from paper-based fallbacks

### Decision

**Adopt an offline-first architecture where the local device is the primary data source, with cloud synchronization as a background process.**

Key principles:
1. All core operations (booking, check-in, checkout, payments) work without internet
2. Local storage (IndexedDB) is the source of truth during operations
3. Background sync pushes changes to cloud when connectivity is available
4. UI never blocks waiting for network responses

### Rationale

- **Business continuity:** Salons cannot afford operational downtime
- **User experience:** Instant UI response regardless of network conditions
- **Competitive advantage:** Most competitors fail during outages
- **Trust building:** Reliability builds long-term customer loyalty

### Consequences

**Positive:**
- Zero revenue loss during internet outages
- Faster UI response times (no network latency)
- Works in poor connectivity environments
- Builds trust with salon owners

**Negative:**
- Increased complexity for conflict resolution
- More complex data architecture
- Requires careful sync queue management
- Higher initial development effort

**Mitigations:**
- Comprehensive conflict resolution strategies (see ADR-003)
- Robust sync queue with priorities (see ADR-008)
- Thorough testing of offline scenarios

### Related Documents
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Section 1
- [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) - Architecture Overview

---

## ADR-002: Local-First Data with Cloud Sync

**Status:** Accepted
**Date:** October 2025
**Deciders:** Engineering Team

### Context

Given the offline-first architecture decision (ADR-001), we needed to determine how to partition data between local and cloud storage.

Options considered:
1. **Full replication:** All data on every device
2. **Partial replication:** Only operational data locally, admin data in cloud
3. **On-demand caching:** Fetch and cache as needed
4. **Hybrid approach:** Different strategies per data type

### Decision

**Implement a four-category data storage strategy:**

| Category | Description | Examples |
|----------|-------------|----------|
| **Local Only** | Device-specific, never synced | UI preferences, sync queue, draft data |
| **Local + Cloud** | Primary local, syncs bidirectionally | Appointments, tickets, transactions, clients |
| **Cloud Only** | Never stored locally | Tenants, licenses, audit logs, admin users |
| **Hybrid/Cached** | Fetched from cloud, cached locally | Feature flags, license tier, store defaults |

### Rationale

- **Operational efficiency:** Front desk operations need instant access to appointments, clients, tickets
- **Security:** Sensitive admin data (licenses, audit logs) shouldn't be on POS devices
- **Storage management:** Devices have limited storage; can't store everything
- **Compliance:** Some data has retention requirements best handled server-side

### Consequences

**Positive:**
- Clear guidelines for where data lives
- Optimized device storage usage
- Appropriate security boundaries
- Simplified offline logic (only sync what's needed)

**Negative:**
- Must maintain clear documentation of data categories
- Some features unavailable offline (admin functions)
- Cache invalidation complexity for hybrid data

### Related Documents
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Sections 1.1-1.4

---

## ADR-003: Field-Level Conflict Resolution

**Status:** Accepted
**Date:** November 2025
**Deciders:** Engineering Team

### Context

With multiple devices operating offline simultaneously, conflicts are inevitable when devices sync.

Options considered:
1. **Last-Write-Wins (LWW):** Timestamp-based, later change wins entirely
2. **First-Write-Wins:** First synced version wins
3. **Server-Wins:** Server version always wins
4. **Client-Wins:** Client version always wins
5. **Field-Level Merge:** Merge changes at individual field level
6. **Manual Resolution:** Always prompt user to choose

### Decision

**Implement field-level conflict resolution with configurable strategies per entity and per field.**

Default strategies by entity:

| Entity | Strategy | Rationale |
|--------|----------|-----------|
| Appointments | Field-Merge | Different fields change independently |
| Tickets | Field-Merge | Line items and payments evolve separately |
| Transactions | Server-Wins | Financial integrity is paramount |
| Clients | Field-Merge | Contact info vs. visit stats change separately |
| Staff | Last-Write-Wins | Real-time fields use server-wins |
| Services/Products | Server-Wins | Reference data, admin-controlled |

Field-specific rules example (Appointments):
```
status: latest (most recent status wins)
statusHistory: merge-array (combine all status changes)
notes: merge-concat (combine notes with separator)
services: merge-array (union of services)
scheduledStartTime: latest
staffId: latest
```

### Rationale

- **Data preservation:** LWW loses data; field-merge preserves both changes
- **Semantic correctness:** Different fields have different merge semantics
- **User experience:** Reduces manual conflict resolution prompts
- **Financial safety:** Server-wins for transactions prevents double-charging

### Consequences

**Positive:**
- Minimal data loss during concurrent edits
- Reduced user friction (fewer conflict prompts)
- Semantically correct merging
- Configurable per business needs

**Negative:**
- More complex implementation
- Requires careful configuration per entity
- Edge cases may produce unexpected results
- Testing complexity increases

### Related Documents
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Section 4

---

## ADR-004: Version Vectors for Conflict Detection

**Status:** Accepted
**Date:** November 2025
**Deciders:** Engineering Team

### Context

To detect conflicts accurately, we need to know when two devices have made concurrent modifications to the same entity.

Options considered:
1. **Simple timestamps:** Compare updatedAt timestamps
2. **Monotonic version counter:** Single incrementing version number
3. **Version vectors:** Map of {deviceId: version} tracking each device's changes
4. **Lamport timestamps:** Logical clocks for ordering events

### Decision

**Use version vectors (vector clocks) on all syncable entities.**

Structure:
```typescript
interface BaseSyncableEntity {
  version: number;                    // Monotonic counter, local increment
  vectorClock: Record<string, number>; // { deviceId: lastSeenVersion }
  lastSyncedVersion: number;          // Version when last successfully synced
}
```

Conflict detection logic:
- If `server.version === local.lastSyncedVersion`: No conflict, local changes are newer
- If vector clocks show concurrent modifications: Conflict detected, apply resolution strategy

### Rationale

- **Accurate conflict detection:** Timestamps can drift between devices; version vectors are deterministic
- **Concurrent edit awareness:** Can detect when two devices edited simultaneously (not just sequentially)
- **Device attribution:** Know which device made which changes
- **Industry standard:** Well-established pattern for distributed systems (Dynamo, Riak, CRDTs)

### Consequences

**Positive:**
- Accurate concurrent modification detection
- No reliance on synchronized clocks
- Clear audit trail of which device made changes
- Enables proper three-way merge

**Negative:**
- Additional storage overhead (vector clock map)
- More complex sync logic
- Must maintain deviceId consistency
- Vector clock pruning needed for long-lived entities

### Related Documents
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Sections 2.1, 4.1

---

## ADR-005: Server-Wins for Financial Data

**Status:** Accepted
**Date:** November 2025
**Deciders:** Engineering Team, Finance

### Context

Transaction data requires special handling due to:
- Financial integrity requirements
- Potential for fraud or manipulation
- Tax and accounting compliance
- Payment processor reconciliation

### Decision

**All transaction and payment data uses server-wins conflict resolution with no field-level merging.**

This applies to:
- Transaction amounts
- Payment methods
- Refund/void status
- Tip amounts
- Commission calculations
- All financial totals

### Rationale

- **Financial integrity:** Cannot allow local modifications to override confirmed financial data
- **Fraud prevention:** Prevents manipulation of transaction records
- **Audit compliance:** Server maintains authoritative financial record
- **Payment processor alignment:** Must match what Stripe/processor recorded
- **Tax compliance:** Financial records must be immutable for tax purposes

### Consequences

**Positive:**
- Financial data integrity guaranteed
- Clear audit trail
- Compliance with financial regulations
- Prevents accidental or malicious data modification

**Negative:**
- Local financial data may be overwritten
- Users may see temporary discrepancies
- Must handle offline payment edge cases carefully

**Mitigations:**
- Idempotency keys prevent duplicate charges
- Clear UI indication when financial data is pending sync
- Offline payments queue with confirmation flow

### Related Documents
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Sections 2.4, 4.2
- [Mango POS PRD v1.md](./Mango%20POS%20PRD%20v1.md) - Payment Processing

---

## ADR-006: AES-256-GCM Encryption for Sensitive Data

**Status:** Accepted
**Date:** November 2025
**Deciders:** Engineering Team, Security

### Context

Sensitive data stored on devices (auth tokens, license keys) requires protection. Previous implementation used Base64 encoding, which provides no security (only obfuscation).

Options considered:
1. **Base64 encoding:** Simple but provides no security
2. **Device-level encryption:** Rely on iOS/Android encryption
3. **Application-level AES-256:** Encrypt within the application
4. **Hardware security module:** Use device secure enclave

### Decision

**Implement AES-256-GCM encryption using Web Crypto API for all high-sensitivity data.**

Implementation:
- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key derivation:** PBKDF2 with 100,000 iterations
- **Salt:** Random 16-byte salt, stored separately
- **IV:** Random 12-byte IV per encryption operation
- **Key binding:** Derived from device fingerprint

Data classification:
| Sensitivity | Examples | Protection |
|-------------|----------|------------|
| High | License keys, auth tokens | AES-256-GCM encrypted |
| Medium | Client PII | Application-level encryption |
| Low | Business data | Device encryption only |
| Critical | Payment card data | **Never stored** |

### Rationale

- **Security standard:** AES-256-GCM is the industry standard for authenticated encryption
- **Web Crypto API:** Native browser API, hardware-accelerated, audited
- **PBKDF2 iterations:** 100,000 iterations provides resistance to brute-force attacks
- **Device binding:** Keys are derived from device-specific data, not transferable

### Consequences

**Positive:**
- Sensitive data protected even if device is compromised
- Meets security compliance requirements
- Industry-standard encryption
- No third-party dependencies (native Web Crypto API)

**Negative:**
- Performance overhead for encryption/decryption
- Key management complexity
- Lost device secret = lost data (acceptable trade-off)
- Must handle migration from Base64 to AES

### Related Documents
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Section 5

---

## ADR-007: Tombstone Pattern for Soft Deletes

**Status:** Accepted
**Date:** November 2025
**Deciders:** Engineering Team

### Context

In an offline-first system, deletes are problematic:
- Device A deletes an entity offline
- Device B edits the same entity offline
- When both sync, how do we handle the conflict?

Hard deletes cause sync issues because the deleted entity no longer exists to sync.

### Decision

**Implement soft deletes using the tombstone pattern with configurable retention periods.**

Structure:
```typescript
interface BaseSyncableEntity {
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByDevice?: string;
  tombstoneExpiresAt?: string;  // When to hard-delete
}
```

Retention periods by entity:
| Entity | Tombstone Retention |
|--------|-------------------|
| Appointments | 30 days |
| Tickets | 90 days |
| Transactions | 1 year |
| Clients | 30 days |
| Services/Products | 30 days |

### Rationale

- **Sync propagation:** Tombstones sync to other devices, informing them of deletion
- **Conflict resolution:** Can detect delete-vs-edit conflicts
- **Audit trail:** Know who deleted what and when
- **Recovery window:** Accidental deletes can be recovered within retention period
- **Storage management:** Tombstones eventually purged to save space

### Consequences

**Positive:**
- Deletes propagate correctly across devices
- Delete-edit conflicts are detectable
- Accidental deletes recoverable
- Clear audit trail

**Negative:**
- Increased storage (tombstones persist)
- Queries must filter `isDeleted: false`
- Purge job required
- UI must handle "deleted" state gracefully

### Related Documents
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Sections 6.2, 6.3

---

## ADR-008: Priority-Based Sync Queue

**Status:** Accepted
**Date:** November 2025
**Deciders:** Engineering Team

### Context

Not all sync operations are equally urgent. A payment transaction is more critical than updating a client's preferred name.

### Decision

**Implement a priority-based sync queue with five priority levels.**

| Priority | Level | Entities | Description |
|----------|-------|----------|-------------|
| CRITICAL | 1 | Transactions, Payments | Must sync ASAP |
| HIGH | 2 | Appointments, Tickets | Business-critical |
| NORMAL | 3 | Clients, Staff | Important but deferrable |
| LOW | 4 | Services, Products | Reference data |
| BACKGROUND | 5 | Analytics, Preferences | Sync when idle |

Queue structure includes:
- `idempotencyKey`: Prevents duplicate operations
- `dependsOn`: Operation dependencies
- `batchable`: Can be batched with similar operations
- `maxAttempts`: Retry limit before abandonment

### Rationale

- **Business priority:** Financial data syncs before preferences
- **User experience:** Critical operations confirmed quickly
- **Resource optimization:** Batch low-priority operations
- **Failure isolation:** Low-priority failures don't block critical operations

### Consequences

**Positive:**
- Critical data syncs first
- Better resource utilization
- Improved perceived performance
- Failure isolation

**Negative:**
- Low-priority data may lag significantly
- Queue management complexity
- Must handle priority inversion edge cases

### Related Documents
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Section 3

---

## ADR-009: Stripe Terminal for Payment Processing

**Status:** Accepted
**Date:** October 2025
**Deciders:** Engineering Team, Business

### Context

Payment processing requires a reliable, PCI-compliant solution that supports:
- In-person card payments
- Offline payment capability
- Multiple hardware options
- Tip support
- Refunds and voids

Options considered:
1. **Stripe Terminal:** Modern SDK, S700 and WisePad 3 readers
2. **Square:** Popular but limited offline support
3. **Clover:** Proprietary hardware lock-in
4. **PAX:** Enterprise-focused, complex integration

### Decision

**Use Stripe Terminal SDK with S700 (countertop) and WisePad 3 (mobile) readers.**

Key capabilities:
- PCI DSS Level 1 compliant (Stripe handles card data)
- Offline payment support (store-and-forward)
- Modern JavaScript SDK
- Tap, chip, and swipe support
- Built-in tipping flows
- Comprehensive reporting API

### Rationale

- **PCI compliance:** Card data never touches our servers
- **Offline support:** Aligns with offline-first architecture
- **Developer experience:** Modern SDK, good documentation
- **Hardware flexibility:** Multiple reader options for different needs
- **Ecosystem:** Stripe's broader platform for future features (subscriptions, invoicing)

### Consequences

**Positive:**
- PCI compliance handled by Stripe
- Excellent offline support
- Modern developer experience
- Flexible hardware options
- Strong ecosystem for future features

**Negative:**
- Stripe's processing fees
- Hardware procurement through Stripe
- Dependency on Stripe's SDK updates
- Limited customization of payment flows

**Explicitly Rejected:**
- Clover: Proprietary hardware lock-in
- PAX: Overly complex for our needs

### Related Documents
- [Mango POS PRD v1.md](./Mango%20POS%20PRD%20v1.md) - Payment Integration

---

## ADR-010: Dexie.js for IndexedDB Management

**Status:** Accepted
**Date:** October 2025
**Deciders:** Engineering Team

### Context

IndexedDB is the browser's built-in database for offline storage, but its native API is verbose and callback-based.

Options considered:
1. **Native IndexedDB:** Direct API usage
2. **Dexie.js:** Promise-based wrapper with schema management
3. **localForage:** Simple key-value abstraction
4. **PouchDB:** CouchDB-compatible with sync
5. **RxDB:** Reactive database with sync

### Decision

**Use Dexie.js as the IndexedDB wrapper.**

Key features used:
- Promise-based API
- Schema versioning with migrations
- Compound indexes
- Transaction support
- TypeScript definitions

### Rationale

- **Developer experience:** Clean, promise-based API
- **Schema management:** Built-in versioning and migrations
- **Performance:** Minimal overhead over native IndexedDB
- **Flexibility:** Full IndexedDB power without the complexity
- **Stability:** Mature library, active maintenance
- **Size:** Lightweight (~20KB gzipped)

### Consequences

**Positive:**
- Clean, maintainable database code
- Built-in schema migrations
- Strong TypeScript support
- Good performance

**Negative:**
- Additional dependency
- Team must learn Dexie API
- Some advanced IndexedDB features abstracted away

**Rejected Alternatives:**
- PouchDB: Too opinionated about sync (CouchDB-style)
- RxDB: Heavier than needed, complex reactive model
- localForage: Too simple, no schema management

### Related Documents
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Section 7
- [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) - Database Schema

---

## ADR-011: React with TypeScript Frontend Stack

**Status:** Accepted
**Date:** October 2025
**Deciders:** Engineering Team

### Context

Need to select a frontend framework for the Store App that supports:
- Complex UI with multiple views
- State management for offline data
- TypeScript for type safety
- PWA capabilities
- Fast development iteration

### Decision

**Use React 18 with TypeScript, Vite, Redux Toolkit, and Tailwind CSS.**

Full stack:
| Layer | Technology |
|-------|------------|
| UI Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| State Management | Redux Toolkit |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router |
| Forms | React Hook Form + Zod |
| API Client | Axios + TanStack Query |

### Rationale

- **React:** Large ecosystem, excellent tooling, team familiarity
- **TypeScript:** Catch errors at compile time, better refactoring
- **Vite:** Fast development builds, modern tooling
- **Redux Toolkit:** Simplified Redux, good for complex state
- **Tailwind:** Rapid UI development, consistent design system

### Consequences

**Positive:**
- Strong type safety
- Fast development iteration
- Large ecosystem of libraries
- Easy to hire developers

**Negative:**
- Bundle size considerations
- Redux boilerplate (mitigated by Toolkit)
- Must maintain TypeScript types

### Related Documents
- [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) - Technology Stack

---

## ADR-012: Multi-Tenant Architecture with Row-Level Security

**Status:** Accepted
**Date:** October 2025
**Deciders:** Engineering Team

### Context

Mango Biz serves multiple salon businesses (tenants) from a single platform. Data isolation is critical for security and privacy.

Options considered:
1. **Separate databases per tenant:** Complete isolation, high operational overhead
2. **Separate schemas per tenant:** Good isolation, moderate overhead
3. **Shared tables with tenant ID:** Simple, relies on application logic
4. **Shared tables with Row-Level Security (RLS):** Simple, database-enforced isolation

### Decision

**Use shared PostgreSQL tables with Row-Level Security (RLS) enforced at the database level.**

Implementation:
- All tables include `tenant_id` and `store_id` columns
- RLS policies enforce tenant isolation at query level
- Application includes tenant context in all queries
- Compound indexes include tenant/store ID for performance

### Rationale

- **Security:** Database-enforced isolation, not just application logic
- **Simplicity:** Single database, single schema
- **Cost efficiency:** Shared infrastructure across tenants
- **Performance:** Proper indexing handles multi-tenant queries efficiently
- **Compliance:** Each tenant's data provably isolated

### Consequences

**Positive:**
- Strong data isolation
- Simple operational model
- Cost-effective scaling
- Database-level security enforcement

**Negative:**
- RLS adds query overhead
- Must be careful with tenant context
- Cross-tenant queries require elevated privileges
- Noisy neighbor potential (mitigated by proper indexing)

### Related Documents
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Section 5.3 (Data Isolation)

---

## ADR-013: Exponential Backoff with Jitter for Retries

**Status:** Accepted
**Date:** November 2025
**Deciders:** Engineering Team

### Context

Network operations fail. Retry strategies must balance:
- Quick recovery for transient failures
- Not overwhelming servers during outages
- Preventing "thundering herd" when connectivity restores

### Decision

**Implement exponential backoff with jitter for all sync retries.**

Configuration:
```typescript
const RETRY_CONFIG = {
  maxAttempts: 5,
  initialBackoffMs: 1000,      // 1 second
  maxBackoffMs: 300000,        // 5 minutes
  backoffMultiplier: 2,
  jitterFactor: 0.1,           // 10% random jitter
};
```

Retry sequence: 1s -> 2s -> 4s -> 8s -> 16s (capped at 5 min)
With 10% jitter: 0.9s-1.1s -> 1.8s-2.2s -> ...

### Rationale

- **Exponential backoff:** Increasingly longer waits reduce server load during extended outages
- **Jitter:** Prevents all devices from retrying simultaneously
- **Max backoff:** 5 minutes is long enough to wait for most transient issues
- **Max attempts:** 5 attempts before abandoning (user can manually retry)

### Consequences

**Positive:**
- Servers protected from retry storms
- Graceful handling of extended outages
- Distributed retry timing prevents thundering herd
- Predictable retry behavior

**Negative:**
- Failed operations may wait up to 5 minutes between retries
- Users may perceive slow sync during issues
- Abandoned operations require user intervention

### Related Documents
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Section 3.4

---

## ADR-014: Data Retention and Compliance Strategy

**Status:** Accepted
**Date:** November 2025
**Deciders:** Engineering Team, Legal

### Context

Data retention must balance:
- Device storage limitations
- Regulatory compliance (tax records, GDPR)
- User expectations (access to history)
- System performance

### Decision

**Implement tiered retention policies for local and cloud storage.**

Local retention (device storage management):
| Data Type | Retention | Max Count |
|-----------|-----------|-----------|
| Appointments | 90 days | 10,000 |
| Tickets | 1 year | 50,000 |
| Transactions | 1 year | 100,000 |
| Sync queue | 7 days | 1,000 |

Cloud retention (compliance):
| Data Type | Retention | Rationale |
|-----------|-----------|-----------|
| Transactions | 7 years minimum | Tax compliance |
| Audit logs | 7 years | Legal requirements |
| Appointments | Archive after 2 years | Storage optimization |
| Client data | Anonymize after 3 years inactive | GDPR compliance |

### Rationale

- **Local storage:** Devices have limited capacity; keep recent operational data
- **Tax compliance:** 7-year retention for financial records
- **GDPR:** Right to be forgotten after reasonable inactivity period
- **Performance:** Smaller datasets perform better

### Consequences

**Positive:**
- Compliant with tax and privacy regulations
- Device storage managed automatically
- Historical data available for analysis
- Clear data lifecycle

**Negative:**
- Must implement purge jobs
- Users may lose access to very old local data
- Anonymization complexity for GDPR

### Related Documents
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Section 6

---

## ADR-015: Audit Trail on All Mutations

**Status:** Accepted
**Date:** November 2025
**Deciders:** Engineering Team, Compliance

### Context

Salon businesses need accountability for:
- Who changed an appointment?
- Which device processed a payment?
- When was a client's data modified?
- Why was a transaction voided?

### Decision

**Include comprehensive audit fields on all mutable entities.**

Standard audit fields:
```typescript
interface BaseSyncableEntity {
  createdAt: string;
  createdBy: string;           // User ID
  createdByDevice: string;     // Device ID
  updatedAt: string;
  lastModifiedBy: string;      // User ID
  lastModifiedByDevice: string; // Device ID
}
```

For deletions (tombstones):
```typescript
{
  deletedAt?: string;
  deletedBy?: string;
  deletedByDevice?: string;
}
```

Cloud audit logs capture:
- Full before/after state for updates
- IP address and user agent
- Geolocation (if available)
- Session ID

### Rationale

- **Accountability:** Know who made every change
- **Debugging:** Trace issues to specific devices/users
- **Compliance:** Audit trail for financial and regulatory requirements
- **Conflict resolution:** Understand how conflicts arose
- **Trust:** Salon owners can verify staff actions

### Consequences

**Positive:**
- Complete audit trail
- Debugging capability
- Compliance support
- Trust and transparency

**Negative:**
- Additional storage overhead
- Must maintain user/device identity consistently
- Privacy considerations for detailed logging

### Related Documents
- [DATA_STORAGE_STRATEGY.md](./DATA_STORAGE_STRATEGY.md) - Section 2.1

---

## Decision Log Summary

| ADR | Decision | Status |
|-----|----------|--------|
| 001 | Offline-First Architecture | Accepted |
| 002 | Local-First Data with Cloud Sync | Accepted |
| 003 | Field-Level Conflict Resolution | Accepted |
| 004 | Version Vectors for Conflict Detection | Accepted |
| 005 | Server-Wins for Financial Data | Accepted |
| 006 | AES-256-GCM Encryption | Accepted |
| 007 | Tombstone Pattern for Soft Deletes | Accepted |
| 008 | Priority-Based Sync Queue | Accepted |
| 009 | Stripe Terminal for Payments | Accepted |
| 010 | Dexie.js for IndexedDB | Accepted |
| 011 | React + TypeScript Stack | Accepted |
| 012 | Multi-Tenant with RLS | Accepted |
| 013 | Exponential Backoff with Jitter | Accepted |
| 014 | Data Retention Strategy | Accepted |
| 015 | Audit Trail on All Mutations | Accepted |

---

## How to Propose New ADRs

1. **Copy the template** from any existing ADR
2. **Fill in all sections:** Context, Decision, Rationale, Consequences
3. **Submit for review** to Engineering Team
4. **Discuss in architecture meeting**
5. **Update status** to Accepted, Rejected, or Superseded

### ADR Template

```markdown
## ADR-XXX: [Title]

**Status:** Proposed | Accepted | Rejected | Superseded by ADR-XXX
**Date:** [Date]
**Deciders:** [Who made this decision]

### Context
[What is the issue? Why do we need to make a decision?]

### Decision
[What is the change that we're proposing?]

### Rationale
[Why is this the best choice? What alternatives were considered?]

### Consequences
**Positive:**
- [Benefits]

**Negative:**
- [Drawbacks]

**Mitigations:**
- [How we address the negatives]

### Related Documents
- [Links to related docs]
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Nov 30, 2025 | Engineering | Initial ADR compilation |

---

**Document Status:** Active
**Next Review:** February 2026
**Feedback:** engineering@mangobiz.com
