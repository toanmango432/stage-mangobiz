# Book Module Interactive States - Quick Reference

## Component Status Overview

### Critical Issues (Must Fix)

**TimeSlot.tsx**
```
HOVER:    [ ] Missing - needs hover:bg-teal-50
ACTIVE:   [ ] Missing - needs active:bg-teal-200
FOCUS:    [ ] Missing - needs focus:ring-2 focus:ring-teal-400
```

**WeekView.tsx Day Buttons**
```
HOVER:    [✓] Has hover:bg-gray-50
ACTIVE:   [ ] Missing - needs active:bg-teal-100
FOCUS:    [ ] Missing - needs focus:ring-2 focus:ring-teal-400
```

**MonthView.tsx Day Cells**
```
HOVER:    [✓] Has hover:bg-gray-50
ACTIVE:   [ ] Missing - needs active:bg-teal-100
FOCUS:    [ ] Missing - needs focus:ring-2 focus:ring-teal-400
```

**StaffChip.tsx**
```
HOVER:    [✓] Has hover:shadow-premium-md hover:-translate-y-0.5
ACTIVE:   [ ] Missing - needs active:scale-95
FOCUS:    [ ] Missing - needs focus:ring-2 focus:ring-brand-500
```

---

## Code Examples for Quick Implementation

### Add Focus Ring (Keyboard Accessibility)
```tsx
// Add to button/interactive element className:
'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400'

// For tight layouts (no offset needed):
'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-teal-400'
```

### Add Hover State
```tsx
// Subtle hover:
'hover:bg-teal-50 hover:shadow-sm'

// More prominent hover:
'hover:shadow-md hover:-translate-y-0.5 hover:border-teal-300'

// For clickable cells:
'hover:bg-teal-50/50 hover:shadow-sm hover:border-teal-300'
```

### Add Active/Press State
```tsx
// Subtle press feedback:
'active:scale-[0.98]'

// More pronounced:
'active:scale-95 active:shadow-inset'

// For buttons:
'active:bg-teal-200 active:scale-[0.98]'
```

---

## Component Priority List

### Phase 1: Accessibility (Week 1)
- [ ] TimeSlot.tsx - Add focus ring
- [ ] WeekView.tsx - Add focus ring to day buttons
- [ ] MonthView.tsx - Add focus ring to day cells
- [ ] MonthView.tsx - Add focus ring to appointment badges
- [ ] StaffChip.tsx - Add focus ring

### Phase 2: Visual Polish (Week 2)
- [ ] TimeSlot.tsx - Add active state
- [ ] WeekView.tsx - Add active state
- [ ] MonthView.tsx - Add active state
- [ ] StaffChip.tsx - Add active state
- [ ] DaySchedule.v2.tsx - Enhance appointment feedback

### Phase 3: User Experience (Week 3)
- [ ] DaySchedule.v2.tsx - Add loading skeletons
- [ ] StaffSidebar.tsx - Add loading skeletons
- [ ] Create skeleton components library

---

## File Locations Reference

```
CRITICAL FOCUS ISSUES:
├── src/components/Book/TimeSlot.tsx              [HIGH PRIORITY]
├── src/components/Book/WeekView.tsx              [HIGH PRIORITY]
├── src/components/Book/MonthView.tsx             [HIGH PRIORITY]
└── src/components/Book/StaffChip.tsx             [HIGH PRIORITY]

LOADING SKELETON ISSUES:
├── src/components/Book/DaySchedule.v2.tsx        [MEDIUM PRIORITY]
└── src/components/Book/StaffSidebar.tsx          [MEDIUM PRIORITY]

WELL IMPLEMENTED:
├── src/components/Book/AppointmentCard.tsx       [✓ GOOD]
├── src/components/Book/CalendarHeader.tsx        [✓ GOOD]
└── src/components/premium/PremiumButton.tsx      [✓ EXCELLENT]
```

---

## Testing Checklist

After implementing changes, test:

### Keyboard Navigation
- [ ] Tab key navigates all interactive elements
- [ ] Shift+Tab goes backward
- [ ] Focus ring visible on all elements
- [ ] Focus order is logical (top-left to bottom-right)
- [ ] Enter/Space activates buttons correctly

### Mouse Interaction
- [ ] Hover states are visible
- [ ] Cursor changes appropriately (pointer for buttons, cell for time slots)
- [ ] Click/active states show feedback
- [ ] Drag states maintain visibility

### Accessibility
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators not removed (outline must be replaced with ring)
- [ ] Loading states announce to screen readers
- [ ] Alt text available where needed

### Visual Consistency
- [ ] Hover effects use same pattern across component
- [ ] Active states consistent with design system
- [ ] Focus rings use brand colors
- [ ] Animations use duration-200 or duration-100

---

## Quick Copy-Paste Classes

### For Interactive Calendar Cells
```tsx
className={cn(
  'relative p-2 min-h-[80px] text-left border-r border-gray-200 last:border-r-0',
  'hover:bg-gray-50 hover:shadow-sm transition-all duration-200',
  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400',
  'active:bg-teal-100 active:scale-[0.98]',
  !isCurrentMonthDay && 'text-gray-300 bg-gray-50',
  isTodayDay && 'bg-teal-50 border-teal-200'
)}
```

### For Interactive Buttons in Sidebar
```tsx
className={cn(
  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200',
  'hover:shadow-premium-md hover:-translate-y-0.5',
  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500',
  'active:scale-95',
  isSelected
    ? 'bg-brand-50 border-brand-300 shadow-premium-sm'
    : 'bg-white border-gray-200 hover:border-brand-200'
)}
```

### For Time Slot Buttons
```tsx
className={cn(
  'absolute w-full transition-all duration-200 cursor-pointer',
  'hover:bg-teal-100/50 hover:shadow-sm',
  'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-teal-400',
  'active:bg-teal-200 active:scale-[0.98]',
  isDropTarget 
    ? 'bg-teal-100 border-2 border-dashed border-teal-400'
    : ''
)}
```

---

## Common Tailwind Classes Needed

```
Focus States:
- focus:outline-none
- focus:ring-2
- focus:ring-offset-2
- focus:ring-teal-400
- focus:ring-brand-500

Hover States:
- hover:bg-teal-50
- hover:bg-gray-50
- hover:shadow-sm
- hover:shadow-md
- hover:-translate-y-0.5
- hover:border-teal-300

Active States:
- active:scale-95
- active:scale-[0.98]
- active:bg-teal-200
- active:bg-teal-100
- active:shadow-inset

Transitions:
- transition-all duration-200
- transition-colors duration-150
- transition-shadow duration-200
```

---

## Design System Alignment

### Color Tokens
- **Primary Interactive**: `teal-*` or `brand-*`
- **Success/Positive**: `green-*`
- **Danger/Destructive**: `red-*`
- **Neutral**: `gray-*`

### Shadow Tokens
- **Subtle Elevation**: `shadow-sm`
- **Medium Elevation**: `shadow-md` or `shadow-premium-md`
- **Strong Elevation**: `shadow-lg` or `shadow-premium-lg`

### Duration Standards
- **Snappy Feedback**: `duration-100`
- **Standard Transition**: `duration-200`
- **Smooth Animation**: `duration-300`

### Animation References
- `staggerDelayStyle` - For staggered animations
- `animate-fade-in` - For entry animations
- `animate-pulse-slow` - For loading states
- `animate-pulse` - For skeleton loading

---

## Notes

- All changes should be backward compatible
- Test on both desktop and touch devices
- Ensure no performance degradation with animations
- Maintain accessibility standards throughout
- Use existing design system tokens, don't create new ones

