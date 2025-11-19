/**
 * Quick Client Modal - World-class client search and add
 * Features:
 * - Instant search with inline results
 * - Quick add without leaving search view
 * - Smart phone number detection and formatting
 * - Keyboard shortcuts for power users
 * - Auto-select after creation
 */

import { memo, useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { Search, X, Plus, Phone, User, CheckCircle2, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { clientsDB } from '../../db/database';
import type { Client } from '../../types';
import toast from 'react-hot-toast';
import {
  getNameError,
  getPhoneError,
  getEmailError,
  formatNameInput,
  capitalizeName,
} from '../../utils/validation';
import { formatPhoneNumber } from '../../utils/phoneUtils';

interface QuickClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (client: Client) => void;
  salonId: string;
}


/**
 * Detect if input looks like a phone number
 */
function looksLikePhone(value: string): boolean {
  const cleaned = value.replace(/\D/g, '');
  return cleaned.length >= 3 && cleaned.length <= 10;
}

export const QuickClientModal = memo(function QuickClientModal({
  isOpen,
  onClose,
  onSelectClient,
  salonId,
}: QuickClientModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Quick add form
  const [quickAddFirstName, setQuickAddFirstName] = useState('');
  const [quickAddLastName, setQuickAddLastName] = useState('');
  const [quickAddPhone, setQuickAddPhone] = useState('');
  const [quickAddEmail, setQuickAddEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  }>({});

  const searchInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search clients
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([]);
      setShowQuickAdd(false);
      return;
    }

    setIsSearching(true);

    clientsDB.search(salonId, debouncedSearch)
      .then(results => {
        setSearchResults(results);
        setIsSearching(false);
        // Show quick add if no exact matches
        setShowQuickAdd(results.length === 0 || results.length < 3);

        // Smart pre-fill: if searching by phone, pre-fill phone field
        if (looksLikePhone(debouncedSearch)) {
          setQuickAddPhone(formatPhoneNumber(debouncedSearch));
        }
      })
      .catch(error => {
        console.error('Error searching clients:', error);
        setIsSearching(false);
      });
  }, [debouncedSearch, salonId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setShowQuickAdd(false);
      setQuickAddFirstName('');
      setQuickAddLastName('');
      setQuickAddPhone('');
      setQuickAddEmail('');
      setValidationErrors({});
      setJustAdded(false);
    }
  }, [isOpen]);

  // Clear "just added" indicator
  useEffect(() => {
    if (justAdded) {
      const timer = setTimeout(() => setJustAdded(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [justAdded]);

  const handlePhoneInput = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setQuickAddPhone(formatted);
  };

  // Validate all fields before submission
  const validateForm = () => {
    const errors: typeof validationErrors = {};

    // First name validation
    const firstNameError = getNameError(quickAddFirstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;

    // Last name validation
    const lastNameError = getNameError(quickAddLastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;

    // Phone validation
    const phoneError = getPhoneError(quickAddPhone);
    if (phoneError) errors.phone = phoneError;

    // Email validation (optional but must be valid if provided)
    if (quickAddEmail.trim()) {
      const emailError = getEmailError(quickAddEmail);
      if (emailError) errors.email = emailError;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleQuickAdd = async () => {
    // Validate form
    if (!validateForm()) {
      // Focus on first field with error
      if (validationErrors.firstName) {
        document.getElementById('quick-client-first-name')?.focus();
      } else if (validationErrors.lastName) {
        document.getElementById('quick-client-last-name')?.focus();
      } else if (validationErrors.phone) {
        document.getElementById('quick-client-phone')?.focus();
      } else if (validationErrors.email) {
        document.getElementById('quick-client-email')?.focus();
      }
      return;
    }

    setIsAdding(true);

    try {
      const fullName = `${capitalizeName(quickAddFirstName.trim())} ${capitalizeName(quickAddLastName.trim())}`;
      const newClient = await clientsDB.create({
        salonId,
        name: fullName,
        phone: quickAddPhone.trim(),
        email: quickAddEmail.trim() || undefined,
      });

      setJustAdded(true);

      // Auto-select the newly created client after a brief moment
      setTimeout(() => {
        onSelectClient(newClient);
        onClose();
      }, 800);
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client. Please try again.');
      setIsAdding(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    onSelectClient(client);
    onClose();
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (showQuickAdd && quickAddFirstName.trim() && quickAddLastName.trim() && quickAddPhone.trim()) {
        handleQuickAdd();
      }
    }
  };

  if (!isOpen) return null;

  const canQuickAdd = quickAddFirstName.trim() && quickAddLastName.trim() && quickAddPhone.trim();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-all"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        onKeyDown={handleKeyDown}
      >
        <div
          className={cn(
            'bg-white rounded-2xl shadow-2xl',
            'w-full max-w-2xl max-h-[85vh]',
            'flex flex-col',
            'animate-slide-in-up'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md shadow-teal-500/25">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Find Client
                </h2>
                <p className="text-sm text-gray-500">
                  Search or add new in seconds
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn-icon"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Search Input */}
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or phone..."
                className={cn(
                  'w-full pl-12 pr-4 py-3.5 text-base',
                  'border-2 border-gray-200 rounded-xl',
                  'focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10',
                  'transition-all'
                )}
              />
            </div>

            {/* Search Results */}
            {isSearching ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-sm text-gray-500">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2 mb-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1 mb-3">
                  Found {searchResults.length} {searchResults.length === 1 ? 'client' : 'clients'}
                </p>
                {searchResults.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 border-gray-200',
                      'hover:border-teal-500 hover:bg-teal-50/50 hover:shadow-md',
                      'transition-all duration-200',
                      'text-left group'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                            {client.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <p className="text-sm text-gray-600">{client.phone}</p>
                            </div>
                            {client.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <p className="text-sm text-gray-600">{client.email}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {client.totalVisits || 0} visits
                        </p>
                        {client.lastVisit && (
                          <p className="text-xs text-gray-500 mt-1">
                            Last: {new Date(client.lastVisit).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : debouncedSearch.length >= 2 ? (
              <div className="mb-5">
                <div className="text-center py-8">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Search className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium mb-1">No clients found</p>
                  <p className="text-sm text-gray-500">
                    Add "{searchQuery}" as a new client below
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
                  <Search className="w-8 h-8 text-teal-600" />
                </div>
                <p className="text-gray-900 font-medium mb-1">Start typing to search</p>
                <p className="text-sm text-gray-500">
                  Search by name or phone number
                </p>
              </div>
            )}

            {/* Quick Add Form - Show when searching or no results */}
            {showQuickAdd && debouncedSearch.length >= 2 && (
              <div className={cn(
                'border-2 border-dashed rounded-xl p-5 transition-all',
                justAdded
                  ? 'border-green-500 bg-green-50'
                  : 'border-teal-300 bg-teal-50/30'
              )}>
                {justAdded ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-green-900 font-semibold mb-1">Client Added!</p>
                    <p className="text-sm text-green-700">Selecting client...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-teal-600" />
                      <h3 className="font-semibold text-gray-900">Quick Add New Client</h3>
                    </div>

                    <div className="space-y-3">
                      {/* First and Last Name Fields in a row */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* First Name */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5 px-1">
                            First Name *
                          </label>
                          <input
                            id="quick-client-first-name"
                            ref={nameInputRef}
                            type="text"
                            value={quickAddFirstName}
                            onChange={(e) => {
                              const formatted = formatNameInput(e.target.value);
                              setQuickAddFirstName(formatted);
                              setValidationErrors({ ...validationErrors, firstName: undefined });
                            }}
                            onBlur={() => {
                              const error = getNameError(quickAddFirstName, 'First name');
                              if (error) setValidationErrors({ ...validationErrors, firstName: error });
                            }}
                            placeholder="John"
                            className={cn(
                              'w-full px-3.5 py-2.5 text-sm',
                              'border-2 rounded-lg bg-white',
                              'focus:outline-none focus:ring-4 transition-all',
                              validationErrors.firstName
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                                : quickAddFirstName.length >= 2 && !validationErrors.firstName
                                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                                : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500/10'
                            )}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && canQuickAdd) {
                                handleQuickAdd();
                              }
                            }}
                          />
                          {validationErrors.firstName && (
                            <p className="mt-1 text-xs text-red-500 px-1">{validationErrors.firstName}</p>
                          )}
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5 px-1">
                            Last Name *
                          </label>
                          <input
                            id="quick-client-last-name"
                            type="text"
                            value={quickAddLastName}
                            onChange={(e) => {
                              const formatted = formatNameInput(e.target.value);
                              setQuickAddLastName(formatted);
                              setValidationErrors({ ...validationErrors, lastName: undefined });
                            }}
                            onBlur={() => {
                              const error = getNameError(quickAddLastName, 'Last name');
                              if (error) setValidationErrors({ ...validationErrors, lastName: error });
                            }}
                            placeholder="Smith"
                            className={cn(
                              'w-full px-3.5 py-2.5 text-sm',
                              'border-2 rounded-lg bg-white',
                              'focus:outline-none focus:ring-4 transition-all',
                              validationErrors.lastName
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                                : quickAddLastName.length >= 2 && !validationErrors.lastName
                                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                                : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500/10'
                            )}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && canQuickAdd) {
                                handleQuickAdd();
                              }
                            }}
                          />
                          {validationErrors.lastName && (
                            <p className="mt-1 text-xs text-red-500 px-1">{validationErrors.lastName}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 px-1">
                          Phone Number *
                        </label>
                        <input
                          id="quick-client-phone"
                          type="tel"
                          value={quickAddPhone}
                          onChange={(e) => {
                            handlePhoneInput(e.target.value);
                            setValidationErrors({ ...validationErrors, phone: undefined });
                          }}
                          onBlur={() => {
                            const error = getPhoneError(quickAddPhone);
                            if (error) setValidationErrors({ ...validationErrors, phone: error });
                          }}
                          placeholder="(555) 123-4567"
                          className={cn(
                            'w-full px-3.5 py-2.5 text-sm',
                            'border-2 rounded-lg bg-white',
                            'focus:outline-none focus:ring-4 transition-all',
                            validationErrors.phone
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                              : quickAddPhone.replace(/\D/g, '').length === 10 && !validationErrors.phone
                              ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                              : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500/10'
                          )}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && canQuickAdd) {
                              handleQuickAdd();
                            }
                          }}
                        />
                        {validationErrors.phone && (
                          <p className="mt-1 text-xs text-red-500 px-1">{validationErrors.phone}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 px-1">
                          Email (optional)
                        </label>
                        <input
                          id="quick-client-email"
                          type="email"
                          value={quickAddEmail}
                          onChange={(e) => {
                            setQuickAddEmail(e.target.value.toLowerCase());
                            setValidationErrors({ ...validationErrors, email: undefined });
                          }}
                          onBlur={() => {
                            if (quickAddEmail.trim()) {
                              const error = getEmailError(quickAddEmail);
                              if (error) setValidationErrors({ ...validationErrors, email: error });
                            }
                          }}
                          placeholder="email@example.com"
                          className={cn(
                            'w-full px-3.5 py-2.5 text-sm',
                            'border-2 rounded-lg bg-white',
                            'focus:outline-none focus:ring-4 transition-all',
                            validationErrors.email
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                              : quickAddEmail.trim() && !validationErrors.email && quickAddEmail.includes('@')
                              ? 'border-green-500 focus:border-green-500 focus:ring-green-500/10'
                              : 'border-gray-300 focus:border-teal-500 focus:ring-teal-500/10'
                          )}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && canQuickAdd) {
                              handleQuickAdd();
                            }
                          }}
                        />
                        {validationErrors.email && (
                          <p className="mt-1 text-xs text-red-500 px-1">{validationErrors.email}</p>
                        )}
                      </div>

                      <button
                        onClick={handleQuickAdd}
                        disabled={!canQuickAdd || isAdding}
                        className={cn(
                          'w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-all mt-2',
                          canQuickAdd && !isAdding
                            ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 shadow-md shadow-teal-500/25 hover:shadow-lg hover:shadow-teal-500/35 active:scale-[0.98]'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        )}
                      >
                        {isAdding ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Adding...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            Add Client
                            <span className="text-xs opacity-75">(⌘↵)</span>
                          </span>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer - Keyboard Shortcuts Hint */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Esc</kbd> to close
              {showQuickAdd && canQuickAdd && (
                <>
                  {' • '}
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">⌘↵</kbd> to quick add
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
});
