/**
 * Quick Book Bar
 * Lightning-fast floating search for instant bookings
 * Keyboard accessible with CMD+K
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, Phone, Sparkles, User, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDebounce } from '../../hooks/useDebounce';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  lastVisit?: Date;
  totalVisits: number;
  preferredServices?: string[];
  preferredStaff?: string;
  averageSpend?: number;
}

interface QuickBookBarProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSelect: (client: Client) => void;
  onWalkIn: () => void;
  recentClients?: Client[];
  onSearch: (query: string) => Promise<Client[]>;
}

export function QuickBookBar({
  isOpen,
  onClose,
  onClientSelect,
  onWalkIn,
  recentClients = [],
  onSearch,
}: QuickBookBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcut: CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // Parent component should handle opening
        } else {
          inputRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const searchResults = await onSearch(debouncedQuery);
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery, onSearch]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = results.length + recentClients.length + 1; // +1 for walk-in

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex === 0 && !query) {
          onWalkIn();
        } else if (results.length > 0) {
          onClientSelect(results[Math.min(selectedIndex, results.length - 1)]);
        } else if (recentClients.length > 0 && !query) {
          onClientSelect(recentClients[selectedIndex - 1]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [selectedIndex, results, recentClients, query, onClientSelect, onWalkIn, onClose]);

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const getClientName = (client: Client): string => {
    return `${client.firstName} ${client.lastName}`;
  };

  const handleClientClick = (client: Client) => {
    onClientSelect(client);
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Search Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-top duration-200">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search client by name or phone..."
                className="flex-1 text-lg outline-none placeholder:text-gray-400"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded font-mono">
                ESC
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {/* Loading State */}
              {isSearching && (
                <div className="px-6 py-8 text-center">
                  <div className="inline-block w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <p className="mt-3 text-sm text-gray-500">Searching...</p>
                </div>
              )}

              {/* Search Results */}
              {!isSearching && query && results.length > 0 && (
                <div className="py-2">
                  <div className="px-6 py-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Search Results
                    </p>
                  </div>
                  {results.map((client, index) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientClick(client)}
                      className={cn(
                        'w-full text-left px-6 py-3 transition-colors',
                        'hover:bg-brand-50',
                        selectedIndex === index && 'bg-brand-50'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">
                              {getClientName(client)}
                            </p>
                            {client.totalVisits > 10 && (
                              <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded-full">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              <span>{formatPhoneNumber(client.phone)}</span>
                            </div>
                            {client.lastVisit && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(client.lastVisit).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {client.averageSpend && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ${client.averageSpend.toFixed(0)} avg
                            </p>
                            <p className="text-xs text-gray-500">
                              {client.totalVisits} visits
                            </p>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isSearching && query && results.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <Search className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    No clients found
                  </p>
                  <p className="text-sm text-gray-500">
                    Try a different search or create a new client
                  </p>
                </div>
              )}

              {/* Walk-in Option */}
              {!query && (
                <div className="py-2">
                  <div className="px-6 py-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Quick Actions
                    </p>
                  </div>
                  <button
                    onClick={onWalkIn}
                    className={cn(
                      'w-full text-left px-6 py-3 transition-colors',
                      'hover:bg-orange-50',
                      selectedIndex === 0 && 'bg-orange-50'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Walk-in Customer</p>
                        <p className="text-sm text-gray-600">
                          Quick booking without client search
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded font-mono">
                        ↵
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Recent Clients */}
              {!query && recentClients.length > 0 && (
                <div className="py-2 border-t border-gray-200">
                  <div className="px-6 py-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Recent Clients
                    </p>
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                  </div>
                  {recentClients.map((client, index) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientClick(client)}
                      className={cn(
                        'w-full text-left px-6 py-3 transition-colors',
                        'hover:bg-brand-50',
                        selectedIndex === index + 1 && 'bg-brand-50'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">
                            {client.firstName[0]}{client.lastName[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            {getClientName(client)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatPhoneNumber(client.phone)}
                          </p>
                        </div>
                        {client.preferredServices && client.preferredServices.length > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {client.preferredServices[0]}
                            </p>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Hint */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">↑↓</span>{' '}
                    Navigate
                  </span>
                  <span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">↵</span>{' '}
                    Select
                  </span>
                  <span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">ESC</span>{' '}
                    Close
                  </span>
                </div>
                <span className="text-gray-400">
                  <span className="font-mono">⌘K</span> to open
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
