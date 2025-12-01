# Mango POS Data Storage Strategy v2.0

## Overview

This document defines how data should be stored across local (IndexedDB/Dexie.js) and cloud (Supabase/PostgreSQL) storage based on offline-first architecture principles for the Mango Biz platform.

### Design Principles

1. **Offline-First**: Local storage is the primary data source; cloud is the sync target
2. **Reliability Over Speed**: Data integrity trumps sync performance
3. **Eventual Consistency**: Most data syncs eventually; financial data requires confirmation
4. **Conflict Awareness**: Detect and resolve conflicts intelligently, not arbitrarily
5. **Audit Everything**: All mutations are traceable to user, device, and time

---

## Table of Contents

1. [Data Storage Categories](#1-data-storage-categories)
2. [Core Entity Schemas](#2-core-entity-schemas)
3. [Sync Architecture](#3-sync-architecture)
4. [Conflict Resolution](#4-conflict-resolution)
5. [Security & Encryption](#5-security--encryption)
6. [Data Retention & Purge](#6-data-retention--purge)
7. [IndexedDB Schema & Migrations](#7-indexeddb-schema--migrations)
8. [Performance Optimization](#8-performance-optimization)
9. [Implementation Guidelines](#9-implementation-guidelines)

---

## 1. Data Storage Categories

### 1.1 LOCAL ONLY (Device-Specific)

Data that stays on the device and is never synced to the cloud.

| Data | Storage | Purpose | Reason for Local-Only |
|------|---------|---------|----------------------|
| **UI Preferences** | localStorage | Sidebar width, view modes, card scales | Device-specific user preference |
| **Sync Queue** | IndexedDB `syncQueue` | Pending operations awaiting sync | Transient data, cleared after sync |
| **Device Fingerprint** | Generated at runtime | Unique device identification | Security - never transmitted fully |
| **Session Tokens** | Secure IndexedDB | Auth tokens, refresh tokens | Security - device-bound |
| **Last Sync Checkpoint** | IndexedDB `syncMeta` | Track sync position per entity | Device-specific sync state |
| **Cached Defaults** | IndexedDB `settings` | Store defaults after first login | Performance optimization |
| **Draft Data** | Redux state only | Unsaved forms, partial entries | Not persisted until user saves |
| **Failed Sync Logs** | IndexedDB `syncErrors` | Debugging failed operations | Device-specific troubleshooting |
| **Conflict Snapshots** | IndexedDB `conflicts` | Preserve both versions for review | Manual resolution support |

**localStorage Keys (UI Only):**
```typescript
const LOCAL_STORAGE_KEYS = {
  // Sidebar preferences
  staffSidebarViewMode: 'staffSidebarViewMode',
  staffSidebarWidth: 'staffSidebarWidth',
  staffSidebarWidthPercentage: 'staffSidebarWidthPercentage',

  // Card/view preferences
  serviceCardScale: 'serviceCardScale',
  teamSettings: 'teamSettings',

  // Store-specific (prefixed with storeId)
  viewMode: (storeId: string) => `${storeId}ViewMode`,
  cardViewMode: (storeId: string) => `${storeId}CardViewMode`,
  minimizedLineView: (storeId: string) => `${storeId}MinimizedLineView`,
} as const;
```

---

### 1.2 LOCAL + CLOUD (Synced Data)

Operational data that lives locally first, then syncs to cloud. This is the core offline-first data.

| Data | Local Storage | Cloud Storage | Sync Direction | Conflict Strategy |
|------|---------------|---------------|----------------|-------------------|
| **Appointments** | IndexedDB | PostgreSQL | Bidirectional | Field-Merge |
| **Tickets** | IndexedDB | PostgreSQL | Bidirectional | Field-Merge |
| **Transactions** | IndexedDB | PostgreSQL | Bidirectional | **Server-Wins** |
| **Clients** | IndexedDB | PostgreSQL | Bidirectional | Field-Merge |
| **Staff** | IndexedDB | PostgreSQL | Bidirectional | Last-Write-Wins |
| **Services** | IndexedDB | PostgreSQL | Bidirectional | Server-Wins |
| **Products** | IndexedDB | PostgreSQL | Bidirectional | Server-Wins |
| **Inventory** | IndexedDB | PostgreSQL | Bidirectional | **Server-Wins** |

**Sync Priority Levels:**
```typescript
const SYNC_PRIORITIES = {
  CRITICAL: 1,    // Transactions, payments - must sync ASAP
  HIGH: 2,        // Appointments, tickets - business critical
  NORMAL: 3,      // Clients, staff - important but deferrable
  LOW: 4,         // Services, products - reference data
  BACKGROUND: 5,  // Analytics, preferences - sync when idle
} as const;
```

---

### 1.3 CLOUD ONLY (Admin/Control Center)

Data that exists only in the cloud, accessed via API. Never stored locally on POS devices.

| Data | Purpose | Access Pattern | Justification |
|------|---------|----------------|---------------|
| **Tenants** | Business/organization accounts | Admin Portal only | Multi-tenant isolation |
| **Licenses** | License keys, tiers, limits | Validate at login | Security - prevent tampering |
| **Stores** | Store registrations, credentials | Validate at login | Authoritative source |
| **Admin Users** | Control center administrators | Admin Portal only | Separate auth domain |
| **Audit Logs** | All actions tracked | Write-only from stores | Immutable, centralized |
| **Feature Flags** | Global feature toggles | Fetch at startup | Consistent rollouts |
| **Announcements** | System-wide notifications | Fetch on demand | Centralized messaging |
| **Surveys** | Feedback collection forms | Fetch on demand | Campaign management |
| **Survey Responses** | User feedback submissions | Write-only from stores | Analytics aggregation |
| **System Config** | Default settings templates | Fetch once at setup | Single source of truth |
| **Sync Checkpoints** | Server-side sync tracking | Internal use | Consistency verification |
| **Device Registry** | Registered device inventory | Admin Portal | Security management |

---

### 1.4 HYBRID DATA (Cached from Cloud)

Data fetched from cloud but cached locally for performance. Uses stale-while-revalidate pattern.

| Data | Cache Location | Cache Duration | Refresh Trigger | Staleness Handling |
|------|----------------|----------------|-----------------|-------------------|
| **License Tier** | secureStorage | 7 days grace | Online validation | Block after grace |
| **Store Defaults** | secureStorage | Until explicit reset | First login only | N/A |
| **Store Name** | localStorage | Session | Each login | Show cached |
| **Feature Flags** | IndexedDB | 1 hour | App startup + interval | Stale-while-revalidate |
| **Member Permissions** | IndexedDB | Session | Each login | Must be fresh |
| **Service Categories** | IndexedDB | 24 hours | Manual refresh | Stale-while-revalidate |
| **Tax Rates** | IndexedDB | 24 hours | Manual refresh | Must be fresh for checkout |

**Cache Entry Structure:**
```typescript
interface CacheEntry<T> {
  key: string;
  data: T;
  fetchedAt: number;        // Unix timestamp
  expiresAt: number;        // Unix timestamp
  etag?: string;            // For conditional requests (If-None-Match)
  lastModified?: string;    // For conditional requests (If-Modified-Since)
  staleWhileRevalidate: boolean;
  version: number;          // Schema version for migrations
}

// Cache configuration per data type
const CACHE_CONFIG = {
  featureFlags: {
    maxAge: 60 * 60 * 1000,           // 1 hour
    staleWhileRevalidate: true,
    backgroundRefresh: true,
  },
  taxRates: {
    maxAge: 24 * 60 * 60 * 1000,      // 24 hours
    staleWhileRevalidate: false,       // Must be fresh for checkout
    backgroundRefresh: false,
  },
  serviceCategories: {
    maxAge: 24 * 60 * 60 * 1000,
    staleWhileRevalidate: true,
    backgroundRefresh: true,
  },
} as const;
```

---

## 2. Core Entity Schemas

### 2.1 Base Syncable Entity

All synced entities extend this base interface:

```typescript
interface BaseSyncableEntity {
  // Primary key
  id: string;                         // UUID v4

  // Multi-tenant isolation
  tenantId: string;
  storeId: string;
  locationId?: string;

  // Sync metadata
  syncStatus: SyncStatus;
  version: number;                    // Monotonic counter, increments on each change
  vectorClock: Record<string, number>; // { deviceId: lastSeenVersion }
  lastSyncedVersion: number;          // Version when last successfully synced

  // Timestamps
  createdAt: string;                  // ISO 8601
  updatedAt: string;                  // ISO 8601

  // Audit trail
  createdBy: string;                  // User ID
  createdByDevice: string;            // Device ID
  lastModifiedBy: string;             // User ID
  lastModifiedByDevice: string;       // Device ID

  // Soft delete (tombstone)
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByDevice?: string;
  tombstoneExpiresAt?: string;        // When to hard-delete
}

type SyncStatus =
  | 'local'      // Created locally, never synced
  | 'synced'     // Successfully synced with server
  | 'pending'    // Has local changes awaiting sync
  | 'syncing'    // Currently being synced
  | 'conflict'   // Server has different version, needs resolution
  | 'error';     // Sync failed, needs retry or intervention

// Version increment helper
function incrementVersion(entity: BaseSyncableEntity, deviceId: string): void {
  entity.version += 1;
  entity.vectorClock[deviceId] = entity.version;
  entity.updatedAt = new Date().toISOString();
  entity.syncStatus = 'pending';
}
```

---

### 2.2 APPOINTMENTS

```typescript
interface Appointment extends BaseSyncableEntity {
  // Client reference
  clientId: string | null;            // Null for walk-ins
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;

  // Staff assignment
  staffId: string;
  staffName: string;                  // Denormalized for offline display

  // Services (embedded for offline access)
  services: AppointmentService[];

  // Scheduling
  scheduledStartTime: string;         // ISO 8601
  scheduledEndTime: string;           // ISO 8601
  duration: number;                   // Minutes (calculated from services)

  // Status tracking
  status: AppointmentStatus;
  statusHistory: StatusChange[];      // Audit trail of status changes

  // Actual timing (for analytics)
  checkInTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;

  // Metadata
  source: AppointmentSource;
  notes?: string;
  internalNotes?: string;             // Staff-only notes
  tags?: string[];

  // Linked ticket (after checkout)
  ticketId?: string;
}

interface AppointmentService {
  serviceId: string;
  serviceName: string;
  duration: number;
  price: number;
  staffId?: string;                   // Override staff for specific service
  status: ServiceStatus;
  startedAt?: string;
  completedAt?: string;
}

type AppointmentStatus =
  | 'pending'      // Awaiting confirmation
  | 'confirmed'    // Confirmed by client or staff
  | 'checked_in'   // Client has arrived
  | 'in_progress'  // Service started
  | 'completed'    // Service finished, awaiting checkout
  | 'checked_out'  // Payment complete
  | 'cancelled'    // Cancelled before service
  | 'no_show';     // Client didn't arrive

type ServiceStatus = 'not_started' | 'in_progress' | 'paused' | 'completed';

type AppointmentSource = 'walk_in' | 'phone' | 'online' | 'app' | 'kiosk' | 'recurring';

interface StatusChange {
  from: AppointmentStatus;
  to: AppointmentStatus;
  changedAt: string;
  changedBy: string;
  changedByDevice: string;
  reason?: string;
}

// IndexedDB indexes for efficient queries
const APPOINTMENT_INDEXES = [
  'id',
  'storeId',
  'clientId',
  'staffId',
  'status',
  'scheduledStartTime',
  '[storeId+status]',
  '[storeId+scheduledStartTime]',
  '[staffId+scheduledStartTime]',
  '[clientId+createdAt]',
  '[storeId+isDeleted]',
];
```

---

### 2.3 TICKETS

```typescript
interface Ticket extends BaseSyncableEntity {
  // Ticket identification
  ticketNumber: string;               // Human-readable (e.g., "T-20251130-001")

  // Client reference
  clientId: string | null;
  clientName: string;
  clientPhone?: string;

  // Group ticket support
  isGroupTicket: boolean;
  clients?: TicketClient[];           // For group tickets

  // Linked appointment
  appointmentId?: string;

  // Line items
  services: TicketService[];
  products: TicketProduct[];

  // Pricing
  subtotal: number;                   // Sum of all items before discounts
  discounts: TicketDiscount[];
  discountTotal: number;              // Sum of all discounts
  taxableAmount: number;              // Subtotal - non-taxable items
  taxRate: number;                    // Tax percentage at time of ticket
  taxAmount: number;                  // Calculated tax
  tipAmount: number;
  total: number;                      // Final amount due

  // Payment tracking
  payments: TicketPayment[];
  amountPaid: number;
  amountDue: number;                  // total - amountPaid

  // Status
  status: TicketStatus;

  // Timestamps
  openedAt: string;
  completedAt?: string;

  // Merge tracking
  isMergedTicket: boolean;
  mergedFromTickets?: string[];       // Original ticket IDs
  mergedIntoTicket?: string;          // If this ticket was merged elsewhere
}

interface TicketClient {
  clientId: string;
  clientName: string;
  isPrimary: boolean;
}

interface TicketService {
  id: string;                         // Line item ID
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
  taxable: boolean;
  commissionRate: number;             // Staff commission percentage
  notes?: string;
}

interface TicketProduct {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  staffId?: string;                   // Staff who sold it (for commission)
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
  taxable: boolean;
  commissionRate: number;
}

interface TicketDiscount {
  id: string;
  type: 'percentage' | 'fixed' | 'promo_code' | 'membership' | 'package';
  name: string;
  code?: string;                      // Promo code if applicable
  value: number;                      // Percentage or fixed amount
  amount: number;                     // Calculated discount amount
  appliedTo: 'ticket' | 'service' | 'product';
  appliedToId?: string;               // Service or product line item ID
  approvedBy?: string;                // Manager who approved (if required)
}

interface TicketPayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  tipAmount: number;
  transactionId?: string;             // Reference to Transaction entity
  processedAt: string;
  processedBy: string;

  // Card-specific (if applicable)
  cardBrand?: string;
  cardLast4?: string;

  // Gift card specific
  giftCardCode?: string;
  giftCardBalance?: number;           // Remaining balance after payment
}

type PaymentMethod =
  | 'cash'
  | 'card'
  | 'gift_card'
  | 'store_credit'
  | 'membership_credit'
  | 'package_credit'
  | 'check'
  | 'external';                       // Venmo, PayPal, etc.

type TicketStatus =
  | 'open'        // In progress
  | 'pending'     // Awaiting payment
  | 'paid'        // Fully paid
  | 'partial'     // Partially paid
  | 'voided'      // Cancelled/voided
  | 'refunded';   // Fully refunded

// IndexedDB indexes
const TICKET_INDEXES = [
  'id',
  'ticketNumber',
  'storeId',
  'clientId',
  'appointmentId',
  'status',
  'createdAt',
  '[storeId+status]',
  '[storeId+createdAt]',
  '[clientId+createdAt]',
];
```

---

### 2.4 TRANSACTIONS

**Critical: Server-Wins conflict resolution for financial integrity.**

```typescript
interface Transaction extends BaseSyncableEntity {
  // Reference
  ticketId: string;
  ticketNumber: string;

  // Client
  clientId: string | null;
  clientName: string;

  // Financial summary (snapshot at payment time)
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  tipAmount: number;
  total: number;

  // Payment details
  paymentMethod: PaymentMethod;
  amount: number;                     // Amount for this transaction

  // Card processing details (if card payment)
  cardBrand?: string;
  cardLast4?: string;
  authorizationCode?: string;
  processorTransactionId?: string;    // Stripe/Square transaction ID
  processorFee?: number;

  // Gift card details (if gift card)
  giftCardCode?: string;
  giftCardPreviousBalance?: number;
  giftCardNewBalance?: number;

  // Status
  status: TransactionStatus;

  // Void/Refund tracking
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  refundedAt?: string;
  refundedBy?: string;
  refundAmount?: number;
  refundReason?: string;
  refundTransactionId?: string;       // Reference to refund transaction
  originalTransactionId?: string;     // For refund transactions, reference to original

  // Service snapshot (for reporting)
  services: TransactionServiceSnapshot[];

  // Staff for tip distribution
  staffTipAllocations?: TipAllocation[];
}

interface TransactionServiceSnapshot {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  price: number;
  commissionRate: number;
  commissionAmount: number;
}

interface TipAllocation {
  staffId: string;
  staffName: string;
  amount: number;
  percentage: number;                 // Percentage of total tip
}

type TransactionStatus =
  | 'pending'      // Awaiting processing
  | 'processing'   // Being processed
  | 'completed'    // Successfully processed
  | 'failed'       // Processing failed
  | 'voided'       // Voided
  | 'refunded';    // Refunded

// IndexedDB indexes
const TRANSACTION_INDEXES = [
  'id',
  'ticketId',
  'ticketNumber',
  'storeId',
  'clientId',
  'status',
  'paymentMethod',
  'createdAt',
  '[storeId+createdAt]',
  '[storeId+status]',
  '[clientId+createdAt]',
];
```

---

### 2.5 CLIENTS

```typescript
interface Client extends BaseSyncableEntity {
  // Basic info
  firstName: string;
  lastName: string;
  displayName: string;                // Computed: firstName + lastName or preferred name
  preferredName?: string;

  // Contact
  email?: string;
  phone?: string;
  phoneSecondary?: string;

  // Profile
  avatar?: string;                    // URL or base64
  birthday?: string;                  // YYYY-MM-DD
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  pronouns?: string;

  // Address
  address?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  // Preferences
  preferredStaffIds?: string[];
  preferredServices?: string[];
  communicationPreference: 'email' | 'sms' | 'both' | 'none';

  // Notes and alerts
  notes?: string;                     // General notes
  allergies?: string;                 // Important: displayed as alert
  internalNotes?: string;             // Staff-only notes

  // Consent tracking
  smsOptIn: boolean;
  smsOptInAt?: string;
  emailOptIn: boolean;
  emailOptInAt?: string;
  marketingOptIn: boolean;

  // Loyalty and status
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints?: number;
  walletBalance?: number;             // Store credit

  // Activity metrics (denormalized for quick access)
  firstVisitAt?: string;
  lastVisitAt?: string;
  totalVisits: number;
  totalSpent: number;
  averageTicketValue: number;
  noShowCount: number;

  // Membership
  membershipId?: string;
  membershipStatus?: 'active' | 'paused' | 'cancelled' | 'expired';

  // Tags for segmentation
  tags?: string[];

  // Source tracking
  referralSource?: string;
  referredByClientId?: string;
}

// IndexedDB indexes
const CLIENT_INDEXES = [
  'id',
  'storeId',
  'email',
  'phone',
  'displayName',
  'lastVisitAt',
  '[storeId+displayName]',
  '[storeId+phone]',
  '[storeId+email]',
  '[storeId+lastVisitAt]',
  '[storeId+isDeleted]',
];
```

---

### 2.6 STAFF

```typescript
interface Staff extends BaseSyncableEntity {
  // Basic info
  firstName: string;
  lastName: string;
  displayName: string;

  // Contact
  email: string;
  phone?: string;

  // Profile
  avatar?: string;
  bio?: string;

  // Role and permissions
  role: StaffRole;
  permissions?: string[];             // Granular permissions
  pin?: string;                       // Hashed PIN for quick login

  // Employment
  employmentType: 'w2' | '1099' | 'owner';
  hireDate?: string;
  terminationDate?: string;

  // Service capabilities
  serviceIds: string[];               // Services this staff can perform
  specialties?: string[];
  certifications?: string[];
  staffLevel: 'junior' | 'senior' | 'master';

  // Schedule (denormalized for offline)
  defaultSchedule?: WeeklySchedule;

  // Current status (real-time)
  status: StaffStatus;
  clockedInAt?: string;
  clockedOutAt?: string;
  currentAppointmentId?: string;
  currentTicketId?: string;

  // Turn queue (for walk-ins)
  turnQueuePosition?: number;
  turnQueueLastServed?: string;

  // Daily metrics (reset daily)
  todayStats: {
    servicesCompleted: number;
    revenue: number;
    tips: number;
    hours: number;
  };

  // Commission
  commissionStructure: CommissionStructure;

  // Rating (optional)
  averageRating?: number;
  totalRatings?: number;
}

type StaffRole =
  | 'owner'
  | 'manager'
  | 'front_desk'
  | 'technician'
  | 'assistant';

type StaffStatus =
  | 'available'
  | 'busy'
  | 'on_break'
  | 'clocked_out';

interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

interface DaySchedule {
  isWorking: boolean;
  startTime?: string;                 // HH:mm
  endTime?: string;                   // HH:mm
  breaks?: { start: string; end: string }[];
}

interface CommissionStructure {
  type: 'flat' | 'tiered' | 'service_specific';
  defaultRate: number;                // Percentage
  tiers?: CommissionTier[];
  serviceRates?: Record<string, number>;
  productRate?: number;
  minimumGuarantee?: number;          // Hourly minimum
}

interface CommissionTier {
  minRevenue: number;
  maxRevenue?: number;
  rate: number;
}

// IndexedDB indexes
const STAFF_INDEXES = [
  'id',
  'storeId',
  'email',
  'role',
  'status',
  '[storeId+status]',
  '[storeId+role]',
  '[storeId+isDeleted]',
];
```

---

### 2.7 SERVICES

```typescript
interface Service extends BaseSyncableEntity {
  // Basic info
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;               // Denormalized

  // Identification
  sku?: string;

  // Timing
  duration: number;                   // Minutes
  bufferBefore?: number;              // Setup time
  bufferAfter?: number;               // Cleanup time
  processingTime?: number;            // e.g., color processing

  // Pricing
  price: number;
  tieredPricing?: {
    junior: number;
    senior: number;
    master: number;
  };

  // Commission
  commissionRate: number;             // Default commission percentage

  // Display
  displayOrder: number;
  color?: string;                     // For calendar display
  icon?: string;

  // Availability
  isActive: boolean;
  isBookableOnline: boolean;
  requiresDeposit: boolean;
  depositAmount?: number;

  // Requirements
  requiredStaffLevel?: 'junior' | 'senior' | 'master';
  requiredCertifications?: string[];

  // Linked supplies (for cost tracking)
  supplies?: {
    supplyId: string;
    quantity: number;
  }[];
}

// IndexedDB indexes
const SERVICE_INDEXES = [
  'id',
  'storeId',
  'categoryId',
  'isActive',
  'displayOrder',
  '[storeId+categoryId]',
  '[storeId+isActive]',
  '[storeId+isDeleted]',
];
```

---

## 3. Sync Architecture

### 3.1 Sync Queue Structure

```typescript
interface SyncOperation {
  id: string;                         // UUID

  // Operation details
  type: 'create' | 'update' | 'delete';
  entity: SyncableEntityType;
  entityId: string;
  payload: object;                    // Full entity data

  // Conflict prevention
  idempotencyKey: string;             // Unique key to prevent duplicate operations
  expectedVersion?: number;           // For optimistic locking

  // Priority and ordering
  priority: 1 | 2 | 3 | 4 | 5;
  dependsOn?: string[];               // Operation IDs that must complete first

  // Batching
  batchable: boolean;
  batchKey?: string;                  // Group key for batch API calls

  // Timing
  createdAt: string;
  scheduledFor?: string;              // Delayed sync

  // Retry management
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  backoffMs: number;                  // Current backoff duration

  // Status
  status: SyncOperationStatus;
  lastError?: string;
  errorCode?: string;

  // Device context
  deviceId: string;
  userId: string;
}

type SyncOperationStatus =
  | 'pending'      // Waiting to sync
  | 'scheduled'    // Scheduled for future sync
  | 'syncing'      // Currently being synced
  | 'success'      // Successfully synced
  | 'failed'       // Failed, will retry
  | 'abandoned'    // Max retries exceeded
  | 'conflict';    // Conflict detected, needs resolution

type SyncableEntityType =
  | 'appointment'
  | 'ticket'
  | 'transaction'
  | 'client'
  | 'staff'
  | 'service'
  | 'product';

// Generate idempotency key
function generateIdempotencyKey(
  type: string,
  entity: string,
  entityId: string,
  version: number
): string {
  return `${type}:${entity}:${entityId}:${version}:${Date.now()}`;
}
```

### 3.2 Sync Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER ACTION                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. UPDATE REDUX STATE (Optimistic UI)                          │
│     - Immediate feedback to user                                │
│     - UI reflects change instantly                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. PERSIST TO INDEXEDDB                                        │
│     - Increment version                                         │
│     - Update vectorClock                                        │
│     - Set syncStatus = 'pending'                                │
│     - Set updatedAt, lastModifiedBy                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. ADD TO SYNC QUEUE                                           │
│     - Generate idempotencyKey                                   │
│     - Set priority based on entity type                         │
│     - Check dependencies                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. SYNC PROCESSOR (Background)                                 │
│     - Check online status                                       │
│     - Process queue by priority                                 │
│     - Batch compatible operations                               │
│     - Handle dependencies                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐         ┌──────────────────────┐
│  ONLINE: Sync Now    │         │  OFFLINE: Queue      │
│  - Send to API       │         │  - Persist queue     │
│  - Handle response   │         │  - Monitor network   │
│  - Update status     │         │  - Sync when online  │
└──────────────────────┘         └──────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. HANDLE RESPONSE                                             │
│     ┌─────────────┬─────────────┬─────────────┐                │
│     │   SUCCESS   │   CONFLICT  │    ERROR    │                │
│     │             │             │             │                │
│     │ - Update    │ - Mark      │ - Increment │                │
│     │   syncStatus│   conflict  │   attempts  │                │
│     │   = synced  │ - Store     │ - Calculate │                │
│     │ - Update    │   server    │   backoff   │                │
│     │   lastSynced│   version   │ - Schedule  │                │
│     │   Version   │ - Trigger   │   retry     │                │
│     │ - Remove    │   resolution│ - Log error │                │
│     │   from queue│             │             │                │
│     └─────────────┴─────────────┴─────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Sync Checkpoint Management

```typescript
interface SyncCheckpoint {
  entity: SyncableEntityType;
  lastSyncedAt: string;               // ISO 8601
  lastSyncedId?: string;              // For cursor-based pagination
  serverTimestamp?: string;           // Server's last known timestamp
  checksum?: string;                  // For data integrity verification
}

// Store checkpoints per entity type
const syncCheckpoints: Map<SyncableEntityType, SyncCheckpoint> = new Map();

// Pull changes since last checkpoint
async function pullChanges(entity: SyncableEntityType): Promise<void> {
  const checkpoint = syncCheckpoints.get(entity);

  const response = await api.get(`/sync/${entity}`, {
    params: {
      since: checkpoint?.lastSyncedAt,
      cursor: checkpoint?.lastSyncedId,
    },
  });

  for (const item of response.data.items) {
    await mergeServerChange(entity, item);
  }

  // Update checkpoint
  syncCheckpoints.set(entity, {
    entity,
    lastSyncedAt: response.data.serverTimestamp,
    lastSyncedId: response.data.lastId,
    serverTimestamp: response.data.serverTimestamp,
  });
}
```

### 3.4 Retry Strategy with Exponential Backoff

```typescript
const RETRY_CONFIG = {
  maxAttempts: 5,
  initialBackoffMs: 1000,             // 1 second
  maxBackoffMs: 300000,               // 5 minutes
  backoffMultiplier: 2,
  jitterFactor: 0.1,                  // 10% random jitter
};

function calculateNextRetry(attempts: number): number {
  const baseBackoff = Math.min(
    RETRY_CONFIG.initialBackoffMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempts),
    RETRY_CONFIG.maxBackoffMs
  );

  // Add jitter to prevent thundering herd
  const jitter = baseBackoff * RETRY_CONFIG.jitterFactor * Math.random();

  return baseBackoff + jitter;
}

async function processWithRetry(operation: SyncOperation): Promise<void> {
  try {
    await syncToServer(operation);
    await markOperationSuccess(operation.id);
  } catch (error) {
    operation.attempts += 1;
    operation.lastAttemptAt = new Date().toISOString();
    operation.lastError = error.message;

    if (operation.attempts >= RETRY_CONFIG.maxAttempts) {
      operation.status = 'abandoned';
      await notifyAdminOfFailure(operation);
    } else {
      operation.status = 'failed';
      operation.backoffMs = calculateNextRetry(operation.attempts);
      operation.nextRetryAt = new Date(Date.now() + operation.backoffMs).toISOString();
    }

    await updateSyncOperation(operation);
  }
}
```

---

## 4. Conflict Resolution

### 4.1 Conflict Detection

```typescript
interface ConflictInfo {
  entityType: SyncableEntityType;
  entityId: string;
  localVersion: number;
  serverVersion: number;
  localData: object;
  serverData: object;
  conflictingFields: string[];
  detectedAt: string;
  deviceId: string;
}

function detectConflict(
  local: BaseSyncableEntity,
  server: BaseSyncableEntity
): ConflictInfo | null {
  // No conflict if server version matches what we last synced
  if (server.version === local.lastSyncedVersion) {
    return null;
  }

  // Check vector clocks for concurrent modifications
  const hasConflict = Object.entries(local.vectorClock).some(([deviceId, localVersion]) => {
    const serverVersion = server.vectorClock[deviceId] || 0;
    return localVersion > serverVersion && server.version > local.lastSyncedVersion;
  });

  if (!hasConflict) {
    return null;
  }

  // Identify conflicting fields
  const conflictingFields = findConflictingFields(local, server);

  return {
    entityType: getEntityType(local),
    entityId: local.id,
    localVersion: local.version,
    serverVersion: server.version,
    localData: local,
    serverData: server,
    conflictingFields,
    detectedAt: new Date().toISOString(),
    deviceId: getDeviceId(),
  };
}

function findConflictingFields(local: object, server: object): string[] {
  const conflicts: string[] = [];
  const allKeys = new Set([...Object.keys(local), ...Object.keys(server)]);

  for (const key of allKeys) {
    // Skip metadata fields
    if (['version', 'vectorClock', 'syncStatus', 'updatedAt'].includes(key)) {
      continue;
    }

    if (!deepEqual(local[key], server[key])) {
      conflicts.push(key);
    }
  }

  return conflicts;
}
```

### 4.2 Conflict Resolution Strategies

```typescript
type ConflictStrategy =
  | 'server-wins'       // Always accept server version
  | 'client-wins'       // Always accept local version
  | 'last-write-wins'   // Compare timestamps
  | 'field-merge'       // Merge at field level
  | 'manual';           // Require user intervention

interface ConflictResolutionConfig {
  entity: SyncableEntityType;
  defaultStrategy: ConflictStrategy;
  fieldRules?: Record<string, FieldConflictRule>;
}

type FieldConflictRule =
  | 'server'           // Always use server value
  | 'client'           // Always use client value
  | 'latest'           // Use most recent value
  | 'merge-array'      // Union of arrays
  | 'merge-concat'     // Concatenate strings
  | 'sum'              // Sum numeric values
  | 'max'              // Use maximum value
  | 'min'              // Use minimum value
  | 'manual';          // Flag for manual resolution

// Configuration per entity type
const CONFLICT_RESOLUTION_CONFIG: Record<SyncableEntityType, ConflictResolutionConfig> = {
  appointment: {
    entity: 'appointment',
    defaultStrategy: 'field-merge',
    fieldRules: {
      status: 'latest',
      statusHistory: 'merge-array',
      notes: 'merge-concat',
      internalNotes: 'merge-concat',
      services: 'merge-array',
      checkInTime: 'server',
      actualStartTime: 'server',
      actualEndTime: 'server',
      scheduledStartTime: 'latest',
      scheduledEndTime: 'latest',
      staffId: 'latest',
      clientId: 'server',
    },
  },

  ticket: {
    entity: 'ticket',
    defaultStrategy: 'field-merge',
    fieldRules: {
      status: 'latest',
      services: 'merge-array',
      products: 'merge-array',
      discounts: 'merge-array',
      payments: 'server',           // Server is authoritative for payments
      subtotal: 'server',
      total: 'server',
      amountPaid: 'server',
      amountDue: 'server',
    },
  },

  transaction: {
    entity: 'transaction',
    defaultStrategy: 'server-wins', // Financial data - server is authoritative
    fieldRules: {},
  },

  client: {
    entity: 'client',
    defaultStrategy: 'field-merge',
    fieldRules: {
      totalVisits: 'max',
      totalSpent: 'max',
      lastVisitAt: 'latest',
      notes: 'merge-concat',
      tags: 'merge-array',
      preferredStaffIds: 'merge-array',
      // Contact info - latest wins
      email: 'latest',
      phone: 'latest',
      address: 'latest',
    },
  },

  staff: {
    entity: 'staff',
    defaultStrategy: 'last-write-wins',
    fieldRules: {
      todayStats: 'server',         // Server aggregates stats
      status: 'server',             // Server tracks real-time status
      clockedInAt: 'server',
      clockedOutAt: 'server',
    },
  },

  service: {
    entity: 'service',
    defaultStrategy: 'server-wins', // Reference data - server is authoritative
    fieldRules: {},
  },

  product: {
    entity: 'product',
    defaultStrategy: 'server-wins',
    fieldRules: {},
  },
};
```

### 4.3 Conflict Resolution Implementation

```typescript
async function resolveConflict(
  conflict: ConflictInfo
): Promise<BaseSyncableEntity> {
  const config = CONFLICT_RESOLUTION_CONFIG[conflict.entityType];

  switch (config.defaultStrategy) {
    case 'server-wins':
      return conflict.serverData as BaseSyncableEntity;

    case 'client-wins':
      return conflict.localData as BaseSyncableEntity;

    case 'last-write-wins':
      return resolveByTimestamp(conflict);

    case 'field-merge':
      return resolveByFieldMerge(conflict, config.fieldRules || {});

    case 'manual':
      await storeConflictForManualResolution(conflict);
      throw new ManualResolutionRequired(conflict);
  }
}

function resolveByTimestamp(conflict: ConflictInfo): BaseSyncableEntity {
  const local = conflict.localData as BaseSyncableEntity;
  const server = conflict.serverData as BaseSyncableEntity;

  return new Date(local.updatedAt) > new Date(server.updatedAt)
    ? local
    : server;
}

function resolveByFieldMerge(
  conflict: ConflictInfo,
  fieldRules: Record<string, FieldConflictRule>
): BaseSyncableEntity {
  const local = conflict.localData as BaseSyncableEntity;
  const server = conflict.serverData as BaseSyncableEntity;
  const merged = { ...server };       // Start with server as base

  for (const field of conflict.conflictingFields) {
    const rule = fieldRules[field] || 'latest';
    merged[field] = resolveField(local[field], server[field], rule, local, server);
  }

  // Update metadata
  merged.version = Math.max(local.version, server.version) + 1;
  merged.vectorClock = mergeVectorClocks(local.vectorClock, server.vectorClock);
  merged.updatedAt = new Date().toISOString();
  merged.syncStatus = 'pending';

  return merged;
}

function resolveField(
  localValue: any,
  serverValue: any,
  rule: FieldConflictRule,
  local: BaseSyncableEntity,
  server: BaseSyncableEntity
): any {
  switch (rule) {
    case 'server':
      return serverValue;

    case 'client':
      return localValue;

    case 'latest':
      return new Date(local.updatedAt) > new Date(server.updatedAt)
        ? localValue
        : serverValue;

    case 'merge-array':
      return mergeArrays(localValue || [], serverValue || []);

    case 'merge-concat':
      if (localValue === serverValue) return localValue;
      return `${serverValue || ''}\n---\n${localValue || ''}`.trim();

    case 'sum':
      return (localValue || 0) + (serverValue || 0);

    case 'max':
      return Math.max(localValue || 0, serverValue || 0);

    case 'min':
      return Math.min(localValue || 0, serverValue || 0);

    default:
      return serverValue;
  }
}

function mergeArrays(local: any[], server: any[]): any[] {
  const merged = [...server];
  const serverIds = new Set(server.map(item => item.id || item));

  for (const item of local) {
    const itemId = item.id || item;
    if (!serverIds.has(itemId)) {
      merged.push(item);
    }
  }

  return merged;
}

function mergeVectorClocks(
  local: Record<string, number>,
  server: Record<string, number>
): Record<string, number> {
  const merged: Record<string, number> = {};
  const allDevices = new Set([...Object.keys(local), ...Object.keys(server)]);

  for (const device of allDevices) {
    merged[device] = Math.max(local[device] || 0, server[device] || 0);
  }

  return merged;
}
```

### 4.4 Manual Conflict Resolution UI Support

```typescript
interface ConflictSnapshot {
  id: string;
  conflict: ConflictInfo;
  status: 'pending' | 'resolved' | 'dismissed';
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: 'local' | 'server' | 'merged' | 'custom';
  resolvedData?: object;
  createdAt: string;
}

// Store conflicts for UI display
async function storeConflictForManualResolution(conflict: ConflictInfo): Promise<void> {
  const snapshot: ConflictSnapshot = {
    id: generateUUID(),
    conflict,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await db.conflicts.put(snapshot);

  // Notify UI
  emitEvent('conflict:detected', snapshot);
}

// Resolve conflict from UI
async function resolveConflictManually(
  snapshotId: string,
  resolution: 'local' | 'server' | 'merged',
  customData?: object
): Promise<void> {
  const snapshot = await db.conflicts.get(snapshotId);
  if (!snapshot) throw new Error('Conflict not found');

  let resolvedData: object;

  switch (resolution) {
    case 'local':
      resolvedData = snapshot.conflict.localData;
      break;
    case 'server':
      resolvedData = snapshot.conflict.serverData;
      break;
    case 'merged':
      resolvedData = customData || mergeManually(snapshot.conflict);
      break;
  }

  // Update the entity
  await db[snapshot.conflict.entityType].put(resolvedData);

  // Queue for sync
  await addToSyncQueue({
    type: 'update',
    entity: snapshot.conflict.entityType,
    entityId: snapshot.conflict.entityId,
    payload: resolvedData,
  });

  // Update snapshot
  snapshot.status = 'resolved';
  snapshot.resolvedAt = new Date().toISOString();
  snapshot.resolvedBy = getCurrentUserId();
  snapshot.resolution = resolution;
  snapshot.resolvedData = resolvedData;

  await db.conflicts.put(snapshot);
}
```

---

## 5. Security & Encryption

### 5.1 Sensitive Data Classification

| Data Type | Sensitivity | Storage Method | Encryption Required |
|-----------|-------------|----------------|---------------------|
| License Key | High | Encrypted IndexedDB | Yes - AES-256 |
| Auth Tokens | High | Encrypted IndexedDB | Yes - AES-256 |
| Refresh Tokens | High | Encrypted IndexedDB | Yes - AES-256 |
| Staff PINs | High | Cloud only | Hashed (bcrypt) |
| Client PII | Medium | IndexedDB | Application-level |
| Payment Card Details | Critical | **Never stored** | PCI compliance |
| Transaction History | Medium | IndexedDB | No |
| Business Data | Low | IndexedDB | No |

### 5.2 Secure Storage Implementation

```typescript
// Secure storage using Web Crypto API
class SecureStorage {
  private dbName = 'mango_secure_storage';
  private storeName = 'encrypted_data';
  private key: CryptoKey | null = null;
  private db: IDBDatabase | null = null;

  // Initialize with device-bound key
  async initialize(deviceSecret: string): Promise<void> {
    // Derive encryption key from device secret
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(deviceSecret),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Generate salt (stored separately, not secret)
    const salt = await this.getOrCreateSalt();

    // Derive AES-GCM key
    this.key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Open IndexedDB
    this.db = await this.openDatabase();
  }

  private async getOrCreateSalt(): Promise<Uint8Array> {
    const storedSalt = localStorage.getItem('mango_storage_salt');

    if (storedSalt) {
      return Uint8Array.from(atob(storedSalt), c => c.charCodeAt(0));
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem('mango_storage_salt', btoa(String.fromCharCode(...salt)));
    return salt;
  }

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async setItem(key: string, value: any): Promise<void> {
    if (!this.key || !this.db) {
      throw new Error('SecureStorage not initialized');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(value));

    // Generate random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      data
    );

    // Store IV + ciphertext
    const stored = {
      key,
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(stored);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getItem<T>(key: string): Promise<T | null> {
    if (!this.key || !this.db) {
      throw new Error('SecureStorage not initialized');
    }

    return new Promise(async (resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        const stored = request.result;

        if (!stored) {
          resolve(null);
          return;
        }

        try {
          const iv = new Uint8Array(stored.iv);
          const data = new Uint8Array(stored.data);

          const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            this.key!,
            data
          );

          const decoder = new TextDecoder();
          const json = decoder.decode(decrypted);
          resolve(JSON.parse(json));
        } catch (error) {
          // Decryption failed - data may be corrupted or key changed
          console.error('Decryption failed:', error);
          resolve(null);
        }
      };
    });
  }

  async removeItem(key: string): Promise<void> {
    if (!this.db) {
      throw new Error('SecureStorage not initialized');
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) {
      throw new Error('SecureStorage not initialized');
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Singleton instance
export const secureStorage = new SecureStorage();

// Usage
// await secureStorage.initialize(deviceFingerprint);
// await secureStorage.setItem('auth_token', { token: '...', expiresAt: '...' });
// const auth = await secureStorage.getItem<{ token: string; expiresAt: string }>('auth_token');
```

### 5.3 Data Isolation

```typescript
// All queries must include tenant/store scope
interface QueryScope {
  tenantId: string;
  storeId: string;
  locationId?: string;
}

// Enforced at the database layer
class ScopedDatabase {
  constructor(private scope: QueryScope) {}

  async query<T>(table: string, filters: object = {}): Promise<T[]> {
    const scopedFilters = {
      ...filters,
      tenantId: this.scope.tenantId,
      storeId: this.scope.storeId,
      isDeleted: false,
    };

    return db.table(table).where(scopedFilters).toArray();
  }

  async put<T extends BaseSyncableEntity>(table: string, entity: T): Promise<void> {
    // Ensure scope is set
    entity.tenantId = this.scope.tenantId;
    entity.storeId = this.scope.storeId;

    await db.table(table).put(entity);
  }
}
```

---

## 6. Data Retention & Purge

### 6.1 Retention Policies

```typescript
const DATA_RETENTION_POLICY = {
  // Local storage retention (for device storage management)
  local: {
    appointments: {
      maxCount: 10000,
      maxAge: 90 * 24 * 60 * 60 * 1000,       // 90 days
      keepCompleted: 30 * 24 * 60 * 60 * 1000, // Keep completed for 30 days
    },
    tickets: {
      maxCount: 50000,
      maxAge: 365 * 24 * 60 * 60 * 1000,      // 1 year
    },
    transactions: {
      maxCount: 100000,
      maxAge: 365 * 24 * 60 * 60 * 1000,      // 1 year (local cache)
    },
    clients: {
      maxCount: 50000,
      maxAge: null,                            // Keep indefinitely if active
      inactiveAge: 365 * 24 * 60 * 60 * 1000, // Purge inactive after 1 year
    },
    syncQueue: {
      maxCount: 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,        // 7 days
    },
    conflicts: {
      maxCount: 100,
      maxAge: 30 * 24 * 60 * 60 * 1000,       // 30 days
    },
    syncErrors: {
      maxCount: 500,
      maxAge: 7 * 24 * 60 * 60 * 1000,        // 7 days
    },
  },

  // Cloud retention (for compliance)
  cloud: {
    transactions: {
      minAge: 7 * 365 * 24 * 60 * 60 * 1000,  // 7 years (tax compliance)
    },
    auditLogs: {
      minAge: 7 * 365 * 24 * 60 * 60 * 1000,  // 7 years
    },
    appointments: {
      archiveAfter: 2 * 365 * 24 * 60 * 60 * 1000, // Archive after 2 years
    },
    clients: {
      anonymizeAfter: 3 * 365 * 24 * 60 * 60 * 1000, // GDPR: anonymize after 3 years inactive
    },
  },

  // Tombstone retention
  tombstones: {
    appointments: 30 * 24 * 60 * 60 * 1000,   // 30 days
    tickets: 90 * 24 * 60 * 60 * 1000,        // 90 days
    transactions: 365 * 24 * 60 * 60 * 1000,  // 1 year
    clients: 30 * 24 * 60 * 60 * 1000,        // 30 days
    staff: 90 * 24 * 60 * 60 * 1000,          // 90 days
    services: 30 * 24 * 60 * 60 * 1000,       // 30 days
    products: 30 * 24 * 60 * 60 * 1000,       // 30 days
  },
};
```

### 6.2 Purge Implementation

```typescript
class DataPurgeService {
  // Run daily during idle time
  async runDailyPurge(): Promise<PurgeResult> {
    const results: PurgeResult = {
      timestamp: new Date().toISOString(),
      entitiesPurged: {},
      bytesFreed: 0,
      errors: [],
    };

    for (const [entity, policy] of Object.entries(DATA_RETENTION_POLICY.local)) {
      try {
        const count = await this.purgeEntity(entity, policy);
        results.entitiesPurged[entity] = count;
      } catch (error) {
        results.errors.push({ entity, error: error.message });
      }
    }

    // Purge expired tombstones
    await this.purgeExpiredTombstones();

    // Compact database if needed
    await this.compactDatabaseIfNeeded();

    return results;
  }

  private async purgeEntity(
    entity: string,
    policy: RetentionPolicy
  ): Promise<number> {
    const now = Date.now();
    let purgedCount = 0;

    // Purge by age (only synced items)
    if (policy.maxAge) {
      const cutoffDate = new Date(now - policy.maxAge).toISOString();

      const toDelete = await db.table(entity)
        .where('createdAt')
        .below(cutoffDate)
        .and(item => item.syncStatus === 'synced')
        .toArray();

      for (const item of toDelete) {
        await db.table(entity).delete(item.id);
        purgedCount++;
      }
    }

    // Purge by count (keep most recent)
    if (policy.maxCount) {
      const count = await db.table(entity).count();

      if (count > policy.maxCount) {
        const excess = count - policy.maxCount;

        const toDelete = await db.table(entity)
          .orderBy('createdAt')
          .filter(item => item.syncStatus === 'synced')
          .limit(excess)
          .toArray();

        for (const item of toDelete) {
          await db.table(entity).delete(item.id);
          purgedCount++;
        }
      }
    }

    return purgedCount;
  }

  private async purgeExpiredTombstones(): Promise<void> {
    const now = Date.now();

    for (const [entity, retentionMs] of Object.entries(DATA_RETENTION_POLICY.tombstones)) {
      const cutoffDate = new Date(now - retentionMs).toISOString();

      await db.table(entity)
        .where('isDeleted')
        .equals(true)
        .and(item => item.deletedAt && item.deletedAt < cutoffDate)
        .delete();
    }
  }

  private async compactDatabaseIfNeeded(): Promise<void> {
    // Check storage usage
    const estimate = await navigator.storage.estimate();
    const usagePercent = (estimate.usage || 0) / (estimate.quota || 1);

    // Compact if using more than 80% of quota
    if (usagePercent > 0.8) {
      console.log('Storage usage high, running aggressive purge...');
      // Implement more aggressive purge logic
    }
  }
}

interface PurgeResult {
  timestamp: string;
  entitiesPurged: Record<string, number>;
  bytesFreed: number;
  errors: { entity: string; error: string }[];
}

interface RetentionPolicy {
  maxCount?: number;
  maxAge?: number;
  keepCompleted?: number;
  inactiveAge?: number;
}
```

### 6.3 Soft Delete (Tombstone) Pattern

```typescript
// Soft delete implementation
async function softDelete<T extends BaseSyncableEntity>(
  entity: SyncableEntityType,
  id: string,
  userId: string,
  deviceId: string
): Promise<void> {
  const item = await db.table(entity).get(id);

  if (!item) {
    throw new Error(`${entity} not found: ${id}`);
  }

  // Calculate tombstone expiration
  const retentionMs = DATA_RETENTION_POLICY.tombstones[entity];
  const expiresAt = new Date(Date.now() + retentionMs).toISOString();

  // Update with tombstone fields
  const tombstoned: T = {
    ...item,
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: userId,
    deletedByDevice: deviceId,
    tombstoneExpiresAt: expiresAt,
    syncStatus: 'pending',
    version: item.version + 1,
  };

  tombstoned.vectorClock[deviceId] = tombstoned.version;

  await db.table(entity).put(tombstoned);

  // Queue for sync
  await addToSyncQueue({
    type: 'delete',
    entity,
    entityId: id,
    payload: tombstoned,
  });
}

// Query helper that excludes deleted items by default
async function queryActive<T extends BaseSyncableEntity>(
  entity: string,
  filters: object = {},
  includeDeleted = false
): Promise<T[]> {
  let query = db.table(entity).where(filters);

  if (!includeDeleted) {
    query = query.and(item => !item.isDeleted);
  }

  return query.toArray();
}
```

---

## 7. IndexedDB Schema & Migrations

### 7.1 Database Schema Definition

```typescript
import Dexie, { Table } from 'dexie';

interface MangoBizDB extends Dexie {
  // Core entities
  appointments: Table<Appointment, string>;
  tickets: Table<Ticket, string>;
  transactions: Table<Transaction, string>;
  clients: Table<Client, string>;
  staff: Table<Staff, string>;
  services: Table<Service, string>;
  products: Table<Product, string>;

  // Sync management
  syncQueue: Table<SyncOperation, string>;
  syncMeta: Table<SyncCheckpoint, string>;

  // Conflict management
  conflicts: Table<ConflictSnapshot, string>;

  // Error tracking
  syncErrors: Table<SyncError, string>;

  // Cache
  cache: Table<CacheEntry<any>, string>;

  // Settings
  settings: Table<{ key: string; value: any }, string>;
}

const db = new Dexie('MangoBizDB') as MangoBizDB;

// Version 1: Initial schema
db.version(1).stores({
  appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+createdAt], [storeId+isDeleted]',

  tickets: 'id, ticketNumber, storeId, clientId, appointmentId, status, createdAt, [storeId+status], [storeId+createdAt], [clientId+createdAt]',

  transactions: 'id, ticketId, ticketNumber, storeId, clientId, status, paymentMethod, createdAt, [storeId+createdAt], [storeId+status], [clientId+createdAt]',

  clients: 'id, storeId, email, phone, displayName, lastVisitAt, [storeId+displayName], [storeId+phone], [storeId+email], [storeId+lastVisitAt], [storeId+isDeleted]',

  staff: 'id, storeId, email, role, status, [storeId+status], [storeId+role], [storeId+isDeleted]',

  services: 'id, storeId, categoryId, isActive, displayOrder, [storeId+categoryId], [storeId+isActive], [storeId+isDeleted]',

  products: 'id, storeId, sku, barcode, categoryId, isActive, [storeId+categoryId], [storeId+isActive], [storeId+isDeleted]',

  syncQueue: '++localId, id, entity, entityId, status, priority, createdAt, [status+priority], [entity+entityId]',

  syncMeta: 'entity',

  conflicts: 'id, entityType, entityId, status, createdAt, [status+createdAt]',

  syncErrors: '++localId, entity, entityId, createdAt',

  cache: 'key, expiresAt',

  settings: 'key',
});

// Version 2: Add version vectors
db.version(2).stores({
  // Same as v1, no index changes needed
}).upgrade(async tx => {
  // Migrate existing data to include version vectors
  const tables = ['appointments', 'tickets', 'transactions', 'clients', 'staff', 'services', 'products'];

  for (const table of tables) {
    await tx.table(table).toCollection().modify(item => {
      if (!item.version) {
        item.version = 1;
      }
      if (!item.vectorClock) {
        item.vectorClock = {};
      }
      if (!item.lastSyncedVersion) {
        item.lastSyncedVersion = item.syncStatus === 'synced' ? item.version : 0;
      }
    });
  }
});

// Version 3: Add tombstone fields
db.version(3).upgrade(async tx => {
  const tables = ['appointments', 'tickets', 'transactions', 'clients', 'staff', 'services', 'products'];

  for (const table of tables) {
    await tx.table(table).toCollection().modify(item => {
      if (item.isDeleted === undefined) {
        item.isDeleted = false;
      }
    });
  }
});

export { db, MangoBizDB };
```

### 7.2 Migration Helpers

```typescript
// Migration utilities
class MigrationHelper {
  // Run custom migration logic
  static async runMigration(
    version: number,
    migration: (tx: Dexie.Transaction) => Promise<void>
  ): Promise<void> {
    const migrationKey = `migration_v${version}_complete`;
    const completed = await db.settings.get(migrationKey);

    if (completed) {
      console.log(`Migration v${version} already completed`);
      return;
    }

    console.log(`Running migration v${version}...`);

    await db.transaction('rw', db.tables, async tx => {
      await migration(tx);
    });

    await db.settings.put({ key: migrationKey, value: true });
    console.log(`Migration v${version} completed`);
  }

  // Backup data before dangerous migrations
  static async backupTable(tableName: string): Promise<any[]> {
    const data = await db.table(tableName).toArray();
    const backupKey = `backup_${tableName}_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(data));
    return data;
  }

  // Restore from backup
  static async restoreTable(tableName: string, backupKey: string): Promise<void> {
    const data = JSON.parse(localStorage.getItem(backupKey) || '[]');
    await db.table(tableName).clear();
    await db.table(tableName).bulkPut(data);
  }
}
```

---

## 8. Performance Optimization

### 8.1 Query Optimization

```typescript
// Use compound indexes for common queries
const OPTIMIZED_QUERIES = {
  // Get today's appointments for a store
  todayAppointments: async (storeId: string, date: string) => {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    return db.appointments
      .where('[storeId+scheduledStartTime]')
      .between([storeId, startOfDay], [storeId, endOfDay])
      .and(item => !item.isDeleted)
      .toArray();
  },

  // Get open tickets for a store
  openTickets: async (storeId: string) => {
    return db.tickets
      .where('[storeId+status]')
      .equals([storeId, 'open'])
      .toArray();
  },

  // Search clients by name (uses index prefix)
  searchClients: async (storeId: string, searchTerm: string) => {
    const upperBound = searchTerm + '\uffff';

    return db.clients
      .where('[storeId+displayName]')
      .between([storeId, searchTerm], [storeId, upperBound])
      .and(item => !item.isDeleted)
      .limit(50)
      .toArray();
  },
};
```

### 8.2 Batch Operations

```typescript
// Batch writes for better performance
class BatchWriter {
  private batch: Map<string, { table: string; items: any[] }> = new Map();
  private batchSize = 100;

  add(table: string, item: any): void {
    if (!this.batch.has(table)) {
      this.batch.set(table, { table, items: [] });
    }

    this.batch.get(table)!.items.push(item);

    // Auto-flush when batch is full
    if (this.batch.get(table)!.items.length >= this.batchSize) {
      this.flush(table);
    }
  }

  async flush(table?: string): Promise<void> {
    const tables = table ? [table] : Array.from(this.batch.keys());

    await db.transaction('rw', tables.map(t => db.table(t)), async () => {
      for (const t of tables) {
        const batch = this.batch.get(t);
        if (batch && batch.items.length > 0) {
          await db.table(t).bulkPut(batch.items);
          batch.items = [];
        }
      }
    });
  }

  async flushAll(): Promise<void> {
    await this.flush();
  }
}
```

### 8.3 Memory Management

```typescript
// Cursor-based pagination for large result sets
async function* paginatedQuery<T>(
  table: string,
  filters: object,
  pageSize = 100
): AsyncGenerator<T[], void, unknown> {
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const results = await db.table(table)
      .where(filters)
      .offset(offset)
      .limit(pageSize)
      .toArray();

    if (results.length > 0) {
      yield results;
      offset += results.length;
    }

    hasMore = results.length === pageSize;
  }
}

// Usage
// for await (const batch of paginatedQuery('appointments', { storeId: 'store-1' })) {
//   console.log(`Processing ${batch.length} appointments`);
// }
```

---

## 9. Implementation Guidelines

### 9.1 Development Checklist

**Before adding a new entity:**
- [ ] Define entity interface extending `BaseSyncableEntity`
- [ ] Configure conflict resolution strategy
- [ ] Add to IndexedDB schema with appropriate indexes
- [ ] Implement sync priority
- [ ] Add retention policy
- [ ] Write migration if needed

**For each mutation:**
- [ ] Update Redux state (optimistic UI)
- [ ] Increment version and update vectorClock
- [ ] Set syncStatus to 'pending'
- [ ] Persist to IndexedDB
- [ ] Add to sync queue with idempotency key
- [ ] Handle offline scenario

**For sync operations:**
- [ ] Check online status
- [ ] Process by priority
- [ ] Handle conflicts according to entity rules
- [ ] Update syncStatus on success
- [ ] Implement retry with backoff
- [ ] Log errors for debugging

### 9.2 Testing Guidelines

```typescript
// Test conflict resolution
describe('ConflictResolution', () => {
  it('should merge appointment conflicts by field', async () => {
    const local = createAppointment({ notes: 'Local note', status: 'confirmed' });
    const server = createAppointment({ notes: 'Server note', status: 'checked_in' });

    const merged = await resolveConflict({
      entityType: 'appointment',
      localData: local,
      serverData: server,
      conflictingFields: ['notes', 'status'],
    });

    // Notes should be concatenated
    expect(merged.notes).toContain('Local note');
    expect(merged.notes).toContain('Server note');

    // Status should be latest (server was more recent)
    expect(merged.status).toBe('checked_in');
  });

  it('should always use server version for transactions', async () => {
    const local = createTransaction({ amount: 100 });
    const server = createTransaction({ amount: 150 });

    const resolved = await resolveConflict({
      entityType: 'transaction',
      localData: local,
      serverData: server,
      conflictingFields: ['amount'],
    });

    expect(resolved.amount).toBe(150);
  });
});
```

### 9.3 Monitoring & Debugging

```typescript
// Sync health monitoring
interface SyncHealth {
  queueDepth: number;
  oldestPending: string | null;
  failedOperations: number;
  conflictCount: number;
  lastSuccessfulSync: string | null;
  averageSyncLatency: number;
}

async function getSyncHealth(): Promise<SyncHealth> {
  const pendingOps = await db.syncQueue
    .where('status')
    .equals('pending')
    .toArray();

  const failedOps = await db.syncQueue
    .where('status')
    .anyOf(['failed', 'abandoned'])
    .count();

  const conflicts = await db.conflicts
    .where('status')
    .equals('pending')
    .count();

  const syncMeta = await db.settings.get('lastSyncStats');

  return {
    queueDepth: pendingOps.length,
    oldestPending: pendingOps.length > 0
      ? pendingOps.sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0].createdAt
      : null,
    failedOperations: failedOps,
    conflictCount: conflicts,
    lastSuccessfulSync: syncMeta?.value?.lastSuccessfulSync || null,
    averageSyncLatency: syncMeta?.value?.averageLatency || 0,
  };
}

// Debug logging
const DEBUG_SYNC = process.env.NODE_ENV === 'development';

function logSync(message: string, data?: object): void {
  if (DEBUG_SYNC) {
    console.log(`[SYNC] ${message}`, data || '');
  }
}
```

---

## Summary

| Category | Count | Key Points |
|----------|-------|------------|
| **Local Only** | 9 types | UI prefs, sync queue, tokens, drafts, device state |
| **Local + Cloud** | 7 entities | Appointments, Tickets, Transactions, Clients, Staff, Services, Products |
| **Cloud Only** | 12+ tables | Tenants, Licenses, Admin, Audit Logs, Feature Flags |
| **Hybrid (Cached)** | 7 types | License tier, Store defaults, Feature flags, Permissions |

### Key Architecture Decisions

1. **Offline-First**: Local storage is primary; cloud syncs asynchronously
2. **Version Vectors**: Enable accurate conflict detection across devices
3. **Field-Level Merging**: Intelligent conflict resolution preserves data
4. **Server-Wins for Financial**: Transactions always trust server
5. **Tombstone Pattern**: Soft deletes enable sync propagation
6. **Encrypted Sensitive Data**: AES-256 for tokens and keys
7. **Retention Policies**: Automatic purge prevents storage bloat
8. **Priority-Based Sync**: Critical operations sync first

---

## ⚠️ Planned Change: Opt-In Offline Mode

> **Status:** Planned | **PRD:** [PRD-Opt-In-Offline-Mode.md](../product/PRD-Opt-In-Offline-Mode.md)

A future update will change the default behavior:

| Current | Planned |
|---------|---------|
| All devices → Offline-first (data stored locally) | All devices → Online-only by default |
| Data persists on every device | Only designated devices store data locally |

**Impact on this document:**
- Section 1.2 (Local + Cloud) will become conditional based on device mode
- New "Online-Only Mode" section will be added
- Device registration will determine storage behavior

See the PRD for full technical specifications.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | Nov 30, 2025 | Engineering | Complete rewrite with production best practices |
| 1.0 | Oct 2025 | Engineering | Initial version |

---

**Document Status:** Active
**Last Updated:** November 30, 2025
**Next Review:** January 30, 2026
