# Pending Tickets - View Modes Implementation

## Objective
Add list view and compact card options to Pending tickets, matching the In-Service implementation exactly.

## Implementation Summary

Added complete view mode support to Pending tickets with 4 view modes:
- **Compact List View** - Minimal single-line tickets
- **Normal List View** - Full paper design with horizontal layout
- **Grid Compact View** - Smaller grid cards
- **Grid Normal View** - Full premium grid cards (existing implementation)

## Files Modified

### 1. PendingTicketCard.tsx (Complete Rewrite - 615 lines)

**Changes**:
- Added `viewMode` prop: `'compact' | 'normal' | 'grid-normal' | 'grid-compact'`
- Implemented all 4 view modes with exact ServiceTicketCard styling
- Added payment badge display for all view modes
- Added total calculation and monospace formatting

**View Modes Implemented**:

#### Compact List View (Lines 113-192)
```typescript
if (viewMode === 'compact') {
  return (
    <div className="relative rounded border border-[#d4b896]/40 overflow-visible">
      {/* 8 perforation dots */}
      {/* Compact number badge */}
      {/* Client name + Service in one row */}
      {/* Total + Payment badge + Mark Paid button */}
    </div>
  );
}
```

**Features**:
- Minimal perforation (8 dots, 1px)
- Compact badge (w-6 h-5)
- Single-row layout
- Right-aligned total + payment badge

#### Normal List View (Lines 197-313)
```typescript
if (viewMode === 'normal') {
  return (
    <div className="relative rounded-lg border border-[#d4b896]/40">
      {/* 15 perforation dots */}
      {/* Left & right notches */}
      {/* 3-layer edge shadows */}
      {/* Wrap-around number badge */}
      {/* 2-row layout: Client+Total, Service+Payment */}
    </div>
  );
}
```

**Features**:
- Full paper design (notches, shadows, textures)
- 2-row layout
- Gradient footer container for payment
- Last visit date display

#### Grid Compact View (Lines 318-423)
```typescript
if (viewMode === 'grid-compact') {
  return (
    <div className="relative rounded-md sm:rounded-lg flex flex-col min-w-[240px]">
      {/* 15 perforation dots */}
      {/* Amber border with glow animation */}
      {/* Smaller notches and badge */}
      {/* Compact content layout */}
    </div>
  );
}
```

**Features**:
- Amber border with glow animation
- Smaller dimensions (240px min)
- Simplified badge (w-8 sm:w-9)
- Payment badge + total in row

#### Grid Normal View (Lines 428-615) - Enhanced
```typescript
// DEFAULT VIEW
return (
  <div className="relative rounded-xl overflow-visible flex flex-col min-w-[280px]">
    {/* 20 perforation dots (3px, opacity 0.25) */}
    {/* 3-layer edge shadows */}
    {/* 6-layer wrap-around badge */}
    {/* Full component structure with UnpaidWatermark */}
    {/* ClientInfo, PriceBreakdown, PaymentFooter components */}
  </div>
);
```

**Features**:
- Exact ServiceTicketCard grid-normal styling
- Full premium design (6-layer shadows, textures)
- Uses existing sub-components
- Amber glow animation

### 2. PendingTickets.tsx (Major Update)

**Added Imports**:
```typescript
import { useTicketSection } from '../hooks/frontdesk';
import { MoreVertical, List, Grid, Check, ChevronDown, ChevronRight } from 'lucide-react';
```

**Added Props** (Lines 9-19):
```typescript
interface PendingTicketsProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  viewMode?: 'grid' | 'list';
  setViewMode?: (mode: 'grid' | 'list') => void;
  cardViewMode?: 'normal' | 'compact';
  setCardViewMode?: (mode: 'normal' | 'compact') => void;
  minimizedLineView?: boolean;
  setMinimizedLineView?: (minimized: boolean) => void;
  isCombinedView?: boolean;
}
```

**Added State Management** (Lines 37-59):
```typescript
const {
  viewMode,
  setViewMode,
  toggleViewMode,
  cardViewMode,
  setCardViewMode,
  toggleCardViewMode,
  minimizedLineView,
  setMinimizedLineView,
  toggleMinimizedLineView
} = useTicketSection({
  sectionKey: 'pending',
  defaultViewMode: 'grid',
  defaultCardViewMode: 'normal',
  isCombinedView,
  externalViewMode,
  externalSetViewMode,
  externalCardViewMode,
  externalSetCardViewMode,
  externalMinimizedLineView,
  externalSetMinimizedLineView,
});
```

**Added View Mode Switcher** (Lines 147-226):
```typescript
{/* View mode toggle buttons */}
{viewMode === 'list' && (
  <button onClick={toggleMinimizedLineView}>
    {minimizedLineView ? <ChevronDown /> : <ChevronUp />}
  </button>
)}
{viewMode === 'grid' && (
  <button onClick={toggleCardViewMode}>
    {cardViewMode === 'compact' ? <ChevronDown /> : <ChevronUp />}
  </button>
)}

{/* Dropdown menu */}
<div className="relative" ref={dropdownRef}>
  <button onClick={() => setShowDropdown(!showDropdown)}>
    <MoreVertical size={16} />
  </button>
  {showDropdown && (
    <div className="absolute right-0 mt-1 w-52 bg-white">
      <button onClick={() => setViewMode('list')}>
        <List size={14} /> Line View
      </button>
      <button onClick={() => setViewMode('grid')}>
        <Grid size={14} /> Grid View
      </button>
    </div>
  )}
</div>
```

**Updated Content Area** (Lines 265-315):
```typescript
{filteredTickets.length > 0 ? (
  viewMode === 'grid' ? (
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: cardViewMode === 'compact'
          ? 'repeat(auto-fill, minmax(240px, 1fr))'
          : 'repeat(auto-fill, minmax(300px, 1fr))',
      }}
    >
      {filteredTickets.map((ticket) => (
        <PendingTicketCard
          viewMode={cardViewMode === 'compact' ? 'grid-compact' : 'grid-normal'}
          {...props}
        />
      ))}
    </div>
  ) : (
    <div className="space-y-2">
      {filteredTickets.map((ticket) => (
        <PendingTicketCard
          viewMode={minimizedLineView ? 'compact' : 'normal'}
          {...props}
        />
      ))}
    </div>
  )
) : (
  // Empty state...
)}
```

**Enhanced Click Outside Handler** (Lines 78-96):
```typescript
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Close ticket dropdowns
    if (!target.closest('[role="menu"]') && !target.closest('button[aria-haspopup="true"]')) {
      setOpenDropdownId(null);
    }

    // Close view mode dropdown
    if (dropdownRef.current && !dropdownRef.current.contains(target)) {
      setShowDropdown(false);
    }
  }
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

## View Mode Mapping

| User Selection | Internal State | PendingTicketCard viewMode |
|---------------|----------------|----------------------------|
| Grid View + Normal | `viewMode='grid'` + `cardViewMode='normal'` | `'grid-normal'` |
| Grid View + Compact | `viewMode='grid'` + `cardViewMode='compact'` | `'grid-compact'` |
| Line View + Normal | `viewMode='list'` + `minimizedLineView=false` | `'normal'` |
| Line View + Compact | `viewMode='list'` + `minimizedLineView=true` | `'compact'` |

## UI Controls

### Header Buttons:

1. **Toggle Button** (Conditional):
   - **Grid Mode**: Shows ChevronUp/ChevronDown - toggles between normal/compact cards
   - **List Mode**: Shows ChevronUp/ChevronDown - toggles between normal/compact rows

2. **Dropdown Menu** (MoreVertical icon):
   - "Line View" option with List icon
   - "Grid View" option with Grid icon
   - Checkmark shows current selection

3. **Collapse Button**: Minimizes the entire section

## Benefits

1. ✅ **Feature Parity** - Matches In-Service view options exactly
2. ✅ **Consistent UX** - Same controls and behavior across modules
3. ✅ **Flexible Display** - 4 view modes for different screen sizes and preferences
4. ✅ **State Persistence** - View preferences saved via useTicketSection hook
5. ✅ **Responsive Design** - All views adapt to mobile/tablet/desktop
6. ✅ **Amber Identity** - Pending tickets maintain distinctive amber border across all views

## Design Consistency

All 4 view modes maintain the pending ticket identity:
- **Amber border** (#F59E0B) with glow animation (grid views)
- **Paper textures** in all views
- **UNPAID watermark** where space permits
- **Payment badge** displayed in all layouts
- **Total amount** prominently shown

## Technical Details

### Payment Badge Colors:
```typescript
const getPaymentBadge = () => {
  const badges = {
    card: { bg: '#E0E7FF', color: '#4338CA', text: 'CARD' },
    cash: { bg: '#D1FAE5', color: '#059669', text: 'CASH' },
    venmo: { bg: '#E0F2FE', color: '#0284C7', text: 'VENMO' },
  };
  return badges[ticket.paymentType] || badges.card;
};
```

### Grid Column Widths:
- **Compact**: `repeat(auto-fill, minmax(240px, 1fr))`
- **Normal**: `repeat(auto-fill, minmax(300px, 1fr))`

### Perforation Counts:
- **Compact**: 8 dots (1px × 1px)
- **Normal/Grid-Compact**: 15 dots (2px × 2px)
- **Grid-Normal**: 20 dots (3px × 3px)

## Testing Checklist

### View Switching:
- [ ] Click dropdown → Select "Line View" → Tickets display as rows
- [ ] Click dropdown → Select "Grid View" → Tickets display as cards
- [ ] In Grid mode → Click toggle button → Cards switch compact/normal
- [ ] In List mode → Click toggle button → Rows switch compact/normal
- [ ] Refresh page → View mode persists (localStorage)

### Visual Consistency:
- [ ] Compact list: Single row, total on right, payment badge
- [ ] Normal list: 2 rows, last visit date, gradient footer
- [ ] Grid compact: Smaller cards, amber border, simplified layout
- [ ] Grid normal: Full premium design, 6-layer shadows, all sub-components

### Responsive Behavior:
- [ ] Mobile (320px): All views render correctly
- [ ] Tablet (768px): Grid adjusts column count
- [ ] Desktop (1024px+): Multiple columns in grid

### Interactions:
- [ ] Click outside dropdown → Menu closes
- [ ] Toggle button tooltip shows correct text
- [ ] Mark Paid button works in all views
- [ ] Hover effects work in all views

## Build Status

```bash
✓ built in 6.89s
```

No TypeScript errors or warnings.

## Files Summary

### Created/Modified:
```
src/components/tickets/PendingTicketCard.tsx
  - Complete rewrite with 4 view modes
  - 615 lines total
  - Matches ServiceTicketCard implementation

src/components/PendingTickets.tsx
  - Added useTicketSection hook integration
  - Added view mode switcher UI
  - Updated content area for grid/list rendering
  - Enhanced click handlers
```

## Related Documentation

- [PENDING_EXACT_DESIGN_MATCH.md](./PENDING_EXACT_DESIGN_MATCH.md) - Grid-normal view implementation
- [BORDER_FIX.md](./BORDER_FIX.md) - Amber border fix
- ServiceTicketCard.tsx:136-421 - Source view mode implementations
- ServiceSection.tsx:844-1029 - View mode switcher pattern

---

**Date**: 2025-01-19
**Status**: ✅ COMPLETED
**Impact**: HIGH - Adds full view mode flexibility to Pending module
**User Benefit**: Matching UX with In-Service, 4 view options for different workflows
