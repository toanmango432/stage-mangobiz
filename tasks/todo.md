# TicketPanel Dock vs Full Mode Layout Redesign

**Date**: November 30, 2025
**Status**: Planning - Ready for Approval

---

## Problem

Dock mode currently shows a mobile-style flow (ServiceGrid left, Client search + "Add Item/Staff" buttons right). This differs from full mode which shows Service/Staff tabs on left and InteractiveSummary on right.

**Required**: Both modes must have IDENTICAL right-side layouts.

---

## Plan

### Task 1: Add Service/Staff Tabs to Dock Mode Left Side
**Lines**: 2310-2338 in TicketPanel.tsx

Add tab switcher (Services / Staff) to dock mode left column, similar to full mode:
- Show ServiceGrid when Services tab is active
- Show StaffGridView when Staff tab is active
- Keep the "Add to [Staff Name]" or "All Services" header
- Use ~400px width for dock mode left column

**Status**: [ ] Not started

---

### Task 2: Replace Dock Mode Right Side with InteractiveSummary
**Lines**: 2341-2419 in TicketPanel.tsx

Replace current dock mode right side (ClientSelector + ServiceListGrouped + Add Item/Staff buttons) with InteractiveSummary component:
- Remove ClientSelector (InteractiveSummary has it)
- Remove ServiceListGrouped (InteractiveSummary has StaffGroup components)
- Remove "Add Item" / "Add Staff" buttons (only needed on mobile)
- Use the same InteractiveSummary as full mode
- Pass all required props

**Status**: [ ] Not started

---

### Task 3: Remove CheckoutFooter from Dock Mode
**Lines**: 2424-2445 in TicketPanel.tsx

Remove the fixed footer with collapsible discount sections. InteractiveSummary includes:
- Discount sections (inline, not footer)
- Total breakdown
- Checkout button

**Status**: [ ] Not started

---

### Task 4: Update Dock Mode Grid Layout
**Lines**: 2302-2308 in TicketPanel.tsx

Change from `grid-cols-1 lg:grid-cols-[1fr_420px]` to `grid-cols-1 lg:grid-cols-[400px_1fr]`:
- Left: 400px for service/staff tabs
- Right: Flexible width for InteractiveSummary
- Consistent with full mode's right column width (506px)

**Status**: [ ] Not started

---

### Task 5: Adjust Full Mode Grid (if needed)
**Lines**: 2207-2211 in TicketPanel.tsx

Ensure full mode right column width matches dock mode for consistency:
- Currently uses 506px for right column
- May adjust to match or keep as-is for better proportions in full screen

**Status**: [ ] Not started

---

### Task 6: Testing
Test all functionality works in both modes:
- [ ] Dock mode shows Service/Staff tabs on left
- [ ] Full mode shows Service/Staff tabs on left (wider)
- [ ] Both modes show InteractiveSummary on right (identical)
- [ ] No "Add Item/Staff" buttons in dock/full right panel
- [ ] Mobile dialogs still work
- [ ] Client selection, service addition, staff assignment work
- [ ] Discount sections accessible
- [ ] Payment flow works
- [ ] Mode toggle works

**Status**: [ ] Not started

---

## Implementation Details

### Component to Use for Right Side: InteractiveSummary

**InteractiveSummary provides**:
- Client selection (ClientSelector built-in)
- Services list (StaffGroup components with inline editing)
- Discount sections (inline, not collapsible footer)
- Total breakdown (subtotal, tax, total)
- Checkout button
- Bulk actions popup
- Add staff functionality

**This is PERFECT** - it already has everything we need for both modes.

---

## Code Changes Summary

### Dock Mode Layout (Currently)
```jsx
{mode === "dock" && (
  <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px]">
    <div className="left">
      <ServiceGrid />  // Only services, no tabs
    </div>
    <div className="right">
      <ClientSelector />
      <ServiceListGrouped />
      <AddItemButton />
      <AddStaffButton />
    </div>
  </div>
)}
{mode === "dock" && <CheckoutFooter />}
```

### Dock Mode Layout (Target)
```jsx
{mode === "dock" && (
  <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr]">
    <div className="left">
      <TabSwitcher />  // Services / Staff tabs
      {tab === "services" ? <ServiceGrid /> : <StaffGridView />}
    </div>
    <div className="right">
      <InteractiveSummary />  // Same as full mode
    </div>
  </div>
)}
```

---

## Files to Modify

1. `/Users/seannguyen/Winsurf built/Mango POS Offline V2/src/components/checkout/TicketPanel.tsx`
   - Lines 2205-2445 (main layout sections)

---

## Success Criteria

- [x] Plan created
- [ ] Approved by user
- [ ] Implementation complete
- [ ] Testing complete
- [ ] Both modes have identical right-side layout
- [ ] Left side shows tabs in both modes (dock: 400px, full: wider)
- [ ] All existing functionality preserved
- [ ] Code is clean and maintainable

---

## Review Section

### Changes Made:
(To be filled after implementation)

### Issues Encountered:
(To be filled during implementation)

### Additional Notes:
(To be filled as needed)
