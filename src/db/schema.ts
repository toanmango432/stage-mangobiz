import Dexie, { Table } from 'dexie';
import type {
  Appointment,
  Ticket,
  Transaction,
  Staff,
  Client,
  Service,
  SyncOperation,
  PatchTest,
  FormTemplate,
  ClientFormResponse,
  Referral,
  ClientReview,
  LoyaltyReward
} from '../types';

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

  // Client module tables (PRD v4.2)
  patchTests!: Table<PatchTest, string>;
  formTemplates!: Table<FormTemplate, string>;
  formResponses!: Table<ClientFormResponse, string>;
  referrals!: Table<Referral, string>;
  clientReviews!: Table<ClientReview, string>;
  loyaltyRewards!: Table<LoyaltyReward, string>;

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

    // Version 3: Client module tables and indexes (PRD v4.2)
    this.version(3).stores({
      appointments: 'id, salonId, clientId, staffId, status, scheduledStartTime, syncStatus, [salonId+status], [salonId+scheduledStartTime], [staffId+scheduledStartTime], [clientId+scheduledStartTime]',
      tickets: 'id, salonId, clientId, status, createdAt, syncStatus, appointmentId, [salonId+status], [salonId+createdAt], [clientId+createdAt]',
      transactions: 'id, salonId, ticketId, clientId, createdAt, syncStatus, status, [salonId+createdAt], [clientId+createdAt]',
      staff: 'id, salonId, status, syncStatus, [salonId+status]',
      // Updated clients with new indexes for blocking, sorting, filtering
      clients: 'id, salonId, phone, email, firstName, lastName, isBlocked, isVip, syncStatus, createdAt, [salonId+lastName], [salonId+isBlocked], [salonId+isVip], [salonId+createdAt]',
      services: 'id, salonId, category, syncStatus, [salonId+category]',
      settings: 'key',
      syncQueue: 'id, priority, createdAt, status, entity, [status+createdAt]',
      // New client module tables
      patchTests: 'id, clientId, serviceId, testDate, result, expiresAt, syncStatus, [clientId+serviceId], [clientId+expiresAt]',
      formTemplates: 'id, storeId, name, isActive, syncStatus, [storeId+isActive]',
      formResponses: 'id, formTemplateId, clientId, appointmentId, status, completedAt, syncStatus, [clientId+status], [clientId+completedAt]',
      referrals: 'id, referrerClientId, referredClientId, createdAt, syncStatus, [referrerClientId+createdAt]',
      clientReviews: 'id, clientId, appointmentId, staffId, rating, platform, createdAt, syncStatus, [clientId+createdAt], [staffId+rating]',
      loyaltyRewards: 'id, clientId, type, redeemedAt, expiresAt, syncStatus, [clientId+redeemedAt]'
    }).upgrade(tx => {
      console.log('✅ Database upgraded to version 3: Added client module tables (patchTests, formTemplates, formResponses, referrals, clientReviews, loyaltyRewards)');
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
  // Client module tables
  await db.patchTests.clear();
  await db.formTemplates.clear();
  await db.formResponses.clear();
  await db.referrals.clear();
  await db.clientReviews.clear();
  await db.loyaltyRewards.clear();
  console.log('🗑️  Database cleared');
}
