import { describe, it, expect, beforeEach } from 'vitest';
import { clearDatabase, initializeDatabase } from '../schema';
import { appointmentsDB, ticketsDB, staffDB, clientsDB } from '../database';
import { seedDatabase, getTestSalonId } from '../seed';

describe('Database Tests', () => {
  const storeId = getTestSalonId();

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Initialization', () => {
    it('should initialize database successfully', async () => {
      const result = await initializeDatabase();
      expect(result).toBe(true);
    });
  });

  describe('Staff Operations', () => {
    it('should create and retrieve staff', async () => {
      await seedDatabase();
      const staff = await staffDB.getAll(storeId);
      expect(staff.length).toBeGreaterThan(0);
      expect(staff[0]).toHaveProperty('name');
      expect(staff[0]).toHaveProperty('status');
    });

    it('should get available staff only', async () => {
      await seedDatabase();
      const available = await staffDB.getAvailable(storeId);
      expect(available.every(s => s.status === 'available')).toBe(true);
    });
  });

  describe('Client Operations', () => {
    it('should create a new client', async () => {
      const client = await clientsDB.create({
        storeId,
        firstName: 'Test',
        lastName: 'Client',
        name: 'Test Client',
        phone: '555-9999',
        email: 'test@example.com',
        isBlocked: false,
      } as any);

      expect(client.id).toBeDefined();
      expect(client.name).toBe('Test Client');
      // totalVisits is optional and may not be set on new clients
      expect(client.totalVisits ?? 0).toBe(0);
    });

    it('should search clients by name', async () => {
      await seedDatabase();
      const results = await clientsDB.search(storeId, 'jane');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.name?.toLowerCase()).toContain('jane');
    });
  });

  describe('Appointment Operations', () => {
    it('should create an appointment', async () => {
      await seedDatabase();
      const staff = await staffDB.getAll(storeId);
      const clients = await clientsDB.getAll(storeId);

      const appointment = await appointmentsDB.create({
        clientId: clients[0].id,
        clientName: clients[0].name || 'Test Client',
        clientPhone: clients[0].phone || '555-0000',
        staffId: staff[0].id,
        staffName: staff[0].name,
        services: [{
          serviceId: 'service-1',
          staffId: staff[0].id,
          duration: 60,
          price: 50,
        }],
        scheduledStartTime: new Date(),
        source: 'phone',
      }, 'user-1', storeId);

      expect(appointment.id).toBeDefined();
      expect(appointment.status).toBe('scheduled');
      expect(appointment.syncStatus).toBe('local');
    });

    it('should check in an appointment', async () => {
      await seedDatabase();
      const staff = await staffDB.getAll(storeId);
      const clients = await clientsDB.getAll(storeId);

      const appointment = await appointmentsDB.create({
        clientId: clients[0].id,
        clientName: clients[0].name || 'Test Client',
        clientPhone: clients[0].phone || '555-0000',
        staffId: staff[0].id,
        staffName: staff[0].name,
        services: [{
          serviceId: 'service-1',
          staffId: staff[0].id,
          duration: 60,
          price: 50,
        }],
        scheduledStartTime: new Date(),
        source: 'phone',
      }, 'user-1', storeId);

      const checkedIn = await appointmentsDB.checkIn(appointment.id, 'user-1');
      expect(checkedIn?.status).toBe('checked-in');
      expect(checkedIn?.checkInTime).toBeDefined();
    });
  });

  describe('Ticket Operations', () => {
    it('should create a ticket', async () => {
      await seedDatabase();
      const staff = await staffDB.getAll(storeId);
      const clients = await clientsDB.getAll(storeId);

      const ticket = await ticketsDB.create({
        clientId: clients[0].id,
        clientName: clients[0].name || 'Test Client',
        clientPhone: clients[0].phone || '555-0000',
        services: [{
          serviceId: 'service-1',
          serviceName: 'Haircut',
          staffId: staff[0].id,
          staffName: staff[0].name,
          price: 45,
          duration: 45,
          commission: 22.5,
          startTime: new Date().toISOString(),
        }],
      }, 'user-1', storeId);

      expect(ticket.id).toBeDefined();
      expect(ticket.status).toBe('pending'); // Default status for newly created tickets
      expect(ticket.subtotal).toBe(45);
      expect(ticket.total).toBeGreaterThan(45); // includes tax
    });

    it('should get active tickets', async () => {
      await seedDatabase();
      const staff = await staffDB.getAll(storeId);
      const clients = await clientsDB.getAll(storeId);

      await ticketsDB.create({
        clientId: clients[0].id,
        clientName: clients[0].name || 'Test Client',
        clientPhone: clients[0].phone || '555-0000',
        services: [{
          serviceId: 'service-1',
          serviceName: 'Haircut',
          staffId: staff[0].id,
          staffName: staff[0].name,
          price: 45,
          duration: 45,
          commission: 22.5,
          startTime: new Date().toISOString(),
        }],
      }, 'user-1', storeId);

      const active = await ticketsDB.getActive(storeId);
      expect(active.length).toBe(1);
      expect(['in-service', 'pending']).toContain(active[0].status);
    });
  });
});
