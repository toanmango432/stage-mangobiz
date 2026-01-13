# Persistent Codebase Patterns

> Patterns accumulated across all Ralph runs. This file is never deleted - patterns persist across different PRDs/features.

---

## Monorepo Structure

- Main apps: `apps/store-app`, `apps/mango-pad`, `apps/checkin-app`, `apps/online-store`
- Shared packages: `packages/`
- Use `npm run typecheck` from app directories (each app has its own tsconfig)

## MQTT Communication

- Store App runs local Mosquitto broker
- Cloud broker at HiveMQ/EMQX for fallback
- Topic pattern: `salon/{salonId}/station/{stationId}/{resource}`
- Use QoS 1 for important messages, QoS 0 for heartbeats

## Redux & Data Flow

- All state management via Redux Toolkit
- Use `dataService` for data operations (routes to Supabase or IndexedDB)
- Never call Supabase or IndexedDB directly from components

## Styling

- Use design tokens from `src/design-system/`
- Tailwind CSS with Radix UI components
- Module-specific tokens: `src/design-system/modules/`

---

<!-- Ralph appends learnings below -->
