/**
 * Payment Service Types
 * Defines interfaces for payment processing abstraction
 */

export type PaymentMethodType = 'card' | 'cash' | 'gift_card' | 'custom';

export interface PaymentRequest {
  /** Amount in dollars */
  amount: number;
  /** Payment method type */
  method: PaymentMethodType;
  /** For custom payments, the name (e.g., "Venmo", "Check") */
  customName?: string;
  /** For cash payments, amount tendered by customer */
  tendered?: number;
  /** Associated ticket ID */
  ticketId: string;
  /** Associated client ID */
  clientId?: string;
}

export interface PaymentResult {
  success: boolean;
  /** Transaction ID from processor */
  transactionId?: string;
  /** Error message if failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: 'DECLINED' | 'NETWORK_ERROR' | 'INVALID_CARD' | 'INSUFFICIENT_FUNDS' | 'PROCESSING_ERROR' | 'SYSTEM_ERROR';
  /** Amount actually processed */
  amountProcessed?: number;
  /** For cash, the change to return */
  changeToReturn?: number;
  /** Timestamp of transaction */
  timestamp?: string;
  /** Authorization code from processor */
  authCode?: string;
}

export interface PaymentProvider {
  /** Provider name for logging/display */
  name: string;

  /** Process a card payment */
  processCardPayment(request: PaymentRequest): Promise<PaymentResult>;

  /** Process a cash payment */
  processCashPayment(request: PaymentRequest): Promise<PaymentResult>;

  /** Process a gift card payment */
  processGiftCardPayment(request: PaymentRequest, giftCardCode?: string): Promise<PaymentResult>;

  /** Process a custom/other payment method */
  processCustomPayment(request: PaymentRequest): Promise<PaymentResult>;

  /** Void/refund a transaction */
  voidTransaction(transactionId: string): Promise<PaymentResult>;

  /** Check if provider is available (device connected, network up, etc.) */
  isAvailable(): Promise<boolean>;
}

export interface TransactionRecord {
  id: string;
  ticketId: string;
  clientId?: string;
  storeId: string;
  paymentMethod: PaymentMethodType;
  customMethodName?: string;
  amount: number;
  tip: number;
  total: number;
  status: 'pending' | 'completed' | 'voided' | 'refunded' | 'failed';
  transactionId?: string;
  authCode?: string;
  createdAt: string;
  completedAt?: string;
  staffId?: string;
  deviceId?: string;
  syncStatus: 'pending' | 'synced' | 'error';
}
