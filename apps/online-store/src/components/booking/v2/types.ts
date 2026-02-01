// V2 Booking Types - Redesigned for world-class UX

export interface ServiceQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect' | 'boolean';
  required: boolean;
  options?: Array<{
    label: string;
    value: string;
    priceModifier?: number; // Additional cost for this option
  }>;
  placeholder?: string;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  icon?: string;
  category?: string;
}

export interface CartItem {
  id: string;
  service: Service;
  assignedTo: string; // "Me", "Guest 1", "Guest 2", etc.
  personId?: string; // For tracking individual people
  answers?: Record<string, any>; // Answers to service questions
  addOns?: AddOn[]; // Selected add-ons
  notes?: string; // Special requests for this service
}

export interface Assignment {
  cartItemId: string;
  staffId: string;
  staffName?: string;
  date: string;
  time: string;
  duration: number;
}

export interface BookingStep {
  id: 'browse' | 'cart' | 'assign' | 'confirm';
  title: string;
  description: string;
  completed: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  image: string;
  isFeatured?: boolean;
  promoBadge?: string;
  questions?: ServiceQuestion[]; // Service-specific questions
  availableAddOns?: string[]; // IDs of available add-ons
}

export interface Staff {
  id: string;
  name: string;
  title?: string;
  role?: string; // Alias for title used by some components
  photo?: string;
  avatar?: string; // Alias for photo used by some components
  rating: number;
  specialties?: string[];
  services?: string[]; // Service IDs this staff member can perform
  availability?: Record<string, { start: string; end: string }[]>; // Day-by-day availability
  nextAvailable?: string;
  workingHours?: {
    [key: string]: { start: string; end: string };
  };
  daysOff?: string[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
  staffId?: string;
  conflict?: string;
}

export interface BookingSummary {
  totalItems: number;
  totalDuration: number;
  totalPrice: number;
  people: string[];
  timeline: Assignment[];
  specialRequests?: string; // Overall special requests for the booking
}
