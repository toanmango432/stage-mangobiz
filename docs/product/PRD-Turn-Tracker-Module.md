# Product Requirements Document (PRD)
## Turn Tracker Module - Mango Biz Store App

**Version:** 1.0  
**Date:** October 24, 2025  
**Status:** Draft for Implementation  
**Target Release:** Phase 2 (Post-MVP)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Overview
The Turn Tracker Module is a comprehensive turn management and audit system for salon managers to monitor, analyze, and adjust staff turn queues with complete visibility into turn distribution, historical performance, and real-time queue status.

### 1.2 Success Metrics
- Reduce turn disputes by 90%
- Manager adoption of 80%+ within 30 days
- Mobile usage of 40%+ of sessions
- Average setup time < 15 minutes
- Staff satisfaction with turn fairness increases by 30%

---

## 2. USER PERSONAS

### Primary User: Salon Manager/Owner
- **Age:** 30-55
- **Device:** Desktop (70%), Mobile (30%)
- **Goals:** Monitor turns, resolve disputes, ensure fairness, track performance
- **Pain Points:** Manual tracking, staff disputes, no historical data, can't monitor remotely

### Secondary User: Staff/Technician
- Primarily uses Turn Queue in Salon Center (not Turn Tracker)
- Benefits from clear visibility and system fairness
- **Future:** Staff-facing dashboard to view their own metrics

---

## 3. CORE FEATURES

### 3.1 Staff Summary Cards

**Desktop - Detailed View:**
- Profile photo (40x40px)
- Name, Clock-in time
- Bonus turns, Adjust turns
- Service total, TURN count
- Vertical order = Queue order

**Desktop - Compact View:**
- Profile photo (32x32px)
- Name, Service total, TURN count
- For 20+ staff overview

**Mobile View:**
- Vertical card stack
- Last 2-3 turns inline
- "View All" and "Adjust" buttons
- Swipe actions for quick access

---

### 3.2 Turn Log Blocks (Timeline)

**Structure:**
```
S: $55.00    ← Service amount
09:30 AM     ← Timestamp (cyan)
B: 1         ← Bonus (orange, if applicable)
T: 1         ← Turn count
```

**Behavior:**
- Horizontal scroll (oldest → newest)
- Click → Opens receipt modal
- Shows complete service history

---

### 3.3 Receipt Modal

**Purpose:** Proof/audit trail for turn counting

**Content:**
- Full receipt display
- Service breakdown with tech assignment
- Payment details
- Points earned
- Close button

---

### 3.4 Turn Logs Table

**Purpose:** Complete audit trail of all turn changes

**Columns:**
- DATE/TIME | ACCESSED BY | ACCESSED | ACTION | TECH | TURN# | REASON

**Features:**
- Filter by date, staff, action type
- Search by ticket/customer
- Sort by any column
- Export to CSV/PDF
- Mobile: Card layout

---

### 3.5 Turn Settings Panel

**Mode Selection:**
- **Manual:** Manager assigns manually
- **Auto:** System assigns based on rules

**Auto Mode - Turn Ordering:**
1. **Rotation** - Round-robin (complete → bottom)
2. **Service Turn Count** - Lowest count goes first
3. **Amount** - Lowest revenue goes first
4. **Count By Amount** - Revenue threshold per turn
5. **Count By Menu Setting** - Service-specific weights

**Bonus Rules:**
- Tech Appointment Bonus (configurable %)
- Walk-in Request rules
- Partial turn in queue order

**Tardy Tracking:**
- Enable/disable
- Minutes threshold × Turns penalty
- Max penalty cap

**Turn Reasons:**
- Customizable list for adjustments
- Default: System Testing, Appointment, Request, Skip Turn, Late, Others

---

### 3.6 Manual Adjustment Modals

**Add/Adjust Turn:**
- Turn amount input (can be decimal)
- Reason (required, dropdown + custom)
- [SUBTRACT] [ADD] buttons
- Logs action immediately

**Bonus Turn:**
- Positive values only
- Different reason options
- Adds to "Bonus" metric

---

### 3.7 Staff Detail Panel

**Metrics Breakdown:**
- Service Total, Service TURN
- Tardy, Tech Bonus
- Appt/Request, Partial, Adjusted
- **Formula:** `TURN = Service TURN + Tech Bonus + Appt/Request - Tardy + Adjusted`

**Actions:**
- View History Adjust Turn
- [SUBTRACT] [ADD] buttons

---

## 4. MOBILE OPTIMIZATION

### 4.1 Mobile Layout (< 768px)

**Vertical Card Stack:**
```
[Photo] ZEUS
        TURN: 1.00 (Next: 3rd)
        Service: $90.00
        ─────────────────
        Latest Turns:
        • 09:30 AM - $55.00 (T:1)
        • 11:15 AM - $35.00 (T:1)
        [View All] [Adjust]
```

**Interactions:**
- Tap card → Expand/collapse
- Long-press → Quick actions
- Swipe left → Adjust
- Swipe right → Bonus
- Pull-to-refresh
- Bottom sheet modals

---

## 5. DATA MODEL

### 5.1 StaffTurnData
```typescript
interface StaffTurnData {
  id: string;
  name: string;
  photo?: string;
  clockInTime: Date;
  serviceTurn: number;        // Completed services
  bonusTurn: number;          // Bonuses
  adjustTurn: number;         // Manual adjustments
  tardyTurn: number;          // Penalties
  appointmentTurn: number;    // Appointment bonuses
  partialTurn: number;        // Partial adjustments
  totalTurn: number;          // Calculated total
  queuePosition: number;      // Position in queue
  serviceTotal: number;       // Revenue
  turnLogs: TurnLogEntry[];   // History
}
```

### 5.2 TurnLogEntry
```typescript
interface TurnLogEntry {
  id: string;
  timestamp: Date;
  ticketId?: string;
  serviceName?: string;
  actionType: string;
  turnAmount: number;         // 0, 0.5, 1, 1.5
  bonusAmount: number;
  serviceAmount: number;
  reason: string;
  accessedBy: string;
  staffId: string;
  staffName: string;
}
```

### 5.3 TurnSettings
```typescript
interface TurnSettings {
  mode: 'manual' | 'auto';
  orderingMethod: 'rotation' | 'service-count' | 'amount' | 'count-by-amount';
  countByAmountThreshold?: number;
  useMenuTurnWeight: boolean;
  completeTurnAtDone: boolean;
  appointmentBonus: { enabled: boolean; percentage: number; };
  walkInRequestBonus: { enabled: boolean; percentage: number; dontCountTowardTurn: boolean; };
  applyPartialTurnInQueue: boolean;
  tardy: { enabled: boolean; minutesThreshold: number; turnsPerThreshold: number; maxTurns: number; };
  turnReasons: string[];
}
```

---

## 6. ENHANCEMENTS (Future Phases)

### 6.1 Onboarding & Setup
- **Preset Templates:** "Simple Rotation", "Fair Revenue", "Appointment Priority"
- **Setup Wizard:** Step-by-step configuration
- **Smart Defaults:** Auto-suggest turn weights based on service duration
- **Bulk Edit:** Edit multiple services at once
- **Template Library:** Industry-standard configurations

### 6.2 Staff-Facing Dashboard
- Simplified view showing "You're #3 in line"
- Personal metrics (turns today, revenue, bonuses)
- Explanation of why they're in their position
- Push notifications ("You're next!")

### 6.3 AI Suggestions
- Analyze service duration → suggest turn weight
- Detect patterns → recommend bonus rules
- Identify fairness issues → suggest adjustments

### 6.4 Advanced Analytics
- Turn distribution charts
- Revenue per turn analysis
- Staff performance trends
- Fairness score metrics

---

## 7. TECHNICAL REQUIREMENTS

### 7.1 Performance
- Initial load: < 2 seconds
- Real-time updates: < 1 second
- View toggle: < 200ms
- Support 100+ staff, 1000+ logs/day

### 7.2 Responsive Breakpoints
- Desktop: ≥ 1024px (Detailed view)
- Tablet: 768-1023px (Compact view)
- Mobile: < 768px (Vertical cards)

### 7.3 Browser Support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- iOS Safari 14+, Chrome Mobile 90+

### 7.4 Data Persistence
- LocalStorage: View preferences, filters
- Backend: Real-time sync with retry
- Offline: View cached data, queue adjustments

---

## 8. SUCCESS CRITERIA

### 8.1 Launch Criteria
- ✅ All core features implemented
- ✅ Mobile responsive working
- ✅ Turn logs tracking correctly
- ✅ Manual adjustments with audit trail
- ✅ At least 2 turn system modes working
- ✅ Performance benchmarks met

### 8.2 Post-Launch Metrics (30 days)
- Manager adoption rate > 80%
- Turn disputes reduced by > 70%
- Mobile usage > 30%
- Average session time: 3-5 minutes
- User satisfaction score > 4.2/5

---

## 9. IMPLEMENTATION PHASES

### Phase 1: Core Features (Week 1-2)
- Staff summary cards (desktop)
- Turn log blocks with receipt modal
- Basic turn logs table
- Manual adjustment modals

### Phase 2: Turn Systems (Week 3)
- Turn settings panel
- Rotation mode
- Service turn count mode
- Bonus rules implementation

### Phase 3: Mobile Optimization (Week 4)
- Mobile responsive layout
- Vertical card design
- Swipe gestures
- Bottom sheet modals

### Phase 4: Enhancements (Week 5-6)
- Tardy tracking
- Advanced filtering/search
- Export functionality
- Staff detail panel

### Phase 5: Polish & Testing (Week 7-8)
- Performance optimization
- User testing
- Bug fixes
- Documentation

---

## 10. APPENDIX

### 10.1 Design Assets
- Figma link: [To be added]
- Component library: Mango Design System
- Icons: Lucide React

### 10.2 API Endpoints
- `GET /api/turn-tracker/staff` - Get all staff turn data
- `GET /api/turn-tracker/logs` - Get turn logs
- `POST /api/turn-tracker/adjust` - Manual adjustment
- `GET /api/turn-tracker/settings` - Get settings
- `PUT /api/turn-tracker/settings` - Update settings

### 10.3 Related Documents
- Front Desk PRD
- Team Sidebar Specifications
- Turn Queue Implementation Guide

---

**Document End**
