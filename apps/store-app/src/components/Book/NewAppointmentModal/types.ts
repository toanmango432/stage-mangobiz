/**
 * Shared types for NewAppointmentModal components
 */

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
}

export interface ServiceWithTime extends Service {
  startTime: string;
  endTime: string;
}

export interface StaffWithServices {
  staffId: string;
  staffName: string;
  services: ServiceWithTime[];
  isExpanded: boolean;
  isRequested?: boolean;
}

export interface BookingGuest {
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

export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
}
