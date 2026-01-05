/**
 * Centralized Mock Data for Development
 * This file contains all mock data for testing and development
 * Will be replaced with real API calls in production
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================
// STAFF MOCK DATA - 20 Staff Members
// ============================================

export const mockStaff = [
  // Nails Specialists (4)
  {
    id: '1',
    name: 'Sophia Martinez',
    shortName: 'Sophia M.',
    time: '8:00 AM',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
    status: 'busy' as const,
    color: '#F43F5E',
    count: 3,
    revenue: { transactions: 5, tickets: 5, amount: 450 },
    nextAppointmentTime: '2:30 PM',
    nextAppointmentEta: 'in 1h 15m',
    lastServiceTime: '12:45 PM',
    lastServiceAgo: '15 min ago',
    turnCount: 5,
    ticketsServicedCount: 5,
    totalSalesAmount: 450,
    specialty: 'nails',
    activeTickets: [
      {
        id: 'ticket-1',
        clientName: 'Emily Chen',
        serviceName: 'Gel Manicure',
        status: 'in-service' as const,
      }
    ]
  },
  {
    id: '2',
    name: 'Isabella Rodriguez',
    shortName: 'Isabella R.',
    time: '8:15 AM',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    status: 'ready' as const,
    color: '#EC4899',
    count: 2,
    revenue: { transactions: 4, tickets: 4, amount: 320 },
    nextAppointmentTime: '3:00 PM',
    nextAppointmentEta: 'in 1h 45m',
    lastServiceTime: '1:00 PM',
    lastServiceAgo: '5 min ago',
    turnCount: 4,
    ticketsServicedCount: 4,
    totalSalesAmount: 320,
    specialty: 'nails',
    activeTickets: []
  },
  {
    id: '3',
    name: 'Mia Thompson',
    shortName: 'Mia T.',
    time: '9:00 AM',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=400&auto=format&fit=crop',
    status: 'busy' as const,
    color: '#F97316',
    count: 4,
    revenue: { transactions: 6, tickets: 6, amount: 540 },
    lastServiceTime: '12:30 PM',
    lastServiceAgo: '30 min ago',
    turnCount: 6,
    ticketsServicedCount: 6,
    totalSalesAmount: 540,
    specialty: 'nails',
    activeTickets: [
      {
        id: 'ticket-2',
        clientName: 'Sarah Johnson',
        serviceName: 'Acrylic Full Set',
        status: 'in-service' as const,
      }
    ]
  },
  {
    id: '4',
    name: 'Olivia Davis',
    shortName: 'Olivia D.',
    time: '9:30 AM',
    image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=400&auto=format&fit=crop',
    status: 'ready' as const,
    color: '#D946EF',
    count: 3,
    revenue: { transactions: 3, tickets: 3, amount: 270 },
    nextAppointmentTime: '2:00 PM',
    nextAppointmentEta: 'in 45m',
    lastServiceTime: '12:15 PM',
    lastServiceAgo: '45 min ago',
    turnCount: 3,
    ticketsServicedCount: 3,
    totalSalesAmount: 270,
    specialty: 'nails',
    activeTickets: []
  },

  // Hair Specialists (5)
  {
    id: '5',
    name: 'Emma Wilson',
    shortName: 'Emma W.',
    time: '8:00 AM',
    image: 'https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=400&auto=format&fit=crop',
    status: 'busy' as const,
    color: '#8B5CF6',
    count: 5,
    revenue: { transactions: 7, tickets: 7, amount: 630 },
    nextAppointmentTime: '3:30 PM',
    nextAppointmentEta: 'in 2h 15m',
    lastServiceTime: '11:45 AM',
    lastServiceAgo: '1h 15m ago',
    turnCount: 7,
    ticketsServicedCount: 7,
    totalSalesAmount: 630,
    specialty: 'hair',
    activeTickets: [
      {
        id: 'ticket-3',
        clientName: 'Jessica Lee',
        serviceName: 'Balayage & Cut',
        status: 'in-service' as const,
      },
      {
        id: 'ticket-4',
        clientName: 'Amanda White',
        serviceName: 'Blowout',
        status: 'pending' as const,
      }
    ]
  },
  {
    id: '6',
    name: 'Ava Anderson',
    shortName: 'Ava A.',
    time: '8:30 AM',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop',
    status: 'ready' as const,
    color: '#6366F1',
    count: 4,
    revenue: { transactions: 5, tickets: 5, amount: 450 },
    nextAppointmentTime: '2:45 PM',
    nextAppointmentEta: 'in 1h 30m',
    lastServiceTime: '12:00 PM',
    lastServiceAgo: '1h ago',
    turnCount: 5,
    ticketsServicedCount: 5,
    totalSalesAmount: 450,
    specialty: 'hair',
    activeTickets: []
  },
  {
    id: '7',
    name: 'Charlotte Brown',
    shortName: 'Charlotte B.',
    time: '9:00 AM',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
    status: 'busy' as const,
    color: '#3F83F8',
    count: 6,
    revenue: { transactions: 8, tickets: 8, amount: 720 },
    lastServiceTime: '11:30 AM',
    lastServiceAgo: '1h 30m ago',
    turnCount: 8,
    ticketsServicedCount: 8,
    totalSalesAmount: 720,
    specialty: 'hair',
    activeTickets: [
      {
        id: 'ticket-5',
        clientName: 'Rachel Green',
        serviceName: 'Color & Highlights',
        status: 'in-service' as const,
      }
    ]
  },
  {
    id: '8',
    name: 'Amelia Garcia',
    shortName: 'Amelia G.',
    time: '10:00 AM',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop',
    status: 'ready' as const,
    color: '#0EA5E9',
    count: 2,
    revenue: { transactions: 3, tickets: 3, amount: 270 },
    nextAppointmentTime: '4:00 PM',
    nextAppointmentEta: 'in 2h 45m',
    lastServiceTime: '12:45 PM',
    lastServiceAgo: '15 min ago',
    turnCount: 3,
    ticketsServicedCount: 3,
    totalSalesAmount: 270,
    specialty: 'hair',
    activeTickets: []
  },
  {
    id: '9',
    name: 'Harper Miller',
    shortName: 'Harper M.',
    time: '10:30 AM',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=400&auto=format&fit=crop',
    status: 'off' as const,
    color: '#06B6D4',
    count: 0,
    revenue: null,
    turnCount: 0,
    ticketsServicedCount: 0,
    totalSalesAmount: 0,
    specialty: 'hair',
    activeTickets: []
  },

  // Massage Specialists (3)
  {
    id: '10',
    name: 'Evelyn Martinez',
    shortName: 'Evelyn M.',
    time: '8:00 AM',
    image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?q=80&w=400&auto=format&fit=crop',
    status: 'busy' as const,
    color: '#10B981',
    count: 3,
    revenue: { transactions: 4, tickets: 4, amount: 480 },
    nextAppointmentTime: '3:00 PM',
    nextAppointmentEta: 'in 1h 45m',
    lastServiceTime: '11:00 AM',
    lastServiceAgo: '2h ago',
    turnCount: 4,
    ticketsServicedCount: 4,
    totalSalesAmount: 480,
    specialty: 'massage',
    activeTickets: [
      {
        id: 'ticket-6',
        clientName: 'Lisa Anderson',
        serviceName: 'Deep Tissue Massage',
        status: 'in-service' as const,
      }
    ]
  },
  {
    id: '11',
    name: 'Abigail Taylor',
    shortName: 'Abigail T.',
    time: '9:00 AM',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop',
    status: 'ready' as const,
    color: '#22C55E',
    count: 2,
    revenue: { transactions: 2, tickets: 2, amount: 240 },
    lastServiceTime: '12:30 PM',
    lastServiceAgo: '30 min ago',
    turnCount: 2,
    ticketsServicedCount: 2,
    totalSalesAmount: 240,
    specialty: 'massage',
    activeTickets: []
  },
  {
    id: '12',
    name: 'Emily Thomas',
    shortName: 'Emily T.',
    time: '10:00 AM',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
    status: 'ready' as const,
    color: '#14B8A6',
    count: 1,
    revenue: { transactions: 1, tickets: 1, amount: 120 },
    nextAppointmentTime: '2:30 PM',
    nextAppointmentEta: 'in 1h 15m',
    lastServiceTime: '11:45 AM',
    lastServiceAgo: '1h 15m ago',
    turnCount: 1,
    ticketsServicedCount: 1,
    totalSalesAmount: 120,
    specialty: 'massage',
    activeTickets: []
  },

  // Skincare Specialists (3)
  {
    id: '13',
    name: 'Madison Jackson',
    shortName: 'Madison J.',
    time: '8:30 AM',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400&auto=format&fit=crop',
    status: 'busy' as const,
    color: '#A855F7',
    count: 4,
    revenue: { transactions: 5, tickets: 5, amount: 550 },
    nextAppointmentTime: '3:30 PM',
    nextAppointmentEta: 'in 2h 15m',
    lastServiceTime: '12:00 PM',
    lastServiceAgo: '1h ago',
    turnCount: 5,
    ticketsServicedCount: 5,
    totalSalesAmount: 550,
    specialty: 'skincare',
    activeTickets: [
      {
        id: 'ticket-7',
        clientName: 'Michelle Davis',
        serviceName: 'Hydrating Facial',
        status: 'in-service' as const,
      }
    ]
  },
  {
    id: '14',
    name: 'Ella White',
    shortName: 'Ella W.',
    time: '9:00 AM',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=400&auto=format&fit=crop',
    status: 'ready' as const,
    color: '#9B5DE5',
    count: 3,
    revenue: { transactions: 4, tickets: 4, amount: 440 },
    nextAppointmentTime: '2:15 PM',
    nextAppointmentEta: 'in 1h',
    lastServiceTime: '12:15 PM',
    lastServiceAgo: '45 min ago',
    turnCount: 4,
    ticketsServicedCount: 4,
    totalSalesAmount: 440,
    specialty: 'skincare',
    activeTickets: []
  },
  {
    id: '15',
    name: 'Scarlett Harris',
    shortName: 'Scarlett H.',
    time: '10:00 AM',
    image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=400&auto=format&fit=crop',
    status: 'off' as const,
    color: '#8B5CF6',
    count: 0,
    revenue: null,
    turnCount: 0,
    ticketsServicedCount: 0,
    totalSalesAmount: 0,
    specialty: 'skincare',
    activeTickets: []
  },

  // Waxing Specialists (2)
  {
    id: '16',
    name: 'Grace Martin',
    shortName: 'Grace M.',
    time: '9:00 AM',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=400&auto=format&fit=crop',
    status: 'busy' as const,
    color: '#F59E0B',
    count: 5,
    revenue: { transactions: 6, tickets: 6, amount: 360 },
    lastServiceTime: '12:45 PM',
    lastServiceAgo: '15 min ago',
    turnCount: 6,
    ticketsServicedCount: 6,
    totalSalesAmount: 360,
    specialty: 'waxing',
    activeTickets: [
      {
        id: 'ticket-8',
        clientName: 'Nicole Brown',
        serviceName: 'Brazilian Wax',
        status: 'in-service' as const,
      }
    ]
  },
  {
    id: '17',
    name: 'Chloe Thompson',
    shortName: 'Chloe T.',
    time: '10:00 AM',
    image: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?q=80&w=400&auto=format&fit=crop',
    status: 'ready' as const,
    color: '#FBBF24',
    count: 3,
    revenue: { transactions: 3, tickets: 3, amount: 180 },
    nextAppointmentTime: '3:00 PM',
    nextAppointmentEta: 'in 1h 45m',
    lastServiceTime: '12:00 PM',
    lastServiceAgo: '1h ago',
    turnCount: 3,
    ticketsServicedCount: 3,
    totalSalesAmount: 180,
    specialty: 'waxing',
    activeTickets: []
  },

  // Combo Specialists (2)
  {
    id: '18',
    name: 'Lily Robinson',
    shortName: 'Lily R.',
    time: '8:00 AM',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    status: 'busy' as const,
    color: '#4CC2A9',
    count: 6,
    revenue: { transactions: 8, tickets: 8, amount: 880 },
    nextAppointmentTime: '4:00 PM',
    nextAppointmentEta: 'in 2h 45m',
    lastServiceTime: '11:30 AM',
    lastServiceAgo: '1h 30m ago',
    turnCount: 8,
    ticketsServicedCount: 8,
    totalSalesAmount: 880,
    specialty: 'combo',
    activeTickets: [
      {
        id: 'ticket-9',
        clientName: 'Jennifer Wilson',
        serviceName: 'Mani-Pedi Combo',
        status: 'in-service' as const,
      }
    ]
  },
  {
    id: '19',
    name: 'Zoey Clark',
    shortName: 'Zoey C.',
    time: '9:00 AM',
    image: 'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?q=80&w=400&auto=format&fit=crop',
    status: 'ready' as const,
    color: '#84CC16',
    count: 4,
    revenue: { transactions: 5, tickets: 5, amount: 550 },
    lastServiceTime: '12:30 PM',
    lastServiceAgo: '30 min ago',
    turnCount: 5,
    ticketsServicedCount: 5,
    totalSalesAmount: 550,
    specialty: 'combo',
    activeTickets: []
  },

  // Support/General (1)
  {
    id: '20',
    name: 'Victoria Lewis',
    shortName: 'Victoria L.',
    time: '8:00 AM',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
    status: 'ready' as const,
    color: '#94A3B8',
    count: 2,
    revenue: { transactions: 2, tickets: 2, amount: 100 },
    nextAppointmentTime: '2:00 PM',
    nextAppointmentEta: 'in 45m',
    lastServiceTime: '12:45 PM',
    lastServiceAgo: '15 min ago',
    turnCount: 2,
    ticketsServicedCount: 2,
    totalSalesAmount: 100,
    specialty: 'support',
    activeTickets: []
  },
];

// ============================================
// TICKETS MOCK DATA
// ============================================

export const mockWaitlistTickets = [
  {
    id: uuidv4(),
    number: 101,
    clientName: 'Jennifer Smith',
    clientType: 'VIP',
    service: 'Gel Manicure',
    duration: '45 min',
    time: '1:15 PM',
    status: 'waiting' as const,
    notes: 'Prefers light pink colors',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    number: 102,
    clientName: 'Michael Johnson',
    clientType: 'Regular',
    service: 'Haircut',
    duration: '30 min',
    time: '1:20 PM',
    status: 'waiting' as const,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    number: 103,
    clientName: 'Ashley Williams',
    clientType: 'New',
    service: 'Facial',
    duration: '1 hour',
    time: '1:25 PM',
    status: 'waiting' as const,
    notes: 'First time client, sensitive skin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    number: 104,
    clientName: 'David Brown',
    clientType: 'Regular',
    service: 'Pedicure',
    duration: '45 min',
    time: '1:30 PM',
    status: 'waiting' as const,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    number: 105,
    clientName: 'Sarah Miller',
    clientType: 'Priority',
    service: 'Color & Highlights',
    duration: '2 hours',
    time: '1:35 PM',
    status: 'waiting' as const,
    notes: 'Wants to go lighter',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Additional 30 tickets for testing scrolling
  ...Array.from({ length: 30 }, (_, i) => {
    const ticketNum = 106 + i;
    const names = ['Chris Anderson', 'Pat Martinez', 'Sam Rodriguez', 'Drew Garcia', 'Blake Wilson', 'Cameron Lee', 'Skyler Brown', 'Dakota Jones', 'Reese Taylor', 'Phoenix White'];
    const services = ['Manicure', 'Pedicure', 'Haircut', 'Hair Color', 'Facial', 'Massage', 'Waxing', 'Nail Art', 'Spa Treatment', 'Styling'];
    const clientTypes = ['Regular', 'VIP', 'New', 'Priority', 'Regular'];
    
    const name = names[i % names.length];
    const service = services[i % services.length];
    const clientType = clientTypes[i % clientTypes.length];
    
    return {
      id: uuidv4(),
      number: ticketNum,
      clientName: `${name} ${ticketNum}`,
      clientType: clientType as 'Regular' | 'VIP' | 'New' | 'Priority',
      service: service,
      duration: '45 min',
      time: new Date(Date.now() + (i * 5 * 60000)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      status: 'waiting' as const,
      notes: i % 4 === 0 ? 'Walk-in' : '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }),
];

export const mockServiceTickets = [
  {
    id: 'ticket-1',
    number: 91,
    clientName: 'Emily Chen',
    clientType: 'Regular',
    service: 'Gel Manicure',
    duration: '45 min',
    time: '12:30 PM',
    status: 'in-service' as const,
    assignedTo: {
      id: '1',
      name: 'Sophia Martinez',
      color: '#F43F5E',
    },
    technician: 'Sophia Martinez',
    techColor: '#F43F5E',
    techId: '1',
    notes: '',
    createdAt: new Date(Date.now() - 30 * 60000), // 30 min ago
    updatedAt: new Date(),
    lastVisitDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
  },
  {
    id: 'ticket-2',
    number: 92,
    clientName: 'Sarah Johnson',
    clientType: 'VIP',
    service: 'Acrylic Full Set, Super Deluxe Pedicure, Full Body Waxing',
    duration: '1.5 hours',
    time: '12:15 PM',
    status: 'in-service' as const,
    assignedTo: {
      id: '3',
      name: 'Mia Thompson',
      color: '#F97316',
    },
    // Multi-staff assignment - 2 technicians working together
    assignedStaff: [
      { id: '3', name: 'Mia Thompson', color: '#F97316' },
      { id: '13', name: 'Madison Jackson', color: '#A855F7' },
    ],
    technician: 'Mia Thompson',
    techColor: '#F97316',
    techId: '3',
    notes: 'Wants stiletto shape',
    createdAt: new Date(Date.now() - 45 * 60000), // 45 min ago
    updatedAt: new Date(),
    lastVisitDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
  },
  {
    id: 'ticket-3',
    number: 93,
    clientName: 'Jessica Lee',
    clientType: 'New',
    service: 'Balayage & Cut',
    duration: '2 hours',
    time: '11:30 AM',
    status: 'in-service' as const,
    assignedTo: {
      id: '5',
      name: 'Emma Wilson',
      color: '#8B5CF6',
    },
    technician: 'Emma Wilson',
    techColor: '#8B5CF6',
    techId: '5',
    notes: '',
    createdAt: new Date(Date.now() - 90 * 60000), // 1.5 hours ago
    updatedAt: new Date(),
    lastVisitDate: null, // First visit
  },
  {
    id: 'ticket-5',
    number: 94,
    clientName: 'Rachel Green',
    clientType: 'VIP',
    service: 'Color & Highlights',
    duration: '2 hours',
    time: '11:45 AM',
    status: 'in-service' as const,
    assignedTo: {
      id: '7',
      name: 'Charlotte Brown',
      color: '#3F83F8',
    },
    technician: 'Charlotte Brown',
    techColor: '#3F83F8',
    techId: '7',
    notes: 'Going blonde',
    createdAt: new Date(Date.now() - 75 * 60000), // 1h 15m ago
    updatedAt: new Date(),
    lastVisitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
  },
  {
    id: 'ticket-6',
    number: 95,
    clientName: 'Lisa Anderson',
    clientType: 'Regular',
    service: 'Deep Tissue Massage',
    duration: '1 hour',
    time: '12:00 PM',
    status: 'in-service' as const,
    assignedTo: {
      id: '10',
      name: 'Evelyn Martinez',
      color: '#10B981',
    },
    technician: 'Evelyn Martinez',
    techColor: '#10B981',
    techId: '10',
    notes: 'Focus on shoulders',
    createdAt: new Date(Date.now() - 60 * 60000), // 1 hour ago
    updatedAt: new Date(),
    lastVisitDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
  },
  {
    id: 'ticket-7',
    number: 96,
    clientName: 'Michelle Davis',
    clientType: 'New',
    service: 'Hydrating Facial',
    duration: '1 hour',
    time: '12:15 PM',
    status: 'in-service' as const,
    assignedTo: {
      id: '13',
      name: 'Madison Jackson',
      color: '#A855F7',
    },
    technician: 'Madison Jackson',
    techColor: '#A855F7',
    techId: '13',
    notes: 'First time client',
    createdAt: new Date(Date.now() - 45 * 60000), // 45 min ago
    updatedAt: new Date(),
    lastVisitDate: null, // First visit
  },
  {
    id: 'ticket-8',
    number: 97,
    clientName: 'Nicole Brown',
    clientType: 'Regular',
    service: 'Brazilian Wax',
    duration: '30 min',
    time: '12:45 PM',
    status: 'in-service' as const,
    assignedTo: {
      id: '16',
      name: 'Grace Martin',
      color: '#F59E0B',
    },
    technician: 'Grace Martin',
    techColor: '#F59E0B',
    techId: '16',
    notes: '',
    createdAt: new Date(Date.now() - 15 * 60000), // 15 min ago
    updatedAt: new Date(),
    lastVisitDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
  },
  {
    id: 'ticket-9',
    number: 98,
    clientName: 'Jennifer Wilson',
    clientType: 'VIP',
    service: 'Mani-Pedi Combo',
    duration: '1.5 hours',
    time: '12:00 PM',
    status: 'in-service' as const,
    assignedTo: {
      id: '18',
      name: 'Lily Robinson',
      color: '#4CC2A9',
    },
    // Multi-staff assignment - 3 technicians for combo service
    assignedStaff: [
      { id: '18', name: 'Lily Robinson', color: '#4CC2A9' },
      { id: '1', name: 'Sophia Martinez', color: '#F43F5E' },
      { id: '4', name: 'Olivia Davis', color: '#D946EF' },
    ],
    technician: 'Lily Robinson',
    techColor: '#4CC2A9',
    techId: '18',
    notes: 'Gel on both',
    createdAt: new Date(Date.now() - 60 * 60000), // 1 hour ago
    updatedAt: new Date(),
    lastVisitDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
  },
  // Additional 30 tickets for testing scrolling
  ...Array.from({ length: 30 }, (_, i) => {
    const ticketNum = 99 + i;
    const names = ['Alex Smith', 'Jordan Lee', 'Taylor Brown', 'Casey Davis', 'Morgan Wilson', 'Riley Martinez', 'Jamie Anderson', 'Quinn Thomas', 'Avery Jackson', 'Peyton White'];
    const services = ['Gel Manicure', 'Pedicure', 'Full Set', 'Fill-In', 'Nail Art', 'Spa Pedicure', 'French Tips', 'Gel Polish', 'Acrylic Nails', 'Dip Powder'];
    const clientTypes = ['Regular', 'VIP', 'New', 'Regular', 'Regular'];
    const staffMembers = [
      { id: '1', name: 'Sophia Martinez', color: '#F43F5E' },
      { id: '3', name: 'Mia Thompson', color: '#F97316' },
      { id: '4', name: 'Olivia Davis', color: '#D946EF' },
      { id: '7', name: 'Ava Wilson', color: '#3B82F6' },
      { id: '10', name: 'Charlotte Taylor', color: '#10B981' },
    ];
    
    const staff = staffMembers[i % staffMembers.length];
    const name = names[i % names.length];
    const service = services[i % services.length];
    const clientType = clientTypes[i % clientTypes.length];
    
    // Generate varied last visit dates
    const lastVisitDaysAgo = clientType === 'New' ? null : 
      i % 4 === 0 ? 3 :     // 3 days ago
      i % 4 === 1 ? 21 :    // 3 weeks ago
      i % 4 === 2 ? 45 :    // 1.5 months ago
      120;                   // 4 months ago
    
    return {
      id: `ticket-${ticketNum}`,
      number: ticketNum,
      clientName: `${name} ${ticketNum}`,
      clientType: clientType as 'Regular' | 'VIP' | 'New',
      service: service,
      duration: '45 min',
      time: new Date(Date.now() - (i * 5 * 60000)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      status: 'in-service' as const,
      assignedTo: staff,
      technician: staff.name,
      techColor: staff.color,
      techId: staff.id,
      notes: i % 3 === 0 ? 'Special request' : '',
      createdAt: new Date(Date.now() - (i * 5 * 60000)),
      updatedAt: new Date(),
      lastVisitDate: lastVisitDaysAgo ? new Date(Date.now() - lastVisitDaysAgo * 24 * 60 * 60 * 1000) : null,
    };
  }),
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get staff by specialty
 */
export function getStaffBySpecialty(specialty: string) {
  return mockStaff.filter(staff => staff.specialty === specialty);
}

/**
 * Get staff by status
 */
export function getStaffByStatus(status: 'ready' | 'busy' | 'off') {
  return mockStaff.filter(staff => staff.status === status);
}

/**
 * Get all active (ready or busy) staff
 */
export function getActiveStaff() {
  return mockStaff.filter(staff => staff.status !== 'off');
}

/**
 * Get staff statistics
 */
export function getStaffStats() {
  return {
    total: mockStaff.length,
    ready: mockStaff.filter(s => s.status === 'ready').length,
    busy: mockStaff.filter(s => s.status === 'busy').length,
    off: mockStaff.filter(s => s.status === 'off').length,
    bySpecialty: {
      nails: getStaffBySpecialty('nails').length,
      hair: getStaffBySpecialty('hair').length,
      massage: getStaffBySpecialty('massage').length,
      skincare: getStaffBySpecialty('skincare').length,
      waxing: getStaffBySpecialty('waxing').length,
      combo: getStaffBySpecialty('combo').length,
      support: getStaffBySpecialty('support').length,
    }
  };
}
