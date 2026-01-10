/**
 * Mango Pad Type Definitions
 * TypeScript interfaces for MQTT payloads and application state
 */

export type PadScreen =
  | 'idle'
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

export type MqttConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface TransactionItem {
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
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
