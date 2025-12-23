/**
 * QuickActionsBar Component
 * Floating action bar with quick access to common calendar actions
 */

import { memo } from 'react';
import { Plus, Search, RefreshCw, Calendar, Filter, Command } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuickActionsBarProps {
  onNewAppointment?: () => void;
  onSearch?: () => void;
  onRefresh?: () => void;
  onJumpToDate?: () => void;
  onToggleFilters?: () => void;
  onOpenCommandPalette?: () => void;
  pendingCount?: number;
  className?: string;
}

export const QuickActionsBar = memo(function QuickActionsBar({
  onNewAppointment,
  onSearch,
  onRefresh,
  onJumpToDate,
  onToggleFilters,
  onOpenCommandPalette,
  pendingCount = 0,
  className,
}: QuickActionsBarProps) {
  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-30',
        'flex items-center gap-2',
        'bg-white/95 backdrop-blur-lg',
        'border border-gray-200 rounded-2xl shadow-lg',
        'px-3 py-2',
        'animate-slide-in-up',
        className
      )}
    >
      {/* New Appointment - Primary Action */}
      {onNewAppointment && (
        <button
          onClick={onNewAppointment}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl',
            'bg-gradient-to-r from-brand-500 to-brand-600',
            'text-white font-semibold text-sm',
            'hover:from-brand-600 hover:to-brand-700',
            'active:scale-95',
            'transition-all duration-200',
            'shadow-md hover:shadow-lg',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
          )}
          title="New Appointment"
          aria-label="Create new appointment"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New</span>
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-8 bg-gray-200" />

      {/* Search */}
      {onSearch && (
        <button
          onClick={onSearch}
          className={cn(
            'p-2.5 rounded-xl',
            'text-gray-700 hover:text-gray-900',
            'hover:bg-gray-100',
            'active:scale-95',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
          )}
          title="Search Appointments"
          aria-label="Search appointments"
        >
          <Search className="w-4 h-4" />
        </button>
      )}

      {/* Refresh */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className={cn(
            'p-2.5 rounded-xl relative',
            'text-gray-700 hover:text-gray-900',
            'hover:bg-gray-100',
            'active:scale-95 active:rotate-180',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
          )}
          title="Refresh Calendar"
          aria-label="Refresh calendar"
        >
          <RefreshCw className="w-4 h-4" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 text-white text-[10px] items-center justify-center font-bold">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            </span>
          )}
        </button>
      )}

      {/* Jump to Date */}
      {onJumpToDate && (
        <button
          onClick={onJumpToDate}
          className={cn(
            'p-2.5 rounded-xl',
            'text-gray-700 hover:text-gray-900',
            'hover:bg-gray-100',
            'active:scale-95',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
          )}
          title="Jump to Date"
          aria-label="Jump to specific date"
        >
          <Calendar className="w-4 h-4" />
        </button>
      )}

      {/* Toggle Filters */}
      {onToggleFilters && (
        <button
          onClick={onToggleFilters}
          className={cn(
            'p-2.5 rounded-xl',
            'text-gray-700 hover:text-gray-900',
            'hover:bg-gray-100',
            'active:scale-95',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
          )}
          title="Toggle Filters"
          aria-label="Toggle filters"
        >
          <Filter className="w-4 h-4" />
        </button>
      )}

      {/* Divider */}
      <div className="w-px h-8 bg-gray-200" />

      {/* Command Palette */}
      {onOpenCommandPalette && (
        <button
          onClick={onOpenCommandPalette}
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-xl',
            'text-gray-700 hover:text-gray-900',
            'hover:bg-gray-100',
            'active:scale-95',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
            'group'
          )}
          title="Open Command Palette (Cmd+K)"
          aria-label="Open command palette"
        >
          <Command className="w-4 h-4" />
          <span className="hidden md:flex items-center gap-1.5 text-xs font-medium">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded group-hover:border-gray-300">
              ⌘
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded group-hover:border-gray-300">
              K
            </kbd>
          </span>
        </button>
      )}
    </div>
  );
});
