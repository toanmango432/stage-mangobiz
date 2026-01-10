/**
 * Mango Pad Type Definitions
 */

export type PadScreen = 'waiting' | 'tip' | 'signature' | 'receipt' | 'complete' | 'error';

export interface PosConnectionState {
  isConnected: boolean;
  lastHeartbeat: Date | null;
  storeId: string | null;
  storeName: string | null;
}
