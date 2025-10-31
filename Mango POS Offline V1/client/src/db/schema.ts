import Dexie, { Table } from 'dexie';
import type { 
  Appointment, 
  Ticket, 
  Transaction, 
  Staff, 
  Client, 
  Service,
  SyncOperation 
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

  constructor() {
    super('mango_biz_store_app');
    
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
  console.log('🗑️  Database cleared');
}
