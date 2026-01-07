/**
 * React Query hooks for Bookings
 *
 * Provides data fetching and mutations for online bookings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bookingsRepository,
  type OnlineBooking,
  type CreateBookingData,
} from '@/services/supabase/repositories';

// Query key factory for bookings
export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  client: (clientId: string) => [...bookingKeys.lists(), 'client', clientId] as const,
  email: (email: string) => [...bookingKeys.lists(), 'email', email] as const,
  upcoming: (clientId: string) => [...bookingKeys.client(clientId), 'upcoming'] as const,
  past: (clientId: string) => [...bookingKeys.client(clientId), 'past'] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
};

/**
 * Hook to fetch booking by ID
 */
export function useBooking(storeId: string | undefined, bookingId: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId || ''),
    queryFn: async () => {
      if (!storeId || !bookingId) return null;
      return bookingsRepository.setStoreContext(storeId).getBookingById(bookingId);
    },
    enabled: !!storeId && !!bookingId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch client's bookings
 */
export function useClientBookings(storeId: string | undefined, clientId: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.client(clientId || ''),
    queryFn: async () => {
      if (!storeId || !clientId) return [];
      return bookingsRepository.setStoreContext(storeId).getClientBookings(clientId);
    },
    enabled: !!storeId && !!clientId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch upcoming bookings for a client
 */
export function useUpcomingBookings(storeId: string | undefined, clientId: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.upcoming(clientId || ''),
    queryFn: async () => {
      if (!storeId || !clientId) return [];
      return bookingsRepository.setStoreContext(storeId).getUpcomingBookings(clientId);
    },
    enabled: !!storeId && !!clientId,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch past bookings for a client
 */
export function usePastBookings(storeId: string | undefined, clientId: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.past(clientId || ''),
    queryFn: async () => {
      if (!storeId || !clientId) return [];
      return bookingsRepository.setStoreContext(storeId).getPastBookings(clientId);
    },
    enabled: !!storeId && !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes for past bookings
  });
}

/**
 * Hook to fetch bookings by email (for guest lookups)
 */
export function useBookingsByEmail(storeId: string | undefined, email: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.email(email || ''),
    queryFn: async () => {
      if (!storeId || !email) return [];
      return bookingsRepository.setStoreContext(storeId).getBookingsByEmail(email);
    },
    enabled: !!storeId && !!email && email.includes('@'),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to create a new booking
 */
export function useCreateBooking(storeId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingData) => {
      if (!storeId) throw new Error('Store ID is required');
      return bookingsRepository.setStoreContext(storeId).createBooking(data);
    },
    onSuccess: (newBooking) => {
      // Invalidate relevant queries
      if (newBooking.clientId) {
        queryClient.invalidateQueries({ queryKey: bookingKeys.client(newBooking.clientId) });
        queryClient.invalidateQueries({ queryKey: bookingKeys.upcoming(newBooking.clientId) });
      }
      if (newBooking.guestEmail) {
        queryClient.invalidateQueries({ queryKey: bookingKeys.email(newBooking.guestEmail) });
      }
      // Set the new booking in cache
      queryClient.setQueryData(bookingKeys.detail(newBooking.id), newBooking);
    },
  });
}

/**
 * Hook to cancel a booking
 */
export function useCancelBooking(storeId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      if (!storeId) throw new Error('Store ID is required');
      return bookingsRepository.setStoreContext(storeId).cancelBooking(bookingId);
    },
    onSuccess: (cancelledBooking) => {
      // Update the booking in cache
      queryClient.setQueryData(bookingKeys.detail(cancelledBooking.id), cancelledBooking);
      // Invalidate lists
      if (cancelledBooking.clientId) {
        queryClient.invalidateQueries({ queryKey: bookingKeys.client(cancelledBooking.clientId) });
        queryClient.invalidateQueries({ queryKey: bookingKeys.upcoming(cancelledBooking.clientId) });
        queryClient.invalidateQueries({ queryKey: bookingKeys.past(cancelledBooking.clientId) });
      }
      if (cancelledBooking.guestEmail) {
        queryClient.invalidateQueries({ queryKey: bookingKeys.email(cancelledBooking.guestEmail) });
      }
    },
  });
}

/**
 * Hook to reschedule a booking
 */
export function useRescheduleBooking(storeId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      newDate,
      newTime,
      newStaffId,
    }: {
      bookingId: string;
      newDate: string;
      newTime: string;
      newStaffId?: string;
    }) => {
      if (!storeId) throw new Error('Store ID is required');
      return bookingsRepository.setStoreContext(storeId).rescheduleBooking(
        bookingId,
        newDate,
        newTime,
        newStaffId
      );
    },
    onSuccess: (rescheduledBooking) => {
      // Update the booking in cache
      queryClient.setQueryData(bookingKeys.detail(rescheduledBooking.id), rescheduledBooking);
      // Invalidate lists
      if (rescheduledBooking.clientId) {
        queryClient.invalidateQueries({ queryKey: bookingKeys.client(rescheduledBooking.clientId) });
        queryClient.invalidateQueries({ queryKey: bookingKeys.upcoming(rescheduledBooking.clientId) });
      }
      if (rescheduledBooking.guestEmail) {
        queryClient.invalidateQueries({ queryKey: bookingKeys.email(rescheduledBooking.guestEmail) });
      }
    },
  });
}
