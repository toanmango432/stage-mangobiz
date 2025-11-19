/**
 * Test Factories
 * Dynamic test data generation for flexible testing
 */

import { Client, Service, Staff, LocalAppointment } from '../types';
import { TEST_SALON_ID } from './setup-db';

let idCounter = 0;

/**
 * Generate a unique ID for test data
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

/**
 * Create a mock client with optional overrides
 */
export function createMockClient(overrides: Partial<Client> = {}): Client {
  return {
    id: generateId('client'),
    salonId: TEST_SALON_ID,
    name: 'Test Client',
    phone: '(555) 000-0000',
    email: 'test@example.com',
    notes: '',
    lastVisit: undefined,
    totalVisits: 0,
    totalSpent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock service with optional overrides
 */
export function createMockService(overrides: Partial<Service> = {}): Service {
  return {
    id: generateId('service'),
    salonId: TEST_SALON_ID,
    name: 'Test Service',
    category: 'General',
    duration: 30,
    price: 50,
    description: 'Test service description',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock staff member with optional overrides
 */
export function createMockStaff(overrides: Partial<Staff> = {}): Staff {
  return {
    id: generateId('staff'),
    salonId: TEST_SALON_ID,
    name: 'Test Staff',
    email: 'staff@salon.com',
    phone: '(555) 000-1111',
    role: 'Stylist',
    specialties: ['General'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock appointment with optional overrides
 */
export function createMockAppointment(overrides: Partial<LocalAppointment> = {}): LocalAppointment {
  const start = new Date();
  const end = new Date(start.getTime() + 30 * 60000); // 30 minutes later

  return {
    id: generateId('apt'),
    salonId: TEST_SALON_ID,
    clientId: 'client-1',
    clientName: 'Test Client',
    clientPhone: '(555) 000-0000',
    staffId: 'staff-1',
    staffName: 'Test Staff',
    scheduledStartTime: start,
    scheduledEndTime: end,
    services: [],
    status: 'scheduled',
    source: 'admin-portal',
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create a group booking with multiple appointments
 */
export function createMockGroupBooking(
  memberCount: number = 3,
  groupOverrides: Partial<LocalAppointment> = {}
): LocalAppointment[] {
  const groupId = generateId('group');
  const appointments: LocalAppointment[] = [];
  const startTime = new Date();

  const namedClients: string[] = [];

  for (let i = 0; i < memberCount; i++) {
    const clientName = `Guest ${i + 1}`;
    namedClients.push(clientName);

    appointments.push(
      createMockAppointment({
        id: generateId('apt-group'),
        clientId: generateId('client'),
        clientName,
        clientPhone: `(555) 000-${String(i).padStart(4, '0')}`,
        scheduledStartTime: startTime,
        scheduledEndTime: new Date(startTime.getTime() + 30 * 60000),
        groupId,
        partySize: memberCount,
        namedClients,
        ...groupOverrides,
      })
    );
  }

  return appointments;
}

/**
 * Create appointments with conflicts
 */
export function createConflictingAppointments(): LocalAppointment[] {
  const baseTime = new Date('2024-02-10T14:00:00');

  return [
    // Original appointment
    createMockAppointment({
      id: 'apt-original',
      staffId: 'staff-1',
      staffName: 'Alice Smith',
      scheduledStartTime: baseTime,
      scheduledEndTime: new Date(baseTime.getTime() + 30 * 60000),
    }),
    // Staff conflict - same staff, overlapping time
    createMockAppointment({
      id: 'apt-staff-conflict',
      staffId: 'staff-1',
      staffName: 'Alice Smith',
      clientId: 'client-2',
      clientName: 'Different Client',
      scheduledStartTime: new Date(baseTime.getTime() + 15 * 60000), // 15 min later
      scheduledEndTime: new Date(baseTime.getTime() + 45 * 60000),
    }),
    // Client conflict - same client, overlapping time
    createMockAppointment({
      id: 'apt-client-conflict',
      clientId: 'client-1',
      clientName: 'Test Client',
      staffId: 'staff-2',
      staffName: 'Bob Johnson',
      scheduledStartTime: new Date(baseTime.getTime() + 20 * 60000), // 20 min later
      scheduledEndTime: new Date(baseTime.getTime() + 50 * 60000),
    }),
  ];
}

/**
 * Create a walk-in appointment
 */
export function createMockWalkIn(overrides: Partial<LocalAppointment> = {}): LocalAppointment {
  return createMockAppointment({
    clientId: 'walk-in',
    clientName: 'Walk-in Customer',
    clientPhone: '',
    source: 'walk-in',
    ...overrides,
  });
}

/**
 * Create appointments at various times of day (for boundary testing)
 */
export function createBoundaryAppointments(): LocalAppointment[] {
  return [
    // Early morning (before business hours)
    createMockAppointment({
      id: 'apt-early',
      scheduledStartTime: new Date('2024-02-10T06:00:00'),
      scheduledEndTime: new Date('2024-02-10T06:30:00'),
    }),
    // Midnight appointment
    createMockAppointment({
      id: 'apt-midnight',
      scheduledStartTime: new Date('2024-02-10T00:00:00'),
      scheduledEndTime: new Date('2024-02-10T00:30:00'),
    }),
    // Crossing day boundary
    createMockAppointment({
      id: 'apt-day-boundary',
      scheduledStartTime: new Date('2024-02-10T23:30:00'),
      scheduledEndTime: new Date('2024-02-11T00:30:00'),
    }),
    // Late evening (after business hours)
    createMockAppointment({
      id: 'apt-late',
      scheduledStartTime: new Date('2024-02-10T21:00:00'),
      scheduledEndTime: new Date('2024-02-10T21:30:00'),
    }),
    // Very long appointment
    createMockAppointment({
      id: 'apt-long',
      scheduledStartTime: new Date('2024-02-10T09:00:00'),
      scheduledEndTime: new Date('2024-02-10T17:00:00'), // 8 hours
      services: [
        createMockService({ name: 'Full Day Package', duration: 480 }),
      ],
    }),
    // Very short appointment
    createMockAppointment({
      id: 'apt-short',
      scheduledStartTime: new Date('2024-02-10T10:00:00'),
      scheduledEndTime: new Date('2024-02-10T10:05:00'), // 5 minutes
      services: [
        createMockService({ name: 'Quick Touch-up', duration: 5 }),
      ],
    }),
  ];
}