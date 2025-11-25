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
  const [activeTab, setActiveTab] = useState<'coming' | 'waitlist' | 'inservice'>('coming');
  const { waitlist = [], serviceTickets = [] } = useTickets();

  const tabs = useMemo(() => [
    { id: 'coming' as const, label: 'Coming', count: 0 }, // TODO: Get from appointments
    { id: 'waitlist' as const, label: 'Waiting', count: waitlist.length },
    { id: 'inservice' as const, label: 'In Service', count: serviceTickets.length },
  ], [waitlist.length, serviceTickets.length]);

  const handleTabChange = (tabId: 'coming' | 'waitlist' | 'inservice') => {
    haptics.selection();
    setActiveTab(tabId);
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Sub-tabs for ticket types */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-2 py-2">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
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
      </div>

      {/* Content area - fills remaining space */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Section Header */}
        <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            {activeTab === 'coming' && (
              <>
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                  <Clock size={16} className="text-sky-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Coming Appointments</h2>
                  <p className="text-xs text-gray-500">Upcoming scheduled visits</p>
                </div>
              </>
            )}
            {activeTab === 'waitlist' && (
              <>
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Users size={16} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Waiting Queue</h2>
                  <p className="text-xs text-gray-500">{waitlist.length} client{waitlist.length !== 1 ? 's' : ''} waiting</p>
                </div>
              </>
            )}
            {activeTab === 'inservice' && (
              <>
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Activity size={16} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">In Service</h2>
                  <p className="text-xs text-gray-500">{serviceTickets.length} client{serviceTickets.length !== 1 ? 's' : ''} being served</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section Content */}
        <div className="flex-1 overflow-auto">
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
    </div>
  );
}
