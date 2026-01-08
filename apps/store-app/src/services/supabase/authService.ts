/**
 * Supabase Authentication Service
 * Handles two-tier authentication: Store login + Member PIN
 *
 * Flow:
 * 1. Store Login: Verify store credentials against `stores` table
 * 2. Member PIN: Verify member PIN against `members` table
 */

import { supabase } from './client';
import type { MemberRow, MemberRole } from './types';
import { auditLogger } from '../audit/auditLogger';

// ==================== SESSION TYPES ====================

export interface StoreSession {
  storeId: string;
  storeName: string;
  storeLoginId: string;
  tenantId: string;
  tier: string;
  licenseId?: string;
  status?: string;
  timezone?: string | null;
}

export interface MemberSession {
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: MemberRole;
  storeIds: string[];
  avatarUrl: string | null;
  permissions: Record<string, boolean> | null;
}

export interface AuthSession {
  store: StoreSession | null;
  member: MemberSession | null;
  isStoreLoggedIn: boolean;
  isMemberLoggedIn: boolean;
}

export interface LicenseInfo {
  id: string;
  tier: string;
  maxStores: number;
  maxDevicesPerStore: number;
  status: string;
  expiresAt: string | null;
}

// ==================== AUTH ERRORS ====================

export class AuthError extends Error {
  constructor(
    message: string,
    public code: 'STORE_NOT_FOUND' | 'INVALID_PASSWORD' | 'MEMBER_NOT_FOUND' | 'INVALID_PIN' | 'STORE_SUSPENDED' | 'LICENSE_EXPIRED' | 'MEMBER_INACTIVE' | 'NETWORK_ERROR'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// ==================== SESSION STORAGE ====================

const STORE_SESSION_KEY = 'mango_store_session';
const MEMBER_SESSION_KEY = 'mango_member_session';
const STORE_SESSION_TIMESTAMP_KEY = 'mango_store_session_timestamp';
const MEMBER_SESSION_TIMESTAMP_KEY = 'mango_member_session_timestamp';

// Grace periods for cached sessions (LOCAL-FIRST)
const STORE_SESSION_GRACE_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7 days
const MEMBER_SESSION_GRACE_PERIOD = 24 * 60 * 60 * 1000; // 24 hours
const LOGIN_TIMEOUT = 10000; // 10 seconds

function saveStoreSession(session: StoreSession): void {
  localStorage.setItem(STORE_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(STORE_SESSION_TIMESTAMP_KEY, Date.now().toString());
}

function loadStoreSession(): StoreSession | null {
  const data = localStorage.getItem(STORE_SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

function getStoreSessionTimestamp(): number | null {
  const timestamp = localStorage.getItem(STORE_SESSION_TIMESTAMP_KEY);
  return timestamp ? parseInt(timestamp, 10) : null;
}

function isStoreSessionValid(): boolean {
  const timestamp = getStoreSessionTimestamp();
  if (!timestamp) return false;
  return Date.now() - timestamp < STORE_SESSION_GRACE_PERIOD;
}

function clearStoreSession(): void {
  localStorage.removeItem(STORE_SESSION_KEY);
  localStorage.removeItem(STORE_SESSION_TIMESTAMP_KEY);
}

function saveMemberSession(session: MemberSession): void {
  localStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(MEMBER_SESSION_TIMESTAMP_KEY, Date.now().toString());
}

function loadMemberSession(): MemberSession | null {
  const data = localStorage.getItem(MEMBER_SESSION_KEY);
  return data ? JSON.parse(data) : null;
}

function getMemberSessionTimestamp(): number | null {
  const timestamp = localStorage.getItem(MEMBER_SESSION_TIMESTAMP_KEY);
  return timestamp ? parseInt(timestamp, 10) : null;
}

function isMemberSessionValid(): boolean {
  const timestamp = getMemberSessionTimestamp();
  if (!timestamp) return false;
  return Date.now() - timestamp < MEMBER_SESSION_GRACE_PERIOD;
}

function clearMemberSession(): void {
  localStorage.removeItem(MEMBER_SESSION_KEY);
  localStorage.removeItem(MEMBER_SESSION_TIMESTAMP_KEY);
}

// ==================== TIMEOUT WRAPPER (LOCAL-FIRST) ====================

/**
 * Wrap a promise with a timeout
 * LOCAL-FIRST: Fail fast on slow networks
 */
async function withTimeout<T>(promise: Promise<T>, ms: number = LOGIN_TIMEOUT): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new AuthError('Request timeout', 'NETWORK_ERROR')), ms)
  );
  return Promise.race([promise, timeout]);
}

// ==================== CACHED-FIRST LOGIN (LOCAL-FIRST) ====================

/**
 * Get cached store session if valid
 * LOCAL-FIRST: Returns cached session if within grace period
 */
export function getCachedStoreSession(): { session: StoreSession; isValid: boolean } | null {
  const session = loadStoreSession();
  if (!session) return null;
  return { session, isValid: isStoreSessionValid() };
}

/**
 * Get cached member session if valid
 * LOCAL-FIRST: Returns cached session if within grace period
 */
export function getCachedMemberSession(): { session: MemberSession; isValid: boolean } | null {
  const session = loadMemberSession();
  if (!session) return null;
  return { session, isValid: isMemberSessionValid() };
}

/**
 * Validate store session in background (non-blocking)
 * LOCAL-FIRST: Fires and forgets - doesn't block login
 */
export function validateStoreSessionInBackground(storeId: string): void {
  // Don't await - fire and forget
  validateStoreSession(storeId)
    .then(isValid => {
      if (!isValid) {
        console.warn('[AuthService] Store session invalidated by server');
        // Mark session as invalid - will force re-login next time
        localStorage.setItem('mango_session_invalid', 'true');
      } else {
        // Update timestamp on successful validation
        localStorage.setItem(STORE_SESSION_TIMESTAMP_KEY, Date.now().toString());
        localStorage.removeItem('mango_session_invalid');
      }
    })
    .catch(() => {
      // Network error - ignore, keep using cached session
      console.log('[AuthService] Background validation failed (network) - using cached session');
    });
}

/**
 * Validate member session in background (non-blocking)
 * LOCAL-FIRST: Fires and forgets - doesn't block login
 */
export function validateMemberSessionInBackground(memberId: string): void {
  // Don't await - fire and forget
  validateMemberSession(memberId)
    .then(isValid => {
      if (!isValid) {
        console.warn('[AuthService] Member session invalidated by server');
        // Mark as invalid - will require re-login
        localStorage.setItem('mango_member_invalid', 'true');
      } else {
        // Update timestamp on successful validation
        localStorage.setItem(MEMBER_SESSION_TIMESTAMP_KEY, Date.now().toString());
        localStorage.removeItem('mango_member_invalid');
      }
    })
    .catch(() => {
      // Network error - ignore, keep using cached session
      console.log('[AuthService] Background member validation failed (network) - using cached session');
    });
}

/**
 * Check if session was marked as invalid by background validation
 */
export function isSessionMarkedInvalid(): boolean {
  return localStorage.getItem('mango_session_invalid') === 'true';
}

/**
 * Check if member session was marked as invalid by background validation
 */
export function isMemberMarkedInvalid(): boolean {
  return localStorage.getItem('mango_member_invalid') === 'true';
}

/**
 * Clear invalid session markers
 */
export function clearInvalidMarkers(): void {
  localStorage.removeItem('mango_session_invalid');
  localStorage.removeItem('mango_member_invalid');
}

// ==================== STORE AUTHENTICATION ====================

/**
 * Login with store credentials
 * Verifies against `stores` table in Supabase
 * Wrapped with timeout for LOCAL-FIRST architecture
 */
export async function loginStoreWithCredentials(
  loginId: string,
  password: string
): Promise<StoreSession> {
  try {
    // Query store by login ID
    const { data: store, error } = await supabase
      .from('stores')
      .select('*')
      .eq('store_login_id', loginId)
      .single();

    if (error || !store) {
      throw new AuthError('Store not found', 'STORE_NOT_FOUND');
    }

    // Check store status
    if (store.status === 'suspended') {
      throw new AuthError('Store account is suspended', 'STORE_SUSPENDED');
    }

    // Verify password
    // Note: In production, this should use bcrypt comparison on the server
    // For now, we do a simple comparison (password should be hashed in real implementation)
    const isValidPassword = await verifyPassword(password, store.password_hash);
    if (!isValidPassword) {
      throw new AuthError('Invalid password', 'INVALID_PASSWORD');
    }

    // Update last login timestamp
    await supabase
      .from('stores')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', store.id);

    // Create session
    const session: StoreSession = {
      storeId: store.id,
      storeName: store.name,
      storeLoginId: store.store_login_id,
      tenantId: store.tenant_id,
      tier: store.tier || 'starter',
      licenseId: store.license_id,
      status: store.status,
      timezone: store.timezone,
    };

    // Save session
    saveStoreSession(session);

    // Set audit context and log successful login
    auditLogger.setContext({
      storeId: session.storeId,
      storeName: session.storeName,
      tenantId: session.tenantId,
      userId: session.storeId,
      userName: session.storeName,
    });
    auditLogger.logLogin(session.storeId, session.storeName, true, undefined, {
      loginMethod: 'password',
      loginType: 'store',
    }).catch(console.warn);

    return session;
  } catch (error) {
    // Log failed login attempt
    auditLogger.logLogin(loginId, loginId, false,
      error instanceof AuthError ? error.message : 'Login failed',
      { loginMethod: 'password', loginType: 'store' }
    ).catch(console.warn);

    if (error instanceof AuthError) throw error;
    throw new AuthError('Network error during login', 'NETWORK_ERROR');
  }
}

/**
 * Validate existing store session
 * LOCAL-FIRST: Checks if store is still active on server
 */
export async function validateStoreSession(storeId: string): Promise<boolean> {
  try {
    // Wrap Supabase query with Promise.resolve to convert PromiseLike to Promise
    const result = await withTimeout(
      Promise.resolve(
        supabase
          .from('stores')
          .select('id, status')
          .eq('id', storeId)
          .single()
      )
    );

    if (result.error || !result.data) return false;
    if (result.data.status === 'suspended') return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Validate existing member session
 * LOCAL-FIRST: Checks if member is still active
 */
export async function validateMemberSession(memberId: string): Promise<boolean> {
  try {
    // Wrap Supabase query with Promise.resolve to convert PromiseLike to Promise
    const result = await withTimeout(
      Promise.resolve(
        supabase
          .from('members')
          .select('id, status')
          .eq('id', memberId)
          .single()
      )
    );

    if (result.error || !result.data) return false;
    if (result.data.status !== 'active') return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Logout store (clears both store and member sessions)
 */
export function logoutStore(): void {
  // Log logout before clearing session
  auditLogger.log({
    action: 'logout',
    entityType: 'store',
    severity: 'low',
    description: 'Store logged out',
    metadata: { logoutType: 'store' },
    success: true,
  }).catch(console.warn);

  clearStoreSession();
  clearMemberSession();

  // Clear audit context
  auditLogger.clearContext();
}

// ==================== MEMBER AUTHENTICATION ====================

/**
 * Login member with PIN
 * Verifies against `members` table in Supabase
 */
export async function loginMemberWithPin(
  storeId: string,
  pin: string
): Promise<MemberSession> {
  try {
    // Query members who have access to this store and match the PIN
    // Note: Table uses 'status' = 'active' instead of 'is_active' = true
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('pin', pin)
      .eq('status', 'active');

    if (error) {
      console.error('Supabase query error:', error);
      throw new AuthError('Network error', 'NETWORK_ERROR');
    }

    // Find member with access to this store
    const member = members?.find((m: MemberRow) =>
      m.store_ids && m.store_ids.includes(storeId)
    );

    if (!member) {
      throw new AuthError('Invalid PIN or no access to this store', 'INVALID_PIN');
    }

    // Update last login timestamp
    await supabase
      .from('members')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', member.id);

    // Parse name into first/last (table has 'name' field instead of first_name/last_name)
    const nameParts = (member.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create session
    const session: MemberSession = {
      memberId: member.id,
      firstName: firstName,
      lastName: lastName,
      email: member.email,
      role: member.role as MemberRole,
      storeIds: member.store_ids || [],
      avatarUrl: member.avatar_url || null,
      permissions: member.permissions as Record<string, boolean> | null,
    };

    // Save session
    saveMemberSession(session);

    // Update audit context with member info and log login
    auditLogger.setContext({
      userId: session.memberId,
      userName: `${session.firstName} ${session.lastName}`.trim(),
      userRole: session.role,
    });
    auditLogger.logLogin(session.memberId, `${session.firstName} ${session.lastName}`.trim(), true, undefined, {
      loginMethod: 'pin',
      loginType: 'member',
    }).catch(console.warn);

    return session;
  } catch (error) {
    // Log failed PIN login
    auditLogger.logLogin('unknown', 'unknown', false,
      error instanceof AuthError ? error.message : 'PIN login failed',
      { loginMethod: 'pin', loginType: 'member' }
    ).catch(console.warn);

    if (error instanceof AuthError) throw error;
    throw new AuthError('Network error during login', 'NETWORK_ERROR');
  }
}

/**
 * Login member with email and password
 */
export async function loginMemberWithPassword(
  email: string,
  password: string,
  storeId?: string
): Promise<MemberSession> {
  try {
    // Note: Table uses 'status' = 'active' instead of 'is_active' = true
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .eq('status', 'active')
      .single();

    if (error || !member) {
      throw new AuthError('Member not found', 'MEMBER_NOT_FOUND');
    }

    // If storeId provided, verify access
    if (storeId && (!member.store_ids || !member.store_ids.includes(storeId))) {
      throw new AuthError('No access to this store', 'MEMBER_NOT_FOUND');
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, member.password_hash);
    if (!isValidPassword) {
      throw new AuthError('Invalid password', 'INVALID_PASSWORD');
    }

    // Update last login timestamp
    await supabase
      .from('members')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', member.id);

    // Parse name into first/last (table has 'name' field instead of first_name/last_name)
    const nameParts = (member.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create session
    const session: MemberSession = {
      memberId: member.id,
      firstName: firstName,
      lastName: lastName,
      email: member.email,
      role: member.role as MemberRole,
      storeIds: member.store_ids || [],
      avatarUrl: member.avatar_url || null,
      permissions: member.permissions as Record<string, boolean> | null,
    };

    // Save session
    saveMemberSession(session);

    // Update audit context with member info and log login
    auditLogger.setContext({
      userId: session.memberId,
      userName: `${session.firstName} ${session.lastName}`.trim(),
      userRole: session.role,
    });
    auditLogger.logLogin(session.memberId, `${session.firstName} ${session.lastName}`.trim(), true, undefined, {
      loginMethod: 'password',
      loginType: 'member',
    }).catch(console.warn);

    return session;
  } catch (error) {
    // Log failed password login
    auditLogger.logLogin('unknown', email, false,
      error instanceof AuthError ? error.message : 'Password login failed',
      { loginMethod: 'password', loginType: 'member' }
    ).catch(console.warn);

    if (error instanceof AuthError) throw error;
    throw new AuthError('Network error during login', 'NETWORK_ERROR');
  }
}

/**
 * Get all members for a store (for displaying member list on PIN screen)
 */
export async function getStoreMembers(storeId: string): Promise<MemberSession[]> {
  try {
    // Note: Table uses 'status' = 'active' instead of 'is_active' = true
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'active')
      .contains('store_ids', [storeId]);

    if (error) {
      console.error('Error fetching store members:', error);
      return [];
    }

    return (members || []).map((m: MemberRow) => {
      // Parse name into first/last (table has 'name' field instead of first_name/last_name)
      const nameParts = (m.name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        memberId: m.id,
        firstName: firstName,
        lastName: lastName,
        email: m.email,
        role: m.role as MemberRole,
        storeIds: m.store_ids || [],
        avatarUrl: m.avatar_url || null,
        permissions: m.permissions as Record<string, boolean> | null,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Switch to a different member (quick-switch using PIN)
 */
export async function switchMember(storeId: string, pin: string): Promise<MemberSession> {
  return loginMemberWithPin(storeId, pin);
}

/**
 * Verify member PIN without switching users
 * Used for accessing restricted features (reports, refunds, settings)
 * Returns true if PIN is valid for the current member
 */
export async function verifyMemberPin(
  memberId: string,
  pin: string
): Promise<boolean> {
  try {
    const { data: member, error } = await supabase
      .from('members')
      .select('pin')
      .eq('id', memberId)
      .eq('status', 'active')
      .single();

    if (error || !member) {
      return false;
    }

    return member.pin === pin;
  } catch {
    return false;
  }
}

/**
 * Login member with staff card (NFC/magnetic stripe)
 * Card ID is stored in members.card_id field
 */
export async function loginMemberWithCard(
  storeId: string,
  cardId: string
): Promise<MemberSession> {
  try {
    // Query members who have this card ID and access to this store
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('card_id', cardId)
      .eq('status', 'active');

    if (error) {
      console.error('Supabase query error:', error);
      throw new AuthError('Network error', 'NETWORK_ERROR');
    }

    // Find member with access to this store
    const member = members?.find((m: MemberRow) =>
      m.store_ids && m.store_ids.includes(storeId)
    );

    if (!member) {
      throw new AuthError('Card not recognized or no access to this store', 'MEMBER_NOT_FOUND');
    }

    // Update last login timestamp
    await supabase
      .from('members')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', member.id);

    // Parse name into first/last
    const nameParts = (member.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create session
    const session: MemberSession = {
      memberId: member.id,
      firstName: firstName,
      lastName: lastName,
      email: member.email,
      role: member.role as MemberRole,
      storeIds: member.store_ids || [],
      avatarUrl: member.avatar_url || null,
      permissions: member.permissions as Record<string, boolean> | null,
    };

    // Save session
    saveMemberSession(session);

    // Update audit context with member info and log login
    auditLogger.setContext({
      userId: session.memberId,
      userName: `${session.firstName} ${session.lastName}`.trim(),
      userRole: session.role,
    });
    auditLogger.logLogin(session.memberId, `${session.firstName} ${session.lastName}`.trim(), true, undefined, {
      loginMethod: 'card',
      loginType: 'member',
    }).catch(console.warn);

    return session;
  } catch (error) {
    // Log failed card login
    auditLogger.logLogin('unknown', 'unknown', false,
      error instanceof AuthError ? error.message : 'Card login failed',
      { loginMethod: 'card', loginType: 'member' }
    ).catch(console.warn);

    if (error instanceof AuthError) throw error;
    throw new AuthError('Network error during card login', 'NETWORK_ERROR');
  }
}

/**
 * Verify member by card without creating a session
 * Used for quick authorization (similar to verifyMemberPin but with card)
 */
export async function verifyMemberCard(
  storeId: string,
  cardId: string
): Promise<MemberSession | null> {
  try {
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('card_id', cardId)
      .eq('status', 'active');

    if (error || !members?.length) {
      return null;
    }

    // Find member with access to this store
    const member = members.find((m: MemberRow) =>
      m.store_ids && m.store_ids.includes(storeId)
    );

    if (!member) {
      return null;
    }

    // Parse name into first/last
    const nameParts = (member.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      memberId: member.id,
      firstName: firstName,
      lastName: lastName,
      email: member.email,
      role: member.role as MemberRole,
      storeIds: member.store_ids || [],
      avatarUrl: member.avatar_url || null,
      permissions: member.permissions as Record<string, boolean> | null,
    };
  } catch {
    return null;
  }
}

/**
 * Logout current member (keeps store session active)
 */
export function logoutMember(): void {
  // Log member logout before clearing session
  auditLogger.log({
    action: 'logout',
    entityType: 'member',
    severity: 'low',
    description: 'Member logged out',
    metadata: { logoutType: 'member' },
    success: true,
  }).catch(console.warn);

  clearMemberSession();
}

// ==================== SESSION MANAGEMENT ====================

/**
 * Get current auth session from localStorage
 */
export function getCurrentSession(): AuthSession {
  const store = loadStoreSession();
  const member = loadMemberSession();

  return {
    store,
    member,
    isStoreLoggedIn: store !== null,
    isMemberLoggedIn: member !== null,
  };
}

/**
 * Get current store session
 */
export function getCurrentStore(): StoreSession | null {
  return loadStoreSession();
}

/**
 * Get current member session
 */
export function getCurrentMember(): MemberSession | null {
  return loadMemberSession();
}

/**
 * Check if fully authenticated (store + member)
 */
export function isFullyAuthenticated(): boolean {
  const session = getCurrentSession();
  return session.isStoreLoggedIn && session.isMemberLoggedIn;
}

// ==================== LICENSE VALIDATION ====================

/**
 * Get license info for a tenant
 */
export async function getLicenseInfo(tenantId: string): Promise<LicenseInfo | null> {
  try {
    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single();

    if (error || !license) return null;

    return {
      id: license.id,
      tier: license.tier,
      maxStores: license.max_stores,
      maxDevicesPerStore: license.max_devices_per_store,
      status: license.status,
      expiresAt: license.expires_at,
    };
  } catch {
    return null;
  }
}

/**
 * Check if license is valid
 */
export async function validateLicense(tenantId: string): Promise<boolean> {
  const license = await getLicenseInfo(tenantId);
  if (!license) return false;
  if (license.status !== 'active') return false;
  if (license.expiresAt && new Date(license.expiresAt) < new Date()) return false;
  return true;
}

// ==================== HELPERS ====================

/**
 * Verify password against hash
 * Note: In production, this should use bcrypt on the server side
 * For MVP, we use a simple comparison (passwords stored as plain text or simple hash)
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Check if it's a bcrypt hash (starts with $2)
  if (hash.startsWith('$2')) {
    // Bcrypt hashes require server-side verification via Supabase Edge Function
    // TODO: Implement edge function for bcrypt.compare()
    console.error('Bcrypt hash requires server-side verification - not yet implemented');
    return false;
  }

  // Simple comparison for plain text passwords (legacy support)
  return password === hash;
}

/**
 * Get store details by ID
 * Used for direct member login to fetch store info
 */
export async function getStoreById(storeId: string): Promise<StoreSession | null> {
  try {
    const { data: store, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (error || !store) {
      console.error('Store not found:', storeId, error);
      return null;
    }

    return {
      storeId: store.id,
      storeName: store.name,
      storeLoginId: store.store_login_id || store.login_id || '',
      tenantId: store.tenant_id,
      tier: store.tier || 'starter',
    };
  } catch (error) {
    console.error('Error fetching store:', error);
    return null;
  }
}

// ==================== SESSION PERSISTENCE ====================

/**
 * Manually set/persist a store session (for direct member login flow)
 */
export function setStoreSession(session: StoreSession): void {
  saveStoreSession(session);
}

/**
 * Manually set/persist a member session
 */
export function setMemberSession(session: MemberSession): void {
  saveMemberSession(session);
}

// ==================== EXPORTS ====================

export const authService = {
  // Store auth
  loginStoreWithCredentials,
  validateStoreSession,
  logoutStore,
  getStoreById,

  // Member auth
  loginMemberWithPin,
  loginMemberWithPassword,
  loginMemberWithCard,
  getStoreMembers,
  switchMember,
  verifyMemberPin,
  verifyMemberCard,
  validateMemberSession,
  logoutMember,

  // Session management
  getCurrentSession,
  getCurrentStore,
  getCurrentMember,
  isFullyAuthenticated,
  setStoreSession,
  setMemberSession,

  // Cached-first login (LOCAL-FIRST)
  getCachedStoreSession,
  getCachedMemberSession,
  validateStoreSessionInBackground,
  validateMemberSessionInBackground,
  isSessionMarkedInvalid,
  isMemberMarkedInvalid,
  clearInvalidMarkers,

  // License
  getLicenseInfo,
  validateLicense,
};

export default authService;
