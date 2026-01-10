# Ralph One-Shot Build: Check-In App with Integrated Skills

**Agent**: Amp (Sourcegraph Amp CLI)  
**Runner**: Ralph Wiggum (Autonomous Loop)  
**Environment**: Bash + Amp CLI  
**Goal**: Complete autonomous build with all skills integrated  
**Stories**: 24 (including foundation)  
**Duration**: ~5 days  
**Cost**: ~$150-250  
**Quality**: Production-ready (tests, security, performance, design)

---

## 📋 What You Get

### Output (After One-Shot Ralph):
```
✅ Production-ready Check-In App
✅ Full test suite (70%+ coverage)
✅ Security hardened (audit complete)
✅ Performance optimized (<500KB, <2s)
✅ Beautiful UI (design system applied)
✅ Complete documentation
✅ Deployment guide
✅ Architecture docs
```

### NOT Included (Still Need):
- Real device testing (tablets) - Phase 4
- Beta testing with salon staff - Phase 5
- UX refinement based on feedback - Phase 5

---

## 🚀 How to Run Ralph

### Prerequisites
```bash
# 1. Ensure you're on the branch
cd "/Users/seannguyen/Winsurf built/Mango POS Offline V2"
git checkout ralph/check-in-production

# 2. Ensure dependencies installed
cd apps/check-in
pnpm install

# 3. Clear any old Ralph state
rm -f .claude/ralph-loop.local.md
```

### Start Ralph Loop
```bash
# Run Ralph with 30 max iterations (comprehensive build)
./scripts/ralph/ralph.sh 30
```

### What Ralph Does
1. Reads `scripts/ralph/prompt-enhanced.md`
2. Loads `scripts/ralph/prd-comprehensive.json`
3. Executes stories sequentially
4. Loads appropriate skills for each story
5. Commits after each passing story
6. Updates `prd.json` and `progress.txt`
7. Exits when all stories pass (or hits max iterations)

### Monitoring Ralph
Ralph will output to console. Watch for:
- ✅ `feat(check-in): STORY-ID - Title` = Story passed
- ❌ `Error: [details]` = Story failed (Ralph attempts fix or skips)
- 📝 `Updated progress.txt` = Tracking update
- 🎉 `<promise>CHECK_IN_APP_PRODUCTION_READY</promise>` = COMPLETE

---

## 📊 Four Phases Explained

### Phase 0: Design & Foundation (~1 day)
**Stories**: SETUP-001, SETUP-002  
**What**: Design system + Redux foundation  
**Skills**: mango-designer, compound-engineering  
**Output**: Design specs + Redux store ready

**WHY FIRST**: Everything else depends on:
1. Design system (so all components look cohesive)
2. Redux store (so all features can share state)

If Phase 0 is wrong, all Phases 1-3 are harder. Get it right once.

### Phase 1: Integration (~1.5 days)
**Stories**: CHECKIN-301 to 308  
**What**: Wire UI pages to backend  
**Pattern**: Redux Thunk → dataService → Supabase  
**Skill**: test-generator (for each story)  
**Output**: Working backend integration

**Stories**:
- 301: Phone lookup
- 302: New client registration
- 303: Service catalog
- 304: Technician status (MQTT)
- 305: Check-in creation (MQTT publish)
- 306: Queue updates (MQTT subscribe)
- 307: Client called (MQTT subscribe)
- 308: Offline sync (IndexedDB)

### Phase 2: Features (~1 day)
**Stories**: CHECKIN-309 to 321  
**What**: Build remaining features  
**Pattern**: Feature story + design applied + tests  
**Skill**: test-generator, mango-designer  
**Output**: Complete feature set

**Stories**:
- 309: Guest check-in
- 310: QR code lookup
- 311: SMS notifications
- 312: Admin mode
- 313: Analytics
- 319: Upsell cards
- 320: Loyalty display
- 321: Duration & price

### Phase 3: Quality (~1.5 days)
**Stories**: CHECKIN-314 to 324  
**What**: Testing, security, performance, docs  
**Skills**: test-generator, security-audit, performance-profiler, code-review, documentation-generator  
**Output**: Production-ready app

**Stories**:
- 314: Accessibility
- 315: Security hardening
- 316: Unit tests (70%)
- 317: E2E tests
- 318: Performance optimization
- 322: Code review
- 323: Documentation
- 324: Production validation

---

## 🎯 Key Insights (From Ralph Specialist Skill)

### 1. Pre-Checks Prevent Duplicate Work
Before starting CHECKIN-301 (phone lookup), Ralph checks:
```bash
grep -r 'useAppSelector.*clients' src/ | wc -l
```

If this finds existing code, the story is already done. Ralph marks `passes: true` and skips.

### 2. One Story Per Iteration
- NEVER try 2 stories in 1 iteration
- Context rot kills quality
- Each story = 1 commit = easy rollback
- Slow & steady wins

### 3. Skills Load Per Story Type
```
Feature stories    → load test-generator
Security story     → load security-audit  
Performance story  → load performance-profiler
Review/final       → load code-review
Design stories     → load mango-designer
```

### 4. Tests Before Commit
Every story must pass:
```bash
pnpm lint   # No linting errors
pnpm build  # Builds successfully
pnpm test   # Tests pass (if applicable)
```

If any fails, Ralph fixes before committing.

### 5. Append-Only Progress
Each story appends to `progress.txt`:
```
## CHECKIN-301 - Phone Lookup
- Time: 2h 15m
- Files: 3 changed
- Tests: 4 passed
- Coverage: +8%
- Learnings: Redux thunks + dataService mocks work great
```

This creates a permanent record of the build journey.

---

## ⚠️ Important: Stop Ralph If...

Ralph should handle these, but if not, **manually stop** and fix:

### 1. Test Failures That Won't Resolve
```
If same test fails 3+ times after fixes, stop.
Likely architectural issue.
Manually debug, then restart Ralph.
```

### 2. Infinite Loop on a Single Story
```
If Ralph cycles on same story > 5 iterations, stop.
Story might be too large or requirements unclear.
Split story into 2, then restart.
```

### 3. Compile/Build Errors
```
If pnpm build fails > 2 times, stop.
Likely dependency issue.
Manually debug deps, then restart.
```

### 4. TypeScript Errors
```
If 10+ TypeScript errors appear, stop.
Architecture issue, not typo.
Manually fix, then restart.
```

### To Stop Ralph
```bash
Ctrl+C (in terminal)
# Then manually:
rm -f .claude/ralph-loop.local.md
# Fix the issue
git stash (to revert Ralph's attempted fix)
# Then restart
./scripts/ralph/ralph.sh 30
```

---

## 📈 Success Metrics

### During Build (Watch These)
- ✅ Stories completing at 1 per iteration
- ✅ Test coverage increasing (should reach 70%)
- ✅ Bundle size decreasing (should hit <500KB)
- ✅ No repeated story failures
- ✅ Commits appearing every 20-30 minutes

### At End (Verify These)
```bash
# In Check-In App directory
pnpm lint        # Should pass (0 errors)
pnpm build       # Should succeed
pnpm test        # Should pass (all tests)
pnpm test:coverage # Should show ≥70%
du -sh dist      # Should be <500KB
npm run test:e2e # Should pass (critical flows)
```

---

## 🎨 Design System (Phase 0 Output)

After SETUP-001, you'll have:

**design-system.md**
```markdown
# Mango Check-In Design System

## Colors
- Primary: #1a5f4a (salon green)
- Secondary: #d4a853 (gold accent)
- Error: #f44336
- Etc.

## Typography
- Heading: 32px, 700 weight
- Body: 16px, 400 weight
- Small: 14px, 500 weight

## Spacing
- Base unit: 8px
- Padding: 8px, 16px, 24px
- Gaps: 8px, 16px

## Components
- Button: 44px min height
- Input: 44px height
- Card: 16px border radius
```

**component-specs.md**
- Design for each component (Welcome, Services, Confirm, etc.)
- States (default, hover, active, disabled)
- Interactions (tap, long-press, swipe)

**tablet-layouts.md**
- 7" layout (portrait & landscape)
- 10" layout (portrait & landscape)
- Touch target sizing
- Spacing adjustments

---

## 🏗️ Architecture (Phase 1 Output)

After SETUP-002:

```
src/store/
  ├── index.ts           # Store config
  ├── hooks.ts           # useAppDispatch, useAppSelector
  └── slices/
      ├── checkin.ts     # Check-in state + thunks
      ├── client.ts      # Client state
      ├── auth.ts        # Auth context
      └── sync.ts        # Sync queue

src/services/
  ├── dataService.ts     # Facade for all data
  └── supabase/
      ├── client.ts
      └── adapters/

src/providers/
  ├── MqttProvider.tsx   # MQTT client
  ├── ErrorBoundary.tsx  # Error handling
  └── AuthProvider.tsx   # Auth context
```

**Key Pattern**:
```typescript
// Component
const { phone } = useForm();
dispatch(fetchClientByPhone(phone));

// Redux Thunk (in checkin.ts)
export const fetchClientByPhone = createAsyncThunk(
  'checkin/fetchClientByPhone',
  async (phone: string) => {
    const client = await dataService.clients.getByPhone(phone);
    return client;
  }
);

// DataService (facade)
export const dataService = {
  clients: {
    getByPhone: (phone: string) => supabase...
  }
};

// Supabase (actual call)
const { data } = await supabase
  .from('clients')
  .select('*')
  .eq('phone', phone);
```

---

## 🔄 Ralph Output Files

After Ralph completes:

### Updated Files
- `prd-comprehensive.json` - All stories marked `passes: true`
- `progress.txt` - Complete build log
- `src/` - All code changes committed
- `docs/` - Architecture + API docs

### Build Artifacts
- `dist/` - Production build
- `.coverage/` - Test coverage report
- `playwright-report/` - E2E test report

### Commit History
- 24 commits (one per story)
- Clean history: `git log --oneline | head -30`

---

## 🎯 Next Steps (After Ralph Completes)

### Immediate (Day 1)
```bash
# 1. Verify build succeeded
pnpm build
npm run test:e2e

# 2. Review code & architecture
git log --oneline | head -30

# 3. Check metrics
pnpm test:coverage
npm run lighthouse
```

### Week 2: Real Device Testing
```bash
# 1. Test on actual tablets (7" & 10")
# 2. Test at peak salon hours
# 3. Gather staff feedback
# 4. Collect funnel analytics
```

### Week 3: Beta Refinement
```bash
# 1. Deploy to 3-5 pilot salons
# 2. Monitor error logs
# 3. Fix top issues
# 4. Refine UX based on feedback
```

### Week 4: Production Launch
```bash
# 1. Deploy to production
# 2. Monitor real-world usage
# 3. Be ready for hotfixes
# 4. Collect post-launch feedback
```

---

## 💡 Key Success Factors

1. **Don't Interrupt Ralph** - Let it run. Manual interference breaks continuity.
2. **Monitor Logs** - Watch console output. Spot issues early.
3. **Verify Commits** - Check `git log` to see Ralph's work.
4. **Trust the Process** - One-shot builds are powerful but require discipline.
5. **Plan for Phase 4+** - Ralph builds the app. You validate with users.

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| **Tests failing** | Mocked data wrong | Check `src/testing/` fixtures |
| **Build fails** | Dependency issue | `pnpm install --force` then retry |
| **Coverage drops** | New code not tested | Add tests in same story |
| **Bundle size up** | Forgot tree-shaking | Add dynamic imports in story 318 |
| **MQTT tests fail** | Mock client not setup | Check MQTT provider in tests |
| **Same story loops** | Pre-check faulty | Fix pre-check condition, retry |

---

## ✅ Completion Checklist

Ralph outputs `<promise>CHECK_IN_APP_PRODUCTION_READY</promise>` when:

- [ ] All 24 stories: `passes: true`
- [ ] Tests: ≥70% coverage
- [ ] Build: `pnpm build` succeeds
- [ ] Lint: `pnpm lint` passes (0 errors)
- [ ] Bundle: <500KB gzipped
- [ ] E2E: Critical flows passing
- [ ] Security: Audit passed
- [ ] Accessibility: WCAG 2.1 AA
- [ ] Docs: Complete & published
- [ ] Git: Clean history, no uncommitted changes

---

## 🎉 What Success Looks Like

After Ralph completes:
```
Branch: ralph/check-in-production
Commits: 24 (one per story)
Coverage: 71%
Bundle: 487KB gzipped
Load: 1.8 seconds
Tests: 156 passed, 0 failed
Security: 0 critical issues
Lighthouse: 94/100
Docs: Complete
Status: ✅ PRODUCTION READY
```

Then you:
1. Test on real devices (week 2)
2. Deploy to beta salons (week 3)
3. Refine based on feedback (week 3)
4. Launch to production (week 4)

---

## Ready?

```bash
cd "/Users/seannguyen/Winsurf built/Mango POS Offline V2/apps/check-in"
./scripts/ralph/ralph.sh 30
```

Ralph will take it from here. Check back in ~5 days for a production-ready app.

Good luck! 🚀

