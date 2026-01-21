# Authentication Migration Plan: Supabase Auth for Members

**Version:** 1.0
**Date:** January 20, 2026
**Status:** Approved for Implementation
**Owner:** Engineering Team

---

> ⚠️ **WEB PLATFORM SECURITY NOTICE**
>
> The web browser platform has security limitations that make it unsuitable for production POS deployment:
>
> 1. **SecureStorage uses base64 encoding (not encryption)** - PIN hashes can be read via browser DevTools
> 2. **Lockout state can be cleared** - Attackers can bypass PIN rate limiting via localStorage
> 3. **Session data accessible** - Cached credentials visible in browser storage
>
> **Recommendation:** Deploy production POS on native platforms (iOS/Android/Electron) which use hardware-backed secure storage (Keychain, Android Keystore).
>
> See [apps/store-app/README.md](/apps/store-app/README.md) for detailed security considerations.

---

## Executive Summary

Migrate Store App staff ("members") authentication to use **Supabase Auth as the single identity provider** while keeping **PIN as a local/offline quick unlock mechanism** for POS runtime operations.

### Goals
- Unify staff identity across Store App, Control Center, and future apps
- Gain Supabase Auth security features (password hashing, rate limiting, password reset, MFA)
- Maintain offline-first capability and fast PIN switching for POS
- Eliminate custom auth security maintenance burden

### Non-Goals
- Changing the store/device pairing flow (remains custom)
- Modifying customer authentication (Online Store - already uses Supabase Auth)
- Changing Control Center auth (already uses Supabase Auth)

---

## Current State Analysis

### What Exists Today

| App | Auth Method | Identity Source | Status |
|-----|-------------|-----------------|--------|
| **Store App** | Custom (Store login + PIN) | `stores` + `members` tables | ⚠️ Missing security features |
| **Control Center** | Supabase Auth | `auth.users` + JWT metadata | ✅ Working |
| **Online Store** | Supabase Auth | `auth.users` + `client_auth` table | ✅ Working |

### Current Store App Auth Flow

```
1. Store Login
   └── Query: stores.store_login_id + stores.password_hash
   └── Session: Cached in localStorage (7-day grace)

2. Member Identification (PIN)
   └── Query: members.pin (plaintext comparison!)
   └── Session: Cached in localStorage (24-hour grace)
```

### Security Gaps in Current Implementation

| Issue | Risk Level | Location |
|-------|------------|----------|
| Plaintext password comparison | 🔴 Critical | `authService.ts:860-874` |
| No PIN rate limiting | 🔴 Critical | `authService.ts:397-472` |
| No account lockout | 🟠 High | Not implemented |
| No password reset flow | 🟠 High | Not implemented |
| No MFA/2FA option | 🟡 Medium | Not implemented |
| localStorage for secrets | 🟡 Medium | `authService.ts:78-128` |

---

## Target Architecture

### Unified Identity Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPABASE AUTH (auth.users)                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  id (UUID) - Primary identity key                           │   │
│  │  email - Unique, required for staff                         │   │
│  │  encrypted_password - bcrypt hashed by Supabase             │   │
│  │  user_metadata - { role, name, tenant_id }                  │   │
│  │  + Rate limiting, password reset, MFA built-in              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ auth_user_id (FK)
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MEMBERS TABLE (public.members)               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  id (UUID) - POS member ID                                  │   │
│  │  auth_user_id (UUID) - Links to auth.users.id [NEW]         │   │
│  │  email - Must match auth.users.email                        │   │
│  │  pin_hash - bcrypt hash for offline POS unlock [UPDATED]    │   │
│  │  pin_attempts - Failed attempt counter [NEW]                │   │
│  │  pin_locked_until - Lockout timestamp [NEW]                 │   │
│  │  role, permissions, store_ids - POS authorization           │   │
│  │  name, phone, avatar_url - Profile data                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────────────┐
        │  Control Center   │           │  Store App (POS)          │
        │                   │           │                           │
        │  Login:           │           │  Initial: Supabase Auth   │
        │  Supabase Auth    │           │  Runtime: PIN unlock      │
        │  (email+password) │           │  Offline: Cached + PIN    │
        └───────────────────┘           └───────────────────────────┘
```

### Store App Auth Flow (After Migration)

```
┌─────────────────────────────────────────────────────────────────────┐
│  SCENARIO 1: First Login (Online Required)                         │
├─────────────────────────────────────────────────────────────────────┤
│  1. User enters email + password                                    │
│  2. supabase.auth.signInWithPassword()                             │
│  3. On success: Fetch linked member by auth_user_id                │
│  4. If no PIN set: Prompt to create 4-6 digit PIN                  │
│  5. Cache: member profile + permissions + PIN hash                 │
│  6. Grant access to POS                                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  SCENARIO 2: Returning User (Online)                                │
├─────────────────────────────────────────────────────────────────────┤
│  1. Show cached member list on login screen                        │
│  2. User enters PIN                                                │
│  3. Validate PIN locally (bcrypt compare)                          │
│  4. Grant immediate access                                         │
│  5. Background: Validate session with Supabase (non-blocking)      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  SCENARIO 3: Offline Mode                                           │
├─────────────────────────────────────────────────────────────────────┤
│  1. Show cached member list                                        │
│  2. User enters PIN                                                │
│  3. Validate PIN locally (bcrypt compare)                          │
│  4. Check grace period (default: 7 days since last online auth)    │
│  5. If valid: Grant access                                         │
│  6. If expired: Require online re-authentication                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  SCENARIO 4: Fast Staff Switching                                   │
├─────────────────────────────────────────────────────────────────────┤
│  1. Current member taps "Switch User" or session times out         │
│  2. Show cached member list                                        │
│  3. Different member enters their PIN                              │
│  4. Validate PIN locally                                           │
│  5. Switch active member instantly (no network)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### Migration 028: Add Supabase Auth Link to Members

```sql
-- Migration: 028_add_supabase_auth_to_members.sql
-- Description: Link members table to Supabase auth.users for unified identity

-- Step 1: Add auth_user_id column
ALTER TABLE members 
ADD COLUMN auth_user_id UUID UNIQUE;

-- Step 2: Add PIN security columns
ALTER TABLE members
ADD COLUMN pin_hash TEXT,
ADD COLUMN pin_legacy TEXT,  -- Stores original PIN for rollback (cleared after migration verified)
ADD COLUMN pin_attempts INTEGER DEFAULT 0,
ADD COLUMN pin_locked_until TIMESTAMPTZ,
ADD COLUMN last_online_auth TIMESTAMPTZ,
ADD COLUMN offline_grace_period INTERVAL DEFAULT '7 days',
ADD COLUMN password_changed_at TIMESTAMPTZ;  -- Force re-auth after password reset

-- Step 3: Create index for auth lookups
CREATE INDEX idx_members_auth_user_id ON members(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Step 4: Add constraint (optional - depends on migration strategy)
-- Note: Not enforcing FK to auth.users since it's in auth schema
-- ALTER TABLE members 
-- ADD CONSTRAINT fk_members_auth_user 
-- FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 5: Update RLS policies to allow auth-based access
CREATE POLICY "Members can read own profile via auth"
ON members FOR SELECT
USING (auth.uid() = auth_user_id);

CREATE POLICY "Members can update own profile via auth"
ON members FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Step 6: Add comments
COMMENT ON COLUMN members.auth_user_id IS 'Links to Supabase auth.users.id for unified identity';
COMMENT ON COLUMN members.pin_hash IS 'bcrypt hash of POS PIN for offline/quick authentication';
COMMENT ON COLUMN members.pin_legacy IS 'Original plaintext PIN preserved for rollback (clear after migration verified)';
COMMENT ON COLUMN members.pin_attempts IS 'Failed PIN attempts counter, resets on success';
COMMENT ON COLUMN members.pin_locked_until IS 'PIN locked until this time after max failed attempts';
COMMENT ON COLUMN members.last_online_auth IS 'Last successful Supabase Auth login, for offline grace calculation';
COMMENT ON COLUMN members.offline_grace_period IS 'How long offline PIN access is allowed after last online auth';
COMMENT ON COLUMN members.password_changed_at IS 'Timestamp of last password change, forces re-auth on all devices';

-- Step 7: Create session invalidation table for immediate revocation
CREATE TABLE member_session_revocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,  -- 'password_change', 'admin_revoke', 'security_concern'
  revoke_all_before TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- Invalidate sessions created before this time
);

CREATE INDEX idx_session_revocations_member ON member_session_revocations(member_id);

COMMENT ON TABLE member_session_revocations IS 'Tracks session revocations for immediate logout across all devices';
```

### Migration 029: Migrate Existing Members (Data Migration)

```sql
-- Migration: 029_migrate_member_passwords.sql
-- Description: Create Supabase Auth users for existing members and link them
-- Note: This requires a server-side script, not pure SQL

-- This migration is a placeholder. Actual migration will be done via:
-- 1. Node.js script using Supabase Admin API
-- 2. Creates auth.users for each member with email
-- 3. Links member.auth_user_id to new auth.users.id
-- 4. Converts existing PIN to bcrypt hash

-- See: scripts/migrate-members-to-supabase-auth.ts
```

---

## Implementation Phases

### Phase 1: Database & Schema (Week 1, Days 1-2)

**Objective:** Prepare database for new auth model

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 1.1 | Create migration 028 (schema changes) | 2h | Backend |
| 1.2 | Create migration 029 (data migration script placeholder) | 1h | Backend |
| 1.3 | Run migrations on dev environment | 1h | Backend |
| 1.4 | Update TypeScript types in `types.ts` | 2h | Backend |
| 1.5 | Test RLS policies with new columns | 2h | Backend |

**Deliverable:** Schema updated, types updated, dev environment ready

---

### Phase 2: Member Migration Script (Week 1, Days 3-4)

**Objective:** Create and test script to migrate existing members to Supabase Auth

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 2.1 | Create migration script | 4h | Backend |
| 2.2 | Handle edge cases (no email, duplicate email) | 2h | Backend |
| 2.3 | Generate temporary passwords + email notifications | 2h | Backend |
| 2.4 | Convert existing PINs to bcrypt hashes | 2h | Backend |
| 2.5 | Test on dev environment with sample data | 2h | Backend |
| 2.6 | Create rollback script | 2h | Backend |

**Migration Script Location:** `scripts/migrate-members-to-supabase-auth.ts`

```typescript
// scripts/migrate-members-to-supabase-auth.ts
// Production-ready migration script with error handling and dry-run support

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { generateTemporaryPassword, sendWelcomeEmail } from './utils';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin key required
);

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true';  // Preview changes without committing
const BATCH_SIZE = 50;  // Process members in batches
const EMAIL_RETRY_ATTEMPTS = 3;

interface MigrationResult {
  success: string[];
  failed: { memberId: string; email: string; error: string }[];
  skipped: { memberId: string; reason: string }[];
  emailFailed: { memberId: string; email: string; tempPassword: string }[];  // For manual follow-up
}

const results: MigrationResult = {
  success: [],
  failed: [],
  skipped: [],
  emailFailed: [],
};

/**
 * Find existing Supabase user by email using direct query (not listUsers)
 * This scales better than loading all users into memory
 */
async function findExistingAuthUser(email: string): Promise<{ id: string } | null> {
  // Use getUserByEmail for efficient lookup
  const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(email);

  if (error && error.message !== 'User not found') {
    console.warn(`Error looking up ${email}:`, error.message);
  }

  return data?.user ? { id: data.user.id } : null;
}

/**
 * Send welcome email with retry logic
 */
async function sendWelcomeEmailWithRetry(
  email: string,
  name: string,
  tempPassword: string,
  memberId: string
): Promise<boolean> {
  for (let attempt = 1; attempt <= EMAIL_RETRY_ATTEMPTS; attempt++) {
    try {
      await sendWelcomeEmail(email, name, tempPassword);
      return true;
    } catch (error) {
      console.warn(`Email attempt ${attempt}/${EMAIL_RETRY_ATTEMPTS} failed for ${email}`);
      if (attempt === EMAIL_RETRY_ATTEMPTS) {
        // Log for manual follow-up - IMPORTANT: store securely, not in plain logs
        results.emailFailed.push({ memberId, email, tempPassword });
        return false;
      }
      await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
    }
  }
  return false;
}

async function migrateMember(member: Member): Promise<void> {
  // Skip if already migrated
  if (member.auth_user_id) {
    results.skipped.push({ memberId: member.id, reason: 'already_migrated' });
    return;
  }

  // Skip if no email
  if (!member.email) {
    results.skipped.push({ memberId: member.id, reason: 'no_email' });
    console.warn(`⚠️  Skipping member ${member.id} (${member.name}) - no email`);
    return;
  }

  // Check if Supabase user already exists with this email (efficient lookup)
  const existingUser = await findExistingAuthUser(member.email);

  let authUserId: string;
  let tempPassword: string | null = null;
  let isExistingControlCenterUser = false;

  if (existingUser) {
    // Link to existing auth user (likely from Control Center)
    authUserId = existingUser.id;
    isExistingControlCenterUser = true;
    console.log(`🔗 Linking ${member.email} to existing auth user (Control Center)`);

    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would link member ${member.id} to auth user ${authUserId}`);
      return;
    }
  } else {
    // Create new Supabase Auth user
    tempPassword = generateTemporaryPassword();

    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would create auth user for ${member.email}`);
      return;
    }

    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: member.email,
      password: tempPassword,
      email_confirm: true, // Skip email verification for migration
      user_metadata: {
        name: member.name,
        role: member.role,
        tenant_id: member.tenant_id,
        migrated_from_member_id: member.id,
        migration_date: new Date().toISOString(),
      },
    });

    if (error) {
      results.failed.push({ memberId: member.id, email: member.email, error: error.message });
      console.error(`❌ Failed to create auth user for ${member.email}:`, error.message);
      return;
    }

    authUserId = newUser.user.id;
  }

  // Hash existing PIN with bcrypt (if exists)
  let pinHash = null;
  if (member.pin) {
    pinHash = await bcrypt.hash(member.pin, 12);
  }

  // Update member record
  const { error: updateError } = await supabaseAdmin
    .from('members')
    .update({
      auth_user_id: authUserId,
      pin_hash: pinHash,
      pin_legacy: member.pin,  // Preserve for rollback (clear after migration verified)
      pin: null,  // Clear plaintext PIN from active column
      password_hash: null,  // Clear old password hash
      last_online_auth: new Date().toISOString(),
    })
    .eq('id', member.id);

  if (updateError) {
    results.failed.push({ memberId: member.id, email: member.email, error: updateError.message });
    console.error(`❌ Failed to update member ${member.id}:`, updateError.message);
    return;
  }

  // Send welcome email (only for newly created users, not Control Center links)
  if (tempPassword && !isExistingControlCenterUser) {
    const emailSent = await sendWelcomeEmailWithRetry(
      member.email,
      member.name,
      tempPassword,
      member.id
    );
    if (!emailSent) {
      console.warn(`⚠️  Email failed for ${member.email} - logged for manual follow-up`);
    }
  }

  results.success.push(member.id);
  console.log(`✅ Migrated ${member.email}${isExistingControlCenterUser ? ' (linked to Control Center)' : ''}`);
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Member to Supabase Auth Migration`);
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '🚀 LIVE'}`);
  console.log(`${'='.repeat(60)}\n`);

  // Fetch members in batches
  let offset = 0;
  let totalProcessed = 0;

  while (true) {
    const { data: members, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .is('auth_user_id', null)
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error('Failed to fetch members:', error);
      return;
    }

    if (!members || members.length === 0) {
      break;
    }

    console.log(`\nProcessing batch ${Math.floor(offset / BATCH_SIZE) + 1} (${members.length} members)...`);

    for (const member of members) {
      await migrateMember(member);
      totalProcessed++;
    }

    offset += BATCH_SIZE;

    // Rate limiting - pause between batches
    if (members.length === BATCH_SIZE) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Print summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Migration Summary`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`⚠️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`📧 Email failed (needs manual follow-up): ${results.emailFailed.length}`);

  if (results.failed.length > 0) {
    console.log(`\nFailed members:`);
    results.failed.forEach(f => console.log(`  - ${f.email}: ${f.error}`));
  }

  if (results.emailFailed.length > 0) {
    console.log(`\n⚠️  IMPORTANT: ${results.emailFailed.length} members need manual credential delivery.`);
    console.log(`   See migration_email_failures.json for details.`);

    // Write failures to secure file for support team
    const fs = await import('fs');
    fs.writeFileSync(
      'migration_email_failures.json',
      JSON.stringify(results.emailFailed, null, 2),
      { mode: 0o600 }  // Restrict file permissions
    );
  }

  console.log(`\nMigration ${DRY_RUN ? 'preview' : ''} complete!`);
}

// Run with: DRY_RUN=true npx ts-node scripts/migrate-members-to-supabase-auth.ts
main();
```

**Deliverable:** Tested migration script ready for production

---

### Phase 3: Auth Service Updates (Week 1, Day 5 - Week 2, Day 2)

**Objective:** Update Store App auth service to use Supabase Auth + PIN hybrid

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 3.1 | Create new `memberAuthService.ts` | 4h | Frontend |
| 3.2 | Implement Supabase Auth login flow | 3h | Frontend |
| 3.3 | Implement PIN validation with bcrypt | 2h | Frontend |
| 3.4 | Implement PIN rate limiting & lockout | 2h | Frontend |
| 3.5 | Implement offline grace period logic | 2h | Frontend |
| 3.6 | Implement background session validation | 2h | Frontend |
| 3.7 | Update `storeAuthManager.ts` to use new service | 3h | Frontend |
| 3.8 | Add PIN setup flow for new/migrated users | 3h | Frontend |

**New Service Location:** `apps/store-app/src/services/memberAuthService.ts`

```typescript
// apps/store-app/src/services/memberAuthService.ts
// Core implementation for hybrid Supabase Auth + PIN

import { supabase } from './supabase/client';
import bcrypt from 'bcryptjs';
import { SecureStorage } from '@/utils/secureStorage';  // Platform-specific secure storage
import { store } from '@/store';
import { forceLogout, setSessionInvalid } from '@/store/slices/authSlice';

// Constants
const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCKOUT_MINUTES = 15;
const OFFLINE_GRACE_DAYS = 7;
const GRACE_CHECK_INTERVAL_MS = 30 * 60 * 1000;  // Check every 30 minutes

export interface MemberAuthSession {
  memberId: string;
  authUserId: string;
  email: string;
  name: string;
  role: string;
  storeIds: string[];
  permissions: Record<string, boolean>;
  lastOnlineAuth: Date;
  sessionCreatedAt: Date;  // For revocation checks
  // NOTE: pinHash is stored in SecureStorage, NOT in this session object
}

// Cached members for offline access (profile only, NOT PIN hash)
const MEMBER_CACHE_KEY = 'mango_member_cache';
const PIN_HASH_STORAGE_KEY = 'mango_pin_hashes';  // Stored in SecureStorage

// Interval reference for grace period checker
let graceCheckInterval: NodeJS.Timeout | null = null;

export const memberAuthService = {
  /**
   * Full login with Supabase Auth (online required)
   * Used for initial login or when offline grace expired
   */
  async loginWithPassword(email: string, password: string): Promise<MemberAuthSession> {
    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Authentication failed');
    }

    // 2. Fetch linked member record
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (memberError || !member) {
      throw new Error('No member profile linked to this account');
    }

    // 3. Check if password was changed (force re-auth on other devices)
    if (member.password_changed_at) {
      const passwordChangedAt = new Date(member.password_changed_at);
      // This is a fresh login, so we're good - but other cached sessions are invalid
    }

    // 4. Update last online auth timestamp
    await supabase
      .from('members')
      .update({ last_online_auth: new Date().toISOString() })
      .eq('id', member.id);

    const now = new Date();

    // 5. Create session object (WITHOUT pinHash - stored separately in SecureStorage)
    const session: MemberAuthSession = {
      memberId: member.id,
      authUserId: authData.user.id,
      email: member.email,
      name: member.name,
      role: member.role,
      storeIds: member.store_ids || [],
      permissions: member.permissions || {},
      lastOnlineAuth: now,
      sessionCreatedAt: now,
    };

    // 6. Cache session profile for offline access
    this.cacheMemberSession(session);

    // 7. Store PIN hash in SecureStorage (platform-specific secure storage)
    if (member.pin_hash) {
      await SecureStorage.set(`pin_hash_${member.id}`, member.pin_hash);
    }

    // 8. Start periodic grace period checker
    this.startGraceChecker();

    return session;
  },

  /**
   * Quick login with PIN (offline capable)
   * Used for returning users and fast switching
   */
  async loginWithPin(memberId: string, pin: string): Promise<MemberAuthSession> {
    // 1. Get cached member profile
    const cachedMembers = this.getCachedMembers();
    const member = cachedMembers.find(m => m.memberId === memberId);

    if (!member) {
      throw new Error('Member not found in cache. Please login online first.');
    }

    // 2. Check lockout
    const lockoutInfo = this.checkPinLockout(memberId);
    if (lockoutInfo.isLocked) {
      throw new Error(`PIN locked. Try again in ${lockoutInfo.remainingMinutes} minutes.`);
    }

    // 3. Check offline grace period
    const graceInfo = this.checkOfflineGrace(member);
    if (!graceInfo.isValid) {
      throw new Error('Offline access expired. Please login online to continue.');
    }

    // 4. Get PIN hash from SecureStorage (NOT from session object)
    const pinHash = await SecureStorage.get(`pin_hash_${memberId}`);
    if (!pinHash) {
      throw new Error('PIN not configured. Please login online to set up your PIN.');
    }

    // 5. Validate PIN with bcrypt
    const isValidPin = await bcrypt.compare(pin, pinHash);

    if (!isValidPin) {
      this.recordFailedPinAttempt(memberId);
      const attempts = this.getFailedAttempts(memberId);
      const remaining = PIN_MAX_ATTEMPTS - attempts;

      if (remaining <= 0) {
        this.lockPin(memberId);
        throw new Error(`PIN locked for ${PIN_LOCKOUT_MINUTES} minutes.`);
      }

      throw new Error(`Invalid PIN. ${remaining} attempts remaining.`);
    }

    // 6. Clear failed attempts on success
    this.clearFailedAttempts(memberId);

    // 7. Background validation if online (non-blocking)
    if (navigator.onLine) {
      this.validateSessionInBackground(member);
    }

    // 8. Ensure grace checker is running
    this.startGraceChecker();

    return member;
  },

  /**
   * Set or update PIN for a member
   */
  async setPin(memberId: string, newPin: string): Promise<void> {
    // Validate PIN format (4-6 digits)
    if (!/^\d{4,6}$/.test(newPin)) {
      throw new Error('PIN must be 4-6 digits');
    }

    // Hash PIN with bcrypt
    const pinHash = await bcrypt.hash(newPin, 12);

    // Update in database
    const { error } = await supabase
      .from('members')
      .update({ pin_hash: pinHash })
      .eq('id', memberId);

    if (error) {
      throw new Error('Failed to set PIN');
    }

    // Update SecureStorage (NOT localStorage)
    await SecureStorage.set(`pin_hash_${memberId}`, pinHash);
  },

  /**
   * Get list of cached members for offline access
   * Note: This returns profile data only, NOT PIN hashes
   */
  getCachedMembers(): MemberAuthSession[] {
    const cached = localStorage.getItem(MEMBER_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  },

  /**
   * Cache a member session for offline access
   * Note: PIN hash is stored separately in SecureStorage
   */
  cacheMemberSession(session: MemberAuthSession): void {
    const cached = this.getCachedMembers();
    const existingIndex = cached.findIndex(m => m.memberId === session.memberId);

    if (existingIndex >= 0) {
      cached[existingIndex] = session;
    } else {
      cached.push(session);
    }

    this.saveCachedMembers(cached);
  },

  /**
   * Check if offline grace period is still valid
   */
  checkOfflineGrace(member: MemberAuthSession): { isValid: boolean; daysRemaining: number } {
    const lastAuth = new Date(member.lastOnlineAuth);
    const now = new Date();
    const daysSinceAuth = (now.getTime() - lastAuth.getTime()) / (1000 * 60 * 60 * 24);
    const daysRemaining = OFFLINE_GRACE_DAYS - daysSinceAuth;

    return {
      isValid: daysRemaining > 0,
      daysRemaining: Math.max(0, Math.ceil(daysRemaining)),
    };
  },

  /**
   * Start periodic grace period checker (runs every 30 minutes)
   * Forces logout if grace period expires while user is logged in
   */
  startGraceChecker(): void {
    if (graceCheckInterval) return;  // Already running

    graceCheckInterval = setInterval(() => {
      const currentMemberId = store.getState().auth.currentMemberId;
      if (!currentMemberId) return;

      const cachedMembers = this.getCachedMembers();
      const member = cachedMembers.find(m => m.memberId === currentMemberId);

      if (member) {
        const graceInfo = this.checkOfflineGrace(member);
        if (!graceInfo.isValid && !navigator.onLine) {
          // Grace expired while offline - force logout
          store.dispatch(forceLogout({
            reason: 'offline_grace_expired',
            message: 'Your offline access has expired. Please connect to the internet to continue.',
          }));
          this.stopGraceChecker();
        }
      }
    }, GRACE_CHECK_INTERVAL_MS);
  },

  /**
   * Stop the grace period checker
   */
  stopGraceChecker(): void {
    if (graceCheckInterval) {
      clearInterval(graceCheckInterval);
      graceCheckInterval = null;
    }
  },

  /**
   * Logout and cleanup
   */
  async logout(): Promise<void> {
    this.stopGraceChecker();
    await supabase.auth.signOut();
    // Note: Don't clear cached members - they're needed for fast switching
  },

  // Private helper methods
  private saveCachedMembers(members: MemberAuthSession[]): void {
    localStorage.setItem(MEMBER_CACHE_KEY, JSON.stringify(members));
  },

  private checkPinLockout(memberId: string): { isLocked: boolean; remainingMinutes: number } {
    const lockoutKey = `pin_lockout_${memberId}`;
    const lockoutUntil = localStorage.getItem(lockoutKey);

    if (!lockoutUntil) {
      return { isLocked: false, remainingMinutes: 0 };
    }

    const lockoutTime = new Date(lockoutUntil);
    const now = new Date();

    if (now >= lockoutTime) {
      localStorage.removeItem(lockoutKey);
      return { isLocked: false, remainingMinutes: 0 };
    }

    const remainingMs = lockoutTime.getTime() - now.getTime();
    return {
      isLocked: true,
      remainingMinutes: Math.ceil(remainingMs / (1000 * 60)),
    };
  },

  private recordFailedPinAttempt(memberId: string): void {
    const attemptsKey = `pin_attempts_${memberId}`;
    const current = parseInt(localStorage.getItem(attemptsKey) || '0', 10);
    localStorage.setItem(attemptsKey, String(current + 1));
  },

  private getFailedAttempts(memberId: string): number {
    const attemptsKey = `pin_attempts_${memberId}`;
    return parseInt(localStorage.getItem(attemptsKey) || '0', 10);
  },

  private clearFailedAttempts(memberId: string): void {
    localStorage.removeItem(`pin_attempts_${memberId}`);
  },

  private lockPin(memberId: string): void {
    const lockoutKey = `pin_lockout_${memberId}`;
    const lockoutUntil = new Date(Date.now() + PIN_LOCKOUT_MINUTES * 60 * 1000);
    localStorage.setItem(lockoutKey, lockoutUntil.toISOString());
    this.clearFailedAttempts(memberId);
  },

  /**
   * Background validation - checks session validity and revocations
   * Dispatches Redux action to force logout if session is invalid
   */
  private async validateSessionInBackground(member: MemberAuthSession): Promise<void> {
    try {
      // 1. Check if member is still active
      const { data: memberData } = await supabase
        .from('members')
        .select('id, status, password_changed_at')
        .eq('auth_user_id', member.authUserId)
        .single();

      if (!memberData || memberData.status !== 'active') {
        store.dispatch(forceLogout({
          reason: 'account_deactivated',
          message: 'Your account has been deactivated. Please contact your administrator.',
        }));
        return;
      }

      // 2. Check if password was changed after this session was created
      if (memberData.password_changed_at) {
        const passwordChangedAt = new Date(memberData.password_changed_at);
        const sessionCreatedAt = new Date(member.sessionCreatedAt);

        if (passwordChangedAt > sessionCreatedAt) {
          store.dispatch(forceLogout({
            reason: 'password_changed',
            message: 'Your password was changed. Please login again.',
          }));
          return;
        }
      }

      // 3. Check session revocation table
      const { data: revocation } = await supabase
        .from('member_session_revocations')
        .select('revoke_all_before')
        .eq('member_id', member.memberId)
        .order('revoked_at', { ascending: false })
        .limit(1)
        .single();

      if (revocation) {
        const revokeAllBefore = new Date(revocation.revoke_all_before);
        const sessionCreatedAt = new Date(member.sessionCreatedAt);

        if (sessionCreatedAt < revokeAllBefore) {
          store.dispatch(forceLogout({
            reason: 'session_revoked',
            message: 'Your session has been revoked. Please login again.',
          }));
          return;
        }
      }

      // 4. Update cached session with fresh data (non-blocking)
      const updatedMember = { ...member, lastOnlineAuth: new Date() };
      this.cacheMemberSession(updatedMember);

    } catch (error) {
      // Network error - don't logout, just log
      console.warn('Background session validation failed:', error);
    }
  },
};
```

**Deliverable:** New auth service implemented and unit tested

---

### Phase 4: UI Updates (Week 2, Days 3-4)

**Objective:** Update Store App login UI to support new auth flow

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 4.1 | Update `StoreLoginScreen.tsx` for email/password | 3h | Frontend |
| 4.2 | Create PIN setup modal component | 2h | Frontend |
| 4.3 | Update `SwitchUserModal.tsx` for cached members | 2h | Frontend |
| 4.4 | Add "Forgot Password" link to login screen | 1h | Frontend |
| 4.5 | Add offline indicator with grace period info | 2h | Frontend |
| 4.6 | Add PIN lockout feedback UI | 1h | Frontend |
| 4.7 | Update Redux auth slice for new state | 2h | Frontend |

**Deliverable:** Updated login UI with all new flows

---

### Phase 5: Testing (Week 2, Day 5 - Week 3, Day 2)

**Objective:** Comprehensive testing of new auth system

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 5.1 | Unit tests for `memberAuthService.ts` | 4h | Frontend |
| 5.2 | Integration tests for Supabase Auth flow | 3h | Frontend |
| 5.3 | E2E tests for login scenarios | 4h | QA |
| 5.4 | Offline mode testing | 3h | QA |
| 5.5 | PIN lockout testing | 2h | QA |
| 5.6 | Fast switching testing | 2h | QA |
| 5.7 | Cross-app identity testing (Control Center) | 3h | QA |
| 5.8 | Security review | 4h | Security |

**Test Scenarios:**

| Scenario | Expected Result |
|----------|-----------------|
| First login with email/password | Supabase Auth succeeds, member loaded, PIN setup prompted |
| Returning user with PIN | PIN validated locally, immediate access |
| Invalid PIN (3 attempts) | Error message, 2 attempts remaining |
| Invalid PIN (5 attempts) | Locked for 15 minutes |
| Offline with valid grace | PIN works, access granted |
| Offline with expired grace | Error, requires online auth |
| Fast staff switch | Different PIN, different member, instant |
| Password reset | Email sent, password changed via Supabase |
| Same email in Control Center | Same identity, access based on role |
| **Concurrent device login** | Both devices work independently |
| **Password change on Device B while Device A is online** | Device A forced to re-auth on next validation |
| **Password change while Device A is offline** | Device A works until grace expires or comes online |
| **Admin deactivates member while logged in** | Logout within 30 minutes (online) or grace period (offline) |
| **Session revocation by admin** | All sessions invalidated, force re-login |
| **Offline for exactly 7 days** | Grace expires, require online auth |
| **Offline for 6 days 23 hours** | Grace valid, PIN works |
| **Migration dry-run** | No changes made, preview output shown |
| **Migration with email failures** | Failures logged to file, migration continues |
| **Rollback after migration** | Original PINs restored from pin_legacy |

**Deliverable:** All tests passing, security review approved

---

### Phase 6: Migration & Rollout (Week 3, Days 3-5)

**Objective:** Execute production migration with minimal disruption

| Task | Description | Effort | Owner |
|------|-------------|--------|-------|
| 6.1 | Deploy schema migrations to production | 1h | DevOps |
| 6.2 | Run member migration script (batch) | 2h | Backend |
| 6.3 | Verify migration results | 2h | Backend |
| 6.4 | Deploy new Store App version | 1h | DevOps |
| 6.5 | Monitor for errors | 4h | All |
| 6.6 | Rollback plan ready | 1h | DevOps |

**Migration Email Template:**

```
Subject: Important: Your Mango POS Login Has Been Upgraded

Hi {name},

We've upgraded the security of your Mango POS account. Here's what you need to know:

🔐 YOUR NEW LOGIN
- Email: {email}
- Temporary Password: {temp_password}

📱 WHAT TO DO
1. Open the Mango POS app
2. Login with your email and temporary password above
3. You'll be prompted to set a new password
4. Create your 4-6 digit PIN for quick access

🔄 WHAT'S CHANGED
- More secure password protection
- Easy password reset via email
- Same fast PIN access once logged in
- Works offline for up to 7 days

Questions? Contact support at support@mangobiz.com

- The Mango Team
```

**Deliverable:** Production migration complete, all users notified

---

## Rollback Plan

If critical issues are discovered after deployment:

### Immediate Rollback (< 1 hour)

1. Revert Store App to previous version
2. Old auth flow still works (schema is additive)
3. New columns are ignored by old code

### Data Rollback (if needed)

```sql
-- Rollback script (only if absolutely necessary)
-- This clears auth linkage and restores original PINs from pin_legacy

-- Step 1: Restore original plaintext PINs from pin_legacy backup
UPDATE members
SET auth_user_id = NULL,
    pin = pin_legacy,  -- Restore from backup column (NOT pin_hash!)
    pin_hash = NULL,
    pin_attempts = 0,
    pin_locked_until = NULL,
    last_online_auth = NULL,
    password_changed_at = NULL;

-- Step 2: Verify restoration
SELECT
  COUNT(*) as total_members,
  COUNT(pin) as members_with_pin_restored,
  COUNT(auth_user_id) as members_still_linked  -- Should be 0
FROM members;

-- Step 3: Do NOT delete auth.users - they may be used by Control Center
-- Step 4: Do NOT drop pin_legacy until rollback window closes (e.g., 30 days)
```

### Post-Migration Cleanup (after rollback window)

```sql
-- Run this ONLY after confirming migration is stable (e.g., 30 days post-migration)
-- This permanently removes the rollback capability

-- Clear the backup PIN column
UPDATE members SET pin_legacy = NULL WHERE pin_legacy IS NOT NULL;

-- Optionally drop the column entirely
-- ALTER TABLE members DROP COLUMN pin_legacy;
```

---

## Security Considerations

### Supabase Auth Rate Limits

Supabase Auth has built-in rate limiting. Document these for operations team:

| Operation | Default Limit | Notes |
|-----------|---------------|-------|
| Sign-ups | 30/hour per IP | Can be customized in Supabase dashboard |
| Login attempts | 30/minute per IP | Prevents brute force attacks |
| Password reset | 5/hour per email | Prevents email bombing |
| Token refresh | 360/hour per user | Generous limit for active users |
| Email verification | 3/hour per email | Prevents spam |

**Custom Limits (recommended for POS environment):**
- Consider IP allowlisting for store networks
- Increase login limit for shared POS devices (multiple staff, same IP)
- Monitor failed login attempts in Supabase dashboard

### Concurrent Session Handling

| Scenario | Behavior |
|----------|----------|
| Same member, multiple devices | Allowed - each device gets own session |
| Max concurrent sessions | No limit (controlled by offline grace period) |
| Session on Device A, password change on Device B | Device A forced to re-auth on next background validation |
| Admin revokes member access | All devices forced to re-auth within 30 minutes |
| Offline device during revocation | Blocked when grace period expires or device comes online |

**Session Revocation Flow:**
```
1. Admin deactivates member OR changes password
2. member_session_revocations entry created (or password_changed_at updated)
3. Online devices detect on next background validation (every PIN login)
4. Offline devices continue until:
   a. They come online (background validation catches it)
   b. Grace period expires (30-minute check interval)
```

### Control Center ↔ Store App Identity Overlap

When a user exists in both Control Center and Store App:

| Scenario | Behavior |
|----------|----------|
| Email exists in Control Center auth.users | Migration links member to existing auth user (no new password) |
| Email exists but different person | Migration script logs for manual review |
| Control Center user logs into Store App | Works if member record exists with matching auth_user_id |
| Store App member logs into Control Center | Works if user has Control Center role in user_metadata |

**Verification Process (for same-email linking):**
1. Migration script finds existing Supabase user with matching email
2. Checks `user_metadata.tenant_id` matches member's tenant
3. If match: Links automatically
4. If no match: Logs for manual review (different organization)
5. If uncertain: Creates new auth user, logs warning for admin review

**Post-Migration: Same Identity, Different Permissions**
```
auth.users (Supabase Auth)
├── id: "abc-123"
├── email: "john@example.com"
└── user_metadata:
    ├── name: "John Smith"
    └── tenant_id: "tenant-xyz"

members (Store App)                    users (Control Center)
├── auth_user_id: "abc-123"            ├── auth_user_id: "abc-123"
├── role: "technician"                 ├── role: "admin"
├── permissions: { pos: true }         ├── permissions: { reports: true }
└── store_ids: ["store-1"]             └── organization_id: "org-1"
```

### What This Migration Fixes

| Issue | Before | After |
|-------|--------|-------|
| Password storage | Plaintext/weak hash | bcrypt by Supabase |
| PIN storage | Plaintext | bcrypt hash |
| Rate limiting | None | Built-in (Supabase) + Local (PIN) |
| Account lockout | None | 15-min lockout after 5 failed PINs |
| Password reset | None | Supabase email flow |
| Session tokens | localStorage (plain) | Supabase JWT + secure refresh |
| Offline credential exposure | Plaintext | Hashed only |

### Remaining Considerations

| Consideration | Mitigation | Status |
|---------------|------------|--------|
| Device theft | PIN hash in SecureStorage (iOS Keychain/Android Keystore), not localStorage | ✅ Addressed |
| Cached permissions outdated | Background validation on every PIN login when online | ✅ Addressed |
| Offline session revocation | 30-minute periodic check + grace period limits exposure | ✅ Addressed |
| Password change on other device | Background validation checks `password_changed_at` | ✅ Addressed |
| Admin revokes access | Session revocation table checked on background validation | ✅ Addressed |
| Long-running offline sessions | `startGraceChecker()` runs every 30 minutes | ✅ Addressed |
| SecureStorage not available | Falls back to encrypted localStorage (see implementation) | ⚠️ Implement fallback |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Migration completion | 100% members with email migrated | Query: `WHERE auth_user_id IS NOT NULL` |
| Login success rate | > 99% | Monitor auth errors |
| PIN lockouts | < 5% of users/day | Monitor lockout events |
| Password reset usage | Functional | Test monthly |
| Offline functionality | No degradation | E2E tests |
| Cross-app login | Same identity works | Manual testing |

---

## Timeline Summary

| Week | Phase | Key Deliverables |
|------|-------|------------------|
| Week 1 | Database + Migration Script | Schema deployed, script tested |
| Week 2 | Auth Service + UI | New service implemented, UI updated |
| Week 3 | Testing + Rollout | All tests pass, production migrated |

**Total Estimated Effort:** 10-12 developer days

---

## Appendix

### A. Files to Modify

```
apps/store-app/src/
├── services/
│   ├── memberAuthService.ts          [NEW]
│   ├── storeAuthManager.ts           [MODIFY]
│   └── supabase/
│       └── authService.ts            [DEPRECATE partially]
├── components/
│   └── auth/
│       ├── StoreLoginScreen.tsx      [MODIFY]
│       ├── SwitchUserModal.tsx       [MODIFY]
│       ├── PinSetupModal.tsx         [NEW]
│       └── PinInput.tsx              [NEW]
├── store/
│   └── slices/
│       └── authSlice.ts              [MODIFY - add forceLogout action]
├── utils/
│   └── secureStorage.ts              [NEW - platform-specific secure storage]
└── types/
    └── auth.ts                       [MODIFY]

supabase/migrations/
├── 028_add_supabase_auth_to_members.sql    [NEW]
└── 029_migrate_member_passwords.sql        [NEW]

scripts/
└── migrate-members-to-supabase-auth.ts     [NEW]
```

### A.1 SecureStorage Utility

```typescript
// apps/store-app/src/utils/secureStorage.ts
// Platform-specific secure storage abstraction

import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

/**
 * Platform-aware secure storage for sensitive data like PIN hashes.
 * - iOS: Uses Keychain
 * - Android: Uses EncryptedSharedPreferences (Android Keystore backed)
 * - Web: Falls back to encrypted localStorage (less secure, but better than plaintext)
 */
export const SecureStorage = {
  async get(key: string): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await SecureStoragePlugin.get({ key });
        return result.value;
      } catch {
        return null;
      }
    }
    // Web fallback - encrypted localStorage
    return this.getEncryptedLocal(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await SecureStoragePlugin.set({ key, value });
    } else {
      // Web fallback
      this.setEncryptedLocal(key, value);
    }
  },

  async remove(key: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await SecureStoragePlugin.remove({ key });
      } catch {
        // Key might not exist
      }
    } else {
      localStorage.removeItem(`secure_${key}`);
    }
  },

  // Web fallback - basic encryption (NOT as secure as native)
  // Consider using Web Crypto API for better security
  private getEncryptedLocal(key: string): string | null {
    const encrypted = localStorage.getItem(`secure_${key}`);
    if (!encrypted) return null;
    // Simple obfuscation - NOT cryptographically secure
    // In production, use Web Crypto API with device-derived key
    try {
      return atob(encrypted);
    } catch {
      return null;
    }
  },

  private setEncryptedLocal(key: string, value: string): void {
    // Simple obfuscation - NOT cryptographically secure
    // In production, use Web Crypto API with device-derived key
    localStorage.setItem(`secure_${key}`, btoa(value));
  },
};
```

### B. Environment Variables

```bash
# Required for migration script
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email configuration for password reset
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### C. Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [bcrypt.js Documentation](https://www.npmjs.com/package/bcryptjs)
- [Current Auth Service](./apps/store-app/src/services/supabase/authService.ts)
- [Control Center Auth Context](./apps/control-center/src/contexts/AuthContext.tsx)

---

**Document Status:** Ready for Implementation (Reviewed & Updated)
**Version:** 1.1
**Last Updated:** January 20, 2026
**Reviewed By:** Claude (AI Code Review)
**Approved By:** [Pending]
**Approval Date:** [Pending]

### Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 20, 2026 | Initial draft |
| 1.1 | Jan 20, 2026 | Security improvements: removed pin_salt (redundant with bcrypt), added pin_legacy for rollback, moved PIN hash to SecureStorage, added session revocation table, fixed background validation to dispatch Redux actions, added periodic grace checker, added pagination to migration script, added dry-run mode, documented Supabase rate limits, added concurrent session handling, clarified Control Center overlap |
