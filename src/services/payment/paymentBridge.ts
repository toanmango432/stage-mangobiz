/**
 * Payment Bridge Service
 * Provides a unified API for payment processing across different providers
 *
 * Web: Uses MockPaymentProvider for development
 * iOS/Android: Will use FiservTTPProvider (Tap to Pay)
 * Desktop: Will use USB card reader provider
 */

import type { PaymentMethod } from '@/types/common';
import type { Transaction, CreateTransactionInput, PaymentDetails } from '@/types/transaction';
import { PaymentProvider, PaymentRequest, PaymentResult } from './types';
import { mockPaymentProvider } from './mockPaymentProvider';
import { dataService } from '../dataService';
import { captureException, addBreadcrumb } from '../monitoring/sentry';

// Detect platform (for future native integration)
const detectPlatform = (): 'web' | 'ios' | 'android' | 'desktop' => {
  // In future, check for Capacitor/Electron
  // For now, always return 'web'
  return 'web';
};

class PaymentBridge {
  private provider: PaymentProvider;
  private platform: 'web' | 'ios' | 'android' | 'desktop';

  constructor() {
    this.platform = detectPlatform();

    // Select provider based on platform
    // Future: Will have FiservTTPProvider for iOS/Android
    switch (this.platform) {
      case 'ios':
      case 'android':
        // TODO: Use FiservTTPProvider when native plugins are ready
        this.provider = mockPaymentProvider;
        break;
      case 'desktop':
        // TODO: Use USB card reader provider when Electron is ready
        this.provider = mockPaymentProvider;
        break;
      default:
        this.provider = mockPaymentProvider;
    }
  }

  /** Get current platform */
  getPlatform(): string {
    return this.platform;
  }

  /** Get provider name */
  getProviderName(): string {
    return this.provider.name;
  }

  /** Check if payment processing is available */
  async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }

  /**
   * Process a payment
   * This is the main entry point for all payment types
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log(`[PaymentBridge] Processing ${request.method} payment:`, request.amount);

    // Add breadcrumb for tracking
    addBreadcrumb({
      category: 'payment',
      message: `Processing ${request.method} payment`,
      level: 'info',
      data: {
        method: request.method,
        amount: request.amount,
        ticketId: request.ticketId,
      },
    });

    let result: PaymentResult;

    try {
      switch (request.method) {
        case 'card':
          result = await this.provider.processCardPayment(request);
          break;
        case 'cash':
          result = await this.provider.processCashPayment(request);
          break;
        case 'gift_card':
          result = await this.provider.processGiftCardPayment(request);
          break;
        case 'custom':
          result = await this.provider.processCustomPayment(request);
          break;
        default:
          return {
            success: false,
            error: `Unknown payment method: ${request.method}`,
            errorCode: 'PROCESSING_ERROR',
          };
      }

      // Track failed payments (not errors, but business failures)
      if (!result.success) {
        addBreadcrumb({
          category: 'payment',
          message: `Payment declined: ${result.error}`,
          level: 'warning',
          data: {
            method: request.method,
            errorCode: result.errorCode,
          },
        });
      }

      console.log(`[PaymentBridge] Payment result:`, result.success ? 'SUCCESS' : 'FAILED');
      return result;
    } catch (error) {
      // Capture unexpected errors to Sentry
      captureException(error, {
        tags: {
          module: 'payment',
          method: request.method,
        },
        extra: {
          amount: request.amount,
          ticketId: request.ticketId,
        },
      });

      console.error('[PaymentBridge] Unexpected payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected payment error',
        errorCode: 'SYSTEM_ERROR',
      };
    }
  }

  /**
   * Create a transaction record in the database
   * Call this after successful payment processing
   */
  async createTransactionRecord(input: CreateTransactionInput): Promise<Transaction | null> {
    try {
      const transaction = await dataService.transactions.create(input);
      console.log('[PaymentBridge] Transaction record created:', transaction.id);

      addBreadcrumb({
        category: 'payment',
        message: 'Transaction record created',
        level: 'info',
        data: {
          transactionId: transaction.id,
          ticketId: input.ticketId,
          paymentMethod: input.paymentMethod,
        },
      });

      return transaction;
    } catch (error) {
      // Capture to Sentry - this is critical as payment succeeded but record failed
      captureException(error, {
        tags: {
          module: 'payment',
          operation: 'createTransactionRecord',
        },
        extra: {
          ticketId: input.ticketId,
          paymentMethod: input.paymentMethod,
          subtotal: input.subtotal,
        },
        level: 'error',
      });

      console.error('[PaymentBridge] Failed to create transaction record:', error);
      return null;
    }
  }

  /**
   * Process payment and create transaction record in one call
   * This is the convenience method for most use cases
   */
  async processAndRecord(params: {
    // Payment info
    paymentMethod: PaymentMethod;
    amount: number;
    tendered?: number;
    // Ticket info
    ticketId: string;
    ticketNumber: number;
    clientId?: string;
    clientName: string;
    // Financial breakdown
    subtotal: number;
    tax: number;
    tip: number;
    discount?: number;
    // Service details
    services?: Array<{
      name: string;
      price: number;
      staffName?: string;
    }>;
    // Staff info
    processedBy?: string;
    notes?: string;
  }): Promise<{
    paymentResult: PaymentResult;
    transaction: Transaction | null;
  }> {
    // 1. Process the payment
    const paymentResult = await this.processPayment({
      amount: params.amount,
      method: params.paymentMethod === 'other' ? 'custom' : params.paymentMethod as any,
      tendered: params.tendered,
      ticketId: params.ticketId,
      clientId: params.clientId,
    });

    // 2. If successful, create transaction record
    let transaction: Transaction | null = null;

    if (paymentResult.success) {
      // Build payment details
      const paymentDetails: PaymentDetails = {};

      if (params.paymentMethod === 'card') {
        paymentDetails.authCode = paymentResult.authCode;
        paymentDetails.transactionId = paymentResult.transactionId;
      } else if (params.paymentMethod === 'cash') {
        paymentDetails.amountTendered = params.tendered;
        paymentDetails.changeDue = paymentResult.changeToReturn;
      }

      const input: CreateTransactionInput = {
        ticketId: params.ticketId,
        ticketNumber: params.ticketNumber,
        clientId: params.clientId,
        clientName: params.clientName,
        subtotal: params.subtotal,
        tax: params.tax,
        tip: params.tip,
        discount: params.discount || 0,
        paymentMethod: params.paymentMethod,
        paymentDetails,
        services: params.services,
        processedBy: params.processedBy,
        notes: params.notes,
      };

      transaction = await this.createTransactionRecord(input);
    }

    return {
      paymentResult,
      transaction,
    };
  }

  /**
   * Void a transaction
   */
  async voidTransaction(transactionId: string): Promise<PaymentResult> {
    return this.provider.voidTransaction(transactionId);
  }
}

// Singleton instance
export const paymentBridge = new PaymentBridge();
