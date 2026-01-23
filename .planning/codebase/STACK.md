# Technology Stack

## Runtime & Core

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| pnpm | 9+ | Package manager (workspaces) |
| TypeScript | 5.5.4 | Type safety |
| React | 18.3.1 | UI framework |
| Vite | 5.4-6.x | Build tool |

## Monorepo Structure

**Build Orchestration:** Turborepo 2.5.4

### Apps (5)

| App | Port | Description |
|-----|------|-------------|
| `@mango/store-app` | 5173 | Main POS application (React + Electron) |
| `@mango/online-store` | 5174 | Customer booking website |
| `@mango/check-in` | 5175 | Client kiosk for self check-in |
| `@mango/mango-pad` | 5176 | Tablet app for staff/signatures |
| `@mango/control-center` | 5177 | Admin dashboard |

### Packages (10)

| Package | Purpose |
|---------|---------|
| `@mango/supabase` | Database client & RLS policies |
| `@mango/database` | Dexie.js IndexedDB wrapper |
| `@mango/mqtt` | Real-time messaging (local + cloud) |
| `@mango/types` | Shared TypeScript definitions |
| `@mango/ui` | Shared UI components |
| `@mango/utils` | Utility functions |
| `@mango/design-system` | Design tokens & theming |
| `@mango/api-client` | REST client abstraction |
| `@mango/api-contracts` | API schema contracts (Zod) |
| `@mango/sqlite-adapter` | Multi-platform SQLite adapter |

## State Management

| Library | Version | Usage |
|---------|---------|-------|
| Redux Toolkit | 2.11.2 | Global state |
| React Redux | 9.2.0 | React bindings |
| React Hook Form | 7.70.0 | Form state |
| Zod | 3.23.8 / 4.3.5 | Schema validation |

## Database & Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase (PostgreSQL) | 2.49.4-2.90.1 | Cloud database with RLS |
| Dexie.js | 4.0.11-4.2.1 | IndexedDB for offline |
| better-sqlite3 | 9.0.0 | Electron local storage |
| @capacitor-community/sqlite | 5.0.0 | Mobile SQLite |
| wa-sqlite | 1.0.0 | WebAssembly SQLite |

## Real-time Communication

| Technology | Version | Purpose |
|------------|---------|---------|
| MQTT | 5.3.0-5.14.1 | Inter-device messaging |
| Socket.io | 4.8.1 | Fallback signaling |
| Mosquitto | - | Local MQTT broker |

**Dual-broker architecture:**
- Local Mosquitto broker for LAN communication
- Cloud MQTT (HiveMQ/EMQX) for remote sync

## UI & Styling

| Library | Version | Purpose |
|---------|---------|---------|
| TailwindCSS | 3.4.17 | Utility-first CSS |
| Radix UI | 1.1+ | Accessible components |
| Lucide React | 0.462.0 | Icons |
| Framer Motion | 11.18-12.23 | Animations |
| clsx + tailwind-merge | - | Class utilities |

## Mobile & Desktop

| Technology | Version | Purpose |
|------------|---------|---------|
| Capacitor | 6.2.0 | iOS/Android bridge |
| Electron | 35.1.5 | Desktop app shell |
| electron-vite | 5.0 | Electron build tool |

### Capacitor Plugins
- `@capacitor/core`, `@capacitor/app`
- `@capacitor/haptics`, `@capacitor/keyboard`
- `@capacitor-community/sqlite`

## Testing

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 1.3.1-4.0.16 | Unit/integration tests |
| Playwright | 1.56-1.57 | E2E testing |
| Testing Library | 14.2-16.3 | Component testing |
| jsdom | 24.0-27.4 | DOM simulation |

## Build & Deploy

| Tool | Purpose |
|------|---------|
| Docker | Multi-stage Nginx builds |
| docker-compose | Dev/prod profiles |
| Electron Builder | Desktop packaging |
| Capacitor CLI | Mobile deployment |
| Vercel | Web hosting |

## Configuration Files

| File | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | Workspace definition |
| `turbo.json` | Build pipeline |
| `tsconfig.json` | TypeScript config |
| `electron.vite.config.ts` | Electron build |
| `capacitor.config.ts` | Mobile config |
| `.env` | Environment variables |
