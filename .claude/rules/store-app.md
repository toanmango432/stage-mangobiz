---
paths: apps/store-app/**/*
---

# Store App Rules

The **Store App** is the main POS application used by salon staff on desktop (Electron).

## Overview

- **Platform**: Electron + React
- **Purpose**: Main point-of-sale, appointment management, checkout
- **Runs**: Local Mosquitto MQTT broker for device communication
- **State**: Redux Toolkit for all state management

## Key Modules

| Module | Location | Purpose |
|--------|----------|---------|
| Book | `src/components/Book/` | Appointment calendar & booking |
| Front Desk | `src/components/frontdesk/` | Walk-in management, staff sidebar |
| Checkout | `src/components/checkout/` | Payment processing |
| Tickets | `src/components/tickets/` | Service ticket management |

## Data Flow

```
Component → Redux Thunk → dataService → Supabase/IndexedDB
```

- Always use `dataService` for data operations
- Never call Supabase or IndexedDB directly from components
- Use type adapters to convert between snake_case (DB) and camelCase (app)

## MQTT Integration

Store App hosts the local MQTT broker. Other devices connect to it:

```
Check-In App  ──┐
Mango Pad     ──┼──→ Store App (Mosquitto) ──→ Cloud Broker (fallback)
Online Store  ──┘
```

## Styling

- Use design tokens from `@/design-system`
- Module-specific tokens: `@/design-system/modules/book`, etc.
- Never use hardcoded colors

## Before Making Changes

1. Read relevant PRD in `docs/product/`
2. Check existing patterns in similar components
3. Verify TypeScript interfaces in `src/types/`
4. Follow file size guidelines (<500 lines per file)
