# Product Requirements Document: Front Desk Module

**Product:** Mango POS
**Module:** Front Desk (Operations Command Center)
**Version:** 1.1
**Last Updated:** December 28, 2025
**Status:** Draft for Development
**Priority:** P0 (Critical Path)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [User Personas & Use Cases](#3-user-personas--use-cases)
4. [Competitive Analysis](#4-competitive-analysis)
5. [Feature Requirements](#5-feature-requirements)
6. [Business Rules](#6-business-rules)
7. [UX Specifications](#7-ux-specifications)
8. [Technical Requirements](#8-technical-requirements)
9. [Success Metrics](#9-success-metrics)
10. [Risks & Mitigations](#10-risks--mitigations)
11. [Implementation Plan](#11-implementation-plan)

---

## 1. Executive Summary

### 1.1 Overview

The Front Desk Module is the real-time operations command center for daily salon activities. It provides a comprehensive view of all active service tickets, staff availability, and client statuses. This module is the primary interface used by front desk coordinators during busy hours to manage the salon floor.

### 1.2 Key Value Proposition

| Value | Description |
|-------|-------------|
| **Real-Time Floor View** | See all active services at a glance |
| **Staff Availability** | Know who's free, busy, or on break instantly |
| **Quick Actions** | Check-in, start service, edit tickets in one tap |
| **Flexible Views** | Grid, compact, line views for different preferences |
| **Offline-First** | Full functionality during internet outages |

### 1.3 Success Criteria

| Metric | Target |
|--------|--------|
| Time to find available staff | < 3 seconds |
| Check-in completion time | < 15 seconds |
| Staff status accuracy | 100% real-time |
| Ticket update latency | < 500ms local, < 3s synced |
| View load performance | < 1 second for 50+ tickets |

---

## 2. Problem Statement

### 2.1 Current Challenges

| Challenge | Impact | Our Solution |
|-----------|--------|--------------|
| **No floor visibility** | Managers can't see who's doing what | Real-time ticket board with status |
| **Staff availability unknown** | Guessing who's free wastes time | Staff sidebar with live status |
| **Slow check-in process** | Clients wait, staff frustrated | One-tap check-in from ticket |
| **Walk-in chaos** | Manual assignment creates conflict | Auto-assign with Turn Queue |
| **Internet outages halt ops** | Revenue loss, frustrated clients | Full offline functionality |

### 2.2 User Quotes

> "During Saturday rush, I'm running around trying to figure out who's done and who's available. I need everything on one screen." — Salon Manager

> "Clients get annoyed when I have to put them on hold to find a free stylist. I need to see availability instantly." — Front Desk Coordinator

---

## 3. User Personas & Use Cases

### 3.1 Primary User: Front Desk Coordinator

**Goals:**
- See all active services and their progress
- Know which staff are available for walk-ins
- Check clients in quickly
- Monitor wait times

**Use Cases:**
- FD-UC-001: View all active tickets by status
- FD-UC-002: Check in arriving appointment
- FD-UC-003: Start new service for walk-in client
- FD-UC-004: See staff availability at a glance
- FD-UC-005: Assign walk-in to available staff
- FD-UC-006: Mark service as complete
- FD-UC-007: Switch between view modes

### 3.2 Secondary User: Salon Manager

**Goals:**
- Monitor floor operations remotely
- Ensure fair walk-in distribution
- Track service times

**Use Cases:**
- FD-UC-008: Monitor all stations from office
- FD-UC-009: View service duration vs expected
- FD-UC-010: Identify bottlenecks or delays
- FD-UC-011: Check staff performance

### 3.3 Secondary User: Service Provider

**Goals:**
- See upcoming clients
- Know when next client arrives
- Mark own services complete

**Use Cases:**
- FD-UC-012: View own scheduled appointments
- FD-UC-013: Mark own service as done
- FD-UC-014: Check personal queue

---

## 4. Competitive Analysis

| Feature | Mango | Fresha | Booksy | Square | Vagaro |
|---------|-------|--------|--------|--------|--------|
| Real-time ticket board | Yes | Partial | No | No | Partial |
| Staff availability sidebar | Yes | No | No | No | Partial |
| Multiple view modes | 4 modes | 1 | 1 | 1 | 2 |
| Service progress indicator | Yes | No | No | No | No |
| One-tap check-in | Yes | Yes | Yes | Yes | Yes |
| Offline operations | Yes | No | No | No | No |
| Walk-in auto-assignment | Yes | No | No | No | No |
| Service section filtering | Yes | No | No | No | No |

**Key Differentiator:** Mango combines a real-time ticket board with staff availability in a single unified interface with 4 flexible view modes.

---

## 5. Feature Requirements

### 5.1 Main Ticket Board

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-001 | Display all active tickets in selected view mode | P0 | All statuses visible: Coming, Waiting, In-Service |
| FD-P0-002 | Show ticket card with client name, services, staff | P0 | All fields visible without expansion |
| FD-P0-003 | Display service progress percentage | P0 | Progress bar based on elapsed vs expected time |
| FD-P0-004 | Color-code by ticket status | P0 | Distinct colors for each status (see UX specs) |
| FD-P0-005 | Show assigned staff with photo | P0 | Staff photo (32px) and name on each card |
| FD-P0-006 | Display client photo if available | P0 | Default avatar if no photo |
| FD-P1-007 | Show client visit count (1st visit badge) | P1 | Badge for first-time clients |
| FD-P1-008 | Display VIP/membership status | P1 | Star icon for VIP clients |
| FD-P1-009 | Show ticket notes indicator | P1 | Note icon if ticket has notes |
| FD-P2-010 | Display client rating/feedback score | P2 | Average star rating if available |

### 5.2 View Modes

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-011 | Grid Normal view (large cards) | P0 | 3-4 columns, full ticket details |
| FD-P0-012 | Grid Compact view (small cards) | P0 | 5-6 columns, condensed info |
| FD-P0-013 | Line Normal view (rows) | P0 | Full-width rows, detailed |
| FD-P0-014 | Line Compact view (narrow rows) | P0 | Condensed row height |
| FD-P0-015 | Persist view preference | P0 | Selected view saved per device |
| FD-P0-016 | View mode toggle in header | P0 | Quick toggle between modes |
| FD-P1-017 | Remember scroll position per view | P1 | Maintain position when switching |

### 5.3 Status Sections

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-018 | Coming section (scheduled appointments) | P0 | Appointments arriving in next 2 hours |
| FD-P0-019 | Waiting section (checked-in, not started) | P0 | Clients waiting for service |
| FD-P0-020 | In-Service section (active services) | P0 | Services currently in progress |
| FD-P0-021 | Section headers with count badge | P0 | Count of tickets in each section |
| FD-P0-022 | Collapsible sections | P0 | Toggle section visibility |
| FD-P1-023 | Section order customization | P1 | Drag to reorder sections |

### 5.4 Staff Sidebar

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-024 | Display all active staff | P0 | Staff working today visible |
| FD-P0-025 | Show staff status (Available/Busy/Break) | P0 | Color-coded status indicator |
| FD-P0-026 | Show current client for busy staff | P0 | Client name/service visible |
| FD-P0-027 | Show service completion progress | P0 | Progress bar or time remaining |
| FD-P0-028 | Quick-assign walk-in button | P0 | One-tap to assign walk-in |
| FD-P1-029 | Filter staff by service category | P1 | Show only nail techs, stylists, etc. |
| FD-P1-030 | Show next available time for busy staff | P1 | Estimated availability |
| FD-P1-031 | Toggle sidebar visibility | P1 | Expand/collapse sidebar |
| FD-P2-032 | Staff photo and specialty icons | P2 | Visual staff identification |

### 5.5 Service Section Tabs

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-033 | "All" tab showing all tickets | P0 | Default view, no filtering |
| FD-P0-034 | Service category tabs (Nails, Hair, Spa, etc.) | P0 | Filter tickets by category |
| FD-P0-035 | Tab count badge | P0 | Number of tickets per category |
| FD-P1-036 | Customizable tab order | P1 | Drag to reorder tabs |
| FD-P1-037 | Hide unused categories | P1 | Don't show empty categories |

### 5.6 Ticket Actions

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-038 | Check-in action (Coming → Waiting) | P0 | One-tap, updates status immediately |
| FD-P0-039 | Start service action (Waiting → In-Service) | P0 | Assigns staff, starts timer |
| FD-P0-040 | Mark done action (In-Service → Pending) | P0 | Moves to Pending queue |
| FD-P0-041 | View ticket details modal | P0 | Full ticket info in modal/slide-in |
| FD-P0-042 | Edit ticket (add/remove services) | P0 | Modify services on ticket |
| FD-P1-043 | Reassign staff | P1 | Change assigned provider |
| FD-P1-044 | Add note to ticket | P1 | Quick note from card |
| FD-P1-045 | Call client (click to call) | P1 | Opens phone dialer |
| FD-P1-046 | Send SMS to client | P1 | Pre-filled message |
| FD-P2-047 | Split ticket | P2 | Divide services to separate tickets |
| FD-P2-048 | Merge tickets | P2 | Combine multiple tickets |

### 5.7 Walk-In Management

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-049 | Add walk-in button | P0 | Quick-add walk-in client |
| FD-P0-050 | Walk-in client search | P0 | Find existing or create new |
| FD-P0-051 | Service selection for walk-in | P0 | Quick service picker |
| FD-P0-052 | Auto-assign based on Turn Queue | P0 | Integrates with Turn Tracker |
| FD-P1-053 | Manual staff assignment override | P1 | Choose specific staff |
| FD-P1-054 | Add to waitlist option | P1 | If no staff available |
| FD-P1-055 | Estimated wait time display | P1 | Based on current queue |

### 5.8 Waitlist Management

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P1-056 | View current waitlist | P1 | List of waiting walk-ins |
| FD-P1-057 | Waitlist position display | P1 | Position in queue visible |
| FD-P1-058 | Estimated wait time per client | P1 | Based on current services |
| FD-P1-059 | Convert waitlist to ticket | P1 | Move to service when ready |
| FD-P1-060 | Remove from waitlist | P1 | Client left without service |
| FD-P2-061 | Waitlist notifications | P2 | Alert when position changes |

### 5.9 Search & Filter

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-062 | Search tickets by client name | P0 | Instant filter as typing |
| FD-P0-063 | Search by phone number | P0 | Partial match supported |
| FD-P1-064 | Filter by staff | P1 | Show only selected staff's tickets |
| FD-P1-065 | Filter by time range | P1 | Tickets in next hour, next 2 hours |
| FD-P2-066 | Filter by service type | P2 | Show only specific services |

### 5.10 Real-Time Updates

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-067 | Live ticket status updates | P0 | Changes reflect within 500ms |
| FD-P0-068 | Live staff status updates | P0 | Availability changes instantly |
| FD-P0-069 | Progress timer updates | P0 | Elapsed time updates every minute |
| FD-P0-070 | New ticket notification | P0 | Visual/audio alert for new bookings |
| FD-P1-071 | Long-wait alerts | P1 | Highlight tickets waiting 10+ min |

### 5.11 Operation Templates

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-072 | Reception Desk (frontDeskBalanced) template | P0 | Balanced 40% team / 60% ticket layout; shows both team and tickets at a glance; organizes by busyStatus; viewWidth: wide |
| FD-P0-073 | Express Queue (frontDeskTicketCenter) template | P0 | Ticket-focused 10% team / 90% ticket layout; maximizes ticket visibility; combined sections via tabs; viewWidth: compact |
| FD-P0-074 | Provider View (teamWithOperationFlow) template | P0 | Team-focused 80% team / 20% ticket layout; large staff cards with current client and upcoming appointments; viewWidth: wide |
| FD-P0-075 | Quick Checkout (teamInOut) template | P0 | Full-screen team view (100% team / 0% ticket); simple clock in/out; no appointments display; organizes by clockedStatus; viewWidth: fullScreen |
| FD-P0-076 | Template selection UI | P0 | Visual template cards with layout preview, title, subtitle, description, and "Best For" use case |
| FD-P0-077 | Apply template action | P0 | One-click applies all template settings; persists to storage |
| FD-P1-078 | Template metadata display | P1 | Show userType (Front Desk Staff vs Service Provider), layoutRatio, teamMode, ticketMode |

### 5.12 Front Desk Settings Panel

#### 5.12.1 Team Settings

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-079 | Organize by setting | P0 | Toggle between 'clockedStatus' (Clocked In/Out groups) and 'busyStatus' (Available/Busy/Break groups) |
| FD-P0-080 | Show turn count toggle | P0 | Display turn count per staff member; default: true |
| FD-P0-081 | Show next appointment toggle | P0 | Display staff's next scheduled appointment; default: true |
| FD-P0-082 | Show serviced amount toggle | P0 | Display total amount serviced by staff; default: true |
| FD-P0-083 | Show ticket count toggle | P0 | Display number of tickets per staff; default: true |
| FD-P0-084 | Show last done toggle | P0 | Display last service completion time; default: true |
| FD-P0-085 | Show more options button toggle | P0 | Display more options button on staff cards; default: true |

#### 5.12.2 View Width Options

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-086 | Ultra Compact width | P0 | Minimal sidebar width for maximum ticket area |
| FD-P0-087 | Compact width | P0 | Small sidebar (10% width) for ticket-focused view |
| FD-P0-088 | Wide width | P0 | Balanced sidebar (40% width) for mixed workflows |
| FD-P0-089 | Full Screen width | P0 | 100% team view, no ticket area visible |
| FD-P0-090 | Custom width option | P0 | User-defined percentage via customWidthPercentage setting |
| FD-P0-091 | Custom width percentage slider | P0 | Numeric input/slider for custom width (1-100%) |

#### 5.12.3 Ticket Display Settings

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-092 | Display mode setting | P0 | Toggle between 'column' (separate columns per section) and 'tab' (tabbed interface) |
| FD-P0-093 | View style setting | P0 | Toggle between 'expanded' (full card details) and 'compact' (condensed cards) |
| FD-P0-094 | Closed tickets placement | P0 | Options: 'floating' (overlay), 'bottom' (footer section), 'hidden' (not visible) |
| FD-P0-095 | Sort by setting | P0 | Options: 'queue' (turn order) or 'time' (chronological) |
| FD-P0-096 | Combine sections toggle | P0 | Merge waitlist and in-service into tabbed interface; default: false |
| FD-P0-097 | Show Wait List toggle | P0 | Toggle visibility of waitlist section |
| FD-P0-098 | Show In Service toggle | P0 | Toggle visibility of in-service section |
| FD-P0-099 | Show Pending toggle | P0 | Toggle visibility of pending section |

#### 5.12.4 Workflow & Automation

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-100 | Show coming appointments toggle | P0 | Display upcoming appointments section |
| FD-P0-101 | Coming appointments default state | P0 | Options: 'expanded' or 'collapsed' on page load |
| FD-P0-102 | Enable drag and drop toggle | P0 | Allow drag-and-drop ticket reordering; default: true |
| FD-P1-103 | Auto-close after checkout | P1 | Automatically close ticket panel after checkout completion |
| FD-P1-104 | Auto no-show cancel toggle | P1 | Automatically mark appointments as no-show after threshold |
| FD-P1-105 | Auto no-show time setting | P1 | Minutes to wait before auto no-show (default: 30 minutes) |
| FD-P1-106 | Alert pending time toggle | P1 | Enable alerts for tickets pending too long |
| FD-P1-107 | Pending alert minutes setting | P1 | Minutes threshold for pending alerts (default: 15 minutes) |

#### 5.12.5 Workflow Activation

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-108 | Wait List Active toggle | P0 | Enable/disable waitlist stage entirely in workflow |
| FD-P0-109 | In Service Active toggle | P0 | Enable/disable in-service stage in workflow; requires waitListActive to be true |
| FD-P0-110 | Workflow stage dependency enforcement | P0 | Enabling inServiceActive automatically enables waitListActive; disabling waitListActive automatically disables inServiceActive |

#### 5.12.6 UI Controls - Team Actions

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-111 | Show Add Ticket action toggle | P0 | Display/hide Add Ticket button on team cards |
| FD-P0-112 | Show Add Note action toggle | P0 | Display/hide Add Note button on team cards |
| FD-P0-113 | Show Edit Team action toggle | P0 | Display/hide Edit Team button on team cards |
| FD-P0-114 | Show Quick Checkout action toggle | P0 | Display/hide Quick Checkout button on team cards |

#### 5.12.7 UI Controls - Ticket Actions

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-115 | Show Apply Discount action toggle | P0 | Display/hide Apply Discount option on tickets |
| FD-P0-116 | Show Redeem Benefits action toggle | P0 | Display/hide Redeem Benefits option on tickets |
| FD-P0-117 | Show Ticket Note action toggle | P0 | Display/hide Ticket Note option on tickets |
| FD-P0-118 | Show Start Service action toggle | P0 | Display/hide Start Service button on tickets |
| FD-P0-119 | Show Pending Payment action toggle | P0 | Display/hide Pending Payment option on tickets |
| FD-P0-120 | Show Delete Ticket action toggle | P0 | Display/hide Delete Ticket option on tickets |

### 5.13 Mobile-Specific Features

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-121 | Mobile Tab Bar component | P0 | Dedicated mobile navigation bar with tab-based section switching |
| FD-P0-122 | Tab metrics display | P0 | Each tab shows: count (primary), secondary info (e.g., "12m avg"), urgent indicator (red dot) |
| FD-P0-123 | Tab icons | P0 | Service (FileText), Waiting (Users), Appointments (Calendar), Team (UserCircle) icons |
| FD-P0-124 | Active tab styling | P0 | Active tab has white background, shadow, border; inactive tabs are muted |
| FD-P0-125 | Skeleton loading state | P0 | Show animated skeleton tabs while data loads; configurable skeletonCount (default: 4) |
| FD-P0-126 | Keyboard navigation | P0 | Arrow keys (Left/Right) navigate between tabs; Home/End jump to first/last tab |
| FD-P0-127 | Haptic feedback | P0 | Trigger haptic feedback on tab selection (via haptics.selection()) |
| FD-P0-128 | Short labels for small screens | P0 | Tab supports shortLabel prop for very small screens; hidden on xs, visible on sm+ |
| FD-P1-129 | Tab color themes | P1 | Each tab type (service, waiting, appointments, team) has configurable active/text/badge colors |
| FD-P1-130 | ARIA accessibility | P1 | Proper role="tablist", role="tab", aria-selected, tabIndex management |

### 5.14 Pending Section Footer

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FD-P0-131 | Collapsed view mode | P0 | Compact footer showing receipt icon, badge count, total amount, and up to 3 ticket cards in horizontal scroll |
| FD-P0-132 | Expanded view mode | P0 | Fixed 300px height panel with scrollable list of all pending tickets |
| FD-P0-133 | Full View mode | P0 | Full-screen overlay showing complete Pending module with all features |
| FD-P0-134 | Mode toggle interaction | P0 | Click header to toggle between collapsed/expanded; separate button for full view |
| FD-P0-135 | Pulsing badge count | P0 | Red badge with ticket count on receipt icon; positioned at top-right |
| FD-P0-136 | Total amount display | P0 | Show calculated sum of subtotal + tax + tip for all pending tickets |
| FD-P0-137 | Ticket card quick actions | P0 | Click ticket card to open checkout panel; shows ticket number, client name, amount |
| FD-P0-138 | "+X more" overflow indicator | P0 | When more than 3 tickets in collapsed mode, show button to expand with remaining count |
| FD-P0-139 | Empty state display | P0 | Show "No Pending Payments" message with muted receipt icon when no pending tickets |
| FD-P0-140 | Auto-collapse on empty | P0 | Force collapsed mode when pending ticket count reaches zero |
| FD-P0-141 | View mode persistence | P0 | Save viewMode to localStorage; restore on page load (only if tickets exist) |
| FD-P0-142 | Dynamic CSS height variable | P0 | Set --pending-section-height CSS variable based on viewMode for layout calculations |
| FD-P0-143 | Sidebar width awareness | P0 | Footer respects --staff-sidebar-width CSS variable; positioned right of sidebar |
| FD-P1-144 | Premium design tokens | P1 | Use paper/gold color scheme with shadows for elevated visual design |
| FD-P1-145 | Hover animations | P1 | Ticket cards lift (translateY -2px) and increase shadow on hover |

---

## 6. Business Rules

### 6.1 Ticket Status Rules

| Rule ID | Rule |
|---------|------|
| FD-BR-001 | Tickets default to "Coming" when appointment is scheduled |
| FD-BR-002 | "Check-in" changes status from Coming to Waiting |
| FD-BR-003 | "Start Service" changes status from Waiting to In-Service |
| FD-BR-004 | "Mark Done" changes status from In-Service to Pending |
| FD-BR-005 | Only tickets with Pending status appear in Pending module |
| FD-BR-006 | Tickets not started within 30 min of scheduled time get flagged |
| FD-BR-007 | No-show marking available for Coming tickets 15+ min past time |

### 6.2 Staff Assignment Rules

| Rule ID | Rule |
|---------|------|
| FD-BR-008 | Walk-ins auto-assigned via Turn Queue unless manually overridden |
| FD-BR-009 | Staff can only be assigned services they're qualified for |
| FD-BR-010 | Staff on break cannot be assigned new services |
| FD-BR-011 | Staff marked "Available" appear at top of sidebar |
| FD-BR-012 | Staff with active service show as "Busy" |

### 6.3 View Rules

| Rule ID | Rule |
|---------|------|
| FD-BR-013 | Default view mode is Grid Normal |
| FD-BR-014 | View preference persisted per device |
| FD-BR-015 | Coming section shows appointments in next 2 hours |
| FD-BR-016 | Sections collapse to save space when empty |
| FD-BR-017 | Service tabs only show if salon has those categories |

### 6.4 Waitlist Rules

| Rule ID | Rule |
|---------|------|
| FD-BR-018 | Waitlist ordered by arrival time (FIFO) |
| FD-BR-019 | Waitlist entries older than 2 hours auto-archived |
| FD-BR-020 | Converting waitlist to ticket uses Turn Queue for assignment |
| FD-BR-021 | Waitlist displays estimated wait based on current queue |

### 6.5 Workflow Stage Dependency Rules

| Rule ID | Rule |
|---------|------|
| FD-BR-022 | In-Service stage requires Wait List stage to be active |
| FD-BR-023 | Enabling inServiceActive automatically enables waitListActive |
| FD-BR-024 | Disabling waitListActive automatically disables inServiceActive |
| FD-BR-025 | showWaitList visibility depends on waitListActive being true |
| FD-BR-026 | showInService visibility depends on inServiceActive being true |

### 6.6 Template Application Rules

| Rule ID | Rule |
|---------|------|
| FD-BR-027 | Applying a template overrides only template-specific settings, not all settings |
| FD-BR-028 | Template selection persists across sessions via operationTemplate setting |
| FD-BR-029 | Each template has predefined viewWidth, displayMode, combineSections, showComingAppointments, and organizeBy values |
| FD-BR-030 | Template changes trigger dependency enforcement (see BR-022 to BR-026) |

---

## 7. UX Specifications

### 7.1 Main Layout

```
+-----------------------------------------------------------------------------+
| [Logo] Front Desk          [Search] [View Toggle] [+Walk-In]    [Sidebar >] |
+-----------------------------------------------------------------------------+
| [All] [Nails] [Hair] [Spa] [Wax] [Massage]                    [Waitlist: 3] |
+-----------------------------------------------------------+-----------------+
|                                                           | STAFF SIDEBAR   |
|  COMING (5)                                        v      |                 |
|  +----------+ +----------+ +----------+ +----------+      | * Sarah    FREE |
|  | 10:00 AM | | 10:15 AM | | 10:30 AM | | 10:45 AM |      |   [+ Walk-In]   |
|  | Jane Doe | | John S.  | | Mary W.  | | Client   |      |                 |
|  | Haircut  | | Manicure | | Facial   | | Pedicure |      | * Mike    BUSY  |
|  | @ Sarah  | | @ Mike   | | @ Lisa   | | @ Any    |      |   Jane - 12min  |
|  |[Check In]| |[Check In]| |[Check In]| |[Check In]|      |   ########..    |
|  +----------+ +----------+ +----------+ +----------+      |                 |
|                                                           | * Lisa   BREAK  |
|  WAITING (2)                                       v      |   Back 10:45    |
|  +----------+ +----------+                                |                 |
|  | T 5 min  | | T 2 min  |                                | * Tom     BUSY  |
|  | Bob Lee  | | Amy Chen |                                |   John - 25min  |
|  | Massage  | | Nails    |                                |   ######....    |
|  | @ Tom    | | @ ---    |                                |                 |
|  | [Start]  | | [Assign] |                                |                 |
|  +----------+ +----------+                                |                 |
|                                                           |                 |
|  IN-SERVICE (4)                                    v      |                 |
|  +----------+ +----------+ +----------+ +----------+      |                 |
|  | ######.. | | #####... | | ####.... | | ##...... |      |                 |
|  | 75%      | | 65%      | | 45%      | | 20%      |      |                 |
|  | Jane Doe | | Client A | | Client B | | Client C |      |                 |
|  | Haircut  | | Pedicure | | Facial   | | Massage  |      |                 |
|  | @ Sarah  | | @ Mike   | | @ Lisa   | | @ Tom    |      |                 |
|  | [Done]   | | [Done]   | | [Done]   | | [Done]   |      |                 |
|  +----------+ +----------+ +----------+ +----------+      |                 |
|                                                           |                 |
+-----------------------------------------------------------+-----------------+
```

### 7.2 Ticket Card States

| Status | Background | Border | Progress Bar |
|--------|------------|--------|--------------|
| Coming | White | Gray | None |
| Waiting | Light Yellow | Yellow | Wait timer |
| In-Service | Light Blue | Blue | Progress % |
| Near Complete (>80%) | Light Green | Green | Green bar |
| Overdue (>100%) | Light Red | Red | Red bar |

### 7.3 Staff Status Colors

| Status | Color | Indicator |
|--------|-------|-----------|
| Available | Green | Solid green dot |
| Busy | Blue | Blue dot + progress |
| Break | Orange | Orange dot + return time |
| Off | Gray | Gray dot |
| Clocked Out | None | Not shown |

### 7.4 View Mode Specifications

| Mode | Card Size | Columns | Info Shown |
|------|-----------|---------|------------|
| Grid Normal | 240x180px | 3-4 | Full details |
| Grid Compact | 180x120px | 5-6 | Condensed |
| Line Normal | Full width, 80px | 1 | All columns |
| Line Compact | Full width, 48px | 1 | Essential only |

### 7.5 Mobile Responsive

| Screen | Layout Adjustment |
|--------|-------------------|
| iPad Landscape | Full layout, 4-5 columns |
| iPad Portrait | 3 columns, staff sidebar below |
| iPhone | Single column, swipeable sections |

### 7.6 Pending Section Footer Design

| Mode | Height | Layout |
|------|--------|--------|
| Empty State | 36px | Centered "No Pending Payments" text |
| Collapsed | 100px | Header (44px) + Horizontal scroll ticket cards |
| Expanded | 300px (fixed) | Header (52px) + Scrollable list |
| Full View | 100vh | Full-screen overlay with complete Pending module |

---

## 8. Technical Requirements

### 8.1 Performance

| Metric | Target |
|--------|--------|
| Initial load time | < 1 second |
| Ticket render time | < 50ms per card |
| Status update latency | < 500ms local |
| Search response | < 100ms |
| Scroll performance | 60fps with 100+ tickets |

### 8.2 Data Requirements

```typescript
interface FrontDeskTicket {
  id: string;
  status: 'coming' | 'waiting' | 'in_service' | 'pending' | 'completed';
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientPhoto?: string;
  isFirstVisit: boolean;
  isVip: boolean;
  scheduledTime: Date;
  checkedInAt?: Date;
  serviceStartedAt?: Date;
  services: TicketService[];
  assignedStaff: StaffAssignment[];
  notes?: string;
  category: 'nails' | 'hair' | 'spa' | 'wax' | 'massage' | 'other';
  estimatedDuration: number;  // minutes
  actualDuration?: number;
}

interface StaffStatus {
  staffId: string;
  name: string;
  photo?: string;
  status: 'available' | 'busy' | 'break' | 'off';
  currentTicketId?: string;
  currentClientName?: string;
  currentProgress?: number;  // 0-100
  nextAvailableAt?: Date;
  breakReturnAt?: Date;
  skills: string[];  // service categories
}

interface WaitlistEntry {
  id: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  requestedServices: string[];
  preferredStaff?: string;
  addedAt: Date;
  position: number;
  estimatedWait: number;  // minutes
  status: 'waiting' | 'called' | 'seated' | 'left';
}
```

### 8.3 State Management

```typescript
// Redux slice structure
interface FrontDeskState {
  tickets: Record<string, FrontDeskTicket>;
  staffStatuses: Record<string, StaffStatus>;
  waitlist: WaitlistEntry[];
  viewMode: 'grid-normal' | 'grid-compact' | 'line-normal' | 'line-compact';
  activeSection: string;  // service category filter
  collapsedSections: string[];
  searchQuery: string;
  loading: boolean;
  lastUpdated: Date;
}

// Front Desk Settings State (frontDeskSettingsSlice)
interface FrontDeskSettingsState {
  settings: FrontDeskSettingsData;
  viewState: ViewState;
  hasUnsavedChanges: boolean;
  lastSaved: number | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

// View State (persisted to localStorage)
interface ViewState {
  activeMobileSection: string;
  activeCombinedTab: string;
  combinedViewMode: 'grid' | 'list';
  combinedMinimizedLineView: boolean;
  serviceColumnWidth: number;
}
```

### 8.4 Offline Behavior

| Operation | Offline Support | Sync Behavior |
|-----------|-----------------|---------------|
| View tickets | Full | Cached data |
| Check-in | Full | Queued for sync |
| Start service | Full | Queued for sync |
| Mark done | Full | Queued for sync |
| Add walk-in | Full | Queued for sync |
| Edit ticket | Full | Conflict resolution |
| Change view | Full | Local only |
| Search | Full | Cached data only |

### 8.5 Real-Time Subscriptions

```typescript
// Supabase subscriptions
- tickets (filtered by salonId, today's date)
- staff_status (filtered by salonId)
- waitlist (filtered by salonId, today's date)
```

### 8.6 Cross-Tab Synchronization

| Feature | Implementation | Description |
|---------|----------------|-------------|
| Settings sync | localStorage + storage events | Real-time sync of FrontDesk settings across browser tabs |
| Storage event listener | window.addEventListener('storage') | Listen for changes from other tabs |
| setSettings action | Redux reducer | Replace all settings when receiving update from another tab |
| subscribeToSettingsChanges | Service function | Subscribe to cross-tab setting changes |

### 8.7 View State Persistence

| State Property | Storage Key | Description |
|----------------|-------------|-------------|
| activeMobileSection | 'activeMobileSection' | Currently active section on mobile |
| activeCombinedTab | 'activeCombinedTab' | Active tab in combined view mode |
| combinedViewMode | 'combinedViewMode' | Grid or list display mode |
| combinedMinimizedLineView | 'combinedMinimizedLineView' | Minimized line view state |
| serviceColumnWidth | 'serviceColumnWidth' | Persisted column width percentage |
| pendingFooterViewMode | 'pendingFooterViewMode' | Pending footer collapsed/expanded/fullView state |

---

## 9. Success Metrics

### 9.1 Key Performance Indicators

| KPI | Target | Measurement |
|-----|--------|-------------|
| Check-in time | < 15 seconds | Time from tap to status change |
| Staff assignment accuracy | 99%+ | Correct staff on ticket |
| View load time | < 1 second | Time to fully render |
| Offline operation success | 100% | Operations completed offline |
| Sync conflict rate | < 0.1% | Conflicts per 1000 operations |

### 9.2 User Satisfaction

| Metric | Target |
|--------|--------|
| Feature adoption rate | 90%+ use within 7 days |
| View mode preference stability | Users settle on preferred view |
| Daily active usage | 100% of working days |
| Support tickets | < 1 per 1000 operations |

---

## 10. Risks & Mitigations

### 10.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance degradation with 100+ tickets | Slow scrolling, lag | Virtual scrolling, memoization |
| Offline conflicts | Data inconsistency | Conflict resolution UI, auto-merge |
| Real-time sync failures | Stale data | Fallback polling, visual indicators |

### 10.2 UX Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Information overload | Users overwhelmed | Collapsible sections, view modes |
| Learning curve for view modes | Confusion | Default to Grid Normal, tooltips |
| Accidental status changes | Workflow errors | Confirmation for destructive actions |

### 10.3 Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Staff resistance to new workflow | Low adoption | Training, gradual rollout |
| Walk-in assignment disputes | Staff conflict | Transparent Turn Queue logic |

---

## 11. Implementation Plan

### Phase 1: Core View (Week 1-2)
- [ ] FD-P0-001 to FD-P0-006: Main ticket board
- [ ] FD-P0-011 to FD-P0-016: View modes (Grid Normal first)
- [ ] FD-P0-018 to FD-P0-022: Status sections

### Phase 2: Staff Sidebar (Week 3)
- [ ] FD-P0-024 to FD-P0-028: Staff availability
- [ ] FD-P0-033 to FD-P0-035: Service tabs

### Phase 3: Actions & Walk-Ins (Week 4)
- [ ] FD-P0-038 to FD-P0-042: Ticket actions
- [ ] FD-P0-049 to FD-P0-052: Walk-in management
- [ ] FD-P0-062 to FD-P0-063: Search

### Phase 4: Real-Time & Polish (Week 5)
- [ ] FD-P0-067 to FD-P0-070: Real-time updates
- [ ] Remaining P1 features
- [ ] Performance optimization

### Phase 5: Waitlist & Advanced (Week 6+)
- [ ] FD-P1-056 to FD-P1-060: Waitlist management
- [ ] Remaining P2 features
- [ ] Edge cases and polish

### Phase 6: Operation Templates & Settings (Already Implemented)
- [x] FD-P0-072 to FD-P0-078: Operation templates
- [x] FD-P0-079 to FD-P0-120: Front Desk Settings Panel
- [x] FD-P0-121 to FD-P0-130: Mobile-specific features
- [x] FD-P0-131 to FD-P0-145: Pending Section Footer

---

## Appendix

### A. Related Documents

- [Mango POS PRD.md](./Mango%20POS%20PRD.md) - Main operations PRD
- [PRD-Turn-Tracker-Module.md](./PRD-Turn-Tracker-Module.md) - Turn Queue for walk-in assignment
- [PRD-Pending-Module.md](./PRD-Pending-Module.md) - Checkout queue (downstream)
- [docs/modules/frontdesk/](../modules/frontdesk/) - Implementation documentation

### B. Glossary

| Term | Definition |
|------|------------|
| Coming | Scheduled appointment not yet checked in |
| Waiting | Client checked in, waiting for service to start |
| In-Service | Service actively being performed |
| Pending | Service complete, awaiting checkout |
| Turn Queue | System for fair walk-in distribution |
| Walk-In | Client without prior appointment |
| Operation Template | Preset configuration defining layout ratios and workflow settings |
| View Width | Sidebar width configuration (ultraCompact, compact, wide, fullScreen, custom) |
| Display Mode | Layout style for ticket sections (column or tab) |
| Combine Sections | Merge waitlist and in-service into tabbed interface |

### C. Front Desk Settings Data Structure

```typescript
interface FrontDeskSettingsData {
  // Operation Template
  operationTemplate: 'frontDeskBalanced' | 'frontDeskTicketCenter' | 'teamWithOperationFlow' | 'teamInOut';

  // Team Settings
  organizeBy: 'clockedStatus' | 'busyStatus';
  showTurnCount: boolean;
  showNextAppointment: boolean;
  showServicedAmount: boolean;
  showTicketCount: boolean;
  showLastDone: boolean;
  showMoreOptionsButton: boolean;
  viewWidth: 'ultraCompact' | 'compact' | 'wide' | 'fullScreen' | 'custom';
  customWidthPercentage: number;

  // Ticket Settings
  displayMode: 'column' | 'tab';
  viewStyle: 'expanded' | 'compact';
  showWaitList: boolean;
  showInService: boolean;
  showPending: boolean;
  closedTicketsPlacement: 'floating' | 'bottom' | 'hidden';
  sortBy: 'queue' | 'time';
  combineSections: boolean;

  // Workflow & Rules
  showComingAppointments: boolean;
  comingAppointmentsDefaultState: 'expanded' | 'collapsed';
  enableDragAndDrop: boolean;
  autoCloseAfterCheckout: boolean;
  autoNoShowCancel: boolean;
  autoNoShowTime: number;
  alertPendingTime: boolean;
  pendingAlertMinutes: number;

  // UI Controls - Team
  showAddTicketAction: boolean;
  showAddNoteAction: boolean;
  showEditTeamAction: boolean;
  showQuickCheckoutAction: boolean;

  // UI Controls - Ticket
  showApplyDiscountAction: boolean;
  showRedeemBenefitsAction: boolean;
  showTicketNoteAction: boolean;
  showStartServiceAction: boolean;
  showPendingPaymentAction: boolean;
  showDeleteTicketAction: boolean;

  // Workflow Activation
  waitListActive: boolean;
  inServiceActive: boolean;
}
```

### D. Template Configurations

| Template ID | Title | Layout Ratio | View Width | Display Mode | Organize By | Best For |
|-------------|-------|--------------|------------|--------------|-------------|----------|
| frontDeskBalanced | Reception Desk | 40% team / 60% ticket | wide | column | busyStatus | Front desk staff who coordinate between clients and providers |
| frontDeskTicketCenter | Express Queue | 10% team / 90% ticket | compact | tab | busyStatus | High-volume salons where speed is priority |
| teamWithOperationFlow | Provider View | 80% team / 20% ticket | wide | column | busyStatus | Service providers who manage their own clients |
| teamInOut | Quick Checkout | 100% team / 0% ticket | fullScreen | column | clockedStatus | Low-tech salons, booth rentals, barbershops |

---

*Document Version: 1.1 | Created: December 28, 2025 | Updated: December 28, 2025*
