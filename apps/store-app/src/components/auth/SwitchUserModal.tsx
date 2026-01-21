/**
 * SwitchUserModal Re-export
 *
 * This file re-exports from the SwitchUserModal module for backward compatibility.
 * The component has been refactored into a module structure at:
 * ./SwitchUserModal/
 *
 * @see ./SwitchUserModal/SwitchUserModal.tsx - Main component
 * @see ./SwitchUserModal/MemberList.tsx - Member selection list
 * @see ./SwitchUserModal/PinStep.tsx - PIN entry step
 * @see ./SwitchUserModal/PasswordStep.tsx - Password entry step
 * @see ./SwitchUserModal/SuccessStep.tsx - Success message
 * @see ./SwitchUserModal/hooks/useSwitchUser.ts - State management hook
 */

export { SwitchUserModal, default } from './SwitchUserModal/index';
export type { SwitchUserModalProps, Step, DisplayMember } from './SwitchUserModal/types';
