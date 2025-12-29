# Design Specification: Sales & Checkout Module

**Version:** 1.0
**Last Updated:** December 28, 2025
**Status:** Approved
**Related PRD:** PRD-Sales-Checkout-Module.md

---

## Table of Contents

1. [Overview](#1-overview)
2. [Design Philosophy](#2-design-philosophy)
3. [Layout Architecture](#3-layout-architecture)
4. [Visual Components](#4-visual-components)
5. [Interaction Patterns](#5-interaction-patterns)
6. [Loading & Empty States](#6-loading--empty-states)
7. [Responsive Behavior](#7-responsive-behavior)
8. [Accessibility](#8-accessibility)
9. [Animation Specifications](#9-animation-specifications)
10. [Color System](#10-color-system)
11. [Typography](#11-typography)
12. [Mockups](#12-mockups)

---

## 1. Overview

The Checkout module uses a unique **staff-centric 2-panel design** optimized for salon workflows. Unlike service-first approaches, users select a staff member first, then add services—reducing errors and speeding up multi-staff transactions.

### Design Goals

| Goal | Description |
|------|-------------|
| **Speed** | Complete single-service checkout in < 90 seconds |
| **Clarity** | Staff assignments visible at a glance |
| **Flexibility** | Support 1-hand tablet operation |
| **Feedback** | Immediate visual response to all actions |
| **Recovery** | Easy undo/redo for mistakes |

---

## 2. Design Philosophy

### Core Principles

1. **Staff-Centric First** - Staff groups are the primary organizing unit
2. **Progressive Disclosure** - Show complexity only when needed
3. **Immediate Feedback** - Every action has visual confirmation
4. **Scannable Layouts** - Key info visible without scrolling
5. **Touch-Optimized** - All targets meet 44px minimum

### Visual Language

- **Clean & Modern** - Minimal chrome, generous whitespace
- **Soft Shadows** - Layered depth without harshness
- **Consistent Rounding** - 8px border radius throughout
- **Status Colors** - Semantic colors for service states

---

## 3. Layout Architecture

### 3.1 Overall Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
│  [×] Close    [Clear All]    [Dock/Full Toggle]    [? Shortcuts] │
├─────────────────────────────────┬────────────────────────────────┤
│  LEFT PANEL (Services/Staff)    │  RIGHT PANEL (InteractiveSummary)
│                                 │                                │
│  ┌───────────────────────────┐  │  ┌──────────────────────────┐  │
│  │ [Services] [Staff] Tabs   │  │  │ Client Section           │  │
│  └───────────────────────────┘  │  │ ┌────────────────────┐   │  │
│                                 │  │ │ Select client...   │   │  │
│  Category Sidebar (when Svc)    │  │ └────────────────────┘   │  │
│  ┌───────────────────────────┐  │  │                          │  │
│  │ All Services              │  │  │ ⚠️ ALLERGY ALERT         │  │
│  │ Hair                      │  │  └──────────────────────────┘  │
│  │ Nails                     │  │                                │
│  │ Spa                       │  │  ┌──────────────────────────┐  │
│  │ Facial                    │  │  │ Staff Groups             │  │
│  └───────────────────────────┘  │  │ ┌────────────────────┐   │  │
│                                 │  │ │ ◉ Sarah Johnson    │   │  │
│  Service Grid                   │  │ │   "Adding Here"    │   │  │
│  ┌─────┐ ┌─────┐ ┌─────┐       │  │ │ ├────────────────┤ │   │  │
│  │Svc 1│ │Svc 2│ │Svc 3│       │  │ │ │ Haircut   $65 │ │   │  │
│  └─────┘ └─────┘ └─────┘       │  │ │ └────────────────┘ │   │  │
│  ┌─────┐ ┌─────┐ ┌─────┐       │  │ └────────────────────┘   │  │
│  │Svc 4│ │Svc 5│ │Svc 6│       │  │                          │  │
│  └─────┘ └─────┘ └─────┘       │  │ ┌────────────────────────┐│  │
│                                 │  │ │ Subtotal    $185.00   ││  │
│                                 │  │ │ Tax          $15.73   ││  │
│                                 │  │ │ Total       $200.73   ││  │
│                                 │  │ │ [ Checkout Button ]   ││  │
│                                 │  │ └────────────────────────┘│  │
└─────────────────────────────────┴────────────────────────────────┘
```

### 3.2 Dimension Specifications

| Element | Dock Mode | Full Mode | Mobile |
|---------|-----------|-----------|--------|
| **Total Width** | 900px | 100vw | 100vw |
| **Left Panel** | 140px (collapsed) | flex | Hidden |
| **Right Panel** | 420px | 506px | 100vw |
| **Category Sidebar** | Hidden | 180px | Hidden |
| **Header Height** | 48px | 48px | 48px |
| **Footer Height** | 72px | 72px | 88px |

### 3.3 Grid System

```typescript
const gridConfig = {
  dockMode: {
    columns: 'grid-cols-[140px_1fr]',
    gap: '16px',
  },
  fullMode: {
    services: 'grid-cols-[180px_1fr_506px]',
    staff: 'grid-cols-[1fr_506px]',
    gap: '24px',
  },
  mobile: {
    columns: 'grid-cols-1',
    gap: '0',
  },
};
```

---

## 4. Visual Components

### 4.1 Header Component

**Purpose:** Navigation and global actions

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Height | 48px |
| Background | `var(--card)` / `#FFFFFF` |
| Border Bottom | `1px solid var(--border)` |
| Padding | `8px 12px` |
| Shadow | None |

**Elements:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [×]  New Ticket #A7F3             [Clear] [⬚/□] [?]            │
└─────────────────────────────────────────────────────────────────┘
  ↑     ↑                            ↑       ↑     ↑
  Close Ticket ID                    Clear   Mode  Help
  36x36 text-sm text-muted           Button  Toggle Button
```

| Element | Size | Color | Action |
|---------|------|-------|--------|
| Close Button | 36x36px | `text-muted-foreground` | Close checkout |
| Ticket Label | text-sm | `text-muted-foreground` | Display only |
| Clear Button | text-sm | `text-muted-foreground` | Clear all services |
| Mode Toggle | 36x36px | `text-muted-foreground` | Toggle dock/full |
| Help Button | 36x36px | `text-muted-foreground` | Show shortcuts |

**States:**

| State | Visual Change |
|-------|---------------|
| Default | As specified |
| Auto-hide (scroll) | `translateY(-48px)` over 200ms |
| Revealed (scroll up) | `translateY(0)` over 200ms |

---

### 4.2 Staff Group Card

**Purpose:** Display staff member with their assigned services

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Background | `#FFFFFF` |
| Border | `1px solid var(--border)` |
| Border Radius | 8px |
| Padding | 16px |
| Shadow | `0 1px 3px rgba(0,0,0,0.08)` |
| Min Height | 80px |

**Structure:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ◉ Sarah Johnson                                    [▼ Toggle]  │
│  ─────────────────────────────────────────────────────────────  │
│  │ Adding Services Here                                      │  │ ← Active indicator
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ✂️  Haircut - Women's                              $65.00 │ │ ← Service Row
│  │     60 min  •  [████████░░] 80%  •  In Progress          │ │
│  │     [Pause] [Complete]                          [⋮ More] │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Staff Subtotal: $65.00                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Header Row:**

| Element | Property | Value |
|---------|----------|-------|
| Active Indicator | Size | 8x8px circle |
| Active Indicator | Color (active) | `#22C55E` (green-500) |
| Active Indicator | Color (inactive) | `#D1D5DB` (gray-300) |
| Staff Name | Font | 16px / 600 weight |
| Staff Name | Color | `var(--foreground)` |
| Collapse Toggle | Size | 24x24px |

**Active Banner (shown when staff is active):**

| Property | Value |
|----------|-------|
| Background | `#DCFCE7` (green-100) |
| Text Color | `#166534` (green-800) |
| Font | 13px / 500 weight |
| Padding | 8px 12px |
| Border Radius | 4px |

**States:**

| State | Visual Change |
|-------|---------------|
| Default | As specified |
| Hover | Background: `#FAFAFA`, Shadow: `0 2px 6px rgba(0,0,0,0.1)` |
| Active (selected) | Border: `2px solid #22C55E`, shadow intensity increases |
| Collapsed | Services hidden, height reduced to header only |
| Dragging | `opacity: 0.8`, `scale: 1.02`, stronger shadow |

---

### 4.3 Service Row Component

**Purpose:** Display individual service within a staff group

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Background | `#F9FAFB` (gray-50) |
| Border | `1px solid var(--border)` |
| Border Radius | 6px |
| Padding | 12px |
| Min Height | 64px |

**Structure:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ✂️  Haircut - Women's                                   $65.00  │
│     60 min  •  [████████░░] 80%  •  In Progress                 │
│     [Pause] [Complete]                               [⋮ More]   │
└─────────────────────────────────────────────────────────────────┘
```

**Elements:**

| Element | Size | Color |
|---------|------|-------|
| Service Icon | 20x20px | Category-specific |
| Service Name | 14px / 500 weight | `var(--foreground)` |
| Price | 14px / 600 weight | `var(--foreground)` |
| Duration | 12px / 400 weight | `text-muted-foreground` |
| Progress Bar | 80px × 4px | Status color |
| Status Text | 12px / 500 weight | Status color |
| Action Buttons | 28px height | `var(--primary)` |

**Status Visual Treatment:**

| Status | Progress Color | Badge Color | Text |
|--------|---------------|-------------|------|
| Not Started | `#E5E7EB` (gray-200) | `#F3F4F6` bg, `#6B7280` text | "Not Started" |
| In Progress | `#3B82F6` (blue-500) | `#DBEAFE` bg, `#1D4ED8` text | "In Progress" |
| Paused | `#F59E0B` (amber-500) | `#FEF3C7` bg, `#B45309` text | "Paused" |
| Completed | `#22C55E` (green-500) | `#DCFCE7` bg, `#166534` text | "Completed" |

**States:**

| State | Visual Change |
|-------|---------------|
| Default | As specified |
| Hover | Background: `#F3F4F6`, border darkens slightly |
| Editing Price | Price field becomes input, border: `2px solid var(--primary)` |
| Selected (bulk) | Left border: `3px solid var(--primary)`, check icon shows |
| Dragging | `opacity: 0.9`, `scale: 1.02`, shadow increases |

---

### 4.4 Client Section Component

**Purpose:** Select/display client and show alerts

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Background | `#FFFFFF` |
| Border | `1px solid var(--border)` |
| Border Radius | 8px |
| Padding | 12px |

**Client Selector (empty):**

```
┌─────────────────────────────────────────────────────────────────┐
│  👤  Select client or walk-in...                          [▼]   │
└─────────────────────────────────────────────────────────────────┘
```

**Client Selected:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌────┐  Jane Doe                                         [×]   │
│  │ JD │  📱 (555) 123-4567  •  12 visits  •  $1,240 total       │
│  └────┘                                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Alert Banners:**

| Alert Type | Background | Border | Icon | Text Color |
|------------|------------|--------|------|------------|
| Allergy | `#FEE2E2` (red-100) | `#EF4444` (red-500) | ⚠️ | `#991B1B` (red-800) |
| Notes | `#FEF3C7` (amber-100) | `#F59E0B` (amber-500) | 📝 | `#92400E` (amber-800) |
| Balance | `#FFEDD5` (orange-100) | `#F97316` (orange-500) | 💳 | `#9A3412` (orange-800) |

**Allergy Alert Structure:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️  ALLERGY ALERT                                          [×]  │
│ Allergic to: Latex, Certain hair dyes (PPD)                     │
│ [I Acknowledge]                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.5 Checkout Summary Component

**Purpose:** Display totals and initiate checkout

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Background | `#FFFFFF` |
| Border | `1px solid var(--border)` |
| Border Radius | 8px |
| Padding | 16px |
| Position | Sticky bottom |

**Structure:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Subtotal                                              $185.00  │
│  Discount                                               -$20.00 │
│  Tax (8.5%)                                             $14.03  │
│  ─────────────────────────────────────────────────────────────  │
│  Total                                                 $179.03  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      Checkout                             │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Typography:**

| Element | Font | Color |
|---------|------|-------|
| Labels | 14px / 400 weight | `text-muted-foreground` |
| Values | 14px / 500 weight | `var(--foreground)` |
| Discount | 14px / 500 weight | `#22C55E` (green) |
| Total Label | 16px / 600 weight | `var(--foreground)` |
| Total Value | 20px / 700 weight | `var(--foreground)` |

**Checkout Button:**

| Property | Value |
|----------|-------|
| Height | 48px |
| Background | `var(--primary)` |
| Text | 16px / 600 weight, white |
| Border Radius | 8px |
| Min Width | 100% |

---

### 4.6 Payment Modal Component

**Purpose:** Multi-step payment flow

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Width | 480px (desktop), 100% (mobile) |
| Max Height | 90vh |
| Background | `#FFFFFF` |
| Border Radius | 12px |
| Backdrop | `rgba(0, 0, 0, 0.5)` |
| Shadow | `0 20px 25px -5px rgba(0, 0, 0, 0.1)` |

**Step 1: Tip Selection**

```
┌─────────────────────────────────────────────────────────────────┐
│ Checkout                                                   [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Add Tip                                                │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │   18%   │  │   20%   │  │   22%   │  │ No Tip  │           │
│  │  $32.28 │  │  $35.86 │  │  $39.45 │  │   $0    │           │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Custom: $________                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Selected: 20% = $35.86                                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                    [Continue to Payment →]      │
└─────────────────────────────────────────────────────────────────┘
```

**Tip Button Specifications:**

| Property | Value |
|----------|-------|
| Size | 80px × 64px |
| Background (default) | `#F3F4F6` |
| Background (selected) | `var(--primary)` |
| Border Radius | 8px |
| Percentage Text | 16px / 600 weight |
| Amount Text | 12px / 400 weight |

**Step 2: Payment Method**

```
┌─────────────────────────────────────────────────────────────────┐
│ Checkout                                                   [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 2: Payment Method                                         │
│                                                                 │
│  Total Due: $215.89                                             │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │   💳    │  │   💵    │  │   🎁    │  │   ✓✓    │           │
│  │  Card   │  │  Cash   │  │Gift Card│  │  Split  │           │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │        Ready for Tap to Pay                             │   │
│  │                                                         │   │
│  │           📱                                            │   │
│  │                                                         │   │
│  │     Have client tap their card on the device            │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [← Back]                           [Process Payment $215.89]   │
└─────────────────────────────────────────────────────────────────┘
```

**Payment Method Buttons:**

| Property | Value |
|----------|-------|
| Size | 72px × 72px |
| Background (default) | `#F9FAFB` |
| Background (selected) | `#EFF6FF` (blue-50) |
| Border (selected) | `2px solid var(--primary)` |
| Icon Size | 28px |
| Label | 12px / 500 weight |

---

### 4.7 Tip Distribution Component

**Purpose:** Preview tip allocation across staff

**Visual Specifications:**

| Property | Value |
|----------|-------|
| Background | `#F9FAFB` |
| Border | `1px solid var(--border)` |
| Border Radius | 8px |
| Padding | 16px |

**Structure:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Tip Distribution                              [Auto ▼]         │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Total Tip: $35.86                                              │
│                                                                 │
│  Sarah Johnson    $185.00 services    →    $21.82  (60.8%)      │
│  ████████████████████░░░░░░░░░░░░░░░░                           │
│                                                                 │
│  Mike Chen        $115.00 services    →    $14.04  (39.2%)      │
│  ████████████████░░░░░░░░░░░░░░░░░░░░                           │
│                                                                 │
│  [Edit Distribution]                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Progress Bar:**

| Property | Value |
|----------|-------|
| Height | 8px |
| Background | `#E5E7EB` |
| Fill Color | `var(--primary)` |
| Border Radius | 4px |

---

## 5. Interaction Patterns

### 5.1 Service Addition Flow

```
User taps service card
        ↓
Service appears in active staff group (300ms slide-in)
        ↓
Total updates immediately
        ↓
Success haptic (mobile) / checkmark flash (300ms)
```

### 5.2 Staff Switching

```
User taps different staff card
        ↓
Previous staff loses "active" indicator (200ms)
        ↓
New staff gains "active" indicator + green border (200ms)
        ↓
"Adding Services Here" banner appears (250ms slide-down)
```

### 5.3 Drag & Drop Reordering

```
User long-presses service row (500ms)
        ↓
Service lifts (scale: 1.02, shadow increase)
        ↓
Ghost placeholder appears in original position
        ↓
User drags to new position
        ↓
Other items shift to make room (200ms)
        ↓
Drop: service settles into position (150ms)
```

### 5.4 Touch Gestures

| Gesture | Target | Action | Feedback |
|---------|--------|--------|----------|
| Tap | Service card | Add to active staff | Ripple + haptic |
| Tap | Staff group header | Set as active | Border highlight |
| Long press | Service row | Enable drag | Lift + haptic |
| Swipe left | Service row | Reveal delete | Red background slides in |
| Swipe right | Service row | Mark complete | Green checkmark |
| Pinch | Payment modal | Dismiss | Scale + fade out |

### 5.5 Keyboard Shortcuts

| Key | Action | Visual Feedback |
|-----|--------|-----------------|
| `?` | Show shortcuts | Modal appears (300ms) |
| `Ctrl+K` | Search services | Search input focuses, overlay shows |
| `Ctrl+Z` | Undo | Toast: "Undo: [action]" |
| `Ctrl+Shift+Z` | Redo | Toast: "Redo: [action]" |
| `Esc` | Close modal/panel | Modal slides out (200ms) |
| `Enter` | Confirm/proceed | Button activates |
| `Tab` | Next field | Focus ring moves |

---

## 6. Loading & Empty States

### 6.1 Initial Load

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              ┌─────────────────────────────────┐               │
│              │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← Shimmer      │
│              │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │    animation   │
│              │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │                │
│              └─────────────────────────────────┘               │
│                                                                 │
│              Loading checkout...                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Skeleton Specifications:**

| Property | Value |
|----------|-------|
| Background | `linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)` |
| Animation | `shimmer 1.5s infinite` |
| Border Radius | Matches component |

### 6.2 Empty Cart State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          🛒                                     │
│                                                                 │
│                   No services added yet                         │
│                                                                 │
│           Select a service from the menu to begin               │
│                                                                 │
│                  [Browse Services]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Element | Value |
|---------|-------|
| Icon Size | 48px |
| Icon Color | `#9CA3AF` (gray-400) |
| Title | 16px / 600 weight, `var(--foreground)` |
| Description | 14px / 400 weight, `text-muted-foreground` |
| Button | Secondary variant |

### 6.3 No Search Results

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          🔍                                     │
│                                                                 │
│              No services matching "xyzabc"                      │
│                                                                 │
│              Try a different search term                        │
│                                                                 │
│                  [Clear Search]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Payment Processing

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      ⏳                                         │
│                  (spinning)                                     │
│                                                                 │
│              Processing payment...                              │
│                                                                 │
│              Please wait, do not close                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.5 Payment Success

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      ✓                                          │
│                  (animated)                                     │
│                                                                 │
│               Payment Successful!                               │
│                                                                 │
│              Transaction #TXN-2025-A7F3                         │
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                         │
│  │  Print  │  │  Email  │  │   SMS   │                         │
│  └─────────┘  └─────────┘  └─────────┘                         │
│                                                                 │
│                    [Done]                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.6 Payment Error

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      ❌                                         │
│                                                                 │
│               Payment Declined                                  │
│                                                                 │
│        Your card was declined. Please try again                 │
│        or use a different payment method.                       │
│                                                                 │
│  ┌─────────┐  ┌─────────────┐  ┌─────────┐                     │
│  │  Retry  │  │ Different   │  │  Cash   │                     │
│  │         │  │    Card     │  │         │                     │
│  └─────────┘  └─────────────┘  └─────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Element | Color |
|---------|-------|
| Error Icon | `#EF4444` (red-500) |
| Title | `#991B1B` (red-800) |
| Description | `#7F1D1D` (red-900) |

---

## 7. Responsive Behavior

### 7.1 Breakpoint Definitions

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom sheets |
| Tablet | 640px - 1024px | 2-column dock |
| Desktop | > 1024px | Full 3-column or 2-column |

### 7.2 Mobile Adaptations

**Layout:**

```
┌─────────────────────────────┐
│  Header (fixed)             │
├─────────────────────────────┤
│                             │
│  Client Section             │
│                             │
├─────────────────────────────┤
│                             │
│  Staff Groups               │
│  (scrollable)               │
│                             │
│                             │
├─────────────────────────────┤
│  ┌───────────────────────┐ │
│  │ Add Service           │ │ ← FAB opens bottom sheet
│  └───────────────────────┘ │
├─────────────────────────────┤
│  Summary Footer (sticky)    │
│  Total: $185.00 [Checkout]  │
└─────────────────────────────┘
```

**Component Changes:**

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Service Grid | Visible in panel | Bottom sheet |
| Staff Tab | Tab switcher | Hidden (default services) |
| Category Sidebar | 180px fixed | Horizontal scroll tabs |
| Payment Modal | 480px modal | Full-screen sheet |
| Tip Buttons | 80px grid | 100% width stack |

### 7.3 Touch Targets

| Element | Minimum Size | Recommended |
|---------|--------------|-------------|
| Buttons | 44x44px | 48x48px |
| List items | 44px height | 56px height |
| Icons | 24x24px tap area | 44x44px tap area |
| Form inputs | 44px height | 48px height |

---

## 8. Accessibility

### 8.1 WCAG 2.1 AA Requirements

| Requirement | Specification |
|-------------|---------------|
| Color Contrast | 4.5:1 minimum for text, 3:1 for UI elements |
| Focus Indicators | 2px solid `#2563EB` (blue-600) outline, 2px offset |
| Screen Reader | aria-labels on all interactive elements |
| Keyboard Navigation | Tab order follows visual layout |
| Motion Reduction | Respect `prefers-reduced-motion` |
| Touch Targets | 44x44px minimum |

### 8.2 Focus Indicators

```css
:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
  border-radius: 4px;
}
```

### 8.3 Screen Reader Labels

| Element | aria-label |
|---------|------------|
| Close button | "Close checkout" |
| Service card | "{service name}, {price}, {duration}" |
| Staff group | "{staff name}, {service count} services, {subtotal}" |
| Status badge | "Status: {status name}" |
| Tip button | "{percentage} tip, {amount}" |
| Payment button | "Pay {amount} with {method}" |

### 8.4 Motion Preferences

```typescript
const animation = {
  reduced: {
    duration: 0,
    transform: 'none',
  },
  normal: {
    duration: '200ms',
    transform: 'translateY(-2px)',
  },
};

// Usage
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Animation Specifications

### 9.1 Easing Functions

| Name | Value | Use Case |
|------|-------|----------|
| Standard | `cubic-bezier(0.4, 0, 0.2, 1)` | Most transitions |
| Decelerate | `cubic-bezier(0, 0, 0.2, 1)` | Entrances |
| Accelerate | `cubic-bezier(0.4, 0, 1, 1)` | Exits |
| Spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bounce effects |

### 9.2 Animation Durations

| Type | Duration |
|------|----------|
| Micro (feedback) | 100ms |
| Fast (UI response) | 200ms |
| Normal (transitions) | 300ms |
| Slow (entrances) | 400ms |
| Complex (modals) | 500ms |

### 9.3 Specific Animations

**Service Add:**
```css
@keyframes service-add {
  0% {
    opacity: 0;
    transform: translateX(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
/* Duration: 300ms, easing: decelerate */
```

**Card Hover:**
```css
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Progress Bar Fill:**
```css
.progress-fill {
  transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Modal Enter:**
```css
@keyframes modal-enter {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
/* Duration: 300ms, easing: spring */
```

**Success Check:**
```css
@keyframes success-check {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
/* Duration: 500ms, easing: spring */
```

---

## 10. Color System

### 10.1 Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | `#FFFFFF` | `#09090B` | Page background |
| `--foreground` | `#09090B` | `#FAFAFA` | Primary text |
| `--card` | `#FFFFFF` | `#09090B` | Card backgrounds |
| `--card-foreground` | `#09090B` | `#FAFAFA` | Card text |
| `--primary` | `#2563EB` | `#3B82F6` | Primary actions |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on primary |
| `--muted` | `#F4F4F5` | `#27272A` | Muted backgrounds |
| `--muted-foreground` | `#71717A` | `#A1A1AA` | Secondary text |
| `--border` | `#E4E4E7` | `#27272A` | Borders |
| `--destructive` | `#EF4444` | `#EF4444` | Destructive actions |

### 10.2 Status Colors

| Status | Background | Border | Text |
|--------|------------|--------|------|
| Not Started | `#F3F4F6` | `#E5E7EB` | `#6B7280` |
| In Progress | `#DBEAFE` | `#3B82F6` | `#1D4ED8` |
| Paused | `#FEF3C7` | `#F59E0B` | `#B45309` |
| Completed | `#DCFCE7` | `#22C55E` | `#166534` |

### 10.3 Alert Colors

| Alert Type | Background | Border | Icon/Text |
|------------|------------|--------|-----------|
| Allergy | `#FEE2E2` | `#EF4444` | `#991B1B` |
| Notes | `#FEF3C7` | `#F59E0B` | `#92400E` |
| Balance | `#FFEDD5` | `#F97316` | `#9A3412` |
| Success | `#DCFCE7` | `#22C55E` | `#166534` |
| Error | `#FEE2E2` | `#EF4444` | `#991B1B` |

---

## 11. Typography

### 11.1 Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### 11.2 Type Scale

| Name | Size | Weight | Line Height | Use |
|------|------|--------|-------------|-----|
| Display | 24px | 700 | 1.2 | Modal titles |
| Title | 18px | 600 | 1.3 | Section headers |
| Heading | 16px | 600 | 1.4 | Card headers |
| Body | 14px | 400 | 1.5 | Body text |
| Body Medium | 14px | 500 | 1.5 | Emphasized body |
| Small | 12px | 400 | 1.4 | Secondary info |
| Caption | 11px | 500 | 1.3 | Labels, badges |

### 11.3 Application

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Modal Title | 24px | 700 | `var(--foreground)` |
| Staff Name | 16px | 600 | `var(--foreground)` |
| Service Name | 14px | 500 | `var(--foreground)` |
| Price | 14px | 600 | `var(--foreground)` |
| Duration | 12px | 400 | `text-muted-foreground` |
| Status Badge | 11px | 500 | Status color |
| Total Label | 16px | 600 | `var(--foreground)` |
| Total Value | 20px | 700 | `var(--foreground)` |

---

## 12. Mockups

### 12.1 Desktop - Full Mode

Reference: `docs/modules/checkout/CHECKOUT_UI_ANALYSIS.md` Section 1

### 12.2 Desktop - Dock Mode

Reference: `docs/modules/checkout/CHECKOUT_UI_ANALYSIS.md` Section 1

### 12.3 Mobile - Main View

```
┌─────────────────────────────┐
│ [×] New Ticket #A7F3    [?] │
├─────────────────────────────┤
│ 👤  Jane Doe                │
│ 📱 (555) 123-4567           │
├─────────────────────────────┤
│                             │
│ ◉ Sarah Johnson             │
│ ┌─────────────────────────┐ │
│ │ Haircut         $65.00  │ │
│ │ In Progress             │ │
│ └─────────────────────────┘ │
│                             │
│ ○ Mike Chen                 │
│ ┌─────────────────────────┐ │
│ │ Color           $120.00 │ │
│ │ Not Started             │ │
│ └─────────────────────────┘ │
│                             │
│         [+ Add Service]     │
│                             │
├─────────────────────────────┤
│ Total: $185.00  [Checkout]  │
└─────────────────────────────┘
```

### 12.4 Mobile - Payment Bottom Sheet

```
┌─────────────────────────────┐
│         ─────               │ ← Drag handle
│                             │
│  Add Tip                    │
│                             │
│ ┌─────────────────────────┐ │
│ │ 18%               $33.30│ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 20%               $37.00│ │ ← Selected
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 22%               $40.70│ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ No Tip                  │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │        Continue         │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

---

## Appendix

### A. Related Documents

| Document | Purpose |
|----------|---------|
| [PRD-Sales-Checkout-Module.md](../product/PRD-Sales-Checkout-Module.md) | Feature requirements |
| [CHECKOUT_UI_ANALYSIS.md](../modules/checkout/CHECKOUT_UI_ANALYSIS.md) | Current implementation |
| [PAYMENT_INTEGRATION.md](../architecture/PAYMENT_INTEGRATION.md) | Payment SDK details |
| [PREMIUM_FRONT_DESK_DESIGN.md](./PREMIUM_FRONT_DESK_DESIGN.md) | Design system reference |

### B. Component File Locations

| Component | Path |
|-----------|------|
| TicketPanel | `src/components/checkout/TicketPanel.tsx` |
| InteractiveSummary | `src/components/checkout/InteractiveSummary.tsx` |
| StaffGroup | `src/components/checkout/StaffGroup.tsx` |
| ServiceRow | `src/components/checkout/ServiceRow.tsx` |
| PaymentModal | `src/components/checkout/PaymentModal.tsx` |
| TipDistribution | `src/components/checkout/TipDistribution.tsx` |
| ClientAlerts | `src/components/checkout/ClientAlerts.tsx` |

### C. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 28, 2025 | Initial design specification |

---

*Design Specification Version: 1.0 | Updated: December 28, 2025*
