import React, { memo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PremiumAvatar } from '../premium';

interface Staff {
  id: string;
  name: string;
  appointments?: number;
  isActive?: boolean;
}

interface StaffChipProps {
  staff: Staff;
  isSelected: boolean;
  onClick: () => void;
  index?: number;
}

export const StaffChip = memo(function StaffChip({ staff, isSelected, onClick, index = 0 }: StaffChipProps) {
  const hasAppointments = (staff.appointments || 0) > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200',
        'hover:shadow-premium-md hover:-translate-y-0.5',
        // Focus indicators for accessibility
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
        // Active state for press feedback
        'active:scale-[0.98]',
        isSelected
          ? 'bg-brand-50 border-brand-300 shadow-premium-sm'
          : 'bg-white border-gray-200 hover:border-brand-200'
      )}
    >
      {/* Premium Avatar with status indicator */}
      <PremiumAvatar
        name={staff.name}
        size="md"
        showStatus
        status={hasAppointments ? 'busy' : 'online'}
        colorIndex={index}
        gradient
        className="flex-shrink-0"
      />

      {/* Name & Count */}
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {staff.name}
        </p>
        <p className="text-xs text-gray-500">
          {staff.appointments || 0} {staff.appointments === 1 ? 'appt' : 'appts'}
        </p>
      </div>

      {/* Check mark when selected - Premium styling */}
      {isSelected && (
        <div className={cn(
          'w-5 h-5 rounded-full',
          'bg-brand-500 flex items-center justify-center',
          'flex-shrink-0'
        )}>
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );
});

// Collapsible Staff List wrapper
interface StaffListProps {
  staff: Staff[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  initialVisible?: number;
}

export function StaffList({ 
  staff, 
  selectedIds, 
  onToggle,
  initialVisible = 6 
}: StaffListProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [search, setSearch] = React.useState('');
  
  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const visibleStaff = expanded ? filteredStaff : filteredStaff.slice(0, initialVisible);
  const hasMore = filteredStaff.length > initialVisible;
  
  return (
    <div className="space-y-2">
      {/* Search */}
      {staff.length > 6 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-colors"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}
      
      {/* Staff chips */}
      <div className="space-y-2">
        {visibleStaff.map((s, index) => (
          <StaffChip
            key={s.id}
            staff={s}
            index={index}
            isSelected={selectedIds.includes(s.id)}
            onClick={() => onToggle(s.id)}
          />
        ))}
      </div>
      
      {/* Show more/less */}
      {hasMore && !search && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-sm text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 active:scale-[0.98]"
        >
          {expanded 
            ? 'Show less' 
            : `Show ${filteredStaff.length - initialVisible} more`
          }
        </button>
      )}
      
      {/* No results */}
      {filteredStaff.length === 0 && search && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No staff found</p>
        </div>
      )}
    </div>
  );
}
