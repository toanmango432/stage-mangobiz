# Product Requirements Document: Clients (CRM) Module

**Product:** Mango POS
**Module:** Clients (CRM)
**Version:** 5.0
**Last Updated:** December 28, 2025
**Status:** Ready for Development
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

The Clients (CRM) Module is the comprehensive client relationship management system for Mango POS. It provides complete client database management, safety compliance tracking, loyalty programs, and relationship tools that enable salons to deliver personalized service while maintaining regulatory compliance.

### 1.2 Key Value Proposition

| Value | Description |
|-------|-------------|
| **Complete Client Profiles** | All client info, preferences, and history in one place |
| **Safety Compliance** | Allergy tracking, patch tests, consent forms |
| **Loyalty & Rewards** | Points, tiers, and referral programs to drive retention |
| **Smart Segmentation** | Auto-segment clients for targeted marketing |
| **Offline-First** | Full client access during internet outages |

### 1.3 Success Criteria

| Metric | Target |
|--------|--------|
| Client lookup time | < 3 seconds |
| Profile completeness | 80%+ of active clients |
| Loyalty program adoption | 60%+ of clients enrolled |
| Form completion rate | 85%+ before appointment |
| Offline client access | 100% availability |

---

## 2. Problem Statement

### 2.1 Current Challenges

| Challenge | Impact | Our Solution |
|-----------|--------|--------------|
| **Scattered client info** | Staff can't find preferences, allergies | Unified client profile with all data |
| **Paper consent forms** | Lost forms, compliance risk | Digital forms with e-signatures |
| **No patch test tracking** | Safety liability, allergic reactions | Automated patch test validation |
| **Manual loyalty tracking** | Errors, staff time wasted | Automatic points, rewards at checkout |
| **No client segmentation** | Generic marketing, low engagement | Smart segments with auto-targeting |
| **Problem clients rebook** | Revenue loss, staff conflicts | Client blocking with reason tracking |

### 2.2 User Quotes

> "I have a client allergic to certain products but I can never remember which ones. I need alerts that I can't miss." — Stylist

> "We had a client who no-shows every time. We blocked them on the old system but can't find how to do it here." — Salon Manager

> "Our loyalty program is on paper cards. Clients lose them, we can't track anything." — Owner

---

## 3. User Personas & Use Cases

### 3.1 Primary User: Front Desk Staff

**Goals:**
- Find clients quickly by name or phone
- See allergies and alerts immediately
- Check loyalty points at checkout
- Send forms to clients

**Use Cases:**

| ID | Use Case | Priority |
|----|----------|----------|
| CRM-UC-001 | Search client by name or phone | P0 |
| CRM-UC-002 | View client profile and history | P0 |
| CRM-UC-003 | Check client in for appointment | P0 |
| CRM-UC-004 | Apply loyalty points at checkout | P0 |
| CRM-UC-005 | Send consultation form | P1 |
| CRM-UC-006 | Add new client quickly | P0 |

### 3.2 Secondary User: Service Provider

**Goals:**
- See client preferences before service
- View allergy alerts during service
- Add notes after service
- Track own client retention

**Use Cases:**

| ID | Use Case | Priority |
|----|----------|----------|
| CRM-UC-007 | View client preferences | P0 |
| CRM-UC-008 | See allergy/safety alerts | P0 |
| CRM-UC-009 | Add service notes | P1 |
| CRM-UC-010 | View client visit history | P1 |

### 3.3 Secondary User: Salon Owner/Manager

**Goals:**
- Configure loyalty program
- Manage blocked clients
- View client analytics
- Export client data for marketing

**Use Cases:**

| ID | Use Case | Priority |
|----|----------|----------|
| CRM-UC-011 | Configure loyalty program | P1 |
| CRM-UC-012 | Block/unblock problematic clients | P0 |
| CRM-UC-013 | View client analytics dashboard | P1 |
| CRM-UC-014 | Export client segment for marketing | P1 |
| CRM-UC-015 | Manage consultation forms | P1 |

---

## 4. Competitive Analysis

| Feature | Mango | Fresha | Booksy | Square | Vagaro |
|---------|-------|--------|--------|--------|--------|
| Client profiles | Full | Full | Full | Basic | Full |
| Client blocking | Yes | Yes | Yes | No | Yes |
| Staff alerts | Prominent | Hidden | No | No | Notes only |
| Patch test tracking | Yes | No | No | No | No |
| Digital consent forms | Full builder | Basic | No | No | Basic |
| E-signatures | Yes | Yes | No | No | Yes |
| Loyalty points | Configurable | Fixed | Fixed | Yes | Yes |
| Tier system | Yes | No | No | No | Yes |
| Referral program | Full | Basic | Basic | No | Basic |
| Client segmentation | Auto + Custom | Basic | Basic | Basic | Basic |
| Offline client access | Full | No | No | No | No |

**Key Differentiator:** Mango offers the most comprehensive safety compliance (patch tests, alerts, forms) with full offline access.

---

## 5. Feature Requirements

### 5.1 Client Profiles

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P0-001 | Store personal information (name, email, phone, address) | P0 | All fields saveable; phone and email unique identifiers |
| CRM-P0-002 | Support preferred name (display name) | P0 | Preferred name shown on appointments, receipts |
| CRM-P0-003 | Store birthday and anniversary dates | P0 | Dates trigger automation eligibility |
| CRM-P0-004 | Store gender and pronouns | P0 | Pronouns displayed on client cards |
| CRM-P0-005 | Support profile photo/avatar | P0 | Photo displayed on appointments, calendar, checkout |
| CRM-P0-006 | Store preferred language | P0 | Used for form delivery, communications |
| CRM-P1-007 | Store emergency contact information | P1 | Name, relationship, phone, optional email and notes |
| CRM-P0-008 | Store favorite staff members (multi-select) | P0 | Used for smart booking suggestions |
| CRM-P0-009 | Store preferred services (multi-select) | P0 | Used for quick booking, marketing |
| CRM-P0-010 | Store free-text service preferences | P0 | Displayed during service (e.g., "prefers quiet") |
| CRM-P0-011 | Store allergies and sensitivities | P0 | Displayed as prominent alert; required field option |
| CRM-P0-012 | Store internal staff notes | P0 | Staff-only notes with timestamp and author |

### 5.2 Staff Alert System

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P0-013 | Single prominent staff alert per client | P0 | One alert field, separate from regular notes |
| CRM-P0-014 | Display alert on client card across all views | P0 | Visible on calendar, checkout, profile |
| CRM-P0-015 | Alert badge on calendar appointment blocks | P0 | Yellow/orange badge icon on appointments |
| CRM-P0-016 | High-visibility alert styling | P0 | Yellow/orange background, cannot be missed |
| CRM-P0-017 | Export alerts with client list | P0 | Included in CSV/Excel exports |

### 5.3 Consent & Privacy

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P0-018 | Track SMS opt-in status with timestamp | P0 | Consent logged before SMS sent |
| CRM-P0-019 | Track email opt-in status with timestamp | P0 | Consent logged before marketing email |
| CRM-P0-020 | Separate marketing vs transactional consent | P0 | Transactional (receipts) independent of marketing |
| CRM-P1-021 | Track photo consent for social/portfolio | P1 | Required before posting client photos |
| CRM-P0-022 | GDPR/CCPA compliance flags | P0 | Data deletion request tracking |
| CRM-P0-023 | Do-not-contact flag | P0 | Prevents all outbound communication |
| CRM-P0-024 | Store preferred communication channel | P0 | SMS, Email, Both, or None |

### 5.4 Client Blocking

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P0-025 | Block client from online booking | P0 | Blocked clients cannot book via Store/App |
| CRM-P0-026 | Block reason dropdown selection | P0 | Options: no_show, late_cancellation, inappropriate_behavior, non_payment, other |
| CRM-P0-027 | Block reason notes (free text) | P0 | Required when "other" selected |
| CRM-P0-028 | Track blocked by staff ID and timestamp | P0 | Audit trail for who blocked and when |
| CRM-P0-029 | Display "Time slot unavailable" to blocked clients | P0 | Client not told they are blocked |
| CRM-P0-030 | Blocked status badge on client profile | P0 | Clear visual indicator of blocked status |
| CRM-P0-031 | Blocked indicator on calendar appointments | P0 | Staff sees client is blocked on existing appointments |
| CRM-P0-032 | Manual booking override with warning | P0 | Staff can book blocked client after confirmation |
| CRM-P0-033 | Unblock action available anytime | P0 | Restores online booking capability |
| CRM-P0-034 | Block action logged in audit trail | P0 | Full history of block/unblock actions |
| CRM-P1-035 | Bulk block multiple clients | P1 | Select multiple, apply single reason |

### 5.5 Patch Test Tracking

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P0-036 | Record patch test results | P0 | Client, service, date, result (pass/fail/pending), expiration |
| CRM-P0-037 | Calculate expiration from test date | P0 | Auto-calculate based on service validity period |
| CRM-P0-038 | Track performing staff for patch test | P0 | Staff ID logged for accountability |
| CRM-P0-039 | Service flag: requires patch test | P0 | Boolean on service configuration |
| CRM-P0-040 | Service setting: patch test validity days | P0 | Default 180 days, configurable per service |
| CRM-P0-041 | Block booking if patch test missing | P0 | Cannot book service without valid test |
| CRM-P0-042 | Block booking if patch test expired | P0 | Cannot book if test older than validity period |
| CRM-P1-043 | Warning if patch test expires within 7 days | P1 | Alert shown when booking near-expiry |
| CRM-P1-044 | Auto-prompt to book patch test first | P1 | Suggest patch test appointment before service |

### 5.6 Consultation Forms

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P1-045 | Form template builder | P1 | Create custom forms with sections |
| CRM-P1-046 | Pre-built form templates library | P1 | COVID, hair color, lash, medical, photo release |
| CRM-P1-047 | Automatic form delivery before appointments | P1 | Link services to auto-send forms |
| CRM-P1-048 | Manual form send on-demand | P1 | Send any form to any client |
| CRM-P1-049 | Form frequency: every_time or once | P1 | Configure per template |
| CRM-P1-050 | Form sections: text input | P1 | Single/multiline text fields |
| CRM-P1-051 | Form sections: single choice (radio) | P1 | Radio button selection |
| CRM-P1-052 | Form sections: multi choice (checkbox) | P1 | Multiple selections allowed |
| CRM-P1-053 | Form sections: date picker | P1 | Date selection with constraints |
| CRM-P1-054 | Form sections: file upload | P1 | JPG, PNG, PDF accepted |
| CRM-P1-055 | Form sections: signature | P1 | Draw or type signature |
| CRM-P1-056 | Form sections: consent checkbox | P1 | Legal consent with text |
| CRM-P1-057 | Form delivery via email with secure link | P1 | 24-hour expiry on link |
| CRM-P1-058 | Form delivery via SMS with short link | P1 | Mobile-friendly delivery |
| CRM-P1-059 | Staff can complete form for client | P1 | In-store completion option |
| CRM-P1-060 | Electronic signature capture | P1 | Draw (touch) or type; stored as image |
| CRM-P1-061 | Form responses stored encrypted | P1 | HIPAA-compliant storage |
| CRM-P1-062 | View/print completed forms as PDF | P1 | Downloadable records |

### 5.7 Visit History

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P0-063 | Complete appointment history | P0 | All dates, services, staff, status |
| CRM-P0-064 | Service duration (actual vs scheduled) | P0 | Track actual time per service |
| CRM-P0-065 | Notes from each visit | P0 | Visit-specific notes displayed |
| CRM-P0-066 | Photos per visit (before/after) | P0 | Image upload per appointment |
| CRM-P0-067 | Filter by status (completed, no-show, cancelled) | P0 | Quick filtering options |
| CRM-P0-068 | All transactions with itemized details | P0 | Services, products, payments, discounts |
| CRM-P0-069 | Products purchased history | P0 | Product, date, quantity, price |
| CRM-P1-070 | Patch test history | P1 | All tests with results and expiration |
| CRM-P1-071 | Form submission history | P1 | All forms with submission dates |

### 5.8 Client Wallet

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P0-072 | Display combined available balance | P0 | Gift cards + store credit + refund credits |
| CRM-P0-073 | Show gift card balances with expiration | P0 | Individual card balances and dates |
| CRM-P0-074 | Show store credit / prepaid credits | P0 | Manual adjustments with reason |
| CRM-P1-075 | Show upfront payment deposits | P1 | Deposits tied to future appointments |
| CRM-P0-076 | Saved payment card (last 4, type, expiry) | P0 | One card at a time; client can update |
| CRM-P1-077 | Show available loyalty rewards | P1 | Rewards ready to redeem |
| CRM-P0-078 | Add store credit action | P0 | Manual add with reason required |
| CRM-P0-079 | View wallet transaction history | P0 | All credit additions and deductions |
| CRM-P1-080 | Per-client upfront payment settings | P1 | Override store defaults |

### 5.9 Loyalty Program

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P1-081 | Configure points per dollar spent | P1 | Default 1 point per $1, configurable |
| CRM-P1-082 | Configure eligible items (services, products) | P1 | Select which categories earn points |
| CRM-P1-083 | Include/exclude taxes in calculation | P1 | Toggle for tax inclusion |
| CRM-P1-084 | Points expiration setting | P1 | Never, or X months from earning |
| CRM-P1-085 | Tier system configuration | P1 | Tier names, thresholds, benefits |
| CRM-P1-086 | Tier evaluation period | P1 | Lifetime or rolling 12 months |
| CRM-P1-087 | Reward: fixed dollar discount | P1 | Points to redeem, min spend, eligible items |
| CRM-P1-088 | Reward: percentage discount | P1 | Points to redeem, max value cap |
| CRM-P1-089 | Reward: free service | P1 | Specific service as reward |
| CRM-P1-090 | Reward: free product | P1 | Specific product as reward |
| CRM-P1-091 | Reward expiration after claiming | P1 | Days until claimed reward expires |
| CRM-P1-092 | Display points balance in client profile | P1 | Current points visible |
| CRM-P1-093 | Display current tier and progress | P1 | Progress bar to next tier |
| CRM-P1-094 | Manual point adjustment with reason | P1 | Add/deduct points with audit trail |
| CRM-P1-095 | Exclude client from loyalty program | P1 | Per-client opt-out |

### 5.10 Referral Program

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P2-096 | Referral link generation per client | P2 | Unique trackable link |
| CRM-P2-097 | Share referral via SMS, Email, Social | P2 | Multi-channel sharing |
| CRM-P2-098 | Referrer reward on friend's first appointment | P2 | Auto-issue when friend completes service |
| CRM-P2-099 | Referred friend first booking incentive | P2 | Discount for new client |
| CRM-P2-100 | Referral tracking dashboard | P2 | Total referrals, conversion rate, revenue |
| CRM-P2-101 | Top referrers leaderboard | P2 | Gamification for top referrers |
| CRM-P2-102 | Self-referral prevention | P2 | Same email/phone detection |
| CRM-P2-103 | Waive marketplace fees for referrals | P2 | New client fee waived |

### 5.11 Client Reviews

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P2-104 | Auto-request review after appointment | P2 | Configurable delay (2-24 hours) |
| CRM-P2-105 | Link to Google, Yelp, Facebook reviews | P2 | Route to external platforms |
| CRM-P2-106 | Internal review option | P2 | Private feedback not public |
| CRM-P2-107 | Display average rating on profile | P2 | 1-5 stars with count |
| CRM-P2-108 | Rating by staff member report | P2 | Staff-level satisfaction tracking |

### 5.12 Client Segmentation

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P1-109 | Default segment: Active (60 days) | P1 | Auto-calculated based on last visit |
| CRM-P1-110 | Default segment: At-Risk (60-90 days) | P1 | Auto-flagged for follow-up |
| CRM-P1-111 | Default segment: Lapsed (90+ days) | P1 | Churn risk identified |
| CRM-P1-112 | Default segment: VIP (top 10% spend) | P1 | High-value clients highlighted |
| CRM-P1-113 | Default segment: New (30 days) | P1 | First-time clients tracked |
| CRM-P1-114 | Default segment: Member | P1 | Active membership holders |
| CRM-P1-115 | Default segment: Blocked | P1 | All blocked clients |
| CRM-P1-116 | Custom segment builder | P1 | Build segments with any criteria |
| CRM-P1-117 | Export segment to CSV/Excel | P1 | Marketing list export |
| CRM-P1-118 | Send blast message to segment | P1 | SMS/Email to segment |

### 5.13 Client Analytics

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P1-119 | Client Lifetime Value (LTV) | P1 | Total spend + projected future |
| CRM-P1-120 | Visit frequency metric | P1 | Average days between visits |
| CRM-P1-121 | Average ticket value | P1 | Total spend ÷ total visits |
| CRM-P1-122 | Retention rate (90-day return) | P1 | % returning within 90 days |
| CRM-P1-123 | No-show rate per client | P1 | No-shows ÷ total bookings |
| CRM-P1-124 | Cancellation rate per client | P1 | Cancellations ÷ total bookings |

### 5.14 Client List Management

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CRM-P0-125 | Import clients from CSV/Excel | P0 | Column mapping wizard, duplicate detection |
| CRM-P0-126 | Preview before import | P0 | Review changes before committing |
| CRM-P0-127 | Download invalid rows for correction | P0 | Fix and re-upload capability |
| CRM-P0-128 | Export clients to CSV, Excel, PDF | P0 | Field selection, filtered export |
| CRM-P0-129 | Bulk delete (soft delete/archive) | P0 | Multi-select and delete |
| CRM-P1-130 | Bulk add/remove tags | P1 | Multi-select and tag |
| CRM-P1-131 | Bulk send message | P1 | SMS/Email to selection |
| CRM-P0-132 | Merge duplicate profiles | P0 | Auto-detect by email/phone; combine history |
| CRM-P0-133 | Merge cannot be undone warning | P0 | Clear confirmation before merge |
| CRM-P0-134 | Merge logged in audit trail | P0 | Record of merge action |

---

## 6. Business Rules

### 6.1 Client Data Rules

| Rule ID | Rule |
|---------|------|
| CRM-BR-001 | Duplicate detection on creation by phone or email |
| CRM-BR-002 | Phone and email serve as unique identifiers |
| CRM-BR-003 | Client data export available for GDPR/CCPA compliance |
| CRM-BR-004 | SMS requires explicit opt-in consent before sending |
| CRM-BR-005 | Marketing consent separate from transactional communications |

### 6.2 Blocking Rules

| Rule ID | Rule |
|---------|------|
| CRM-BR-006 | Blocked clients cannot book online (Store/App) |
| CRM-BR-007 | Blocked clients see "Time slot unavailable" not "blocked" message |
| CRM-BR-008 | Staff can override block for manual bookings with confirmation |
| CRM-BR-009 | All block/unblock actions logged in audit trail |

### 6.3 Safety Rules

| Rule ID | Rule |
|---------|------|
| CRM-BR-010 | Patch test validation prevents booking if test expired or missing |
| CRM-BR-011 | Patch test expiration calculated from test date + service validity days |
| CRM-BR-012 | Staff alerts displayed prominently on all client views |
| CRM-BR-013 | Allergy information shown during checkout and on calendar |

### 6.4 Form Rules

| Rule ID | Rule |
|---------|------|
| CRM-BR-014 | Form links expire after 24 hours |
| CRM-BR-015 | Signed forms cannot be edited after submission |
| CRM-BR-016 | Form responses stored encrypted for HIPAA compliance |
| CRM-BR-017 | Form retention period configurable (default: 7 years) |

### 6.5 Loyalty Rules

| Rule ID | Rule |
|---------|------|
| CRM-BR-018 | Loyalty points calculated automatically at checkout |
| CRM-BR-019 | Points only earned on eligible items as configured |
| CRM-BR-020 | Tier progress evaluated based on configured period |
| CRM-BR-021 | Claimed rewards expire after configured days |

### 6.6 Referral Rules

| Rule ID | Rule |
|---------|------|
| CRM-BR-022 | Referral reward issued when friend completes first appointment |
| CRM-BR-023 | Self-referral prevented by email/phone detection |
| CRM-BR-024 | New client marketplace fees waived for referral bookings |

### 6.7 Merge Rules

| Rule ID | Rule |
|---------|------|
| CRM-BR-025 | Merge action combines appointments, sales, notes, loyalty points |
| CRM-BR-026 | Merge cannot be undone |
| CRM-BR-027 | Merge logged in audit trail with both profile IDs |

---

## 7. UX Specifications

### 7.1 Client Profile Layout

```
+------------------------------------------------------------------+
| [< Back]                    JANE DOE                    [Edit ✏️] |
+------------------------------------------------------------------+
| ┌──────┐  Jane Doe (Jenny)           ⭐ VIP    🚫 BLOCKED        |
| │ Photo│  📱 (555) 123-4567          Member: Gold               |
| │ 80px │  ✉️ jane@email.com          Since: Jan 2022            |
| └──────┘  🎂 March 15                                            |
+------------------------------------------------------------------+
| ⚠️ STAFF ALERT                                                   |
| Allergic to latex gloves - use nitrile only!                     |
+------------------------------------------------------------------+
| [Profile] [History] [Wallet] [Loyalty] [Forms] [Analytics]       |
+------------------------------------------------------------------+
```

### 7.2 Staff Alert Display

| Context | Display Style |
|---------|---------------|
| Client profile | Full-width yellow card above tabs |
| Calendar appointment | Yellow badge icon on appointment block |
| Checkout screen | Yellow banner at top of ticket |
| Client search results | Yellow dot indicator next to name |

### 7.3 Blocked Client Indicator

| Context | Display Style |
|---------|---------------|
| Client profile | Red "BLOCKED" badge next to name |
| Client list | Red blocked icon in status column |
| Booking attempt | "Time slot unavailable" message |
| Calendar appointment | Red border or indicator |

### 7.4 Client Card (List View)

```
+----------------------------------------------------------+
| ┌────┐  Jane Doe (Jenny)     📱 (555) 123-4567          |
| │Photo│  Last Visit: Dec 15   ⭐ VIP  ⚠️ Alert  🚫 Block |
| └────┘  Services: Hair, Nails  $2,450 lifetime           |
+----------------------------------------------------------+
```

### 7.5 Mobile Responsive

| Screen | Layout Adjustment |
|--------|-------------------|
| Desktop | Full profile with all tabs visible |
| Tablet | Condensed tabs, scrollable sections |
| Mobile | Single-column, tab navigation at bottom |

---

## 8. Technical Requirements

### 8.1 Performance

| Metric | Target |
|--------|--------|
| Client search response | < 500ms for 10,000 clients |
| Profile load time | < 1 second |
| Form submission time | < 2 seconds |
| Import processing | < 30 seconds for 1,000 clients |

### 8.2 Data Model

```typescript
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  email?: string;
  phone: string;
  phoneSecondary?: string;
  birthday?: Date;
  anniversary?: Date;
  gender?: string;
  pronouns?: string;
  address?: Address;
  photoUrl?: string;
  preferredLanguage?: string;

  // Relationships
  favoriteStaff: string[];
  preferredServices: string[];
  servicePreferences?: string;
  allergies?: string;

  // Staff Alert
  staffAlert?: {
    message: string;
    createdAt: Date;
    createdBy: string;
  };

  // Consent
  smsOptIn: boolean;
  smsOptInDate?: Date;
  emailOptIn: boolean;
  emailOptInDate?: Date;
  marketingConsent: boolean;
  photoConsent: boolean;
  doNotContact: boolean;
  preferredChannel: 'sms' | 'email' | 'both' | 'none';

  // Blocking
  isBlocked: boolean;
  blockedAt?: Date;
  blockedBy?: string;
  blockReason?: 'no_show' | 'late_cancellation' | 'inappropriate_behavior' | 'non_payment' | 'other';
  blockReasonNote?: string;

  // Emergency Contact
  emergencyContacts?: EmergencyContact[];

  // Loyalty
  loyaltyPoints: number;
  loyaltyTier?: string;
  excludeFromLoyalty: boolean;

  // Metrics
  lifetimeSpend: number;
  visitCount: number;
  lastVisitDate?: Date;
  firstVisitDate?: Date;
  noShowCount: number;
  cancellationCount: number;

  // System
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

interface PatchTest {
  id: string;
  clientId: string;
  serviceId: string;
  testDate: Date;
  result: 'pass' | 'fail' | 'pending';
  expirationDate: Date;
  performedBy: string;
  notes?: string;
}

interface ConsultationForm {
  id: string;
  clientId: string;
  templateId: string;
  appointmentId?: string;
  status: 'pending' | 'completed' | 'expired';
  sentAt: Date;
  completedAt?: Date;
  responses: FormResponse[];
  signatureUrl?: string;
  ipAddress?: string;
}
```

### 8.3 Offline Behavior

| Data | Local (IndexedDB) | Cloud (PostgreSQL) | Sync Priority |
|------|-------------------|-------------------|---------------|
| Client profiles | ✓ | ✓ | NORMAL |
| Block status | ✓ | ✓ | CRITICAL |
| Staff alerts | ✓ | ✓ | HIGH |
| Allergies | ✓ | ✓ | HIGH |
| Patch tests | ✓ | ✓ | HIGH |
| Loyalty points | ✓ | ✓ | HIGH |
| Visit history | ✓ | ✓ | NORMAL |
| Form templates | Cached | ✓ | LOW |
| Completed forms | ✗ | ✓ | NORMAL (write-only) |
| Wallet balance | ✓ | ✓ | HIGH |

### 8.4 Integrations

| Integration | Purpose | Data Flow |
|-------------|---------|-----------|
| Mango Store | Online booking | Block status → prevents booking |
| Mango Client App | Client self-service | Profile, wallet, loyalty, forms |
| Mango Marketing | Campaigns | Segments, consent, contact info |
| Checkout | Payment | Wallet balance, loyalty points |
| Calendar | Appointments | Alerts, patch test validation |

---

## 9. Success Metrics

### 9.1 Key Performance Indicators

| KPI | Target | Measurement |
|-----|--------|-------------|
| Client profile completeness | 80%+ | Required fields filled |
| Loyalty enrollment rate | 60%+ | Clients with points earned |
| Form completion rate | 85%+ | Forms completed before appointment |
| Patch test compliance | 100% | Services blocked if test expired |
| Client search success | 95%+ | Search finds correct client first try |

### 9.2 User Satisfaction

| Metric | Target |
|--------|--------|
| Feature adoption | 90%+ staff using within 7 days |
| Support tickets | < 2 per 1000 clients managed |
| Import success rate | 95%+ records imported without error |

---

## 10. Risks & Mitigations

### 10.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data privacy breach | Legal liability, trust loss | Encryption, access controls, audit logging |
| Form data loss | Compliance violation | Auto-save drafts, cloud backup |
| Offline sync conflicts | Data inconsistency | Conflict resolution UI, last-write-wins |
| Import failures | Data entry frustration | Validation preview, invalid row download |

### 10.2 Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low loyalty adoption | Missed retention opportunity | Default enrollment, simple redemption |
| Over-blocking clients | Revenue loss | Block reason tracking, easy unblock |
| Patch test compliance gaps | Liability exposure | Automated validation, cannot bypass |

### 10.3 UX Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Information overload | Staff overwhelmed | Progressive disclosure, tabs |
| Missed alerts | Safety incidents | High-visibility design, multiple touchpoints |
| Complex form builder | Low adoption | Pre-built templates, simple UI |

---

## 11. Implementation Plan

### Phase 1: Core Gaps (Q1 2026) — 6 weeks

| Week | Features | Requirements |
|------|----------|--------------|
| 1-2 | Client Blocking | CRM-P0-025 to CRM-P0-034, CRM-P1-035 |
| 3 | Staff Alerts | CRM-P0-013 to CRM-P0-017 |
| 4 | Emergency Contacts | CRM-P1-007 |
| 5-6 | Bulk Actions | CRM-P0-129 to CRM-P1-131, CRM-P0-132 to CRM-P0-134 |

### Phase 2: Forms System (Q2 2026) — 9 weeks

| Week | Features | Requirements |
|------|----------|--------------|
| 1-3 | Form Builder | CRM-P1-045 to CRM-P1-056 |
| 4-5 | Form Delivery | CRM-P1-047, CRM-P1-048, CRM-P1-057, CRM-P1-058 |
| 6-7 | Form Completion | CRM-P1-059 to CRM-P1-062 |
| 8 | E-Signatures | CRM-P1-060 |
| 9 | Patch Test Integration | CRM-P0-036 to CRM-P1-044 |

### Phase 3: Loyalty Enhancement (Q3 2026) — 7 weeks

| Week | Features | Requirements |
|------|----------|--------------|
| 1-2 | Loyalty Configuration | CRM-P1-081 to CRM-P1-086 |
| 3-4 | Rewards System | CRM-P1-087 to CRM-P1-095 |
| 5-6 | Referral Program | CRM-P2-096 to CRM-P2-103 |
| 7 | Wallet UI | CRM-P0-072 to CRM-P1-080 |

### Phase 4: Polish (Q4 2026) — 3 weeks

| Week | Features | Requirements |
|------|----------|--------------|
| 1-2 | Client Reviews | CRM-P2-104 to CRM-P2-108 |
| 3 | Import/Export Enhancements | CRM-P0-125 to CRM-P0-128 |

---

## Appendix

### A. Related Documents

- [Mango POS PRD.md](./Mango%20POS%20PRD.md) - Main product PRD
- [PRD-Checkout-Module.md](./PRD-Checkout-Module.md) - Checkout integration for wallet/loyalty
- [DATA_STORAGE_STRATEGY.md](../architecture/DATA_STORAGE_STRATEGY.md) - Offline sync patterns

### B. Permissions Matrix

| Feature | Owner | Manager | Front Desk | Technician | Marketing | Accountant |
|---------|-------|---------|------------|------------|-----------|------------|
| View clients | ✓ | ✓ | ✓ | Own only | Segments | ✗ |
| Edit clients | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete clients | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Block/Unblock | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Merge profiles | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Add staff alert | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Export clients | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Import clients | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage forms | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Send forms | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage loyalty | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Adjust points | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Bulk actions | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Send messages | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |

### C. Glossary

| Term | Definition |
|------|------------|
| Staff Alert | Single prominent warning displayed across all views |
| Patch Test | Allergy test required before certain services |
| LTV | Client Lifetime Value - total historical + projected spend |
| Segment | Group of clients matching specific criteria |
| Soft Delete | Archive rather than permanent deletion |

---

*Document Version: 5.0 | Created: December 2025 | Updated: December 28, 2025*
