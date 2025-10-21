import React, { useState } from 'react';
import { Search, Bell, Calendar, ClipboardList, User, Settings, Menu, X, Palette } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
interface SalonHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
}
export function SalonHeader({
  activeTab,
  setActiveTab,
  showSidebar,
  setShowSidebar
}: SalonHeaderProps) {
  const [showColorLegend, setShowColorLegend] = useState(false);
  const tabs = [{
    id: 'book',
    label: 'Book'
  }, {
    id: 'salonCenter',
    label: 'Salon Center'
  }, {
    id: 'createCharge',
    label: 'Create/Charge'
  }];
  const currentTime = new Date();
  const formattedTime = currentTime.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
  // Specialty color legend data
  const specialtyColors = [{
    name: 'Neutral (Default)',
    color: '#64748B',
    headerTint: '#CBD5E1',
    dataTint: '#F1F5F9',
    description: 'General staff with no specialty'
  }, {
    name: 'Nails',
    color: '#E11D48',
    headerTint: '#FDA4AF',
    dataTint: '#FFE4E6',
    description: 'Nail services specialists'
  }, {
    name: 'Hair',
    color: '#2563EB',
    headerTint: '#93C5FD',
    dataTint: '#EFF6FF',
    description: 'Hair styling and cutting specialists'
  }, {
    name: 'Massage',
    color: '#16A34A',
    headerTint: '#86EFAC',
    dataTint: '#ECFDF5',
    description: 'Massage therapy specialists'
  }, {
    name: 'Skin Care / Facial',
    color: '#9333EA',
    headerTint: '#D8B4FE',
    dataTint: '#F3E8FF',
    description: 'Facial and skin treatment specialists'
  }, {
    name: 'Waxing',
    color: '#0891B2',
    headerTint: '#67E8F9',
    dataTint: '#ECFEFF',
    description: 'Waxing service specialists'
  }, {
    name: 'Combo / Multi-Service',
    color: '#D97706',
    headerTint: '#FCD34D',
    dataTint: '#FEF9C3',
    description: 'Staff providing multiple service types'
  }, {
    name: 'Support / Training',
    color: '#EA580C',
    headerTint: '#FDBA74',
    dataTint: '#FFF7ED',
    description: 'Support and training personnel'
  }];
  return <header className="bg-gradient-to-r from-[#00D0E0] to-[#22A5C9] text-white shadow-md relative">
      <div className="flex items-center justify-between px-2 sm:px-4 py-2">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation" onClick={() => setShowSidebar(!showSidebar)} aria-label={showSidebar ? 'Close sidebar' : 'Open sidebar'}>
            {showSidebar ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
          </button>
          {/* Color Legend Button */}
          <Tippy content="Staff Specialty Colors">
            <button className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation" onClick={() => setShowColorLegend(!showColorLegend)} aria-label="Show color legend">
              <Palette size={20} strokeWidth={2.5} />
            </button>
          </Tippy>
          <div className="hidden sm:flex items-center space-x-2">
            <button className="p-1.5 rounded-full hover:bg-white/20 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation">
              <Bell size={18} strokeWidth={2.5} />
            </button>
            <button className="p-1.5 rounded-full hover:bg-white/20 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation">
              <Calendar size={18} strokeWidth={2.5} />
            </button>
            <button className="p-1.5 rounded-full hover:bg-white/20 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation">
              <ClipboardList size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <nav className="hidden md:flex">
          {tabs.map(tab => <button key={tab.id} className={`px-4 py-2.5 font-medium transition-all duration-200 ${activeTab === tab.id ? 'bg-white/20 text-white shadow-inner font-bold transform scale-105' : 'hover:bg-white/10 text-white hover:shadow-md'}`} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>)}
        </nav>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="relative hidden sm:block">
            <input type="text" placeholder="Search ticket" className="py-1.5 pl-8 pr-2 rounded-md text-gray-800 w-32 sm:w-48 focus:outline-none focus:ring-2 focus:ring-[#00D0E0] shadow-sm text-sm" />
            <Search size={16} strokeWidth={2.5} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
          <button className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation">
            <Settings size={20} strokeWidth={2.5} />
          </button>
          <button className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation">
            <User size={20} strokeWidth={2.5} />
          </button>
          <div className="hidden md:block text-sm font-medium bg-white/10 px-2 py-1 rounded-md shadow-inner">
            {formattedTime}
          </div>
        </div>
      </div>
      {/* Mobile tabs */}
      <nav className="flex md:hidden border-t border-white/20 bg-gradient-to-r from-[#00D0E0] to-[#22A5C9] overflow-x-auto no-scrollbar whitespace-nowrap" role="tablist">
        {tabs.map(tab => <button key={tab.id} className={`min-w-[88px] h-8 inline-flex items-center justify-center px-3 text-xs font-medium transition-all duration-200 text-center touch-manipulation ${activeTab === tab.id ? 'bg-white/20 text-white shadow-inner font-bold' : 'text-white hover:bg-white/10'}`} onClick={() => setActiveTab(tab.id)} role="tab" aria-selected={activeTab === tab.id} aria-controls={`${tab.id}-panel`}>
            <span className="truncate">{tab.label}</span>
          </button>)}
      </nav>
      {/* Mobile search */}
      <div className="sm:hidden px-2 py-2 bg-[#22A5C9]">
        <div className="relative">
          <input type="text" placeholder="Search tickets" className="w-full h-10 py-0 pl-10 pr-3 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00D0E0] shadow-sm text-sm" />
          <Search size={18} strokeWidth={2.5} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>
      </div>
      {/* Color Legend Modal */}
      {showColorLegend && <div className="absolute top-full right-0 mt-2 mr-4 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-80 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-800 flex items-center">
              <Palette size={18} className="mr-2 text-[#22A5C9]" />
              Staff Specialty Colors
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              Color-coding system for staff specializations
            </p>
          </div>
          <div className="p-2 max-h-[70vh] overflow-y-auto">
            {specialtyColors.map((specialty, index) => <div key={index} className="p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center mb-1">
                  <div className="w-5 h-5 rounded-md mr-2 shadow-sm" style={{
              backgroundColor: specialty.color
            }}></div>
                  <span className="font-medium text-sm text-gray-800">
                    {specialty.name}
                  </span>
                </div>
                <div className="flex ml-7 space-x-1 mb-1.5">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-sm mr-1" style={{
                backgroundColor: specialty.headerTint
              }}></div>
                    <span className="text-xs text-gray-600">Header</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-sm mr-1" style={{
                backgroundColor: specialty.dataTint
              }}></div>
                    <span className="text-xs text-gray-600">Data</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 ml-7">
                  {specialty.description}
                </p>
              </div>)}
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button onClick={() => setShowColorLegend(false)} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-md transition-colors shadow-sm">
              Close
            </button>
          </div>
        </div>}
    </header>;
}