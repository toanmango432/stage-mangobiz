/**
 * Supabase Realtime Subscription for Online Bookings
 *
 * Listens for booking status changes in real-time and triggers
 * UI updates via React Query cache invalidation.
 */

import { supabase } from '../client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '../types';

type OnlineBookingRow = Database['public']['Tables']['online_bookings']['Row'];

// Subscription event types
export type BookingEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface BookingChangeEvent {
  eventType: BookingEventType;
  old: Partial<OnlineBookingRow> | null;
  new: OnlineBookingRow | null;
  timestamp: string;
}

// Callback types
export type BookingChangeCallback = (event: BookingChangeEvent) => void;
export type ConnectionStatusCallback = (status: 'connected' | 'disconnected' | 'error') => void;

/**
 * Booking Subscription Manager
 *
 * Manages Supabase Realtime subscriptions for booking updates.
 * Singleton pattern to ensure only one subscription per store.
 */
class BookingSubscriptionManager {
  private channel: RealtimeChannel | null = null;
  private storeId: string | null = null;
  private listeners: Set<BookingChangeCallback> = new Set();
  private statusListeners: Set<ConnectionStatusCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isSubscribed = false;

  /**
   * Subscribe to booking changes for a specific store
   */
  subscribe(storeId: string): void {
    // If already subscribed to same store, do nothing
    if (this.isSubscribed && this.storeId === storeId) {
      console.log('[BookingSubscription] Already subscribed to store:', storeId);
      return;
    }

    // Unsubscribe from previous store if different
    if (this.storeId && this.storeId !== storeId) {
      this.unsubscribe();
    }

    this.storeId = storeId;
    this.reconnectAttempts = 0;

    this.setupChannel();
  }

  /**
   * Set up the Realtime channel
   */
  private setupChannel(): void {
    if (!this.storeId) return;

    const channelName = `online-bookings-${this.storeId}`;

    this.channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'online_bookings',
          filter: `store_id=eq.${this.storeId}`,
        },
        (payload: RealtimePostgresChangesPayload<OnlineBookingRow>) => {
          this.handleBookingChange(payload);
        }
      )
      .subscribe((status) => {
        this.handleSubscriptionStatus(status);
      });
  }

  /**
   * Handle booking change events from Supabase
   */
  private handleBookingChange(
    payload: RealtimePostgresChangesPayload<OnlineBookingRow>
  ): void {
    const event: BookingChangeEvent = {
      eventType: payload.eventType as BookingEventType,
      old: payload.old as Partial<OnlineBookingRow> | null,
      new: payload.new as OnlineBookingRow | null,
      timestamp: new Date().toISOString(),
    };

    console.log('[BookingSubscription] Booking change:', event.eventType, event.new?.id);

    // Notify all listeners
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[BookingSubscription] Error in listener callback:', error);
      }
    });
  }

  /**
   * Handle subscription status changes
   */
  private handleSubscriptionStatus(status: string): void {
    console.log('[BookingSubscription] Status:', status);

    switch (status) {
      case 'SUBSCRIBED':
        this.isSubscribed = true;
        this.reconnectAttempts = 0;
        this.notifyStatusListeners('connected');
        break;

      case 'CHANNEL_ERROR':
        this.isSubscribed = false;
        this.notifyStatusListeners('error');
        this.attemptReconnect();
        break;

      case 'TIMED_OUT':
        this.isSubscribed = false;
        this.notifyStatusListeners('disconnected');
        this.attemptReconnect();
        break;

      case 'CLOSED':
        this.isSubscribed = false;
        this.notifyStatusListeners('disconnected');
        break;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[BookingSubscription] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[BookingSubscription] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      if (this.storeId) {
        this.unsubscribe();
        this.setupChannel();
      }
    }, delay);
  }

  /**
   * Notify status listeners
   */
  private notifyStatusListeners(status: 'connected' | 'disconnected' | 'error'): void {
    this.statusListeners.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error('[BookingSubscription] Error in status callback:', error);
      }
    });
  }

  /**
   * Add a listener for booking changes
   */
  addListener(callback: BookingChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Add a listener for connection status changes
   */
  addStatusListener(callback: ConnectionStatusCallback): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribe(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.isSubscribed = false;
    this.storeId = null;
  }

  /**
   * Get current subscription status
   */
  getStatus(): {
    isSubscribed: boolean;
    storeId: string | null;
    listenerCount: number;
  } {
    return {
      isSubscribed: this.isSubscribed,
      storeId: this.storeId,
      listenerCount: this.listeners.size,
    };
  }
}

// Export singleton instance
export const bookingSubscription = new BookingSubscriptionManager();

// Export for testing
export { BookingSubscriptionManager };
