/**
 * StaffSidebar Constants
 *
 * Configuration values and status definitions for the StaffSidebar module.
 */

/**
 * Staff status filter options
 */
export const STAFF_STATUS_OPTIONS = [
  // For Busy/Ready organization
  {
    id: 'ready',
    label: 'Ready',
    shortLabel: 'R',
    type: 'busyStatus' as const,
  },
  {
    id: 'busy',
    label: 'Busy',
    shortLabel: 'B',
    type: 'busyStatus' as const,
  },
  // For Clocked In/Out organization
  {
    id: 'clockedIn',
    label: 'Clocked In',
    shortLabel: 'CI',
    type: 'clockedStatus' as const,
  },
  {
    id: 'clockedOut',
    label: 'Clocked Out',
    shortLabel: 'CO',
    type: 'clockedStatus' as const,
  },
];

/**
 * Default sidebar width in pixels
 */
export const DEFAULT_SIDEBAR_WIDTH = 256;

/**
 * Width presets for sidebar
 */
export const WIDTH_PRESETS = {
  ultraCompact: 100,
  compact: 300,
  wide: 0.4, // 40% of window width
  fullScreen: 1.0, // 100% of window width
} as const;

/**
 * LocalStorage keys for persisting sidebar state
 */
export const STORAGE_KEYS = {
  viewMode: 'staffSidebarViewMode',
  width: 'staffSidebarWidth',
  widthType: 'staffSidebarWidthType',
  widthPercentage: 'staffSidebarWidthPercentage',
  teamSettings: 'teamSettings',
} as const;

/**
 * Grid class mapping for different sidebar widths and view modes
 */
export const GRID_CLASSES = {
  ultraCompact: 'grid-cols-1',
  compact: {
    small: 'grid-cols-[repeat(auto-fit,minmax(110px,1fr))]',
    medium: 'grid-cols-[repeat(auto-fit,minmax(120px,1fr))]',
    large: 'grid-cols-[repeat(auto-fit,minmax(130px,1fr))]',
  },
  normal: {
    small: 'grid-cols-auto-fit-card-xs',
    medium: 'grid-cols-[repeat(auto-fit,minmax(130px,1fr))]',
    large: 'grid-cols-auto-fit-card-md',
    xlarge: 'grid-cols-auto-fit-card-lg',
  },
} as const;
