# Implementation Checklist

Step-by-step guide to implement the new development workflow.

**Estimated Time:** 1-2 days
**Prerequisites:** Admin access to GitHub, Vercel, and Supabase

---

## Phase 1: Git & Branch Setup

### 1.1 Create Staging Branch

```bash
# From your local machine
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

**Verify:** Branch `staging` exists on GitHub ✓

---

### 1.2 Configure Branch Protection Rules

**Go to:** GitHub → Settings → Branches → Add rule

#### For `main` branch:

| Setting | Value |
|---------|-------|
| Branch name pattern | `main` |
| Require pull request before merging | ✅ |
| Required approvals | 1 |
| Dismiss stale reviews | ✅ |
| Require status checks to pass | ✅ |
| Status checks required | `lint`, `type-check`, `test`, `build`, `ci-success` |
| Require branches to be up to date | ✅ |
| Do not allow bypassing | ✅ |

#### For `staging` branch:

| Setting | Value |
|---------|-------|
| Branch name pattern | `staging` |
| Require pull request before merging | ✅ |
| Required approvals | 0 |
| Require status checks to pass | ✅ |
| Status checks required | `lint`, `type-check`, `test`, `build`, `ci-success` |

**Verify:** Try pushing directly to main (should fail) ✓

---

## Phase 2: Supabase Setup

### 2.1 Create Production Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Settings:
   - Name: `mango-production`
   - Database Password: (generate strong password)
   - Region: Same as staging (e.g., `us-west-1`)
   - Plan: Pro (for production)

4. Note down:
   - Project Reference: `______________`
   - URL: `https://______________.supabase.co`
   - Anon Key: `______________`
   - Service Role Key: `______________`

---

### 2.2 Copy Schema to Production

```bash
# Link to staging first
supabase link --project-ref <STAGING_REF>

# Generate migration from current schema
supabase db dump -f supabase/schema.sql

# Link to production
supabase link --project-ref <PRODUCTION_REF>

# Apply schema
supabase db push
```

**Verify:** Tables exist in production project ✓

---

### 2.3 Copy RLS Policies

Option A: Manual (via Dashboard)
1. Go to staging → Authentication → Policies
2. Copy each policy to production

Option B: Via SQL
```bash
# Export policies from staging
supabase db dump --data-only -f policies.sql --schema auth

# Apply to production (after linking)
supabase db push
```

**Verify:** RLS enabled and policies active in production ✓

---

### 2.4 Set Up Access Token

1. Go to [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
2. Generate new token
3. Save as `SUPABASE_ACCESS_TOKEN`

---

## Phase 3: Vercel Setup

### 3.1 Configure Environment Variables

**Go to:** Vercel → Project → Settings → Environment Variables

#### Preview Environment (staging + PRs):

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://<staging-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `<staging-anon-key>` |
| `VITE_ENV` | `staging` |

#### Production Environment:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://<production-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `<production-anon-key>` |
| `VITE_ENV` | `production` |

**Verify:** Environment variables show in Vercel dashboard ✓

---

### 3.2 Set Up Staging Domain Alias

```bash
# Option A: Via CLI
vercel alias set <project-name>-git-staging.vercel.app staging.mango.com

# Option B: Via Dashboard
# Go to Settings → Domains → Add staging.mango.com
# Point to staging branch
```

**Verify:** `https://staging.mango.com` loads staging branch ✓

---

### 3.3 Configure Git Integration

Ensure these branches auto-deploy:
- `main` → Production
- `staging` → Preview (with alias)

**Go to:** Vercel → Settings → Git

**Verify:** Push to staging creates deployment ✓

---

## Phase 4: GitHub Secrets

### 4.1 Add Repository Secrets

**Go to:** GitHub → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SUPABASE_STAGING_REF` | `abcd1234` | Staging project ref |
| `SUPABASE_PROD_REF` | `efgh5678` | Production project ref |
| `SUPABASE_ACCESS_TOKEN` | `sbp_xxx...` | Supabase access token |
| `VERCEL_TOKEN` | `xxx...` | Vercel deploy token |
| `VERCEL_ORG_ID` | `xxx...` | Vercel org ID |
| `VERCEL_PROJECT_ID` | `xxx...` | Vercel project ID |
| `SLACK_WEBHOOK` | `https://hooks...` | (Optional) Slack notifications |

### 4.2 Add Repository Variables

| Variable Name | Value |
|---------------|-------|
| `ENABLE_SLACK_NOTIFICATIONS` | `true` or `false` |

**Verify:** Secrets visible in GitHub Actions settings ✓

---

## Phase 5: CI/CD Workflows

### 5.1 Update CI Workflow

```bash
# Review the proposed changes
cat docs/devops/workflows/ci.yml.proposed

# If approved, copy to workflows
cp docs/devops/workflows/ci.yml.proposed .github/workflows/ci.yml

# Commit
git add .github/workflows/ci.yml
git commit -m "ci: update CI workflow - remove continue-on-error"
```

---

### 5.2 Add Deploy Staging Workflow

```bash
cp docs/devops/workflows/deploy-staging.yml.proposed .github/workflows/deploy-staging.yml

git add .github/workflows/deploy-staging.yml
git commit -m "ci: add staging deploy workflow"
```

---

### 5.3 Add Deploy Production Workflow

```bash
cp docs/devops/workflows/deploy-production.yml.proposed .github/workflows/deploy-production.yml

git add .github/workflows/deploy-production.yml
git commit -m "ci: add production deploy workflow"
```

---

### 5.4 Push Changes

```bash
git push origin staging
```

**Verify:** Workflows appear in GitHub Actions tab ✓

---

## Phase 6: Documentation

### 6.1 Add Contributing Guide

```bash
cp docs/devops/CONTRIBUTING.md.proposed CONTRIBUTING.md

git add CONTRIBUTING.md
git commit -m "docs: add contributing guide"
```

---

### 6.2 Update README

Add to README.md:

```markdown
## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow.

### Quick Start

\`\`\`bash
git checkout staging && git pull
git checkout -b feature/your-feature
pnpm dev
\`\`\`

### Environments

| Environment | URL | Branch |
|-------------|-----|--------|
| Production | https://mango.com | `main` |
| Staging | https://staging.mango.com | `staging` |
```

---

## Phase 7: Validation

### 7.1 Test Feature Flow

```bash
# 1. Create test branch
git checkout staging
git pull origin staging
git checkout -b feature/test-workflow

# 2. Make small change
echo "// test" >> test-file.ts
git add test-file.ts
git commit -m "test: validate workflow"

# 3. Create PR to staging
gh pr create --base staging --title "test: workflow validation"

# 4. Verify:
#    - CI runs and passes
#    - Vercel preview deploys
#    - Can merge PR

# 5. After merge, verify staging deploys

# 6. Create PR from staging to main
gh pr create --base main --head staging --title "test: release validation"

# 7. Verify:
#    - Requires approval
#    - After merge, production deploys

# 8. Clean up
git checkout staging
git branch -d feature/test-workflow
```

---

### 7.2 Test Hotfix Flow

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/test-hotfix

# 2. Make change
echo "// hotfix test" >> hotfix-test.ts
git add hotfix-test.ts
git commit -m "fix: test hotfix flow"

# 3. Create PR to main
gh pr create --base main --title "hotfix: test flow"

# 4. Verify:
#    - CI runs
#    - Can merge after approval

# 5. Backport to staging
git checkout staging
git merge main
git push origin staging

# 6. Clean up
rm hotfix-test.ts
git add -A && git commit -m "chore: remove test files"
```

---

### 7.3 Verify Environments

| Check | Expected | Actual |
|-------|----------|--------|
| staging.mango.com loads | ✅ | [ ] |
| staging uses staging DB | ✅ | [ ] |
| mango.com loads | ✅ | [ ] |
| Production uses prod DB | ✅ | [ ] |
| PR preview deploys | ✅ | [ ] |
| Preview uses staging DB | ✅ | [ ] |

---

## Completion Checklist

### Git
- [ ] `staging` branch created
- [ ] Branch protection on `main` configured
- [ ] Branch protection on `staging` configured
- [ ] Team can create PRs

### Supabase
- [ ] Production project created
- [ ] Schema copied to production
- [ ] RLS policies active
- [ ] Access token generated

### Vercel
- [ ] Environment variables set (Preview)
- [ ] Environment variables set (Production)
- [ ] Staging domain alias working
- [ ] Auto-deploy for both branches

### CI/CD
- [ ] CI workflow updated
- [ ] Deploy staging workflow added
- [ ] Deploy production workflow added
- [ ] All secrets configured

### Documentation
- [ ] CONTRIBUTING.md added
- [ ] README updated
- [ ] Team notified of new workflow

### Validation
- [ ] Feature flow tested
- [ ] Hotfix flow tested
- [ ] All environments verified

---

## Rollback Plan

If something goes wrong:

### Revert CI Changes
```bash
git revert <commit-sha>
git push origin staging
```

### Disable Branch Protection (Emergency)
1. GitHub → Settings → Branches
2. Edit rule → Uncheck protections
3. Fix issue
4. Re-enable protections

### Restore Old Workflow
```bash
git checkout main -- .github/workflows/
git commit -m "revert: restore old workflows"
```

---

## Support

Questions? Issues?
- Slack: #mango-dev
- Create GitHub issue

---

*Implementation plan generated using skills.sh DevOps toolkit*
