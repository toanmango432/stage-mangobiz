# Real-time Communication Architecture

> MQTT dual-broker architecture for instant device communication

---

## Overview

Mango POS uses **MQTT** (Message Queuing Telemetry Transport) for real-time communication between devices. The architecture features a **dual-broker approach**:

- **Local Broker**: Mosquitto running on Store App (Electron), provides 2-10ms latency
- **Cloud Broker**: HiveMQ/EMQX on Railway, provides 30-80ms latency as fallback

This achieves **99.96% combined reliability** with automatic failover and **guaranteed message delivery** via QoS levels.

---

## Why MQTT over Socket.io

| Feature | MQTT | Socket.io |
|---------|------|-----------|
| **QoS Levels** | 0, 1, 2 (guaranteed delivery) | None |
| **Offline Queue** | Built-in (QoS 1/2) | Manual |
| **Retained Messages** | Yes (last value cache) | No |
| **Topic Wildcards** | `salon/+/tickets/#` | Rooms only |
| **Battery Efficiency** | Excellent | Medium |
| **Message Overhead** | 2 bytes minimum | Larger |
| **Reconnect Handling** | Automatic with session | Manual |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SALON NETWORK                                      │
│                                                                              │
│   ┌─────────────┐     LOCAL (2-10ms)      ┌─────────────────────────────┐   │
│   │  Check-In   │◄──────────────────────► │                             │   │
│   │    App      │      MQTT               │        STORE APP            │   │
│   └─────────────┘                         │       (Electron)            │   │
│                                           │                             │   │
│   ┌─────────────┐     LOCAL (2-10ms)      │  ┌─────────────────────┐   │   │
│   │  Mango Pad  │◄──────────────────────► │  │  Mosquitto Broker   │   │   │
│   │ (Signature) │      MQTT               │  │  Port: 1883         │   │   │
│   └─────────────┘                         │  └─────────────────────┘   │   │
│                                           │           │                 │   │
│   ┌─────────────┐     LOCAL (2-10ms)      │           │ Bridge          │   │
│   │   Staff     │◄──────────────────────► │           │                 │   │
│   │   Tablet    │      MQTT               └───────────┼─────────────────┘   │
│   └─────────────┘                                     │                      │
│                                                       │                      │
└───────────────────────────────────────────────────────┼──────────────────────┘
                                                        │
                                           CLOUD (30-80ms)
                                                        │
                                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLOUD SERVICES                                  │
│                                                                              │
│   ┌─────────────────────┐         ┌─────────────────────────────────────┐   │
│   │   Cloud MQTT Broker │◄───────►│              Supabase               │   │
│   │   (HiveMQ/EMQX)     │         │  - Device Registry (salon_devices)  │   │
│   │   Port: 8883 (TLS)  │         │  - Data Persistence                 │   │
│   └─────────────────────┘         └─────────────────────────────────────┘   │
│            ▲                                                                 │
│            │                                                                 │
│            ▼                                                                 │
│   ┌─────────────────────┐                                                   │
│   │    Online Store     │  (Customer booking - cloud only)                  │
│   │    Client Portal    │                                                   │
│   └─────────────────────┘                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## MQTT Topics Structure

### Topic Hierarchy

```
salon/{salonId}/
├── pad/
│   └── signature              # Mango Pad → Store App
├── checkin/
│   ├── client                 # Check-In → Store App (walk-ins)
│   └── staff                  # Check-In → Store App (clock in/out)
├── tickets/
│   ├── created                # New ticket
│   ├── updated                # Ticket modified
│   └── {ticketId}/status      # Specific ticket status
├── appointments/
│   ├── created                # New appointment
│   ├── updated                # Appointment modified
│   └── cancelled              # Appointment cancelled
├── payments/
│   └── completed              # Payment processed
├── waitlist/
│   └── updated                # Waitlist changed
├── turns/
│   └── assigned               # Staff turn assignment
└── bookings/                  # From Online Store
    ├── created
    ├── modified
    └── cancelled
```

### Subscription Patterns

```typescript
// Store App subscribes to all salon events
client.subscribe('salon/+/+/#');

// Check-In App subscribes to waitlist updates
client.subscribe('salon/{salonId}/waitlist/updated');

// Mango Pad subscribes to receipt-ready events
client.subscribe('salon/{salonId}/receipts/ready');
```

---

## QoS Levels

MQTT provides three Quality of Service levels:

| QoS | Name | Guarantee | Use Case |
|-----|------|-----------|----------|
| **0** | At most once | Fire and forget | UI updates, non-critical |
| **1** | At least once | Guaranteed delivery | Signatures, check-ins |
| **2** | Exactly once | No duplicates | Payments, transactions |

### Event QoS Mapping

| Event | QoS | Reason |
|-------|-----|--------|
| `pad/signature` | 1 | Must not lose signatures |
| `checkin/client` | 1 | Must not lose walk-ins |
| `payments/completed` | 2 | Financial - exactly once |
| `waitlist/updated` | 0 | Can miss, will refresh |
| `appointments/updated` | 1 | Important but idempotent |

---

## Message Format

All MQTT messages use JSON payload:

```typescript
interface MqttMessage<T = unknown> {
  // Header
  id: string;              // Unique message ID (UUID)
  timestamp: string;       // ISO 8601 timestamp
  source: {
    deviceId: string;      // Sending device ID
    deviceType: DeviceType;
    salonId: string;
  };

  // Payload
  payload: T;

  // Metadata
  version: number;         // Message format version
}

type DeviceType = 'store-app' | 'check-in' | 'mango-pad' | 'staff-tablet' | 'online-store' | 'client-portal';
```

### Example: Signature Captured

```typescript
// Topic: salon/abc123/pad/signature
{
  "id": "msg-uuid-456",
  "timestamp": "2025-01-04T10:30:00.000Z",
  "source": {
    "deviceId": "pad-001",
    "deviceType": "mango-pad",
    "salonId": "abc123"
  },
  "payload": {
    "ticketId": "ticket-uuid-789",
    "signatureData": "data:image/png;base64,...",
    "clientId": "client-uuid-012"
  },
  "version": 1
}
```

---

## Connection Flow

### 1. Device Startup

```typescript
import mqtt from 'mqtt';

async function connect(config: DeviceConfig): Promise<MqttClient> {
  // 1. Query Supabase for local broker
  const localBroker = await supabase
    .from('salon_devices')
    .select('local_ip, mqtt_port')
    .eq('salon_id', config.salonId)
    .eq('is_local_hub', true)
    .eq('is_online', true)
    .single();

  // 2. Try local connection first
  if (localBroker?.data) {
    const localUrl = `mqtt://${localBroker.data.local_ip}:${localBroker.data.mqtt_port}`;

    try {
      const client = await connectWithTimeout(localUrl, 2000);
      console.log('Connected to local broker');
      return client;
    } catch (e) {
      console.warn('Local broker unreachable, using cloud');
    }
  }

  // 3. Fallback to cloud broker
  const cloudUrl = `mqtts://${CLOUD_MQTT_HOST}:8883`;
  return mqtt.connect(cloudUrl, {
    username: config.salonId,
    password: await getDeviceToken(),
    clientId: config.deviceId
  });
}
```

### 2. Auto-Reconnect with Failover

```typescript
client.on('offline', () => {
  console.log('Broker disconnected, attempting reconnect...');
});

client.on('reconnect', () => {
  // MQTT.js handles reconnection automatically
  // Messages queued during disconnect are sent on reconnect
});

// Periodic check to switch back to local
setInterval(async () => {
  if (connectionType === 'cloud') {
    const localReachable = await pingLocalBroker();
    if (localReachable) {
      await switchToLocalBroker();
    }
  }
}, 30000);
```

---

## Retained Messages

MQTT retained messages provide "last known value" for topics:

```typescript
// Store App publishes waitlist with retain flag
client.publish(
  'salon/abc123/waitlist/current',
  JSON.stringify({ clients: [...], updatedAt: '...' }),
  { qos: 1, retain: true }
);

// When Check-In App connects, it immediately receives last waitlist
client.subscribe('salon/abc123/waitlist/current');
client.on('message', (topic, message) => {
  // Receives retained message instantly, no need to wait for update
});
```

---

## Offline Queue (Built-in)

MQTT with QoS 1/2 automatically queues messages when offline:

```typescript
// Client configuration
const client = mqtt.connect(brokerUrl, {
  clientId: deviceId,
  clean: false,           // Persistent session
  reconnectPeriod: 5000,  // Retry every 5 seconds
});

// Messages sent while offline are queued automatically
client.publish('salon/abc123/checkin/client', payload, { qos: 1 });
// ^ This is queued if offline, sent when reconnected
```

---

## Store App as Local Broker

The Store App (Electron) runs an embedded Mosquitto broker:

```typescript
// electron/main.ts
import { spawn } from 'child_process';
import path from 'path';

function startMosquittoBroker(): void {
  const mosquittoPath = path.join(__dirname, 'bin', 'mosquitto');
  const configPath = path.join(__dirname, 'mosquitto.conf');

  const broker = spawn(mosquittoPath, ['-c', configPath]);

  broker.stdout.on('data', (data) => {
    console.log(`Mosquitto: ${data}`);
  });

  broker.on('close', (code) => {
    console.log(`Mosquitto exited with code ${code}`);
    // Restart if crashed
    if (code !== 0) {
      setTimeout(startMosquittoBroker, 1000);
    }
  });
}

// mosquitto.conf
/*
listener 1883 0.0.0.0
allow_anonymous true
max_connections 50

# Bridge to cloud (when online)
connection cloud-bridge
address mqtt.mango.com:8883
topic salon/# both 1
bridge_cafile /path/to/ca.crt
*/
```

### Register with Supabase

```typescript
async function registerAsLocalBroker(): Promise<void> {
  const localIp = getLocalIpAddress();

  await supabase.from('salon_devices').upsert({
    salon_id: config.salonId,
    device_id: config.deviceId,
    device_type: 'store-app',
    local_ip: localIp,
    mqtt_port: 1883,
    is_local_hub: true,
    is_online: true,
    last_seen: new Date().toISOString()
  });

  // Start heartbeat
  startHeartbeat();
}
```

---

## Bridge to Cloud

The local Mosquitto broker bridges to cloud for:
1. Online Store bookings
2. Client Portal updates
3. Data backup/sync

```
# mosquitto.conf bridge section
connection cloud-bridge
address mqtt.mango.com:8883
topic salon/# both 1
bridge_cafile /etc/ssl/certs/ca-certificates.crt
remote_username ${SALON_ID}
remote_password ${BRIDGE_TOKEN}
```

---

## Event Reference

### Device Communication Events

| Topic | From | To | QoS | Description |
|-------|------|-----|-----|-------------|
| `salon/{id}/pad/signature` | Mango Pad | Store App | 1 | Customer signature |
| `salon/{id}/checkin/client` | Check-In | Store App | 1 | Walk-in arrival |
| `salon/{id}/checkin/staff` | Check-In | Store App | 1 | Staff clock in/out |
| `salon/{id}/receipts/ready` | Store App | Mango Pad | 1 | Receipt for signature |

### Broadcast Events (Store App → All)

| Topic | QoS | Description |
|-------|-----|-------------|
| `salon/{id}/appointments/created` | 1 | New appointment |
| `salon/{id}/appointments/updated` | 1 | Appointment modified |
| `salon/{id}/tickets/created` | 1 | New ticket |
| `salon/{id}/tickets/updated` | 0 | Ticket modified |
| `salon/{id}/payments/completed` | 2 | Payment processed |
| `salon/{id}/turns/assigned` | 1 | Staff turn assignment |
| `salon/{id}/waitlist/updated` | 0 | Waitlist changed |

### External Events (Cloud → Store App)

| Topic | QoS | Description |
|-------|-----|-------------|
| `salon/{id}/bookings/created` | 1 | Online booking |
| `salon/{id}/bookings/modified` | 1 | Customer modified |
| `salon/{id}/bookings/cancelled` | 1 | Customer cancelled |

---

## Reliability Calculation

### Single Broker Reliability

| Broker | Uptime | Notes |
|--------|--------|-------|
| Local (Mosquitto) | 99% | Occasional reboots, power outages |
| Cloud (HiveMQ/EMQX) | 99.6% | SLA-backed infrastructure |

### Combined Reliability

```
P(both fail) = P(local fails) × P(cloud fails)
             = 0.01 × 0.004
             = 0.00004

P(at least one works) = 1 - 0.00004
                      = 0.99996 (99.96%)
```

### With QoS 1/2 Guarantees

Messages are **never lost** even during broker switches:
- Queued locally during disconnect
- Delivered on reconnect
- Acknowledged by receiver

---

## Latency Comparison

| Connection Type | Typical Latency | Max Latency | Use Case |
|-----------------|-----------------|-------------|----------|
| Local MQTT | 2-10ms | 50ms | In-salon operations |
| Cloud MQTT | 30-80ms | 200ms | Remote/fallback |
| Supabase Realtime | 100-500ms | 1000ms | Database sync only |

---

## Security

### Authentication

```typescript
// Local broker - device token auth
const client = mqtt.connect('mqtt://192.168.1.100:1883', {
  username: deviceId,
  password: deviceToken,
  clientId: `${deviceType}-${deviceId}`
});

// Cloud broker - TLS + auth
const client = mqtt.connect('mqtts://mqtt.mango.com:8883', {
  username: salonId,
  password: deviceToken,
  clientId: `${deviceType}-${deviceId}`,
  rejectUnauthorized: true
});
```

### Topic ACL (Access Control)

```
# Mosquitto ACL file
# Devices can only publish/subscribe to their salon's topics
user device-*
topic readwrite salon/%u/#
```

---

## Related Documentation

- [Device Discovery](./DEVICE_DISCOVERY.md) - Zero-config device setup
- [Data Storage Strategy](./DATA_STORAGE_STRATEGY.md) - Offline data persistence
- [Technical Documentation](./TECHNICAL_DOCUMENTATION.md) - Overall architecture

---

*Last updated: January 2025*
