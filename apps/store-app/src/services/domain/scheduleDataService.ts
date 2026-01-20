/**
 * Schedule Data Service
 *
 * LOCAL-FIRST scheduling operations extracted from dataService.ts for modularity.
 * Includes time off, blocked time, business hours, resources, and staff schedules.
 *
 * SQLite routing: When USE_SQLITE=true and running in Electron, uses SQLite services.
 */

import { shouldUseSQLite } from '@/config/featureFlags';

// IndexedDB (Dexie) imports
import {
  timeOffTypesDB,
  timeOffRequestsDB,
  blockedTimeTypesDB,
  blockedTimeEntriesDB,
  businessClosedPeriodsDB,
  resourcesDB,
  resourceBookingsDB,
  staffSchedulesDB,
} from '@/db/scheduleDatabase';

// SQLite imports
import {
  sqliteTimeOffTypesDB,
  sqliteTimeOffRequestsDB,
  sqliteBlockedTimeTypesDB,
  sqliteBlockedTimeEntriesDB,
  sqliteBusinessClosedPeriodsDB,
  sqliteResourcesDB,
  sqliteResourceBookingsDB,
  sqliteStaffSchedulesDB,
} from '@/services/sqliteServices';

const USE_SQLITE = shouldUseSQLite();

// ==================== TIME OFF TYPES SERVICE ====================

export const timeOffTypesService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.getAll(storeId);
    }
    return timeOffTypesDB.getAll(storeId);
  },

  async getAllIncludingInactive(storeId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.getAllIncludingInactive(storeId);
    }
    return timeOffTypesDB.getAllIncludingInactive(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.getById(id);
    }
    return timeOffTypesDB.getById(id);
  },

  async getByCode(storeId: string, code: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.getByCode(storeId, code);
    }
    return timeOffTypesDB.getByCode(storeId, code);
  },

  async create(input: unknown, userId: string, storeId: string, tenantId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.create(input);
    }
    return timeOffTypesDB.create(input as Parameters<typeof timeOffTypesDB.create>[0], userId, storeId, tenantId, deviceId);
  },

  async update(id: string, updates: unknown, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.update(id, updates);
    }
    return timeOffTypesDB.update(id, updates as Parameters<typeof timeOffTypesDB.update>[1], userId, deviceId);
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffTypesDB.delete(id);
    }
    return timeOffTypesDB.delete(id, userId, deviceId);
  },
};

// ==================== TIME OFF REQUESTS SERVICE ====================

export const timeOffRequestsService = {
  async getByStaff(staffId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.getByStaff(staffId);
    }
    return timeOffRequestsDB.getByStaff(staffId);
  },

  async getAll(storeId: string, filters?: { status?: string; staffId?: string; dateRange?: string }) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.getAll(storeId);
    }
    return timeOffRequestsDB.getAll(storeId, filters as Parameters<typeof timeOffRequestsDB.getAll>[1]);
  },

  async getPendingCount(storeId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.getPendingCount(storeId);
    }
    return timeOffRequestsDB.getPendingCount(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.getById(id);
    }
    return timeOffRequestsDB.getById(id);
  },

  async create(
    input: unknown,
    typeDetails: { name: string; emoji: string; color: string; isPaid: boolean; requiresApproval: boolean },
    totalHours: number,
    totalDays: number,
    conflictingAppointmentIds: string[],
    userId: string,
    storeId: string,
    tenantId: string,
    deviceId: string
  ) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.create(input);
    }
    return timeOffRequestsDB.create(
      input as Parameters<typeof timeOffRequestsDB.create>[0],
      typeDetails,
      totalHours,
      totalDays,
      conflictingAppointmentIds,
      userId,
      storeId,
      tenantId,
      deviceId
    );
  },

  async approve(id: string, approverName: string, notes: string | null, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.approve(id, approverName, notes, userId, deviceId);
    }
    return timeOffRequestsDB.approve(id, approverName, notes, userId, deviceId);
  },

  async deny(id: string, denierName: string, reason: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.deny(id, denierName, reason, userId, deviceId);
    }
    return timeOffRequestsDB.deny(id, denierName, reason, userId, deviceId);
  },

  async cancel(id: string, reason: string | null, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteTimeOffRequestsDB.cancel(id, reason, userId, deviceId);
    }
    return timeOffRequestsDB.cancel(id, reason, userId, deviceId);
  },
};

// ==================== BLOCKED TIME TYPES SERVICE ====================

export const blockedTimeTypesService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeTypesDB.getAll(storeId);
    }
    return blockedTimeTypesDB.getAll(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeTypesDB.getById(id);
    }
    return blockedTimeTypesDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string, tenantId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeTypesDB.create(input);
    }
    return blockedTimeTypesDB.create(input as Parameters<typeof blockedTimeTypesDB.create>[0], userId, storeId, tenantId, deviceId);
  },

  async update(id: string, updates: unknown, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeTypesDB.update(id, updates);
    }
    return blockedTimeTypesDB.update(id, updates as Parameters<typeof blockedTimeTypesDB.update>[1], userId, deviceId);
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeTypesDB.delete(id);
    }
    return blockedTimeTypesDB.delete(id, userId, deviceId);
  },

  async seedDefaults(storeId: string, tenantId: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeTypesDB.seedDefaults(storeId);
    }
    return blockedTimeTypesDB.seedDefaults(storeId, tenantId, userId, deviceId);
  },
};

// ==================== BLOCKED TIME ENTRIES SERVICE ====================

export const blockedTimeEntriesService = {
  async getAll(storeId: string, filters?: { staffId?: string; startDate?: string; endDate?: string }) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.getAll(storeId);
    }
    return blockedTimeEntriesDB.getAll(storeId, filters);
  },

  async getByStaffAndDate(staffId: string, date: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.getByStaffAndDate(staffId, date);
    }
    return blockedTimeEntriesDB.getByStaffAndDate(staffId, date);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.getById(id);
    }
    return blockedTimeEntriesDB.getById(id);
  },

  async create(
    input: unknown,
    typeDetails: { name: string; emoji: string; color: string; isPaid: boolean },
    userId: string,
    storeId: string,
    tenantId: string,
    deviceId: string,
    isManager: boolean
  ) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.create(input);
    }
    return blockedTimeEntriesDB.create(
      input as Parameters<typeof blockedTimeEntriesDB.create>[0],
      typeDetails,
      userId,
      storeId,
      tenantId,
      deviceId,
      isManager
    );
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.delete(id);
    }
    return blockedTimeEntriesDB.delete(id, userId, deviceId);
  },

  async getBySeries(seriesId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.getBySeries(seriesId);
    }
    return blockedTimeEntriesDB.getBySeries(seriesId);
  },

  async deleteSeries(seriesId: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBlockedTimeEntriesDB.deleteSeries(seriesId, userId, deviceId);
    }
    return blockedTimeEntriesDB.deleteSeries(seriesId, userId, deviceId);
  },
};

// ==================== BUSINESS CLOSED PERIODS SERVICE ====================

export const businessClosedPeriodsService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.getAll(storeId);
    }
    return businessClosedPeriodsDB.getAll(storeId);
  },

  async getUpcoming(storeId: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.getUpcoming(storeId);
    }
    return businessClosedPeriodsDB.getUpcoming(storeId);
  },

  async getForDate(storeId: string, date: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.getForDate(storeId, date);
    }
    return businessClosedPeriodsDB.getForDate(storeId, date);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.getById(id);
    }
    return businessClosedPeriodsDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string, tenantId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.create(input);
    }
    return businessClosedPeriodsDB.create(input as Parameters<typeof businessClosedPeriodsDB.create>[0], userId, storeId, tenantId, deviceId);
  },

  async update(id: string, updates: unknown, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.update(id, updates);
    }
    return businessClosedPeriodsDB.update(id, updates as Partial<Parameters<typeof businessClosedPeriodsDB.create>[0]>, userId, deviceId);
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteBusinessClosedPeriodsDB.delete(id);
    }
    return businessClosedPeriodsDB.delete(id, userId, deviceId);
  },
};

// ==================== RESOURCES SERVICE ====================

export const resourcesService = {
  async getAll(storeId: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.getAll(storeId);
    }
    return resourcesDB.getAll(storeId);
  },

  async getAllIncludingInactive(storeId: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.getAllIncludingInactive(storeId);
    }
    return resourcesDB.getAllIncludingInactive(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.getById(id);
    }
    return resourcesDB.getById(id);
  },

  async getByCategory(storeId: string, category: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.getByCategory(storeId, category);
    }
    return resourcesDB.getByCategory(storeId, category);
  },

  async create(input: unknown, userId: string, storeId: string, tenantId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.create(input);
    }
    return resourcesDB.create(input as Parameters<typeof resourcesDB.create>[0], userId, storeId, tenantId, deviceId);
  },

  async update(id: string, updates: unknown, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.update(id, updates);
    }
    return resourcesDB.update(id, updates as Parameters<typeof resourcesDB.update>[1], userId, deviceId);
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteResourcesDB.delete(id);
    }
    return resourcesDB.delete(id, userId, deviceId);
  },
};

// ==================== RESOURCE BOOKINGS SERVICE ====================

export const resourceBookingsService = {
  async getByResource(resourceId: string, startDate: string, endDate: string) {
    if (USE_SQLITE) {
      return sqliteResourceBookingsDB.getByResource(resourceId, startDate, endDate);
    }
    return resourceBookingsDB.getByResource(resourceId, startDate, endDate);
  },

  async getByAppointment(appointmentId: string) {
    if (USE_SQLITE) {
      return sqliteResourceBookingsDB.getByAppointment(appointmentId);
    }
    return resourceBookingsDB.getByAppointment(appointmentId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteResourceBookingsDB.getById(id);
    }
    return resourceBookingsDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string, tenantId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteResourceBookingsDB.create(input);
    }
    return resourceBookingsDB.create(input as Parameters<typeof resourceBookingsDB.create>[0], userId, storeId, tenantId, deviceId);
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteResourceBookingsDB.delete(id);
    }
    return resourceBookingsDB.delete(id, userId, deviceId);
  },
};

// ==================== STAFF SCHEDULES SERVICE ====================

export const staffSchedulesService = {
  async getByStaff(staffId: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.getByStaff(staffId);
    }
    return staffSchedulesDB.getByStaff(staffId);
  },

  async getCurrentForStaff(staffId: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.getCurrentForStaff(staffId);
    }
    return staffSchedulesDB.getCurrentForStaff(staffId);
  },

  async getByStore(storeId: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.getByStore(storeId);
    }
    return staffSchedulesDB.getByStore(storeId);
  },

  async getById(id: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.getById(id);
    }
    return staffSchedulesDB.getById(id);
  },

  async create(input: unknown, userId: string, storeId: string, tenantId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.create(input);
    }
    return staffSchedulesDB.create(input as Parameters<typeof staffSchedulesDB.create>[0], userId, storeId, tenantId, deviceId);
  },

  async update(id: string, updates: unknown, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.update(id, updates);
    }
    return staffSchedulesDB.update(id, updates as Partial<Parameters<typeof staffSchedulesDB.create>[0]>, userId, deviceId);
  },

  async delete(id: string, userId: string, deviceId: string) {
    if (USE_SQLITE) {
      return sqliteStaffSchedulesDB.delete(id);
    }
    return staffSchedulesDB.delete(id, userId, deviceId);
  },
};
