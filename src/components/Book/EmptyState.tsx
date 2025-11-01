import React from 'react';
import { LucideIcon, Calendar, Users, Clock } from 'lucide-react';
import { Button } from '../shared/Button';

interface EmptyStateProps {
  type?: 'calendar' | 'walkins' | 'search';
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export function EmptyState({
  type = 'calendar',
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  const defaults = {
    calendar: {
      icon: Calendar,
      title: 'No appointments scheduled',
      description: 'Click any time slot to add an appointment or use the button below',
    },
    walkins: {
      icon: Users,
      title: 'No walk-ins at the moment',
      description: 'Walk-in clients will appear here when they arrive',
    },
    search: {
      icon: Clock,
      title: 'No results found',
      description: 'Try adjusting your search or filters',
    },
  };
  
  const config = defaults[type];
  const Icon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  
  return (
    <div className="flex items-center justify-center py-12 px-4">
      <div className="text-center max-w-md space-y-4">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {displayTitle}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {displayDescription}
          </p>
        </div>
        
        {/* Action */}
        {action && (
          <div className="pt-2">
            <Button
              variant="primary"
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
