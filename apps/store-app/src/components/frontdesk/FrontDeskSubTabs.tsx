/**
 * FrontDeskSubTabs - Lightweight sub-navigation for Front Desk sections
 *
 * Design principles:
 * - SUBORDINATE to main header: smaller, lighter, neutral colors
 * - Simple text tabs with subtle underline indicator
 * - Count badges are small and muted
 * - No icons - main header has the icons
 * - Clear visual hierarchy: Main Nav (dominant) > Sub Tabs (supporting)
 */

import { memo } from 'react';

export interface SubTab {
  id: string;
  label: string;
  count?: number;
}

interface FrontDeskSubTabsProps {
  tabs: SubTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const FrontDeskSubTabs = memo(function FrontDeskSubTabs({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: FrontDeskSubTabsProps) {
  return (
    <div className={`bg-gray-50 border-b border-gray-200 ${className}`}>
      <div className="flex items-center h-10 px-4 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-3 py-1.5 rounded-md
                text-sm font-medium transition-all duration-150
                min-h-[32px]
                ${isActive
                  ? 'text-gray-900 bg-white shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
              role="tab"
              aria-selected={isActive}
            >
              <span>{tab.label}</span>

              {/* Count badge - small and muted */}
              {typeof tab.count !== 'undefined' && (
                <span className={`
                  text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                  ${isActive
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-200/70 text-gray-500'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});
