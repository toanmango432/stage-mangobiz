import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Calendar, ClipboardList, User, Settings, Menu, X, Palette, Command, Clock, Hash, UserCircle } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface SalonHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
}

export function SalonHeaderSmart({
  activeTab,
  setActiveTab,
  showSidebar,
  setShowSidebar
}: SalonHeaderProps) {
  const [showColorLegend, setShowColorLegend] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
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

  // Auto-hide header on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsHeaderVisible(true);
      } 
      // Hide header when scrolling down (but not if search is expanded)
      else if (currentScrollY > lastScrollY && currentScrollY > 100 && !isSearchExpanded) {
        setIsHeaderVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isSearchExpanded]);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchExpanded(true);
        setIsHeaderVisible(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      // Escape to close search
      if (e.key === 'Escape' && isSearchExpanded) {
        setIsSearchExpanded(false);
        setShowSearchSuggestions(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchExpanded]);

  const currentTime = new Date();
  const formattedTime = currentTime.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });

  // Smart search suggestions
  const recentSearches = ['#91', 'Emily Chen', 'Gel Manicure', '#85'];
  const quickFilters = [
    { icon: <Hash size={12} />, label: 'By Ticket #', prefix: '#' },
    { icon: <UserCircle size={12} />, label: 'By Client', prefix: '@' },
    { icon: <Clock size={12} />, label: 'By Time', prefix: 'time:' },
  ];

  const handleSearchFocus = () => {
    setIsSearchExpanded(true);
    setShowSearchSuggestions(true);
  };

  const handleSearchBlur = () => {
    // Delay to allow clicking on suggestions
    setTimeout(() => {
      if (!searchQuery) {
        setIsSearchExpanded(false);
      }
      setShowSearchSuggestions(false);
    }, 200);
  };

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

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#00D0E0]/95 to-[#22A5C9]/95 backdrop-blur-md text-white shadow-lg transition-transform duration-300 ease-in-out ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Main Header Row - Slimmer */}
      <div className="flex items-center justify-between px-3 py-1.5 h-12">
        {/* Left Section */}
        <div className="flex items-center space-x-2">
          <button 
            className="p-1 rounded-lg hover:bg-white/20 transition-all duration-200 transform hover:scale-105 active:scale-95" 
            onClick={() => setShowSidebar(!showSidebar)} 
            aria-label={showSidebar ? 'Close sidebar' : 'Open sidebar'}
          >
            {showSidebar ? <X size={16} strokeWidth={2.5} /> : <Menu size={16} strokeWidth={2.5} />}
          </button>
          
          <Tippy content="Staff Specialty Colors">
            <button 
              className="p-1 rounded-lg hover:bg-white/20 transition-all duration-200 transform hover:scale-105 active:scale-95" 
              onClick={() => setShowColorLegend(!showColorLegend)} 
              aria-label="Show color legend"
            >
              <Palette size={16} strokeWidth={2.5} />
            </button>
          </Tippy>
          
          <div className="hidden lg:flex items-center space-x-1">
            <Tippy content="Notifications">
              <button className="p-1 rounded-lg hover:bg-white/20 transition-all duration-200">
                <Bell size={14} strokeWidth={2.5} />
              </button>
            </Tippy>
            <Tippy content="Calendar">
              <button className="p-1 rounded-lg hover:bg-white/20 transition-all duration-200">
                <Calendar size={14} strokeWidth={2.5} />
              </button>
            </Tippy>
            <Tippy content="Reports">
              <button className="p-1 rounded-lg hover:bg-white/20 transition-all duration-200">
                <ClipboardList size={14} strokeWidth={2.5} />
              </button>
            </Tippy>
          </div>
        </div>

        {/* Center - Smart Search */}
        <div className="flex-1 max-w-2xl mx-4 relative">
          <div 
            className={`relative transition-all duration-300 ease-out ${
              isSearchExpanded ? 'w-full' : 'w-48'
            }`}
          >
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder={isSearchExpanded ? "Search tickets, clients, services..." : "Search..."} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="w-full h-8 py-0 pl-8 pr-16 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-md bg-white/95 backdrop-blur-sm transition-all duration-300" 
            />
            <Search 
              size={14} 
              strokeWidth={2.5} 
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500" 
            />
            {/* Keyboard shortcut hint */}
            {!isSearchExpanded && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5 text-gray-400 text-xs">
                <Command size={10} />
                <span>K</span>
              </div>
            )}
            
            {/* Smart Search Suggestions */}
            {showSearchSuggestions && isSearchExpanded && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                {/* Quick Filters */}
                <div className="p-2 border-b border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 mb-1.5 px-2">Quick Filters</div>
                  <div className="space-y-0.5">
                    {quickFilters.map((filter, idx) => (
                      <button
                        key={idx}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 text-left transition-colors"
                        onClick={() => {
                          setSearchQuery(filter.prefix);
                          searchInputRef.current?.focus();
                        }}
                      >
                        <div className="text-gray-400">{filter.icon}</div>
                        <span className="text-sm text-gray-700">{filter.label}</span>
                        <span className="ml-auto text-xs text-gray-400 font-mono">{filter.prefix}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 mb-1.5 px-2">Recent</div>
                    <div className="space-y-0.5">
                      {recentSearches.map((search, idx) => (
                        <button
                          key={idx}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 text-left transition-colors"
                          onClick={() => {
                            setSearchQuery(search);
                            searchInputRef.current?.focus();
                          }}
                        >
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{search}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Desktop Tabs */}
          <nav className="hidden md:flex mr-2">
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                className={`px-2.5 py-1 text-xs font-medium transition-all duration-200 rounded-md ${
                  activeTab === tab.id 
                    ? 'bg-white/25 text-white shadow-inner font-bold' 
                    : 'hover:bg-white/15 text-white/90'
                }`} 
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <Tippy content="Settings">
            <button className="p-1 rounded-lg hover:bg-white/20 transition-all duration-200">
              <Settings size={16} strokeWidth={2.5} />
            </button>
          </Tippy>
          
          <Tippy content="Profile">
            <button className="p-1 rounded-lg hover:bg-white/20 transition-all duration-200">
              <User size={16} strokeWidth={2.5} />
            </button>
          </Tippy>
          
          <div className="hidden lg:block text-xs font-medium bg-white/15 px-2 py-1 rounded-md backdrop-blur-sm">
            {formattedTime}
          </div>
        </div>
      </div>

      {/* Mobile Tabs - Slimmer */}
      <nav className="flex md:hidden border-t border-white/20 overflow-x-auto no-scrollbar whitespace-nowrap" role="tablist">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            className={`min-w-[88px] h-7 inline-flex items-center justify-center px-3 text-xs font-medium transition-all duration-200 ${
              activeTab === tab.id 
                ? 'bg-white/20 text-white shadow-inner font-bold' 
                : 'text-white/90 hover:bg-white/10'
            }`} 
            onClick={() => setActiveTab(tab.id)} 
            role="tab" 
            aria-selected={activeTab === tab.id}
          >
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Color Legend Modal */}
      {showColorLegend && (
        <div className="absolute top-full right-0 mt-2 mr-4 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-80 overflow-hidden">
          <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-800 flex items-center">
              <Palette size={16} className="mr-2 text-[#22A5C9]" />
              Staff Specialty Colors
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Color-coding system for staff specializations
            </p>
          </div>
          <div className="p-2 max-h-[70vh] overflow-y-auto">
            {specialtyColors.map((specialty, index) => (
              <div key={index} className="p-2 hover:bg-gray-50 rounded-md transition-colors">
                <div className="flex items-center mb-1">
                  <div 
                    className="w-4 h-4 rounded-md mr-2 shadow-sm" 
                    style={{ backgroundColor: specialty.color }}
                  />
                  <span className="font-medium text-xs text-gray-800">
                    {specialty.name}
                  </span>
                </div>
                <div className="flex ml-6 space-x-1 mb-1">
                  <div className="flex items-center">
                    <div 
                      className="w-2.5 h-2.5 rounded-sm mr-1" 
                      style={{ backgroundColor: specialty.headerTint }}
                    />
                    <span className="text-xs text-gray-600">Header</span>
                  </div>
                  <div className="flex items-center">
                    <div 
                      className="w-2.5 h-2.5 rounded-sm mr-1" 
                      style={{ backgroundColor: specialty.dataTint }}
                    />
                    <span className="text-xs text-gray-600">Data</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 ml-6">
                  {specialty.description}
                </p>
              </div>
            ))}
          </div>
          <div className="p-2 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button 
              onClick={() => setShowColorLegend(false)} 
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
