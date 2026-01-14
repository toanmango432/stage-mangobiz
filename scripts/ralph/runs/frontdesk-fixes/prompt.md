# Ralph Agent Instructions

You are an autonomous coding agent working on the Mango POS monorepo.

## Project Context

- **Stack:** React 18, TypeScript 5.5, Vite, Redux Toolkit, Tailwind CSS
- **Apps:** Store App (Electron), Mango Pad (Capacitor/iPad), Check-In, Online Store
- **Package Manager:** pnpm (use `pnpm` not `npm`)
- **Key Docs:** `CLAUDE.md` at monorepo root for patterns and architecture

## Your Task

1. Read the PRD at `scripts/ralph/runs/frontdesk-fixes/prd.json`
2. Read the progress log at `scripts/ralph/runs/frontdesk-fixes/progress.txt` (check Codebase Patterns section first)
3. Read `.claude/rules/codebase-patterns.md` for accumulated patterns (auto-loaded but review for context)
4. Check you're on the correct branch from PRD `branchName`. If not, check it out.
5. **START DEV SERVER FIRST:** `cd apps/store-app && pnpm run dev` (REQUIRED for UI stories)
6. Pick the **highest priority** user story where `passes: false`
7. **Take BEFORE snapshot:** Navigate to http://localhost:5173/frontdesk, take snapshot
8. Implement that single user story
9. Run **Quality Checklist** (see below) - ALL items must pass
10. Run quality checks: `pnpm run typecheck`
11. **BROWSER VERIFICATION (MANDATORY):**
    - Refresh page, take AFTER snapshot
    - Verify no mock data ("Test Client", "10:30 AM") in snapshot
    - Test click handlers and modals work
    - Document results in progress report
12. **Update `.claude/rules/codebase-patterns.md`** with any reusable patterns discovered
13. If ALL checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
14. Update the PRD to set `passes: true` for the completed story
15. Append your progress to `scripts/ralph/runs/frontdesk-fixes/progress.txt` (MUST include browser verification results)

---

## QUALITY CHECKLIST (MANDATORY)

**Before marking ANY story as complete, verify ALL of these:**

### Code Quality
- [ ] **No hardcoded mock/test data in production code** - Remove "Test Client", fake timestamps, placeholder values
- [ ] **All imported functions/selectors are actually USED** - Don't import without using
- [ ] **All modal/callback handlers have implementations** - No undefined `onConfirm`, `onClick` callbacks
- [ ] **No suppressed unused variables** - Don't use `void _varName` to hide unused code - DELETE or IMPLEMENT it
- [ ] **No `as any` type casts** without documented reason - Use proper type guards instead
- [ ] **Files under 500 lines** - Split large files into modules (see File Size Guidelines below)

### Data Flow Verification
- [ ] **Redux selectors wired to rendering** - If you import a selector, USE it in the component render
- [ ] **Real data displays correctly** - Not mock/placeholder data
- [ ] **State changes persist** - Changes save to Redux/storage, not just local state

### UI Verification (MANDATORY for ALL Frontend Stories)
- [ ] **Dev server running** - `cd apps/store-app && pnpm run dev` started BEFORE implementing
- [ ] **BEFORE snapshot taken** - Captured page state before changes
- [ ] **AFTER snapshot taken** - Captured page state after changes
- [ ] **No forbidden strings in snapshot:**
  - [ ] No "Test Client" found
  - [ ] No "Test Service" found
  - [ ] No hardcoded "10:30 AM" or "2:00 PM" found
- [ ] **Click handlers verified** - Actually clicked buttons/links via MCP tools
- [ ] **Modals tested** - Opened and closed via MCP tools
- [ ] **Progress report includes browser verification section** - REQUIRED

### Anti-Patterns to AVOID
- [ ] **Don't import selectors without using them** - Every import must be used in render
- [ ] **Don't create modals without wiring callbacks** - `onConfirm` must dispatch actions
- [ ] **Don't mix mock data with real data** - Production render loops use ONLY real data
- [ ] **Don't suppress warnings with `void`** - Fix the root cause instead

---

## Quality Checks

Before marking a story as complete:

```bash
# From monorepo root
pnpm run typecheck          # TypeScript check (REQUIRED for all stories)
pnpm run lint               # ESLint check (if available)
```

For app-specific checks:
```bash
cd apps/mango-pad && npx tsc --noEmit   # Mango Pad typecheck
cd apps/store-app && pnpm run typecheck # Store App typecheck
```

### When to Run Tests

| Story Type | Validation Required |
|------------|---------------------|
| Type/interface changes | Typecheck + update affected test mocks |
| Business logic (calculations, payments) | Typecheck + `pnpm test` |
| UI component changes | Typecheck + browser verification |
| Infrastructure (logging, configs) | Typecheck only |

**If acceptance criteria explicitly mentions "test" or "unit test", you MUST write/run tests.**

---

## Browser Testing (MANDATORY - DO NOT SKIP)

**⚠️ CRITICAL: Every UI story MUST include browser verification. Stories that skip this step will have bugs.**

### Step 1: Start Dev Server (REQUIRED FIRST)

```bash
# For Front Desk stories (US-001 through US-024):
cd apps/store-app && pnpm run dev
# Wait for "Local: http://localhost:5173" message
```

**DO NOT proceed with implementation until dev server is running.**

### Step 2: Navigate to Feature

```bash
# Front Desk module URL:
http://localhost:5173/frontdesk
```

Use browser MCP tools:
- `mcp__chrome-devtools__navigate_page` with url: "http://localhost:5173/frontdesk"
- `mcp__chrome-devtools__take_snapshot` to see current page state
- `mcp__chrome-devtools__take_screenshot` to capture visual state

### Step 3: Verify Implementation (MANDATORY CHECKS)

**For EVERY UI story, you MUST:**

1. **Take a snapshot BEFORE implementation** - Capture baseline state
2. **Implement the change**
3. **Refresh the page** - Navigate to URL again
4. **Take a snapshot AFTER implementation** - Verify change is visible
5. **Search snapshot for forbidden strings:**
   - ❌ "Test Client" - Mock data not removed
   - ❌ "Test Service" - Mock data not removed
   - ❌ "10:30 AM" (hardcoded) - Mock timestamp
   - ❌ "2:00 PM" (hardcoded) - Mock timestamp
6. **Click interactive elements** - Verify handlers work
7. **Take final screenshot** - Document the working feature

### Step 4: Document Results in Progress Report

```
Browser verification: PASSED ✅
- Dev server: Started on localhost:5173
- URL tested: http://localhost:5173/frontdesk
- Snapshot taken: [describe what was verified]
- Screenshot saved: [if applicable]
- No mock data found in snapshot: ✅
```

**OR if verification fails:**

```
Browser verification: FAILED ❌
- Issue found: [describe the problem]
- Action taken: [how you fixed it]
- Re-verified: [PASSED/FAILED]
```

### FAILURE CONDITIONS (Story NOT Complete If Any Apply)

- ❌ Dev server not started
- ❌ Page not navigated to
- ❌ No snapshot taken
- ❌ Mock data strings found in snapshot ("Test Client", "10:30 AM", etc.)
- ❌ Click handlers don't trigger actions
- ❌ Modals don't open/close properly
- ❌ Progress report missing browser verification section

**A frontend story is NOT complete until browser verification PASSES and is DOCUMENTED.**

---

## File Size Guidelines

**Target file sizes for maintainability:**

| File Type | Target Lines | Max Lines | Action if Exceeded |
|-----------|--------------|-----------|-------------------|
| Component | <300 | 500 | Split into module structure |
| Redux slice | <400 | 600 | Extract thunks/selectors |
| Hook | <150 | 250 | Split into smaller hooks |
| Utility | <100 | 200 | Split by functionality |

### When to Split Files

If a component exceeds 500 lines, split into this structure:
```
src/components/ExampleModule/
├── index.ts                 # Barrel exports
├── ExampleModule.tsx        # Main component (~200-300 lines)
├── types.ts                 # Interfaces and types
├── constants.ts             # Default values, options
├── hooks/
│   └── useExampleLogic.ts   # Complex state logic
├── components/
│   ├── Header.tsx           # Sub-components
│   └── Content.tsx
└── utils/
    └── helpers.ts           # Utility functions
```

---

## Progress Report Format

APPEND to `scripts/ralph/runs/frontdesk-fixes/progress.txt` (never replace, always append):

```
## [Date/Time] - [Story ID]: [Story Title]
Commit: [git commit hash]

### Implementation
- What was implemented
- Files changed

### Browser Verification (REQUIRED - DO NOT OMIT)
- Dev server: ✅ Started on localhost:5173
- URL tested: http://localhost:5173/frontdesk
- BEFORE snapshot: ✅ Taken before implementation
- AFTER snapshot: ✅ Taken after implementation
- Mock data check:
  - "Test Client" found: ❌ No
  - "Test Service" found: ❌ No
  - Hardcoded times found: ❌ No
- Click handlers tested: ✅ [which elements clicked]
- Modals tested: ✅ [which modals opened/closed]
- **Result: PASSED ✅** (or FAILED ❌ with explanation)

### Learnings
- Patterns discovered
- Gotchas encountered
---
```

**⚠️ Progress reports WITHOUT the Browser Verification section are INCOMPLETE. The story should NOT be marked as `passes: true` without this section.**

---

## Consolidate Patterns

**IMPORTANT:** Add reusable patterns to `.claude/rules/codebase-patterns.md` (NOT progress.txt).

This file is a global rule that ALL Claude sessions read automatically. When you discover:
- A useful code pattern (e.g., "use X selector for Y data")
- A gotcha or pitfall (e.g., "duration is stored as string, parse with parseInt")
- An architecture insight (e.g., "Redux slice X controls Y")
- An anti-pattern to avoid (e.g., "don't import selectors without using them")

Add it to the appropriate section in `.claude/rules/codebase-patterns.md`. This makes future runs smarter.

---

## Stop Condition

If ALL stories have `passes: true`, reply with:
```
<promise>COMPLETE</promise>
```

---

## Critical Rules

1. **ONE story per iteration** - Do not attempt multiple stories
2. **Commit format:** `feat: [US-XXX] - [Story Title]`
3. **Never commit broken code** - All checks must pass first
4. **Read Codebase Patterns first** - Avoid repeating past mistakes
5. **Update PRD after commit** - Set `passes: true` for completed story
6. **Append progress** - Never delete existing progress entries
7. **⚠️ BROWSER TESTING IS MANDATORY** - You MUST:
   - Start dev server BEFORE implementing
   - Take BEFORE and AFTER snapshots
   - Search snapshots for forbidden mock data strings
   - Document verification in progress report
   - **DO NOT mark story complete without browser verification**
8. **Use pnpm** - This monorepo uses pnpm, not npm
9. **Update codebase-patterns.md** - Add discovered patterns so ALL future sessions benefit
10. **Run Quality Checklist** - ALL items must pass before marking story complete
11. **No mock data in production** - Remove ALL hardcoded test/placeholder data
12. **Wire all imports** - Every imported selector/function must be USED
13. **Progress report MUST include browser verification section** - Missing = story incomplete

---

## File Locations

| File | Purpose |
|------|---------|
| `scripts/ralph/runs/frontdesk-fixes/prd.json` | User stories with `passes` status |
| `scripts/ralph/runs/frontdesk-fixes/progress.txt` | Append-only progress log for this run |
| `.claude/rules/codebase-patterns.md` | **Accumulated patterns (UPDATE THIS)** - read by ALL sessions |
| `CLAUDE.md` | Project-specific AI instructions (READ THIS) |

---

## Common Gotchas

- **Import paths:** Use `@/` alias for src imports (e.g., `@/components/Button`)
- **Type adapters:** Supabase uses snake_case, app uses camelCase - check `src/services/supabase/adapters/`
- **MQTT topics:** Check `src/constants/mqttTopics.ts` for topic patterns
- **Design tokens:** Use `@/design-system` for colors/styling, not hardcoded values
- **Staff IDs:** Can be string or number - always handle both with proper type guards
- **Modal state:** Always implement `onConfirm` callbacks that dispatch Redux actions
- **Redux selectors:** If you import a selector, you MUST use it in the render function
