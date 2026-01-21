# PRD: Client Module Complete Build-Out

## Introduction

Complete implementation of all remaining client module features to achieve 100% PRD compliance. The module is currently 48% complete (63 of 131 requirements). This PRD covers client merging, booking safety controls, GDPR compliance, form enhancements, segmentation, loyalty, automation, and multi-store client sharing.

**Source Documents:**
- `docs/product/PRD-Clients-CRM-Module.md` (Version 6.0)
- `docs/architecture/MULTI_STORE_CLIENT_SPEC.md`

---

## Goals

- Achieve 100% PRD compliance for client module
- Enable client data merging with full audit trail
- Enforce patch test and block requirements in booking flows
- Full GDPR compliance (export, deletion, consent)
- Enhanced form builder with signatures and PDF export
- Custom segment builder and improved import/export
- Loyalty program configuration and engagement automation
- Multi-store client sharing (Tier 1 & 2)

---

## Phases Overview (6 Phases)

| Phase | Focus | Stories | Review | Test Gate |
|-------|-------|---------|--------|-----------|
| 1 | Client Safety & Booking Controls | 21 + 2 | US-P1R, US-P1F | Merge clients, blocked client can't book, patch test warning shows |
| 2 | GDPR Compliance | 12 + 2 | US-P2R, US-P2F | Export data, request deletion, verify anonymization |
| 3 | Forms & Signatures | 10 + 2 | US-P3R, US-P3F | Create form with signature, export PDF, send via email |
| 4 | Segmentation & Data Management | 15 + 2 | US-P4R, US-P4F | Create custom segment, import CSV with duplicates |
| 5 | Engagement & Loyalty | 17 + 2 | US-P5R, US-P5F | Configure tiers, auto review request after checkout |
| 6 | Multi-Store Sharing | 20 + 3 | US-P6R, US-P6F, US-FINAL | Cross-brand lookup, organization sharing |

**Total: ~108 stories** (95 implementation + 13 review/remediation)

**Review Stories Pattern:**
- **US-PxR:** UltraThink review using Architect, Research, Coder, and Tester agents
- **US-PxF:** Fix all issues found in review before moving to next phase
- **US-FINAL:** Complete module verification before merge to main

---

# PHASE 1: Client Safety & Booking Controls

**Focus:** Client merging, block enforcement, and patch test enforcement - all safety-critical features.

**Test Gate:**
1. Merge two clients → data consolidated, secondary archived
2. Blocked client cannot book online → generic error shown
3. Book service requiring patch test → warning banner appears, override works

---

## 1.1 Client Merging

### US-001: Add merge columns to clients table
**Description:** As a developer, I need database columns to track merged clients.

**Files to modify:**
- `supabase/migrations/031_client_merge.sql` (NEW, ~30 lines)

**Acceptance Criteria:**
- [ ] Add `merged_into_id UUID REFERENCES clients(id)` column
- [ ] Add `merged_at TIMESTAMPTZ` column
- [ ] Add `merged_by UUID` column (staff who performed merge)
- [ ] Add index on `merged_into_id` for query performance
- [ ] Migration runs without errors: `supabase db push`

**Notes:**
- Follow migration pattern from `030_create_member_session_revocations.sql`
- Use `ALTER TABLE` not `CREATE TABLE`

**Priority:** 1

---

### US-002: Create merge_clients Supabase RPC function
**Description:** As a developer, I need a database function to atomically merge two clients.

**Files to modify:**
- `supabase/migrations/031_client_merge.sql` (append ~80 lines)

**Acceptance Criteria:**
- [ ] Create RPC `merge_clients(primary_id UUID, secondary_id UUID, options JSONB, merged_by UUID)`
- [ ] Re-link all appointments from secondary to primary
- [ ] Re-link all tickets from secondary to primary
- [ ] Re-link all transactions from secondary to primary
- [ ] Merge notes if `options.mergeNotes = true`
- [ ] Combine loyalty points if `options.mergeLoyalty = true`
- [ ] Set `merged_into_id`, `merged_at`, `merged_by` on secondary
- [ ] Return merged client data
- [ ] Function is transactional (all or nothing)

**Notes:**
- Use `BEGIN...EXCEPTION...END` for transaction safety
- Reference existing RPC patterns in migrations folder

**Priority:** 2

---

### US-003: Add merge types to clientsSlice types
**Description:** As a developer, I need TypeScript types for merge operations.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/types.ts` (~20 lines)

**Acceptance Criteria:**
- [ ] Add `MergeClientOptions` interface with: `mergeNotes`, `mergeLoyalty`, `mergePreferences`, `mergeAlerts`
- [ ] Add `MergeClientParams` interface with: `primaryClientId`, `secondaryClientId`, `options`, `mergedBy`
- [ ] Add `mergedIntoId`, `mergedAt`, `mergedBy` to Client interface
- [ ] pnpm run typecheck passes

**Notes:**
- Follow existing type patterns in file

**Priority:** 3

---

### US-004: Create mergeClientsInSupabase thunk
**Description:** As a developer, I need a Redux thunk to call the merge RPC.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/thunks.ts` (~40 lines)

**Acceptance Criteria:**
- [ ] Export `mergeClientsInSupabase` async thunk
- [ ] Parameters: `primaryClientId`, `secondaryClientId`, `options`, `mergedBy`
- [ ] Call Supabase RPC `merge_clients`
- [ ] On success, update Redux state to remove secondary client
- [ ] On success, refresh primary client data
- [ ] Log to audit trail
- [ ] Return merged client or error
- [ ] No forbidden strings: 'Test Client', 'as any'
- [ ] pnpm run typecheck passes

**Notes:**
- Follow pattern from `createClientInSupabase` thunk (lines 70-95)
- Import from existing Supabase client

**Priority:** 4

---

### US-005: Activate MergeClientsModal component
**Description:** As a developer, I need to restore the merge modal from backup.

**Files to modify:**
- `apps/store-app/src/components/client-settings/MergeClientsModal.tsx.bak` → rename to `.tsx`
- `apps/store-app/src/components/client-settings/MergeClientsModal.tsx` (~10 lines to fix)

**Acceptance Criteria:**
- [ ] Rename `MergeClientsModal.tsx.bak` to `MergeClientsModal.tsx`
- [ ] Update import path for `mergeClientsInSupabase` (now exists)
- [ ] Verify all imports resolve correctly
- [ ] Component renders without errors
- [ ] No forbidden strings: 'as any', 'void _'
- [ ] pnpm run typecheck passes

**Notes:**
- The .bak file is 389 lines with full UI already implemented
- Only need to fix import path since thunk now exists

**Priority:** 5

---

### US-006: Add merge button to ClientSettings
**Description:** As a staff member, I want to access the merge functionality from client details.

**Files to modify:**
- `apps/store-app/src/components/client-settings/ClientSettings.tsx` (~25 lines)

**Acceptance Criteria:**
- [ ] Import `MergeClientsModal` component
- [ ] Add "Merge with Another Client" button in actions area
- [ ] Button opens client search to select secondary client
- [ ] After selection, opens MergeClientsModal with both client IDs
- [ ] Button only visible to users with merge permission
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: button appears, modal opens

**Notes:**
- Follow pattern from existing action buttons in ClientSettings
- Use existing client search component

**Priority:** 6

---

### US-007: Add merge audit logging
**Description:** As a business owner, I need audit trail for all merge operations.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/thunks.ts` (~15 lines in mergeClientsInSupabase)

**Acceptance Criteria:**
- [ ] Log merge event with: timestamp, primaryId, secondaryId, options, staffId
- [ ] Store in audit_logs table (or create if not exists)
- [ ] Include before/after state for both clients
- [ ] pnpm run typecheck passes

**Notes:**
- Check if audit_logs table exists, if not create migration
- Follow existing audit patterns in codebase

**Priority:** 7

---

## 1.2 Block Client Enforcement

### US-008: Create check-booking-eligibility Edge Function
**Description:** As a developer, I need an endpoint to check if client can book.

**Files to modify:**
- `supabase/functions/check-booking-eligibility/index.ts` (NEW, ~50 lines)

**Acceptance Criteria:**
- [ ] POST `/check-booking-eligibility` endpoint
- [ ] Accept: `clientId` or `email` or `phone`
- [ ] Check if client is blocked (`isBlocked` field)
- [ ] Return generic message if blocked: "Unable to book at this time"
- [ ] Do NOT reveal that client is blocked (privacy)
- [ ] Return: `{ eligible: boolean, message?: string }`
- [ ] pnpm run typecheck passes

**Notes:**
- Security: Never expose blocking reason to client
- Reference `blockClient` thunk for field names

**Priority:** 8

---

### US-009: Add eligibility check to Online Store booking
**Description:** As a system, blocked clients should not be able to complete online booking.

**Files to modify:**
- `apps/online-store/src/components/booking/DetailsStep.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] When client enters email/phone, call `check-booking-eligibility`
- [ ] If not eligible, show generic error: "Unable to complete booking. Please call the salon."
- [ ] Do NOT reveal blocking reason
- [ ] Prevent form submission if not eligible
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: blocked client cannot book

**Notes:**
- Check eligibility on blur of email/phone field
- Use debounce to avoid excessive API calls

**Priority:** 9

---

### US-010: Create BlockedClientOverrideModal
**Description:** As a staff member, I need to override block for special cases.

**Files to modify:**
- `apps/store-app/src/components/clients/BlockedClientOverrideModal.tsx` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Props: `clientId`, `clientName`, `blockReason`, `onOverride`, `onCancel`
- [ ] Show block reason to staff (they can see it)
- [ ] Require override reason (mandatory text input)
- [ ] Require manager approval checkbox
- [ ] "Proceed with Booking" and "Cancel" buttons
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow modal pattern from `BlockClientModal.tsx`

**Priority:** 10

---

### US-011: Integrate block check into Store App booking
**Description:** As a staff member, I should see warning when booking blocked client.

**Files to modify:**
- `apps/store-app/src/components/Book/BookingForm.tsx` (~25 lines)

**Acceptance Criteria:**
- [ ] When selecting blocked client, show `BlockedClientOverrideModal`
- [ ] Staff must provide reason to proceed
- [ ] Log all override attempts
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: book for blocked client shows warning

**Priority:** 11

---

### US-012: Add block override audit logging
**Description:** As a business owner, I need to track block overrides.

**Files to modify:**
- `apps/store-app/src/components/Book/BookingForm.tsx` (~10 lines)

**Acceptance Criteria:**
- [ ] Log override: timestamp, staffId, clientId, blockReason, overrideReason
- [ ] Store in audit_logs table
- [ ] pnpm run typecheck passes

**Priority:** 12

---

## 1.3 Patch Test Enforcement

### US-013: Create validate-booking Edge Function
**Description:** As a developer, I need centralized booking validation including patch test checks.

**Files to modify:**
- `supabase/functions/validate-booking/index.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] POST `/validate-booking` endpoint
- [ ] Accept: `clientId`, `serviceId`, `appointmentDate`
- [ ] Check if service requires patch test (`requiresPatchTest` field)
- [ ] If required, check client has valid (non-expired) patch test for that service
- [ ] Return: `{ valid: boolean, reason?: string, canOverride?: boolean }`
- [ ] Return specific reasons: 'patch_test_required', 'patch_test_expired', 'client_blocked'
- [ ] pnpm run typecheck passes

**Notes:**
- Reference existing Edge Function patterns in `supabase/functions/clients/index.ts`
- Query `client_patch_tests` table (check if exists)

**Priority:** 13

---

### US-014: Add checkPatchTestRequired thunk
**Description:** As a developer, I need a thunk to call the validation Edge Function.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/thunks.ts` (~30 lines)

**Acceptance Criteria:**
- [ ] Export `checkPatchTestRequired` async thunk
- [ ] Parameters: `clientId`, `serviceId`, `appointmentDate`
- [ ] Call `validate-booking` Edge Function
- [ ] Return validation result with reason
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes

**Notes:**
- Follow pattern from existing Supabase function calls

**Priority:** 14

---

### US-015: Create PatchTestWarningBanner component
**Description:** As a staff member, I need to see a warning when booking requires patch test.

**Files to modify:**
- `apps/store-app/src/components/Book/PatchTestWarningBanner.tsx` (NEW, ~60 lines)

**Acceptance Criteria:**
- [ ] Props: `clientName`, `serviceName`, `reason` ('required' | 'expired'), `onOverride`, `onCancel`
- [ ] Yellow warning banner with TestTube icon
- [ ] Shows message: "Patch test required for [service]" or "Patch test expired"
- [ ] "Override" button (with confirmation) and "Cancel Booking" button
- [ ] Override requires reason input
- [ ] Follows design tokens from `@/design-system`
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow banner pattern from `StaffAlertBanner.tsx`
- Use existing warning color tokens

**Priority:** 15

---

### US-016: Integrate patch test check into Book module
**Description:** As a staff member, booking should check patch test requirements.

**Files to modify:**
- `apps/store-app/src/components/Book/BookingForm.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Before creating appointment, call `checkPatchTestRequired`
- [ ] If validation fails, show `PatchTestWarningBanner`
- [ ] If staff overrides, log override reason and proceed
- [ ] If cancelled, return to service selection
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: book service with patch test requirement

**Notes:**
- Find the appointment creation handler
- Add validation check before Supabase insert

**Priority:** 16

---

### US-017: Add patch test validation to Online Store
**Description:** As a customer, I should be informed if a service requires patch test.

**Files to modify:**
- `apps/online-store/src/components/booking/ServiceSelectionStep.tsx` (~25 lines)

**Acceptance Criteria:**
- [ ] When selecting service that requires patch test, show info message
- [ ] Message: "This service requires a patch test. Please visit the salon first."
- [ ] If client has no valid patch test, disable booking for that service
- [ ] If client has valid patch test, allow booking normally
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: Online Store service selection

**Notes:**
- May need to fetch client patch tests on page load
- Follow existing conditional rendering patterns

**Priority:** 17

---

### US-018: Add patch test override audit logging
**Description:** As a business owner, I need to track when staff override patch test requirements.

**Files to modify:**
- `apps/store-app/src/components/Book/BookingForm.tsx` (~15 lines)

**Acceptance Criteria:**
- [ ] When staff overrides patch test warning, log: timestamp, staffId, clientId, serviceId, reason
- [ ] Store in audit_logs table
- [ ] pnpm run typecheck passes

**Notes:**
- Use same audit pattern from merge functionality

**Priority:** 18

---

## 1.4 Phase 1 Tests

### US-019: Add merge functionality tests
**Description:** As a developer, I need tests for merge logic.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/__tests__/merge.test.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Test: mergeClientsInSupabase thunk dispatches correctly
- [ ] Test: Redux state updates after successful merge
- [ ] Test: Secondary client removed from state
- [ ] Test: Error handling for invalid client IDs
- [ ] All tests pass

**Priority:** 19

---

### US-020: Add block enforcement tests
**Description:** As a developer, I need tests for block enforcement.

**Files to modify:**
- `apps/store-app/src/components/Book/__tests__/blockClient.test.ts` (NEW, ~60 lines)

**Acceptance Criteria:**
- [ ] Test: Blocked client cannot book via Online Store
- [ ] Test: Staff sees override modal for blocked client
- [ ] Test: Override requires reason
- [ ] All tests pass

**Priority:** 20

---

### US-021: Add patch test enforcement tests
**Description:** As a developer, I need tests for patch test validation.

**Files to modify:**
- `apps/store-app/src/components/Book/__tests__/patchTest.test.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Test: Booking blocked when patch test required but missing
- [ ] Test: Booking blocked when patch test expired
- [ ] Test: Booking allowed when valid patch test exists
- [ ] Test: Override flow works correctly
- [ ] All tests pass

**Priority:** 21

---

## 1.5 Phase 1 Review & Remediation

### US-P1R: UltraThink Review of Phase 1 Implementation
**Description:** As a developer, I need comprehensive validation of all Phase 1 features before moving to Phase 2.

**Review Method:** Use `/ultrathink` skill with Architect, Research, Coder, and Tester agents.

**Acceptance Criteria:**
- [ ] **Architect Agent:** Verify database schema design (merge columns, RPC function, audit tables)
- [ ] **Coder Agent:** Review all new thunks, components, and Edge Functions for:
  - Type safety (no `as any`, proper interfaces)
  - Error handling completeness
  - Code patterns consistency with existing codebase
  - No forbidden strings in production code
- [ ] **Tester Agent:** Verify test coverage and quality:
  - All acceptance criteria from US-001 to US-021 actually implemented
  - Unit tests cover edge cases
  - Integration points tested
- [ ] **Security Check:** Verify audit logging captures all required data
- [ ] **UX Review:** Check modal flows, error messages, warning banners
- [ ] Document all issues found in `scripts/ralph/runs/client-module-phase1/review-findings.md`
- [ ] Categorize issues as: Critical, Major, Minor

**Notes:**
- Run `pnpm run typecheck` and `pnpm test` before review
- Check browser manually for UI components
- This story produces a review report, not code changes

**Priority:** 22

---

### US-P1F: Address Phase 1 Review Findings
**Description:** As a developer, I need to fix all issues identified in the Phase 1 review.

**Files to modify:**
- Files identified in `review-findings.md`

**Acceptance Criteria:**
- [ ] All Critical issues resolved
- [ ] All Major issues resolved
- [ ] Minor issues documented for future cleanup (if not blocking)
- [ ] Re-run typecheck: `pnpm run typecheck` passes
- [ ] Re-run tests: `pnpm test` passes
- [ ] Update `review-findings.md` with resolution status
- [ ] **Test Gate Verification:**
  1. Merge two clients → data consolidated, secondary archived
  2. Blocked client cannot book online → generic error shown
  3. Book service requiring patch test → warning banner appears, override works

**Notes:**
- Focus on Critical and Major issues first
- If an issue requires significant rework, document why and proceed
- This story must pass before starting Phase 2

**Priority:** 23

---

# PHASE 2: GDPR Compliance

**Focus:** Full GDPR/CCPA compliance including data export, deletion requests, and consent tracking.

**Test Gate:**
1. Export all client data as JSON
2. Request account deletion → 30-day pending period
3. After processing, verify PII anonymized but transactions retained

---

### US-022: Create client_data_requests table migration
**Description:** As a developer, I need a table to track GDPR data requests.

**Files to modify:**
- `supabase/migrations/032_gdpr_compliance.sql` (NEW, ~60 lines)

**Acceptance Criteria:**
- [ ] Create `client_data_requests` table with columns:
  - `id UUID PRIMARY KEY`
  - `client_id UUID NOT NULL REFERENCES clients(id)`
  - `request_type TEXT CHECK (request_type IN ('export', 'delete', 'access'))`
  - `status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))`
  - `requested_at TIMESTAMPTZ DEFAULT NOW()`
  - `scheduled_deletion_at TIMESTAMPTZ` (30 days from request)
  - `processed_at TIMESTAMPTZ`
  - `processed_by UUID`
  - `cancellation_reason TEXT`
- [ ] Create `data_retention_logs` table for audit
- [ ] Add `gdpr_consent_at`, `marketing_consent` columns to clients table
- [ ] Migration runs without errors

**Notes:**
- 30-day deletion delay is GDPR best practice

**Priority:** 22

---

### US-023: Create GDPR data requests thunks
**Description:** As a developer, I need thunks to manage data requests.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/thunks.ts` (~80 lines)

**Acceptance Criteria:**
- [ ] Export `createDataDeletionRequest` thunk
- [ ] Export `cancelDataDeletionRequest` thunk
- [ ] Export `processDataDeletion` thunk (for scheduled processing)
- [ ] Export `exportClientData` thunk
- [ ] Export `fetchClientDataRequests` thunk
- [ ] All thunks handle errors appropriately
- [ ] pnpm run typecheck passes

**Notes:**
- Deletion should anonymize, not hard delete (keep transaction integrity)

**Priority:** 23

---

### US-024: Create process-data-deletion Edge Function
**Description:** As a developer, I need backend logic for GDPR deletion.

**Files to modify:**
- `supabase/functions/process-data-deletion/index.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] POST `/process-data-deletion` endpoint
- [ ] Accept: `requestId`
- [ ] Verify 30-day waiting period has passed
- [ ] Anonymize client data: replace name with "Deleted User", clear email, phone, address
- [ ] Keep transaction records with anonymized client reference
- [ ] Delete: notes, preferences, photos, custom fields
- [ ] Update request status to 'completed'
- [ ] Log all actions to audit table
- [ ] Return success/failure

**Notes:**
- GDPR requires keeping financial records for legal compliance
- Only PII is deleted, not transaction history

**Priority:** 24

---

### US-025: Create export-client-data Edge Function
**Description:** As a developer, I need endpoint to export all client data.

**Files to modify:**
- `supabase/functions/export-client-data/index.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] GET `/export-client-data/:clientId` endpoint
- [ ] Gather all client data: profile, appointments, transactions, notes, forms
- [ ] Return as JSON (GDPR portable format)
- [ ] Include metadata: export date, data categories included
- [ ] Log export request to audit table
- [ ] Rate limit: 1 export per client per 24 hours

**Priority:** 25

---

### US-026: Create DataDeletionRequestModal for Online Store
**Description:** As a customer, I want to request deletion of my data.

**Files to modify:**
- `apps/online-store/src/components/account/DataDeletionRequestModal.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Props: `clientId`, `clientEmail`, `onConfirm`, `onCancel`
- [ ] Show warning: "Your data will be permanently deleted in 30 days"
- [ ] List what will be deleted vs retained (transactions)
- [ ] Require confirmation checkbox
- [ ] Email verification step (send code)
- [ ] "Request Deletion" and "Cancel" buttons
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow modal patterns from Online Store

**Priority:** 26

---

### US-027: Add Delete Account button to Online Store Account page
**Description:** As a customer, I need access to delete my account.

**Files to modify:**
- `apps/online-store/src/pages/Account.tsx` (~20 lines)

**Acceptance Criteria:**
- [ ] Add "Delete My Account" button in account settings section
- [ ] Button opens `DataDeletionRequestModal`
- [ ] After request submitted, show confirmation message
- [ ] Show pending deletion status if request exists
- [ ] Allow cancellation of pending request
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: Account page shows delete option

**Priority:** 27

---

### US-028: Create DataRequestsPanel for Store App
**Description:** As a staff member, I need to manage data deletion requests.

**Files to modify:**
- `apps/store-app/src/components/client-settings/components/DataRequestsPanel.tsx` (NEW, ~120 lines)

**Acceptance Criteria:**
- [ ] Show list of pending data requests
- [ ] Display: client name, request type, requested date, scheduled deletion date
- [ ] "Process Now" button (for immediate processing with manager approval)
- [ ] "Cancel Request" button with reason input
- [ ] Filter by status: Pending, Completed, Cancelled
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Add to ClientSettings as new section

**Priority:** 28

---

### US-029: Add consent tracking to client profile
**Description:** As a business owner, I need to track client consent.

**Files to modify:**
- `apps/store-app/src/components/client-settings/sections/ProfileSection.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Display consent status: GDPR consent date, Marketing consent (yes/no)
- [ ] Allow updating consent preferences
- [ ] Log consent changes to audit table
- [ ] Show warning if no GDPR consent recorded
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: consent fields visible in profile

**Priority:** 29

---

### US-030: Add data export download to Online Store
**Description:** As a customer, I want to download my data.

**Files to modify:**
- `apps/online-store/src/pages/Account.tsx` (~25 lines)

**Acceptance Criteria:**
- [ ] Add "Download My Data" button
- [ ] Call export-client-data endpoint
- [ ] Download as JSON file
- [ ] Show loading state during export
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: download works

**Priority:** 30

---

### US-031: Create scheduled deletion processor
**Description:** As a system, I need to auto-process deletions after 30 days.

**Files to modify:**
- `supabase/functions/scheduled-deletion-processor/index.ts` (NEW, ~50 lines)

**Acceptance Criteria:**
- [ ] Query all requests where `scheduled_deletion_at <= NOW()` and `status = 'pending'`
- [ ] Call `process-data-deletion` for each
- [ ] Log results
- [ ] Configure as Supabase scheduled function (daily at 2 AM)

**Notes:**
- Use Supabase pg_cron for scheduling

**Priority:** 31

---

### US-032: Add GDPR compliance tests
**Description:** As a developer, I need tests for GDPR functionality.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/__tests__/gdpr.test.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Test: Create deletion request
- [ ] Test: Cancel deletion request
- [ ] Test: Export client data includes all categories
- [ ] Test: Deletion anonymizes PII but keeps transactions
- [ ] Test: 30-day waiting period enforced
- [ ] All tests pass

**Priority:** 32

---

### US-033: Add privacy policy link and consent flow
**Description:** As a customer, I need proper consent and privacy information.

**Files to modify:**
- `apps/online-store/src/pages/Account.tsx` (~10 lines)

**Acceptance Criteria:**
- [ ] Add "Privacy Policy" link in footer of account page
- [ ] Link to `/privacy-policy` page
- [ ] pnpm run typecheck passes

**Priority:** 33

---

## 2.2 Phase 2 Review & Remediation

### US-P2R: UltraThink Review of Phase 2 Implementation
**Description:** As a developer, I need comprehensive validation of all GDPR features before moving to Phase 3.

**Review Method:** Use `/ultrathink` skill with Architect, Research, Coder, and Tester agents.

**Acceptance Criteria:**
- [ ] **Architect Agent:** Verify GDPR schema design:
  - `client_data_requests` table structure
  - `data_retention_logs` audit table
  - Consent columns on clients table
- [ ] **Coder Agent:** Review GDPR implementation for:
  - 30-day waiting period correctly enforced
  - Anonymization preserves transaction integrity
  - Export includes all required data categories
  - Email/notification flows work correctly
- [ ] **Tester Agent:** Verify:
  - All acceptance criteria from US-022 to US-033 implemented
  - Deletion actually anonymizes PII
  - Export produces valid JSON
- [ ] **Security Check:**
  - No PII exposed in logs
  - Rate limiting on export endpoint
  - Email verification for deletion requests
- [ ] Document all issues in `scripts/ralph/runs/client-module-phase2/review-findings.md`

**Notes:**
- GDPR compliance is critical - be thorough
- Check Edge Functions for proper error handling

**Priority:** 34

---

### US-P2F: Address Phase 2 Review Findings
**Description:** As a developer, I need to fix all issues identified in the Phase 2 review.

**Files to modify:**
- Files identified in `review-findings.md`

**Acceptance Criteria:**
- [ ] All Critical issues resolved (especially data privacy issues)
- [ ] All Major issues resolved
- [ ] Re-run typecheck and tests
- [ ] **Test Gate Verification:**
  1. Export all client data as JSON → file downloads correctly
  2. Request account deletion → 30-day pending period works
  3. After processing → PII anonymized, transactions retained

**Priority:** 35

---

# PHASE 3: Forms & Signatures

**Focus:** Enhanced form builder with e-signatures, PDF export, and email/SMS delivery.

**Test Gate:**
1. Create consultation form with signature field
2. Client fills out and signs form
3. Export completed form as PDF
4. Send form link via email

---

### US-034: Create SignaturePad component
**Description:** As a developer, I need a signature capture component.

**Files to modify:**
- `apps/store-app/src/components/forms/SignaturePad.tsx` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Use `react-signature-canvas` library
- [ ] Props: `onSave(dataUrl: string)`, `onClear`, `width`, `height`
- [ ] Canvas with touch/mouse drawing support
- [ ] "Clear" button to reset
- [ ] "Save" button to capture as PNG data URL
- [ ] Responsive sizing
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Install: `pnpm add react-signature-canvas @types/react-signature-canvas`

**Priority:** 34

---

### US-035: Add signature field type to FormBuilder
**Description:** As a staff member, I want to add signature fields to forms.

**Files to modify:**
- `apps/store-app/src/components/forms/FormBuilder.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Add "Signature" option to field type selector
- [ ] Signature section renders `SignaturePad` in preview
- [ ] Signature data stored as base64 PNG
- [ ] Required/optional toggle for signature
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: add signature field to form

**Priority:** 35

---

### US-036: Create PDF export service
**Description:** As a developer, I need to export forms as PDF.

**Files to modify:**
- `apps/store-app/src/services/forms/pdfExportService.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Use `@react-pdf/renderer` library
- [ ] Export `generateFormPdf(formData, responses): Promise<Blob>`
- [ ] Include: form title, client name, date, all responses
- [ ] Include signature images inline
- [ ] Professional formatting with salon branding
- [ ] pnpm run typecheck passes

**Notes:**
- Install: `pnpm add @react-pdf/renderer`

**Priority:** 36

---

### US-037: Add PDF export button to form viewer
**Description:** As a staff member, I want to export completed forms as PDF.

**Files to modify:**
- `apps/store-app/src/components/client-settings/components/FormResponseViewer.tsx` (~20 lines)

**Acceptance Criteria:**
- [ ] Add "Export PDF" button to form response viewer
- [ ] Button calls `generateFormPdf` and triggers download
- [ ] Show loading state during generation
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: export form as PDF

**Priority:** 37

---

### US-038: Create form email delivery service
**Description:** As a developer, I need to send forms via email.

**Files to modify:**
- `supabase/functions/send-form-email/index.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] POST `/send-form-email` endpoint
- [ ] Accept: `clientEmail`, `formId`, `formUrl`
- [ ] Send professional email with link to complete form
- [ ] Include salon branding and instructions
- [ ] Track email sent status
- [ ] Return success/failure

**Notes:**
- Use Supabase email integration or configure SMTP

**Priority:** 38

---

### US-039: Add email delivery to FormBuilder
**Description:** As a staff member, I want to send forms to clients via email.

**Files to modify:**
- `apps/store-app/src/components/forms/FormBuilder.tsx` (~25 lines)

**Acceptance Criteria:**
- [ ] Add "Send via Email" button when form has linked client
- [ ] Call `send-form-email` Edge Function
- [ ] Show success/error toast
- [ ] Track delivery status in form record
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: send form email

**Priority:** 39

---

### US-040: Create form SMS delivery service
**Description:** As a developer, I need to send form links via SMS.

**Files to modify:**
- `supabase/functions/send-form-sms/index.ts` (NEW, ~60 lines)

**Acceptance Criteria:**
- [ ] POST `/send-form-sms` endpoint
- [ ] Accept: `clientPhone`, `formId`, `formUrl`
- [ ] Send SMS with short link to form
- [ ] Track SMS sent status
- [ ] Return success/failure

**Notes:**
- Use Twilio or similar SMS provider
- May need environment variables for API keys

**Priority:** 40

---

### US-041: Add SMS delivery to FormBuilder
**Description:** As a staff member, I want to send forms via SMS.

**Files to modify:**
- `apps/store-app/src/components/forms/FormBuilder.tsx` (~20 lines)

**Acceptance Criteria:**
- [ ] Add "Send via SMS" button when client has phone
- [ ] Call `send-form-sms` Edge Function
- [ ] Show success/error toast
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: send form SMS

**Priority:** 41

---

### US-042: Add consent checkbox field type
**Description:** As a staff member, I need consent checkboxes with legal text.

**Files to modify:**
- `apps/store-app/src/components/forms/FormBuilder.tsx` (~25 lines)

**Acceptance Criteria:**
- [ ] Consent field type has: label, legal text (expandable), required toggle
- [ ] Renders as checkbox with "I agree to..." text
- [ ] Legal text shown in expandable section
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: consent field works

**Priority:** 42

---

### US-043: Add form builder tests
**Description:** As a developer, I need tests for form builder enhancements.

**Files to modify:**
- `apps/store-app/src/components/forms/__tests__/formBuilder.test.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Test: SignaturePad captures signature
- [ ] Test: PDF export generates valid blob
- [ ] Test: Email delivery calls correct endpoint
- [ ] All tests pass

**Priority:** 43

---

## 3.2 Phase 3 Review & Remediation

### US-P3R: UltraThink Review of Phase 3 Implementation
**Description:** As a developer, I need comprehensive validation of forms and signature features before moving to Phase 4.

**Review Method:** Use `/ultrathink` skill with Architect, Research, Coder, and Tester agents.

**Acceptance Criteria:**
- [ ] **Architect Agent:** Verify form system design:
  - SignaturePad integration with form builder
  - PDF generation service architecture
  - Email/SMS delivery flow
- [ ] **Coder Agent:** Review implementation for:
  - Signature capture works on touch and mouse devices
  - PDF output includes all form data and signatures
  - Email templates are professional and branded
  - Consent field captures legal text properly
- [ ] **Tester Agent:** Verify:
  - All acceptance criteria from US-034 to US-043 implemented
  - PDF renders correctly in different viewers
  - Forms can be filled and submitted via email link
- [ ] **UX Review:**
  - Form builder is intuitive
  - Signature pad is responsive
  - PDF layout is professional
- [ ] Document all issues in `scripts/ralph/runs/client-module-phase3/review-findings.md`

**Priority:** 44

---

### US-P3F: Address Phase 3 Review Findings
**Description:** As a developer, I need to fix all issues identified in the Phase 3 review.

**Files to modify:**
- Files identified in `review-findings.md`

**Acceptance Criteria:**
- [ ] All Critical issues resolved
- [ ] All Major issues resolved
- [ ] Re-run typecheck and tests
- [ ] **Test Gate Verification:**
  1. Create consultation form with signature field → form saves correctly
  2. Client fills out and signs form → signature captured
  3. Export completed form as PDF → PDF downloads with all data
  4. Send form link via email → email delivered, link works

**Priority:** 45

---

# PHASE 4: Segmentation & Data Management

**Focus:** Custom segment builder UI and enhanced import/export with duplicate detection.

**Test Gate:**
1. Create custom segment with multiple filter conditions
2. Preview matching clients and export as CSV
3. Import CSV with duplicates → detection and resolution works

---

### US-044: Create SegmentBuilder component
**Description:** As a staff member, I want to create custom client segments with rules.

**Files to modify:**
- `apps/store-app/src/components/clients/SegmentBuilder.tsx` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Props: `onSave(segment)`, `onCancel`, `initialSegment?`
- [ ] Segment name input
- [ ] Add/remove filter conditions
- [ ] AND/OR logic toggle between conditions
- [ ] Live count of matching clients
- [ ] "Save Segment" and "Cancel" buttons
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Use existing `segmentationConfig.ts` for available fields

**Priority:** 44

---

### US-045: Create FilterConditionRow component
**Description:** As a developer, I need a reusable filter condition UI.

**Files to modify:**
- `apps/store-app/src/components/clients/FilterConditionRow.tsx` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Props: `condition`, `onChange`, `onRemove`
- [ ] Field selector dropdown (last visit, total spend, visit count, etc.)
- [ ] Operator selector (equals, greater than, less than, contains)
- [ ] Value input (text, number, date based on field type)
- [ ] Remove button
- [ ] pnpm run typecheck passes

**Priority:** 45

---

### US-046: Create FilterGroupBuilder component
**Description:** As a developer, I need nested filter groups for complex queries.

**Files to modify:**
- `apps/store-app/src/components/clients/FilterGroupBuilder.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Props: `group`, `onChange`
- [ ] Support AND/OR toggle
- [ ] Nest groups within groups (max 2 levels)
- [ ] Add condition button
- [ ] Add group button
- [ ] Visual indentation for nested groups
- [ ] pnpm run typecheck passes

**Priority:** 46

---

### US-047: Create SegmentPreview component
**Description:** As a staff member, I want to see which clients match my segment.

**Files to modify:**
- `apps/store-app/src/components/clients/SegmentPreview.tsx` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Props: `segmentRules`
- [ ] Show count of matching clients
- [ ] Show sample of 5-10 matching clients (name, last visit)
- [ ] Loading state while querying
- [ ] Empty state if no matches
- [ ] pnpm run typecheck passes

**Priority:** 47

---

### US-048: Add segment evaluation logic
**Description:** As a developer, I need to evaluate segment rules against clients.

**Files to modify:**
- `apps/store-app/src/utils/segmentEvaluator.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Export `evaluateSegment(rules, clients): Client[]`
- [ ] Support all operators: =, !=, >, <, >=, <=, contains, startsWith
- [ ] Support AND/OR logic
- [ ] Support nested groups
- [ ] Handle null/undefined values gracefully
- [ ] pnpm run typecheck passes

**Priority:** 48

---

### US-049: Add custom segments to ClientSettings
**Description:** As a staff member, I want to manage custom segments.

**Files to modify:**
- `apps/store-app/src/components/client-settings/ClientSettings.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Add "Custom Segments" section to client settings
- [ ] List existing custom segments with edit/delete
- [ ] "Create Segment" button opens SegmentBuilder
- [ ] Apply segment as filter in client list
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: manage custom segments

**Priority:** 49

---

### US-050: Add segment export functionality
**Description:** As a staff member, I want to export clients in a segment as CSV.

**Files to modify:**
- `apps/store-app/src/components/clients/SegmentPreview.tsx` (~25 lines)

**Acceptance Criteria:**
- [ ] Add "Export to CSV" button
- [ ] Export matching clients with: name, email, phone, last visit
- [ ] Download as CSV file
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: export segment clients

**Priority:** 50

---

### US-051: Create ImportWizard component
**Description:** As a staff member, I want a guided import process.

**Files to modify:**
- `apps/store-app/src/components/clients/ImportWizard.tsx` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Multi-step wizard: Upload → Map Fields → Preview → Import
- [ ] Accept CSV and Excel files
- [ ] Show progress through steps
- [ ] Back/Next navigation
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Priority:** 51

---

### US-052: Create FieldMappingStep component
**Description:** As a staff member, I want to map CSV columns to client fields.

**Files to modify:**
- `apps/store-app/src/components/clients/FieldMappingStep.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Show all CSV columns
- [ ] Dropdown to map each column to client field
- [ ] Auto-detect common mappings (Name, Email, Phone)
- [ ] "Skip" option for unneeded columns
- [ ] Required field validation (name required)
- [ ] pnpm run typecheck passes

**Priority:** 52

---

### US-053: Create DuplicateResolution component
**Description:** As a staff member, I want to handle duplicate clients during import.

**Files to modify:**
- `apps/store-app/src/components/clients/DuplicateResolution.tsx` (NEW, ~120 lines)

**Acceptance Criteria:**
- [ ] Detect duplicates by phone OR email match
- [ ] Show side-by-side comparison: existing vs imported
- [ ] Options: Skip, Update Existing, Create New
- [ ] Apply same choice to all duplicates (checkbox)
- [ ] pnpm run typecheck passes

**Priority:** 53

---

### US-054: Create ImportPreview component
**Description:** As a staff member, I want to preview before importing.

**Files to modify:**
- `apps/store-app/src/components/clients/ImportPreview.tsx` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Show table of first 10 rows to be imported
- [ ] Show total count: New, Updates, Skipped
- [ ] Validation errors highlighted in red
- [ ] "Import" and "Cancel" buttons
- [ ] pnpm run typecheck passes

**Priority:** 54

---

### US-055: Create import processing service
**Description:** As a developer, I need backend logic for bulk import.

**Files to modify:**
- `apps/store-app/src/services/clients/importService.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Export `processClientImport(clients, options): ImportResult`
- [ ] Batch insert/update for performance
- [ ] Progress callback for UI updates
- [ ] Error collection (don't fail on single error)
- [ ] Return: created count, updated count, error count, errors list
- [ ] pnpm run typecheck passes

**Priority:** 55

---

### US-056: Enhance export with all relations
**Description:** As a staff member, I want full export including appointments and transactions.

**Files to modify:**
- `apps/store-app/src/components/client-settings/components/ClientDataExportImport.tsx` (~40 lines)

**Acceptance Criteria:**
- [ ] Export options: Basic (name, contact) or Full (all relations)
- [ ] Full export includes: appointments, transactions, notes, forms
- [ ] Export as CSV with multiple sheets or JSON
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: full export works

**Priority:** 56

---

### US-057: Add segment builder tests
**Description:** As a developer, I need tests for segment builder.

**Files to modify:**
- `apps/store-app/src/components/clients/__tests__/segmentBuilder.test.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Test: Single condition evaluation
- [ ] Test: AND logic with multiple conditions
- [ ] Test: OR logic with multiple conditions
- [ ] Test: Nested group evaluation
- [ ] All tests pass

**Priority:** 57

---

### US-058: Add import/export tests
**Description:** As a developer, I need tests for import/export.

**Files to modify:**
- `apps/store-app/src/components/clients/__tests__/import.test.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Test: CSV parsing works correctly
- [ ] Test: Duplicate detection finds matches
- [ ] Test: Field mapping applies correctly
- [ ] All tests pass

**Priority:** 58

---

## 4.2 Phase 4 Review & Remediation

### US-P4R: UltraThink Review of Phase 4 Implementation
**Description:** As a developer, I need comprehensive validation of segmentation and import/export features before moving to Phase 5.

**Review Method:** Use `/ultrathink` skill with Architect, Research, Coder, and Tester agents.

**Acceptance Criteria:**
- [ ] **Architect Agent:** Verify segment system design:
  - Filter condition evaluation logic
  - Nested group support (AND/OR)
  - Query performance for large client lists
- [ ] **Coder Agent:** Review implementation for:
  - SegmentBuilder handles all operator types
  - Import wizard handles malformed data gracefully
  - Duplicate detection uses correct matching criteria
  - CSV/Excel parsing works for various file formats
- [ ] **Tester Agent:** Verify:
  - All acceptance criteria from US-044 to US-058 implemented
  - Segment preview counts are accurate
  - Import handles edge cases (empty rows, special characters)
- [ ] **Performance Check:**
  - Segment evaluation doesn't freeze UI
  - Import handles 1000+ rows efficiently
- [ ] Document all issues in `scripts/ralph/runs/client-module-phase4/review-findings.md`

**Priority:** 59

---

### US-P4F: Address Phase 4 Review Findings
**Description:** As a developer, I need to fix all issues identified in the Phase 4 review.

**Files to modify:**
- Files identified in `review-findings.md`

**Acceptance Criteria:**
- [ ] All Critical issues resolved
- [ ] All Major issues resolved
- [ ] Re-run typecheck and tests
- [ ] **Test Gate Verification:**
  1. Create custom segment with multiple filter conditions → segment saves
  2. Preview matching clients and export as CSV → accurate count, clean CSV
  3. Import CSV with duplicates → detection and resolution UI works

**Priority:** 60

---

# PHASE 5: Engagement & Loyalty

**Focus:** Loyalty program configuration and engagement automation (reviews, referrals, memberships).

**Test Gate:**
1. Configure loyalty tiers and verify point calculations
2. Complete checkout → review request auto-sent after delay
3. Use referral code → reward issued correctly

---

### US-059: Create LoyaltyProgramSettings component
**Description:** As a business owner, I want to configure the loyalty program.

**Files to modify:**
- `apps/store-app/src/components/settings/LoyaltyProgramSettings.tsx` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Enable/disable loyalty program toggle
- [ ] Points per dollar spent configuration
- [ ] Tier thresholds (Bronze, Silver, Gold, Platinum)
- [ ] Tier benefits configuration
- [ ] Save settings to Supabase
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Priority:** 59

---

### US-060: Create loyalty configuration migration
**Description:** As a developer, I need database tables for loyalty configuration.

**Files to modify:**
- `supabase/migrations/033_loyalty_config.sql` (NEW, ~40 lines)

**Acceptance Criteria:**
- [ ] Create `loyalty_config` table: store_id, points_per_dollar, enabled
- [ ] Create `loyalty_tiers` table: name, min_points, benefits (JSONB)
- [ ] Add default tiers on migration
- [ ] Migration runs without errors

**Priority:** 60

---

### US-061: Create tier benefits configuration UI
**Description:** As a business owner, I want to set benefits for each tier.

**Files to modify:**
- `apps/store-app/src/components/settings/TierBenefitsEditor.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Edit benefits for each tier
- [ ] Benefit types: discount %, priority booking, exclusive services
- [ ] Add/remove custom benefits
- [ ] pnpm run typecheck passes

**Priority:** 61

---

### US-062: Add point expiration configuration
**Description:** As a business owner, I want points to expire after a period.

**Files to modify:**
- `apps/store-app/src/components/settings/LoyaltyProgramSettings.tsx` (~20 lines)

**Acceptance Criteria:**
- [ ] Expiration toggle: Never, 6 months, 12 months, 24 months
- [ ] Store expiration setting in loyalty_config
- [ ] pnpm run typecheck passes

**Priority:** 62

---

### US-063: Create point expiration processor
**Description:** As a system, I need to expire old points.

**Files to modify:**
- `supabase/functions/process-point-expiration/index.ts` (NEW, ~60 lines)

**Acceptance Criteria:**
- [ ] Query clients with points older than expiration period
- [ ] Expire points and log to transaction history
- [ ] Notify clients before expiration (7 days warning)
- [ ] Run as scheduled job (daily)

**Priority:** 63

---

### US-064: Add manual point adjustment UI
**Description:** As a staff member, I want to manually adjust points with audit.

**Files to modify:**
- `apps/store-app/src/components/client-settings/components/PointsAdjustmentModal.tsx` (~30 lines)

**Acceptance Criteria:**
- [ ] Require reason for adjustment
- [ ] Log adjustment with: amount, reason, staffId, timestamp
- [ ] Show adjustment history
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: adjust points with reason

**Priority:** 64

---

### US-065: Add reward redemption flow
**Description:** As a staff member, I want to redeem rewards during checkout.

**Files to modify:**
- `apps/store-app/src/components/checkout/LoyaltyRedemption.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Show available rewards based on tier
- [ ] Show point balance
- [ ] Apply reward discount to transaction
- [ ] Deduct points after payment
- [ ] pnpm run typecheck passes
- [ ] Verify in browser: redeem reward at checkout

**Priority:** 65

---

### US-066: Create review automation settings
**Description:** As a business owner, I want to configure automatic review requests.

**Files to modify:**
- `apps/store-app/src/components/settings/ReviewAutomationSettings.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Enable/disable toggle
- [ ] Delay after checkout (default 2 hours)
- [ ] Reminder settings (send reminder after X days)
- [ ] Platform links: Google, Yelp, Facebook
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Priority:** 66

---

### US-067: Create review request automation service
**Description:** As a system, I need to auto-send review requests.

**Files to modify:**
- `supabase/functions/send-review-request/index.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Triggered after checkout completion
- [ ] Wait configured delay
- [ ] Send email with review links
- [ ] Track sent/clicked status
- [ ] Don't send to clients who already reviewed

**Priority:** 67

---

### US-068: Add review request templates
**Description:** As a business owner, I want to customize review request emails.

**Files to modify:**
- `apps/store-app/src/components/settings/ReviewEmailTemplate.tsx` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Edit email subject and body
- [ ] Placeholder support: {clientName}, {serviceName}, {staffName}
- [ ] Preview email
- [ ] pnpm run typecheck passes

**Priority:** 68

---

### US-069: Create referral tracking dashboard
**Description:** As a business owner, I want to see referral performance.

**Files to modify:**
- `apps/store-app/src/components/clients/ReferralDashboard.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Total referrals count
- [ ] Conversion rate (referrals that became clients)
- [ ] Top referrers list
- [ ] Revenue from referrals
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Priority:** 69

---

### US-070: Add referral fraud detection
**Description:** As a system, I need to prevent self-referrals.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/thunks.ts` (~30 lines in applyReferralCode)

**Acceptance Criteria:**
- [ ] Check if referrer and new client have same email domain
- [ ] Check if same device/IP (if available)
- [ ] Flag suspicious referrals for review
- [ ] pnpm run typecheck passes

**Priority:** 70

---

### US-071: Create membership renewal automation
**Description:** As a system, I need to send renewal notices.

**Files to modify:**
- `supabase/functions/membership-renewal-notices/index.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Send notice 30 days before expiration
- [ ] Send reminder 7 days before
- [ ] Send final notice 1 day before
- [ ] Track notice history
- [ ] Run as scheduled job (daily)

**Priority:** 71

---

### US-072: Add auto-renewal processing
**Description:** As a system, I want to auto-renew memberships.

**Files to modify:**
- `supabase/functions/process-auto-renewals/index.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Query memberships expiring today with auto-renew enabled
- [ ] Charge stored payment method
- [ ] If successful, extend membership
- [ ] If failed, notify client and retry in 3 days
- [ ] Max 3 retry attempts

**Priority:** 72

---

### US-073: Create MembershipRenewalDashboard
**Description:** As a staff member, I want to see upcoming renewals.

**Files to modify:**
- `apps/store-app/src/components/clients/MembershipRenewalDashboard.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] List memberships expiring in next 30 days
- [ ] Show renewal status: Pending, Auto-renew, Expired
- [ ] Manual renewal action
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Priority:** 73

---

### US-074: Add loyalty tests
**Description:** As a developer, I need tests for loyalty configuration.

**Files to modify:**
- `apps/store-app/src/components/settings/__tests__/loyalty.test.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Test: Points calculation correct
- [ ] Test: Tier assignment based on points
- [ ] Test: Expiration logic works
- [ ] All tests pass

**Priority:** 74

---

### US-075: Add automation tests
**Description:** As a developer, I need tests for automation features.

**Files to modify:**
- `apps/store-app/src/__tests__/automation.test.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Test: Review request sent after delay
- [ ] Test: Referral fraud detection
- [ ] Test: Membership renewal processing
- [ ] All tests pass

**Priority:** 75

---

## 5.2 Phase 5 Review & Remediation

### US-P5R: UltraThink Review of Phase 5 Implementation
**Description:** As a developer, I need comprehensive validation of loyalty and automation features before moving to Phase 6.

**Review Method:** Use `/ultrathink` skill with Architect, Research, Coder, and Tester agents.

**Acceptance Criteria:**
- [ ] **Architect Agent:** Verify loyalty system design:
  - Tier configuration and benefits storage
  - Point calculation and expiration logic
  - Automation trigger system (scheduled functions)
- [ ] **Coder Agent:** Review implementation for:
  - Points math is accurate (no rounding errors)
  - Tier assignment handles edge cases
  - Review automation respects opt-out preferences
  - Referral fraud detection catches common patterns
  - Membership renewal handles payment failures
- [ ] **Tester Agent:** Verify:
  - All acceptance criteria from US-059 to US-075 implemented
  - Scheduled functions configured correctly
  - Email templates render properly
- [ ] **Business Logic Check:**
  - Point expiration notifies before expiring
  - Redemption deducts correct points
  - Fraud detection doesn't block legitimate referrals
- [ ] Document all issues in `scripts/ralph/runs/client-module-phase5/review-findings.md`

**Priority:** 76

---

### US-P5F: Address Phase 5 Review Findings
**Description:** As a developer, I need to fix all issues identified in the Phase 5 review.

**Files to modify:**
- Files identified in `review-findings.md`

**Acceptance Criteria:**
- [ ] All Critical issues resolved (especially payment and points issues)
- [ ] All Major issues resolved
- [ ] Re-run typecheck and tests
- [ ] **Test Gate Verification:**
  1. Configure loyalty tiers → settings saved, points calculated correctly
  2. Complete checkout → review request auto-sent after configured delay
  3. Use referral code → reward issued to both parties correctly

**Priority:** 77

---

# PHASE 6: Multi-Store Client Sharing

**Focus:** Both Tier 1 (Mango Ecosystem cross-brand) and Tier 2 (Organization multi-location) client sharing.

**Test Gate:**
1. Lookup client across ecosystem → found, link request sent
2. Client approves link → profile shared
3. Configure organization sharing mode → cross-location clients visible

---

## 6.1 Multi-Store Tier 1 (Mango Ecosystem)

### US-076: Create mango_identities table migration
**Description:** As a developer, I need tables for ecosystem client sharing.

**Files to modify:**
- `supabase/migrations/034_mango_ecosystem.sql` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Create `mango_identities` table:
  - `id UUID PRIMARY KEY`
  - `hashed_phone VARCHAR(64) UNIQUE`
  - `hashed_email VARCHAR(64)`
  - `ecosystem_opt_in BOOLEAN DEFAULT FALSE`
  - `sharing_preferences JSONB`
  - `created_at, updated_at`
- [ ] Create `linked_stores` table for cross-brand links
- [ ] Create `profile_link_requests` table for pending links
- [ ] Create `ecosystem_consent_log` for audit
- [ ] Migration runs without errors

**Notes:**
- Reference MULTI_STORE_CLIENT_SPEC.md for exact schema

**Priority:** 76

---

### US-077: Create identity hashing utility
**Description:** As a developer, I need secure identity hashing.

**Files to modify:**
- `apps/store-app/src/utils/identityHash.ts` (NEW, ~50 lines)

**Acceptance Criteria:**
- [ ] Export `hashIdentifier(value: string): Promise<string>`
- [ ] Normalize: lowercase, trim, remove formatting (phone: digits only)
- [ ] Use SHA-256 with environment salt
- [ ] Never log or expose unhashed values
- [ ] pnpm run typecheck passes

**Notes:**
- Salt from `VITE_ECOSYSTEM_SALT` env var

**Priority:** 77

---

### US-078: Create identity-lookup Edge Function
**Description:** As a developer, I need to lookup clients across ecosystem.

**Files to modify:**
- `supabase/functions/identity-lookup/index.ts` (NEW, ~60 lines)

**Acceptance Criteria:**
- [ ] POST `/identity-lookup` endpoint
- [ ] Accept: `hashedPhone` or `hashedEmail`
- [ ] Return: `{ found: boolean, identityId?: string, linkedStores?: [] }`
- [ ] Only return data if client has opted in
- [ ] Log lookup attempt

**Priority:** 78

---

### US-079: Create identity-request-link Edge Function
**Description:** As a developer, I need to request profile links.

**Files to modify:**
- `supabase/functions/identity-request-link/index.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] POST `/identity-request-link` endpoint
- [ ] Accept: `identityId`, `storeId`, `requestReason`
- [ ] Create link request with 24-hour expiry
- [ ] Send notification to client (email/SMS)
- [ ] Return request ID

**Priority:** 79

---

### US-080: Create identity-approve-link Edge Function
**Description:** As a developer, I need to process link approvals.

**Files to modify:**
- `supabase/functions/identity-approve-link/index.ts` (NEW, ~60 lines)

**Acceptance Criteria:**
- [ ] POST `/identity-approve-link` endpoint
- [ ] Accept: `requestId`, `approved`
- [ ] Verify request not expired
- [ ] If approved, create link in `linked_stores`
- [ ] Log consent to audit table

**Priority:** 80

---

### US-081: Create EcosystemLookupPrompt component
**Description:** As a staff member, I want to check if client exists in ecosystem.

**Files to modify:**
- `apps/store-app/src/components/clients/EcosystemLookupPrompt.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Show when creating new client
- [ ] Hash phone/email and call identity-lookup
- [ ] If found, show "This client visits other Mango salons"
- [ ] Option to request profile link
- [ ] Option to skip and create new profile
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Priority:** 81

---

### US-082: Create ProfileLinkRequestFlow component
**Description:** As a staff member, I want to request access to client's ecosystem profile.

**Files to modify:**
- `apps/store-app/src/components/clients/ProfileLinkRequestFlow.tsx` (NEW, ~120 lines)

**Acceptance Criteria:**
- [ ] Multi-step: Explain → Confirm → Send → Status
- [ ] Explain what data will be shared
- [ ] Send link request
- [ ] Show pending status
- [ ] Handle approval/rejection response
- [ ] pnpm run typecheck passes

**Priority:** 82

---

### US-083: Create ecosystem consent management functions
**Description:** As a developer, I need consent management endpoints.

**Files to modify:**
- `supabase/functions/identity-opt-in/index.ts` (NEW, ~40 lines)
- `supabase/functions/identity-opt-out/index.ts` (NEW, ~40 lines)

**Acceptance Criteria:**
- [ ] POST `/identity-opt-in` - Enable ecosystem sharing
- [ ] POST `/identity-opt-out` - Disable and remove links
- [ ] Log all consent changes
- [ ] Return success status

**Priority:** 83

---

### US-084: Create linked stores management page
**Description:** As a client, I want to see and manage my linked stores.

**Files to modify:**
- `apps/online-store/src/pages/LinkedStores.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] List all linked stores with: name, location, link date
- [ ] "Unlink" button for each store
- [ ] Ecosystem opt-out toggle
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Priority:** 84

---

### US-085: Create safety data sync Edge Function
**Description:** As a system, I need to sync allergies and blocks across ecosystem.

**Files to modify:**
- `supabase/functions/identity-sync-safety/index.ts` (NEW, ~60 lines)

**Acceptance Criteria:**
- [ ] Sync allergies to all linked stores
- [ ] Sync block status to all linked stores
- [ ] Safety data shared regardless of sharing preferences
- [ ] Log sync events

**Priority:** 85

---

### US-086: Add ecosystem thunks
**Description:** As a developer, I need Redux thunks for ecosystem operations.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/thunks.ts` (~80 lines)

**Acceptance Criteria:**
- [ ] Export `lookupEcosystemProfile` thunk
- [ ] Export `requestProfileLink` thunk
- [ ] Export `fetchLinkedStores` thunk
- [ ] Export `unlinkStore` thunk
- [ ] pnpm run typecheck passes

**Priority:** 86

---

## 6.2 Multi-Store Tier 2 (Organization Sharing)

### US-087: Create organization sharing migration
**Description:** As a developer, I need schema for organization-level sharing.

**Files to modify:**
- `supabase/migrations/035_org_client_sharing.sql` (NEW, ~60 lines)

**Acceptance Criteria:**
- [ ] Add `client_sharing_settings JSONB` to organizations table
- [ ] Add `home_location_id UUID` to clients table
- [ ] Add `mango_identity_id UUID` to clients table
- [ ] Create `cross_location_visits` table
- [ ] Migration runs without errors

**Priority:** 87

---

### US-088: Create OrganizationClientSharing settings
**Description:** As an admin, I want to configure client sharing for my organization.

**Files to modify:**
- `apps/store-app/src/components/settings/OrganizationClientSharing.tsx` (NEW, ~120 lines)

**Acceptance Criteria:**
- [ ] Sharing mode: Full, Selective, Isolated
- [ ] Selective: choose what to share (contact, history, preferences)
- [ ] Loyalty scope: Organization-wide or Per-location
- [ ] Wallet scope: Organization-wide or Per-location
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Priority:** 88

---

### US-089: Create RLS policies for organization access
**Description:** As a developer, I need row-level security for cross-location access.

**Files to modify:**
- `supabase/migrations/035_org_client_sharing.sql` (append ~40 lines)

**Acceptance Criteria:**
- [ ] RLS policy: Full mode - all locations see all clients
- [ ] RLS policy: Selective mode - filter by sharing settings
- [ ] RLS policy: Isolated mode - only home location sees client
- [ ] Safety data visible to all locations regardless of mode
- [ ] Policies enforce at database level

**Priority:** 89

---

### US-090: Create CrossLocationClientView component
**Description:** As a staff member, I want to see client's activity at other locations.

**Files to modify:**
- `apps/store-app/src/components/clients/CrossLocationClientView.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Show visits at other locations
- [ ] Show services received at other locations
- [ ] Show notes from other locations (if sharing enabled)
- [ ] Clearly label which location data is from
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Priority:** 90

---

### US-091: Add cross-location visit logging
**Description:** As a system, I need to track visits across locations.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/thunks.ts` (~30 lines)

**Acceptance Criteria:**
- [ ] Log visit to `cross_location_visits` when client from another location
- [ ] Include: clientId, homeLocationId, visitLocationId, date
- [ ] pnpm run typecheck passes

**Priority:** 91

---

### US-092: Add organization sharing thunks
**Description:** As a developer, I need thunks for organization sharing.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/thunks.ts` (~50 lines)

**Acceptance Criteria:**
- [ ] Export `fetchCrossLocationClients` thunk
- [ ] Export `updateOrganizationSharingSettings` thunk
- [ ] Export `fetchCrossLocationVisits` thunk
- [ ] pnpm run typecheck passes

**Priority:** 92

---

## 6.3 Phase 6 Tests

### US-093: Add ecosystem tests
**Description:** As a developer, I need tests for ecosystem features.

**Files to modify:**
- `apps/store-app/src/__tests__/ecosystem.test.ts` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Test: Identity hashing is consistent
- [ ] Test: Lookup returns correct data
- [ ] Test: Link request flow works
- [ ] Test: Safety data syncs
- [ ] All tests pass

**Priority:** 93

---

### US-094: Add organization sharing tests
**Description:** As a developer, I need tests for organization sharing.

**Files to modify:**
- `apps/store-app/src/__tests__/orgSharing.test.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Test: Full mode sees all clients
- [ ] Test: Isolated mode only sees home location
- [ ] Test: Safety data always visible
- [ ] All tests pass

**Priority:** 94

---

### US-095: Final integration test
**Description:** As a developer, I need E2E tests for complete client module.

**Files to modify:**
- `apps/store-app/e2e/clientModule.spec.ts` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] E2E: Create client, add patch test, book service
- [ ] E2E: Merge two clients
- [ ] E2E: Block client, verify online booking blocked
- [ ] E2E: Request data deletion, verify anonymization
- [ ] E2E: Cross-location client lookup
- [ ] All E2E tests pass: `pnpm test:e2e`

**Priority:** 95

---

## 6.4 Phase 6 Review & Remediation (Final)

### US-P6R: UltraThink Review of Phase 6 Implementation
**Description:** As a developer, I need comprehensive validation of multi-store sharing features before final release.

**Review Method:** Use `/ultrathink` skill with Architect, Research, Coder, and Tester agents.

**Acceptance Criteria:**
- [ ] **Architect Agent:** Verify multi-store design:
  - Identity hashing is secure (SHA-256 + salt)
  - Link request flow handles expiration correctly
  - RLS policies enforce sharing modes
  - Cross-location data isolation
- [ ] **Coder Agent:** Review implementation for:
  - Hash normalization is consistent (phone digits, email lowercase)
  - Link approval/rejection updates all relevant tables
  - Safety data (allergies, blocks) always syncs regardless of mode
  - Organization sharing modes work as documented
- [ ] **Tester Agent:** Verify:
  - All acceptance criteria from US-076 to US-095 implemented
  - E2E tests cover critical paths
  - Edge Functions handle errors gracefully
- [ ] **Security Check:**
  - No PII exposed in hashed lookups
  - Link requests expire after 24 hours
  - Consent audit trail is complete
- [ ] **Cross-Module Integration:**
  - Multi-store clients work with loyalty
  - Multi-store clients work with GDPR deletion
  - Multi-store clients appear correctly in segments
- [ ] Document all issues in `scripts/ralph/runs/client-module-phase6/review-findings.md`

**Notes:**
- This is the final phase - be extra thorough
- Test cross-module interactions

**Priority:** 96

---

### US-P6F: Address Phase 6 Review Findings
**Description:** As a developer, I need to fix all issues identified in the Phase 6 review.

**Files to modify:**
- Files identified in `review-findings.md`

**Acceptance Criteria:**
- [ ] All Critical issues resolved
- [ ] All Major issues resolved
- [ ] Re-run typecheck and tests
- [ ] **Test Gate Verification:**
  1. Lookup client across ecosystem → found, link request sent
  2. Client approves link → profile shared, safety data syncs
  3. Configure organization sharing mode → cross-location clients visible per mode

**Priority:** 97

---

### US-FINAL: Complete Client Module Verification
**Description:** As a developer, I need final sign-off that the entire client module is complete.

**Review Method:** Use `/ultrathink` for final comprehensive review across ALL phases.

**Acceptance Criteria:**
- [ ] All 95+ user stories have `passes: true`
- [ ] All 6 phase test gates verified
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] `pnpm test` - all unit tests pass
- [ ] `pnpm test:e2e` - all E2E tests pass
- [ ] No Critical or Major issues remain unresolved
- [ ] Documentation updated (CLAUDE.md references new features)
- [ ] Create `docs/RELEASE_NOTES_CLIENT_MODULE.md` summarizing all new features

**Notes:**
- This is the final acceptance story
- Must pass before merging to main branch

**Priority:** 98

---

## Functional Requirements Summary

| ID | Phase | Requirement |
|----|-------|-------------|
| FR-1 | 1 | System must support merging two client records |
| FR-2 | 1 | System must enforce patch test requirements |
| FR-3 | 1 | System must prevent blocked clients from booking |
| FR-4 | 2 | System must provide GDPR compliance features |
| FR-5 | 3 | System must support form signatures and PDF export |
| FR-6 | 4 | System must allow custom segment creation |
| FR-7 | 4 | System must support bulk client import with duplicate detection |
| FR-8 | 5 | System must provide loyalty program configuration |
| FR-9 | 5 | System must automate review requests and referrals |
| FR-10 | 6 | System must support cross-brand client sharing |
| FR-11 | 6 | System must support organization-level client sharing |

---

## Non-Goals (Out of Scope)

- Mobile app native features (this is web/Electron focused)
- Third-party CRM integrations
- AI-powered client recommendations
- Internationalization (i18n) beyond current scope

---

## Technical Considerations

### Dependencies to Install
- `react-signature-canvas` - Signature capture (Phase 3)
- `@react-pdf/renderer` - PDF generation (Phase 3)

### Environment Variables Needed
```
VITE_ECOSYSTEM_SALT=<secure-random-string>
VITE_REVIEW_EMAIL_FROM=reviews@mangospa.com
VITE_SMS_PROVIDER_KEY=<twilio-or-similar>
```
