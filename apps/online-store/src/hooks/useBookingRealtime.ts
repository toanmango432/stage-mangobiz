/**
 * Booking Realtime Hook
 *
 * Provides real-time booking updates by subscribing to Supabase Realtime
 * and invalidating React Query cache when changes occur.
 */

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  bookingSubscription,
  BookingChangeEvent,
} from '@/services/supabase/realtime/bookingSubscription';
import { bookingKeys } from './queries/useBookings';

type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'connecting';

interface UseBookingRealtimeOptions {
  /**
   * Called when a booking is created
   */
  onBookingCreated?: (event: BookingChangeEvent) => void;

  /**
   * Called when a booking status changes
   */
  onBookingUpdated?: (event: BookingChangeEvent) => void;

  /**
   * Called when a booking is cancelled/deleted
   */
  onBookingDeleted?: (event: BookingChangeEvent) => void;

  /**
   * Called when connection status changes
   */
  onConnectionChange?: (status: ConnectionStatus) => void;
}

/**
 * Hook for real-time booking updates
 *
 * @param storeId - Store ID to subscribe to
 * @param options - Event callbacks
 * @returns Connection status and manual control functions
 */
export function useBookingRealtime(
  storeId: string | undefined,
  options: UseBookingRealtimeOptions = {}
) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  const {
    onBookingCreated,
    onBookingUpdated,
    onBookingDeleted,
    onConnectionChange,
  } = options;

  // Handle booking changes
  const handleBookingChange = useCallback(
    (event: BookingChangeEvent) => {
      // Always invalidate the bookings cache to refresh data
      queryClient.invalidateQueries({
        queryKey: bookingKeys.all,
      });

      // Call specific callbacks based on event type
      switch (event.eventType) {
        case 'INSERT':
          onBookingCreated?.(event);
          break;

        case 'UPDATE':
          // If booking ID is available, invalidate specific booking query
          if (event.new?.id) {
            queryClient.invalidateQueries({
              queryKey: bookingKeys.detail(event.new.id),
            });
          }
          onBookingUpdated?.(event);
          break;

        case 'DELETE':
          onBookingDeleted?.(event);
          break;
      }
    },
    [queryClient, onBookingCreated, onBookingUpdated, onBookingDeleted]
  );

  // Handle connection status changes
  const handleStatusChange = useCallback(
    (newStatus: 'connected' | 'disconnected' | 'error') => {
      setStatus(newStatus);
      onConnectionChange?.(newStatus);
    },
    [onConnectionChange]
  );

  // Subscribe to booking changes when storeId is available
  useEffect(() => {
    if (!storeId) {
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');

    // Add listeners
    const removeBookingListener = bookingSubscription.addListener(handleBookingChange);
    const removeStatusListener = bookingSubscription.addStatusListener(handleStatusChange);

    // Start subscription
    bookingSubscription.subscribe(storeId);

    // Cleanup on unmount or storeId change
    return () => {
      removeBookingListener();
      removeStatusListener();
      bookingSubscription.unsubscribe();
    };
  }, [storeId, handleBookingChange, handleStatusChange]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (storeId) {
      bookingSubscription.unsubscribe();
      bookingSubscription.subscribe(storeId);
      setStatus('connecting');
    }
  }, [storeId]);

  // Manual disconnect function
  const disconnect = useCallback(() => {
    bookingSubscription.unsubscribe();
    setStatus('disconnected');
  }, []);

  return {
    /**
     * Current connection status
     */
    status,

    /**
     * Whether currently connected to realtime
     */
    isConnected: status === 'connected',

    /**
     * Whether currently connecting
     */
    isConnecting: status === 'connecting',

    /**
     * Whether there was a connection error
     */
    hasError: status === 'error',

    /**
     * Manually reconnect to realtime
     */
    reconnect,

    /**
     * Manually disconnect from realtime
     */
    disconnect,

    /**
     * Get subscription status details
     */
    getStatus: () => bookingSubscription.getStatus(),
  };
}

export default useBookingRealtime;
