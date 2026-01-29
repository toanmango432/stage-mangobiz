/**
 * Hook for managing appointment form state
 * Extracted from NewAppointmentModal.v2.tsx
 */

import { useState, useMemo, useRef, RefObject } from 'react';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

/**
 * Embedded variant info for booking UI display
 */
interface BookingVariant {
  id: string;
  name: string;
  duration: number;
  price: number;
  isDefault?: boolean;
}

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  /** Whether this service has variants */
  hasVariants?: boolean;
  /** Embedded variants for services with hasVariants=true */
  variants?: BookingVariant[];
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
  isRequested?: boolean;
}

interface BookingGuest {
  id: string;
  name: string;
  isNamed: boolean;
  clientId?: string;
  phone?: string;
  startTime?: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
    serviceCategory: string;
    duration: number;
    price: number;
    staffId: string;
    staffName: string;
    startTime: string;
    endTime: string;
  }>;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface UseAppointmentFormOptions {
  selectedDate?: Date;
  selectedTime?: Date;
  selectedStaffId?: string;
  viewMode?: 'slide' | 'fullpage';
}

export interface UseAppointmentFormReturn {
  // View state
  view: 'slide' | 'fullpage';
  setView: (view: 'slide' | 'fullpage') => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  showViewMenu: boolean;
  setShowViewMenu: (show: boolean) => void;
  viewMenuRef: RefObject<HTMLDivElement>;
  clientSearchRef: RefObject<HTMLInputElement>;

  // Tab state
  activeTab: 'service' | 'staff';
  setActiveTab: (tab: 'service' | 'staff') => void;

  // Client state
  selectedClients: Client[];
  setSelectedClients: (clients: Client[]) => void;
  clientSearch: string;
  setClientSearch: (search: string) => void;
  showAddNewForm: boolean;
  setShowAddNewForm: (show: boolean) => void;
  isAddingAnotherClient: boolean;
  setIsAddingAnotherClient: (adding: boolean) => void;
  recentClients: Client[];
  setRecentClients: (clients: Client[]) => void;

  // New client form state
  newClientFirstName: string;
  setNewClientFirstName: (name: string) => void;
  newClientLastName: string;
  setNewClientLastName: (name: string) => void;
  newClientPhone: string;
  setNewClientPhone: (phone: string) => void;
  newClientEmail: string;
  setNewClientEmail: (email: string) => void;
  validationErrors: ValidationErrors;
  setValidationErrors: (errors: ValidationErrors) => void;
  isAddingClient: boolean;
  setIsAddingClient: (adding: boolean) => void;

  // Booking mode
  bookingMode: 'individual' | 'group';
  setBookingMode: (mode: 'individual' | 'group') => void;
  partySize: number;
  setPartySize: (size: number) => void;
  appointmentNotes: string;
  setAppointmentNotes: (notes: string) => void;

  // Group booking state
  bookingGuests: BookingGuest[];
  setBookingGuests: (guests: BookingGuest[]) => void;
  groupStep: 'guests' | 'services';
  setGroupStep: (step: 'guests' | 'services') => void;
  activeGuestId: string | null;
  setActiveGuestId: (id: string | null) => void;

  // Service state
  serviceSearch: string;
  setServiceSearch: (search: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  services: Service[];
  setServices: (services: Service[]) => void;
  searching: boolean;
  setSearching: (searching: boolean) => void;
  clients: Client[];
  setClients: (clients: Client[]) => void;

  // Date/Time state
  date: Date;
  setDate: (date: Date) => void;
  defaultStartTime: string;
  setDefaultStartTime: (time: string) => void;
  timeMode: 'sequential' | 'parallel';
  setTimeMode: (mode: 'sequential' | 'parallel') => void;

  // Staff state
  postedStaff: StaffWithServices[];
  setPostedStaff: (staff: StaffWithServices[]) => void;
  activeStaffId: string | null;
  setActiveStaffId: (id: string | null) => void;

  // Booking state
  isBooking: boolean;
  setIsBooking: (booking: boolean) => void;
  justAddedService: string | null;
  setJustAddedService: (id: string | null) => void;

  // Computed values
  categories: string[];
  filteredServices: Service[];
  totalDuration: number;
  totalPrice: number;
  canBook: boolean;
  activeStaffName: string | null;
  validationMessage: string | null;

  // Reset function
  resetForm: () => void;
}

export function useAppointmentForm(options: UseAppointmentFormOptions): UseAppointmentFormReturn {
  const { selectedDate, selectedTime, selectedStaffId, viewMode = 'slide' } = options;

  // Refs
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const clientSearchRef = useRef<HTMLInputElement>(null);

  // View state
  const [view, setView] = useState<'slide' | 'fullpage'>(() => {
    const savedDefault = localStorage.getItem('appointmentModalDefaultView') as 'slide' | 'fullpage' | null;
    return savedDefault || viewMode;
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'service' | 'staff'>('service');

  // Client state
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showAddNewForm, setShowAddNewForm] = useState(false);
  const [isAddingAnotherClient, setIsAddingAnotherClient] = useState(false);
  const [recentClients, setRecentClients] = useState<Client[]>([]);

  // New client form state
  const [newClientFirstName, setNewClientFirstName] = useState('');
  const [newClientLastName, setNewClientLastName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isAddingClient, setIsAddingClient] = useState(false);

  // Booking mode
  const [bookingMode, setBookingMode] = useState<'individual' | 'group'>('individual');
  const [partySize, setPartySize] = useState(1);
  const [appointmentNotes, setAppointmentNotes] = useState('');

  // Group booking state
  const [bookingGuests, setBookingGuests] = useState<BookingGuest[]>([]);
  const [groupStep, setGroupStep] = useState<'guests' | 'services'>('guests');
  const [activeGuestId, setActiveGuestId] = useState<string | null>(null);

  // Service state
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [services, setServices] = useState<Service[]>([]);
  const [searching, setSearching] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  // Date/Time state
  const [date, setDate] = useState<Date>(selectedDate || new Date());
  const [defaultStartTime, setDefaultStartTime] = useState<string>(
    selectedTime ? selectedTime.toTimeString().slice(0, 5) : '10:00'
  );
  const [timeMode, setTimeMode] = useState<'sequential' | 'parallel'>('sequential');

  // Staff state
  const [postedStaff, setPostedStaff] = useState<StaffWithServices[]>([]);
  const [activeStaffId, setActiveStaffId] = useState<string | null>(selectedStaffId || null);

  // Booking state
  const [isBooking, setIsBooking] = useState(false);
  const [justAddedService, setJustAddedService] = useState<string | null>(null);

  // Computed values
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

  // Reset function
  const resetForm = () => {
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
    setBookingGuests([]);
    setGroupStep('guests');
    setActiveGuestId(null);
    setValidationErrors({});
  };

  return {
    // View state
    view,
    setView,
    isMinimized,
    setIsMinimized,
    showViewMenu,
    setShowViewMenu,
    viewMenuRef,
    clientSearchRef,

    // Tab state
    activeTab,
    setActiveTab,

    // Client state
    selectedClients,
    setSelectedClients,
    clientSearch,
    setClientSearch,
    showAddNewForm,
    setShowAddNewForm,
    isAddingAnotherClient,
    setIsAddingAnotherClient,
    recentClients,
    setRecentClients,

    // New client form state
    newClientFirstName,
    setNewClientFirstName,
    newClientLastName,
    setNewClientLastName,
    newClientPhone,
    setNewClientPhone,
    newClientEmail,
    setNewClientEmail,
    validationErrors,
    setValidationErrors,
    isAddingClient,
    setIsAddingClient,

    // Booking mode
    bookingMode,
    setBookingMode,
    partySize,
    setPartySize,
    appointmentNotes,
    setAppointmentNotes,

    // Group booking state
    bookingGuests,
    setBookingGuests,
    groupStep,
    setGroupStep,
    activeGuestId,
    setActiveGuestId,

    // Service state
    serviceSearch,
    setServiceSearch,
    selectedCategory,
    setSelectedCategory,
    services,
    setServices,
    searching,
    setSearching,
    clients,
    setClients,

    // Date/Time state
    date,
    setDate,
    defaultStartTime,
    setDefaultStartTime,
    timeMode,
    setTimeMode,

    // Staff state
    postedStaff,
    setPostedStaff,
    activeStaffId,
    setActiveStaffId,

    // Booking state
    isBooking,
    setIsBooking,
    justAddedService,
    setJustAddedService,

    // Computed values
    categories,
    filteredServices,
    totalDuration,
    totalPrice,
    canBook,
    activeStaffName,
    validationMessage,

    // Reset function
    resetForm,
  };
}
