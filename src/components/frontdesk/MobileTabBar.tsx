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
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      {/* Tab buttons */}
      <div className="flex">
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
                flex-1 flex flex-col items-center justify-center
                min-h-[56px] py-2 px-1
                transition-all duration-200 relative
                active:scale-95
                ${isActive
                  ? `${tab.color.active} border-b-2 ${tab.color.text.replace('text-', 'border-')}`
                  : 'text-gray-500 hover:bg-gray-50 border-b-2 border-transparent'
                }
              `}
              role="tab"
              aria-selected={isActive}
            >
              {/* Icon + Count row */}
              <div className="flex items-center gap-1.5">
                <Icon size={18} className={isActive ? tab.color.text : 'text-gray-400'} />
                <span className={`
                  text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                  ${isActive ? `${tab.color.badge} text-white` : 'bg-gray-200 text-gray-600'}
                `}>
                  {tab.metrics.count}
                </span>
                {/* Urgent indicator */}
                {tab.metrics.urgent && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>

              {/* Label */}
              <span className={`
                text-xs font-medium mt-1 truncate max-w-full px-1
                ${isActive ? tab.color.text : 'text-gray-500'}
              `}>
                {tab.shortLabel || tab.label}
              </span>

              {/* Secondary metric */}
              {tab.metrics.secondary && (
                <span className={`
                  text-[10px] mt-0.5
                  ${isActive ? tab.color.text.replace('700', '600').replace('600', '500') : 'text-gray-400'}
                `}>
                  {tab.metrics.secondary}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

// Preset color schemes for tabs
export const tabColors = {
  service: {
    active: 'bg-blue-50',
    text: 'text-blue-700',
    badge: 'bg-blue-500',
  },
  waiting: {
    active: 'bg-amber-50',
    text: 'text-amber-700',
    badge: 'bg-amber-500',
  },
  appointments: {
    active: 'bg-emerald-50',
    text: 'text-emerald-700',
    badge: 'bg-emerald-500',
  },
  team: {
    active: 'bg-teal-50',
    text: 'text-teal-700',
    badge: 'bg-teal-500',
  },
};
