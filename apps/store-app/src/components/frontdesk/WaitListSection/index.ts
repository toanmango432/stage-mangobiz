/**
 * WaitListSection Module - Barrel Export
 *
 * This module provides the waiting queue section for the Front Desk.
 * Split into smaller files for maintainability (target: <300 lines per file).
 *
 * Module Structure:
 * - WaitListSection.tsx: Main component
 * - types.ts: TypeScript interfaces
 * - components/: Sub-components
 *   - SortableItems: Drag-and-drop wrappers for ticket cards
 */

// Main component - re-export from original location
export { WaitListSection } from '../WaitListSection';

// Types
export type {
  WaitListSectionProps,
  ListViewMode,
  GridViewMode,
  WaitListViewMode,
  WaitListSortBy,
  WaitListFilterTab,
  SortableListItemProps,
  SortableGridItemProps,
} from './types';

// Components
export { SortableListItem, SortableGridItem } from './components';
