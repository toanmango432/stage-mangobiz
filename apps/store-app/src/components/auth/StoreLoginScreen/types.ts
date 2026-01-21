/**
 * StoreLoginScreen Types
 *
 * Shared type definitions for the StoreLoginScreen module.
 */

import type { StoreAuthState } from '../../../services/storeAuthManager';

/** Login mode: member (Supabase Auth) or store (store credentials) */
export type LoginMode = 'store' | 'member';

/** Props for StoreLoginScreen component */
export interface StoreLoginScreenProps {
  onLoggedIn: () => void;
  initialState?: StoreAuthState;
}

/** Props for LoginForm component (store login) */
export interface LoginFormProps {
  storeId: string;
  setStoreId: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  onLogin: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  compact?: boolean;
}

/** Props for MemberLoginForm component */
export interface MemberLoginFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  onLogin: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isOnline: boolean;
  onForgotPassword?: () => void;
}

/** Props for PinScreen component */
export interface PinScreenProps {
  storeName: string;
  members: Array<{
    memberId: string;
    memberName: string;
    firstName?: string;
    avatarUrl?: string;
  }>;
  loadingMembers: boolean;
  pin: string;
  error: string | null;
  success: string | null;
  isLoading: boolean;
  onPinChange: (value: string) => void;
  onPinKeyPress: (digit: string) => void;
  onPinBackspace: () => void;
  onPinKeyDown: (e: React.KeyboardEvent) => void;
  onLogoutStore: () => void;
}

/** Member info for PIN setup modal */
export interface PinSetupMemberInfo {
  memberId: string;
  name: string;
}
