# Validation Rules

> **Last Updated:** December 31, 2025
> **Purpose:** Comprehensive validation requirements for all data operations

This document defines all validation rules that must be enforced to maintain data integrity across the system.

---

## Overview

| Category | Rule Count | Enforcement Status |
|----------|------------|-------------------|
| Input Validation | 25 | Partial |
| Business Rules | 18 | Partial |
| State Transition Guards | 12 | Missing |
| Financial Validation | 10 | Partial |
| Referential Integrity | 8 | Missing |

---

## 1. Input Validation

### 1.1 Client Fields

| Field | Type | Required | Validation Rule | Error Message |
|-------|------|----------|-----------------|---------------|
| `name` | string | Yes | 1-100 chars, no special chars except `-'` | "Client name must be 1-100 characters" |
| `phone` | string | No | Valid phone format, 10-15 digits | "Please enter a valid phone number" |
| `email` | string | No | Valid email format (RFC 5322) | "Please enter a valid email address" |
| `dateOfBirth` | date | No | Not in future, not > 120 years ago | "Please enter a valid date of birth" |
| `notes` | string | No | Max 1000 chars | "Notes cannot exceed 1000 characters" |

```typescript
// Recommended validation schema (Zod)
const clientSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/),
  phone: z.string().regex(/^\+?[\d\s-]{10,15}$/).optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.date().max(new Date()).optional(),
  notes: z.string().max(1000).optional(),
});
```

### 1.2 Appointment Fields

| Field | Type | Required | Validation Rule | Error Message |
|-------|------|----------|-----------------|---------------|
| `clientId` | uuid | Yes | Must exist in clients table | "Client not found" |
| `staffId` | uuid | Yes | Must exist and be available | "Staff member not available" |
| `scheduledStartTime` | datetime | Yes | Must be in future | "Cannot book appointments in the past" |
| `services` | array | Yes | At least 1 service | "At least one service is required" |
| `duration` | number | Yes | > 0 and < 480 minutes | "Duration must be between 1-480 minutes" |

### 1.3 Ticket Fields

| Field | Type | Required | Validation Rule | Error Message |
|-------|------|----------|-----------------|---------------|
| `services` | array | Yes | At least 1 service | "At least one service is required" |
| `services[].price` | number | Yes | >= 0 | "Price cannot be negative" |
| `services[].duration` | number | Yes | > 0 | "Duration must be greater than 0" |
| `services[].staffId` | uuid | No | Must exist if provided | "Staff member not found" |

### 1.4 Transaction Fields

| Field | Type | Required | Validation Rule | Error Message |
|-------|------|----------|-----------------|---------------|
| `ticketId` | uuid | Yes | Must exist in tickets | "Ticket not found" |
| `subtotal` | number | Yes | >= 0 | "Subtotal cannot be negative" |
| `tax` | number | Yes | >= 0 | "Tax cannot be negative" |
| `tip` | number | Yes | >= 0 | "Tip cannot be negative" |
| `total` | number | Yes | = subtotal + tax + tip - discount | "Total calculation mismatch" |
| `paymentMethod` | enum | Yes | Valid payment method | "Invalid payment method" |

---

## 2. Business Rules

### 2.1 Appointment Rules

| Rule ID | Rule | When Enforced | Current Status |
|---------|------|---------------|----------------|
| BR-APT-001 | No double-booking for same staff | Create/Update | **Missing** |
| BR-APT-002 | Appointment must be within business hours | Create/Update | Partial |
| BR-APT-003 | Cannot book on closed days | Create/Update | **Missing** |
| BR-APT-004 | Buffer time between appointments | Create/Update | **Missing** |
| BR-APT-005 | Max advance booking window | Create | **Missing** |

**BR-APT-001: No Double-Booking (CRITICAL)**

```typescript
// Validation logic needed
async function validateNoDoubleBooking(
  staffId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
): Promise<{ valid: boolean; conflict?: Appointment }> {
  const conflicts = await dataService.appointments.findOverlapping(
    staffId, startTime, endTime, excludeAppointmentId
  );
  return {
    valid: conflicts.length === 0,
    conflict: conflicts[0]
  };
}
```

### 2.2 Ticket Rules

| Rule ID | Rule | When Enforced | Current Status |
|---------|------|---------------|----------------|
| BR-TKT-001 | Cannot complete service without starting | Service Done | **Missing** |
| BR-TKT-002 | Staff must be assigned before starting service | Start Service | Implemented |
| BR-TKT-003 | Cannot add services to paid ticket | Add Service | Implemented |
| BR-TKT-004 | Cannot void ticket after 24 hours | Void | Partial |

**BR-TKT-001: Service Completion Validation (CRITICAL)**

```typescript
// Validation logic needed
function validateServiceCompletion(service: TicketService): boolean {
  if (service.status === 'completed') {
    // Must have actualStartTime set
    if (!service.actualStartTime) {
      throw new Error('Cannot complete service that was never started');
    }
    // Must have reasonable duration
    const duration = service.actualDuration || 0;
    if (duration < 1) {
      throw new Error('Service duration must be at least 1 minute');
    }
  }
  return true;
}
```

### 2.3 Payment Rules

| Rule ID | Rule | When Enforced | Current Status |
|---------|------|---------------|----------------|
| BR-PAY-001 | Payment amount must cover total | Payment | Implemented |
| BR-PAY-002 | Tip cannot exceed 100% of subtotal | Payment | **Missing** |
| BR-PAY-003 | Discount cannot exceed subtotal | Apply Discount | **Missing** |
| BR-PAY-004 | No duplicate payment for same ticket | Payment | **Missing** |
| BR-PAY-005 | Refund cannot exceed original amount | Refund | Partial |

**BR-PAY-004: Duplicate Payment Prevention (CRITICAL)**

```typescript
// Validation logic needed - use idempotency key
async function validateNoDuplicatePayment(
  ticketId: string,
  idempotencyKey: string
): Promise<boolean> {
  const existing = await dataService.transactions.findByIdempotencyKey(
    idempotencyKey
  );
  if (existing) {
    throw new Error('Duplicate payment detected');
  }
  return true;
}
```

### 2.4 Staff Rules

| Rule ID | Rule | When Enforced | Current Status |
|---------|------|---------------|----------------|
| BR-STF-001 | Cannot assign busy staff to new service | Assign | **Missing** |
| BR-STF-002 | Cannot delete staff with active tickets | Delete | **Missing** |
| BR-STF-003 | Cannot schedule outside working hours | Schedule | **Missing** |

---

## 3. State Transition Guards

State transitions must be validated before execution. See [STATE_MACHINES.md](./STATE_MACHINES.md) for full state definitions.

### 3.1 Appointment Transition Guards

| From | To | Guard Condition | Error Message |
|------|----|-----------------|---------------|
| `scheduled` | `checked-in` | Current time within check-in window | "Too early/late for check-in" |
| `scheduled` | `cancelled` | Not yet started | "Cannot cancel started appointment" |
| `checked-in` | `no-show` | Past grace period (default: 15 min) | "Grace period not yet passed" |

### 3.2 Ticket Transition Guards

| From | To | Guard Condition | Error Message |
|------|----|-----------------|---------------|
| `waiting` | `in-service` | Staff assigned, staff available | "Staff not assigned or unavailable" |
| `in-service` | `completed` | All services.status = 'completed' | "Not all services completed" |
| `completed` | `paid` | Valid payment received | "Payment required" |
| `paid` | `voided` | Same-day, manager approval | "Cannot void after settlement" |
| `paid` | `refunded` | Within refund window | "Refund window expired" |

### 3.3 Service Transition Guards

| From | To | Guard Condition | Error Message |
|------|----|-----------------|---------------|
| `not_started` | `in_progress` | Staff assigned | "Assign staff before starting" |
| `in_progress` | `completed` | actualStartTime exists | "Cannot complete without starting" |
| `paused` | `completed` | Must resume first | "Resume service before completing" |

### 3.4 Transaction Transition Guards

| From | To | Guard Condition | Error Message |
|------|----|-----------------|---------------|
| `pending` | `completed` | Payment processor success | "Payment failed" |
| `completed` | `voided` | Before batch settlement | "Cannot void after settlement" |
| `completed` | `refunded` | Within refund policy | "Refund not allowed" |

---

## 4. Financial Validation

### 4.1 Amount Calculations

```typescript
// All amounts must be calculated consistently
interface TicketTotals {
  subtotal: number;    // Sum of service prices
  discount: number;    // Applied discounts
  taxableAmount: number; // subtotal - discount
  tax: number;         // taxableAmount * taxRate
  tip: number;         // User-entered tip
  total: number;       // taxableAmount + tax + tip
}

function calculateTotals(ticket: Ticket): TicketTotals {
  const subtotal = ticket.services.reduce((sum, s) => sum + s.price, 0);
  const discount = ticket.discount || 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * (ticket.taxRate || 0.0825); // Default 8.25%
  const tip = ticket.tip || 0;
  const total = taxableAmount + tax + tip;

  return {
    subtotal: round2(subtotal),
    discount: round2(discount),
    taxableAmount: round2(taxableAmount),
    tax: round2(tax),
    tip: round2(tip),
    total: round2(total),
  };
}

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}
```

### 4.2 Financial Validation Rules

| Rule | Validation | Error Message |
|------|------------|---------------|
| No negative prices | `price >= 0` | "Price cannot be negative" |
| No negative tips | `tip >= 0` | "Tip cannot be negative" |
| Discount limit | `discount <= subtotal` | "Discount exceeds subtotal" |
| Total validation | `total = calculated value` | "Total mismatch" |
| Refund limit | `refundAmount <= originalTotal` | "Refund exceeds original" |
| No future dates | `transactionDate <= now` | "Invalid transaction date" |

---

## 5. Referential Integrity

### 5.1 Foreign Key Validation

| Entity | Foreign Key | Referenced Table | On Delete |
|--------|-------------|------------------|-----------|
| Ticket | clientId | clients | Prevent |
| Ticket | services[].staffId | staff | Prevent |
| Ticket | appointmentId | appointments | Null |
| Transaction | ticketId | tickets | Prevent |
| Appointment | clientId | clients | Prevent |
| Appointment | staffId | staff | Prevent |

### 5.2 Cascade Rules

```typescript
// Before deleting client
async function canDeleteClient(clientId: string): Promise<boolean> {
  const activeTickets = await dataService.tickets.findByClient(clientId);
  const openTickets = activeTickets.filter(t =>
    !['paid', 'voided', 'cancelled'].includes(t.status)
  );

  if (openTickets.length > 0) {
    throw new Error('Cannot delete client with active tickets');
  }

  const futureAppointments = await dataService.appointments.findFuture(clientId);
  if (futureAppointments.length > 0) {
    throw new Error('Cannot delete client with future appointments');
  }

  return true;
}

// Before deleting staff
async function canDeleteStaff(staffId: string): Promise<boolean> {
  const activeServices = await dataService.tickets.findActiveByStaff(staffId);
  if (activeServices.length > 0) {
    throw new Error('Cannot delete staff with active services');
  }
  return true;
}
```

---

## 6. Error Handling

### 6.1 Validation Error Format

```typescript
interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: unknown;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Example usage
const result: ValidationResult = {
  valid: false,
  errors: [
    {
      field: 'email',
      code: 'INVALID_FORMAT',
      message: 'Please enter a valid email address',
      value: 'not-an-email'
    },
    {
      field: 'phone',
      code: 'INVALID_LENGTH',
      message: 'Phone number must be 10-15 digits',
      value: '123'
    }
  ]
};
```

### 6.2 User-Facing Messages

| Code | User Message | Log Message |
|------|--------------|-------------|
| `REQUIRED_FIELD` | "This field is required" | `{field} is required` |
| `INVALID_FORMAT` | "Please enter a valid {field}" | `Invalid format for {field}` |
| `DUPLICATE_ENTRY` | "This {entity} already exists" | `Duplicate {entity}: {value}` |
| `REFERENCE_ERROR` | "{entity} not found" | `Foreign key violation: {entity}` |
| `BUSINESS_RULE` | Custom message | `Business rule violation: {rule}` |

---

## 7. Implementation Status

### 7.1 Currently Implemented

- Basic field type validation
- Required field validation
- Price >= 0 validation
- Payment amount validation

### 7.2 Missing (Priority)

| Priority | Validation | Impact |
|----------|-----------|--------|
| P0 | Double-booking prevention | Double-booked appointments |
| P0 | Duplicate payment detection | Double charges |
| P0 | Service completion without start | Invalid data |
| P1 | Referential integrity checks | Orphaned records |
| P1 | State transition guards | Invalid state changes |
| P2 | Tip/discount limits | Financial errors |

---

## 8. Recommended Implementation

### 8.1 Validation Layer

```typescript
// src/utils/validation.ts

import { z } from 'zod';

// Schema definitions
export const schemas = {
  client: z.object({ ... }),
  appointment: z.object({ ... }),
  ticket: z.object({ ... }),
  transaction: z.object({ ... }),
};

// Validation function
export async function validate<T>(
  schema: z.Schema<T>,
  data: unknown
): Promise<ValidationResult> {
  try {
    schema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          code: e.code,
          message: e.message,
        }))
      };
    }
    throw error;
  }
}
```

### 8.2 Guard Implementation

```typescript
// src/utils/guards.ts

export const transitionGuards = {
  ticket: {
    'waiting->in-service': async (ticket: Ticket) => {
      if (!ticket.services[0]?.staffId) {
        throw new Error('Staff must be assigned');
      }
      const staff = await dataService.staff.getById(ticket.services[0].staffId);
      if (staff.status !== 'available') {
        throw new Error('Staff is not available');
      }
      return true;
    },
    'in-service->completed': (ticket: Ticket) => {
      const incomplete = ticket.services.filter(s => s.status !== 'completed');
      if (incomplete.length > 0) {
        throw new Error('All services must be completed');
      }
      return true;
    },
  },
};
```

---

## Related Documentation

- [STATE_MACHINES.md](./STATE_MACHINES.md) - State definitions and transitions
- [SYSTEM_DATA_FLOW_OVERVIEW.md](./SYSTEM_DATA_FLOW_OVERVIEW.md) - Data flow patterns
- [EDGE_CASES_AND_RECOVERY.md](../guides/EDGE_CASES_AND_RECOVERY.md) - Error recovery

---

*Document Version: 1.0*
*Last Updated: December 31, 2025*
