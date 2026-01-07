import { LucideIcon, Search, Calendar, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultIcons = {
  search: Search,
  calendar: Calendar,
  users: Users,
  alert: AlertCircle,
};

export const EmptyState = ({
  icon: Icon = defaultIcons.search,
  title,
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className="mb-4 p-4 rounded-full bg-muted/50">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>
      
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

interface ServiceEmptyStateProps {
  onRefresh?: () => void;
  className?: string;
}

export const ServiceEmptyState = ({ onRefresh, className }: ServiceEmptyStateProps) => {
  return (
    <EmptyState
      icon={defaultIcons.search}
      title="No services found"
      description="We couldn't find any services matching your criteria. Try adjusting your filters or search terms."
      action={onRefresh ? {
        label: 'Refresh',
        onClick: onRefresh,
      } : undefined}
      className={className}
    />
  );
};

interface StaffEmptyStateProps {
  onRefresh?: () => void;
  className?: string;
}

export const StaffEmptyState = ({ onRefresh, className }: StaffEmptyStateProps) => {
  return (
    <EmptyState
      icon={defaultIcons.users}
      title="No staff available"
      description="No staff members are available for the selected time. Try choosing a different date or time."
      action={onRefresh ? {
        label: 'Try Different Time',
        onClick: onRefresh,
      } : undefined}
      className={className}
    />
  );
};

interface BookingEmptyStateProps {
  onNewBooking?: () => void;
  className?: string;
}

export const BookingEmptyState = ({ onNewBooking, className }: BookingEmptyStateProps) => {
  return (
    <EmptyState
      icon={defaultIcons.calendar}
      title="No bookings yet"
      description="You haven't made any bookings yet. Start by selecting a service and choosing your preferred time."
      action={onNewBooking ? {
        label: 'Book Now',
        onClick: onNewBooking,
      } : undefined}
      className={className}
    />
  );
};