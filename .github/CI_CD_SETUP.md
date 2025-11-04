# CI/CD Pipeline Setup Guide

This document explains how to configure the complete CI/CD pipeline for Mango POS.

---

## 📋 Overview

The CI/CD pipeline includes:

1. **CI Pipeline** (`ci.yml`) - Runs on every push/PR
   - Linting & type checking
   - Unit tests with coverage
   - Build verification
   - Security audit
   - Bundle size analysis

2. **Deploy Pipeline** (`deploy.yml`) - Runs on main branch & tags
   - Production build
   - Deploy to Netlify
   - Deploy to Vercel
   - GitHub releases
   - Slack notifications

3. **Preview Pipeline** (`preview.yml`) - Runs on PRs
   - PR preview deployments
   - Lighthouse performance audits
   - Automatic PR comments

4. **Scheduled Pipeline** (`scheduled.yml`) - Runs daily
   - Dependency audits
   - Database health checks
   - Bundle size monitoring
   - Sync system checks

---

## 🔐 Required Secrets

### GitHub Repository Secrets

Go to: `Settings > Secrets and variables > Actions > New repository secret`

#### 1. Environment Variables

```bash
VITE_API_BASE_URL
# Your API base URL
# Example: https://api.mangobiz.com/v1
```

```bash
STAGING_API_URL
# Staging API URL for preview deployments
# Example: https://staging-api.mangobiz.com/v1
```

#### 2. Netlify Deployment

```bash
NETLIFY_AUTH_TOKEN
# How to get:
# 1. Go to https://app.netlify.com/user/applications
# 2. Click "New access token"
# 3. Copy the token
```

```bash
NETLIFY_SITE_ID
# How to get:
# 1. Go to your Netlify site
# 2. Settings > General > Site details
# 3. Copy "Site ID"
```

#### 3. Vercel Deployment (Optional)

```bash
VERCEL_TOKEN
# How to get:
# 1. Go to https://vercel.com/account/tokens
# 2. Create new token
# 3. Copy the token
```

```bash
VERCEL_ORG_ID
# How to get:
# 1. Run: npx vercel link
# 2. Check .vercel/project.json
# 3. Copy "orgId"
```

```bash
VERCEL_PROJECT_ID
# How to get:
# 1. Run: npx vercel link
# 2. Check .vercel/project.json
# 3. Copy "projectId"
```

#### 4. Slack Notifications (Optional)

```bash
SLACK_WEBHOOK
# How to get:
# 1. Go to https://api.slack.com/apps
# 2. Create new app or select existing
# 3. Enable Incoming Webhooks
# 4. Add New Webhook to Workspace
# 5. Copy Webhook URL
```

---

## 🚀 Quick Setup (Netlify Only)

If you only want to use Netlify (simplest option):

### Step 1: Create Netlify Site

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Create new site
netlify init
```

### Step 2: Get Netlify Credentials

```bash
# Get your Auth Token
netlify env:list

# Get your Site ID
netlify status
```

### Step 3: Add GitHub Secrets

1. Go to your GitHub repo
2. Settings > Secrets and variables > Actions
3. Add these secrets:
   - `NETLIFY_AUTH_TOKEN` - Your Netlify personal access token
   - `NETLIFY_SITE_ID` - Your Netlify site ID
   - `VITE_API_BASE_URL` - Your API URL

### Step 4: Push to Main

```bash
git push origin main
```

Your app will automatically deploy! 🎉

---

## 🔧 Advanced Setup (Full Pipeline)

### 1. Enable All Workflows

In your GitHub repo settings:
- Go to `Actions > General`
- Select "Allow all actions and reusable workflows"
- Click "Save"

### 2. Configure Branch Protection

For the `main` branch:
- Settings > Branches > Add rule
- Branch name pattern: `main`
- Check:
  - ✅ Require status checks to pass
  - ✅ Require branches to be up to date
  - ✅ Status checks: lint, test, build

### 3. Set Up Environments

Create deployment environments:
- Settings > Environments > New environment
- Create: `staging`, `production`
- Add environment-specific secrets if needed

### 4. Configure Deploy Keys (if using custom server)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions"

# Add public key to server
cat ~/.ssh/id_ed25519.pub

# Add private key as GitHub secret
# Name: SSH_PRIVATE_KEY
cat ~/.ssh/id_ed25519
```

---

## 📊 Monitoring & Notifications

### Enable Codecov (Code Coverage)

1. Go to https://codecov.io
2. Sign up with GitHub
3. Add your repository
4. No additional secrets needed!

### Enable Slack Notifications

1. Add `SLACK_WEBHOOK` secret
2. Notifications will be sent for:
   - Successful deployments
   - Failed deployments
   - Security alerts

---

## 🧪 Testing the Pipeline

### Test CI Locally

```bash
# Run linting
npm run lint

# Run tests
npm test

# Run build
npm run build
```

### Test Deployment Locally

```bash
# Test Netlify deployment
netlify deploy --build

# Test production deployment
netlify deploy --prod
```

---

## 🎯 Workflow Triggers

### CI Pipeline (`ci.yml`)
- **Triggers:** Every push to `main` or `develop`, all PRs
- **Duration:** ~3-5 minutes
- **Purpose:** Code quality & testing

### Deploy Pipeline (`deploy.yml`)
- **Triggers:** Push to `main`, version tags (`v*`)
- **Duration:** ~5-7 minutes
- **Purpose:** Production deployment

### Preview Pipeline (`preview.yml`)
- **Triggers:** Pull requests (open, sync, reopen)
- **Duration:** ~4-6 minutes
- **Purpose:** PR preview deployments

### Scheduled Pipeline (`scheduled.yml`)
- **Triggers:** Daily at 2 AM UTC
- **Duration:** ~5-10 minutes
- **Purpose:** Health checks & monitoring

---

## 📈 What Happens on Each Push

### On Pull Request:
```
1. ✅ Lint code
2. ✅ Run tests
3. ✅ Build app
4. ✅ Security audit
5. ✅ Deploy preview
6. ✅ Lighthouse audit
7. 💬 Comment with preview URL
```

### On Push to Main:
```
1. ✅ Run full CI pipeline
2. ✅ Build production bundle
3. ✅ Deploy to Netlify
4. ✅ Deploy to Vercel (if configured)
5. 💬 Notify on Slack
```

### On Version Tag (v1.0.0):
```
1. ✅ Run full CI pipeline
2. ✅ Build production bundle
3. ✅ Deploy to production
4. ✅ Create GitHub release
5. ✅ Upload build artifacts
6. 💬 Notify on Slack
```

---

## 🐛 Troubleshooting

### Build Fails on CI but Works Locally

**Issue:** Environment differences

**Solution:**
```bash
# Check Node version matches
node --version  # Should be 18.x

# Ensure clean install
rm -rf node_modules package-lock.json
npm install

# Test with CI commands
npm ci
npm run build
```

### Netlify Deployment Fails

**Issue:** Missing secrets or incorrect site ID

**Solution:**
1. Verify `NETLIFY_AUTH_TOKEN` is valid
2. Check `NETLIFY_SITE_ID` matches your site
3. Run `netlify status` to verify setup

### Type Check Fails

**Issue:** TypeScript errors

**Solution:**
```bash
# Run type check locally
npx tsc --noEmit

# Fix errors before pushing
```

### Tests Fail on CI

**Issue:** Environment or timing issues

**Solution:**
```bash
# Run tests in CI mode locally
npm test -- --run

# Check for timing-dependent tests
# Add proper waits/mocks
```

---

## 🎨 Customization

### Change Deployment Provider

Don't want Netlify? Edit `.github/workflows/deploy.yml`:

**For Vercel only:**
```yaml
# Comment out or remove the deploy-netlify job
# Keep only deploy-vercel job
```

**For custom server:**
```yaml
# Add custom deployment step
- name: Deploy to Server
  uses: easingthemes/ssh-deploy@main
  with:
    SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
    REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
    REMOTE_USER: ${{ secrets.REMOTE_USER }}
    TARGET: /var/www/mango-pos
```

### Disable Scheduled Checks

If you don't want daily checks:

```bash
# Delete or comment out the schedule trigger in scheduled.yml
# on:
#   schedule:
#     - cron: '0 2 * * *'
```

### Add Custom Checks

Add to `.github/workflows/ci.yml`:

```yaml
- name: Custom check
  run: npm run your-custom-command
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] CI pipeline runs on PR
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Preview deploys on PR
- [ ] Main branch deploys to production
- [ ] Slack notifications work (if enabled)
- [ ] GitHub releases create on tags
- [ ] Scheduled jobs run daily

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Netlify Deploy Documentation](https://docs.netlify.com/cli/get-started/)
- [Vercel Deploy Documentation](https://vercel.com/docs/deployments)
- [Codecov Documentation](https://docs.codecov.com/docs)

---

## 🆘 Need Help?

Check the workflow run logs:
1. Go to your repo
2. Click "Actions" tab
3. Select the workflow run
4. Click on the failed job
5. Expand the failed step

Common issues are usually:
- Missing secrets
- Incorrect secret values
- Node version mismatch
- Missing dependencies

---

**Last Updated:** Nov 4, 2025
**Pipeline Version:** 1.0.0
