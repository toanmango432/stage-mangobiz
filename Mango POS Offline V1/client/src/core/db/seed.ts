import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import type { Staff, Client, Service } from '@/shared/types';

const SALON_ID = 'salon-001'; // Default salon ID for testing

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await db.staff.clear();
  await db.clients.clear();
  await db.services.clear();

  // Seed Staff
  const staff: Staff[] = [
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Amy Chen',
      email: 'amy@salon.com',
      phone: '555-0101',
      avatar: '👩‍🦰',
      specialties: [],
      status: 'available',
      schedule: [],
      servicesCountToday: 0,
      revenueToday: 0,
      tipsToday: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Beth Martinez',
      email: 'beth@salon.com',
      phone: '555-0102',
      avatar: '👩‍🦱',
      specialties: [],
      status: 'available',
      schedule: [],
      servicesCountToday: 0,
      revenueToday: 0,
      tipsToday: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Carlos Rodriguez',
      email: 'carlos@salon.com',
      phone: '555-0103',
      avatar: '👨‍🦱',
      specialties: [],
      status: 'available',
      schedule: [],
      servicesCountToday: 0,
      revenueToday: 0,
      tipsToday: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Diana Kim',
      email: 'diana@salon.com',
      phone: '555-0104',
      avatar: '👩',
      specialties: [],
      status: 'on-break',
      schedule: [],
      servicesCountToday: 0,
      revenueToday: 0,
      tipsToday: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
  ];

  await db.staff.bulkAdd(staff);
  console.log(`✅ Seeded ${staff.length} staff members`);

  // Seed Clients
  const clients: Client[] = [
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Jane Doe',
      phone: '555-1001',
      email: 'jane@example.com',
      totalVisits: 5,
      totalSpent: 450,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'John Smith',
      phone: '555-1002',
      email: 'john@example.com',
      totalVisits: 3,
      totalSpent: 280,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Sarah Johnson',
      phone: '555-1003',
      email: 'sarah@example.com',
      totalVisits: 8,
      totalSpent: 720,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
  ];

  await db.clients.bulkAdd(clients);
  console.log(`✅ Seeded ${clients.length} clients`);

  // Seed Services
  const services: Service[] = [
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Haircut',
      category: 'Hair',
      description: 'Professional haircut and styling',
      duration: 45,
      price: 45,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Hair Color',
      category: 'Hair',
      description: 'Full hair coloring service',
      duration: 120,
      price: 120,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Gel Manicure',
      category: 'Nails',
      description: 'Gel polish manicure',
      duration: 60,
      price: 35,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Pedicure',
      category: 'Nails',
      description: 'Full pedicure service',
      duration: 60,
      price: 40,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Facial',
      category: 'Skin',
      description: 'Relaxing facial treatment',
      duration: 75,
      price: 75,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
  ];

  await db.services.bulkAdd(services);
  console.log(`✅ Seeded ${services.length} services`);

  console.log('🎉 Database seeding complete!');
  return { staff, clients, services };
}

// Get salon ID for testing
export function getTestSalonId() {
  return SALON_ID;
}

