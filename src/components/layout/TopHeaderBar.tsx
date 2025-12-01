import { useState, useEffect, useRef } from 'react';
import {
  Search, Bell, ChevronDown, Command, Hash, UserCircle,
  FileText, Calendar, DollarSign, Users, Scissors, TrendingUp, Zap,
  LayoutGrid, CreditCard, MoreHorizontal
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { storeAuthManager } from '../../services/storeAuthManager';

interface TopHeaderBarProps {
  activeModule?: string;
  onModuleChange?: (module: string) => void;
  hideNavigation?: boolean; // Hide nav tabs on mobile (handled by BottomNavBar)
}

export function TopHeaderBar({
  activeModule = 'frontdesk',
  onModuleChange,
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);

  // Get online status and device mode from Redux/auth
  const isOnline = useAppSelector((state) => state.sync?.isOnline ?? true);
  const isSyncing = useAppSelector((state) => state.sync?.isSyncing ?? false);
  const deviceMode = storeAuthManager.getDeviceMode();
  const isOfflineEnabled = deviceMode === 'offline-enabled';

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <header className={`
      bg-gradient-to-b from-white/40 to-white/20
      backdrop-blur-xl backdrop-saturate-[1.8]
      border border-white/80
      rounded-b-2xl md:rounded-b-3xl
      shadow-[0_8px_32px_rgba(31,38,135,0.12),0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.3)]
      h-12 md:h-16 flex items-center px-2.5 md:px-4 fixed top-0 left-0 right-0 z-50
      transition-transform duration-300 ease-out
      ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
    `}>
      {/* Left Section - Logo, Clock & Organization (subtle, secondary to nav) */}
      <div className={`flex items-center gap-2 md:gap-2.5 ${hideNavigation ? 'flex-1' : 'min-w-[160px]'}`}>
        {/* Mango Logo - Status-Aware Interactive Indicator */}
        {/* Online: Vibrant colors with subtle glow | Offline: Grayscale with pulse | Syncing: Shimmer effect */}
        <div
          className="flex-shrink-0 relative cursor-pointer group"
          onMouseEnter={() => setShowStatusTooltip(true)}
          onMouseLeave={() => setShowStatusTooltip(false)}
        >
          {/* Glow effect for online status */}
          {isOnline && (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/30 to-yellow-300/20 rounded-full blur-md scale-110 animate-pulse" />
          )}

          {/* Syncing spinner ring */}
          {isSyncing && (
            <div className="absolute inset-[-4px] border-2 border-transparent border-t-blue-500 border-r-blue-400 rounded-full animate-spin" />
          )}

          <svg
            viewBox="0 0 60 70"
            className={`w-7 h-8 md:w-8 md:h-9 relative z-10 transition-all duration-500
              ${!isOnline ? 'grayscale opacity-60' : 'opacity-100'}
              ${isSyncing ? 'scale-95' : 'scale-100'}
              group-hover:scale-110
            `}
          >
            {/* Gradient definitions - different colors for online vs offline */}
            <defs>
              {/* Online: Vibrant orange-yellow gradient */}
              <linearGradient id="mangoBodyGradOnline" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFC94D" />
                <stop offset="40%" stopColor="#FFB833" />
                <stop offset="100%" stopColor="#F5A623" />
              </linearGradient>
              {/* Offline: Muted gray gradient */}
              <linearGradient id="mangoBodyGradOffline" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A0A0A0" />
                <stop offset="40%" stopColor="#888888" />
                <stop offset="100%" stopColor="#707070" />
              </linearGradient>
              {/* Online: Bright green leaf */}
              <linearGradient id="leafGradOnline" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7CB342" />
                <stop offset="100%" stopColor="#AED581" />
              </linearGradient>
              {/* Offline: Gray leaf */}
              <linearGradient id="leafGradOffline" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#808080" />
                <stop offset="100%" stopColor="#A0A0A0" />
              </linearGradient>
            </defs>

            {/* Leaf */}
            <path
              d="M30 8 Q22 2 14 6 Q18 14 28 12 Z"
              fill={isOnline ? "url(#leafGradOnline)" : "url(#leafGradOffline)"}
              className="transition-all duration-500"
            />
            {/* Leaf vein */}
            <path
              d="M28 10 Q22 7 16 8"
              stroke={isOnline ? "#558B2F" : "#606060"}
              strokeWidth="1.5"
              fill="none"
              className="transition-all duration-500"
            />

            {/* Stem */}
            <path
              d="M30 8 Q32 14 30 18"
              stroke={isOnline ? "#2D2D2D" : "#505050"}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              className="transition-all duration-500"
            />

            {/* Mango body */}
            <ellipse
              cx="30"
              cy="42"
              rx="22"
              ry="26"
              fill={isOnline ? "url(#mangoBodyGradOnline)" : "url(#mangoBodyGradOffline)"}
              className="transition-all duration-500"
            />

            {/* Dark outline */}
            <path
              d="M30 16 Q10 22 10 42 Q10 60 24 66"
              stroke={isOnline ? "#2D2D2D" : "#505050"}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              className="transition-all duration-500"
            />

            {/* Smile curve */}
            <path
              d="M20 56 Q30 62 42 52"
              stroke={isOnline ? "#2D2D2D" : "#505050"}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              className="transition-all duration-500"
            />

            {/* Highlight spots - only visible when online */}
            <ellipse
              cx="38"
              cy="34"
              rx="5"
              ry="4"
              fill={isOnline ? "#FFEEDD" : "#C0C0C0"}
              opacity={isOnline ? 0.7 : 0.3}
              className="transition-all duration-500"
            />
            <ellipse
              cx="42"
              cy="40"
              rx="3"
              ry="2.5"
              fill={isOnline ? "#FFEEDD" : "#B0B0B0"}
              opacity={isOnline ? 0.5 : 0.2}
              className="transition-all duration-500"
            />

            {/* Status indicator dot in corner */}
            <circle
              cx="48"
              cy="58"
              r="6"
              fill={isOnline ? "#22C55E" : (isOfflineEnabled ? "#F59E0B" : "#EF4444")}
              stroke="white"
              strokeWidth="2"
              className={`transition-all duration-300 ${!isOnline && isOfflineEnabled ? 'animate-pulse' : ''}`}
            />
          </svg>

          {/* Status Tooltip - detailed info on hover */}
          {showStatusTooltip && (
            <div className="absolute top-full left-0 mt-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-green-400' : (isOfflineEnabled ? 'bg-amber-400' : 'bg-red-400')
                  }`} />
                  <span className="font-medium">
                    {isOnline
                      ? 'Online'
                      : isOfflineEnabled
                        ? 'Offline Mode'
                        : 'No Connection'}
                  </span>
                </div>
                {isSyncing && (
                  <div className="mt-1 text-gray-300 text-[10px]">Syncing data...</div>
                )}
                {!isOnline && isOfflineEnabled && (
                  <div className="mt-1 text-gray-300 text-[10px]">Changes saved locally</div>
                )}
                {!isOnline && !isOfflineEnabled && (
                  <div className="mt-1 text-gray-300 text-[10px]">Internet required</div>
                )}
                <div className="mt-1 text-gray-400 text-[10px]">
                  Mode: {isOfflineEnabled ? 'Offline-Enabled' : 'Online-Only'}
                </div>
                {/* Tooltip arrow */}
                <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            </div>
          )}
        </div>

        {/* Always-Visible Status Badge - shows without hover */}
        {/* Only show when offline OR syncing - online is the "normal" state so no badge needed */}
        {(!isOnline || isSyncing) && (
          <div className={`
            flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold
            transition-all duration-300 animate-in fade-in slide-in-from-left-2
            ${isSyncing
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : isOfflineEnabled
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }
          `}>
            {/* Animated dot */}
            <span className={`
              w-1.5 h-1.5 rounded-full
              ${isSyncing
                ? 'bg-blue-500 animate-ping'
                : isOfflineEnabled
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-red-500 animate-pulse'
              }
            `} />
            <span className="hidden sm:inline">
              {isSyncing
                ? 'Syncing'
                : isOfflineEnabled
                  ? 'Offline'
                  : 'No Connection'
              }
            </span>
          </div>
        )}

        {/* Clock - Elegant split typography, compact on mobile */}
        <div className="flex items-baseline gap-0.5">
          <span className="text-xs md:text-sm font-semibold text-gray-600 tabular-nums tracking-tight">
            {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }).split(':')[0]}
          </span>
          <span className="text-xs md:text-sm font-semibold text-gray-400 animate-pulse">:</span>
          <span className="text-xs md:text-sm font-medium text-gray-500 tabular-nums tracking-tight">
            {currentTime.toLocaleTimeString('en-US', { minute: '2-digit' }).padStart(2, '0').slice(-2)}
          </span>
          <span className="text-[9px] md:text-[10px] font-medium text-gray-400 ml-0.5 uppercase">
            {currentTime.getHours() >= 12 ? 'pm' : 'am'}
          </span>
        </div>

        {/* Organization Selector - subtle */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/40 transition-colors"
          >
            <span className="text-xs text-gray-500">{selectedOrg}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
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
                  relative flex items-center gap-2 lg:gap-3 px-3 lg:px-5 xl:px-6 py-2 lg:py-3 rounded-xl transition-all duration-150 group
                  min-h-[44px] lg:min-h-[52px] transform
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2
                  ${isActive
                    ? 'bg-orange-50 text-orange-600 shadow-sm border-b-2 border-orange-500'
                    : 'text-gray-700 bg-white shadow-md hover:shadow-lg hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] active:shadow-sm active:bg-gray-100'
                  }
                `}
              >
                <Icon
                  size={20}
                  className="lg:w-6 lg:h-6 transition-transform duration-200 group-hover:scale-110"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`text-base lg:text-lg ${isActive ? 'font-bold' : 'font-semibold'}`}>
                  {module.label}
                </span>
              </button>
            );
          })}

          {/* More Button - glass style, secondary importance */}
          <button
            onClick={() => onModuleChange?.('more')}
            className={`
              relative flex items-center gap-2 lg:gap-2.5 px-3 lg:px-4 xl:px-5 py-2 lg:py-2.5 rounded-xl transition-all duration-150 group
              min-h-[44px] lg:min-h-[48px] transform
              focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2
              ${activeModule === 'more'
                ? 'bg-gray-100 text-gray-700 shadow-sm border-b-2 border-gray-500'
                : 'text-gray-600 bg-white shadow-md hover:shadow-lg hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] active:shadow-sm active:bg-gray-100'
              }
            `}
          >
            <MoreHorizontal size={18} className="lg:w-5 lg:h-5 transition-transform duration-200 group-hover:scale-110" />
            <span className={`text-sm lg:text-base ${activeModule === 'more' ? 'font-semibold' : 'font-medium'}`}>
              More
            </span>
          </button>
        </nav>
      </div>
      )}

      {/* Right Section - Search, Actions & User */}
      <div className={`flex items-center gap-2 md:gap-3 justify-end ${hideNavigation ? '' : 'min-w-[240px]'}`}>
        {/* Compact Search - glass style */}
        <div className={`relative transition-all duration-300 ease-out ${
          isSearchExpanded ? 'w-64' : hideNavigation ? 'w-32 sm:w-44 md:w-52' : 'w-40 lg:w-48'
        }`}>
          <Search className="absolute left-3 md:left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-600" strokeWidth={2.5} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className="w-full pl-9 md:pl-10 pr-3 md:pr-10 py-1.5 md:py-2 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 focus:bg-white/80 transition-all placeholder:text-gray-400 text-gray-700"
          />
          {!isSearchExpanded && !hideNavigation && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 rounded text-gray-400 text-[10px] font-medium">
              <Command size={10} />
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

        {/* Notifications - glass style with badge */}
        <button className="relative p-2 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-lg transition-all">
          <Bell className="w-4 h-4 text-gray-600" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{notificationCount}</span>
          )}
        </button>

        {/* User Profile - glass style */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-lg pl-1 pr-2 py-1 transition-all"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-pink-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
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
