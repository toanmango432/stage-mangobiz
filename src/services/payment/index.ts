/**
 * Payment Services - Public API
 *
 * Usage:
 *   import { paymentBridge } from '@/services/payment';
 *
 *   // Process a payment
 *   const result = await paymentBridge.processPayment({
 *     amount: 50.00,
 *     method: 'card',
 *     ticketId: 'ticket-123',
 *   });
 *
 *   // Process and create transaction record
 *   const { paymentResult, transactionRecord } = await paymentBridge.processAndRecord({
 *     ticketId: 'ticket-123',
 *     salonId: 'salon-456',
 *     paymentMethod: 'card',
 *     amount: 50.00,
 *     tip: 10.00,
 *   });
 */

export { paymentBridge } from './paymentBridge';
export { mockPaymentProvider, MockPaymentProvider } from './mockPaymentProvider';
export type {
  PaymentProvider,
  PaymentRequest,
  PaymentResult,
  PaymentMethodType,
  TransactionRecord,
} from './types';
