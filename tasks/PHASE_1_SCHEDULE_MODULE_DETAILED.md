# Phase 1: Schedule Module - Core Types & Database

**Duration:** 1 week
**Status:** Ready for Implementation
**Dependencies:** None
**Current DB Version:** 4 → Will upgrade to **Version 5**

---

## Overview

Phase 1 establishes the foundation for the entire Schedule Module by creating:
1. Type definitions for all schedule entities
2. Database schema with proper indexes
3. Database operations (CRUD)
4. Sync configuration
5. Database migration

---

## Pre-Implementation Checklist

- [ ] Review existing `BaseSyncableEntity` in `src/types/common.ts`
- [ ] Review current schema version in `src/db/schema.ts` (currently v4)
- [ ] Review `syncQueueDB` pattern in `src/db/database.ts`
- [ ] Review existing entity patterns (appointment.ts, staff.ts)

---

## Task 1: Type Definitions

### 1.1 Create Schedule Types Directory

**Create:** `src/types/schedule/`

```
src/types/schedule/
├── index.ts                    # Barrel export
├── timeOffType.ts              # Time-off type configuration
├── timeOffRequest.ts           # Time-off request entity
├── blockedTimeType.ts          # Blocked time type configuration
├── blockedTimeEntry.ts         # Blocked time entry entity
├── businessClosedPeriod.ts     # Business closure entity
├── resource.ts                 # Resource entity
├── resourceBooking.ts          # Resource booking entity
├── staffSchedule.ts            # Staff schedule patterns
└── constants.ts                # Default types and constants
```

---

### 1.2 TimeOffType Interface

**File:** `src/types/schedule/timeOffType.ts`

```typescript
import { BaseSyncableEntity } from '../common';

/**
 * TimeOffType defines a category of time-off (Vacation, Sick, Personal, etc.)
 * These are configurable per store and used when creating time-off requests.
 */
export interface TimeOffType extends BaseSyncableEntity {
  // === IDENTITY ===
  /** Display name shown in UI: "Vacation", "Sick Leave" */
  name: string;

  /** Short code for reports/exports: "VAC", "SICK" */
  code: string;

  // === VISUAL ===
  /** Emoji for quick visual identification: "🏖️", "🤒" */
  emoji: string;

  /** Hex color for calendar display: "#10B981" */
  color: string;

  // === CONFIGURATION ===
  /** Whether this time counts as paid time for payroll */
  isPaid: boolean;

  /** Whether manager approval is required (false = auto-approve) */
  requiresApproval: boolean;

  // === LIMITS (Optional) ===
  /** Maximum days per year (null = unlimited) */
  annualLimitDays: number | null;

  /** Whether days accrue over time */
  accrualEnabled: boolean;

  /** Days accrued per month when accrual enabled */
  accrualRatePerMonth: number | null;

  /** Whether unused days carry over to next year */
  carryOverEnabled: boolean;

  /** Maximum days that can carry over */
  maxCarryOverDays: number | null;

  // === DISPLAY ===
  /** Sort order in dropdowns/lists (lower = first) */
  displayOrder: number;

  /** Whether this type is available for selection */
  isActive: boolean;

  /** Whether this is a system-provided default type */
  isSystemDefault: boolean;
}

/**
 * Input for creating a new TimeOffType
 */
export interface CreateTimeOffTypeInput {
  name: string;
  code: string;
  emoji: string;
  color: string;
  isPaid: boolean;
  requiresApproval: boolean;
  annualLimitDays?: number | null;
  accrualEnabled?: boolean;
  accrualRatePerMonth?: number | null;
  carryOverEnabled?: boolean;
  maxCarryOverDays?: number | null;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Input for updating an existing TimeOffType
 */
export type UpdateTimeOffTypeInput = Partial<Omit<CreateTimeOffTypeInput, 'code'>>;
```

---

### 1.3 TimeOffRequest Interface

**File:** `src/types/schedule/timeOffRequest.ts`

```typescript
import { BaseSyncableEntity } from '../common';

/**
 * TimeOffRequest represents a staff member's request for time off.
 * Follows a workflow: pending → approved/denied → (optional) cancelled
 */
export interface TimeOffRequest extends BaseSyncableEntity {
  // === STAFF REFERENCE ===
  staffId: string;
  /** Denormalized for offline display */
  staffName: string;

  // === TYPE REFERENCE (Denormalized snapshot) ===
  typeId: string;
  typeName: string;
  typeEmoji: string;
  typeColor: string;
  /** Snapshot of isPaid at request time */
  isPaid: boolean;

  // === DATE RANGE ===
  /** Start date: "2025-12-25" (ISO 8601 date only) */
  startDate: string;
  /** End date: "2025-12-26" (inclusive) */
  endDate: string;
  /** Whether this is a full day(s) request */
  isAllDay: boolean;
  /** Start time if partial day: "09:00" */
  startTime: string | null;
  /** End time if partial day: "17:00" */
  endTime: string | null;

  // === CALCULATED VALUES ===
  /** Total hours based on scheduled shifts */
  totalHours: number;
  /** Number of working days affected */
  totalDays: number;

  // === STATUS WORKFLOW ===
  status: TimeOffRequestStatus;
  /** Audit trail of all status changes */
  statusHistory: TimeOffStatusChange[];

  // === REQUEST DETAILS ===
  /** Optional notes from requester */
  notes: string | null;

  // === APPROVAL DETAILS ===
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  approvalNotes: string | null;

  // === DENIAL DETAILS ===
  deniedBy: string | null;
  deniedByName: string | null;
  deniedAt: string | null;
  /** Required when denying */
  denialReason: string | null;

  // === CANCELLATION DETAILS ===
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;

  // === CONFLICT TRACKING ===
  /** Whether appointments exist on these dates */
  hasConflicts: boolean;
  /** IDs of conflicting appointments */
  conflictingAppointmentIds: string[];
}

export type TimeOffRequestStatus =
  | 'pending'    // Awaiting manager review
  | 'approved'   // Approved by manager
  | 'denied'     // Denied by manager
  | 'cancelled'; // Cancelled by requester or manager

export interface TimeOffStatusChange {
  from: TimeOffRequestStatus | null;
  to: TimeOffRequestStatus;
  changedAt: string;
  changedBy: string;
  changedByDevice: string;
  reason?: string;
}

/**
 * Input for creating a time-off request
 */
export interface CreateTimeOffRequestInput {
  staffId: string;
  staffName: string;
  typeId: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
}
```

---

### 1.4 BlockedTimeType Interface

**File:** `src/types/schedule/blockedTimeType.ts`

```typescript
import { BaseSyncableEntity } from '../common';

/**
 * BlockedTimeType defines a category of blocked time (Lunch, Training, Meeting, etc.)
 */
export interface BlockedTimeType extends BaseSyncableEntity {
  // === IDENTITY ===
  name: string;
  code: string;

  // === VISUAL ===
  emoji: string;
  color: string;

  // === CONFIGURATION ===
  /** Default duration in minutes when creating entries */
  defaultDurationMinutes: number;
  /** Whether this time counts as paid for payroll */
  isPaid: boolean;
  /** Whether to prevent online appointment booking */
  blocksOnlineBooking: boolean;
  /** Whether to warn/prevent in-store booking */
  blocksInStoreBooking: boolean;

  // === DISPLAY ===
  displayOrder: number;
  isActive: boolean;
  isSystemDefault: boolean;
}

export interface CreateBlockedTimeTypeInput {
  name: string;
  code: string;
  emoji: string;
  color: string;
  defaultDurationMinutes: number;
  isPaid: boolean;
  blocksOnlineBooking?: boolean;
  blocksInStoreBooking?: boolean;
  displayOrder?: number;
  isActive?: boolean;
}

export type UpdateBlockedTimeTypeInput = Partial<Omit<CreateBlockedTimeTypeInput, 'code'>>;
```

---

### 1.5 BlockedTimeEntry Interface

**File:** `src/types/schedule/blockedTimeEntry.ts`

```typescript
import { BaseSyncableEntity } from '../common';

/**
 * BlockedTimeEntry represents a specific blocked time slot on a staff calendar.
 * Can be one-time or recurring.
 */
export interface BlockedTimeEntry extends BaseSyncableEntity {
  // === STAFF REFERENCE ===
  staffId: string;
  staffName: string;

  // === TYPE REFERENCE (Denormalized) ===
  typeId: string;
  typeName: string;
  typeEmoji: string;
  typeColor: string;
  isPaid: boolean;

  // === TIMING ===
  /** Full datetime: "2025-12-25T12:00:00.000Z" */
  startDateTime: string;
  /** Full datetime: "2025-12-25T13:00:00.000Z" */
  endDateTime: string;
  /** Calculated duration in minutes */
  durationMinutes: number;

  // === RECURRENCE ===
  frequency: BlockedTimeFrequency;
  /** When recurring entries should stop */
  repeatEndDate: string | null;
  /** Alternative: stop after N occurrences */
  repeatCount: number | null;
  /** Links recurring entries in a series */
  seriesId: string | null;
  /** If this is a modified occurrence */
  isRecurrenceException: boolean;
  /** Original date if exception */
  originalDate: string | null;

  // === NOTES ===
  notes: string | null;

  // === CONTEXT ===
  /** If staff created for themselves */
  createdByStaffId: string | null;
  /** If manager created for staff */
  createdByManagerId: string | null;
}

export type BlockedTimeFrequency =
  | 'once'      // One-time block
  | 'daily'     // Every day
  | 'weekly'    // Same day each week
  | 'biweekly'  // Every 2 weeks
  | 'monthly';  // Same day each month

export interface CreateBlockedTimeEntryInput {
  staffId: string;
  staffName: string;
  typeId: string;
  startDateTime: string;
  endDateTime: string;
  frequency: BlockedTimeFrequency;
  repeatEndDate?: string | null;
  repeatCount?: number | null;
  notes?: string | null;
}
```

---

### 1.6 BusinessClosedPeriod Interface

**File:** `src/types/schedule/businessClosedPeriod.ts`

```typescript
import { BaseSyncableEntity } from '../common';

/**
 * BusinessClosedPeriod represents when the entire business or specific locations are closed.
 * Different from individual staff time-off.
 */
export interface BusinessClosedPeriod extends BaseSyncableEntity {
  // === IDENTITY ===
  /** Descriptive name: "Christmas Day", "Staff Training Day" */
  name: string;

  // === SCOPE ===
  /** If true, applies to all locations */
  appliesToAllLocations: boolean;
  /** Specific location IDs if not all */
  locationIds: string[];

  // === DATE RANGE ===
  startDate: string;
  endDate: string;

  // === PARTIAL DAY SUPPORT ===
  isPartialDay: boolean;
  /** Start time for partial day: "14:00" (close at 2pm) */
  startTime: string | null;
  /** End time for partial day */
  endTime: string | null;

  // === BOOKING BEHAVIOR ===
  blocksOnlineBooking: boolean;
  blocksInStoreBooking: boolean;

  // === DISPLAY ===
  color: string;
  notes: string | null;

  // === RECURRENCE ===
  /** If true, repeats on same dates each year */
  isAnnual: boolean;
}

export interface CreateBusinessClosedPeriodInput {
  name: string;
  appliesToAllLocations: boolean;
  locationIds?: string[];
  startDate: string;
  endDate: string;
  isPartialDay?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  blocksOnlineBooking?: boolean;
  blocksInStoreBooking?: boolean;
  color?: string;
  notes?: string | null;
  isAnnual?: boolean;
}
```

---

### 1.7 Resource Interface

**File:** `src/types/schedule/resource.ts`

```typescript
import { BaseSyncableEntity } from '../common';

/**
 * Resource represents a bookable physical asset (room, equipment, station).
 */
export interface Resource extends BaseSyncableEntity {
  // === IDENTITY ===
  name: string;
  description: string | null;

  // === CATEGORIZATION ===
  category: ResourceCategory;

  // === LOCATION ===
  locationId: string | null;
  locationName: string | null;

  // === CONFIGURATION ===
  /** Usually 1, but could be higher for shared resources */
  capacity: number;
  /** Whether this can be booked for appointments */
  isBookable: boolean;

  // === DISPLAY ===
  color: string;
  imageUrl: string | null;
  displayOrder: number;

  // === STATUS ===
  isActive: boolean;

  // === LINKED SERVICES ===
  /** Service IDs that can use this resource */
  linkedServiceIds: string[];
}

export type ResourceCategory =
  | 'room'
  | 'equipment'
  | 'station'
  | 'other';

export interface CreateResourceInput {
  name: string;
  description?: string | null;
  category: ResourceCategory;
  locationId?: string | null;
  capacity?: number;
  isBookable?: boolean;
  color?: string;
  displayOrder?: number;
  linkedServiceIds?: string[];
}
```

---

### 1.8 ResourceBooking Interface

**File:** `src/types/schedule/resourceBooking.ts`

```typescript
import { BaseSyncableEntity } from '../common';

/**
 * ResourceBooking links a resource to an appointment for a time slot.
 */
export interface ResourceBooking extends BaseSyncableEntity {
  // === RESOURCE REFERENCE ===
  resourceId: string;
  resourceName: string;

  // === APPOINTMENT REFERENCE ===
  appointmentId: string;

  // === TIMING ===
  startDateTime: string;
  endDateTime: string;

  // === STAFF CONTEXT ===
  staffId: string;
  staffName: string;

  // === ASSIGNMENT ===
  assignmentType: 'auto' | 'manual';
  assignedBy: string | null;
}

export interface CreateResourceBookingInput {
  resourceId: string;
  resourceName: string;
  appointmentId: string;
  startDateTime: string;
  endDateTime: string;
  staffId: string;
  staffName: string;
  assignmentType: 'auto' | 'manual';
  assignedBy?: string | null;
}
```

---

### 1.9 StaffSchedule Interface

**File:** `src/types/schedule/staffSchedule.ts`

```typescript
import { BaseSyncableEntity } from '../common';

/**
 * StaffSchedule defines the working pattern for a staff member.
 * Supports 1-4 week rotating patterns.
 */
export interface StaffSchedule extends BaseSyncableEntity {
  // === STAFF REFERENCE ===
  staffId: string;
  staffName: string;

  // === PATTERN CONFIGURATION ===
  /** Type of schedule pattern */
  patternType: SchedulePatternType;
  /** Number of weeks in the pattern (1-4) */
  patternWeeks: number;

  // === WEEK DEFINITIONS ===
  /** Array of week schedules, length = patternWeeks */
  weeks: WeekSchedule[];

  // === EFFECTIVE DATES ===
  /** When this schedule becomes active: "2025-01-01" */
  effectiveFrom: string;
  /** When this schedule ends (null = ongoing) */
  effectiveUntil: string | null;

  // === SOURCE ===
  /** Whether this is the initial default schedule */
  isDefault: boolean;
  /** If copied from another schedule */
  copiedFromScheduleId: string | null;
}

export type SchedulePatternType =
  | 'fixed'     // Same every week
  | 'rotating'; // Rotates over patternWeeks

export interface WeekSchedule {
  /** Week number in the pattern (1-4) */
  weekNumber: number;
  /** 7 days (index 0 = Sunday, 6 = Saturday) */
  days: DayScheduleConfig[];
}

export interface DayScheduleConfig {
  /** 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
  dayOfWeek: number;
  /** Whether staff works this day */
  isWorking: boolean;
  /** Shifts for this day (supports split shifts) */
  shifts: ShiftConfig[];
}

export interface ShiftConfig {
  /** Start time: "09:00" */
  startTime: string;
  /** End time: "17:00" */
  endTime: string;
  /** Type of shift */
  type: 'regular' | 'overtime';
  /** Optional notes for this shift */
  notes: string | null;
}

export interface CreateStaffScheduleInput {
  staffId: string;
  staffName: string;
  patternType: SchedulePatternType;
  patternWeeks: number;
  weeks: WeekSchedule[];
  effectiveFrom: string;
  effectiveUntil?: string | null;
}
```

---

### 1.10 Constants File

**File:** `src/types/schedule/constants.ts`

```typescript
import { TimeOffType } from './timeOffType';
import { BlockedTimeType } from './blockedTimeType';

/**
 * Default time-off types seeded on initialization
 */
export const DEFAULT_TIME_OFF_TYPES: Omit<TimeOffType, keyof import('../common').BaseSyncableEntity>[] = [
  {
    name: 'Vacation',
    code: 'VAC',
    emoji: '🏖️',
    color: '#10B981',
    isPaid: true,
    requiresApproval: true,
    annualLimitDays: null,
    accrualEnabled: false,
    accrualRatePerMonth: null,
    carryOverEnabled: false,
    maxCarryOverDays: null,
    displayOrder: 1,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Sick Leave',
    code: 'SICK',
    emoji: '🤒',
    color: '#EF4444',
    isPaid: true,
    requiresApproval: false,
    annualLimitDays: null,
    accrualEnabled: false,
    accrualRatePerMonth: null,
    carryOverEnabled: false,
    maxCarryOverDays: null,
    displayOrder: 2,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Personal Day',
    code: 'PTO',
    emoji: '🏠',
    color: '#8B5CF6',
    isPaid: true,
    requiresApproval: true,
    annualLimitDays: null,
    accrualEnabled: false,
    accrualRatePerMonth: null,
    carryOverEnabled: false,
    maxCarryOverDays: null,
    displayOrder: 3,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Unpaid Leave',
    code: 'UNPAID',
    emoji: '📋',
    color: '#6B7280',
    isPaid: false,
    requiresApproval: true,
    annualLimitDays: null,
    accrualEnabled: false,
    accrualRatePerMonth: null,
    carryOverEnabled: false,
    maxCarryOverDays: null,
    displayOrder: 4,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Maternity/Paternity',
    code: 'MAT',
    emoji: '👶',
    color: '#EC4899',
    isPaid: true,
    requiresApproval: true,
    annualLimitDays: null,
    accrualEnabled: false,
    accrualRatePerMonth: null,
    carryOverEnabled: false,
    maxCarryOverDays: null,
    displayOrder: 5,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Bereavement',
    code: 'BRV',
    emoji: '🕯️',
    color: '#374151',
    isPaid: true,
    requiresApproval: false,
    annualLimitDays: null,
    accrualEnabled: false,
    accrualRatePerMonth: null,
    carryOverEnabled: false,
    maxCarryOverDays: null,
    displayOrder: 6,
    isActive: true,
    isSystemDefault: true,
  },
];

/**
 * Default blocked time types seeded on initialization
 */
export const DEFAULT_BLOCKED_TIME_TYPES: Omit<BlockedTimeType, keyof import('../common').BaseSyncableEntity>[] = [
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
    isActive: true,
    isSystemDefault: true,
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
    isActive: true,
    isSystemDefault: true,
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
    isActive: true,
    isSystemDefault: true,
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
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Admin Tasks',
    code: 'ADMIN',
    emoji: '📋',
    color: '#6B7280',
    defaultDurationMinutes: 30,
    isPaid: true,
    blocksOnlineBooking: true,
    blocksInStoreBooking: false,
    displayOrder: 5,
    isActive: true,
    isSystemDefault: true,
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
    isActive: true,
    isSystemDefault: true,
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
    isActive: true,
    isSystemDefault: true,
  },
];

/**
 * Sync priorities for schedule entities
 * Lower number = higher priority
 */
export const SCHEDULE_SYNC_PRIORITIES = {
  timeOffTypes: 4,        // LOW - Reference data
  timeOffRequests: 3,     // NORMAL - Important but deferrable
  blockedTimeTypes: 4,    // LOW - Reference data
  blockedTimeEntries: 3,  // NORMAL
  businessClosedPeriods: 3, // NORMAL
  resources: 4,           // LOW - Reference data
  resourceBookings: 2,    // HIGH - Affects appointments
  staffSchedules: 3,      // NORMAL
} as const;

/**
 * Entity types for sync operations
 */
export const SCHEDULE_ENTITY_TYPES = [
  'timeOffType',
  'timeOffRequest',
  'blockedTimeType',
  'blockedTimeEntry',
  'businessClosedPeriod',
  'resource',
  'resourceBooking',
  'staffSchedule',
] as const;

export type ScheduleEntityType = typeof SCHEDULE_ENTITY_TYPES[number];
```

---

### 1.11 Barrel Export

**File:** `src/types/schedule/index.ts`

```typescript
// Time-Off
export * from './timeOffType';
export * from './timeOffRequest';

// Blocked Time
export * from './blockedTimeType';
export * from './blockedTimeEntry';

// Business Closures
export * from './businessClosedPeriod';

// Resources
export * from './resource';
export * from './resourceBooking';

// Staff Schedules
export * from './staffSchedule';

// Constants
export * from './constants';
```

---

## Task 2: Database Schema Update

### 2.1 Update Schema Version

**File:** `src/db/schema.ts`

Add to the database class and upgrade to version 5:

```typescript
// Add to MangoPOSDatabase class
class MangoPOSDatabase extends Dexie {
  // ... existing tables ...

  // Schedule Module Tables
  timeOffTypes!: Table<TimeOffType, string>;
  timeOffRequests!: Table<TimeOffRequest, string>;
  blockedTimeTypes!: Table<BlockedTimeType, string>;
  blockedTimeEntries!: Table<BlockedTimeEntry, string>;
  businessClosedPeriods!: Table<BusinessClosedPeriod, string>;
  resources!: Table<Resource, string>;
  resourceBookings!: Table<ResourceBooking, string>;
  staffSchedules!: Table<StaffSchedule, string>;
}

// Add version 5 with new tables
db.version(5).stores({
  // === EXISTING TABLES (Keep unchanged) ===
  appointments: 'id, salonId, clientId, staffId, status, scheduledStartTime, syncStatus, [salonId+status], [salonId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',

  tickets: 'id, salonId, clientId, status, createdAt, syncStatus, [salonId+status], [salonId+createdAt]',

  transactions: 'id, salonId, ticketId, status, createdAt, syncStatus, [salonId+status], [salonId+createdAt]',

  staff: 'id, salonId, status, syncStatus, [salonId+status]',

  clients: 'id, salonId, phone, email, syncStatus, [salonId+phone], [salonId+email]',

  services: 'id, salonId, categoryId, isActive, syncStatus, [salonId+categoryId], [salonId+isActive]',

  settings: 'id',

  syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',

  teamMembers: 'id, salonId, staffId, syncStatus, [salonId+staffId]',

  // === NEW SCHEDULE TABLES ===

  // Time-Off Types
  timeOffTypes: 'id, salonId, code, isActive, displayOrder, isSystemDefault, syncStatus, [salonId+isActive], [salonId+displayOrder]',

  // Time-Off Requests
  timeOffRequests: 'id, salonId, staffId, typeId, status, startDate, endDate, syncStatus, [salonId+status], [salonId+startDate], [staffId+status], [staffId+startDate], [salonId+staffId+status]',

  // Blocked Time Types
  blockedTimeTypes: 'id, salonId, code, isActive, displayOrder, isSystemDefault, syncStatus, [salonId+isActive], [salonId+displayOrder]',

  // Blocked Time Entries
  blockedTimeEntries: 'id, salonId, staffId, typeId, startDateTime, endDateTime, frequency, seriesId, syncStatus, [salonId+staffId], [staffId+startDateTime], [salonId+startDateTime], [seriesId]',

  // Business Closed Periods
  businessClosedPeriods: 'id, salonId, startDate, endDate, isAnnual, syncStatus, [salonId+startDate], [salonId+endDate]',

  // Resources
  resources: 'id, salonId, locationId, category, isActive, displayOrder, syncStatus, [salonId+isActive], [salonId+category], [salonId+locationId]',

  // Resource Bookings
  resourceBookings: 'id, salonId, resourceId, appointmentId, startDateTime, syncStatus, [resourceId+startDateTime], [appointmentId], [salonId+startDateTime]',

  // Staff Schedules
  staffSchedules: 'id, salonId, staffId, effectiveFrom, effectiveUntil, syncStatus, [salonId+staffId], [staffId+effectiveFrom]',
});
```

---

## Task 3: Database Operations

### 3.1 Schedule Database Operations

**File:** `src/db/scheduleDatabase.ts`

```typescript
import { db } from './schema';
import { v4 as uuidv4 } from 'uuid';
import {
  TimeOffType, CreateTimeOffTypeInput, UpdateTimeOffTypeInput,
  TimeOffRequest, CreateTimeOffRequestInput,
  BlockedTimeType, CreateBlockedTimeTypeInput,
  BlockedTimeEntry, CreateBlockedTimeEntryInput,
  BusinessClosedPeriod, CreateBusinessClosedPeriodInput,
  Resource, CreateResourceInput,
  ResourceBooking, CreateResourceBookingInput,
  StaffSchedule, CreateStaffScheduleInput,
  DEFAULT_TIME_OFF_TYPES,
  DEFAULT_BLOCKED_TIME_TYPES,
  SCHEDULE_SYNC_PRIORITIES,
} from '../types/schedule';
import { createBaseSyncableDefaults } from '../types/common';
import { syncQueueDB } from './database';

// ============================================================
// TIME-OFF TYPES
// ============================================================

export const timeOffTypesDB = {
  /**
   * Get all active time-off types for a salon
   */
  async getAll(salonId: string): Promise<TimeOffType[]> {
    return db.timeOffTypes
      .where('[salonId+isActive]')
      .equals([salonId, 1])
      .filter(t => !t.isDeleted)
      .sortBy('displayOrder');
  },

  /**
   * Get a single time-off type by ID
   */
  async getById(id: string): Promise<TimeOffType | undefined> {
    const type = await db.timeOffTypes.get(id);
    return type?.isDeleted ? undefined : type;
  },

  /**
   * Get time-off type by code
   */
  async getByCode(salonId: string, code: string): Promise<TimeOffType | undefined> {
    return db.timeOffTypes
      .where('salonId')
      .equals(salonId)
      .filter(t => t.code === code && !t.isDeleted)
      .first();
  },

  /**
   * Create a new time-off type
   */
  async create(
    input: CreateTimeOffTypeInput,
    userId: string,
    salonId: string,
    tenantId: string,
    deviceId: string
  ): Promise<TimeOffType> {
    const now = new Date().toISOString();
    const id = uuidv4();

    // Get next display order if not provided
    let displayOrder = input.displayOrder;
    if (displayOrder === undefined) {
      const existing = await db.timeOffTypes.where('salonId').equals(salonId).toArray();
      displayOrder = Math.max(0, ...existing.map(t => t.displayOrder)) + 1;
    }

    const timeOffType: TimeOffType = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, salonId),
      name: input.name,
      code: input.code,
      emoji: input.emoji,
      color: input.color,
      isPaid: input.isPaid,
      requiresApproval: input.requiresApproval,
      annualLimitDays: input.annualLimitDays ?? null,
      accrualEnabled: input.accrualEnabled ?? false,
      accrualRatePerMonth: input.accrualRatePerMonth ?? null,
      carryOverEnabled: input.carryOverEnabled ?? false,
      maxCarryOverDays: input.maxCarryOverDays ?? null,
      displayOrder,
      isActive: input.isActive ?? true,
      isSystemDefault: false,
    };

    await db.timeOffTypes.put(timeOffType);

    // Add to sync queue
    await syncQueueDB.add({
      type: 'create',
      entity: 'timeOffType',
      entityId: id,
      action: 'CREATE',
      payload: timeOffType,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffTypes,
      maxAttempts: 5,
    });

    return timeOffType;
  },

  /**
   * Update an existing time-off type
   */
  async update(
    id: string,
    updates: UpdateTimeOffTypeInput,
    userId: string,
    deviceId: string
  ): Promise<TimeOffType | undefined> {
    const existing = await db.timeOffTypes.get(id);
    if (!existing || existing.isDeleted) return undefined;

    const now = new Date().toISOString();
    const updated: TimeOffType = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.timeOffTypes.put(updated);

    await syncQueueDB.add({
      type: 'update',
      entity: 'timeOffType',
      entityId: id,
      action: 'UPDATE',
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffTypes,
      maxAttempts: 5,
    });

    return updated;
  },

  /**
   * Soft delete a time-off type
   */
  async delete(id: string, userId: string, deviceId: string): Promise<boolean> {
    const existing = await db.timeOffTypes.get(id);
    if (!existing || existing.isDeleted) return false;
    if (existing.isSystemDefault) {
      throw new Error('Cannot delete system default time-off type');
    }

    const now = new Date().toISOString();
    const deleted: TimeOffType = {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: userId,
      deletedByDevice: deviceId,
      tombstoneExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.timeOffTypes.put(deleted);

    await syncQueueDB.add({
      type: 'delete',
      entity: 'timeOffType',
      entityId: id,
      action: 'DELETE',
      payload: deleted,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffTypes,
      maxAttempts: 5,
    });

    return true;
  },

  /**
   * Seed default time-off types for a new salon
   */
  async seedDefaults(
    salonId: string,
    tenantId: string,
    userId: string,
    deviceId: string
  ): Promise<TimeOffType[]> {
    // Check if already seeded
    const existing = await db.timeOffTypes.where('salonId').equals(salonId).count();
    if (existing > 0) return [];

    const now = new Date().toISOString();
    const types: TimeOffType[] = DEFAULT_TIME_OFF_TYPES.map((t, index) => ({
      id: uuidv4(),
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, salonId),
      ...t,
      displayOrder: index + 1,
    }));

    await db.timeOffTypes.bulkPut(types);

    // Queue for sync
    for (const type of types) {
      await syncQueueDB.add({
        type: 'create',
        entity: 'timeOffType',
        entityId: type.id,
        action: 'CREATE',
        payload: type,
        priority: SCHEDULE_SYNC_PRIORITIES.timeOffTypes,
        maxAttempts: 5,
      });
    }

    return types;
  },
};

// ============================================================
// TIME-OFF REQUESTS
// ============================================================

export const timeOffRequestsDB = {
  async getAll(salonId: string, filters?: {
    status?: string;
    staffId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TimeOffRequest[]> {
    let results = await db.timeOffRequests
      .where('salonId')
      .equals(salonId)
      .filter(r => !r.isDeleted)
      .toArray();

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
  },

  async getById(id: string): Promise<TimeOffRequest | undefined> {
    const request = await db.timeOffRequests.get(id);
    return request?.isDeleted ? undefined : request;
  },

  async getPendingCount(salonId: string): Promise<number> {
    return db.timeOffRequests
      .where('[salonId+status]')
      .equals([salonId, 'pending'])
      .filter(r => !r.isDeleted)
      .count();
  },

  async create(
    input: CreateTimeOffRequestInput,
    typeDetails: Pick<TimeOffType, 'name' | 'emoji' | 'color' | 'isPaid' | 'requiresApproval'>,
    totalHours: number,
    totalDays: number,
    conflictingAppointmentIds: string[],
    userId: string,
    salonId: string,
    tenantId: string,
    deviceId: string
  ): Promise<TimeOffRequest> {
    const now = new Date().toISOString();
    const id = uuidv4();

    const initialStatus = typeDetails.requiresApproval ? 'pending' : 'approved';

    const request: TimeOffRequest = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, salonId),
      staffId: input.staffId,
      staffName: input.staffName,
      typeId: input.typeId,
      typeName: typeDetails.name,
      typeEmoji: typeDetails.emoji,
      typeColor: typeDetails.color,
      isPaid: typeDetails.isPaid,
      startDate: input.startDate,
      endDate: input.endDate,
      isAllDay: input.isAllDay,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      totalHours,
      totalDays,
      status: initialStatus,
      statusHistory: [{
        from: null,
        to: initialStatus,
        changedAt: now,
        changedBy: userId,
        changedByDevice: deviceId,
      }],
      notes: input.notes ?? null,
      approvedBy: initialStatus === 'approved' ? 'system' : null,
      approvedByName: initialStatus === 'approved' ? 'Auto-approved' : null,
      approvedAt: initialStatus === 'approved' ? now : null,
      approvalNotes: null,
      deniedBy: null,
      deniedByName: null,
      deniedAt: null,
      denialReason: null,
      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,
      hasConflicts: conflictingAppointmentIds.length > 0,
      conflictingAppointmentIds,
    };

    await db.timeOffRequests.put(request);

    await syncQueueDB.add({
      type: 'create',
      entity: 'timeOffRequest',
      entityId: id,
      action: 'CREATE',
      payload: request,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffRequests,
      maxAttempts: 5,
    });

    return request;
  },

  async approve(
    id: string,
    approverName: string,
    notes: string | null,
    userId: string,
    deviceId: string
  ): Promise<TimeOffRequest | undefined> {
    const existing = await db.timeOffRequests.get(id);
    if (!existing || existing.isDeleted || existing.status !== 'pending') {
      return undefined;
    }

    const now = new Date().toISOString();
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
      approvedByName: approverName,
      approvedAt: now,
      approvalNotes: notes,
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.timeOffRequests.put(updated);

    await syncQueueDB.add({
      type: 'update',
      entity: 'timeOffRequest',
      entityId: id,
      action: 'UPDATE',
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffRequests,
      maxAttempts: 5,
    });

    return updated;
  },

  async deny(
    id: string,
    denierName: string,
    reason: string,
    userId: string,
    deviceId: string
  ): Promise<TimeOffRequest | undefined> {
    if (!reason?.trim()) {
      throw new Error('Denial reason is required');
    }

    const existing = await db.timeOffRequests.get(id);
    if (!existing || existing.isDeleted || existing.status !== 'pending') {
      return undefined;
    }

    const now = new Date().toISOString();
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
      deniedByName: denierName,
      deniedAt: now,
      denialReason: reason,
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.timeOffRequests.put(updated);

    await syncQueueDB.add({
      type: 'update',
      entity: 'timeOffRequest',
      entityId: id,
      action: 'UPDATE',
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffRequests,
      maxAttempts: 5,
    });

    return updated;
  },

  async cancel(
    id: string,
    reason: string | null,
    userId: string,
    deviceId: string
  ): Promise<TimeOffRequest | undefined> {
    const existing = await db.timeOffRequests.get(id);
    if (!existing || existing.isDeleted || existing.status !== 'pending') {
      return undefined;
    }

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
          reason: reason ?? undefined,
        },
      ],
      cancelledAt: now,
      cancelledBy: userId,
      cancellationReason: reason,
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.timeOffRequests.put(updated);

    await syncQueueDB.add({
      type: 'update',
      entity: 'timeOffRequest',
      entityId: id,
      action: 'UPDATE',
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffRequests,
      maxAttempts: 5,
    });

    return updated;
  },
};

// ============================================================
// BLOCKED TIME TYPES
// ============================================================

export const blockedTimeTypesDB = {
  async getAll(salonId: string): Promise<BlockedTimeType[]> {
    return db.blockedTimeTypes
      .where('[salonId+isActive]')
      .equals([salonId, 1])
      .filter(t => !t.isDeleted)
      .sortBy('displayOrder');
  },

  async getById(id: string): Promise<BlockedTimeType | undefined> {
    const type = await db.blockedTimeTypes.get(id);
    return type?.isDeleted ? undefined : type;
  },

  async create(
    input: CreateBlockedTimeTypeInput,
    userId: string,
    salonId: string,
    tenantId: string,
    deviceId: string
  ): Promise<BlockedTimeType> {
    const id = uuidv4();

    let displayOrder = input.displayOrder;
    if (displayOrder === undefined) {
      const existing = await db.blockedTimeTypes.where('salonId').equals(salonId).toArray();
      displayOrder = Math.max(0, ...existing.map(t => t.displayOrder)) + 1;
    }

    const type: BlockedTimeType = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, salonId),
      name: input.name,
      code: input.code,
      emoji: input.emoji,
      color: input.color,
      defaultDurationMinutes: input.defaultDurationMinutes,
      isPaid: input.isPaid,
      blocksOnlineBooking: input.blocksOnlineBooking ?? true,
      blocksInStoreBooking: input.blocksInStoreBooking ?? true,
      displayOrder,
      isActive: input.isActive ?? true,
      isSystemDefault: false,
    };

    await db.blockedTimeTypes.put(type);

    await syncQueueDB.add({
      type: 'create',
      entity: 'blockedTimeType',
      entityId: id,
      action: 'CREATE',
      payload: type,
      priority: SCHEDULE_SYNC_PRIORITIES.blockedTimeTypes,
      maxAttempts: 5,
    });

    return type;
  },

  async seedDefaults(
    salonId: string,
    tenantId: string,
    userId: string,
    deviceId: string
  ): Promise<BlockedTimeType[]> {
    const existing = await db.blockedTimeTypes.where('salonId').equals(salonId).count();
    if (existing > 0) return [];

    const types: BlockedTimeType[] = DEFAULT_BLOCKED_TIME_TYPES.map((t, index) => ({
      id: uuidv4(),
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, salonId),
      ...t,
      displayOrder: index + 1,
    }));

    await db.blockedTimeTypes.bulkPut(types);

    for (const type of types) {
      await syncQueueDB.add({
        type: 'create',
        entity: 'blockedTimeType',
        entityId: type.id,
        action: 'CREATE',
        payload: type,
        priority: SCHEDULE_SYNC_PRIORITIES.blockedTimeTypes,
        maxAttempts: 5,
      });
    }

    return types;
  },

  // Similar update and delete methods as timeOffTypesDB...
};

// ============================================================
// BLOCKED TIME ENTRIES
// ============================================================

export const blockedTimeEntriesDB = {
  async getAll(salonId: string, filters?: {
    staffId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<BlockedTimeEntry[]> {
    let results = await db.blockedTimeEntries
      .where('salonId')
      .equals(salonId)
      .filter(e => !e.isDeleted)
      .toArray();

    if (filters?.staffId) {
      results = results.filter(e => e.staffId === filters.staffId);
    }
    if (filters?.startDate) {
      results = results.filter(e => e.endDateTime >= filters.startDate!);
    }
    if (filters?.endDate) {
      results = results.filter(e => e.startDateTime <= filters.endDate!);
    }

    return results.sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
  },

  async getById(id: string): Promise<BlockedTimeEntry | undefined> {
    const entry = await db.blockedTimeEntries.get(id);
    return entry?.isDeleted ? undefined : entry;
  },

  async getByStaffAndDate(staffId: string, date: string): Promise<BlockedTimeEntry[]> {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    return db.blockedTimeEntries
      .where('[staffId+startDateTime]')
      .between([staffId, startOfDay], [staffId, endOfDay])
      .filter(e => !e.isDeleted)
      .toArray();
  },

  async create(
    input: CreateBlockedTimeEntryInput,
    typeDetails: Pick<BlockedTimeType, 'name' | 'emoji' | 'color' | 'isPaid'>,
    userId: string,
    salonId: string,
    tenantId: string,
    deviceId: string,
    isManager: boolean
  ): Promise<BlockedTimeEntry> {
    const id = uuidv4();
    const seriesId = input.frequency !== 'once' ? uuidv4() : null;

    const startDateTime = new Date(input.startDateTime);
    const endDateTime = new Date(input.endDateTime);
    const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));

    const entry: BlockedTimeEntry = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, salonId),
      staffId: input.staffId,
      staffName: input.staffName,
      typeId: input.typeId,
      typeName: typeDetails.name,
      typeEmoji: typeDetails.emoji,
      typeColor: typeDetails.color,
      isPaid: typeDetails.isPaid,
      startDateTime: input.startDateTime,
      endDateTime: input.endDateTime,
      durationMinutes,
      frequency: input.frequency,
      repeatEndDate: input.repeatEndDate ?? null,
      repeatCount: input.repeatCount ?? null,
      seriesId,
      isRecurrenceException: false,
      originalDate: null,
      notes: input.notes ?? null,
      createdByStaffId: isManager ? null : userId,
      createdByManagerId: isManager ? userId : null,
    };

    await db.blockedTimeEntries.put(entry);

    await syncQueueDB.add({
      type: 'create',
      entity: 'blockedTimeEntry',
      entityId: id,
      action: 'CREATE',
      payload: entry,
      priority: SCHEDULE_SYNC_PRIORITIES.blockedTimeEntries,
      maxAttempts: 5,
    });

    return entry;
  },

  // Similar update and delete methods...
};

// ============================================================
// BUSINESS CLOSED PERIODS
// ============================================================

export const businessClosedPeriodsDB = {
  async getAll(salonId: string): Promise<BusinessClosedPeriod[]> {
    return db.businessClosedPeriods
      .where('salonId')
      .equals(salonId)
      .filter(p => !p.isDeleted)
      .sortBy('startDate');
  },

  async getById(id: string): Promise<BusinessClosedPeriod | undefined> {
    const period = await db.businessClosedPeriods.get(id);
    return period?.isDeleted ? undefined : period;
  },

  async getUpcoming(salonId: string): Promise<BusinessClosedPeriod[]> {
    const today = new Date().toISOString().split('T')[0];
    return db.businessClosedPeriods
      .where('[salonId+endDate]')
      .aboveOrEqual([salonId, today])
      .filter(p => !p.isDeleted)
      .sortBy('startDate');
  },

  async getForDate(salonId: string, date: string): Promise<BusinessClosedPeriod | undefined> {
    return db.businessClosedPeriods
      .where('salonId')
      .equals(salonId)
      .filter(p => !p.isDeleted && p.startDate <= date && p.endDate >= date)
      .first();
  },

  async create(
    input: CreateBusinessClosedPeriodInput,
    userId: string,
    salonId: string,
    tenantId: string,
    deviceId: string
  ): Promise<BusinessClosedPeriod> {
    const id = uuidv4();

    const period: BusinessClosedPeriod = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, salonId),
      name: input.name,
      appliesToAllLocations: input.appliesToAllLocations,
      locationIds: input.locationIds ?? [],
      startDate: input.startDate,
      endDate: input.endDate,
      isPartialDay: input.isPartialDay ?? false,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      blocksOnlineBooking: input.blocksOnlineBooking ?? true,
      blocksInStoreBooking: input.blocksInStoreBooking ?? true,
      color: input.color ?? '#6B7280',
      notes: input.notes ?? null,
      isAnnual: input.isAnnual ?? false,
    };

    await db.businessClosedPeriods.put(period);

    await syncQueueDB.add({
      type: 'create',
      entity: 'businessClosedPeriod',
      entityId: id,
      action: 'CREATE',
      payload: period,
      priority: SCHEDULE_SYNC_PRIORITIES.businessClosedPeriods,
      maxAttempts: 5,
    });

    return period;
  },

  // Similar update and delete methods...
};

// ============================================================
// RESOURCES
// ============================================================

export const resourcesDB = {
  async getAll(salonId: string): Promise<Resource[]> {
    return db.resources
      .where('[salonId+isActive]')
      .equals([salonId, 1])
      .filter(r => !r.isDeleted)
      .sortBy('displayOrder');
  },

  async getById(id: string): Promise<Resource | undefined> {
    const resource = await db.resources.get(id);
    return resource?.isDeleted ? undefined : resource;
  },

  async getByCategory(salonId: string, category: string): Promise<Resource[]> {
    return db.resources
      .where('[salonId+category]')
      .equals([salonId, category])
      .filter(r => !r.isDeleted && r.isActive)
      .sortBy('displayOrder');
  },

  async create(
    input: CreateResourceInput,
    userId: string,
    salonId: string,
    tenantId: string,
    deviceId: string
  ): Promise<Resource> {
    const id = uuidv4();

    let displayOrder = input.displayOrder;
    if (displayOrder === undefined) {
      const existing = await db.resources.where('salonId').equals(salonId).toArray();
      displayOrder = Math.max(0, ...existing.map(r => r.displayOrder)) + 1;
    }

    const resource: Resource = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, salonId),
      name: input.name,
      description: input.description ?? null,
      category: input.category,
      locationId: input.locationId ?? null,
      locationName: null, // Should be populated from location lookup
      capacity: input.capacity ?? 1,
      isBookable: input.isBookable ?? true,
      color: input.color ?? '#3B82F6',
      imageUrl: null,
      displayOrder,
      isActive: true,
      linkedServiceIds: input.linkedServiceIds ?? [],
    };

    await db.resources.put(resource);

    await syncQueueDB.add({
      type: 'create',
      entity: 'resource',
      entityId: id,
      action: 'CREATE',
      payload: resource,
      priority: SCHEDULE_SYNC_PRIORITIES.resources,
      maxAttempts: 5,
    });

    return resource;
  },

  // Similar update and delete methods...
};

// ============================================================
// RESOURCE BOOKINGS
// ============================================================

export const resourceBookingsDB = {
  async getByResource(resourceId: string, startDate: string, endDate: string): Promise<ResourceBooking[]> {
    return db.resourceBookings
      .where('[resourceId+startDateTime]')
      .between([resourceId, startDate], [resourceId, endDate])
      .filter(b => !b.isDeleted)
      .toArray();
  },

  async getByAppointment(appointmentId: string): Promise<ResourceBooking | undefined> {
    return db.resourceBookings
      .where('appointmentId')
      .equals(appointmentId)
      .filter(b => !b.isDeleted)
      .first();
  },

  async create(
    input: CreateResourceBookingInput,
    userId: string,
    salonId: string,
    tenantId: string,
    deviceId: string
  ): Promise<ResourceBooking> {
    const id = uuidv4();

    const booking: ResourceBooking = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, salonId),
      ...input,
    };

    await db.resourceBookings.put(booking);

    await syncQueueDB.add({
      type: 'create',
      entity: 'resourceBooking',
      entityId: id,
      action: 'CREATE',
      payload: booking,
      priority: SCHEDULE_SYNC_PRIORITIES.resourceBookings,
      maxAttempts: 5,
    });

    return booking;
  },

  // Similar update and delete methods...
};

// ============================================================
// STAFF SCHEDULES
// ============================================================

export const staffSchedulesDB = {
  async getByStaff(staffId: string): Promise<StaffSchedule[]> {
    return db.staffSchedules
      .where('staffId')
      .equals(staffId)
      .filter(s => !s.isDeleted)
      .sortBy('effectiveFrom');
  },

  async getCurrentForStaff(staffId: string): Promise<StaffSchedule | undefined> {
    const today = new Date().toISOString().split('T')[0];
    return db.staffSchedules
      .where('staffId')
      .equals(staffId)
      .filter(s =>
        !s.isDeleted &&
        s.effectiveFrom <= today &&
        (!s.effectiveUntil || s.effectiveUntil >= today)
      )
      .first();
  },

  async create(
    input: CreateStaffScheduleInput,
    userId: string,
    salonId: string,
    tenantId: string,
    deviceId: string
  ): Promise<StaffSchedule> {
    const id = uuidv4();

    const schedule: StaffSchedule = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, salonId),
      staffId: input.staffId,
      staffName: input.staffName,
      patternType: input.patternType,
      patternWeeks: input.patternWeeks,
      weeks: input.weeks,
      effectiveFrom: input.effectiveFrom,
      effectiveUntil: input.effectiveUntil ?? null,
      isDefault: false,
      copiedFromScheduleId: null,
    };

    await db.staffSchedules.put(schedule);

    await syncQueueDB.add({
      type: 'create',
      entity: 'staffSchedule',
      entityId: id,
      action: 'CREATE',
      payload: schedule,
      priority: SCHEDULE_SYNC_PRIORITIES.staffSchedules,
      maxAttempts: 5,
    });

    return schedule;
  },

  // Similar update and delete methods...
};

// ============================================================
// SEEDING HELPER
// ============================================================

/**
 * Seed all default schedule data for a new salon
 */
export async function seedScheduleDefaults(
  salonId: string,
  tenantId: string,
  userId: string,
  deviceId: string
): Promise<{
  timeOffTypes: TimeOffType[];
  blockedTimeTypes: BlockedTimeType[];
}> {
  const timeOffTypes = await timeOffTypesDB.seedDefaults(salonId, tenantId, userId, deviceId);
  const blockedTimeTypes = await blockedTimeTypesDB.seedDefaults(salonId, tenantId, userId, deviceId);

  return { timeOffTypes, blockedTimeTypes };
}
```

---

## Task 4: Update Common Types

### 4.1 Add Schedule Entities to EntityType

**File:** `src/types/common.ts` (Update)

```typescript
// Add to EntityType union
export type EntityType =
  | 'appointment'
  | 'ticket'
  | 'transaction'
  | 'client'
  | 'staff'
  | 'service'
  | 'teamMember'
  // Schedule entities
  | 'timeOffType'
  | 'timeOffRequest'
  | 'blockedTimeType'
  | 'blockedTimeEntry'
  | 'businessClosedPeriod'
  | 'resource'
  | 'resourceBooking'
  | 'staffSchedule';
```

---

## Task 5: Migration Script

### 5.1 Database Migration

**File:** `src/db/migrations/v5-schedule-module.ts`

```typescript
import { db } from '../schema';
import { seedScheduleDefaults } from '../scheduleDatabase';

/**
 * Migration to v5: Add Schedule Module tables
 * Run after database version upgrade
 */
export async function migrateToV5(): Promise<void> {
  console.log('[Migration] Starting v5 Schedule Module migration...');

  // Check if migration already completed
  const migrationKey = 'v5_schedule_module_migrated';
  const existing = await db.settings.get(migrationKey);
  if (existing) {
    console.log('[Migration] v5 already completed, skipping');
    return;
  }

  // Get unique salons that need seeding
  const appointments = await db.appointments.limit(1).toArray();
  if (appointments.length > 0) {
    const salonId = appointments[0].salonId;
    const tenantId = appointments[0].tenantId || salonId; // Fallback if tenantId not set

    console.log(`[Migration] Seeding defaults for salon: ${salonId}`);

    // Seed default types
    // Note: We need userId and deviceId - use system defaults for migration
    const systemUserId = 'system-migration';
    const systemDeviceId = 'migration-v5';

    await seedScheduleDefaults(salonId, tenantId, systemUserId, systemDeviceId);
  }

  // Mark migration complete
  await db.settings.put({ id: migrationKey, value: { completedAt: new Date().toISOString() } });

  console.log('[Migration] v5 Schedule Module migration complete');
}
```

---

## Task 6: Unit Tests

### 6.1 Type Tests

**File:** `src/types/schedule/__tests__/types.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  TimeOffType,
  TimeOffRequest,
  BlockedTimeType,
  BlockedTimeEntry,
  DEFAULT_TIME_OFF_TYPES,
  DEFAULT_BLOCKED_TIME_TYPES,
} from '../index';

describe('Schedule Types', () => {
  describe('DEFAULT_TIME_OFF_TYPES', () => {
    it('should have 6 default types', () => {
      expect(DEFAULT_TIME_OFF_TYPES).toHaveLength(6);
    });

    it('should have unique codes', () => {
      const codes = DEFAULT_TIME_OFF_TYPES.map(t => t.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should have sequential display orders', () => {
      const orders = DEFAULT_TIME_OFF_TYPES.map(t => t.displayOrder);
      expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should all be system defaults', () => {
      expect(DEFAULT_TIME_OFF_TYPES.every(t => t.isSystemDefault)).toBe(true);
    });
  });

  describe('DEFAULT_BLOCKED_TIME_TYPES', () => {
    it('should have 7 default types', () => {
      expect(DEFAULT_BLOCKED_TIME_TYPES).toHaveLength(7);
    });

    it('should have unique codes', () => {
      const codes = DEFAULT_BLOCKED_TIME_TYPES.map(t => t.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it('should have valid default durations', () => {
      expect(DEFAULT_BLOCKED_TIME_TYPES.every(t => t.defaultDurationMinutes > 0)).toBe(true);
    });
  });
});
```

### 6.2 Database Operation Tests

**File:** `src/db/__tests__/scheduleDatabase.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../schema';
import {
  timeOffTypesDB,
  timeOffRequestsDB,
  blockedTimeTypesDB,
  seedScheduleDefaults,
} from '../scheduleDatabase';

describe('Schedule Database Operations', () => {
  const testSalonId = 'test-salon-1';
  const testTenantId = 'test-tenant-1';
  const testUserId = 'test-user-1';
  const testDeviceId = 'test-device-1';

  beforeEach(async () => {
    // Clear all schedule tables
    await db.timeOffTypes.clear();
    await db.timeOffRequests.clear();
    await db.blockedTimeTypes.clear();
    await db.blockedTimeEntries.clear();
    await db.businessClosedPeriods.clear();
    await db.resources.clear();
    await db.resourceBookings.clear();
    await db.staffSchedules.clear();
  });

  describe('seedScheduleDefaults', () => {
    it('should seed default time-off and blocked time types', async () => {
      const result = await seedScheduleDefaults(
        testSalonId,
        testTenantId,
        testUserId,
        testDeviceId
      );

      expect(result.timeOffTypes).toHaveLength(6);
      expect(result.blockedTimeTypes).toHaveLength(7);
    });

    it('should not duplicate on second call', async () => {
      await seedScheduleDefaults(testSalonId, testTenantId, testUserId, testDeviceId);
      const result = await seedScheduleDefaults(testSalonId, testTenantId, testUserId, testDeviceId);

      expect(result.timeOffTypes).toHaveLength(0);
      expect(result.blockedTimeTypes).toHaveLength(0);

      const allTimeOffTypes = await db.timeOffTypes.toArray();
      expect(allTimeOffTypes).toHaveLength(6);
    });
  });

  describe('timeOffTypesDB', () => {
    beforeEach(async () => {
      await seedScheduleDefaults(testSalonId, testTenantId, testUserId, testDeviceId);
    });

    it('should get all active types for a salon', async () => {
      const types = await timeOffTypesDB.getAll(testSalonId);
      expect(types.length).toBeGreaterThan(0);
      expect(types.every(t => t.isActive && !t.isDeleted)).toBe(true);
    });

    it('should create a custom type', async () => {
      const created = await timeOffTypesDB.create(
        {
          name: 'Jury Duty',
          code: 'JURY',
          emoji: '⚖️',
          color: '#6366F1',
          isPaid: true,
          requiresApproval: false,
        },
        testUserId,
        testSalonId,
        testTenantId,
        testDeviceId
      );

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Jury Duty');
      expect(created.isSystemDefault).toBe(false);
      expect(created.syncStatus).toBe('pending');
    });

    it('should not delete system default types', async () => {
      const types = await timeOffTypesDB.getAll(testSalonId);
      const systemType = types.find(t => t.isSystemDefault);

      await expect(
        timeOffTypesDB.delete(systemType!.id, testUserId, testDeviceId)
      ).rejects.toThrow('Cannot delete system default');
    });
  });

  describe('timeOffRequestsDB', () => {
    let typeId: string;

    beforeEach(async () => {
      await seedScheduleDefaults(testSalonId, testTenantId, testUserId, testDeviceId);
      const types = await timeOffTypesDB.getAll(testSalonId);
      typeId = types[0].id;
    });

    it('should create a time-off request', async () => {
      const type = await timeOffTypesDB.getById(typeId);

      const request = await timeOffRequestsDB.create(
        {
          staffId: 'staff-1',
          staffName: 'Jane Doe',
          typeId,
          startDate: '2025-12-25',
          endDate: '2025-12-26',
          isAllDay: true,
        },
        {
          name: type!.name,
          emoji: type!.emoji,
          color: type!.color,
          isPaid: type!.isPaid,
          requiresApproval: type!.requiresApproval,
        },
        16, // totalHours
        2,  // totalDays
        [], // no conflicts
        testUserId,
        testSalonId,
        testTenantId,
        testDeviceId
      );

      expect(request.id).toBeDefined();
      expect(request.status).toBe('pending'); // Type requires approval
      expect(request.staffName).toBe('Jane Doe');
    });

    it('should approve a pending request', async () => {
      const type = await timeOffTypesDB.getById(typeId);

      const request = await timeOffRequestsDB.create(
        {
          staffId: 'staff-1',
          staffName: 'Jane Doe',
          typeId,
          startDate: '2025-12-25',
          endDate: '2025-12-25',
          isAllDay: true,
        },
        { name: type!.name, emoji: type!.emoji, color: type!.color, isPaid: type!.isPaid, requiresApproval: true },
        8, 1, [],
        testUserId, testSalonId, testTenantId, testDeviceId
      );

      const approved = await timeOffRequestsDB.approve(
        request.id,
        'Manager Name',
        'Approved for the holidays',
        testUserId,
        testDeviceId
      );

      expect(approved?.status).toBe('approved');
      expect(approved?.approvedByName).toBe('Manager Name');
      expect(approved?.statusHistory).toHaveLength(2);
    });

    it('should require reason when denying', async () => {
      const type = await timeOffTypesDB.getById(typeId);

      const request = await timeOffRequestsDB.create(
        {
          staffId: 'staff-1',
          staffName: 'Jane Doe',
          typeId,
          startDate: '2025-12-25',
          endDate: '2025-12-25',
          isAllDay: true,
        },
        { name: type!.name, emoji: type!.emoji, color: type!.color, isPaid: type!.isPaid, requiresApproval: true },
        8, 1, [],
        testUserId, testSalonId, testTenantId, testDeviceId
      );

      await expect(
        timeOffRequestsDB.deny(request.id, 'Manager', '', testUserId, testDeviceId)
      ).rejects.toThrow('Denial reason is required');
    });
  });
});
```

---

## Summary: Phase 1 Deliverables

### Files to Create

| File | Purpose |
|------|---------|
| `src/types/schedule/index.ts` | Barrel export |
| `src/types/schedule/timeOffType.ts` | Time-off type interface |
| `src/types/schedule/timeOffRequest.ts` | Time-off request interface |
| `src/types/schedule/blockedTimeType.ts` | Blocked time type interface |
| `src/types/schedule/blockedTimeEntry.ts` | Blocked time entry interface |
| `src/types/schedule/businessClosedPeriod.ts` | Business closure interface |
| `src/types/schedule/resource.ts` | Resource interface |
| `src/types/schedule/resourceBooking.ts` | Resource booking interface |
| `src/types/schedule/staffSchedule.ts` | Staff schedule interface |
| `src/types/schedule/constants.ts` | Default types & constants |
| `src/db/scheduleDatabase.ts` | All schedule CRUD operations |
| `src/db/migrations/v5-schedule-module.ts` | Database migration |
| `src/types/schedule/__tests__/types.test.ts` | Type tests |
| `src/db/__tests__/scheduleDatabase.test.ts` | DB operation tests |

### Files to Modify

| File | Changes |
|------|---------|
| `src/db/schema.ts` | Add v5 with new tables |
| `src/types/common.ts` | Add schedule entity types |
| `src/types/index.ts` | Export schedule types |

---

## Implementation Order

1. **Day 1-2:** Create all type definition files
2. **Day 3:** Update database schema (v5)
3. **Day 4:** Implement database operations
4. **Day 5:** Write unit tests
5. **Day 6:** Migration script & integration testing
6. **Day 7:** Review & cleanup

---

## Verification Checklist

- [ ] All type files compile without errors
- [ ] Database schema upgrade works (v4 → v5)
- [ ] All CRUD operations work in isolation
- [ ] Sync queue integration works
- [ ] Default seeding works for new salons
- [ ] Unit tests pass (types + database)
- [ ] Migration script runs successfully
- [ ] No regressions in existing functionality

---

Ready for implementation? Let me know and I'll start with the type definitions!
