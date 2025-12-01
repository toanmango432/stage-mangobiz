import { StaffStatus, SyncStatus } from './common';

export interface StaffSchedule {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  isAvailable: boolean;
}

export interface Staff {
  id: string;
  salonId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  specialties: string[]; // Service IDs
  specialty?: string; // Legacy or single specialty field
  skills?: string[]; // Skill tags for matching (e.g., "manicure", "pedicure", "nail-art")
  status: StaffStatus;
  isActive?: boolean; // Legacy or computed field for status
  role?: string; // Staff role (e.g., "stylist", "manager", "technician")
  hireDate?: string; // Hire date in ISO format
  commissionRate?: number; // Commission rate as decimal (e.g., 0.30 for 30%)
  clockedInAt?: Date;
  currentTicketId?: string;
  schedule: StaffSchedule[];
  turnQueuePosition?: number;
  servicesCountToday: number;
  revenueToday: number;
  tipsToday: number;
  rating?: number; // Average service rating (1-5)
  vipPreferred?: boolean; // Preferred for VIP clients
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}
