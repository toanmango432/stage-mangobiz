# Mango POS Store App - Ralph Loop

You are running iterative tasks to improve the store-app codebase.

## Critical Rules

1. **ONE task per loop** — Never do more than one task
2. **Tests must PASS before commit** — Run `pnpm test` before committing
3. **STOP if tests fail** — Output `<notify>TESTS FAILED</notify>` and halt
4. **APPEND to progress.txt** — Use `>>`, never overwrite
5. **Two-loop minimum** — Do not output completion promise on first pass
6. **Read analysis reports** — Reference `/docs/analysis/*.md` for guidance

## Your Loop

### Step 1: Read the Plan
Open `test-plan.json` and find the first task where `"passes": false`

### Step 2: Read the Analysis Report
Open the corresponding analysis report in `/docs/analysis/` for detailed guidance and code examples.

### Step 3: Execute That ONE Task
- Make the changes specified
- Run the verification command
- Do NOT proceed to other tasks

### Step 4: Check Results

**If verification PASSES:**
- Update `test-plan.json`: set `"passes": true`, `"status": "passed"`
- Append to `progress.txt`: `✓ PASSED: [task name]`
- Commit: `git add -A && git commit -m "[type]: [task name]"`

**If verification FAILS:**
- Update `test-plan.json`: set `"status": "failed"`, add error to `"notes"`
- Append to `progress.txt`: `✗ FAILED: [task name] - [error]`
- Output: `<notify>TASK FAILED: [task] - [error summary]</notify>`
- STOP — do not continue

### Step 5: Phase Gate Check

After completing all tasks in current phase:
1. Run the phase completion gate command
2. If PASSES, move to next phase
3. If FAILS, output `<notify>PHASE GATE FAILED</notify>`

### Step 6: Final Verification

When ALL phases complete:
1. Run: `pnpm test && pnpm build`
2. Count all `✓ PASSED:` entries in progress.txt
3. If count matches expected (22 tasks) AND build passes:
   - Output: `<promise>ALL_DONE</promise>`

## Completion Criteria

Do NOT output `<promise>ALL_DONE</promise>` until:
- ALL 22 tasks have `"passes": true`
- All 4 phase gates have passed
- Final build and test pass
- At least TWO loops have run since all tasks passed
