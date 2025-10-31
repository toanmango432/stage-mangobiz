/**
 * New Appointment Modal - Fresha-Inspired Design
 * 3-Panel Layout: Client | Calendar | Services
 */

import { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Calendar, Clock, User, ChevronRight, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { clientsDB } from '../../db/database';
import { db } from '../../db/schema';
import { getTestSalonId } from '../../db/seed';
import { useDebounce } from '../../hooks/useDebounce';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  membershipLevel?: string;
  totalVisits?: number;
}

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
}

interface SelectedServiceWithStaff extends Service {
  assignedStaffId: string;
  assignedStaffName: string;
}

interface Staff {
  id: string;
  name: string;
  photo?: string;
}

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: Date;
  selectedStaffId?: string;
  onSave?: (appointment: any) => void;
}

export function NewAppointmentModal({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  selectedStaffId,
  onSave,
}: NewAppointmentModalProps) {
  // State
  const [isMinimized, setIsMinimized] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedServiceWithStaff[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [date, setDate] = useState<Date>(selectedDate || new Date());
  const [time, setTime] = useState<string>(
    selectedTime ? selectedTime.toTimeString().slice(0, 5) : '10:00'
  );
  const [pendingService, setPendingService] = useState<Service | null>(null);
  const [showStaffSelector, setShowStaffSelector] = useState(false);
  
  // Data from IndexedDB
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searching, setSearching] = useState(false);
  const salonId = getTestSalonId();
  const debouncedSearch = useDebounce(clientSearch, 300);

  // Load services from IndexedDB on mount
  useEffect(() => {
    async function loadServices() {
      try {
        const servicesList = await db.services
          .where('salonId').equals(salonId)
          .and(s => s.isActive)
          .toArray();
        setServices(servicesList.map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
          duration: s.duration,
          price: s.price
        })));
      } catch (error) {
        console.error('Failed to load services:', error);
      }
    }
    if (isOpen) loadServices();
  }, [isOpen, salonId]);
  
  // Search clients from IndexedDB (debounced)
  useEffect(() => {
    async function searchClients() {
      if (debouncedSearch.length < 2) {
        setClients([]);
        return;
      }
      
      setSearching(true);
      try {
        const results = await clientsDB.search(salonId, debouncedSearch);
        setClients(results.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone || '',
          email: c.email,
          membershipLevel: c.loyaltyTier,
          totalVisits: c.totalVisits
        })));
      } catch (error) {
        console.error('Failed to search clients:', error);
      } finally {
        setSearching(false);
      }
    }
    
    searchClients();
  }, [debouncedSearch, salonId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClientSearch('');
      setServiceSearch('');
      setSelectedClient(null);
      setSelectedServices([]);
      setSelectedCategory('All');
      setDate(selectedDate || new Date());
      setTime(selectedTime ? selectedTime.toTimeString().slice(0, 5) : '10:00');
      setPendingService(null);
      setShowStaffSelector(false);
      setClients([]);
    }
  }, [isOpen, selectedDate, selectedTime]);

  // Services are now loaded from IndexedDB (see useEffect above)
  const mockServices: Service[] = [
    { id: 's1', name: 'Gel Manicure', category: 'Nails', duration: 60, price: 45 },
    { id: 's2', name: 'Acrylic Full Set', category: 'Nails', duration: 90, price: 65 },
    { id: 's3', name: 'Pedicure', category: 'Foot Care', duration: 75, price: 55 },
    { id: 's4', name: 'Manicure', category: 'Nails', duration: 45, price: 35 },
    { id: 's5', name: 'Nail Art', category: 'Nails', duration: 30, price: 25 },
    { id: 's6', name: 'Brows', category: 'Waxing', duration: 15, price: 10 },
    { id: 's7', name: 'Haircut', category: 'Hair', duration: 30, price: 25 },
    { id: 's8', name: 'Blow Dry', category: 'Hair', duration: 30, price: 25 },
    { id: 's9', name: 'Combo 1', category: 'Hair', duration: 180, price: 40 },
  ];

  const mockStaff: Staff[] = [
    { id: '1', name: 'Sophia' },
    { id: '2', name: 'Isabella' },
    { id: '3', name: 'Mia' },
    { id: '4', name: 'Olivia' },
  ];

  const categories = ['All', 'Nails', 'Foot Care', 'Waxing', 'Hair'];

  // Filter clients
  const filteredClients = useMemo(() => {
    if (!clientSearch) return [];
    // Clients are already filtered by search from IndexedDB
    // Just use the clients state directly
    return clients;
  }, [clientSearch, clients]);

  // Filter services
  const filteredServices = useMemo(() => {
    let filtered = services;
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((s: Service) => s.category === selectedCategory);
    }
    
    if (serviceSearch) {
      const query = serviceSearch.toLowerCase();
      filtered = filtered.filter(
        (s: Service) => s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [services, selectedCategory, serviceSearch]);

  // Calculate total
  const total = useMemo(() => {
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    return { price: totalPrice, duration: totalDuration };
  }, [selectedServices]);

  // Handlers
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
  };

  const handleAddService = (service: Service, staffId: string) => {
    const staff = mockStaff.find(s => s.id === staffId);
    if (!staff) return;
    
    if (!selectedServices.find(s => s.id === service.id)) {
      const serviceWithStaff: SelectedServiceWithStaff = {
        ...service,
        assignedStaffId: staffId,
        assignedStaffName: staff.name,
      };
      setSelectedServices([...selectedServices, serviceWithStaff]);
    }
    setPendingService(null);
    setShowStaffSelector(false);
  };

  const handleSelectServiceForStaffAssignment = (service: Service) => {
    setPendingService(service);
    setShowStaffSelector(true);
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };

  const handleBook = () => {
    if (!selectedClient || selectedServices.length === 0) return;

    // Create appointment object
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledStartTime = new Date(date);
    scheduledStartTime.setHours(hours, minutes, 0, 0);

    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const scheduledEndTime = new Date(scheduledStartTime);
    scheduledEndTime.setMinutes(scheduledEndTime.getMinutes() + totalDuration);

    const appointment = {
      id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phone,
      scheduledStartTime: scheduledStartTime.toISOString(),
      scheduledEndTime: scheduledEndTime.toISOString(),
      status: 'scheduled' as const,
      staffName: selectedServices[0]?.assignedStaffName || '', // Add top-level staffName
      services: selectedServices.map(s => ({
        id: s.id,
        serviceName: s.name,
        category: s.category,
        duration: s.duration,
        price: s.price,
        staffId: s.assignedStaffId,
        staffName: s.assignedStaffName,
      })),
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Booking appointment:', appointment);

    // Call onSave callback if provided
    if (onSave) {
      onSave(appointment);
    }

    onClose();
  };

  const canBook = selectedClient && selectedServices.length > 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {!isMinimized && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Modal - Slide from Right, Full screen on mobile */}
      <div className={cn(
        "fixed z-50 bg-white shadow-2xl flex flex-col transition-all duration-300",
        isMinimized 
          ? "right-4 bottom-20 top-auto left-auto w-80 sm:w-96 h-16 rounded-lg" 
          : "right-0 top-0 bottom-16 sm:bottom-20 w-full max-w-full sm:max-w-4xl animate-slide-in-right"
      )}>
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between bg-white shrink-0",
            isMinimized ? "px-4 py-3 border-0" : "px-6 py-4 border-b border-gray-200"
          )}>
            <div className="flex-1">
              <h2 className={cn(
                "font-bold text-gray-900",
                isMinimized ? "text-base" : "text-2xl"
              )}>
                New Appointment
              </h2>
              {!isMinimized && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? (
                  <Maximize2 className="w-5 h-5 text-gray-500" />
                ) : (
                  <Minimize2 className="w-5 h-5 text-gray-500" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content - 2 Panels (Side-by-side on desktop, stacked on mobile) */}
          {!isMinimized && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
            {/* LEFT PANEL: Client Selection / Profile */}
            <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col bg-gray-50 overflow-y-auto">
              {!selectedClient ? (
                // Client Search
                <div className="flex flex-col p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Client</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Client List */}
                  <div className="space-y-2">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => handleSelectClient(client)}
                        className="w-full text-left p-4 bg-white rounded-lg border border-gray-200 hover:border-teal-500 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-600 mt-0.5">{client.phone}</p>
                            {client.membershipLevel && (
                              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                                {client.membershipLevel}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>
                    ))}

                    {/* Add New Client */}
                    <button className="w-full p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-teal-500 hover:bg-teal-50 transition-all flex items-center justify-center space-x-2 text-teal-600 font-medium">
                      <Plus className="w-5 h-5" />
                      <span>Add New Client</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Client Profile
                <div className="flex flex-col p-6">
                  <div className="mb-4">
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium mb-4"
                    >
                      ← Change Client
                    </button>
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-lg">
                          {selectedClient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{selectedClient.name}</p>
                          <p className="text-sm text-gray-600">{selectedClient.phone}</p>
                        </div>
                      </div>
                      
                      {selectedClient.membershipLevel && (
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                            {selectedClient.membershipLevel}
                          </span>
                          <span className="text-xs text-gray-500">
                            {selectedClient.totalVisits} visits
                          </span>
                        </div>
                      )}
                      
                      {selectedClient.email && (
                        <p className="text-xs text-gray-500 mt-2">{selectedClient.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Date, Time, Staff */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          value={date.toISOString().split('T')[0]}
                          onChange={(e) => setDate(new Date(e.target.value))}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Time <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                        />
                      </div>
                    </div>

                    {/* Staff Assignment Note */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <User className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-purple-900 text-sm">Staff Assignment</p>
                          <p className="text-xs text-purple-700 mt-1">
                            Staff will be assigned when you select services on the right →
                          </p>
                          {selectedServices.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {selectedServices.map(s => (
                                <div key={s.id} className="text-xs text-purple-800">
                                  • {s.name} → <span className="font-semibold">{s.assignedStaffName}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {selectedServices.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-gray-200">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Total Duration:</span>
                          <span className="font-semibold text-gray-900">{total.duration} min</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total Price:</span>
                          <span className="font-bold text-gray-900 text-lg">${total.price}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT PANEL: Service Selection */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {/* Service Header */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Services</h3>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by service name..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                {/* Categories */}
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                        selectedCategory === category
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Services */}
              {selectedServices.length > 0 && (
                <div className="px-6 py-4 bg-teal-50 border-b border-teal-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    Selected Services ({selectedServices.length})
                  </p>
                  <div className="space-y-2">
                    {selectedServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-teal-200"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{service.name}</p>
                          <p className="text-sm text-gray-600">
                            ${service.price} • {service.duration}min
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveService(service.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 gap-4">
                  {filteredServices.map((service) => {
                    const isSelected = selectedServices.find(s => s.id === service.id);
                    return (
                      <button
                        key={service.id}
                        onClick={() => handleSelectServiceForStaffAssignment(service)}
                        disabled={!!isSelected}
                        className={cn(
                          'text-left p-4 rounded-lg border-2 transition-all',
                          isSelected
                            ? 'border-teal-500 bg-teal-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-teal-500 hover:shadow-md'
                        )}
                      >
                        <p className="font-semibold text-gray-900 mb-1">{service.name}</p>
                        <p className="text-sm text-gray-600 mb-2">
                          {service.duration}min
                        </p>
                        <p className="text-lg font-bold text-gray-900">${service.price}</p>
                        {isSelected ? (
                          <div className="mt-2">
                            <span className="inline-block text-xs font-medium text-teal-600">
                              ✓ Added - {isSelected.assignedStaffName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 mt-2 block">
                            Click to assign staff
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Footer - Always Visible */}
          {!isMinimized && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBook}
              disabled={!canBook}
              className={cn(
                'px-8 py-3 font-semibold rounded-lg transition-all',
                canBook
                  ? 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              Book Appointment
            </button>
          </div>
          )}
        </div>

      {/* Staff Selector Modal */}
      {showStaffSelector && pendingService && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowStaffSelector(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Assign Staff</h3>
                <p className="text-sm text-gray-600 mt-0.5">{pendingService.name}</p>
              </div>
              <button
                onClick={() => setShowStaffSelector(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-2">
              {mockStaff.map((staff) => {
                const isAssigned = selectedServices.find(s => s.assignedStaffId === staff.id);
                return (
                  <button
                    key={staff.id}
                    onClick={() => handleAddService(pendingService, staff.id)}
                    className={cn(
                      'w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all text-left',
                      isAssigned
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-gray-200 hover:border-teal-500 hover:bg-teal-50'
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold">
                      {staff.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{staff.name}</p>
                      {isAssigned && (
                        <p className="text-xs text-orange-600 mt-0.5">
                          ⚠️ Already assigned to {isAssigned.name}
                        </p>
                      )}
                    </div>
                    {!isAssigned && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </>
  );
}
