/**
 * Mango Pad Type Definitions
 * TypeScript interfaces for MQTT payloads and application state
 */

export type PadScreen =
  | 'idle'
  | 'waiting'
  | 'order-review'
  | 'tip'
  | 'signature'
  | 'payment'
  | 'result'
  | 'receipt'
  | 'thank-you'
  | 'split-selection'
  | 'split-status'
  | 'settings';

/**
 * Transaction flow step for Mango Pad customer checkout flow
 */
export type PadFlowStep =
  | 'waiting'           // Waiting for transaction from Store App
  | 'receipt'           // Showing receipt/order review
  | 'tip'               // Tip selection screen
  | 'signature'         // Signature capture screen
  | 'receipt_preference'// Receipt preference selection
  | 'waiting_payment'   // Waiting for payment to process
  | 'complete'          // Payment successful
  | 'failed'            // Payment failed
  | 'cancelled';        // Transaction cancelled

export type MqttConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

/**
 * Item in a transaction - used for ActiveTransaction display
 */
export interface TransactionItem {
  id: string;
  name: string;
  staffName?: string;
  price: number;
  quantity: number;
  type?: 'service' | 'product';
}

/**
 * Active transaction state for Mango Pad customer checkout flow
 * Contains all transaction data received from Store App plus local state
 */
export interface ActiveTransaction {
  // Core identifiers
  transactionId: string;
  ticketId: string;

  // Client info
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;

  // Staff info
  staffName: string;

  // Items and totals
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;

  // Tip configuration and selection
  suggestedTips: number[];
  tipAmount: number;
  tipPercent: number | null;

  // Customer selections
  signatureData?: string;
  receiptPreference?: ReceiptPreference;

  // Flow state
  step: PadFlowStep;
  startedAt: string;

  // Payment result (populated after payment processing)
  paymentResult?: {
    success: boolean;
    cardLast4?: string;
    cardBrand?: string;
    errorMessage?: string;
  };
}

export interface TransactionPayload {
  transactionId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  staffName: string;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  loyaltyPoints?: number;
  suggestedTips: number[];
  showReceiptOptions: boolean;
  terminalType?: 'pax' | 'dejavoo' | 'clover' | 'generic';
}

export interface TipSelection {
  tipAmount: number;
  tipPercent: number | null;
  selectedAt: string;
}

export interface SignatureData {
  signatureBase64: string;
  agreedAt: string;
}

export interface PaymentResult {
  success: boolean;
  cardLast4?: string;
  authCode?: string;
  failureReason?: string;
  processedAt: string;
}

export type ReceiptPreference = 'email' | 'sms' | 'print' | 'none';

export interface ReceiptSelection {
  preference: ReceiptPreference;
  email?: string;
  phone?: string;
  selectedAt: string;
}

export interface SplitPayment {
  splitIndex: number;
  totalSplits: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  tipAmount?: number;
  signatureBase64?: string;
}

export interface PromoSlide {
  id: string;
  type: 'promotion' | 'announcement' | 'staff-spotlight' | 'testimonial' | 'social-qr';
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  backgroundColor?: string;
}

export interface PadConfig {
  salonId: string;
  mqttBrokerUrl: string;
  tipEnabled: boolean;
  tipType: 'percentage' | 'dollar';
  tipSuggestions: number[];
  signatureRequired: boolean;
  showReceiptOptions: boolean;
  paymentTimeout: number;
  thankYouDelay: number;
  splitPaymentEnabled: boolean;
  maxSplits: number;
  logoUrl?: string;
  promoSlides: PromoSlide[];
  slideDuration: number;
  brandColors: { primary: string; secondary: string };
  highContrastMode: boolean;
  largeTextMode: boolean;
}

export interface ReadyToPayPayload {
  transactionId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  staffName: string;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  loyaltyPoints?: number;
  suggestedTips: number[];
  showReceiptOptions: boolean;
  terminalType?: 'pax' | 'dejavoo' | 'clover' | 'generic';
}

export interface TipSelectedPayload {
  transactionId: string;
  tipAmount: number;
  tipPercent: number | null;
}

export interface SignatureCapturedPayload {
  transactionId: string;
  signatureBase64: string;
  agreedAt: string;
}

export interface PaymentResultPayload {
  transactionId: string;
  success: boolean;
  cardLast4?: string;
  authCode?: string;
  failureReason?: string;
}

export interface ReceiptPreferencePayload {
  transactionId: string;
  preference: ReceiptPreference;
  email?: string;
  phone?: string;
}

export interface TransactionCompletePayload {
  transactionId: string;
  completedAt: string;
}

export interface CancelPayload {
  transactionId?: string;
  reason?: string;
}

export interface HelpRequestedPayload {
  transactionId?: string;
  currentScreen: PadScreen;
  requestedAt: string;
}

export interface SplitPaymentPayload {
  transactionId: string;
  splitType: 'equal' | 'custom';
  splits: Array<{
    index: number;
    amount: number;
  }>;
}

// ============================================================================
// Pairing Types (Device Pairing System)
// ============================================================================

/**
 * QR Code payload from Store App for device pairing
 */
export interface PairingQRPayload {
  type: 'mango-pad-pairing';
  stationId: string;
  pairingCode: string;
  salonId: string;
  brokerUrl: string;
}

/**
 * Stored pairing information after successful pairing
 */
export interface PairingInfo {
  stationId: string;
  salonId: string;
  stationName: string;
  deviceId: string;
  pairedAt: string;
}

/**
 * Salon device record from Supabase salon_devices table
 */
export interface SalonDevice {
  id: string;
  store_id: string;
  device_fingerprint: string;
  device_name: string;
  device_type: 'ios' | 'android' | 'web' | 'desktop';
  device_role: 'store-app' | 'mango-pad' | 'check-in';
  station_name?: string;
  pairing_code?: string;
  paired_to_device_id?: string;
  is_online: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}
