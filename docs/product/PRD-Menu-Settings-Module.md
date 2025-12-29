# Product Requirements Document: Menu Settings Module

**Product:** Mango POS
**Module:** Menu Settings (Service Catalog)
**Version:** 1.0
**Last Updated:** December 27, 2025
**Status:** In Development
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
9. [Implementation Plan](#9-implementation-plan)

---

## 1. Executive Summary

### 1.1 Overview

The Menu Settings Module allows salon owners and managers to configure their service catalog, including services, categories, add-ons, and packages. This is the foundation for booking and checkout operations — every appointment and transaction references the service catalog.

### 1.2 Key Value Proposition

| Value | Description |
|-------|-------------|
| **Complete Service Catalog** | All services, add-ons, packages in one place |
| **Flexible Pricing** | Fixed, variable, staff-specific pricing |
| **Staff Assignment** | Control which staff can perform which services |
| **Online Booking Ready** | Configure visibility for client-facing booking |

### 1.3 Success Criteria

| Metric | Target |
|--------|--------|
| Catalog setup time | < 30 minutes for full menu |
| Service lookup speed | < 500ms |
| Zero booking errors | No "service not found" errors |
| Staff assignment accuracy | 100% correct service-staff mapping |

---

## 2. Problem Statement

### 2.1 Current Challenges

| Challenge | Impact | Our Solution |
|-----------|--------|--------------|
| **Scattered service info** | Inconsistent pricing | Single source of truth catalog |
| **No add-on support** | Missed upsell revenue | Structured add-on groups |
| **Manual staff matching** | Wrong assignments | Service-staff linking |
| **No online sync** | Different online vs. in-store prices | Unified catalog |

---

## 3. User Personas & Use Cases

### 3.1 Primary User: Salon Manager/Owner

**Use Cases:**
- MNU-UC-001: Add new service to catalog
- MNU-UC-002: Update service pricing
- MNU-UC-003: Assign services to new staff
- MNU-UC-004: Create service package

### 3.2 Secondary User: Front Desk

**Use Cases:**
- MNU-UC-005: View service prices during booking
- MNU-UC-006: Check service duration

---

## 4. Competitive Analysis

| Feature | Mango | Fresha | Booksy | Square | Vagaro |
|---------|-------|--------|--------|--------|--------|
| Service categories | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add-on groups | ✅ | ✅ | Partial | ❌ | ✅ |
| Staff-specific pricing | ✅ | ✅ | ❌ | ❌ | ✅ |
| Service packages | ✅ | ✅ | ✅ | ❌ | ✅ |
| Turn weight config | ✅ | ❌ | ❌ | ❌ | ❌ |
| Commission per service | ✅ | ✅ | Partial | ❌ | ✅ |

**Key Differentiator:** Turn weight configuration for fair walk-in distribution unique to Mango.

---

## 5. Feature Requirements

### 5.1 Service Categories

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| MNU-P0-001 | Create/edit/delete categories | P0 | CRUD operations functional |
| MNU-P0-002 | Category name and description | P0 | Required name, optional description |
| MNU-P0-003 | Category icon/color | P0 | Visual differentiation |
| MNU-P0-004 | Drag-and-drop ordering | P0 | Order persists, affects display |
| MNU-P0-005 | Active/inactive toggle | P0 | Inactive hides from booking/checkout |
| MNU-P1-006 | Online booking visibility | P1 | Show/hide from client booking |
| MNU-P2-007 | Nested categories (parent/child) | P2 | Sub-category support |

### 5.2 Services

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| MNU-P0-008 | Service name and description | P0 | Required name, optional description |
| MNU-P0-009 | Category assignment | P0 | Each service belongs to one category |
| MNU-P0-010 | Duration (default + variants) | P0 | Minutes, support multiple durations |
| MNU-P0-011 | Fixed price | P0 | Standard pricing |
| MNU-P1-012 | Variable price (from/to range) | P1 | "Starting at" display |
| MNU-P0-013 | Staff assignment | P0 | Multi-select staff who can perform |
| MNU-P1-014 | Staff-specific pricing | P1 | Override price per staff |
| MNU-P1-015 | Staff-specific duration | P1 | Override duration per staff |
| MNU-P0-016 | Active/inactive toggle | P0 | Hide from booking/checkout |
| MNU-P1-017 | Online booking settings | P1 | Available online, buffer time, advance limits |
| MNU-P1-018 | Commission settings | P1 | Percentage or fixed per service |
| MNU-P1-019 | Turn weight | P1 | For turn queue calculations |
| MNU-P1-020 | Patch test required flag | P1 | Block booking if no valid patch test |
| MNU-P1-021 | Tax exempt flag | P1 | Exclude from tax calculations |
| MNU-P0-022 | Service ordering within category | P0 | Drag-and-drop sort |

### 5.3 Add-On Groups

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| MNU-P1-023 | Create/edit/delete add-on groups | P1 | CRUD operations |
| MNU-P1-024 | Group name | P1 | e.g., "Nail Art Options", "Hair Treatments" |
| MNU-P1-025 | Link to services | P1 | Multi-select which services show this group |
| MNU-P1-026 | Selection rules | P1 | Optional, Required, Single-select, Multi-select |

### 5.4 Add-Ons

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| MNU-P1-027 | Add-on name and description | P1 | Required name |
| MNU-P1-028 | Add-on price (fixed or variable) | P1 | Price added to service total |
| MNU-P1-029 | Duration adjustment | P1 | Minutes added to base service |
| MNU-P1-030 | Group assignment | P1 | Belongs to one add-on group |
| MNU-P1-031 | Active/inactive toggle | P1 | Hide from selection |
| MNU-P2-032 | Online booking visibility | P2 | Show/hide from client booking |

### 5.5 Packages

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| MNU-P1-033 | Package name and description | P1 | Required name |
| MNU-P1-034 | Included services | P1 | Multi-select services |
| MNU-P1-035 | Package price | P1 | Typically discounted from sum |
| MNU-P2-036 | Validity period | P2 | Expiration for package deals |
| MNU-P2-037 | Staff restrictions | P2 | Limit to specific staff |
| MNU-P2-038 | Online booking visibility | P2 | Show/hide from client |

### 5.6 Menu General Settings

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| MNU-P1-039 | Default service duration | P1 | Fallback when not specified |
| MNU-P1-040 | Default buffer time | P1 | Time between appointments |
| MNU-P2-041 | Price display format | P2 | Show "from" prices option |
| MNU-P2-042 | Service search settings | P2 | Enable/disable search |

---

## 6. Business Rules

### 6.1 Service Pricing

| Rule ID | Rule |
|---------|------|
| MNU-BR-001 | Services can have fixed price or price range |
| MNU-BR-002 | "Starting at" shown for variable pricing |
| MNU-BR-003 | Staff-specific prices override base price |
| MNU-BR-004 | Zero price allowed (for free services) |

### 6.2 Staff Assignment

| Rule ID | Rule |
|---------|------|
| MNU-BR-005 | Services must have at least one staff assigned |
| MNU-BR-006 | Staff can have custom pricing per service |
| MNU-BR-007 | Staff can have custom duration per service |
| MNU-BR-008 | Unassigned staff cannot be booked for service |

### 6.3 Category Management

| Rule ID | Rule |
|---------|------|
| MNU-BR-009 | Categories cannot be empty (warn on delete) |
| MNU-BR-010 | Deleting category moves services to "Uncategorized" |
| MNU-BR-011 | Category order affects display everywhere |
| MNU-BR-012 | At least one category must exist |

### 6.4 Add-On Rules

| Rule ID | Rule |
|---------|------|
| MNU-BR-013 | Add-ons only available for linked services |
| MNU-BR-014 | Required add-on groups must have selection |
| MNU-BR-015 | Add-on prices added to service total |
| MNU-BR-016 | Add-on durations extend appointment time |

---

## 7. UX Specifications

### 7.1 Navigation Structure

```
Menu Settings
├── Categories
│   ├── [Category 1]
│   │   ├── Service A
│   │   ├── Service B
│   │   └── Service C
│   ├── [Category 2]
│   │   └── ...
│   └── [+ Add Category]
├── Add-Ons
│   ├── [Group 1]
│   │   ├── Add-On X
│   │   └── Add-On Y
│   └── [+ Add Group]
├── Packages
│   ├── Package 1
│   └── [+ Add Package]
└── Settings
    └── General options
```

### 7.2 Service Card

```
┌─────────────────────────────────────────────────────────────────┐
│ ⋮⋮ Gel Manicure                                    [Edit] [⋯]  │
│    45 min │ $45.00                                              │
│    Staff: Zeus, Lisa, Amy                                       │
│    ✓ Online Booking │ Commission: 40%                           │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Service Edit Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Edit Service                                        [X Close]   │
├─────────────────────────────────────────────────────────────────┤
│ Service Name*        [Gel Manicure                ]             │
│ Description          [Professional gel manicure   ]             │
│ Category*            [Nails                       ▼]            │
├─────────────────────────────────────────────────────────────────┤
│ PRICING & DURATION                                              │
│ Price Type           ( ) Fixed  (•) Variable                    │
│ Price From*          [$35.00   ]                                │
│ Price To             [$55.00   ]                                │
│ Duration*            [45       ] minutes                        │
├─────────────────────────────────────────────────────────────────┤
│ STAFF ASSIGNMENT                                                │
│ ☑ Zeus     $45.00 / 45 min    [Customize]                      │
│ ☑ Lisa     $45.00 / 45 min    [Customize]                      │
│ ☑ Amy      $50.00 / 50 min    [Customize]                      │
│ ☐ Tom                                                           │
├─────────────────────────────────────────────────────────────────┤
│ SETTINGS                                                        │
│ ☑ Available for online booking                                  │
│ ☐ Requires patch test                                           │
│ ☐ Tax exempt                                                    │
│ Commission           [40       ]%                               │
│ Turn Weight          [1.0      ]                                │
├─────────────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save Service]           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Technical Requirements

### 8.1 Data Model

```typescript
interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  showOnlineBooking: boolean;
  parentCategoryId?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  duration: number;  // minutes
  priceType: 'fixed' | 'variable';
  priceFrom: number;
  priceTo?: number;
  isActive: boolean;
  showOnlineBooking: boolean;
  requiresPatchTest: boolean;
  taxExempt: boolean;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  turnWeight: number;
  sortOrder: number;
  staffAssignments: StaffServiceAssignment[];
  addOnGroupIds: string[];
}

interface StaffServiceAssignment {
  staffId: string;
  customPrice?: number;
  customDuration?: number;
}

interface AddOnGroup {
  id: string;
  name: string;
  selectionRule: 'optional' | 'required' | 'single' | 'multi';
  linkedServiceIds: string[];
  sortOrder: number;
}

interface AddOn {
  id: string;
  name: string;
  description?: string;
  groupId: string;
  price: number;
  durationAdjustment: number;  // minutes to add
  isActive: boolean;
  sortOrder: number;
}

interface Package {
  id: string;
  name: string;
  description?: string;
  includedServiceIds: string[];
  price: number;
  validityDays?: number;
  restrictedStaffIds?: string[];
  showOnlineBooking: boolean;
  isActive: boolean;
}
```

### 8.2 Performance Targets

| Metric | Target |
|--------|--------|
| Category list load | < 500ms |
| Service search | < 200ms |
| Save service | < 1 second |
| Sync to devices | < 5 seconds |

### 8.3 Offline Behavior

| Capability | Offline Support |
|------------|-----------------|
| View catalog | ✅ Cached locally |
| Edit services | ✅ Queue for sync |
| Add new service | ✅ Queue for sync |
| Delete service | ✅ Queue for sync |

---

## 9. Implementation Plan

### Phase 1: Core Catalog (Week 1-2)
- [ ] MNU-P0-001 to MNU-P0-005: Categories CRUD
- [ ] MNU-P0-008 to MNU-P0-013: Basic services
- [ ] MNU-P0-016, MNU-P0-022: Service status and ordering

### Phase 2: Staff & Pricing (Week 3)
- [ ] MNU-P1-014, MNU-P1-015: Staff-specific overrides
- [ ] MNU-P1-012: Variable pricing
- [ ] MNU-P1-018, MNU-P1-019: Commission and turn weight

### Phase 3: Add-Ons (Week 4)
- [ ] MNU-P1-023 to MNU-P1-026: Add-on groups
- [ ] MNU-P1-027 to MNU-P1-031: Add-on items

### Phase 4: Packages & Advanced (Week 5+)
- [ ] MNU-P1-033 to MNU-P1-035: Packages
- [ ] MNU-P1-017: Online booking settings
- [ ] MNU-P1-020, MNU-P1-021: Patch test and tax flags

---

## Appendix

### A. Related Documents

- [PRD-Book-Module.md](./PRD-Book-Module.md) - Uses service catalog for booking
- [PRD-Sales-Checkout-Module.md](./PRD-Sales-Checkout-Module.md) - Uses catalog for pricing
- [PRD-Team-Module.md](./PRD-Team-Module.md) - Staff service assignments

---

*Document Version: 1.0 | Created: December 27, 2025*
