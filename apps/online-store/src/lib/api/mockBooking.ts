import { Booking } from '@/types/booking';
import { convertTo24Hour } from '@/lib/utils/timeHelpers';

interface CreateBookingData {
  userId: string;
  serviceIds: string[];
  staffId: string;
  date: string;
  time: string;
  preferences?: string;
  promoCode?: string;
  paymentMethodId: string;
  billingAddress: any;
  policyAcceptedAt: string;
  holdId?: string;
}

const BOOKINGS_KEY = 'mango-bookings';

const mockPromoCodes = {
  'WELCOME10': { type: 'percentage', discount: 10 },
  'SAVE20': { type: 'percentage', discount: 20 },
  'FIRST50': { type: 'fixed', discount: 50 },
};

export const mockBookingApi = {
  createBooking: async (data: CreateBookingData): Promise<{ 
    success: boolean; 
    booking?: Booking; 
    error?: string 
  }> => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (Math.random() < 0.03) {
      return { success: false, error: 'Slot no longer available' };
    }

    const bookings = mockBookingApi.getAllBookings();
    const bookingNumber = `BK-2025-${String(bookings.length + 1).padStart(4, '0')}`;
    const servicePrice = 85;
    let totalAmount = servicePrice;

    if (data.promoCode && mockPromoCodes[data.promoCode as keyof typeof mockPromoCodes]) {
      const promo = mockPromoCodes[data.promoCode as keyof typeof mockPromoCodes];
      if (promo.type === 'percentage') {
        totalAmount = totalAmount * (1 - promo.discount / 100);
      } else {
        totalAmount = Math.max(0, totalAmount - promo.discount);
      }
    }

    const booking: Booking = {
      id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      bookingNumber,
      client: {
        id: data.userId,
        name: 'Demo User',
        email: 'demo@example.com',
        phone: '+1 270 994 6016',
      },
      service: {
        id: data.serviceIds[0],
        name: 'Gel Manicure',
        duration: 60,
        price: servicePrice,
      },
      addOns: [],
      dateTime: `${data.date}T${convertTo24Hour(data.time)}`,
      endTime: `${data.date}T${convertTo24Hour(data.time)}`,
      staff: data.staffId !== 'any' ? {
        id: data.staffId,
        name: 'Sarah Chen',
      } : undefined,
      status: 'confirmed',
      paymentStatus: 'paid',
      totalAmount,
      specialRequests: data.preferences,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bookings.push(booking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    console.log('✅ Booking created:', booking);

    return { success: true, booking };
  },

  getAllBookings: (): Booking[] => {
    const data = localStorage.getItem(BOOKINGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getUserBookings: (userId: string): Booking[] => {
    const bookings = mockBookingApi.getAllBookings();
    return bookings.filter(b => b.client.id === userId);
  },

  getBookingById: (bookingId: string): Booking | null => {
    const bookings = mockBookingApi.getAllBookings();
    return bookings.find(b => b.id === bookingId) || null;
  },

  validatePromoCode: async (code: string): Promise<{ 
    valid: boolean; 
    discount?: number; 
    type?: 'percentage' | 'fixed';
  }> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const promo = mockPromoCodes[code as keyof typeof mockPromoCodes];
    if (promo) {
      return { valid: true, discount: promo.discount, type: promo.type as 'percentage' | 'fixed' };
    }

    return { valid: false };
  },
};
