# CI/CD Pipeline Documentation

Complete CI/CD pipeline for Mango POS with automated testing, building, and deployment.

---

## 🚀 Pipelines Overview

### 1. **CI Pipeline** (`ci.yml`)
Runs on every push and pull request.

**Jobs:**
- ✅ Lint & Type Check
- ✅ Run Tests with Coverage
- ✅ Build Application
- ✅ Security Audit
- ✅ Bundle Size Analysis

**Duration:** ~3-5 minutes

---

### 2. **Deploy Pipeline** (`deploy.yml`)
Runs on push to main and version tags.

**Jobs:**
- 🏗️ Build Production Bundle
- 🚀 Deploy to Netlify
- 🚀 Deploy to Vercel (optional)
- 📦 Create GitHub Release
- 💬 Slack Notifications

**Duration:** ~5-7 minutes

---

### 3. **Preview Pipeline** (`preview.yml`)
Runs on pull requests.

**Jobs:**
- 🔍 Deploy PR Preview
- 📊 Lighthouse Audit
- 💬 Comment PR with Preview URL

**Duration:** ~4-6 minutes

---

### 4. **Scheduled Pipeline** (`scheduled.yml`)
Runs daily at 2 AM UTC.

**Jobs:**
- 🔒 Dependency Security Audit
- 🗄️ Database Health Check
- 📦 Bundle Size Monitoring
- 🔄 Sync System Check

**Duration:** ~5-10 minutes

---

### 5. **Docker Pipeline** (`docker.yml`)
Runs on main push and tags.

**Jobs:**
- 🐳 Build Multi-arch Docker Image
- 📦 Push to GitHub Container Registry
- 🔍 Security Scan (Trivy)
- 🚀 Deploy to Docker Host

**Duration:** ~7-10 minutes

---

## 📊 Workflow Diagram

```
┌─────────────────┐
│  Push to Main   │
└────────┬────────┘
         │
         ├─────────────┐
         │             │
    ┌────▼────┐   ┌────▼────┐
    │   CI    │   │ Docker  │
    │Pipeline │   │ Build   │
    └────┬────┘   └────┬────┘
         │             │
    ┌────▼────┐   ┌────▼────┐
    │ Deploy  │   │ Deploy  │
    │Pipeline │   │Container│
    └────┬────┘   └────┬────┘
         │             │
    ┌────▼─────────────▼────┐
    │   Production Live     │
    └───────────────────────┘
```

---

## 🎯 Quick Start

### Minimal Setup (Netlify Only)

1. **Get Netlify Credentials:**
```bash
npm install -g netlify-cli
netlify login
netlify init
```

2. **Add GitHub Secrets:**
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`
- `VITE_API_BASE_URL`

3. **Push to Main:**
```bash
git push origin main
```

Done! Your app deploys automatically. 🎉

---

## 🔐 Required Secrets

### Essential (Minimum)
```
VITE_API_BASE_URL          # Your API URL
NETLIFY_AUTH_TOKEN         # Netlify personal access token
NETLIFY_SITE_ID            # Your Netlify site ID
```

### Optional (Additional Features)
```
VERCEL_TOKEN               # Vercel deployment
VERCEL_ORG_ID             # Vercel organization ID
VERCEL_PROJECT_ID         # Vercel project ID
SLACK_WEBHOOK             # Slack notifications
SSH_PRIVATE_KEY           # Custom server deployment
DEPLOY_HOST               # Docker deployment host
DEPLOY_USER               # Docker deployment user
```

---

## 📈 Deployment Strategies

### 1. Netlify (Recommended for SPA)
**Pros:**
- ✅ Zero configuration
- ✅ CDN included
- ✅ Auto HTTPS
- ✅ Preview deployments
- ✅ Serverless functions ready

**Setup:**
```bash
netlify init
# Follow prompts
```

### 2. Vercel (Alternative)
**Pros:**
- ✅ Optimized for React
- ✅ Edge network
- ✅ Analytics included
- ✅ Preview deployments

**Setup:**
```bash
npx vercel link
# Copy credentials from .vercel/project.json
```

### 3. Docker (Self-hosted)
**Pros:**
- ✅ Full control
- ✅ No vendor lock-in
- ✅ Cost-effective at scale
- ✅ Multi-environment support

**Setup:**
```bash
docker build -t mango-pos .
docker run -p 80:80 mango-pos
```

---

## 🧪 Local Testing

### Test CI Locally

```bash
# Lint
npm run lint

# Tests
npm test

# Build
npm run build

# Check bundle size
du -sh dist/
```

### Test Docker Build

```bash
# Build image
docker build -t mango-pos:local .

# Run container
docker run -p 3000:80 mango-pos:local

# Visit http://localhost:3000
```

### Test with Docker Compose

```bash
# Production mode
docker-compose up

# Development mode (hot reload)
docker-compose --profile dev up
```

---

## 🔍 Monitoring

### GitHub Actions Dashboard
View all workflow runs:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

### Deployment Status
- **Netlify:** https://app.netlify.com
- **Vercel:** https://vercel.com/dashboard
- **Docker:** Check your container registry

### Performance Metrics
- **Lighthouse:** Runs on every PR
- **Bundle Size:** Monitored daily
- **Coverage:** Codecov integration

---

## 🐛 Troubleshooting

### Build Fails

**Check:**
1. Node version (should be 18.x)
2. Environment variables set correctly
3. Dependencies installed (`npm ci`)

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deployment Fails

**Check:**
1. Secrets are set correctly
2. Site ID matches your deployment
3. API URL is accessible

**Debug:**
```bash
# Check workflow logs
# Actions > Failed workflow > Click job > Expand step
```

### Tests Fail on CI

**Common causes:**
- Timing issues (add proper waits)
- Environment differences
- Missing test data

**Fix:**
```bash
# Run tests in CI mode
npm test -- --run

# Check specific test
npm test -- --run --grep "test name"
```

---

## 📚 Files Structure

```
.github/
├── workflows/
│   ├── ci.yml           # Main CI pipeline
│   ├── deploy.yml       # Deployment pipeline
│   ├── preview.yml      # PR preview pipeline
│   ├── scheduled.yml    # Daily maintenance
│   └── docker.yml       # Docker build & push
├── CI_CD_SETUP.md       # Detailed setup guide
└── README.md            # This file

Dockerfile               # Production container
docker-compose.yml       # Local development
nginx.conf              # Nginx configuration
```

---

## 🎨 Customization

### Change Deployment Target

Edit `.github/workflows/deploy.yml`:

```yaml
# Remove unwanted deployment jobs
# Keep only what you need
```

### Add Custom Checks

Edit `.github/workflows/ci.yml`:

```yaml
- name: Custom Check
  run: npm run your-custom-command
```

### Modify Schedule

Edit `.github/workflows/scheduled.yml`:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Change time/frequency
```

---

## 🔒 Security

### Automated Security Checks
- ✅ Dependency audit (daily)
- ✅ Docker image scanning (Trivy)
- ✅ SBOM generation
- ✅ Vulnerability alerts

### Best Practices
- 🔐 Never commit secrets
- 🔐 Use GitHub secrets for credentials
- 🔐 Rotate tokens regularly
- 🔐 Enable branch protection

---

## 📊 Status Badges

Add to your README.md:

```markdown
![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI%20Pipeline/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Deploy%20Pipeline/badge.svg)
![Docker](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Docker%20Build%20%26%20Push/badge.svg)
```

---

## 🆘 Support

**Documentation:**
- [Full Setup Guide](./CI_CD_SETUP.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Netlify Docs](https://docs.netlify.com)
- [Docker Docs](https://docs.docker.com)

**Common Issues:**
- Check workflow logs in Actions tab
- Verify all secrets are set
- Ensure Node 18.x is used
- Validate build works locally

---

**Last Updated:** Nov 4, 2025  
**Pipeline Version:** 1.0.0  
**Maintained by:** Mango POS Team
