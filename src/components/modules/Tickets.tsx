import { useState, useMemo } from 'react';
import { ServiceSection } from '../ServiceSection';
import { WaitListSection } from '../WaitListSection';
import { ComingAppointments } from '../ComingAppointments';
import { useTickets } from '../../hooks/useTicketsCompat';
import { haptics } from '../../utils/haptics';

export function Tickets() {
  // Tickets module now only shows: Coming, Waiting, In Service
  // Pending payments are accessed via the dedicated Pending tab in bottom nav
  const [activeTab, setActiveTab] = useState<'coming' | 'waitlist' | 'inservice'>('coming');
  const { waitlist = [], serviceTickets = [] } = useTickets();

  const tabs = useMemo(() => [
    { id: 'coming' as const, label: 'Coming', count: 0 }, // TODO: Get from appointments
    { id: 'waitlist' as const, label: 'Waiting', count: waitlist.length },
    { id: 'inservice' as const, label: 'In Service', count: serviceTickets.length },
  ], [waitlist.length, serviceTickets.length]);

  const handleTabChange = (tabId: typeof activeTab) => {
    haptics.selection();
    setActiveTab(tabId);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Sub-tabs for ticket types */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-2 py-2 flex gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content area - fills remaining space */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'coming' && (
          <ComingAppointments
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            hideHeader={true}
          />
        )}
        {activeTab === 'waitlist' && (
          <WaitListSection
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            hideHeader={true}
          />
        )}
        {activeTab === 'inservice' && (
          <ServiceSection
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            hideHeader={true}
          />
        )}
      </div>
    </div>
  );
}
