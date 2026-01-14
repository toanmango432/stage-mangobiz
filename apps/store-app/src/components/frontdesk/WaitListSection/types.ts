/**
 * WaitListSection Types
 *
 * Centralized type definitions for the WaitListSection module.
 */

import type { FrontDeskSettingsData } from '@/components/frontdesk-settings/types';

/**
 * Props for the main WaitListSection component
 */
export interface WaitListSectionProps {
  isMinimized?: boolean;
  onMinimize?: (minimized: boolean) => void;
  settings?: FrontDeskSettingsData;
  forceWide?: boolean;
  className?: string;
}

/**
 * View mode for list-style ticket cards
 */
export type ListViewMode = 'compact' | 'normal';

/**
 * View mode for grid-style ticket cards
 */
export type GridViewMode = 'grid-compact' | 'grid-normal';

/**
 * Combined view mode type
 */
export type WaitListViewMode = 'list' | 'grid';

/**
 * Sort options for waitlist tickets
 */
export type WaitListSortBy = 'time' | 'priority' | 'name' | 'position';

/**
 * Filter tab options
 */
export type WaitListFilterTab = 'all' | 'priority' | 'regular' | 'vip';

/**
 * Props for sortable list item wrapper
 */
export interface SortableListItemProps {
  ticket: any;
  viewMode: ListViewMode;
  onAssign: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  isDragDisabled?: boolean;
}

/**
 * Props for sortable grid item wrapper
 */
export interface SortableGridItemProps {
  ticket: any;
  viewMode: GridViewMode;
  onAssign: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  isDragDisabled?: boolean;
}
