/**
 * StaffFilterDropdown Component
 * Minimal dropdown for staff filtering
 * Allows filtering by all team, scheduled team, or individual staff
 */

import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Users, User } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
}

interface StaffFilterDropdownProps {
  staff: Staff[];
  selectedStaffIds: string[];
  onStaffFilterChange: (staffIds: string[]) => void;
  className?: string;
}

export function StaffFilterDropdown({
  staff,
  selectedStaffIds,
  onStaffFilterChange,
  className,
}: StaffFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine current selection label
  const getSelectionLabel = () => {
    if (selectedStaffIds.length === 0 || selectedStaffIds.length === staff.length) {
      return 'All team';
    }
    if (selectedStaffIds.length === 1) {
      const selectedStaff = staff.find(s => s.id === selectedStaffIds[0]);
      return selectedStaff?.name || 'All team';
    }
    return `${selectedStaffIds.length} staff`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleAllTeam = () => {
    onStaffFilterChange([]);
    setIsOpen(false);
  };

  const handleStaffSelect = (staffId: string) => {
    onStaffFilterChange([staffId]);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'px-3 py-2 rounded-lg',
          'border border-gray-200/60',
          'bg-white',
          'hover:border-gray-300 hover:bg-gray-50/50',
          'transition-all',
          'text-sm font-normal text-gray-700',
          'flex items-center gap-2',
          'min-w-[120px]',
          isOpen && 'border-gray-300 bg-gray-50/50'
        )}
      >
        {getSelectionLabel()}
        <svg
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform ml-auto',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-sm border border-gray-200/40 min-w-[180px] py-1"
          style={{ animation: 'slideDown 150ms ease-out' }}
        >
          {/* All Team Option */}
          <button
            onClick={handleAllTeam}
            className={cn(
              'w-full px-3 py-2 text-left',
              'flex items-center gap-2',
              'text-sm font-normal',
              'transition-colors',
              (selectedStaffIds.length === 0 || selectedStaffIds.length === staff.length)
                ? 'bg-gray-50 text-gray-900'
                : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <Users className="w-4 h-4 text-gray-400" />
            All team
            {(selectedStaffIds.length === 0 || selectedStaffIds.length === staff.length) && (
              <span className="ml-auto text-blue-500">✓</span>
            )}
          </button>

          {/* Divider */}
          {staff.length > 0 && (
            <div className="my-1 border-t border-gray-100" />
          )}

          {/* Individual Staff Options */}
          {staff.map((staffMember) => {
            const isSelected = selectedStaffIds.includes(staffMember.id);

            return (
              <button
                key={staffMember.id}
                onClick={() => handleStaffSelect(staffMember.id)}
                className={cn(
                  'w-full px-3 py-2 text-left',
                  'flex items-center gap-2',
                  'text-sm font-normal',
                  'transition-colors',
                  isSelected
                    ? 'bg-gray-50 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <User className="w-4 h-4 text-gray-400" />
                {staffMember.name}
                {isSelected && (
                  <span className="ml-auto text-blue-500">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
