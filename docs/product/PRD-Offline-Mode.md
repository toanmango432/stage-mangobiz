# PRD: Offline-First Architecture

**Product Version:** 1.0
**Document Revision:** 2.0
**Status:** Active
**Author:** Engineering
**Created:** December 1, 2025
**Last Updated:** December 28, 2025

---

## Revision History

| Rev | Date | Author | Changes |
|-----|------|--------|---------|
| 2.0 | Dec 28, 2025 | Engineering | Changed to offline-first default; removed opt-in/opt-out functionality; all devices now offline-enabled by default |
| 1.0 | Dec 1, 2025 | Engineering | Initial draft with opt-in offline mode concept |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [User Stories](#3-user-stories)
4. [Functional Requirements](#4-functional-requirements)
5. [Technical Architecture](#5-technical-architecture)
6. [Data Model](#6-data-model)
7. [Sync Engine](#7-sync-engine)
8. [User Interface](#8-user-interface)
9. [Security Considerations](#9-security-considerations)
10. [Device Management](#10-device-management)
11. [Testing Requirements](#11-testing-requirements)
12. [Implementation Plan](#12-implementation-plan)
13. [Risks & Mitigations](#13-risks--mitigations)

---

## 1. Executive Summary

### 1.1 Overview

Mango POS operates with an **offline-first architecture** where all devices have full offline capability enabled by default. This ensures salon operations continue uninterrupted regardless of internet connectivity.

### 1.2 Core Principle

> **All logins have offline mode enabled by default. There is no opt-in or opt-out.**

Every device that logs into Mango POS automatically:
- Downloads and stores business data locally (IndexedDB)
- Maintains full offline operation capability
- Syncs data bidirectionally with the server when online
- Continues working during internet outages

### 1.3 Key Benefits

| Benefit | Description |
|---------|-------------|
| **Zero Revenue Loss** | Operations continue during internet outages |
| **Fast Performance** | Local-first reads = instant response times |
| **Reliable Operations** | No dependency on network for critical functions |
| **Seamless Experience** | Same UX whether online or offline |
| **Automatic Sync** | Data syncs transparently in background |

### 1.4 Success Criteria

| Metric | Target |
|--------|--------|
| Offline capability | 100% of devices |
| Revenue loss during outages | Zero |
| Data sync accuracy | 100% within 30 seconds of reconnection |
| Local operation response time | < 100ms |
| Sync conflict resolution | Automatic with clear UX for manual cases |

---

## 2. Architecture Overview

### 2.1 Offline-First Principle

```
┌─────────────────────────────────────────────────────────────┐
│                     OFFLINE-FIRST FLOW                       │
│                                                              │
│   User Action → Local Storage (IndexedDB) → UI Update        │
│                         ↓                                    │
│                   Sync Queue                                 │
│                         ↓                                    │
│              (When online) Server Sync                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **Write Operations**: Always write to IndexedDB first, then queue for server sync
2. **Read Operations**: Always read from IndexedDB (instant)
3. **Sync Operations**: Background sync when online, queue when offline

### 2.3 Device States

| State | Description | User Experience |
|-------|-------------|-----------------|
| **Online + Synced** | Connected, all data synced | Normal operation, green indicator |
| **Online + Syncing** | Connected, sync in progress | Normal operation, sync indicator |
| **Online + Pending** | Connected, pending changes | Normal operation, pending count badge |
| **Offline** | No connection | Full operation, offline indicator |

---

## 3. User Stories

### 3.1 Front Desk Staff

```
As front desk staff,
I want the POS to work normally during internet outages,
So that I can continue serving customers without interruption.

Acceptance Criteria:
- All core functions work offline (booking, checkout, client lookup)
- Clear indicator shows offline status
- Changes sync automatically when connection restored
- No data loss during offline periods
```

### 3.2 Salon Owner

```
As a salon owner,
I want peace of mind that an internet outage won't stop my business,
So that I never lose revenue due to technical issues.

Acceptance Criteria:
- Appointments can be booked offline
- Payments can be processed offline (queued)
- Client records accessible offline
- Reports available for cached data
```

### 3.3 Service Provider

```
As a service provider,
I want to see my appointments even without internet,
So that I know my schedule regardless of connectivity.

Acceptance Criteria:
- Full schedule visible offline
- Client history accessible
- Can complete tickets offline
- Tips and commissions tracked
```

---

## 4. Functional Requirements

### 4.1 Core Offline Capabilities

| Feature | Offline Support | Notes |
|---------|-----------------|-------|
| View appointments | Full | All cached data available |
| Create appointments | Full | Queued for sync |
| Modify appointments | Full | Queued for sync |
| Cancel appointments | Full | Queued for sync |
| Client lookup | Full | All clients cached |
| Create client | Full | Queued for sync |
| View tickets | Full | All active tickets cached |
| Complete ticket | Full | Queued for sync |
| Checkout | Full | Payment queued if card |
| Cash payment | Full | Recorded locally |
| Card payment | Partial | Authorized online, can queue |
| View schedule | Full | All appointments cached |
| Staff clock in/out | Full | Queued for sync |
| Reports | Partial | Based on cached data |

### 4.2 Sync Requirements

| Requirement ID | Requirement | Priority |
|----------------|-------------|----------|
| OFF-P0-001 | Initial sync completes within 30 seconds for typical salon | P0 |
| OFF-P0-002 | Incremental sync within 5 seconds | P0 |
| OFF-P0-003 | Conflict detection for concurrent edits | P0 |
| OFF-P0-004 | Automatic retry on sync failure | P0 |
| OFF-P0-005 | Sync queue persists across app restarts | P0 |
| OFF-P1-006 | Manual sync trigger available | P1 |
| OFF-P1-007 | Sync progress indicator | P1 |
| OFF-P1-008 | Sync error notification | P1 |

### 4.3 Data Caching Requirements

| Requirement ID | Requirement | Priority |
|----------------|-------------|----------|
| OFF-P0-009 | Cache all appointments for next 30 days | P0 |
| OFF-P0-010 | Cache all active clients | P0 |
| OFF-P0-011 | Cache all staff members | P0 |
| OFF-P0-012 | Cache all services and pricing | P0 |
| OFF-P0-013 | Cache open tickets | P0 |
| OFF-P1-014 | Cache appointment history (90 days) | P1 |
| OFF-P1-015 | Cache transaction history (30 days) | P1 |
| OFF-P2-016 | Configurable cache duration | P2 |

---

## 5. Technical Architecture

### 5.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Application                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   UI Layer   │───▶│ Redux Store  │◀──▶│  IndexedDB   │       │
│  └──────────────┘    └──────────────┘    │   (Dexie)    │       │
│                              │           └──────────────┘       │
│                              │                   │               │
│                              ▼                   ▼               │
│                    ┌──────────────────────────────────┐         │
│                    │         Data Service             │         │
│                    │   (Unified data access layer)    │         │
│                    └────────────────┬─────────────────┘         │
│                                     │                            │
│                                     ▼                            │
│                    ┌──────────────────────────────────┐         │
│                    │          Sync Engine             │         │
│                    │  ┌────────────┐ ┌─────────────┐  │         │
│                    │  │ Sync Queue │ │ Conflict    │  │         │
│                    │  │            │ │ Resolution  │  │         │
│                    │  └────────────┘ └─────────────┘  │         │
│                    └────────────────┬─────────────────┘         │
│                                     │                            │
└─────────────────────────────────────┼────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │   Realtime   │  │     Auth     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Data Service Pattern

```typescript
// src/services/dataService.ts

class DataService {
  // All operations are local-first

  async getAppointments(date: string): Promise<Appointment[]> {
    // 1. Read from IndexedDB (instant)
    const appointments = await db.appointments.where('date').equals(date).toArray();

    // 2. Trigger background sync if online
    if (navigator.onLine) {
      this.syncAppointments(date);
    }

    return appointments;
  }

  async createAppointment(appointment: Appointment): Promise<Appointment> {
    // 1. Write to IndexedDB
    await db.appointments.add(appointment);

    // 2. Add to sync queue
    await syncQueue.add({
      operation: 'create',
      table: 'appointments',
      data: appointment,
      timestamp: Date.now()
    });

    // 3. Trigger sync if online
    if (navigator.onLine) {
      syncEngine.processQueue();
    }

    return appointment;
  }
}
```

### 5.3 Sync Queue Structure

```typescript
interface SyncQueueEntry {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  recordId: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
}
```

---

## 6. Data Model

### 6.1 Local Storage (IndexedDB via Dexie)

```typescript
// src/db/database.ts

class MangoDatabase extends Dexie {
  appointments!: Table<Appointment>;
  clients!: Table<Client>;
  staff!: Table<Staff>;
  services!: Table<Service>;
  tickets!: Table<Ticket>;
  transactions!: Table<Transaction>;
  syncQueue!: Table<SyncQueueEntry>;
  syncMetadata!: Table<SyncMetadata>;

  constructor() {
    super('MangoPOS');

    this.version(1).stores({
      appointments: 'id, date, staffId, clientId, status, syncStatus',
      clients: 'id, phone, email, syncStatus',
      staff: 'id, syncStatus',
      services: 'id, categoryId, syncStatus',
      tickets: 'id, status, syncStatus',
      transactions: 'id, ticketId, date, syncStatus',
      syncQueue: 'id, table, status, timestamp',
      syncMetadata: 'key'
    });
  }
}
```

### 6.2 Sync Status Fields

All synced tables include:

```typescript
interface SyncableRecord {
  id: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
  syncVersion: number;
  localUpdatedAt: string;
  serverUpdatedAt: string;
}
```

### 6.3 Sync Metadata

```typescript
interface SyncMetadata {
  key: string;  // 'last_sync'
  lastSyncAt: string;
  lastSyncVersion: number;
  pendingCount: number;
}
```

---

## 7. Sync Engine

### 7.1 Sync Flow

```
App Start
    │
    ▼
┌─────────────────┐
│ Check Network   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
Online    Offline
    │         │
    ▼         ▼
┌─────────┐ ┌─────────────┐
│  Sync   │ │ Use cached  │
│  Data   │ │ data only   │
└────┬────┘ └─────────────┘
     │
     ▼
┌─────────────────┐
│ Process Queue   │
│ (pending ops)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pull Changes    │
│ (from server)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Resolve         │
│ Conflicts       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Local    │
│ State           │
└─────────────────┘
```

### 7.2 Conflict Resolution

| Conflict Type | Resolution Strategy |
|---------------|---------------------|
| Same record, different fields | Merge fields |
| Same record, same field | Last-write-wins (server) |
| Delete vs. Update | Delete wins |
| Concurrent creates | Both kept, notify user |

### 7.3 Sync Priority

| Priority | Data Type | Sync Frequency |
|----------|-----------|----------------|
| 1 (Critical) | Transactions, Payments | Immediate |
| 2 (High) | Appointments, Tickets | Every 30 seconds |
| 3 (Normal) | Clients, Staff | Every 5 minutes |
| 4 (Low) | Services, Settings | On demand |

---

## 8. User Interface

### 8.1 Connection Status Indicator (Header)

**Online + Synced:**
```
┌─────────────────────────────────────────┐
│ ✅ Synced         │ Store Name │ 👤 User │
└─────────────────────────────────────────┘
```

**Online + Syncing:**
```
┌─────────────────────────────────────────┐
│ 🔄 Syncing...     │ Store Name │ 👤 User │
└─────────────────────────────────────────┘
```

**Online + Pending Changes:**
```
┌─────────────────────────────────────────┐
│ 🔄 3 pending      │ Store Name │ 👤 User │
└─────────────────────────────────────────┘
```

**Offline:**
```
┌─────────────────────────────────────────┐
│ 📴 Offline        │ Store Name │ 👤 User │
└─────────────────────────────────────────┘
```

### 8.2 Sync Status Panel (Expandable)

```
┌─────────────────────────────────────────────────────────────────┐
│ Sync Status                                          [Sync Now] │
├─────────────────────────────────────────────────────────────────┤
│ Last synced: 2 minutes ago                                      │
│ Pending changes: 3                                              │
├─────────────────────────────────────────────────────────────────┤
│ ⏳ Appointment #APT-123 - Update                    2 min ago   │
│ ⏳ Client Sarah Johnson - New                       5 min ago   │
│ ⏳ Transaction #TXN-456 - Payment                   5 min ago   │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Offline Banner (When Offline)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📴 You're offline. All changes will sync when connected.       │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 Conflict Resolution Modal

```
┌─────────────────────────────────────────┐
│ Sync Conflict                       ✕   │
├─────────────────────────────────────────┤
│                                         │
│ This appointment was modified on        │
│ another device.                         │
│                                         │
│ Your version:                           │
│ ┌─────────────────────────────────────┐ │
│ │ 10:00 AM - Haircut with Sarah       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Server version:                         │
│ ┌─────────────────────────────────────┐ │
│ │ 10:30 AM - Haircut with Sarah       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────┐  ┌──────────────────┐   │
│ │ Keep Mine   │  │ Use Server       │   │
│ └─────────────┘  └──────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 9. Security Considerations

### 9.1 Data Encryption

| Data Type | Storage | Encryption |
|-----------|---------|------------|
| Business data | IndexedDB | AES-256 at rest |
| Auth tokens | Secure storage | Platform secure storage |
| Sync queue | IndexedDB | Encrypted |
| Cache | IndexedDB | Encrypted |

### 9.2 Data Retention

| Data | Retention Period | Cleanup Trigger |
|------|------------------|-----------------|
| Appointments | 90 days past | Daily cleanup |
| Transactions | 30 days | Daily cleanup |
| Clients | Active only | Sync-based |
| Sync queue | Until synced | After successful sync |

### 9.3 Logout Behavior

On logout, the following data is cleared:
- Auth tokens
- Sync queue
- Redux state

The following is retained for faster re-login:
- Business data cache (optional, configurable)
- Device registration

---

## 10. Device Management

### 10.1 Device Registration

All devices are automatically registered on first login:

```typescript
interface DeviceRegistration {
  deviceId: string;
  deviceFingerprint: string;
  deviceName: string;
  deviceType: 'ios' | 'android' | 'web' | 'desktop';
  registeredAt: string;
  lastLoginAt: string;
  lastSyncAt: string;
}
```

### 10.2 Device Revocation

Administrators can revoke device access:
- Revoked devices are logged out immediately
- Local data is cleared on next app open
- Device cannot re-login until revocation is lifted

### 10.3 Admin Device View

```
┌─────────────────────────────────────────────────────────────────┐
│ Registered Devices                                              │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📱 Front Desk iPad #1                                       │ │
│ │ iOS • Last seen: 2 min ago • Last sync: 2 min ago           │ │
│ │ Pending changes: 0                              [Revoke]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📱 Front Desk iPad #2                                       │ │
│ │ iOS • Last seen: 5 min ago • Last sync: 5 min ago           │ │
│ │ Pending changes: 3                              [Revoke]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Testing Requirements

### 11.1 Offline Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| App starts offline | Load cached data, show offline indicator |
| Connection lost during use | Continue working, queue changes |
| Connection restored | Auto-sync queued changes |
| Large sync queue (100+ items) | Process in batches, show progress |
| Sync failure | Retry with exponential backoff |
| Conflict detected | Show resolution UI |

### 11.2 Performance Targets

| Metric | Target |
|--------|--------|
| Initial sync (empty cache) | < 30 seconds |
| Incremental sync | < 5 seconds |
| Local read operation | < 50ms |
| Local write operation | < 100ms |
| Sync queue processing | 10 items/second |

### 11.3 Edge Cases

| Case | Handling |
|------|----------|
| IndexedDB full | Cleanup old data, notify user |
| Browser clears storage | Re-sync on next login |
| Multiple tabs | Single sync coordinator |
| App crash during sync | Resume on restart |

---

## 12. Implementation Plan

### Phase 1: Core Offline Storage (Week 1-2)
- [ ] IndexedDB schema setup (Dexie)
- [ ] Data service layer
- [ ] Initial sync on login
- [ ] Basic CRUD operations offline

### Phase 2: Sync Engine (Week 3-4)
- [ ] Sync queue implementation
- [ ] Background sync service
- [ ] Conflict detection
- [ ] Retry logic

### Phase 3: UI Integration (Week 5)
- [ ] Connection status indicator
- [ ] Sync status panel
- [ ] Offline banner
- [ ] Conflict resolution UI

### Phase 4: Polish & Testing (Week 6)
- [ ] Performance optimization
- [ ] Edge case handling
- [ ] Full test coverage
- [ ] Documentation

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| IndexedDB storage limits | Low | High | Data retention policy, cleanup |
| Sync conflicts | Medium | Medium | Clear conflict resolution UX |
| Data corruption | Low | High | Validation, checksums |
| Performance degradation | Medium | Medium | Indexing, pagination |
| Browser compatibility | Low | Medium | Feature detection, fallbacks |

---

## Appendix

### A. Related Documents

- [DATA_STORAGE_STRATEGY.md](../architecture/DATA_STORAGE_STRATEGY.md)
- [TECHNICAL_DOCUMENTATION.md](../architecture/TECHNICAL_DOCUMENTATION.md)
- [PRD-Device-Manager-Module.md](./PRD-Device-Manager-Module.md)

### B. Glossary

| Term | Definition |
|------|------------|
| **Offline-First** | Architecture where local storage is primary, server sync is secondary |
| **Sync Queue** | Pending operations waiting to sync to server |
| **Conflict** | Same record modified on multiple devices |
| **IndexedDB** | Browser-based NoSQL database for local storage |

---

*Document Status: Active*
