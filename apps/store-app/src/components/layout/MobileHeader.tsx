import { useState, useRef, useEffect } from 'react';
import { Search, Bell, X, Menu, ChevronLeft } from 'lucide-react';

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onMenuClick?: () => void;
  showSearch?: boolean;
  onSearchChange?: (query: string) => void;
  notificationCount?: number;
  className?: string;
}

/**
 * MobileHeader Component
 *
 * A simplified, touch-optimized header for mobile devices.
 * Features:
 * - Expandable search overlay
 * - Back button support for navigation
 * - Notification badge
 * - 44px+ touch targets
 */
export function MobileHeader({
  title = 'Mango POS',
  showBackButton = false,
  onBackClick,
  onMenuClick,
  showSearch = true,
  onSearchChange,
  notificationCount = 0,
  className = '',
}: MobileHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchOpen = () => {
    setIsSearchOpen(true);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    onSearchChange?.('');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  return (
    <header
      className={`bg-white/95 backdrop-blur-lg border-b border-gray-200/80 h-14 flex items-center px-3 shadow-sm fixed top-0 left-0 right-0 z-50 ${className}`}
    >
      {/* Search Overlay - Full width when open */}
      {isSearchOpen ? (
        <div className="flex items-center gap-2 w-full animate-fade-in">
          <button
            onClick={handleSearchClose}
            className="p-2 -ml-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close search"
          >
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tickets, clients..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border-0 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
              style={{ fontSize: '16px' }} // Prevent iOS zoom
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Clear search"
              >
                <X size={16} className="text-gray-500" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Left Section - Back/Menu + Logo */}
          <div className="flex items-center gap-2 flex-1">
            {showBackButton ? (
              <button
                onClick={onBackClick}
                className="p-2 -ml-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Go back"
              >
                <ChevronLeft size={24} className="text-gray-700" />
              </button>
            ) : onMenuClick ? (
              <button
                onClick={onMenuClick}
                className="p-2 -ml-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Open menu"
              >
                <Menu size={22} className="text-gray-700" />
              </button>
            ) : null}

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-bold text-gray-900 text-lg tracking-tight">
                {title}
              </span>
            </div>
          </div>

          {/* Right Section - Search + Notifications */}
          <div className="flex items-center gap-1">
            {showSearch && (
              <button
                onClick={handleSearchOpen}
                className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Open search"
              >
                <Search size={22} className="text-gray-600" />
              </button>
            )}

            {/* Notifications */}
            <button
              className="relative p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
            >
              <Bell size={22} className="text-gray-600" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
              )}
            </button>
          </div>
        </>
      )}
    </header>
  );
}

/**
 * MobileSubHeader Component
 *
 * A secondary header for page-specific controls like filters, sorting, etc.
 * Sits below the main header.
 */
export function MobileSubHeader({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border-b border-gray-200 px-3 py-2 sticky top-14 z-40 ${className}`}
    >
      {children}
    </div>
  );
}
