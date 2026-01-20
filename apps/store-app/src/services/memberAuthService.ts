/**
 * Member Authentication Service
 *
 * Handles member authentication using Supabase Auth as the identity provider.
 * Supports both online (password) and offline (PIN) login methods.
 *
 * Security Architecture:
 * - Password login: Supabase Auth handles credential verification
 * - PIN login: bcrypt hash stored in SecureStorage, NOT in session object
 * - Session caching: Member profile cached in localStorage for offline access
 * - Grace period: 7 days offline access before requiring re-authentication
 *
 * @see docs/AUTH_MIGRATION_PLAN.md
 */

import { supabase } from './supabase/client';
import bcrypt from 'bcryptjs';
import { SecureStorage } from '@/utils/secureStorage';
import { store } from '@/store';
import { forceLogout } from '@/store/slices/authSlice';
import type {
  MemberAuthSession,
  PinLockoutInfo,
  GraceInfo,
} from '@/types/memberAuth';

// ==================== CONSTANTS ====================

/** Maximum PIN attempts before lockout */
export const PIN_MAX_ATTEMPTS = 5;

/** Lockout duration in minutes */
export const PIN_LOCKOUT_MINUTES = 15;

/** Default offline grace period in days */
export const OFFLINE_GRACE_DAYS = 7;

/** Grace period check interval in milliseconds (30 minutes) */
export const GRACE_CHECK_INTERVAL_MS = 30 * 60 * 1000;

// ==================== MODULE STATE ====================

/** Grace checker interval reference (for idempotent start/stop) */
let graceCheckInterval: ReturnType<typeof setInterval> | null = null;

// ==================== SESSION STORAGE KEYS ====================

const MEMBER_SESSION_CACHE_KEY = 'member_auth_session';
const MEMBER_CACHE_TIMESTAMP_KEY = 'member_auth_session_timestamp';
const CACHED_MEMBERS_KEY = 'cached_members_list';

// ==================== SESSION CACHE HELPERS ====================

/**
 * Cache member session profile for offline access
 */
function cacheMemberSession(session: MemberAuthSession): void {
  localStorage.setItem(MEMBER_SESSION_CACHE_KEY, JSON.stringify(session));
  localStorage.setItem(MEMBER_CACHE_TIMESTAMP_KEY, Date.now().toString());

  // Also add to cached members list for PIN selection
  const cachedMembers = getCachedMembers();
  const existingIndex = cachedMembers.findIndex(m => m.memberId === session.memberId);

  if (existingIndex >= 0) {
    cachedMembers[existingIndex] = session;
  } else {
    cachedMembers.push(session);
  }

  localStorage.setItem(CACHED_MEMBERS_KEY, JSON.stringify(cachedMembers));
}

/**
 * Get cached member session
 */
function getCachedMemberSession(): MemberAuthSession | null {
  const data = localStorage.getItem(MEMBER_SESSION_CACHE_KEY);
  if (!data) return null;

  try {
    const session = JSON.parse(data);
    // Restore Date objects
    return {
      ...session,
      lastOnlineAuth: new Date(session.lastOnlineAuth),
      sessionCreatedAt: new Date(session.sessionCreatedAt),
    };
  } catch {
    return null;
  }
}

/**
 * Get all cached members for PIN selection
 */
function getCachedMembers(): MemberAuthSession[] {
  const data = localStorage.getItem(CACHED_MEMBERS_KEY);
  if (!data) return [];

  try {
    const members = JSON.parse(data);
    return members.map((m: MemberAuthSession) => ({
      ...m,
      lastOnlineAuth: new Date(m.lastOnlineAuth),
      sessionCreatedAt: new Date(m.sessionCreatedAt),
    }));
  } catch {
    return [];
  }
}

/**
 * Clear cached member session
 */
function clearCachedMemberSession(): void {
  localStorage.removeItem(MEMBER_SESSION_CACHE_KEY);
  localStorage.removeItem(MEMBER_CACHE_TIMESTAMP_KEY);
}

// ==================== LOGIN FUNCTIONS ====================

/**
 * Login with email and password using Supabase Auth
 *
 * This function:
 * 1. Authenticates with Supabase Auth
 * 2. Fetches the linked member record by auth_user_id
 * 3. Updates last_online_auth timestamp
 * 4. Creates MemberAuthSession (WITHOUT pinHash)
 * 5. Caches session for offline access
 * 6. Stores PIN hash in SecureStorage (if member has one)
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns MemberAuthSession on success
 * @throws Error with descriptive message on failure
 */
async function loginWithPassword(email: string, password: string): Promise<MemberAuthSession> {
  // 1. Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    // Map Supabase auth errors to user-friendly messages
    if (authError.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password');
    }
    if (authError.message.includes('Email not confirmed')) {
      throw new Error('Please verify your email address before logging in');
    }
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Authentication failed - no user returned');
  }

  // 2. Fetch linked member record by auth_user_id
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('auth_user_id', authData.user.id)
    .single();

  if (memberError) {
    // If member not found, sign out of Supabase Auth to clean up
    await supabase.auth.signOut();
    throw new Error('No member profile linked to this account. Please contact your administrator.');
  }

  if (!member) {
    await supabase.auth.signOut();
    throw new Error('Member profile not found');
  }

  // 3. Check member status
  if (member.status !== 'active') {
    await supabase.auth.signOut();
    throw new Error('Your account has been deactivated. Please contact your administrator.');
  }

  // 4. Update last_online_auth timestamp
  const now = new Date();
  const { error: updateError } = await supabase
    .from('members')
    .update({ last_online_auth: now.toISOString() })
    .eq('id', member.id);

  if (updateError) {
    console.error('Failed to update last_online_auth:', updateError);
    // Non-fatal - continue with login
  }

  // 5. Create session object (WITHOUT pinHash - stored separately in SecureStorage)
  const session: MemberAuthSession = {
    memberId: member.id,
    authUserId: authData.user.id,
    email: member.email,
    name: member.name || '',
    role: member.role || 'staff',
    storeIds: member.store_ids || [],
    permissions: member.permissions || {},
    lastOnlineAuth: now,
    sessionCreatedAt: now,
    defaultStoreId: member.default_store_id || null,
  };

  // 6. Cache session for offline access
  cacheMemberSession(session);

  // 7. Store PIN hash in SecureStorage if member has one
  if (member.pin_hash) {
    await SecureStorage.set(`pin_hash_${member.id}`, member.pin_hash);
  }

  return session;
}

// ==================== PIN LOCKOUT HELPERS (PLACEHOLDER) ====================

/**
 * Check if member's PIN is locked
 * @param memberId - Member ID to check
 * @returns PinLockoutInfo with lock status and remaining minutes
 */
function checkPinLockout(memberId: string): PinLockoutInfo {
  const lockoutKey = `pin_lockout_${memberId}`;
  const lockoutUntil = localStorage.getItem(lockoutKey);

  if (!lockoutUntil) {
    return { isLocked: false, remainingMinutes: 0 };
  }

  const lockoutTime = parseInt(lockoutUntil, 10);
  const now = Date.now();

  if (now >= lockoutTime) {
    // Lockout expired - clear it
    localStorage.removeItem(lockoutKey);
    localStorage.removeItem(`pin_attempts_${memberId}`);
    return { isLocked: false, remainingMinutes: 0 };
  }

  const remainingMs = lockoutTime - now;
  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

  return { isLocked: true, remainingMinutes };
}

// ==================== GRACE PERIOD HELPERS ====================

/**
 * Check offline grace period status
 * @param member - Member session to check
 * @returns GraceInfo with validity and days remaining
 */
function checkOfflineGrace(member: MemberAuthSession): GraceInfo {
  const lastOnlineAuth = member.lastOnlineAuth;
  const gracePeriodMs = OFFLINE_GRACE_DAYS * 24 * 60 * 60 * 1000;
  const graceExpiresAt = new Date(lastOnlineAuth.getTime() + gracePeriodMs);
  const now = new Date();

  const msRemaining = graceExpiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

  return {
    isValid: msRemaining > 0,
    daysRemaining,
  };
}

// ==================== GRACE PERIOD CHECKER ====================

/**
 * Start periodic grace period checker
 *
 * Runs every 30 minutes to check if the offline grace period has expired.
 * If expired while offline, dispatches forceLogout action to clear auth state.
 *
 * The checker is idempotent - calling startGraceChecker() multiple times
 * will not create multiple intervals.
 */
function startGraceChecker(): void {
  // Already running - don't start another
  if (graceCheckInterval) {
    return;
  }

  graceCheckInterval = setInterval(() => {
    // Get current member from Redux store
    const authState = store.getState().auth;
    const currentMemberId = authState.member?.memberId;

    // No member logged in - nothing to check
    if (!currentMemberId) {
      return;
    }

    // Get cached member session
    const cachedMembers = getCachedMembers();
    const member = cachedMembers.find(m => m.memberId === currentMemberId);

    if (!member) {
      return;
    }

    // Check grace period
    const graceInfo = checkOfflineGrace(member);

    // Only force logout if grace expired AND we're offline
    // (If online, the user can re-authenticate automatically)
    if (!graceInfo.isValid && !navigator.onLine) {
      // Dispatch force logout with reason
      store.dispatch(forceLogout({
        reason: 'offline_grace_expired',
        message: 'Your offline access has expired. Please connect to the internet to continue.',
      }));

      // Stop the checker (no need to keep checking after logout)
      stopGraceChecker();
    }
  }, GRACE_CHECK_INTERVAL_MS);
}

/**
 * Stop the grace period checker
 *
 * Should be called on logout to clean up the interval.
 */
function stopGraceChecker(): void {
  if (graceCheckInterval) {
    clearInterval(graceCheckInterval);
    graceCheckInterval = null;
  }
}

// ==================== PIN MANAGEMENT ====================

/** bcrypt cost factor for PIN hashing - 12 provides good security/performance balance */
const BCRYPT_COST_FACTOR = 12;

/** PIN format validation regex - 4-6 digits only */
const PIN_FORMAT_REGEX = /^\d{4,6}$/;

/**
 * Validate PIN format
 * @param pin - PIN to validate
 * @returns true if valid format (4-6 digits)
 */
function isValidPinFormat(pin: string): boolean {
  return PIN_FORMAT_REGEX.test(pin);
}

/**
 * Set or update a member's PIN
 *
 * This function:
 * 1. Validates PIN format (4-6 digits only)
 * 2. Hashes PIN with bcrypt (cost factor 12)
 * 3. Updates PIN hash in database
 * 4. Updates PIN hash in SecureStorage for offline access
 *
 * @param memberId - Member ID to set PIN for
 * @param newPin - New PIN (4-6 digits)
 * @throws Error if PIN format is invalid or database update fails
 */
async function setPin(memberId: string, newPin: string): Promise<void> {
  // 1. Validate PIN format
  if (!isValidPinFormat(newPin)) {
    throw new Error('PIN must be 4-6 digits');
  }

  // 2. Hash PIN with bcrypt
  const pinHash = await bcrypt.hash(newPin, BCRYPT_COST_FACTOR);

  // 3. Update PIN hash in database
  const { error: updateError } = await supabase
    .from('members')
    .update({ pin_hash: pinHash })
    .eq('id', memberId);

  if (updateError) {
    console.error('Failed to update PIN hash in database:', updateError);
    throw new Error('Failed to update PIN. Please try again.');
  }

  // 4. Update PIN hash in SecureStorage for offline access
  await SecureStorage.set(`pin_hash_${memberId}`, pinHash);
}

/**
 * Remove a member's PIN
 *
 * This function:
 * 1. Clears PIN hash from database (sets to null)
 * 2. Removes PIN hash from SecureStorage
 *
 * @param memberId - Member ID to remove PIN for
 * @throws Error if database update fails
 */
async function removePin(memberId: string): Promise<void> {
  // 1. Clear PIN hash in database
  const { error: updateError } = await supabase
    .from('members')
    .update({ pin_hash: null })
    .eq('id', memberId);

  if (updateError) {
    console.error('Failed to remove PIN hash from database:', updateError);
    throw new Error('Failed to remove PIN. Please try again.');
  }

  // 2. Remove PIN hash from SecureStorage
  await SecureStorage.remove(`pin_hash_${memberId}`);

  // 3. Clear any lockout state
  localStorage.removeItem(`pin_lockout_${memberId}`);
  localStorage.removeItem(`pin_attempts_${memberId}`);
}

/**
 * Check if a member has a PIN configured
 *
 * @param memberId - Member ID to check
 * @returns true if PIN is configured
 */
async function hasPin(memberId: string): Promise<boolean> {
  const pinHash = await SecureStorage.get(`pin_hash_${memberId}`);
  return pinHash !== null;
}

// ==================== DEFAULT STORE PREFERENCE ====================

/** Storage key prefix for cached default store preference (offline support) */
const DEFAULT_STORE_CACHE_PREFIX = 'member_default_store_';

/**
 * Get a member's default store ID
 *
 * This function:
 * 1. If online, fetches from database and updates cache
 * 2. If offline, returns cached value from localStorage
 *
 * @param memberId - Member ID to get default store for
 * @returns Store ID or null if no default is set
 */
async function getDefaultStore(memberId: string): Promise<string | null> {
  // If online, try to fetch from database
  if (navigator.onLine) {
    try {
      const { data: member, error } = await supabase
        .from('members')
        .select('default_store_id')
        .eq('id', memberId)
        .single();

      if (error) {
        console.error('Failed to fetch default store from database:', error);
        // Fall back to cached value
      } else if (member) {
        const defaultStoreId = member.default_store_id || null;
        // Update cache for offline access
        if (defaultStoreId) {
          localStorage.setItem(`${DEFAULT_STORE_CACHE_PREFIX}${memberId}`, defaultStoreId);
        } else {
          localStorage.removeItem(`${DEFAULT_STORE_CACHE_PREFIX}${memberId}`);
        }
        return defaultStoreId;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Unexpected error fetching default store:', errorMessage);
      // Fall back to cached value
    }
  }

  // Offline or error - return cached value
  return localStorage.getItem(`${DEFAULT_STORE_CACHE_PREFIX}${memberId}`);
}

/**
 * Set a member's default store
 *
 * This function:
 * 1. Updates the database (if online)
 * 2. Updates the local cache
 * 3. Updates the cached member session
 *
 * @param memberId - Member ID to set default store for
 * @param storeId - Store ID to set as default
 * @throws Error if online and database update fails
 */
async function setDefaultStore(memberId: string, storeId: string): Promise<void> {
  // Update local cache immediately (optimistic update)
  localStorage.setItem(`${DEFAULT_STORE_CACHE_PREFIX}${memberId}`, storeId);

  // Update cached member session
  const cachedMembers = getCachedMembers();
  const memberIndex = cachedMembers.findIndex(m => m.memberId === memberId);
  if (memberIndex >= 0) {
    cachedMembers[memberIndex] = {
      ...cachedMembers[memberIndex],
      defaultStoreId: storeId,
    };
    localStorage.setItem(CACHED_MEMBERS_KEY, JSON.stringify(cachedMembers));
  }

  // If online, update database
  if (navigator.onLine) {
    const { error } = await supabase
      .from('members')
      .update({ default_store_id: storeId })
      .eq('id', memberId);

    if (error) {
      console.error('Failed to update default store in database:', error);
      throw new Error('Failed to save default store. Changes saved locally.');
    }
  }
}

/**
 * Clear a member's default store preference
 *
 * This function:
 * 1. Updates the database (if online)
 * 2. Clears the local cache
 * 3. Updates the cached member session
 *
 * @param memberId - Member ID to clear default store for
 * @throws Error if online and database update fails
 */
async function clearDefaultStore(memberId: string): Promise<void> {
  // Clear local cache immediately (optimistic update)
  localStorage.removeItem(`${DEFAULT_STORE_CACHE_PREFIX}${memberId}`);

  // Update cached member session
  const cachedMembers = getCachedMembers();
  const memberIndex = cachedMembers.findIndex(m => m.memberId === memberId);
  if (memberIndex >= 0) {
    cachedMembers[memberIndex] = {
      ...cachedMembers[memberIndex],
      defaultStoreId: null,
    };
    localStorage.setItem(CACHED_MEMBERS_KEY, JSON.stringify(cachedMembers));
  }

  // If online, update database
  if (navigator.onLine) {
    const { error } = await supabase
      .from('members')
      .update({ default_store_id: null })
      .eq('id', memberId);

    if (error) {
      console.error('Failed to clear default store in database:', error);
      throw new Error('Failed to clear default store. Changes saved locally.');
    }
  }
}

// ==================== OFFLINE STORE CACHING ====================

/** Storage key prefix for cached stores (offline support for multi-store users) */
const CACHED_STORES_PREFIX = 'member_cached_stores_';

/**
 * Basic store info cached for offline access
 * This is a minimal representation of store data needed for offline store switching.
 */
export interface CachedStoreInfo {
  /** Unique store identifier */
  storeId: string;
  /** Store display name */
  storeName: string;
  /** Store address (optional) */
  address?: string;
  /** Store login ID (optional) */
  storeLoginId?: string;
}

/**
 * Cache stores for offline access
 *
 * This function caches the list of stores a member has access to,
 * enabling offline store switching for multi-store users.
 *
 * Should be called during login when online to ensure offline access
 * to store list.
 *
 * @param memberId - Member ID to cache stores for
 * @param stores - Array of store info to cache
 */
function cacheStoresForOffline(memberId: string, stores: CachedStoreInfo[]): void {
  if (!stores || stores.length === 0) {
    return;
  }

  const cacheKey = `${CACHED_STORES_PREFIX}${memberId}`;
  const cacheData = {
    stores,
    cachedAt: new Date().toISOString(),
  };

  localStorage.setItem(cacheKey, JSON.stringify(cacheData));
}

/**
 * Get cached stores for offline access
 *
 * Retrieves the list of stores cached for a member, enabling
 * offline store switching.
 *
 * @param memberId - Member ID to get cached stores for
 * @returns Array of cached store info, or empty array if none cached
 */
function getCachedStores(memberId: string): CachedStoreInfo[] {
  const cacheKey = `${CACHED_STORES_PREFIX}${memberId}`;
  const data = localStorage.getItem(cacheKey);

  if (!data) {
    return [];
  }

  try {
    const cacheData = JSON.parse(data);
    return cacheData.stores || [];
  } catch {
    return [];
  }
}

/**
 * Clear cached stores for a member
 *
 * Should be called on logout to clean up cached data.
 *
 * @param memberId - Member ID to clear cached stores for
 */
function clearCachedStores(memberId: string): void {
  const cacheKey = `${CACHED_STORES_PREFIX}${memberId}`;
  localStorage.removeItem(cacheKey);
}

// ==================== PIN ATTEMPT TRACKING ====================

/**
 * Get number of failed PIN attempts for a member
 * @param memberId - Member ID to check
 * @returns Number of failed attempts
 */
function getFailedAttempts(memberId: string): number {
  const attemptsKey = `pin_attempts_${memberId}`;
  const attempts = localStorage.getItem(attemptsKey);
  return attempts ? parseInt(attempts, 10) : 0;
}

/**
 * Record a failed PIN attempt for a member
 * @param memberId - Member ID that failed
 */
function recordFailedPinAttempt(memberId: string): void {
  const attemptsKey = `pin_attempts_${memberId}`;
  const currentAttempts = getFailedAttempts(memberId);
  localStorage.setItem(attemptsKey, (currentAttempts + 1).toString());
}

/**
 * Clear failed PIN attempts after successful login
 * @param memberId - Member ID to clear
 */
function clearFailedAttempts(memberId: string): void {
  localStorage.removeItem(`pin_attempts_${memberId}`);
}

/**
 * Lock PIN for a member after too many failed attempts
 * @param memberId - Member ID to lock
 */
function lockPin(memberId: string): void {
  const lockoutKey = `pin_lockout_${memberId}`;
  const lockoutUntil = Date.now() + PIN_LOCKOUT_MINUTES * 60 * 1000;
  localStorage.setItem(lockoutKey, lockoutUntil.toString());
}

// ==================== PIN LOGIN ====================

/**
 * Login with PIN (offline capable)
 *
 * This function enables quick login for returning users and fast staff switching.
 * It works offline by validating PIN against the cached hash in SecureStorage.
 *
 * Flow:
 * 1. Get cached member profile from localStorage
 * 2. Check PIN lockout status (fail fast)
 * 3. Check offline grace period validity
 * 4. Get PIN hash from SecureStorage (NOT from session object)
 * 5. Validate PIN using bcrypt.compare()
 * 6. Record/clear failed attempts based on result
 * 7. Trigger background validation if online (non-blocking)
 *
 * @param memberId - Member ID to authenticate
 * @param pin - PIN entered by user (4-6 digits)
 * @returns MemberAuthSession on success
 * @throws Error with descriptive message on failure
 */
async function loginWithPin(memberId: string, pin: string): Promise<MemberAuthSession> {
  // 1. Get cached member profile
  const cachedMembers = getCachedMembers();
  const member = cachedMembers.find(m => m.memberId === memberId);

  if (!member) {
    throw new Error('Member not found in cache. Please login online first.');
  }

  // 2. Check lockout FIRST (fail fast before any other checks)
  const lockoutInfo = checkPinLockout(memberId);
  if (lockoutInfo.isLocked) {
    throw new Error(`PIN locked. Try again in ${lockoutInfo.remainingMinutes} minutes.`);
  }

  // 3. Check offline grace period
  const graceInfo = checkOfflineGrace(member);
  if (!graceInfo.isValid) {
    throw new Error('Offline access expired. Please login online to continue.');
  }

  // 4. Get PIN hash from SecureStorage (NOT from session object - security separation)
  const pinHash = await SecureStorage.get(`pin_hash_${memberId}`);
  if (!pinHash) {
    throw new Error('PIN not configured. Please login online to set up your PIN.');
  }

  // 5. Validate PIN using bcrypt
  const isValidPin = await bcrypt.compare(pin, pinHash);

  if (!isValidPin) {
    // 6a. Record failed attempt
    recordFailedPinAttempt(memberId);
    const attempts = getFailedAttempts(memberId);
    const remaining = PIN_MAX_ATTEMPTS - attempts;

    if (remaining <= 0) {
      lockPin(memberId);
      throw new Error(`PIN locked for ${PIN_LOCKOUT_MINUTES} minutes.`);
    }

    throw new Error(`Invalid PIN. ${remaining} attempts remaining.`);
  }

  // 6b. Clear failed attempts on success
  clearFailedAttempts(memberId);

  // 7. Background validation if online (non-blocking)
  if (navigator.onLine) {
    // Run background validation (checks member status, password changes, revocations)
    validateSessionInBackground(member);
  }

  return member;
}

/**
 * Update last_online_auth timestamp in the background (non-blocking)
 * This runs after successful PIN login when online
 * @param memberId - Member ID to update
 */
function updateLastOnlineAuthInBackground(memberId: string): void {
  // Fire and forget - don't await
  supabase
    .from('members')
    .update({ last_online_auth: new Date().toISOString() })
    .eq('id', memberId)
    .then(({ error }) => {
      if (error) {
        // Silently log - don't disrupt user experience
        console.error('Failed to update last_online_auth in background:', error);
      }
    });
}

// ==================== BACKGROUND VALIDATION ====================

/**
 * Validate member session in the background
 *
 * This function is called after successful PIN login when online.
 * It verifies the session is still valid by checking:
 * 1. Member is still active in database
 * 2. Password hasn't changed since session was created
 * 3. Session hasn't been revoked by admin
 *
 * If validation fails, dispatches forceLogout with appropriate reason.
 * Network errors are caught silently (don't logout on network failure).
 *
 * @param member - Member session to validate
 */
async function validateSessionInBackground(member: MemberAuthSession): Promise<void> {
  try {
    // 1. Check if member is still active in database
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('id, status, password_changed_at')
      .eq('id', member.memberId)
      .single();

    if (memberError) {
      // Network error or member not found - don't logout, just log
      console.error('Background validation: Failed to fetch member:', memberError);
      return;
    }

    // Member deactivated
    if (memberData.status !== 'active') {
      store.dispatch(forceLogout({
        reason: 'account_deactivated',
        message: 'Your account has been deactivated. Please contact your administrator.',
      }));
      stopGraceChecker();
      return;
    }

    // 2. Check if password was changed after session was created
    if (memberData.password_changed_at) {
      const passwordChangedAt = new Date(memberData.password_changed_at);
      if (passwordChangedAt > member.sessionCreatedAt) {
        store.dispatch(forceLogout({
          reason: 'password_changed',
          message: 'Your password was changed. Please log in again.',
        }));
        stopGraceChecker();
        return;
      }
    }

    // 3. Check for session revocations
    const { data: revocations, error: revocationError } = await supabase
      .from('member_session_revocations')
      .select('id, revoke_all_before')
      .eq('member_id', member.memberId)
      .order('revoked_at', { ascending: false })
      .limit(1);

    if (revocationError) {
      // Network error - don't logout, just log
      console.error('Background validation: Failed to check revocations:', revocationError);
      return;
    }

    // Check if session was created before the most recent revocation
    if (revocations && revocations.length > 0) {
      const revokeAllBefore = new Date(revocations[0].revoke_all_before);
      if (member.sessionCreatedAt < revokeAllBefore) {
        store.dispatch(forceLogout({
          reason: 'session_revoked',
          message: 'Your session was revoked by an administrator. Please log in again.',
        }));
        stopGraceChecker();
        return;
      }
    }

    // 4. Session is valid - update lastOnlineAuth in cache
    const now = new Date();
    const updatedMember: MemberAuthSession = {
      ...member,
      lastOnlineAuth: now,
    };
    cacheMemberSession(updatedMember);

    // Also update timestamp in database (non-blocking)
    supabase
      .from('members')
      .update({ last_online_auth: now.toISOString() })
      .eq('id', member.memberId)
      .then(({ error }) => {
        if (error) {
          console.error('Background validation: Failed to update last_online_auth:', error);
        }
      });

  } catch (error: unknown) {
    // Catch any unexpected errors - don't logout on network/parsing issues
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Background validation: Unexpected error:', errorMessage);
  }
}

// ==================== LOGOUT ====================

/**
 * Logout the current member
 *
 * This function:
 * 1. Stops the grace period checker
 * 2. Clears cached member session
 * 3. Signs out of Supabase Auth
 *
 * Note: This does NOT dispatch forceLogout action.
 * For that, use the forceLogout action directly with a reason.
 */
async function logout(): Promise<void> {
  // 1. Stop grace checker
  stopGraceChecker();

  // 2. Clear cached session
  clearCachedMemberSession();

  // 3. Sign out of Supabase Auth
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Failed to sign out of Supabase:', error);
    // Don't throw - session is already cleared locally
  }
}

// ==================== EXPORTS ====================

/**
 * Member Authentication Service
 *
 * Provides methods for member authentication using Supabase Auth.
 * Features:
 * - Password login via Supabase Auth
 * - PIN login for offline-capable quick access
 * - Background session validation
 * - Grace period management for offline access
 */
export const memberAuthService = {
  // Login methods
  loginWithPassword,
  loginWithPin,

  // Logout
  logout,

  // PIN management
  setPin,
  removePin,
  hasPin,
  isValidPinFormat,

  // Session cache helpers
  getCachedMemberSession,
  getCachedMembers,
  cacheMemberSession,
  clearCachedMemberSession,

  // PIN lockout helpers
  checkPinLockout,

  // PIN attempt tracking helpers
  getFailedAttempts,
  recordFailedPinAttempt,
  clearFailedAttempts,
  lockPin,

  // Grace period helpers
  checkOfflineGrace,

  // Default store preference
  getDefaultStore,
  setDefaultStore,
  clearDefaultStore,

  // Offline store caching
  cacheStoresForOffline,
  getCachedStores,
  clearCachedStores,

  // Grace period checker
  startGraceChecker,
  stopGraceChecker,

  // Background validation
  validateSessionInBackground,

  // Constants
  PIN_MAX_ATTEMPTS,
  PIN_LOCKOUT_MINUTES,
  OFFLINE_GRACE_DAYS,
  GRACE_CHECK_INTERVAL_MS,
};

export default memberAuthService;
