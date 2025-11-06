/**
 * TurnTracker Type Definitions
 * Shared types for the Turn Tracker system
 */

export interface TurnEntry {
  id: string;
  timestamp: Date;
  turnNumber: number;
  amount: number;
  serviceCount: number;
  bonusAmount: number;
  clientName: string;
  services: string[];
  type: 'service' | 'checkout' | 'void';
  ticketId: string;
}

export interface StaffTurnData {
  id: string;
  name: string;
  photo?: string;
  clockInTime: Date;
  serviceTurn: number;
  bonusTurn: number;
  adjustTurn: number;
  tardyTurn: number;
  appointmentTurn: number;
  partialTurn: number;
  totalTurn: number;
  queuePosition: number;
  serviceTotal: number;
  turnLogs: TurnEntry[];
}

export interface TurnSettings {
  mode: 'manual' | 'auto';
  orderingMethod: 'rotation' | 'service-count' | 'amount';
  appointmentBonus: { enabled: boolean; percentage: number };
  tardy: { enabled: boolean; minutesThreshold: number; turnsPerThreshold: number; maxTurns: number };
}
