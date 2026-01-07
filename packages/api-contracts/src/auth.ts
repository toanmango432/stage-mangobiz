/**
 * Authentication API Contracts
 *
 * Shared types for authentication request/response between frontend and API.
 * These types define the contract for the two-tier authentication system:
 * 1. Store-level authentication (salon login)
 * 2. Member-level authentication (staff PIN/password)
 */

import { z } from 'zod';

// =============================================================================
// Store Authentication
// =============================================================================

/**
 * Store session returned after successful store login
 */
export interface StoreSession {
  storeId: string;
  storeName: string;
  storeLoginId: string;
  tenantId: string;
  tier: 'free' | 'basic' | 'professional' | 'enterprise';
  licenseId: string;
  timezone: string;
  currency?: string;
  locale?: string;
  features?: string[];
}

/**
 * Request body for store login
 */
export interface StoreLoginRequest {
  loginId: string;
  password: string;
}

/**
 * Response from store login endpoint
 */
export interface StoreLoginResponse {
  session: StoreSession;
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

// Zod schema for validation
export const StoreLoginRequestSchema = z.object({
  loginId: z.string().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export const StoreSessionSchema = z.object({
  storeId: z.string().uuid(),
  storeName: z.string(),
  storeLoginId: z.string(),
  tenantId: z.string().uuid(),
  tier: z.enum(['free', 'basic', 'professional', 'enterprise']),
  licenseId: z.string().uuid(),
  timezone: z.string(),
  currency: z.string().optional(),
  locale: z.string().optional(),
  features: z.array(z.string()).optional(),
});

export const StoreLoginResponseSchema = z.object({
  session: StoreSessionSchema,
  token: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime(),
});

// =============================================================================
// Member Authentication
// =============================================================================

/**
 * Member session returned after successful member login
 */
export interface MemberSession {
  memberId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email?: string;
  role: MemberRole;
  storeIds: string[];
  avatarUrl?: string;
  permissions: string[];
  requirePasswordChange?: boolean;
}

export type MemberRole = 'owner' | 'manager' | 'staff' | 'receptionist' | 'admin';

/**
 * Request body for member PIN login
 */
export interface MemberPinRequest {
  storeId: string;
  memberId?: string;
  pin: string;
}

/**
 * Request body for member password login
 */
export interface MemberPasswordRequest {
  storeId: string;
  email: string;
  password: string;
}

/**
 * Request body for member card login (NFC/magnetic stripe)
 */
export interface MemberCardRequest {
  storeId: string;
  cardId: string;
}

/**
 * Response from member login endpoints
 */
export interface MemberLoginResponse {
  session: MemberSession;
  token: string;
  expiresAt: string;
}

// Zod schemas for validation
export const MemberPinRequestSchema = z.object({
  storeId: z.string().uuid(),
  memberId: z.string().uuid().optional(),
  pin: z.string().min(4, 'PIN must be at least 4 digits'),
});

export const MemberPasswordRequestSchema = z.object({
  storeId: z.string().uuid(),
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const MemberCardRequestSchema = z.object({
  storeId: z.string().uuid(),
  cardId: z.string().min(1, 'Card ID is required'),
});

export const MemberSessionSchema = z.object({
  memberId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  displayName: z.string(),
  email: z.string().email().optional(),
  role: z.enum(['owner', 'manager', 'staff', 'receptionist', 'admin']),
  storeIds: z.array(z.string().uuid()),
  avatarUrl: z.string().url().optional(),
  permissions: z.array(z.string()),
  requirePasswordChange: z.boolean().optional(),
});

export const MemberLoginResponseSchema = z.object({
  session: MemberSessionSchema,
  token: z.string(),
  expiresAt: z.string().datetime(),
});

// =============================================================================
// Combined Auth Session
// =============================================================================

/**
 * Combined authentication session (store + member)
 */
export interface AuthSession {
  store: StoreSession | null;
  member: MemberSession | null;
  isStoreLoggedIn: boolean;
  isMemberLoggedIn: boolean;
}

/**
 * Token refresh request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

/**
 * Session validation response
 */
export interface ValidateSessionResponse {
  valid: boolean;
  store?: StoreSession;
  member?: MemberSession;
  expiresAt?: string;
}

// =============================================================================
// Error Types
// =============================================================================

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'STORE_NOT_FOUND'
  | 'STORE_INACTIVE'
  | 'MEMBER_NOT_FOUND'
  | 'MEMBER_INACTIVE'
  | 'MEMBER_SUSPENDED'
  | 'INVALID_PIN'
  | 'INVALID_PASSWORD'
  | 'INVALID_CARD'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'LICENSE_EXPIRED'
  | 'SESSION_INVALID'
  | 'RATE_LIMITED';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: unknown;
}
