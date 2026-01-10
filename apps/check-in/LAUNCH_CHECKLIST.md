# Ralph One-Shot Build: Launch Checklist

**Ready to run Ralph autonomously to build the Check-In App?**

Use this checklist to ensure everything is set up correctly.

---

## ✅ Pre-Ralph Setup (Do This First)

- [ ] On correct branch: `git branch --show-current` = `ralph/check-in-production`
- [ ] Repository clean: `git status` shows no uncommitted changes
- [ ] Dependencies installed: `pnpm install` completed
- [ ] Old Ralph state cleared: `rm -f .claude/ralph-loop.local.md`
- [ ] All 7 skills synced: `ls ~/.claude/skills/` includes:
  - [ ] compound-engineering
  - [ ] dev-browser
  - [ ] docx
  - [ ] frontend-design
  - [ ] pdf
  - [ ] prd
  - [ ] ralph

## ✅ Ralph Configuration

- [ ] PRD file exists: `scripts/ralph/prd-comprehensive.json`
- [ ] Prompt file exists: `scripts/ralph/prompt-enhanced.md`
- [ ] Ralph script executable: `chmod +x scripts/ralph/ralph.sh`
- [ ] Max iterations set to 30: In `prd-comprehensive.json`
- [ ] Completion promise set: `"completionPromise": "CHECK_IN_APP_PRODUCTION_READY"`

## ✅ Project State

- [ ] Source files ready: `src/` directory exists
- [ ] Pages completed: 10 pages in `src/pages/`
- [ ] Components ready: UI components in `src/components/`
- [ ] Types defined: `src/types/checkin-config.ts` exists
- [ ] Package.json verified: `pnpm lint` and `pnpm build` commands exist

## ✅ Documentation Ready

- [ ] Main PRD: `docs/product/PRD-Check-In-App.md`
- [ ] CLAUDE.md: Parent project instructions
- [ ] This guide: `RALPH_ONE_SHOT_GUIDE.md`
- [ ] Feature specs: `FEATURE_ADDITIONS.md`
- [ ] Skills list: `SKILLS_QUICK_START.txt`

## ✅ Final Verification

Run these commands from `apps/check-in`:

```bash
# 1. Code quality
pnpm lint
# Expected: 0 errors, 0 warnings

# 2. Build test
pnpm build
# Expected: dist/ folder created, <10MB initial

# 3. Dependencies
pnpm list
# Expected: All dependencies resolved

# 4. Git status
git status
# Expected: "On branch ralph/check-in-production" + clean working directory

# 5. Ralph readiness
ls -la scripts/ralph/
# Expected: ralph.sh (executable), prd-comprehensive.json, prompt-enhanced.md
```

---

## 🚀 Ready to Launch Ralph

### Command to Run

```bash
cd "/Users/seannguyen/Winsurf built/Mango POS Offline V2/apps/check-in"
./scripts/ralph/ralph.sh 30
```

### What Ralph Will Do

1. **Phase 0** (Stories SETUP-001, SETUP-002)
   - Load mango-designer → create design system
   - Load compound-engineering → setup Redux + dataService
   - Duration: ~1 day

2. **Phase 1** (Stories CHECKIN-301 to 308)
   - Wire UI to backend
   - Load test-generator for each story
   - Duration: ~1.5 days

3. **Phase 2** (Stories CHECKIN-309 to 321)
   - Build features with design system applied
   - Load test-generator + mango-designer
   - Duration: ~1 day

4. **Phase 3** (Stories CHECKIN-314 to 324)
   - Add tests, security, performance, docs
   - Load: test-generator, security-audit, performance-profiler, code-review, documentation-generator
   - Duration: ~1.5 days

5. **Output**: `<promise>CHECK_IN_APP_PRODUCTION_READY</promise>`

---

## 📊 Expected Timeline

| Phase | Stories | Time | Status |
|-------|---------|------|--------|
| Phase 0 | 2 (setup) | 1 day | Foundation |
| Phase 1 | 8 (integration) | 1.5 days | Backend wiring |
| Phase 2 | 8 (features) | 1 day | Feature building |
| Phase 3 | 8 (quality) | 1.5 days | Testing/hardening |
| **Total** | **24** | **~5 days** | **Production-ready** |

---

## ⏱️ Cost Estimate

- Iterations: 24-30
- Time per iteration: 10-15 minutes
- Token cost per iteration: $5-8
- **Total**: ~$150-250

---

## 🎯 Success Criteria (Ralph Will Verify)

After completion, Ralph outputs will show:

```
✅ All 24 stories: passes = true
✅ Test coverage: ≥70%
✅ Build: Succeeds with 0 errors
✅ Lint: 0 errors, 0 warnings
✅ Bundle: <500KB gzipped
✅ Performance: Lighthouse ≥90
✅ Security: 0 critical issues
✅ Accessibility: WCAG 2.1 AA
✅ Documentation: Complete
✅ Commits: 24 clean commits
```

---

## 🆘 If Something Goes Wrong

### Ralph Stuck on a Story
```bash
# Check console output for error
# Look at latest commit: git log -1 --stat
# If recurring issue:
git revert HEAD
rm -f .claude/ralph-loop.local.md
./scripts/ralph/ralph.sh 30  # Retry
```

### Build Failures
```bash
# Check if dependencies issue
pnpm install --force
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Then retry Ralph
./scripts/ralph/ralph.sh 30
```

### Test Failures
```bash
# Check if mock data issue
grep -r "describe.*test" src/**/*.test.ts

# Look at test output in console
# Ralph should fix and retry automatically
```

### For Help
See: `RALPH_ONE_SHOT_GUIDE.md` → "🚨 Common Issues & Fixes"

---

## 📋 Post-Ralph (After Completion)

Once Ralph outputs `<promise>CHECK_IN_APP_PRODUCTION_READY</promise>`:

1. **Verify Build**
   ```bash
   pnpm test:coverage
   npm run lighthouse
   npm run test:e2e
   ```

2. **Review Commits**
   ```bash
   git log --oneline | head -30
   git diff main..HEAD --stat
   ```

3. **Check Files**
   ```bash
   ls -la src/store/slices/
   ls -la src/services/
   ls -la docs/
   ```

4. **Merge to Main**
   ```bash
   git checkout main
   git merge ralph/check-in-production
   git push origin main
   ```

5. **Next Phase**: Real device testing (week 2)

---

## ✅ Pre-Launch Verification

Before running `./scripts/ralph/ralph.sh 30`:

```bash
# 1. Verify all checklist items ✅
# 2. Run pre-Ralph verification:
cd "/Users/seannguyen/Winsurf built/Mango POS Offline V2/apps/check-in"
pnpm lint && pnpm build

# 3. If both pass, you're ready!
./scripts/ralph/ralph.sh 30

# 4. Monitor output - should see commits every ~20 minutes
# 5. Check back in ~5 days for completion
```

---

## 🎉 Final Status

- [ ] All checks above completed
- [ ] Ready to launch Ralph
- [ ] Prepared for 5-day autonomous build
- [ ] Post-Ralph plan in place (device testing, beta, launch)

**Status**: ✅ READY TO LAUNCH

---

**Time to build something beautiful.** 🚀

```bash
./scripts/ralph/ralph.sh 30
```

Good luck!
