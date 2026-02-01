/**
 * Team Settings Types - Comprehensive staff management for salon/spa
 * Moved from store-app to shared types package for reuse in utils package
 */

import type { BaseSyncableEntity } from './common';

export type StaffRole =
  | 'owner'
  | 'manager'
  | 'senior_stylist'
  | 'stylist'
  | 'junior_stylist'
  | 'apprentice'
  | 'receptionist'
  | 'assistant'
  | 'nail_technician'
  | 'esthetician'
  | 'massage_therapist'
  | 'barber'
  | 'colorist'
  | 'makeup_artist';

export type PermissionLevel = 'full' | 'limited' | 'view_only' | 'none';

export type CommissionType = 'percentage' | 'tiered' | 'flat' | 'none';

export type PayPeriod = 'weekly' | 'bi-weekly' | 'monthly' | 'per-service';

export type BookingBufferType = 'before' | 'after' | 'both';

export type TimeOffType = 'vacation' | 'sick' | 'personal' | 'unpaid' | 'other';
export type TimeOffStatus = 'pending' | 'approved' | 'denied';
export type ScheduleOverrideType = 'day_off' | 'custom_hours' | 'extra_day';

export interface Shift {
  startTime: string;
  endTime: string;
}

export interface TeamMemberProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  avatar?: string;
  bio?: string;
  title?: string;
  employeeId?: string;
  dateOfBirth?: string;
  hireDate?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface ServicePricing {
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  canPerform: boolean;
  customPrice?: number;
  defaultPrice: number;
  customDuration?: number;
  defaultDuration: number;
  commissionOverride?: number;
}

export interface WorkingDay {
  dayOfWeek: number;
  isWorking: boolean;
  shifts: {
    startTime: string;
    endTime: string;
  }[];
  breakTimes?: {
    startTime: string;
    endTime: string;
    label?: string;
  }[];
}

export interface TimeOffRequest {
  id: string;
  startDate: string;
  endDate: string;
  type: TimeOffType;
  status: TimeOffStatus;
  notes?: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ScheduleOverride {
  id: string;
  date: string;
  type: ScheduleOverrideType;
  customHours?: {
    startTime: string;
    endTime: string;
  };
  notes?: string;
}

export interface WorkingHoursSettings {
  regularHours: WorkingDay[];
  timeOffRequests: TimeOffRequest[];
  scheduleOverrides: ScheduleOverride[];
  effectiveDate?: string;
}

export interface CommissionTier {
  threshold: number;
  percentage: number;
  /** Minimum revenue for this tier (used in tiered commission calculations) */
  minRevenue?: number;
  /** Maximum revenue for this tier (used in tiered commission calculations) */
  maxRevenue?: number;
}

export interface CommissionSettings {
  type: CommissionType;
  basePercentage: number;
  tiers?: CommissionTier[];
  flatAmount?: number;
  productCommission: number;
  tipHandling: 'keep_all' | 'pool' | 'percentage';
  tipPercentageToHouse?: number;
  retailCommission?: number;
  newClientBonus?: number;
  rebookBonus?: number;
}

export interface PayrollSettings {
  payPeriod: PayPeriod;
  baseSalary?: number;
  hourlyRate?: number;
  guaranteedMinimum?: number;
  overtimeRate?: number;
  overtimeThreshold?: number;
  deductions?: {
    type: string;
    amount: number;
    isPercentage: boolean;
  }[];
}

export interface OnlineBookingSettings {
  isBookableOnline: boolean;
  showOnWebsite: boolean;
  showOnApp: boolean;
  acceptsNewClients: boolean;
  bufferTime: number;
  bufferType: BookingBufferType;
  maxDailyBookings?: number;
  advanceBookingDays: number;
  minAdvanceBookingHours: number;
}

export interface NotificationPreferences {
  appointmentReminders: boolean;
  scheduleChanges: boolean;
  newBookings: boolean;
  cancellations: boolean;
  clientMessages: boolean;
  marketingUpdates: boolean;
  payrollNotifications: boolean;
}

export interface DisplayPreferences {
  showRealName: boolean;
  profileVisibility: 'public' | 'clients_only' | 'private';
  showServicePrices: boolean;
  showAvailability: boolean;
  highlightColor?: string;
}

export interface PermissionSettings {
  accessLevel: PermissionLevel;
  canViewReports: boolean;
  canManageInventory: boolean;
  canProcessPayments: boolean;
  canAccessCashDrawer: boolean;
  canApplyDiscounts: boolean;
  maxDiscountPercent: number;
  canVoidTransactions: boolean;
  canManageOtherStaff: boolean;
  canAccessAdminSettings: boolean;
  canViewOtherSchedules: boolean;
  canModifyOwnSchedule: boolean;
}

export interface TeamMemberSettings extends BaseSyncableEntity {
  staffId: string;
  profile: TeamMemberProfile;
  role: StaffRole;
  servicePricing: ServicePricing[];
  workingHours: WorkingHoursSettings;
  commission: CommissionSettings;
  payroll: PayrollSettings;
  onlineBooking: OnlineBookingSettings;
  notifications: NotificationPreferences;
  display: DisplayPreferences;
  permissions: PermissionSettings;
  pin?: string;
  notes?: string;
  tags?: string[];
  createdBy: string;
  updatedBy: string;
}
