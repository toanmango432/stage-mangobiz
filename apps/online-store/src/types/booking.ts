import { Service } from './catalog';

export interface TimeSlot {
  time: string; // "09:00 AM"
  available: boolean;
  staffAvailable: string[]; // staff IDs who can work this slot
  endTime: string; // "10:30 AM" based on service duration
}

export interface Booking {
  id: string;
  bookingNumber: string; // "BK-2025-0001"
  client: {
    id?: string; // if registered user
    name: string;
    email: string;
    phone: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  addOns: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
  }>;
  dateTime: string; // ISO format
  endTime: string;
  staff?: {
    id: string;
    name: string;
    photo?: string;
  };
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  paymentStatus: 'unpaid' | 'deposit-paid' | 'paid' | 'refunded';
  depositAmount?: number;
  totalAmount: number;
  specialRequests?: string;
  internalNotes?: string; // admin only
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  date: string; // "2025-10-20"
  dayOfWeek: string; // "Monday"
  isOpen: boolean;
  hours?: {
    open: string; // "09:00"
    close: string; // "20:00"
  };
  timeSlots: TimeSlot[];
  fullyBooked: boolean;
}

export interface Staff {
  id: string;
  name: string;
  title: string;
  photo?: string;
  rating: number;
  specialties: string[];
  workingHours: {
    [dayOfWeek: string]: {
      start: string;
      end: string;
    };
  };
  daysOff: string[]; // dates like "2025-10-25"
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  icon?: string;
}

export type SchedulingPreference = 'same-time' | 'back-to-back' | 'flexible';

export interface GroupMember {
  id: string;
  name?: string;
  service: Service | {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
  };
  addOns: AddOn[];
  answers?: Record<string, { answer: string; priceModifier: number }>;
  selectedAddOns?: Array<{ id: string; name: string; price: number; duration: number }>;
  staff?: Staff;
  dateTime?: string;
  endTime?: string;
}

export interface GroupBooking {
  id: string;
  groupId: string;
  groupSize: number;
  schedulingPreference: SchedulingPreference;
  members: GroupMember[];
  contactPerson: {
    name: string;
    email: string;
    phone: string;
  };
  specialRequests?: string;
  createdAt: string;
}

export interface BookingFormData {
  isGroup: boolean;
  groupSize?: number;
  groupChoiceMade?: boolean;
  groupSetupComplete?: boolean;
  schedulingPreference?: SchedulingPreference;
  members?: GroupMember[];
  service: Service | {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
  };
  serviceQuestions?: Record<string, {
    answer: string;
    priceModifier: number;
  }>;
  answers?: Record<string, { answer: string; priceModifier: number }>;
  questionsAnswered?: boolean;
  readyForTechnician?: boolean;
  date?: string;
  time?: string;
  staff?: Staff;
  readyForDateTime?: boolean;
  addOns: AddOn[];
  readyForSummary?: boolean;
  client: {
    name: string;
    email: string;
    phone: string;
  };
  specialRequests?: string;
  agreedToPolicies: boolean;
}
