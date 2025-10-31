import { useState } from 'react';
import { ServiceSection } from '../ServiceSection';
import { WaitListSection } from '../WaitListSection';
import { ComingAppointments } from '../ComingAppointments';

export function Tickets() {
  const [activeTab, setActiveTab] = useState<'inservice' | 'waitlist' | 'coming'>('inservice');

  const tabs = [
    { id: 'inservice' as const, label: 'In Service', count: 38 },
    { id: 'waitlist' as const, label: 'Wait Queue', count: 35 },
    { id: 'coming' as const, label: 'Coming', count: 12 },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Sub-tabs for ticket types */}
      <div className="bg-white border-b border-gray-200 px-2 py-2 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'inservice' && (
          <ServiceSection
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            headerStyles={{
              bg: 'bg-[#E8F2FF]',
              accentColor: '#3B82F6',
              iconColor: 'text-[#9CA3AF]',
              activeIconColor: 'text-[#3B82F6]',
              titleColor: 'text-[#111827]',
              borderColor: 'border-[#E8F2FF]/50',
              counterBg: 'bg-[#E5E7EB]',
              counterText: 'text-[#6B7280]'
            }}
          />
        )}
        {activeTab === 'waitlist' && (
          <WaitListSection
            isMinimized={false}
            onToggleMinimize={() => {}}
            isMobile={true}
            headerStyles={{
              bg: 'bg-[#F9FAFB]',
              accentColor: '#F59E0B',
              iconColor: 'text-[#9CA3AF]',
              activeIconColor: 'text-[#F59E0B]',
              titleColor: 'text-[#111827]',
              borderColor: 'border-[#E5E7EB]',
              counterBg: 'bg-[#E5E7EB]',
              counterText: 'text-[#6B7280]'
            }}
          />
        )}
        {activeTab === 'coming' && (
          <ComingAppointments
            isMinimized={false}
            onToggleMinimize={() => {}}
          />
        )}
      </div>
    </div>
  );
}
