# Schedule Module Enhancement Plan
## Implementing Fresha-Level Team Scheduling Features

**Created:** 2025-12-01
**Reference:** [Fresha Help Center - Calendar & Schedule](https://www.fresha.com/help-center/knowledge-base/calendar)
**Status:** Planning

---

## Executive Summary

This plan outlines the implementation of 8 key scheduling features from Fresha that are currently missing or incomplete in Mango POS. The features are prioritized based on user impact and implementation complexity.

---

## Current State Analysis

### What Mango POS Already Has

| Feature | Status | Location |
|---------|--------|----------|
| Regular weekly schedules | ✅ Complete | `AddEditScheduleModal.tsx` |
| Multiple shifts per day | ✅ Complete | `TimeSlot[]` arrays |
| Break times | ✅ Complete | `breakTimes` in WorkingDay |
| Time-off requests | ⚠️ Partial | Types exist, UI incomplete |
| Schedule overrides | ⚠️ Partial | Types exist, not fully wired |
| Repeat patterns | ⚠️ Basic | Only weekly/biweekly/monthly |
| Approval workflow | ⚠️ Types only | `TimeOffRequest.status` exists |

### What's Missing

1. **Customizable Time-Off Types** - Only hardcoded types exist
2. **Blocked Time Types** - No dedicated blocked time system
3. **Business Closed Periods** - No location-wide closure support
4. **Resource Scheduling** - No rooms/equipment management
5. **Multi-Week Patterns** - No 3-week or 4-week cycles
6. **Paid/Unpaid Tracking** - No compensation categorization
7. **Timesheet Automation** - No auto clock-in from shifts
8. **Full Mobile Parity** - Desktop-focused implementation

---

## Implementation Phases

### Phase 1: Time-Off Types System (Priority: HIGH)
**Estimated Complexity:** Medium
**Files to Modify:** 5-7 files

#### 1.1 Create Time-Off Types Configuration

**New File:** `src/types/timeOff.ts`
```typescript
export interface TimeOffType {
  id: string;
  name: string;
  emoji: string;           // e.g., "🏖️", "🤒", "👶"
  color: string;           // Hex color for calendar display
  isPaid: boolean;         // Compensation tracking
  requiresApproval: boolean;
  maxDaysPerYear?: number; // Optional annual limit
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default types to seed
export const DEFAULT_TIME_OFF_TYPES: TimeOffType[] = [
  { id: 'vacation', name: 'Vacation', emoji: '🏖️', color: '#10B981', isPaid: true, requiresApproval: true, isActive: true },
  { id: 'sick', name: 'Sick Leave', emoji: '🤒', color: '#EF4444', isPaid: true, requiresApproval: false, isActive: true },
  { id: 'personal', name: 'Personal Day', emoji: '🏠', color: '#8B5CF6', isPaid: true, requiresApproval: true, isActive: true },
  { id: 'unpaid', name: 'Unpaid Leave', emoji: '📋', color: '#6B7280', isPaid: false, requiresApproval: true, isActive: true },
  { id: 'maternity', name: 'Maternity/Paternity', emoji: '👶', color: '#EC4899', isPaid: true, requiresApproval: true, isActive: true },
  { id: 'bereavement', name: 'Bereavement', emoji: '🕯️', color: '#1F2937', isPaid: true, requiresApproval: false, isActive: true },
];
```

#### 1.2 Database Schema Update

**File:** `src/db/schema.ts`
```typescript
// Add new table
timeOffTypes: '++id, salonId, name, isActive, syncStatus',
```

#### 1.3 Settings UI for Time-Off Types

**New File:** `src/components/settings/TimeOffTypesSettings.tsx`

Features:
- [ ] List all time-off types with edit/delete
- [ ] Add new custom type with name, emoji picker, color picker
- [ ] Toggle paid/unpaid
- [ ] Toggle requires approval
- [ ] Set max days per year (optional)
- [ ] Reorder types (drag-drop)

#### 1.4 Update TimeOffModal

**File:** `src/components/schedule/TimeOffModal.tsx`

Changes:
- [ ] Replace hardcoded type dropdown with dynamic list from `timeOffTypes` table
- [ ] Show emoji + name in dropdown
- [ ] Display paid/unpaid indicator
- [ ] Calculate hours based on scheduled shift (like Fresha)

#### Todo Checklist - Phase 1
- [ ] Create `src/types/timeOff.ts` with interfaces
- [ ] Update `src/db/schema.ts` with timeOffTypes table
- [ ] Create `src/db/timeOffOperations.ts` for CRUD
- [ ] Create `TimeOffTypesSettings.tsx` component
- [ ] Add route to Settings page
- [ ] Update `TimeOffModal.tsx` to use dynamic types
- [ ] Seed default types on first run
- [ ] Add migration for existing data

---

### Phase 2: Blocked Time Types System (Priority: HIGH)
**Estimated Complexity:** Medium
**Files to Modify:** 6-8 files

#### 2.1 Create Blocked Time Types

**New File:** `src/types/blockedTime.ts`
```typescript
export interface BlockedTimeType {
  id: string;
  name: string;
  emoji: string;           // e.g., "☕", "📚", "🧹"
  color: string;
  defaultDuration: number; // Minutes
  isPaid: boolean;         // Compensation tracking
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedTimeEntry {
  id: string;
  salonId: string;
  staffId: string;
  typeId: string;          // References BlockedTimeType
  startDateTime: string;
  endDateTime: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  repeatEndDate?: string;  // When frequency ends
  notes?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_BLOCKED_TIME_TYPES: BlockedTimeType[] = [
  { id: 'lunch', name: 'Lunch Break', emoji: '🍽️', color: '#F59E0B', defaultDuration: 60, isPaid: false, isActive: true },
  { id: 'coffee', name: 'Coffee Break', emoji: '☕', color: '#92400E', defaultDuration: 15, isPaid: true, isActive: true },
  { id: 'training', name: 'Training', emoji: '📚', color: '#3B82F6', defaultDuration: 120, isPaid: true, isActive: true },
  { id: 'meeting', name: 'Team Meeting', emoji: '👥', color: '#8B5CF6', defaultDuration: 30, isPaid: true, isActive: true },
  { id: 'admin', name: 'Admin Tasks', emoji: '📋', color: '#6B7280', defaultDuration: 30, isPaid: true, isActive: true },
  { id: 'cleaning', name: 'Cleaning/Setup', emoji: '🧹', color: '#10B981', defaultDuration: 30, isPaid: true, isActive: true },
  { id: 'personal', name: 'Personal Time', emoji: '🏃', color: '#EC4899', defaultDuration: 15, isPaid: false, isActive: true },
];
```

#### 2.2 Database Schema Update

**File:** `src/db/schema.ts`
```typescript
blockedTimeTypes: '++id, salonId, name, isActive, syncStatus',
blockedTimeEntries: '++id, salonId, staffId, typeId, startDateTime, frequency, syncStatus, [salonId+staffId], [staffId+startDateTime]',
```

#### 2.3 Settings UI for Blocked Time Types

**New File:** `src/components/settings/BlockedTimeTypesSettings.tsx`

Features:
- [ ] List all blocked time types
- [ ] Add new type with name, emoji, color, default duration
- [ ] Toggle paid/unpaid for "Working hours activity" report
- [ ] Edit existing types
- [ ] Delete (with warning: won't remove existing entries)

#### 2.4 Create Block Time Modal

**New File:** `src/components/schedule/BlockTimeModal.tsx`

Features:
- [ ] Select blocked time type (dropdown with emoji + name)
- [ ] Auto-fill duration from type's default
- [ ] Override duration if needed
- [ ] Set frequency (once, daily, weekly, monthly)
- [ ] Set end date for recurring
- [ ] Add notes
- [ ] Staff selection (if manager adding for team member)

#### 2.5 Calendar Integration

**File:** `src/components/Book/DaySchedule.v2.tsx`

Changes:
- [ ] Fetch blocked time entries for displayed staff/date
- [ ] Render blocked time slots with type color + emoji
- [ ] Prevent appointment overlap (show warning)
- [ ] Click to edit/delete blocked time

#### Todo Checklist - Phase 2
- [ ] Create `src/types/blockedTime.ts`
- [ ] Update `src/db/schema.ts` with tables
- [ ] Create `src/db/blockedTimeOperations.ts`
- [ ] Create `BlockedTimeTypesSettings.tsx`
- [ ] Create `BlockTimeModal.tsx`
- [ ] Add context menu option to add blocked time
- [ ] Integrate with DaySchedule.v2.tsx calendar
- [ ] Add conflict detection for appointments
- [ ] Add to "Working hours activity" report

---

### Phase 3: Business Closed Periods (Priority: HIGH)
**Estimated Complexity:** Low-Medium
**Files to Modify:** 4-6 files

#### 3.1 Create Closed Periods Types

**Add to:** `src/types/schedule.ts`
```typescript
export interface BusinessClosedPeriod {
  id: string;
  salonId: string;
  locationId?: string;     // null = all locations
  name: string;            // e.g., "Christmas Holiday", "Deep Cleaning"
  startDate: string;       // "2024-12-25"
  endDate: string;         // "2024-12-26"
  startTime?: string;      // Optional partial day closure
  endTime?: string;
  affectsOnlineBooking: boolean;
  affectsInStoreBooking: boolean;
  notes?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}
```

#### 3.2 Database Schema

**File:** `src/db/schema.ts`
```typescript
businessClosedPeriods: '++id, salonId, locationId, startDate, endDate, syncStatus, [salonId+startDate]',
```

#### 3.3 Settings UI

**New File:** `src/components/settings/ClosedPeriodsSettings.tsx`

Features:
- [ ] List upcoming and past closed periods
- [ ] Add new closed period with name, dates, location
- [ ] Edit existing periods
- [ ] Delete periods
- [ ] Show impact preview (# of appointments affected)

#### 3.4 Calendar Integration

Changes needed:
- [ ] Gray out closed periods on all calendar views
- [ ] Block appointment creation during closed periods
- [ ] Warn when existing appointments conflict with new closure
- [ ] Online booking: hide closed period slots

#### Todo Checklist - Phase 3
- [ ] Add `BusinessClosedPeriod` to types
- [ ] Update database schema
- [ ] Create `ClosedPeriodsSettings.tsx`
- [ ] Add to Settings navigation
- [ ] Integrate with calendar views
- [ ] Block appointment creation during closures
- [ ] Update online booking availability

---

### Phase 4: Multi-Week Schedule Patterns (Priority: MEDIUM)
**Estimated Complexity:** Low
**Files to Modify:** 2-3 files

#### 4.1 Update RepeatRule Type

**File:** `src/types/schedule.ts` or relevant location
```typescript
interface RepeatRule {
  type: 'weekly' | 'every2weeks' | 'every3weeks' | 'every4weeks' | 'none';
  startDate: string;
  endDate?: string;
  forever: boolean;
}
```

#### 4.2 Update AddEditScheduleModal

**File:** `src/components/schedule/AddEditScheduleModal.tsx`

Changes:
- [ ] Add "Every 3 weeks" and "Every 4 weeks" options to schedule type dropdown
- [ ] Update calendar preview to show correct repeat pattern
- [ ] Update schedule generation logic

#### Todo Checklist - Phase 4
- [ ] Update RepeatRule type definition
- [ ] Add new options to UI dropdown
- [ ] Update schedule calculation logic
- [ ] Test with various date ranges

---

### Phase 5: Resource Scheduling (Priority: MEDIUM)
**Estimated Complexity:** High
**Files to Modify:** 10+ files

#### 5.1 Create Resource Types

**New File:** `src/types/resource.ts`
```typescript
export interface Resource {
  id: string;
  salonId: string;
  locationId?: string;
  name: string;            // e.g., "Massage Room 1", "Nail Station A"
  description?: string;
  category: 'room' | 'equipment' | 'station' | 'other';
  capacity: number;        // Usually 1
  isBookable: boolean;
  color: string;
  imageUrl?: string;
  isActive: boolean;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceResource {
  serviceId: string;
  resourceId: string;
  isRequired: boolean;     // Must have resource vs. optional
}

export interface ResourceBooking {
  id: string;
  resourceId: string;
  appointmentId: string;
  startDateTime: string;
  endDateTime: string;
  syncStatus: SyncStatus;
}
```

#### 5.2 Database Schema

```typescript
resources: '++id, salonId, locationId, category, isActive, syncStatus, [salonId+isActive]',
serviceResources: '++id, serviceId, resourceId, [serviceId], [resourceId]',
resourceBookings: '++id, resourceId, appointmentId, startDateTime, [resourceId+startDateTime]',
```

#### 5.3 Settings UI

**New File:** `src/components/settings/ResourcesSettings.tsx`

Features:
- [ ] List all resources by category
- [ ] Add new resource with name, category, description
- [ ] Set resource color for calendar
- [ ] Toggle active/inactive
- [ ] Delete resource (removes from services)

#### 5.4 Service Configuration

**Update:** Service edit modal

Changes:
- [ ] Add "Resources Required" toggle per service
- [ ] Multi-select which resources can fulfill the service
- [ ] Show resource availability when booking

#### 5.5 Calendar Integration

Changes:
- [ ] Add "Resources" filter to calendar view selector
- [ ] Show resource timeline view (like staff view)
- [ ] Auto-assign resources on online booking
- [ ] Manual override for in-store booking
- [ ] Prevent double-booking resources

#### Todo Checklist - Phase 5
- [ ] Create resource types
- [ ] Update database schema
- [ ] Create ResourcesSettings.tsx
- [ ] Update service edit modal
- [ ] Add resource assignment to appointment booking
- [ ] Create resource timeline view
- [ ] Add resource filter to calendar
- [ ] Implement auto-assignment for online booking
- [ ] Add conflict detection

---

### Phase 6: Paid/Unpaid Time Tracking (Priority: MEDIUM)
**Estimated Complexity:** Low
**Files to Modify:** 3-4 files

#### 6.1 Add Compensation Tracking

Already partially supported via:
- `TimeOffType.isPaid`
- `BlockedTimeType.isPaid`

#### 6.2 Create Working Hours Report

**New File:** `src/components/reports/WorkingHoursReport.tsx`

Features:
- [ ] Filter by date range, staff member
- [ ] Show scheduled hours
- [ ] Show actual worked hours (from timesheet)
- [ ] Show paid time-off hours
- [ ] Show unpaid time-off hours
- [ ] Show paid blocked time (training, meetings)
- [ ] Show unpaid blocked time (lunch, personal)
- [ ] Calculate total payable hours

#### Todo Checklist - Phase 6
- [ ] Add isPaid fields to types (done in Phases 1-2)
- [ ] Create WorkingHoursReport component
- [ ] Add to Reports navigation
- [ ] Calculate and display breakdowns
- [ ] Export to CSV/PDF

---

### Phase 7: Time-Off Approval Workflow (Priority: MEDIUM)
**Estimated Complexity:** Medium
**Files to Modify:** 5-6 files

#### 7.1 Update TimeOffRequest Type

Already exists in `team-settings/types.ts`:
```typescript
interface TimeOffRequest {
  status: 'pending' | 'approved' | 'denied';
  // Add:
  approvedBy?: string;     // Manager ID
  approvedAt?: string;
  deniedReason?: string;
}
```

#### 7.2 Manager Approval UI

**New File:** `src/components/schedule/TimeOffApprovalList.tsx`

Features:
- [ ] List pending time-off requests
- [ ] Show requester, dates, type, hours
- [ ] Approve button (with optional note)
- [ ] Deny button (with required reason)
- [ ] Bulk approve/deny
- [ ] Notification to staff on decision

#### 7.3 Staff Request Flow

**Update:** TimeOffModal

Changes:
- [ ] Show "Pending Approval" status after submission
- [ ] Show "Approved" or "Denied" status
- [ ] Allow cancellation of pending requests

#### Todo Checklist - Phase 7
- [ ] Extend TimeOffRequest type
- [ ] Create TimeOffApprovalList component
- [ ] Add to Manager dashboard or Schedule view
- [ ] Update TimeOffModal with status display
- [ ] Add notifications (in-app)
- [ ] Email notifications (optional future)

---

### Phase 8: Timesheet Automation (Priority: LOW)
**Estimated Complexity:** Medium
**Files to Modify:** 4-5 files

#### 8.1 Auto Clock-In/Out Setting

**Add to Salon Settings:**
```typescript
interface TimesheetSettings {
  autoClockInFromSchedule: boolean;
  autoClockOutFromSchedule: boolean;
  allowEarlyClockIn: boolean;       // Staff can clock in before shift
  earlyClockInMinutes: number;      // How many minutes early
  allowLateClockOut: boolean;       // Staff can clock out after shift
  lateClockOutMinutes: number;
  roundClockTimes: 'none' | '5min' | '15min';
}
```

#### 8.2 Automatic Timesheet Generation

**Background Job / Effect:**

When `autoClockInFromSchedule` is enabled:
1. At shift start time, automatically create clock-in record
2. At shift end time, automatically create clock-out record
3. Staff can manually override if needed

#### Todo Checklist - Phase 8
- [ ] Add TimesheetSettings to salon config
- [ ] Create settings UI
- [ ] Implement auto-generation logic
- [ ] Allow manual override
- [ ] Handle edge cases (missed shifts, early departure)

---

## Implementation Priority Matrix

| Phase | Feature | User Impact | Complexity | Priority |
|-------|---------|-------------|------------|----------|
| 1 | Time-Off Types | High | Medium | **P0** |
| 2 | Blocked Time Types | High | Medium | **P0** |
| 3 | Business Closed Periods | High | Low | **P0** |
| 4 | Multi-Week Patterns | Medium | Low | **P1** |
| 5 | Resource Scheduling | High | High | **P1** |
| 6 | Paid/Unpaid Tracking | Medium | Low | **P2** |
| 7 | Approval Workflow | Medium | Medium | **P2** |
| 8 | Timesheet Automation | Low | Medium | **P3** |

---

## Recommended Implementation Order

### Sprint 1 (Week 1-2): Foundation
- [ ] Phase 1: Time-Off Types System
- [ ] Phase 3: Business Closed Periods

### Sprint 2 (Week 3-4): Blocked Time
- [ ] Phase 2: Blocked Time Types System
- [ ] Phase 4: Multi-Week Patterns

### Sprint 3 (Week 5-6): Advanced
- [ ] Phase 5: Resource Scheduling (Part 1 - Types & Settings)

### Sprint 4 (Week 7-8): Polish
- [ ] Phase 5: Resource Scheduling (Part 2 - Calendar Integration)
- [ ] Phase 6: Paid/Unpaid Tracking
- [ ] Phase 7: Approval Workflow

### Sprint 5 (Week 9-10): Automation
- [ ] Phase 8: Timesheet Automation
- [ ] Testing & Bug Fixes

---

## Database Migration Strategy

All new tables should be added in a single migration to avoid multiple schema versions:

```typescript
// db/migrations/v4-schedule-enhancements.ts
export const migrateToV4 = async (db: Dexie) => {
  // Add new tables
  db.version(4).stores({
    // Existing tables...
    timeOffTypes: '++id, salonId, name, isActive, syncStatus',
    blockedTimeTypes: '++id, salonId, name, isActive, syncStatus',
    blockedTimeEntries: '++id, salonId, staffId, typeId, startDateTime, frequency, syncStatus',
    businessClosedPeriods: '++id, salonId, startDate, endDate, syncStatus',
    resources: '++id, salonId, category, isActive, syncStatus',
    serviceResources: '++id, serviceId, resourceId',
    resourceBookings: '++id, resourceId, appointmentId, startDateTime',
  });

  // Seed default data
  await seedDefaultTimeOffTypes(db);
  await seedDefaultBlockedTimeTypes(db);
};
```

---

## Testing Checklist

### Unit Tests
- [ ] Time-off type CRUD operations
- [ ] Blocked time type CRUD operations
- [ ] Schedule pattern calculations (2/3/4 week)
- [ ] Resource conflict detection
- [ ] Paid/unpaid hour calculations

### Integration Tests
- [ ] Time-off creation with type selection
- [ ] Blocked time creation and calendar display
- [ ] Business closure blocking appointments
- [ ] Resource booking with appointment
- [ ] Approval workflow state transitions

### E2E Tests
- [ ] Complete time-off request flow (request → approve → calendar update)
- [ ] Blocked time creation and overlap detection
- [ ] Resource booking during appointment creation

---

## Review Section

_To be completed after implementation_

### Changes Made
- [ ] List of files modified
- [ ] New files created
- [ ] Database migrations applied

### Known Issues
- [ ] Any bugs or limitations discovered

### Future Enhancements
- [ ] Features deferred for later
- [ ] User feedback to incorporate

---

## Sources

- [Fresha - Manage scheduled shifts](https://www.fresha.com/help-center/knowledge-base/calendar/17-schedule-and-update-team-shifts)
- [Fresha - Manage time off](https://www.fresha.com/help-center/knowledge-base/calendar/21-manage-time-off-for-your-team-1)
- [Fresha - Set up blocked time](https://www.fresha.com/help-center/knowledge-base/calendar/18-set-up-and-manage-blocked-time)
- [Fresha - Business closed periods](https://www.fresha.com/help-center/knowledge-base/calendar/20-set-business-closed-periods)
- [Fresha - Create and manage resources](https://www.fresha.com/help-center/knowledge-base/calendar/19-create-and-manage-resources)
