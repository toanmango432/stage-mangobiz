# Check-In App Architecture

> Comprehensive architecture documentation for the Mango Check-In kiosk application.

## Overview

The Check-In App is a self-service kiosk application that allows salon and spa clients to check in for walk-in services. It operates on tablets (7-10 inch screens) and supports offline mode for reliability.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Check-In App Architecture                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────┐    ┌────────────────┐    ┌──────────────────────────┐   │
│  │  React Pages  │───▶│  Redux Store   │───▶│  DataService (facade)    │   │
│  │               │    │                │    │                          │   │
│  │  - Welcome    │    │  - checkin     │    │  ┌──────────┐ ┌────────┐ │   │
│  │  - Verify     │    │  - client      │    │  │ Supabase │ │IndexedDB│ │   │
│  │  - Signup     │    │  - services    │    │  │ (online) │ │(offline)│ │   │
│  │  - Services   │    │  - technicians │    │  └──────────┘ └────────┘ │   │
│  │  - Technician │    │  - auth/ui     │    └──────────────────────────┘   │
│  │  - Confirm    │    │  - sync        │                                   │
│  │  - Success    │    │  - admin       │    ┌──────────────────────────┐   │
│  └───────────────┘    │  - accessibility│───▶│  MQTT Provider           │   │
│                       └────────────────┘    │  (real-time updates)     │   │
│                                             └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **UI Framework** | React 18 + TypeScript | Component-based UI |
| **State Management** | Redux Toolkit | Centralized state |
| **Cloud Database** | Supabase (PostgreSQL) | Persistent storage |
| **Local Database** | Dexie.js (IndexedDB) | Offline support |
| **Real-time** | MQTT | Staff/queue updates |
| **UI Components** | Tailwind CSS + Radix UI | Styling and accessibility |
| **Forms** | React Hook Form + Zod | Validation |
| **Build Tool** | Vite | Fast builds |
| **Testing** | Vitest + Playwright | Unit/E2E tests |

## Directory Structure

```
src/
├── components/              # Reusable UI components
│   ├── AccessibilityButton/ # Accessibility menu toggle
│   ├── AccessibilityMenu/   # Large text, high contrast settings
│   ├── AdminModeBar/        # Staff admin mode indicator
│   ├── AdminPinModal/       # PIN entry for admin mode
│   ├── ErrorBoundary/       # React error boundary
│   ├── HelpButton/          # Request staff assistance
│   ├── OfflineBanner/       # Offline/sync status indicator
│   └── UpsellCard/          # Service upsell suggestions
│
├── pages/                   # Screen components (routes)
│   ├── WelcomeScreen.tsx    # Initial screen with phone keypad
│   ├── VerifyPage.tsx       # Client lookup/verification
│   ├── SignupPage.tsx       # New client registration
│   ├── ServicesPage.tsx     # Service selection catalog
│   ├── TechnicianPage.tsx   # Technician preference
│   ├── GuestsPage.tsx       # Guest addition
│   ├── ConfirmPage.tsx      # Review and confirm
│   ├── SuccessPage.tsx      # Queue status/waiting screen
│   ├── QrScanPage.tsx       # Appointment QR scanner
│   └── AppointmentConfirmPage.tsx # Confirm scheduled appointment
│
├── store/                   # Redux state management
│   ├── index.ts             # Store configuration
│   ├── hooks.ts             # Typed dispatch/selector hooks
│   └── slices/              # State slices
│       ├── checkinSlice.ts  # Check-in flow state
│       ├── clientSlice.ts   # Client data and lookup
│       ├── servicesSlice.ts # Service catalog
│       ├── technicianSlice.ts # Staff data
│       ├── appointmentSlice.ts # Appointment data
│       ├── authSlice.ts     # Store/device auth
│       ├── uiSlice.ts       # Loading/error states
│       ├── syncSlice.ts     # Offline sync status
│       ├── adminSlice.ts    # Admin mode state
│       └── accessibilitySlice.ts # Accessibility settings
│
├── services/                # Data access layer
│   ├── dataService.ts       # Unified data facade
│   ├── analyticsService.ts  # Event tracking
│   ├── smsService.ts        # SMS notifications
│   ├── supabase/            # Supabase client
│   │   └── client.ts
│   └── db/                  # IndexedDB (Dexie)
│       └── database.ts
│
├── providers/               # React context providers
│   ├── MqttProvider.tsx     # MQTT connection
│   └── AccessibilityProvider.tsx # Accessibility CSS classes
│
├── hooks/                   # Custom React hooks
│   ├── useAccessibility.ts  # Accessibility state
│   ├── useAnalytics.ts      # Analytics tracking
│   ├── useCalledMqtt.ts     # MQTT: client called
│   ├── useQueueMqtt.ts      # MQTT: queue updates
│   ├── useTechnicianMqtt.ts # MQTT: staff status
│   └── useOfflineSync.ts    # Offline sync handling
│
├── types/                   # TypeScript interfaces
│   ├── index.ts             # Core types
│   └── checkin-config.ts    # Configuration types
│
├── utils/                   # Utility functions
│   ├── index.ts             # General utilities
│   └── security.ts          # Security utilities
│
├── constants/               # Static configuration
│   └── index.ts
│
├── design-system/           # Design tokens
│
└── testing/                 # Test utilities
    └── setup.ts
```

## Data Flow

### 1. Component → Redux → DataService Pattern

```
┌──────────────┐     dispatch     ┌──────────────┐     call      ┌─────────────┐
│  Component   │─────────────────▶│ Redux Thunk  │──────────────▶│ dataService │
└──────────────┘                  └──────────────┘               └─────────────┘
       ▲                                 │                             │
       │                                 ▼                             ▼
       │                          ┌──────────────┐           ┌─────────────────┐
       │                          │ Redux State  │           │ Supabase/IndexedDB│
       │                          └──────────────┘           └─────────────────┘
       │                                 │
       └─────────────useSelector─────────┘
```

### 2. MQTT Real-time Updates

```
┌─────────────────┐    message    ┌─────────────────┐   dispatch   ┌─────────────┐
│  MQTT Broker    │──────────────▶│  useMqtt Hook   │─────────────▶│ Redux Store │
└─────────────────┘               └─────────────────┘              └─────────────┘
                                                                          │
                                                                          ▼
                                                                   ┌──────────────┐
                                                                   │  Component   │
                                                                   │  re-renders  │
                                                                   └──────────────┘
```

### 3. Offline Sync Flow

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ONLINE                                                                   │
│  Component → Redux → dataService → Supabase (write) + IndexedDB (cache)   │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│  OFFLINE                                                                  │
│  Component → Redux → dataService → IndexedDB (write) + SyncQueue          │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│  RECONNECTION                                                             │
│  useOfflineSync → dataService.sync.processQueue() → Supabase              │
└───────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### DataService

The `dataService` is the single source of truth for all data operations:

```typescript
dataService.clients.getByPhone(phone)   // Lookup client
dataService.clients.create(input)       // Register new client
dataService.services.getAll()           // Get service catalog
dataService.services.getByCategory()    // Get services grouped
dataService.technicians.getAll()        // Get staff list
dataService.checkins.create(params)     // Create check-in
dataService.sync.processQueue()         // Sync offline data
dataService.upsells.getForServices(ids) // Get upsell suggestions
```

### Redux Slices

| Slice | Purpose | Key State |
|-------|---------|-----------|
| `checkinSlice` | Check-in flow | selectedServices, guests, technicianPreference, lastCheckIn |
| `clientSlice` | Client data | currentClient, lookupStatus |
| `servicesSlice` | Service catalog | categories, loading |
| `technicianSlice` | Staff data | technicians, loading |
| `syncSlice` | Sync status | isOnline, pendingCount, status |
| `authSlice` | Authentication | storeId, deviceId, store |
| `uiSlice` | UI state | currentStep, isLoading, error |
| `adminSlice` | Admin mode | isAdminModeActive, isHelpRequested |
| `accessibilitySlice` | A11y settings | largeText, reducedMotion, highContrast |

### MQTT Topics

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `salon/{id}/checkin/new` | App → Store | New check-in created |
| `salon/{id}/checkin/called` | Store → App | Client called from queue |
| `salon/{id}/queue/status` | Store → App | Queue position updates |
| `salon/{id}/staff/status` | Store → App | Staff availability |
| `salon/{id}/help/request` | App → Store | Staff assistance requested |

## User Flow

```
┌─────────┐    ┌────────┐    ┌──────────┐    ┌───────────┐    ┌───────────┐
│ Welcome │───▶│ Verify │───▶│ Services │───▶│Technician │───▶│  Confirm  │
└─────────┘    └────────┘    └──────────┘    └───────────┘    └───────────┘
     │              │                              │                 │
     │              ▼                              ▼                 ▼
     │         ┌────────┐                    ┌──────────┐      ┌─────────┐
     │         │ Signup │                    │  Guests  │      │ Success │
     │         │ (new)  │                    │(optional)│      │ (queue) │
     │         └────────┘                    └──────────┘      └─────────┘
     │
     ▼
┌──────────┐
│ QR Scan  │──▶ AppointmentConfirm
└──────────┘
```

## Security Features

1. **Input Sanitization** - All inputs sanitized via `security.ts`
2. **Rate Limiting** - Limits on phone lookups, registrations, check-ins
3. **Admin PIN** - 4-digit PIN for staff admin mode
4. **Data Validation** - Zod schemas for form validation
5. **RLS Policies** - Supabase Row Level Security

## Accessibility Features

1. **Touch Targets** - Minimum 44x44px
2. **Color Contrast** - WCAG 2.1 AA (4.5:1 ratio)
3. **Large Text Mode** - Increases font sizes
4. **Reduced Motion** - Disables animations
5. **High Contrast** - Enhanced contrast mode
6. **Screen Reader** - ARIA labels throughout
7. **Keyboard Navigation** - Full keyboard support

## Performance Optimizations

1. **Code Splitting** - React.lazy() for route-based splitting
2. **Vendor Chunking** - Separate chunks for React, Redux, forms, etc.
3. **IndexedDB Caching** - Services/technicians cached locally
4. **Lazy Loading** - QR scanner only loaded when needed
5. **Bundle Size** - ~91KB gzipped initial load

---

*Last updated: January 2026*
