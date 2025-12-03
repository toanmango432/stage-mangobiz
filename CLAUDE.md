# CLAUDE.md

> AI agent instructions for Mango POS Offline V2

---

## Quick Reference

| Item | Details |
|------|---------|
| **Frontend** | React 18, TypeScript 5.5, Vite |
| **State** | Redux Toolkit, React Query |
| **Cloud DB** | Supabase (PostgreSQL) - Direct sync, NO custom backend API |
| **Local DB** | Dexie.js (IndexedDB) - For offline-enabled devices |
| **UI** | Tailwind CSS, Radix UI, Framer Motion |
| **Forms** | React Hook Form + Zod |
| **Dev Server** | `npm run dev` → localhost:5173 |
| **Build** | `npm run build` |
| **Test** | `npm test` |
| **Full Docs** | `docs/INDEX.md` |
| **Full Tech Stack** | `docs/architecture/TECHNICAL_DOCUMENTATION.md` → Technology Stack section |

---

## ⚠️ Before Any Implementation

### 1. Reference Product Requirements Documents (PRDs)

**Always reference the relevant PRD before implementing features.** PRDs define the expected behavior, business rules, and acceptance criteria.

| Module/Feature | PRD Location |
|----------------|--------------|
| **Operations (Book, Front Desk, Pending, Checkout)** | `docs/product/Mango POS PRD v1.md` |
| **Sales & Checkout** | `docs/product/PRD-Sales-Checkout-Module.md` |
| **Clients/CRM** | `docs/product/PRD-Clients-CRM-Module.md` |
| **Turn Tracker** | `docs/product/PRD-Turn-Tracker-Module.md` |
| **Offline Mode** | `docs/product/PRD-Opt-In-Offline-Mode.md` |

### 2. Read Required Documentation

| Change Type | Must Read |
|-------------|-----------|
| **Any change** | [TECHNICAL_DOCUMENTATION.md](./docs/architecture/TECHNICAL_DOCUMENTATION.md) |
| **Data/Storage** | [DATA_STORAGE_STRATEGY.md](./docs/architecture/DATA_STORAGE_STRATEGY.md) |
| **Book Module** | `docs/modules/book/BOOK_UX_IMPLEMENTATION_GUIDE.md` |
| **Front Desk** | `docs/modules/frontdesk/` |
| **Tickets** | `docs/modules/tickets/UNIFIED_TICKET_DESIGN_SYSTEM.md` |
| **UI/Styling** | `src/constants/designSystem.ts`, `src/constants/premiumDesignTokens.ts` |

### 3. Pre-Implementation Checklist

- [ ] **Read the relevant PRD** for feature requirements and business rules
- [ ] Read relevant technical docs from table above
- [ ] Check existing patterns in similar components
- [ ] Verify TypeScript interfaces in `src/types/`
- [ ] Use design tokens from `src/constants/`
- [ ] Check utilities in `src/utils/` before creating new ones

---

## Architecture Overview

```
src/
├── components/          # React components
│   ├── Book/           # Appointment calendar
│   ├── frontdesk/      # Ticket management
│   ├── checkout/       # Payment processing
│   ├── common/         # Reusable UI
│   └── modules/        # Feature modules
├── store/slices/       # Redux state (appointments, tickets, staff, clients, auth, sync)
├── services/           # Data services layer
│   ├── dataService.ts  # Unified data access (routes to Supabase or IndexedDB)
│   └── supabase/       # Supabase integration
│       ├── client.ts   # Supabase client config
│       ├── types.ts    # Database type definitions
│       ├── adapters/   # Type converters (SupabaseRow ↔ AppType)
│       └── tables/     # CRUD operations per table
├── db/                 # IndexedDB operations (Dexie.js)
│   └── database.ts     # Local CRUD operations
├── types/              # TypeScript interfaces
├── utils/              # Utilities (smartAutoAssign, conflictDetection, etc.)
├── constants/          # Design tokens
└── hooks/              # Custom React hooks
```

---

## Critical Patterns

### Supabase Direct Sync Architecture (IMPORTANT)

**We use Supabase directly for data operations - NOT a custom Node.js/Express backend API.**

```
┌─────────────────────────────────────────────────────────────────────┐
│  ONLINE-ONLY DEVICE              │  OFFLINE-ENABLED DEVICE          │
│  (Default)                       │  (Designated devices)            │
│                                  │                                  │
│  Redux Thunk                     │  Redux Thunk                     │
│       ↓                          │       ↓                          │
│  dataService                     │  dataService                     │
│       ↓                          │       ↓                          │
│  Supabase Client                 │  IndexedDB → Sync Queue          │
│       ↓                          │       ↓ (when online)            │
│  PostgreSQL                      │  Supabase → PostgreSQL           │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- `dataService` routes data based on device mode (online-only vs offline-enabled)
- Type adapters convert between Supabase rows (snake_case) and app types (camelCase)
- Supabase tables: `clients`, `staff`, `services`, `appointments`, `tickets`, `transactions`
- All tables have `sync_status` and `sync_version` fields built-in

### Data Flow Pattern

```typescript
// In Redux thunks - use dataService, NOT direct Supabase/IndexedDB calls
import { dataService } from '@/services/dataService';
import { toAppointments } from '@/services/supabase/adapters';

const rows = await dataService.appointments.getByDate(date);
const appointments = toAppointments(rows);  // Convert to app types
```

### State Updates (Always follow this order)
1. Update Redux state first (immediate UI feedback)
2. Persist via dataService (routes to correct storage based on device mode)
3. Sync Queue handles background sync for offline-enabled devices

### Component Rules
- All props must have TypeScript interfaces
- Handle loading, error, and offline states
- Use `src/db/database.ts` for data operations (never direct IndexedDB access)

### Styling Rules
- Use Tailwind CSS with design tokens
- Import from `src/constants/designSystem.ts`
- Follow existing component patterns

---

## Key Files

| Purpose | File |
|---------|------|
| **Data Service** | `src/services/dataService.ts` |
| **Supabase Types** | `src/services/supabase/types.ts` |
| **Type Adapters** | `src/services/supabase/adapters/` |
| **Supabase Tables** | `src/services/supabase/tables/` |
| Local Database CRUD | `src/db/database.ts` |
| Redux Store | `src/store/index.ts` |
| Type Definitions | `src/types/index.ts` |
| Design Tokens | `src/constants/designSystem.ts` |
| Smart Assignment | `src/utils/smartAutoAssign.ts` |
| Conflict Detection | `src/utils/conflictDetection.ts` |

---

## Production Readiness & Assessments

| Document | Purpose |
|----------|---------|
| **🚀 Implementation Plan** | [PRODUCTION_READINESS_IMPLEMENTATION_PLAN.md](./PRODUCTION_READINESS_IMPLEMENTATION_PLAN.md) - **Ready to execute** 10-week plan with verified metrics |
| **📊 Production Assessment** | [PRODUCTION_READINESS_ASSESSMENT.md](./PRODUCTION_READINESS_ASSESSMENT.md) - Comprehensive frontend/backend ratings and analysis |
| **🏗️ Codebase Structure** | [CODEBASE_STRUCTURE_ANALYSIS.md](./CODEBASE_STRUCTURE_ANALYSIS.md) - Structure analysis and cleanup recommendations |

**Quick Status:**
- ✅ Supabase backend fully implemented
- ⚠️ Hardcoded credentials need to be moved to env vars (Phase 1, Task 1.1)
- ⚠️ Bundle size: 3.9MB (target: <2MB)
- ⚠️ Test coverage: ~3.5% (target: 70%+)
- ⚠️ 60+ files with deep imports need fixing

---

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run tests
npm run lint         # Lint code
npm run test:coverage # Run tests with coverage report
```

---

## Before Production Deployment

**⚠️ Critical:** Review and execute [PRODUCTION_READINESS_IMPLEMENTATION_PLAN.md](./PRODUCTION_READINESS_IMPLEMENTATION_PLAN.md)

**Must Complete:**
1. Move Supabase credentials to environment variables (Phase 1, Task 1.1)
2. Remove duplicate/experimental modules (Phase 1, Task 1.2)
3. Fix security vulnerabilities (Phase 1, Task 1.4)
4. Increase test coverage to 70%+ (Phase 3, Task 3.1)
5. Reduce bundle size to <2MB (Phase 4, Task 4.1)

---

## Don't

- ❌ Create custom `/api/v1/...` REST endpoints (we use Supabase directly)
- ❌ Call Supabase or IndexedDB directly from components (use dataService)
- ❌ Create new utilities without checking `src/utils/`
- ❌ Use inline styles instead of design tokens
- ❌ Skip TypeScript interfaces for props
- ❌ Ignore offline scenarios
- ❌ Assume we have a Node.js/Express backend for CRUD operations

## Do

- ✅ Use `dataService` for all data operations
- ✅ Create type adapters when adding new Supabase tables
- ✅ Read relevant docs before implementing
- ✅ Follow existing component patterns
- ✅ Use Redux → dataService → Supabase/IndexedDB flow
- ✅ Handle loading/error/offline states
- ✅ Use design tokens for styling
- ✅ Check `src/services/supabase/types.ts` for existing table schemas
