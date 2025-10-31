/**
 * IndexedDB Service
 * Offline-first local database for appointments, clients, and sync queue
 */

import Dexie, { Table } from 'dexie';
import { LocalAppointment } from '../types/appointment';

// Sync Queue Entry
export interface SyncQueueEntry {
  id?: number;
  action: 'create' | 'update' | 'delete';
  entity: 'appointment' | 'client' | 'service';
  entityId: string;
  data: any;
  priority: number; // 1 = highest (payments), 2 = medium (tickets), 3 = low (appointments)
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

// Client Data
export interface ClientData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  membershipLevel?: string;
  totalVisits?: number;
  lastVisit?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// Service Data
export interface ServiceData {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description?: string;
  isActive: boolean;
}

class MangoDatabase extends Dexie {
  appointments!: Table<LocalAppointment, string>;
  clients!: Table<ClientData, string>;
  services!: Table<ServiceData, string>;
  syncQueue!: Table<SyncQueueEntry, number>;

  constructor() {
    super('MangoBizPOS');
    
    this.version(1).stores({
      appointments: 'id, clientId, scheduledStartTime, status, *serviceIds, *staffIds',
      clients: 'id, name, phone, email, lastVisit',
      services: 'id, name, category, isActive',
      syncQueue: '++id, priority, timestamp, entity, action',
    });
  }
}

export const db = new MangoDatabase();

// ===== APPOINTMENT OPERATIONS =====

export async function saveAppointment(appointment: LocalAppointment): Promise<void> {
  await db.appointments.put(appointment);
}

export async function getAppointment(id: string): Promise<LocalAppointment | undefined> {
  return await db.appointments.get(id);
}

export async function getAppointmentsByDate(date: Date): Promise<LocalAppointment[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return await db.appointments
    .where('scheduledStartTime')
    .between(startOfDay.toISOString(), endOfDay.toISOString())
    .toArray();
}

export async function getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<LocalAppointment[]> {
  return await db.appointments
    .where('scheduledStartTime')
    .between(startDate.toISOString(), endDate.toISOString())
    .toArray();
}

export async function deleteAppointment(id: string): Promise<void> {
  await db.appointments.delete(id);
}

// ===== CLIENT OPERATIONS =====

export async function saveClient(client: ClientData): Promise<void> {
  await db.clients.put(client);
}

export async function getClient(id: string): Promise<ClientData | undefined> {
  return await db.clients.get(id);
}

export async function searchClients(query: string): Promise<ClientData[]> {
  const lowerQuery = query.toLowerCase();
  return await db.clients
    .filter(client => 
      client.name.toLowerCase().includes(lowerQuery) ||
      client.phone.includes(query) ||
      client.email?.toLowerCase().includes(lowerQuery)
    )
    .toArray();
}

export async function getAllClients(): Promise<ClientData[]> {
  return await db.clients.toArray();
}

// ===== SERVICE OPERATIONS =====

export async function saveService(service: ServiceData): Promise<void> {
  await db.services.put(service);
}

export async function getActiveServices(): Promise<ServiceData[]> {
  return await db.services.where('isActive').equals(1).toArray();
}

export async function getServicesByCategory(category: string): Promise<ServiceData[]> {
  return await db.services.where('category').equals(category).toArray();
}

// ===== SYNC QUEUE OPERATIONS =====

export async function addToSyncQueue(entry: Omit<SyncQueueEntry, 'id'>): Promise<number> {
  return await db.syncQueue.add(entry as SyncQueueEntry);
}

export async function getPendingSyncItems(): Promise<SyncQueueEntry[]> {
  return await db.syncQueue
    .orderBy('priority')
    .toArray();
}

export async function removeSyncQueueItem(id: number): Promise<void> {
  await db.syncQueue.delete(id);
}

export async function updateSyncQueueItem(id: number, updates: Partial<SyncQueueEntry>): Promise<void> {
  await db.syncQueue.update(id, updates);
}

export async function clearSyncQueue(): Promise<void> {
  await db.syncQueue.clear();
}

// ===== UTILITY FUNCTIONS =====

export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.appointments.clear(),
    db.clients.clear(),
    db.services.clear(),
    db.syncQueue.clear(),
  ]);
}

export async function getDBStats() {
  const [appointmentCount, clientCount, serviceCount, queueCount] = await Promise.all([
    db.appointments.count(),
    db.clients.count(),
    db.services.count(),
    db.syncQueue.count(),
  ]);

  return {
    appointments: appointmentCount,
    clients: clientCount,
    services: serviceCount,
    pendingSync: queueCount,
  };
}

// ===== EXPORT DB INSTANCE =====
export default db;
