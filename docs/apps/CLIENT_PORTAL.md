# Client Portal

> Client self-service web application

---

## Overview

The Client Portal is a web application where clients can manage their account, view appointment history, track loyalty points, and access exclusive offers.

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

### Account Management
- Profile editing (name, email, phone)
- Communication preferences
- Password management
- Linked payment methods

### Appointment History
- Past appointments with details
- Service history by staff
- Receipt/invoice downloads
- Rebooking from history

### Loyalty & Rewards
- Current points balance
- Points earning history
- Available rewards
- Redemption tracking

### Memberships & Packages
- Active memberships
- Package balances (pre-paid services)
- Auto-renewal management
- Usage history

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT PORTAL (Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      PAGES                               │   │
│   │                                                          │   │
│   │   /dashboard ──► /appointments ──► /rewards             │   │
│   │        │                                                 │   │
│   │        ▼                                                 │   │
│   │   /profile ──► /packages ──► /settings                  │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    SERVICES                              │   │
│   │                                                          │   │
│   │   Supabase Auth ──► Supabase Client                     │   │
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
                    │  - Vercel       │
                    └─────────────────┘
```

---

## Authentication

### Login Methods

| Method | Implementation |
|--------|----------------|
| Email/Password | Supabase Auth |
| Phone OTP | Supabase Auth (SMS) |
| Social Login | Google, Apple (future) |
| SSO with Online Store | Shared session |

### Session Management

```typescript
// Shared auth with Online Store
const { data: session } = await supabase.auth.getSession();

if (!session) {
  // Redirect to login
  router.push('/login');
}
```

---

## Dashboard

The dashboard shows a summary of client activity:

```
┌─────────────────────────────────────────────────────────────────┐
│                        DASHBOARD                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────┐   ┌─────────────────────┐            │
│   │  Upcoming Appts     │   │  Loyalty Points     │            │
│   │                     │   │                     │            │
│   │  May 15, 2:00 PM    │   │  1,250 pts          │            │
│   │  Haircut with Jane  │   │  $25 reward avail   │            │
│   │                     │   │                     │            │
│   │  [Reschedule]       │   │  [Redeem]           │            │
│   └─────────────────────┘   └─────────────────────┘            │
│                                                                  │
│   ┌─────────────────────┐   ┌─────────────────────┐            │
│   │  Package Balance    │   │  Recent Activity    │            │
│   │                     │   │                     │            │
│   │  5 of 10 sessions   │   │  Apr 28 - Manicure  │            │
│   │  Monthly Unlimited  │   │  Apr 15 - Haircut   │            │
│   │                     │   │                     │            │
│   │  [View Details]     │   │  [See All]          │            │
│   └─────────────────────┘   └─────────────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appointment Management

### View History

```typescript
const { data: appointments } = await supabase
  .from('appointments')
  .select(`
    *,
    services:appointment_services(service_name, price),
    staff:staff_id(first_name, last_name)
  `)
  .eq('client_id', clientId)
  .order('scheduled_start_time', { ascending: false })
  .limit(20);
```

### Reschedule/Cancel

```typescript
// Cancel with 24-hour policy check
async function cancelAppointment(appointmentId: string) {
  const appointment = await getAppointment(appointmentId);

  const hoursUntil = differenceInHours(
    new Date(appointment.scheduled_start_time),
    new Date()
  );

  if (hoursUntil < 24) {
    throw new Error('Cancellations require 24 hours notice');
  }

  await supabase
    .from('appointments')
    .update({ status: 'cancelled', cancelled_at: new Date() })
    .eq('id', appointmentId);
}
```

---

## Loyalty System

### Points Display

```typescript
interface LoyaltyBalance {
  currentPoints: number;
  lifetimePoints: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  pointsToNextTier: number;
  availableRewards: Reward[];
}
```

### Redemption

```typescript
async function redeemReward(rewardId: string) {
  const reward = await getReward(rewardId);

  if (loyaltyBalance.currentPoints < reward.pointsCost) {
    throw new Error('Insufficient points');
  }

  await supabase.from('loyalty_redemptions').insert({
    client_id: clientId,
    reward_id: rewardId,
    points_used: reward.pointsCost,
    redeemed_at: new Date()
  });

  // Update balance
  await updateLoyaltyBalance(clientId, -reward.pointsCost);
}
```

---

## Notifications

Clients can manage notification preferences:

| Type | Options |
|------|---------|
| Appointment Reminders | SMS, Email, Push |
| Marketing | Opt-in only |
| Loyalty Updates | Points earned, rewards available |
| Booking Confirmations | SMS, Email |

---

## Mobile Responsiveness

The Client Portal is fully responsive:

- Desktop: Full dashboard layout
- Tablet: Condensed navigation
- Mobile: Bottom navigation, stacked cards

---

## Development

```bash
# Start Next.js dev server
pnpm dev --filter=client-portal

# Build for production
pnpm build --filter=client-portal

# Deploy to Vercel
vercel --prod
```

---

## Related Documentation

- [PRD-Clients-CRM-Module.md](../product/PRD-Clients-CRM-Module.md)
- [TECHNICAL_DOCUMENTATION.md](../architecture/TECHNICAL_DOCUMENTATION.md)
- [Online Store](./ONLINE_STORE.md) - Shared authentication

---

*Last updated: January 2025*
