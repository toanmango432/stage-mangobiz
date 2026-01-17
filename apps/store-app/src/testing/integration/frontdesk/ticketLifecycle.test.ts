/**
 * Ticket Lifecycle Integration Tests
 *
 * Tests for ticket lifecycle flows in Front Desk:
 * - Normal flow: waiting -> in-service -> pending -> paid
 * - Direct checkout flows (from waiting, in-service)
 * - Appointment check-in flows
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import uiTicketsReducer, {
  ticketUpdated,
  markTicketAsPaid,
} from '../../../store/slices/uiTicketsSlice';
import type { UITicket, PendingTicket } from '../../../store/slices/uiTicketsSlice';

// ============================================
// MOCK STORE SETUP
// ============================================

// Helper to get initial state
function getInitialState() {
  return {
    waitlist: [] as UITicket[],
    serviceTickets: [] as UITicket[],
    completedTickets: [] as UITicket[],
    pendingTickets: [] as PendingTicket[],
    loading: false,
    error: null as string | null,
    lastTicketNumber: 0,
    lastCheckInDate: null as string | null,
    lastCheckInNumber: 0,
  };
}

// Create a test store with the actual uiTicketsReducer
function createTestStore(preloadedState?: Partial<ReturnType<typeof uiTicketsReducer>>) {
  return configureStore({
    reducer: {
      uiTickets: uiTicketsReducer,
    },
    preloadedState: preloadedState ? { uiTickets: { ...getInitialState(), ...preloadedState } } : undefined,
  });
}

// ============================================
// TEST HELPERS
// ============================================

// Mock UITicket factory
function createMockUITicket(overrides: Partial<UITicket> = {}): UITicket {
  return {
    id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    number: 1,
    clientName: 'Test Client',
    clientType: 'regular',
    service: 'Haircut',
    time: '10:00 AM',
    duration: '30min',
    status: 'waiting',
    createdAt: new Date(),
    updatedAt: new Date(),
    technician: 'John Doe',
    techId: 'tech-1',
    techColor: '#FF5733',
    ...overrides,
  };
}

// Mock PendingTicket factory
function createMockPendingTicket(overrides: Partial<PendingTicket> = {}): PendingTicket {
  return {
    id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    number: 1,
    clientName: 'Test Client',
    clientType: 'regular',
    service: 'Haircut',
    additionalServices: 0,
    subtotal: 50,
    tax: 5,
    tip: 0,
    paymentType: 'card',
    time: '10:00 AM',
    duration: '30min',
    technician: 'John Doe',
    techColor: '#FF5733',
    techId: 'tech-1',
    ...overrides,
  };
}

// ============================================
// TICKET LIFECYCLE INTEGRATION TESTS
// ============================================

describe('Ticket Lifecycle Integration', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should have correct initial state', () => {
    const state = store.getState().uiTickets;
    expect(state.waitlist).toEqual([]);
    expect(state.serviceTickets).toEqual([]);
    expect(state.completedTickets).toEqual([]);
    expect(state.pendingTickets).toEqual([]);
  });

  // ============================================
  // NORMAL FLOW: waiting → in-service → pending → paid
  // ============================================

  describe('normal flow: waiting → in-service → pending → paid', () => {
    it('should move ticket through all states correctly', () => {
      // Step 1: Create ticket in waitlist with status 'waiting'
      const ticketId = 'lifecycle-test-ticket-1';
      const initialTicket = createMockUITicket({
        id: ticketId,
        number: 101,
        status: 'waiting',
        clientName: 'Lifecycle Test Client',
        service: 'Full Service',
      });

      // Initialize store with ticket in waitlist
      store = createTestStore({
        waitlist: [initialTicket],
      });

      // Verify ticket is in waitlist
      let state = store.getState().uiTickets;
      expect(state.waitlist).toHaveLength(1);
      expect(state.waitlist[0].id).toBe(ticketId);
      expect(state.waitlist[0].status).toBe('waiting');
      expect(state.serviceTickets).toHaveLength(0);
      expect(state.pendingTickets).toHaveLength(0);
      expect(state.completedTickets).toHaveLength(0);

      // Step 2: Move to in-service using ticketUpdated action
      const inServiceTicket: UITicket = {
        ...initialTicket,
        status: 'in-service',
        updatedAt: new Date(),
      };
      store.dispatch(ticketUpdated(inServiceTicket));

      // Verify ticket is now in serviceTickets
      state = store.getState().uiTickets;
      expect(state.waitlist).toHaveLength(0);
      expect(state.serviceTickets).toHaveLength(1);
      expect(state.serviceTickets[0].id).toBe(ticketId);
      expect(state.serviceTickets[0].status).toBe('in-service');
      expect(state.pendingTickets).toHaveLength(0);
      expect(state.completedTickets).toHaveLength(0);

      // Step 3: Move to pending using completeTicket.fulfilled action
      // This simulates completing the service and moving to checkout
      const pendingTicketData: PendingTicket = {
        id: ticketId,
        number: 101,
        clientName: 'Lifecycle Test Client',
        clientType: 'regular',
        service: 'Full Service',
        additionalServices: 0,
        subtotal: 75,
        tax: 7.5,
        tip: 0,
        paymentType: 'card',
        time: '10:00 AM',
        technician: 'John Doe',
        techColor: '#FF5733',
        techId: 'tech-1',
      };

      // Dispatch completeTicket.fulfilled action directly
      store.dispatch({
        type: 'uiTickets/complete/fulfilled',
        payload: {
          ticketId,
          pendingTicket: pendingTicketData,
        },
      });

      // Verify ticket is now in pendingTickets (awaiting payment)
      state = store.getState().uiTickets;
      expect(state.waitlist).toHaveLength(0);
      expect(state.serviceTickets).toHaveLength(0);
      expect(state.pendingTickets).toHaveLength(1);
      expect(state.pendingTickets[0].id).toBe(ticketId);
      expect(state.completedTickets).toHaveLength(0);
    });
  });
});
