import React, { useState, createContext, useContext } from 'react';
// Staff interface
export interface Staff {
  id: number;
  name: string;
  shortName?: string;
  time: string;
  image: string;
  status: 'ready' | 'busy' | 'off';
  color: string;
  count: number;
  revenue?: {
    transactions: number;
    tickets: number;
    amount: number;
  } | null;
  nextAppointmentTime?: string;
  nextAppointmentEta?: string;
  lastServiceTime?: string;
  lastServiceAgo?: string;
  turnCount?: number;
  ticketsServicedCount?: number;
  totalSalesAmount?: number;
  specialty?: string;
  activeTickets?: ActiveTicket[];
}
// Active ticket interface
export interface ActiveTicket {
  id: number;
  clientName: string;
  serviceName: string;
  status: 'pending' | 'in-service' | 'completed';
}
// Ticket interface
export interface Ticket {
  id: number;
  number: number;
  clientName: string;
  clientType: string;
  service: string;
  time: string;
  duration: string;
  status: 'waiting' | 'in-service' | 'completed';
  assignedTo?: {
    id: number;
    name: string;
    color: string;
  };
  notes?: string;
  priority?: 'normal' | 'high';
  technician?: string;
  techColor?: string;
  techId?: number;
}
// New Appointment interface
export interface Appointment {
  id: number;
  clientName: string;
  clientType: string;
  service: string;
  additionalServices: number;
  time: string;
  timeSlot: string;
  duration: string;
  technician?: string;
  techColor?: string;
  techId?: number;
  isVip: boolean;
  checkedIn: boolean;
}
// Coming Appointment interface
export interface ComingAppointment {
  id: number;
  clientName: string;
  appointmentTime: string;
  service: string;
  duration: string;
  technician?: string;
  techColor?: string;
  status?: string;
  isVip?: boolean;
  hasNotes?: boolean;
  hasPaymentHold?: boolean;
}
// Completion details interface
export interface CompletionDetails {
  amount?: number;
  tip?: number;
  paymentMethod?: string;
  notes?: string;
}
// New PendingTicket interface for payment processing
export interface PendingTicket {
  id: number;
  number: number;
  clientName: string;
  clientType: string;
  service: string;
  additionalServices: number;
  subtotal: number;
  tax: number;
  tip: number;
  paymentType: 'card' | 'cash' | 'venmo';
  time: string;
  technician?: string;
  techColor?: string;
  techId?: number;
}
// Context interface
interface TicketContextType {
  waitlist: Ticket[];
  inService: Ticket[];
  completed: Ticket[];
  pendingTickets: PendingTicket[];
  staff: Staff[];
  appointments: Appointment[];
  comingAppointments: ComingAppointment[];
  createTicket: (ticket: Omit<Ticket, 'id' | 'number' | 'status'>) => void;
  assignTicket: (ticketId: number, staffId: number, staffName: string, staffColor: string) => void;
  completeTicket: (ticketId: number, completionDetails: CompletionDetails) => void;
  cancelTicket: (ticketId: number) => void;
  deleteTicket: (ticketId: number, reason: string) => void;
  resetStaffStatus: () => void;
  checkInAppointment: (appointmentId: number) => void;
  createAppointment: (appointment: Omit<Appointment, 'id' | 'checkedIn'>) => void;
  markTicketAsPaid: (ticketId: number) => void;
}
// Mock staff data with 20 staff members - all set to "ready" status
const mockStaffData: Staff[] = [{
  id: 1,
  name: 'Sophia Martinez',
  shortName: 'Sophia M.',
  time: '8:30a',
  image: 'https://randomuser.me/api/portraits/women/1.jpg',
  status: 'ready',
  color: 'bg-[#9B5DE5]',
  count: 1,
  revenue: {
    transactions: 12,
    tickets: 15,
    amount: 680
  },
  nextAppointmentTime: '10:30a',
  nextAppointmentEta: '2h',
  lastServiceTime: '9:15a',
  lastServiceAgo: '15m ago',
  turnCount: 3,
  ticketsServicedCount: 3,
  totalSalesAmount: 245,
  specialty: 'hair',
  activeTickets: []
}, {
  id: 2,
  name: 'James Wilson',
  shortName: 'James W.',
  time: '8:45a',
  image: 'https://randomuser.me/api/portraits/men/2.jpg',
  status: 'ready',
  color: 'bg-[#3F83F8]',
  count: 2,
  revenue: {
    transactions: 10,
    tickets: 12,
    amount: 520
  },
  nextAppointmentTime: '11:00a',
  nextAppointmentEta: '2.5h',
  lastServiceTime: '9:30a',
  lastServiceAgo: '30m ago',
  turnCount: 2,
  ticketsServicedCount: 2,
  totalSalesAmount: 180,
  specialty: 'hair',
  activeTickets: []
}, {
  id: 3,
  name: 'Emma Johnson',
  shortName: 'Emma J.',
  time: '9:00a',
  image: 'https://randomuser.me/api/portraits/women/3.jpg',
  status: 'ready',
  color: 'bg-[#4CC2A9]',
  count: 3,
  revenue: {
    transactions: 15,
    tickets: 18,
    amount: 750
  },
  nextAppointmentTime: '10:45a',
  nextAppointmentEta: '1.75h',
  lastServiceTime: '9:20a',
  lastServiceAgo: '20m ago',
  turnCount: 4,
  ticketsServicedCount: 4,
  totalSalesAmount: 320,
  specialty: 'nails',
  activeTickets: []
}, {
  id: 4,
  name: 'Michael Brown',
  shortName: 'Michael B.',
  time: '8:15a',
  image: 'https://randomuser.me/api/portraits/men/4.jpg',
  status: 'ready',
  color: 'bg-[#E5565B]',
  count: 4,
  revenue: {
    transactions: 8,
    tickets: 10,
    amount: 480
  },
  nextAppointmentTime: '10:15a',
  nextAppointmentEta: '2h',
  lastServiceTime: '9:45a',
  lastServiceAgo: '45m ago',
  turnCount: 2,
  ticketsServicedCount: 2,
  totalSalesAmount: 195,
  specialty: 'massage',
  activeTickets: []
}, {
  id: 5,
  name: 'Olivia Davis',
  shortName: 'Olivia D.',
  time: '8:30a',
  image: 'https://randomuser.me/api/portraits/women/5.jpg',
  status: 'ready',
  color: 'bg-[#9B5DE5]',
  count: 5,
  revenue: {
    transactions: 14,
    tickets: 16,
    amount: 690
  },
  nextAppointmentTime: '11:30a',
  nextAppointmentEta: '3h',
  lastServiceTime: '9:10a',
  lastServiceAgo: '10m ago',
  turnCount: 3,
  ticketsServicedCount: 3,
  totalSalesAmount: 280,
  specialty: 'skincare',
  activeTickets: []
}, {
  id: 6,
  name: 'William Garcia',
  shortName: 'William G.',
  time: '9:00a',
  image: 'https://randomuser.me/api/portraits/men/6.jpg',
  status: 'ready',
  color: 'bg-[#3F83F8]',
  count: 6,
  revenue: {
    transactions: 9,
    tickets: 11,
    amount: 510
  },
  nextAppointmentTime: '10:30a',
  nextAppointmentEta: '1.5h',
  lastServiceTime: '9:40a',
  lastServiceAgo: '40m ago',
  turnCount: 2,
  ticketsServicedCount: 2,
  totalSalesAmount: 175,
  specialty: 'hair',
  activeTickets: []
}, {
  id: 7,
  name: 'Ava Rodriguez',
  shortName: 'Ava R.',
  time: '8:45a',
  image: 'https://randomuser.me/api/portraits/women/7.jpg',
  status: 'ready',
  color: 'bg-[#4CC2A9]',
  count: 7,
  revenue: {
    transactions: 16,
    tickets: 19,
    amount: 820
  },
  nextAppointmentTime: '11:15a',
  nextAppointmentEta: '2.5h',
  lastServiceTime: '9:25a',
  lastServiceAgo: '25m ago',
  turnCount: 4,
  ticketsServicedCount: 4,
  totalSalesAmount: 340,
  specialty: 'nails',
  activeTickets: []
}, {
  id: 8,
  name: 'Alexander Martinez',
  shortName: 'Alex M.',
  time: '8:30a',
  image: 'https://randomuser.me/api/portraits/men/8.jpg',
  status: 'ready',
  color: 'bg-[#E5565B]',
  count: 8,
  revenue: {
    transactions: 11,
    tickets: 13,
    amount: 590
  },
  nextAppointmentTime: '10:45a',
  nextAppointmentEta: '2.25h',
  lastServiceTime: '9:35a',
  lastServiceAgo: '35m ago',
  turnCount: 3,
  ticketsServicedCount: 3,
  totalSalesAmount: 230,
  specialty: 'waxing',
  activeTickets: []
}, {
  id: 9,
  name: 'Sofia Hernandez',
  shortName: 'Sofia H.',
  time: '9:00a',
  image: 'https://randomuser.me/api/portraits/women/9.jpg',
  status: 'ready',
  color: 'bg-[#9B5DE5]',
  count: 9,
  revenue: {
    transactions: 13,
    tickets: 15,
    amount: 670
  },
  nextAppointmentTime: '11:00a',
  nextAppointmentEta: '2h',
  lastServiceTime: '9:15a',
  lastServiceAgo: '15m ago',
  turnCount: 3,
  ticketsServicedCount: 3,
  totalSalesAmount: 260,
  specialty: 'skincare',
  activeTickets: []
}, {
  id: 10,
  name: 'Benjamin Lopez',
  shortName: 'Ben L.',
  time: '8:15a',
  image: 'https://randomuser.me/api/portraits/men/10.jpg',
  status: 'ready',
  color: 'bg-[#3F83F8]',
  count: 10,
  revenue: {
    transactions: 9,
    tickets: 11,
    amount: 520
  },
  nextAppointmentTime: '10:15a',
  nextAppointmentEta: '2h',
  lastServiceTime: '9:30a',
  lastServiceAgo: '30m ago',
  turnCount: 2,
  ticketsServicedCount: 2,
  totalSalesAmount: 185,
  specialty: 'massage',
  activeTickets: []
}, {
  id: 11,
  name: 'Charlotte Gonzalez',
  shortName: 'Charlotte G.',
  time: '8:45a',
  image: 'https://randomuser.me/api/portraits/women/11.jpg',
  status: 'ready',
  color: 'bg-[#4CC2A9]',
  count: 11,
  revenue: {
    transactions: 15,
    tickets: 18,
    amount: 780
  },
  nextAppointmentTime: '11:30a',
  nextAppointmentEta: '2.75h',
  lastServiceTime: '9:20a',
  lastServiceAgo: '20m ago',
  turnCount: 4,
  ticketsServicedCount: 4,
  totalSalesAmount: 310,
  specialty: 'nails',
  activeTickets: []
}, {
  id: 12,
  name: 'Lucas Wilson',
  shortName: 'Lucas W.',
  time: '9:00a',
  image: 'https://randomuser.me/api/portraits/men/12.jpg',
  status: 'ready',
  color: 'bg-[#E5565B]',
  count: 12,
  revenue: {
    transactions: 10,
    tickets: 12,
    amount: 560
  },
  nextAppointmentTime: '10:30a',
  nextAppointmentEta: '1.5h',
  lastServiceTime: '9:45a',
  lastServiceAgo: '45m ago',
  turnCount: 2,
  ticketsServicedCount: 2,
  totalSalesAmount: 200,
  specialty: 'hair',
  activeTickets: []
}, {
  id: 13,
  name: 'Amelia Anderson',
  shortName: 'Amelia A.',
  time: '8:30a',
  image: 'https://randomuser.me/api/portraits/women/13.jpg',
  status: 'ready',
  color: 'bg-[#9B5DE5]',
  count: 13,
  revenue: {
    transactions: 14,
    tickets: 16,
    amount: 720
  },
  nextAppointmentTime: '11:15a',
  nextAppointmentEta: '2.75h',
  lastServiceTime: '9:10a',
  lastServiceAgo: '10m ago',
  turnCount: 3,
  ticketsServicedCount: 3,
  totalSalesAmount: 290,
  specialty: 'combo',
  activeTickets: []
}, {
  id: 14,
  name: 'Henry Thomas',
  shortName: 'Henry T.',
  time: '8:15a',
  image: 'https://randomuser.me/api/portraits/men/14.jpg',
  status: 'ready',
  color: 'bg-[#3F83F8]',
  count: 14,
  revenue: {
    transactions: 8,
    tickets: 10,
    amount: 490
  },
  nextAppointmentTime: '10:45a',
  nextAppointmentEta: '2.5h',
  lastServiceTime: '9:40a',
  lastServiceAgo: '40m ago',
  turnCount: 2,
  ticketsServicedCount: 2,
  totalSalesAmount: 180,
  specialty: 'hair',
  activeTickets: []
}, {
  id: 15,
  name: 'Evelyn Taylor',
  shortName: 'Evelyn T.',
  time: '9:00a',
  image: 'https://randomuser.me/api/portraits/women/15.jpg',
  status: 'ready',
  color: 'bg-[#4CC2A9]',
  count: 15,
  revenue: {
    transactions: 16,
    tickets: 19,
    amount: 840
  },
  nextAppointmentTime: '11:00a',
  nextAppointmentEta: '2h',
  lastServiceTime: '9:25a',
  lastServiceAgo: '25m ago',
  turnCount: 4,
  ticketsServicedCount: 4,
  totalSalesAmount: 350,
  specialty: 'skincare',
  activeTickets: []
}, {
  id: 16,
  name: 'Jacob Moore',
  shortName: 'Jacob M.',
  time: '8:45a',
  image: 'https://randomuser.me/api/portraits/men/16.jpg',
  status: 'ready',
  color: 'bg-[#E5565B]',
  count: 16,
  revenue: {
    transactions: 11,
    tickets: 13,
    amount: 580
  },
  nextAppointmentTime: '10:15a',
  nextAppointmentEta: '1.5h',
  lastServiceTime: '9:35a',
  lastServiceAgo: '35m ago',
  turnCount: 3,
  ticketsServicedCount: 3,
  totalSalesAmount: 225,
  specialty: 'massage',
  activeTickets: []
}, {
  id: 17,
  name: 'Harper Jackson',
  shortName: 'Harper J.',
  time: '8:30a',
  image: 'https://randomuser.me/api/portraits/women/17.jpg',
  status: 'ready',
  color: 'bg-[#9B5DE5]',
  count: 17,
  revenue: {
    transactions: 13,
    tickets: 15,
    amount: 650
  },
  nextAppointmentTime: '11:30a',
  nextAppointmentEta: '3h',
  lastServiceTime: '9:15a',
  lastServiceAgo: '15m ago',
  turnCount: 3,
  ticketsServicedCount: 3,
  totalSalesAmount: 250,
  specialty: 'nails',
  activeTickets: []
}, {
  id: 18,
  name: 'Sebastian White',
  shortName: 'Sebastian W.',
  time: '9:00a',
  image: 'https://randomuser.me/api/portraits/men/18.jpg',
  status: 'ready',
  color: 'bg-[#3F83F8]',
  count: 18,
  revenue: {
    transactions: 9,
    tickets: 11,
    amount: 530
  },
  nextAppointmentTime: '10:30a',
  nextAppointmentEta: '1.5h',
  lastServiceTime: '9:30a',
  lastServiceAgo: '30m ago',
  turnCount: 2,
  ticketsServicedCount: 2,
  totalSalesAmount: 190,
  specialty: 'hair',
  activeTickets: []
}, {
  id: 19,
  name: 'Luna Harris',
  shortName: 'Luna H.',
  time: '8:15a',
  image: 'https://randomuser.me/api/portraits/women/19.jpg',
  status: 'ready',
  color: 'bg-[#4CC2A9]',
  count: 19,
  revenue: {
    transactions: 15,
    tickets: 18,
    amount: 760
  },
  nextAppointmentTime: '11:15a',
  nextAppointmentEta: '3h',
  lastServiceTime: '9:20a',
  lastServiceAgo: '20m ago',
  turnCount: 4,
  ticketsServicedCount: 4,
  totalSalesAmount: 300,
  specialty: 'combo',
  activeTickets: []
}, {
  id: 20,
  name: 'Elijah Clark',
  shortName: 'Elijah C.',
  time: '8:45a',
  image: 'https://randomuser.me/api/portraits/men/20.jpg',
  status: 'ready',
  color: 'bg-[#E5565B]',
  count: 20,
  revenue: {
    transactions: 10,
    tickets: 12,
    amount: 550
  },
  nextAppointmentTime: '10:45a',
  nextAppointmentEta: '2h',
  lastServiceTime: '9:40a',
  lastServiceAgo: '40m ago',
  turnCount: 2,
  ticketsServicedCount: 2,
  totalSalesAmount: 205,
  specialty: 'waxing',
  activeTickets: []
}];
// Mock appointments data
const mockAppointmentsData: Appointment[] = [{
  id: 1,
  clientName: 'Jessica Thompson',
  clientType: 'Regular',
  service: 'Haircut & Style',
  additionalServices: 0,
  time: new Date(new Date().setHours(new Date().getHours() + 0.5)).toISOString(),
  timeSlot: '2:00 PM',
  duration: '45 min',
  technician: 'Sophia Martinez',
  techColor: 'bg-[#9B5DE5]',
  techId: 1,
  isVip: false,
  checkedIn: false
}, {
  id: 2,
  clientName: 'Robert Chen',
  clientType: 'New',
  service: 'Beard Trim',
  additionalServices: 0,
  time: new Date(new Date().setHours(new Date().getHours() + 1)).toISOString(),
  timeSlot: '2:30 PM',
  duration: '30 min',
  technician: 'James Wilson',
  techColor: 'bg-[#3F83F8]',
  techId: 2,
  isVip: false,
  checkedIn: false
}, {
  id: 3,
  clientName: 'Amanda Davis',
  clientType: 'Regular',
  service: 'Full Color',
  additionalServices: 1,
  time: new Date(new Date().setHours(new Date().getHours() + 1.5)).toISOString(),
  timeSlot: '3:00 PM',
  duration: '120 min',
  technician: 'Emma Johnson',
  techColor: 'bg-[#4CC2A9]',
  techId: 3,
  isVip: true,
  checkedIn: false
}, {
  id: 4,
  clientName: 'Tiffany Wong',
  clientType: 'Regular',
  service: 'Manicure',
  additionalServices: 2,
  time: new Date(new Date().setHours(new Date().getHours() + 2)).toISOString(),
  timeSlot: '3:30 PM',
  duration: '45 min',
  isVip: false,
  checkedIn: false
}, {
  id: 5,
  clientName: 'Marcus Johnson',
  clientType: 'Regular',
  service: 'Haircut',
  additionalServices: 0,
  time: new Date(new Date().setHours(new Date().getHours() + 3)).toISOString(),
  timeSlot: '4:30 PM',
  duration: '30 min',
  technician: 'Michael Brown',
  techColor: 'bg-[#E5565B]',
  techId: 4,
  isVip: false,
  checkedIn: false
}, {
  id: 6,
  clientName: 'Sophia Rodriguez',
  clientType: 'Regular',
  service: 'Facial',
  additionalServices: 1,
  time: new Date(new Date().setHours(new Date().getHours() - 0.5)).toISOString(),
  timeSlot: '1:00 PM',
  duration: '60 min',
  isVip: false,
  checkedIn: false
}];
// Mock coming appointments data for the ComingAppointments component
const mockComingAppointmentsData: ComingAppointment[] = [
// Late appointments (already past the appointment time)
{
  id: 101,
  clientName: 'Jennifer Smith',
  appointmentTime: new Date(new Date().getTime() - 15 * 60000).toISOString(),
  service: 'Balayage & Cut',
  duration: '120 min',
  technician: 'Sophia Martinez',
  techColor: '#9B5DE5',
  status: 'booked',
  isVip: true,
  hasNotes: true,
  hasPaymentHold: true
}, {
  id: 102,
  clientName: 'Michael Brown',
  appointmentTime: new Date(new Date().getTime() - 25 * 60000).toISOString(),
  service: "Men's Haircut",
  duration: '30 min',
  technician: 'James Wilson',
  techColor: '#3F83F8',
  status: 'booked',
  hasNotes: false,
  hasPaymentHold: false
},
// Within 30 minutes
{
  id: 103,
  clientName: 'Emily Johnson',
  appointmentTime: new Date(new Date().getTime() + 10 * 60000).toISOString(),
  service: 'Manicure & Pedicure',
  duration: '75 min',
  technician: 'Ava Rodriguez',
  techColor: '#4CC2A9',
  status: 'checked-in',
  isVip: false,
  hasNotes: true,
  hasPaymentHold: false
}, {
  id: 104,
  clientName: 'David Wilson',
  appointmentTime: new Date(new Date().getTime() + 20 * 60000).toISOString(),
  service: 'Beard Trim',
  duration: '20 min',
  technician: 'Lucas Wilson',
  techColor: '#E5565B',
  status: 'booked',
  isVip: false,
  hasNotes: false,
  hasPaymentHold: false
}, {
  id: 105,
  clientName: 'Sophia Lee',
  appointmentTime: new Date(new Date().getTime() + 25 * 60000).toISOString(),
  service: 'Blowout',
  duration: '45 min',
  technician: 'Emma Johnson',
  techColor: '#4CC2A9',
  status: 'booked',
  isVip: true,
  hasNotes: true,
  hasPaymentHold: true
},
// Within 1 hour (30-60 minutes)
{
  id: 106,
  clientName: 'James Taylor',
  appointmentTime: new Date(new Date().getTime() + 35 * 60000).toISOString(),
  service: 'Haircut & Style',
  duration: '60 min',
  technician: 'William Garcia',
  techColor: '#3F83F8',
  status: 'booked',
  isVip: false,
  hasNotes: false,
  hasPaymentHold: false
}, {
  id: 107,
  clientName: 'Olivia Martinez',
  appointmentTime: new Date(new Date().getTime() + 45 * 60000).toISOString(),
  service: 'Full Highlights',
  duration: '150 min',
  technician: 'Sofia Hernandez',
  techColor: '#9B5DE5',
  status: 'booked',
  isVip: true,
  hasNotes: true,
  hasPaymentHold: false
}, {
  id: 108,
  clientName: 'Daniel Kim',
  appointmentTime: new Date(new Date().getTime() + 55 * 60000).toISOString(),
  service: "Men's Haircut & Shave",
  duration: '60 min',
  technician: 'Benjamin Lopez',
  techColor: '#3F83F8',
  status: 'booked',
  isVip: false,
  hasNotes: false,
  hasPaymentHold: true
},
// More than 1 hour
{
  id: 109,
  clientName: 'Isabella Rodriguez',
  appointmentTime: new Date(new Date().getTime() + 75 * 60000).toISOString(),
  service: 'Brazilian Blowout',
  duration: '120 min',
  technician: 'Charlotte Gonzalez',
  techColor: '#4CC2A9',
  status: 'booked',
  isVip: true,
  hasNotes: true,
  hasPaymentHold: false
}, {
  id: 110,
  clientName: 'Ethan Clark',
  appointmentTime: new Date(new Date().getTime() + 90 * 60000).toISOString(),
  service: 'Fade & Beard Trim',
  duration: '45 min',
  technician: 'Jacob Moore',
  techColor: '#E5565B',
  status: 'booked',
  isVip: false,
  hasNotes: false,
  hasPaymentHold: false
}, {
  id: 111,
  clientName: 'Mia Johnson',
  appointmentTime: new Date(new Date().getTime() + 120 * 60000).toISOString(),
  service: 'Full Color & Cut',
  duration: '180 min',
  technician: 'Harper Jackson',
  techColor: '#9B5DE5',
  status: 'booked',
  isVip: true,
  hasNotes: true,
  hasPaymentHold: true
}, {
  id: 112,
  clientName: 'Noah Williams',
  appointmentTime: new Date(new Date().getTime() + 150 * 60000).toISOString(),
  service: "Men's Color & Cut",
  duration: '90 min',
  technician: 'Sebastian White',
  techColor: '#3F83F8',
  status: 'booked',
  isVip: false,
  hasNotes: false,
  hasPaymentHold: false
}, {
  id: 113,
  clientName: 'Emma Davis',
  appointmentTime: new Date(new Date().getTime() + 180 * 60000).toISOString(),
  service: 'Keratin Treatment',
  duration: '180 min',
  technician: 'Luna Harris',
  techColor: '#4CC2A9',
  status: 'booked',
  isVip: true,
  hasNotes: true,
  hasPaymentHold: true
}, {
  id: 114,
  clientName: 'Liam Wilson',
  appointmentTime: new Date(new Date().getTime() + 210 * 60000).toISOString(),
  service: 'Haircut & Beard Sculpting',
  duration: '60 min',
  technician: 'Elijah Clark',
  techColor: '#E5565B',
  status: 'booked',
  isVip: false,
  hasNotes: false,
  hasPaymentHold: false
}];
// Mock pending tickets data
const mockPendingTicketsData: PendingTicket[] = [{
  id: 1,
  number: 15,
  clientName: 'Sarah Johnson',
  clientType: 'Regular',
  service: 'Full Color & Cut',
  additionalServices: 1,
  subtotal: 85.0,
  tax: 6.8,
  tip: 15.0,
  paymentType: 'card',
  time: '2:30 PM',
  technician: 'Emma Johnson',
  techColor: 'bg-[#4CC2A9]',
  techId: 3
}, {
  id: 2,
  number: 12,
  clientName: 'Mike Chen',
  clientType: 'New',
  service: 'Haircut',
  additionalServices: 0,
  subtotal: 35.0,
  tax: 2.8,
  tip: 7.0,
  paymentType: 'cash',
  time: '1:45 PM',
  technician: 'James Wilson',
  techColor: 'bg-[#3F83F8]',
  techId: 2
}, {
  id: 3,
  number: 18,
  clientName: 'Lisa Rodriguez',
  clientType: 'Regular',
  service: 'Manicure & Pedicure',
  additionalServices: 2,
  subtotal: 65.0,
  tax: 5.2,
  tip: 12.0,
  paymentType: 'venmo',
  time: '3:15 PM',
  technician: 'Olivia Davis',
  techColor: 'bg-[#9B5DE5]',
  techId: 5
}];
// Create context
const TicketContext = createContext<TicketContextType | undefined>(undefined);
// Provider component
export const TicketProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  // State for tickets - initialized with empty arrays
  const [waitlist, setWaitlist] = useState<Ticket[]>([]);
  const [inService, setInService] = useState<Ticket[]>([]);
  const [completed, setCompleted] = useState<Ticket[]>([]);
  // State for pending tickets - initialized with mock data
  const [pendingTickets, setPendingTickets] = useState<PendingTicket[]>(mockPendingTicketsData);
  // State for staff - initialized with mock data
  const [staff, setStaff] = useState<Staff[]>(mockStaffData);
  // State for appointments - initialized with mock data
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointmentsData);
  // State for coming appointments - initialized with mock data
  const [comingAppointments, setComingAppointments] = useState<ComingAppointment[]>(mockComingAppointmentsData);
  // Function to create a new ticket
  const createTicket = (ticket: Omit<Ticket, 'id' | 'number' | 'status'>) => {
    const newTicket: Ticket = {
      ...ticket,
      id: Math.max(0, ...waitlist.map(t => t.id), 0) + 1,
      number: Math.max(0, ...waitlist.map(t => t.number), 0) + 1,
      status: 'waiting'
    };
    setWaitlist(prev => [...prev, newTicket]);
  };
  // Function to assign a ticket to a staff member
  const assignTicket = (ticketId: number, staffId: number, staffName: string, staffColor: string) => {
    // Find the ticket in the waitlist
    const ticketIndex = waitlist.findIndex(ticket => ticket.id === ticketId);
    if (ticketIndex === -1) return;
    // Create a copy of the ticket with staff information
    const ticketToAssign = {
      ...waitlist[ticketIndex],
      assignedTo: {
        id: staffId,
        name: staffName,
        color: staffColor
      },
      techId: staffId,
      technician: staffName,
      techColor: staffColor,
      status: 'in-service' as const
    };
    // Remove the ticket from the waitlist
    const newWaitlist = [...waitlist];
    newWaitlist.splice(ticketIndex, 1);
    setWaitlist(newWaitlist);
    // Add the ticket to the in-service list
    setInService(prev => [...prev, ticketToAssign]);
    // Update staff status
    setStaff(prevStaff => prevStaff.map(staffMember => {
      if (staffMember.id === staffId) {
        const activeTickets = staffMember.activeTickets || [];
        return {
          ...staffMember,
          status: 'busy',
          activeTickets: [...activeTickets, {
            id: ticketToAssign.id,
            clientName: ticketToAssign.clientName,
            serviceName: ticketToAssign.service,
            status: 'in-service'
          }]
        };
      }
      return staffMember;
    }));
  };
  // Function to complete a ticket
  const completeTicket = (ticketId: number, completionDetails: CompletionDetails) => {
    // Find the ticket in the in-service list
    const ticketIndex = inService.findIndex(ticket => ticket.id === ticketId);
    if (ticketIndex === -1) return;
    // Create a copy of the ticket with completion information
    const ticketToComplete = {
      ...inService[ticketIndex],
      status: 'completed' as const,
      completionDetails,
      completedAt: new Date().toISOString()
    };
    // Remove the ticket from the in-service list
    const newInService = [...inService];
    newInService.splice(ticketIndex, 1);
    setInService(newInService);
    // Add the ticket to the completed list
    setCompleted(prev => [ticketToComplete, ...prev]);
    // Update staff status
    const staffId = ticketToComplete.assignedTo?.id;
    if (staffId) {
      setStaff(prevStaff => prevStaff.map(staffMember => {
        if (staffMember.id === staffId) {
          const activeTickets = staffMember.activeTickets || [];
          const updatedActiveTickets = activeTickets.filter(ticket => ticket.id !== ticketId);
          return {
            ...staffMember,
            status: updatedActiveTickets.length > 0 ? 'busy' : 'ready',
            activeTickets: updatedActiveTickets
          };
        }
        return staffMember;
      }));
    }
  };
  // Function to cancel a ticket
  const cancelTicket = (ticketId: number) => {
    setWaitlist(prev => prev.filter(ticket => ticket.id !== ticketId));
  };
  // Function to delete a ticket with reason
  const deleteTicket = (ticketId: number, reason: string) => {
    console.log(`Deleting ticket ${ticketId} with reason: ${reason}`);
    setWaitlist(prev => prev.filter(ticket => ticket.id !== ticketId));
  };
  // Function to reset all staff status
  const resetStaffStatus = () => {
    // Update staff status - reset to 'ready' for clocked-in staff
    const updatedStaff = staff.map(s => ({
      ...s,
      status: s.status === 'off' ? 'off' : 'ready',
      activeTickets: []
    }));
    // Move in-service tickets back to waitlist
    const updatedWaitlist = [...waitlist];
    // Update each in-service ticket to be waiting again
    inService.forEach(ticket => {
      const updatedTicket = {
        ...ticket,
        status: 'waiting' as const,
        assignedTo: undefined,
        techId: undefined,
        technician: undefined,
        techColor: undefined
      };
      updatedWaitlist.push(updatedTicket);
    });
    // Update all states
    setStaff(updatedStaff);
    setInService([]);
    setWaitlist(updatedWaitlist);
  };
  // Function to check in an appointment
  const checkInAppointment = (appointmentId: number) => {
    // Find the appointment
    const appointmentIndex = appointments.findIndex(appointment => appointment.id === appointmentId);
    if (appointmentIndex === -1) return;
    const appointment = appointments[appointmentIndex];
    // Create a new ticket from the appointment
    const newTicket: Ticket = {
      id: Math.max(0, ...waitlist.map(t => t.id), 0) + 1,
      number: Math.max(0, ...waitlist.map(t => t.number), 0) + 1,
      clientName: appointment.clientName,
      clientType: appointment.clientType,
      service: appointment.service,
      time: new Date().toISOString(),
      duration: appointment.duration,
      status: 'waiting',
      technician: appointment.technician,
      techColor: appointment.techColor,
      techId: appointment.techId
    };
    // Add to waitlist
    setWaitlist(prev => [...prev, newTicket]);
    // Mark appointment as checked in
    const updatedAppointments = [...appointments];
    updatedAppointments[appointmentIndex] = {
      ...appointment,
      checkedIn: true
    };
    setAppointments(updatedAppointments);
  };
  // Function to create a new appointment
  const createAppointment = (appointment: Omit<Appointment, 'id' | 'checkedIn'>) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: Math.max(0, ...appointments.map(a => a.id), 0) + 1,
      checkedIn: false
    };
    setAppointments(prev => [...prev, newAppointment]);
  };
  // Function to mark a pending ticket as paid
  const markTicketAsPaid = (ticketId: number) => {
    setPendingTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
    // In a real app, you would also record the payment in your database
    console.log(`Ticket ${ticketId} marked as paid`);
  };
  return <TicketContext.Provider value={{
    waitlist,
    inService,
    completed,
    pendingTickets,
    staff,
    appointments,
    comingAppointments,
    createTicket,
    assignTicket,
    completeTicket,
    cancelTicket,
    deleteTicket,
    resetStaffStatus,
    checkInAppointment,
    createAppointment,
    markTicketAsPaid
  }}>
      {children}
    </TicketContext.Provider>;
};
// Custom hook for using the context
export const useTickets = () => {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
};