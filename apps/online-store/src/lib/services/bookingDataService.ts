// Booking Data Service - Unified data management for all booking-related data
import { Service } from '@/types/catalog';
import { getServices, syncFromSupabase } from './catalogSyncService';

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'multiple_choice' | 'yes_no' | 'scale';
  required: boolean;
  options?: string[];
  conditional?: {
    dependsOn: string;
    value: any;
  };
}

export interface Staff {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  rating: number;
  image?: string;
  bio?: string;
  certifications?: string[];
  availability?: Availability[];
}

export interface Availability {
  date: string;
  timeSlots: string[];
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  staffId?: string;
  available: boolean;
  duration: number;
}

export interface Client {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  preferences?: Record<string, any>;
}

export interface Booking {
  id: string;
  clientId: string;
  serviceIds: string[];
  staffId: string;
  date: string;
  time: string;
  duration: number;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
  preferences?: Record<string, any>;
}

export interface ServiceFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  durationMin?: number;
  durationMax?: number;
  featured?: boolean;
  availableToday?: boolean;
}

export interface StaffFilters {
  specialties?: string[];
  ratingMin?: number;
  availableToday?: boolean;
  serviceId?: string;
}

export interface SlotQuery {
  serviceId: string;
  staffId?: string;
  date: string;
  duration: number;
}

export interface Conflict {
  type: 'time' | 'staff' | 'service';
  message: string;
  suggestion?: string;
}

export interface Alternative {
  type: 'time' | 'staff' | 'service';
  option: any;
  reason: string;
}

class BookingDataService {
  private services: Service[] = [];
  private staff: Staff[] = [];
  private clients: Client[] = [];
  private bookings: Booking[] = [];

  constructor() {
    this.initializeData();
    // Trigger initial catalog sync on first load
    this.syncCatalogData();
  }

  private async syncCatalogData() {
    try {
      // Get storeId from environment or config
      // TODO: Replace with actual store ID from auth/config
      const storeId = import.meta.env.VITE_STORE_ID || 'demo-store';

      console.log('[BookingDataService] Syncing catalog data from Supabase...');
      const services = await getServices(storeId);

      if (services.length > 0) {
        // Replace services with real data from Supabase
        this.services = services.map(service => ({
          ...service,
          price: service.price ?? service.basePrice ?? 0,
          duration: service.duration ?? 30,
          featured: service.featured ?? false,
          badge: service.badge ?? undefined,
        }));

        console.log(`[BookingDataService] Loaded ${services.length} services from catalog`);
      } else {
        console.warn('[BookingDataService] No services loaded - catalog may be empty');
      }
    } catch (error) {
      console.error('[BookingDataService] Failed to sync catalog:', error);
      // Services remain empty if sync fails
    }
  }

  private initializeData() {
    // Services are now loaded via syncCatalogData() - no mock data generation

    // Staff data will be loaded from Supabase in future (US-XXX)
    // For now, using placeholder empty array
    // TODO: Replace with real staff sync when store-app staff data is available
    this.staff = [];

    // Load clients from localStorage
    const storedClients = localStorage.getItem('booking_clients');
    if (storedClients) {
      this.clients = JSON.parse(storedClients);
    }

    // Load bookings from localStorage
    const storedBookings = localStorage.getItem('booking_bookings');
    if (storedBookings) {
      this.bookings = JSON.parse(storedBookings);
    }
  }

  private generateAvailability(staffId: string): Availability[] {
    const availability: Availability[] = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const timeSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
      ];
      
      availability.push({
        date: dateStr,
        timeSlots: timeSlots.filter(() => Math.random() > 0.3) // Random availability
      });
    }
    
    return availability;
  }

  // Services
  async getServices(filters?: ServiceFilters): Promise<Service[]> {
    let filteredServices = [...this.services];

    if (filters) {
      if (filters.category) {
        filteredServices = filteredServices.filter(s => s.category === filters.category);
      }
      if (filters.priceMin !== undefined) {
        filteredServices = filteredServices.filter(s => s.price >= filters.priceMin!);
      }
      if (filters.priceMax !== undefined) {
        filteredServices = filteredServices.filter(s => s.price <= filters.priceMax!);
      }
      if (filters.durationMin !== undefined) {
        filteredServices = filteredServices.filter(s => s.duration >= filters.durationMin!);
      }
      if (filters.durationMax !== undefined) {
        filteredServices = filteredServices.filter(s => s.duration <= filters.durationMax!);
      }
      if (filters.featured !== undefined) {
        filteredServices = filteredServices.filter(s => s.featured === filters.featured);
      }
    }

    return filteredServices;
  }

  async getServiceById(id: string): Promise<Service | null> {
    return this.services.find(s => s.id === id) || null;
  }

  async getFeaturedServices(): Promise<Service[]> {
    const featured = this.services.filter(s => s.featured === true);
    return featured.length > 0 ? featured : this.services.slice(0, 3);
  }

  async getServicesByCategory(category: string): Promise<Service[]> {
    return this.services.filter(s => s.category === category);
  }

  // Staff
  async getStaff(filters?: StaffFilters): Promise<Staff[]> {
    let filteredStaff = [...this.staff];

    if (filters) {
      if (filters.specialties && filters.specialties.length > 0) {
        filteredStaff = filteredStaff.filter(s => 
          filters.specialties!.some(specialty => s.specialties.includes(specialty))
        );
      }
      if (filters.ratingMin !== undefined) {
        filteredStaff = filteredStaff.filter(s => s.rating >= filters.ratingMin!);
      }
      if (filters.serviceId) {
        const service = await this.getServiceById(filters.serviceId);
        if (service) {
          filteredStaff = filteredStaff.filter(s => 
            s.specialties.some(specialty => 
              service.name.toLowerCase().includes(specialty.toLowerCase()) ||
              specialty.toLowerCase().includes(service.name.toLowerCase())
            )
          );
        }
      }
    }

    return filteredStaff;
  }

  async getStaffById(id: string): Promise<Staff | null> {
    return this.staff.find(s => s.id === id) || null;
  }

  async getAvailableStaff(serviceId: string, date: string): Promise<Staff[]> {
    const staff = await this.getStaff({ serviceId });
    return staff.filter(s => {
      const availability = s.availability?.find(a => a.date === date);
      return availability && availability.timeSlots.length > 0;
    });
  }

  // Availability
  async getAvailableSlots(params: SlotQuery): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    const staff = params.staffId 
      ? await this.getStaffById(params.staffId)
      : await this.getAvailableStaff(params.serviceId, params.date);

    if (!staff || (Array.isArray(staff) && staff.length === 0)) {
      return slots;
    }

    const staffList = Array.isArray(staff) ? staff : [staff];
    
    for (const s of staffList) {
      const availability = s.availability?.find(a => a.date === params.date);
      if (availability) {
        for (const time of availability.timeSlots) {
          slots.push({
            id: `${s.id}-${params.date}-${time}`,
            date: params.date,
            time,
            staffId: s.id,
            available: true,
            duration: params.duration
          });
        }
      }
    }

    return slots;
  }

  async checkSlotAvailability(slot: TimeSlot): Promise<boolean> {
    // Check if slot is already booked
    const conflictingBooking = this.bookings.find(b => 
      b.date === slot.date && 
      b.time === slot.time && 
      b.staffId === slot.staffId &&
      b.status !== 'cancelled'
    );
    
    return !conflictingBooking;
  }

  async holdSlot(slot: TimeSlot): Promise<string> {
    const holdId = `hold-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // In a real app, this would create a temporary hold
    // For now, just return a hold ID
    return holdId;
  }

  // Clients
  async getClientByEmail(email: string): Promise<Client | null> {
    return this.clients.find(c => c.email === email) || null;
  }

  async createClient(data: Partial<Client>): Promise<Client> {
    const client: Client = {
      id: `client-${Date.now()}`,
      email: data.email || '',
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      preferences: data.preferences || {}
    };

    this.clients.push(client);
    localStorage.setItem('booking_clients', JSON.stringify(this.clients));
    
    return client;
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const clientIndex = this.clients.findIndex(c => c.id === id);
    if (clientIndex === -1) {
      throw new Error('Client not found');
    }

    this.clients[clientIndex] = { ...this.clients[clientIndex], ...data };
    localStorage.setItem('booking_clients', JSON.stringify(this.clients));
    
    return this.clients[clientIndex];
  }

  // Bookings
  async createBooking(data: {
    clientId: string;
    serviceIds: string[];
    staffId: string;
    date: string;
    time: string;
    preferences?: Record<string, any>;
  }): Promise<Booking> {
    const services = await Promise.all(
      data.serviceIds.map(id => this.getServiceById(id))
    );
    
    const totalPrice = services.reduce((sum, service) => sum + (service?.price || 0), 0);
    const totalDuration = services.reduce((sum, service) => sum + (service?.duration || 0), 0);

    const booking: Booking = {
      id: `booking-${Date.now()}`,
      clientId: data.clientId,
      serviceIds: data.serviceIds,
      staffId: data.staffId,
      date: data.date,
      time: data.time,
      duration: totalDuration,
      totalPrice,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      preferences: data.preferences
    };

    this.bookings.push(booking);
    localStorage.setItem('booking_bookings', JSON.stringify(this.bookings));
    
    return booking;
  }

  async getBooking(id: string): Promise<Booking | null> {
    return this.bookings.find(b => b.id === id) || null;
  }

  async cancelBooking(id: string, reason: string): Promise<void> {
    const booking = this.bookings.find(b => b.id === id);
    if (booking) {
      booking.status = 'cancelled';
      localStorage.setItem('booking_bookings', JSON.stringify(this.bookings));
    }
  }

  // Conflict detection
  async detectConflicts(bookingData: {
    serviceIds: string[];
    staffId: string;
    date: string;
    time: string;
    duration: number;
  }): Promise<Conflict[]> {
    const conflicts: Conflict[] = [];

    // Check for staff availability
    const staff = await this.getStaffById(bookingData.staffId);
    if (staff) {
      const availability = staff.availability?.find(a => a.date === bookingData.date);
      if (!availability || !availability.timeSlots.includes(bookingData.time)) {
        conflicts.push({
          type: 'staff',
          message: `${staff.name} is not available at ${bookingData.time}`,
          suggestion: 'Choose a different time or staff member'
        });
      }
    }

    // Check for existing bookings
    const conflictingBooking = this.bookings.find(b => 
      b.date === bookingData.date && 
      b.time === bookingData.time && 
      b.staffId === bookingData.staffId &&
      b.status !== 'cancelled'
    );

    if (conflictingBooking) {
      conflicts.push({
        type: 'time',
        message: 'This time slot is already booked',
        suggestion: 'Choose a different time'
      });
    }

    return conflicts;
  }

  // Alternative suggestions
  async suggestAlternatives(bookingData: {
    serviceIds: string[];
    staffId: string;
    date: string;
    time: string;
    duration: number;
  }): Promise<Alternative[]> {
    const alternatives: Alternative[] = [];

    // Suggest alternative times for the same staff
    const staff = await this.getStaffById(bookingData.staffId);
    if (staff) {
      const availability = staff.availability?.find(a => a.date === bookingData.date);
      if (availability) {
        const availableTimes = availability.timeSlots.filter(time => time !== bookingData.time);
        if (availableTimes.length > 0) {
          alternatives.push({
            type: 'time',
            option: { date: bookingData.date, time: availableTimes[0] },
            reason: 'Earlier time available with same staff'
          });
        }
      }
    }

    // Suggest alternative staff for the same time
    const availableStaff = await this.getAvailableStaff(bookingData.serviceIds[0], bookingData.date);
    const alternativeStaff = availableStaff.filter(s => s.id !== bookingData.staffId);
    if (alternativeStaff.length > 0) {
      alternatives.push({
        type: 'staff',
        option: alternativeStaff[0],
        reason: 'Same time available with different staff'
      });
    }

    return alternatives;
  }
}

// Export singleton instance - lazy initialized to avoid SSR issues
let _instance: BookingDataService | null = null;

export const bookingDataService = {
  get instance(): BookingDataService {
    if (!_instance && typeof window !== 'undefined') {
      _instance = new BookingDataService();
    }
    if (!_instance) {
      throw new Error('BookingDataService requires browser environment (localStorage)');
    }
    return _instance;
  },
  // Proxy methods to the underlying instance
  getServices(...args: Parameters<BookingDataService['getServices']>) {
    return this.instance.getServices(...args);
  },
  getServiceById(...args: Parameters<BookingDataService['getServiceById']>) {
    return this.instance.getServiceById(...args);
  },
  getStaff(...args: Parameters<BookingDataService['getStaff']>) {
    return this.instance.getStaff(...args);
  },
  getStaffById(...args: Parameters<BookingDataService['getStaffById']>) {
    return this.instance.getStaffById(...args);
  },
  getAvailableStaff(...args: Parameters<BookingDataService['getAvailableStaff']>) {
    return this.instance.getAvailableStaff(...args);
  },
  getAvailableSlots(...args: Parameters<BookingDataService['getAvailableSlots']>) {
    return this.instance.getAvailableSlots(...args);
  },
  createBooking(...args: Parameters<BookingDataService['createBooking']>) {
    return this.instance.createBooking(...args);
  },
  updateBooking(...args: Parameters<BookingDataService['updateBooking']>) {
    return this.instance.updateBooking(...args);
  },
  cancelBooking(...args: Parameters<BookingDataService['cancelBooking']>) {
    return this.instance.cancelBooking(...args);
  },
  getClientBookings(...args: Parameters<BookingDataService['getClientBookings']>) {
    return this.instance.getClientBookings(...args);
  },
  validateBooking(...args: Parameters<BookingDataService['validateBooking']>) {
    return this.instance.validateBooking(...args);
  },
  getAlternatives(...args: Parameters<BookingDataService['getAlternatives']>) {
    return this.instance.getAlternatives(...args);
  },
};
