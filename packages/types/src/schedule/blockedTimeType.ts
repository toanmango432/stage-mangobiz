import { BaseSyncableEntity } from '../common';

/**
 * BlockedTimeType defines a category of blocked time (Lunch, Training, Meeting, etc.)
 */
export interface BlockedTimeType extends BaseSyncableEntity {
  // === IDENTITY ===
  name: string;
  code: string;
  /** Optional description for the type */
  description?: string;

  // === VISUAL ===
  emoji: string;
  color: string;

  // === CONFIGURATION ===
  /** Default duration in minutes when creating entries */
  defaultDurationMinutes: number;
  /** Whether this time counts as paid for payroll */
  isPaid: boolean;
  /** Whether to prevent online appointment booking */
  blocksOnlineBooking: boolean;
  /** Whether to warn/prevent in-store booking */
  blocksInStoreBooking: boolean;
  /** Whether manager must approve this blocked time */
  requiresApproval: boolean;

  // === DISPLAY ===
  displayOrder: number;
  isActive: boolean;
  isSystemDefault: boolean;
}

export interface CreateBlockedTimeTypeInput {
  name: string;
  code?: string;
  description?: string;
  emoji: string;
  color: string;
  defaultDurationMinutes?: number;
  isPaid: boolean;
  blocksOnlineBooking?: boolean;
  blocksInStoreBooking?: boolean;
  requiresApproval?: boolean;
  displayOrder?: number;
  isActive?: boolean;
}

export type UpdateBlockedTimeTypeInput = Partial<Omit<CreateBlockedTimeTypeInput, 'code'>>;
