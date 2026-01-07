# POS Calendar Module Analysis - Staff Scheduling System

**Date:** October 28, 2025  
**Module:** Worker Schedule (w-schedule)  
**Type:** Staff/Admin Calendar View (NOT customer booking)

---

## 🎯 Key Finding

The POS "calendar" is a **staff scheduling tool** for managers, NOT a customer booking calendar. It shows employee work schedules in a weekly grid format.

**What it is:**
- ✅ Staff shift scheduling
- ✅ Employee time-off management
- ✅ Hours tracking (full-time/part-time)
- ✅ Admin/manager interface

**What it's NOT:**
- ❌ Customer appointment booking
- ❌ Service scheduling
- ❌ Customer-facing interface

---

## 📊 UI Design

### Weekly Grid Layout

```
┌─────────────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│   STAFF     │ MON │ TUE │ WED │ THU │ FRI │ SAT │ SUN │
├─────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ Alice J.    │ 9-5 │ 9-5 │ OFF │ 9-5 │ 9-5 │10-6 │ OFF │
│ 40h/week    │     │     │     │     │     │     │     │
├─────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ Bob S.      │10-6 │10-6 │10-6 │ OFF │10-6 │10-6 │ OFF │
│ 35h/week    │     │     │     │     │     │     │     │
└─────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

### Key Features

1. **Grid Layout** - CSS Grid with sticky header/column
2. **Shift Pills** - Time ranges displayed as buttons
3. **Multiple Shifts** - Stacked vertically per day
4. **Time Off** - Red strikethrough with reason
5. **Context Menus** - Right-click for quick actions
6. **Hours Calculation** - Weekly totals per employee
7. **Compact View** - Toggle for dense display
8. **Staff Filtering** - Multi-select dropdown

---

## 💡 What Can Be Adapted for Mango

### ✅ Useful Patterns

#### 1. **Grid Layout System** ⭐⭐⭐⭐⭐

Adapt for daily appointment calendar:

```
┌──────────┬─────┬─────┬─────┬─────┬─────┬─────┐
│  STAFF   │ 9AM │10AM │11AM │12PM │ 1PM │ 2PM │
├──────────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ Alice    │ ✓   │ ✓   │ ✓   │Lunch│ ✓   │ ✓   │
├──────────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ Bob      │ ✓   │Booked│Booked│ ✓  │ ✓   │ ✓   │
└──────────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

**Benefits:**
- See all staff availability at once
- Visual booking interface
- Professional appearance
- Great for admin/front desk

#### 2. **Time Slot Visual Design** ⭐⭐⭐⭐⭐

```tsx
// Available slot
<Button className="bg-green-100 text-green-700">
  9:00 AM - Available
</Button>

// Booked slot
<div className="bg-gray-200 cursor-not-allowed">
  10:00 AM - Booked
</div>

// Selected slot
<Button className="bg-primary shadow-lg scale-105">
  11:00 AM - Selected ✓
</Button>
```

#### 3. **Sticky Header Pattern** ⭐⭐⭐⭐

Keep time slots visible while scrolling:

```tsx
<div className="sticky top-0 z-50 bg-white">
  <div className="grid grid-cols-8">
    <div className="sticky left-0">STAFF</div>
    <div>9 AM</div>
    <div>10 AM</div>
    {/* ... */}
  </div>
</div>
```

#### 4. **Context Menu Pattern** ⭐⭐⭐

Quick booking actions:

```tsx
<ContextMenu>
  <ContextMenuTrigger><TimeSlot /></ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>📅 Book Appointment</ContextMenuItem>
    <ContextMenuItem>👤 View Staff Profile</ContextMenuItem>
    <ContextMenuItem>ℹ️ Service Details</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

#### 5. **Compact View Toggle** ⭐⭐⭐

Show more time slots on screen:

```tsx
<Button onClick={() => setCompactView(!compactView)}>
  {compactView ? "Normal View" : "Compact View"}
</Button>
```

---

### ❌ What NOT to Use

1. **Staff Scheduling** - Not relevant for customer bookings
2. **Hours Tracking** - Labor tracking not needed
3. **Weekly Grid for Staff** - Too much info for customers
4. **Time-off Management** - Admin-only feature

---

## 🎯 Recommended Implementation

### Option 1: Daily Calendar Grid (Admin View) ⭐⭐⭐⭐⭐

**Create admin booking interface:**

```tsx
<DailyCalendarGrid
  date={selectedDate}
  staff={allStaff}
  bookings={todaysBookings}
  onSlotClick={(staffId, time) => handleBooking(staffId, time)}
/>
```

**Use Cases:**
- Admin dashboard
- Front desk bookings
- Phone bookings
- Walk-in customers

**Benefits:**
- See all availability
- Quick booking
- Professional interface
- Efficient workflow

---

### Option 2: Staff Availability Indicator (Customer View) ⭐⭐⭐⭐

**Show availability in current booking flow:**

```tsx
<StaffCard>
  <Avatar />
  <Name />
  <AvailabilityBar>
    <Slot type="available">9-11 AM</Slot>
    <Slot type="booked">11-1 PM</Slot>
    <Slot type="available">1-5 PM</Slot>
  </AvailabilityBar>
</StaffCard>
```

**Benefits:**
- See staff schedule
- Pick best time
- Better UX
- Avoid conflicts

---

## 📦 Components to Extract

### 1. Grid Layout System

**File:** `ScheduleView.tsx`

```tsx
<div 
  className="schedule-grid"
  style={{
    gridTemplateColumns: "var(--staff-w) repeat(7, minmax(var(--day-min), 1fr))",
    columnGap: "var(--col-gap)",
  }}
/>
```

### 2. TimeSlot Component

**File:** `EmployeeRow.tsx`

```tsx
<TimeSlot
  start="9a"
  end="5p"
  type="available"
  onClick={handleClick}
  compact={false}
/>
```

### 3. Context Menu System

**Files:** `ShiftContextMenu.tsx`, `OffCellContextMenu.tsx`

```tsx
<SlotContextMenu
  onBook={handleBook}
  onViewDetails={handleView}
  onCancel={handleCancel}
>
  <TimeSlot />
</SlotContextMenu>
```

---

## 🚀 Implementation Plan

### Phase 1: Design (1-2 days)
- Review POS calendar UX
- Design Mango calendar mockup
- Decide grid vs list view
- Get approval

### Phase 2: Core Grid (2-3 days)
- Extract grid layout
- Create CalendarGrid component
- Add sticky header/column
- Make responsive

### Phase 3: Time Slots (2-3 days)
- Create TimeSlot component
- Add visual states
- Implement click handling
- Add hover effects

### Phase 4: Integration (2-3 days)
- Connect to API
- Fetch staff schedules
- Handle bookings
- Add loading states

### Phase 5: Polish (1-2 days)
- Add context menus
- Implement compact view
- Add filters
- Test mobile

**Total:** 8-13 days

---

## ✅ Key Takeaways

1. **POS calendar is for staff scheduling**, not customer bookings
2. **Grid layout pattern** is excellent and reusable
3. **Visual design** of time slots is professional
4. **Sticky header/column** improves UX
5. **Context menus** add power user features
6. **Adapt, don't copy** - different use case

---

## 📝 Next Steps

1. **Decide:** Do we need a calendar grid view?
2. **Design:** Mockup for Mango's use case
3. **Extract:** Grid layout + TimeSlot components
4. **Build:** Admin booking calendar
5. **Test:** With real users

---

**Conclusion:** The POS calendar has excellent UI patterns that can be adapted for Mango's booking system, but it's designed for a different purpose (staff scheduling vs customer booking). Focus on extracting the grid layout and visual design patterns, not the scheduling logic.
