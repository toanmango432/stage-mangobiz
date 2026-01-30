# Mango Biz: Development Workflow

> Simple, effective structure for going from development to production.

---

## Table of Contents

1. [Overview](#overview)
2. [The Structure](#the-structure)
3. [Git Branching](#git-branching)
4. [Environments](#environments)
5. [Daily Workflow](#daily-workflow)
6. [Implementation Guide](#implementation-guide)
7. [CI/CD Workflows](#cicd-workflows)
8. [Reference](#reference)

---

## Overview

### Goal

A **simple, reliable** workflow that enables:
- Fast feature development
- Safe testing before production
- Quick hotfix when needed

### Philosophy

> "The simplest system that works."

- **2 branches** (not 5)
- **2 databases** (not 3)
- **Auto-deploy** (not manual)

### The Complete Picture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  DEVELOPER                    STAGING                      PRODUCTION       │
│                                                                             │
│  feature/* ────PR────►  staging  ─────PR─────►  main                       │
│       │                    │                      │                         │
│       ▼                    ▼                      ▼                         │
│  Vercel Preview      Vercel Staging         Vercel Prod                    │
│       │                    │                      │                         │
│       ▼                    ▼                      ▼                         │
│  Supabase Staging    Supabase Staging      Supabase Prod                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Structure

### Why This Design?

| Decision | Reason |
|----------|--------|
| **2 branches only** | Less confusion, faster merges |
| **staging branch** | Buffer between dev and users |
| **2 Supabase projects** | Protect production data |
| **Local dev → Staging DB** | Simpler, real data for testing |
| **Auto-deploy** | No manual steps = fewer mistakes |

### Components

| Component | Staging | Production |
|-----------|---------|------------|
| Git branch | `staging` | `main` |
| Vercel | `staging.mango.com` | `mango.com` |
| Supabase | `mango-staging` | `mango-production` |

---

## Git Branching

### Branch Structure

```
main (protected)
│
└── staging (protected)
    ├── feature/US-001-booking
    ├── fix/US-002-checkout
    └── chore/update-deps
```

### Branch Rules

| Branch | Purpose | Merges To | Approval Required |
|--------|---------|-----------|-------------------|
| `main` | Production | - | Yes (1 person) |
| `staging` | QA testing | `main` | No |
| `feature/*` | New features | `staging` | No |
| `fix/*` | Bug fixes | `staging` | No |
| `hotfix/*` | Emergency | `main` | Yes (fast-track) |

### Branch Naming

```
feature/US-123-short-description
fix/US-456-bug-description
chore/update-dependencies
hotfix/critical-issue
```

---

## Environments

### Environment Matrix

| Environment | URL | Database | Used By |
|-------------|-----|----------|---------|
| Local | `localhost:5173` | Staging | Developers |
| Preview | `pr-123.vercel.app` | Staging | PR reviewers |
| Staging | `staging.mango.com` | Staging | QA, stakeholders |
| Production | `mango.com` | Production | Users |

### Environment Variables

**Local (.env.local):**
```bash
VITE_SUPABASE_URL=https://staging-xxx.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key
VITE_ENV=development
```

**Vercel Preview:**
```bash
VITE_SUPABASE_URL=https://staging-xxx.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key
VITE_ENV=staging
```

**Vercel Production:**
```bash
VITE_SUPABASE_URL=https://prod-xxx.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
VITE_ENV=production
```

---

## Daily Workflow

### Feature Development

```bash
# 1. Start from staging
git checkout staging
git pull origin staging
git checkout -b feature/US-123-add-booking

# 2. Work and commit
git add .
git commit -m "feat(booking): add recurring option"

# 3. Push and create PR
git push -u origin feature/US-123-add-booking
gh pr create --base staging

# 4. After CI passes → Squash merge to staging
# 5. Test on staging.mango.com
# 6. When ready → PR from staging to main
gh pr create --base main --head staging
```

### Hotfix (Emergency Only)

```bash
# 1. Branch from main
git checkout main
git pull
git checkout -b hotfix/payment-crash

# 2. Fix and commit
git commit -m "fix: payment timeout"

# 3. PR direct to main (fast-track)
gh pr create --base main

# 4. After merge, backport to staging
git checkout staging
git merge main
git push
```

### Commit Messages

```bash
feat(scope): add new feature
fix(scope): fix bug
docs: update documentation
chore: maintenance task
refactor: restructure code
test: add tests
```

### PR Checklist

Before creating PR:
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes
- [ ] Meaningful commit messages
- [ ] PR description is clear

---

## Implementation Guide

### Phase 1: Git Setup (30 min)

**1.1 Create staging branch:**
```bash
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

**1.2 Configure branch protection (GitHub → Settings → Branches):**

For `main`:
- ✅ Require PR
- ✅ Require 1 approval
- ✅ Require status checks: `lint`, `type-check`, `test`, `build`
- ✅ Require up-to-date branch

For `staging`:
- ✅ Require PR
- ✅ Require status checks
- ❌ No approval required

---

### Phase 2: Supabase Setup (1 hour)

**2.1 Create production project:**
1. Go to supabase.com/dashboard
2. New Project → `mango-production`
3. Note: Project Ref, URL, Anon Key

**2.2 Copy schema:**
```bash
# From staging
supabase link --project-ref <STAGING_REF>
supabase db dump -f schema.sql

# To production
supabase link --project-ref <PROD_REF>
supabase db push
```

**2.3 Generate access token:**
- supabase.com/dashboard/account/tokens
- Save as `SUPABASE_ACCESS_TOKEN`

---

### Phase 3: Vercel Setup (30 min)

**3.1 Set environment variables (Vercel → Settings → Environment Variables):**

| Variable | Preview | Production |
|----------|---------|------------|
| `VITE_SUPABASE_URL` | staging URL | prod URL |
| `VITE_SUPABASE_ANON_KEY` | staging key | prod key |
| `VITE_ENV` | `staging` | `production` |

**3.2 Set up staging domain:**
```bash
vercel alias set <project>-git-staging.vercel.app staging.mango.com
```

---

### Phase 4: GitHub Secrets (15 min)

Add to GitHub → Settings → Secrets → Actions:

| Secret | Value |
|--------|-------|
| `SUPABASE_STAGING_REF` | Staging project ref |
| `SUPABASE_PROD_REF` | Production project ref |
| `SUPABASE_ACCESS_TOKEN` | Access token |

---

### Phase 5: Deploy Workflows (30 min)

Copy the workflow files from [CI/CD Workflows](#cicd-workflows) section below.

---

### Phase 6: Validation (30 min)

**Test feature flow:**
```bash
git checkout staging && git pull
git checkout -b feature/test-workflow
echo "// test" >> test.ts
git add . && git commit -m "test: workflow"
gh pr create --base staging
# Verify CI runs, preview deploys
# Merge, verify staging deploys
# PR staging → main, verify production deploys
```

**Test hotfix flow:**
```bash
git checkout main && git pull
git checkout -b hotfix/test
# Make change, PR to main, verify fast deploy
# Backport to staging
```

---

## CI/CD Workflows

### CI Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile --ignore-scripts
      - run: pnpm lint

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile --ignore-scripts
      - run: pnpm typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile --ignore-scripts
      - run: pnpm test

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

---

### Deploy Staging (`.github/workflows/deploy-staging.yml`)

```yaml
name: Deploy Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.mango.com
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Run migrations
        run: |
          npx supabase link --project-ref ${{ secrets.SUPABASE_STAGING_REF }}
          npx supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deploy complete
        run: echo "✅ Staging deployed - Vercel handles deployment via Git"
```

---

### Deploy Production (`.github/workflows/deploy-production.yml`)

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://mango.com
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - name: Run migrations
        run: |
          npx supabase link --project-ref ${{ secrets.SUPABASE_PROD_REF }}
          npx supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Deploy complete
        run: echo "✅ Production deployed"

  release:
    name: Create Release
    needs: deploy
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate changelog
        id: changelog
        run: |
          PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
          if [ -n "$PREV_TAG" ]; then
            CHANGES=$(git log ${PREV_TAG}..HEAD --pretty=format:"- %s" --no-merges)
          else
            CHANGES=$(git log --pretty=format:"- %s" --no-merges -20)
          fi
          echo "## Changes" > CHANGELOG.md
          echo "$CHANGES" >> CHANGELOG.md

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          body_path: CHANGELOG.md
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Reference

### Quick Commands

```bash
# Start feature
git checkout staging && git pull && git checkout -b feature/xyz

# Commit
git commit -m "feat(module): description"

# PR to staging
gh pr create --base staging

# Release to production
gh pr create --base main --head staging

# Emergency hotfix
git checkout main && git checkout -b hotfix/xyz
gh pr create --base main
```

### Rollback

**Code rollback:**
```bash
git checkout main
git revert <bad-commit>
git push  # Auto-deploys fix
```

**Database rollback:**
```bash
supabase migration new revert_change
# Write reverse SQL
supabase db push --project-ref <PROD_REF>
```

### Checklist Summary

- [ ] Staging branch created
- [ ] Branch protection configured
- [ ] Supabase production project created
- [ ] Schema copied to production
- [ ] Vercel environment variables set
- [ ] Staging domain alias working
- [ ] GitHub secrets added
- [ ] CI workflow updated
- [ ] Deploy workflows added
- [ ] Feature flow tested
- [ ] Hotfix flow tested

---

*Document generated using skills.sh DevOps toolkit (senior-devops, git-workflow-designer, cto-advisor, supabase-postgres-best-practices)*
