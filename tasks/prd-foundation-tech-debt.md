# PRD: Foundation & Technical Debt (Phase 1 & 2)

## Introduction

This PRD addresses critical foundation issues and technical debt in the Mango POS Store App to ensure a solid base for continued development. The work is divided into two phases:

- **Phase 1 (Foundation Fixes):** Test coverage configuration, real test implementation, and TicketPanel modularization
- **Phase 2 (Technical Debt):** Silent error fixes, console removal, dataService extraction, and large file splitting

## Goals

- Increase test coverage visibility by including critical paths (checkout, auth, common) in Vitest config
- Establish coverage thresholds to prevent regression
- Replace placeholder tests with real implementations (PaymentModal)
- Fix silent error failures that hide bugs in production
- Remove console.log statements from production builds
- Reduce file sizes for better maintainability (target: <500 lines per file)
- Extract monolithic dataService.ts (3,090 lines) into domain services

## User Stories

---

### Phase 1: Foundation Fixes

---

### US-001: Add checkout, auth, and common paths to Vitest coverage include
**Description:** As a developer, I need coverage reports to include all critical paths.

**Files to modify:**
- `apps/store-app/vitest.config.ts` (~10 lines to add)

**Acceptance Criteria:**
- [ ] Add `'src/components/checkout/**/*.{ts,tsx}'` to coverage include array
- [ ] Add `'src/components/auth/**/*.{ts,tsx}'` to coverage include array
- [ ] Add `'src/components/common/**/*.{ts,tsx}'` to coverage include array
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm run typecheck` passes

**Notes:**
- Current include array is at lines 32-40 in vitest.config.ts
- Follow existing glob pattern format
- Do NOT add thresholds yet (separate story)

**Priority:** 1
**Category:** test
**Complexity:** 1

---

### US-002: Add coverage thresholds to Vitest config
**Description:** As a developer, I need coverage thresholds to prevent regressions.

**Files to modify:**
- `apps/store-app/vitest.config.ts` (~8 lines to add)

**Acceptance Criteria:**
- [ ] Add `statements: 50` threshold
- [ ] Add `branches: 40` threshold
- [ ] Add `functions: 50` threshold
- [ ] Add `lines: 50` threshold
- [ ] Thresholds are inside the `coverage` object
- [ ] `pnpm run typecheck` passes

**Notes:**
- Add thresholds after the `include` array in the coverage config
- These are starting thresholds - can be increased later
- Format: `thresholds: { statements: 50, branches: 40, functions: 50, lines: 50 }`

**Priority:** 2
**Category:** test
**Complexity:** 1
**Dependencies:** ["US-001"]

---

### US-003: Fix silent error in featureFlags.ts getFeatureFlag function
**Description:** As a developer, I need to see error logs when feature flag parsing fails.

**Files to modify:**
- `apps/store-app/src/config/featureFlags.ts` (~5 lines to change)

**Acceptance Criteria:**
- [ ] Add `console.warn('[FeatureFlags] Failed to parse ${key}:', error)` to catch block at line ~92
- [ ] Catch block captures the error parameter: `catch (error)`
- [ ] Still returns `defaultValue` after logging
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm run typecheck` passes

**Notes:**
- Current catch block at line 92 is empty: `} catch { return false; }`
- Change to: `} catch (error) { console.warn(...); return defaultValue; }`
- This is ONE of 4 empty catch blocks - each is a separate story

**Priority:** 3
**Category:** backend
**Complexity:** 1

---

### US-004: Fix silent error in featureFlags.ts getNumericFeatureFlag function
**Description:** As a developer, I need to see error logs when numeric feature flag parsing fails.

**Files to modify:**
- `apps/store-app/src/config/featureFlags.ts` (~5 lines to change)

**Acceptance Criteria:**
- [ ] Add `console.warn('[FeatureFlags] Failed to parse numeric ${key}:', error)` to catch block at line ~250
- [ ] Catch block captures the error parameter: `catch (error)`
- [ ] Still returns `defaultValue` after logging
- [ ] `pnpm run typecheck` passes

**Notes:**
- Empty catch block at line ~250
- Same pattern as US-003

**Priority:** 4
**Category:** backend
**Complexity:** 1

---

### US-005: Fix silent error in featureFlags.ts getJsonFeatureFlag function
**Description:** As a developer, I need to see error logs when JSON feature flag parsing fails.

**Files to modify:**
- `apps/store-app/src/config/featureFlags.ts` (~5 lines to change)

**Acceptance Criteria:**
- [ ] Add `console.warn('[FeatureFlags] Failed to parse JSON ${key}:', error)` to catch block at line ~264
- [ ] Catch block captures the error parameter: `catch (error)`
- [ ] Still returns `defaultValue` after logging
- [ ] `pnpm run typecheck` passes

**Notes:**
- Empty catch block at line ~264
- Same pattern as US-003

**Priority:** 5
**Category:** backend
**Complexity:** 1

---

### US-006: Fix silent error in featureFlags.ts getArrayFeatureFlag function
**Description:** As a developer, I need to see error logs when array feature flag parsing fails.

**Files to modify:**
- `apps/store-app/src/config/featureFlags.ts` (~5 lines to change)

**Acceptance Criteria:**
- [ ] Add `console.warn('[FeatureFlags] Failed to parse array ${key}:', error)` to catch block at line ~278
- [ ] Catch block captures the error parameter: `catch (error)`
- [ ] Still returns `defaultValue` after logging
- [ ] `pnpm run typecheck` passes

**Notes:**
- Empty catch block at line ~278
- Same pattern as US-003

**Priority:** 6
**Category:** backend
**Complexity:** 1

---

### US-007: Add vite-plugin-remove-console for production builds
**Description:** As a developer, I need console.log statements removed from production builds.

**Files to modify:**
- `apps/store-app/vite.config.ts` (~15 lines to add)
- `apps/store-app/package.json` (~1 line for dependency)

**Acceptance Criteria:**
- [ ] Install `vite-plugin-remove-console` as dev dependency
- [ ] Import plugin in vite.config.ts
- [ ] Add plugin to plugins array with config: `removeConsole({ includes: ['log', 'debug'] })`
- [ ] Plugin only active for production builds (check `mode === 'production'`)
- [ ] Keep `console.warn` and `console.error` (do NOT remove them)
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run build` passes

**Notes:**
- Use conditional plugin: `mode === 'production' && removeConsole({...})`
- Preserving warn/error is important for debugging production issues
- Run `pnpm add -D vite-plugin-remove-console` first

**Priority:** 7
**Category:** build
**Complexity:** 2

---

### US-008: Implement PaymentModal test - renders when open
**Description:** As a developer, I need real tests for PaymentModal rendering.

**Files to modify:**
- `apps/store-app/src/components/checkout/__tests__/PaymentModal.test.tsx` (~30 lines to change)

**Acceptance Criteria:**
- [ ] Replace placeholder `expect(true).toBe(true)` with real assertions
- [ ] Test renders PaymentModal with `isOpen={true}`
- [ ] Assert modal container is in the document
- [ ] Assert modal title or header is visible
- [ ] Test passes: `pnpm test PaymentModal`
- [ ] `pnpm run typecheck` passes

**Notes:**
- Import PaymentModal from '../PaymentModal'
- Wrap in necessary providers (Redux, etc.)
- Use `@testing-library/react` for rendering
- Check existing test patterns in `src/components/checkout/__tests__/`

**Priority:** 8
**Category:** test
**Complexity:** 2

---

### US-009: Implement PaymentModal test - does not render when closed
**Description:** As a developer, I need tests verifying PaymentModal hides when closed.

**Files to modify:**
- `apps/store-app/src/components/checkout/__tests__/PaymentModal.test.tsx` (~15 lines to change)

**Acceptance Criteria:**
- [ ] Replace placeholder test for "does not render when isOpen is false"
- [ ] Render PaymentModal with `isOpen={false}`
- [ ] Assert modal container is NOT in the document
- [ ] Test passes: `pnpm test PaymentModal`
- [ ] `pnpm run typecheck` passes

**Notes:**
- Use `queryByRole` or similar that returns null if not found
- Don't use `getByRole` which throws if not found

**Priority:** 9
**Category:** test
**Complexity:** 1
**Dependencies:** ["US-008"]

---

### US-010: Implement PaymentModal test - displays payment method options
**Description:** As a developer, I need tests verifying payment options are shown.

**Files to modify:**
- `apps/store-app/src/components/checkout/__tests__/PaymentModal.test.tsx` (~20 lines to change)

**Acceptance Criteria:**
- [ ] Replace placeholder test for "displays payment method options"
- [ ] Render PaymentModal with `isOpen={true}` and mock payment methods
- [ ] Assert Cash option is visible
- [ ] Assert Card option is visible
- [ ] Test passes: `pnpm test PaymentModal`
- [ ] `pnpm run typecheck` passes

**Notes:**
- Check PaymentModal props for how payment methods are passed
- May need to mock or provide default payment methods

**Priority:** 10
**Category:** test
**Complexity:** 2
**Dependencies:** ["US-008"]

---

### US-011: Implement PaymentModal test - handles close callback
**Description:** As a developer, I need tests verifying onClose is called.

**Files to modify:**
- `apps/store-app/src/components/checkout/__tests__/PaymentModal.test.tsx` (~20 lines to change)

**Acceptance Criteria:**
- [ ] Replace placeholder test for "calls onClose when cancel is clicked"
- [ ] Create mock onClose function with `vi.fn()`
- [ ] Render PaymentModal with mock onClose
- [ ] Find and click cancel/close button
- [ ] Assert `onClose` was called
- [ ] Test passes: `pnpm test PaymentModal`
- [ ] `pnpm run typecheck` passes

**Notes:**
- Use `fireEvent.click` or `userEvent.click`
- Look for close button by role='button' and name containing 'close' or 'cancel'

**Priority:** 11
**Category:** test
**Complexity:** 2
**Dependencies:** ["US-008"]

---

### US-012: Implement PaymentModal test - handles payment selection
**Description:** As a developer, I need tests verifying payment method selection works.

**Files to modify:**
- `apps/store-app/src/components/checkout/__tests__/PaymentModal.test.tsx` (~25 lines to change)

**Acceptance Criteria:**
- [ ] Replace placeholder test for "handles payment method selection"
- [ ] Render PaymentModal with multiple payment options
- [ ] Click on a payment method option
- [ ] Assert selected state changes or callback is called
- [ ] Test passes: `pnpm test PaymentModal`
- [ ] `pnpm run typecheck` passes

**Notes:**
- Check how PaymentModal handles selection (callback prop or internal state)
- May need to check for visual selected state (class change, checkmark, etc.)

**Priority:** 12
**Category:** test
**Complexity:** 2
**Dependencies:** ["US-010"]

---

### US-013: Implement PaymentModal test - displays correct totals
**Description:** As a developer, I need tests verifying totals are calculated correctly.

**Files to modify:**
- `apps/store-app/src/components/checkout/__tests__/PaymentModal.test.tsx` (~25 lines to change)

**Acceptance Criteria:**
- [ ] Replace placeholder test for "displays correct totals"
- [ ] Render PaymentModal with known subtotal, tax, tip values
- [ ] Assert subtotal displays correctly
- [ ] Assert tax displays correctly
- [ ] Assert total (subtotal + tax + tip) displays correctly
- [ ] Test passes: `pnpm test PaymentModal`
- [ ] `pnpm run typecheck` passes

**Notes:**
- Check PaymentModal props for how totals are passed
- Use specific values like subtotal=100, tax=8.25, tip=15 for easy verification
- Format may be currency ($123.25) - check actual display format

**Priority:** 13
**Category:** test
**Complexity:** 2
**Dependencies:** ["US-008"]

---

### US-014: Implement PaymentModal test - handles payment completion
**Description:** As a developer, I need tests verifying successful payment callback.

**Files to modify:**
- `apps/store-app/src/components/checkout/__tests__/PaymentModal.test.tsx` (~30 lines to change)

**Acceptance Criteria:**
- [ ] Replace placeholder test for "handles payment completion"
- [ ] Create mock onPaymentComplete function
- [ ] Render PaymentModal with required props
- [ ] Simulate completing payment (click pay button after selecting method)
- [ ] Assert onPaymentComplete was called with expected data
- [ ] Test passes: `pnpm test PaymentModal`
- [ ] `pnpm run typecheck` passes

**Notes:**
- Check PaymentModal for onPaymentComplete or similar callback prop
- May need to select payment method first before clicking pay

**Priority:** 14
**Category:** test
**Complexity:** 3
**Dependencies:** ["US-012"]

---

### Phase 2: Technical Debt - TicketPanel Modularization

---

### US-015: Extract TicketPanel types to types.ts
**Description:** As a developer, I need TicketPanel types in a dedicated file.

**Files to modify:**
- `apps/store-app/src/components/checkout/TicketPanel/types.ts` (MODIFY - may need additions)
- `apps/store-app/src/components/checkout/TicketPanel.tsx` (~50 lines to remove/update imports)

**Acceptance Criteria:**
- [ ] All interfaces/types from TicketPanel.tsx moved to types.ts
- [ ] TicketPanel.tsx imports types from './TicketPanel/types'
- [ ] No duplicate type definitions
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm run typecheck` passes

**Notes:**
- Check if types.ts already exists in the TicketPanel folder
- Include TicketPanelProps, any internal state types, callback types
- Keep type exports in barrel file (index.ts)

**Priority:** 15
**Category:** refactor
**Complexity:** 2

---

### US-016: Extract TicketPanel constants to constants.ts
**Description:** As a developer, I need TicketPanel constants in a dedicated file.

**Files to modify:**
- `apps/store-app/src/components/checkout/TicketPanel/constants.ts` (NEW or MODIFY)
- `apps/store-app/src/components/checkout/TicketPanel.tsx` (~20 lines to remove/update imports)

**Acceptance Criteria:**
- [ ] All constants (default values, config objects) moved to constants.ts
- [ ] TicketPanel.tsx imports constants from './TicketPanel/constants'
- [ ] No magic numbers/strings remaining in TicketPanel.tsx
- [ ] `pnpm run typecheck` passes

**Notes:**
- Look for DEFAULT_, INITIAL_, config objects at top of file
- May already have a constants folder/file - check first

**Priority:** 16
**Category:** refactor
**Complexity:** 1
**Dependencies:** ["US-015"]

---

### US-017: Verify TicketPanel hooks are properly extracted
**Description:** As a developer, I need to verify existing hook extractions are complete.

**Files to modify:**
- `apps/store-app/src/components/checkout/TicketPanel.tsx` (audit and potentially remove ~50 lines)
- `apps/store-app/src/components/checkout/hooks/` (verify imports)

**Acceptance Criteria:**
- [ ] Audit TicketPanel.tsx for any inline hook logic that should be in hooks/
- [ ] All complex state management uses extracted hooks from hooks/
- [ ] TicketPanel.tsx imports all hooks from './hooks' or './TicketPanel/hooks'
- [ ] No useState/useEffect with >10 lines of logic inline
- [ ] `pnpm run typecheck` passes

**Notes:**
- hooks/ folder already exists with: useTicketKeyboard.ts, useTicketPersistence.ts, useTicketActions.tsx, etc.
- This story is about VERIFYING completeness, not major refactoring
- Document any remaining inline logic in progress.txt for future stories

**Priority:** 17
**Category:** refactor
**Complexity:** 2
**Dependencies:** ["US-016"]

---

### US-018: Verify TicketPanel components are properly extracted
**Description:** As a developer, I need to verify existing component extractions are complete.

**Files to modify:**
- `apps/store-app/src/components/checkout/TicketPanel.tsx` (audit)
- `apps/store-app/src/components/checkout/components/` (verify imports)

**Acceptance Criteria:**
- [ ] Audit TicketPanel.tsx for any inline JSX that should be in components/
- [ ] All reusable UI sections use extracted components from components/
- [ ] TicketPanel.tsx imports components from './components' or './TicketPanel/components'
- [ ] No JSX blocks >50 lines that could be extracted
- [ ] Document findings in progress.txt
- [ ] `pnpm run typecheck` passes

**Notes:**
- components/ folder already exists with: CatalogPanel.tsx, ClientProfileDialog.tsx, TicketHeader.tsx, etc.
- This story is about VERIFYING completeness
- TicketPanel.tsx should be orchestration (~300 lines) after full modularization

**Priority:** 18
**Category:** refactor
**Complexity:** 2
**Dependencies:** ["US-017"]

---

### Phase 2: Technical Debt - dataService Extraction

---

### US-019: Create appointmentDataService.ts from dataService
**Description:** As a developer, I need appointment operations in a dedicated service.

**Files to modify:**
- `apps/store-app/src/services/domain/appointmentDataService.ts` (NEW)
- `apps/store-app/src/services/domain/index.ts` (NEW or MODIFY)
- `apps/store-app/src/services/dataService.ts` (~200 lines to move)

**Acceptance Criteria:**
- [ ] Create `src/services/domain/` folder if not exists
- [ ] Extract all appointment-related functions to appointmentDataService.ts
- [ ] Export appointmentDataService from domain/index.ts
- [ ] dataService.ts imports and re-exports from appointmentDataService (facade pattern)
- [ ] All existing appointment imports still work (backward compatible)
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm run typecheck` passes

**Notes:**
- Look for functions like: getAppointments, createAppointment, updateAppointment, deleteAppointment
- Use facade pattern: dataService.appointments.* still works, internally calls appointmentDataService
- Keep same function signatures

**Priority:** 19
**Category:** refactor
**Complexity:** 3

---

### US-020: Create clientDataService.ts from dataService
**Description:** As a developer, I need client operations in a dedicated service.

**Files to modify:**
- `apps/store-app/src/services/domain/clientDataService.ts` (NEW)
- `apps/store-app/src/services/domain/index.ts` (MODIFY)
- `apps/store-app/src/services/dataService.ts` (~200 lines to move)

**Acceptance Criteria:**
- [ ] Extract all client-related functions to clientDataService.ts
- [ ] Export clientDataService from domain/index.ts
- [ ] dataService.ts imports and re-exports from clientDataService
- [ ] All existing client imports still work
- [ ] `pnpm run typecheck` passes

**Notes:**
- Look for: getClients, getClientById, createClient, updateClient, searchClients
- Same facade pattern as US-019

**Priority:** 20
**Category:** refactor
**Complexity:** 3
**Dependencies:** ["US-019"]

---

### US-021: Create ticketDataService.ts from dataService
**Description:** As a developer, I need ticket operations in a dedicated service.

**Files to modify:**
- `apps/store-app/src/services/domain/ticketDataService.ts` (NEW)
- `apps/store-app/src/services/domain/index.ts` (MODIFY)
- `apps/store-app/src/services/dataService.ts` (~300 lines to move)

**Acceptance Criteria:**
- [ ] Extract all ticket-related functions to ticketDataService.ts
- [ ] Export ticketDataService from domain/index.ts
- [ ] dataService.ts imports and re-exports from ticketDataService
- [ ] All existing ticket imports still work
- [ ] `pnpm run typecheck` passes

**Notes:**
- Tickets are likely the largest domain - may have many functions
- Look for: getTickets, createTicket, updateTicket, closeTicket, voidTicket

**Priority:** 21
**Category:** refactor
**Complexity:** 3
**Dependencies:** ["US-020"]

---

### US-022: Create staffDataService.ts from dataService
**Description:** As a developer, I need staff operations in a dedicated service.

**Files to modify:**
- `apps/store-app/src/services/domain/staffDataService.ts` (NEW)
- `apps/store-app/src/services/domain/index.ts` (MODIFY)
- `apps/store-app/src/services/dataService.ts` (~150 lines to move)

**Acceptance Criteria:**
- [ ] Extract all staff/team-related functions to staffDataService.ts
- [ ] Export staffDataService from domain/index.ts
- [ ] dataService.ts imports and re-exports from staffDataService
- [ ] All existing staff imports still work
- [ ] `pnpm run typecheck` passes

**Notes:**
- Look for: getStaff, getStaffById, updateStaffStatus, clockIn, clockOut

**Priority:** 22
**Category:** refactor
**Complexity:** 3
**Dependencies:** ["US-021"]

---

### US-023: Create transactionDataService.ts from dataService
**Description:** As a developer, I need transaction operations in a dedicated service.

**Files to modify:**
- `apps/store-app/src/services/domain/transactionDataService.ts` (NEW)
- `apps/store-app/src/services/domain/index.ts` (MODIFY)
- `apps/store-app/src/services/dataService.ts` (~150 lines to move)

**Acceptance Criteria:**
- [ ] Extract all transaction-related functions to transactionDataService.ts
- [ ] Export transactionDataService from domain/index.ts
- [ ] dataService.ts imports and re-exports from transactionDataService
- [ ] All existing transaction imports still work
- [ ] `pnpm run typecheck` passes

**Notes:**
- Look for: getTransactions, createTransaction, refundTransaction

**Priority:** 23
**Category:** refactor
**Complexity:** 3
**Dependencies:** ["US-022"]

---

### US-024: Create catalogDataService.ts from dataService
**Description:** As a developer, I need catalog (services) operations in a dedicated service.

**Files to modify:**
- `apps/store-app/src/services/domain/catalogDataService.ts` (NEW)
- `apps/store-app/src/services/domain/index.ts` (MODIFY)
- `apps/store-app/src/services/dataService.ts` (~100 lines to move)

**Acceptance Criteria:**
- [ ] Extract all service catalog functions to catalogDataService.ts
- [ ] Export catalogDataService from domain/index.ts
- [ ] dataService.ts imports and re-exports from catalogDataService
- [ ] All existing catalog imports still work
- [ ] `pnpm run typecheck` passes

**Notes:**
- Look for: getServices, getServiceCategories, getProducts

**Priority:** 24
**Category:** refactor
**Complexity:** 2
**Dependencies:** ["US-023"]

---

### US-025: Create scheduleDataService.ts from dataService
**Description:** As a developer, I need scheduling operations in a dedicated service.

**Files to modify:**
- `apps/store-app/src/services/domain/scheduleDataService.ts` (NEW)
- `apps/store-app/src/services/domain/index.ts` (MODIFY)
- `apps/store-app/src/services/dataService.ts` (~100 lines to move)

**Acceptance Criteria:**
- [ ] Extract all scheduling functions to scheduleDataService.ts
- [ ] Export scheduleDataService from domain/index.ts
- [ ] dataService.ts imports and re-exports from scheduleDataService
- [ ] All existing schedule imports still work
- [ ] `pnpm run typecheck` passes

**Notes:**
- Look for: getSchedule, getAvailability, getTimeSlots

**Priority:** 25
**Category:** refactor
**Complexity:** 2
**Dependencies:** ["US-024"]

---

### US-026: Create syncDataService.ts from dataService
**Description:** As a developer, I need sync queue operations in a dedicated service.

**Files to modify:**
- `apps/store-app/src/services/domain/syncDataService.ts` (NEW)
- `apps/store-app/src/services/domain/index.ts` (MODIFY)
- `apps/store-app/src/services/dataService.ts` (~150 lines to move)

**Acceptance Criteria:**
- [ ] Extract all sync-related functions to syncDataService.ts
- [ ] Export syncDataService from domain/index.ts
- [ ] dataService.ts imports and re-exports from syncDataService
- [ ] All existing sync imports still work
- [ ] dataService.ts is now <500 lines (facade only)
- [ ] `pnpm run typecheck` passes

**Notes:**
- Look for: addToSyncQueue, processSyncQueue, getSyncStatus
- After this story, dataService.ts should be a thin facade ~300-400 lines

**Priority:** 26
**Category:** refactor
**Complexity:** 3
**Dependencies:** ["US-025"]

---

### Phase 2: Technical Debt - Large File Splitting

---

### US-027: Extract AddTeamMember types and constants
**Description:** As a developer, I need AddTeamMember types/constants extracted.

**Files to modify:**
- `apps/store-app/src/components/team-settings/components/AddTeamMember/types.ts` (NEW)
- `apps/store-app/src/components/team-settings/components/AddTeamMember/constants.ts` (NEW)
- `apps/store-app/src/components/team-settings/components/AddTeamMember/AddTeamMember.tsx` (~100 lines to move)

**Acceptance Criteria:**
- [ ] Create AddTeamMember/ folder if not exists
- [ ] Extract all interfaces/types to types.ts
- [ ] Extract all constants to constants.ts
- [ ] Update imports in AddTeamMember.tsx
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] `pnpm run typecheck` passes

**Notes:**
- AddTeamMember.tsx is 1,516 lines
- First step: extract types and constants before component splitting

**Priority:** 27
**Category:** refactor
**Complexity:** 2

---

### US-028: Extract AddTeamMember form sections to components
**Description:** As a developer, I need AddTeamMember form sections as separate components.

**Files to modify:**
- `apps/store-app/src/components/team-settings/components/AddTeamMember/components/BasicInfoSection.tsx` (NEW)
- `apps/store-app/src/components/team-settings/components/AddTeamMember/components/ContactSection.tsx` (NEW)
- `apps/store-app/src/components/team-settings/components/AddTeamMember/components/index.ts` (NEW)
- `apps/store-app/src/components/team-settings/components/AddTeamMember/AddTeamMember.tsx` (~300 lines to move)

**Acceptance Criteria:**
- [ ] Create components/ folder in AddTeamMember/
- [ ] Extract basic info form section (~100-150 lines)
- [ ] Extract contact info form section (~100-150 lines)
- [ ] Create barrel export in components/index.ts
- [ ] Update imports in AddTeamMember.tsx
- [ ] `pnpm run typecheck` passes

**Notes:**
- Look for logical form groupings (personal info, contact, schedule, etc.)
- Each section component should be <200 lines

**Priority:** 28
**Category:** refactor
**Complexity:** 3
**Dependencies:** ["US-027"]

---

### US-029: Extract AddTeamMember remaining sections and hooks
**Description:** As a developer, I need AddTeamMember fully modularized.

**Files to modify:**
- `apps/store-app/src/components/team-settings/components/AddTeamMember/components/` (multiple NEW)
- `apps/store-app/src/components/team-settings/components/AddTeamMember/hooks/useTeamMemberForm.ts` (NEW)
- `apps/store-app/src/components/team-settings/components/AddTeamMember/AddTeamMember.tsx` (~400 lines remaining)

**Acceptance Criteria:**
- [ ] Extract remaining form sections to components/
- [ ] Extract form logic to useTeamMemberForm.ts hook
- [ ] AddTeamMember.tsx is <500 lines (orchestration only)
- [ ] Create index.ts barrel export for the module
- [ ] `pnpm run typecheck` passes

**Notes:**
- Look for: schedule section, permissions section, pay rate section
- Form state logic goes in hook
- Main component should just compose sections

**Priority:** 29
**Category:** refactor
**Complexity:** 3
**Dependencies:** ["US-028"]

---

### US-030: Extract PaymentModal types and constants
**Description:** As a developer, I need PaymentModal types/constants extracted.

**Files to modify:**
- `apps/store-app/src/components/checkout/PaymentModal/types.ts` (NEW)
- `apps/store-app/src/components/checkout/PaymentModal/constants.ts` (NEW)
- `apps/store-app/src/components/checkout/PaymentModal.tsx` (~80 lines to move)

**Acceptance Criteria:**
- [ ] Create PaymentModal/ folder
- [ ] Extract all interfaces/types to types.ts
- [ ] Extract all constants to constants.ts
- [ ] Update imports in PaymentModal.tsx
- [ ] `pnpm run typecheck` passes

**Notes:**
- PaymentModal.tsx is 1,154 lines
- Same pattern as US-027

**Priority:** 30
**Category:** refactor
**Complexity:** 2

---

### US-031: Extract PaymentModal components and complete modularization
**Description:** As a developer, I need PaymentModal fully modularized.

**Files to modify:**
- `apps/store-app/src/components/checkout/PaymentModal/components/` (multiple NEW)
- `apps/store-app/src/components/checkout/PaymentModal/hooks/` (NEW)
- `apps/store-app/src/components/checkout/PaymentModal.tsx` → `PaymentModal/PaymentModal.tsx`

**Acceptance Criteria:**
- [ ] Extract payment method selector component
- [ ] Extract summary/totals display component
- [ ] Extract payment processing hook
- [ ] Create index.ts barrel export
- [ ] PaymentModal.tsx is <500 lines
- [ ] All existing imports still work (backward compatible)
- [ ] `pnpm run typecheck` passes

**Notes:**
- Update the barrel export to maintain backward compatibility
- Look for: PaymentMethodSelector, PaymentSummary, TipSelector, etc.

**Priority:** 31
**Category:** refactor
**Complexity:** 4
**Dependencies:** ["US-030"]

---

## Functional Requirements

| ID | Story | Requirement |
|----|-------|-------------|
| FR-1 | US-001, US-002 | Vitest coverage includes all critical paths with thresholds |
| FR-2 | US-003 to US-006 | Feature flag errors are logged, not silently swallowed |
| FR-3 | US-007 | Production builds have no console.log statements |
| FR-4 | US-008 to US-014 | PaymentModal has real test coverage |
| FR-5 | US-015 to US-018 | TicketPanel is properly modularized |
| FR-6 | US-019 to US-026 | dataService is split into domain services |
| FR-7 | US-027 to US-031 | Large files are split to <500 lines |

## Non-Goals (Out of Scope)

- No new features - purely technical debt and foundation work
- No changes to business logic or user-facing behavior
- No OperationTemplateSetup.tsx or TimesheetSection.tsx splitting (future phase)
- No test coverage increase beyond PaymentModal (future phase)
- No performance optimizations (future phase)

## Technical Considerations

### Existing Patterns to Follow

| Pattern | Reference File |
|---------|---------------|
| Module structure | `src/components/checkout/TicketPanel/` (already has hooks/, components/) |
| Domain services | `src/services/supabase/tables/` (similar pattern) |
| Type adapters | `src/services/supabase/adapters/` |
| Test setup | `src/components/checkout/__tests__/TicketPanel.test.tsx` |

### File Sizes After Completion

| File | Before | After (Target) |
|------|--------|----------------|
| dataService.ts | 3,090 | <500 (facade) |
| TicketPanel.tsx | 1,668 | <400 (orchestration) |
| AddTeamMember.tsx | 1,516 | <500 |
| PaymentModal.tsx | 1,154 | <500 |
| featureFlags.ts | 345 | ~360 (minimal change) |

### Risks

1. **Breaking existing imports** - Mitigated by facade pattern for dataService
2. **Test regressions** - Run full test suite after each story
3. **Type errors from extraction** - Run typecheck after every file move

## Open Questions

1. Should coverage thresholds be lower initially (40/30/40/40) to avoid immediate CI failures?
2. Should OperationTemplateSetup.tsx and TimesheetSection.tsx splitting be added to Phase 3?

---

## Execution Order Summary

1. **US-001, US-002**: Vitest config (quick wins)
2. **US-003 to US-006**: Fix silent errors (quick fixes)
3. **US-007**: Add console removal plugin
4. **US-008 to US-014**: PaymentModal tests (enables safe refactoring)
5. **US-015 to US-018**: Verify/complete TicketPanel modularization
6. **US-019 to US-026**: Extract dataService domains (major refactor)
7. **US-027 to US-031**: Split remaining large files

---

*Generated for Ralph autonomous execution. Each story is sized for one iteration.*
