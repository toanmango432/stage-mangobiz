import { describe, it, expect } from 'vitest';
import {
  calculateProportionalDistribution,
  calculateEqualDistribution,
  calculateTipFromPercentage,
  calculateTipSuggestions,
  adjustForRounding,
  StaffMember,
} from '../tipCalculation';

describe('tipCalculation', () => {
  describe('calculateProportionalDistribution', () => {
    it('should distribute tip based on service revenue', () => {
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John', serviceTotal: 60 },
        { id: 'staff-2', name: 'Jane', serviceTotal: 40 },
      ];

      const result = calculateProportionalDistribution(20, staffMembers);

      expect(result[0].amount).toBe(12);
      expect(result[1].amount).toBe(8);
    });

    it('should return empty array for zero tip', () => {
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John', serviceTotal: 100 },
      ];

      const result = calculateProportionalDistribution(0, staffMembers);

      expect(result).toEqual([]);
    });

    it('should return empty array for empty staff list', () => {
      const result = calculateProportionalDistribution(20, []);

      expect(result).toEqual([]);
    });

    it('should fall back to equal split if no service revenue', () => {
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John' },
        { id: 'staff-2', name: 'Jane' },
      ];

      const result = calculateProportionalDistribution(20, staffMembers);

      expect(result[0].amount).toBe(10);
      expect(result[1].amount).toBe(10);
    });

    it('should include percentage', () => {
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John', serviceTotal: 80 },
        { id: 'staff-2', name: 'Jane', serviceTotal: 20 },
      ];

      const result = calculateProportionalDistribution(100, staffMembers);

      expect(result[0].percentage).toBe(80);
      expect(result[1].percentage).toBe(20);
    });
  });

  describe('calculateEqualDistribution', () => {
    it('should split tip equally', () => {
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John' },
        { id: 'staff-2', name: 'Jane' },
      ];

      const result = calculateEqualDistribution(30, staffMembers);

      expect(result[0].amount).toBe(15);
      expect(result[1].amount).toBe(15);
    });

    it('should handle single staff member', () => {
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John' },
      ];

      const result = calculateEqualDistribution(25, staffMembers);

      expect(result[0].amount).toBe(25);
      expect(result[0].percentage).toBe(100);
    });

    it('should return empty array for zero tip', () => {
      const staffMembers: StaffMember[] = [
        { id: 'staff-1', name: 'John' },
      ];

      const result = calculateEqualDistribution(0, staffMembers);

      expect(result).toEqual([]);
    });
  });

  describe('calculateTipFromPercentage', () => {
    it('should calculate tip from percentage', () => {
      const result = calculateTipFromPercentage(100, 20);

      expect(result).toBe(20);
    });

    it('should calculate pre-tax tip', () => {
      const result = calculateTipFromPercentage(100, 20, true, 10);

      expect(result).toBe(20); // Based on subtotal only
    });

    it('should calculate post-tax tip', () => {
      const result = calculateTipFromPercentage(100, 20, false, 10);

      expect(result).toBe(22); // Based on subtotal + tax
    });

    it('should round to cents', () => {
      const result = calculateTipFromPercentage(33.33, 18);

      expect(result).toBe(6); // 33.33 * 0.18 = 5.9994, rounds to 6.00
    });
  });

  describe('calculateTipSuggestions', () => {
    it('should return suggestions for default percentages', () => {
      const result = calculateTipSuggestions(100);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ percentage: 15, amount: 15 });
      expect(result[1]).toEqual({ percentage: 18, amount: 18 });
      expect(result[2]).toEqual({ percentage: 20, amount: 20 });
      expect(result[3]).toEqual({ percentage: 22, amount: 22 });
    });

    it('should use custom percentages', () => {
      const result = calculateTipSuggestions(100, [10, 15, 20]);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ percentage: 10, amount: 10 });
      expect(result[1]).toEqual({ percentage: 15, amount: 15 });
      expect(result[2]).toEqual({ percentage: 20, amount: 20 });
    });
  });

  describe('adjustForRounding', () => {
    it('should adjust for rounding errors', () => {
      const distribution = [
        { staffId: 'staff-1', staffName: 'John', amount: 6.67 },
        { staffId: 'staff-2', staffName: 'Jane', amount: 6.67 },
        { staffId: 'staff-3', staffName: 'Bob', amount: 6.67 },
      ];

      const result = adjustForRounding(distribution, 20);

      const total = result.reduce((sum, d) => sum + d.amount, 0);
      expect(total).toBeCloseTo(20, 2);
    });

    it('should return same distribution if no adjustment needed', () => {
      const distribution = [
        { staffId: 'staff-1', staffName: 'John', amount: 10 },
        { staffId: 'staff-2', staffName: 'Jane', amount: 10 },
      ];

      const result = adjustForRounding(distribution, 20);

      expect(result).toEqual(distribution);
    });

    it('should handle empty distribution', () => {
      const result = adjustForRounding([], 20);

      expect(result).toEqual([]);
    });
  });
});
