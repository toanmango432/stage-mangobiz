/**
 * Turn Queue Intelligence Service
 * Handles automatic staff assignment based on skills, availability, and rotation
 */

import { staffDB, ticketsDB } from '../db/database';
import type { Staff, Ticket } from '../types';
import { measureAsync } from '../utils';
import { turnQueueCache } from './turnQueueCache';

interface AssignmentCriteria {
  serviceIds: string[];
  vipClient?: boolean;
  preferredStaffId?: string;
  requiredSkills?: string[];
}

interface StaffScore {
  staff: Staff;
  score: number;
  reasons: string[];
}

/**
 * Pre-fetched tickets data to avoid N+1 queries
 */
interface PreFetchedTickets {
  allTickets: Ticket[];
  activeTickets: Ticket[];
  twoHoursAgo: Date;
}

/**
 * Generate a cache key from store ID and assignment criteria.
 * The key is deterministic for the same criteria.
 * Note: Uses spread operator to avoid mutating the caller's arrays when sorting.
 */
function generateCacheKey(storeId: string, criteria: AssignmentCriteria): string {
  const parts = [
    storeId,
    [...criteria.serviceIds].sort().join(','),
    criteria.vipClient ? 'vip' : '',
    criteria.preferredStaffId || '',
    [...(criteria.requiredSkills || [])].sort().join(','),
  ];
  return parts.join(':');
}

export class TurnQueueService {
  /**
   * Find the best available staff member for a service
   */
  async findBestStaff(
    storeId: string,
    criteria: AssignmentCriteria
  ): Promise<Staff | null> {
    return measureAsync('turnQueueService.findBestStaff', async () => {
      // Check cache first
      const cacheKey = generateCacheKey(storeId, criteria);
      const cachedResult = turnQueueCache.get(cacheKey);
      if (cachedResult !== undefined) {
        console.log('[PERF] turnQueueService.findBestStaff: cache hit');
        return cachedResult;
      }

      // Get all available staff
      const availableStaff = await staffDB.getAvailable(storeId);

      if (availableStaff.length === 0) {
        turnQueueCache.set(cacheKey, null);
        return null;
      }

      // If preferred staff is available, use them
      if (criteria.preferredStaffId) {
        const preferredStaff = availableStaff.find(s => s.id === criteria.preferredStaffId);
        if (preferredStaff) {
          turnQueueCache.set(cacheKey, preferredStaff);
          return preferredStaff;
        }
      }

      // Pre-fetch all tickets ONCE to avoid N+1 query pattern
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const [allTickets, activeTickets] = await Promise.all([
        ticketsDB.getAll(storeId),
        ticketsDB.getActive(storeId),
      ]);

      const preFetchedTickets: PreFetchedTickets = {
        allTickets,
        activeTickets,
        twoHoursAgo,
      };

      // Score each staff member using pre-fetched tickets
      const staffScores = await Promise.all(
        availableStaff.map(staff => this.scoreStaff(staff, criteria, preFetchedTickets))
      );

      // Sort by score (highest first)
      staffScores.sort((a, b) => b.score - a.score);

      // Log top 3 candidates
      console.log('🎯 Top staff candidates:');
      staffScores.slice(0, 3).forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.staff.name} (Score: ${s.score}) - ${s.reasons.join(', ')}`);
      });

      const bestStaff = staffScores[0]?.staff || null;
      turnQueueCache.set(cacheKey, bestStaff);
      return bestStaff;
    });
  }

  /**
   * Score a staff member based on assignment criteria
   */
  private scoreStaff(
    staff: Staff,
    criteria: AssignmentCriteria,
    preFetchedTickets: PreFetchedTickets
  ): StaffScore {
    let score = 0;
    const reasons: string[] = [];

    // Base score starts at 100
    score = 100;

    // 1. Skill Match (0-30 points)
    const skillScore = this.calculateSkillScore(staff, criteria.requiredSkills || []);
    score += skillScore;
    if (skillScore > 0) {
      reasons.push(`Skills: +${skillScore}`);
    }

    // 2. Turn Rotation (0-25 points)
    // Staff who haven't had a turn recently get higher score
    const turnScore = this.calculateTurnScore(staff, preFetchedTickets);
    score += turnScore;
    if (turnScore > 0) {
      reasons.push(`Turn rotation: +${turnScore}`);
    }

    // 3. VIP Handling (0-20 points)
    // If client is VIP and staff has VIP experience
    if (criteria.vipClient && staff.vipPreferred) {
      score += 20;
      reasons.push('VIP specialist: +20');
    }

    // 4. Current Load (0-15 points)
    // Staff with fewer active tickets get priority
    const loadScore = this.calculateLoadScore(staff, preFetchedTickets);
    score += loadScore;
    if (loadScore > 0) {
      reasons.push(`Low workload: +${loadScore}`);
    }

    // 5. Performance (0-10 points)
    // Based on average service rating
    if (staff.rating && staff.rating >= 4.5) {
      const perfScore = Math.floor((staff.rating - 4.0) * 10);
      score += perfScore;
      reasons.push(`High rating: +${perfScore}`);
    }

    return {
      staff,
      score,
      reasons,
    };
  }

  /**
   * Calculate skill match score
   */
  private calculateSkillScore(staff: Staff, requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 0;

    const staffSkills = staff.skills || [];
    const matchedSkills = requiredSkills.filter(skill =>
      staffSkills.some(s => s.toLowerCase() === skill.toLowerCase())
    );

    // Award points based on percentage of skills matched
    const matchPercentage = matchedSkills.length / requiredSkills.length;
    return Math.floor(matchPercentage * 30);
  }

  /**
   * Calculate turn rotation score
   * Staff who haven't had a turn recently get higher score
   * Uses pre-fetched tickets to avoid N+1 queries
   */
  private calculateTurnScore(staff: Staff, preFetchedTickets: PreFetchedTickets): number {
    try {
      // Filter from pre-fetched tickets - no database call needed
      const staffRecentTickets = preFetchedTickets.allTickets.filter(ticket => {
        const hasStaff = ticket.services.some(s => s.staffId === staff.id);
        const isRecent = new Date(ticket.createdAt) >= preFetchedTickets.twoHoursAgo;
        return hasStaff && isRecent;
      });

      // More recent tickets = lower score
      // No tickets in 2 hours = max score (25)
      const score = Math.max(0, 25 - (staffRecentTickets.length * 5));
      return score;
    } catch (error) {
      console.error('Error calculating turn score:', error);
      return 0;
    }
  }

  /**
   * Calculate current workload score
   * Staff with fewer active tickets get higher score
   * Uses pre-fetched tickets to avoid N+1 queries
   */
  private calculateLoadScore(staff: Staff, preFetchedTickets: PreFetchedTickets): number {
    try {
      // Filter from pre-fetched active tickets - no database call needed
      const staffActiveTickets = preFetchedTickets.activeTickets.filter(ticket =>
        ticket.services.some(s => s.staffId === staff.id)
      );

      // Max score (15) when no active tickets
      // -5 points per active ticket
      const score = Math.max(0, 15 - (staffActiveTickets.length * 5));
      return score;
    } catch (error) {
      console.error('Error calculating load score:', error);
      return 0;
    }
  }

  /**
   * Get turn queue stats for display
   * Pre-fetches tickets once to avoid N+1 queries
   */
  async getTurnQueueStats(storeId: string) {
    try {
      // Pre-fetch all data ONCE to avoid N+1 queries
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const [allStaff, allTickets, activeTickets] = await Promise.all([
        staffDB.getAll(storeId),
        ticketsDB.getAll(storeId),
        ticketsDB.getActive(storeId),
      ]);

      const preFetchedTickets: PreFetchedTickets = {
        allTickets,
        activeTickets,
        twoHoursAgo,
      };

      // Calculate stats using pre-fetched data - no more N+1
      const staffStats = allStaff.map((staff) => {
        const staffActiveTickets = activeTickets.filter(ticket =>
          ticket.services.some(s => s.staffId === staff.id)
        );

        const recentTickets = allTickets.filter(ticket => {
          const hasStaff = ticket.services.some(s => s.staffId === staff.id);
          const isRecent = new Date(ticket.createdAt) >= twoHoursAgo;
          return hasStaff && isRecent;
        });

        return {
          staffId: staff.id,
          name: staff.name,
          status: staff.status,
          activeTickets: staffActiveTickets.length,
          recentTickets: recentTickets.length,
          turnScore: this.calculateTurnScore(staff, preFetchedTickets),
        };
      });

      // Sort by turn score (highest = most deserving of next turn)
      staffStats.sort((a, b) => b.turnScore - a.turnScore);

      return {
        totalStaff: allStaff.length,
        availableStaff: allStaff.filter(s => s.status === 'available').length,
        staffStats,
        nextInLine: staffStats.find(s => s.status === 'available')?.name || 'None',
      };
    } catch (error) {
      console.error('Error getting turn queue stats:', error);
      return null;
    }
  }

  /**
   * Auto-assign staff to a walk-in client
   */
  async autoAssignWalkIn(storeId: string, serviceIds: string[], vipClient = false): Promise<Staff | null> {
    return this.findBestStaff(storeId, {
      serviceIds,
      vipClient,
    });
  }

  /**
   * Suggest staff for a service
   * Returns top 3 suggestions with reasons
   * Pre-fetches tickets once to avoid N+1 queries
   */
  async suggestStaff(
    storeId: string,
    criteria: AssignmentCriteria
  ): Promise<StaffScore[]> {
    // Pre-fetch all data ONCE to avoid N+1 queries
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const [availableStaff, allTickets, activeTickets] = await Promise.all([
      staffDB.getAvailable(storeId),
      ticketsDB.getAll(storeId),
      ticketsDB.getActive(storeId),
    ]);

    const preFetchedTickets: PreFetchedTickets = {
      allTickets,
      activeTickets,
      twoHoursAgo,
    };

    // Score using pre-fetched tickets - no more N+1
    const staffScores = availableStaff.map(staff =>
      this.scoreStaff(staff, criteria, preFetchedTickets)
    );

    // Sort and return top 3
    staffScores.sort((a, b) => b.score - a.score);
    return staffScores.slice(0, 3);
  }

  /**
   * Check if staff is on break
   */
  async isOnBreak(staffId: string): Promise<boolean> {
    const staff = await staffDB.getById(staffId);
    return staff?.status === 'on-break';
  }

  /**
   * Set staff break status
   */
  async setBreakStatus(staffId: string, onBreak: boolean): Promise<void> {
    await staffDB.update(staffId, {
      status: onBreak ? 'on-break' : 'available',
    });
  }
}

// Export singleton instance
export const turnQueueService = new TurnQueueService();
export default turnQueueService;

// Re-export cache invalidation function for external use
export { invalidateTurnQueueCache } from './turnQueueCache';
