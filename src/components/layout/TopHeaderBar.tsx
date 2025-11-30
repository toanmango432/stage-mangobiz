import { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, Clock, ChevronDown, User, Command, Hash, UserCircle, 
  FileText, Calendar, DollarSign, Users, Scissors, TrendingUp, Zap, Settings,
  LayoutGrid, Receipt, CreditCard, MoreHorizontal
} from 'lucide-react';

interface TopHeaderBarProps {
  onFrontDeskSettingsClick?: () => void;
  activeModule?: string;
  onModuleChange?: (module: string) => void;
  pendingCount?: number;
  hideNavigation?: boolean; // Hide nav tabs on mobile (handled by BottomNavBar)
}

export function TopHeaderBar({
  onFrontDeskSettingsClick,
  activeModule = 'frontdesk',
  onModuleChange,
  pendingCount = 0,
  hideNavigation = false
}: TopHeaderBarProps) {
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

  // Navigation Modules - 4 core modules for busy salon staff
  // Large, obvious buttons following "remote control" principle
  const modules = [
    { id: 'book', label: 'Book', icon: Calendar },
    { id: 'frontdesk', label: 'Front Desk', icon: LayoutGrid },
    { id: 'checkout', label: 'Checkout', icon: CreditCard },
    { id: 'sales', label: 'Sales', icon: FileText },
  ];

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
      category: 'Sales',
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
    <header className={`
      bg-gradient-to-b from-white/40 via-orange-50/30 to-white/20
      backdrop-blur-xl backdrop-saturate-[1.8]
      border border-white/60 border-b-white/30
      rounded-b-2xl mx-2
      shadow-[0_8px_32px_rgba(251,146,60,0.12),0_2px_8px_rgba(0,0,0,0.08),inset_0_2px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(255,255,255,0.3)]
      h-16 flex items-center px-4 fixed top-0 left-2 right-2 z-50
      transition-transform duration-300 ease-out
      ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
    `}>
      {/* Left Section - Brand & Organization */}
      <div className={`flex items-center gap-4 ${hideNavigation ? 'flex-1' : 'min-w-[240px]'}`}>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Mango</span>
        </div>

        {/* Organization Selector */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
          >
            <span className="text-xs font-medium text-gray-700">{selectedOrg}</span>
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

      {/* Center Section - Navigation (hidden on mobile/tablet when BottomNavBar is shown) */}
      {/* Large, obvious buttons for busy salon staff - "Remote Control" principle */}
      {!hideNavigation && (
      <div className="flex-1 flex justify-center items-center h-full">
        <nav className="flex items-center gap-2 h-full">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;

            return (
              <button
                key={module.id}
                onClick={() => onModuleChange?.(module.id)}
                className={`
                  relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-200 group
                  min-h-[48px]
                  ${isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="transition-transform duration-200"
                />
                <span className={`text-base ${isActive ? 'font-bold' : 'font-semibold'}`}>
                  {module.label}
                </span>

                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}

          {/* More Button - styled as a lighter, secondary tab */}
          <button
            onClick={() => onModuleChange?.('more')}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200
              min-h-[44px]
              ${activeModule === 'more'
                ? 'bg-gray-100 text-gray-900 border border-gray-300'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-transparent'
              }
            `}
          >
            <MoreHorizontal size={18} />
            <span className={`text-sm ${activeModule === 'more' ? 'font-semibold' : 'font-medium'}`}>
              More
            </span>
          </button>
        </nav>
      </div>
      )}

      {/* Right Section - Search, Actions & User */}
      <div className={`flex items-center gap-3 justify-end ${hideNavigation ? '' : 'min-w-[240px]'}`}>
        {/* Compact Search - smaller on mobile */}
        <div className={`relative transition-all duration-300 ease-out ${
          isSearchExpanded ? 'w-64' : hideNavigation ? 'w-36 sm:w-48' : 'w-48'
        }`}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className="w-full pl-8 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all placeholder:text-gray-400"
          />
          {!isSearchExpanded && !hideNavigation && (
            <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5 px-1 py-0.5 bg-gray-200/50 rounded text-gray-500 text-[9px] font-medium">
              <Command size={8} />
              <span>K</span>
            </div>
          )}

          {/* Search Results Dropdown */}
          {showSearchSuggestions && isSearchExpanded && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[80vh] overflow-y-auto">
              {/* Reuse existing search results logic */}
              {!searchQuery ? (
                <>
                  <div className="p-3 border-b border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 mb-2 px-1 uppercase tracking-wide">Quick Actions</div>
                    <div className="grid grid-cols-2 gap-1">
                      {quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-left transition-colors group"
                          onClick={() => {
                            setSearchQuery(action.prefix);
                            searchInputRef.current?.focus();
                          }}
                        >
                          <div className="text-gray-400 group-hover:text-orange-500 mt-0.5">{action.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-gray-700 group-hover:text-gray-900">{action.label}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="divide-y divide-gray-100">
                  {searchCategories.filter(cat => cat.results.length > 0).map((category, catIdx) => (
                    <div key={catIdx} className="p-2">
                      <div className="flex items-center gap-1.5 mb-1.5 px-2">
                        <div className={`${category.color}`}>{category.icon}</div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{category.category}</span>
                      </div>
                      <div className="space-y-0.5">
                        {category.results.map((result, idx) => (
                          <button
                            key={idx}
                            className={`w-full flex items-start gap-2 px-2 py-1.5 rounded-lg hover:${category.bgColor} text-left transition-colors group`}
                            onClick={() => setShowSearchSuggestions(false)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-medium text-gray-900 truncate">{result.name}</div>
                              <div className="text-[10px] text-gray-500 truncate">{result.meta}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Front Desk Settings */}
        {onFrontDeskSettingsClick && (
          <button 
            onClick={onFrontDeskSettingsClick}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Front Desk Settings"
          >
            <Settings className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-4 h-4 text-gray-600" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          )}
        </button>

        {/* User Profile */}
        <div className="relative pl-2 border-l border-gray-200">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-full pl-1 pr-2 py-1 transition-colors"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@mangobiz.com</p>
              </div>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Profile Settings
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
