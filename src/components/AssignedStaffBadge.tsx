import React from 'react';
import { useTickets } from '../context/TicketContext';
import { UserCheck } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
interface AssignedStaffBadgeProps {
  staffId: number;
  compact?: boolean;
}
export function AssignedStaffBadge({
  staffId,
  compact = false
}: AssignedStaffBadgeProps) {
  const {
    staff
  } = useTickets();
  const staffMember = staff.find(s => s.id === staffId);
  if (!staffMember) return null;
  return <Tippy content={`Assigned to ${staffMember.name}`}>
      <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'} bg-blue-50 rounded-full px-2 py-0.5 border border-blue-100`}>
        <div className="relative">
          <img src={staffMember.image} alt={staffMember.name} className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} rounded-full object-cover border border-white`} />
          <div className={`absolute -bottom-0.5 -right-0.5 ${compact ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full ${staffMember.color} border border-white`}></div>
        </div>
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium text-blue-700`}>
          {staffMember.name}
        </span>
      </div>
    </Tippy>;
}