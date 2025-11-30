import { memo } from 'react';
import { FileText, Users, Calendar, Clock, UserCircle } from 'lucide-react';
import { haptics } from '../../utils/haptics';

export interface TabMetrics {
  count: number;
  /** Secondary metric like "12m avg" or "1 paused" */
  secondary?: string;
  /** Urgency indicator - shows a dot/badge */
  urgent?: boolean;
}

export interface MobileTab {
  id: string;
  label: string;
  shortLabel?: string; // For very small screens
  icon: 'service' | 'waiting' | 'appointments' | 'team';
  metrics: TabMetrics;
  color: {
    active: string;    // bg color when active
    text: string;      // text color when active
    badge: string;     // badge bg color
  };
}

interface MobileTabBarProps {
  tabs: MobileTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const iconMap = {
  service: FileText,
  waiting: Users,
  appointments: Calendar,
  team: UserCircle,
};

export const MobileTabBar = memo(function MobileTabBar({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: MobileTabBarProps) {
  return (
    <div className={`bg-gray-50 border-b border-gray-200 ${className}`}>
      {/* Tab buttons - simplified and subordinate to main header */}
      <div className="flex items-center h-11 px-2 gap-1">
        {tabs.map((tab) => {
          const Icon = iconMap[tab.icon];
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                haptics.selection();
                onTabChange(tab.id);
              }}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                text-sm font-medium transition-all duration-150
                min-h-[36px]
                ${isActive
                  ? 'text-gray-900 bg-white shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }
              `}
              role="tab"
              aria-selected={isActive}
            >
              {/* Small icon */}
              <Icon size={16} className={isActive ? 'text-gray-700' : 'text-gray-400'} />

              {/* Label - hidden on very small screens */}
              <span className="hidden sm:inline truncate">
                {tab.shortLabel || tab.label}
              </span>

              {/* Count badge - small and muted */}
              <span className={`
                text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                ${isActive
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-gray-200/70 text-gray-500'
                }
              `}>
                {tab.metrics.count}
              </span>

              {/* Urgent indicator - small red dot */}
              {tab.metrics.urgent && (
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

// Preset color schemes for tabs - neutral to stay subordinate to main header
export const tabColors = {
  service: {
    active: 'bg-white',
    text: 'text-gray-900',
    badge: 'bg-gray-200',
  },
  waiting: {
    active: 'bg-white',
    text: 'text-gray-900',
    badge: 'bg-gray-200',
  },
  appointments: {
    active: 'bg-white',
    text: 'text-gray-900',
    badge: 'bg-gray-200',
  },
  team: {
    active: 'bg-white',
    text: 'text-gray-900',
    badge: 'bg-gray-200',
  },
};
