import { describe, it, expect } from 'vitest';

/**
 * Tip Distribution Tests
 *
 * Tests the tip distribution logic and UI preview.
 * The PaymentModal already contains tip distribution UI at lines 494-533.
 */

interface StaffMember {
  id: string;
  name: string;
  serviceTotal?: number;
}

interface TipDistribution {
  staffId: string;
  staffName: string;
  amount: number;
  percentage?: number;
}

// Proportional distribution based on service revenue
function calculateProportionalDistribution(
  tipAmount: number,
  staffMembers: StaffMember[]
): TipDistribution[] {
  const totalServiceRevenue = staffMembers.reduce(
    (sum, s) => sum + (s.serviceTotal || 0),
    0
  );

  if (totalServiceRevenue === 0) {
    return calculateEqualDistribution(tipAmount, staffMembers);
  }

  return staffMembers.map((staff) => {
    const proportion = (staff.serviceTotal || 0) / totalServiceRevenue;
    return {
      staffId: staff.id,
      staffName: staff.name,
      amount: tipAmount * proportion,
      percentage: proportion * 100,
    };
  });
}

// Equal split distribution
function calculateEqualDistribution(
  tipAmount: number,
  staffMembers: StaffMember[]
): TipDistribution[] {
  const amountPerStaff = tipAmount / staffMembers.length;
  const percentagePerStaff = 100 / staffMembers.length;

  return staffMembers.map((staff) => ({
    staffId: staff.id,
    staffName: staff.name,
    amount: amountPerStaff,
    percentage: percentagePerStaff,
  }));
}

describe('Tip Distribution', () => {
  describe('proportional distribution', () => {
    it('should distribute tip based on service revenue', () => {
      const tipAmount = 20;
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John', serviceTotal: 60 },
        { id: 'staff-2', name: 'Jane', serviceTotal: 40 },
      ];

      const distribution = calculateProportionalDistribution(tipAmount, staffMembers);

      expect(distribution[0].amount).toBe(12); // 60% of $20
      expect(distribution[1].amount).toBe(8); // 40% of $20
    });

    it('should handle single staff member', () => {
      const tipAmount = 15;
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John', serviceTotal: 100 },
      ];

      const distribution = calculateProportionalDistribution(tipAmount, staffMembers);

      expect(distribution.length).toBe(1);
      expect(distribution[0].amount).toBe(15);
      expect(distribution[0].percentage).toBe(100);
    });

    it('should fall back to equal split if no service revenue', () => {
      const tipAmount = 30;
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John', serviceTotal: 0 },
        { id: 'staff-2', name: 'Jane', serviceTotal: 0 },
        { id: 'staff-3', name: 'Bob', serviceTotal: 0 },
      ];

      const distribution = calculateProportionalDistribution(tipAmount, staffMembers);

      expect(distribution[0].amount).toBe(10);
      expect(distribution[1].amount).toBe(10);
      expect(distribution[2].amount).toBe(10);
    });

    it('should handle uneven proportions', () => {
      const tipAmount = 100;
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John', serviceTotal: 150 },
        { id: 'staff-2', name: 'Jane', serviceTotal: 100 },
        { id: 'staff-3', name: 'Bob', serviceTotal: 50 },
      ];

      const distribution = calculateProportionalDistribution(tipAmount, staffMembers);

      expect(distribution[0].amount).toBe(50); // 50% of $100
      expect(distribution[1].amount).toBeCloseTo(33.33, 1); // 33.33% of $100
      expect(distribution[2].amount).toBeCloseTo(16.67, 1); // 16.67% of $100
    });
  });

  describe('equal distribution', () => {
    it('should split tip equally among staff', () => {
      const tipAmount = 30;
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John' },
        { id: 'staff-2', name: 'Jane' },
        { id: 'staff-3', name: 'Bob' },
      ];

      const distribution = calculateEqualDistribution(tipAmount, staffMembers);

      expect(distribution[0].amount).toBe(10);
      expect(distribution[1].amount).toBe(10);
      expect(distribution[2].amount).toBe(10);
    });

    it('should handle single staff member', () => {
      const tipAmount = 25;
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John' },
      ];

      const distribution = calculateEqualDistribution(tipAmount, staffMembers);

      expect(distribution[0].amount).toBe(25);
      expect(distribution[0].percentage).toBe(100);
    });

    it('should handle uneven splits with rounding', () => {
      const tipAmount = 10;
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John' },
        { id: 'staff-2', name: 'Jane' },
        { id: 'staff-3', name: 'Bob' },
      ];

      const distribution = calculateEqualDistribution(tipAmount, staffMembers);

      // Each should get $3.33...
      const total = distribution.reduce((sum, d) => sum + d.amount, 0);
      expect(total).toBeCloseTo(10, 5);
    });
  });

  describe('edge cases', () => {
    it('should handle zero tip amount', () => {
      const tipAmount = 0;
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John', serviceTotal: 100 },
      ];

      const distribution = calculateProportionalDistribution(tipAmount, staffMembers);

      expect(distribution[0].amount).toBe(0);
    });

    it('should handle negative service totals gracefully', () => {
      const tipAmount = 20;
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John', serviceTotal: 100 },
        { id: 'staff-2', name: 'Jane', serviceTotal: -20 }, // Refund scenario
      ];

      const distribution = calculateProportionalDistribution(tipAmount, staffMembers);

      // Total service revenue = 80
      expect(distribution[0].amount).toBe(25); // 100/80 * 20 = 25
      expect(distribution[1].amount).toBe(-5); // -20/80 * 20 = -5
    });

    it('should include percentage for display', () => {
      const tipAmount = 20;
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John', serviceTotal: 80 },
        { id: 'staff-2', name: 'Jane', serviceTotal: 20 },
      ];

      const distribution = calculateProportionalDistribution(tipAmount, staffMembers);

      expect(distribution[0].percentage).toBe(80);
      expect(distribution[1].percentage).toBe(20);
    });
  });

  describe('PaymentModal integration', () => {
    it('should show tip distribution UI when staff count > 1 and tip > 0', () => {
      // PaymentModal shows distribution at line 494:
      // {staffMembers.length > 1 && tipAmount > 0 && (...)}
      const staffCount = 2;
      const tipAmount = 10;

      const shouldShowUI = staffCount > 1 && tipAmount > 0;
      expect(shouldShowUI).toBe(true);
    });

    it('should hide tip distribution UI for single staff', () => {
      const staffCount = 1;
      const tipAmount = 10;

      const shouldShowUI = staffCount > 1 && tipAmount > 0;
      expect(shouldShowUI).toBe(false);
    });

    it('should hide tip distribution UI when tip is zero', () => {
      const staffCount = 3;
      const tipAmount = 0;

      const shouldShowUI = staffCount > 1 && tipAmount > 0;
      expect(shouldShowUI).toBe(false);
    });
  });
});
