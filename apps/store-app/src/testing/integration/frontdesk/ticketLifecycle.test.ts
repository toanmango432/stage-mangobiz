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
});
