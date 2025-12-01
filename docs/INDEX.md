# Mango POS Documentation Index

> **Last Updated:** December 1, 2025

This index provides quick navigation to all system documentation.

---

## 📐 Architecture

Core system design and technical specifications.

| Document | Description |
|----------|-------------|
| [TECHNICAL_DOCUMENTATION.md](./architecture/TECHNICAL_DOCUMENTATION.md) | **Main technical reference** - System overview, stack, architecture |
| [DATA_STORAGE_STRATEGY.md](./architecture/DATA_STORAGE_STRATEGY.md) | Complete data layer: schemas, sync, conflicts, security |
| [ARCHITECTURE_DECISION_RECORDS.md](./architecture/ARCHITECTURE_DECISION_RECORDS.md) | ADRs documenting key architectural decisions |
| [mango-complete-architecture.md](./architecture/mango-complete-architecture.md) | High-level architecture overview |
| [INFRASTRUCTURE_AUDIT.md](./architecture/INFRASTRUCTURE_AUDIT.md) | Infrastructure assessment |
| [CONFLICTS_ANALYSIS.md](./architecture/CONFLICTS_ANALYSIS.md) | Conflict resolution analysis |

---

## 📋 Product

Product requirements and roadmap documents.

| Document | Description |
|----------|-------------|
| [Mango POS PRD v1.md](./product/Mango%20POS%20PRD%20v1.md) | **Main PRD** - Complete product requirements |
| [PRD-Opt-In-Offline-Mode.md](./product/PRD-Opt-In-Offline-Mode.md) | **NEW** - Opt-in offline mode (online-only by default) |
| [PRD-Turn-Tracker-Module.md](./product/PRD-Turn-Tracker-Module.md) | Turn Tracker module requirements |
| [MANGO_2.0_PLAN.md](./product/MANGO_2.0_PLAN.md) | Version 2.0 roadmap |
| [10X_PLAN.md](./product/10X_PLAN.md) | 10X improvement plan |
| [FEATURE_GAP_ANALYSIS.md](./product/FEATURE_GAP_ANALYSIS.md) | Feature gap analysis |
| [IMPLEMENTATION_PLAN.md](./product/IMPLEMENTATION_PLAN.md) | Implementation roadmap |
| [IMPROVEMENT_PLAN.md](./product/IMPROVEMENT_PLAN.md) | Improvement priorities |

---

## 🧩 Modules

Module-specific documentation organized by feature area.

### Book (Appointments/Calendar)
`docs/modules/book/`

| Key Documents |
|---------------|
| [BOOK_UX_IMPLEMENTATION_GUIDE.md](./modules/book/BOOK_UX_IMPLEMENTATION_GUIDE.md) - Implementation guide |
| [BOOK_MODULE_ROADMAP.md](./modules/book/BOOK_MODULE_ROADMAP.md) - Module roadmap |
| [APPOINTMENT_API_REFERENCE.md](./modules/book/APPOINTMENT_API_REFERENCE.md) - API reference |
| [BOOK_MODULE_STATES_QUICK_REFERENCE.md](./modules/book/BOOK_MODULE_STATES_QUICK_REFERENCE.md) - State reference |

### Front Desk
`docs/modules/frontdesk/`

| Key Documents |
|---------------|
| [FRONTDESK_UI_10X_IMPROVEMENT_PLAN.md](./modules/frontdesk/FRONTDESK_UI_10X_IMPROVEMENT_PLAN.md) - UI improvement plan |
| [FRONTDESK_SETTINGS_IMPLEMENTATION.md](./modules/frontdesk/FRONTDESK_SETTINGS_IMPLEMENTATION.md) - Settings implementation |
| [ALL_VIEW_MODES_IMPLEMENTATION.md](./modules/frontdesk/ALL_VIEW_MODES_IMPLEMENTATION.md) - View modes (Grid/Compact/Line) |
| [GRID_NORMAL_REFERENCE.md](./modules/frontdesk/GRID_NORMAL_REFERENCE.md) - Grid view reference |

### Tickets
`docs/modules/tickets/`

| Key Documents |
|---------------|
| [UNIFIED_TICKET_DESIGN_SYSTEM.md](./modules/tickets/UNIFIED_TICKET_DESIGN_SYSTEM.md) - Design system |
| [TICKET_DESIGN_MOCKUP.md](./modules/tickets/TICKET_DESIGN_MOCKUP.md) - Design mockups |
| [ALIGNED_TICKET_STRUCTURE.md](./modules/tickets/ALIGNED_TICKET_STRUCTURE.md) - Structure alignment |

### Checkout
`docs/modules/checkout/`

| Key Documents |
|---------------|
| [CHECKOUT_UI_ANALYSIS.md](./modules/checkout/CHECKOUT_UI_ANALYSIS.md) - UI analysis |
| [THERMAL_RECEIPT_IMPLEMENTATION_PLAN.md](./modules/checkout/THERMAL_RECEIPT_IMPLEMENTATION_PLAN.md) - Receipt printing |

### Admin
`docs/modules/ADMIN.md` - Admin portal documentation

---

## 📖 Guides

How-to guides and reference materials.

| Document | Description |
|----------|-------------|
| [WORKFLOW_GUIDE.md](./guides/WORKFLOW_GUIDE.md) | Development workflow |
| [DEPLOYMENT_INSTRUCTIONS.md](./guides/DEPLOYMENT_INSTRUCTIONS.md) | Deployment guide |
| [IMPLEMENTATION-CHECKLIST.md](./guides/IMPLEMENTATION-CHECKLIST.md) | Implementation checklist |
| [KEYBOARD_SHORTCUTS.md](./guides/KEYBOARD_SHORTCUTS.md) | Keyboard shortcuts reference |
| [QUICK_REFERENCE.md](./guides/QUICK_REFERENCE.md) | Quick reference card |
| [SALON-OPERATIONS-GUIDE.md](./guides/SALON-OPERATIONS-GUIDE.md) | Salon operations guide |
| [SERVICE_TEXT_STYLING_STANDARD.md](./guides/SERVICE_TEXT_STYLING_STANDARD.md) | Text styling standards |
| [INDEXEDDB_INTEGRATION_COMPLETE.md](./guides/INDEXEDDB_INTEGRATION_COMPLETE.md) | IndexedDB integration |
| [IMPLEMENT-OPT-IN-OFFLINE-MODE.md](./guides/IMPLEMENT-OPT-IN-OFFLINE-MODE.md) | **NEW** - Implementation guide for opt-in offline mode |

---

## 🎨 Design

UI/UX design documentation and standards.

| Document | Description |
|----------|-------------|
| [PREMIUM_FRONT_DESK_DESIGN.md](./design/PREMIUM_FRONT_DESK_DESIGN.md) | Premium design specs |
| [MODERN_SECTION_HEADERS.md](./design/MODERN_SECTION_HEADERS.md) | Section header design |
| [SECTION_10X_IMPROVEMENT_PLAN.md](./design/SECTION_10X_IMPROVEMENT_PLAN.md) | Section improvements |
| [UI_COMPARISON.md](./design/UI_COMPARISON.md) | UI comparison analysis |
| [COLOR_COMPARISON.md](./design/COLOR_COMPARISON.md) | Color palette comparison |
| [CARD_COMPARISON.md](./design/CARD_COMPARISON.md) | Card design comparison |

---

## 🔌 API

API documentation and integration guides.

| Document | Description |
|----------|-------------|
| [CONTROL_CENTER_API.md](./api/CONTROL_CENTER_API.md) | Control Center API reference |

---

## 📊 Reports

Progress reports, audits, and session summaries.

| Category | Documents |
|----------|-----------|
| **Phase Reports** | PHASE_1 through PHASE_7 completion reports |
| **Audits** | CURRENT_STATE_AUDIT, PERFORMANCE_AUDIT_INDEX, RESPONSIVE_AUDIT_README |
| **Bug Fixes** | ALL_BUGS_FIXED, BUG_FIX_FINAL |
| **Session Summaries** | SESSION_SUMMARY, various completion reports |

See `docs/reports/` for all progress documentation.

---

## 🤖 Agent Instructions

| Document | Description |
|----------|-------------|
| [CLAUDE.md](../CLAUDE.md) | AI agent context and instructions (in project root) |

---

## Directory Structure

```
/
├── CLAUDE.md                # Agent instructions (root)
├── README.md                # Project readme
└── docs/
    ├── INDEX.md             # This file
    ├── architecture/        # System design & technical specs
    ├── product/             # PRDs & roadmaps
    ├── modules/             # Module-specific docs
    │   ├── book/            # Appointments/Calendar
    │   ├── frontdesk/       # Front desk views
    │   ├── tickets/         # Ticket management
    │   ├── checkout/        # Payment & receipts
    │   └── turn-tracker/    # Turn tracking
    ├── guides/              # How-to guides
    ├── design/              # UI/UX documentation
    ├── api/                 # API references
    └── reports/             # Progress & audit reports
```

---

## Quick Start for Developers

1. **New to the project?** Start with [TECHNICAL_DOCUMENTATION.md](./architecture/TECHNICAL_DOCUMENTATION.md)
2. **Understanding data layer?** Read [DATA_STORAGE_STRATEGY.md](./architecture/DATA_STORAGE_STRATEGY.md)
3. **Product requirements?** See [Mango POS PRD v1.md](./product/Mango%20POS%20PRD%20v1.md)
4. **Working on a module?** Check `docs/modules/<module-name>/`
5. **Deployment?** Follow [DEPLOYMENT_INSTRUCTIONS.md](./guides/DEPLOYMENT_INSTRUCTIONS.md)

---

## Quick Start for AI Agents

1. **Context:** Read [CLAUDE.md](../CLAUDE.md) for project context and mandatory reading list
2. **Architecture:** [TECHNICAL_DOCUMENTATION.md](./architecture/TECHNICAL_DOCUMENTATION.md)
3. **Data Layer:** [DATA_STORAGE_STRATEGY.md](./architecture/DATA_STORAGE_STRATEGY.md)
4. **Module-specific:** Navigate to `docs/modules/<module>/`

> ⚠️ **Important:** The `CLAUDE.md` file contains a **Pre-Implementation Checklist** that must be followed before making any code changes.
