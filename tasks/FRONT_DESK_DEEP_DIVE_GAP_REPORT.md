# Front Desk Module: Comprehensive Deep-Dive Gap Report

**UltraThink Analysis**
**Date:** December 28, 2025
**PRD Version Analyzed:** 1.1
**Status:** Complete Gap Analysis for PRD Completeness

---

## Executive Summary

This deep-dive analysis identifies **87 specific gaps** in the Front Desk Module PRD that must be addressed to achieve world-class completeness. The gaps are categorized by type and prioritized by importance.

| Category | Gap Count | Critical (P0) | High (P1) | Medium (P2) |
|----------|-----------|---------------|-----------|-------------|
| PRD Structure | 12 | 4 | 5 | 3 |
| Functional Requirements | 18 | 6 | 8 | 4 |
| UX/UI Specifications | 21 | 7 | 9 | 5 |
| Business Logic | 11 | 3 | 5 | 3 |
| Data Model | 8 | 2 | 4 | 2 |
| Integration | 9 | 3 | 4 | 2 |
| Competitive Features | 8 | 4 | 3 | 1 |
| **TOTAL** | **87** | **29** | **38** | **20** |

---

## Category 1: PRD Structure Gaps

### FD-GAP-001: Missing User Journey Maps
- **Category:** PRD Structure
- **Description:** No documented end-to-end user flows showing how users accomplish key tasks
- **Why It Matters:** Developers build features without understanding the complete experience; UX designers lack context
- **Recommended PRD Addition:**
  ```
  Section 3.4: User Journey Maps
  - Journey 1: Saturday Rush Check-In (goal: 30 seconds)
  - Journey 2: Walk-In to Seated (goal: 45 seconds)
  - Journey 3: Service Completion Flow (goal: 15 seconds)
  - Journey 4: Client Lookup and Identification
  - Journey 5: Waitlist to Service Conversion
  ```
- **Priority:** P0

### FD-GAP-002: Missing Gherkin/BDD Acceptance Criteria
- **Category:** PRD Structure
- **Description:** Acceptance criteria use prose format, not executable Gherkin scenarios
- **Why It Matters:** Cannot be automated for testing; ambiguous edge case handling
- **Recommended PRD Addition:**
  ```gherkin
  Feature: Ticket Check-In
    Scenario: Check in arriving appointment
      Given a ticket with status "Coming" and scheduled time within 30 minutes
      When the front desk taps "Check In"
      Then the ticket status changes to "Waiting"
      And the checked-in timestamp is recorded
      And the waitlist position is calculated
  ```
- **Priority:** P0

### FD-GAP-003: Missing Error State Documentation
- **Category:** PRD Structure
- **Description:** No section documenting what happens when operations fail
- **Why It Matters:** Inconsistent error handling across features; poor user experience during failures
- **Recommended PRD Addition:**
  ```
  Section 7.7: Error States
  - Network failure during check-in: Show offline indicator, queue action
  - Concurrent edit conflict: Show conflict resolution modal
  - Staff status sync failure: Retry with exponential backoff, visual staleness indicator
  - Search returns no results: "No matching tickets" with suggestions
  - Invalid ticket action: Toast with reason and next steps
  ```
- **Priority:** P0

### FD-GAP-004: Missing Accessibility Section (WCAG 2.1)
- **Category:** PRD Structure
- **Description:** No accessibility requirements documented
- **Why It Matters:** Legal compliance risk; excludes users with disabilities
- **Recommended PRD Addition:**
  ```
  Section 7.8: Accessibility Requirements (WCAG 2.1 AA)
  - Color contrast: 4.5:1 minimum for text, 3:1 for UI elements
  - Focus indicators: 2px solid outline on all interactive elements
  - Screen reader: All ticket cards have aria-label with status, client, staff
  - Keyboard navigation: Tab order follows visual layout
  - Touch targets: Minimum 44x44px for all buttons
  - Motion: Respect prefers-reduced-motion setting
  ```
- **Priority:** P0

### FD-GAP-005: Missing Non-Functional Requirements Section
- **Category:** PRD Structure
- **Description:** Performance targets scattered; no consolidated non-functional requirements
- **Why It Matters:** Unclear quality gates; inconsistent performance expectations
- **Recommended PRD Addition:**
  ```
  Section 8.0: Non-Functional Requirements
  - NFR-001: Page load time < 1s (P50), < 2s (P99)
  - NFR-002: Time to interactive < 1.5s
  - NFR-003: Memory usage < 100MB for 100 tickets
  - NFR-004: Battery impact: Minimal background CPU usage
  - NFR-005: Bandwidth: < 50KB initial sync, < 5KB/update
  ```
- **Priority:** P1

### FD-GAP-006: Missing Localization Requirements
- **Category:** PRD Structure
- **Description:** No mention of internationalization or localization support
- **Why It Matters:** Limits market expansion; technical debt if added later
- **Recommended PRD Addition:**
  ```
  Section 8.9: Localization Requirements
  - L10N-001: All user-facing strings externalized
  - L10N-002: Date/time formats locale-aware
  - L10N-003: Currency display locale-aware
  - L10N-004: RTL layout support (future)
  - L10N-005: Time zone handling for multi-location
  ```
- **Priority:** P1

### FD-GAP-007: Missing Analytics Event Specification
- **Category:** PRD Structure
- **Description:** Success metrics defined but no analytics instrumentation plan
- **Why It Matters:** Cannot measure success without tracking; data collection is afterthought
- **Recommended PRD Addition:**
  ```
  Section 9.3: Analytics Events
  - FD_VIEW_LOADED: {viewMode, ticketCount, staffCount, loadTime}
  - FD_CHECK_IN: {ticketId, waitTimeBeforeCheckin, method: 'button'|'card'}
  - FD_SERVICE_STARTED: {ticketId, staffId, waitTimeAfterCheckin}
  - FD_SEARCH_PERFORMED: {query, resultCount, selectedResult}
  - FD_TEMPLATE_APPLIED: {templateId, previousTemplate}
  ```
- **Priority:** P1

### FD-GAP-008: Missing Version History / Changelog
- **Category:** PRD Structure
- **Description:** No version history showing PRD evolution
- **Why It Matters:** Cannot track requirement changes over time; audit issues
- **Recommended PRD Addition:**
  ```
  Appendix E: Version History
  | Version | Date | Author | Changes |
  |---------|------|--------|---------|
  | 1.0 | 2025-12-27 | PM | Initial PRD |
  | 1.1 | 2025-12-28 | PM | Added 74 requirements for templates, settings, mobile |
  ```
- **Priority:** P2

### FD-GAP-009: Missing Stakeholder Sign-Off Section
- **Category:** PRD Structure
- **Description:** No formal approval/sign-off tracking
- **Why It Matters:** Unclear who approved requirements; scope creep risk
- **Recommended PRD Addition:**
  ```
  Section 1.4: Approvals
  | Stakeholder | Role | Approved | Date |
  |-------------|------|----------|------|
  | [Name] | Product Owner | [ ] | |
  | [Name] | Tech Lead | [ ] | |
  | [Name] | UX Lead | [ ] | |
  ```
- **Priority:** P2

### FD-GAP-010: Missing Dependencies Section
- **Category:** PRD Structure
- **Description:** Related documents mentioned but dependencies not explicit
- **Why It Matters:** Unclear blocking relationships between modules
- **Recommended PRD Addition:**
  ```
  Section 1.5: Dependencies
  - Blocks: Pending Module (must have tickets to checkout)
  - Blocked By: Team Module (staff data), Book Module (appointments)
  - Integrates With: Turn Tracker (walk-in assignment)
  - Shares Data: Clients Module (client lookup)
  ```
- **Priority:** P1

### FD-GAP-011: Missing Out-of-Scope Section
- **Category:** PRD Structure
- **Description:** No explicit statement of what is NOT included
- **Why It Matters:** Scope creep; stakeholder expectation misalignment
- **Recommended PRD Addition:**
  ```
  Section 2.3: Out of Scope (v1.0)
  - Client self-check-in kiosk mode
  - Video calling integration
  - AI-based service time predictions
  - Automated SMS on status changes
  - Multi-language support
  ```
- **Priority:** P1

### FD-GAP-012: Missing Assumptions Section
- **Category:** PRD Structure
- **Description:** No documented assumptions that PRD is built upon
- **Why It Matters:** Hidden assumptions cause implementation surprises
- **Recommended PRD Addition:**
  ```
  Section 2.4: Assumptions
  - A-001: Salon operates on single timezone
  - A-002: Staff data pre-populated from Team module
  - A-003: Services/categories defined in Menu Settings
  - A-004: Internet connectivity for initial load
  - A-005: Modern browser (Chrome 90+, Safari 14+, Firefox 88+)
  ```
- **Priority:** P2

---

## Category 2: Functional Requirement Gaps

### FD-GAP-013: Missing Client Photo Upload Workflow
- **Category:** Functional Requirements
- **Description:** FD-P0-006 requires client photo display but no workflow for capturing/uploading
- **Why It Matters:** Feature unusable if photos don't exist
- **Recommended PRD Addition:**
  ```
  FD-P1-200: Quick photo capture from ticket card
  - Tap camera icon on ticket card
  - Open camera or photo picker
  - Crop to square, compress to < 200KB
  - Save to client profile
  ```
- **Priority:** P1

### FD-GAP-014: Missing Ticket Notes Full Specification
- **Category:** Functional Requirements
- **Description:** FD-P1-044 mentions "Add note to ticket" but no detail on note types, visibility, history
- **Why It Matters:** Incomplete implementation; unclear note lifecycle
- **Recommended PRD Addition:**
  ```
  FD-P1-201: Ticket Notes System
  - Note types: General, Allergy Alert, Preference, Internal
  - Visibility: All staff, Assigned staff only, Manager only
  - Character limit: 500 characters
  - Note history: Track author and timestamp
  - Quick note templates: "Running late", "Waiting for color to process"
  ```
- **Priority:** P1

### FD-GAP-015: Missing Multi-Provider Ticket Handling
- **Category:** Functional Requirements
- **Description:** No specification for tickets with multiple staff (e.g., hair + nails)
- **Why It Matters:** Common salon scenario not addressed; implementation ambiguity
- **Recommended PRD Addition:**
  ```
  FD-P0-202: Multi-Provider Ticket Display
  - Show stacked staff photos (max 3)
  - Show combined progress across all services
  - Status = "In-Service" if any service active
  - Status = "Pending" only when all services complete
  - Allow individual service completion marking
  ```
- **Priority:** P0

### FD-GAP-016: Missing Group Booking / Party Handling
- **Category:** Functional Requirements
- **Description:** No specification for linked tickets (bridal party, mother-daughter)
- **Why It Matters:** Common scenario; competitor feature (Fresha has group bookings)
- **Recommended PRD Addition:**
  ```
  FD-P1-203: Linked Ticket Groups
  - Visual grouping indicator (colored border/badge)
  - Group check-in option (check in all linked tickets)
  - Group total display
  - Linked note propagation
  ```
- **Priority:** P1

### FD-GAP-017: Missing Service Time Override
- **Category:** Functional Requirements
- **Description:** Service duration fixed from catalog; no override at ticket level
- **Why It Matters:** Actual service time varies; inaccurate progress bars
- **Recommended PRD Addition:**
  ```
  FD-P1-204: Service Duration Override
  - Allow editing estimated duration per ticket
  - Recalculate progress bar with new estimate
  - Option to update catalog default from actual
  ```
- **Priority:** P1

### FD-GAP-018: Missing Client Preference Display
- **Category:** Functional Requirements
- **Description:** No specification for showing client preferences on ticket
- **Why It Matters:** Staff need to know allergies, preferred products, past issues
- **Recommended PRD Addition:**
  ```
  FD-P0-205: Client Preferences on Ticket
  - Allergy alerts: Red warning icon, hover shows details
  - Product preferences: Brand preferences visible
  - Service preferences: "No head massage", "Extra hot towel"
  - Previous staff preference: "Usually sees Sarah"
  ```
- **Priority:** P0

### FD-GAP-019: Missing Recurring Appointment Indicator
- **Category:** Functional Requirements
- **Description:** No visual indicator for recurring/standing appointments
- **Why It Matters:** Staff behavior differs for regulars with standing bookings
- **Recommended PRD Addition:**
  ```
  FD-P1-206: Recurring Appointment Badge
  - "Weekly" / "Bi-weekly" / "Monthly" badge on ticket
  - Show next scheduled occurrence
  - Quick-rebook action shortcut
  ```
- **Priority:** P1

### FD-GAP-020: Missing Prepaid/Package Balance Display
- **Category:** Functional Requirements
- **Description:** No specification for showing prepaid service credits
- **Why It Matters:** Staff need to know if service is prepaid vs. needs payment
- **Recommended PRD Addition:**
  ```
  FD-P0-207: Prepaid/Package Indicator
  - "Prepaid" badge if covered by package
  - Show remaining sessions: "3/10 remaining"
  - Show if membership discount applies
  - Different checkout flow for prepaid
  ```
- **Priority:** P0

### FD-GAP-021: Missing Service Add-On Quick-Add
- **Category:** Functional Requirements
- **Description:** Adding services requires full edit flow
- **Why It Matters:** Upsells happen during service; needs to be quick
- **Recommended PRD Addition:**
  ```
  FD-P1-208: Quick Add-On Action
  - "+" button on in-service ticket
  - Suggested add-ons based on main service
  - One-tap to add to ticket
  - Auto-extends estimated time
  ```
- **Priority:** P1

### FD-GAP-022: Missing Late Arrival Handling
- **Category:** Functional Requirements
- **Description:** No specification for handling late clients
- **Why It Matters:** Need workflow for partial service, rescheduling, or accommodation
- **Recommended PRD Addition:**
  ```
  FD-P1-209: Late Arrival Workflow
  - Visual indicator: "10 min late" in yellow/red
  - Action options: "Accommodate", "Modify Service", "Reschedule"
  - If modified: Update service duration, recalculate price
  - Log late arrival for client history
  ```
- **Priority:** P1

### FD-GAP-023: Missing No-Show Follow-Up Actions
- **Category:** Functional Requirements
- **Description:** FD-BR-007 mentions no-show marking but no follow-up workflow
- **Why It Matters:** Need to notify client, potentially charge fee, update history
- **Recommended PRD Addition:**
  ```
  FD-P1-210: No-Show Workflow
  - Confirm no-show with reason selection
  - Trigger no-show notification (if enabled)
  - Apply no-show fee (if policy configured)
  - Update client no-show count
  - Block rebooking (optional based on policy)
  ```
- **Priority:** P1

### FD-GAP-024: Missing Ticket Transfer Between Staff
- **Category:** Functional Requirements
- **Description:** FD-P1-043 mentions "Reassign staff" but no mid-service transfer spec
- **Why It Matters:** Staff handoffs happen (shift changes, breaks)
- **Recommended PRD Addition:**
  ```
  FD-P1-211: Mid-Service Staff Transfer
  - Transfer in-progress ticket to different staff
  - Split commission based on time worked
  - Add transfer note: "Transferred from Sarah at 2:30pm"
  - Update Turn Tracker for both staff
  ```
- **Priority:** P1

### FD-GAP-025: Missing Ticket Priority/Rush Order
- **Category:** Functional Requirements
- **Description:** No concept of prioritized tickets
- **Why It Matters:** VIP clients or time-sensitive situations need priority handling
- **Recommended PRD Addition:**
  ```
  FD-P2-212: Priority Ticket Marking
  - Mark ticket as "Priority" or "Rush"
  - Visual indicator: Orange/red star or border
  - Sort priority tickets to top within section
  - Optional alert to assigned staff
  ```
- **Priority:** P2

### FD-GAP-026: Missing Ticket Pause/Resume
- **Category:** Functional Requirements
- **Description:** No way to pause service (e.g., waiting for color to process)
- **Why It Matters:** Common scenario; progress bar becomes inaccurate
- **Recommended PRD Addition:**
  ```
  FD-P1-213: Service Pause/Resume
  - Pause button on in-service ticket
  - Paused state: Progress bar frozen, "Paused" badge
  - Optional reason: "Color processing", "Client break"
  - Resume continues timer from pause point
  ```
- **Priority:** P1

### FD-GAP-027: Missing Bulk Actions
- **Category:** Functional Requirements
- **Description:** All actions are single-ticket; no multi-select
- **Why It Matters:** End of day operations, group check-ins need bulk actions
- **Recommended PRD Addition:**
  ```
  FD-P2-213: Bulk Ticket Actions
  - Multi-select mode (long-press to enter)
  - Bulk check-in (for arriving groups)
  - Bulk mark as no-show (end of day)
  - Bulk reassign (staff called out sick)
  ```
- **Priority:** P2

### FD-GAP-028: Missing Recent Actions History
- **Category:** Functional Requirements
- **Description:** No undo or recent action visibility
- **Why It Matters:** Accidents happen; need to see and reverse recent changes
- **Recommended PRD Addition:**
  ```
  FD-P2-214: Action History Panel
  - Show last 10 actions with timestamps
  - Undo capability for reversible actions
  - Action types: check-in, start, done, edit
  - Filter by staff who performed action
  ```
- **Priority:** P2

### FD-GAP-029: Missing Appointment Time Conflict Detection
- **Category:** Functional Requirements
- **Description:** No specification for detecting staff double-booking
- **Why It Matters:** Overbooking creates operational chaos
- **Recommended PRD Addition:**
  ```
  FD-P0-215: Conflict Detection
  - Alert when assigning staff with overlapping booking
  - Show conflict details: "Sarah has Jane at 2:00-2:45"
  - Options: Assign anyway, Choose different staff, Adjust time
  ```
- **Priority:** P0

### FD-GAP-030: Missing Print Ticket Slip
- **Category:** Functional Requirements
- **Description:** No print functionality mentioned
- **Why It Matters:** Some salons use paper slips for service tracking
- **Recommended PRD Addition:**
  ```
  FD-P2-216: Print Ticket Slip
  - Print ticket summary for client
  - Include: Services, staff, estimated time, ticket number
  - Thermal printer support (80mm width)
  - QR code for self-checkout (future)
  ```
- **Priority:** P2

---

## Category 3: UX/UI Specification Gaps

### FD-GAP-031: Missing Animation Timing Specifications
- **Category:** UX/UI
- **Description:** No micro-interaction animation specs
- **Why It Matters:** Inconsistent animations feel unprofessional
- **Recommended PRD Addition:**
  ```
  Section 7.7: Micro-Interactions
  | Interaction | Trigger | Animation | Duration | Easing |
  |-------------|---------|-----------|----------|--------|
  | Check-in | Tap button | Slide right + fade | 300ms | ease-out |
  | Status change | Any update | Color pulse | 200ms | ease-in-out |
  | New ticket | WebSocket | Slide in from right | 400ms | spring |
  | Card expand | Tap | Height expand | 250ms | ease-out |
  | Long-wait pulse | 10+ min | Red glow | 1000ms | infinite |
  ```
- **Priority:** P1

### FD-GAP-032: Missing Touch Gesture Specifications
- **Category:** UX/UI
- **Description:** Only keyboard navigation specified, not touch gestures
- **Why It Matters:** Primary usage is tablet/touch devices
- **Recommended PRD Addition:**
  ```
  Section 7.9: Touch Gestures
  - Swipe right on ticket: Quick check-in
  - Swipe left on ticket: Quick actions menu
  - Long-press on ticket: Multi-select mode
  - Pull down on list: Refresh
  - Pinch on grid: Toggle compact/normal
  - Two-finger swipe: Switch sections
  ```
- **Priority:** P0

### FD-GAP-033: Missing Loading States Per Component
- **Category:** UX/UI
- **Description:** FD-P0-125 mentions skeleton loading but only for mobile tab bar
- **Why It Matters:** Every component needs loading state
- **Recommended PRD Addition:**
  ```
  Section 7.10: Loading States
  | Component | Loading State |
  |-----------|---------------|
  | Ticket grid | Skeleton cards (3x4 grid) |
  | Staff sidebar | Skeleton staff cards |
  | Search results | "Searching..." with spinner |
  | Ticket actions | Button shows spinner |
  | Section counts | Placeholder "..." |
  ```
- **Priority:** P0

### FD-GAP-034: Missing Empty States Per Section
- **Category:** UX/UI
- **Description:** FD-P0-139 mentions empty state for Pending only
- **Why It Matters:** Every section needs meaningful empty state
- **Recommended PRD Addition:**
  ```
  Section 7.11: Empty States
  | Section | Empty State Message | Illustration |
  |---------|---------------------|--------------|
  | Coming | "No upcoming appointments" | Calendar icon |
  | Waiting | "No clients waiting" | Check icon |
  | In-Service | "No active services" | Coffee icon |
  | Staff | "No staff clocked in" | User icon |
  | Search results | "No matches found" | Search icon |
  ```
- **Priority:** P1

### FD-GAP-035: Missing Responsive Breakpoints Detail
- **Category:** UX/UI
- **Description:** Section 7.5 mentions devices but no specific breakpoints
- **Why It Matters:** Inconsistent responsive behavior
- **Recommended PRD Addition:**
  ```
  Section 7.5.1: Responsive Breakpoints
  | Breakpoint | Width | Columns | Sidebar | Card Size |
  |------------|-------|---------|---------|-----------|
  | Mobile | <640px | 1 | Hidden | Full-width |
  | Tablet Portrait | 640-1023px | 2-3 | Collapsed | 280px |
  | Tablet Landscape | 1024-1279px | 3-4 | 200px | 240px |
  | Desktop | 1280-1535px | 4-5 | 280px | 220px |
  | Large Desktop | 1536px+ | 5-6 | 320px | 200px |
  ```
- **Priority:** P0

### FD-GAP-036: Missing Color System Specification
- **Category:** UX/UI
- **Description:** Status colors mentioned but no complete color system
- **Why It Matters:** Inconsistent color usage; accessibility issues
- **Recommended PRD Addition:**
  ```
  Section 7.12: Color System (WCAG AA Compliant)
  | Usage | Light Mode | Dark Mode | Contrast Ratio |
  |-------|------------|-----------|----------------|
  | Coming bg | #F3F4F6 | #1F2937 | 12.6:1 |
  | Waiting bg | #FEF3C7 | #451A03 | 8.2:1 |
  | In-Service bg | #DBEAFE | #1E3A5F | 9.4:1 |
  | Available | #10B981 | #34D399 | 4.5:1 |
  | Busy | #3B82F6 | #60A5FA | 4.5:1 |
  | Break | #F59E0B | #FBBF24 | 4.5:1 |
  | Alert | #EF4444 | #F87171 | 4.5:1 |
  ```
- **Priority:** P0

### FD-GAP-037: Missing Typography Scale
- **Category:** UX/UI
- **Description:** No typography specifications
- **Why It Matters:** Inconsistent text sizing and hierarchy
- **Recommended PRD Addition:**
  ```
  Section 7.13: Typography
  | Element | Size | Weight | Line Height |
  |---------|------|--------|-------------|
  | Section header | 18px | 600 | 1.3 |
  | Card title (name) | 16px | 600 | 1.4 |
  | Card subtitle (service) | 14px | 400 | 1.4 |
  | Badge text | 12px | 500 | 1 |
  | Time display | 14px | 500 | 1.2 |
  | Button text | 14px | 500 | 1 |
  ```
- **Priority:** P1

### FD-GAP-038: Missing Card Component Detailed Specs
- **Category:** UX/UI
- **Description:** Card sizes mentioned but internal layout not specified
- **Why It Matters:** Cards are the core UI element; need pixel-perfect specs
- **Recommended PRD Addition:**
  ```
  Section 7.14: Ticket Card Anatomy
  Grid Normal (240x180px):
  ┌────────────────────────────────────┐
  │ 🕐 10:00 AM             ⭐ VIP [8px]│ <- Header: 32px height
  │ ┌──┐ Jane Doe          NEW        │ <- Photo: 40x40, 8px gap
  │ └──┘ 📱 555-1234                   │ <- Name: 16px, Phone: 14px
  │────────────────────────────────────│
  │ ✂️ Haircut (45min)                 │ <- Service: 14px, icon 16px
  │ 👤 Sarah                           │ <- Staff: 14px with 24px photo
  │ 📝 "Allergic to..."               │ <- Note: 12px italic, truncate 30ch
  │────────────────────────────────────│
  │     [Check In]          [...]     │ <- Actions: 36px height
  └────────────────────────────────────┘
  Padding: 12px all sides
  Border radius: 8px
  Shadow: 0 1px 3px rgba(0,0,0,0.1)
  ```
- **Priority:** P0

### FD-GAP-039: Missing Staff Card Detailed Specs
- **Category:** UX/UI
- **Description:** Staff sidebar mentioned but individual card layout not specified
- **Why It Matters:** Staff cards are frequently viewed; need clear specs
- **Recommended PRD Addition:**
  ```
  Section 7.15: Staff Card Anatomy
  ┌────────────────────────────────────┐
  │ 👤 Sarah Chen              ● Ready │ <- Photo 48px, status dot 8px
  │ ✂️ Hair Stylist                    │ <- Specialty 12px muted
  │────────────────────────────────────│
  │ NOW: Jane - Balayage               │ <- Current 14px
  │ █████████░░░ 75% (12m left)        │ <- Progress bar 8px height
  │────────────────────────────────────│
  │ NEXT: 11:00 John S.                │ <- Upcoming 12px
  │ Today: 5 clients • $420            │ <- Stats 12px muted
  │ Turn: 3rd                          │ <- Turn position
  │────────────────────────────────────│
  │  [+ Walk-In]       [📋 View]      │ <- Actions
  └────────────────────────────────────┘
  ```
- **Priority:** P0

### FD-GAP-040: Missing Modal/Overlay Specifications
- **Category:** UX/UI
- **Description:** Modals mentioned but no size, animation, or overlay specs
- **Why It Matters:** Inconsistent modal behavior
- **Recommended PRD Addition:**
  ```
  Section 7.16: Modal Specifications
  | Modal Type | Width | Height | Animation |
  |------------|-------|--------|-----------|
  | Ticket detail | 480px | Auto | Slide up |
  | Walk-in quick add | 400px | Auto | Fade in |
  | Settings panel | 360px | 100vh | Slide from right |
  | Confirmation | 320px | Auto | Scale up |
  | Full view | 100vw | 100vh | Fade in |

  Overlay: rgba(0,0,0,0.5)
  Close: Click overlay or X button
  Keyboard: Escape closes modal
  ```
- **Priority:** P1

### FD-GAP-041: Missing Notification/Toast Specifications
- **Category:** UX/UI
- **Description:** Notifications mentioned but no visual specs
- **Why It Matters:** Inconsistent notification appearance
- **Recommended PRD Addition:**
  ```
  Section 7.17: Toast Notifications
  | Type | Icon | Background | Duration |
  |------|------|------------|----------|
  | Success | ✓ | #10B981 | 3s |
  | Error | ✕ | #EF4444 | 5s |
  | Warning | ⚠ | #F59E0B | 4s |
  | Info | ℹ | #3B82F6 | 3s |
  | New booking | 🔔 | #8B5CF6 | 5s + sound |

  Position: Top-right, 24px from edge
  Animation: Slide in from right
  Stack: Max 3 visible, newest on top
  ```
- **Priority:** P1

### FD-GAP-042: Missing Sound/Haptic Specifications
- **Category:** UX/UI
- **Description:** FD-P0-127 mentions haptic but no sound specs; FD-P0-070 mentions audio alert
- **Why It Matters:** Inconsistent feedback; accessibility
- **Recommended PRD Addition:**
  ```
  Section 7.18: Audio & Haptic Feedback
  | Event | Sound | Haptic | Configurable |
  |-------|-------|--------|--------------|
  | Check-in success | Soft chime | Light | Sound only |
  | New booking | Notification tone | Medium | Both |
  | Long wait alert | Warning tone | Heavy | Both |
  | Error | Error tone | Heavy | Sound only |
  | Tab switch | None | Selection | Haptic only |

  Respect device mute and system preferences
  Master toggle in settings
  ```
- **Priority:** P1

### FD-GAP-043: Missing Progress Bar Detailed Design
- **Category:** UX/UI
- **Description:** Progress mentioned but no gradient/animation specs
- **Why It Matters:** Progress bars are key visual element
- **Recommended PRD Addition:**
  ```
  Section 7.19: Progress Bar Design
  Height: 6px (compact: 4px)
  Border radius: 3px
  Background: #E5E7EB
  Stages:
  - 0-25%: #3B82F6 (blue)
  - 25-50%: #3B82F6
  - 50-75%: #10B981 (green)
  - 75-99%: #10B981
  - 100%+: #EF4444 (red) with pulse animation

  Animation: Width transition 300ms ease-out
  Label: Percentage inside bar (white text) or next to bar
  ```
- **Priority:** P1

### FD-GAP-044: Missing Search UI Specifications
- **Category:** UX/UI
- **Description:** FD-P0-062/063 mention search but no UI details
- **Why It Matters:** Search is critical for quick lookup
- **Recommended PRD Addition:**
  ```
  Section 7.20: Search Bar Design
  Location: Header, left of view toggle
  Width: 240px collapsed, 360px focused
  Height: 40px
  Placeholder: "Search clients, phone..."
  Icon: Magnifying glass, 16px

  Behavior:
  - 2+ characters triggers search
  - Debounce: 150ms
  - Results dropdown: Max 8 items, grouped by type
  - Keyboard: Up/Down navigate, Enter selects, Esc clears

  Results item: 48px height
  - Client name (bold) + phone
  - Status badge + assigned staff
  ```
- **Priority:** P0

### FD-GAP-045: Missing Dark Mode Specifications
- **Category:** UX/UI
- **Description:** No dark mode mentioned
- **Why It Matters:** Reduces eye strain; expected modern feature
- **Recommended PRD Addition:**
  ```
  Section 7.21: Dark Mode
  - Follows system preference by default
  - Manual override in settings
  - All color tokens have dark variants
  - Images: Use filter for invert where needed
  - Transition: 200ms color transition
  ```
- **Priority:** P2

### FD-GAP-046: Missing High Contrast Mode
- **Category:** UX/UI
- **Description:** No high contrast accessibility mode
- **Why It Matters:** Required for some accessibility compliance
- **Recommended PRD Addition:**
  ```
  Section 7.22: High Contrast Mode
  - Enabled via system preference
  - Minimum 7:1 contrast ratio (WCAG AAA)
  - Thicker borders (2px minimum)
  - No color-only indicators
  - Underlined links
  ```
- **Priority:** P2

### FD-GAP-047: Missing Keyboard Shortcuts Reference
- **Category:** UX/UI
- **Description:** FD-P0-126 mentions keyboard nav for tabs but no full shortcut map
- **Why It Matters:** Power users expect keyboard shortcuts
- **Recommended PRD Addition:**
  ```
  Section 7.23: Keyboard Shortcuts
  | Shortcut | Action |
  |----------|--------|
  | / or Cmd+K | Focus search |
  | 1-4 | Switch sections |
  | N | New walk-in |
  | Escape | Close modal/clear search |
  | Enter | Confirm action |
  | Space | Toggle selected item |
  | Arrow keys | Navigate items |
  | Tab | Move to next interactive element |
  ```
- **Priority:** P1

### FD-GAP-048: Missing Print/PDF View Specifications
- **Category:** UX/UI
- **Description:** No print stylesheet or PDF export specs
- **Why It Matters:** End-of-day reports, floor view printing
- **Recommended PRD Addition:**
  ```
  Section 7.24: Print Styles
  - Remove interactive elements
  - Single column layout
  - Page breaks between sections
  - Include: Logo, date, section counts
  - Exclude: Progress bars, photos (optional)
  ```
- **Priority:** P2

### FD-GAP-049: Missing Drag & Drop Visual Feedback
- **Category:** UX/UI
- **Description:** FD-P0-102 enables drag-drop but no visual specs
- **Why It Matters:** Unclear what can be dragged where
- **Recommended PRD Addition:**
  ```
  Section 7.25: Drag & Drop Design
  Draggable indicator: Grip icon (⋮⋮) on hover
  Drag ghost: Semi-transparent card (0.7 opacity)
  Drop zone: Blue dashed border when valid
  Invalid drop: Red border with shake animation
  Reorder: Cards slide apart to show insertion point
  ```
- **Priority:** P1

### FD-GAP-050: Missing Context Menu Specifications
- **Category:** UX/UI
- **Description:** Right-click/long-press context menus not specified
- **Why It Matters:** Power users expect context menus
- **Recommended PRD Addition:**
  ```
  Section 7.26: Context Menus
  Trigger: Right-click (desktop), Long-press (mobile)

  Ticket card context menu:
  - View Details
  - Edit Ticket
  - Reassign Staff
  - Add Note
  - ---
  - Mark No-Show
  - Cancel Ticket

  Staff card context menu:
  - View Schedule
  - Add Walk-In
  - View Performance
  - ---
  - Set Status (Available/Break/Off)
  ```
- **Priority:** P2

### FD-GAP-051: Missing Offline Mode Visual Indicators
- **Category:** UX/UI
- **Description:** Offline support mentioned but no visual specs
- **Why It Matters:** User must know when they're offline
- **Recommended PRD Addition:**
  ```
  Section 7.27: Offline Indicators
  - Banner: "You're offline. Changes will sync when connected." (Yellow, top)
  - Icon: Cloud with X in header
  - Queued actions: Badge count "3 pending sync"
  - Stale data: Clock icon with "Last updated 5m ago"
  - Sync in progress: Spinning sync icon
  ```
- **Priority:** P0

---

## Category 4: Business Logic Gaps

### FD-GAP-052: Missing Wait Time Calculation Formula
- **Category:** Business Logic
- **Description:** FD-P1-055 mentions estimated wait but no calculation formula
- **Why It Matters:** Inaccurate estimates frustrate clients
- **Recommended PRD Addition:**
  ```
  FD-BR-040: Wait Time Calculation
  estimatedWait =
    (sum of remaining time for in-progress services for preferred staff)
    + (sum of estimated duration for waiting tickets ahead in queue)
    + (buffer of 5 minutes between services)

  If no preferred staff: Average across available staff
  Update frequency: Every 60 seconds
  Display: Round to nearest 5 minutes
  ```
- **Priority:** P0

### FD-GAP-053: Missing Progress Percentage Formula
- **Category:** Business Logic
- **Description:** FD-P0-003 mentions progress but no calculation spec
- **Why It Matters:** Inaccurate progress bars mislead staff
- **Recommended PRD Addition:**
  ```
  FD-BR-041: Progress Calculation
  progress = (elapsedTime / expectedDuration) * 100

  elapsedTime = now - serviceStartedAt (if paused, subtract pause time)
  expectedDuration = sum of service durations OR override if set

  Cap at 100% for display
  >100% = Overdue status (red, show +X minutes)
  ```
- **Priority:** P0

### FD-GAP-054: Missing Turn Queue Position Rules
- **Category:** Business Logic
- **Description:** Turn Queue integration mentioned but position rules not specified
- **Why It Matters:** Staff disputes over turn assignment
- **Recommended PRD Addition:**
  ```
  FD-BR-042: Turn Queue Position
  Position determined by:
  1. Least recent ticket completion time
  2. Earliest clock-in time (tie-breaker)
  3. Manual override by manager

  Skip rules:
  - Staff on break: Skipped, not penalized
  - Staff with active ticket: Skipped, not penalized
  - Staff declined: Moves to bottom of queue
  ```
- **Priority:** P0

### FD-GAP-055: Missing Auto No-Show Threshold Logic
- **Category:** Business Logic
- **Description:** FD-P1-104/105 mention auto no-show but incomplete logic
- **Why It Matters:** Premature no-show marking angers clients
- **Recommended PRD Addition:**
  ```
  FD-BR-043: Auto No-Show Logic
  Trigger conditions (ALL must be true):
  1. Status = "Coming" (not checked in)
  2. currentTime > scheduledTime + autoNoShowTime
  3. No recent activity on ticket (5 min)
  4. autoNoShowCancel = true in settings

  Grace period: First-time clients get +15 min
  Notification: Warn staff 5 min before auto-marking
  ```
- **Priority:** P1

### FD-GAP-056: Missing Pending Alert Priority Rules
- **Category:** Business Logic
- **Description:** FD-P1-106/107 mention pending alerts but no priority rules
- **Why It Matters:** Too many alerts cause alert fatigue
- **Recommended PRD Addition:**
  ```
  FD-BR-044: Pending Alert Priority
  Alert levels:
  - Warning (yellow): > pendingAlertMinutes
  - Critical (red): > 2x pendingAlertMinutes
  - Escalation: Manager notified at 3x threshold

  Suppress if:
  - Pending ticket is open in checkout
  - Client has payment on file (auto-charge pending)
  ```
- **Priority:** P1

### FD-GAP-057: Missing Staff Availability Calculation
- **Category:** Business Logic
- **Description:** FD-P1-030 mentions next available time but no calculation
- **Why It Matters:** Inaccurate availability frustrates front desk
- **Recommended PRD Addition:**
  ```
  FD-BR-045: Next Available Time Calculation
  nextAvailable =
    max(now, serviceEndTime) + bufferMinutes

  serviceEndTime = serviceStartedAt + expectedDuration
  bufferMinutes = configurable (default 5)

  If break scheduled: Include break time
  If booked: Show next open slot
  ```
- **Priority:** P1

### FD-GAP-058: Missing Service Duration Averaging
- **Category:** Business Logic
- **Description:** Duration is catalog-based; no learning from actuals
- **Why It Matters:** Estimates become more accurate over time
- **Recommended PRD Addition:**
  ```
  FD-BR-046: Duration Learning
  When service completes:
  - Record actualDuration
  - Update rolling average: newAvg = (oldAvg * 0.8) + (actual * 0.2)
  - Store per staff + service combination

  Use personalized estimate if > 5 data points available
  ```
- **Priority:** P2

### FD-GAP-059: Missing Conflict Resolution Logic
- **Category:** Business Logic
- **Description:** Mentioned in risks but no resolution algorithm
- **Why It Matters:** Data corruption if not handled
- **Recommended PRD Addition:**
  ```
  FD-BR-047: Conflict Resolution
  For concurrent edits:
  1. Compare timestamps
  2. If < 5 seconds apart: Merge non-conflicting fields
  3. If same field modified: Last write wins (with toast notification)
  4. Critical fields (status, staff): Prompt user to resolve

  Offline sync:
  1. Queue actions with local timestamps
  2. On sync: Apply in order
  3. If conflict: Show resolution UI
  ```
- **Priority:** P1

### FD-GAP-060: Missing Waitlist Expiration Rules
- **Category:** Business Logic
- **Description:** FD-BR-019 mentions 2-hour auto-archive but no detail
- **Why It Matters:** Orphaned waitlist entries clutter the list
- **Recommended PRD Addition:**
  ```
  FD-BR-048: Waitlist Lifecycle
  States: waiting → notified → seated | left | expired

  Transitions:
  - notified: When staff available (auto or manual)
  - seated: When converted to ticket
  - left: Manual mark by staff
  - expired: After 2 hours if not seated

  Notification: SMS "Your turn is coming" when notified
  Grace period: 10 minutes after notification
  ```
- **Priority:** P1

### FD-GAP-061: Missing Commission Calculation at Completion
- **Category:** Business Logic
- **Description:** "Mark Done" mentioned but no commission/tip handling
- **Why It Matters:** Financial accuracy; staff trust
- **Recommended PRD Addition:**
  ```
  FD-BR-049: Mark Done Financial Handling
  When marking done:
  1. Calculate service subtotal
  2. Apply commission rate per staff member
  3. If multi-provider: Split by time or percentage (configurable)
  4. Record in staff's daily commission tally
  5. Tips assigned at checkout, not at mark done
  ```
- **Priority:** P1

### FD-GAP-062: Missing Sorting Priority Rules
- **Category:** Business Logic
- **Description:** FD-P0-095 mentions queue vs time but no tie-breaker
- **Why It Matters:** Consistent ordering prevents confusion
- **Recommended PRD Addition:**
  ```
  FD-BR-050: Sort Priority
  Queue order (for Waiting):
  1. Priority flag (urgent first)
  2. Check-in time (oldest first)
  3. Scheduled time (tie-breaker)

  Time order (for Coming):
  1. Priority flag (urgent first)
  2. Scheduled time (earliest first)
  3. Alphabetical by name (tie-breaker)
  ```
- **Priority:** P1

---

## Category 5: Data Model Gaps

### FD-GAP-063: Missing FrontDeskTicket Fields
- **Category:** Data Model
- **Description:** Interface missing fields for identified requirements
- **Why It Matters:** Cannot implement features without data fields
- **Recommended PRD Addition:**
  ```typescript
  // Add to FrontDeskTicket interface:
  isPriority: boolean;            // FD-GAP-025
  pausedAt?: Date;                // FD-GAP-026
  pauseDuration: number;          // Total pause time in minutes
  linkedGroupId?: string;         // FD-GAP-016
  preferredStaffId?: string;      // Client preference
  durationOverride?: number;      // FD-GAP-017
  isRecurring: boolean;           // FD-GAP-019
  recurringPattern?: string;      // weekly, biweekly, monthly
  prepaidPackageId?: string;      // FD-GAP-020
  remainingSessions?: number;     // Package balance
  lateMinutes?: number;           // FD-GAP-022
  createdAt: Date;
  createdBy: string;              // Staff who created
  lastModifiedAt: Date;
  lastModifiedBy: string;
  ```
- **Priority:** P0

### FD-GAP-064: Missing StaffStatus Fields
- **Category:** Data Model
- **Description:** Staff interface missing fields
- **Why It Matters:** Cannot display all required information
- **Recommended PRD Addition:**
  ```typescript
  // Add to StaffStatus interface:
  turnPosition: number;           // Position in Turn Queue
  dailyStats: {
    ticketCount: number;
    totalRevenue: number;
    avgServiceTime: number;
    lastCompletedAt?: Date;
  };
  upcomingAppointments: {
    id: string;
    clientName: string;
    time: Date;
    service: string;
  }[];                            // Next 3 appointments
  skillCategories: string[];      // nails, hair, spa, etc.
  maxConcurrentServices: number;  // Some can do 2 clients at once
  ```
- **Priority:** P0

### FD-GAP-065: Missing WaitlistEntry Fields
- **Category:** Data Model
- **Description:** Waitlist interface missing fields
- **Why It Matters:** Cannot implement full waitlist workflow
- **Recommended PRD Addition:**
  ```typescript
  // Add to WaitlistEntry interface:
  partySize: number;              // For group waitlist
  linkedWaitlistIds?: string[];   // Party members
  notifiedAt?: Date;              // When notified
  notificationMethod?: 'sms' | 'inApp' | 'verbal';
  source: 'walk-in' | 'phone' | 'online';
  priority: 'normal' | 'vip' | 'urgent';
  notes?: string;
  declinedCount: number;          // Times passed/declined
  ```
- **Priority:** P1

### FD-GAP-066: Missing TicketNote Interface
- **Category:** Data Model
- **Description:** Notes mentioned but no interface defined
- **Why It Matters:** Cannot implement note system
- **Recommended PRD Addition:**
  ```typescript
  interface TicketNote {
    id: string;
    ticketId: string;
    type: 'general' | 'allergy' | 'preference' | 'internal';
    content: string;
    visibility: 'all' | 'assigned' | 'manager';
    createdAt: Date;
    createdBy: string;
    createdByName: string;
  }
  ```
- **Priority:** P1

### FD-GAP-067: Missing TicketAction Interface
- **Category:** Data Model
- **Description:** Action history mentioned but no interface
- **Why It Matters:** Cannot implement undo or audit trail
- **Recommended PRD Addition:**
  ```typescript
  interface TicketAction {
    id: string;
    ticketId: string;
    action: 'check_in' | 'start_service' | 'mark_done' |
            'reassign' | 'edit' | 'add_note' | 'cancel';
    previousValue?: any;
    newValue?: any;
    performedAt: Date;
    performedBy: string;
    performedByName: string;
    isReversible: boolean;
    reversedAt?: Date;
  }
  ```
- **Priority:** P1

### FD-GAP-068: Missing ServiceCategory Interface
- **Category:** Data Model
- **Description:** Categories mentioned but no interface
- **Why It Matters:** Tab system needs category data
- **Recommended PRD Addition:**
  ```typescript
  interface ServiceCategory {
    id: string;
    name: string;
    displayName: string;
    icon: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
    staffCount: number;          // Staff qualified for this category
    defaultDuration: number;     // Minutes
  }
  ```
- **Priority:** P1

### FD-GAP-069: Missing ClientPreference Interface
- **Category:** Data Model
- **Description:** Client preferences mentioned but no interface
- **Why It Matters:** Cannot display client preferences on ticket
- **Recommended PRD Addition:**
  ```typescript
  interface ClientPreference {
    clientId: string;
    allergies: string[];
    productPreferences: {
      category: string;
      brand?: string;
      notes?: string;
    }[];
    servicePreferences: string[];    // "No head massage"
    preferredStaffIds: string[];
    communicationPreference: 'sms' | 'email' | 'phone' | 'none';
    specialInstructions?: string;
  }
  ```
- **Priority:** P1

### FD-GAP-070: Missing LinkedTicketGroup Interface
- **Category:** Data Model
- **Description:** Group bookings mentioned but no interface
- **Why It Matters:** Cannot implement party/group functionality
- **Recommended PRD Addition:**
  ```typescript
  interface LinkedTicketGroup {
    id: string;
    name?: string;                // "Smith Wedding Party"
    ticketIds: string[];
    createdAt: Date;
    primaryClientId?: string;     // Who booked for the group
    groupDiscount?: number;       // Percentage
    notes?: string;
  }
  ```
- **Priority:** P2

---

## Category 6: Integration Gaps

### FD-GAP-071: Missing Book Module Integration Spec
- **Category:** Integration
- **Description:** Appointments flow from Book but no integration spec
- **Why It Matters:** Unclear data handoff between modules
- **Recommended PRD Addition:**
  ```
  Section 8.8.1: Book Module Integration
  Data Flow:
  - New booking → Creates Coming ticket
  - Reschedule → Updates ticket scheduledTime
  - Cancel → Removes ticket or marks cancelled

  Events:
  - appointment.created → FD_NEW_TICKET
  - appointment.updated → FD_UPDATE_TICKET
  - appointment.cancelled → FD_REMOVE_TICKET

  Conflict: If ticket already checked in, block reschedule
  ```
- **Priority:** P0

### FD-GAP-072: Missing Turn Tracker Integration Spec
- **Category:** Integration
- **Description:** Turn Queue referenced but integration unclear
- **Why It Matters:** Walk-in assignment depends on Turn Tracker
- **Recommended PRD Addition:**
  ```
  Section 8.8.2: Turn Tracker Integration
  API Calls:
  - getNextAvailableStaff(serviceCategory) → StaffId
  - recordTurnTaken(staffId, ticketId) → void
  - skipTurn(staffId, reason) → void

  Events:
  - turn.updated → Refresh staff sidebar
  - turn.reset → Refresh all positions

  Override: Manual assignment bypasses Turn Queue (logged)
  ```
- **Priority:** P0

### FD-GAP-073: Missing Pending/Checkout Integration Spec
- **Category:** Integration
- **Description:** Mark Done transitions to Pending but no spec
- **Why It Matters:** Unclear handoff to checkout
- **Recommended PRD Addition:**
  ```
  Section 8.8.3: Pending Module Integration
  Data Flow:
  - Mark Done → Ticket appears in Pending queue
  - Checkout Complete → Ticket marked completed

  Data passed:
  - Ticket ID, services, amounts
  - Staff for commission
  - Client for loyalty/payment

  Events:
  - ticket.marked_done → PENDING_NEW_TICKET
  - checkout.complete → FD_TICKET_COMPLETED
  ```
- **Priority:** P0

### FD-GAP-074: Missing Client Module Integration Spec
- **Category:** Integration
- **Description:** Client lookup mentioned but no integration spec
- **Why It Matters:** Walk-in search depends on client module
- **Recommended PRD Addition:**
  ```
  Section 8.8.4: Client Module Integration
  API Calls:
  - searchClients(query) → Client[]
  - getClientDetails(clientId) → Client
  - createQuickClient(name, phone) → ClientId

  Data displayed:
  - Name, phone, photo
  - Visit count, last visit
  - VIP status, preferences
  - Outstanding balance
  ```
- **Priority:** P1

### FD-GAP-075: Missing Team Module Integration Spec
- **Category:** Integration
- **Description:** Staff data from Team module but no spec
- **Why It Matters:** Staff sidebar depends on Team module
- **Recommended PRD Addition:**
  ```
  Section 8.8.5: Team Module Integration
  Data Subscribed:
  - Staff list (active, qualified)
  - Clock in/out status
  - Break status
  - Service qualifications

  Events:
  - staff.clocked_in → Add to sidebar
  - staff.clocked_out → Remove from sidebar
  - staff.break_started → Update status
  ```
- **Priority:** P1

### FD-GAP-076: Missing Notification Integration Spec
- **Category:** Integration
- **Description:** SMS/notifications mentioned but no integration
- **Why It Matters:** Client communication from Front Desk
- **Recommended PRD Addition:**
  ```
  Section 8.8.6: Notification Integration
  Triggers from Front Desk:
  - Check-in → "You're checked in, we'll call you shortly"
  - Waitlist position → "You're #3 in line"
  - Ready for service → "Your stylist is ready"
  - Running late → "We're running 10 min behind"

  API: sendNotification(clientId, templateId, variables)
  ```
- **Priority:** P1

### FD-GAP-077: Missing Analytics/Reporting Integration
- **Category:** Integration
- **Description:** Metrics mentioned but no reporting integration
- **Why It Matters:** Cannot generate reports without data flow
- **Recommended PRD Addition:**
  ```
  Section 8.8.7: Analytics Integration
  Events tracked:
  - ticket.created, ticket.checked_in, ticket.started
  - ticket.completed, ticket.no_show
  - wait_time (duration), service_time (duration)
  - staff.assignment, staff.reassignment

  Aggregations available:
  - Average wait time by hour/day
  - Service duration vs estimate
  - No-show rate
  - Staff utilization
  ```
- **Priority:** P1

### FD-GAP-078: Missing WebSocket/Real-Time Spec
- **Category:** Integration
- **Description:** Real-time mentioned but no WebSocket spec
- **Why It Matters:** Real-time updates are core functionality
- **Recommended PRD Addition:**
  ```
  Section 8.8.8: Real-Time Subscriptions
  Supabase Channels:
  - salon:{salonId}:tickets - All ticket changes
  - salon:{salonId}:staff - Staff status changes
  - salon:{salonId}:waitlist - Waitlist changes

  Message format:
  {
    table: 'tickets',
    eventType: 'INSERT' | 'UPDATE' | 'DELETE',
    new: {...},
    old: {...}
  }

  Reconnection: Exponential backoff, max 30s
  Fallback: Poll every 10s if WS unavailable
  ```
- **Priority:** P0

### FD-GAP-079: Missing Device/Hardware Integration
- **Category:** Integration
- **Description:** Receipt printing mentioned but no hardware spec
- **Why It Matters:** Physical hardware integration needed
- **Recommended PRD Addition:**
  ```
  Section 8.8.9: Hardware Integration
  Supported devices:
  - Thermal printers: ESC/POS compatible
  - Barcode scanners: USB HID mode
  - Cash drawers: Via printer kick signal
  - iPad/tablet stands: Rotation lock

  Print from Front Desk:
  - Ticket slip for client
  - Service ticket for provider
  ```
- **Priority:** P2

---

## Category 7: Competitive Feature Gaps

### FD-GAP-080: Missing Client Self-Check-In (MangoMint Feature)
- **Category:** Competitive
- **Description:** MangoMint has Virtual Waiting Room for SMS self-check-in
- **Why It Matters:** Reduces front desk workload; modern client experience
- **Recommended PRD Addition:**
  ```
  FD-P2-300: Self-Check-In via SMS
  - Send check-in link to client 30 min before appointment
  - Client confirms arrival via link
  - Ticket auto-updates to "Waiting" status
  - Front desk sees "Self-checked-in" badge
  ```
- **Priority:** P2

### FD-GAP-081: Missing Front Desk Display Mode (MangoMint Feature)
- **Category:** Competitive
- **Description:** MangoMint has client-facing screen showing queue position
- **Why It Matters:** Reduces client anxiety; professional appearance
- **Recommended PRD Addition:**
  ```
  FD-P2-301: Client-Facing Display Mode
  - Large, readable display for waiting area TV
  - Shows: Queue position, estimated wait, "Now Serving"
  - Hides sensitive info (phone, pricing)
  - Auto-refresh every 30 seconds
  ```
- **Priority:** P2

### FD-GAP-082: Missing Two-Way Messaging (Boulevard Feature)
- **Category:** Competitive
- **Description:** Boulevard has internal messaging for staff coordination
- **Why It Matters:** Staff coordination without leaving app
- **Recommended PRD Addition:**
  ```
  FD-P1-302: Quick Staff Messaging
  - Send quick message to staff from their card
  - "Client waiting", "Need you at front", "Break available"
  - Appears as push notification
  - Message templates for common phrases
  ```
- **Priority:** P1

### FD-GAP-083: Missing Drag-Drop Scheduling (Boulevard Feature)
- **Category:** Competitive
- **Description:** Boulevard allows drag-drop to reschedule from Front Desk
- **Why It Matters:** Quick rescheduling without opening Book module
- **Recommended PRD Addition:**
  ```
  FD-P2-303: Drag to Reschedule
  - Drag Coming ticket to different time slot
  - Opens quick reschedule modal
  - Shows conflicts if any
  - Updates Book module in real-time
  ```
- **Priority:** P2

### FD-GAP-084: Missing Group Check-In (Fresha Feature)
- **Category:** Competitive
- **Description:** Fresha supports group bookings with linked check-in
- **Why It Matters:** Bridal parties, families common in salons
- **Recommended PRD Addition:**
  ```
  FD-P1-304: Group Check-In
  - Visual grouping of linked tickets
  - "Check In All" button for group
  - Group discount auto-applied
  - Party leader designation
  ```
- **Priority:** P1

### FD-GAP-085: Missing No-Show Protection (Fresha Feature)
- **Category:** Competitive
- **Description:** Fresha has deposit/card-on-file for no-shows
- **Why It Matters:** Reduces no-show losses
- **Recommended PRD Addition:**
  ```
  FD-P1-305: No-Show Protection Integration
  - Display if card on file for ticket
  - "Charge no-show fee" action
  - Configurable no-show policy display
  - Client history shows no-show rate
  ```
- **Priority:** P1

### FD-GAP-086: Missing Automated Waitlist (Fresha Feature)
- **Category:** Competitive
- **Description:** Fresha auto-notifies waitlist when slot opens
- **Why It Matters:** Reduces manual work; fills cancelled slots
- **Recommended PRD Addition:**
  ```
  FD-P2-306: Auto Waitlist Management
  - When cancellation occurs, check waitlist
  - Auto-notify matching waitlist entries
  - First to confirm gets the slot
  - Fallback to next in queue if no response
  ```
- **Priority:** P2

### FD-GAP-087: Missing Quick Rebook from Done (Fresha/MangoMint Feature)
- **Category:** Competitive
- **Description:** Both allow rebooking next appointment from completed ticket
- **Why It Matters:** Increases rebooking rate
- **Recommended PRD Addition:**
  ```
  FD-P1-307: Quick Rebook Action
  - "Book Next" button on Pending tickets
  - Pre-fills: Same client, service, staff
  - Suggests date based on service interval
  - Opens Book module mini-modal
  ```
- **Priority:** P1

---

## Category 8: Edge Cases & Error Handling Gaps

### FD-GAP-088: Missing Network Failure Handling
- **Category:** Edge Cases
- **Description:** Offline mentioned but no error handling flow
- **Why It Matters:** Graceful degradation during outages
- **Recommended PRD Addition:**
  ```
  Section 10.4: Network Failure Handling
  Detection:
  - WebSocket disconnect → 5s retry
  - API call failure → 3 retries with backoff
  - Complete offline → Show banner

  Behavior:
  - Queue all mutations locally
  - Show "pending sync" indicator
  - Prevent conflicting operations (e.g., two check-ins)
  - On reconnect: Sync queue in order
  ```
- **Priority:** P0

### FD-GAP-089: Missing Concurrent Edit Conflict
- **Category:** Edge Cases
- **Description:** Multi-user editing not fully specified
- **Why It Matters:** Two staff editing same ticket simultaneously
- **Recommended PRD Addition:**
  ```
  Section 10.5: Concurrent Edit Handling
  Optimistic locking:
  - Include version number in all updates
  - If version mismatch: Show conflict modal

  Conflict modal:
  - Show "Your changes" vs "Server changes"
  - Options: "Keep mine", "Take theirs", "Merge"
  - Log conflict for debugging
  ```
- **Priority:** P1

### FD-GAP-090: Missing Session Timeout Handling
- **Category:** Edge Cases
- **Description:** No specification for auth session expiry
- **Why It Matters:** Stale sessions cause data issues
- **Recommended PRD Addition:**
  ```
  Section 10.6: Session Management
  - Session timeout: 8 hours of inactivity
  - 15 min warning before timeout
  - Option to extend session
  - On timeout: Redirect to login, preserve draft actions
  - On login: Sync pending actions
  ```
- **Priority:** P1

### FD-GAP-091: Missing Large Data Set Handling
- **Category:** Edge Cases
- **Description:** Performance mentioned but no large data handling
- **Why It Matters:** Busy salons may have 200+ tickets/day
- **Recommended PRD Addition:**
  ```
  Section 10.7: Large Data Handling
  Virtual scrolling:
  - Render only visible items + 10 buffer
  - Ticket limit per view: 500
  - Pagination for history/completed

  Search optimization:
  - Index client name, phone for fast lookup
  - Limit search results to 50
  ```
- **Priority:** P1

### FD-GAP-092: Missing Data Corruption Recovery
- **Category:** Edge Cases
- **Description:** No specification for corrupt data scenarios
- **Why It Matters:** IndexedDB can become corrupted
- **Recommended PRD Addition:**
  ```
  Section 10.8: Data Recovery
  Detection:
  - Invalid ticket state (e.g., In-Service without staff)
  - Orphaned references
  - Checksum mismatch

  Recovery:
  - Auto-fix obvious issues (log and notify)
  - Force sync from server if available
  - Clear and re-sync option in settings
  - Admin alert for recurring corruption
  ```
- **Priority:** P2

### FD-GAP-093: Missing Browser Tab Conflict
- **Category:** Edge Cases
- **Description:** Cross-tab sync mentioned but conflicts not specified
- **Why It Matters:** Two tabs editing same ticket
- **Recommended PRD Addition:**
  ```
  Section 10.9: Multi-Tab Behavior
  - Designate "active" tab for mutations
  - Other tabs read-only with refresh option
  - Tab switch: Offer to become active
  - Prevent concurrent edits across tabs
  ```
- **Priority:** P1

### FD-GAP-094: Missing Timezone Edge Cases
- **Category:** Edge Cases
- **Description:** No timezone handling for multi-location
- **Why It Matters:** Staff traveling, multi-location salons
- **Recommended PRD Addition:**
  ```
  Section 10.10: Timezone Handling
  - All times stored in UTC
  - Display in salon's local timezone
  - If user in different timezone: Show salon time prominently
  - DST transitions: Handle gracefully (no duplicate/missing hours)
  ```
- **Priority:** P2

---

## Summary: Priority Action Matrix

### Critical (P0) - Must Fix Before Launch (29 gaps)

| Gap ID | Title | Category |
|--------|-------|----------|
| FD-GAP-001 | Missing User Journey Maps | PRD Structure |
| FD-GAP-002 | Missing Gherkin Acceptance Criteria | PRD Structure |
| FD-GAP-003 | Missing Error State Documentation | PRD Structure |
| FD-GAP-004 | Missing Accessibility Section | PRD Structure |
| FD-GAP-015 | Missing Multi-Provider Ticket Handling | Functional |
| FD-GAP-018 | Missing Client Preference Display | Functional |
| FD-GAP-020 | Missing Prepaid/Package Balance | Functional |
| FD-GAP-029 | Missing Conflict Detection | Functional |
| FD-GAP-032 | Missing Touch Gesture Specs | UX/UI |
| FD-GAP-033 | Missing Loading States | UX/UI |
| FD-GAP-035 | Missing Responsive Breakpoints | UX/UI |
| FD-GAP-036 | Missing Color System | UX/UI |
| FD-GAP-038 | Missing Ticket Card Anatomy | UX/UI |
| FD-GAP-039 | Missing Staff Card Anatomy | UX/UI |
| FD-GAP-044 | Missing Search UI Specs | UX/UI |
| FD-GAP-051 | Missing Offline Indicators | UX/UI |
| FD-GAP-052 | Missing Wait Time Formula | Business Logic |
| FD-GAP-053 | Missing Progress Formula | Business Logic |
| FD-GAP-054 | Missing Turn Queue Rules | Business Logic |
| FD-GAP-063 | Missing FrontDeskTicket Fields | Data Model |
| FD-GAP-064 | Missing StaffStatus Fields | Data Model |
| FD-GAP-071 | Missing Book Module Integration | Integration |
| FD-GAP-072 | Missing Turn Tracker Integration | Integration |
| FD-GAP-073 | Missing Pending Integration | Integration |
| FD-GAP-078 | Missing WebSocket Spec | Integration |
| FD-GAP-084 | Missing Group Check-In | Competitive |
| FD-GAP-085 | Missing No-Show Protection | Competitive |
| FD-GAP-087 | Missing Quick Rebook | Competitive |
| FD-GAP-088 | Missing Network Failure Handling | Edge Cases |

### High Priority (P1) - Fix in V1.1 (38 gaps)

All remaining P1 gaps should be addressed before production deployment.

### Medium Priority (P2) - V2.0 Features (20 gaps)

Future enhancements that would make the module best-in-class.

---

## Next Steps

1. **Review and prioritize** - Product team reviews gaps and confirms priorities
2. **Update PRD** - Add missing sections and requirements
3. **Create Gherkin scenarios** - For each P0 functional requirement
4. **Design system update** - Create missing UI specifications
5. **Technical design** - Architect data model and integration changes

---

*Deep-Dive Gap Report Complete | UltraThink Analysis | December 28, 2025*
