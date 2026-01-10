# AGENTS.md - Mango Check-In App

> AI agent instructions for the Mango Check-In self-service kiosk app.

---

## Quick Reference

| Item | Details |
|------|---------|
| **App Type** | Self-service walk-in check-in kiosk |
| **Framework** | React 18 + TypeScript + Vite |
| **State** | Redux Toolkit |
| **Cloud DB** | Supabase (via dataService) |
| **Local DB** | Dexie.js (IndexedDB) for offline |
| **Real-time** | MQTT for Store App communication |
| **UI** | Tailwind CSS + Radix UI |
| **Forms** | React Hook Form + Zod |
| **Platforms** | Web, iPad (Capacitor), Android (Capacitor) |
| **Dev Server** | `pnpm dev` |
| **Build** | `pnpm build` |
| **Test** | `pnpm test` |
| **PRD** | `docs/product/PRD-Check-In-App.md` |

---

## Architecture Overview

```
src/
├── pages/               # Screen components
│   ├── WelcomePage.tsx      # Phone input entry
│   ├── VerifyPage.tsx       # Client verification
│   ├── RegisterPage.tsx     # New client registration
│   ├── ServicesPage.tsx     # Service selection
│   ├── TechnicianPage.tsx   # Technician preference
│   ├── ConfirmPage.tsx      # Review and confirm
│   ├── WaitingPage.tsx      # Queue status display
│   └── CalledPage.tsx       # Client called notification
├── components/          # Reusable UI components
│   ├── PhoneKeypad.tsx
│   ├── ServiceCard.tsx
│   ├── TechnicianCard.tsx
│   └── QueueIndicator.tsx
├── store/
│   ├── index.ts             # Redux store config
│   └── slices/
│       ├── checkinSlice.ts  # Check-in flow state
│       ├── clientSlice.ts   # Client data
│       ├── authSlice.ts     # Auth context
│       ├── uiSlice.ts       # UI state
│       └── syncSlice.ts     # Offline sync status
├── services/
│   └── dataService.ts       # Data operations facade
├── providers/
│   └── MqttProvider.tsx     # MQTT connection context
├── hooks/
│   ├── useCheckin.ts        # Check-in flow helpers
│   └── useOffline.ts        # Offline detection
├── types/
│   └── index.ts             # TypeScript interfaces
├── utils/
│   ├── phoneFormatter.ts    # Phone number formatting
│   └── queueUtils.ts        # Queue calculations
└── design-system/           # Design tokens
```

---

## MQTT Topics

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `salon/{id}/checkin/new` | App → Store | New check-in created |
| `salon/{id}/checkin/update` | App → Store | Check-in updated |
| `salon/{id}/checkin/called` | Store → App | Client called from queue |
| `salon/{id}/queue/status` | Store → App | Queue position updates |
| `salon/{id}/staff/status` | Store → App | Staff availability |

---

## Key Types

```typescript
interface CheckIn {
  id: string;
  checkInNumber: string;        // "A001" format
  storeId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  services: CheckInService[];
  technicianPreference: 'anyone' | string;
  guests: CheckInGuest[];
  status: 'waiting' | 'in_service' | 'completed' | 'no_show';
  queuePosition: number;
  estimatedWaitMinutes: number;
  checkedInAt: string;
  syncStatus: 'synced' | 'pending';
}

interface CheckInService {
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number;
}

interface CheckInGuest {
  id: string;
  name: string;
  clientId?: string;
  services: CheckInService[];
  technicianPreference: 'anyone' | string;
}
```

---

## Data Flow Pattern

```
Component → Redux Thunk → dataService → Supabase/IndexedDB
                ↓
           Update Redux
                ↓
           Component re-renders
```

**Key Rule**: Never call Supabase or IndexedDB directly from components. Always use dataService.

---

## Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # Lint code

# Testing
pnpm test             # Run unit tests
pnpm test:coverage    # Run with coverage
pnpm test:e2e         # Run Playwright E2E tests

# Native (requires Capacitor setup)
npx cap sync          # Sync web build to native
npx cap open ios      # Open in Xcode
npx cap open android  # Open in Android Studio
```

---

## Do

- ✅ Use Redux for all state management
- ✅ Use dataService for all data operations
- ✅ Handle offline mode gracefully
- ✅ Use TypeScript interfaces for all data
- ✅ Large touch targets (44px minimum) for tablet use
- ✅ Use design tokens from design-system/
- ✅ Cache services and staff in IndexedDB for offline
- ✅ Publish check-in events to MQTT

## Don't

- ❌ Call Supabase directly from components
- ❌ Skip offline handling
- ❌ Use small fonts (minimum 18px body)
- ❌ Hardcode salon IDs
- ❌ Block UI during data operations
- ❌ Forget MQTT publish on check-in creation

---

## Codebase Patterns (Updated by Ralph)

> This section is updated by Ralph during autonomous builds.
> Add reusable patterns discovered during implementation.

### Testing (US-003)
- **Framework**: Vitest + @testing-library/react + @testing-library/user-event
- **Config**: `vitest.config.ts` at app root
- **Setup**: `src/testing/setup.ts` (mocks for Supabase, IndexedDB, window APIs)
- **Unit tests**: `*.test.ts` alongside source files
- **Integration tests**: `*.test.tsx` in same directory as components
- **Run**: `pnpm test` or `pnpm test:watch`

### Phone Formatting (US-003)
- Use `formatPhone()` from `src/utils/index.ts` for consistent (XXX) XXX-XXXX format
- Normalize to 10 digits before API calls: `phone.replace(/\D/g, '')`
- VerifyPage handles 4 states: loading, found, not_found, error

---

*Last updated: January 2026*
