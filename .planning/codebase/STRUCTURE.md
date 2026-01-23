# Directory Structure

## Root Layout

```
Mango-POS-Offline-V2/
├── apps/                    # Application packages
│   ├── store-app/           # Main POS application
│   ├── online-store/        # Customer booking website
│   ├── check-in/            # Client self check-in kiosk
│   ├── mango-pad/           # Tablet app for signatures
│   └── control-center/      # Admin dashboard
├── packages/                # Shared packages
│   ├── supabase/            # Supabase client & types
│   ├── database/            # Dexie.js IndexedDB wrapper
│   ├── mqtt/                # MQTT messaging
│   ├── types/               # Shared TypeScript types
│   ├── ui/                  # Shared UI components
│   ├── utils/               # Utility functions
│   ├── design-system/       # Design tokens
│   ├── api-client/          # REST client abstraction
│   ├── api-contracts/       # Zod schemas
│   └── sqlite-adapter/      # Multi-platform SQLite
├── backend/                 # Backend services (if any)
├── electron/                # Electron main/preload
├── docs/                    # Documentation
├── tasks/                   # PRDs and planning docs
├── e2e/                     # E2E test specs
├── tooling/                 # Shared configs
│   └── tsconfig/            # TypeScript configs
└── coverage/                # Test coverage reports
```

## App Structure (store-app example)

```
apps/store-app/
├── src/
│   ├── main.tsx             # Entry point
│   ├── App.tsx              # Root component
│   ├── components/          # UI components
│   │   ├── Book/            # Booking module (calendar, appointments)
│   │   ├── FrontDesk/       # Front desk module
│   │   ├── Checkout/        # Checkout/POS module
│   │   ├── Clients/         # Client management
│   │   ├── Staff/           # Staff management
│   │   ├── Settings/        # App settings
│   │   ├── shared/          # Shared components
│   │   └── layout/          # Layout components
│   ├── store/               # Redux store
│   │   ├── index.ts         # Store configuration
│   │   ├── slices/          # Redux slices
│   │   │   ├── appointmentSlice.ts
│   │   │   ├── clientSlice.ts
│   │   │   ├── staffSlice.ts
│   │   │   └── ...
│   │   └── middleware/      # Custom middleware
│   ├── services/            # Business logic
│   │   ├── dataService.ts   # Data access layer
│   │   ├── syncService.ts   # Offline sync
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # App-specific utilities
│   ├── types/               # App-specific types
│   ├── testing/             # Test setup & utilities
│   │   └── setup.ts         # Vitest setup
│   └── assets/              # Static assets
├── public/                  # Public assets
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript config
├── package.json             # Dependencies
└── playwright.config.ts     # E2E config
```

## Package Structure (types example)

```
packages/types/
├── src/
│   ├── index.ts             # Barrel export
│   ├── common.ts            # Common types
│   ├── appointment.ts       # Appointment types
│   ├── client.ts            # Client types
│   ├── staff.ts             # Staff types
│   ├── ticket.ts            # Ticket/transaction types
│   ├── service.ts           # Service catalog types
│   ├── catalog.ts           # Menu/catalog types
│   └── ...
├── package.json
└── tsconfig.json
```

## Key File Locations

### Configuration
| File | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | Workspace packages |
| `turbo.json` | Build pipeline |
| `package.json` (root) | Scripts, workspace config |
| `.env` | Environment variables |
| `electron.vite.config.ts` | Electron build |
| `capacitor.config.ts` | Mobile config |

### Entry Points
| File | Purpose |
|------|---------|
| `apps/*/src/main.tsx` | React app entry |
| `electron/main/index.ts` | Electron main process |
| `electron/preload/index.ts` | Electron preload |

### State Management
| File | Purpose |
|------|---------|
| `apps/*/src/store/index.ts` | Redux store setup |
| `apps/*/src/store/slices/*.ts` | Feature slices |

### Services
| File | Purpose |
|------|---------|
| `apps/*/src/services/dataService.ts` | Data access |
| `packages/supabase/src/client.ts` | Supabase client |
| `packages/database/src/db.ts` | Dexie database |

## Naming Conventions

### Files
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `AppointmentCard.tsx` |
| Hooks | camelCase, use prefix | `useAppointments.ts` |
| Utils | camelCase | `dateUtils.ts` |
| Types | camelCase | `appointment.ts` |
| Tests | `.test.ts(x)` suffix | `AppointmentCard.test.tsx` |
| Slices | camelCase, Slice suffix | `appointmentSlice.ts` |

### Directories
| Type | Convention | Example |
|------|------------|---------|
| Feature modules | PascalCase | `Book/`, `FrontDesk/` |
| Utility folders | lowercase | `hooks/`, `utils/` |
| Test folders | `__tests__` | `__tests__/` |

### Code
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `AppointmentCard` |
| Functions | camelCase | `getAppointments` |
| Constants | SCREAMING_SNAKE | `MAX_APPOINTMENTS` |
| Types/Interfaces | PascalCase | `Appointment` |
| Database columns | snake_case | `client_id` |

## Module Size Guidelines

| Type | Target Lines | Max Lines |
|------|--------------|-----------|
| Components | <300 | 500 |
| Redux slices | <400 | 600 |
| Hooks | <150 | 250 |
| Utils | <100 | 150 |
| Test files | <400 | - |

## Import Order

```typescript
// 1. React
import React, { useState, useEffect } from 'react'

// 2. External libraries
import { useSelector } from 'react-redux'
import { format } from 'date-fns'

// 3. Store/hooks
import { useAppDispatch } from '@/store'
import { useAppointments } from '@/hooks/useAppointments'

// 4. Components
import { Button } from '@/components/shared/Button'
import { Modal } from '@mango/ui'

// 5. Utils/types
import { formatTime } from '@/utils/dateUtils'
import type { Appointment } from '@mango/types'

// 6. Local/relative
import { AppointmentCard } from './AppointmentCard'
import styles from './styles.module.css'
```
