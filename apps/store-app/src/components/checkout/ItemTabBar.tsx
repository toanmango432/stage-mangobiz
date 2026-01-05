import { cn } from '@/lib/utils';
import { Sparkles, ShoppingBag, Package, Gift, Search, MoreVertical } from 'lucide-react';
import { ReactNode } from 'react';

export type ItemTabType = 'services' | 'products' | 'packages' | 'giftcards';

interface ItemTabBarProps {
  activeTab: ItemTabType;
  onTabChange: (tab: ItemTabType) => void;
  className?: string;
  layout?: 'classic' | 'modern';
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchClick?: () => void; // For icon-only search mode
  onMoreClick?: () => void;
  rightControls?: ReactNode; // For toggle/minimize buttons in modern layout
  compact?: boolean; // Smaller sizing for dock view
  searchIconOnly?: boolean; // Show only search icon instead of full search bar
}

const TABS: { id: ItemTabType; label: string; icon: React.ElementType }[] = [
  { id: 'services', label: 'Services', icon: Sparkles },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'giftcards', label: 'Gift Cards', icon: Gift },
];

export function ItemTabBar({ activeTab, onTabChange, className, layout = 'classic', searchQuery = '', onSearchChange, onSearchClick, onMoreClick, rightControls, compact = false, searchIconOnly = false }: ItemTabBarProps) {
  if (layout === 'modern') {
    // Compact sizing for dock view
    const tabPadding = compact ? 'px-3 py-1.5' : 'px-5 py-2.5';
    const tabTextSize = compact ? 'text-xs' : 'text-sm';
    const iconSize = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';
    const searchWidth = compact ? 'w-24' : 'w-36';
    const searchPadding = compact ? 'pl-7 pr-3 py-1.5' : 'pl-9 pr-4 py-2';
    const searchIconLeft = compact ? 'left-2' : 'left-3';
    const buttonSize = compact ? 'h-7 w-7' : 'h-9 w-9';

    return (
      <div className={cn('flex items-center justify-between gap-2 min-w-0', className)}>
        {/* Tabs - subtle pill container matching reference, scrollable if needed */}
        <div className="flex items-center bg-gray-100/80 p-1 rounded-full overflow-x-auto scrollbar-hide flex-shrink min-w-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  `flex items-center gap-1.5 ${tabPadding} ${tabTextSize} font-medium rounded-full transition-all duration-150 whitespace-nowrap flex-shrink-0`,
                  activeTab === tab.id
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-600'
                )}
              >
                <Icon className={`${iconSize} flex-shrink-0`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right side controls: Search + More + Toggle/Minimize */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Search - icon only or full search bar */}
          {searchIconOnly && onSearchClick ? (
            <button
              onClick={onSearchClick}
              className={`${buttonSize} rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
              aria-label="Search"
            >
              <Search className={`${iconSize} text-gray-500`} />
            </button>
          ) : onSearchChange && (
            <div className="relative">
              <Search className={`absolute ${searchIconLeft} top-1/2 -translate-y-1/2 ${iconSize} text-gray-400`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className={`${searchPadding} ${searchWidth} ${tabTextSize} bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all`}
              />
            </div>
          )}

          {/* More Options Button */}
          {onMoreClick && (
            <button
              onClick={onMoreClick}
              className={`${buttonSize} rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
              aria-label="More options"
            >
              <MoreVertical className={`${iconSize} text-gray-500`} />
            </button>
          )}

          {/* Right Controls (Toggle/Minimize buttons passed from parent) */}
          {rightControls}
        </div>
      </div>
    );
  }

  // Classic layout
  return (
    <div className={cn('flex items-center gap-1 bg-gray-100 p-1.5 rounded-xl', className)}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-150',
            activeTab === tab.id
              ? 'bg-white text-primary shadow-md ring-1 ring-gray-200'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default ItemTabBar;
