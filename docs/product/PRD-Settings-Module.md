# Product Requirements Document: Settings Module

**Product:** Mango POS
**Module:** Settings
**Version:** 3.0
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

The Settings Module is the central configuration hub for Mango POS, organized into **7 logical categories** for intuitive navigation. This module enables salon owners and managers to configure their business profile, payment processing, device management, third-party integrations, notifications, licensing, and system preferences.

### 1.2 Key Value Proposition

| Value | Description |
|-------|-------------|
| **Organized Navigation** | 7 categories instead of 11 flat sections |
| **Business Customization** | Complete control over salon operations |
| **Payment Integration** | Unified terminal and gateway management |
| **Device Management** | Centralized POS device and hardware control |
| **Third-Party Integrations** | Connect to Google Calendar, QuickBooks, Stripe, etc. |
| **Offline-Ready** | Settings cached locally for offline access |

### 1.3 Success Criteria

| Metric | Target |
|--------|--------|
| Time to find any setting | < 15 seconds |
| Business profile completion | 100% |
| Terminal pairing success rate | 95%+ |
| Settings available offline | 100% |
| Settings load time | < 500ms |

---

## 2. Problem Statement

### 2.1 Current Challenges

| Challenge | Impact | Our Solution |
|-----------|--------|--------------|
| **Too Many Sections** | Users overwhelmed by 11+ settings areas | 7 logical categories |
| **Device/Payment Confusion** | Settings scattered across multiple places | Dedicated "Device Manager" category |
| **No Integration Hub** | Third-party connections hard to manage | Dedicated "Integrations" category |
| **Hard to Find Settings** | Time wasted searching | Category-based navigation |
| **No Search** | Manual browsing required | Settings search (Phase 2) |
| **Settings Lost Offline** | Can't configure during outages | Full offline caching |

### 2.2 User Quotes

> "Every time I need to change tip settings, I have to click through 5 different menus. It takes forever." — Salon Owner

> "When our internet went down, I couldn't even see our business hours to tell a walk-in." — Front Desk Staff

---

## 3. User Personas & Use Cases

### 3.1 Primary User: Salon Owner

**Goals:**
- Configure business profile and branding
- Set up payment processing
- Manage subscription and licensing
- Control who can access what

**Use Cases:**

| ID | Use Case | Priority |
|----|----------|----------|
| SET-UC-001 | Configure business profile (name, logo, hours) | P0 |
| SET-UC-002 | Set up tax rates for services/products | P0 |
| SET-UC-003 | Pair and test payment terminals | P0 |
| SET-UC-004 | Configure tip suggestions and distribution | P0 |
| SET-UC-005 | Manage license and add devices | P0 |
| SET-UC-006 | Set up receipt customization | P1 |

### 3.2 Secondary User: Manager

**Goals:**
- Adjust day-to-day operational settings
- Configure notifications
- Manage staff preferences

**Use Cases:**

| ID | Use Case | Priority |
|----|----------|----------|
| SET-UC-007 | Update operating hours | P0 |
| SET-UC-008 | Configure discount limits | P1 |
| SET-UC-009 | Set up notification preferences | P1 |
| SET-UC-010 | Manage registered devices | P1 |

### 3.3 Secondary User: Front Desk Staff

**Goals:**
- Quick access to view settings
- Understand current configuration

**Use Cases:**

| ID | Use Case | Priority |
|----|----------|----------|
| SET-UC-011 | View business hours | P0 |
| SET-UC-012 | Check tip calculation method | P1 |
| SET-UC-013 | View accepted payment methods | P1 |

---

## 4. Competitive Analysis

| Feature | Mango | Fresha | Booksy | Square | Vagaro |
|---------|-------|--------|--------|--------|--------|
| Category organization | 5 logical | Flat list | Flat list | 3 groups | Flat list |
| Settings search | Yes | No | No | Yes | No |
| Offline settings | Full | No | No | Partial | No |
| Multi-terminal support | Yes | Yes | No | Yes | Yes |
| Tax configuration | Multiple rates | Single | Single | Multiple | Single |
| Tip distribution | Per-provider/pool | Fixed | Fixed | Per-provider | Pool only |
| Receipt customization | Full | Basic | Basic | Full | Basic |
| License management | In-app | Web only | Web only | Web only | Web only |
| Theme customization | Yes | No | No | Partial | No |

**Key Differentiator:** Mango provides the most organized settings structure with full offline access and in-app license management.

---

## 5. Feature Requirements

### 5.1 Settings Navigation

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-001 | Display 7 category navigation sidebar | P0 | Business, Checkout & Payments, Receipts & Notifications, Device Manager, Integrations, Account & Licensing, System visible |
| SET-P0-002 | Category icons with labels | P0 | Each category has distinct icon and readable label |
| SET-P0-003 | Active category highlight | P0 | Currently selected category visually distinct |
| SET-P0-004 | Collapsible sidebar on mobile | P0 | Sidebar collapses to hamburger menu on screens < 768px |
| SET-P1-005 | Settings search bar | P1 | Search all settings; results link to setting location |
| SET-P1-006 | Recent settings quick access | P1 | Show last 5 modified settings |
| SET-P0-007 | Save changes button | P0 | Sticky save button; enabled only when unsaved changes exist |
| SET-P0-008 | Unsaved changes warning | P0 | Prompt before leaving with unsaved changes |

### 5.2 Business Settings - Profile

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-009 | Business name field | P0 | Required; max 100 characters |
| SET-P0-010 | Legal name field | P0 | Required; max 100 characters |
| SET-P0-011 | Business type selection | P0 | Dropdown: Salon, Spa, Barbershop, Nail Salon, Med Spa, Other |
| SET-P0-012 | Business logo upload | P0 | PNG/JPG; max 2MB; 500x500px recommended |
| SET-P1-013 | Business description | P1 | Text area; max 500 characters |

### 5.3 Business Settings - Contact

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-014 | Primary phone number | P0 | Required; valid phone format |
| SET-P0-015 | Business email | P0 | Required; valid email format |
| SET-P1-016 | Website URL | P1 | Optional; valid URL format |
| SET-P1-017 | Social media links | P1 | Facebook, Instagram, TikTok; valid URLs |

### 5.4 Business Settings - Address

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-018 | Street address | P0 | Required |
| SET-P1-019 | Suite/Unit number | P1 | Optional |
| SET-P0-020 | City | P0 | Required |
| SET-P0-021 | State/Province | P0 | Required; dropdown for US/Canada |
| SET-P0-022 | Postal code | P0 | Required; format validated by country |
| SET-P0-023 | Country | P0 | Required; dropdown |

### 5.5 Business Settings - Locale

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-024 | Timezone selection | P0 | IANA timezones; default based on address |
| SET-P0-025 | Currency selection | P0 | USD, CAD, EUR, GBP, etc.; affects all displays |
| SET-P0-026 | Date format | P0 | MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD |
| SET-P0-027 | Time format | P0 | 12-hour or 24-hour |
| SET-P1-028 | Language selection | P1 | English, Spanish, Vietnamese, etc. |

### 5.6 Business Settings - Operating Hours

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-029 | Regular hours per day | P0 | Set open/close time for each day; toggle closed |
| SET-P0-030 | Multiple time blocks per day | P0 | Support split hours (closed for lunch) |
| SET-P1-031 | Special hours for specific dates | P1 | Override regular hours for holidays |
| SET-P1-032 | Closed periods | P1 | Set vacation/renovation closures with date range |
| SET-P1-033 | Notify clients of closure | P1 | Auto-notify booked clients when setting closure |

### 5.7 Business Settings - Tax

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-034 | Enable/disable tax | P0 | Toggle tax calculation on/off |
| SET-P0-035 | Primary tax rate | P0 | Decimal percentage (e.g., 8.25%) |
| SET-P0-036 | Tax name | P0 | Custom name (e.g., "Sales Tax") |
| SET-P1-037 | Tax ID field | P1 | Business tax identification number |
| SET-P1-038 | Tax inclusive pricing | P1 | Toggle whether prices include tax |
| SET-P1-039 | Multiple tax rates | P1 | Add additional rates (city, county) |
| SET-P1-040 | Tax applies to setting | P1 | Configure which rates apply to services vs products |
| SET-P2-041 | Tax exemptions | P2 | Exempt specific products, services, or clients |

### 5.8 Checkout Settings - Tips

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-042 | Enable/disable tips | P0 | Toggle tip prompts on/off |
| SET-P0-043 | Tip calculation method | P0 | Pre-tax or post-tax |
| SET-P0-044 | Suggested tip percentages | P0 | Configure 3 suggestions (e.g., 18%, 20%, 22%) |
| SET-P0-045 | Allow custom tip amount | P0 | Toggle custom tip entry |
| SET-P0-046 | Show "No Tip" option | P0 | Toggle visibility of no-tip button |
| SET-P1-047 | Default tip selection | P1 | Pre-select one suggestion or none |
| SET-P0-048 | Tip distribution method | P0 | Per-provider, split evenly, or custom |
| SET-P1-049 | Pool tips toggle | P1 | Pool all tips for later distribution |
| SET-P1-050 | House tip percentage | P1 | Business keeps X% of tips |

### 5.9 Checkout Settings - Discounts

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-051 | Enable/disable discounts | P0 | Toggle discount functionality |
| SET-P0-052 | Maximum discount percentage | P0 | Limit max discount (e.g., 50%) |
| SET-P0-053 | Require discount reason | P0 | Force reason selection when applying |
| SET-P1-054 | Require manager approval | P1 | Discounts above threshold need approval |
| SET-P1-055 | Approval threshold | P1 | Percentage above which approval required |

### 5.10 Checkout Settings - Payments

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-056 | Enable/disable payment methods | P0 | Toggle card, cash, gift card, store credit |
| SET-P1-057 | Enable check payments | P1 | Optional check acceptance |
| SET-P1-058 | Enable custom payments | P1 | Venmo, Zelle, other manual entry |
| SET-P1-059 | Service charge toggle | P1 | Auto-add service charge |
| SET-P1-060 | Service charge percentage | P1 | Configure service fee amount |
| SET-P2-061 | Cash rounding toggle | P2 | Round cash totals |
| SET-P2-062 | Rounding method | P2 | Nearest 0.05, 0.10, up, or down |

### 5.11 Payment Terminals

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-063 | View paired terminals list | P0 | Show all paired terminals with status |
| SET-P0-064 | Pair new terminal | P0 | Bluetooth/USB pairing wizard |
| SET-P0-065 | Terminal connection status | P0 | Show connected, disconnected, error states |
| SET-P0-066 | Test terminal connection | P0 | Send test transaction; show result |
| SET-P0-067 | Unpair terminal | P0 | Remove terminal with confirmation |
| SET-P1-068 | Rename terminal | P1 | Custom name (e.g., "Front Desk Reader") |
| SET-P1-069 | View terminal transaction log | P1 | Recent transactions per terminal |

### 5.12 Payment Gateway

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-070 | Select gateway provider | P0 | Stripe, Fiserv, Square, PayPal options |
| SET-P0-071 | Gateway connection status | P0 | Show active, inactive, error states |
| SET-P0-072 | API mode toggle | P0 | Switch between live and sandbox/test |
| SET-P0-073 | Merchant ID display | P0 | Show configured merchant ID |
| SET-P1-074 | Gateway test transaction | P1 | Run test charge to verify setup |

### 5.13 Receipts Settings

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P1-075 | Show logo on receipt | P1 | Toggle logo display |
| SET-P1-076 | Receipt header text | P1 | Custom text (max 200 chars) |
| SET-P1-077 | Show address on receipt | P1 | Toggle address display |
| SET-P1-078 | Show phone on receipt | P1 | Toggle phone display |
| SET-P1-079 | Receipt footer text | P1 | Custom text (max 500 chars) |
| SET-P1-080 | Show social media on receipt | P1 | Toggle social handles |
| SET-P1-081 | Return policy text | P1 | Policy text on receipt |
| SET-P1-082 | Thank you message | P1 | Custom thank you text |
| SET-P1-083 | Auto-print receipt | P1 | Print automatically after payment |
| SET-P1-084 | Email receipt option | P1 | Offer email receipt at checkout |
| SET-P1-085 | SMS receipt option | P1 | Offer SMS receipt at checkout |
| SET-P2-086 | QR code on receipt | P2 | Include QR for digital version |
| SET-P1-087 | Receipt preview | P1 | Live preview of receipt changes |

### 5.14 Notification Settings

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P1-088 | Client appointment confirmation | P1 | Toggle email/SMS for new bookings |
| SET-P1-089 | Client appointment reminder | P1 | Toggle email/SMS; set timing |
| SET-P1-090 | Reminder timing selection | P1 | 24 hours, 2 hours, or custom |
| SET-P1-091 | Client cancellation notice | P1 | Toggle email/SMS for cancellations |
| SET-P1-092 | Staff new appointment notice | P1 | Toggle email/SMS/push for staff |
| SET-P1-093 | Staff schedule change notice | P1 | Toggle notifications for changes |
| SET-P1-094 | Owner daily summary | P1 | Toggle daily email summary |
| SET-P1-095 | Owner large transaction alert | P1 | Alert for transactions over threshold |
| SET-P1-096 | Owner refund alert | P1 | Alert when refunds processed |

### 5.15 Account Settings

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-097 | View account email | P0 | Display account email (read-only) |
| SET-P0-098 | View account phone | P0 | Display account phone |
| SET-P0-099 | View account owner name | P0 | Display owner name |
| SET-P0-100 | Change password | P0 | Password change with current password required |
| SET-P1-101 | Enable two-factor authentication | P1 | TOTP-based 2FA setup |
| SET-P1-102 | View active sessions | P1 | List all active login sessions |
| SET-P1-103 | Revoke session | P1 | Log out specific session |
| SET-P1-104 | View login history | P1 | Recent login attempts with location |

### 5.16 Subscription & Licensing

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-105 | View current plan | P0 | Display plan name (Free, Starter, Professional, Enterprise) |
| SET-P0-106 | View billing cycle | P0 | Monthly or annual display |
| SET-P0-107 | View next billing date | P0 | Display next charge date |
| SET-P1-108 | View payment method | P1 | Show card last 4 digits |
| SET-P1-109 | Upgrade/downgrade plan | P1 | Change subscription tier |
| SET-P0-110 | View license key | P0 | Display license identifier |
| SET-P0-111 | View license status | P0 | Active, Expired, Suspended, Trial |
| SET-P0-112 | View license expiration | P0 | Display expiration date |
| SET-P0-113 | View devices allowed/active | P0 | Show X of Y devices |
| SET-P0-114 | Activate license key | P0 | Enter and activate new key |
| SET-P1-115 | Renew license | P1 | Extend subscription |
| SET-P1-116 | Deactivate device from license | P1 | Remove device to free slot |

### 5.17 Device Manager Settings

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P0-117 | View registered POS devices | P0 | List all devices with name, type, status, last active |
| SET-P0-118 | Device mode indicator | P0 | Show offline-enabled vs online-only mode |
| SET-P1-119 | Rename device | P1 | Custom device name |
| SET-P1-120 | Change device mode | P1 | Online-only or offline-enabled toggle |
| SET-P1-121 | Revoke device access | P1 | Immediately disable device |
| SET-P1-122 | Force sync device | P1 | Trigger manual sync |
| SET-P0-123 | View payment terminals | P0 | List paired terminals with connection status |
| SET-P0-124 | Add payment terminal | P0 | Pair new terminal (Stripe S700, WisePad 3, etc.) |
| SET-P0-125 | Test terminal connection | P0 | Send test transaction; show result |
| SET-P0-126 | Remove payment terminal | P0 | Unpair terminal with confirmation |
| SET-P1-127 | View hardware devices | P1 | List printers, scanners, cash drawers |
| SET-P1-128 | Add hardware device | P1 | Configure printer, scanner, or cash drawer |
| SET-P1-129 | Test hardware connection | P1 | Test print, drawer open, etc. |
| SET-P1-130 | Remove hardware device | P1 | Remove device with confirmation |

### 5.18 Integrations Settings

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P1-131 | View connected integrations | P1 | List all integrations with status |
| SET-P1-132 | Connect Google Calendar | P1 | OAuth flow; sync appointments |
| SET-P1-133 | Connect QuickBooks | P1 | OAuth flow; sync transactions |
| SET-P1-134 | Connect Stripe | P1 | API key configuration |
| SET-P1-135 | Connect Twilio | P1 | SMS notification provider |
| SET-P1-136 | Connect Mailchimp | P1 | Email marketing sync |
| SET-P1-137 | Disconnect integration | P1 | Revoke access with confirmation |
| SET-P1-138 | View integration sync status | P1 | Last sync time, error messages |
| SET-P2-139 | Configure webhooks | P2 | Add webhook endpoints for events |
| SET-P2-140 | Manage API keys | P2 | Create, view, revoke API keys |
| SET-P2-141 | View webhook events | P2 | Available events list |
| SET-P2-142 | Test webhook delivery | P2 | Send test payload |

### 5.19 System Settings

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| SET-P2-143 | Theme selection | P2 | Light, Dark, or System |
| SET-P2-144 | Brand color picker | P2 | Custom primary color |
| SET-P2-145 | Accent color picker | P2 | Custom secondary color |
| SET-P2-146 | Default view selection | P2 | Book, Front Desk, or Sales |
| SET-P2-147 | Sidebar position | P2 | Left or Right |
| SET-P2-148 | Font size selection | P2 | Small, Medium, Large |
| SET-P2-149 | Compact mode toggle | P2 | Reduce spacing for more content |
| SET-P2-150 | Module visibility toggles | P2 | Show/hide specific modules |
| SET-P2-151 | Module order customization | P2 | Drag to reorder sidebar |

---

## 6. Business Rules

### 6.1 Settings Access Rules

| Rule ID | Rule |
|---------|------|
| SET-BR-001 | Only Owner and Manager roles can access Settings module |
| SET-BR-002 | Only Owner can modify license and subscription settings |
| SET-BR-003 | Staff can only view relevant settings (hours, payment methods) |

### 6.2 Validation Rules

| Rule ID | Rule |
|---------|------|
| SET-BR-004 | Business name, email, and phone are required before first transaction |
| SET-BR-005 | Address required for receipt printing |
| SET-BR-006 | Tax rate cannot exceed 50% |
| SET-BR-007 | Tip suggestions must be positive percentages |
| SET-BR-008 | Operating hours close time must be after open time |

### 6.3 Payment Rules

| Rule ID | Rule |
|---------|------|
| SET-BR-009 | At least one payment method must be enabled |
| SET-BR-010 | Card payments require a paired terminal or gateway |
| SET-BR-011 | Gateway must be in Live mode for real transactions |
| SET-BR-012 | Terminal pairing requires network connection |

### 6.4 License Rules

| Rule ID | Rule |
|---------|------|
| SET-BR-013 | Expired license enters read-only mode after 7-day grace period |
| SET-BR-014 | Device registration requires active license with available slots |
| SET-BR-015 | Offline-enabled devices require Professional tier or higher |
| SET-BR-016 | License key can only be activated once per account |

### 6.5 Sync Rules

| Rule ID | Rule |
|---------|------|
| SET-BR-017 | Settings sync on app launch and on changes |
| SET-BR-018 | Offline changes sync when connection restored |
| SET-BR-019 | Sync conflicts resolve with server-wins strategy |
| SET-BR-020 | Critical settings (license, terminal) sync with HIGH priority |

---

## 7. UX Specifications

### 7.1 Settings Navigation Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Settings                                    🔍 Search        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐  │
│  │                 │  │                                      │  │
│  │  📊 Business    │  │  [Selected Category Content]         │  │
│  │                 │  │                                      │  │
│  │  💳 Checkout &  │  │                                      │  │
│  │     Payments    │  │                                      │  │
│  │                 │  │                                      │  │
│  │  🧾 Receipts &  │  │                                      │  │
│  │     Notif.      │  │                                      │  │
│  │                 │  │                                      │  │
│  │  📱 Device      │  │                                      │  │
│  │     Manager     │  │                                      │  │
│  │                 │  │                                      │  │
│  │  🔌 Integrations│  │                                      │  │
│  │                 │  │                                      │  │
│  │  👤 Account &   │  │                                      │  │
│  │     Licensing   │  │                                      │  │
│  │                 │  │                                      │  │
│  │  ⚙️ System      │  │                                      │  │
│  │                 │  │                                      │  │
│  └─────────────────┘  └─────────────────────────────────────┘  │
│                                                                  │
│                                          [ Save Changes ]        │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Layout Specifications

| Element | Specification |
|---------|---------------|
| Left Sidebar | 240px width, collapsible on mobile |
| Main Content | Flexible width, scrollable |
| Category Icons | 24px, color-coded per category |
| Save Button | Sticky bottom-right, primary color |
| Search | Top-right, searches all settings |
| Section Headers | 18px font, bold, 24px top margin |
| Form Fields | 16px font, 12px spacing |

### 7.3 Mobile Layout

| Screen Size | Layout Adjustment |
|-------------|-------------------|
| < 768px | Categories as hamburger menu; full-width content |
| 768px - 1024px | Collapsible sidebar; compact content |
| > 1024px | Full sidebar visible; spacious content |

### 7.4 Category Colors

| Category | Icon | Color |
|----------|------|-------|
| Business | 📊 | Blue #3B82F6 |
| Checkout & Payments | 💳 | Green #10B981 |
| Receipts & Notifications | 🧾 | Purple #8B5CF6 |
| Device Manager | 📱 | Cyan #06B6D4 |
| Integrations | 🔌 | Indigo #6366F1 |
| Account & Licensing | 👤 | Orange #F59E0B |
| System | ⚙️ | Gray #6B7280 |

---

## 8. Technical Requirements

### 8.1 Performance

| Metric | Target |
|--------|--------|
| Settings page load | < 500ms |
| Settings save | < 1 second |
| Logo upload | < 3 seconds |
| Search results | < 100ms |
| Terminal pairing | < 30 seconds |

### 8.2 Data Schema

```typescript
interface StoreSettings {
  id: string;
  storeId: string;

  business: {
    name: string;
    legalName: string;
    type: BusinessType;
    logoUrl?: string;
    description?: string;
    phone: string;
    email: string;
    website?: string;
    socialMedia?: SocialMedia;
    address: Address;
    locale: LocaleSettings;
    operatingHours: OperatingHours;
    closedPeriods: ClosedPeriod[];
    tax: TaxSettings;
  };

  checkout: {
    tips: TipSettings;
    discounts: DiscountSettings;
    serviceCharge: ServiceChargeSettings;
    rounding: RoundingSettings;
    paymentMethods: PaymentMethodSettings;
  };

  receipts: {
    header: ReceiptHeader;
    footer: ReceiptFooter;
    options: ReceiptOptions;
  };

  notifications: {
    client: NotificationPreferences;
    staff: NotificationPreferences;
    owner: NotificationPreferences;
  };

  system: {
    theme: 'light' | 'dark' | 'system';
    brandColor: string;
    accentColor: string;
    defaultView: 'book' | 'front_desk' | 'sales';
    sidebarPosition: 'left' | 'right';
    compactMode: boolean;
    fontSize: 'small' | 'medium' | 'large';
    moduleVisibility: ModuleVisibility[];
  };

  createdAt: Date;
  updatedAt: Date;
  syncVersion: number;
}
```

### 8.3 Offline Behavior

| Feature | Offline Behavior |
|---------|------------------|
| View all settings | ✅ Cached locally |
| Edit settings | ✅ Queue for sync |
| Upload logo | ❌ Requires network |
| License validation | ⚠️ 7-day grace period |
| Terminal pairing | ❌ Requires network |
| Save changes | ✅ Saved locally, synced when online |

### 8.4 Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Sensitive data encryption | Encrypted at rest (IndexedDB) |
| API keys | Never stored client-side |
| Session tokens | Secure storage |
| Password change | Requires current password |
| 2FA | TOTP-based authentication |

---

## 9. Success Metrics

### 9.1 Key Performance Indicators

| KPI | Target | Measurement |
|-----|--------|-------------|
| Time to find setting | < 15 seconds | User testing |
| Settings completion rate | 95%+ | Required fields filled |
| Terminal pairing success | 95%+ | First-attempt success |
| Offline availability | 100% | Settings accessible without network |
| Save success rate | 99.9%+ | Changes persisted without error |

### 9.2 User Satisfaction

| Metric | Target |
|--------|--------|
| Feature discoverability | 90%+ users find needed settings |
| Support tickets | < 1 per 1000 sessions |
| Settings-related errors | < 0.1% of sessions |

---

## 10. Risks & Mitigations

### 10.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Settings sync failure | Inconsistent state across devices | Conflict resolution UI; manual sync option |
| Terminal pairing failure | Can't accept card payments | Detailed error messages; fallback instructions |
| License validation offline | App unusable | 7-day grace period; clear expiration warnings |
| Large logo uploads | Slow performance | Client-side compression; size limits |

### 10.2 Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Incorrect tax configuration | Financial/legal issues | Validation warnings; tax calculator preview |
| Payment gateway misconfiguration | Failed transactions | Test transaction before going live |
| License expiration | Business disruption | 30-day, 7-day, and 1-day warnings |

### 10.3 UX Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Settings overwhelming | User abandonment | Category organization; search; progressive disclosure |
| Unsaved changes lost | User frustration | Auto-save draft; unsaved warning |
| Complex terminal setup | Support burden | Step-by-step wizard; video tutorials |

---

## 11. Implementation Plan

### Phase 1: Foundation (Week 1-2)

| Task | Requirements | Estimate |
|------|--------------|----------|
| Settings page layout with 5 categories | SET-P0-001 to SET-P0-004 | 8h |
| Save/cancel with unsaved warning | SET-P0-007, SET-P0-008 | 4h |
| Business Profile section | SET-P0-009 to SET-P1-013 | 10h |
| Business Contact section | SET-P0-014 to SET-P1-017 | 6h |
| Business Address section | SET-P0-018 to SET-P0-023 | 6h |
| Business Locale section | SET-P0-024 to SET-P1-028 | 6h |
| Business Operating Hours | SET-P0-029 to SET-P1-033 | 12h |
| Business Tax section | SET-P0-034 to SET-P2-041 | 10h |
| Settings data service | — | 8h |

### Phase 2: Checkout & Payments (Week 3-4)

| Task | Requirements | Estimate |
|------|--------------|----------|
| Tip Settings | SET-P0-042 to SET-P1-050 | 12h |
| Discount Settings | SET-P0-051 to SET-P1-055 | 6h |
| Payment Methods | SET-P0-056 to SET-P2-062 | 8h |
| Payment Terminals | SET-P0-063 to SET-P1-069 | 16h |
| Payment Gateway | SET-P0-070 to SET-P1-074 | 10h |

### Phase 3: Receipts & Notifications (Week 5-6)

| Task | Requirements | Estimate |
|------|--------------|----------|
| Receipt Settings | SET-P1-075 to SET-P1-087 | 14h |
| Notification Settings | SET-P1-088 to SET-P1-096 | 10h |
| Receipt preview component | — | 6h |

### Phase 4: Account & Licensing (Week 7-8)

| Task | Requirements | Estimate |
|------|--------------|----------|
| Account Settings | SET-P0-097 to SET-P1-104 | 12h |
| Subscription Settings | SET-P0-105 to SET-P1-109 | 8h |
| License Settings | SET-P0-110 to SET-P1-116 | 10h |

### Phase 5: System & Polish (Week 9-10)

| Task | Requirements | Estimate |
|------|--------------|----------|
| Device Management | SET-P1-117 to SET-P1-121 | 10h |
| Theme/Layout Settings | SET-P2-122 to SET-P2-128 | 10h |
| Settings Search | SET-P1-005, SET-P1-006 | 8h |
| Mobile responsive | — | 8h |
| Testing | — | 16h |

---

## Appendix

### A. Related Documents

- [PRD-Sales-Checkout-Module.md](./PRD-Sales-Checkout-Module.md) - Checkout flow using these settings
- [PRD-Device-Manager-Module.md](./PRD-Device-Manager-Module.md) - Device management details
- [PRD-Offline-Mode.md](./PRD-Offline-Mode.md) - Offline settings behavior

### B. Settings Category Structure

```
Settings
├── 1. Business
│   ├── Profile (name, logo, type, description)
│   ├── Contact (phone, email, website, social)
│   ├── Address (street, city, state, zip, country)
│   ├── Locale (timezone, currency, date/time format)
│   ├── Operating Hours (regular, special, closed)
│   └── Tax (rates, exemptions, tax ID)
│
├── 2. Checkout & Payments
│   ├── Tips (percentages, distribution)
│   ├── Discounts (limits, approval)
│   ├── Service Charges
│   ├── Cash Rounding
│   └── Payment Methods (card, cash, gift card, etc.)
│
├── 3. Receipts & Notifications
│   ├── Receipt Header/Footer
│   ├── Receipt Options (print, email, SMS, QR)
│   ├── Client Notifications
│   ├── Staff Notifications
│   └── Owner Notifications
│
├── 4. Device Manager
│   ├── Registered POS Devices (iPads, tablets, desktops)
│   ├── Payment Terminals (Stripe S700, WisePad 3)
│   ├── Hardware Devices (printers, scanners, cash drawers)
│   └── Device Mode (offline-enabled vs online-only)
│
├── 5. Integrations
│   ├── Calendar (Google Calendar, Reserve with Google)
│   ├── Accounting (QuickBooks, Xero)
│   ├── Payment (Stripe, Square)
│   ├── Marketing (Mailchimp, Instagram, Facebook)
│   ├── Communication (Twilio, SendGrid)
│   ├── Webhooks (event subscriptions)
│   └── API Keys (programmatic access)
│
├── 6. Account & Licensing
│   ├── Account Info
│   ├── Security (password, 2FA, sessions)
│   ├── Subscription (plan, billing)
│   └── License Management (key, devices)
│
└── 7. System
    ├── Theme (light/dark/system, brand colors)
    ├── Layout (default view, sidebar, font size)
    └── Module Visibility (show/hide, reorder)
```

### C. Glossary

| Term | Definition |
|------|------------|
| Gateway | Payment processor (Stripe, Fiserv) that handles transactions |
| Terminal | Physical card reader device |
| TOTP | Time-based One-Time Password for 2FA |
| Grace Period | Time after license expiry before read-only mode |
| Sync Version | Counter to detect and resolve conflicts |
| Integration | Third-party service connection (Google Calendar, QuickBooks, etc.) |
| Webhook | HTTP callback for real-time event notifications |
| API Key | Secret token for programmatic access to store data |
| Offline-Enabled | Device mode that stores data locally for offline operation |
| Online-Only | Device mode that requires constant internet connection |

---

*Document Version: 3.1 | Created: December 2025 | Updated: December 28, 2025*
