# Dependency Audit Report

**Date:** January 8, 2026
**Scope:** `/apps/store-app`
**Overall Health Score:** 7/10

---

## Executive Summary

| Category | Count | Action Required |
|----------|-------|-----------------|
| Critical vulnerabilities | 0 | None |
| High vulnerabilities | 0 | None |
| Moderate vulnerabilities | 1 | Review (dev-only) |
| Outdated (major) | 9 | Plan upgrade |
| Outdated (minor/patch) | 13 | Regular update |
| License issues | 0 | None |

---

## Security Vulnerabilities

### Moderate Severity

| Package | Version | Advisory | Fix Version |
|---------|---------|----------|-------------|
| esbuild | 0.21.5 | GHSA-67mh-4wv8-2f99 | >=0.25.0 |

**Details:** The esbuild development server sets `Access-Control-Allow-Origin: *` allowing any website to send requests to the dev server.

**Risk Assessment:** LOW - Only affects development mode. Production builds are not impacted.

**Remediation:**
```bash
# Update vite to get newer esbuild
pnpm update vite --filter @mango/control-center
```

---

## Outdated Packages

### Major Version Updates (Breaking Changes)

| Package | Current | Latest | Breaking Changes |
|---------|---------|--------|------------------|
| @hookform/resolvers | 3.10.0 | 5.2.2 | Yes - API changes |
| @types/node | 20.19.27 | 25.0.3 | Yes - Node 22+ types |
| @types/react | 18.3.27 | 19.2.7 | Yes - React 19 types |
| @types/react-dom | 18.3.7 | 19.2.3 | Yes - React 19 types |
| @typescript-eslint/* | 5.62.0 | 8.52.0 | Yes - ESLint 9 required |
| @vitejs/plugin-react | 4.7.0 | 5.1.2 | Yes - Vite 7 support |
| electron | 35.7.5 | 39.2.7 | Yes - Chromium updates |
| eslint | 8.57.1 | 9.39.2 | Yes - Flat config required |
| react/react-dom | 18.3.1 | 19.2.3 | Yes - Concurrent features |
| tailwindcss | 3.4.17 | 4.1.18 | Yes - Complete rewrite |
| vite | 6.4.1 | 7.3.1 | Yes - Config changes |
| zod | 3.25.76 | 4.3.5 | Yes - API changes |

### Minor/Patch Updates (Safe)

| Package | Current | Latest |
|---------|---------|--------|
| @tanstack/react-virtual | 3.13.16 | 3.13.18 |
| focus-trap-react | 11.0.4 | 11.0.5 |
| electron-builder | 26.0.12 | 26.4.0 |
| framer-motion | 12.23.28 | 12.24.12 |
| react-router-dom | 7.11.0 | 7.12.0 |

---

## Bundle Size Analysis

**Total:** 4.6 MB raw / ~1.06 MB gzipped
**Target:** <2 MB raw

### Bundle Optimization Opportunities

| Package | Current Size | Alternative | Savings |
|---------|--------------|-------------|---------|
| framer-motion | ~120 KB | motion (lite) / CSS | ~80-100 KB |
| @sentry/react | ~50 KB | Lazy load | ~30-40 KB |
| react-hot-toast | ~15 KB | sonner | ~8 KB |

---

## Action Checklist

### Immediate (This Week)

```bash
# 1. Update safe minor/patch versions
pnpm update @tanstack/react-virtual focus-trap-react framer-motion react-router-dom electron-builder --filter @mango/store-app
```

- [ ] Run updates above
- [ ] Test application functionality
- [ ] Commit changes

---

### Short-term (Next 2-4 Weeks)

#### ESLint 9 Migration
- [ ] Update to ESLint 9 flat config format
- [ ] Update @typescript-eslint packages together
- [ ] Timeline: 1-2 days

```bash
# Install new versions
pnpm add -D eslint@^9 @typescript-eslint/eslint-plugin@^8 @typescript-eslint/parser@^8 --filter @mango/store-app

# Create eslint.config.js (flat config)
```

```javascript
// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { react },
    rules: {
      // your rules
    }
  }
);
```

---

### Planned Major Upgrades

#### 1. React 18 → 19 Migration
**Timeline:** 2-3 weeks
**Risk:** Medium

**Pre-migration checklist:**
- [ ] Review React 19 breaking changes
- [ ] Audit `defaultProps` usage (removed in React 19)
- [ ] Check `ref` handling patterns
- [ ] Review concurrent feature usage

**Migration steps:**
```bash
# 1. Update packages
pnpm add react@^19 react-dom@^19 --filter @mango/store-app
pnpm add -D @types/react@^19 @types/react-dom@^19 --filter @mango/store-app

# 2. Update any deprecated patterns
# 3. Test thoroughly
```

---

#### 2. Tailwind CSS 3 → 4 Migration
**Timeline:** 1 week
**Risk:** Medium-High (complete rewrite)

**Key changes:**
- New configuration format
- CSS-first approach
- Breaking utility class changes

**Migration steps:**
- [ ] Read Tailwind v4 migration guide
- [ ] Update `tailwind.config.js` format
- [ ] Review and update utility classes
- [ ] Test all components

---

#### 3. Zod 3 → 4 Migration
**Timeline:** 2-3 days
**Risk:** Low-Medium

**Steps:**
```bash
pnpm add zod@^4 @hookform/resolvers@^5 --filter @mango/store-app
```

- [ ] Update Zod schemas for API changes
- [ ] Update form resolvers
- [ ] Test all forms

---

#### 4. Vite 6 → 7 Migration
**Timeline:** 1 day
**Risk:** Low

```bash
pnpm add vite@^7 @vitejs/plugin-react@^5 --filter @mango/store-app
```

- [ ] Review config changes
- [ ] Update vite.config.ts
- [ ] Test build

---

## License Analysis

All licenses are compatible with commercial use:

| License | Count | Status |
|---------|-------|--------|
| MIT | Majority | Compatible |
| Apache-2.0 | ~30 | Compatible |
| BSD-2-Clause | ~10 | Compatible |
| BSD-3-Clause | ~5 | Compatible |
| ISC | ~5 | Compatible |

**No GPL or restrictive licenses found.**

---

## Dependency Health Metrics

| Metric | Status |
|--------|--------|
| Security | Good (1 moderate dev-only) |
| Currency | Fair (9 major versions behind) |
| Bundle Size | Needs Work (4.6MB vs 2MB target) |
| Licenses | Excellent (all compatible) |
| Maintenance | Good (all actively maintained) |

---

## Recommended Update Schedule

### Monthly
- [ ] Run `pnpm outdated` to check for updates
- [ ] Apply patch updates
- [ ] Run security audit: `pnpm audit`

### Quarterly
- [ ] Review minor version updates
- [ ] Plan major version migrations
- [ ] Audit bundle size

### Annually
- [ ] Major framework upgrades (React, Vite)
- [ ] Review dependency alternatives
- [ ] License compliance audit
