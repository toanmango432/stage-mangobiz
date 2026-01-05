/**
 * Zod Validation Schemas for Team Settings Module
 *
 * These schemas provide runtime validation at:
 * 1. Form submission (UI layer)
 * 2. Redux thunk entry (state layer)
 * 3. Database write (persistence layer)
 *
 * See: tasks/phase-1.5-quality-improvements.md
 */

import { z } from 'zod';

// ============================================
// SYNC STATUS & BASE SCHEMAS
// ============================================

export const SyncStatusSchema = z.enum([
  'local',
  'synced',
  'pending',
  'syncing',
  'conflict',
  'error',
]);

export const VectorClockSchema = z.record(z.string(), z.number().int().nonnegative());

/**
 * Base schema for all syncable entities.
 * Mirrors BaseSyncableEntity from src/types/common.ts
 */
export const BaseSyncableEntitySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  storeId: z.string().min(1),
  locationId: z.string().optional(),
  syncStatus: SyncStatusSchema,
  version: z.number().int().positive(),
  vectorClock: VectorClockSchema,
  lastSyncedVersion: z.number().int().nonnegative(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  createdBy: z.string().min(1),
  createdByDevice: z.string().min(1),
  lastModifiedBy: z.string().min(1),
  lastModifiedByDevice: z.string().min(1),
  isDeleted: z.boolean(),
  deletedAt: z.string().optional(),
  deletedBy: z.string().optional(),
  deletedByDevice: z.string().optional(),
  tombstoneExpiresAt: z.string().optional(),
});

// ============================================
// STAFF ROLE & PERMISSION ENUMS
// ============================================

export const StaffRoleSchema = z.enum([
  'owner',
  'manager',
  'senior_stylist',
  'stylist',
  'junior_stylist',
  'apprentice',
  'receptionist',
  'assistant',
  'nail_technician',
  'esthetician',
  'massage_therapist',
  'barber',
  'colorist',
  'makeup_artist',
]);

export const PermissionLevelSchema = z.enum(['full', 'limited', 'view_only', 'none']);

export const CommissionTypeSchema = z.enum(['percentage', 'tiered', 'flat', 'none']);

export const PayPeriodSchema = z.enum(['weekly', 'bi-weekly', 'monthly', 'per-service']);

export const BookingBufferTypeSchema = z.enum(['before', 'after', 'both']);

// ============================================
// PROFILE SCHEMAS
// ============================================

export const EmergencyContactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  relationship: z.string().min(1).max(50),
});

export const AddressSchema = z.object({
  street: z.string().max(200),
  city: z.string().max(100),
  state: z.string().max(50),
  zipCode: z.string().max(20),
});

export const TeamMemberProfileSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  displayName: z.string().max(200),
  email: z.string().email(),
  phone: z.string().max(20),
  avatar: z.string().url().optional(),
  bio: z.string().max(1000).optional(),
  title: z.string().max(100).optional(),
  employeeId: z.string().max(50).optional(),
  dateOfBirth: z.string().optional(),
  hireDate: z.string().optional(),
  emergencyContact: EmergencyContactSchema.optional(),
  address: AddressSchema.optional(),
});

// ============================================
// SERVICE PRICING SCHEMA
// ============================================

export const ServicePricingSchema = z.object({
  serviceId: z.string().min(1),
  serviceName: z.string().min(1),
  serviceCategory: z.string(),
  canPerform: z.boolean(),
  customPrice: z.number().nonnegative().optional(),
  defaultPrice: z.number().nonnegative(),
  customDuration: z.number().int().positive().optional(),
  defaultDuration: z.number().int().positive(),
  commissionOverride: z.number().min(0).max(100).optional(),
});

// ============================================
// WORKING HOURS SCHEMAS
// ============================================

export const ShiftSchema = z
  .object({
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
  })
  .refine(
    (data) => {
      const [startH, startM] = data.startTime.split(':').map(Number);
      const [endH, endM] = data.endTime.split(':').map(Number);
      return startH * 60 + startM < endH * 60 + endM;
    },
    { message: 'End time must be after start time' }
  );

export const BreakTimeSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  label: z.string().max(50).optional(),
});

export const WorkingDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isWorking: z.boolean(),
  shifts: z.array(ShiftSchema),
  breakTimes: z.array(BreakTimeSchema).optional(),
});

export const TimeOffRequestStatusSchema = z.enum(['pending', 'approved', 'denied']);
export const TimeOffTypeSchema = z.enum(['vacation', 'sick', 'personal', 'unpaid', 'other']);

export const TimeOffRequestSchema = z.object({
  id: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  type: TimeOffTypeSchema,
  status: TimeOffRequestStatusSchema,
  notes: z.string().max(500).optional(),
  requestedAt: z.string().min(1),
  respondedBy: z.string().optional(),
  respondedAt: z.string().optional(),
});

export const ScheduleOverrideTypeSchema = z.enum(['day_off', 'custom_hours', 'extra_day']);

export const ScheduleOverrideSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  type: ScheduleOverrideTypeSchema,
  customShifts: z.array(ShiftSchema).optional(),
  reason: z.string().max(200).optional(),
});

export const WorkingHoursSettingsSchema = z.object({
  regularHours: z.array(WorkingDaySchema),
  timeOffRequests: z.array(TimeOffRequestSchema),
  scheduleOverrides: z.array(ScheduleOverrideSchema),
  defaultBreakDuration: z.number().int().min(0).max(120),
  autoScheduleBreaks: z.boolean(),
});

// ============================================
// PERMISSIONS SCHEMA
// ============================================

export const PermissionCategorySchema = z.enum([
  'appointments',
  'clients',
  'sales',
  'reports',
  'team',
  'settings',
  'inventory',
]);

export const PermissionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  category: PermissionCategorySchema,
  level: PermissionLevelSchema,
});

export const RolePermissionsSchema = z.object({
  role: StaffRoleSchema,
  permissions: z.array(PermissionSchema),
  canAccessAdminPortal: z.boolean(),
  canAccessReports: z.boolean(),
  canModifyPrices: z.boolean(),
  canProcessRefunds: z.boolean(),
  canDeleteRecords: z.boolean(),
  canManageTeam: z.boolean(),
  canViewOthersCalendar: z.boolean(),
  canBookForOthers: z.boolean(),
  canEditOthersAppointments: z.boolean(),
  pinRequired: z.boolean(),
  pin: z
    .string()
    .regex(/^\d{4,6}$/, 'PIN must be 4-6 digits')
    .optional(),
});

// ============================================
// COMMISSION SCHEMAS
// ============================================

export const CommissionTierSchema = z.object({
  minRevenue: z.number().nonnegative(),
  maxRevenue: z.number().positive().optional(),
  percentage: z.number().min(0).max(100),
});

export const TipHandlingSchema = z.enum(['keep_all', 'pool', 'percentage']);

// Base commission schema (without refinements, for partial updates)
export const CommissionSettingsBaseSchema = z.object({
  type: CommissionTypeSchema,
  basePercentage: z.number().min(0).max(100),
  tiers: z.array(CommissionTierSchema).optional(),
  flatAmount: z.number().nonnegative().optional(),
  productCommission: z.number().min(0).max(100),
  tipHandling: TipHandlingSchema,
  tipPercentageToHouse: z.number().min(0).max(100).optional(),
  retailCommission: z.number().min(0).max(100).optional(),
  newClientBonus: z.number().nonnegative().optional(),
  rebookBonus: z.number().nonnegative().optional(),
});

// Full commission schema with tier gap validation
export const CommissionSettingsSchema = CommissionSettingsBaseSchema.refine(
    (data) => {
      // Validate that tiered commission has no gaps
      if (data.type === 'tiered' && data.tiers && data.tiers.length > 1) {
        const sorted = [...data.tiers].sort((a, b) => a.minRevenue - b.minRevenue);
        for (let i = 1; i < sorted.length; i++) {
          const prevMax = sorted[i - 1].maxRevenue;
          const currMin = sorted[i].minRevenue;
          if (prevMax !== undefined && prevMax < currMin) {
            return false; // Gap detected
          }
        }
      }
      return true;
    },
    { message: 'Commission tiers have gaps between ranges' }
  );

// ============================================
// PAYROLL SCHEMA
// ============================================

export const DeductionSchema = z.object({
  type: z.string().min(1).max(100),
  amount: z.number(),
  isPercentage: z.boolean(),
});

export const PayrollSettingsSchema = z.object({
  payPeriod: PayPeriodSchema,
  baseSalary: z.number().nonnegative().optional(),
  hourlyRate: z.number().nonnegative().optional(),
  guaranteedMinimum: z.number().nonnegative().optional(),
  overtimeRate: z.number().positive().optional(),
  overtimeThreshold: z.number().int().positive().optional(),
  deductions: z.array(DeductionSchema).optional(),
});

// ============================================
// ONLINE BOOKING SCHEMA
// ============================================

export const OnlineBookingSettingsSchema = z.object({
  isBookableOnline: z.boolean(),
  showOnWebsite: z.boolean(),
  showOnApp: z.boolean(),
  bookingUrl: z.string().url().optional(),
  maxAdvanceBookingDays: z.number().int().min(1).max(365),
  minAdvanceBookingHours: z.number().int().min(0).max(168),
  bufferBetweenAppointments: z.number().int().min(0).max(120),
  bufferType: BookingBufferTypeSchema,
  allowDoubleBooking: z.boolean(),
  maxConcurrentAppointments: z.number().int().min(1).max(10),
  requireDeposit: z.boolean(),
  depositAmount: z.number().nonnegative().optional(),
  autoAcceptBookings: z.boolean(),
  acceptNewClients: z.boolean(),
  displayOrder: z.number().int().nonnegative(),
  profileBio: z.string().max(1000).optional(),
  specialties: z.array(z.string().max(100)).optional(),
  portfolioImages: z.array(z.string().url()).optional(),
});

// ============================================
// NOTIFICATION PREFERENCES SCHEMA
// ============================================

export const EmailNotificationsSchema = z.object({
  appointmentReminders: z.boolean(),
  appointmentChanges: z.boolean(),
  newBookings: z.boolean(),
  cancellations: z.boolean(),
  dailySummary: z.boolean(),
  weeklySummary: z.boolean(),
  marketingEmails: z.boolean(),
  systemUpdates: z.boolean(),
});

export const SmsNotificationsSchema = z.object({
  appointmentReminders: z.boolean(),
  appointmentChanges: z.boolean(),
  newBookings: z.boolean(),
  cancellations: z.boolean(),
  urgentAlerts: z.boolean(),
});

export const PushNotificationsSchema = z.object({
  appointmentReminders: z.boolean(),
  newBookings: z.boolean(),
  messages: z.boolean(),
  teamUpdates: z.boolean(),
});

export const ReminderTimingSchema = z.object({
  firstReminder: z.number().int().min(1).max(72),
  secondReminder: z.number().int().min(1).max(48).optional(),
});

export const NotificationPreferencesSchema = z.object({
  email: EmailNotificationsSchema,
  sms: SmsNotificationsSchema,
  push: PushNotificationsSchema,
  reminderTiming: ReminderTimingSchema,
});

// ============================================
// PERFORMANCE GOALS SCHEMA
// ============================================

export const PerformanceGoalsSchema = z.object({
  dailyRevenueTarget: z.number().nonnegative().optional(),
  weeklyRevenueTarget: z.number().nonnegative().optional(),
  monthlyRevenueTarget: z.number().nonnegative().optional(),
  dailyServicesTarget: z.number().int().nonnegative().optional(),
  weeklyServicesTarget: z.number().int().nonnegative().optional(),
  rebookingRateTarget: z.number().min(0).max(100).optional(),
  newClientTarget: z.number().int().nonnegative().optional(),
  retailSalesTarget: z.number().nonnegative().optional(),
  averageTicketTarget: z.number().nonnegative().optional(),
});

// ============================================
// FULL TEAM MEMBER SETTINGS SCHEMA
// ============================================

/**
 * Complete TeamMemberSettings schema matching the TypeScript interface.
 * Use this for full entity validation.
 */
export const TeamMemberSettingsSchema = BaseSyncableEntitySchema.extend({
  profile: TeamMemberProfileSchema,
  services: z.array(ServicePricingSchema),
  workingHours: WorkingHoursSettingsSchema,
  permissions: RolePermissionsSchema,
  commission: CommissionSettingsSchema,
  payroll: PayrollSettingsSchema,
  onlineBooking: OnlineBookingSettingsSchema,
  notifications: NotificationPreferencesSchema,
  performanceGoals: PerformanceGoalsSchema,
  isActive: z.boolean(),
});

// ============================================
// PARTIAL SCHEMAS FOR UPDATES
// ============================================

/**
 * Partial schemas for section-specific updates.
 * Use these when updating only one section of a team member.
 */
export const PartialTeamMemberSettingsSchema = TeamMemberSettingsSchema.partial();

export const UpdateProfileSchema = TeamMemberProfileSchema.partial().extend({
  id: z.string().min(1), // ID is always required
});

export const UpdateServicesSchema = z.object({
  services: z.array(ServicePricingSchema),
});

export const UpdateWorkingHoursSchema = WorkingHoursSettingsSchema.partial();

export const UpdatePermissionsSchema = RolePermissionsSchema.partial();

export const UpdateCommissionSchema = CommissionSettingsBaseSchema.partial();

export const UpdatePayrollSchema = PayrollSettingsSchema.partial();

export const UpdateOnlineBookingSchema = OnlineBookingSettingsSchema.partial();

export const UpdateNotificationsSchema = NotificationPreferencesSchema.partial();

export const UpdatePerformanceGoalsSchema = PerformanceGoalsSchema.partial();

// ============================================
// TYPE EXPORTS (inferred from schemas)
// ============================================

export type SyncStatusType = z.infer<typeof SyncStatusSchema>;
export type VectorClockType = z.infer<typeof VectorClockSchema>;
export type BaseSyncableEntityType = z.infer<typeof BaseSyncableEntitySchema>;
export type StaffRoleType = z.infer<typeof StaffRoleSchema>;
export type PermissionLevelType = z.infer<typeof PermissionLevelSchema>;
export type CommissionTypeType = z.infer<typeof CommissionTypeSchema>;
export type TeamMemberProfileType = z.infer<typeof TeamMemberProfileSchema>;
export type ServicePricingType = z.infer<typeof ServicePricingSchema>;
export type WorkingHoursSettingsType = z.infer<typeof WorkingHoursSettingsSchema>;
export type RolePermissionsType = z.infer<typeof RolePermissionsSchema>;
export type CommissionSettingsType = z.infer<typeof CommissionSettingsSchema>;
export type PayrollSettingsType = z.infer<typeof PayrollSettingsSchema>;
export type OnlineBookingSettingsType = z.infer<typeof OnlineBookingSettingsSchema>;
export type NotificationPreferencesType = z.infer<typeof NotificationPreferencesSchema>;
export type PerformanceGoalsType = z.infer<typeof PerformanceGoalsSchema>;
export type TeamMemberSettingsType = z.infer<typeof TeamMemberSettingsSchema>;
