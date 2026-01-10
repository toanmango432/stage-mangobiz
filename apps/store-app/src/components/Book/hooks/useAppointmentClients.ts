/**
 * Hook for managing client-related logic in appointment modal
 * Extracted from NewAppointmentModal.v2.tsx
 */

import { useEffect, useCallback } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { clientsDB } from '../../../db/database';
import { Client as ClientType } from '../../../types/client';
import toast from 'react-hot-toast';
import {
  getNameError,
  getPhoneError,
  getEmailError,
  capitalizeName,
} from '../../../utils/validation';

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

export interface UseAppointmentClientsOptions {
  isOpen: boolean;
  storeId: string;
  clientSearch: string;
  selectedClients: Client[];
  bookingMode: 'individual' | 'group';
  partySize: number;
  bookingGuests: BookingGuest[];
  newClientFirstName: string;
  newClientLastName: string;
  newClientPhone: string;
  newClientEmail: string;
  validationErrors: ValidationErrors;
  activeStaffId: string | null;
  initialClient?: Client | null;

  // Setters
  setRecentClients: (clients: Client[]) => void;
  setClients: (clients: Client[]) => void;
  setSearching: (searching: boolean) => void;
  setSelectedClients: (clients: Client[]) => void;
  setPartySize: (size: number) => void;
  setClientSearch: (search: string) => void;
  setShowAddNewForm: (show: boolean) => void;
  setIsAddingAnotherClient: (adding: boolean) => void;
  setActiveTab: (tab: 'service' | 'staff') => void;
  setBookingGuests: (guests: BookingGuest[]) => void;
  setValidationErrors: (errors: ValidationErrors) => void;
  setIsAddingClient: (adding: boolean) => void;
  setNewClientFirstName: (name: string) => void;
  setNewClientLastName: (name: string) => void;
  setNewClientPhone: (phone: string) => void;
  setNewClientEmail: (email: string) => void;
  onInitialClientUsed?: () => void;
}

export interface UseAppointmentClientsReturn {
  debouncedSearch: string;
  handleSelectClient: (client: ClientType | Client) => void;
  handleAddNewClient: () => Promise<void>;
  handleAddNamedGuest: (client: ClientType | Client) => void;
  handleAddUnnamedGuest: () => void;
  handleRemoveGuest: (guestId: string) => void;
  validateClientForm: () => boolean;
}

export function useAppointmentClients(options: UseAppointmentClientsOptions): UseAppointmentClientsReturn {
  const {
    isOpen,
    storeId,
    clientSearch,
    selectedClients,
    bookingMode,
    partySize,
    bookingGuests,
    newClientFirstName,
    newClientLastName,
    newClientPhone,
    newClientEmail,
    validationErrors,
    activeStaffId,
    initialClient,
    setRecentClients,
    setClients,
    setSearching,
    setSelectedClients,
    setPartySize,
    setClientSearch,
    setShowAddNewForm,
    setIsAddingAnotherClient,
    setActiveTab,
    setBookingGuests,
    setValidationErrors,
    setIsAddingClient,
    setNewClientFirstName,
    setNewClientLastName,
    setNewClientPhone,
    setNewClientEmail,
    onInitialClientUsed,
  } = options;

  const debouncedSearch = useDebounce(clientSearch, 300);

  // Load recent clients on open
  useEffect(() => {
    if (isOpen && selectedClients.length === 0) {
      clientsDB.getAll(storeId).then(allClients => {
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
        })) as Client[]);
      });
    }
  }, [isOpen, selectedClients.length, storeId, setRecentClients]);

  // Handle initial client from global search
  useEffect(() => {
    if (isOpen && initialClient && selectedClients.length === 0) {
      setSelectedClients([initialClient]);
      onInitialClientUsed?.();
    }
  }, [isOpen, initialClient, selectedClients.length, setSelectedClients, onInitialClientUsed]);

  // Search clients
  useEffect(() => {
    async function searchClients() {
      if (debouncedSearch.length < 2) {
        setClients([]);
        return;
      }
      setSearching(true);
      try {
        const results = await clientsDB.search(storeId, debouncedSearch);
        setClients(results.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone || '',
          email: c.email
        })) as Client[]);
      } catch (error) {
        console.error('Failed to search clients:', error);
      } finally {
        setSearching(false);
      }
    }
    searchClients();
  }, [debouncedSearch, storeId, setClients, setSearching]);

  const handleSelectClient = useCallback((client: ClientType | Client) => {
    const clientData = {
      id: client.id,
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || ''
    };

    if (bookingMode === 'individual') {
      setSelectedClients([clientData]);
      setPartySize(1);
    } else {
      if (selectedClients.some(c => c.id === client.id)) {
        return;
      }

      const newClients = [...selectedClients, clientData];
      setSelectedClients(newClients);

      if (newClients.length > partySize) {
        setPartySize(newClients.length);
      }
    }

    setClientSearch('');
    setShowAddNewForm(false);
    setIsAddingAnotherClient(false);

    if (!activeStaffId && selectedClients.length === 0) {
      setActiveTab('staff');
    }
  }, [
    bookingMode,
    selectedClients,
    partySize,
    activeStaffId,
    setSelectedClients,
    setPartySize,
    setClientSearch,
    setShowAddNewForm,
    setIsAddingAnotherClient,
    setActiveTab,
  ]);

  const validateClientForm = useCallback(() => {
    const errors: ValidationErrors = {};

    const firstNameError = getNameError(newClientFirstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;

    const lastNameError = getNameError(newClientLastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;

    const phoneError = getPhoneError(newClientPhone);
    if (phoneError) errors.phone = phoneError;

    if (newClientEmail.trim()) {
      const emailError = getEmailError(newClientEmail);
      if (emailError) errors.email = emailError;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newClientFirstName, newClientLastName, newClientPhone, newClientEmail, setValidationErrors]);

  const handleAddNewClient = useCallback(async () => {
    if (!validateClientForm()) {
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
        storeId,
        firstName: capitalizeName(newClientFirstName.trim()),
        lastName: capitalizeName(newClientLastName.trim()),
        name: fullName,
        phone: newClientPhone.trim(),
        email: newClientEmail.trim() || undefined,
        isBlocked: false,
      } as any);

      handleSelectClient(newClient);

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
  }, [
    validateClientForm,
    validationErrors,
    storeId,
    newClientFirstName,
    newClientLastName,
    newClientPhone,
    newClientEmail,
    handleSelectClient,
    setIsAddingClient,
    setNewClientFirstName,
    setNewClientLastName,
    setNewClientPhone,
    setNewClientEmail,
    setValidationErrors,
    setShowAddNewForm,
  ]);

  const handleAddNamedGuest = useCallback((client: ClientType | Client) => {
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
  }, [bookingGuests, setBookingGuests, setClientSearch, setShowAddNewForm, setIsAddingAnotherClient]);

  const handleAddUnnamedGuest = useCallback(() => {
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
  }, [bookingGuests, setBookingGuests]);

  const handleRemoveGuest = useCallback((guestId: string) => {
    setBookingGuests(bookingGuests.filter(g => g.id !== guestId));
  }, [bookingGuests, setBookingGuests]);

  return {
    debouncedSearch,
    handleSelectClient,
    handleAddNewClient,
    handleAddNamedGuest,
    handleAddUnnamedGuest,
    handleRemoveGuest,
    validateClientForm,
  };
}
