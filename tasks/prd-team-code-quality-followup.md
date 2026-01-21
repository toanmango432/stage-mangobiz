# PRD: Team Module Code Quality Follow-Up

## Introduction

Follow-up code quality improvements from the UltraThink review of US-022 through US-025 implementation. This PRD addresses two remaining issues:

1. **teamSlice.ts** is still 858 lines (goal was <700) - selectors need extraction
2. **syncContext.ts** has hardcoded `'device-web'` fallbacks that reduce audit trail quality

## Goals

- Reduce `teamSlice.ts` from 858 to ~675 lines by extracting selectors
- Replace hardcoded `'device-web'` with `deviceManager.getDeviceId()` for proper audit trails
- All stories pass `pnpm run typecheck`
- Follow established patterns from `scheduleSelectors.ts` extraction

---

## User Stories

### US-026: Extract teamSlice selectors to team/teamSelectors.ts
**Description:** As a developer, I want teamSlice selectors in a separate file so that the slice stays under 700 lines and follows the pattern established by scheduleSelectors.ts.

**Files to create:**
- `apps/store-app/src/store/slices/team/teamSelectors.ts` (NEW, ~180 lines)

**Files to modify:**
- `apps/store-app/src/store/slices/teamSlice.ts` (remove ~180 lines, keep re-exports)

**Acceptance Criteria:**
- [ ] Create `team/teamSelectors.ts` with all selectors from teamSlice.ts (lines 675-858)
- [ ] Move these selectors:
  - Base: `selectTeamState`, `selectTeamMembers`, `selectTeamMemberIds`, `selectTeamLoading`, `selectTeamError`, `selectTeamUI`, `selectTeamSync`, `selectPendingOperations`
  - Member queries: `selectIsMemberPending`, `selectMemberPendingOperation`, `selectAllTeamMembers`, `selectActiveTeamMembers`, `selectArchivedTeamMembers`, `selectTeamMemberById`, `selectSelectedTeamMember`
  - Filtered: `selectFilteredTeamMembers`
  - Field selectors: `selectMemberPermissions`, `selectMemberServices`, `selectMemberSchedule`, `selectMemberTimeOffRequests`, `selectMemberScheduleOverrides`, `selectMemberCommission`, `selectMemberOnlineBooking`, `selectMemberNotifications`
  - Derived: `selectBookableTeamMembers`, `selectTeamStats`
- [ ] Use `import type { RootState }` to avoid circular dependency
- [ ] Re-export selectors from `teamSlice.ts` for backward compatibility
- [ ] Update `team/index.ts` to export from teamSelectors.ts
- [ ] `teamSlice.ts` is under 700 lines after extraction
- [ ] No forbidden strings: `as any`, `void _`
- [ ] pnpm run typecheck passes

**Notes:**
- Follow exact pattern from `src/store/slices/schedule/scheduleSelectors.ts` (683 lines)
- Use `import type { RootState }` from `../../index` to prevent circular imports
- Keep selector implementations identical, just move to new file
- Add JSDoc comments matching scheduleSelectors.ts style

**Priority:** 1

---

### US-027: Fix hardcoded deviceId in syncContext.ts
**Description:** As a developer, I need real device IDs in audit trails instead of generic 'device-web' string.

**Files to modify:**
- `apps/store-app/src/store/utils/syncContext.ts` (~10 lines to change)

**Acceptance Criteria:**
- [ ] Import `deviceManager` from `../../../services/deviceManager`
- [ ] Line 30: Change `deviceId: 'device-web'` to `deviceId: deviceManager.getDeviceId()`
- [ ] Line 49: Change `device.deviceId || 'device-web'` to `device.deviceId || deviceManager.getDeviceId()`
- [ ] No hardcoded `'device-web'` strings remain in file
- [ ] No forbidden strings: `as any`, `'device-web'`
- [ ] pnpm run typecheck passes

**Notes:**
- This matches the fix already applied in `CreatePayRunModal.tsx`
- `deviceManager.getDeviceId()` returns a unique identifier per device session
- Import path: `import { deviceManager } from '../../../services/deviceManager'`

**Priority:** 2

---

## Functional Requirements

- FR-1 (US-026): Team selectors accessible from both `teamSlice.ts` and `team/teamSelectors.ts`
- FR-2 (US-026): No breaking changes to existing selector imports
- FR-3 (US-027): All sync operations use real device IDs for audit trail

## Non-Goals

- No changes to selector logic or behavior
- No splitting of scheduleThunks.ts (deferred)
- No adding new selectors or memoization
- No changes to team thunks

## Technical Considerations

**Existing patterns to follow:**
- `src/store/slices/schedule/scheduleSelectors.ts` - Gold standard for selector extraction
- `src/store/slices/schedule/index.ts` - Barrel export pattern

**Files that will be modified:**

| File | Current Lines | After Change |
|------|---------------|--------------|
| `teamSlice.ts` | 858 | ~675 |
| `syncContext.ts` | 63 | ~65 |

**Import pattern for selectors:**
```typescript
// In teamSelectors.ts
import type { RootState } from '../../index';
import type { TeamMemberSettings, ... } from '../../../components/team-settings/types';
```

**Re-export pattern for backward compatibility:**
```typescript
// In teamSlice.ts (after extraction)
export * from './team/teamSelectors';
```

## Verification Checklist

### After All Stories Complete:

**Code Quality:**
- [ ] `wc -l teamSlice.ts` shows < 700 lines
- [ ] `grep -r "device-web" src/store/` returns no results
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run lint` passes

**Functionality:**
- [ ] Team Settings page loads correctly
- [ ] Team member filtering works
- [ ] Selectors return same data as before

---

## Summary

**2 user stories** for clean-up:
- US-026: Extract team selectors (~180 lines) to `team/teamSelectors.ts`
- US-027: Fix deviceId fallback using `deviceManager.getDeviceId()`

**Target branch:** `ralph/auth-remediation-v2`

**Estimated Ralph iterations:** 2-3
