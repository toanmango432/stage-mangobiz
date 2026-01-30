/**
 * Turn Calculations Unit Tests
 * Tests for turn queue calculation logic per PRD-Turn-Tracker-Module.md
 */

import { describe, it, expect } from 'vitest';

// ============================================
// TURN DATA TYPES (per PRD)
// ============================================

interface StaffTurnData {
  staffId: string;
  staffName: string;
  serviceTurn: number;      // Turns from completed services
  bonusTurn: number;        // Bonus turns (walk-in requests, appointments)
  adjustTurn: number;       // Manual adjustments (+/-)
  tardyTurn: number;        // Penalty turns for being late
  appointmentTurn: number;  // Turns from appointment services
  partialTurn: number;      // Partial turns (e.g., 0.5 for assisted services)
}

interface TurnSettings {
  mode: 'manual' | 'auto';
  orderingMethod: 'rotation' | 'service-count' | 'amount' | 'count-by-amount' | 'count-by-menu';
  appointmentBonus: number;
  walkInRequestBonus: number;
  tardyPenalty: number;
  amountPerTurn?: number;   // For count-by-amount method
}

// ============================================
// TURN CALCULATION FUNCTIONS
// ============================================

function calculateTotalTurn(data: StaffTurnData): number {
  return (
    data.serviceTurn +
    data.bonusTurn +
    data.adjustTurn -
    data.tardyTurn +
    data.appointmentTurn +
    data.partialTurn
  );
}

function calculateServiceTurn(completedServices: number): number {
  return completedServices;
}

function calculateBonusTurn(
  walkInRequests: number,
  appointments: number,
  settings: TurnSettings
): number {
  return (
    walkInRequests * settings.walkInRequestBonus +
    appointments * settings.appointmentBonus
  );
}

function calculateTardyTurn(
  tardyMinutes: number,
  settings: TurnSettings,
  tardyThreshold = 15
): number {
  if (tardyMinutes <= tardyThreshold) return 0;
  return settings.tardyPenalty;
}

function calculateAmountBasedTurn(
  totalAmount: number,
  amountPerTurn: number
): number {
  if (amountPerTurn <= 0) return 0;
  return Math.floor(totalAmount / amountPerTurn);
}

describe('Turn Calculations', () => {
  describe('calculateTotalTurn', () => {
    it('should sum all turn components correctly', () => {
      const data: StaffTurnData = {
        staffId: 'staff-1',
        staffName: 'Alice',
        serviceTurn: 5,
        bonusTurn: 2,
        adjustTurn: 1,
        tardyTurn: 0,
        appointmentTurn: 3,
        partialTurn: 0.5,
      };
      
      expect(calculateTotalTurn(data)).toBe(11.5);
    });

    it('should subtract tardy turns', () => {
      const data: StaffTurnData = {
        staffId: 'staff-1',
        staffName: 'Alice',
        serviceTurn: 5,
        bonusTurn: 0,
        adjustTurn: 0,
        tardyTurn: 2,
        appointmentTurn: 0,
        partialTurn: 0,
      };
      
      expect(calculateTotalTurn(data)).toBe(3);
    });

    it('should handle negative adjust turns', () => {
      const data: StaffTurnData = {
        staffId: 'staff-1',
        staffName: 'Alice',
        serviceTurn: 5,
        bonusTurn: 0,
        adjustTurn: -2, // Manager deducted 2 turns
        tardyTurn: 0,
        appointmentTurn: 0,
        partialTurn: 0,
      };
      
      expect(calculateTotalTurn(data)).toBe(3);
    });

    it('should handle all zeros', () => {
      const data: StaffTurnData = {
        staffId: 'staff-1',
        staffName: 'Alice',
        serviceTurn: 0,
        bonusTurn: 0,
        adjustTurn: 0,
        tardyTurn: 0,
        appointmentTurn: 0,
        partialTurn: 0,
      };
      
      expect(calculateTotalTurn(data)).toBe(0);
    });

    it('should handle partial turns correctly', () => {
      const data: StaffTurnData = {
        staffId: 'staff-1',
        staffName: 'Alice',
        serviceTurn: 3,
        bonusTurn: 0,
        adjustTurn: 0,
        tardyTurn: 0,
        appointmentTurn: 0,
        partialTurn: 0.25, // Assisted on a service
      };
      
      expect(calculateTotalTurn(data)).toBe(3.25);
    });
  });

  describe('calculateServiceTurn', () => {
    it('should return completed services count', () => {
      expect(calculateServiceTurn(5)).toBe(5);
      expect(calculateServiceTurn(0)).toBe(0);
      expect(calculateServiceTurn(10)).toBe(10);
    });
  });

  describe('calculateBonusTurn', () => {
    const settings: TurnSettings = {
      mode: 'auto',
      orderingMethod: 'rotation',
      appointmentBonus: 0.5,
      walkInRequestBonus: 1,
      tardyPenalty: 1,
    };

    it('should calculate walk-in request bonus', () => {
      expect(calculateBonusTurn(3, 0, settings)).toBe(3); // 3 * 1
    });

    it('should calculate appointment bonus', () => {
      expect(calculateBonusTurn(0, 4, settings)).toBe(2); // 4 * 0.5
    });

    it('should combine both bonuses', () => {
      expect(calculateBonusTurn(2, 4, settings)).toBe(4); // (2 * 1) + (4 * 0.5)
    });

    it('should return 0 for no bonuses', () => {
      expect(calculateBonusTurn(0, 0, settings)).toBe(0);
    });
  });

  describe('calculateTardyTurn', () => {
    const settings: TurnSettings = {
      mode: 'auto',
      orderingMethod: 'rotation',
      appointmentBonus: 0.5,
      walkInRequestBonus: 1,
      tardyPenalty: 1,
    };

    it('should return 0 for on-time arrival', () => {
      expect(calculateTardyTurn(0, settings)).toBe(0);
      expect(calculateTardyTurn(10, settings)).toBe(0);
      expect(calculateTardyTurn(15, settings)).toBe(0);
    });

    it('should return penalty for late arrival', () => {
      expect(calculateTardyTurn(16, settings)).toBe(1);
      expect(calculateTardyTurn(30, settings)).toBe(1);
    });

    it('should use custom threshold', () => {
      expect(calculateTardyTurn(10, settings, 5)).toBe(1); // 10 > 5
      expect(calculateTardyTurn(10, settings, 15)).toBe(0); // 10 <= 15
    });
  });

  describe('calculateAmountBasedTurn', () => {
    it('should calculate turns based on amount threshold', () => {
      expect(calculateAmountBasedTurn(100, 50)).toBe(2);
      expect(calculateAmountBasedTurn(150, 50)).toBe(3);
      expect(calculateAmountBasedTurn(175, 50)).toBe(3); // Floor
    });

    it('should return 0 for amount below threshold', () => {
      expect(calculateAmountBasedTurn(40, 50)).toBe(0);
    });

    it('should handle zero amount', () => {
      expect(calculateAmountBasedTurn(0, 50)).toBe(0);
    });

    it('should handle invalid amountPerTurn', () => {
      expect(calculateAmountBasedTurn(100, 0)).toBe(0);
      expect(calculateAmountBasedTurn(100, -50)).toBe(0);
    });
  });
});

// ============================================
// TURN ORDERING FUNCTIONS
// ============================================

function orderByRotation(
  staffTurns: StaffTurnData[],
  lastAssignedId?: string
): StaffTurnData[] {
  if (staffTurns.length === 0) return [];
  
  const sorted = [...staffTurns];
  if (!lastAssignedId) return sorted;
  
  const lastIndex = sorted.findIndex(s => s.staffId === lastAssignedId);
  if (lastIndex === -1) return sorted;
  
  // Rotate array so next person after lastAssigned is first
  return [...sorted.slice(lastIndex + 1), ...sorted.slice(0, lastIndex + 1)];
}

function orderByServiceCount(staffTurns: StaffTurnData[]): StaffTurnData[] {
  return [...staffTurns].sort((a, b) => 
    calculateTotalTurn(a) - calculateTotalTurn(b)
  );
}

function orderByAmount(
  staffTurns: StaffTurnData[],
  revenueMap: Map<string, number>
): StaffTurnData[] {
  return [...staffTurns].sort((a, b) => 
    (revenueMap.get(a.staffId) ?? 0) - (revenueMap.get(b.staffId) ?? 0)
  );
}

function getNextInQueue(
  staffTurns: StaffTurnData[],
  settings: TurnSettings,
  lastAssignedId?: string,
  revenueMap?: Map<string, number>
): StaffTurnData | null {
  if (staffTurns.length === 0) return null;
  
  let ordered: StaffTurnData[];
  
  switch (settings.orderingMethod) {
    case 'rotation':
      ordered = orderByRotation(staffTurns, lastAssignedId);
      break;
    case 'service-count':
      ordered = orderByServiceCount(staffTurns);
      break;
    case 'amount':
      ordered = orderByAmount(staffTurns, revenueMap ?? new Map());
      break;
    default:
      ordered = staffTurns;
  }
  
  return ordered[0] ?? null;
}

describe('Turn Ordering', () => {
  const mockStaffTurns: StaffTurnData[] = [
    {
      staffId: 'staff-1',
      staffName: 'Alice',
      serviceTurn: 5,
      bonusTurn: 0,
      adjustTurn: 0,
      tardyTurn: 0,
      appointmentTurn: 0,
      partialTurn: 0,
    },
    {
      staffId: 'staff-2',
      staffName: 'Bob',
      serviceTurn: 3,
      bonusTurn: 0,
      adjustTurn: 0,
      tardyTurn: 0,
      appointmentTurn: 0,
      partialTurn: 0,
    },
    {
      staffId: 'staff-3',
      staffName: 'Charlie',
      serviceTurn: 7,
      bonusTurn: 0,
      adjustTurn: 0,
      tardyTurn: 0,
      appointmentTurn: 0,
      partialTurn: 0,
    },
  ];

  describe('orderByRotation', () => {
    it('should return original order if no lastAssignedId', () => {
      const ordered = orderByRotation(mockStaffTurns);
      expect(ordered.map(s => s.staffName)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should rotate to next person after lastAssigned', () => {
      const ordered = orderByRotation(mockStaffTurns, 'staff-1');
      expect(ordered.map(s => s.staffName)).toEqual(['Bob', 'Charlie', 'Alice']);
    });

    it('should wrap around correctly', () => {
      const ordered = orderByRotation(mockStaffTurns, 'staff-3');
      expect(ordered.map(s => s.staffName)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should handle unknown lastAssignedId', () => {
      const ordered = orderByRotation(mockStaffTurns, 'unknown');
      expect(ordered.map(s => s.staffName)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should handle empty array', () => {
      expect(orderByRotation([])).toEqual([]);
    });
  });

  describe('orderByServiceCount', () => {
    it('should order by total turns (lowest first)', () => {
      const ordered = orderByServiceCount(mockStaffTurns);
      expect(ordered.map(s => s.staffName)).toEqual(['Bob', 'Alice', 'Charlie']);
    });

    it('should handle equal counts', () => {
      const equalTurns: StaffTurnData[] = [
        { ...mockStaffTurns[0], serviceTurn: 5 },
        { ...mockStaffTurns[1], serviceTurn: 5 },
      ];
      const ordered = orderByServiceCount(equalTurns);
      // Should maintain relative order for equal values
      expect(ordered).toHaveLength(2);
    });
  });

  describe('orderByAmount', () => {
    it('should order by revenue (lowest first)', () => {
      const revenueMap = new Map([
        ['staff-1', 500],
        ['staff-2', 300],
        ['staff-3', 700],
      ]);
      const ordered = orderByAmount(mockStaffTurns, revenueMap);
      expect(ordered.map(s => s.staffName)).toEqual(['Bob', 'Alice', 'Charlie']);
    });

    it('should handle missing revenue data', () => {
      const revenueMap = new Map([
        ['staff-1', 500],
      ]);
      const ordered = orderByAmount(mockStaffTurns, revenueMap);
      // Staff without revenue data should be treated as 0
      expect(ordered[0].staffName).toBe('Bob'); // 0
      expect(ordered[1].staffName).toBe('Charlie'); // 0
    });
  });

  describe('getNextInQueue', () => {
    it('should return first by rotation', () => {
      const settings: TurnSettings = {
        mode: 'auto',
        orderingMethod: 'rotation',
        appointmentBonus: 0.5,
        walkInRequestBonus: 1,
        tardyPenalty: 1,
      };
      const next = getNextInQueue(mockStaffTurns, settings);
      expect(next?.staffName).toBe('Alice');
    });

    it('should return lowest by service count', () => {
      const settings: TurnSettings = {
        mode: 'auto',
        orderingMethod: 'service-count',
        appointmentBonus: 0.5,
        walkInRequestBonus: 1,
        tardyPenalty: 1,
      };
      const next = getNextInQueue(mockStaffTurns, settings);
      expect(next?.staffName).toBe('Bob'); // Has 3 turns
    });

    it('should return lowest by amount', () => {
      const settings: TurnSettings = {
        mode: 'auto',
        orderingMethod: 'amount',
        appointmentBonus: 0.5,
        walkInRequestBonus: 1,
        tardyPenalty: 1,
      };
      const revenueMap = new Map([
        ['staff-1', 500],
        ['staff-2', 300],
        ['staff-3', 700],
      ]);
      const next = getNextInQueue(mockStaffTurns, settings, undefined, revenueMap);
      expect(next?.staffName).toBe('Bob'); // Has $300
    });

    it('should return null for empty array', () => {
      const settings: TurnSettings = {
        mode: 'auto',
        orderingMethod: 'rotation',
        appointmentBonus: 0.5,
        walkInRequestBonus: 1,
        tardyPenalty: 1,
      };
      expect(getNextInQueue([], settings)).toBeNull();
    });
  });
});

// ============================================
// TURN ADJUSTMENT VALIDATION
// ============================================

interface TurnAdjustment {
  staffId: string;
  amount: number;
  reason: string;
  adjustedBy: string;
  adjustedAt: string;
}

function validateAdjustment(adjustment: Partial<TurnAdjustment>): { valid: boolean; error?: string } {
  if (!adjustment.staffId) {
    return { valid: false, error: 'Staff ID is required' };
  }
  if (adjustment.amount === undefined || adjustment.amount === 0) {
    return { valid: false, error: 'Adjustment amount cannot be zero' };
  }
  if (!adjustment.reason || adjustment.reason.trim().length < 3) {
    return { valid: false, error: 'Reason must be at least 3 characters' };
  }
  if (!adjustment.adjustedBy) {
    return { valid: false, error: 'Adjusted by is required' };
  }
  return { valid: true };
}

describe('Turn Adjustment Validation', () => {
  describe('validateAdjustment', () => {
    it('should validate complete adjustment', () => {
      const adjustment: Partial<TurnAdjustment> = {
        staffId: 'staff-1',
        amount: 1,
        reason: 'Covered for sick colleague',
        adjustedBy: 'manager-1',
      };
      expect(validateAdjustment(adjustment)).toEqual({ valid: true });
    });

    it('should reject missing staffId', () => {
      const adjustment: Partial<TurnAdjustment> = {
        amount: 1,
        reason: 'Test reason',
        adjustedBy: 'manager-1',
      };
      expect(validateAdjustment(adjustment).valid).toBe(false);
      expect(validateAdjustment(adjustment).error).toContain('Staff ID');
    });

    it('should reject zero amount', () => {
      const adjustment: Partial<TurnAdjustment> = {
        staffId: 'staff-1',
        amount: 0,
        reason: 'Test reason',
        adjustedBy: 'manager-1',
      };
      expect(validateAdjustment(adjustment).valid).toBe(false);
      expect(validateAdjustment(adjustment).error).toContain('zero');
    });

    it('should reject short reason', () => {
      const adjustment: Partial<TurnAdjustment> = {
        staffId: 'staff-1',
        amount: 1,
        reason: 'ab',
        adjustedBy: 'manager-1',
      };
      expect(validateAdjustment(adjustment).valid).toBe(false);
      expect(validateAdjustment(adjustment).error).toContain('3 characters');
    });

    it('should reject missing adjustedBy', () => {
      const adjustment: Partial<TurnAdjustment> = {
        staffId: 'staff-1',
        amount: 1,
        reason: 'Test reason',
      };
      expect(validateAdjustment(adjustment).valid).toBe(false);
      expect(validateAdjustment(adjustment).error).toContain('Adjusted by');
    });

    it('should allow negative adjustments', () => {
      const adjustment: Partial<TurnAdjustment> = {
        staffId: 'staff-1',
        amount: -2,
        reason: 'Penalty for no-show',
        adjustedBy: 'manager-1',
      };
      expect(validateAdjustment(adjustment)).toEqual({ valid: true });
    });
  });
});
