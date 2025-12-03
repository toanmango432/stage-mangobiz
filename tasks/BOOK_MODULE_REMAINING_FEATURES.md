# 📅 Book Module - Remaining Features Implementation Plan

**Date**: December 2, 2025
**Purpose**: Track features NOT yet implemented despite visual/UX phases being complete

---

## Executive Summary

The Book module has completed **8 visual/UX phases** (design system, animations, responsive, performance). However, several **functional features** from the PRD remain unimplemented.

### What's Done vs What's Missing

| Category | Status |
|----------|--------|
| Visual Design & UX | ✅ 100% Complete |
| Core Calendar Views | ✅ 100% Complete (5 views) |
| Smart Booking AI | ✅ Complete |
| Drag & Drop | ✅ Basic implementation |
| PWA | ✅ Complete |
| **Functional Features** | ⚠️ **~60% Complete** |

---

## 🔴 PHASE 9: Quick Wins (Small Features)

**Effort**: Small | **Impact**: High | **Priority**: Immediate

These are missing features that should already be there - quick to implement.

### 9.1 Requested Staff Indicator ❌
**Current**: Data is saved (`staffRequested: true`) but NOT displayed on calendar
**Needed**: Visual "REQ" badge on AppointmentCard

| Task | File | Effort |
|------|------|--------|
| Add `staffRequested` prop to AppointmentCard | `AppointmentCard.tsx` | S |
| Display "REQ" badge when true | `AppointmentCard.tsx` | S |
| Pass `staffRequested` from DaySchedule | `DaySchedule.v2.tsx` | S |
| Style badge (star icon or "REQ" text) | `AppointmentCard.tsx` | S |

**Acceptance Criteria**:
- [ ] Appointments with requested staff show visual indicator
- [ ] Indicator visible in all calendar views (Day, Week, Agenda)
- [ ] Distinguishable at a glance

---

### 9.2 Copy & Paste Appointment ❌
**Current**: Not implemented
**Needed**: Copy appointment to clipboard, paste to new time slot

| Task | File | Effort |
|------|------|--------|
| Add clipboard state to BookPage | `BookPage.tsx` | S |
| Add "Copy" to context menu | `AppointmentContextMenu.tsx` | S |
| Add "Paste" action on time slot click | `DaySchedule.v2.tsx` | M |
| Keyboard shortcuts (Cmd+C, Cmd+V) | `BookPage.tsx` | S |

**Acceptance Criteria**:
- [ ] Right-click → Copy stores appointment data
- [ ] Click time slot → Paste creates new appointment
- [ ] Cmd+C / Cmd+V keyboard shortcuts work
- [ ] Pasted appointment opens in edit mode for confirmation

---

### 9.3 Duplicate Appointment ❌
**Current**: Not implemented
**Needed**: One-click duplicate to same time slot (for recurring manual bookings)

| Task | File | Effort |
|------|------|--------|
| Add "Duplicate" to context menu | `AppointmentContextMenu.tsx` | S |
| Create duplicate with new ID | `appointmentsSlice.ts` | S |
| Open modal for date/time selection | `BookPage.tsx` | M |

**Acceptance Criteria**:
- [ ] Right-click → Duplicate opens date/time picker
- [ ] Creates new appointment with same client/services/staff
- [ ] New appointment defaults to next available slot

---

### 9.4 Rebook Button (UI for existing logic) ❌
**Current**: `predictiveRebooking.ts` exists but NO UI button
**Needed**: "Rebook" in context menu that pre-fills from last appointment

| Task | File | Effort |
|------|------|--------|
| Add "Rebook" to context menu | `AppointmentContextMenu.tsx` | S |
| Connect to `predictiveRebooking.ts` | `BookPage.tsx` | S |
| Pre-fill NewAppointmentModal with client's preferences | `NewAppointmentModal.v2.tsx` | M |

**Acceptance Criteria**:
- [ ] Right-click completed appointment → "Rebook" option
- [ ] Opens booking modal with client, services, staff pre-filled
- [ ] Suggests next date based on client's booking pattern

---

### Phase 9 Total Effort: **~2-3 days**

---

## 🟡 PHASE 10: Core Feature Gaps

**Effort**: Medium | **Impact**: High | **Priority**: High

### 10.1 Recurring Appointments ❌
**Current**: Not implemented (only schedule closures have recurrence)
**Needed**: Full recurring appointment support

| Task | File | Effort |
|------|------|--------|
| Create RecurrencePattern type | `src/types/appointment.ts` | S |
| Add recurrence UI to booking modal | `NewAppointmentModal.v2.tsx` | L |
| Create recurrence preview component | `RecurrencePreview.tsx` (new) | M |
| Store recurrence in database | `appointmentsSlice.ts`, `database.ts` | M |
| Display recurring indicator on cards | `AppointmentCard.tsx` | S |
| Edit single vs series modal | `EditRecurringModal.tsx` (new) | M |
| Cancel single vs series logic | `appointmentsSlice.ts` | M |

**Recurrence Options**:
- Daily, Weekly, Bi-weekly, Monthly
- Specific days of week
- End after N occurrences or on date
- Skip holidays option

**Acceptance Criteria**:
- [ ] Can create appointments that repeat
- [ ] Visual indicator (🔁) on recurring appointments
- [ ] Edit options: this one, this & future, all
- [ ] Cancel options: this one, this & future, all
- [ ] Preview shows all occurrences before saving

---

### 10.2 Waitlist Management ❌
**Current**: Referenced in code but no actual UI
**Needed**: Full waitlist queue management

| Task | File | Effort |
|------|------|--------|
| Create Waitlist types | `src/types/waitlist.ts` (new) | S |
| Create WaitlistPanel component | `WaitlistPanel.tsx` (new) | L |
| Add "Add to Waitlist" button | `BookPage.tsx` | S |
| Waitlist entry form | `WaitlistEntryModal.tsx` (new) | M |
| Auto-match on cancellation | `waitlistService.ts` (new) | M |
| Notification when slot opens | `waitlistService.ts` | M |
| Waitlist sidebar section | `BookSidebar.tsx` | M |

**Waitlist Features**:
- Client preferences (service, staff, date range, time range)
- Priority levels (normal, high, urgent)
- Auto-notify when matching slot opens
- One-click convert to booking

**Acceptance Criteria**:
- [ ] Can add clients to waitlist with preferences
- [ ] Waitlist visible in sidebar
- [ ] Auto-suggests waitlist clients when cancellation happens
- [ ] One-click to book from waitlist

---

### 10.3 Enhanced Analytics Dashboard ❌
**Current**: Basic RevenueDashboard only
**Needed**: Comprehensive booking analytics

| Task | File | Effort |
|------|------|--------|
| Create BookAnalyticsDashboard | `BookAnalyticsDashboard.tsx` (new) | L |
| Staff utilization metrics | `analyticsService.ts` (new) | M |
| Service popularity tracking | `analyticsService.ts` | M |
| Peak hours heatmap | `PeakHoursHeatmap.tsx` (new) | M |
| No-show rate tracking | `analyticsService.ts` | S |
| Revenue forecasting | `analyticsService.ts` | M |

**Metrics to Track**:
- Utilization rate per staff
- Popular services
- Peak booking hours
- No-show rate
- Average ticket value
- Client retention rate

**Acceptance Criteria**:
- [ ] Dashboard shows key metrics at a glance
- [ ] Can filter by date range
- [ ] Visual charts for trends
- [ ] Export to CSV

---

### Phase 10 Total Effort: **~2-3 weeks**

---

## 🟠 PHASE 11: Client-Facing Features

**Effort**: Large | **Impact**: Very High | **Priority**: Medium

### 11.1 Online Booking Widget ❌
**Current**: Not implemented
**Needed**: Embeddable widget for client self-booking

| Task | File | Effort |
|------|------|--------|
| Create standalone booking widget | `src/widgets/BookingWidget/` (new) | XL |
| Service selection step | `ServiceSelection.tsx` | M |
| Staff selection step | `StaffSelection.tsx` | M |
| Date/time selection step | `DateTimeSelection.tsx` | L |
| Client info form | `ClientInfoForm.tsx` | M |
| Confirmation page | `BookingConfirmation.tsx` | M |
| Embed code generator | Admin panel | M |
| Widget customization (colors, logo) | Widget config | M |

**Acceptance Criteria**:
- [ ] Clients can book without logging in
- [ ] Shows real-time availability
- [ ] Embeddable on any website
- [ ] Mobile-responsive
- [ ] Customizable branding

---

### 11.2 Client Self-Service Portal ❌
**Current**: Not implemented
**Needed**: Portal for clients to manage their bookings

| Task | File | Effort |
|------|------|--------|
| Client portal pages | `src/pages/ClientPortal/` (new) | XL |
| View upcoming appointments | `UpcomingAppointments.tsx` | M |
| Reschedule/cancel functionality | `ManageBooking.tsx` | M |
| Booking history | `BookingHistory.tsx` | M |
| Rebook from history | `RebookFromHistory.tsx` | S |
| Notification preferences | `NotificationSettings.tsx` | M |
| Favorite staff/services | `Favorites.tsx` | M |

**Acceptance Criteria**:
- [ ] Clients can view their appointments
- [ ] Can reschedule within policy
- [ ] Can cancel within policy
- [ ] Can rebook past services
- [ ] Manage notification preferences

---

### Phase 11 Total Effort: **~4-6 weeks**

---

## 🔵 PHASE 12: Advanced Features

**Effort**: Large | **Impact**: Medium | **Priority**: Low

### 12.1 Multi-Location Support ❌
- Switch between salon locations
- Location-specific staff/services
- Cross-location booking

### 12.2 Resource Booking ❌
- Book rooms/stations/equipment
- Resource availability calendar
- Resource conflicts detection

### 12.3 Deposits & Cancellation Policies ❌
- Require deposits for booking
- Configurable cancellation windows
- Automatic refund rules

### 12.4 Marketing Automation ❌
- Automated reminder sequences
- Re-engagement campaigns
- Birthday specials
- Review requests

### 12.5 Loyalty Program Integration ❌
- Points for bookings
- Reward redemption
- Tier-based benefits

---

### Phase 12 Total Effort: **~6-8 weeks**

---

## 📊 Implementation Priority Matrix

| Phase | Features | Effort | Impact | Priority |
|-------|----------|--------|--------|----------|
| **9** | Quick Wins (REQ badge, Copy/Paste, Duplicate, Rebook UI) | S | High | 🔴 **Immediate** |
| **10** | Recurring, Waitlist, Analytics | M-L | High | 🟡 **High** |
| **11** | Online Booking, Client Portal | XL | Very High | 🟠 **Medium** |
| **12** | Multi-location, Resources, Deposits, Marketing, Loyalty | XL | Medium | 🔵 **Low** |

---

## 📋 Recommended Implementation Order

### Sprint 1 (This Week): Phase 9 Quick Wins
1. ✅ Requested staff indicator on AppointmentCard
2. ✅ Copy/Paste appointment functionality
3. ✅ Duplicate appointment
4. ✅ Rebook button in context menu

### Sprint 2-3 (Next 2 Weeks): Phase 10.1 Recurring
1. Recurrence pattern UI in booking modal
2. Database schema for recurring appointments
3. Edit/cancel single vs series logic
4. Visual indicators on calendar

### Sprint 4-5: Phase 10.2 Waitlist
1. Waitlist data model
2. Waitlist sidebar panel
3. Auto-match algorithm
4. Notifications

### Sprint 6-7: Phase 10.3 Analytics
1. Analytics dashboard
2. Key metrics calculation
3. Charts and visualizations

### Future: Phases 11-12
- Online booking widget
- Client portal
- Advanced features

---

## 🎯 Success Metrics

After implementing remaining features:

| Metric | Current | Target |
|--------|---------|--------|
| Feature Parity with Fresha | 60% | 90% |
| Feature Parity with Booksy | 55% | 85% |
| Core Features Complete | 70% | 95% |
| Client Self-Service | 0% | 100% |

---

## 📁 Files to Create/Modify

### Phase 9 (Quick Wins)
```
MODIFY:
├── src/components/Book/AppointmentCard.tsx      # Add REQ badge
├── src/components/Book/AppointmentContextMenu.tsx  # Add Copy, Duplicate, Rebook
├── src/components/Book/BookPage.tsx             # Clipboard state, paste logic
└── src/components/Book/DaySchedule.v2.tsx       # Pass staffRequested prop
```

### Phase 10 (Core Features)
```
NEW FILES:
├── src/types/waitlist.ts
├── src/types/recurrence.ts
├── src/components/Book/RecurrenceSelector.tsx
├── src/components/Book/RecurrencePreview.tsx
├── src/components/Book/EditRecurringModal.tsx
├── src/components/Book/WaitlistPanel.tsx
├── src/components/Book/WaitlistEntryModal.tsx
├── src/components/Book/BookAnalyticsDashboard.tsx
├── src/services/waitlistService.ts
└── src/services/analyticsService.ts

MODIFY:
├── src/components/Book/NewAppointmentModal.v2.tsx  # Add recurrence UI
├── src/components/Book/BookSidebar.tsx             # Add waitlist section
├── src/store/slices/appointmentsSlice.ts           # Recurring logic
└── src/db/database.ts                              # Waitlist table
```

---

**Last Updated**: December 2, 2025
**Next Action**: Decide which phase to start implementing
