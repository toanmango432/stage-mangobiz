/**
 * Test Factories
 * Dynamic test data generation for flexible testing
 */

import { Client, Service, Staff, LocalAppointment, AppointmentService } from '../types';
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
    storeId: TEST_SALON_ID,
    firstName: 'Test',
    lastName: 'Client',
    name: 'Test Client',
    phone: '(555) 000-0000',
    email: 'test@example.com',
    notes: [],
    isBlocked: false,
    visitSummary: {
      totalVisits: 0,
      totalSpent: 0,
      averageTicket: 0,
      noShowCount: 0,
      lateCancelCount: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced',
    isVip: false,
    ...overrides,
  };
}

/**
 * Create a mock service with optional overrides
 */
export function createMockService(overrides: Partial<Service> = {}): Service {
  return {
    id: generateId('service'),
    storeId: TEST_SALON_ID,
    name: 'Test Service',
    category: 'General',
    duration: 30,
    price: 50,
    description: 'Test service description',
    commissionRate: 0.3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced',
    ...overrides,
  };
}

/**
 * Create a mock appointment service with optional overrides
 */
export function createMockAppointmentService(overrides: Partial<AppointmentService> = {}): AppointmentService {
  const serviceName = overrides.serviceName ?? 'Test Service';
  return {
    serviceId: generateId('service'),
    serviceName,
    name: overrides.name ?? serviceName,
    staffId: 'staff-1',
    staffName: 'Test Staff',
    duration: 30,
    price: 50,
    ...overrides,
  };
}

/**
 * Create a mock staff member with optional overrides
 */
export function createMockStaff(overrides: Partial<Staff> = {}): Staff {
  return {
    id: generateId('staff'),
    storeId: TEST_SALON_ID,
    name: 'Test Staff',
    email: 'staff@salon.com',
    phone: '(555) 000-1111',
    role: 'Stylist',
    specialties: ['General'],
    status: 'available',
    isActive: true,
    schedule: [],
    servicesCountToday: 0,
    revenueToday: 0,
    tipsToday: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced',
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
    storeId: TEST_SALON_ID,
    clientId: 'client-1',
    clientName: 'Test Client',
    clientPhone: '(555) 000-0000',
    staffId: 'staff-1',
    staffName: 'Test Staff',
    scheduledStartTime: start.toISOString(),
    scheduledEndTime: end.toISOString(),
    services: [],
    status: 'scheduled',
    source: 'admin-portal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user-1',
    lastModifiedBy: 'user-1',
    syncStatus: 'synced',
    ...overrides,
  };
}

/**
 * Create a group booking with multiple appointments
 */
export function createMockGroupBooking(
  memberCount = 3,
  groupOverrides: Partial<LocalAppointment> = {}
): LocalAppointment[] {
  const appointments: LocalAppointment[] = [];
  const startTime = new Date();

  for (let i = 0; i < memberCount; i++) {
    const clientName = `Guest ${i + 1}`;

    appointments.push(
      createMockAppointment({
        id: generateId('apt-group'),
        clientId: generateId('client'),
        clientName,
        clientPhone: `(555) 000-${String(i).padStart(4, '0')}`,
        scheduledStartTime: startTime.toISOString(),
        scheduledEndTime: new Date(startTime.getTime() + 30 * 60000).toISOString(),
        ...groupOverrides,
      } as any)
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
      scheduledStartTime: baseTime.toISOString(),
      scheduledEndTime: new Date(baseTime.getTime() + 30 * 60000).toISOString(),
    }),
    // Staff conflict - same staff, overlapping time
    createMockAppointment({
      id: 'apt-staff-conflict',
      staffId: 'staff-1',
      staffName: 'Alice Smith',
      clientId: 'client-2',
      clientName: 'Different Client',
      scheduledStartTime: new Date(baseTime.getTime() + 15 * 60000).toISOString(), // 15 min later
      scheduledEndTime: new Date(baseTime.getTime() + 45 * 60000).toISOString(),
    }),
    // Client conflict - same client, overlapping time
    createMockAppointment({
      id: 'apt-client-conflict',
      clientId: 'client-1',
      clientName: 'Test Client',
      staffId: 'staff-2',
      staffName: 'Bob Johnson',
      scheduledStartTime: new Date(baseTime.getTime() + 20 * 60000).toISOString(), // 20 min later
      scheduledEndTime: new Date(baseTime.getTime() + 50 * 60000).toISOString(),
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
      scheduledStartTime: new Date('2024-02-10T06:00:00').toISOString(),
      scheduledEndTime: new Date('2024-02-10T06:30:00').toISOString(),
    }),
    // Midnight appointment
    createMockAppointment({
      id: 'apt-midnight',
      scheduledStartTime: new Date('2024-02-10T00:00:00').toISOString(),
      scheduledEndTime: new Date('2024-02-10T00:30:00').toISOString(),
    }),
    // Crossing day boundary
    createMockAppointment({
      id: 'apt-day-boundary',
      scheduledStartTime: new Date('2024-02-10T23:30:00').toISOString(),
      scheduledEndTime: new Date('2024-02-11T00:30:00').toISOString(),
    }),
    // Late evening (after business hours)
    createMockAppointment({
      id: 'apt-late',
      scheduledStartTime: new Date('2024-02-10T21:00:00').toISOString(),
      scheduledEndTime: new Date('2024-02-10T21:30:00').toISOString(),
    }),
    // Very long appointment
    createMockAppointment({
      id: 'apt-long',
      scheduledStartTime: new Date('2024-02-10T09:00:00').toISOString(),
      scheduledEndTime: new Date('2024-02-10T17:00:00').toISOString(), // 8 hours
      services: [
        createMockAppointmentService({ serviceName: 'Full Day Package', duration: 480 }),
      ],
    }),
    // Very short appointment
    createMockAppointment({
      id: 'apt-short',
      scheduledStartTime: new Date('2024-02-10T10:00:00').toISOString(),
      scheduledEndTime: new Date('2024-02-10T10:05:00').toISOString(), // 5 minutes
      services: [
        createMockAppointmentService({ serviceName: 'Quick Touch-up', duration: 5 }),
      ],
    }),
  ];
}