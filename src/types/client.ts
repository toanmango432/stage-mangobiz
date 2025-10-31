import { SyncStatus } from './common';

export interface Client {
  id: string;
  salonId: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  birthday?: Date;
  notes?: string;
  preferredStaff?: string[]; // Staff IDs
  loyaltyTier?: string;
  lastVisit?: Date;
  totalVisits: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}
