// Checkout-related types for the payment flow

// Payment method for checkout
export interface CheckoutPaymentMethod {
  type: 'card' | 'cash' | 'gift_card' | 'custom';
  amount: number;
  customName?: string;
  tendered?: number; // For cash - amount given by customer
}

// Tip distribution by staff member
export interface TipDistribution {
  staffId: string;
  staffName: string;
  amount: number;
}

// Coupon data
export interface CouponData {
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  description: string;
}

// Gift card data
export interface GiftCardData {
  code: string;
  balance: number;
  amountUsed: number;
}

// Complete checkout result
export interface CheckoutResult {
  methods: CheckoutPaymentMethod[];
  tip: number;
  tipDistribution?: TipDistribution[];
  coupon?: CouponData;
  giftCards?: GiftCardData[];
}

// Checkout step for multi-step flow
export type CheckoutStep = 1 | 2 | 3;

// Step configuration
export interface StepConfig {
  id: number;
  label: string;
  sublabel: string;
}

export const CHECKOUT_STEPS: StepConfig[] = [
  { id: 1, label: 'Add Tip', sublabel: 'optional' },
  { id: 2, label: 'Payment', sublabel: 'required' },
  { id: 3, label: 'Complete', sublabel: 'final' },
];

export const TIP_PERCENTAGES = [15, 18, 20, 25];
