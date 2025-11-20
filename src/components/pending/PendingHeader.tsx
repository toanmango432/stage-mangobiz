import { Search, Grid, List, ArrowUpDown, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

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
    <header className="bg-white/70 border-b border-amber-100 backdrop-blur-md px-4 sm:px-6 py-4">
      <div className="flex flex-col gap-4">
        {/* Title with Icon and Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <CreditCard size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-slate-900 leading-tight">Pending Payment</h1>
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {ticketCount}
                </span>
              </div>
              {ticketCount > 0 && (
                <span className="text-xs text-amber-700 font-medium mt-0.5">Total $2,340 pending</span>
              )}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <Tippy content="Grid view">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
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
                className={`p-2 transition-colors border-l border-gray-300 ${
                  viewMode === 'list'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List size={18} />
              </button>
            </Tippy>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client, ticket #, or service..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>

          {/* Compact Toggle (conditional) */}
          {cardViewMode && onCardViewModeToggle && (
            <Tippy content={cardViewMode === 'compact' ? 'Expand cards' : 'Compact cards'}>
              <button
                onClick={onCardViewModeToggle}
                className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
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
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <ArrowUpDown size={16} />
              <span className="hidden sm:inline">{currentSortLabel}</span>
              <ChevronDown size={14} className={`transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
            </button>

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
    </header>
  );
}
