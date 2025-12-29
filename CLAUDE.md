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
| **Platforms** | Web, iOS (Capacitor), Android (Capacitor), Desktop (Electron) |
| **Payment SDK** | Fiserv CommerceHub TTP (Tap to Pay) via native plugins |
| **Dev Server** | `npm run dev` → localhost:5173 |
| **Build** | `npm run build` |
| **Test** | `npm test` |
| **Full Docs** | `docs/INDEX.md` |
| **Full Tech Stack** | `docs/architecture/TECHNICAL_DOCUMENTATION.md` → Technology Stack section |

---

## Environment Setup

Copy `.env.example` to `.env` and configure:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | Hardcoded fallback (remove in prod) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | Hardcoded fallback (remove in prod) |
| `VITE_API_BASE_URL` | Legacy API base URL | No | `http://localhost:3000/api` |
| `VITE_SOCKET_URL` | WebSocket server URL | No | `http://localhost:3000` |
| `VITE_CONTROL_CENTER_URL` | License validation server | No | `http://localhost:4000` |
| `VITE_DEV_MODE` | Enable dev features | No | `true` |
| `VITE_ENABLE_SOCKET` | Enable WebSocket | No | `true` |
| `VITE_ENABLE_OFFLINE_MODE` | Enable offline mode | No | `true` |

**Security Note:** Hardcoded Supabase credentials in `src/services/supabase/client.ts` and `src/admin/db/supabaseClient.ts` must be removed before production.

---

## ⚠️ Before Any Implementation

### 1. Reference Product Requirements Documents (PRDs)

**Always reference the relevant PRD before implementing features.** PRDs define the expected behavior, business rules, and acceptance criteria.

| Module/Feature | PRD Location |
|----------------|--------------|
| **Operations (Book, Front Desk, Pending, Checkout)** | `docs/product/Mango POS PRD.md` |
| **Book Module** | `docs/product/PRD-Book-Module.md` |
| **Sales & Checkout** | `docs/product/PRD-Sales-Checkout-Module.md` |
| **Payment Integration** | `docs/architecture/PAYMENT_INTEGRATION.md` |
| **Clients/CRM** | `docs/product/PRD-Clients-CRM-Module.md` |
| **Team/Staff** | `docs/product/PRD-Team-Module.md` |
| **Turn Tracker** | `docs/product/PRD-Turn-Tracker-Module.md` |
| **Offline Mode** | `docs/product/PRD-Offline-Mode.md` |
| **Feature Gap Analysis** | `docs/product/FEATURE_GAP_ANALYSIS.md` |

### 2. Read Required Documentation

| Change Type | Must Read |
|-------------|-----------|
| **Any change** | [TECHNICAL_DOCUMENTATION.md](./docs/architecture/TECHNICAL_DOCUMENTATION.md) |
| **Data/Storage** | [DATA_STORAGE_STRATEGY.md](./docs/architecture/DATA_STORAGE_STRATEGY.md) |
| **Native Platforms** | [PAYMENT_INTEGRATION.md](./docs/architecture/PAYMENT_INTEGRATION.md) |
| **Book Module** | `docs/modules/book/BOOK_UX_IMPLEMENTATION_GUIDE.md` |
| **Front Desk** | `docs/modules/frontdesk/` |
| **Tickets** | `docs/modules/tickets/UNIFIED_TICKET_DESIGN_SYSTEM.md` |
| **UI/Styling** | `src/design-system/README.md` (Single Source of Truth) |

### 3. Pre-Implementation Checklist

- [ ] **Read the relevant PRD** for feature requirements and business rules
- [ ] Read relevant technical docs from table above
- [ ] Check existing patterns in similar components
- [ ] Verify TypeScript interfaces in `src/types/`
- [ ] Use design tokens from `src/design-system/` (see README.md)
- [ ] Check utilities in `src/utils/` before creating new ones

---

## Git Conventions

### Branch Naming
```
feature/module-description    # New features
fix/module-description        # Bug fixes
docs/description              # Documentation only
refactor/module-description   # Code refactoring
```

### Commit Messages (Conventional Commits)
```
feat(module): add new feature description
fix(module): resolve bug description
docs: update documentation
refactor(module): improve code structure
test(module): add/update tests
```

**Examples from codebase:**
- `feat(staff): comprehensive Staff Section UX improvements`
- `fix: BookPage not showing staff - add fetchTeamMembers before loadStaff`
- `docs: add checkout restructuring plan with design phases`

---

## Native Platform Architecture

Mango POS runs on **multiple platforms** using a shared React codebase:

```
┌─────────────────────────────────────────────────────────────────────┐
│  WEB BROWSER               │  iOS/ANDROID (Capacitor)  │  DESKTOP   │
│  (Default)                 │  (Tap to Pay enabled)     │  (Electron)│
│                            │                           │            │
│  Vite Dev/Build            │  WebView + Native Plugins │  Electron  │
│       ↓                    │       ↓                   │     ↓      │
│  Browser                   │  Capacitor Bridge         │  Node.js   │
│       ↓                    │       ↓                   │     ↓      │
│  No NFC/TTP                │  Native NFC/TTP SDK       │  USB/Serial│
└─────────────────────────────────────────────────────────────────────┘
```

### Platform Capabilities

| Feature | Web | iOS (Capacitor) | Android (Capacitor) | Desktop (Electron) |
|---------|-----|-----------------|---------------------|-------------------|
| **Tap to Pay (NFC)** | ❌ | ✅ FiservTTP | ✅ Fiserv TTP | ❌ |
| **Card Reader USB** | ❌ | ❌ | ❌ | ✅ |
| **Receipt Printer** | Browser Print | Native ESC/POS | Native ESC/POS | USB ESC/POS |
| **Barcode Scanner** | Camera API | Native | Native | USB HID |
| **Offline Mode** | IndexedDB | IndexedDB | IndexedDB | IndexedDB |

### Native Plugin Structure (Future)

```
ios/
├── App/
│   └── Plugins/
│       └── FiservTTPPlugin/     # Tap to Pay native code (Swift)
android/
├── app/src/main/java/
│   └── com/mangobiz/pos/
│       └── FiservTTPPlugin.kt   # Tap to Pay native code (Kotlin)
electron/
├── main.ts                       # Electron main process
├── preload.ts                    # Secure bridge
└── plugins/
    └── UsbDevicePlugin.ts       # USB device access
src/
├── hooks/
│   ├── usePlatform.ts           # Platform detection
│   └── useTapToPay.ts           # Payment abstraction
└── services/
    └── payment/
        └── paymentBridge.ts     # Platform-agnostic payment service
```

### Payment Integration (Via Fiserv CommerceHub)

**Processor:** CardConnect/Fiserv (TSYS backend)
**SDK:** FiservTTP (iOS v1.0.7+, Android Kotlin)
**Docs:** [PAYMENT_INTEGRATION.md](./docs/architecture/PAYMENT_INTEGRATION.md)

---

## Architecture Overview

```
src/
├── components/          # React components
│   ├── Book/           # Appointment calendar & booking
│   ├── frontdesk/      # Front desk operations (FrontDesk, StaffSidebar, ServiceSection, WaitList, etc.)
│   ├── tickets/        # Ticket management (modals, cards, actions)
│   ├── checkout/       # Payment processing
│   ├── common/         # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/radix)
│   └── modules/        # Feature module wrappers
├── store/slices/       # Redux state (appointments, tickets, staff, clients, auth, sync)
├── services/           # Data services layer
│   ├── dataService.ts  # Unified data access (routes to Supabase or IndexedDB)
│   └── supabase/       # Supabase integration
│       ├── client.ts   # Supabase client config
│       ├── types.ts    # Database type definitions
│       ├── adapters/   # Type converters (SupabaseRow ↔ AppType)
│       └── tables/     # CRUD operations per table
├── db/                 # IndexedDB operations (Dexie.js)
├── providers/          # React contexts & providers
├── hooks/              # Custom React hooks
├── types/              # TypeScript interfaces
├── utils/              # Utilities (smartAutoAssign, conflictDetection, etc.)
├── design-system/      # Design tokens (SINGLE SOURCE OF TRUTH)
├── constants/          # Legacy constants (prefer design-system/)
└── testing/            # Test utilities & fixtures
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
- Use `dataService` for data operations (never direct Supabase/IndexedDB access)

### Styling Rules
- Use Tailwind CSS with design tokens from `src/design-system/`
- Import: `import { brand, colors } from '@/design-system'`
- Module tokens: `import { bookTokens } from '@/design-system/modules/book'`
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
| Design Tokens | `src/design-system/` (see README.md) |
| Smart Assignment | `src/utils/smartAutoAssign.ts` |
| Conflict Detection | `src/utils/conflictDetection.ts` |

---

## Production Readiness & Assessments

| Document | Purpose |
|----------|---------|
| **🚀 Implementation Plan** | [docs/implementation/PRODUCTION_READINESS_IMPLEMENTATION_PLAN.md](./docs/implementation/PRODUCTION_READINESS_IMPLEMENTATION_PLAN.md) - **Ready to execute** 10-week plan with verified metrics |
| **📊 Production Assessment** | [docs/analysis/PRODUCTION_READINESS_ASSESSMENT.md](./docs/analysis/PRODUCTION_READINESS_ASSESSMENT.md) - Comprehensive frontend/backend ratings and analysis |
| **🏗️ Codebase Structure** | [docs/analysis/CODEBASE_STRUCTURE_ANALYSIS.md](./docs/analysis/CODEBASE_STRUCTURE_ANALYSIS.md) - Structure analysis and cleanup recommendations |
| **🧹 Cleanup Plan** | [docs/CODEBASE_CLEANUP_IMPLEMENTATION_PLAN.md](./docs/CODEBASE_CLEANUP_IMPLEMENTATION_PLAN.md) - Folder/file reorganization plan |

**Quick Status:**
- ✅ Supabase backend fully implemented
- ⚠️ Hardcoded credentials need to be moved to env vars (Phase 1, Task 1.1)
- ⚠️ Bundle size: 3.9MB (target: <2MB)
- ⚠️ Test coverage: ~3.5% (target: 70%+)
- ⚠️ 60+ files with deep imports need fixing

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # Lint code

# Testing
npm test                 # Run unit tests
npm test -- --watch      # Run tests in watch mode
npm run test:ui          # Run tests with Vitest UI
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run E2E tests with UI

# Admin
npm run admin:server     # Start admin dev server

# Native Platforms (requires setup - see PAYMENT_INTEGRATION.md)
npx cap sync             # Sync web build to native projects
npx cap open ios         # Open iOS project in Xcode
npx cap open android     # Open Android project in Android Studio
npx cap run ios          # Build and run on iOS device/simulator
npx cap run android      # Build and run on Android device/emulator
npm run electron:dev     # Start Electron in dev mode (future)
npm run electron:build   # Build Electron app (future)
```

---

## Testing

| Type | Command | Framework |
|------|---------|-----------|
| Unit tests | `npm test` | Vitest |
| Unit tests (watch) | `npm test -- --watch` | Vitest |
| Unit tests (UI) | `npm run test:ui` | Vitest UI |
| Coverage report | `npm run test:coverage` | Vitest |
| E2E tests | `npm run test:e2e` | Playwright |
| E2E tests (UI) | `npm run test:e2e:ui` | Playwright |

### Test File Conventions
- Unit tests: `*.test.ts` or `*.test.tsx` alongside source files
- E2E tests: `e2e/*.spec.ts`

### Current Status
- Unit test coverage: ~3.5% (target: 70%+)
- E2E tests located in `e2e/` directory

---

## Before Production Deployment

**⚠️ Critical:** Review and execute [PRODUCTION_READINESS_IMPLEMENTATION_PLAN.md](./docs/implementation/PRODUCTION_READINESS_IMPLEMENTATION_PLAN.md)

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
- ❌ Use inline styles or hardcoded colors (use `@/design-system` tokens)
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
- ✅ Use design tokens from `@/design-system` for all colors/styling
- ✅ Check `src/services/supabase/types.ts` for existing table schemas

---

*Last updated: December 2025*
