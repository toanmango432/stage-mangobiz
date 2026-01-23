# External Integrations

## Cloud Services

### Supabase (Primary Backend)

**URL:** `https://cpaldkcvdcdyzytosntc.supabase.co`

| Feature | Usage |
|---------|-------|
| PostgreSQL | Primary cloud database |
| Row Level Security | Multi-tenant data isolation |
| Auth | User authentication |
| Realtime | Change subscriptions |
| Storage | File uploads |

**Environment Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### MQTT Messaging

**Architecture:** Dual-broker for resilience

| Broker | Purpose |
|--------|---------|
| Local Mosquitto | LAN communication (fast, offline-capable) |
| Cloud (HiveMQ/EMQX) | Remote sync, fallback |

**Topics:**
- `mango/{store_id}/appointments` - Appointment updates
- `mango/{store_id}/tickets` - Ticket changes
- `mango/{store_id}/sync` - Sync coordination

## Payment Processing

### Fiserv CommerceHub TTP

**Purpose:** Tap to Pay on iPhone/Android

| Component | Description |
|-----------|-------------|
| Native Plugin | `FiservPaymentPlugin` (Capacitor) |
| SDK | CommerceHub TTP SDK |
| Flow | POS → Native → Fiserv → Response |

**Transaction Types:**
- Card present (tap)
- Refunds
- Voids

## AI Services

### Google AI SDK

**Package:** `@ai-sdk/google` (v2.0.23)
**Used in:** Online Store app
**Purpose:** AI-powered booking assistance

### Anthropic API

**Variable:** `VITE_ANTHROPIC_API_KEY`
**Purpose:** AI features (likely assistant/chat)

## Monitoring & Analytics

### Sentry

**Package:** `@sentry/react` (v10.32.1)
**Used in:** Store App only
**Purpose:** Error tracking, performance monitoring

**Configuration:**
- DSN in environment variables
- Source maps uploaded on build
- Session replay for debugging

## Authentication

### Supabase Auth

**Methods:**
- Email/password
- Magic links
- OAuth (configurable)

### WebAuthn / Biometrics

**Implementation:** `webAuthnService.ts`

| Platform | Method |
|----------|--------|
| iOS | Face ID / Touch ID |
| Android | Fingerprint / Face |
| Desktop | Platform authenticator |

**Flow:**
1. Register credential on first login
2. Store credential ID locally
3. Authenticate with biometric on subsequent visits

## Hardware Integrations

### Receipt Printers

**Protocol:** ESC/POS over:
- USB (Electron)
- Bluetooth (Capacitor)
- Network (TCP/IP)

**Supported:** Star, Epson compatible

### Card Readers

**Integration:** Via Fiserv TTP
**Hardware:** iPhone NFC, Android NFC

### Barcode Scanners

**Library:** `html5-qrcode` (v2.3.8)
**Used in:** Check-in, Mango Pad apps
**Purpose:** Client check-in via QR codes

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend Apps                          │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────────────┐  │
│  │Store App│  │Online    │  │Check-in │  │Control Center │  │
│  │         │  │Store     │  │         │  │               │  │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └───────┬───────┘  │
└───────┼────────────┼─────────────┼───────────────┼──────────┘
        │            │             │               │
        ▼            ▼             ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    @mango/api-client                         │
│                    (Unified REST client)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌───────────────────┐
│   Supabase    │  │  MQTT Broker   │  │   Fiserv TTP      │
│  (PostgreSQL) │  │ (Local/Cloud)  │  │   (Payments)      │
└───────────────┘  └────────────────┘  └───────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│                    Offline Storage Layer                       │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │ Dexie.js     │  │ better-sqlite3 │  │ Capacitor SQLite │   │
│  │ (IndexedDB)  │  │ (Electron)     │  │ (Mobile)         │   │
│  └──────────────┘  └────────────────┘  └──────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Internal APIs

| Endpoint Pattern | Purpose |
|-----------------|---------|
| `/api/appointments/*` | Appointment CRUD |
| `/api/clients/*` | Client management |
| `/api/tickets/*` | Ticket/transaction handling |
| `/api/staff/*` | Staff management |
| `/api/services/*` | Service catalog |

### External API Calls

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Supabase | `*.supabase.co/rest/v1/*` | Database operations |
| Supabase | `*.supabase.co/auth/v1/*` | Authentication |
| Fiserv | Native SDK calls | Payment processing |
| Google AI | AI SDK endpoints | AI features |
