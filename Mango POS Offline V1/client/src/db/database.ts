import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import type {
  Appointment,
  CreateAppointmentInput,
  Ticket,
  CreateTicketInput,
  Transaction,
  Staff,
  Client,
  Service,
  SyncOperation,
} from '../types';

// ==================== APPOINTMENTS ====================

export const appointmentsDB = {
  async getAll(salonId: string): Promise<Appointment[]> {
    return await db.appointments
      .where('salonId')
      .equals(salonId)
      .toArray();
  },

  async getById(id: string): Promise<Appointment | undefined> {
    return await db.appointments.get(id);
  },

  async getByDate(salonId: string, date: Date): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db.appointments
      .where('salonId')
      .equals(salonId)
      .and(apt => 
        apt.scheduledStartTime >= startOfDay && 
        apt.scheduledStartTime <= endOfDay
      )
      .toArray();
  },

  async getByStatus(salonId: string, status: string): Promise<Appointment[]> {
    return await db.appointments
      .where('[salonId+status]')
      .equals([salonId, status])
      .toArray();
  },

  async create(input: CreateAppointmentInput, userId: string, salonId: string): Promise<Appointment> {
    const now = new Date();
    const appointment: Appointment = {
      id: uuidv4(),
      salonId,
      ...input,
      status: 'scheduled',
      scheduledEndTime: new Date(
        input.scheduledStartTime.getTime() + 
        input.services.reduce((sum, s) => sum + s.duration, 0) * 60000
      ),
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      lastModifiedBy: userId,
      syncStatus: 'local',
    };

    await db.appointments.add(appointment);
    return appointment;
  },

  async update(id: string, updates: Partial<Appointment>, userId: string): Promise<Appointment | undefined> {
    const appointment = await db.appointments.get(id);
    if (!appointment) return undefined;

    const updated: Appointment = {
      ...appointment,
      ...updates,
      updatedAt: new Date(),
      lastModifiedBy: userId,
      syncStatus: 'local',
    };

    await db.appointments.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.appointments.delete(id);
  },

  async checkIn(id: string, userId: string): Promise<Appointment | undefined> {
    return await this.update(id, {
      status: 'checked-in',
      checkInTime: new Date(),
    }, userId);
  },
};

// ==================== TICKETS ====================

export const ticketsDB = {
  async getAll(salonId: string): Promise<Ticket[]> {
    return await db.tickets
      .where('salonId')
      .equals(salonId)
      .toArray();
  },

  async getById(id: string): Promise<Ticket | undefined> {
    return await db.tickets.get(id);
  },

  async getByStatus(salonId: string, status: string): Promise<Ticket[]> {
    return await db.tickets
      .where('[salonId+status]')
      .equals([salonId, status])
      .toArray();
  },

  async getActive(salonId: string): Promise<Ticket[]> {
    return await db.tickets
      .where('salonId')
      .equals(salonId)
      .and(ticket => ['in-service', 'pending'].includes(ticket.status))
      .toArray();
  },

  async create(input: CreateTicketInput, userId: string, salonId: string): Promise<Ticket> {
    const now = new Date();
    const subtotal = input.services.reduce((sum, s) => sum + s.price, 0) +
                    (input.products?.reduce((sum, p) => sum + p.total, 0) || 0);
    
    const ticket: Ticket = {
      id: uuidv4(),
      salonId,
      ...input,
      products: input.products || [],
      status: 'in-service',
      subtotal,
      discount: 0,
      tax: subtotal * 0.08, // 8% tax rate (configurable)
      tip: 0,
      total: subtotal * 1.08,
      payments: [],
      createdAt: now,
      createdBy: userId,
      lastModifiedBy: userId,
      syncStatus: 'local',
    };

    await db.tickets.add(ticket);
    return ticket;
  },

  async update(id: string, updates: Partial<Ticket>, userId: string): Promise<Ticket | undefined> {
    const ticket = await db.tickets.get(id);
    if (!ticket) return undefined;

    const updated: Ticket = {
      ...ticket,
      ...updates,
      lastModifiedBy: userId,
      syncStatus: 'local',
    };

    await db.tickets.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.tickets.delete(id);
  },

  async complete(id: string, userId: string): Promise<Ticket | undefined> {
    return await this.update(id, {
      status: 'completed',
      completedAt: new Date(),
    }, userId);
  },
};

// ==================== TRANSACTIONS ====================

export const transactionsDB = {
  async getAll(salonId: string): Promise<Transaction[]> {
    return await db.transactions
      .where('salonId')
      .equals(salonId)
      .reverse()
      .toArray();
  },

  async getById(id: string): Promise<Transaction | undefined> {
    return await db.transactions.get(id);
  },

  async getByDateRange(salonId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db.transactions
      .where('salonId')
      .equals(salonId)
      .and(txn => txn.createdAt >= startDate && txn.createdAt <= endDate)
      .reverse()
      .toArray();
  },

  async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'syncStatus'>): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: uuidv4(),
      ...transaction,
      createdAt: new Date(),
      syncStatus: 'local',
    };

    await db.transactions.add(newTransaction);
    return newTransaction;
  },

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = await db.transactions.get(id);
    if (!transaction) return undefined;

    const updated: Transaction = {
      ...transaction,
      ...updates,
      syncStatus: 'local',
    };

    await db.transactions.put(updated);
    return updated;
  },
};

// ==================== STAFF ====================

export const staffDB = {
  async getAll(salonId: string): Promise<Staff[]> {
    return await db.staff
      .where('salonId')
      .equals(salonId)
      .toArray();
  },

  async getById(id: string): Promise<Staff | undefined> {
    return await db.staff.get(id);
  },

  async getAvailable(salonId: string): Promise<Staff[]> {
    return await db.staff
      .where('[salonId+status]')
      .equals([salonId, 'available'])
      .toArray();
  },

  async update(id: string, updates: Partial<Staff>): Promise<Staff | undefined> {
    const staff = await db.staff.get(id);
    if (!staff) return undefined;

    const updated: Staff = {
      ...staff,
      ...updates,
      updatedAt: new Date(),
      syncStatus: 'local',
    };

    await db.staff.put(updated);
    return updated;
  },

  async clockIn(id: string): Promise<Staff | undefined> {
    return await this.update(id, {
      status: 'available',
      clockedInAt: new Date(),
    });
  },

  async clockOut(id: string): Promise<Staff | undefined> {
    return await this.update(id, {
      status: 'clocked-out',
      clockedInAt: undefined,
    });
  },
};

// ==================== CLIENTS ====================

export const clientsDB = {
  async getAll(salonId: string): Promise<Client[]> {
    return await db.clients
      .where('salonId')
      .equals(salonId)
      .toArray();
  },

  async getById(id: string): Promise<Client | undefined> {
    return await db.clients.get(id);
  },

  async search(salonId: string, query: string): Promise<Client[]> {
    const lowerQuery = query.toLowerCase();
    return await db.clients
      .where('salonId')
      .equals(salonId)
      .and(client => 
        client.name.toLowerCase().includes(lowerQuery) ||
        client.phone.includes(query) ||
        (client.email?.toLowerCase().includes(lowerQuery) || false)
      )
      .toArray();
  },

  async create(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Client> {
    const now = new Date();
    const newClient: Client = {
      id: uuidv4(),
      ...client,
      totalVisits: 0,
      totalSpent: 0,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };

    await db.clients.add(newClient);
    return newClient;
  },

  async update(id: string, updates: Partial<Client>): Promise<Client | undefined> {
    const client = await db.clients.get(id);
    if (!client) return undefined;

    const updated: Client = {
      ...client,
      ...updates,
      updatedAt: new Date(),
      syncStatus: 'local',
    };

    await db.clients.put(updated);
    return updated;
  },
};

// ==================== SERVICES ====================

export const servicesDB = {
  async getAll(salonId: string): Promise<Service[]> {
    return await db.services
      .where('salonId')
      .equals(salonId)
      .toArray();
  },

  async getById(id: string): Promise<Service | undefined> {
    return await db.services.get(id);
  },

  async getByCategory(salonId: string, category: string): Promise<Service[]> {
    return await db.services
      .where('[salonId+category]')
      .equals([salonId, category])
      .toArray();
  },
};

// ==================== SYNC QUEUE ====================

export const syncQueueDB = {
  async getAll(): Promise<SyncOperation[]> {
    return await db.syncQueue
      .orderBy('priority')
      .toArray();
  },

  async getPending(): Promise<SyncOperation[]> {
    return await db.syncQueue
      .where('status')
      .equals('pending')
      .sortBy('priority');
  },

  async add(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'attempts' | 'status'>): Promise<SyncOperation> {
    const syncOp: SyncOperation = {
      id: uuidv4(),
      ...operation,
      createdAt: new Date(),
      attempts: 0,
      status: 'pending',
    };

    await db.syncQueue.add(syncOp);
    return syncOp;
  },

  async update(id: string, updates: Partial<SyncOperation>): Promise<void> {
    await db.syncQueue.update(id, updates);
  },

  async remove(id: string): Promise<void> {
    await db.syncQueue.delete(id);
  },

  async clear(): Promise<void> {
    await db.syncQueue.clear();
  },
};

// ==================== SETTINGS ====================

export const settingsDB = {
  async get(key: string): Promise<any> {
    const setting = await db.settings.get(key);
    return setting?.value;
  },

  async set(key: string, value: any): Promise<void> {
    await db.settings.put({ key, value });
  },

  async remove(key: string): Promise<void> {
    await db.settings.delete(key);
  },
};
