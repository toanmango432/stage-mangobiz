# PRD: Device Pairing System (Store App ↔ Mango Pad)

## Introduction

Enable Mango Pad (iPad) devices to pair with specific checkout stations in Store App via cloud MQTT broker. Each checkout station can have its own dedicated Pad for customer-facing signature capture and tip selection. Pairing uses a code/QR system and persists until manually unpaired.

## Goals

- Allow pairing Mango Pad to a specific Store App checkout station
- Support both manual code entry and QR code scanning for pairing
- Persist pairing permanently until user unpairs
- Show real-time connection status on both devices
- Support multiple Pads per store (one per checkout station)
- Use cloud MQTT broker for real-time communication during pairing

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│                                                                  │
│  salon_devices table:                                           │
│  - Store App stations (is_station: true)                        │
│  - Mango Pads (device_type: 'mango-pad')                        │
│  - Pairing relationship (paired_to_device_id)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      STORE APP          │     │      MANGO PAD          │
│                         │     │                         │
│  Station: "Front Desk"  │     │  Paired to: Front Desk  │
│  Pairing Code: A7X-92K  │◄───►│  Status: Connected      │
│  Connected Pad: iPad-1  │     │                         │
│                         │     │                         │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              └───────────┬───────────────────┘
                          ▼
              ┌─────────────────────────┐
              │   MQTT Cloud Broker     │
              │   (HiveMQ)              │
              └─────────────────────────┘
```

## User Stories

### US-001: Create salon_devices table in Supabase
**Description:** As a developer, I need a database table to store device registrations and pairing relationships.

**Acceptance Criteria:**
- [ ] Create `salon_devices` table with columns: id, salon_id, device_id, device_name, device_type, station_name, pairing_code, paired_to_device_id, is_online, last_seen, created_at, updated_at
- [ ] device_type enum: 'store-app', 'mango-pad', 'check-in', 'display'
- [ ] Add unique constraint on (salon_id, device_id)
- [ ] Add index on pairing_code for fast lookup
- [ ] Add RLS policies for salon-scoped access
- [ ] Create TypeScript types in store-app and mango-pad
- [ ] npm run typecheck passes

### US-002: Store App registers as station on startup
**Description:** As a Store App, I need to register myself as a checkout station in Supabase so Pads can discover and pair with me.

**Acceptance Criteria:**
- [ ] On app startup, upsert device record to salon_devices
- [ ] Generate unique device_id (persist in localStorage)
- [ ] Set device_type: 'store-app'
- [ ] Allow user to set station_name (default: "Checkout Station")
- [ ] Generate 6-character alphanumeric pairing_code (e.g., "A7X92K")
- [ ] Update is_online: true and last_seen on startup
- [ ] npm run typecheck passes

### US-003: Store App Device Settings page
**Description:** As a store manager, I want to access device settings to see my station info and manage paired Pads.

**Acceptance Criteria:**
- [ ] Add "Devices" menu item under Settings
- [ ] Navigate to /settings/devices route
- [ ] Show current station name (editable)
- [ ] Show pairing code prominently
- [ ] Show QR code containing pairing info
- [ ] List paired Mango Pads with online/offline status
- [ ] "Unpair" button for each connected Pad
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Store App generates and displays QR code
**Description:** As a store manager, I want to see a QR code so I can quickly pair a new Pad by scanning.

**Acceptance Criteria:**
- [ ] QR code contains JSON: { stationId, pairingCode, salonId, brokerUrl }
- [ ] QR code displays in Device Settings page
- [ ] "Show QR Code" button opens fullscreen modal for easy scanning
- [ ] QR code regenerates if pairing code changes
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Mango Pad welcome screen on first launch
**Description:** As a new Mango Pad user, I want to see a welcome screen with options to pair or try demo mode.

**Acceptance Criteria:**
- [ ] Show welcome screen if no pairing exists in localStorage
- [ ] Display "Pair with Store" button (primary action)
- [ ] Display "Try Demo Mode" button (secondary action)
- [ ] Clean, customer-friendly design
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Mango Pad pairing screen with code entry
**Description:** As a Mango Pad user, I want to enter a pairing code to connect to a specific checkout station.

**Acceptance Criteria:**
- [ ] Large input field for 6-character code
- [ ] Auto-uppercase input
- [ ] "Connect" button (disabled until 6 chars entered)
- [ ] Loading state while verifying code
- [ ] Error message if code invalid or expired
- [ ] Success message and redirect to waiting screen on valid code
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Mango Pad QR code scanning for pairing
**Description:** As a Mango Pad user, I want to scan a QR code to quickly pair without typing.

**Acceptance Criteria:**
- [ ] "Scan QR Code" button on pairing screen
- [ ] Opens camera for QR scanning
- [ ] Parses QR JSON payload (stationId, pairingCode, salonId, brokerUrl)
- [ ] Auto-fills and submits pairing code
- [ ] Fallback message if camera unavailable
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Pairing verification and persistence
**Description:** As a system, I need to verify pairing codes and persist the relationship in Supabase.

**Acceptance Criteria:**
- [ ] Mango Pad queries salon_devices by pairing_code
- [ ] Verify code exists and belongs to a store-app device
- [ ] Create/update Mango Pad record with paired_to_device_id = station's device_id
- [ ] Store pairing info in Mango Pad localStorage (stationId, salonId, stationName)
- [ ] Store App receives notification of new paired device
- [ ] npm run typecheck passes

### US-009: Real-time connection status via MQTT heartbeats
**Description:** As a user, I want to see real-time online/offline status of paired devices.

**Acceptance Criteria:**
- [ ] Mango Pad publishes heartbeat every 15 seconds to `salon/{salonId}/pad/{deviceId}/heartbeat`
- [ ] Store App subscribes to heartbeats from paired Pads
- [ ] Store App shows green/gray indicator for each Pad (online if heartbeat < 30s ago)
- [ ] Mango Pad subscribes to station heartbeat `salon/{salonId}/station/{stationId}/heartbeat`
- [ ] Mango Pad shows connection status in header
- [ ] npm run typecheck passes

### US-010: Store App unpair device functionality
**Description:** As a store manager, I want to unpair a Mango Pad so it can be reassigned or removed.

**Acceptance Criteria:**
- [ ] "Unpair" button next to each paired Pad in Device Settings
- [ ] Confirmation dialog before unpairing
- [ ] Update Supabase: set paired_to_device_id = null on Pad record
- [ ] Notify Pad via MQTT that it has been unpaired
- [ ] Pad shows "Disconnected" and returns to pairing screen
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Mango Pad connection status indicator
**Description:** As a customer using Mango Pad, I want to see if the device is connected to the checkout station.

**Acceptance Criteria:**
- [ ] Small status indicator in top corner of all Pad screens
- [ ] Green dot + "Connected to [Station Name]" when online
- [ ] Red dot + "Offline" when station heartbeat missing > 30s
- [ ] Tapping indicator shows connection details
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: Mango Pad settings/unpair option
**Description:** As a store staff member, I want to unpair a Mango Pad from its current station.

**Acceptance Criteria:**
- [ ] Settings icon/button accessible from waiting screen
- [ ] Settings page shows current pairing: station name, salon name
- [ ] "Unpair Device" button with confirmation
- [ ] Clears localStorage pairing info
- [ ] Updates Supabase record (paired_to_device_id = null)
- [ ] Returns to welcome screen
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-013: Demo mode for Mango Pad
**Description:** As a potential customer or tester, I want to try Mango Pad without pairing to see how it works.

**Acceptance Criteria:**
- [ ] "Try Demo Mode" from welcome screen
- [ ] Demo mode uses mock data (sample receipt, tip options)
- [ ] All screens functional with demo data
- [ ] Clear "DEMO MODE" indicator on all screens
- [ ] "Exit Demo" button returns to welcome screen
- [ ] npm run typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Create `salon_devices` table in Supabase with device registration and pairing fields
- FR-2: Store App generates unique 6-character alphanumeric pairing code on startup
- FR-3: Store App displays pairing code and QR code in Settings → Devices
- FR-4: Mango Pad shows welcome screen with "Pair" and "Demo Mode" options on first launch
- FR-5: Mango Pad accepts pairing code via manual entry or QR scan
- FR-6: Pairing code lookup verifies against salon_devices table
- FR-7: Successful pairing creates relationship: Pad.paired_to_device_id → Station.device_id
- FR-8: Both devices exchange heartbeats via MQTT cloud broker every 15 seconds
- FR-9: Devices show online/offline status based on heartbeat freshness (30s threshold)
- FR-10: Store App can unpair Pads; Pad returns to welcome screen when unpaired
- FR-11: Mango Pad can self-unpair via settings
- FR-12: Demo mode allows testing Pad without pairing

## Non-Goals (Out of Scope)

- Local network discovery (future phase)
- Multiple stations per Store App instance (one station per app instance for now)
- Automatic reconnection after IP change (cloud broker handles this)
- Device-to-device communication without cloud broker
- Admin portal for managing all devices across salons

## Technical Considerations

### Supabase Schema
```sql
CREATE TABLE salon_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT NOT NULL CHECK (device_type IN ('store-app', 'mango-pad', 'check-in', 'display')),
  station_name TEXT,
  pairing_code TEXT,
  paired_to_device_id TEXT,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id, device_id)
);

CREATE INDEX idx_salon_devices_pairing_code ON salon_devices(pairing_code) WHERE pairing_code IS NOT NULL;
```

### MQTT Topics
- Station heartbeat: `salon/{salonId}/station/{deviceId}/heartbeat`
- Pad heartbeat: `salon/{salonId}/pad/{deviceId}/heartbeat`
- Unpair notification: `salon/{salonId}/pad/{deviceId}/unpaired`

### QR Code Payload
```json
{
  "type": "mango-pad-pairing",
  "stationId": "device-abc123",
  "pairingCode": "A7X92K",
  "salonId": "salon-xyz",
  "brokerUrl": "wss://broker.hivemq.com:8884/mqtt"
}
```

### Libraries
- QR Code generation: `qrcode.react` (Store App)
- QR Code scanning: `@capacitor-community/barcode-scanner` or `html5-qrcode` (Mango Pad)

## Success Metrics

- Pairing completes in < 30 seconds (code entry or QR scan)
- Connection status updates within 5 seconds of device state change
- Zero manual configuration of MQTT broker URLs or salon IDs required after pairing
- Demo mode allows full UI exploration without backend

## Open Questions

- Should pairing codes auto-regenerate periodically for security?
- Should we support bulk device registration from admin portal in future?
- Should demo mode data be configurable or hardcoded?

---

*Created: January 2025*
*Branch: ralph/mango-pad-integration*
