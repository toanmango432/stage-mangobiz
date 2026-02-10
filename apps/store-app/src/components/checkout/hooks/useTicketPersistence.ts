/**
 * useTicketPersistence Hook
 *
 * Manages ticket persistence and auto-save functionality for TicketPanel.
 * Handles:
 * 1. Loading pending tickets from localStorage when panel opens
 * 2. Fetching persisted status from Supabase if available
 * 3. Auto-save for existing tickets (immediate, no debounce)
 * 4. LocalStorage synchronization for reopening
 */

import { useEffect, useRef, useCallback } from 'react';
import type { AppDispatch } from '@/store';
import { updateCheckoutTicket, type CheckoutTicketService } from '@/store/slices/uiTicketsSlice';
import { dataService } from '@/services/dataService';
import type { TicketService } from '../ServiceList';
import type { Client } from '../ClientSelector';
import type { TicketAction, DiscountState } from '../types';
import { ticketActions } from '../reducers/ticketReducer';

// ============================================================================
// TYPES
// ============================================================================

interface UseTicketPersistenceOptions {
  isOpen: boolean;
  ticketId: string | null;
  services: TicketService[];
  selectedClient: Client | null;
  discounts: DiscountState;
  dispatch: React.Dispatch<TicketAction>;
  reduxDispatch: AppDispatch;
}

interface UseTicketPersistenceResult {
  performAutoSave: () => Promise<void>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert local TicketService to CheckoutTicketService for Redux persistence
 */
function convertToCheckoutServices(localServices: TicketService[]): CheckoutTicketService[] {
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
}

// ============================================================================
// HOOK
// ============================================================================

export function useTicketPersistence({
  isOpen,
  ticketId,
  services,
  selectedClient,
  discounts,
  dispatch,
  reduxDispatch,
}: UseTicketPersistenceOptions): UseTicketPersistenceResult {
  // Refs for tracking auto-save state
  const lastTicketIdRef = useRef<string | null>(null);
  const loadCompleteRef = useRef(false);

  // ============================================================================
  // LOAD PENDING TICKET FROM LOCALSTORAGE
  // When panel opens, load any stored pending ticket and fetch persisted status
  // ============================================================================
  useEffect(() => {
    if (isOpen) {
      const storedTicket = localStorage.getItem('checkout-pending-ticket');
      if (storedTicket) {
        const loadTicket = async () => {
          try {
            const pendingTicket = JSON.parse(storedTicket);
            console.log('📋 Loading pending ticket:', pendingTicket);

            // CRITICAL: Clear any existing services BEFORE loading to prevent duplicates
            dispatch(ticketActions.clearServices());

            // Set client from pending ticket
            if (pendingTicket.clientName && pendingTicket.clientName !== 'Walk-in') {
              const client: Client = {
                id: pendingTicket.clientId || `client-${Date.now()}`,
                firstName: pendingTicket.clientName.split(' ')[0] || '',
                lastName: pendingTicket.clientName.split(' ').slice(1).join(' ') || '',
                phone: '',
              };
              dispatch(ticketActions.setClient(client));
            }

            // Try to fetch persisted ticket from Supabase for latest service statuses
            let persistedServices: any[] | null = null;
            if (pendingTicket.id) {
              try {
                const persistedTicket = await dataService.tickets.getById(pendingTicket.id);
                if (persistedTicket && persistedTicket.services) {
                  persistedServices = persistedTicket.services;
                  console.log('📥 Fetched persisted ticket from Supabase:', persistedTicket.id);
                }
              } catch (fetchError) {
                console.warn('⚠️ Could not fetch persisted ticket, using localStorage data:', fetchError);
              }
            }

            // Load services - merge persisted status if available
            if (pendingTicket.checkoutServices && pendingTicket.checkoutServices.length > 0) {
              const ticketServices: TicketService[] = pendingTicket.checkoutServices.map((s: any) => {
                // Find persisted service to get latest status
                const persistedService = persistedServices?.find(ps => ps.serviceId === (s.serviceId || s.id));
                return {
                  id: s.id || `service-${Date.now()}-${Math.random()}`,
                  serviceId: s.serviceId || s.id,
                  serviceName: s.serviceName || s.name,
                  price: s.price || 0,
                  duration: s.duration || 30,
                  // Use persisted status if available, otherwise use localStorage/default
                  status: persistedService?.status || s.status || 'not_started',
                  staffId: s.staffId,
                  staffName: s.staffName,
                  // Restore timing data from persisted service
                  actualStartTime: persistedService?.actualStartTime,
                  pausedAt: persistedService?.pausedAt,
                  totalPausedDuration: persistedService?.totalPausedDuration,
                  endTime: persistedService?.endTime,
                  actualDuration: persistedService?.actualDuration,
                };
              });
              dispatch(ticketActions.addService(ticketServices));
            } else if (pendingTicket.service) {
              // Fallback: create service from basic pending ticket data
              const ticketService: TicketService = {
                id: `service-${Date.now()}`,
                serviceId: `service-${Date.now()}`,
                serviceName: pendingTicket.service,
                price: pendingTicket.subtotal || 0,
                duration: parseInt(pendingTicket.duration) || 30,
                status: 'completed',
                staffId: pendingTicket.techId,
                staffName: pendingTicket.technician,
              };
              dispatch(ticketActions.addService([ticketService]));
            }

            // Set discount if any
            if (pendingTicket.discount && pendingTicket.discount > 0) {
              dispatch(ticketActions.applyDiscount(pendingTicket.discount));
            }

            // Save ticket ID for persistence
            if (pendingTicket.id) {
              dispatch(ticketActions.setTicketId(pendingTicket.id));
            }

            // Detect if ticket came from Waiting Queue (status === 'waiting')
            // This will change "Check In" button to "Start" button
            if (pendingTicket.status === 'waiting') {
              dispatch(ticketActions.setIsFromWaitingQueue(true));
              console.log('🎯 Ticket loaded from Waiting Queue - "Start" button will be shown');
            } else {
              dispatch(ticketActions.setIsFromWaitingQueue(false));
            }

            // Mark as saved since this is an existing ticket from Pending
            dispatch(ticketActions.markTicketSaved());

            console.log('✅ Pending ticket loaded into checkout, ID:', pendingTicket.id);
          } catch (error) {
            console.error('❌ Failed to load pending ticket:', error);
          }
        };

        loadTicket();
      } else {
        // No stored ticket - this is a NEW ticket, reset state completely
        console.log('🆕 Opening new ticket panel - resetting state');
        dispatch(ticketActions.resetTicket());
        dispatch(ticketActions.setIsFromWaitingQueue(false));
      }
    }
  }, [isOpen, dispatch]);

  // ============================================================================
  // AUTO-SAVE STATE MANAGEMENT
  // Reset auto-save state when panel opens/closes or ticket changes
  // ============================================================================
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

  // ============================================================================
  // PERFORM AUTO-SAVE
  // Helper function to save ticket (reusable for immediate save and save-on-close)
  // ============================================================================
  const performAutoSave = useCallback(async () => {
    if (!ticketId) return;

    const checkoutServices = convertToCheckoutServices(services);
    const clientName = selectedClient
      ? `${selectedClient.firstName} ${selectedClient.lastName}`.trim()
      : 'Walk-in';
    const subtotal = services.reduce((sum, s) => sum + s.price, 0);
    const tax = Math.max(0, subtotal - discounts.discount) * 0.085;
    const total = Math.max(0, subtotal - discounts.discount) * 1.085;

    console.log('💾 Auto-saving ticket:', ticketId);

    try {
      // Update Redux state
      await reduxDispatch(updateCheckoutTicket({
        ticketId,
        updates: {
          clientId: selectedClient?.id,
          clientName,
          services: checkoutServices,
          discount: discounts.discount,
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
            discount: discounts.discount,
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
      dispatch(ticketActions.markTicketSaved());
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  }, [ticketId, services, selectedClient, discounts.discount, reduxDispatch, dispatch]);

  // ============================================================================
  // AUTO-SAVE EFFECT
  // IMMEDIATE save on every change (no debounce) to prevent data loss
  // ============================================================================
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
  }, [isOpen, ticketId, services, selectedClient, discounts.discount, performAutoSave]);

  return {
    performAutoSave,
  };
}
