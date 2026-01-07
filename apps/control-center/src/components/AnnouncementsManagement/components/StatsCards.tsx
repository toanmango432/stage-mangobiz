/**
 * Stats Cards Component
 * Filter cards showing announcement counts by status
 */

import type { AnnouncementStatus } from '@/types';

interface StatsCardsProps {
  statusCounts: Record<'all' | AnnouncementStatus, number>;
  filterStatus: AnnouncementStatus | 'all';
  onFilterChange: (status: AnnouncementStatus | 'all') => void;
}

const STATUS_ORDER: readonly ('all' | AnnouncementStatus)[] = [
  'all', 'active', 'scheduled', 'paused', 'draft', 'expired', 'archived'
];

export function StatsCards({ statusCounts, filterStatus, onFilterChange }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-7 gap-3 mb-8">
      {STATUS_ORDER.map((status) => (
        <button
          key={status}
          onClick={() => onFilterChange(status)}
          className={`p-3 rounded-xl border-2 transition-all ${
            filterStatus === status
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-xl font-bold text-gray-900">{statusCounts[status]}</p>
          <p className="text-xs text-gray-600 capitalize">{status === 'all' ? 'Total' : status}</p>
        </button>
      ))}
    </div>
  );
}
