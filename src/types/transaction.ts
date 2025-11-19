import { TransactionStatus, PaymentMethod, SyncStatus } from './common';

export interface PaymentDetails {
  // Card payment
  cardLast4?: string;
  cardBrand?: string;
  cardholderName?: string;
  authCode?: string;
  terminalId?: string;
  processor?: string;

  // Cash payment
  amountTendered?: number;
  changeDue?: number;

  // Digital wallet (Venmo, etc.)
  transactionId?: string;
  accountHandle?: string;
  screenshot?: string; // URL to screenshot

  // Split payment
  splits?: Array<{
    method: PaymentMethod;
    amount: number;
    details: any;
  }>;

  // Receipt
  receiptNumber?: string;
}

export interface Transaction {
  id: string;
  salonId: string;
  ticketId: string;
  ticketNumber: number;

  // Client info
  clientId?: string;
  clientName: string;

  // Financial breakdown
  subtotal: number;  // Pre-tax service amount
  tax: number;       // Tax amount
  tip: number;       // Tip amount
  discount: number;  // Discount applied
  amount: number;    // subtotal + tax (legacy field)
  total: number;     // Final amount charged (subtotal + tax + tip - discount)

  // Payment info
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;

  // Service details
  services?: Array<{
    name: string;
    price: number;
    staffName?: string;
  }>;

  // Status and timestamps
  status: TransactionStatus;
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string; // Staff who processed payment

  // Void/Refund info
  voidedAt?: Date;
  voidedBy?: string;
  voidReason?: string;
  refundedAt?: Date;
  refundedAmount?: number;
  refundReason?: string;

  // Additional metadata
  notes?: string;

  // Sync status
  syncStatus: SyncStatus;
  syncedAt?: Date;
}

// Input type for creating transactions from pending tickets
export interface CreateTransactionInput {
  ticketId: string;
  ticketNumber: number;
  clientId?: string;
  clientName: string;
  subtotal: number;
  tax: number;
  tip: number;
  discount?: number;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  services?: Array<{
    name: string;
    price: number;
    staffName?: string;
  }>;
  notes?: string;
  processedBy?: string;
}
