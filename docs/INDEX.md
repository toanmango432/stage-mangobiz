# Mango POS Documentation Index

> **Last Updated:** December 30, 2025
> **Structure:** Diataxis Framework (Tutorials, How-To, Reference, Explanation)

Essential documentation for Mango POS Offline V2.

---

## 📐 Architecture (Explanation)

Understanding-oriented documentation for system design and decisions.

| Document | Description |
|----------|-------------|
| [TECHNICAL_DOCUMENTATION.md](./architecture/TECHNICAL_DOCUMENTATION.md) | **Start here** - System overview, stack, native platforms |
| [DATA_STORAGE_STRATEGY.md](./architecture/DATA_STORAGE_STRATEGY.md) | Data layer: schemas, sync, conflicts, security |
| [PAYMENT_INTEGRATION.md](./architecture/PAYMENT_INTEGRATION.md) | Tap to Pay, Fiserv SDK, Capacitor integration |
| [ARCHITECTURE_DECISION_RECORDS.md](./architecture/ARCHITECTURE_DECISION_RECORDS.md) | ADRs for key decisions (including ADR-016: Offline-First) |

---

## 📋 Product Requirements

Business requirements and feature specifications.

| Document | Description |
|----------|-------------|
| [Mango POS PRD.md](./product/Mango%20POS%20PRD.md) | **Main PRD** - Operations (Book, Front Desk, Pending, Checkout) |
| [PRD-Front-Desk-Module.md](./product/PRD-Front-Desk-Module.md) | Operations command center (P0 module) |
| [PRD-Team-Module.md](./product/PRD-Team-Module.md) | **v2.0** - Team Management (profiles, timesheets, payroll, turns) |
| [PRD-Sales-Checkout-Module.md](./product/PRD-Sales-Checkout-Module.md) | Sales & Checkout with three-panel layout |
| [PRD-Clients-CRM-Module.md](./product/PRD-Clients-CRM-Module.md) | Clients/CRM with blocking, forms, loyalty |
| [PRD-Turn-Tracker-Module.md](./product/PRD-Turn-Tracker-Module.md) | Turn Tracker module |
| [PRD-Offline-Mode.md](./product/PRD-Offline-Mode.md) | Offline-first architecture |
| [PRD-API-Specifications.md](./product/PRD-API-Specifications.md) | Complete API specs (~160 endpoints, 16 categories) |
| [TEAM-MODULE-COMPARISON-FRESHA.md](./product/TEAM-MODULE-COMPARISON-FRESHA.md) | Competitive analysis: Mango vs Fresha |
| [FEATURE_GAP_ANALYSIS.md](./product/FEATURE_GAP_ANALYSIS.md) | Feature gap analysis |

---

## 📚 Reference

Information-oriented documentation for looking up specific details.

### API Reference

| Document | Description |
|----------|-------------|
| [CONTROL_CENTER_API.md](./reference/api/CONTROL_CENTER_API.md) | Control Center API |

### Design Specifications

| Document | Description |
|----------|-------------|
| [PREMIUM_FRONT_DESK_DESIGN.md](./reference/design/PREMIUM_FRONT_DESK_DESIGN.md) | Premium Front Desk design specs |
| [CHECKOUT_DESIGN_SPEC.md](./reference/design/CHECKOUT_DESIGN_SPEC.md) | Checkout UI components |
| [CLIENT_CRM_DESIGN_SPEC.md](./reference/design/CLIENT_CRM_DESIGN_SPEC.md) | Client/CRM design |
| [TEAM_DESIGN_SPEC.md](./reference/design/TEAM_DESIGN_SPEC.md) | Team module design |
| [REPORTS_DESIGN_SPEC.md](./reference/design/REPORTS_DESIGN_SPEC.md) | Reports design |
| [TURN_TRACKER_DESIGN_SPEC.md](./reference/design/TURN_TRACKER_DESIGN_SPEC.md) | Turn Tracker design |
| [MODERN_SECTION_HEADERS.md](./reference/design/MODERN_SECTION_HEADERS.md) | Section header styles |

### Module Reference

#### Book (Appointments/Calendar)

| Document | Purpose |
|----------|---------|
| [BOOK_UX_IMPLEMENTATION_GUIDE.md](./reference/modules/book/BOOK_UX_IMPLEMENTATION_GUIDE.md) | Implementation guide |
| [APPOINTMENT_API_REFERENCE.md](./reference/modules/book/APPOINTMENT_API_REFERENCE.md) | API reference |
| [BOOK_MODULE_STATES_QUICK_REFERENCE.md](./reference/modules/book/BOOK_MODULE_STATES_QUICK_REFERENCE.md) | State reference |
| [BOOK_MODULE_ROADMAP.md](./reference/modules/book/BOOK_MODULE_ROADMAP.md) | Roadmap |
| [BOOK_MODULE_COMPONENT_LOCATIONS.md](./reference/modules/book/BOOK_MODULE_COMPONENT_LOCATIONS.md) | Component map |
| [BOOK_MODULE_UNDERSTANDING.md](./reference/modules/book/BOOK_MODULE_UNDERSTANDING.md) | Module overview |
| [BOOK_MODULE_IMPROVEMENTS.md](./reference/modules/book/BOOK_MODULE_IMPROVEMENTS.md) | Improvements |

#### Front Desk

| Document | Purpose |
|----------|---------|
| [ALL_VIEW_MODES_IMPLEMENTATION.md](./reference/modules/frontdesk/ALL_VIEW_MODES_IMPLEMENTATION.md) | Grid/Compact/Line views |
| [FRONTDESK_SETTINGS_IMPLEMENTATION.md](./reference/modules/frontdesk/FRONTDESK_SETTINGS_IMPLEMENTATION.md) | Settings |
| [FRONTDESK_SETTINGS_EXAMPLES.md](./reference/modules/frontdesk/FRONTDESK_SETTINGS_EXAMPLES.md) | Examples |
| [GRID_NORMAL_REFERENCE.md](./reference/modules/frontdesk/GRID_NORMAL_REFERENCE.md) | Grid reference |

#### Tickets

| Document | Purpose |
|----------|---------|
| [UNIFIED_TICKET_DESIGN_SYSTEM.md](./reference/modules/tickets/UNIFIED_TICKET_DESIGN_SYSTEM.md) | Design system |
| [TICKET_DESIGN_MOCKUP.md](./reference/modules/tickets/TICKET_DESIGN_MOCKUP.md) | Mockups |
| [ALIGNED_TICKET_STRUCTURE.md](./reference/modules/tickets/ALIGNED_TICKET_STRUCTURE.md) | Structure |
| [UNIFIED_TICKET_NUMBER_AND_BORDERS.md](./reference/modules/tickets/UNIFIED_TICKET_NUMBER_AND_BORDERS.md) | Styling |

#### Checkout

| Document | Purpose |
|----------|---------|
| [CHECKOUT_UI_ANALYSIS.md](./reference/modules/checkout/CHECKOUT_UI_ANALYSIS.md) | UI analysis |

#### Settings

| Document | Purpose |
|----------|---------|
| [MORE_MODULE_ANALYSIS.md](./reference/modules/settings/MORE_MODULE_ANALYSIS.md) | Module analysis |
| [MORE_MODULE_IMPLEMENTATION_PLAN.md](./reference/modules/settings/MORE_MODULE_IMPLEMENTATION_PLAN.md) | Implementation plan |
| [NAVIGATION_RESTRUCTURING_PLAN.md](./reference/modules/settings/NAVIGATION_RESTRUCTURING_PLAN.md) | Navigation restructuring |

#### Admin

| Document | Purpose |
|----------|---------|
| [ADMIN.md](./reference/modules/ADMIN.md) | Admin portal |

---

## 📖 How-To Guides

Task-oriented documentation for accomplishing specific goals.

| Document | Description |
|----------|-------------|
| [WORKFLOW_GUIDE.md](./guides/WORKFLOW_GUIDE.md) | Development workflow |
| [DEPLOYMENT_INSTRUCTIONS.md](./guides/DEPLOYMENT_INSTRUCTIONS.md) | Deployment instructions |
| [MIGRATION_GUIDE.md](./guides/MIGRATION_GUIDE.md) | Migration guide |
| [DOCUMENTATION_PROCESS.md](./guides/DOCUMENTATION_PROCESS.md) | Documentation process |
| [KEYBOARD_SHORTCUTS.md](./guides/KEYBOARD_SHORTCUTS.md) | Keyboard shortcuts |
| [QUICK_REFERENCE.md](./guides/QUICK_REFERENCE.md) | Quick reference |
| [SALON-OPERATIONS-GUIDE.md](./guides/SALON-OPERATIONS-GUIDE.md) | Salon operations |

---

## 🧪 Testing

| Document | Description |
|----------|-------------|
| [Testing Hub](./testing/README.md) | All testing guides and documentation |
| [TESTING_GUIDE.md](./testing/TESTING_GUIDE.md) | Comprehensive testing guide |
| [TESTING_QUICK_REFERENCE.md](./testing/TESTING_QUICK_REFERENCE.md) | Quick reference card |
| [FRONT_DESK_MANUAL_TEST.md](./testing/FRONT_DESK_MANUAL_TEST.md) | Front Desk manual testing |
| [FRONT_DESK_BACKEND_TEST_RESULTS.md](./testing/FRONT_DESK_BACKEND_TEST_RESULTS.md) | Backend test results |

---

## 📝 Templates

| Document | Description |
|----------|-------------|
| [PRD_TEMPLATE.md](./templates/PRD_TEMPLATE.md) | PRD template |
| [DESIGN_SPEC_TEMPLATE.md](./templates/DESIGN_SPEC_TEMPLATE.md) | Design spec template |

---

## 🗄️ Archive

Historical documentation moved to `docs/archive/`:

| Folder | Contents |
|--------|----------|
| `archive/tasks/` | Historical task plans and todos (106 files) |
| `archive/analysis/` | Analysis and assessment documents |
| `archive/implementation/` | Completed implementation plans |
| `archive/phases/` | Phase 1-7 completion reports |
| `archive/audits/` | Performance, responsive, state audits |
| `archive/legacy/` | Outdated plans, summaries, comparisons |
| `archive/modules/` | Old module analysis & plans |

---

## 🤖 Agent Instructions

| Document | Description |
|----------|-------------|
| [CLAUDE.md](../CLAUDE.md) | AI agent context (project root) |

---

## Directory Structure

```
docs/
├── INDEX.md                  # This file
├── architecture/             # 4 docs - Explanation (understanding-oriented)
├── product/                  # 10+ docs - PRDs & feature specs
├── reference/                # Reference (information-oriented)
│   ├── api/                  # 1 doc - API reference
│   ├── design/               # 7 docs - Design specifications
│   └── modules/              # 22 docs - Module reference
│       ├── book/             # 8 docs
│       ├── frontdesk/        # 4 docs
│       ├── tickets/          # 4 docs
│       ├── checkout/         # 1 doc
│       └── settings/         # 5 docs
├── guides/                   # 7 docs - How-To (task-oriented)
├── testing/                  # 8 docs - Testing guides & results
├── templates/                # 2 docs - Document templates
└── archive/                  # 200+ docs - Historical
    ├── tasks/                # Historical task plans
    ├── analysis/             # Historical analysis
    ├── implementation/       # Completed implementations
    ├── phases/               # Phase reports
    ├── audits/               # Audits
    ├── legacy/               # Old docs
    └── modules/              # Old module docs
```

---

## Quick Start

### For Developers

1. [TECHNICAL_DOCUMENTATION.md](./architecture/TECHNICAL_DOCUMENTATION.md) — Architecture & native platforms
2. [DATA_STORAGE_STRATEGY.md](./architecture/DATA_STORAGE_STRATEGY.md) — Data layer
3. [PAYMENT_INTEGRATION.md](./architecture/PAYMENT_INTEGRATION.md) — Payment & Tap to Pay
4. [Mango POS PRD.md](./product/Mango%20POS%20PRD.md) — Requirements
5. `docs/reference/modules/<module>/` — Module-specific

### For AI Agents

1. [CLAUDE.md](../CLAUDE.md) — Mandatory context
2. [TECHNICAL_DOCUMENTATION.md](./architecture/TECHNICAL_DOCUMENTATION.md)
3. [DATA_STORAGE_STRATEGY.md](./architecture/DATA_STORAGE_STRATEGY.md)

> **Pre-Implementation Checklist** in `CLAUDE.md` must be followed before code changes.
