# Implementation Plan: Settings Module

**Module:** Settings  
**Version:** 1.0  
**Created:** December 28, 2025  
**PRD Reference:** `docs/product/PRD-Settings-Module.md`  
**Estimated Duration:** 10 weeks  
**Total Estimated Hours:** ~240 hours  

---

## Overview

This document outlines the implementation plan for the Settings Module, organized into 5 phases corresponding to the 5 settings categories.

### Settings Categories

| # | Category | Priority | Weeks |
|---|----------|----------|-------|
| 1 | Business | P0 | 1-2 |
| 2 | Checkout & Payments | P0 | 3-4 |
| 3 | Receipts & Notifications | P1 | 5-6 |
| 4 | Account & Licensing | P0 | 7-8 |
| 5 | System & Polish | P2 | 9-10 |

---

## Prerequisites

Before starting implementation:

- [ ] Review PRD-Settings-Module.md
- [ ] Ensure Supabase tables exist for settings
- [ ] Confirm IndexedDB schema supports settings
- [ ] Design system tokens available
- [ ] Form components ready (Input, Select, Toggle, etc.)

---

## Phase 1: Foundation & Business Settings (Week 1-2)

### Goals
- Set up settings page infrastructure
- Implement Business category (Profile, Contact, Address, Locale, Hours, Tax)

### Tasks

#### Week 1: Infrastructure & Profile

| Task | File | Hours | Status |
|------|------|-------|--------|
| Create SettingsPage layout | `src/components/modules/settings/SettingsPage.tsx` | 4 | ⬜ |
| Create SettingsNavigation (5 categories) | `src/components/modules/settings/SettingsNavigation.tsx` | 4 | ⬜ |
| Create settings types | `src/types/settings.ts` | 4 | ⬜ |
| Create settingsDB (IndexedDB) | `src/db/settingsDB.ts` | 4 | ⬜ |
| Create settingsSlice (Redux) | `src/store/slices/settingsSlice.ts` | 4 | ⬜ |
| Business > Profile section | `src/components/modules/settings/sections/ProfileSection.tsx` | 6 | ⬜ |
| Business > Contact section | `src/components/modules/settings/sections/ContactSection.tsx` | 4 | ⬜ |
| Logo upload component | `src/components/modules/settings/sections/LogoUpload.tsx` | 4 | ⬜ |

**Week 1 Total:** 34 hours

#### Week 2: Address, Locale, Hours, Tax

| Task | File | Hours | Status |
|------|------|-------|--------|
| Business > Address section | `src/components/modules/settings/sections/AddressSection.tsx` | 4 | ⬜ |
| Business > Locale section | `src/components/modules/settings/sections/LocaleSection.tsx` | 4 | ⬜ |
| Business > Operating Hours | `src/components/modules/settings/sections/OperatingHoursSection.tsx` | 8 | ⬜ |
| Special hours & closed periods | `src/components/modules/settings/sections/SpecialHoursSection.tsx` | 4 | ⬜ |
| Business > Tax section | `src/components/modules/settings/sections/TaxSection.tsx` | 6 | ⬜ |
| Multiple tax rates UI | `src/components/modules/settings/sections/TaxRatesTable.tsx` | 4 | ⬜ |
| Settings sync service | `src/services/settingsService.ts` | 8 | ⬜ |

**Week 2 Total:** 38 hours

### Phase 1 Deliverables
- [ ] Settings page with navigation
- [ ] Complete Business category
- [ ] Settings persist to IndexedDB
- [ ] Settings sync to Supabase

### Phase 1 Acceptance Criteria
- [ ] User can navigate to Settings from More menu
- [ ] User can view/edit business profile
- [ ] User can upload logo
- [ ] User can set operating hours
- [ ] User can configure tax rates
- [ ] Settings save and persist

---

## Phase 2: Checkout & Payments (Week 3-4)

### Goals
- Implement all checkout configuration
- Implement payment terminal management
- Implement hardware device management

### Tasks

#### Week 3: Tips, Discounts, Payment Methods

| Task | File | Hours | Status |
|------|------|-------|--------|
| Checkout > Tip Settings | `src/components/modules/settings/sections/TipSettingsSection.tsx` | 6 | ⬜ |
| Checkout > Tip Distribution | `src/components/modules/settings/sections/TipDistributionSection.tsx` | 4 | ⬜ |
| Checkout > Discount Settings | `src/components/modules/settings/sections/DiscountSettingsSection.tsx` | 4 | ⬜ |
| Checkout > Service Charges | `src/components/modules/settings/sections/ServiceChargesSection.tsx` | 3 | ⬜ |
| Checkout > Rounding | `src/components/modules/settings/sections/RoundingSection.tsx` | 2 | ⬜ |
| Checkout > Payment Methods | `src/components/modules/settings/sections/PaymentMethodsSection.tsx` | 4 | ⬜ |
| CheckoutPaymentsSettings container | `src/components/modules/settings/categories/CheckoutPaymentsSettings.tsx` | 4 | ⬜ |

**Week 3 Total:** 27 hours

#### Week 4: Terminals, Gateway, Hardware

| Task | File | Hours | Status |
|------|------|-------|--------|
| Checkout > Payment Terminals list | `src/components/modules/settings/sections/PaymentTerminalsSection.tsx` | 6 | ⬜ |
| Terminal pairing flow | `src/components/modules/settings/sections/TerminalPairingModal.tsx` | 8 | ⬜ |
| Terminal test connection | `src/services/terminalService.ts` | 4 | ⬜ |
| Checkout > Payment Gateway | `src/components/modules/settings/sections/PaymentGatewaySection.tsx` | 6 | ⬜ |
| Checkout > Hardware Devices | `src/components/modules/settings/sections/HardwareDevicesSection.tsx` | 6 | ⬜ |
| Printer test print | `src/services/printerService.ts` | 4 | ⬜ |
| Cash drawer open command | `src/services/cashDrawerService.ts` | 2 | ⬜ |

**Week 4 Total:** 36 hours

### Phase 2 Deliverables
- [ ] Complete Checkout & Payments category
- [ ] Terminal pairing functional
- [ ] Hardware device management

### Phase 2 Acceptance Criteria
- [ ] User can configure tip percentages
- [ ] User can set discount limits
- [ ] User can enable/disable payment methods
- [ ] User can pair payment terminal
- [ ] User can test terminal connection
- [ ] User can add receipt printer

---

## Phase 3: Receipts & Notifications (Week 5-6)

### Goals
- Implement receipt customization
- Implement notification preferences for clients, staff, owners

### Tasks

#### Week 5: Receipts

| Task | File | Hours | Status |
|------|------|-------|--------|
| Receipts > Header settings | `src/components/modules/settings/sections/ReceiptHeaderSection.tsx` | 4 | ⬜ |
| Receipts > Footer settings | `src/components/modules/settings/sections/ReceiptFooterSection.tsx` | 4 | ⬜ |
| Receipts > Options | `src/components/modules/settings/sections/ReceiptOptionsSection.tsx` | 4 | ⬜ |
| Receipt preview component | `src/components/modules/settings/sections/ReceiptPreview.tsx` | 6 | ⬜ |
| ReceiptsNotificationsSettings container | `src/components/modules/settings/categories/ReceiptsNotificationsSettings.tsx` | 4 | ⬜ |

**Week 5 Total:** 22 hours

#### Week 6: Notifications

| Task | File | Hours | Status |
|------|------|-------|--------|
| Notifications > Client preferences | `src/components/modules/settings/sections/ClientNotificationsSection.tsx` | 4 | ⬜ |
| Notifications > Staff preferences | `src/components/modules/settings/sections/StaffNotificationsSection.tsx` | 4 | ⬜ |
| Notifications > Owner preferences | `src/components/modules/settings/sections/OwnerNotificationsSection.tsx` | 4 | ⬜ |
| Notification toggle matrix UI | `src/components/modules/settings/sections/NotificationMatrix.tsx` | 4 | ⬜ |
| Reminder timing configuration | `src/components/modules/settings/sections/ReminderTimingSection.tsx` | 4 | ⬜ |

**Week 6 Total:** 20 hours

### Phase 3 Deliverables
- [ ] Complete Receipts & Notifications category
- [ ] Receipt preview functional
- [ ] All notification toggles working

### Phase 3 Acceptance Criteria
- [ ] User can customize receipt header/footer
- [ ] User can preview receipt
- [ ] User can set auto-print preference
- [ ] User can toggle client notifications
- [ ] User can toggle staff notifications
- [ ] User can toggle owner alerts

---

## Phase 4: Account & Licensing (Week 7-8)

### Goals
- Implement account management
- Implement security settings (password, 2FA)
- Implement license management

### Tasks

#### Week 7: Account & Security

| Task | File | Hours | Status |
|------|------|-------|--------|
| Account > Info section | `src/components/modules/settings/sections/AccountInfoSection.tsx` | 4 | ⬜ |
| Account > Password change | `src/components/modules/settings/sections/PasswordChangeSection.tsx` | 6 | ⬜ |
| Account > 2FA setup flow | `src/components/modules/settings/sections/TwoFactorSection.tsx` | 8 | ⬜ |
| Account > Session management | `src/components/modules/settings/sections/SessionManagementSection.tsx` | 4 | ⬜ |
| Account > Subscription info | `src/components/modules/settings/sections/SubscriptionSection.tsx` | 4 | ⬜ |
| AccountLicensingSettings container | `src/components/modules/settings/categories/AccountLicensingSettings.tsx` | 4 | ⬜ |

**Week 7 Total:** 30 hours

#### Week 8: Licensing

| Task | File | Hours | Status |
|------|------|-------|--------|
| License > Info display | `src/components/modules/settings/sections/LicenseInfoSection.tsx` | 4 | ⬜ |
| License > Activation flow | `src/components/modules/settings/sections/LicenseActivationModal.tsx` | 6 | ⬜ |
| License > Renewal flow | `src/components/modules/settings/sections/LicenseRenewalSection.tsx` | 4 | ⬜ |
| License > Device management | `src/components/modules/settings/sections/LicenseDevicesSection.tsx` | 6 | ⬜ |
| License alerts integration | `src/services/licenseAlertService.ts` | 4 | ⬜ |
| License validation service | `src/services/licenseService.ts` | 6 | ⬜ |

**Week 8 Total:** 30 hours

### Phase 4 Deliverables
- [ ] Complete Account & Licensing category
- [ ] 2FA setup functional
- [ ] License activation functional

### Phase 4 Acceptance Criteria
- [ ] User can view account info
- [ ] User can change password
- [ ] User can enable 2FA
- [ ] User can view active sessions
- [ ] User can view license status
- [ ] User can activate new license
- [ ] User can manage licensed devices

---

## Phase 5: System & Polish (Week 9-10)

### Goals
- Implement system settings (devices, theme, layout)
- Add settings search
- Mobile responsive
- Testing and polish

### Tasks

#### Week 9: System Settings

| Task | File | Hours | Status |
|------|------|-------|--------|
| System > Registered Devices | `src/components/modules/settings/sections/RegisteredDevicesSection.tsx` | 4 | ⬜ |
| System > Device actions | `src/components/modules/settings/sections/DeviceActionsSection.tsx` | 4 | ⬜ |
| System > Theme settings | `src/components/modules/settings/sections/ThemeSection.tsx` | 4 | ⬜ |
| System > Layout preferences | `src/components/modules/settings/sections/LayoutSection.tsx` | 4 | ⬜ |
| System > Module visibility | `src/components/modules/settings/sections/ModuleVisibilitySection.tsx` | 4 | ⬜ |
| SystemSettings container | `src/components/modules/settings/categories/SystemSettings.tsx` | 4 | ⬜ |
| Settings search functionality | `src/components/modules/settings/SettingsSearch.tsx` | 8 | ⬜ |

**Week 9 Total:** 32 hours

#### Week 10: Polish & Testing

| Task | File | Hours | Status |
|------|------|-------|--------|
| Settings import/export | `src/services/settingsImportExport.ts` | 6 | ⬜ |
| Mobile responsive layout | All settings components | 8 | ⬜ |
| Error handling & validation | All settings components | 6 | ⬜ |
| Unit tests | `src/components/modules/settings/__tests__/` | 8 | ⬜ |
| Integration tests | `src/components/modules/settings/__tests__/` | 6 | ⬜ |
| Documentation | `docs/` | 4 | ⬜ |

**Week 10 Total:** 38 hours

### Phase 5 Deliverables
- [ ] Complete System category
- [ ] Settings search working
- [ ] Mobile responsive
- [ ] All tests passing

### Phase 5 Acceptance Criteria
- [ ] User can view registered devices
- [ ] User can revoke device access
- [ ] User can switch theme
- [ ] User can search settings
- [ ] Settings work on mobile
- [ ] All tests pass

---

## File Structure

```
src/
├── components/
│   └── modules/
│       └── settings/
│           ├── index.ts
│           ├── SettingsPage.tsx
│           ├── SettingsNavigation.tsx
│           ├── SettingsSearch.tsx
│           ├── categories/
│           │   ├── index.ts
│           │   ├── BusinessSettings.tsx
│           │   ├── CheckoutPaymentsSettings.tsx
│           │   ├── ReceiptsNotificationsSettings.tsx
│           │   ├── AccountLicensingSettings.tsx
│           │   └── SystemSettings.tsx
│           ├── sections/
│           │   ├── index.ts
│           │   ├── ProfileSection.tsx
│           │   ├── ContactSection.tsx
│           │   ├── AddressSection.tsx
│           │   ├── LocaleSection.tsx
│           │   ├── OperatingHoursSection.tsx
│           │   ├── SpecialHoursSection.tsx
│           │   ├── TaxSection.tsx
│           │   ├── TaxRatesTable.tsx
│           │   ├── TipSettingsSection.tsx
│           │   ├── TipDistributionSection.tsx
│           │   ├── DiscountSettingsSection.tsx
│           │   ├── ServiceChargesSection.tsx
│           │   ├── RoundingSection.tsx
│           │   ├── PaymentMethodsSection.tsx
│           │   ├── PaymentTerminalsSection.tsx
│           │   ├── TerminalPairingModal.tsx
│           │   ├── PaymentGatewaySection.tsx
│           │   ├── HardwareDevicesSection.tsx
│           │   ├── ReceiptHeaderSection.tsx
│           │   ├── ReceiptFooterSection.tsx
│           │   ├── ReceiptOptionsSection.tsx
│           │   ├── ReceiptPreview.tsx
│           │   ├── ClientNotificationsSection.tsx
│           │   ├── StaffNotificationsSection.tsx
│           │   ├── OwnerNotificationsSection.tsx
│           │   ├── NotificationMatrix.tsx
│           │   ├── ReminderTimingSection.tsx
│           │   ├── AccountInfoSection.tsx
│           │   ├── PasswordChangeSection.tsx
│           │   ├── TwoFactorSection.tsx
│           │   ├── SessionManagementSection.tsx
│           │   ├── SubscriptionSection.tsx
│           │   ├── LicenseInfoSection.tsx
│           │   ├── LicenseActivationModal.tsx
│           │   ├── LicenseRenewalSection.tsx
│           │   ├── LicenseDevicesSection.tsx
│           │   ├── RegisteredDevicesSection.tsx
│           │   ├── DeviceActionsSection.tsx
│           │   ├── ThemeSection.tsx
│           │   ├── LayoutSection.tsx
│           │   ├── ModuleVisibilitySection.tsx
│           │   └── LogoUpload.tsx
│           └── __tests__/
│               ├── SettingsPage.test.tsx
│               ├── BusinessSettings.test.tsx
│               └── ...
├── services/
│   ├── settingsService.ts
│   ├── terminalService.ts
│   ├── printerService.ts
│   ├── cashDrawerService.ts
│   ├── licenseService.ts
│   ├── licenseAlertService.ts
│   └── settingsImportExport.ts
├── store/
│   └── slices/
│       └── settingsSlice.ts
├── db/
│   └── settingsDB.ts
└── types/
    └── settings.ts
```

---

## Database Schema

### Supabase Tables

```sql
-- Store settings table
CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  
  -- Business
  business_name VARCHAR(100) NOT NULL,
  legal_name VARCHAR(100),
  business_type VARCHAR(50),
  logo_url TEXT,
  description TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  social_media JSONB,
  address JSONB,
  locale JSONB,
  operating_hours JSONB,
  closed_periods JSONB,
  tax_settings JSONB,
  
  -- Checkout
  checkout_settings JSONB,
  
  -- Receipts
  receipt_settings JSONB,
  
  -- Notifications
  notification_settings JSONB,
  
  -- System
  system_settings JSONB,
  
  -- Sync
  sync_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(store_id)
);

-- Payment terminals table
CREATE TABLE payment_terminals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  device_id UUID REFERENCES devices(id),
  terminal_type VARCHAR(50) NOT NULL,
  terminal_id VARCHAR(100),
  terminal_name VARCHAR(100),
  connection_status VARCHAR(20) DEFAULT 'disconnected',
  last_activity TIMESTAMPTZ,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hardware devices table
CREATE TABLE hardware_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id),
  device_id UUID REFERENCES devices(id),
  device_type VARCHAR(50) NOT NULL, -- printer, cash_drawer, scanner
  device_name VARCHAR(100),
  connection_type VARCHAR(20), -- bluetooth, usb, network
  connection_status VARCHAR(20) DEFAULT 'disconnected',
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### IndexedDB Schema

```typescript
// In src/db/settingsDB.ts
import Dexie from 'dexie';

class SettingsDatabase extends Dexie {
  storeSettings!: Dexie.Table<StoreSettings, string>;
  paymentTerminals!: Dexie.Table<PaymentTerminal, string>;
  hardwareDevices!: Dexie.Table<HardwareDevice, string>;

  constructor() {
    super('SettingsDB');
    this.version(1).stores({
      storeSettings: 'id, storeId, syncVersion',
      paymentTerminals: 'id, storeId, deviceId',
      hardwareDevices: 'id, storeId, deviceId',
    });
  }
}

export const settingsDB = new SettingsDatabase();
```

---

## Dependencies

### Required Packages

```json
{
  "dependencies": {
    "@stripe/stripe-terminal-react-native": "^0.x.x",
    "react-native-bluetooth-serial-next": "^1.x.x",
    "qrcode.react": "^3.x.x"
  }
}
```

### Internal Dependencies

- Design system components (Input, Select, Toggle, Button, Card)
- Form validation utilities
- Toast notifications
- Modal component
- IndexedDB wrapper (Dexie)
- Redux store

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Terminal SDK integration complexity | High | Start early, allocate buffer time |
| Bluetooth pairing issues | Medium | Test on multiple devices |
| Settings sync conflicts | Medium | Implement proper conflict resolution |
| Large settings object performance | Low | Lazy load sections |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Settings load time | < 500ms | Performance monitoring |
| Save success rate | > 99% | Error tracking |
| Terminal pairing success | > 95% | User feedback |
| User satisfaction | > 4.0/5 | In-app survey |

---

## Review Checkpoints

| Week | Review Focus |
|------|--------------|
| 2 | Business settings complete, sync working |
| 4 | Payment terminals pairing functional |
| 6 | Receipts & notifications complete |
| 8 | Account & licensing complete |
| 10 | Full module ready for QA |

---

*Document Version: 1.0 | Created: December 28, 2025*
