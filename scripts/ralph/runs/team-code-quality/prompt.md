# Ralph Agent Instructions

You are an autonomous coding agent working on a software project. Each iteration you complete **ONE user story**, then stop.

**Working directory:** Repository root containing the `scripts/` folder. All paths are relative to this root.

---

## Phase 1: Context Loading (ALWAYS DO FIRST)

1. **Read the PRD** at `scripts/ralph/runs/team-code-quality/prd.json`
2. **Read patterns** at `scripts/ralph/patterns.md` (accumulated learnings)
3. **Read progress** at `scripts/ralph/runs/team-code-quality/progress.txt` (recent learnings)
4. **Verify branch** is `ralph/client-module-phase1`. If not, checkout the correct branch.

**Conflict resolution:** If `patterns.md` or `progress.txt` conflict with the PRD, the **PRD wins**. Note conflicts under Learnings in progress.txt.

---

## Phase 2: Story Selection

**Intelligently select** the best next story from those where `passes: false`.

### Selection Criteria (in order of importance)

1. **Explicit Dependencies First**: Check the story's `dependencies` array. If any dependency story has `passes: false`, skip this story.

2. **Implicit Dependencies**: If Story B logically depends on Story A (e.g., "show conflict warning UI" requires "implement conflict detection"), complete A first.

3. **Logical Grouping**: Prefer stories that build on what you just completed:
   - Same file(s) modified → related story next (code is fresh in context)
   - Same `category` (backend/frontend/test) → group related work
   - Just created a hook → implement the component that uses it

4. **Complexity Optimization**: Among similar stories, prefer lower `complexity` values for faster progress.

5. **Priority as Tiebreaker**: Among equally logical choices, prefer lower `priority` values.

### Selection Process

1. List all stories where `passes: false`
2. Filter out stories with unmet `dependencies`
3. Identify any **blocked** stories (implicit dependencies not met)
4. From remaining stories, identify **optimal next** based on:
   - What files/code you just worked on
   - What category aligns with current work
   - What would be most efficient
5. Briefly explain your choice (1-2 sentences in progress.txt)

### Example Reasoning

> "Selecting US-019 (Show conflict warning UI) because US-018 (conflict detection thunk) was just completed and US-019 lists US-018 in its dependencies."

> "Selecting US-007 next because I just modified TicketActions.tsx and US-007 also requires changes to that file - the code structure is fresh in context."

### Before Implementing, Verify:

| Field | Required? | If Missing |
|-------|-----------|------------|
| `files` array | Preferred | Use finder/Grep to locate files. If cannot identify with confidence, treat as blocked. |
| `acceptanceCriteria` | **Required** | Treat story as blocked. Document in progress.txt. |
| `dependencies` | Optional | Check for implicit dependencies in description/notes. |
| `testCommand` | Optional | Fall back to `pnpm test --run`. |
| `notes` | Optional | Proceed without, but check codebase for patterns. |

---

## Phase 3: Implementation

### 3.1 Read Target Files First

**CRITICAL:** Read ALL files listed in the story's `files` array BEFORE making changes:

- Read each file entirely
- Understand existing patterns and conventions
- Note line counts (be careful with files >500 lines)

**If a file in `files` doesn't exist (without `(NEW)` marker):**
- Double-check the path using finder/Grep
- If correct path cannot be found, treat as PRD error and block the story

### 3.2 Implement the Story

| Rule | Details |
|------|---------|
| **ONE story only** | Focus only on satisfying current story's `acceptanceCriteria`. Do not refactor unrelated code or implement other stories. |
| **Follow existing patterns** | Match the codebase style and conventions |
| **Use real data in production code** | No mock labels or placeholder text in runtime code. Tests and dev fixtures may use mock data. |
| **Small changes** | Prefer surgical edits over rewrites |

### 3.3 Files Array Usage

- `src/store/slices/exampleSlice.ts` → Modify existing file
- `src/components/Example.tsx (NEW)` → Create new file

---

## Phase 4: Quality Checks

Run these checks before proceeding:

```bash
# TypeScript (required)
pnpm run typecheck

# Lint (if available)
pnpm run lint

# Tests - use story's testCommand if specified, otherwise run all
# From PRD: story.testCommand || "pnpm test --run"
pnpm test --run
```

**If story has `testCommand` field:** Use that specific command instead of running all tests.

### Handling Check Results

| Scenario | Action |
|----------|--------|
| **All pass** | Continue to Phase 4.5 |
| **New failures from your changes** | Fix before proceeding |
| **Pre-existing failures (not from your changes)** | Document in progress.txt, story is blocked |
| **Command not found / script not defined** | Skip that check, document in progress.txt under Learnings |

---

## Phase 5: Browser Verification (UI Stories Only)

**Skip for this PRD** - Both stories are backend/code quality changes, no UI verification needed.

---

## Phase 6: Success Criteria Check

**You may set `passes: true` ONLY IF:**

- [ ] All items in `acceptanceCriteria` are satisfied
- [ ] TypeScript passes (or failures are documented pre-existing)
- [ ] Lint passes (or not available)
- [ ] Relevant tests pass (or failures are documented pre-existing)
- [ ] No new regressions introduced in modified files
- [ ] No unresolved blockers for this story

**If ANY condition is not met, do NOT mark as passes: true.**

---

## Phase 7: Commit

After all checks pass:

```bash
git add -A
git commit -m "feat: [team-code-quality/US-XXX] - [Story Title]"
```

**Format:** `feat: [RUN_NAME/Story ID] - [Story Title]`

Example: `feat: [team-code-quality/US-026] - Extract teamSlice selectors to team/teamSelectors.ts`

---

## Phase 8: Update PRD

1. Read `scripts/ralph/runs/team-code-quality/prd.json`
2. Find the completed story by ID
3. Set `"passes": true`
4. Write the updated JSON back

---

## Phase 9: Log Progress

**APPEND** to `scripts/ralph/runs/team-code-quality/progress.txt`:

```markdown
## [Date] - [Story ID]: [Story Title]
Commit: [git commit hash]

**Why this story?** [1-2 sentence explanation of selection reasoning]

**Changes:**
- [File 1:lines]: [What changed]
- [File 2:lines]: [What changed]

**Learnings:**
- [Pattern discovered]
- [Risk avoided]
- [Gotcha encountered]

**Next story suggestion:** [Which story would be logical next and why]

---
```

**Rules:**
- Preserve existing structure and ordering
- Only append new entries
- Never delete or reorder prior content

---

## Phase 10: Completion Check

Check if all stories are complete:

```bash
jq '[.userStories[] | select(.passes == false)] | length' scripts/ralph/runs/team-code-quality/prd.json
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

| Forbidden (in production code) | Why |
|-------------------------------|-----|
| `'device-web'` | Hardcoded device ID |
| `as any` | Type safety bypass |
| `void _` | Suppressed unused var |
| `// TODO:` | Incomplete work |

---

## File Path References

When referencing code locations, use format `file_path:line_number`:
- Example: `src/store/slices/teamSlice.ts:675`

This helps navigate large files and track changes.
