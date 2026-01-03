# Design Specification: Turn Tracker Module

**Version:** 1.0
**Last Updated:** December 28, 2025
**Status:** Approved
**Related PRD:** PRD-Turn-Tracker-Module.md

---

## 1. Overview

The Turn Tracker is Mango's unique differentiator in salon management software - no competitor offers this level of turn management visibility and fairness tracking. This design spec defines the visual language for a real-time turn queue management and audit system that helps managers monitor staff turns, ensure fair distribution, and resolve disputes with complete transparency.

### 1.1 Design Goals

| Goal | Description |
|------|-------------|
| **Instant Queue Visibility** | Staff queue position and status visible at a glance |
| **Fair Distribution Clarity** | Visual indicators show balanced turn allocation |
| **Audit Trail Transparency** | Complete history of all turn changes with receipts |
| **Mobile-First Management** | Managers can monitor and adjust turns remotely |
| **Real-Time Updates** | Live sync across all devices without refresh |

### 1.2 Key Differentiators

- **Timeline Visualization**: Horizontal scrolling turn logs show complete service history
- **Queue Position Indicators**: Clear visual hierarchy based on queue order
- **Fairness Score**: Visual balance indicators prevent disputes
- **One-Tap Adjustments**: Quick add/subtract turns with required reasons

---

## 2. Design Philosophy

### 2.1 Visual Hierarchy

```
1. Queue Position (who's next)
2. Turn Count (total turns)
3. Service Revenue (daily total)
4. Timeline (individual entries)
5. Settings (configuration)
```

### 2.2 Color System

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Cyan Primary** | Brand cyan | `#06B6D4` | Headers, TURN values, timestamps |
| **Queue Next** | Green | `#22C55E` | Next-in-queue indicator |
| **Queue Busy** | Blue | `#3B82F6` | Currently in service |
| **Queue Break** | Yellow | `#F59E0B` | On break status |
| **Service Done** | Light Green | `#DCFCE7` | Completed service badge |
| **Checkout** | Light Blue | `#DBEAFE` | Checkout badge |
| **Void** | Light Red | `#FEE2E2` | Voided service badge |
| **Bonus** | Orange | `#F97316` | Bonus turn indicator |
| **Tardy** | Red | `#EF4444` | Tardy penalty indicator |

### 2.3 Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Modal Title | 20px | 700 | `#FFFFFF` |
| Staff Name | 14px | 700 | `#111827` |
| Metric Label | 12px | 400 | `#6B7280` |
| Metric Value | 14px | 600 | `#111827` |
| TURN Value | 14px | 700 | `#06B6D4` |
| Timestamp | 12px | 600 | `#06B6D4` |
| Bonus Value | 12px | 600 | `#F97316` |
| Amount | 14px | 700 | `#111827` |

---

## 3. Layout Architecture

### 3.1 Full-Screen Modal

```
┌────────────────────────────────────────────────────────────┐
│  HEADER (Cyan Gradient)                                    │
│  [Title]  [Date]           [Search] [List/Grid] [⋮] [×]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  CONTENT AREA (Staff Rows)                                 │
│  ┌───────────┬─────────────────────────────────────────┐  │
│  │ Staff Card│  Turn Log Blocks (Timeline)        [+]  │  │
│  ├───────────┼─────────────────────────────────────────┤  │
│  │ Staff Card│  Turn Log Blocks (Timeline)        [+]  │  │
│  ├───────────┼─────────────────────────────────────────┤  │
│  │ Staff Card│  Turn Log Blocks (Timeline)        [+]  │  │
│  └───────────┴─────────────────────────────────────────┘  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  FOOTER (Summary Stats)                                    │
│  [Staff: X] [Turns: X] [Revenue: $X]      [Legend]        │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Modal Specifications

| Property | Value |
|----------|-------|
| Position | Fixed inset-2 (sm:inset-4) |
| Max Width | 98vw (sm: 95vw) |
| Background | `#FFFFFF` |
| Border Radius | 12px |
| Shadow | 0 25px 50px -12px rgba(0, 0, 0, 0.25) |
| Z-Index | 70 (backdrop: 60) |

### 3.3 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Vertical card stack, bottom sheet modals |
| Tablet | 768-1023px | Compact view, 2-column staff cards |
| Desktop | >= 1024px | Full detailed view, horizontal timeline |

---

## 4. Visual Components

### 4.1 Header Bar

**Purpose:** Navigation, view controls, and date context

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Height | 56px (sm: 64px) |
| Background | gradient from-cyan-500 to-cyan-600 |
| Padding | 12px 12px (sm: 16px 24px) |

**Header Elements:**

| Element | Specification |
|---------|---------------|
| Title | 16px (sm: 20px), 700 weight, white |
| Date Badge | bg-white/20, backdrop-blur, 12px, medium |
| Icon Buttons | 44x44px touch target, white icons, hover:bg-cyan-700 |
| Dividers | 1px white/30 vertical lines |

**Icon Button States:**

| State | Appearance |
|-------|------------|
| Default | white icon, transparent bg |
| Hover | bg-cyan-700 |
| Active | bg-cyan-700 |
| Selected | bg-cyan-700 (for view toggle) |

---

### 4.2 Staff Summary Card (Detailed View)

**Purpose:** Display staff turn metrics with full details

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Width | 192px |
| Padding | 16px |
| Background | `#FFFFFF` |
| Border Right | 1px solid `#E5E7EB` |

**Layout:**

```
┌──────────────────────┐
│      [Avatar]        │
│      ● 48x48px       │
│                      │
│      Staff Name      │
│      [14px bold]     │
│                      │
│   🕐 09:30:00 AM    │
│                      │
│   Bonus:      1.0    │
│   Adjust:     0.5    │
│   Service:  $90.00   │
│   ─────────────────  │
│   TURN:      2.50    │
└──────────────────────┘
```

**Avatar States:**

| State | Appearance |
|-------|------------|
| With Photo | 48x48px circular, object-cover |
| Without Photo | Gradient bg (orange-to-pink), first letter, white |

**Metrics Section:**

| Property | Label Style | Value Style |
|----------|-------------|-------------|
| Bonus | 12px, gray-600 | 14px, 600 weight, gray-900 |
| Adjust | 12px, gray-600 | 14px, 600 weight, gray-900 |
| Service | 12px, gray-600 | 14px, 600 weight, gray-900 |
| TURN | 12px, gray-600 | 14px, 700 weight, cyan-600 |
| Divider | 1px solid gray-200 above TURN row |

---

### 4.3 Staff Summary Card (Compact View)

**Purpose:** Overview for 20+ staff scenarios

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Width | 128px |
| Padding | 16px |
| Avatar Size | 40x40px |

**Layout:**

```
┌───────────────────┐
│     [Avatar]      │
│     ● 40x40px     │
│                   │
│    Staff Name     │
│    [12px bold]    │
│                   │
│  Service: $90.00  │
│  TURN:     2.50   │
└───────────────────┘
```

---

### 4.4 Turn Log Block (Timeline Entry)

**Purpose:** Individual service/turn entry in the timeline

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Width | 112px (flex-shrink-0) |
| Padding | 10px |
| Background | `#FFFFFF` |
| Border | 1px solid `#D1D5DB` |
| Border Radius | 8px |

**Layout:**

```
┌─────────────────┐
│ S:      $55.00  │
│                 │
│  09:30 AM       │
│  [cyan text]    │
│                 │
│ B:         1    │
│ [orange if >0]  │
│                 │
│ T:         1    │
│                 │
│  ┌─────────┐    │
│  │  Done   │    │
│  └─────────┘    │
└─────────────────┘
```

**Content Rows:**

| Row | Label | Value Style |
|-----|-------|-------------|
| Service Amount | "S:" gray-600 | 14px, 700 weight |
| Timestamp | N/A | 12px, 600 weight, cyan-600 |
| Bonus | "B:" orange-600 | 12px, 600 weight, orange-600 |
| Turn | "T:" gray-500 | 12px, 600 weight, gray-700 |

**Status Badge:**

| Type | Background | Text Color | Label |
|------|------------|------------|-------|
| Service | `#DCFCE7` | `#15803D` | "Done" |
| Checkout | `#DBEAFE` | `#1D4ED8` | "checkout" |
| Void | `#FEE2E2` | `#DC2626` | "void" |

Badge Styling: 12px, 500 weight, px-8px, py-2px, rounded-full

**States:**

| State | Appearance |
|-------|------------|
| Default | 1px gray-300 border |
| Hover | shadow-md, border-cyan-400 |
| Focused | ring-2 ring-cyan-500 |

---

### 4.5 Add Turn Button

**Purpose:** Quick-access to add turn adjustment

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Size | 40x40px |
| Background | transparent |
| Border | 2px dashed `#D1D5DB` |
| Border Radius | 8px |

**Layout:**

```
┌─────────┐
│         │
│    +    │
│         │
└─────────┘
```

**States:**

| State | Appearance |
|-------|------------|
| Default | dashed gray-300 border, gray-400 text |
| Hover | dashed cyan-500 border, bg-cyan-50, cyan-500 text |
| Active | solid cyan-500 border |

---

### 4.6 Footer Summary Bar

**Purpose:** Aggregate stats and legend

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Height | 52px (sm: 60px) |
| Background | `#FFFFFF` |
| Border Top | 1px solid `#E5E7EB` |
| Padding | 8px 12px (sm: 12px 24px) |

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  Total Staff: 8   Total Turns: 24   Revenue: $1,440.00     │
│                                     ■ Service ■ Checkout ■ Void │
└─────────────────────────────────────────────────────────────┘
```

**Stats Section:**

| Stat | Label Style | Value Style |
|------|-------------|-------------|
| Total Staff | 10px (sm: 12px), gray-500 | 16px (sm: 18px), 700 weight |
| Total Turns | 10px (sm: 12px), gray-500 | 16px (sm: 18px), 700 weight |
| Total Revenue | 10px (sm: 12px), gray-500 | 16px (sm: 18px), 700 weight, cyan-600 |

**Legend (Desktop Only):**

| Type | Indicator | Label |
|------|-----------|-------|
| Service | 12x12px green-100 bg, green-300 border | "Service" |
| Checkout | 12x12px blue-100 bg, blue-300 border | "Checkout" |
| Void | 12x12px red-100 bg, red-300 border | "Void" |

---

### 4.7 Manual Adjust Modal

**Purpose:** Add or subtract turns with required reason

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Size | Small (max-width 400px) |
| Z-Index | 90 (backdrop: 80) |
| Border Radius | 12px |

**Layout:**

```
┌────────────────────────────────────────┐
│  Adjust Turn for [Staff Name]      [×] │
├────────────────────────────────────────┤
│                                        │
│  Turn Amount                           │
│  ┌──────────────────────────────────┐  │
│  │ 1.0                       [▲][▼] │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Reason                                │
│  ○ Skip Turn                           │
│  ○ Appointment/Request                 │
│  ○ System Testing                      │
│  ○ Late                                │
│  ○ Other reason                        │
│     ┌──────────────────────────────┐   │
│     │ Type reason...               │   │
│     └──────────────────────────────┘   │
│                                        │
│  ┌──────────────┐ ┌──────────────┐     │
│  │   SUBTRACT   │ │     ADD      │     │
│  │   [red-500]  │ │  [green-500] │     │
│  └──────────────┘ └──────────────┘     │
│                                        │
│  ┌────────────────────────────────┐    │
│  │             SAVE               │    │
│  │         [cyan-500]             │    │
│  └────────────────────────────────┘    │
└────────────────────────────────────────┘
```

**Input Specifications:**

| Element | Style |
|---------|-------|
| Turn Amount Input | 48px height, 16px font, step=0.5 |
| Radio Buttons | cyan-600 accent, focus:ring-cyan-500 |
| Text Input | 44px height, appears when "Other" selected |

**Button Specifications:**

| Button | Background | Hover | Text |
|--------|------------|-------|------|
| SUBTRACT | `#EF4444` | `#DC2626` | white, 500 weight |
| ADD | `#22C55E` | `#16A34A` | white, 500 weight |
| SAVE | `#06B6D4` | `#0891B2` | white, 500 weight |

---

### 4.8 Receipt Modal

**Purpose:** Full receipt display for turn audit

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Size | Medium (max-width 500px) |
| Max Height | 80vh |
| Overflow | scroll |

**Content Sections:**

```
┌──────────────────────────────────────────┐
│  Receipt Details                     [×] │
├──────────────────────────────────────────┤
│                                          │
│  MANGO SALON                             │
│  123 Main St, City, State 12345          │
│  ──────────────────────────────────────  │
│                                          │
│  Transaction: #T-20251228-001            │
│  Date: Dec 28, 2025  09:30 AM            │
│  Staff: Zeus                             │
│  Client: John Doe                        │
│  ──────────────────────────────────────  │
│                                          │
│  Services:                               │
│  Haircut                        $35.00   │
│  Color Treatment                $55.00   │
│  ──────────────────────────────────────  │
│  Subtotal:                      $90.00   │
│  Tax:                            $7.65   │
│  ──────────────────────────────────────  │
│  Total:                         $97.65   │
│  ──────────────────────────────────────  │
│                                          │
│  Payment: Credit Card (Visa ****1234)    │
│  Points Earned: 97                       │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │             CLOSE                  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

### 4.9 Turn Logs Table

**Purpose:** Complete audit trail with filtering

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Size | Large (max-width 900px) |
| Max Height | 85vh |

**Table Columns:**

| Column | Width | Alignment |
|--------|-------|-----------|
| Date/Time | 150px | left |
| Accessed By | 120px | left |
| Action | 100px | center |
| Staff | 120px | left |
| Turn# | 80px | right |
| Reason | flex | left |

**Action Badges:**

| Action | Background | Text |
|--------|------------|------|
| ADD | `#DCFCE7` | `#15803D` |
| SUBTRACT | `#FEE2E2` | `#DC2626` |
| BONUS | `#FEF3C7` | `#92400E` |
| TARDY | `#FEE2E2` | `#DC2626` |

**Filter Bar:**

| Element | Style |
|---------|-------|
| Date Picker | 120px width |
| Staff Dropdown | 150px width |
| Action Dropdown | 120px width |
| Search | 200px flex |
| Export Button | cyan-500 bg |

---

### 4.10 Turn Settings Panel

**Purpose:** Configure turn system behavior

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Size | Medium (max-width 600px) |
| Max Height | 90vh |

**Sections:**

1. **Mode Selection**
   - Radio: Manual vs Auto
   - Icon: toggle switch visual

2. **Auto Mode - Ordering Method**
   - Radio group with descriptions
   - Options: Rotation, Service Count, Amount, Count By Amount

3. **Bonus Rules**
   - Checkbox: Appointment Bonus
   - Slider: Percentage (0-100%)
   - Checkbox: Walk-in Request

4. **Tardy Tracking**
   - Toggle: Enable/Disable
   - Number Input: Minutes threshold
   - Number Input: Turns per threshold
   - Number Input: Max penalty

5. **Turn Reasons**
   - Chip list with delete
   - Add new reason input

---

### 4.11 Staff Detail Panel

**Purpose:** Comprehensive staff turn breakdown

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Position | Slide-in from right |
| Width | 400px (full on mobile) |
| Height | Full viewport |

**Layout:**

```
┌──────────────────────────────────────┐
│  [←] Zeus                            │
├──────────────────────────────────────┤
│                                      │
│         [Avatar 80x80]               │
│                                      │
│  TURN BREAKDOWN                      │
│  ──────────────────────────────────  │
│  Service TURN:              2.0      │
│  Tech Bonus:               +0.5      │
│  Appt/Request:             +1.0      │
│  Tardy:                    -0.5      │
│  Adjusted:                 +0.5      │
│  Partial:                   0.0      │
│  ──────────────────────────────────  │
│  TOTAL TURN:               3.5       │
│                                      │
│  ┌────────────┐ ┌────────────┐       │
│  │  SUBTRACT  │ │    ADD     │       │
│  └────────────┘ └────────────┘       │
│                                      │
│  TURN HISTORY                        │
│  ──────────────────────────────────  │
│  [Timeline of adjustments]           │
│                                      │
└──────────────────────────────────────┘
```

**Metrics Breakdown:**

| Metric | Value Style | Positive | Negative |
|--------|-------------|----------|----------|
| Service TURN | normal | N/A | N/A |
| Tech Bonus | prefixed with + | green-600 | N/A |
| Appt/Request | prefixed with + | green-600 | N/A |
| Tardy | prefixed with - | N/A | red-600 |
| Adjusted | prefixed with +/- | green-600 | red-600 |
| Partial | normal | N/A | N/A |
| TOTAL | bold, larger | cyan-600 | N/A |

---

## 5. Interaction Patterns

### 5.1 Keyboard Navigation

| Key | Action |
|-----|--------|
| Escape | Close modal/panel |
| Arrow Down | Move to next staff row |
| Arrow Up | Move to previous staff row |
| Enter | Open staff detail panel |
| Tab | Move through interactive elements |

### 5.2 Mouse Interactions

| Element | Click | Hover |
|---------|-------|-------|
| Staff Row | Opens detail panel | bg-gray-100 |
| Turn Log Block | Opens receipt modal | shadow-md, border-cyan-400 |
| Add Button | Opens adjust modal | cyan accent |
| Header Icons | Respective actions | bg-cyan-700 |

### 5.3 Touch Gestures (Mobile)

| Gesture | Target | Action |
|---------|--------|--------|
| Tap | Staff Card | Expand/collapse |
| Long Press | Staff Card | Quick actions menu |
| Swipe Left | Staff Row | Reveal adjust button |
| Swipe Right | Staff Row | Reveal bonus button |
| Pull Down | Content Area | Refresh data |
| Horizontal Scroll | Timeline | View more turn logs |

### 5.4 Real-Time Updates

| Event | Visual Feedback |
|-------|-----------------|
| New Turn Added | Pulse animation on new block |
| Turn Adjusted | Highlight flash on affected row |
| Queue Order Changed | Smooth reorder animation (300ms) |
| Staff Clocked In | Slide-in from bottom |
| Staff Clocked Out | Fade-out (200ms) |

---

## 6. Loading & Empty States

### 6.1 Loading State

**Skeleton Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  [Header - Static]                                       │
├─────────────────┬────────────────────────────────────────┤
│  ┌────────────┐ │  ┌────┐ ┌────┐ ┌────┐                 │
│  │ ▢ ────     │ │  │ ▢  │ │ ▢  │ │ ▢  │  [shimmer]     │
│  │   ────     │ │  │    │ │    │ │    │                 │
│  │   ────     │ │  └────┘ └────┘ └────┘                 │
│  └────────────┘ │                                        │
├─────────────────┼────────────────────────────────────────┤
│  ┌────────────┐ │  ┌────┐ ┌────┐                        │
│  │ ▢ ────     │ │  │ ▢  │ │ ▢  │           [shimmer]   │
│  │   ────     │ │  │    │ │    │                        │
│  └────────────┘ │  └────┘ └────┘                        │
└─────────────────┴────────────────────────────────────────┘
```

**Skeleton Styling:**

| Element | Dimensions | Color |
|---------|------------|-------|
| Avatar | 40x40px circle | `#E5E7EB` |
| Name | 96px x 16px | `#E5E7EB` |
| Metrics | 64px x 12px | `#F3F4F6` |
| Turn Block | 64px x 64px | `#E5E7EB` |
| Animation | shimmer | 1.5s infinite |

### 6.2 Empty State

**Visual:**

```
┌──────────────────────────────────────────┐
│                                          │
│            ┌──────────────┐              │
│            │      👥      │              │
│            └──────────────┘              │
│         80x80 gray-100 circle            │
│                                          │
│        No Staff Clocked In               │
│        [18px, 600 weight]                │
│                                          │
│   Staff turn activities will appear      │
│   here once team members clock in        │
│   [14px, gray-500, max-w-xs]             │
│                                          │
└──────────────────────────────────────────┘
```

### 6.3 Error State

**Visual:**

```
┌──────────────────────────────────────────┐
│                                          │
│              ⚠️ [red-400]                │
│              64x64px                     │
│                                          │
│      Failed to load staff data           │
│      [18px, 500 weight, red-600]         │
│                                          │
│      Connection timeout                  │
│      [14px, gray-500]                    │
│                                          │
│      ┌────────────────────┐              │
│      │  🔄  Try Again     │              │
│      │   [cyan-500 bg]    │              │
│      └────────────────────┘              │
│                                          │
└──────────────────────────────────────────┘
```

---

## 7. Mobile Layout (< 768px)

### 7.1 Mobile Card Stack

```
┌────────────────────────────────────────┐
│  TURN TRACKER              [⋮] [×]    │
├────────────────────────────────────────┤
│                                        │
│  ┌────────────────────────────────┐   │
│  │ [Photo] ZEUS                   │   │
│  │         TURN: 2.50 (Next: 1st) │   │
│  │         Service: $90.00        │   │
│  │  ──────────────────────────    │   │
│  │  Latest Turns:                 │   │
│  │  • 09:30 AM - $55.00 (T:1)    │   │
│  │  • 11:15 AM - $35.00 (T:1)    │   │
│  │  [View All]      [Adjust]      │   │
│  └────────────────────────────────┘   │
│                                        │
│  ┌────────────────────────────────┐   │
│  │ [Photo] HERA                   │   │
│  │         TURN: 2.00 (Next: 2nd) │   │
│  │         Service: $75.00        │   │
│  │  ──────────────────────────    │   │
│  │  Latest Turns:                 │   │
│  │  • 10:00 AM - $45.00 (T:1)    │   │
│  │  • 12:30 PM - $30.00 (T:1)    │   │
│  │  [View All]      [Adjust]      │   │
│  └────────────────────────────────┘   │
│                                        │
├────────────────────────────────────────┤
│  Staff: 8  Turns: 24  $1,440.00       │
└────────────────────────────────────────┘
```

### 7.2 Mobile Card Specifications

| Property | Value |
|----------|-------|
| Card Width | 100% - 32px margin |
| Card Padding | 16px |
| Card Margin | 8px |
| Border Radius | 12px |
| Shadow | 0 1px 3px rgba(0,0,0,0.08) |

**Card Content:**

| Element | Style |
|---------|-------|
| Photo | 48x48px |
| Name | 16px, 700 weight |
| Queue Position | 14px, 500 weight, gray-600 |
| TURN Value | 16px, 700 weight, cyan-600 |
| Service Amount | 14px, 600 weight |
| Turn List | 12px, dot-prefixed |
| View All Button | text-cyan-600, underline |
| Adjust Button | cyan-500 bg, rounded-lg |

### 7.3 Mobile Bottom Sheet Modals

All modals slide up from bottom on mobile:

| Property | Value |
|----------|-------|
| Border Radius | 16px 16px 0 0 |
| Max Height | 85vh |
| Handle | 40px x 4px, gray-300, centered |

---

## 8. Accessibility

### 8.1 WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Color Contrast | 4.5:1 minimum for all text |
| Focus Indicators | 2px cyan-500 ring |
| Touch Targets | 44x44px minimum |
| Screen Reader | aria-labels on all interactive elements |
| Keyboard Nav | Full navigation without mouse |
| Motion | Respect prefers-reduced-motion |

### 8.2 ARIA Attributes

| Element | Attribute | Value |
|---------|-----------|-------|
| Modal | role | "dialog" |
| Modal | aria-modal | "true" |
| Staff List | role | "listbox" |
| Staff Row | role | "option" |
| View Toggle | aria-pressed | "true"/"false" |
| Close Button | aria-label | "Close turn tracker" |

### 8.3 Focus Management

| Scenario | Focus Target |
|----------|--------------|
| Modal Opens | First focusable element |
| Modal Closes | Trigger element |
| Row Selection | Selected row |
| Error State | Retry button |

---

## 9. Animation Specifications

### 9.1 Modal Animations

**Backdrop:**
```css
.backdrop {
  animation: fadeIn 200ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Modal:**
```css
.modal {
  animation: scaleIn 200ms ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 9.2 Content Animations

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Row Hover | 150ms | ease-out | Mouse enter |
| Card Press | 100ms | ease-in-out | Touch start |
| New Turn Pulse | 500ms | ease-in-out | Data update |
| Queue Reorder | 300ms | ease-out | Position change |
| Skeleton Shimmer | 1500ms | linear infinite | Loading |

### 9.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Queue Position Indicators

### 10.1 Next-in-Queue Badge

| Property | Value |
|----------|-------|
| Background | `#22C55E` |
| Text | "NEXT", white, 10px, 700 weight |
| Size | 36px x 16px |
| Border Radius | 8px |
| Position | Top-right of avatar |

### 10.2 Queue Number Badge

| Property | Value |
|----------|-------|
| Background | `#F3F4F6` |
| Text | "#2", gray-600, 10px, 600 weight |
| Border | 1px solid `#E5E7EB` |
| Size | 20px x 16px |
| Position | Top-right of avatar |

### 10.3 Status Indicators

| Status | Border | Badge | Description |
|--------|--------|-------|-------------|
| Next | 2px solid green-500 | "NEXT" green | First in queue |
| In Service | 2px solid blue-500 | "BUSY" blue | Currently serving |
| On Break | 2px solid yellow-500 | "BREAK" yellow | On break |
| Available | none | queue # | Waiting in queue |

---

## 11. Data Visualization

### 11.1 Turn Distribution Bar (Future)

**Purpose:** Visual fairness indicator

```
All Staff Turn Distribution:
Zeus    ████████████████████ 3.5 (35%)
Hera    ██████████████ 2.5 (25%)
Apollo  ████████████████ 2.0 (20%)
Diana   ████████████████ 2.0 (20%)
```

| Property | Value |
|----------|-------|
| Bar Height | 8px |
| Bar Radius | 4px |
| Background | `#E5E7EB` |
| Fill | cyan-500 gradient |

### 11.2 Fairness Score Indicator (Future)

```
Fairness Score: 92%
[█████████████████████████████░░░] 92/100
```

| Score Range | Color | Label |
|-------------|-------|-------|
| 90-100% | Green | "Excellent" |
| 75-89% | Yellow | "Good" |
| 50-74% | Orange | "Fair" |
| Below 50% | Red | "Needs Attention" |

---

## 12. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | December 28, 2025 | Initial design specification |

---

*Design Specification for Turn Tracker Module*
*Mango Biz - Unique Turn Management System*
