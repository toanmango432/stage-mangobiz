# Ralph Agent Instructions

You are an autonomous coding agent working on a software project. Each iteration you complete **ONE user story**, then stop.

**Working directory:** Repository root containing the `scripts/` folder. All paths are relative to this root.

---

## Phase 1: Context Loading (ALWAYS DO FIRST)

1. **Read the PRD** at `scripts/ralph/runs/client-module-phase1/prd.json`
2. **Read patterns** at `scripts/ralph/patterns.md` (accumulated learnings)
3. **Read progress** at `scripts/ralph/runs/client-module-phase1/progress.txt` (recent learnings)
4. **Verify branch** matches PRD `branchName`. If not, checkout the correct branch.

**Conflict resolution:** If `patterns.md` or `progress.txt` conflict with the PRD, the **PRD wins**. Note conflicts under Learnings in progress.txt.

---

## Phase 2: Story Selection

**Intelligently select** the best next story from those where `passes: false`.

### Selection Criteria (in order of importance)

1. **Explicit Dependencies First**: Check the story's `dependencies` array. If any dependency story has `passes: false`, skip this story.

2. **Implicit Dependencies**: If Story B logically depends on Story A (e.g., "create thunk" requires "add types"), complete A first.

3. **Logical Grouping**: Prefer stories that build on what you just completed:
   - Same file(s) modified → related story next (code is fresh in context)
   - Same `category` (backend/frontend/test) → group related work
   - Just created a type → implement the thunk that uses it

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

### Before Implementing, Verify:

| Field | Required? | If Missing |
|-------|-----------|------------|
| `notes` (files to modify) | **Required** | Use Grep/Glob to locate files. If cannot identify with confidence, treat as blocked. |
| `acceptanceCriteria` | **Required** | Treat story as blocked. Document in progress.txt. |
| `dependencies` | Optional | Check for implicit dependencies in description/notes. |

---

## Phase 3: Implementation

### 3.1 Read Target Files First

**CRITICAL:** Read ALL files listed in the story's `notes` BEFORE making changes:

- Read each file entirely
- Understand existing patterns and conventions
- Note line counts (be careful with files >500 lines)

**If a file doesn't exist (without `(NEW)` marker):**
- Double-check the path using Glob/Grep
- If correct path cannot be found, treat as PRD error and block the story

### 3.2 Implement the Story

| Rule | Details |
|------|---------|
| **ONE story only** | Focus only on satisfying current story's `acceptanceCriteria`. Do not refactor unrelated code or implement other stories. |
| **Follow existing patterns** | Match the codebase style and conventions |
| **Use real data in production code** | No mock labels or placeholder text in runtime code. Tests and dev fixtures may use mock data. |
| **Small changes** | Prefer surgical edits over rewrites |

---

## Phase 4: Quality Checks

Run these checks before proceeding:

```bash
# TypeScript (required)
pnpm run typecheck

# Tests - run all or story-specific
pnpm test --run
```

### Handling Check Results

| Scenario | Action |
|----------|--------|
| **All pass** | Continue to Phase 5 |
| **New failures from your changes** | Fix before proceeding |
| **Pre-existing failures (not from your changes)** | Document in progress.txt, story is blocked |
| **Command not found / script not defined** | Skip that check, document in progress.txt under Learnings |

---

## Phase 5: Browser Verification (UI Stories Only)

### When is a Story "UI"?

A story is UI if:
- Title, notes, or `acceptanceCriteria` mention components, screens, pages, or visual changes
- Files to modify include React components
- Acceptance criteria includes "Verify in browser"

### Available Playwright MCP Tools

| Tool | Purpose |
|------|---------|
| `mcp__playwright__browser_navigate` | Go to a URL |
| `mcp__playwright__browser_snapshot` | Get accessibility tree (preferred) |
| `mcp__playwright__browser_click` | Click element by ref |
| `mcp__playwright__browser_type` | Type into input |
| `mcp__playwright__browser_take_screenshot` | Capture screenshot |
| `mcp__playwright__browser_wait_for` | Wait for text/element |

### Browser Testing Workflow

1. Navigate: `browser_navigate` → `http://localhost:5173`
2. Snapshot: `browser_snapshot` to get accessibility tree
3. Find elements by `ref` attribute in snapshot
4. Interact: `browser_click`, `browser_type`
5. Verify changes are visible
6. Screenshot for confirmation if needed

**A UI story is NOT complete until browser verification passes.**

---

## Phase 6: Success Criteria Check

**You may set `passes: true` ONLY IF:**

- [ ] All items in `acceptanceCriteria` are satisfied
- [ ] TypeScript passes (or failures are documented pre-existing)
- [ ] Relevant tests pass (or failures are documented pre-existing)
- [ ] For UI: Browser verification completed and documented
- [ ] No new regressions introduced in modified files
- [ ] No unresolved blockers for this story

**If ANY condition is not met, do NOT mark as passes: true.**

---

## Phase 7: Commit

After all checks pass:

```bash
git add -A
git commit -m "feat: [client-module-phase1/US-XXX] - [Story Title]"
```

**Format:** `feat: [RUN_NAME/Story ID] - [Story Title]`

Example: `feat: [client-module-phase1/US-003] - Add merge types to clientsSlice`

---

## Phase 8: Update PRD

1. Read `scripts/ralph/runs/client-module-phase1/prd.json`
2. Find the completed story by ID
3. Set `"passes": true`
4. Write the updated JSON back

---

## Phase 9: Log Progress

**APPEND** to `scripts/ralph/runs/client-module-phase1/progress.txt`:

```markdown
## [Date] - [Story ID]: [Story Title]
Commit: [git commit hash]

**Why this story?** [1-2 sentence explanation of selection reasoning]

**Changes:**
- [File 1:lines]: [What changed]
- [File 2:lines]: [What changed]

**Browser Verification:** (UI stories only)
- Component renders: [PASS/FAIL]
- Visual criteria met: [PASS/FAIL]

**Learnings:**
- [Pattern discovered]
- [Risk avoided]
- [Gotcha encountered]

**Next story suggestion:** [Which story would be logical next and why]

---
```

---

## Phase 10: Completion Check

Check if all stories are complete:

```bash
jq '[.userStories[] | select(.passes == false)] | length' scripts/ralph/runs/client-module-phase1/prd.json
```

If result is `0`, output:

```
<promise>COMPLETE</promise>
```

---

## STOP

**After completing Phases 1-10 for ONE story, STOP.**

Do not select or start work on another story in this iteration. The next iteration will pick up the next story.

---

## Forbidden Strings

**Scope:** Only applies to files you modify during this story. Do NOT scan/refactor the entire codebase.

| Forbidden (in production code) | Why |
|-------------------------------|-----|
| `'Test Client'` | Mock data |
| `'Test Service'` | Mock data |
| `as any` | Type safety bypass |
| `void _` | Suppressed unused var |
| `// TODO:` | Incomplete work |
| `console.log` | Debug code (unless explicitly required) |

---

## Failure Handling

| Blocker | Action |
|---------|--------|
| **TypeScript errors (from your changes)** | Fix before proceeding |
| **TypeScript errors (pre-existing)** | Document in progress.txt, story is blocked |
| **Test failures (new)** | Fix or adjust your change |
| **Test failures (pre-existing)** | Document, do not mark passes: true |
| **Browser verification fails** | Debug and retry |
| **Cannot complete story** | Document blocker in progress.txt, do NOT mark passes: true |

**Never mark a story as `passes: true` if it has unresolved errors or blockers.**

---

## Critical Rules Summary

| Rule | Why |
|------|-----|
| ONE story per iteration | Fresh context each time |
| Check `dependencies` first | Respect explicit ordering |
| Read files before editing | Understand existing patterns |
| All checks must pass (or be pre-existing) | Never commit broken code |
| Browser verify UI changes | Ensure it actually works |
| Commit with run name prefix | Prevent story ID collisions |
| Append progress, never replace | Preserve history |
| STOP after one story | Let next iteration handle the rest |
