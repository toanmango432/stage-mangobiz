import { ArrowUpDown, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

type PaymentType = 'all' | 'card' | 'cash' | 'venmo';
type SortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low' | 'client-name';

interface PendingTabNavigationProps {
  activeTab: PaymentType;
  onTabChange: (tab: PaymentType) => void;
  allCount: number;
  cardCount: number;
  cashCount: number;
  venmoCount: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  cardViewMode?: 'normal' | 'compact';
  onCardViewModeToggle?: () => void;
}

export function PendingTabNavigation({
  activeTab,
  onTabChange,
  allCount,
  cardCount,
  cashCount,
  venmoCount,
  sortBy,
  onSortChange,
  cardViewMode,
  onCardViewModeToggle,
}: PendingTabNavigationProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'all' as const, label: 'All', count: allCount },
    { id: 'card' as const, label: 'Card', count: cardCount },
    { id: 'cash' as const, label: 'Cash', count: cashCount },
    { id: 'venmo' as const, label: 'Venmo', count: venmoCount },
  ];

  const sortOptions = [
    { id: 'newest' as const, label: 'Newest First' },
    { id: 'oldest' as const, label: 'Oldest First' },
    { id: 'amount-high' as const, label: 'Amount: High to Low' },
    { id: 'amount-low' as const, label: 'Amount: Low to High' },
    { id: 'client-name' as const, label: 'Client Name' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSortLabel = sortOptions.find(opt => opt.id === sortBy)?.label || 'Sort';

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 ml-4">
          {/* Card View Mode Toggle (if in grid view) */}
          {cardViewMode && onCardViewModeToggle && (
            <Tippy content={cardViewMode === 'compact' ? 'Expand cards' : 'Compact cards'}>
              <button
                onClick={onCardViewModeToggle}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {cardViewMode === 'compact' ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronUp size={18} />
                )}
              </button>
            </Tippy>
          )}

          {/* Sort Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Tippy content="Sort options">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-300"
              >
                <ArrowUpDown size={16} />
                <span className="hidden sm:inline">{currentSortLabel}</span>
              </button>
            </Tippy>

            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onSortChange(option.id);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      sortBy === option.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
