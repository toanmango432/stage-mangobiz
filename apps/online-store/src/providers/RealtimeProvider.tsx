/**
 * Realtime Provider
 *
 * Manages Supabase Realtime connections for the Online Store.
 * Provides connection status and booking update notifications.
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useBookingRealtime } from '@/hooks/useBookingRealtime';
import { useStore } from '@/hooks/useStore';
import { BookingChangeEvent } from '@/services/supabase/realtime/bookingSubscription';
import { toast } from '@/hooks/use-toast';

interface RealtimeContextValue {
  /**
   * Connection status
   */
  status: 'connected' | 'disconnected' | 'error' | 'connecting';

  /**
   * Whether connected to realtime
   */
  isConnected: boolean;

  /**
   * Manual reconnect function
   */
  reconnect: () => void;

  /**
   * Manual disconnect function
   */
  disconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

interface RealtimeProviderProps {
  children: React.ReactNode;

  /**
   * Show toast notifications for booking updates
   * @default true
   */
  showNotifications?: boolean;
}

/**
 * Provider component for Supabase Realtime subscriptions
 */
export function RealtimeProvider({
  children,
  showNotifications = true,
}: RealtimeProviderProps) {
  const { storeId } = useStore();

  // Handle booking created
  const handleBookingCreated = useCallback(
    (event: BookingChangeEvent) => {
      if (!showNotifications) return;

      // Only show notification if this is someone else's booking
      // (e.g., admin notification of new online booking)
      console.log('[Realtime] New booking created:', event.new?.id);
    },
    [showNotifications]
  );

  // Handle booking updated
  const handleBookingUpdated = useCallback(
    (event: BookingChangeEvent) => {
      if (!showNotifications) return;

      const booking = event.new;
      if (!booking) return;

      // Show toast based on new status
      switch (booking.status) {
        case 'confirmed':
          toast({
            title: 'Booking Confirmed! 🎉',
            description: 'Your appointment has been confirmed by the salon.',
          });
          break;

        case 'cancelled':
          toast({
            title: 'Booking Cancelled',
            description: 'Your booking has been cancelled.',
            variant: 'destructive',
          });
          break;

        case 'completed':
          toast({
            title: 'Thank You! ✨',
            description: 'We hope you enjoyed your visit. See you again soon!',
          });
          break;
      }
    },
    [showNotifications]
  );

  // Handle connection changes
  const handleConnectionChange = useCallback(
    (status: 'connected' | 'disconnected' | 'error') => {
      if (status === 'error' && showNotifications) {
        toast({
          title: 'Connection Issue',
          description: 'Real-time updates temporarily unavailable. Reconnecting...',
          variant: 'destructive',
        });
      }
    },
    [showNotifications]
  );

  // Set up realtime subscription
  const { status, isConnected, reconnect, disconnect } = useBookingRealtime(
    storeId,
    {
      onBookingCreated: handleBookingCreated,
      onBookingUpdated: handleBookingUpdated,
      onConnectionChange: handleConnectionChange,
    }
  );

  // Memoize context value
  const contextValue = useMemo<RealtimeContextValue>(
    () => ({
      status,
      isConnected,
      reconnect,
      disconnect,
    }),
    [status, isConnected, reconnect, disconnect]
  );

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

/**
 * Hook to access realtime context
 */
export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);

  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }

  return context;
}

/**
 * Hook to check if realtime is available
 * (Safe to use outside of provider)
 */
export function useRealtimeStatus(): RealtimeContextValue | null {
  return useContext(RealtimeContext);
}

export default RealtimeProvider;
