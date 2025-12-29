# Phases 4-11 Adjustments Summary

**Date:** December 29, 2025
**Context:** Ticket Control Center (TicketPanel) is the main action hub, not just checkout

---

## Key Architectural Understanding

1. **TicketPanel = Ticket Control Center**
   - Not just for checkout - it's where ALL ticket actions happen
   - Users can: change status, start/pause/complete services, add notes, reassign staff, and checkout

2. **Flexible Workflow**
   - Users don't have to follow: waiting → in-service → pending → checkout
   - They can change status at any time, checkout anytime

3. **Universal Access**
   - Active tickets accessible from: WaitList, Service (In-Service), Pending
   - Clicking any ticket opens the Ticket Control Center

---

## Naming Recommendation

**Current:** `TicketPanel.tsx` (called "Checkout" in UI)

**Recommended Options:**
1. **"Ticket"** - Simple, the panel title shows "Ticket #123"
2. **"Ticket Details"** - More descriptive
3. **"Active Ticket"** - Emphasizes it's live/in-progress

**Suggested UI Text:**
- Panel header: "Ticket #123" (not "Checkout")
- Menu item: "View Ticket" or "Open Ticket"
- Button: "Start Service", "Pause", "Complete", "Checkout"

---

## Phase-by-Phase Adjustments

### Phase 4: Payment Processing
**Status:** ✅ No major changes needed

**Original Plan:**
- Create payment service abstraction
- Integrate into PaymentModal
- Cash payment with change calculator

**Adjustment:**
- Payment is still triggered from Ticket Control Center
- PaymentModal opens from the "Checkout" action button
- No structural changes needed

---

### Phase 5: Tip Distribution UI
**Status:** ✅ No major changes needed

**Original Plan:**
- Pass staff totals to PaymentModal
- Show tip distribution for multi-staff

**Adjustment:**
- Same flow - tip distribution happens during checkout action
- No structural changes needed

---

### Phase 6: Draft Sales UI
**Status:** ⚠️ ADJUSTMENTS NEEDED

**Original Plan:**
- Create DraftsListPanel
- Add "Save for Later" button
- Add resume draft entry point
- Implement auto-save

**Adjustments:**

| Original | New Understanding |
|----------|-------------------|
| "Save for Later" | Should be **"Save & Close"** - save ticket state and close panel |
| Drafts accessible from TicketPanel only | Drafts should also be accessible from **Front Desk header** |
| "Drafts" tab in TicketPanel | Better as **"Recent Tickets"** or **"Saved Tickets"** |

**New Implementation:**

1. **Save & Close Button** (in Ticket Control Center header)
   - Saves current ticket state to IndexedDB/Supabase
   - Ticket remains in its current status (waiting/in-service/pending)
   - Panel closes, ticket visible on Front Desk

2. **Recent Tickets Access**
   - Front Desk should show "Recent Tickets" or unsaved drafts
   - Quick access to tickets that were being worked on
   - Filter by: Today, This Week, Unsaved

3. **Auto-Save (unchanged)**
   - Still auto-save every 30 seconds
   - Show "Saved" indicator

---

### Phase 7: Drag-and-Drop Reordering
**Status:** ✅ No changes needed

**Original Plan:**
- Create useDragReorder hook
- Create DraggableTicketCard wrapper
- Integrate to WaitListSection

**Note:** This is Front Desk only (queue order), doesn't affect Ticket Control Center

---

### Phase 8: Receipt Implementation
**Status:** ⚠️ MINOR ADJUSTMENT

**Original Plan:**
- Improve print receipt
- Email/SMS receipt service

**Adjustment:**
- Receipts should be accessible from **completed ticket view** in Ticket Control Center
- After checkout, show receipt options (not auto-navigate away)
- "View Receipt" action on completed tickets in Front Desk

---

### Phase 9: Auto-Workflows
**Status:** ✅ No changes needed

**Original Plan:**
- Create useFrontDeskWorkflows hook
- Auto no-show cancel
- Pending alerts

**Note:** This is background automation, doesn't affect Ticket Control Center

---

### Phase 10: Staff Reassign
**Status:** ⚠️ ADJUSTMENTS NEEDED

**Original Plan:**
- Add reassign action to in-service tickets (Front Desk cards)
- Update AssignTicketModal for reassign mode

**Adjustments:**

| Original | New Understanding |
|----------|-------------------|
| Reassign from ticket card only | Reassign should PRIMARILY happen in **Ticket Control Center** |
| AssignTicketModal on Front Desk | Quick reassign in Ticket Control Center |

**New Implementation:**

1. **Ticket Control Center Reassign**
   - Each service in the panel shows current staff
   - "Change Staff" button next to each service
   - Opens staff picker (not full modal)
   - Immediate update without closing

2. **Front Desk Card Reassign (secondary)**
   - Quick action in context menu
   - Opens modal for full reassignment
   - For bulk changes

---

### Phase 11: Integration & Polish
**Status:** ⚠️ MINOR ADJUSTMENTS

**Original Plan:**
- Connect workflows to FrontDesk
- Add offline sync status to checkout
- E2E testing

**Adjustments:**

1. **Rename "Checkout" references**
   - Update any UI text that says "Checkout" to "Ticket" or appropriate action
   - File names can stay (TicketPanel.tsx) for backwards compatibility

2. **E2E Test Scenarios (updated)**
   - Open ticket from WaitList → change status → checkout
   - Open ticket from In-Service → pause → resume → checkout
   - Open ticket from Pending → reassign staff → checkout
   - Open ticket → Save & Close → reopen → continue

---

## Summary of Changes Required

### Files to Rename (Optional - Can Keep as Is)
- No file renames needed - internal naming is fine

### UI Text Changes
| Current | New |
|---------|-----|
| "Checkout" panel title | "Ticket #123" |
| "Proceed to Checkout" | "Open Ticket" |
| "Save for Later" | "Save & Close" |

### New Components Needed
| Component | Purpose |
|-----------|---------|
| `RecentTicketsPanel.tsx` | Show recent/saved tickets in Front Desk |
| `StaffQuickPicker.tsx` | Inline staff selection in Ticket Control Center |

### Modified Components
| Component | Changes |
|-----------|---------|
| `TicketPanel.tsx` | Add "Save & Close", inline staff reassign |
| `FrontDesk.tsx` | Add "Recent Tickets" access |
| `ServiceTicketCard.tsx` | Receipt view for completed tickets |

---

## Updated Phase Order (Recommended)

Based on dependencies and the new understanding:

1. **Phase 4: Payment** - Core functionality
2. **Phase 5: Tip Distribution** - Depends on Phase 4
3. **Phase 10: Staff Reassign** - Now part of Ticket Control Center ⬆️ (moved up)
4. **Phase 6: Save & Close / Recent Tickets** - Adjusted scope
5. **Phase 8: Receipts** - After checkout works
6. **Phase 7: Drag-Drop** - Independent, Front Desk only
7. **Phase 9: Auto-Workflows** - Independent, can run in parallel
8. **Phase 11: Integration** - Final polish

---

## Current Todo List Status

Completed (Phases 1-3):
- [x] Phase 1.1: Wire SearchBar to WaitListSection and ServiceSection
- [x] Phase 1.2: Wire FrontDeskSubTabs for category filtering
- [x] Phase 1.3: Add long-wait visual alerts (>10 min)
- [x] Phase 2.1: Persist service status on change
- [x] Phase 2.2: Load persisted status on panel open
- [x] Phase 3: Add note modal and wire to ticket cards

Remaining (Phases 4-11):
- [ ] Phase 4: Payment processing service abstraction
- [ ] Phase 5: Tip distribution UI for multi-staff
- [ ] Phase 10: Staff reassign (moved to Ticket Control Center)
- [ ] Phase 6: Save & Close / Recent Tickets (adjusted scope)
- [ ] Phase 8: Receipt print/email/SMS
- [ ] Phase 7: Drag-and-drop reordering
- [ ] Phase 9: Auto-workflows (no-show, alerts)
- [ ] Phase 11: Integration and E2E testing

---

*Document created: December 29, 2025*
