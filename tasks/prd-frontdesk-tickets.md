# PRD: Front Desk Tickets Module - Complete Workflow

## Introduction

Complete the Front Desk tickets module with full workflow functionality. This includes fixing data consistency issues, connecting existing UI to Redux, implementing ticket creation flow, search/filtering, urgency indicators, staff conflict detection, enhanced notes, and ticket history tracking.

## Goals

- Display assigned technician consistently across all ticket cards
- Make all ticket modals functional with Redux persistence
- Enable quick ticket creation from Front Desk
- Implement search and filtering for tickets
- Apply urgency visual indicators to waitlist tickets
- Detect and warn about staff assignment conflicts
- Enhance ticket notes with timestamps and edit capability
- Track ticket status history for audit purposes
- Implement bidirectional status transitions
- Add daily-resetting check-in numbers for call-outs
- Implement soft delete with categorized reasons

## User Stories

---

### US-001: Display technician on WaitListTicketCard
**Description:** As a front desk staff, I want to see the assigned technician on waiting tickets so I know who will serve the client.

**Files to modify:**
- `apps/store-app/src/components/tickets/WaitListTicketCard.tsx` (~40 lines)

**Acceptance Criteria:**
- [ ] Add technician props to interface: `technician?: string`, `techColor?: string`, `techId?: string`, `assignedTo?`, `assignedStaff?`
- [ ] Display technician avatar (colored circle with initials) if assigned
- [ ] Display technician name beside avatar
- [ ] Handle both single technician (`assignedTo`) and multiple (`assignedStaff`)
- [ ] Show empty state if no technician assigned
- [ ] Styling matches ServiceTicketCard's technician display
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Reference `ServiceTicketCard.tsx` lines 32-46 for prop interface pattern
- Use Tailwind: `rounded-full`, `bg-{color}`, `text-white`, `text-xs`
- WaitListTicketCard is 873 lines - add to existing structure, don't refactor

**Priority:** 1

---

### US-002: Display technician on PendingTicketCard
**Description:** As a front desk staff, I want to see which technician completed the service on pending (checkout) tickets.

**Files to modify:**
- `apps/store-app/src/components/tickets/PendingTicketCard.tsx` (~25 lines)

**Acceptance Criteria:**
- [ ] Interface already has technician props at lines ~31-51 - add rendering JSX only
- [ ] Display technician avatar and name in card header area
- [ ] Follow same pattern as WaitListTicketCard from US-001
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Interface already defined - this story only adds rendering JSX
- Add to existing card layout in header section near client name

**Priority:** 2

---

### US-003: Create updateTicket thunk and make EditTicketModal functional
**Description:** As a front desk staff, I want my edits in the Edit Ticket modal to actually save and persist.

**Files to modify:**
- `apps/store-app/src/store/slices/uiTicketsSlice.ts` (~50 lines)
- `apps/store-app/src/components/tickets/EditTicketModal.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Create `updateTicket` async thunk accepting `{ ticketId: string, updates: Partial<UITicket> }`
- [ ] Thunk updates ticket via `dataService.tickets.update()` with IndexedDB fallback
- [ ] Add reducer case in extraReducers to update `tickets`, `waitlist`, `inService`, `checkoutTickets`
- [ ] In EditTicketModal: import `updateTicket` and `useAppDispatch`
- [ ] Replace console.log at lines ~82-91 with `dispatch(updateTicket(...))`
- [ ] Use existing `isSubmitting` state for loading indicator
- [ ] Close modal only after successful save
- [ ] Handle errors with try/catch and `unwrap()`
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: edit ticket -> save -> card reflects changes

**Notes:**
- Follow `assignTicket` thunk pattern at lines ~431-498 in uiTicketsSlice
- Current handleSubmit only logs and closes - replace entirely
- Export the new thunk from the slice

**Priority:** 3

---

### US-004: Connect TicketActions.handleAssign to Redux
**Description:** As a front desk staff, I want assigning a technician from ticket actions to actually work.

**Files to modify:**
- `apps/store-app/src/components/tickets/TicketActions.tsx` (~25 lines)

**Acceptance Criteria:**
- [ ] Import `assignTicket` from `@/store/slices/uiTicketsSlice`
- [ ] Import `useAppDispatch` from `@/store/hooks`
- [ ] In `handleAssign` (line ~35-38), replace console.log with dispatch call
- [ ] Pass: `{ ticketId: String(ticketId), staffId: techId, staffName: techName, staffColor: techColor }`
- [ ] Add loading state during dispatch
- [ ] Close modal after successful assignment
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: assign tech -> card updates immediately

**Notes:**
- `assignTicket` thunk already exists in uiTicketsSlice - just connect it
- Convert ticketId to string if it's a number
- TicketActions is only 60 lines - simple file

**Priority:** 4

---

### US-005: Implement bidirectional status transitions
**Description:** As a front desk staff, I want to move tickets between statuses (waiting <-> in-service <-> pending) when needed.

**Files to modify:**
- `apps/store-app/src/store/slices/uiTicketsSlice.ts` (~80 lines)
- `apps/store-app/src/components/tickets/TicketActions.tsx` (~60 lines)

**Acceptance Criteria:**
- [ ] Create `moveToWaiting` thunk: sets status to 'waiting', clears `serviceStartTime`
- [ ] Create `moveToInService` thunk: sets status to 'in-service', sets `serviceStartTime` to now
- [ ] Create `moveToPending` thunk: sets status to 'completed', sets `completedAt` to now
- [ ] Each thunk updates via dataService with IndexedDB fallback and sync queue
- [ ] Add reducer cases for all three thunks
- [ ] Export all three thunks
- [ ] In TicketActions: Waiting tickets get 'Start Service' -> `moveToInService`
- [ ] In TicketActions: In-service tickets get 'Move to Waiting' and 'Complete Service'
- [ ] In TicketActions: Support 'pending' section with 'Back to Service'
- [ ] Show confirmation dialog (AlertDialog) before status change
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: move ticket waiting -> service -> pending -> back to service

**Notes:**
- Status values: 'waiting' | 'in-service' | 'completed' | 'paid'. 'completed' = pending checkout
- Reference `pauseTicket`/`resumeTicket` for thunk pattern
- Use AlertDialog from `@/components/ui/alert-dialog`

**Priority:** 5

---

### US-006: Implement daily-resetting check-in numbers
**Description:** As a front desk staff, I want check-in numbers to reset to 1 each day for easy call-outs.

**Files to modify:**
- `apps/store-app/src/store/slices/uiTicketsSlice.ts` (~40 lines)
- `apps/store-app/src/components/tickets/WaitListTicketCard.tsx` (~15 lines)
- `apps/store-app/src/components/tickets/ServiceTicketCard.tsx` (~15 lines)

**Acceptance Criteria:**
- [ ] Add to uiTicketsSlice state: `lastCheckInDate: string | null`, `lastCheckInNumber: number`
- [ ] Add `checkInNumber?: number` to UITicket interface if not present
- [ ] Modify `checkInAppointment` thunk: get today's date as ISO string (YYYY-MM-DD)
- [ ] If `lastCheckInDate !== today`: reset to 1, update date
- [ ] Else: increment `lastCheckInNumber`
- [ ] Store `checkInNumber` on ticket (separate from `ticket.number`)
- [ ] In WaitListTicketCard: display `checkInNumber` with '#' prefix prominently
- [ ] In ServiceTicketCard: display `checkInNumber` similarly
- [ ] `ticket.number` remains permanent ID (for receipts)
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify: check-in first client -> #1, second -> #2, next day -> resets to #1

**Notes:**
- Current bug: uses `lastTicketNumber` which doesn't reset daily
- Check-in number for vocal call-outs: 'Number 5, you're up!'
- Ticket ID is permanent record number for receipts

**Priority:** 6

---

### US-007: Implement soft delete with categorized reasons
**Description:** As a manager, I want deleted tickets to have categorized reasons for accurate reporting.

**Files to modify:**
- `apps/store-app/src/types/ticket.ts` (~10 lines)
- `apps/store-app/src/store/slices/uiTicketsSlice.ts` (~40 lines)
- `apps/store-app/src/components/tickets/DeleteTicketModal.tsx` (NEW, ~120 lines)
- `apps/store-app/src/components/tickets/TicketActions.tsx` (~20 lines)

**Acceptance Criteria:**
- [ ] Create `DeleteReason` type: 'testing' | 'client_left' | 'duplicate' | 'mistake' | 'other'
- [ ] Add to UITicket: `deletedAt?: string`, `deletedReason?: DeleteReason`, `deletedNote?: string`
- [ ] Modify `deleteTicket` thunk to soft delete (set fields, don't remove)
- [ ] Create DeleteTicketModal.tsx with radio buttons for reasons
- [ ] Include optional text field for notes
- [ ] 'Testing' shows helper: 'Will not be counted as client loss'
- [ ] Delete dispatches `deleteTicket({ ticketId, reason, note })`
- [ ] In TicketActions: add 'Delete Ticket' with red/destructive styling
- [ ] After delete, ticket filtered from view (by `deletedAt`)
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: delete with 'Testing' reason -> ticket disappears

**Notes:**
- Follow EditTicketModal.tsx pattern for modal structure
- Use RadioGroup from `@/components/ui/radio-group`
- Soft delete = mark as deleted, keep in DB for reporting

**Priority:** 7

---

### US-008: Add manager PIN verification for sensitive actions
**Description:** As an owner, I want certain actions (like status reversal) to optionally require manager PIN.

**Files to modify:**
- `apps/store-app/src/components/common/ManagerPinModal.tsx` (NEW, ~100 lines)
- `apps/store-app/src/components/tickets/TicketActions.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Create ManagerPinModal.tsx with 4-digit PIN input (masked with dots)
- [ ] For development: accept PIN '1234' as valid
- [ ] Error state for invalid PIN with shake animation
- [ ] Max 3 attempts, then show 'Contact manager' message
- [ ] `onSuccess` callback with manager ID (hardcode 'manager-1' for dev)
- [ ] `onCancel` callback
- [ ] Add setting check: `requirePinForStatusReversal` (default: false)
- [ ] If enabled: show ManagerPinModal before status reversal
- [ ] Only proceed after PIN verified
- [ ] If disabled: proceed without PIN (current behavior)
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: enable setting -> try status reversal -> PIN prompt

**Notes:**
- Hardcode PIN validation for now (real auth is separate PRD)
- Use Dialog from `@/components/ui/dialog` for modal
- Setting can be boolean constant for dev

**Priority:** 8

---

### US-009: Connect CreateTicketModal to Front Desk with Redux
**Description:** As a front desk staff, I want to create tickets directly from Front Desk without navigating to checkout.

**Files to modify:**
- `apps/store-app/src/components/tickets/CreateTicketModal.tsx` (~30 lines)
- `apps/store-app/src/components/frontdesk/CreateTicketButton.tsx` (~20 lines)

**Acceptance Criteria:**
- [ ] In CreateTicketModal: import `createCheckoutTicket` from uiTicketsSlice
- [ ] Replace `createTicket(ticketData)` with dispatch to Redux thunk
- [ ] Set status to 'waiting' for new walk-in tickets
- [ ] In CreateTicketButton: open CreateTicketModal instead of navigating to checkout
- [ ] Add success toast after ticket creation
- [ ] New ticket appears in WaitListSection immediately
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: click "+" -> fill form -> submit -> ticket in waitlist

**Notes:**
- CreateTicketModal exists at 324 lines - uses `useTickets().createTicket` which may need to connect to Redux
- CreateTicketButton currently navigates to checkout - change to open modal
- Follow pattern from other ticket modals for Redux integration

**Priority:** 9

---

### US-010: Add client search/selection to CreateTicketModal
**Description:** As a front desk staff, I want to search for existing clients when creating a ticket.

**Files to modify:**
- `apps/store-app/src/components/tickets/CreateTicketModal.tsx` (~60 lines)

**Acceptance Criteria:**
- [ ] Add client search input with autocomplete dropdown
- [ ] Fetch clients from Redux: `useAppSelector(selectClients)`
- [ ] Filter clients by name as user types (minimum 2 characters)
- [ ] Show matching clients with name and phone number
- [ ] Selecting a client populates: clientName, clientId, clientType (Regular/VIP)
- [ ] Show "First Visit" badge if client has no previous visits
- [ ] Allow "Create New Client" option if no match
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: type client name -> see matches -> select -> form populated

**Notes:**
- Use existing `selectClients` selector from clientsSlice
- Follow Command/Combobox pattern from `@/components/ui/command`
- Debounce search input to avoid excessive filtering

**Priority:** 10

---

### US-011: Add service selection to CreateTicketModal
**Description:** As a front desk staff, I want to select services from the service list when creating a ticket.

**Files to modify:**
- `apps/store-app/src/components/tickets/CreateTicketModal.tsx` (~50 lines)

**Acceptance Criteria:**
- [ ] Replace free-text service input with searchable dropdown
- [ ] Fetch services from Redux: `useAppSelector(selectServices)`
- [ ] Group services by category if available
- [ ] Show service name, duration, and price
- [ ] Selecting service populates: service name, duration (auto-filled)
- [ ] Allow multiple service selection for combo tickets
- [ ] Show total estimated duration
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: click service field -> see service list -> select -> duration auto-filled

**Notes:**
- Use existing services selector from servicesSlice
- Follow Select/Combobox pattern from `@/components/ui/select`
- Keep backward compatibility with free-text entry as fallback

**Priority:** 11

---

### US-012: Connect ComingAppointments Edit action to appointment edit flow
**Description:** As a front desk staff, I want the Edit Appointment button to open the appointment editor.

**Files to modify:**
- `apps/store-app/src/components/frontdesk/ComingAppointments.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Add `onEditAppointment` callback prop
- [ ] "Edit Appointment" button calls `onEditAppointment(appointmentId)`
- [ ] Dispatch navigation event: `window.dispatchEvent(new CustomEvent('navigate-to-module', { detail: { module: 'book', appointmentId } }))`
- [ ] Close action menu after clicking Edit
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: click appointment -> Edit -> navigates to Book module with appointment

**Notes:**
- Currently "Edit Appointment" button just logs to console
- Follow navigation pattern from codebase-patterns.md
- ComingAppointments is 801 lines - add to existing action menu

**Priority:** 12

---

### US-013: Connect ComingAppointments Cancel action to appointment cancellation
**Description:** As a front desk staff, I want the Cancel/Reschedule button to cancel or reschedule appointments.

**Files to modify:**
- `apps/store-app/src/components/frontdesk/ComingAppointments.tsx` (~50 lines)

**Acceptance Criteria:**
- [ ] Add cancel confirmation dialog (AlertDialog)
- [ ] "Cancel / Reschedule" button opens confirmation
- [ ] Confirmation shows: "Cancel this appointment?" with appointment details
- [ ] Cancel button dispatches `updateAppointmentInSupabase({ id, updates: { status: 'cancelled' } })`
- [ ] Reschedule button navigates to Book module (same as Edit)
- [ ] Remove cancelled appointment from Coming list
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: click Cancel -> confirm -> appointment removed from list

**Notes:**
- Currently button just logs to console
- `updateAppointmentInSupabase` already imported in ComingAppointments
- Use AlertDialog from `@/components/ui/alert-dialog`

**Priority:** 13

---

### US-014: Create TicketFilterBar component
**Description:** As a front desk staff, I want to filter tickets by various criteria.

**Files to modify:**
- `apps/store-app/src/components/frontdesk/TicketFilterBar.tsx` (NEW, ~150 lines)
- `apps/store-app/src/components/frontdesk/WaitListSection.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Create TicketFilterBar with filter buttons/chips
- [ ] Filter options: All | Priority | VIP | First Visit | Long Wait (10+ min)
- [ ] Support multiple active filters (toggle on/off)
- [ ] Show active filter count badge
- [ ] Export filter state for parent component to apply
- [ ] In WaitListSection: import and render TicketFilterBar above ticket list
- [ ] Apply filters to displayed tickets
- [ ] Clear all filters button
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: click "VIP" filter -> only VIP tickets shown

**Notes:**
- Follow chip/toggle button pattern from existing UI components
- Use Tailwind for styling: `rounded-full`, `bg-slate-100`, `bg-slate-900`
- Filters are local component state, not Redux

**Priority:** 14

---

### US-015: Add service type filter to TicketFilterBar
**Description:** As a front desk staff, I want to filter tickets by service type.

**Files to modify:**
- `apps/store-app/src/components/frontdesk/TicketFilterBar.tsx` (~40 lines)

**Acceptance Criteria:**
- [ ] Add service type dropdown filter
- [ ] Populate dropdown with unique services from visible tickets
- [ ] Show count of tickets per service type
- [ ] Filter by exact service name match
- [ ] Combine with other active filters (AND logic)
- [ ] Clear service filter when selecting "All Services"
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: select "Manicure" -> only manicure tickets shown

**Notes:**
- Derive service list from current tickets, not global services
- Use Select from `@/components/ui/select`
- Keep simple - just single service selection

**Priority:** 15

---

### US-016: Apply urgency coloring to WaitListTicketCard
**Description:** As a front desk staff, I want to see visual urgency indicators on waiting tickets based on wait time.

**Files to modify:**
- `apps/store-app/src/components/tickets/WaitListTicketCard.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Import `getUrgencyLevel`, `URGENCY_COLORS` from `@/utils/urgencyUtils`
- [ ] Calculate urgency from `createdAt` (check-in time) instead of `completedAt`
- [ ] Apply urgency border color: normal (gray), attention (yellow), urgent (orange), critical (red)
- [ ] Apply urgency background tint
- [ ] Show urgency dot indicator in card header
- [ ] Thresholds: attention 10min, urgent 15min, critical 25min (different from pending)
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: wait 10+ minutes -> card turns yellow

**Notes:**
- urgencyUtils.ts already has all the helpers (200 lines)
- Use different thresholds than pending section (waiting is more urgent)
- Add custom thresholds parameter to getUrgencyLevel call

**Priority:** 16

---

### US-017: Add urgency sorting to WaitListSection
**Description:** As a front desk staff, I want urgent tickets to appear at the top of the waitlist.

**Files to modify:**
- `apps/store-app/src/components/frontdesk/WaitListSection.tsx` (~25 lines)

**Acceptance Criteria:**
- [ ] Import `sortByUrgency` from `@/utils/urgencyUtils`
- [ ] Add toggle: "Sort by: Queue Order | Urgency"
- [ ] When "Urgency" selected, sort tickets using `sortByUrgency()`
- [ ] Show sort indicator in header
- [ ] Persist sort preference in localStorage
- [ ] Default to "Queue Order" (current drag-and-drop order)
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: switch to "Urgency" -> critical tickets at top

**Notes:**
- Use `sortByUrgency` with custom thresholds for waiting (not pending)
- Toggle disables drag-and-drop when urgency sort is active
- WaitListSection is 886 lines - add toggle to existing header

**Priority:** 17

---

### US-018: Add conflict detection to assignTicket thunk
**Description:** As a system, I want to warn when assigning a staff member who is already serving another client.

**Files to modify:**
- `apps/store-app/src/store/slices/uiTicketsSlice.ts` (~30 lines)

**Acceptance Criteria:**
- [ ] In `assignTicket` thunk: before assignment, check if staff has active in-service ticket
- [ ] Use `inService` state to find tickets with matching `techId` or `assignedTo.id`
- [ ] If conflict found: return `{ conflict: true, conflictingTicket: UITicket }`
- [ ] If no conflict: proceed with assignment
- [ ] Add `conflictWarning?: string` to thunk return type
- [ ] Export `checkStaffConflict` helper for UI use
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes

**Notes:**
- This story only adds backend detection logic
- UI warning handled in US-019
- Don't block assignment - just warn

**Priority:** 18

---

### US-019: Show conflict warning in AssignTicketModal
**Description:** As a front desk staff, I want to see a warning if the technician I'm assigning is already serving someone.

**Files to modify:**
- `apps/store-app/src/components/tickets/AssignTicketModal.tsx` (~40 lines)

**Acceptance Criteria:**
- [ ] Import `checkStaffConflict` from uiTicketsSlice
- [ ] Before showing staff list, check each staff for conflicts
- [ ] Mark conflicting staff with orange warning badge: "Currently serving [Client Name]"
- [ ] Allow assignment anyway with confirmation: "Assign anyway? This will queue the client."
- [ ] Show conflict indicator next to staff name in list
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: try to assign busy staff -> see warning -> confirm -> assigned

**Notes:**
- Use `useAppSelector(selectServiceTickets)` to get current in-service tickets
- Add visual indicator without blocking the action
- Follow existing modal patterns

**Priority:** 19

---

### US-020: Add timestamp and author to ticket notes
**Description:** As a staff member, I want to see when notes were added and by whom.

**Files to modify:**
- `apps/store-app/src/types/ticket.ts` (~15 lines)
- `apps/store-app/src/store/slices/uiTicketsSlice.ts` (~30 lines)
- `apps/store-app/src/components/tickets/TicketDetailsModal.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Create `TicketNote` interface: `{ id, text, authorId, authorName, createdAt, updatedAt? }`
- [ ] Add `notes: TicketNote[]` to UITicket (array instead of single string)
- [ ] Create `addTicketNote` thunk: adds new note with current user info and timestamp
- [ ] In TicketDetailsModal: display notes as list with author and time
- [ ] Format time as relative: "2 minutes ago", "Yesterday at 3:45 PM"
- [ ] Show author avatar/initials with name
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: view ticket details -> see notes with timestamps

**Notes:**
- Migrate existing string notes to array format in reducer
- Use date-fns `formatDistanceToNow` for relative time
- Author comes from auth/session state (use placeholder if not available)

**Priority:** 20

---

### US-021: Connect AddStaffNoteModal to Redux
**Description:** As a staff member, I want the Add Note modal to actually save notes to the ticket.

**Files to modify:**
- `apps/store-app/src/components/frontdesk/AddStaffNoteModal.tsx` (~30 lines)
- `apps/store-app/src/components/frontdesk/AddNoteModal.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Import `addTicketNote` from uiTicketsSlice
- [ ] Import `useAppDispatch` from store hooks
- [ ] On submit: dispatch `addTicketNote({ ticketId, text: noteText })`
- [ ] Close modal after successful save
- [ ] Show loading state during save
- [ ] Handle errors with toast notification
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: add note -> submit -> note appears in ticket details

**Notes:**
- AddStaffNoteModal and AddNoteModal may be similar - update both
- Follow pattern from other modals with Redux dispatch
- Modal props should include ticketId

**Priority:** 21

---

### US-022: Add status history tracking to UITicket
**Description:** As a manager, I want to see the history of status changes for audit purposes.

**Files to modify:**
- `apps/store-app/src/types/ticket.ts` (~15 lines)
- `apps/store-app/src/store/slices/uiTicketsSlice.ts` (~40 lines)

**Acceptance Criteria:**
- [ ] Create `StatusChange` interface: `{ from, to, changedAt, changedBy?, reason? }`
- [ ] Add `statusHistory: StatusChange[]` to UITicket
- [ ] Modify all status-changing thunks to append to statusHistory
- [ ] Include: assignTicket, moveToWaiting, moveToInService, moveToPending, completeTicket
- [ ] Record `changedBy` from current user if available
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes

**Notes:**
- This story only adds data tracking
- UI display handled in US-023
- Keep statusHistory array lightweight (only essential fields)

**Priority:** 22

---

### US-023: Display status history in TicketDetailsModal
**Description:** As a manager, I want to see the timeline of status changes in ticket details.

**Files to modify:**
- `apps/store-app/src/components/tickets/TicketDetailsModal.tsx` (~50 lines)

**Acceptance Criteria:**
- [ ] Add "History" tab or section to TicketDetailsModal
- [ ] Display statusHistory as vertical timeline
- [ ] Show: status change (from -> to), timestamp, changed by (if available)
- [ ] Use icons for each status type (waiting, in-service, completed, paid)
- [ ] Format timestamps as relative time
- [ ] Empty state: "No history available"
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: open ticket details -> see History section with timeline

**Notes:**
- Use simple vertical timeline layout with dots and lines
- Status icons: Clock (waiting), Wrench (in-service), CheckCircle (completed), DollarSign (paid)
- Follow existing tab pattern in modal if present

**Priority:** 23

---

### US-024: Add keyboard shortcuts for common ticket actions
**Description:** As a front desk staff, I want keyboard shortcuts for quick ticket operations.

**Files to modify:**
- `apps/store-app/src/components/frontdesk/FrontDesk.tsx` (~40 lines)
- `apps/store-app/src/hooks/useTicketKeyboardShortcuts.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Create `useTicketKeyboardShortcuts` hook with keyboard event listeners
- [ ] Shortcuts: `N` = New ticket, `S` = Search focus, `1/2/3` = Switch sections
- [ ] `Escape` = Close any open modal
- [ ] Only active when no input is focused
- [ ] Show shortcuts hint on hover over toolbar icons
- [ ] In FrontDesk: import and use the hook
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: press N -> CreateTicketModal opens

**Notes:**
- Use `useEffect` with `keydown` event listener
- Check `document.activeElement` to avoid triggering in inputs
- Clean up listener on unmount

**Priority:** 24

---

### US-025: Add real-time ticket count badges to section headers
**Description:** As a front desk staff, I want to see the count of tickets in each section at a glance.

**Files to modify:**
- `apps/store-app/src/components/frontdesk/WaitListSection.tsx` (~15 lines)
- `apps/store-app/src/components/frontdesk/PendingSectionFooter.tsx` (~15 lines)

**Acceptance Criteria:**
- [ ] Add ticket count badge next to section title
- [ ] WaitList: show count from Redux `waitlist.length`
- [ ] Pending: show count from Redux `checkoutTickets.length`
- [ ] Badge styling: rounded pill with background color matching section
- [ ] Animate count changes (brief pulse on update)
- [ ] Show "0" when section is empty
- [ ] No forbidden strings: 'Test Client', 'Test Service', 'as any', 'void _'
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: add ticket -> count updates immediately

**Notes:**
- ServiceSection already shows count - follow that pattern
- Use Tailwind animate-pulse for brief highlight on change
- Keep badge small and unobtrusive

**Priority:** 25

---

## Functional Requirements

- FR-1 (US-001): WaitListTicketCard displays technician avatar and name
- FR-2 (US-002): PendingTicketCard displays technician avatar and name
- FR-3 (US-003): EditTicketModal saves changes to Redux and persists to database
- FR-4 (US-004): TicketActions.handleAssign dispatches Redux action
- FR-5 (US-005): Tickets can transition bidirectionally between statuses
- FR-6 (US-006): Check-in numbers reset daily and display prominently
- FR-7 (US-007): Deleted tickets have categorized reasons and are soft-deleted
- FR-8 (US-008): Manager PIN verification available for sensitive actions
- FR-9 (US-009): CreateTicketModal creates tickets via Redux
- FR-10 (US-010): Clients can be searched and selected when creating tickets
- FR-11 (US-011): Services can be selected from the service list
- FR-12 (US-012): Edit Appointment navigates to Book module
- FR-13 (US-013): Cancel Appointment updates status and removes from list
- FR-14 (US-014): TicketFilterBar provides multiple filter options
- FR-15 (US-015): Tickets can be filtered by service type
- FR-16 (US-016): WaitListTicketCard shows urgency coloring
- FR-17 (US-017): Waitlist can be sorted by urgency
- FR-18 (US-018): Staff conflicts are detected during assignment
- FR-19 (US-019): Conflict warnings shown in AssignTicketModal
- FR-20 (US-020): Ticket notes have timestamps and authors
- FR-21 (US-021): AddStaffNoteModal saves notes via Redux
- FR-22 (US-022): Status changes are tracked in history
- FR-23 (US-023): Status history displayed in TicketDetailsModal
- FR-24 (US-024): Keyboard shortcuts for common actions
- FR-25 (US-025): Section headers show ticket counts

## Non-Goals

- No payment processing changes (Checkout module)
- No client lookup/search (Clients module) beyond ticket creation
- No appointment scheduling (Book module separate PRD)
- No real authentication (placeholder PIN only)
- No reporting dashboard for deleted tickets (separate PRD)
- No multi-store ticket sync
- No drag-and-drop between sections (only within waitlist)
- No mobile-specific layouts (desktop-first)

## Technical Considerations

- **Existing patterns:** Follow `assignTicket` thunk pattern in uiTicketsSlice (lines ~431-498)
- **File sizes:**
  - uiTicketsSlice.ts: 1540 lines (large, add carefully)
  - WaitListTicketCard.tsx: 873 lines (large, minimal changes)
  - WaitListSection.tsx: 886 lines (large, minimal changes)
  - ComingAppointments.tsx: 801 lines (large, add to existing structure)
- **State:** Use Redux for all ticket state, localStorage only for view preferences
- **Modals:** Follow EditTicketModal.tsx pattern with Dialog component
- **Styling:** Use Tailwind classes from design-system tokens
- **Type safety:** Use proper TypeScript interfaces, no `as any`
- **Urgency:** Use existing urgencyUtils.ts (200 lines, fully featured)

## Open Questions

1. Should check-in numbers persist across app restarts? (Current: yes, in Redux state)
2. Should soft-deleted tickets be visible to managers? (Future: reporting dashboard)
3. What other actions should require manager PIN? (Future: configurable)
4. Should keyboard shortcuts be customizable? (Future: settings)
5. Should status history include service-level changes? (Future: per-service tracking)
