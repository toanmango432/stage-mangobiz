/**
 * StaffSelector - Staff selection list
 */

import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { StaffMember } from './types';

interface StaffSelectorProps {
  staff: StaffMember[];
  activeStaffId: string | null;
  onSelectStaff: (staffId: string, staffName: string) => void;
}

export function StaffSelector({
  staff,
  activeStaffId,
  onSelectStaff,
}: StaffSelectorProps) {
  return (
    <div className="space-y-1.5">
      {staff.map(member => (
        <button
          key={member.id}
          onClick={() => onSelectStaff(member.id, member.name)}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group',
            activeStaffId === member.id
              ? 'bg-brand-50 border-2 border-brand-500 shadow-sm'
              : 'bg-white border border-gray-200 hover:border-brand-300 hover:shadow-sm hover:scale-[1.01]'
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold shadow-sm transition-all",
            activeStaffId === member.id
              ? "bg-gradient-to-br from-brand-500 to-brand-600"
              : "bg-gradient-to-br from-gray-400 to-gray-500 group-hover:from-brand-400 group-hover:to-brand-500"
          )}>
            {member.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">{member.name}</p>
            {activeStaffId === member.id ? (
              <p className="text-xs text-brand-600 font-medium mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Selected
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5 group-hover:text-brand-600 transition-colors">
                Click to select
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
