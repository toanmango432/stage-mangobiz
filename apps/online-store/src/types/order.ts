import { CartItem } from './cart';

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface PaymentMethod {
  cardHolderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardType?: 'visa' | 'mastercard' | 'amex' | 'discover';
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
  paymentMethod: {
    type: string;
    last4: string;
  };
  promoCode?: string;
  pickupLocation?: string;
  pickupTime?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface CheckoutFormData {
  email: string;
  phone: string;
  createAccount: boolean;
  newsletter: boolean;
  shippingType: 'shipping' | 'pickup';
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
  sameAsBilling: boolean;
  pickupLocation?: string;
  pickupTime?: string;
  paymentMethod?: PaymentMethod;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}
