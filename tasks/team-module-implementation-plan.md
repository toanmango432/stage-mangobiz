# Team Module Implementation Plan

**Document Version:** 3.0
**Created:** December 2024
**Updated:** December 2024
**Status:** Ready for Implementation

---

## Executive Summary

This plan outlines the phased implementation of the Team Module for Mango POS. The module enables comprehensive staff management including profiles, schedules, permissions, commissions, and online booking settings.

### Current State
- UI components exist (`TeamSettings.tsx`, 7 section components)
- Redux slice created (`teamSlice.ts`) with `BaseSyncableEntity` pattern
- IndexedDB operations created (`teamOperations.ts`) with sync queue integration
- Schema v4 with proper `storeId` indexes implemented
- Mock data available with sync fields
- **Phase 1.5 Quality Improvements Complete:**
  - Zod validation schemas
  - Field-level conflict resolution
  - Optimistic updates
  - 70 unit tests passing

### What Needs to Be Done
- Connect all UI sections to Redux state
- Implement validation and error handling
- Add full CRUD operations for all sub-entities
- Integrate with existing modules (Calendar, Checkout)
- Implement sync and conflict resolution
- Add comprehensive testing

---

## Quality Standards

### Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Load team member list | < 100ms | Time from mount to render |
| Save team member | < 200ms | Time from submit to UI update |
| Search/filter | < 50ms | Time from input to results |
| Form validation | < 10ms | Synchronous validation |
| IndexedDB read | < 50ms | Single entity fetch |
| IndexedDB write | < 100ms | Single entity save |

### Accessibility Requirements (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | Minimum 4.5:1 for text, 3:1 for large text |
| Focus indicators | Visible 2px outline on all interactive elements |
| Keyboard navigation | Full Tab/Enter/Escape support |
| Screen reader | ARIA labels on all form controls |
| Touch targets | Minimum 44x44px on mobile |
| Error announcements | `aria-live="polite"` for validation errors |

### Error Handling Standards

```typescript
// Standard error response structure
interface OperationError {
  code: string;           // e.g., 'VALIDATION_ERROR', 'DB_ERROR', 'SYNC_ERROR'
  message: string;        // User-friendly message
  field?: string;         // Field that caused error (for validation)
  details?: unknown;      // Technical details for logging
  recoverable: boolean;   // Can user retry?
  suggestedAction?: string; // e.g., 'Refresh and try again'
}
```

---

## Phase Overview

| Phase | Name | Focus | Status |
|-------|------|-------|--------|
| **1** | Infrastructure Completion | Complete Redux/DB foundation | ✅ Complete |
| **1.5** | Quality Improvements | Validation, tests, conflict resolution | ✅ Complete |
| **2** | Profile & Services | Core team member CRUD + services | 🔜 Ready |
| **3** | Schedule Management | Working hours, time-off, overrides | Ready |
| **4** | Permissions & Security | Role-based access, PIN system | Ready |
| **5** | Commission & Payroll | Commission config, basic payroll | Ready |
| **6** | Online Booking | Booking settings, visibility | Ready |
| **7** | Notifications | Email/SMS/Push preferences | Ready |
| **8** | Integration & Polish | Calendar/Checkout integration, testing | Ready |
| **9** | Timesheet & Pay Runs | Clock in/out, pay run generation (P1) | Ready |

---

## Phase 1: Infrastructure Completion (✅ COMPLETE)

### Summary
- Created `BaseSyncableEntity` type in `common.ts`
- Updated `TeamMemberSettings` to extend `BaseSyncableEntity`
- Created `teamOperations.ts` with sync queue integration
- Updated IndexedDB schema to v4 with compound indexes
- Updated `teamSlice.ts` with SyncContext support

---

## Phase 1.5: Quality Improvements (✅ COMPLETE)

### Summary
- Created Zod validation schemas (`src/components/team-settings/validation/`)
- Implemented field-level conflict resolution (`src/utils/conflictResolution.ts`)
- Added optimistic updates to Redux thunks
- 70 unit tests passing

---

## Phase 2: Profile & Services

### Objective
Enable full CRUD for team member profiles and service assignments.

### 2.1 Profile Section Enhancement

**File:** `src/components/team-settings/sections/ProfileSection.tsx`

#### Tasks
- [ ] Connect all form fields to Redux state via `updateMemberProfile` action
- [ ] Implement photo upload (base64 storage in IndexedDB, max 500KB)
- [ ] Add Zod form validation using `validateProfile()` from validation module
- [ ] Implement "Unsaved Changes" detection with `setHasUnsavedChanges`
- [ ] Add save/cancel actions with confirmation
- [ ] Add archive functionality (sets `isActive = false`)
- [ ] Add restore functionality for archived members
- [ ] Add delete with confirmation modal (soft delete with tombstone)

#### Validation Rules
```typescript
// Using Zod schemas from validation/schemas.ts
Profile Validation:
- firstName: required, 1-100 chars
- lastName: required, 1-100 chars
- email: required, valid email format, unique per store
- phone: optional, max 20 chars
- displayName: auto-generated from first+last if empty
```

#### Error Handling
| Error | User Message | Recovery |
|-------|-------------|----------|
| Validation failed | "Please fix the highlighted fields" | Show field errors |
| Email already exists | "A team member with this email already exists" | Focus email field |
| Save failed (DB) | "Unable to save. Please try again." | Retry button |
| Photo too large | "Photo must be under 500KB" | Show file picker again |

#### Performance Targets
- Form render: < 50ms
- Validation: < 10ms (synchronous)
- Save operation: < 200ms (optimistic update)
- Photo compression: < 500ms

### 2.2 Add Team Member Flow

**File:** `src/components/team-settings/components/AddTeamMember.tsx`

#### Tasks
- [ ] Connect form to `saveTeamMember` thunk
- [ ] Generate UUID via `crypto.randomUUID()`
- [ ] Initialize all `BaseSyncableEntity` fields via `createTeamMemberDefaults()`
- [ ] Validate email uniqueness via `teamDB.getMemberByEmail()`
- [ ] Handle save success (navigate to new member, show toast)
- [ ] Handle save failure (show error, keep form open)

#### Rollback Procedure
```typescript
// On save failure:
1. Optimistic update already applied to Redux
2. Catch error in thunk
3. Dispatch rollback action (removes member from state)
4. Show error toast with retry option
5. Keep form populated for retry
```

### 2.3 Services Section Enhancement

**File:** `src/components/team-settings/sections/ServicesSection.tsx`

#### Tasks
- [ ] Load available services from services store (or mock data initially)
- [ ] Connect service toggles to Redux `updateMemberServices` action
- [ ] Implement custom price override per service (validate: >= 0)
- [ ] Implement custom duration override per service (validate: > 0, integer minutes)
- [ ] Implement "Assign All Services" action
- [ ] Implement "Clear All Services" action
- [ ] Add service category filtering/grouping
- [ ] Save changes via `saveTeamMember` thunk with debounce (300ms)

#### Data Flow
```
User toggles service
  → Dispatch updateMemberServices (optimistic)
  → Debounce 300ms
  → Dispatch saveTeamMember thunk
  → teamDB.updateMember()
  → syncQueueDB.add() for later sync
```

### 2.4 Team Member List Enhancement

**File:** `src/components/team-settings/components/TeamMemberList.tsx`

#### Tasks
- [ ] Connect search to Redux `searchQuery` state (debounce 200ms)
- [ ] Connect role filter to Redux `filterRole` state
- [ ] Connect status filter to Redux `filterStatus` state
- [ ] Show loading skeleton during `fetchTeamMembers` (use existing skeleton pattern)
- [ ] Show empty state when no results ("No team members found")
- [ ] Show sync status indicator per member (`syncStatus` field)
- [ ] Add "Archived" filter option (shows `isActive = false`)
- [ ] Implement virtual scrolling for > 50 members (optional, performance)

#### Performance Targets
- Search debounce: 200ms
- Filter application: < 50ms
- Skeleton to content: < 100ms

### Testing Checklist - Phase 2
- [ ] Can create new team member with required fields
- [ ] Validation errors display correctly for invalid input
- [ ] Can edit existing member profile fields
- [ ] Changes persist after page refresh (IndexedDB)
- [ ] Can archive team member (moves to archived list)
- [ ] Can restore archived team member
- [ ] Can delete team member (shows confirmation, performs soft delete)
- [ ] Can toggle services for a member
- [ ] Can set custom price/duration per service
- [ ] Search filters members correctly (debounced)
- [ ] Role/status filters work correctly
- [ ] Sync status displays correctly
- [ ] Optimistic updates show immediately
- [ ] Rollback works on save failure

---

## Phase 3: Schedule Management

### Objective
Implement weekly schedule, time-off requests, and schedule overrides.

### Current State Analysis

| Component | Status | Notes |
|-----------|--------|-------|
| `ScheduleSection.tsx` | 70% complete | UI exists, missing validation & debounced save |
| `teamSlice.ts` thunks | ✅ Complete | `saveTimeOffRequest`, `deleteTimeOffRequest`, `saveScheduleOverride`, `deleteScheduleOverride` |
| `teamOperations.ts` | ✅ Complete | All DB methods implemented |
| `TimeOffModal.tsx` | ❌ Not created | Needs to be built |
| `ScheduleOverrideModal.tsx` | ❌ Not created | Needs to be built |
| Shift validation | ❌ Missing | No overlap/format validation |

### 3.1 Working Hours Enhancement

**File:** `src/components/team-settings/sections/ScheduleSection.tsx`

#### Existing Features (Already Implemented)
- [x] Weekly schedule grid (7 days, Sunday=0)
- [x] Day on/off toggle connected to `isWorking`
- [x] Shift time inputs with `type="time"`
- [x] Add/Remove shift buttons
- [x] "Copy to Weekdays" action
- [x] Total weekly hours calculation
- [x] Three-tab layout (Regular Hours, Time Off, Overrides)
- [x] Visual weekly overview

#### Tasks to Complete
- [ ] Add shift validation with inline error display
- [ ] Implement debounced save (500ms) via `saveTeamMember` thunk
- [ ] Add loading indicator during save
- [ ] Add success toast on save
- [ ] Fix max 3 shifts per day enforcement
- [ ] Add keyboard support for time inputs (Tab navigation)

#### Shift Validation Implementation

```typescript
// Add to ScheduleSection.tsx
import { isValidTimeFormat } from '../validation/validate';

interface ShiftError {
  dayOfWeek: number;
  shiftIndex: number;
  field: 'startTime' | 'endTime';
  message: string;
}

const [shiftErrors, setShiftErrors] = useState<ShiftError[]>([]);

const validateShift = (
  dayOfWeek: number,
  shiftIndex: number,
  startTime: string,
  endTime: string,
  allShifts: Shift[]
): ShiftError[] => {
  const errors: ShiftError[] = [];

  // 1. Format validation
  if (!isValidTimeFormat(startTime)) {
    errors.push({
      dayOfWeek,
      shiftIndex,
      field: 'startTime',
      message: 'Use HH:mm format (e.g., 09:00)',
    });
  }
  if (!isValidTimeFormat(endTime)) {
    errors.push({
      dayOfWeek,
      shiftIndex,
      field: 'endTime',
      message: 'Use HH:mm format (e.g., 17:00)',
    });
  }

  // 2. End > Start validation
  if (startTime >= endTime) {
    errors.push({
      dayOfWeek,
      shiftIndex,
      field: 'endTime',
      message: 'End time must be after start time',
    });
  }

  // 3. Overlap validation
  allShifts.forEach((otherShift, otherIndex) => {
    if (otherIndex !== shiftIndex) {
      const overlaps =
        (startTime >= otherShift.startTime && startTime < otherShift.endTime) ||
        (endTime > otherShift.startTime && endTime <= otherShift.endTime) ||
        (startTime <= otherShift.startTime && endTime >= otherShift.endTime);

      if (overlaps) {
        errors.push({
          dayOfWeek,
          shiftIndex,
          field: 'startTime',
          message: `Overlaps with shift ${otherIndex + 1}`,
        });
      }
    }
  });

  return errors;
};
```

#### Debounced Save Implementation

```typescript
// Add to ScheduleSection.tsx
import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { saveTeamMember } from '../../../store/slices/teamSlice';

// Debounce ref
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const [isSaving, setIsSaving] = useState(false);

const debouncedSave = useCallback(() => {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }

  saveTimeoutRef.current = setTimeout(async () => {
    setIsSaving(true);
    try {
      await dispatch(saveTeamMember({ member: selectedMember })).unwrap();
      // Show success toast
    } catch (error) {
      // Show error toast
    } finally {
      setIsSaving(false);
    }
  }, 500);
}, [dispatch, selectedMember]);

// Call debouncedSave() after any schedule change
```

#### Error Handling
| Error | User Message | UI Behavior |
|-------|-------------|-------------|
| Invalid time format | "Use HH:mm format (e.g., 09:00)" | Red border on input, error text below |
| End before start | "End time must be after start time" | Red border on end time input |
| Overlapping shifts | "Overlaps with shift N" | Red border on both shifts |
| Save failed | "Unable to save schedule. Please try again." | Toast notification with retry |

### 3.2 Time Off Modal

**Create:** `src/components/team-settings/components/TimeOffModal.tsx`

#### Component Specification

```typescript
interface TimeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  existingRequest?: TimeOffRequest; // For edit mode
}

// Form state
interface TimeOffFormState {
  startDate: string;      // ISO date string (YYYY-MM-DD)
  endDate: string;        // ISO date string
  type: TimeOffType;      // 'vacation' | 'sick' | 'personal' | 'unpaid' | 'other'
  notes: string;          // Max 500 chars
}
```

#### UI Layout

```
┌─────────────────────────────────────────────────┐
│ Request Time Off                            [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Type                                           │
│  ┌─────────────────────────────────────────┐   │
│  │ ▼ Vacation                              │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Start Date              End Date               │
│  ┌──────────────┐        ┌──────────────┐      │
│  │ 📅 12/15/2024│        │ 📅 12/20/2024│      │
│  └──────────────┘        └──────────────┘      │
│                                                 │
│  Notes (optional)                               │
│  ┌─────────────────────────────────────────┐   │
│  │ Family vacation                         │   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│  0/500 characters                              │
│                                                 │
│  ⓘ Requests are pending until approved by a    │
│    manager.                                     │
│                                                 │
├─────────────────────────────────────────────────┤
│                    [Cancel]  [Submit Request]   │
└─────────────────────────────────────────────────┘
```

#### Implementation Tasks
- [ ] Create modal component with form fields
- [ ] Use native `<input type="date">` for date pickers
- [ ] Implement type selector with all TimeOffType options
- [ ] Add notes textarea with character counter
- [ ] Validate: endDate >= startDate
- [ ] Validate: startDate >= today (no past dates)
- [ ] Generate UUID for new request: `crypto.randomUUID()`
- [ ] Set initial status to 'pending'
- [ ] Set `requestedAt` to current ISO timestamp
- [ ] Dispatch `saveTimeOffRequest` thunk on submit
- [ ] Show loading spinner on submit button
- [ ] Close modal on success, show toast
- [ ] Display error inline on failure

#### Validation Rules
```typescript
const validateTimeOffForm = (form: TimeOffFormState): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!form.startDate) {
    errors.startDate = 'Start date is required';
  } else if (form.startDate < new Date().toISOString().split('T')[0]) {
    errors.startDate = 'Start date cannot be in the past';
  }

  if (!form.endDate) {
    errors.endDate = 'End date is required';
  } else if (form.endDate < form.startDate) {
    errors.endDate = 'End date must be on or after start date';
  }

  if (form.notes && form.notes.length > 500) {
    errors.notes = 'Notes must be 500 characters or less';
  }

  return errors;
};
```

#### Date Picker Accessibility
- Use native `<input type="date">` for best mobile support
- Add `aria-label` for screen readers
- Support keyboard navigation (Tab, Enter)

### 3.3 Time Off List Enhancement

**Update:** `src/components/team-settings/sections/ScheduleSection.tsx`

#### Tasks
- [ ] Add "Cancel Request" to pending requests (DotsIcon menu)
- [ ] Add confirmation dialog before cancel
- [ ] Call `deleteTimeOffRequest` thunk on confirm
- [ ] Sort requests by date (newest first)
- [ ] Add empty state with illustration
- [ ] Show approval info for approved/denied requests

#### Cancel Confirmation Dialog

```typescript
const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

const handleCancelRequest = async (requestId: string) => {
  try {
    await dispatch(deleteTimeOffRequest({
      memberId: selectedMemberId,
      requestId,
    })).unwrap();
    setCancelConfirmId(null);
    // Show success toast
  } catch (error) {
    // Show error toast
  }
};
```

### 3.4 Schedule Override Modal

**Create:** `src/components/team-settings/components/ScheduleOverrideModal.tsx`

#### Component Specification

```typescript
interface ScheduleOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  existingOverride?: ScheduleOverride; // For edit mode
  defaultDate?: string; // Pre-fill date when clicking calendar
}

interface OverrideFormState {
  date: string;           // ISO date string (YYYY-MM-DD)
  type: ScheduleOverrideType; // 'day_off' | 'custom_hours' | 'extra_day'
  customShifts: Shift[];  // Only for 'custom_hours' and 'extra_day'
  reason: string;         // Max 200 chars
}
```

#### UI Layout

```
┌─────────────────────────────────────────────────┐
│ Add Schedule Override                       [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Date                                           │
│  ┌─────────────────────────────────────────┐   │
│  │ 📅 December 25, 2024                    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Override Type                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ ○ Day Off        Take the day off       │   │
│  │ ● Custom Hours   Work different hours   │   │
│  │ ○ Extra Day      Work on a day off      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Custom Hours (shown when Custom/Extra)         │
│  ┌────────────┐  to  ┌────────────┐   [+]      │
│  │ 10:00      │      │ 14:00      │           │
│  └────────────┘      └────────────┘           │
│                                                 │
│  Reason (optional)                              │
│  ┌─────────────────────────────────────────┐   │
│  │ Holiday coverage                        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
├─────────────────────────────────────────────────┤
│                      [Cancel]  [Save Override]  │
└─────────────────────────────────────────────────┘
```

#### Implementation Tasks
- [ ] Create modal with radio buttons for override type
- [ ] Show/hide shift inputs based on type
- [ ] For 'day_off': no shift inputs needed
- [ ] For 'custom_hours' and 'extra_day': show shift builder
- [ ] Reuse shift validation logic from 3.1
- [ ] Generate UUID for new override
- [ ] Dispatch `saveScheduleOverride` thunk
- [ ] Handle loading and error states

#### Override Type Behavior
| Type | Description | customShifts |
|------|-------------|--------------|
| `day_off` | Take this day off (overrides regular schedule) | Empty `[]` |
| `custom_hours` | Work different hours than usual | Required, at least 1 shift |
| `extra_day` | Work on a normally scheduled day off | Required, at least 1 shift |

### 3.5 Schedule Override List Enhancement

**Update:** `src/components/team-settings/sections/ScheduleSection.tsx`

#### Tasks
- [ ] Add "Edit" action to override rows
- [ ] Add "Delete" action with confirmation
- [ ] Call `deleteScheduleOverride` thunk on confirm
- [ ] Sort overrides by date (upcoming first)
- [ ] Filter out past overrides (optional toggle)
- [ ] Highlight overrides happening today/this week

### 3.6 Integration with ScheduleSection

**Update flow for ScheduleSection.tsx:**

```typescript
// Props need to be extended
interface ScheduleSectionProps {
  workingHours: WorkingHoursSettings;
  memberId: string; // NEW: needed for thunk calls
  onChange: (workingHours: WorkingHoursSettings) => void;
}

// State for modals
const [showTimeOffModal, setShowTimeOffModal] = useState(false);
const [showOverrideModal, setShowOverrideModal] = useState(false);
const [editingTimeOff, setEditingTimeOff] = useState<TimeOffRequest | null>(null);
const [editingOverride, setEditingOverride] = useState<ScheduleOverride | null>(null);
```

### Error Handling Summary

| Operation | Error | User Message | Recovery |
|-----------|-------|-------------|----------|
| Save schedule | DB error | "Unable to save schedule" | Retry button in toast |
| Add time-off | Validation | Show inline errors | Fix and resubmit |
| Add time-off | DB error | "Unable to submit request" | Retry in modal |
| Cancel time-off | DB error | "Unable to cancel request" | Retry |
| Add override | Validation | Show inline errors | Fix and resubmit |
| Delete override | DB error | "Unable to delete override" | Retry |

### Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Schedule render | < 50ms | 7 days × up to 3 shifts each |
| Shift validation | < 5ms | Synchronous |
| Debounced save | 500ms delay | Then < 200ms for DB write |
| Modal open | < 100ms | Lazy load if needed |
| Time-off list render | < 30ms | Typically < 20 items |

### Accessibility Requirements

| Element | Requirement |
|---------|-------------|
| Time inputs | `aria-label="Start time for {dayName}"` |
| Day toggles | `aria-pressed` attribute |
| Modal | Focus trap, Escape to close |
| Date pickers | Native `<input type="date">` for screen reader support |
| Error messages | `role="alert"` and `aria-live="polite"` |
| Tabs | `role="tablist"`, `role="tab"`, `aria-selected` |

### Testing Checklist - Phase 3

#### Working Hours
- [ ] Can toggle days on/off
- [ ] Can set shift start/end times per day
- [ ] Can add multiple shifts per day (max 3)
- [ ] Validation prevents overlapping shifts
- [ ] Validation shows error for end < start
- [ ] Weekly hours calculate correctly
- [ ] Changes auto-save after 500ms debounce
- [ ] Loading indicator shows during save
- [ ] Success toast appears on save

#### Time Off
- [ ] Can open time-off modal
- [ ] Can select all time-off types
- [ ] Date picker prevents past dates
- [ ] End date must be >= start date
- [ ] Notes limited to 500 characters
- [ ] Request submits successfully
- [ ] Request appears in list with "Pending" status
- [ ] Can cancel pending request
- [ ] Cancel shows confirmation dialog
- [ ] Approved/denied requests show responder info

#### Schedule Overrides
- [ ] Can open override modal
- [ ] Can select all override types
- [ ] Shift inputs appear for custom_hours/extra_day
- [ ] Shift validation works in modal
- [ ] Override saves successfully
- [ ] Override appears in list with correct type
- [ ] Can edit existing override
- [ ] Can delete override with confirmation
- [ ] Overrides sorted by date

#### Accessibility
- [ ] All form fields have labels
- [ ] Tab navigation works through schedule grid
- [ ] Modals trap focus correctly
- [ ] Escape closes modals
- [ ] Error messages announced by screen reader

---

## Phase 4: Permissions & Security

### Objective
Implement role-based permissions and optional PIN security.

### 4.1 Permission Level Selection

**File:** `src/components/team-settings/sections/PermissionsSection.tsx`

#### Permission Levels (Predefined)
| Level | Name | Description |
|-------|------|-------------|
| 0 | No Access | Profile only, cannot log in to POS |
| 1 | Basic | View-only access to appointments |
| 2 | Standard | Book appointments, view clients, checkout |
| 3 | Advanced | + Apply discounts, view reports |
| 4 | Manager | + Manage team, settings, refunds |
| 5 | Owner | Full access to everything |

#### Tasks
- [ ] Display level selector with descriptions
- [ ] Auto-populate granular permissions based on level
- [ ] Show "Customized" indicator when permissions differ from level defaults
- [ ] Implement "Reset to Level Defaults" action

### 4.2 PIN Security

#### Tasks
- [ ] Implement PIN enable/disable toggle
- [ ] Create masked PIN input (4-6 digits)
- [ ] Validate PIN format using `isValidPin()` from validation module
- [ ] Store PIN hashed (SHA-256) - **NEVER store plain text**
- [ ] Implement PIN change flow (requires current PIN)

#### PIN Hashing
```typescript
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### 4.3 Permission Utilities

**Create:** `src/utils/permissions.ts`

```typescript
// Required functions
export function canPerformAction(member: TeamMemberSettings, action: PermissionAction): boolean;
export function getEffectivePermissions(member: TeamMemberSettings): Permission[];
export function usePermission(action: PermissionAction): boolean; // React hook
export type PermissionAction =
  | 'view_calendar' | 'book_appointments'
  | 'view_clients' | 'create_clients' | 'edit_clients'
  | 'process_checkout' | 'apply_discounts' | 'process_refunds'
  | 'view_reports' | 'export_reports'
  | 'manage_team' | 'view_others_calendar'
  | 'access_settings' | 'modify_settings';
```

### Testing Checklist - Phase 4
- [ ] Can select permission level
- [ ] Permissions auto-populate based on level
- [ ] Can customize individual permissions
- [ ] Customized permissions show indicator
- [ ] Can reset to level defaults
- [ ] Can enable/disable PIN requirement
- [ ] Can set and change PIN
- [ ] PIN is stored hashed (verify in IndexedDB)
- [ ] Permission utilities work correctly

---

## Phase 5: Commission & Payroll

### Objective
Implement commission configuration and basic payroll settings.

### 5.1 Commission Types

**File:** `src/components/team-settings/sections/CommissionSection.tsx`

| Type | Description | Fields |
|------|-------------|--------|
| None | No commission | - |
| Percentage | Fixed % of service revenue | basePercentage (0-100) |
| Tiered | Different rates at thresholds | tiers[] array |
| Flat | Fixed amount per service | flatAmount |

#### Tasks
- [ ] Display commission type selector (visual cards)
- [ ] Show appropriate inputs based on type
- [ ] Validate using `CommissionSettingsSchema`
- [ ] Implement tier builder for tiered commission
- [ ] Validate tier boundaries (no gaps using schema refinement)
- [ ] Show earnings calculator preview

### 5.2 Additional Commission Settings

- [ ] Product commission percentage (0-100%)
- [ ] Tip handling selector (keep_all, pool, percentage)
- [ ] Tip percentage to house (when applicable)

### 5.3 Payroll Settings

- [ ] Pay period selector (weekly, bi-weekly, monthly, per-service)
- [ ] Compensation type (hourly, salary, commission-only)
- [ ] Hourly rate or salary input
- [ ] Guaranteed minimum field
- [ ] Overtime settings (threshold hours, rate multiplier)

### 5.4 Earnings Calculator

**Create:** `src/components/team-settings/components/EarningsCalculator.tsx`

```typescript
// Calculate earnings for sample scenarios
interface EarningsPreview {
  scenario: string;          // e.g., "$5,000 revenue"
  baseEarnings: number;      // Salary or hourly
  commissionEarnings: number;
  tipsEstimate: number;
  totalEarnings: number;
}
```

### Testing Checklist - Phase 5
- [ ] Can select commission type
- [ ] Percentage input validates (0-100)
- [ ] Can build tiered commission
- [ ] Tier validation prevents gaps/overlaps
- [ ] Product commission saves correctly
- [ ] Tip handling options work
- [ ] Pay period selector works
- [ ] Earnings calculator shows accurate examples

---

## Phase 6: Online Booking

### Objective
Configure team member visibility and booking rules for online scheduling.

### 6.1 Booking Toggle & Visibility

**File:** `src/components/team-settings/sections/OnlineBookingSection.tsx`

#### Tasks
- [ ] Main "Bookable Online" toggle (`isBookableOnline`)
- [ ] "Show on Website" toggle
- [ ] "Show on App" toggle
- [ ] "Accept New Clients" toggle
- [ ] "Auto-Accept Bookings" toggle
- [ ] Status indicator (Accepting/Not Available)

### 6.2 Booking Rules

- [ ] Max advance booking days (1-365)
- [ ] Min advance notice hours (0-168)
- [ ] Buffer time between appointments (0-120 min)
- [ ] Buffer position (before, after, both)
- [ ] Double booking toggle
- [ ] Max concurrent appointments (1-10)

### 6.3 Online Profile

- [ ] Display order input (sort order in widget)
- [ ] Profile bio textarea (1000 char limit)
- [ ] Specialties tag input
- [ ] Portfolio images placeholder (future)

### Testing Checklist - Phase 6
- [ ] Can toggle online booking on/off
- [ ] Visibility toggles save correctly
- [ ] Booking rules validate and save
- [ ] Buffer settings work correctly
- [ ] Bio and specialties update correctly

---

## Phase 7: Notifications

### Objective
Configure notification preferences across email, SMS, and push channels.

### 7.1 Notification Channels

**File:** `src/components/team-settings/sections/NotificationsSection.tsx`

#### Email Notifications
- [ ] New bookings, Appointment changes, Cancellations
- [ ] Appointment reminders
- [ ] Daily/Weekly summary
- [ ] Marketing emails, System updates

#### SMS Notifications
- [ ] Appointment reminders, changes, cancellations
- [ ] Urgent alerts only
- [ ] Show SMS cost warning

#### Push Notifications
- [ ] Appointment reminders, New bookings
- [ ] Messages, Team updates

### 7.2 Reminder Timing
- [ ] First reminder (1-72 hours before)
- [ ] Second reminder (optional, 1-48 hours)

### 7.3 Quick Actions
- [ ] "Enable All" button
- [ ] "Disable All" button
- [ ] "Essential Only" preset

### Testing Checklist - Phase 7
- [ ] Can toggle individual notifications
- [ ] Reminder timing validates correctly
- [ ] Quick actions work as expected

---

## Phase 8: Integration & Polish

### Objective
Integrate Team Module with existing Calendar and Checkout modules.

### 8.1 Calendar Integration

#### Files to Modify

| File | Lines | Function | Change Required |
|------|-------|----------|-----------------|
| `src/components/Book/StaffSidebar.tsx` | 1-182 | Staff list | Use `selectActiveTeamMembers` |
| `src/components/Book/StaffFilterDropdown.tsx` | 1-174 | Staff filter | Use team member data |
| `src/utils/conflictDetection.ts` | 132-154 | `isStaffAvailable()` | Add time-off check |
| `src/utils/availabilityCalculator.ts` | 22-75 | `calculateTimeSlotAvailability()` | Factor in scheduleOverrides |
| `src/utils/smartAutoAssign.ts` | 139-199 | `findBestStaffForAssignment()` | Check services[] capability |
| `src/store/slices/staffSlice.ts` | 22-47 | Data fetching | Optionally migrate to teamSlice |

#### New Utility Functions

**Create:** `src/utils/teamCalendarIntegration.ts`

```typescript
/**
 * Get team members available for a specific service at a given time.
 */
export function getAvailableMembersForService(
  serviceId: string,
  dateTime: Date,
  duration: number,
  allMembers: TeamMemberSettings[],
  existingAppointments: LocalAppointment[]
): TeamMemberSettings[];

/**
 * Check if a team member is working at a given time.
 * Considers: regular hours, time-off, schedule overrides
 */
export function isMemberWorkingAt(
  member: TeamMemberSettings,
  dateTime: Date
): boolean;

/**
 * Get a team member's effective schedule for a date.
 * Applies schedule overrides to regular hours.
 */
export function getMemberDaySchedule(
  member: TeamMemberSettings,
  date: Date
): { shifts: Shift[]; isWorking: boolean; isOverride: boolean };

/**
 * Check if team member has approved time-off on a date.
 */
export function isMemberOnTimeOff(
  member: TeamMemberSettings,
  date: Date
): boolean;

/**
 * Get blocked time slots for a member (time-off, non-working hours).
 */
export function getMemberBlockedTimes(
  member: TeamMemberSettings,
  date: Date
): { start: Date; end: Date; reason: string }[];
```

#### Integration Steps

1. **Update `isStaffAvailable()` in `conflictDetection.ts` (Line 132)**
```typescript
// Before:
export function isStaffAvailable(staffId, startTime, endTime, appointments) {
  // Only checks appointment overlaps
}

// After:
export function isStaffAvailable(
  staffId: string,
  startTime: Date,
  endTime: Date,
  appointments: LocalAppointment[],
  teamMember?: TeamMemberSettings  // NEW: Optional team member data
): boolean {
  // Check appointment overlaps (existing logic)
  // NEW: If teamMember provided, also check:
  // - isMemberWorkingAt(teamMember, startTime)
  // - !isMemberOnTimeOff(teamMember, startTime)
}
```

2. **Update `calculateTimeSlotAvailability()` in `availabilityCalculator.ts` (Line 22)**
```typescript
// Add parameter: teamMembers?: TeamMemberSettings[]
// Factor in schedule overrides when calculating available staff
```

3. **Update `findBestStaffForAssignment()` in `smartAutoAssign.ts` (Line 139)**
```typescript
// Add service capability check:
// member.services.find(s => s.serviceId === serviceId && s.canPerform)
```

### 8.2 Checkout Integration

#### Files to Modify

| File | Lines | Function | Change Required |
|------|-------|----------|-----------------|
| `src/components/checkout/TicketPanel.tsx` | 1345+ | Staff management | Permission checks |
| `src/components/checkout/RefundVoidDialog.tsx` | 1-150 | Refund dialog | `canProcessRefunds` check |
| `src/components/checkout/CheckoutSummary.tsx` | 44-82 | Discount | `canApplyDiscount` check |
| `src/store/slices/transactionsSlice.ts` | 43-60 | Validation | Add role-based checks |

#### New Utility Functions

**Create:** `src/utils/teamCheckoutIntegration.ts`

```typescript
/**
 * Calculate commission for a team member based on services.
 */
export function calculateCommission(
  member: TeamMemberSettings,
  services: { price: number; serviceId: string }[]
): {
  baseCommission: number;
  productCommission: number;
  totalCommission: number;
  breakdown: { serviceId: string; amount: number }[];
};

/**
 * Check if team member can apply discounts.
 */
export function canApplyDiscount(member: TeamMemberSettings): boolean {
  return member.permissions.canModifyPrices ||
         ['manager', 'owner'].includes(member.permissions.role);
}

/**
 * Check if team member can process refunds.
 */
export function canProcessRefund(member: TeamMemberSettings): boolean {
  return member.permissions.canProcessRefunds;
}

/**
 * Verify PIN for sensitive actions.
 */
export async function verifyPin(
  member: TeamMemberSettings,
  enteredPin: string
): Promise<boolean> {
  if (!member.permissions.pinRequired) return true;
  const hashedInput = await hashPin(enteredPin);
  return hashedInput === member.permissions.pin;
}
```

#### Integration Steps

1. **Add permission check to RefundVoidDialog.tsx**
```typescript
// Before showing refund option:
const currentUser = useSelector(selectCurrentTeamMember);
if (!canProcessRefund(currentUser)) {
  // Show "Insufficient permissions" message
  // Or hide refund button entirely
}
```

2. **Add permission check to CheckoutSummary.tsx**
```typescript
// Before allowing discount:
const currentUser = useSelector(selectCurrentTeamMember);
const discountAllowed = canApplyDiscount(currentUser);
// Disable discount button if not allowed
```

3. **Update transactionsSlice.ts validation**
```typescript
// Add to validateRefund or as middleware:
if (!canProcessRefund(currentUser)) {
  return rejectWithValue({ code: 'PERMISSION_DENIED', message: '...' });
}
```

### 8.3 Sync Implementation

#### Sync Priority
Team members: Priority 3 (NORMAL) per DATA_STORAGE_STRATEGY.md

#### Push Sync Flow
```
1. User saves team member
2. teamDB.updateMember() called
3. syncQueueDB.add({ entityType: 'teamMember', ... })
4. syncManager detects pending items
5. POST /api/team-members with member data
6. On success: teamDB.markSynced(id)
7. On conflict: Apply field-level merge
8. On error: Keep in queue, retry with backoff
```

#### Pull Sync Flow
```
1. App comes online / periodic sync
2. GET /api/team-members?since={lastSyncTimestamp}
3. For each changed member:
   - teamDB.applyServerChange(member)
   - Uses compareVectorClocks() for conflict detection
   - Uses mergeTeamMember() for field-level resolution
4. Update lastSyncTimestamp
```

### 8.4 Error Handling & Loading States

- [ ] Add loading skeletons for TeamMemberList
- [ ] Add loading spinners for save operations
- [ ] Add error boundaries for each section
- [ ] Implement toast notifications (success/error)
- [ ] Add retry logic for failed operations

### 8.5 Mobile Responsiveness

- [ ] Test all sections on mobile (<768px)
- [ ] Collapsible sections on mobile
- [ ] Touch targets minimum 44px
- [ ] Swipe gestures for navigation (optional)

### Testing Checklist - Phase 8
- [ ] Appointments can select team members
- [ ] Availability respects working hours
- [ ] Time-off blocks calendar slots
- [ ] Schedule overrides apply correctly
- [ ] Service capability filtering works
- [ ] Checkout shows correct service provider
- [ ] Commission calculates correctly
- [ ] Permission checks work (discounts, refunds)
- [ ] PIN verification works for sensitive actions
- [ ] Changes sync when online
- [ ] Conflicts detected and resolved
- [ ] Mobile responsive on all sections

---

## Phase 9: Timesheet & Pay Runs (P1 Features)

### Objective
Implement clock in/out, timesheet tracking, and pay run generation.

### 9.1 Data Models

```typescript
interface TimesheetEntry extends BaseSyncableEntity {
  teamMemberId: string;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  breaks: { startTime: string; endTime: string; duration: number }[];
  scheduledHours: number;
  actualHours: number;
  overtimeHours: number;
  status: 'active' | 'completed' | 'approved' | 'adjusted';
  adjustmentReason?: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface PayRun extends BaseSyncableEntity {
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'pending' | 'approved' | 'completed';
  entries: PayRunEntry[];
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  approvedBy?: string;
  approvedAt?: string;
}

interface PayRunEntry {
  teamMemberId: string;
  regularHours: number;
  overtimeHours: number;
  hourlyEarnings: number;
  commissionEarnings: number;
  tips: number;
  bonuses: number;
  deductions: number;
  grossPay: number;
  netPay: number;
}
```

### 9.2 Clock In/Out UI

**Create:** `src/components/team-settings/timesheet/ClockInOut.tsx`

- [ ] Large clock in/out button
- [ ] Current status display (Clocked In / Out)
- [ ] Current shift duration (real-time counter)
- [ ] Break start/end button
- [ ] Today's summary

### 9.3 Timesheet Management

**Create:** `src/components/team-settings/timesheet/TimesheetView.tsx`

- [ ] Week view of entries
- [ ] Scheduled vs actual hours comparison
- [ ] Filter by date range, status
- [ ] Edit entries (requires adjustment reason)
- [ ] Manager approval workflow

### 9.4 Pay Run Generation

**Create:** `src/components/team-settings/payroll/PayRunList.tsx`
**Create:** `src/components/team-settings/payroll/PayRunDetail.tsx`

- [ ] Create new pay run
- [ ] Auto-calculate from timesheets
- [ ] Auto-calculate commissions from tickets
- [ ] Include tips
- [ ] Add adjustments (bonus, deduction)
- [ ] Approval workflow
- [ ] Export to CSV

### Testing Checklist - Phase 9
- [ ] Clock in/out works correctly
- [ ] Break tracking accurate
- [ ] Overtime calculates (40+ hours/week)
- [ ] Manager can approve timesheets
- [ ] Pay run generates correctly
- [ ] Commission calculation accurate
- [ ] Export produces valid CSV

---

## API Contracts

### Sync Endpoints (Future Backend)

```typescript
// GET /api/team-members
// Query: ?storeId={storeId}&since={ISO8601}
// Response:
{
  data: TeamMemberSettings[];
  meta: {
    total: number;
    lastSync: string;
  }
}

// POST /api/team-members
// Body: TeamMemberSettings
// Response:
{
  data: TeamMemberSettings; // With server-assigned fields
  conflict?: {
    serverVersion: TeamMemberSettings;
    resolution: 'merged' | 'server_wins';
  }
}

// PATCH /api/team-members/:id
// Body: Partial<TeamMemberSettings>
// Response: Same as POST

// DELETE /api/team-members/:id
// Response: { success: true }
// Note: Triggers tombstone on server, syncs back as isDeleted=true
```

### Error Response Format

```typescript
// All API errors follow this format:
{
  error: {
    code: string;      // e.g., 'VALIDATION_ERROR', 'CONFLICT', 'NOT_FOUND'
    message: string;   // User-friendly
    details?: {        // For validation errors
      field: string;
      message: string;
    }[];
    serverVersion?: TeamMemberSettings; // For conflicts
  }
}
```

---

## Rollback Procedures

### Per-Phase Rollback

| Phase | Rollback Steps |
|-------|---------------|
| Phase 2 | Delete from IndexedDB, clear Redux state, reload from DB |
| Phase 3 | Remove time-off/override entries, restore previous workingHours |
| Phase 4 | Reset permissions to level defaults, clear PIN |
| Phase 5 | Reset commission to 'none', clear payroll settings |
| Phase 6 | Reset onlineBooking to defaults (isBookableOnline=true) |
| Phase 7 | Reset notifications to defaults (all true) |
| Phase 8 | Revert integration files to pre-integration commit |
| Phase 9 | Drop timesheet/payrun tables, clear related Redux state |

### Database Rollback

```typescript
// Emergency database reset for team module
async function rollbackTeamModule(): Promise<void> {
  // 1. Clear Redux state
  store.dispatch(teamSlice.actions.setMembers([]));

  // 2. Clear IndexedDB table
  await db.teamMembers.clear();

  // 3. Clear sync queue for team entities
  await syncQueueDB.syncQueue
    .where('entityType')
    .equals('teamMember')
    .delete();

  // 4. Re-seed with mock data (development only)
  if (process.env.NODE_ENV === 'development') {
    await seedMockTeamData();
  }
}
```

---

## File Structure Summary

```
src/
├── components/
│   └── team-settings/
│       ├── TeamSettings.tsx
│       ├── types.ts
│       ├── constants.ts
│       ├── validation/                    # Phase 1.5 ✅
│       │   ├── schemas.ts
│       │   ├── validate.ts
│       │   └── index.ts
│       ├── components/
│       │   ├── TeamMemberList.tsx
│       │   ├── AddTeamMember.tsx
│       │   ├── SharedComponents.tsx
│       │   ├── TimeOffModal.tsx           # Phase 3
│       │   ├── ScheduleOverrideModal.tsx  # Phase 3
│       │   ├── OnlineProfilePreview.tsx   # Phase 6
│       │   └── EarningsCalculator.tsx     # Phase 5
│       ├── sections/
│       │   ├── ProfileSection.tsx
│       │   ├── ServicesSection.tsx
│       │   ├── ScheduleSection.tsx
│       │   ├── PermissionsSection.tsx
│       │   ├── CommissionSection.tsx
│       │   ├── OnlineBookingSection.tsx
│       │   └── NotificationsSection.tsx
│       ├── timesheet/                     # Phase 9
│       │   ├── ClockInOut.tsx
│       │   └── TimesheetView.tsx
│       └── payroll/                       # Phase 9
│           ├── PayRunList.tsx
│           └── PayRunDetail.tsx
├── store/slices/
│   └── teamSlice.ts
├── db/
│   ├── schema.ts
│   └── teamOperations.ts
├── types/
│   └── common.ts
└── utils/
    ├── conflictResolution.ts              # Phase 1.5 ✅
    ├── permissions.ts                     # Phase 4
    ├── teamCalendarIntegration.ts         # Phase 8
    └── teamCheckoutIntegration.ts         # Phase 8
```

---

## Dependencies Between Phases

```
Phase 1 (Infrastructure) ────── ✅ COMPLETE
Phase 1.5 (Quality) ─────────── ✅ COMPLETE
    │
    ├── Phase 2 (Profile & Services) ──────┐
    │                                      │
    ├── Phase 3 (Schedule) ────────────────┤
    │                                      │
    ├── Phase 4 (Permissions) ─────────────┼── Can run in PARALLEL
    │                                      │
    ├── Phase 5 (Commission) ──────────────┤
    │                                      │
    ├── Phase 6 (Online Booking) ──────────┤
    │                                      │
    └── Phase 7 (Notifications) ───────────┘
                                           │
                                           └── Phase 8 (Integration)
                                                     │
                                                     └── Phase 9 (Timesheet)
```

---

## Success Criteria

### Phase 1 & 1.5 Complete ✅
- [x] Build compiles without errors
- [x] Mock data loads on first run
- [x] Can select team members in list
- [x] Basic CRUD operations work
- [x] Zod validation schemas created
- [x] Field-level conflict resolution implemented
- [x] Optimistic updates working
- [x] 70 unit tests passing

### MVP Complete When (Phases 2-7)
- [ ] All P0 features from PRD implemented
- [ ] All section forms save correctly
- [ ] Data persists across sessions (IndexedDB)
- [ ] No critical bugs in core flows
- [ ] Mobile responsive
- [ ] Performance targets met

### Full Release When (Phases 8-9)
- [ ] All P0 + P1 features implemented
- [ ] Calendar integration complete
- [ ] Checkout integration complete
- [ ] Permission checks enforced
- [ ] Sync working with cloud backend
- [ ] Timesheet and pay runs functional
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] 80%+ test coverage

---

*End of Implementation Plan v3.0*
