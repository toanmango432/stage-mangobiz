# Book Module Implementation Plan
## Building ONLY on What Exists - No Duplication

**Document Version:** 1.0  
**Date:** December 2024  
**Status:** Planning Phase

---

## ✅ WHAT ALREADY EXISTS (Current State)

### 1. **Calendar Views**
- ✅ **DaySchedule.v2.tsx** - Day view with:
  - Time slots (12am-11pm)
  - Staff columns
  - Appointment visualization
  - Current time indicator
  - Drag & drop support (partial)
  - Context menu
  - Click time slots to create
- ✅ **WeekView.tsx** - Week view (basic)
- ❌ **Month View** - Not implemented
- ❌ **Agenda/List View** - Not implemented

### 2. **Appointment Management**
- ✅ **NewAppointmentModal.tsx** - Complete:
  - 3-panel layout (Client | Calendar | Services)
  - Customer search (300ms debounce)
  - Service selection with staff assignment
  - Date/time picker
  - Multi-service support
- ✅ **AppointmentDetailsModal.tsx** - Complete:
  - View appointment details
  - Status dropdown (all statuses)
  - Check-in, Start Service, Complete buttons
  - Edit button (calls onEdit callback)
  - Cancel, No Show buttons
  - Notes display/edit
- ✅ **EditAppointmentModal.tsx** - Just created:
  - Full edit form
  - Conflict detection
  - Real-time validation
- ✅ **AppointmentContextMenu.tsx** - Context menu with:
  - Check In, Start Service, Complete
  - Edit, Reschedule
  - No Show, Cancel

### 3. **Customer Management**
- ✅ **CustomerSearchModal.tsx** - Complete:
  - Search with 300ms debounce
  - Phone formatting: (123) 456-7890
  - Create new customer
  - Customer selection

### 4. **Drag & Drop**
- ✅ **DaySchedule.v2.tsx** - Has:
  - `onAppointmentDrop` handler
  - Drag start/end handlers
  - Drop target visualization
  - Drag state management
- ✅ **BookPage.tsx** - Has:
  - `handleAppointmentDrop` - Reschedules appointments
  - Conflict detection before drop
- ✅ **WalkInSidebar.tsx** - Has:
  - Drag walk-ins to calendar
  - `onDragStart` callback

### 5. **Filtering & Search**
- ✅ **FilterPanel.tsx** - Complete:
  - Filter by status
  - Filter by service type
  - Filter by date range (today/week/month/all)
- ✅ **StaffSidebar.tsx** - Complete:
  - Staff filtering
  - Search staff
  - Select All / Clear All
- ✅ **CalendarHeader.tsx** - Has:
  - Date navigation
  - View switching (day/week/month)
  - Time window mode (2hour/fullday)
  - Search button

### 6. **Status Management**
- ✅ **AppointmentDetailsModal.tsx** - Full status workflow:
  - Scheduled → Checked-In → In-Service → Completed
  - Cancel, No Show
- ✅ **AppointmentContextMenu.tsx** - Quick status changes
- ✅ **BookPage.tsx** - Has:
  - `handleStatusChange` - Updates status
  - `handleCheckIn` - Check-in from panel
  - `handleStartService` - Start service from panel

### 7. **Coming Appointments**
- ✅ **ComingAppointmentsPanel.tsx** - Just created:
  - Shows next 2 hours
  - Urgency indicators
  - Check-in button
  - Start service button
- ⚠️ **ComingAppointments.tsx** - Separate component for SalonCenter/Tickets modules (different purpose)

### 8. **Utilities & Services**
- ✅ **Conflict Detection** (`src/utils/conflictDetection.ts`) - Just created:
  - Double-booking detection
  - Client conflict detection
  - Buffer time violation
  - Business hours validation
- ✅ **appointmentsSlice.ts** - Redux slice:
  - `addLocalAppointment`
  - `updateLocalAppointment`
  - `removeLocalAppointment`
  - Appointment state management

---

## ❌ WHAT'S MISSING (To Build)

### Phase 1: Essential Features (Build on Existing)

#### 1. Month View
**Status:** Not implemented  
**Build on:** WeekView.tsx pattern

**Requirements:**
- Grid layout (7 days × weeks)
- Month navigation
- Appointment dots/badges
- Click day to switch to day view
- Current day highlight
- Today indicator

**Files to Create:**
- `src/components/Book/MonthView.tsx`

**Est. Time:** 2-3 hours

---

#### 2. Agenda/List View
**Status:** Not implemented  
**Build on:** ComingAppointmentsPanel.tsx pattern

**Requirements:**
- List all appointments
- Group by date
- Sort by time
- Quick actions
- Filter integration
- Status badges

**Files to Create:**
- `src/components/Book/AgendaView.tsx`

**Est. Time:** 2-3 hours

---

#### 3. Enhance Drag & Drop
**Status:** Partially implemented  
**Build on:** DaySchedule.v2.tsx existing drag & drop

**Missing Features:**
- Visual conflict feedback during drag
- Snap to 15-minute grid
- Buffer time validation during drag
- Smooth animations
- Better drop target visualization

**Files to Modify:**
- `src/components/Book/DaySchedule.v2.tsx` (enhance existing)
- `src/utils/conflictDetection.ts` (enhance existing)

**Est. Time:** 3-4 hours

---

#### 4. Auto-Assign Logic (Next Available = empID 9999)
**Status:** Not implemented  
**Build on:** NewAppointmentModal.tsx staff selection

**Requirements:**
- Detect "9999" or "Next Available" in staff selection
- Find available staff for time slot
- Use conflict detection utility
- Assign to first available
- Show assignment in UI

**Files to Modify:**
- `src/components/Book/NewAppointmentModal.tsx` (enhance existing)
- `src/utils/conflictDetection.ts` (add findAvailableStaff function)

**Files to Create:**
- `src/utils/autoAssign.ts` (new utility)

**Est. Time:** 2-3 hours

---

#### 5. Buffer Time Management
**Status:** Utility created, but not visualized  
**Build on:** conflictDetection.ts

**Missing Features:**
- Visualize buffer times on calendar
- Buffer time configuration UI
- Buffer time validation in NewAppointmentModal
- Show buffer gaps between appointments

**Files to Modify:**
- `src/components/Book/DaySchedule.v2.tsx` (visualize buffers)
- `src/utils/conflictDetection.ts` (enhance buffer logic)
- `src/components/Book/NewAppointmentModal.tsx` (show buffer zones)

**Est. Time:** 3-4 hours

---

#### 6. Staff Availability Visualization
**Status:** Not implemented  
**Build on:** DaySchedule.v2.tsx staff columns

**Requirements:**
- Show breaks/lunch in calendar
- Gray out unavailable times
- Show availability zones
- Visual indicators for availability
- Tooltips with break details

**Files to Modify:**
- `src/components/Book/DaySchedule.v2.tsx` (add availability rendering)
- `src/components/Book/StaffSidebar.tsx` (add break management)

**Files to Create:**
- `src/types/staffAvailability.ts` (new types)
- `src/utils/staffAvailability.ts` (new utility)

**Est. Time:** 4-5 hours

---

#### 7. Recurring Appointments
**Status:** Not implemented  
**Build on:** NewAppointmentModal.tsx

**Requirements:**
- Recurrence pattern selector (daily/weekly/monthly)
- End date or "after X occurrences"
- Create series of appointments
- Edit series vs single appointment
- Cancel series option

**Files to Modify:**
- `src/components/Book/NewAppointmentModal.tsx` (add recurrence panel)
- `src/components/Book/EditAppointmentModal.tsx` (handle series edits)

**Files to Create:**
- `src/utils/recurringAppointments.ts` (new utility)
- `src/types/recurring.ts` (new types)

**Est. Time:** 6-8 hours

---

#### 8. Group/Party Bookings
**Status:** Not implemented  
**Build on:** NewAppointmentModal.tsx

**Requirements:**
- Multiple clients per appointment
- Party size selection
- Group service assignment
- Group pricing
- Check-in all party members

**Files to Modify:**
- `src/components/Book/NewAppointmentModal.tsx` (add party mode)
- `src/components/Book/AppointmentDetailsModal.tsx` (show party members)

**Files to Create:**
- `src/types/partyBooking.ts` (new types)

**Est. Time:** 4-5 hours

---

#### 9. Walk-In Queue Integration
**Status:** WalkInSidebar exists, but integration incomplete  
**Build on:** WalkInSidebar.tsx

**Missing Features:**
- Complete drag-to-calendar functionality
- Auto-allocate walk-ins to available slots
- Queue management (add/remove/prioritize)
- Wait time display

**Files to Modify:**
- `src/components/Book/WalkInSidebar.tsx` (enhance drag integration)
- `src/pages/BookPage.tsx` (complete drop handler)

**Est. Time:** 2-3 hours

---

#### 10. Print Schedule
**Status:** Not implemented  
**Build on:** DaySchedule.v2.tsx, WeekView.tsx

**Requirements:**
- Print-friendly styling
- Option to print day/week/month view
- Include staff names and appointments
- Print dialog
- PDF export option

**Files to Create:**
- `src/utils/printSchedule.ts` (new utility)
- `src/components/Book/PrintView.tsx` (new component)

**Files to Modify:**
- `src/components/Book/CalendarHeader.tsx` (add print button)

**Est. Time:** 3-4 hours

---

#### 11. Coming Appointments Integration
**Status:** ComingAppointmentsPanel created, but check-in integration needs enhancement  
**Build on:** ComingAppointmentsPanel.tsx

**Missing Features:**
- Better integration with AppointmentDetailsModal
- Bulk check-in option
- Late appointment indicators
- SMS/Email reminder triggers

**Files to Modify:**
- `src/components/Book/ComingAppointmentsPanel.tsx` (enhance actions)
- `src/pages/BookPage.tsx` (better integration)

**Est. Time:** 2-3 hours

---

## 📋 IMPLEMENTATION PRIORITY

### Priority 1: Essential for MVP (Week 1-2)
1. **Month View** (2-3h)
2. **Agenda/List View** (2-3h)
3. **Auto-Assign Logic** (2-3h)
4. **Walk-In Queue Integration** (2-3h)

**Total:** 8-12 hours

### Priority 2: Enhanced UX (Week 3-4)
5. **Enhance Drag & Drop** (3-4h)
6. **Buffer Time Visualization** (3-4h)
7. **Coming Appointments Enhancement** (2-3h)

**Total:** 8-11 hours

### Priority 3: Advanced Features (Week 5-6)
8. **Staff Availability Visualization** (4-5h)
9. **Print Schedule** (3-4h)
10. **Group/Party Bookings** (4-5h)

**Total:** 11-14 hours

### Priority 4: Advanced Features (Week 7-8)
11. **Recurring Appointments** (6-8h)

**Total:** 6-8 hours

---

## 🎯 IMPLEMENTATION STRATEGY

### Rule 1: Build on Existing
- **DO NOT** duplicate existing components
- **DO** enhance existing components when possible
- **DO** reuse existing patterns and utilities

### Rule 2: Reuse Patterns
- Follow patterns from existing components
- Use same styling approach
- Match existing component structure

### Rule 3: Extend Utilities
- Add to existing utilities when possible
- Create new utilities only when needed
- Keep utilities focused and reusable

### Rule 4: Maintain Consistency
- Use existing type definitions
- Follow existing naming conventions
- Match existing component APIs

---

## 📁 FILE STRUCTURE

### New Files to Create
```
src/components/Book/
  ├── MonthView.tsx              (NEW)
  ├── AgendaView.tsx             (NEW)
  └── PrintView.tsx              (NEW)

src/utils/
  ├── autoAssign.ts              (NEW)
  ├── recurringAppointments.ts   (NEW)
  ├── staffAvailability.ts       (NEW)
  └── printSchedule.ts           (NEW)

src/types/
  ├── recurring.ts               (NEW)
  ├── partyBooking.ts            (NEW)
  └── staffAvailability.ts      (NEW)
```

### Files to Modify
```
src/components/Book/
  ├── DaySchedule.v2.tsx         (ENHANCE - drag & drop, buffers)
  ├── NewAppointmentModal.tsx    (ENHANCE - auto-assign, recurring, party)
  ├── WalkInSidebar.tsx          (ENHANCE - complete integration)
  ├── CalendarHeader.tsx         (ENHANCE - print button)
  └── ComingAppointmentsPanel.tsx (ENHANCE - better actions)

src/utils/
  └── conflictDetection.ts       (ENHANCE - buffer visualization)

src/pages/
  └── BookPage.tsx               (ENHANCE - month/agenda views)
```

---

## ✅ VALIDATION CHECKLIST

Before implementing each feature:
- [ ] Check if component already exists
- [ ] Verify what's already implemented
- [ ] Identify what needs enhancement vs new build
- [ ] Reuse existing patterns
- [ ] Don't duplicate functionality
- [ ] Update this plan if new features found

---

## 📝 NOTES

1. **DaySchedule.v2.tsx** has drag & drop but needs conflict visualization
2. **NewAppointmentModal.tsx** is complete but needs auto-assign feature
3. **WalkInSidebar.tsx** exists but drag integration needs completion
4. **CustomerSearchModal.tsx** is complete with debounce
5. **Conflict detection** utility exists but needs buffer visualization
6. **ComingAppointmentsPanel.tsx** is new and working, just needs enhancement

---

**Next Steps:**
1. Review this plan
2. Start with Priority 1 features
3. Build incrementally on existing code
4. Test after each feature
5. Update plan as we discover more existing features

