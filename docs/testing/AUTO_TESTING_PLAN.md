# 🧪 Auto Testing Plan - Mango POS Offline V2

**Version:** 1.0  
**Created:** December 2025  
**Status:** Planning  
**Priority:** P1 - High

---

## 📋 Executive Summary

This document outlines a comprehensive automated testing strategy for Mango POS Offline V2, covering all core modules with unit tests, integration tests, and end-to-end (E2E) tests.

### Goals
- **80%+ code coverage** for critical business logic
- **Automated regression testing** on every PR
- **E2E coverage** for all critical user flows
- **Offline-first testing** to validate IndexedDB operations
- **CI/CD integration** for continuous quality assurance

### Testing Stack
| Layer | Tool | Purpose |
|-------|------|---------|
| Unit Tests | Vitest | Component & utility testing |
| Integration Tests | Vitest + MSW | API & service layer testing |
| E2E Tests | Playwright | Full user flow testing |
| Mocking | fake-indexeddb, MSW | Offline & API simulation |

---

## 🏗️ Module Testing Overview

### Module Priority Matrix

| Module | Priority | Complexity | Current Coverage | Target Coverage |
|--------|----------|------------|------------------|-----------------|
| **Checkout** | P0 | High | ~0% | 90% |
| **Front Desk** | P0 | High | ~10% | 85% |
| **Book** | P1 | High | ~20% | 85% |
| **Pending** | P1 | Medium | ~0% | 80% |
| **Clients/CRM** | P2 | Medium | ~5% | 75% |
| **Admin/Settings** | P2 | Medium | ~0% | 70% |
| **Turn Tracker** | P2 | Medium | ~0% | 75% |

---

## 📦 Module 1: Checkout Module

### 1.1 Unit Tests

#### Components to Test
```
src/components/checkout/
├── CheckoutPanel.tsx
├── PaymentMethodSelector.tsx
├── TipSelector.tsx
├── DiscountInput.tsx
├── SplitPaymentModal.tsx
├── QuickPayment.tsx
└── ReceiptPreview.tsx
```

#### Test Cases

**Payment Processing**
| Test ID | Description | Type |
|---------|-------------|------|
| CHK-U-001 | Calculate subtotal correctly | Unit |
| CHK-U-002 | Apply percentage discount | Unit |
| CHK-U-003 | Apply fixed discount | Unit |
| CHK-U-004 | Calculate tax (pre-tax tip) | Unit |
| CHK-U-005 | Calculate tax (post-tax tip) | Unit |
| CHK-U-006 | Tip calculation (percentage) | Unit |
| CHK-U-007 | Tip calculation (custom amount) | Unit |
| CHK-U-008 | Split payment calculation | Unit |
| CHK-U-009 | Discount stacking order | Unit |
| CHK-U-010 | Service charge calculation | Unit |

**Tip Distribution**
| Test ID | Description | Type |
|---------|-------------|------|
| CHK-U-011 | Single provider tip assignment | Unit |
| CHK-U-012 | Multi-provider tip split (equal) | Unit |
| CHK-U-013 | Multi-provider tip split (by service amount) | Unit |

**Validation**
| Test ID | Description | Type |
|---------|-------------|------|
| CHK-U-020 | Reject negative payment amounts | Unit |
| CHK-U-021 | Validate payment method selection | Unit |
| CHK-U-022 | Validate tip within limits | Unit |
| CHK-U-023 | Validate discount within limits | Unit |

### 1.2 Integration Tests

| Test ID | Description | Type |
|---------|-------------|------|
| CHK-I-001 | Create transaction in Supabase | Integration |
| CHK-I-002 | Update ticket status to completed | Integration |
| CHK-I-003 | Process cash payment end-to-end | Integration |
| CHK-I-004 | Process card payment end-to-end | Integration |
| CHK-I-005 | Process split payment | Integration |
| CHK-I-006 | Offline payment queuing | Integration |
| CHK-I-007 | Sync queued payments on reconnect | Integration |

### 1.3 E2E Tests

| Test ID | Description | Type |
|---------|-------------|------|
| CHK-E-001 | Complete checkout flow (cash) | E2E |
| CHK-E-002 | Complete checkout flow (card) | E2E |
| CHK-E-003 | Apply discount and complete | E2E |
| CHK-E-004 | Add tip and complete | E2E |
| CHK-E-005 | Split payment flow | E2E |
| CHK-E-006 | Quick payment flow | E2E |
| CHK-E-007 | Offline checkout (cash only) | E2E |

---

## 📦 Module 2: Front Desk Module

### 2.1 Unit Tests

#### Components to Test
```
src/components/
├── FrontDesk.tsx
├── StaffCard.tsx
├── StaffSidebar.tsx
├── TurnQueue.tsx
├── WaitListSection.tsx
├── ComingAppointments.tsx
├── PendingTickets.tsx
└── frontdesk/
    ├── ActiveTicketsBoard.tsx
    ├── StaffStatusPanel.tsx
    └── WalkInQueue.tsx
```

#### Test Cases

**Staff Status Management**
| Test ID | Description | Type |
|---------|-------------|------|
| FD-U-001 | Staff clock-in updates status | Unit |
| FD-U-002 | Staff clock-out updates status | Unit |
| FD-U-003 | Staff break status toggle | Unit |
| FD-U-004 | Staff availability calculation | Unit |

**Turn Queue**
| Test ID | Description | Type |
|---------|-------------|------|
| FD-U-010 | Manual turn assignment | Unit |
| FD-U-011 | Auto turn - rotation mode | Unit |
| FD-U-012 | Auto turn - service count mode | Unit |
| FD-U-013 | Auto turn - amount mode | Unit |
| FD-U-014 | Bonus turn calculation | Unit |
| FD-U-015 | Tardy turn penalty | Unit |
| FD-U-016 | Skip turn logic | Unit |

**Ticket Management**
| Test ID | Description | Type |
|---------|-------------|------|
| FD-U-020 | Create walk-in ticket | Unit |
| FD-U-021 | Assign ticket to staff | Unit |
| FD-U-022 | Move ticket between columns | Unit |
| FD-U-023 | Ticket status transitions | Unit |
| FD-U-024 | Service timer start/pause/stop | Unit |

**Wait List**
| Test ID | Description | Type |
|---------|-------------|------|
| FD-U-030 | Add client to wait list | Unit |
| FD-U-031 | Remove from wait list | Unit |
| FD-U-032 | Wait time calculation | Unit |
| FD-U-033 | Convert wait list to ticket | Unit |

### 2.2 Integration Tests

| Test ID | Description | Type |
|---------|-------------|------|
| FD-I-001 | Ticket creation syncs to Supabase | Integration |
| FD-I-002 | Staff status syncs across devices | Integration |
| FD-I-003 | Turn queue updates in real-time | Integration |
| FD-I-004 | Offline ticket creation | Integration |
| FD-I-005 | Conflict resolution on sync | Integration |

### 2.3 E2E Tests

| Test ID | Description | Type |
|---------|-------------|------|
| FD-E-001 | Walk-in customer flow | E2E |
| FD-E-002 | Staff clock-in/out flow | E2E |
| FD-E-003 | Ticket assignment flow | E2E |
| FD-E-004 | Kanban drag-and-drop | E2E |
| FD-E-005 | Turn queue management | E2E |

---

## 📦 Module 3: Book Module

### 3.1 Unit Tests

#### Components to Test
```
src/components/Book/
├── BookingCalendar.tsx
├── AppointmentForm.tsx
├── TimeSlotPicker.tsx
├── ServiceSelector.tsx
├── StaffSelector.tsx
├── ConflictDetector.tsx
└── DragDropHandler.tsx
```

#### Test Cases

**Appointment Scheduling**
| Test ID | Description | Type |
|---------|-------------|------|
| BK-U-001 | Create appointment | Unit |
| BK-U-002 | Update appointment | Unit |
| BK-U-003 | Cancel appointment | Unit |
| BK-U-004 | Reschedule appointment | Unit |
| BK-U-005 | Recurring appointment creation | Unit |

**Conflict Detection**
| Test ID | Description | Type |
|---------|-------------|------|
| BK-U-010 | Detect time overlap | Unit |
| BK-U-011 | Detect staff double-booking | Unit |
| BK-U-012 | Detect resource conflict | Unit |
| BK-U-013 | Buffer time validation | Unit |
| BK-U-014 | Operating hours validation | Unit |

**Smart Auto-Assign**
| Test ID | Description | Type |
|---------|-------------|------|
| BK-U-020 | Auto-assign by availability | Unit |
| BK-U-021 | Auto-assign by skill match | Unit |
| BK-U-022 | Auto-assign by preference | Unit |
| BK-U-023 | Auto-assign with constraints | Unit |

**Calendar Views**
| Test ID | Description | Type |
|---------|-------------|------|
| BK-U-030 | Day view rendering | Unit |
| BK-U-031 | Week view rendering | Unit |
| BK-U-032 | Agenda view rendering | Unit |
| BK-U-033 | Time slot calculation | Unit |

### 3.2 Integration Tests

| Test ID | Description | Type |
|---------|-------------|------|
| BK-I-001 | Appointment syncs to Supabase | Integration |
| BK-I-002 | Check-in creates ticket | Integration |
| BK-I-003 | Drag-drop updates appointment | Integration |
| BK-I-004 | Offline appointment creation | Integration |
| BK-I-005 | Real-time calendar updates | Integration |

### 3.3 E2E Tests

| Test ID | Description | Type |
|---------|-------------|------|
| BK-E-001 | Book new appointment | E2E |
| BK-E-002 | Check-in appointment | E2E |
| BK-E-003 | Reschedule via drag-drop | E2E |
| BK-E-004 | Cancel appointment | E2E |
| BK-E-005 | View switching (day/week/agenda) | E2E |

---

## 📦 Module 4: Pending Module

### 4.1 Unit Tests

#### Components to Test
```
src/components/pending/
├── PendingQueue.tsx
├── PendingTicketCard.tsx
├── ServiceSummary.tsx
└── ReadyForCheckout.tsx
```

#### Test Cases

| Test ID | Description | Type |
|---------|-------------|------|
| PD-U-001 | Display pending tickets | Unit |
| PD-U-002 | Sort by completion time | Unit |
| PD-U-003 | Filter by staff | Unit |
| PD-U-004 | Calculate wait time | Unit |
| PD-U-005 | Move to checkout | Unit |

### 4.2 Integration Tests

| Test ID | Description | Type |
|---------|-------------|------|
| PD-I-001 | Ticket appears when service completes | Integration |
| PD-I-002 | Ticket removed after checkout | Integration |
| PD-I-003 | Real-time queue updates | Integration |

### 4.3 E2E Tests

| Test ID | Description | Type |
|---------|-------------|------|
| PD-E-001 | Service completion → Pending flow | E2E |
| PD-E-002 | Pending → Checkout flow | E2E |

---

## 📦 Module 5: Clients/CRM Module

### 5.1 Unit Tests

#### Components to Test
```
src/components/client-settings/
├── ClientList.tsx
├── ClientProfile.tsx
├── ClientSearch.tsx
├── ClientWallet.tsx
├── LoyaltyProgram.tsx
└── ConsultationForms.tsx
```

#### Test Cases

**Client Management**
| Test ID | Description | Type |
|---------|-------------|------|
| CL-U-001 | Create client | Unit |
| CL-U-002 | Update client | Unit |
| CL-U-003 | Search clients | Unit |
| CL-U-004 | Client blocking | Unit |
| CL-U-005 | Staff alert display | Unit |

**Wallet & Loyalty**
| Test ID | Description | Type |
|---------|-------------|------|
| CL-U-010 | Add store credit | Unit |
| CL-U-011 | Deduct store credit | Unit |
| CL-U-012 | Points calculation | Unit |
| CL-U-013 | Tier progression | Unit |
| CL-U-014 | Reward redemption | Unit |

**Safety & Compliance**
| Test ID | Description | Type |
|---------|-------------|------|
| CL-U-020 | Allergy alert display | Unit |
| CL-U-021 | Patch test validation | Unit |
| CL-U-022 | Consent form validation | Unit |

### 5.2 Integration Tests

| Test ID | Description | Type |
|---------|-------------|------|
| CL-I-001 | Client syncs to Supabase | Integration |
| CL-I-002 | Wallet balance updates | Integration |
| CL-I-003 | Loyalty points sync | Integration |

### 5.3 E2E Tests

| Test ID | Description | Type |
|---------|-------------|------|
| CL-E-001 | Create new client flow | E2E |
| CL-E-002 | Client search and select | E2E |
| CL-E-003 | Apply store credit at checkout | E2E |

---

## 📦 Module 6: Admin/Settings Module

### 6.1 Unit Tests

#### Components to Test
```
src/admin/
├── ServicesManager.tsx
├── StaffManager.tsx
├── RolesManager.tsx
├── StoreSettings.tsx
└── DeviceManager.tsx
```

#### Test Cases

| Test ID | Description | Type |
|---------|-------------|------|
| AD-U-001 | Service CRUD operations | Unit |
| AD-U-002 | Staff CRUD operations | Unit |
| AD-U-003 | Role permissions validation | Unit |
| AD-U-004 | Store settings validation | Unit |
| AD-U-005 | Device registration | Unit |

### 6.2 Integration Tests

| Test ID | Description | Type |
|---------|-------------|------|
| AD-I-001 | Service changes sync | Integration |
| AD-I-002 | Staff changes sync | Integration |
| AD-I-003 | Settings propagate to devices | Integration |

---

## 📦 Module 7: Turn Tracker Module

### 7.1 Unit Tests

#### Components to Test
```
src/components/TurnTracker/
├── TurnTrackerPanel.tsx
├── StaffSummaryCard.tsx
├── TurnLogBlock.tsx
├── TurnSettingsPanel.tsx
└── ManualAdjustmentModal.tsx
```

#### Test Cases

| Test ID | Description | Type |
|---------|-------------|------|
| TT-U-001 | Service turn calculation | Unit |
| TT-U-002 | Bonus turn calculation | Unit |
| TT-U-003 | Adjust turn calculation | Unit |
| TT-U-004 | Total turn aggregation | Unit |
| TT-U-005 | Turn ordering - rotation | Unit |
| TT-U-006 | Turn ordering - by count | Unit |
| TT-U-007 | Turn ordering - by amount | Unit |
| TT-U-008 | Turn log entry creation | Unit |

### 7.2 Integration Tests

| Test ID | Description | Type |
|---------|-------------|------|
| TT-I-001 | Turn updates on ticket completion | Integration |
| TT-I-002 | Turn data syncs across devices | Integration |
| TT-I-003 | Manual adjustment audit trail | Integration |

---

## 🔌 Cross-Cutting Concerns

### Offline-First Testing

| Test ID | Description | Type |
|---------|-------------|------|
| OFF-001 | IndexedDB initialization | Unit |
| OFF-002 | Data persistence on refresh | Integration |
| OFF-003 | Sync queue management | Integration |
| OFF-004 | Conflict resolution | Integration |
| OFF-005 | Offline mode detection | Unit |
| OFF-006 | Online mode restoration | Integration |
| OFF-007 | Partial sync recovery | Integration |

### Real-Time Sync Testing

| Test ID | Description | Type |
|---------|-------------|------|
| RT-001 | WebSocket connection | Integration |
| RT-002 | Event subscription | Integration |
| RT-003 | Multi-device sync | E2E |
| RT-004 | Reconnection handling | Integration |

### Authentication Testing

| Test ID | Description | Type |
|---------|-------------|------|
| AUTH-001 | Login flow | E2E |
| AUTH-002 | Session persistence | Integration |
| AUTH-003 | Role-based access | Unit |
| AUTH-004 | Token refresh | Integration |

---

## 🛠️ Implementation Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Set up test infrastructure
- [ ] Configure MSW for API mocking
- [ ] Create test utilities and factories
- [ ] Implement base test fixtures

### Phase 2: Checkout Module (Week 3-4)
- [ ] Unit tests for payment calculations
- [ ] Integration tests for transaction creation
- [ ] E2E tests for checkout flows

### Phase 3: Front Desk Module (Week 5-6)
- [ ] Unit tests for ticket management
- [ ] Unit tests for turn queue logic
- [ ] Integration tests for staff status
- [ ] E2E tests for walk-in flow

### Phase 4: Book Module (Week 7-8)
- [ ] Unit tests for conflict detection
- [ ] Unit tests for auto-assign
- [ ] Integration tests for appointment sync
- [ ] E2E tests for booking flow

### Phase 5: Supporting Modules (Week 9-10)
- [ ] Pending module tests
- [ ] Clients/CRM module tests
- [ ] Admin module tests
- [ ] Turn Tracker tests

### Phase 6: Cross-Cutting & Polish (Week 11-12)
- [ ] Offline-first tests
- [ ] Real-time sync tests
- [ ] Authentication tests
- [ ] CI/CD integration
- [ ] Coverage reporting

---

## 📊 Test File Structure

```
src/
├── testing/
│   ├── setup.ts              # Vitest setup
│   ├── setup-db.ts           # IndexedDB setup
│   ├── factories.ts          # Test data factories
│   ├── fixtures.ts           # Shared fixtures
│   └── mocks/
│       ├── handlers.ts       # MSW handlers
│       └── server.ts         # MSW server
├── tests/
│   ├── unit/
│   │   ├── checkout/
│   │   ├── frontdesk/
│   │   ├── book/
│   │   ├── pending/
│   │   ├── clients/
│   │   ├── admin/
│   │   └── turn-tracker/
│   └── integration/
│       ├── checkout/
│       ├── frontdesk/
│       ├── book/
│       └── sync/
e2e/
├── checkout.spec.ts
├── frontdesk.spec.ts
├── booking.spec.ts
├── pending.spec.ts
├── clients.spec.ts
└── auth.spec.ts
```

---

## 🚀 CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📈 Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Unit Test Coverage | ~10% | 80% | 12 weeks |
| Integration Test Coverage | ~5% | 70% | 12 weeks |
| E2E Test Count | 3 | 25+ | 12 weeks |
| CI Pipeline Pass Rate | N/A | 95% | 12 weeks |
| Test Execution Time | N/A | <10 min | 12 weeks |

---

## 📝 Test Naming Convention

```
[Module]-[Type]-[Number]: [Description]

Examples:
- CHK-U-001: Calculate subtotal correctly
- FD-I-003: Turn queue updates in real-time
- BK-E-002: Check-in appointment
```

**Type Codes:**
- `U` = Unit Test
- `I` = Integration Test
- `E` = E2E Test

---

## 🔗 Related Documents

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Manual testing procedures
- [TESTING_QUICK_REFERENCE.md](./TESTING_QUICK_REFERENCE.md) - Quick reference
- [PRD-Sales-Checkout-Module.md](../product/PRD-Sales-Checkout-Module.md) - Checkout requirements
- [PRD-Turn-Tracker-Module.md](../product/PRD-Turn-Tracker-Module.md) - Turn Tracker requirements

---

**Document Owner:** Engineering Team  
**Last Updated:** December 2025  
**Next Review:** January 2026
