import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { saveDraft } from '@/store/slices/checkoutSlice';
import type { Ticket } from '@/types';

export interface UseTicketAutoSaveOptions {
  /**
   * Ticket to auto-save
   */
  ticket: Ticket | null;
  /**
   * User ID for tracking who saved the draft
   */
  userId: string;
  /**
   * Whether auto-save is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Interval in milliseconds between auto-saves
   * @default 30000 (30 seconds)
   */
  interval?: number;
  /**
   * Debounce delay in milliseconds after changes before saving
   * @default 2000 (2 seconds)
   */
  debounceDelay?: number;
  /**
   * Callback when auto-save completes
   */
  onSaveComplete?: () => void;
  /**
   * Callback when auto-save fails
   */
  onSaveError?: (error: Error) => void;
}

export interface UseTicketAutoSaveReturn {
  /**
   * Whether an auto-save is currently in progress
   */
  isSaving: boolean;
  /**
   * Timestamp of the last successful auto-save
   */
  lastSavedAt: string | null;
  /**
   * Manually trigger a save
   */
  saveNow: () => Promise<void>;
  /**
   * Reset the auto-save timer
   */
  resetTimer: () => void;
}

/**
 * Hook to automatically save ticket as draft at regular intervals.
 * Implements debounce to avoid excessive saves during active editing.
 */
export function useTicketAutoSave({
  ticket,
  userId,
  enabled = true,
  interval = 30000,
  debounceDelay = 2000,
  onSaveComplete,
  onSaveError,
}: UseTicketAutoSaveOptions): UseTicketAutoSaveReturn {
  const dispatch = useAppDispatch();
  const lastAutoSave = useAppSelector((state) => state.checkout.lastAutoSave);

  const isSavingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastTicketRef = useRef<Ticket | null>(null);

  const saveNow = useCallback(async () => {
    if (!ticket || !enabled || isSavingRef.current) return;

    isSavingRef.current = true;

    try {
      await dispatch(
        saveDraft({
          ticketId: ticket.id,
          updates: {
            services: ticket.services,
            products: ticket.products,
            total: ticket.total,
            subtotal: ticket.subtotal,
            tax: ticket.tax,
            discount: ticket.discount,
            tip: ticket.tip,
            clientId: ticket.clientId,
            clientName: ticket.clientName,
          },
          userId,
        })
      ).unwrap();

      onSaveComplete?.();
    } catch (error) {
      onSaveError?.(error as Error);
    } finally {
      isSavingRef.current = false;
    }
  }, [ticket, userId, enabled, dispatch, onSaveComplete, onSaveError]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (enabled && ticket) {
      intervalRef.current = setInterval(saveNow, interval);
    }
  }, [enabled, ticket, interval, saveNow]);

  // Set up interval-based auto-save
  useEffect(() => {
    if (enabled && ticket) {
      intervalRef.current = setInterval(saveNow, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, ticket?.id, interval, saveNow]);

  // Debounced save on ticket changes
  useEffect(() => {
    if (!enabled || !ticket) return;

    // Check if ticket actually changed (not just reference)
    const ticketChanged =
      lastTicketRef.current &&
      JSON.stringify(ticket.services) !== JSON.stringify(lastTicketRef.current.services);

    lastTicketRef.current = ticket;

    if (ticketChanged) {
      // Clear existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new debounce timer
      debounceRef.current = setTimeout(saveNow, debounceDelay);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [ticket, enabled, debounceDelay, saveNow]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    isSaving: isSavingRef.current,
    lastSavedAt: lastAutoSave,
    saveNow,
    resetTimer,
  };
}

export default useTicketAutoSave;
