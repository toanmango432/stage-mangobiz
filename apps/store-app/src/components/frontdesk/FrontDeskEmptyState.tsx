import { LucideIcon, Hourglass, Activity, CreditCard, Receipt, Clock } from 'lucide-react';

type SectionType = 'waitList' | 'service' | 'pending' | 'closed' | 'comingAppointments';

interface FrontDeskEmptyStateProps {
  section: SectionType;
  hasFilters?: boolean;
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

// Section-specific default configurations using Tailwind classes
const sectionDefaults: Record<SectionType, {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
}> = {
  waitList: {
    icon: Hourglass,
    title: 'No one waiting',
    description: 'New walk-ins will appear here',
    iconBg: 'bg-waitList-50',
    iconColor: 'text-waitList-500',
  },
  service: {
    icon: Activity,
    title: 'No active services',
    description: 'Assign a technician to get started',
    iconBg: 'bg-service-50',
    iconColor: 'text-service-500',
  },
  pending: {
    icon: CreditCard,
    title: 'No pending payments',
    description: 'Completed services will appear here for checkout',
    iconBg: 'bg-pendingTickets-50',
    iconColor: 'text-pendingTickets-500',
  },
  closed: {
    icon: Receipt,
    title: 'No closed tickets today',
    description: 'Completed transactions will appear here',
    iconBg: 'bg-closedTickets-50',
    iconColor: 'text-closedTickets-400',
  },
  comingAppointments: {
    icon: Clock,
    title: 'No appointments coming up',
    description: 'Scheduled appointments will appear here',
    iconBg: 'bg-comingAppointments-50',
    iconColor: 'text-comingAppointments-500',
  },
};

// Filter-specific defaults
const filterDefaults = {
  title: 'No results found',
  description: 'Try adjusting your search or filters to find what you\'re looking for.',
};

export function FrontDeskEmptyState({
  section,
  hasFilters = false,
  title,
  description,
  icon,
}: FrontDeskEmptyStateProps) {
  const config = sectionDefaults[section];
  const Icon = icon || config.icon;

  const displayTitle = title || (hasFilters ? filterDefaults.title : config.title);
  const displayDescription = description || (hasFilters ? filterDefaults.description : config.description);

  return (
    <div className="flex flex-col items-center justify-center h-full py-10 px-4">
      <div className={`${config.iconBg} p-3 rounded-full mb-3`}>
        <Icon size={24} className={config.iconColor} />
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-1 text-center">
        {displayTitle}
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-md">
        {displayDescription}
      </p>
    </div>
  );
}
