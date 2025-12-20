# Production Readiness - Essential Tasks Implementation Plan

## Overview
Complete the critical Phase 1 tasks from `PRODUCTION_READINESS_IMPLEMENTATION_PLAN.md` to prepare the codebase for production deployment.

## Current State (Verified Dec 20, 2025)

| Metric | Baseline | Current | Status |
|--------|----------|---------|--------|
| Supabase credentials | Hardcoded | Hardcoded | ❌ Blocking |
| Security vulnerabilities | 1 moderate | 4 moderate | ❌ Blocking |
| Duplicate modules | 3 | 3 | ❌ Cleanup needed |
| Deprecated .v2 files | 2 | 2 | ❌ Cleanup needed |
| `any` types | 620+ | 209 | ✅ 66% improved |
| console.log statements | 907 | 495 | ✅ 45% improved |
| Test files | 23 | 29 | ⚠️ Slight improvement |
| Deep imports | 60+ | 87 in 54 files | ⚠️ No change |

---

## Implementation Tasks

### Task 1: Move Supabase Credentials to Environment Variables
**Priority:** 🔴 CRITICAL - Blocks Production
**Estimated Time:** 30 minutes

**Files to modify:**
- `src/services/supabase/client.ts`
- `.env.example`
- `.env` (local only, gitignored)

**Steps:**
- [ ] 1.1 Update `.env.example` to include Supabase vars
- [ ] 1.2 Update `src/services/supabase/client.ts` to use `import.meta.env`
- [ ] 1.3 Update `.env` with actual Supabase credentials
- [ ] 1.4 Verify app starts and connects to Supabase

**Verification:**
```bash
npm run dev
# App should load and connect to Supabase
```

---

### Task 2: Fix Security Vulnerabilities
**Priority:** 🔴 CRITICAL
**Estimated Time:** 15 minutes

**Current issues:** 4 moderate (esbuild via vite)

**Steps:**
- [ ] 2.1 Run `npm audit` to verify current state
- [ ] 2.2 Run `npm update vite @vitejs/plugin-react` to update
- [ ] 2.3 If issues persist, run `npm audit fix --force` (may require testing)
- [ ] 2.4 Verify build still works with `npm run build`

---

### Task 3: Archive Duplicate/Experimental Modules
**Priority:** 🟡 HIGH - Reduces confusion
**Estimated Time:** 15 minutes

**Modules to archive (verified NOT imported in src/):**
- `temp-checkout-module/` - Replit experimental checkout
- `temp-schedule-module/` - Replit experimental schedule
- `PosCheckoutModule/` - Duplicate checkout module

**Steps:**
- [ ] 3.1 Create `archive/` directory
- [ ] 3.2 Move experimental modules to archive
- [ ] 3.3 Add `archive/` to `.gitignore`
- [ ] 3.4 Verify app still builds

---

### Task 4: Remove Deprecated Component Versions
**Priority:** 🟡 HIGH
**Estimated Time:** 30 minutes

**Files to handle:**
- `src/components/Book/DaySchedule.v2.tsx` → keep, remove old version
- `src/components/Book/NewAppointmentModal.v2.tsx` → keep, remove old version

**Steps:**
- [ ] 4.1 Check if non-.v2 versions exist and are used
- [ ] 4.2 If .v2 is the active version, rename to remove .v2 suffix
- [ ] 4.3 Update any imports referencing .v2 files
- [ ] 4.4 Remove old deprecated files if they exist
- [ ] 4.5 Update `src/components/Book/index.ts` exports
- [ ] 4.6 Verify build succeeds

---

## What NOT to Change
- Existing state management (Redux)
- API calls and data fetching
- Business logic
- Offline functionality
- Test files

---

## Verification Checklist
After completing all tasks:
- [ ] App starts without errors (`npm run dev`)
- [ ] App connects to Supabase (check network tab)
- [ ] Build succeeds (`npm run build`)
- [ ] No security vulnerabilities (`npm audit`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)

---

## Review Section
(Will be filled after implementation)

### Changes Made:
- TBD

### Testing Results:
- TBD

### Issues Encountered:
- TBD
