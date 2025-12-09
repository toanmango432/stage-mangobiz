/**
 * Front Desk Ticket Operations Integration Tests
 * Tests for ticket CRUD operations and state management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

// ============================================
// MOCK STORE SETUP
// ============================================

// Simplified ticket slice for testing
interface Ticket {
  id: string;
  clientId: string;
  clientName: string;
  status: 'pending' | 'waiting' | 'in-service' | 'completed' | 'cancelled';
  services: TicketService[];
  createdAt: string;
  updatedAt: string;
}

interface TicketService {
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  price: number;
  status: 'not_started' | 'in_progress' | 'paused' | 'completed';
}

interface TicketsState {
  items: Ticket[];
  loading: boolean;
  error: string | null;
}

const initialState: TicketsState = {
  items: [],
  loading: false,
  error: null,
};

// Simple reducer for testing
function ticketsReducer(
  state = initialState,
  action: { type: string; payload?: any }
): TicketsState {
  switch (action.type) {
    case 'tickets/add':
      return { ...state, items: [...state.items, action.payload] };
    case 'tickets/update':
      return {
        ...state,
        items: state.items.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };
    case 'tickets/remove':
      return {
        ...state,
        items: state.items.filter(t => t.id !== action.payload),
      };
    case 'tickets/setLoading':
      return { ...state, loading: action.payload };
    case 'tickets/setError':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

function createTestStore(preloadedState?: Partial<TicketsState>) {
  return configureStore({
    reducer: {
      tickets: ticketsReducer,
    },
    preloadedState: preloadedState ? { tickets: { ...initialState, ...preloadedState } } : undefined,
  });
}

// ============================================
// TEST HELPERS
// ============================================

function createMockTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    clientId: 'client-1',
    clientName: 'Test Client',
    status: 'pending',
    services: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockService(overrides: Partial<TicketService> = {}): TicketService {
  return {
    serviceId: `service-${Math.random().toString(36).substr(2, 9)}`,
    serviceName: 'Test Service',
    staffId: 'staff-1',
    staffName: 'Test Staff',
    price: 50,
    status: 'not_started',
    ...overrides,
  };
}

// ============================================
// TICKET CRUD TESTS
// ============================================

describe('Ticket Operations Integration', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Create Ticket', () => {
    it('should add a new ticket to the store', () => {
      const ticket = createMockTicket({ id: 'ticket-1' });
      
      store.dispatch({ type: 'tickets/add', payload: ticket });
      
      const state = store.getState().tickets;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('ticket-1');
    });

    it('should create ticket with services', () => {
      const services = [
        createMockService({ serviceName: 'Haircut', price: 30 }),
        createMockService({ serviceName: 'Color', price: 80 }),
      ];
      const ticket = createMockTicket({ id: 'ticket-1', services });
      
      store.dispatch({ type: 'tickets/add', payload: ticket });
      
      const state = store.getState().tickets;
      expect(state.items[0].services).toHaveLength(2);
      expect(state.items[0].services[0].serviceName).toBe('Haircut');
    });

    it('should create ticket with client info', () => {
      const ticket = createMockTicket({
        id: 'ticket-1',
        clientId: 'client-123',
        clientName: 'John Doe',
      });
      
      store.dispatch({ type: 'tickets/add', payload: ticket });
      
      const state = store.getState().tickets;
      expect(state.items[0].clientId).toBe('client-123');
      expect(state.items[0].clientName).toBe('John Doe');
    });

    it('should create walk-in ticket without client', () => {
      const ticket = createMockTicket({
        id: 'ticket-1',
        clientId: 'walk-in',
        clientName: 'Walk-in Customer',
      });
      
      store.dispatch({ type: 'tickets/add', payload: ticket });
      
      const state = store.getState().tickets;
      expect(state.items[0].clientId).toBe('walk-in');
    });
  });

  describe('Update Ticket', () => {
    beforeEach(() => {
      const ticket = createMockTicket({ id: 'ticket-1', status: 'pending' });
      store.dispatch({ type: 'tickets/add', payload: ticket });
    });

    it('should update ticket status', () => {
      store.dispatch({
        type: 'tickets/update',
        payload: { id: 'ticket-1', updates: { status: 'waiting' } },
      });
      
      const state = store.getState().tickets;
      expect(state.items[0].status).toBe('waiting');
    });

    it('should update ticket services', () => {
      const newServices = [createMockService({ serviceName: 'New Service' })];
      
      store.dispatch({
        type: 'tickets/update',
        payload: { id: 'ticket-1', updates: { services: newServices } },
      });
      
      const state = store.getState().tickets;
      expect(state.items[0].services[0].serviceName).toBe('New Service');
    });

    it('should update updatedAt timestamp', () => {
      const originalUpdatedAt = store.getState().tickets.items[0].updatedAt;
      
      // Wait a bit to ensure different timestamp
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);
      
      store.dispatch({
        type: 'tickets/update',
        payload: {
          id: 'ticket-1',
          updates: { status: 'waiting', updatedAt: new Date().toISOString() },
        },
      });
      
      const state = store.getState().tickets;
      expect(state.items[0].updatedAt).not.toBe(originalUpdatedAt);
      
      vi.useRealTimers();
    });

    it('should not update non-existent ticket', () => {
      store.dispatch({
        type: 'tickets/update',
        payload: { id: 'non-existent', updates: { status: 'waiting' } },
      });
      
      const state = store.getState().tickets;
      expect(state.items[0].status).toBe('pending'); // Unchanged
    });
  });

  describe('Delete Ticket', () => {
    beforeEach(() => {
      store.dispatch({ type: 'tickets/add', payload: createMockTicket({ id: 'ticket-1' }) });
      store.dispatch({ type: 'tickets/add', payload: createMockTicket({ id: 'ticket-2' }) });
    });

    it('should remove ticket from store', () => {
      store.dispatch({ type: 'tickets/remove', payload: 'ticket-1' });
      
      const state = store.getState().tickets;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe('ticket-2');
    });

    it('should handle removing non-existent ticket', () => {
      store.dispatch({ type: 'tickets/remove', payload: 'non-existent' });
      
      const state = store.getState().tickets;
      expect(state.items).toHaveLength(2); // Unchanged
    });
  });
});

// ============================================
// TICKET STATUS WORKFLOW TESTS
// ============================================

describe('Ticket Status Workflow', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    const ticket = createMockTicket({
      id: 'ticket-1',
      status: 'pending',
      services: [createMockService()],
    });
    store.dispatch({ type: 'tickets/add', payload: ticket });
  });

  it('should follow pending → waiting → in-service → completed flow', () => {
    // Start: pending
    expect(store.getState().tickets.items[0].status).toBe('pending');
    
    // Move to waiting
    store.dispatch({
      type: 'tickets/update',
      payload: { id: 'ticket-1', updates: { status: 'waiting' } },
    });
    expect(store.getState().tickets.items[0].status).toBe('waiting');
    
    // Move to in-service
    store.dispatch({
      type: 'tickets/update',
      payload: { id: 'ticket-1', updates: { status: 'in-service' } },
    });
    expect(store.getState().tickets.items[0].status).toBe('in-service');
    
    // Move to completed
    store.dispatch({
      type: 'tickets/update',
      payload: { id: 'ticket-1', updates: { status: 'completed' } },
    });
    expect(store.getState().tickets.items[0].status).toBe('completed');
  });

  it('should allow cancellation from any non-terminal state', () => {
    // Cancel from pending
    store.dispatch({
      type: 'tickets/update',
      payload: { id: 'ticket-1', updates: { status: 'cancelled' } },
    });
    expect(store.getState().tickets.items[0].status).toBe('cancelled');
  });
});

// ============================================
// SERVICE STATUS TESTS
// ============================================

describe('Service Status Management', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    const ticket = createMockTicket({
      id: 'ticket-1',
      status: 'in-service',
      services: [
        createMockService({ serviceId: 'svc-1', status: 'not_started' }),
        createMockService({ serviceId: 'svc-2', status: 'not_started' }),
      ],
    });
    store.dispatch({ type: 'tickets/add', payload: ticket });
  });

  it('should update individual service status', () => {
    const currentTicket = store.getState().tickets.items[0];
    const updatedServices = currentTicket.services.map(s =>
      s.serviceId === 'svc-1' ? { ...s, status: 'in_progress' as const } : s
    );
    
    store.dispatch({
      type: 'tickets/update',
      payload: { id: 'ticket-1', updates: { services: updatedServices } },
    });
    
    const state = store.getState().tickets;
    expect(state.items[0].services[0].status).toBe('in_progress');
    expect(state.items[0].services[1].status).toBe('not_started');
  });

  it('should track service completion', () => {
    const currentTicket = store.getState().tickets.items[0];
    const updatedServices = currentTicket.services.map(s => ({
      ...s,
      status: 'completed' as const,
    }));
    
    store.dispatch({
      type: 'tickets/update',
      payload: { id: 'ticket-1', updates: { services: updatedServices } },
    });
    
    const state = store.getState().tickets;
    expect(state.items[0].services.every(s => s.status === 'completed')).toBe(true);
  });
});

// ============================================
// FILTERING AND QUERYING TESTS
// ============================================

describe('Ticket Filtering', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    // Add various tickets
    store.dispatch({
      type: 'tickets/add',
      payload: createMockTicket({ id: 'ticket-1', status: 'pending' }),
    });
    store.dispatch({
      type: 'tickets/add',
      payload: createMockTicket({ id: 'ticket-2', status: 'waiting' }),
    });
    store.dispatch({
      type: 'tickets/add',
      payload: createMockTicket({ id: 'ticket-3', status: 'in-service' }),
    });
    store.dispatch({
      type: 'tickets/add',
      payload: createMockTicket({ id: 'ticket-4', status: 'completed' }),
    });
    store.dispatch({
      type: 'tickets/add',
      payload: createMockTicket({ id: 'ticket-5', status: 'waiting' }),
    });
  });

  it('should filter tickets by status', () => {
    const state = store.getState().tickets;
    const waitingTickets = state.items.filter(t => t.status === 'waiting');
    expect(waitingTickets).toHaveLength(2);
  });

  it('should get active tickets (non-completed, non-cancelled)', () => {
    const state = store.getState().tickets;
    const activeTickets = state.items.filter(
      t => t.status !== 'completed' && t.status !== 'cancelled'
    );
    expect(activeTickets).toHaveLength(4);
  });

  it('should get waitlist tickets', () => {
    const state = store.getState().tickets;
    const waitlist = state.items.filter(t => t.status === 'waiting');
    expect(waitlist).toHaveLength(2);
    expect(waitlist.map(t => t.id)).toContain('ticket-2');
    expect(waitlist.map(t => t.id)).toContain('ticket-5');
  });

  it('should get in-service tickets', () => {
    const state = store.getState().tickets;
    const inService = state.items.filter(t => t.status === 'in-service');
    expect(inService).toHaveLength(1);
    expect(inService[0].id).toBe('ticket-3');
  });
});

// ============================================
// CONCURRENT OPERATIONS TESTS
// ============================================

describe('Concurrent Operations', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should handle multiple ticket additions', () => {
    const tickets = Array.from({ length: 10 }, (_, i) =>
      createMockTicket({ id: `ticket-${i}` })
    );
    
    tickets.forEach(ticket => {
      store.dispatch({ type: 'tickets/add', payload: ticket });
    });
    
    expect(store.getState().tickets.items).toHaveLength(10);
  });

  it('should handle rapid status updates', () => {
    store.dispatch({
      type: 'tickets/add',
      payload: createMockTicket({ id: 'ticket-1', status: 'pending' }),
    });
    
    // Rapid updates
    store.dispatch({
      type: 'tickets/update',
      payload: { id: 'ticket-1', updates: { status: 'waiting' } },
    });
    store.dispatch({
      type: 'tickets/update',
      payload: { id: 'ticket-1', updates: { status: 'in-service' } },
    });
    store.dispatch({
      type: 'tickets/update',
      payload: { id: 'ticket-1', updates: { status: 'completed' } },
    });
    
    expect(store.getState().tickets.items[0].status).toBe('completed');
  });

  it('should maintain data integrity with mixed operations', () => {
    // Add tickets
    store.dispatch({
      type: 'tickets/add',
      payload: createMockTicket({ id: 'ticket-1' }),
    });
    store.dispatch({
      type: 'tickets/add',
      payload: createMockTicket({ id: 'ticket-2' }),
    });
    
    // Update one
    store.dispatch({
      type: 'tickets/update',
      payload: { id: 'ticket-1', updates: { status: 'waiting' } },
    });
    
    // Remove another
    store.dispatch({ type: 'tickets/remove', payload: 'ticket-2' });
    
    // Add new one
    store.dispatch({
      type: 'tickets/add',
      payload: createMockTicket({ id: 'ticket-3' }),
    });
    
    const state = store.getState().tickets;
    expect(state.items).toHaveLength(2);
    expect(state.items.find(t => t.id === 'ticket-1')?.status).toBe('waiting');
    expect(state.items.find(t => t.id === 'ticket-2')).toBeUndefined();
    expect(state.items.find(t => t.id === 'ticket-3')).toBeDefined();
  });
});
