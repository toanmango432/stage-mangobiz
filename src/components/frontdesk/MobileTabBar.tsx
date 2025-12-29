import { memo, useCallback, useRef, KeyboardEvent } from 'react';
import { FileText, Users, Calendar, UserCircle } from 'lucide-react';
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
  /** Show skeleton loading state */
  isLoading?: boolean;
  /** Number of skeleton tabs to show when loading (default: 4) */
  skeletonCount?: number;
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
  isLoading = false,
  skeletonCount = 4,
}: MobileTabBarProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const tabCount = tabs.length;
    let newIndex = index;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        newIndex = (index + 1) % tabCount;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = (index - 1 + tabCount) % tabCount;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = tabCount - 1;
        break;
      default:
        return;
    }

    // Focus and select the new tab
    tabRefs.current[newIndex]?.focus();
    haptics.selection();
    onTabChange(tabs[newIndex].id);
  }, [tabs, onTabChange]);

  // Render skeleton tabs when loading
  if (isLoading) {
    return (
      <div className={`bg-gray-50 border-b border-gray-200 ${className}`}>
        <div className="flex items-center h-12 px-2 gap-1">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg min-h-[44px] animate-pulse"
            >
              <div className="w-4 h-4 bg-gray-200 rounded" />
              <div className="hidden sm:block w-12 h-4 bg-gray-200 rounded" />
              <div className="w-5 h-5 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 border-b border-gray-200 ${className}`}>
      {/* Tab buttons - simplified and subordinate to main header */}
      <div className="flex items-center h-12 px-2 gap-1" role="tablist">
        {tabs.map((tab, index) => {
          const Icon = iconMap[tab.icon];
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[index] = el; }}
              onClick={() => {
                haptics.selection();
                onTabChange(tab.id);
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={isActive ? 0 : -1}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg
                text-sm font-medium transition-all duration-150
                min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400
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

              {/* Urgent indicator - small pulsing red dot for long waits */}
              {tab.metrics.urgent && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-300" />
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
