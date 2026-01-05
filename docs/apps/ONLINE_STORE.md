# Online Store

> Customer-facing booking portal for online appointments

---

## Overview

The Online Store is a customer-facing web application that allows clients to book appointments online. It integrates with the Store App via cloud MQTT broker for real-time availability updates.

---

## Platform

| Property | Value |
|----------|-------|
| **Framework** | Next.js |
| **Deployment** | Vercel |
| **Connection** | Cloud MQTT (mqtts://mqtt.mango.com:8883) |
| **Offline Capable** | No (requires internet) |

---

## Key Features

### Service Browsing
- Service catalog with categories
- Service descriptions and pricing
- Duration and availability info
- Staff specialization display

### Booking Flow
1. Select service(s)
2. Choose preferred date/time
3. Select staff (optional - can use auto-assign)
4. Enter client information
5. Confirm booking
6. Receive confirmation SMS/email

### Client Account
- View upcoming appointments
- Appointment history
- Cancel/reschedule bookings
- Manage preferences

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       ONLINE STORE (Next.js)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      PAGES                               │   │
│   │                                                          │   │
│   │   /services ──► /book/[serviceId] ──► /confirm          │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    SERVICES                              │   │
│   │                                                          │   │
│   │   Supabase Client ◄──► Cloud MQTT Broker                 │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Cloud Services │
                    │                 │
                    │  - Supabase     │
                    │  - MQTT Broker  │
                    │  - Vercel       │
                    └─────────────────┘
```

---

## Smart Auto-Assignment

When a customer doesn't select a specific staff member, the system uses smart auto-assignment:

```typescript
// Called on booking confirmation
const assignedStaff = await smartAutoAssign({
  service: selectedService,
  dateTime: selectedSlot,
  salonId: salon.id,
  preferences: {
    considerTurnOrder: true,
    considerSpecialization: true,
    considerWorkload: true
  }
});
```

### Assignment Factors (Weighted)

| Factor | Weight | Description |
|--------|--------|-------------|
| Turn Order | 30% | Fair distribution |
| Specialization | 25% | Service expertise |
| Workload | 20% | Current bookings |
| Availability | 15% | Schedule conflicts |
| Client History | 10% | Previous staff preference |

---

## Conflict Detection

Before confirming a booking, the system checks for conflicts:

```typescript
const conflicts = await detectConflicts({
  staffId: assignedStaff.id,
  startTime: selectedSlot,
  duration: service.duration,
  salonId: salon.id
});

if (conflicts.length > 0) {
  // Suggest alternative times
  const alternatives = await getAlternativeSlots(/* ... */);
}
```

### Conflict Types

| Type | Description | Action |
|------|-------------|--------|
| `DOUBLE_BOOKING` | Staff already booked | Block & suggest alternatives |
| `BREAK_OVERLAP` | Overlaps with break | Block & suggest alternatives |
| `OUTSIDE_HOURS` | Outside working hours | Block |
| `BLOCKED_TIME` | Staff blocked this time | Block & suggest alternatives |

---

## Real-time Updates

The Online Store receives real-time updates via cloud MQTT broker:

```typescript
import mqtt from 'mqtt';

const client = mqtt.connect('mqtts://mqtt.mango.com:8883', {
  username: salonId,
  password: deviceToken
});

// Subscribe to availability updates
client.subscribe(`salon/${salonId}/availability/+`);

client.on('message', (topic, message) => {
  const data = JSON.parse(message.toString());

  if (topic.includes('availability')) {
    refreshAvailability(data.date);
  }
});

// Publish new booking (QoS 1 for guaranteed delivery)
client.publish(`salon/${salonId}/bookings/created`, JSON.stringify(booking), { qos: 1 });
```

---

## SEO & Performance

- Server-side rendering for service pages
- Static generation for common pages
- Image optimization for service photos
- Core Web Vitals optimized

---

## Development

```bash
# Start Next.js dev server
pnpm dev --filter=online-store

# Build for production
pnpm build --filter=online-store

# Deploy to Vercel
vercel --prod
```

---

## Related Documentation

- [REALTIME_COMMUNICATION.md](../architecture/REALTIME_COMMUNICATION.md)
- [PRD-Book-Module.md](../product/PRD-Book-Module.md)
- [Smart Auto-Assignment](../../src/utils/smartAutoAssign.ts)

---

*Last updated: January 2025*
