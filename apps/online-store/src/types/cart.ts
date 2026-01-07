export interface CartItem {
  id: string;
  type: 'product' | 'service' | 'membership' | 'gift-card';
  name: string;
  price: number;
  image?: string;
  quantity?: number;
  
  // Product-specific
  sku?: string;
  inStock?: boolean;
  
  // Service-specific
  serviceDetails?: {
    date: string;
    time: string;
    duration: number;
    staff?: string;
    addOns?: Array<{ name: string; price: number }>;
  };
  
  // Gift Card-specific
  giftCardDetails?: {
    recipientName: string;
    recipientEmail: string;
    message?: string;
    design?: string;
  };
  
  // Membership-specific
  membershipDetails?: {
    billingCycle: 'monthly' | 'quarterly' | 'yearly';
    startDate?: string;
  };
}

export interface PromoCode {
  code: string;
  type: 'percent' | 'fixed' | 'shipping';
  value: number;
  minPurchase: number;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}
