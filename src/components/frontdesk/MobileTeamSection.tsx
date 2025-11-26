/**
 * MobileTeamSection - Touch-optimized team view for mobile devices
 * Features:
 * - Vertical staff cards matching the app design
 * - Large touch targets (48px minimum)
 * - Quick status filters
 * - Haptic feedback on interactions
 */

import { useState, useMemo, memo } from 'react';
import { Users, Search, X } from 'lucide-react';
import { useTickets } from '../../hooks/useTicketsCompat';
import { haptics } from '../../utils/haptics';
import { StaffCardVertical, type StaffMember } from '../StaffCard/index';

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

  return (
    <div className={`flex flex-col bg-gray-50 overflow-hidden ${className}`}>
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-200 bg-white
                     text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2
                     focus:ring-teal-500/20 focus:border-teal-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full
                       hover:bg-gray-100 active:bg-gray-200"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* All filter */}
          <button
            onClick={() => handleFilterChange('all')}
            className={`flex-shrink-0 h-9 px-4 rounded-full font-medium text-sm transition-all
                      ${filter === 'all'
                        ? 'bg-gray-800 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            All <span className="ml-1.5 opacity-80">{counts.all}</span>
          </button>

          {/* Ready filter */}
          <button
            onClick={() => handleFilterChange('ready')}
            className={`flex-shrink-0 h-9 px-4 rounded-full font-medium text-sm transition-all
                      ${filter === 'ready'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            Ready <span className="ml-1.5 opacity-80">{counts.ready}</span>
          </button>

          {/* Busy filter */}
          <button
            onClick={() => handleFilterChange('busy')}
            className={`flex-shrink-0 h-9 px-4 rounded-full font-medium text-sm transition-all
                      ${filter === 'busy'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            Busy <span className="ml-1.5 opacity-80">{counts.busy}</span>
          </button>

          {/* Off filter */}
          <button
            onClick={() => handleFilterChange('off')}
            className={`flex-shrink-0 h-9 px-4 rounded-full font-medium text-sm transition-all
                      ${filter === 'off'
                        ? 'bg-gray-500 text-white shadow-sm'
                        : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            Off <span className="ml-1.5 opacity-80">{counts.off}</span>
          </button>
        </div>
      </div>

      {/* Staff content - Grid of vertical staff cards */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
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
                      viewMode="compact"
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
                      viewMode="compact"
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
                      viewMode="compact"
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
                viewMode="compact"
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
