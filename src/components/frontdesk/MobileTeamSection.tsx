/**
 * MobileTeamSection - Touch-optimized team view for mobile devices
 * Features:
 * - Vertical staff cards matching the app design
 * - Large touch targets (48px minimum)
 * - Quick status filters
 * - Haptic feedback on interactions
 * - Compact/Normal view toggle
 */

import { useState, useMemo, memo } from 'react';
import { Users, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useTickets } from '../../hooks/useTicketsCompat';
import { haptics } from '../../utils/haptics';
import { StaffCardVertical, type StaffMember, type ViewMode } from '../StaffCard/index';

interface MobileTeamSectionProps {
  className?: string;
}

// Convert UIStaff to StaffMember format for StaffCardVertical
const convertToStaffMember = (staff: any): StaffMember => {
  const staffId = typeof staff.id === 'string' ? parseInt(staff.id.replace(/\D/g, '')) || 1 : staff.id;
  return {
    id: staffId,
    name: staff.name,
    time: staff.time || '',
    image: staff.image || '',
    status: staff.status || 'ready',
    color: staff.color || '#6B7280',
    count: staff.count || 0,
    turnCount: staff.turnCount,
    lastServiceTime: staff.lastServiceTime,
    nextAppointmentTime: staff.nextAppointmentTime,
  };
};

export const MobileTeamSection = memo(function MobileTeamSection({
  className = '',
}: MobileTeamSectionProps) {
  const { staff = [] } = useTickets();
  const [filter, setFilter] = useState<'all' | 'ready' | 'busy' | 'off'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // View mode state - persisted in localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('mobileTeamViewMode');
    return (saved === 'compact' || saved === 'normal') ? saved : 'compact';
  });

  const handleViewModeToggle = () => {
    haptics.selection();
    const newMode = viewMode === 'compact' ? 'normal' : 'compact';
    setViewMode(newMode);
    localStorage.setItem('mobileTeamViewMode', newMode);
  };

  // Calculate staff counts
  const counts = useMemo(() => {
    const all = staff.length;
    const ready = staff.filter((s: any) => s.status === 'ready').length;
    const busy = staff.filter((s: any) => s.status === 'busy').length;
    const off = staff.filter((s: any) => s.status === 'off').length;
    return { all, ready, busy, off };
  }, [staff]);

  // Filter staff
  const filteredStaff = useMemo(() => {
    return staff.filter((s: any) => {
      const matchesFilter = filter === 'all' || s.status === filter;
      const matchesSearch = !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [staff, filter, searchQuery]);

  // Group by status for grid view
  const groupedStaff = useMemo(() => {
    const ready = filteredStaff.filter((s: any) => s.status === 'ready');
    const busy = filteredStaff.filter((s: any) => s.status === 'busy');
    const off = filteredStaff.filter((s: any) => s.status === 'off');
    return { ready, busy, off };
  }, [filteredStaff]);

  const handleFilterChange = (newFilter: typeof filter) => {
    haptics.selection();
    setFilter(newFilter);
  };

  // Get current count based on filter
  const currentCount = filter === 'all' ? counts.all :
                       filter === 'ready' ? counts.ready :
                       filter === 'busy' ? counts.busy : counts.off;

  return (
    <div className={`flex flex-col bg-white overflow-hidden ${className}`}>
      {/* Row 1: Filter pills as tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-2 py-2">
        <div className="grid grid-cols-4 gap-1">
          {/* All filter */}
          <button
            onClick={() => handleFilterChange('all')}
            className={`flex items-center justify-center gap-1 px-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-gray-800 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Users size={14} />
            <span className="truncate">All</span>
            <span className={`min-w-[18px] px-1 py-0.5 rounded-full text-[10px] font-bold ${
              filter === 'all' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {counts.all}
            </span>
          </button>

          {/* Ready filter */}
          <button
            onClick={() => handleFilterChange('ready')}
            className={`flex items-center justify-center gap-1 px-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
              filter === 'ready'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="truncate">Ready</span>
            <span className={`min-w-[18px] px-1 py-0.5 rounded-full text-[10px] font-bold ${
              filter === 'ready' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {counts.ready}
            </span>
          </button>

          {/* Busy filter */}
          <button
            onClick={() => handleFilterChange('busy')}
            className={`flex items-center justify-center gap-1 px-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
              filter === 'busy'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="truncate">Busy</span>
            <span className={`min-w-[18px] px-1 py-0.5 rounded-full text-[10px] font-bold ${
              filter === 'busy' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {counts.busy}
            </span>
          </button>

          {/* Off filter */}
          <button
            onClick={() => handleFilterChange('off')}
            className={`flex items-center justify-center gap-1 px-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
              filter === 'off'
                ? 'bg-gray-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="truncate">Off</span>
            <span className={`min-w-[18px] px-1 py-0.5 rounded-full text-[10px] font-bold ${
              filter === 'off' ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {counts.off}
            </span>
          </button>
        </div>
      </div>

      {/* Row 2: Metrics & View Settings */}
      <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Metrics */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{currentCount}</span>
            <span className="text-xs text-gray-500">
              {currentCount === 1 ? 'member' : 'members'}
            </span>
          </div>

          {/* Right: Compact/Normal Toggle */}
          <button
            onClick={handleViewModeToggle}
            className={`p-2 rounded-lg transition-all min-w-[40px] min-h-[40px] flex items-center justify-center ${
              viewMode === 'compact'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {viewMode === 'compact' ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
      </div>

      {/* Row 3: Search bar */}
      <div className="flex-shrink-0 px-3 py-2 bg-white border-b border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-9 rounded-lg border border-gray-200 bg-gray-50
                     text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2
                     focus:ring-orange-500/20 focus:border-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full
                       hover:bg-gray-100 active:bg-gray-200"
            >
              <X size={14} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Staff content - Grid of vertical staff cards */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-4 pt-3 bg-white">
        {filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <Users size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No team members found</p>
          </div>
        ) : filter === 'all' ? (
          // Grouped view when "All" is selected
          <div className="space-y-5">
            {/* Ready section */}
            {groupedStaff.ready.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Ready ({groupedStaff.ready.length})
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {groupedStaff.ready.map((s: any) => (
                    <StaffCardVertical
                      key={s.id}
                      staff={convertToStaffMember(s)}
                      viewMode={viewMode}
                      onClick={() => haptics.selection()}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Busy section */}
            {groupedStaff.busy.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Busy ({groupedStaff.busy.length})
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {groupedStaff.busy.map((s: any) => (
                    <StaffCardVertical
                      key={s.id}
                      staff={convertToStaffMember(s)}
                      viewMode={viewMode}
                      onClick={() => haptics.selection()}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Off section */}
            {groupedStaff.off.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Off ({groupedStaff.off.length})
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {groupedStaff.off.map((s: any) => (
                    <StaffCardVertical
                      key={s.id}
                      staff={convertToStaffMember(s)}
                      viewMode={viewMode}
                      onClick={() => haptics.selection()}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Grid view for filtered results
          <div className="grid grid-cols-2 gap-3">
            {filteredStaff.map((s: any) => (
              <StaffCardVertical
                key={s.id}
                staff={convertToStaffMember(s)}
                viewMode={viewMode}
                onClick={() => haptics.selection()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default MobileTeamSection;
