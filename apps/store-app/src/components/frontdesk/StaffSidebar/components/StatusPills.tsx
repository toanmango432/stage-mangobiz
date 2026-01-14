/**
 * StatusPills Component
 *
 * Renders filter pills for staff status (Ready, Busy, Clocked In, Clocked Out).
 * Adapts to sidebar width with responsive labels and scrolling.
 */

import { STAFF_STATUS_OPTIONS } from '../constants';
import type { StaffCounts } from '../types';

interface StatusPillsProps {
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
  staffCounts: StaffCounts;
  organizeBy: 'busyStatus' | 'clockedStatus';
  sidebarWidth: number;
  isUltraCompact?: boolean;
  isCompact?: boolean;
}

export function StatusPills({
  statusFilter,
  setStatusFilter,
  staffCounts,
  organizeBy,
  sidebarWidth,
  isUltraCompact = false,
  isCompact = false,
}: StatusPillsProps) {
  // Common classes for all pills
  const pillBaseClasses = 'flex items-center transition-all duration-200 transform';
  const pillSpacing = isUltraCompact ? 'space-x-1' : isCompact ? 'space-x-1.5' : 'space-x-2';
  const pillPadding = isUltraCompact ? 'px-1.5 py-0.5' : isCompact ? 'px-3 py-1.5' : 'px-4 py-1.5';
  const badgeClasses = 'rounded-full font-semibold';
  const badgePadding = isUltraCompact ? 'px-1 py-0.5' : isCompact ? 'px-1.5 py-0.5' : 'px-2 py-0.5';
  const textSize = isUltraCompact ? 'text-[9px]' : isCompact ? 'text-xs' : 'text-sm';
  const badgeTextSize = isUltraCompact ? 'text-[7px]' : isCompact ? 'text-[10px]' : 'text-xs';

  // Determine if we should use shortened labels based on width or ultra compact mode
  const useShortLabels = sidebarWidth < 360 || isUltraCompact;

  // All pill (always visible) - GRAY
  const allPill = (
    <button
      onClick={() => setStatusFilter(null)}
      className={`${pillBaseClasses} ${pillPadding} rounded-full flex-shrink-0
        ${statusFilter === null
          ? 'bg-gray-500 text-white font-bold shadow-md scale-105 ring-2 ring-gray-400/30'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
        }`}
      aria-label={`All, ${staffCounts.total}`}
    >
      <span className={`${textSize} ${statusFilter === null ? 'font-bold' : 'font-normal'}`}>
        {isUltraCompact ? 'A' : 'All'}
      </span>
      <span
        className={`${badgeClasses} ${badgeTextSize} ${badgePadding}
        ${statusFilter === null
            ? 'bg-white text-gray-700 shadow-sm font-bold'
            : 'bg-gray-100 text-gray-600'
          }`}
      >
        {staffCounts.total}
      </span>
    </button>
  );

  // Generate status pills based on organization mode
  const statusPills = organizeBy === 'busyStatus'
    ? STAFF_STATUS_OPTIONS.filter((status) => status.type === 'busyStatus').map((status) => {
        const isActive = statusFilter === status.id;
        // Ready = GREEN, Busy = RED
        const activeColors = {
          ready: 'bg-green-600 text-white font-bold shadow-md scale-105 ring-2 ring-green-400/30',
          busy: 'bg-red-600 text-white font-bold shadow-md scale-105 ring-2 ring-red-400/30',
        };
        const inactiveColors = {
          ready: 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200',
          busy: 'bg-white text-gray-700 hover:bg-red-50 border border-gray-200',
        };
        const bgColor = isActive
          ? activeColors[status.id as keyof typeof activeColors]
          : inactiveColors[status.id as keyof typeof inactiveColors];
        const badgeBg = isActive
          ? status.id === 'ready'
            ? 'bg-white text-green-700 shadow-sm font-bold'
            : 'bg-white text-red-700 shadow-sm font-bold'
          : 'bg-gray-100 text-gray-600';

        // Use ultra-compact labels when in ultra-compact mode
        const label = isUltraCompact ? (status.id === 'ready' ? 'R' : 'B') : status.label;

        return (
          <button
            key={status.id}
            onClick={() => setStatusFilter(status.id)}
            className={`${pillBaseClasses} ${pillPadding} rounded-full flex-shrink-0 ${bgColor}`}
            aria-label={`${status.label}, ${status.id === 'ready' ? staffCounts.ready : staffCounts.busy}`}
          >
            <span className={`${textSize} ${isActive ? 'font-bold' : 'font-normal'}`}>
              {label}
            </span>
            <span className={`${badgeClasses} ${badgeTextSize} ${badgePadding} ${badgeBg}`}>
              {status.id === 'ready' ? staffCounts.ready : staffCounts.busy}
            </span>
          </button>
        );
      })
    : // Clocked In/Out pills with responsive labels
      STAFF_STATUS_OPTIONS.filter((status) => status.type === 'clockedStatus').map((status) => {
        const isActive = statusFilter === status.id;
        const activeColors = {
          clockedIn: 'bg-green-600 text-white font-bold shadow-md scale-105 ring-2 ring-green-200',
          clockedOut: 'bg-gray-500 text-white font-bold shadow-md scale-105 ring-2 ring-gray-200',
        };
        const inactiveColors =
          isUltraCompact || isCompact
            ? {
                clockedIn: 'bg-gray-50 text-gray-500 hover:bg-green-50/50 border border-gray-200/80',
                clockedOut: 'bg-gray-50 text-gray-500 hover:bg-gray-100/50 border border-gray-200/80',
              }
            : {
                clockedIn: 'bg-white text-gray-700 hover:bg-green-50 border border-gray-200',
                clockedOut: 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200',
              };
        const bgColor = isActive
          ? activeColors[status.id as keyof typeof activeColors]
          : inactiveColors[status.id as keyof typeof inactiveColors];
        const badgeBg = isActive
          ? status.id === 'clockedIn'
            ? 'bg-white text-green-700 shadow-sm'
            : 'bg-white text-gray-700 shadow-sm'
          : isUltraCompact || isCompact
            ? 'bg-gray-200/70 text-gray-500'
            : 'bg-gray-100 text-gray-600';

        // Use ultra-compact labels for ultra-compact mode
        const label = isUltraCompact
          ? status.id === 'clockedIn'
            ? 'I'
            : 'O'
          : useShortLabels
            ? status.id === 'clockedIn'
              ? 'In'
              : 'Out'
            : status.label;

        return (
          <button
            key={status.id}
            onClick={() => setStatusFilter(status.id)}
            className={`${pillBaseClasses} ${pillPadding} rounded-full flex-shrink-0 ${bgColor}`}
            aria-label={`${status.label}, ${status.id === 'clockedIn' ? staffCounts.clockedIn : staffCounts.clockedOut}`}
          >
            <span className={`${textSize} ${isActive ? 'font-bold' : 'font-normal'}`}>
              {label}
            </span>
            <span className={`${badgeClasses} ${badgeTextSize} ${badgePadding} ${badgeBg}`}>
              {status.id === 'clockedIn' ? staffCounts.clockedIn : staffCounts.clockedOut}
            </span>
          </button>
        );
      });

  // Container with horizontal scrolling for narrow widths
  const scrollableContainer = sidebarWidth < 300 ? 'overflow-x-auto snap-x scrollbar-hide' : 'overflow-visible';

  return (
    <div
      className={`flex items-center ${pillSpacing} ${scrollableContainer}`}
      style={
        sidebarWidth < 300
          ? {
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
            }
          : {}
      }
    >
      {allPill}
      {statusPills}
    </div>
  );
}
