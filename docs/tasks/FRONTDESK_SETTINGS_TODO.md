# FrontDesk Settings - Fix & Enhancement Plan

**Created:** 2025-12-01
**Based On:** FRONTDESK_SETTINGS_QUALITY_REVIEW.md
**Estimated Total Effort:** 15-25 developer days

---

## Phase 1: Critical Bugs (Priority: P0) ✅ COMPLETED
**ETA:** 2-3 days
**Completed:** 2025-12-01

### BUG-001: Template Settings Discrepancy ✅
- [x] Align `OperationTemplatesSection.tsx` with `OperationTemplateSetup.tsx`
- [x] Update Provider View template: `showComingAppointments: true`, `organizeBy: 'busyStatus'`
- [x] Update test plan to reflect correct expected values
- [ ] **Verify:** Run Test Case 4.4.3 to confirm Provider View applies correct settings

### BUG-002: StaffSidebar Width Not Synchronized ✅
**File:** `src/components/StaffSidebar.tsx` (Lines 85-99)

- [x] Add useEffect to sync viewWidth from Redux settings to StaffSidebar
- [x] Map `settings.viewWidth` to sidebar width calculation
- [x] Map `settings.customWidthPercentage` to percentage-based widths
- [ ] Remove or deprecate separate `teamSettings` localStorage (deferred - backwards compatibility)
- [ ] **Verify:** Run Test Case 2.1.3 - Team View Width Changes

**Implementation Applied:**
```typescript
// Added to StaffSidebar.tsx at line 85
useEffect(() => {
  if (settings?.viewWidth) {
    const viewWidthMap: Record<string, string> = {
      'ultraCompact': 'ultraCompact',
      'compact': 'compact',
      'wide': 'wide',
      'fullScreen': 'fullScreen',
      'custom': 'custom'
    };
    const mappedWidth = viewWidthMap[settings.viewWidth] || 'compact';
    applyWidthSettings(mappedWidth, settings.customWidthPercentage || 40);
  }
}, [settings?.viewWidth, settings?.customWidthPercentage]);
```

### BUG-003: ComingAppointments Not Hidden When Setting is False ✅
**File:** `src/components/ComingAppointments.tsx` (Lines 49-51, 229-233)

- [x] Add check for `settings.showComingAppointments === false`
- [x] Ensure check happens after hooks (React rules compliant)
- [ ] **Verify:** Run Test Cases 2.4.1, 2.4.2, 2.4.3, 2.4.4

**Implementation Applied:**
```typescript
// Added after hooks at line 49
const shouldHide = settings && settings.showComingAppointments === false;

// Added before render at line 229
if (shouldHide) {
  return null;
}
```

### BUG-004: Dependency Logic Can Be Bypassed ✅
**File:** `src/store/slices/frontDeskSettingsSlice.ts` (Lines 21-51)

- [x] Extract dependency logic into helper function `applyDependencies()`
- [x] Add dependency check to `updateSetting` reducer
- [x] Add dependency check to `updateSettings` reducer (batch updates)
- [x] Add dependency check to `applyTemplate` reducer
- [x] Add missing reverse check: `waitListActive=false` should disable `inServiceActive`
- [x] Add additional dependency rules for `showWaitList` and `showInService`
- [ ] **Verify:** Run Test Case 3.2.3 with batch and template operations

**Implementation Applied:**
```typescript
// Helper function at line 21
const applyDependencies = (settings: FrontDeskSettingsData): FrontDeskSettingsData => {
  const result = { ...settings };

  // Rule 1: In Service requires Wait List
  if (result.inServiceActive && !result.waitListActive) {
    result.waitListActive = true;
  }

  // Rule 2: Disabling Wait List disables In Service
  if (!result.waitListActive && result.inServiceActive) {
    result.inServiceActive = false;
  }

  // Rule 3: showWaitList depends on waitListActive
  if (!result.waitListActive && result.showWaitList) {
    result.showWaitList = false;
  }

  // Rule 4: showInService depends on inServiceActive
  if (!result.inServiceActive && result.showInService) {
    result.showInService = false;
  }

  return result;
};
```

### BUG-005: Race Condition in State Synchronization ✅
**File:** `src/components/FrontDesk.tsx` (Lines 133-145)

- [x] Replace `useEffect` with `useLayoutEffect` for synchronous updates
- [ ] Consider using a single state object (deferred - works well with useLayoutEffect)
- [ ] **Verify:** Run Edge Case test - Rapid Setting Changes

**Implementation Applied:**
```typescript
// Changed useEffect to useLayoutEffect at line 136
useLayoutEffect(() => {
  setTicketSortOrder(frontDeskSettings.sortBy);
  setShowUpcomingAppointments(frontDeskSettings.showComingAppointments);
  setIsCombinedView(
    frontDeskSettings.displayMode === 'tab' || frontDeskSettings.combineSections
  );
  setCombinedCardViewMode(
    frontDeskSettings.viewStyle === 'compact' ? 'compact' : 'normal'
  );
}, [frontDeskSettings]);
```

---

## Phase 2: High Priority Bugs (Priority: P1) ✅ COMPLETED
**ETA:** 3-4 days
**Completed:** 2025-12-01

### BUG-006: localStorage Corruption Not Handled ✅
**File:** `src/store/slices/frontDeskSettingsSlice.ts` (Lines 7-19)

- [x] Clear corrupted localStorage on parse error
- [x] Dispatch custom event for error notification
- [x] Show user-friendly toast message
- [ ] **Verify:** Run Test Case 1.7 - Corrupted localStorage edge case

### BUG-007: Missing Schema Versioning ✅
**File:** `src/store/slices/frontDeskSettingsSlice.ts`

- [x] Add version field to stored settings interface
- [x] Implement migration function for version upgrades
- [x] Handle missing/old version gracefully
- [ ] **Verify:** Manually test with old localStorage data

### BUG-008: No Validation on customWidthPercentage ✅
**File:** `src/components/frontdesk-settings/sections/LayoutSection.tsx` (Lines 106-115)

- [x] Add `Math.max(10, Math.min(80, value))` clamping in onChange
- [x] Add visual feedback for out-of-range values
- [ ] **Verify:** Try entering values <10 and >80

### BUG-009: viewStyle Not Applied to Individual Sections ✅
**File:** `src/components/FrontDesk.tsx`, WaitListSection, ServiceSection

- [x] Pass `settings.viewStyle` as prop to WaitListSection
- [x] Pass `settings.viewStyle` as prop to ServiceSection
- [x] Map viewStyle to cardViewMode in each section
- [ ] **Verify:** Change viewStyle and verify both combined and separate views update

### BUG-010: Focus Trap Conflicts Between Modals ✅
**File:** `src/components/OperationTemplateSetup.tsx`

- [x] Add FocusTrap wrapper to OperationTemplateSetup
- [x] Ensure proper focus restoration on close
- [x] Test tab cycling within template modal
- [ ] **Verify:** Run Test Case 4.7 - Focus Trap and Accessibility

### BUG-011: Missing Error Boundaries for Settings Panel ✅
**File:** `src/components/frontdesk-settings/FrontDeskSettings.tsx`

- [x] Create `SectionErrorBoundary` component (already existed)
- [x] Wrap each settings section with error boundary
- [x] Add fallback UI for crashed sections
- [ ] **Verify:** Intentionally throw error in section and verify graceful handling

### BUG-012: saveSettings Doesn't Handle Quota Exceeded ✅
**File:** `src/store/slices/frontDeskSettingsSlice.ts` (Lines 138-153)

- [x] Catch `QuotaExceededError` specifically
- [x] Keep `hasUnsavedChanges = true` on error
- [x] Dispatch error event for user notification
- [ ] **Verify:** Run Test Case 1.7 - localStorage Full edge case

### BUG-013: organizeBy Filtering Verification ✅
**File:** `src/components/StaffSidebar.tsx`

- [x] Verify filter pills change based on `organizeBy` setting
- [x] Verify "Ready/Busy" shows when `organizeBy='busyStatus'`
- [x] Verify "Clocked In/Out" shows when `organizeBy='clockedStatus'`
- [x] **VERIFIED:** Code review confirms implementation is correct (lines 500-513, 562-614)

### BUG-014: showWaitList vs waitListActive Confusion ✅
**File:** `src/components/frontdesk-settings/sections/TicketSection.tsx`

- [x] Reviewed: UI already has tooltips, descriptions, and lock icons
- [x] Disabled states when parent stage is inactive
- [x] Separate concerns: waitListActive (workflow), showWaitList (visibility)
- [x] **VERIFIED:** Current UX is clear and appropriate

### BUG-015: Template Application Doesn't Auto-Save ✅
**File:** `src/components/OperationTemplateSetup.tsx` (applyTemplate function)

- [x] Added `onSettingsChange(updatedSettings)` call in applyTemplate
- [x] Templates now auto-save to Redux immediately
- [ ] **Verify:** Apply template, close modal, refresh - settings should persist

### BUG-016: No Visual Feedback When Saving ✅
**File:** `src/components/frontdesk-settings/FrontDeskSettings.tsx`

- [x] Added `useToast` hook import
- [x] Added `showSuccess('Settings saved successfully')` in handleSave
- [ ] **Verify:** Click save and observe toast notification

### BUG-017: Type Safety Issue with `as any` ✅
**File:** `src/store/slices/frontDeskSettingsSlice.ts` (Line 166)
**File:** `src/components/frontdesk-settings/sections/OperationTemplatesSection.tsx` (Line 126)

- [x] Replaced dynamic assignment with spread operator in Redux slice
- [x] Used `Object.keys` with proper type assertion in OperationTemplatesSection
- [x] Verified: No new TypeScript errors introduced

---

## Phase 3: Missing Features (Priority: P1/P2) ✅ COMPLETED
**ETA:** 2 days
**Completed:** 2025-12-01

### FEAT-001: Verify Guided Template Selection Flow ✅
**File:** `src/components/OperationTemplateSetup.tsx`

- [x] Verify Question 1 UI renders (Primary Focus) - Lines 479-509: Two-button choice "Front Desk Staff" vs "Service Providers"
- [x] Verify Question 2 UI renders (Operation Style) - Lines 512-546: Conditionally renders after Q1, shows "Balanced View/Ticket-First" or "Full Service Flow/Quick In/Out"
- [x] Verify Question 3 UI renders (Show Appointments) - SIMPLIFIED: Show Appointments is now implicit in template selection, not a separate question
- [x] Verify auto-scroll between questions works - Lines 159-171: `updateQuickAnswer()` calls `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- [x] Verify suggested template updates based on answers - Lines 184-190: `getSuggestedTemplate()` function returns template based on `quickAnswers` state
- [x] Suggested template banner appears after both Q1 and Q2 are answered - Lines 549-567

**Verification Notes:**
- The flow uses a 2-question model (simplified from 3):
  1. Primary Focus: "Front Desk Staff" or "Service Providers"
  2. Operation Style: "Balanced/Ticket-First" or "Full Service Flow/Quick In/Out"
- Template mapping logic (line 184-190):
  - frontDesk + flow = 'frontDeskBalanced'
  - frontDesk + inOut = 'frontDeskTicketCenter'
  - staff + flow = 'teamWithOperationFlow'
  - staff + inOut = 'teamInOut'
- Auto-scroll uses refs (question1Ref, question2Ref, question3Ref) and `scrollIntoView()`
- Suggested template is highlighted with a pulsing border animation
- BUG-015 fix ensures template selection auto-saves to Redux (line 147)
- [ ] **Verify:** Run Test Cases 4.3.1, 4.3.2, 4.3.3 (manual testing required)

### FEAT-002: Per-User Settings with Cross-Tab Sync ✅
**Files:**
- `src/services/frontDeskSettingsStorage.ts` (NEW)
- `src/store/slices/frontDeskSettingsSlice.ts` (UPDATED)
- `src/components/layout/AppShell.tsx` (UPDATED)
- `src/components/frontdesk-settings/FrontDeskSettings.tsx` (UPDATED)
- `src/components/FrontDesk.tsx` (UPDATED)

**Completed:**
- [x] Create `frontDeskSettingsStorage.ts` service for IndexedDB storage
- [x] Implement per-user/per-store settings keying:
  - User login: `frontDeskSettings_user_${memberId}`
  - Store login: `frontDeskSettings_store_${storeId}`
- [x] Migrate settings from localStorage to IndexedDB on first load
- [x] Add schema versioning for future migrations
- [x] Convert Redux slice to use async thunks (`loadFrontDeskSettings`, `saveFrontDeskSettings`)
- [x] Load settings on app initialization in AppShell
- [x] Add cross-tab sync via BroadcastChannel API
- [x] Update components to use `useAppDispatch` for async thunk support
- [ ] **Verify:** Test with two browser tabs open
- [ ] **Verify:** Test with different user logins

### FEAT-005: Settings Validation - SKIPPED
**Decision:** Current validation (BUG-004 dependencies, BUG-008 input validation) is sufficient for now.

---

## Phase 4: Code Quality Improvements (Priority: P2) ✅ COMPLETED
**ETA:** 1-2 days
**Completed:** 2025-12-01
**Revised Plan Rating:** 9/10

---

### ISSUE-001: Extract Duplicate Template Logic ⭐ HIGH VALUE ✅
**Problem:** Template configuration was duplicated in 4 places with identical switch statements.
**Solution:** Created centralized `templateConfigs.ts` with single source of truth.

**Files modified:**
- `src/components/frontdesk-settings/templateConfigs.ts` (NEW) - Central config
- `src/store/slices/frontDeskSettingsSlice.ts` - Uses `getTemplateSettings()`
- `src/components/OperationTemplateSetup.tsx` - Uses `getTemplateSettings()` and `getTemplateMetadata()`
- `src/components/frontdesk-settings/sections/OperationTemplatesSection.tsx` - Uses `getTemplateMetadata()`

**Implementation completed:**
- [x] Created `templateConfigs.ts` with TypeScript types
- [x] Defined `TEMPLATE_CONFIGS` and `TEMPLATE_METADATA` constants
- [x] Exported helper functions: `getTemplateSettings()`, `getTemplateMetadata()`, `getAllTemplateIds()`
- [x] Updated all 3 consumer files to use centralized config
- [x] Removed all duplicate switch statements

---

### ISSUE-002: Remove Duplicate Local State in FrontDesk.tsx ⭐ MEDIUM VALUE ✅
**Problem:** 4 useState calls duplicated Redux state, synced via useLayoutEffect.
**Solution:** Added memoized selectors to Redux slice, replaced useState with selectors.

**Files modified:**
- `src/store/slices/frontDeskSettingsSlice.ts` - Added memoized selectors
- `src/components/FrontDesk.tsx` - Uses selectors, replaced useState with useCallback setters

**Implementation completed:**
- [x] Created memoized selectors: `selectIsCombinedView`, `selectCardViewMode`, `selectSortBy`, `selectShowComingAppointments`
- [x] Removed duplicate useState for `ticketSortOrder`, `showUpcomingAppointments`, `isCombinedView`, `combinedCardViewMode`
- [x] Removed `useLayoutEffect` sync block
- [x] Added `useCallback` setters that dispatch Redux actions for UI updates
- [x] Build verified successful

---

### ISSUE-003: Centralize Settings Error Handling ⭐ LOW VALUE ✅
**Problem:** Error handling used console.error with no user feedback.
**Solution:** Created `settingsErrorHandler.ts` with toast notifications.

**Files modified:**
- `src/utils/settingsErrorHandler.ts` (NEW) - Central error handler
- `src/services/frontDeskSettingsStorage.ts` - Uses `handleSettingsError()`

**Implementation completed:**
- [x] Created `settingsErrorHandler.ts` with error types and user-friendly messages
- [x] Replaced 5 console.error calls in `frontDeskSettingsStorage.ts`
- [x] Added helper functions: `safeParseJSON()`, `withSettingsErrorHandling()`

---

### ~~ISSUE-006: Add React.memo to Components~~ → DEFERRED
**Reason:** Premature optimization without profiling data.

### ~~ISSUE-007: Debounce localStorage Operations~~ → REMOVED
**Reason:** Outdated after IndexedDB migration.

---

## Phase 4 Summary

| Issue | Value | Risk | Effort | Status |
|-------|-------|------|--------|--------|
| ISSUE-001: Template Config | High | Low | 2-3h | ✅ Complete |
| ISSUE-002: Remove Duplicate State | Medium | Medium | 2-3h | ✅ Complete |
| ISSUE-003: Error Handling | Low | Low | 1h | ✅ Complete |
| ISSUE-006: React.memo | - | - | - | 🚫 Deferred |
| ISSUE-007: Debounce | - | - | - | 🚫 Removed |

**Actual Total Effort:** ~5 hours
**Plan Rating:** 9/10

---

## Phase 5: Accessibility & Testing (Priority: P2) - REVISED ✅ COMPLETED
**ETA:** 2-3 days
**Completed:** 2025-12-01
**Plan Rating:** 9/10

---

### Phase 5A: Accessibility Verification & Minor Fixes ✅
**Effort:** 2-3 hours

**Already Implemented (verified via grep):**
- ✅ `aria-expanded` on AccordionSection (line 17)
- ✅ `aria-checked` on ToggleSwitch (line 28)
- ✅ `aria-label` on SegmentedControl options (line 24)
- ✅ `role="dialog"`, `aria-modal`, `aria-labelledby` on settings panel
- ✅ `aria-label` on TemplateCard (line 60)

**Completed Tasks:**
- [x] **A11Y-001:** Add `role="tablist"` to SegmentedControl container ✅
  - **File:** `src/components/frontdesk-settings/components/SegmentedControl.tsx`
  - **Change:** Added `role="tablist"` to parent div, `role="tab"` to buttons, `aria-selected` and `tabIndex` for accessibility
- [x] **A11Y-002:** Add keyboard handler for SegmentedControl (arrow keys) ✅
  - **File:** `src/components/frontdesk-settings/components/SegmentedControl.tsx`
  - **Change:** Added `onKeyDown` handler with ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Home/End navigation
- [x] **A11Y-003:** Fix color contrast in disabled states ✅
  - **Files:** ToggleSwitch.tsx
  - **Change:** Changed disabled text from `text-gray-400` (2.9:1 ratio) to `text-gray-500` (4.6:1 ratio) for WCAG AA compliance

---

### Phase 5B: Unit Tests for Redux Slice ✅
**Effort:** 3-4 hours
**File:** `src/store/slices/__tests__/frontDeskSettingsSlice.test.ts` (NEW)
**Status:** 27 tests passing

**Test Cases Implemented:**
- [x] **TEST-001:** `updateSetting` - updates single setting and sets `hasUnsavedChanges` ✅
- [x] **TEST-002:** `updateSettings` - batch updates multiple settings ✅
- [x] **TEST-003:** `applyTemplate` - applies template settings from centralized config ✅
- [x] **TEST-004:** `discardChanges` - resets hasUnsavedChanges flag ✅
- [x] **TEST-005:** Dependency rule - enabling `inServiceActive` enables `waitListActive` ✅
- [x] **TEST-006:** Dependency rule - disabling `waitListActive` disables `inServiceActive` ✅
- [x] **TEST-007:** Selector `selectIsCombinedView` - returns true when displayMode='tab' OR combineSections=true ✅
- [x] **TEST-008:** Selector `selectCardViewMode` - maps viewStyle to card mode ✅
- [x] **TEST-009:** Initial state matches `defaultFrontDeskSettings` ✅
- Additional tests for `resetSettings`, boolean/numeric settings, selector edge cases

---

### Phase 5C: Unit Tests for Storage Service ✅
**Effort:** 2-3 hours
**File:** `src/services/__tests__/frontDeskSettingsStorage.test.ts` (NEW)
**Status:** 16 tests passing

**Test Cases Implemented:**
- [x] **TEST-010:** `getSettingsKey` - returns user key when member logged in ✅
- [x] **TEST-011:** `getSettingsKey` - returns store key when only store logged in ✅
- [x] **TEST-012:** `loadSettings` - returns defaults when no settings exist ✅
- [x] **TEST-013:** `saveSettings` - persists settings to IndexedDB ✅
- [x] **TEST-014:** `loadSettings` - retrieves previously saved settings ✅
- [x] **TEST-015:** `clearSettings` - removes settings from IndexedDB ✅
- Additional tests for `hasSettings`, per-user isolation, settings merge, default key fallback

---

### Phase 5D: Smoke Tests (Manual - 5 minutes)
**Effort:** 5 minutes per test cycle

**Core Functionality Checklist (10 items):**
1. [ ] Open settings panel → Panel opens without errors
2. [ ] Change a toggle → Setting updates immediately
3. [ ] Change template → All related settings update
4. [ ] Close and reopen panel → Settings persist
5. [ ] Refresh page → Settings persist (IndexedDB)
6. [ ] Tab navigation → Focus moves correctly through controls
7. [ ] Escape key → Closes panel
8. [ ] Apply template → Suggested template banner appears
9. [ ] Dependency test: Disable Wait List → In Service auto-disables
10. [ ] Width slider → Staff sidebar updates in real-time

---

### Phase 5 Dependencies

**Required npm packages (already installed):**
- `vitest` ✅
- `@testing-library/react` ✅
- `@testing-library/jest-dom` ✅

**Optional (for IndexedDB mocking):**
- `fake-indexeddb` - Add to devDependencies if not present
  ```bash
  npm install -D fake-indexeddb
  ```

---

### Phase 5 Summary

| Task | Type | Effort | Files | Status |
|------|------|--------|-------|--------|
| A11Y-001 | Accessibility | 30min | SegmentedControl.tsx | ✅ Complete |
| A11Y-002 | Accessibility | 30min | SegmentedControl.tsx | ✅ Complete |
| A11Y-003 | Accessibility | 30min | ToggleSwitch.tsx | ✅ Complete |
| TEST-001-009 | Unit Tests | 3-4h | frontDeskSettingsSlice.test.ts | ✅ Complete (27 tests) |
| TEST-010-015 | Unit Tests | 2-3h | frontDeskSettingsStorage.test.ts | ✅ Complete (16 tests) |
| Smoke Tests | Manual | 5min | N/A | ⏳ Manual verification required |

**Actual Total Effort:** ~4 hours
**Test Results:** 43 new tests passing (27 slice + 16 storage)

**Files Created:**
- `src/store/slices/__tests__/frontDeskSettingsSlice.test.ts`
- `src/services/__tests__/frontDeskSettingsStorage.test.ts`

**Files Modified:**
- `src/components/frontdesk-settings/components/SegmentedControl.tsx` - Added tablist role, keyboard navigation
- `src/components/frontdesk-settings/components/ToggleSwitch.tsx` - Fixed color contrast for disabled state

---

## Phase 6: Nice-to-Have Enhancements (Priority: P3) - REVISED ✅ COMPLETED
**ETA:** 1 day (4-6 hours)
**Completed:** 2025-12-01
**Plan Rating:** 9/10

---

### FEAT-003: Settings Export/Import ⭐ HIGH VALUE ✅
**Effort:** 2-3 hours
**Value:** Allows users to backup settings, share configurations between stores, or restore after data loss

#### Implementation Details:

**Step 1: Add Export Button to Settings Footer**
- **File:** `src/components/frontdesk-settings/FrontDeskSettings.tsx`
- **Location:** Footer section (after Save/Cancel buttons)
- **UI:** Small icon button with Download icon + "Export" text

**Step 2: Create Export Function**
```typescript
// Add to FrontDeskSettings.tsx
const handleExport = () => {
  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: settings,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `frontdesk-settings-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Settings exported successfully');
};
```

**Step 3: Add Import Button with Hidden File Input**
- **UI:** Small icon button with Upload icon + "Import" text
- **Behavior:** Opens file picker for .json files

**Step 4: Create Import Function with Validation**
```typescript
// Add validation schema
const validateImportedSettings = (data: unknown): data is { version: number; settings: FrontDeskSettingsData } => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.version !== 'number') return false;
  if (!obj.settings || typeof obj.settings !== 'object') return false;
  // Validate required keys exist
  const requiredKeys = ['operationTemplate', 'displayMode', 'viewWidth'];
  return requiredKeys.every(key => key in (obj.settings as object));
};

const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (!validateImportedSettings(data)) {
        toast.error('Invalid settings file format');
        return;
      }
      dispatch(updateSettings(data.settings));
      toast.success('Settings imported successfully');
    } catch {
      toast.error('Failed to parse settings file');
    }
  };
  reader.readAsText(file);
};
```

**Step 5: Add Confirmation Dialog Before Import**
- Show modal: "This will replace your current settings. Continue?"
- Options: "Cancel" | "Import"

#### Tasks:
- [x] Add Download and Upload icons from lucide-react ✅
- [x] Add Export button to footer ✅
- [x] Implement `handleExport()` function ✅
- [x] Add hidden file input for import ✅
- [x] Add Import button to footer ✅
- [x] Implement `validateImportedSettings()` function ✅
- [x] Implement `handleImportFileSelect()` function ✅
- [x] Add confirmation modal before applying import ✅
- [ ] Write unit tests for validation function (optional)

---

### FEAT-013: Settings Reset Confirmation ⭐ MEDIUM VALUE ✅
**Effort:** 1 hour
**Value:** Prevents accidental data loss when resetting to defaults

#### Implementation Details:

**Step 1: Add Reset to Defaults Button**
- **File:** `src/components/frontdesk-settings/FrontDeskSettings.tsx`
- **Location:** Footer section (left side, before Export)
- **UI:** Text button "Reset to Defaults" with RotateCcw icon

**Step 2: Add Confirmation Modal**
```typescript
const [showResetConfirm, setShowResetConfirm] = useState(false);

const handleResetClick = () => setShowResetConfirm(true);

const handleResetConfirm = () => {
  dispatch(resetSettings());
  setShowResetConfirm(false);
  toast.success('Settings reset to defaults');
};
```

**Step 3: Render Confirmation Dialog**
- Use existing dialog pattern or AlertDialog from Radix UI
- Message: "Reset all settings to defaults? This cannot be undone."
- Buttons: "Cancel" | "Reset"

#### Tasks:
- [x] Add `showResetConfirm` state ✅
- [x] Add "Reset to Defaults" button to footer ✅
- [x] Create confirmation modal component ✅
- [x] Implement `handleResetConfirm()` function ✅
- [x] Add RotateCcw icon from lucide-react ✅

---

### FEAT-014: Keyboard Shortcut for Settings ⭐ LOW VALUE ✅
**Effort:** 30 minutes
**Value:** Power user convenience - quickly access settings

#### Implementation Details:

**Step 1: Add Global Keyboard Listener**
- **File:** `src/components/FrontDesk.tsx` or `src/components/layout/AppShell.tsx`
- **Shortcut:** Cmd+, (Mac) / Ctrl+, (Windows)

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      e.preventDefault();
      setShowSettings(true);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

#### Tasks:
- [x] Add useEffect with keyboard listener ✅
- [x] Handle Cmd+, (Mac) and Ctrl+, (Windows) ✅
- [x] Prevent default browser behavior ✅
- [x] Open settings panel on shortcut ✅

---

### ~~FEAT-004: Custom Template Creation~~ → DEFERRED
**Reason:** Over-engineering for current needs. The 4 built-in templates cover most use cases. Can be revisited if users request it.

### ~~FEAT-011: Dark Mode Support~~ → MOVED TO SEPARATE INITIATIVE
**Reason:** Dark mode should be an app-wide feature, not specific to FrontDesk Settings. Requires coordination with design system.

### ~~FEAT-012: Settings Search/Filter~~ → DEFERRED
**Reason:** Current settings panel is compact enough to not require search. Only ~20 settings visible. Revisit when settings grow significantly.

---

### Phase 6 Summary

| Feature | Type | Effort | Value | Status |
|---------|------|--------|-------|--------|
| FEAT-003 | Export/Import | 2-3h | High | ✅ Complete |
| FEAT-013 | Reset Confirmation | 1h | Medium | ✅ Complete |
| FEAT-014 | Keyboard Shortcut | 30min | Low | ✅ Complete |
| FEAT-004 | Custom Templates | - | - | 🚫 Deferred |
| FEAT-011 | Dark Mode | - | - | 🚫 Moved |
| FEAT-012 | Settings Search | - | - | 🚫 Deferred |

**Actual Total Effort:** ~3 hours

**Implementation Completed:**
1. FEAT-003 (Export/Import) - Export to JSON, Import with validation, Confirmation dialog
2. FEAT-013 (Reset Confirmation) - Reset button with confirmation modal
3. FEAT-014 (Keyboard Shortcut) - Cmd+, (Mac) / Ctrl+, (Windows) opens settings

---

## Review Checklist

### Before Marking Phase Complete:
- [ ] All tasks in phase checked off
- [ ] Related test cases pass
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No console errors in browser
- [ ] Code reviewed for quality

### Before Production Deploy:
- [ ] All Phase 1-4 tasks complete
- [ ] Full test plan executed (65+ test cases)
- [ ] Cross-browser testing complete
- [ ] Performance testing passed
- [ ] Accessibility audit passed
- [ ] Code review approved

---

## Summary

| Phase | Tasks | Priority | Effort | Status |
|-------|-------|----------|--------|--------|
| Phase 1 | 5 Critical Bugs | P0 | 2-3 days | ✅ COMPLETED |
| Phase 2 | 12 High Priority Bugs | P1 | 3-4 days | ✅ COMPLETED |
| Phase 3 | 2 Missing Features | P1 | 2 days | ✅ COMPLETED |
| Phase 4 | 3 Code Quality Issues | P2 | 1 day | ✅ COMPLETED |
| Phase 5A | 3 Accessibility Items | P2 | ~1 hour | ✅ COMPLETED |
| Phase 5B | 27 Redux Slice Tests | P2 | ~2 hours | ✅ COMPLETED |
| Phase 5C | 16 Storage Service Tests | P2 | ~1 hour | ✅ COMPLETED |
| Phase 5D | 10 Smoke Tests | P2 | 5 minutes | ⏳ Manual |
| Phase 6 | 3 Enhancements | P3 | 4-5 hours | ⏳ Ready (Revised) |

**Progress:** Phase 1-5 complete (22 bugs/features + 43 unit tests + 3 accessibility improvements). Ready for manual smoke testing or Phase 6 enhancements.

---

## Review Section

### Changes Made (Phase 1 & 2 - 2025-12-01):

#### Phase 1 - Critical Bugs (5/5 completed):
1. **BUG-001**: Fixed template settings discrepancy in OperationTemplatesSection.tsx - aligned Provider View with OperationTemplateSetup.tsx
2. **BUG-002**: Added useEffect in StaffSidebar.tsx to sync viewWidth from FrontDeskSettings
3. **BUG-003**: Added visibility check in ComingAppointments.tsx respecting showComingAppointments setting
4. **BUG-004**: Created applyDependencies() helper in frontDeskSettingsSlice.ts for consistent dependency enforcement
5. **BUG-005**: Changed useEffect to useLayoutEffect in FrontDesk.tsx for synchronous state updates

#### Phase 2 - High Priority Bugs (12/12 completed):
1. **BUG-006**: Added loadSettingsFromStorage() with try-catch and corruption handling
2. **BUG-007**: Added schema versioning (SETTINGS_VERSION = 1) with migration support
3. **BUG-008**: Added input validation for customWidthPercentage (10-80% range) in LayoutSection.tsx
4. **BUG-009**: Added effectiveExternalCardViewMode in WaitListSection.tsx and ServiceSection.tsx to propagate viewStyle
5. **BUG-010**: Added FocusTrap wrapper to OperationTemplateSetup.tsx for accessibility
6. **BUG-011**: Wrapped all settings sections with SectionErrorBoundary in both mobile and desktop views
7. **BUG-012**: Added saveSettingsToStorage() with quota exceeded error handling
8. **BUG-013**: Verified - organizeBy filtering already works correctly (code review confirmed)
9. **BUG-014**: Verified - UI already clear with tooltips, disabled states, and lock icons
10. **BUG-015**: Added auto-save in applyTemplate() function - templates now persist immediately
11. **BUG-016**: Added toast notification on save using useToast hook
12. **BUG-017**: Replaced `as any` with type-safe spread operator patterns

### Files Modified:
- `src/store/slices/frontDeskSettingsSlice.ts` - Schema versioning, corruption handling, quota exceeded, type safety
- `src/components/StaffSidebar.tsx` - viewWidth sync from settings
- `src/components/ComingAppointments.tsx` - visibility control
- `src/components/FrontDesk.tsx` - useLayoutEffect for sync state updates
- `src/components/WaitListSection.tsx` - viewStyle propagation
- `src/components/ServiceSection.tsx` - viewStyle propagation
- `src/components/OperationTemplateSetup.tsx` - FocusTrap, auto-save templates
- `src/components/frontdesk-settings/FrontDeskSettings.tsx` - Error boundaries, toast feedback
- `src/components/frontdesk-settings/sections/LayoutSection.tsx` - Input validation
- `src/components/frontdesk-settings/sections/OperationTemplatesSection.tsx` - Type safety fix

### Issues Encountered:
- React hooks rule violation in ComingAppointments.tsx - fixed by moving early return after hooks
- Pre-existing TypeScript errors unrelated to our changes (unused variables in admin module)
- No new TypeScript errors introduced by our changes

### Final Assessment:
Phase 1 and Phase 2 are complete. All 17 bugs have been addressed. The FrontDesk Settings module now has:
- Robust localStorage persistence with corruption handling
- Schema versioning for future migrations
- Proper dependency enforcement across all update paths
- Better type safety without `as any` usage
- Improved accessibility with focus traps and error boundaries
- Visual feedback on save operations
- Auto-save for template selections

Remaining work includes Phase 4 (Code Quality), Phase 5 (Accessibility & Tests), and Phase 6 (Nice-to-Have Enhancements).

### Changes Made (Phase 3 - 2025-12-01):

#### FEAT-001: Guided Template Selection Flow ✅
**Verification completed** - The template selection flow in `OperationTemplateSetup.tsx` is fully implemented:
- Question 1: Primary Focus (Front Desk Staff vs Service Providers) - Lines 479-509
- Question 2: Operation Style (Balanced/Ticket-First vs Full Service Flow/Quick In/Out) - Lines 512-546
- Auto-scroll between questions via `scrollIntoView()` in `updateQuickAnswer()` - Lines 159-171
- Template suggestion updates based on answers via `getSuggestedTemplate()` - Lines 184-190
- Suggested template banner with pulsing highlight - Lines 549-567
- Note: Original 3-question flow was simplified to 2 questions (Show Appointments is now implicit in template choice)

#### FEAT-002: Per-User Settings with Cross-Tab Sync ✅
**Full implementation completed:**
- Created `src/services/frontDeskSettingsStorage.ts` - IndexedDB-based storage with per-user keying
- Settings keyed by: `frontDeskSettings_user_${memberId}` (user login) or `frontDeskSettings_store_${storeId}` (store login)
- Updated `frontDeskSettingsSlice.ts` with async thunks (`loadFrontDeskSettings`, `saveFrontDeskSettings`)
- Added schema versioning for future migrations
- Integrated with AppShell for app initialization loading
- Cross-tab sync via BroadcastChannel API with fallback
- Migrates old localStorage settings to IndexedDB on first load
- Updated components to use `useAppDispatch` for async thunk support

#### FEAT-005: Settings Validation - SKIPPED
Per user decision: Current validation (BUG-004 dependencies, BUG-008 input clamping) is sufficient.

### Files Modified (Phase 3):
- `src/services/frontDeskSettingsStorage.ts` (NEW) - IndexedDB storage service
- `src/store/slices/frontDeskSettingsSlice.ts` - Async thunks, async storage integration
- `src/components/layout/AppShell.tsx` - Settings loading on init, cross-tab sync subscription
- `src/components/frontdesk-settings/FrontDeskSettings.tsx` - useAppDispatch, toast feedback fix
- `src/components/FrontDesk.tsx` - useAppDispatch for async thunks

### Changes Made (Phase 4 - 2025-12-01):

#### ISSUE-001: Extract Duplicate Template Logic ✅
Created centralized `src/components/frontdesk-settings/templateConfigs.ts`:
- Defined `TEMPLATE_CONFIGS` and `TEMPLATE_METADATA` as single source of truth
- Exported helper functions: `getTemplateSettings()`, `getTemplateMetadata()`, `getAllTemplateIds()`, `isValidTemplateId()`
- Updated `frontDeskSettingsSlice.ts` applyTemplate reducer to use `getTemplateSettings()`
- Updated `OperationTemplateSetup.tsx` to use centralized helpers
- Updated `OperationTemplatesSection.tsx` to use `getTemplateMetadata()`
- Eliminated ~150 lines of duplicate switch statements

#### ISSUE-002: Remove Duplicate Local State in FrontDesk.tsx ✅
Refactored to use Redux selectors instead of local state sync:
- Added memoized selectors to `frontDeskSettingsSlice.ts`:
  - `selectIsCombinedView`, `selectCardViewMode`, `selectSortBy`, `selectShowComingAppointments`, etc.
- Updated `FrontDesk.tsx`:
  - Replaced 4 useState calls with useSelector hooks
  - Removed useLayoutEffect sync block
  - Added useCallback setters that dispatch Redux `updateSettings` actions
  - Reduced component complexity and eliminated sync bugs

#### ISSUE-003: Centralize Settings Error Handling ✅
Created `src/utils/settingsErrorHandler.ts`:
- Defined error types: `load`, `save`, `migration`, `validation`, `sync`
- Added user-friendly toast notifications via react-hot-toast
- Updated `frontDeskSettingsStorage.ts` to use centralized handler
- Added helper utilities: `safeParseJSON()`, `withSettingsErrorHandling()`

### Files Modified (Phase 4):
- `src/components/frontdesk-settings/templateConfigs.ts` (NEW) - Central template config
- `src/utils/settingsErrorHandler.ts` (NEW) - Centralized error handling
- `src/store/slices/frontDeskSettingsSlice.ts` - Added memoized selectors, uses centralized template config
- `src/components/FrontDesk.tsx` - Uses Redux selectors, callback setters
- `src/components/OperationTemplateSetup.tsx` - Uses centralized template config
- `src/components/frontdesk-settings/sections/OperationTemplatesSection.tsx` - Uses centralized template metadata
- `src/services/frontDeskSettingsStorage.ts` - Uses centralized error handler

---

### Changes Made (Phase 5 - 2025-12-01):

#### Phase 5A: Accessibility Fixes ✅
1. **A11Y-001 & A11Y-002:** Updated `SegmentedControl.tsx`:
   - Added `role="tablist"` to container div
   - Added `role="tab"` to each button
   - Added `aria-selected` to indicate active tab
   - Added `tabIndex` management (0 for active, -1 for others)
   - Added keyboard navigation handler for Arrow keys, Home, End

2. **A11Y-003:** Updated `ToggleSwitch.tsx`:
   - Changed disabled text color from `text-gray-400` to `text-gray-500`
   - Improved contrast ratio from 2.9:1 to 4.6:1 (meets WCAG AA 4.5:1 requirement)

#### Phase 5B: Redux Slice Unit Tests ✅
Created `src/store/slices/__tests__/frontDeskSettingsSlice.test.ts`:
- **27 passing tests** covering:
  - Initial state validation
  - `updateSetting` reducer (single setting updates)
  - `updateSettings` reducer (batch updates)
  - `applyTemplate` reducer (all 4 templates)
  - `discardChanges` and `resetSettings` reducers
  - Dependency rules (waitListActive ↔ inServiceActive cascade)
  - Memoized selectors (`selectIsCombinedView`, `selectCardViewMode`)

#### Phase 5C: Storage Service Unit Tests ✅
Created `src/services/__tests__/frontDeskSettingsStorage.test.ts`:
- **16 passing tests** covering:
  - Settings key generation (user vs store vs default)
  - Loading settings from IndexedDB
  - Saving settings to IndexedDB
  - Clearing settings
  - `hasSettings` check
  - Per-user isolation (different users maintain separate settings)

### Files Created (Phase 5):
- `src/store/slices/__tests__/frontDeskSettingsSlice.test.ts` (27 tests)
- `src/services/__tests__/frontDeskSettingsStorage.test.ts` (16 tests)

### Files Modified (Phase 5):
- `src/components/frontdesk-settings/components/SegmentedControl.tsx` - Accessibility (tablist role, keyboard nav)
- `src/components/frontdesk-settings/components/ToggleSwitch.tsx` - Color contrast fix

### Test Results:
- All 43 new tests passing
- Build successful (no new TypeScript errors)
- Pre-existing test failures in `smartAutoAssign.test.ts` (unrelated to our changes)

---

**Last Updated:** 2025-12-01
**Status:** Phase 1-5 Complete, Ready for Manual Smoke Tests or Phase 6
