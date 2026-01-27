# Ralph Agent Instructions

You are an autonomous coding agent working on a software project. Each iteration you complete **ONE user story**, then stop.

**Working directory:** Repository root containing the `scripts/` folder. All paths are relative to this root.

---

## Phase 1: Context Loading (ALWAYS DO FIRST)

1. **Read the PRD** at `scripts/ralph/runs/team-code-quality/prd.json`
2. **Read patterns** at `scripts/ralph/patterns.md` (accumulated learnings)
3. **Read progress** at `scripts/ralph/runs/team-code-quality/progress.txt` (recent learnings)
4. **Verify branch** matches PRD `branchName`. If not, checkout the correct branch.

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

## Phase 4.5: Security Checks (Multi-Tenant Projects)

**Skip this phase if:** Story is UI-only, config-only, or doesn't involve database/API operations.

### 4.5.1 Database Query Isolation

If this story creates or modifies database queries:

| Check | How to Verify | Required Action |
|-------|---------------|-----------------|
| **tenant_id in all queries** | Review each `.from('table')` call | Must have `.eq('tenant_id', tenantId)` filter |
| **Service functions receive tenantId** | Check function signatures | Functions accessing tenant data must have `tenantId` parameter |
| **Defense-in-depth** | Even with RLS policies | Application-level tenant filtering is required |

**Example - WRONG:**
```typescript
// Missing tenant_id - cross-tenant data leak possible
async function getMessages(conversationId: string) {
  return supabase.from('messages').select('*').eq('conversation_id', conversationId);
}
```

**Example - CORRECT:**
```typescript
// Tenant isolation enforced at application level
async function getMessages(conversationId: string, tenantId: string) {
  return supabase.from('messages').select('*')
    .eq('conversation_id', conversationId)
    .eq('tenant_id', tenantId);  // Defense-in-depth
}
```

### 4.5.2 API/Edge Function Security

If this story creates or modifies Edge Functions:

| Check | How to Verify | Required Action |
|-------|---------------|-----------------|
| **Authentication documented** | Read function header | Add comment explaining auth requirement or why public |
| **Input validation** | Check request handling | Validate required fields, UUIDs, enums |
| **No trusted client data** | Review tenantId source | Never trust tenantId from unauthenticated requests |

**Example header comment:**
```typescript
/**
 * AI Client Chat Edge Function
 *
 * Authentication: Called by trusted backend services only.
 * The tenantId is validated by the calling service.
 * Do NOT expose this endpoint directly to clients.
 */
```

### 4.5.3 Centralized Helpers

If this story involves provider configuration, API keys, or embeddings:

| Check | How to Verify | Required Action |
|-------|---------------|-----------------|
| **Use centralized config** | Check imports | Use `getTenantProviderConfig`, `getApiKeyForProvider` |
| **No duplicated API key logic** | Search for `Deno.env.get` | Should only appear in `tenant-config.ts` |
| **Use provider helpers** | Check embeddings usage | Use `getEmbeddingsProviderForTenant(tenantId)` |

### Security Check Results

| Scenario | Action |
|----------|--------|
| **All security checks pass** | Continue to Phase 5 |
| **Security issue in YOUR code** | Fix before proceeding |
| **Security issue in existing code you're modifying** | Fix as part of this story |
| **Security issue in unrelated code** | Document in progress.txt Learnings, do NOT fix (scope creep) |

---

## Phase 5: Browser Verification (UI Stories Only)

### When is a Story "UI"?

A story is UI if:
- `category` is `"frontend"` or `"ui"`
- Title, notes, or `acceptanceCriteria` mention components, screens, pages, or visual changes
- `files` array includes React/Vue/Svelte components, HTML, or CSS
- **When in doubt, treat as UI and verify**

### Available agent-browser Commands

| Command | Purpose |
|---------|---------|
| `agent-browser open <url>` | Navigate to a URL |
| `agent-browser snapshot` | Get accessibility tree with refs (preferred) |
| `agent-browser snapshot -i` | Get only interactive elements |
| `agent-browser click @e1` | Click element by ref |
| `agent-browser fill @e2 "text"` | Clear and fill input by ref |
| `agent-browser type @e2 "text"` | Type into input by ref |
| `agent-browser screenshot [path]` | Capture screenshot |
| `agent-browser wait --text "Welcome"` | Wait for text to appear |
| `agent-browser get text @e1` | Get text content of element |
| `agent-browser close` | Close browser |

### Browser Testing Workflow

1. Open: `agent-browser open http://localhost:5173`
2. Snapshot: `agent-browser snapshot` to get accessibility tree with refs
3. Find elements by `@e1`, `@e2` etc. refs in snapshot output
4. Interact: `agent-browser click @e3`, `agent-browser fill @e4 "text"`
5. Verify changes are visible with another snapshot
6. Screenshot for confirmation if needed: `agent-browser screenshot`

**A UI story is NOT complete until browser verification passes.**

### Document Browser Verification

In progress.txt, include:
```markdown
**Browser Verification:**
- Component renders without errors: [PASS/FAIL]
- Acceptance criteria verified visually: [PASS/FAIL]
- Accessibility check (headings, labels): [PASS/FAIL]
```

---

## Phase 6: Success Criteria Check

**You may set `passes: true` ONLY IF:**

- [ ] All items in `acceptanceCriteria` are satisfied
- [ ] TypeScript passes (or failures are documented pre-existing)
- [ ] Lint passes (or not available)
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
git commit -m "feat: [team-code-quality/US-XXX] - [Story Title]"
```

**Format:** `feat: [RUN_NAME/Story ID] - [Story Title]`

Example: `feat: [provider-v4/US-003] - Display priority badge on TaskCard`

**Note:** Including run name prevents story ID collisions across different Ralph runs.

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

**Browser Verification:** (UI stories only)
- Component renders: [PASS/FAIL]
- Visual criteria met: [PASS/FAIL]
- Accessibility OK: [PASS/FAIL]

**Learnings:**
- [Pattern discovered]
- [Risk avoided]
- [Gotcha encountered]

**Patterns to sync:** (if any reusable patterns discovered)
- Pattern #XX: [Name] - [Brief description of when/why to use]

**Next story suggestion:** [Which story would be logical next and why]

---
```

**Rules:**
- Preserve existing structure and ordering
- Only append new entries
- Add new patterns to `## Codebase Patterns` section at TOP if discovered
- Never delete or reorder prior content

---

## Phase 9.5: Sync Patterns to Project patterns.md

If you identified patterns worth sharing in "Patterns to sync:", update the project's patterns file:

1. **Read** `scripts/ralph/patterns.md`
2. **Check** if pattern already exists (avoid duplicates)
3. **Append** new patterns to the appropriate section:

```markdown
## [Category] Patterns

### [Subcategory]
XX. **Pattern name** - Description of the pattern and when to use it.
```

**Sync patterns that:**
- Apply to 2+ files or components
- Solve security issues
- Prevent a class of bugs
- Are TypeScript/React/database best practices

**Keep project-specific** (don't sync):
- Business logic specific to this app
- Domain-specific terminology
- Project-specific file paths

---

## Phase 10: Completion Check

Check if all stories are complete:

```bash
jq '[.userStories[] | select(.passes == false)] | length' scripts/ralph/runs/team-code-quality/prd.json
```

If `jq` is unavailable, skip this check and document in progress.txt.

If result is `0`, output:

```
<promise>COMPLETE</promise>
```

---

## Phase 10.5: Session Summary (If Stopping or Blocked)

If you cannot continue (blocked, context limit, or all stories done), append a session summary:

```markdown
## Session Summary - [Date]

**Completed this session:** [X] stories
**Total progress:** [Y]/[Z] stories ([percent]%)

**Blocked stories:** (if any)
- [US-XXX]: [Reason - e.g., "Missing dependency", "Pre-existing test failure", "PRD unclear"]

**Patterns synced:** [count] new patterns added to patterns.md

**Next session should:**
- Start with: [US-XXX] - [reason]
- Resolve blocker: [description if applicable]

---
```

---

## STOP

**After completing Phases 1-10.5 for ONE story, STOP.**

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

### Security-Related Forbidden Patterns

| Forbidden Pattern | Why | Correct Alternative |
|-------------------|-----|---------------------|
| `.from('table').select(*)` without `.eq('tenant_id'` | Missing tenant isolation | Add `.eq('tenant_id', tenantId)` |
| `Deno.env.get('*_API_KEY')` outside tenant-config | Duplicated API key logic | Use `getApiKeyForProvider()` |
| Function with DB access missing `tenantId` param | Can't enforce tenant isolation | Add `tenantId: string` parameter |

**Rules:**
- If you modify a line containing a forbidden string, remove or replace it
- In tests/scripts/tooling, these may be acceptable if consistent with existing patterns
- Do NOT go hunting for these across unrelated files
- Security patterns apply to database/API code only, not UI components

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
| **Dependency not met** | Skip story, document in progress.txt |

**Never mark a story as `passes: true` if it has unresolved errors or blockers.**

---

## Critical Rules Summary

| Rule | Why |
|------|-----|
| ONE story per iteration | Fresh context each time |
| Check `dependencies` first | Respect explicit ordering |
| Read files before editing | Understand existing patterns |
| Use `files` array | Know exactly what to modify |
| All checks must pass (or be pre-existing) | Never commit broken code |
| **Security checks for DB/API stories** | Prevent cross-tenant data leaks |
| **tenant_id in all queries** | Defense-in-depth, even with RLS |
| Browser verify UI changes | Ensure it actually works |
| Document browser verification | Prove it was tested |
| Commit with run name prefix | Prevent story ID collisions |
| Append progress, never replace | Preserve history |
| Sync patterns discovered | Share learnings |
| Write session summary when blocked | Enable next session |
| STOP after one story | Let next iteration handle the rest |

---

## File Path References

When referencing code locations, use format `file_path:line_number`:
- Example: `src/components/StaffCard.tsx:125`

This helps navigate large files and track changes.
