/**
 * New Appointment Modal v3.0
 * World-Class UX/UI - Final Polish
 * Every interaction optimized for speed and clarity
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search, Calendar, Clock, User, Plus, ChevronDown, ChevronUp, Trash2, PanelRightClose, Maximize, Check, ArrowDownToLine, LayoutPanelLeft, Lock, Zap, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { clientsDB } from '../../db/database';
import toast from 'react-hot-toast';
import { db } from '../../db/schema';
import { getTestSalonId } from '../../db/seed';
import { useDebounce } from '../../hooks/useDebounce';
import { useAppSelector } from '../../store/hooks';
import { selectAllStaff } from '../../store/slices/staffSlice';
import { LocalAppointment } from '../../types/appointment';
import { Client as ClientType } from '../../types/client';
import {
  isValidEmail,
  getEmailError,
  isValidPhoneNumber,
  getPhoneError,
  getNameError,
  formatNameInput,
  capitalizeName,
} from '../../utils/validation';
import { formatPhoneNumber } from '../../utils/phoneUtils';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
}

interface ServiceWithTime extends Service {
  startTime: string;
  endTime: string;
}

interface StaffWithServices {
  staffId: string;
  staffName: string;
  services: ServiceWithTime[];
  isExpanded: boolean;
  isRequested?: boolean; // Client specifically requested this staff
}

// New: For group bookings - track each guest and their services
interface BookingGuest {
  id: string; // temp ID for this guest
  name: string; // "John Smith" or "Guest 2 of John Smith"
  isNamed: boolean; // true if user provided name/linked to client
  clientId?: string; // if linked to actual client record
  phone?: string;
  startTime?: string; // ISO string - guest's earliest service start time
  services: Array<{
    serviceId: string;
    serviceName: string;
    serviceCategory: string;
    duration: number;
    price: number;
    staffId: string;
    staffName: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
  }>;
}

interface NewAppointmentModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: Date;
  selectedStaffId?: string;
  selectedStaffName?: string;
  onSave?: (appointment: LocalAppointment) => void;
  viewMode?: 'slide' | 'fullpage';
}

export function NewAppointmentModalV2({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  selectedStaffId,
  selectedStaffName,
  onSave,
  viewMode = 'slide',
}: NewAppointmentModalV2Props) {
  // STATE
  const [view, setView] = useState<'slide' | 'fullpage'>(() => {
    const savedDefault = localStorage.getItem('appointmentModalDefaultView') as 'slide' | 'fullpage' | null;
    return savedDefault || viewMode;
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'service' | 'staff'>('service');
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const clientSearchRef = useRef<HTMLInputElement>(null);
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showAddNewForm, setShowAddNewForm] = useState(false);
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [isAddingAnotherClient, setIsAddingAnotherClient] = useState(false);
  const [bookingMode, setBookingMode] = useState<'individual' | 'group'>('individual');
  const [partySize, setPartySize] = useState(1);

  // New: Group booking state
  const [bookingGuests, setBookingGuests] = useState<BookingGuest[]>([]);
  const [groupStep, setGroupStep] = useState<'guests' | 'services'>('guests'); // Step 1: Add guests, Step 2: Assign services
  const [activeGuestId, setActiveGuestId] = useState<string | null>(null); // Which guest we're adding services for

  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [newClientFirstName, setNewClientFirstName] = useState('');
  const [newClientLastName, setNewClientLastName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  }>({});
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [date, setDate] = useState<Date>(selectedDate || new Date());
  const [defaultStartTime, setDefaultStartTime] = useState<string>(
    selectedTime ? selectedTime.toTimeString().slice(0, 5) : '10:00'
  );
  const [postedStaff, setPostedStaff] = useState<StaffWithServices[]>([]);
  const [activeStaffId, setActiveStaffId] = useState<string | null>(selectedStaffId || null);
  const [timeMode, setTimeMode] = useState<'sequential' | 'parallel'>('sequential');
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searching, setSearching] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [justAddedService, setJustAddedService] = useState<string | null>(null);
  const salonId = getTestSalonId();
  const debouncedSearch = useDebounce(clientSearch, 300);
  const allStaffFromRedux = useAppSelector(selectAllStaff) || [];

  // Load recent clients on open
  useEffect(() => {
    if (isOpen && selectedClients.length === 0) {
      // Load recent clients
      clientsDB.getAll(salonId).then(allClients => {
        // Get 5 most recent clients
        const sorted = allClients
          .sort((a, b) => {
            const aDate = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
            const bDate = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
            return bDate - aDate;
          })
          .slice(0, 5);
        setRecentClients(sorted.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone || '',
          email: c.email
        })) as any);
      });
    }
  }, [isOpen, selectedClients.length, salonId]);

  // LOAD DATA
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
    if (isOpen) {
      loadServices();
    }
  }, [isOpen, salonId]);

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
          email: c.email
        })) as any);
      } catch (error) {
        console.error('Failed to search clients:', error);
      } finally {
        setSearching(false);
      }
    }
    searchClients();
  }, [debouncedSearch, salonId]);

  useEffect(() => {
    if (isOpen && selectedStaffId && selectedStaffName) {
      setActiveStaffId(selectedStaffId);
      if (!postedStaff.find(s => s.staffId === selectedStaffId)) {
        setPostedStaff([{
          staffId: selectedStaffId,
          staffName: selectedStaffName,
          services: [],
          isExpanded: true
        }]);
      }
    }
  }, [isOpen, selectedStaffId, selectedStaffName]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedClients([]);
      setClientSearch('');
      setShowAddNewForm(false);
      setNewClientFirstName('');
      setNewClientLastName('');
      setNewClientPhone('');
      setNewClientEmail('');
      setServiceSearch('');
      setPostedStaff([]);
      setActiveStaffId(null);
      setActiveTab('service');
      setIsMinimized(false);
      setShowViewMenu(false);
      setIsBooking(false);
      setAppointmentNotes('');
      setIsAddingAnotherClient(false);
      setBookingMode('individual');
      setPartySize(1);
      // Reset group booking states
      setBookingGuests([]);
      setGroupStep('guests');
      setActiveGuestId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setShowViewMenu(false);
      }
    }
    if (showViewMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showViewMenu]);

  // Clear "just added" indicator after animation
  useEffect(() => {
    if (justAddedService) {
      const timer = setTimeout(() => setJustAddedService(null), 600);
      return () => clearTimeout(timer);
    }
  }, [justAddedService]);

  // COMPUTED
  const categories = useMemo(() => {
    const cats = ['All', ...Array.from(new Set(services.map(s => s.category)))];
    return cats;
  }, [services]);

  const filteredServices = useMemo(() => {
    let filtered = services;
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    if (serviceSearch) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(serviceSearch.toLowerCase())
      );
    }
    return filtered;
  }, [services, selectedCategory, serviceSearch]);

  const totalDuration = useMemo(() => {
    return postedStaff.reduce((total, staff) => {
      return total + staff.services.reduce((sum, svc) => sum + svc.duration, 0);
    }, 0);
  }, [postedStaff]);

  const totalPrice = useMemo(() => {
    return postedStaff.reduce((total, staff) => {
      return total + staff.services.reduce((sum, svc) => sum + svc.price, 0);
    }, 0);
  }, [postedStaff]);

  const canBook = selectedClients.length > 0 && postedStaff.some(s => s.services.length > 0);

  const activeStaffName = useMemo(() => {
    if (!activeStaffId) return null;
    const staff = postedStaff.find(s => s.staffId === activeStaffId);
    return staff?.staffName || null;
  }, [activeStaffId, postedStaff]);

  const validationMessage = useMemo(() => {
    if (selectedClients.length === 0) return 'Select at least one client to continue';
    if (!postedStaff.some(s => s.services.length > 0)) return 'Add at least one service';
    return null;
  }, [selectedClients.length, postedStaff]);

  // HANDLERS
  const handleSelectClient = (client: ClientType | Client) => {
    const clientData = {
      id: client.id,
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || ''
    };

    if (bookingMode === 'individual') {
      // Individual mode: Replace any existing client (only one allowed)
      setSelectedClients([clientData]);
      setPartySize(1);
    } else {
      // Group mode: Add to the list if not already added
      if (selectedClients.some(c => c.id === client.id)) {
        return; // Already added, skip
      }

      const newClients = [...selectedClients, clientData];
      setSelectedClients(newClients);

      // Auto-increase party size if adding more clients than current party size
      if (newClients.length > partySize) {
        setPartySize(newClients.length);
      }
    }

    setClientSearch('');
    setShowAddNewForm(false);
    setIsAddingAnotherClient(false);
    // Auto-switch to staff tab if no staff selected
    if (!activeStaffId && selectedClients.length === 0) {
      setActiveTab('staff');
    }
  };

  // Validate all fields before submission
  const validateClientForm = () => {
    const errors: typeof validationErrors = {};

    // First name validation
    const firstNameError = getNameError(newClientFirstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;

    // Last name validation
    const lastNameError = getNameError(newClientLastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;

    // Phone validation
    const phoneError = getPhoneError(newClientPhone);
    if (phoneError) errors.phone = phoneError;

    // Email validation (optional but must be valid if provided)
    if (newClientEmail.trim()) {
      const emailError = getEmailError(newClientEmail);
      if (emailError) errors.email = emailError;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddNewClient = async () => {
    // Validate form
    if (!validateClientForm()) {
      // Focus on first field with error
      if (validationErrors.firstName) {
        document.getElementById('client-first-name')?.focus();
      } else if (validationErrors.lastName) {
        document.getElementById('client-last-name')?.focus();
      } else if (validationErrors.phone) {
        document.getElementById('client-phone')?.focus();
      } else if (validationErrors.email) {
        document.getElementById('client-email')?.focus();
      }
      return;
    }

    setIsAddingClient(true);
    try {
      const fullName = `${capitalizeName(newClientFirstName.trim())} ${capitalizeName(newClientLastName.trim())}`;
      const newClient = await clientsDB.create({
        salonId,
        firstName: capitalizeName(newClientFirstName.trim()),
        lastName: capitalizeName(newClientLastName.trim()),
        name: fullName,
        phone: newClientPhone.trim(),
        email: newClientEmail.trim() || undefined,
        isBlocked: false,
      } as any);

      // Auto-select the new client
      handleSelectClient(newClient);

      // Reset form
      setNewClientFirstName('');
      setNewClientLastName('');
      setNewClientPhone('');
      setNewClientEmail('');
      setValidationErrors({});
      setShowAddNewForm(false);
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client. Please try again.');
    } finally {
      setIsAddingClient(false);
    }
  };

  // GROUP BOOKING HANDLERS
  const handleAddNamedGuest = (client: ClientType | Client) => {
    // Check if already added
    if (bookingGuests.some(g => g.clientId === client.id)) return;

    const newGuest: BookingGuest = {
      id: `guest-${Date.now()}-${Math.random()}`,
      name: client.name || '',
      isNamed: true,
      clientId: client.id,
      phone: client.phone || '',
      services: []
    };

    setBookingGuests([...bookingGuests, newGuest]);
    setClientSearch('');
    setShowAddNewForm(false);
    setIsAddingAnotherClient(false);
  };

  const handleAddUnnamedGuest = () => {
    const mainGuest = bookingGuests.find(g => g.isNamed);
    if (!mainGuest) {
      toast.error('Please add a main guest first');
      return;
    }

    const unnamedCount = bookingGuests.filter(g => !g.isNamed).length;
    const newGuest: BookingGuest = {
      id: `guest-${Date.now()}-${Math.random()}`,
      name: `Guest ${unnamedCount + 2} of ${mainGuest.name}`,
      isNamed: false,
      services: []
    };

    setBookingGuests([...bookingGuests, newGuest]);
  };

  const handleRemoveGuest = (guestId: string) => {
    setBookingGuests(bookingGuests.filter(g => g.id !== guestId));
  };

  const handleAddServiceToGuest = (guestId: string, service: Service, staffId: string, staffName: string) => {
    setBookingGuests(bookingGuests.map(guest => {
      if (guest.id === guestId) {
        // Calculate start time based on last service or default
        let startTime = defaultStartTime;
        if (guest.services.length > 0 && timeMode === 'sequential') {
          const lastService = guest.services[guest.services.length - 1];
          startTime = lastService.endTime;
        }

        // Calculate end time
        const { endTime } = calculateServiceTimes(startTime, service.duration);

        return {
          ...guest,
          services: [...guest.services, {
            serviceId: service.id,
            serviceName: service.name,
            serviceCategory: service.category,
            duration: service.duration,
            price: service.price,
            staffId,
            staffName,
            startTime,
            endTime
          }]
        };
      }
      return guest;
    }));
  };

  const handleRemoveServiceFromGuest = (guestId: string, serviceIndex: number) => {
    setBookingGuests(bookingGuests.map(guest => {
      if (guest.id === guestId) {
        return {
          ...guest,
          services: guest.services.filter((_, idx) => idx !== serviceIndex)
        };
      }
      return guest;
    }));
  };

  const handleProceedToServices = () => {
    if (bookingGuests.length === 0) {
      toast.error('Please add at least one guest');
      return;
    }
    setGroupStep('services');
  };

  const handleBackToGuests = () => {
    setGroupStep('guests');
  };

  const handleSelectStaff = (staffId: string, staffName: string) => {
    if (!postedStaff.find(s => s.staffId === staffId)) {
      setPostedStaff([...postedStaff, {
        staffId,
        staffName,
        services: [],
        isExpanded: true,
        isRequested: false
      }]);
    }
    setActiveStaffId(staffId);
    setActiveTab('service');
  };

  const toggleStaffRequested = (staffId: string) => {
    setPostedStaff(postedStaff.map(staff =>
      staff.staffId === staffId
        ? { ...staff, isRequested: !staff.isRequested }
        : staff
    ));
  };

  const calculateServiceTimes = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);
    const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
    return { startTime, endTime };
  };

  const getNextAvailableStartTime = (staffId: string): string => {
    const staff = postedStaff.find(s => s.staffId === staffId);
    if (!staff || staff.services.length === 0) {
      return defaultStartTime;
    }
    if (timeMode === 'parallel') {
      return defaultStartTime;
    }
    const lastService = staff.services[staff.services.length - 1];
    return lastService.endTime;
  };

  const handleAddServiceToStaff = (service: Service) => {
    if (!activeStaffId) {
      // Guide user to select staff first
      setActiveTab('staff');
      return;
    }

    // GROUP MODE: Add service to active guest
    if (bookingMode === 'group' && groupStep === 'services' && activeGuestId) {
      if (!activeStaffName) {
        // This shouldn't happen, but safeguard against null staff name
        console.error('Staff name is missing');
        return;
      }
      handleAddServiceToGuest(activeGuestId, service, activeStaffId, activeStaffName);
      setJustAddedService(service.id);
      setTimeout(() => setJustAddedService(null), 1500);
      return;
    }

    // INDIVIDUAL MODE: Add service to staff (original behavior)
    const startTime = getNextAvailableStartTime(activeStaffId);
    const { endTime } = calculateServiceTimes(startTime, service.duration);
    const serviceWithTime: ServiceWithTime = {
      ...service,
      startTime,
      endTime
    };
    setPostedStaff(postedStaff.map(staff =>
      staff.staffId === activeStaffId
        ? { ...staff, services: [...staff.services, serviceWithTime], isExpanded: true }
        : staff
    ));
    setJustAddedService(service.id);
  };

  const handleRemoveService = (staffId: string, serviceId: string) => {
    setPostedStaff(postedStaff.map(staff =>
      staff.staffId === staffId
        ? { ...staff, services: staff.services.filter(s => s.id !== serviceId) }
        : staff
    ).filter(staff => staff.services.length > 0 || staff.staffId === activeStaffId));
  };

  const handleRemoveStaff = (staffId: string) => {
    setPostedStaff(postedStaff.filter(s => s.staffId !== staffId));
    if (activeStaffId === staffId) {
      setActiveStaffId(postedStaff[0]?.staffId || null);
    }
  };

  const toggleStaffExpanded = (staffId: string) => {
    setPostedStaff(postedStaff.map(staff =>
      staff.staffId === staffId
        ? { ...staff, isExpanded: !staff.isExpanded }
        : staff
    ));
  };

  const handleUpdateServiceTime = (staffId: string, serviceId: string, newStartTime: string) => {
    setPostedStaff(postedStaff.map(staff => {
      if (staff.staffId !== staffId) return staff;
      return {
        ...staff,
        services: staff.services.map(svc => {
          if (svc.id !== serviceId) return svc;
          const { endTime } = calculateServiceTimes(newStartTime, svc.duration);
          return { ...svc, startTime: newStartTime, endTime };
        })
      };
    }));
  };

  const handleChangeView = (newView: 'slide' | 'fullpage') => {
    setView(newView);
    setShowViewMenu(false);
  };

  const handleSetDefaultView = (viewToSave: 'slide' | 'fullpage') => {
    localStorage.setItem('appointmentModalDefaultView', viewToSave);
    setView(viewToSave);
    setShowViewMenu(false);
  };

  const handleBook = async () => {
    console.log('🚀 handleBook called - canBook:', canBook, 'isBooking:', isBooking);
    if (!canBook || isBooking) return;
    setIsBooking(true);

    // Create appointments for each client and staff combination
    const appointments = selectedClients.flatMap(client =>
      postedStaff
        .filter(s => s.services.length > 0)
        .map(staff => {
          const sortedServices = [...staff.services].sort((a, b) =>
            a.startTime.localeCompare(b.startTime)
          );
          const firstService = sortedServices[0];
          const lastService = sortedServices[sortedServices.length - 1];
          const [startHours, startMinutes] = firstService.startTime.split(':').map(Number);
          const scheduledStartTime = new Date(date);
          scheduledStartTime.setHours(startHours, startMinutes, 0, 0);
          const [endHours, endMinutes] = lastService.endTime.split(':').map(Number);
          const scheduledEndTime = new Date(date);
          scheduledEndTime.setHours(endHours, endMinutes, 0, 0);
          const staffTotalDuration = staff.services.reduce((sum, svc) => sum + svc.duration, 0);
          const staffTotalPrice = staff.services.reduce((sum, svc) => sum + svc.price, 0);
          const services = staff.services.map(svc => ({
            id: svc.id,
            serviceName: svc.name,
            category: svc.category,
            duration: svc.duration,
            price: svc.price,
            staffId: staff.staffId,
          }));
          return {
            clientId: client.id,
            clientName: client.name,
            partySize: partySize,
            namedClients: selectedClients.map(c => ({ id: c.id, name: c.name, phone: c.phone })),
            staffId: staff.staffId,
            staffRequested: staff.isRequested || false,
            scheduledStartTime,
            scheduledEndTime,
            services,
            duration: staffTotalDuration,
            totalPrice: staffTotalPrice,
            notes: appointmentNotes,
            source: 'admin-portal',
          };
        })
    );

    console.log('📋 Appointments to save:', appointments.length, appointments);
    console.log('💾 onSave function:', onSave ? 'exists' : 'missing');

    try {
      for (const appointment of appointments) {
        console.log('➡️ Calling onSave for appointment:', appointment);
        await onSave?.(appointment as any);
      }
      console.log('✅ All appointments saved successfully');
      onClose();
    } catch (error) {
      console.error('❌ Error saving appointments:', error);
      toast.error(`Failed to save appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsBooking(false);
    }
  };

  // RENDER
  if (!isOpen) return null;

  // Minimized widget
  if (isMinimized) {
    const totalServices = postedStaff.reduce((sum, staff) => sum + staff.services.length, 0);
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-24 right-6 z-[70] bg-white/95 backdrop-blur-xl rounded-2xl shadow-premium-xl p-5 cursor-pointer hover:shadow-premium-2xl transition-all hover:scale-[1.02] w-80 animate-slide-in-up border border-gray-200/50"
      >
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-500 rounded-full animate-pulse" />
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shrink-0 shadow-premium-md">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-base truncate mb-0.5">
                  {selectedClients.length > 0
                    ? partySize > 1
                      ? `${selectedClients[0].name} + ${partySize - 1} more`
                      : selectedClients[0].name
                    : 'New Appointment'}
                </p>
                <p className="text-xs text-gray-500">
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors -mt-1"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4 text-gray-400" />
                <span>{partySize} {partySize === 1 ? 'person' : 'people'}</span>
                <span className="text-gray-300">•</span>
                <span>{postedStaff.length} staff</span>
                <span className="text-gray-300">•</span>
                <span>{totalServices} svc</span>
              </div>
              {totalDuration > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{totalDuration}min</span>
                  </div>
                  <span className="font-semibold text-gray-900">${totalPrice}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const modalClasses = cn(
    'fixed bg-white/95 backdrop-blur-xl z-[70] flex flex-col border',
    view === 'slide'
      // Mobile: full screen, Desktop: slide panel
      ? 'right-0 top-0 bottom-0 left-0 sm:left-auto w-full sm:w-[90vw] sm:max-w-6xl shadow-premium-3xl border-l-0 sm:border-l border-gray-200/50'
      // Mobile: full screen, Desktop: centered modal with padding
      : 'inset-0 sm:inset-6 rounded-none sm:rounded-3xl shadow-premium-3xl border-gray-200/50'
  );

  return (
    <>
      {/* Backdrop with fade-in */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-md z-[60]"
        onClick={onClose}
        style={{
          animation: 'fadeIn 300ms ease-out'
        }}
      />

      {/* Modal with slide/scale entrance */}
      <div
        className={modalClasses}
        style={{
          animation: view === 'slide'
            ? 'slideInRight 400ms cubic-bezier(0.4, 0.0, 0.2, 1)'
            : 'scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Header - Premium glass */}
        <div className="flex items-center justify-between px-8 py-5 shrink-0 border-b border-gray-200/50 bg-white/50">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-900">New Appointment</h2>
            {/* Quick Date Display */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{defaultStartTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative" ref={viewMenuRef}>
              <button
                onClick={() => setShowViewMenu(!showViewMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="View options"
              >
                <LayoutPanelLeft className="w-5 h-5 text-gray-500" />
              </button>
              {showViewMenu && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-premium-lg z-10 overflow-hidden animate-scale-in">
                  <div className="p-1.5">
                    <button
                      onClick={() => handleChangeView('slide')}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm rounded-xl flex items-center gap-2.5 transition-all',
                        view === 'slide'
                          ? 'bg-brand-50 text-brand-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <PanelRightClose className="w-4 h-4" />
                      <span className="flex-1">Side Panel</span>
                      {view === 'slide' && <Check className="w-4 h-4 text-brand-600" />}
                    </button>
                    <button
                      onClick={() => handleChangeView('fullpage')}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm rounded-xl flex items-center gap-2.5 transition-all',
                        view === 'fullpage'
                          ? 'bg-brand-50 text-brand-900 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <Maximize className="w-4 h-4" />
                      <span className="flex-1">Full Page</span>
                      {view === 'fullpage' && <Check className="w-4 h-4 text-brand-600" />}
                    </button>
                  </div>
                  <div className="border-t border-gray-100 p-1.5">
                    <button
                      onClick={() => handleSetDefaultView('slide')}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock Side Panel</span>
                    </button>
                    <button
                      onClick={() => handleSetDefaultView('fullpage')}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl flex items-center gap-2.5 transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Lock Full Page</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Minimize"
            >
              <ArrowDownToLine className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body: 2-Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT COLUMN - CLIENT SELECTION */}
          <div className="w-1/2 flex flex-col relative">
            {/* Booking Mode Selector - Minimal */}
            {selectedClients.length === 0 && !isAddingAnotherClient && (
              <div className="px-6 pt-4 pb-2">
                <div className="inline-flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => {
                      setBookingMode('individual');
                      setPartySize(1);
                      // Clean up group booking data when switching to individual
                      setBookingGuests([]);
                      setGroupStep('guests');
                      setActiveGuestId(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      bookingMode === 'individual'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Individual
                  </button>
                  <button
                    onClick={() => {
                      setBookingMode('group');
                      if (partySize === 1) setPartySize(2);
                      // Clean up individual booking data when switching to group
                      setSelectedClients([]);
                      setPostedStaff([]);
                      setActiveStaffId(null);
                    }}
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
            <div className="relative z-30 p-6 border-b border-gray-100 bg-gradient-to-br from-teal-50/30 via-white to-white">
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
                      className="w-full pl-11 pr-4 py-2.5 text-sm bg-white border-2 border-teal-200 rounded-lg focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-brand-500/10 transition-all placeholder:text-gray-400 shadow-sm shadow-teal-500/5"
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
                    <div className="bg-white border-2 border-teal-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {selectedClients[0].name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{selectedClients[0].name}</p>
                          {selectedClients[0].phone && (
                            <p className="text-xs text-gray-600">{selectedClients[0].phone}</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedClients([]);
                            setClientSearch('');
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Group Mode - NEW FLOW */}
                  {bookingMode === 'group' && (
                    <div className="space-y-3">
                      {/* Step Indicator */}
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <div className={`flex items-center gap-1 ${groupStep === 'guests' ? 'text-brand-600 font-semibold' : 'text-gray-400'}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${groupStep === 'guests' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>
                            1
                          </div>
                          <span>Guests</span>
                        </div>
                        <div className="w-8 h-px bg-gray-300" />
                        <div className={`flex items-center gap-1 ${groupStep === 'services' ? 'text-brand-600 font-semibold' : 'text-gray-400'}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${groupStep === 'services' ? 'bg-brand-600 text-white' : 'bg-gray-200'}`}>
                            2
                          </div>
                          <span>Services</span>
                        </div>
                      </div>

                      {/* Step 1: Build Guest List */}
                      {groupStep === 'guests' && (
                        <>
                          {/* Guest List */}
                          {bookingGuests.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Group Members ({bookingGuests.length})
                              </p>
                              {bookingGuests.map((guest, index) => (
                                <div key={guest.id} className="flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
                                      <span className="text-white font-semibold text-xs">
                                        {guest.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900 text-sm">
                                        {guest.name}
                                        {index === 0 && <span className="ml-1.5 text-[10px] bg-teal-100 text-brand-700 px-1.5 py-0.5 rounded">Main</span>}
                                      </p>
                                      <p className="text-[10px] text-gray-500">
                                        {guest.services.length} service{guest.services.length !== 1 ? 's' : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveGuest(guest.id)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                    disabled={index === 0} // Can't remove main guest
                                  >
                                    <X className={`w-3.5 h-3.5 ${index === 0 ? 'text-gray-300' : 'text-gray-500'}`} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add Guest Buttons */}
                          <div className="space-y-2">
                            <button
                              onClick={() => {
                                setIsAddingAnotherClient(true);
                                setClientSearch('');
                                setTimeout(() => clientSearchRef.current?.focus(), 100);
                              }}
                              className="w-full px-3 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              {bookingGuests.length === 0 ? 'Add Main Guest (Required)' : 'Add Named Guest'}
                            </button>

                            {bookingGuests.length > 0 && (
                              <button
                                onClick={handleAddUnnamedGuest}
                                className="w-full px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Guest Slot (No Name)
                              </button>
                            )}
                          </div>

                          {/* Proceed Button */}
                          {bookingGuests.length > 0 && (
                            <button
                              onClick={handleProceedToServices}
                              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-colors shadow-md"
                            >
                              Proceed to Services →
                            </button>
                          )}
                        </>
                      )}

                      {/* Step 2: Assign Services */}
                      {groupStep === 'services' && (
                        <div className="space-y-3">
                          <button
                            onClick={handleBackToGuests}
                            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                          >
                            ← Back to Guests
                          </button>

                          {/* Guest Selection for Service Assignment */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Select Guest to Add Services ({bookingGuests.length})
                            </p>
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                              {bookingGuests.map((guest, index) => (
                                <button
                                  key={guest.id}
                                  onClick={() => setActiveGuestId(activeGuestId === guest.id ? null : guest.id)}
                                  className={cn(
                                    "w-full flex items-center justify-between p-2.5 rounded-lg transition-all border-2",
                                    activeGuestId === guest.id
                                      ? "bg-brand-50 border-brand-500 shadow-sm"
                                      : "bg-white border-gray-200 hover:border-brand-300 hover:bg-brand-50/50"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold",
                                      activeGuestId === guest.id ? "bg-brand-600" : "bg-gray-400"
                                    )}>
                                      {guest.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                      <p className="font-semibold text-gray-900 text-xs leading-tight">
                                        {guest.name}
                                        {index === 0 && <span className="ml-1 text-[9px] bg-teal-100 text-brand-700 px-1 py-0.5 rounded">Main</span>}
                                      </p>
                                      <p className="text-[10px] text-gray-500">
                                        {guest.services.length} service{guest.services.length !== 1 ? 's' : ''}
                                        {guest.services.length > 0 && ` • $${guest.services.reduce((sum, s) => sum + s.price, 0).toFixed(2)}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    activeGuestId === guest.id
                                      ? "border-teal-600 bg-brand-600"
                                      : "border-gray-300"
                                  )}>
                                    {activeGuestId === guest.id && (
                                      <CheckCircle2 className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Active Guest Services Display */}
                          {activeGuestId && (
                            <div className="bg-brand-50 border-2 border-teal-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-brand-900 uppercase tracking-wide">
                                  {bookingGuests.find(g => g.id === activeGuestId)?.name}'s Services
                                </p>
                                <span className="text-[10px] bg-brand-600 text-white px-2 py-0.5 rounded-full font-semibold">
                                  {bookingGuests.find(g => g.id === activeGuestId)?.services.length || 0}
                                </span>
                              </div>
                              {bookingGuests.find(g => g.id === activeGuestId)?.services.length === 0 ? (
                                <p className="text-xs text-brand-700">No services added yet. Use tabs below to add services.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {bookingGuests.find(g => g.id === activeGuestId)?.services.map((service, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white rounded p-2 text-xs">
                                      <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{service.serviceName}</p>
                                        <p className="text-[10px] text-gray-500">
                                          {service.staffName} • {service.duration} min • ${service.price.toFixed(2)}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => handleRemoveServiceFromGuest(activeGuestId, idx)}
                                        className="p-1 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <X className="w-3 h-3 text-red-500" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Instructions when no guest selected */}
                          {!activeGuestId && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <p className="text-xs text-amber-800">
                                👆 Select a guest above to add services and assign staff
                              </p>
                            </div>
                          )}

                          {/* Summary & Book Button */}
                          <div className="pt-2 space-y-2 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Total Guests:</span>
                              <span className="font-semibold text-gray-900">{bookingGuests.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Total Services:</span>
                              <span className="font-semibold text-gray-900">
                                {bookingGuests.reduce((sum, g) => sum + g.services.length, 0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-gray-900">Total Amount:</span>
                              <span className="font-bold text-brand-600 text-lg">
                                ${bookingGuests.reduce((sum, g) => sum + g.services.reduce((s, svc) => s + svc.price, 0), 0).toFixed(2)}
                              </span>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  // Create appointments for each guest
                                  const appointments = bookingGuests.map(guest => {
                                    const totalDuration = guest.services.reduce((sum, svc) => sum + svc.duration, 0);
                                    const totalPrice = guest.services.reduce((sum, svc) => sum + svc.price, 0);

                                    // Parse start time from guest or use default
                                    const [startHour, startMinute] = (guest.startTime || defaultStartTime).split(':').map(Number);
                                    const scheduledStartTime = new Date(date);
                                    scheduledStartTime.setHours(startHour, startMinute, 0, 0);

                                    const scheduledEndTime = new Date(scheduledStartTime);
                                    scheduledEndTime.setMinutes(scheduledEndTime.getMinutes() + totalDuration);

                                    return {
                                      clientId: guest.clientId || `walk-in-${Date.now()}-${Math.random()}`,
                                      clientName: guest.name,
                                      clientPhone: guest.phone || '',
                                      partySize: bookingGuests.length,
                                      namedClients: bookingGuests.map(g => ({
                                        id: g.clientId || `guest-${g.name}`,
                                        name: g.name,
                                        phone: g.phone || ''
                                      })),
                                      staffId: guest.services[0]?.staffId || 'any-available',
                                      staffRequested: true,
                                      scheduledStartTime,
                                      scheduledEndTime,
                                      services: guest.services.map(svc => ({
                                        id: svc.serviceId,
                                        serviceName: svc.serviceName,
                                        category: svc.serviceCategory,
                                        duration: svc.duration,
                                        price: svc.price,
                                        staffId: svc.staffId,
                                        staffName: svc.staffName
                                      })),
                                      duration: totalDuration,
                                      totalPrice,
                                      notes: appointmentNotes || `Group booking for ${bookingGuests.length} people`,
                                      source: 'admin-portal',
                                      status: 'scheduled',
                                      isGroupBooking: true,
                                      groupId: `group-${Date.now()}`
                                    };
                                  });

                                  // Save each appointment
                                  for (const appointment of appointments) {
                                    await onSave?.(appointment as any);
                                  }

                                  console.log('Group booking created successfully:', appointments.length, 'appointments');
                                  onClose();
                                } catch (error) {
                                  console.error('Error saving group booking:', error);
                                  toast.error(`Failed to save group booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                }
                              }}
                              disabled={bookingGuests.reduce((sum, g) => sum + g.services.length, 0) === 0}
                              className="w-full px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-colors shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
                            >
                              Book Group Appointment
                            </button>
                          </div>
                        </div>
                      )}
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
                    className="w-full px-4 py-3 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Client
                  </button>

                  {/* Skip & Add as Walk-in - only show if no clients yet */}
                  {selectedClients.length === 0 && (
                    <button
                      onClick={() => {
                        setSelectedClients([{ id: 'walk-in', name: 'Walk-in', phone: '' }]);
                        setClientSearch('');
                      }}
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
                            onClick={() => bookingMode === 'group' ? handleAddNamedGuest(client) : handleSelectClient(client)}
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
                          onClick={() => bookingMode === 'group' ? handleAddNamedGuest(client) : handleSelectClient(client)}
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
                        onBlur={() => {
                          const error = getNameError(newClientFirstName, 'First name');
                          if (error) setValidationErrors({ ...validationErrors, firstName: error });
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
                        onBlur={() => {
                          const error = getNameError(newClientLastName, 'Last name');
                          if (error) setValidationErrors({ ...validationErrors, lastName: error });
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
                        onBlur={() => {
                          const error = getPhoneError(newClientPhone);
                          if (error) setValidationErrors({ ...validationErrors, phone: error });
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

                    {/* Email Field */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Email <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        id="client-email"
                        type="email"
                        value={newClientEmail}
                        onChange={(e) => {
                          setNewClientEmail(e.target.value.toLowerCase());
                          setValidationErrors({ ...validationErrors, email: undefined });
                        }}
                        onBlur={() => {
                          if (newClientEmail.trim()) {
                            const error = getEmailError(newClientEmail);
                            if (error) setValidationErrors({ ...validationErrors, email: error });
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

                    <button
                      onClick={handleAddNewClient}
                      disabled={
                        !newClientFirstName.trim() ||
                        !newClientLastName.trim() ||
                        !newClientPhone.trim() ||
                        Object.values(validationErrors).some(v => v !== undefined) ||
                        isAddingClient
                      }
                      className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

            {/* Tabs - COMPACT & MODERN */}
            <div className="relative z-10 px-5 pt-4 pb-3 bg-white">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveTab('service')}
                  className={cn(
                    'flex-1 px-3.5 py-2 text-sm font-medium rounded-lg transition-all relative overflow-hidden',
                    activeTab === 'service'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  {activeTab === 'service' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800" />
                  )}
                  <span className="relative">Services</span>
                </button>
                <button
                  onClick={() => setActiveTab('staff')}
                  className={cn(
                    'flex-1 px-3.5 py-2 text-sm font-medium rounded-lg transition-all relative overflow-hidden',
                    activeTab === 'staff'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  {activeTab === 'staff' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800" />
                  )}
                  <span className="relative">Staff</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-5 bg-white">
              {activeTab === 'service' ? (
                <div className="space-y-3">
                  {activeStaffName && (
                    <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <p className="text-xs text-amber-900 flex-1">
                        {bookingMode === 'group' && groupStep === 'services' && activeGuestId ? (
                          <>
                            Adding to: <span className="font-semibold">{bookingGuests.find(g => g.id === activeGuestId)?.name}</span>
                            <span className="text-amber-700"> with {activeStaffName}</span>
                          </>
                        ) : (
                          <>
                            Adding to: <span className="font-semibold">{activeStaffName}</span>
                          </>
                        )}
                      </p>
                    </div>
                  )}
                  {!activeStaffId && (
                    <div className="px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-900 font-medium">Select a staff member first</p>
                        <button
                          onClick={() => setActiveTab('staff')}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 hover:underline"
                        >
                          Go to Staff tab →
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Search + Categories Combined */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search services..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white"
                      />
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            'px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all',
                            selectedCategory === cat
                              ? 'bg-gray-900 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Service Grid - 3 columns, optimized */}
                  {bookingMode === 'group' && groupStep === 'services' && !activeGuestId ? (
                    // Group mode: No guest selected
                    <div className="text-center py-12">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
                        <User className="w-7 h-7 text-amber-600" />
                      </div>
                      <p className="text-sm text-gray-700 mb-2 font-medium">Select a guest first</p>
                      <p className="text-xs text-gray-500">Choose which guest to add services for</p>
                    </div>
                  ) : activeStaffId ? (
                    <div className="grid grid-cols-3 gap-2">
                      {filteredServices.map(service => (
                        <button
                          key={service.id}
                          onClick={() => handleAddServiceToStaff(service)}
                          className={cn(
                            'text-left p-2.5 rounded-lg transition-all text-xs relative overflow-hidden group',
                            'bg-white border border-gray-200 hover:border-brand-500 hover:shadow-md hover:scale-[1.03] active:scale-[0.97]',
                            justAddedService === service.id && 'ring-2 ring-brand-500 border-brand-500'
                          )}
                        >
                          {justAddedService === service.id && (
                            <div className="absolute top-1 right-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                            </div>
                          )}
                          <p className="font-medium text-gray-900 mb-1.5 line-clamp-2 leading-tight pr-4">{service.name}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">{service.duration}m</span>
                            <span className="font-bold text-gray-900">${service.price}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">Select a staff member first</p>
                      <button
                        onClick={() => setActiveTab('staff')}
                        className="text-sm text-brand-600 font-medium hover:underline"
                      >
                        Go to Staff →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {allStaffFromRedux.map(staff => (
                    <button
                      key={staff.id}
                      onClick={() => handleSelectStaff(staff.id, staff.name)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group',
                        activeStaffId === staff.id
                          ? 'bg-brand-50 border-2 border-brand-500 shadow-sm'
                          : 'bg-white border border-gray-200 hover:border-brand-300 hover:shadow-sm hover:scale-[1.01]'
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold shadow-sm transition-all",
                        activeStaffId === staff.id
                          ? "bg-gradient-to-br from-brand-500 to-brand-600"
                          : "bg-gradient-to-br from-gray-400 to-gray-500 group-hover:from-teal-400 group-hover:to-teal-500"
                      )}>
                        {staff.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{staff.name}</p>
                        {activeStaffId === staff.id ? (
                          <p className="text-xs text-brand-600 font-medium mt-0.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Selected
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-0.5 group-hover:text-brand-600 transition-colors">
                            Click to select
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-1/2 flex flex-col border-l border-gray-100 bg-gray-50/30">
            {(bookingMode === 'individual' && selectedClients.length === 0) || (bookingMode === 'group' && bookingGuests.length === 0) ? (
              /* Message when no client selected */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-brand-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {bookingMode === 'group' ? 'Step 1: Add Guests' : 'Step 1: Choose Client'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {bookingMode === 'group'
                      ? 'Add guests to your group booking to continue'
                      : 'Select an existing client, add a new one, or skip to walk-in to continue'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Date & Time - COMPACT & FUNCTIONAL */}
                <div className="p-5 border-b border-gray-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date</label>
                  <input
                    type="date"
                    value={date.toISOString().split('T')[0]}
                    onChange={(e) => setDate(new Date(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Time</label>
                  <input
                    type="time"
                    value={defaultStartTime}
                    onChange={(e) => setDefaultStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>
              {/* Sequential/Parallel - ULTRA MINIMAL */}
              <div className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg">
                <span className="text-xs text-gray-600">Service timing</span>
                <button
                  onClick={() => setTimeMode(timeMode === 'sequential' ? 'parallel' : 'sequential')}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-all"
                  title={timeMode === 'sequential' ? 'Sequential: One after another' : 'Parallel: All at same time'}
                >
                  {timeMode === 'sequential' ? <Zap className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                  <span className="capitalize">{timeMode}</span>
                </button>
              </div>
            </div>

            {/* Appointment Notes */}
            <div className="p-5 border-b border-gray-100">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Notes / Special Requests
              </label>
              <textarea
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
                placeholder="Any special requests, preferences, or important notes..."
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
              />
            </div>

            {/* Posted Services - MAIN FOCUS AREA */}
            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
                <span>Appointment Summary</span>
                {postedStaff.length > 0 && (
                  <span className="text-xs font-normal text-gray-500">
                    {postedStaff.reduce((sum, s) => sum + s.services.length, 0)} service{postedStaff.reduce((sum, s) => sum + s.services.length, 0) !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              {postedStaff.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">No services added yet</p>
                  <p className="text-xs text-gray-400">Select a staff member and add services</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {postedStaff.map(staff => (
                    <div
                      key={staff.staffId}
                      className={cn(
                        'rounded-lg overflow-hidden border transition-all',
                        activeStaffId === staff.staffId
                          ? 'border-brand-500 shadow-sm ring-1 ring-brand-500/20'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-between p-3 cursor-pointer transition-all',
                          activeStaffId === staff.staffId ? 'bg-brand-50/50' : 'bg-white hover:bg-gray-50'
                        )}
                        onClick={() => toggleStaffExpanded(staff.staffId)}
                      >
                        <div className="flex items-center gap-2.5 flex-1">
                          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-teal-400 to-brand-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                            {staff.staffName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 text-sm truncate">{staff.staffName}</p>
                              {staff.isRequested && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium text-brand-700 bg-teal-100 rounded">
                                  Requested
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {staff.services.length} svc{staff.services.length > 0 && ` • ${staff.services.reduce((sum, s) => sum + s.duration, 0)}m • $${staff.services.reduce((sum, s) => sum + s.price, 0)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveStaff(staff.staffId);
                            }}
                            className="p-1.5 rounded-md hover:bg-red-50 transition-all"
                            title="Remove staff"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                          {staff.isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      {staff.isExpanded && (
                        <div className="px-3 pb-2 pt-1">
                          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                            <input
                              type="checkbox"
                              checked={staff.isRequested || false}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleStaffRequested(staff.staffId);
                              }}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-brand-600 focus:ring-2 focus:ring-brand-500/20"
                            />
                            <span>Client requested this staff</span>
                          </label>
                        </div>
                      )}
                      {staff.isExpanded && staff.services.length > 0 && (
                        <div className="p-2.5 space-y-1.5 bg-gray-50/50">
                          {staff.services.map(service => (
                            <div
                              key={service.id}
                              className="flex items-center justify-between p-2.5 bg-white rounded-md border border-gray-100 hover:border-gray-200 transition-all group"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-xs mb-1 truncate">{service.name}</p>
                                <div className="flex items-center gap-2.5 text-xs">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <input
                                      type="time"
                                      value={service.startTime}
                                      onChange={(e) => handleUpdateServiceTime(staff.staffId, service.id, e.target.value)}
                                      className="text-xs text-gray-700 border-0 p-0 bg-transparent focus:ring-0 w-14 font-medium hover:text-brand-600 cursor-pointer"
                                    />
                                  </div>
                                  <span className="text-gray-400">{service.duration}m</span>
                                  <span className="font-bold text-gray-900">${service.price}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveService(staff.staffId, service.id)}
                                className="p-1 hover:bg-red-50 rounded transition-all ml-2 opacity-0 group-hover:opacity-100"
                                title="Remove service"
                              >
                                <X className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setActiveTab('staff')}
                    className="w-full py-2.5 text-sm font-medium text-gray-600 bg-white border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-teal-400 hover:text-brand-600 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Staff
                  </button>
                </div>
              )}
            </div>

            {/* Actions - PROMINENT & CLEAR */}
            <div className="p-5 border-t border-gray-200 space-y-3 bg-white">
              {postedStaff.some(s => s.services.length > 0) && (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Total</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{totalDuration} minutes</div>
                      <div className="font-bold text-gray-900 text-xl">${totalPrice}</div>
                    </div>
                  </div>
                </div>
              )}

              {validationMessage && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-900">{validationMessage}</p>
                </div>
              )}

              <div className="flex gap-2.5">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBook}
                  disabled={!canBook || isBooking}
                  className={cn(
                    'flex-1 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all relative overflow-hidden',
                    canBook && !isBooking
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-teal-600 hover:to-teal-700 shadow-md shadow-teal-500/25 hover:shadow-lg hover:shadow-teal-500/35 active:scale-[0.98]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {isBooking ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Booking...
                    </span>
                  ) : (
                    'Book Appointment'
                  )}
                </button>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
