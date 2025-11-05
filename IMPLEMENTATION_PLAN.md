# ServiceTicketCard Complete Rebuild - Implementation Plan

## Status: READY TO IMPLEMENT

## Overview
Merge the reference InServiceCard design (4 layouts) with our current ServiceTicketCard business logic.

---

## Phase 1: Create New Component Structure ✅

**File:** Create `ServiceTicketCard_V2.tsx` alongside current file

**Changes:**
1. Import CheckCircle from lucide-react (add to existing imports)
2. Keep all existing interfaces and props
3. Add progress color system function
4. Add staff gradient colors mapping
5. Convert viewMode → layout/size internally

---

## Phase 2: Implement List View (Normal + Compact)

Maps to: `viewMode='normal'` and `viewMode='compact'`

**Layout Features:**
- Horizontal 2-row design
- Perforation dots (30 for list)
- Left/Right notches
- Wrap-around ticket badge
- Paper thickness edge
- Progress bar inline with time
- Staff section with gradient badges
- Circular done button

**Business Logic to Preserve:**
- onClick handler
- onComplete handler  
- showMenu/showDetailsModal states
- All Tippy tooltip menus
- TicketDetailsModal integration

---

## Phase 3: Implement Grid Compact View

Maps to: `viewMode='grid-compact'`

**Layout Features:**
- Vertical card, 240px min width
- Perforation dots (20 for grid)
- Smaller ticket badge
- Compact spacing
- Hidden "First Visit" label (check clientType)
- Progress bar below service

**Business Logic to Preserve:**
- Same as Phase 2

---

## Phase 4: Implement Grid Normal View  

Maps to: `viewMode='grid-normal'`

**Layout Features:**
- Vertical card, 280px min width
- Enhanced thickness edge (double layer)
- Larger ticket badge
- Comfortable spacing
- Shows "First Visit" label
- Progress bar with large percentage

**Business Logic to Preserve:**
- Same as Phase 2

---

## Phase 5: Add Paper Texture Layers (All Views)

**Common Elements:**
- Paper fibers texture overlay (opacity 20-25%)
- Grain pattern overlay (opacity 10-15%)
- Edge highlight overlay

---

## Phase 6: Testing & Verification

**Test Matrix:**

| viewMode | Maps To | Test |
|----------|---------|------|
| compact | list + compact | ✓ All features |
| normal | list + normal | ✓ All features |
| grid-compact | grid + compact | ✓ All features |
| grid-normal | grid + normal | ✓ All features |

**Features to Test:**
- [ ] onClick opens details
- [ ] onComplete works
- [ ] More menu (pause/delete/details)
- [ ] Progress tracking updates
- [ ] Staff badges show gradients
- [ ] Time calculations correct
- [ ] Responsive at all breakpoints
- [ ] Hover effects work
- [ ] Paper textures load

---

## Phase 7: Update Parent Components

**Files that use ServiceTicketCard:**

Find with: `grep -r "ServiceTicketCard" src --include="*.tsx" --include="*.ts"`

**For each file:**
1. Verify viewMode prop values
2. Test that card renders correctly
3. Verify interactions work

---

## Data Mapping

### Current → Reference

```typescript
// Current ticket data
{
  id: string,
  number: number,
  clientName: string,
  clientType: string, // 'New', 'VIP', 'Priority', 'Regular'
  service: string,
  duration: string,
  notes?: string,
  assignedStaff: Array<{ name, color }>
}

// Maps to reference card
{
  ticketNumber: number,
  customerName: string,
  isFirstVisit: boolean, // clientType === 'New'
  hasStar: boolean, // clientType === 'VIP'
  hasNote: boolean, // !!notes
  serviceName: string,
  timeLeft: string, // formatted
  percentage: number, // calculated
  staff: Array<{ name: uppercase, color }>
}
```

---

## Key Styling Constants

```typescript
// Paper background
background: 'linear-gradient(145deg, #FFFCF7 0%, #FFFBF5 40%, #FFF9F0 100%)'

// Border
border: 'border-[#d4b896]/40'

// Staff gradients
const staffColors = {
  'SOPHIA': 'linear-gradient(to right, #FF6B70, #E04146)',
  'MADISON': 'linear-gradient(to right, #AF6FFF, #8A4AD0)',
  // ... etc
}

// Progress colors
Purple (1-79%): linear-gradient(to right, #9B7EAE, #7E5F93)
Green (80-100%): linear-gradient(to right, #5CB85C, #449D44)
Red (>100%): linear-gradient(to right, #D9534F, #C9302C)
```

---

## Responsive Breakpoints

```css
min-w-[240px] /* Compact grid */
min-w-[260px] /* Compact list */
min-w-[280px] /* Normal */

sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

---

## Next Steps

1. ✅ Backup original file (DONE: ServiceTicketCard_ORIGINAL.tsx)
2. ⏳ Create merged component incrementally
3. ⏳ Test each view mode
4. ⏳ Update parent components
5. ⏳ Create migration guide

---

## Files Created

- ✅ `ServiceTicketCard_ORIGINAL.tsx` - Original backup
- ⏳ `ServiceTicketCard.tsx` - New merged version
- ✅ `IMPLEMENTATION_PLAN.md` - This file
- ✅ `IN_SERVICE_TICKET_ENHANCEMENTS.md` - Design documentation

---

## Estimated Time

- Phase 1-2: 15 min
- Phase 3-4: 15 min  
- Phase 5: 5 min
- Phase 6-7: 10 min

**Total: ~45 minutes**

---

**Ready to proceed with implementation in phases?**
