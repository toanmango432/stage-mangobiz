# PRD: Authentication Migration - Supabase Auth for Members

## Introduction

Migrate Store App staff ("members") authentication from custom implementation to **Supabase Auth as the single identity provider** while keeping **PIN as a local/offline quick unlock mechanism**. This addresses critical security gaps (plaintext passwords, no rate limiting) and unifies identity across Store App, Control Center, and future apps.

**Reference:** `docs/AUTH_MIGRATION_PLAN.md` for full technical specification.

## Goals

- Unify staff identity across Store App, Control Center, and future apps via Supabase Auth
- Eliminate critical security vulnerabilities (plaintext PIN comparison, no rate limiting)
- Implement bcrypt hashing for PIN storage
- Add PIN rate limiting and account lockout (5 attempts, 15-min lockout)
- Maintain offline-first capability with 7-day grace period
- Enable password reset via Supabase email flow
- Support fast staff switching with PIN

## Non-Goals

- Changing the store/device pairing flow (remains custom)
- Modifying customer authentication (Online Store - already uses Supabase Auth)
- Changing Control Center auth (already uses Supabase Auth)
- Adding MFA/2FA (future enhancement)
- Migrating existing passwords to Supabase in this phase (migration script handles this)

---

## User Stories

### Phase 1: Database Schema

---

### US-001: Create migration for Supabase Auth columns on members table
**Description:** As a developer, I need the members table to support Supabase Auth linking and secure PIN storage.

**Files to modify:**
- `supabase/migrations/029_add_supabase_auth_to_members.sql` (NEW, ~60 lines)

**Acceptance Criteria:**
- [ ] Migration adds `auth_user_id UUID UNIQUE` column
- [ ] Migration adds `pin_hash TEXT` column (for bcrypt hash)
- [ ] Migration adds `pin_legacy TEXT` column (for rollback)
- [ ] Migration adds `pin_attempts INTEGER DEFAULT 0` column
- [ ] Migration adds `pin_locked_until TIMESTAMPTZ` column
- [ ] Migration adds `last_online_auth TIMESTAMPTZ` column
- [ ] Migration adds `offline_grace_period INTERVAL DEFAULT '7 days'` column
- [ ] Migration adds `password_changed_at TIMESTAMPTZ` column
- [ ] Migration creates index `idx_members_auth_user_id` on auth_user_id
- [ ] Migration adds RLS policy for members to read own profile via `auth.uid() = auth_user_id`
- [ ] Migration adds RLS policy for members to update own profile
- [ ] Migration adds column comments explaining each field
- [ ] No forbidden strings: `as any`, `void _`, `console.log`
- [ ] File follows existing migration patterns in `supabase/migrations/`

**Notes:**
- Follow pattern from `supabase/migrations/028_add_device_pairing_columns.sql`
- Do NOT add `pin_salt` - bcrypt includes salt in the hash
- Do NOT add foreign key constraint to auth.users (cross-schema)
- Schema defined in `docs/AUTH_MIGRATION_PLAN.md` lines 157-215

**Priority:** 1

---

### US-002: Create migration for session revocation table
**Description:** As a developer, I need a table to track session revocations for immediate logout across devices.

**Files to modify:**
- `supabase/migrations/030_create_member_session_revocations.sql` (NEW, ~30 lines)

**Acceptance Criteria:**
- [ ] Creates `member_session_revocations` table with columns: id, member_id, revoked_at, reason, revoke_all_before
- [ ] `id` is UUID PRIMARY KEY with default gen_random_uuid()
- [ ] `member_id` is UUID NOT NULL with REFERENCES members(id) ON DELETE CASCADE
- [ ] `revoked_at` defaults to NOW()
- [ ] `revoke_all_before` defaults to NOW()
- [ ] Creates index `idx_session_revocations_member` on member_id
- [ ] Adds table comment explaining purpose
- [ ] No forbidden strings
- [ ] File follows existing migration patterns

**Notes:**
- This table enables immediate session revocation across all devices
- Reason values: 'password_change', 'admin_revoke', 'security_concern'
- Schema defined in `docs/AUTH_MIGRATION_PLAN.md` lines 204-215

**Priority:** 2

---

### Phase 2: Migration Script

---

### US-003: Create migration script utilities
**Description:** As a developer, I need utility functions for the migration script (password generation, email templates).

**Files to modify:**
- `scripts/auth-migration/utils.ts` (NEW, ~80 lines)

**Acceptance Criteria:**
- [ ] Exports `generateTemporaryPassword()` that returns 12-char alphanumeric string
- [ ] Exports `sendWelcomeEmail(email, name, tempPassword)` that logs to console (stub for now)
- [ ] Exports `MigrationResult` interface with success, failed, skipped, emailFailed arrays
- [ ] Password generator uses crypto.randomBytes for security
- [ ] No forbidden strings: `as any`, `void _`
- [ ] pnpm run typecheck passes

**Notes:**
- Email sending is stubbed - will be implemented when SMTP is configured
- Password must include uppercase, lowercase, and numbers
- In production, replace console.log with actual email service (SendGrid, etc.)

**Priority:** 3

---

### US-004: Create member migration script
**Description:** As a developer, I need a script to migrate existing members to Supabase Auth.

**Files to modify:**
- `scripts/auth-migration/migrate-members-to-supabase-auth.ts` (NEW, ~250 lines)

**Acceptance Criteria:**
- [ ] Script reads `DRY_RUN` env var to preview without changes
- [ ] Script uses `BATCH_SIZE = 50` for pagination
- [ ] Script uses `supabaseAdmin.auth.admin.getUserByEmail()` for efficient lookup (NOT listUsers)
- [ ] Script creates new Supabase Auth user if email not found
- [ ] Script links to existing auth user if email already exists (Control Center case)
- [ ] Script hashes existing PIN with bcrypt (cost factor 12)
- [ ] Script preserves original PIN in `pin_legacy` column for rollback
- [ ] Script clears `pin` column after hashing
- [ ] Script has retry logic for email sending (3 attempts, exponential backoff)
- [ ] Script logs failures to `migration_email_failures.json` with restricted permissions
- [ ] Script prints summary at end (success, failed, skipped, email failures)
- [ ] No forbidden strings: `as any` (except for Supabase types if necessary)
- [ ] pnpm run typecheck passes

**Notes:**
- Run with: `DRY_RUN=true npx ts-node scripts/auth-migration/migrate-members-to-supabase-auth.ts`
- Requires `SUPABASE_SERVICE_ROLE_KEY` env var
- Full implementation in `docs/AUTH_MIGRATION_PLAN.md` lines 269-519
- Install bcryptjs: `pnpm add bcryptjs && pnpm add -D @types/bcryptjs`

**Priority:** 4

---

### Phase 3: Auth Service - Core

---

### US-005: Create SecureStorage utility for PIN hash storage
**Description:** As a developer, I need a platform-aware secure storage utility to store PIN hashes securely.

**Files to modify:**
- `apps/store-app/src/utils/secureStorage.ts` (NEW, ~70 lines)

**Acceptance Criteria:**
- [ ] Exports `SecureStorage` object with `get(key)`, `set(key, value)`, `remove(key)` methods
- [ ] Uses `@capacitor/core` to detect native platform
- [ ] On native platforms, uses `capacitor-secure-storage-plugin` for iOS Keychain / Android Keystore
- [ ] On web, falls back to base64-encoded localStorage (basic obfuscation)
- [ ] All methods are async and return Promises
- [ ] Handles errors gracefully (returns null on get failure)
- [ ] No forbidden strings: `as any`, `void _`, `console.log` (except error logging)
- [ ] pnpm run typecheck passes

**Notes:**
- Install plugin: `pnpm add capacitor-secure-storage-plugin`
- Web fallback uses btoa/atob - NOT cryptographically secure, but better than plaintext
- Full implementation in `docs/AUTH_MIGRATION_PLAN.md` lines 1268-1335
- For web, prefix keys with `secure_` in localStorage

**Priority:** 5

---

### US-006: Add forceLogout action to authSlice
**Description:** As a developer, I need a Redux action to force logout with a reason message.

**Files to modify:**
- `apps/store-app/src/store/slices/authSlice.ts` (~30 lines to add)

**Acceptance Criteria:**
- [ ] Adds `ForceLogoutPayload` interface with `reason` and `message` fields
- [ ] Adds `forceLogout` reducer action that clears all auth state
- [ ] Adds `forceLogoutReason` and `forceLogoutMessage` to AuthState
- [ ] `forceLogout` sets these fields before clearing state
- [ ] Exports `selectForceLogoutReason` and `selectForceLogoutMessage` selectors
- [ ] Exports `forceLogout` action
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Existing tests still pass: `pnpm test -- authSlice`

**Notes:**
- Reason values: 'offline_grace_expired', 'account_deactivated', 'password_changed', 'session_revoked'
- This action is dispatched by memberAuthService when background validation fails
- Follow existing reducer patterns in authSlice.ts

**Priority:** 6

---

### US-007: Create MemberAuthSession types
**Description:** As a developer, I need TypeScript interfaces for the new member auth session.

**Files to modify:**
- `apps/store-app/src/types/memberAuth.ts` (NEW, ~50 lines)

**Acceptance Criteria:**
- [ ] Exports `MemberAuthSession` interface with: memberId, authUserId, email, name, role, storeIds, permissions, lastOnlineAuth, sessionCreatedAt
- [ ] Exports `PinLockoutInfo` interface with: isLocked, remainingMinutes
- [ ] Exports `GraceInfo` interface with: isValid, daysRemaining
- [ ] Exports `ForceLogoutReason` type union: 'offline_grace_expired' | 'account_deactivated' | 'password_changed' | 'session_revoked'
- [ ] All fields have JSDoc comments
- [ ] No `pinHash` field in MemberAuthSession (stored separately in SecureStorage)
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes

**Notes:**
- Types defined in `docs/AUTH_MIGRATION_PLAN.md` lines 559-570
- Keep types separate from implementation for clean imports

**Priority:** 7

---

### US-008: Create memberAuthService - Supabase password login
**Description:** As a developer, I need the password login function for the new auth service.

**Files to modify:**
- `apps/store-app/src/services/memberAuthService.ts` (NEW, ~120 lines for this story)

**Acceptance Criteria:**
- [ ] Creates new file with imports from supabase client, bcryptjs, SecureStorage
- [ ] Defines constants: PIN_MAX_ATTEMPTS=5, PIN_LOCKOUT_MINUTES=15, OFFLINE_GRACE_DAYS=7
- [ ] Exports `loginWithPassword(email, password)` async function
- [ ] Function calls `supabase.auth.signInWithPassword()`
- [ ] Function fetches linked member by `auth_user_id`
- [ ] Function updates `last_online_auth` timestamp in database
- [ ] Function creates `MemberAuthSession` object (WITHOUT pinHash)
- [ ] Function caches session in localStorage via `cacheMemberSession()`
- [ ] Function stores PIN hash in SecureStorage if member has one
- [ ] Function throws Error with descriptive message on failure
- [ ] No forbidden strings: `as any`, `void _`, `'Test Client'`
- [ ] pnpm run typecheck passes

**Notes:**
- This is the FIRST part of memberAuthService - more functions in subsequent stories
- Follow error handling pattern from existing `authService.ts`
- Do NOT store pinHash in the session object - store in SecureStorage only
- Implementation reference: `docs/AUTH_MIGRATION_PLAN.md` lines 579-648

**Priority:** 8

---

### US-009: Create memberAuthService - PIN login
**Description:** As a developer, I need the PIN login function for offline-capable quick access.

**Files to modify:**
- `apps/store-app/src/services/memberAuthService.ts` (~100 lines to add)

**Acceptance Criteria:**
- [ ] Exports `loginWithPin(memberId, pin)` async function
- [ ] Function gets cached member from localStorage
- [ ] Function checks PIN lockout via helper function
- [ ] Function checks offline grace period via helper function
- [ ] Function gets PIN hash from SecureStorage (NOT from session object)
- [ ] Function validates PIN using `bcrypt.compare(pin, pinHash)`
- [ ] Function records failed attempts and locks after 5 failures
- [ ] Function clears failed attempts on success
- [ ] Function triggers background validation if online
- [ ] Function returns MemberAuthSession on success
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes

**Notes:**
- PIN hash retrieved from SecureStorage, not session
- Must check lockout BEFORE grace period (fail fast)
- Implementation reference: `docs/AUTH_MIGRATION_PLAN.md` lines 651-709

**Priority:** 9

---

### US-010: Create memberAuthService - PIN management
**Description:** As a developer, I need functions to set/update PIN and manage PIN lockout.

**Files to modify:**
- `apps/store-app/src/services/memberAuthService.ts` (~80 lines to add)

**Acceptance Criteria:**
- [ ] Exports `setPin(memberId, newPin)` async function
- [ ] `setPin` validates PIN format (4-6 digits only)
- [ ] `setPin` hashes PIN with bcrypt (cost factor 12)
- [ ] `setPin` updates database and SecureStorage
- [ ] Adds private `checkPinLockout(memberId)` function returning PinLockoutInfo
- [ ] Adds private `recordFailedPinAttempt(memberId)` function
- [ ] Adds private `clearFailedAttempts(memberId)` function
- [ ] Adds private `lockPin(memberId)` function
- [ ] Lockout info stored in localStorage with keys `pin_lockout_{memberId}`, `pin_attempts_{memberId}`
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes

**Notes:**
- PIN validation regex: `/^\d{4,6}$/`
- bcrypt cost factor 12 provides good security/performance balance
- Implementation reference: `docs/AUTH_MIGRATION_PLAN.md` lines 712-873

**Priority:** 10

---

### US-011: Create memberAuthService - grace period checker
**Description:** As a developer, I need a periodic checker that forces logout when offline grace expires.

**Files to modify:**
- `apps/store-app/src/services/memberAuthService.ts` (~60 lines to add)

**Acceptance Criteria:**
- [ ] Defines constant `GRACE_CHECK_INTERVAL_MS = 30 * 60 * 1000` (30 minutes)
- [ ] Adds module-level `graceCheckInterval` variable to track interval
- [ ] Exports `startGraceChecker()` function that starts setInterval
- [ ] Exports `stopGraceChecker()` function that clears interval
- [ ] Exports `checkOfflineGrace(member)` function returning GraceInfo
- [ ] Grace checker gets current member from Redux store
- [ ] Grace checker dispatches `forceLogout` if grace expired while offline
- [ ] Grace checker is idempotent (doesn't start multiple intervals)
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes

**Notes:**
- Import store directly: `import { store } from '@/store'`
- Check `navigator.onLine` to determine if offline
- Implementation reference: `docs/AUTH_MIGRATION_PLAN.md` lines 779-815

**Priority:** 11

---

### US-012: Create memberAuthService - background validation
**Description:** As a developer, I need background validation that checks session validity and dispatches logout if invalid.

**Files to modify:**
- `apps/store-app/src/services/memberAuthService.ts` (~80 lines to add)

**Acceptance Criteria:**
- [ ] Adds private `validateSessionInBackground(member)` async function
- [ ] Function checks if member is still active in database
- [ ] Function checks `password_changed_at` against `session.sessionCreatedAt`
- [ ] Function checks `member_session_revocations` table for revocations
- [ ] Function dispatches `forceLogout` with appropriate reason if invalid
- [ ] Function updates cached session `lastOnlineAuth` on success
- [ ] Function catches network errors silently (doesn't logout on network failure)
- [ ] Exports `logout()` function that stops grace checker and signs out of Supabase
- [ ] Exports complete `memberAuthService` object with all functions
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes

**Notes:**
- This completes the memberAuthService file
- Background validation is called on every PIN login when online
- Implementation reference: `docs/AUTH_MIGRATION_PLAN.md` lines 876-942

**Priority:** 12

---

### Phase 4: UI Components

---

### US-013: Create PinInput component
**Description:** As a user, I need a PIN input field with proper masking and digit display.

**Files to modify:**
- `apps/store-app/src/components/auth/PinInput.tsx` (NEW, ~100 lines)

**Acceptance Criteria:**
- [ ] Accepts props: `value`, `onChange`, `length` (default 4), `disabled`, `error`, `autoFocus`
- [ ] Renders hidden input for actual value capture
- [ ] Renders visual dots/circles for each digit position
- [ ] Filled positions show filled circle, empty show outline
- [ ] Supports keyboard input (numbers only)
- [ ] Supports backspace to delete
- [ ] Calls onChange with new value on each keystroke
- [ ] Shows error state with red border when `error` prop is true
- [ ] Uses Tailwind classes, follows design system
- [ ] No forbidden strings: `as any`, `void _`, `'1234'`
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Follow pattern from existing input components in `src/components/ui/`
- Use `type="password"` with `inputMode="numeric"` for mobile keyboard
- Common PIN input pattern - 4-6 circles that fill as user types

**Priority:** 13

---

### US-014: Create PinSetupModal component
**Description:** As a user, I need a modal to set up my PIN after first login.

**Files to modify:**
- `apps/store-app/src/components/auth/PinSetupModal.tsx` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Accepts props: `isOpen`, `onClose`, `onSubmit`, `memberId`, `memberName`
- [ ] Shows two-step flow: Enter PIN, Confirm PIN
- [ ] Uses PinInput component for both steps
- [ ] Validates PIN is 4-6 digits
- [ ] Validates confirmation matches original
- [ ] Shows error message if PINs don't match
- [ ] Calls `memberAuthService.setPin()` on successful confirmation
- [ ] Shows loading state during submission
- [ ] Shows success message and closes on completion
- [ ] Cannot be dismissed without setting PIN (no close button on first setup)
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Use Dialog component from `@/components/ui/dialog`
- Follow modal patterns from existing modals like `EditTicketModal`
- Add "Skip for now" only if PIN is optional (check with product)

**Priority:** 14

---

### US-015: Update StoreLoginScreen for email/password login
**Description:** As a user, I want to login with email and password instead of store login ID.

**Files to modify:**
- `apps/store-app/src/components/auth/StoreLoginScreen.tsx` (~80 lines to change)

**Acceptance Criteria:**
- [ ] Replaces "Store Login ID" field with "Email" field
- [ ] Keeps "Password" field
- [ ] Adds "Forgot Password?" link below password field
- [ ] Updates form submission to call `memberAuthService.loginWithPassword()`
- [ ] On successful login without PIN, shows PinSetupModal
- [ ] On successful login with PIN, proceeds to PIN entry or main app
- [ ] Shows loading state during login
- [ ] Shows error messages from auth service
- [ ] Handles offline state (show "Please connect to internet for first login")
- [ ] No forbidden strings: `as any`, `'Test'`, `'demo123'`
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Read current implementation first to understand structure
- Keep store-level login as fallback option (small link at bottom)
- "Forgot Password?" opens Supabase password reset flow

**Priority:** 15

---

### US-016: Update SwitchUserModal for cached members with PIN
**Description:** As a user, I want to quickly switch between cached members using PIN.

**Files to modify:**
- `apps/store-app/src/components/auth/SwitchUserModal.tsx` (~100 lines to change, or NEW if doesn't exist)

**Acceptance Criteria:**
- [ ] Shows list of cached members from `memberAuthService.getCachedMembers()`
- [ ] Each member shows avatar, name, and role
- [ ] Selecting a member shows PinInput for that member
- [ ] Validates PIN via `memberAuthService.loginWithPin()`
- [ ] Shows lockout message if member's PIN is locked
- [ ] Shows "Login with password" option for full re-auth
- [ ] Updates Redux state on successful switch
- [ ] Shows grace period warning if < 2 days remaining
- [ ] No forbidden strings: `as any`, `'Test Client'`
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- If file doesn't exist, create it following modal patterns
- Cached members may have expired grace - handle gracefully
- Show offline indicator if not connected

**Priority:** 16

---

### US-017: Create OfflineGraceIndicator component
**Description:** As a user, I want to see how many days of offline access I have remaining.

**Files to modify:**
- `apps/store-app/src/components/auth/OfflineGraceIndicator.tsx` (NEW, ~60 lines)

**Acceptance Criteria:**
- [ ] Accepts props: `daysRemaining`, `isOffline`
- [ ] Shows nothing when online and grace > 5 days
- [ ] Shows yellow warning when offline or grace <= 5 days
- [ ] Shows red critical when grace <= 2 days
- [ ] Displays "X days offline access remaining" message
- [ ] Displays "Offline - connect to extend access" when offline
- [ ] Uses appropriate icons (wifi-off, clock, warning)
- [ ] Positioned as small banner or badge
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Use design tokens for colors
- Keep minimal - shouldn't distract from main UI
- Could be placed in header or status bar area

**Priority:** 17

---

### Phase 5: Integration

---

### US-018: Integrate memberAuthService with storeAuthManager
**Description:** As a developer, I need to wire up the new memberAuthService to the existing auth flow.

**Files to modify:**
- `apps/store-app/src/services/storeAuthManager.ts` (if exists, ~50 lines to change)
- `apps/store-app/src/providers/AuthProvider.tsx` (if exists, ~30 lines to change)

**Acceptance Criteria:**
- [ ] App initialization checks for cached member session
- [ ] If cached session exists and grace valid, allow PIN login
- [ ] If cached session exists but grace expired, require password login
- [ ] Grace checker starts on successful login
- [ ] Grace checker stops on logout
- [ ] Force logout action shows appropriate message to user
- [ ] Existing store-level auth still works as fallback
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify full login flow in browser using Playwright MCP

**Notes:**
- This story integrates previous work - test the full flow
- May need to modify App.tsx or main router
- Ensure backward compatibility with existing sessions

**Priority:** 18

---

### US-019: Implement Forgot Password flow
**Description:** As a user, I want to reset my password via email.

**Files to modify:**
- `apps/store-app/src/components/auth/ForgotPasswordModal.tsx` (NEW, ~80 lines)
- `apps/store-app/src/components/auth/StoreLoginScreen.tsx` (~10 lines to add)

**Acceptance Criteria:**
- [ ] Creates ForgotPasswordModal with email input
- [ ] Modal calls `supabase.auth.resetPasswordForEmail()`
- [ ] Shows success message: "Check your email for reset link"
- [ ] Shows error if email not found
- [ ] Adds "Forgot Password?" link to StoreLoginScreen that opens modal
- [ ] Link only visible when online
- [ ] No forbidden strings
- [ ] pnpm run typecheck passes
- [ ] Verify in browser using Playwright MCP

**Notes:**
- Supabase handles the actual password reset flow
- User clicks link in email -> Supabase reset page -> redirected back
- May need to configure redirect URL in Supabase dashboard

**Priority:** 19

---

### Phase 6: Testing

---

### US-020: Add unit tests for memberAuthService
**Description:** As a developer, I need unit tests for the new memberAuthService.

**Files to modify:**
- `apps/store-app/src/services/__tests__/memberAuthService.test.ts` (NEW, ~200 lines)

**Acceptance Criteria:**
- [ ] Tests `loginWithPassword` success case
- [ ] Tests `loginWithPassword` invalid credentials case
- [ ] Tests `loginWithPin` success case
- [ ] Tests `loginWithPin` with invalid PIN
- [ ] Tests `loginWithPin` lockout after 5 failures
- [ ] Tests `loginWithPin` lockout expiry
- [ ] Tests `setPin` validation (4-6 digits)
- [ ] Tests `checkOfflineGrace` with valid and expired cases
- [ ] Mocks Supabase client and SecureStorage
- [ ] All tests pass: `pnpm test -- memberAuthService`
- [ ] No forbidden strings

**Notes:**
- Use vitest for testing (project standard)
- Mock SecureStorage and Supabase
- Follow test patterns in `src/store/slices/__tests__/`

**Priority:** 20

---

### US-021: Add integration tests for auth flow
**Description:** As a developer, I need E2E tests for the complete authentication flow.

**Files to modify:**
- `apps/store-app/e2e/auth-flow.spec.ts` (NEW, ~150 lines)

**Acceptance Criteria:**
- [ ] Tests email/password login flow
- [ ] Tests PIN setup after first login
- [ ] Tests PIN login for returning user
- [ ] Tests fast staff switching
- [ ] Tests PIN lockout and recovery
- [ ] Tests offline grace period warning display
- [ ] Tests forgot password link visibility
- [ ] Uses Playwright for browser automation
- [ ] All tests pass: `pnpm test:e2e -- auth-flow`
- [ ] No forbidden strings

**Notes:**
- May need test fixtures for member data
- Consider using Supabase test environment
- Follow E2E patterns if they exist in project

**Priority:** 21

---

## Functional Requirements

| ID | Story | Requirement |
|----|-------|-------------|
| FR-1 | US-001 | Members table supports Supabase Auth linking via `auth_user_id` |
| FR-2 | US-001 | PIN stored as bcrypt hash in `pin_hash` column |
| FR-3 | US-002 | Session revocations tracked in dedicated table |
| FR-4 | US-004 | Existing members can be migrated to Supabase Auth |
| FR-5 | US-005 | PIN hash stored in platform-secure storage (Keychain/Keystore) |
| FR-6 | US-008 | Members can login with email/password via Supabase Auth |
| FR-7 | US-009 | Members can quick-login with PIN (offline capable) |
| FR-8 | US-010 | PIN locked after 5 failed attempts for 15 minutes |
| FR-9 | US-011 | Offline access expires after 7 days without online auth |
| FR-10 | US-012 | Sessions invalidated when password changed or admin revokes |
| FR-11 | US-014 | New users prompted to set PIN on first login |
| FR-12 | US-016 | Staff can switch users via PIN without full re-auth |
| FR-13 | US-019 | Users can reset password via email |

---

## Technical Considerations

### Existing Patterns to Follow
- Redux slice patterns: `apps/store-app/src/store/slices/authSlice.ts`
- Modal patterns: `apps/store-app/src/components/tickets/EditTicketModal.tsx`
- Migration patterns: `supabase/migrations/028_add_device_pairing_columns.sql`
- Service patterns: `apps/store-app/src/services/supabase/authService.ts`

### Files to Modify (Summary)
| File | Lines | Action |
|------|-------|--------|
| `supabase/migrations/029_*.sql` | ~60 | NEW |
| `supabase/migrations/030_*.sql` | ~30 | NEW |
| `scripts/auth-migration/utils.ts` | ~80 | NEW |
| `scripts/auth-migration/migrate-members-to-supabase-auth.ts` | ~250 | NEW |
| `apps/store-app/src/utils/secureStorage.ts` | ~70 | NEW |
| `apps/store-app/src/store/slices/authSlice.ts` | 348 + ~30 | MODIFY |
| `apps/store-app/src/types/memberAuth.ts` | ~50 | NEW |
| `apps/store-app/src/services/memberAuthService.ts` | ~450 | NEW |
| `apps/store-app/src/components/auth/PinInput.tsx` | ~100 | NEW |
| `apps/store-app/src/components/auth/PinSetupModal.tsx` | ~150 | NEW |
| `apps/store-app/src/components/auth/StoreLoginScreen.tsx` | existing + ~80 | MODIFY |
| `apps/store-app/src/components/auth/SwitchUserModal.tsx` | ~100 | NEW/MODIFY |
| `apps/store-app/src/components/auth/OfflineGraceIndicator.tsx` | ~60 | NEW |
| `apps/store-app/src/components/auth/ForgotPasswordModal.tsx` | ~80 | NEW |

### Dependencies to Add
```bash
pnpm add bcryptjs capacitor-secure-storage-plugin
pnpm add -D @types/bcryptjs
```

### Potential Risks
1. **Large authService.ts (964 lines)** - New memberAuthService is separate, old service deprecated gradually
2. **Migration script** - Must run in production with care; dry-run mode essential
3. **Offline scenarios** - Thorough testing needed for grace period edge cases
4. **Capacitor plugins** - Test on actual iOS/Android devices

---

## Open Questions

1. Should PIN setup be mandatory or optional for first login?
2. What's the email template for welcome emails during migration?
3. Should we show "Login as different store" option for multi-tenant scenarios?
4. How do we handle members without email addresses in migration?

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Migration completion | 100% members with email migrated |
| Login success rate | > 99% |
| PIN lockouts per day | < 5% of active users |
| Test coverage | > 80% for new auth code |
| Offline functionality | No degradation |

---

**Document Status:** Ready for Ralph
**Created:** January 20, 2026
**Based on:** `docs/AUTH_MIGRATION_PLAN.md` v1.1
