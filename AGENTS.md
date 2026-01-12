# AGENTS.md - Mango POS Monorepo

> AI agent instructions for Mango POS. Updated by Ralph with discovered patterns.

---

## Quick Reference

| Item | Details |
|------|---------|
| **Apps** | store-app, mango-pad, online-store, check-in |
| **Framework** | React 18 + TypeScript 5.5 |
| **State** | Redux Toolkit |
| **Database** | Supabase (PostgreSQL) |
| **Real-time** | MQTT (HiveMQ cloud + local Mosquitto) |
| **Styling** | Tailwind CSS + design tokens |
| **Dev Server** | `npm run dev` in app directory |

---

## Architecture Overview

```
apps/
├── store-app/          # Main POS (Electron + React)
├── mango-pad/          # Customer iPad (Capacitor + React)
├── online-store/       # Customer booking (Next.js)
└── check-in/           # Walk-in kiosk (Capacitor + React)

packages/
├── mqtt/               # Shared MQTT client
└── ui/                 # Shared UI components
```

---

## Key Patterns

### Data Operations
- Always use `dataService` for data operations
- Never call Supabase directly from components
- Type adapters convert snake_case (DB) to camelCase (app)

### MQTT Communication
- Topic prefix: `salon/{salonId}/`
- QoS 0 for heartbeats, QoS 1 for transactions, QoS 2 for payments
- Cloud broker: `wss://broker.hivemq.com:8884/mqtt`

### State Management
- Use `@/store/hooks` for typed dispatch/selector
- Redux slices in `src/store/slices/`
- Async operations use Redux Toolkit thunks

### Styling
- Use Tailwind CSS classes
- Design tokens in `@/design-system`
- No inline styles or hardcoded colors

---

## Do

- Read `CLAUDE.md` for full project conventions
- Use existing components before creating new ones
- Run `npm run typecheck` before committing
- Follow existing patterns in each app

## Don't

- Create custom REST endpoints (use Supabase directly)
- Call Supabase/IndexedDB from components (use dataService)
- Use inline styles or hardcoded colors
- Skip TypeScript types

---

## Ralph Learnings

> Patterns discovered during autonomous development. Updated after each Ralph iteration.

<!-- Ralph will append learnings here -->
