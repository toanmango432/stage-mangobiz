/**
 * Member Authentication Types
 *
 * Types for the Supabase Auth-based member authentication system.
 * Used by memberAuthService for login, session management, and offline access.
 *
 * Security Note: PIN hashes are stored in SecureStorage, NOT in session objects.
 *
 * @see docs/AUTH_MIGRATION_PLAN.md
 */

/**
 * Reason codes for force logout events.
 * These are dispatched by background validation when a session becomes invalid.
 */
export type ForceLogoutReason =
  | 'offline_grace_expired'
  | 'account_deactivated'
  | 'password_changed'
  | 'session_revoked';

/**
 * Member authentication session data.
 * This is the primary session object for authenticated members.
 *
 * IMPORTANT: This session is cached in localStorage for offline access.
 * PIN hashes are stored separately in SecureStorage for security.
 */
export interface MemberAuthSession {
  /**
   * Unique identifier for the member in the members table.
   */
  memberId: string;

  /**
   * Supabase Auth user ID (from auth.users table).
   * Used to link member to their Supabase Auth account.
   */
  authUserId: string;

  /**
   * Member's email address.
   * Used for display and password reset flows.
   */
  email: string;

  /**
   * Member's display name.
   */
  name: string;

  /**
   * Member's role in the organization (e.g., 'owner', 'manager', 'staff').
   */
  role: string;

  /**
   * Array of store IDs the member has access to.
   * Multi-store users will have multiple entries.
   */
  storeIds: string[];

  /**
   * Permission flags for the member.
   * Keys are permission names, values indicate if granted.
   */
  permissions: Record<string, boolean>;

  /**
   * Timestamp of the last successful online authentication.
   * Used to calculate offline grace period remaining.
   */
  lastOnlineAuth: Date;

  /**
   * Timestamp when this session was created.
   * Used for session revocation checks (revoke all sessions before this time).
   */
  sessionCreatedAt: Date;

  /**
   * The member's default store ID for multi-store users.
   * Null if no default is set or user has only one store.
   */
  defaultStoreId: string | null;
}

/**
 * Information about PIN lockout status.
 * Used to display lockout warnings and prevent login attempts.
 */
export interface PinLockoutInfo {
  /**
   * Whether the PIN is currently locked due to too many failed attempts.
   */
  isLocked: boolean;

  /**
   * Minutes remaining until the lockout expires.
   * Only meaningful when isLocked is true.
   */
  remainingMinutes: number;
}

/**
 * Information about offline grace period status.
 * Used to display warnings and determine if offline access is allowed.
 */
export interface GraceInfo {
  /**
   * Whether the offline grace period is still valid.
   * If false, online authentication is required.
   */
  isValid: boolean;

  /**
   * Days remaining in the offline grace period.
   * Negative if expired.
   */
  daysRemaining: number;
}

/**
 * Payload for force logout Redux action.
 * Contains the reason and user-friendly message for the logout.
 */
export interface ForceLogoutPayload {
  /**
   * Machine-readable reason code for the logout.
   */
  reason: ForceLogoutReason;

  /**
   * User-friendly message explaining why they were logged out.
   */
  message: string;
}

/**
 * Login context indicating how the device was authenticated.
 * Determines which verification methods are available.
 */
export type LoginContext = 'store' | 'member';

/**
 * Cached member data for offline access.
 * Subset of full member data needed for offline operations.
 */
export interface CachedMember {
  /**
   * Member ID.
   */
  memberId: string;

  /**
   * Member's display name.
   */
  name: string;

  /**
   * Member's email.
   */
  email: string;

  /**
   * Member's role.
   */
  role: string;

  /**
   * Member's avatar URL (if available).
   */
  avatarUrl: string | null;

  /**
   * Whether this member has a PIN set up.
   * Used to determine if PIN login is available offline.
   */
  hasPinSetup: boolean;
}
