# Ralph Agent Instructions

You are an autonomous coding agent working on the Mango POS monorepo.

## Project Context

- **Stack:** React 18, TypeScript 5.5, Vite, Redux Toolkit, Tailwind CSS
- **Apps:** Store App (Electron), Mango Pad (Capacitor/iPad), Check-In, Online Store
- **Package Manager:** pnpm (use `pnpm` not `npm`)
- **Key Docs:** `CLAUDE.md` at monorepo root for patterns and architecture

## Your Task

1. Read the PRD at `scripts/ralph/prd.json`
2. Read the progress log at `scripts/ralph/progress.txt` (check Codebase Patterns section first)
3. Read `.claude/rules/codebase-patterns.md` for accumulated patterns (auto-loaded but review for context)
4. Check you're on the correct branch from PRD `branchName`. If not, check it out.
5. Pick the **highest priority** user story where `passes: false`
6. Implement that single user story
7. Run **Quality Checklist** (see below) - ALL items must pass
8. Run quality checks (typecheck, lint)
9. **Update `.claude/rules/codebase-patterns.md`** with any reusable patterns discovered
10. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
11. Update the PRD to set `passes: true` for the completed story
12. Append your progress to `scripts/ralph/progress.txt`

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

### UI Verification (Frontend Stories)
- [ ] **Browser tested** - Start dev server, navigate to feature, verify it works
- [ ] **Click handlers work** - Buttons/links trigger expected actions
- [ ] **Modals open and close** - Modal state properly managed
- [ ] **Mobile responsive** - Test on smaller viewports if applicable

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

## Browser Testing (REQUIRED for Frontend Stories)

For any story that changes UI, you MUST verify it works in the browser:

1. Start the dev server: `cd apps/[app-name] && pnpm run dev`
2. Use browser MCP tools to navigate and verify:
   - `mcp__chrome-devtools__navigate_page` - Go to a URL
   - `mcp__chrome-devtools__take_snapshot` - Get page accessibility tree
   - `mcp__chrome-devtools__click` - Click an element by uid
   - `mcp__chrome-devtools__fill` - Fill form inputs
   - `mcp__chrome-devtools__take_screenshot` - Capture screenshot

3. **Verify these specific things:**
   - Real data displays (not "Test Client" or mock timestamps)
   - Click handlers trigger correct actions
   - Modals open with correct data
   - State persists after actions

**A frontend story is NOT complete until browser verification passes.**

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

APPEND to `scripts/ralph/progress.txt` (never replace, always append):

```
## [Date/Time] - [Story ID]: [Story Title]
Commit: [git commit hash]
- What was implemented
- Files changed
- Browser verification: [PASSED/FAILED] - [what was tested]
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "this codebase uses X for Y")
  - Gotchas encountered (e.g., "don't forget to update Z when changing W")
  - Useful context (e.g., "the settings panel is in component X")
---
```

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
7. **Browser verify UI changes** - Frontend stories require visual confirmation
8. **Use pnpm** - This monorepo uses pnpm, not npm
9. **Update codebase-patterns.md** - Add discovered patterns so ALL future sessions benefit
10. **Run Quality Checklist** - ALL items must pass before marking story complete
11. **No mock data in production** - Remove ALL hardcoded test/placeholder data
12. **Wire all imports** - Every imported selector/function must be USED

---

## File Locations

| File | Purpose |
|------|---------|
| `scripts/ralph/prd.json` | User stories with `passes` status |
| `scripts/ralph/progress.txt` | Append-only progress log for this run |
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
