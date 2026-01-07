// Booking Types - Adapted from POS Online Booking Module

export interface BookingService {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  duration: number; // minutes
  price: number;
  imageUrl?: string;
  addOns?: ServiceAddOn[];
  selectedAddOns?: SelectedAddOn[];
  questions?: ServiceQuestion[];
  answers?: Record<string, string>;
}

export interface ServiceAddOn {
  id: string;
  title: string;
  description?: string;
  price: number;
  duration: number; // additional minutes
}

export interface SelectedAddOn {
  id: string;
  quantity: number;
}

export interface ServiceQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect' | 'textarea';
  options?: string[];
  required: boolean;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  phone: string;
  avatar?: string;
  specialties: string[];
  rating?: number;
  isAvailable: boolean;
}

export interface TimeSlot {
  time: string; // "9:00 AM"
  available: boolean;
  staffIds: string[]; // Available staff for this slot
}

export interface TimeSlotGroup {
  label: string; // "Morning", "Afternoon", "Evening"
  slots: TimeSlot[];
  availableCount: number;
}

export interface DayOffDate {
  date: string; // "YYYY-MM-DD"
  reason?: string;
}

export interface BookingCustomer {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isGuest: boolean;
}

export interface BookingAppointment {
  id?: string;
  customerId?: string;
  customer: BookingCustomer;
  services: BookingService[];
  staffId: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "9:00 AM"
  duration: number; // total minutes
  totalPrice: number;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt?: string;
}

export interface BookingState {
  // Current booking in progress
  currentBooking: {
    customer: BookingCustomer | null;
    services: BookingService[];
    selectedStaffId: string | null;
    selectedDate: string | null;
    selectedTime: string | null;
    notes: string;
  };
  
  // Available data
  services: BookingService[];
  categories: ServiceCategory[];
  staff: Staff[];
  availableTimeSlots: TimeSlotGroup[];
  storeOffDays: DayOffDate[];
  staffOffDays: Record<string, DayOffDate[]>; // staffId -> off days
  
  // UI state
  currentStep: BookingStep;
  cartOpen: boolean;
  
  // Loading states
  loading: {
    services: boolean;
    staff: boolean;
    timeSlots: boolean;
    booking: boolean;
  };
  
  // Error states
  error: string | null;
  
  // Settings
  settings: {
    businessHours: {
      start: string; // "8:00 AM"
      end: string; // "9:00 PM"
    };
    slotInterval: number; // minutes (e.g., 15, 30)
    allowGuestBooking: boolean;
    requireDeposit: boolean;
    depositAmount: number;
  };
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  order: number;
}

export type BookingStep = 
  | 'services'
  | 'staff'
  | 'datetime'
  | 'customer'
  | 'review'
  | 'confirmed';

// API Request/Response types
export interface CreateBookingRequest {
  customer: BookingCustomer;
  services: Array<{
    serviceId: string;
    addOnIds?: string[];
    answers?: Record<string, string>;
  }>;
  staffId: string;
  date: string;
  time: string;
  notes?: string;
}

export interface CreateBookingResponse {
  success: boolean;
  bookingId: string;
  confirmationNumber: string;
  appointment: BookingAppointment;
}

export interface AvailableTimeSlotsRequest {
  date: string;
  serviceIds: string[];
  staffId?: string; // Optional: filter by specific staff
}

export interface AvailableTimeSlotsResponse {
  date: string;
  slots: TimeSlotGroup[];
}
