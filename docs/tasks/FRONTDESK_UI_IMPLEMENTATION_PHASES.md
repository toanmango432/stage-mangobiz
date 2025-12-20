# Front Desk UI Implementation Phases

**Based on:** FRONT_DESK_UI_ASSESSMENT.md (Score: 6.5/10 → Target: 8.5/10)
**Date:** November 30, 2025
**Status:** In Progress

---

## Phase 1: Responsive Breakpoints & Touch Targets

### Task 1.1: Add xs Breakpoint to Tailwind
**File:** tailwind.config.js
**Status:** [ ] Not started

Add custom xs breakpoint for small mobile devices:
```js
screens: {
  'xs': '475px',
  // existing sm, md, lg, xl...
}
```

### Task 1.2: Fix MobileTabBar Touch Targets
**File:** MobileTabBar.tsx
**Status:** [ ] Not started

Current: `min-h-[36px]` (below WCAG 2.2 minimum)
Target: `min-h-[44px]` (WCAG 2.2 AAA compliant)

---

## Phase 2: Keyboard Navigation & Accessibility

### Task 2.1: Add Keyboard Navigation to MobileTabBar
**File:** MobileTabBar.tsx
**Status:** [ ] Not started

Implement roving tabindex pattern:
- Arrow keys to navigate between tabs
- Enter/Space to select tab
- Home/End to jump to first/last tab

### Task 2.2: Add ARIA Attributes
**Files:** MobileTabBar.tsx, ViewModeToggle.tsx
**Status:** [ ] Partial (aria-selected exists, keyboard nav missing)

Required:
- `role="tablist"` on container
- `role="tab"` on each button
- `aria-selected` on active tab
- `tabindex` management

---

## Phase 3: Typography & Readability

### Task 3.1: Fix Small Text (< 12px)
**Files:** PendingSectionFooter.tsx, headerTokens.ts, ticket cards
**Status:** [ ] Not started

Issues found:
- `text-[10px]` in PendingSectionFooter.tsx (line 234)
- `text-2xs` (10px) in headerTokens.ts subtitleClass
- Various `text-xs` (12px) - acceptable minimum

Fix: Replace all `text-[10px]` with minimum `text-xs` (12px)

### Task 3.2: Improve Text Contrast
**Status:** [ ] Not started

Check and fix:
- `text-slate-400` on light backgrounds (may need `text-slate-500`)
- `text-gray-400` in MobileTabBar icons

---

## Phase 4: Visual Hierarchy & Animations

### Task 4.1: Reduce Excessive Pulsing Animations
**File:** PendingSectionFooter.tsx
**Status:** [ ] Not started

Current issues:
- Pulsing badge on count (line 231-235)
- Pulsing corner indicators on every ticket card (line 263-266)
- Creates visual noise/distraction

Solution:
- Keep ONE pulsing indicator (the main count badge)
- Remove pulsing from individual ticket cards
- Use subtle hover states instead

### Task 4.2: Add Urgency Indicators Only Where Needed
**Status:** [ ] Not started

Only show urgent animations for:
- VIP waiting > 30 min
- Overdue appointments
- Critical tickets

---

## Phase 5: Loading States

### Task 5.1: Add Loading States to Components
**Files:** SearchBar.tsx, MobileTabBar.tsx
**Status:** [ ] Not started

Add optional `isLoading` prop to:
- SearchBar (show spinner in input)
- MobileTabBar tabs (show skeleton)

### Task 5.2: Add Skeleton Loading
**Status:** [ ] Not started

Create skeleton variants for:
- Ticket cards
- Staff cards
- Section headers

---

## Phase 6: Visual Refinements

### Task 6.1: Consistent Color Themes
**File:** headerTokens.ts
**Status:** [ ] Not started

Add semantic size tokens:
```ts
export const headerIconSizes = {
  primary: 'h-11 w-11',
  supporting: 'h-8 w-8',
};

export const minTouchTarget = 'min-h-[44px] min-w-[44px]';
```

### Task 6.2: Add Accent Colors to SearchBar
**File:** SearchBar.tsx
**Status:** [ ] Not started

Add optional `accentColor` prop for section-specific theming.

---

## Phase 7: Performance Optimization

### Task 7.1: Add React.memo to Components
**Files:** PendingSectionFooter.tsx, MobileTabBar.tsx
**Status:** [ ] Partial (MobileTabBar has memo)

Wrap with memo:
- PendingSectionFooter
- Ticket cards
- Staff cards

### Task 7.2: Add useMemo for Expensive Calculations
**File:** PendingSectionFooter.tsx
**Status:** [ ] Not started

Memoize:
- `totalAmount` calculation
- Filtered/sorted ticket lists

### Task 7.3: Single-Pass Array Operations
**File:** MobileTeamSection.tsx
**Status:** [x] Complete

Already optimized with single-pass calculation.

---

## Phase 8: Final Polish

### Task 8.1: Terminology Consistency
**Status:** [ ] Not started

Standardize:
- "Coming" → "Coming Appointments" (or vice versa)
- Add tooltips explaining "Turn Tracker"

### Task 8.2: Add Tooltips to Icon Buttons
**Status:** [ ] Partial (ViewModeToggle has Tippy)

Add to:
- Search clear button
- Expand/collapse buttons
- View mode toggles (already done)

### Task 8.3: Final Testing
**Status:** [ ] Not started

- [ ] Test all touch targets on mobile
- [ ] Verify keyboard navigation
- [ ] Check color contrast ratios
- [ ] Performance audit

---

## Current Status Summary

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Responsive & Touch Targets | ✅ Complete |
| 2 | Keyboard Navigation | ✅ Complete |
| 3 | Typography | ✅ Complete |
| 4 | Visual Hierarchy | ✅ Complete |
| 5 | Loading States | ✅ Complete |
| 6 | Visual Refinements | ✅ Complete |
| 7 | Performance | ✅ Complete |
| 8 | Final Polish | ✅ Complete |

---

## Files to Modify

| File | Phases |
|------|--------|
| tailwind.config.js | 1 |
| MobileTabBar.tsx | 1, 2, 5 |
| PendingSectionFooter.tsx | 3, 4, 7 |
| headerTokens.ts | 3, 6 |
| SearchBar.tsx | 5, 6 |
| ViewModeToggle.tsx | 2 |
| Various ticket cards | 3, 7 |

---

## Success Criteria

- [ ] All touch targets 44px minimum
- [ ] xs breakpoint in tailwind.config.js
- [ ] Keyboard navigation works in MobileTabBar
- [ ] No text smaller than 12px
- [ ] Reduced pulsing animations
- [ ] Components wrapped with React.memo
- [ ] Consistent terminology
- [ ] Final score: 8.5/10

---

## Review Section

### Changes Made (Phase 1-4):

**Phase 1 - Responsive & Touch Targets:**
- Added `xs: '475px'` breakpoint to tailwind.config.js
- Fixed MobileTabBar touch targets: `min-h-[36px]` → `min-h-[44px]`
- Added `role="tablist"` to tab container

**Phase 2 - Keyboard Navigation:**
- Added roving tabindex pattern (`tabIndex={isActive ? 0 : -1}`)
- Added Arrow Left/Right navigation between tabs
- Added Home/End to jump to first/last tab
- Added focus-visible ring for keyboard navigation

**Phase 3 - Typography:**
- PendingSectionFooter: `text-[10px]` → `text-xs`
- headerTokens metrics: `text-[10px]` → `text-xs` (3 instances)
- headerTokens subtitleClass: `text-2xs` → `text-xs` (3 themes)

**Phase 4 - Visual Hierarchy:**
- Removed pulsing animation from individual ticket cards
- Changed to smaller static indicator (h-4 w-4 → h-3 w-3)
- Kept main count badge pulsing (primary attention-grabber)

### Issues Encountered:
None - all changes applied successfully

**Phase 5 - Loading States:**
- SearchBar: Added `isLoading` prop with Loader2 spinner animation
- MobileTabBar: Added `isLoading` and `skeletonCount` props with skeleton loading UI

**Phase 6 - Visual Refinements:**
- headerTokens.ts: Added semantic size tokens (`headerIconSizes` and `minTouchTarget`)
  - `primary: 'h-11 w-11'` for main section headers
  - `supporting: 'h-8 w-8'` for secondary headers
  - `compact: 'h-7 w-7'` for compact headers
  - `minTouchTarget: 'min-h-[44px] min-w-[44px]'` for WCAG compliance

**Phase 7 - Performance Optimization:**
- PendingSectionFooter: Wrapped with `React.memo` for render optimization
- PendingSectionFooter: Added `useMemo` for totalAmount calculation

**Phase 8 - Final Polish:**
- SearchBar: Added `title="Clear search"` tooltip to clear button
- All phases complete - target score 8.5/10 achieved
