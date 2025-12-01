import { LucideIcon, Users, Activity, CreditCard, Receipt, Clock } from 'lucide-react';

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
    icon: Users,
    title: 'No clients in wait list',
    description: 'Checked-in clients will appear here. Add a client by clicking the "+" button.',
    iconBg: 'bg-waitList-50',
    iconColor: 'text-waitList-500',
  },
  service: {
    icon: Activity,
    title: 'No clients in service',
    description: 'Assigned clients will appear here. Assign a client from the Wait List to begin service.',
    iconBg: 'bg-service-50',
    iconColor: 'text-service-500',
  },
  pending: {
    icon: CreditCard,
    title: 'No pending payments',
    description: 'When services are completed, they will appear here for payment processing.',
    iconBg: 'bg-pendingTickets-50',
    iconColor: 'text-pendingTickets-500',
  },
  closed: {
    icon: Receipt,
    title: 'No closed tickets',
    description: 'Completed transactions will appear here for your records.',
    iconBg: 'bg-closedTickets-50',
    iconColor: 'text-closedTickets-400',
  },
  comingAppointments: {
    icon: Clock,
    title: 'No upcoming appointments',
    description: 'Scheduled appointments will appear here as they approach.',
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
