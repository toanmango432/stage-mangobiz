/**
 * Grid styling utilities for StaffSidebar
 *
 * Provides helper functions for calculating grid columns, gaps, and card view modes
 * based on sidebar width and view mode settings.
 */

import type { ViewMode } from '../types';

/**
 * Get Tailwind grid-cols class based on sidebar width and view mode
 * Uses CSS Grid auto-fit with minmax for responsive layout
 */
export function getGridColumns(sidebarWidth: number, viewMode: ViewMode): string {
  if (sidebarWidth <= 100) return 'grid-cols-1';
  if (viewMode === 'compact') {
    if (sidebarWidth < 450) return 'grid-cols-[repeat(auto-fit,minmax(110px,1fr))]';
    if (sidebarWidth < 700) return 'grid-cols-[repeat(auto-fit,minmax(120px,1fr))]';
    return 'grid-cols-[repeat(auto-fit,minmax(130px,1fr))]';
  }
  if (sidebarWidth < 200) return 'grid-cols-auto-fit-card-xs';
  if (sidebarWidth < 550) return 'grid-cols-[repeat(auto-fit,minmax(130px,1fr))]';
  if (sidebarWidth < 800) return 'grid-cols-auto-fit-card-md';
  return 'grid-cols-auto-fit-card-lg';
}

/**
 * Get Tailwind gap and padding classes based on sidebar width and view mode
 */
export function getGapAndPadding(sidebarWidth: number, viewMode: ViewMode): string {
  if (viewMode === 'compact') {
    if (sidebarWidth <= 100) return 'gap-0.5 p-0.5';
    if (sidebarWidth <= 300) return 'gap-1 p-1.5';
    return 'gap-2 p-2';
  }
  return sidebarWidth <= 300 ? 'gap-1.5 p-2' : 'gap-2 p-3';
}

/**
 * Get card view mode based on effective column width
 * Determines whether cards should render as ultra-compact, compact, or normal
 */
export function getCardViewMode(sidebarWidth: number, viewMode: ViewMode): 'ultra-compact' | 'compact' | 'normal' {
  if (sidebarWidth <= 100) return 'ultra-compact';
  const minW = viewMode === 'compact' ? 160 : 210;
  const cols = Math.max(1, Math.floor((sidebarWidth - 32) / minW));
  const effectiveWidth = (sidebarWidth - 32) / cols;
  if (effectiveWidth < 140) return 'ultra-compact';
  if (effectiveWidth < 180) return 'compact';
  return viewMode;
}

/**
 * Get empty state text size class based on sidebar width and view mode
 */
export function getEmptyStateClasses(sidebarWidth: number, viewMode: ViewMode): {
  padding: string;
  textSize: string;
} {
  if (sidebarWidth <= 100) {
    return { padding: 'p-2', textSize: 'text-[9px]' };
  }
  if (viewMode === 'compact') {
    return { padding: 'p-3', textSize: 'text-xs' };
  }
  return { padding: 'p-5', textSize: 'text-sm' };
}
