/**
 * StaffSidebar Hooks Integration Tests
 *
 * Tests that verify real Redux data displays correctly on staff cards.
 * These tests use Redux Provider with configured store to test actual selector integration.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ReactNode } from 'react';

// Import the hooks to test
import { useStaffTicketInfo } from '../useStaffTicketInfo';
import { useStaffNextAppointment, useStaffLastServiceTime } from '../useStaffAppointments';

// Import types
import type { UITicket } from '@/store/slices/uiTicketsSlice';

// ============================================================================
// TEST UTILITIES
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TestStoreState = {
  uiTickets?: {
    serviceTickets?: UITicket[];
    completedTickets?: UITicket[];
    waitlist?: UITicket[];
    pendingTickets?: unknown[];
    loading?: boolean;
    error?: string | null;
  };
  appointments?: {
    appointments?: Array<{
      id: string;
      staffId: string;
      staffName: string;
      clientName: string;
      scheduledStartTime: string;
      scheduledEndTime: string;
      status: string;
      services: Array<{
        serviceId: string;
        serviceName: string;
        staffId: string;
        staffName: string;
        duration: number;
        price: number;
      }>;
      createdAt: string;
      updatedAt: string;
    }>;
    selectedDate?: string;
    isLoading?: boolean;
    error?: string | null;
  };
};

/**
 * Create a minimal test store with only the slices needed for these hooks
 */
function createTestStore(initialState: TestStoreState = {}) {
  // Create mock reducers that return the state we want
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockUiTicketsReducer = (state: any = {
    waitlist: [],
    serviceTickets: [],
    completedTickets: [],
    pendingTickets: [],
    loading: false,
    error: null,
    lastTicketNumber: 0,
    ...initialState.uiTickets,
  }) => state;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockAppointmentsReducer = (state: any = {
    appointments: [],
    selectedDate: new Date().toISOString(),
    isLoading: false,
    error: null,
    statusFilter: 'all',
    lastFetchDate: null,
    ...initialState.appointments,
  }) => state;

  return configureStore({
    reducer: {
      uiTickets: mockUiTicketsReducer,
      appointments: mockAppointmentsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for tests with Date objects
      }),
  });
}

/**
 * Create a wrapper component with Redux Provider for renderHook
 */
function createWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return Provider({ store, children });
  };
}

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

/**
 * Create a mock UITicket for in-service state
 */
function createMockServiceTicket(overrides: Partial<UITicket> = {}): UITicket {
  const now = new Date();
  return {
    id: 'ticket-1',
    number: 101,
    clientName: 'Jane Doe',
    clientType: 'returning',
    service: 'Full Manicure',
    time: '10:00 AM',
    duration: '45min',
    status: 'in-service',
    serviceStatus: 'in_progress',
    techId: 'staff-1',
    technician: 'Alice Smith',
    techColor: '#10b981',
    assignedTo: {
      id: 'staff-1',
      name: 'Alice Smith',
      color: '#10b981',
    },
    createdAt: new Date(now.getTime() - 15 * 60000), // Started 15 min ago
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a mock completed/paid ticket
 */
function createMockCompletedTicket(overrides: Partial<UITicket> = {}): UITicket {
  const completedTime = new Date();
  completedTime.setHours(completedTime.getHours() - 1); // Completed 1 hour ago

  return {
    id: 'ticket-completed-1',
    number: 100,
    clientName: 'Bob Wilson',
    clientType: 'walk-in',
    service: 'Haircut',
    time: '9:00 AM',
    duration: '30min',
    status: 'completed', // 'completed' means paid in the UI
    serviceStatus: 'completed',
    techId: 'staff-1',
    technician: 'Alice Smith',
    techColor: '#10b981',
    assignedTo: {
      id: 'staff-1',
      name: 'Alice Smith',
      color: '#10b981',
    },
    createdAt: new Date(completedTime.getTime() - 30 * 60000), // Started 30 min before completion
    updatedAt: completedTime,
    ...overrides,
  };
}

/**
 * Create a mock appointment
 */
function createMockAppointment(overrides: Partial<{
  id: string;
  staffId: string;
  staffName: string;
  clientName: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
    staffId: string;
    staffName: string;
    duration: number;
    price: number;
  }>;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  const futureTime = new Date();
  futureTime.setHours(futureTime.getHours() + 2); // 2 hours from now
  const endTime = new Date(futureTime.getTime() + 60 * 60000); // 1 hour duration

  return {
    id: 'apt-1',
    staffId: 'staff-1',
    staffName: 'Alice Smith',
    clientName: 'Future Client',
    scheduledStartTime: futureTime.toISOString(),
    scheduledEndTime: endTime.toISOString(),
    status: 'scheduled',
    services: [
      {
        serviceId: 'svc-1',
        serviceName: 'Full Service',
        staffId: 'staff-1',
        staffName: 'Alice Smith',
        duration: 60,
        price: 75,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('useStaffTicketInfo Hook', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-10T10:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null when staff has no active tickets', () => {
    store = createTestStore({
      uiTickets: {
        serviceTickets: [],
      },
    });

    const { result } = renderHook(() => useStaffTicketInfo(), {
      wrapper: createWrapper(store),
    });

    const ticketInfo = result.current('staff-1');
    expect(ticketInfo).toBeNull();
  });

  it('should return real client name from Redux serviceTickets', () => {
    const mockTicket = createMockServiceTicket({
      techId: 'staff-1',
      clientName: 'Sarah Johnson', // Real client name
      service: 'Gel Manicure', // Real service name
    });

    store = createTestStore({
      uiTickets: {
        serviceTickets: [mockTicket],
      },
    });

    const { result } = renderHook(() => useStaffTicketInfo(), {
      wrapper: createWrapper(store),
    });

    const ticketInfo = result.current('staff-1');

    // Verify real data is returned, NOT hardcoded mock data
    expect(ticketInfo).not.toBeNull();
    expect(ticketInfo?.activeTickets[0].clientName).toBe('Sarah Johnson');
    expect(ticketInfo?.activeTickets[0].serviceName).toBe('Gel Manicure');
    expect(ticketInfo?.currentTicketInfo?.clientName).toBe('Sarah Johnson');
    expect(ticketInfo?.currentTicketInfo?.serviceName).toBe('Gel Manicure');

    // Ensure we're NOT returning hardcoded test data
    expect(ticketInfo?.activeTickets[0].clientName).not.toBe('Test Client');
    expect(ticketInfo?.activeTickets[0].serviceName).not.toBe('Test Service');
  });

  it('should match tickets by techId field', () => {
    const mockTicket = createMockServiceTicket({
      techId: 'staff-123',
      clientName: 'TechId Match Client',
    });

    store = createTestStore({
      uiTickets: {
        serviceTickets: [mockTicket],
      },
    });

    const { result } = renderHook(() => useStaffTicketInfo(), {
      wrapper: createWrapper(store),
    });

    const ticketInfo = result.current('staff-123');

    expect(ticketInfo).not.toBeNull();
    expect(ticketInfo?.activeTickets[0].clientName).toBe('TechId Match Client');
  });

  it('should match tickets by assignedTo.id field', () => {
    const mockTicket = createMockServiceTicket({
      techId: undefined, // No techId
      assignedTo: {
        id: 'staff-456',
        name: 'Bob',
        color: '#ff0000',
      },
      clientName: 'AssignedTo Match Client',
    });

    store = createTestStore({
      uiTickets: {
        serviceTickets: [mockTicket],
      },
    });

    const { result } = renderHook(() => useStaffTicketInfo(), {
      wrapper: createWrapper(store),
    });

    const ticketInfo = result.current('staff-456');

    expect(ticketInfo).not.toBeNull();
    expect(ticketInfo?.activeTickets[0].clientName).toBe('AssignedTo Match Client');
  });

  it('should handle both string and number staff IDs', () => {
    const mockTicket = createMockServiceTicket({
      techId: '789',
      clientName: 'Numeric ID Client',
    });

    store = createTestStore({
      uiTickets: {
        serviceTickets: [mockTicket],
      },
    });

    const { result } = renderHook(() => useStaffTicketInfo(), {
      wrapper: createWrapper(store),
    });

    // Test with number
    const ticketInfoNum = result.current(789);
    expect(ticketInfoNum).not.toBeNull();
    expect(ticketInfoNum?.activeTickets[0].clientName).toBe('Numeric ID Client');

    // Test with string
    const ticketInfoStr = result.current('789');
    expect(ticketInfoStr).not.toBeNull();
    expect(ticketInfoStr?.activeTickets[0].clientName).toBe('Numeric ID Client');
  });

  it('should return multiple active tickets for staff with multiple services', () => {
    const ticket1 = createMockServiceTicket({
      id: 'ticket-1',
      techId: 'staff-1',
      clientName: 'Client One',
      service: 'Service One',
    });

    const ticket2 = createMockServiceTicket({
      id: 'ticket-2',
      techId: 'staff-1',
      clientName: 'Client Two',
      service: 'Service Two',
    });

    store = createTestStore({
      uiTickets: {
        serviceTickets: [ticket1, ticket2],
      },
    });

    const { result } = renderHook(() => useStaffTicketInfo(), {
      wrapper: createWrapper(store),
    });

    const ticketInfo = result.current('staff-1');

    expect(ticketInfo).not.toBeNull();
    expect(ticketInfo?.activeTickets).toHaveLength(2);
    expect(ticketInfo?.activeTickets[0].clientName).toBe('Client One');
    expect(ticketInfo?.activeTickets[1].clientName).toBe('Client Two');
  });

  it('should calculate progress based on elapsed time', () => {
    // Set up a ticket that started 15 minutes ago with 30 min duration
    const startTime = new Date('2024-02-10T10:15:00'); // 15 min before current time

    const mockTicket = createMockServiceTicket({
      techId: 'staff-1',
      duration: '30min',
      createdAt: startTime,
    });

    store = createTestStore({
      uiTickets: {
        serviceTickets: [mockTicket],
      },
    });

    const { result } = renderHook(() => useStaffTicketInfo(), {
      wrapper: createWrapper(store),
    });

    const ticketInfo = result.current('staff-1');

    expect(ticketInfo).not.toBeNull();
    // 15 min elapsed out of 30 min = 50% progress
    expect(ticketInfo?.currentTicketInfo?.progress).toBeCloseTo(0.5, 1);
    expect(ticketInfo?.currentTicketInfo?.timeLeft).toBeCloseTo(15, 0);
    expect(ticketInfo?.currentTicketInfo?.totalTime).toBe(30);
  });
});

describe('useStaffNextAppointment Hook', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-10T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return undefined when staff has no upcoming appointments', () => {
    store = createTestStore({
      appointments: {
        appointments: [],
      },
    });

    const { result } = renderHook(() => useStaffNextAppointment(), {
      wrapper: createWrapper(store),
    });

    const nextAppt = result.current('staff-1');
    expect(nextAppt).toBeUndefined();
  });

  it('should return real appointment time from Redux appointments', () => {
    // Create an appointment 2 hours from now
    const futureTime = new Date('2024-02-10T12:30:00'); // 12:30 PM

    const mockAppointment = createMockAppointment({
      staffId: 'staff-1',
      scheduledStartTime: futureTime.toISOString(),
      status: 'scheduled',
    });

    store = createTestStore({
      appointments: {
        appointments: [mockAppointment],
      },
    });

    const { result } = renderHook(() => useStaffNextAppointment(), {
      wrapper: createWrapper(store),
    });

    const nextAppt = result.current('staff-1');

    // Should return formatted time, NOT hardcoded mock
    expect(nextAppt).toBeDefined();
    expect(nextAppt).toMatch(/12:30.*PM/i);
    expect(nextAppt).not.toBe('10:30 AM'); // Not hardcoded mock time
    expect(nextAppt).not.toBe('2:00 PM'); // Not hardcoded mock time
  });

  it('should return earliest appointment when multiple exist', () => {
    const appointment1 = createMockAppointment({
      id: 'apt-1',
      staffId: 'staff-1',
      scheduledStartTime: new Date('2024-02-10T14:00:00').toISOString(), // 2 PM
      status: 'scheduled',
    });

    const appointment2 = createMockAppointment({
      id: 'apt-2',
      staffId: 'staff-1',
      scheduledStartTime: new Date('2024-02-10T11:00:00').toISOString(), // 11 AM (earlier)
      status: 'confirmed',
    });

    store = createTestStore({
      appointments: {
        appointments: [appointment1, appointment2],
      },
    });

    const { result } = renderHook(() => useStaffNextAppointment(), {
      wrapper: createWrapper(store),
    });

    const nextAppt = result.current('staff-1');

    // Should return the earlier appointment (11 AM)
    expect(nextAppt).toMatch(/11:00.*AM/i);
  });

  it('should filter out past appointments', () => {
    const pastAppointment = createMockAppointment({
      id: 'apt-past',
      staffId: 'staff-1',
      scheduledStartTime: new Date('2024-02-10T09:00:00').toISOString(), // 9 AM (past)
      status: 'scheduled',
    });

    const futureAppointment = createMockAppointment({
      id: 'apt-future',
      staffId: 'staff-1',
      scheduledStartTime: new Date('2024-02-10T15:00:00').toISOString(), // 3 PM (future)
      status: 'scheduled',
    });

    store = createTestStore({
      appointments: {
        appointments: [pastAppointment, futureAppointment],
      },
    });

    const { result } = renderHook(() => useStaffNextAppointment(), {
      wrapper: createWrapper(store),
    });

    const nextAppt = result.current('staff-1');

    // Should return the future appointment only
    expect(nextAppt).toMatch(/3:00.*PM/i);
    expect(nextAppt).not.toMatch(/9:00.*AM/i);
  });

  it('should only include scheduled/confirmed/pending appointments', () => {
    const cancelledAppt = createMockAppointment({
      id: 'apt-cancelled',
      staffId: 'staff-1',
      scheduledStartTime: new Date('2024-02-10T11:00:00').toISOString(),
      status: 'cancelled',
    });

    const scheduledAppt = createMockAppointment({
      id: 'apt-scheduled',
      staffId: 'staff-1',
      scheduledStartTime: new Date('2024-02-10T14:00:00').toISOString(),
      status: 'scheduled',
    });

    store = createTestStore({
      appointments: {
        appointments: [cancelledAppt, scheduledAppt],
      },
    });

    const { result } = renderHook(() => useStaffNextAppointment(), {
      wrapper: createWrapper(store),
    });

    const nextAppt = result.current('staff-1');

    // Should return the scheduled appointment, not cancelled
    expect(nextAppt).toMatch(/2:00.*PM/i);
  });
});

describe('useStaffLastServiceTime Hook', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-10T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return undefined when staff has no completed tickets', () => {
    store = createTestStore({
      uiTickets: {
        completedTickets: [],
      },
    });

    const { result } = renderHook(() => useStaffLastServiceTime(), {
      wrapper: createWrapper(store),
    });

    const lastService = result.current('staff-1');
    expect(lastService).toBeUndefined();
  });

  it('should return real last service time from Redux completedTickets', () => {
    const completedTime = new Date('2024-02-10T11:30:00'); // 11:30 AM

    const mockTicket = createMockCompletedTicket({
      techId: 'staff-1',
      updatedAt: completedTime,
    });

    store = createTestStore({
      uiTickets: {
        completedTickets: [mockTicket],
      },
    });

    const { result } = renderHook(() => useStaffLastServiceTime(), {
      wrapper: createWrapper(store),
    });

    const lastService = result.current('staff-1');

    // Should return formatted time, NOT hardcoded mock
    expect(lastService).toBeDefined();
    expect(lastService).toMatch(/11:30.*AM/i);
    expect(lastService).not.toBe('10:30 AM'); // Not hardcoded mock time
  });

  it('should return most recent completed ticket time', () => {
    const olderTicket = createMockCompletedTicket({
      id: 'ticket-old',
      techId: 'staff-1',
      updatedAt: new Date('2024-02-10T09:00:00'), // 9 AM
    });

    const newerTicket = createMockCompletedTicket({
      id: 'ticket-new',
      techId: 'staff-1',
      updatedAt: new Date('2024-02-10T11:00:00'), // 11 AM (more recent)
    });

    store = createTestStore({
      uiTickets: {
        completedTickets: [olderTicket, newerTicket],
      },
    });

    const { result } = renderHook(() => useStaffLastServiceTime(), {
      wrapper: createWrapper(store),
    });

    const lastService = result.current('staff-1');

    // Should return the more recent ticket time
    expect(lastService).toMatch(/11:00.*AM/i);
  });

  it('should match tickets by techId field', () => {
    const mockTicket = createMockCompletedTicket({
      techId: 'staff-specific',
      updatedAt: new Date('2024-02-10T10:45:00'),
    });

    store = createTestStore({
      uiTickets: {
        completedTickets: [mockTicket],
      },
    });

    const { result } = renderHook(() => useStaffLastServiceTime(), {
      wrapper: createWrapper(store),
    });

    const lastService = result.current('staff-specific');
    expect(lastService).toMatch(/10:45.*AM/i);

    // Different staff should return undefined
    const otherStaff = result.current('staff-other');
    expect(otherStaff).toBeUndefined();
  });

  it('should match tickets by assignedTo.id field', () => {
    const mockTicket = createMockCompletedTicket({
      techId: undefined,
      assignedTo: {
        id: 'assigned-staff',
        name: 'Assigned Person',
        color: '#0000ff',
      },
      updatedAt: new Date('2024-02-10T10:15:00'),
    });

    store = createTestStore({
      uiTickets: {
        completedTickets: [mockTicket],
      },
    });

    const { result } = renderHook(() => useStaffLastServiceTime(), {
      wrapper: createWrapper(store),
    });

    const lastService = result.current('assigned-staff');
    expect(lastService).toMatch(/10:15.*AM/i);
  });

  it('should use createdAt as fallback when updatedAt is not available', () => {
    const mockTicket = createMockCompletedTicket({
      techId: 'staff-1',
      updatedAt: undefined as unknown as Date,
      createdAt: new Date('2024-02-10T09:30:00'),
    });

    store = createTestStore({
      uiTickets: {
        completedTickets: [mockTicket],
      },
    });

    const { result } = renderHook(() => useStaffLastServiceTime(), {
      wrapper: createWrapper(store),
    });

    const lastService = result.current('staff-1');
    expect(lastService).toMatch(/9:30.*AM/i);
  });
});

describe('Integration: Staff Card Data Flow', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-10T11:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should provide complete staff card data from all hooks', () => {
    // Set up comprehensive state for a staff member
    const serviceTicket = createMockServiceTicket({
      techId: 'staff-1',
      clientName: 'Current Client',
      service: 'Manicure',
      createdAt: new Date('2024-02-10T10:30:00'), // Started 30 min ago
      duration: '60min',
    });

    const completedTicket = createMockCompletedTicket({
      techId: 'staff-1',
      updatedAt: new Date('2024-02-10T10:00:00'), // Completed at 10 AM
    });

    const appointment = createMockAppointment({
      staffId: 'staff-1',
      scheduledStartTime: new Date('2024-02-10T14:00:00').toISOString(), // 2 PM
      status: 'scheduled',
    });

    store = createTestStore({
      uiTickets: {
        serviceTickets: [serviceTicket],
        completedTickets: [completedTicket],
      },
      appointments: {
        appointments: [appointment],
      },
    });

    // Get all hooks' results
    const { result: ticketResult } = renderHook(() => useStaffTicketInfo(), {
      wrapper: createWrapper(store),
    });

    const { result: appointmentResult } = renderHook(() => useStaffNextAppointment(), {
      wrapper: createWrapper(store),
    });

    const { result: lastServiceResult } = renderHook(() => useStaffLastServiceTime(), {
      wrapper: createWrapper(store),
    });

    // Verify all data comes from Redux, not mock data
    const ticketInfo = ticketResult.current('staff-1');
    const nextAppt = appointmentResult.current('staff-1');
    const lastService = lastServiceResult.current('staff-1');

    // Active ticket info
    expect(ticketInfo).not.toBeNull();
    expect(ticketInfo?.activeTickets[0].clientName).toBe('Current Client');
    expect(ticketInfo?.activeTickets[0].serviceName).toBe('Manicure');

    // Next appointment
    expect(nextAppt).toMatch(/2:00.*PM/i);

    // Last service time
    expect(lastService).toMatch(/10:00.*AM/i);

    // Verify we're NOT returning hardcoded mock values from old code
    // The data comes from our Redux state, not from fallback strings
    expect(ticketInfo?.activeTickets[0].clientName).not.toBe('Test Client');
    // nextAppt is correctly '2:00 PM' since that's the time we set in the mock appointment
    // lastService is correctly '10:00 AM' since that's when we set the ticket as completed
    // These match our test data, confirming Redux data flow works correctly
  });

  it('should return empty states when no data exists', () => {
    store = createTestStore({
      uiTickets: {
        serviceTickets: [],
        completedTickets: [],
      },
      appointments: {
        appointments: [],
      },
    });

    const { result: ticketResult } = renderHook(() => useStaffTicketInfo(), {
      wrapper: createWrapper(store),
    });

    const { result: appointmentResult } = renderHook(() => useStaffNextAppointment(), {
      wrapper: createWrapper(store),
    });

    const { result: lastServiceResult } = renderHook(() => useStaffLastServiceTime(), {
      wrapper: createWrapper(store),
    });

    // All should return empty/null, NOT mock data
    expect(ticketResult.current('staff-1')).toBeNull();
    expect(appointmentResult.current('staff-1')).toBeUndefined();
    expect(lastServiceResult.current('staff-1')).toBeUndefined();
  });
});
