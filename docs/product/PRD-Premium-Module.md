# Product Requirements Document: Premium & Subscription Module

**Product:** Mango POS
**Module:** Premium & Subscription
**Version:** 1.0
**Last Updated:** December 28, 2025
**Status:** Complete PRD with Acceptance Criteria
**Priority:** P1 (High)

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

The Premium & Subscription Module manages Mango POS subscription tiers, feature access, billing, and license management. It enables freemium conversion, self-service upgrades, and enterprise licensing while ensuring a seamless experience for salon owners.

### 1.2 Key Value Proposition

| Value | Description |
|-------|-------------|
| **Freemium Conversion** | 14-day trial to paid conversion funnel |
| **Self-Service Billing** | Upgrade, downgrade, and manage payment methods |
| **Feature Gating** | Unlock features based on subscription tier |
| **Multi-Location Licensing** | Enterprise plans for salon chains |
| **Revenue Optimization** | Analytics to reduce churn and increase LTV |

### 1.3 Success Criteria

| Metric | Target |
|--------|--------|
| Trial-to-Paid conversion | 15%+ |
| Self-service upgrade rate | 80%+ (vs. sales-assisted) |
| Subscription churn rate | < 3% monthly |
| Payment failure recovery | 85%+ |
| License activation success | 99%+ |

---

## 2. Problem Statement

### 2.1 Current Challenges

| Challenge | Impact | Our Solution |
|-----------|--------|--------------|
| **No self-service billing** | Users can't upgrade without contacting sales | Stripe-powered self-service |
| **Unclear feature access** | Users don't know what's included | Clear tier comparison |
| **Manual license management** | Time-consuming for support | Automated license activation |
| **No trial conversion funnel** | Losing potential customers | Guided trial experience |
| **Multi-location complexity** | Chain salons need custom pricing | Enterprise tier with volume discounts |

---

## 3. User Personas & Use Cases

### 3.1 Primary User: Salon Owner

**Profile:** Business decision-maker, budget-conscious, wants clear ROI
**Goals:** Understand pricing, upgrade when ready, manage billing

**Use Cases:**

| ID | Use Case | Priority |
|----|----------|----------|
| PREM-UC-001 | Start 14-day free trial | P0 |
| PREM-UC-002 | View subscription tier comparison | P0 |
| PREM-UC-003 | Upgrade to paid plan | P0 |
| PREM-UC-004 | Add/update payment method | P0 |
| PREM-UC-005 | View billing history | P1 |
| PREM-UC-006 | Download invoices | P1 |
| PREM-UC-007 | Cancel subscription | P1 |
| PREM-UC-008 | Reactivate after cancellation | P2 |

### 3.2 Secondary User: Salon Manager

**Profile:** Day-to-day operator, limited financial access
**Goals:** Understand current plan limits, request upgrades

**Use Cases:**

| ID | Use Case | Priority |
|----|----------|----------|
| PREM-UC-009 | View current plan and limits | P1 |
| PREM-UC-010 | Request upgrade (notify owner) | P2 |
| PREM-UC-011 | View feature availability | P1 |

### 3.3 Tertiary User: Multi-Location Owner

**Profile:** Manages multiple salon locations
**Goals:** Centralized billing, volume discounts

**Use Cases:**

| ID | Use Case | Priority |
|----|----------|----------|
| PREM-UC-012 | View all location subscriptions | P1 |
| PREM-UC-013 | Apply enterprise pricing | P1 |
| PREM-UC-014 | Add new location to plan | P1 |
| PREM-UC-015 | Transfer license between locations | P2 |

---

## 4. Competitive Analysis

### 4.1 Pricing Comparison

| Competitor | Starter | Growth | Enterprise | Free Trial |
|------------|---------|--------|------------|------------|
| **Mango POS** | $49/mo | $99/mo | $199+/mo | 14 days |
| **Fresha** | Free | Commission-based | Custom | N/A |
| **Booksy** | $29/mo | $69/mo | Custom | 14 days |
| **Vagaro** | $25/mo | $85/mo | Custom | 30 days |
| **Square** | Free | 2.6% + $0.10 | Custom | N/A |
| **MangoMint** | $165/mo | $245/mo | Custom | 14 days |

### 4.2 Feature Comparison

| Feature | Fresha | Booksy | Mango POS |
|---------|--------|--------|-----------|
| Self-service upgrade | ✅ | ✅ | ✅ |
| Transparent pricing | ❌ (commission hidden) | ✅ | ✅ |
| Annual discount | ❌ | ✅ | ✅ (2 months free) |
| Multi-location pricing | ❌ | ⚠️ Limited | ✅ |
| Feature unlock UI | ❌ | ✅ | ✅ |
| Pause subscription | ❌ | ❌ | ✅ |

### 4.3 Mango Advantages

| Advantage | Description |
|-----------|-------------|
| **Transparent Pricing** | No hidden fees or commissions |
| **Offline-First Included** | All tiers include offline mode |
| **Volume Discounts** | Clear multi-location pricing |
| **Pause Option** | Seasonal salons can pause (not cancel) |

---

## 5. Feature Requirements

### 5.1 Subscription Tiers

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| PREM-P0-001 | Define 3 subscription tiers | P0 | Starter, Growth, Enterprise tiers configured |
| PREM-P0-002 | Trial tier (14 days) | P0 | Full features for 14 days; converts to Starter or cancels |
| PREM-P0-003 | Tier feature mapping | P0 | Each feature gated to specific tier(s) |
| PREM-P0-004 | Monthly/Annual billing options | P0 | Annual = 10 months price (2 free) |
| PREM-P1-005 | Multi-location tier pricing | P1 | 10% discount per additional location |
| PREM-P2-006 | Custom enterprise pricing | P2 | Sales-configured custom rates |

### 5.2 Feature Gating

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| PREM-P0-007 | Feature availability check | P0 | API returns feature access for current tier |
| PREM-P0-008 | Locked feature UI | P0 | Show lock icon + "Upgrade to unlock" |
| PREM-P0-009 | Upgrade prompt on locked feature | P0 | Click locked feature → upgrade modal |
| PREM-P1-010 | Usage limits per tier | P1 | Staff count, location count, SMS limits |
| PREM-P1-011 | Limit warning notifications | P1 | 80% and 100% limit reached alerts |
| PREM-P2-012 | Soft vs hard limits | P2 | Configurable: warn vs block at limit |

### 5.3 Billing & Payments

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| PREM-P0-013 | Stripe integration | P0 | Payments processed via Stripe |
| PREM-P0-014 | Add payment method | P0 | Credit/debit card saved securely |
| PREM-P0-015 | Update payment method | P0 | Replace card without service interruption |
| PREM-P0-016 | Auto-renewal | P0 | Charge on billing date; retry on failure |
| PREM-P1-017 | Billing history | P1 | View past invoices and payments |
| PREM-P1-018 | Download PDF invoices | P1 | Generate and download invoice |
| PREM-P1-019 | Payment failure handling | P1 | 3 retries over 7 days; pause after failure |
| PREM-P1-020 | Email receipts | P1 | Send receipt after each charge |
| PREM-P2-021 | ACH/Bank transfer (Enterprise) | P2 | Alternative payment for large clients |

### 5.4 Subscription Management

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| PREM-P0-022 | Upgrade plan | P0 | Immediate access; prorated charge |
| PREM-P0-023 | Downgrade plan | P0 | Takes effect at next billing cycle |
| PREM-P1-024 | Cancel subscription | P1 | Access until end of billing period |
| PREM-P1-025 | Pause subscription | P1 | Up to 3 months; resume anytime |
| PREM-P1-026 | Reactivate subscription | P1 | One-click reactivation |
| PREM-P2-027 | Switch billing cycle | P2 | Monthly → Annual (pro-rated) |
| PREM-P2-028 | Apply coupon/promo code | P2 | Discount applied to next charge |

### 5.5 License Management

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| PREM-P0-029 | License key generation | P0 | Unique key per subscription |
| PREM-P0-030 | License activation on login | P0 | Validate license on authentication |
| PREM-P1-031 | License status display | P1 | Active, Trial, Expired, Suspended |
| PREM-P1-032 | License expiration warning | P1 | 7-day and 1-day warnings |
| PREM-P1-033 | Grace period after expiration | P1 | 3 days read-only access |
| PREM-P2-034 | Offline license validation | P2 | Cached license valid for 7 days offline |
| PREM-P2-035 | License transfer between locations | P2 | Move license from one salon to another |

### 5.6 Trial Experience

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| PREM-P0-036 | Start trial without credit card | P0 | Email + password only to start |
| PREM-P0-037 | Trial days remaining display | P0 | Countdown shown in app |
| PREM-P1-038 | Trial expiration reminders | P1 | Day 7, 3, 1 emails + in-app |
| PREM-P1-039 | Convert trial to paid | P1 | Seamless upgrade flow |
| PREM-P1-040 | Trial extension (1x) | P1 | Support can extend by 7 days |
| PREM-P2-041 | Trial feature analytics | P2 | Track which features were used |

---

## 6. Business Rules

### 6.1 Tier & Feature Rules

| ID | Rule | Logic |
|----|------|-------|
| PREM-BR-001 | Trial includes all Growth features | trial_tier = growth_tier for feature access |
| PREM-BR-002 | Upgrade is immediate | New tier active within 60 seconds |
| PREM-BR-003 | Downgrade at end of cycle | Access current tier until next billing date |
| PREM-BR-004 | Feature lock on downgrade | Features above new tier locked at cycle end |
| PREM-BR-005 | Annual discount = 2 months free | annual_price = monthly_price * 10 |

### 6.2 Billing Rules

| ID | Rule | Logic |
|----|------|-------|
| PREM-BR-006 | Proration on upgrade | charge = (new_price - old_price) * (days_remaining / days_in_cycle) |
| PREM-BR-007 | No refund on downgrade | Credit applied to future billing |
| PREM-BR-008 | 3 payment retry attempts | Retry on day 1, 3, 7 after failure |
| PREM-BR-009 | Suspend after failed retries | Read-only mode after 3 failures |
| PREM-BR-010 | Reactivation clears suspend | Payment method update + successful charge |

### 6.3 License Rules

| ID | Rule | Logic |
|----|------|-------|
| PREM-BR-011 | License checked on login | Validate license status at authentication |
| PREM-BR-012 | Grace period = 3 days | Access continues 3 days after expiration |
| PREM-BR-013 | Offline license cache = 7 days | Can use without internet for 7 days |
| PREM-BR-014 | License tied to salon, not user | Multiple users per license allowed |
| PREM-BR-015 | Suspended license = read-only | Can view data but not create/edit |

### 6.4 Trial Rules

| ID | Rule | Logic |
|----|------|-------|
| PREM-BR-016 | Trial = 14 days | trial_end = signup_date + 14 days |
| PREM-BR-017 | No credit card for trial | Payment info collected at conversion |
| PREM-BR-018 | One trial per email | Cannot restart trial with same email |
| PREM-BR-019 | Trial extension max = 7 days | Support can extend once |
| PREM-BR-020 | Trial expires to Free tier | Limited features after trial if no conversion |

---

## 7. UX Specifications

### 7.1 Pricing Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ MANGO POS PRICING                                    [Annual] [Monthly]│
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│ │     STARTER     │ │     GROWTH      │ │   ENTERPRISE    │    │
│ │    $49/mo       │ │    $99/mo       │ │   $199+/mo      │    │
│ │   or $490/yr    │ │   or $990/yr    │ │   Custom        │    │
│ │                 │ │  ★ POPULAR      │ │                 │    │
│ ├─────────────────┤ ├─────────────────┤ ├─────────────────┤    │
│ │ ✅ 1 Location   │ │ ✅ 1-3 Locations │ │ ✅ Unlimited    │    │
│ │ ✅ 5 Staff      │ │ ✅ 15 Staff      │ │ ✅ Unlimited    │    │
│ │ ✅ Booking      │ │ ✅ All Starter   │ │ ✅ All Growth   │    │
│ │ ✅ POS          │ │ ✅ Online Booking│ │ ✅ API Access   │    │
│ │ ✅ Offline Mode │ │ ✅ Reports       │ │ ✅ Dedicated    │    │
│ │ ✅ Basic Reports│ │ ✅ SMS Marketing │ │   Support       │    │
│ │                 │ │ ✅ Payroll       │ │ ✅ Custom       │    │
│ │                 │ │                 │ │   Integrations  │    │
│ │ [Start Trial]   │ │ [Start Trial]   │ │ [Contact Sales] │    │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Current Plan Display

```
┌─────────────────────────────────────────────────────────────────┐
│ YOUR SUBSCRIPTION                                               │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ GROWTH PLAN                                   🟢 Active      │ │
│ │ $99/month (billed monthly)                                  │ │
│ │ Next billing: January 28, 2026                              │ │
│ │                                                             │ │
│ │ Staff: 8/15 used                ████████░░░░░ 53%           │ │
│ │ Locations: 1/3 used             ██░░░░░░░░░░░ 33%           │ │
│ │ SMS: 450/500 used               ████████████░ 90%           │ │
│ │                                                             │ │
│ │ [Change Plan]  [Manage Payment]  [View Invoices]            │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ PAYMENT METHOD                                                  │
│ 💳 Visa ending in 4242 · Expires 12/26                         │
│ [Update Card]                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Locked Feature UI

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 ADVANCED REPORTS                                    🔒 LOCKED │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│          ╭───────────────────────────────────╮                  │
│          │                                   │                  │
│          │    This feature requires the      │                  │
│          │    GROWTH plan or higher          │                  │
│          │                                   │                  │
│          │    [Upgrade to Growth - $99/mo]   │                  │
│          │    [See What's Included]          │                  │
│          │                                   │                  │
│          ╰───────────────────────────────────╯                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Trial Banner

```
┌─────────────────────────────────────────────────────────────────┐
│ ⏰ Trial ends in 5 days │ [Add Payment Method] to keep your data│
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Technical Requirements

### 8.1 Data Models

```typescript
interface Subscription {
  id: string;
  salonId: string;
  tier: 'trial' | 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'past_due' | 'suspended' | 'canceled' | 'paused';
  billingCycle: 'monthly' | 'annual';

  // Dates
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
  canceledAt?: Date;
  pausedAt?: Date;

  // Stripe
  stripeCustomerId: string;
  stripeSubscriptionId: string;

  // Usage limits
  staffLimit: number;
  locationLimit: number;
  smsLimit: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface License {
  id: string;
  subscriptionId: string;
  salonId: string;
  licenseKey: string;  // UUID
  status: 'active' | 'expired' | 'suspended';
  activatedAt: Date;
  expiresAt: Date;
  lastValidatedAt: Date;
}

interface Invoice {
  id: string;
  subscriptionId: string;
  stripeInvoiceId: string;
  amount: number;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  dueDate: Date;
  paidAt?: Date;
  pdfUrl?: string;
}

interface TierDefinition {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  staffLimit: number;
  locationLimit: number;
  smsLimit: number;
  features: string[];  // Feature keys
}
```

### 8.2 Stripe Integration

| Event | Handler |
|-------|---------|
| `checkout.session.completed` | Create/update subscription |
| `invoice.paid` | Update subscription dates |
| `invoice.payment_failed` | Trigger retry flow |
| `customer.subscription.updated` | Sync tier changes |
| `customer.subscription.deleted` | Mark canceled |

### 8.3 API Endpoints

```
# Subscription
GET    /subscriptions/current
POST   /subscriptions/upgrade
POST   /subscriptions/downgrade
POST   /subscriptions/cancel
POST   /subscriptions/pause
POST   /subscriptions/resume

# Billing
GET    /billing/invoices
GET    /billing/invoices/:id/pdf
POST   /billing/payment-method
DELETE /billing/payment-method/:id

# License
GET    /license/validate
POST   /license/activate

# Features
GET    /features/available
GET    /features/:key/access
```

### 8.4 Feature Flags

```typescript
const TIER_FEATURES = {
  starter: [
    'booking.basic',
    'pos.basic',
    'offline.full',
    'reports.basic',
  ],
  growth: [
    ...TIER_FEATURES.starter,
    'booking.online',
    'reports.advanced',
    'sms.marketing',
    'payroll.basic',
    'multi_location.3',
  ],
  enterprise: [
    ...TIER_FEATURES.growth,
    'api.access',
    'multi_location.unlimited',
    'sso.enabled',
    'custom.integrations',
    'support.dedicated',
  ],
};
```

---

## 9. Success Metrics

### 9.1 Conversion Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Trial-to-Paid conversion | 15%+ | (paid_conversions / trial_starts) * 100 |
| Time to first upgrade | < 10 days | Average days from trial start to upgrade |
| Feature engagement before conversion | 5+ features | Features used before upgrading |
| Upgrade success rate | 99%+ | Successful payment / upgrade attempts |

### 9.2 Revenue Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Monthly churn rate | < 3% | Canceled / active subscriptions |
| Average revenue per user (ARPU) | $85+ | Total revenue / active subscriptions |
| Annual vs monthly ratio | 40%+ annual | Annual subscriptions / total |
| Payment recovery rate | 85%+ | Recovered failed payments / total failures |

### 9.3 UX Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Self-service upgrade rate | 80%+ | Self-service / total upgrades |
| Billing page completion | 95%+ | Successful payment method saves |
| Feature unlock clicks | Track | Clicks on locked features |
| Pricing page time | < 2 min to decision | Time from view to action |

---

## 10. Risks & Mitigations

### 10.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Stripe webhook failures | Low | High | Retry queue, fallback validation |
| License validation offline | Medium | Medium | 7-day cache, graceful degradation |
| Feature flag misconfig | Low | High | Thorough testing, rollback capability |
| Payment data security | Low | Critical | PCI compliance via Stripe Elements |

### 10.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Price too high for market | Medium | High | Competitor research, A/B testing |
| Trial too short | Medium | Medium | 14 days standard; support can extend |
| Churn at downgrade | High | Medium | Exit survey, retention offers |
| Enterprise sales cycle too long | High | Medium | Clear pricing, self-service for smaller |

### 10.3 UX Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Upgrade flow too complex | Medium | High | Minimize steps, test extensively |
| Billing confusion | Medium | Medium | Clear invoices, support chat |
| Feature lock frustration | Medium | Medium | Show value, easy upgrade path |

---

## 11. Implementation Plan

### Phase 1: Core Subscription (Week 1-2)

| Task | Effort | Priority |
|------|--------|----------|
| Stripe integration setup | Large | P0 |
| Tier definitions | Small | P0 |
| Subscription model | Medium | P0 |
| License model | Medium | P0 |
| Feature flag system | Medium | P0 |

### Phase 2: Billing (Week 3)

| Task | Effort | Priority |
|------|--------|----------|
| Payment method management | Medium | P0 |
| Upgrade/downgrade flows | Large | P0 |
| Invoice generation | Medium | P1 |
| Billing history UI | Medium | P1 |

### Phase 3: Trial Experience (Week 4)

| Task | Effort | Priority |
|------|--------|----------|
| Trial signup flow | Medium | P0 |
| Trial countdown UI | Small | P0 |
| Conversion prompts | Medium | P1 |
| Trial extension (support) | Small | P1 |

### Phase 4: Advanced (Week 5-6)

| Task | Effort | Priority |
|------|--------|----------|
| Multi-location pricing | Medium | P1 |
| Pause/resume subscription | Medium | P1 |
| Usage limit tracking | Medium | P1 |
| Enterprise quote request | Small | P2 |

---

## Appendix A: Tier Feature Matrix

| Feature | Starter | Growth | Enterprise |
|---------|---------|--------|------------|
| **Locations** | 1 | 1-3 | Unlimited |
| **Staff** | 5 | 15 | Unlimited |
| **Booking Calendar** | ✅ | ✅ | ✅ |
| **POS & Checkout** | ✅ | ✅ | ✅ |
| **Offline Mode** | ✅ | ✅ | ✅ |
| **Basic Reports** | ✅ | ✅ | ✅ |
| **Online Booking** | ❌ | ✅ | ✅ |
| **Advanced Reports** | ❌ | ✅ | ✅ |
| **SMS Marketing** | ❌ | 500/mo | Unlimited |
| **Payroll** | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ |
| **SSO** | ❌ | ❌ | ✅ |
| **Dedicated Support** | ❌ | ❌ | ✅ |
| **Custom Integrations** | ❌ | ❌ | ✅ |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 28, 2025 | Initial Premium & Subscription PRD with 41 requirements, 20 business rules |

---

*Document Version: 1.0 | Created: December 28, 2025*
