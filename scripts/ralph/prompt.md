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
3. Read `scripts/ralph/patterns.md` for accumulated patterns from previous runs
4. Check you're on the correct branch from PRD `branchName`. If not, check it out.
5. Pick the **highest priority** user story where `passes: false`
6. Implement that single user story
7. Run quality checks (typecheck, lint)
8. Update CLAUDE.md if you discover reusable patterns
9. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
10. Update the PRD to set `passes: true` for the completed story
11. Append your progress to `scripts/ralph/progress.txt`

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

## Browser Testing (Required for Frontend Stories)

For any story that changes UI, verify it works in the browser:

1. Start the dev server: `cd apps/[app-name] && pnpm run dev`
2. Use browser MCP tools to navigate and verify:
   - `mcp__chrome-devtools__navigate_page` - Go to a URL
   - `mcp__chrome-devtools__take_snapshot` - Get page accessibility tree
   - `mcp__chrome-devtools__click` - Click an element by uid
   - `mcp__chrome-devtools__fill` - Fill form inputs
   - `mcp__chrome-devtools__take_screenshot` - Capture screenshot

**A frontend story is NOT complete until browser verification passes.**

## Progress Report Format

APPEND to `scripts/ralph/progress.txt` (never replace, always append):

```
## [Date/Time] - [Story ID]: [Story Title]
Commit: [git commit hash]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "this codebase uses X for Y")
  - Gotchas encountered (e.g., "don't forget to update Z when changing W")
  - Useful context (e.g., "the settings panel is in component X")
---
```

## Consolidate Patterns

Add reusable patterns to `## Codebase Patterns` section at TOP of progress.txt.
These patterns help future iterations avoid repeating mistakes.

## Stop Condition

If ALL stories have `passes: true`, reply with:
```
<promise>COMPLETE</promise>
```

## Critical Rules

1. **ONE story per iteration** - Do not attempt multiple stories
2. **Commit format:** `feat: [US-XXX] - [Story Title]`
3. **Never commit broken code** - All checks must pass first
4. **Read Codebase Patterns first** - Avoid repeating past mistakes
5. **Update PRD after commit** - Set `passes: true` for completed story
6. **Append progress** - Never delete existing progress entries
7. **Browser verify UI changes** - Frontend stories require visual confirmation
8. **Use pnpm** - This monorepo uses pnpm, not npm

## File Locations

| File | Purpose |
|------|---------|
| `scripts/ralph/prd.json` | User stories with `passes` status |
| `scripts/ralph/progress.txt` | Append-only progress log |
| `scripts/ralph/patterns.md` | Persistent patterns across all runs |
| `CLAUDE.md` | Project-specific AI instructions (READ THIS) |

## Common Gotchas

- **Import paths:** Use `@/` alias for src imports (e.g., `@/components/Button`)
- **Type adapters:** Supabase uses snake_case, app uses camelCase - check `src/services/supabase/adapters/`
- **MQTT topics:** Check `src/constants/mqttTopics.ts` for topic patterns
- **Design tokens:** Use `@/design-system` for colors/styling, not hardcoded values
