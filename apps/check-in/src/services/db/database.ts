import Dexie, { type Table } from 'dexie';
import type { Client, Service, Technician, CheckIn } from '../../types';

export class CheckInDatabase extends Dexie {
  clients!: Table<Client, string>;
  services!: Table<Service, string>;
  technicians!: Table<Technician, string>;
  checkins!: Table<CheckIn, string>;
  syncQueue!: Table<{ id: string; type: string; payload: string; createdAt: string; attempts: number }, string>;

  constructor() {
    super('MangoCheckIn');

    this.version(1).stores({
      clients: 'id, phone, &[phone+storeId]',
      services: 'id, categoryId, isActive',
      technicians: 'id, status',
      checkins: 'id, clientId, status, syncStatus, checkedInAt',
      syncQueue: 'id, type, createdAt',
    });
  }
}

export const db = new CheckInDatabase();
