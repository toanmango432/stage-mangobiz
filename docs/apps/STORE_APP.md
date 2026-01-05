# Store App

> Main POS application with local MQTT broker capability

---

## Overview

The Store App is the primary point-of-sale application for Mango POS. It runs as an Electron desktop application and serves as the local MQTT broker for all in-salon devices.

---

## Platform

| Property | Value |
|----------|-------|
| **Framework** | Electron + React |
| **Local Port** | 1883 (Mosquitto MQTT broker) |
| **Target Devices** | Desktop/laptop at front desk |
| **Offline Capable** | Yes (IndexedDB + local sync) |

---

## Key Features

### POS Operations
- Appointment scheduling and calendar view
- Walk-in ticket creation
- Service assignment and tracking
- Payment processing (Tap to Pay, card, cash)
- Receipt printing

### Local Hub Functionality
- Runs Mosquitto MQTT broker on port 1883
- Publishes/subscribes to topics for all connected devices
- Registers IP with Supabase for device discovery
- Bridges to cloud broker when needed

### Staff Management
- Turn tracking and rotation
- Clock in/out via staff PIN
- Commission tracking
- Schedule management

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        STORE APP (Electron)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   RENDERER PROCESS                       │   │
│   │                                                          │   │
│   │   React App ─────► Redux Store ─────► dataService       │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              │ IPC                              │
│                              ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    MAIN PROCESS                          │   │
│   │                                                          │   │
│   │   ┌─────────────┐    ┌─────────────┐    ┌───────────┐   │   │
│   │   │ Mosquitto   │    │   USB       │    │  System   │   │   │
│   │   │ MQTT Broker │    │  Devices    │    │  Tray     │   │   │
│   │   │ Port 1883   │    │  Printer    │    │           │   │   │
│   │   └─────────────┘    └─────────────┘    └───────────┘   │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mosquitto MQTT Broker

The Store App runs an embedded Mosquitto broker for in-salon device communication:

```typescript
// electron/main.ts
import { spawn } from 'child_process';
import path from 'path';

function startMosquittoBroker(): void {
  const mosquittoPath = path.join(__dirname, 'bin', 'mosquitto');
  const configPath = path.join(__dirname, 'mosquitto.conf');

  const broker = spawn(mosquittoPath, ['-c', configPath]);
  broker.on('close', (code) => {
    if (code !== 0) setTimeout(startMosquittoBroker, 1000); // Auto-restart
  });
}

// Register with Supabase for discovery
await supabase.from('salon_devices').upsert({
  salon_id: config.salonId,
  device_id: config.deviceId,
  device_type: 'store-app',
  local_ip: getLocalIpAddress(),
  mqtt_port: 1883,
  is_local_hub: true,
  is_online: true
});
```

---

## Topic Subscriptions

### Incoming Topics (Subscribed)

| Topic | QoS | Source | Action |
|-------|-----|--------|--------|
| `salon/{id}/checkin/client` | 1 | Check-In App | Add to waitlist, notify staff |
| `salon/{id}/pad/signature` | 1 | Mango Pad | Attach to ticket, complete checkout |
| `salon/{id}/checkin/staff` | 1 | Check-In App | Update staff status |
| `salon/{id}/bookings/created` | 1 | Online Store | Create appointment (via cloud bridge) |

### Outgoing Topics (Published)

| Topic | QoS | Destination | Trigger |
|-------|-----|-------------|---------|
| `salon/{id}/appointments/updated` | 1 | All devices | Appointment change |
| `salon/{id}/tickets/created` | 1 | All devices | New ticket opened |
| `salon/{id}/waitlist/updated` | 0 | Check-In App | Waitlist change |
| `salon/{id}/receipts/ready` | 1 | Mango Pad | Receipt for signature |
| `salon/{id}/payments/completed` | 2 | All devices | Payment processed |

---

## Offline Mode

When internet is unavailable:
1. Local Mosquitto broker continues operating
2. Data stored in IndexedDB
3. Sync queue accumulates changes
4. MQTT messages queued with QoS 1/2 guarantee
5. Auto-sync when connection restored

---

## Development

```bash
# Start Electron in dev mode
npm run electron:dev

# Build Electron app
npm run electron:build

# Package for distribution
npm run electron:package
```

---

## Related Documentation

- [REALTIME_COMMUNICATION.md](../architecture/REALTIME_COMMUNICATION.md)
- [DEVICE_DISCOVERY.md](../architecture/DEVICE_DISCOVERY.md)
- [TECHNICAL_DOCUMENTATION.md](../architecture/TECHNICAL_DOCUMENTATION.md)

---

*Last updated: January 2025*
