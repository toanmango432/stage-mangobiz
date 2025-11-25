import React from 'react';
import { cn } from '../../lib/utils';
import { Check, Clock, XCircle, CheckCircle2, Users, User, AlertCircle, X } from 'lucide-react';

type AppointmentStatus =
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'completed'
  | 'checked-in'
  | 'no-show'
  | 'walkin';

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
      classes: 'status-confirmed bg-green-100 text-green-800 border-green-300',
      description: 'Appointment confirmed',
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      classes: 'status-pending bg-yellow-100 text-yellow-800 border-yellow-300',
      description: 'Awaiting confirmation',
    },
    'checked-in': {
      label: 'Checked In',
      icon: User,
      classes: 'status-checked-in bg-blue-100 text-blue-800 border-blue-300',
      description: 'Client has arrived',
    },
    completed: {
      label: 'Completed',
      icon: Check,
      classes: 'status-completed bg-gray-100 text-gray-600 border-gray-300',
      description: 'Service completed',
    },
    cancelled: {
      label: 'Cancelled',
      icon: X,
      classes: 'status-cancelled bg-red-100 text-red-700 border-red-300',
      description: 'Appointment cancelled',
    },
    'no-show': {
      label: 'No Show',
      icon: AlertCircle,
      classes: 'status-no-show bg-red-100 text-red-800 border-red-400',
      description: 'Client did not show up',
    },
    walkin: {
      label: 'Walk-in',
      icon: Users,
      classes: 'bg-blue-100 text-blue-700 border-blue-200',
      description: 'Walk-in client',
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
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        'status-badge transition-all duration-300',
        config.classes,
        sizeClasses[size],
        className
      )}
      title={config.description}
    >
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
    'checked-in': 'border-blue-500',
    completed: 'border-gray-400',
    cancelled: 'border-red-400',
    'no-show': 'border-red-500',
    walkin: 'border-blue-500',
  };

  return borderColors[status] || borderColors.pending;
}

// Export type for use in other components
export type { AppointmentStatus };
