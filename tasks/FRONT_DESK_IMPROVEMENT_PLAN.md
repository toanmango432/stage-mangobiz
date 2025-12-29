# Front Desk Module: Expert Analysis & Improvement Plan

**Analyst:** Salon & Spa PM Expert
**Date:** December 28, 2025
**PRD Version Reviewed:** 1.1
**Status:** Strategic Improvement Plan

---

## Executive Summary

The Front Desk PRD is **comprehensive in documentation** (145 requirements) but has **critical functional gaps** that prevent it from being a world-class operations command center. The module excels at configurability but lacks essential real-time operational features that competitors like Fresha and MangoMint have perfected.

### Overall Assessment Score: **7.2/10**

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Documentation Completeness** | 9/10 | Excellent coverage of settings and technical specs |
| **Core Functionality** | 6/10 | Missing critical search, filtering, client identification |
| **UX Specifications** | 5/10 | Wireframes exist but lack micro-interaction details |
| **Competitive Parity** | 6/10 | Good differentiators, but missing table-stakes features |
| **Mobile Experience** | 7/10 | Good foundation, needs touch gesture refinement |
| **Offline Support** | 9/10 | Industry-leading, well-documented |

---

## Part 1: PRD Structure Critique

### Strengths

1. **Excellent requirement ID system** (FD-P0-xxx format) - enables traceability
2. **Clear priority tiers** (P0/P1/P2) with acceptance criteria
3. **Comprehensive technical specs** including TypeScript interfaces
4. **Business rules section** captures workflow logic
5. **Template system documentation** is thorough and practical

### Critical Weaknesses

#### 1. Missing User Journey Maps
**Problem:** No documented user flows for key scenarios
**Impact:** Developers build features without understanding the end-to-end experience

**Add these journey maps:**
```
JOURNEY 1: Saturday Rush Check-In (30-second flow)
Client arrives → Front desk spots them → Searches name → Taps Check-In → Client seated

JOURNEY 2: Walk-In Assignment (45-second flow)
Client walks in → Service selected → Turn Queue suggests staff → Confirm → Ticket created

JOURNEY 3: Service Completion (15-second flow)
Provider finishes → Taps "Done" → Ticket moves to Pending → Client directed to checkout
```

#### 2. No Micro-Interaction Specifications
**Problem:** Section 7 (UX Specs) has wireframes but lacks:
- Animation timing (easing, duration)
- Touch gesture responses (swipe to dismiss, long-press actions)
- Loading state transitions
- Error state behaviors

**Add this section:**
```markdown
### 7.7 Micro-Interactions

| Interaction | Trigger | Animation | Duration |
|-------------|---------|-----------|----------|
| Card check-in | Tap button | Slide right + fade, green flash | 300ms |
| Status change | Any status update | Color pulse, badge update | 200ms |
| Search filter | Typing | Instant filter, fade unmatched | 150ms |
| Long-wait alert | 10+ min waiting | Red pulse every 5s | 1000ms |
| New ticket arrival | WebSocket event | Slide in from right + chime | 400ms |
```

#### 3. Missing Accessibility Section
**Problem:** No WCAG compliance specifications
**Impact:** Legal risk, excludes users with disabilities

**Add Section 7.8:**
```markdown
### 7.8 Accessibility Requirements (WCAG 2.1 AA)

| Requirement | Specification |
|-------------|---------------|
| Color contrast | 4.5:1 minimum for text, 3:1 for UI elements |
| Focus indicators | 2px solid #2563EB on all interactive elements |
| Screen reader | All ticket cards have aria-label with client name, status, staff |
| Keyboard navigation | Tab order follows visual layout, Escape closes modals |
| Motion reduction | Respect prefers-reduced-motion, disable animations |
| Touch targets | Minimum 44x44px for all buttons |
```

#### 4. No Error State Documentation
**Problem:** What happens when things go wrong?
**Add to each section:**
- Network failure during check-in
- Conflict when two users edit same ticket
- Staff status sync failure
- Search returns no results

---

## Part 2: Competitive Feature Gap Analysis

### Features Mango is MISSING vs Competitors

| Feature | Fresha | MangoMint | Vagaro | Square | Mango | Priority |
|---------|--------|-----------|--------|--------|-------|----------|
| **Global ticket search** | ✅ | ✅ | ✅ | ✅ | ❌ | **P0** |
| **Service category tabs** | ✅ | ✅ | ✅ | ❌ | ❌ | **P0** |
| **Client photo on cards** | ✅ | ✅ | ✅ | ✅ | ❌ | **P0** |
| **Click-to-call from ticket** | ✅ | ✅ | ✅ | ✅ | ❌ | **P1** |
| **SMS from ticket** | ✅ | ✅ | ✅ | ❌ | ❌ | **P1** |
| **VIP badge display** | ✅ | ✅ | ✅ | ✅ | ❌ | **P1** |
| **New booking toast/sound** | ✅ | ✅ | ❌ | ❌ | ❌ | **P0** |
| **Long-wait visual alert** | ✅ | ✅ | ✅ | ❌ | ❌ | **P1** |
| **Estimated finish time** | ❌ | ✅ | ❌ | ❌ | ❌ | **P1** |
| **Multi-staff ticket view** | ✅ | ✅ | ✅ | ❌ | ⚠️ | P2 |
| **Quick rebook from card** | ✅ | ✅ | ❌ | ❌ | ❌ | P2 |

### Features Where Mango LEADS

| Feature | Description | Competitive Advantage |
|---------|-------------|----------------------|
| **Offline-first architecture** | Full functionality during outages | Only salon POS with this |
| **4 operation templates** | Pre-configured layouts | None have this |
| **42 configurable settings** | Deep customization | Fresha has ~15 |
| **Pending section footer** | Ambient checkout awareness | Unique approach |
| **Cross-tab sync** | Multi-device consistency | Few competitors do this |

---

## Part 3: UX/UI Specification Gaps

### 3.1 Ticket Card Design Issues

**Current state:** Basic cards with text info
**World-class standard:** Rich visual cards with client context

```
CURRENT CARD:
┌────────────────────┐
│ 10:00 AM           │
│ Jane Doe           │
│ Haircut            │
│ @ Sarah            │
│ [Check In]         │
└────────────────────┘

IMPROVED CARD:
┌────────────────────┐
│ 🕐 10:00 AM    ⭐VIP │  <- Time + VIP badge
│ ┌──┐ Jane Doe  NEW │  <- Photo + first-visit badge
│ └──┘ 📱 555-1234   │  <- Tap to call
│ ✂️ Haircut (45min)  │  <- Service icon + duration
│ 👤 Sarah           │  <- Staff with photo
│ 📝 "Allergic to..."│  <- Note preview
│ [Check In] [...]   │  <- Primary + overflow actions
└────────────────────┘
```

**Add to PRD Section 7.2:**
- Client photo: 40x40px circle, top-left
- VIP badge: Gold star, top-right
- First-visit badge: "NEW" pill, blue background
- Phone number: Tap to initiate call
- Service icon: Category-specific (scissors, nail polish, etc.)
- Note preview: First 30 chars, italicized
- Overflow menu: Edit, Reassign, Add Note, Cancel

### 3.2 Missing Visual States

**Add to Section 7.2 Ticket Card States:**

| State | Visual Treatment | Sound |
|-------|------------------|-------|
| **New arrival** | Blue pulse, slide-in animation | Soft chime |
| **Running late** | Yellow border, clock icon | None |
| **10+ min wait** | Red pulse every 5s | Optional alert |
| **Near completion** | Green progress bar | None |
| **Overdue** | Red background, exclamation icon | Warning tone |
| **Multi-provider** | Stacked staff photos | None |
| **Has notes** | Note icon, bottom-right | None |
| **Prepaid/Package** | Gift icon, shows remaining | None |

### 3.3 Staff Sidebar Improvements

**Current:** Basic status list
**Improved:** Rich staff cards with actionable context

```
IMPROVED STAFF CARD:
┌─────────────────────────────┐
│ 👤 Sarah Chen          ✅   │  <- Photo + name + status dot
│ ✂️ Hair Stylist              │  <- Specialty
│ ────────────────────────────│
│ NOW: Jane Doe - Balayage    │  <- Current client
│ ████████░░ 75% (12m left)   │  <- Progress with ETA
│ ────────────────────────────│
│ NEXT: 11:00 John S.         │  <- Upcoming appointment
│ ────────────────────────────│
│ Today: 5 clients • $420     │  <- Daily stats
│ Turn: 3rd                   │  <- Turn position
│ ────────────────────────────│
│ [+ Walk-In] [📋 View All]   │  <- Quick actions
└─────────────────────────────┘
```

### 3.4 Search Bar Specification

**Add as FD-P0-150:**

```markdown
### Global Search Bar

**Location:** Fixed header, left of view toggle
**Width:** 280px collapsed, 400px expanded on focus
**Placeholder:** "Search clients, tickets, phone..."

**Behavior:**
1. Type 2+ characters to trigger search
2. Results show in dropdown (max 8 items)
3. Results grouped: Clients (4), Tickets (4)
4. Each result shows: Name, phone, status, staff
5. Click result → scrolls to and highlights ticket
6. Keyboard: Arrow keys navigate, Enter selects, Escape clears

**Search scope:**
- Client name (fuzzy match)
- Phone number (partial match, last 4 digits)
- Ticket number
- Staff name (for filtering)
```

---

## Part 4: Prioritized Improvement Plan

### Phase 1: Critical Gaps (Week 1-2)

| ID | Feature | Effort | Impact | Details |
|----|---------|--------|--------|---------|
| IMP-001 | **Global ticket search** | Medium | HIGH | Search by name, phone, ticket # |
| IMP-002 | **Service category tabs** | Medium | HIGH | Filter tickets by Nails, Hair, Spa, etc. |
| IMP-003 | **Client photo display** | Small | HIGH | Show client photo on ticket cards |
| IMP-004 | **New booking notification** | Small | HIGH | Toast + optional sound on new ticket |

**Success criteria:** Front desk can find any client in < 3 seconds

### Phase 2: Client Context (Week 3)

| ID | Feature | Effort | Impact | Details |
|----|---------|--------|--------|---------|
| IMP-005 | **VIP/membership badge** | Small | Medium | Gold star for VIP, membership type badge |
| IMP-006 | **First-visit badge** | Small | Medium | "NEW" badge for first-time clients |
| IMP-007 | **Notes indicator** | Small | Medium | Note icon + preview on hover |
| IMP-008 | **Click-to-call** | Small | Medium | Phone icon, opens dialer |

**Success criteria:** Staff knows client history at a glance without opening details

### Phase 3: Real-Time Awareness (Week 4)

| ID | Feature | Effort | Impact | Details |
|----|---------|--------|--------|---------|
| IMP-009 | **Long-wait alerts** | Medium | HIGH | Visual pulse for 10+ min wait |
| IMP-010 | **Estimated finish time** | Medium | Medium | "Done ~11:30" based on progress |
| IMP-011 | **Running late indicator** | Small | Medium | Yellow for 5+ min past scheduled |
| IMP-012 | **Service progress calculation** | Medium | HIGH | Time-based % (not manual) |

**Success criteria:** Manager can identify bottlenecks from across the room

### Phase 4: Communication (Week 5)

| ID | Feature | Effort | Impact | Details |
|----|---------|--------|--------|---------|
| IMP-013 | **SMS from ticket** | Large | Medium | Pre-filled templates, quick send |
| IMP-014 | **Email from ticket** | Medium | Low | Basic email to client |
| IMP-015 | **Waitlist SMS notify** | Medium | Medium | "Your turn is coming up" |

**Success criteria:** Communication without leaving Front Desk

### Phase 5: Advanced Features (Week 6+)

| ID | Feature | Effort | Impact | Details |
|----|---------|--------|--------|---------|
| IMP-016 | **Quick rebook** | Medium | Medium | Book next appointment from done ticket |
| IMP-017 | **Split ticket** | Large | Low | Divide multi-service tickets |
| IMP-018 | **Merge tickets** | Large | Low | Combine client's tickets |
| IMP-019 | **Staff category filter** | Medium | Medium | Show only nail techs in sidebar |
| IMP-020 | **Next available time** | Medium | Medium | "Free at 11:30" for busy staff |

---

## Part 5: World-Class Front Desk Vision

### What Makes a 10/10 Front Desk Experience?

#### 1. **Zero-Friction Client Lookup**
- Type 2 letters → instant results
- Phone search with last 4 digits
- Face recognition for returning clients (future)
- Recent clients quick-access

#### 2. **Ambient Awareness**
- New bookings announce themselves (visual + audio)
- Long waits pulse red without needing to look closely
- Overdue services flash for attention
- Pending payments stay visible without being intrusive

#### 3. **Client Context at a Glance**
Every ticket card shows:
- Client photo (recognition speed)
- VIP/membership status (service expectation)
- Visit count (personalization level)
- Notes preview (allergies, preferences)
- Prepaid balance (if applicable)

#### 4. **Staff Empowerment**
- Staff see their own queue clearly
- Next client preview
- Daily progress metrics
- Fair turn distribution visible

#### 5. **One-Hand Operation**
- All actions reachable with thumb
- Swipe gestures for common actions
- No typing required for check-in
- Voice search (accessibility)

#### 6. **Manager Dashboard Mode**
- Bird's eye view of all stations
- Revenue per hour
- Wait time averages
- Staff utilization %
- Bottleneck identification

### Missing Features for 10/10

| Feature | Description | Priority |
|---------|-------------|----------|
| **Smart suggestions** | "Sarah usually does Jane's hair" | P2 |
| **Voice search** | "Check in Jane Doe" | P3 |
| **Capacity forecast** | "Busy 2-4pm based on bookings" | P2 |
| **Client check-in kiosk mode** | Clients self-check-in on iPad | P2 |
| **Two-way SMS in-app** | Full conversation view | P2 |
| **Photo upload** | Before/after from ticket | P2 |
| **Service time learning** | Adjust estimates based on history | P3 |

---

## Part 6: PRD Update Recommendations

### Sections to ADD

1. **Section 3.4: User Journey Maps** - Add 5 key journeys with timing
2. **Section 7.7: Micro-Interactions** - Animation and feedback specs
3. **Section 7.8: Accessibility (WCAG 2.1 AA)** - Compliance requirements
4. **Section 7.9: Error States** - What happens when things fail
5. **Section 12: Future Vision** - 12-month roadmap features

### Requirements to ADD

| ID | Requirement | Priority |
|----|-------------|----------|
| FD-P0-150 | Global search bar with instant filtering | P0 |
| FD-P0-151 | Search by last 4 digits of phone | P0 |
| FD-P0-152 | New ticket toast notification | P0 |
| FD-P0-153 | Optional audio chime for new tickets | P0 |
| FD-P1-154 | Long-wait visual pulse (10+ min) | P1 |
| FD-P1-155 | Estimated finish time display | P1 |
| FD-P1-156 | Running late indicator (5+ min) | P1 |
| FD-P1-157 | SMS quick-send from ticket | P1 |
| FD-P1-158 | Click-to-call from ticket | P1 |
| FD-P2-159 | Quick rebook from completed ticket | P2 |
| FD-P2-160 | Manager dashboard mode | P2 |

### Business Rules to ADD

| ID | Rule |
|----|------|
| FD-BR-031 | Search results prioritize exact phone match over name match |
| FD-BR-032 | Long-wait threshold configurable (default: 10 min) |
| FD-BR-033 | Audio notifications respect device mute settings |
| FD-BR-034 | Running late = scheduled time + 5 min grace period |
| FD-BR-035 | Estimated finish = start time + service duration - elapsed time |

---

## Summary: Top 10 Actions

| Priority | Action | Owner | Timeline |
|----------|--------|-------|----------|
| 1 | Implement global ticket search | Dev | Week 1 |
| 2 | Implement service category tabs | Dev | Week 1 |
| 3 | Add client photo to ticket cards | Dev | Week 2 |
| 4 | Add new booking notification | Dev | Week 2 |
| 5 | Add VIP/first-visit badges | Dev | Week 3 |
| 6 | Add long-wait visual alerts | Dev | Week 3 |
| 7 | Add click-to-call | Dev | Week 4 |
| 8 | Update PRD with journey maps | PM | Week 1 |
| 9 | Update PRD with accessibility specs | PM | Week 2 |
| 10 | Update PRD with micro-interactions | PM | Week 2 |

---

*Analysis completed by Salon & Spa PM Expert | December 28, 2025*
