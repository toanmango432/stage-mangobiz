import { useState, useMemo } from 'react';
import { ServiceSection } from '../ServiceSection';
import { WaitListSection } from '../WaitListSection';
import { ComingAppointments } from '../ComingAppointments';
import { useTickets } from '../../hooks/useTicketsCompat';
import { haptics } from '../../utils/haptics';
import { Clock, Users, Activity } from 'lucide-react';

export function Tickets() {
  // Tickets module now only shows: Coming, Waiting, In Service
  // Pending payments are accessed via the dedicated Pending tab in bottom nav
  const [activeTab, setActiveTab] = useState<'coming' | 'waitlist' | 'inservice'>('inservice');
  const { waitlist = [], serviceTickets = [] } = useTickets();

  const tabs = useMemo(() => [
    { id: 'inservice' as const, label: 'In Service', icon: Activity },
    { id: 'waitlist' as const, label: 'Waiting', icon: Users },
    { id: 'coming' as const, label: 'Coming', icon: Clock },
  ], []);

  const handleTabChange = (tabId: 'coming' | 'waitlist' | 'inservice') => {
    haptics.selection();
    setActiveTab(tabId);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Row 1: Tabs - ensure all 3 are visible */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-2 py-2 relative z-10">
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === 'inservice' ? serviceTickets.length :
                         tab.id === 'waitlist' ? waitlist.length : 0;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center justify-center gap-1 px-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={14} />
                <span className="truncate">{tab.label}</span>
                <span
                  className={`min-w-[18px] px-1 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'coming' ? (
          <ComingAppointments
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            hideHeader={true}
          />
        ) : activeTab === 'waitlist' ? (
          <WaitListSection
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            hideHeader={true}
          />
        ) : activeTab === 'inservice' ? (
          <ServiceSection
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            hideHeader={true}
          />
        ) : null}
      </div>
    </div>
  );
}
