/**
 * Ticket Utilities Unit Tests
 * Tests for ticket-related utility functions used in Front Desk
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================
// TICKET STATUS TRANSITIONS
// ============================================

type TicketStatus = 'pending' | 'waiting' | 'in-service' | 'completed' | 'cancelled';

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  'pending': ['waiting', 'in-service', 'cancelled'],
  'waiting': ['in-service', 'cancelled'],
  'in-service': ['completed', 'cancelled'],
  'completed': [], // Terminal state
  'cancelled': [], // Terminal state
};

function isValidTransition(from: TicketStatus, to: TicketStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

function transitionTicketStatus(currentStatus: TicketStatus, newStatus: TicketStatus): TicketStatus {
  if (!isValidTransition(currentStatus, newStatus)) {
    throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
  }
  return newStatus;
}

describe('Ticket Status Transitions', () => {
  describe('isValidTransition', () => {
    it('should allow pending → waiting', () => {
      expect(isValidTransition('pending', 'waiting')).toBe(true);
    });

    it('should allow pending → in-service', () => {
      expect(isValidTransition('pending', 'in-service')).toBe(true);
    });

    it('should allow pending → cancelled', () => {
      expect(isValidTransition('pending', 'cancelled')).toBe(true);
    });

    it('should allow waiting → in-service', () => {
      expect(isValidTransition('waiting', 'in-service')).toBe(true);
    });

    it('should allow waiting → cancelled', () => {
      expect(isValidTransition('waiting', 'cancelled')).toBe(true);
    });

    it('should allow in-service → completed', () => {
      expect(isValidTransition('in-service', 'completed')).toBe(true);
    });

    it('should allow in-service → cancelled', () => {
      expect(isValidTransition('in-service', 'cancelled')).toBe(true);
    });

    it('should NOT allow completed → any state', () => {
      expect(isValidTransition('completed', 'pending')).toBe(false);
      expect(isValidTransition('completed', 'waiting')).toBe(false);
      expect(isValidTransition('completed', 'in-service')).toBe(false);
      expect(isValidTransition('completed', 'cancelled')).toBe(false);
    });

    it('should NOT allow cancelled → any state', () => {
      expect(isValidTransition('cancelled', 'pending')).toBe(false);
      expect(isValidTransition('cancelled', 'waiting')).toBe(false);
      expect(isValidTransition('cancelled', 'in-service')).toBe(false);
      expect(isValidTransition('cancelled', 'completed')).toBe(false);
    });

    it('should NOT allow backwards transitions', () => {
      expect(isValidTransition('waiting', 'pending')).toBe(false);
      expect(isValidTransition('in-service', 'waiting')).toBe(false);
      expect(isValidTransition('in-service', 'pending')).toBe(false);
    });
  });

  describe('transitionTicketStatus', () => {
    it('should return new status for valid transition', () => {
      expect(transitionTicketStatus('pending', 'waiting')).toBe('waiting');
      expect(transitionTicketStatus('waiting', 'in-service')).toBe('in-service');
      expect(transitionTicketStatus('in-service', 'completed')).toBe('completed');
    });

    it('should throw error for invalid transition', () => {
      expect(() => transitionTicketStatus('completed', 'pending')).toThrow('Invalid transition');
      expect(() => transitionTicketStatus('waiting', 'pending')).toThrow('Invalid transition');
    });
  });
});

// ============================================
// WAIT TIME CALCULATIONS
// ============================================

interface WaitListItem {
  id: string;
  createdAt: string;
  clientName: string;
}

function calculateWaitTime(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return Math.floor((now - created) / 60000); // Returns minutes
}

function calculateAverageWaitTime(waitlist: WaitListItem[]): number {
  if (waitlist.length === 0) return 0;
  const totalMinutes = waitlist.reduce((sum, item) => {
    return sum + calculateWaitTime(item.createdAt);
  }, 0);
  return Math.round(totalMinutes / waitlist.length);
}

function hasLongWait(waitlist: WaitListItem[], thresholdMinutes = 20): boolean {
  return waitlist.some(item => calculateWaitTime(item.createdAt) > thresholdMinutes);
}

function formatWaitTime(minutes: number): string {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

describe('Wait Time Calculations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-10T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateWaitTime', () => {
    it('should return 0 for just created item', () => {
      const createdAt = new Date().toISOString();
      expect(calculateWaitTime(createdAt)).toBe(0);
    });

    it('should return correct minutes for past time', () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60000).toISOString();
      expect(calculateWaitTime(thirtyMinutesAgo)).toBe(30);
    });

    it('should return correct minutes for hours', () => {
      const twoHoursAgo = new Date(Date.now() - 120 * 60000).toISOString();
      expect(calculateWaitTime(twoHoursAgo)).toBe(120);
    });
  });

  describe('calculateAverageWaitTime', () => {
    it('should return 0 for empty waitlist', () => {
      expect(calculateAverageWaitTime([])).toBe(0);
    });

    it('should calculate average correctly', () => {
      const waitlist: WaitListItem[] = [
        { id: '1', createdAt: new Date(Date.now() - 10 * 60000).toISOString(), clientName: 'A' },
        { id: '2', createdAt: new Date(Date.now() - 20 * 60000).toISOString(), clientName: 'B' },
        { id: '3', createdAt: new Date(Date.now() - 30 * 60000).toISOString(), clientName: 'C' },
      ];
      // Average of 10, 20, 30 = 20
      expect(calculateAverageWaitTime(waitlist)).toBe(20);
    });

    it('should round to nearest minute', () => {
      const waitlist: WaitListItem[] = [
        { id: '1', createdAt: new Date(Date.now() - 10 * 60000).toISOString(), clientName: 'A' },
        { id: '2', createdAt: new Date(Date.now() - 15 * 60000).toISOString(), clientName: 'B' },
      ];
      // Average of 10, 15 = 12.5 → rounds to 13
      expect(calculateAverageWaitTime(waitlist)).toBe(13);
    });
  });

  describe('hasLongWait', () => {
    it('should return false for empty waitlist', () => {
      expect(hasLongWait([])).toBe(false);
    });

    it('should return false when all waits are under threshold', () => {
      const waitlist: WaitListItem[] = [
        { id: '1', createdAt: new Date(Date.now() - 10 * 60000).toISOString(), clientName: 'A' },
        { id: '2', createdAt: new Date(Date.now() - 15 * 60000).toISOString(), clientName: 'B' },
      ];
      expect(hasLongWait(waitlist, 20)).toBe(false);
    });

    it('should return true when any wait exceeds threshold', () => {
      const waitlist: WaitListItem[] = [
        { id: '1', createdAt: new Date(Date.now() - 10 * 60000).toISOString(), clientName: 'A' },
        { id: '2', createdAt: new Date(Date.now() - 25 * 60000).toISOString(), clientName: 'B' },
      ];
      expect(hasLongWait(waitlist, 20)).toBe(true);
    });

    it('should use custom threshold', () => {
      const waitlist: WaitListItem[] = [
        { id: '1', createdAt: new Date(Date.now() - 35 * 60000).toISOString(), clientName: 'A' },
      ];
      expect(hasLongWait(waitlist, 30)).toBe(true);
      expect(hasLongWait(waitlist, 40)).toBe(false);
    });
  });

  describe('formatWaitTime', () => {
    it('should return "Just now" for 0 minutes', () => {
      expect(formatWaitTime(0)).toBe('Just now');
    });

    it('should return minutes format for < 60 minutes', () => {
      expect(formatWaitTime(5)).toBe('5m');
      expect(formatWaitTime(30)).toBe('30m');
      expect(formatWaitTime(59)).toBe('59m');
    });

    it('should return hours format for >= 60 minutes', () => {
      expect(formatWaitTime(60)).toBe('1h');
      expect(formatWaitTime(120)).toBe('2h');
    });

    it('should return hours and minutes format', () => {
      expect(formatWaitTime(90)).toBe('1h 30m');
      expect(formatWaitTime(150)).toBe('2h 30m');
    });
  });
});

// ============================================
// TICKET SORTING
// ============================================

interface SortableTicket {
  id: string;
  createdAt: string;
  queuePosition?: number;
  status: TicketStatus;
}

function sortByTime(tickets: SortableTicket[]): SortableTicket[] {
  return [...tickets].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function sortByQueue(tickets: SortableTicket[]): SortableTicket[] {
  return [...tickets].sort((a, b) => 
    (a.queuePosition ?? Infinity) - (b.queuePosition ?? Infinity)
  );
}

function filterByStatus(tickets: SortableTicket[], status: TicketStatus): SortableTicket[] {
  return tickets.filter(t => t.status === status);
}

describe('Ticket Sorting', () => {
  const mockTickets: SortableTicket[] = [
    { id: '3', createdAt: '2024-02-10T10:30:00', queuePosition: 3, status: 'waiting' },
    { id: '1', createdAt: '2024-02-10T10:00:00', queuePosition: 1, status: 'waiting' },
    { id: '2', createdAt: '2024-02-10T10:15:00', queuePosition: 2, status: 'in-service' },
  ];

  describe('sortByTime', () => {
    it('should sort tickets by creation time (oldest first)', () => {
      const sorted = sortByTime(mockTickets);
      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });

    it('should not mutate original array', () => {
      const original = [...mockTickets];
      sortByTime(mockTickets);
      expect(mockTickets).toEqual(original);
    });
  });

  describe('sortByQueue', () => {
    it('should sort tickets by queue position', () => {
      const sorted = sortByQueue(mockTickets);
      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });

    it('should handle tickets without queue position', () => {
      const ticketsWithMissing: SortableTicket[] = [
        { id: '1', createdAt: '2024-02-10T10:00:00', queuePosition: 1, status: 'waiting' },
        { id: '2', createdAt: '2024-02-10T10:15:00', status: 'waiting' }, // No position
        { id: '3', createdAt: '2024-02-10T10:30:00', queuePosition: 2, status: 'waiting' },
      ];
      const sorted = sortByQueue(ticketsWithMissing);
      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('2'); // No position goes to end
    });
  });

  describe('filterByStatus', () => {
    it('should filter tickets by status', () => {
      const waiting = filterByStatus(mockTickets, 'waiting');
      expect(waiting).toHaveLength(2);
      expect(waiting.every(t => t.status === 'waiting')).toBe(true);
    });

    it('should return empty array if no matches', () => {
      const completed = filterByStatus(mockTickets, 'completed');
      expect(completed).toHaveLength(0);
    });
  });
});

// ============================================
// TICKET ASSIGNMENT LOGIC
// ============================================

interface AssignableStaff {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'on-break';
  serviceCountToday: number;
  revenueToday: number;
}

function getAvailableStaff(staff: AssignableStaff[]): AssignableStaff[] {
  return staff.filter(s => s.status === 'available');
}

function getNextByRotation(staff: AssignableStaff[], lastAssignedId?: string): AssignableStaff | null {
  const available = getAvailableStaff(staff);
  if (available.length === 0) return null;
  
  if (!lastAssignedId) return available[0];
  
  const lastIndex = available.findIndex(s => s.id === lastAssignedId);
  const nextIndex = (lastIndex + 1) % available.length;
  return available[nextIndex];
}

function getNextByServiceCount(staff: AssignableStaff[]): AssignableStaff | null {
  const available = getAvailableStaff(staff);
  if (available.length === 0) return null;
  
  return available.reduce((lowest, current) => 
    current.serviceCountToday < lowest.serviceCountToday ? current : lowest
  );
}

function getNextByRevenue(staff: AssignableStaff[]): AssignableStaff | null {
  const available = getAvailableStaff(staff);
  if (available.length === 0) return null;
  
  return available.reduce((lowest, current) => 
    current.revenueToday < lowest.revenueToday ? current : lowest
  );
}

describe('Ticket Assignment Logic', () => {
  const mockStaff: AssignableStaff[] = [
    { id: 'staff-1', name: 'Alice', status: 'available', serviceCountToday: 5, revenueToday: 500 },
    { id: 'staff-2', name: 'Bob', status: 'busy', serviceCountToday: 3, revenueToday: 300 },
    { id: 'staff-3', name: 'Charlie', status: 'available', serviceCountToday: 2, revenueToday: 200 },
    { id: 'staff-4', name: 'Diana', status: 'on-break', serviceCountToday: 4, revenueToday: 400 },
  ];

  describe('getAvailableStaff', () => {
    it('should return only available staff', () => {
      const available = getAvailableStaff(mockStaff);
      expect(available).toHaveLength(2);
      expect(available.map(s => s.name)).toEqual(['Alice', 'Charlie']);
    });

    it('should return empty array if no one available', () => {
      const allBusy: AssignableStaff[] = [
        { id: 'staff-1', name: 'Alice', status: 'busy', serviceCountToday: 5, revenueToday: 500 },
      ];
      expect(getAvailableStaff(allBusy)).toHaveLength(0);
    });
  });

  describe('getNextByRotation', () => {
    it('should return first available if no last assigned', () => {
      const next = getNextByRotation(mockStaff);
      expect(next?.name).toBe('Alice');
    });

    it('should return next in rotation after last assigned', () => {
      const next = getNextByRotation(mockStaff, 'staff-1');
      expect(next?.name).toBe('Charlie');
    });

    it('should wrap around to beginning', () => {
      const next = getNextByRotation(mockStaff, 'staff-3');
      expect(next?.name).toBe('Alice');
    });

    it('should return null if no available staff', () => {
      const allBusy: AssignableStaff[] = [
        { id: 'staff-1', name: 'Alice', status: 'busy', serviceCountToday: 5, revenueToday: 500 },
      ];
      expect(getNextByRotation(allBusy)).toBeNull();
    });
  });

  describe('getNextByServiceCount', () => {
    it('should return staff with lowest service count', () => {
      const next = getNextByServiceCount(mockStaff);
      expect(next?.name).toBe('Charlie'); // Has 2 services
    });

    it('should only consider available staff', () => {
      // Bob has lowest count (3) but is busy
      // Charlie has 2 and is available
      const next = getNextByServiceCount(mockStaff);
      expect(next?.name).toBe('Charlie');
    });

    it('should return null if no available staff', () => {
      const allBusy: AssignableStaff[] = [
        { id: 'staff-1', name: 'Alice', status: 'busy', serviceCountToday: 5, revenueToday: 500 },
      ];
      expect(getNextByServiceCount(allBusy)).toBeNull();
    });
  });

  describe('getNextByRevenue', () => {
    it('should return staff with lowest revenue', () => {
      const next = getNextByRevenue(mockStaff);
      expect(next?.name).toBe('Charlie'); // Has $200
    });

    it('should only consider available staff', () => {
      const next = getNextByRevenue(mockStaff);
      expect(next?.name).toBe('Charlie');
    });

    it('should return null if no available staff', () => {
      const allBusy: AssignableStaff[] = [
        { id: 'staff-1', name: 'Alice', status: 'busy', serviceCountToday: 5, revenueToday: 500 },
      ];
      expect(getNextByRevenue(allBusy)).toBeNull();
    });
  });
});
