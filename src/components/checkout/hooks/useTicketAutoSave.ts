import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { updateCheckoutTicket, type CheckoutTicketService } from '@/store/slices/uiTicketsSlice';
import type { TicketService } from '../ServiceList';
import type { Client } from '../ClientSelector';

interface UseTicketAutoSaveOptions {
  isOpen: boolean;
  ticketId: string | null;
  services: TicketService[];
  selectedClient: Client | null;
  discount: number;
  onMarkSaved: () => void;
}

/**
 * Hook to handle auto-save functionality for existing tickets.
 * Only saves when:
 * 1. Panel is open
 * 2. Ticket has an ID (existing ticket, not new)
 * 3. Load is complete (not during initial data loading)
 */
export function useTicketAutoSave({
  isOpen,
  ticketId,
  services,
  selectedClient,
  discount,
  onMarkSaved,
}: UseTicketAutoSaveOptions) {
  const reduxDispatch = useAppDispatch();
  const lastTicketIdRef = useRef<string | null>(null);
  const loadCompleteRef = useRef(false);

  // Reset auto-save state when panel opens/closes or ticket changes
  useEffect(() => {
    if (!isOpen) {
      // Panel closed - reset everything
      loadCompleteRef.current = false;
      lastTicketIdRef.current = null;
      return;
    }

    // New ticket loaded - reset load complete flag
    if (ticketId !== lastTicketIdRef.current) {
      loadCompleteRef.current = false;
      lastTicketIdRef.current = ticketId;
    }
  }, [isOpen, ticketId]);

  // Mark load as complete after a short delay (after all initial state updates settle)
  useEffect(() => {
    if (!isOpen || !ticketId) return;

    const timer = setTimeout(() => {
      loadCompleteRef.current = true;
      console.log('📋 Ticket load complete, auto-save enabled for:', ticketId);
    }, 500); // Wait for initial load to settle

    return () => clearTimeout(timer);
  }, [isOpen, ticketId]);

  // Convert local TicketService to CheckoutTicketService for Redux
  const convertToCheckoutServices = useCallback((localServices: TicketService[]): CheckoutTicketService[] => {
    return localServices.map(s => ({
      id: s.id,
      serviceId: s.serviceId,
      serviceName: s.serviceName,
      price: s.price,
      duration: s.duration,
      status: s.status as 'not_started' | 'in_progress' | 'paused' | 'completed',
      staffId: s.staffId,
      staffName: s.staffName,
      startTime: s.startTime,
    }));
  }, []);

  // Helper function to perform auto-save
  const performAutoSave = useCallback(async () => {
    if (!ticketId) return;

    const checkoutServices = convertToCheckoutServices(services);
    const clientName = selectedClient
      ? `${selectedClient.firstName} ${selectedClient.lastName}`.trim()
      : 'Walk-in';
    const subtotal = services.reduce((sum, s) => sum + s.price, 0);
    const tax = Math.max(0, subtotal - discount) * 0.085;
    const total = Math.max(0, subtotal - discount) * 1.085;

    console.log('💾 Auto-saving ticket:', ticketId);

    try {
      // Update Redux state
      await reduxDispatch(updateCheckoutTicket({
        ticketId,
        updates: {
          clientId: selectedClient?.id,
          clientName,
          services: checkoutServices,
          discount,
          subtotal,
          tax,
          total,
        },
      })).unwrap();

      // CRITICAL: Update localStorage IMMEDIATELY so reopening shows saved changes
      const storedTicket = localStorage.getItem('checkout-pending-ticket');
      if (storedTicket) {
        try {
          const existingTicket = JSON.parse(storedTicket);
          const updatedTicket = {
            ...existingTicket,
            clientId: selectedClient?.id,
            clientName,
            checkoutServices,
            discount,
            subtotal,
            tax,
            total,
          };
          localStorage.setItem('checkout-pending-ticket', JSON.stringify(updatedTicket));
        } catch (e) {
          console.warn('⚠️ Could not update localStorage:', e);
        }
      }

      console.log('✅ Auto-save complete for ticket:', ticketId);
      onMarkSaved();
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  }, [ticketId, services, selectedClient, discount, reduxDispatch, convertToCheckoutServices, onMarkSaved]);

  // Auto-save effect - IMMEDIATE save on every change (no debounce)
  useEffect(() => {
    // Skip if panel is not open
    if (!isOpen) return;

    // Skip if no ticketId (new ticket - requires explicit save)
    if (!ticketId) return;

    // Skip if load is not complete (still loading initial data)
    if (!loadCompleteRef.current) {
      console.log('⏳ Skipping auto-save - still loading ticket');
      return;
    }

    // Save IMMEDIATELY on every change - no debounce to prevent data loss
    performAutoSave();
  }, [isOpen, ticketId, services, selectedClient, discount, performAutoSave]);

  return {
    performAutoSave,
    isLoadComplete: loadCompleteRef.current,
  };
}
