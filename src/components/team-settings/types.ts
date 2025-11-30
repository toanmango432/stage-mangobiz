// Team Settings Types - Comprehensive staff management for salon/spa

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
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
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
  type: 'vacation' | 'sick' | 'personal' | 'unpaid' | 'other';
  status: 'pending' | 'approved' | 'denied';
  notes?: string;
  requestedAt: string;
  respondedBy?: string;
  respondedAt?: string;
}

export interface ScheduleOverride {
  id: string;
  date: string;
  type: 'day_off' | 'custom_hours' | 'extra_day';
  customShifts?: {
    startTime: string;
    endTime: string;
  }[];
  reason?: string;
}

export interface WorkingHoursSettings {
  regularHours: WorkingDay[];
  timeOffRequests: TimeOffRequest[];
  scheduleOverrides: ScheduleOverride[];
  defaultBreakDuration: number;
  autoScheduleBreaks: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'appointments' | 'clients' | 'sales' | 'reports' | 'team' | 'settings' | 'inventory';
  level: PermissionLevel;
}

export interface RolePermissions {
  role: StaffRole;
  permissions: Permission[];
  canAccessAdminPortal: boolean;
  canAccessReports: boolean;
  canModifyPrices: boolean;
  canProcessRefunds: boolean;
  canDeleteRecords: boolean;
  canManageTeam: boolean;
  canViewOthersCalendar: boolean;
  canBookForOthers: boolean;
  canEditOthersAppointments: boolean;
  pinRequired: boolean;
  pin?: string;
}

export interface CommissionTier {
  minRevenue: number;
  maxRevenue?: number;
  percentage: number;
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
  overtimeThreshold?: number; // hours per week
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
  bookingUrl?: string;
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
  bufferBetweenAppointments: number;
  bufferType: BookingBufferType;
  allowDoubleBooking: boolean;
  maxConcurrentAppointments: number;
  requireDeposit: boolean;
  depositAmount?: number;
  autoAcceptBookings: boolean;
  acceptNewClients: boolean;
  displayOrder: number;
  profileBio?: string;
  specialties?: string[];
  portfolioImages?: string[];
}

export interface NotificationPreferences {
  email: {
    appointmentReminders: boolean;
    appointmentChanges: boolean;
    newBookings: boolean;
    cancellations: boolean;
    dailySummary: boolean;
    weeklySummary: boolean;
    marketingEmails: boolean;
    systemUpdates: boolean;
  };
  sms: {
    appointmentReminders: boolean;
    appointmentChanges: boolean;
    newBookings: boolean;
    cancellations: boolean;
    urgentAlerts: boolean;
  };
  push: {
    appointmentReminders: boolean;
    newBookings: boolean;
    messages: boolean;
    teamUpdates: boolean;
  };
  reminderTiming: {
    firstReminder: number; // hours before
    secondReminder?: number;
  };
}

export interface PerformanceGoals {
  dailyRevenueTarget?: number;
  weeklyRevenueTarget?: number;
  monthlyRevenueTarget?: number;
  dailyServicesTarget?: number;
  weeklyServicesTarget?: number;
  rebookingRateTarget?: number;
  newClientTarget?: number;
  retailSalesTarget?: number;
  averageTicketTarget?: number;
}

export interface TeamMemberSettings {
  id: string;
  profile: TeamMemberProfile;
  services: ServicePricing[];
  workingHours: WorkingHoursSettings;
  permissions: RolePermissions;
  commission: CommissionSettings;
  payroll: PayrollSettings;
  onlineBooking: OnlineBookingSettings;
  notifications: NotificationPreferences;
  performanceGoals: PerformanceGoals;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// UI State Types
export type TeamSettingsSection =
  | 'profile'
  | 'services'
  | 'schedule'
  | 'permissions'
  | 'commission'
  | 'online-booking'
  | 'notifications'
  | 'performance';

export interface TeamSettingsUIState {
  selectedMemberId: string | null;
  activeSection: TeamSettingsSection;
  searchQuery: string;
  filterRole: StaffRole | 'all';
  filterStatus: 'all' | 'active' | 'inactive';
  sortBy: 'name' | 'role' | 'hireDate' | 'performance';
  sortOrder: 'asc' | 'desc';
  isAddingNew: boolean;
  hasUnsavedChanges: boolean;
}
