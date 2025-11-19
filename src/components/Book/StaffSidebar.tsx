/**
 * StaffSidebar Component - Premium Edition
 * Sidebar for filtering appointments by staff
 * With glass morphism and premium design
 */

import { memo, useState, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { Search, X, Users } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { StaffChip } from './StaffChip';
import { PremiumInput } from '../premium';
import { StaffCardSkeletonList } from './skeletons';

interface Staff {
  id: string;
  name: string;
  photo?: string;
  isAvailable: boolean;
  appointmentCount: number;
}

interface StaffSidebarProps {
  staff: Staff[];
  selectedStaffIds: string[];
  onStaffSelection: (staffIds: string[]) => void;
  className?: string;
  isLoading?: boolean;
}

export const StaffSidebar = memo(function StaffSidebar({
  staff,
  selectedStaffIds,
  onStaffSelection,
  className,
  isLoading = false,
}: StaffSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter staff by search - Memoized to prevent re-computation on every render
  const filteredStaff = useMemo(() =>
    staff.filter(s =>
      s.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    ),
    [debouncedSearch, staff]
  );

  const handleToggleStaff = (staffId: string) => {
    if (selectedStaffIds.includes(staffId)) {
      onStaffSelection(selectedStaffIds.filter(id => id !== staffId));
    } else {
      onStaffSelection([...selectedStaffIds, staffId]);
    }
  };

  const handleSelectAll = () => {
    onStaffSelection(staff.map(s => s.id));
  };

  const handleClearAll = () => {
    onStaffSelection([]);
  };

  return (
    <div className={cn(
      'w-56 md:w-60 lg:w-64 bg-surface-primary',
      'border-r border-gray-200/50',
      'flex flex-col h-full',
      'shadow-premium-sm',
      className
    )}>
      {/* Header - Premium styling */}
      <div className="p-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Team</h2>
        </div>

        {/* Search - Premium Input */}
        <PremiumInput
          type="text"
          placeholder="Search staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="w-4 h-4" />}
          clearable
          onClear={() => setSearchQuery('')}
          size="md"
        />

        {/* Select/Clear All - Premium buttons */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleSelectAll}
            className={cn(
              'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium',
              'text-brand-600 hover:text-brand-700',
              'hover:bg-brand-50',
              'transition-all duration-200'
            )}
          >
            Select All
          </button>
          <button
            onClick={handleClearAll}
            className={cn(
              'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium',
              'text-gray-600 hover:text-gray-700',
              'hover:bg-gray-100',
              'transition-all duration-200'
            )}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Staff List */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <StaffCardSkeletonList count={5} />
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No staff found
          </div>
        ) : (
          <div className="space-y-2">
            {filteredStaff.map((staffMember, index) => {
              const isSelected = selectedStaffIds.includes(staffMember.id);

              return (
                <StaffChip
                  key={staffMember.id}
                  staff={{
                    id: staffMember.id,
                    name: staffMember.name,
                    appointments: staffMember.appointmentCount,
                    isActive: staffMember.isAvailable,
                  }}
                  index={index}
                  isSelected={isSelected}
                  onClick={() => handleToggleStaff(staffMember.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - Premium styling */}
      <div className="p-4 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-gray-600">
            {selectedStaffIds.length === 0 ? (
              <span>All staff</span>
            ) : (
              <span>
                {selectedStaffIds.length} of {staff.length} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className={cn(
              'w-2 h-2 rounded-full',
              selectedStaffIds.length > 0 ? 'bg-brand-500' : 'bg-gray-400'
            )} />
          </div>
        </div>
      </div>
    </div>
  );
});
