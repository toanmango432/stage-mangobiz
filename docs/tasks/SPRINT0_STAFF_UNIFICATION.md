# Sprint 0: Staff Data Unification

**Priority:** CRITICAL - Must complete before Sprint 1
**Goal:** Make `teamSlice` the single source of truth for all staff data

---

## Problem

The app has THREE separate staff data systems that are NOT synchronized:

| Slice | Data Source | Used By | Staff Count |
|-------|-------------|---------|-------------|
| `uiStaffSlice` | `mockData.ts` (hardcoded) | Front Desk, Turn Tracker | 20 fake staff |
| `teamSlice` | `teamDB` (IndexedDB) | Team Settings | 7 real staff |
| `staffSlice` | `staffDB` (IndexedDB) | Booking module | Unknown |

**Result:** Front Desk shows 20 fake staff (Sophia, Isabella, Mia...) while Team Settings shows 7 real staff (Sarah, Marcus, Emily...).

---

## Solution

Make `teamSlice`/`teamDB` the single source of truth:

```
teamSlice (Source of Truth)
    │
    ├──► uiStaffSlice (derives from teamSlice)
    │       └── Used by: Front Desk, Turn Tracker
    │
    └──► staffSlice (derives from teamSlice)
            └── Used by: Booking module
```

---

## Tasks

### Task 0.1: Update loadStaff thunk to fetch from teamDB
**File:** `src/store/slices/uiStaffSlice.ts`

Change `loadStaff` to fetch from `teamDB` instead of `staffDB`:

```typescript
// BEFORE
export const loadStaff = createAsyncThunk(
  'uiStaff/loadAll',
  async (salonId: string) => {
    const allStaff = await staffDB.getAll(salonId);
    return allStaff.map(convertToUIStaff);
  }
);

// AFTER
export const loadStaff = createAsyncThunk(
  'uiStaff/loadAll',
  async (storeId: string) => {
    const { teamDB } = await import('../../db/teamOperations');
    const teamMembers = await teamDB.getActiveMembers(storeId);
    return teamMembers.map(convertTeamMemberToUIStaff);
  }
);
```

### Task 0.2: Create converter function TeamMemberSettings → UIStaff
**File:** `src/store/slices/uiStaffSlice.ts`

```typescript
function convertTeamMemberToUIStaff(member: TeamMemberSettings): UIStaff {
  return {
    id: member.id,
    name: `${member.profile.firstName} ${member.profile.lastName}`,
    shortName: member.profile.displayName,
    time: '', // Will be set when clocked in
    image: member.profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.profile.firstName)}`,
    status: 'off', // Default, will update based on timesheet
    color: getStaffColor(member.id),
    count: 0,
    revenue: null,
    turnCount: 0,
    ticketsServicedCount: 0,
    totalSalesAmount: 0,
    specialty: member.onlineBooking.specialties?.[0]?.toLowerCase() || 'neutral',
    activeTickets: [],
  };
}
```

### Task 0.3: Remove hardcoded mockStaff from initialState
**File:** `src/store/slices/uiStaffSlice.ts`

```typescript
// BEFORE
const initialState: UIStaffState = {
  staff: mockStaff as UIStaff[], // ❌ Hardcoded mock data
  loading: false,
  error: null,
};

// AFTER
const initialState: UIStaffState = {
  staff: [], // ✅ Empty, will load from teamDB
  loading: false,
  error: null,
};
```

### Task 0.4: Update loadStaff.fulfilled to always use fetched data
**File:** `src/store/slices/uiStaffSlice.ts`

```typescript
// BEFORE
.addCase(loadStaff.fulfilled, (state, action) => {
  state.loading = false;
  if (action.payload && action.payload.length > 0) {
    state.staff = action.payload;
  }
  // If DB is empty, keep the mock data ❌
})

// AFTER
.addCase(loadStaff.fulfilled, (state, action) => {
  state.loading = false;
  state.staff = action.payload; // Always use fetched data ✅
})
```

### Task 0.5: Remove mockStaff import
**File:** `src/store/slices/uiStaffSlice.ts`

```typescript
// REMOVE THIS LINE
import { mockStaff } from '../../data/mockData';
```

### Task 0.6: Validate in Frontend
1. Open Front Desk - should show 7 staff from Team Settings
2. Open Team Settings - should show same 7 staff
3. Add a new team member in Team Settings
4. Refresh Front Desk - new member should appear

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/store/slices/uiStaffSlice.ts` | Main changes - remove mock, fetch from teamDB |

---

## Rollback Plan

If issues arise, revert `uiStaffSlice.ts` to use mock data temporarily.

---

## Success Criteria

- [ ] Front Desk shows the same staff as Team Settings
- [ ] Adding a new team member in Team Settings appears in Front Desk after refresh
- [ ] No TypeScript errors
- [ ] App builds successfully
