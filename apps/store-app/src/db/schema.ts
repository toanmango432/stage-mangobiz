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
  CatalogSettings,
  GiftCardDenomination,
  GiftCardSettings,
  // Gift Card types (full gift card support)
  GiftCard,
  GiftCardTransaction,
  GiftCardDesign,
  // Inventory types (Products)
  Product,
  // Client module types
  PatchTest,
  FormTemplate,
  ClientFormResponse,
  Referral,
  ClientReview,
  LoyaltyReward,
  ReviewRequest,
  CustomSegment,
  // Timesheet types (Phase 2: Time & Attendance)
  TimesheetEntry,
  // Payroll types (Phase 3: Payroll & Pay Runs)
  PayRun,
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
import type { DeviceMode } from '../types/device';

export interface Settings {
  key: string;
  value: any;
}

// Device Settings for Opt-In Offline Mode
export interface DeviceSettingsRecord {
  deviceId: string;
  mode: DeviceMode;
  offlineModeEnabled: boolean;
  lastSyncAt?: string;
  registeredAt?: string;
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
  // Products table (for retail catalog)
  products!: Table<Product, string>;
  // Schedule Module tables
  timeOffTypes!: Table<TimeOffType, string>;
  timeOffRequests!: Table<TimeOffRequest, string>;
  blockedTimeTypes!: Table<BlockedTimeType, string>;
  blockedTimeEntries!: Table<BlockedTimeEntry, string>;
  businessClosedPeriods!: Table<BusinessClosedPeriod, string>;
  resources!: Table<Resource, string>;
  resourceBookings!: Table<ResourceBooking, string>;
  staffSchedules!: Table<StaffSchedule, string>;
  // Device Settings for Opt-In Offline Mode
  deviceSettings!: Table<DeviceSettingsRecord, string>;

  // Client module tables (PRD v4.2)
  patchTests!: Table<PatchTest, string>;
  formTemplates!: Table<FormTemplate, string>;
  formResponses!: Table<ClientFormResponse, string>;
  referrals!: Table<Referral, string>;
  clientReviews!: Table<ClientReview, string>;
  loyaltyRewards!: Table<LoyaltyReward, string>;

  // Timesheet tables (Phase 2: Time & Attendance)
  timesheets!: Table<TimesheetEntry, string>;

  // Payroll tables (Phase 3: Payroll & Pay Runs)
  payRuns!: Table<PayRun, string>;

  // Review requests table (Client Module PRD 2.3.9)
  reviewRequests!: Table<ReviewRequest, string>;

  // Custom segments table (Client Module PRD 2.3.10)
  customSegments!: Table<CustomSegment, string>;

  // Gift Card tables (Catalog Module - PRD-Menu-Settings-Module.md)
  giftCardDenominations!: Table<GiftCardDenomination, string>;
  giftCardSettings!: Table<GiftCardSettings, string>;

  // Gift Card tables (Full Gift Card Module)
  giftCards!: Table<GiftCard, string>;
  giftCardTransactions!: Table<GiftCardTransaction, string>;
  giftCardDesigns!: Table<GiftCardDesign, string>;

  constructor() {
    super('mango_biz_store_app');

    // Version 1: Original schema
    this.version(1).stores({
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, name, syncStatus',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity'
    });

    // Version 2: Add missing compound indexes for common queries
    this.version(2).stores({
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, name, syncStatus, [storeId+name], createdAt',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]'
    }).upgrade(() => {
      // Migration will be handled automatically by Dexie
      console.log('✅ Database upgraded to version 2: Added compound indexes for better query performance');
    });

    // Version 3: Add Team Settings tables
    this.version(3).stores({
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, name, syncStatus, [storeId+name], createdAt',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      // Team Settings - comprehensive team member management
      teamMembers: 'id, profile.email, isActive, permissions.role, createdAt, updatedAt'
    }).upgrade(() => {
      console.log('✅ Database upgraded to version 3: Added Team Settings tables');
    });

    // Version 4: Update teamMembers with production-ready indexes (BaseSyncableEntity pattern)
    // See: docs/DATA_STORAGE_STRATEGY.md and docs/TECHNICAL_DOCUMENTATION.md
    this.version(4).stores({
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, name, syncStatus, [storeId+name], createdAt',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
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
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, name, syncStatus, [storeId+name], createdAt',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',

      // Catalog Module tables
      // Service Categories - hierarchical category management
      serviceCategories: 'id, storeId, parentCategoryId, displayOrder, isActive, syncStatus, [storeId+isActive], [storeId+displayOrder]',

      // Menu Services - enhanced services with variants support
      menuServices: 'id, storeId, categoryId, status, displayOrder, syncStatus, [storeId+categoryId], [storeId+status], [categoryId+displayOrder]',

      // Service Variants - pricing/duration variations for services
      serviceVariants: 'id, storeId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',

      // Service Packages/Bundles - grouped service offerings
      servicePackages: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',

      // Add-on Groups - groups of optional add-ons
      addOnGroups: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive]',

      // Add-on Options - individual add-on items within groups
      addOnOptions: 'id, storeId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',

      // Staff-Service Assignments - which staff can perform which services
      staffServiceAssignments: 'id, storeId, staffId, serviceId, isActive, syncStatus, [storeId+staffId], [storeId+serviceId], [staffId+serviceId]',

      // Catalog Settings - per-salon catalog configuration
      catalogSettings: 'id, storeId, syncStatus'
    }).upgrade(() => {
      console.log('✅ Database upgraded to version 5: Added Catalog Module tables');
    });

    // Version 6: Add Schedule Module tables
    // See: tasks/SCHEDULE_MODULE_PRD.md and tasks/SCHEDULE_MODULE_IMPLEMENTATION_PLAN.md
    this.version(6).stores({
      // Existing tables (unchanged)
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, name, syncStatus, [storeId+name], createdAt',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',
      // Catalog Module tables (unchanged)
      serviceCategories: 'id, storeId, parentCategoryId, displayOrder, isActive, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      menuServices: 'id, storeId, categoryId, status, displayOrder, syncStatus, [storeId+categoryId], [storeId+status], [categoryId+displayOrder]',
      serviceVariants: 'id, storeId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',
      servicePackages: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      addOnGroups: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive]',
      addOnOptions: 'id, storeId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',
      staffServiceAssignments: 'id, storeId, staffId, serviceId, isActive, syncStatus, [storeId+staffId], [storeId+serviceId], [staffId+serviceId]',
      catalogSettings: 'id, storeId, syncStatus',

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
    }).upgrade(() => {
      console.log('✅ Database upgraded to version 6: Added Schedule Module tables');
    });

    // Version 7: Add Device Settings for Opt-In Offline Mode
    // See: docs/product/PRD-Opt-In-Offline-Mode.md
    this.version(7).stores({
      // All existing tables unchanged
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, name, syncStatus, [storeId+name], createdAt',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',
      serviceCategories: 'id, storeId, parentCategoryId, displayOrder, isActive, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      menuServices: 'id, storeId, categoryId, status, displayOrder, syncStatus, [storeId+categoryId], [storeId+status], [categoryId+displayOrder]',
      serviceVariants: 'id, storeId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',
      servicePackages: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      addOnGroups: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive]',
      addOnOptions: 'id, storeId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',
      staffServiceAssignments: 'id, storeId, staffId, serviceId, isActive, syncStatus, [storeId+staffId], [storeId+serviceId], [staffId+serviceId]',
      catalogSettings: 'id, storeId, syncStatus',
      timeOffTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      timeOffRequests: 'id, storeId, staffId, typeId, status, startDate, endDate, syncStatus, [storeId+status], [storeId+startDate], [staffId+status], [staffId+startDate], [storeId+staffId+status]',
      blockedTimeTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      blockedTimeEntries: 'id, storeId, staffId, typeId, startDateTime, endDateTime, frequency, seriesId, syncStatus, [storeId+staffId], [staffId+startDateTime], [storeId+startDateTime], [seriesId]',
      businessClosedPeriods: 'id, storeId, startDate, endDate, isAnnual, syncStatus, [storeId+startDate], [storeId+endDate]',
      resources: 'id, storeId, category, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+category]',
      resourceBookings: 'id, storeId, resourceId, appointmentId, startDateTime, syncStatus, [resourceId+startDateTime], [appointmentId], [storeId+startDateTime]',
      staffSchedules: 'id, storeId, staffId, effectiveFrom, effectiveUntil, syncStatus, [storeId+staffId], [staffId+effectiveFrom]',

      // Device Settings - stores device mode configuration locally
      // Used to persist device mode across sessions without requiring server
      deviceSettings: 'deviceId'
    }).upgrade(() => {
      console.log('✅ Database upgraded to version 7: Added Device Settings for Opt-In Offline Mode');
    });

    // Version 8: Add Client Module tables (PRD v4.2)
    this.version(8).stores({
      // All existing tables unchanged
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      // Updated clients with new indexes for blocking, sorting, filtering
      clients: 'id, storeId, phone, email, firstName, lastName, isBlocked, isVip, syncStatus, createdAt, [storeId+lastName], [storeId+isBlocked], [storeId+isVip], [storeId+createdAt]',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',
      serviceCategories: 'id, storeId, parentCategoryId, displayOrder, isActive, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      menuServices: 'id, storeId, categoryId, status, displayOrder, syncStatus, [storeId+categoryId], [storeId+status], [categoryId+displayOrder]',
      serviceVariants: 'id, storeId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',
      servicePackages: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      addOnGroups: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive]',
      addOnOptions: 'id, storeId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',
      staffServiceAssignments: 'id, storeId, staffId, serviceId, isActive, syncStatus, [storeId+staffId], [storeId+serviceId], [staffId+serviceId]',
      catalogSettings: 'id, storeId, syncStatus',
      timeOffTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      timeOffRequests: 'id, storeId, staffId, typeId, status, startDate, endDate, syncStatus, [storeId+status], [storeId+startDate], [staffId+status], [staffId+startDate], [storeId+staffId+status]',
      blockedTimeTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      blockedTimeEntries: 'id, storeId, staffId, typeId, startDateTime, endDateTime, frequency, seriesId, syncStatus, [storeId+staffId], [staffId+startDateTime], [storeId+startDateTime], [seriesId]',
      businessClosedPeriods: 'id, storeId, startDate, endDate, isAnnual, syncStatus, [storeId+startDate], [storeId+endDate]',
      resources: 'id, storeId, category, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+category]',
      resourceBookings: 'id, storeId, resourceId, appointmentId, startDateTime, syncStatus, [resourceId+startDateTime], [appointmentId], [storeId+startDateTime]',
      staffSchedules: 'id, storeId, staffId, effectiveFrom, effectiveUntil, syncStatus, [storeId+staffId], [staffId+effectiveFrom]',
      deviceSettings: 'deviceId',
      // Client module tables
      patchTests: 'id, clientId, serviceId, testDate, result, expiresAt, syncStatus, [clientId+serviceId], [clientId+expiresAt]',
      formTemplates: 'id, storeId, name, isActive, syncStatus, [storeId+isActive]',
      formResponses: 'id, formTemplateId, clientId, appointmentId, status, completedAt, syncStatus, [clientId+status], [clientId+completedAt]',
      referrals: 'id, referrerClientId, referredClientId, createdAt, syncStatus, [referrerClientId+createdAt]',
      clientReviews: 'id, clientId, appointmentId, staffId, rating, platform, createdAt, syncStatus, [clientId+createdAt], [staffId+rating]',
      loyaltyRewards: 'id, clientId, type, redeemedAt, expiresAt, syncStatus, [clientId+redeemedAt]'
    }).upgrade(() => {
      console.log('✅ Database upgraded to version 8: Added Client Module tables');
    });

    // Version 9: Add Timesheet tables (Phase 2: Time & Attendance)
    // See: docs/product/PRD-Team-Module.md Section 6.4
    // See: tasks/PHASE2-TIME-ATTENDANCE-BREAKDOWN.md
    this.version(9).stores({
      // All existing tables unchanged
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, firstName, lastName, isBlocked, isVip, syncStatus, createdAt, [storeId+lastName], [storeId+isBlocked], [storeId+isVip], [storeId+createdAt]',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',
      serviceCategories: 'id, storeId, parentCategoryId, displayOrder, isActive, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      menuServices: 'id, storeId, categoryId, status, displayOrder, syncStatus, [storeId+categoryId], [storeId+status], [categoryId+displayOrder]',
      serviceVariants: 'id, storeId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',
      servicePackages: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      addOnGroups: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive]',
      addOnOptions: 'id, storeId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',
      staffServiceAssignments: 'id, storeId, staffId, serviceId, isActive, syncStatus, [storeId+staffId], [storeId+serviceId], [staffId+serviceId]',
      catalogSettings: 'id, storeId, syncStatus',
      timeOffTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      timeOffRequests: 'id, storeId, staffId, typeId, status, startDate, endDate, syncStatus, [storeId+status], [storeId+startDate], [staffId+status], [staffId+startDate], [storeId+staffId+status]',
      blockedTimeTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      blockedTimeEntries: 'id, storeId, staffId, typeId, startDateTime, endDateTime, frequency, seriesId, syncStatus, [storeId+staffId], [staffId+startDateTime], [storeId+startDateTime], [seriesId]',
      businessClosedPeriods: 'id, storeId, startDate, endDate, isAnnual, syncStatus, [storeId+startDate], [storeId+endDate]',
      resources: 'id, storeId, category, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+category]',
      resourceBookings: 'id, storeId, resourceId, appointmentId, startDateTime, syncStatus, [resourceId+startDateTime], [appointmentId], [storeId+startDateTime]',
      staffSchedules: 'id, storeId, staffId, effectiveFrom, effectiveUntil, syncStatus, [storeId+staffId], [staffId+effectiveFrom]',
      deviceSettings: 'deviceId',
      patchTests: 'id, clientId, serviceId, testDate, result, expiresAt, syncStatus, [clientId+serviceId], [clientId+expiresAt]',
      formTemplates: 'id, storeId, name, isActive, syncStatus, [storeId+isActive]',
      formResponses: 'id, formTemplateId, clientId, appointmentId, status, completedAt, syncStatus, [clientId+status], [clientId+completedAt]',
      referrals: 'id, referrerClientId, referredClientId, createdAt, syncStatus, [referrerClientId+createdAt]',
      clientReviews: 'id, clientId, appointmentId, staffId, rating, platform, createdAt, syncStatus, [clientId+createdAt], [staffId+rating]',
      loyaltyRewards: 'id, clientId, type, redeemedAt, expiresAt, syncStatus, [clientId+redeemedAt]',

      // Timesheet tables (Phase 2: Time & Attendance)
      // Indexes optimized for:
      // - Fetching timesheets by staff and date range
      // - Filtering by status for approval workflow
      // - Sync queue processing
      timesheets: 'id, storeId, staffId, date, status, syncStatus, isDeleted, [storeId+date], [staffId+date], [storeId+staffId], [storeId+status], [storeId+syncStatus]'
    }).upgrade(() => {
      console.log('✅ Database upgraded to version 9: Added Timesheet tables (Phase 2: Time & Attendance)');
    });

    // Version 10: Add Payroll tables (Phase 3: Payroll & Pay Runs)
    // See: docs/product/PRD-Team-Module.md Section 6.6
    this.version(10).stores({
      // All existing tables unchanged
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, firstName, lastName, isBlocked, isVip, syncStatus, createdAt, [storeId+lastName], [storeId+isBlocked], [storeId+isVip], [storeId+createdAt]',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',
      serviceCategories: 'id, storeId, parentCategoryId, displayOrder, isActive, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      menuServices: 'id, storeId, categoryId, status, displayOrder, syncStatus, [storeId+categoryId], [storeId+status], [categoryId+displayOrder]',
      serviceVariants: 'id, storeId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',
      servicePackages: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      addOnGroups: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive]',
      addOnOptions: 'id, storeId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',
      staffServiceAssignments: 'id, storeId, staffId, serviceId, isActive, syncStatus, [storeId+staffId], [storeId+serviceId], [staffId+serviceId]',
      catalogSettings: 'id, storeId, syncStatus',
      timeOffTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      timeOffRequests: 'id, storeId, staffId, typeId, status, startDate, endDate, syncStatus, [storeId+status], [storeId+startDate], [staffId+status], [staffId+startDate], [storeId+staffId+status]',
      blockedTimeTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      blockedTimeEntries: 'id, storeId, staffId, typeId, startDateTime, endDateTime, frequency, seriesId, syncStatus, [storeId+staffId], [staffId+startDateTime], [storeId+startDateTime], [seriesId]',
      businessClosedPeriods: 'id, storeId, startDate, endDate, isAnnual, syncStatus, [storeId+startDate], [storeId+endDate]',
      resources: 'id, storeId, category, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+category]',
      resourceBookings: 'id, storeId, resourceId, appointmentId, startDateTime, syncStatus, [resourceId+startDateTime], [appointmentId], [storeId+startDateTime]',
      staffSchedules: 'id, storeId, staffId, effectiveFrom, effectiveUntil, syncStatus, [storeId+staffId], [staffId+effectiveFrom]',
      deviceSettings: 'deviceId',
      patchTests: 'id, clientId, serviceId, testDate, result, expiresAt, syncStatus, [clientId+serviceId], [clientId+expiresAt]',
      formTemplates: 'id, storeId, name, isActive, syncStatus, [storeId+isActive]',
      formResponses: 'id, formTemplateId, clientId, appointmentId, status, completedAt, syncStatus, [clientId+status], [clientId+completedAt]',
      referrals: 'id, referrerClientId, referredClientId, createdAt, syncStatus, [referrerClientId+createdAt]',
      clientReviews: 'id, clientId, appointmentId, staffId, rating, platform, createdAt, syncStatus, [clientId+createdAt], [staffId+rating]',
      loyaltyRewards: 'id, clientId, type, redeemedAt, expiresAt, syncStatus, [clientId+redeemedAt]',
      timesheets: 'id, storeId, staffId, date, status, syncStatus, isDeleted, [storeId+date], [staffId+date], [storeId+staffId], [storeId+status], [storeId+syncStatus]',

      // Payroll tables (Phase 3: Payroll & Pay Runs)
      // Indexes optimized for:
      // - Fetching pay runs by date range
      // - Filtering by status for approval workflow
      // - Sync queue processing
      payRuns: 'id, storeId, periodStart, periodEnd, status, syncStatus, isDeleted, [storeId+periodStart], [storeId+status], [storeId+syncStatus]'
    }).upgrade(() => {
      console.log('✅ Database upgraded to version 10: Added Payroll tables (Phase 3: Payroll & Pay Runs)');
    });

    // Version 11: Add Review Requests table (Client Module PRD 2.3.9)
    this.version(11).stores({
      // All existing tables unchanged
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, firstName, lastName, isBlocked, isVip, syncStatus, createdAt, [storeId+lastName], [storeId+isBlocked], [storeId+isVip], [storeId+createdAt]',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',
      serviceCategories: 'id, storeId, parentCategoryId, displayOrder, isActive, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      menuServices: 'id, storeId, categoryId, status, displayOrder, syncStatus, [storeId+categoryId], [storeId+status], [categoryId+displayOrder]',
      serviceVariants: 'id, storeId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',
      servicePackages: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      addOnGroups: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive]',
      addOnOptions: 'id, storeId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',
      staffServiceAssignments: 'id, storeId, staffId, serviceId, isActive, syncStatus, [storeId+staffId], [storeId+serviceId], [staffId+serviceId]',
      catalogSettings: 'id, storeId, syncStatus',
      timeOffTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      timeOffRequests: 'id, storeId, staffId, typeId, status, startDate, endDate, syncStatus, [storeId+status], [storeId+startDate], [staffId+status], [staffId+startDate], [storeId+staffId+status]',
      blockedTimeTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      blockedTimeEntries: 'id, storeId, staffId, typeId, startDateTime, endDateTime, frequency, seriesId, syncStatus, [storeId+staffId], [staffId+startDateTime], [storeId+startDateTime], [seriesId]',
      businessClosedPeriods: 'id, storeId, startDate, endDate, isAnnual, syncStatus, [storeId+startDate], [storeId+endDate]',
      resources: 'id, storeId, category, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+category]',
      resourceBookings: 'id, storeId, resourceId, appointmentId, startDateTime, syncStatus, [resourceId+startDateTime], [appointmentId], [storeId+startDateTime]',
      staffSchedules: 'id, storeId, staffId, effectiveFrom, effectiveUntil, syncStatus, [storeId+staffId], [staffId+effectiveFrom]',
      deviceSettings: 'deviceId',
      patchTests: 'id, clientId, serviceId, testDate, result, expiresAt, syncStatus, [clientId+serviceId], [clientId+expiresAt]',
      formTemplates: 'id, storeId, name, isActive, syncStatus, [storeId+isActive]',
      formResponses: 'id, formTemplateId, clientId, appointmentId, status, completedAt, syncStatus, [clientId+status], [clientId+completedAt]',
      referrals: 'id, referrerClientId, referredClientId, createdAt, syncStatus, [referrerClientId+createdAt]',
      clientReviews: 'id, clientId, appointmentId, staffId, rating, platform, createdAt, syncStatus, [clientId+createdAt], [staffId+rating]',
      loyaltyRewards: 'id, clientId, type, redeemedAt, expiresAt, syncStatus, [clientId+redeemedAt]',
      timesheets: 'id, storeId, staffId, date, status, syncStatus, isDeleted, [storeId+date], [staffId+date], [storeId+staffId], [storeId+status], [storeId+syncStatus]',
      payRuns: 'id, storeId, periodStart, periodEnd, status, syncStatus, isDeleted, [storeId+periodStart], [storeId+status], [storeId+syncStatus]',

      // Review Requests table (Client Module PRD 2.3.9)
      // Indexes optimized for:
      // - Fetching requests by client
      // - Filtering by status for follow-up
      // - Date-based queries for scheduling
      reviewRequests: 'id, storeId, clientId, appointmentId, staffId, status, sentAt, createdAt, syncStatus, [storeId+status], [clientId+status], [storeId+createdAt], [staffId+createdAt]'
    }).upgrade(() => {
      console.log('✅ Database upgraded to version 11: Added Review Requests table (Client Module PRD 2.3.9)');
    });

    // Version 12: Add Custom Segments table (Client Module PRD 2.3.10)
    this.version(12).stores({
      // All existing tables unchanged
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, firstName, lastName, isBlocked, isVip, syncStatus, createdAt, [storeId+lastName], [storeId+isBlocked], [storeId+isVip], [storeId+createdAt]',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',
      serviceCategories: 'id, storeId, parentCategoryId, displayOrder, isActive, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      menuServices: 'id, storeId, categoryId, status, displayOrder, syncStatus, [storeId+categoryId], [storeId+status], [categoryId+displayOrder]',
      serviceVariants: 'id, storeId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',
      servicePackages: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      addOnGroups: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive]',
      addOnOptions: 'id, storeId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',
      staffServiceAssignments: 'id, storeId, staffId, serviceId, isActive, syncStatus, [storeId+staffId], [storeId+serviceId], [staffId+serviceId]',
      catalogSettings: 'id, storeId, syncStatus',
      timeOffTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      timeOffRequests: 'id, storeId, staffId, typeId, status, startDate, endDate, syncStatus, [storeId+status], [storeId+startDate], [staffId+status], [staffId+startDate], [storeId+staffId+status]',
      blockedTimeTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      blockedTimeEntries: 'id, storeId, staffId, typeId, startDateTime, endDateTime, frequency, seriesId, syncStatus, [storeId+staffId], [staffId+startDateTime], [storeId+startDateTime], [seriesId]',
      businessClosedPeriods: 'id, storeId, startDate, endDate, isAnnual, syncStatus, [storeId+startDate], [storeId+endDate]',
      resources: 'id, storeId, category, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+category]',
      resourceBookings: 'id, storeId, resourceId, appointmentId, startDateTime, syncStatus, [resourceId+startDateTime], [appointmentId], [storeId+startDateTime]',
      staffSchedules: 'id, storeId, staffId, effectiveFrom, effectiveUntil, syncStatus, [storeId+staffId], [staffId+effectiveFrom]',
      deviceSettings: 'deviceId',
      patchTests: 'id, clientId, serviceId, testDate, result, expiresAt, syncStatus, [clientId+serviceId], [clientId+expiresAt]',
      formTemplates: 'id, storeId, name, isActive, syncStatus, [storeId+isActive]',
      formResponses: 'id, formTemplateId, clientId, appointmentId, status, completedAt, syncStatus, [clientId+status], [clientId+completedAt]',
      referrals: 'id, referrerClientId, referredClientId, createdAt, syncStatus, [referrerClientId+createdAt]',
      clientReviews: 'id, clientId, appointmentId, staffId, rating, platform, createdAt, syncStatus, [clientId+createdAt], [staffId+rating]',
      loyaltyRewards: 'id, clientId, type, redeemedAt, expiresAt, syncStatus, [clientId+redeemedAt]',
      timesheets: 'id, storeId, staffId, date, status, syncStatus, isDeleted, [storeId+date], [staffId+date], [storeId+staffId], [storeId+status], [storeId+syncStatus]',
      payRuns: 'id, storeId, periodStart, periodEnd, status, syncStatus, isDeleted, [storeId+periodStart], [storeId+status], [storeId+syncStatus]',
      reviewRequests: 'id, storeId, clientId, appointmentId, staffId, status, sentAt, createdAt, syncStatus, [storeId+status], [clientId+status], [storeId+createdAt], [staffId+createdAt]',

      // Custom Segments table (Client Module PRD 2.3.10)
      // Indexes optimized for:
      // - Fetching segments by salon
      // - Filtering by active status
      // - Sync queue processing
      customSegments: 'id, storeId, name, isActive, createdAt, syncStatus, [storeId+isActive], [storeId+createdAt]'
    }).upgrade(() => {
      console.log('✅ Database upgraded to version 12: Added Custom Segments table (Client Module PRD 2.3.10)');
    });

    // Version 13: Add Products table (Inventory/Catalog Module)
    // See: types/inventory.ts for Product interface
    this.version(13).stores({
      // All existing tables unchanged
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, firstName, lastName, isBlocked, isVip, syncStatus, createdAt, [storeId+lastName], [storeId+isBlocked], [storeId+isVip], [storeId+createdAt]',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',
      serviceCategories: 'id, storeId, parentCategoryId, displayOrder, isActive, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      menuServices: 'id, storeId, categoryId, status, displayOrder, syncStatus, [storeId+categoryId], [storeId+status], [categoryId+displayOrder]',
      serviceVariants: 'id, storeId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',
      servicePackages: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      addOnGroups: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive]',
      addOnOptions: 'id, storeId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',
      staffServiceAssignments: 'id, storeId, staffId, serviceId, isActive, syncStatus, [storeId+staffId], [storeId+serviceId], [staffId+serviceId]',
      catalogSettings: 'id, storeId, syncStatus',
      timeOffTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      timeOffRequests: 'id, storeId, staffId, typeId, status, startDate, endDate, syncStatus, [storeId+status], [storeId+startDate], [staffId+status], [staffId+startDate], [storeId+staffId+status]',
      blockedTimeTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      blockedTimeEntries: 'id, storeId, staffId, typeId, startDateTime, endDateTime, frequency, seriesId, syncStatus, [storeId+staffId], [staffId+startDateTime], [storeId+startDateTime], [seriesId]',
      businessClosedPeriods: 'id, storeId, startDate, endDate, isAnnual, syncStatus, [storeId+startDate], [storeId+endDate]',
      resources: 'id, storeId, category, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+category]',
      resourceBookings: 'id, storeId, resourceId, appointmentId, startDateTime, syncStatus, [resourceId+startDateTime], [appointmentId], [storeId+startDateTime]',
      staffSchedules: 'id, storeId, staffId, effectiveFrom, effectiveUntil, syncStatus, [storeId+staffId], [staffId+effectiveFrom]',
      deviceSettings: 'deviceId',
      patchTests: 'id, clientId, serviceId, testDate, result, expiresAt, syncStatus, [clientId+serviceId], [clientId+expiresAt]',
      formTemplates: 'id, storeId, name, isActive, syncStatus, [storeId+isActive]',
      formResponses: 'id, formTemplateId, clientId, appointmentId, status, completedAt, syncStatus, [clientId+status], [clientId+completedAt]',
      referrals: 'id, referrerClientId, referredClientId, createdAt, syncStatus, [referrerClientId+createdAt]',
      clientReviews: 'id, clientId, appointmentId, staffId, rating, platform, createdAt, syncStatus, [clientId+createdAt], [staffId+rating]',
      loyaltyRewards: 'id, clientId, type, redeemedAt, expiresAt, syncStatus, [clientId+redeemedAt]',
      timesheets: 'id, storeId, staffId, date, status, syncStatus, isDeleted, [storeId+date], [staffId+date], [storeId+staffId], [storeId+status], [storeId+syncStatus]',
      payRuns: 'id, storeId, periodStart, periodEnd, status, syncStatus, isDeleted, [storeId+periodStart], [storeId+status], [storeId+syncStatus]',
      reviewRequests: 'id, storeId, clientId, appointmentId, staffId, status, sentAt, createdAt, syncStatus, [storeId+status], [clientId+status], [storeId+createdAt], [staffId+createdAt]',
      customSegments: 'id, storeId, name, isActive, createdAt, syncStatus, [storeId+isActive], [storeId+createdAt]',

      // Products table (Inventory/Catalog Module)
      // Indexes optimized for:
      // - Fetching products by salon
      // - Filtering by active status (isActive)
      // - Filtering by retail/backbar type
      // - Category filtering
      // - SKU and barcode lookup
      // - Sync queue processing
      products: 'id, storeId, sku, barcode, category, isRetail, isBackbar, isActive, syncStatus, [storeId+isActive], [storeId+category], [storeId+isRetail], [storeId+sku]'
    }).upgrade(() => {
      console.log('✅ Database upgraded to version 13: Added Products table (Inventory/Catalog Module)');
    });

    // Version 14: Add Gift Card Denomination and Gift Card Settings tables
    // See: docs/product/PRD-Menu-Settings-Module.md and types/catalog.ts
    this.version(14).stores({
      // All existing tables unchanged
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, firstName, lastName, isBlocked, isVip, syncStatus, createdAt, [storeId+lastName], [storeId+isBlocked], [storeId+isVip], [storeId+createdAt]',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',
      serviceCategories: 'id, storeId, parentCategoryId, displayOrder, isActive, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      menuServices: 'id, storeId, categoryId, status, displayOrder, syncStatus, [storeId+categoryId], [storeId+status], [categoryId+displayOrder]',
      serviceVariants: 'id, storeId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',
      servicePackages: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      addOnGroups: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive]',
      addOnOptions: 'id, storeId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',
      staffServiceAssignments: 'id, storeId, staffId, serviceId, isActive, syncStatus, [storeId+staffId], [storeId+serviceId], [staffId+serviceId]',
      catalogSettings: 'id, storeId, syncStatus',
      timeOffTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      timeOffRequests: 'id, storeId, staffId, typeId, status, startDate, endDate, syncStatus, [storeId+status], [storeId+startDate], [staffId+status], [staffId+startDate], [storeId+staffId+status]',
      blockedTimeTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      blockedTimeEntries: 'id, storeId, staffId, typeId, startDateTime, endDateTime, frequency, seriesId, syncStatus, [storeId+staffId], [staffId+startDateTime], [storeId+startDateTime], [seriesId]',
      businessClosedPeriods: 'id, storeId, startDate, endDate, isAnnual, syncStatus, [storeId+startDate], [storeId+endDate]',
      resources: 'id, storeId, category, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+category]',
      resourceBookings: 'id, storeId, resourceId, appointmentId, startDateTime, syncStatus, [resourceId+startDateTime], [appointmentId], [storeId+startDateTime]',
      staffSchedules: 'id, storeId, staffId, effectiveFrom, effectiveUntil, syncStatus, [storeId+staffId], [staffId+effectiveFrom]',
      deviceSettings: 'deviceId',
      patchTests: 'id, clientId, serviceId, testDate, result, expiresAt, syncStatus, [clientId+serviceId], [clientId+expiresAt]',
      formTemplates: 'id, storeId, name, isActive, syncStatus, [storeId+isActive]',
      formResponses: 'id, formTemplateId, clientId, appointmentId, status, completedAt, syncStatus, [clientId+status], [clientId+completedAt]',
      referrals: 'id, referrerClientId, referredClientId, createdAt, syncStatus, [referrerClientId+createdAt]',
      clientReviews: 'id, clientId, appointmentId, staffId, rating, platform, createdAt, syncStatus, [clientId+createdAt], [staffId+rating]',
      loyaltyRewards: 'id, clientId, type, redeemedAt, expiresAt, syncStatus, [clientId+redeemedAt]',
      timesheets: 'id, storeId, staffId, date, status, syncStatus, isDeleted, [storeId+date], [staffId+date], [storeId+staffId], [storeId+status], [storeId+syncStatus]',
      payRuns: 'id, storeId, periodStart, periodEnd, status, syncStatus, isDeleted, [storeId+periodStart], [storeId+status], [storeId+syncStatus]',
      reviewRequests: 'id, storeId, clientId, appointmentId, staffId, status, sentAt, createdAt, syncStatus, [storeId+status], [clientId+status], [storeId+createdAt], [staffId+createdAt]',
      customSegments: 'id, storeId, name, isActive, createdAt, syncStatus, [storeId+isActive], [storeId+createdAt]',
      products: 'id, storeId, sku, barcode, category, isRetail, isBackbar, isActive, syncStatus, [storeId+isActive], [storeId+category], [storeId+isRetail], [storeId+sku]',

      // Gift Card tables (Catalog Module)
      // Gift Card Denominations - preset amounts for quick sale
      // Indexes optimized for:
      // - Fetching denominations by salon
      // - Filtering by active status
      // - Ordering for display
      // - Sync queue processing
      giftCardDenominations: 'id, storeId, amount, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',

      // Gift Card Settings - per-salon gift card configuration
      giftCardSettings: 'id, storeId, syncStatus'
    }).upgrade(() => {
      console.log('✅ Database upgraded to version 14: Added Gift Card tables (Catalog Module)');
    });

    // Version 15: Full Gift Card Module support
    // See: docs/product/PRD-Gift-Cards-Module.md (comprehensive gift card module)
    this.version(15).stores({
      // All existing tables unchanged
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, firstName, lastName, isBlocked, isVip, syncStatus, createdAt, [storeId+lastName], [storeId+isBlocked], [storeId+isVip], [storeId+createdAt]',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',
      serviceCategories: 'id, storeId, parentCategoryId, displayOrder, isActive, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      menuServices: 'id, storeId, categoryId, status, displayOrder, syncStatus, [storeId+categoryId], [storeId+status], [categoryId+displayOrder]',
      serviceVariants: 'id, storeId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',
      servicePackages: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      addOnGroups: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive]',
      addOnOptions: 'id, storeId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',
      staffServiceAssignments: 'id, storeId, staffId, serviceId, isActive, syncStatus, [storeId+staffId], [storeId+serviceId], [staffId+serviceId]',
      catalogSettings: 'id, storeId, syncStatus',
      timeOffTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      timeOffRequests: 'id, storeId, staffId, typeId, status, startDate, endDate, syncStatus, [storeId+status], [storeId+startDate], [staffId+status], [staffId+startDate], [storeId+staffId+status]',
      blockedTimeTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      blockedTimeEntries: 'id, storeId, staffId, typeId, startDateTime, endDateTime, frequency, seriesId, syncStatus, [storeId+staffId], [staffId+startDateTime], [storeId+startDateTime], [seriesId]',
      businessClosedPeriods: 'id, storeId, startDate, endDate, isAnnual, syncStatus, [storeId+startDate], [storeId+endDate]',
      resources: 'id, storeId, category, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+category]',
      resourceBookings: 'id, storeId, resourceId, appointmentId, startDateTime, syncStatus, [resourceId+startDateTime], [appointmentId], [storeId+startDateTime]',
      staffSchedules: 'id, storeId, staffId, effectiveFrom, effectiveUntil, syncStatus, [storeId+staffId], [staffId+effectiveFrom]',
      deviceSettings: 'deviceId',
      patchTests: 'id, clientId, serviceId, testDate, result, expiresAt, syncStatus, [clientId+serviceId], [clientId+expiresAt]',
      formTemplates: 'id, storeId, name, isActive, syncStatus, [storeId+isActive]',
      formResponses: 'id, formTemplateId, clientId, appointmentId, status, completedAt, syncStatus, [clientId+status], [clientId+completedAt]',
      referrals: 'id, referrerClientId, referredClientId, createdAt, syncStatus, [referrerClientId+createdAt]',
      clientReviews: 'id, clientId, appointmentId, staffId, rating, platform, createdAt, syncStatus, [clientId+createdAt], [staffId+rating]',
      loyaltyRewards: 'id, clientId, type, redeemedAt, expiresAt, syncStatus, [clientId+redeemedAt]',
      timesheets: 'id, storeId, staffId, date, status, syncStatus, isDeleted, [storeId+date], [staffId+date], [storeId+staffId], [storeId+status], [storeId+syncStatus]',
      payRuns: 'id, storeId, periodStart, periodEnd, status, syncStatus, isDeleted, [storeId+periodStart], [storeId+status], [storeId+syncStatus]',
      reviewRequests: 'id, storeId, clientId, appointmentId, staffId, status, sentAt, createdAt, syncStatus, [storeId+status], [clientId+status], [storeId+createdAt], [staffId+createdAt]',
      customSegments: 'id, storeId, name, isActive, createdAt, syncStatus, [storeId+isActive], [storeId+createdAt]',
      products: 'id, storeId, sku, barcode, category, isRetail, isBackbar, isActive, syncStatus, [storeId+isActive], [storeId+category], [storeId+isRetail], [storeId+sku]',
      giftCardDenominations: 'id, storeId, amount, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      giftCardSettings: 'id, storeId, syncStatus',

      // Gift Card tables (Full Gift Card Module)
      // Gift Cards - issued gift cards with balances
      // Indexes optimized for:
      // - Lookup by code (primary redemption flow)
      // - Filter by status (active, depleted, expired, voided)
      // - Filter by purchaser/recipient
      // - Sync queue processing
      giftCards: 'id, storeId, code, status, currentBalance, purchaserId, recipientEmail, issuedAt, expiresAt, syncStatus, isDeleted, [storeId+status], [storeId+code], [storeId+isDeleted], [purchaserId]',

      // Gift Card Transactions - purchase/redemption/reload history
      // Indexes optimized for:
      // - Fetching transactions by gift card
      // - Date-based queries for reporting
      // - Ticket-based lookups
      // - Sync queue processing
      giftCardTransactions: 'id, storeId, giftCardId, type, amount, ticketId, createdAt, syncStatus, isDeleted, [giftCardId+createdAt], [storeId+createdAt], [storeId+type], [ticketId]',

      // Gift Card Designs - visual templates for digital gift cards
      // Indexes optimized for:
      // - Fetching active designs by salon
      // - Category filtering (seasonal, birthday, etc.)
      // - Finding default design
      giftCardDesigns: 'id, storeId, name, category, isActive, isDefault, syncStatus, isDeleted, [storeId+isActive], [storeId+category], [storeId+isDefault]'
    }).upgrade(() => {
      console.log('✅ Database upgraded to version 15: Added full Gift Card Module tables (giftCards, giftCardTransactions, giftCardDesigns)');
    });

    // Version 16: Add compound indexes for tickets (Turn Queue & Aggregation optimization)
    // See: scripts/ralph/runs/sqlite-migration/prd.json US-004
    // These indexes optimize:
    // - [storeId+status+createdAt]: Turn queue queries filtering by status and sorting by time
    // - [storeId+staffId+createdAt]: Primary staff lookup (ticket.staffId is optional display field)
    // Note: Staff ticket counts use ticket.services[].staffId (nested), not the primary staffId index
    this.version(16).stores({
      // All existing tables unchanged
      appointments: 'id, storeId, clientId, staffId, status, scheduledStartTime, syncStatus, [storeId+status], [storeId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      // Updated tickets with new compound indexes for turn queue and aggregation queries
      tickets: 'id, storeId, clientId, status, createdAt, syncStatus, appointmentId, [storeId+status], [storeId+createdAt], [clientId+createdAt], [storeId+status+createdAt], [storeId+staffId+createdAt]',
      transactions: 'id, storeId, ticketId, clientId, createdAt, syncStatus, status, [storeId+createdAt], [clientId+createdAt]',
      staff: 'id, storeId, status, syncStatus, [storeId+status]',
      clients: 'id, storeId, phone, email, firstName, lastName, isBlocked, isVip, syncStatus, createdAt, [storeId+lastName], [storeId+isBlocked], [storeId+isVip], [storeId+createdAt]',
      services: 'id, storeId, category, syncStatus, [storeId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      teamMembers: 'id, storeId, isActive, syncStatus, isDeleted, createdAt, updatedAt, [storeId+isActive], [storeId+isDeleted], [storeId+syncStatus]',
      serviceCategories: 'id, storeId, parentCategoryId, displayOrder, isActive, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      menuServices: 'id, storeId, categoryId, status, displayOrder, syncStatus, [storeId+categoryId], [storeId+status], [categoryId+displayOrder]',
      serviceVariants: 'id, storeId, serviceId, displayOrder, isActive, syncStatus, [serviceId+isActive], [serviceId+displayOrder]',
      servicePackages: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      addOnGroups: 'id, storeId, isActive, displayOrder, syncStatus, [storeId+isActive]',
      addOnOptions: 'id, storeId, groupId, isActive, displayOrder, syncStatus, [groupId+isActive], [groupId+displayOrder]',
      staffServiceAssignments: 'id, storeId, staffId, serviceId, isActive, syncStatus, [storeId+staffId], [storeId+serviceId], [staffId+serviceId]',
      catalogSettings: 'id, storeId, syncStatus',
      timeOffTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      timeOffRequests: 'id, storeId, staffId, typeId, status, startDate, endDate, syncStatus, [storeId+status], [storeId+startDate], [staffId+status], [staffId+startDate], [storeId+staffId+status]',
      blockedTimeTypes: 'id, storeId, code, isActive, displayOrder, isSystemDefault, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      blockedTimeEntries: 'id, storeId, staffId, typeId, startDateTime, endDateTime, frequency, seriesId, syncStatus, [storeId+staffId], [staffId+startDateTime], [storeId+startDateTime], [seriesId]',
      businessClosedPeriods: 'id, storeId, startDate, endDate, isAnnual, syncStatus, [storeId+startDate], [storeId+endDate]',
      resources: 'id, storeId, category, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+category]',
      resourceBookings: 'id, storeId, resourceId, appointmentId, startDateTime, syncStatus, [resourceId+startDateTime], [appointmentId], [storeId+startDateTime]',
      staffSchedules: 'id, storeId, staffId, effectiveFrom, effectiveUntil, syncStatus, [storeId+staffId], [staffId+effectiveFrom]',
      deviceSettings: 'deviceId',
      patchTests: 'id, clientId, serviceId, testDate, result, expiresAt, syncStatus, [clientId+serviceId], [clientId+expiresAt]',
      formTemplates: 'id, storeId, name, isActive, syncStatus, [storeId+isActive]',
      formResponses: 'id, formTemplateId, clientId, appointmentId, status, completedAt, syncStatus, [clientId+status], [clientId+completedAt]',
      referrals: 'id, referrerClientId, referredClientId, createdAt, syncStatus, [referrerClientId+createdAt]',
      clientReviews: 'id, clientId, appointmentId, staffId, rating, platform, createdAt, syncStatus, [clientId+createdAt], [staffId+rating]',
      loyaltyRewards: 'id, clientId, type, redeemedAt, expiresAt, syncStatus, [clientId+redeemedAt]',
      timesheets: 'id, storeId, staffId, date, status, syncStatus, isDeleted, [storeId+date], [staffId+date], [storeId+staffId], [storeId+status], [storeId+syncStatus]',
      payRuns: 'id, storeId, periodStart, periodEnd, status, syncStatus, isDeleted, [storeId+periodStart], [storeId+status], [storeId+syncStatus]',
      reviewRequests: 'id, storeId, clientId, appointmentId, staffId, status, sentAt, createdAt, syncStatus, [storeId+status], [clientId+status], [storeId+createdAt], [staffId+createdAt]',
      customSegments: 'id, storeId, name, isActive, createdAt, syncStatus, [storeId+isActive], [storeId+createdAt]',
      products: 'id, storeId, sku, barcode, category, isRetail, isBackbar, isActive, syncStatus, [storeId+isActive], [storeId+category], [storeId+isRetail], [storeId+sku]',
      giftCardDenominations: 'id, storeId, amount, isActive, displayOrder, syncStatus, [storeId+isActive], [storeId+displayOrder]',
      giftCardSettings: 'id, storeId, syncStatus',
      giftCards: 'id, storeId, code, status, currentBalance, purchaserId, recipientEmail, issuedAt, expiresAt, syncStatus, isDeleted, [storeId+status], [storeId+code], [storeId+isDeleted], [purchaserId]',
      giftCardTransactions: 'id, storeId, giftCardId, type, amount, ticketId, createdAt, syncStatus, isDeleted, [giftCardId+createdAt], [storeId+createdAt], [storeId+type], [ticketId]',
      giftCardDesigns: 'id, storeId, name, category, isActive, isDefault, syncStatus, isDeleted, [storeId+isActive], [storeId+category], [storeId+isDefault]'
    }).upgrade(() => {
      console.log('✅ Database upgraded to version 16: Added compound indexes for tickets (Turn Queue & Aggregation optimization)');
    });
  }
}

// Create singleton instance
export const db = new MangoPOSDatabase();

// Initialize database with automatic recovery from version mismatch errors
export async function initializeDatabase() {
  try {
    await db.open();
    console.log('✅ IndexedDB initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize IndexedDB:', error);

    // Check if this is a version/upgrade error that can be recovered
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isUpgradeError =
      errorMessage.includes('VersionError') ||
      errorMessage.includes('upgrade') ||
      errorMessage.includes('version') ||
      errorMessage.includes('schema') ||
      (error as any)?.name === 'VersionError';

    if (isUpgradeError) {
      console.warn('⚠️ Database schema mismatch detected. Attempting recovery...');
      try {
        // Close any existing connection
        db.close();

        // Delete the database
        await Dexie.delete('mango_biz_store_app');
        console.log('🗑️ Old database deleted');

        // Reopen with fresh schema
        await db.open();
        console.log('✅ Database recreated successfully');
        return true;
      } catch (recoveryError) {
        console.error('❌ Database recovery failed:', recoveryError);
        return false;
      }
    }

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
  // Client module tables
  await db.patchTests.clear();
  await db.formTemplates.clear();
  await db.formResponses.clear();
  await db.referrals.clear();
  await db.clientReviews.clear();
  await db.loyaltyRewards.clear();
  // Timesheet tables
  await db.timesheets.clear();
  // Payroll tables
  await db.payRuns.clear();
  // Review requests table
  await db.reviewRequests.clear();
  // Custom segments table
  await db.customSegments.clear();
  // Products table
  await db.products.clear();
  // Gift Card tables (Catalog Module)
  await db.giftCardDenominations.clear();
  await db.giftCardSettings.clear();
  // Gift Card tables (Full Gift Card Module)
  await db.giftCards.clear();
  await db.giftCardTransactions.clear();
  await db.giftCardDesigns.clear();
  // Note: deviceSettings is intentionally NOT cleared here
  // It should persist across data clears to maintain device identity
  console.log('🗑️  Database cleared');
}

// ==================== DEVICE SETTINGS ====================

/**
 * Get device settings from local database
 */
export async function getDeviceSettings(deviceId: string): Promise<DeviceSettingsRecord | undefined> {
  return await db.deviceSettings.get(deviceId);
}

/**
 * Save device settings to local database
 */
export async function saveDeviceSettings(settings: DeviceSettingsRecord): Promise<void> {
  await db.deviceSettings.put(settings);
}

/**
 * Clear device settings (used on logout/revocation)
 */
export async function clearDeviceSettings(deviceId: string): Promise<void> {
  await db.deviceSettings.delete(deviceId);
}
