import { BaseSyncableEntity } from '../common';

/**
 * ResourceBooking links a resource to an appointment for a time slot.
 */
export interface ResourceBooking extends BaseSyncableEntity {
  // === RESOURCE REFERENCE ===
  resourceId: string;
  resourceName: string;

  // === APPOINTMENT REFERENCE ===
  appointmentId: string;

  // === TIMING ===
  startDateTime: string;
  endDateTime: string;

  // === STAFF CONTEXT ===
  staffId: string;
  staffName: string;

  // === ASSIGNMENT ===
  assignmentType: 'auto' | 'manual';
  assignedBy: string | null;
}

export interface CreateResourceBookingInput {
  resourceId: string;
  resourceName: string;
  appointmentId: string;
  startDateTime: string;
  endDateTime: string;
  staffId: string;
  staffName: string;
  assignmentType: 'auto' | 'manual';
  assignedBy?: string | null;
}
