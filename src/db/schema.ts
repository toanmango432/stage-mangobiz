import Dexie, { Table } from 'dexie';
import type {
  Appointment,
  Ticket,
  Transaction,
  Staff,
  Client,
  Service,
  SyncOperation,
  // Catalog types
  ServiceCategory,
  MenuService,
  ServiceVariant,
  ServicePackage,
  AddOnGroup,
  AddOnOption,
  StaffServiceAssignment,
  CatalogSettings
} from '../types';
import type { TeamMemberSettings } from '../components/team-settings/types';
import type {
  TimeOffType,
  TimeOffRequest,
  BlockedTimeType,
  BlockedTimeEntry,
  BusinessClosedPeriod,
  Resource,
  ResourceBooking,
  StaffSchedule
} from '../types/schedule';

export interface Settings {
  key: string;
  value: any;
}

export class MangoPOSDatabase extends Dexie {
  appointments!: Table<Appointment, string>;
  tickets!: Table<Ticket, string>;
  transactions!: Table<Transaction, string>;
  staff!: Table<Staff, string>;
  clients!: Table<Client, string>;
  services!: Table<Service, string>;
  settings!: Table<Settings, string>;
  syncQueue!: Table<SyncOperation, string>;
  // Team Settings tables
  teamMembers!: Table<TeamMemberSettings, string>;
  // Catalog tables
  serviceCategories!: Table<ServiceCategory, string>;
  menuServices!: Table<MenuService, string>;
  serviceVariants!: Table<ServiceVariant, string>;
  servicePackages!: Table<ServicePackage, string>;
  addOnGroups!: Table<AddOnGroup, string>;
  addOnOptions!: Table<AddOnOption, string>;
  staffServiceAssignments!: Table<StaffServiceAssignment, string>;
  catalogSettings!: Table<CatalogSettings, string>;
  // Schedule Module tables
  timeOffTypes!: Table<TimeOffType, string>;
  timeOffRequests!: Table<TimeOffRequest, string>;
  blockedTimeTypes!: Table<BlockedTimeType, string>;
  blockedTimeEntries!: Table<BlockedTimeEntry, string>;
  businessClosedPeriods!: Table<BusinessClosedPeriod, string>;
  resources!: Table<Resource, string>;
  resourceBookings!: Table<ResourceBooking, string>;
  staffSchedules!: Table<StaffSchedule, string>;

  constructor() {
    super('mango_biz_store_app');

    // Version 1: Original schema
    this.version(1).stores({
      appointments: 'id, salonId, clientId, staffId, status, scheduledStartTime, syncStatus, [salonId+status]',
      tickets: 'id, salonId, clientId, status, createdAt, syncStatus, appointmentId, [salonId+status]',
      transactions: 'id, salonId, ticketId, clientId, createdAt, syncStatus, status',
      staff: 'id, salonId, status, syncStatus, [salonId+status]',
      clients: 'id, salonId, phone, email, name, syncStatus',
      services: 'id, salonId, category, syncStatus, [salonId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity'
    });

    // Version 2: Add missing compound indexes for common queries
    this.version(2).stores({
      appointments: 'id, salonId, clientId, staffId, status, scheduledStartTime, syncStatus, [salonId+status], [salonId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, salonId, clientId, status, createdAt, syncStatus, appointmentId, [salonId+status], [salonId+createdAt], [clientId+createdAt]',
      transactions: 'id, salonId, ticketId, clientId, createdAt, syncStatus, status, [salonId+createdAt], [clientId+createdAt]',
      staff: 'id, salonId, status, syncStatus, [salonId+status]',
      clients: 'id, salonId, phone, email, name, syncStatus, [salonId+name], createdAt',
      services: 'id, salonId, category, syncStatus, [salonId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]'
    }).upgrade(tx => {
      // Migration will be handled automatically by Dexie
      console.log('✅ Database upgraded to version 2: Added compound indexes for better query performance');
    });

    // Version 3: Add Team Settings tables
    this.version(3).stores({
      appointments: 'id, salonId, clientId, staffId, status, scheduledStartTime, syncStatus, [salonId+status], [salonId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, salonId, clientId, status, createdAt, syncStatus, appointmentId, [salonId+status], [salonId+createdAt], [clientId+createdAt]',
      transactions: 'id, salonId, ticketId, clientId, createdAt, syncStatus, status, [salonId+createdAt], [clientId+createdAt]',
      staff: 'id, salonId, status, syncStatus, [salonId+status]',
      clients: 'id, salonId, phone, email, name, syncStatus, [salonId+name], createdAt',
      services: 'id, salonId, category, syncStatus, [salonId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      // Team Settings - comprehensive team member management
      teamMembers: 'id, profile.email, isActive, permissions.role, createdAt, updatedAt'
    }).upgrade(tx => {
      console.log('✅ Database upgraded to version 3: Added Team Settings tables');
    });

    // Version 4: Update teamMembers with production-ready indexes (BaseSyncableEntity pattern)
    // See: docs/DATA_STORAGE_STRATEGY.md and docs/TECHNICAL_DOCUMENTATION.md
    this.version(4).stores({
      appointments: 'id, salonId, clientId, staffId, status, scheduledStartTime, syncStatus, [salonId+status], [salonId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, salonId, clientId, status, createdAt, syncStatus, appointmentId, [salonId+status], [salonId+createdAt], [clientId+createdAt]',
      transactions: 'id, salonId, ticketId, clientId, createdAt, syncStatus, status, [salonId+createdAt], [clientId+createdAt]',
      staff: 'id, salonId, status, syncStatus, [salonId+status]',
      clients: 'id, salonId, phone, email, name, syncStatus, [salonId+name], createdAt',
      services: 'id, salonId, category, syncStatus, [salonId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      // Team Members - production-ready with storeId isolation and sync support
      // Indexes: id (primary), storeId, role, isActive, syncStatus, isDeleted
      // Compound indexes: [storeId+isActive], [storeId+role], [storeId+isDeleted], [storeId+syncStatus]
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]'
    }).upgrade(async tx => {
      console.log('✅ Database upgrading to version 4: Production-ready teamMembers schema');

      // Migrate existing teamMembers to include new BaseSyncableEntity fields
      const teamMembers = tx.table('teamMembers');
      const existingMembers = await teamMembers.toArray();

      for (const member of existingMembers) {
        // Add missing fields with defaults
        const updates: Record<string, any> = {};

        // Multi-tenant isolation
        if (!member.tenantId) updates.tenantId = 'default-tenant';
        if (!member.storeId) updates.storeId = 'default-store';

        // Sync metadata
        if (member.syncStatus === undefined) updates.syncStatus = 'local';
        if (member.version === undefined) updates.version = 1;
        if (!member.vectorClock) updates.vectorClock = {};
        if (member.lastSyncedVersion === undefined) updates.lastSyncedVersion = 0;

        // Audit trail
        if (!member.createdBy) updates.createdBy = 'migration';
        if (!member.createdByDevice) updates.createdByDevice = 'migration';
        if (!member.lastModifiedBy) updates.lastModifiedBy = 'migration';
        if (!member.lastModifiedByDevice) updates.lastModifiedByDevice = 'migration';

        // Soft delete
        if (member.isDeleted === undefined) updates.isDeleted = false;

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
          await teamMembers.update(member.id, updates);
        }
      }

      console.log(`✅ Migrated ${existingMembers.length} team members to v4 schema`);
    });

    // Version 5: Add Catalog Module tables
    // See: docs/PRD-Catalog-Module.md and docs/IMPLEMENTATION-PLAN-Catalog-Module.md
    this.version(5).stores({
      // Existing tables (unchanged)
      appointments: 'id, salonId, clientId, staffId, status, scheduledStartTime, syncStatus, [salonId+status], [salonId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, salonId, clientId, status, createdAt, syncStatus, appointmentId, [salonId+status], [salonId+createdAt], [clientId+createdAt]',
      transactions: 'id, salonId, ticketId, clientId, createdAt, syncStatus, status, [salonId+createdAt], [clientId+createdAt]',
      staff: 'id, salonId, status, syncStatus, [salonId+status]',
      clients: 'id, salonId, phone, email, name, syncStatus, [salonId+name], createdAt',
      services: 'id, salonId, category, syncStatus, [salonId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',

      // Catalog Module tables
      // Service Categories - hierarchical category management
      serviceCategories: 'id, salonId, parentCategoryId, displayOrder, isActive, syncStatus, [salonId+isActive], [salonId+displayOrder]',

      // Menu Services - enhanced services with variants support
      menuServices: 'id, salonId, categoryId, status, displayOrder, syncStatus, [salonId+categoryId], [salonId+status], [categoryId+displayOrder]',

      // Service Variants - pricing/duration variations for services
      serviceVariants: 'id, salonId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',

      // Service Packages/Bundles - grouped service offerings
      servicePackages: 'id, salonId, isActive, displayOrder, syncStatus, [salonId+isActive], [salonId+displayOrder]',

      // Add-on Groups - groups of optional add-ons
      addOnGroups: 'id, salonId, isActive, displayOrder, syncStatus, [salonId+isActive]',

      // Add-on Options - individual add-on items within groups
      addOnOptions: 'id, salonId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',

      // Staff-Service Assignments - which staff can perform which services
      staffServiceAssignments: 'id, salonId, staffId, serviceId, isActive, syncStatus, [salonId+staffId], [salonId+serviceId], [staffId+serviceId]',

      // Catalog Settings - per-salon catalog configuration
      catalogSettings: 'id, salonId, syncStatus'
    }).upgrade(tx => {
      console.log('✅ Database upgraded to version 5: Added Catalog Module tables');
    });

    // Version 6: Add Schedule Module tables
    // See: tasks/SCHEDULE_MODULE_PRD.md and tasks/SCHEDULE_MODULE_IMPLEMENTATION_PLAN.md
    this.version(6).stores({
      // Existing tables (unchanged)
      appointments: 'id, salonId, clientId, staffId, status, scheduledStartTime, syncStatus, [salonId+status], [salonId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, salonId, clientId, status, createdAt, syncStatus, appointmentId, [salonId+status], [salonId+createdAt], [clientId+createdAt]',
      transactions: 'id, salonId, ticketId, clientId, createdAt, syncStatus, status, [salonId+createdAt], [clientId+createdAt]',
      staff: 'id, salonId, status, syncStatus, [salonId+status]',
      clients: 'id, salonId, phone, email, name, syncStatus, [salonId+name], createdAt',
      services: 'id, salonId, category, syncStatus, [salonId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',
      // Catalog Module tables (unchanged)
      serviceCategories: 'id, salonId, parentCategoryId, displayOrder, isActive, syncStatus, [salonId+isActive], [salonId+displayOrder]',
      menuServices: 'id, salonId, categoryId, status, displayOrder, syncStatus, [salonId+categoryId], [salonId+status], [categoryId+displayOrder]',
      serviceVariants: 'id, salonId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',
      servicePackages: 'id, salonId, isActive, displayOrder, syncStatus, [salonId+isActive], [salonId+displayOrder]',
      addOnGroups: 'id, salonId, isActive, displayOrder, syncStatus, [salonId+isActive]',
      addOnOptions: 'id, salonId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',
      staffServiceAssignments: 'id, salonId, staffId, serviceId, isActive, syncStatus, [salonId+staffId], [salonId+serviceId], [staffId+serviceId]',
      catalogSettings: 'id, salonId, syncStatus',

      // Schedule Module tables
      // Time-Off Types - configurable time-off categories
      timeOffTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',

      // Time-Off Requests - staff time-off requests with approval workflow
      timeOffRequests: 'id, storeId, staffId, typeId, status, startDate, endDate, syncStatus, [storeId+status], [storeId+startDate], [staffId+status], [staffId+startDate], [storeId+staffId+status]',

      // Blocked Time Types - configurable blocked time categories
      blockedTimeTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',

      // Blocked Time Entries - specific blocked time slots on staff calendars
      blockedTimeEntries: 'id, storeId, staffId, typeId, startDateTime, endDateTime, frequency, seriesId, syncStatus, [storeId+staffId], [staffId+startDateTime], [storeId+startDateTime], [seriesId]',

      // Business Closed Periods - business-wide closure periods
      businessClosedPeriods: 'id, storeId, startDate, endDate, isAnnual, syncStatus, [storeId+startDate], [storeId+endDate]',

      // Resources - bookable physical assets (rooms, equipment, stations)
      resources: 'id, storeId, category, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+category]',

      // Resource Bookings - resource assignments to appointments
      resourceBookings: 'id, storeId, resourceId, appointmentId, startDateTime, syncStatus, [resourceId+startDateTime], [appointmentId], [storeId+startDateTime]',

      // Staff Schedules - staff working patterns (1-4 week rotating)
      staffSchedules: 'id, storeId, staffId, effectiveFrom, effectiveUntil, syncStatus, [storeId+staffId], [staffId+effectiveFrom]'
    }).upgrade(tx => {
      console.log('✅ Database upgraded to version 6: Added Schedule Module tables');
    });
  }
}

// Create singleton instance
export const db = new MangoPOSDatabase();

// Initialize database
export async function initializeDatabase() {
  try {
    await db.open();
    console.log('✅ IndexedDB initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize IndexedDB:', error);
    return false;
  }
}

// Clear all data (for testing)
export async function clearDatabase() {
  await db.appointments.clear();
  await db.tickets.clear();
  await db.transactions.clear();
  await db.staff.clear();
  await db.clients.clear();
  await db.services.clear();
  await db.settings.clear();
  await db.syncQueue.clear();
  await db.teamMembers.clear();
  // Catalog tables
  await db.serviceCategories.clear();
  await db.menuServices.clear();
  await db.serviceVariants.clear();
  await db.servicePackages.clear();
  await db.addOnGroups.clear();
  await db.addOnOptions.clear();
  await db.staffServiceAssignments.clear();
  await db.catalogSettings.clear();
  // Schedule tables
  await db.timeOffTypes.clear();
  await db.timeOffRequests.clear();
  await db.blockedTimeTypes.clear();
  await db.blockedTimeEntries.clear();
  await db.businessClosedPeriods.clear();
  await db.resources.clear();
  await db.resourceBookings.clear();
  await db.staffSchedules.clear();
  console.log('🗑️  Database cleared');
}
