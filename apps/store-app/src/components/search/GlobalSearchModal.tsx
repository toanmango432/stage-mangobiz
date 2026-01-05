/**
 * Global Search Modal - Mango POS Command Palette
 *
 * Premium spotlight-style search with:
 * - Warm cream background (Mango signature)
 * - Distinctive typography and visual hierarchy
 * - Tactile paper-like result cards
 * - Refined stagger animations
 * - High-contrast accessibility
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Clock,
  UserCircle,
  Users,
  FileText,
  AlertCircle,
  Settings,
  Gift,
  Scissors,
  Calendar,
  DollarSign,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Sparkles,
  Navigation,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  useGlobalSearch,
  useSearchKeyboardShortcut,
} from '@/hooks/useGlobalSearch';
import { ENTITY_CONFIG, PREFIX_CONFIG, type SearchPrefix } from '@/services/search';
import SearchResultItem from './SearchResultItem';
import SearchQuickActions from './SearchQuickActions';

// ============================================================================
// Icon Map
// ============================================================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  UserCircle,
  Users,
  FileText,
  Scissors,
  Calendar,
  DollarSign,
  Settings,
  Gift,
  Sparkles,
  Navigation,
};

// ============================================================================
// Premium Skeleton with shimmer effect
// ============================================================================

function SearchResultSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="flex items-center gap-4 px-4 py-3.5 mx-2 rounded-2xl bg-white/60"
    >
      {/* Avatar skeleton with shimmer */}
      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
      </div>

      <div className="flex-1 space-y-2.5">
        <div className="relative h-4 w-36 rounded-full bg-gradient-to-r from-stone-100 to-stone-50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
        </div>
        <div className="relative h-3 w-24 rounded-full bg-gradient-to-r from-stone-50 to-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
        </div>
      </div>

      <div className="relative h-9 w-20 rounded-xl bg-gradient-to-r from-stone-100 to-stone-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
      </div>
    </motion.div>
  );
}

function LoadingSkeletons() {
  return (
    <div className="py-3 space-y-2">
      <SearchResultSkeleton delay={0} />
      <SearchResultSkeleton delay={0.08} />
      <SearchResultSkeleton delay={0.16} />
      <SearchResultSkeleton delay={0.24} />
    </div>
  );
}

// ============================================================================
// Relative Time Helper
// ============================================================================

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// Component
// ============================================================================

interface GlobalSearchModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GlobalSearchModal({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: GlobalSearchModalProps) {
  const {
    query,
    setQuery,
    parsedQuery,
    results,
    groups,
    totalCount,
    isLoading,
    error,
    isOpen: internalOpen,
    open: internalOpenFn,
    close: internalCloseFn,
    recentSearches,
    clearRecentSearches,
    removeRecentSearch,
    isIndexReady,
    executeQuickAction,
  } = useGlobalSearch();

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = useCallback(
    (newOpen: boolean) => {
      if (externalOnOpenChange) {
        externalOnOpenChange(newOpen);
      } else if (newOpen) {
        internalOpenFn();
      } else {
        internalCloseFn();
      }
    },
    [externalOnOpenChange, internalOpenFn, internalCloseFn]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useSearchKeyboardShortcut(() => {
    setIsOpen(true);
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    if (results.length === 0) return;
    const container = resultsContainerRef.current;
    if (!container) return;
    const selectedElement = container.querySelector(`[data-result-index="${selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, results.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            const result = results[selectedIndex];
            if (result.actions[0]) {
              executeQuickAction(result.actions[0].action);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
        case 'Backspace':
          if (parsedQuery?.prefix && query === parsedQuery.prefix) {
            e.preventDefault();
            setQuery('');
          }
          break;
      }
    },
    [results, selectedIndex, executeQuickAction, setIsOpen, parsedQuery, query, setQuery]
  );

  const handlePrefixSelect = useCallback(
    (prefix: SearchPrefix) => {
      setQuery(prefix);
      setTimeout(() => inputRef.current?.focus(), 10);
    },
    [setQuery]
  );

  const handleClearPrefix = useCallback(() => {
    if (parsedQuery?.prefix) {
      setQuery(parsedQuery.normalizedQuery);
    }
  }, [parsedQuery, setQuery]);

  const handleRecentSelect = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
    },
    [setQuery]
  );

  const getEmptyStateMessage = () => {
    if (parsedQuery?.prefix) {
      const prefixConfig = PREFIX_CONFIG[parsedQuery.prefix];
      if (prefixConfig) {
        return `No ${prefixConfig.label.toLowerCase()} found matching "${parsedQuery.normalizedQuery}"`;
      }
    }
    return `No results for "${query}"`;
  };

  let globalIndex = 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className={cn(
          'max-w-[640px] p-0 gap-0 overflow-hidden',
          'bg-[#faf9f7] border-0',
          'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.03)]',
          'rounded-3xl'
        )}
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Search Mango POS</DialogTitle>

        {/* Search Header - Premium styling */}
        <div className="relative px-5 py-4">
          {/* Subtle top gradient */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-50/50 to-transparent pointer-events-none" />

          <div className="relative flex items-center gap-4">
            {/* Search icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 rounded-2xl blur-xl" />
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/25">
                <Search className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Input area */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              {/* Active prefix chip */}
              <AnimatePresence mode="popLayout">
                {parsedQuery?.prefix && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -10 }}
                    onClick={handleClearPrefix}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl',
                      'bg-amber-100 text-amber-800 font-semibold text-sm',
                      'hover:bg-amber-200 transition-colors group',
                      'shadow-sm'
                    )}
                  >
                    {PREFIX_CONFIG[parsedQuery.prefix]?.label || parsedQuery.prefix}
                    <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                )}
              </AnimatePresence>

              <input
                ref={inputRef}
                data-global-search-input
                type="text"
                value={parsedQuery?.prefix ? parsedQuery.normalizedQuery : query}
                onChange={(e) => {
                  if (parsedQuery?.prefix) {
                    setQuery(parsedQuery.prefix + e.target.value);
                  } else {
                    setQuery(e.target.value);
                  }
                }}
                placeholder={parsedQuery?.prefix
                  ? `Search ${PREFIX_CONFIG[parsedQuery.prefix]?.label.toLowerCase() || ''}...`
                  : "Search anything..."
                }
                className={cn(
                  'flex-1 h-12 bg-transparent outline-none',
                  'text-lg font-medium text-stone-800 placeholder:text-stone-400',
                  'caret-amber-500'
                )}
                autoFocus
              />
            </div>

            {/* Clear button */}
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setQuery('')}
                  className={cn(
                    'flex items-center justify-center w-9 h-9 rounded-xl',
                    'bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-700',
                    'transition-all'
                  )}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* ESC hint */}
            <kbd className={cn(
              'hidden sm:flex items-center gap-1 px-2.5 py-1.5',
              'text-[11px] font-semibold text-stone-400',
              'bg-white rounded-lg border border-stone-200/80',
              'shadow-sm'
            )}>
              ESC
            </kbd>
          </div>
        </div>

        {/* Divider with subtle gradient */}
        <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent mx-5" />

        {/* Content Area */}
        <div
          ref={resultsContainerRef}
          className="max-h-[55vh] overflow-y-auto overflow-x-hidden scroll-smooth"
        >
          <AnimatePresence mode="wait">
            {/* Index building state */}
            {!isIndexReady && (
              <motion.div
                key="building"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-[3px] border-amber-100 border-t-amber-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
                <p className="mt-5 text-base font-semibold text-stone-700">Preparing search...</p>
                <p className="mt-1 text-sm text-stone-400">This only takes a moment</p>
              </motion.div>
            )}

            {/* Error state */}
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4 shadow-sm">
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <p className="text-sm font-semibold text-red-600">{error}</p>
                <button
                  onClick={() => setQuery(query)}
                  className={cn(
                    'mt-4 px-5 py-2.5 text-sm font-semibold',
                    'text-amber-700 bg-amber-50 hover:bg-amber-100',
                    'rounded-xl transition-colors'
                  )}
                >
                  Try again
                </button>
              </motion.div>
            )}

            {/* Empty query - show quick actions and recent searches */}
            {isIndexReady && !query && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Quick Action Prefixes */}
                <SearchQuickActions onPrefixSelect={handlePrefixSelect} />

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-stone-400" />
                        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                          Recent
                        </span>
                      </div>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs font-medium text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {recentSearches.slice(0, 6).map((recent, idx) => {
                        const IconComponent = recent.primaryResultType
                          ? ICON_MAP[ENTITY_CONFIG[recent.primaryResultType]?.icon] || Search
                          : Clock;

                        return (
                          <motion.button
                            key={recent.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => handleRecentSelect(recent.query)}
                            className={cn(
                              'group flex items-center gap-2 px-3.5 py-2',
                              'bg-white hover:bg-stone-50',
                              'rounded-xl border border-stone-150',
                              'shadow-sm hover:shadow transition-all',
                              'max-w-[200px]'
                            )}
                          >
                            <IconComponent className="w-4 h-4 text-stone-400 shrink-0" />
                            <span className="text-sm font-medium text-stone-700 truncate">
                              {recent.query}
                            </span>
                            <span className="text-[10px] text-stone-400 shrink-0">
                              {getRelativeTime(recent.timestamp)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeRecentSearch(recent.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-stone-200 transition-all shrink-0"
                            >
                              <X className="w-3 h-3 text-stone-400" />
                            </button>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Loading state with skeletons */}
            {isIndexReady && query && isLoading && results.length === 0 && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSkeletons />
              </motion.div>
            )}

            {/* Search results */}
            {isIndexReady && query && !error && (!isLoading || results.length > 0) && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-3"
              >
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6">
                    <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-5">
                      <Search className="w-7 h-7 text-stone-300" />
                    </div>
                    <p className="text-base font-semibold text-stone-600">No results found</p>
                    <p className="text-sm text-stone-400 mt-1.5 text-center max-w-[280px]">
                      {getEmptyStateMessage()}
                    </p>
                    <div className="flex gap-3 mt-5">
                      {parsedQuery?.prefix && (
                        <button
                          onClick={handleClearPrefix}
                          className={cn(
                            'px-4 py-2 text-sm font-semibold',
                            'text-amber-700 bg-amber-50 hover:bg-amber-100',
                            'rounded-xl transition-colors'
                          )}
                        >
                          Clear filter
                        </button>
                      )}
                      <button
                        onClick={() => setQuery('')}
                        className={cn(
                          'px-4 py-2 text-sm font-semibold',
                          'text-stone-600 bg-stone-100 hover:bg-stone-200',
                          'rounded-xl transition-colors'
                        )}
                      >
                        New search
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group, groupIdx) => {
                      const GroupIcon = ICON_MAP[group.icon] || FileText;

                      return (
                        <motion.div
                          key={group.type}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: groupIdx * 0.1 }}
                        >
                          {/* Group header */}
                          <div className={cn(
                            'flex items-center gap-2.5 px-5 py-2',
                            'sticky top-0 bg-[#faf9f7]/95 backdrop-blur-sm z-10'
                          )}>
                            <div className={cn(
                              'flex items-center justify-center w-6 h-6 rounded-lg',
                              group.bgColor
                            )}>
                              <GroupIcon className={cn('w-3.5 h-3.5', group.color)} />
                            </div>
                            <span className={cn(
                              'text-xs font-bold uppercase tracking-wider',
                              group.color
                            )}>
                              {group.label}
                            </span>
                            <span className="text-xs font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                              {group.results.length}
                            </span>
                          </div>

                          {/* Group results */}
                          <div className="space-y-1 px-2">
                            {group.results.map((result, idx) => {
                              const currentGlobalIndex = globalIndex++;
                              const staggerDelay = idx * 0.04;

                              return (
                                <div
                                  key={result.id}
                                  data-result-index={currentGlobalIndex}
                                >
                                  <SearchResultItem
                                    result={result}
                                    isSelected={currentGlobalIndex === selectedIndex}
                                    animationDelay={staggerDelay}
                                    onSelect={() => {
                                      if (result.actions[0]) {
                                        executeQuickAction(result.actions[0].action);
                                      }
                                    }}
                                    onActionClick={(action) => {
                                      executeQuickAction(action.action);
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer - Premium keyboard hints */}
        <div className={cn(
          'flex items-center justify-between px-5 py-3.5',
          'border-t border-stone-200/60',
          'bg-gradient-to-r from-stone-50 to-[#faf9f7]'
        )}>
          <div className="flex items-center gap-4">
            <KeyboardHint icon={<ArrowUp className="w-3 h-3" />} iconAlt={<ArrowDown className="w-3 h-3" />} label="Navigate" />
            <KeyboardHint icon={<CornerDownLeft className="w-3 h-3" />} label="Select" />
            <div className="hidden sm:flex items-center gap-1.5 text-stone-400">
              <kbd className="px-2 py-1 text-[10px] font-semibold bg-white rounded-md border border-stone-200 shadow-sm">
                ⌘
              </kbd>
              <kbd className="px-2 py-1 text-[10px] font-semibold bg-white rounded-md border border-stone-200 shadow-sm">
                K
              </kbd>
              <span className="text-[11px] font-medium ml-0.5">Open</span>
            </div>
          </div>

          {totalCount > 0 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-semibold text-stone-500"
            >
              {totalCount} result{totalCount !== 1 ? 's' : ''}
            </motion.span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Keyboard hint component
function KeyboardHint({
  icon,
  iconAlt,
  label
}: {
  icon: React.ReactNode;
  iconAlt?: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-stone-400">
      <div className="flex items-center gap-0.5">
        <span className="flex items-center justify-center w-6 h-6 bg-white rounded-md border border-stone-200 shadow-sm">
          {icon}
        </span>
        {iconAlt && (
          <span className="flex items-center justify-center w-6 h-6 bg-white rounded-md border border-stone-200 shadow-sm">
            {iconAlt}
          </span>
        )}
      </div>
      <span className="text-[11px] font-medium hidden sm:inline">{label}</span>
    </div>
  );
}

export default GlobalSearchModal;
