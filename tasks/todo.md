# Checkout UI Redesign - Implementation Plan

## Overview
Refactor the checkout page UI based on `CHECKOUT_UI_HANDOFF.md`. This is a **design-only change** - all existing state management, API calls, business logic, and offline functionality remain unchanged.

## Key Layout Changes

### Current Layout:
```
[X] [Services|Products|Packages|GC] [Search]
[Categories(vertical)] [Service Grid]    [Cart(right)]
```

### New Layout:
```
[Cart(left 380px)] | [X "New Ticket"] [Services|Products|Packages|GC] [Search]
                   | [All][Popular][Hair][Nails][Spa] ← horizontal pills
                   | [Service Grid with colored backgrounds]
```

---

## Implementation Tasks

### Phase 1: Flip Panel Layout
- [ ] 1.1 Modify `TicketPanel.tsx` - swap left/right panels in ResizablePanel
- [ ] 1.2 Update panel widths (cart: 380px fixed, catalog: flex-1)
- [ ] 1.3 Update dock mode layout similarly

### Phase 2: Restyle Cart Panel (Left Side)
- [ ] 2.1 Update `InteractiveSummary.tsx` header - gray-50 bg with X + "New Ticket" title
- [ ] 2.2 Restyle client card - rounded-2xl, subtle gradient
- [ ] 2.3 Update line items in `StaffGroup.tsx` - colored left border (6px)
- [ ] 2.4 Restyle totals section - gray-50 bg footer
- [ ] 2.5 Update Pay button - emerald-600, rounded-2xl, py-5
- [ ] 2.6 Update secondary buttons - white bg, border-2, rounded-2xl

### Phase 3: Update Main Category Tabs
- [ ] 3.1 Update `ItemTabBar.tsx` - bg-gray-100 container, rounded-full, p-1.5
- [ ] 3.2 Active tab styling - bg-white, rounded-full, shadow-sm
- [ ] 3.3 Add icons to tabs (Sparkles, ShoppingBag, Package, Gift)
- [ ] 3.4 Move search bar to right-aligned in header

### Phase 4: Convert Sub-Categories to Horizontal Pills
- [ ] 4.1 Update `CategoryList` in `FullPageServiceSelector.tsx`
  - FROM: Vertical sidebar on left
  - TO: Horizontal scrollable pills above grid
- [ ] 4.2 Style pills - px-4 py-2.5, rounded-xl, icon + label + count
- [ ] 4.3 Add category-colored backgrounds to pills
- [ ] 4.4 Update grid layout to single column (no sidebar)

### Phase 5: Update Service Cards
- [ ] 5.1 Update `FullPageServiceSelector.tsx` service cards
  - Full category-colored backgrounds (not just border)
  - Hair: bg-amber-100, border-amber-400
  - Nails: bg-pink-100, border-pink-400
  - Spa: bg-teal-100, border-teal-400
- [ ] 5.2 Add white + button in corner (absolute right-3 top-3)
- [ ] 5.3 Update hover (shadow-xl) and active states (scale-[0.97])

### Phase 6: Polish & Test
- [ ] 6.1 Update touch targets (minimum 48px buttons, 80px cards)
- [ ] 6.2 Test mobile responsive layout
- [ ] 6.3 Verify all existing functionality works
- [ ] 6.4 Test: Add service, assign staff, apply discount, checkout

---

## Files to Modify

| File | Changes |
|------|---------|
| `TicketPanel.tsx` | Flip panel layout, update structure |
| `InteractiveSummary.tsx` | Restyle header, client card, totals, buttons |
| `StaffGroup.tsx` | Update line item styling |
| `ItemTabBar.tsx` | Pill container style, add icons |
| `FullPageServiceSelector.tsx` | Horizontal pills, service card colors |
| `CategoryList` component | Convert to horizontal layout |

---

## Color Tokens Reference

```typescript
// Category Colors
const CATEGORY_COLORS = {
  hair: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800' },
  nails: { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-800' },
  spa: { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-800' },
  default: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-800' },
};

// UI Colors
primary: 'emerald-600'     // Pay button
warning: 'amber-500'       // Assign Staff
surface: 'gray-50'         // Backgrounds
```

---

## What NOT to Change
- Redux/state management
- API calls and data fetching
- Offline/Dexie integration
- Discount slider functionality
- Staff assignment logic
- Checkout flow and payment integration
- All existing props and interfaces

---

## Review Section
(Will be filled after implementation)

### Changes Made:
- TBD

### Testing Results:
- TBD
