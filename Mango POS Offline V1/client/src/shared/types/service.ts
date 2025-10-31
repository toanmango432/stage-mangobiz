import { SyncStatus } from './common';

export interface Service {
  id: string;
  salonId: string;
  name: string;
  category: string;
  description?: string;
  duration: number; // minutes
  price: number;
  commissionRate: number; // percentage
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: SyncStatus;
}

