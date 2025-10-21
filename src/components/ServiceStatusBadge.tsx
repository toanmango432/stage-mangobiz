import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
interface ServiceStatusBadgeProps {
  status: 'waiting' | 'in-service' | 'completed';
  compact?: boolean;
}
export function ServiceStatusBadge({
  status,
  compact = false
}: ServiceStatusBadgeProps) {
  let bgColor = '';
  let textColor = '';
  let icon = null;
  let label = '';
  switch (status) {
    case 'waiting':
      bgColor = 'bg-amber-50';
      textColor = 'text-amber-700';
      icon = <Clock size={compact ? 12 : 14} />;
      label = 'Waiting';
      break;
    case 'in-service':
      bgColor = 'bg-blue-50';
      textColor = 'text-blue-700';
      icon = <AlertCircle size={compact ? 12 : 14} />;
      label = 'In Service';
      break;
    case 'completed':
      bgColor = 'bg-green-50';
      textColor = 'text-green-700';
      icon = <CheckCircle size={compact ? 12 : 14} />;
      label = 'Completed';
      break;
  }
  return <div className={`flex items-center gap-1 ${bgColor} ${textColor} rounded-full px-2 py-0.5`}>
      {icon}
      <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium`}>
        {label}
      </span>
    </div>;
}