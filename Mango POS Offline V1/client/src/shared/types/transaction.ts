import { TransactionStatus, PaymentMethod, SyncStatus } from './common';

export interface PaymentDetails {
  cardLast4?: string;
  cardBrand?: string;
  cardholderName?: string;
  authCode?: string;
  terminalId?: string;
  receiptNumber?: string;
}

export interface Transaction {
  id: string;
  salonId: string;
  ticketId: string;
  clientId: string;
  clientName: string;
  amount: number;
  tip: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  status: TransactionStatus;
  createdAt: Date;
  processedAt?: Date;
  voidedAt?: Date;
  voidedBy?: string;
  voidReason?: string;
  refundedAt?: Date;
  refundedAmount?: number;
  refundReason?: string;
  syncStatus: SyncStatus;
}

