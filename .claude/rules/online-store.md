---
paths: apps/online-store/**/*
---

# Online Store Rules

The **Online Store** is the customer-facing booking portal built with Next.js.

## Overview

- **Platform**: Next.js (React)
- **Purpose**: Customer self-service booking
- **Database**: Supabase (direct connection)
- **Deployment**: Vercel

## Key Features

- Service browsing and selection
- Staff preference selection
- Available time slot display
- Booking confirmation
- Client profile management

## Architecture

```
Customer Browser → Next.js App → Supabase
                               ↓
                    MQTT → Store App (notification)
```

## Data Access

- Uses Supabase client directly (no Redux needed for simple flows)
- Server components for initial data fetch
- Client components for interactive features

## Styling

- Tailwind CSS with shared design tokens
- Mobile-first responsive design
- Matches Store App visual language

## MQTT Events

When a booking is created:
```typescript
// Publishes to notify Store App
topic: `salon/{salonId}/bookings/created`
QoS: 1
```

## SEO Considerations

- Use Next.js metadata API
- Server-side rendering for booking pages
- Static generation for service catalog

## Before Making Changes

1. Read `docs/product/` PRDs for booking flows
2. Test on mobile viewports
3. Ensure MQTT events are published correctly
4. Check Supabase RLS policies
