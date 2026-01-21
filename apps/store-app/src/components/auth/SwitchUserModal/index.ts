/**
 * SwitchUserModal Module
 *
 * Barrel exports for the SwitchUserModal component and its sub-components.
 */

export { SwitchUserModal } from './SwitchUserModal';
export { MemberList } from './MemberList';
export { PinStep } from './PinStep';
export { PasswordStep } from './PasswordStep';
export { SuccessStep } from './SuccessStep';
export { useSwitchUser } from './hooks/useSwitchUser';

// Types
export type {
  SwitchUserModalProps,
  Step,
  DisplayMember,
  ReduxMemberSession,
  MemberListProps,
  PinStepProps,
  PasswordStepProps,
  SuccessStepProps,
} from './types';

// Utilities
export { getInitials, getRoleLabel, getRoleColor } from './utils';

// Default export for backward compatibility
export { SwitchUserModal as default } from './SwitchUserModal';
