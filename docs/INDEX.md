# Mango POS Documentation Index

> **Last Updated:** December 28, 2025
> **Active Docs:** 45 | **Archived:** 113

Essential documentation for Mango POS Offline V2.

---

## 📐 Architecture

| Document | Description |
|----------|-------------|
| [TECHNICAL_DOCUMENTATION.md](./architecture/TECHNICAL_DOCUMENTATION.md) | **Start here** - System overview, stack, native platforms |
| [DATA_STORAGE_STRATEGY.md](./architecture/DATA_STORAGE_STRATEGY.md) | Data layer: schemas, sync, conflicts, security |
| [PAYMENT_INTEGRATION.md](./architecture/PAYMENT_INTEGRATION.md) | **NEW** - Tap to Pay, Fiserv SDK, Capacitor integration |
| [ARCHITECTURE_DECISION_RECORDS.md](./architecture/ARCHITECTURE_DECISION_RECORDS.md) | ADRs for key decisions (including ADR-016: Offline-First) |

---

## 🧪 Testing

| Document | Description |
|----------|-------------|
| [Testing Documentation](./testing/README.md) | **Testing Hub** - All testing guides and documentation |
| [TESTING_GUIDE.md](./testing/TESTING_GUIDE.md) | Comprehensive testing guide for all implemented fixes |
| [TESTING_QUICK_REFERENCE.md](./testing/TESTING_QUICK_REFERENCE.md) | Quick reference card for fast testing |
| [FRONT_DESK_MANUAL_TEST.md](./testing/FRONT_DESK_MANUAL_TEST.md) | Step-by-step manual testing guide for Front Desk flows |
| [FRONT_DESK_BACKEND_TEST_RESULTS.md](./testing/FRONT_DESK_BACKEND_TEST_RESULTS.md) | Backend test results and verification checklist |

---

## 📋 Product

| Document | Description |
|----------|-------------|
| [Mango POS PRD.md](./product/Mango%20POS%20PRD.md) | **Main PRD** - Operations (Book, Front Desk, Pending, Checkout) |
| [PRD-Front-Desk-Module.md](./product/PRD-Front-Desk-Module.md) | **NEW** - Operations command center (P0 module) |
| [PRD-Team-Module.md](./product/PRD-Team-Module.md) | **v2.0** - Team Management (profiles, timesheets, payroll, turns) |
| [PRD-Sales-Checkout-Module.md](./product/PRD-Sales-Checkout-Module.md) | Sales & Checkout with three-panel layout |
| [PRD-Clients-CRM-Module.md](./product/PRD-Clients-CRM-Module.md) | Clients/CRM with blocking, forms, loyalty |
| [PRD-Turn-Tracker-Module.md](./product/PRD-Turn-Tracker-Module.md) | Turn Tracker module |
| [PRD-Offline-Mode.md](./product/PRD-Offline-Mode.md) | Offline-first architecture (all devices offline by default) |
| [PRD-API-Specifications.md](./product/PRD-API-Specifications.md) | **NEW** - Complete API specs (~160 endpoints, 16 categories) |
| [TEAM-MODULE-COMPARISON-FRESHA.md](./product/TEAM-MODULE-COMPARISON-FRESHA.md) | Competitive analysis: Mango vs Fresha |
| [FEATURE_GAP_ANALYSIS.md](./product/FEATURE_GAP_ANALYSIS.md) | Feature gap analysis |

---

## 🧩 Modules

### Book (Appointments/Calendar) — 7 docs

| Document | Purpose |
|----------|---------|
| [BOOK_UX_IMPLEMENTATION_GUIDE.md](./modules/book/BOOK_UX_IMPLEMENTATION_GUIDE.md) | Implementation guide |
| [APPOINTMENT_API_REFERENCE.md](./modules/book/APPOINTMENT_API_REFERENCE.md) | API reference |
| [BOOK_MODULE_STATES_QUICK_REFERENCE.md](./modules/book/BOOK_MODULE_STATES_QUICK_REFERENCE.md) | State reference |
| [BOOK_MODULE_ROADMAP.md](./modules/book/BOOK_MODULE_ROADMAP.md) | Roadmap |
| [BOOK_MODULE_COMPONENT_LOCATIONS.md](./modules/book/BOOK_MODULE_COMPONENT_LOCATIONS.md) | Component map |
| [BOOK_MODULE_UNDERSTANDING.md](./modules/book/BOOK_MODULE_UNDERSTANDING.md) | Module overview |
| [BOOK_MODULE_IMPROVEMENTS.md](./modules/book/BOOK_MODULE_IMPROVEMENTS.md) | Improvements |

### Front Desk — 4 docs

| Document | Purpose |
|----------|---------|
| [ALL_VIEW_MODES_IMPLEMENTATION.md](./modules/frontdesk/ALL_VIEW_MODES_IMPLEMENTATION.md) | Grid/Compact/Line views |
| [FRONTDESK_SETTINGS_IMPLEMENTATION.md](./modules/frontdesk/FRONTDESK_SETTINGS_IMPLEMENTATION.md) | Settings |
| [FRONTDESK_SETTINGS_EXAMPLES.md](./modules/frontdesk/FRONTDESK_SETTINGS_EXAMPLES.md) | Examples |
| [GRID_NORMAL_REFERENCE.md](./modules/frontdesk/GRID_NORMAL_REFERENCE.md) | Grid reference |

### Tickets — 4 docs

| Document | Purpose |
|----------|---------|
| [UNIFIED_TICKET_DESIGN_SYSTEM.md](./modules/tickets/UNIFIED_TICKET_DESIGN_SYSTEM.md) | Design system |
| [TICKET_DESIGN_MOCKUP.md](./modules/tickets/TICKET_DESIGN_MOCKUP.md) | Mockups |
| [ALIGNED_TICKET_STRUCTURE.md](./modules/tickets/ALIGNED_TICKET_STRUCTURE.md) | Structure |
| [UNIFIED_TICKET_NUMBER_AND_BORDERS.md](./modules/tickets/UNIFIED_TICKET_NUMBER_AND_BORDERS.md) | Styling |

### Checkout — 1 doc

| Document | Purpose |
|----------|---------|
| [CHECKOUT_UI_ANALYSIS.md](./modules/checkout/CHECKOUT_UI_ANALYSIS.md) | UI analysis |

### Admin

| Document | Purpose |
|----------|---------|
| [ADMIN.md](./modules/ADMIN.md) | Admin portal |

---

## 📖 Guides

| Document | Description |
|----------|-------------|
| [WORKFLOW_GUIDE.md](./guides/WORKFLOW_GUIDE.md) | Development workflow |
| [DEPLOYMENT_INSTRUCTIONS.md](./guides/DEPLOYMENT_INSTRUCTIONS.md) | Deployment |
| [IMPLEMENT-OPT-IN-OFFLINE-MODE.md](./guides/IMPLEMENT-OPT-IN-OFFLINE-MODE.md) | **NEW** - Opt-in offline implementation |
| [KEYBOARD_SHORTCUTS.md](./guides/KEYBOARD_SHORTCUTS.md) | Shortcuts |
| [QUICK_REFERENCE.md](./guides/QUICK_REFERENCE.md) | Quick reference |
| [SALON-OPERATIONS-GUIDE.md](./guides/SALON-OPERATIONS-GUIDE.md) | Salon operations |

---

## 🎨 Design

| Document | Description |
|----------|-------------|
| [PREMIUM_FRONT_DESK_DESIGN.md](./design/PREMIUM_FRONT_DESK_DESIGN.md) | Premium design specs |
| [MODERN_SECTION_HEADERS.md](./design/MODERN_SECTION_HEADERS.md) | Section headers |

---

## 🔌 API

| Document | Description |
|----------|-------------|
| [PRD-API-Specifications.md](./product/PRD-API-Specifications.md) | **Complete External API** - 160 endpoints, webhooks, data models |
| [CONTROL_CENTER_API.md](./api/CONTROL_CENTER_API.md) | Control Center API |

---

## 🗄️ Archive

Historical documentation moved to `docs/archive/`:

| Folder | Contents |
|--------|----------|
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
├── INDEX.md              # This file
├── architecture/         # 4 docs - Core technical specs (incl. Payment Integration)
├── product/              # 8 docs - PRDs + API Specs
├── modules/              # 17 docs - Module documentation
│   ├── book/             # 7 docs
│   ├── frontdesk/        # 4 docs
│   ├── tickets/          # 4 docs
│   ├── checkout/         # 1 doc
│   └── turn-tracker/     # (empty)
├── testing/              # 6 docs - Testing guides & results
├── guides/               # 6 docs - How-to guides
├── design/               # 2 docs - Design standards
├── api/                  # 1 doc - API reference
└── archive/              # 113 docs - Historical
    ├── phases/           # Phase reports
    ├── audits/           # Audits
    ├── legacy/           # Old docs
    └── modules/          # Old module docs
```

---

## Quick Start

### For Developers

1. [TECHNICAL_DOCUMENTATION.md](./architecture/TECHNICAL_DOCUMENTATION.md) — Architecture & native platforms
2. [DATA_STORAGE_STRATEGY.md](./architecture/DATA_STORAGE_STRATEGY.md) — Data layer
3. [PAYMENT_INTEGRATION.md](./architecture/PAYMENT_INTEGRATION.md) — Payment & Tap to Pay
4. [Mango POS PRD v1.md](./product/Mango%20POS%20PRD%20v1.md) — Requirements
5. `docs/modules/<module>/` — Module-specific

### For AI Agents

1. [CLAUDE.md](../CLAUDE.md) — Mandatory context
2. [TECHNICAL_DOCUMENTATION.md](./architecture/TECHNICAL_DOCUMENTATION.md)
3. [DATA_STORAGE_STRATEGY.md](./architecture/DATA_STORAGE_STRATEGY.md)

> ⚠️ **Pre-Implementation Checklist** in `CLAUDE.md` must be followed before code changes.
