import { SyncOperationType, EntityType } from './common';

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entity: EntityType;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  priority: number; // 1 = highest
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'syncing' | 'success' | 'failed';
  error?: string;
  lastAttemptAt?: Date;
}

export interface SyncQueueStats {
  pending: number;
  syncing: number;
  failed: number;
  lastSyncAt?: Date;
}

