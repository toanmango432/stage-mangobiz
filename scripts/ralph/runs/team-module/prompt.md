# Ralph Agent Instructions

You are an autonomous coding agent working on a software project. Each iteration you complete **ONE user story**, then stop.

**Working directory:** Repository root containing the `scripts/` folder. All paths are relative to this root.

---

## Phase 1: Context Loading (ALWAYS DO FIRST)

1. **Read the PRD** at `scripts/ralph/runs/team-module/prd.json`
2. **Read patterns** at `scripts/ralph/patterns.md` (accumulated learnings)
3. **Read progress** at `scripts/ralph/runs/team-module/progress.txt` (recent learnings)
4. **Verify branch** matches PRD `branchName`. If not, checkout the correct branch.

**Conflict resolution:** If `patterns.md` or `progress.txt` conflict with the PRD, the **PRD wins**. Note conflicts under Learnings in progress.txt.

---

## Phase 2: Story Selection

**Intelligently select** the best next story from those where `passes: false`.

### Phase Filtering (If --phase flag is set)

If the PRD has a `currentPhase` field set (indicating `--phase N` was passed):
1. **First**, filter stories to only those where `story.phase === currentPhase`
2. **Then**, apply the selection criteria below to the filtered set
3. If all stories in the current phase have `passes: true`, output: `<promise>PHASE_COMPLETE</promise>`

If no `currentPhase` is set, consider all stories across all phases.

### Selection Criteria (in order of importance)

1. **Priority Order**: Stories are organized by priority. Select the lowest priority number with `passes: false`.

2. **Dependencies**: Review/Fix stories (TM-PxR/TM-PxF) should be done at the end of each phase.

3. **Logical Grouping**: Backend stories (Phase 1) before Frontend stories (Phase 2+).

### Before Implementing, Verify:

| Field | Required? | If Missing |
|-------|-----------|------------|
| `filesToModify` array | Preferred | Use Glob/Grep to locate files. |
| `acceptanceCriteria` | **Required** | Treat story as blocked. Document in progress.txt. |
| `notes` | Optional | Proceed without, but check codebase for patterns. |

---

## Phase 3: Implementation

### 3.1 Read Target Files First

**CRITICAL:** Read ALL files listed in the story's `filesToModify` array BEFORE making changes:

- Read each file entirely
- Understand existing patterns and conventions
- Note line counts (be careful with files >500 lines)

**If a file has `(NEW)` marker:** Create it from scratch.

### 3.2 Implement the Story

| Rule | Details |
|------|---------|
| **ONE story only** | Focus only on satisfying current story's `acceptanceCriteria`. Do not refactor unrelated code or implement other stories. |
| **Follow existing patterns** | Match the codebase style and conventions |
| **Use real data** | No mock labels or placeholder text in production code. |
| **Small changes** | Prefer surgical edits over rewrites |

### 3.3 Key Patterns to Follow

**Domain Service Pattern** (from staffDataService.ts):
```typescript
import { store } from '@/store';
import { shouldUseSQLite } from '@/config/featureFlags';
import { syncQueueDB } from '@/db/database';

function getStoreId(): string {
  const state = store.getState();
  return state.auth.storeId || '';
}

const USE_SQLITE = shouldUseSQLite();

function queueSyncOperation(action: 'create' | 'update' | 'delete', entityId: string, payload: unknown): void {
  syncQueueDB.add({...}).catch(console.warn);
}

export const myService = {
  async getAll(): Promise<MyType[]> { ... },
  async getById(id: string): Promise<MyType | null> { ... },
  async create(data: Omit<MyType, 'id'>): Promise<MyType> { ... },
  async update(id: string, updates: Partial<MyType>): Promise<MyType | null> { ... },
  async delete(id: string): Promise<void> { ... },
};
```

**Redux Thunk Pattern** (from teamThunks.ts):
```typescript
import { createAsyncThunk } from '@reduxjs/toolkit';
import { dataService } from '@/services/dataService';

export const fetchData = createAsyncThunk(
  'slice/fetchData',
  async (params: Params, { rejectWithValue }) => {
    try {
      const data = await dataService.namespace.getAll();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed');
    }
  }
);
```

---

## Phase 4: Quality Checks

Run these checks before proceeding:

```bash
# TypeScript (required)
pnpm run typecheck

# Tests (if available)
pnpm test --run
```

### Handling Check Results

| Scenario | Action |
|----------|--------|
| **All pass** | Continue to Phase 5 |
| **New failures from your changes** | Fix before proceeding |
| **Pre-existing failures (not from your changes)** | Document in progress.txt, continue |

---

## Phase 5: Browser Verification (UI Stories Only)

**When is a Story "UI"?**
A story is UI if it modifies React components or has "Verify in browser" in acceptance criteria.

### Available Playwright MCP Tools

| Tool | Purpose |
|------|---------|
| `mcp__playwright__browser_navigate` | Go to a URL |
| `mcp__playwright__browser_snapshot` | Get accessibility tree (preferred) |
| `mcp__playwright__browser_click` | Click element by ref |
| `mcp__playwright__browser_type` | Type into input |

### Browser Testing Workflow

1. Navigate: `browser_navigate` → `http://localhost:5173`
2. Go to Team Settings section
3. Select a team member
4. Navigate to relevant tab (Timesheet, Payroll, Reviews, Performance, Achievements, Commission)
5. Verify the UI changes work as expected

**A UI story is NOT complete until browser verification passes.**

---

## Phase 6: Success Criteria Check

**You may set `passes: true` ONLY IF:**

- [ ] All items in `acceptanceCriteria` are satisfied
- [ ] TypeScript passes
- [ ] Relevant tests pass (or failures are documented pre-existing)
- [ ] For UI: Browser verification completed
- [ ] No forbidden strings in modified code

**If ANY condition is not met, do NOT mark as passes: true.**

---

## Phase 7: Commit

After all checks pass:

```bash
git add -A
git commit -m "feat: [team-module/TM-XXX] - [Story Title]"
```

**Format:** `feat: [team-module/Story ID] - [Story Title]`

Example: `feat: [team-module/TM-001] - Create teamDataService.ts domain service`

---

## Phase 8: Update PRD

1. Read `scripts/ralph/runs/team-module/prd.json`
2. Find the completed story by ID
3. Set `"passes": true`
4. Write the updated JSON back

---

## Phase 9: Log Progress

**APPEND** to `scripts/ralph/runs/team-module/progress.txt`:

```markdown
## [Date] - [Story ID]: [Story Title]
Commit: [git commit hash]

**Changes:**
- [File 1]: [What changed]
- [File 2]: [What changed]

**Browser Verification:** (UI stories only)
- [PASS/FAIL]: [Details]

**Learnings:**
- [Pattern discovered]
- [Gotcha encountered]

---
```

---

## Phase 10: Completion Check

Check if all stories are complete:

```bash
jq '[.stories[] | select(.passes == false)] | length' scripts/ralph/runs/team-module/prd.json
```

If result is `0`, output:

```
<promise>COMPLETE</promise>
```

---

## STOP

**After completing Phases 1-10 for ONE story, STOP.**

Do not select or start work on another story in this iteration.

---

## Forbidden Strings

**Scope:** Only applies to files you modify during this story.

| Forbidden (in production code) | Why |
|-------------------------------|-----|
| `generateMockReviews` | Mock data function |
| `generateMockSummary` | Mock data function |
| `generateMockAchievements` | Mock data function |
| `'Test Client'` | Mock data |
| `as any` | Type safety bypass |
| `void _` | Suppressed unused var |
| `// TODO:` | Incomplete work |

**CRITICAL:** The main goal of Phase 4-6 is to REMOVE all mock data and replace with real Redux data.

---

## Team Module Phase Checkpoints

This run is organized in **7 phases** for phase-by-phase execution.

### Phase-by-Phase Execution

```bash
# Run Phase 1 only (9 stories - Backend dataService Integration)
./scripts/ralph/ralph.sh 12 team-module --phase 1

# Run Phase 2 only (9 stories - Timesheet Frontend Workflows)
./scripts/ralph/ralph.sh 12 team-module --phase 2

# Run Phase 3 only (9 stories - Payroll Frontend Management)
./scripts/ralph/ralph.sh 12 team-module --phase 3

# Run Phase 4 only (9 stories - Reviews & Ratings Integration)
./scripts/ralph/ralph.sh 12 team-module --phase 4

# Run Phase 5 only (7 stories - Performance Goals)
./scripts/ralph/ralph.sh 10 team-module --phase 5

# Run Phase 6 only (8 stories - Achievements System)
./scripts/ralph/ralph.sh 10 team-module --phase 6

# Run Phase 7 only (10 stories - Commission & Testing)
./scripts/ralph/ralph.sh 15 team-module --phase 7
```

| Phase | Name | Stories | Count | Checkpoint |
|-------|------|---------|-------|------------|
| **1** | Backend dataService Integration | TM-001 to TM-P1F | 9 | Domain services created, dataService exports team/timesheets/payRuns |
| **2** | Timesheet Frontend Workflows | TM-008 to TM-P2F | 9 | Clock buttons wired, manual/dispute modals work |
| **3** | Payroll Frontend Management | TM-015 to TM-P3F | 9 | Pay run lifecycle works end-to-end |
| **4** | Reviews & Ratings Integration | TM-022 to TM-P4F | 9 | **NO MOCK DATA** - all real Redux data |
| **5** | Performance Goals | TM-029 to TM-P5F | 7 | Goals save, metrics calculate from real data |
| **6** | Achievements System | TM-034 to TM-P6F | 8 | **NO MOCK DATA** - achievements from database |
| **7** | Commission & Testing | TM-040 to TM-P7F | 10 | Tests pass, documentation complete |

---

## File Path References

Key files for the Team Module:

**Domain Services (Phase 1 creates these):**
- `apps/store-app/src/services/domain/teamDataService.ts`
- `apps/store-app/src/services/domain/timesheetDataService.ts`
- `apps/store-app/src/services/domain/payrollDataService.ts`

**Redux Slices:**
- `apps/store-app/src/store/slices/team/teamThunks.ts`
- `apps/store-app/src/store/slices/timesheetSlice.ts`
- `apps/store-app/src/store/slices/payrollSlice.ts`
- `apps/store-app/src/store/slices/staffRatingsSlice.ts` (Phase 4 creates)

**UI Components:**
- `apps/store-app/src/components/team-settings/sections/TimesheetSection/`
- `apps/store-app/src/components/team-settings/sections/PayrollSection.tsx`
- `apps/store-app/src/components/team-settings/sections/ReviewsSection.tsx`
- `apps/store-app/src/components/team-settings/sections/PerformanceSection.tsx`
- `apps/store-app/src/components/team-settings/sections/AchievementsSection.tsx`
- `apps/store-app/src/components/team-settings/sections/CommissionSection.tsx`

**Reference Pattern Files:**
- `apps/store-app/src/services/domain/staffDataService.ts` (follow this pattern)
- `apps/store-app/src/services/supabase/tables/staffTable.ts` (follow this pattern)
- `apps/store-app/src/services/supabase/adapters/` (follow adapter patterns)
