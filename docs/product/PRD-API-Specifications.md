# Product Requirements Document: API Specifications

**Product:** Mango POS
**Module:** External API Layer
**Version:** 1.0
**Last Updated:** December 28, 2025
**Status:** Draft for Development
**Priority:** P0-P2 (Phased)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [API Architecture](#2-api-architecture)
3. [Authentication & Security](#3-authentication--security)
4. [API Categories](#4-api-categories)
   - 4.1 [Online Booking APIs](#41-online-booking-apis)
   - 4.2 [Notifications APIs](#42-notifications-apis)
   - 4.3 [Marketing & Automation APIs](#43-marketing--automation-apis)
   - 4.4 [Payroll APIs](#44-payroll-apis)
   - 4.5 [Reports APIs](#45-reports-apis)
   - 4.6 [Forms & Surveys APIs](#46-forms--surveys-apis)
   - 4.7 [Gift Cards APIs](#47-gift-cards-apis)
   - 4.8 [Memberships APIs](#48-memberships-apis)
   - 4.9 [Service Packages APIs](#49-service-packages-apis)
   - 4.10 [Inventory APIs](#410-inventory-apis)
   - 4.11 [Third-Party Integrations APIs](#411-third-party-integrations-apis)
   - 4.12 [Multi-Location APIs](#412-multi-location-apis)
   - 4.13 [Waitlist APIs](#413-waitlist-apis)
   - 4.14 [Deposits APIs](#414-deposits-apis)
   - 4.15 [Reviews APIs](#415-reviews-apis)
   - 4.16 [SSO & Authentication APIs](#416-sso--authentication-apis)
5. [Webhook Events](#5-webhook-events)
6. [Data Models](#6-data-models)
7. [Implementation Priority](#7-implementation-priority)

---

## 1. Executive Summary

### 1.1 Overview

This document defines the complete API specifications for Mango POS external integrations. These APIs enable:

- **External Applications**: Online Booking Portal, Notifications System, Marketing & Automation
- **Third-Party Integrations**: Google Calendar, QuickBooks, Zapier, etc.
- **Enterprise Features**: Multi-location management, SSO, centralized reporting

### 1.2 API Summary

| Metric | Count |
|--------|-------|
| **Total Endpoints** | ~160 |
| **P0 (Critical)** | ~58 |
| **P1 (High)** | ~77 |
| **P2 (Future)** | ~28 |
| **Webhook Events** | 11 |
| **Data Models** | 35+ |

### 1.3 External Application Strategy

| Application | Build Approach | API Requirement |
|-------------|----------------|-----------------|
| Online Booking Portal | Separate build | API specs only |
| Notifications System | Separate build | API specs only |
| Marketing & Automation | Separate build | API specs only |
| Core POS | This codebase | Full implementation |

---

## 2. API Architecture

### 2.1 Base URL Structure

```
Production:  https://api.mangobiz.com/v1
Staging:     https://api-staging.mangobiz.com/v1
Development: http://localhost:3000/api/v1
```

### 2.2 API Versioning

- Version in URL path: `/api/v1/`, `/api/v2/`
- Breaking changes require new major version
- Deprecation notice: 6 months before removal

### 2.3 Request/Response Format

```typescript
// Standard Success Response
{
  success: true,
  data: { ... },
  meta?: {
    page: number,
    pageSize: number,
    totalCount: number,
    totalPages: number
  }
}

// Standard Error Response
{
  success: false,
  error: {
    code: string,        // e.g., "VALIDATION_ERROR"
    message: string,     // Human-readable message
    details?: object     // Field-specific errors
  }
}
```

### 2.4 Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 20, max: 100) |
| `sortBy` | string | Field to sort by |
| `sortOrder` | 'asc' \| 'desc' | Sort direction |
| `include` | string[] | Related resources to include |

---

## 3. Authentication & Security

### 3.1 Authentication Methods

| Method | Use Case | Header |
|--------|----------|--------|
| **API Key** | Server-to-server | `X-API-Key: <key>` |
| **JWT Bearer** | User context | `Authorization: Bearer <token>` |
| **OAuth 2.0** | Third-party integrations | Standard OAuth flow |

### 3.2 API Key Scopes

| Scope | Permissions |
|-------|-------------|
| `booking:read` | Read appointments, availability |
| `booking:write` | Create/update appointments |
| `client:read` | Read client data |
| `client:write` | Create/update clients |
| `staff:read` | Read staff data |
| `transaction:read` | Read transactions |
| `transaction:write` | Process payments |
| `report:read` | Generate reports |
| `admin:full` | Full administrative access |

### 3.3 Rate Limiting

| Operation Type | Limit |
|----------------|-------|
| Read operations | 100 requests/minute |
| Write operations | 30 requests/minute |
| Bulk operations | 10 requests/minute |
| Report generation | 5 requests/minute |

### 3.4 Security Requirements

- All endpoints require HTTPS
- API keys must be rotated every 90 days
- Webhook payloads signed with HMAC-SHA256
- All data filtered by `salonId` (tenant isolation)
- PII fields encrypted at rest

---

## 4. API Categories

### 4.1 Online Booking APIs

**Purpose:** Enable external booking portal to check availability and create appointments.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/availability` | GET | Available time slots for service + staff | P0 |
| `/availability/staff/{id}` | GET | Staff-specific availability | P0 |
| `/services/public` | GET | Public service catalog | P0 |
| `/staff/public` | GET | Public staff list | P0 |
| `/bookings` | POST | Create booking | P0 |
| `/bookings/{id}` | GET | Get booking details | P0 |
| `/bookings/{id}/cancel` | POST | Cancel booking | P1 |
| `/bookings/{id}/reschedule` | POST | Reschedule booking | P1 |
| `/clients/lookup` | POST | Find or create client | P0 |
| `/salon/info` | GET | Business info, hours | P0 |
| `/salon/policies` | GET | Cancellation policy | P1 |

**Request Examples:**

```typescript
// GET /api/v1/availability?serviceId=xxx&date=2025-01-15
{
  date: "2025-01-15",
  slots: [
    { time: "09:00", staffId: "abc", staffName: "Sarah", available: true },
    { time: "09:30", staffId: "abc", staffName: "Sarah", available: false }
  ]
}

// POST /api/v1/bookings
{
  clientPhone: "555-1234",
  clientName: "John Doe",
  clientEmail: "john@email.com",
  serviceId: "service-uuid",
  staffId: "staff-uuid",  // or "any" for auto-assign
  dateTime: "2025-01-15T09:00:00Z",
  notes: "First time client"
}
```

---

### 4.2 Notifications APIs

**Purpose:** Send notifications and manage templates for appointment reminders, confirmations, etc.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/notifications/send` | POST | Send notification | P0 |
| `/notifications/bulk` | POST | Send bulk notifications | P1 |
| `/notifications/templates` | GET | List templates | P1 |
| `/notifications/templates/{id}` | GET/PUT | Manage template | P1 |
| `/appointments/reminders` | GET | Appointments needing reminders | P0 |
| `/clients/{id}/preferences` | GET/PUT | Notification preferences | P1 |

**Request Example:**

```typescript
// POST /api/v1/notifications/send
{
  channel: "sms" | "email" | "push",
  recipientId: "client-uuid",
  templateId: "reminder-24h",
  variables: {
    clientName: "John",
    appointmentDate: "January 15",
    appointmentTime: "9:00 AM",
    serviceName: "Haircut",
    staffName: "Sarah"
  }
}
```

---

### 4.3 Marketing & Automation APIs

**Purpose:** Client segmentation, analytics, loyalty programs, and campaign management.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/clients/segments` | GET | List client segments | P0 |
| `/clients/segment/{type}` | GET | Get clients in segment | P0 |
| `/clients/export` | GET | Export client data | P1 |
| `/analytics/revenue` | GET | Revenue analytics | P1 |
| `/analytics/clients` | GET | Client metrics | P1 |
| `/analytics/services` | GET | Service analytics | P2 |
| `/loyalty/points/{clientId}` | GET | Check loyalty points | P1 |
| `/loyalty/points/{clientId}` | POST | Award/deduct points | P1 |
| `/loyalty/rewards` | GET | Available rewards | P1 |
| `/promotions` | CRUD | Manage promo codes | P2 |
| `/campaigns` | CRUD | Marketing campaigns | P2 |

**Client Segments:**

| Segment | Definition |
|---------|------------|
| `vip` | Top 20% by spend OR 10+ visits |
| `new` | First visit within 30 days |
| `returning` | 2+ visits, active within 60 days |
| `lapsed` | No visit in 60-180 days |
| `lost` | No visit in 180+ days |
| `birthday-this-month` | Birthday in current month |
| `high-value` | Average ticket > $X |

---

### 4.4 Payroll APIs

**Purpose:** Time tracking, commissions, pay runs, and payroll integrations.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/timesheets` | GET | List timesheets | P0 |
| `/timesheets/{staffId}` | GET | Staff timesheet | P0 |
| `/timesheets/clock-in` | POST | Clock in | P0 |
| `/timesheets/clock-out` | POST | Clock out | P0 |
| `/timesheets/break/start` | POST | Start break | P1 |
| `/timesheets/break/end` | POST | End break | P1 |
| `/pay-runs` | GET | List pay runs | P0 |
| `/pay-runs` | POST | Create pay run | P0 |
| `/pay-runs/{id}` | GET | Get pay run details | P0 |
| `/pay-runs/{id}/approve` | POST | Approve pay run | P1 |
| `/pay-runs/{id}/process` | POST | Process payments | P1 |
| `/commissions/{staffId}` | GET | Commission summary | P0 |
| `/commissions/calculate` | POST | Calculate commissions | P0 |
| `/staff/{id}/earnings` | GET | Staff earnings | P1 |
| `/integrations/payroll/export` | GET | Export to ADP/Gusto | P2 |
| `/integrations/payroll/sync` | POST | Sync with provider | P2 |

---

### 4.5 Reports APIs

**Purpose:** Generate business reports and export data.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/reports/daily-summary` | GET | Daily sales summary | P0 |
| `/reports/revenue` | GET | Revenue report | P0 |
| `/reports/staff-performance` | GET | Staff metrics | P0 |
| `/reports/service-breakdown` | GET | Service sales | P1 |
| `/reports/client-retention` | GET | Retention metrics | P1 |
| `/reports/tips` | GET | Tips report | P1 |
| `/reports/commissions` | GET | Commission report | P0 |
| `/reports/inventory` | GET | Inventory report | P2 |
| `/reports/appointments` | GET | Booking analytics | P1 |
| `/reports/export` | GET | Export CSV/PDF/Excel | P1 |
| `/integrations/quickbooks/sync` | POST | QuickBooks sync | P2 |
| `/integrations/xero/sync` | POST | Xero sync | P2 |
| `/integrations/accounting/export` | GET | Accounting export | P1 |

**Report Request Parameters:**

```typescript
interface ReportRequest {
  startDate: string;       // ISO date
  endDate: string;         // ISO date
  groupBy?: 'day' | 'week' | 'month';
  staffId?: string;
  serviceId?: string;
  format?: 'json' | 'csv' | 'pdf' | 'excel';
}
```

**Standard Reports (9):**

| Report | Description |
|--------|-------------|
| Daily Summary | Today's revenue, transactions, tips |
| Revenue Report | Revenue by period with breakdowns |
| Staff Performance | Services, revenue, tips per staff |
| Commission Report | Commissions earned by staff |
| Service Report | Service popularity, revenue |
| Client Report | New vs returning, retention |
| Tips Report | Tips by staff, by method |
| Appointments Report | Booking patterns, no-shows |
| Inventory Report | Product sales, stock levels |

---

### 4.6 Forms & Surveys APIs

**Purpose:** Client intake forms, consent forms, and post-visit surveys.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/forms` | GET | List form templates | P0 |
| `/forms` | POST | Create form template | P1 |
| `/forms/{id}` | GET/PUT/DELETE | Manage template | P1 |
| `/forms/{id}/submissions` | GET | List submissions | P0 |
| `/forms/submit` | POST | Submit form response | P0 |
| `/clients/{id}/forms` | GET | Client's submissions | P0 |
| `/forms/required/{appointmentType}` | GET | Required forms | P1 |
| `/surveys` | GET | List surveys | P1 |
| `/surveys` | POST | Create survey | P1 |
| `/surveys/{id}` | GET/PUT/DELETE | Manage survey | P1 |
| `/surveys/{id}/responses` | GET | Survey responses | P1 |
| `/surveys/send` | POST | Send survey | P1 |
| `/surveys/nps` | GET | NPS score summary | P2 |

**Form Types:**

| Type | Use Case | When Collected |
|------|----------|----------------|
| `consultation` | New client intake | Before first appointment |
| `patch-test` | Allergy test consent | Before color service |
| `photo-release` | Marketing consent | Before/during service |
| `medical-history` | Health questionnaire | Before spa treatment |
| `service-agreement` | Terms acknowledgment | During booking |

**Survey Types:**

| Type | Use Case | When Sent |
|------|----------|-----------|
| `post-visit` | Service satisfaction | After checkout |
| `nps` | Net Promoter Score | Periodic |
| `rebooking` | Why didn't you rebook? | After X days lapsed |
| `product-feedback` | Product feedback | After purchase |

---

### 4.7 Gift Cards APIs

**Purpose:** Issue, redeem, and manage gift cards.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/gift-cards` | GET | List gift cards | P0 |
| `/gift-cards` | POST | Issue gift card | P0 |
| `/gift-cards/{code}` | GET | Get by code | P0 |
| `/gift-cards/{id}/redeem` | POST | Redeem | P0 |
| `/gift-cards/{id}/balance` | GET | Check balance | P0 |
| `/gift-cards/{id}/reload` | POST | Add funds | P1 |
| `/gift-cards/{id}/void` | POST | Void/cancel | P1 |
| `/gift-cards/{id}/transactions` | GET | Transaction history | P1 |
| `/gift-cards/designs` | GET | Card designs | P2 |
| `/gift-cards/send-email` | POST | Email gift card | P1 |

**Competitors with Gift Cards:** Boulevard, Zenoti, Vagaro, Mangomint, SalonBiz, Uzeli, Fresha

---

### 4.8 Memberships APIs

**Purpose:** Recurring membership plans with benefits.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/memberships` | GET | List plans | P0 |
| `/memberships` | POST | Create plan | P1 |
| `/memberships/{id}` | GET/PUT/DELETE | Manage plan | P1 |
| `/members` | GET | List members | P0 |
| `/members` | POST | Enroll client | P0 |
| `/members/{id}` | GET | Member details | P0 |
| `/members/{id}/pause` | POST | Pause membership | P1 |
| `/members/{id}/resume` | POST | Resume membership | P1 |
| `/members/{id}/cancel` | POST | Cancel membership | P0 |
| `/members/{id}/billing` | GET | Billing history | P1 |
| `/members/{id}/usage` | GET | Benefits usage | P1 |
| `/memberships/billing-run` | POST | Process billing | P0 |

**Competitors with Memberships:** Boulevard, Zenoti, Vagaro, Mangomint, Salonist, Fresha

---

### 4.9 Service Packages APIs

**Purpose:** Pre-paid service bundles (e.g., "10 Blowout Package").

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/packages` | GET | List packages | P0 |
| `/packages` | POST | Create package | P1 |
| `/packages/{id}` | GET/PUT/DELETE | Manage package | P1 |
| `/client-packages` | GET | Purchased packages | P0 |
| `/client-packages` | POST | Sell package | P0 |
| `/client-packages/{id}` | GET | Package details | P0 |
| `/client-packages/{id}/redeem` | POST | Use session | P0 |
| `/client-packages/{id}/transfer` | POST | Transfer | P2 |
| `/client-packages/{id}/extend` | POST | Extend expiry | P2 |

**Competitors with Packages:** Zenoti, Mangomint, Boulevard, Fresha

---

### 4.10 Inventory APIs

**Purpose:** Product management, stock tracking, purchase orders.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/products` | GET | List products | P0 |
| `/products` | POST | Create product | P1 |
| `/products/{id}` | GET/PUT/DELETE | Manage product | P1 |
| `/products/{id}/stock` | GET | Stock levels | P0 |
| `/products/{id}/stock/adjust` | POST | Adjust stock | P1 |
| `/inventory/locations` | GET | Stock by location | P1 |
| `/inventory/low-stock` | GET | Low stock alerts | P0 |
| `/inventory/purchase-orders` | GET/POST | Manage POs | P1 |
| `/inventory/purchase-orders/{id}/receive` | POST | Receive inventory | P1 |
| `/inventory/transfers` | POST | Location transfer | P2 |
| `/inventory/backbar-usage` | POST | Log backbar use | P1 |
| `/suppliers` | CRUD | Manage suppliers | P2 |

**Competitors with Inventory:** Zenoti, Vagaro, Boulevard, Book4Time

---

### 4.11 Third-Party Integrations APIs

**Purpose:** Connect with external services.

| Category | Priority | Competitors |
|----------|----------|-------------|
| Google Calendar Sync | P0 | All |
| Reserve with Google | P1 | Boulevard, Zenoti |
| Instagram Book Now | P1 | Boulevard, Vagaro |
| Facebook Booking | P1 | Vagaro, Booksy |
| Yelp Integration | P2 | Vagaro |
| QuickBooks Sync | P1 | Boulevard, Zenoti |
| Xero Sync | P2 | Zenoti |
| Shopify Sync | P1 | Boulevard |
| Zapier | P0 | Boulevard, Zenoti |
| Mailchimp | P1 | Boulevard |

**Generic Integration Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/integrations/connect` | POST | Start OAuth flow |
| `/integrations/callback` | GET | OAuth callback |
| `/integrations/{id}` | DELETE | Disconnect |
| `/integrations/{id}/sync` | POST | Trigger sync |
| `/integrations/{id}/status` | GET | Check status |

---

### 4.12 Multi-Location APIs

**Purpose:** Enterprise multi-location and franchise management.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/organization` | GET | Get organization | P1 |
| `/organization/locations` | GET | List locations | P0 |
| `/organization/locations` | POST | Add location | P1 |
| `/organization/locations/{id}` | GET/PUT | Manage location | P1 |
| `/organization/users` | GET | Corporate users | P1 |
| `/organization/roles` | GET/POST | Manage roles | P1 |
| `/organization/permissions` | GET | Permission matrix | P1 |
| `/organization/settings` | GET/PUT | Corporate settings | P1 |
| `/organization/reports/consolidated` | GET | Cross-location reports | P0 |
| `/clients/cross-location` | GET | Client across locations | P1 |
| `/staff/cross-location` | GET | Staff at multiple sites | P2 |

**Competitors with Multi-Location:** Zenoti (specialty), Boulevard (Enterprise tier)

---

### 4.13 Waitlist APIs

**Purpose:** Walk-in queue management.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/waitlist` | GET | Current waitlist | P0 |
| `/waitlist` | POST | Add to waitlist | P0 |
| `/waitlist/{id}` | GET/PUT/DELETE | Manage entry | P0 |
| `/waitlist/{id}/notify` | POST | Notify client | P1 |
| `/waitlist/{id}/convert` | POST | Convert to appointment | P0 |
| `/waitlist/estimate` | GET | Estimated wait time | P1 |
| `/waitlist/preferences` | GET | Client preferences | P2 |

---

### 4.14 Deposits APIs

**Purpose:** Booking deposits and prepayments.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/deposits/policies` | GET | List policies | P1 |
| `/deposits/policies` | POST | Create policy | P1 |
| `/deposits/collect` | POST | Collect deposit | P0 |
| `/deposits/{id}` | GET | Get deposit | P0 |
| `/deposits/{id}/refund` | POST | Refund deposit | P1 |
| `/deposits/{id}/apply` | POST | Apply to appointment | P0 |
| `/appointments/{id}/deposit-required` | GET | Check if required | P0 |

---

### 4.15 Reviews APIs

**Purpose:** Reputation management and review collection.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/reviews` | GET | List reviews | P1 |
| `/reviews/{id}` | GET | Get review | P1 |
| `/reviews/{id}/respond` | POST | Respond to review | P1 |
| `/reviews/request` | POST | Send review request | P1 |
| `/reviews/summary` | GET | Aggregate ratings | P1 |
| `/reviews/staff/{id}` | GET | Staff reviews | P1 |
| `/reputation/google` | GET | Google reviews sync | P2 |
| `/reputation/yelp` | GET | Yelp reviews sync | P2 |

---

### 4.16 SSO & Authentication APIs

**Purpose:** Enterprise single sign-on and API key management.

| Endpoint | Method | Purpose | Priority |
|----------|--------|---------|----------|
| `/auth/sso/saml/metadata` | GET | SAML metadata | P2 |
| `/auth/sso/saml/login` | POST | SAML login | P2 |
| `/auth/sso/saml/callback` | POST | SAML callback | P2 |
| `/auth/sso/oidc/authorize` | GET | OIDC authorize | P2 |
| `/auth/sso/providers` | GET | SSO providers | P2 |
| `/auth/sso/providers` | POST | Configure SSO | P2 |
| `/auth/api-keys` | CRUD | Manage API keys | P1 |

**Competitors with SSO:** Boulevard, Zenoti (Okta, Azure AD)

---

## 5. Webhook Events

### 5.1 Appointment Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `appointment.created` | New booking | Appointment details |
| `appointment.updated` | Time/staff change | Updated appointment |
| `appointment.cancelled` | Cancellation | Appointment + reason |
| `appointment.reminder` | X hours before | Appointment details |
| `appointment.checked_in` | Client arrives | Appointment details |
| `appointment.completed` | Service done | Appointment + ticket |

### 5.2 Transaction Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `transaction.completed` | Payment processed | Transaction details |
| `client.created` | New client added | Client details |

### 5.3 Form/Survey Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `form.submitted` | Form completed | Submission details |
| `survey.response` | Survey completed | Response + scores |
| `form.required` | Form needed | Form + appointment |

### 5.4 Webhook Security

- All payloads signed with HMAC-SHA256
- Signature header: `X-Mango-Signature`
- Retry policy: 3 attempts with exponential backoff
- Timeout: 30 seconds

---

## 6. Data Models

### 6.1 Gift Card Models

```typescript
interface GiftCard {
  id: string;
  salonId: string;
  code: string;
  type: 'physical' | 'digital';
  originalAmount: number;
  currentBalance: number;
  purchaserId?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  message?: string;
  designId?: string;
  issuedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'depleted' | 'expired' | 'voided';
  lastUsedAt?: Date;
}

interface GiftCardTransaction {
  id: string;
  giftCardId: string;
  type: 'purchase' | 'redeem' | 'reload' | 'void' | 'refund';
  amount: number;
  balanceAfter: number;
  ticketId?: string;
  staffId?: string;
  createdAt: Date;
}
```

### 6.2 Membership Models

```typescript
interface MembershipPlan {
  id: string;
  salonId: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  setupFee?: number;
  benefits: MembershipBenefit[];
  isActive: boolean;
  maxMembers?: number;
  createdAt: Date;
}

interface MembershipBenefit {
  type: 'discount' | 'free-service' | 'priority-booking' | 'free-product' | 'points-multiplier';
  value: number;
  serviceIds?: string[];
  limit?: number;
  description: string;
}

interface Member {
  id: string;
  clientId: string;
  membershipPlanId: string;
  status: 'active' | 'paused' | 'cancelled' | 'past_due' | 'pending';
  startDate: Date;
  nextBillingDate: Date;
  pausedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  paymentMethodId: string;
  benefitsUsedThisCycle: Record<string, number>;
}
```

### 6.3 Package Models

```typescript
interface ServicePackage {
  id: string;
  salonId: string;
  name: string;
  description: string;
  serviceIds: string[];
  totalSessions: number;
  price: number;
  regularPrice: number;
  savingsAmount: number;
  validityDays: number;
  isActive: boolean;
  isTransferable: boolean;
}

interface ClientPackage {
  id: string;
  clientId: string;
  packageId: string;
  purchaseDate: Date;
  expirationDate: Date;
  totalSessions: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  status: 'active' | 'expired' | 'depleted';
  purchaseTicketId: string;
  usageHistory: PackageUsage[];
}

interface PackageUsage {
  date: Date;
  serviceId: string;
  staffId: string;
  ticketId: string;
}
```

### 6.4 Inventory Models

```typescript
interface Product {
  id: string;
  salonId: string;
  sku: string;
  barcode?: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  retailPrice: number;
  costPrice: number;
  margin: number;
  isRetail: boolean;
  isBackbar: boolean;
  minStockLevel: number;
  supplierId?: string;
  imageUrl?: string;
  isActive: boolean;
}

interface InventoryLevel {
  productId: string;
  locationId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  lastCountDate?: Date;
  lastRestockDate?: Date;
}

interface PurchaseOrder {
  id: string;
  salonId: string;
  supplierId: string;
  status: 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderedAt?: Date;
  receivedAt?: Date;
  notes?: string;
}
```

### 6.5 Multi-Location Models

```typescript
interface Organization {
  id: string;
  name: string;
  type: 'single' | 'multi-location' | 'franchise';
  billingPlan: string;
  primaryContactId: string;
  locations: Location[];
  settings: OrganizationSettings;
  createdAt: Date;
}

interface Location {
  id: string;
  organizationId: string;
  name: string;
  address: Address;
  phone: string;
  email: string;
  timezone: string;
  businessHours: BusinessHours[];
  isActive: boolean;
  settings: LocationSettings;
}

interface OrganizationSettings {
  allowCrossLocationBooking: boolean;
  sharedClientDatabase: boolean;
  sharedGiftCards: boolean;
  sharedMemberships: boolean;
  centralizedReporting: boolean;
  franchiseeFeePercentage?: number;
}
```

### 6.6 Form & Survey Models

```typescript
interface FormTemplate {
  id: string;
  salonId: string;
  name: string;
  type: 'consultation' | 'patch-test' | 'photo-release' | 'medical-history' | 'service-agreement' | 'custom';
  fields: FormField[];
  requiredForServices?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'signature' | 'photo';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: string;
}

interface FormSubmission {
  id: string;
  formId: string;
  clientId: string;
  appointmentId?: string;
  responses: Record<string, any>;
  signatureUrl?: string;
  submittedAt: Date;
  submittedVia: 'kiosk' | 'email' | 'sms-link' | 'in-app' | 'online-booking';
}

interface Survey {
  id: string;
  salonId: string;
  name: string;
  type: 'post-visit' | 'nps' | 'rebooking' | 'product-feedback' | 'custom';
  questions: SurveyQuestion[];
  triggerAfter?: number;
  isActive: boolean;
}

interface SurveyQuestion {
  id: string;
  type: 'rating' | 'nps' | 'text' | 'select' | 'multiselect';
  text: string;
  required: boolean;
  options?: string[];
  scale?: { min: number; max: number };
}
```

### 6.7 Additional Models

```typescript
interface WaitlistEntry {
  id: string;
  salonId: string;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  requestedServices: string[];
  preferredStaffId?: string;
  partySize: number;
  addedAt: Date;
  estimatedWaitMinutes: number;
  position: number;
  status: 'waiting' | 'notified' | 'seated' | 'no-show' | 'cancelled';
  notifiedAt?: Date;
  seatedAt?: Date;
  notes?: string;
}

interface DepositPolicy {
  id: string;
  salonId: string;
  name: string;
  type: 'percentage' | 'fixed' | 'full';
  amount: number;
  applyTo: 'all' | 'new-clients' | 'high-value' | 'specific-services';
  serviceIds?: string[];
  minimumBookingValue?: number;
  refundableUntilHours: number;
  isActive: boolean;
}

interface Deposit {
  id: string;
  appointmentId: string;
  clientId: string;
  amount: number;
  status: 'collected' | 'applied' | 'refunded' | 'forfeited';
  collectedAt: Date;
  paymentMethodId: string;
  transactionId: string;
  appliedToTicketId?: string;
  refundedAt?: Date;
  refundReason?: string;
}

interface Review {
  id: string;
  salonId: string;
  clientId: string;
  appointmentId?: string;
  staffId?: string;
  source: 'internal' | 'google' | 'yelp' | 'facebook';
  rating: number;
  title?: string;
  content: string;
  photos?: string[];
  response?: string;
  respondedAt?: Date;
  isPublic: boolean;
  createdAt: Date;
}

interface ReputationSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  recentTrend: 'improving' | 'stable' | 'declining';
  responseRate: number;
  bySource: { source: string; avgRating: number; count: number }[];
  byStaff: { staffId: string; avgRating: number; count: number }[];
}

interface Integration {
  id: string;
  salonId: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  lastSyncAt?: Date;
  syncErrors?: string[];
  createdAt: Date;
}

interface PayRun {
  id: string;
  salonId: string;
  periodStart: Date;
  periodEnd: Date;
  status: 'draft' | 'pending_approval' | 'approved' | 'processing' | 'completed';
  staffPayments: StaffPayment[];
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  processedAt?: Date;
}

interface StaffPayment {
  staffId: string;
  staffName: string;
  hoursWorked: number;
  hourlyRate: number;
  baseWages: number;
  commissions: number;
  tips: number;
  grossPay: number;
  deductions: number;
  netPay: number;
}

interface NotificationTemplate {
  id: string;
  salonId: string;
  name: string;
  channel: 'sms' | 'email' | 'push';
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
}

interface NotificationLog {
  id: string;
  salonId: string;
  clientId: string;
  channel: 'sms' | 'email' | 'push';
  templateId?: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt: Date;
  errorMessage?: string;
}

interface LoyaltyAccount {
  clientId: string;
  salonId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lifetimePoints: number;
  lastEarnedAt?: Date;
}

interface LoyaltyTransaction {
  id: string;
  clientId: string;
  amount: number;
  type: 'earn' | 'redeem' | 'adjust' | 'expire';
  description: string;
  ticketId?: string;
  createdAt: Date;
}

interface Promotion {
  id: string;
  salonId: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free-service';
  value: number;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usageCount: number;
  serviceIds?: string[];
  isActive: boolean;
}

interface Campaign {
  id: string;
  salonId: string;
  name: string;
  segment: string;
  channel: 'sms' | 'email' | 'push';
  templateId: string;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  scheduledAt?: Date;
  sentAt?: Date;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  };
}

interface WebhookSubscription {
  id: string;
  salonId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastDeliveredAt?: Date;
  failureCount: number;
}
```

---

## 7. Implementation Priority

### 7.1 Summary by Priority

| Category | P0 | P1 | P2 | Total |
|----------|----|----|-----|-------|
| Online Booking | 7 | 4 | - | 11 |
| Notifications | 3 + 8 webhooks | 5 | - | 16 |
| Marketing | 2 | 7 | 3 | 12 |
| Payroll | 8 | 4 | 2 | 14 |
| Reports | 4 | 5 | 4 | 13 |
| Forms & Surveys | 4 + 3 webhooks | 9 | 1 | 14 |
| Gift Cards | 5 | 4 | 1 | 10 |
| Memberships | 5 | 6 | 1 | 12 |
| Packages | 5 | 2 | 2 | 9 |
| Inventory | 3 | 7 | 2 | 12 |
| Integrations | 2 | 5 | 3 | 10 |
| Multi-Location | 2 | 7 | 1 | 10 |
| Waitlist | 4 | 2 | 1 | 7 |
| Deposits | 3 | 3 | - | 6 |
| Reviews | 1 | 5 | 2 | 8 |
| SSO/Auth | - | 2 | 5 | 7 |
| **TOTAL** | **~58** | **~77** | **~28** | **~160** |

### 7.2 Competitive Priority Matrix

| Feature | Fresha | Boulevard | Zenoti | Vagaro | Mangomint | Priority |
|---------|--------|-----------|--------|--------|-----------|----------|
| Gift Cards | Yes | Yes | Yes | Yes | Yes | **P0** |
| Memberships | Yes | Yes | Yes | Yes | Yes | **P0** |
| Packages | Yes | Yes | Yes | Yes | Yes | **P0** |
| Inventory | No | Yes | Yes | Yes | Yes | **P1** |
| Multi-Location | No | Yes | Yes | No | No | **P1** |
| QuickBooks | Yes | Yes | Yes | Yes | Yes | **P1** |
| Zapier | No | Yes | Yes | No | No | **P1** |
| SSO/SAML | No | Yes | Yes | No | No | **P2** |
| Google Reserve | No | Yes | Yes | Yes | No | **P1** |

### 7.3 Phased Implementation

**Phase 1 (P0 - Critical):** ~58 endpoints
- Online Booking core
- Gift Cards, Memberships, Packages
- Basic Reports
- Waitlist & Deposits core
- Webhook infrastructure

**Phase 2 (P1 - High):** ~77 endpoints
- Full Payroll suite
- Inventory management
- Third-party integrations (Google, QuickBooks, Zapier)
- Multi-location basics
- Reviews & Forms

**Phase 3 (P2 - Future):** ~28 endpoints
- SSO/SAML
- Advanced analytics
- Reputation sync (Google, Yelp)
- Accounting integrations

---

## Appendix

### A. Related Documents

- [TECHNICAL_DOCUMENTATION.md](../architecture/TECHNICAL_DOCUMENTATION.md)
- [DATA_STORAGE_STRATEGY.md](../architecture/DATA_STORAGE_STRATEGY.md)
- [PAYMENT_INTEGRATION.md](../architecture/PAYMENT_INTEGRATION.md)

### B. API Documentation Deliverables

1. **OpenAPI/Swagger Spec** - Machine-readable API definition
2. **API Reference Docs** - Human-readable documentation
3. **Webhook Event Catalog** - All events + payloads
4. **Authentication Guide** - API key setup, scopes, security
5. **Integration Examples** - Code samples for common flows
6. **Postman Collection** - Ready-to-use API testing

---

*Document Version: 1.0 | Created: December 28, 2025*
