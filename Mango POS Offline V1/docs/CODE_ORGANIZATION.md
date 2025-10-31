# 📁 Code Organization Guide

Complete guide for organizing code in Mango POS Offline V1.

---

## 🎯 Organization Principles

1. **Feature-Based** - Code organized by feature/domain
2. **Clear Separation** - Features, shared, and core are separate
3. **Self-Contained** - Features include their components, hooks, store, types
4. **Reusable** - Shared code goes in `shared/`
5. **Core Systems** - Infrastructure goes in `core/`

---

## 📂 Directory Structure

```
client/
├── src/
│   ├── features/              # Feature modules (domain-driven)
│   │   ├── appointments/
│   │   │   ├── components/     # Feature-specific components
│   │   │   ├── hooks/          # Feature-specific hooks
│   │   │   ├── store/          # Redux slice for this feature
│   │   │   ├── types.ts        # Feature-specific types
│   │   │   ├── utils.ts        # Feature-specific utilities
│   │   │   ├── index.ts        # Public exports
│   │   │   └── README.md       # Feature documentation
│   │   │
│   │   ├── tickets/
│   │   ├── staff/
│   │   ├── clients/
│   │   ├── transactions/
│   │   ├── auth/
│   │   ├── sync/
│   │   ├── book/
│   │   └── checkout/
│   │
│   ├── shared/                 # Shared/reusable code
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Button/
│   │   │   ├── Modal/
│   │   │   ├── Card/
│   │   │   └── ...
│   │   │
│   │   ├── hooks/              # Reusable React hooks
│   │   │   ├── useDebounce.ts
│   │   │   ├── useSync.ts
│   │   │   └── ...
│   │   │
│   │   ├── utils/              # Utility functions
│   │   │   ├── dateUtils.ts
│   │   │   ├── formatUtils.ts
│   │   │   └── ...
│   │   │
│   │   ├── types/              # Shared TypeScript types
│   │   │   ├── common.ts
│   │   │   ├── index.ts
│   │   │   └── ...
│   │   │
│   │   ├── constants/           # App constants
│   │   │   ├── designSystem.ts
│   │   │   └── ...
│   │   │
│   │   └── services/           # Shared services
│   │       └── ...
│   │
│   ├── core/                   # Core systems/infrastructure
│   │   ├── store/              # Redux store configuration
│   │   │   ├── index.ts        # Store setup
│   │   │   └── hooks.ts        # Typed hooks
│   │   │
│   │   ├── db/                 # IndexedDB setup
│   │   │   ├── schema.ts       # Dexie schema
│   │   │   ├── database.ts     # Database helpers
│   │   │   └── seed.ts         # Seed data
│   │   │
│   │   ├── api/                # API client
│   │   │   ├── client.ts       # Axios instance
│   │   │   ├── endpoints.ts   # API functions
│   │   │   └── socket.ts        # Socket.io client
│   │   │
│   │   └── config/             # App configuration
│   │       └── app.config.ts
│   │
│   ├── App.tsx                 # Root component
│   └── main.tsx                # Entry point
│
├── public/                     # Static assets
├── tests/                      # Test files
├── .env                        # Environment variables
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 🔄 Code Migration Map

### Existing Code → New Structure

#### Redux Slices (`src/store/slices/` → `features/*/store/`)

```
Old: src/store/slices/appointmentsSlice.ts
New: client/src/features/appointments/store/appointmentsSlice.ts

Old: src/store/slices/ticketsSlice.ts
New: client/src/features/tickets/store/ticketsSlice.ts

Old: src/store/slices/staffSlice.ts
New: client/src/features/staff/store/staffSlice.ts

Old: src/store/slices/clientsSlice.ts
New: client/src/features/clients/store/clientsSlice.ts

Old: src/store/slices/transactionsSlice.ts
New: client/src/features/transactions/store/transactionsSlice.ts

Old: src/store/slices/authSlice.ts
New: client/src/features/auth/store/authSlice.ts

Old: src/store/slices/syncSlice.ts
New: client/src/features/sync/store/syncSlice.ts

Old: src/store/slices/uiSlice.ts
New: client/src/shared/store/uiSlice.ts (shared state)

Old: src/store/slices/uiTicketsSlice.ts
New: client/src/features/tickets/store/uiSlice.ts (feature UI state)

Old: src/store/slices/uiStaffSlice.ts
New: client/src/features/staff/store/uiSlice.ts (feature UI state)
```

#### Components (`src/components/` → `features/*/components/` or `shared/components/`)

```
Old: src/components/Book/*
New: client/src/features/book/components/*

Old: src/components/TurnTracker/*
New: client/src/features/tickets/components/TurnTracker/*

Old: src/components/StaffManagement/*
New: client/src/features/staff/components/StaffManagement/*

Old: src/components/checkout/*
New: client/src/features/checkout/components/*

Old: src/components/calendar/*
New: client/src/features/appointments/components/Calendar/*

# Shared components (reusable across features)
Old: src/components/ServiceCard.tsx
New: client/src/shared/components/ServiceCard/ServiceCard.tsx

Old: src/components/StaffCard.tsx
New: client/src/shared/components/StaffCard/StaffCard.tsx

Old: src/components/TicketActions.tsx
New: client/src/shared/components/TicketActions/TicketActions.tsx

Old: src/components/Modal/* (if generic)
New: client/src/shared/components/Modal/*
```

#### Database (`src/db/` → `core/db/`)

```
Old: src/db/schema.ts
New: client/src/core/db/schema.ts

Old: src/db/database.ts
New: client/src/core/db/database.ts

Old: src/db/seed.ts
New: client/src/core/db/seed.ts

Old: src/db/hooks.ts
New: client/src/core/db/hooks.ts
```

#### API (`src/api/` → `core/api/`)

```
Old: src/api/client.ts
New: client/src/core/api/client.ts

Old: src/api/endpoints.ts
New: client/src/core/api/endpoints.ts

Old: src/api/socket.ts
New: client/src/core/api/socket.ts
```

#### Services (`src/services/` → `core/services/` or `shared/services/`)

```
Old: src/services/syncManager.ts
New: client/src/core/services/syncManager.ts

Old: src/services/syncService.ts
New: client/src/core/services/syncService.ts

Old: src/services/appointmentService.ts
New: client/src/features/appointments/services/appointmentService.ts

Old: src/services/db.ts (if exists)
New: client/src/core/db/database.ts
```

#### Types (`src/types/` → `features/*/types.ts` or `shared/types/`)

```
# Feature-specific types
Old: src/types/Ticket.ts
New: client/src/features/tickets/types.ts

Old: src/types/appointment.ts
New: client/src/features/appointments/types.ts

Old: src/types/staff.ts
New: client/src/features/staff/types.ts

Old: src/types/client.ts
New: client/src/features/clients/types.ts

Old: src/types/transaction.ts
New: client/src/features/transactions/types.ts

# Shared types
Old: src/types/common.ts
New: client/src/shared/types/common.ts

Old: src/types/sync.ts
New: client/src/shared/types/sync.ts

Old: src/types/service.ts
New: client/src/shared/types/service.ts

Old: src/types/index.ts
New: client/src/shared/types/index.ts
```

#### Hooks (`src/hooks/` → `features/*/hooks/` or `shared/hooks/`)

```
# Shared hooks
Old: src/hooks/useDebounce.ts
New: client/src/shared/hooks/useDebounce.ts

Old: src/hooks/useSync.ts
New: client/src/shared/hooks/useSync.ts

Old: src/hooks/redux.ts
New: client/src/core/store/hooks.ts (move to core)

# Feature-specific hooks
Old: src/hooks/useAppointmentCalendar.ts
New: client/src/features/appointments/hooks/useAppointmentCalendar.ts

Old: src/hooks/useTicketsCompat.ts
New: client/src/features/tickets/hooks/useTickets.ts
```

#### Constants (`src/constants/` → `shared/constants/`)

```
Old: src/constants/designSystem.ts
New: client/src/shared/constants/designSystem.ts

Old: src/constants/appointment.ts
New: client/src/shared/constants/appointment.ts
```

#### Pages/Modules (`src/components/modules/` → `features/*/`)

```
Old: src/components/modules/Book.tsx
New: client/src/features/book/Book.tsx

Old: src/components/modules/FrontDesk.tsx
New: client/src/features/frontdesk/FrontDesk.tsx

Old: src/components/modules/Tickets.tsx
New: client/src/features/tickets/Tickets.tsx

Old: src/components/modules/Team.tsx
New: client/src/features/staff/Team.tsx

Old: src/components/modules/Checkout.tsx
New: client/src/features/checkout/Checkout.tsx

Old: src/components/modules/Transactions.tsx
New: client/src/features/transactions/Transactions.tsx

Old: src/components/modules/Pending.tsx
New: client/src/features/tickets/components/PendingTickets.tsx

Old: src/components/modules/More.tsx
New: client/src/features/settings/More.tsx
```

#### Layout (`src/components/layout/` → `shared/components/layout/`)

```
Old: src/components/layout/AppShell.tsx
New: client/src/shared/components/layout/AppShell.tsx

Old: src/components/layout/TopHeaderBar.tsx
New: client/src/shared/components/layout/TopHeaderBar.tsx

Old: src/components/layout/BottomNavBar.tsx
New: client/src/shared/components/layout/BottomNavBar.tsx
```

---

## 📝 Feature Structure Template

Each feature should follow this structure:

```
features/[feature-name]/
├── components/              # Feature components
│   ├── [ComponentName].tsx
│   └── index.ts
│
├── hooks/                   # Feature hooks
│   ├── use[Feature]Hook.ts
│   └── index.ts
│
├── store/                   # Redux slice
│   ├── [feature]Slice.ts
│   └── index.ts
│
├── services/                # Feature services (optional)
│   └── [feature]Service.ts
│
├── types.ts                 # Feature types
├── constants.ts             # Feature constants (optional)
├── utils.ts                 # Feature utilities (optional)
├── index.ts                 # Public exports
└── README.md                # Feature documentation
```

### Example: Appointments Feature

```
features/appointments/
├── components/
│   ├── AppointmentCard/
│   │   ├── AppointmentCard.tsx
│   │   └── index.ts
│   ├── AppointmentList/
│   │   ├── AppointmentList.tsx
│   │   └── index.ts
│   ├── AppointmentForm/
│   │   ├── AppointmentForm.tsx
│   │   └── index.ts
│   └── index.ts
│
├── hooks/
│   ├── useAppointments.ts
│   ├── useAppointmentCalendar.ts
│   └── index.ts
│
├── store/
│   ├── appointmentsSlice.ts
│   └── index.ts
│
├── types.ts
├── index.ts
└── README.md
```

---

## 🎯 Import Guidelines

### Within Feature

```typescript
// Import from same feature
import { AppointmentCard } from './components';
import { useAppointments } from './hooks';
import type { Appointment } from './types';
```

### From Shared

```typescript
// Import shared components
import { Button, Modal } from '@/shared/components';
import { useDebounce } from '@/shared/hooks';
import type { CommonType } from '@/shared/types';
```

### From Core

```typescript
// Import core systems
import { store } from '@/core/store';
import { appointmentsDB } from '@/core/db';
import { appointmentsAPI } from '@/core/api';
```

### From Other Features

```typescript
// Import from other features (use sparingly)
import { StaffCard } from '@/features/staff/components';
import type { Staff } from '@/features/staff/types';
```

---

## ✅ Migration Checklist

When migrating a feature:

- [ ] Create feature directory structure
- [ ] Move Redux slice to `features/[feature]/store/`
- [ ] Move components to `features/[feature]/components/`
- [ ] Move hooks to `features/[feature]/hooks/`
- [ ] Move types to `features/[feature]/types.ts`
- [ ] Move services to `features/[feature]/services/` or `shared/services/`
- [ ] Update all imports
- [ ] Update feature exports in `index.ts`
- [ ] Update root store to include feature reducer
- [ ] Write feature README.md
- [ ] Test feature functionality
- [ ] Update routing (if needed)

---

## 📚 Additional Notes

### Shared vs Feature Code

**Put in `shared/` if:**
- Used by multiple features
- Generic/reusable
- Core UI components (Button, Modal, Card)

**Put in `features/[feature]/` if:**
- Specific to one feature
- Domain-specific logic
- Feature-specific UI

### Core vs Shared Code

**Put in `core/` if:**
- Infrastructure/system-level
- Database setup
- API client
- Store configuration

**Put in `shared/` if:**
- Reusable across features
- Common utilities
- Shared types

---

**Follow this structure for maintainable, scalable code! 🎉**

