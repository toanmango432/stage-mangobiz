# Check-In App

> Walk-in client registration and staff clock-in kiosk

---

## Overview

The Check-In App is a tablet/kiosk application for walk-in client registration and staff clock-in/out. It connects to the Store App via local MQTT broker for instant communication.

---

## Platform

| Property | Value |
|----------|-------|
| **Framework** | React + Capacitor |
| **Target Devices** | iPad, Android tablet |
| **Connection** | Local MQTT (primary), Cloud MQTT (fallback) |
| **Offline Capable** | Yes (queues actions locally with QoS 1) |

---

## Key Features

### Client Check-In
- Search existing clients by name/phone
- Quick-add new clients
- Service selection
- Staff preference (optional)
- Waitlist position display

### Staff Clock-In/Out
- Staff PIN authentication
- Clock-in with break tracking
- Clock-out with hours summary
- Turn tracker update

### Waitlist Display
- Current wait time
- Position in queue
- Service progress updates

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHECK-IN APP (Capacitor)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      SCREENS                             │   │
│   │                                                          │   │
│   │   ┌─────────┐   ┌─────────┐   ┌─────────┐              │   │
│   │   │  Home   │   │ Check-In│   │Staff PIN│              │   │
│   │   │  Screen │   │  Flow   │   │  Entry  │              │   │
│   │   └─────────┘   └─────────┘   └─────────┘              │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    SERVICES                              │   │
│   │                                                          │   │
│   │   MangoMqtt ─────► Local/Cloud auto-discovery           │   │
│   │   IndexedDB ──────► Offline queue                       │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Local (2-10ms)
                              ▼
                    ┌─────────────────┐
                    │   STORE APP     │
                    │   (Local Hub)   │
                    └─────────────────┘
```

---

## Check-In Flow

### New Walk-In

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Search  │───▶│  Client  │───▶│  Select  │───▶│  Added   │
│  Client  │    │  Found?  │    │ Services │    │to Queue  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │
                     │ No
                     ▼
               ┌──────────┐
               │Quick Add │
               │  Client  │
               └──────────┘
```

### MQTT Topics

```typescript
import mqtt from 'mqtt';

// Publish when client checks in (QoS 1 for guaranteed delivery)
client.publish(`salon/${salonId}/checkin/client`, JSON.stringify({
  clientId: client.id,
  clientName: client.name,
  services: selectedServices,
  preferredStaff: staffId || null,
  timestamp: new Date().toISOString()
}), { qos: 1 });

// Subscribe to waitlist updates
client.subscribe(`salon/${salonId}/waitlist/updated`);

client.on('message', (topic, message) => {
  if (topic.endsWith('waitlist/updated')) {
    const data = JSON.parse(message.toString());
    updateWaitlistDisplay(data.waitlist);
  }
});
```

---

## Staff Clock-In

### PIN Entry Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Enter   │───▶│ Validate │───▶│  Clocked │
│   PIN    │    │   PIN    │    │    In    │
└──────────┘    └──────────┘    └──────────┘
```

### MQTT Publish

```typescript
// Publish staff clock event (QoS 1)
client.publish(`salon/${salonId}/checkin/staff`, JSON.stringify({
  staffId: staff.id,
  action: 'clock-in', // or 'clock-out', 'break-start', 'break-end'
  timestamp: new Date().toISOString()
}), { qos: 1 });
```

---

## Offline Mode

When Store App is unavailable:

1. **Queue locally**: Check-ins stored in IndexedDB
2. **Visual indicator**: Show "Offline" badge
3. **Auto-retry**: MQTT with QoS 1 auto-retries on reconnect
4. **Flush queue**: Queued messages sent automatically when connected

```typescript
// MQTT handles offline queuing automatically with QoS 1/2
const client = mqtt.connect(brokerUrl, {
  clientId: deviceId,
  clean: false,           // Persistent session - keeps queued messages
  reconnectPeriod: 5000   // Retry every 5 seconds
});

// Messages sent while offline are queued automatically
client.publish(`salon/${salonId}/checkin/client`, payload, { qos: 1 });
// ^ This is queued if offline, sent when reconnected
```

---

## UI Considerations

### Kiosk Mode
- Large touch targets (min 44px)
- High contrast text
- Auto-timeout to home screen
- Screen saver after inactivity

### Accessibility
- Voice feedback option
- Large font mode
- High contrast mode

---

## Development

```bash
# Start dev server
pnpm dev --filter=check-in

# Build for iOS
npx cap sync ios
npx cap open ios

# Build for Android
npx cap sync android
npx cap open android
```

---

## Related Documentation

- [REALTIME_COMMUNICATION.md](../architecture/REALTIME_COMMUNICATION.md)
- [DEVICE_DISCOVERY.md](../architecture/DEVICE_DISCOVERY.md)
- [PRD-Turn-Tracker-Module.md](../product/PRD-Turn-Tracker-Module.md)

---

*Last updated: January 2025*
