/**
 * Centralized Template Configuration
 *
 * Single source of truth for all FrontDesk template settings and metadata.
 * This eliminates duplicate switch statements across multiple files.
 *
 * Used by:
 * - frontDeskSettingsSlice.ts (applyTemplate reducer)
 * - OperationTemplateSetup.tsx (template selection UI)
 * - OperationTemplatesSection.tsx (template display)
 */

import { FrontDeskSettingsData } from './types';

// Template ID type - matches FrontDeskSettingsData['operationTemplate']
export type TemplateId = FrontDeskSettingsData['operationTemplate'];

// Template settings configuration
export interface TemplateConfig {
  settings: Partial<FrontDeskSettingsData>;
}

// Template display metadata
export interface TemplateMetadata {
  title: string;
  subtitle: string;
  description: string;
  bestFor: string;
  userType: 'Front Desk Staff' | 'Service Provider';
  layoutRatio: { team: number; ticket: number };
  // Additional metadata for OperationTemplateSetup
  teamMode: 'column' | 'tab';
  ticketMode: 'column' | 'tab' | 'none';
  showAppointments: boolean;
  organizeBy: 'busyStatus' | 'clockedStatus';
}

/**
 * Template Settings Configuration
 *
 * Defines the actual settings values applied when a template is selected.
 */
export const TEMPLATE_CONFIGS: Record<TemplateId, TemplateConfig> = {
  frontDeskBalanced: {
    settings: {
      operationTemplate: 'frontDeskBalanced',
      viewWidth: 'wide',
      customWidthPercentage: 40,
      displayMode: 'column',
      combineSections: false,
      showComingAppointments: true,
      organizeBy: 'busyStatus',
    },
  },
  frontDeskTicketCenter: {
    settings: {
      operationTemplate: 'frontDeskTicketCenter',
      viewWidth: 'compact',
      customWidthPercentage: 10,
      displayMode: 'tab',
      combineSections: true,
      showComingAppointments: true,
      organizeBy: 'busyStatus',
    },
  },
  teamWithOperationFlow: {
    settings: {
      operationTemplate: 'teamWithOperationFlow',
      viewWidth: 'wide',
      customWidthPercentage: 80,
      displayMode: 'column',
      combineSections: false,
      showComingAppointments: true,
      organizeBy: 'busyStatus',
    },
  },
  teamInOut: {
    settings: {
      operationTemplate: 'teamInOut',
      viewWidth: 'fullScreen',
      customWidthPercentage: 100,
      displayMode: 'column',
      combineSections: false,
      showComingAppointments: false,
      organizeBy: 'clockedStatus',
    },
  },
};

/**
 * Template Display Metadata
 *
 * Defines how templates are displayed in the UI (titles, descriptions, etc.)
 */
export const TEMPLATE_METADATA: Record<TemplateId, TemplateMetadata> = {
  frontDeskBalanced: {
    title: 'Reception Desk',
    subtitle: 'Balanced View',
    description: 'See both your team and tickets at a glance. Perfect for receptionists who manage walk-ins and appointments.',
    bestFor: 'Front desk staff who coordinate between clients and providers',
    userType: 'Front Desk Staff',
    layoutRatio: { team: 40, ticket: 60 },
    teamMode: 'column',
    ticketMode: 'column',
    showAppointments: true,
    organizeBy: 'busyStatus',
  },
  frontDeskTicketCenter: {
    title: 'Express Queue',
    subtitle: 'Ticket-First View',
    description: 'Maximize ticket visibility for fast-paced environments. Staff info available in a compact sidebar.',
    bestFor: 'High-volume salons where speed is priority',
    userType: 'Front Desk Staff',
    layoutRatio: { team: 10, ticket: 90 },
    teamMode: 'tab',
    ticketMode: 'column',
    showAppointments: true,
    organizeBy: 'busyStatus',
  },
  teamWithOperationFlow: {
    title: 'Provider View',
    subtitle: 'Team-Focused Layout',
    description: 'Large staff cards show current client and upcoming appointments. Small ticket panel for context.',
    bestFor: 'Service providers who manage their own clients',
    userType: 'Service Provider',
    layoutRatio: { team: 80, ticket: 20 },
    teamMode: 'column',
    ticketMode: 'tab',
    showAppointments: true,
    organizeBy: 'busyStatus',
  },
  teamInOut: {
    title: 'Quick Checkout',
    subtitle: 'Simple Clock In/Out',
    description: 'Full-screen team view for easy clock-in and quick checkout. Tap a name to start or complete service.',
    bestFor: 'Low-tech salons, booth rentals, barbershops',
    userType: 'Service Provider',
    layoutRatio: { team: 100, ticket: 0 },
    teamMode: 'column',
    ticketMode: 'none',
    showAppointments: false,
    organizeBy: 'clockedStatus',
  },
};

/**
 * Get template settings by ID
 *
 * @param templateId - The template identifier
 * @returns Partial settings to apply for the template
 */
export function getTemplateSettings(templateId: TemplateId): Partial<FrontDeskSettingsData> {
  return TEMPLATE_CONFIGS[templateId]?.settings || TEMPLATE_CONFIGS.frontDeskBalanced.settings;
}

/**
 * Get template metadata by ID
 *
 * @param templateId - The template identifier
 * @returns Display metadata for the template
 */
export function getTemplateMetadata(templateId: TemplateId): TemplateMetadata {
  return TEMPLATE_METADATA[templateId] || TEMPLATE_METADATA.frontDeskBalanced;
}

/**
 * Get all template IDs
 *
 * @returns Array of all available template IDs
 */
export function getAllTemplateIds(): TemplateId[] {
  return Object.keys(TEMPLATE_CONFIGS) as TemplateId[];
}

/**
 * Check if a template ID is valid
 *
 * @param templateId - The template identifier to check
 * @returns True if the template exists
 */
export function isValidTemplateId(templateId: string): templateId is TemplateId {
  return templateId in TEMPLATE_CONFIGS;
}
