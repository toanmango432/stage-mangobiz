import { AppointmentStatus, BookingSource, SyncStatus } from './common';

export interface AppointmentService {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  duration: number; // minutes
  price: number;
}

export interface Appointment {
  id: string;
  salonId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  staffId: string; // Primary staff
  staffName: string;
  services: AppointmentService[];
  status: AppointmentStatus;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  checkInTime?: Date;
  notes?: string;
  source: BookingSource;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  syncStatus: SyncStatus;
}

export interface CreateAppointmentInput {
  clientId: string;
  clientName: string;
  clientPhone: string;
  staffId: string;
  services: Omit<AppointmentService, 'staffName' | 'serviceName'>[];
  scheduledStartTime: Date;
  notes?: string;
  source: BookingSource;
}

