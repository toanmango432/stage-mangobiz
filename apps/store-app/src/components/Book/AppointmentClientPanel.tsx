import { RefObject } from 'react';
import { Search, User, Plus, X, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatNameInput } from '../../utils/validation';
import { formatPhoneNumber } from '../../utils/phoneUtils';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface BookingGuest {
  id: string;
  name: string;
  isNamed: boolean;
  clientId?: string;
  phone?: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
    serviceCategory: string;
    duration: number;
    price: number;
    staffId: string;
    staffName: string;
  }>;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

interface AppointmentClientPanelProps {
  bookingMode: 'individual' | 'group';
  onSwitchToIndividual: () => void;
  onSwitchToGroup: () => void;
  partySize: number;
  selectedClients: Client[];
  isAddingAnotherClient: boolean;
  setIsAddingAnotherClient: (value: boolean) => void;
  clientSearch: string;
  setClientSearch: (value: string) => void;
  clientSearchRef: RefObject<HTMLInputElement | null>;
  showAddNewForm: boolean;
  setShowAddNewForm: (value: boolean) => void;
  recentClients: Client[];
  clients: Client[];
  searching: boolean;
  bookingGuests: BookingGuest[];
  activeGuestId: string | null;
  groupStep: 'guests' | 'services';
  onSetActiveGuestId: (id: string | null) => void;
  onAddNamedGuest: (client: Client) => void;
  onAddUnnamedGuest: () => void;
  onRemoveGuest: (guestId: string) => void;
  onProceedToServices: () => void;
  onBackToGuests: () => void;
  onSelectClient: (client: Client) => void;
  onSelectWalkIn: () => void;
  newClientFirstName: string;
  newClientLastName: string;
  newClientPhone: string;
  newClientEmail: string;
  validationErrors: ValidationErrors;
  setValidationErrors: (errors: ValidationErrors) => void;
  setNewClientFirstName: (value: string) => void;
  setNewClientLastName: (value: string) => void;
  setNewClientPhone: (value: string) => void;
  setNewClientEmail: (value: string) => void;
  isAddingClient: boolean;
  onAddNewClient: () => void;
}

export function AppointmentClientPanel({
  bookingMode,
  onSwitchToIndividual,
  onSwitchToGroup,
  partySize,
  selectedClients,
  isAddingAnotherClient,
  setIsAddingAnotherClient,
  clientSearch,
  setClientSearch,
  clientSearchRef,
  showAddNewForm,
  setShowAddNewForm,
  recentClients,
  clients,
  searching,
  bookingGuests,
  activeGuestId,
  groupStep,
  onSetActiveGuestId,
  onAddNamedGuest,
  onAddUnnamedGuest,
  onRemoveGuest,
  onProceedToServices,
  onBackToGuests,
  onSelectClient,
  onSelectWalkIn,
  newClientFirstName,
  newClientLastName,
  newClientPhone,
  newClientEmail,
  validationErrors,
  setValidationErrors,
  setNewClientFirstName,
  setNewClientLastName,
  setNewClientPhone,
  setNewClientEmail,
  isAddingClient,
  onAddNewClient,
}: AppointmentClientPanelProps) {
  return (
    <div className="w-full flex flex-col relative">
      {/* Booking Mode Selector - Minimal */}
      {selectedClients.length === 0 && !isAddingAnotherClient && (
        <div className="px-6 pt-4 pb-2">
          <div className="inline-flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
            <button
              onClick={onSwitchToIndividual}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                bookingMode === 'individual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Individual
            </button>
            <button
              onClick={onSwitchToGroup}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                bookingMode === 'group'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Group
            </button>
          </div>
        </div>
      )}

      {/* Client Search Input - Always visible at top */}
      <div className="relative z-30 p-6 border-b border-gray-100 bg-gradient-to-br from-brand-50/30 via-white to-white">
        {selectedClients.length === 0 || isAddingAnotherClient ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 z-10" />
              <input
                ref={clientSearchRef}
                type="text"
                placeholder="Search or add client..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                onFocus={() => setShowAddNewForm(false)}
                className="w-full pl-11 pr-4 py-2.5 text-sm bg-white border-2 border-brand-200 rounded-lg focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-gray-400 shadow-sm shadow-brand-500/5"
              />
            </div>
            {isAddingAnotherClient && selectedClients.length > 0 && (
              <button
                onClick={() => {
                  setIsAddingAnotherClient(false);
                  setClientSearch('');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Cancel adding client
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Individual Mode - Simple Client Display */}
            {bookingMode === 'individual' && selectedClients.length > 0 && (
              <div className="bg-white border-2 border-brand-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{selectedClients[0].name}</p>
                    <p className="text-xs text-gray-500">{selectedClients[0].phone}</p>
                  </div>
                  <button
                    onClick={() => setIsAddingAnotherClient(true)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {/* Group Mode - Show selected clients */}
            {bookingMode === 'group' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Group Booking</p>
                    <p className="text-xs text-gray-500">Party size: {partySize}</p>
                  </div>
                  <button
                    onClick={() => setIsAddingAnotherClient(true)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Add Member
                  </button>
                </div>
                <div className="space-y-2">
                  {bookingGuests.map(guest => (
                    <div
                      key={guest.id}
                      className={cn(
                        'px-3 py-2 border rounded-lg flex items-center justify-between',
                        activeGuestId === guest.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white'
                      )}
                      onClick={() => onSetActiveGuestId(guest.id)}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{guest.name}</p>
                        <p className="text-xs text-gray-500">
                          {guest.services.length} service{guest.services.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveGuest(guest.id);
                        }}
                        className="p-1 rounded hover:bg-red-50"
                        title="Remove guest"
                      >
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full-Height Dropdown - Expands entire left section */}
      {(selectedClients.length === 0 || isAddingAnotherClient) && !showAddNewForm && (
        <div className="absolute top-[140px] left-0 right-0 bottom-0 bg-white border-r border-gray-100 z-40 flex flex-col overflow-hidden shadow-lg">
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {/* Add New Client - TOP */}
            <button
              onClick={() => setShowAddNewForm(true)}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Client
            </button>

            {/* Skip & Add as Walk-in - only show if no clients yet */}
            {selectedClients.length === 0 && (
              <button
                onClick={onSelectWalkIn}
                className="w-full text-left px-4 py-3 bg-white hover:bg-gray-50 transition-colors border-2 border-gray-200 hover:border-brand-300 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Skip & Add as Walk-in</p>
                    <p className="text-xs text-gray-500">Continue without client details</p>
                  </div>
                </div>
              </button>
            )}

            {/* Search Results or Recent Clients */}
            {clientSearch.length >= 2 ? (
              searching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : clients.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">Search Results</p>
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => bookingMode === 'group' ? onAddNamedGuest(client) : onSelectClient(client)}
                      className="w-full text-left px-4 py-3 bg-white hover:bg-brand-50 transition-colors border border-gray-200 hover:border-brand-300 rounded-lg"
                    >
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.phone}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">No clients found</p>
                </div>
              )
            ) : recentClients.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1">Recent Clients</p>
                {recentClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => bookingMode === 'group' ? onAddNamedGuest(client) : onSelectClient(client)}
                    className="w-full text-left px-4 py-3 bg-white hover:bg-brand-50 transition-colors border border-gray-200 hover:border-brand-300 rounded-lg"
                  >
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.phone}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Add New Form - Full height overlay */}
      {showAddNewForm && (
        <div className="absolute top-[140px] left-0 right-0 bottom-0 bg-white border-r border-gray-100 z-40 p-6 overflow-y-auto">
          <div className="bg-white border-2 border-brand-500 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">New Client</h3>
              <button
                onClick={() => {
                  setShowAddNewForm(false);
                  setNewClientFirstName('');
                  setNewClientLastName('');
                  setNewClientPhone('');
                  setNewClientEmail('');
                  setValidationErrors({});
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* First Name Field */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="client-first-name"
                  type="text"
                  value={newClientFirstName}
                  onChange={(e) => {
                    const formatted = formatNameInput(e.target.value);
                    setNewClientFirstName(formatted);
                    setValidationErrors({ ...validationErrors, firstName: undefined });
                  }}
                  placeholder="John"
                  className={cn(
                    'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2',
                    validationErrors.firstName
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/20'
                  )}
                  autoFocus
                />
                {validationErrors.firstName && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors.firstName}</p>
                )}
              </div>

              {/* Last Name Field */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="client-last-name"
                  type="text"
                  value={newClientLastName}
                  onChange={(e) => {
                    const formatted = formatNameInput(e.target.value);
                    setNewClientLastName(formatted);
                    setValidationErrors({ ...validationErrors, lastName: undefined });
                  }}
                  placeholder="Doe"
                  className={cn(
                    'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2',
                    validationErrors.lastName
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/20'
                  )}
                />
                {validationErrors.lastName && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors.lastName}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="client-phone"
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setNewClientPhone(formatted);
                    setValidationErrors({ ...validationErrors, phone: undefined });
                  }}
                  placeholder="(555) 123-4567"
                  className={cn(
                    'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2',
                    validationErrors.phone
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/20'
                  )}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors.phone}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="client-email"
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => {
                    setNewClientEmail(e.target.value);
                    setValidationErrors({ ...validationErrors, email: undefined });
                  }}
                  placeholder="john@example.com"
                  className={cn(
                    'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2',
                    validationErrors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500/20'
                  )}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>
                )}
              </div>

              <button
                onClick={onAddNewClient}
                disabled={isAddingClient}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg hover:from-brand-600 hover:to-brand-700 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isAddingClient ? 'Adding...' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GROUP MODE: Guest list and controls when not in overlay */}
      {bookingMode === 'group' && selectedClients.length === 0 && !showAddNewForm && !isAddingAnotherClient && (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Guests</p>
              <p className="text-xs text-gray-500">{bookingGuests.length} added</p>
            </div>
            <button
              onClick={onAddUnnamedGuest}
              className="px-3 py-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 border border-brand-100 rounded-lg"
            >
              Add Guest
            </button>
          </div>

          <div className="space-y-2">
            {bookingGuests.map(guest => (
              <div
                key={guest.id}
                className={cn(
                  'rounded-lg border border-gray-200 bg-white shadow-sm',
                  activeGuestId === guest.id && 'border-brand-500 ring-1 ring-brand-500/20'
                )}
              >
                <button
                  onClick={() => onSetActiveGuestId(guest.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{guest.name}</p>
                    <p className="text-xs text-gray-500">
                      {guest.services.length} service{guest.services.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', activeGuestId === guest.id && 'rotate-180')} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToGuests}
              className={cn(
                'px-3 py-2 text-xs font-semibold rounded-lg border',
                groupStep === 'guests' ? 'border-brand-200 text-brand-700 bg-brand-50' : 'border-gray-200 text-gray-600'
              )}
            >
              Step 1: Guests
            </button>
            <button
              onClick={onProceedToServices}
              className={cn(
                'px-3 py-2 text-xs font-semibold rounded-lg border',
                groupStep === 'services' ? 'border-brand-200 text-brand-700 bg-brand-50' : 'border-gray-200 text-gray-600'
              )}
            >
              Step 2: Services
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
