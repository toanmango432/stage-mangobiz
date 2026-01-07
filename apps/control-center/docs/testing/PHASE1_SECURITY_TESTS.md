# Phase 1: Security Fixes - Test Documentation

## Overview

This document outlines the testing procedures for Phase 1 security fixes in the Control Center app.

---

## 1. Environment Configuration Tests

### 1.1 Environment Variable Validation

**Test Case:** Missing VITE_SUPABASE_URL
```bash
# Remove or comment out VITE_SUPABASE_URL in .env
# Expected: Console error "VITE_SUPABASE_URL is not configured"
# In production mode: Throws error and prevents app start
```

**Test Case:** Invalid VITE_SUPABASE_URL (no HTTPS)
```bash
# Set VITE_SUPABASE_URL=http://example.com
# Expected: Console error "VITE_SUPABASE_URL must use HTTPS"
```

**Test Case:** Missing VITE_SUPABASE_ANON_KEY
```bash
# Remove or comment out VITE_SUPABASE_ANON_KEY in .env
# Expected: Console error "VITE_SUPABASE_ANON_KEY is not configured"
```

**Test Case:** Invalid VITE_SUPABASE_ANON_KEY (too short)
```bash
# Set VITE_SUPABASE_ANON_KEY=short-key
# Expected: Console error "VITE_SUPABASE_ANON_KEY appears to be invalid (too short)"
```

### 1.2 Git Security

**Test Case:** .env files not tracked
```bash
cd apps/control-center
git status
# Expected: .env files should NOT appear in git status
# Verify .gitignore includes: .env, .env.local, .env.*.local
```

---

## 2. Row Level Security (RLS) Tests

### 2.1 RLS Enabled Verification

Run in Supabase SQL Editor:
```sql
-- Check RLS status on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'tenants', 'licenses', 'stores', 'members',
  'devices', 'admin_users', 'admin_sessions', 'audit_logs',
  'feature_flags', 'announcements', 'surveys', 'survey_responses', 'system_configs'
);

-- Expected: All tables should show rowsecurity = true
```

### 2.2 is_admin() Function Test

```sql
-- Test is_admin function exists
SELECT proname FROM pg_proc WHERE proname = 'is_admin';
-- Expected: Returns 'is_admin'

-- Test function returns false for anonymous users
SELECT is_admin();
-- Expected: false (when not authenticated as admin)
```

### 2.3 Policy Enforcement Tests

**Test Case:** Unauthenticated access
```typescript
// Using anon key without authentication
const { data, error } = await supabase.from('tenants').select('*');
// Expected: error or empty data due to RLS policy
```

**Test Case:** Authenticated admin access
```typescript
// After admin login with proper role
const { data, error } = await supabase.from('tenants').select('*');
// Expected: Returns tenant data
```

---

## 3. Session Storage Tests

### 3.1 Supabase Auth Session

**Test Case:** Session persistence
```typescript
// Login as admin
await supabase.auth.signInWithPassword({ email, password });

// Refresh page
// Expected: Session should persist via Supabase's built-in storage

// Check session
const { data: { session } } = await supabase.auth.getSession();
// Expected: session should be valid
```

### 3.2 Token Auto-Refresh

**Test Case:** Token refresh
```typescript
// Config verification
// autoRefreshToken: true in supabase client config
// Expected: Tokens refresh automatically before expiration
```

---

## 4. Demo Credentials Separation

### 4.1 Production Schema Check

**Test Case:** No demo data in main schema
```bash
grep -n "admin123\|demo123\|owner123" apps/control-center/src/db/supabase-schema.sql
# Expected: No matches (demo credentials removed)
```

### 4.2 Development Seed File

**Test Case:** Dev seed file exists separately
```bash
ls -la apps/control-center/src/db/supabase-seed-dev.sql
# Expected: File exists with demo data for development only
```

---

## 5. Circuit Breaker Tests

### 5.1 Failure Recording

**Test Case:** Circuit opens after failures
```typescript
import { recordFailure, isCircuitOpen } from './client';

// Simulate 5 consecutive failures
for (let i = 0; i < 5; i++) {
  recordFailure();
}

console.log(isCircuitOpen());
// Expected: true
```

### 5.2 Circuit Reset

**Test Case:** Circuit resets after timeout
```typescript
// Wait 30 seconds after circuit opens
setTimeout(() => {
  console.log(isCircuitOpen());
  // Expected: false (circuit should reset)
}, 31000);
```

---

## Test Results Summary

| Test Category | Status | Notes |
|---------------|--------|-------|
| Environment Validation | PENDING | Run on app startup |
| Git Security | PENDING | Verify .gitignore |
| RLS Enabled | PENDING | Check Supabase dashboard |
| RLS Policies | PENDING | Test with admin/anon users |
| Session Storage | PENDING | Test login flow |
| Demo Credentials | PENDING | Verify separation |
| Circuit Breaker | PENDING | Simulate failures |

---

## Manual Verification Checklist

Before proceeding to Phase 2:

- [ ] `.env` file is NOT tracked in git
- [ ] `.env.example` has proper documentation
- [ ] App starts without errors with valid config
- [ ] App shows error with invalid/missing config
- [ ] RLS is enabled on all 13 tables
- [ ] `is_admin()` function exists in database
- [ ] RLS policies exist for all tables
- [ ] Demo credentials are ONLY in `supabase-seed-dev.sql`
- [ ] `supabase-schema.sql` has NO hardcoded passwords
- [ ] Circuit breaker works as expected

---

*Created: Phase 1 Security Fixes*
*Status: Implementation Complete, Testing Pending*
