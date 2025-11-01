/**
 * StaffSidebar Component
 * Sidebar for filtering appointments by staff
 */

import { memo, useState } from 'react';
import { cn } from '../../lib/utils';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { StaffChip } from './StaffChip';

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
}

export const StaffSidebar = memo(function StaffSidebar({
  staff,
  selectedStaffIds,
  onStaffSelection,
  className,
}: StaffSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter staff by search
  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(debouncedSearch.toLowerCase())
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
      'w-64 bg-gradient-to-b from-teal-50 to-white',
      'border-r border-gray-200',
      'flex flex-col h-full',
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-teal-100">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Team</h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-9 pr-9 py-2 rounded-lg',
              'border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200',
              'text-sm transition-all'
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Select/Clear All */}
        <div className="flex items-center justify-between mt-3 text-xs">
          <button
            onClick={handleSelectAll}
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            Select All
          </button>
          <button
            onClick={handleClearAll}
            className="text-gray-600 hover:text-gray-700 font-medium"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Staff List */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredStaff.length === 0 ? (
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

      {/* Footer */}
      <div className="p-4 border-t border-teal-100 bg-teal-50">
        <div className="text-xs text-gray-600">
          {selectedStaffIds.length === 0 ? (
            <span>Showing all staff</span>
          ) : (
            <span>
              Showing {selectedStaffIds.length} of {staff.length} staff
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
