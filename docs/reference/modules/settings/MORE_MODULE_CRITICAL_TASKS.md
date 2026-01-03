# MORE Module - Critical Tasks Breakdown

> Reference: [MORE_MODULE_IMPLEMENTATION_PLAN.md](./MORE_MODULE_IMPLEMENTATION_PLAN.md)
> Status: Ready for Development
> Total Tasks: 47 tasks across 4 major features

---

## Quick Navigation

- [Task 1: End of Day Closeout](#task-1-end-of-day-closeout-module) (19 tasks)
- [Task 2: Account Settings](#task-2-account-settings-module) (10 tasks)
- [Task 3: Admin Back Office](#task-3-admin-back-office-module) (9 tasks)
- [Task 4: Quick Stats & UX](#task-4-quick-stats--ux-improvements) (9 tasks)

---

## Task 1: End of Day Closeout Module

**Priority:** 🔴 P0 - Critical
**Effort:** 4-5 days
**PRD Reference:** Sections 7.8, 1878-1926, 2820-2880

### 1.1 Foundation Setup

#### Task 1.1.1: Create Type Definitions
**File:** `src/components/closeout/types.ts`
**Effort:** 30 min

```typescript
// Types to define:
- CloseoutStep (enum: pre_check, sales_summary, cash_reconciliation, tip_distribution, final_sync, confirmation)
- PreCheckResult
- SalesSummary
- CashReconciliation
- TipAllocation
- CloseoutReport
- CloseoutState
- CloseoutWizardProps
```

**Acceptance Criteria:**
- [ ] All interfaces exported
- [ ] JSDoc comments on each interface
- [ ] Matches PRD requirements

---

#### Task 1.1.2: Create Constants
**File:** `src/components/closeout/constants.ts`
**Effort:** 20 min

```typescript
// Constants to define:
- CLOSEOUT_STEPS (array of step configs)
- VARIANCE_THRESHOLDS { warning: 10, requiresApproval: 20 }
- TIP_DISTRIBUTION_METHODS (equal, percentage, custom)
- REPORT_SECTIONS (for print layout)
```

**Acceptance Criteria:**
- [ ] All constants exported
- [ ] Matches PRD business rules

---

#### Task 1.1.3: Create Redux Slice
**File:** `src/store/slices/closeoutSlice.ts`
**Effort:** 1 hour

```typescript
// State shape:
interface CloseoutState {
  isActive: boolean;
  currentStep: CloseoutStep;
  preCheck: PreCheckResult | null;
  salesSummary: SalesSummary | null;
  cashReconciliation: CashReconciliation | null;
  tipDistribution: TipAllocation[];
  report: CloseoutReport | null;
  history: CloseoutReport[]; // Past closeouts
  loading: boolean;
  error: string | null;
}

// Actions:
- startCloseout
- setStep
- setPreCheckResult
- setSalesSummary
- setCashReconciliation
- setTipDistribution
- completeCloseout
- cancelCloseout
- loadHistory

// Thunks:
- runPreCheck (async)
- fetchSalesSummary (async)
- submitCloseout (async)
- fetchCloseoutHistory (async)
```

**Acceptance Criteria:**
- [ ] All actions and reducers implemented
- [ ] Thunks handle errors properly
- [ ] Selectors exported
- [ ] Unit tests pass

---

### 1.2 Wizard Hook

#### Task 1.2.1: Create Wizard State Hook
**File:** `src/components/closeout/hooks/useCloseoutWizard.ts`
**Effort:** 1.5 hours

```typescript
// Hook interface:
function useCloseoutWizard() {
  return {
    // State
    currentStep: CloseoutStep;
    steps: StepConfig[];
    canProceed: boolean;
    canGoBack: boolean;
    isComplete: boolean;

    // Data
    preCheck: PreCheckResult | null;
    salesSummary: SalesSummary | null;
    cashReconciliation: CashReconciliation | null;
    tipDistribution: TipAllocation[];

    // Actions
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (step: CloseoutStep) => void;
    updateCashCount: (amount: number) => void;
    updateTipAllocation: (allocation: TipAllocation[]) => void;
    complete: () => Promise<void>;
    cancel: () => void;

    // Status
    loading: boolean;
    error: string | null;
  };
}
```

**Acceptance Criteria:**
- [ ] Manages all wizard state
- [ ] Validates step transitions
- [ ] Integrates with Redux
- [ ] Handles async operations

---

### 1.3 Step Components

#### Task 1.3.1: Pre-Check Step
**File:** `src/components/closeout/steps/PreCheckStep.tsx`
**Effort:** 1 hour

**Requirements:**
- Check for open tickets (block if > 0, allow force with warning)
- Check pending sync queue (block if items pending)
- Check online status (block if offline)
- Show last sync time
- Display checklist with pass/fail status

**Dependencies:**
- `uiTicketsSlice.selectPendingTickets`
- `syncSlice.selectPendingCount`
- `syncSlice.selectIsOnline`

**UI Elements:**
- Checklist with icons (✓ / ✗)
- Warning banner for open tickets
- "Force Continue" button (requires manager PIN)
- "Proceed" button (enabled when all checks pass)

**Acceptance Criteria:**
- [ ] Displays all pre-checks
- [ ] Blocks appropriately
- [ ] Force continue requires PIN modal
- [ ] Clear visual feedback

---

#### Task 1.3.2: Sales Summary Step
**File:** `src/components/closeout/steps/SalesSummaryStep.tsx`
**Effort:** 1.5 hours

**Requirements:**
- Fetch today's transactions from Supabase
- Display summary cards:
  - Total Revenue
  - Transaction Count
  - Cash / Card / Other breakdown
  - Tips Collected
  - Refunds / Voids
  - Discounts Applied
- Read-only (no edits)

**Dependencies:**
- `transactionsSlice.fetchDailySummaryFromSupabase`
- `transactionsSlice.fetchPaymentBreakdownFromSupabase`

**UI Elements:**
- Summary cards grid (2x3 or 3x2)
- Payment method breakdown chart (optional)
- Transaction list (collapsible)
- "Continue" button

**Acceptance Criteria:**
- [ ] Accurate totals from real data
- [ ] Loading skeleton while fetching
- [ ] Error state if fetch fails
- [ ] Matches receipt totals

---

#### Task 1.3.3: Cash Reconciliation Step
**File:** `src/components/closeout/steps/CashReconciliationStep.tsx`
**Effort:** 2 hours

**Requirements:**
- Show expected cash (from sales summary)
- Cash counting input (denomination-based or total)
- Calculate variance
- Require explanation if variance > $5
- Require manager PIN if variance > $20
- Allow manager override

**UI Elements:**
- Expected cash display (read-only)
- Denomination grid (optional, toggle)
- Total counted input
- Variance display (color-coded: green/yellow/red)
- Explanation textarea (shown when variance exists)
- Manager PIN modal (shown when variance > threshold)

**Acceptance Criteria:**
- [ ] Accurate variance calculation
- [ ] Variance thresholds enforced
- [ ] PIN verification works
- [ ] Explanation saved with report

---

#### Task 1.3.4: Tip Distribution Step
**File:** `src/components/closeout/steps/TipDistributionStep.tsx`
**Effort:** 1.5 hours

**Requirements:**
- Show total tips collected
- List active staff who worked today
- Distribution methods:
  - Equal split
  - By hours worked
  - Custom percentages
- Validation: must sum to 100%

**Dependencies:**
- `uiStaffSlice.selectActiveStaff`
- Today's timesheet data (if available)

**UI Elements:**
- Distribution method selector (segmented control)
- Staff list with allocation inputs
- Real-time percentage sum
- Validation error message
- "Calculate" button for auto-split

**Acceptance Criteria:**
- [ ] All distribution methods work
- [ ] Validates 100% allocation
- [ ] Shows staff names and amounts
- [ ] Handles $0 tips gracefully

---

#### Task 1.3.5: Final Sync Step
**File:** `src/components/closeout/steps/FinalSyncStep.tsx`
**Effort:** 1 hour

**Requirements:**
- Force sync all pending items
- Show sync progress
- Block if offline
- Retry failed items

**Dependencies:**
- `syncManager.forceSync()`
- `syncSlice.selectPendingCount`
- `syncSlice.selectSyncProgress`

**UI Elements:**
- Sync progress indicator
- Items synced counter
- Success/failure status
- Retry button for failures
- "Continue" button (enabled when sync complete)

**Acceptance Criteria:**
- [ ] Shows real sync progress
- [ ] Handles offline gracefully
- [ ] Retry mechanism works
- [ ] Completes all pending items

---

#### Task 1.3.6: Confirmation Step
**File:** `src/components/closeout/steps/ConfirmationStep.tsx`
**Effort:** 1 hour

**Requirements:**
- Summary of all previous steps
- Final confirmation checkbox
- Generate closeout report
- Lock register after completion
- Show success animation

**UI Elements:**
- Summary accordion (all steps)
- Confirmation checkbox ("I confirm this is accurate")
- "Complete End of Day" button
- Success screen with:
  - Checkmark animation
  - Report preview
  - Print button
  - Email button

**Acceptance Criteria:**
- [ ] Shows accurate summary
- [ ] Requires confirmation
- [ ] Generates valid report
- [ ] Print/email work

---

### 1.4 Supporting Components

#### Task 1.4.1: Progress Indicator
**File:** `src/components/closeout/components/CloseoutProgress.tsx`
**Effort:** 30 min

**Requirements:**
- Show all 6 steps
- Highlight current step
- Show completed steps with checkmark
- Clickable to navigate (if step completed)

**Acceptance Criteria:**
- [ ] Visual progress clear
- [ ] Navigation works
- [ ] Responsive design

---

#### Task 1.4.2: Variance Alert Component
**File:** `src/components/closeout/components/VarianceAlert.tsx`
**Effort:** 20 min

**Requirements:**
- Color-coded alert based on variance amount
- Shows variance amount and percentage
- Different messaging for each threshold

**Acceptance Criteria:**
- [ ] Correct colors (green/yellow/red)
- [ ] Clear messaging

---

#### Task 1.4.3: Print Summary Component
**File:** `src/components/closeout/components/PrintSummary.tsx`
**Effort:** 45 min

**Requirements:**
- Printer-friendly layout
- All report data
- Store header
- Signature line
- Date/time

**Acceptance Criteria:**
- [ ] Prints correctly
- [ ] All data included
- [ ] Professional appearance

---

### 1.5 Main Container

#### Task 1.5.1: End of Day Closeout Container
**File:** `src/components/closeout/EndOfDayCloseout.tsx`
**Effort:** 1 hour

**Requirements:**
- Wizard container with step routing
- Header with back button
- Progress indicator
- Step content area
- Footer with navigation buttons

**Dependencies:**
- `useCloseoutWizard` hook
- All step components
- Progress indicator

**Props:**
```typescript
interface EndOfDayCloseoutProps {
  onBack?: () => void;
  onComplete?: (report: CloseoutReport) => void;
}
```

**Acceptance Criteria:**
- [ ] All steps render correctly
- [ ] Navigation works
- [ ] Back button works
- [ ] Completion callback fires

---

### 1.6 Index Export

#### Task 1.6.1: Create Index File
**File:** `src/components/closeout/index.ts`
**Effort:** 5 min

```typescript
export { EndOfDayCloseout } from './EndOfDayCloseout';
export type { CloseoutReport, CloseoutState } from './types';
```

---

### 1.7 Integration

#### Task 1.7.1: Add Route Handler
**File:** `src/components/layout/AppShell.tsx`
**Effort:** 10 min

```typescript
// Add import
import { EndOfDayCloseout } from '../closeout';

// Add case in renderModule()
case 'closeout':
  return <EndOfDayCloseout onBack={() => setActiveModule('more')} />;
```

**Acceptance Criteria:**
- [ ] Navigation from More works
- [ ] Back navigation works

---

### 1.8 Database Schema

#### Task 1.8.1: Create Supabase Migration
**File:** `supabase/migrations/XXX_create_closeout_reports.sql`
**Effort:** 30 min

See implementation plan for full schema.

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] Indexes created
- [ ] Constraints enforced

---

## Task 2: Account Settings Module

**Priority:** 🔴 P0 - Critical
**Effort:** 1.5 days

### 2.1 Foundation

#### Task 2.1.1: Create Type Definitions
**File:** `src/components/account/types.ts`
**Effort:** 20 min

```typescript
// Types:
- AccountSettingsSection (enum)
- StoreInfo
- SubscriptionInfo
- BillingInfo
- SecuritySettings
- AccountSettingsProps
```

---

#### Task 2.1.2: Create Constants
**File:** `src/components/account/constants.ts`
**Effort:** 15 min

```typescript
// Constants:
- SUBSCRIPTION_TIERS
- SECTION_LABELS
- TIMEZONE_OPTIONS
- CURRENCY_OPTIONS
```

---

### 2.2 Section Components

#### Task 2.2.1: Store Info Section
**File:** `src/components/account/sections/StoreInfoSection.tsx`
**Effort:** 1.5 hours

**Requirements:**
- Display store name, address, phone, email
- Edit mode toggle
- Form validation (Zod)
- Save to Supabase

**Dependencies:**
- `authSlice.selectStore`
- `storeAuthManager.getState()`

**UI Elements:**
- Store avatar/logo
- Editable fields (name, address, phone, email, timezone)
- Save/Cancel buttons
- Success toast on save

**Acceptance Criteria:**
- [ ] Displays current store info
- [ ] Edit mode works
- [ ] Validation prevents bad data
- [ ] Saves to backend

---

#### Task 2.2.2: Subscription Section
**File:** `src/components/account/sections/SubscriptionSection.tsx`
**Effort:** 1 hour

**Requirements:**
- Show current tier (badge)
- Show expiry date
- Show device/location usage vs limits
- Link to upgrade (external)

**Dependencies:**
- `licenseManager.getCurrentLicense()`

**UI Elements:**
- Tier badge (Starter/Pro/Enterprise)
- Expiry countdown (if < 30 days)
- Usage meters (devices, locations)
- "Manage Subscription" button (links to billing portal)

**Acceptance Criteria:**
- [ ] Accurate tier display
- [ ] Usage meters correct
- [ ] External link works

---

#### Task 2.2.3: Billing Section
**File:** `src/components/account/sections/BillingSection.tsx`
**Effort:** 45 min

**Requirements:**
- Show current payment method (masked)
- Next billing date
- Invoice history (recent 5)
- Link to billing portal

**UI Elements:**
- Payment method card (last 4 digits)
- Next billing date
- Invoice list with download links
- "Update Payment" button

**Acceptance Criteria:**
- [ ] Shows payment info
- [ ] Invoice downloads work
- [ ] External billing link works

---

#### Task 2.2.4: Security Section
**File:** `src/components/account/sections/SecuritySection.tsx`
**Effort:** 1 hour

**Requirements:**
- Change store password
- Two-factor authentication toggle (future)
- Session management (logout all devices)

**UI Elements:**
- Password change form
- 2FA toggle (disabled with "Coming Soon")
- "Logout All Devices" button with confirmation

**Acceptance Criteria:**
- [ ] Password change works
- [ ] Confirmation for dangerous actions
- [ ] Success/error feedback

---

### 2.3 Main Container

#### Task 2.3.1: Account Settings Container
**File:** `src/components/account/AccountSettings.tsx`
**Effort:** 45 min

**Requirements:**
- Tabbed interface for sections
- Header with back button
- Permission check (manager only)

**Acceptance Criteria:**
- [ ] All sections render
- [ ] Tab navigation works
- [ ] Permission enforced

---

### 2.4 Integration

#### Task 2.4.1: Create Index File
**File:** `src/components/account/index.ts`
**Effort:** 5 min

---

#### Task 2.4.2: Add Route Handler
**File:** `src/components/layout/AppShell.tsx`
**Effort:** 10 min

```typescript
import { AccountSettings } from '../account';

case 'account':
  return <AccountSettings onBack={() => setActiveModule('more')} />;
```

---

## Task 3: Admin Back Office Module

**Priority:** 🔴 P0 - Critical
**Effort:** 1.5 days

### 3.1 Foundation

#### Task 3.1.1: Create Type Definitions
**File:** `src/components/admin-backoffice/types.ts`
**Effort:** 20 min

```typescript
// Types:
- AdminSection (enum)
- GeneralSettings
- TaxSettings
- PaymentSettings
- ReceiptSettings
- NotificationSettings
```

---

### 3.2 Section Components

#### Task 3.2.1: General Settings Section
**File:** `src/components/admin-backoffice/sections/GeneralSettingsSection.tsx`
**Effort:** 1.5 hours

**Requirements:**
- Business hours configuration
- Holiday calendar
- Walk-in settings
- Appointment buffer time

**UI Elements:**
- Day-by-day hours editor
- Holiday date picker
- Toggle switches for settings
- Save button

---

#### Task 3.2.2: Tax Settings Section
**File:** `src/components/admin-backoffice/sections/TaxSettingsSection.tsx`
**Effort:** 1 hour

**Requirements:**
- Default tax rate
- Multiple tax rates (state, local)
- Tax-exempt services list

**UI Elements:**
- Tax rate inputs (percentage)
- Add/remove tax rates
- Service exclusion multi-select

---

#### Task 3.2.3: Payment Settings Section
**File:** `src/components/admin-backoffice/sections/PaymentSettingsSection.tsx`
**Effort:** 1 hour

**Requirements:**
- Accepted payment methods
- Tip suggestions (15%, 18%, 20%, 25%)
- Processor configuration (if applicable)

**UI Elements:**
- Payment method toggles
- Tip preset inputs
- Processor status indicator

---

#### Task 3.2.4: Receipt Settings Section
**File:** `src/components/admin-backoffice/sections/ReceiptSettingsSection.tsx`
**Effort:** 45 min

**Requirements:**
- Receipt header text
- Receipt footer text
- Logo toggle
- Tip line toggle

**UI Elements:**
- Text inputs with character limit
- Toggle switches
- Preview button

---

#### Task 3.2.5: Notification Settings Section
**File:** `src/components/admin-backoffice/sections/NotificationSettingsSection.tsx`
**Effort:** 45 min

**Requirements:**
- Appointment reminders toggle
- Reminder timing (hours before)
- Marketing opt-in default

**UI Elements:**
- Toggle switches
- Dropdown for timing
- Warning about compliance

---

### 3.3 Main Container

#### Task 3.3.1: Admin Back Office Container
**File:** `src/components/admin-backoffice/AdminBackOffice.tsx`
**Effort:** 45 min

**Requirements:**
- Accordion sections
- Header with back button
- Offline check (disable if offline)
- Permission check (manager only)

---

### 3.4 Integration

#### Task 3.4.1: Create Index & Route
**Files:** `src/components/admin-backoffice/index.ts`, `AppShell.tsx`
**Effort:** 15 min

---

## Task 4: Quick Stats & UX Improvements

**Priority:** 🟠 P1 - High
**Effort:** 1 day

### 4.1 Dashboard Selectors

#### Task 4.1.1: Create Dashboard Selectors
**File:** `src/store/selectors/dashboardSelectors.ts`
**Effort:** 45 min

```typescript
// Selectors:
- selectTodayRevenue
- selectTodayTransactionCount
- selectTodayClientCount
- selectActiveStaffCount
- selectTodayPaymentBreakdown
```

**Dependencies:**
- `transactionsSlice`
- `uiTicketsSlice`
- `uiStaffSlice`

**Acceptance Criteria:**
- [ ] Memoized with createSelector
- [ ] Returns correct values
- [ ] Unit tests pass

---

### 4.2 More Module Updates

#### Task 4.2.1: Integrate Quick Stats
**File:** `src/components/modules/More.tsx`
**Effort:** 30 min

Replace hardcoded values with selector data.

---

#### Task 4.2.2: Add Logout Confirmation
**File:** `src/components/modules/More.tsx`
**Effort:** 20 min

Use existing `ConfirmDialog` component.

```typescript
// Already exists: src/components/common/ConfirmDialog.tsx
import { ConfirmDialog } from '../common/ConfirmDialog';
```

---

#### Task 4.2.3: Environment-Based Menu Items
**File:** `src/components/modules/More.tsx`
**Effort:** 20 min

Filter DEV items based on `import.meta.env.DEV`.

---

#### Task 4.2.4: Add Loading States
**File:** `src/components/modules/More.tsx`
**Effort:** 20 min

Show skeleton while stats load.

---

### 4.3 Permission Checks

#### Task 4.3.1: Create Permission Hook
**File:** `src/hooks/usePermissions.ts`
**Effort:** 45 min

```typescript
function usePermissions() {
  return {
    hasPermission: (permission: string) => boolean;
    isManager: boolean;
    isOwner: boolean;
    canAccessCloseout: boolean;
    canAccessAdmin: boolean;
  };
}
```

---

#### Task 4.3.2: Add Permission Checks to Menu Items
**File:** `src/components/modules/More.tsx`
**Effort:** 30 min

Gray out or hide items based on permissions.

---

### 4.4 Transaction Loading

#### Task 4.4.1: Load Transactions on App Init
**File:** `src/components/layout/AppShell.tsx`
**Effort:** 15 min

Add transaction fetch to `initApp()`.

---

## Summary: Task Counts by Priority

| Priority | Feature | Tasks | Effort |
|----------|---------|-------|--------|
| 🔴 P0 | End of Day Closeout | 19 | 4-5 days |
| 🔴 P0 | Account Settings | 10 | 1.5 days |
| 🔴 P0 | Admin Back Office | 9 | 1.5 days |
| 🟠 P1 | Quick Stats & UX | 9 | 1 day |
| **Total** | | **47** | **8-10 days** |

---

## Recommended Execution Order

### Week 1: Core Features

```
Day 1:
├── 1.1.1: Closeout types ✓
├── 1.1.2: Closeout constants ✓
├── 1.1.3: Closeout Redux slice ✓
└── 1.2.1: Wizard hook ✓

Day 2:
├── 1.3.1: PreCheckStep ✓
├── 1.3.2: SalesSummaryStep ✓
└── 1.3.3: CashReconciliationStep ✓

Day 3:
├── 1.3.4: TipDistributionStep ✓
├── 1.3.5: FinalSyncStep ✓
├── 1.3.6: ConfirmationStep ✓
└── 1.4.1-3: Supporting components ✓

Day 4:
├── 1.5.1: Closeout container ✓
├── 1.6.1: Index export ✓
├── 1.7.1: Route handler ✓
├── 2.1.1-2: Account types/constants ✓
└── 2.2.1-4: Account sections ✓

Day 5:
├── 2.3.1: Account container ✓
├── 2.4.1-2: Account integration ✓
├── 3.1.1: Admin types ✓
└── 3.2.1-5: Admin sections ✓
```

### Week 2: Polish & Integration

```
Day 1:
├── 3.3.1: Admin container ✓
├── 3.4.1: Admin integration ✓
├── 4.1.1: Dashboard selectors ✓
└── 4.2.1-4: More module updates ✓

Day 2:
├── 4.3.1-2: Permission system ✓
├── 4.4.1: Transaction loading ✓
├── 1.8.1: Database migration ✓
└── Testing & bug fixes
```

---

## File Creation Checklist

### New Directories
- [ ] `src/components/closeout/`
- [ ] `src/components/closeout/steps/`
- [ ] `src/components/closeout/components/`
- [ ] `src/components/closeout/hooks/`
- [ ] `src/components/account/`
- [ ] `src/components/account/sections/`
- [ ] `src/components/admin-backoffice/`
- [ ] `src/components/admin-backoffice/sections/`
- [ ] `src/store/selectors/`

### New Files (47 total)
See individual tasks above.

### Modified Files
- [ ] `src/components/layout/AppShell.tsx` (3 route handlers)
- [ ] `src/components/modules/More.tsx` (quick stats, logout, env check)
- [ ] `src/store/index.ts` (add closeoutSlice)

---

## Dependencies Between Tasks

```
Task 1.1.1 (types) ──────────┐
Task 1.1.2 (constants) ──────┼──► Task 1.1.3 (slice) ──► Task 1.2.1 (hook)
                             │
                             └──► Tasks 1.3.x (steps) ──► Task 1.5.1 (container)
                                                              │
                                                              ▼
                                                    Task 1.7.1 (route)

Task 4.1.1 (selectors) ──► Task 4.2.1 (quick stats)
Task 4.3.1 (permissions) ──► Task 4.3.2 (menu checks)
```

---

## Risk Mitigation

| Risk | Task | Mitigation |
|------|------|------------|
| Sync fails during closeout | 1.3.5 | Add retry logic, allow skip with manager approval |
| Cash variance disputes | 1.3.3 | Require photo upload option, manager signature |
| Offline during closeout | 1.3.1 | Block clearly, save progress locally |
| Permission system incomplete | 4.3.1 | Default to manager-only initially |
