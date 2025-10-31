# Mango Biz - Complete Production Architecture Recommendation

## 🎯 Recommended Approach: **Progressive Offline-First**

For a **complete, production-ready application**, I recommend building with **full offline-first architecture from the start**, but implementing it in **phases** to manage complexity.

---

## 📋 Why Full Offline-First for Mango Biz?

### ✅ **Critical Business Requirements:**

1. **Cannot afford downtime** - Salons lose revenue when POS is down
2. **Payment processing** - Must handle transactions even during outages
3. **Multi-device coordination** - Multiple staff using different devices
4. **Real-time updates** - Staff need to see changes immediately
5. **Customer experience** - Can't tell customers "come back later"

### ✅ **The Numbers:**

- **Average internet outage:** 10-30 minutes per month
- **Salon hourly revenue:** $200-500
- **Cost of 30-min outage:** $100-250 lost revenue
- **Annual downtime cost:** $1,200-3,000 per salon
- **Your solution value:** Prevents these losses = major selling point

### ✅ **Competitive Advantage:**

> "Unlike other salon software, Mango Biz works perfectly offline. Never lose a sale due to internet issues."

This is a **massive differentiator** in the market.

---

## 🏗️ Complete Architecture Specification

### **Frontend Stack**

```typescript
// Core Framework
- React 18+ with TypeScript
- Vite (fast build tool)
- React Router v6 (routing)
- Redux Toolkit (state management)

// Offline Storage
- IndexedDB via Dexie.js (local database)
- Service Workers (background sync)
- Workbox (service worker management)

// UI/UX
- Tailwind CSS (styling)
- Headless UI (accessible components)
- React Hook Form (forms)
- Zod (validation)
- date-fns (date handling)

// Real-time & Network
- Socket.io Client (real-time sync)
- Axios (HTTP client)
- React Query (server state management)

// Utilities
- uuid (generate IDs)
- lodash-es (utilities)
```

### **Backend Stack**

```typescript
// Runtime & Framework
- Node.js 20+ LTS
- Express.js (web framework)
- TypeScript

// Database
- SQL Server Express 2022 (primary database)
  - Free, powerful, Windows-friendly
  - Supports up to 10 GB per database
  - Great for small-to-medium deployments
- Redis (caching + session store)
- Prisma (ORM with SQL Server support)

// Real-time
- Socket.io (WebSocket server)

// Authentication
- JWT (access tokens)
- Refresh token rotation
- bcrypt (password hashing)

// API & Validation
- Express Validator (input validation)
- Helmet (security headers)
- CORS (cross-origin)
- Rate limiting (express-rate-limit)

// Background Jobs
- Bull (Redis-based queue)
- For processing offline transactions
- For sending notifications

// Monitoring & Logging
- Winston (logging)
- Morgan (HTTP logging)
- Sentry (error tracking)

// Testing
- Jest (unit tests)
- Supertest (API tests)
```

### **Infrastructure**

```yaml
Development:
  - Docker Compose (local environment)
  - PostgreSQL container
  - Redis container
  - Node.js app

Staging/Production:
  Cloud Provider: AWS or Render.com
  
  Services:
    - EC2/App Platform (Node.js backend)
    - RDS PostgreSQL (database)
    - ElastiCache (Redis)
    - S3 (file storage)
    - CloudFront (CDN for frontend)
    - Route53 (DNS)
    
  Monitoring:
    - CloudWatch (metrics)
    - Sentry (errors)
    - UptimeRobot (uptime monitoring)
```

---

## 📦 Database Schema (SQL Server Express)

```sql
-- Core tables with offline-sync support

CREATE TABLE salons (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(255) NOT NULL,
  timezone NVARCHAR(50) DEFAULT 'America/New_York',
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE staff (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  salon_id UNIQUEIDENTIFIER REFERENCES salons(id),
  name NVARCHAR(255) NOT NULL,
  email NVARCHAR(255) UNIQUE,
  phone NVARCHAR(20),
  specialties NVARCHAR(MAX), -- JSON array as string
  status NVARCHAR(50) DEFAULT 'active',
  
  -- Sync fields
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  deleted_at DATETIME2,
  
  INDEX idx_salon_staff (salon_id, status)
);

CREATE TABLE clients (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  salon_id UNIQUEIDENTIFIER REFERENCES salons(id),
  name NVARCHAR(255) NOT NULL,
  phone NVARCHAR(20),
  email NVARCHAR(255),
  notes NVARCHAR(MAX),
  preferred_staff NVARCHAR(MAX), -- JSON array
  loyalty_tier NVARCHAR(50),
  
  -- Metrics
  total_visits INT DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit DATETIME2,
  
  -- Sync fields
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  deleted_at DATETIME2,
  
  INDEX idx_salon_clients (salon_id),
  INDEX idx_client_phone (phone)
);

CREATE TABLE appointments (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  salon_id UNIQUEIDENTIFIER REFERENCES salons(id),
  client_id UNIQUEIDENTIFIER REFERENCES clients(id),
  staff_id UNIQUEIDENTIFIER REFERENCES staff(id),
  
  -- Appointment data
  services NVARCHAR(MAX) NOT NULL, -- JSON array
  status NVARCHAR(50) DEFAULT 'scheduled',
  scheduled_start_time DATETIME2 NOT NULL,
  scheduled_end_time DATETIME2 NOT NULL,
  actual_start_time DATETIME2,
  actual_end_time DATETIME2,
  check_in_time DATETIME2,
  notes NVARCHAR(MAX),
  source NVARCHAR(50), -- 'phone', 'walk-in', 'online'
  
  -- Sync fields (critical for conflict resolution)
  client_timestamp DATETIME2, -- When client device saved it
  server_timestamp DATETIME2 DEFAULT GETDATE(),
  sync_version INT DEFAULT 1,
  device_id NVARCHAR(100),
  
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  created_by UNIQUEIDENTIFIER,
  deleted_at DATETIME2,
  
  INDEX idx_salon_appointments (salon_id, scheduled_start_time),
  INDEX idx_staff_appointments (staff_id, scheduled_start_time),
  INDEX idx_client_appointments (client_id),
  INDEX idx_sync (salon_id, server_timestamp, sync_version)
);

CREATE TABLE tickets (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  salon_id UNIQUEIDENTIFIER REFERENCES salons(id),
  appointment_id UNIQUEIDENTIFIER REFERENCES appointments(id),
  client_id UNIQUEIDENTIFIER REFERENCES clients(id),
  
  -- Ticket data
  services NVARCHAR(MAX) NOT NULL, -- JSON array
  products NVARCHAR(MAX) DEFAULT '[]', -- JSON array
  status NVARCHAR(50) DEFAULT 'in-service',
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  discount_reason NVARCHAR(MAX),
  tax DECIMAL(10,2) NOT NULL,
  tip DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Sync fields
  client_timestamp DATETIME2,
  server_timestamp DATETIME2 DEFAULT GETDATE(),
  sync_version INT DEFAULT 1,
  device_id NVARCHAR(100),
  
  created_at DATETIME2 DEFAULT GETDATE(),
  completed_at DATETIME2,
  created_by UNIQUEIDENTIFIER,
  
  INDEX idx_salon_tickets (salon_id, created_at),
  INDEX idx_client_tickets (client_id),
  INDEX idx_sync (salon_id, server_timestamp, sync_version)
);

CREATE TABLE transactions (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  salon_id UNIQUEIDENTIFIER REFERENCES salons(id),
  ticket_id UNIQUEIDENTIFIER REFERENCES tickets(id),
  client_id UNIQUEIDENTIFIER REFERENCES clients(id),
  
  -- Payment data
  amount DECIMAL(10,2) NOT NULL,
  tip DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method NVARCHAR(50) NOT NULL,
  payment_details NVARCHAR(MAX), -- JSON object
  status NVARCHAR(50) DEFAULT 'completed',
  
  -- Refund/Void
  voided_at DATETIME2,
  voided_by UNIQUEIDENTIFIER,
  void_reason NVARCHAR(MAX),
  refunded_at DATETIME2,
  refunded_amount DECIMAL(10,2),
  refund_reason NVARCHAR(MAX),
  
  -- Sync fields (CRITICAL - highest priority)
  client_timestamp DATETIME2,
  server_timestamp DATETIME2 DEFAULT GETDATE(),
  sync_version INT DEFAULT 1,
  device_id NVARCHAR(100),
  
  created_at DATETIME2 DEFAULT GETDATE(),
  processed_at DATETIME2 DEFAULT GETDATE(),
  
  INDEX idx_salon_transactions (salon_id, created_at),
  INDEX idx_ticket_transactions (ticket_id),
  INDEX idx_sync (salon_id, server_timestamp, sync_version)
);

CREATE TABLE services (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  salon_id UNIQUEIDENTIFIER REFERENCES salons(id),
  name NVARCHAR(255) NOT NULL,
  category NVARCHAR(100),
  description NVARCHAR(MAX),
  duration INT NOT NULL, -- minutes
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  taxable BIT DEFAULT 1,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  active BIT DEFAULT 1,
  
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  
  INDEX idx_salon_services (salon_id, active)
);

-- Sync queue table (for tracking offline changes)
CREATE TABLE sync_queue (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  salon_id UNIQUEIDENTIFIER REFERENCES salons(id),
  device_id NVARCHAR(100) NOT NULL,
  
  entity_type NVARCHAR(50) NOT NULL, -- 'appointment', 'ticket', etc.
  entity_id UNIQUEIDENTIFIER NOT NULL,
  action NVARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
  payload NVARCHAR(MAX) NOT NULL, -- JSON
  priority INT DEFAULT 5, -- 1=critical, 5=low
  
  status NVARCHAR(50) DEFAULT 'pending',
  attempts INT DEFAULT 0,
  last_attempt_at DATETIME2,
  error_message NVARCHAR(MAX),
  
  created_at DATETIME2 DEFAULT GETDATE(),
  processed_at DATETIME2,
  
  INDEX idx_pending (salon_id, status, priority, created_at),
  INDEX idx_device (device_id, status)
);

-- Audit log (track all changes)
CREATE TABLE audit_log (
  id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  salon_id UNIQUEIDENTIFIER REFERENCES salons(id),
  user_id UNIQUEIDENTIFIER,
  device_id NVARCHAR(100),
  
  entity_type NVARCHAR(50) NOT NULL,
  entity_id UNIQUEIDENTIFIER NOT NULL,
  action NVARCHAR(20) NOT NULL,
  changes NVARCHAR(MAX), -- JSON: {before: {...}, after: {...}}
  
  created_at DATETIME2 DEFAULT GETDATE(),
  
  INDEX idx_salon_audit (salon_id, created_at),
  INDEX idx_entity_audit (entity_type, entity_id)
);
```

---

## 🔄 Sync Strategy (Complete Implementation)

### **1. Client-Side IndexedDB Schema (Dexie.js)**

```typescript
// src/db/schema.ts
import Dexie, { Table } from 'dexie';

export interface Appointment {
  id: string;
  salonId: string;
  clientId: string;
  staffId: string;
  services: Service[];
  status: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  checkInTime?: Date;
  notes?: string;
  
  // Sync fields
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  clientTimestamp: number;
  serverTimestamp?: number;
  syncVersion: number;
  deviceId: string;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'appointment' | 'ticket' | 'transaction' | 'client';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: any;
  priority: number; // 1=critical, 5=low
  status: 'pending' | 'syncing' | 'failed';
  attempts: number;
  createdAt: number;
  errorMessage?: string;
}

class MangoBizDatabase extends Dexie {
  appointments!: Table<Appointment>;
  tickets!: Table<Ticket>;
  transactions!: Table<Transaction>;
  clients!: Table<Client>;
  staff!: Table<Staff>;
  services!: Table<Service>;
  syncQueue!: Table<SyncQueueItem>;
  settings!: Table<Setting>;

  constructor() {
    super('MangoBizDB');
    
    this.version(1).stores({
      appointments: 'id, salonId, clientId, staffId, scheduledStartTime, status, syncStatus, serverTimestamp',
      tickets: 'id, salonId, clientId, status, syncStatus, createdAt',
      transactions: 'id, salonId, ticketId, clientId, syncStatus, createdAt',
      clients: 'id, salonId, phone, name, syncStatus',
      staff: 'id, salonId, status',
      services: 'id, salonId, category, active',
      syncQueue: 'id, status, priority, createdAt, entityType',
      settings: 'key'
    });
  }
}

export const db = new MangoBizDatabase();
```

### **2. Sync Queue Manager**

```typescript
// src/sync/syncManager.ts
import { db, SyncQueueItem } from '../db/schema';
import { api } from '../api/client';

class SyncManager {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  // Start automatic sync (every 30 seconds when online)
  startAutoSync() {
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncAll();
      }
    }, 30000);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }

  // Add item to sync queue
  async queueSync(
    entityType: string,
    entityId: string,
    action: 'create' | 'update' | 'delete',
    payload: any,
    priority: number = 5
  ) {
    const queueItem: SyncQueueItem = {
      id: crypto.randomUUID(),
      entityType,
      entityId,
      action,
      payload,
      priority,
      status: 'pending',
      attempts: 0,
      createdAt: Date.now()
    };

    await db.syncQueue.add(queueItem);
    
    // Try immediate sync if online
    if (navigator.onLine) {
      this.syncAll();
    }
  }

  // Sync all pending items
  async syncAll() {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    
    try {
      // Get pending items sorted by priority
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('pending')
        .or('status')
        .equals('failed')
        .sortBy('priority');

      console.log(`Syncing ${pendingItems.length} items...`);

      // Process in batches of 20
      const batchSize = 20;
      for (let i = 0; i < pendingItems.length; i += batchSize) {
        const batch = pendingItems.slice(i, i + batchSize);
        await this.syncBatch(batch);
      }

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync a batch of items
  private async syncBatch(items: SyncQueueItem[]) {
    try {
      // Send batch to server
      const response = await api.post('/sync/batch', {
        changes: items.map(item => ({
          id: item.id,
          entityType: item.entityType,
          entityId: item.entityId,
          action: item.action,
          payload: item.payload
        }))
      });

      const { success, conflicts, errors } = response.data;

      // Handle successful syncs
      for (const successId of success) {
        await db.syncQueue.delete(successId);
        
        // Update entity sync status
        const item = items.find(i => i.id === successId);
        if (item) {
          await this.updateEntitySyncStatus(
            item.entityType,
            item.entityId,
            'synced'
          );
        }
      }

      // Handle conflicts
      for (const conflict of conflicts) {
        await this.handleConflict(conflict);
      }

      // Handle errors
      for (const error of errors) {
        const item = items.find(i => i.id === error.id);
        if (item) {
          await db.syncQueue.update(error.id, {
            status: 'failed',
            attempts: item.attempts + 1,
            errorMessage: error.message
          });
        }
      }

    } catch (error) {
      // Network error - mark all as failed
      for (const item of items) {
        await db.syncQueue.update(item.id, {
          status: 'failed',
          attempts: item.attempts + 1,
          errorMessage: error.message
        });
      }
    }
  }

  // Handle sync conflicts
  private async handleConflict(conflict: any) {
    const { entityType, entityId, localVersion, serverVersion } = conflict;
    
    // Apply conflict resolution rules
    switch (entityType) {
      case 'transaction':
        // Server always wins for transactions
        await this.applyServerVersion(entityType, entityId, serverVersion);
        break;
        
      case 'appointment':
        // Last write wins based on timestamp
        if (serverVersion.serverTimestamp > localVersion.clientTimestamp) {
          await this.applyServerVersion(entityType, entityId, serverVersion);
        }
        break;
        
      default:
        // Prompt user for manual resolution
        await this.promptManualResolution(conflict);
    }
  }

  // Update entity sync status in IndexedDB
  private async updateEntitySyncStatus(
    entityType: string,
    entityId: string,
    status: 'synced' | 'conflict' | 'error'
  ) {
    const table = db[`${entityType}s`];
    await table.update(entityId, {
      syncStatus: status,
      serverTimestamp: Date.now()
    });
  }
}

export const syncManager = new SyncManager();
```

### **3. Backend Sync Endpoint**

```typescript
// backend/src/routes/sync.ts
import express from 'express';
import { prisma } from '../db';

const router = express.Router();

router.post('/batch', async (req, res) => {
  const { changes } = req.body;
  const { salonId, deviceId } = req.user; // From JWT

  const success: string[] = [];
  const conflicts: any[] = [];
  const errors: any[] = [];

  for (const change of changes) {
    try {
      const result = await processChange(change, salonId, deviceId);
      
      if (result.status === 'success') {
        success.push(change.id);
      } else if (result.status === 'conflict') {
        conflicts.push(result.conflict);
      }
    } catch (error) {
      errors.push({
        id: change.id,
        message: error.message
      });
    }
  }

  res.json({ success, conflicts, errors });
});

async function processChange(change: any, salonId: string, deviceId: string) {
  const { entityType, entityId, action, payload } = change;

  // Check for conflicts
  const existing = await prisma[entityType].findUnique({
    where: { id: entityId }
  });

  if (existing && action === 'create') {
    return {
      status: 'conflict',
      conflict: {
        entityType,
        entityId,
        reason: 'already_exists',
        serverVersion: existing
      }
    };
  }

  if (existing && action === 'update') {
    // Check timestamp conflict
    if (existing.serverTimestamp > payload.clientTimestamp) {
      return {
        status: 'conflict',
        conflict: {
          entityType,
          entityId,
          reason: 'timestamp_conflict',
          localVersion: payload,
          serverVersion: existing
        }
      };
    }
  }

  // No conflict - apply change
  switch (action) {
    case 'create':
      await prisma[entityType].create({
        data: {
          ...payload,
          salonId,
          deviceId,
          serverTimestamp: new Date()
        }
      });
      break;

    case 'update':
      await prisma[entityType].update({
        where: { id: entityId },
        data: {
          ...payload,
          serverTimestamp: new Date(),
          syncVersion: { increment: 1 }
        }
      });
      break;

    case 'delete':
      await prisma[entityType].update({
        where: { id: entityId },
        data: { deletedAt: new Date() }
      });
      break;
  }

  // Broadcast to other devices via WebSocket
  io.to(`salon:${salonId}`).emit(`${entityType}:${action}`, {
    entityId,
    data: payload,
    deviceId
  });

  return { status: 'success' };
}

export default router;
```

---

## 🎯 Implementation Phases

### **Phase 1: Foundation (Weeks 1-2)**
```
✅ Set up project structure
✅ Install all dependencies
✅ Configure TypeScript, ESLint, Prettier
✅ Set up Docker Compose for local dev
✅ Create PostgreSQL schema
✅ Set up Prisma ORM
✅ Create basic Express API
✅ Set up authentication (JWT)
✅ Create React app with Vite
✅ Set up Tailwind CSS
```

### **Phase 2: Core Features (Weeks 3-6)**
```
✅ Implement Book module (appointments)
✅ Implement Front Desk module
✅ Implement Checkout module
✅ Implement Transactions module
✅ Basic CRUD operations (online only)
✅ Real-time updates via Socket.io
```

### **Phase 3: Offline Infrastructure (Weeks 7-9)**
```
✅ Set up IndexedDB with Dexie.js
✅ Implement sync queue system
✅ Create Service Worker
✅ Implement background sync
✅ Add conflict resolution logic
✅ Comprehensive offline testing
```

### **Phase 4: Polish & Testing (Weeks 10-12)**
```
✅ UI/UX refinements
✅ Error handling improvements
✅ Performance optimization
✅ Unit tests (80%+ coverage)
✅ Integration tests
✅ End-to-end tests
✅ Load testing
✅ Security audit
```

### **Phase 5: Launch Prep (Week 13)**
```
✅ Documentation
✅ Deployment setup
✅ Monitoring setup
✅ Beta testing
✅ Bug fixes
✅ Launch! 🚀
```

---

## 💰 Cost Estimate

### **Development Costs (13 weeks)**
- Frontend Developer: $100-150/hour × 500 hours = **$50,000-75,000**
- Backend Developer: $100-150/hour × 400 hours = **$40,000-60,000**
- DevOps: $120-180/hour × 80 hours = **$9,600-14,400**
- **Total Development: $99,600-149,400**

### **Infrastructure Costs (Monthly)**
- AWS/Render.com Hosting: $200-500/month
- Database (RDS): $100-300/month
- Redis Cache: $50-100/month
- CDN (CloudFront): $50-100/month
- Monitoring (Sentry): $50/month
- **Total Infrastructure: $450-1,050/month**

### **One-Time Costs**
- Design: $5,000-10,000
- Payment gateway setup: $500-1,000
- SSL certificates: $100/year
- Domain: $50/year

---

## 🚀 Final Recommendation

### **BUILD WITH FULL OFFLINE-FIRST ARCHITECTURE**

**Why:**
1. ✅ **Critical for business** - Salons can't afford downtime
2. ✅ **Competitive advantage** - Major differentiator
3. ✅ **Future-proof** - Won't need to rebuild later
4. ✅ **Better UX** - Fast, responsive, reliable
5. ✅ **Higher value** - Can charge premium pricing

**Trade-offs:**
- ❌ Takes 3 months instead of 1 month
- ❌ More complex to build and maintain
- ❌ Higher initial cost

**But the ROI is clear:**
- 💰 Prevents $1,200-3,000/year downtime cost per salon
- 💰 Major selling point = higher conversion
- 💰 Can charge 20-30% premium vs competitors
- 💰 Lower churn = higher LTV

---

## 📚 Next Steps

1. **Set up development environment** (1 day)
2. **Create project repositories** (frontend + backend)
3. **Initialize tech stack** (2 days)
4. **Build authentication system** (3-4 days)
5. **Start with Book module** (1 week)
6. **Iterate through other modules** (4-5 weeks)
7. **Implement offline sync** (2-3 weeks)
8. **Testing and polish** (2 weeks)
9. **Launch! 🚀**

---

Want me to create:
1. **Detailed project setup guide** (step-by-step instructions)
2. **Starter code templates** (boilerplate for frontend + backend)
3. **Database migration scripts** (complete schema setup)
4. **API endpoint specifications** (full REST API documentation)

Which would be most helpful to get started?