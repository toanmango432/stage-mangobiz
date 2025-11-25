import { useState, useMemo } from 'react';
import { ServiceSection } from '../ServiceSection';
import { WaitListSection } from '../WaitListSection';
import { ComingAppointments } from '../ComingAppointments';
import { useTickets } from '../../hooks/useTicketsCompat';
import { haptics } from '../../utils/haptics';
import { Clock, Users, Activity, Grid, List, Minimize2, Maximize2 } from 'lucide-react';

export function Tickets() {
  // Tickets module now only shows: Coming, Waiting, In Service
  // Pending payments are accessed via the dedicated Pending tab in bottom nav
  const [activeTab, setActiveTab] = useState<'coming' | 'waitlist' | 'inservice'>('inservice');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cardViewMode, setCardViewMode] = useState<'normal' | 'compact'>('normal');
  const { waitlist = [], serviceTickets = [] } = useTickets();

  const tabs = useMemo(() => [
    { id: 'inservice' as const, label: 'In Service', icon: Activity, color: 'emerald' },
    { id: 'waitlist' as const, label: 'Waiting', icon: Users, color: 'amber' },
    { id: 'coming' as const, label: 'Coming', icon: Clock, color: 'sky' },
  ], []);

  // Get counts and metrics for current tab
  const getMetrics = () => {
    switch (activeTab) {
      case 'inservice':
        return {
          count: serviceTickets.length,
          label: 'In Service',
          subtitle: `${serviceTickets.length} client${serviceTickets.length !== 1 ? 's' : ''} being served`,
        };
      case 'waitlist':
        return {
          count: waitlist.length,
          label: 'Waiting',
          subtitle: `${waitlist.length} client${waitlist.length !== 1 ? 's' : ''} in queue`,
        };
      case 'coming':
        return {
          count: 0,
          label: 'Coming',
          subtitle: 'Upcoming appointments',
        };
      default:
        return { count: 0, label: '', subtitle: '' };
    }
  };

  const metrics = getMetrics();

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

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Row 1: Tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-2 py-2">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === 'inservice' ? serviceTickets.length :
                         tab.id === 'waitlist' ? waitlist.length : 0;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon size={16} />
                <span className="hidden xs:inline">{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
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

      {/* Row 2: Metrics & Settings */}
      <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Metrics */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{metrics.count}</span>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-700">{metrics.label}</span>
                <span className="text-[10px] text-gray-500">{metrics.subtitle}</span>
              </div>
            </div>
          </div>

          {/* Right: View Settings */}
          <div className="flex items-center gap-1">
            {/* Grid/List Toggle */}
            <button
              onClick={toggleViewMode}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              title={viewMode === 'grid' ? 'Grid View' : 'List View'}
            >
              {viewMode === 'grid' ? <Grid size={18} /> : <List size={18} />}
            </button>

            {/* Normal/Compact Toggle */}
            <button
              onClick={toggleCardViewMode}
              className={`p-2 rounded-lg transition-all ${
                cardViewMode === 'compact'
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              title={cardViewMode === 'normal' ? 'Normal View' : 'Compact View'}
            >
              {cardViewMode === 'compact' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
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
            viewMode={viewMode}
            cardViewMode={cardViewMode}
          />
        ) : activeTab === 'inservice' ? (
          <ServiceSection
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            hideHeader={true}
            viewMode={viewMode}
            cardViewMode={cardViewMode}
          />
        ) : null}
      </div>
    </div>
  );
}
