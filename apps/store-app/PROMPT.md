# Gift Card Module - Ralph Loop

You are completing the Gift Card Module for Mango POS Store App.

## Reference Files
- `plan.md` - Implementation details, file paths, code patterns
- `test-plan.json` - Tasks with verification commands
- `progress.txt` - Append-only log of completed work

## Critical Rules

1. **ONE task per loop** — Work on first task where `passes: false`
2. **Read plan.md** — Reference it for file paths and code patterns
3. **Build must PASS** — Run build command before marking complete
4. **STOP on failure** — Output `<notify>BUILD FAILED</notify>` and halt
5. **APPEND to progress.txt** — Use `>>` never `>`
6. **Use mango-designer for UI tasks** — Tasks marked `ui: true` need design guidance

## Loop Steps

### Step 1: Find Current Task
```
Read test-plan.json
Find first task where "passes": false
Read plan.md for implementation details
```

### Step 2: Execute Task

**For UI tasks (`ui: true`):**
1. Output: `<notify>NEED DESIGN INPUT: [task name]</notify>`
2. Invoke /mango-designer skill
3. Wait for design direction, then implement

**For non-UI tasks:**
1. Read relevant section in plan.md
2. Implement the changes
3. Run the verification command

### Step 3: Verify & Update

**If build PASSES:**
```
1. Update test-plan.json: "passes": true, "status": "passed"
2. Append to progress.txt:
   ---
   Time: [ISO timestamp]
   Task: [task name]
   Result: ✓ PASSED
   Files: [changed files]
   ---
3. Commit: git add -A && git commit -m "[type]: [task]"
4. Output: <notify>TASK COMPLETE: [task]</notify>
```

**If build FAILS:**
```
1. Update test-plan.json: "status": "failed", "notes": "[error]"
2. Append to progress.txt: ✗ FAILED: [task] - [error]
3. Output: <notify>BUILD FAILED: [error summary]</notify>
4. STOP - do not continue
```

### Step 4: Check Completion

After ALL 15 tasks pass:
1. Count `✓ PASSED` entries in progress.txt
2. If count = 15 and no failures:
   - Output: `<notify>VERIFICATION COMPLETE</notify>`
   - Do NOT output completion promise yet

### Step 5: Final Confirmation (Next Loop)

On next iteration after verification:
1. Re-verify all 15 tasks passed
2. Run: `npm run build && npm run lint`
3. If all pass: `<promise>ALL_DONE</promise>`

## Notifications

- `<notify>TASK COMPLETE: [task]</notify>` — Ready for review
- `<notify>BUILD FAILED: [error]</notify>` — Stopped, needs fix
- `<notify>NEED DESIGN INPUT: [task]</notify>` — Waiting for mango-designer
- `<notify>BLOCKED: [reason]</notify>` — Cannot proceed
- `<promise>ALL_DONE</promise>` — Module complete (only after verification loop)

## Important

- NEVER output `<promise>ALL_DONE</promise>` until TWO loops confirm completion
- ALWAYS read plan.md before implementing - it has the exact code patterns
- ALWAYS run build command before marking task passed
