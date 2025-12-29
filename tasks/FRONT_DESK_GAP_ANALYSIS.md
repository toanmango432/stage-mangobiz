# Front Desk Module: Bidirectional Gap Analysis

**Date:** December 28, 2025
**PRD Version:** 1.0
**Status:** Complete Analysis

---

## Executive Summary

This document provides a **bidirectional comparison** between the PRD requirements and the actual app implementation.

| Direction | Count | Notes |
|-----------|-------|-------|
| **In PRD, Missing from App** | ~12 gaps | Features defined but not built |
| **In App, Missing from PRD** | ~30 features | Features built but not documented |

---

## Part 1: Features in PRD but NOT in App

These are requirements defined in the PRD that have not been implemented yet.

### Critical Gaps (P0)

| PRD ID | Requirement | Gap Details |
|--------|-------------|-------------|
| FD-P0-033 to FD-P0-035 | **Service Category Tabs** (Nails, Hair, Spa) | ❌ Not implemented - **MAJOR GAP** |
| FD-P0-062, FD-P0-063 | **Ticket Search** by client name/phone | ❌ No search in Front Desk main area |
| FD-P0-003 | Progress % based on elapsed vs expected time | ⚠️ Progress bar exists but not time-based calculation |
| FD-P0-006 | Client photo on ticket cards | ❌ Client photos not displayed |

### High Priority Gaps (P1)

| PRD ID | Requirement | Gap Details |
|--------|-------------|-------------|
| FD-P1-007 | First-visit badge on ticket | ⚠️ `lastVisitDate` exists but no badge shown |
| FD-P1-008 | VIP/membership status indicator | ❌ No VIP indicator on cards |
| FD-P1-009 | Ticket notes indicator icon | ⚠️ Notes field exists but no visual indicator |
| FD-P1-017 | Remember scroll position per view | ❌ Scroll position not preserved |
| FD-P1-023 | Section order customization (drag) | ❌ Cannot drag to reorder sections |
| FD-P1-029 | Filter staff by service category | ❌ No service category filter in sidebar |
| FD-P1-030 | Next available time for busy staff | ❌ No estimated availability display |
| FD-P1-045 | Call client (click to call) | ❌ No tel: link on ticket cards |
| FD-P1-046 | Send SMS to client | ❌ No SMS integration |
| FD-P0-070 | New ticket notification (visual/audio) | ❌ No notification for new bookings |
| FD-P1-071 | Long-wait alerts (10+ min highlight) | ❌ No long-wait highlighting |

### Medium/Low Priority Gaps (P2)

| PRD ID | Requirement | Gap Details |
|--------|-------------|-------------|
| FD-P2-010 | Client rating/feedback score | ❌ Not implemented |
| FD-P2-047 | Split ticket | ❌ Not implemented |
| FD-P2-048 | Merge tickets | ❌ Not implemented |
| FD-P2-061 | Waitlist notifications | ❌ Not implemented |

---

## Part 2: Features in App but NOT in PRD

These are features that exist in the codebase but are **not documented** in the PRD.

### Operation Templates (4 Presets)

| Feature | App Implementation | PRD Status |
|---------|-------------------|------------|
| `frontDeskBalanced` template | ✅ Implemented | ❌ Not in PRD |
| `frontDeskTicketCenter` template | ✅ Implemented | ❌ Not in PRD |
| `teamWithOperationFlow` template | ✅ Implemented | ❌ Not in PRD |
| `teamInOut` template | ✅ Implemented | ❌ Not in PRD |

### Team/Staff Settings (Not in PRD)

| Feature | App Location | Description |
|---------|--------------|-------------|
| `organizeBy` | frontdesk-settings/types.ts:14 | Organize by clockedStatus OR busyStatus |
| `showTurnCount` | types.ts:15 | Show turn count per staff |
| `showNextAppointment` | types.ts:16 | Show staff's next appointment |
| `showServicedAmount` | types.ts:17 | Show amount serviced |
| `showTicketCount` | types.ts:18 | Show ticket count per staff |
| `showLastDone` | types.ts:19 | Show last completion time |
| `showMoreOptionsButton` | types.ts:20 | Show more options button |

### View Width Options (Not in PRD)

| Feature | Options | Description |
|---------|---------|-------------|
| `viewWidth` | ultraCompact, compact, wide, fullScreen, custom | Sidebar width presets |
| `customWidthPercentage` | number | User-defined width |

### Ticket Display Settings (Not in PRD)

| Feature | App Location | Description |
|---------|--------------|-------------|
| `displayMode` | types.ts:25 | column OR tab layout |
| `closedTicketsPlacement` | types.ts:30 | floating, bottom, hidden |
| `sortBy` | types.ts:31 | queue OR time sorting |
| `combineSections` | types.ts:32 | Combine waitlist/service into tabs |

### Workflow & Automation (Not in PRD)

| Feature | App Location | Description |
|---------|--------------|-------------|
| `comingAppointmentsDefaultState` | types.ts:36 | expanded OR collapsed default |
| `enableDragAndDrop` | types.ts:37 | Configurable drag and drop |
| `autoCloseAfterCheckout` | types.ts:38 | Auto-close behavior |
| `autoNoShowCancel` | types.ts:39 | Auto no-show handling |
| `autoNoShowTime` | types.ts:40 | Time threshold for no-show |
| `alertPendingTime` | types.ts:41 | Alert for pending too long |
| `pendingAlertMinutes` | types.ts:42 | Minutes before alert |

### Workflow Activation Toggles (Not in PRD)

| Feature | Description |
|---------|-------------|
| `waitListActive` | Enable/disable waitlist stage entirely |
| `inServiceActive` | Enable/disable in-service stage entirely |

### UI Controls - Team Actions (Not in PRD)

| Feature | Description |
|---------|-------------|
| `showAddTicketAction` | Show/hide Add Ticket button |
| `showAddNoteAction` | Show/hide Add Note button |
| `showEditTeamAction` | Show/hide Edit Team button |
| `showQuickCheckoutAction` | Show/hide Quick Checkout button |

### UI Controls - Ticket Actions (Not in PRD)

| Feature | Description |
|---------|-------------|
| `showApplyDiscountAction` | Show/hide Apply Discount |
| `showRedeemBenefitsAction` | Show/hide Redeem Benefits |
| `showTicketNoteAction` | Show/hide Ticket Note |
| `showStartServiceAction` | Show/hide Start Service |
| `showPendingPaymentAction` | Show/hide Pending Payment |
| `showDeleteTicketAction` | Show/hide Delete Ticket |

### Mobile-Specific Features (Not in PRD)

| Feature | Component | Description |
|---------|-----------|-------------|
| Mobile Tab Bar | MobileTabBar.tsx | Dedicated mobile navigation |
| Tab Metrics | MobileTabBar.tsx:5-11 | Count + secondary info + urgent indicator |
| Skeleton Loading | MobileTabBar.tsx:86-103 | Loading states for tabs |
| Keyboard Navigation | MobileTabBar.tsx:54-83 | Arrow key navigation for tabs |
| Haptic Feedback | MobileTabBar.tsx:81 | Touch feedback on selection |

### Pending Section Footer (Not in PRD)

| Feature | Component | Description |
|---------|-----------|-------------|
| Collapsible Footer | PendingSectionFooter.tsx | Collapsed/Expanded/FullView modes |
| Resizable Height | PendingSectionFooter.tsx:151-213 | Drag to resize expanded mode |
| Grid/List Display | PendingSectionFooter.tsx:111-114 | Toggle display in footer |
| Pulsing Badge | PendingSectionFooter.tsx:295-298 | Animated notification count |
| Total Amount Display | PendingSectionFooter.tsx:174-179 | Calculate and show pending total |
| "No Pending" State | PendingSectionFooter.tsx:253-269 | Empty state UI |

### Cross-Tab Sync (Not in PRD)

| Feature | Location | Description |
|---------|----------|-------------|
| Settings Sync | frontDeskSettingsSlice.ts:326 | Real-time sync across browser tabs |
| Storage Events | frontDeskSettingsSlice.ts:192-209 | localStorage event listeners |

### View State Persistence (Not in PRD)

| Feature | Description |
|---------|-------------|
| `activeMobileSection` | Persisted mobile tab selection |
| `activeCombinedTab` | Persisted combined view tab |
| `combinedViewMode` | Persisted grid/list mode |
| `combinedMinimizedLineView` | Persisted line view state |
| `serviceColumnWidth` | Persisted column width |

### Dependency Rules (Not in PRD)

| Rule | Description |
|------|-------------|
| In-Service requires Wait List | If inServiceActive, waitListActive must be true |
| Disabling Wait List disables In-Service | Cascade rule |
| showWaitList depends on waitListActive | UI follows workflow state |
| showInService depends on inServiceActive | UI follows workflow state |

---

## Summary Table: PRD vs App Completeness

### Features by Category

| Category | PRD Requirements | App Features | Gap |
|----------|-----------------|--------------|-----|
| **Main Ticket Board** | 10 | 8 | 2 missing from app |
| **View Modes** | 7 | 7 | ✅ Complete |
| **Status Sections** | 6 | 5 | 1 missing (reorder) |
| **Staff Sidebar** | 9 | 7 | 2 missing from app |
| **Service Category Tabs** | 5 | 0 | **5 missing - CRITICAL** |
| **Ticket Actions** | 11 | 7 | 4 missing from app |
| **Walk-In Management** | 7 | 5 | 2 partial |
| **Waitlist Management** | 6 | 4 | 2 missing |
| **Search & Filter** | 5 | 1 | **4 missing - CRITICAL** |
| **Real-Time Updates** | 5 | 3 | 2 missing from app |
| **Operation Templates** | 0 | 4 | 4 undocumented |
| **Team Settings** | 0 | 7 | 7 undocumented |
| **View Width Options** | 0 | 2 | 2 undocumented |
| **Workflow Toggles** | 0 | 7 | 7 undocumented |
| **UI Action Controls** | 0 | 10 | 10 undocumented |
| **Mobile Features** | 3 (basic) | 5 | 5 undocumented |
| **Pending Footer** | 0 | 6 | 6 undocumented |
| **Cross-Tab/Persistence** | 0 | 7 | 7 undocumented |
| **Dependency Rules** | 0 | 4 | 4 undocumented |

---

## Recommendations

### For App Development (Build Missing PRD Features)

1. **Service Category Tabs** - Critical for salon workflow
2. **Ticket Search** - Essential for finding clients quickly
3. **Client Photos** - Visual identification
4. **VIP/First-Visit Badges** - Customer experience
5. **New Ticket Notifications** - Real-time awareness

### For PRD Updates (Document Existing Features)

The PRD needs significant updates to document these existing app features:

1. **Add Section: Operation Templates**
   - Document the 4 preset templates
   - Explain layout ratios and use cases

2. **Add Section: Front Desk Settings Panel**
   - Document all configurable settings
   - Explain dependencies between settings

3. **Add Section: Mobile-Specific Behavior**
   - Document MobileTabBar
   - Document swipe gestures
   - Document haptic feedback

4. **Add Section: Pending Section Footer**
   - Document collapsed/expanded/full view modes
   - Document resizable behavior
   - Document grid/list toggle

5. **Update Section: View Modes**
   - Add viewWidth options (ultraCompact, compact, wide, fullScreen, custom)
   - Add displayMode (column vs tab)
   - Add combineSections option

6. **Add Section: Workflow Activation**
   - Document waitListActive/inServiceActive toggles
   - Document dependency rules

7. **Add Section: UI Action Controls**
   - Document toggleable actions per area
   - Document business use cases for hiding actions

---

## Implementation Priority

### Phase 1: Critical PRD Features → Build in App

| Item | Effort | Impact |
|------|--------|--------|
| Service Category Tabs | Medium | HIGH |
| Ticket Search | Medium | HIGH |
| Client Photo Display | Small | Medium |

### Phase 2: Update PRD with App Features

| Section to Add | Effort | Priority |
|----------------|--------|----------|
| Operation Templates | Small | High |
| Settings Panel | Medium | High |
| Mobile Features | Medium | High |
| Pending Footer | Small | Medium |

---

*Analysis completed: December 28, 2025*
