/**
 * SwitchUserModal Types
 *
 * Type definitions for the switch user modal and its sub-components.
 */

import type { MemberSession } from '../../../services/supabase/authService';
import type { LoginContext, PinLockoutInfo, GraceInfo } from '@/types/memberAuth';

/** Redux MemberSession type (from authSlice) */
export interface ReduxMemberSession {
  memberId: string;
  memberName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'owner' | 'manager' | 'staff' | 'receptionist' | 'junior' | 'admin';
  avatarUrl?: string;
  permissions?: Record<string, boolean>;
}

/** Props for the SwitchUserModal component */
export interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (member: MemberSession) => void;
  /** Login context - determines verification method */
  loginContext?: LoginContext;
  /** Online status - affects available verification methods */
  isOnline?: boolean;
}

/** Steps in the switch user flow */
export type Step = 'select' | 'pin' | 'password' | 'success';

/** Extended member data for display with PIN status */
export interface DisplayMember extends MemberSession {
  hasPinSetup?: boolean;
  lockoutInfo?: PinLockoutInfo;
  graceInfo?: GraceInfo;
}

/** Props for the MemberList component */
export interface MemberListProps {
  members: DisplayMember[];
  currentMember: ReduxMemberSession | null;
  fetchingMembers: boolean;
  error: string | null;
  isOnline: boolean;
  loginContext: LoginContext;
  onMemberSelect: (member: DisplayMember) => void;
  onLogoutCurrentMember: () => void;
  onRetry: () => void;
}

/** Props for the PinStep component */
export interface PinStepProps {
  selectedMember: DisplayMember;
  pin: string;
  error: string | null;
  loading: boolean;
  loginContext: LoginContext;
  isOnline: boolean;
  onPinChange: (value: string) => void;
  onPinComplete: (completedPin: string) => void;
  onPinSubmit: () => void;
}

/** Props for the PasswordStep component */
export interface PasswordStepProps {
  selectedMember: DisplayMember;
  password: string;
  showPassword: boolean;
  error: string | null;
  loading: boolean;
  passwordInputRef: React.RefObject<HTMLInputElement>;
  onPasswordChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onSubmit: (e?: React.FormEvent) => void;
}

/** Props for the SuccessStep component */
export interface SuccessStepProps {
  selectedMember: DisplayMember;
}
