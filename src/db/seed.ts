import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import type { Staff, Client, Service } from '../types';

const SALON_ID = 'salon-001'; // Default salon ID for testing

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await db.staff.clear();
  await db.clients.clear();
  await db.services.clear();

  // Seed Staff - 20 staff members, all clocked in and ready
  const staffNames = [
    { name: 'Amy Chen', avatar: '👩‍🦰', specialty: 'hair' },
    { name: 'Beth Martinez', avatar: '👩‍🦱', specialty: 'nails' },
    { name: 'Carlos Rodriguez', avatar: '👨‍🦱', specialty: 'hair' },
    { name: 'Diana Kim', avatar: '👩', specialty: 'massage' },
    { name: 'Emma Wilson', avatar: '👩‍🦰', specialty: 'skincare' },
    { name: 'Frank Johnson', avatar: '👨', specialty: 'hair' },
    { name: 'Grace Lee', avatar: '👩‍🦳', specialty: 'nails' },
    { name: 'Henry Brown', avatar: '👨‍🦲', specialty: 'waxing' },
    { name: 'Isabella Garcia', avatar: '👩‍🦱', specialty: 'hair' },
    { name: 'James Taylor', avatar: '👨‍🦱', specialty: 'combo' },
    { name: 'Katherine Davis', avatar: '👩', specialty: 'nails' },
    { name: 'Liam Anderson', avatar: '👨', specialty: 'massage' },
    { name: 'Mia Thompson', avatar: '👩‍🦰', specialty: 'skincare' },
    { name: 'Noah White', avatar: '👨‍🦱', specialty: 'hair' },
    { name: 'Olivia Harris', avatar: '👩‍🦱', specialty: 'nails' },
    { name: 'Peter Clark', avatar: '👨', specialty: 'waxing' },
    { name: 'Quinn Lewis', avatar: '👩', specialty: 'combo' },
    { name: 'Rachel Walker', avatar: '👩‍🦰', specialty: 'skincare' },
    { name: 'Samuel Hall', avatar: '👨‍🦲', specialty: 'hair' },
    { name: 'Tina Young', avatar: '👩‍🦱', specialty: 'nails' },
  ];

  const clockInTime = new Date();
  clockInTime.setHours(9, 0, 0, 0); // All clocked in at 9 AM

  const staff: Staff[] = staffNames.map((staffInfo, index) => ({
    id: uuidv4(),
    salonId: SALON_ID,
    name: staffInfo.name,
    email: `${staffInfo.name.toLowerCase().replace(' ', '.')}@salon.com`,
    phone: `555-${String(1001 + index).padStart(4, '0')}`,
    avatar: staffInfo.avatar,
    specialties: [],
    status: 'available' as const, // All ready/available
    clockedInAt: clockInTime, // All clocked in
    schedule: [],
    servicesCountToday: Math.floor(Math.random() * 5), // 0-4 services
    revenueToday: Math.floor(Math.random() * 500), // 0-500 revenue
    tipsToday: Math.floor(Math.random() * 100), // 0-100 tips
    createdAt: new Date(),
    updatedAt: new Date(),
    syncStatus: 'synced' as const,
  }));

  // Update specialties - we'll need to match service IDs later if needed
  // For now, just set specialty field for StaffCard display
  staff.forEach((s, i) => {
    const specialtyType = staffNames[i].specialty;
    // This is for display purposes in StaffCard
    (s as any).specialty = specialtyType;
  });

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
