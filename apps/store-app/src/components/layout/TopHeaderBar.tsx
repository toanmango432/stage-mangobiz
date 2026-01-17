import { useState, useEffect } from 'react';
import {
  Search, Bell, ChevronDown, Command,
  Calendar,
  LayoutGrid, MoreHorizontal, LogOut, Settings,
  Clock, HelpCircle, KeyRound, Store, Wifi, WifiOff, UserPlus, Building2,
  Plus
} from 'lucide-react';
import { ClockInOutButton } from './ClockInOutButton';
import { DeviceConnectionIndicator } from './DeviceConnectionIndicator';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { storeAuthManager } from '../../services/storeAuthManager';
import { selectStore, selectStoreName, selectMember, selectAvailableStores, switchStore, type StoreSession } from '../../store/slices/authSlice';
import { setPendingBookingClient } from '../../store/slices/uiSlice';
import { SwitchUserModal } from '../auth/SwitchUserModal';
import { PinVerificationModal, type VerifiedMember } from '../auth/PinVerificationModal';
import { GlobalSearchModal } from '../search';

interface TopHeaderBarProps {
  activeModule?: string;
  onModuleChange?: (module: string) => void;
  hideNavigation?: boolean; // Hide nav tabs on mobile (handled by BottomNavBar)
  onOpenTicketPanel?: () => void; // Callback to open the global ticket panel
}

export function TopHeaderBar({
  activeModule = 'frontdesk',
  onModuleChange,
  hideNavigation = false,
  onOpenTicketPanel
}: TopHeaderBarProps) {
  // Store info now comes from Redux (see selectStore/selectStoreName below)
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount] = useState(3);
  // Header always visible since sections handle their own scrolling
  const [isHeaderVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [showSwitchUserModal, setShowSwitchUserModal] = useState(false);
  const [showPinVerificationModal, setShowPinVerificationModal] = useState(false);
  const [pendingPinAction, setPendingPinAction] = useState<'settings' | 'reports' | null>(null);
  const [showStoreSwitcher, setShowStoreSwitcher] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Get dispatch for actions
  const dispatch = useAppDispatch();

  // Get online status and device mode from Redux/auth
  const isOnline = useAppSelector((state) => state.sync?.isOnline ?? true);
  const isSyncing = useAppSelector((state) => state.sync?.isSyncing ?? false);
  const deviceMode = storeAuthManager.getDeviceMode();
  const isOfflineEnabled = deviceMode === 'offline-enabled';

  // Get store info from Redux
  const store = useAppSelector(selectStore);
  const storeName = useAppSelector(selectStoreName) || 'Your Store';
  const storeEmail = store?.storeLoginId || '';

  // Get current member for display
  const currentMember = useAppSelector(selectMember);

  // Get available stores for store switching
  const availableStores = useAppSelector(selectAvailableStores);

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Note: Auto-hide disabled because app uses overflow-hidden layout
  // where individual sections handle scrolling, not the window

  // Keyboard shortcut for search (Cmd/Ctrl + K) - Opens GlobalSearchModal
  // Note: The GlobalSearchModal also registers this shortcut internally,
  // but we keep this for cases where the modal component isn't mounted yet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for search action events - handles page navigation and other actions
  useEffect(() => {
    const handleSearchAction = (event: CustomEvent) => {
      const { action, entityType, entityId, page, path, clientData } = event.detail;

      // Always close search modal first
      setShowGlobalSearch(false);

      // Handle page navigation from search (go: prefix)
      if (action === 'navigate-page' && page) {
        onModuleChange?.(page);
        return;
      }

      // Handle settings navigation (set: prefix)
      if (action === 'navigate' && path) {
        onModuleChange?.('more');
        return;
      }

      // Handle entity-specific actions
      switch (entityType) {
        case 'client':
          if (action === 'book') {
            // Set pending booking client and navigate to book page
            if (clientData) {
              dispatch(setPendingBookingClient({
                id: clientData.id,
                name: clientData.name,
                phone: clientData.phone || '',
                email: clientData.email || '',
              }));
            }
            onModuleChange?.('book');
          } else if (action === 'view') {
            // Navigate to clients list/detail
            onModuleChange?.('clients');
          } else if (action === 'create-ticket') {
            // Open ticket panel for this client
            onOpenTicketPanel?.();
          }
          break;

        case 'staff':
          if (action === 'view-schedule' || action === 'view') {
            onModuleChange?.('schedule');
          } else if (action === 'assign') {
            // Navigate to team/front desk
            onModuleChange?.('frontdesk');
          }
          break;

        case 'service':
          if (action === 'book') {
            onModuleChange?.('book');
          } else if (action === 'view' || action === 'add-to-ticket') {
            onModuleChange?.('category');
          }
          break;

        case 'appointment':
          if (action === 'check-in' || action === 'edit' || action === 'cancel' || action === 'create-ticket') {
            onModuleChange?.('book');
          }
          break;

        case 'ticket':
          if (action === 'view' || action === 'edit' || action === 'checkout') {
            // Navigate to frontdesk where tickets are managed
            onModuleChange?.('frontdesk');
          } else if (action === 'print') {
            // Print action - would need printer service
            console.log('Print ticket:', entityId);
          }
          break;

        case 'transaction':
          if (action === 'view-receipt' || action === 'print' || action === 'refund') {
            // Navigate to closed tickets/transaction records
            onModuleChange?.('closed');
          }
          break;

        case 'setting':
          // Settings navigate to more/settings
          onModuleChange?.('more');
          break;

        case 'page':
          // Direct page navigation
          if (entityId) {
            onModuleChange?.(entityId);
          }
          break;

        default:
          console.log('Unhandled search action:', action, entityType, entityId);
      }
    };

    window.addEventListener('global-search-action', handleSearchAction as EventListener);
    return () => window.removeEventListener('global-search-action', handleSearchAction as EventListener);
  }, [onModuleChange, onOpenTicketPanel, dispatch]);

  // Navigation Modules - 3 core modules for busy salon staff
  // Large, obvious buttons following "remote control" principle
  // Note: +New is a special action button, not a navigation module
  const modules = [
    { id: 'book', label: 'Book', icon: Calendar },
    { id: 'frontdesk', label: 'Front Desk', icon: LayoutGrid },
  ];

  // Handle sign out
  const handleSignOut = async () => {
    setShowUserMenu(false);
    await storeAuthManager.logoutStore();
    // Reload page to show login screen
    window.location.reload();
  };

  // Handle store switch
  const handleSwitchStore = (selectedStore: StoreSession) => {
    dispatch(switchStore(selectedStore));
    setShowStoreSwitcher(false);
    setShowUserMenu(false);
    // Reload data for the new store
    window.location.reload();
  };

  // Get initials for avatar
  const getStoreInitials = () => {
    if (!storeName) return 'S';
    const words = storeName.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return storeName.substring(0, 2).toUpperCase();
  };

  return (
    <header className={`
      bg-gradient-to-b from-amber-100/40 to-white/25
      backdrop-blur-xl backdrop-saturate-[1.8]
      border border-white/60
      rounded-b-2xl md:rounded-b-3xl
      shadow-[0_8px_32px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]
      h-12 md:h-16 flex items-center px-4 md:px-8 lg:px-10 fixed top-0 left-0 right-0 z-50
      transition-all duration-300 ease-out
      ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
    `}>
      {/* Left Section - Logo, Clock & Organization (subtle, secondary to nav) */}
      {/* Responsive: shrinks at narrow widths to give nav more space */}
      <div className={`flex items-center gap-1.5 lg:gap-2 xl:gap-2.5 flex-shrink-0 ${hideNavigation ? 'flex-1' : 'min-w-[120px] lg:min-w-[140px] xl:min-w-[160px]'}`}>
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

        {/* Clock In/Out Button - Prominent punch clock action */}
        <ClockInOutButton />

        {/* Store name moved to profile dropdown for cleaner header */}
      </div>

      {/* Center Section - Navigation (hidden on mobile/tablet when BottomNavBar is shown) */}
      {/* Clean, modern navigation with circular +New button */}
      {!hideNavigation && (
      <div className="flex-1 flex justify-center items-center h-full min-w-0 overflow-hidden px-2">
        <nav className="flex items-center gap-1 lg:gap-1.5 h-full">
          {/* Navigation Tabs - Clean pill style */}
          <div className="flex items-center bg-gray-100/80 rounded-full p-1">
            {/* Main Navigation: Book & Front Desk */}
            {modules.map((module) => {
              const Icon = module.icon;
              const isActive = activeModule === module.id;

              return (
                <button
                  key={module.id}
                  onClick={() => onModuleChange?.(module.id)}
                  title={module.label}
                  className={`
                    relative flex items-center justify-center gap-2
                    px-4 lg:px-5 xl:px-6 py-2 xl:py-2.5
                    rounded-full transition-all duration-200
                    min-h-[40px] xl:min-h-[44px]
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2
                    ${isActive
                      ? 'bg-white text-orange-600 shadow-md font-semibold'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white/60'
                    }
                  `}
                >
                  <Icon
                    size={20}
                    className="w-5 h-5 flex-shrink-0"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className={`hidden lg:inline text-sm xl:text-base whitespace-nowrap ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {module.label}
                  </span>
                </button>
              );
            })}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300/60 mx-1" />

            {/* More Button - Inside the pill */}
            <button
              onClick={() => onModuleChange?.('more')}
              title="More"
              className={`
                relative flex items-center justify-center gap-1.5
                px-3 lg:px-4 py-2 xl:py-2.5
                rounded-full transition-all duration-200
                min-h-[40px] xl:min-h-[44px]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2
                ${activeModule === 'more'
                  ? 'bg-white text-gray-700 shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }
              `}
            >
              <MoreHorizontal size={18} className="w-[18px] h-[18px] flex-shrink-0" />
              <span className={`hidden lg:inline text-sm whitespace-nowrap ${activeModule === 'more' ? 'font-medium' : 'font-normal'}`}>
                More
              </span>
            </button>
          </div>

          {/* +New Button - Circular icon only, outlined style */}
          <button
            onClick={() => onOpenTicketPanel?.()}
            title="Create New Ticket"
            className="
              relative flex items-center justify-center
              w-11 h-11 lg:w-12 lg:h-12
              ml-2 lg:ml-3
              rounded-full transition-all duration-200 group
              focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2
              bg-white border-2 border-orange-400
              text-orange-500
              shadow-sm
              hover:bg-orange-50 hover:border-orange-500 hover:shadow-md
              active:scale-95
            "
          >
            <Plus
              size={24}
              className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90"
              strokeWidth={2.5}
            />
          </button>
        </nav>
      </div>
      )}

      {/* Right Section - Search, Actions & User */}
      {/* Responsive: shrinks search bar at narrow widths, maintains core actions */}
      <div className={`flex items-center gap-1.5 lg:gap-2 xl:gap-3 justify-end flex-shrink-0 ${hideNavigation ? '' : 'min-w-[180px] lg:min-w-[200px] xl:min-w-[240px]'}`}>
        {/* Compact Search Trigger - Opens GlobalSearchModal */}
        <button
          onClick={() => setShowGlobalSearch(true)}
          className={`relative flex items-center gap-2 transition-all duration-300 ease-out ${
            hideNavigation ? 'w-32 sm:w-44 md:w-52' : 'w-28 lg:w-36 xl:w-44'
          } pl-3 md:pl-3.5 pr-3 md:pr-3.5 py-1.5 md:py-2 bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-lg hover:bg-white/80 hover:border-gray-300/80 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300`}
        >
          <Search className="w-[18px] h-[18px] text-gray-600 flex-shrink-0" strokeWidth={2.5} />
          <span className="text-sm text-gray-400 truncate flex-1 text-left">Search...</span>
          {!hideNavigation && (
            <div className="hidden xl:flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 rounded text-gray-400 text-[10px] font-medium flex-shrink-0">
              <Command size={10} />
              <span>K</span>
            </div>
          )}
        </button>

        {/* Notifications - glass style with badge */}
        <button className="relative p-2 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-lg transition-all">
          <Bell className="w-4 h-4 text-gray-600" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{notificationCount}</span>
          )}
        </button>

        {/* Device Connection Status */}
        <DeviceConnectionIndicator />

        {/* Store Profile - glass style */}
        <div className="relative ml-0.5 lg:ml-1">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1 lg:gap-2 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-lg pl-1 pr-1.5 lg:pr-2 py-1 transition-all"
          >
            <div className="w-6 h-6 lg:w-7 lg:h-7 bg-gradient-to-br from-orange-500 to-pink-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-[10px] lg:text-xs">{getStoreInitials()}</span>
            </div>
            <ChevronDown className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-500" />
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
              {/* Store Header - Shows which store is logged in */}
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-pink-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{storeName}</p>
                    <p className="text-xs text-gray-500 truncate">{storeEmail}</p>
                  </div>
                </div>
                {/* Connection Status */}
                <div className="mt-2 flex items-center gap-1.5">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3 text-green-500" />
                      <span className="text-[10px] text-green-600 font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] text-amber-600 font-medium">Offline Mode</span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Actions for Shared Terminal */}
              <div className="py-1">
                {/* Switch Store - Only shown for multi-store accounts */}
                {availableStores.length > 1 && (
                  <div className="relative border-b border-gray-100">
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 transition-colors flex items-center gap-3"
                      onClick={() => setShowStoreSwitcher(!showStoreSwitcher)}
                    >
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-purple-700">Switch Store</span>
                        <p className="text-[10px] text-gray-500">
                          {storeName} • {availableStores.length} stores
                        </p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showStoreSwitcher ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Store List Dropdown */}
                    {showStoreSwitcher && (
                      <div className="bg-purple-50 border-t border-purple-100">
                        {availableStores.map((storeOption) => {
                          const isCurrentStore = storeOption.storeId === store?.storeId;
                          return (
                            <button
                              key={storeOption.storeId}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${
                                isCurrentStore
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'text-gray-700 hover:bg-purple-100'
                              }`}
                              onClick={() => !isCurrentStore && handleSwitchStore(storeOption)}
                              disabled={isCurrentStore}
                            >
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                                isCurrentStore
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-white border border-gray-200'
                              }`}>
                                <Store className="w-3 h-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`block truncate ${isCurrentStore ? 'font-semibold' : 'font-medium'}`}>
                                  {storeOption.storeName}
                                </span>
                                {isCurrentStore && (
                                  <span className="text-[10px] text-purple-600">Current</span>
                                )}
                              </div>
                              {isCurrentStore && (
                                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Switch User - Primary action for shift handover */}
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-100"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowSwitchUserModal(true);
                  }}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-blue-700">Switch User</span>
                    <p className="text-[10px] text-gray-500">
                      {currentMember
                        ? `Currently: ${currentMember.firstName} ${currentMember.lastName}`
                        : 'Hand off to another staff member'
                      }
                    </p>
                  </div>
                </button>

                {/* Staff Clock In/Out - Essential for shared POS */}
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  onClick={() => {
                    setShowUserMenu(false);
                    // TODO: Open clock in/out modal
                  }}
                >
                  <Clock className="w-4 h-4 text-blue-500" />
                  <div>
                    <span className="font-medium">Clock In / Out</span>
                    <p className="text-[10px] text-gray-400">Track staff hours</p>
                  </div>
                </button>

                {/* Staff PIN Entry - For restricted actions */}
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowPinVerificationModal(true);
                  }}
                >
                  <KeyRound className="w-4 h-4 text-purple-500" />
                  <div>
                    <span className="font-medium">Enter Staff PIN</span>
                    <p className="text-[10px] text-gray-400">For manager actions</p>
                  </div>
                </button>
              </div>

              <div className="border-t border-gray-100 py-1">
                {/* Store Settings - Requires PIN in store-only mode */}
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  onClick={() => {
                    setShowUserMenu(false);
                    // If no member logged in (store-only mode), require PIN
                    if (!currentMember) {
                      setPendingPinAction('settings');
                      setShowPinVerificationModal(true);
                    } else {
                      // Member already logged in - direct access
                      onModuleChange?.('more');
                    }
                  }}
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span>Store Settings</span>
                </button>

                {/* Help & Support */}
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  onClick={() => {
                    setShowUserMenu(false);
                    // TODO: Open help modal or link
                  }}
                >
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  <span>Help & Support</span>
                </button>
              </div>

              {/* Sign Out - Destructive action at bottom */}
              <div className="border-t border-gray-100 py-1 bg-gray-50">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                >
                  <LogOut className="w-4 h-4" />
                  <div>
                    <span className="font-medium">Sign Out Store</span>
                    <p className="text-[10px] text-red-400">End this device session</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Switch User Modal */}
      <SwitchUserModal
        isOpen={showSwitchUserModal}
        onClose={() => setShowSwitchUserModal(false)}
        onSuccess={() => {
          console.log('User switched successfully');
        }}
      />

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinVerificationModal}
        onClose={() => {
          setShowPinVerificationModal(false);
          setPendingPinAction(null);
        }}
        onSuccess={(verifiedMember?: VerifiedMember) => {
          console.log('PIN verified for:', verifiedMember?.memberName);
          // Execute the pending action
          if (pendingPinAction === 'settings') {
            onModuleChange?.('more');
          } else if (pendingPinAction === 'reports') {
            onModuleChange?.('transaction-records');
          }
          setPendingPinAction(null);
        }}
        title={pendingPinAction === 'settings' ? 'Access Store Settings' : 'Enter Staff PIN'}
        description={
          pendingPinAction === 'settings'
            ? 'Enter your staff PIN to access store settings'
            : 'Enter your staff PIN to continue'
        }
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        open={showGlobalSearch}
        onOpenChange={setShowGlobalSearch}
      />
    </header>
  );
}
