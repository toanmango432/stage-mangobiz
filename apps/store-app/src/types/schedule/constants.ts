import type { TimeOffType } from './timeOffType';
import type { BlockedTimeType } from './blockedTimeType';
import type { BaseSyncableEntity } from '../common';

/**
 * Default time-off types seeded on initialization
 */
export const DEFAULT_TIME_OFF_TYPES: Omit<TimeOffType, keyof BaseSyncableEntity>[] = [
  {
    name: 'Vacation',
    code: 'VAC',
    emoji: '🏖️',
    color: '#10B981',
    isPaid: true,
    requiresApproval: true,
    annualLimitDays: null,
    accrualEnabled: false,
    accrualRatePerMonth: null,
    carryOverEnabled: false,
    maxCarryOverDays: null,
    displayOrder: 1,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Sick Leave',
    code: 'SICK',
    emoji: '🤒',
    color: '#EF4444',
    isPaid: true,
    requiresApproval: false,
    annualLimitDays: null,
    accrualEnabled: false,
    accrualRatePerMonth: null,
    carryOverEnabled: false,
    maxCarryOverDays: null,
    displayOrder: 2,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Personal Day',
    code: 'PTO',
    emoji: '🏠',
    color: '#8B5CF6',
    isPaid: true,
    requiresApproval: true,
    annualLimitDays: null,
    accrualEnabled: false,
    accrualRatePerMonth: null,
    carryOverEnabled: false,
    maxCarryOverDays: null,
    displayOrder: 3,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Unpaid Leave',
    code: 'UNPAID',
    emoji: '📋',
    color: '#6B7280',
    isPaid: false,
    requiresApproval: true,
    annualLimitDays: null,
    accrualEnabled: false,
    accrualRatePerMonth: null,
    carryOverEnabled: false,
    maxCarryOverDays: null,
    displayOrder: 4,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Maternity/Paternity',
    code: 'MAT',
    emoji: '👶',
    color: '#EC4899',
    isPaid: true,
    requiresApproval: true,
    annualLimitDays: null,
    accrualEnabled: false,
    accrualRatePerMonth: null,
    carryOverEnabled: false,
    maxCarryOverDays: null,
    displayOrder: 5,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Bereavement',
    code: 'BRV',
    emoji: '🕯️',
    color: '#374151',
    isPaid: true,
    requiresApproval: false,
    annualLimitDays: null,
    accrualEnabled: false,
    accrualRatePerMonth: null,
    carryOverEnabled: false,
    maxCarryOverDays: null,
    displayOrder: 6,
    isActive: true,
    isSystemDefault: true,
  },
];

/**
 * Default blocked time types seeded on initialization
 */
export const DEFAULT_BLOCKED_TIME_TYPES: Omit<BlockedTimeType, keyof BaseSyncableEntity>[] = [
  {
    name: 'Lunch Break',
    code: 'LUNCH',
    emoji: '🍽️',
    color: '#F59E0B',
    defaultDurationMinutes: 60,
    isPaid: false,
    blocksOnlineBooking: true,
    blocksInStoreBooking: true,
    requiresApproval: false,
    displayOrder: 1,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Coffee Break',
    code: 'COFFEE',
    emoji: '☕',
    color: '#92400E',
    defaultDurationMinutes: 15,
    isPaid: true,
    blocksOnlineBooking: true,
    blocksInStoreBooking: true,
    requiresApproval: false,
    displayOrder: 2,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Training',
    code: 'TRAIN',
    emoji: '📚',
    color: '#3B82F6',
    defaultDurationMinutes: 120,
    isPaid: true,
    blocksOnlineBooking: true,
    blocksInStoreBooking: true,
    requiresApproval: false,
    displayOrder: 3,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Team Meeting',
    code: 'MTG',
    emoji: '👥',
    color: '#8B5CF6',
    defaultDurationMinutes: 30,
    isPaid: true,
    blocksOnlineBooking: true,
    blocksInStoreBooking: true,
    requiresApproval: false,
    displayOrder: 4,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Admin Tasks',
    code: 'ADMIN',
    emoji: '📋',
    color: '#6B7280',
    defaultDurationMinutes: 30,
    isPaid: true,
    blocksOnlineBooking: true,
    blocksInStoreBooking: false,
    requiresApproval: false,
    displayOrder: 5,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Cleaning/Setup',
    code: 'CLEAN',
    emoji: '🧹',
    color: '#10B981',
    defaultDurationMinutes: 30,
    isPaid: true,
    blocksOnlineBooking: true,
    blocksInStoreBooking: false,
    requiresApproval: false,
    displayOrder: 6,
    isActive: true,
    isSystemDefault: true,
  },
  {
    name: 'Personal Time',
    code: 'PERS',
    emoji: '🏃',
    color: '#EC4899',
    defaultDurationMinutes: 15,
    isPaid: false,
    blocksOnlineBooking: true,
    blocksInStoreBooking: true,
    requiresApproval: false,
    displayOrder: 7,
    isActive: true,
    isSystemDefault: true,
  },
];

/**
 * Sync priorities for schedule entities
 * Lower number = higher priority
 */
export const SCHEDULE_SYNC_PRIORITIES = {
  timeOffTypes: 4,        // LOW - Reference data
  timeOffRequests: 3,     // NORMAL - Important but deferrable
  blockedTimeTypes: 4,    // LOW - Reference data
  blockedTimeEntries: 3,  // NORMAL
  businessClosedPeriods: 3, // NORMAL
  resources: 4,           // LOW - Reference data
  resourceBookings: 2,    // HIGH - Affects appointments
  staffSchedules: 3,      // NORMAL
} as const;

/**
 * Entity types for sync operations
 */
export const SCHEDULE_ENTITY_TYPES = [
  'timeOffType',
  'timeOffRequest',
  'blockedTimeType',
  'blockedTimeEntry',
  'businessClosedPeriod',
  'resource',
  'resourceBooking',
  'staffSchedule',
] as const;

export type ScheduleEntityType = typeof SCHEDULE_ENTITY_TYPES[number];
