# 📱 Mango Biz Store App: Operations Module
## Product Requirements Document (PRD) v1.0

**Document Owner:** Product Team  
**Last Updated:** October 21, 2025  
**Status:** Draft for Review  
**Version:** 1.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Objectives](#2-product-vision--objectives)
3. [User Personas & Use Cases](#3-user-personas--use-cases)
4. [System Overview](#4-system-overview)
5. [Module Specifications](#5-module-specifications)
6. [Global Features](#6-global-features)
7. [User Flows](#7-user-flows)
8. [Technical Architecture](#8-technical-architecture)
9. [Integration Points](#9-integration-points)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Success Metrics](#11-success-metrics)
12. [Implementation Plan](#12-implementation-plan)

---

## 1. Executive Summary

### 1.1 Product Overview

The **Mango Biz Store App Operations Module** is the offline-first, mobile-optimized command center for daily salon and spa operations. Operating in **Salon Mode**, this module enables salon managers and front desk staff to orchestrate all client services, staff coordination, and transactions from a single iPad or tablet interface.

This PRD focuses specifically on the **Salon Mode** version of the Operations Module, where the device is logged in as the salon account (not individual staff members) and provides comprehensive operational control.

### 1.2 Key Problems Solved

- **Operational Chaos:** Multiple systems for scheduling, check-in, and payments create confusion
- **Offline Limitations:** Internet outages halt business operations
- **Poor Staff Coordination:** No visibility into staff availability and turn rotation
- **Slow Checkout:** Manual processes delay client departures
- **Limited Floor Visibility:** Managers can't see real-time service status across the salon

### 1.3 Core Value Proposition

**A unified, offline-capable operations hub that gives salons complete control over their daily workflow—from appointment scheduling to checkout—while intelligently managing staff coordination and maintaining seamless multi-device synchronization.**

### 1.4 Success Criteria

- **95%+ uptime** including offline operation capability
- **Reduce checkout time** by 40% compared to legacy systems
- **Zero revenue loss** during internet outages
- **100% multi-device sync accuracy** within 30 seconds of reconnection
- **Staff adoption rate** of 90%+ within 30 days

---

## 2. Product Vision & Objectives

### 2.1 Vision Statement

"Empower salon operators with an intelligent, offline-first operations platform that eliminates operational friction, maximizes staff efficiency, and ensures every client receives seamless service—regardless of connectivity."

### 2.2 Strategic Objectives

**Q1 2026 Goals:**
1. Launch core operations module with Book, Front Desk, Checkout
2. Achieve 500+ active salon deployments
3. Process $10M+ in offline-capable transactions

**Q2 2026 Goals:**
4. Add advanced Turn Queue automation with AI-powered staff matching
5. Implement real-time multi-location coordination
6. Launch comprehensive analytics dashboard

### 2.3 Key Differentiators

1. **True Offline-First Architecture:** Not just "works offline" but "optimized for offline"
2. **Intelligent Turn Queue:** Auto-assigns staff based on skills, preferences, and availability
3. **Flexible Workflow:** Salons can customize service flows to match their operations
4. **Real-Time Coordination:** All devices stay synchronized with sub-second updates
5. **Single Salon Login:** Multiple staff use one device without personal login friction

---

## 3. User Personas & Use Cases

### 3.1 Primary Personas

#### Persona 1: Sarah - Salon Owner/Manager
**Profile:**
- Age: 35-50
- Manages 15-person salon
- Tech-comfortable but not technical
- Values: Efficiency, staff satisfaction, revenue visibility

**Goals:**
- Monitor all salon activities in real-time
- Ensure fair distribution of walk-ins to staff
- Minimize client wait times
- Track daily revenue
- Handle emergencies (no-shows, staff absences)

**Pain Points:**
- Can't see who's available at a glance
- Walk-in assignment creates staff conflict
- Internet outages halt operations
- End-of-day reconciliation takes too long

**Use Cases:**
- Check floor status during peak hours
- Override turn queue for VIP clients
- Handle refunds and voids
- Run end-of-day reports

---

#### Persona 2: Jessica - Front Desk Coordinator
**Profile:**
- Age: 22-35
- Primary user of operations module
- Handles check-ins, scheduling, payments
- Tech-savvy, multitasking expert

**Goals:**
- Check clients in quickly
- Assign services to available staff
- Process checkouts fast
- Handle phone calls while managing floor

**Pain Points:**
- Juggling multiple systems
- Doesn't know who's free vs. busy
- Clients complain about wait times
- Payment terminal is separate device

**Use Cases:**
- Check in walk-in and scheduled clients
- Book last-minute appointments
- Process 20+ checkouts per day
- Handle split payments and tips

---

#### Persona 3: Mike - Service Provider (Nail Technician)
**Profile:**
- Age: 25-45
- Focuses on client service
- Uses personal phone occasionally
- Prefers minimal tech interaction

**Goals:**
- Know when next client arrives
- Clock in/out easily
- See daily earnings
- Get notified about client preferences

**Pain Points:**
- Doesn't know when to expect next client
- Has to ask front desk about schedule
- Can't track tips throughout day

**Use Cases:**
- Clock in at start of shift
- Check schedule for day
- View personal earnings (separate Staff Mode - not covered in this PRD)

---

### 3.2 User Journey Map

**Typical Day at Sunny Nails Salon:**

**8:00 AM** - Jessica arrives, opens Store App on salon iPad
- Clocks in staff as they arrive
- Reviews today's schedule in Book module
- Checks Turn Queue is properly configured

**8:30 AM** - First appointment arrives
- Client checks in via Mango Check-In kiosk (or Jessica checks them in)
- Notification appears on Front Desk
- Assigned technician sees alert

**9:00 AM** - Walk-in client arrives
- Jessica adds to Wait List via Front Desk
- Turn Queue auto-assigns to Mike (next in rotation)
- Mike starts service

**12:00 PM** - Lunch rush, 3 walk-ins waiting
- Front Desk shows clear wait times
- Jessica manages queue, reassigns based on specialties
- Sarah (owner) monitors from Back Office via Admin Portal

**2:00 PM** - Internet goes down
- Device shows "Offline Mode" indicator
- Operations continue uninterrupted
- Payments process and queue for sync

**3:30 PM** - Internet restored
- Automatic sync begins
- All transactions upload to server
- Multi-device coordination resumes

**7:00 PM** - End of day
- Jessica runs End of Day process
- Reviews Today's Sales
- Reconciles cash drawer
- All data syncs to cloud
- Closes out salon iPad

---

## 4. System Overview

### 4.1 Architecture Context

The Store App Operations Module sits as the **mobile interface layer** of Mango Biz:

```
┌─────────────────────────────────────────────┐
│         MANGO BIZ ECOSYSTEM                 │
├─────────────────────────────────────────────┤
│  Admin Portal (Web) ← Strategic Management  │
│  Store App (Mobile) ← Daily Operations ✓    │
├─────────────────────────────────────────────┤
│         BACKEND SERVICES                    │
│  • SQL Server Express (Primary DB)          │
│  • Redis (Cache)                            │
│  • Node.js API                              │
│  • WebSocket Server (Real-time)             │
│  • Sync Engine                              │
├─────────────────────────────────────────────┤
│         CLIENT STORAGE                      │
│  • IndexedDB (Offline Data)                 │
│  • Service Workers (Background Sync)        │
└─────────────────────────────────────────────┘
```

### 4.2 Operating Modes

**Salon Mode (This PRD):**
- Logged in as salon account
- Full operational permissions
- Access to all staff schedules
- Can override business rules
- Sees aggregate revenue data

**Staff Mode (Future PRD):**
- Logged in as individual staff member
- Limited to personal schedule
- Can only edit own tickets
- Views only personal earnings
- Cannot access sensitive salon data

### 4.3 Device Requirements

**Minimum Specifications:**
- iPad (8th generation or newer) or equivalent Android tablet
- iOS 15+ or Android 11+
- 64GB storage minimum
- WiFi + Cellular recommended (fallback connectivity)

**Recommended Setup:**
- iPad Pro 11" or 12.9"
- Cellular data backup
- Protective case with stand
- External receipt printer (via Bluetooth/WiFi)
- Card reader (integrated with Mango Payment)

---

## 5. Module Specifications

### 5.1 Book Module (Calendar & Scheduling)

#### 5.1.1 Overview
The Book module serves as the appointment calendar and scheduling interface, providing visual management of all scheduled services across time.

#### 5.1.2 Core Features

**A. Calendar Views**

1. **Day View (Primary)**
   - Timeline from salon open to close
   - Staff columns (horizontal swim lanes)
   - 15-minute interval granularity
   - Color-coded by service type
   - Duration bars show appointment length
   - Status indicators (Scheduled, Checked-In, In-Service, etc.)

2. **Week View**
   - 7-day overview
   - Collapsed staff view (grouped)
   - Shows appointment count per day
   - Quick navigation to Day View

3. **Agenda View**
   - List format of appointments
   - Sortable by time, staff, service, client
   - Quick search and filter
   - Ideal for phone bookings

**B. Appointment Management**

1. **Create New Appointment**
   - Quick client search (autocomplete)
   - Create new client inline
   - Service selection (single or multiple)
   - Staff assignment (manual or auto-suggest)
   - Date/time picker with availability highlighting
   - Duration auto-calculated from services
   - Notes field (client preferences, requests)
   - Booking source tag (Phone, Walk-In, Online, etc.)
   - Send confirmation toggle (SMS/Email)

2. **Edit Appointment**
   - Tap appointment card to open editor
   - Change any appointment details
   - Reschedule via drag-and-drop or date picker
   - Add/remove services
   - Reassign staff
   - Add internal notes
   - Change status manually
   - View appointment history log

3. **Cancel/No-Show**
   - Cancel with reason selection
   - Mark as no-show (affects client history)
   - Optional cancellation fee
   - Automatic notification to client
   - Updates staff schedule automatically
   - Frees up time slot immediately

**C. Check-In Functionality**

1. **From Coming Appointments**
   - "Coming" section shows next 2 hours of appointments
   - One-tap check-in button
   - Changes status to "Checked-In"
   - Notification sent to assigned staff
   - Moves to Front Desk "Checked-In" column

2. **Early/Late Arrivals**
   - Early arrival flag (different color)
   - Late arrival flag with minutes late
   - Adjust schedule suggestion
   - Notify staff of delay

**D. Availability Management**

1. **Real-Time Availability**
   - Shaded slots = booked
   - Green slots = available
   - Yellow slots = tentatively available (close to break)
   - Red slots = blocked/unavailable
   - Staff break times shown

2. **Smart Scheduling Suggestions**
   - When selecting time slot, system suggests:
     - Best available staff for requested service
     - Alternative times if preferred staff busy
     - Duration conflicts highlighted
   - Double-booking prevention

**E. Quick Actions**

1. **Universal Quick Actions**
   - "+ New Appointment" (floating action button)
   - "Today" quick jump button
   - Date picker for navigation
   - Refresh button (force sync)
   - Filter by staff, service type, status
   - Print today's schedule

2. **Appointment Card Actions** (long-press or swipe)
   - Check-In
   - Edit
   - Cancel
   - No-Show
   - View Client Profile
   - Call Client
   - Text Client

#### 5.1.3 Business Rules

1. **Scheduling Conflicts**
   - Prevent double-booking same staff
   - Warn if client has overlapping appointment
   - Allow manager override with confirmation
   - Log all override actions

2. **Buffer Times**
   - Configurable buffer between appointments (default 10 min)
   - Can be overridden per service type
   - Shown as gray blocks in calendar

3. **Staff Availability**
   - Respects staff schedules from Team & Schedule module
   - Shows breaks, lunch, time off
   - Cannot book during blocked times (unless override)

4. **Appointment Limits**
   - Configurable max appointments per day per staff
   - Warn when approaching limit
   - Show capacity utilization percentage

#### 5.1.4 UI/UX Specifications

**Visual Design:**
- Clean, minimal interface optimized for touch
- Large tap targets (minimum 44x44pt)
- Color-coded status system:
  - **Blue:** Scheduled
  - **Green:** Checked-In
  - **Orange:** In-Service
  - **Purple:** Completed
  - **Red:** Cancelled/No-Show
  - **Gray:** Blocked/Unavailable

**Interactions:**
- Drag-and-drop to reschedule (with confirmation)
- Swipe appointment card for quick actions
- Pull-to-refresh for manual sync
- Long-press for context menu
- Two-finger pinch to zoom timeline (show more/less hours)

**Accessibility:**
- VoiceOver support for all elements
- High contrast mode option
- Large text support
- Color-blind friendly status indicators (icons + color)

#### 5.1.5 Offline Behavior

**Creating Appointments Offline:**
- All data saved to IndexedDB immediately
- Appointment shows "Pending Sync" indicator
- Queued for upload when connection restored
- Conflict resolution on sync (see Section 8.3)

**Viewing Appointments Offline:**
- Today's schedule always cached
- Next 7 days cached
- Can view but not book beyond cached range
- Warning shown when viewing non-cached dates

**Editing/Cancelling Offline:**
- Changes saved locally
- Synced when online
- Client notifications queued

#### 5.1.6 Integration Points

- **Admin Portal:** Pulls staff schedules, break times, service catalog
- **Front Desk Module:** Pushes check-in events, receives status updates
- **Mango Check-In App:** Receives walk-in entries, check-in events
- **Mango Store:** Receives online bookings
- **Client App:** Receives bookings, sends confirmations

#### 5.1.7 Acceptance Criteria

✅ **Must Have (MVP):**
- [ ] Day view calendar with staff columns and time slots
- [ ] Create new appointment with client search
- [ ] Edit existing appointments
- [ ] Check-in appointments from calendar
- [ ] Cancel appointments with reason
- [ ] Mark no-show appointments
- [ ] Drag-and-drop rescheduling
- [ ] View coming appointments (next 2 hours)
- [ ] Real-time status updates from other modules
- [ ] Offline appointment creation and editing
- [ ] Automatic sync when online
- [ ] Color-coded status indicators
- [ ] Staff availability display

✅ **Should Have (Phase 2):**
- [ ] Week and Agenda views
- [ ] Smart scheduling suggestions
- [ ] Recurring appointments
- [ ] Appointment templates
- [ ] Bulk operations (cancel multiple, reschedule multiple)
- [ ] Advanced filtering and search
- [ ] Print schedule

✅ **Nice to Have (Future):**
- [ ] AI-powered optimal scheduling
- [ ] Client preference auto-fill
- [ ] Dynamic pricing display
- [ ] Waitlist auto-booking when cancellation occurs
- [ ] Multi-location view

---

### 5.2 Front Desk Module (Operations Command Center)

#### 5.2.1 Overview
Front Desk is the heart of salon operations, providing real-time visibility into staff status, service progress, and client flow. This is where operational decisions are made and executed.

#### 5.2.2 Core Features

**A. Staff Status Panel**

1. **Staff Card Display**
   Each staff member has a card showing:
   - Name and profile photo
   - Current status (Available, Busy, On Break, Clocked Out)
   - Current client (if in service)
   - Service being performed
   - Time elapsed in current service
   - Turn queue position (if applicable)
   - Next scheduled appointment
   - Clock in/out status
   - Today's service count and revenue

2. **Status Types**
   - 🟢 **Available:** Ready for next client
   - 🔵 **Busy:** Currently in service
   - 🟡 **On Break:** Lunch/break time
   - ⚫ **Clocked Out:** Not working
   - 🔴 **Overdue:** Service running past expected time
   - ⚪ **Off Today:** Not scheduled

3. **Quick Actions from Staff Card**
   - Assign walk-in to staff
   - View staff schedule
   - Clock in/out staff
   - Add manual turn
   - View staff performance (today)
   - Send notification to staff

**B. Turn Queue Tracker**

1. **Queue Display**
   - Ordered list of staff in turn rotation
   - Next-up staff highlighted prominently
   - Last service time shown
   - Service count today
   - Specialty tags (e.g., "Acrylic Expert", "Pedicure Specialist")

2. **Manual Mode Features**
   - Drag-and-drop to reorder queue
   - "+ Add Turn" button to manually assign
   - "Skip" button to move staff to end
   - "Remove from Queue" for staff on break
   - Manual assignment overrides auto-rotation

3. **Auto Mode Features**
   - System auto-assigns based on rules:
     - **Service Type Match:** Staff with matching specialty prioritized
     - **Walk-In vs Appointment:** Appointments go to assigned staff
     - **Rotation Fairness:** Balances service count across staff
     - **Preference Matching:** Client preferences from profile
     - **Last Service Time:** Prioritizes staff with longer idle time
   - Visual indicator showing why staff was selected
   - "Override" button for manager adjustment
   - Learning system improves over time

4. **Turn Rules Configuration**
   - Access via gear icon in Turn Queue header
   - Toggle Manual/Auto mode
   - Set weighting for auto-assignment factors
   - Define specialty priorities
   - Set minimum time between services
   - Save salon-specific turn rules

**C. Active Tickets Board**

1. **Column Layout**
   The board displays tickets in swim lanes by status:

   **Coming (Next 2 Hours)**
   - Scheduled appointments approaching
   - Time until arrival countdown
   - Client name, service, assigned staff
   - "Check-In" button
   - Color: Blue

   **Checked-In (Waiting)**
   - Clients checked in, waiting for service
   - Wait time counter (minutes waiting)
   - Assigned staff status
   - "Start Service" button
   - Color: Green
   - Sorted by wait time (longest first)

   **In-Service**
   - Active service sessions
   - Service duration counter
   - Staff performing service
   - Progress indicator (if multi-step service)
   - "View Ticket" button
   - Color: Orange
   - Sorted by start time

   **Pending Payment**
   - Services completed, awaiting checkout
   - Total amount due
   - Staff who performed service
   - "Checkout" button
   - Color: Purple
   - Sorted by completion time

2. **Ticket Card Information**
   Each ticket card shows:
   - Client name (large, prominent)
   - Client photo (if available)
   - Service(s) listed
   - Staff assigned
   - Status-specific info (wait time, duration, amount)
   - VIP badge (if applicable)
   - Special notes icon (if notes exist)
   - Payment method preferred (if known)

3. **Ticket Actions** (tap or long-press)
   - View full ticket details
   - Edit services
   - Change status
   - Reassign staff
   - Add notes
   - Quick checkout
   - Cancel/void ticket

4. **Drag-and-Drop Status Changes**
   - Drag ticket between columns to change status
   - Confirmation dialog for major changes
   - Updates all devices in real-time
   - Logged for audit trail

**D. Wait List Management**

1. **Wait List Display**
   - Separate section or overlay panel
   - Shows all clients waiting without confirmed staff/time
   - Wait time displayed
   - Client contact info
   - Requested services
   - "Assign Staff" button

2. **Add to Wait List**
   - "+ Add to Wait List" button
   - Quick client search or create new
   - Select requested services
   - Enter estimated wait time
   - Optional notification to client (SMS with wait time)

3. **Start Service from Wait List**
   - Select client from wait list
   - **Option 1:** Start Service Immediately
     - Auto-assigns staff via Turn Queue
     - Creates ticket in "In-Service" status
     - Removes from wait list
   - **Option 2:** Edit Before Starting
     - Opens service editor
     - Confirm/modify services
     - Select staff (manual or auto)
     - Set start time
     - Choose: Start Together or Separately (multi-staff)
   - **Multi-Staff Assignment:**
     - Select multiple staff members
     - **Start Together:** All staff begin simultaneously
     - **Start Separately:** Each staff has individual start time
     - Creates separate service line items per staff
     - Commission automatically split

**E. Quick Actions & Controls**

1. **Global Quick Actions** (toolbar)
   - "+ New Walk-In" (opens wait list add)
   - "Check-In" (opens appointment search)
   - "Quick Checkout" (opens ticket search)
   - Refresh (force sync)
   - Filter by staff
   - View mode toggle (Board/List)

2. **Bulk Operations**
   - Select multiple tickets (multi-select mode)
   - Bulk status change
   - Bulk checkout
   - Bulk cancel

#### 5.2.3 Business Rules

1. **Status Transitions**
   Valid transitions:
   - Coming → Checked-In → In-Service → Pending → Completed
   - Any status → Cancelled (with permission)
   - Cannot move backward without manager override
   - Status changes trigger notifications

2. **Turn Queue Rules**
   - Staff on break automatically removed from queue
   - Clocked-out staff not in queue
   - Staff can only have max 1 active service (configurable)
   - VIP clients can request specific staff (overrides queue)
   - Manager can override any auto-assignment

3. **Wait List Rules**
   - Max wait time alert (configurable, default 30 min)
   - Automatic client notification at thresholds
   - Can't start service without staff assignment
   - Multiple clients can be assigned to same staff if time allows

4. **Ticket Editing Rules**
   - Tickets editable at any status (except Completed)
   - Completed tickets require void/refund process
   - Service changes recalculate price
   - Staff changes update commission tracking

#### 5.2.4 UI/UX Specifications

**Layout:**
- **Top Section:** Staff Status Panel (horizontal scrollable cards)
- **Middle Section:** Turn Queue Tracker (collapsible panel)
- **Main Section:** Active Tickets Board (4-column Kanban layout)
- **Bottom/Side:** Wait List Panel (slide-out drawer)

**Responsive Behavior:**
- iPad Portrait: Stacked layout
- iPad Landscape: Side-by-side optimized (preferred)
- Horizontal scroll for staff cards
- Vertical scroll for ticket columns

**Visual Hierarchy:**
- High contrast between status columns
- Large, readable text for client names
- Wait time counters prominent and color-coded:
  - < 5 min: Green
  - 5-15 min: Yellow
  - 15-30 min: Orange
  - 30+ min: Red (pulsing)

**Real-Time Updates:**
- Smooth animations for status changes
- New tickets slide in from top
- Completed tickets fade out
- Staff status updates with subtle pulse
- Counter increments animate

#### 5.2.5 Offline Behavior

**Fully Offline Capable:**
- All status changes saved locally
- Turn queue operates offline
- Wait list management offline
- Ticket editing offline
- Queued for sync when online

**Sync Conflicts:**
- Last write wins for most operations
- Concurrent ticket edits trigger manual resolution prompt
- Status changes from multiple devices reconciled by timestamp

#### 5.2.6 Integration Points

- **Book Module:** Receives scheduled appointments, syncs check-ins
- **Checkout Module:** Sends pending tickets, receives completed status
- **Mango Check-In App:** Receives walk-ins and self-check-ins
- **Staff Mobile App:** Sends status updates (starting service, completing)
- **Admin Portal:** Pulls staff schedules, pushes configuration changes

#### 5.2.7 Acceptance Criteria

✅ **Must Have (MVP):**
- [ ] Staff status panel with real-time updates
- [ ] Turn queue display (manual mode)
- [ ] Active tickets board with 4 status columns
- [ ] Drag-and-drop status changes
- [ ] Add clients to wait list
- [ ] Start service from wait list (single staff)
- [ ] Check-in from coming appointments
- [ ] Ticket quick view and edit
- [ ] Offline operation with sync queue
- [ ] Real-time multi-device updates

✅ **Should Have (Phase 2):**
- [ ] Auto turn queue mode with smart assignment
- [ ] Multi-staff service assignment
- [ ] Start together vs separately options
- [ ] Wait time alerts and notifications
- [ ] Bulk operations
- [ ] Advanced filtering
- [ ] Performance metrics on staff cards

✅ **Nice to Have (Future):**
- [ ] Predictive wait time estimation
- [ ] AI-powered staff matching
- [ ] Client sentiment tracking
- [ ] Voice commands for hands-free operation
- [ ] Customizable board layout

---

### 5.3 Pending Module (Pre-Checkout Queue)

#### 5.3.1 Overview
The Pending module serves as a holding area for completed services awaiting payment. This prevents checkout bottlenecks and gives staff clarity on which clients are ready to pay.

**Note:** This is an optional workflow step. Salons can configure whether to use Pending or allow direct checkout from any status.

#### 5.3.2 Core Features

**A. Pending Queue Display**

1. **Queue Layout**
   - List or card view of pending tickets
   - Sortable by:
     - Wait time (default, longest first)
     - Amount (highest first)
     - Staff name
     - Client name
     - Service type
   - Filter options:
     - By staff
     - By service type
     - By amount range
     - By date/time

2. **Pending Ticket Card**
   Each card displays:
   - Client name (prominent)
   - Client photo
   - Services performed (list)
   - Staff who performed services
   - Total amount due (large, bold)
   - Time in pending status (counter)
   - Payment preference icon (if known)
   - "Checkout" button (primary action)

3. **Color-Coded Wait Time**
   - < 5 min: White background
   - 5-10 min: Light yellow
   - 10-20 min: Yellow
   - 20+ min: Orange (priority)
   - Visual urgency increases with wait time

**B. Actions**

1. **Primary Action: Checkout**
   - Large "Checkout" button on each card
   - Tap to open checkout flow
   - Quick payment mode for fast processing

2. **Secondary Actions** (swipe or long-press)
   - View full ticket details
   - Edit ticket (add/remove services)
   - Add note
   - Move back to "In-Service" (if changes needed)
   - Remove from queue (if client left)

3. **Bulk Checkout**
   - Select multiple pending tickets
   - Process sequentially or assign to multiple devices
   - Useful during rush periods

**C. Notifications & Alerts**

1. **Staff Notifications**
   - When ticket moves to Pending, assigned staff notified
   - Reminder if pending > 10 minutes
   - Alert if client waiting > 20 minutes

2. **Client Notifications** (optional configuration)
   - SMS when services complete: "Ready for checkout"
   - Estimate wait time if queue is long

**D. Queue Management**

1. **Priority Handling**
   - Pin VIP clients to top of queue
   - Move urgent checkouts up
   - Delay checkout for specific clients (hold ticket)

2. **Remove from Pending**
   - If client needs to leave, can email/text receipt
   - Process payment remotely (via stored payment method)
   - Mark as "Payment Later" with follow-up reminder

#### 5.3.3 Business Rules

1. **Auto-Move to Pending**
   - When staff marks service as "Done" in Front Desk
   - When all services on ticket are completed
   - Configurable: Auto-move or require staff confirmation

2. **Timeout Handling**
   - If ticket pending > 30 min (configurable), alert manager
   - Option to auto-move back to Front Desk if client can't be found
   - Escalation notifications

3. **Skip Pending Option**
   - Salon can disable Pending module entirely
   - Services go directly to Checkout when completed
   - Or staff can quick-checkout from any status

#### 5.3.4 UI/UX Specifications

**Layout Options:**
- **List View:** Compact, shows more tickets
- **Card View:** Larger cards, easier to tap
- **Priority View:** Grouped by urgency

**Interactions:**
- Pull-to-refresh
- Swipe left for quick actions
- Long-press for context menu
- Tap card to expand details
- Tap "Checkout" button to proceed to payment

**Empty State:**
- "All clear! No pending checkouts"
- Show count of completed transactions today
- Link to Transactions module

#### 5.3.5 Offline Behavior

**Offline Operations:**
- View pending tickets (cached)
- Process checkouts offline (saved locally, synced later)
- Ticket edits saved locally
- Status changes queued for sync

**Sync Priority:**
- Pending → Completed transitions are high priority
- Payment data sync critical

#### 5.3.6 Integration Points

- **Front Desk:** Receives tickets marked "Done"
- **Checkout:** Sends tickets when "Checkout" tapped
- **Transactions:** Updates when payment completed

#### 5.3.7 Acceptance Criteria

✅ **Must Have (MVP):**
- [ ] List view of pending tickets
- [ ] Sort by wait time, amount, staff
- [ ] Checkout button opens checkout flow
- [ ] Edit ticket from pending
- [ ] Remove from pending
- [ ] Wait time counter display
- [ ] Color-coded urgency
- [ ] Offline operation
- [ ] Real-time updates

✅ **Should Have (Phase 2):**
- [ ] Card view option
- [ ] Bulk checkout
- [ ] Priority pinning
- [ ] Staff notifications
- [ ] Client wait time SMS
- [ ] Advanced filtering

✅ **Nice to Have (Future):**
- [ ] Estimated checkout time prediction
- [ ] Auto-send receipt if client leaves
- [ ] Queue position tracking for clients

---

### 5.4 Checkout Module (Point of Sale)

#### 5.4.1 Overview
The Checkout module is the point-of-sale (POS) interface where payments are processed, tips are collected, and transactions are completed. This is the final step in the client service journey.

#### 5.4.2 Core Features

**A. Checkout Screen Layout**

**Left Panel: Ticket Summary (60% width)**

1. **Client Information Header**
   - Client name and photo
   - Client loyalty tier/status
   - Contact info (phone, email)
   - Client notes/preferences button

2. **Services Section**
   - List of all services performed
   - Each service shows:
     - Service name
     - Staff who performed it
     - Duration
     - Price
     - Discount (if applied)
   - Subtotal per staff (for commission tracking)
   - "+ Add Service" button (if changes needed)
   - Edit/remove service (swipe or tap)

3. **Products Section** (if applicable)
   - Retail products added to ticket
   - Quantity, unit price, total
   - "+ Add Product" button
   - Inventory integration

4. **Pricing Breakdown**
   - Subtotal (services + products)
   - Discounts applied (with description)
   - Tax (calculated by jurisdiction)
   - **Total Due (large, bold)**

5. **Discounts & Promotions**
   - "Apply Discount" button
   - Manual discount (% or $)
   - Promo code entry
   - Loyalty rewards redemption
   - Package/membership discount auto-applied

**Right Panel: Payment Processing (40% width)**

6. **Payment Method Selection**
   - Large buttons for each method:
     - 💳 **Card** (via Mango Payment)
     - 💵 **Cash**
     - 📱 **Digital Wallet** (Apple Pay, Google Pay)
     - 🎁 **Gift Card**
     - 🔄 **Split Payment**
     - 📝 **Account Credit**
   - Icons and text for clarity

7. **Tip Entry**
   - Prominent tip section
   - Quick-select buttons: 15%, 18%, 20%, 25%
   - Custom tip input ($ or %)
   - "No Tip" option
   - Tip distribution preview (if multi-staff)

8. **Staff Tip Distribution** (for multi-staff services)
   - Shows each staff member
   - Tip amount per staff
   - Options:
     - **Equal Split:** Divide tip evenly
     - **Service-Based:** Proportional to service value
     - **Custom:** Manual entry per staff

9. **Payment Summary**
   - Subtotal
   - Tip
   - **Total to Charge** (large, bold)

10. **Action Buttons**
    - **"Charge [Amount]"** (primary, large button)
    - "Save for Later" (hold ticket)
    - "Cancel" (return to pending/front desk)

**B. Payment Processing Flow**

**Card Payment (Mango Payment Integration):**
1. Staff taps "Card"
2. Enter tip (if applicable)
3. Review total
4. Tap "Charge [Amount]"
5. Payment terminal activates (or card reader on device)
6. Client inserts/taps/swipes card
7. Processing screen
8. Success/failure notification
9. Print/email/SMS receipt options
10. Return to Front Desk or process next

**Cash Payment:**
1. Staff taps "Cash"
2. Enter amount received
3. Calculate change automatically
4. Display change due (large)
5. Tap "Complete Transaction"
6. Open cash drawer (if integrated)
7. Receipt options
8. Update cash on hand tracking

**Split Payment:**
1. Staff taps "Split Payment"
2. Select split method:
   - **By Amount:** Each person pays specific amount
   - **By Percentage:** Each person pays percentage of total
   - **Even Split:** Divide equally among N people
   - **By Service:** Each person pays for their services only
3. Process each payment sequentially
4. Track remaining balance
5. Complete when balance = $0

**Digital Wallet (Apple Pay, Google Pay):**
1. Staff taps "Digital Wallet"
2. Select wallet type
3. Display QR code or activate NFC
4. Client scans or taps device
5. Process payment
6. Confirmation

**Gift Card:**
1. Staff taps "Gift Card"
2. Enter gift card number (manual or scan)
3. Check balance
4. Apply to transaction
5. If balance insufficient, prompt for additional payment method

**Account Credit:**
1. Staff taps "Account Credit"
2. View client's account balance
3. Apply credit to transaction
4. Reduce balance
5. If balance insufficient, prompt for additional payment method

**C. Offline Payment Handling**

**Offline Card Payment:**
- Payment processed locally
- Transaction data stored in IndexedDB
- "Pending Sync" indicator on receipt
- Queued for backend processing when online
- Automatic settlement when connection restored

**Offline Payment Queue:**
- Dashboard shows pending transactions count
- Priority sync for payment data
- Retry logic for failed syncs
- Alert if sync fails after multiple attempts

**Conflict Resolution:**
- If payment already processed by another device, avoid duplicate
- Transaction ID prevents double-charging
- Reconciliation report generated

**D. Receipt Generation**

**Receipt Options:**
1. **Print Receipt**
   - Standard thermal printer
   - Full itemized receipt
   - Business info header
   - QR code for digital copy

2. **Email Receipt**
   - Send to client's email
   - Includes full itemization
   - Link to online receipt portal
   - Promotional footer (optional)

3. **SMS Receipt**
   - Send to client's phone
   - Text summary + link to full receipt
   - Ask for feedback/review link

4. **No Receipt**
   - Option to skip receipt
   - Still saved in transaction history

**Receipt Content:**
- Business name, address, phone
- Date and time
- Transaction ID
- Staff who performed services
- Itemized services and products
- Subtotal, tax, tip, total
- Payment method (last 4 digits if card)
- "Thank you" message
- Rebooking prompt/link
- Social media/review request

**E. Post-Checkout Actions**

**After Successful Payment:**
1. Update ticket status to "Completed"
2. Update staff earnings/commissions
3. Update inventory (if products sold)
4. Update client history
5. Clear ticket from Pending queue
6. Option to:
   - **Book Next Appointment** (quick rebooking)
   - **Checkout Another** (return to Pending)
   - **View Receipt**
   - **Return to Front Desk**

**Failed Payment Handling:**
1. Display error message (clear, non-technical)
2. Options:
   - Retry payment
   - Try different payment method
   - Contact support
   - Save ticket for later
3. Do not complete transaction
4. Keep ticket in Pending
5. Log error for troubleshooting

#### 5.4.3 Business Rules

1. **Pricing Rules**
   - Service prices pulled from catalog
   - Discounts require permission level (configurable)
   - Tax calculated based on jurisdiction and service type
   - Rounding rules (round up to nearest cent)

2. **Tip Rules**
   - Tip optional (configurable per salon)
   - Tip can be added after payment (within time limit)
   - Staff tip pool distribution (if enabled)
   - Tips tracked separately for tax purposes

3. **Payment Method Rules**
   - Card: No limit (subject to merchant account)
   - Cash: Track cash drawer balance
   - Gift Card: Cannot exceed balance
   - Split: Total must equal 100%
   - Refunds processed via original payment method

4. **Discount Rules**
   - Manual discounts require manager approval (if >X%)
   - One promo code per transaction
   - Loyalty discounts auto-applied
   - Discounts cannot reduce price below cost (warning shown)

5. **Multi-Staff Commission**
   - Commission calculated per staff based on service performed
   - Tip distribution follows salon rules (equal, proportional, custom)
   - Staff can view their portion immediately

#### 5.4.4 UI/UX Specifications

**Layout:**
- Two-panel layout (60/40 split)
- Left panel: Ticket details (read-mostly)
- Right panel: Payment actions (interactive)
- Large, touch-friendly buttons
- Numeric keypad for cash amounts and tips

**Visual Design:**
- Clean, uncluttered
- High contrast for readability
- Price displayed large and clear
- Payment buttons color-coded
- Success/error states obvious

**Interactions:**
- Tap to select payment method
- Numeric keypad for custom amounts
- Quick-select buttons for tips
- Swipe gestures for editing line items
- Confirmation dialogs for destructive actions

**Accessibility:**
- VoiceOver support
- Large text mode
- High contrast mode
- Audio feedback for successful payment

**Performance:**
- Checkout screen loads < 500ms
- Payment processing < 3 seconds (online)
- Smooth animations, no lag
- Immediate feedback on user actions

#### 5.4.5 Offline Behavior

**Fully Offline Capable:**
- All payment methods work offline (except card verification)
- Transaction data saved locally
- Receipts generated from cached data
- Automatic sync when online

**Offline Card Payments:**
- Transaction authorized locally
- Stored in pending queue
- Processed when connection restored
- Client notified if issue arises during settlement

**Offline Limitations:**
- Cannot verify gift card balance (use cached data)
- Cannot verify account credit real-time (risk of overdraft)
- Promo codes may need manual verification

#### 5.4.6 Integration Points

- **Mango Payment:** Card processing, digital wallets
- **Inventory Module:** Update stock when products sold
- **Client Module (CRM):** Update purchase history, loyalty points
- **Payroll Module:** Update staff commissions and tips
- **Accounting:** Transaction data for bookkeeping
- **Marketing:** Trigger post-purchase campaigns

#### 5.4.7 Acceptance Criteria

✅ **Must Have (MVP):**
- [ ] Display full ticket summary with services and pricing
- [ ] Accept card payments via Mango Payment integration
- [ ] Accept cash payments with change calculation
- [ ] Tip entry with quick-select percentages
- [ ] Apply manual discounts
- [ ] Generate and print receipts
- [ ] Email receipts
- [ ] SMS receipts
- [ ] Offline payment processing
- [ ] Transaction saved to history
- [ ] Update ticket status to Completed
- [ ] Multi-device sync

✅ **Should Have (Phase 2):**
- [ ] Split payment functionality
- [ ] Digital wallet support (Apple Pay, Google Pay)
- [ ] Gift card redemption
- [ ] Account credit application
- [ ] Multi-staff tip distribution
- [ ] Promo code redemption
- [ ] Loyalty rewards auto-apply
- [ ] Quick rebooking after checkout
- [ ] Add products during checkout
- [ ] Custom receipt templates

✅ **Nice to Have (Future):**
- [ ] Contactless payment terminal integration
- [ ] Automatic tip suggestions based on service quality
- [ ] Voice-activated checkout
- [ ] Barcode scanning for products
- [ ] Custom payment plans
- [ ] Subscription/membership billing integration
- [ ] Real-time inventory alerts during checkout

---

### 5.5 Transactions Module (History & Management)

#### 5.5.1 Overview
The Transactions module provides access to completed transaction history, enabling staff to view past sales, reprint receipts, process refunds, and void transactions. This is the record-keeping and post-transaction management hub.

#### 5.5.2 Core Features

**A. Transaction List View**

1. **Default View: Today's Transactions**
   - Chronological list (newest first)
   - Each transaction card shows:
     - Transaction ID
     - Time
     - Client name
     - Services performed (abbreviated)
     - Total amount
     - Payment method icon
     - Status indicator (Completed, Refunded, Voided)
     - Staff name(s)

2. **List Layout Options**
   - **Compact List:** More transactions visible
   - **Card View:** Larger cards with more detail
   - **Timeline View:** Grouped by hour/time periods

**B. Search & Filter**

1. **Search Functionality**
   - Search by:
     - Client name
     - Transaction ID
     - Staff name
     - Amount (exact or range)
     - Phone number
     - Service type
   - Autocomplete suggestions
   - Recent searches saved

2. **Filter Options**
   - **Date Range:**
     - Today (default)
     - Yesterday
     - Last 7 days
     - Last 30 days
     - Custom date range picker
   - **Payment Method:**
     - Card
     - Cash
     - Digital Wallet
     - Gift Card
     - Split
   - **Staff Member:**
     - All staff (default)
     - Select specific staff
     - Multiple staff selection
   - **Status:**
     - Completed
     - Refunded
     - Voided
     - All statuses
   - **Amount Range:**
     - Under $50
     - $50-$100
     - $100-$200
     - $200+
     - Custom range

3. **Sort Options**
   - Date/Time (newest/oldest)
   - Amount (highest/lowest)
   - Client name (A-Z)
   - Staff name (A-Z)

4. **Saved Filters**
   - Save commonly used filter combinations
   - Quick access to saved filters
   - Examples: "Today's Cash Only", "Last Week High Value"

**C. Transaction Detail View**

**Tapping a transaction opens full details:**

1. **Transaction Header**
   - Transaction ID (large)
   - Status badge (Completed/Refunded/Voided)
   - Date and time
   - Device/location (if multi-location)

2. **Client Information**
   - Name and photo
   - Contact info
   - Link to client profile
   - "Contact Client" button

3. **Services Breakdown**
   - Each service listed with:
     - Service name
     - Staff who performed
     - Duration
     - Price
   - Subtotal

4. **Products** (if applicable)
   - Each product with quantity and price
   - Product subtotal

5. **Payment Information**
   - Payment method
   - Subtotal
   - Discounts applied (with description)
   - Tax amount
   - Tip amount (broken down by staff if multi-staff)
   - **Total paid** (large, bold)
   - Last 4 digits of card (if card payment)
   - Authorization code
   - Payment timestamp

6. **Staff Earnings**
   - Commission per staff
   - Tip per staff
   - Total earnings per staff

7. **Audit Trail**
   - Created by (staff name)
   - Created at (timestamp)
   - Modified by (if edited)
   - Modified at
   - Voided/refunded by (if applicable)
   - Reason for void/refund

**D. Receipt Actions**

1. **Reprint Receipt**
   - Send to connected printer
   - Duplicate of original receipt
   - "Reprinted on [date]" watermark

2. **Email Receipt**
   - Resend to client email
   - Can change recipient address
   - Confirmation message

3. **SMS Receipt**
   - Resend to client phone
   - Can change recipient number
   - Link to digital receipt

4. **View Digital Receipt**
   - Full-screen receipt preview
   - Shareable link
   - QR code for quick access

**E. Void Transaction**

**Purpose:** Cancel a transaction that was processed incorrectly (same day only, typically)

1. **Void Button** (requires permission)
2. **Void Confirmation Dialog:**
   - Shows transaction details
   - Requires reason selection:
     - Processed incorrectly
     - Client dispute
     - Duplicate charge
     - Other (text field)
   - Manager approval (if required by configuration)
3. **Void Processing:**
   - Transaction marked as "Voided"
   - Payment reversed (if possible)
   - Inventory restored (if products sold)
   - Client account credited (if applicable)
   - Staff commission reversed
   - Audit log entry created
4. **Void Confirmation:**
   - Success message
   - Void receipt generated
   - Original receipt marked void

**F. Refund Transaction**

**Purpose:** Return funds to client for completed transaction

1. **Refund Button** (requires permission)
2. **Refund Options:**
   - **Full Refund:** Return entire amount
   - **Partial Refund:** Specify amount or select line items
3. **Refund Dialog:**
   - Shows transaction details
   - Refund amount entry (for partial)
   - Reason selection:
     - Client unsatisfied
     - Service error
     - Price correction
     - Goodwill gesture
     - Other (text field)
   - Manager approval (if required)
4. **Refund Processing:**
   - Process refund via original payment method
   - If cash, note for cash drawer adjustment
   - Update transaction status
   - Create refund record
   - Adjust staff commission
   - Restore inventory (if applicable)
   - Log in audit trail
5. **Refund Confirmation:**
   - Success message
   - Estimated refund time (2-5 business days for cards)
   - Refund receipt generated
   - Client notification option

**G. Transaction Analytics (Quick View)**

**Summary Bar (top of Transactions module):**
- **Today's Totals:**
  - Total transactions count
  - Total revenue
  - Average ticket size
  - Cash vs Card breakdown
  - Tips collected
- **Quick Stats:**
  - Busiest hour
  - Top staff by revenue
  - Most popular service
- **Link to Full Analytics** (Admin Portal)

**H. Batch Operations**

1. **Multi-Select Mode**
   - Tap "Select" to enter multi-select
   - Checkboxes appear on transaction cards
   - Select multiple transactions

2. **Batch Actions:**
   - Export selected (CSV, PDF)
   - Print selected receipts
   - Email selected receipts
   - Mark as reviewed
   - Add batch notes

**I. Export & Reporting**

1. **Export Options:**
   - Date range selection
   - File format: CSV, Excel, PDF
   - Include/exclude columns selection
   - Email export or save to device

2. **Quick Reports:**
   - Daily sales summary
   - Staff performance report
   - Payment method breakdown
   - Service popularity report

#### 5.5.3 Business Rules

1. **Access Permissions**
   - View transactions: All staff (salon mode)
   - Void transaction: Manager only (configurable)
   - Refund transaction: Manager only (configurable)
   - View staff earnings: Manager only
   - Export data: Manager only

2. **Void Rules**
   - Can only void transactions from current business day
   - After midnight, must use refund instead
   - Voided transactions cannot be un-voided
   - Void reason required
   - Manager approval required (if configured)

3. **Refund Rules**
   - Can refund transactions up to 90 days old (configurable)
   - Partial refunds allowed
   - Refunds processed to original payment method
   - Refund reason required
   - Manager approval required over certain amount (configurable)
   - Cash refunds require cash drawer adjustment

4. **Data Retention**
   - Cached transactions: Last 30 days
   - Older transactions: Fetch from server on-demand
   - Deleted transactions: Archived, not permanently deleted
   - Audit trail retained indefinitely

5. **Sync Priority**
   - Void/refund actions: Highest priority sync
   - Transaction views: Normal priority
   - Exports: Low priority (can wait for connection)

#### 5.5.4 UI/UX Specifications

**Layout:**
- Top: Summary bar with quick stats
- Search bar: Prominent, top of list
- Filter bar: Collapsible, below search
- Transaction list: Scrollable, pull-to-refresh
- Detail view: Modal or slide-in panel

**Visual Design:**
- Transaction cards: Clean, scannable
- Status badges color-coded:
  - Green: Completed
  - Blue: Pending
  - Yellow: Refunded
  - Red: Voided
- Amount: Large, bold
- Payment icons: Clear, recognizable

**Interactions:**
- Tap transaction card to view details
- Swipe for quick actions (receipt, refund)
- Pull-down to refresh
- Long-press for multi-select
- Pinch to zoom transaction list

**Empty States:**
- "No transactions yet today"
- "No results found" with filter reset option
- Helpful tips for first-time users

#### 5.5.5 Offline Behavior

**Offline Capabilities:**
- View cached transactions (last 30 days)
- Search/filter cached transactions
- View transaction details
- Reprint receipts (cached data)

**Offline Limitations:**
- Cannot void/refund (requires server connection)
- Cannot export data
- Cannot view transactions older than cache
- Cannot fetch real-time analytics

**Sync Behavior:**
- When online, pull latest transactions
- Push void/refund actions immediately
- Background sync for new transactions
- Conflict resolution for concurrent voids/refunds

#### 5.5.6 Integration Points

- **Admin Portal:** Full transaction history and analytics
- **Payroll Module:** Staff commission data
- **Accounting:** Transaction data export
- **Inventory Module:** Product sales and returns
- **Client Module (CRM):** Purchase history
- **Mango Payment:** Payment processing and refunds

#### 5.5.7 Acceptance Criteria

✅ **Must Have (MVP):**
- [ ] Display list of transactions (today's default)
- [ ] Search transactions by client, staff, ID
- [ ] Filter by date range, payment method, status
- [ ] Sort by date, amount, client, staff
- [ ] View full transaction details
- [ ] Reprint receipt (print, email, SMS)
- [ ] Void transaction (with permission and reason)
- [ ] Refund transaction (full and partial)
- [ ] Transaction status indicators
- [ ] Offline viewing of cached transactions
- [ ] Sync new transactions when online
- [ ] Audit trail display

✅ **Should Have (Phase 2):**
- [ ] Quick analytics summary bar
- [ ] Saved filter presets
- [ ] Batch operations (multi-select)
- [ ] Export transactions (CSV, PDF)
- [ ] Quick reports generation
- [ ] Staff earnings breakdown
- [ ] Payment method breakdown
- [ ] Advanced search with multiple criteria

✅ **Nice to Have (Future):**
- [ ] Visual analytics charts
- [ ] Transaction heatmap (time-based)
- [ ] Predictive search
- [ ] Voice search
- [ ] Anomaly detection (unusual transactions)
- [ ] Automatic reconciliation reports
- [ ] Integration with QuickBooks/Xero
- [ ] Customer sentiment tracking (from feedback)

---

### 5.6 More Menu (Tools & Settings)

#### 5.6.1 Overview
The More menu consolidates less frequently accessed features, settings, administrative tools, and support resources. This keeps the main interface clean while providing easy access to important functionality.

#### 5.6.2 Core Features

**A. Menu Structure**

**More menu organized into sections:**

**Daily Operations**
1. **Today's Sale Summary**
   - Requires manager permission
   - Quick dashboard of today's performance
   - Total revenue, transaction count, average ticket
   - Payment method breakdown
   - Staff performance highlights
   - Hourly sales chart
   - Export option

**Administration**
2. **Admin Backend**
   - Deep link to Mango Biz Admin Portal (web)
   - Opens in default browser
   - Auto-login via SSO
   - Badge shows pending actions/notifications

3. **Team & Schedule**
   - Quick view of staff schedules
   - Clock in/out staff
   - View time-off requests
   - Link to full Team module in Admin Portal

**Technical**
4. **Device Manager**
   - Device registration and status
   - Connected hardware (printer, card reader, etc.)
   - Sync status and queue
   - Network diagnostics
   - Offline mode toggle
   - Clear cache option
   - App version and update check

5. **End of Day**
   - Close register/device
   - Cash reconciliation (if cash drawer)
   - Generate daily summary report
   - Force final sync
   - Print end-of-day report
   - Backup data locally

**Support & Help**
6. **Support**
   - Contact support (opens chat)
   - Submit support ticket
   - View support history
   - Knowledge base search
   - Video tutorials
   - System status page

7. **App Settings**
   - Receipt printer settings
   - Default view preferences
   - Notification settings
   - Language selection
   - Accessibility options
   - Auto-lock timeout
   - Display brightness

**Account**
8. **Account**
   - Salon profile
   - Subscription details
   - Billing information
   - User permissions
   - Logout option

**B. Today's Sale Summary (Detail)**

**Dashboard Screen:**
- **Header:** Date and time range
- **Key Metrics Cards:**
  - Total Revenue (large, prominent)
  - Number of Transactions
  - Average Ticket Size
  - Total Tips Collected
  - Number of Clients Served

- **Sales Breakdown:**
  - **By Payment Method:**
    - Card: $X (Y%)
    - Cash: $X (Y%)
    - Other: $X (Y%)
    - Chart: Pie or bar
  
  - **By Service Category:**
    - Nails: $X (Y%)
    - Hair: $X (Y%)
    - Spa: $X (Y%)
    - Retail: $X (Y%)
    - Chart: Bar chart

  - **By Staff:**
    - List of staff with:
      - Name
      - Services performed (count)
      - Revenue generated
      - Tips earned
      - Sorted by revenue (high to low)

- **Hourly Sales Chart:**
  - Line or bar chart
  - X-axis: Hours of operation
  - Y-axis: Revenue
  - Highlights peak hours

- **Actions:**
  - Refresh (pull latest data)
  - Export report (PDF, CSV)
  - Print summary
  - View in Admin Portal (full analytics)

**C. Device Manager (Detail)**

**Device Information:**
- Device name (editable)
- Device type (iPad Pro, iPad, etc.)
- OS version
- App version
- Unique device ID
- Last sync time
- Storage used / available

**Connected Hardware:**
- **Receipt Printer:**
  - Status: Connected / Disconnected
  - Model name
  - IP address (if network printer)
  - Test print button
  - Configure button

- **Card Reader:**
  - Status: Connected / Disconnected
  - Model name
  - Battery level (if wireless)
  - Test connection button
  - Configure button

- **Cash Drawer:**
  - Status: Connected / Disconnected
  - Open drawer button (test)

**Sync Status:**
- Online / Offline indicator
- Last successful sync timestamp
- Pending operations count
- Sync queue details (expandable)
- Force sync button
- View sync log

**Network Diagnostics:**
- WiFi status and strength
- Internet connectivity test
- API server reachability
- Latency measurement
- Ping test button

**Maintenance:**
- Clear cache (confirm dialog)
- Reset app settings
- Reinstall app (link to App Store)
- Diagnostic mode (for support)

**D. End of Day Process (Detail)**

**End of Day Wizard:**

**Step 1: Pre-Check**
- System checks:
  - Any open tickets? (list shown)
  - Pending syncs? (count shown)
  - Unprocessed payments? (count shown)
- Warning if issues found
- Option to force close or resolve issues first

**Step 2: Cash Reconciliation** (if cash drawer used)
- Expected cash: $XXX (calculated from transactions)
- Counted cash input field
- Variance calculation (over/short)
- Variance reason entry (if over $X threshold)
- Confirmation of count

**Step 3: Sales Summary**
- Display Today's Sale Summary (from above)
- Final check before closing

**Step 4: Reports**
- Generate reports:
  - [ ] Daily Sales Report
  - [ ] Staff Commission Report
  - [ ] Payment Summary
  - [ ] Inventory Sold Report
- Select reports to generate
- Print / Email / Save options

**Step 5: Final Sync**
- Force sync all pending data
- Progress indicator
- "Sync complete" confirmation

**Step 6: Close Register**
- Confirmation dialog
- "Are you sure you want to close the register?"
- Logs out all staff (if configured)
- Sets device to "Closed" state
- Success message

**Post-Close Actions:**
- Print end-of-day summary
- Email reports to manager
- Lock device (require login to reopen)

**E. Support (Detail)**

**Support Options:**

1. **Live Chat**
   - Opens chat widget
   - Real-time conversation with support
   - Attach screenshots
   - Share diagnostic info

2. **Submit Ticket**
   - Form with fields:
     - Issue category (dropdown)
     - Priority (Low, Medium, High, Urgent)
     - Subject
     - Description
     - Attach screenshots
   - Auto-includes device info
   - Confirmation and ticket number

3. **View Tickets**
   - List of open tickets
   - Ticket status (Open, In Progress, Resolved)
   - View ticket details
   - Add comments to tickets

4. **Knowledge Base**
   - Search bar
   - Categories:
     - Getting Started
     - Scheduling & Booking
     - Checkout & Payments
     - Troubleshooting
     - FAQs
   - Articles with step-by-step guides
   - Video tutorials

5. **Video Tutorials**
   - Embedded videos
   - Topics:
     - Setting up Store App
     - Processing checkouts
     - Managing turn queue
     - End of day process
     - Troubleshooting common issues

6. **System Status**
   - Real-time status page
   - Shows health of:
     - Mango Biz backend
     - Payment gateway
     - SMS service
     - Email service
   - Incident history

**F. App Settings (Detail)**

**Receipt Settings:**
- Default receipt method (Print/Email/SMS/None)
- Printer selection (if multiple)
- Receipt template customization
- Include logo toggle
- Include promotional footer toggle

**Display & Behavior:**
- Default landing screen (Front Desk or Book)
- Theme: Light / Dark / Auto
- Color scheme (if customizable)
- Animation speed
- Auto-refresh interval

**Notifications:**
- Enable/disable notifications
- Notification sound
- Vibration toggle
- Specific notification types:
  - New walk-in
  - Client checked in
  - Service complete
  - Payment received
  - Low inventory alerts

**Language:**
- Select app language
- English, Spanish, Vietnamese, etc.

**Accessibility:**
- Large text size
- High contrast mode
- Reduce motion
- VoiceOver settings

**Security:**
- Auto-lock timeout (1, 5, 10, 30 min, Never)
- Require passcode to reopen
- Logout on device sleep

**Data & Storage:**
- View storage usage
- Clear cached data
- Offline data retention period

**Advanced:**
- Developer mode (for debugging)
- Show sync logs
- API endpoint override (for testing)

#### 5.6.3 Business Rules

1. **Permission Levels**
   - Today's Sale: Manager only
   - Admin Backend: Manager only
   - Team & Schedule: Manager or assigned staff
   - Device Manager: All staff
   - End of Day: Manager only
   - Support: All staff
   - App Settings: All staff (some settings manager-only)
   - Account: Manager only

2. **End of Day Rules**
   - Cannot close if open tickets exist (warning, but can force)
   - Cannot close if pending syncs (must wait or force)
   - Cash variance > $X requires manager approval
   - Auto-logout all staff after close (configurable)

3. **Device Manager Rules**
   - Cannot delete device while registered
   - Force sync requires confirmation
   - Clear cache warns of data loss

#### 5.6.4 UI/UX Specifications

**Layout:**
- Grouped list menu
- Section headers
- Icons for each menu item
- Badge indicators (e.g., pending tickets, unread notifications)

**Visual Design:**
- Clean, organized
- Consistent iconography
- Subtle dividers between sections
- Tappable cards or list items

**Interactions:**
- Tap item to navigate
- Swipe back to return to More menu
- Search bar at top (for finding settings)

#### 5.6.5 Offline Behavior

**Offline Access:**
- Today's Sale: View cached data, no real-time updates
- Admin Backend: Requires connection (gray out if offline)
- Team & Schedule: View cached schedules
- Device Manager: Limited functionality, no sync
- End of Day: Cannot complete offline (requires sync)
- Support: Cannot submit tickets, can view cached articles
- App Settings: Full access

#### 5.6.6 Integration Points

- **Admin Portal:** Links to various modules
- **Support System:** Ticket creation and management
- **Device Management Service:** Registration and configuration
- **Analytics Backend:** Today's Sale data

#### 5.6.7 Acceptance Criteria

✅ **Must Have (MVP):**
- [ ] Today's Sale Summary (with permission check)
- [ ] Link to Admin Backend
- [ ] Device Manager with sync status
- [ ] End of Day process with cash reconciliation
- [ ] Support chat and ticket submission
- [ ] App Settings for receipt and display preferences
- [ ] Account information and logout

✅ **Should Have (Phase 2):**
- [ ] Team & Schedule quick view
- [ ] Video tutorials in Support
- [ ] Knowledge base search
- [ ] Advanced device diagnostics
- [ ] Customizable receipt templates
- [ ] Notification preferences

✅ **Nice to Have (Future):**
- [ ] In-app update notifications
- [ ] Remote device management (IT admin)
- [ ] A/B test settings
- [ ] Usage analytics dashboard
- [ ] Guided tours for new features

---

## 6. Global Features

### 6.1 Universal Search

#### 6.1.1 Overview
Universal Search provides instant access to clients, appointments, transactions, and staff information from anywhere in the app.

#### 6.1.2 Implementation
**Search Bar Location:**
- Persistent search icon in top navigation bar
- Tap to expand search overlay
- Or: Pull down from top of screen to reveal search

**Search Scope:**
- **Clients:** Name, phone, email
- **Appointments:** Today's and upcoming
- **Transactions:** Recent transactions, transaction ID
- **Staff:** Staff names
- **Services:** Service names
- **Tickets:** Active ticket numbers

**Search Results:**
- Grouped by type (Clients, Appointments, Transactions, etc.)
- Show top 3 results per category
- "See all" link for each category
- Tap result to navigate directly

**Quick Actions from Results:**
- Client result: View profile, Call, Text, Book appointment
- Appointment result: View details, Check-in, Edit
- Transaction result: View receipt, Refund, Reprint
- Ticket result: Open ticket, Checkout

#### 6.1.3 Search Intelligence
- Recent searches saved
- Popular searches suggested
- Typo tolerance and fuzzy matching
- Search by partial phone number
- Search by last 4 digits of card

#### 6.1.4 Offline Behavior
- Searches cached data only
- Clear indicator when offline
- Some results may be incomplete

---

### 6.2 Notification Center

#### 6.2.1 Overview
The Notification Center keeps staff informed of important events, alerts, and updates in real-time.

#### 6.2.2 Notification Types

**Operational Notifications:**
1. **Appointment Reminders**
   - 15 minutes before appointment
   - Shows client name, service, staff
   - Quick "Check-In" action

2. **Client Arrivals**
   - When client checks in (via app or kiosk)
   - Notifies assigned staff
   - Shows wait time if in queue

3. **Service Completion**
   - When staff marks service complete
   - Notifies front desk for checkout
   - Moves ticket to Pending

4. **Long Wait Alerts**
   - Client waiting > 15 minutes
   - Client pending checkout > 10 minutes
   - Priority escalation

5. **No-Show Alerts**
   - Client 15+ min late for appointment
   - Suggest mark as no-show
   - Free up time slot notification

**System Notifications:**
6. **Sync Status**
   - Offline mode activated
   - Online mode restored
   - Sync completed / failed
   - Pending operations count

7. **Device Issues**
   - Printer offline
   - Card reader disconnected
   - Low battery warning
   - Storage space low

8. **Staff Updates**
   - Staff clocked in/out
   - Staff on break
   - Staff schedule changes

9. **Business Alerts**
   - Low inventory items
   - End of day reminder
   - Appointment cancellations
   - Payment failures

#### 6.2.3 Notification UI

**Notification Bell Icon:**
- Located in top-right corner
- Badge shows unread count
- Tap to open notification panel

**Notification Panel:**
- Slide-in from right
- List of notifications (newest first)
- Each notification shows:
  - Type icon
  - Title
  - Description
  - Timestamp
  - Quick action button(s)
- Swipe to dismiss
- "Clear All" button
- Filter by type

**In-App Notifications:**
- Toast/banner at top of screen
- Auto-dismiss after 5 seconds
- Tap to view details or take action
- Color-coded by priority:
  - Red: Urgent
  - Orange: Important
  - Blue: Info
  - Green: Success

**Notification Sounds:**
- Configurable per notification type
- Volume control
- Silent mode option

#### 6.2.4 Notification Management
**Settings:**
- Enable/disable per notification type
- Set quiet hours (no notifications)
- Vibration on/off
- Preview in lock screen

**Do Not Disturb Mode:**
- Toggle in notification center
- Suppresses all notifications except urgent
- Visual indicator when active

---

### 6.3 Device Status Indicator

#### 6.3.1 Overview
The Device Status Indicator provides at-a-glance visibility into connection status, sync state, and system health.

#### 6.3.2 Status Bar Elements

**Connection Status (Top-Left):**
- **Online:** 🟢 Green dot + "Online"
- **Offline:** 🔴 Red dot + "Offline Mode"
- **Syncing:** 🔵 Blue pulsing + "Syncing..."
- **Connection Issues:** 🟡 Yellow + "Limited Connection"

**Sync Queue (Top-Center):**
- Shows pending operations count when > 0
- Example: "3 pending actions"
- Tap to view sync queue details
- Progress bar during active sync

**Device Health (Top-Right):**
- Battery level (if applicable)
- Storage space indicator (if low)
- Temperature warning (if overheating)

#### 6.3.3 Quick Reconnect Action

**When Offline:**
- "Reconnect" button in status bar
- Tap to attempt reconnection
- Shows connection troubleshooting steps if fails:
  - Check WiFi/cellular connection
  - Restart app
  - Contact support

**Sync Status Details:**
- Tap status indicator to view:
  - Last successful sync time
  - Pending operations list
  - Failed sync attempts
  - Retry failed syncs button

---

### 6.4 Support Chat Bubble

#### 6.4.1 Overview
Persistent access to support via chat bubble ensures help is always one tap away.

#### 6.4.2 Implementation

**Chat Bubble:**
- Floating button in bottom-right corner
- Blue circle with chat icon
- Badge shows unread support messages
- Draggable to different positions (stays visible across screens)

**Chat Window:**
- Tap bubble to open chat overlay
- Full-screen chat interface
- Real-time messaging with support agents
- Chat history persisted

**Chat Features:**
- Text messages
- Attach screenshots (automatic screen capture option)
- Share device diagnostics
- Quick replies for common questions
- Chat transcript email

**Offline Behavior:**
- Message queuing when offline
- Delivered when online
- Indicator shows "Will send when online"

---

### 6.5 Contextual Tooltips & Help

#### 6.5.1 Overview
Tooltips and guided help reduce learning curve and improve feature discovery.

#### 6.5.2 Tooltip System

**First-Time User Experience:**
- Guided tour on first launch
- Highlights key features
- Step-by-step walkthrough
- Skip option available

**Contextual Help:**
- "?" icons next to complex features
- Tap to view explanation overlay
- Shows tips and best practices
- Links to related help articles

**Feature Announcements:**
- Modal overlay for new features
- "What's New" badge on updated features
- Dismissible, but can re-access from Help menu

**Smart Hints:**
- Appear after user struggles with action
- Example: User taps wrong button 3 times → Show hint
- Non-intrusive, dismissible

---

### 6.6 User Session Management

#### 6.6.1 Overview
Manages user authentication, role switching, and session security for Salon Mode.

#### 6.6.2 Login & Authentication

**Initial Login:**
- Salon credentials (email + password)
- Biometric authentication option (Face ID, Touch ID)
- Remember device option
- Auto-login on app open (if enabled)

**Session Display:**
- User indicator in top-left: "Salon Mode" or salon name
- Shows logged-in duration
- Quick logout option

**Auto-Lock:**
- Configurable timeout (1, 5, 10, 30 min)
- Requires re-authentication to unlock
- Does not interrupt active transactions

#### 6.6.3 Role Switching

**Quick Switch (Future Feature):**
- Staff can temporarily log in for their view
- "Switch to Staff Mode" option
- Requires staff credentials
- Returns to Salon Mode after timeout or manual switch

**Multi-User Support:**
- Multiple staff can use same device
- Each action logged to user
- Audit trail tracks who did what

---

### 6.7 Offline Mode Management

#### 6.7.1 Overview
Comprehensive offline functionality ensures business continuity during connectivity issues.

#### 6.7.2 Offline Detection

**Automatic Detection:**
- Monitors network connection continuously
- Detects internet loss immediately
- Shows "Offline Mode" indicator
- Graceful degradation (no errors, just limited features)

**Manual Override:**
- Force offline mode (for testing)
- Toggle in Device Manager

#### 6.7.3 Offline Capabilities Matrix

| Feature | Offline Capability |
|---------|-------------------|
| Book appointments | ✅ Full |
| Check-in clients | ✅ Full |
| View Front Desk | ✅ Full |
| Manage wait list | ✅ Full |
| Edit tickets | ✅ Full |
| Process checkout (card) | ✅ Queued for settlement |
| Process checkout (cash) | ✅ Full |
| View transactions | ✅ Cached only |
| Reprint receipts | ✅ Full |
| Void/Refund | ❌ Requires online |
| Universal search | ⚠️ Limited to cache |
| Today's Sale | ⚠️ Last synced data |
| Admin Backend | ❌ Requires online |

#### 6.7.4 Sync Queue Management

**Pending Operations Display:**
- Queue icon shows pending count
- Tap to view queue details
- Operations listed with:
  - Type (Booking, Payment, Edit, etc.)
  - Timestamp
  - Status (Pending, Failed, Retrying)
  - Action to cancel (if needed)

**Sync Priority:**
1. Payment transactions (critical)
2. Ticket status changes
3. Appointments created/edited
4. Client updates
5. Other changes

**Sync Conflict Resolution:**
- Server timestamp wins for most conflicts
- User prompted for manual resolution if critical
- Conflicting bookings flagged for review
- Audit log of all conflict resolutions

---

## 7. User Flows

### 7.1 Walk-In Client Flow

**Scenario:** Walk-in client arrives at salon, no appointment

**Flow:**

1. **Entry Point: Mango Check-In Kiosk**
   - Client taps "Walk-In" on kiosk
   - Enters name and phone number
   - Selects services from menu
   - Confirms and submits
   - Receives "Added to wait list" confirmation
   - Shown estimated wait time

2. **Store App Receives Walk-In**
   - Notification appears: "New walk-in: [Client Name]"
   - Client added to Wait List in Front Desk module
   - Shows requested services

3. **Staff Assignment via Turn Queue**
   - **Auto Mode:** System checks turn queue
     - Analyzes requested service (e.g., Gel Manicure)
     - Finds next available staff with matching specialty
     - Assigns to staff (e.g., Jenny)
   - **Manual Mode:** Front desk staff:
     - Views turn queue
     - Selects appropriate staff
     - Assigns manually

4. **Notification to Assigned Staff**
   - Jenny's mobile device (if using Staff Mode) receives alert
   - Or: Jenny sees assignment on Front Desk board
   - "New client assigned: [Client Name] - Gel Manicure"

5. **Start Service**
   - Front desk or Jenny taps "Start Service" on wait list item
   - Service editor opens:
     - Confirms services
     - Can add/remove services
     - Sets actual start time
   - Tap "Start"
   - Ticket created, status: "In-Service"
   - Client moves from Wait List to In-Service column

6. **Service in Progress**
   - Ticket visible in In-Service column
   - Duration counter runs
   - Jenny can edit ticket if needed (add services, add products)

7. **Service Complete**
   - Jenny taps "Done" on ticket (from her device or Front Desk)
   - Ticket moves to "Pending Payment"
   - Front desk notified: "Client ready for checkout"

8. **Checkout**
   - Front desk taps ticket in Pending queue
   - Opens Checkout module
   - Reviews services and total
   - Client selects payment method: Card
   - Adds tip: 20%
   - Processes payment
   - Receipt: Print + SMS

9. **Transaction Complete**
   - Ticket status: Completed
   - Removed from Pending queue
   - Transaction added to history
   - Jenny's earnings updated
   - Client thanked and exits

---

### 7.2 Scheduled Appointment Flow

**Scenario:** Client has pre-scheduled appointment arriving soon

**Flow:**

1. **Appointment Appears in "Coming" (2 Hours Before)**
   - Book module shows appointment in today's calendar
   - Front Desk "Coming" column shows appointment
   - Assigned staff (e.g., Mike) can see on their schedule

2. **Client Arrival**
   - Client arrives at salon (on-time or early/late)
   - **Option A: Self Check-In**
     - Client uses Check-In kiosk
     - Enters phone number or name
     - System finds appointment
     - Client taps "Check-In"
   - **Option B: Staff Check-In**
     - Front desk sees client arrive
     - Taps "Check-In" button on appointment card
     - Confirms identity

3. **Check-In Notification**
   - Appointment moves from "Coming" to "Checked-In" column
   - Mike receives notification: "[Client] checked in for 2:00 PM appointment"
   - Shows client is waiting

4. **Service Start**
   - When Mike is ready, taps "Start Service" on ticket
   - Confirms services (can edit if needed)
   - Ticket moves to "In-Service"
   - Start time logged

5. **Service in Progress**
   - Duration counter runs
   - Mike can add services or products to ticket

6. **Service Complete → Checkout**
   - (Same as walk-in flow, steps 7-9)

---

### 7.3 Multi-Staff Service Flow

**Scenario:** Client wants multiple services from different staff (e.g., hair + nails)

**Flow:**

1. **Client Added to Wait List**
   - Walk-in or scheduled appointment
   - Services selected: 
     - Haircut (Staff A)
     - Gel Manicure (Staff B)

2. **Multi-Staff Assignment**
   - Front desk taps "Start Service from Wait List"
   - Service editor shows both services
   - Tap "Assign Staff"
   - Selects Staff A for Haircut
   - Selects Staff B for Gel Manicure
   - Choose option:
     - **Start Together:** Both staff begin simultaneously
     - **Start Separately:** Sequential services

3. **If Start Together:**
   - Ticket moves to "In-Service"
   - Both Staff A and Staff B see ticket assigned to them
   - Each staff tracks their service independently
   - Ticket shows both services in progress

4. **Service Completion (Multi-Staff):**
   - Staff A completes Haircut, marks "Done"
   - Ticket still shows "In-Service" (Staff B still working)
   - Staff B completes Gel Manicure, marks "Done"
   - All services now complete → Ticket moves to "Pending"

5. **Checkout with Multi-Staff Tips:**
   - Front desk opens checkout
   - Total shows both services
   - Client adds tip: $30
   - Choose tip distribution:
     - **Equal Split:** $15 each
     - **Service-Based:** Proportional (Haircut 60%, Nails 40%)
     - **Custom:** Manual entry
   - Process payment
   - Commission and tips calculated per staff
   - Each staff sees their earnings updated

---

### 7.4 Edit Service Mid-Session Flow

**Scenario:** Client requests additional service while in-service

**Flow:**

1. **Client in Service**
   - Ticket in "In-Service" column
   - Staff performing original service

2. **Client Requests Add-On**
   - Client: "Can you also add eyebrow wax?"

3. **Staff/Front Desk Edits Ticket**
   - Tap on active ticket in Front Desk
   - Ticket detail editor opens
   - Tap "+ Add Service"
   - Select "Eyebrow Wax"
   - Assign staff (same staff or different)
   - Save changes

4. **Ticket Updated**
   - New service added to ticket
   - Price recalculated automatically
   - Service duration extended (if relevant)
   - All devices sync update in real-time

5. **Service Continues**
   - Staff completes all services
   - Marks "Done"
   - Ticket moves to Pending with updated total

---

### 7.5 Quick Checkout (Skip Pending) Flow

**Scenario:** Client in a hurry, wants immediate checkout

**Flow:**

1. **Service Completion**
   - Staff marks service "Done"
   - Normally would move to Pending

2. **Front Desk Decides Quick Checkout**
   - Instead of letting ticket move to Pending
   - Front desk taps ticket
   - Selects "Checkout Now" from context menu

3. **Immediate Checkout**
   - Checkout module opens
   - Processes payment immediately
   - Skips Pending queue entirely

4. **Alternative: Checkout from Any Status**
   - Can checkout from "In-Service" if needed
   - Tap ticket, select "Checkout"
   - Confirmation: "Service may not be complete. Proceed?"
   - Process payment

---

### 7.6 Turn Queue Management Flow

#### Manual Mode:

**Scenario:** Salon prefers manual control of turn assignments

**Flow:**

1. **Turn Queue Panel Open**
   - Front Desk shows Turn Queue
   - Staff listed in order: Amy, Beth, Carlos, Diana

2. **Walk-In Arrives**
   - Client on wait list
   - Front desk ready to assign

3. **Manual Assignment**
   - Front desk reviews turn queue
   - Next up: Amy
   - But client requests "someone good at acrylic"
   - Front desk checks: Beth is acrylic specialist
   - Override turn queue, assign to Beth

4. **Turn Queue Updates**
   - Beth moved to end of queue
   - Amy remains next in line for next walk-in

5. **Manual Adjustments**
   - Front desk can drag-drop to reorder
   - Can add manual "turn" to specific staff
   - Can remove staff from queue (break, busy)

#### Auto Mode:

**Scenario:** Salon uses AI-powered turn assignments

**Flow:**

1. **Walk-In Arrives**
   - Client requests "Acrylic Full Set"

2. **Auto Assignment Logic Runs**
   - System checks:
     - ✅ Service type: Acrylic (specialty match required)
     - ✅ Staff skills: Amy (Acrylic Expert), Carlos (Acrylic Expert)
     - ✅ Current availability: Both available
     - ✅ Last service time: Amy (15 min ago), Carlos (5 min ago)
     - ✅ Service count today: Amy (6), Carlos (5)
   - **Decision:** Assign to Carlos (lower service count today)

3. **Assignment Executed**
   - Carlos auto-assigned
   - Notification sent to Carlos
   - Turn queue updates, Carlos moved to end

4. **Manager Override Option**
   - If manager disagrees, can reassign manually
   - System learns from overrides

---

### 7.7 Offline Operation Flow

**Scenario:** Internet outage during business hours

**Flow:**

1. **Connection Lost**
   - Store App detects loss of internet
   - Status indicator changes: "Offline Mode"
   - Toast notification: "You're offline. Operations will continue normally."

2. **Continue Operations (Offline)**
   - Front desk books new appointment
     - Saved to local IndexedDB
     - Marked "Pending Sync"
   - Client checks in
     - Status changed locally
   - Staff processes checkout
     - Payment (card) processed locally, queued for settlement
     - Receipt printed from cached data
   - All changes saved locally

3. **Sync Queue Builds Up**
   - Device shows "5 pending operations"
   - Operations queued in priority order

4. **Connection Restored**
   - Store App detects internet restored
   - Status indicator: "Syncing..."
   - Background sync starts automatically

5. **Sync Process**
   - High priority first: Payments
   - Then: Ticket status changes
   - Then: Appointments
   - Then: Other changes

6. **Sync Conflicts (if any)**
   - Example: Another device changed same appointment
   - Conflict resolution modal appears
   - Shows both versions
   - Manager selects which to keep
   - Or: Auto-resolution by timestamp

7. **Sync Complete**
   - Status indicator: "Online"
   - Confirmation: "All changes synced successfully"
   - Operations back to normal

---

### 7.8 End of Day Process Flow

**Scenario:** Closing salon for the day

**Flow:**

1. **Manager Opens More Menu**
   - Taps "End of Day"
   - End of Day wizard launches

2. **Pre-Check Step**
   - System scans:
     - Open tickets: 1 found (Alert shown)
     - Pending syncs: 0
     - Unprocessed payments: 0
   - Manager must resolve open ticket before continuing
   - Completes final checkout

3. **Cash Reconciliation Step** (if applicable)
   - System calculates expected cash: $485.00
   - Manager counts cash drawer
   - Enters counted amount: $490.00
   - Variance: +$5.00 (over)
   - Manager enters reason: "Tip paid in cash"
   - Confirms count

4. **Sales Summary Review**
   - Today's Sale dashboard displayed:
     - Total revenue: $2,340
     - Transaction count: 47
     - Average ticket: $49.79
     - Payment methods breakdown
     - Staff performance
   - Manager reviews, confirms accurate

5. **Generate Reports**
   - Select reports to generate:
     - [x] Daily Sales Report
     - [x] Staff Commission Report
     - [ ] Payment Summary (skipped)
     - [x] Inventory Sold Report
   - Tap "Generate Reports"
   - Reports generated (PDF)

6. **Final Sync**
   - System initiates final sync
   - All pending data uploaded
   - Progress bar shows sync status
   - Confirmation: "Sync complete"

7. **Close Register**
   - Confirmation dialog: "Close register and log out all staff?"
   - Manager taps "Confirm"
   - Register closed
   - All active sessions logged out
   - Device locked

8. **Post-Close**
   - Print end-of-day summary automatically
   - Email reports to manager
   - Lock screen shows: "Register closed. Reopen tomorrow."

---

## 8. Technical Architecture

### 8.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    STORE APP (iPad/Tablet)                  │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer (React + TypeScript)                    │
│  • Book Module UI       • Checkout Module UI                │
│  • Front Desk Module UI • Transactions Module UI            │
│  • Pending Module UI    • More Menu UI                      │
│  • Global Components (Search, Notifications, etc.)          │
├─────────────────────────────────────────────────────────────┤
│  State Management (Redux + Redux Toolkit)                   │
│  • Appointments State   • Tickets State                     │
│  • Staff State          • Sync Queue State                  │
│  • User Session State   • Settings State                    │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                       │
│  • Turn Queue Engine    • Payment Processing Logic          │
│  • Pricing Calculator   • Commission Calculator             │
│  • Sync Conflict Resolver                                   │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  • IndexedDB (Dexie.js) - Offline Storage                   │
│    - Appointments Table  - Transactions Table               │
│    - Tickets Table       - Clients Table                    │
│    - Staff Table         - Services Table                   │
│    - Sync Queue Table    - Settings Table                   │
│  • Service Workers - Background Sync                        │
├─────────────────────────────────────────────────────────────┤
│  Network Layer                                              │
│  • REST API Client (Axios)                                  │
│  • WebSocket Client (Socket.io) - Real-time updates         │
│  • Offline Queue Manager                                    │
│  • Retry Logic with Exponential Backoff                     │
├─────────────────────────────────────────────────────────────┤
│  Integration Layer                                          │
│  • Mango Payment SDK - Card processing                      │
│  • Printer Driver - Receipt printing                        │
│  • Push Notification Handler                                │
└─────────────────────────────────────────────────────────────┘
                              ↕
                       HTTPS / WSS
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    MANGO BIZ BACKEND                        │
├─────────────────────────────────────────────────────────────┤
│  API Gateway (Node.js + Express)                            │
│  • REST API Endpoints                                       │
│  • Authentication Middleware (JWT)                          │
│  • Rate Limiting                                            │
│  • Request Validation                                       │
├─────────────────────────────────────────────────────────────┤
│  WebSocket Server (Socket.io)                               │
│  • Real-time event broadcasting                             │
│  • Device session management                                │
│  • Multi-device coordination                                │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Services                                    │
│  • Appointment Service  • Transaction Service               │
│  • Staff Service        • Payment Service                   │
│  • Notification Service • Sync Service                      │
├─────────────────────────────────────────────────────────────┤
│  Data Access Layer (Prisma ORM)                             │
│  • SQL Server Express (Primary Database)                    │
│  • Redis (Caching & Session Store)                          │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Technology Stack

**Frontend (Store App):**
- **Framework:** React 18+ with TypeScript
- **State Management:** Redux Toolkit
- **Routing:** React Router
- **UI Library:** Tailwind CSS + Custom Components
- **Local Storage:** IndexedDB (via Dexie.js)
- **Offline Support:** Service Workers + Workbox
- **Real-time:** Socket.io Client
- **Forms:** React Hook Form + Zod validation
- **Date/Time:** Day.js
- **API Client:** Axios

**Backend:**
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** SQL Server Express
- **Cache:** Redis
- **Real-time:** Socket.io
- **Authentication:** JWT + Passport.js
- **API Documentation:** Swagger/OpenAPI

**Infrastructure:**
- **Hosting:** AWS / Azure
- **CDN:** CloudFront
- **File Storage:** S3
- **Monitoring:** DataDog / New Relic
- **Logging:** Winston + CloudWatch

### 8.3 Data Models

#### 8.3.1 Core Entities

**Appointment:**
```typescript
interface Appointment {
  id: string;                    // UUID
  salonId: string;               // FK to Salon
  clientId: string;              // FK to Client
  staffId: string;               // FK to Staff (primary)
  services: AppointmentService[]; // Array of services
  status: AppointmentStatus;     // Enum
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  checkInTime?: Date;
  notes?: string;
  source: BookingSource;         // Phone, Walk-In, Online, etc.
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;             // User ID
  lastModifiedBy: string;
  syncStatus: SyncStatus;        // Local, Synced, Pending, Conflict
}

type AppointmentStatus = 
  | 'Scheduled'
  | 'Checked-In' 
  | 'Waiting'
  | 'In-Service'
  | 'Completed'
  | 'Cancelled'
  | 'No-Show';

type BookingSource = 
  | 'Phone'
  | 'Walk-In'
  | 'Online'
  | 'Mango Store'
  | 'Client App'
  | 'Admin Portal';
```

**Ticket:**
```typescript
interface Ticket {
  id: string;                    // UUID
  salonId: string;
  appointmentId?: string;        // FK if from appointment
  clientId: string;
  services: TicketService[];     // Services performed
  products: TicketProduct[];     // Products sold
  status: TicketStatus;
  subtotal: number;
  discount: number;
  discountReason?: string;
  tax: number;
  tip: number;
  total: number;
  payments: Payment[];           // Can have multiple (split)
  createdAt: Date;
  completedAt?: Date;
  createdBy: string;
  syncStatus: SyncStatus;
}

interface TicketService {
  serviceId: string;             // FK to Service catalog
  staffId: string;               // Who performed it
  price: number;
  duration: number;              // minutes
  commission: number;            // For staff
  startTime: Date;
  endTime?: Date;
}

type TicketStatus = 
  | 'In-Service'
  | 'Pending'
  | 'Completed'
  | 'Voided'
  | 'Refunded';
```

**Transaction:**
```typescript
interface Transaction {
  id: string;                    // UUID
  salonId: string;
  ticketId: string;              // FK to Ticket
  clientId: string;
  amount: number;
  tip: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails; // Card last4, etc.
  status: TransactionStatus;
  createdAt: Date;
  processedAt?: Date;
  voidedAt?: Date;
  voidedBy?: string;
  voidReason?: string;
  refundedAt?: Date;
  refundedAmount?: number;
  refundReason?: string;
  syncStatus: SyncStatus;
}

type PaymentMethod = 
  | 'Card'
  | 'Cash'
  | 'Digital Wallet'
  | 'Gift Card'
  | 'Account Credit'
  | 'Split';

type TransactionStatus = 
  | 'Completed'
  | 'Pending'
  | 'Failed'
  | 'Voided'
  | 'Refunded';
```

**Staff:**
```typescript
interface Staff {
  id: string;
  salonId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  specialties: string[];         // Service IDs
  status: StaffStatus;
  clockedInAt?: Date;
  currentTicketId?: string;
  schedule: StaffSchedule[];
  turnQueuePosition?: number;
  servicesCountToday: number;
  revenueToday: number;
  syncStatus: SyncStatus;
}

type StaffStatus = 
  | 'Available'
  | 'Busy'
  | 'On Break'
  | 'Clocked Out'
  | 'Off Today';
```

**Client:**
```typescript
interface Client {
  id: string;
  salonId: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  birthday?: Date;
  notes?: string;
  preferredStaff?: string[];     // Staff IDs
  loyaltyTier?: string;
  lastVisit?: Date;
  totalVisits: number;
  totalSpent: number;
  createdAt: Date;
  syncStatus: SyncStatus;
}
```

#### 8.3.2 IndexedDB Schema

**Database Name:** `mango_biz_store_app`

**Object Stores:**

1. **appointments**
   - Key: `id`
   - Indexes: `salonId`, `clientId`, `staffId`, `status`, `scheduledStartTime`, `syncStatus`

2. **tickets**
   - Key: `id`
   - Indexes: `salonId`, `clientId`, `status`, `createdAt`, `syncStatus`

3. **transactions**
   - Key: `id`
   - Indexes: `salonId`, `ticketId`, `clientId`, `createdAt`, `syncStatus`

4. **staff**
   - Key: `id`
   - Indexes: `salonId`, `status`

5. **clients**
   - Key: `id`
   - Indexes: `salonId`, `phone`, `email`, `name`

6. **services** (catalog)
   - Key: `id`
   - Indexes: `salonId`, `category`

7. **settings**
   - Key: `key`
   - Single store for app settings

8. **sync_queue**
   - Key: `id`
   - Indexes: `priority`, `createdAt`, `status`
   - Stores pending operations for sync

**Data Retention Policy:**
- Appointments: Last 90 days cached
- Tickets: Last 30 days cached
- Transactions: Last 30 days cached
- Staff: All active staff cached
- Clients: Frequent clients + search results cached
- Services: Full catalog cached
- Older data: Fetch from server on-demand

### 8.4 API Endpoints

**Base URL:** `https://api.mangobiz.com/v1`

**Authentication:**
- All requests require JWT token in `Authorization: Bearer <token>` header
- Token includes salon ID and user role

**Core Endpoints:**

**Appointments:**
```
GET    /appointments                    // List appointments (with filters)
GET    /appointments/:id                // Get single appointment
POST   /appointments                    // Create appointment
PUT    /appointments/:id                // Update appointment
PATCH  /appointments/:id/check-in       // Check-in appointment
PATCH  /appointments/:id/status         // Change status
DELETE /appointments/:id                // Cancel appointment
```

**Tickets:**
```
GET    /tickets                         // List tickets
GET    /tickets/:id                     // Get ticket details
POST   /tickets                         // Create ticket
PUT    /tickets/:id                     // Update ticket
PATCH  /tickets/:id/status              // Change ticket status
POST   /tickets/:id/services            // Add service to ticket
DELETE /tickets/:id/services/:serviceId // Remove service
POST   /tickets/:id/products            // Add product
```

**Transactions:**
```
GET    /transactions                    // List transactions
GET    /transactions/:id                // Get transaction details
POST   /transactions                    // Create transaction (checkout)
POST   /transactions/:id/void           // Void transaction
POST   /transactions/:id/refund         // Refund transaction
GET    /transactions/:id/receipt        // Get receipt
```

**Staff:**
```
GET    /staff                           // List staff
GET    /staff/:id                       // Get staff details
PATCH  /staff/:id/clock-in              // Clock in
PATCH  /staff/:id/clock-out             // Clock out
GET    /staff/:id/earnings              // Get today's earnings
```

**Clients:**
```
GET    /clients                         // Search/list clients
GET    /clients/:id                     // Get client details
POST   /clients                         // Create client
PUT    /clients/:id                     // Update client
```

**Sync:**
```
POST   /sync/push                       // Push batch changes
POST   /sync/pull                       // Pull updates since timestamp
GET    /sync/status                     // Check sync status
```

**Analytics:**
```
GET    /analytics/today                 // Today's sale summary
GET    /analytics/staff-performance     // Staff performance data
```

### 8.5 Real-Time Events (WebSocket)

**Connection:**
- Client connects on app launch
- Maintains persistent connection
- Auto-reconnect on disconnect

**Event Types:**

**Client → Server:**
```typescript
// Join salon room for real-time updates
emit('join-salon', { salonId: string })

// Heartbeat to maintain connection
emit('ping')
```

**Server → Client:**
```typescript
// Appointment events
on('appointment:created', (appointment: Appointment) => {})
on('appointment:updated', (appointment: Appointment) => {})
on('appointment:checked-in', (appointmentId: string) => {})
on('appointment:cancelled', (appointmentId: string) => {})

// Ticket events
on('ticket:created', (ticket: Ticket) => {})
on('ticket:updated', (ticket: Ticket) => {})
on('ticket:status-changed', (ticketId: string, status: TicketStatus) => {})

// Staff events
on('staff:clocked-in', (staffId: string) => {})
on('staff:clocked-out', (staffId: string) => {})
on('staff:status-changed', (staffId: string, status: StaffStatus) => {})

// Transaction events
on('transaction:completed', (transaction: Transaction) => {})

// System events
on('sync:required', () => {})  // Trigger sync
on('pong')  // Heartbeat response
```

**Event Handling:**
- Events update Redux store
- UI automatically re-renders
- Optimistic updates + rollback on conflict

### 8.6 Offline Sync Strategy

#### 8.6.1 Sync Architecture

**Principles:**
1. **Offline-First:** All operations work offline
2. **Optimistic UI:** Show changes immediately, sync in background
3. **Conflict Resolution:** Intelligent merging of concurrent edits
4. **Priority Queue:** Critical operations synced first

#### 8.6.2 Sync Queue Structure

```typescript
interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entity: EntityType;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  priority: number;              // 1 = highest
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  status: 'Pending' | 'Syncing' | 'Success' | 'Failed';
  error?: string;
}

type EntityType = 
  | 'Appointment'
  | 'Ticket'
  | 'Transaction'
  | 'Client'
  | 'Staff';

// Priority levels:
// 1 = Payment transactions (critical)
// 2 = Ticket status changes
// 3 = Appointments
// 4 = Client updates
// 5 = Other
```

#### 8.6.3 Sync Process

**Push Sync (Local → Server):**
1. Collect operations from sync queue
2. Sort by priority
3. Batch operations (max 50 per request)
4. Send POST /sync/push with batch
5. Server processes and returns results
6. Update local entities with server response
7. Remove successful operations from queue
8. Retry failed operations with exponential backoff

**Pull Sync (Server → Local):**
1. Send GET /sync/pull with `lastSyncTimestamp`
2. Server returns all changes since timestamp
3. Apply changes to local IndexedDB
4. Handle conflicts (see Conflict Resolution)
5. Update `lastSyncTimestamp`

**Sync Triggers:**
- On app launch
- When connection restored after offline
- Every 30 seconds (if online and idle)
- On demand (user taps "Sync Now")
- Before End of Day process

#### 8.6.4 Conflict Resolution

**Conflict Types:**

**1. Concurrent Edit Conflict:**
- **Scenario:** Same entity edited on multiple devices offline
- **Resolution:**
  - Last write wins (by timestamp)
  - Exception: Critical fields require manual resolution
  - Show conflict dialog to user if manual resolution needed

**2. Double-Booking Conflict:**
- **Scenario:** Same time slot booked on two devices
- **Resolution:**
  - First sync wins
  - Second booking rejected with error
  - User notified, prompted to reschedule

**3. Payment Duplicate:**
- **Scenario:** Same ticket checked out on two devices
- **Resolution:**
  - Transaction ID prevents duplicate charging
  - First transaction wins
  - Second transaction voided automatically
  - User notified

**4. Deleted Entity Edit:**
- **Scenario:** Entity deleted on server, but edited locally
- **Resolution:**
  - Server deletion wins
  - Local edit discarded
  - User notified of deletion

**Conflict Resolution UI:**
```
┌─────────────────────────────────────────┐
│  Sync Conflict Detected                 │
├─────────────────────────────────────────┤
│  The appointment for Jane Doe at 2:00   │
│  PM was changed on another device.      │
│                                          │
│  Your Version:                           │
│  • Time: 2:00 PM - 3:00 PM              │
│  • Staff: Mike                           │
│  • Services: Haircut                     │
│                                          │
│  Other Version:                          │
│  • Time: 2:30 PM - 3:30 PM              │
│  • Staff: Sarah                          │
│  • Services: Haircut + Color            │
│                                          │
│  [ Keep Your Version ]                   │
│  [ Use Other Version ]                   │
│  [ Edit Manually ]                       │
└─────────────────────────────────────────┘
```

### 8.7 Security & Permissions

#### 8.7.1 Authentication

**Salon Mode Login:**
- Email + password OR biometric
- JWT token issued (24-hour expiration)
- Token includes:
  - Salon ID
  - User role (Salon = full permissions)
  - Device ID
  - Session ID

**Token Refresh:**
- Silent refresh 5 minutes before expiration
- If refresh fails, prompt re-login

**Session Management:**
- Multiple devices can use same salon account simultaneously
- Each device has unique session ID
- All devices' actions logged separately

#### 8.7.2 Permission Levels (Salon Mode)

**Salon Mode has full permissions:**
- ✅ View all appointments and tickets
- ✅ Create/edit/cancel appointments
- ✅ Check-in clients
- ✅ Start/complete services
- ✅ Process checkouts (all payment methods)
- ✅ Void transactions
- ✅ Refund transactions
- ✅ View all staff earnings
- ✅ Access Today's Sale
- ✅ Clock in/out staff
- ✅ Override turn queue
- ✅ End of Day process
- ✅ Access Admin Backend
- ✅ Configure device settings

**Note:** Staff Mode (future) will have restricted permissions

#### 8.7.3 Data Security

**At Rest:**
- IndexedDB encrypted (device-level)
- Sensitive data (passwords, payment info) never stored locally
- PCI DSS compliant payment handling

**In Transit:**
- All API calls over HTTPS
- WebSocket over WSS (secure)
- Certificate pinning

**Audit Trail:**
- All actions logged with:
  - User ID
  - Device ID
  - Action type
  - Timestamp
  - Before/after state (for edits)
- Logs retained indefinitely
- Accessible in Admin Portal

### 8.8 Performance Requirements

**App Launch:**
- Cold start: < 3 seconds
- Warm start: < 1 second

**Module Load Times:**
- Book: < 500ms
- Front Desk: < 500ms
- Checkout: < 300ms
- Transactions: < 800ms (initial 30 days load)

**Operation Response Times:**
- Create appointment: < 200ms (local)
- Check-in: < 100ms (local)
- Status change: < 100ms (local)
- Checkout: < 1s (including payment processing)
- Search: < 300ms

**Sync Performance:**
- Push sync: < 5 seconds for typical batch (20 operations)
- Pull sync: < 3 seconds for typical update set
- Background sync should not impact UI performance

**Offline Performance:**
- All operations < 200ms when offline
- No UI lag or freezing
- Smooth animations maintained

**Real-Time Updates:**
- WebSocket message latency: < 500ms
- UI updates after receiving event: < 100ms

### 8.9 Scalability

**Device Scalability:**
- Support 1-10 devices per salon concurrently
- Handle 100+ operations per minute per salon
- Real-time coordination across all devices

**Data Scalability:**
- IndexedDB can handle 100MB+ per device
- Pagination for large data sets
- Lazy loading for transactions history
- Efficient caching strategy

**Network Resilience:**
- Handle intermittent connectivity
- Graceful degradation on slow networks
- Automatic retry with backoff
- Queue up to 1000 operations offline

---

## 9. Integration Points

### 9.1 Mango Check-In App

**Purpose:** Self-service kiosk for client check-in and walk-in registration

**Integration:**
- **Walk-Ins:** Check-In App creates walk-in entry → Store App receives via WebSocket → Appears in Front Desk wait list
- **Check-Ins:** Client checks in via kiosk → Store App receives event → Appointment status updated to "Checked-In"
- **Data Sync:** Shared backend, real-time updates

**API Events:**
```typescript
// Check-In App → Backend → Store App
event: 'walk-in:created'
payload: {
  clientId: string,
  name: string,
  phone: string,
  services: string[],
  estimatedWait: number
}

event: 'appointment:checked-in'
payload: {
  appointmentId: string,
  checkInTime: Date
}
```

### 9.2 Admin Backend (Web Portal)

**Purpose:** Strategic management, configuration, analytics

**Integration:**
- **Configuration Sync:** Changes to services, staff, settings in Admin Portal → Synced to Store App
- **Deep Linking:** Store App "More → Admin Backend" → Opens web portal with SSO
- **Data Flow:** Store App → Backend → Admin Portal (for analytics and reporting)

**Shared Data:**
- Service catalog
- Staff profiles and schedules
- Business settings (hours, tax rates, turn queue rules)
- Client database

### 9.3 Mango Payment

**Purpose:** Card processing and payment gateway

**Integration:**
- **SDK:** Mango Payment SDK embedded in Store App
- **Checkout Flow:** Store App Checkout → Mango Payment SDK → Card terminal
- **Settlement:** Offline transactions queued → Settled when online → Mango Payment API

**API:**
```typescript
// Process payment
MangoPayment.charge({
  amount: number,
  currency: 'USD',
  tip: number,
  description: string,
  metadata: {
    salonId: string,
    ticketId: string,
    clientId: string
  }
}) => Promise<PaymentResult>

// Refund
MangoPayment.refund({
  transactionId: string,
  amount: number,
  reason: string
}) => Promise<RefundResult>
```

### 9.4 Mango Store (Online Booking)

**Purpose:** Public website for online bookings

**Integration:**
- **Bookings:** Client books on Mango Store → Backend → Store App receives new appointment
- **Availability:** Store App appointments → Backend → Mango Store shows availability
- **Real-Time:** WebSocket updates ensure availability accuracy

### 9.5 Mango Client App (Mobile)

**Purpose:** Consumer mobile app for booking and account management

**Integration:**
- **Bookings:** Similar to Mango Store
- **Notifications:** Store App completes service → Client App receives "Ready for checkout" notification
- **Loyalty:** Client App shows loyalty points → Updated when transaction completed in Store App

### 9.6 Mango Marketing

**Purpose:** Campaign management and social media

**Integration:**
- **Transaction Data:** Store App transactions → Backend → Marketing uses for targeting
- **Campaign Triggers:** Completed transaction → Marketing sends follow-up (review request, rebooking offer)

### 9.7 Inventory Module

**Purpose:** Product and supply management

**Integration:**
- **Product Sales:** Checkout adds product → Store App decrements stock → Inventory Module updated
- **Low Stock Alerts:** Inventory Module detects low stock → Store App receives notification
- **Product Catalog:** Shared product database for checkout product selection

### 9.8 Payroll Module

**Purpose:** Staff earnings and commission tracking

**Integration:**
- **Commission Data:** Every completed transaction → Commission calculated per staff → Payroll Module updated
- **Tips:** Tip amounts tracked per staff → Payroll Module for tax reporting
- **Hours:** Clock in/out data → Payroll Module for timekeeping

---

## 10. Non-Functional Requirements

### 10.1 Availability
- **Uptime:** 99.9% (excluding planned maintenance)
- **Offline Capability:** 100% core operations functional offline
- **Recovery Time:** < 5 minutes for service restoration after outage

### 10.2 Reliability
- **Data Integrity:** 100% accuracy, no data loss
- **Transaction Success Rate:** > 99.5%
- **Sync Success Rate:** > 99% (with retry)
- **Error Rate:** < 0.1% of all operations

### 10.3 Usability
- **Learning Curve:** New users productive within 30 minutes
- **Task Completion:** 90% of tasks completed without help
- **User Satisfaction:** > 4.5/5 rating
- **Accessibility:** WCAG 2.1 AA compliance

### 10.4 Security
- **Authentication:** Multi-factor optional, biometric supported
- **Data Encryption:** All data encrypted in transit and at rest
- **PCI DSS:** Level 1 compliance for payment processing
- **Audit Trail:** 100% of actions logged
- **Session Timeout:** Configurable, default 30 minutes

### 10.5 Compatibility
- **iOS:** iOS 15+ (iPad 8th gen or newer)
- **Android:** Android 11+ (tablets)
- **Browsers:** Not applicable (native app)
- **Screen Sizes:** Optimized for 10"-13" tablets
- **Orientation:** Portrait and landscape supported

### 10.6 Maintainability
- **Code Quality:** 80%+ test coverage
- **Documentation:** Comprehensive inline and external docs
- **Modularity:** Loosely coupled, independently deployable modules
- **Updates:** Over-the-air updates, no downtime

### 10.7 Localization
- **Languages:** English (primary), Spanish, Vietnamese, Chinese (planned)
- **Currency:** USD (primary), others configurable
- **Date/Time:** Localized formats
- **Timezone:** Auto-detected, configurable

---

## 11. Success Metrics

### 11.1 Adoption Metrics
- **Active Salons:** Number of salons using Store App daily
- **Device Usage:** Average number of devices per salon
- **Feature Usage:** % of salons using each module
- **Staff Adoption:** % of staff using app daily

**Targets (6 months post-launch):**
- 500+ active salons
- 2-3 devices per salon average
- 80%+ using Front Desk and Checkout
- 70%+ staff adoption rate

### 11.2 Performance Metrics
- **Checkout Time:** Average time from service complete to payment
- **Offline Uptime:** % of time app used offline successfully
- **Sync Success:** % of sync operations successful
- **App Crashes:** Crash-free sessions rate

**Targets:**
- Checkout time < 2 minutes average
- 95%+ offline success rate
- 99%+ sync success rate
- 99.5%+ crash-free sessions

### 11.3 Business Impact Metrics
- **Revenue Impact:** Additional revenue per salon from improved ops
- **Efficiency Gain:** Reduction in time per transaction
- **Client Satisfaction:** NPS score from clients
- **Staff Satisfaction:** Staff satisfaction survey scores

**Targets:**
- 10%+ revenue increase per salon
- 30%+ reduction in checkout time
- NPS > 50
- Staff satisfaction > 4/5

### 11.4 Technical Metrics
- **API Latency:** Average response time for API calls
- **App Load Time:** Time to interactive
- **Data Sync:** Average sync time
- **Error Rate:** Errors per 1000 operations

**Targets:**
- API latency < 200ms (p95)
- App load < 2s
- Sync time < 5s
- Error rate < 1 per 1000 operations

---

## 12. Implementation Plan

### 12.1 Development Phases

**Phase 1: MVP (Months 1-3)**
- Core modules: Book, Front Desk, Checkout, Transactions
- Basic offline functionality
- Manual turn queue
- Card and cash payments
- Real-time sync
- Basic reporting

**Phase 2: Enhancement (Months 4-5)**
- Auto turn queue with AI
- Multi-staff service coordination
- Advanced offline capabilities
- Split payments and gift cards
- Enhanced analytics
- More menu features (Device Manager, End of Day)

**Phase 3: Polish (Month 6)**
- Performance optimization
- UI/UX refinements
- Comprehensive testing
- Documentation
- Training materials
- Beta testing with select salons

**Phase 4: Launch (Month 7)**
- General availability
- Marketing and onboarding
- Support readiness
- Monitoring and feedback collection

### 12.2 Testing Strategy

**Unit Testing:**
- 80%+ code coverage
- All business logic functions tested
- Edge cases covered

**Integration Testing:**
- API integration tests
- WebSocket event tests
- Payment gateway integration tests
- Offline sync tests

**End-to-End Testing:**
- User flow tests (Playwright/Cypress)
- Multi-device coordination tests
- Offline/online transition tests

**Manual Testing:**
- QA team testing all modules
- Usability testing with actual salon staff
- Device compatibility testing
- Performance testing under load

**Beta Testing:**
- 10-20 pilot salons
- Real-world usage
- Feedback collection
- Bug reporting

### 12.3 Rollout Plan

**Week 1-2: Soft Launch**
- Release to 5 pilot salons
- Close monitoring
- Daily check-ins
- Rapid bug fixes

**Week 3-4: Expanded Beta**
- Release to 50 salons
- Onboarding and training
- Collect feedback
- Iterate on issues

**Week 5-6: General Availability**
- Open to all salons
- Marketing campaign
- Support team scaled up
- Documentation published

**Week 7-8: Optimization**
- Monitor usage patterns
- Optimize based on real-world data
- Address common issues
- Plan Phase 2 features

### 12.4 Training & Onboarding

**Training Materials:**
- Video tutorials (5-10 minutes each per module)
- Interactive guided tours
- PDF quick-start guide
- In-app tooltips and help
- Live webinar sessions

**Onboarding Process:**
1. Welcome email with resources
2. Schedule kick-off call
3. Device setup and configuration
4. Guided walkthrough (30 min)
5. Practice transactions
6. Go-live support
7. Follow-up check-in (1 week)

**Support:**
- 24/7 chat support
- Email support (< 4-hour response)
- Phone support (business hours)
- Knowledge base and FAQs
- Community forum

### 12.5 Monitoring & Maintenance

**Monitoring Tools:**
- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Usage analytics (Mixpanel)
- User feedback (in-app surveys)

**KPIs to Monitor:**
- Daily active users
- Feature usage rates
- Error rates and crash reports
- Sync success rates
- API latency and uptime
- User satisfaction scores

**Maintenance:**
- Weekly performance reviews
- Monthly feature updates
- Quarterly major releases
- Continuous bug fixes
- Regular security audits

---

## Appendix A: Glossary

**Salon Mode:** Operating mode where the device is logged in as the salon account, providing full operational permissions.

**Staff Mode:** Operating mode (future) where individual staff members log in to access personal schedules and earnings.

**Turn Queue:** System for managing fair distribution of walk-in clients among staff members.

**Ticket:** A service record containing all services and products for a client visit, from check-in through checkout.

**Pending:** Status indicating services are complete and client is awaiting payment processing.

**Sync Queue:** Local queue of operations waiting to be synchronized with the backend server.

**Offline-First:** Architecture principle where all features work offline by default, with online being enhancement.

**Optimistic UI:** UI pattern where changes are displayed immediately, assuming success, with rollback on failure.

---

## Appendix B: UI Wireframe Descriptions

### Book Module - Day View
```
┌─────────────────────────────────────────────────────────────┐
│ [≡] Book          [Today ▼]   [Week] [Agenda]      [+ New] │
├─────────────────────────────────────────────────────────────┤
│ Time  │ Amy        │ Beth       │ Carlos     │ Diana       │
├───────┼────────────┼────────────┼────────────┼─────────────┤
│ 9:00  │ ┌────────┐ │            │ ┌────────┐ │             │
│       │ │Jane Doe│ │            │ │Mike Lee│ │             │
│       │ │Haircut │ │            │ │Manicure│ │             │
│ 9:30  │ │$45     │ │            │ └────────┘ │             │
│       │ └────────┘ │            │            │             │
│ 10:00 │            │ ┌────────┐ │            │ ┌─────────┐ │
│       │            │ │Sara J. │ │            │ │Kim Park │ │
│       │            │ │Pedicure│ │            │ │Facial   │ │
│ 10:30 │            │ │$35     │ │            │ │$75      │ │
│       │            │ └────────┘ │            │ └─────────┘ │
│ 11:00 │    [+]     │    [+]     │    [+]     │    [+]      │
└─────────────────────────────────────────────────────────────┘
```

### Front Desk Module
```
┌─────────────────────────────────────────────────────────────┐
│ [≡] Front Desk                          [🔔3] [⚙] [Search] │
├─────────────────────────────────────────────────────────────┤
│ STAFF STATUS ────────────────────────────────────────────── │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │🟢 Amy    │ │🔵 Beth   │ │🟢 Carlos │ │🟡 Diana  │  →    │
│ │Available │ │Busy      │ │Available │ │On Break  │       │
│ │Next: 2PM │ │Jane - 45m│ │7 svcs    │ │Back 1:30 │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│ TURN QUEUE [Manual ▼] ──────────────────────────────────── │
│ 1.🔵 Amy (Next)  2.🔵 Carlos  3.🔵 Beth  [+ Add Turn]      │
├─────────────────────────────────────────────────────────────┤
│ Coming (3)  │ Checked-In (2) │ In-Service (4) │ Pending (1)│
├─────────────┼────────────────┼────────────────┼────────────┤
│┌──────────┐│┌─────────────┐ │┌─────────────┐ │┌──────────┐│
││Jane Doe  ││││Mike Lee⏱10m│││Sam B.⏱32m  │ ││Kim P.   ││
││2:00 PM   ││││w/ Amy       │││w/ Beth      │ ││$85      ││
││Amy       ││││Haircut      │││Manicure     │ ││[Checkout│││
││[Check-In]│││└─────────────┘ │└─────────────┘ │└──────────┘││
│└──────────┘││┌─────────────┐ │┌─────────────┐ │            │
││            │││Sara⏱5m      │││Lisa⏱18m     │ │            │
││            │││w/ Carlos    │││w/ Diana     │ │            │
│└────────────┘└─────────────┘ └─────────────┘ └────────────┘
│             [+ Add Walk-In]                                  │
└─────────────────────────────────────────────────────────────┘
```

### Checkout Module
```
┌─────────────────────────────────────────────────────────────┐
│ [≡] Checkout                                    [✕ Cancel]  │
├──────────────────────────────────┬──────────────────────────┤
│ TICKET SUMMARY                   │ PAYMENT                  │
│ ─────────────────────────────    │ ──────────────────────   │
│ 👤 Jane Doe                      │ Select Payment Method:   │
│ 📞 (555) 123-4567                │                          │
│                                  │ ┌────────┐ ┌────────┐   │
│ Services:                        │ │  💳    │ │  💵    │   │
│ ┌─────────────────────────────┐ │ │ Card   │ │ Cash   │   │
│ │✂️ Haircut (Amy)             │ │ └────────┘ └────────┘   │
│ │   45 min            $45.00  │ │                          │
│ │                             │ │ ┌────────┐ ┌────────┐   │
│ │💅 Manicure (Beth)           │ │ │  📱    │ │  🎁    │   │
│ │   30 min            $35.00  │ │ │Digital │ │  Gift  │   │
│ └─────────────────────────────┘ │ └────────┘ └────────┘   │
│                                  │                          │
│ [+ Add Service]                  │ Tip Amount:              │
│                                  │ ┌────┬────┬────┬────┐   │
│ Products:                        │ │15% │18% │20% │25% │   │
│ (none)                           │ └────┴────┴────┴────┘   │
│ [+ Add Product]                  │ Custom: $______          │
│                                  │                          │
│ ─────────────────────────────    │ Payment Summary:         │
│ Subtotal           $80.00        │ Subtotal      $80.00    │
│ Tax (8%)            $6.40        │ Tip           $16.00    │
│ ─────────────────────────────    │ ──────────────────────   │
│ TOTAL              $86.40        │ TOTAL         $96.00    │
│                                  │                          │
│                                  │ ┌────────────────────┐  │
│                                  │ │ Charge $96.00      │  │
│                                  │ └────────────────────┘  │
└──────────────────────────────────┴──────────────────────────┘
```

---

## Appendix C: Error Handling

### C.1 Error Categories

**User Errors:**
- Invalid input (e.g., past date for appointment)
- Attempting invalid action (e.g., checkout incomplete service)
- Permission denied (staff trying manager action)

**System Errors:**
- Network connectivity issues
- API server errors
- Database errors
- Payment processing failures

**Data Errors:**
- Sync conflicts
- Duplicate data
- Missing required fields
- Data validation failures

### C.2 Error Messages

**Principles:**
- Clear, non-technical language
- Explain what happened
- Suggest next action
- Provide help link when appropriate

**Examples:**

**Good:**
```
❌ Cannot book appointment
This time slot is already taken. Please select 
a different time or staff member.

[Choose Different Time] [Cancel]
```

**Bad:**
```
Error: ERR_DUPLICATE_BOOKING_409
Constraint violation on appointments table.
```

---

**Payment Failure:**
```
❌ Payment could not be processed
The card was declined. Please try:
• Using a different payment method
• Asking the client to contact their bank
• Processing as cash if client has it available

[Try Different Method] [Contact Support]
```

---

**Sync Conflict:**
```
⚠️ Sync Conflict
This appointment was changed on another device 
while you were offline. 

Your changes: Changed time to 3:00 PM
Other changes: Added additional service ($45)

[Keep Both Changes] [Use Your Version] 
[Use Other Version] [Edit Manually]
```

---

**Offline Limitation:**
```
ℹ️ This feature requires internet
You're currently offline. This action will be 
available when you reconnect.

Current status: 3 operations waiting to sync

[Reconnect] [View Pending Operations]
```

### C.3 Error Recovery

**Automatic Recovery:**
- Auto-retry API calls with exponential backoff
- Auto-reconnect WebSocket
- Auto-sync when connection restored
- Fallback to cached data when server unavailable

**User-Initiated Recovery:**
- "Try Again" buttons
- Manual sync trigger
- Clear cache and reload
- Contact support with diagnostic info

### C.4 Error Logging

**What to Log:**
- Error message and stack trace
- User action that triggered error
- Device and app version
- Network status
- Relevant state data

**Where to Log:**
- Local error log (last 1000 errors)
- Backend error tracking service (Sentry)
- Analytics (error rates and patterns)

**Privacy:**
- Never log sensitive data (passwords, full card numbers, SSN)
- Anonymize PII in error reports
- User consent for diagnostic data sharing

---

## Appendix D: Accessibility Guidelines

### D.1 WCAG 2.1 AA Compliance

**Perceivable:**
- All images have alt text
- Color not the only indicator (use icons + color)
- Minimum contrast ratio 4.5:1 for text
- Text resizable up to 200% without loss of functionality
- Audio/visual feedback for important actions

**Operable:**
- All functionality available via keyboard (for external keyboard users)
- Touch targets minimum 44x44 points
- No time limits on actions (or extended timeout option)
- Clear focus indicators
- Gestures don't require precise timing

**Understandable:**
- Clear, simple language
- Consistent navigation
- Predictable behavior
- Clear error messages with suggestions
- Confirmation for destructive actions

**Robust:**
- Valid HTML/semantic structure
- Compatible with assistive technologies
- Screen reader support (VoiceOver/TalkBack)

### D.2 Specific Implementations

**VoiceOver Support:**
- Proper label and hint text for all interactive elements
- Announcement of state changes
- Logical reading order
- Custom rotor actions for quick navigation

**Large Text Mode:**
- Dynamic type support (iOS)
- Text scales up to 200%
- Layout adjusts appropriately
- No text truncation

**High Contrast Mode:**
- Sufficient contrast in all modes
- High contrast variants available
- No information conveyed by color alone

**Reduce Motion:**
- Respect system reduce motion setting
- Static alternatives to animations
- Essential animations only

**Voice Control:**
- All buttons labeled for voice activation
- Custom voice commands for common actions

---

## Appendix E: Localization Considerations

### E.1 Supported Languages (Roadmap)

**Phase 1 (Launch):**
- English (US) - Primary

**Phase 2 (3 months post-launch):**
- Spanish (US)
- Vietnamese

**Phase 3 (6 months post-launch):**
- Chinese (Simplified)
- Korean
- French (Canada)

### E.2 Internationalization (i18n) Strategy

**Text Externalization:**
- All user-facing text in language files
- No hardcoded strings in code
- Support for RTL languages (future)

**Number Formatting:**
- Locale-aware number formatting
- Currency display with proper symbols
- Thousand/decimal separators per locale

**Date/Time Formatting:**
- Locale-aware date formats
- 12/24-hour time based on locale
- Timezone handling

**Cultural Considerations:**
- Name field order (first/last vs last/first)
- Phone number formats
- Address formats
- Cultural color meanings (e.g., red = warning in some cultures, good luck in others)

### E.3 Translation Workflow

**Process:**
1. Extract translatable strings
2. Send to professional translation service
3. Review translations with native speakers
4. Implement in app
5. QA testing in each language
6. Ongoing updates as features added

**Translation Files:**
```json
{
  "en": {
    "common.save": "Save",
    "common.cancel": "Cancel",
    "checkout.total": "Total",
    "checkout.process_payment": "Process Payment",
    ...
  },
  "es": {
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "checkout.total": "Total",
    "checkout.process_payment": "Procesar Pago",
    ...
  }
}
```

---

## Appendix F: Compliance & Legal

### F.1 PCI DSS Compliance

**Requirements for Payment Processing:**
- Never store full card numbers locally
- Store only last 4 digits and card type
- Use Mango Payment SDK (PCI-certified)
- Encrypted communication for all payment data
- Regular security audits
- Secure key management

**Implementation:**
- Card data entered directly into payment terminal
- Store App never handles full card PAN
- Tokenized payment references only
- Audit logging of all payment operations

### F.2 Data Privacy

**GDPR Compliance (for EU clients):**
- Right to access data
- Right to deletion
- Data portability
- Consent management
- Privacy policy disclosure

**CCPA Compliance (California):**
- Disclosure of data collection
- Opt-out of data sale (N/A - we don't sell)
- Right to deletion
- Non-discrimination

**Client Data Protection:**
- Minimal data collection
- Encrypted storage and transmission
- Data retention policies
- Secure deletion when requested

### F.3 Terms of Service

**Salon Agreement:**
- Service availability (99.9% uptime)
- Data ownership (salon owns their data)
- Liability limitations
- Subscription terms
- Termination conditions

**Acceptable Use:**
- Prohibited activities
- Account security responsibility
- Multi-device usage terms
- Data backup responsibility

### F.4 Audit Trail Requirements

**For Compliance:**
- All transactions logged
- User actions tracked
- Access logs maintained
- Changes to settings logged
- Refunds/voids with reason codes
- Logs retained 7 years (financial transactions)

---

## Appendix G: Performance Optimization

### G.1 Code Optimization

**React Performance:**
- Memoization (React.memo, useMemo, useCallback)
- Code splitting and lazy loading
- Virtual scrolling for long lists
- Debounced search input
- Optimized re-renders (minimize prop changes)

**Bundle Size:**
- Tree shaking unused code
- Lazy load modules
- Optimize images and assets
- Compress JavaScript bundles
- Target bundle size < 2MB total

### G.2 Data Optimization

**IndexedDB:**
- Indexed queries for fast lookups
- Batch operations
- Lazy loading of large datasets
- Pagination for history views
- Regular cleanup of old data

**Caching Strategy:**
- Cache service catalog (long TTL)
- Cache frequent client data (medium TTL)
- Cache today's data (short TTL)
- Invalidate cache on sync conflicts

### G.3 Network Optimization

**API Efficiency:**
- Batch API requests
- Request only changed data (delta sync)
- Compress request/response payloads
- Implement HTTP/2 multiplexing
- CDN for static assets

**WebSocket Optimization:**
- Message batching
- Heartbeat interval optimization
- Reconnection with backoff
- Efficient serialization (MessagePack vs JSON)

### G.4 Rendering Optimization

**UI Performance:**
- Hardware acceleration for animations
- Minimize paint/layout operations
- Use CSS transforms vs position changes
- Optimize scroll performance
- Reduce shadow/blur effects

**Image Optimization:**
- Lazy load images
- Responsive images (srcset)
- WebP format with PNG fallback
- Thumbnail generation

---

## Appendix H: Disaster Recovery

### H.1 Data Backup

**Local Backup:**
- Automatic daily backup to device storage
- Last 7 days retained
- User can manually trigger backup
- Export backup to email/cloud

**Server Backup:**
- Real-time replication
- Daily snapshots retained 30 days
- Weekly snapshots retained 1 year
- Geographic redundancy

### H.2 Recovery Scenarios

**Device Lost/Stolen:**
1. Remote wipe capability (via device management)
2. Login from new device
3. All data restored from server
4. Deactivate old device session

**Data Corruption:**
1. Detect corruption on sync
2. Restore from last known good state
3. Re-sync from server
4. User notified of recovery

**Server Outage:**
1. Continue operations offline
2. Queue all changes locally
3. Monitor for server recovery
4. Auto-sync when restored
5. Verify data integrity

**App Crash:**
1. Auto-save state before crash
2. Restore state on relaunch
3. Resume interrupted operations
4. Error report sent to developers

### H.3 Business Continuity

**Failover Plan:**
- Multi-region server deployment
- Automatic failover to backup region
- < 5 minute RTO (Recovery Time Objective)
- Zero RPO (Recovery Point Objective) for completed transactions

**Communication Plan:**
- Status page for system health
- Email/SMS alerts for major outages
- In-app notifications of issues
- Support team ready for inquiries

---

## Appendix I: Future Enhancements

### I.1 Phase 4+ Features (Post-Launch)

**Advanced Analytics:**
- Predictive analytics (forecast busy times)
- Client churn prediction
- Service recommendation engine
- Revenue optimization suggestions

**AI-Powered Features:**
- Smart scheduling (AI optimizes appointments)
- Dynamic pricing based on demand
- Chatbot for common questions
- Voice commands for hands-free operation

**Multi-Location:**
- Centralized dashboard for chains
- Cross-location bookings
- Resource sharing between locations
- Consolidated reporting

**Enhanced Client Experience:**
- Client app integration for self-service
- In-app messaging with clients
- Client preferences auto-applied
- Personalized service recommendations

**Staff Features:**
- Staff mobile app (full Staff Mode)
- Self-service schedule management
- Commission real-time tracking
- Performance gamification

**Hardware Integration:**
- Smart mirrors (display appointments)
- IoT devices (door locks, lighting)
- Advanced card readers (tap-to-pay)
- Biometric authentication

**Advanced Payments:**
- Buy now, pay later (Klarna, Affirm)
- Subscription billing
- Auto-payment for regulars
- Invoice billing for corporate clients

### I.2 Technical Debt & Refactoring

**Code Quality:**
- Increase test coverage to 90%+
- Migrate to latest React version
- Optimize bundle size further
- Implement micro-frontends for scalability

**Architecture:**
- Event-driven architecture
- GraphQL migration (from REST)
- Edge computing for lower latency
- Blockchain for immutable audit trail (exploratory)

---

## Appendix J: FAQs

### For Product Team:

**Q: Why offline-first instead of cloud-first?**
A: Salons can't afford downtime. Internet outages would halt business with a cloud-first approach. Offline-first ensures continuous operations and builds trust.

**Q: Why iPad over web app?**
A: Touch-optimized UI, better performance, offline reliability, hardware integration (printers, card readers), and professional appearance at front desk.

**Q: How do we prevent data conflicts with multiple devices?**
A: Last-write-wins for most operations, with timestamp-based conflict resolution. Critical conflicts (double-bookings) trigger manual resolution prompts.

### For Development Team:

**Q: Which state management library?**
A: Redux Toolkit for predictable state, excellent DevTools, and middleware support for sync queue management.

**Q: Why IndexedDB over LocalStorage?**
A: IndexedDB provides much larger storage (50MB+), supports complex queries, and allows background sync via Service Workers.

**Q: How to handle WebSocket disconnections?**
A: Automatic reconnection with exponential backoff. Fallback to polling if WebSocket consistently fails. User notified only if prolonged issue.

### For Business Team:

**Q: What's the pricing model?**
A: Per-location subscription, included with Mango Biz Pro plan. Additional devices free (up to 10 per location).

**Q: Training and onboarding time?**
A: 30-minute guided setup, 1-hour training session, 1-week onboarding support. Most staff productive day one.

**Q: Can salons use their existing hardware?**
A: Yes, works with most receipt printers and card readers. We recommend specific models for best compatibility.

---

## Appendix K: Support & Troubleshooting

### K.1 Common Issues & Solutions

**Issue: App won't sync**
- **Symptoms:** "Pending operations" count stays high, "Syncing..." never completes
- **Solutions:**
  1. Check internet connection
  2. Force sync via Device Manager
  3. Restart app
  4. Check server status page
  5. Contact support if persists > 15 minutes

**Issue: Printer not working**
- **Symptoms:** Receipt print fails, no printer found
- **Solutions:**
  1. Check printer power and connection
  2. Verify printer in Device Manager
  3. Test print from Device Manager
  4. Re-pair Bluetooth printer
  5. Restart printer and app

**Issue: Payment declined**
- **Symptoms:** Card payment fails at checkout
- **Solutions:**
  1. Ask client to try card again
  2. Try different payment method
  3. Check card reader connection
  4. Process as cash if available
  5. Contact Mango Payment support

**Issue: Appointment disappeared**
- **Symptoms:** Booked appointment not showing
- **Solutions:**
  1. Check if filtered view active
  2. Search by client name
  3. Check if cancelled by another device
  4. Force sync to get latest data
  5. Contact support to recover if deleted

**Issue: Can't check-in client**
- **Symptoms:** Check-in button disabled or errors
- **Solutions:**
  1. Verify appointment status
  2. Check time (can't check in too early)
  3. Ensure staff assigned
  4. Restart app
  5. Manual override via Front Desk

### K.2 Support Escalation

**Level 1: In-App Help**
- Knowledge base search
- Video tutorials
- Contextual tooltips

**Level 2: Chat Support**
- Real-time chat with support agent
- Screen sharing capability
- Typical resolution: 5-15 minutes

**Level 3: Phone Support**
- Call support hotline
- More complex issues
- Escalated from chat if needed

**Level 4: Engineering**
- Backend issues
- Data corruption
- Critical bugs
- Escalated by support team

### K.3 Diagnostic Information

**What Support Needs:**
- Device model and OS version
- App version
- Salon ID
- Steps to reproduce issue
- Screenshots or screen recording
- Error messages (exact text)
- Recent actions before issue

**How to Collect:**
- Device Manager shows device info
- "Send Diagnostic Report" button in Support
- Automatically includes relevant logs
- Optional screen recording attachment

---

## Appendix L: Release Notes Template

### Version X.Y.Z (Release Date)

**🎉 New Features:**
- Feature name: Brief description of user benefit
- Feature name: Brief description of user benefit

**🔧 Improvements:**
- Enhancement: What improved and why it matters
- Enhancement: What improved and why it matters

**🐛 Bug Fixes:**
- Fixed: Issue description and impact
- Fixed: Issue description and impact

**⚠️ Known Issues:**
- Issue: Description and workaround (if any)

**📱 Compatibility:**
- Minimum iOS version: X
- Minimum Android version: Y

**🔄 Migration Notes:**
- Any breaking changes or required actions

---

## Appendix M: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 21, 2025 | Product Team | Initial PRD creation |
| | | | Defined all 6 modules |
| | | | Specified offline-first architecture |
| | | | Documented user flows |

---

## Appendix N: Stakeholder Sign-Off

**Product Owner:**
- Name: _______________________
- Signature: ___________________
- Date: _______________________

**Engineering Lead:**
- Name: _______________________
- Signature: ___________________
- Date: _______________________

**Design Lead:**
- Name: _______________________
- Signature: ___________________
- Date: _______________________

**QA Lead:**
- Name: _______________________
- Signature: ___________________
- Date: _______________________

**Business Owner:**
- Name: _______________________
- Signature: ___________________
- Date: _______________________

---

## Document End

**Total Pages:** Comprehensive PRD  
**Last Updated:** October 21, 2025  
**Next Review:** Monthly during development  
**Feedback:** Product team welcomes feedback via [email/slack channel]

---

**Questions or Clarifications:**
For questions about this PRD, please contact:
- Product: product@mangobiz.com
- Engineering: engineering@mangobiz.com
- Design: design@mangobiz.com

**Related Documents:**
- Mango Biz System Architecture
- Admin Portal PRD
- Mango Payment Integration Specs
- Brand Guidelines
- API Documentation

---

*This PRD is a living document and will evolve as we learn from user feedback and market conditions. All stakeholders should be notified of major changes.*