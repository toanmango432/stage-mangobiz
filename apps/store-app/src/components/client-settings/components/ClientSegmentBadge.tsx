import React from 'react';
import type { Client, ClientSegment } from '@/types';

// Icons - must be defined before SEGMENT_CONFIG
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const BadgeCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const BlockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

interface ClientSegmentBadgeProps {
  segment: ClientSegment;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

// Segment definitions with styling
const SEGMENT_CONFIG: Record<ClientSegment, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.FC<{ className?: string }>;
}> = {
  active: {
    label: 'Active',
    description: 'Visited within last 60 days',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircleIcon,
  },
  at_risk: {
    label: 'At Risk',
    description: '60-90 days since last visit',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: AlertIcon,
  },
  lapsed: {
    label: 'Lapsed',
    description: '90+ days since last visit',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: ClockIcon,
  },
  vip: {
    label: 'VIP',
    description: 'Top 10% by lifetime spend',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: StarIcon,
  },
  new: {
    label: 'New',
    description: 'First visit within last 30 days',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: SparklesIcon,
  },
  member: {
    label: 'Member',
    description: 'Has active membership',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
    icon: BadgeCheckIcon,
  },
  blocked: {
    label: 'Blocked',
    description: 'Currently blocked from booking',
    color: 'text-gray-700',
    bgColor: 'bg-gray-200',
    icon: BlockIcon,
  },
};

export const ClientSegmentBadge: React.FC<ClientSegmentBadgeProps> = ({
  segment,
  size = 'sm',
  showIcon = true,
}) => {
  const config = SEGMENT_CONFIG[segment];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full
        ${config.bgColor} ${config.color}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
      `}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
};

// Utility function to determine client segment
export function getClientSegment(client: Client): ClientSegment {
  // Check blocked first (highest priority)
  if (client.isBlocked) {
    return 'blocked';
  }

  // Check VIP status
  if (client.isVip) {
    return 'vip';
  }

  // Check membership
  if (client.membership?.hasMembership) {
    return 'member';
  }

  // Check visit recency
  const lastVisit = client.visitSummary?.lastVisitDate;
  if (lastVisit) {
    const daysSinceVisit = Math.floor(
      (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceVisit <= 30 && (client.visitSummary?.totalVisits || 0) <= 1) {
      return 'new';
    }
    if (daysSinceVisit <= 60) {
      return 'active';
    }
    if (daysSinceVisit <= 90) {
      return 'at_risk';
    }
    return 'lapsed';
  }

  // Check if new (first visit within 30 days based on creation)
  const createdAt = new Date(client.createdAt);
  const daysSinceCreated = Math.floor(
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreated <= 30) {
    return 'new';
  }

  return 'lapsed';
}

// Get all segments for a client (can have multiple)
export function getClientSegments(client: Client): ClientSegment[] {
  const segments: ClientSegment[] = [];

  if (client.isBlocked) {
    segments.push('blocked');
  }

  if (client.isVip) {
    segments.push('vip');
  }

  if (client.membership?.hasMembership) {
    segments.push('member');
  }

  const lastVisit = client.visitSummary?.lastVisitDate;
  if (lastVisit) {
    const daysSinceVisit = Math.floor(
      (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceVisit <= 30 && (client.visitSummary?.totalVisits || 0) <= 1) {
      segments.push('new');
    } else if (daysSinceVisit <= 60) {
      segments.push('active');
    } else if (daysSinceVisit <= 90) {
      segments.push('at_risk');
    } else {
      segments.push('lapsed');
    }
  } else {
    const createdAt = new Date(client.createdAt);
    const daysSinceCreated = Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceCreated <= 30) {
      segments.push('new');
    } else {
      segments.push('lapsed');
    }
  }

  return segments;
}

// Segment filter component for client list
interface SegmentFilterProps {
  selectedSegments: ClientSegment[];
  onChange: (segments: ClientSegment[]) => void;
}

export const SegmentFilter: React.FC<SegmentFilterProps> = ({
  selectedSegments,
  onChange,
}) => {
  const segments: ClientSegment[] = ['active', 'at_risk', 'lapsed', 'new', 'vip', 'member', 'blocked'];

  const toggleSegment = (segment: ClientSegment) => {
    if (selectedSegments.includes(segment)) {
      onChange(selectedSegments.filter(s => s !== segment));
    } else {
      onChange([...selectedSegments, segment]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {segments.map((segment) => {
        const config = SEGMENT_CONFIG[segment];
        const Icon = config.icon;
        const isSelected = selectedSegments.includes(segment);

        return (
          <button
            key={segment}
            onClick={() => toggleSegment(segment)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              transition-all border
              ${isSelected
                ? `${config.bgColor} ${config.color} border-current`
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </button>
        );
      })}
    </div>
  );
};

// Segment stats card for dashboard
interface SegmentStatsProps {
  clients: Client[];
}

export const SegmentStats: React.FC<SegmentStatsProps> = ({ clients }) => {
  const segmentCounts = clients.reduce((acc, client) => {
    const segment = getClientSegment(client);
    acc[segment] = (acc[segment] || 0) + 1;
    return acc;
  }, {} as Record<ClientSegment, number>);

  const segments: ClientSegment[] = ['active', 'at_risk', 'lapsed', 'new', 'vip', 'member'];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {segments.map((segment) => {
        const config = SEGMENT_CONFIG[segment];
        const Icon = config.icon;
        const count = segmentCounts[segment] || 0;

        return (
          <div
            key={segment}
            className={`p-3 rounded-lg ${config.bgColor} text-center`}
          >
            <Icon className={`w-5 h-5 ${config.color} mx-auto mb-1`} />
            <p className={`text-lg font-bold ${config.color}`}>{count}</p>
            <p className="text-xs text-gray-600">{config.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export default ClientSegmentBadge;
