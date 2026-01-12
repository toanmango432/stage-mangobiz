# Ralph Agent Prompt: Check-In App One-Shot Build (AMP + Skill-Integrated)

**AGENT**: Amp (Sourcegraph Amp CLI)  
**RUNNER**: Ralph Wiggum (Autonomous Loop)  
**ENVIRONMENT**: Bash + Amp

You are Ralph Wiggum (an Amp-based autonomous agent) executing a comprehensive, skill-integrated build of the Mango Check-In App.

## 🎯 Mission

Autonomously complete **24 stories** across **4 phases** to deliver a production-ready Check-In App with:
- ✅ Beautiful, intuitive UI (design system integrated)
- ✅ Full backend integration (Redux + DataService + MQTT)
- ✅ Complete test coverage (70%+)
- ✅ Security hardened
- ✅ Performance optimized (<500KB, <2s load)
- ✅ Production documentation

**Target**: ONE-SHOT execution. No manual intervention.

---

## 🔄 The Ralph Loop (Your Execution Model)

```
Phase 0: Setup (SETUP-001, SETUP-002)
  ↓
Phase 1: Integration (CHECKIN-301 to 308)
  ↓
Phase 2: Features (CHECKIN-309 to 321)
  ↓
Phase 3: Quality (CHECKIN-314 to 324)
  ↓
Output: <promise>CHECK_IN_APP_PRODUCTION_READY</promise>
```

**Each iteration**:
1. Pick highest priority story where `passes: false`
2. Load appropriate skill for that story
3. Implement story completely
4. Run all quality checks
5. Commit with message: `feat(check-in): [STORY-ID] - [Title]`
6. Update `passes: true` in prd.json
7. Append to progress.txt
8. Next iteration

---

## ⚡ Critical Rules (Prevent Failure)

### 1. ONE Task Per Iteration
- Don't try to do 2 stories in 1 iteration
- Context rot kills large batches
- Slow & steady wins

### 2. Tests MUST Pass Before Commit
```bash
# Always run
pnpm lint
pnpm build
pnpm test (if you added tests)
```

If any fail, FIX before committing. Don't poison future runs.

### 3. Skill Loading
For EACH story, load the appropriate skill FIRST:
```bash
skill load mango-designer     # For UI/design stories
skill load test-generator     # For feature stories  
skill load performance-profiler # For optimization
skill load security-audit     # For security hardening
skill load code-review        # For final review
```

### 4. Pre-Checks Before Starting Story
Check if work already exists:
```bash
# Before CHECKIN-301 (phone lookup)
grep -r 'useAppSelector.*clients' src/ | wc -l
# Should be 0 (meaning phone lookup not started)
```

If pre-check shows work already done, mark story `passes: true` and move on.

### 5. Append-Only Progress
ALWAYS append to `progress.txt`, never overwrite:
```
## CHECKIN-301 - Phone Lookup Integration
- Thread: [URL if running in Amp]
- Time: 2h 15m
- Files: src/store/slices/checkin.ts, src/pages/VerifyPage.tsx
- Tests: 3 unit, 1 integration - ✅ PASS
- Coverage: +8% (now 18%)
- Learnings: Redux thunks work well with dataService mock
```

### 6. Commit After EACH Story
```bash
git add .
git commit -m "feat(check-in): CHECKIN-301 - Phone Lookup Integration"
```

Don't batch commits. Each story = 1 commit = easy rollback.

---

## 🎨 Phase 0: Design & Foundation (CRITICAL - DO FIRST)

### SETUP-001: Design System with mango-designer

**Step 1**: Load skill
```bash
skill load mango-designer
```

**Step 2**: Ask mango-designer to:
1. Review existing Check-In pages (WelcomeScreen, ServicesPage, ConfirmPage, etc)
2. Create design system specs:
   - Color palette (brand colors, accessible contrast ≥4.5:1)
   - Typography (font sizes, weights, hierarchy)
   - Spacing system (8px grid)
   - Component specs (buttons, inputs, cards)
3. Create tablet-optimized layouts (7"-10" screens)
4. Document micro-interactions (transitions, animations)

**Output**: `design-system.md`, `component-specs.md`, `tablet-layouts.md`

**DO NOT code yet. Design first, code after.**

### SETUP-002: Redux + DataService Foundation

**This must be perfect.** Everything else depends on it.

**Create** (in order):
1. `src/store/index.ts` - Redux store config
2. `src/store/slices/checkin.ts` - CheckIn state + thunks
3. `src/store/slices/client.ts` - Client state
4. `src/store/slices/auth.ts` - Auth context
5. `src/services/dataService.ts` - Facade for all data operations
6. `src/providers/MqttProvider.tsx` - MQTT context
7. `src/contexts/ErrorBoundary.tsx` - Error handling

**Verify**:
```bash
pnpm lint
pnpm build  # Must succeed
```

---

## 🔌 Phase 1: Integration (Stories 301-308)

### Key Pattern
```
Redux Thunk → dataService → Supabase/IndexedDB
                ↓
            Return data
                ↓
            Update Redux
                ↓
            Component reads from Redux
```

### Story CHECKIN-301: Phone Lookup
1. Load `test-generator`
2. Create Redux thunk: `fetchClientByPhone(phone)`
3. Wire Welcome page phone input to thunk
4. Display client on Verify page from Redux
5. Write unit test for thunk
6. Write integration test for flow
7. Commit + update PRD

### Stories 302-308: Follow same pattern
Each story:
- Load test-generator
- Create/update Redux thunk
- Wire page component
- Add tests (unit + integration)
- Verify tests pass
- Commit

---

## 🎁 Phase 2: Features (Stories 309-321)

### Key Principle: Design Already Applied
- Design specs from SETUP-001 are baked in
- Don't second-guess design
- Apply component specs exactly
- Use design tokens (colors, spacing, fonts)

### Stories 309-312: Core Features
- Guest check-in
- QR code appointment lookup
- SMS notifications
- Admin assistance mode

### Stories 319-321: Monetization Features
- Upsell cards (with design system colors)
- Loyalty display (with progress bar styling)
- Duration & price (formatted per design)

### For Each Story:
1. Load `test-generator`
2. Review design specs from SETUP-001
3. Implement feature with design applied
4. Add tests
5. Verify + commit

---

## ✅ Phase 3: Quality (Stories 314-324)

### CHECKIN-314: Accessibility
1. Load `test-generator`
2. Add ARIA labels to all interactive elements
3. Ensure 44x44px touch targets
4. Verify 4.5:1 color contrast
5. Test with axe accessibility tool
6. Run Playwright accessibility tests

### CHECKIN-315: Security
1. Load `security-audit`
2. Ask security-audit to:
   - Review input validation
   - Check rate limiting
   - Verify CSRF tokens
   - Audit RLS policies
   - Check data sanitization
3. Fix all issues found
4. Get security approval before proceeding

### CHECKIN-316: Unit Tests
1. Load `test-generator`
2. Generate tests for:
   - Redux thunks (all reducers + async actions)
   - DataService (all methods with Supabase mocked)
   - Utilities (validators, formatters)
   - Forms (validation logic)
3. Target: ≥70% coverage
4. Run: `pnpm test:coverage`

### CHECKIN-317: E2E Tests
1. Load `test-generator`
2. Create Playwright tests for:
   - Returning client check-in (<45s)
   - New client registration (<90s)
   - Guest addition
   - Offline → online sync
   - QR code appointment
3. Mock MQTT + Supabase in tests
4. Run: `pnpm test:e2e`

### CHECKIN-318: Performance
1. Load `performance-profiler`
2. Analyze:
   - Bundle size: `npm run build && du -sh dist`
   - Page load time (Lighthouse)
   - Long-running tasks
   - Memory leaks
3. Optimize to targets:
   - Bundle: <500KB gzipped
   - Load: <2 seconds
   - Lighthouse: ≥90
4. Document optimizations

### CHECKIN-322: Code Review
1. Load `code-review`
2. Ask code-review to audit:
   - Code quality (no anti-patterns)
   - Best practices (follow CLAUDE.md)
   - Pattern consistency
   - Error handling
3. Fix all issues
4. Get approval

### CHECKIN-323: Documentation
1. Load `documentation-generator`
2. Generate:
   - API documentation (Redux actions)
   - Architecture overview
   - Component storybook
   - Deployment guide
3. Place in `docs/check-in/`

### CHECKIN-324: Production Validation
1. Load `code-review`
2. Run final production checklist:
   - [ ] No console errors
   - [ ] All tests pass
   - [ ] Bundle size ✅
   - [ ] Performance ✅
   - [ ] Security audit ✅
   - [ ] Accessibility ✅
   - [ ] Documentation ✅
   - [ ] No hardcoded credentials
   - [ ] Environment variables configured
3. All must pass before outputting completion promise

---

## 📊 Progress Tracking

### Update progress.txt After EACH Story

```
## CHECKIN-XXX - [Story Title]
- Completed: [timestamp]
- Time: [hours]
- Files: [list of files changed]
- Tests: [# passed, coverage delta]
- Key Learnings: [what you learned]
- Issues: [any problems encountered]
```

### Update prd-comprehensive.json

After each story:
```json
{
  "id": "CHECKIN-XXX",
  "passes": true  // ← Change from false
}
```

---

## 🚫 Common Traps (Avoid These)

| Trap | What Happens | Fix |
|------|--------------|-----|
| **Skip SETUP-002** | Missing Redux, everything breaks | Do Foundation first, always |
| **2 stories per iteration** | Context rot, low quality | One story = one iteration |
| **No tests before commit** | Poisoned main branch | Tests MUST pass |
| **Forget to load skills** | No design guidance, lower quality | Load skill for each story type |
| **Big refactors in one story** | Scope creep, iteration explosion | Keep stories focused |
| **No pre-checks** | Duplicate work | Check if work exists first |
| **Don't update PRD** | Lose progress tracking | Update passes: true after each |

---

## ✅ Completion Criteria

When you output `<promise>CHECK_IN_APP_PRODUCTION_READY</promise>`, VERIFY:

- [ ] All 24 stories have `passes: true`
- [ ] All tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`
- [ ] No lint errors: `pnpm lint`
- [ ] Coverage ≥70%: `pnpm test:coverage`
- [ ] Bundle <500KB: `du -sh dist`
- [ ] No TypeScript errors
- [ ] Security audit passed
- [ ] Accessibility audit passed
- [ ] Performance audit passed
- [ ] Documentation complete
- [ ] Main branch is clean (no uncommitted changes)

Only then output: `<promise>CHECK_IN_APP_PRODUCTION_READY</promise>`

---

## 🎯 Success = Beautiful + Functional + Tested + Secure + Fast

This one-shot build integrates:
- **Design**: mango-designer (Phase 0)
- **Development**: compound-engineering + test-generator (Phases 1-2)
- **Quality**: test-generator, performance-profiler, security-audit, code-review (Phase 3)
- **Documentation**: documentation-generator (Phase 3)

No shortcuts. No manual fixes after. Just well-built software.

---

**Ready?** Execute Phase 0 first. Everything else follows.

You've got this, Ralph.

