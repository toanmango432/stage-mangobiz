import { Search, Grid, List, ArrowUpDown, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Input, Button } from '../ui';

type SortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low' | 'client-name';

interface PendingHeaderProps {
  ticketCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  cardViewMode?: 'normal' | 'compact';
  onCardViewModeToggle?: () => void;
  isMobile?: boolean;
}

export function PendingHeader({
  ticketCount,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  cardViewMode,
  onCardViewModeToggle,
  isMobile = false,
}: PendingHeaderProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions = [
    { id: 'newest' as const, label: 'Newest First' },
    { id: 'oldest' as const, label: 'Oldest First' },
    { id: 'amount-high' as const, label: 'Amount: High to Low' },
    { id: 'amount-low' as const, label: 'Amount: Low to High' },
    { id: 'client-name' as const, label: 'Client Name' },
  ];

  const currentSortLabel = sortOptions.find(opt => opt.id === sortBy)?.label || 'Sort';

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

  return (
    <header className={`bg-white/92 backdrop-blur-xl backdrop-saturate-150 shadow-[0_1px_2px_0_rgba(0,0,0,0.1),0_4px_8px_-2px_rgba(0,0,0,0.12),0_8px_16px_-4px_rgba(0,0,0,0.1)] sticky top-0 z-30 ${isMobile ? 'px-3 py-3' : 'px-4 sm:px-6 py-4'}`}>
      <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-4'}`}>
        {/* Title with Icon and Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`${isMobile ? 'h-9 w-9' : 'h-11 w-11'} rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center`}>
              <CreditCard size={isMobile ? 18 : 20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className={`font-semibold text-slate-900 leading-tight ${isMobile ? 'text-base' : 'text-xl'}`}>
                  {isMobile ? 'Pending' : 'Pending Payment'}
                </h1>
                <span className={`font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {ticketCount}
                </span>
              </div>
              {ticketCount > 0 && !isMobile && (
                <span className="text-xs text-amber-700 font-medium mt-0.5">Total $2,340 pending</span>
              )}
            </div>
          </div>

          {/* View Mode Toggle - Hide on mobile since we force list view */}
          {!isMobile && (
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <Tippy content="Grid view">
                <button
                  onClick={() => onViewModeChange('grid')}
                  className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${viewMode === 'grid'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Grid size={18} />
                </button>
              </Tippy>
              <Tippy content="List view">
                <button
                  onClick={() => onViewModeChange('list')}
                  className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors border-l border-gray-300 ${viewMode === 'list'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <List size={18} />
                </button>
              </Tippy>
            </div>
          )}
        </div>

        {/* Search and Sort */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={isMobile ? 'Search tickets...' : 'Search by client, ticket #, or service...'}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full pl-10 pr-4 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${isMobile ? 'py-2.5' : 'py-2'}`}
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Compact Toggle (conditional) - Hide on mobile */}
          {!isMobile && cardViewMode && onCardViewModeToggle && (
            <Tippy content={cardViewMode === 'compact' ? 'Expand cards' : 'Compact cards'}>
              <button
                onClick={onCardViewModeToggle}
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center border border-gray-300 rounded-xl bg-white text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {cardViewMode === 'compact' ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </Tippy>
          )}

          {/* Sort Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className={`flex items-center gap-1.5 border border-gray-300 rounded-xl bg-white text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap ${isMobile ? 'p-2.5 min-w-[44px] min-h-[44px] justify-center' : 'px-3 py-2.5'}`}
            >
              <ArrowUpDown size={16} />
              {!isMobile && <span className="hidden sm:inline text-sm">{currentSortLabel}</span>}
              <ChevronDown size={14} className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''} ${isMobile ? 'hidden' : ''}`} />
            </button>

            {showSortDropdown && (
              <div className={`absolute right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10 ${isMobile ? 'w-48' : 'w-56'}`}>
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onSortChange(option.id);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${sortBy === option.id
                      ? 'bg-amber-50 text-amber-600'
                      : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
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
    </header>
  );
}
