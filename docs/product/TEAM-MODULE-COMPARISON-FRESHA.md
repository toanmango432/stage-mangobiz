# Team Module Comparison: Mango POS vs Fresha

**Date:** December 2, 2024
**Purpose:** Competitive analysis to identify feature gaps and opportunities

---

## Executive Summary

This document compares Mango POS's Team Module with Fresha's team management capabilities. Both systems serve salon/spa businesses but take different approaches. **Mango POS** focuses on offline-first operations with a unique turn tracking system, while **Fresha** emphasizes integrated payroll processing and marketplace visibility.

### Key Findings

| Area | Mango POS Advantage | Fresha Advantage |
|------|---------------------|------------------|
| **Offline Support** | ✅ Full offline-first | ❌ Cloud-dependent |
| **Turn Tracking** | ✅ Built-in system | ❌ Not available |
| **Role Variety** | ✅ 14 specialized roles | ⚠️ Generic roles |
| **Payroll Processing** | ⚠️ Calculation only | ✅ Direct payment processing |
| **Marketplace** | ❌ Not available | ✅ Built-in discovery platform |
| **Pricing** | ⚠️ TBD | ✅ Free tier + affordable plans |

---

## Detailed Feature Comparison

### 1. Team Member Profile Management

| Feature | Mango POS | Fresha | Notes |
|---------|-----------|--------|-------|
| Basic Profile (name, contact) | ✅ | ✅ | Parity |
| Profile Photo/Avatar | ✅ | ✅ | Parity |
| Employee ID | ✅ | ❓ | Mango advantage |
| Date of Birth | ✅ | ❓ | Mango advantage |
| Hire Date | ✅ | ❓ | Mango advantage |
| Emergency Contact | ✅ | ❓ | Mango advantage for HR |
| Full Address | ✅ | ❓ | Mango advantage |
| Professional Bio | ✅ | ✅ | Parity |
| Portfolio/Gallery | ✅ | ✅ | Fresha has marketplace visibility |
| Job Title | ✅ | ✅ | Parity |

**Analysis:** Mango POS has more comprehensive HR-oriented profile fields. Fresha focuses on customer-facing profile elements for marketplace visibility.

---

### 2. Staff Roles

| Mango POS Roles (14) | Fresha Equivalent |
|---------------------|-------------------|
| owner | ✅ Owner/Admin |
| manager | ✅ Manager |
| senior_stylist | ⚠️ Generic "Team Member" |
| stylist | ⚠️ Generic "Team Member" |
| junior_stylist | ⚠️ Generic "Team Member" |
| apprentice | ⚠️ Generic "Team Member" |
| receptionist | ✅ Receptionist (via permissions) |
| assistant | ⚠️ Generic "Team Member" |
| nail_technician | ⚠️ Generic "Team Member" |
| esthetician | ⚠️ Generic "Team Member" |
| massage_therapist | ⚠️ Generic "Team Member" |
| barber | ⚠️ Generic "Team Member" |
| colorist | ⚠️ Generic "Team Member" |
| makeup_artist | ⚠️ Generic "Team Member" |

**Analysis:**
- **Mango POS Advantage:** 14 specialized roles allow for role-specific default permissions, commission structures, and reporting. The role variety reflects industry-specific positions.
- **Fresha Approach:** Uses a simpler permission-level system (Basic, Low, Medium, High, Full) rather than role-based categorization.

---

### 3. Permissions & Access Control

| Feature | Mango POS | Fresha |
|---------|-----------|--------|
| **Permission Model** | Role-based + Individual overrides | Level-based (Basic→Full) |
| **Granular Permissions** | ✅ 10+ specific permission flags | ✅ Area-based checkboxes |
| **Admin Portal Access** | ✅ Configurable | ✅ Configurable |
| **Report Access** | ✅ Configurable | ✅ Configurable |
| **Price Modification** | ✅ Specific flag | ⚠️ Part of level |
| **Refund Processing** | ✅ Specific flag | ⚠️ Part of level |
| **Record Deletion** | ✅ Specific flag | ⚠️ Part of level |
| **Team Management** | ✅ Specific flag | ⚠️ Part of level |
| **View Others' Calendar** | ✅ Specific flag | ❓ Unknown |
| **Book for Others** | ✅ Specific flag | ❓ Unknown |
| **Edit Others' Appointments** | ✅ Specific flag | ❓ Unknown |
| **PIN Protection** | ✅ For sensitive actions | ❓ Unknown |
| **Multi-Location Permissions** | ⚠️ Per-store | ✅ Per-location |
| **No Access Option** | ✅ | ✅ For profile-only members |
| **Client Data Protection** | ✅ Via permissions | ✅ Sensitive info controls |

**Mango POS Permission Flags:**
```
canAccessAdminPortal, canAccessReports, canModifyPrices,
canProcessRefunds, canDeleteRecords, canManageTeam,
canViewOthersCalendar, canBookForOthers, canEditOthersAppointments,
pinRequired
```

**Fresha Permission Levels:**
```
No Access → Basic (View-only) → Low → Medium → High → Full
```

**Analysis:**
- Mango POS offers more granular control with specific permission flags
- Fresha's level-based system is simpler but less flexible
- Both allow restricting sensitive client information access

---

### 4. Service Assignments

| Feature | Mango POS | Fresha |
|---------|-----------|--------|
| Assign services to staff | ✅ | ✅ |
| Toggle can/cannot perform | ✅ | ✅ |
| Custom price per staff | ✅ | ✅ |
| Custom duration per staff | ✅ | ✅ |
| Service-specific commission | ✅ | ✅ |
| Category grouping | ✅ | ✅ |
| Sync to online booking | ✅ | ✅ |

**Analysis:** Feature parity in service assignments. Both systems support per-staff customization.

---

### 5. Schedule Management

| Feature | Mango POS | Fresha |
|---------|-----------|--------|
| **Regular Working Hours** | ✅ 7-day schedule | ✅ Shift-based |
| **Multiple Shifts per Day** | ✅ | ✅ |
| **Break Time Configuration** | ✅ With labels | ✅ |
| **Rotating Schedules** | ✅ 1-4 week patterns | ❓ Unknown |
| **Schedule Overrides** | ✅ (day_off, custom_hours, extra_day) | ✅ |
| **Time-Off Requests** | ✅ With approval workflow | ✅ |
| **Time-Off Types** | ✅ 5 types (vacation, sick, etc.) | ❓ Unknown |
| **Timesheet Tracking** | ⚠️ Clock in/out only | ✅ Full timesheets |
| **Break Tracking** | ⚠️ Configured, not tracked | ✅ Real-time tracking |
| **Attendance Tracking** | ⚠️ Basic | ✅ Comprehensive |
| **Overtime Calculation** | ✅ Rate + threshold | ✅ Daily/Weekly + multiplier |

**Mango POS Schedule Features:**
- Rotating schedule patterns (unique feature)
- Anchor date for rotation calculation
- Schedule override types for flexibility

**Fresha Schedule Features:**
- Real-time timesheet tracking
- Break and shift updates
- Attendance monitoring
- Integrated with payroll

**Analysis:**
- **Mango POS Advantage:** Rotating schedule patterns (1-4 weeks) - unique feature for businesses with complex staffing needs
- **Fresha Advantage:** Real-time timesheet and attendance tracking integrated with payroll

---

### 6. Commission & Compensation

| Feature | Mango POS | Fresha |
|---------|-----------|--------|
| **Commission Types** | ✅ 4 types | ✅ 2+ types |
| - Percentage | ✅ | ✅ |
| - Tiered/Progressive | ✅ | ✅ |
| - Flat Rate | ✅ | ❓ |
| - None (salary) | ✅ | ✅ (hourly/salary) |
| **Service Commission** | ✅ | ✅ |
| **Product Commission** | ✅ Separate rate | ✅ |
| **Gift Card Commission** | ⚠️ Via product | ✅ Specific |
| **Membership Commission** | ⚠️ Not specific | ✅ Specific |
| **Tip Handling** | ✅ 3 modes | ❓ Unknown |
| - Keep All | ✅ | ❓ |
| - Pool | ✅ | ❓ |
| - Percentage to House | ✅ | ❓ |
| **New Client Bonus** | ✅ | ❓ |
| **Rebook Bonus** | ✅ | ❓ |
| **Retail Commission** | ✅ | ✅ |
| **Commission Override per Service** | ✅ | ✅ |

**Analysis:**
- Mango POS has more compensation incentive options (new client bonus, rebook bonus)
- Fresha explicitly supports gift card and membership commissions
- Both support tiered/progressive commission structures

---

### 7. Payroll Management

| Feature | Mango POS | Fresha (Team Pay) |
|---------|-----------|-------------------|
| **Pay Period Configuration** | ✅ 4 options | ✅ Configurable |
| **Wage Types** | | |
| - Salary | ✅ Base salary | ✅ |
| - Hourly | ✅ Hourly rate | ✅ |
| - Commission-only | ✅ | ✅ |
| **Guaranteed Minimum** | ✅ | ❓ |
| **Overtime Rate** | ✅ | ✅ Multiplier option |
| **Overtime Threshold** | ✅ Hours/week | ✅ Daily or Weekly |
| **Deductions** | ✅ Type + amount/% | ✅ |
| **Pay Runs** | ❌ Manual calculation | ✅ Automated |
| **Direct Payment** | ❌ Not integrated | ✅ Send payments |
| **Timesheet Integration** | ⚠️ Basic | ✅ Full integration |
| **Pay Run Adjustments** | ❌ | ✅ Manual adjustments |
| **Fee Pass-through** | ❌ | ✅ Pass Fresha fees |
| **Cash Advance Tracking** | ❌ | ✅ |
| **Payroll Reports** | ⚠️ Basic | ✅ 9 detailed reports |
| **Add Tips to Pay Run** | ❌ | ✅ Post-checkout tips |

**Analysis:**
- **Major Fresha Advantage:** Team Pay is a complete payroll solution with automated pay runs, direct payment processing, and comprehensive reporting
- **Mango POS Gap:** Currently only calculates commissions/wages but doesn't process actual payments
- **Recommendation:** Consider integrating with payroll providers (Gusto, ADP) or building pay run functionality

---

### 8. Online Booking Settings

| Feature | Mango POS | Fresha |
|---------|-----------|--------|
| **Enable/Disable Online Booking** | ✅ | ✅ |
| **Show on Website** | ✅ | ✅ |
| **Show on App** | ✅ | ✅ (Marketplace) |
| **Max Advance Booking Days** | ✅ | ✅ (Lead time) |
| **Min Advance Notice Hours** | ✅ | ✅ |
| **Buffer Between Appointments** | ✅ | ✅ |
| **Buffer Type (before/after/both)** | ✅ | ❓ |
| **Allow Double Booking** | ✅ | ❓ |
| **Max Concurrent Appointments** | ✅ | ❓ |
| **Require Deposit** | ✅ | ✅ |
| **Deposit Amount** | ✅ | ✅ |
| **Auto Accept Bookings** | ✅ | ✅ |
| **Accept New Clients** | ✅ | ❓ |
| **Display Order** | ✅ | ❓ |
| **Profile Bio** | ✅ | ✅ |
| **Specialties Highlight** | ✅ | ✅ Featured services |
| **Portfolio Images** | ✅ | ✅ |
| **Staff Ratings Display** | ❓ | ✅ Star ratings |
| **Group Booking** | ❓ | ✅ |
| **Marketplace Visibility** | ❌ | ✅ Major advantage |
| **Client Can Select Staff** | ✅ | ✅ |

**Analysis:**
- **Fresha Major Advantage:** Built-in marketplace for customer discovery
- Mango POS has more granular booking controls (buffer types, concurrent limits)
- Fresha offers group booking capability

---

### 9. Turn Tracking

| Feature | Mango POS | Fresha |
|---------|-----------|--------|
| **Turn Tracking System** | ✅ Comprehensive | ❌ Not available |
| **Turn Types** | ✅ 6 types | N/A |
| - Service Turn | ✅ | N/A |
| - Bonus Turn | ✅ | N/A |
| - Adjust Turn | ✅ | N/A |
| - Tardy Turn | ✅ | N/A |
| - Appointment Turn | ✅ | N/A |
| - Partial Turn | ✅ | N/A |
| **Manual Adjustments** | ✅ With reason | N/A |
| **Turn Log History** | ✅ | N/A |
| **Queue Position Tracking** | ✅ | N/A |
| **Auto/Manual Queue Mode** | ✅ | N/A |
| **Turn Receipt/Details** | ✅ | N/A |
| **Real-time Dashboard** | ✅ | N/A |
| **Void Entries** | ✅ | N/A |

**Analysis:**
- **Major Mango POS Advantage:** Turn tracking is a unique, industry-specific feature that Fresha doesn't offer
- This is a significant differentiator for walk-in heavy businesses
- Prevents disputes and ensures fair work distribution

---

### 10. Notifications

| Feature | Mango POS | Fresha |
|---------|-----------|--------|
| **Email Notifications** | ✅ 8 types | ✅ |
| **SMS Notifications** | ✅ 5 types | ✅ |
| **Push Notifications** | ✅ 4 types | ✅ |
| **Reminder Timing Config** | ✅ First + second | ✅ |
| **Marketing Emails Toggle** | ✅ | ✅ |
| **Daily/Weekly Summary** | ✅ | ✅ |

**Analysis:** Feature parity in notification capabilities.

---

### 11. Technical Architecture

| Feature | Mango POS | Fresha |
|---------|-----------|--------|
| **Offline Support** | ✅ Full offline-first | ❌ Cloud-dependent |
| **Data Sync** | ✅ Vector clock + conflict resolution | ✅ Cloud sync |
| **Multi-Device** | ✅ With sync | ✅ |
| **Multi-Location** | ✅ Store-based | ✅ Location-based |
| **Local Storage** | ✅ IndexedDB | ❌ |
| **API Access** | ❓ | ✅ Partner integrations |

**Analysis:**
- **Major Mango POS Advantage:** Offline-first architecture is critical for businesses with unreliable internet
- Fresha requires constant connectivity

---

## Gap Analysis

### Features Mango POS Should Consider Adding

| Priority | Feature | Fresha Reference | Effort |
|----------|---------|------------------|--------|
| **High** | Payroll Pay Runs | Team Pay automated pay runs | Large |
| **High** | Direct Payment Processing | Send payments to team | Large (integration) |
| **High** | Marketplace/Discovery | Fresha Marketplace visibility | Very Large |
| **Medium** | Real-time Timesheet Tracking | Live hour/break tracking | Medium |
| **Medium** | Payroll Reports (9 types) | Detailed earnings reports | Medium |
| **Medium** | Gift Card/Membership Commission | Specific commission types | Small |
| **Medium** | Staff Ratings Display | Show ratings on booking page | Small |
| **Medium** | Group Booking | Multiple people per booking | Medium |
| **Low** | Cash Advance Tracking | Track advances against pay | Small |
| **Low** | Fee Pass-through | Pass processing fees to staff | Small |
| **Low** | Post-checkout Tips | Add tips after checkout | Small |

### Mango POS Competitive Advantages to Maintain

| Feature | Importance | Action |
|---------|------------|--------|
| **Turn Tracking System** | Critical | Enhance and market |
| **Offline-First Architecture** | Critical | Maintain and highlight |
| **14 Specialized Roles** | High | Use for smart defaults |
| **Rotating Schedule Patterns** | High | Unique selling point |
| **Granular Permissions** | Medium | Maintain flexibility |
| **New Client/Rebook Bonuses** | Medium | Marketing differentiator |
| **Comprehensive HR Profile Fields** | Medium | Enterprise-ready |

---

## Pricing Comparison

| Tier | Fresha | Mango POS |
|------|--------|-----------|
| **Solo/Basic** | Free (with transaction fees) | TBD |
| **Team** | $9.95/team member/month | TBD |
| **Team Pay Add-on** | Additional fee based on team size | N/A |
| **Transaction Fees** | 2.19% + $0.20 (card) | TBD |
| **Marketplace Fees** | 20% new client fee | N/A |

**Analysis:** Fresha's free tier with transaction-based monetization is attractive for small businesses. Mango POS should consider competitive pricing strategy.

---

## Strategic Recommendations

### Short-term (1-3 months)
1. **Enhance Turn Tracking Marketing** - This is a unique feature; make it prominent
2. **Add Staff Ratings Display** - Simple feature with high visibility
3. **Improve Timesheet Tracking** - Bridge the gap with Fresha's capabilities

### Medium-term (3-6 months)
1. **Build Payroll Reports** - Add comprehensive earnings and timesheet reports
2. **Add Group Booking** - Customer-requested feature
3. **Implement Gift Card/Membership Commissions** - Complete commission coverage

### Long-term (6-12 months)
1. **Payroll Integration** - Partner with Gusto, ADP, or build pay runs
2. **Consider Marketplace** - Evaluate customer acquisition channel
3. **Direct Payment Processing** - Full payroll solution

---

## Conclusion

Mango POS and Fresha take different approaches to team management:

- **Mango POS Strengths:** Offline-first, turn tracking, granular permissions, rotating schedules, comprehensive HR fields
- **Fresha Strengths:** Integrated payroll processing, marketplace visibility, real-time timesheets, simpler permission model

The most significant gap is **payroll processing** - Fresha's Team Pay is a complete solution while Mango POS only calculates wages. The most significant advantage is **turn tracking** - a feature Fresha completely lacks.

For salon/spa businesses that prioritize:
- **Fair work distribution** → Mango POS (turn tracking)
- **Offline reliability** → Mango POS
- **Customer discovery** → Fresha (marketplace)
- **Automated payroll** → Fresha (Team Pay)

---

## Sources

- [Fresha Team Knowledge Base](https://www.fresha.com/help-center/knowledge-base/team)
- [Fresha Team Pay](https://www.fresha.com/help-center/knowledge-base/add-ons-and-integrations/176-manage-payroll-with-team-pay)
- [Fresha Team Permissions](https://www.fresha.com/help-center/knowledge-base/team/49-manage-team-permissions-and-access-levels)
- [Fresha Commissions](https://www.fresha.com/help-center/knowledge-base/team/98-set-up-commissions-for-team-members)
- [Fresha Pay Runs](https://www.fresha.com/help-center/knowledge-base/team/100-manage-your-teams-payroll)
- [Fresha Online Booking Settings](https://www.fresha.com/help-center/knowledge-base/calendar/22-manage-online-bookings-settings)
- [Fresha Pricing](https://www.fresha.com/pricing)
