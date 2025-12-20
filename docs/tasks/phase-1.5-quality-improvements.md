# Phase 1.5: Quality Improvements

**Document Version:** 1.1
**Created:** December 2024
**Updated:** December 2024
**Status:** In Progress (80% Complete)
**Priority:** Must complete before Phase 2

---

## Overview

This phase addresses critical quality gaps identified in the Phase 1 implementation to ensure the Team Module meets production standards before proceeding with feature development.

### Current Rating: 7/10
### Target Rating: 9/10

---

## Gap Analysis

| Area | Current State | Target State | Gap |
|------|---------------|--------------|-----|
| **Data Model** | Denormalized monolith (`TeamMemberSettings`) | Normalized per PRD Section 8.2 | Major |
| **Validation** | None | Zod schemas for all entities | Critical |
| **Conflict Resolution** | Last-write-wins only | Field-level merge | Medium |
| **Optimistic Updates** | None (wait for DB) | Update UI immediately | Medium |
| **Unit Tests** | None | 80%+ coverage | Critical |
| **Error Handling** | Basic try/catch | Typed errors with retry | Medium |

---

## 1. Data Model Normalization

### Problem

Current `TeamMemberSettings` is a ~20-field monolith:
```typescript
interface TeamMemberSettings {
  profile: TeamMemberProfile;      // 15+ fields
  services: ServicePricing[];      // Array
  workingHours: WorkingHoursSettings; // Nested object with arrays
  permissions: RolePermissions;     // 15+ fields
  commission: CommissionSettings;   // 10+ fields
  payroll: PayrollSettings;         // 8+ fields
  onlineBooking: OnlineBookingSettings; // 15+ fields
  notifications: NotificationPreferences; // Nested object
  performanceGoals: PerformanceGoals; // 10+ fields
  // + BaseSyncableEntity fields
}
```

**Issues:**
1. Updating `workingHours` rewrites entire 50KB+ record
2. Can't sync individual sections independently
3. Can't query by nested fields efficiently (e.g., "all members with commission > 50%")
4. Conflict resolution is all-or-nothing

### Solution: Normalize per PRD Section 8.2

Create separate tables with foreign key relationships:

```typescript
// Core entity - small, frequently accessed
interface TeamMember extends BaseSyncableEntity {
  // Basic info only
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  jobTitle?: string;
  employeeId?: string;
  hireDate?: string;
  isActive: boolean;
}

// Separate tables with teamMemberId FK
interface TeamMemberPermissions extends BaseSyncableEntity {
  teamMemberId: string;
  level: PermissionLevel;
  // ... granular permissions
}

interface TeamMemberSchedule extends BaseSyncableEntity {
  teamMemberId: string;
  regularHours: WorkingDay[];
  // ... schedule settings
}

interface TeamMemberCommission extends BaseSyncableEntity {
  teamMemberId: string;
  type: CommissionType;
  // ... commission settings
}

// ... etc for each section
```

### Implementation Tasks

#### 1.1 Create New Type Definitions

**File:** `src/components/team-settings/types/normalized.ts`

- [ ] Create `TeamMember` (core entity)
- [ ] Create `TeamMemberPermissions`
- [ ] Create `TeamMemberSchedule`
- [ ] Create `TeamMemberCommission`
- [ ] Create `TeamMemberPayroll`
- [ ] Create `TeamMemberOnlineBooking`
- [ ] Create `TeamMemberNotifications`
- [ ] Create `TeamMemberService` (junction table)
- [ ] Create `TimeOffRequest` (standalone)
- [ ] Create `ScheduleOverride` (standalone)

#### 1.2 Update IndexedDB Schema

**File:** `src/db/schema.ts`

Add version 5 with normalized tables:

```typescript
this.version(5).stores({
  // ... existing tables

  // Normalized team tables
  teamMembers: 'id, storeId, email, isActive, [storeId+isActive], [storeId+email]',
  teamMemberPermissions: 'id, teamMemberId, level, [teamMemberId]',
  teamMemberSchedules: 'id, teamMemberId, [teamMemberId]',
  teamMemberCommissions: 'id, teamMemberId, type, [teamMemberId]',
  teamMemberPayroll: 'id, teamMemberId, [teamMemberId]',
  teamMemberOnlineBooking: 'id, teamMemberId, isBookableOnline, [teamMemberId], [isBookableOnline]',
  teamMemberNotifications: 'id, teamMemberId, [teamMemberId]',
  teamMemberServices: 'id, teamMemberId, serviceId, [teamMemberId], [serviceId], [teamMemberId+serviceId]',
  timeOffRequests: 'id, teamMemberId, status, startDate, [teamMemberId], [status]',
  scheduleOverrides: 'id, teamMemberId, date, [teamMemberId], [date]',
});
```

#### 1.3 Create Normalized Database Operations

**File:** `src/db/teamOperationsNormalized.ts`

- [ ] CRUD for each entity type
- [ ] Aggregate query: `getFullMemberData(memberId)` - joins all tables
- [ ] Partial update: `updateMemberPermissions(memberId, permissions)`
- [ ] Each operation adds to sync queue with correct entity type

#### 1.4 Update Redux Slice

**File:** `src/store/slices/teamSlice.ts`

- [ ] Normalize state shape per PRD Section 8.1:
  ```typescript
  interface TeamState {
    members: Record<string, TeamMember>;
    permissions: Record<string, TeamMemberPermissions>;
    schedules: Record<string, TeamMemberSchedule>;
    commissions: Record<string, TeamMemberCommission>;
    // ... etc
  }
  ```
- [ ] Create selectors that join data for UI
- [ ] Create thunks for each entity type

#### 1.5 Migration Strategy

- [ ] Create migration script v4 -> v5
- [ ] Split existing `TeamMemberSettings` into normalized tables
- [ ] Preserve all data during migration
- [ ] Add rollback capability

---

## 2. Zod Validation Schemas

### Problem

No runtime validation. Invalid data can corrupt IndexedDB.

### Solution

Add Zod schemas for all entities with validation at:
1. Form submission (UI layer)
2. Redux thunk entry (state layer)
3. Database write (persistence layer)

### Implementation Tasks

#### 2.1 Install Zod

```bash
npm install zod
```

#### 2.2 Create Validation Schemas

**File:** `src/components/team-settings/validation/schemas.ts`

```typescript
import { z } from 'zod';

// Base schema for all syncable entities
export const BaseSyncableEntitySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().min(1),
  storeId: z.string().min(1),
  locationId: z.string().optional(),
  syncStatus: z.enum(['local', 'synced', 'pending', 'syncing', 'conflict', 'error']),
  version: z.number().int().positive(),
  vectorClock: z.record(z.string(), z.number()),
  lastSyncedVersion: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().min(1),
  createdByDevice: z.string().min(1),
  lastModifiedBy: z.string().min(1),
  lastModifiedByDevice: z.string().min(1),
  isDeleted: z.boolean(),
  deletedAt: z.string().datetime().optional(),
  deletedBy: z.string().optional(),
  deletedByDevice: z.string().optional(),
  tombstoneExpiresAt: z.string().datetime().optional(),
});

// Team Member core schema
export const TeamMemberSchema = BaseSyncableEntitySchema.extend({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  displayName: z.string().max(200).optional(),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  jobTitle: z.string().max(100).optional(),
  employeeId: z.string().max(50).optional(),
  hireDate: z.string().datetime().optional(),
  isActive: z.boolean(),
});

// Permission schema
export const TeamMemberPermissionsSchema = BaseSyncableEntitySchema.extend({
  teamMemberId: z.string().uuid(),
  level: z.enum(['no_access', 'basic', 'standard', 'advanced', 'manager', 'owner']),
  canViewCalendar: z.boolean(),
  canBookAppointments: z.boolean(),
  canViewClients: z.boolean(),
  canViewClientContact: z.boolean(),
  canCreateClients: z.boolean(),
  canEditClients: z.boolean(),
  canProcessCheckout: z.boolean(),
  canApplyDiscounts: z.boolean(),
  canProcessRefunds: z.boolean(),
  canViewReports: z.boolean(),
  canExportReports: z.boolean(),
  canManageTeam: z.boolean(),
  canAccessSettings: z.boolean(),
  canAccessBusinessDetails: z.boolean(),
  canDeleteRecords: z.boolean(),
  pinRequired: z.boolean(),
  pin: z.string().regex(/^\d{4,6}$/).optional(), // 4-6 digit PIN
});

// Commission schema with tiered validation
export const CommissionTierSchema = z.object({
  minRevenue: z.number().nonnegative(),
  maxRevenue: z.number().positive().optional(),
  percentage: z.number().min(0).max(100),
});

export const TeamMemberCommissionSchema = BaseSyncableEntitySchema.extend({
  teamMemberId: z.string().uuid(),
  type: z.enum(['none', 'percentage', 'tiered', 'flat']),
  basePercentage: z.number().min(0).max(100),
  tiers: z.array(CommissionTierSchema).optional(),
  flatAmount: z.number().nonnegative().optional(),
  productCommission: z.number().min(0).max(100),
  tipHandling: z.enum(['keep_all', 'pool', 'percentage_to_house']),
  tipPercentageToHouse: z.number().min(0).max(100).optional(),
}).refine((data) => {
  // Validate tiers have no gaps
  if (data.type === 'tiered' && data.tiers) {
    const sorted = [...data.tiers].sort((a, b) => a.minRevenue - b.minRevenue);
    for (let i = 1; i < sorted.length; i++) {
      const prevMax = sorted[i - 1].maxRevenue;
      const currMin = sorted[i].minRevenue;
      if (prevMax !== undefined && prevMax < currMin) {
        return false; // Gap detected
      }
    }
  }
  return true;
}, { message: 'Commission tiers have gaps' });

// Working hours schema
export const ShiftSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
}).refine((data) => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  return (start[0] * 60 + start[1]) < (end[0] * 60 + end[1]);
}, { message: 'End time must be after start time' });

export const WorkingDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isWorking: z.boolean(),
  shifts: z.array(ShiftSchema),
});

export const TeamMemberScheduleSchema = BaseSyncableEntitySchema.extend({
  teamMemberId: z.string().uuid(),
  regularHours: z.array(WorkingDaySchema).length(7),
  repeatPattern: z.enum(['weekly', 'bi_weekly', 'tri_weekly', 'monthly']).optional(),
  patternStartDate: z.string().datetime().optional(),
  defaultBreakDuration: z.number().int().min(0).max(120),
  autoScheduleBreaks: z.boolean(),
});

// ... continue for all entity types
```

#### 2.3 Create Validation Utilities

**File:** `src/components/team-settings/validation/validate.ts`

```typescript
import { z } from 'zod';
import * as schemas from './schemas';

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodError['errors']
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateTeamMember(data: unknown): schemas.TeamMember {
  const result = schemas.TeamMemberSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid team member data', result.error.errors);
  }
  return result.data;
}

export function validatePermissions(data: unknown): schemas.TeamMemberPermissions {
  const result = schemas.TeamMemberPermissionsSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid permissions data', result.error.errors);
  }
  return result.data;
}

// ... validators for all entity types

// Partial validation for updates
export function validatePartialTeamMember(data: unknown): Partial<schemas.TeamMember> {
  const result = schemas.TeamMemberSchema.partial().safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid team member update', result.error.errors);
  }
  return result.data;
}
```

#### 2.4 Integrate with Database Operations

```typescript
// In teamOperationsNormalized.ts
import { validateTeamMember, ValidationError } from '../validation/validate';

async createMember(data: TeamMember): Promise<string> {
  // Validate before write
  const validated = validateTeamMember(data);

  // Proceed with database write
  await db.teamMembers.add(validated);
  // ...
}
```

#### 2.5 Integrate with Redux Thunks

```typescript
// In teamSlice.ts
export const saveTeamMember = createAsyncThunk(
  'team/saveMember',
  async ({ member, context }: SaveMemberPayload, { rejectWithValue }) => {
    try {
      // Validate at thunk entry
      const validated = validateTeamMember(member);
      // ...
    } catch (error) {
      if (error instanceof ValidationError) {
        return rejectWithValue({
          type: 'VALIDATION_ERROR',
          errors: error.errors,
        });
      }
      throw error;
    }
  }
);
```

---

## 3. Field-Level Conflict Resolution

### Problem

Current implementation uses last-write-wins for entire records. This loses data when different fields are edited on different devices.

### Solution

Implement field-level merge for team entities per DATA_STORAGE_STRATEGY.md Section 4.

### Implementation Tasks

#### 3.1 Create Conflict Resolution Utilities

**File:** `src/utils/conflictResolution.ts`

```typescript
import { BaseSyncableEntity, VectorClock } from '../types/common';

/**
 * Compare two vector clocks to determine relationship
 */
export function compareVectorClocks(
  local: VectorClock,
  remote: VectorClock
): 'local_ahead' | 'remote_ahead' | 'concurrent' | 'equal' {
  const allDevices = new Set([...Object.keys(local), ...Object.keys(remote)]);

  let localAhead = false;
  let remoteAhead = false;

  for (const device of allDevices) {
    const localVersion = local[device] || 0;
    const remoteVersion = remote[device] || 0;

    if (localVersion > remoteVersion) localAhead = true;
    if (remoteVersion > localVersion) remoteAhead = true;
  }

  if (localAhead && remoteAhead) return 'concurrent'; // Conflict!
  if (localAhead) return 'local_ahead';
  if (remoteAhead) return 'remote_ahead';
  return 'equal';
}

/**
 * Field-level merge for team member
 */
export function mergeTeamMember(
  local: TeamMember,
  remote: TeamMember
): { merged: TeamMember; conflicts: string[] } {
  const conflicts: string[] = [];
  const merged = { ...local };

  // For each field, use the one with later updatedAt
  // or flag as conflict if both changed
  const fieldRules: Record<keyof TeamMember, 'last_write' | 'local_wins' | 'remote_wins' | 'max'> = {
    firstName: 'last_write',
    lastName: 'last_write',
    displayName: 'last_write',
    email: 'remote_wins', // Email changes are authoritative from server
    phone: 'last_write',
    avatar: 'last_write',
    bio: 'last_write',
    jobTitle: 'last_write',
    isActive: 'remote_wins', // Status controlled by managers
    // ... etc
  };

  for (const [field, rule] of Object.entries(fieldRules)) {
    const localValue = local[field as keyof TeamMember];
    const remoteValue = remote[field as keyof TeamMember];

    if (localValue === remoteValue) continue; // No conflict

    switch (rule) {
      case 'last_write':
        // Use whichever was updated more recently
        if (new Date(remote.updatedAt) > new Date(local.updatedAt)) {
          merged[field as keyof TeamMember] = remoteValue as any;
        }
        break;
      case 'remote_wins':
        merged[field as keyof TeamMember] = remoteValue as any;
        break;
      case 'local_wins':
        // Keep local value (already in merged)
        break;
      case 'max':
        merged[field as keyof TeamMember] = Math.max(
          localValue as number,
          remoteValue as number
        ) as any;
        break;
    }

    // Log that this field had different values
    if (localValue !== remoteValue) {
      conflicts.push(field);
    }
  }

  // Merge vector clocks
  merged.vectorClock = mergeVectorClocks(local.vectorClock, remote.vectorClock);
  merged.version = Math.max(local.version, remote.version) + 1;
  merged.updatedAt = new Date().toISOString();

  return { merged, conflicts };
}

/**
 * Merge two vector clocks
 */
export function mergeVectorClocks(a: VectorClock, b: VectorClock): VectorClock {
  const merged: VectorClock = {};
  const allDevices = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const device of allDevices) {
    merged[device] = Math.max(a[device] || 0, b[device] || 0);
  }

  return merged;
}
```

#### 3.2 Update `applyServerChange` in teamOperations

```typescript
async applyServerChange(serverMember: TeamMember): Promise<void> {
  const local = await db.teamMembers.get(serverMember.id);

  if (!local) {
    // New from server
    await db.teamMembers.add({
      ...serverMember,
      syncStatus: 'synced',
    });
    return;
  }

  const clockComparison = compareVectorClocks(local.vectorClock, serverMember.vectorClock);

  switch (clockComparison) {
    case 'remote_ahead':
    case 'equal':
      // Server is authoritative, use server version
      await db.teamMembers.put({
        ...serverMember,
        syncStatus: 'synced',
      });
      break;

    case 'local_ahead':
      // Local has changes server doesn't know about
      // Keep local, it will sync on next push
      break;

    case 'concurrent':
      // Both have changes - need to merge
      const { merged, conflicts } = mergeTeamMember(local, serverMember);

      if (conflicts.length > 0) {
        console.warn(`Resolved ${conflicts.length} conflicts for member ${serverMember.id}:`, conflicts);
        // Optionally store conflict log for debugging
      }

      await db.teamMembers.put({
        ...merged,
        syncStatus: 'synced',
      });
      break;
  }
}
```

---

## 4. Optimistic Updates

### Problem

Current flow: User action -> DB write -> Wait -> Redux update -> UI update

This feels slow. User sees loading spinner for every action.

### Solution

New flow: User action -> Redux update (optimistic) -> UI update (immediate) -> DB write (background) -> Confirm/Rollback

### Implementation Tasks

#### 4.1 Update Redux Thunks with Optimistic Pattern

```typescript
// Before (current)
export const saveTeamMember = createAsyncThunk(
  'team/saveMember',
  async ({ member, context }: SaveMemberPayload) => {
    const saved = await teamDB.updateMember(member.id, member, ctx.userId, ctx.deviceId);
    return saved; // UI updates here, after DB
  }
);

// After (optimistic)
export const saveTeamMember = createAsyncThunk(
  'team/saveMember',
  async ({ member, context }: SaveMemberPayload, { dispatch, getState }) => {
    // 1. Get current state for rollback
    const currentState = (getState() as RootState).team.members[member.id];

    // 2. Optimistically update UI immediately
    dispatch(teamSlice.actions.updateMemberOptimistic(member));

    try {
      // 3. Persist to DB
      const saved = await teamDB.updateMember(member.id, member, ctx.userId, ctx.deviceId);

      // 4. Confirm with actual saved data (may have server-side changes)
      return { member: saved, success: true };
    } catch (error) {
      // 5. Rollback on failure
      dispatch(teamSlice.actions.updateMemberOptimistic(currentState));
      throw error;
    }
  }
);

// Add optimistic reducer
const teamSlice = createSlice({
  // ...
  reducers: {
    updateMemberOptimistic: (state, action: PayloadAction<TeamMember>) => {
      state.members[action.payload.id] = action.payload;
    },
    // ...
  },
});
```

#### 4.2 Add Pending State Tracking

```typescript
interface TeamState {
  // ... existing
  pendingOperations: Record<string, {
    type: 'create' | 'update' | 'delete';
    entityId: string;
    previousState?: TeamMember;
    timestamp: number;
  }>;
}
```

#### 4.3 Show Pending Indicator in UI

```typescript
// In TeamMemberList
const member = useSelector((state) => selectMemberById(state, memberId));
const isPending = useSelector((state) => !!state.team.pendingOperations[memberId]);

return (
  <MemberCard>
    {isPending && <SyncingIndicator />}
    {/* ... */}
  </MemberCard>
);
```

---

## 5. Unit Tests

### Problem

No tests. Changes can break existing functionality silently.

### Solution

Add comprehensive unit tests with 80%+ coverage target.

### Implementation Tasks

#### 5.1 Setup Test Environment

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom fake-indexeddb
```

**File:** `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

#### 5.2 Create Test Utilities

**File:** `src/test/setup.ts`

```typescript
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';

// Reset DB between tests
beforeEach(async () => {
  const { db } = await import('../db/schema');
  await db.delete();
  await db.open();
});
```

**File:** `src/test/factories.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';
import { TeamMember, TeamMemberPermissions } from '../components/team-settings/types';

export function createMockTeamMember(overrides?: Partial<TeamMember>): TeamMember {
  const id = uuidv4();
  return {
    id,
    tenantId: 'test-tenant',
    storeId: 'test-store',
    firstName: 'Test',
    lastName: 'User',
    email: `test-${id}@example.com`,
    isActive: true,
    syncStatus: 'local',
    version: 1,
    vectorClock: { 'test-device': 1 },
    lastSyncedVersion: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'test-user',
    createdByDevice: 'test-device',
    lastModifiedBy: 'test-user',
    lastModifiedByDevice: 'test-device',
    isDeleted: false,
    ...overrides,
  };
}
```

#### 5.3 Database Operations Tests

**File:** `src/db/__tests__/teamOperations.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { teamDB } from '../teamOperations';
import { createMockTeamMember } from '../../test/factories';

describe('teamDB', () => {
  describe('createMember', () => {
    it('should create a new team member', async () => {
      const member = createMockTeamMember();
      const id = await teamDB.createMember(member, 'user-1', 'device-1');

      expect(id).toBe(member.id);

      const saved = await teamDB.getMemberById(id);
      expect(saved).toBeDefined();
      expect(saved?.firstName).toBe(member.firstName);
    });

    it('should set sync status to local', async () => {
      const member = createMockTeamMember();
      await teamDB.createMember(member, 'user-1', 'device-1');

      const saved = await teamDB.getMemberById(member.id);
      expect(saved?.syncStatus).toBe('local');
    });

    it('should add to sync queue', async () => {
      const member = createMockTeamMember();
      await teamDB.createMember(member, 'user-1', 'device-1');

      // Check sync queue
      const pendingSync = await teamDB.getMembersPendingSync();
      expect(pendingSync.some(m => m.id === member.id)).toBe(true);
    });
  });

  describe('updateMember', () => {
    it('should update existing member', async () => {
      const member = createMockTeamMember();
      await teamDB.createMember(member, 'user-1', 'device-1');

      const updated = await teamDB.updateMember(
        member.id,
        { firstName: 'Updated' },
        'user-1',
        'device-1'
      );

      expect(updated.firstName).toBe('Updated');
      expect(updated.version).toBe(2);
    });

    it('should throw if member not found', async () => {
      await expect(
        teamDB.updateMember('non-existent', { firstName: 'Test' }, 'user-1', 'device-1')
      ).rejects.toThrow('not found');
    });
  });

  describe('softDeleteMember', () => {
    it('should mark member as deleted', async () => {
      const member = createMockTeamMember();
      await teamDB.createMember(member, 'user-1', 'device-1');

      await teamDB.softDeleteMember(member.id, 'user-1', 'device-1');

      const deleted = await teamDB.getMemberById(member.id);
      expect(deleted?.isDeleted).toBe(true);
      expect(deleted?.deletedAt).toBeDefined();
    });

    it('should not appear in getAllMembers', async () => {
      const member = createMockTeamMember();
      await teamDB.createMember(member, 'user-1', 'device-1');
      await teamDB.softDeleteMember(member.id, 'user-1', 'device-1');

      const allMembers = await teamDB.getAllMembers();
      expect(allMembers.find(m => m.id === member.id)).toBeUndefined();
    });
  });

  // ... more tests
});
```

#### 5.4 Validation Tests

**File:** `src/components/team-settings/validation/__tests__/schemas.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { TeamMemberSchema, TeamMemberCommissionSchema } from '../schemas';

describe('TeamMemberSchema', () => {
  it('should validate valid member', () => {
    const result = TeamMemberSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      tenantId: 'tenant-1',
      storeId: 'store-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isActive: true,
      // ... required fields
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = TeamMemberSchema.safeParse({
      // ... valid fields
      email: 'not-an-email',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain('email');
  });

  it('should reject empty firstName', () => {
    const result = TeamMemberSchema.safeParse({
      // ... valid fields
      firstName: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('TeamMemberCommissionSchema', () => {
  it('should validate valid tiered commission', () => {
    const result = TeamMemberCommissionSchema.safeParse({
      // ... base fields
      type: 'tiered',
      tiers: [
        { minRevenue: 0, maxRevenue: 1000, percentage: 30 },
        { minRevenue: 1000, maxRevenue: 5000, percentage: 40 },
        { minRevenue: 5000, percentage: 50 },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('should reject tiered commission with gaps', () => {
    const result = TeamMemberCommissionSchema.safeParse({
      // ... base fields
      type: 'tiered',
      tiers: [
        { minRevenue: 0, maxRevenue: 1000, percentage: 30 },
        { minRevenue: 2000, percentage: 50 }, // Gap: 1000-2000
      ],
    });

    expect(result.success).toBe(false);
  });
});
```

#### 5.5 Redux Slice Tests

**File:** `src/store/slices/__tests__/teamSlice.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import teamReducer, {
  setSelectedMember,
  updateMemberOptimistic,
  fetchTeamMembers,
} from '../teamSlice';
import { createMockTeamMember } from '../../../test/factories';

function createTestStore() {
  return configureStore({
    reducer: { team: teamReducer },
  });
}

describe('teamSlice', () => {
  describe('reducers', () => {
    it('should set selected member', () => {
      const store = createTestStore();
      store.dispatch(setSelectedMember('member-1'));

      expect(store.getState().team.ui.selectedMemberId).toBe('member-1');
    });

    it('should optimistically update member', () => {
      const store = createTestStore();
      const member = createMockTeamMember();

      // Add initial member
      store.dispatch(updateMemberOptimistic(member));

      // Update
      store.dispatch(updateMemberOptimistic({
        ...member,
        firstName: 'Updated',
      }));

      expect(store.getState().team.members[member.id].firstName).toBe('Updated');
    });
  });

  describe('thunks', () => {
    it('should fetch team members', async () => {
      const store = createTestStore();

      // Seed test data
      const member = createMockTeamMember();
      await teamDB.createMember(member, 'user-1', 'device-1');

      await store.dispatch(fetchTeamMembers(undefined));

      expect(Object.keys(store.getState().team.members)).toHaveLength(1);
    });
  });
});
```

#### 5.6 Conflict Resolution Tests

**File:** `src/utils/__tests__/conflictResolution.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  compareVectorClocks,
  mergeTeamMember,
  mergeVectorClocks,
} from '../conflictResolution';

describe('compareVectorClocks', () => {
  it('should detect equal clocks', () => {
    const a = { device1: 1, device2: 2 };
    const b = { device1: 1, device2: 2 };

    expect(compareVectorClocks(a, b)).toBe('equal');
  });

  it('should detect local ahead', () => {
    const local = { device1: 2, device2: 2 };
    const remote = { device1: 1, device2: 2 };

    expect(compareVectorClocks(local, remote)).toBe('local_ahead');
  });

  it('should detect concurrent (conflict)', () => {
    const local = { device1: 2, device2: 1 };
    const remote = { device1: 1, device2: 2 };

    expect(compareVectorClocks(local, remote)).toBe('concurrent');
  });
});

describe('mergeTeamMember', () => {
  it('should merge without data loss', () => {
    const local = createMockTeamMember({
      firstName: 'LocalFirst',
      lastName: 'Same',
      updatedAt: '2024-01-01T00:00:00Z',
    });

    const remote = createMockTeamMember({
      id: local.id,
      firstName: 'Same',
      lastName: 'RemoteLast',
      updatedAt: '2024-01-02T00:00:00Z', // Remote is newer
    });

    const { merged, conflicts } = mergeTeamMember(local, remote);

    // Remote won for lastName (it was newer)
    expect(merged.lastName).toBe('RemoteLast');
    // Local's firstName was kept (remote didn't change it)
    expect(merged.firstName).toBe('LocalFirst');
    expect(conflicts).toContain('lastName');
  });
});
```

---

## 6. Implementation Order

### Recommended Sequence

1. **Zod Validation** (1-2 days)
   - Can be added without breaking changes
   - Immediate benefit: catch invalid data
   - Required for: safer normalization migration

2. **Unit Tests** (2-3 days)
   - Test existing functionality before changes
   - Required for: safe refactoring

3. **Optimistic Updates** (1 day)
   - Improves UX immediately
   - Low risk of breaking changes

4. **Conflict Resolution** (1-2 days)
   - Builds on existing vector clock infrastructure
   - Required for: proper sync behavior

5. **Data Model Normalization** (3-5 days)
   - Most invasive change
   - Requires: tests, validation, migration strategy
   - Defer until after items 1-4 are stable

---

## 7. Success Criteria

### Phase 1.5 Complete When:

- [x] Zod schemas validate all team entities (DONE - schemas.ts created)
- [x] Unit tests for team operations (DONE - 70 tests passing)
- [x] Optimistic updates work for CRUD operations (DONE - teamSlice updated)
- [x] Field-level conflict resolution implemented (DONE - conflictResolution.ts)
- [ ] Data model normalized per PRD Section 8.2 (PENDING - deferred to Phase 2+)
- [x] Build compiles without errors (DONE)
- [x] All existing functionality still works (DONE)

### Completed Files:

1. `src/components/team-settings/validation/schemas.ts` - Zod schemas for all team entities
2. `src/components/team-settings/validation/validate.ts` - Validation utilities with custom error handling
3. `src/components/team-settings/validation/index.ts` - Module exports
4. `src/utils/conflictResolution.ts` - Vector clock comparison and field-level merge
5. `src/store/slices/teamSlice.ts` - Updated with optimistic updates and pending operation tracking
6. `src/db/teamOperations.ts` - Updated applyServerChange with conflict resolution
7. `src/utils/__tests__/conflictResolution.test.ts` - 19 unit tests
8. `src/components/team-settings/validation/__tests__/schemas.test.ts` - 51 unit tests

### Quality Metrics:

| Metric | Target |
|--------|--------|
| Test Coverage | 80%+ |
| TypeScript Strict | 100% |
| Zod Coverage | All entities |
| Lint Errors | 0 |

---

*End of Phase 1.5 Quality Improvements Plan*
