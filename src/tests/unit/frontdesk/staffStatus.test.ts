/**
 * Staff Status Unit Tests
 * Tests for staff status management in Front Desk module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================
// STAFF STATUS TYPES
// ============================================

type StaffStatus = 'available' | 'busy' | 'on-break' | 'clocked-out';

interface StaffMember {
  id: string;
  name: string;
  status: StaffStatus;
  clockedInAt?: string;
  clockedOutAt?: string;
  breakStartedAt?: string;
  currentTicketId?: string;
}

// ============================================
// STAFF STATUS TRANSITIONS
// ============================================

const VALID_STATUS_TRANSITIONS: Record<StaffStatus, StaffStatus[]> = {
  'clocked-out': ['available'],
  'available': ['busy', 'on-break', 'clocked-out'],
  'busy': ['available', 'on-break'],
  'on-break': ['available', 'clocked-out'],
};

function isValidStatusTransition(from: StaffStatus, to: StaffStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

function transitionStaffStatus(staff: StaffMember, newStatus: StaffStatus): StaffMember {
  if (!isValidStatusTransition(staff.status, newStatus)) {
    throw new Error(`Invalid status transition from ${staff.status} to ${newStatus}`);
  }
  
  const now = new Date().toISOString();
  const updates: Partial<StaffMember> = { status: newStatus };
  
  switch (newStatus) {
    case 'available':
      if (staff.status === 'clocked-out') {
        updates.clockedInAt = now;
        updates.clockedOutAt = undefined;
      }
      updates.breakStartedAt = undefined;
      updates.currentTicketId = undefined;
      break;
    case 'busy':
      // currentTicketId should be set separately
      break;
    case 'on-break':
      updates.breakStartedAt = now;
      updates.currentTicketId = undefined;
      break;
    case 'clocked-out':
      updates.clockedOutAt = now;
      updates.breakStartedAt = undefined;
      updates.currentTicketId = undefined;
      break;
  }
  
  return { ...staff, ...updates };
}

describe('Staff Status Transitions', () => {
  describe('isValidStatusTransition', () => {
    // From clocked-out
    it('should allow clocked-out → available (clock in)', () => {
      expect(isValidStatusTransition('clocked-out', 'available')).toBe(true);
    });

    it('should NOT allow clocked-out → busy', () => {
      expect(isValidStatusTransition('clocked-out', 'busy')).toBe(false);
    });

    it('should NOT allow clocked-out → on-break', () => {
      expect(isValidStatusTransition('clocked-out', 'on-break')).toBe(false);
    });

    // From available
    it('should allow available → busy', () => {
      expect(isValidStatusTransition('available', 'busy')).toBe(true);
    });

    it('should allow available → on-break', () => {
      expect(isValidStatusTransition('available', 'on-break')).toBe(true);
    });

    it('should allow available → clocked-out', () => {
      expect(isValidStatusTransition('available', 'clocked-out')).toBe(true);
    });

    // From busy
    it('should allow busy → available', () => {
      expect(isValidStatusTransition('busy', 'available')).toBe(true);
    });

    it('should allow busy → on-break', () => {
      expect(isValidStatusTransition('busy', 'on-break')).toBe(true);
    });

    it('should NOT allow busy → clocked-out directly', () => {
      expect(isValidStatusTransition('busy', 'clocked-out')).toBe(false);
    });

    // From on-break
    it('should allow on-break → available', () => {
      expect(isValidStatusTransition('on-break', 'available')).toBe(true);
    });

    it('should allow on-break → clocked-out', () => {
      expect(isValidStatusTransition('on-break', 'clocked-out')).toBe(true);
    });

    it('should NOT allow on-break → busy directly', () => {
      expect(isValidStatusTransition('on-break', 'busy')).toBe(false);
    });
  });

  describe('transitionStaffStatus', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-02-10T10:00:00Z')); // Use UTC
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should clock in staff (clocked-out → available)', () => {
      const staff: StaffMember = {
        id: 'staff-1',
        name: 'Alice',
        status: 'clocked-out',
      };
      
      const result = transitionStaffStatus(staff, 'available');
      
      expect(result.status).toBe('available');
      expect(result.clockedInAt).toBeDefined();
      expect(result.clockedOutAt).toBeUndefined();
    });

    it('should start break (available → on-break)', () => {
      const staff: StaffMember = {
        id: 'staff-1',
        name: 'Alice',
        status: 'available',
        clockedInAt: '2024-02-10T09:00:00.000Z',
      };
      
      const result = transitionStaffStatus(staff, 'on-break');
      
      expect(result.status).toBe('on-break');
      expect(result.breakStartedAt).toBeDefined();
    });

    it('should end break (on-break → available)', () => {
      const staff: StaffMember = {
        id: 'staff-1',
        name: 'Alice',
        status: 'on-break',
        clockedInAt: '2024-02-10T09:00:00.000Z',
        breakStartedAt: '2024-02-10T09:30:00.000Z',
      };
      
      const result = transitionStaffStatus(staff, 'available');
      
      expect(result.status).toBe('available');
      expect(result.breakStartedAt).toBeUndefined();
    });

    it('should clock out staff (available → clocked-out)', () => {
      const staff: StaffMember = {
        id: 'staff-1',
        name: 'Alice',
        status: 'available',
        clockedInAt: '2024-02-10T09:00:00.000Z',
      };
      
      const result = transitionStaffStatus(staff, 'clocked-out');
      
      expect(result.status).toBe('clocked-out');
      expect(result.clockedOutAt).toBeDefined();
    });

    it('should clear currentTicketId when going on break', () => {
      const staff: StaffMember = {
        id: 'staff-1',
        name: 'Alice',
        status: 'busy',
        clockedInAt: '2024-02-10T09:00:00.000Z',
        currentTicketId: 'ticket-123',
      };
      
      const result = transitionStaffStatus(staff, 'on-break');
      
      expect(result.currentTicketId).toBeUndefined();
    });

    it('should throw error for invalid transition', () => {
      const staff: StaffMember = {
        id: 'staff-1',
        name: 'Alice',
        status: 'clocked-out',
      };
      
      expect(() => transitionStaffStatus(staff, 'busy')).toThrow('Invalid status transition');
    });
  });
});

// ============================================
// STAFF AVAILABILITY CALCULATIONS
// ============================================

function getAvailableCount(staff: StaffMember[]): number {
  return staff.filter(s => s.status === 'available').length;
}

function getBusyCount(staff: StaffMember[]): number {
  return staff.filter(s => s.status === 'busy').length;
}

function getOnBreakCount(staff: StaffMember[]): number {
  return staff.filter(s => s.status === 'on-break').length;
}

function getClockedInCount(staff: StaffMember[]): number {
  return staff.filter(s => s.status !== 'clocked-out').length;
}

function getStaffByStatus(staff: StaffMember[], status: StaffStatus): StaffMember[] {
  return staff.filter(s => s.status === status);
}

describe('Staff Availability Calculations', () => {
  const mockStaff: StaffMember[] = [
    { id: 'staff-1', name: 'Alice', status: 'available' },
    { id: 'staff-2', name: 'Bob', status: 'busy', currentTicketId: 'ticket-1' },
    { id: 'staff-3', name: 'Charlie', status: 'available' },
    { id: 'staff-4', name: 'Diana', status: 'on-break' },
    { id: 'staff-5', name: 'Eve', status: 'clocked-out' },
    { id: 'staff-6', name: 'Frank', status: 'busy', currentTicketId: 'ticket-2' },
  ];

  describe('getAvailableCount', () => {
    it('should return count of available staff', () => {
      expect(getAvailableCount(mockStaff)).toBe(2);
    });

    it('should return 0 for empty array', () => {
      expect(getAvailableCount([])).toBe(0);
    });
  });

  describe('getBusyCount', () => {
    it('should return count of busy staff', () => {
      expect(getBusyCount(mockStaff)).toBe(2);
    });
  });

  describe('getOnBreakCount', () => {
    it('should return count of staff on break', () => {
      expect(getOnBreakCount(mockStaff)).toBe(1);
    });
  });

  describe('getClockedInCount', () => {
    it('should return count of all clocked-in staff', () => {
      // All except clocked-out (Eve)
      expect(getClockedInCount(mockStaff)).toBe(5);
    });
  });

  describe('getStaffByStatus', () => {
    it('should filter staff by status', () => {
      const available = getStaffByStatus(mockStaff, 'available');
      expect(available).toHaveLength(2);
      expect(available.map(s => s.name)).toEqual(['Alice', 'Charlie']);
    });

    it('should return empty array if no matches', () => {
      const allAvailable: StaffMember[] = [
        { id: 'staff-1', name: 'Alice', status: 'available' },
      ];
      expect(getStaffByStatus(allAvailable, 'busy')).toHaveLength(0);
    });
  });
});

// ============================================
// BREAK TIME CALCULATIONS
// ============================================

function calculateBreakDuration(breakStartedAt: string): number {
  const start = new Date(breakStartedAt).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 60000); // Returns minutes
}

function isBreakOverdue(breakStartedAt: string, maxBreakMinutes: number = 15): boolean {
  return calculateBreakDuration(breakStartedAt) > maxBreakMinutes;
}

function formatBreakTime(minutes: number): string {
  if (minutes < 1) return 'Just started';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

describe('Break Time Calculations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-10T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateBreakDuration', () => {
    it('should return 0 for just started break', () => {
      const breakStartedAt = new Date().toISOString();
      expect(calculateBreakDuration(breakStartedAt)).toBe(0);
    });

    it('should return correct minutes', () => {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60000).toISOString();
      expect(calculateBreakDuration(fifteenMinutesAgo)).toBe(15);
    });
  });

  describe('isBreakOverdue', () => {
    it('should return false for break under limit', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60000).toISOString();
      expect(isBreakOverdue(tenMinutesAgo, 15)).toBe(false);
    });

    it('should return true for break over limit', () => {
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60000).toISOString();
      expect(isBreakOverdue(twentyMinutesAgo, 15)).toBe(true);
    });

    it('should use default 15 minute limit', () => {
      const sixteenMinutesAgo = new Date(Date.now() - 16 * 60000).toISOString();
      expect(isBreakOverdue(sixteenMinutesAgo)).toBe(true);
    });
  });

  describe('formatBreakTime', () => {
    it('should return "Just started" for 0 minutes', () => {
      expect(formatBreakTime(0)).toBe('Just started');
    });

    it('should return minutes format', () => {
      expect(formatBreakTime(10)).toBe('10 min');
      expect(formatBreakTime(45)).toBe('45 min');
    });

    it('should return hours format for 60+ minutes', () => {
      expect(formatBreakTime(60)).toBe('1h');
      expect(formatBreakTime(90)).toBe('1h 30m');
      expect(formatBreakTime(120)).toBe('2h');
    });
  });
});

// ============================================
// SHIFT DURATION CALCULATIONS
// ============================================

function calculateShiftDuration(clockedInAt: string, clockedOutAt?: string): number {
  const start = new Date(clockedInAt).getTime();
  const end = clockedOutAt ? new Date(clockedOutAt).getTime() : Date.now();
  return Math.floor((end - start) / 60000); // Returns minutes
}

function formatShiftDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

describe('Shift Duration Calculations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-10T14:00:00.000Z')); // Use UTC explicitly
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateShiftDuration', () => {
    it('should calculate duration for ongoing shift', () => {
      // Use a time that's definitely before the mocked "now" time
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
      const duration = calculateShiftDuration(fiveHoursAgo);
      expect(duration).toBe(300); // 5 hours = 300 minutes
    });

    it('should calculate duration for completed shift', () => {
      const clockedInAt = '2024-02-10T09:00:00.000Z';
      const clockedOutAt = '2024-02-10T17:00:00.000Z';
      // 9:00 to 17:00 = 8 hours = 480 minutes
      expect(calculateShiftDuration(clockedInAt, clockedOutAt)).toBe(480);
    });
  });

  describe('formatShiftDuration', () => {
    it('should format minutes only', () => {
      expect(formatShiftDuration(45)).toBe('45m');
    });

    it('should format hours only', () => {
      expect(formatShiftDuration(120)).toBe('2h');
    });

    it('should format hours and minutes', () => {
      expect(formatShiftDuration(150)).toBe('2h 30m');
      expect(formatShiftDuration(495)).toBe('8h 15m');
    });
  });
});
