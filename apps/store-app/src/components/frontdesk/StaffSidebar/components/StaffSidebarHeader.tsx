/**
 * StaffSidebarHeader Component
 *
 * Renders the header section of the StaffSidebar with:
 * - Team title and icon
 * - Search, filter, view mode toggle, and settings buttons
 * - Status filter pills
 * - Search input (when visible)
 */

import Tippy from '@tippyjs/react';
import { Search, Filter, Users, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { StatusPills } from './StatusPills';
import type { StaffCounts, ViewMode } from '../types';
import type { TeamSettings } from '@/components/TeamSettingsPanel';

interface StaffSidebarHeaderProps {
  sidebarWidth: number;
  viewMode: ViewMode;
  useNewTeamStyling: boolean;
  teamSettings: TeamSettings;
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
  staffCounts: StaffCounts;
  organizeBy: 'busyStatus' | 'clockedStatus';
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleViewMode: () => void;
  onOpenSettings: () => void;
}

export function StaffSidebarHeader({
  sidebarWidth,
  viewMode,
  useNewTeamStyling,
  teamSettings,
  statusFilter,
  setStatusFilter,
  staffCounts,
  organizeBy,
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery,
  toggleViewMode,
  onOpenSettings,
}: StaffSidebarHeaderProps) {
  // Get the appropriate view mode icon
  const getViewModeIcon = () => {
    if (viewMode === 'normal') {
      return <ChevronUp size={16} />;
    }
    return <ChevronDown size={16} />;
  };

  // Get the appropriate view mode label
  const getViewModeLabel = () => {
    if (viewMode === 'normal') {
      return 'Switch to compact view';
    }
    return 'Switch to normal view';
  };

  // Ultra compact header for narrow width - Modern single row design
  if (sidebarWidth <= 100) {
    const headerBg = useNewTeamStyling
      ? 'border-b border-teal-300/40 bg-gradient-to-r from-teal-50/90 to-teal-100/85 -mt-0'
      : 'border-b border-gray-200/60 bg-white/95 backdrop-blur-sm';

    return (
      <div className={headerBg}>
        <div className="flex flex-col p-1.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div
              className={
                useNewTeamStyling
                  ? 'text-teal-600 p-1 rounded-lg flex items-center justify-center'
                  : 'bg-gradient-to-br from-[#3BB09A] to-[#2D9B85] text-white p-1 rounded-lg flex items-center justify-center shadow-md'
              }
            >
              <Users size={12} strokeWidth={2.5} />
            </div>
            <Tippy content="Team Settings">
              <button
                className={
                  useNewTeamStyling
                    ? 'p-1 rounded-lg bg-teal-100/50 hover:bg-teal-100 text-teal-700 transition-all duration-200'
                    : 'p-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-[#3BB09A] border border-gray-200/50 shadow-sm transition-all duration-200'
                }
                onClick={onOpenSettings}
                aria-label="Open team settings"
              >
                <Settings size={12} />
              </button>
            </Tippy>
          </div>
          <div className="w-full pt-0.5">
            <StatusPills
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              staffCounts={staffCounts}
              organizeBy={organizeBy}
              sidebarWidth={sidebarWidth}
              isUltraCompact={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // Compact or Normal view header
  const headerBg = useNewTeamStyling
    ? 'sticky top-0 z-10 border-b border-teal-300/40 bg-gradient-to-r from-teal-50/90 to-teal-100/85'
    : 'sticky top-0 z-10 border-b border-gray-200/60 bg-white/95 backdrop-blur-sm';

  const iconButtonClass = useNewTeamStyling
    ? 'p-1.5 rounded-lg text-teal-600 hover:text-teal-700 hover:bg-teal-100/50 transition-all duration-200'
    : 'p-1.5 rounded-lg text-gray-600 hover:text-[#3BB09A] hover:bg-gray-100 transition-all duration-200';

  const titleIconClass = useNewTeamStyling
    ? 'text-teal-600 p-1.5 rounded-xl flex-shrink-0'
    : 'bg-gradient-to-br from-[#3BB09A] to-[#2D9B85] p-1.5 rounded-xl shadow-lg text-white flex-shrink-0';

  return (
    <div className={headerBg}>
      <div className="px-3 py-2.5">
        {/* Row 1: Team title + Action icons (always together) */}
        <div className="flex items-center justify-between gap-3 mb-2">
          {/* Team title */}
          <div className={titleIconClass}>
            <Users size={16} />
          </div>
          <h2
            className={`text-base font-bold tracking-tight ${
              useNewTeamStyling ? 'text-teal-700' : 'text-gray-900'
            }`}
          >
            Team
          </h2>

          {/* Action icons - Always on row 1 */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {teamSettings.showSearch && (
              <Tippy content="Search">
                <button className={iconButtonClass} onClick={() => setShowSearch(!showSearch)}>
                  <Search size={15} />
                </button>
              </Tippy>
            )}
            <Tippy content="Filter">
              <button className={iconButtonClass}>
                <Filter size={15} />
              </button>
            </Tippy>
            {teamSettings.showMinimizeExpandIcon && (
              <Tippy content={getViewModeLabel()}>
                <button className={iconButtonClass} onClick={toggleViewMode}>
                  {getViewModeIcon()}
                </button>
              </Tippy>
            )}
            <Tippy content="Team Settings">
              <button className={iconButtonClass} onClick={onOpenSettings}>
                <Settings size={15} />
              </button>
            </Tippy>
          </div>
        </div>

        {/* Row 2: Status pills (always on separate row) */}
        <div className="flex items-center gap-1.5">
          <StatusPills
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            staffCounts={staffCounts}
            organizeBy={organizeBy}
            sidebarWidth={sidebarWidth}
          />
        </div>
      </div>

      {/* Search input */}
      {showSearch && (
        <div className="px-3 pb-2.5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search technicians..."
              className="w-full py-2 pl-9 pr-3 rounded-lg text-gray-800 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3BB09A]/50 focus:border-[#3BB09A] shadow-sm bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
