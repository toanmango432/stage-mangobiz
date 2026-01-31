import { Booking } from '@/types/booking';
import { format } from 'date-fns';

const BOOKINGS_KEY = 'mango-bookings';
const BOOKING_NUMBER_KEY = 'mango-booking-counter';

/**
 * Generate sequential booking number (e.g., "BK-2025-0001")
 */
export const generateBookingNumber = (): string => {
  if (typeof window === 'undefined') {
    // SSR fallback - generate a unique ID
    return `BK-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  }
  const counter = parseInt(localStorage.getItem(BOOKING_NUMBER_KEY) || '0', 10) + 1;
  localStorage.setItem(BOOKING_NUMBER_KEY, counter.toString());

  const year = new Date().getFullYear();
  const paddedNumber = counter.toString().padStart(4, '0');
  return `BK-${year}-${paddedNumber}`;
};

/**
 * Get all bookings from localStorage
 */
export const getBookings = (): Booking[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(BOOKINGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading bookings:', error);
    return [];
  }
};

/**
 * Save booking to localStorage
 */
export const saveBooking = (booking: Booking): void => {
  if (typeof window === 'undefined') return;
  try {
    const bookings = getBookings();
    bookings.push(booking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  } catch (error) {
    console.error('Error saving booking:', error);
    throw new Error('Failed to save booking');
  }
};

/**
 * Get bookings for a specific email
 */
export const getBookingsByEmail = (email: string): Booking[] => {
  const bookings = getBookings();
  return bookings.filter(b => b.client.email.toLowerCase() === email.toLowerCase());
};

/**
 * Get single booking by ID
 */
export const getBookingById = (id: string): Booking | undefined => {
  const bookings = getBookings();
  return bookings.find(b => b.id === id);
};

/**
 * Get bookings for a specific date
 */
export const getBookingsForDate = (date: string): Booking[] => {
  const bookings = getBookings();
  return bookings.filter(b => {
    const bookingDate = format(new Date(b.dateTime), 'yyyy-MM-dd');
    return bookingDate === date && b.status !== 'cancelled';
  });
};

/**
 * Update existing booking
 */
export const updateBooking = (id: string, updates: Partial<Booking>): void => {
  if (typeof window === 'undefined') return;
  try {
    const bookings = getBookings();
    const index = bookings.findIndex(b => b.id === id);

    if (index === -1) {
      throw new Error('Booking not found');
    }

    bookings[index] = {
      ...bookings[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  } catch (error) {
    console.error('Error updating booking:', error);
    throw new Error('Failed to update booking');
  }
};

/**
 * Cancel booking
 */
export const cancelBooking = (id: string, reason?: string): void => {
  updateBooking(id, {
    status: 'cancelled',
    cancellationReason: reason,
  });
};

/**
 * Delete booking (admin only)
 */
export const deleteBooking = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const bookings = getBookings();
    const filtered = bookings.filter(b => b.id !== id);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw new Error('Failed to delete booking');
  }
};

/**
 * Get bookings by status
 */
export const getBookingsByStatus = (status: Booking['status']): Booking[] => {
  const bookings = getBookings();
  return bookings.filter(b => b.status === status);
};

/**
 * Get upcoming bookings
 */
export const getUpcomingBookings = (): Booking[] => {
  const bookings = getBookings();
  const now = new Date();
  return bookings
    .filter(b => new Date(b.dateTime) > now && b.status !== 'cancelled')
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
};

/**
 * Initialize with mock bookings (call once on app load)
 */
export const initializeMockBookings = (mockBookings: Booking[]): void => {
  if (typeof window === 'undefined') return;
  const existing = getBookings();
  if (existing.length === 0) {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(mockBookings));
  }
};
