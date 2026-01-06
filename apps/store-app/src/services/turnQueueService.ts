/**
 * Turn Queue Intelligence Service
 * Handles automatic staff assignment based on skills, availability, and rotation
 */

import { staffDB, ticketsDB } from '../db/database';
import type { Staff } from '../types';

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

export class TurnQueueService {
  /**
   * Find the best available staff member for a service
   */
  async findBestStaff(
    storeId: string,
    criteria: AssignmentCriteria
  ): Promise<Staff | null> {
    // Get all available staff
    const availableStaff = await staffDB.getAvailable(storeId);
    
    if (availableStaff.length === 0) {
      return null;
    }

    // If preferred staff is available, use them
    if (criteria.preferredStaffId) {
      const preferredStaff = availableStaff.find(s => s.id === criteria.preferredStaffId);
      if (preferredStaff) {
        return preferredStaff;
      }
    }

    // Score each staff member
    const staffScores = await Promise.all(
      availableStaff.map(staff => this.scoreStaff(staff, criteria, storeId))
    );

    // Sort by score (highest first)
    staffScores.sort((a, b) => b.score - a.score);

    // Log top 3 candidates
    console.log('🎯 Top staff candidates:');
    staffScores.slice(0, 3).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.staff.name} (Score: ${s.score}) - ${s.reasons.join(', ')}`);
    });

    return staffScores[0]?.staff || null;
  }

  /**
   * Score a staff member based on assignment criteria
   */
  private async scoreStaff(
    staff: Staff,
    criteria: AssignmentCriteria,
    storeId: string
  ): Promise<StaffScore> {
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
    const turnScore = await this.calculateTurnScore(staff, storeId);
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
    const loadScore = await this.calculateLoadScore(staff, storeId);
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
   */
  private async calculateTurnScore(staff: Staff, storeId: string): Promise<number> {
    try {
      // Get staff's recent tickets (last 2 hours)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const allTickets = await ticketsDB.getAll(storeId);
      
      const staffRecentTickets = allTickets.filter(ticket => {
        const hasStaff = ticket.services.some(s => s.staffId === staff.id);
        const isRecent = new Date(ticket.createdAt) >= twoHoursAgo;
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
   */
  private async calculateLoadScore(staff: Staff, storeId: string): Promise<number> {
    try {
      const activeTickets = await ticketsDB.getActive(storeId);
      
      const staffActiveTickets = activeTickets.filter(ticket =>
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
   */
  async getTurnQueueStats(storeId: string) {
    try {
      const allStaff = await staffDB.getAll(storeId);
      const activeTickets = await ticketsDB.getActive(storeId);

      const staffStats = await Promise.all(
        allStaff.map(async (staff) => {
          const staffTickets = activeTickets.filter(ticket =>
            ticket.services.some(s => s.staffId === staff.id)
          );

          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
          const allTickets = await ticketsDB.getAll(storeId);
          const recentTickets = allTickets.filter(ticket => {
            const hasStaff = ticket.services.some(s => s.staffId === staff.id);
            const isRecent = new Date(ticket.createdAt) >= twoHoursAgo;
            return hasStaff && isRecent;
          });

          return {
            staffId: staff.id,
            name: staff.name,
            status: staff.status,
            activeTickets: staffTickets.length,
            recentTickets: recentTickets.length,
            turnScore: await this.calculateTurnScore(staff, storeId),
          };
        })
      );

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
  async autoAssignWalkIn(storeId: string, serviceIds: string[], vipClient: boolean = false): Promise<Staff | null> {
    return this.findBestStaff(storeId, {
      serviceIds,
      vipClient,
    });
  }

  /**
   * Suggest staff for a service
   * Returns top 3 suggestions with reasons
   */
  async suggestStaff(
    storeId: string,
    criteria: AssignmentCriteria
  ): Promise<StaffScore[]> {
    const availableStaff = await staffDB.getAvailable(storeId);
    
    const staffScores = await Promise.all(
      availableStaff.map(staff => this.scoreStaff(staff, criteria, storeId))
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
