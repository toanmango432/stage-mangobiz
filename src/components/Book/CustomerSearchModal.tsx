/**
 * Customer Search Modal
 * Search for existing customers or create new ones
 */

import { memo, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Search, X, Plus, Phone, User } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  lastVisit?: Date;
  totalVisits: number;
}

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onCreateCustomer: (name: string, phone: string) => void;
}

/**
 * Format phone number: (123) 456-7890
 */
function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  
  if (!match) return value;
  
  const [, area, prefix, line] = match;
  
  if (line) {
    return `(${area}) ${prefix}-${line}`;
  } else if (prefix) {
    return `(${area}) ${prefix}`;
  } else if (area) {
    return `(${area}`;
  }
  
  return '';
}

export const CustomerSearchModal = memo(function CustomerSearchModal({
  isOpen,
  onClose,
  onSelectCustomer,
  onCreateCustomer,
}: CustomerSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Mock search function - replace with real API call
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock data - replace with real API
      const mockResults: Customer[] = [
        {
          id: '1',
          name: 'Emily Chen',
          phone: '(555) 123-4567',
          email: 'emily@example.com',
          lastVisit: new Date('2024-10-20'),
          totalVisits: 12,
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          phone: '(555) 234-5678',
          email: 'sarah@example.com',
          lastVisit: new Date('2024-10-15'),
          totalVisits: 8,
        },
      ].filter(c => 
        c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.phone.includes(debouncedSearch)
      );
      
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 300);
  }, [debouncedSearch]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setIsCreating(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setSearchResults([]);
    }
  }, [isOpen]);

  const handlePhoneInput = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setNewCustomerPhone(formatted);
  };

  const handleCreateCustomer = () => {
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      return;
    }
    
    onCreateCustomer(newCustomerName.trim(), newCustomerPhone.trim());
    onClose();
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'bg-white rounded-xl shadow-2xl',
            'w-full max-w-2xl max-h-[80vh]',
            'flex flex-col',
            'animate-in fade-in zoom-in-95 duration-200'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isCreating ? 'New Customer' : 'Find Customer'}
                </h2>
                <p className="text-sm text-gray-500">
                  {isCreating ? 'Add a new customer' : 'Search by name or phone'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!isCreating ? (
              <>
                {/* Search Input */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or phone..."
                    className={cn(
                      'w-full pl-10 pr-4 py-3',
                      'border border-gray-300 rounded-lg',
                      'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                      'text-base'
                    )}
                    autoFocus
                  />
                </div>

                {/* Search Results */}
                {isSearching ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="mt-4 text-sm text-gray-500">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className={cn(
                          'w-full p-4 rounded-lg border border-gray-200',
                          'hover:border-orange-500 hover:bg-orange-50',
                          'transition-all duration-200',
                          'text-left'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <p className="text-sm text-gray-600">{customer.phone}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {customer.totalVisits} visits
                            </p>
                            {customer.lastVisit && (
                              <p className="text-xs text-gray-500 mt-1">
                                Last: {customer.lastVisit.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : debouncedSearch.length >= 2 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium mb-2">No customers found</p>
                    <p className="text-sm text-gray-500 mb-6">
                      Try a different search or create a new customer
                    </p>
                    <button
                      onClick={() => setIsCreating(true)}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-2',
                        'bg-gradient-to-r from-orange-500 to-pink-500',
                        'text-white font-medium rounded-lg',
                        'hover:shadow-lg transition-all duration-200'
                      )}
                    >
                      <Plus className="w-4 h-4" />
                      Create New Customer
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      Start typing to search for customers
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Create New Customer Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Enter full name"
                      className={cn(
                        'w-full px-4 py-3',
                        'border border-gray-300 rounded-lg',
                        'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                      )}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={newCustomerPhone}
                      onChange={(e) => handlePhoneInput(e.target.value)}
                      placeholder="(555) 123-4567"
                      className={cn(
                        'w-full px-4 py-3',
                        'border border-gray-300 rounded-lg',
                        'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                      )}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            {!isCreating ? (
              <>
                <button
                  onClick={() => setIsCreating(true)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2',
                    'text-orange-600 font-medium',
                    'hover:bg-orange-50 rounded-lg',
                    'transition-colors duration-200'
                  )}
                >
                  <Plus className="w-4 h-4" />
                  New Customer
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back to Search
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCustomer}
                    disabled={!newCustomerName.trim() || !newCustomerPhone.trim()}
                    className={cn(
                      'px-6 py-2 font-medium rounded-lg',
                      'bg-gradient-to-r from-orange-500 to-pink-500',
                      'text-white',
                      'hover:shadow-lg transition-all duration-200',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    Create Customer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
