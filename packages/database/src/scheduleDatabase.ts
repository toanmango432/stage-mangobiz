import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import { syncQueueDB } from './database';
import { createBaseSyncableDefaults } from '../types/common';
import type {
  TimeOffType,
  CreateTimeOffTypeInput,
  UpdateTimeOffTypeInput,
  TimeOffRequest,
  CreateTimeOffRequestInput,
  BlockedTimeType,
  CreateBlockedTimeTypeInput,
  UpdateBlockedTimeTypeInput,
  BlockedTimeEntry,
  CreateBlockedTimeEntryInput,
  BusinessClosedPeriod,
  CreateBusinessClosedPeriodInput,
  Resource,
  CreateResourceInput,
  UpdateResourceInput,
  ResourceBooking,
  CreateResourceBookingInput,
  StaffSchedule,
  CreateStaffScheduleInput,
} from '../types/schedule';
import {
  DEFAULT_TIME_OFF_TYPES,
  DEFAULT_BLOCKED_TIME_TYPES,
  SCHEDULE_SYNC_PRIORITIES,
  PaginationParams,
  PaginatedResult,
  TimeOffRequestFilters,
  isCustomDateRange,
} from '../types/schedule';

// ============================================================
// TIME-OFF TYPES
// ============================================================

export const timeOffTypesDB = {
  /**
   * Get all active time-off types for a store
   */
  async getAll(storeId: string): Promise<TimeOffType[]> {
    return db.timeOffTypes
      .where('storeId')
      .equals(storeId)
      .filter(t => !t.isDeleted && t.isActive)
      .sortBy('displayOrder');
  },

  /**
   * Get all time-off types including inactive ones
   */
  async getAllIncludingInactive(storeId: string): Promise<TimeOffType[]> {
    return db.timeOffTypes
      .where('storeId')
      .equals(storeId)
      .filter(t => !t.isDeleted)
      .sortBy('displayOrder');
  },

  /**
   * Get a single time-off type by ID
   */
  async getById(id: string): Promise<TimeOffType | undefined> {
    const type = await db.timeOffTypes.get(id);
    return type?.isDeleted ? undefined : type;
  },

  /**
   * Get time-off type by code
   */
  async getByCode(storeId: string, code: string): Promise<TimeOffType | undefined> {
    return db.timeOffTypes
      .where('storeId')
      .equals(storeId)
      .filter(t => t.code === code && !t.isDeleted)
      .first();
  },

  /**
   * Create a new time-off type
   */
  async create(
    input: CreateTimeOffTypeInput,
    userId: string,
    storeId: string,
    tenantId: string,
    deviceId: string
  ): Promise<TimeOffType> {
    const id = uuidv4();

    // Get next display order if not provided
    let displayOrder = input.displayOrder;
    if (displayOrder === undefined) {
      const existing = await db.timeOffTypes.where('storeId').equals(storeId).toArray();
      displayOrder = Math.max(0, ...existing.map(t => t.displayOrder)) + 1;
    }

    const timeOffType: TimeOffType = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, storeId),
      name: input.name,
      code: input.code,
      emoji: input.emoji,
      color: input.color,
      isPaid: input.isPaid,
      requiresApproval: input.requiresApproval,
      annualLimitDays: input.annualLimitDays ?? null,
      accrualEnabled: input.accrualEnabled ?? false,
      accrualRatePerMonth: input.accrualRatePerMonth ?? null,
      carryOverEnabled: input.carryOverEnabled ?? false,
      maxCarryOverDays: input.maxCarryOverDays ?? null,
      displayOrder,
      isActive: input.isActive ?? true,
      isSystemDefault: false,
    };

    await db.timeOffTypes.put(timeOffType);

    // Add to sync queue
    await syncQueueDB.add({
      type: 'create',
      entity: 'timeOffType',
      entityId: id,
      action: 'CREATE',
      payload: timeOffType,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffTypes,
      maxAttempts: 5,
    });

    return timeOffType;
  },

  /**
   * Update an existing time-off type
   */
  async update(
    id: string,
    updates: UpdateTimeOffTypeInput,
    userId: string,
    deviceId: string
  ): Promise<TimeOffType | undefined> {
    const existing = await db.timeOffTypes.get(id);
    if (!existing || existing.isDeleted) return undefined;

    const now = new Date().toISOString();
    const updated: TimeOffType = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.timeOffTypes.put(updated);

    await syncQueueDB.add({
      type: 'update',
      entity: 'timeOffType',
      entityId: id,
      action: 'UPDATE',
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffTypes,
      maxAttempts: 5,
    });

    return updated;
  },

  /**
   * Soft delete a time-off type
   */
  async delete(id: string, userId: string, deviceId: string): Promise<boolean> {
    const existing = await db.timeOffTypes.get(id);
    if (!existing || existing.isDeleted) return false;
    if (existing.isSystemDefault) {
      throw new Error('Cannot delete system default time-off type');
    }

    const now = new Date().toISOString();
    const deleted: TimeOffType = {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: userId,
      deletedByDevice: deviceId,
      tombstoneExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.timeOffTypes.put(deleted);

    await syncQueueDB.add({
      type: 'delete',
      entity: 'timeOffType',
      entityId: id,
      action: 'DELETE',
      payload: deleted,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffTypes,
      maxAttempts: 5,
    });

    return true;
  },

  /**
   * Seed default time-off types for a new store
   */
  async seedDefaults(
    storeId: string,
    tenantId: string,
    userId: string,
    deviceId: string
  ): Promise<TimeOffType[]> {
    // Check if already seeded
    const existing = await db.timeOffTypes.where('storeId').equals(storeId).count();
    if (existing > 0) return [];

    const types: TimeOffType[] = DEFAULT_TIME_OFF_TYPES.map((t, index) => ({
      id: uuidv4(),
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, storeId),
      ...t,
      displayOrder: index + 1,
    }));

    await db.timeOffTypes.bulkPut(types);

    // Queue for sync
    for (const type of types) {
      await syncQueueDB.add({
        type: 'create',
        entity: 'timeOffType',
        entityId: type.id,
        action: 'CREATE',
        payload: type,
        priority: SCHEDULE_SYNC_PRIORITIES.timeOffTypes,
        maxAttempts: 5,
      });
    }

    return types;
  },
};

// ============================================================
// TIME-OFF REQUESTS
// ============================================================

export const timeOffRequestsDB = {
  /**
   * Get all time-off requests with optional filters
   */
  async getAll(storeId: string, filters?: Partial<TimeOffRequestFilters>): Promise<TimeOffRequest[]> {
    const today = new Date().toISOString().split('T')[0];

    let results = await db.timeOffRequests
      .where('storeId')
      .equals(storeId)
      .filter(r => !r.isDeleted)
      .toArray();

    if (filters?.status && filters.status !== 'all') {
      results = results.filter(r => r.status === filters.status);
    }
    if (filters?.staffId) {
      results = results.filter(r => r.staffId === filters.staffId);
    }
    if (filters?.typeId) {
      results = results.filter(r => r.typeId === filters.typeId);
    }

    // Date range filtering
    if (filters?.dateRange) {
      if (filters.dateRange === 'upcoming') {
        results = results.filter(r => r.startDate >= today);
      } else if (filters.dateRange === 'past') {
        results = results.filter(r => r.startDate < today);
      } else if (isCustomDateRange(filters.dateRange)) {
        const { start, end } = filters.dateRange;
        results = results.filter(r => r.endDate >= start && r.startDate <= end);
      }
    }

    return results.sort((a, b) => a.startDate.localeCompare(b.startDate));
  },

  /**
   * Get time-off requests with cursor-based pagination
   */
  async getAllPaginated(
    storeId: string,
    filters: Partial<TimeOffRequestFilters> = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResult<TimeOffRequest>> {
    const { limit = 50, cursor, sortBy = 'startDate', sortOrder = 'desc' } = pagination;
    const today = new Date().toISOString().split('T')[0];

    // Get all matching results first
    let results = await db.timeOffRequests
      .where('storeId')
      .equals(storeId)
      .filter(r => {
        if (r.isDeleted) return false;
        if (filters.status && filters.status !== 'all' && r.status !== filters.status) return false;
        if (filters.staffId && r.staffId !== filters.staffId) return false;
        if (filters.typeId && r.typeId !== filters.typeId) return false;

        if (filters.dateRange) {
          if (filters.dateRange === 'upcoming' && r.startDate < today) return false;
          if (filters.dateRange === 'past' && r.startDate >= today) return false;
          if (isCustomDateRange(filters.dateRange)) {
            const { start, end } = filters.dateRange;
            if (r.endDate < start || r.startDate > end) return false;
          }
        }
        return true;
      })
      .toArray();

    // Sort
    results.sort((a, b) => {
      const aVal = String(a[sortBy as keyof TimeOffRequest] || '');
      const bVal = String(b[sortBy as keyof TimeOffRequest] || '');
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

    const total = results.length;

    // Apply cursor
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = results.findIndex(r => r.id === cursor);
      if (cursorIndex !== -1) startIndex = cursorIndex + 1;
    }

    // Slice for pagination
    const paginatedItems = results.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < total;

    return {
      items: paginatedItems,
      pagination: {
        total,
        hasMore,
        nextCursor: hasMore ? paginatedItems[paginatedItems.length - 1]?.id ?? null : null,
        prevCursor: startIndex > 0 ? results[startIndex - 1]?.id ?? null : null,
      },
    };
  },

  async getById(id: string): Promise<TimeOffRequest | undefined> {
    const request = await db.timeOffRequests.get(id);
    return request?.isDeleted ? undefined : request;
  },

  async getPendingCount(storeId: string): Promise<number> {
    return db.timeOffRequests
      .where('storeId')
      .equals(storeId)
      .filter(r => !r.isDeleted && r.status === 'pending')
      .count();
  },

  async getByStaff(staffId: string): Promise<TimeOffRequest[]> {
    return db.timeOffRequests
      .where('staffId')
      .equals(staffId)
      .filter(r => !r.isDeleted)
      .sortBy('startDate');
  },

  async create(
    input: CreateTimeOffRequestInput,
    typeDetails: Pick<TimeOffType, 'name' | 'emoji' | 'color' | 'isPaid' | 'requiresApproval'>,
    totalHours: number,
    totalDays: number,
    conflictingAppointmentIds: string[],
    userId: string,
    storeId: string,
    tenantId: string,
    deviceId: string
  ): Promise<TimeOffRequest> {
    const now = new Date().toISOString();
    const id = uuidv4();

    const initialStatus = typeDetails.requiresApproval ? 'pending' : 'approved';

    const request: TimeOffRequest = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, storeId),
      staffId: input.staffId,
      staffName: input.staffName,
      typeId: input.typeId,
      typeName: typeDetails.name,
      typeEmoji: typeDetails.emoji,
      typeColor: typeDetails.color,
      isPaid: typeDetails.isPaid,
      startDate: input.startDate,
      endDate: input.endDate,
      isAllDay: input.isAllDay,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      totalHours,
      totalDays,
      status: initialStatus,
      statusHistory: [{
        from: null,
        to: initialStatus,
        changedAt: now,
        changedBy: userId,
        changedByDevice: deviceId,
      }],
      notes: input.notes ?? null,
      approvedBy: initialStatus === 'approved' ? 'system' : null,
      approvedByName: initialStatus === 'approved' ? 'Auto-approved' : null,
      approvedAt: initialStatus === 'approved' ? now : null,
      approvalNotes: null,
      deniedBy: null,
      deniedByName: null,
      deniedAt: null,
      denialReason: null,
      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,
      hasConflicts: conflictingAppointmentIds.length > 0,
      conflictingAppointmentIds,
    };

    await db.timeOffRequests.put(request);

    await syncQueueDB.add({
      type: 'create',
      entity: 'timeOffRequest',
      entityId: id,
      action: 'CREATE',
      payload: request,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffRequests,
      maxAttempts: 5,
    });

    return request;
  },

  async approve(
    id: string,
    approverName: string,
    notes: string | null,
    userId: string,
    deviceId: string
  ): Promise<TimeOffRequest | undefined> {
    const existing = await db.timeOffRequests.get(id);
    if (!existing || existing.isDeleted || existing.status !== 'pending') {
      return undefined;
    }

    const now = new Date().toISOString();
    const updated: TimeOffRequest = {
      ...existing,
      status: 'approved',
      statusHistory: [
        ...existing.statusHistory,
        {
          from: 'pending',
          to: 'approved',
          changedAt: now,
          changedBy: userId,
          changedByDevice: deviceId,
        },
      ],
      approvedBy: userId,
      approvedByName: approverName,
      approvedAt: now,
      approvalNotes: notes,
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.timeOffRequests.put(updated);

    await syncQueueDB.add({
      type: 'update',
      entity: 'timeOffRequest',
      entityId: id,
      action: 'UPDATE',
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffRequests,
      maxAttempts: 5,
    });

    return updated;
  },

  async deny(
    id: string,
    denierName: string,
    reason: string,
    userId: string,
    deviceId: string
  ): Promise<TimeOffRequest | undefined> {
    if (!reason?.trim()) {
      throw new Error('Denial reason is required');
    }

    const existing = await db.timeOffRequests.get(id);
    if (!existing || existing.isDeleted || existing.status !== 'pending') {
      return undefined;
    }

    const now = new Date().toISOString();
    const updated: TimeOffRequest = {
      ...existing,
      status: 'denied',
      statusHistory: [
        ...existing.statusHistory,
        {
          from: 'pending',
          to: 'denied',
          changedAt: now,
          changedBy: userId,
          changedByDevice: deviceId,
          reason,
        },
      ],
      deniedBy: userId,
      deniedByName: denierName,
      deniedAt: now,
      denialReason: reason,
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.timeOffRequests.put(updated);

    await syncQueueDB.add({
      type: 'update',
      entity: 'timeOffRequest',
      entityId: id,
      action: 'UPDATE',
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffRequests,
      maxAttempts: 5,
    });

    return updated;
  },

  async cancel(
    id: string,
    reason: string | null,
    userId: string,
    deviceId: string
  ): Promise<TimeOffRequest | undefined> {
    const existing = await db.timeOffRequests.get(id);
    if (!existing || existing.isDeleted || existing.status !== 'pending') {
      return undefined;
    }

    const now = new Date().toISOString();
    const updated: TimeOffRequest = {
      ...existing,
      status: 'cancelled',
      statusHistory: [
        ...existing.statusHistory,
        {
          from: 'pending',
          to: 'cancelled',
          changedAt: now,
          changedBy: userId,
          changedByDevice: deviceId,
          reason: reason ?? undefined,
        },
      ],
      cancelledAt: now,
      cancelledBy: userId,
      cancellationReason: reason,
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.timeOffRequests.put(updated);

    await syncQueueDB.add({
      type: 'update',
      entity: 'timeOffRequest',
      entityId: id,
      action: 'UPDATE',
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.timeOffRequests,
      maxAttempts: 5,
    });

    return updated;
  },
};

// ============================================================
// BLOCKED TIME TYPES
// ============================================================

export const blockedTimeTypesDB = {
  async getAll(storeId: string): Promise<BlockedTimeType[]> {
    return db.blockedTimeTypes
      .where('storeId')
      .equals(storeId)
      .filter(t => !t.isDeleted && t.isActive)
      .sortBy('displayOrder');
  },

  async getAllIncludingInactive(storeId: string): Promise<BlockedTimeType[]> {
    return db.blockedTimeTypes
      .where('storeId')
      .equals(storeId)
      .filter(t => !t.isDeleted)
      .sortBy('displayOrder');
  },

  async getById(id: string): Promise<BlockedTimeType | undefined> {
    const type = await db.blockedTimeTypes.get(id);
    return type?.isDeleted ? undefined : type;
  },

  async create(
    input: CreateBlockedTimeTypeInput,
    userId: string,
    storeId: string,
    tenantId: string,
    deviceId: string
  ): Promise<BlockedTimeType> {
    const id = uuidv4();

    let displayOrder = input.displayOrder;
    if (displayOrder === undefined) {
      const existing = await db.blockedTimeTypes.where('storeId').equals(storeId).toArray();
      displayOrder = Math.max(0, ...existing.map(t => t.displayOrder)) + 1;
    }

    const type: BlockedTimeType = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, storeId),
      name: input.name,
      code: input.code ?? '',
      emoji: input.emoji,
      color: input.color,
      defaultDurationMinutes: input.defaultDurationMinutes ?? 0,
      isPaid: input.isPaid,
      blocksOnlineBooking: input.blocksOnlineBooking ?? true,
      blocksInStoreBooking: input.blocksInStoreBooking ?? true,
      displayOrder,
      isActive: input.isActive ?? true,
      isSystemDefault: false,
      requiresApproval: false,
    };

    await db.blockedTimeTypes.put(type);

    await syncQueueDB.add({
      type: 'create',
      entity: 'blockedTimeType',
      entityId: id,
      action: 'CREATE',
      payload: type,
      priority: SCHEDULE_SYNC_PRIORITIES.blockedTimeTypes,
      maxAttempts: 5,
    });

    return type;
  },

  async update(
    id: string,
    updates: UpdateBlockedTimeTypeInput,
    userId: string,
    deviceId: string
  ): Promise<BlockedTimeType | undefined> {
    const existing = await db.blockedTimeTypes.get(id);
    if (!existing || existing.isDeleted) return undefined;

    const now = new Date().toISOString();
    const updated: BlockedTimeType = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.blockedTimeTypes.put(updated);

    await syncQueueDB.add({
      type: 'update',
      entity: 'blockedTimeType',
      entityId: id,
      action: 'UPDATE',
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.blockedTimeTypes,
      maxAttempts: 5,
    });

    return updated;
  },

  async delete(id: string, userId: string, deviceId: string): Promise<boolean> {
    const existing = await db.blockedTimeTypes.get(id);
    if (!existing || existing.isDeleted) return false;
    if (existing.isSystemDefault) {
      throw new Error('Cannot delete system default blocked time type');
    }

    const now = new Date().toISOString();
    const deleted: BlockedTimeType = {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: userId,
      deletedByDevice: deviceId,
      tombstoneExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.blockedTimeTypes.put(deleted);

    await syncQueueDB.add({
      type: 'delete',
      entity: 'blockedTimeType',
      entityId: id,
      action: 'DELETE',
      payload: deleted,
      priority: SCHEDULE_SYNC_PRIORITIES.blockedTimeTypes,
      maxAttempts: 5,
    });

    return true;
  },

  async seedDefaults(
    storeId: string,
    tenantId: string,
    userId: string,
    deviceId: string
  ): Promise<BlockedTimeType[]> {
    const existing = await db.blockedTimeTypes.where('storeId').equals(storeId).count();
    if (existing > 0) return [];

    const types: BlockedTimeType[] = DEFAULT_BLOCKED_TIME_TYPES.map((t, index) => ({
      id: uuidv4(),
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, storeId),
      ...t,
      displayOrder: index + 1,
    }));

    await db.blockedTimeTypes.bulkPut(types);

    for (const type of types) {
      await syncQueueDB.add({
        type: 'create',
        entity: 'blockedTimeType',
        entityId: type.id,
        action: 'CREATE',
        payload: type,
        priority: SCHEDULE_SYNC_PRIORITIES.blockedTimeTypes,
        maxAttempts: 5,
      });
    }

    return types;
  },
};

// ============================================================
// BLOCKED TIME ENTRIES
// ============================================================

export const blockedTimeEntriesDB = {
  async getAll(storeId: string, filters?: {
    staffId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<BlockedTimeEntry[]> {
    let results = await db.blockedTimeEntries
      .where('storeId')
      .equals(storeId)
      .filter(e => !e.isDeleted)
      .toArray();

    if (filters?.staffId) {
      results = results.filter(e => e.staffId === filters.staffId);
    }
    if (filters?.startDate) {
      results = results.filter(e => e.endDateTime >= filters.startDate!);
    }
    if (filters?.endDate) {
      results = results.filter(e => e.startDateTime <= filters.endDate!);
    }

    return results.sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
  },

  async getById(id: string): Promise<BlockedTimeEntry | undefined> {
    const entry = await db.blockedTimeEntries.get(id);
    return entry?.isDeleted ? undefined : entry;
  },

  async getByStaffAndDate(staffId: string, date: string): Promise<BlockedTimeEntry[]> {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    return db.blockedTimeEntries
      .where('staffId')
      .equals(staffId)
      .filter(e => !e.isDeleted && e.startDateTime >= startOfDay && e.startDateTime <= endOfDay)
      .toArray();
  },

  async getBySeries(seriesId: string): Promise<BlockedTimeEntry[]> {
    return db.blockedTimeEntries
      .where('seriesId')
      .equals(seriesId)
      .filter(e => !e.isDeleted)
      .toArray();
  },

  async create(
    input: CreateBlockedTimeEntryInput,
    typeDetails: Pick<BlockedTimeType, 'name' | 'emoji' | 'color' | 'isPaid'>,
    userId: string,
    storeId: string,
    tenantId: string,
    deviceId: string,
    isManager: boolean
  ): Promise<BlockedTimeEntry> {
    const id = uuidv4();
    const seriesId = input.frequency !== 'once' ? uuidv4() : null;

    const startDateTime = new Date(input.startDateTime);
    const endDateTime = new Date(input.endDateTime);
    const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));

    const entry: BlockedTimeEntry = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, storeId),
      staffId: input.staffId,
      staffName: input.staffName,
      typeId: input.typeId,
      typeName: typeDetails.name,
      typeEmoji: typeDetails.emoji,
      typeColor: typeDetails.color,
      isPaid: typeDetails.isPaid,
      startDateTime: input.startDateTime,
      endDateTime: input.endDateTime,
      durationMinutes,
      frequency: input.frequency,
      repeatEndDate: input.repeatEndDate ?? null,
      repeatCount: input.repeatCount ?? null,
      seriesId,
      isRecurrenceException: false,
      originalDate: null,
      notes: input.notes ?? null,
      createdByStaffId: isManager ? null : userId,
      createdByManagerId: isManager ? userId : null,
    };

    await db.blockedTimeEntries.put(entry);

    await syncQueueDB.add({
      type: 'create',
      entity: 'blockedTimeEntry',
      entityId: id,
      action: 'CREATE',
      payload: entry,
      priority: SCHEDULE_SYNC_PRIORITIES.blockedTimeEntries,
      maxAttempts: 5,
    });

    return entry;
  },

  async delete(id: string, userId: string, deviceId: string): Promise<boolean> {
    const existing = await db.blockedTimeEntries.get(id);
    if (!existing || existing.isDeleted) return false;

    const now = new Date().toISOString();
    const deleted: BlockedTimeEntry = {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: userId,
      deletedByDevice: deviceId,
      tombstoneExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.blockedTimeEntries.put(deleted);

    await syncQueueDB.add({
      type: 'delete',
      entity: 'blockedTimeEntry',
      entityId: id,
      action: 'DELETE',
      payload: deleted,
      priority: SCHEDULE_SYNC_PRIORITIES.blockedTimeEntries,
      maxAttempts: 5,
    });

    return true;
  },

  async deleteSeries(seriesId: string, userId: string, deviceId: string): Promise<number> {
    const entries = await this.getBySeries(seriesId);
    let deleted = 0;
    for (const entry of entries) {
      const success = await this.delete(entry.id, userId, deviceId);
      if (success) deleted++;
    }
    return deleted;
  },
};

// ============================================================
// BUSINESS CLOSED PERIODS
// ============================================================

export const businessClosedPeriodsDB = {
  async getAll(storeId: string): Promise<BusinessClosedPeriod[]> {
    return db.businessClosedPeriods
      .where('storeId')
      .equals(storeId)
      .filter(p => !p.isDeleted)
      .sortBy('startDate');
  },

  async getById(id: string): Promise<BusinessClosedPeriod | undefined> {
    const period = await db.businessClosedPeriods.get(id);
    return period?.isDeleted ? undefined : period;
  },

  async getUpcoming(storeId: string): Promise<BusinessClosedPeriod[]> {
    const today = new Date().toISOString().split('T')[0];
    return db.businessClosedPeriods
      .where('storeId')
      .equals(storeId)
      .filter(p => !p.isDeleted && p.endDate >= today)
      .sortBy('startDate');
  },

  async getForDate(storeId: string, date: string): Promise<BusinessClosedPeriod | undefined> {
    return db.businessClosedPeriods
      .where('storeId')
      .equals(storeId)
      .filter(p => !p.isDeleted && p.startDate <= date && p.endDate >= date)
      .first();
  },

  async create(
    input: CreateBusinessClosedPeriodInput,
    userId: string,
    storeId: string,
    tenantId: string,
    deviceId: string
  ): Promise<BusinessClosedPeriod> {
    const id = uuidv4();

    const period: BusinessClosedPeriod = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, storeId),
      name: input.name,
      appliesToAllLocations: input.appliesToAllLocations,
      locationIds: input.locationIds ?? [],
      startDate: input.startDate,
      endDate: input.endDate,
      isPartialDay: input.isPartialDay ?? false,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      blocksOnlineBooking: input.blocksOnlineBooking ?? true,
      blocksInStoreBooking: input.blocksInStoreBooking ?? true,
      color: input.color ?? '#6B7280',
      notes: input.notes ?? null,
      isAnnual: input.isAnnual ?? false,
    };

    await db.businessClosedPeriods.put(period);

    await syncQueueDB.add({
      type: 'create',
      entity: 'businessClosedPeriod',
      entityId: id,
      action: 'CREATE',
      payload: period,
      priority: SCHEDULE_SYNC_PRIORITIES.businessClosedPeriods,
      maxAttempts: 5,
    });

    return period;
  },

  async update(
    id: string,
    updates: Partial<CreateBusinessClosedPeriodInput>,
    userId: string,
    deviceId: string
  ): Promise<BusinessClosedPeriod | undefined> {
    const existing = await db.businessClosedPeriods.get(id);
    if (!existing || existing.isDeleted) return undefined;

    const now = new Date().toISOString();
    const updated: BusinessClosedPeriod = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.businessClosedPeriods.put(updated);

    await syncQueueDB.add({
      type: 'update',
      entity: 'businessClosedPeriod',
      entityId: id,
      action: 'UPDATE',
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.businessClosedPeriods,
      maxAttempts: 5,
    });

    return updated;
  },

  async delete(id: string, userId: string, deviceId: string): Promise<boolean> {
    const existing = await db.businessClosedPeriods.get(id);
    if (!existing || existing.isDeleted) return false;

    const now = new Date().toISOString();
    const deleted: BusinessClosedPeriod = {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: userId,
      deletedByDevice: deviceId,
      tombstoneExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.businessClosedPeriods.put(deleted);

    await syncQueueDB.add({
      type: 'delete',
      entity: 'businessClosedPeriod',
      entityId: id,
      action: 'DELETE',
      payload: deleted,
      priority: SCHEDULE_SYNC_PRIORITIES.businessClosedPeriods,
      maxAttempts: 5,
    });

    return true;
  },
};

// ============================================================
// RESOURCES
// ============================================================

export const resourcesDB = {
  async getAll(storeId: string): Promise<Resource[]> {
    return db.resources
      .where('storeId')
      .equals(storeId)
      .filter(r => !r.isDeleted && r.isActive)
      .sortBy('displayOrder');
  },

  async getAllIncludingInactive(storeId: string): Promise<Resource[]> {
    return db.resources
      .where('storeId')
      .equals(storeId)
      .filter(r => !r.isDeleted)
      .sortBy('displayOrder');
  },

  async getById(id: string): Promise<Resource | undefined> {
    const resource = await db.resources.get(id);
    return resource?.isDeleted ? undefined : resource;
  },

  async getByCategory(storeId: string, category: string): Promise<Resource[]> {
    return db.resources
      .where('storeId')
      .equals(storeId)
      .filter(r => !r.isDeleted && r.isActive && r.category === category)
      .sortBy('displayOrder');
  },

  async create(
    input: CreateResourceInput,
    userId: string,
    storeId: string,
    tenantId: string,
    deviceId: string
  ): Promise<Resource> {
    const id = uuidv4();

    let displayOrder = input.displayOrder;
    if (displayOrder === undefined) {
      const existing = await db.resources.where('storeId').equals(storeId).toArray();
      displayOrder = Math.max(0, ...existing.map(r => r.displayOrder)) + 1;
    }

    const resource: Resource = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, storeId),
      name: input.name,
      description: input.description ?? null,
      category: input.category,
      capacity: input.capacity ?? 1,
      isBookable: input.isBookable ?? true,
      color: input.color ?? '#3B82F6',
      imageUrl: null,
      displayOrder,
      isActive: true,
      linkedServiceIds: input.linkedServiceIds ?? [],
    };

    await db.resources.put(resource);

    await syncQueueDB.add({
      type: 'create',
      entity: 'resource',
      entityId: id,
      action: 'CREATE',
      payload: resource,
      priority: SCHEDULE_SYNC_PRIORITIES.resources,
      maxAttempts: 5,
    });

    return resource;
  },

  async update(
    id: string,
    updates: UpdateResourceInput,
    userId: string,
    deviceId: string
  ): Promise<Resource | undefined> {
    const existing = await db.resources.get(id);
    if (!existing || existing.isDeleted) return undefined;

    const now = new Date().toISOString();
    const updated: Resource = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.resources.put(updated);

    await syncQueueDB.add({
      type: 'update',
      entity: 'resource',
      entityId: id,
      action: 'UPDATE',
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.resources,
      maxAttempts: 5,
    });

    return updated;
  },

  async delete(id: string, userId: string, deviceId: string): Promise<boolean> {
    const existing = await db.resources.get(id);
    if (!existing || existing.isDeleted) return false;

    const now = new Date().toISOString();
    const deleted: Resource = {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: userId,
      deletedByDevice: deviceId,
      tombstoneExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.resources.put(deleted);

    await syncQueueDB.add({
      type: 'delete',
      entity: 'resource',
      entityId: id,
      action: 'DELETE',
      payload: deleted,
      priority: SCHEDULE_SYNC_PRIORITIES.resources,
      maxAttempts: 5,
    });

    return true;
  },
};

// ============================================================
// RESOURCE BOOKINGS
// ============================================================

export const resourceBookingsDB = {
  async getByResource(resourceId: string, startDate: string, endDate: string): Promise<ResourceBooking[]> {
    return db.resourceBookings
      .where('resourceId')
      .equals(resourceId)
      .filter(b => !b.isDeleted && b.startDateTime >= startDate && b.startDateTime <= endDate)
      .toArray();
  },

  async getByAppointment(appointmentId: string): Promise<ResourceBooking | undefined> {
    return db.resourceBookings
      .where('appointmentId')
      .equals(appointmentId)
      .filter(b => !b.isDeleted)
      .first();
  },

  async getById(id: string): Promise<ResourceBooking | undefined> {
    const booking = await db.resourceBookings.get(id);
    return booking?.isDeleted ? undefined : booking;
  },

  async create(
    input: CreateResourceBookingInput,
    userId: string,
    storeId: string,
    tenantId: string,
    deviceId: string
  ): Promise<ResourceBooking> {
    const id = uuidv4();

    const booking: ResourceBooking = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, storeId),
      resourceId: input.resourceId,
      resourceName: input.resourceName,
      appointmentId: input.appointmentId,
      startDateTime: input.startDateTime,
      endDateTime: input.endDateTime,
      staffId: input.staffId,
      staffName: input.staffName,
      assignmentType: input.assignmentType,
      assignedBy: input.assignedBy ?? null,
    };

    await db.resourceBookings.put(booking);

    await syncQueueDB.add({
      type: 'create',
      entity: 'resourceBooking',
      entityId: id,
      action: 'CREATE',
      payload: booking,
      priority: SCHEDULE_SYNC_PRIORITIES.resourceBookings,
      maxAttempts: 5,
    });

    return booking;
  },

  async delete(id: string, userId: string, deviceId: string): Promise<boolean> {
    const existing = await db.resourceBookings.get(id);
    if (!existing || existing.isDeleted) return false;

    const now = new Date().toISOString();
    const deleted: ResourceBooking = {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: userId,
      deletedByDevice: deviceId,
      tombstoneExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.resourceBookings.put(deleted);

    await syncQueueDB.add({
      type: 'delete',
      entity: 'resourceBooking',
      entityId: id,
      action: 'DELETE',
      payload: deleted,
      priority: SCHEDULE_SYNC_PRIORITIES.resourceBookings,
      maxAttempts: 5,
    });

    return true;
  },
};

// ============================================================
// STAFF SCHEDULES
// ============================================================

export const staffSchedulesDB = {
  async getByStaff(staffId: string): Promise<StaffSchedule[]> {
    return db.staffSchedules
      .where('staffId')
      .equals(staffId)
      .filter(s => !s.isDeleted)
      .sortBy('effectiveFrom');
  },

  async getCurrentForStaff(staffId: string): Promise<StaffSchedule | undefined> {
    const today = new Date().toISOString().split('T')[0];
    return db.staffSchedules
      .where('staffId')
      .equals(staffId)
      .filter(s =>
        !s.isDeleted &&
        s.effectiveFrom <= today &&
        (!s.effectiveUntil || s.effectiveUntil >= today)
      )
      .first();
  },

  async getById(id: string): Promise<StaffSchedule | undefined> {
    const schedule = await db.staffSchedules.get(id);
    return schedule?.isDeleted ? undefined : schedule;
  },

  async getByStore(storeId: string): Promise<StaffSchedule[]> {
    return db.staffSchedules
      .where('storeId')
      .equals(storeId)
      .filter(s => !s.isDeleted)
      .toArray();
  },

  async create(
    input: CreateStaffScheduleInput,
    userId: string,
    storeId: string,
    tenantId: string,
    deviceId: string
  ): Promise<StaffSchedule> {
    const id = uuidv4();

    const schedule: StaffSchedule = {
      id,
      ...createBaseSyncableDefaults(userId, deviceId, tenantId, storeId),
      staffId: input.staffId,
      staffName: input.staffName,
      patternType: input.patternType,
      patternWeeks: input.patternWeeks,
      weeks: input.weeks,
      effectiveFrom: input.effectiveFrom,
      effectiveUntil: input.effectiveUntil ?? null,
      patternAnchorDate: input.patternAnchorDate ?? input.effectiveFrom,
      isDefault: false,
      copiedFromScheduleId: null,
    };

    await db.staffSchedules.put(schedule);

    await syncQueueDB.add({
      type: 'create',
      entity: 'staffSchedule',
      entityId: id,
      action: 'CREATE',
      payload: schedule,
      priority: SCHEDULE_SYNC_PRIORITIES.staffSchedules,
      maxAttempts: 5,
    });

    return schedule;
  },

  async update(
    id: string,
    updates: Partial<CreateStaffScheduleInput>,
    userId: string,
    deviceId: string
  ): Promise<StaffSchedule | undefined> {
    const existing = await db.staffSchedules.get(id);
    if (!existing || existing.isDeleted) return undefined;

    const now = new Date().toISOString();
    const updated: StaffSchedule = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.staffSchedules.put(updated);

    await syncQueueDB.add({
      type: 'update',
      entity: 'staffSchedule',
      entityId: id,
      action: 'UPDATE',
      payload: updated,
      priority: SCHEDULE_SYNC_PRIORITIES.staffSchedules,
      maxAttempts: 5,
    });

    return updated;
  },

  async delete(id: string, userId: string, deviceId: string): Promise<boolean> {
    const existing = await db.staffSchedules.get(id);
    if (!existing || existing.isDeleted) return false;

    const now = new Date().toISOString();
    const deleted: StaffSchedule = {
      ...existing,
      isDeleted: true,
      deletedAt: now,
      deletedBy: userId,
      deletedByDevice: deviceId,
      tombstoneExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      version: existing.version + 1,
      vectorClock: { ...existing.vectorClock, [deviceId]: existing.version + 1 },
      updatedAt: now,
      lastModifiedBy: userId,
      lastModifiedByDevice: deviceId,
      syncStatus: 'pending',
    };

    await db.staffSchedules.put(deleted);

    await syncQueueDB.add({
      type: 'delete',
      entity: 'staffSchedule',
      entityId: id,
      action: 'DELETE',
      payload: deleted,
      priority: SCHEDULE_SYNC_PRIORITIES.staffSchedules,
      maxAttempts: 5,
    });

    return true;
  },
};

// ============================================================
// SEEDING HELPER
// ============================================================

/**
 * Seed all default schedule data for a new store
 */
export async function seedScheduleDefaults(
  storeId: string,
  tenantId: string,
  userId: string,
  deviceId: string
): Promise<{
  timeOffTypes: TimeOffType[];
  blockedTimeTypes: BlockedTimeType[];
}> {
  const timeOffTypes = await timeOffTypesDB.seedDefaults(storeId, tenantId, userId, deviceId);
  const blockedTimeTypes = await blockedTimeTypesDB.seedDefaults(storeId, tenantId, userId, deviceId);

  return { timeOffTypes, blockedTimeTypes };
}
