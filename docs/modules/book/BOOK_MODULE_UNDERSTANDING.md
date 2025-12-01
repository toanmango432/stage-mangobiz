# Book Module - Understanding & Implementation Plan

**Date:** October 28, 2025  
**Status:** Phase 1 Complete - Understanding Existing System

---

## 🎯 **What We're Building**

A **complete appointment booking calendar** for the Mango POS system that:
- Works 100% offline in Chrome browser
- Matches existing Mango design patterns
- Preserves all jQuery calendar functionality
- Integrates with existing POS modules

---

## 📚 **Existing Systems Analysis**

### **1. Mango Online Booking (React - Customer-Facing)**

**Location:** `/Users/seannguyen/Mango Online Store /mango-bloom-store/`

**Key Features We Found:**
- ✅ **70+ booking components** (comprehensive UI library)
- ✅ **Group booking support** (parties, multiple guests)
- ✅ **Time slot management** (15-min intervals, grouped by morning/afternoon/evening)
- ✅ **Staff selection** with availability checking
- ✅ **Service questions** and add-ons
- ✅ **Slot holding system** (temporary reservations)
- ✅ **Mobile-responsive** design
- ✅ **Redux state management**

**Design System:**
- Fluent Design (Productivity-Optimized)
- Inter font
- Touch-first optimization (44px min touch targets)
- 3-column desktop layout
- Single column mobile with bottom sheets

**Key Components:**
```
DateTimePicker.tsx          - Calendar + time slot selection
TimeSlotGrid.tsx            - Time slot display
StaffSelectionGrid.tsx      - Staff picker
ServiceCard.tsx             - Service display
BookingSummary.tsx          - Review before booking
GroupBookingManager.tsx     - Party/group bookings
AvailabilityCalendar.tsx    - 7-day strip calendar
```

**Data Flow:**
```
User Action → Redux Dispatch → State Update → Selector → Re-render
                    ↓
              API Call (if needed)
```

### **2. jQuery Calendar (Legacy - POS Internal)**

**Location:** Referenced in `POS_CALENDAR_MIGRATION.md`

**Critical Features to Preserve:**
- ✅ **Monthly calendar grid view**
- ✅ **Day view with time slots** (15-min intervals)
- ✅ **Staff filtering sidebar**
- ✅ **Appointment CRUD operations**
- ✅ **Customer search** (debounced 500ms, phone formatting)
- ✅ **Time calculations** (seconds-based, ±2 hours window)
- ✅ **Appointment positioning** (22px per 15min)
- ✅ **Group appointments** (party system)
- ✅ **Status color coding**
- ✅ **Auto-scroll to appointments**

**Business Logic (MUST PRESERVE EXACTLY):**
```javascript
// Time calculations (seconds-based)
let StartTime = parseInt($('.item[data-employee-id="9999"]').first()
  .attr('data-start-second-time')) - 7200;

// Appointment positioning (22px per 15min)
let distanceMix = ((distanceTime * 900) * heightAptDefault) / 900;
let newTop = newFuncTop(careThis) + distanceMix;

// Customer search (500ms debounce)
searchTimeout = setTimeout(() => {
  performCustomerSearch(cleanedInput);
}, 500);
```

### **3. POS Checkout Module**

**Location:** `PosCheckoutModule/PosCheckoutModule/`

**Design Patterns We'll Use:**
- Fluent Design system
- Inter typography
- 3-column layout (280px sidebar + flexible middle + 320px panel)
- Touch-optimized (44px targets)
- Status badges (pill shape)
- Confirmation dialogs
- Toast notifications

---

## 🏗️ **Our Implementation Architecture**

### **What We've Built (Phase 1 - Complete)**

✅ **1. TypeScript Types (258 lines)**
```typescript
// API Models matching AppointmentController.cs
AppointmentRequest, ServiceRequest, TicketDTO, EditAppt, etc.

// Local State Models
LocalAppointment, AppointmentFilters, CalendarViewState

// Utility Types
AppointmentsByDate, AppointmentsByStaff
```

✅ **2. API Service Layer (496 lines)**
```typescript
class AppointmentService {
  // Offline-first architecture
  async bookAppointment() {
    1. Save to IndexedDB first
    2. Queue for sync
    3. Try immediate sync if online
    4. Background sync on reconnect
  }
}
```

✅ **3. Time Utilities (465 lines, 51 tests passing)**
```typescript
// Exact jQuery formulas preserved
timeToSeconds()              // Convert to seconds since midnight
calculateAppointmentTop()    // 22px per 15min positioning
calculateAppointmentHeight() // Duration-based height
roundToQuarterHour()        // 15-min intervals
formatPhoneNumber()         // Phone formatting
```

✅ **4. Redux Slice (500+ lines)**
```typescript
// Complete state management
- appointments: LocalAppointment[]
- appointmentsByDate: AppointmentsByDate
- appointmentsByStaff: AppointmentsByStaff
- calendarView: CalendarViewState
- loading/error states
- sync status
```

### **What We Need to Build (Phase 2)**

**Core Components:**

1. **CalendarView Component**
   - Month/week selector
   - Date navigation
   - Off-days display
   - Mobile responsive

2. **DaySchedule Component**
   - Time slots (15-min intervals)
   - Staff columns
   - Appointment cards with positioning
   - Drag & drop (future)

3. **AppointmentCard Component**
   - Client info
   - Service details
   - Status badge
   - Duration bar
   - Click to edit

4. **StaffFilter Sidebar**
   - Staff list with avatars
   - Availability indicators
   - Multi-select
   - Search

5. **Customer Search Component**
   - Debounced search (500ms)
   - Phone formatting
   - Create new customer
   - Recent customers

6. **Create/Edit Modals**
   - Service selection
   - Staff assignment
   - Time picker
   - Customer info
   - Notes

---

## 🎨 **Design System Integration**

### **Match Existing Mango POS Design:**

**Colors:**
- Orange/pink gradients (primary actions)
- Teal accents (Team sidebar, headers)
- Paper aesthetic (ticket cards)
- Status colors (green=ready, red=busy, gray=all)

**Components:**
- Bottom navigation (orange-600 active, top indicator bar)
- Top header (centered search)
- Resizable divider (2px, gray-200/60)
- Staff cards (specialty colors, red busy overlay)
- Ticket cards (semicircle cutouts, perforations)

**Typography:**
- System font stack
- Consistent sizing
- Bold for emphasis

**Spacing:**
- Tailwind scale (2, 4, 6, 8, 12, 16, 24)
- Consistent padding/margins

---

## 🔧 **Key Features & Logic**

### **1. Time Slot Generation**
```typescript
// Generate 15-minute slots
function generateTimeSlots(startTime: Date, endTime: Date) {
  const slots = [];
  let current = startTime;
  
  while (current < endTime) {
    slots.push({
      time: current,
      available: checkAvailability(current),
      staffAvailable: getAvailableStaff(current)
    });
    current = addMinutes(current, 15);
  }
  
  return slots;
}
```

### **2. Auto-Assign Logic**
```typescript
// Find available tech in time slot
async function autoAssignTech(startTime, endTime, serviceIds) {
  1. Get all techs who can perform services
  2. Check each tech's schedule for conflicts
  3. Remove techs with overlapping appointments
  4. Return first available tech
  5. If none available, return error
}
```

### **3. Group Booking (Party System)**
```typescript
// Create party with multiple appointments
async function createPartyBooking(members) {
  1. Create RDParty record
  2. For each member:
     - Create individual appointment
     - Link to party ID
     - Validate time slots
  3. Handle overlapping times
  4. Send notifications
}
```

### **4. Conflict Detection**
```typescript
function checkTimeConflict(newApt, existingApts) {
  return existingApts.some(apt => 
    apt.staffId === newApt.staffId &&
    timeRangesOverlap(
      apt.startTime, apt.endTime,
      newApt.startTime, newApt.endTime
    )
  );
}
```

### **5. Offline Sync Queue**
```typescript
// Priority: 1=payments, 2=tickets, 3=appointments
async function queueForSync(appointment) {
  await syncQueue.add({
    type: 'appointment',
    operation: 'create',
    data: appointment,
    priority: 3,
    retryCount: 0
  });
}
```

---

## 📊 **Data Models**

### **Appointment Structure**
```typescript
interface LocalAppointment {
  id: string;                    // Local ID
  serverId?: number;             // Server ID after sync
  salonId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  staffId: string;
  staffName: string;
  services: AppointmentService[];
  status: AppointmentStatus;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  notes?: string;
  source: 'online' | 'walk-in';
  syncStatus: 'pending' | 'synced' | 'error';
  createdAt: Date;
  updatedAt: Date;
}
```

### **Time Slot Structure**
```typescript
interface TimeSlot {
  time: string;                  // "09:00 AM"
  available: boolean;
  staffAvailable: string[];      // Staff IDs
  endTime: string;               // Based on service duration
}
```

---

## 🚀 **Implementation Strategy**

### **Phase 2: Core Components (Week 3-4)**
1. ✅ Enhanced CalendarView
2. ✅ Enhanced DaySchedule
3. ✅ AppointmentCard
4. ✅ StaffFilter sidebar

### **Phase 3: Business Logic (Week 5-6)**
1. ✅ Customer search with debounce
2. ✅ Appointment positioning (exact formulas)
3. ✅ Auto-assign logic
4. ✅ Group booking

### **Phase 4: Integration (Week 7-8)**
1. ✅ Create/Edit modals
2. ✅ Offline sync
3. ✅ Full integration
4. ✅ Polish & performance

---

## ✅ **Confirmation Checklist**

Before we proceed to Phase 2, confirm understanding of:

- [x] **Offline-first architecture** - IndexedDB → Sync queue → API
- [x] **Exact time formulas** - 22px per 15min, seconds-based, ±2 hours
- [x] **Auto-assign logic** - Check availability, handle conflicts
- [x] **Group bookings** - Party system with linked appointments
- [x] **Design integration** - Match existing Mango POS patterns
- [x] **Mobile responsive** - Touch targets, bottom sheets
- [x] **Status management** - Pending → Confirmed → Completed
- [x] **Customer search** - 500ms debounce, phone formatting
- [x] **Staff filtering** - Multi-select, availability indicators
- [x] **Time slot generation** - 15-min intervals, business hours

---

## 🎯 **Success Criteria**

**Functionality:**
- ✅ Create/edit/cancel appointments
- ✅ View by day/week/month
- ✅ Filter by staff
- ✅ Search customers
- ✅ Auto-assign techs
- ✅ Group bookings
- ✅ Offline support
- ✅ Sync on reconnect

**Performance:**
- ✅ < 100ms UI interactions
- ✅ < 500ms API calls
- ✅ Smooth scrolling
- ✅ No memory leaks

**Quality:**
- ✅ 100% TypeScript typed
- ✅ Comprehensive tests
- ✅ Accessible (WCAG)
- ✅ Mobile responsive

---

**Ready to build Phase 2!** 🚀
