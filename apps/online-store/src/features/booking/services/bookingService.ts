import type {
  BookingService,
  ServiceCategory,
  Staff,
  CreateBookingRequest,
  CreateBookingResponse,
  AvailableTimeSlotsRequest,
  AvailableTimeSlotsResponse,
  DayOffDate,
  TimeSlotGroup,
} from '../types/booking.types';

const API_BASE = '/api';

export class BookingAPIService {
  /**
   * Get all service categories
   */
  static async getCategories(): Promise<ServiceCategory[]> {
    const response = await fetch(`${API_BASE}/booking/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  }

  /**
   * Get all services
   */
  static async getServices(): Promise<BookingService[]> {
    const response = await fetch(`${API_BASE}/booking/services`);
    if (!response.ok) throw new Error('Failed to fetch services');
    return response.json();
  }

  /**
   * Get services by category
   */
  static async getServicesByCategory(categoryId: string): Promise<BookingService[]> {
    const response = await fetch(`${API_BASE}/booking/categories/${categoryId}/services`);
    if (!response.ok) throw new Error('Failed to fetch services');
    return response.json();
  }

  /**
   * Get service details including add-ons and questions
   */
  static async getServiceDetails(serviceId: string): Promise<BookingService> {
    const response = await fetch(`${API_BASE}/booking/services/${serviceId}`);
    if (!response.ok) throw new Error('Failed to fetch service details');
    return response.json();
  }

  /**
   * Get all available staff
   */
  static async getStaff(): Promise<Staff[]> {
    const response = await fetch(`${API_BASE}/booking/staff`);
    if (!response.ok) throw new Error('Failed to fetch staff');
    return response.json();
  }

  /**
   * Get staff by service IDs (staff who can perform these services)
   */
  static async getStaffByServices(serviceIds: string[]): Promise<Staff[]> {
    const params = new URLSearchParams();
    serviceIds.forEach(id => params.append('serviceIds', id));
    
    const response = await fetch(`${API_BASE}/booking/staff/by-services?${params}`);
    if (!response.ok) throw new Error('Failed to fetch staff');
    return response.json();
  }

  /**
   * Get available time slots for a specific date
   */
  static async getAvailableTimeSlots(
    request: AvailableTimeSlotsRequest
  ): Promise<AvailableTimeSlotsResponse> {
    const response = await fetch(`${API_BASE}/booking/time-slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) throw new Error('Failed to fetch time slots');
    return response.json();
  }

  /**
   * Get store off days (holidays, closures)
   */
  static async getStoreOffDays(): Promise<DayOffDate[]> {
    const response = await fetch(`${API_BASE}/booking/store-off-days`);
    if (!response.ok) throw new Error('Failed to fetch store off days');
    return response.json();
  }

  /**
   * Get staff off days for a specific staff member
   */
  static async getStaffOffDays(staffId: string): Promise<DayOffDate[]> {
    const response = await fetch(`${API_BASE}/booking/staff/${staffId}/off-days`);
    if (!response.ok) throw new Error('Failed to fetch staff off days');
    return response.json();
  }

  /**
   * Create a new booking
   */
  static async createBooking(
    request: CreateBookingRequest
  ): Promise<CreateBookingResponse> {
    const response = await fetch(`${API_BASE}/booking/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create booking');
    }
    
    return response.json();
  }

  /**
   * Check if a time slot is still available (before final booking)
   */
  static async checkSlotAvailability(
    date: string,
    time: string,
    staffId: string,
    duration: number
  ): Promise<boolean> {
    const response = await fetch(`${API_BASE}/booking/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, time, staffId, duration }),
    });
    
    if (!response.ok) throw new Error('Failed to check availability');
    const data = await response.json();
    return data.available;
  }

  /**
   * Get booking settings (business hours, intervals, etc.)
   */
  static async getSettings(): Promise<{
    businessHours: { start: string; end: string };
    slotInterval: number;
    allowGuestBooking: boolean;
    requireDeposit: boolean;
    depositAmount: number;
  }> {
    const response = await fetch(`${API_BASE}/booking/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  }
}

// Thunk actions for Redux
export const bookingThunks = {
  /**
   * Load all initial data needed for booking
   */
  loadInitialData: () => async (dispatch: any) => {
    try {
      dispatch({ type: 'booking/setLoading', payload: { key: 'services', value: true } });
      dispatch({ type: 'booking/setLoading', payload: { key: 'staff', value: true } });

      const [categories, services, staff, storeOffDays, settings] = await Promise.all([
        BookingAPIService.getCategories(),
        BookingAPIService.getServices(),
        BookingAPIService.getStaff(),
        BookingAPIService.getStoreOffDays(),
        BookingAPIService.getSettings(),
      ]);

      dispatch({ type: 'booking/setCategories', payload: categories });
      dispatch({ type: 'booking/setServices', payload: services });
      dispatch({ type: 'booking/setStaff', payload: staff });
      dispatch({ type: 'booking/setStoreOffDays', payload: storeOffDays });
      dispatch({ type: 'booking/updateSettings', payload: settings });
    } catch (error) {
      dispatch({ 
        type: 'booking/setError', 
        payload: error instanceof Error ? error.message : 'Failed to load data' 
      });
    } finally {
      dispatch({ type: 'booking/setLoading', payload: { key: 'services', value: false } });
      dispatch({ type: 'booking/setLoading', payload: { key: 'staff', value: false } });
    }
  },

  /**
   * Load available time slots for selected date and services
   */
  loadTimeSlots: (date: string, serviceIds: string[], staffId?: string) => 
    async (dispatch: any) => {
      try {
        dispatch({ type: 'booking/setLoading', payload: { key: 'timeSlots', value: true } });

        const response = await BookingAPIService.getAvailableTimeSlots({
          date,
          serviceIds,
          staffId,
        });

        dispatch({ type: 'booking/setAvailableTimeSlots', payload: response.slots });
      } catch (error) {
        dispatch({ 
          type: 'booking/setError', 
          payload: error instanceof Error ? error.message : 'Failed to load time slots' 
        });
      } finally {
        dispatch({ type: 'booking/setLoading', payload: { key: 'timeSlots', value: false } });
      }
    },

  /**
   * Submit booking
   */
  submitBooking: (request: CreateBookingRequest) => async (dispatch: any) => {
    try {
      dispatch({ type: 'booking/setLoading', payload: { key: 'booking', value: true } });

      const response = await BookingAPIService.createBooking(request);

      dispatch({ type: 'booking/setCurrentStep', payload: 'confirmed' });
      
      return response;
    } catch (error) {
      dispatch({ 
        type: 'booking/setError', 
        payload: error instanceof Error ? error.message : 'Failed to create booking' 
      });
      throw error;
    } finally {
      dispatch({ type: 'booking/setLoading', payload: { key: 'booking', value: false } });
    }
  },
};
