import { BaseSyncableEntity } from '../common';

/**
 * Resource represents a bookable physical asset (room, equipment, station).
 */
export interface Resource extends BaseSyncableEntity {
  // === IDENTITY ===
  name: string;
  description: string | null;

  // === CATEGORIZATION ===
  category: ResourceCategory;

  // === CONFIGURATION ===
  /** Usually 1, but could be higher for shared resources */
  capacity: number;
  /** Whether this can be booked for appointments */
  isBookable: boolean;

  // === DISPLAY ===
  color: string;
  imageUrl: string | null;
  displayOrder: number;

  // === STATUS ===
  isActive: boolean;

  // === LINKED SERVICES ===
  /** Service IDs that can use this resource */
  linkedServiceIds: string[];
}

export type ResourceCategory =
  | 'room'
  | 'equipment'
  | 'station'
  | 'other';

export interface CreateResourceInput {
  name: string;
  description?: string | null;
  category: ResourceCategory;
  capacity?: number;
  isBookable?: boolean;
  color?: string;
  displayOrder?: number;
  linkedServiceIds?: string[];
}

export type UpdateResourceInput = Partial<CreateResourceInput>;
