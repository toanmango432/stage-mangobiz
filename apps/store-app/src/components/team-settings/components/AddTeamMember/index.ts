/**
 * AddTeamMember Module
 * Multi-step wizard for adding new team members
 */

// Main component
export { AddTeamMember } from './AddTeamMember';

// Types
export type { WizardStep, BasicInfo, LoginCredentials, PasswordSetupMethod } from './types';

// Constants
export { WIZARD_STEPS } from './constants';

// Utilities
export {
  generateUUID,
  generateRandomPassword,
  generateRandomPIN,
  generateInviteToken,
  sendCredentialsNotification,
  mapRoleToSupabase,
  getDynamicRoleLabels,
} from './utils';

// Hooks
export { useTeamMemberForm } from './hooks';

// Sub-components (for testing or custom composition)
export {
  BasicInfoSection,
  ContactSection,
  ScheduleSection,
  ServicesSection,
  ReviewSection,
  SuccessSection,
} from './components';
