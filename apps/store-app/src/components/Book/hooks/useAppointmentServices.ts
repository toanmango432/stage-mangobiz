/**
 * Hook for managing service and staff logic in appointment modal
 * Extracted from NewAppointmentModal.v2.tsx
 */

import { useCallback } from 'react';

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

export interface UseAppointmentServicesOptions {
  postedStaff: StaffWithServices[];
  activeStaffId: string | null;
  activeStaffName: string | null;
  defaultStartTime: string;
  timeMode: 'sequential' | 'parallel';
  bookingMode: 'individual' | 'group';
  groupStep: 'guests' | 'services';
  activeGuestId: string | null;
  bookingGuests: BookingGuest[];

  // Setters
  setPostedStaff: (staff: StaffWithServices[]) => void;
  setActiveStaffId: (id: string | null) => void;
  setActiveTab: (tab: 'service' | 'staff') => void;
  setJustAddedService: (id: string | null) => void;
  setBookingGuests: (guests: BookingGuest[]) => void;
}

export interface UseAppointmentServicesReturn {
  handleSelectStaff: (staffId: string, staffName: string) => void;
  toggleStaffRequested: (staffId: string) => void;
  calculateServiceTimes: (startTime: string, duration: number) => { startTime: string; endTime: string };
  getNextAvailableStartTime: (staffId: string) => string;
  handleAddServiceToStaff: (service: Service) => void;
  handleRemoveService: (staffId: string, serviceId: string) => void;
  handleRemoveStaff: (staffId: string) => void;
  toggleStaffExpanded: (staffId: string) => void;
  handleUpdateServiceTime: (staffId: string, serviceId: string, newStartTime: string) => void;
  handleAddServiceToGuest: (guestId: string, service: Service, staffId: string, staffName: string) => void;
  handleRemoveServiceFromGuest: (guestId: string, serviceIndex: number) => void;
}

export function useAppointmentServices(options: UseAppointmentServicesOptions): UseAppointmentServicesReturn {
  const {
    postedStaff,
    activeStaffId,
    activeStaffName,
    defaultStartTime,
    timeMode,
    bookingMode,
    groupStep,
    activeGuestId,
    bookingGuests,
    setPostedStaff,
    setActiveStaffId,
    setActiveTab,
    setJustAddedService,
    setBookingGuests,
  } = options;

  const calculateServiceTimes = useCallback((startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + duration);
    const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
    return { startTime, endTime };
  }, []);

  const getNextAvailableStartTime = useCallback((staffId: string): string => {
    const staff = postedStaff.find(s => s.staffId === staffId);
    if (!staff || staff.services.length === 0) {
      return defaultStartTime;
    }
    if (timeMode === 'parallel') {
      return defaultStartTime;
    }
    const lastService = staff.services[staff.services.length - 1];
    return lastService.endTime;
  }, [postedStaff, defaultStartTime, timeMode]);

  const handleSelectStaff = useCallback((staffId: string, staffName: string) => {
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
  }, [postedStaff, setPostedStaff, setActiveStaffId, setActiveTab]);

  const toggleStaffRequested = useCallback((staffId: string) => {
    setPostedStaff(postedStaff.map(staff =>
      staff.staffId === staffId
        ? { ...staff, isRequested: !staff.isRequested }
        : staff
    ));
  }, [postedStaff, setPostedStaff]);

  const handleAddServiceToGuest = useCallback((guestId: string, service: Service, staffId: string, staffName: string) => {
    setBookingGuests(bookingGuests.map(guest => {
      if (guest.id === guestId) {
        let startTime = defaultStartTime;
        if (guest.services.length > 0 && timeMode === 'sequential') {
          const lastService = guest.services[guest.services.length - 1];
          startTime = lastService.endTime;
        }

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
  }, [bookingGuests, defaultStartTime, timeMode, calculateServiceTimes, setBookingGuests]);

  const handleAddServiceToStaff = useCallback((service: Service) => {
    if (!activeStaffId) {
      setActiveTab('staff');
      return;
    }

    // GROUP MODE: Add service to active guest
    if (bookingMode === 'group' && groupStep === 'services' && activeGuestId) {
      if (!activeStaffName) {
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
  }, [
    activeStaffId,
    activeStaffName,
    bookingMode,
    groupStep,
    activeGuestId,
    postedStaff,
    getNextAvailableStartTime,
    calculateServiceTimes,
    handleAddServiceToGuest,
    setPostedStaff,
    setActiveTab,
    setJustAddedService,
  ]);

  const handleRemoveService = useCallback((staffId: string, serviceId: string) => {
    setPostedStaff(postedStaff.map(staff =>
      staff.staffId === staffId
        ? { ...staff, services: staff.services.filter(s => s.id !== serviceId) }
        : staff
    ).filter(staff => staff.services.length > 0 || staff.staffId === activeStaffId));
  }, [postedStaff, activeStaffId, setPostedStaff]);

  const handleRemoveStaff = useCallback((staffId: string) => {
    setPostedStaff(postedStaff.filter(s => s.staffId !== staffId));
    if (activeStaffId === staffId) {
      setActiveStaffId(postedStaff[0]?.staffId || null);
    }
  }, [postedStaff, activeStaffId, setPostedStaff, setActiveStaffId]);

  const toggleStaffExpanded = useCallback((staffId: string) => {
    setPostedStaff(postedStaff.map(staff =>
      staff.staffId === staffId
        ? { ...staff, isExpanded: !staff.isExpanded }
        : staff
    ));
  }, [postedStaff, setPostedStaff]);

  const handleUpdateServiceTime = useCallback((staffId: string, serviceId: string, newStartTime: string) => {
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
  }, [postedStaff, calculateServiceTimes, setPostedStaff]);

  const handleRemoveServiceFromGuest = useCallback((guestId: string, serviceIndex: number) => {
    setBookingGuests(bookingGuests.map(guest => {
      if (guest.id === guestId) {
        return {
          ...guest,
          services: guest.services.filter((_, idx) => idx !== serviceIndex)
        };
      }
      return guest;
    }));
  }, [bookingGuests, setBookingGuests]);

  return {
    handleSelectStaff,
    toggleStaffRequested,
    calculateServiceTimes,
    getNextAvailableStartTime,
    handleAddServiceToStaff,
    handleRemoveService,
    handleRemoveStaff,
    toggleStaffExpanded,
    handleUpdateServiceTime,
    handleAddServiceToGuest,
    handleRemoveServiceFromGuest,
  };
}
