# PRD: Client Module Complete Build-Out (Phases 2-5)

**Product:** Mango POS
**Module:** Clients (CRM)
**Version:** 1.0
**Created:** January 21, 2026
**Status:** Ready for Ralph Execution
**Base Branch:** `ralph/client-module-phase2`

---

## Executive Summary

Complete the Client Module to 100% PRD compliance by implementing GDPR compliance, form enhancements, loyalty/review automation, and multi-store client sharing.

**Phase 1 Status:** ✅ COMPLETE (Merging, Blocking, Patch Tests)

**Remaining Phases:**
| Phase | Focus | Stories | Priority |
|-------|-------|---------|----------|
| 2 | GDPR/CCPA Compliance | 15 | P0 |
| 3 | Forms, Segments, Import/Export | 18 | P1 |
| 4 | Loyalty, Reviews, Referrals | 16 | P1 |
| 5 | Multi-Store Client Sharing | 20 | P2 |

**Total:** ~69 stories across 4 Ralph runs

---

## Goals

- Achieve GDPR/CCPA compliance for EU/California clients
- Enable form delivery via email/SMS with PDF export
- Complete loyalty program configuration and automation
- Implement cross-store client sharing with privacy controls

---

# PHASE 2: GDPR/CCPA Compliance (P0)

**Ralph Run:** `scripts/ralph/runs/client-module-phase2-gdpr/`
**Branch:** `ralph/client-module-phase2`
**Estimated Stories:** 15

## User Stories - Phase 2

### US-001: Create GDPR database migration
**Description:** As a developer, I need database tables to track data requests and consent.

**Files to create:**
- `supabase/migrations/032_gdpr_compliance.sql` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Create `client_data_requests` table with columns: id, client_id, store_id, request_type (export/delete/access), status (pending/processing/completed/rejected), requested_at, processed_at, processed_by, notes, export_url
- [ ] Create `data_retention_logs` table with columns: id, client_id, action, fields_affected (JSONB), performed_by, performed_at
- [ ] Add consent columns to clients table: consent_marketing (boolean), consent_marketing_at (timestamptz), consent_data_processing (boolean), consent_data_processing_at (timestamptz), data_deletion_requested_at (timestamptz)
- [ ] Add RLS policies for store-scoped access
- [ ] Migration runs without errors

**Notes:**
- Follow pattern from `031_client_merge.sql`
- Use `gen_random_uuid()` for IDs
- All timestamps should be `TIMESTAMPTZ`

**Priority:** 1

---

### US-002: Add GDPR types to client types
**Description:** As a developer, I need TypeScript types for GDPR features.

**Files to modify:**
- `apps/store-app/src/types/client.ts` (~30 lines to add)

**Acceptance Criteria:**
- [ ] Add `DataRequestType = 'export' | 'delete' | 'access'`
- [ ] Add `DataRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected'`
- [ ] Add `ClientDataRequest` interface with all fields from migration
- [ ] Add `DataRetentionLog` interface
- [ ] Add consent fields to `Client` interface if not present
- [ ] No `as any` casts
- [ ] pnpm run typecheck passes

**Notes:**
- Follow existing type patterns in client.ts
- Export all new types

**Priority:** 2

---

### US-003: Create GDPR thunks file
**Description:** As a developer, I need Redux thunks for GDPR operations.

**Files to create:**
- `apps/store-app/src/store/slices/clientsSlice/gdprThunks.ts` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Create `createDataRequest` thunk (creates export/delete/access request)
- [ ] Create `fetchDataRequests` thunk (gets requests for a store)
- [ ] Create `updateDataRequestStatus` thunk (updates request status)
- [ ] Create `logDataRetention` thunk (logs GDPR actions)
- [ ] All thunks use `createAsyncThunk` pattern
- [ ] Export from `apps/store-app/src/store/slices/clientsSlice/index.ts`
- [ ] No forbidden strings: 'Test Client', 'as any'
- [ ] pnpm run typecheck passes

**Notes:**
- Follow pattern from existing thunks in `thunks.ts`
- Use `dataService` for Supabase operations
- Include proper error handling

**Priority:** 3

---

### US-004: Create data export Edge Function
**Description:** As a developer, I need an Edge Function to export client data as JSON/CSV.

**Files to create:**
- `supabase/functions/export-client-data/index.ts` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Accept client_id and store_id as parameters
- [ ] Fetch all client data: profile, appointments, transactions, forms, notes
- [ ] Generate JSON export with all data
- [ ] Generate CSV export for tabular data
- [ ] Return download URL or base64 encoded data
- [ ] Log export action to data_retention_logs
- [ ] Handle errors gracefully with proper status codes

**Notes:**
- Follow pattern from `supabase/functions/clients/index.ts`
- Use Supabase client for data fetching
- Include all related data (appointments, transactions, forms)

**Priority:** 4

---

### US-005: Create data deletion Edge Function
**Description:** As a developer, I need an Edge Function to anonymize client PII per GDPR.

**Files to create:**
- `supabase/functions/process-data-deletion/index.ts` (NEW, ~180 lines)

**Acceptance Criteria:**
- [ ] Accept client_id, store_id, and performed_by as parameters
- [ ] Anonymize PII fields: firstName → 'DELETED', lastName → 'DELETED', email → 'deleted_[id]@removed.local', phone → '0000000000'
- [ ] Clear sensitive fields: address, emergencyContacts, staffAlert, notes
- [ ] Preserve transaction history (amount, date, services) for accounting
- [ ] Preserve appointment history (date, status) without client details
- [ ] Set `data_deletion_requested_at` timestamp
- [ ] Log deletion to data_retention_logs with fields_affected
- [ ] Update data_request status to 'completed'

**Notes:**
- GDPR requires keeping financial records, just anonymize PII
- Follow pattern from `supabase/functions/clients/index.ts`
- This is irreversible - ensure proper confirmation in UI

**Priority:** 5

---

### US-006: Add exportClientData thunk
**Description:** As a developer, I need a thunk to trigger client data export.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/gdprThunks.ts` (~40 lines to add)

**Acceptance Criteria:**
- [ ] Create `exportClientData` async thunk
- [ ] Call `export-client-data` Edge Function
- [ ] Return download URL on success
- [ ] Update request status via `updateDataRequestStatus`
- [ ] Handle errors with user-friendly messages
- [ ] pnpm run typecheck passes

**Notes:**
- Use `supabase.functions.invoke()` to call Edge Function
- Follow existing thunk patterns

**Priority:** 6

---

### US-007: Add processDataDeletion thunk
**Description:** As a developer, I need a thunk to trigger client data deletion.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/gdprThunks.ts` (~40 lines to add)

**Acceptance Criteria:**
- [ ] Create `processDataDeletion` async thunk
- [ ] Call `process-data-deletion` Edge Function
- [ ] Remove client from local Redux state on success
- [ ] Update request status to 'completed'
- [ ] Handle errors with user-friendly messages
- [ ] pnpm run typecheck passes

**Notes:**
- This is irreversible - thunk should require confirmation flag
- Follow existing thunk patterns

**Priority:** 7

---

### US-008: Create DataRequestsPanel component
**Description:** As a staff member, I want to see and manage data requests.

**Files to create:**
- `apps/store-app/src/components/clients/DataRequestsPanel.tsx` (NEW, ~250 lines)

**Acceptance Criteria:**
- [ ] Display list of data requests with status badges
- [ ] Show request type (Export/Delete/Access) with icons
- [ ] Show requester info and request date
- [ ] Filter by status (All/Pending/Completed)
- [ ] Action buttons: Process, Reject, View Details
- [ ] Empty state when no requests
- [ ] Loading state while fetching
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow pattern from `apps/store-app/src/components/client-settings/sections/HistorySection.tsx`
- Use existing Badge, Button components from ui/
- Use Tailwind for styling

**Priority:** 8

---

### US-009: Create DataDeletionRequestModal component
**Description:** As a staff member, I want to confirm data deletion with warnings.

**Files to create:**
- `apps/store-app/src/components/clients/DataDeletionRequestModal.tsx` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Display client name and summary of data to be deleted
- [ ] Show prominent warning: "This action cannot be undone"
- [ ] List what will be anonymized vs preserved
- [ ] Require typing "DELETE" to confirm (like MergeClientsModal)
- [ ] Show processing state during deletion
- [ ] Display success/error feedback
- [ ] Close modal on success
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow pattern from `MergeClientsModal.tsx` for confirmation flow
- Use AlertTriangle icon for warnings
- Red color scheme for destructive action

**Priority:** 9

---

### US-010: Create ConsentManagement component
**Description:** As a staff member, I want to manage client consent preferences.

**Files to create:**
- `apps/store-app/src/components/clients/ConsentManagement.tsx` (NEW, ~180 lines)

**Acceptance Criteria:**
- [ ] Display current consent status for: SMS, Email, Marketing, Photo, Data Processing
- [ ] Toggle switches for each consent type
- [ ] Show timestamp of last consent change
- [ ] "Do Not Contact" master toggle that disables all
- [ ] Save changes via updateClientInSupabase thunk
- [ ] Show success toast on save
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow pattern from `PreferencesSection.tsx`
- Use Switch components from ui/
- Each toggle change should log to data_retention_logs

**Priority:** 10

---

### US-011: Add ConsentManagement to ProfileSection
**Description:** As a staff member, I want consent management in the client profile.

**Files to modify:**
- `apps/store-app/src/components/client-settings/sections/ProfileSection.tsx` (~20 lines to add)

**Acceptance Criteria:**
- [ ] Import ConsentManagement component
- [ ] Add "Privacy & Consent" collapsible section
- [ ] Place below contact information
- [ ] Pass client data and update handler
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- ProfileSection is 16,743 lines - only add import and JSX
- Use existing Collapsible pattern from the file

**Priority:** 11

---

### US-012: Add Data Requests tab to ClientSettings
**Description:** As a staff member, I want to access data requests from client settings.

**Files to modify:**
- `apps/store-app/src/components/client-settings/ClientSettings.tsx` (~30 lines to add)

**Acceptance Criteria:**
- [ ] Import DataRequestsPanel component
- [ ] Add "Data Requests" tab to tab list
- [ ] Show DataRequestsPanel when tab selected
- [ ] Tab only visible to managers/owners (check role)
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- ClientSettings is 31,884 lines - only add tab and panel
- Follow existing tab pattern in the file
- Use `useAppSelector(selectCurrentMemberRole)` for permission check

**Priority:** 12

---

### US-013: Add "Request Data Export" button to client profile
**Description:** As a staff member, I want to initiate data export for a client.

**Files to modify:**
- `apps/store-app/src/components/client-settings/sections/ProfileSection.tsx` (~25 lines to add)

**Acceptance Criteria:**
- [ ] Add "Export Client Data" button in profile actions
- [ ] Button click creates data request with type 'export'
- [ ] Show loading state while processing
- [ ] Show success message with download link
- [ ] Handle errors gracefully
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Add to existing actions section in ProfileSection
- Use Download icon from lucide-react

**Priority:** 13

---

### US-014: Add "Request Data Deletion" button to client profile
**Description:** As a staff member, I want to initiate data deletion for a client.

**Files to modify:**
- `apps/store-app/src/components/client-settings/sections/ProfileSection.tsx` (~20 lines to add)

**Acceptance Criteria:**
- [ ] Add "Delete Client Data" button in profile actions (destructive style)
- [ ] Button click opens DataDeletionRequestModal
- [ ] Only visible to managers/owners
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Use red/destructive button variant
- Check role before showing button

**Priority:** 14

---

### US-015: Add GDPR unit tests
**Description:** As a developer, I need tests for GDPR functionality.

**Files to create:**
- `apps/store-app/src/store/slices/clientsSlice/__tests__/gdprThunks.test.ts` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Test createDataRequest thunk
- [ ] Test exportClientData thunk (mock Edge Function)
- [ ] Test processDataDeletion thunk (mock Edge Function)
- [ ] Test data anonymization preserves transaction integrity
- [ ] All tests pass with `pnpm test`
- [ ] No forbidden strings

**Notes:**
- Follow existing test patterns in `__tests__/` folder
- Mock supabase.functions.invoke calls
- Test both success and error cases

**Priority:** 15

---

# PHASE 3: Forms, Segments, Import/Export (P1)

**Ralph Run:** `scripts/ralph/runs/client-module-phase3-forms/`
**Branch:** `ralph/client-module-phase2` (continue from Phase 2)
**Estimated Stories:** 18

## User Stories - Phase 3

### US-016: Create form delivery database migration
**Description:** As a developer, I need database support for form delivery tracking.

**Files to create:**
- `supabase/migrations/033_form_delivery.sql` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Create `form_deliveries` table: id, form_template_id, client_id, appointment_id, delivery_method (email/sms), sent_at, opened_at, completed_at, expires_at, token (unique link)
- [ ] Add `auto_send_form_ids` array column to services table
- [ ] Add `form_frequency` column to form_templates ('every_time' | 'once')
- [ ] Add RLS policies
- [ ] Migration runs without errors

**Notes:**
- Follow pattern from existing migrations
- Token should be UUID for secure form links

**Priority:** 16

---

### US-017: Add form delivery types
**Description:** As a developer, I need TypeScript types for form delivery.

**Files to modify:**
- `apps/store-app/src/types/form.ts` (~40 lines to add)

**Acceptance Criteria:**
- [ ] Add `FormDeliveryMethod = 'email' | 'sms'`
- [ ] Add `FormFrequency = 'every_time' | 'once'`
- [ ] Add `FormDelivery` interface with all fields
- [ ] Update `FormTemplate` interface with frequency field
- [ ] No `as any` casts
- [ ] pnpm run typecheck passes

**Notes:**
- Follow existing type patterns in form.ts

**Priority:** 17

---

### US-018: Create send-form Edge Function
**Description:** As a developer, I need an Edge Function to send forms via email/SMS.

**Files to create:**
- `supabase/functions/send-form/index.ts` (NEW, ~180 lines)

**Acceptance Criteria:**
- [ ] Accept: client_id, form_template_id, delivery_method, appointment_id (optional)
- [ ] Generate unique token for form link
- [ ] Create form_delivery record
- [ ] Send email via Resend/SendGrid with form link
- [ ] Send SMS via Twilio with short link (if SMS method)
- [ ] Set expiration to 24 hours
- [ ] Return delivery record on success

**Notes:**
- Use environment variables for email/SMS API keys
- Follow pattern from `send-gift-card-email` function
- Form link format: `{BASE_URL}/forms/complete/{token}`

**Priority:** 18

---

### US-019: Create generate-form-pdf Edge Function
**Description:** As a developer, I need an Edge Function to generate PDF from completed forms.

**Files to create:**
- `supabase/functions/generate-form-pdf/index.ts` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Accept: form_submission_id
- [ ] Fetch form template and submission data
- [ ] Generate PDF with form title, client info, all responses
- [ ] Include signature image if present
- [ ] Include timestamp and submission metadata
- [ ] Upload PDF to Supabase Storage
- [ ] Return public URL for download

**Notes:**
- Use @react-pdf/renderer or pdf-lib for PDF generation
- Store in `form-submissions` bucket
- Follow existing Edge Function patterns

**Priority:** 19

---

### US-020: Add form delivery thunks
**Description:** As a developer, I need thunks for form delivery operations.

**Files to create:**
- `apps/store-app/src/store/slices/formsSlice/deliveryThunks.ts` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Create `sendFormToClient` thunk (calls send-form Edge Function)
- [ ] Create `fetchFormDeliveries` thunk (gets deliveries for client/appointment)
- [ ] Create `generateFormPdf` thunk (calls generate-form-pdf Edge Function)
- [ ] Create `checkFormCompletion` thunk (checks if client completed required forms)
- [ ] Export from formsSlice index
- [ ] pnpm run typecheck passes

**Notes:**
- Follow pattern from existing thunks
- Handle loading/error states

**Priority:** 20

---

### US-021: Create FormDeliveryModal component
**Description:** As a staff member, I want to send forms to clients.

**Files to create:**
- `apps/store-app/src/components/forms/FormDeliveryModal.tsx` (NEW, ~220 lines)

**Acceptance Criteria:**
- [ ] Select form template from dropdown
- [ ] Select delivery method (Email/SMS/Both)
- [ ] Show client contact info (email/phone)
- [ ] Warning if contact info missing for selected method
- [ ] Preview of form link
- [ ] Send button with loading state
- [ ] Success confirmation with "Copy Link" option
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow modal pattern from MergeClientsModal
- Use existing Select, Button components

**Priority:** 21

---

### US-022: Add "Send Form" button to client profile
**Description:** As a staff member, I want to send forms from the client profile.

**Files to modify:**
- `apps/store-app/src/components/client-settings/sections/ProfileSection.tsx` (~20 lines to add)

**Acceptance Criteria:**
- [ ] Add "Send Form" button in profile actions
- [ ] Button opens FormDeliveryModal
- [ ] Pass client data to modal
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Add near existing action buttons
- Use FileText icon from lucide-react

**Priority:** 22

---

### US-023: Create ServiceFormConfig component
**Description:** As a manager, I want to configure auto-send forms for services.

**Files to create:**
- `apps/store-app/src/components/services/ServiceFormConfig.tsx` (NEW, ~180 lines)

**Acceptance Criteria:**
- [ ] Multi-select dropdown for form templates
- [ ] Show selected forms as tags/chips
- [ ] Remove form from selection
- [ ] Save updates service.auto_send_form_ids
- [ ] Info text explaining auto-send behavior
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- This will be embedded in service edit modal
- Use MultiSelect pattern if exists, or Combobox

**Priority:** 23

---

### US-024: Create SegmentBuilder component
**Description:** As a manager, I want to build custom client segments.

**Files to create:**
- `apps/store-app/src/components/clients/SegmentBuilder.tsx` (NEW, ~280 lines)

**Acceptance Criteria:**
- [ ] Add filter conditions (field, operator, value)
- [ ] Support fields: lastVisit, totalSpend, visitCount, loyaltyTier, tags, services
- [ ] Support operators: equals, contains, greaterThan, lessThan, between, isEmpty
- [ ] AND/OR group logic with visual nesting
- [ ] Live count of matching clients
- [ ] Save segment with name and description
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow pattern from existing filter components
- Use existing createCustomSegment thunk for saving
- Keep under 300 lines - split if needed

**Priority:** 24

---

### US-025: Create SegmentPreview component
**Description:** As a manager, I want to preview clients in a segment.

**Files to create:**
- `apps/store-app/src/components/clients/SegmentPreview.tsx` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Display list of matching clients (name, phone, last visit)
- [ ] Show total count
- [ ] Pagination for large segments
- [ ] "Export Segment" button
- [ ] "Send Message" button (opens bulk message modal)
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow pattern from client list components
- Use existing fetchClientsByCustomSegment thunk

**Priority:** 25

---

### US-026: Create ImportWizard component - Step 1 (Upload)
**Description:** As a manager, I want to upload a CSV file for client import.

**Files to create:**
- `apps/store-app/src/components/clients/ImportWizard/UploadStep.tsx` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Drag-and-drop file upload zone
- [ ] Accept CSV and Excel files (.csv, .xlsx, .xls)
- [ ] Parse file and detect columns
- [ ] Show file name and row count
- [ ] "Continue" button to next step
- [ ] Error handling for invalid files
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Use papaparse for CSV parsing
- Use xlsx library for Excel files
- Follow existing file upload patterns

**Priority:** 26

---

### US-027: Create ImportWizard component - Step 2 (Mapping)
**Description:** As a manager, I want to map CSV columns to client fields.

**Files to create:**
- `apps/store-app/src/components/clients/ImportWizard/MappingStep.tsx` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Show source columns from uploaded file
- [ ] Dropdown to map each to client field
- [ ] Required fields highlighted (firstName, lastName)
- [ ] Auto-detect common column names (Name, Phone, Email)
- [ ] Preview first 3 rows with mapping applied
- [ ] "Back" and "Continue" buttons
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Client fields: firstName, lastName, email, phone, birthday, tags, notes
- Show validation errors for required fields

**Priority:** 27

---

### US-028: Create ImportWizard component - Step 3 (Preview & Import)
**Description:** As a manager, I want to preview and confirm the import.

**Files to create:**
- `apps/store-app/src/components/clients/ImportWizard/PreviewStep.tsx` (NEW, ~220 lines)

**Acceptance Criteria:**
- [ ] Show import summary: total rows, valid rows, invalid rows
- [ ] Highlight duplicate detection (by phone or email)
- [ ] Options for duplicates: Skip, Update, Create New
- [ ] Download invalid rows as CSV for correction
- [ ] "Import" button with confirmation
- [ ] Progress bar during import
- [ ] Success summary with counts
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Use bulkUpdateClients thunk for import
- Batch imports in groups of 50 for performance

**Priority:** 28

---

### US-029: Create ImportWizard container component
**Description:** As a developer, I need a container for the import wizard steps.

**Files to create:**
- `apps/store-app/src/components/clients/ImportWizard/ImportWizard.tsx` (NEW, ~120 lines)
- `apps/store-app/src/components/clients/ImportWizard/index.ts` (NEW, ~10 lines)

**Acceptance Criteria:**
- [ ] Multi-step wizard with step indicator
- [ ] Manage state across steps (file, mapping, options)
- [ ] Render correct step component
- [ ] Handle cancel/close
- [ ] Reset state on close
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow existing modal patterns
- Use useState for wizard state

**Priority:** 29

---

### US-030: Add ImportWizard to ClientSettings
**Description:** As a manager, I want to access the import wizard from client settings.

**Files to modify:**
- `apps/store-app/src/components/client-settings/ClientSettings.tsx` (~25 lines to add)

**Acceptance Criteria:**
- [ ] Add "Import Clients" button in header actions
- [ ] Button opens ImportWizard modal
- [ ] Only visible to managers/owners
- [ ] Refresh client list after successful import
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Add near existing export button
- Use Upload icon from lucide-react

**Priority:** 30

---

### US-031: Enhance export with full client data
**Description:** As a manager, I want to export clients with all related data.

**Files to modify:**
- `apps/store-app/src/components/client-settings/components/ClientDataExportImport.tsx` (~50 lines to modify)

**Acceptance Criteria:**
- [ ] Add checkboxes for data to include: Profile, Appointments, Transactions, Forms, Notes
- [ ] Export selected data as CSV or JSON
- [ ] Include loyalty points and tier in export
- [ ] Include visit summary statistics
- [ ] Progress indicator for large exports
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Enhance existing export functionality
- Use existing exportSegmentClients thunk as base

**Priority:** 31

---

### US-032: Add SegmentBuilder to ClientSettings
**Description:** As a manager, I want to access segment builder from client settings.

**Files to modify:**
- `apps/store-app/src/components/client-settings/ClientSettings.tsx` (~20 lines to add)

**Acceptance Criteria:**
- [ ] Add "Segments" tab to tab list
- [ ] Show SegmentBuilder when tab selected
- [ ] List existing custom segments
- [ ] "Create New Segment" button
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Add as new tab alongside existing tabs
- Follow existing tab pattern

**Priority:** 33

---

# PHASE 4: Loyalty, Reviews, Referrals (P1)

**Ralph Run:** `scripts/ralph/runs/client-module-phase4-loyalty/`
**Branch:** `ralph/client-module-phase2` (continue from Phase 3)
**Estimated Stories:** 16

## User Stories - Phase 4

### US-034: Create loyalty program database migration
**Description:** As a developer, I need database support for configurable loyalty programs.

**Files to create:**
- `supabase/migrations/034_loyalty_program.sql` (NEW, ~120 lines)

**Acceptance Criteria:**
- [ ] Create `loyalty_programs` table: id, store_id, name, points_per_dollar, eligible_categories (JSONB), include_tax, points_expiration_months, is_active
- [ ] Create `loyalty_tiers` table: id, program_id, name, threshold_points, benefits (JSONB), tier_order
- [ ] Create `loyalty_rewards` table: id, program_id, name, points_required, reward_type (discount/free_service/free_product), reward_value, eligible_items (JSONB), expires_days
- [ ] Add RLS policies
- [ ] Migration runs without errors

**Notes:**
- Follow existing migration patterns
- Default points_per_dollar = 1

**Priority:** 34

---

### US-035: Add loyalty program types
**Description:** As a developer, I need TypeScript types for loyalty configuration.

**Files to modify:**
- `apps/store-app/src/types/client.ts` (~50 lines to add)

**Acceptance Criteria:**
- [ ] Add `LoyaltyProgram` interface
- [ ] Add `LoyaltyTierConfig` interface (not to confuse with existing LoyaltyTier)
- [ ] Add `LoyaltyReward` interface with reward_type union
- [ ] Add `RewardType = 'discount' | 'free_service' | 'free_product' | 'percentage'`
- [ ] No `as any` casts
- [ ] pnpm run typecheck passes

**Notes:**
- Keep separate from existing LoyaltyInfo on Client

**Priority:** 35

---

### US-036: Create loyalty program thunks
**Description:** As a developer, I need thunks for loyalty program management.

**Files to create:**
- `apps/store-app/src/store/slices/loyaltySlice/index.ts` (NEW, ~250 lines)

**Acceptance Criteria:**
- [ ] Create `fetchLoyaltyProgram` thunk
- [ ] Create `updateLoyaltyProgram` thunk
- [ ] Create `fetchLoyaltyTiers` thunk
- [ ] Create `createLoyaltyTier` thunk
- [ ] Create `updateLoyaltyTier` thunk
- [ ] Create `deleteLoyaltyTier` thunk
- [ ] Create `fetchLoyaltyRewards` thunk
- [ ] Create `createLoyaltyReward` thunk
- [ ] Add slice with selectors
- [ ] Export from store index
- [ ] pnpm run typecheck passes

**Notes:**
- Follow pattern from clientsSlice
- Include loading/error states in slice

**Priority:** 36

---

### US-037: Create LoyaltyProgramSettings component
**Description:** As an owner, I want to configure the loyalty program.

**Files to create:**
- `apps/store-app/src/components/settings/LoyaltyProgramSettings.tsx` (NEW, ~280 lines)

**Acceptance Criteria:**
- [ ] Points per dollar input (number)
- [ ] Eligible categories checkboxes (Services, Products, Gift Cards)
- [ ] Include tax toggle
- [ ] Points expiration dropdown (Never, 6mo, 12mo, 24mo)
- [ ] Enable/disable program toggle
- [ ] Save button with loading state
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow existing settings component patterns
- Add to Settings module navigation

**Priority:** 37

---

### US-038: Create LoyaltyTierConfig component
**Description:** As an owner, I want to configure loyalty tiers.

**Files to create:**
- `apps/store-app/src/components/settings/LoyaltyTierConfig.tsx` (NEW, ~250 lines)

**Acceptance Criteria:**
- [ ] List existing tiers with drag-to-reorder
- [ ] Add new tier button
- [ ] Edit tier: name, threshold points, benefits (JSONB editor or checkboxes)
- [ ] Delete tier with confirmation
- [ ] Visual tier progression preview
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Use @dnd-kit for drag-and-drop reordering
- Benefits: percentage_discount, free_shipping, early_access, etc.

**Priority:** 38

---

### US-039: Create LoyaltyRewardConfig component
**Description:** As an owner, I want to configure loyalty rewards.

**Files to create:**
- `apps/store-app/src/components/settings/LoyaltyRewardConfig.tsx` (NEW, ~250 lines)

**Acceptance Criteria:**
- [ ] List existing rewards
- [ ] Add new reward form: name, points required, reward type, value
- [ ] Reward types: Fixed discount ($X off), Percentage (X% off), Free service, Free product
- [ ] Edit existing rewards
- [ ] Delete reward with confirmation
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow existing list/form patterns
- Validate points_required > 0

**Priority:** 39

---

### US-040: Create review request database migration
**Description:** As a developer, I need database support for review requests.

**Files to create:**
- `supabase/migrations/035_review_requests.sql` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Create `review_requests` table: id, client_id, appointment_id, store_id, status (pending/sent/completed/expired), sent_via (email/sms), sent_at, reminder_sent_at, review_platform, review_url, created_at
- [ ] Create `review_settings` table: store_id, enabled, delay_hours, reminder_days, platforms (JSONB)
- [ ] Add RLS policies
- [ ] Migration runs without errors

**Notes:**
- Follow existing migration patterns
- platforms: {google: 'url', yelp: 'url', facebook: 'url'}

**Priority:** 40

---

### US-041: Create send-review-request Edge Function
**Description:** As a developer, I need an Edge Function to send review requests.

**Files to create:**
- `supabase/functions/send-review-request/index.ts` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Accept: client_id, appointment_id, store_id
- [ ] Fetch client contact info and review settings
- [ ] Send email/SMS with review platform links
- [ ] Create review_request record
- [ ] Handle multiple platforms (Google, Yelp, etc.)
- [ ] Return success/error status

**Notes:**
- Follow pattern from send-form Edge Function
- Use same email/SMS providers

**Priority:** 41

---

### US-042: Create review request thunks
**Description:** As a developer, I need thunks for review request operations.

**Files to create:**
- `apps/store-app/src/store/slices/reviewsSlice/index.ts` (NEW, ~180 lines)

**Acceptance Criteria:**
- [ ] Create `fetchReviewSettings` thunk
- [ ] Create `updateReviewSettings` thunk
- [ ] Create `sendReviewRequest` thunk (manual send)
- [ ] Create `fetchReviewRequests` thunk (list for store)
- [ ] Add slice with selectors
- [ ] Export from store index
- [ ] pnpm run typecheck passes

**Notes:**
- Auto-send after checkout will be handled by checkout flow
- These are for manual operations and settings

**Priority:** 42

---

### US-043: Create ReviewAutomationSettings component
**Description:** As an owner, I want to configure review request automation.

**Files to create:**
- `apps/store-app/src/components/settings/ReviewAutomationSettings.tsx` (NEW, ~220 lines)

**Acceptance Criteria:**
- [ ] Enable/disable auto-send toggle
- [ ] Delay after checkout (1hr, 2hr, 4hr, 24hr, 48hr)
- [ ] Send reminder toggle with days setting
- [ ] Platform URLs: Google, Yelp, Facebook (text inputs)
- [ ] Test send button
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow existing settings patterns
- Add to Settings module

**Priority:** 43

---

### US-044: Create referral program database migration
**Description:** As a developer, I need database support for referral tracking.

**Files to create:**
- `supabase/migrations/036_referral_program.sql` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Create `referral_settings` table: store_id, enabled, referrer_reward_type, referrer_reward_value, referee_discount_type, referee_discount_value, expires_days
- [ ] Add `referral_code` column to clients table (unique per store)
- [ ] Create `referral_tracking` table: id, referrer_client_id, referee_client_id, store_id, code_used, status (pending/completed/expired), reward_issued_at, created_at
- [ ] Add RLS policies
- [ ] Migration runs without errors

**Notes:**
- Referral code format: `{FIRSTNAME}{RANDOM4}` e.g., JANE1234

**Priority:** 44

---

### US-045: Create referral thunks
**Description:** As a developer, I need thunks for referral operations.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/thunks.ts` (~80 lines to add)

**Acceptance Criteria:**
- [ ] Enhance existing `generateClientReferralCode` if exists, or create
- [ ] Create `fetchReferralSettings` thunk
- [ ] Create `updateReferralSettings` thunk
- [ ] Create `trackReferralUsage` thunk (when new client uses code)
- [ ] Create `issueReferralReward` thunk (when referee completes first visit)
- [ ] pnpm run typecheck passes

**Notes:**
- Check if referral thunks already exist - enhance if so
- Self-referral prevention: check email/phone match

**Priority:** 45

---

### US-046: Create ReferralProgramSettings component
**Description:** As an owner, I want to configure the referral program.

**Files to create:**
- `apps/store-app/src/components/settings/ReferralProgramSettings.tsx` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Enable/disable toggle
- [ ] Referrer reward: type (points/credit/discount), value
- [ ] New client discount: type (percentage/fixed), value
- [ ] Expiration days for referral codes
- [ ] Save button with loading state
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow existing settings patterns

**Priority:** 46

---

### US-047: Create ReferralCard component for client profile
**Description:** As a staff member, I want to see and share client's referral code.

**Files to create:**
- `apps/store-app/src/components/clients/ReferralCard.tsx` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Display client's referral code prominently
- [ ] Generate code button if none exists
- [ ] Copy code to clipboard button
- [ ] Share via SMS/Email buttons
- [ ] Show referral stats: total referrals, successful conversions
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Add to LoyaltySection or create new section

**Priority:** 47

---

### US-048: Add ReferralCard to client profile
**Description:** As a staff member, I want referral info in the client profile.

**Files to modify:**
- `apps/store-app/src/components/client-settings/sections/LoyaltySection.tsx` (~20 lines to add)

**Acceptance Criteria:**
- [ ] Import ReferralCard component
- [ ] Add below loyalty points display
- [ ] Only show if referral program is enabled
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- LoyaltySection is 13,387 lines - only add import and JSX

**Priority:** 48

---

### US-049: Integrate review request into checkout flow
**Description:** As a system, I want to auto-send review requests after checkout.

**Files to modify:**
- `apps/store-app/src/components/checkout/CheckoutComplete.tsx` (~30 lines to add)

**Acceptance Criteria:**
- [ ] After successful checkout, check if review automation enabled
- [ ] If enabled, schedule review request (use setTimeout or queue)
- [ ] Don't block checkout completion
- [ ] Log scheduled request
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes

**Notes:**
- This is fire-and-forget - don't wait for send
- Delay is configured in review settings

**Priority:** 49

---

# PHASE 5: Multi-Store Client Sharing (P2)

**Ralph Run:** `scripts/ralph/runs/client-module-phase5-multistore/`
**Branch:** `ralph/client-module-phase2` (continue from Phase 4)
**Estimated Stories:** 20

## User Stories - Phase 5

### US-050: Create multi-store identity database migration
**Description:** As a developer, I need database tables for cross-store client identity.

**Files to create:**
- `supabase/migrations/037_mango_identities.sql` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Create `mango_identities` table: id, hashed_phone (unique), hashed_email, ecosystem_opt_in, sharing_preferences (JSONB), created_at, updated_at
- [ ] Create `linked_stores` table: id, identity_id, store_id, client_id, link_status (active/revoked), linked_at, revoked_at
- [ ] Create `profile_link_requests` table: id, requesting_store_id, target_store_id, identity_id, status (pending/approved/rejected/expired), requested_at, responded_at, expires_at
- [ ] Create `ecosystem_consent_log` table: id, identity_id, action, store_id, ip_address, timestamp
- [ ] Add `mango_identity_id` column to clients table
- [ ] Add RLS policies (cross-store read for linked identities)
- [ ] Migration runs without errors

**Notes:**
- Follow MULTI_STORE_CLIENT_SPEC.md exactly
- Hashed values use SHA-256 with salt

**Priority:** 50

---

### US-051: Create identity hashing utility
**Description:** As a developer, I need utilities for secure phone/email hashing.

**Files to create:**
- `apps/store-app/src/utils/identityHash.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Create `normalizePhone(phone: string): string` - strips formatting, adds country code
- [ ] Create `normalizeEmail(email: string): string` - lowercase, trim
- [ ] Create `hashIdentifier(value: string, salt: string): string` - SHA-256 hash
- [ ] Create `hashPhone(phone: string): string` - normalize + hash
- [ ] Create `hashEmail(email: string): string` - normalize + hash
- [ ] Use VITE_ECOSYSTEM_SALT environment variable
- [ ] pnpm run typecheck passes

**Notes:**
- Use Web Crypto API for hashing
- Salt must be consistent across all stores

**Priority:** 51

---

### US-052: Add multi-store types
**Description:** As a developer, I need TypeScript types for multi-store features.

**Files to modify:**
- `apps/store-app/src/types/client.ts` (~60 lines to add)

**Acceptance Criteria:**
- [ ] Add `MangoIdentity` interface
- [ ] Add `LinkedStore` interface
- [ ] Add `ProfileLinkRequest` interface with status union
- [ ] Add `LinkRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired'`
- [ ] Add `SharingPreferences` interface (share_safety, share_loyalty, share_preferences)
- [ ] Add `EcosystemConsentLog` interface
- [ ] No `as any` casts
- [ ] pnpm run typecheck passes

**Notes:**
- Follow MULTI_STORE_CLIENT_SPEC.md for exact field names

**Priority:** 52

---

### US-053: Create identity-lookup Edge Function
**Description:** As a developer, I need an Edge Function to lookup clients by hashed identifier.

**Files to create:**
- `supabase/functions/identity-lookup/index.ts` (NEW, ~120 lines)

**Acceptance Criteria:**
- [ ] Accept: hashed_phone or hashed_email
- [ ] Query mango_identities table
- [ ] Return identity_id and linked stores (if ecosystem_opt_in = true)
- [ ] Return null if not found or not opted in
- [ ] Do NOT return actual client data - just existence
- [ ] Log lookup attempt

**Notes:**
- This is privacy-preserving - only returns if match exists
- Follow existing Edge Function patterns

**Priority:** 53

---

### US-054: Create identity-request-link Edge Function
**Description:** As a developer, I need an Edge Function to request profile linking.

**Files to create:**
- `supabase/functions/identity-request-link/index.ts` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Accept: requesting_store_id, target_store_id, identity_id
- [ ] Create profile_link_request with 24-hour expiration
- [ ] Notify target store (via email or in-app notification)
- [ ] Return request_id on success
- [ ] Prevent duplicate pending requests

**Notes:**
- Target store must approve before data is shared
- Follow existing Edge Function patterns

**Priority:** 54

---

### US-055: Create identity-approve-link Edge Function
**Description:** As a developer, I need an Edge Function to approve/reject link requests.

**Files to create:**
- `supabase/functions/identity-approve-link/index.ts` (NEW, ~140 lines)

**Acceptance Criteria:**
- [ ] Accept: request_id, action (approve/reject), performed_by
- [ ] Update request status
- [ ] If approved, create linked_stores record
- [ ] If approved, share safety data (allergies, blocks) immediately
- [ ] Log consent action
- [ ] Return success/error

**Notes:**
- Safety data always shared on approval (per spec)
- Other data based on sharing_preferences

**Priority:** 55

---

### US-056: Create identity-sync-safety Edge Function
**Description:** As a developer, I need an Edge Function to sync safety data across linked stores.

**Files to create:**
- `supabase/functions/identity-sync-safety/index.ts` (NEW, ~130 lines)

**Acceptance Criteria:**
- [ ] Accept: identity_id
- [ ] Fetch all linked stores for identity
- [ ] Collect safety data: allergies, blocked status, staff alerts
- [ ] Merge and return unified safety profile
- [ ] Do NOT sync other data without explicit preference

**Notes:**
- Safety data is ALWAYS synced regardless of preferences
- This is a read operation for display

**Priority:** 56

---

### US-057: Create multi-store thunks
**Description:** As a developer, I need thunks for multi-store operations.

**Files to create:**
- `apps/store-app/src/store/slices/clientsSlice/multiStoreThunks.ts` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Create `lookupEcosystemIdentity` thunk (calls identity-lookup)
- [ ] Create `requestProfileLink` thunk (calls identity-request-link)
- [ ] Create `respondToLinkRequest` thunk (calls identity-approve-link)
- [ ] Create `fetchLinkedStores` thunk (for a client)
- [ ] Create `fetchSafetyProfile` thunk (calls identity-sync-safety)
- [ ] Create `optIntoEcosystem` thunk (set ecosystem_opt_in = true)
- [ ] Export from clientsSlice index
- [ ] pnpm run typecheck passes

**Notes:**
- Follow existing thunk patterns
- Hash identifiers before calling Edge Functions

**Priority:** 57

---

### US-058: Create EcosystemLookupPrompt component
**Description:** As a staff member, I want to check if a new client exists at other Mango stores.

**Files to create:**
- `apps/store-app/src/components/clients/EcosystemLookupPrompt.tsx` (NEW, ~180 lines)

**Acceptance Criteria:**
- [ ] Display when creating new client
- [ ] "Check Mango Network" button
- [ ] If match found, show: "This client may have visited other Mango locations"
- [ ] Option to request profile link
- [ ] If no match, continue with new profile
- [ ] Privacy-focused messaging
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Only shows if phone/email provided
- Don't reveal which stores - just that a match exists

**Priority:** 58

---

### US-059: Create ProfileLinkRequestFlow component
**Description:** As a staff member, I want to request and manage profile links.

**Files to create:**
- `apps/store-app/src/components/clients/ProfileLinkRequestFlow.tsx` (NEW, ~220 lines)

**Acceptance Criteria:**
- [ ] Show pending link requests for current store
- [ ] Approve/Reject buttons for incoming requests
- [ ] Show status of outgoing requests
- [ ] Display requesting store info (name only)
- [ ] Confirmation dialog before approve/reject
- [ ] Success/error feedback
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Split into separate components if > 250 lines
- Follow existing modal/list patterns

**Priority:** 59

---

### US-060: Create LinkedStoresPanel component
**Description:** As a staff member, I want to see stores linked to a client.

**Files to create:**
- `apps/store-app/src/components/clients/LinkedStoresPanel.tsx` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] List stores linked to client's identity
- [ ] Show store name and link date
- [ ] Show what data is shared (safety, loyalty, etc.)
- [ ] "Unlink" button with confirmation
- [ ] Empty state if no links
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Add to client profile as collapsible section

**Priority:** 60

---

### US-061: Create EcosystemConsentModal component
**Description:** As a staff member, I want to manage client's ecosystem opt-in.

**Files to create:**
- `apps/store-app/src/components/clients/EcosystemConsentModal.tsx` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Explain what ecosystem sharing means
- [ ] Checkboxes for sharing preferences: Safety data, Loyalty points, Preferences
- [ ] "Opt In" / "Opt Out" buttons
- [ ] Show current status
- [ ] Confirmation for opt-out (will unlink all stores)
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Safety data sharing is mandatory if opted in
- Other preferences are optional

**Priority:** 61

---

### US-062: Add ecosystem features to client profile
**Description:** As a staff member, I want ecosystem info in the client profile.

**Files to modify:**
- `apps/store-app/src/components/client-settings/sections/ProfileSection.tsx` (~40 lines to add)

**Acceptance Criteria:**
- [ ] Add "Mango Network" collapsible section
- [ ] Show ecosystem opt-in status
- [ ] Show linked stores count
- [ ] "Manage" button opens EcosystemConsentModal
- [ ] Import and use LinkedStoresPanel
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Add near privacy/consent section

**Priority:** 62

---

### US-063: Create organization sharing database migration
**Description:** As a developer, I need database support for org-level client sharing.

**Files to create:**
- `supabase/migrations/038_org_client_sharing.sql` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Add `client_sharing_settings` JSONB column to organizations table
- [ ] Add `home_location_id` column to clients table
- [ ] Create `cross_location_visits` table: id, client_id, visiting_store_id, home_store_id, appointment_id, created_at
- [ ] Add RLS policies for org-scoped access
- [ ] Migration runs without errors

**Notes:**
- sharing_settings: {mode: 'full'|'selective'|'isolated', share_loyalty: boolean, share_wallet: boolean}

**Priority:** 63

---

### US-064: Create OrganizationClientSharing settings component
**Description:** As an org admin, I want to configure client sharing between locations.

**Files to create:**
- `apps/store-app/src/components/settings/OrganizationClientSharing.tsx` (NEW, ~220 lines)

**Acceptance Criteria:**
- [ ] Sharing mode dropdown: Full, Selective, Isolated
- [ ] Toggles for: Share loyalty points, Share wallet/credits
- [ ] Safety data always shared (no toggle, just info)
- [ ] Per-location override option
- [ ] Save button with loading state
- [ ] Only visible to org admins
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Add to Organization Settings section
- Full = all client data shared across org locations

**Priority:** 64

---

### US-065: Create CrossLocationClientView component
**Description:** As a staff member, I want to see client info from other org locations.

**Files to create:**
- `apps/store-app/src/components/clients/CrossLocationClientView.tsx` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Show client's home location
- [ ] Show visit history at other locations
- [ ] Show combined loyalty points (if org-wide)
- [ ] Show combined wallet balance (if org-wide)
- [ ] Indicate which data is from other locations
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Only shows if sharing mode is Full or Selective
- Follow existing section patterns

**Priority:** 65

---

### US-066: Add cross-location view to client profile
**Description:** As a staff member, I want cross-location info in profiles.

**Files to modify:**
- `apps/store-app/src/components/client-settings/sections/HistorySection.tsx` (~30 lines to add)

**Acceptance Criteria:**
- [ ] Add "Other Locations" tab or section
- [ ] Show CrossLocationClientView component
- [ ] Only show if org has multiple locations and sharing enabled
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- HistorySection is 9,454 lines - minimal additions

**Priority:** 66

---

### US-067: Create org client sharing thunks
**Description:** As a developer, I need thunks for org-level client operations.

**Files to modify:**
- `apps/store-app/src/store/slices/clientsSlice/multiStoreThunks.ts` (~80 lines to add)

**Acceptance Criteria:**
- [ ] Create `fetchCrossLocationVisits` thunk
- [ ] Create `fetchOrgClientSharing` thunk (get settings)
- [ ] Create `updateOrgClientSharing` thunk (update settings)
- [ ] Create `getOrgWideLoyalty` thunk (combined points across org)
- [ ] pnpm run typecheck passes

**Notes:**
- Add to existing multiStoreThunks.ts file

**Priority:** 67

---

### US-068: Add multi-store unit tests
**Description:** As a developer, I need tests for multi-store functionality.

**Files to create:**
- `apps/store-app/src/store/slices/clientsSlice/__tests__/multiStoreThunks.test.ts` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Test identity hashing normalization
- [ ] Test lookupEcosystemIdentity thunk
- [ ] Test requestProfileLink thunk
- [ ] Test respondToLinkRequest thunk
- [ ] Test org sharing permission checks
- [ ] All tests pass with `pnpm test`
- [ ] No forbidden strings

**Notes:**
- Mock Edge Function calls
- Test both success and error cases

**Priority:** 68

---

### US-069: Add ecosystem lookup to new client flow
**Description:** As a staff member, I want automatic ecosystem check when adding clients.

**Files to modify:**
- `apps/store-app/src/components/client-settings/components/AddClientModal.tsx` (~40 lines to add)

**Acceptance Criteria:**
- [ ] When phone or email entered, trigger ecosystem lookup
- [ ] Show EcosystemLookupPrompt if match found
- [ ] Allow continuing without linking
- [ ] Debounce lookup calls (500ms)
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Don't block client creation
- This is a helpful prompt, not a requirement

**Priority:** 69

---

## Functional Requirements Summary

### Phase 2 - GDPR
- FR-1: System stores data requests with audit trail
- FR-2: System exports client data as JSON/CSV
- FR-3: System anonymizes PII while preserving transactions
- FR-4: Staff can manage consent preferences per client

### Phase 3 - Forms/Segments
- FR-5: System sends forms via email/SMS
- FR-6: System generates PDF from completed forms
- FR-7: Staff can build custom client segments
- FR-8: Staff can import clients from CSV/Excel

### Phase 4 - Loyalty/Reviews
- FR-9: Owner can configure loyalty program
- FR-10: System sends review requests after checkout
- FR-11: System tracks referral codes and rewards

### Phase 5 - Multi-Store
- FR-12: System identifies clients across Mango ecosystem
- FR-13: Staff can request profile links between stores
- FR-14: Org admin can configure cross-location sharing
- FR-15: Safety data always syncs across linked stores

---

## Non-Goals (Out of Scope)

- Automated marketing campaigns (separate module)
- SMS/Email blast sending (separate feature)
- Real-time cross-store notifications
- Client self-service portal (separate app)
- AI-based client segmentation
- Integration with external CRM systems

---

## Technical Considerations

### Existing Patterns to Follow
- Thunks: `apps/store-app/src/store/slices/clientsSlice/thunks.ts`
- Edge Functions: `supabase/functions/clients/index.ts`
- Modals: `MergeClientsModal.tsx`, `BlockedClientOverrideModal.tsx`
- Settings: `apps/store-app/src/components/client-settings/sections/`

### Files That Will Be Large
- `clientsSlice/thunks.ts` - Already 1159 lines, split GDPR thunks to separate file
- `ClientSettings.tsx` - Already 31,884 lines, only add tabs/imports

### Environment Variables Needed
```env
VITE_ECOSYSTEM_SALT=<secure-random-string>
RESEND_API_KEY=<email-api-key>
TWILIO_ACCOUNT_SID=<sms-account>
TWILIO_AUTH_TOKEN=<sms-token>
```

---

## Testing Strategy

### Unit Tests (per phase)
- Phase 2: GDPR thunks, anonymization logic
- Phase 3: Form delivery, segment filtering
- Phase 4: Loyalty calculations, referral tracking
- Phase 5: Identity hashing, org permissions

### E2E Tests
- Full GDPR export/delete flow
- Form send and complete flow
- Ecosystem lookup and link flow

---

## Success Metrics

| Metric | Target |
|--------|--------|
| GDPR request processing | < 24 hours |
| Form delivery success | 95%+ |
| Loyalty program adoption | 60%+ clients |
| Cross-store client match | 80%+ accuracy |

---

## Appendix: Ralph Run Commands

```bash
# Phase 2: GDPR
cd /Users/seannguyen/Winsurf-built/Mango-POS-Client-Module
mkdir -p scripts/ralph/runs/client-module-phase2-gdpr
# Copy prd.json with US-001 to US-015
./scripts/ralph/ralph.sh 30 client-module-phase2-gdpr

# Phase 3: Forms/Segments
mkdir -p scripts/ralph/runs/client-module-phase3-forms
# Copy prd.json with US-016 to US-033
./scripts/ralph/ralph.sh 35 client-module-phase3-forms

# Phase 4: Loyalty/Reviews
mkdir -p scripts/ralph/runs/client-module-phase4-loyalty
# Copy prd.json with US-034 to US-049
./scripts/ralph/ralph.sh 30 client-module-phase4-loyalty

# Phase 5: Multi-Store
mkdir -p scripts/ralph/runs/client-module-phase5-multistore
# Copy prd.json with US-050 to US-069
./scripts/ralph/ralph.sh 40 client-module-phase5-multistore
```
