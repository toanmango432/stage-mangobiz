# Schedule Module - Production-Ready Implementation Plan

**Version:** 1.0
**Created:** December 1, 2025
**Status:** Ready for Implementation
**Architecture Alignment:** Based on `docs/TECHNICAL_DOCUMENTATION.md` and `docs/DATA_STORAGE_STRATEGY.md`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Entity Schemas](#2-entity-schemas)
3. [Database Schema](#3-database-schema)
4. [Sync & Conflict Resolution](#4-sync--conflict-resolution)
5. [Redux State Management](#5-redux-state-management)
6. [Service Layer](#6-service-layer)
7. [Phase 1: Core Types & Database](#phase-1-core-types--database)
8. [Phase 2: Time-Off Management](#phase-2-time-off-management)
9. [Phase 3: Blocked Time Management](#phase-3-blocked-time-management)
10. [Phase 4: Business Closures](#phase-4-business-closures)
11. [Phase 5: Multi-Week Patterns](#phase-5-multi-week-patterns)
12. [Phase 6: Resource Scheduling](#phase-6-resource-scheduling)
13. [Phase 7: Reports & Analytics](#phase-7-reports--analytics)
14. [Testing Strategy](#testing-strategy)
15. [Migration Plan](#migration-plan)

---

## 1. Architecture Overview

### Alignment with Existing System

The Schedule Module follows the established Mango POS architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    SCHEDULE MODULE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ React Components│  │  Redux Slices   │  │   Hooks     │ │
│  │  (Presentation) │  │    (State)      │  │  (Logic)    │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                   │        │
│           ▼                    ▼                   ▼        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Schedule Service Layer                   │  │
│  │  scheduleService.ts | timeOffService.ts | etc.       │  │
│  └────────────────────────┬─────────────────────────────┘  │
│                           │                                 │
│           ┌───────────────┼───────────────┐                │
│           ▼               ▼               ▼                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │  IndexedDB  │  │  Sync Queue │  │  Secure Storage │    │
│  │   (Dexie)   │  │             │  │                 │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles Applied

| Principle | Implementation |
|-----------|---------------|
| **Offline-First** | All schedule data stored in IndexedDB first |
| **Optimistic UI** | Immediate feedback on all schedule changes |
| **Automatic Sync** | Background sync with priority queue |
| **Conflict Resolution** | Field-level merging for schedules, time-off |
| **Audit Everything** | All mutations tracked with user, device, timestamp |

### Data Storage Categories

| Entity | Category | Sync Direction | Priority |
|--------|----------|----------------|----------|
| TimeOffTypes | Local + Cloud | Bidirectional | LOW (4) |
| TimeOffRequests | Local + Cloud | Bidirectional | NORMAL (3) |
| BlockedTimeTypes | Local + Cloud | Bidirectional | LOW (4) |
| BlockedTimeEntries | Local + Cloud | Bidirectional | NORMAL (3) |
| BusinessClosedPeriods | Local + Cloud | Bidirectional | NORMAL (3) |
| Resources | Local + Cloud | Bidirectional | LOW (4) |
| ResourceBookings | Local + Cloud | Bidirectional | HIGH (2) |
| StaffSchedules | Local + Cloud | Bidirectional | NORMAL (3) |

---

## 2. Entity Schemas

### 2.1 Base Schedule Entity

All schedule entities extend `BaseSyncableEntity`:

```typescript
// src/types/entities/schedule/base.ts

import { BaseSyncableEntity, SyncStatus } from '../base';

/**
 * Base interface for all schedule-related entities.
 * Extends BaseSyncableEntity with schedule-specific metadata.
 */
export interface BaseScheduleEntity extends BaseSyncableEntity {
  // Inherited from BaseSyncableEntity:
  // id, tenantId, storeId, locationId
  // syncStatus, version, vectorClock, lastSyncedVersion
  // createdAt, updatedAt, createdBy, createdByDevice
  // lastModifiedBy, lastModifiedByDevice
  // isDeleted, deletedAt, deletedBy, deletedByDevice, tombstoneExpiresAt
}
```

### 2.2 Time-Off Types

```typescript
// src/types/entities/schedule/timeOffType.ts

export interface TimeOffType extends BaseScheduleEntity {
  // Identity
  name: string;                    // "Vacation", "Sick Leave", etc.
  code: string;                    // Short code: "VAC", "SICK"

  // Visual
  emoji: string;                   // "🏖️", "🤒"
  color: string;                   // Hex color: "#10B981"

  // Configuration
  isPaid: boolean;                 // Affects payroll calculations
  requiresApproval: boolean;       // Manager must approve

  // Limits (optional)
  annualLimitDays: number | null;  // null = unlimited
  accrualEnabled: boolean;         // Whether days accrue over time
  accrualRatePerMonth: number | null; // Days accrued per month
  carryOverEnabled: boolean;       // Unused days carry to next year
  maxCarryOverDays: number | null; // Maximum days to carry over

  // Display
  displayOrder: number;            // Sort order in UI
  isActive: boolean;               // Soft toggle (not deleted)
  isDefault: boolean;              // System-provided type
}

// Default time-off types seeded on initialization
export const DEFAULT_TIME_OFF_TYPES: Partial<TimeOffType>[] = [
  {
    name: 'Vacation',
    code: 'VAC',
    emoji: '🏖️',
    color: '#10B981',
    isPaid: true,
    requiresApproval: true,
    annualLimitDays: null,
    displayOrder: 1,
    isDefault: true,
  },
  {
    name: 'Sick Leave',
    code: 'SICK',
    emoji: '🤒',
    color: '#EF4444',
    isPaid: true,
    requiresApproval: false,
    annualLimitDays: null,
    displayOrder: 2,
    isDefault: true,
  },
  {
    name: 'Personal Day',
    code: 'PTO',
    emoji: '🏠',
    color: '#8B5CF6',
    isPaid: true,
    requiresApproval: true,
    annualLimitDays: null,
    displayOrder: 3,
    isDefault: true,
  },
  {
    name: 'Unpaid Leave',
    code: 'UNPAID',
    emoji: '📋',
    color: '#6B7280',
    isPaid: false,
    requiresApproval: true,
    annualLimitDays: null,
    displayOrder: 4,
    isDefault: true,
  },
  {
    name: 'Maternity/Paternity',
    code: 'MAT',
    emoji: '👶',
    color: '#EC4899',
    isPaid: true,
    requiresApproval: true,
    annualLimitDays: null,
    displayOrder: 5,
    isDefault: true,
  },
  {
    name: 'Bereavement',
    code: 'BRV',
    emoji: '🕯️',
    color: '#1F2937',
    isPaid: true,
    requiresApproval: false,
    annualLimitDays: null,
    displayOrder: 6,
    isDefault: true,
  },
];
```

### 2.3 Time-Off Requests

```typescript
// src/types/entities/schedule/timeOffRequest.ts

export interface TimeOffRequest extends BaseScheduleEntity {
  // Staff reference
  staffId: string;
  staffName: string;               // Denormalized for offline display

  // Type reference
  typeId: string;
  typeName: string;                // Denormalized
  typeEmoji: string;               // Denormalized
  typeColor: string;               // Denormalized
  isPaid: boolean;                 // Snapshot from type at request time

  // Date range
  startDate: string;               // ISO 8601 date: "2025-12-25"
  endDate: string;                 // ISO 8601 date: "2025-12-26"
  isAllDay: boolean;               // Full day(s) vs partial
  startTime?: string;              // HH:mm if not all day
  endTime?: string;                // HH:mm if not all day

  // Calculated values
  totalHours: number;              // Based on scheduled shifts
  totalDays: number;               // Number of working days affected

  // Status workflow
  status: TimeOffRequestStatus;
  statusHistory: TimeOffStatusChange[];

  // Request details
  notes?: string;                  // Requester's notes

  // Approval details
  approvedBy?: string;             // Manager user ID
  approvedByName?: string;         // Denormalized
  approvedAt?: string;             // ISO 8601
  approvalNotes?: string;          // Manager's approval note

  // Denial details
  deniedBy?: string;
  deniedByName?: string;
  deniedAt?: string;
  denialReason?: string;           // Required when denying

  // Cancellation details
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;

  // Conflict tracking
  hasConflicts: boolean;           // Appointments exist on these dates
  conflictingAppointmentIds?: string[];
}

export type TimeOffRequestStatus =
  | 'pending'      // Awaiting manager review
  | 'approved'     // Approved by manager
  | 'denied'       // Denied by manager
  | 'cancelled'    // Cancelled by requester or manager
  | 'expired';     // Past date, never approved

export interface TimeOffStatusChange {
  from: TimeOffRequestStatus | null; // null for initial creation
  to: TimeOffRequestStatus;
  changedAt: string;
  changedBy: string;
  changedByDevice: string;
  reason?: string;
}
```

### 2.4 Blocked Time Types

```typescript
// src/types/entities/schedule/blockedTimeType.ts

export interface BlockedTimeType extends BaseScheduleEntity {
  // Identity
  name: string;                    // "Lunch Break", "Training", etc.
  code: string;                    // Short code: "LUNCH", "TRAIN"

  // Visual
  emoji: string;                   // "🍽️", "📚"
  color: string;                   // Hex color

  // Configuration
  defaultDurationMinutes: number;  // Auto-fill duration
  isPaid: boolean;                 // For payroll/reporting

  // Booking behavior
  blocksOnlineBooking: boolean;    // Prevent online appointments
  blocksInStoreBooking: boolean;   // Warn/prevent in-store appointments

  // Display
  displayOrder: number;
  isActive: boolean;
  isDefault: boolean;              // System-provided type
}

export const DEFAULT_BLOCKED_TIME_TYPES: Partial<BlockedTimeType>[] = [
  {
    name: 'Lunch Break',
    code: 'LUNCH',
    emoji: '🍽️',
    color: '#F59E0B',
    defaultDurationMinutes: 60,
    isPaid: false,
    blocksOnlineBooking: true,
    blocksInStoreBooking: true,
    displayOrder: 1,
    isDefault: true,
  },
  {
    name: 'Coffee Break',
    code: 'COFFEE',
    emoji: '☕',
    color: '#92400E',
    defaultDurationMinutes: 15,
    isPaid: true,
    blocksOnlineBooking: true,
    blocksInStoreBooking: true,
    displayOrder: 2,
    isDefault: true,
  },
  {
    name: 'Training',
    code: 'TRAIN',
    emoji: '📚',
    color: '#3B82F6',
    defaultDurationMinutes: 120,
    isPaid: true,
    blocksOnlineBooking: true,
    blocksInStoreBooking: true,
    displayOrder: 3,
    isDefault: true,
  },
  {
    name: 'Team Meeting',
    code: 'MTG',
    emoji: '👥',
    color: '#8B5CF6',
    defaultDurationMinutes: 30,
    isPaid: true,
    blocksOnlineBooking: true,
    blocksInStoreBooking: true,
    displayOrder: 4,
    isDefault: true,
  },
  {
    name: 'Admin Tasks',
    code: 'ADMIN',
    emoji: '📋',
    color: '#6B7280',
    defaultDurationMinutes: 30,
    isPaid: true,
    blocksOnlineBooking: true,
    blocksInStoreBooking: false, // Allow override
    displayOrder: 5,
    isDefault: true,
  },
  {
    name: 'Cleaning/Setup',
    code: 'CLEAN',
    emoji: '🧹',
    color: '#10B981',
    defaultDurationMinutes: 30,
    isPaid: true,
    blocksOnlineBooking: true,
    blocksInStoreBooking: false,
    displayOrder: 6,
    isDefault: true,
  },
  {
    name: 'Personal Time',
    code: 'PERS',
    emoji: '🏃',
    color: '#EC4899',
    defaultDurationMinutes: 15,
    isPaid: false,
    blocksOnlineBooking: true,
    blocksInStoreBooking: true,
    displayOrder: 7,
    isDefault: true,
  },
];
```

### 2.5 Blocked Time Entries

```typescript
// src/types/entities/schedule/blockedTimeEntry.ts

export interface BlockedTimeEntry extends BaseScheduleEntity {
  // Staff reference
  staffId: string;
  staffName: string;               // Denormalized

  // Type reference
  typeId: string;
  typeName: string;                // Denormalized
  typeEmoji: string;               // Denormalized
  typeColor: string;               // Denormalized
  isPaid: boolean;                 // Snapshot from type

  // Timing
  startDateTime: string;           // ISO 8601
  endDateTime: string;             // ISO 8601
  durationMinutes: number;         // Calculated

  // Recurrence
  frequency: BlockedTimeFrequency;
  repeatEndDate?: string;          // When recurrence ends
  repeatCount?: number;            // Alternative: end after N occurrences

  // For recurring entries, track the series
  seriesId?: string;               // Links recurring entries together
  isRecurrenceException?: boolean; // Modified occurrence
  originalDate?: string;           // Original date if exception

  // Notes
  notes?: string;

  // Created by context
  createdByStaffId?: string;       // If staff created for themselves
  createdByManagerId?: string;     // If manager created for staff
}

export type BlockedTimeFrequency =
  | 'once'         // One-time block
  | 'daily'        // Every day
  | 'weekly'       // Same day each week
  | 'biweekly'     // Every 2 weeks
  | 'monthly';     // Same day each month

// Expanded occurrences for a recurring blocked time
export interface BlockedTimeOccurrence {
  entryId: string;                 // Reference to parent entry
  date: string;                    // Specific date: "2025-12-25"
  startTime: string;               // HH:mm
  endTime: string;                 // HH:mm
  isException: boolean;            // Was this occurrence modified?
  isCancelled: boolean;            // Was this occurrence removed?
}
```

### 2.6 Business Closed Periods

```typescript
// src/types/entities/schedule/businessClosedPeriod.ts

export interface BusinessClosedPeriod extends BaseScheduleEntity {
  // Identity
  name: string;                    // "Christmas Day", "Staff Training"

  // Scope
  appliesToAllLocations: boolean;
  locationIds?: string[];          // Specific locations if not all

  // Date range
  startDate: string;               // ISO 8601 date
  endDate: string;                 // ISO 8601 date

  // Partial day support
  isPartialDay: boolean;
  startTime?: string;              // HH:mm for partial day
  endTime?: string;                // HH:mm for partial day

  // Booking behavior
  blocksOnlineBooking: boolean;
  blocksInStoreBooking: boolean;

  // Display
  color: string;                   // For calendar display
  notes?: string;

  // Recurrence (for annual holidays)
  isAnnual: boolean;               // Repeats yearly

  // Impact tracking
  affectedAppointmentCount?: number;
  affectedAppointmentIds?: string[];
}
```

### 2.7 Resources

```typescript
// src/types/entities/schedule/resource.ts

export interface Resource extends BaseScheduleEntity {
  // Identity
  name: string;                    // "Massage Room 1", "Nail Station A"
  description?: string;

  // Categorization
  category: ResourceCategory;

  // Location
  locationId?: string;             // Specific location
  locationName?: string;           // Denormalized

  // Configuration
  capacity: number;                // Usually 1, but could be more
  isBookable: boolean;             // Can be booked for appointments

  // Display
  color: string;
  imageUrl?: string;
  displayOrder: number;

  // Status
  isActive: boolean;

  // Linked services
  linkedServiceIds?: string[];     // Services that can use this resource
}

export type ResourceCategory =
  | 'room'
  | 'equipment'
  | 'station'
  | 'other';
```

### 2.8 Resource Bookings

```typescript
// src/types/entities/schedule/resourceBooking.ts

export interface ResourceBooking extends BaseScheduleEntity {
  // Resource reference
  resourceId: string;
  resourceName: string;            // Denormalized

  // Appointment reference
  appointmentId: string;

  // Timing (copied from appointment)
  startDateTime: string;           // ISO 8601
  endDateTime: string;             // ISO 8601

  // Staff context
  staffId: string;
  staffName: string;               // Denormalized

  // Assignment method
  assignmentType: 'auto' | 'manual';
  assignedBy?: string;             // User ID if manual
}
```

### 2.9 Staff Schedule (Enhanced)

```typescript
// src/types/entities/schedule/staffSchedule.ts

export interface StaffSchedule extends BaseScheduleEntity {
  // Staff reference
  staffId: string;
  staffName: string;               // Denormalized

  // Schedule pattern
  patternType: SchedulePatternType;
  patternWeeks: number;            // 1, 2, 3, or 4 week pattern

  // Week definitions
  weeks: WeekSchedule[];           // Array of week patterns

  // Effective dates
  effectiveFrom: string;           // When this schedule starts
  effectiveUntil?: string;         // When this schedule ends (null = ongoing)

  // Source
  isDefault: boolean;              // From initial staff setup
  copiedFromScheduleId?: string;   // If copied from another schedule
}

export type SchedulePatternType =
  | 'fixed'        // Same every week
  | 'rotating';    // Rotates over patternWeeks

export interface WeekSchedule {
  weekNumber: number;              // 1-4 in the pattern
  days: DayScheduleConfig[];       // 7 days (0=Sunday to 6=Saturday)
}

export interface DayScheduleConfig {
  dayOfWeek: number;               // 0-6
  isWorking: boolean;
  shifts: ShiftConfig[];           // Multiple shifts per day (split shifts)
}

export interface ShiftConfig {
  startTime: string;               // HH:mm
  endTime: string;                 // HH:mm
  type: 'regular' | 'overtime';
  notes?: string;
}
```

---

## 3. Database Schema

### 3.1 IndexedDB Schema Update

```typescript
// src/db/schema.ts

// Add to existing Dexie schema (increment version)
db.version(4).stores({
  // === EXISTING TABLES (unchanged) ===
  appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+createdAt], [storeId+isDeleted]',

  tickets: 'id, ticketNumber, storeId, clientId, appointmentId, status, createdAt, [storeId+status], [storeId+createdAt], [clientId+createdAt]',

  transactions: 'id, ticketId, ticketNumber, storeId, clientId, status, paymentMethod, createdAt, [storeId+createdAt], [storeId+status], [clientId+createdAt]',

  clients: 'id, storeId, email, phone, displayName, lastVisitAt, [storeId+displayName], [storeId+phone], [storeId+email], [storeId+lastVisitAt], [storeId+isDeleted]',

  staff: 'id, storeId, email, role, status, [storeId+status], [storeId+role], [storeId+isDeleted]',

  services: 'id, storeId, categoryId, isActive, displayOrder, [storeId+categoryId], [storeId+isActive], [storeId+isDeleted]',

  products: 'id, storeId, sku, barcode, categoryId, isActive, [storeId+categoryId], [storeId+isActive], [storeId+isDeleted]',

  syncQueue: '++localId, id, entity, entityId, status, priority, createdAt, [status+priority], [entity+entityId]',

  syncMeta: 'entity',
  conflicts: 'id, entityType, entityId, status, createdAt, [status+createdAt]',
  syncErrors: '++localId, entity, entityId, createdAt',
  cache: 'key, expiresAt',
  settings: 'key',

  // === NEW SCHEDULE TABLES ===

  // Time-Off Types
  timeOffTypes: 'id, storeId, code, isActive, displayOrder, isDefault, syncStatus, [storeId+isActive], [storeId+displayOrder], [storeId+isDeleted]',

  // Time-Off Requests
  timeOffRequests: 'id, storeId, staffId, typeId, status, startDate, endDate, syncStatus, [storeId+status], [storeId+startDate], [staffId+status], [staffId+startDate], [storeId+staffId+status], [storeId+isDeleted]',

  // Blocked Time Types
  blockedTimeTypes: 'id, storeId, code, isActive, displayOrder, isDefault, syncStatus, [storeId+isActive], [storeId+displayOrder], [storeId+isDeleted]',

  // Blocked Time Entries
  blockedTimeEntries: 'id, storeId, staffId, typeId, startDateTime, endDateTime, frequency, seriesId, syncStatus, [storeId+staffId], [staffId+startDateTime], [storeId+startDateTime], [seriesId], [storeId+isDeleted]',

  // Business Closed Periods
  businessClosedPeriods: 'id, storeId, startDate, endDate, isAnnual, syncStatus, [storeId+startDate], [storeId+endDate], [storeId+isDeleted]',

  // Resources
  resources: 'id, storeId, locationId, category, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+category], [storeId+locationId], [storeId+isDeleted]',

  // Resource Bookings
  resourceBookings: 'id, storeId, resourceId, appointmentId, startDateTime, syncStatus, [resourceId+startDateTime], [appointmentId], [storeId+startDateTime], [storeId+isDeleted]',

  // Staff Schedules
  staffSchedules: 'id, storeId, staffId, effectiveFrom, effectiveUntil, syncStatus, [storeId+staffId], [staffId+effectiveFrom], [storeId+isDeleted]',

  // Time-Off Balances (Local cache of calculated balances)
  timeOffBalances: 'id, storeId, staffId, typeId, year, [storeId+staffId+year], [staffId+typeId+year]',
});
```

### 3.2 Database Table Interfaces

```typescript
// src/db/tables.ts

import Dexie, { Table } from 'dexie';
import { TimeOffType, TimeOffRequest } from '../types/entities/schedule/timeOff';
import { BlockedTimeType, BlockedTimeEntry } from '../types/entities/schedule/blockedTime';
import { BusinessClosedPeriod } from '../types/entities/schedule/closedPeriod';
import { Resource, ResourceBooking } from '../types/entities/schedule/resource';
import { StaffSchedule } from '../types/entities/schedule/staffSchedule';

// Extend existing MangoBizDB interface
declare module './database' {
  interface MangoBizDB {
    // Schedule tables
    timeOffTypes: Table<TimeOffType, string>;
    timeOffRequests: Table<TimeOffRequest, string>;
    blockedTimeTypes: Table<BlockedTimeType, string>;
    blockedTimeEntries: Table<BlockedTimeEntry, string>;
    businessClosedPeriods: Table<BusinessClosedPeriod, string>;
    resources: Table<Resource, string>;
    resourceBookings: Table<ResourceBooking, string>;
    staffSchedules: Table<StaffSchedule, string>;
    timeOffBalances: Table<TimeOffBalance, string>;
  }
}

export interface TimeOffBalance {
  id: string;
  storeId: string;
  staffId: string;
  typeId: string;
  year: number;

  // Balance tracking
  accrued: number;           // Days accrued this year
  used: number;              // Days used this year
  pending: number;           // Days in pending requests
  available: number;         // accrued - used - pending
  carriedOver: number;       // From previous year

  // Audit
  lastCalculatedAt: string;
  calculatedBy: 'system' | 'manual';
}
```

---

## 4. Sync & Conflict Resolution

### 4.1 Sync Configuration

```typescript
// src/db/sync/scheduleSync.ts

import { SYNC_PRIORITIES, ConflictResolutionConfig } from './types';

// Sync priorities for schedule entities
export const SCHEDULE_SYNC_PRIORITIES = {
  timeOffTypes: SYNC_PRIORITIES.LOW,           // 4
  timeOffRequests: SYNC_PRIORITIES.NORMAL,     // 3
  blockedTimeTypes: SYNC_PRIORITIES.LOW,       // 4
  blockedTimeEntries: SYNC_PRIORITIES.NORMAL,  // 3
  businessClosedPeriods: SYNC_PRIORITIES.NORMAL, // 3
  resources: SYNC_PRIORITIES.LOW,              // 4
  resourceBookings: SYNC_PRIORITIES.HIGH,      // 2 - Affects appointments
  staffSchedules: SYNC_PRIORITIES.NORMAL,      // 3
};

// Conflict resolution strategies
export const SCHEDULE_CONFLICT_CONFIG: Record<string, ConflictResolutionConfig> = {
  timeOffTypes: {
    entity: 'timeOffTypes',
    defaultStrategy: 'server-wins', // Reference data
    fieldRules: {},
  },

  timeOffRequests: {
    entity: 'timeOffRequests',
    defaultStrategy: 'field-merge',
    fieldRules: {
      status: 'server',              // Server controls approval workflow
      statusHistory: 'merge-array',
      approvedBy: 'server',
      approvedAt: 'server',
      deniedBy: 'server',
      deniedAt: 'server',
      notes: 'merge-concat',
      approvalNotes: 'server',
      denialReason: 'server',
    },
  },

  blockedTimeTypes: {
    entity: 'blockedTimeTypes',
    defaultStrategy: 'server-wins', // Reference data
    fieldRules: {},
  },

  blockedTimeEntries: {
    entity: 'blockedTimeEntries',
    defaultStrategy: 'field-merge',
    fieldRules: {
      startDateTime: 'latest',
      endDateTime: 'latest',
      notes: 'merge-concat',
    },
  },

  businessClosedPeriods: {
    entity: 'businessClosedPeriods',
    defaultStrategy: 'server-wins', // Business-wide setting
    fieldRules: {},
  },

  resources: {
    entity: 'resources',
    defaultStrategy: 'server-wins', // Reference data
    fieldRules: {},
  },

  resourceBookings: {
    entity: 'resourceBookings',
    defaultStrategy: 'server-wins', // Prevent double-booking
    fieldRules: {},
  },

  staffSchedules: {
    entity: 'staffSchedules',
    defaultStrategy: 'field-merge',
    fieldRules: {
      weeks: 'latest',               // Take most recent schedule changes
      effectiveFrom: 'latest',
      effectiveUntil: 'latest',
    },
  },
};
```

### 4.2 Data Retention Policies

```typescript
// src/db/retention/scheduleRetention.ts

export const SCHEDULE_RETENTION_POLICY = {
  local: {
    timeOffRequests: {
      maxCount: 5000,
      maxAge: 365 * 24 * 60 * 60 * 1000,      // 1 year
      keepApproved: 180 * 24 * 60 * 60 * 1000, // Keep approved for 6 months
    },
    blockedTimeEntries: {
      maxCount: 10000,
      maxAge: 90 * 24 * 60 * 60 * 1000,        // 90 days
    },
    businessClosedPeriods: {
      maxCount: 500,
      maxAge: 730 * 24 * 60 * 60 * 1000,       // 2 years
    },
    resourceBookings: {
      maxCount: 20000,
      maxAge: 90 * 24 * 60 * 60 * 1000,        // 90 days (linked to appointments)
    },
    staffSchedules: {
      maxCount: 1000,
      maxAge: 365 * 24 * 60 * 60 * 1000,       // 1 year
    },
  },

  tombstones: {
    timeOffRequests: 30 * 24 * 60 * 60 * 1000,  // 30 days
    blockedTimeEntries: 30 * 24 * 60 * 60 * 1000,
    businessClosedPeriods: 30 * 24 * 60 * 60 * 1000,
    resourceBookings: 30 * 24 * 60 * 60 * 1000,
    staffSchedules: 90 * 24 * 60 * 60 * 1000,    // 90 days
  },
};
```

---

## 5. Redux State Management

### 5.1 Schedule Slice

```typescript
// src/store/slices/scheduleSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TimeOffType, TimeOffRequest, TimeOffRequestStatus } from '../../types/entities/schedule/timeOff';
import { BlockedTimeType, BlockedTimeEntry } from '../../types/entities/schedule/blockedTime';
import { BusinessClosedPeriod } from '../../types/entities/schedule/closedPeriod';
import { Resource, ResourceBooking } from '../../types/entities/schedule/resource';
import { StaffSchedule } from '../../types/entities/schedule/staffSchedule';

// State interface following existing pattern
interface ScheduleState {
  // Time-Off Types
  timeOffTypes: {
    items: TimeOffType[];
    loading: boolean;
    error: string | null;
    lastFetched: string | null;
  };

  // Time-Off Requests
  timeOffRequests: {
    items: TimeOffRequest[];
    pendingCount: number;
    selectedId: string | null;
    loading: boolean;
    error: string | null;
    filters: TimeOffRequestFilters;
    lastFetched: string | null;
  };

  // Blocked Time Types
  blockedTimeTypes: {
    items: BlockedTimeType[];
    loading: boolean;
    error: string | null;
    lastFetched: string | null;
  };

  // Blocked Time Entries
  blockedTimeEntries: {
    items: BlockedTimeEntry[];
    selectedId: string | null;
    loading: boolean;
    error: string | null;
    filters: BlockedTimeFilters;
    lastFetched: string | null;
  };

  // Business Closed Periods
  closedPeriods: {
    items: BusinessClosedPeriod[];
    loading: boolean;
    error: string | null;
    lastFetched: string | null;
  };

  // Resources
  resources: {
    items: Resource[];
    selectedId: string | null;
    loading: boolean;
    error: string | null;
    lastFetched: string | null;
  };

  // Resource Bookings
  resourceBookings: {
    items: ResourceBooking[];
    loading: boolean;
    error: string | null;
  };

  // Staff Schedules
  staffSchedules: {
    items: StaffSchedule[];
    selectedStaffId: string | null;
    loading: boolean;
    error: string | null;
    lastFetched: string | null;
  };

  // UI State
  ui: {
    scheduleViewMode: 'staff' | 'resource';
    selectedStaffIds: string[];
    selectedResourceIds: string[];
    dateRange: {
      start: string;
      end: string;
    };
    showPendingRequestsBadge: boolean;
  };
}

interface TimeOffRequestFilters {
  status: TimeOffRequestStatus | 'all';
  staffId: string | null;
  dateRange: 'upcoming' | 'past' | 'all';
  typeId: string | null;
}

interface BlockedTimeFilters {
  staffId: string | null;
  typeId: string | null;
  dateRange: {
    start: string;
    end: string;
  };
}

const initialState: ScheduleState = {
  timeOffTypes: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  timeOffRequests: {
    items: [],
    pendingCount: 0,
    selectedId: null,
    loading: false,
    error: null,
    filters: {
      status: 'pending',
      staffId: null,
      dateRange: 'upcoming',
      typeId: null,
    },
    lastFetched: null,
  },
  blockedTimeTypes: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  blockedTimeEntries: {
    items: [],
    selectedId: null,
    loading: false,
    error: null,
    filters: {
      staffId: null,
      typeId: null,
      dateRange: {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    },
    lastFetched: null,
  },
  closedPeriods: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  resources: {
    items: [],
    selectedId: null,
    loading: false,
    error: null,
    lastFetched: null,
  },
  resourceBookings: {
    items: [],
    loading: false,
    error: null,
  },
  staffSchedules: {
    items: [],
    selectedStaffId: null,
    loading: false,
    error: null,
    lastFetched: null,
  },
  ui: {
    scheduleViewMode: 'staff',
    selectedStaffIds: [],
    selectedResourceIds: [],
    dateRange: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    showPendingRequestsBadge: true,
  },
};

// Async Thunks (following existing pattern)
export const fetchTimeOffTypes = createAsyncThunk(
  'schedule/fetchTimeOffTypes',
  async (storeId: string, { rejectWithValue }) => {
    try {
      const types = await scheduleService.getTimeOffTypes(storeId);
      return types;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createTimeOffRequest = createAsyncThunk(
  'schedule/createTimeOffRequest',
  async (request: Omit<TimeOffRequest, 'id' | 'createdAt' | 'updatedAt' | 'version'>, { rejectWithValue }) => {
    try {
      const created = await scheduleService.createTimeOffRequest(request);
      return created;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const approveTimeOffRequest = createAsyncThunk(
  'schedule/approveTimeOffRequest',
  async ({ id, notes }: { id: string; notes?: string }, { rejectWithValue }) => {
    try {
      const updated = await scheduleService.approveTimeOffRequest(id, notes);
      return updated;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const denyTimeOffRequest = createAsyncThunk(
  'schedule/denyTimeOffRequest',
  async ({ id, reason }: { id: string; reason: string }, { rejectWithValue }) => {
    try {
      const updated = await scheduleService.denyTimeOffRequest(id, reason);
      return updated;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ... more async thunks for other operations

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setTimeOffRequestFilters: (state, action: PayloadAction<Partial<TimeOffRequestFilters>>) => {
      state.timeOffRequests.filters = {
        ...state.timeOffRequests.filters,
        ...action.payload,
      };
    },
    setBlockedTimeFilters: (state, action: PayloadAction<Partial<BlockedTimeFilters>>) => {
      state.blockedTimeEntries.filters = {
        ...state.blockedTimeEntries.filters,
        ...action.payload,
      };
    },
    setScheduleViewMode: (state, action: PayloadAction<'staff' | 'resource'>) => {
      state.ui.scheduleViewMode = action.payload;
    },
    setSelectedStaffIds: (state, action: PayloadAction<string[]>) => {
      state.ui.selectedStaffIds = action.payload;
    },
    setDateRange: (state, action: PayloadAction<{ start: string; end: string }>) => {
      state.ui.dateRange = action.payload;
    },
    clearScheduleError: (state, action: PayloadAction<keyof ScheduleState>) => {
      const section = state[action.payload];
      if (section && 'error' in section) {
        section.error = null;
      }
    },
  },
  extraReducers: (builder) => {
    // Time-Off Types
    builder
      .addCase(fetchTimeOffTypes.pending, (state) => {
        state.timeOffTypes.loading = true;
        state.timeOffTypes.error = null;
      })
      .addCase(fetchTimeOffTypes.fulfilled, (state, action) => {
        state.timeOffTypes.loading = false;
        state.timeOffTypes.items = action.payload;
        state.timeOffTypes.lastFetched = new Date().toISOString();
      })
      .addCase(fetchTimeOffTypes.rejected, (state, action) => {
        state.timeOffTypes.loading = false;
        state.timeOffTypes.error = action.payload as string;
      });

    // Time-Off Requests
    builder
      .addCase(createTimeOffRequest.pending, (state) => {
        state.timeOffRequests.loading = true;
      })
      .addCase(createTimeOffRequest.fulfilled, (state, action) => {
        state.timeOffRequests.loading = false;
        state.timeOffRequests.items.push(action.payload);
        if (action.payload.status === 'pending') {
          state.timeOffRequests.pendingCount += 1;
        }
      })
      .addCase(createTimeOffRequest.rejected, (state, action) => {
        state.timeOffRequests.loading = false;
        state.timeOffRequests.error = action.payload as string;
      })
      .addCase(approveTimeOffRequest.fulfilled, (state, action) => {
        const index = state.timeOffRequests.items.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          const wasWasPending = state.timeOffRequests.items[index].status === 'pending';
          state.timeOffRequests.items[index] = action.payload;
          if (wasWasPending) {
            state.timeOffRequests.pendingCount -= 1;
          }
        }
      })
      .addCase(denyTimeOffRequest.fulfilled, (state, action) => {
        const index = state.timeOffRequests.items.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          const wasPending = state.timeOffRequests.items[index].status === 'pending';
          state.timeOffRequests.items[index] = action.payload;
          if (wasPending) {
            state.timeOffRequests.pendingCount -= 1;
          }
        }
      });

    // ... more reducers for other entities
  },
});

export const {
  setTimeOffRequestFilters,
  setBlockedTimeFilters,
  setScheduleViewMode,
  setSelectedStaffIds,
  setDateRange,
  clearScheduleError,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;
```

### 5.2 Selectors

```typescript
// src/store/selectors/scheduleSelectors.ts

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Time-Off Types
export const selectTimeOffTypes = (state: RootState) => state.schedule.timeOffTypes.items;
export const selectActiveTimeOffTypes = createSelector(
  selectTimeOffTypes,
  (types) => types.filter(t => t.isActive && !t.isDeleted).sort((a, b) => a.displayOrder - b.displayOrder)
);

// Time-Off Requests
export const selectTimeOffRequests = (state: RootState) => state.schedule.timeOffRequests.items;
export const selectTimeOffRequestFilters = (state: RootState) => state.schedule.timeOffRequests.filters;

export const selectFilteredTimeOffRequests = createSelector(
  [selectTimeOffRequests, selectTimeOffRequestFilters],
  (requests, filters) => {
    return requests.filter(request => {
      if (request.isDeleted) return false;
      if (filters.status !== 'all' && request.status !== filters.status) return false;
      if (filters.staffId && request.staffId !== filters.staffId) return false;
      if (filters.typeId && request.typeId !== filters.typeId) return false;

      const requestStart = new Date(request.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filters.dateRange === 'upcoming' && requestStart < today) return false;
      if (filters.dateRange === 'past' && requestStart >= today) return false;

      return true;
    });
  }
);

export const selectPendingTimeOffCount = (state: RootState) => state.schedule.timeOffRequests.pendingCount;

export const selectTimeOffRequestsByStaff = (staffId: string) => createSelector(
  selectTimeOffRequests,
  (requests) => requests.filter(r => r.staffId === staffId && !r.isDeleted)
);

// Blocked Time
export const selectBlockedTimeTypes = (state: RootState) => state.schedule.blockedTimeTypes.items;
export const selectActiveBlockedTimeTypes = createSelector(
  selectBlockedTimeTypes,
  (types) => types.filter(t => t.isActive && !t.isDeleted).sort((a, b) => a.displayOrder - b.displayOrder)
);

export const selectBlockedTimeEntries = (state: RootState) => state.schedule.blockedTimeEntries.items;

export const selectBlockedTimeForStaffAndDate = (staffId: string, date: string) => createSelector(
  selectBlockedTimeEntries,
  (entries) => entries.filter(e =>
    e.staffId === staffId &&
    e.startDateTime.startsWith(date) &&
    !e.isDeleted
  )
);

// Business Closures
export const selectClosedPeriods = (state: RootState) => state.schedule.closedPeriods.items;

export const selectUpcomingClosures = createSelector(
  selectClosedPeriods,
  (periods) => {
    const today = new Date().toISOString().split('T')[0];
    return periods
      .filter(p => !p.isDeleted && p.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
);

export const selectClosureForDate = (date: string) => createSelector(
  selectClosedPeriods,
  (periods) => periods.find(p =>
    !p.isDeleted &&
    p.startDate <= date &&
    p.endDate >= date
  )
);

// Resources
export const selectResources = (state: RootState) => state.schedule.resources.items;
export const selectActiveResources = createSelector(
  selectResources,
  (resources) => resources.filter(r => r.isActive && !r.isDeleted).sort((a, b) => a.displayOrder - b.displayOrder)
);

export const selectResourcesByCategory = (category: string) => createSelector(
  selectActiveResources,
  (resources) => resources.filter(r => r.category === category)
);

// Resource Bookings
export const selectResourceBookings = (state: RootState) => state.schedule.resourceBookings.items;

export const selectResourceAvailability = (resourceId: string, date: string) => createSelector(
  selectResourceBookings,
  (bookings) => {
    const dayBookings = bookings.filter(b =>
      b.resourceId === resourceId &&
      b.startDateTime.startsWith(date) &&
      !b.isDeleted
    );
    return dayBookings;
  }
);

// Staff Schedules
export const selectStaffSchedules = (state: RootState) => state.schedule.staffSchedules.items;

export const selectScheduleForStaff = (staffId: string) => createSelector(
  selectStaffSchedules,
  (schedules) => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.find(s =>
      s.staffId === staffId &&
      s.effectiveFrom <= today &&
      (!s.effectiveUntil || s.effectiveUntil >= today) &&
      !s.isDeleted
    );
  }
);

// UI State
export const selectScheduleViewMode = (state: RootState) => state.schedule.ui.scheduleViewMode;
export const selectSelectedStaffIds = (state: RootState) => state.schedule.ui.selectedStaffIds;
export const selectScheduleDateRange = (state: RootState) => state.schedule.ui.dateRange;
```

---

## 6. Service Layer

### 6.1 Schedule Service

```typescript
// src/services/scheduleService.ts

import { db } from '../db/database';
import { addToSyncQueue, generateIdempotencyKey } from '../db/sync/syncQueue';
import { SCHEDULE_SYNC_PRIORITIES } from '../db/sync/scheduleSync';
import { v4 as uuidv4 } from 'uuid';
import { getDeviceId, getCurrentUserId } from './authService';
import { incrementVersion } from '../utils/syncUtils';

import {
  TimeOffType,
  TimeOffRequest,
  TimeOffRequestStatus,
  DEFAULT_TIME_OFF_TYPES,
} from '../types/entities/schedule/timeOff';

import {
  BlockedTimeType,
  BlockedTimeEntry,
  DEFAULT_BLOCKED_TIME_TYPES,
} from '../types/entities/schedule/blockedTime';

import { BusinessClosedPeriod } from '../types/entities/schedule/closedPeriod';
import { Resource, ResourceBooking } from '../types/entities/schedule/resource';
import { StaffSchedule } from '../types/entities/schedule/staffSchedule';

class ScheduleService {
  // ==================== INITIALIZATION ====================

  /**
   * Seed default types on first use
   */
  async seedDefaults(storeId: string, tenantId: string): Promise<void> {
    const userId = getCurrentUserId();
    const deviceId = getDeviceId();
    const now = new Date().toISOString();

    // Seed time-off types
    const existingTimeOffTypes = await db.timeOffTypes
      .where('storeId')
      .equals(storeId)
      .count();

    if (existingTimeOffTypes === 0) {
      const timeOffTypes: TimeOffType[] = DEFAULT_TIME_OFF_TYPES.map((t, index) => ({
        ...t,
        id: uuidv4(),
        tenantId,
        storeId,
        syncStatus: 'pending',
        version: 1,
        vectorClock: { [deviceId]: 1 },
        lastSyncedVersion: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        createdByDevice: deviceId,
        lastModifiedBy: userId,
        lastModifiedByDevice: deviceId,
        isDeleted: false,
        isActive: true,
        displayOrder: index + 1,
      } as TimeOffType));

      await db.timeOffTypes.bulkPut(timeOffTypes);

      // Queue for sync
      for (const type of timeOffTypes) {
        await addToSyncQueue({
          type: 'create',
          entity: 'timeOffTypes',
          entityId: type.id,
          payload: type,
          priority: SCHEDULE_SYNC_PRIORITIES.timeOffTypes,
          idempotencyKey: generateIdempotencyKey('create', 'timeOffTypes', type.id, 1),
        });
      }
    }

    // Seed blocked time types
    const existingBlockedTypes = await db.blockedTimeTypes
      .where('storeId')
      .equals(storeId)
      .count();

    if (existingBlockedTypes === 0) {
      const blockedTypes: BlockedTimeType[] = DEFAULT_BLOCKED_TIME_TYPES.map((t, index) => ({
        ...t,
        id: uuidv4(),
        tenantId,
        storeId,
        syncStatus: 'pending',
        version: 1,
        vectorClock: { [deviceId]: 1 },
        lastSyncedVersion: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        createdByDevice: deviceId,
        lastModifiedBy: userId,
        lastModifiedByDevice: deviceId,
        isDeleted: false,
        isActive: true,
        displayOrder: index + 1,
      } as BlockedTimeType));

      await db.blockedTimeTypes.bulkPut(blockedTypes);

      for (const type of blockedTypes) {
        await addToSyncQueue({
          type: 'create',
          entity: 'blockedTimeTypes',
          entityId: type.id,
          payload: type,
          priority: SCHEDULE_SYNC_PRIORITIES.blockedTimeTypes,
          idempotencyKey: generateIdempotencyKey('create', 'blockedTimeTypes', type.id, 1),
        });
      }
    }
  }

  // ==================== TIME-OFF TYPES ====================

  async getTimeOffTypes(storeId: string): Promise<TimeOffType[]> {
    return db.timeOffTypes
      .where('[storeId+isActive]')
      .equals([storeId, 1]) // 1 = true in IndexedDB
      .filter(t => !t.isDeleted)
      .sortBy('displayOrder');
  }

  async createTimeOffType(type: Omit<TimeOffType, 'id' | 'version' | 'vectorClock' | 'lastSyncedVersion' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdByDevice' | 'lastModifiedBy' | 'lastModifiedByDevice'>): Promise<TimeOffType> {
    const userId = getCurrentUserId();
    const deviceId = getDeviceId();
    const now = new Date().toISOString();

    const newType: TimeOffType = {
      ...type,
      id: uuidv4(),
      syncStatus: 'pending',
      version: 1,
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      createdByDevice: deviceId,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      isDeleted: false,
    };

    await db.timeOffTypes.put(newType);

    await addToSyncQueue({
      type: 'create',
      entity: 'timeOffTypes',
      entityId: newType.id,
      payload: newType,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffTypes,
      idempotencyKey: generateIdempotencyKey('create', 'timeOffTypes', newType.id, 1),
    });

    return newType;
  }

  async updateTimeOffType(id: string, updates: Partial<TimeOffType>): Promise<TimeOffType> {
    const existing = await db.timeOffTypes.get(id);
    if (!existing) throw new Error('Time-off type not found');

    const deviceId = getDeviceId();
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      lastModifiedBy: getCurrentUserId(),
      lastModifiedByDevice: deviceId,
    };

    incrementVersion(updated, deviceId);

    await db.timeOffTypes.put(updated);

    await addToSyncQueue({
      type: 'update',
      entity: 'timeOffTypes',
      entityId: id,
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffTypes,
      idempotencyKey: generateIdempotencyKey('update', 'timeOffTypes', id, updated.version),
    });

    return updated;
  }

  async deleteTimeOffType(id: string): Promise<void> {
    const existing = await db.timeOffTypes.get(id);
    if (!existing) throw new Error('Time-off type not found');
    if (existing.isDefault) throw new Error('Cannot delete default time-off type');

    const deviceId = getDeviceId();
    const userId = getCurrentUserId();
    const now = new Date().toISOString();

    const tombstoned: TimeOffType = {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: userId,
      deletedByDevice: deviceId,
      tombstoneExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      syncStatus: 'pending',
    };

    incrementVersion(tombstoned, deviceId);

    await db.timeOffTypes.put(tombstoned);

    await addToSyncQueue({
      type: 'delete',
      entity: 'timeOffTypes',
      entityId: id,
      payload: tombstoned,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffTypes,
      idempotencyKey: generateIdempotencyKey('delete', 'timeOffTypes', id, tombstoned.version),
    });
  }

  // ==================== TIME-OFF REQUESTS ====================

  async getTimeOffRequests(storeId: string, filters?: {
    status?: TimeOffRequestStatus;
    staffId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TimeOffRequest[]> {
    let query = db.timeOffRequests.where('storeId').equals(storeId);

    let results = await query.filter(r => !r.isDeleted).toArray();

    if (filters?.status) {
      results = results.filter(r => r.status === filters.status);
    }
    if (filters?.staffId) {
      results = results.filter(r => r.staffId === filters.staffId);
    }
    if (filters?.startDate) {
      results = results.filter(r => r.endDate >= filters.startDate!);
    }
    if (filters?.endDate) {
      results = results.filter(r => r.startDate <= filters.endDate!);
    }

    return results.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  async getPendingTimeOffCount(storeId: string): Promise<number> {
    return db.timeOffRequests
      .where('[storeId+status]')
      .equals([storeId, 'pending'])
      .filter(r => !r.isDeleted)
      .count();
  }

  async createTimeOffRequest(request: {
    storeId: string;
    tenantId: string;
    staffId: string;
    staffName: string;
    typeId: string;
    startDate: string;
    endDate: string;
    isAllDay: boolean;
    startTime?: string;
    endTime?: string;
    notes?: string;
  }): Promise<TimeOffRequest> {
    const userId = getCurrentUserId();
    const deviceId = getDeviceId();
    const now = new Date().toISOString();

    // Get type details
    const type = await db.timeOffTypes.get(request.typeId);
    if (!type) throw new Error('Time-off type not found');

    // Calculate hours based on scheduled shifts
    const { totalHours, totalDays } = await this.calculateTimeOffHours(
      request.staffId,
      request.startDate,
      request.endDate,
      request.isAllDay,
      request.startTime,
      request.endTime
    );

    // Check for appointment conflicts
    const conflicts = await this.checkAppointmentConflicts(
      request.staffId,
      request.startDate,
      request.endDate
    );

    // Determine initial status
    const initialStatus: TimeOffRequestStatus = type.requiresApproval ? 'pending' : 'approved';

    const newRequest: TimeOffRequest = {
      id: uuidv4(),
      tenantId: request.tenantId,
      storeId: request.storeId,
      staffId: request.staffId,
      staffName: request.staffName,
      typeId: request.typeId,
      typeName: type.name,
      typeEmoji: type.emoji,
      typeColor: type.color,
      isPaid: type.isPaid,
      startDate: request.startDate,
      endDate: request.endDate,
      isAllDay: request.isAllDay,
      startTime: request.startTime,
      endTime: request.endTime,
      totalHours,
      totalDays,
      status: initialStatus,
      statusHistory: [
        {
          from: null,
          to: initialStatus,
          changedAt: now,
          changedBy: userId,
          changedByDevice: deviceId,
        },
      ],
      notes: request.notes,
      hasConflicts: conflicts.length > 0,
      conflictingAppointmentIds: conflicts,
      syncStatus: 'pending',
      version: 1,
      vectorClock: { [deviceId]: 1 },
      lastSyncedVersion: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      createdByDevice: deviceId,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      isDeleted: false,
    };

    // Auto-approve if type doesn't require approval
    if (!type.requiresApproval) {
      newRequest.approvedBy = 'system';
      newRequest.approvedByName = 'Auto-approved';
      newRequest.approvedAt = now;
    }

    await db.timeOffRequests.put(newRequest);

    await addToSyncQueue({
      type: 'create',
      entity: 'timeOffRequests',
      entityId: newRequest.id,
      payload: newRequest,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffRequests,
      idempotencyKey: generateIdempotencyKey('create', 'timeOffRequests', newRequest.id, 1),
    });

    return newRequest;
  }

  async approveTimeOffRequest(id: string, notes?: string): Promise<TimeOffRequest> {
    const existing = await db.timeOffRequests.get(id);
    if (!existing) throw new Error('Time-off request not found');
    if (existing.status !== 'pending') throw new Error('Request is not pending');

    const userId = getCurrentUserId();
    const deviceId = getDeviceId();
    const now = new Date().toISOString();

    // Get user name for denormalization
    const userName = await this.getUserName(userId);

    const updated: TimeOffRequest = {
      ...existing,
      status: 'approved',
      statusHistory: [
        ...existing.statusHistory,
        {
          from: 'pending',
          to: 'approved',
          changedAt: now,
          changedBy: userId,
          changedByDevice: deviceId,
        },
      ],
      approvedBy: userId,
      approvedByName: userName,
      approvedAt: now,
      approvalNotes: notes,
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
    };

    incrementVersion(updated, deviceId);

    await db.timeOffRequests.put(updated);

    await addToSyncQueue({
      type: 'update',
      entity: 'timeOffRequests',
      entityId: id,
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffRequests,
      idempotencyKey: generateIdempotencyKey('update', 'timeOffRequests', id, updated.version),
    });

    return updated;
  }

  async denyTimeOffRequest(id: string, reason: string): Promise<TimeOffRequest> {
    if (!reason?.trim()) throw new Error('Denial reason is required');

    const existing = await db.timeOffRequests.get(id);
    if (!existing) throw new Error('Time-off request not found');
    if (existing.status !== 'pending') throw new Error('Request is not pending');

    const userId = getCurrentUserId();
    const deviceId = getDeviceId();
    const now = new Date().toISOString();
    const userName = await this.getUserName(userId);

    const updated: TimeOffRequest = {
      ...existing,
      status: 'denied',
      statusHistory: [
        ...existing.statusHistory,
        {
          from: 'pending',
          to: 'denied',
          changedAt: now,
          changedBy: userId,
          changedByDevice: deviceId,
          reason,
        },
      ],
      deniedBy: userId,
      deniedByName: userName,
      deniedAt: now,
      denialReason: reason,
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
    };

    incrementVersion(updated, deviceId);

    await db.timeOffRequests.put(updated);

    await addToSyncQueue({
      type: 'update',
      entity: 'timeOffRequests',
      entityId: id,
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffRequests,
      idempotencyKey: generateIdempotencyKey('update', 'timeOffRequests', id, updated.version),
    });

    return updated;
  }

  async cancelTimeOffRequest(id: string, reason?: string): Promise<TimeOffRequest> {
    const existing = await db.timeOffRequests.get(id);
    if (!existing) throw new Error('Time-off request not found');
    if (existing.status !== 'pending') throw new Error('Only pending requests can be cancelled');

    const userId = getCurrentUserId();
    const deviceId = getDeviceId();
    const now = new Date().toISOString();

    const updated: TimeOffRequest = {
      ...existing,
      status: 'cancelled',
      statusHistory: [
        ...existing.statusHistory,
        {
          from: 'pending',
          to: 'cancelled',
          changedAt: now,
          changedBy: userId,
          changedByDevice: deviceId,
          reason,
        },
      ],
      cancelledAt: now,
      cancelledBy: userId,
      cancellationReason: reason,
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
    };

    incrementVersion(updated, deviceId);

    await db.timeOffRequests.put(updated);

    await addToSyncQueue({
      type: 'update',
      entity: 'timeOffRequests',
      entityId: id,
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffRequests,
      idempotencyKey: generateIdempotencyKey('update', 'timeOffRequests', id, updated.version),
    });

    return updated;
  }

  // ==================== HELPER METHODS ====================

  private async calculateTimeOffHours(
    staffId: string,
    startDate: string,
    endDate: string,
    isAllDay: boolean,
    startTime?: string,
    endTime?: string
  ): Promise<{ totalHours: number; totalDays: number }> {
    // Get staff schedule
    const schedule = await db.staffSchedules
      .where('[storeId+staffId]')
      .equals([/* storeId */, staffId])
      .first();

    if (!schedule) {
      // No schedule, return 0
      return { totalHours: 0, totalDays: 0 };
    }

    let totalHours = 0;
    let totalDays = 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const weekNumber = this.getWeekNumberInPattern(d, schedule);
      const dayConfig = schedule.weeks[weekNumber - 1]?.days.find(day => day.dayOfWeek === dayOfWeek);

      if (dayConfig?.isWorking && dayConfig.shifts.length > 0) {
        totalDays += 1;

        if (isAllDay) {
          // Calculate full day hours from shifts
          for (const shift of dayConfig.shifts) {
            const shiftHours = this.calculateShiftHours(shift.startTime, shift.endTime);
            totalHours += shiftHours;
          }
        } else if (startTime && endTime) {
          // Partial day
          const hours = this.calculateShiftHours(startTime, endTime);
          totalHours += hours;
        }
      }
    }

    return { totalHours, totalDays };
  }

  private calculateShiftHours(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return (endMinutes - startMinutes) / 60;
  }

  private getWeekNumberInPattern(date: Date, schedule: StaffSchedule): number {
    const effectiveStart = new Date(schedule.effectiveFrom);
    const diffDays = Math.floor((date.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
    const weeksSinceStart = Math.floor(diffDays / 7);
    return (weeksSinceStart % schedule.patternWeeks) + 1;
  }

  private async checkAppointmentConflicts(
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<string[]> {
    const appointments = await db.appointments
      .where('[staffId+scheduledStartTime]')
      .between(
        [staffId, `${startDate}T00:00:00`],
        [staffId, `${endDate}T23:59:59`]
      )
      .filter(a => !a.isDeleted && !['cancelled', 'no_show', 'checked_out'].includes(a.status))
      .toArray();

    return appointments.map(a => a.id);
  }

  private async getUserName(userId: string): Promise<string> {
    // Get from staff or return generic
    const staff = await db.staff.get(userId);
    return staff?.displayName || 'Manager';
  }

  // ... Additional service methods for blocked time, closures, resources, etc.
}

export const scheduleService = new ScheduleService();
```

---

## Phase 1: Core Types & Database

**Duration:** 1 week
**Dependencies:** None

### Deliverables

- [ ] Create type definitions in `src/types/entities/schedule/`
  - [ ] `base.ts` - Base schedule entity
  - [ ] `timeOffType.ts` - Time-off types
  - [ ] `timeOffRequest.ts` - Time-off requests
  - [ ] `blockedTimeType.ts` - Blocked time types
  - [ ] `blockedTimeEntry.ts` - Blocked time entries
  - [ ] `businessClosedPeriod.ts` - Business closures
  - [ ] `resource.ts` - Resources
  - [ ] `resourceBooking.ts` - Resource bookings
  - [ ] `staffSchedule.ts` - Staff schedules
  - [ ] `index.ts` - Barrel export

- [ ] Update database schema in `src/db/schema.ts`
  - [ ] Increment version to 4
  - [ ] Add all new tables with indexes
  - [ ] Write migration for existing stores

- [ ] Create database operations in `src/db/scheduleOperations.ts`
  - [ ] CRUD for all schedule entities
  - [ ] Query helpers with proper scoping

- [ ] Configure sync in `src/db/sync/scheduleSync.ts`
  - [ ] Sync priorities
  - [ ] Conflict resolution config
  - [ ] Retention policies

- [ ] Add to existing store configuration
  - [ ] Update `src/store/index.ts`
  - [ ] Add schedule reducer

### Testing

- [ ] Unit tests for type validations
- [ ] Integration tests for database operations
- [ ] Migration tests with fake-indexeddb

---

## Phase 2: Time-Off Management

**Duration:** 2 weeks
**Dependencies:** Phase 1

### Week 1: Core Functionality

- [ ] Implement `scheduleService.ts` time-off methods
  - [ ] `seedDefaults()` - Seed default types
  - [ ] `getTimeOffTypes()` - List types
  - [ ] `createTimeOffType()` - Create custom type
  - [ ] `updateTimeOffType()` - Edit type
  - [ ] `deleteTimeOffType()` - Archive type

- [ ] Implement Redux slice (`scheduleSlice.ts`)
  - [ ] Time-off types state
  - [ ] Async thunks
  - [ ] Selectors

- [ ] Create Settings UI (`src/components/settings/schedule/`)
  - [ ] `TimeOffTypesSettings.tsx` - List/manage types
  - [ ] `TimeOffTypeModal.tsx` - Add/edit type form
  - [ ] Emoji picker component
  - [ ] Color picker component

### Week 2: Request Workflow

- [ ] Implement time-off request methods
  - [ ] `createTimeOffRequest()` - Submit request
  - [ ] `approveTimeOffRequest()` - Manager approval
  - [ ] `denyTimeOffRequest()` - Manager denial
  - [ ] `cancelTimeOffRequest()` - Cancel pending
  - [ ] `calculateTimeOffHours()` - Hours calculation
  - [ ] `checkAppointmentConflicts()` - Conflict detection

- [ ] Create Request UI
  - [ ] `TimeOffRequestForm.tsx` - Submit request
  - [ ] `TimeOffRequestList.tsx` - View requests
  - [ ] `PendingRequestsWidget.tsx` - Manager dashboard
  - [ ] `TimeOffApprovalModal.tsx` - Approve/deny

- [ ] Calendar integration
  - [ ] Show approved time-off on calendar
  - [ ] Block booking during time-off

### Testing

- [ ] Unit tests for service methods
- [ ] Component tests for forms
- [ ] E2E test for approval workflow

---

## Phase 3: Blocked Time Management

**Duration:** 1.5 weeks
**Dependencies:** Phase 2

### Deliverables

- [ ] Implement blocked time service methods
  - [ ] `getBlockedTimeTypes()` - List types
  - [ ] `createBlockedTimeType()` - Create type
  - [ ] `createBlockedTimeEntry()` - Create entry
  - [ ] `expandRecurringEntries()` - Generate occurrences
  - [ ] `checkBlockedTimeConflicts()` - Conflict with appointments

- [ ] Create Settings UI
  - [ ] `BlockedTimeTypesSettings.tsx` - Manage types
  - [ ] `BlockedTimeTypeModal.tsx` - Add/edit type

- [ ] Create Blocking UI
  - [ ] `BlockTimeModal.tsx` - Create blocked time
  - [ ] Context menu integration in calendar
  - [ ] Blocked time display on DaySchedule

- [ ] Calendar integration
  - [ ] Show blocked time slots with type color/emoji
  - [ ] Prevent/warn booking over blocked time
  - [ ] Hide blocked slots from online booking

### Testing

- [ ] Unit tests for recurring logic
- [ ] Component tests
- [ ] Integration tests with calendar

---

## Phase 4: Business Closures

**Duration:** 1 week
**Dependencies:** Phase 1

### Deliverables

- [ ] Implement closure service methods
  - [ ] `getClosedPeriods()` - List closures
  - [ ] `createClosedPeriod()` - Create closure
  - [ ] `updateClosedPeriod()` - Edit closure
  - [ ] `deleteClosedPeriod()` - Remove closure
  - [ ] `getAffectedAppointments()` - Impact preview

- [ ] Create Settings UI
  - [ ] `ClosedPeriodsSettings.tsx` - Manage closures
  - [ ] `ClosedPeriodModal.tsx` - Add/edit closure
  - [ ] Calendar view with closures highlighted
  - [ ] Impact preview component

- [ ] Calendar integration
  - [ ] Gray out closed days
  - [ ] Block all booking during closures
  - [ ] Show closure message

- [ ] Online booking integration
  - [ ] Hide closed dates
  - [ ] Display "Closed for [reason]" message

### Testing

- [ ] Unit tests for date calculations
- [ ] Component tests
- [ ] Integration with booking flow

---

## Phase 5: Multi-Week Patterns

**Duration:** 1 week
**Dependencies:** Phase 1

### Deliverables

- [ ] Extend schedule types for multi-week
  - [ ] 1, 2, 3, 4-week patterns
  - [ ] Week-specific day configurations

- [ ] Update `AddEditScheduleModal.tsx`
  - [ ] Pattern type selector (1-4 weeks)
  - [ ] Week tabs for multi-week patterns
  - [ ] Pattern preview component

- [ ] Implement pattern calculations
  - [ ] `getWeekNumberInPattern()` - Current week in cycle
  - [ ] `getScheduleForDate()` - Resolve schedule for any date
  - [ ] `previewPattern()` - Generate preview

- [ ] Update calendar integration
  - [ ] Display correct pattern week
  - [ ] Show pattern indicator

### Testing

- [ ] Unit tests for pattern calculations
- [ ] Component tests for UI
- [ ] Edge case tests (pattern transitions)

---

## Phase 6: Resource Scheduling

**Duration:** 2 weeks
**Dependencies:** Phase 1, Phase 3

### Week 1: Resource Management

- [ ] Implement resource service methods
  - [ ] `getResources()` - List resources
  - [ ] `createResource()` - Create resource
  - [ ] `updateResource()` - Edit resource
  - [ ] `deleteResource()` - Archive resource
  - [ ] `linkServiceToResource()` - Link service

- [ ] Create Settings UI
  - [ ] `ResourcesSettings.tsx` - Manage resources
  - [ ] `ResourceModal.tsx` - Add/edit resource
  - [ ] `ServiceResourceLinker.tsx` - Link services

### Week 2: Booking Integration

- [ ] Implement booking methods
  - [ ] `checkResourceAvailability()` - Check slot
  - [ ] `autoAssignResource()` - Auto-assign
  - [ ] `bookResource()` - Create booking
  - [ ] `releaseResource()` - Cancel booking

- [ ] Update appointment booking
  - [ ] Check resource availability
  - [ ] Auto-assign on online booking
  - [ ] Manual selection for in-store
  - [ ] Show conflict warnings

- [ ] Calendar resource view
  - [ ] Resource filter in calendar
  - [ ] Resource timeline view
  - [ ] Resource utilization display

### Testing

- [ ] Unit tests for availability logic
- [ ] Integration tests with appointments
- [ ] E2E test for full booking flow

---

## Phase 7: Reports & Analytics

**Duration:** 1 week
**Dependencies:** Phases 2-6

### Deliverables

- [ ] Create reports service
  - [ ] `getWorkingHoursReport()` - Hours breakdown
  - [ ] `getTimeOffSummary()` - Time-off usage
  - [ ] `getResourceUtilization()` - Resource usage

- [ ] Create report components
  - [ ] `WorkingHoursReport.tsx` - Full report
  - [ ] `TimeOffSummaryWidget.tsx` - Dashboard widget
  - [ ] `ResourceUtilizationChart.tsx` - Usage chart

- [ ] Export functionality
  - [ ] CSV export for all reports
  - [ ] Date range selection
  - [ ] Staff/resource filters

### Testing

- [ ] Unit tests for calculations
- [ ] Component tests for reports

---

## Testing Strategy

### Unit Tests

```typescript
// src/services/__tests__/scheduleService.test.ts

import { scheduleService } from '../scheduleService';
import { db } from '../../db/database';
import 'fake-indexeddb/auto';

describe('ScheduleService', () => {
  beforeEach(async () => {
    await db.timeOffTypes.clear();
    await db.timeOffRequests.clear();
  });

  describe('Time-Off Types', () => {
    it('should seed default types on first use', async () => {
      await scheduleService.seedDefaults('store-1', 'tenant-1');

      const types = await db.timeOffTypes.where('storeId').equals('store-1').toArray();

      expect(types.length).toBe(6); // Default types
      expect(types.every(t => t.isDefault)).toBe(true);
    });

    it('should create custom time-off type', async () => {
      const type = await scheduleService.createTimeOffType({
        storeId: 'store-1',
        tenantId: 'tenant-1',
        name: 'Jury Duty',
        code: 'JURY',
        emoji: '⚖️',
        color: '#6366F1',
        isPaid: true,
        requiresApproval: false,
        annualLimitDays: null,
        displayOrder: 10,
        isDefault: false,
        isActive: true,
      });

      expect(type.id).toBeDefined();
      expect(type.syncStatus).toBe('pending');
    });
  });

  describe('Time-Off Requests', () => {
    it('should auto-approve requests for types not requiring approval', async () => {
      // Create type without approval requirement
      const type = await scheduleService.createTimeOffType({
        // ... with requiresApproval: false
      });

      const request = await scheduleService.createTimeOffRequest({
        storeId: 'store-1',
        tenantId: 'tenant-1',
        staffId: 'staff-1',
        staffName: 'Jane Doe',
        typeId: type.id,
        startDate: '2025-12-25',
        endDate: '2025-12-25',
        isAllDay: true,
      });

      expect(request.status).toBe('approved');
      expect(request.approvedBy).toBe('system');
    });

    it('should calculate hours based on scheduled shifts', async () => {
      // Set up staff schedule
      // Create request
      // Verify hours calculation
    });

    it('should detect appointment conflicts', async () => {
      // Create appointment
      // Create time-off request for same date
      // Verify hasConflicts is true
    });
  });
});
```

### Component Tests

```typescript
// src/components/settings/schedule/__tests__/TimeOffTypesSettings.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { TimeOffTypesSettings } from '../TimeOffTypesSettings';
import { store } from '../../../../store';

describe('TimeOffTypesSettings', () => {
  it('should display list of time-off types', async () => {
    render(
      <Provider store={store}>
        <TimeOffTypesSettings />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Vacation')).toBeInTheDocument();
      expect(screen.getByText('Sick Leave')).toBeInTheDocument();
    });
  });

  it('should open modal when clicking Add Type', async () => {
    render(
      <Provider store={store}>
        <TimeOffTypesSettings />
      </Provider>
    );

    fireEvent.click(screen.getByText('Add Type'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

```typescript
// e2e/schedule/time-off-approval.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Time-Off Approval Workflow', () => {
  test('should complete full approval flow', async ({ page }) => {
    // Login as staff
    await page.goto('/');
    // Submit time-off request
    // Logout

    // Login as manager
    // Navigate to pending requests
    // Approve request
    // Verify status change

    // Login as staff again
    // Verify request shows as approved
    // Verify time-off appears on calendar
  });
});
```

---

## Migration Plan

### Database Migration

```typescript
// src/db/migrations/v4-schedule-module.ts

import { db } from '../database';
import { DEFAULT_TIME_OFF_TYPES } from '../../types/entities/schedule/timeOff';
import { DEFAULT_BLOCKED_TIME_TYPES } from '../../types/entities/schedule/blockedTime';

export async function migrateToV4(): Promise<void> {
  console.log('Starting migration to v4 (Schedule Module)...');

  // Migration is handled by Dexie schema versioning
  // This function handles data migrations

  // 1. Check if already migrated
  const migrated = await db.settings.get('v4_schedule_migrated');
  if (migrated) {
    console.log('v4 migration already complete');
    return;
  }

  // 2. Get all stores that need seeding
  const stores = await getUniqueStores();

  // 3. Seed default types for each store
  for (const { storeId, tenantId } of stores) {
    await seedDefaultsForStore(storeId, tenantId);
  }

  // 4. Mark migration complete
  await db.settings.put({ key: 'v4_schedule_migrated', value: true });

  console.log('v4 migration complete');
}

async function getUniqueStores(): Promise<{ storeId: string; tenantId: string }[]> {
  // Get unique store/tenant combinations from existing data
  const appointments = await db.appointments.toArray();
  const storeMap = new Map<string, string>();

  for (const apt of appointments) {
    if (!storeMap.has(apt.storeId)) {
      storeMap.set(apt.storeId, apt.tenantId);
    }
  }

  return Array.from(storeMap.entries()).map(([storeId, tenantId]) => ({
    storeId,
    tenantId,
  }));
}

async function seedDefaultsForStore(storeId: string, tenantId: string): Promise<void> {
  // Check if already seeded
  const existingTypes = await db.timeOffTypes
    .where('storeId')
    .equals(storeId)
    .count();

  if (existingTypes > 0) {
    return; // Already seeded
  }

  // Seed using scheduleService
  await scheduleService.seedDefaults(storeId, tenantId);
}
```

### Feature Flag Rollout

```typescript
// src/config/featureFlags.ts

export const SCHEDULE_FEATURE_FLAGS = {
  // Phase 1-2: Time-Off
  schedule_time_off_types: true,
  schedule_time_off_requests: true,
  schedule_time_off_approval: true,

  // Phase 3: Blocked Time
  schedule_blocked_time_types: true,
  schedule_blocked_time_entries: true,

  // Phase 4: Closures
  schedule_business_closures: true,

  // Phase 5: Multi-Week
  schedule_multi_week_patterns: true,

  // Phase 6: Resources
  schedule_resources: false,  // Enable after Phase 6 complete
  schedule_resource_booking: false,

  // Phase 7: Reports
  schedule_working_hours_report: false,  // Enable after Phase 7 complete
};
```

---

## Checklist Summary

### Phase 1 (Week 1)
- [ ] Type definitions complete
- [ ] Database schema updated
- [ ] Sync configuration complete
- [ ] Unit tests passing

### Phase 2 (Weeks 2-3)
- [ ] Time-off types CRUD complete
- [ ] Time-off requests workflow complete
- [ ] Settings UI complete
- [ ] Calendar integration complete
- [ ] Tests passing

### Phase 3 (Week 4-5)
- [ ] Blocked time types complete
- [ ] Blocked time entries complete
- [ ] Calendar integration complete
- [ ] Tests passing

### Phase 4 (Week 6)
- [ ] Business closures complete
- [ ] Calendar integration complete
- [ ] Online booking integration complete
- [ ] Tests passing

### Phase 5 (Week 7)
- [ ] Multi-week patterns complete
- [ ] UI updates complete
- [ ] Tests passing

### Phase 6 (Weeks 8-9)
- [ ] Resources CRUD complete
- [ ] Resource booking complete
- [ ] Calendar resource view complete
- [ ] Tests passing

### Phase 7 (Week 10)
- [ ] Reports complete
- [ ] Export complete
- [ ] All tests passing
- [ ] Documentation complete

---

## Review Section

_To be completed after implementation_

### Changes Made
- [ ] List of files created
- [ ] List of files modified
- [ ] Database migrations applied

### Known Issues
- [ ] Any bugs or limitations

### Future Enhancements
- [ ] Features deferred
- [ ] User feedback to incorporate

---

**Document Status:** Ready for Implementation
**Last Updated:** December 1, 2025
