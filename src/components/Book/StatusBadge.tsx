import React from 'react';
import { cn } from '../../lib/utils';
import { Check, Clock, XCircle, CheckCircle2, Users } from 'lucide-react';

type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'walkin';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ 
  status, 
  size = 'md',
  showIcon = true,
  showDot = false,
  className 
}: StatusBadgeProps) {
  const statusConfig = {
    confirmed: {
      label: 'Confirmed',
      icon: CheckCircle2,
      classes: 'bg-green-100 text-green-700 border-green-200',
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      classes: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      classes: 'bg-red-100 text-red-700 border-red-200',
    },
    completed: {
      label: 'Completed',
      icon: Check,
      classes: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    walkin: {
      label: 'Walk-in',
      icon: Users,
      classes: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  };
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-1 text-xs gap-1',
    lg: 'px-3 py-1.5 text-sm gap-1.5',
  };
  
  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-md border transition-colors',
      config.classes,
      sizeClasses[size],
      className
    )}>
      {showDot && (
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {showIcon && !showDot && (
        <Icon className={iconSizes[size]} />
      )}
      <span>{config.label}</span>
    </span>
  );
}

// Helper component for appointment card left border
export function StatusIndicator({ status }: { status: AppointmentStatus }) {
  const borderColors = {
    confirmed: 'border-green-400',
    pending: 'border-amber-400',
    cancelled: 'border-red-400',
    completed: 'border-blue-400',
    walkin: 'border-blue-500',
  };
  
  return borderColors[status] || borderColors.pending;
}
