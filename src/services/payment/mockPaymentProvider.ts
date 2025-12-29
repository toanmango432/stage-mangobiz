/**
 * Mock Payment Provider
 * Simulates payment processing for web development/testing
 * In production, this will be replaced by Fiserv CommerceHub TTP
 */

import { PaymentProvider, PaymentRequest, PaymentResult } from './types';

/** Generate a mock transaction ID */
const generateTransactionId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `MOCK-${timestamp}-${random}`.toUpperCase();
};

/** Generate a mock auth code */
const generateAuthCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/** Simulate processing delay (1.5-2.5 seconds) */
const simulateProcessingDelay = (): Promise<void> => {
  const delay = 1500 + Math.random() * 1000;
  return new Promise(resolve => setTimeout(resolve, delay));
};

export class MockPaymentProvider implements PaymentProvider {
  name = 'Mock Payment Provider';

  /** Configurable failure rate for testing (0 = never fail, 1 = always fail) */
  private failureRate: number;

  constructor(failureRate = 0) {
    this.failureRate = failureRate;
  }

  /** Simulate random failure for testing */
  private shouldFail(): boolean {
    return Math.random() < this.failureRate;
  }

  async processCardPayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log('[MockPayment] Processing card payment:', request.amount);

    await simulateProcessingDelay();

    if (this.shouldFail()) {
      return {
        success: false,
        error: 'Card declined - Insufficient funds',
        errorCode: 'INSUFFICIENT_FUNDS',
      };
    }

    const transactionId = generateTransactionId();
    const authCode = generateAuthCode();

    return {
      success: true,
      transactionId,
      authCode,
      amountProcessed: request.amount,
      timestamp: new Date().toISOString(),
    };
  }

  async processCashPayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log('[MockPayment] Processing cash payment:', request.amount, 'tendered:', request.tendered);

    // Cash is instant - minimal delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const tendered = request.tendered || request.amount;
    const changeToReturn = Math.max(0, tendered - request.amount);

    return {
      success: true,
      transactionId: generateTransactionId(),
      amountProcessed: request.amount,
      changeToReturn,
      timestamp: new Date().toISOString(),
    };
  }

  async processGiftCardPayment(request: PaymentRequest, _giftCardCode?: string): Promise<PaymentResult> {
    console.log('[MockPayment] Processing gift card payment:', request.amount);

    await simulateProcessingDelay();

    if (this.shouldFail()) {
      return {
        success: false,
        error: 'Gift card has insufficient balance',
        errorCode: 'INSUFFICIENT_FUNDS',
      };
    }

    return {
      success: true,
      transactionId: generateTransactionId(),
      authCode: generateAuthCode(),
      amountProcessed: request.amount,
      timestamp: new Date().toISOString(),
    };
  }

  async processCustomPayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log('[MockPayment] Processing custom payment:', request.customName, request.amount);

    // Custom payments (Venmo, Check, etc.) are instant on our end
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      success: true,
      transactionId: generateTransactionId(),
      amountProcessed: request.amount,
      timestamp: new Date().toISOString(),
    };
  }

  async voidTransaction(transactionId: string): Promise<PaymentResult> {
    console.log('[MockPayment] Voiding transaction:', transactionId);

    await simulateProcessingDelay();

    if (this.shouldFail()) {
      return {
        success: false,
        error: 'Unable to void transaction - already settled',
        errorCode: 'PROCESSING_ERROR',
      };
    }

    return {
      success: true,
      transactionId,
      timestamp: new Date().toISOString(),
    };
  }

  async isAvailable(): Promise<boolean> {
    // Mock provider is always available
    return true;
  }
}

// Default instance with 0% failure rate
export const mockPaymentProvider = new MockPaymentProvider(0);

// Test instance with 20% failure rate for testing error handling
export const mockPaymentProviderWithFailures = new MockPaymentProvider(0.2);
