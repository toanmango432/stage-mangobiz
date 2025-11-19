import type { Ticket } from '../types';
import type { LocalAppointment } from '../types/appointment';

// Generate mock tickets
export const mockTickets: Ticket[] = [
  {
    id: 'ticket-001',
    salonId: 'salon_123',
    appointmentId: 'appt-001',
    clientId: 'client-001',
    clientName: 'Sarah Johnson',
    clientPhone: '(555) 123-4567',
    services: [
      {
        serviceId: 'svc-001',
        serviceName: 'Manicure',
        staffId: 'staff-001',
        staffName: 'Emily Chen',
        price: 35.00,
        duration: 45,
        commission: 17.50,
        startTime: new Date('2024-11-19T10:00:00'),
        endTime: new Date('2024-11-19T10:45:00')
      },
      {
        serviceId: 'svc-002',
        serviceName: 'Pedicure',
        staffId: 'staff-001',
        staffName: 'Emily Chen',
        price: 45.00,
        duration: 60,
        commission: 22.50,
        startTime: new Date('2024-11-19T10:45:00'),
        endTime: new Date('2024-11-19T11:45:00')
      }
    ],
    products: [],
    status: 'completed',
    subtotal: 80.00,
    discount: 0,
    tax: 7.20,
    tip: 15.00,
    total: 102.20,
    payments: [],
    createdAt: new Date('2024-11-19T10:00:00'),
    completedAt: new Date('2024-11-19T11:50:00'),
    createdBy: 'user-001',
    lastModifiedBy: 'user-001',
    syncStatus: 'synced'
  },
  {
    id: 'ticket-002',
    salonId: 'salon_123',
    clientId: 'client-002',
    clientName: 'Michael Brown',
    clientPhone: '(555) 234-5678',
    services: [
      {
        serviceId: 'svc-003',
        serviceName: 'Haircut',
        staffId: 'staff-002',
        staffName: 'David Kim',
        price: 50.00,
        duration: 30,
        commission: 25.00,
        startTime: new Date('2024-11-19T09:30:00'),
        endTime: new Date('2024-11-19T10:00:00')
      }
    ],
    products: [],
    status: 'in-progress',
    subtotal: 50.00,
    discount: 0,
    tax: 4.50,
    tip: 0,
    total: 54.50,
    payments: [],
    createdAt: new Date('2024-11-19T09:30:00'),
    createdBy: 'user-001',
    lastModifiedBy: 'user-001',
    syncStatus: 'synced'
  },
  {
    id: 'ticket-003',
    salonId: 'salon_123',
    clientId: 'client-003',
    clientName: 'Jessica Lee',
    clientPhone: '(555) 345-6789',
    services: [
      {
        serviceId: 'svc-004',
        serviceName: 'Gel Nails',
        staffId: 'staff-003',
        staffName: 'Lisa Martinez',
        price: 60.00,
        duration: 75,
        commission: 30.00,
        startTime: new Date('2024-11-18T14:00:00'),
        endTime: new Date('2024-11-18T15:15:00')
      },
      {
        serviceId: 'svc-005',
        serviceName: 'Nail Art',
        staffId: 'staff-003',
        staffName: 'Lisa Martinez',
        price: 20.00,
        duration: 15,
        commission: 10.00,
        startTime: new Date('2024-11-18T15:15:00'),
        endTime: new Date('2024-11-18T15:30:00')
      }
    ],
    products: [],
    status: 'completed',
    subtotal: 80.00,
    discount: 8.00,
    discountReason: '10% loyalty discount',
    tax: 6.48,
    tip: 18.00,
    total: 96.48,
    payments: [],
    createdAt: new Date('2024-11-18T14:00:00'),
    completedAt: new Date('2024-11-18T15:35:00'),
    createdBy: 'user-001',
    lastModifiedBy: 'user-001',
    syncStatus: 'synced'
  },
  {
    id: 'ticket-004',
    salonId: 'salon_123',
    clientId: 'client-004',
    clientName: 'Robert Wilson',
    clientPhone: '(555) 456-7890',
    services: [
      {
        serviceId: 'svc-006',
        serviceName: 'Facial Treatment',
        staffId: 'staff-004',
        staffName: 'Anna Taylor',
        price: 85.00,
        duration: 60,
        commission: 42.50,
        startTime: new Date('2024-11-18T11:00:00'),
        endTime: new Date('2024-11-18T12:00:00')
      }
    ],
    products: [],
    status: 'completed',
    subtotal: 85.00,
    discount: 0,
    tax: 7.65,
    tip: 20.00,
    total: 112.65,
    payments: [],
    createdAt: new Date('2024-11-18T11:00:00'),
    completedAt: new Date('2024-11-18T12:05:00'),
    createdBy: 'user-001',
    lastModifiedBy: 'user-001',
    syncStatus: 'synced'
  },
  {
    id: 'ticket-005',
    salonId: 'salon_123',
    clientId: 'client-005',
    clientName: 'Amanda Garcia',
    clientPhone: '(555) 567-8901',
    services: [
      {
        serviceId: 'svc-007',
        serviceName: 'Spa Pedicure Deluxe',
        staffId: 'staff-001',
        staffName: 'Emily Chen',
        price: 65.00,
        duration: 75,
        commission: 32.50,
        startTime: new Date('2024-11-17T13:00:00'),
        endTime: new Date('2024-11-17T14:15:00')
      }
    ],
    products: [],
    status: 'pending',
    subtotal: 65.00,
    discount: 0,
    tax: 5.85,
    tip: 0,
    total: 70.85,
    payments: [],
    createdAt: new Date('2024-11-17T13:00:00'),
    createdBy: 'user-001',
    lastModifiedBy: 'user-001',
    syncStatus: 'synced'
  }
];

// Generate mock appointments
export const mockAppointments: LocalAppointment[] = [
  {
    id: 'appt-101',
    salonId: 'salon_123',
    clientId: 'client-101',
    clientName: 'Jennifer Davis',
    clientPhone: '(555) 678-9012',
    staffId: 'staff-001',
    staffName: 'Emily Chen',
    services: [
      {
        serviceId: 'svc-001',
        serviceName: 'Manicure',
        staffId: 'staff-001',
        staffName: 'Emily Chen',
        duration: 45,
        price: 35.00
      }
    ],
    status: 'scheduled',
    scheduledStartTime: new Date('2024-11-20T10:00:00'),
    scheduledEndTime: new Date('2024-11-20T10:45:00'),
    notes: 'Client prefers natural colors',
    source: 'online',
    createdAt: new Date('2024-11-15T08:30:00'),
    updatedAt: new Date('2024-11-15T08:30:00'),
    createdBy: 'user-001',
    lastModifiedBy: 'user-001',
    syncStatus: 'synced'
  },
  {
    id: 'appt-102',
    salonId: 'salon_123',
    clientId: 'client-102',
    clientName: 'Christopher Martinez',
    clientPhone: '(555) 789-0123',
    staffId: 'staff-002',
    staffName: 'David Kim',
    services: [
      {
        serviceId: 'svc-003',
        serviceName: 'Haircut',
        staffId: 'staff-002',
        staffName: 'David Kim',
        duration: 30,
        price: 50.00
      },
      {
        serviceId: 'svc-008',
        serviceName: 'Hair Styling',
        staffId: 'staff-002',
        staffName: 'David Kim',
        duration: 20,
        price: 30.00
      }
    ],
    status: 'checked-in',
    scheduledStartTime: new Date('2024-11-19T14:00:00'),
    scheduledEndTime: new Date('2024-11-19T14:50:00'),
    checkInTime: new Date('2024-11-19T13:55:00'),
    source: 'walk-in',
    createdAt: new Date('2024-11-19T13:55:00'),
    updatedAt: new Date('2024-11-19T13:55:00'),
    createdBy: 'user-001',
    lastModifiedBy: 'user-001',
    syncStatus: 'synced'
  },
  {
    id: 'appt-103',
    salonId: 'salon_123',
    clientId: 'client-103',
    clientName: 'Michelle Anderson',
    clientPhone: '(555) 890-1234',
    staffId: 'staff-003',
    staffName: 'Lisa Martinez',
    services: [
      {
        serviceId: 'svc-004',
        serviceName: 'Gel Nails',
        staffId: 'staff-003',
        staffName: 'Lisa Martinez',
        duration: 75,
        price: 60.00
      }
    ],
    status: 'completed',
    scheduledStartTime: new Date('2024-11-18T10:00:00'),
    scheduledEndTime: new Date('2024-11-18T11:15:00'),
    actualStartTime: new Date('2024-11-18T10:05:00'),
    actualEndTime: new Date('2024-11-18T11:20:00'),
    checkInTime: new Date('2024-11-18T09:58:00'),
    source: 'phone',
    createdAt: new Date('2024-11-16T12:00:00'),
    updatedAt: new Date('2024-11-18T11:20:00'),
    createdBy: 'user-001',
    lastModifiedBy: 'user-001',
    syncStatus: 'synced'
  },
  {
    id: 'appt-104',
    salonId: 'salon_123',
    clientId: 'client-104',
    clientName: 'Daniel Thompson',
    clientPhone: '(555) 901-2345',
    staffId: 'staff-002',
    staffName: 'David Kim',
    services: [
      {
        serviceId: 'svc-003',
        serviceName: 'Haircut',
        staffId: 'staff-002',
        staffName: 'David Kim',
        duration: 30,
        price: 50.00
      }
    ],
    status: 'cancelled',
    scheduledStartTime: new Date('2024-11-17T15:00:00'),
    scheduledEndTime: new Date('2024-11-17T15:30:00'),
    notes: 'Client called to cancel - will reschedule',
    source: 'online',
    createdAt: new Date('2024-11-14T10:00:00'),
    updatedAt: new Date('2024-11-17T14:00:00'),
    createdBy: 'user-001',
    lastModifiedBy: 'user-001',
    syncStatus: 'synced'
  },
  {
    id: 'appt-105',
    salonId: 'salon_123',
    clientId: 'client-105',
    clientName: 'Karen White',
    clientPhone: '(555) 012-3456',
    staffId: 'staff-004',
    staffName: 'Anna Taylor',
    services: [
      {
        serviceId: 'svc-006',
        serviceName: 'Facial Treatment',
        staffId: 'staff-004',
        staffName: 'Anna Taylor',
        duration: 60,
        price: 85.00
      },
      {
        serviceId: 'svc-009',
        serviceName: 'Massage',
        staffId: 'staff-004',
        staffName: 'Anna Taylor',
        duration: 30,
        price: 50.00
      }
    ],
    status: 'scheduled',
    scheduledStartTime: new Date('2024-11-21T11:00:00'),
    scheduledEndTime: new Date('2024-11-21T12:30:00'),
    notes: 'VIP client - prepare special room',
    source: 'phone',
    createdAt: new Date('2024-11-18T16:00:00'),
    updatedAt: new Date('2024-11-18T16:00:00'),
    createdBy: 'user-001',
    lastModifiedBy: 'user-001',
    syncStatus: 'synced'
  },
  {
    id: 'appt-106',
    salonId: 'salon_123',
    clientId: 'client-106',
    clientName: 'Steven Harris',
    clientPhone: '(555) 123-7890',
    staffId: 'staff-002',
    staffName: 'David Kim',
    services: [
      {
        serviceId: 'svc-003',
        serviceName: 'Haircut',
        staffId: 'staff-002',
        staffName: 'David Kim',
        duration: 30,
        price: 50.00
      }
    ],
    status: 'no-show',
    scheduledStartTime: new Date('2024-11-16T09:00:00'),
    scheduledEndTime: new Date('2024-11-16T09:30:00'),
    notes: 'Did not show up, did not call',
    source: 'online',
    createdAt: new Date('2024-11-13T14:00:00'),
    updatedAt: new Date('2024-11-16T09:35:00'),
    createdBy: 'user-001',
    lastModifiedBy: 'user-001',
    syncStatus: 'synced'
  }
];

// Add more mock data for variety
for (let i = 7; i <= 30; i++) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));

  mockTickets.push({
    id: `ticket-${String(i).padStart(3, '0')}`,
    salonId: 'salon_123',
    clientId: `client-${String(i).padStart(3, '0')}`,
    clientName: `Customer ${i}`,
    clientPhone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    services: [
      {
        serviceId: `svc-${i}`,
        serviceName: ['Manicure', 'Pedicure', 'Gel Nails', 'Haircut', 'Facial'][Math.floor(Math.random() * 5)],
        staffId: `staff-${Math.floor(Math.random() * 4) + 1}`,
        staffName: ['Emily Chen', 'David Kim', 'Lisa Martinez', 'Anna Taylor'][Math.floor(Math.random() * 4)],
        price: Math.floor(Math.random() * 60) + 30,
        duration: [30, 45, 60, 75, 90][Math.floor(Math.random() * 5)],
        commission: 0,
        startTime: date,
        endTime: date
      }
    ],
    products: [],
    status: ['completed', 'in-progress', 'pending'][Math.floor(Math.random() * 3)] as any,
    subtotal: Math.floor(Math.random() * 100) + 50,
    discount: 0,
    tax: Math.floor(Math.random() * 10) + 5,
    tip: Math.floor(Math.random() * 20),
    total: Math.floor(Math.random() * 120) + 60,
    payments: [],
    createdAt: date,
    completedAt: Math.random() > 0.3 ? date : undefined,
    createdBy: 'user-001',
    lastModifiedBy: 'user-001',
    syncStatus: 'synced'
  });
}

for (let i = 107; i <= 130; i++) {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 14) - 7);

  mockAppointments.push({
    id: `appt-${i}`,
    salonId: 'salon_123',
    clientId: `client-${i}`,
    clientName: `Client ${i}`,
    clientPhone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    staffId: `staff-${Math.floor(Math.random() * 4) + 1}`,
    staffName: ['Emily Chen', 'David Kim', 'Lisa Martinez', 'Anna Taylor'][Math.floor(Math.random() * 4)],
    services: [
      {
        serviceId: `svc-${i}`,
        serviceName: ['Manicure', 'Pedicure', 'Gel Nails', 'Haircut', 'Facial'][Math.floor(Math.random() * 5)],
        staffId: `staff-${Math.floor(Math.random() * 4) + 1}`,
        staffName: ['Emily Chen', 'David Kim', 'Lisa Martinez', 'Anna Taylor'][Math.floor(Math.random() * 4)],
        duration: [30, 45, 60][Math.floor(Math.random() * 3)],
        price: Math.floor(Math.random() * 60) + 30
      }
    ],
    status: ['scheduled', 'completed', 'cancelled', 'no-show', 'checked-in'][Math.floor(Math.random() * 5)] as any,
    scheduledStartTime: date,
    scheduledEndTime: new Date(date.getTime() + 60 * 60 * 1000),
    source: ['online', 'phone', 'walk-in'][Math.floor(Math.random() * 3)] as any,
    createdAt: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000),
    createdBy: 'user-001',
    lastModifiedBy: 'user-001',
    syncStatus: 'synced'
  });
}
