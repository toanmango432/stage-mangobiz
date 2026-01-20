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

// ==================== GRACE PERIOD HELPERS (PLACEHOLDER) ====================

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
  // Note: validateSessionInBackground will be implemented in US-012
  if (navigator.onLine) {
    // Will call: validateSessionInBackground(member);
    // For now, just update last online auth if we can reach the server
    updateLastOnlineAuthInBackground(member.memberId);
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

// ==================== EXPORTS ====================

/**
 * Member Authentication Service
 *
 * Provides methods for member authentication using Supabase Auth.
 * Subsequent stories will add:
 * - startGraceChecker() / stopGraceChecker() - Grace period monitoring (US-011)
 * - validateSessionInBackground() - Background session validation (US-012)
 * - logout() - Full logout (US-012)
 */
export const memberAuthService = {
  // Login methods
  loginWithPassword,
  loginWithPin,

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

  // Constants
  PIN_MAX_ATTEMPTS,
  PIN_LOCKOUT_MINUTES,
  OFFLINE_GRACE_DAYS,
};

export default memberAuthService;
