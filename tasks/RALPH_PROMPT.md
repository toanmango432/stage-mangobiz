# Ralph Loop: Book & FrontDesk Module Tests

You are running iterative TDD tasks for the Mango POS Store App.

## Project Context

- **Location:** `/Users/seannguyen/Winsurf built/Mango POS Offline V2/apps/store-app/`
- **Test Framework:** Vitest with jsdom
- **Test Command:** `pnpm test`
- **Coverage Command:** `pnpm test:coverage`

## Modules Under Test

1. **FrontDesk Module:** `src/components/frontdesk/` (27 files)
   - FrontDesk.tsx, FrontDeskHeader.tsx, FrontDeskMetrics.tsx
   - FrontDeskSubTabs.tsx, FrontDeskEmptyState.tsx, FrontDeskSkeleton.tsx

2. **Book Module:** `src/components/Book/` (49 files)
   - BookSidebar.tsx, QuickBookBar.tsx, SmartBookingPanel.tsx
   - OneTapBookingCard.tsx, GroupBookingModal.tsx, ResponsiveBookModal.tsx

## Critical Rules

1. **ONE task per loop** - Never do more than one task
2. **Tests must PASS before commit** - Never commit failing code
3. **STOP if tests fail after implementation** - Output `<notify>` and halt
4. **APPEND to progress.txt** - Never delete previous entries
5. **Two-loop minimum** - Do not output completion promise on first pass

## Your Loop

### Step 1: Read the Plan
Open `tasks/ralph-test-plan.json` and find the first task where `"passes": false`

### Step 2: Execute That ONE Task

**For test writing tasks:**
1. Create test file in `src/components/[module]/__tests__/[Component].test.tsx`
2. Write meaningful tests (not just coverage):
   - Test rendering
   - Test user interactions
   - Test edge cases
   - Test error states

**Test file template:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('...')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const onAction = vi.fn();
    render(<ComponentName onAction={onAction} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalled();
  });
});
```

### Step 3: Run the Test Command
Execute the command specified in the task's `"command"` field.

### Step 4: Check Results

**If tests PASS:**
- Update `ralph-test-plan.json`: set `"passes": true`, `"status": "passed"`
- Append to `tasks/ralph-progress.txt` with prefix: `[PASSED] [task name]`
- Commit: `git add -A && git commit -m "test(module): [task name]"`

**If tests FAIL:**
- Update `ralph-test-plan.json`: set `"status": "failed"`, add error to `"notes"`
- Append to `tasks/ralph-progress.txt` with prefix: `[FAILED] [task name] - [error]`
- Try to fix the issue (this is TDD - tests may fail initially)
- If still failing after fix attempt, output: `<notify>TESTS FAILED: [task] - [error summary]</notify>`
- STOP - do not continue

### Step 5: Verification Check

After all tasks show `"passes": true`:
1. Read `tasks/ralph-progress.txt`
2. Count entries with `[PASSED]` prefix
3. Expected count: 19 tasks
4. If count matches AND no `[FAILED]` entries:
   - Output: `<notify>VERIFICATION COMPLETE</notify>`
   - Do NOT output completion promise yet

### Step 6: Final Confirmation (Next Iteration Only)

On the NEXT iteration after verification:
1. Re-read `tasks/ralph-progress.txt` and `tasks/ralph-test-plan.json`
2. Confirm all 19 tasks show `[PASSED]`
3. Run final verification: `cd "apps/store-app" && pnpm test:coverage -- --run`
4. If coverage >= 70%: Output `<promise>ALL_DONE</promise>`

## Progress Log Format

Always APPEND (use >>), never overwrite:

```
---
Time: [ISO timestamp]
Task: [task id] - [task name]
Result: [PASSED] or [FAILED]
Details: [what happened, files created/modified]
---
```

## Completion Criteria

Do NOT output `<promise>ALL_DONE</promise>` until:
- ALL 19 tasks in ralph-test-plan.json have `"passes": true`
- progress.txt shows 19 `[PASSED]` entries
- No `[FAILED]` entries in final state
- Coverage >= 70% for Book and FrontDesk modules
- At least TWO loops have run since all tasks passed

## Test Patterns for This Project

### Redux-connected components:
```typescript
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

const mockStore = configureStore({
  reducer: { /* relevant slices */ },
  preloadedState: { /* initial state */ }
});

render(
  <Provider store={mockStore}>
    <ComponentUnderTest />
  </Provider>
);
```

### Components with hooks:
```typescript
vi.mock('@/hooks/useFrontDeskState', () => ({
  useFrontDeskState: () => ({
    tickets: [],
    isLoading: false,
    // ... mock return values
  })
}));
```

### Async operations:
```typescript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Files to Reference

- Test setup: `src/testing/setup.ts`
- Existing tests: `src/testing/unit/frontdesk/`
- Type definitions: `src/types/`
- Design tokens: `src/design-system/`
