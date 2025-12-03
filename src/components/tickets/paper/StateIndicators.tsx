import React from 'react';
import { Clock, Activity, Pause, Check, X, AlertCircle } from 'lucide-react';
import { TicketState } from './BasePaperTicket';

interface StateIndicatorProps {
  state: TicketState;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const StateIndicator: React.FC<StateIndicatorProps> = ({
  state,
  position = 'top-right',
  size = 'small',
  showLabel = false,
}) => {
  const getStateConfig = () => {
    switch (state) {
      case 'waiting':
        return {
          icon: Clock,
          color: 'text-amber-500',
          bgColor: 'bg-amber-50',
          label: 'Waiting',
        };
      case 'inService':
        return {
          icon: Activity,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          label: 'In Service',
        };
      case 'pending':
        return {
          icon: Pause,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          label: 'Pending',
        };
      case 'completed':
        return {
          icon: Check,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: 'Completed',
        };
      case 'cancelled':
        return {
          icon: X,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          label: 'Cancelled',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-400',
          bgColor: 'bg-gray-50',
          label: 'Unknown',
        };
    }
  };

  const config = getStateConfig();
  const Icon = config.icon;

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  const positionClasses = {
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
  };

  return (
    <div className={`absolute ${positionClasses[position]} flex items-center gap-1`}>
      <div
        className={`${config.bgColor} ${config.color} rounded-full p-1`}
        title={config.label}
      >
        <Icon className={sizeClasses[size]} />
      </div>
      {showLabel && (
        <span className={`text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

interface PriorityBadgeProps {
  priority: 'VIP' | 'Priority' | 'Regular' | 'New';
  position?: 'top-right' | 'top-left';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  position = 'top-left',
}) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case 'VIP':
        return {
          icon: '⭐',
          bgColor: 'bg-gradient-to-r from-yellow-400 to-amber-400',
          textColor: 'text-white',
          label: 'VIP',
          shadow: '0 2px 4px rgba(251, 191, 36, 0.3)',
        };
      case 'Priority':
        return {
          icon: '🔥',
          bgColor: 'bg-gradient-to-r from-red-500 to-orange-500',
          textColor: 'text-white',
          label: 'Priority',
          shadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
        };
      case 'New':
        return {
          icon: '✨',
          bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          textColor: 'text-white',
          label: 'New',
          shadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
        };
      default:
        return {
          icon: '👤',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          label: 'Regular',
          shadow: 'none',
        };
    }
  };

  const config = getPriorityConfig();
  const positionClasses = position === 'top-right' ? 'top-2 right-2' : 'top-2 left-12';

  if (priority === 'Regular') return null;

  return (
    <div
      className={`absolute ${positionClasses} px-2 py-1 rounded-full flex items-center gap-1 ${config.textColor}`}
      style={{
        background: config.bgColor,
        boxShadow: config.shadow,
      }}
    >
      <span className="text-xs">{config.icon}</span>
      <span className="text-xs font-semibold">{config.label}</span>
    </div>
  );
};

interface CompletionStampProps {
  show: boolean;
  type?: 'completed' | 'cancelled' | 'void';
}

export const CompletionStamp: React.FC<CompletionStampProps> = ({
  show,
  type = 'completed',
}) => {
  if (!show) return null;

  const getStampConfig = () => {
    switch (type) {
      case 'completed':
        return {
          text: 'COMPLETED',
          color: 'text-green-600',
          borderColor: 'border-green-600',
          bgColor: 'bg-green-50/80',
          rotation: '-5deg',
        };
      case 'cancelled':
        return {
          text: 'CANCELLED',
          color: 'text-red-600',
          borderColor: 'border-red-600',
          bgColor: 'bg-red-50/80',
          rotation: '-8deg',
        };
      case 'void':
        return {
          text: 'VOID',
          color: 'text-red-700',
          borderColor: 'border-red-700',
          bgColor: 'bg-red-50/80',
          rotation: '-12deg',
        };
      default:
        return {
          text: '',
          color: '',
          borderColor: '',
          bgColor: '',
          rotation: '0deg',
        };
    }
  };

  const config = getStampConfig();

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none z-30`}
      style={{
        animation: 'stampComplete 0.3s ease-out forwards',
      }}
    >
      <div
        className={`${config.color} ${config.borderColor} ${config.bgColor} border-4 rounded-xl px-6 py-3 font-bold text-2xl tracking-wider`}
        style={{
          transform: `rotate(${config.rotation})`,
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        {config.text}
      </div>
    </div>
  );
};

interface WaitTimeIndicatorProps {
  minutes: number;
  position?: 'bottom-right' | 'top-right';
}

export const WaitTimeIndicator: React.FC<WaitTimeIndicatorProps> = ({
  minutes,
  position = 'bottom-right',
}) => {
  const getTimeColor = () => {
    if (minutes < 5) return 'text-green-600 bg-green-50';
    if (minutes < 15) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const positionClasses = position === 'bottom-right' ? 'bottom-2 right-2' : 'top-2 right-2';
  const colorClasses = getTimeColor();

  return (
    <div
      className={`absolute ${positionClasses} ${colorClasses} px-2 py-1 rounded-md flex items-center gap-1`}
    >
      <Clock className="w-3 h-3" />
      <span className="text-xs font-medium">
        {minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`}
      </span>
    </div>
  );
};

interface ProgressIndicatorProps {
  percentage: number;
  showLabel?: boolean;
  position?: 'bottom' | 'top';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  percentage,
  showLabel = false,
  position = 'bottom',
}) => {
  const getProgressColor = () => {
    if (percentage > 100) return 'bg-gradient-to-r from-red-500 to-red-600';
    if (percentage >= 80) return 'bg-gradient-to-r from-green-500 to-green-600';
    return 'bg-gradient-to-r from-purple-500 to-purple-600';
  };

  const positionClasses = position === 'bottom'
    ? 'bottom-0 left-0 right-0'
    : 'top-0 left-0 right-0';

  return (
    <div className={`absolute ${positionClasses} h-1 bg-gray-200/50`}>
      <div
        className={`h-full transition-all duration-300 ${getProgressColor()}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
      {showLabel && (
        <span className="absolute right-2 top-1 text-xs text-gray-600">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};