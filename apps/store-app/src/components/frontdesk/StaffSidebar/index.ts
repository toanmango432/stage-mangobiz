/**
 * StaffSidebar Module - Barrel Export
 *
 * This module provides the team/staff management sidebar for the Front Desk.
 * Split into smaller files for maintainability (target: <300 lines per file).
 *
 * Module Structure:
 * - StaffSidebar.tsx: Main component (~300 lines after split)
 * - types.ts: TypeScript interfaces
 * - constants.ts: Configuration values and status definitions
 * - hooks/: Custom React hooks
 *   - useStaffTicketInfo: Get ticket info for staff cards
 *   - useStaffAppointments: Get appointment & last service times
 *   - useSidebarWidth: Width management with localStorage persistence
 *   - useViewMode: View mode (normal/compact) management
 * - components/: Sub-components
 *   - StatusPills: Filter pills for staff status
 *   - StaffSidebarHeader: Header with controls and search
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

// Constants
export { STAFF_STATUS_OPTIONS, DEFAULT_SIDEBAR_WIDTH, WIDTH_PRESETS, STORAGE_KEYS } from './constants';

// Hooks
export { useStaffTicketInfo } from './hooks/useStaffTicketInfo';
export { useStaffNextAppointment, useStaffLastServiceTime } from './hooks/useStaffAppointments';
export { useSidebarWidth } from './hooks/useSidebarWidth';
export { useViewMode } from './hooks/useViewMode';

// Components
export { StatusPills } from './components/StatusPills';
export { StaffSidebarHeader } from './components/StaffSidebarHeader';

// Utils
export {
  findStaffByNumericId,
  isTicketForStaff,
  getStaffImage,
  staffIdToNumber,
} from './utils/staffHelpers';
