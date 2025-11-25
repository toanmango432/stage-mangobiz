import { useState, useMemo } from 'react';
import { ServiceSection } from '../ServiceSection';
import { WaitListSection } from '../WaitListSection';
import { ComingAppointments } from '../ComingAppointments';
import { useTickets } from '../../hooks/useTicketsCompat';
import { haptics } from '../../utils/haptics';
import { Clock, Users, Activity, ChevronUp, ChevronDown } from 'lucide-react';

export function Tickets() {
  // Tickets module now only shows: Coming, Waiting, In Service
  // Pending payments are accessed via the dedicated Pending tab in bottom nav
  const [activeTab, setActiveTab] = useState<'coming' | 'waitlist' | 'inservice'>('inservice');
  const { waitlist = [], serviceTickets = [], comingAppointments = [] } = useTickets();

  // View settings - line view only, with compact/normal toggle
  const [minimizedLineView, setMinimizedLineView] = useState<boolean>(() => {
    const saved = localStorage.getItem('mobileTicketsMinimizedLineView');
    return saved === 'true';
  });

  const handleMinimizedLineViewChange = (minimized: boolean) => {
    haptics.selection();
    setMinimizedLineView(minimized);
    localStorage.setItem('mobileTicketsMinimizedLineView', minimized.toString());
  };

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
    <div className="h-full flex flex-col bg-white">
      {/* Row 1: Tabs - ensure all 3 are visible */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-2 py-2">
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

      {/* Row 2: Metrics & View Settings */}
      <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Metrics */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {activeTab === 'inservice' ? serviceTickets.length :
               activeTab === 'waitlist' ? waitlist.length :
               comingAppointments.length}
            </span>
            <span className="text-xs text-gray-500">
              {activeTab === 'inservice' ? (serviceTickets.length === 1 ? 'ticket' : 'tickets') :
               activeTab === 'waitlist' ? (waitlist.length === 1 ? 'waiting' : 'waiting') :
               'upcoming'}
            </span>
          </div>

          {/* Right: Compact/Normal Toggle */}
          <button
            onClick={() => handleMinimizedLineViewChange(!minimizedLineView)}
            className={`p-2 rounded-lg transition-all min-w-[40px] min-h-[40px] flex items-center justify-center ${
              minimizedLineView
                ? 'bg-orange-100 text-orange-600'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {minimizedLineView ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
      </div>

      {/* Section Content - sections handle their own scrolling */}
      <div className="flex-1 min-h-0 overflow-hidden">
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
            isCombinedView={true}
            viewMode="list"
            minimizedLineView={minimizedLineView}
            setMinimizedLineView={setMinimizedLineView}
          />
        ) : activeTab === 'inservice' ? (
          <ServiceSection
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            hideHeader={true}
            isCombinedView={true}
            viewMode="list"
            minimizedLineView={minimizedLineView}
            setMinimizedLineView={setMinimizedLineView}
          />
        ) : null}
      </div>
    </div>
  );
}
