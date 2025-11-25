/**
 * MobileTeamSection - Touch-optimized team view for mobile devices
 * Features:
 * - Horizontal scrolling staff cards with snap points
 * - Large touch targets (48px minimum)
 * - Quick status filters
 * - Haptic feedback on interactions
 */

import { useState, useMemo, memo } from 'react';
import { Users, Search, X, ChevronRight } from 'lucide-react';
import { useTickets } from '../../hooks/useTicketsCompat';
import { haptics } from '../../utils/haptics';

// Status badge colors
const STATUS_COLORS = {
  ready: {
    bg: 'bg-emerald-500',
    text: 'text-white',
    ring: 'ring-emerald-200',
    label: 'Ready',
  },
  busy: {
    bg: 'bg-amber-500',
    text: 'text-white',
    ring: 'ring-amber-200',
    label: 'Busy',
  },
  off: {
    bg: 'bg-gray-400',
    text: 'text-white',
    ring: 'ring-gray-200',
    label: 'Off',
  },
};

// Staff images for demo
const getStaffImage = (id: number) => {
  const images = [
    'https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
  ];
  return images[(id - 1) % images.length];
};

interface MobileTeamSectionProps {
  className?: string;
}

// Mobile-optimized staff card
const MobileStaffCard = memo(function MobileStaffCard({
  staff,
  onClick,
}: {
  staff: any;
  onClick?: () => void;
}) {
  const status = STATUS_COLORS[staff.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.ready;
  const staffId = typeof staff.id === 'string' ? parseInt(staff.id.replace(/\D/g, '')) || 1 : staff.id;

  return (
    <button
      onClick={() => {
        haptics.selection();
        onClick?.();
      }}
      className="flex-shrink-0 w-[140px] bg-white rounded-2xl shadow-sm border border-gray-100
                 overflow-hidden active:scale-[0.98] transition-transform touch-manipulation"
      style={{ minHeight: '160px' }}
    >
      {/* Status indicator strip */}
      <div className={`h-1.5 ${status.bg}`} />

      {/* Card content */}
      <div className="p-3 flex flex-col items-center">
        {/* Avatar with status ring */}
        <div className={`relative w-16 h-16 rounded-full ring-2 ${status.ring} ring-offset-2`}>
          <img
            src={staff.image || getStaffImage(staffId)}
            alt={staff.name}
            className="w-full h-full rounded-full object-cover"
          />
          {/* Status dot */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${status.bg}
                         border-2 border-white flex items-center justify-center`}>
            {staff.status === 'busy' && (
              <span className="text-[8px] font-bold text-white">!</span>
            )}
          </div>
        </div>

        {/* Name */}
        <h3 className="mt-2 text-sm font-semibold text-gray-900 truncate w-full text-center">
          {staff.name}
        </h3>

        {/* Status label */}
        <span className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </span>

        {/* Turn count if available */}
        {staff.turnCount !== undefined && (
          <div className="mt-1.5 text-[10px] text-gray-500">
            <span className="font-medium">{staff.turnCount}</span> turns
          </div>
        )}
      </div>
    </button>
  );
});

// Compact horizontal staff card for list view
const CompactStaffCard = memo(function CompactStaffCard({
  staff,
  onClick,
}: {
  staff: any;
  onClick?: () => void;
}) {
  const status = STATUS_COLORS[staff.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.ready;
  const staffId = typeof staff.id === 'string' ? parseInt(staff.id.replace(/\D/g, '')) || 1 : staff.id;

  return (
    <button
      onClick={() => {
        haptics.selection();
        onClick?.();
      }}
      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100
                 active:bg-gray-50 transition-colors touch-manipulation"
      style={{ minHeight: '64px' }}
    >
      {/* Avatar */}
      <div className={`relative w-12 h-12 rounded-full ring-2 ${status.ring} flex-shrink-0`}>
        <img
          src={staff.image || getStaffImage(staffId)}
          alt={staff.name}
          className="w-full h-full rounded-full object-cover"
        />
        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${status.bg} border-2 border-white`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{staff.name}</h3>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          {staff.turnCount !== undefined && (
            <span className="text-[10px] text-gray-500">{staff.turnCount} turns</span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
    </button>
  );
});

export const MobileTeamSection = memo(function MobileTeamSection({
  className = '',
}: MobileTeamSectionProps) {
  const { staff = [] } = useTickets();
  const [filter, setFilter] = useState<'all' | 'ready' | 'busy' | 'off'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    <div className={`h-full flex flex-col bg-gray-50 ${className}`}>
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

      {/* Staff content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <Users size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No team members found</p>
          </div>
        ) : filter === 'all' ? (
          // Grouped view when "All" is selected
          <div className="space-y-4">
            {/* Ready section */}
            {groupedStaff.ready.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Ready ({groupedStaff.ready.length})
                  </h3>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
                  {groupedStaff.ready.map((s: any) => (
                    <div key={s.id} className="snap-start">
                      <MobileStaffCard staff={s} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Busy section */}
            {groupedStaff.busy.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Busy ({groupedStaff.busy.length})
                  </h3>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
                  {groupedStaff.busy.map((s: any) => (
                    <div key={s.id} className="snap-start">
                      <MobileStaffCard staff={s} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Off section */}
            {groupedStaff.off.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Off ({groupedStaff.off.length})
                  </h3>
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
                  {groupedStaff.off.map((s: any) => (
                    <div key={s.id} className="snap-start">
                      <MobileStaffCard staff={s} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // List view for filtered results
          <div className="space-y-2">
            {filteredStaff.map((s: any) => (
              <CompactStaffCard key={s.id} staff={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default MobileTeamSection;
