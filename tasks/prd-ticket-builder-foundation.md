# PRD: Ticket Builder Foundation (Complete Salon Operations)

## Introduction

Complete the Ticket Builder (TicketPanel) to be a fully functional salon operations interface. This PRD ensures ALL actions in the ticket builder work end-to-end with proper persistence, cross-device sync, and UX polish.

The Ticket Builder handles the **salon operations** side of checkout:
- Client selection with alerts and quick-create
- Staff assignment with conflict detection
- Service/Product/Package management with persistence
- 4-state service status tracking with timers
- Discounts, coupons, and gift card validation
- Split/merge/void ticket operations
- Draft auto-save and resume
- Undo/redo with history
- Keyboard shortcuts for power users

**After this PRD is complete, the Ticket Builder will be 100% functional for daily salon operations.**

## Goals

- All ticket changes persist to IndexedDB immediately
- Service status changes sync across devices via MQTT within 3 seconds
- Client alerts (allergies, notes, balance) display when client is selected
- Draft auto-save prevents data loss on close/refresh
- Split/merge/void operations create proper database records
- Undo/redo history survives page refresh
- All keyboard shortcuts functional
- Bulk actions (edit price, discount, reassign) work with persistence

## User Stories

---

## Section A: Core Persistence (Stories 001-006)

### US-001: Persist ticket to IndexedDB on first service add
**Description:** As a front desk staff, I want my ticket saved automatically when I add the first service.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~40 lines)

**Acceptance Criteria:**
- [ ] When first service is added and `ticketId` is null, create ticket in IndexedDB
- [ ] Use `ticketsDB.create()` with status 'draft'
- [ ] Store returned ticketId in reducer state via `setTicketId` action
- [ ] Subsequent service adds update existing ticket (not create new)
- [ ] Include clientId, clientName, services array in ticket
- [ ] No forbidden strings: 'Test Client', 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- `handleAddServices` in useTicketActions.tsx is the trigger point (~line 291)
- ticketsDB is in `@/db/database`
- Set `isDraft: true` on creation

**Priority:** 1

---

### US-002: Persist service updates to IndexedDB
**Description:** As a front desk staff, I want my price edits and service changes saved immediately.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~40 lines)

**Acceptance Criteria:**
- [ ] `handleUpdateService` saves to IndexedDB after local state update
- [ ] Debounce saves by 500ms to batch rapid edits
- [ ] Update the ticket's services array in IndexedDB
- [ ] Handle: price, duration, staffId, staffName, notes, discount fields
- [ ] Skip IndexedDB save if ticketId is null
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- `handleUpdateService` is at ~line 386
- Use `useDebouncedCallback` from `use-debounce` package
- Create `persistTicketToIndexedDB` helper for reuse

**Priority:** 2

---

### US-003: Persist service removal to IndexedDB
**Description:** As a front desk staff, I want removed services reflected in the database.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~20 lines)

**Acceptance Criteria:**
- [ ] `handleRemoveService` saves updated ticket after removal
- [ ] Update services array in IndexedDB (without removed service)
- [ ] If last service removed, keep ticket as empty draft (don't delete)
- [ ] Undo action should restore and persist the service
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: remove service → refresh → service gone

**Notes:**
- `handleRemoveService` is at ~line 408
- Use same `persistTicketToIndexedDB` helper

**Priority:** 3

---

### US-004: Persist client selection to ticket
**Description:** As a front desk staff, I want the selected client saved with the ticket.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~30 lines)
- `apps/store-app/src/components/checkout/TicketPanel.tsx` (~10 lines)

**Acceptance Criteria:**
- [ ] Create `handleSelectClient` that dispatches AND persists
- [ ] Store `clientId` and `clientName` on ticket record
- [ ] When client removed, set `clientId: null, clientName: 'Walk-in'`
- [ ] Pass `handleSelectClient` to ClientSelector's `onSelect`
- [ ] Skip save if ticketId is null
- [ ] No forbidden strings: 'Test Client', 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: select client → refresh → client still there

**Notes:**
- Client selection currently only updates local state
- Create `handleRemoveClientPersisted` for removal case

**Priority:** 4

---

### US-005: Persist staff reassignment to IndexedDB
**Description:** As a front desk staff, I want staff changes saved when I reassign services.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~25 lines)

**Acceptance Criteria:**
- [ ] `handleAddServiceToStaff` saves to IndexedDB after state update
- [ ] Update `staffId` and `staffName` on affected services
- [ ] Update `assignedStaffIds` array on ticket
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: reassign service → refresh → staff correct

**Notes:**
- `handleAddServiceToStaff` is at ~line 356
- This handles both reassignment and new staff selection

**Priority:** 5

---

### US-006: Persist discount and coupon applications
**Description:** As a front desk staff, I want discounts and coupons saved with the ticket.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~40 lines)
- `apps/store-app/src/components/checkout/reducers/ticketReducer.ts` (~10 lines)

**Acceptance Criteria:**
- [ ] Create `handleApplyDiscount` that dispatches AND persists
- [ ] Create `handleApplyCoupon` that dispatches AND persists
- [ ] Store `discount`, `couponCode`, `couponDiscount` on ticket
- [ ] Store per-service discounts in service objects
- [ ] Removal of discount/coupon also persists
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: apply coupon → refresh → coupon still applied

**Notes:**
- Ticket record needs discount fields in schema
- Per-service discount stored as `{ type: '%' | '$', value: number }`

**Priority:** 6

---

## Section B: Client Management (Stories 007-011)

### US-007: Wire ClientAlerts to Redux client data
**Description:** As a front desk staff, I want to see client alerts when I select a client.

**Files to modify:**
- `apps/store-app/src/components/checkout/TicketPanel.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Import `selectClientById` from `@/store/slices/clientsSlice`
- [ ] When `selectedClient` has an ID, fetch full client data via selector
- [ ] Pass client data to `ClientAlerts` component after client selector
- [ ] ClientAlerts displays: allergies (red), staffAlert/notes (yellow), balance (orange)
- [ ] Blocked client shows AlertDialog requiring override or cancel
- [ ] No forbidden strings: 'Test Client', 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: select client with allergy → red alert appears

**Notes:**
- ClientAlerts.tsx already has all UI logic (210 lines)
- Add `<ClientAlerts client={fullClientData} />` below ClientSelector

**Priority:** 7

---

### US-008: Add client quick stats display
**Description:** As a front desk staff, I want to see visit count and last visit at a glance.

**Files to modify:**
- `apps/store-app/src/components/checkout/components/TicketHeader.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Display visit count: "12 visits" or "First Visit" badge if 0
- [ ] Display last visit: "Last: Jan 15" or "New Client" if null
- [ ] Show client phone number (clickable to call on mobile)
- [ ] Show client email icon (clickable to email)
- [ ] Styling: subtle gray text, beside client name
- [ ] No forbidden strings: 'Test Client', 'as any'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: returning client shows stats

**Notes:**
- Get stats from full client data fetched in US-007
- Format date with `format(date, 'MMM d')` from date-fns

**Priority:** 8

---

### US-009: Add recent clients quick list
**Description:** As a front desk staff, I want quick access to recently selected clients.

**Files to modify:**
- `apps/store-app/src/components/checkout/ClientSelector.tsx` (~50 lines)
- `apps/store-app/src/store/slices/clientsSlice.ts` (~20 lines)

**Acceptance Criteria:**
- [ ] Show "Recent" section with last 5 clients used on this device
- [ ] Store recent client IDs in localStorage
- [ ] Update recent list when client is selected
- [ ] Recent clients show avatar, name, phone
- [ ] Click selects client immediately (no search needed)
- [ ] Clear recent option available
- [ ] No forbidden strings: 'Test Client', 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: select clients → recent list populates

**Notes:**
- Recent clients stored in localStorage: `recent-clients-{storeId}`
- Limit to 5 for quick scanning

**Priority:** 9

---

### US-010: Add quick-create client inline
**Description:** As a front desk staff, I want to create a new client without leaving checkout.

**Files to modify:**
- `apps/store-app/src/components/checkout/ClientSelector.tsx` (~60 lines)

**Acceptance Criteria:**
- [ ] "Create New Client" button appears when search has no results
- [ ] Inline form: First Name, Last Name (required), Phone, Email (optional)
- [ ] Submit creates client via `dataService.clients.create()`
- [ ] New client automatically selected after creation
- [ ] Validation: phone format, email format
- [ ] Show success toast after creation
- [ ] No forbidden strings: 'Test Client', 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: create client → client selected → ticket has client

**Notes:**
- Follow existing form patterns
- Phone validation: accept (555) 123-4567 or 5551234567 formats

**Priority:** 10

---

### US-011: Add staff conflict detection
**Description:** As a front desk staff, I want a warning if the staff I'm assigning is busy.

**Files to modify:**
- `apps/store-app/src/components/checkout/StaffGridView.tsx` (~40 lines)
- `apps/store-app/src/store/slices/uiTicketsSlice.ts` (~20 lines)

**Acceptance Criteria:**
- [ ] Create `selectStaffWithActiveService` selector
- [ ] Returns staff IDs with in-service tickets currently
- [ ] In StaffGridView: mark busy staff with orange badge "Serving [Client]"
- [ ] Show current client name they're serving
- [ ] Allow assignment anyway (warning only, not blocking)
- [ ] Confirmation dialog: "Assign anyway? This will queue."
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: assign busy staff → see warning → can assign

**Notes:**
- Query inService array from uiTicketsSlice state
- Use AlertDialog for confirmation

**Priority:** 11

---

## Section C: Service Status Tracking (Stories 012-017)

### US-012: Create service status persistence types
**Description:** As a developer, I need proper types for service status with history.

**Files to modify:**
- `apps/store-app/src/types/Ticket.ts` (~30 lines)

**Acceptance Criteria:**
- [ ] Add `ServiceStatusChange` interface: { from, to, changedAt, changedBy, deviceId }
- [ ] Add `statusHistory: ServiceStatusChange[]` to TicketService
- [ ] Add `lastStatusUpdate?: string` (ISO timestamp)
- [ ] Add `totalPausedDuration?: number` (seconds)
- [ ] Add `actualDuration?: number` (seconds)
- [ ] Add `pausedAt?: string` for tracking pause start
- [ ] Export `ServiceStatus` type union
- [ ] No forbidden strings: 'as any'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- TicketService interface is at ~line 45
- actualDuration = total time minus paused time

**Priority:** 12

---

### US-013: Implement full service status persistence
**Description:** As a front desk staff, I want status changes saved with full history.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~50 lines)

**Acceptance Criteria:**
- [ ] `handleUpdateService` with status: append to statusHistory
- [ ] Record: from, to, changedAt (now), changedBy (userId), deviceId
- [ ] On 'in_progress': set startTime if first start, set pausedAt: null
- [ ] On 'paused': set pausedAt to now
- [ ] On 'completed': calculate actualDuration, set completedAt
- [ ] On 'not_started' (restart): reset timers, keep history
- [ ] Save to IndexedDB immediately (no debounce for status)
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- Status is critical - save immediately, not debounced
- Get userId from storeAuthManager.getState().user?.id

**Priority:** 13

---

### US-014: Calculate paused duration correctly
**Description:** As a system, I need accurate pause time tracking for reports.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Create `calculatePausedDuration(service)` utility
- [ ] When resuming from pause: add (now - pausedAt) to totalPausedDuration
- [ ] When completing: actualDuration = (completedAt - startTime) - totalPausedDuration
- [ ] Handle multiple pause/resume cycles correctly
- [ ] Handle edge case: complete while paused
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- Use Date.now() for calculations
- Store durations in seconds

**Priority:** 14

---

### US-015: Publish service status via MQTT
**Description:** As a system, I need to broadcast status changes to other devices.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~20 lines)

**Acceptance Criteria:**
- [ ] Import `useMqttPublish` from mqtt hooks
- [ ] After status update: publish to `salon/{storeId}/ticket/{ticketId}/status`
- [ ] Message includes: serviceId, newStatus, changedAt, changedBy
- [ ] Use QoS 1 for status updates
- [ ] Only publish if MQTT is connected
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- Use buildTopic() helper from mqtt/topics.ts
- Check isMqttEnabled() before publishing

**Priority:** 15

---

### US-016: Subscribe to service status MQTT updates
**Description:** As a front desk staff, I want to see status changes from other devices.

**Files to modify:**
- `apps/store-app/src/components/checkout/TicketPanel.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Import `useMqttSubscription` from mqtt hooks
- [ ] Subscribe to `salon/{storeId}/ticket/{ticketId}/status`
- [ ] On message: dispatch `updateServiceStatus` to local state
- [ ] Debounce incoming updates by 100ms to batch
- [ ] Ignore own device's messages (check deviceId)
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify: change status on one device → appears on another

**Notes:**
- Get deviceId from storeAuthManager
- Only subscribe when ticket is open

**Priority:** 16

---

### US-017: Add visual timer improvements
**Description:** As a front desk staff, I want better visual feedback for service timers.

**Files to modify:**
- `apps/store-app/src/components/checkout/StaffGroup.tsx` (~40 lines)

**Acceptance Criteria:**
- [ ] Timer turns yellow when 80% of estimated duration passed
- [ ] Timer turns red when over estimated duration
- [ ] Show "+5:00" format when over time
- [ ] Paused timer shows blue with pause icon
- [ ] Completed timer shows green checkmark
- [ ] Add pulse animation when timer is over
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: timer colors change as time progresses

**Notes:**
- Use design tokens for colors
- Add `animate-pulse` class from Tailwind

**Priority:** 17

---

## Section D: Ticket Operations (Stories 018-023)

### US-018: Persist split ticket to database
**Description:** As a front desk staff, I want split tickets saved properly.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~40 lines)

**Acceptance Criteria:**
- [ ] `handleSplitTicket` creates new ticket in IndexedDB
- [ ] New ticket gets subset of services (selected ones)
- [ ] Original ticket's services array updated (remaining)
- [ ] Link tickets: `splitFromTicketId` on new, `splitToTicketId` on original
- [ ] Both tickets saved atomically (if one fails, rollback)
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: split → refresh → both tickets exist

**Notes:**
- Generate new ticketId with uuid()
- Copy clientId to new ticket

**Priority:** 18

---

### US-019: Implement merge tickets from real data
**Description:** As a front desk staff, I want to merge two tickets together.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~40 lines)

**Acceptance Criteria:**
- [ ] `handleMergeTickets` combines services from both tickets
- [ ] Target ticket gets all services from source
- [ ] Source ticket marked as `mergedIntoTicketId`
- [ ] Source ticket status set to 'merged'
- [ ] Preserve all service metadata (status, times, notes)
- [ ] Recalculate totals on target ticket
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: merge → refresh → one ticket with all services

**Notes:**
- Source ticket remains in DB but hidden from active list
- Use batch update for atomicity

**Priority:** 19

---

### US-020: Persist void ticket operation
**Description:** As a front desk staff, I want voided tickets recorded properly.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] `handleVoidTicket` updates ticket in IndexedDB
- [ ] Set `status: 'voided'`, `voidedAt`, `voidedBy`, `voidReason`
- [ ] Require reason (min 5 characters)
- [ ] Log void action to audit log
- [ ] Voided tickets hidden from active list but queryable
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: void ticket → refresh → ticket not in list

**Notes:**
- Use auditLogger.logAction() for audit trail
- voidedBy is current userId

**Priority:** 20

---

### US-021: Persist undo/redo history
**Description:** As a system, I want undo history saved with the ticket.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketPersistence.ts` (~40 lines)
- `apps/store-app/src/components/checkout/reducers/ticketReducer.ts` (~20 lines)

**Acceptance Criteria:**
- [ ] Add `undoStack` array to ticket record in IndexedDB
- [ ] Each undo snapshot includes: action, previousState, timestamp
- [ ] Limit stack to 20 items
- [ ] Save undoStack when ticket is saved
- [ ] Load undoStack when resuming draft
- [ ] Redo stack NOT persisted (lost on refresh - acceptable)
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: undo → refresh → can't redo but state correct

**Notes:**
- UndoSnapshot interface already exists
- Need to serialize/deserialize with ticket

**Priority:** 21

---

### US-022: Persist product sales
**Description:** As a front desk staff, I want product sales saved with the ticket.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] `handleAddProducts` saves to IndexedDB after adding
- [ ] Products stored in services array with `isProduct: true` flag
- [ ] Products have `status: 'completed'` (no tracking needed)
- [ ] Product quantity tracked (or multiple line items)
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: add product → refresh → product still there

**Notes:**
- Products already added to services array
- Just need persistence after adding

**Priority:** 22

---

### US-023: Persist package purchases
**Description:** As a front desk staff, I want package purchases saved with the ticket.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] `handleAddPackage` saves to IndexedDB after adding
- [ ] Package services have `packageId` reference
- [ ] Package discount stored on ticket
- [ ] All package services linked for undo as group
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: add package → refresh → package still there

**Notes:**
- Package already has undo support
- Just need persistence after adding

**Priority:** 23

---

## Section E: Bulk Actions (Stories 024-026)

### US-024: Persist bulk price edits
**Description:** As a front desk staff, I want bulk price changes saved immediately.

**Files to modify:**
- `apps/store-app/src/components/checkout/Summary/hooks/useSummaryDialogs.ts` (~30 lines)
- `apps/store-app/src/components/checkout/InteractiveSummary.tsx` (~10 lines)

**Acceptance Criteria:**
- [ ] `handleBulkEditPrice` saves to IndexedDB after applying
- [ ] All selected services updated with new price
- [ ] Original prices logged for audit (`originalPrice` field)
- [ ] Bulk edit triggers single IndexedDB update (not per-service)
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: bulk edit prices → refresh → prices correct

**Notes:**
- handleBulkEditPrice at ~line 76 in useSummaryDialogs.ts
- Use persistTicketToIndexedDB helper

**Priority:** 24

---

### US-025: Persist bulk discounts
**Description:** As a front desk staff, I want bulk discounts saved immediately.

**Files to modify:**
- `apps/store-app/src/components/checkout/Summary/hooks/useSummaryDialogs.ts` (~25 lines)

**Acceptance Criteria:**
- [ ] `handleBulkDiscount` saves to IndexedDB after applying
- [ ] Store discount per service: `{ type: '%' | '$', value: number }`
- [ ] Display discounted price and original price on line item
- [ ] Bulk discount triggers single IndexedDB update
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: bulk discount → refresh → discounts applied

**Notes:**
- handleBulkDiscount at ~line 96 in useSummaryDialogs.ts
- Per-service discount separate from ticket-level

**Priority:** 25

---

### US-026: Persist bulk reassignment
**Description:** As a front desk staff, I want bulk reassignment saved immediately.

**Files to modify:**
- `apps/store-app/src/components/checkout/InteractiveSummary.tsx` (~25 lines)

**Acceptance Criteria:**
- [ ] Bulk reassign updates all selected services' staffId/staffName
- [ ] Save to IndexedDB after reassignment
- [ ] Update `assignedStaffIds` on ticket
- [ ] Single IndexedDB update for all services
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: bulk reassign → refresh → all correct staff

**Notes:**
- Bulk reassign available in BulkActionsPopup
- Connect to persistence layer

**Priority:** 26

---

## Section F: Draft System (Stories 027-031)

### US-027: Implement auto-save on significant actions
**Description:** As a system, I want tickets auto-saved when important changes happen.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketAutoSave.ts` (~100 lines)

**Acceptance Criteria:**
- [ ] Create `useTicketAutoSave` hook with proper implementation
- [ ] Auto-save triggers: addService, removeService, updatePrice, changeClient, applyDiscount
- [ ] Debounce by 2 seconds to batch rapid changes
- [ ] Track `hasUnsavedChanges` state
- [ ] Set `lastAutoSave` timestamp after save
- [ ] Show subtle "Saved" indicator when save completes
- [ ] Export `triggerAutoSave()` for manual trigger
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes

**Notes:**
- Hook may exist but needs proper implementation
- Use `useDebouncedCallback` from `use-debounce`

**Priority:** 27

---

### US-028: Implement save-on-close
**Description:** As a front desk staff, I want my work saved when I close the panel.

**Files to modify:**
- `apps/store-app/src/components/checkout/TicketPanel.tsx` (~35 lines)
- `apps/store-app/src/components/checkout/hooks/useTicketActions.tsx` (~20 lines)

**Acceptance Criteria:**
- [ ] `handleCloseAttempt`: if unsaved changes, save before close
- [ ] Create `saveTicketAsDraft()` async helper
- [ ] Await save completion before calling `onClose()`
- [ ] Show "Saving..." toast if save takes > 500ms
- [ ] Add `beforeunload` listener for browser close
- [ ] `beforeunload` uses best-effort sync save
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: add service → close → reopen → service there

**Notes:**
- `handleCloseAttempt` is at end of useTicketActions
- `beforeunload` can't await, use `sendBeacon` or sync write

**Priority:** 28

---

### US-029: Add Drafts button to checkout header
**Description:** As a front desk staff, I want to access saved drafts from checkout.

**Files to modify:**
- `apps/store-app/src/components/checkout/components/TicketHeader.tsx` (~25 lines)
- `apps/store-app/src/components/checkout/TicketPanel.tsx` (~20 lines)

**Acceptance Criteria:**
- [ ] Add "Drafts" button with Files icon to header
- [ ] Show badge with draft count from Redux `selectDrafts.length`
- [ ] Click opens DraftSalesDrawer
- [ ] Pass `storeId` and `onResumeDraft` to drawer
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: Drafts button shows count, opens drawer

**Notes:**
- DraftSalesDrawer.tsx already exists (183 lines)
- Get storeId from `storeAuthManager.getStoreId()`

**Priority:** 29

---

### US-030: Implement resume draft functionality
**Description:** As a front desk staff, I want to resume a saved draft.

**Files to modify:**
- `apps/store-app/src/components/checkout/TicketPanel.tsx` (~30 lines)
- `apps/store-app/src/components/checkout/reducers/ticketReducer.ts` (~50 lines)

**Acceptance Criteria:**
- [ ] Create `LOAD_DRAFT` action in reducer
- [ ] `onResumeDraft` loads draft data into reducer state
- [ ] Map draft: services, client, discounts, staff, undoStack
- [ ] Set `ticketId` to draft's ID (so saves update it)
- [ ] Set `isNewTicket: false`
- [ ] Close DraftSalesDrawer after resume
- [ ] Clear existing ticket state before loading
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: resume draft → all data restored

**Notes:**
- Need to map IndexedDB ticket format to TicketState
- Handle case where draft has stale service data

**Priority:** 30

---

### US-031: Load existing ticket for editing
**Description:** As a front desk staff, I want to open a ticket from FrontDesk to edit.

**Files to modify:**
- `apps/store-app/src/components/checkout/TicketPanel.tsx` (~35 lines)
- `apps/store-app/src/components/checkout/reducers/ticketReducer.ts` (~30 lines)

**Acceptance Criteria:**
- [ ] Add `initialTicketId?: string` prop to TicketPanel
- [ ] If prop provided: load ticket from IndexedDB on mount
- [ ] Create `LOAD_TICKET` action similar to `LOAD_DRAFT`
- [ ] Show loading spinner while fetching
- [ ] Handle ticket not found error gracefully
- [ ] Set `isNewTicket: false` for edit mode
- [ ] Subsequent saves update existing ticket
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: click ticket card → TicketPanel opens with data

**Notes:**
- FrontDesk will pass ticketId when clicking a ticket card
- Same pattern as draft loading but from active tickets

**Priority:** 31

---

## Section G: Keyboard Shortcuts & Polish (Stories 032-035)

### US-032: Implement all keyboard shortcuts
**Description:** As a power user, I want keyboard shortcuts for faster checkout.

**Files to modify:**
- `apps/store-app/src/components/checkout/hooks/useTicketKeyboard.ts` (~60 lines)

**Acceptance Criteria:**
- [ ] `Cmd/Ctrl + S`: Save draft
- [ ] `Cmd/Ctrl + P`: Open payment modal (if can checkout)
- [ ] `Cmd/Ctrl + K`: Focus search
- [ ] `Cmd/Ctrl + Z`: Undo last action
- [ ] `Escape`: Close modal or panel
- [ ] `?`: Show keyboard shortcuts help
- [ ] Only active when TicketPanel is open
- [ ] Disabled when input/textarea focused
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: Cmd+S saves draft

**Notes:**
- useTicketKeyboard.ts exists (~100 lines)
- Add missing shortcuts and ensure all work

**Priority:** 32

---

### US-033: Add service notes UI
**Description:** As a front desk staff, I want to add notes to individual services.

**Files to modify:**
- `apps/store-app/src/components/checkout/StaffGroup.tsx` (~40 lines)

**Acceptance Criteria:**
- [ ] Add "Add Note" option in service dropdown menu
- [ ] Click opens small input popover
- [ ] Note saved to service object and persisted
- [ ] Note icon visible on service row if note exists
- [ ] Hover/click note icon shows note content
- [ ] Edit and delete note options
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: add note → refresh → note still there

**Notes:**
- Add `notes?: string` field to service
- Use Popover component for note input

**Priority:** 33

---

### US-034: Persist drag-drop reorder
**Description:** As a front desk staff, I want service order saved when I reorder.

**Files to modify:**
- `apps/store-app/src/components/checkout/StaffGroup.tsx` (~25 lines)

**Acceptance Criteria:**
- [ ] After drag-drop reorder completes, save to IndexedDB
- [ ] Services maintain order via `order` or array position
- [ ] Order persists per staff group
- [ ] Debounce reorder saves (500ms)
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: reorder → refresh → order preserved

**Notes:**
- Reorder UI already exists with Framer Motion
- Need to trigger persistence on reorder complete

**Priority:** 34

---

### US-035: Add offline indicator and handling
**Description:** As a front desk staff, I want to know when I'm offline.

**Files to modify:**
- `apps/store-app/src/components/checkout/TicketPanel.tsx` (~30 lines)
- `apps/store-app/src/hooks/useOnlineStatus.ts` (NEW or existing, ~30 lines)

**Acceptance Criteria:**
- [ ] Create/use `useOnlineStatus` hook
- [ ] Show subtle banner when offline: "Offline - changes saved locally"
- [ ] All local operations work offline (service add, edit, status)
- [ ] Disable "Checkout" button when offline (card won't work)
- [ ] Enable "Checkout" for cash-only when offline
- [ ] Auto-hide banner when back online
- [ ] Queue changes for sync when online
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Verify in browser: go offline → banner shows → edits still work

**Notes:**
- Use `navigator.onLine` and online/offline events
- IndexedDB works fully offline

**Priority:** 35

---

## Functional Requirements Summary

- FR-1: All ticket CRUD operations persist to IndexedDB immediately
- FR-2: Client alerts display based on real client data
- FR-3: Client quick-create works inline
- FR-4: Staff conflict detection warns before assignment
- FR-5: Service status tracks 4 states with full history
- FR-6: Status syncs via MQTT within 3 seconds
- FR-7: Split/merge/void create proper database records
- FR-8: Undo history survives refresh
- FR-9: Product and package sales persist
- FR-10: Bulk actions persist immediately
- FR-11: Draft auto-save prevents data loss
- FR-12: Existing tickets can be loaded for editing
- FR-13: All keyboard shortcuts functional
- FR-14: Service notes supported
- FR-15: Offline mode with local persistence

## Non-Goals

- Payment processing (separate PRD)
- Receipt delivery (separate PRD)
- Tip distribution UI (separate PRD)
- Self-checkout (future PRD)
- Reports and analytics (separate module)

## Technical Considerations

### Key Files (be careful with large files)
| File | Lines | Notes |
|------|-------|-------|
| TicketPanel.tsx | 1671 | Add minimal code, use hooks |
| useTicketActions.tsx | 1051 | Add handlers at end |
| ticketReducer.ts | 822 | Add new action types |
| StaffGroup.tsx | 770 | Status UI exists |
| ClientSelector.tsx | ~200 | Add recent/quick-create |

### Shared Helper to Create
```typescript
// apps/store-app/src/components/checkout/hooks/usePersistence.ts
export function useTicketPersistence() {
  const persistTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    await ticketsDB.update(ticketId, updates);
    // Add to sync queue
  };
  return { persistTicket };
}
```

### IndexedDB Schema Updates
- Add `statusHistory` array to services
- Add `undoStack` to ticket
- Add `splitFromTicketId`, `splitToTicketId`
- Add `voidedAt`, `voidedBy`, `voidReason`
- Add `mergedIntoTicketId`

## Success Criteria

| Metric | Target |
|--------|--------|
| Data persistence | 100% - no data loss on close/refresh |
| MQTT sync latency | < 3 seconds |
| Status history accuracy | All changes logged |
| Draft resume success | 100% data restored |
| Client alert display | < 500ms |
| Keyboard shortcuts | All 6+ working |
| Split/merge/void | Creates proper DB records |

## Open Questions

1. Should we support redo in addition to undo?
2. Maximum number of concurrent drafts per staff?
3. Draft expiration policy (24 hours default)?
4. Should voided tickets be visible to managers?
5. Conflict resolution for simultaneous edits?
