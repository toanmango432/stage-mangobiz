/**
 * Customer Search Modal - Premium Edition
 * Search for existing customers or create new ones
 * With glass morphism and premium design
 */

import { memo, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Search, X, Plus, Phone, User } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { PremiumInput, PremiumButton, PremiumAvatar } from '../premium';

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
      {/* Backdrop - Premium blur */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-md z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal - Premium design */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div
          className={cn(
            'bg-white/95 backdrop-blur-xl rounded-2xl shadow-premium-2xl',
            'w-full max-w-2xl max-h-[85vh]',
            'flex flex-col',
            'border border-gray-200/50',
            'animate-scale-in'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Premium styling */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-premium-md">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {isCreating ? 'New Customer' : 'Find Customer'}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {isCreating ? 'Add a new customer' : 'Search by name or phone'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-lg',
                'hover:bg-gray-100',
                'transition-colors duration-200'
              )}
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!isCreating ? (
              <>
                {/* Search Input - Premium */}
                <div className="mb-6">
                  <PremiumInput
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or phone..."
                    icon={<Search className="w-5 h-5" />}
                    clearable
                    onClear={() => setSearchQuery('')}
                    size="lg"
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
                  <div className="space-y-3">
                    {searchResults.map((customer, index) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className={cn(
                          'w-full p-4 rounded-xl border border-gray-200',
                          'hover:border-brand-300 hover:bg-brand-50',
                          'hover:shadow-premium-md hover:-translate-y-0.5',
                          'transition-all duration-200',
                          'text-left'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <PremiumAvatar
                              name={customer.name}
                              size="lg"
                              colorIndex={index}
                              gradient
                              showStatus
                              status="online"
                            />
                            <div>
                              <p className="font-semibold text-gray-900">{customer.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                <p className="text-sm text-gray-600">{customer.phone}</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-brand-600">
                              {customer.totalVisits} visits
                            </p>
                            {customer.lastVisit && (
                              <p className="text-xs text-gray-500 mt-1">
                                {customer.lastVisit.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : debouncedSearch.length >= 2 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-semibold mb-2">No customers found</p>
                    <p className="text-sm text-gray-600 mb-6">
                      Try a different search or create a new customer
                    </p>
                    <PremiumButton
                      variant="primary"
                      size="lg"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => setIsCreating(true)}
                    >
                      Create New Customer
                    </PremiumButton>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-sm font-medium">
                      Start typing to search for customers
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Create New Customer Form - Premium */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <PremiumInput
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Enter full name"
                      icon={<User className="w-4 h-4" />}
                      size="lg"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <PremiumInput
                      type="tel"
                      value={newCustomerPhone}
                      onChange={(e) => handlePhoneInput(e.target.value)}
                      placeholder="(555) 123-4567"
                      icon={<Phone className="w-4 h-4" />}
                      size="lg"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer - Premium buttons */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200/50 bg-white/50">
            {!isCreating ? (
              <>
                <PremiumButton
                  variant="ghost"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsCreating(true)}
                  className="text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                >
                  New Customer
                </PremiumButton>
                <PremiumButton
                  variant="ghost"
                  size="md"
                  onClick={onClose}
                >
                  Cancel
                </PremiumButton>
              </>
            ) : (
              <>
                <PremiumButton
                  variant="ghost"
                  size="md"
                  onClick={() => setIsCreating(false)}
                >
                  Back to Search
                </PremiumButton>
                <div className="flex gap-3">
                  <PremiumButton
                    variant="ghost"
                    size="md"
                    onClick={onClose}
                  >
                    Cancel
                  </PremiumButton>
                  <PremiumButton
                    variant="primary"
                    size="md"
                    onClick={handleCreateCustomer}
                    disabled={!newCustomerName.trim() || !newCustomerPhone.trim()}
                  >
                    Create Customer
                  </PremiumButton>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
