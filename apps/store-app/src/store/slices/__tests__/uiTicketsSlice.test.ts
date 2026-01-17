/**
 * UI Tickets Slice Tests
 *
 * Tests for ticket state management, reducers, and selectors.
 * Focuses on synchronous reducers and selectors since async thunks
 * require extensive service mocking.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import uiTicketsReducer, {
  clearError,
  ticketUpdated,
  setPendingTickets,
  reorderWaitlist,
  setWaitlistOrder,
  removePendingTicket,
  selectWaitlist,
  selectServiceTickets,
  selectCompletedTickets,
  selectPendingTickets,
  selectTicketsLoading,
  selectTicketsError,
  markTicketAsPaid,
} from '../uiTicketsSlice';
import type { UITicket, PendingTicket } from '../uiTicketsSlice';

// Create a minimal test store
function createTestStore(preloadedState?: Partial<ReturnType<typeof uiTicketsReducer>>) {
  return configureStore({
    reducer: {
      uiTickets: uiTicketsReducer,
    },
    preloadedState: preloadedState ? { uiTickets: { ...getInitialState(), ...preloadedState } } : undefined,
  });
}

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

// Mock UITicket factory
function createMockUITicket(overrides: Partial<UITicket> = {}): UITicket {
  return {
    id: `ticket-${Date.now()}`,
    number: 1,
    clientName: 'Test Client',
    clientType: 'regular',
    service: 'Haircut',
    time: '10:00 AM',
    duration: '30min',
    status: 'waiting',
    createdAt: new Date().toISOString(),
    technician: 'John Doe',
    techId: 'tech-1',
    techColor: '#FF5733',
    ...overrides,
  };
}

// Mock PendingTicket factory
function createMockPendingTicket(overrides: Partial<PendingTicket> = {}): PendingTicket {
  return {
    id: `pending-${Date.now()}`,
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

describe('uiTicketsSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().uiTickets;

      expect(state.waitlist).toEqual([]);
      expect(state.serviceTickets).toEqual([]);
      expect(state.completedTickets).toEqual([]);
      expect(state.pendingTickets).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastTicketNumber).toBe(0);
      expect(state.lastCheckInDate).toBeNull();
      expect(state.lastCheckInNumber).toBe(0);
    });
  });

  describe('clearError reducer', () => {
    it('should clear error state', () => {
      // Set up store with error
      store = createTestStore({ error: 'Some error message' });
      expect(store.getState().uiTickets.error).toBe('Some error message');

      // Clear error
      store.dispatch(clearError());

      expect(store.getState().uiTickets.error).toBeNull();
    });

    it('should handle clearing null error (no-op)', () => {
      store.dispatch(clearError());
      expect(store.getState().uiTickets.error).toBeNull();
    });
  });

  describe('setPendingTickets reducer', () => {
    it('should set pending tickets array', () => {
      const tickets = [
        createMockPendingTicket({ id: 'pt-1', number: 1 }),
        createMockPendingTicket({ id: 'pt-2', number: 2 }),
      ];

      store.dispatch(setPendingTickets(tickets));

      const state = store.getState().uiTickets;
      expect(state.pendingTickets).toHaveLength(2);
      expect(state.pendingTickets[0].id).toBe('pt-1');
      expect(state.pendingTickets[1].id).toBe('pt-2');
    });

    it('should replace existing pending tickets', () => {
      // Set initial tickets
      const initialTickets = [createMockPendingTicket({ id: 'pt-initial' })];
      store.dispatch(setPendingTickets(initialTickets));
      expect(store.getState().uiTickets.pendingTickets[0].id).toBe('pt-initial');

      // Replace with new tickets
      const newTickets = [createMockPendingTicket({ id: 'pt-new' })];
      store.dispatch(setPendingTickets(newTickets));

      expect(store.getState().uiTickets.pendingTickets).toHaveLength(1);
      expect(store.getState().uiTickets.pendingTickets[0].id).toBe('pt-new');
    });

    it('should allow setting empty array', () => {
      const tickets = [createMockPendingTicket({ id: 'pt-1' })];
      store.dispatch(setPendingTickets(tickets));
      expect(store.getState().uiTickets.pendingTickets).toHaveLength(1);

      store.dispatch(setPendingTickets([]));
      expect(store.getState().uiTickets.pendingTickets).toHaveLength(0);
    });
  });

  describe('reorderWaitlist reducer', () => {
    beforeEach(() => {
      const tickets = [
        createMockUITicket({ id: 't-1', number: 1 }),
        createMockUITicket({ id: 't-2', number: 2 }),
        createMockUITicket({ id: 't-3', number: 3 }),
      ];
      store = createTestStore({ waitlist: tickets });
    });

    it('should reorder waitlist by moving ticket forward', () => {
      // Move first ticket to last position
      store.dispatch(reorderWaitlist({ oldIndex: 0, newIndex: 2 }));

      const waitlist = store.getState().uiTickets.waitlist;
      expect(waitlist[0].id).toBe('t-2');
      expect(waitlist[1].id).toBe('t-3');
      expect(waitlist[2].id).toBe('t-1');
    });

    it('should reorder waitlist by moving ticket backward', () => {
      // Move last ticket to first position
      store.dispatch(reorderWaitlist({ oldIndex: 2, newIndex: 0 }));

      const waitlist = store.getState().uiTickets.waitlist;
      expect(waitlist[0].id).toBe('t-3');
      expect(waitlist[1].id).toBe('t-1');
      expect(waitlist[2].id).toBe('t-2');
    });

    it('should handle same index (no change)', () => {
      store.dispatch(reorderWaitlist({ oldIndex: 1, newIndex: 1 }));

      const waitlist = store.getState().uiTickets.waitlist;
      expect(waitlist[0].id).toBe('t-1');
      expect(waitlist[1].id).toBe('t-2');
      expect(waitlist[2].id).toBe('t-3');
    });

    it('should ignore invalid indices (negative)', () => {
      store.dispatch(reorderWaitlist({ oldIndex: -1, newIndex: 0 }));

      const waitlist = store.getState().uiTickets.waitlist;
      expect(waitlist[0].id).toBe('t-1'); // Unchanged
    });

    it('should ignore invalid indices (out of bounds)', () => {
      store.dispatch(reorderWaitlist({ oldIndex: 0, newIndex: 10 }));

      const waitlist = store.getState().uiTickets.waitlist;
      expect(waitlist[0].id).toBe('t-1'); // Unchanged
    });
  });

  describe('setWaitlistOrder reducer', () => {
    it('should directly set waitlist order', () => {
      const tickets = [
        createMockUITicket({ id: 't-3', number: 3 }),
        createMockUITicket({ id: 't-1', number: 1 }),
        createMockUITicket({ id: 't-2', number: 2 }),
      ];

      store.dispatch(setWaitlistOrder(tickets));

      const waitlist = store.getState().uiTickets.waitlist;
      expect(waitlist).toHaveLength(3);
      expect(waitlist[0].id).toBe('t-3');
      expect(waitlist[1].id).toBe('t-1');
      expect(waitlist[2].id).toBe('t-2');
    });

    it('should replace existing waitlist', () => {
      const initialTickets = [createMockUITicket({ id: 't-initial' })];
      store.dispatch(setWaitlistOrder(initialTickets));

      const newTickets = [createMockUITicket({ id: 't-new' })];
      store.dispatch(setWaitlistOrder(newTickets));

      expect(store.getState().uiTickets.waitlist).toHaveLength(1);
      expect(store.getState().uiTickets.waitlist[0].id).toBe('t-new');
    });
  });

  describe('removePendingTicket reducer', () => {
    beforeEach(() => {
      const tickets = [
        createMockPendingTicket({ id: 'pt-1', number: 1 }),
        createMockPendingTicket({ id: 'pt-2', number: 2 }),
        createMockPendingTicket({ id: 'pt-3', number: 3 }),
      ];
      store = createTestStore({ pendingTickets: tickets });
    });

    it('should remove pending ticket by id', () => {
      store.dispatch(removePendingTicket({ ticketId: 'pt-2', reason: 'Client left' }));

      const pendingTickets = store.getState().uiTickets.pendingTickets;
      expect(pendingTickets).toHaveLength(2);
      expect(pendingTickets.find(t => t.id === 'pt-2')).toBeUndefined();
    });

    it('should not modify array if ticket not found', () => {
      store.dispatch(removePendingTicket({ ticketId: 'pt-nonexistent', reason: 'Unknown' }));

      expect(store.getState().uiTickets.pendingTickets).toHaveLength(3);
    });

    it('should handle removal with notes', () => {
      store.dispatch(removePendingTicket({
        ticketId: 'pt-1',
        reason: 'Cancelled',
        notes: 'Customer requested cancellation',
      }));

      const pendingTickets = store.getState().uiTickets.pendingTickets;
      expect(pendingTickets).toHaveLength(2);
      expect(pendingTickets.find(t => t.id === 'pt-1')).toBeUndefined();
    });
  });

  describe('ticketUpdated reducer (real-time updates)', () => {
    it('should add waiting ticket to waitlist', () => {
      const ticket = createMockUITicket({ id: 't-1', status: 'waiting' });
      store.dispatch(ticketUpdated(ticket));

      expect(store.getState().uiTickets.waitlist).toHaveLength(1);
      expect(store.getState().uiTickets.waitlist[0].id).toBe('t-1');
    });

    it('should add in-service ticket to serviceTickets', () => {
      const ticket = createMockUITicket({ id: 't-1', status: 'in-service' });
      store.dispatch(ticketUpdated(ticket));

      expect(store.getState().uiTickets.serviceTickets).toHaveLength(1);
      expect(store.getState().uiTickets.serviceTickets[0].id).toBe('t-1');
    });

    it('should add completed ticket to completedTickets', () => {
      const ticket = createMockUITicket({ id: 't-1', status: 'completed' });
      store.dispatch(ticketUpdated(ticket));

      expect(store.getState().uiTickets.completedTickets).toHaveLength(1);
      expect(store.getState().uiTickets.completedTickets[0].id).toBe('t-1');
    });

    it('should move ticket between lists on status change', () => {
      // Add to waitlist first
      const waitingTicket = createMockUITicket({ id: 't-1', status: 'waiting' });
      store.dispatch(ticketUpdated(waitingTicket));
      expect(store.getState().uiTickets.waitlist).toHaveLength(1);

      // Update to in-service
      const inServiceTicket = createMockUITicket({ id: 't-1', status: 'in-service' });
      store.dispatch(ticketUpdated(inServiceTicket));

      const state = store.getState().uiTickets;
      expect(state.waitlist).toHaveLength(0);
      expect(state.serviceTickets).toHaveLength(1);
      expect(state.serviceTickets[0].id).toBe('t-1');
    });

    it('should remove from all lists before adding', () => {
      // Set up initial state with ticket in waitlist
      const initialTicket = createMockUITicket({ id: 't-1', status: 'waiting' });
      store = createTestStore({
        waitlist: [initialTicket],
        serviceTickets: [{ ...initialTicket, status: 'in-service' }], // Duplicate (edge case)
      });

      // Update ticket
      const updatedTicket = createMockUITicket({ id: 't-1', status: 'completed' });
      store.dispatch(ticketUpdated(updatedTicket));

      const state = store.getState().uiTickets;
      expect(state.waitlist).toHaveLength(0);
      expect(state.serviceTickets).toHaveLength(0);
      expect(state.completedTickets).toHaveLength(1);
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      store = createTestStore({
        waitlist: [createMockUITicket({ id: 'w-1' })],
        serviceTickets: [createMockUITicket({ id: 's-1' }), createMockUITicket({ id: 's-2' })],
        completedTickets: [createMockUITicket({ id: 'c-1' })],
        pendingTickets: [createMockPendingTicket({ id: 'p-1' })],
        loading: true,
        error: 'Test error',
      });
    });

    it('selectWaitlist should return waitlist array', () => {
      const waitlist = selectWaitlist(store.getState());
      expect(waitlist).toHaveLength(1);
      expect(waitlist[0].id).toBe('w-1');
    });

    it('selectServiceTickets should return serviceTickets array', () => {
      const serviceTickets = selectServiceTickets(store.getState());
      expect(serviceTickets).toHaveLength(2);
      expect(serviceTickets[0].id).toBe('s-1');
    });

    it('selectCompletedTickets should return completedTickets array', () => {
      const completedTickets = selectCompletedTickets(store.getState());
      expect(completedTickets).toHaveLength(1);
      expect(completedTickets[0].id).toBe('c-1');
    });

    it('selectPendingTickets should return pendingTickets array', () => {
      const pendingTickets = selectPendingTickets(store.getState());
      expect(pendingTickets).toHaveLength(1);
      expect(pendingTickets[0].id).toBe('p-1');
    });

    it('selectTicketsLoading should return loading state', () => {
      expect(selectTicketsLoading(store.getState())).toBe(true);
    });

    it('selectTicketsError should return error state', () => {
      expect(selectTicketsError(store.getState())).toBe('Test error');
    });
  });

  describe('edge cases', () => {
    it('should handle empty arrays for all ticket lists', () => {
      store = createTestStore({
        waitlist: [],
        serviceTickets: [],
        completedTickets: [],
        pendingTickets: [],
      });

      expect(selectWaitlist(store.getState())).toEqual([]);
      expect(selectServiceTickets(store.getState())).toEqual([]);
      expect(selectCompletedTickets(store.getState())).toEqual([]);
      expect(selectPendingTickets(store.getState())).toEqual([]);
    });

    it('should maintain ticket integrity through multiple operations', () => {
      // Create ticket with all fields
      const fullTicket = createMockUITicket({
        id: 'full-ticket',
        number: 42,
        clientName: 'Full Test',
        clientType: 'vip',
        service: 'Premium Service',
        checkInNumber: 5,
        notes: 'Special notes',
        assignedTo: { id: 'staff-1', name: 'Staff Name', color: '#FF0000' },
      });

      store.dispatch(ticketUpdated({ ...fullTicket, status: 'waiting' }));
      store.dispatch(ticketUpdated({ ...fullTicket, status: 'in-service' }));
      store.dispatch(ticketUpdated({ ...fullTicket, status: 'completed' }));

      const completedTickets = selectCompletedTickets(store.getState());
      expect(completedTickets[0].clientName).toBe('Full Test');
      expect(completedTickets[0].number).toBe(42);
      expect(completedTickets[0].checkInNumber).toBe(5);
    });
  });

  describe('markTicketAsPaid.fulfilled reducer', () => {
    it('should remove ticket from waitlist when sourceArray is waitlist', () => {
      // Set up store with ticket in waitlist
      const waitlistTicket = createMockUITicket({
        id: 'waitlist-ticket-1',
        number: 1,
        clientName: 'Waitlist Client',
        status: 'waiting',
      });
      store = createTestStore({ waitlist: [waitlistTicket] });

      // Verify ticket is in waitlist before dispatch
      expect(store.getState().uiTickets.waitlist).toHaveLength(1);
      expect(store.getState().uiTickets.waitlist[0].id).toBe('waitlist-ticket-1');

      // Dispatch markTicketAsPaid.fulfilled action with sourceArray: 'waitlist'
      store.dispatch({
        type: markTicketAsPaid.fulfilled.type,
        payload: {
          ticketId: 'waitlist-ticket-1',
          ticket: waitlistTicket,
          sourceArray: 'waitlist',
          paymentMethod: 'credit-card',
          tip: 0,
          transaction: { id: 'txn-1' },
        },
      });

      // Verify ticket is removed from waitlist
      expect(store.getState().uiTickets.waitlist).toHaveLength(0);

      // Verify ticket is added to completedTickets with status 'completed'
      const completedTickets = store.getState().uiTickets.completedTickets;
      expect(completedTickets).toHaveLength(1);
      expect(completedTickets[0].id).toBe('waitlist-ticket-1');
      expect(completedTickets[0].clientName).toBe('Waitlist Client');
      expect(completedTickets[0].status).toBe('completed');
    });

    it('should remove ticket from serviceTickets when sourceArray is in-service', () => {
      // Set up store with ticket in serviceTickets
      const inServiceTicket = createMockUITicket({
        id: 'service-ticket-1',
        number: 2,
        clientName: 'In-Service Client',
        status: 'in-service',
      });
      store = createTestStore({ serviceTickets: [inServiceTicket] });

      // Verify ticket is in serviceTickets before dispatch
      expect(store.getState().uiTickets.serviceTickets).toHaveLength(1);
      expect(store.getState().uiTickets.serviceTickets[0].id).toBe('service-ticket-1');

      // Dispatch markTicketAsPaid.fulfilled action with sourceArray: 'in-service'
      store.dispatch({
        type: markTicketAsPaid.fulfilled.type,
        payload: {
          ticketId: 'service-ticket-1',
          ticket: inServiceTicket,
          sourceArray: 'in-service',
          paymentMethod: 'credit-card',
          tip: 0,
          transaction: { id: 'txn-2' },
        },
      });

      // Verify ticket is removed from serviceTickets
      expect(store.getState().uiTickets.serviceTickets).toHaveLength(0);

      // Verify ticket is added to completedTickets
      const completedTickets = store.getState().uiTickets.completedTickets;
      expect(completedTickets).toHaveLength(1);
      expect(completedTickets[0].id).toBe('service-ticket-1');
      expect(completedTickets[0].clientName).toBe('In-Service Client');
      expect(completedTickets[0].status).toBe('completed');
    });

    it('should remove ticket from pendingTickets when sourceArray is pending', () => {
      // Set up store with ticket in pendingTickets (use PendingTicket shape)
      const pendingTicket = createMockPendingTicket({
        id: 'pending-ticket-1',
        number: 3,
        clientName: 'Pending Client',
        subtotal: 50,
        tax: 5,
      });
      store = createTestStore({ pendingTickets: [pendingTicket] });

      // Verify ticket is in pendingTickets before dispatch
      expect(store.getState().uiTickets.pendingTickets).toHaveLength(1);
      expect(store.getState().uiTickets.pendingTickets[0].id).toBe('pending-ticket-1');

      // Dispatch markTicketAsPaid.fulfilled action with sourceArray: 'pending'
      store.dispatch({
        type: markTicketAsPaid.fulfilled.type,
        payload: {
          ticketId: 'pending-ticket-1',
          ticket: pendingTicket,
          sourceArray: 'pending',
          paymentMethod: 'credit-card',
          tip: 0,
          transaction: { id: 'txn-3' },
        },
      });

      // Verify ticket is removed from pendingTickets
      expect(store.getState().uiTickets.pendingTickets).toHaveLength(0);

      // Verify ticket is added to completedTickets
      const completedTickets = store.getState().uiTickets.completedTickets;
      expect(completedTickets).toHaveLength(1);
      expect(completedTickets[0].id).toBe('pending-ticket-1');
      expect(completedTickets[0].clientName).toBe('Pending Client');
      expect(completedTickets[0].status).toBe('completed');
    });

    it('should calculate total correctly with subtotal, tax, and tip', () => {
      // Set up store with PendingTicket having subtotal: 50, tax: 5
      const pendingTicket = createMockPendingTicket({
        id: 'total-calc-ticket',
        number: 4,
        clientName: 'Total Calc Client',
        subtotal: 50,
        tax: 5,
      });
      store = createTestStore({ pendingTickets: [pendingTicket] });

      // Dispatch markTicketAsPaid.fulfilled action with tip: 10
      store.dispatch({
        type: markTicketAsPaid.fulfilled.type,
        payload: {
          ticketId: 'total-calc-ticket',
          ticket: pendingTicket,
          sourceArray: 'pending',
          paymentMethod: 'credit-card',
          tip: 10,
          transaction: { id: 'txn-total' },
        },
      });

      // Verify total equals 65 (50 + 5 + 10)
      const completedTickets = store.getState().uiTickets.completedTickets;
      expect(completedTickets).toHaveLength(1);
      expect(completedTickets[0].total).toBe(65);
    });

    it('should set payment method display value correctly for credit-card', () => {
      // Set up store with ticket in waitlist
      const waitlistTicket = createMockUITicket({
        id: 'payment-card-ticket',
        number: 5,
        clientName: 'Card Payment Client',
        status: 'waiting',
      });
      store = createTestStore({ waitlist: [waitlistTicket] });

      // Dispatch markTicketAsPaid.fulfilled action with paymentMethod: 'credit-card'
      store.dispatch({
        type: markTicketAsPaid.fulfilled.type,
        payload: {
          ticketId: 'payment-card-ticket',
          ticket: waitlistTicket,
          sourceArray: 'waitlist',
          paymentMethod: 'credit-card',
          tip: 0,
          transaction: { id: 'txn-card' },
        },
      });

      // Verify paymentMethod 'credit-card' becomes 'Card' in completedTicket
      const completedTickets = store.getState().uiTickets.completedTickets;
      expect(completedTickets).toHaveLength(1);
      expect(completedTickets[0].paymentMethod).toBe('Card');
    });

    it('should set payment method display value correctly for cash', () => {
      // Set up store with ticket in waitlist
      const waitlistTicket = createMockUITicket({
        id: 'payment-cash-ticket',
        number: 6,
        clientName: 'Cash Payment Client',
        status: 'waiting',
      });
      store = createTestStore({ waitlist: [waitlistTicket] });

      // Dispatch markTicketAsPaid.fulfilled action with paymentMethod: 'cash'
      store.dispatch({
        type: markTicketAsPaid.fulfilled.type,
        payload: {
          ticketId: 'payment-cash-ticket',
          ticket: waitlistTicket,
          sourceArray: 'waitlist',
          paymentMethod: 'cash',
          tip: 0,
          transaction: { id: 'txn-cash' },
        },
      });

      // Verify paymentMethod 'cash' becomes 'Cash' in completedTicket
      const completedTickets = store.getState().uiTickets.completedTickets;
      expect(completedTickets).toHaveLength(1);
      expect(completedTickets[0].paymentMethod).toBe('Cash');
    });
  });
});
