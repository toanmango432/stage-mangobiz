# Book Module Components - Detailed Location Reference

## Calendar Views

### 1. TimeSlot.tsx
**Path**: `/src/components/Book/TimeSlot.tsx`
**Line 26**: Main component div
**Status**: BASIC - needs hover, active, focus

**Interactive Elements**:
- Line 26-51: TimeSlot container (not directly interactive in some contexts)

**Current Classes**:
```tsx
className={cn(
  'relative border-b border-gray-200',
  'transition-colors duration-150',
  isCurrentTime && 'bg-blue-50',
  isBlocked && 'bg-gray-100 opacity-50',
  className
)}
```

**Missing**:
- Hover state
- Focus ring
- Active state

---

### 2. DaySchedule.v2.tsx
**Path**: `/src/components/Book/DaySchedule.v2.tsx`

#### Time Slot Buttons
**Line 346-401**: Individual 15-minute slot buttons
**Status**: PARTIAL - has hover, needs focus and active

**Current Classes**:
```tsx
className={cn(
  "absolute w-full transition-all duration-200 cursor-pointer",
  isDropTarget 
    ? slotConflict?.hasConflict
      ? getConflictColor(slotConflict.conflictType)
      : "bg-teal-100 border-2 border-dashed border-teal-400"
    : "hover:bg-teal-50/50",
  isDropTarget && slotConflict?.hasConflict && "ring-2 ring-red-400"
)}
```

**Missing**:
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-teal-400`
- Active state: `active:bg-teal-200 active:scale-[0.98]`
- Border on non-drop-target hover

#### Appointment Buttons
**Line 445-562**: Appointment card buttons in schedule grid
**Status**: EXCELLENT - already well implemented

**Current Classes**:
```tsx
className={cn(
  'absolute left-2 right-2',
  'rounded-xl',
  'border border-gray-200',
  'bg-white',
  'text-left p-3',
  'overflow-hidden',
  'group cursor-move',
  'transition-all duration-200',
  'hover:shadow-premium-lg hover:-translate-y-0.5 hover:z-10',
  'hover:border-brand-300',
  'animate-fade-in',
  draggedAppointment?.id === appointment.id && 'opacity-50 scale-95',
  draggedAppointment?.id === appointment.id && dragConflict?.hasConflict && 'ring-2 ring-red-400'
)}
```

**Status**: Good! Already has hover, active, and focus

---

### 3. WeekView.tsx
**Path**: `/src/components/Book/WeekView.tsx`

#### Day Header Buttons
**Line 73-94**: Week day buttons (Mon, Tue, etc.)
**Status**: BASIC - needs focus and active states

**Current Classes**:
```tsx
className={cn(
  'p-4 text-center border-r border-gray-200 last:border-r-0',
  'hover:bg-gray-50 transition-colors',
  isToday(day) && 'bg-teal-50'
)}
```

**Missing**:
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-teal-400`
- Active state: `active:bg-teal-100`
- Border enhancement on hover: `hover:border-teal-300`

---

### 4. MonthView.tsx
**Path**: `/src/components/Book/MonthView.tsx`

#### Day Cell Buttons
**Line 191-265**: Calendar grid day cells
**Status**: BASIC - needs focus and active states

**Current Classes**:
```tsx
className={cn(
  'relative p-2 min-h-[80px] text-left border-r border-gray-200 last:border-r-0',
  'hover:bg-gray-50 transition-colors',
  !isCurrentMonthDay && 'text-gray-300 bg-gray-50',
  isTodayDay && 'bg-teal-50 border-teal-200'
)}
```

**Missing**:
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-teal-400`
- Active state: `active:bg-teal-100`
- Shadow on hover: `hover:shadow-sm`

#### Appointment Badges
**Line 216-242**: Appointment display within cells
**Status**: GOOD - has hover, needs focus

**Current Classes**:
```tsx
className={cn(
  'text-xs px-2 py-0.5 rounded truncate',
  'hover:shadow-sm transition-shadow cursor-pointer',
  getStatusColor(apt.status),
  'text-white'
)}
```

**Missing**:
- Focus ring: `focus:ring-2 focus:ring-offset-1`
- Active state: `active:scale-105`
- Outline removal: `focus:outline-none`

---

## Sidebar Components

### 5. StaffSidebar.tsx
**Path**: `/src/components/Book/StaffSidebar.tsx`

#### Search Input
**Line 75-84**: Staff search input
**Status**: EXCELLENT - uses PremiumInput

**Current Implementation**: Already handled by PremiumInput component

#### Select All Button
**Line 88-98**: "Select All" button
**Status**: BASIC - needs focus and active

**Current Classes**:
```tsx
className={cn(
  'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium',
  'text-brand-600 hover:text-brand-700',
  'hover:bg-brand-50',
  'transition-all duration-200'
)}
```

**Missing**:
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500`
- Active state: `active:scale-[0.98]`

#### Clear All Button
**Line 100-109**: "Clear All" button
**Status**: BASIC - needs focus and active

**Current Classes**:
```tsx
className={cn(
  'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium',
  'text-gray-600 hover:text-gray-700',
  'hover:bg-gray-100',
  'transition-all duration-200'
)}
```

**Missing**:
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400`
- Active state: `active:scale-[0.98]`

---

### 6. StaffChip.tsx
**Path**: `/src/components/Book/StaffChip.tsx`

#### Staff Chip Button
**Line 26-68**: Individual staff selection button
**Status**: GOOD hover, MISSING focus and active

**Current Classes**:
```tsx
className={cn(
  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200',
  'hover:shadow-premium-md hover:-translate-y-0.5',
  isSelected
    ? 'bg-brand-50 border-brand-300 shadow-premium-sm'
    : 'bg-white border-gray-200 hover:border-brand-200'
)}
```

**Missing**:
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500`
- Active state: `active:scale-95`

#### Search Input (StaffList variant)
**Line 115**: Staff search input (if present)
**Status**: Good - similar to StaffSidebar

#### Show More/Less Button
**Line 138-145**: "Show more" / "Show less" button
**Status**: BASIC

**Current Classes**:
```tsx
className="w-full py-2 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg font-medium transition-colors"
```

**Missing**:
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-offset-2`
- Active state: `active:scale-[0.98]`

---

## Header Components

### 7. CalendarHeader.tsx
**Path**: `/src/components/Book/CalendarHeader.tsx`

#### Previous Day Button
**Line 116-122**: Chevron left button
**Status**: EXCELLENT - uses PremiumIconButton

#### Next Day Button
**Line 144-150**: Chevron right button
**Status**: EXCELLENT - uses PremiumIconButton

#### Date Display Button
**Line 130-140**: Current date button
**Status**: GOOD - needs stronger focus

**Current Classes**:
```tsx
className={cn(
  'text-base sm:text-lg font-semibold text-gray-900',
  'hover:text-brand-600 transition-colors duration-200',
  'px-3 py-1.5 rounded-lg',
  'hover:bg-brand-50'
)}
```

**Missing**:
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-brand-500`
- Active state: `active:scale-[0.98]`

#### Today Button
**Line 153-165**: "Today" text button
**Status**: GOOD

**Current Classes**:
```tsx
className={cn(
  'hidden sm:inline-flex',
  'text-sm font-medium text-brand-600',
  'hover:text-brand-700',
  'px-3 py-1.5 rounded-lg',
  'hover:bg-brand-50',
  'transition-all duration-200'
)}
```

**Missing**:
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-brand-500`
- Active state: `active:scale-[0.98]`

#### Time Window Toggle Buttons
**Line 172-198**: 2-hour vs Full-day buttons
**Status**: GOOD - active state exists, needs focus

**Current Classes**:
```tsx
className={cn(
  'p-2 rounded-md',
  'transition-all duration-200',
  timeWindowMode === TIME_WINDOW_MODES.TWO_HOUR
    ? 'bg-white text-gray-900 shadow-premium-sm'
    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
)}
```

**Status**: Good! Already has active state styling

#### View Switcher Buttons (Day, Week, Month, Agenda)
**Line 201-254**: Calendar view toggle buttons
**Status**: GOOD - active state exists, needs focus

**Current Classes**:
```tsx
className={cn(
  'px-3 py-1.5 rounded-md',
  'text-sm font-medium',
  'transition-all duration-200',
  calendarView === CALENDAR_VIEWS.DAY
    ? 'bg-white text-gray-900 shadow-premium-sm'
    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
)}
```

**Status**: Good! Already has active state styling

#### Filter Panel Button
**Line 257-261**: Filter dropdown trigger
**Status**: EXCELLENT - uses FilterPanel component

#### Search Button
**Line 264-273**: Search icon button
**Status**: EXCELLENT - uses PremiumIconButton

---

## Related Components

### 8. AppointmentCard.tsx
**Path**: `/src/components/Book/AppointmentCard.tsx`

**Line 94-201**: Main appointment card
**Status**: GOOD - works well but not in calendar context

**Note**: This component is primarily for modals, not main calendar view.

---

### 9. FilterPanel.tsx
**Path**: `/src/components/Book/FilterPanel.tsx`

**Status**: Filter controls - secondary UI
**Current**: Has basic checkbox interactions

---

## Premium Components (Supporting)

### 10. PremiumButton.tsx
**Path**: `/src/components/premium/PremiumButton.tsx`

**Status**: EXCELLENT
**Features**:
- Line 53: Focus ring: `focus:outline-none focus:ring-2 focus:ring-offset-2`
- Line 55: Active state: `active:scale-[0.98]`
- Proper hover states

### 11. PremiumIconButton.tsx
**Path**: `/src/components/premium/PremiumButton.tsx` (lines 175-210)

**Status**: EXCELLENT
**Features**:
- Line 191: Focus ring: `focus:outline-none focus:ring-2 focus:ring-offset-2`
- Line 193: Active state: `active:scale-[0.98]`

### 12. PremiumInput.tsx
**Path**: `/src/components/premium/PremiumInput.tsx`

**Status**: EXCELLENT
**Features**:
- Line 41: Focus ring: `focus:outline-none focus:ring-2 focus:ring-offset-0`
- Proper error state handling

---

## Summary: Quick File Reference

### FILES NEEDING UPDATES

**Critical (Focus Accessibility)**:
- [ ] TimeSlot.tsx (26)
- [ ] DaySchedule.v2.tsx (346-401 for time slots)
- [ ] WeekView.tsx (73-94 for day buttons)
- [ ] MonthView.tsx (191-265 for day cells)
- [ ] MonthView.tsx (216-242 for appointment badges)
- [ ] StaffChip.tsx (26-68, 138-145)
- [ ] StaffSidebar.tsx (88-109)

**High Priority (Active States)**:
- [ ] Same files as above for active state additions

**Medium Priority (Skeletons)**:
- [ ] DaySchedule.v2.tsx (add loading state)
- [ ] StaffSidebar.tsx (add loading state)

**Already Good**:
- [✓] CalendarHeader.tsx (mostly complete)
- [✓] AppointmentCard.tsx in DaySchedule (excellent)
- [✓] PremiumButton.tsx (reference implementation)
- [✓] PremiumInput.tsx (reference implementation)

---

## Implementation Checklist

For each file, add:

```
[ ] focus:outline-none focus:ring-2 focus:ring-offset-2
[ ] focus:ring-[color] (teal-400 or brand-500)
[ ] active:bg-[color] or active:scale-[0.98]
[ ] hover:[enhancement] if not already present
[ ] Test keyboard navigation
[ ] Test screen reader
```

