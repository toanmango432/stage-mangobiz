import { ApiResponse, CheckoutError } from '@/types/api';
import { Order } from '@/types/order';
import { CartItem } from '@/types/cart';

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Placeholder API endpoints matching Mango v1 spec
export const checkoutApi = {
  async createCart(items: CartItem[]): Promise<ApiResponse<{ cartId: string }>> {
    await delay(500);
    return {
      success: true,
      data: { cartId: `cart-${Date.now()}` }
    };
  },

  async addToCart(cartId: string, item: CartItem): Promise<ApiResponse<void>> {
    await delay(300);
    return { success: true };
  },

  async initiateCheckout(cartId: string): Promise<ApiResponse<{ checkoutId: string }>> {
    await delay(800);
    
    // Simulate random errors for testing (10% chance)
    if (Math.random() < 0.1) {
      const errorTypes: CheckoutError['type'][] = ['slot_conflict', 'stock_changed', 'payment_failed'];
      const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      
      const checkoutError: CheckoutError = {
        code: randomError === 'payment_failed' ? 'PAYMENT_REQUIRED' : 'CONFLICT',
        message: getErrorMessage(randomError),
        type: randomError,
        affectedItems: randomError === 'stock_changed' ? ['item-1'] : undefined,
        suggestions: getErrorSuggestions(randomError)
      };
      
      return {
        success: false,
        error: checkoutError
      };
    }

    return {
      success: true,
      data: { checkoutId: `checkout-${Date.now()}` }
    };
  },

  async createPaymentIntent(amount: number): Promise<ApiResponse<{ clientSecret: string }>> {
    await delay(1000);
    
    // Simulate payment failure (5% chance)
    if (Math.random() < 0.05) {
      const paymentError: CheckoutError = {
        code: 'PAYMENT_REQUIRED',
        message: 'Payment declined. Please try a different payment method.',
        type: 'payment_failed',
        suggestions: ['Try a different card', 'Contact your bank', 'Use a different payment method']
      };
      
      return {
        success: false,
        error: paymentError
      };
    }

    return {
      success: true,
      data: { clientSecret: `pi_${Date.now()}_secret` }
    };
  },

  async createOrder(order: Omit<Order, 'id' | 'orderNumber'>): Promise<ApiResponse<Order>> {
    await delay(1500);
    
    // Simulate success
    const finalOrder: Order = {
      ...order,
      id: Date.now().toString(),
      orderNumber: generateOrderNumber()
    };

    return {
      success: true,
      data: finalOrder
    };
  }
};

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}-${random}`;
}

function getErrorMessage(type: CheckoutError['type']): string {
  switch (type) {
    case 'slot_conflict':
      return 'The selected appointment time is no longer available. Please choose a different time.';
    case 'stock_changed':
      return 'Some items in your cart have changed. Please review the updates.';
    case 'payment_failed':
      return 'Payment could not be processed. Please check your payment details.';
    case 'validation_error':
      return 'Please check your information and try again.';
  }
}

function getErrorSuggestions(type: CheckoutError['type']): string[] {
  switch (type) {
    case 'slot_conflict':
      return ['Choose a different time', 'Select a different service provider', 'Try a different date'];
    case 'stock_changed':
      return ['Accept the changes', 'Remove unavailable items', 'Update quantities'];
    case 'payment_failed':
      return ['Try a different card', 'Check card details', 'Contact your bank'];
    case 'validation_error':
      return ['Review your information', 'Check required fields', 'Verify contact details'];
  }
}
