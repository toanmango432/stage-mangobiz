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

// ==================== EXPORTS ====================

/**
 * Member Authentication Service
 *
 * Provides methods for member authentication using Supabase Auth.
 * Subsequent stories (US-009 through US-012) will add:
 * - loginWithPin() - PIN-based offline login
 * - setPin() - PIN management
 * - startGraceChecker() / stopGraceChecker() - Grace period monitoring
 * - validateSessionInBackground() - Background session validation
 * - logout() - Full logout
 */
export const memberAuthService = {
  // Password login (this story - US-008)
  loginWithPassword,

  // Session cache helpers
  getCachedMemberSession,
  getCachedMembers,
  cacheMemberSession,
  clearCachedMemberSession,

  // PIN lockout helpers (used by future stories)
  checkPinLockout,

  // Grace period helpers (used by future stories)
  checkOfflineGrace,

  // Constants
  PIN_MAX_ATTEMPTS,
  PIN_LOCKOUT_MINUTES,
  OFFLINE_GRACE_DAYS,
};

export default memberAuthService;
