/**
 * AddTeamMember Constants
 */

import type { WizardStepConfig } from './types';

export const WIZARD_STEPS: WizardStepConfig[] = [
  { id: 'basics', label: 'Basic Info', description: 'Personal details & role' },
  { id: 'schedule', label: 'Schedule', description: 'Working hours' },
  { id: 'services', label: 'Services', description: 'Assign services' },
  { id: 'review', label: 'Review', description: 'Confirm & create' },
];
