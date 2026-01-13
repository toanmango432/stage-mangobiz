# AGENTS.md - Mango Store App

> AI agent instructions for the main Mango POS Store App.

---

## Quick Reference

| Item | Details |
|------|---------|
| **App Type** | Main POS application for salon staff |
| **Framework** | React 18 + TypeScript + Vite |
| **State** | Redux Toolkit |
| **Cloud DB** | Supabase (PostgreSQL) |
| **Local DB** | Dexie.js (IndexedDB) for offline |
| **Real-time** | MQTT for device communication |
| **UI** | Tailwind CSS + Radix UI + Framer Motion |
| **Dev Server** | `pnpm dev` |
| **Build** | `pnpm build` |
| **Typecheck** | `pnpm exec tsc --noEmit` |

---

## Architecture Overview

```
src/
├── components/          # React components
│   ├── Book/           # Appointment booking
│   ├── frontdesk/      # Front desk operations
│   ├── checkout/       # Payment/checkout flow
│   ├── tickets/        # Ticket management
│   ├── common/         # Reusable UI
│   └── ui/             # Base components (shadcn)
├── store/slices/       # Redux state
├── services/           # Data services
│   ├── dataService.ts  # Unified data access
│   ├── mqtt/           # MQTT client & topics
│   └── supabase/       # Supabase integration
├── hooks/              # Custom React hooks
├── types/              # TypeScript interfaces
├── utils/              # Utilities
└── design-system/      # Design tokens
```

---

## MQTT Architecture

### Topic Pattern
All topics follow: `salon/{storeId}/[module]/[action]`

### Key Files
- `src/services/mqtt/topics.ts` - Topic patterns and builders
- `src/services/mqtt/types.ts` - Message type definitions
- `src/services/mqtt/MqttClient.ts` - MQTT client singleton
- `src/services/mqtt/featureFlags.ts` - MQTT enable/disable flags
- `src/services/mqtt/hooks/` - React hooks for MQTT

### Mango Pad Topics (Store App perspective)
| Topic | Direction | Purpose |
|-------|-----------|---------|
| `salon/{id}/pad/ready_to_pay` | POS → Pad | Send transaction for checkout |
| `salon/{id}/pad/payment_result` | POS → Pad | Send payment success/failure |
| `salon/{id}/pad/cancel` | POS → Pad | Cancel current transaction |
| `salon/{id}/pad/tip_selected` | Pad → POS | Customer selected tip |
| `salon/{id}/pad/signature` | Pad → POS | Customer signature captured |
| `salon/{id}/pad/receipt_preference` | Pad → POS | Email/SMS/Print preference |
| `salon/{id}/pad/transaction_complete` | Pad → POS | Flow completed |
| `salon/{id}/pad/help_requested` | Pad → POS | Customer needs help |
| `salon/{id}/pad/heartbeat` | Pad → POS | Pad connection status |
| `salon/{id}/pos/heartbeat` | POS → Pad | POS connection status |

---

## Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm exec tsc --noEmit # Typecheck

# Testing
pnpm test             # Run unit tests
pnpm test:e2e         # Run Playwright E2E tests
```

---

## Do

- ✅ Use Redux for all state management
- ✅ Use dataService for data operations
- ✅ Use MQTT for device communication (Pad, Check-In)
- ✅ Use design tokens from src/design-system/
- ✅ Handle offline mode gracefully
- ✅ Use buildTopic() helper for MQTT topics
- ✅ Check isMqttEnabled() before MQTT operations

## Don't

- ❌ Call Supabase directly from components
- ❌ Hardcode store/salon IDs
- ❌ Create new MQTT topics without updating topics.ts
- ❌ Skip TypeScript interfaces for props
- ❌ Use inline styles (use Tailwind + design tokens)

---

## Codebase Patterns (Updated by Ralph)

> This section is updated by Ralph during autonomous builds.
> Add reusable patterns discovered during implementation.

<!-- Ralph will append patterns here -->

---

*Last updated: January 2026*
