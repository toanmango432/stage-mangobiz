import type { FrontDeskSettingsData } from '../frontdesk-settings/FrontDeskSettings';

/**
 * Props for the OperationTemplateSetup component
 */
export interface OperationTemplateSetupProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: FrontDeskSettingsData;
  onSettingsChange: (settings: Partial<FrontDeskSettingsData>) => void;
}

/**
 * Quick answers state for the template wizard questions
 */
export interface QuickAnswers {
  primaryFocus: 'frontDesk' | 'staff';
  operationStyle: 'flow' | 'inOut';
  showAppointments: boolean;
}

/**
 * Extended template details with computed ratios for UI display
 */
export interface TemplateDetails {
  title: string;
  subtitle: string;
  description: string;
  bestFor: string;
  userType: string;
  organizeBy: string;
  teamMode: string;
  ticketMode: string;
  showAppointments: boolean;
  layoutRatio: { team: number; ticket: number };
  teamRatio: number;
  ticketRatio: number;
}
