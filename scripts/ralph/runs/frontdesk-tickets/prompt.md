# Ralph Agent Instructions

You are an autonomous coding agent working on a software project. Each iteration you complete **ONE user story**, then stop.

**Working directory:** Repository root containing the `scripts/` folder. All paths are relative to this root.

---

## Phase 1: Context Loading (ALWAYS DO FIRST)

1. **Read the PRD** at `scripts/ralph/runs/frontdesk-tickets/prd.json`
2. **Read patterns** at `scripts/ralph/patterns.md` (accumulated learnings)
3. **Read progress** at `scripts/ralph/runs/frontdesk-tickets/progress.txt` (recent learnings)
4. **Verify branch** matches PRD `branchName`. If not, checkout the correct branch.

**Conflict resolution:** If `patterns.md` or `progress.txt` conflict with the PRD, the **PRD wins**. Note conflicts under Learnings in progress.txt.

---

## Phase 2: Story Selection

Pick the **highest priority** user story where `passes: false`:

- **Priority field exists:** Choose the story with the **lowest numeric** `priority` value
- **Tie-breaker:** If multiple stories have the same priority, choose the one that appears **earliest** in `userStories[]`
- **No priority field:** Choose the **first** story in `userStories[]` with `passes: false`

### Before Implementing, Verify:

| Field | Required? | If Missing |
|-------|-----------|------------|
| `files` array | Preferred | Use finder/Grep to locate files. If cannot identify with confidence, treat as blocked. |
| `acceptanceCriteria` | **Required** | Treat story as blocked. Document in progress.txt. |
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

# Tests (if relevant)
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
- `files` array includes React/Vue/Svelte components, HTML, or CSS
- **When in doubt, treat as UI and verify**

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
- [ ] Lint passes (or not available)
- [ ] Relevant tests pass (or failures are documented pre-existing)
- [ ] For UI: Browser verification completed successfully
- [ ] No new regressions introduced in modified files
- [ ] No unresolved blockers for this story

**If ANY condition is not met, do NOT mark as passes: true.**

---

## Phase 7: Commit

After all checks pass:

```bash
git add -A
git commit -m "feat: [US-XXX] - [Story Title]"
```

**Format:** `feat: [Story ID] - [Story Title]`

Example: `feat: [US-003] - Display priority badge on TaskCard`

---

## Phase 8: Update PRD

1. Read `scripts/ralph/runs/frontdesk-tickets/prd.json`
2. Find the completed story by ID
3. Set `"passes": true`
4. Write the updated JSON back

---

## Phase 9: Log Progress

**APPEND** to `scripts/ralph/runs/frontdesk-tickets/progress.txt`:

```markdown
## [Date] - [Story ID]: [Story Title]
Commit: [git commit hash]

**Changes:**
- [File 1]: [What changed]
- [File 2]: [What changed]

**Learnings:**
- [Pattern discovered]
- [Gotcha encountered]

---
```

**Rules:**
- Preserve existing structure and ordering
- Only append new entries
- Add new patterns to `## Codebase Patterns` section at TOP if discovered
- Never delete or reorder prior content

---

## Phase 10: Completion Check

Check if all stories are complete:

```bash
jq '[.userStories[] | select(.passes == false)] | length' scripts/ralph/runs/frontdesk-tickets/prd.json
```

If `jq` is unavailable, skip this check and document in progress.txt.

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
| `'10:30 AM'` | Hardcoded time |
| `as any` | Type safety bypass |
| `void _` | Suppressed unused var |
| `// TODO:` | Incomplete work |
| `console.log` | Debug code (unless explicitly required) |

**Rules:**
- If you modify a line containing a forbidden string, remove or replace it
- In tests/scripts/tooling, these may be acceptable if consistent with existing patterns
- Do NOT go hunting for these across unrelated files

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
| **PRD error (missing file, vague criteria)** | Document in progress.txt, story is blocked |

**Never mark a story as `passes: true` if it has unresolved errors or blockers.**

---

## Critical Rules Summary

| Rule | Why |
|------|-----|
| ONE story per iteration | Fresh context each time |
| Read files before editing | Understand existing patterns |
| Use `files` array | Know exactly what to modify |
| All checks must pass (or be pre-existing) | Never commit broken code |
| Browser verify UI changes | Ensure it actually works |
| Commit before updating PRD | Atomic changes |
| Append progress, never replace | Preserve history |
| STOP after one story | Let next iteration handle the rest |

---

## File Path References

When referencing code locations, use format `file_path:line_number`:
- Example: `src/components/StaffCard.tsx:125`

This helps navigate large files and track changes.
