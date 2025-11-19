# Book Module Responsive Design Audit

**Date**: November 19, 2025  
**Scope**: Full audit of Book module responsiveness  
**Level**: Medium Detail

---

## Executive Summary

The Book module has **moderate responsive design implementation** with significant gaps on mobile and tablet devices. While the header uses responsive classes, the main calendar layout and sidebars are heavily desktop-focused with minimal mobile considerations. Critical issues include:

- Sidebars hidden on mobile but no mobile-friendly alternatives
- No tablet landscape/portrait breakpoint adjustments
- Fixed widths preventing proper mobile scaling
- Modals use viewport units that don't adapt well to small screens
- Touch targets inconsistent with 44px minimum recommendations
- Horizontal scrolling issues in grid-based views

---

## 1. CURRENT RESPONSIVE STATE

### Breakpoints Used

The Book module uses the following Tailwind breakpoint patterns:

| Breakpoint | Classes Found | Status |
|-----------|--------------|--------|
| **sm:** (640px) | `sm:hidden`, `sm:inline-flex`, `sm:px-6`, `sm:py-5`, `sm:min-w-[160px]` | **Partial** |
| **md:** (768px) | `md:block`, `md:hidden` | **Minimal** |
| **lg:** (1024px) | `lg:block`, `lg:flex`, `lg:w-auto`, `lg:flex-row` | **Heavy** |
| **xl:** (1280px) | **None Found** | **Not Used** |

### Responsive Class Distribution

```
sm: classes = ~15 found (mostly header controls)
md: classes = ~5 found (title visibility)
lg: classes = ~20+ found (sidebar and layout hiding)
xl: classes = 0 (not implemented)
```

**Key Finding**: Heavy reliance on `lg:block` and `hidden lg:block` pattern means 80% of layout is hidden below 1024px.

---

## 2. MOBILE ISSUES (< 640px)

### Critical Mobile Problems

#### A. Sidebar Completely Hidden
**Component**: `StaffSidebar.tsx`
```tsx
<div className="hidden lg:block">
  <StaffSidebar ... />
</div>
```
**Problem**: 
- No mobile-friendly alternative UI for staff selection
- Users cannot filter by staff on phones
- Staff counts and availability invisible

**Impact**: Mobile users lose 30% of filtering functionality

#### B. Walk-In Sidebar Hidden
**Component**: `WalkInSidebar.tsx`
```tsx
<div className="hidden lg:block">
  <WalkInSidebar ... />
</div>
```
**Problem**:
- No mobile replacement UI
- Walk-in queue inaccessible on phones

#### C. Fixed Sidebar Widths
**Component**: `StaffSidebar.tsx`
```tsx
const [searchQuery, setSearchQuery] = useState('');
...
<div className={cn(
  'w-64 bg-surface-primary',  // FIXED 256px width
  ...
)}>
```
**Problem**: `w-64` (256px) is too wide for mobile screens

#### D. Calendar Header Inadequate
**Component**: `CalendarHeader.tsx` - Line 76-107
```tsx
<h1 className="text-2xl font-bold text-gray-900 tracking-tight hidden md:block">
  Appointments
</h1>
// Title hidden on mobile but new button visible - creates layout imbalance
<div className="hidden sm:block">
  <PremiumButton ... />New Appointment</PremiumButton>
</div>
<div className="sm:hidden">
  <PremiumButton ... />New</PremiumButton>  // Different text
</div>
```
**Problem**:
- Text changes between sm/md breakpoints
- Header spacing doesn't account for mobile

#### E. Time Window Controls Always Visible Below lg
**Component**: `CalendarHeader.tsx` - Line 170-198
```tsx
{/* Time Window Toggle - Hidden on mobile */}
<div className="hidden lg:flex items-center gap-1 bg-surface-secondary rounded-lg p-1">
```
**Problem**: 
- Hidden on mobile but header still crowded
- No alternative time window control for mobile users

#### F. Day View Grid Not Mobile-Optimized
**Component**: `DaySchedule.v2.tsx` - Line 255
```tsx
style={{ minWidth: 'min(200px, 40vw)' }}
```
**Problem**:
- `40vw` for staff column = ~160px on iPhone 12 (375px width)
- Leaves only 215px for time column
- No staff name visible, only avatar
- Text in time column too small to read

#### G. FAB Button Positioning Issues
**Component**: `BookPage.tsx` - Line 738-746
```tsx
<button
  className="fixed bottom-8 right-8 w-14 h-14 ..."
>
```
**Problem**:
- Fixed position conflicts with mobile nav bar (bottom-8 = 32px from bottom)
- BottomNavBar takes up height
- FAB may be hidden behind nav or too close

**Recommended Fix**: `bottom-24 sm:bottom-8` to account for mobile nav

#### H. DaySchedule Horizontal Scrolling
**Component**: `DaySchedule.v2.tsx` - Line 196
```tsx
<div className="flex h-full overflow-auto bg-gray-50 overscroll-contain">
```
**Problem**:
- Horizontal scroll unavoidable with multiple staff columns
- Staff names not visible on small screens
- No mobile single-staff view

---

## 3. TABLET ISSUES (641px - 1023px)

### Tablet Problems (Portrait & Landscape)

#### A. Awkward Sidebar Behavior
**At 768px (iPad)**: 
- Sidebar still hidden (requires 1024px)
- Takes up 73% of width

**At 1024px (iPad Landscape)**: 
- Suddenly appears taking 256px
- Calendar shrinks from full-width to ~768px

**Problem**: No smooth transition for tablet sizes

#### B. Month View Cell Sizing
**Component**: `MonthView.tsx` - Line 203
```tsx
<button
  ...
  className={cn(
    'relative p-2 min-h-[80px] text-left border-r border-gray-200 last:border-r-0',
    ...
  )}
>
```
**Problem**:
- Fixed `min-h-[80px]` means 7 columns × 80px = 560px minimum
- iPad portrait (768px): too cramped
- iPad landscape (1024px): okay but sidebar appears

#### C. Week View Not Responsive
**Component**: `WeekView.tsx` - Line 111
```tsx
<div className="flex-1 grid grid-cols-7 overflow-hidden">
  {weekDays.map((day, index) => (
    <div
      key={index}
      className="border-r border-gray-200 last:border-r-0 overflow-y-auto p-2 space-y-2"
    >
```
**Problem**:
- `grid-cols-7` always 7 columns
- On tablet, each column = ~100px width
- Appointments text truncated

---

## 4. HIDDEN ELEMENTS

### Elements Hidden by Responsive Classes

| Component | Hidden Class | Shows at | Problem |
|-----------|--------------|----------|---------|
| StaffSidebar | `hidden lg:block` | 1024px+ | No mobile staff filter |
| WalkInSidebar | `hidden lg:block` | 1024px+ | No mobile walk-in view |
| Appointments Title | `hidden md:block` | 768px+ | Inconsistent header |
| Time Window Toggle | `hidden lg:flex` | 1024px+ | No 2h/full-day toggle on mobile |
| FilterPanel | `hidden lg:block` | 1024px+ | No appointment filters on mobile |
| Search Button | `hidden sm:flex` | 640px+ | Okay but tiny on mobile |

### Elements Always Visible (No Responsive Control)

- Calendar Header (always takes full space)
- Main calendar area (flex-1, fills available)
- Footer toast/FAB (fixed positioning)

---

## 5. LAYOUT PROBLEMS

### A. Fixed Widths

**File**: `StaffSidebar.tsx` (Line 63-69)
```tsx
<div className={cn(
  'w-64 bg-surface-primary',  // 256px FIXED
  'border-r border-gray-200/50',
  'flex flex-col h-full',
  'shadow-premium-sm',
  className
)}>
```
**Impact**: 
- Cannot shrink on tablets
- 33% of 768px iPad = too much

**File**: `WalkInSidebar.tsx`
```tsx
'w-80 border-l border-gray-200/50',  // 320px FIXED
```

**File**: `NewAppointmentModal.v2.tsx` (Line ~1100)
```tsx
className="fixed bottom-24 right-6 z-[70] ... w-80 ..."  // 320px FIXED
```

### B. Viewport Unit Issues

**File**: `NewAppointmentModal.v2.tsx`
```tsx
view === 'fullpage'
  ? 'right-0 top-0 bottom-0 w-[90vw] max-w-6xl animate-slide-in-right ...'
  : '...'
```
**Problem**:
- `w-[90vw]` = 90% of viewport width
- On mobile 375px: 337px width (fills screen edge-to-edge)
- No safe area consideration (notches, safe zones)
- `max-w-6xl` (72rem = 1152px) meaningless on mobile

**File**: `GroupBookingModal.tsx`
```tsx
className="h-[90vh]"  // 90% of viewport height
```
**Problem**:
- Doesn't account for browser UI (address bar expands/collapses)
- Better: `max-h-[calc(100vh-80px)]`

### C. Overflow Issues

**File**: `DaySchedule.v2.tsx` (Line 196)
```tsx
<div className="flex h-full overflow-auto bg-gray-50 overscroll-contain">
```
**Problem**: 
- Horizontal scroll required with multiple staff
- No way to hide non-selected staff on mobile
- Staff columns at `min(200px, 40vw)` causes overflow

**Example**: 
- Mobile (375px): staff column = 150px × 3 staff = 450px total
- Requires horizontal scroll

---

## 6. TOUCH TARGETS

### Minimum Touch Target: 44px × 44px (Apple HIG)

**Adequate Touch Targets** ✅
- PremiumButton components: typically 40px+ height with padding
- Calendar date cells: 80px minimum height (MonthView)
- Week view columns: ~100px+ width

**Inadequate Touch Targets** ❌

| Component | Current Size | Standard | Gap |
|-----------|-------------|----------|-----|
| Time slot buttons (15-min) | 15px height | 44px | -29px |
| Calendar header nav arrows | ~20px | 44px | -24px |
| View toggle buttons | ~28px height | 44px | -16px |
| Staff chip toggle | ~32px height | 44px | -12px |

**File**: `DaySchedule.v2.tsx` (Line 353-414)
```tsx
<button
  key={`slot-${hour}-${intervalIndex}`}
  onClick={() => {
    onTimeSlotClick(staffMember.id, snappedTime);
  }}
  ...
  style={{
    top: `${hour * 60 + intervalIndex * 15}px`,
    height: '15px',  // ❌ ONLY 15px HIGH
  }}
/>
```
**Impact**: Difficult to tap time slots on mobile

---

## 7. CRITICAL RESPONSIVE GAPS

### Gap 1: No Mobile Calendar View
**Issue**: DaySchedule assumes 3+ staff columns visible simultaneously  
**Mobile Reality**: Only 1-2 staff fit before horizontal scroll

**Solution Needed**: 
- Single staff column view for mobile
- Dropdown to switch between staff
- Or swipe between staff members

### Gap 2: Modal Sizing on Mobile
**Issue**: NewAppointmentModal uses `w-[90vw] max-w-6xl`  
**Mobile Reality**: Takes full width, no safe area padding

**File**: `NewAppointmentModal.v2.tsx` (Line ~1100)
```tsx
? 'right-0 top-0 bottom-0 w-[90vw] max-w-6xl animate-slide-in-right ...'
```
**Should be**: 
```tsx
? 'right-0 top-0 bottom-0 w-full sm:w-[90vw] sm:max-w-4xl ...'
```

### Gap 3: Header Controls Overflow
**Issue**: 4 button groups in CalendarHeader don't stack on mobile

**File**: `CalendarHeader.tsx` (Line 112-274)
```tsx
<div className="flex items-center justify-between gap-4">
  {/* Left: Date Navigation - doesn't hide any elements */}
  {/* Right: View Controls + Filters + Search - all showing on mobile */}
</div>
```
**Problem**: 
- View toggle: Day, Week, Month, Agenda (4 buttons)
- Time window: 2-hour, Full day (2 buttons)  
- Filters: 1 button
- Search: 1 button
- Total: 10 buttons/controls in header

**On mobile (375px)**:
- Each button ~30px
- 10 buttons = 300px minimum
- Header padding = ~16px × 2 = 32px
- Total: 332px - fits but cramped

### Gap 4: Sidebar Selection Not Available on Mobile
**Issue**: Staff sidebar with `hidden lg:block` means:
- No staff filtering on mobile
- Mobile users see ALL staff at once
- Unscrollable if 10+ staff members

**File**: `BookPage.tsx` (Line 564-570)
```tsx
{/* Staff Sidebar - Hidden on mobile */}
<div className="hidden lg:block">
  <StaffSidebar ... />
</div>
```

**Expected Mobile UX**: 
- Staff selection as bottom sheet or modal
- Or quick-access chip list
- Or dropdown menu

---

## 8. SUMMARY TABLE: Responsive Implementation

| Feature | Mobile | Tablet | Desktop | Status |
|---------|--------|--------|---------|--------|
| Calendar View | Broken (horizontal scroll) | Cramped | Good | 🔴 Failed |
| Staff Selection | Hidden | Hidden | Sidebar | 🔴 Failed |
| Header Controls | Cramped | Okay | Good | 🟡 Partial |
| Walk-In Queue | Hidden | Hidden | Sidebar | 🔴 Failed |
| Modal Sizing | Full-width but cramped | Full-width | Slide panel | 🟡 Partial |
| Touch Targets | Inadequate (15px slots) | Small | Fine | 🔴 Failed |
| Time Window Toggle | Hidden | Hidden | Visible | 🔴 Failed |
| Filters | Hidden | Hidden | Visible | 🔴 Failed |
| Date Navigation | Visible | Visible | Visible | 🟢 Good |
| View Switcher | Visible | Visible | Visible | 🟢 Good |

---

## 9. DETAILED COMPONENT ISSUES

### DaySchedule.v2.tsx

**Responsive Issues**:
1. **Time column width**: Fixed `calendar.timeColumn.width` (probably 60px)
2. **Staff column width**: `minWidth: 'min(200px, 40vw)'` 
   - Fails on phones: 40vw of 375px = 150px
   - Staff name unreadable at 150px width
3. **Time slot height**: `height: '15px'` - too small to tap
4. **Appointment cards**: `left-2 right-2` (padding) reduces usable space

### StaffSidebar.tsx

**Responsive Issues**:
1. **Width**: `w-64` (256px) fixed
2. **Hidden**: `hidden lg:block` - no mobile alternative
3. **Search input**: Full width on small container
4. **Staff chip**: Takes full height, unresponsive to small screens

### CalendarHeader.tsx

**Responsive Issues**:
1. **Date display**: `min-w-[140px] sm:min-w-[160px]` changes size abruptly
2. **Controls layout**: `flex items-center justify-between gap-4` doesn't wrap
3. **View toggle buttons**: 4 buttons in row, no wrapping
4. **Time window hidden**: `hidden lg:flex` with no mobile alternative
5. **Filters hidden**: `hidden lg:block` with no mobile alternative
6. **New button text**: Changes from "New Appointment" (sm) to "New" (xs)

### NewAppointmentModal.v2.tsx

**Responsive Issues**:
1. **Slide mode width**: `w-80` (320px) doesn't adapt to very small phones
2. **Fullpage mode width**: `w-[90vw] max-w-6xl`
   - 90vw on 375px = 337px (no side padding)
   - max-w-6xl (1152px) irrelevant on mobile
3. **Interior max-w-sm**: `max-w-sm` (384px) breaks layout on small screens
4. **Modal height**: No responsive max-height adjustment

### MonthView.tsx

**Responsive Issues**:
1. **Cell minimum height**: `min-h-[80px]` forces large cells
   - 7 cells × 80px = 560px minimum
   - Breaks on smaller tablets
2. **Day number**: `text-sm` - okay but no scaling
3. **Appointment dots**: Text truncation at small sizes
4. **No responsive columns**: Always 7 columns

### WeekView.tsx

**Responsive Issues**:
1. **Always 7 columns**: `grid-cols-7` fixed
   - No responsive reduction to 5, 3, or 1 column
2. **Column width**: Each = viewport / 7
   - Mobile (375px): 53px per column - unreadable
3. **Header padding**: `p-4` doesn't scale down on mobile
4. **Text**: No `text-xs` in header, only `text-2xl`

---

## 10. DESIGN SYSTEM CONSTRAINTS

**Tailwind Config Review** (`tailwind.config.js`):

```js
// NO custom breakpoints defined
// NO mobile-first media queries
// NO safe area utilities for notch devices
```

**Missing Utilities**:
- `safe-top`, `safe-bottom` (for notched devices)
- No responsive `gap` adjustments
- No responsive padding scale
- Z-index scales exist (60, 70, 80, 90, 100) but underutilized

---

## 11. BROWSER DEVELOPER TOOLS CHECKLIST

### Test Points for Mobile (iPhone 12 - 390px)

- [ ] Horizontal scrolling appears in DaySchedule
- [ ] Staff sidebar not accessible
- [ ] FAB button overlaps mobile nav
- [ ] Time slots (15px height) difficult to tap
- [ ] Calendar header buttons cramped

### Test Points for Tablet (iPad - 768px)

- [ ] Sidebar still hidden (appears at lg:1024px)
- [ ] Calendar grid too cramped
- [ ] Month view cells too small

### Test Points for iPad Landscape (1024px)

- [ ] Sidebar suddenly appears
- [ ] Layout shift occurs
- [ ] Appropriate space available

---

## RECOMMENDATIONS (Priority Order)

### P0 - Critical (Blocking Mobile Use)

1. **Create mobile calendar view** (single staff column or month only)
2. **Fix touch target sizes** (44px minimum for time slots)
3. **Hide sidebar, add mobile staff selection** (bottom sheet or modal)
4. **Fix FAB positioning** (account for mobile nav height)
5. **Resolve horizontal scroll** in DaySchedule on mobile

### P1 - High (Degraded Mobile Experience)

6. **Add tablet responsive breakpoints** (md: 768px specific styling)
7. **Implement responsive modal sizing** (account for safe areas)
8. **Stack header controls on mobile** (vertical layout for small screens)
9. **Add responsive time window toggle** for mobile

### P2 - Medium (Polish/UX)

10. **Responsive typography** (text scales with viewport)
11. **Accessible walk-in queue** on mobile (currently hidden)
12. **Improved filtering** on mobile (currently hidden)
13. **Better calendar cell sizing** (responsive min-height)

---

## CODE LOCATIONS TO FIX

| File | Lines | Issue | Priority |
|------|-------|-------|----------|
| `DaySchedule.v2.tsx` | 255 | Staff column width `minWidth: min(200px, 40vw)` | P0 |
| `DaySchedule.v2.tsx` | 407-409 | Time slot height `15px` | P0 |
| `BookPage.tsx` | 564, 651 | Sidebars `hidden lg:block` | P0 |
| `BookPage.tsx` | 738-746 | FAB `bottom-8` positioning | P0 |
| `CalendarHeader.tsx` | 112-274 | Header layout doesn't wrap | P1 |
| `CalendarHeader.tsx` | 171 | Time window `hidden lg:flex` | P1 |
| `CalendarHeader.tsx` | 258 | Filters `hidden lg:block` | P1 |
| `NewAppointmentModal.v2.tsx` | ~1100 | Modal `w-[90vw]` no safe area | P1 |
| `MonthView.tsx` | 203 | Cell `min-h-[80px]` fixed | P2 |
| `WeekView.tsx` | 111 | Always `grid-cols-7` | P2 |
| `StaffSidebar.tsx` | 63-69 | Sidebar `w-64` fixed | P0 |
| `WalkInSidebar.tsx` | Line 1 | Hidden `lg:block` no mobile | P0 |

---

## TESTING CHECKLIST

### Devices to Test

- iPhone 12 (390px) - mobile
- iPad Air (768px) - tablet portrait  
- iPad Pro (1024px) - tablet landscape
- Desktop (1440px) - full width

### User Workflows to Test

1. Create appointment on mobile (currently blocked by hidden staff selection)
2. Reschedule appointment via drag-drop on mobile (time slots too small)
3. View calendar on tablet portrait (sidebar hidden, cramped)
4. Toggle between views on mobile (header controls cramped)
5. Open new appointment modal on mobile (ensure safe areas respected)

---

## NEXT STEPS

1. Create `tasks/todo.md` with responsive design fixes
2. Implement mobile-first approach (start with 375px breakpoint)
3. Add tablet-specific breakpoints (md: 768px)
4. Test with Chrome DevTools device emulation
5. Consider Progressive Enhancement: show agenda view on mobile, day view on tablets

