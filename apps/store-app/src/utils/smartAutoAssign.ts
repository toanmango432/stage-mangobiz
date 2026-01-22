/**
 * Smart Auto-Assignment Engine
 * Multi-factor intelligent staff assignment (beyond empID 9999)
 */

import { LocalAppointment } from '../types/appointment';
import { findAvailableStaff, isStaffAvailable } from './conflictDetection';
import { NEXT_AVAILABLE_STAFF_ID } from '../constants/appointment';

interface Staff {
  id: string;
  name: string;
  specialty?: string;
  isActive?: boolean;
}

interface AssignmentScore {
  staffId: string;
  score: number;
  reasons: string[];
}

/**
 * Calculate assignment score based on multiple factors
 */
export function calculateAssignmentScore(
  staffId: string,
  staff: Staff,
  appointment: LocalAppointment,
  startTime: Date,
  endTime: Date,
  allAppointments: LocalAppointment[],
  allStaff: Staff[]
): AssignmentScore {
  let score = 0;
  const reasons: string[] = [];

  // 1. Service type compatibility (30% weight)
  // Check if staff specializes in the service type
  const serviceType = appointment.services[0]?.serviceName || '';
  if (staff.specialty && serviceType.toLowerCase().includes(staff.specialty.toLowerCase())) {
    score += 30;
    reasons.push(`Service match: specializes in ${staff.specialty}`);
  } else {
    score += 15; // Partial match
  }

  // 2. Client preference (25% weight)
  // Check if client has booked with this staff before
  const pastBookings = allAppointments.filter(
    apt => apt.clientId === appointment.clientId &&
           apt.staffId === staffId &&
           apt.status !== 'cancelled' &&
           apt.status !== 'no-show'
  );
  if (pastBookings.length > 0) {
    score += 25;
    reasons.push(`Client preference: ${pastBookings.length} past booking${pastBookings.length > 1 ? 's' : ''} with ${staff.name}`);
  }

  // 3. Fair rotation (20% weight)
  // Check weighted workload using turnWeight for each service
  // turnWeight (0.0-5.0, default 1.0) - higher = more complex service = more rotation credit
  const today = new Date(startTime);
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const todayAppointments = allAppointments.filter(apt => {
    const aptDate = new Date(apt.scheduledStartTime);
    return aptDate >= today && aptDate <= todayEnd &&
           apt.status !== 'cancelled' &&
           apt.status !== 'no-show';
  });

  // Helper: Calculate total turnWeight for an appointment's services
  const getAppointmentTurnWeight = (apt: LocalAppointment): number => {
    if (!apt.services || apt.services.length === 0) return 1.0;
    return apt.services.reduce((sum, svc) => {
      // Default turnWeight is 1.0 if not set
      const weight = svc.turnWeight ?? 1.0;
      // Clamp to valid range 0.0-5.0
      return sum + Math.max(0, Math.min(5, weight));
    }, 0);
  };

  // Calculate weighted workload for this staff
  const staffTodayWeight = todayAppointments
    .filter(apt => apt.staffId === staffId)
    .reduce((sum, apt) => sum + getAppointmentTurnWeight(apt), 0);

  // Calculate max weighted workload across all staff
  const maxTodayWeight = Math.max(
    ...allStaff.map(s =>
      todayAppointments
        .filter(apt => apt.staffId === s.id)
        .reduce((sum, apt) => sum + getAppointmentTurnWeight(apt), 0)
    ),
    0
  );

  // Get turnWeight of current service being assigned (for rotation credit preview)
  const currentServiceWeight = appointment.services?.[0]?.turnWeight ?? 1.0;

  if (maxTodayWeight === 0) {
    score += 20; // No appointments today - fair distribution
    reasons.push('Fair rotation: no appointments today');
  } else {
    const ratio = staffTodayWeight / maxTodayWeight;
    if (ratio < 0.8) {
      score += 20; // Below average weighted workload - good for fairness
      reasons.push(`Fair rotation: ${staffTodayWeight.toFixed(1)} weighted workload (below average)`);
    } else if (ratio < 1.0) {
      score += 15; // Slightly below average
      reasons.push(`Fair rotation: ${staffTodayWeight.toFixed(1)} weighted workload`);
    } else {
      score += 5; // At or above average
      if (currentServiceWeight > 1.5) {
        reasons.push(`Fair rotation: above average workload (service weight: ${currentServiceWeight.toFixed(1)})`);
      }
    }
  }

  // 4. Current workload (15% weight)
  // Check how busy the staff is right now
  const now = new Date();
  const staffCurrentAppointments = allAppointments.filter(apt => {
    if (apt.staffId !== staffId) return false;
    if (apt.status === 'cancelled' || apt.status === 'no-show' || apt.status === 'completed') return false;
    
    const aptStart = new Date(apt.scheduledStartTime);
    const aptEnd = new Date(apt.scheduledEndTime);
    return now >= aptStart && now <= aptEnd;
  });

  if (staffCurrentAppointments.length === 0) {
    score += 15; // Not currently busy
    reasons.push('Current workload: available now');
  } else {
    score += 5; // Currently busy
    reasons.push(`Current workload: ${staffCurrentAppointments.length} active service${staffCurrentAppointments.length > 1 ? 's' : ''}`);
  }

  // 5. Skill level match (10% weight)
  // This would check service complexity vs staff experience in real implementation
  score += 10; // Default match
  reasons.push('Skill level: qualified for service');

  // 6. Availability bonus (extra points)
  // Only award if staff is truly available (no conflicts)
  const available = isStaffAvailable(staffId, startTime, endTime, allAppointments);
  if (available) {
    score += 10; // Available for this time slot
    reasons.push('Availability: free at this time');
  } else {
    // Penalize unavailable staff to ensure they rank lower
    score -= 20;
    reasons.push('WARNING: Time slot conflict detected');
  }

  return { staffId, score, reasons };
}

/**
 * Find best staff for auto-assignment
 */
export function findBestStaffForAssignment(
  appointment: LocalAppointment,
  startTime: Date,
  endTime: Date,
  allAppointments: LocalAppointment[],
  allStaff: Staff[]
): { staffId: string; score: number; reasons: string[] } | null {
  // Filter active staff
  const activeStaff = allStaff.filter(s => s.isActive !== false);

  if (activeStaff.length === 0) {
    return null;
  }

  // Get available staff for this time slot
  const availableStaffIds = findAvailableStaff(
    startTime,
    endTime,
    activeStaff.map(s => s.id),
    allAppointments
  );

  if (availableStaffIds.length === 0) {
    // No one available - return null (user can override)
    return null;
  }

  // Calculate scores for available staff
  const scores: AssignmentScore[] = availableStaffIds
    .map(staffId => {
      const staff = allStaff.find(s => s.id === staffId);
      if (!staff) return null;
      return calculateAssignmentScore(
        staffId,
        staff,
        appointment,
        startTime,
        endTime,
        allAppointments,
        allStaff
      );
    })
    .filter((score): score is AssignmentScore => score !== null)
    .sort((a, b) => b.score - a.score); // Sort by score descending

  if (scores.length === 0) {
    return null;
  }

  // Return top-scoring staff
  const topStaff = scores[0];

  // Final safety check: Ensure selected staff is actually available
  // This prevents edge cases where scoring might select conflicting staff
  if (!availableStaffIds.includes(topStaff.staffId)) {
    console.warn(`Warning: Top-scoring staff ${topStaff.staffId} is not in available list. This should not happen.`);
    return null;
  }

  return topStaff;
}

/**
 * Auto-assign staff for appointment (empID 9999 logic)
 */
export function autoAssignStaff(
  appointment: LocalAppointment | Partial<LocalAppointment>,
  startTime: Date,
  endTime: Date,
  allAppointments: LocalAppointment[],
  allStaff: Staff[],
  requestedStaffId?: string | number
): { staffId: string; reason: string; isAutomatic: boolean } | null {
  // If staff ID is 9999 or "Next Available", find best staff
  if (requestedStaffId === NEXT_AVAILABLE_STAFF_ID || 
      requestedStaffId === '9999' ||
      requestedStaffId === 9999 ||
      requestedStaffId === undefined ||
      requestedStaffId === null) {
    
    const bestStaff = findBestStaffForAssignment(
      appointment as LocalAppointment,
      startTime,
      endTime,
      allAppointments,
      allStaff
    );

    if (bestStaff) {
      return {
        staffId: bestStaff.staffId,
        reason: bestStaff.reasons.join(', '),
        isAutomatic: true,
      };
    }

    // Fallback: return first available staff
    const availableStaffIds = findAvailableStaff(
      startTime,
      endTime,
      allStaff.map(s => s.id),
      allAppointments
    );

    if (availableStaffIds.length > 0) {
      return {
        staffId: availableStaffIds[0],
        reason: 'First available staff (fallback)',
        isAutomatic: true,
      };
    }

    return null;
  }

  // Specific staff requested - check availability
  const requestedId = typeof requestedStaffId === 'number'
    ? requestedStaffId.toString()
    : requestedStaffId;

  // Verify requested staff exists and is active
  const requestedStaff = allStaff.find(s => s.id === requestedId);
  if (!requestedStaff || requestedStaff.isActive === false) {
    console.warn(`Requested staff ${requestedId} not found or inactive`);
    // Fall through to suggest alternative
  } else if (isStaffAvailable(requestedId, startTime, endTime, allAppointments)) {
    return {
      staffId: requestedId,
      reason: 'Requested staff is available',
      isAutomatic: false,
    };
  }

  // Requested staff not available or invalid - suggest alternative
  const alternative = findBestStaffForAssignment(
    appointment as LocalAppointment,
    startTime,
    endTime,
    allAppointments,
    allStaff
  );

  if (alternative) {
    return {
      staffId: alternative.staffId,
      reason: `Requested staff ${requestedStaff ? 'unavailable' : 'not found'}. ${alternative.reasons.join(', ')}`,
      isAutomatic: true,
    };
  }

  return null;
}

