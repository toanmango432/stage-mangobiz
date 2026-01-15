import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Clock, Tag, User, AlertCircle, Check, Search, UserPlus, Sparkles, Phone, ChevronDown, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTickets } from '@/hooks/useTicketsCompat';
import { MobileSheet, MobileSheetContent, MobileSheetFooter, MobileSheetButton } from '@/components/layout/MobileSheet';
import { useBreakpoint } from '@/hooks/useMobileModal';
import { haptics } from '@/utils/haptics';
import { useAppSelector } from '@/store/hooks';
import { selectClients } from '@/store/slices/clientsSlice/selectors';
import { selectStoreId } from '@/store/slices/authSlice';
import { useCatalog } from '@/hooks/useCatalog';
import type { Client } from '@/types';
import type { MenuServiceWithEmbeddedVariants } from '@/types/catalog';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (ticketData: any) => void;
}

// Selected service type for multi-service support
interface SelectedService {
  id: string;
  name: string;
  duration: number;
  price: number;
  categoryName?: string;
}

export function CreateTicketModal({
  isOpen,
  onClose,
  onSubmit
}: CreateTicketModalProps) {
  const { isMobile } = useBreakpoint();
  // Redux clients and store
  const clients = useAppSelector(selectClients);
  const storeId = useAppSelector(selectStoreId) || 'placeholder';

  // Services from catalog
  const { services: catalogServices, categories } = useCatalog({ storeId });

  // Form state
  const [clientName, setClientName] = useState('');
  const [clientType, setClientType] = useState('Regular');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [service, setService] = useState('');
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [duration, setDuration] = useState('30 min');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const formattedHours = hours % 12 || 12;
    const period = hours >= 12 ? 'PM' : 'AM';
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  });

  // Client search state
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Service search state
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const serviceInputRef = useRef<HTMLInputElement>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);

  // Validation state
  const [errors, setErrors] = useState<{
    clientName?: string;
    service?: string;
  }>({});

  // Filter clients based on search query (minimum 2 characters)
  const filteredClients = useMemo(() => {
    if (clientSearchQuery.length < 2) return [];
    const query = clientSearchQuery.toLowerCase();
    return clients.filter(client => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      const displayName = client.displayName?.toLowerCase() || '';
      const phone = client.phone?.toLowerCase() || '';
      return fullName.includes(query) || displayName.includes(query) || phone.includes(query);
    }).slice(0, 10); // Limit to 10 results
  }, [clients, clientSearchQuery]);

  // Check if client is first visit (no previous visits)
  const isFirstVisit = (client: Client): boolean => {
    return !client.visitSummary || client.visitSummary.totalVisits === 0;
  };

  // Handle client selection
  const handleSelectClient = (client: Client) => {
    const fullName = client.displayName || `${client.firstName} ${client.lastName}`.trim();
    setClientName(fullName);
    setSelectedClientId(client.id);
    setClientSearchQuery(fullName);
    setShowClientDropdown(false);

    // Set client type based on client properties
    if (client.isVip) {
      setClientType('VIP');
    } else if (isFirstVisit(client)) {
      setClientType('New');
    } else {
      setClientType('Regular');
    }

    // Clear validation error if present
    if (errors.clientName) {
      setErrors({ ...errors, clientName: undefined });
    }

    haptics.selection();
  };

  // Handle create new client option
  const handleCreateNewClient = () => {
    setClientName(clientSearchQuery);
    setSelectedClientId(null);
    setClientType('New');
    setShowClientDropdown(false);

    if (errors.clientName) {
      setErrors({ ...errors, clientName: undefined });
    }

    haptics.selection();
  };

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, MenuServiceWithEmbeddedVariants[]> = {};
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));

    catalogServices.forEach(svc => {
      const categoryName = categoryMap.get(svc.categoryId) || 'Other';
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(svc);
    });

    return grouped;
  }, [catalogServices, categories]);

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    if (serviceSearchQuery.length < 1) return servicesByCategory;

    const query = serviceSearchQuery.toLowerCase();
    const filtered: Record<string, MenuServiceWithEmbeddedVariants[]> = {};

    Object.entries(servicesByCategory).forEach(([category, services]) => {
      const matching = services.filter(svc =>
        svc.name.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query)
      );
      if (matching.length > 0) {
        filtered[category] = matching;
      }
    });

    return filtered;
  }, [servicesByCategory, serviceSearchQuery]);

  // Calculate total duration from selected services
  const totalEstimatedDuration = useMemo(() => {
    if (selectedServices.length === 0) return 0;
    return selectedServices.reduce((sum, svc) => sum + svc.duration, 0);
  }, [selectedServices]);

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return hours === 1 ? '1 hour' : `${hours} hours`;
    return `${hours}h ${mins}m`;
  };

  // Handle service selection
  const handleSelectService = (svc: MenuServiceWithEmbeddedVariants) => {
    const categoryName = categories.find(c => c.id === svc.categoryId)?.name;
    const newService: SelectedService = {
      id: svc.id,
      name: svc.name,
      duration: svc.duration,
      price: svc.price,
      categoryName,
    };

    // Add to selected services (allow multiple)
    setSelectedServices(prev => [...prev, newService]);

    // Update legacy service field with all service names
    const allNames = [...selectedServices, newService].map(s => s.name).join(', ');
    setService(allNames);

    // Update duration based on total
    const totalDuration = totalEstimatedDuration + svc.duration;
    setDuration(formatDuration(totalDuration));

    // Clear search and close dropdown
    setServiceSearchQuery('');
    setShowServiceDropdown(false);

    if (errors.service) {
      setErrors({ ...errors, service: undefined });
    }

    haptics.selection();
  };

  // Handle removing a selected service
  const handleRemoveService = (serviceId: string) => {
    const updated = selectedServices.filter(s => s.id !== serviceId);
    setSelectedServices(updated);

    // Update legacy service field
    const allNames = updated.map(s => s.name).join(', ');
    setService(allNames);

    // Update duration
    const totalDuration = updated.reduce((sum, s) => sum + s.duration, 0);
    setDuration(totalDuration > 0 ? formatDuration(totalDuration) : '30 min');

    haptics.selection();
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Client dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        clientInputRef.current &&
        !clientInputRef.current.contains(event.target as Node)
      ) {
        setShowClientDropdown(false);
      }
      // Service dropdown
      if (
        serviceDropdownRef.current &&
        !serviceDropdownRef.current.contains(event.target as Node) &&
        serviceInputRef.current &&
        !serviceInputRef.current.contains(event.target as Node)
      ) {
        setShowServiceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // Get createTicket function from context
  const {
    createTicket
  } = useTickets();
  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      // Reset form fields
      setClientName('');
      setClientType('Regular');
      setSelectedClientId(null);
      setClientSearchQuery('');
      setShowClientDropdown(false);
      setService('');
      setSelectedServices([]);
      setServiceSearchQuery('');
      setShowServiceDropdown(false);
      setDuration('30 min');
      setNotes('');
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const formattedHours = hours % 12 || 12;
      const period = hours >= 12 ? 'PM' : 'AM';
      setTime(`${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`);
      setErrors({});
    }
  }, [isOpen]);
  // Handle form submission
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate form
    const newErrors: {
      clientName?: string;
      service?: string;
    } = {};
    if (!clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    // Service required - either selected from list or typed manually
    if (!service.trim() && selectedServices.length === 0) {
      newErrors.service = 'Service is required';
    }

    // If there are errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      haptics.error();
      setErrors(newErrors);
      return;
    }

    // Determine service name: use selected services if any, otherwise use free-text
    const serviceName = selectedServices.length > 0
      ? selectedServices.map(s => s.name).join(', ')
      : service;

    // Create new ticket
    const ticketData = {
      clientName,
      ...(selectedClientId && { clientId: selectedClientId }),
      clientType,
      service: serviceName,
      duration,
      notes,
      time,
      // Include selected services array for richer data
      ...(selectedServices.length > 0 && { selectedServices }),
    };

    if (onSubmit) {
      onSubmit(ticketData);
    } else {
      createTicket(ticketData);
    }

    // Success feedback with toast and close
    haptics.success();
    toast.success(`Ticket created for ${clientName}`);
    onClose();
  };

  // Client type button for touch-friendly selection
  const ClientTypeButton = ({ type, label }: { type: string; label: string }) => {
    const isActive = clientType === type;
    return (
      <button
        type="button"
        onClick={() => {
          haptics.selection();
          setClientType(type);
        }}
        className={`
          flex-1 py-3 rounded-xl border-2 transition-all font-medium text-sm
          min-h-[48px] active:scale-95
          ${isActive
            ? 'border-green-500 bg-green-50 text-green-700'
            : 'border-gray-200 hover:border-gray-300 text-gray-600 active:bg-gray-50'
          }
        `}
      >
        {label}
      </button>
    );
  };

  // Duration button for touch-friendly selection
  const DurationButton = ({ value, label }: { value: string; label: string }) => {
    const isActive = duration === value;
    return (
      <button
        type="button"
        onClick={() => {
          haptics.selection();
          setDuration(value);
        }}
        className={`
          py-2.5 px-3 rounded-lg border-2 transition-all font-medium text-sm
          min-h-[44px] active:scale-95
          ${isActive
            ? 'border-green-500 bg-green-50 text-green-700'
            : 'border-gray-200 hover:border-gray-300 text-gray-600 active:bg-gray-50'
          }
        `}
      >
        {label}
      </button>
    );
  };

  const footer = (
    <MobileSheetFooter stacked={isMobile}>
      <MobileSheetButton
        variant="secondary"
        onClick={onClose}
        fullWidth={isMobile}
      >
        Cancel
      </MobileSheetButton>
      <MobileSheetButton
        variant="primary"
        onClick={() => handleSubmit()}
        fullWidth
        className="bg-green-600 hover:bg-green-700 active:bg-green-800"
      >
        <Check size={20} />
        Create Ticket
      </MobileSheetButton>
    </MobileSheetFooter>
  );

  return (
    <MobileSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Ticket"
      footer={footer}
      fullScreenOnMobile={true}
    >
      <MobileSheetContent className="space-y-5">
        {/* Client Name with Search */}
        <div className="relative">
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
            Client Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              ref={clientInputRef}
              type="text"
              id="clientName"
              className={`
                w-full pl-12 pr-4 py-3 border rounded-xl text-base
                focus:outline-none focus:ring-2 transition-all
                ${errors.clientName
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }
              `}
              style={{ fontSize: '16px' }}
              value={clientSearchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setClientSearchQuery(value);
                setClientName(value);
                setSelectedClientId(null); // Clear selection when typing
                setShowClientDropdown(value.length >= 2);
                if (errors.clientName) setErrors({ ...errors, clientName: undefined });
              }}
              onFocus={() => {
                if (clientSearchQuery.length >= 2) {
                  setShowClientDropdown(true);
                }
              }}
              placeholder="Search client by name or phone..."
              autoComplete="off"
            />
            {selectedClientId && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Check size={18} className="text-green-500" />
              </div>
            )}
          </div>

          {/* Client Search Dropdown */}
          {showClientDropdown && (
            <div
              ref={dropdownRef}
              className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-64 overflow-y-auto"
            >
              {filteredClients.length > 0 ? (
                <>
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        {client.avatar ? (
                          <img src={client.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <User size={20} className="text-green-600" />
                        )}
                      </div>

                      {/* Client Info */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {client.displayName || `${client.firstName} ${client.lastName}`.trim()}
                          </span>
                          {client.isVip && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                              VIP
                            </span>
                          )}
                          {isFirstVisit(client) && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded flex items-center gap-0.5">
                              <Sparkles size={10} />
                              First Visit
                            </span>
                          )}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone size={12} />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}

                  {/* Create New Client Option */}
                  <button
                    type="button"
                    onClick={handleCreateNewClient}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-50 active:bg-green-100 transition-colors text-green-700"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <UserPlus size={20} className="text-green-600" />
                    </div>
                    <span className="font-medium">Create New Client: "{clientSearchQuery}"</span>
                  </button>
                </>
              ) : clientSearchQuery.length >= 2 ? (
                <>
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No clients found matching "{clientSearchQuery}"
                  </div>
                  {/* Create New Client Option */}
                  <button
                    type="button"
                    onClick={handleCreateNewClient}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-50 active:bg-green-100 transition-colors text-green-700 border-t border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <UserPlus size={20} className="text-green-600" />
                    </div>
                    <span className="font-medium">Create New Client: "{clientSearchQuery}"</span>
                  </button>
                </>
              ) : null}
            </div>
          )}

          {errors.clientName && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle size={14} className="mr-1 flex-shrink-0" />
              {errors.clientName}
            </p>
          )}
        </div>

        {/* Client Type - Touch-friendly buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            <ClientTypeButton type="Regular" label="Regular" />
            <ClientTypeButton type="VIP" label="VIP" />
            <ClientTypeButton type="New" label="New" />
            <ClientTypeButton type="Priority" label="Priority" />
          </div>
        </div>

        {/* Service Selection */}
        <div className="relative">
          <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
            Service <span className="text-red-500">*</span>
            {selectedServices.length > 0 && (
              <span className="ml-2 text-xs text-gray-500">
                ({selectedServices.length} selected • {formatDuration(totalEstimatedDuration)})
              </span>
            )}
          </label>

          {/* Selected Services Chips */}
          {selectedServices.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedServices.map((svc) => (
                <div
                  key={svc.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  <span className="font-medium">{svc.name}</span>
                  <span className="text-green-600 text-xs">({svc.duration}min)</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(svc.id)}
                    className="ml-0.5 p-0.5 hover:bg-green-200 rounded-full transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Service Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {selectedServices.length > 0 ? (
                <Plus size={18} className="text-gray-400" />
              ) : (
                <Tag size={18} className="text-gray-400" />
              )}
            </div>
            <input
              ref={serviceInputRef}
              type="text"
              id="service"
              className={`
                w-full pl-12 pr-10 py-3 border rounded-xl text-base
                focus:outline-none focus:ring-2 transition-all
                ${errors.service
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }
              `}
              style={{ fontSize: '16px' }}
              value={serviceSearchQuery}
              onChange={(e) => {
                setServiceSearchQuery(e.target.value);
                setShowServiceDropdown(true);
                if (errors.service) setErrors({ ...errors, service: undefined });
              }}
              onFocus={() => setShowServiceDropdown(true)}
              placeholder={selectedServices.length > 0 ? 'Add another service...' : 'Search or select a service...'}
              autoComplete="off"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDown size={18} className="text-gray-400" />
            </div>
          </div>

          {/* Service Dropdown */}
          {showServiceDropdown && (
            <div
              ref={serviceDropdownRef}
              className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-64 overflow-y-auto"
            >
              {Object.keys(filteredServices).length > 0 ? (
                <>
                  {Object.entries(filteredServices).map(([category, services]) => (
                    <div key={category}>
                      {/* Category Header */}
                      <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                        {category}
                      </div>
                      {/* Services in Category */}
                      {services.map((svc) => {
                        const isAlreadySelected = selectedServices.some(s => s.id === svc.id);
                        return (
                          <button
                            key={svc.id}
                            type="button"
                            onClick={() => !isAlreadySelected && handleSelectService(svc)}
                            disabled={isAlreadySelected}
                            className={`
                              w-full px-4 py-3 flex items-center justify-between
                              transition-colors border-b border-gray-100 last:border-b-0
                              ${isAlreadySelected
                                ? 'bg-green-50 text-green-800 cursor-not-allowed'
                                : 'hover:bg-gray-50 active:bg-gray-100'
                              }
                            `}
                          >
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${isAlreadySelected ? 'text-green-800' : 'text-gray-900'}`}>
                                  {svc.name}
                                </span>
                                {isAlreadySelected && (
                                  <Check size={16} className="text-green-600" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock size={12} />
                                  {svc.duration} min
                                </span>
                                <span className="text-xs text-gray-500">
                                  ${svc.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}

                  {/* Free-text option for backward compatibility */}
                  {serviceSearchQuery.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setService(serviceSearchQuery);
                        setShowServiceDropdown(false);
                        if (errors.service) setErrors({ ...errors, service: undefined });
                        haptics.selection();
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 active:bg-blue-100 transition-colors text-blue-700 border-t border-gray-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Tag size={16} className="text-blue-600" />
                      </div>
                      <span className="font-medium">Use custom: "{serviceSearchQuery}"</span>
                    </button>
                  )}
                </>
              ) : catalogServices.length === 0 ? (
                <>
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No services available. Enter a custom service name.
                  </div>
                  {serviceSearchQuery.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setService(serviceSearchQuery);
                        setShowServiceDropdown(false);
                        if (errors.service) setErrors({ ...errors, service: undefined });
                        haptics.selection();
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 active:bg-blue-100 transition-colors text-blue-700 border-t border-gray-100"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Tag size={16} className="text-blue-600" />
                      </div>
                      <span className="font-medium">Use: "{serviceSearchQuery}"</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No services match "{serviceSearchQuery}"
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setService(serviceSearchQuery);
                      setShowServiceDropdown(false);
                      if (errors.service) setErrors({ ...errors, service: undefined });
                      haptics.selection();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 active:bg-blue-100 transition-colors text-blue-700 border-t border-gray-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Tag size={16} className="text-blue-600" />
                    </div>
                    <span className="font-medium">Use custom: "{serviceSearchQuery}"</span>
                  </button>
                </>
              )}
            </div>
          )}

          {errors.service && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle size={14} className="mr-1 flex-shrink-0" />
              {errors.service}
            </p>
          )}
        </div>

        {/* Time */}
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
            Time
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Clock size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="time"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              style={{ fontSize: '16px' }}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="HH:MM AM/PM"
            />
          </div>
        </div>

        {/* Duration - Touch-friendly buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            <DurationButton value="15 min" label="15 min" />
            <DurationButton value="30 min" label="30 min" />
            <DurationButton value="45 min" label="45 min" />
            <DurationButton value="1 hour" label="1 hour" />
            <DurationButton value="1.5 hours" label="1.5 hrs" />
            <DurationButton value="2 hours" label="2 hours" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            style={{ fontSize: '16px' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional information"
          />
        </div>
      </MobileSheetContent>
    </MobileSheet>
  );
}