# FrontDesk Settings Feature - Comprehensive Test Plan

## Document Overview

**Feature:** FrontDesk Settings Integration
**Date Created:** 2025-12-01
**Branch:** main (cherry-picked from claude/edit-frontdesk-settings)
**Total Commits Tested:** 10

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Redux Integration Testing](#phase-1-redux-integration-testing)
4. [Phase 2: Component Integration Testing](#phase-2-component-integration-testing)
5. [Phase 3: State Synchronization Bug Fixes](#phase-3-state-synchronization-bug-fixes)
6. [Phase 4: Template Selection UI](#phase-4-template-selection-ui)
7. [Regression Testing](#regression-testing)
8. [Cross-Browser Testing](#cross-browser-testing)
9. [Performance Testing](#performance-testing)
10. [Known Issues and Limitations](#known-issues-and-limitations)

---

## Overview

### What Was Implemented

The FrontDesk Settings feature provides a centralized configuration system for the Front Desk module with the following capabilities:

1. **Redux State Management** - Settings stored in Redux with localStorage persistence
2. **Operation Templates** - Four pre-configured templates for different user types
3. **Component Integration** - Settings propagate to StaffSidebar, WaitListSection, ServiceSection, and ComingAppointments
4. **Template Selection Modal** - User-friendly template selection with guided questions
5. **Real-time Updates** - Settings changes immediately reflect in the UI

### Key Files Modified
- `src/store/slices/frontDeskSettingsSlice.ts` - Redux slice for settings
- `src/components/FrontDesk.tsx` - Main component with settings integration
- `src/components/frontdesk-settings/FrontDeskSettings.tsx` - Settings panel
- `src/components/StaffSidebar.tsx` - Team section integration
- `src/components/WaitListSection.tsx` - Wait list section integration
- `src/components/ServiceSection.tsx` - Service section integration
- `src/components/ComingAppointments.tsx` - Appointments section integration
- `src/components/OperationTemplateSetup.tsx` - Template selection modal
- `src/components/frontdesk-settings/sections/OperationTemplatesSection.tsx` - Template section UI

---

## Prerequisites

### How to Access the Feature

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Front Desk**
   - Open http://localhost:5173 in your browser
   - Navigate to the "Front Desk" module from the main navigation

3. **Open Settings Panel**
   - Look for the Settings icon in the top header bar
   - Click the settings icon to open the FrontDesk Settings panel
   - The panel should slide in from the right side of the screen

### Required Test Data

- At least 5-10 staff members with different statuses (ready, busy, off)
- 3-5 tickets in the wait list
- 2-3 tickets in service
- 1-2 upcoming appointments

### Test Environment

- **Browser:** Chrome 120+, Safari 17+, Firefox 120+, Edge 120+
- **Screen Sizes:** Mobile (375px), Tablet (768px), Desktop (1024px+)
- **Network:** Test both online and offline scenarios

---

## Phase 1: Redux Integration Testing

**Objective:** Verify that the Redux slice correctly manages settings state and persists to localStorage.

### Test Case 1.1: Initial State Loading

- [ ] **Action:** Open the Front Desk for the first time (clear localStorage first)
- [ ] **Expected:** Default settings should be loaded from `defaultFrontDeskSettings`
- [ ] **Verify:**
  - Check Redux DevTools for initial state
  - `operationTemplate` should be 'frontDeskBalanced'
  - `viewWidth` should be 'wide'
  - `showComingAppointments` should be true
  - `lastSaved` should be set to current timestamp

### Test Case 1.2: Settings Persistence to localStorage

- [ ] **Action:**
  1. Open FrontDesk Settings
  2. Change any setting (e.g., toggle "Show Coming Appointments")
  3. Click "Save Changes"
- [ ] **Expected:** Settings should be saved to localStorage
- [ ] **Verify:**
  - Open browser DevTools > Application > Local Storage
  - Check for `frontDeskSettings` key
  - Verify the JSON contains the updated setting
  - `hasUnsavedChanges` should be false after save

### Test Case 1.3: Settings Load from localStorage on Refresh

- [ ] **Action:**
  1. Make changes to settings and save
  2. Refresh the page (F5 or Cmd+R)
- [ ] **Expected:** Previously saved settings should be loaded
- [ ] **Verify:**
  - Settings panel shows the previously saved values
  - UI reflects the loaded settings
  - Check Redux DevTools to confirm state matches localStorage

### Test Case 1.4: Update Single Setting

- [ ] **Action:**
  1. Open FrontDesk Settings
  2. Change the "Sort By" dropdown from "Queue" to "Time"
- [ ] **Expected:** Only the `sortBy` field should update
- [ ] **Verify:**
  - `hasUnsavedChanges` should be true
  - Other settings remain unchanged
  - Setting is marked as unsaved (amber dot indicator)

### Test Case 1.5: Update Multiple Settings

- [ ] **Action:**
  1. Open FrontDesk Settings
  2. Change multiple settings at once
  3. Save the changes
- [ ] **Expected:** All changed settings should be saved together
- [ ] **Verify:**
  - Redux state updates all fields
  - localStorage contains all updates
  - `lastSaved` timestamp is updated

### Test Case 1.6: Discard Unsaved Changes

- [ ] **Action:**
  1. Open FrontDesk Settings
  2. Make several changes (do not save)
  3. Click "Cancel"
- [ ] **Expected:** Changes should be discarded, settings revert to saved state
- [ ] **Verify:**
  - Settings panel shows previously saved values
  - `hasUnsavedChanges` should be false
  - localStorage remains unchanged

### Test Case 1.7: Custom Event Dispatch

- [ ] **Action:**
  1. Save settings changes
  2. Monitor browser console for custom events
- [ ] **Expected:** `frontDeskSettingsUpdated` event should be dispatched
- [ ] **Verify:**
  - Event detail contains the updated settings object
  - Other components can listen to this event

### Edge Cases - Phase 1

- [ ] **Corrupted localStorage:** Manually corrupt the `frontDeskSettings` JSON in localStorage and refresh
  - Expected: App should fall back to default settings without crashing

- [ ] **localStorage Full:** Test behavior when localStorage quota is exceeded
  - Expected: Graceful error handling with console warning

- [ ] **Concurrent Tab Updates:** Open two browser tabs, change settings in one, switch to the other
  - Expected: Document behavior (settings may not sync across tabs without window.storage event listener)

---

## Phase 2: Component Integration Testing

**Objective:** Verify that settings changes propagate correctly to all integrated components.

### Phase 2.1: StaffSidebar Integration

#### Test Case 2.1.1: Team Organization by Busy Status

- [ ] **Action:**
  1. Open FrontDesk Settings
  2. Navigate to "Team Section"
  3. Set "Organize By" to "Busy/Ready"
  4. Save settings
- [ ] **Expected:** StaffSidebar should show Ready/Busy filter pills
- [ ] **Verify:**
  - Filter pills show: "All", "Ready", "Busy"
  - Staff member counts are accurate
  - Filtering by "Ready" shows only ready staff
  - Filtering by "Busy" shows only busy staff

#### Test Case 2.1.2: Team Organization by Clocked Status

- [ ] **Action:**
  1. Change "Organize By" to "Clocked In/Out"
  2. Save settings
- [ ] **Expected:** StaffSidebar should show Clocked In/Out filter pills
- [ ] **Verify:**
  - Filter pills show: "All", "Clocked In", "Clocked Out"
  - "Clocked In" includes both ready and busy staff
  - "Clocked Out" shows only off-duty staff
  - Counts are accurate

#### Test Case 2.1.3: Team View Width Changes

- [ ] **Action:**
  1. Test each view width setting:
     - Ultra Compact (100px)
     - Compact (300px)
     - Wide (40%)
     - Full Screen (100%)
- [ ] **Expected:** StaffSidebar width should adjust accordingly
- [ ] **Verify:**
  - Sidebar width changes smoothly
  - Staff cards resize appropriately
  - All information remains readable
  - No horizontal overflow

### Phase 2.2: WaitListSection Integration

#### Test Case 2.2.1: Show/Hide Wait List Section

- [ ] **Action:**
  1. Open FrontDesk Settings
  2. Navigate to "Ticket Section"
  3. Toggle "Show Wait List" off
  4. Save settings
- [ ] **Expected:** WaitListSection should be hidden
- [ ] **Verify:**
  - Wait list section is not rendered
  - No JavaScript errors in console
  - Space is reclaimed by other sections

- [ ] **Action:** Toggle "Show Wait List" back on
- [ ] **Expected:** WaitListSection should reappear
- [ ] **Verify:**
  - Section renders with all tickets
  - Scroll position resets
  - No duplicate tickets

#### Test Case 2.2.2: Wait List Active Toggle

- [ ] **Action:**
  1. Toggle "Wait List Active" off
  2. Save settings
- [ ] **Expected:** WaitListSection should be hidden
- [ ] **Verify:**
  - Component returns null
  - Similar behavior to "Show Wait List" toggle

#### Test Case 2.2.3: Display Mode - Column View

- [ ] **Action:**
  1. Set "Display Mode" to "Column"
  2. Save settings
- [ ] **Expected:** Wait list and service sections should be side by side
- [ ] **Verify:**
  - Desktop layout shows three columns
  - Wait list and Coming Appointments are stacked
  - Service section is on the left

#### Test Case 2.2.4: Display Mode - Tab View

- [ ] **Action:**
  1. Set "Display Mode" to "Tab"
  2. Save settings
- [ ] **Expected:** Wait list and service sections should be in tabs
- [ ] **Verify:**
  - Tab bar appears at the top
  - Can switch between "In Service" and "Waiting" tabs
  - Only active tab content is visible
  - Tab switching is smooth

### Phase 2.3: ServiceSection Integration

#### Test Case 2.3.1: Show/Hide Service Section

- [ ] **Action:**
  1. Open FrontDesk Settings
  2. Toggle "Show In Service" off
  3. Save settings
- [ ] **Expected:** ServiceSection should be hidden
- [ ] **Verify:**
  - Service section is not rendered
  - Layout adjusts to fill space
  - No errors in console

#### Test Case 2.3.2: In Service Active Toggle

- [ ] **Action:**
  1. Toggle "In Service Active" off
  2. Save settings
- [ ] **Expected:** ServiceSection should be hidden
- [ ] **Verify:**
  - Component returns null
  - Other sections adjust layout

#### Test Case 2.3.3: Dependency - In Service Requires Wait List

- [ ] **Action:**
  1. Set "Wait List Active" to false
  2. Try to set "In Service Active" to true
  3. Save settings
- [ ] **Expected:** "Wait List Active" should automatically become true
- [ ] **Verify:**
  - Redux slice applies dependency logic
  - Both sections are visible
  - Settings panel shows both toggles as on

- [ ] **Action:**
  1. Set "In Service Active" to true
  2. Try to set "Wait List Active" to false
- [ ] **Expected:** "In Service Active" should automatically become false
- [ ] **Verify:**
  - Dependency logic prevents invalid state
  - Both sections are hidden

### Phase 2.4: ComingAppointments Integration

#### Test Case 2.4.1: Show/Hide Coming Appointments

- [ ] **Action:**
  1. Open FrontDesk Settings
  2. Toggle "Show Coming Appointments" off
  3. Save settings
- [ ] **Expected:** ComingAppointments section should be hidden
- [ ] **Verify:**
  - Section is not rendered
  - Space is reclaimed by other sections
  - Mobile tab bar does not show "Appointments" tab
  - No errors in console

- [ ] **Action:** Toggle "Show Coming Appointments" back on
- [ ] **Expected:** ComingAppointments section should reappear
- [ ] **Verify:**
  - Section renders with appointment data
  - Mobile tab bar shows "Appointments" tab
  - Section is minimized by default on desktop

#### Test Case 2.4.2: Coming Appointments in Column View

- [ ] **Action:**
  1. Ensure "Display Mode" is "Column"
  2. "Show Coming Appointments" is on
- [ ] **Expected:** Coming Appointments should be on the right side, minimized
- [ ] **Verify:**
  - Section is visible in minimized state (60px width)
  - Clicking expands to 280px width
  - Shows header with count and metrics
  - Stacked above Wait List section

#### Test Case 2.4.3: Coming Appointments in Tab View

- [ ] **Action:**
  1. Set "Display Mode" to "Tab"
  2. "Show Coming Appointments" is on
- [ ] **Expected:** Coming Appointments should appear on the right side
- [ ] **Verify:**
  - Not included in the tab switching
  - Always visible on the right
  - Can be minimized independently

#### Test Case 2.4.4: Mobile View - Coming Appointments Tab

- [ ] **Action:**
  1. Resize browser to mobile width (< 768px)
  2. "Show Coming Appointments" is on
- [ ] **Expected:** "Appts" tab should appear in mobile tab bar
- [ ] **Verify:**
  - Tab bar shows: Team, Service, Waiting, Appts
  - Tapping "Appts" tab shows Coming Appointments section
  - Section is full-height when active
  - Header is hidden (hideHeader=true)

### Edge Cases - Phase 2

- [ ] **Rapid Setting Changes:** Quickly toggle settings on and off multiple times
  - Expected: UI should remain stable, no flickering or crashes

- [ ] **Settings Change During Interaction:** Change settings while actively using a section
  - Expected: Current interaction completes, then settings apply

---

## Phase 3: State Synchronization Bug Fixes

**Objective:** Verify that the 3 critical state synchronization bugs are fixed.

### Bug Fix 1: Duplicate State Updates

**Original Issue:** Settings were being saved to both Redux and localStorage separately, causing duplicate state updates and desynchronization.

#### Test Case 3.1.1: Single Source of Truth

- [ ] **Action:**
  1. Open browser DevTools > Network tab
  2. Open FrontDesk Settings
  3. Change "Sort By" setting
  4. Click "Save Changes"
  5. Monitor Redux DevTools and localStorage
- [ ] **Expected:** Settings should save only through Redux, not directly to localStorage
- [ ] **Verify:**
  - `handleFrontDeskSettingsChange` calls `dispatch(updateSettings(...))`
  - `dispatch(saveSettings())` is called next
  - Redux slice saves to localStorage in the `saveSettings` reducer
  - No redundant localStorage.setItem calls in FrontDesk.tsx

#### Test Case 3.1.2: No Manual State Updates

- [ ] **Action:**
  1. Search codebase for removed redundant code
  2. Verify FrontDesk.tsx lines 475-483
- [ ] **Expected:** Local state updates should be removed
- [ ] **Verify:**
  - `setTicketSortOrder` is not called in `handleFrontDeskSettingsChange`
  - `setShowUpcomingAppointments` is not called in `handleFrontDeskSettingsChange`
  - `setIsCombinedView` is not called in `handleFrontDeskSettingsChange`
  - All state updates come from Redux via useEffect (lines 134-143)

#### Test Case 3.1.3: Prevent Desynchronization

- [ ] **Action:**
  1. Open Redux DevTools
  2. Change a setting
  3. Before saving, check both Redux state and localStorage
  4. Save the setting
  5. Verify both are now synchronized
- [ ] **Expected:** Redux state and localStorage should never diverge
- [ ] **Verify:**
  - `hasUnsavedChanges` is true when Redux differs from localStorage
  - After save, both have identical values
  - Refreshing page loads from localStorage, matching Redux state

### Bug Fix 2: Settings Not Propagating

**Original Issue:** Local UI states were not syncing when Redux settings changed.

#### Test Case 3.2.1: useEffect Synchronization

- [ ] **Action:**
  1. Open FrontDesk Settings
  2. Change "Sort By" to "Time"
  3. Save settings
  4. Check if `ticketSortOrder` local state updates
- [ ] **Expected:** Local state should sync via useEffect
- [ ] **Verify:**
  - FrontDesk.tsx lines 134-143 show useEffect listening to `frontDeskSettings`
  - `ticketSortOrder` updates to match `frontDeskSettings.sortBy`
  - UI reflects the change immediately

#### Test Case 3.2.2: Display Mode Propagation

- [ ] **Action:**
  1. Change "Display Mode" to "Tab"
  2. Save settings
- [ ] **Expected:** `isCombinedView` should update
- [ ] **Verify:**
  - useEffect sets `isCombinedView` to true when displayMode is 'tab'
  - useEffect sets `isCombinedView` to true when combineSections is true
  - UI switches to tabbed layout

#### Test Case 3.2.3: View Style Propagation

- [ ] **Action:**
  1. Change "View Style" to "Compact"
  2. Save settings
- [ ] **Expected:** `combinedCardViewMode` should update
- [ ] **Verify:**
  - useEffect maps 'compact' to 'compact'
  - useEffect maps 'normal' to 'normal'
  - Card sizes adjust immediately

### Bug Fix 3: Premature Modal Close

**Original Issue:** Template selection modal closed before settings were applied.

#### Test Case 3.3.1: Modal Stays Open Until Complete

- [ ] **Action:**
  1. Open FrontDesk Settings
  2. Click "Change Template"
  3. Select a different template
  4. Wait for settings to apply
- [ ] **Expected:** Modal should stay open until settings are confirmed
- [ ] **Verify:**
  - Modal does not close immediately after selection
  - Toast notification appears: "Template applied successfully"
  - Modal closes after 3 seconds automatically
  - Or user can manually close with X button

#### Test Case 3.3.2: OperationTemplateSetup Props

- [ ] **Action:**
  1. Review OperationTemplateSetup.tsx line 436
  2. Verify props passed from FrontDeskSettings.tsx
- [ ] **Expected:** Props should allow proper flow control
- [ ] **Verify:**
  - `onClose` prop is passed correctly
  - `onSettingsChange` updates Redux but doesn't close modal
  - Modal close is controlled by OperationTemplateSetup component
  - Comment on line 435: "Note: Don't close modal here - let OperationTemplateSetup handle it with toast"

#### Test Case 3.3.3: Settings Apply Before Close

- [ ] **Action:**
  1. Open template selection
  2. Select "Provider View"
  3. Verify settings are applied
  4. Close the modal
  5. Reopen settings panel
- [ ] **Expected:** New template settings should be saved
- [ ] **Verify:**
  - Redux state updated with new template values
  - localStorage contains new settings
  - Settings panel shows new template

### Edge Cases - Phase 3

- [ ] **ESC Key During Template Selection:** Press ESC while template modal is open
  - Expected: Modal closes, settings are not saved (unless already applied)

- [ ] **Cancel After Template Selection:** Select template, wait for toast, then click Cancel
  - Expected: Settings revert to previously saved state

---

## Phase 4: Template Selection UI

**Objective:** Test the redesigned template selection modal with user-type focus.

### Test Case 4.1: Template Selection Modal Access

- [ ] **Action:**
  1. Open FrontDesk Settings
  2. Navigate to "Operation Templates" section
  3. Click "Change Template" button
- [ ] **Expected:** Template selection modal should open
- [ ] **Verify:**
  - Modal slides in with animation
  - Background is dimmed with overlay
  - Focus is trapped in modal
  - Can see guided questions

### Test Case 4.2: User-Type Focused Templates

#### Test Case 4.2.1: Front Desk Staff Templates

- [ ] **Action:**
  1. Answer Question 1: "I mainly use Front Desk section"
  2. Observe suggested templates
- [ ] **Expected:** Should show Front Desk focused templates
- [ ] **Verify:**
  - "Reception Desk" template is highlighted
  - Shows "Front Desk Staff" badge
  - Template description mentions balanced view
  - Layout preview shows 40% team, 60% ticket ratio

#### Test Case 4.2.2: Service Provider Templates

- [ ] **Action:**
  1. Answer Question 1: "I mainly use Team section"
  2. Observe suggested templates
- [ ] **Expected:** Should show Service Provider focused templates
- [ ] **Verify:**
  - "Provider View" template is highlighted
  - Shows "Service Provider" badge
  - Template description mentions team-focused layout
  - Layout preview shows 80% team, 20% ticket ratio

### Test Case 4.3: Guided Questions Flow

#### Test Case 4.3.1: Question 1 - Primary Focus

- [ ] **Action:** Answer "I mainly use Front Desk section"
- [ ] **Expected:**
  - Page should auto-scroll to Question 2
  - Suggested template updates
- [ ] **Verify:**
  - Smooth scroll animation
  - Selection is highlighted
  - Quick answers state updates

#### Test Case 4.3.2: Question 2 - Operation Style

- [ ] **Action:** Answer "Operation Flow" or "Simple In/Out"
- [ ] **Expected:**
  - Page should auto-scroll to Question 3
  - Suggested template updates based on both answers
- [ ] **Verify:**
  - "Operation Flow" suggests flow-based templates
  - "Simple In/Out" suggests In/Out templates

#### Test Case 4.3.3: Question 3 - Show Appointments

- [ ] **Action:** Answer "Yes" or "No"
- [ ] **Expected:**
  - Suggested template finalizes
  - Can now apply template
- [ ] **Verify:**
  - Final template matches all 3 answers
  - Template details are correct

### Test Case 4.4: Template Descriptions

#### Test Case 4.4.1: Reception Desk (frontDeskBalanced)

- [ ] **Verify Template Details:**
  - Title: "Reception Desk"
  - Subtitle: "Balanced View"
  - Description: "See both your team and tickets at a glance"
  - User Type: "Front Desk Staff"
  - Layout: 40% team, 60% ticket
  - Settings Applied:
    - viewWidth: 'wide'
    - customWidthPercentage: 40
    - displayMode: 'column'
    - combineSections: false
    - showComingAppointments: true
    - organizeBy: 'busyStatus'

#### Test Case 4.4.2: Express Queue (frontDeskTicketCenter)

- [ ] **Verify Template Details:**
  - Title: "Express Queue"
  - Subtitle: "Ticket-First View"
  - Description: "Maximize ticket visibility for fast-paced environments"
  - User Type: "Front Desk Staff"
  - Layout: 10% team, 90% ticket
  - Settings Applied:
    - viewWidth: 'compact'
    - customWidthPercentage: 10
    - displayMode: 'tab'
    - combineSections: true
    - showComingAppointments: true
    - organizeBy: 'busyStatus'

#### Test Case 4.4.3: Provider View (teamWithOperationFlow)

- [ ] **Verify Template Details:**
  - Title: "Provider View"
  - Subtitle: "Team-Focused Layout"
  - Description: "Large staff cards with current client and appointments"
  - User Type: "Service Provider"
  - Layout: 80% team, 20% ticket
  - Settings Applied:
    - viewWidth: 'wide'
    - customWidthPercentage: 80
    - displayMode: 'column'
    - combineSections: false
    - showComingAppointments: false (changed to true based on code)
    - organizeBy: 'clockedStatus' (changed to 'busyStatus' based on code)

#### Test Case 4.4.4: Quick Checkout (teamInOut)

- [ ] **Verify Template Details:**
  - Title: "Quick Checkout"
  - Subtitle: "Simple Clock In/Out"
  - Description: "Full-screen team view for easy checkout"
  - User Type: "Service Provider"
  - Layout: 100% team, 0% ticket
  - Settings Applied:
    - viewWidth: 'fullScreen'
    - customWidthPercentage: 100
    - displayMode: 'column'
    - combineSections: false
    - showComingAppointments: false
    - organizeBy: 'clockedStatus'

### Test Case 4.5: Template Application

#### Test Case 4.5.1: Apply Template

- [ ] **Action:**
  1. Select "Reception Desk" template
  2. Click "Apply Template" button
  3. Wait for toast notification
- [ ] **Expected:** Template settings should apply
- [ ] **Verify:**
  - Toast appears: "Template applied successfully"
  - Redux state updates with all template settings
  - Modal stays open for 3 seconds
  - Modal auto-closes after toast
  - UI reflects new template immediately

#### Test Case 4.5.2: Apply Different Template

- [ ] **Action:**
  1. Apply one template (e.g., "Reception Desk")
  2. Reopen template selection
  3. Apply a different template (e.g., "Provider View")
- [ ] **Expected:** New template should replace old settings
- [ ] **Verify:**
  - All settings from first template are overwritten
  - No lingering settings from previous template
  - Layout changes to match new template

### Test Case 4.6: Responsive Template Selection

#### Test Case 4.6.1: Desktop Template Selection

- [ ] **Action:** Open template modal on desktop (>768px)
- [ ] **Expected:** Desktop layout with all templates visible
- [ ] **Verify:**
  - Templates displayed in grid or list
  - All 4 templates visible at once
  - Can scroll to see full descriptions
  - Suggested template is highlighted

#### Test Case 4.6.2: Mobile Template Selection

- [ ] **Action:** Open template modal on mobile (<768px)
- [ ] **Expected:** Mobile carousel layout
- [ ] **Verify:**
  - Shows one template at a time
  - Left/right arrows to navigate
  - Swipe gestures work
  - Current template index indicator
  - Auto-scrolls to suggested template

### Test Case 4.7: Focus Trap and Accessibility

- [ ] **Action:** Open template selection modal, use Tab key
- [ ] **Expected:** Focus should be trapped within modal
- [ ] **Verify:**
  - Tab cycles through interactive elements in modal
  - Cannot tab to elements outside modal
  - Shift+Tab works in reverse
  - ESC key closes modal
  - Focus returns to "Change Template" button after close

### Edge Cases - Phase 4

- [ ] **Apply Same Template Twice:** Apply current template again
  - Expected: Settings remain the same, toast still shows

- [ ] **Modal Timeout:** Leave modal open for 5 minutes
  - Expected: Modal remains functional, no auto-close

- [ ] **Keyboard Navigation:** Use only keyboard to select and apply template
  - Expected: Fully keyboard accessible

---

## Regression Testing

**Objective:** Ensure existing functionality still works after settings integration.

### Test Case R.1: Ticket Operations

- [ ] **Create Ticket:** Can create new tickets from + button
- [ ] **Assign Ticket:** Can assign tickets to staff from wait list
- [ ] **Complete Ticket:** Can mark tickets as complete from service section
- [ ] **Delete Ticket:** Can delete tickets with reason selection
- [ ] **Edit Ticket:** Can edit ticket details

### Test Case R.2: Staff Operations

- [ ] **Change Staff Status:** Can change staff between ready/busy/off
- [ ] **Clock In/Out:** Clock in and out functionality works
- [ ] **Turn Tracker:** Turn tracker modal opens and functions
- [ ] **Staff Filtering:** Can filter staff by status

### Test Case R.3: View Modes

- [ ] **Grid View:** Switch between grid and list view in sections
- [ ] **Card Size:** Adjust card size with scale slider
- [ ] **Minimize Sections:** Can minimize/expand sections
- [ ] **Combined View Toggle:** Can toggle between column and tab view

### Test Case R.4: Mobile Functionality

- [ ] **Tab Switching:** Mobile tab bar switches sections correctly
- [ ] **Swipe Gestures:** Swipe left/right to navigate sections
- [ ] **Touch Interactions:** All touch targets are appropriately sized
- [ ] **Bottom Navigation:** FAB buttons work on mobile

### Test Case R.5: Data Persistence

- [ ] **Page Refresh:** Data persists after refresh (tickets, staff)
- [ ] **Browser Close:** Data persists after closing and reopening browser
- [ ] **Offline Mode:** App works offline with IndexedDB

---

## Cross-Browser Testing

**Objective:** Ensure compatibility across major browsers.

### Browser Matrix

| Browser | Version | Desktop | Mobile | Status |
|---------|---------|---------|--------|--------|
| Chrome | 120+ | [ ] | [ ] | |
| Safari | 17+ | [ ] | [ ] | |
| Firefox | 120+ | [ ] | [ ] | |
| Edge | 120+ | [ ] | [ ] | |

### Test Scenarios for Each Browser

1. **Settings Panel:**
   - [ ] Panel opens and closes smoothly
   - [ ] Animations work correctly
   - [ ] Scrolling is smooth
   - [ ] Focus trap works

2. **Template Modal:**
   - [ ] Modal animations work
   - [ ] Guided questions auto-scroll
   - [ ] Template selection highlights
   - [ ] Apply button works

3. **localStorage:**
   - [ ] Settings save correctly
   - [ ] Settings load on refresh
   - [ ] No quota exceeded errors

4. **Redux DevTools:**
   - [ ] Redux actions dispatch correctly
   - [ ] State updates are visible
   - [ ] Time-travel debugging works

---

## Performance Testing

**Objective:** Ensure settings changes don't cause performance degradation.

### Test Case P.1: Settings Change Performance

- [ ] **Action:**
  1. Open browser DevTools > Performance tab
  2. Start recording
  3. Change multiple settings rapidly
  4. Stop recording
- [ ] **Expected:** No significant lag or frame drops
- [ ] **Verify:**
  - Settings update within 16ms (60fps)
  - No memory leaks
  - No excessive re-renders

### Test Case P.2: localStorage Performance

- [ ] **Action:**
  1. Change and save settings 50 times rapidly
  2. Monitor performance
- [ ] **Expected:** No slowdown after many saves
- [ ] **Verify:**
  - localStorage writes are fast (<5ms)
  - No blocking of UI thread
  - Settings load quickly on refresh

### Test Case P.3: Component Re-render Optimization

- [ ] **Action:**
  1. Open React DevTools Profiler
  2. Change a setting that affects only one component
  3. Analyze render tree
- [ ] **Expected:** Only affected components should re-render
- [ ] **Verify:**
  - Memo() optimization prevents unnecessary re-renders
  - useEffect dependencies are correct
  - No cascading re-renders

### Test Case P.4: Large Dataset Performance

- [ ] **Action:**
  1. Add 100+ staff members
  2. Add 50+ tickets
  3. Change settings and measure performance
- [ ] **Expected:** No noticeable performance impact
- [ ] **Verify:**
  - UI remains responsive
  - Scrolling is smooth
  - Settings apply quickly

---

## Known Issues and Limitations

### Known Issues

1. **Cross-Tab Synchronization**
   - Settings do not sync between multiple browser tabs automatically
   - User must refresh other tabs to see changes
   - **Workaround:** Add window.storage event listener if needed

2. **Template Settings Discrepancy**
   - OperationTemplateSetup.tsx and OperationTemplatesSection.tsx have different settings for some templates
   - Provider View: showComingAppointments differs (false vs true)
   - Provider View: organizeBy differs (clockedStatus vs busyStatus)
   - **Action Required:** Verify correct values and align both files

3. **Mobile Template Navigation**
   - Swipe gestures may conflict with section scrolling on mobile
   - **Workaround:** Use arrow buttons for navigation

### Limitations

1. **Settings Schema Migration**
   - No automatic migration if defaultFrontDeskSettings changes
   - Users may need to clear localStorage manually after updates
   - **Future Enhancement:** Add schema versioning and migration

2. **Undo/Redo**
   - No built-in undo/redo for settings changes
   - User must manually revert changes
   - **Future Enhancement:** Add undo stack with Redux

3. **Settings Export/Import**
   - No ability to export/import settings
   - Users cannot share settings between devices
   - **Future Enhancement:** Add export/import JSON functionality

4. **Settings Presets**
   - Only 4 predefined templates
   - No custom template creation
   - **Future Enhancement:** Allow users to save custom templates

---

## Testing Checklist Summary

### Critical Path Testing
- [ ] Phase 1: Redux Integration (7/7 test cases)
- [ ] Phase 2: Component Integration (20/20 test cases)
- [ ] Phase 3: Bug Fixes (9/9 test cases)
- [ ] Phase 4: Template UI (20/20 test cases)

### Additional Testing
- [ ] Regression Testing (5/5 test suites)
- [ ] Cross-Browser Testing (4 browsers x 2 platforms)
- [ ] Performance Testing (4/4 test cases)

### Total Test Cases: 65+

---

## Test Execution Notes

**Tester Name:** _________________
**Date:** _________________
**Build Version:** _________________
**Environment:** [ ] Development [ ] Staging [ ] Production

**Overall Status:**
- [ ] All tests passed
- [ ] Tests passed with minor issues
- [ ] Tests failed - blocking issues found

**Critical Issues Found:**


**Non-Critical Issues Found:**


**Notes:**


---

## Sign-Off

**QA Lead:** _________________
**Product Owner:** _________________
**Date Approved:** _________________

---

**End of Test Plan**
