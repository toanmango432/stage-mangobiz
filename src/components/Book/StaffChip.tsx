import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getStaffColor } from '../../constants/bookDesignTokens';

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

export function StaffChip({ staff, isSelected, onClick, index = 0 }: StaffChipProps) {
  const avatarColor = getStaffColor(index);
  const hasAppointments = (staff.appointments || 0) > 0;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all duration-200',
        'hover:shadow-sm',
        isSelected 
          ? 'bg-teal-50 border-teal-500 shadow-sm' 
          : 'bg-white border-gray-200 hover:border-teal-300'
      )}
    >
      {/* Avatar with status indicator */}
      <div className="relative flex-shrink-0">
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm"
          style={{ 
            background: `linear-gradient(135deg, ${avatarColor}, ${adjustColor(avatarColor, -20)})` 
          }}
        >
          {staff.name.charAt(0).toUpperCase()}
        </div>
        
        {/* Status dot */}
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm',
          hasAppointments ? 'bg-amber-400' : 'bg-green-400'
        )} />
      </div>
      
      {/* Name & Count */}
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {staff.name}
        </p>
        <p className="text-xs text-gray-500">
          {staff.appointments || 0} {staff.appointments === 1 ? 'appt' : 'appts'}
        </p>
      </div>
      
      {/* Check mark when selected */}
      {isSelected && (
        <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
      )}
    </button>
  );
}

// Helper to darken color for gradient
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

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
            className="w-full pl-9 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring-0 text-sm transition-colors"
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
          className="w-full py-2 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg font-medium transition-colors"
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
