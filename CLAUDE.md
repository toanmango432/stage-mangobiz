# CLAUDE.md

> AI agent instructions for Mango POS Offline V2

---

## Quick Reference

| Item | Location |
|------|----------|
| **Tech Stack** | React 18, TypeScript, Redux Toolkit, Dexie.js (IndexedDB), Tailwind CSS |
| **Dev Server** | `npm run dev` → localhost:5173 |
| **Build** | `npm run build` |
| **Test** | `npm test` |
| **Full Docs** | `docs/INDEX.md` |

---

## ⚠️ Before Any Implementation

### 1. Read Required Documentation

| Change Type | Must Read |
|-------------|-----------|
| **Any change** | [TECHNICAL_DOCUMENTATION.md](./docs/architecture/TECHNICAL_DOCUMENTATION.md) |
| **Data/Storage** | [DATA_STORAGE_STRATEGY.md](./docs/architecture/DATA_STORAGE_STRATEGY.md) |
| **Book Module** | `docs/modules/book/BOOK_UX_IMPLEMENTATION_GUIDE.md` |
| **Front Desk** | `docs/modules/frontdesk/` |
| **Tickets** | `docs/modules/tickets/UNIFIED_TICKET_DESIGN_SYSTEM.md` |
| **UI/Styling** | `src/constants/designSystem.ts`, `src/constants/premiumDesignTokens.ts` |

### 2. Pre-Implementation Checklist

- [ ] Read relevant docs from table above
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
├── db/                 # IndexedDB operations (Dexie.js)
│   └── database.ts     # All CRUD operations
├── types/              # TypeScript interfaces
├── utils/              # Utilities (smartAutoAssign, conflictDetection, etc.)
├── constants/          # Design tokens
└── hooks/              # Custom React hooks
```

---

## Critical Patterns

### Offline-First Data Flow (Current)
```
User Action → Redux (optimistic) → IndexedDB → Sync Queue → Server (when online)
```

> ⚠️ **Planned Change:** Offline mode will become opt-in per device. See [PRD-Opt-In-Offline-Mode.md](./docs/product/PRD-Opt-In-Offline-Mode.md)

### State Updates (Always follow this order)
1. Update Redux state first (immediate UI feedback)
2. Persist to IndexedDB (if offline-enabled device)
3. Queue for server sync

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
| Database CRUD | `src/db/database.ts` |
| Redux Store | `src/store/index.ts` |
| Type Definitions | `src/types/index.ts` |
| Design Tokens | `src/constants/designSystem.ts` |
| Smart Assignment | `src/utils/smartAutoAssign.ts` |
| Conflict Detection | `src/utils/conflictDetection.ts` |

---

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run tests
npm run lint         # Lint code
```

---

## Don't

- ❌ Access IndexedDB directly from components
- ❌ Create new utilities without checking `src/utils/`
- ❌ Use inline styles instead of design tokens
- ❌ Skip TypeScript interfaces for props
- ❌ Ignore offline scenarios

## Do

- ✅ Read relevant docs before implementing
- ✅ Follow existing component patterns
- ✅ Use Redux → IndexedDB → Sync flow
- ✅ Handle loading/error/offline states
- ✅ Use design tokens for styling
