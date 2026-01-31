# Mango Biz: Development Workflow & Environment Strategy

> A simple, effective structure for going from development to production with confidence.

**Version:** 1.0
**Created:** January 2026
**Status:** Implementation Plan

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Proposed Structure](#proposed-structure)
4. [Git Branching Strategy](#git-branching-strategy)
5. [Environment Architecture](#environment-architecture)
6. [Vercel Configuration](#vercel-configuration)
7. [Supabase Configuration](#supabase-configuration)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Implementation Steps](#implementation-steps)
10. [Rollback & Recovery](#rollback--recovery)
11. [Team Guidelines](#team-guidelines)

---

## Executive Summary

### Goal

Establish a **simple, reliable** workflow for Mango Biz that enables:
- Fast feature development with confidence
- Safe testing before production
- Quick hotfix deployment when needed
- Clear separation between staging and production

### Philosophy

> "The best system is the simplest one that works."

We deliberately avoid complexity:
- **2 branches** instead of 5 (no GitFlow)
- **2 Supabase projects** instead of 3 (no separate dev DB)
- **Automatic deployments** instead of manual processes

### Key Benefits

| Benefit | How We Achieve It |
|---------|-------------------|
| **Ship faster** | PRs auto-deploy to preview, one-click to production |
| **Break less** | Staging environment catches issues before users see them |
| **Fix quickly** | Hotfix path goes direct to production in < 30 minutes |
| **Stay simple** | Only 2 branches and 2 environments to manage |

---

## Current State Analysis

### What Exists Today

| Component | Current State | Issues |
|-----------|--------------|--------|
| Git branches | `main` + feature branches | No staging, features go direct to prod |
| Vercel | Production only | No staging environment for QA |
| Supabase | Single project | Production data at risk during development |
| CI/CD | Basic checks | No deployment gates |

### Risks of Current Setup

1. **No staging buffer** - Bugs discovered after production deploy
2. **Shared database** - Development can corrupt production data
3. **No QA environment** - Testing happens on production
4. **Rollback difficulty** - No clear previous-good-state to return to

---

## Proposed Structure

### The Complete Picture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  DEVELOPER LAPTOP          STAGING                      PRODUCTION          │
│  ─────────────────         ───────                      ──────────          │
│                                                                             │
│  ┌─────────────┐          ┌─────────────┐              ┌─────────────┐     │
│  │ feature/*   │───PR────▶│  staging    │─────PR──────▶│    main     │     │
│  │ fix/*       │          │  branch     │              │   branch    │     │
│  └─────────────┘          └─────────────┘              └─────────────┘     │
│         │                        │                            │             │
│         │                        │                            │             │
│         ▼                        ▼                            ▼             │
│  ┌─────────────┐          ┌─────────────┐              ┌─────────────┐     │
│  │   Vercel    │          │   Vercel    │              │   Vercel    │     │
│  │  Preview    │          │  Staging    │              │ Production  │     │
│  │ (per PR)    │          │  (pinned)   │              │             │     │
│  └─────────────┘          └─────────────┘              └─────────────┘     │
│         │                        │                            │             │
│         │                        │                            │             │
│         ▼                        ▼                            ▼             │
│  ┌─────────────┐          ┌─────────────┐              ┌─────────────┐     │
│  │  Supabase   │          │  Supabase   │              │  Supabase   │     │
│  │  STAGING    │◀─────────│  STAGING    │              │ PRODUCTION  │     │
│  │  (shared)   │          │  (shared)   │              │  (isolated) │     │
│  └─────────────┘          └─────────────┘              └─────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why This Structure?

| Decision | Reasoning |
|----------|-----------|
| **2 branches only** | Fewer branches = less confusion, faster merges |
| **staging branch** | Buffer zone between development and users |
| **2 Supabase projects** | Protect production data, allow risky testing on staging |
| **Local dev → Staging DB** | Simpler than 3 environments, real data for testing |
| **Auto-deploy on merge** | No manual deploy steps = fewer mistakes |

---

## Git Branching Strategy

### Branch Structure

```
main (protected)
│
├── staging (protected)
│   │
│   ├── feature/US-001-booking-flow
│   ├── feature/US-002-payment-update
│   ├── fix/checkout-timezone
│   └── chore/update-dependencies
│
└── hotfix/critical-payment-fix (rare, emergency only)
```

### Branch Purposes

| Branch | Purpose | Merges To | Protection |
|--------|---------|-----------|------------|
| `main` | Production-ready code | - | Strict |
| `staging` | Integration & QA testing | `main` | Moderate |
| `feature/*` | New features | `staging` | None |
| `fix/*` | Bug fixes | `staging` | None |
| `hotfix/*` | Emergency production fixes | `main` | None |

### Branch Naming Convention

```
feature/US-001-short-description    # New features (with story ID)
fix/US-002-bug-description          # Bug fixes
chore/update-dependencies           # Maintenance
hotfix/critical-issue               # Emergency only
```

**Examples:**
- `feature/US-045-staff-scheduling`
- `fix/US-102-checkout-total-calculation`
- `chore/upgrade-react-19`
- `hotfix/payment-gateway-timeout`

### Workflow: Feature Development

```bash
# 1. Start from staging (always!)
git checkout staging
git pull origin staging

# 2. Create feature branch
git checkout -b feature/US-045-staff-scheduling

# 3. Work and commit (use conventional commits)
git add .
git commit -m "feat(staff): add weekly schedule view"
git commit -m "feat(staff): add shift swap functionality"

# 4. Push and create PR to staging
git push -u origin feature/US-045-staff-scheduling
gh pr create --base staging --title "feat: [US-045] Staff scheduling"

# 5. After CI passes and review → Squash merge to staging

# 6. Test on staging environment

# 7. When ready for production → Create PR from staging to main
gh pr create --base main --head staging --title "Release: Staff scheduling"

# 8. After approval → Merge to main = Production deploy
```

### Workflow: Hotfix (Emergency Only)

```bash
# 1. Branch from main (not staging!)
git checkout main
git pull origin main
git checkout -b hotfix/payment-timeout

# 2. Make minimal fix
git commit -m "fix: increase payment gateway timeout to 30s"

# 3. PR direct to main
gh pr create --base main --title "hotfix: payment timeout"

# 4. Fast-track review (1 approval) → Merge

# 5. Backport to staging (important!)
git checkout staging
git pull origin staging
git merge main
git push origin staging
```

### When to Use Each Path

| Situation | Branch From | PR To | Timeline |
|-----------|-------------|-------|----------|
| New feature | `staging` | `staging` | Days-weeks |
| Bug fix | `staging` | `staging` | Hours-days |
| Production is broken | `main` | `main` | Minutes-hours |
| Dependency update | `staging` | `staging` | Hours |

---

## Environment Architecture

### Environment Matrix

| Environment | Purpose | URL | Database | Who Uses It |
|-------------|---------|-----|----------|-------------|
| **Local** | Development | `localhost:5173` | Staging | Developers |
| **Preview** | PR testing | `pr-123.vercel.app` | Staging | Reviewers |
| **Staging** | QA & integration | `staging.mango.app` | Staging | QA, Stakeholders |
| **Production** | Live users | `mango.app` | Production | Everyone |

### Why Only 2 Databases?

**Option A: 3 Databases (Dev/Staging/Prod)**
- Pro: Complete isolation
- Con: Migration complexity, sync issues, more cost
- Con: Dev data often stale or unrealistic

**Option B: 2 Databases (Staging/Prod)** ← Our Choice
- Pro: Simpler, cheaper
- Pro: Dev uses realistic staging data
- Pro: One migration path to test before prod
- Con: Developers share staging (manageable with good practices)

### Data Strategy

| Database | Contains | Refreshed From |
|----------|----------|----------------|
| **Staging** | Sanitized copy of production | Weekly automated job |
| **Production** | Real user data | N/A (source of truth) |

**Staging Data Refresh Process:**
1. Weekly: Export production (anonymized)
2. Import to staging (overwrite)
3. Notify team: "Staging refreshed"

---

## Vercel Configuration

### Project Structure

Since Mango Biz is a monorepo, we need multiple Vercel projects:

| App | Vercel Project | Production Domain |
|-----|----------------|-------------------|
| Store App | `mango-store` | `app.mango.com` |
| Online Store | `mango-online` | `book.mango.com` |
| Control Center | `mango-admin` | `admin.mango.com` |

### Environment Variables Per Project

```bash
# Store App - vercel.json or Vercel Dashboard
{
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

**Variable Values by Environment:**

| Variable | Preview (Staging) | Production |
|----------|-------------------|------------|
| `VITE_SUPABASE_URL` | `https://staging-xxx.supabase.co` | `https://prod-yyy.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `staging-anon-key` | `prod-anon-key` |
| `VITE_ENV` | `staging` | `production` |
| `VITE_SENTRY_DSN` | (optional) | `https://xxx@sentry.io/yyy` |

### Vercel Git Integration

```json
// vercel.json (root)
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "staging": true
    }
  },
  "github": {
    "autoAlias": true,
    "silent": false
  }
}
```

### Domain Configuration

| Branch | Domain | Type |
|--------|--------|------|
| `main` | `app.mango.com` | Production |
| `staging` | `staging.mango.com` | Preview (aliased) |
| PR branches | `mango-store-xxx.vercel.app` | Preview (auto) |

**Setting up staging alias:**
```bash
vercel alias mango-store-git-staging.vercel.app staging.mango.com
```

---

## Supabase Configuration

### Project Setup

| Project Name | Project Ref | Region | Purpose |
|--------------|-------------|--------|---------|
| `mango-staging` | `abcd1234` | us-west-1 | Dev, Preview, Staging |
| `mango-production` | `efgh5678` | us-west-1 | Production only |

### Database Schema Management

We use **Supabase Migrations** for schema changes:

```
supabase/
├── config.toml           # Project configuration
├── migrations/           # Schema migrations
│   ├── 20240101000000_initial_schema.sql
│   ├── 20240115000000_add_staff_schedule.sql
│   └── 20240120000000_add_booking_notes.sql
├── seed.sql              # Seed data for staging
└── functions/            # Edge functions
```

### Migration Workflow

```bash
# 1. Create new migration
supabase migration new add_booking_notes

# 2. Write SQL in supabase/migrations/xxx_add_booking_notes.sql
ALTER TABLE bookings ADD COLUMN notes TEXT;

# 3. Test locally (applies to staging)
supabase db push --linked

# 4. Commit and push (part of feature PR)
git add supabase/migrations/
git commit -m "feat(db): add booking notes column"

# 5. When PR merges to staging:
#    CI runs: supabase db push --project-ref abcd1234

# 6. When staging merges to main:
#    CI runs: supabase db push --project-ref efgh5678
```

### Row Level Security (RLS)

All tables must have RLS enabled. Example policies:

```sql
-- Clients can only see their own data
CREATE POLICY "Clients view own data" ON clients
  FOR SELECT USING (auth.uid() = user_id);

-- Staff can view clients in their store
CREATE POLICY "Staff view store clients" ON clients
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM staff_assignments
      WHERE user_id = auth.uid()
    )
  );
```

### Environment Variables for Supabase

**.env.local (Developer laptop):**
```bash
VITE_SUPABASE_URL=https://abcd1234.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...staging-key
```

**Vercel Preview Environment:**
```bash
VITE_SUPABASE_URL=https://abcd1234.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...staging-key
```

**Vercel Production Environment:**
```bash
VITE_SUPABASE_URL=https://efgh5678.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...production-key
```

---

## CI/CD Pipeline

### Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PR Created (feature/* → staging)                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │  Lint   │  │  Type   │  │  Test   │  │  Build  │  │ Preview │      │
│  │         │─▶│  Check  │─▶│         │─▶│         │─▶│ Deploy  │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│       │            │            │            │            │             │
│       ▼            ▼            ▼            ▼            ▼             │
│    ❌/✅         ❌/✅        ❌/✅        ❌/✅      URL comment        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  All pass + Approved → Merge allowed                                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PR Merged to staging                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │   Build     │─▶│  DB Migrate │─▶│   Deploy    │                     │
│  │             │  │  (staging)  │  │  (staging)  │                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PR Merged to main (staging → main)                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Build     │─▶│  DB Migrate │─▶│   Deploy    │─▶│   Notify    │   │
│  │             │  │   (prod)    │  │   (prod)    │  │   (Slack)   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### GitHub Actions Workflows

**1. PR Checks (`.github/workflows/ci.yml`):**
- Lint (ESLint)
- Type check (TypeScript)
- Unit tests (Vitest)
- Build verification

**2. Deploy Staging (`.github/workflows/deploy-staging.yml`):**
- Triggered on push to `staging`
- Run migrations on staging Supabase
- Vercel auto-deploys

**3. Deploy Production (`.github/workflows/deploy-production.yml`):**
- Triggered on push to `main`
- Run migrations on production Supabase
- Vercel auto-deploys
- Create GitHub release
- Notify Slack

### Required CI Checks

| Check | Required for staging PR | Required for main PR |
|-------|------------------------|----------------------|
| Lint | ✅ | ✅ |
| TypeCheck | ✅ | ✅ |
| Tests | ✅ | ✅ |
| Build | ✅ | ✅ |
| Approval | ❌ | ✅ (1 person) |

---

## Implementation Steps

### Phase 1: Git & Branch Setup (Day 1)

- [ ] **1.1 Create staging branch**
  ```bash
  git checkout main
  git checkout -b staging
  git push -u origin staging
  ```

- [ ] **1.2 Set branch protection rules**

  **For `main`:**
  - Require pull request before merging
  - Require approvals: 1
  - Require status checks: `lint`, `typecheck`, `test`, `build`
  - Require branches to be up to date
  - Do not allow bypassing settings

  **For `staging`:**
  - Require pull request before merging
  - Require status checks: `lint`, `typecheck`, `test`, `build`
  - No approval required

- [ ] **1.3 Update default branch**
  - Keep `main` as default (for production releases)

### Phase 2: Supabase Setup (Day 2)

- [ ] **2.1 Create production Supabase project**
  - Name: `mango-production`
  - Region: Same as staging
  - Copy schema from staging

- [ ] **2.2 Configure project linking**
  ```bash
  # Link to staging (default for development)
  supabase link --project-ref abcd1234
  ```

- [ ] **2.3 Set up migration workflow**
  - Ensure all migrations are in `supabase/migrations/`
  - Test migration with `supabase db push --dry-run`

- [ ] **2.4 Copy RLS policies to production**
  - Export from staging
  - Apply to production

### Phase 3: Vercel Setup (Day 3)

- [ ] **3.1 Configure environment variables**

  **In Vercel Dashboard → Settings → Environment Variables:**

  | Name | Preview Value | Production Value |
  |------|---------------|------------------|
  | `VITE_SUPABASE_URL` | staging URL | production URL |
  | `VITE_SUPABASE_ANON_KEY` | staging key | production key |
  | `VITE_ENV` | `staging` | `production` |

- [ ] **3.2 Set up staging domain alias**
  ```bash
  vercel alias set mango-store-git-staging.vercel.app staging.mango.com
  ```

- [ ] **3.3 Configure Git integration**
  - Ensure `main` and `staging` branches deploy
  - Verify preview deploys for PRs

### Phase 4: CI/CD Updates (Day 4)

- [ ] **4.1 Update CI workflow**
  - Remove `continue-on-error: true` from critical jobs
  - Add required status checks

- [ ] **4.2 Create staging deploy workflow**
  - Trigger on push to `staging`
  - Run Supabase migrations to staging

- [ ] **4.3 Create production deploy workflow**
  - Trigger on push to `main`
  - Run Supabase migrations to production
  - Create GitHub release
  - Send Slack notification

- [ ] **4.4 Add migration step to CI**
  ```yaml
  - name: Run migrations (staging)
    if: github.ref == 'refs/heads/staging'
    run: supabase db push --project-ref ${{ secrets.SUPABASE_STAGING_REF }}
  ```

### Phase 5: Documentation & Training (Day 5)

- [ ] **5.1 Create CONTRIBUTING.md**
  - Branch naming conventions
  - PR process
  - Commit message format

- [ ] **5.2 Update README.md**
  - Environment setup instructions
  - Development workflow

- [ ] **5.3 Team training**
  - Walk through new workflow
  - Practice feature → staging → main flow

### Phase 6: Validation (Day 6)

- [ ] **6.1 Test feature flow**
  - Create test feature branch
  - PR to staging
  - Verify staging deployment
  - PR to main
  - Verify production deployment

- [ ] **6.2 Test hotfix flow**
  - Create hotfix branch from main
  - PR direct to main
  - Verify fast deployment

- [ ] **6.3 Test rollback**
  - Revert a commit on main
  - Verify production rolls back

---

## Rollback & Recovery

### Rollback Strategies

| Scenario | Action | Time to Recovery |
|----------|--------|------------------|
| Bad code in production | Revert commit, auto-deploy | ~5 minutes |
| Bad migration in production | Apply reverse migration | ~10 minutes |
| Complete disaster | Restore from Vercel/Supabase backup | ~30 minutes |

### Code Rollback

```bash
# 1. Identify the bad commit
git log --oneline main

# 2. Revert it
git checkout main
git pull
git revert <bad-commit-sha>
git push origin main

# 3. Vercel auto-deploys the revert
```

### Database Rollback

```bash
# 1. Create a reverse migration
supabase migration new revert_bad_change

# 2. Write the reverse SQL
# In xxx_revert_bad_change.sql:
ALTER TABLE bookings DROP COLUMN bad_column;

# 3. Apply to production
supabase db push --project-ref efgh5678
```

### Full Environment Restore

**Vercel:**
- Go to Deployments
- Find last good deployment
- Click "Promote to Production"

**Supabase:**
- Database backups are automatic (daily)
- Go to Database → Backups
- Restore to point-in-time

---

## Team Guidelines

### Daily Development

1. **Always start from staging**
   ```bash
   git checkout staging && git pull
   ```

2. **Use conventional commits**
   ```bash
   git commit -m "feat(booking): add recurring appointments"
   git commit -m "fix(checkout): correct tax calculation"
   ```

3. **Keep PRs small**
   - Aim for < 400 lines changed
   - One feature per PR
   - Easier to review, easier to revert

4. **Test before PR**
   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```

### PR Checklist

Before creating PR:
- [ ] Code compiles (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] No lint errors (`pnpm lint`)
- [ ] Meaningful commit messages
- [ ] PR description explains the change

### Release Process

**Weekly Release (Recommended):**
1. Monday-Thursday: Features merge to staging
2. Thursday: Final QA on staging
3. Friday morning: PR from staging → main
4. Friday: Monitor production

**Ad-hoc Release:**
- For urgent features, can release any time
- Always test on staging first

### Emergency Hotfix

**When to use hotfix:**
- Production is broken for users
- Security vulnerability discovered
- Data corruption occurring

**Hotfix rules:**
- Branch from `main`, not `staging`
- Minimal change only
- Fast-track review (Slack the team)
- Backport to staging after

---

## Success Metrics

After implementation, measure:

| Metric | Current | Target |
|--------|---------|--------|
| Deploy frequency | ~1/week | Multiple/week |
| Lead time (code to prod) | Days | Hours |
| Change failure rate | Unknown | < 15% |
| Time to recover | Unknown | < 1 hour |
| Staging bugs caught | N/A | > 80% |

---

## Appendix

### A. File Changes Required

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | Remove `continue-on-error`, add required checks |
| `.github/workflows/deploy-staging.yml` | New file |
| `.github/workflows/deploy-production.yml` | New file |
| `vercel.json` | Add git deployment config |
| `.env.example` | Update with environment notes |
| `CONTRIBUTING.md` | New file with workflow docs |
| `supabase/config.toml` | Verify project linking |

### B. Secrets Required

| Secret | Where | Purpose |
|--------|-------|---------|
| `SUPABASE_STAGING_REF` | GitHub | Staging project reference |
| `SUPABASE_PROD_REF` | GitHub | Production project reference |
| `SUPABASE_ACCESS_TOKEN` | GitHub | For running migrations |
| `VERCEL_TOKEN` | GitHub | For deployments |
| `VERCEL_ORG_ID` | GitHub | Vercel organization |
| `VERCEL_PROJECT_ID` | GitHub | Vercel project |
| `SLACK_WEBHOOK` | GitHub | Deploy notifications |

### C. Commands Reference

```bash
# Start new feature
git checkout staging && git pull && git checkout -b feature/xyz

# Create PR to staging
gh pr create --base staging

# Create release PR
gh pr create --base main --head staging --title "Release: v1.x.x"

# Emergency hotfix
git checkout main && git pull && git checkout -b hotfix/xyz
gh pr create --base main

# Run migrations on staging
supabase db push --project-ref $STAGING_REF

# Run migrations on production
supabase db push --project-ref $PROD_REF
```

---

*Document created using senior-devops, git-workflow-designer, and cto-advisor skills.*
