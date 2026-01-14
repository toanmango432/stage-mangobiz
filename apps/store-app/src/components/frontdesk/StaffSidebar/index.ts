/**
 * StaffSidebar Module - Barrel Export
 *
 * This module provides the team/staff management sidebar for the Front Desk.
 * Split into smaller files for maintainability (target: <300 lines per file).
 *
 * Module Structure:
 * - StaffSidebar.tsx: Main component
 * - types.ts: TypeScript interfaces
 * - hooks/: Custom React hooks
 *   - useStaffTicketInfo: Get ticket info for staff cards
 *   - useStaffAppointments: Get appointment & last service times
 * - utils/: Pure utility functions
 *   - staffHelpers: ID matching, image generation, status determination
 */

// Main component - re-export from original location for backwards compatibility
// TODO: Move StaffSidebar.tsx into this directory after verifying hooks work
export { StaffSidebar, determineStaffStatus } from '../StaffSidebar';

// Types
export type {
  StaffSidebarProps,
  StaffCounts,
  ActiveTicket,
  CurrentTicketInfo,
  StaffTicketInfoResult,
  ViewMode,
  WidthType,
  StaffMemberWithInfo,
  UIStaff,
  UITicket,
  LocalAppointment,
  TeamSettings,
  FrontDeskSettingsData,
} from './types';

// Hooks
export { useStaffTicketInfo } from './hooks/useStaffTicketInfo';
export { useStaffNextAppointment, useStaffLastServiceTime } from './hooks/useStaffAppointments';

// Utils
export {
  findStaffByNumericId,
  isTicketForStaff,
  getStaffImage,
  staffIdToNumber,
} from './utils/staffHelpers';
