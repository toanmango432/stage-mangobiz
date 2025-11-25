import { useState, useMemo } from 'react';
import { ServiceSection } from '../ServiceSection';
import { WaitListSection } from '../WaitListSection';
import { ComingAppointments } from '../ComingAppointments';
import { useTickets } from '../../hooks/useTicketsCompat';
import { useViewModePreference } from '../../hooks/frontdesk/useViewModePreference';
import { haptics } from '../../utils/haptics';
import { Clock, Users, Activity, Grid, List, Minimize2, Maximize2 } from 'lucide-react';

export function Tickets() {
  // Tickets module now only shows: Coming, Waiting, In Service
  // Pending payments are accessed via the dedicated Pending tab in bottom nav
  const [activeTab, setActiveTab] = useState<'coming' | 'waitlist' | 'inservice'>('inservice');
  const { waitlist = [], serviceTickets = [], comingAppointments = [] } = useTickets();

  // View mode preferences - shared across sections
  const {
    viewMode,
    setViewMode,
    cardViewMode,
    setCardViewMode,
  } = useViewModePreference({
    storageKey: 'mobileTickets',
    defaultViewMode: 'grid',
    defaultCardViewMode: 'normal',
  });

  const tabs = useMemo(() => [
    { id: 'inservice' as const, label: 'In Service', icon: Activity },
    { id: 'waitlist' as const, label: 'Waiting', icon: Users },
    { id: 'coming' as const, label: 'Coming', icon: Clock },
  ], []);

  const handleTabChange = (tabId: 'coming' | 'waitlist' | 'inservice') => {
    haptics.selection();
    setActiveTab(tabId);
  };

  const toggleViewMode = () => {
    haptics.selection();
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const toggleCardViewMode = () => {
    haptics.selection();
    setCardViewMode(cardViewMode === 'normal' ? 'compact' : 'normal');
  };

  // Get metrics for current tab
  const getMetrics = () => {
    switch (activeTab) {
      case 'inservice':
        const avgDuration = serviceTickets.length > 0
          ? Math.round(serviceTickets.reduce((acc, t) => acc + (t.elapsedMinutes || 0), 0) / serviceTickets.length)
          : 0;
        return { primary: `${serviceTickets.length}`, secondary: avgDuration > 0 ? `Avg ${avgDuration}m` : 'No active' };
      case 'waitlist':
        const avgWait = waitlist.length > 0
          ? Math.round(waitlist.reduce((acc, t) => acc + (t.waitTime || 0), 0) / waitlist.length)
          : 0;
        return { primary: `${waitlist.length}`, secondary: avgWait > 0 ? `Avg ${avgWait}m wait` : 'No waiting' };
      case 'coming':
        return { primary: `${comingAppointments.length}`, secondary: 'Upcoming' };
      default:
        return { primary: '0', secondary: '' };
    }
  };

  const metrics = getMetrics();

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Row 1: Tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-2 py-2">
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === 'inservice' ? serviceTickets.length :
                         tab.id === 'waitlist' ? waitlist.length :
                         comingAppointments.length;
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
            <span className="text-lg font-bold text-gray-900">{metrics.primary}</span>
            <span className="text-xs text-gray-500">{metrics.secondary}</span>
          </div>

          {/* Right: View Settings */}
          <div className="flex items-center gap-1">
            {/* Grid/List Toggle */}
            <button
              onClick={toggleViewMode}
              className={`p-2 rounded-lg transition-all min-w-[40px] min-h-[40px] flex items-center justify-center ${
                viewMode === 'grid'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {viewMode === 'grid' ? <Grid size={18} /> : <List size={18} />}
            </button>

            {/* Normal/Compact Toggle */}
            <button
              onClick={toggleCardViewMode}
              className={`p-2 rounded-lg transition-all min-w-[40px] min-h-[40px] flex items-center justify-center ${
                cardViewMode === 'compact'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {cardViewMode === 'compact' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
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
            viewMode={viewMode}
            setViewMode={setViewMode}
            cardViewMode={cardViewMode}
            setCardViewMode={setCardViewMode}
          />
        ) : activeTab === 'inservice' ? (
          <ServiceSection
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            hideHeader={true}
            viewMode={viewMode}
            setViewMode={setViewMode}
            cardViewMode={cardViewMode}
            setCardViewMode={setCardViewMode}
          />
        ) : null}
      </div>
    </div>
  );
}
