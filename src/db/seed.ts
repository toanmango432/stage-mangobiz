import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import type { Staff, Client, Service } from '../types';

const SALON_ID = 'default-salon'; // Default salon ID matching auth fallback

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

  // Seed Clients - includes all clients from FrontDesk mock tickets
  const clientData = [
    { firstName: 'Jane', lastName: 'Doe', phone: '555-1001', email: 'jane@example.com', visits: 5, spent: 450 },
    { firstName: 'John', lastName: 'Smith', phone: '555-1002', email: 'john@example.com', visits: 3, spent: 280 },
    { firstName: 'Sarah', lastName: 'Johnson', phone: '555-1003', email: 'sarah@example.com', visits: 8, spent: 720 },
    // Clients from FrontDesk waitlist/service tickets
    { firstName: 'Emily', lastName: 'Chen', phone: '555-1004', email: 'emily.chen@example.com', visits: 12, spent: 1200 },
    { firstName: 'Jessica', lastName: 'Lee', phone: '555-1005', email: 'jessica.lee@example.com', visits: 6, spent: 580 },
    { firstName: 'Amanda', lastName: 'White', phone: '555-1006', email: 'amanda.white@example.com', visits: 4, spent: 320 },
    { firstName: 'Rachel', lastName: 'Green', phone: '555-1007', email: 'rachel.green@example.com', visits: 10, spent: 950 },
    { firstName: 'Lisa', lastName: 'Anderson', phone: '555-1008', email: 'lisa.anderson@example.com', visits: 7, spent: 680 },
    { firstName: 'Michelle', lastName: 'Davis', phone: '555-1009', email: 'michelle.davis@example.com', visits: 15, spent: 1450 },
    { firstName: 'Nicole', lastName: 'Brown', phone: '555-1010', email: 'nicole.brown@example.com', visits: 3, spent: 240 },
    { firstName: 'Jennifer', lastName: 'Wilson', phone: '555-1011', email: 'jennifer.wilson@example.com', visits: 9, spent: 870 },
    // Pending ticket clients
    { firstName: 'Jennifer', lastName: 'Smith', phone: '555-1012', email: 'jennifer.smith@example.com', visits: 5, spent: 420 },
    { firstName: 'Michael', lastName: 'Johnson', phone: '555-1013', email: 'michael.johnson@example.com', visits: 2, spent: 180 },
    { firstName: 'Ashley', lastName: 'Williams', phone: '555-1014', email: 'ashley.williams@example.com', visits: 11, spent: 1050 },
    { firstName: 'David', lastName: 'Brown', phone: '555-1015', email: 'david.brown@example.com', visits: 4, spent: 360 },
    { firstName: 'Sarah', lastName: 'Miller', phone: '555-1016', email: 'sarah.miller@example.com', visits: 8, spent: 780 },
  ];

  const clients: Client[] = clientData.map((c) => ({
    id: uuidv4(),
    salonId: SALON_ID,
    firstName: c.firstName,
    lastName: c.lastName,
    name: `${c.firstName} ${c.lastName}`,
    phone: c.phone,
    email: c.email,
    isBlocked: false,
    visitSummary: {
      totalVisits: c.visits,
      totalSpent: c.spent,
      averageTicket: c.spent / c.visits,
      noShowCount: 0,
      lateCancelCount: 0,
    },
    notes: [],
    isVip: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'synced' as const,
  }));

  await db.clients.bulkAdd(clients);
  console.log(`✅ Seeded ${clients.length} clients`);

  // Seed Services - Complete Nail Salon Menu
  const services: Service[] = [
    // ====================
    // MANICURE SERVICES
    // ====================
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Basic Manicure',
      category: 'Manicure',
      description: 'Filing, shaping, cuticle care, buffing, and regular polish',
      duration: 30,
      price: 20,
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
      category: 'Manicure',
      description: 'Premium gel polish with long-lasting shine (lasts 2-3 weeks)',
      duration: 45,
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
      name: 'French Manicure',
      category: 'Manicure',
      description: 'Classic French tips with white and pink polish',
      duration: 40,
      price: 28,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Deluxe Spa Manicure',
      category: 'Manicure',
      description: 'Includes exfoliation, mask, hot towel treatment, and massage',
      duration: 60,
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
      name: 'Shellac Manicure',
      category: 'Manicure',
      description: 'Long-lasting shellac polish with high gloss finish',
      duration: 45,
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
      name: 'Paraffin Wax Manicure',
      category: 'Manicure',
      description: 'Therapeutic paraffin treatment with moisturizing benefits',
      duration: 50,
      price: 38,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },

    // ====================
    // PEDICURE SERVICES
    // ====================
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Basic Pedicure',
      category: 'Pedicure',
      description: 'Soak, nail trimming, cuticle care, callus removal, and polish',
      duration: 45,
      price: 30,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Gel Pedicure',
      category: 'Pedicure',
      description: 'Premium gel polish pedicure with long-lasting results',
      duration: 60,
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
      name: 'French Pedicure',
      category: 'Pedicure',
      description: 'Classic French tips on toes',
      duration: 50,
      price: 38,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Deluxe Spa Pedicure',
      category: 'Pedicure',
      description: 'Includes sugar scrub, mud mask, hot stone massage, and paraffin',
      duration: 75,
      price: 60,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Callus Treatment Pedicure',
      category: 'Pedicure',
      description: 'Intensive callus removal and foot smoothing treatment',
      duration: 60,
      price: 50,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Luxury Spa Pedicure',
      category: 'Pedicure',
      description: 'Ultimate pedicure with organic products and extended massage',
      duration: 90,
      price: 75,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },

    // ====================
    // ARTIFICIAL NAILS
    // ====================
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Acrylic Full Set',
      category: 'Artificial Nails',
      description: 'Full set of acrylic nail extensions with shaping and polish',
      duration: 90,
      price: 55,
      commissionRate: 55,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Acrylic Fill',
      category: 'Artificial Nails',
      description: 'Fill in grown-out acrylic nails with new acrylic',
      duration: 60,
      price: 35,
      commissionRate: 55,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Gel Full Set',
      category: 'Artificial Nails',
      description: 'Hard gel nail extensions for a natural look',
      duration: 90,
      price: 65,
      commissionRate: 55,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Gel Fill',
      category: 'Artificial Nails',
      description: 'Fill in grown-out gel extensions',
      duration: 60,
      price: 45,
      commissionRate: 55,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Dip Powder Full Set',
      category: 'Artificial Nails',
      description: 'Long-lasting dip powder nails (SNS)',
      duration: 75,
      price: 50,
      commissionRate: 55,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Dip Powder Fill',
      category: 'Artificial Nails',
      description: 'Fill in grown-out dip powder nails',
      duration: 60,
      price: 40,
      commissionRate: 55,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Nail Tips with Gel',
      category: 'Artificial Nails',
      description: 'Tip extensions with gel overlay',
      duration: 75,
      price: 55,
      commissionRate: 55,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },

    // ====================
    // NAIL ART & DESIGN
    // ====================
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Nail Art - Simple Design',
      category: 'Nail Art',
      description: 'Basic nail art per nail (stripes, dots, simple patterns)',
      duration: 15,
      price: 5,
      commissionRate: 60,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Nail Art - Complex Design',
      category: 'Nail Art',
      description: 'Detailed nail art per nail (flowers, characters, intricate designs)',
      duration: 30,
      price: 10,
      commissionRate: 60,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Ombre Nails',
      category: 'Nail Art',
      description: 'Beautiful gradient color blend on all nails',
      duration: 30,
      price: 15,
      commissionRate: 60,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Chrome Nails',
      category: 'Nail Art',
      description: 'Mirror chrome powder finish',
      duration: 20,
      price: 15,
      commissionRate: 60,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Rhinestones & Gems',
      category: 'Nail Art',
      description: '3D nail decorations with crystals and gems',
      duration: 20,
      price: 10,
      commissionRate: 60,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Cat Eye Gel',
      category: 'Nail Art',
      description: 'Magnetic cat eye gel polish effect',
      duration: 15,
      price: 10,
      commissionRate: 60,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },

    // ====================
    // NAIL CARE & REPAIRS
    // ====================
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Nail Repair',
      category: 'Nail Care',
      description: 'Fix broken or cracked natural or artificial nail',
      duration: 15,
      price: 10,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Gel Polish Removal',
      category: 'Nail Care',
      description: 'Safe removal of gel or shellac polish',
      duration: 20,
      price: 10,
      commissionRate: 40,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Acrylic Removal',
      category: 'Nail Care',
      description: 'Complete removal of acrylic nails',
      duration: 30,
      price: 15,
      commissionRate: 40,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Nail Strengthening Treatment',
      category: 'Nail Care',
      description: 'Protein treatment for weak or damaged nails',
      duration: 20,
      price: 15,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Polish Change',
      category: 'Nail Care',
      description: 'Remove old polish and apply new color',
      duration: 20,
      price: 12,
      commissionRate: 45,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Cuticle Oil Treatment',
      category: 'Nail Care',
      description: 'Nourishing cuticle care and conditioning',
      duration: 10,
      price: 8,
      commissionRate: 45,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },

    // ====================
    // SPECIALTY SERVICES
    // ====================
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Kids Manicure',
      category: 'Specialty',
      description: 'Age-appropriate nail service for children under 12',
      duration: 20,
      price: 15,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Kids Pedicure',
      category: 'Specialty',
      description: 'Gentle pedicure for children',
      duration: 30,
      price: 20,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Mens Manicure',
      category: 'Specialty',
      description: 'Grooming service focused on nail and cuticle care',
      duration: 30,
      price: 22,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Mens Pedicure',
      category: 'Specialty',
      description: 'Complete foot care and grooming service',
      duration: 45,
      price: 35,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },

    // ====================
    // ADD-ONS
    // ====================
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Nail Extension Per Nail',
      category: 'Add-Ons',
      description: 'Single nail extension replacement',
      duration: 10,
      price: 5,
      commissionRate: 55,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Extra Length',
      category: 'Add-Ons',
      description: 'Additional charge for extra long nails',
      duration: 15,
      price: 10,
      commissionRate: 55,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Matte Top Coat',
      category: 'Add-Ons',
      description: 'Matte finish instead of glossy',
      duration: 5,
      price: 5,
      commissionRate: 60,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Hand Massage',
      category: 'Add-Ons',
      description: '10-minute relaxing hand and arm massage',
      duration: 10,
      price: 10,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Foot Massage',
      category: 'Add-Ons',
      description: '15-minute relaxing foot and leg massage',
      duration: 15,
      price: 15,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },

    // ====================
    // HAIR SERVICES (from mock tickets)
    // ====================
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
      name: 'Color & Highlights',
      category: 'Hair',
      description: 'Hair coloring with highlights',
      duration: 120,
      price: 150,
      commissionRate: 45,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Balayage & Cut',
      category: 'Hair',
      description: 'Hand-painted balayage highlights with haircut',
      duration: 180,
      price: 220,
      commissionRate: 45,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },

    // ====================
    // SKIN SERVICES (from mock tickets)
    // ====================
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Facial',
      category: 'Skincare',
      description: 'Deep cleansing facial treatment',
      duration: 60,
      price: 85,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Hydrating Facial',
      category: 'Skincare',
      description: 'Intense hydration facial for dry skin',
      duration: 75,
      price: 95,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },

    // ====================
    // MASSAGE SERVICES (from mock tickets)
    // ====================
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Deep Tissue Massage',
      category: 'Massage',
      description: 'Therapeutic deep tissue massage',
      duration: 60,
      price: 90,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },

    // ====================
    // WAXING SERVICES (from mock tickets)
    // ====================
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Brazilian Wax',
      category: 'Waxing',
      description: 'Full Brazilian waxing service',
      duration: 30,
      price: 55,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Full Body Waxing',
      category: 'Waxing',
      description: 'Complete body waxing service',
      duration: 90,
      price: 150,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },

    // ====================
    // COMBO SERVICES (from mock tickets)
    // ====================
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Mani-Pedi Combo',
      category: 'Combo',
      description: 'Manicure and pedicure combination service',
      duration: 75,
      price: 55,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
    {
      id: uuidv4(),
      salonId: SALON_ID,
      name: 'Super Deluxe Pedicure',
      category: 'Pedicure',
      description: 'Ultimate pedicure with all premium services included',
      duration: 90,
      price: 85,
      commissionRate: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      syncStatus: 'synced',
    },
  ];

  await db.services.bulkAdd(services);
  console.log(`✅ Seeded ${services.length} services`);

  // Seed Appointments - Realistic calendar data
  const appointments: any[] = [];
  const statuses: ('confirmed' | 'pending' | 'checked-in' | 'completed' | 'cancelled' | 'no-show')[] = [
    'confirmed', 'confirmed', 'confirmed', // More confirmed appointments
    'pending', 'checked-in', 'completed', 'cancelled', 'no-show'
  ];

  // Helper to create time slots
  const createAppointment = (
    dayOffset: number,
    hour: number,
    minute: number,
    clientIndex: number,
    staffIndex: number,
    serviceIndices: number[],
    status: typeof statuses[number]
  ) => {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + dayOffset);
    startTime.setHours(hour, minute, 0, 0);

    const client = clients[clientIndex % clients.length];
    const staffMember = staff[staffIndex % staff.length];
    const appointmentServices = serviceIndices.map(idx => {
      const service = services[idx % services.length];
      return {
        serviceId: service.id,
        serviceName: service.name,
        staffId: staffMember.id,
        staffName: staffMember.name,
        duration: service.duration,
        price: service.price,
      };
    });

    const totalDuration = appointmentServices.reduce((sum, s) => sum + s.duration, 0);
    const endTime = new Date(startTime.getTime() + totalDuration * 60000);

    return {
      id: uuidv4(),
      salonId: SALON_ID,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      staffId: staffMember.id,
      staffName: staffMember.name,
      services: appointmentServices,
      status,
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      actualStartTime: status === 'checked-in' || status === 'completed' ? startTime : undefined,
      actualEndTime: status === 'completed' ? endTime : undefined,
      checkInTime: status === 'checked-in' || status === 'completed' ? new Date(startTime.getTime() - 5 * 60000) : undefined,
      notes: status === 'cancelled' ? 'Client requested cancellation' :
             status === 'no-show' ? 'Did not show up' :
             Math.random() > 0.7 ? 'First time client' : undefined,
      source: 'walk-in' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      lastModifiedBy: 'system',
      syncStatus: 'synced' as const,
    };
  };

  // TODAY - Busy day with various statuses
  appointments.push(
    // Morning rush (9 AM - 12 PM)
    createAppointment(0, 9, 0, 0, 0, [0, 1], 'completed'),
    createAppointment(0, 9, 30, 1, 1, [2], 'completed'),
    createAppointment(0, 10, 0, 2, 2, [3], 'checked-in'),
    createAppointment(0, 10, 30, 0, 3, [4, 5], 'confirmed'),
    createAppointment(0, 11, 0, 1, 4, [6], 'confirmed'),
    createAppointment(0, 11, 30, 2, 5, [7, 8], 'confirmed'),

    // Afternoon (12 PM - 5 PM)
    createAppointment(0, 12, 0, 0, 6, [9], 'confirmed'),
    createAppointment(0, 12, 30, 1, 7, [10, 11], 'pending'),
    createAppointment(0, 13, 0, 2, 8, [12], 'confirmed'),
    createAppointment(0, 13, 30, 0, 9, [13], 'no-show'),
    createAppointment(0, 14, 0, 1, 10, [14, 15], 'confirmed'),
    createAppointment(0, 14, 30, 2, 11, [16], 'cancelled'),
    createAppointment(0, 15, 0, 0, 12, [17], 'confirmed'),
    createAppointment(0, 15, 30, 1, 13, [18, 19], 'pending'),
    createAppointment(0, 16, 0, 2, 14, [20], 'confirmed'),
    createAppointment(0, 16, 30, 0, 15, [21], 'confirmed'),

    // Evening (5 PM - 8 PM)
    createAppointment(0, 17, 0, 1, 16, [22, 23], 'confirmed'),
    createAppointment(0, 17, 30, 2, 17, [24], 'confirmed'),
    createAppointment(0, 18, 0, 0, 18, [25], 'confirmed'),
    createAppointment(0, 18, 30, 1, 19, [26, 27], 'pending'),
  );

  // TOMORROW - Full schedule
  appointments.push(
    createAppointment(1, 9, 0, 0, 0, [0, 1], 'confirmed'),
    createAppointment(1, 9, 30, 1, 1, [2], 'confirmed'),
    createAppointment(1, 10, 0, 2, 2, [3, 4], 'confirmed'),
    createAppointment(1, 10, 30, 0, 3, [5], 'pending'),
    createAppointment(1, 11, 0, 1, 4, [6, 7], 'confirmed'),
    createAppointment(1, 11, 30, 2, 5, [8], 'confirmed'),
    createAppointment(1, 12, 0, 0, 6, [9, 10], 'confirmed'),
    createAppointment(1, 13, 0, 1, 7, [11], 'confirmed'),
    createAppointment(1, 14, 0, 2, 8, [12, 13], 'confirmed'),
    createAppointment(1, 15, 0, 0, 9, [14], 'confirmed'),
    createAppointment(1, 16, 0, 1, 10, [15, 16], 'pending'),
    createAppointment(1, 17, 0, 2, 11, [17], 'confirmed'),
  );

  // DAY AFTER TOMORROW - Moderate schedule
  appointments.push(
    createAppointment(2, 10, 0, 0, 0, [0], 'confirmed'),
    createAppointment(2, 11, 0, 1, 1, [1, 2], 'confirmed'),
    createAppointment(2, 13, 0, 2, 2, [3], 'pending'),
    createAppointment(2, 14, 0, 0, 3, [4, 5], 'confirmed'),
    createAppointment(2, 15, 0, 1, 4, [6], 'confirmed'),
    createAppointment(2, 16, 0, 2, 5, [7, 8], 'confirmed'),
  );

  // NEXT WEEK - Sparse schedule
  appointments.push(
    createAppointment(7, 10, 0, 0, 0, [0, 1], 'confirmed'),
    createAppointment(7, 14, 0, 1, 1, [2], 'pending'),
    createAppointment(7, 16, 0, 2, 2, [3, 4], 'confirmed'),
    createAppointment(8, 11, 0, 0, 3, [5], 'confirmed'),
    createAppointment(8, 15, 0, 1, 4, [6, 7], 'confirmed'),
  );

  // Add some past appointments (yesterday) for history
  appointments.push(
    createAppointment(-1, 9, 0, 0, 0, [0], 'completed'),
    createAppointment(-1, 10, 0, 1, 1, [1, 2], 'completed'),
    createAppointment(-1, 11, 0, 2, 2, [3], 'completed'),
    createAppointment(-1, 14, 0, 0, 3, [4], 'completed'),
    createAppointment(-1, 15, 0, 1, 4, [5, 6], 'completed'),
    createAppointment(-1, 16, 0, 2, 5, [7], 'no-show'),
  );

  await db.appointments.bulkAdd(appointments);
  console.log(`✅ Seeded ${appointments.length} appointments`);

  console.log('🎉 Database seeding complete!');
  return { staff, clients, services, appointments };
}

// Get salon ID for testing
export function getTestSalonId() {
  return SALON_ID;
}

// Re-export catalog seed functions
export { seedCatalog, needsCatalogSeed } from './catalogSeed';
