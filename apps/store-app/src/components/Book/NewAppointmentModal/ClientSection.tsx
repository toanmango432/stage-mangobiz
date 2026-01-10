/**
 * ClientSection - Client selection area with search, recent clients, and add new form
 */

import { Search, Plus, User, X, Check, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatPhoneNumber } from '../../../utils/phoneUtils';
import {
  isValidEmail,
  getEmailError,
  isValidPhoneNumber,
  getPhoneError,
  getNameError,
  formatNameInput,
} from '../../../utils/validation';
import type { Client, ValidationErrors } from './types';

interface ClientSectionProps {
  clientSearch: string;
  onClientSearchChange: (search: string) => void;
  clients: Client[];
  recentClients: Client[];
  selectedClients: Client[];
  searching: boolean;
  showAddNewForm: boolean;
  onShowAddNewForm: (show: boolean) => void;
  onSelectClient: (client: Client) => void;
  onSelectWalkIn: () => void;
  isAddingAnotherClient: boolean;
  onCancelAddAnother: () => void;
  newClientFirstName: string;
  onNewClientFirstNameChange: (name: string) => void;
  newClientLastName: string;
  onNewClientLastNameChange: (name: string) => void;
  newClientPhone: string;
  onNewClientPhoneChange: (phone: string) => void;
  newClientEmail: string;
  onNewClientEmailChange: (email: string) => void;
  validationErrors: ValidationErrors;
  onValidationErrorsChange: (errors: ValidationErrors) => void;
  onAddNewClient: () => void;
  isAddingClient: boolean;
  bookingMode: 'individual' | 'group';
  onAddNamedGuest?: (client: Client) => void;
}

export function ClientSection({
  clientSearch,
  onClientSearchChange,
  clients,
  recentClients,
  selectedClients,
  searching,
  showAddNewForm,
  onShowAddNewForm,
  onSelectClient,
  onSelectWalkIn,
  isAddingAnotherClient,
  onCancelAddAnother,
  newClientFirstName,
  onNewClientFirstNameChange,
  newClientLastName,
  onNewClientLastNameChange,
  newClientPhone,
  onNewClientPhoneChange,
  newClientEmail,
  onNewClientEmailChange,
  validationErrors,
  onValidationErrorsChange,
  onAddNewClient,
  isAddingClient,
  bookingMode,
  onAddNamedGuest,
}: ClientSectionProps) {
  const handleSelectClientOrGuest = (client: Client) => {
    if (bookingMode === 'group' && onAddNamedGuest) {
      onAddNamedGuest(client);
    } else {
      onSelectClient(client);
    }
  };

  return (
    <>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search clients..."
          value={clientSearch}
          onChange={(e) => onClientSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
        />
      </div>

      {/* Full-Height Dropdown */}
      {(selectedClients.length === 0 || isAddingAnotherClient) && !showAddNewForm && (
        <div className="absolute top-[140px] left-0 right-0 bottom-0 bg-white border-r border-gray-100 z-40 flex flex-col overflow-hidden shadow-lg">
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {/* Add New Client Button */}
            <button
              onClick={() => onShowAddNewForm(true)}
              className="w-full px-4 py-3 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Client
            </button>

            {/* Skip & Add as Walk-in */}
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
                      onClick={() => handleSelectClientOrGuest(client)}
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
                    onClick={() => handleSelectClientOrGuest(client)}
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

      {/* Add New Client Form */}
      {showAddNewForm && (
        <div className="absolute top-[140px] left-0 right-0 bottom-0 bg-white border-r border-gray-100 z-40 p-6 overflow-y-auto">
          <div className="bg-white border-2 border-brand-500 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">New Client</h3>
              <button
                onClick={() => {
                  onShowAddNewForm(false);
                  onNewClientFirstNameChange('');
                  onNewClientLastNameChange('');
                  onNewClientPhoneChange('');
                  onNewClientEmailChange('');
                  onValidationErrorsChange({});
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* First Name */}
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
                    onNewClientFirstNameChange(formatted);
                    onValidationErrorsChange({ ...validationErrors, firstName: undefined });
                  }}
                  onBlur={() => {
                    const error = getNameError(newClientFirstName, 'First name');
                    if (error) onValidationErrorsChange({ ...validationErrors, firstName: error });
                  }}
                  placeholder="John"
                  className={cn(
                    "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2",
                    validationErrors.firstName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-brand-500 focus:ring-brand-500/20"
                  )}
                  autoFocus
                />
                {validationErrors.firstName && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
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
                    onNewClientLastNameChange(formatted);
                    onValidationErrorsChange({ ...validationErrors, lastName: undefined });
                  }}
                  onBlur={() => {
                    const error = getNameError(newClientLastName, 'Last name');
                    if (error) onValidationErrorsChange({ ...validationErrors, lastName: error });
                  }}
                  placeholder="Doe"
                  className={cn(
                    "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2",
                    validationErrors.lastName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-brand-500 focus:ring-brand-500/20"
                  )}
                />
                {validationErrors.lastName && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors.lastName}</p>
                )}
              </div>

              {/* Phone */}
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
                    onNewClientPhoneChange(formatted);
                    onValidationErrorsChange({ ...validationErrors, phone: undefined });
                  }}
                  onBlur={() => {
                    const error = getPhoneError(newClientPhone);
                    if (error) onValidationErrorsChange({ ...validationErrors, phone: error });
                  }}
                  placeholder="(555) 123-4567"
                  className={cn(
                    "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2",
                    validationErrors.phone
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-brand-500 focus:ring-brand-500/20"
                  )}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors.phone}</p>
                )}
                {!validationErrors.phone && newClientPhone && isValidPhoneNumber(newClientPhone) && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Valid phone number
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="client-email"
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => {
                    onNewClientEmailChange(e.target.value.toLowerCase());
                    onValidationErrorsChange({ ...validationErrors, email: undefined });
                  }}
                  onBlur={() => {
                    if (newClientEmail.trim()) {
                      const error = getEmailError(newClientEmail);
                      if (error) onValidationErrorsChange({ ...validationErrors, email: error });
                    }
                  }}
                  placeholder="email@example.com"
                  className={cn(
                    "w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2",
                    validationErrors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-brand-500 focus:ring-brand-500/20"
                  )}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>
                )}
                {!validationErrors.email && newClientEmail && isValidEmail(newClientEmail) && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Valid email
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={onAddNewClient}
                disabled={
                  !newClientFirstName.trim() ||
                  !newClientLastName.trim() ||
                  !newClientPhone.trim() ||
                  Object.values(validationErrors).some(v => v !== undefined) ||
                  isAddingClient
                }
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAddingClient ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save & Select
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
