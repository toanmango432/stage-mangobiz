# Mango POS - Quick Reference Guide

## 🚀 Getting Started

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

**Development URL:** http://localhost:5173

---

## 📁 Project Structure

```
src/
├── api/              # API client & endpoints
│   ├── client.ts     # Axios instance with auth
│   ├── endpoints.ts  # All API methods
│   └── socket.ts     # Socket.io client
├── components/       # React components
│   ├── checkout/     # Checkout components
│   ├── layout/       # AppShell, headers, nav
│   └── modules/      # Page modules
├── db/               # IndexedDB layer
│   ├── schema.ts     # Database schema
│   ├── database.ts   # CRUD operations
│   └── seed.ts       # Test data
├── services/         # Business logic
│   ├── syncManager.ts      # Offline sync
│   ├── turnQueueService.ts # Staff assignment
│   └── serviceWorkerRegistration.ts
├── store/            # Redux state
│   ├── index.ts      # Store config
│   └── slices/       # State slices
├── types/            # TypeScript types
└── utils/            # Utility functions
```

---

## 🎯 Key Features Built

### 1. Offline Sync Engine
**File:** `src/services/syncManager.ts`

```typescript
import { syncManager } from './services/syncManager';

// Manual sync
await syncManager.syncNow();

// Get sync status
const status = await syncManager.getStatus();
// { pendingOperations, lastSyncAt, isOnline, isSyncing }
```

**Features:**
- Auto-sync every 30 seconds
- Conflict resolution
- Priority queue
- Retry logic

---

### 2. Turn Queue Intelligence
**File:** `src/services/turnQueueService.ts`

```typescript
import { turnQueueService } from './services/turnQueueService';

// Auto-assign best staff for walk-in
const staff = await turnQueueService.autoAssignWalkIn(
  salonId,
  serviceIds,
  isVIP
);

// Get turn queue stats
const stats = await turnQueueService.getTurnQueueStats(salonId);
// { totalStaff, availableStaff, staffStats, nextInLine }

// Suggest top 3 staff with reasons
const suggestions = await turnQueueService.suggestStaff(salonId, {
  serviceIds: ['s1', 's2'],
  vipClient: true,
  requiredSkills: ['nail-art', 'gel'],
});
```

**Scoring Factors:**
1. Skill Match (0-30 pts)
2. Turn Rotation (0-25 pts)
3. VIP Handling (0-20 pts)
4. Current Load (0-15 pts)
5. Performance (0-10 pts)

---

### 3. Enhanced Checkout
**File:** `src/components/checkout/EnhancedCheckoutScreen.tsx`

**Features:**
- Split payments (multiple methods per transaction)
- Dynamic tip calculation (percentage or custom)
- Discount system (percentage or fixed)
- Real-time total calculations
- Payment methods: Card, Cash, Mobile Pay, Other

**Usage:**
```typescript
<EnhancedCheckoutScreen
  ticket={ticket}
  onClose={() => setSelectedTicket(null)}
  onComplete={(paymentData) => {
    // paymentData includes:
    // - subtotal, discount, tax, tip, total
    // - payments array
    // - completedAt timestamp
  }}
/>
```

---

### 4. Network Status Monitor
**File:** `src/components/NetworkStatus.tsx`

**States:**
- 🔴 Offline - Working offline, changes queued
- 🟡 Pending - X operations waiting to sync
- 🔵 Syncing - Synchronizing with server
- 🟢 All Synced - Everything up to date

Auto-hides when online and synced.

---

## 🗄️ Database Operations

### Appointments
```typescript
import { appointmentsDB } from './db/database';

// Get all appointments for today
const appointments = await appointmentsDB.getByDate(salonId, new Date());

// Create appointment
const appointment = await appointmentsDB.create(
  {
    clientId: 'c1',
    staffId: 's1',
    services: [{ id: 'svc1', duration: 60 }],
    scheduledStartTime: new Date(),
  },
  userId,
  salonId
);

// Check-in
await appointmentsDB.checkIn(appointmentId, userId);
```

### Tickets
```typescript
import { ticketsDB } from './db/database';

// Get active tickets
const active = await ticketsDB.getActive(salonId);

// Create ticket
const ticket = await ticketsDB.create(
  {
    clientId: 'c1',
    appointmentId: 'a1',
    services: [
      { id: 's1', staffId: 'staff1', duration: 60, price: 45 }
    ],
    products: [],
  },
  userId,
  salonId
);

// Complete ticket
await ticketsDB.complete(ticketId, userId);
```

### Staff
```typescript
import { staffDB } from './db/database';

// Get available staff
const available = await staffDB.getAvailable(salonId);

// Clock in
await staffDB.clockIn(staffId);

// Clock out
await staffDB.clockOut(staffId);
```

---

## 🔄 Sync Queue

```typescript
import { syncQueueDB } from './db/database';

// Add operation to sync queue
await syncQueueDB.add({
  type: 'data',
  entity: 'ticket',
  entityId: ticket.id,
  action: 'CREATE',
  payload: ticket,
  priority: 2, // 1=highest (transactions), 2=tickets, 3=appointments
  maxAttempts: 5,
});

// Get pending operations
const pending = await syncQueueDB.getPending();
```

**Priority Levels:**
1. Transactions (payments) - highest priority
2. Tickets (services)
3. Appointments

---

## 🎨 Design Tokens

### Colors
```typescript
// Paper Base
'#FFF9F4' // Main background
'#FFFDF8' // Card background
'#FDF9F2' // Card gradient end

// Text
'#222222' // Primary (ink black)
'#555555' // Secondary
'#6B7280' // Service text (medium gray)

// Status Colors
'#47B881' // Success (soft emerald)
'#3BC49B' // Progress (soft mint)
'#F59E0B' // Waiting (amber)
'#F2785C' // Late/Alert (warm coral)

// Brand Gradients
'from-orange-500 to-pink-500' // Primary gradient
'from-teal-400 to-teal-600'   // Team sidebar
```

### Shadows
```css
/* Paper depth */
box-shadow: 
  inset 0 0.5px 0 rgba(255,255,255,0.7),
  inset 0 -0.8px 1px rgba(0,0,0,0.05),
  0.5px 0.5px 0 rgba(255,255,255,0.8),
  1.5px 2px 2px rgba(0,0,0,0.04),
  3px 6px 8px rgba(0,0,0,0.08);
```

---

## 🧪 Testing

### Manual Tests
1. **Offline Mode:**
   - Disconnect network
   - Create appointment
   - Complete ticket
   - Process checkout
   - Reconnect - verify sync

2. **Turn Queue:**
   - Create multiple walk-ins
   - Verify fair staff rotation
   - Check VIP client routing

3. **Checkout:**
   - Add discount
   - Calculate tip
   - Split payment (2+ methods)
   - Verify totals

### Browser DevTools
```javascript
// Check IndexedDB
// Application tab > IndexedDB > mango_biz_store_app

// Check sync queue
// Run in console:
const pending = await db.syncQueue.toArray();
console.table(pending);

// Check network status
navigator.onLine // true/false
```

---

## 🐛 Troubleshooting

### Sync Not Working
```typescript
// Check sync status
import { syncManager } from './services/syncManager';
const status = await syncManager.getStatus();

// Force sync
await syncManager.syncNow();

// Check pending operations
import { syncQueueDB } from './db/database';
const pending = await syncQueueDB.getPending();
```

### Database Issues
```typescript
// Clear database (dev only!)
import { clearDatabase } from './db/schema';
await clearDatabase();

// Re-seed
import { seedDatabase } from './db/seed';
await seedDatabase();
```

### Service Worker
```javascript
// Unregister service worker (dev)
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(r => r.unregister());
  });

// Check if registered
navigator.serviceWorker.controller
```

---

## 📝 Common Tasks

### Add New Service
```typescript
// 1. Add to services table in seed.ts
// 2. Services automatically available in booking

// Example:
{
  id: 'new-service-1',
  salonId: SALON_ID,
  name: 'New Service',
  category: 'Nails',
  duration: 60,
  price: 50.00,
  description: 'Service description',
  syncStatus: 'synced',
}
```

### Add New Staff Member
```typescript
// 1. Add to staff table in seed.ts
// 2. Include skills for turn queue matching

{
  id: 'new-staff-1',
  salonId: SALON_ID,
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '555-0123',
  specialties: ['s1', 's2'],
  skills: ['manicure', 'pedicure', 'nail-art'],
  rating: 4.8,
  vipPreferred: true,
  status: 'available',
  // ... other fields
}
```

### Create Custom Payment Method
```typescript
// In EnhancedCheckoutScreen.tsx
// Add to PAYMENT_METHODS array:

{
  id: 'custom',
  label: 'Custom Method',
  icon: CustomIcon,
  color: 'indigo'
}
```

---

## 🚀 Deployment Checklist

### Pre-Deploy
- [ ] Run `npm run build`
- [ ] Test production build locally
- [ ] Verify service worker works
- [ ] Check all environment variables
- [ ] Test offline functionality
- [ ] Verify sync works

### Production
- [ ] Deploy to hosting (Netlify, Vercel, etc.)
- [ ] Configure backend API URL
- [ ] Set up SSL certificate
- [ ] Enable PWA installation
- [ ] Monitor error logs
- [ ] Test on real devices

---

## 📚 Additional Resources

- **PRD:** `Mango POS PRD v1.md`
- **Build Status:** `BUILD_STATUS.md`
- **Session Summary:** `SESSION_SUMMARY.md`
- **Architecture:** `mango-complete-architecture.md`

---

## 💡 Pro Tips

1. **Always test offline** - Disconnect network frequently during development
2. **Check sync queue** - Monitor pending operations in DevTools
3. **Use Redux DevTools** - Install browser extension for state debugging
4. **IndexedDB Inspector** - Use browser DevTools to inspect database
5. **Service Worker Bypass** - Shift+Reload to bypass cache during dev

---

## 🆘 Need Help?

**Common Issues:**
- Service Worker not updating → Hard refresh (Cmd+Shift+R)
- Sync stuck → Check network tab for failed requests
- Database errors → Clear IndexedDB and re-seed
- TypeScript errors → Run `npm install` and restart TS server

**Debug Mode:**
```typescript
// Enable verbose logging
localStorage.setItem('DEBUG', 'true');

// Check in console for detailed sync logs
```

---

**Last Updated:** Nov 4, 2025  
**Version:** 2.0.0  
**Status:** Active Development 🚧
