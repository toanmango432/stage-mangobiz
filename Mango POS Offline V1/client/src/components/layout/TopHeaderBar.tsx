import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Clock, ChevronDown, User, Command, Hash, UserCircle, FileText, Calendar, DollarSign, Users, Scissors, TrendingUp, Zap } from 'lucide-react';

export function TopHeaderBar() {
  const [selectedOrg, setSelectedOrg] = useState('Main Salon');
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount] = useState(3);
  // Header always visible since sections handle their own scrolling
  const [isHeaderVisible] = useState(true);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Note: Auto-hide disabled because app uses overflow-hidden layout
  // where individual sections handle scrolling, not the window

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchExpanded(true);
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

  const organizations = ['Main Salon', 'Downtown Branch', 'Westside Location'];

  // Universal Smart Search - AI-like suggestions across all system entities
  const searchCategories = [
    {
      category: 'Tickets',
      icon: <FileText size={12} />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      results: searchQuery ? [
        { id: '#91', name: 'Emily Chen - Gel Manicure', meta: 'In Service • 1h 23m', match: 'ticket' },
        { id: '#110', name: 'Blake Wilson - Facial', meta: 'Waiting Queue • 8:19 AM', match: 'ticket' },
      ] : []
    },
    {
      category: 'Clients',
      icon: <UserCircle size={12} />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      results: searchQuery ? [
        { id: 'C-1234', name: 'Emily Chen', meta: '15 visits • VIP • (555) 123-4567', match: 'client' },
        { id: 'C-5678', name: 'Sarah Johnson', meta: '8 visits • Regular', match: 'client' },
      ] : []
    },
    {
      category: 'Services',
      icon: <Scissors size={12} />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      results: searchQuery ? [
        { id: 'S-101', name: 'Gel Manicure', meta: '$45 • 45min • Popular', match: 'service' },
        { id: 'S-102', name: 'Acrylic Full Set', meta: '$65 • 1h 30min', match: 'service' },
      ] : []
    },
    {
      category: 'Staff',
      icon: <Users size={12} />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      results: searchQuery ? [
        { id: 'ST-01', name: 'Sophia', meta: 'Busy • 3 tickets • Nails specialist', match: 'staff' },
        { id: 'ST-02', name: 'Isabella', meta: 'Ready • Hair specialist', match: 'staff' },
      ] : []
    },
    {
      category: 'Appointments',
      icon: <Calendar size={12} />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      results: searchQuery ? [
        { id: 'A-789', name: 'Emily Chen - 2:00 PM Today', meta: 'Gel Manicure • Sophia', match: 'appointment' },
      ] : []
    },
    {
      category: 'Transactions',
      icon: <DollarSign size={12} />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      results: searchQuery ? [
        { id: 'T-4567', name: '$125.00 - Emily Chen', meta: 'Today 1:45 PM • Card • #91', match: 'transaction' },
      ] : []
    },
  ];

  const quickActions = [
    { icon: <Zap size={12} />, label: 'Quick Search', prefix: '', desc: 'Search everything' },
    { icon: <Hash size={12} />, label: 'Ticket #', prefix: '#', desc: 'Find by ticket number' },
    { icon: <UserCircle size={12} />, label: 'Client', prefix: '@', desc: 'Find by client name' },
    { icon: <Calendar size={12} />, label: 'Date', prefix: 'date:', desc: 'Search by date' },
    { icon: <DollarSign size={12} />, label: 'Amount', prefix: '$', desc: 'Find by amount' },
    { icon: <TrendingUp size={12} />, label: 'Status', prefix: 'status:', desc: 'Filter by status' },
  ];

  const recentSearches = ['#91', 'Emily Chen', 'Gel Manicure', '$125', 'date:today'];

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

  // Get current time
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <header className={`bg-white/90 backdrop-blur-lg border-b border-gray-200/80 h-9 flex items-center px-2.5 shadow-sm fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      {/* Left Section - Brand & Organization */}
      <div className="flex items-center gap-2.5 min-w-[240px]">
        {/* Logo */}
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-pink-500 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">M</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Mango Biz</span>
        </div>

        {/* Organization Selector */}
        <div className="relative">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            <span className="text-[11px] text-gray-700">{selectedOrg}</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>

          {showOrgDropdown && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {organizations.map((org) => (
                <button
                  key={org}
                  onClick={() => {
                    setSelectedOrg(org);
                    setShowOrgDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    selectedOrg === org ? 'text-orange-600 bg-orange-50' : 'text-gray-700'
                  }`}
                >
                  {org}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Center Section - Universal Smart Search */}
      <div className="flex-1 flex justify-center">
        <div className={`relative transition-all duration-300 ease-out ${
          isSearchExpanded ? 'w-full max-w-3xl' : 'w-96'
        }`}>
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={isSearchExpanded ? "Search anything: tickets, clients, services, staff, appointments..." : "Universal search..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className="w-full pl-7 pr-12 py-1 bg-gray-50/80 border border-gray-200/80 rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 focus:bg-white transition-all placeholder:text-gray-400"
          />
          {/* Keyboard shortcut hint */}
          {!isSearchExpanded && (
            <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5 px-1 py-0.5 bg-gray-200/60 rounded text-gray-500 text-[9px] font-medium">
              <Command size={8} />
              <span>K</span>
            </div>
          )}
          
          {/* Universal Smart Search Results */}
          {showSearchSuggestions && isSearchExpanded && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-[80vh] overflow-y-auto">
              {!searchQuery ? (
                /* Quick Actions & Recent when empty */
                <>
                  <div className="p-2 border-b border-gray-100">
                    <div className="text-[9px] font-bold text-gray-400 mb-1.5 px-2 uppercase tracking-wide">Quick Actions</div>
                    <div className="grid grid-cols-2 gap-1">
                      {quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 text-left transition-colors group"
                          onClick={() => {
                            setSearchQuery(action.prefix);
                            searchInputRef.current?.focus();
                          }}
                        >
                          <div className="text-gray-400 group-hover:text-orange-500 mt-0.5">{action.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-gray-700 group-hover:text-gray-900">{action.label}</div>
                            <div className="text-[9px] text-gray-400 truncate">{action.desc}</div>
                          </div>
                          {action.prefix && (
                            <span className="text-[9px] text-gray-400 font-mono mt-0.5">{action.prefix}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {recentSearches.length > 0 && (
                    <div className="p-2">
                      <div className="text-[9px] font-bold text-gray-400 mb-1.5 px-2 uppercase tracking-wide">Recent Searches</div>
                      <div className="space-y-0.5">
                        {recentSearches.map((search, idx) => (
                          <button
                            key={idx}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 text-left transition-colors group"
                            onClick={() => {
                              setSearchQuery(search);
                              searchInputRef.current?.focus();
                            }}
                          >
                            <Clock size={11} className="text-gray-400 group-hover:text-orange-500" />
                            <span className="text-[11px] text-gray-700 group-hover:text-gray-900">{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Multi-category search results */
                <div className="divide-y divide-gray-100">
                  {searchCategories.filter(cat => cat.results.length > 0).map((category, catIdx) => (
                    <div key={catIdx} className="p-2">
                      <div className="flex items-center gap-1.5 mb-1.5 px-2">
                        <div className={`${category.color}`}>{category.icon}</div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{category.category}</span>
                        <span className="ml-auto text-[9px] text-gray-400">{category.results.length}</span>
                      </div>
                      <div className="space-y-0.5">
                        {category.results.map((result, idx) => (
                          <button
                            key={idx}
                            className={`w-full flex items-start gap-2 px-2 py-1.5 rounded-md hover:${category.bgColor} text-left transition-colors group`}
                            onClick={() => {
                              console.log('Selected:', result);
                              setShowSearchSuggestions(false);
                            }}
                          >
                            <div className={`${category.color} mt-0.5 opacity-60 group-hover:opacity-100`}>
                              {category.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-medium text-gray-900 truncate">{result.name}</div>
                              <div className="text-[9px] text-gray-500 truncate">{result.meta}</div>
                            </div>
                            <div className="text-[9px] text-gray-400 font-mono mt-0.5">{result.id}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {searchCategories.every(cat => cat.results.length === 0) && (
                    <div className="p-8 text-center">
                      <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No results found for "{searchQuery}"</p>
                      <p className="text-[10px] text-gray-400 mt-1">Try different keywords or filters</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Actions & User */}
      <div className="flex items-center gap-2 min-w-[140px] justify-end">
        {/* Notifications */}
        <button className="relative p-1 hover:bg-gray-50 rounded-md transition-colors">
          <Bell className="w-3.5 h-3.5 text-gray-600" />
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">
              {notificationCount}
            </span>
          )}
        </button>

        {/* Clock */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50/80 rounded-md">
          <Clock className="w-3 h-3 text-gray-500" />
          <span className="text-[10px] text-gray-700 font-medium">{currentTime}</span>
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-6 h-6 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center hover:shadow-md transition-shadow"
          >
            <User className="w-3.5 h-3.5 text-white" />
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@mangobiz.com</p>
              </div>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Profile Settings
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Preferences
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
